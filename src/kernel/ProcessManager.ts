import { globalEventBus } from './EventBus';

export type ProcessType = 'RendererProcess' | 'GPUProcess' | 'NetworkProcess' | 'PluginProcess' | 'AIProcess' | 'KernelProcess';

export interface ProcessDescriptor {
  pid: number;
  type: ProcessType;
  name: string;
  status: 'RUNNING' | 'IDLE' | 'CRASHED' | 'TERMINATED';
  memoryUsageMb: number;
  cpuPercent: number;
  spawnTime: number;
}

export class ProcessManager {
  private processes: Map<number, ProcessDescriptor> = new Map();
  private nextPid = 1000;

  constructor() {
    // Spawn Core Kernel Process
    this.spawnProcess('KernelProcess', 'X-Runtime-Kernel-Core');
    this.spawnProcess('NetworkProcess', 'X-Runtime-Network-Worker');
    this.spawnProcess('GPUProcess', 'X-Runtime-Compositor');
    this.spawnProcess('AIProcess', 'X-Runtime-Cortex-Engine');
  }

  public spawnProcess(type: ProcessType, name: string): ProcessDescriptor {
    const pid = this.nextPid++;
    const proc: ProcessDescriptor = {
      pid,
      type,
      name,
      status: 'RUNNING',
      memoryUsageMb: Math.floor(15 + Math.random() * 45),
      cpuPercent: Math.floor(Math.random() * 5),
      spawnTime: Date.now(),
    };

    this.processes.set(pid, proc);
    globalEventBus.publish('process.spawned', { pid, type, name }, 'ProcessManager');
    return proc;
  }

  public killProcess(pid: number): boolean {
    const proc = this.processes.get(pid);
    if (proc) {
      proc.status = 'TERMINATED';
      this.processes.delete(pid);
      globalEventBus.publish('process.terminated', { pid, name: proc.name }, 'ProcessManager');
      return true;
    }
    return false;
  }

  public listProcesses(): ProcessDescriptor[] {
    return Array.from(this.processes.values());
  }

  public getStats() {
    const list = this.listProcesses();
    const totalMemoryMb = list.reduce((acc, p) => acc + p.memoryUsageMb, 0);
    const activeProcessesCount = list.length;
    return {
      activeProcessesCount,
      totalMemoryMb,
    };
  }
}

export const globalProcessManager = new ProcessManager();
