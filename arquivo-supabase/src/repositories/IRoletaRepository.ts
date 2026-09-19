import type { ParticipacaoProps } from '../domain/roleta';
import type { Result } from '../core/result';

export interface IRoletaRepository {
  findParticipacaoAtiva(telefone: string, semana: string): Promise<Result<ParticipacaoProps | null>>;
  saveParticipacao(data: Partial<ParticipacaoProps>): Promise<Result<ParticipacaoProps>>;
  countVencedoresSemana(semana: string): Promise<Result<number>>;
  saveVencedor(telefone: string, nome: string, premio: string, semana: string): Promise<Result<void>>;
}
