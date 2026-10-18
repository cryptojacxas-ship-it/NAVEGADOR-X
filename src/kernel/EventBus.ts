import { KernelEvent, EventListener } from './types';

export class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private history: KernelEvent[] = [];

  public subscribe<T = any>(eventType: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const set = this.listeners.get(eventType)!;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  public publish<T = any>(type: string, payload: T, source: string = 'system'): KernelEvent<T> {
    const event: KernelEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      payload,
      source,
      timestamp: Date.now(),
    };

    this.history.push(event);
    if (this.history.length > 100) {
      this.history.shift();
    }

    const set = this.listeners.get(type);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${type}:`, err);
        }
      });
    }

    return event;
  }

  public getHistory(): KernelEvent[] {
    return [...this.history];
  }
}

export const globalEventBus = new EventBus();
