/**
 * ConnectionStatus — estado real de la conexión.
 *
 * Antes mostraba una VPN "conectada" a Zúrich con un nodo inventado. Aquí solo se
 * declara lo que el programa realmente hace con tu red: nada. La aplicación navega
 * en directo y no configura ningún proxy ni túnel.
 */

import { Lock, ShieldAlert, Wifi } from 'lucide-react';
import { isDesktopApp } from '@/src/lib/desktop';

export function ConnectionStatus() {
  const desktop = isDesktopApp();

  const rows: Array<{ label: string; value: string; ok: boolean }> = [
    { label: 'Transporte', value: 'Conexión directa del sistema', ok: true },
    { label: 'Proxy configurado', value: 'Ninguno', ok: true },
    { label: 'Túneles VPN / Tor', value: 'No implementados', ok: false },
    {
      label: 'Sesión del navegador',
      value: desktop ? 'Persistente en disco' : 'Solo mientras la pestaña esté abierta',
      ok: true,
    },
  ];

  return (
    <div className="card p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="panel-header">Conexión de red</h2>
        <span className="flex items-center gap-1.5 rounded border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-cyan">
          <Wifi size={10} />
          En directo
        </span>
      </div>

      <div className="mb-5 flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-cyan/40 bg-[#141418]">
          <Lock size={22} className="text-brand-cyan" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white">Sin intermediarios</div>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
            Tu tráfico sale por tu propia conexión, igual que en cualquier navegador.
          </p>
        </div>
      </div>

      <div className="space-y-2 font-mono text-[10px]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="uppercase tracking-widest text-gray-600">{row.label}</span>
            <span className={row.ok ? 'text-gray-300' : 'text-amber-400'}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-white/5 pt-4">
        <ShieldAlert size={12} className="mt-0.5 shrink-0 text-amber-400" />
        <p className="text-[10px] leading-relaxed text-gray-600">
          El panel <span className="font-semibold text-gray-500">VPN X</span> es una demostración de interfaz: no crea
          túneles ni cambia tu dirección IP. Si necesitas anonimato real, usa herramientas dedicadas y verificadas.
        </p>
      </div>
    </div>
  );
}
