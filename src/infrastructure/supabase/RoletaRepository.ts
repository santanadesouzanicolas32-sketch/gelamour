import type { IRoletaRepository } from '../../repositories/IRoletaRepository';
import type { ParticipacaoProps } from '../../domain/roleta';
import { tryAsync, type Result } from '../../core/result';
import { supabaseGet, supabasePost } from './client';
import { logger } from '../../core/logger';

const log = logger.child('RoletaRepo');

export class RoletaRepository implements IRoletaRepository {
  async findParticipacaoAtiva(
    telefone: string,
    semana: string
  ): Promise<Result<ParticipacaoProps | null>> {
    return tryAsync(async () => {
      log.debug('findParticipacaoAtiva', { semana });
      const rows = await supabaseGet<ParticipacaoProps>(
        'roleta_participacoes',
        `telefone=eq.${telefone}&semana=eq.${semana}&order=created_at.desc&limit=1`
      );
      return rows[0] ?? null;
    });
  }

  async saveParticipacao(
    data: Partial<ParticipacaoProps>
  ): Promise<Result<ParticipacaoProps>> {
    return tryAsync(() =>
      supabasePost<ParticipacaoProps>('roleta_participacoes', data)
    );
  }

  async countVencedoresSemana(semana: string): Promise<Result<number>> {
    return tryAsync(async () => {
      const rows = await supabaseGet<{ id: number }>(
        'roleta_vencedores',
        `semana=eq.${semana}&select=id`
      );
      return rows.length;
    });
  }

  async saveVencedor(
    telefone: string,
    nome: string,
    premio: string,
    semana: string
  ): Promise<Result<void>> {
    return tryAsync(async () => {
      await supabasePost('roleta_vencedores', { telefone, nome, premio, semana });
    });
  }
}
