import { eventBus } from '../../core/events';
import { setCarrinho } from '../../state/AppStore';
import { logger } from '../../core/logger';
import type { ItemPedido } from '../../domain/pedido';

const log = logger.child('CartService');

export class CartService {
  private items = new Map<string, ItemPedido>();

  add(nome: string, preco: number): void {
    if (this.items.has(nome)) return;
    this.items.set(nome, { nome, preco: Number(preco) });
    this.notify();
    log.debug('Item adicionado', { nome });
  }

  remove(nome: string): void {
    if (!this.items.has(nome)) return;
    this.items.delete(nome);
    this.notify();
    log.debug('Item removido', { nome });
  }

  toggle(nome: string, preco: number): 'added' | 'removed' {
    if (this.items.has(nome)) {
      this.remove(nome);
      return 'removed';
    }
    this.add(nome, preco);
    return 'added';
  }

  clear(): void {
    this.items.clear();
    this.notify();
  }

  getItems(): readonly ItemPedido[] {
    return Array.from(this.items.values());
  }

  getTotal(): number {
    return Array.from(this.items.values())
      .reduce((sum, i) => Math.round((sum + i.preco) * 100) / 100, 0);
  }

  getCount(): number { return this.items.size; }

  has(nome: string): boolean { return this.items.has(nome); }

  isEmpty(): boolean { return this.items.size === 0; }

  revalidatePrices(priceMap: Map<string, number>): void {
    let changed = false;
    this.items.forEach((item, key) => {
      const realPrice = priceMap.get(key);
      if (realPrice !== undefined && realPrice !== item.preco) {
        this.items.set(key, { ...item, preco: realPrice });
        changed = true;
        log.warn('Preço revalidado', { nome: key, old: item.preco, new: realPrice });
      }
    });
    if (changed) this.notify();
  }

  private notify(): void {
    setCarrinho(this.getCount(), this.getTotal());
    eventBus.emit('cart:updated', { count: this.getCount(), total: this.getTotal() });
  }
}
