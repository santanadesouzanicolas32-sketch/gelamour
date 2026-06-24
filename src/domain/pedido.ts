import { ValidationError } from '../core/errors';

export interface ItemPedido {
  readonly nome: string;
  readonly preco: number;
}

export type StatusPedido = 'pendente' | 'confirmado' | 'cancelado';
export type StatusPagamento = 'aguardando' | 'pago' | 'falhou';
export type TipoPagamento = 'Pix' | 'Dinheiro' | 'Cartão';

export interface PedidoProps {
  id?: number;
  nome: string;
  telefone: string;
  endereco: string;
  pagamento: TipoPagamento;
  itens: ItemPedido[];
  total: number;
  status: StatusPedido;
  status_pagamento?: StatusPagamento;
  observacao?: string;
  asaas_payment_id?: string;
  cliente_id?: number;
}

export class Pedido {
  private constructor(private readonly props: PedidoProps) {}

  static create(props: Omit<PedidoProps, 'status' | 'total'>): Pedido {
    if (!props.itens.length) throw new ValidationError('Pedido deve ter ao menos 1 item');
    if (!props.nome.trim()) throw new ValidationError('Nome obrigatório');
    if (!props.endereco.trim()) throw new ValidationError('Endereço obrigatório');
    const total = props.itens.reduce((s, i) => Math.round((s + i.preco) * 100) / 100, 0);
    return new Pedido({ ...props, total, status: 'pendente' });
  }

  static fromDB(raw: PedidoProps): Pedido { return new Pedido(raw); }

  get id(): number | undefined { return this.props.id; }
  get total(): number { return this.props.total; }
  get itens(): readonly ItemPedido[] { return this.props.itens; }
  get pagamento(): TipoPagamento { return this.props.pagamento; }
  get statusPagamento(): StatusPagamento | undefined { return this.props.status_pagamento; }

  formatarMensagemWA(waNumber: string): string {
    const itensStr = this.props.itens.map(i =>
      `▸ ${i.nome} — R$ ${i.preco.toFixed(2).replace('.', ',')}`
    ).join('\n');
    const msg = [
      '🛍️ *NOVO PEDIDO — GELAMOUR*',
      '',
      itensStr,
      '',
      `*Total: R$ ${this.props.total.toFixed(2).replace('.', ',')}*`,
      `*Pagamento: ${this.props.pagamento}*`,
      '',
      `👤 ${this.props.nome}`,
      `📍 ${this.props.endereco}`,
      this.props.observacao ? `📝 ${this.props.observacao}` : '',
    ].filter(Boolean).join('\n');
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  }

  toJSON(): PedidoProps { return { ...this.props }; }
}
