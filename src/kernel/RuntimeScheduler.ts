import { ScheduledTask, RuntimeSchedulerContract } from './contracts';
import { globalEventBus } from './EventBus';
import { globalRuntimeMetrics } from './RuntimeMetrics';

const PRIORITY_SCORES: Record<ScheduledTask['priority'], number> = {
  CRITICAL: 100,
  HIGH: 75,
  NORMAL: 50,
  LOW: 25,
  BACKGROUND: 10,
};

export class RuntimeScheduler implements RuntimeSchedulerContract {
  private queue: ScheduledTask[] = [];
  private activeWorkers: Map<string, ScheduledTask> = new Map();
  private maxConcurrency: number = 5;
  private backpressureThreshold: number = 10;
  private completedTotal: number = 0;
  private failedTotal: number = 0;

  private executorHandler?: (task: ScheduledTask) => Promise<any>;

  public setExecutorHandler(handler: (task: ScheduledTask) => Promise<any>): void {
    this.executorHandler = handler;
  }

  public async schedule<T = any>(
    capabilityName: string,
    callerId: string = 'system',
    priority: ScheduledTask['priority'] = 'NORMAL',
    args: any[] = [],
    options?: { maxRetries?: number; timeoutMs?: number }
  ): Promise<T> {
    const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const priorityScore = PRIORITY_SCORES[priority] || 50;
    const abortController = new AbortController();

    const task: ScheduledTask<T> = {
      id: taskId,
      capabilityName,
      callerId,
      priority,
      priorityScore,
      status: 'QUEUED',
      args,
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 1,
      timeoutMs: options?.timeoutMs ?? 30000,
      queuedAt: Date.now(),
      abortController,
    };

    return new Promise<T>((resolve, reject) => {
      // Wrap completion callbacks onto task object
      (task as any)._resolve = resolve;
      (task as any)._reject = reject;

      this.queue.push(task);
      this.sortQueue();

      globalEventBus.publish('scheduler.task_queued', {
        taskId,
        capabilityName,
        priority,
        queueLength: this.queue.length,
      }, 'RuntimeScheduler');

      this.checkBackpressure();
      this.processQueue();
    });
  }

  private sortQueue(): void {
    // Sort descending by priority score, then ascending by queued timestamp
    this.queue.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.queuedAt - b.queuedAt;
    });
  }

  private checkBackpressure(): void {
    const backpressureActive = this.queue.length >= this.backpressureThreshold;
    if (backpressureActive) {
      globalEventBus.publish('scheduler.backpressure_alert', {
        queuedCount: this.queue.length,
        threshold: this.backpressureThreshold,
      }, 'RuntimeScheduler');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.activeWorkers.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    task.status = 'RUNNING';
    task.startedAt = Date.now();
    this.activeWorkers.set(task.id, task);

    globalEventBus.publish('scheduler.task_started', {
      taskId: task.id,
      capabilityName: task.capabilityName,
      activeWorkers: this.activeWorkers.size,
    }, 'RuntimeScheduler');

    const startTime = Date.now();

    try {
      if (!this.executorHandler) {
        throw new Error('[RuntimeScheduler] No execution handler configured.');
      }

      // Timeout race
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`[RuntimeScheduler TIMEOUT] Tarea '${task.id}' de capacidad '${task.capabilityName}' excedió los ${task.timeoutMs}ms.`));
        }, task.timeoutMs);

        task.abortController?.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error(`[RuntimeScheduler CANCELLED] Tarea '${task.id}' fue cancelada por el usuario.`));
        });
      });

      const result = await Promise.race([this.executorHandler(task), timeoutPromise]);

      const durationMs = Date.now() - startTime;
      task.status = 'COMPLETED';
      task.completedAt = Date.now();
      task.result = result;
      this.completedTotal++;

      globalRuntimeMetrics.recordInvocation(task.capabilityName, durationMs, true);

      globalEventBus.publish('scheduler.task_completed', {
        taskId: task.id,
        capabilityName: task.capabilityName,
        durationMs,
      }, 'RuntimeScheduler');

      (task as any)._resolve(result);
    } catch (err: any) {
      const durationMs = Date.now() - startTime;

      const isAborted = task.abortController?.signal.aborted;
      if (task.retryCount < task.maxRetries && !isAborted) {
        task.retryCount++;
        task.status = 'QUEUED';
        console.warn(`[RuntimeScheduler] Reintentando tarea ${task.id} (intento ${task.retryCount}/${task.maxRetries})...`);
        this.queue.push(task);
        this.sortQueue();
      } else {
        task.status = task.abortController?.signal.aborted ? 'CANCELLED' : 'FAILED';
        task.error = err?.message || String(err);
        this.failedTotal++;

        globalRuntimeMetrics.recordInvocation(task.capabilityName, durationMs, false, task.error);

        globalEventBus.publish('scheduler.task_failed', {
          taskId: task.id,
          capabilityName: task.capabilityName,
          error: task.error,
        }, 'RuntimeScheduler');

        (task as any)._reject(err);
      }
    } finally {
      this.activeWorkers.delete(task.id);
      this.processQueue();
    }
  }

  public cancelTask(taskId: string): boolean {
    // Check if task is active in worker pool
    const activeTask = this.activeWorkers.get(taskId);
    if (activeTask) {
      activeTask.abortController?.abort();
      activeTask.status = 'CANCELLED';
      this.activeWorkers.delete(taskId);
      globalEventBus.publish('scheduler.task_cancelled', { taskId }, 'RuntimeScheduler');
      return true;
    }

    // Check if task is queued
    const queuedIndex = this.queue.findIndex(t => t.id === taskId);
    if (queuedIndex >= 0) {
      const [queuedTask] = this.queue.splice(queuedIndex, 1);
      queuedTask.status = 'CANCELLED';
      (queuedTask as any)._reject(new Error(`[RuntimeScheduler] Tarea '${taskId}' cancelada mientras estaba en cola.`));
      globalEventBus.publish('scheduler.task_cancelled', { taskId }, 'RuntimeScheduler');
      return true;
    }

    return false;
  }

  public getQueue(): ScheduledTask[] {
    return [...this.queue];
  }

  public getActiveTasks(): ScheduledTask[] {
    return Array.from(this.activeWorkers.values());
  }

  public getStats() {
    return {
      activeWorkers: this.activeWorkers.size,
      queuedCount: this.queue.length,
      backpressureActive: this.queue.length >= this.backpressureThreshold,
      completedTotal: this.completedTotal,
      failedTotal: this.failedTotal,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

export const globalRuntimeScheduler = new RuntimeScheduler();
