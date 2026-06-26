type Selector<S, T> = (state: S) => T;
type Listener<T> = (value: T) => void;

export class Store<S extends object> {
  private state: S;
  private globalListeners = new Set<Listener<S>>();

  constructor(initialState: S) {
    this.state = { ...initialState };
  }

  getState(): Readonly<S> {
    return this.state;
  }

  setState(updater: Partial<S> | ((s: Readonly<S>) => Partial<S>)): void {
    const patch = typeof updater === 'function'
      ? updater(this.state)
      : updater;
    this.state = { ...this.state, ...patch };
    this.globalListeners.forEach(l => l(this.state));
  }

  subscribe(listener: Listener<S>): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  select<T>(selector: Selector<S, T>, listener: Listener<T>): () => void {
    let prev = selector(this.state);
    return this.subscribe(state => {
      const next = selector(state);
      if (next !== prev) {
        prev = next;
        listener(next);
      }
    });
  }
}
