import { 
  CapabilityMetadata, 
  BrowserPluginManifest, 
  PolicyEvaluationResult, 
  KernelEvent 
} from './types';

/**
 * ============================================================================
 * X RUNTIME OPERATING SYSTEM - V1.0 ARCHITECTURE FREEZE CONTRACTS
 * ============================================================================
 * These contracts define the immutable interfaces of the X Runtime platform.
 * Higher level applications (Browser, Research Studio, AI Workspace) interact
 * exclusively through these standardized runtime contracts.
 */

export interface CapabilityContract<TContext = any, TRequest = any, TResult = any> {
  id: string; // e.g. 'network.routeRequest'
  version: string;
  category: string;
  description: string;
  permissions: string[];
  metadata?: CapabilityMetadata;
  execute(context: TContext, request?: TRequest): Promise<TResult>;
}

export interface ProviderContract<TContext = any, TRequest = any, TResult = any> {
  id: string;
  name: string;
  capabilityType: string;
  priority: number;
  supports(context: TContext): boolean;
  execute(context: TContext, request?: TRequest): Promise<TResult>;
}

export interface PluginContract {
  manifest: BrowserPluginManifest;
  activate(kernel: any): Promise<void>;
  deactivate(kernel: any): Promise<void>;
  configure?(config: Record<string, any>): void;
}

export interface ScheduledTask<TResult = any> {
  id: string;
  capabilityName: string;
  callerId: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';
  priorityScore: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  args: any[];
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: TResult;
  abortController?: AbortController;
}

export interface RuntimeSchedulerContract {
  schedule<T = any>(
    capabilityName: string,
    callerId?: string,
    priority?: ScheduledTask['priority'],
    args?: any[],
    options?: { maxRetries?: number; timeoutMs?: number }
  ): Promise<T>;
  cancelTask(taskId: string): boolean;
  getQueue(): ScheduledTask[];
  getStats(): {
    activeWorkers: number;
    queuedCount: number;
    backpressureActive: boolean;
    completedTotal: number;
    failedTotal: number;
  };
}

export interface CapabilityMetric {
  capabilityName: string;
  invocationCount: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  lastInvokedAt: number;
}

export interface RuntimeMetricsContract {
  recordInvocation(capabilityName: string, durationMs: number, success: boolean, error?: string): void;
  getCapabilityMetrics(capabilityName?: string): CapabilityMetric | CapabilityMetric[];
  getSystemSnapshot(): {
    uptimeSeconds: number;
    totalInvocations: number;
    successRatePercent: number;
    activeProcesses: number;
    memoryUsageMb: number;
    capabilityMetrics: CapabilityMetric[];
  };
}

export interface KernelContract {
  version: string;
  boot(): Promise<void>;
  shutdown(): Promise<void>;
  invokeCapability<T = any>(capabilityName: string, callerId?: string, ...args: any[]): Promise<T>;
  listCapabilities(): CapabilityContract[];
  listPlugins(): PluginContract[];
  listProcesses(): any[];
  listResources(filterType?: string): any[];
}
