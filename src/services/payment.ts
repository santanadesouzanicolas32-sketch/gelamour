import { callEdgeFunction, dbGet } from './supabase';
import type { ItemCarrinho } from '../types';

export interface PixResponse {
  success: boolean;
  qrCode?: string;
  pixCopiaECola?: string;
  asaasPaymentId?: string;
  pedidoId?: number;
  error?: string;
}

export interface CartaoResponse {
  success: boolean;
  status?: string;
  error?: string;
}

export async function criarPagamentoPix(params: {
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  itens: ItemCarrinho[];
  total: number;
  observacao: string;
  clienteId: number;
}): Promise<PixResponse> {
  return callEdgeFunction<PixResponse>('criar-pix', {
    billing_type: 'PIX',
    customer_name: params.nome,
    customer_cpf: params.cpf,
    customer_phone: params.telefone,
    address: params.endereco,
    itens: params.itens,
    value: params.total,
    observacao: params.observacao,
    cliente_id: params.clienteId,
  });
}

export async function verificarStatusPagamento(pedidoId: number): Promise<string> {
  const rows = await dbGet<{ status_pagamento: string }>('pedidos', `id=eq.${pedidoId}&select=status_pagamento`);
  return rows[0]?.status_pagamento ?? 'aguardando';
}
