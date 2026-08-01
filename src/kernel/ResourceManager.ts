import { globalEventBus } from './EventBus';

export type ResourceType = 'Tab' | 'Window' | 'Download' | 'Profile' | 'CookieStore' | 'Worker' | 'Cache' | 'Session';

export interface ManagedResource<T = any> {
  id: string;
  type: ResourceType;
  ownerId: string;
  state: 'INITIALIZING' | 'ACTIVE' | 'SUSPENDED' | 'DISPOSED';
  data: T;
  createdAt: number;
  lastAccessedAt: number;
}

export class ResourceManager {
  private resources: Map<string, ManagedResource> = new Map();

  public createResource<T = any>(type: ResourceType, ownerId: string, initialData: T): ManagedResource<T> {
    const id = `res-${type.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const resource: ManagedResource<T> = {
      id,
      type,
      ownerId,
      state: 'ACTIVE',
      data: initialData,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    this.resources.set(id, resource);
    globalEventBus.publish('resource.created', { id, type, ownerId }, 'ResourceManager');
    return resource;
  }

  public getResource<T = any>(id: string): ManagedResource<T> | undefined {
    const res = this.resources.get(id);
    if (res) {
      res.lastAccessedAt = Date.now();
    }
    return res as ManagedResource<T> | undefined;
  }

  public updateResourceState(id: string, newState: ManagedResource['state']): boolean {
    const res = this.resources.get(id);
    if (res) {
      res.state = newState;
      res.lastAccessedAt = Date.now();
      globalEventBus.publish('resource.state_changed', { id, newState }, 'ResourceManager');
      return true;
    }
    return false;
  }

  public disposeResource(id: string): boolean {
    const res = this.resources.get(id);
    if (res) {
      res.state = 'DISPOSED';
      this.resources.delete(id);
      globalEventBus.publish('resource.disposed', { id, type: res.type }, 'ResourceManager');
      return true;
    }
    return false;
  }

  public listResources(filterType?: ResourceType): ManagedResource[] {
    const list = Array.from(this.resources.values());
    if (filterType) {
      return list.filter((r) => r.type === filterType);
    }
    return list;
  }
}

export const globalResourceManager = new ResourceManager();
