/**
 * AIActivityFeed — registro real de actividad del Runtime OS.
 *
 * Antes mostraba mensajes inventados (bloqueos de rastreadores, túneles VPN…).
 * Ahora muestra los eventos que el propio microkernel publica en su EventBus:
 * arranque, plugins, tareas del planificador, navegaciones reales y errores.
 *
 * La fuente es `kernel.eventBus.getHistory()`, que guarda los últimos 100 eventos.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Cpu, Globe, Package, AlertTriangle, Info, Layers, Download } from 'lucide-react';
import { kernel } from '@/src/kernel/BrowserKernel';
import { cn } from '@/src/lib/utils';

interface KernelEventLike {
  id: string;
  type: string;
  payload: Record<string, any>;
  source: string;
  timestamp: number;
}

interface DescribedEvent extends KernelEventLike {
  text: string;
  category: 'system' | 'network' | 'scheduler' | 'plugin' | 'error' | 'privacy' | 'download';
}

function describe(event: KernelEventLike): DescribedEvent {
  const payload = event.payload || {};
  const host = (() => {
    try {
      return new URL(payload.url).host;
    } catch {
      return payload.url || '';
    }
  })();

  switch (event.type) {
    case 'kernel.boot':
      return { ...event, text: 'Arrancando X Runtime OS', category: 'system' };
    case 'kernel.ready':
      return { ...event, text: `Runtime listo (${payload.version || 'v1.0'})`, category: 'system' };
    case 'service.registered':
      return { ...event, text: `Servicio registrado: ${payload.serviceId}`, category: 'system' };
    case 'capability.registered':
      return { ...event, text: `Capacidad registrada: ${payload.capabilityName || payload.name || '—'}`, category: 'system' };
    case 'provider.registered':
      return { ...event, text: `Proveedor disponible: ${payload.providerId || payload.name || '—'}`, category: 'network' };
    case 'plugin.enabled':
      return { ...event, text: `Plugin activado: ${payload.pluginId}`, category: 'plugin' };
    case 'plugin.disabled':
      return { ...event, text: `Plugin desactivado: ${payload.pluginId}`, category: 'plugin' };
    case 'renderer.changed':
      return { ...event, text: `Motor de render cambiado a ${payload.providerName}`, category: 'system' };
    case 'network.changed':
      return { ...event, text: `Transporte de red: ${payload.providerName}`, category: 'network' };
    case 'network.online':
      return { ...event, text: 'Conexión de red restablecida', category: 'network' };
    case 'network.offline':
      return { ...event, text: 'Sin conexión de red', category: 'error' };
    case 'viewport.loadend':
      return { ...event, text: `Página cargada en ${payload.durationMs} ms · ${host}`, category: 'network' };
    case 'viewport.title':
      return { ...event, text: `Título de pestaña: ${payload.title || '—'}`, category: 'network' };
    case 'scheduler.task_queued':
      return { ...event, text: `Tarea en cola: ${payload.name || payload.taskId || '—'}`, category: 'scheduler' };
    case 'scheduler.task_started':
      return { ...event, text: `Tarea iniciada: ${payload.name || payload.taskId || '—'}`, category: 'scheduler' };
    case 'scheduler.task_completed':
      return { ...event, text: `Tarea completada: ${payload.name || payload.taskId || '—'}`, category: 'scheduler' };
    case 'scheduler.backpressure_alert':
      return { ...event, text: 'Saturación del planificador: reduciendo carga', category: 'scheduler' };
    case 'invocation.success':
      return { ...event, text: `Capacidad invocada: ${payload.capabilityName}`, category: 'system' };
    case 'invocation.failed':
      return { ...event, text: `Fallo al invocar ${payload.capabilityName}`, category: 'error' };
    case 'policy.denied':
      return { ...event, text: `Política denegó ${payload.capabilityName}`, category: 'error' };
    case 'privacy.threat_blocked':
      return { ...event, text: `Simulación de privacidad: ${payload.threatType || payload.type || 'evento'}`, category: 'privacy' };
    case 'download.started':
      return { ...event, text: `Simulación de descarga iniciada: ${payload.item?.filename || '—'}`, category: 'download' };
    case 'runtime.error':
      return { ...event, text: `Error del runtime: ${payload.message || payload.reason || '—'}`, category: 'error' };
    default:
      return { ...event, text: event.type, category: 'system' };
  }
}

function iconFor(category: DescribedEvent['category']) {
  switch (category) {
    case 'network':
      return <Globe size={10} className="text-brand-cyan" />;
    case 'scheduler':
      return <Cpu size={10} className="text-emerald-400" />;
    case 'plugin':
      return <Package size={10} className="text-brand-magenta" />;
    case 'privacy':
      return <Shield size={10} className="text-amber-400" />;
    case 'download':
      return <Download size={10} className="text-amber-400" />;
    case 'error':
      return <AlertTriangle size={10} className="text-rose-400" />;
    default:
      return <Activity size={10} className="text-gray-400" />;
  }
}

const MAX_VISIBLE = 12;

export function AIActivityFeed() {
  const [events, setEvents] = useState<DescribedEvent[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => {
      const history = kernel.eventBus.getHistory() as unknown as KernelEventLike[];
      const described = history.map(describe).slice(-MAX_VISIBLE);
      seenRef.current = new Set(described.map((event) => event.id));
      setEvents(described);
    };

    refresh();
    const interval = setInterval(refresh, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card flex h-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-brand-cyan" />
          <h2 className="panel-header">Actividad del Runtime</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-400">
            Eventos reales
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] text-gray-600">
            <Layers size={9} />
            {events.length} registrados
          </span>
        </div>
      </div>

      <p className="mb-4 text-[10px] leading-relaxed text-gray-600">
        Flujo del EventBus del microkernel: lo que ocurre de verdad dentro de la aplicación, en directo.
      </p>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Info size={18} className="text-gray-600" />
            <p className="text-[11px] text-gray-500">Todavía no hay eventos registrados.</p>
          </div>
        ) : (
          events.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="mt-0.5 shrink-0">{iconFor(event.category)}</div>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-[10.5px]', event.category === 'error' ? 'text-rose-300' : 'text-gray-300')}>
                  {event.text}
                </p>
                <p className="font-mono text-[8.5px] uppercase tracking-wider text-gray-600">
                  {event.source} ·{' '}
                  {new Date(event.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
