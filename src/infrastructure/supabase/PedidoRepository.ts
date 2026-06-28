import type { IPedidoRepository } from '../../repositories/IPedidoRepository';
import { Pedido } from '../../domain/pedido';
import type { PedidoProps } from '../../domain/pedido';
import { tryAsync, type Result } from '../../core/result';
import { supabaseFetch, supabasePatch } from './client';
import { NetworkError } from '../../core/errors';
import { logger } from '../../core/logger';

const log = logger.child('PedidoRepo');

export class PedidoRepository implements IPedidoRepository {
  async save(pedido: Pedido): Promise<Result<Pedido>> {
    return tryAsync(async () => {
      log.info('Salvando pedido', { total: pedido.total });
      // Usa headers-only para obter o ID via Location
      const resp = await supabaseFetch(`/rest/v1/pedidos`, {
        method: 'POST',
        headers: { 'Prefer': 'return=headers-only' } as Record<string, string>,
        body: JSON.stringify(pedido.toJSON()),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new NetworkError(`POST pedidos falhou`, { status: resp.status, body });
      }
      const loc = resp.headers.get('Location') ?? '';
      const idMatch = loc.match(/id=eq\.(\d+)/);
      if (!idMatch) throw new NetworkError('ID do pedido não retornado');
      const id = parseInt(idMatch[1]!, 10);
      return Pedido.fromDB({ ...pedido.toJSON(), id } as PedidoProps);
    });
  }

  async updateStatus(id: number, clienteId: number, status: string): Promise<Result<void>> {
    return tryAsync(async () => {
      await supabasePatch(
        'pedidos',
        `id=eq.${id}&cliente_id=eq.${clienteId}`,
        { status }
      );
    });
  }

}
