import { CapabilityRegistry, globalCapabilityRegistry } from './CapabilityRegistry';
import { PolicyEngine, globalPolicyEngine } from './PolicyEngine';
import { ProviderResolver, globalProviderResolver } from './ProviderResolver';
import { globalEventBus } from './EventBus';
import { globalRuntimeMetrics } from './RuntimeMetrics';
import { globalRuntimeScheduler } from './RuntimeScheduler';

export class InvocationEngine {
  private registry: CapabilityRegistry;
  private policyEngine: PolicyEngine;
  private providerResolver: ProviderResolver;

  constructor(
    registry: CapabilityRegistry = globalCapabilityRegistry,
    policyEngine: PolicyEngine = globalPolicyEngine,
    providerResolver: ProviderResolver = globalProviderResolver
  ) {
    this.registry = registry;
    this.policyEngine = policyEngine;
    this.providerResolver = providerResolver;

    // Connect Scheduler to InvocationEngine execution pipeline
    globalRuntimeScheduler.setExecutorHandler(async (task) => {
      return await this.invokeDirect(task.capabilityName, task.callerId, ...task.args);
    });
  }

  public async invoke<T = any>(capabilityName: string, callerId: string = 'system', ...args: any[]): Promise<T> {
    // Schedule capability invocation through RuntimeScheduler with priority & queueing
    return await globalRuntimeScheduler.schedule<T>(capabilityName, callerId, 'NORMAL', args);
  }

  public async invokeDirect<T = any>(capabilityName: string, callerId: string = 'system', ...args: any[]): Promise<T> {
    const context = args[0];
    const startTime = Date.now();

    try {
      // 1. Discover Capability in Registry
      const cap = this.registry.get(capabilityName);

      // 1b. Validate Metadata constraints (transports, permissions, etc.)
      const validation = this.registry.validateCapability(capabilityName, context);
      if (!validation.valid) {
        throw new Error(`[Metadata Validation FAILED] ${validation.errors.join(' ')}`);
      }
      
      // 2. Evaluate Policy Engine
      const policyResult = this.policyEngine.evaluate(capabilityName, callerId, context);
      if (!policyResult.allowed) {
        throw new Error(`[PolicyEngine DENIED] Capacidad '${capabilityName}' denegada para '${callerId}': ${policyResult.reason}`);
      }

      // 3. Resolve Provider via ProviderResolver if dynamic provider available
      const provider = this.providerResolver.resolveProvider<T>(capabilityName, context);
      
      const timeoutMs = cap?.metadata?.timeoutMs || 30000;
      const executePromise = (async () => {
        if (provider) {
          globalEventBus.publish('invocation.provider_resolved', { capabilityName, providerId: provider.id }, 'InvocationEngine');
          return await provider.execute(...args);
        } else if (cap) {
          return await cap.execute(...args);
        } else {
          throw new Error(`[InvocationEngine] Capacidad '${capabilityName}' no registrada y sin proveedor compatible disponible.`);
        }
      })();

      // Timeout execution wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`[InvocationEngine TIMEOUT] Ejecución de la capacidad '${capabilityName}' excedió el límite de ${timeoutMs}ms.`));
        }, timeoutMs);
      });

      const result = await Promise.race([executePromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;

      // Audit Logging if required by capability metadata
      if (cap?.metadata?.auditRequired) {
        globalEventBus.publish('invocation.audit_logged', {
          capabilityName,
          callerId,
          metadata: cap.metadata,
          timestamp: Date.now()
        }, 'InvocationEngine');
      }

      // Record Telemetry
      globalRuntimeMetrics.recordInvocation(capabilityName, durationMs, true);

      // 4. Publish Invocation Event
      globalEventBus.publish('invocation.success', { capabilityName, callerId, durationMs }, 'InvocationEngine');
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      globalRuntimeMetrics.recordInvocation(capabilityName, durationMs, false, err?.message);
      globalEventBus.publish('invocation.failed', { capabilityName, callerId, error: err?.message }, 'InvocationEngine');
      throw err;
    }
  }
}

export const globalInvocationEngine = new InvocationEngine();
