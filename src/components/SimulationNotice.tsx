/**
 * SimulationNotice — aviso reutilizable para los módulos que solo son interfaz.
 *
 * El proyecto mantiene varios paneles (minería, VPN, privacidad) como demostración
 * visual. Este aviso deja claro qué ocurre de verdad y qué no, para que nadie saque
 * conclusiones equivocadas sobre su seguridad o su hardware.
 */

import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface SimulationNoticeProps {
  /** Qué simula este panel. */
  module: string;
  /** Detalle adicional específico del módulo. */
  children?: React.ReactNode;
}

export function SimulationNotice({ module, children }: SimulationNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
      <div className="text-[11px] leading-relaxed text-amber-100/90">
        <span className="font-bold uppercase tracking-wider text-amber-300">Simulación · </span>
        el panel <span className="font-semibold">{module}</span> es una demostración de interfaz. No realiza ninguna
        operación real sobre tu equipo ni sobre tu red; los valores que muestra se generan localmente y son ficticios.
        {children ? <> {children}</> : null}
      </div>
    </div>
  );
}
