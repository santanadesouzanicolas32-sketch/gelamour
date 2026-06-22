import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE = 'https://www.asaas.com/api/v3'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('GELAMOUR_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Cliente fixo da Gelamour (CNPJ 34.695.853/0001-07) — reutilizado em todos os pedidos
const GELAMOUR_CUSTOMER_ID = 'cus_000183170011'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { pedido_id, total, nome, billing_type } = await req.json()
    const tipo: string = billing_type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    if (!pedido_id || !total || !nome) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Cria cobrança Pix usando o cliente fixo da Gelamour
    const payResp = await fetch(`${ASAAS_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
      body: JSON.stringify({
        customer: GELAMOUR_CUSTOMER_ID,
        billingType: tipo,
        value: total,
        dueDate,
        description: `Pedido Gelamour #${pedido_id} — ${nome}`,
        externalReference: String(pedido_id),
        notificationDisabled: true,
      }),
    })
    const charge = await payResp.json()

    if (charge.errors && charge.errors.length > 0) {
      const msg = charge.errors.map((e: { description: string }) => e.description).join('. ')
      throw new Error(msg)
    }
    if (!charge.id) throw new Error('Falha ao criar cobrança: ' + JSON.stringify(charge))

    // Salva payment_id no pedido
    await patchPedido(pedido_id, {
      asaas_payment_id: charge.id,
      status_pagamento: 'aguardando_pix',
    })

    // Busca QR Code Pix
    const pixResp = await fetch(`${ASAAS_BASE}/payments/${charge.id}/pixQrCode`, {
      headers: { 'access_token': ASAAS_API_KEY },
    })
    const pixData = await pixResp.json()

    return new Response(JSON.stringify({
      tipo: 'PIX',
      payment_id: charge.id,
      qr_code: pixData.payload,
      qr_code_image: pixData.encodedImage,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    console.error('criar-pix error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

async function patchPedido(id: number, data: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  })
}
