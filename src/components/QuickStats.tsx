/**
 * QuickStats — métricas reales del runtime.
 *
 * Antes mostraba un "hashrate" y un "tráfico VPN" inventados. Ahora mide lo que
 * de verdad se puede medir:
 *  - Edición de Escritorio: memoria y CPU de los procesos de Electron (IPC `system:metrics`).
 *  - Edición web: memoria del montón de JavaScript expuesta por el navegador.
 *
 * Si una métrica no está disponible, se dice, en lugar de rellenarla con ficción.
 */

import { useEffect, useRef, useState } from 'react';
import { Cpu, HardDrive, Info } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { desktopBridge, isDesktopApp } from '@/src/lib/desktop';
import type { NativeSystemMetrics } from '@/src/types/desktop';

interface Sample {
  memoryMb: number;
  cpuPercent: number;
}

interface BrowserPerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

const MAX_SAMPLES = 18;

export function QuickStats() {
  const desktop = isDesktopApp();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [processCount, setProcessCount] = useState<number | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<number | null>(null);
  const [available, setAvailable] = useState<boolean>(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const collect = async () => {
      if (desktop) {
        const metrics: NativeSystemMetrics | undefined = await desktopBridge()?.system.metrics();
        if (!mountedRef.current) return;
        if (!metrics) {
          setAvailable(false);
          return;
        }
        setProcessCount(metrics.processes.length);
        setActiveDownloads(metrics.downloadsActive);
        setSamples((previous) =>
          [...previous, { memoryMb: metrics.totalMemoryMb, cpuPercent: metrics.totalCpuPercent }].slice(-MAX_SAMPLES),
        );
        return;
      }

      // Navegador: solo `performance.memory` (Chromium) ofrece datos del montón.
      const memory = (performance as Performance & { memory?: BrowserPerformanceMemory }).memory;
      if (!memory) {
        setAvailable(false);
        return;
      }
      setSamples((previous) =>
        [...previous, { memoryMb: memory.usedJSHeapSize / 1024 / 1024, cpuPercent: 0 }].slice(-MAX_SAMPLES),
      );
    };

    void collect();
    const interval = setInterval(() => void collect(), 2000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [desktop]);

  const latest = samples[samples.length - 1];
  const chartData = samples.map((sample, index) => ({ index, memoria: Number(sample.memoryMb.toFixed(1)) }));

  return (
    <div className="card relative flex flex-col overflow-hidden p-8">
      <div className="absolute left-0 top-0 h-1 w-full bg-grad-x" />
      <div className="mb-8 flex items-center justify-between">
        <h2 className="panel-header">Consumo del runtime</h2>
        <span
          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-400"
          title="Estas cifras se miden en tu equipo, no son estimaciones"
        >
          Datos reales
        </span>
      </div>

      {!available ? (
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Info size={15} className="mt-0.5 shrink-0 text-gray-500" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            Este navegador no expone métricas de memoria del proceso. La Edición de Escritorio sí las mide y las muestra
            aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-cyan/10 p-2 text-brand-cyan">
                  <HardDrive size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {desktop ? 'Memoria del runtime' : 'Memoria JS'}
                </span>
              </div>
              <div className="font-mono text-xl font-bold text-white">
                {latest ? latest.memoryMb.toFixed(0) : '—'}{' '}
                <span className="text-[10px] text-gray-600">MB</span>
              </div>
            </div>
            <div className="h-16 w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
                  <Area type="monotone" dataKey="memoria" stroke="#00d2ff" fill="#00d2ff20" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-gray-600">
              {samples.length} muestras · cada 2 s
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-magenta/10 p-2 text-brand-magenta">
                  <Cpu size={18} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {desktop ? 'Procesos del navegador' : 'Estado del motor'}
                </span>
              </div>
              <div className="font-mono text-xl font-bold text-white">
                {desktop ? (processCount ?? '—') : '1'}{' '}
                <span className="text-[10px] text-gray-600">{desktop ? 'procesos' : 'documento'}</span>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 font-mono text-[10px]">
              {desktop ? (
                <>
                  <Row label="CPU total" value={latest ? `${latest.cpuPercent.toFixed(1)} %` : '—'} />
                  <Row label="Descargas activas" value={activeDownloads === null ? '—' : String(activeDownloads)} />
                  <Row label="Aislamiento" value="Webview en proceso aparte" />
                </>
              ) : (
                <>
                  <Row label="Motor" value="Iframe del navegador" />
                  <Row label="Sitios incrustables" value="Limitado por CSP del sitio" />
                  <Row label="Escritorio" value="Recomendado para navegar" />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 border-t border-white/5 pt-4 text-[10px] leading-relaxed text-gray-600">
        <Info size={12} className="mt-0.5 shrink-0" />
        Los nodos VPN, la minería y el anti-fingerprinting son demostraciones de interfaz: no realizan ninguna
        operación real sobre tu equipo. El proxy del panel «Red y proxy» sí es real y cambia tu conexión.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="uppercase tracking-widest text-gray-600">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
