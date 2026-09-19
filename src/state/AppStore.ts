import { Store } from './Store';
import type { Cliente } from '../domain/cliente';

export interface AppState {
  readonly cliente: Cliente | null;
  readonly isLoggedIn: boolean;
  readonly carrinhoCount: number;
  readonly carrinhoTotal: number;
  readonly pagamentoSelecionado: string;
}

export const appStore = new Store<AppState>({
  cliente: null,
  isLoggedIn: false,
  carrinhoCount: 0,
  carrinhoTotal: 0,
  pagamentoSelecionado: '',
});

export function setCliente(cliente: Cliente | null): void {
  appStore.setState({
    cliente,
    isLoggedIn: !!cliente,
  });
}

export function setCarrinho(count: number, total: number): void {
  appStore.setState({ carrinhoCount: count, carrinhoTotal: total });
}

export function setPagamento(tipo: string): void {
  appStore.setState({ pagamentoSelecionado: tipo });
}
