import type { ItemCarrinho } from '../types';
import { escHTML } from '../utils/security';
import { formatarMoeda } from '../utils/format';

const _carrinho: Record<string, ItemCarrinho> = {};

export function getCarrinho(): Record<string, ItemCarrinho> {
  return _carrinho;
}

export function getItens(): ItemCarrinho[] {
  return Object.values(_carrinho);
}

export function getTotal(): number {
  return getItens().reduce((s, i) => Math.round((s + i.preco) * 100) / 100, 0);
}

export function adicionarItem(nome: string, preco: number): boolean {
  if (_carrinho[nome]) return false;
  _carrinho[nome] = { nome, preco: Number(preco) };
  return true;
}

export function removerItem(nome: string): boolean {
  if (!_carrinho[nome]) return false;
  delete _carrinho[nome];
  return true;
}

export function toggleItem(nome: string, preco: number): 'adicionado' | 'removido' {
  if (_carrinho[nome]) {
    removerItem(nome);
    return 'removido';
  }
  adicionarItem(nome, preco);
  return 'adicionado';
}

export function limpar(): void {
  Object.keys(_carrinho).forEach(k => delete _carrinho[k]);
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
