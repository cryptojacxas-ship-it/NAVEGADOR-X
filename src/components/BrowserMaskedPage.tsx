// BrowserMaskedPage.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Zap, Cpu, Globe, Download, Lock, Activity, ArrowLeft, Terminal, ShieldAlert, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './../lib/utils';
import { BookmarkButton } from './BookmarkButton';

interface BrowserMaskedPageProps {
  url?: string;
  onExit?: () => void;
}

export function BrowserMaskedPage({ url = "https://www.google.com/search?q=crypto+market+analysis", onExit }: BrowserMaskedPageProps) {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [stats, setStats] = useState({
    hashrate: 1.42,
    cpu: 28,
    latency: 24
  });

  // Simular fluctuación de stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        hashrate: Number((prev.hashrate + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        cpu: Math.floor(Math.random() * (35 - 25) + 25),
        latency: Math.floor(Math.random() * (30 - 20) + 20)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl bg-[#0b0f14] overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10">
      
      {/* CAPA 1: Navegador Real (Fondo) */}
      <div className="absolute inset-0 z-0">
        <iframe
          id="navx-viewport"
          src={currentUrl}
          className="w-full h-full border-none opacity-90"
          title="Navegador X Viewport"
        />
        <div className="absolute inset-0 pointer-events-none bg-[#0b0f14]/10 mix-blend-overlay" />
      </div>

      {/* CAPA 2: Máscara Tipo Dashboard (HUD) */}
      {/* 
          El contenedor principal es pointer-events-none para que los clicks 
          atraviesen hacia el iframe inferior.
      */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col font-sans">
        
        {/* Barra superior tipo HUD (pointer-events-auto) */}
        <header className="pointer-events-auto flex items-center justify-between px-6 py-2.5 bg-[#0b0f14]/90 backdrop-blur-md border-b border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={onExit}
              className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all ring-1 ring-white/5"
              title="Cerrar navegación"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-grad-x p-[1.5px]">
                <div className="flex h-full w-full items-center justify-center rounded-md bg-black text-[8px] font-black text-white">X</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[10px] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  Navegador X <span className="text-[8px] text-brand-cyan tracking-normal font-mono px-1.5 py-0.5 bg-brand-cyan/10 rounded">SECURE_TUNNEL</span>
                </div>
                <div className="text-[8px] text-gray-500 font-mono truncate max-w-[200px]">{currentUrl}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                 <div className="h-1.5 w-1.5 rounded-full bg-brand-magenta animate-pulse" />
                 <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Mining Active</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/5 border border-brand-cyan/20">
                 <Globe size={10} className="text-brand-cyan" />
                 <span className="text-[8px] font-bold text-brand-cyan uppercase tracking-widest">VPN: ON</span>
               </div>
            </div>
            
            <BookmarkButton 
              url={currentUrl}
              title={`Marcador - ${currentUrl}`}
              category="Navegación"
              size="sm"
              variant="icon"
            />
            
            <button
              onClick={() => window.open('https://navegadorx.app/download', '_blank')}
              className="group relative px-5 py-1.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand-cyan transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Download size={14} />
              DOWNLOAD
            </button>
          </div>
        </header>

        {/* Zona central: Widgets Flotantes */}
        <div className="flex-1 relative">
          
          {/* Panel Lateral de Stats (pointer-events-auto) */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="pointer-events-auto absolute right-6 top-8 w-64 space-y-4"
          >
            <div className="bg-[#0b0f14]/95 rounded-2xl p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-brand-magenta" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Realtime Stats</span>
                </div>
                <div className="bg-brand-magenta/10 px-1.5 py-0.5 rounded text-[8px] text-brand-magenta font-bold">LIVE</div>
              </div>
              
              <div className="space-y-4">
                <StatBar label="Hashrate" value={`${stats.hashrate} kH/s`} progress={(stats.hashrate / 2) * 100} color="brand-magenta" />
                <StatBar label="CPU Usage" value={`${stats.cpu}%`} progress={stats.cpu} color="brand-cyan" />
                
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Latency</div>
                  <div className="text-[9px] font-mono text-brand-cyan">{stats.latency}ms</div>
                </div>
              </div>
            </div>

            {/* AI Assistant Insight */}
            <div className="bg-brand-magenta/5 rounded-2xl p-4 ring-1 ring-brand-magenta/20 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <Shield size={40} className="text-brand-magenta" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-brand-magenta animate-ping" />
                <span className="text-[9px] font-bold text-brand-magenta uppercase tracking-widest">X-Cortex Insight</span>
              </div>
              <p className="text-[9px] text-gray-300 leading-relaxed italic pr-4">
                "Sesión protegida mediante túnel cuántico. No se han detectado fugas de datos en el sitio actual."
              </p>
            </div>
          </motion.div>

          {/* Floater inferior izquierdo (pointer-events-auto) */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto absolute left-6 bottom-6 bg-[#0b0f14]/90 px-4 py-2 rounded-xl ring-1 ring-white/10 backdrop-blur-lg flex items-center gap-3 border-l-2 border-brand-cyan"
          >
            <Lock size={12} className="text-brand-cyan" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">AES-256 SESSION ACTIVE</span>
          </motion.div>
        </div>

        {/* Barra inferior (pointer-events-auto) */}
        <footer className="pointer-events-auto px-6 py-2 bg-[#0b0f14]/95 border-t border-white/5 flex items-center justify-between text-[8px] font-bold text-gray-500 tracking-widest uppercase">
          <div className="flex items-center gap-6">
            <span className="text-brand-cyan/80">Navegación protegida</span>
            <span className="h-3 w-[1px] bg-white/5" />
            <span>Minería opcional activada · System v1.0.4</span>
          </div>
          <div className="flex gap-4">
            <span>TLS 1.3</span>
            <span className="text-brand-magenta">Tor_RELAY: OFF</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatBar({ label, value, progress, color }: { label: string, value: string, progress: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[8px] font-mono text-gray-400 uppercase tracking-widest">
        <span>{label}</span>
        <span className={cn(color === 'brand-magenta' ? 'text-brand-magenta' : 'text-brand-cyan')}>{value}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-700", color === 'brand-magenta' ? 'bg-brand-magenta' : 'bg-brand-cyan')}
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
