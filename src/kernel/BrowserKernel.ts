import { 
  BrowserService, 
  BrowserCapability, 
  BrowserPlugin, 
  BrowserPluginManifest,
  RendererProvider, 
  NetworkProvider 
} from './types';
import { EventBus, globalEventBus } from './EventBus';
import { PolicyEngine, globalPolicyEngine } from './PolicyEngine';
import { CapabilityRegistry, globalCapabilityRegistry } from './CapabilityRegistry';
import { ProviderResolver, globalProviderResolver } from './ProviderResolver';
import { InvocationEngine, globalInvocationEngine } from './InvocationEngine';
import { ResourceManager, globalResourceManager } from './ResourceManager';
import { ProcessManager, globalProcessManager } from './ProcessManager';
import { RuntimeScheduler, globalRuntimeScheduler } from './RuntimeScheduler';
import { RuntimeMetrics, globalRuntimeMetrics } from './RuntimeMetrics';
import { RuntimeIntrospection, globalRuntimeIntrospection } from './RuntimeIntrospection';
import { registerDefaultNetworkProviders } from '@/src/providers/NetworkProviders';

export class BrowserKernel {
  private static instance: BrowserKernel;

  // Kernel Layer Subsystems (v1.0 Architecture Freeze)
  public eventBus: EventBus = globalEventBus;
  public policyEngine: PolicyEngine = globalPolicyEngine;
  public capabilityRegistry: CapabilityRegistry = globalCapabilityRegistry;
  public providerResolver: ProviderResolver = globalProviderResolver;
  public invocationEngine: InvocationEngine = globalInvocationEngine;
  public resourceManager: ResourceManager = globalResourceManager;
  public processManager: ProcessManager = globalProcessManager;
  public runtimeScheduler: RuntimeScheduler = globalRuntimeScheduler;
  public runtimeMetrics: RuntimeMetrics = globalRuntimeMetrics;
  public runtimeIntrospection: RuntimeIntrospection = globalRuntimeIntrospection;

  private services: Map<string, BrowserService> = new Map();
  private plugins: Map<string, BrowserPlugin> = new Map();

  private activeRenderer: RendererProvider | null = null;
  private activeNetwork: NetworkProvider | null = null;
  private initialized: boolean = false;

  private constructor() {
    this.setupKernelListeners();
  }

  public static getInstance(): BrowserKernel {
    if (!BrowserKernel.instance) {
      BrowserKernel.instance = new BrowserKernel();
    }
    return BrowserKernel.instance;
  }

  private setupKernelListeners(): void {
    this.eventBus.subscribe('kernel.boot', (evt) => {
      console.log('[BrowserKernel] Boot event received:', evt.payload);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.eventBus.publish('network.online', { status: 'online', timestamp: Date.now() }, 'BrowserKernel');
      });

      window.addEventListener('offline', () => {
        this.eventBus.publish('network.offline', { status: 'offline', timestamp: Date.now() }, 'BrowserKernel');
      });

      window.addEventListener('error', (event) => {
        this.eventBus.publish('runtime.error', {
          type: 'uncaught_error',
          message: event.message || 'Error no capturado en la interfaz',
          filename: event.filename,
          lineno: event.lineno,
          timestamp: Date.now()
        }, 'BrowserKernel');
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.eventBus.publish('runtime.error', {
          type: 'unhandled_rejection',
          reason: event.reason?.message || String(event.reason || 'Promesa no capturada'),
          timestamp: Date.now()
        }, 'BrowserKernel');
      });
    }
  }

  public async boot(): Promise<void> {
    if (this.initialized) return;

    console.log('[BrowserKernel] Booting X Runtime OS v1.0 (6-Layer Microkernel Architecture)...');
    
    // Register default providers for dynamic capabilities
    registerDefaultNetworkProviders();

    // Register core status capability into CapabilityRegistry
    this.registerCapability({
      name: 'kernel.status',
      serviceId: 'core',
      description: 'Retorna el estado de salud, procesos y subsistemas activos del Kernel',
      metadata: {
        version: '1.0.0-FROZEN',
        category: 'system',
        timeoutMs: 5000,
        auditRequired: false
      },
      execute: async () => ({
        status: 'ONLINE',
        version: '1.0.0-FROZEN',
        servicesCount: this.services.size,
        capabilitiesCount: this.capabilityRegistry.list().length,
        pluginsCount: this.plugins.size,
        activeProcesses: this.processManager.getStats().activeProcessesCount,
        totalMemoryMb: this.processManager.getStats().totalMemoryMb,
        renderer: this.activeRenderer?.name || 'IframeRenderer (Default)',
        network: this.activeNetwork?.name || 'Clearnet (Direct)',
      })
    });

    this.initialized = true;
    this.eventBus.publish('kernel.ready', { timestamp: Date.now(), version: '1.0.0-FROZEN' }, 'BrowserKernel');
  }

  // --- Service Registry ---
  public async registerService(service: BrowserService): Promise<void> {
    if (this.services.has(service.id)) {
      console.warn(`[BrowserKernel] Service ${service.id} already registered. Replacing.`);
    }

    await service.initialize(this);
    this.services.set(service.id, service);

    // Register service capabilities into CapabilityRegistry
    service.getCapabilities().forEach((cap) => this.registerCapability(cap));

    this.eventBus.publish('service.registered', { serviceId: service.id }, 'BrowserKernel');
  }

  public getService<T extends BrowserService>(id: string): T | undefined {
    return this.services.get(id) as T;
  }

  // --- Capability Registry & Invocation Engine Integration ---
  public registerCapability(capability: BrowserCapability): void {
    this.capabilityRegistry.register(capability);
  }

  public async invokeCapability<T = any>(capabilityName: string, callerId: string = 'system', ...args: any[]): Promise<T> {
    return await this.invocationEngine.invoke<T>(capabilityName, callerId, ...args);
  }

  public listCapabilities(): BrowserCapability[] {
    return this.capabilityRegistry.list();
  }

  // --- Provider Bindings ---
  public setRendererProvider(provider: RendererProvider): void {
    this.activeRenderer = provider;
    this.eventBus.publish('renderer.changed', { providerName: provider.name }, 'BrowserKernel');
  }

  public getRendererProvider(): RendererProvider | null {
    return this.activeRenderer;
  }

  public setNetworkProvider(provider: NetworkProvider): void {
    this.activeNetwork = provider;
    this.eventBus.publish('network.changed', { providerName: provider.name }, 'BrowserKernel');
  }

  public getNetworkProvider(): NetworkProvider | null {
    return this.activeNetwork;
  }

  // --- Plugin Host SDK & Manifest Loader ---
  public registerPlugin(plugin: BrowserPlugin): void {
    this.plugins.set(plugin.id, plugin);
    plugin.onEnable(this);
    plugin.capabilities.forEach((cap) => this.registerCapability(cap));
    this.eventBus.publish('plugin.enabled', { pluginId: plugin.id }, 'BrowserKernel');
  }

  public async registerPluginFromManifest(
    manifest: BrowserPluginManifest,
    executors: Record<string, (...args: any[]) => Promise<any>>,
    hooks?: {
      onEnable?: (kernel: BrowserKernel) => void | Promise<void>;
      onDisable?: (kernel: BrowserKernel) => void | Promise<void>;
      configure?: (config: Record<string, any>) => void;
    }
  ): Promise<BrowserPlugin> {
    const capabilities: BrowserCapability[] = manifest.capabilities.map((cap) => {
      const executor = executors[cap.name];
      if (!executor) {
        throw new Error(`[BrowserKernel] Executor for capability '${cap.name}' missing in manifest loader for plugin '${manifest.id}'`);
      }
      return {
        name: cap.name,
        serviceId: manifest.id,
        description: cap.description,
        metadata: {
          version: cap.version || manifest.version,
          category: cap.category || 'system',
          permissions: cap.permissions || manifest.permissions || [],
          supportedTransports: (cap.supportedTransports as any) || ['Direct', 'Tor', 'VPN'],
          timeoutMs: cap.timeoutMs || 30000,
          auditRequired: cap.auditRequired ?? false,
        },
        execute: executor,
      };
    });

    const plugin: BrowserPlugin = {
      manifest,
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      permissions: manifest.permissions,
      capabilities,
      config: manifest.config || {},
      onEnable: async (k) => {
        if (hooks?.onEnable) await hooks.onEnable(k);
      },
      onDisable: async (k) => {
        if (hooks?.onDisable) await hooks.onDisable(k);
      },
      configure: (newConfig) => {
        plugin.config = { ...plugin.config, ...newConfig };
        if (hooks?.configure) hooks.configure(plugin.config);
      }
    };

    this.registerPlugin(plugin);
    return plugin;
  }

  public getPlugin(pluginId: string): BrowserPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  public listPlugins(): BrowserPlugin[] {
    return Array.from(this.plugins.values());
  }

  public removePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.onDisable(this);
      this.plugins.delete(pluginId);
      this.eventBus.publish('plugin.disabled', { pluginId }, 'BrowserKernel');
    }
  }
}

export const kernel = BrowserKernel.getInstance();
