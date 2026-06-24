import type { Pedido } from '../domain/pedido';
import type { Result } from '../core/result';

export interface IPedidoRepository {
  save(pedido: Pedido): Promise<Result<Pedido>>;
  updateStatus(id: number, clienteId: number, status: string): Promise<Result<void>>;
  findById(id: number): Promise<Result<Pedido | null>>;
}
