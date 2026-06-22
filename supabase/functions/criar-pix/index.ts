import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE = 'https://www.asaas.com/api/v3'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { pedido_id, total, nome, billing_type, card_data } = await req.json()
    const tipo: string = billing_type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'

    if (!pedido_id || !total || !nome) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 1. Criar cliente no Asaas
    const custResp = await fetch(`${ASAAS_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
      body: JSON.stringify({ name: nome }),
    })
    const customer = await custResp.json()
    if (!customer.id) throw new Error('Falha ao criar cliente: ' + JSON.stringify(customer))

    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (tipo === 'PIX') {
      // ── Pix: cria cobrança e retorna QR Code ──
      const payResp = await fetch(`${ASAAS_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'PIX',
          value: total,
          dueDate,
          description: `Pedido Gelamour #${pedido_id}`,
          externalReference: String(pedido_id),
        }),
      })
      const charge = await payResp.json()
      if (!charge.id) throw new Error('Falha ao criar cobrança Pix: ' + JSON.stringify(charge))

      const pixResp = await fetch(`${ASAAS_BASE}/payments/${charge.id}/pixQrCode`, {
        headers: { 'access_token': ASAAS_API_KEY },
      })
      const pixData = await pixResp.json()

      await patchPedido(pedido_id, { asaas_payment_id: charge.id, status_pagamento: 'aguardando_pix' })

      return new Response(JSON.stringify({
        tipo: 'PIX',
        payment_id: charge.id,
        qr_code: pixData.payload,
        qr_code_image: pixData.encodedImage,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

    } else {
      // ── Cartão: cobra com dados inline ──
      if (!card_data) {
        return new Response(JSON.stringify({ error: 'Dados do cartão não informados' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }

      const payBody: Record<string, unknown> = {
        customer: customer.id,
        billingType: 'CREDIT_CARD',
        value: total,
        dueDate,
        description: `Pedido Gelamour #${pedido_id}`,
        externalReference: String(pedido_id),
        creditCard: {
          holderName: card_data.holderName,
          number: card_data.number,
          expiryMonth: card_data.expiryMonth,
          expiryYear: card_data.expiryYear,
          ccv: card_data.ccv,
        },
        creditCardHolderInfo: {
          name: card_data.holderName,
          cpfCnpj: card_data.cpfCnpj,
          postalCode: card_data.postalCode,
          addressNumber: 'S/N',
          email: 'pedido@gelamour.com.br',
          phone: '11940772750',
        },
      }

      const payResp = await fetch(`${ASAAS_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify(payBody),
      })
      const charge = await payResp.json()

      if (charge.errors && charge.errors.length > 0) {
        const msg = charge.errors.map((e: { description: string }) => e.description).join('. ')
        return new Response(JSON.stringify({ error: msg }), {
          status: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
      if (!charge.id) throw new Error('Falha ao criar cobrança: ' + JSON.stringify(charge))

      const statusPag = (charge.status === 'CONFIRMED' || charge.status === 'RECEIVED')
        ? 'pago' : 'aguardando_cartao'

      await patchPedido(pedido_id, {
        asaas_payment_id: charge.id,
        status_pagamento: statusPag,
        status: statusPag === 'pago' ? 'confirmado' : 'aguardando',
      })

      return new Response(JSON.stringify({
        tipo: 'CREDIT_CARD',
        payment_id: charge.id,
        status: charge.status,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

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
