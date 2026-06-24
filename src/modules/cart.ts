import type { ItemCarrinho } from '../types';
import { escHTML } from '../utils/security';
import { formatarMoeda } from '../utils/format';
import { cartService } from '../container';

// Adaptadores legados — delegam ao CartService (Clean Architecture)
export function getCarrinho(): Record<string, ItemCarrinho> {
  const result: Record<string, ItemCarrinho> = {};
  cartService.getItems().forEach(i => { result[i.nome] = i; });
  return result;
}

export function getItens(): ItemCarrinho[] {
  return Array.from(cartService.getItems()) as ItemCarrinho[];
}

export function getTotal(): number {
  return cartService.getTotal();
}

export function adicionarItem(nome: string, preco: number): boolean {
  if (cartService.has(nome)) return false;
  cartService.add(nome, preco);
  return true;
}

export function removerItem(nome: string): boolean {
  if (!cartService.has(nome)) return false;
  cartService.remove(nome);
  return true;
}

export function toggleItem(nome: string, preco: number): 'adicionado' | 'removido' {
  const r = cartService.toggle(nome, preco);
  return r === 'added' ? 'adicionado' : 'removido';
}

export function limpar(): void {
  cartService.clear();
}

export function isBoloForma(nome: string): boolean {
  const BOLO_FORMA_NOMES = ['Bolo na forma Milho natural', 'Bolo na forma Cenoura com chocolate e Granule'];
  return BOLO_FORMA_NOMES.includes(nome);
}

export function renderizarLista(containerId: string, totalRodapeId: string, badgeId: string): void {
  const lista = document.getElementById(containerId);
  const totalEl = document.getElementById(totalRodapeId);
  const badge = document.getElementById(badgeId);
  const itens = getItens();

  if (badge) badge.textContent = String(itens.length);

  if (!lista || !totalEl) return;

  if (itens.length === 0) {
    lista.innerHTML = `<div class="carrinho-vazio"><div class="carrinho-vazio-icon">🛒</div><div>Seu carrinho está vazio</div></div>`;
    totalEl.textContent = 'R$ 0,00';
    return;
  }

  const total = getTotal();
  lista.innerHTML = itens.map(item => {
    const nomeEsc = escHTML(item.nome);
    const nomeData = encodeURIComponent(item.nome);
    return `<div class="cart-item">
      <span class="cart-item-nome">${nomeEsc}</span>
      <span class="cart-item-preco">${formatarMoeda(item.preco)}</span>
      <button class="cart-item-remove" onclick="removerDoCarrinho(decodeURIComponent('${nomeData}'))" aria-label="Remover">🗑️</button>
    </div>`;
  }).join('') + `<div class="cart-total"><span class="cart-total-label">Total</span><span class="cart-total-valor">${formatarMoeda(total)}</span></div>`;
  totalEl.textContent = formatarMoeda(total);
}
