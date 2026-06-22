import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const body = await req.json()
    const { event, payment } = body

    // Só processa pagamento confirmado/recebido
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return new Response('ignored', { status: 200 })
    }

    const pedidoId = payment?.externalReference
    if (!pedidoId) {
      return new Response('no externalReference', { status: 200 })
    }

    // Atualiza pedido: pago e confirmado
    await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedidoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status_pagamento: 'pago',
        status: 'confirmado',
      }),
    })

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('webhook error:', e)
    return new Response('error', { status: 500 })
  }
})
