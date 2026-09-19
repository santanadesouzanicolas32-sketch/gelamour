// Tipos de domínio compartilhados

export interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  endereco?: string;
}

export interface ItemCarrinho {
  nome: string;
  preco: number;
}
