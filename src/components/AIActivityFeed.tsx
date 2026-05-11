import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Zap, Search, MessageSquare } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LogEntry {
  id: string;
  type: 'security' | 'info' | 'ai' | 'network';
  message: string;
  timestamp: Date;
}

const LOG_MESSAGES = [
  { type: 'security', message: 'Bloqueando tracker: doubleclick.net' },
  { type: 'ai', message: 'Resumiendo contexto de pestaña: "Novedades en Criptografía"' },
  { type: 'info', message: 'Persistencia de sesión actualizada localmente' },
  { type: 'network', message: 'Túnel VPN verificado (AES-256-GCM)' },
  { type: 'security', message: 'Amenaza de phishing neutralizada en subdominio' },
  { type: 'ai', message: 'Persona "Técnico" ajustando parámetros de respuesta' },
  { type: 'network', message: 'Latencia de nodo Frankfurt: 24ms' },
  { type: 'ai', message: 'Analizando sentimientos en hilo de comentarios' },
];

export function AIActivityFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Initial logs
    const initialLogs: LogEntry[] = Array.from({ length: 5 }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      ...LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)],
      timestamp: new Date(Date.now() - i * 10000),
    } as LogEntry)).reverse();
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        ...LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)],
        timestamp: new Date(),
      } as LogEntry;

      setLogs(prev => [...prev.slice(-9), newLog]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield size={10} className="text-brand-magenta" />;
      case 'ai': return <Zap size={10} className="text-brand-cyan" />;
      case 'network': return <Activity size={10} className="text-yellow-500" />;
      default: return <Info size={10} className="text-gray-500" />;
    }
  };

  return (
    <div className="card p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
         <div className="flex items-center gap-2">
           <Activity size={14} className="text-brand-magenta" />
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">AI X-Layer Feed</h3>
         </div>
         <span className="text-[9px] font-mono text-gray-700">LIVE_METRICS</span>
      </div>

      <div className="flex-1 space-y-4 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5 p-1 rounded-sm bg-white/5 border border-white/10">
                {getIcon(log.type)}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 font-mono leading-tight">{log.message}</div>
                <div className="text-[8px] text-gray-700 font-mono mt-1">
                  {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </motion.div>
          )).reverse()}
        </AnimatePresence>
        
        {/* Shadow for scroll effect */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card-bg to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function Info({ size, className }: { size: number, className: string }) {
  return <Zap size={size} className={className} />;
}
