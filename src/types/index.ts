// Tipos de domínio compartilhados — fonte da verdade

export interface Cliente {
  id: number | undefined;
  nome: string;
  telefone: string;
  endereco?: string;
}

export interface ItemCarrinho {
  nome: string;
  preco: number;
}

export interface Pedido {
  id?: number;
  nome: string;
  telefone: string;
  endereco: string;
  pagamento: string;
  itens: ItemCarrinho[];
  total: number;
  status: 'pendente' | 'confirmado' | 'cancelado';
  observacao?: string;
  cliente_id?: number;
}

export interface RoletaConfig {
  id: number;
  ativa: boolean;
  premios: string[];
  max_vencedores_semana: number;
}

export interface Participacao {
  id: number;
  telefone: string;
  nome?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  instagram?: string;
  foto_url?: string;
  data_aprovacao?: string;
  ja_girou: boolean;
  premio?: string;
  semana?: string;
  cliente_id?: number;
  created_at: string;
}

export interface Vencedor {
  id: number;
  telefone: string;
  nome?: string;
  premio: string;
  semana: string;
  created_at: string;
}

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  disponivel: boolean;
}

export type ToastTipo = 'erro' | 'ok' | 'info';
