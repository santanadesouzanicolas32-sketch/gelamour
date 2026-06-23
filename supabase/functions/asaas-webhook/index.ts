import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('GELAMOUR_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE = 'https://www.asaas.com/api/v3'

serve(async (req) => {
  try {
    const body = await req.json()
    const { event, payment } = body

    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return new Response('ignored', { status: 200 })
    }

    const pedidoId = payment?.externalReference
    const paymentId = payment?.id

    if (!pedidoId || !paymentId) {
      return new Response('missing fields', { status: 200 })
    }

    // Verifica na API da Asaas se o pagamento realmente existe e está confirmado
    const verifyResp = await fetch(`${ASAAS_BASE}/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    })

    if (!verifyResp.ok) {
      console.error('Asaas verify failed:', verifyResp.status)
      return new Response('verification failed', { status: 200 })
    }

    const verified = await verifyResp.json()

    // Garante que o status na Asaas é de fato recebido/confirmado
    if (verified.status !== 'RECEIVED' && verified.status !== 'CONFIRMED') {
      console.warn('Payment not confirmed in Asaas, status:', verified.status)
      return new Response('not confirmed', { status: 200 })
    }

    // Garante que o pedido_id bate com o registrado na Asaas
    if (String(verified.externalReference) !== String(pedidoId)) {
      console.error('externalReference mismatch — possível tentativa de fraude')
      return new Response('mismatch', { status: 200 })
    }

    await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedidoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status_pagamento: 'pago', status: 'confirmado' }),
    })

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('webhook error:', e)
    return new Response('error', { status: 500 })
  }
})
