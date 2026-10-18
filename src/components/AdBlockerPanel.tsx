/**
 * AdBlockerPanel — bloqueador de anuncios y rastreadores.
 *
 * Todo lo que muestra este panel es real: el motor vive en el proceso principal,
 * intercepta peticiones de red de la sesión del navegador y devuelve contadores
 * de lo que ha bloqueado de verdad. La lista incluida es corta y propia; puedes
 * importar la tuya (formato hosts o EasyList básico).
 *
 * Lo que NO hace, y se dice aquí para no crear falsas expectativas:
 *   - No bloquea anuncios servidos desde el propio dominio del sitio.
 *   - No aplica reglas cosméticas (ocultar huecos vacíos).
 *   - No toca huellas digitales ni intercepta Canvas/WebGL/WebRTC.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Info,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { desktopBridge, isDesktopApp } from '@/src/lib/desktop';
import type { NativeBlockerStatus } from '@/src/types/desktop';

export function AdBlockerPanel() {
  const desktop = isDesktopApp();
  const [status, setStatus] = useState<NativeBlockerStatus | null>(null);
  const [busy, setBusy] = useState<false | 'toggle' | 'import' | 'clear'>(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const bridge = desktopBridge();
    if (!bridge) return;
    setStatus(await bridge.blocker.status());
  }, []);

  useEffect(() => {
    if (!desktop) return;
    void refresh();
    const interval = setInterval(() => void refresh(), 2000);
    return () => clearInterval(interval);
  }, [desktop, refresh]);

  const toggle = async () => {
    const bridge = desktopBridge();
    if (!bridge || !status) return;
    setBusy('toggle');
    try {
      setStatus(await bridge.blocker.setEnabled(!status.enabled));
    } finally {
      setBusy(false);
    }
  };

  const importList = async () => {
    const bridge = desktopBridge();
    if (!bridge) return;
    setBusy('import');
    setFeedback(null);
    try {
      const result = await bridge.blocker.importList();
      if (!result?.ok) {
        if (result?.reason !== 'cancelado') {
          setFeedback({ kind: 'error', text: result?.reason || 'No se pudo importar la lista' });
        }
        return;
      }
      await refresh();
      setFeedback({
        kind: 'ok',
        text: `Lista importada: ${result.applied ?? 0} reglas aplicadas. Se aplicará también al reiniciar.`,
      });
    } finally {
      setBusy(false);
    }
  };

  const clearCustom = async () => {
    const bridge = desktopBridge();
    if (!bridge) return;
    setBusy('clear');
    setFeedback(null);
    try {
      setStatus(await bridge.blocker.clearCustom());
      setFeedback({ kind: 'info', text: 'Lista importada eliminada. Solo queda la lista incluida.' });
    } finally {
      setBusy(false);
    }
  };

  const clearStats = async () => {
    const bridge = desktopBridge();
    if (!bridge) return;
    setStatus(await bridge.blocker.clearStats());
  };

  if (!desktop) {
    return (
      <div className="card p-6 md:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Ban size={15} className="text-brand-cyan" />
          <h2 className="panel-header">Bloqueador de anuncios</h2>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Info size={15} className="mt-0.5 shrink-0 text-gray-500" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            El bloqueador necesita interceptar peticiones de red, así que solo funciona en la{' '}
            <strong className="text-gray-300">Edición de Escritorio</strong>. En la edición web, tu navegador ya aplica
            el suyo (y ese no lo podemos controlar desde aquí).
          </p>
        </div>
      </div>
    );
  }

  const enabled = status?.enabled ?? true;
  const blocked = status?.totalBlocked ?? 0;
  const since = status?.since ? new Date(status.since) : null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="card relative overflow-hidden p-6 md:p-8">
        <div className={cn('absolute left-0 top-0 h-1 w-full', enabled ? 'bg-grad-x' : 'bg-white/10')} />

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ban size={16} className="text-brand-cyan" />
              <h2 className="panel-header">Bloqueador de anuncios y rastreadores</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest',
                  enabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/15 bg-white/5 text-gray-500',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', enabled ? 'bg-emerald-400' : 'bg-gray-500')} />
                {enabled ? 'Activo' : 'Pausado'}
              </span>
              <span className="rounded border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-cyan">
                Bloqueo real de red
              </span>
            </div>

            <div className="flex items-end gap-3">
              <span className="font-mono text-4xl font-bold text-white">{blocked.toLocaleString('es-ES')}</span>
              <span className="pb-1 text-[11px] leading-tight text-gray-500">
                peticiones bloqueadas
                <br />
                {since ? `desde las ${since.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => void toggle()}
              disabled={busy !== false}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-all',
                enabled
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'border-white/15 bg-white/5 text-gray-400 hover:bg-white/10',
                busy !== false && 'cursor-not-allowed opacity-50',
              )}
            >
              {busy === 'toggle' ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
              {enabled ? 'Protección activa' : 'Activar protección'}
            </button>

            <button
              type="button"
              onClick={() => void clearStats()}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-gray-600 transition-colors hover:text-gray-400"
            >
              <RefreshCw size={10} />
              Reiniciar contador
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Dominios más bloqueados */}
        <div className="card p-6">
          <h3 className="panel-header mb-5">Dominios más bloqueados</h3>

          {status?.topHosts?.length ? (
            <div className="space-y-2">
              {status.topHosts.map((entry) => {
                const max = status.topHosts[0]?.count || 1;
                return (
                  <div key={entry.host} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px]">
                      <span className="truncate text-gray-300" title={entry.host}>
                        {entry.host}
                      </span>
                      <span className="shrink-0 text-brand-cyan">{entry.count}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-magenta"
                        style={{ width: `${Math.max(4, (entry.count / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ShieldCheck size={20} className="text-gray-600" />
              <p className="text-[11px] text-gray-500">
                Aún no se ha bloqueado nada. Navega un rato y vuelve a mirar.
              </p>
            </div>
          )}
        </div>

        {/* Listas */}
        <div className="card p-6">
          <h3 className="panel-header mb-5">Listas de filtros</h3>

          <div className="mb-5 space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 font-mono text-[10px]">
            <div className="flex items-center justify-between gap-3">
              <span className="uppercase tracking-widest text-gray-600">Incluida</span>
              <span className="text-gray-300">{status?.rules?.builtin ?? 0} reglas</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="uppercase tracking-widest text-gray-600">Importada por ti</span>
              <span className={status?.rules?.custom ? 'text-gray-300' : 'text-gray-600'}>
                {status?.rules?.custom ? `${status.rules.custom} reglas` : 'ninguna'}
              </span>
            </div>
            {status?.rules?.customSource && (
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 uppercase tracking-widest text-gray-600">Origen</span>
                <span className="truncate text-gray-400" title={status.rules.customSource}>
                  {status.rules.customSource}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void importList()}
              disabled={busy !== false}
              className="flex items-center gap-1.5 rounded-lg border border-brand-cyan/40 bg-brand-cyan/15 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-cyan transition-colors hover:bg-brand-cyan/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === 'import' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Importar lista
            </button>

            {Boolean(status?.rules?.custom) && (
              <button
                type="button"
                onClick={() => void clearCustom()}
                disabled={busy !== false}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === 'clear' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Quitar importada
              </button>
            )}
          </div>

          <p className="mt-5 border-t border-white/5 pt-4 text-[10px] leading-relaxed text-gray-600">
            Acepta listas en formato <span className="font-mono text-gray-500">hosts</span> (
            <span className="font-mono text-gray-500">0.0.0.0 dominio.com</span>) y reglas de dominio de EasyList (
            <span className="font-mono text-gray-500">||dominio.com^</span>). Las reglas con comodines también se
            aplican. Está incluida una lista propia y corta de redes publicitarias y analítica conocidas.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl border px-4 py-3 text-[11px] leading-relaxed',
            feedback.kind === 'ok' && 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200/90',
            feedback.kind === 'error' && 'border-rose-500/30 bg-rose-500/[0.07] text-rose-200/90',
            feedback.kind === 'info' && 'border-white/10 bg-white/[0.03] text-gray-400',
          )}
        >
          {feedback.kind === 'ok' ? (
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <Info size={13} className="mt-0.5 shrink-0 text-gray-500" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Límites, dichos sin adornos */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="text-[11px] leading-relaxed text-amber-100/85">
          <span className="font-bold uppercase tracking-wider text-amber-300">Hasta dónde llega · </span>
          bloquea peticiones a dominios de anuncios y rastreadores, y los contadores son reales. No bloquea anuncios
          servidos desde el propio dominio del sitio (para eso harían falta reglas cosméticas, que no están
          implementadas) y no toca huellas digitales ni intercepta Canvas, WebGL o WebRTC. Si un sitio se rompe,
          puedes pausar la protección aquí mismo.
        </div>
      </div>
    </div>
  );
}
