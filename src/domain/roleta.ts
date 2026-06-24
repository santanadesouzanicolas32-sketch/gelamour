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

export class RoletaDomain {
  static calcularAngulo(indice: number, total: number): number {
    const segAngle = 360 / total;
    return segAngle * indice + segAngle / 2;
  }

  static getSemanaAtual(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  static podeContinuar(participacao: ParticipacaoProps | null): boolean {
    if (!participacao) return false;
    if (participacao.ja_girou) return false;
    if (participacao.status !== 'aprovado') return false;
    if (participacao.data_aprovacao) {
      const hoje = new Date().toISOString().split('T')[0];
      const diaAprovacao = participacao.data_aprovacao.split('T')[0];
      if (diaAprovacao !== hoje) return false;
    }
    return true;
  }
}
