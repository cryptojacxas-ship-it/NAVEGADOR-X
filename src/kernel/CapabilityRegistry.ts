import { BrowserCapability } from './types';
import { globalEventBus } from './EventBus';

export class CapabilityRegistry {
  private capabilities: Map<string, BrowserCapability> = new Map();

  public register(capability: BrowserCapability): void {
    this.capabilities.set(capability.name, capability);
    globalEventBus.publish('capability.registered', { 
      capabilityName: capability.name, 
      serviceId: capability.serviceId,
      metadata: capability.metadata 
    }, 'CapabilityRegistry');
  }

  public unregister(capabilityName: string): boolean {
    const deleted = this.capabilities.delete(capabilityName);
    if (deleted) {
      globalEventBus.publish('capability.unregistered', { capabilityName }, 'CapabilityRegistry');
    }
    return deleted;
  }

  public get(capabilityName: string): BrowserCapability | undefined {
    return this.capabilities.get(capabilityName);
  }

  public has(capabilityName: string): boolean {
    return this.capabilities.has(capabilityName);
  }

  public list(): BrowserCapability[] {
    return Array.from(this.capabilities.values());
  }

  public getByCategory(category: string): BrowserCapability[] {
    return this.list().filter(cap => cap.metadata?.category === category);
  }

  public getByPermission(permission: string): BrowserCapability[] {
    return this.list().filter(cap => cap.metadata?.permissions?.includes(permission));
  }

  public validateCapability(capabilityName: string, context?: any): { valid: boolean; errors: string[] } {
    const cap = this.get(capabilityName);
    const errors: string[] = [];

    if (!cap) {
      return { valid: false, errors: [`Capacidad '${capabilityName}' no encontrada en el registro.`] };
    }

    const meta = cap.metadata;
    if (meta) {
      if (meta.supportedTransports && meta.supportedTransports.length > 0 && context?.transport) {
        if (!meta.supportedTransports.includes(context.transport)) {
          errors.push(`El transporte '${context.transport}' no está dentro de los permitidos [${meta.supportedTransports.join(', ')}] para la capacidad '${capabilityName}'.`);
        }
      }

      if (meta.permissions && meta.permissions.length > 0 && context?.callerPermissions) {
        const callerPerms: string[] = context.callerPermissions;
        const missing = meta.permissions.filter(p => !callerPerms.includes(p));
        if (missing.length > 0) {
          errors.push(`El invocador no posee los permisos requeridos: [${missing.join(', ')}].`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public introspect(capabilityName?: string): any {
    if (capabilityName) {
      const cap = this.get(capabilityName);
      if (!cap) return null;
      return {
        name: cap.name,
        serviceId: cap.serviceId,
        description: cap.description,
        metadata: cap.metadata || { category: 'uncategorized', version: '1.0.0' }
      };
    }

    return this.list().map(cap => ({
      name: cap.name,
      serviceId: cap.serviceId,
      description: cap.description,
      metadata: cap.metadata || { category: 'uncategorized', version: '1.0.0' }
    }));
  }
}

export const globalCapabilityRegistry = new CapabilityRegistry();
