export interface PremioInfo {
  readonly indice: number;
  readonly premio: string;
  readonly consolacao: boolean;
}

export type StatusParticipacao = 'pendente' | 'aprovado' | 'rejeitado';

export interface ParticipacaoProps {
  id: number;
  telefone: string;
  nome?: string;
  status: StatusParticipacao;
  instagram?: string;
  ja_girou: boolean;
  premio?: string;
  semana?: string;
  data_aprovacao?: string;
  created_at: string;
}

