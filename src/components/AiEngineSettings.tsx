/**
 * AiEngineSettings — configuración del motor de IA.
 *
 * Modo autónomo: la aplicación funciona sin ninguna clave y responde desde el
 * motor local. Si el usuario aporta una, Cortex AI pasa a usar Gemini.
 *
 * La clave nunca se guarda en el código ni en el repositorio: en la Edición de
 * Escritorio se almacena en el fichero de ajustes del usuario, y solo la lee el
 * proceso principal de Electron.
 */

import { useEffect, useState } from 'react';
import { KeyRound, Check, AlertCircle, Cpu } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { desktopBridge, isDesktopApp } from '@/src/lib/desktop';
import { aiSetKey } from '@/src/lib/aiClient';

export function AiEngineSettings() {
  const desktop = isDesktopApp();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [model, setModel] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const bridge = desktopBridge();
    if (!bridge) return;
    void bridge.ai.hasKey().then(setHasKey);
    void bridge.ai.model().then(setModel);
  }, []);

  const handleSave = async () => {
    const bridge = desktopBridge();
    if (!bridge || !draft.trim()) return;

    setSaving(true);
    setFeedback('');
    try {
      const result = await aiSetKey(draft.trim(), model.trim() || undefined);
      if (result) {
        setHasKey(result.hasKey);
        setModel(result.model);
        setFeedback(result.hasKey ? 'Clave guardada: Cortex AI usará Gemini.' : 'No se pudo guardar la clave.');
      }
      setDraft('');
    } catch (error: any) {
      setFeedback(`Error al guardar: ${error?.message || String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const bridge = desktopBridge();
    if (!bridge) return;
    const result = await bridge.ai.setKey('');
    setHasKey(Boolean(result?.hasKey));
    setFeedback('Clave eliminada. El motor local volverá a responder.');
  };

  if (!desktop) {
    return (
      <div className="space-y-2 rounded-xl border border-white/10 bg-[#141418] p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Motor de IA</p>
        <div className="flex items-start gap-2">
          <Cpu size={12} className="mt-0.5 shrink-0 text-brand-cyan" />
          <p className="text-[10px] leading-relaxed text-gray-500">
            En la edición web la clave se configura en el servidor con la variable de entorno{' '}
            <code className="font-mono text-brand-cyan">GEMINI_API_KEY</code>. Sin ella, el servidor responde desde el
            motor local.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#141418] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Motor de IA</p>
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider',
            hasKey ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-400',
          )}
        >
          {hasKey === null ? 'Comprobando' : hasKey ? 'Gemini activo' : 'Motor local'}
        </span>
      </div>

      <div className="flex items-start gap-2">
        {hasKey ? <Check size={12} className="mt-0.5 shrink-0 text-emerald-400" /> : <Cpu size={12} className="mt-0.5 shrink-0 text-brand-cyan" />}
        <p className="text-[10px] leading-relaxed text-gray-500">
          {hasKey
            ? 'Las respuestas de Cortex AI y la traducción instantánea se generan con Gemini.'
            : 'Sin clave la aplicación funciona igual: responde desde el motor local, sin red.'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="mb-1 block text-[9px] font-mono uppercase tracking-widest text-gray-600" htmlFor="ai-model">
          Modelo
        </label>
        <input
          id="ai-model"
          type="text"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder="gemini-3.6-flash"
          className="w-full rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
        />

        <label className="mb-1 block text-[9px] font-mono uppercase tracking-widest text-gray-600" htmlFor="ai-key">
          Clave de Gemini
        </label>
        <div className="flex gap-2">
          <input
            id="ai-key"
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Se guarda solo en tu equipo"
            autoComplete="off"
            className="flex-1 rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-brand-cyan/50"
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !draft.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-brand-cyan/40 bg-brand-cyan/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-cyan transition-colors hover:bg-brand-cyan/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <KeyRound size={11} />
            {saving ? 'Guardando' : 'Guardar'}
          </button>
        </div>

        {hasKey && (
          <button
            type="button"
            onClick={() => void handleClear()}
            className="text-[9px] uppercase tracking-widest text-gray-600 underline transition-colors hover:text-gray-400"
          >
            Eliminar la clave guardada
          </button>
        )}

        {feedback && (
          <p className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <AlertCircle size={10} />
            {feedback}
          </p>
        )}

        <p className="text-[9px] leading-relaxed text-gray-600">
          La clave se guarda en el directorio de datos de la aplicación en tu equipo. Nunca se incluye en el
          repositorio ni se envía a terceros: solo viaja a la API de Google.
        </p>
      </div>
    </div>
  );
}
