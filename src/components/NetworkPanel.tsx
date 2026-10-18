/**
 * NetworkPanel — configuración de red REAL del navegador.
 *
 * A diferencia del resto del panel de VPN (que es una demostración de interfaz),
 * esto sí afecta a tu conexión: Electron aplica el proxy a la sesión elegida.
 *
 * Dos alcances:
 *   - Todas las pestañas → sesión compartida `persist:navegadorx`.
 *   - Solo esta pestaña  → esa pestaña recibe su propia partición, con su cookie jar
 *     y su ruta de red independientes del resto.
 *
 * Solo admite un proxy SOCKS5 / SOCKS4 / HTTP / HTTPS concreto, indicado por ti.
 * No hay listas de nodos, ni reglas PAC, ni servidores «gratuitos» de regalo.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Globe,
  Info,
  Loader2,
  Plug,
  ServerCog,
  ShieldOff,
  SplitSquareHorizontal,
  XCircle,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { desktopBridge, isDesktopApp, partitionForTab } from '@/src/lib/desktop';
import { kernel } from '@/src/kernel/BrowserKernel';
import type { NativeProxyStatus } from '@/src/types/desktop';

const SCHEMES = [
  { value: 'socks5', label: 'SOCKS5' },
  { value: 'socks4', label: 'SOCKS4' },
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS (CONNECT)' },
];

/** Atajos para una instancia de Tor que ya esté en marcha en tu equipo. */
const TOR_PRESETS = [
  { label: 'Tor local (9050)', host: '127.0.0.1', port: '9050' },
  { label: 'Tor Browser (9150)', host: '127.0.0.1', port: '9150' },
];

interface RouteState {
  activeTabId: string;
  activePartition: string;
  sharedPartition: string;
  dedicated: boolean;
  dedicatedCount: number;
}

export function NetworkPanel() {
  const desktop = isDesktopApp();

  const [route, setRoute] = useState<RouteState | null>(null);
  const [scope, setScope] = useState<'shared' | 'tab'>('shared');
  const [status, setStatus] = useState<NativeProxyStatus | null>(null);
  const [scheme, setScheme] = useState('socks5');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [busy, setBusy] = useState<false | 'apply' | 'clear' | 'test'>(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);

  const targetPartition =
    scope === 'tab' && route?.activeTabId ? partitionForTab(route.activeTabId) : route?.sharedPartition;

  /** Estado de enrutado que publica App (pestaña activa, partición, sesión dedicada). */
  useEffect(() => {
    const off = kernel.eventBus.subscribe('route.state', (event) => {
      setRoute(event.payload as RouteState);
    });
    kernel.eventBus.publish('route.request', {}, 'NetworkPanel');
    return off;
  }, []);

  const refresh = useCallback(async () => {
    const bridge = desktopBridge();
    if (!bridge || !targetPartition) return;
    const next = await bridge.proxy.status(targetPartition);
    setStatus(next ?? null);
  }, [targetPartition]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleApply = async () => {
    const bridge = desktopBridge();
    if (!bridge || !targetPartition) return;

    setBusy('apply');
    setFeedback(null);
    try {
      // Aseguramos que la partición existe y tiene las mismas reglas de seguridad.
      await bridge.proxy.ensure(targetPartition);

      const result = await bridge.proxy.apply({
        partition: targetPartition,
        scheme,
        host: host.trim(),
        port: Number(port),
        remember: scope === 'shared',
      });

      if (!result?.ok) {
        setFeedback({ kind: 'error', text: result?.reason || 'No se pudo aplicar el proxy' });
        return;
      }

      if (usuario.trim()) {
        await bridge.proxy.setCredentials(usuario.trim(), clave);
      }

      if (scope === 'tab') {
        kernel.eventBus.publish('route.command', { action: 'dedicate' }, 'NetworkPanel');
      }

      await refresh();
      setFeedback({
        kind: 'ok',
        text:
          scope === 'tab'
            ? `Proxy aplicado a esta pestaña. Electron resuelve: ${result.resolved || 'desconocido'}`
            : `Proxy aplicado a todas las pestañas. Electron resuelve: ${result.resolved || 'desconocido'}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    const bridge = desktopBridge();
    if (!bridge || !targetPartition) return;

    setBusy('clear');
    setFeedback(null);
    try {
      const result = await bridge.proxy.clear(targetPartition);

      if (scope === 'tab') {
        // Volver al alcance compartido implica dejar de usar la partición dedicada.
        kernel.eventBus.publish('route.command', { action: 'share' }, 'NetworkPanel');
        setScope('shared');
      }

      setUsuario('');
      setClave('');
      setFeedback(
        result?.ok
          ? { kind: 'info', text: 'Vuelto a conexión directa: tu tráfico sale por tu red habitual.' }
          : { kind: 'error', text: result?.reason || 'No se pudo restablecer la conexión directa' },
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    const bridge = desktopBridge();
    if (!bridge || !targetPartition) return;

    setBusy('test');
    setFeedback(null);
    try {
      const result = await bridge.proxy.test(targetPartition);
      if (result?.ok) {
        setFeedback({
          kind: 'ok',
          text: `Conexión correcta a través de la configuración actual (${result.latencyMs} ms, HTTP ${result.status}).`,
        });
      } else {
        setFeedback({
          kind: 'error',
          text: `La conexión falló: ${result?.error || `HTTP ${result?.status ?? 'sin respuesta'}`}`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!desktop) {
    return (
      <div className="card p-6">
        <div className="mb-3 flex items-center gap-2">
          <Globe size={14} className="text-brand-cyan" />
          <h2 className="panel-header">Red y proxy</h2>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Info size={15} className="mt-0.5 shrink-0 text-gray-500" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            La configuración de proxy está disponible en la <strong className="text-gray-300">Edición de
            Escritorio</strong>: un navegador no puede cambiar cómo sale tu tráfico desde dentro de una página web.
            Allí este mismo panel sí configura la conexión de verdad.
          </p>
        </div>
      </div>
    );
  }

  const resolved = status?.resolved || '';
  const hasRoute = Boolean(resolved) && resolved.toUpperCase() !== 'DIRECT';

  return (
    <div className="card p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ServerCog size={15} className="text-brand-cyan" />
          <h2 className="panel-header">Red y proxy</h2>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest',
            hasRoute
              ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', hasRoute ? 'bg-brand-cyan' : 'bg-emerald-400')} />
          {scope === 'tab' ? 'Ruta de esta pestaña' : 'Ruta compartida'}
        </span>
      </div>

      <p className="mb-5 text-[11px] leading-relaxed text-gray-500">
        Esto <strong className="text-gray-300">sí modifica tu conexión</strong>. Úsalo con un servidor de tu confianza
        (un SOCKS5 local, tu propia VPN o una instancia de Tor que ya tengas en marcha).
      </p>

      {/* Alcance */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Afecta a</span>
        <div className="flex rounded-lg border border-white/10 bg-[#0d0e12] p-0.5">
          <button
            type="button"
            onClick={() => setScope('shared')}
            className={cn(
              'rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
              scope === 'shared' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-gray-500 hover:text-gray-300',
            )}
          >
            Todas las pestañas
          </button>
          <button
            type="button"
            onClick={() => setScope('tab')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
              scope === 'tab' ? 'bg-brand-magenta/20 text-brand-magenta' : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <SplitSquareHorizontal size={11} />
            Solo esta pestaña
          </button>
        </div>

        {route?.dedicated && scope === 'tab' && (
          <button
            type="button"
            onClick={() => {
              kernel.eventBus.publish('route.command', { action: 'share' }, 'NetworkPanel');
              setScope('shared');
              setFeedback({
                kind: 'info',
                text: 'Esta pestaña vuelve a la sesión compartida. El proxy de su ruta propia se mantiene hasta que lo quites.',
              });
            }}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
          >
            Devolver a la sesión compartida
          </button>
        )}
      </div>

      {scope === 'tab' && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-brand-magenta/25 bg-brand-magenta/[0.06] px-4 py-3">
          <SplitSquareHorizontal size={13} className="mt-0.5 shrink-0 text-brand-magenta" />
          <p className="text-[10.5px] leading-relaxed text-gray-400">
            Una pestaña con ruta propia deja de compartir cookies y sesión con las demás: es lo que permite que salga
            por un proxy distinto sin arrastrar el resto. Otras {route?.dedicatedCount ?? 0} pestaña(s) tienen ruta
            dedicada.
          </p>
        </div>
      )}

      {/* Estado real reportado por Electron */}
      <div className="mb-6 space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 font-mono text-[10px]">
        <div className="flex items-center justify-between gap-3">
          <span className="uppercase tracking-widest text-gray-600">Partición</span>
          <span className="truncate text-gray-400" title={targetPartition}>
            {targetPartition || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="uppercase tracking-widest text-gray-600">Resuelto por Electron</span>
          <span className="truncate text-gray-300" title={resolved}>
            {resolved || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="uppercase tracking-widest text-gray-600">Autenticación</span>
          <span className="text-gray-300">{status?.hasCredentials ? 'con usuario y clave' : 'no configurada'}</span>
        </div>
      </div>

      {/* Formulario */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Tipo</span>
          <select
            value={scheme}
            onChange={(event) => setScheme(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
          >
            {SCHEMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Servidor</span>
          <input
            type="text"
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="127.0.0.1 o proxy.ejemplo.com"
            spellCheck={false}
            className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Puerto</span>
          <input
            type="number"
            value={port}
            onChange={(event) => setPort(event.target.value)}
            placeholder="1080"
            min={1}
            max={65535}
            className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Usuario (opcional)</span>
          <input
            type="text"
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
            autoComplete="off"
            className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Clave (opcional)</span>
          <input
            type="password"
            value={clave}
            onChange={(event) => setClave(event.target.value)}
            autoComplete="off"
            className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
          />
        </label>

        <div className="flex items-end gap-2 md:col-span-2">
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={busy !== false || !host.trim() || !port}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-cyan/40 bg-brand-cyan/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-cyan transition-colors hover:bg-brand-cyan/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'apply' ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />}
            Aplicar
          </button>

          <button
            type="button"
            onClick={() => void handleClear()}
            disabled={busy !== false}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'clear' ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
            Conexión directa
          </button>

          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={busy !== false}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'test' ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
            Probar
          </button>
        </div>
      </div>

      {/* Atajos de Tor: se conecta a una instancia que ya exista en tu equipo */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-gray-600">Rellenar con</span>
        {TOR_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setScheme('socks5');
              setHost(preset.host);
              setPort(preset.port);
              setFeedback({
                kind: 'info',
                text: `Preparado para ${preset.label}. Necesitas tener Tor en marcha en tu equipo: el navegador no incluye ningún daemon.`,
              });
            }}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={cn(
            'mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-[11px] leading-relaxed',
            feedback.kind === 'ok' && 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200/90',
            feedback.kind === 'error' && 'border-rose-500/30 bg-rose-500/[0.07] text-rose-200/90',
            feedback.kind === 'info' && 'border-white/10 bg-white/[0.03] text-gray-400',
          )}
        >
          {feedback.kind === 'ok' && <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />}
          {feedback.kind === 'error' && <XCircle size={13} className="mt-0.5 shrink-0 text-rose-400" />}
          {feedback.kind === 'info' && <Info size={13} className="mt-0.5 shrink-0 text-gray-500" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <p className="mt-5 border-t border-white/5 pt-4 text-[10px] leading-relaxed text-gray-600">
        Las credenciales del proxy se guardan únicamente en memoria mientras la aplicación está abierta: nunca se
        escriben en disco. El navegador <strong className="text-gray-500">no incluye</strong> ningún daemon de Tor ni
        listas de servidores: para Tor, apunta el proxy a tu instancia local (puerto 9050, o 9150 si usas Tor Browser).
      </p>
    </div>
  );
}
