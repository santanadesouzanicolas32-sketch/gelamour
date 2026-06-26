import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ASAAS_API_KEY        = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE           = 'https://www.asaas.com/api/v3'
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('GELAMOUR_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Cliente fixo da Gelamour (CNPJ 34.695.853/0001-07)
const GELAMOUR_CUSTOMER_ID = 'cus_000183170011'

const ALLOWED_ORIGINS = [
  'https://santanadesouzanicolas32-sketch.github.io',
  'http://localhost',
  'http://127.0.0.1',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))
    ? origin
    : ALLOWED_ORIGINS[0]!
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

const json = (data: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })

  try {
    const body = await req.json()
    const { pedido_id, total, nome, billing_type } = body
    const tipo: string = billing_type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    // ── Validação de entrada ──────────────────────────────────────────
    if (!pedido_id || total == null || !nome) {
      return json({ error: 'Dados incompletos' }, 400, origin)
    }
    const totalNum = Number(total)
    if (!isFinite(totalNum) || totalNum <= 0 || totalNum > 9_999) {
      return json({ error: 'Valor inválido' }, 400, origin)
    }

    // ── Verificar pedido no banco (anti-fraude: valor real do banco) ──
    const pedidoResp = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedido_id}&select=id,total,status_pagamento`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    )
    if (!pedidoResp.ok) {
      console.error('Supabase GET pedido falhou:', pedidoResp.status)
      return json({ error: 'Erro ao verificar pedido' }, 500, origin)
    }
    const pedidos = await pedidoResp.json() as Array<{ id: number; total: number; status_pagamento: string }>
    if (!pedidos.length) return json({ error: 'Pedido não encontrado' }, 404, origin)

    const pedido = pedidos[0]!

    // Pedido já pago — não criar nova cobrança
    if (pedido.status_pagamento === 'pago') {
      return json({ error: 'Este pedido já foi pago' }, 409, origin)
    }

    // Valor enviado pelo cliente deve bater com o do banco (em centavos)
    const totalDB     = Math.round(Number(pedido.total) * 100)
    const totalClient = Math.round(totalNum * 100)
    if (totalDB !== totalClient) {
      console.error(`Fraude detectada — valor divergente: cliente=${totalClient} banco=${totalDB} pedido=${pedido_id}`)
      return json({ error: 'Valor não corresponde ao pedido registrado' }, 422, origin)
    }

    // ── Criar cobrança na Asaas ───────────────────────────────────────
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const payResp = await fetch(`${ASAAS_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
      body: JSON.stringify({
        customer: GELAMOUR_CUSTOMER_ID,
        billingType: tipo,
        value: totalNum,
        dueDate,
        description: `Pedido Gelamour #${pedido_id} — ${nome}`,
        externalReference: String(pedido_id),
        notificationDisabled: true,
      }),
    })
    const charge = await payResp.json() as { id?: string; errors?: Array<{ description: string }> }

    if (charge.errors && charge.errors.length > 0) {
      const msg = charge.errors.map(e => e.description).join('. ')
      throw new Error(msg)
    }
    if (!charge.id) throw new Error('Falha ao criar cobrança: ' + JSON.stringify(charge))

    // Marca o pedido como aguardando pagamento
    await patchPedido(pedido_id, {
      asaas_payment_id: charge.id,
      status_pagamento: 'aguardando',
    })

    // ── Buscar QR Code Pix com retry (3 tentativas, 1.5s entre cada) ─
    let pixData: { payload?: string; encodedImage?: string } = {}

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt > 1) await sleep(1500)

      const pixResp = await fetch(`${ASAAS_BASE}/payments/${charge.id}/pixQrCode`, {
        headers: { 'access_token': ASAAS_API_KEY },
      })

      if (pixResp.ok) {
        const d = await pixResp.json() as { payload?: string; encodedImage?: string }
        if (d.payload) {
          pixData = d
          break
        }
      }
      console.warn(`pixQrCode tentativa ${attempt}/3 sem payload`)
    }

    if (!pixData.payload) {
      return json({
        error: 'QR Code Pix temporariamente indisponível. Tente novamente em alguns instantes ou use outra forma de pagamento.',
        payment_id: charge.id,
      }, 503, origin)
    }

    return json({
      tipo: 'PIX',
      payment_id: charge.id,
      qr_code: pixData.payload,
      qr_code_image: pixData.encodedImage ?? null,
    }, 200, origin)

  } catch (e) {
    console.error('criar-pix error:', e)
    return json({ error: e instanceof Error ? e.message : String(e) }, 500, origin)
  }
})

async function patchPedido(id: number, data: Record<string, unknown>): Promise<void> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  })
  if (!resp.ok) {
    const body = await resp.text()
    console.error('patchPedido falhou:', resp.status, body)
  }
}
