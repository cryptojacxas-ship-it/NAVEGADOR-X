import { useState } from 'react';

interface MinerConsentModalProps {
  onAccept: (cpuCap: number) => void;
  onDecline: () => void;
}

export function MinerConsentModal({ onAccept, onDecline }: MinerConsentModalProps) {
  const [cpuCap, setCpuCap] = useState(30);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
         role="dialog" aria-modal="true" aria-labelledby="miner-title">
      <div className="card max-w-md w-full mx-4 space-y-5">
        <h2 id="miner-title" className="text-xl font-bold bg-grad-x bg-clip-text text-transparent">
          ⛏️ Activar Minería en Segundo Plano
        </h2>

        <div className="text-sm text-slate-300 space-y-2">
          <p>Al activar la minería, este navegador usará parte de tu CPU/GPU para minar criptomonedas mientras navegas. Los ingresos se comparten contigo.</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Puede aumentar el consumo energético del dispositivo</li>
            <li>Puedes pausar o detener en cualquier momento</li>
            <li>Máximo de CPU configurable (recomendado: ≤30%)</li>
            <li>Se detiene automáticamente con batería baja</li>
          </ul>
        </div>

        {/* Slider CPU */}
        <div>
          <label className="text-sm text-slate-300 block mb-1">
            Límite de CPU: <strong className="text-white">{cpuCap}%</strong>
            {cpuCap > 30 && (
              <span className="ml-2 text-yellow-400 text-xs">⚠️ Puede afectar el rendimiento</span>
            )}
          </label>
          <input
            type="range" min="10" max="80" step="5"
            value={cpuCap} onChange={e => setCpuCap(+e.target.value)}
            className="w-full accent-[#7b2cff]"
            aria-label="Límite de CPU para minería"
          />
          <p className="text-xs text-slate-500 mt-1">Recomendada: ≤30% para navegación normal</p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox" checked={accepted}
            onChange={e => setAccepted(e.target.checked)}
            className="mt-1 rounded border-border-panel bg-space-black"
            aria-required="true"
          />
          <span className="text-sm text-slate-300">
            Acepto los <a href="#" className="text-[#00d2ff] underline" onClick={(e) => e.preventDefault()}>Términos de Minería</a> y
            comprendo el consumo energético adicional.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={() => accepted && onAccept(cpuCap)}
            disabled={!accepted}
            className="flex-1 btn-primary disabled:opacity-40 disabled:cursor-not-allowed !py-2 text-xs uppercase tracking-widest"
          >
            Activar ahora
          </button>
          <button
            onClick={onDecline}
            className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
