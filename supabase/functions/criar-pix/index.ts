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
    const { pedido_id, total, nome } = await req.json()

    if (!pedido_id || !total || !nome) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 1. Criar cliente no Asaas (nome é o único campo obrigatório)
    const custResp = await fetch(`${ASAAS_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
      body: JSON.stringify({ name: nome }),
    })
    const customer = await custResp.json()
    if (!customer.id) {
      throw new Error('Falha ao criar cliente Asaas: ' + JSON.stringify(customer))
    }

    // 2. Criar cobrança Pix
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
    if (!charge.id) {
      throw new Error('Falha ao criar cobrança: ' + JSON.stringify(charge))
    }

    // 3. Buscar QR Code Pix
    const pixResp = await fetch(`${ASAAS_BASE}/payments/${charge.id}/pixQrCode`, {
      headers: { 'access_token': ASAAS_API_KEY },
    })
    const pixData = await pixResp.json()

    // 4. Salvar payment_id no pedido
    await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedido_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ asaas_payment_id: charge.id, status_pagamento: 'aguardando_pix' }),
    })

    return new Response(JSON.stringify({
      payment_id: charge.id,
      qr_code: pixData.payload,
      qr_code_image: pixData.encodedImage,
      invoice_url: charge.invoiceUrl,
      value: total,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('criar-pix error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
