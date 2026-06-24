// Composition Root — instancia e injeta dependências
import { ClienteRepository } from './infrastructure/supabase/ClienteRepository';
import { PedidoRepository } from './infrastructure/supabase/PedidoRepository';
import { RoletaRepository } from './infrastructure/supabase/RoletaRepository';
import { LoginUseCase } from './application/auth/LoginUseCase';
import { CartService } from './application/cart/CartService';

const clienteRepository = new ClienteRepository();
const pedidoRepository = new PedidoRepository();
const roletaRepository = new RoletaRepository();

export const loginUseCase = new LoginUseCase(clienteRepository);
export const cartService = new CartService();

export { clienteRepository, pedidoRepository, roletaRepository };
