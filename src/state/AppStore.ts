import { Store } from './Store';
import type { Cliente } from '../domain/cliente';

export interface AppState {
  readonly cliente: Cliente | null;
  readonly isLoggedIn: boolean;
  readonly isAdmin: boolean;
  readonly carrinhoCount: number;
  readonly carrinhoTotal: number;
  readonly pagamentoSelecionado: string;
  readonly pedidoIdPendente: number | null;
}

const ADMIN_TEL = atob('MTE5NDA3NzI3NTA=');
const CONTA_TESTE = atob('MTE5NjUwMzAwNzY=');

function calcIsAdmin(cliente: Cliente | null): boolean {
  return !!cliente && cliente.telefone === ADMIN_TEL;
}

export function isContaTeste(cliente: Cliente | null): boolean {
  return !!cliente && cliente.telefone === CONTA_TESTE;
}

export const appStore = new Store<AppState>({
  cliente: null,
  isLoggedIn: false,
  isAdmin: false,
  carrinhoCount: 0,
  carrinhoTotal: 0,
  pagamentoSelecionado: '',
  pedidoIdPendente: null,
});

export function setCliente(cliente: Cliente | null): void {
  appStore.setState({
    cliente,
    isLoggedIn: !!cliente,
    isAdmin: calcIsAdmin(cliente),
  });
}

export function setCarrinho(count: number, total: number): void {
  appStore.setState({ carrinhoCount: count, carrinhoTotal: total });
}

export function setPagamento(tipo: string): void {
  appStore.setState({ pagamentoSelecionado: tipo });
}
