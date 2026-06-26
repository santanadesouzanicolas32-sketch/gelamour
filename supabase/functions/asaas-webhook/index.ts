import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('GELAMOUR_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ASAAS_API_KEY        = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE           = 'https://www.asaas.com/api/v3'

serve(async (req) => {
  try {
    const body = await req.json()
    const { event, payment } = body

    // Só processa eventos de pagamento confirmado
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return new Response('ignored', { status: 200 })
    }

    const pedidoId  = payment?.externalReference
    const paymentId = payment?.id

    if (!pedidoId || !paymentId) {
      return new Response('missing fields', { status: 200 })
    }

    // ── Re-verificar pagamento diretamente na Asaas (anti-replay) ────
    const verifyResp = await fetch(`${ASAAS_BASE}/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    })

    if (!verifyResp.ok) {
      console.error('Asaas verify falhou:', verifyResp.status)
      return new Response('verification failed', { status: 200 })
    }

    const verified = await verifyResp.json() as {
      id: string
      status: string
      externalReference: string
      value: number
      billingType: string
    }

    // Status deve ser RECEIVED ou CONFIRMED
    if (verified.status !== 'RECEIVED' && verified.status !== 'CONFIRMED') {
      console.warn('Pagamento não confirmado na Asaas, status:', verified.status)
      return new Response('not confirmed', { status: 200 })
    }

    // externalReference (pedido_id) deve bater com o enviado no webhook
    if (String(verified.externalReference) !== String(pedidoId)) {
      console.error('FRAUDE: externalReference diverge — webhook:', pedidoId, 'Asaas:', verified.externalReference)
      return new Response('mismatch', { status: 200 })
    }

    // ── Buscar pedido no banco para validar valor ─────────────────────
    const pedidoResp = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedidoId}&select=id,total,status_pagamento`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    )

    if (pedidoResp.ok) {
      const pedidos = await pedidoResp.json() as Array<{ id: number; total: number; status_pagamento: string }>
      const pedido = pedidos[0]

      if (!pedido) {
        console.error('FRAUDE: pedido_id não encontrado no banco:', pedidoId)
        return new Response('pedido not found', { status: 200 })
      }

      // Pedido já pago — idempotência
      if (pedido.status_pagamento === 'pago') {
        console.warn('Webhook recebido para pedido já pago:', pedidoId)
        return new Response('already paid', { status: 200 })
      }

      // Valor pago deve corresponder ao total do pedido (tolerância de R$0,01)
      const totalDB   = Math.round(Number(pedido.total) * 100)
      const totalPago = Math.round(Number(verified.value) * 100)
      if (Math.abs(totalDB - totalPago) > 1) {
        console.error(`FRAUDE: valor divergente — banco=${totalDB} asaas=${totalPago} pedido=${pedidoId}`)
        return new Response('value mismatch', { status: 200 })
      }
    }

    // ── Confirmar pedido no banco ─────────────────────────────────────
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

    console.log(`Pedido #${pedidoId} confirmado — payment ${paymentId}`)
    return new Response('ok', { status: 200 })

  } catch (e) {
    console.error('webhook error:', e)
    return new Response('error', { status: 500 })
  }
})
