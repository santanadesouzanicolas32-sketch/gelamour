import type { Cliente } from '../domain/cliente';
import type { Result } from '../core/result';

export interface IClienteRepository {
  findByTelefone(telefone: string): Promise<Result<Cliente | null>>;
  save(cliente: Cliente): Promise<Result<Cliente>>;
  updateEndereco(id: number, endereco: string): Promise<Result<void>>;
}
