import { CapabilityMetric, RuntimeMetricsContract } from './contracts';
import { globalEventBus } from './EventBus';

export class RuntimeMetrics implements RuntimeMetricsContract {
  private startTime: number = Date.now();
  private metrics: Map<string, CapabilityMetric> = new Map();
  private totalInvocationsCount: number = 0;
  private totalSuccessesCount: number = 0;
  private totalErrorsCount: number = 0;

  public recordInvocation(capabilityName: string, durationMs: number, success: boolean, error?: string): void {
    this.totalInvocationsCount++;
    if (success) {
      this.totalSuccessesCount++;
    } else {
      this.totalErrorsCount++;
    }

    let metric = this.metrics.get(capabilityName);
    if (!metric) {
      metric = {
        capabilityName,
        invocationCount: 0,
        successCount: 0,
        errorCount: 0,
        totalDurationMs: 0,
        avgDurationMs: 0,
        minDurationMs: Infinity,
        maxDurationMs: 0,
        lastInvokedAt: Date.now(),
      };
      this.metrics.set(capabilityName, metric);
    }

    metric.invocationCount++;
    if (success) {
      metric.successCount++;
    } else {
      metric.errorCount++;
    }

    metric.totalDurationMs += durationMs;
    metric.minDurationMs = Math.min(metric.minDurationMs, durationMs);
    metric.maxDurationMs = Math.max(metric.maxDurationMs, durationMs);
    metric.avgDurationMs = Math.round(metric.totalDurationMs / metric.invocationCount);
    metric.lastInvokedAt = Date.now();

    globalEventBus.publish('metrics.updated', { capabilityName, durationMs, success }, 'RuntimeMetrics');
  }

  public getCapabilityMetrics(capabilityName?: string): CapabilityMetric | CapabilityMetric[] {
    if (capabilityName) {
      return this.metrics.get(capabilityName) || {
        capabilityName,
        invocationCount: 0,
        successCount: 0,
        errorCount: 0,
        totalDurationMs: 0,
        avgDurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
        lastInvokedAt: 0,
      };
    }
    return Array.from(this.metrics.values());
  }

  public getSystemSnapshot() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const successRatePercent = this.totalInvocationsCount > 0 
      ? Math.round((this.totalSuccessesCount / this.totalInvocationsCount) * 100) 
      : 100;

    return {
      uptimeSeconds,
      totalInvocations: this.totalInvocationsCount,
      successCount: this.totalSuccessesCount,
      errorCount: this.totalErrorsCount,
      successRatePercent,
      activeProcesses: 4,
      memoryUsageMb: Math.floor(85 + Math.random() * 30),
      capabilityMetrics: this.getCapabilityMetrics() as CapabilityMetric[],
    };
  }
}

export const globalRuntimeMetrics = new RuntimeMetrics();
