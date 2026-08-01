import { globalCapabilityRegistry } from './CapabilityRegistry';
import { globalProviderResolver } from './ProviderResolver';
import { globalPolicyEngine } from './PolicyEngine';
import { globalResourceManager } from './ResourceManager';
import { globalProcessManager } from './ProcessManager';
import { globalEventBus } from './EventBus';
import { globalRuntimeScheduler } from './RuntimeScheduler';
import { globalRuntimeMetrics } from './RuntimeMetrics';

export interface RuntimeIntrospectionResponse {
  uri: string;
  title: string;
  timestamp: number;
  data: any;
}

export class RuntimeIntrospection {
  public resolve(uri: string): RuntimeIntrospectionResponse {
    const cleanUri = uri.trim().toLowerCase();

    if (cleanUri === 'runtime://kernel' || cleanUri === 'runtime://' || cleanUri === 'runtime://status') {
      return {
        uri: cleanUri,
        title: 'X Runtime OS - Microkernel Core Status (v1.0 Frozen)',
        timestamp: Date.now(),
        data: {
          kernelVersion: '1.0.0-FROZEN',
          architecture: '6-Layer Modular Microkernel Operating System',
          uptimeSeconds: globalRuntimeMetrics.getSystemSnapshot().uptimeSeconds,
          status: 'ONLINE',
          subsystems: {
            capabilityRegistry: 'ACTIVE (Contract Frozen)',
            providerResolver: 'ACTIVE (Contract Frozen)',
            policyEngine: 'ACTIVE (Context Decision Engine)',
            invocationEngine: 'ACTIVE (Validated Pipeline)',
            runtimeScheduler: 'ACTIVE (Priority Queue + Concurrency Engine)',
            resourceManager: 'ACTIVE (Resource Lifecycle Host)',
            processManager: 'ACTIVE (Isolated Process Host)',
            runtimeMetrics: 'ACTIVE (Telemetry Stream)',
          },
          processes: globalProcessManager.listProcesses(),
          resourcesCount: globalResourceManager.listResources().length,
          pluginsCount: 2,
        }
      };
    }

    if (cleanUri === 'runtime://capabilities') {
      const caps = globalCapabilityRegistry.list();
      const metricsList = globalRuntimeMetrics.getCapabilityMetrics() as any[];

      const capabilitiesWithStats = caps.map(cap => {
        const metric = metricsList.find(m => m.capabilityName === cap.name) || {
          invocationCount: 0,
          avgDurationMs: 0,
          errorCount: 0,
        };
        const providers = globalProviderResolver.listProviders(cap.name);

        return {
          name: cap.name,
          serviceId: cap.serviceId,
          description: cap.description,
          metadata: cap.metadata || { category: 'system', version: '1.0.0' },
          providersCount: providers.length,
          stats: {
            invocations: metric.invocationCount,
            avgLatencyMs: metric.avgDurationMs,
            errors: metric.errorCount,
          }
        };
      });

      return {
        uri: cleanUri,
        title: 'X Runtime OS - Capability Registry Introspection',
        timestamp: Date.now(),
        data: {
          totalCapabilities: capabilitiesWithStats.length,
          capabilities: capabilitiesWithStats,
        }
      };
    }

    if (cleanUri === 'runtime://events') {
      return {
        uri: cleanUri,
        title: 'X Runtime OS - Real-Time Kernel Event Log',
        timestamp: Date.now(),
        data: {
          eventCount: globalEventBus.getHistory().length,
          events: globalEventBus.getHistory().slice().reverse(),
        }
      };
    }

    if (cleanUri === 'runtime://scheduler') {
      const stats = globalRuntimeScheduler.getStats();
      const queue = globalRuntimeScheduler.getQueue();
      const active = globalRuntimeScheduler.getActiveTasks();

      return {
        uri: cleanUri,
        title: 'X Runtime OS - Task Scheduler & Concurrency Monitor',
        timestamp: Date.now(),
        data: {
          stats,
          activeWorkers: active,
          queuedTasks: queue,
        }
      };
    }

    if (cleanUri === 'runtime://metrics') {
      const snapshot = globalRuntimeMetrics.getSystemSnapshot();
      return {
        uri: cleanUri,
        title: 'X Runtime OS - Telemetry & Latency Metrics',
        timestamp: Date.now(),
        data: snapshot,
      };
    }

    return {
      uri: cleanUri,
      title: 'X Runtime OS - Unknown Runtime Endpoint',
      timestamp: Date.now(),
      data: {
        error: `URL '${uri}' no reconocida. Pruebe: runtime://kernel, runtime://capabilities, runtime://events, runtime://scheduler, runtime://metrics`,
        validUrls: [
          'runtime://kernel',
          'runtime://capabilities',
          'runtime://events',
          'runtime://scheduler',
          'runtime://metrics'
        ]
      }
    };
  }
}

export const globalRuntimeIntrospection = new RuntimeIntrospection();
