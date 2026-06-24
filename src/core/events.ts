type Handler<T> = (payload: T) => void;

interface EventMap {
  'auth:login': { cliente: import('../domain/cliente').Cliente };
  'auth:logout': void;
  'cart:updated': { count: number; total: number };
  'payment:success': { pedidoId: number; valor: number };
  'payment:failed': { error: string };
  'roleta:premio': { premio: string };
  'ui:toast': { message: string; tipo: 'ok' | 'erro' | 'info' };
}

class TypedEventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(
    event: K,
    handler: Handler<EventMap[K]>
  ): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as Handler<unknown>);
    return () => this.handlers.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.handlers.get(event)?.forEach(h => {
      try { h(payload); } catch (e) { console.error(`EventBus error on ${event}:`, e); }
    });
  }

  once<K extends keyof EventMap>(
    event: K,
    handler: Handler<EventMap[K]>
  ): void {
    const unsub = this.on(event, (payload) => { handler(payload); unsub(); });
  }
}

export const eventBus = new TypedEventBus();
