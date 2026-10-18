import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Fingerprint, Radio, Lock, Shield, EyeOff, X, ArrowRight, Activity } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { globalEventBus } from '@/src/kernel/EventBus';

export interface PrivacyBlockedToastItem {
  id: string;
  domain: string;
  tracker: string;
  type: 'Fingerprint' | 'AdTracker' | 'WebRTC' | 'Cookie' | 'Referrer';
  time: string;
  protectedData: string;
}

interface PrivacyToastProps {
  onOpenPrivacyShield?: () => void;
}

export function PrivacyToast({ onOpenPrivacyShield }: PrivacyToastProps) {
  const [activeToast, setActiveToast] = useState<PrivacyBlockedToastItem | null>(null);

  useEffect(() => {
    // Listen for privacy threat blocked events from kernel EventBus
    const unsubscribe = globalEventBus.subscribe('privacy.threat_blocked', (evt) => {
      const payload = evt.payload as PrivacyBlockedToastItem;
      if (payload) {
        setActiveToast(payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const getTypeStyle = (type: PrivacyBlockedToastItem['type']) => {
    switch (type) {
      case 'Fingerprint':
        return {
          bg: 'bg-purple-950/90 border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Fingerprint size={14} className="text-purple-400 shrink-0 animate-pulse" />,
          label: 'Huella Digital Ocultada'
        };
      case 'WebRTC':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Radio size={14} className="text-emerald-400 shrink-0 animate-pulse" />,
          label: 'IP Local Protegida'
        };
      case 'Cookie':
        return {
          bg: 'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Lock size={14} className="text-amber-400 shrink-0" />,
          label: 'Supercookie Aislada'
        };
      case 'AdTracker':
        return {
          bg: 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <ShieldCheck size={14} className="text-brand-cyan shrink-0 animate-bounce" />,
          label: 'Rastreador Interceptado'
        };
      default:
        return {
          bg: 'bg-rose-950/90 border-rose-500/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <EyeOff size={14} className="text-rose-400 shrink-0" />,
          label: 'Aislamiento de Privacidad'
        };
    }
  };

  const style = getTypeStyle(activeToast.type);

  return (
    <AnimatePresence>
      <motion.div
        key={activeToast.id}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative z-50 flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border font-mono text-[10px] backdrop-blur-md max-w-xl w-full mx-auto my-1",
          style.bg
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {style.icon}
          
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider border", style.badge)}>
                {style.label}
              </span>
              <span className="text-[9px] font-bold text-white truncate">
                {activeToast.domain}
              </span>
              <span className="text-[8px] text-gray-400 ml-auto font-mono">
                {activeToast.time}
              </span>
            </div>

            <p className="text-[9px] text-gray-200 truncate font-sans">
              Dato protegido: <strong className="font-mono text-white underline">{activeToast.protectedData}</strong> ({activeToast.tracker})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenPrivacyShield && (
            <button
              type="button"
              onClick={onOpenPrivacyShield}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-white/20"
            >
              <span>Ver Escudo</span>
              <ArrowRight size={10} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
