import type { IClienteRepository } from '../../repositories/IClienteRepository';
import { Cliente } from '../../domain/cliente';
import { tryAsync, type Result } from '../../core/result';
import { supabaseGet, supabasePost, supabasePatch } from './client';
import { logger } from '../../core/logger';

const log = logger.child('ClienteRepo');

export class ClienteRepository implements IClienteRepository {
  async findByTelefone(telefone: string): Promise<Result<Cliente | null>> {
    return tryAsync(async () => {
      log.debug('findByTelefone', { telefone: `***${telefone.slice(-4)}` });
      const rows = await supabaseGet<ReturnType<Cliente['toJSON']>>(
        'clientes',
        `telefone=eq.${telefone}&limit=1`
      );
      return rows[0] ? Cliente.fromDB(rows[0]) : null;
    });
  }

  async save(cliente: Cliente): Promise<Result<Cliente>> {
    return tryAsync(async () => {
      const row = await supabasePost<ReturnType<Cliente['toJSON']>>(
        'clientes',
        cliente.toJSON()
      );
      return Cliente.fromDB(row);
    });
  }

  async updateEndereco(id: number, endereco: string): Promise<Result<void>> {
    return tryAsync(async () => {
      await supabasePatch('clientes', `id=eq.${id}`, { endereco });
    });
  }
}
