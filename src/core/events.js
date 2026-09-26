export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this.listeners.get(event);
    if (set) set.delete(handler);
  }

  once(event, handler) {
    const wrap = (...args) => {
      this.off(event, wrap);
      handler(...args);
    };
    return this.on(event, wrap);
  }

  emit(event, ...args) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const h of [...set]) {
      try {
        h(...args);
      } catch (e) {
        console.error(`[EventBus] ${event} handler error:`, e);
      }
    }
  }

  removeAll(event) {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }
}