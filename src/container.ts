// Composition Root — instancia e injeta dependências
import { LoginUseCase } from './application/auth/LoginUseCase';
import { CartService } from './application/cart/CartService';

export const loginUseCase = new LoginUseCase();
export const cartService = new CartService();

export function salvarEndereco(endereco: string): void {
  loginUseCase.salvarEndereco(endereco);
}
