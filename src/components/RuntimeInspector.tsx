import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Clock, 
  Radio, 
  ListFilter, 
  Play, 
  Pause, 
  RotateCw, 
  Server, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Code2,
  Box,
  Search,
  Sliders,
  Database
} from 'lucide-react';
import { globalRuntimeIntrospection } from '../kernel/RuntimeIntrospection';
import { kernel } from '../kernel/BrowserKernel';

interface RuntimeInspectorProps {
  initialUri?: string;
  onNavigateUri?: (uri: string) => void;
}

export function RuntimeInspector({ initialUri = 'runtime://kernel', onNavigateUri }: RuntimeInspectorProps) {
  const [currentUri, setCurrentUri] = useState<string>(initialUri);
  const [inputUri, setInputUri] = useState<string>(initialUri);
  const [data, setData] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'kernel' | 'capabilities' | 'scheduler' | 'events' | 'metrics'>('kernel');

  // Load introspection snapshot
  const loadSnapshot = (uriToLoad: string) => {
    const res = globalRuntimeIntrospection.resolve(uriToLoad);
    setData(res);

    if (uriToLoad.includes('capabilities')) setActiveTab('capabilities');
    else if (uriToLoad.includes('scheduler')) setActiveTab('scheduler');
    else if (uriToLoad.includes('events')) setActiveTab('events');
    else if (uriToLoad.includes('metrics')) setActiveTab('metrics');
    else setActiveTab('kernel');
  };

  useEffect(() => {
    setCurrentUri(initialUri);
    setInputUri(initialUri);
    loadSnapshot(initialUri);
  }, [initialUri]);

  // Auto-refresh timer for live metrics & events
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadSnapshot(currentUri);
    }, 1500);
    return () => clearInterval(interval);
  }, [autoRefresh, currentUri]);

  const handleUriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uri = inputUri.trim().toLowerCase();
    setCurrentUri(uri);
    loadSnapshot(uri);
    if (onNavigateUri) onNavigateUri(uri);
  };

  const handleTabSelect = (tab: 'kernel' | 'capabilities' | 'scheduler' | 'events' | 'metrics') => {
    const targetUri = `runtime://${tab}`;
    setCurrentUri(targetUri);
    setInputUri(targetUri);
    loadSnapshot(targetUri);
    if (onNavigateUri) onNavigateUri(targetUri);
  };

  // Trigger test task execution via scheduler
  const handleTriggerCapabilityTest = async (capName: string) => {
    try {
      await kernel.invokeCapability(capName, 'RuntimeInspectorUI', { transport: 'Direct', testFlag: true });
      loadSnapshot(currentUri);
    } catch (err: any) {
      console.error('[RuntimeInspector] Capability execution error:', err);
      loadSnapshot(currentUri);
    }
  };

  return (
    <div id="runtime-inspector-root" className="w-full h-full bg-slate-950 text-slate-100 flex flex-col font-mono text-sm overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
      {/* Top Header Bar & Runtime Navigation */}
      <div id="runtime-inspector-header" className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
            <Cpu className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-xs tracking-wider uppercase">X Runtime OS v1.0</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            ARCHITECTURE FROZEN
          </span>
        </div>

        {/* runtime:// URI address bar */}
        <form onSubmit={handleUriSubmit} className="flex-1 max-w-xl flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 focus-within:border-emerald-500 transition-colors">
          <Radio className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
          <input
            id="runtime-inspector-uri-input"
            type="text"
            value={inputUri}
            onChange={(e) => setInputUri(e.target.value)}
            placeholder="runtime://kernel, runtime://capabilities, runtime://events..."
            className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none placeholder-slate-600"
          />
          <button type="submit" id="runtime-inspector-uri-go-btn" className="text-slate-400 hover:text-emerald-400 p-1">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            id="runtime-inspector-autorefresh-toggle"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              autoRefresh 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoRefresh ? 'Live Streaming' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Secondary Navigation Tabs */}
      <div id="runtime-inspector-tabs" className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <button
          id="runtime-tab-kernel"
          onClick={() => handleTabSelect('kernel')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'kernel' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>runtime://kernel</span>
        </button>

        <button
          id="runtime-tab-capabilities"
          onClick={() => handleTabSelect('capabilities')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'capabilities' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>runtime://capabilities</span>
        </button>

        <button
          id="runtime-tab-scheduler"
          onClick={() => handleTabSelect('scheduler')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'scheduler' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>runtime://scheduler</span>
        </button>

        <button
          id="runtime-tab-events"
          onClick={() => handleTabSelect('events')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'events' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>runtime://events</span>
        </button>

        <button
          id="runtime-tab-metrics"
          onClick={() => handleTabSelect('metrics')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'metrics' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'text-slate-400 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>runtime://metrics</span>
        </button>
      </div>

      {/* Main Introspection Content Area */}
      <div id="runtime-inspector-content" className="flex-1 overflow-y-auto p-6 space-y-6">
        {data && (
          <AnimatePresence mode="wait">
            {/* View: runtime://kernel */}
            {activeTab === 'kernel' && (
              <motion.div
                key="view-kernel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Status</span>
                    <span className="text-emerald-400 text-lg font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> ONLINE
                    </span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Architecture</span>
                    <span className="text-slate-200 text-sm font-semibold block truncate">Microkernel v1.0</span>
                    <span className="text-[10px] text-emerald-400">Contracts Frozen</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Uptime</span>
                    <span className="text-slate-200 text-lg font-bold">{data.data?.uptimeSeconds || 0}s</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Active Processes</span>
                    <span className="text-slate-200 text-lg font-bold">{data.data?.processes?.length || 0}</span>
                  </div>
                </div>

                {/* Subsystems Map */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Runtime Subsystems Registry
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(data.data?.subsystems || {}).map(([key, val]) => (
                      <div key={key} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-300 font-medium text-xs">{key}</span>
                        <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Process Table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" /> Isolated Process Manager
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">PID</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Memory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(data.data?.processes || []).map((proc: any) => (
                          <tr key={proc.pid} className="hover:bg-slate-800/30">
                            <td className="p-2.5 font-mono text-emerald-400">#{proc.pid}</td>
                            <td className="p-2.5 text-slate-400">{proc.type}</td>
                            <td className="p-2.5 font-semibold text-slate-200">{proc.name}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                                {proc.status}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-400">{proc.memoryUsageMb} MB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View: runtime://capabilities */}
            {activeTab === 'capabilities' && (
              <motion.div
                key="view-capabilities"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrar capacidades por nombre o categoría..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-200"
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    Total: {data.data?.totalCapabilities || 0} capacidades congeladas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(data.data?.capabilities || [])
                    .filter((cap: any) => 
                      !searchFilter || 
                      cap.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                      cap.metadata?.category?.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((cap: any) => (
                      <div key={cap.name} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-emerald-400 text-xs font-mono">{cap.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                              {cap.metadata?.category || 'system'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mb-3">{cap.description}</p>
                          
                          <div className="space-y-1 text-[11px] text-slate-400 mb-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                            <div><span className="text-slate-500">Service:</span> {cap.serviceId}</div>
                            <div><span className="text-slate-500">Transports:</span> {(cap.metadata?.supportedTransports || []).join(', ')}</div>
                            <div><span className="text-slate-500">Timeout:</span> {cap.metadata?.timeoutMs || 30000}ms</div>
                            <div><span className="text-slate-500">Audit:</span> {cap.metadata?.auditRequired ? 'REQUIRED' : 'NO'}</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            Invocaciones: {cap.stats?.invocations || 0} | Latencia: {cap.stats?.avgLatencyMs || 0}ms
                          </span>
                          <button
                            onClick={() => handleTriggerCapabilityTest(cap.name)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-semibold flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" /> Test Invoke
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* View: runtime://scheduler */}
            {activeTab === 'scheduler' && (
              <motion.div
                key="view-scheduler"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Active Worker Slots</span>
                    <span className="text-emerald-400 text-lg font-bold">
                      {data.data?.stats?.activeWorkers || 0} / {data.data?.stats?.maxConcurrency || 5}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Queued Tasks</span>
                    <span className="text-slate-200 text-lg font-bold">{data.data?.stats?.queuedCount || 0}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Backpressure</span>
                    <span className={`text-sm font-bold ${data.data?.stats?.backpressureActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {data.data?.stats?.backpressureActive ? 'HIGH LOAD (ACTIVE)' : 'NORMAL'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Completed / Failed</span>
                    <span className="text-slate-200 text-lg font-bold">
                      {data.data?.stats?.completedTotal || 0} / {data.data?.stats?.failedTotal || 0}
                    </span>
                  </div>
                </div>

                {/* Active Workers */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <Sliders className="w-4 h-4" /> Active Worker Execution Pool
                  </h3>
                  {(data.data?.activeWorkers || []).length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center bg-slate-950 rounded-lg border border-slate-800/60">
                      Sin tareas en ejecución concurrente en este instante.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(data.data?.activeWorkers || []).map((task: any) => (
                        <div key={task.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-emerald-400 font-bold text-xs">{task.capabilityName}</span>
                            <span className="text-slate-500 text-[10px] ml-2">Caller: {task.callerId}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                            RUNNING (#{task.priority})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* View: runtime://events */}
            {activeTab === 'events' && (
              <motion.div
                key="view-events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Real-Time Event Audit Stream</span>
                  </div>
                  <span className="text-xs text-slate-400">Total Buffer: {data.data?.eventCount || 0} eventos</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto">
                  {(data.data?.events || []).map((evt: any) => (
                    <div key={evt.id} className="p-2.5 rounded bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-emerald-400 font-bold">{evt.type}</span>
                        <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mb-1">Source: <span className="text-slate-300">{evt.source}</span></div>
                      <pre className="text-[10px] text-slate-500 bg-slate-950 p-2 rounded overflow-x-auto border border-slate-900">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* View: runtime://metrics */}
            {activeTab === 'metrics' && (
              <motion.div
                key="view-metrics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Total Invocations</span>
                    <span className="text-emerald-400 text-xl font-bold">{data.data?.totalInvocations || 0}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Success Rate</span>
                    <span className="text-slate-200 text-xl font-bold">{data.data?.successRatePercent || 100}%</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-400 text-xs block mb-1">Memory Footprint</span>
                    <span className="text-slate-200 text-xl font-bold">{data.data?.memoryUsageMb || 95} MB</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Capability Latency & Telemetry Metrics
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Capability Name</th>
                          <th className="p-2.5">Invocations</th>
                          <th className="p-2.5">Avg Latency</th>
                          <th className="p-2.5">Min/Max</th>
                          <th className="p-2.5">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(data.data?.capabilityMetrics || []).map((m: any) => {
                          const rate = m.invocationCount > 0 ? Math.round((m.successCount / m.invocationCount) * 100) : 100;
                          return (
                            <tr key={m.capabilityName} className="hover:bg-slate-800/30">
                              <td className="p-2.5 font-bold text-emerald-400">{m.capabilityName}</td>
                              <td className="p-2.5 font-mono">{m.invocationCount}</td>
                              <td className="p-2.5 font-mono text-slate-200">{m.avgDurationMs}ms</td>
                              <td className="p-2.5 font-mono text-slate-400">{m.minDurationMs === Infinity ? 0 : m.minDurationMs}ms / {m.maxDurationMs}ms</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${rate === 100 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                                  {rate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
