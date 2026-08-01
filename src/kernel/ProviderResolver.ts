import { globalEventBus } from './EventBus';

export interface CapabilityProvider<T = any> {
  id: string;
  name: string;
  capabilityType: string; // e.g. 'network.route', 'ai.generate', 'storage.db', 'renderer'
  priority?: number;
  supportsContext(context?: any): boolean;
  execute(...args: any[]): Promise<T>;
}

export class ProviderResolver {
  private providers: Map<string, CapabilityProvider[]> = new Map();

  public registerProvider(provider: CapabilityProvider): void {
    if (!this.providers.has(provider.capabilityType)) {
      this.providers.set(provider.capabilityType, []);
    }
    const list = this.providers.get(provider.capabilityType)!;
    list.push(provider);
    list.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    globalEventBus.publish('provider.registered', {
      id: provider.id,
      name: provider.name,
      capabilityType: provider.capabilityType
    }, 'ProviderResolver');
  }

  public resolveProvider<T = any>(capabilityType: string, context?: any): CapabilityProvider<T> | undefined {
    const list = this.providers.get(capabilityType) || [];
    // Find the highest priority provider that supports the current execution context
    return list.find((p) => p.supportsContext(context));
  }

  public listProviders(capabilityType?: string): CapabilityProvider[] {
    if (capabilityType) {
      return [...(this.providers.get(capabilityType) || [])];
    }
    const all: CapabilityProvider[] = [];
    this.providers.forEach((list) => all.push(...list));
    return all;
  }
}

export const globalProviderResolver = new ProviderResolver();
