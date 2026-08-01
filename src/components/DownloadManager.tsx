import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Pause, Play, X, CheckCircle2, AlertCircle, 
  FolderOpen, Zap, Trash2, Plus, FileCode, FileArchive, 
  Video, Music, FileText, HardDrive, RefreshCw, Layers
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type DownloadStatus = 'downloading' | 'paused' | 'completed' | 'canceled' | 'error';

export interface DownloadItem {
  id: string;
  filename: string;
  filesize: number; // in MB
  downloaded: number; // in MB
  speed: number; // in MB/s
  status: DownloadStatus;
  category: 'code' | 'archive' | 'media' | 'document' | 'system';
  url: string;
  startedAt: string;
}

const INITIAL_DOWNLOADS: DownloadItem[] = [
  {
    id: 'dl-1',
    filename: 'NavegadorX_Core_Installer_v2.4.zip',
    filesize: 450,
    downloaded: 285,
    speed: 18.5,
    status: 'downloading',
    category: 'archive',
    url: 'https://downloads.navegadorx.io/installer-v2.4.zip',
    startedAt: 'Hace 2 min',
  },
  {
    id: 'dl-2',
    filename: 'Cortex_AI_Weights_FP16.bin',
    filesize: 1800,
    downloaded: 920,
    speed: 34.2,
    status: 'paused',
    category: 'code',
    url: 'https://ai.navegadorx.io/models/cortex-fp16.bin',
    startedAt: 'Hace 10 min',
  },
  {
    id: 'dl-3',
    filename: 'VPN_X_SecureTunnel_Config.ovpn',
    filesize: 12,
    downloaded: 12,
    speed: 0,
    status: 'completed',
    category: 'system',
    url: 'https://vpn.navegadorx.io/config/tunnel.ovpn',
    startedAt: 'Hace 25 min',
  },
  {
    id: 'dl-4',
    filename: 'Crypto_Rig_Firmware_v4.2.iso',
    filesize: 850,
    downloaded: 310,
    speed: 0,
    status: 'canceled',
    category: 'archive',
    url: 'https://miner.navegadorx.io/firmware/rig-v4.iso',
    startedAt: 'Hace 1 hora',
  }
];

interface DownloadManagerProps {
  isExpanded: boolean;
  onClose?: () => void;
}

export function DownloadManager({ isExpanded }: DownloadManagerProps) {
  const [downloads, setDownloads] = useState<DownloadItem[]>(INITIAL_DOWNLOADS);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [turboMode, setTurboMode] = useState(true);

  // Simulate real-time progress for active downloads
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads((prev) =>
        prev.map((item) => {
          if (item.status !== 'downloading') return item;

          const boost = turboMode ? 1.5 : 1.0;
          const currentSpeed = parseFloat((item.speed * (0.9 + Math.random() * 0.2) * boost).toFixed(1));
          const increment = (currentSpeed / 10); // Simulated 100ms interval chunk
          const newDownloaded = Math.min(item.filesize, item.downloaded + increment);
          const isFinished = newDownloaded >= item.filesize;

          return {
            ...item,
            downloaded: parseFloat(newDownloaded.toFixed(1)),
            speed: isFinished ? 0 : currentSpeed,
            status: isFinished ? 'completed' : 'downloading',
          };
        })
      );
    }, 300);

    return () => clearInterval(interval);
  }, [turboMode]);

  // Actions
  const handleTogglePause = (id: string) => {
    setDownloads((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.status === 'downloading') {
          return { ...item, status: 'paused', speed: 0 };
        } else if (item.status === 'paused') {
          return { ...item, status: 'downloading', speed: 12.5 };
        }
        return item;
      })
    );
  };

  const handleCancel = (id: string) => {
    setDownloads((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, status: 'canceled', speed: 0 };
        }
        return item;
      })
    );
  };

  const handleRemove = (id: string) => {
    setDownloads((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const filename = customUrl.split('/').pop() || 'Archivo_Descargado.zip';
    const newDownload: DownloadItem = {
      id: `dl-${Date.now()}`,
      filename: filename.length > 30 ? filename.substring(0, 30) + '...' : filename,
      filesize: Math.floor(Math.random() * 800) + 50,
      downloaded: 0,
      speed: Math.floor(Math.random() * 25) + 10,
      status: 'downloading',
      category: filename.endsWith('.iso') || filename.endsWith('.zip') ? 'archive' : 'code',
      url: customUrl,
      startedAt: 'Justo ahora',
    };

    setDownloads([newDownload, ...downloads]);
    setCustomUrl('');
    setIsAddingCustom(false);
  };

  const getCategoryIcon = (category: DownloadItem['category']) => {
    switch (category) {
      case 'code':
        return <FileCode size={14} className="text-brand-cyan" />;
      case 'archive':
        return <FileArchive size={14} className="text-amber-400" />;
      case 'media':
        return <Video size={14} className="text-purple-400" />;
      case 'document':
        return <FileText size={14} className="text-blue-400" />;
      default:
        return <HardDrive size={14} className="text-emerald-400" />;
    }
  };

  const filteredDownloads = downloads.filter((item) => {
    if (filter === 'active') return item.status === 'downloading' || item.status === 'paused';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const activeCount = downloads.filter((d) => d.status === 'downloading').length;
  const totalSpeed = downloads
    .filter((d) => d.status === 'downloading')
    .reduce((acc, curr) => acc + curr.speed, 0);

  return (
    <div className="w-full flex flex-col h-full bg-[#121316] text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#18191d]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
            <Download size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              Gestor de Descargas
              {activeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-brand-cyan text-black font-mono text-[9px] font-extrabold animate-pulse">
                  {activeCount}
                </span>
              )}
            </h3>
            <p className="text-[9px] font-mono text-gray-400">
              {totalSpeed > 0 ? `Velocidad actual: ${totalSpeed.toFixed(1)} MB/s` : 'Sin descargas activas'}
            </p>
          </div>
        </div>

        {/* Turbo Mode Toggle */}
        <button
          type="button"
          onClick={() => setTurboMode(!turboMode)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-mono font-bold transition-all cursor-pointer",
            turboMode
              ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10"
          )}
          title="Modo Turbo: Aumenta el ancho de banda dedicado a descargas"
        >
          <Zap size={11} className={turboMode ? "fill-amber-400 text-amber-400 animate-bounce" : ""} />
          <span>TURBO</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-1.5 bg-[#0f1013] border-b border-white/5 flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-1 font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              "px-2 py-0.5 rounded transition-colors cursor-pointer",
              filter === 'all' ? "bg-white/10 text-white font-bold" : "text-gray-400 hover:text-white"
            )}
          >
            Todas ({downloads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={cn(
              "px-2 py-0.5 rounded transition-colors cursor-pointer",
              filter === 'active' ? "bg-brand-cyan/20 text-brand-cyan font-bold" : "text-gray-400 hover:text-white"
            )}
          >
            Activas ({downloads.filter(d => d.status === 'downloading' || d.status === 'paused').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={cn(
              "px-2 py-0.5 rounded transition-colors cursor-pointer",
              filter === 'completed' ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-gray-400 hover:text-white"
            )}
          >
            Listas ({downloads.filter(d => d.status === 'completed').length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingCustom(!isAddingCustom)}
          className="p-1 rounded bg-white/5 hover:bg-white/10 text-brand-cyan transition-colors cursor-pointer"
          title="Nueva descarga manual"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Add Custom Download Form */}
      <AnimatePresence>
        {isAddingCustom && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddDownload}
            className="p-2.5 bg-brand-cyan/5 border-b border-brand-cyan/20 space-y-2 font-mono text-[10px]"
          >
            <div className="flex items-center justify-between font-bold text-brand-cyan">
              <span>Añadir Enlace de Descarga:</span>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              placeholder="https://servidor.com/archivo.zip"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full bg-[#0a0b0d] border border-white/10 rounded px-2 py-1 text-white text-[10px] outline-none focus:border-brand-cyan"
            />
            <button
              type="submit"
              className="w-full bg-brand-cyan text-black font-bold py-1 rounded hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1"
            >
              <Download size={11} />
              Iniciar Descarga Ultra-Rápida
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Downloads List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredDownloads.length > 0 ? (
          filteredDownloads.map((item) => {
            const progress = Math.min(100, Math.round((item.downloaded / item.filesize) * 100));

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white/5 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-brand-cyan transition-colors">
                        {item.filename}
                      </p>
                      <p className="text-[9px] font-mono text-gray-500 truncate">
                        {item.url}
                      </p>
                    </div>
                  </div>

                  {/* Item Action Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'downloading' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(item.id)}
                        className="p-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                        title="Pausar descarga"
                      >
                        <Pause size={12} />
                      </button>
                    )}

                    {item.status === 'paused' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(item.id)}
                        className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                        title="Reanudar descarga"
                      >
                        <Play size={12} />
                      </button>
                    )}

                    {(item.status === 'downloading' || item.status === 'paused') && (
                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                        title="Cancelar descarga"
                      >
                        <X size={12} />
                      </button>
                    )}

                    {item.status === 'completed' && (
                      <button
                        type="button"
                        className="p-1 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Abrir ubicación"
                      >
                        <FolderOpen size={12} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                      title="Eliminar de la lista"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Stats */}
                <div className="space-y-1 font-mono text-[9px]">
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        item.status === 'downloading' && "bg-gradient-to-r from-brand-cyan to-brand-magenta",
                        item.status === 'paused' && "bg-amber-400",
                        item.status === 'completed' && "bg-emerald-400",
                        item.status === 'canceled' && "bg-rose-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>
                      {item.downloaded} MB / {item.filesize} MB ({progress}%)
                    </span>

                    {item.status === 'downloading' && (
                      <span className="text-brand-cyan font-bold flex items-center gap-1">
                        <Zap size={9} className="fill-brand-cyan" />
                        {item.speed} MB/s
                      </span>
                    )}

                    {item.status === 'paused' && (
                      <span className="text-amber-400 font-bold">Pausado</span>
                    )}

                    {item.status === 'completed' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> Completado
                      </span>
                    )}

                    {item.status === 'canceled' && (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> Cancelado
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-8 text-center text-gray-500 space-y-2">
            <Download size={24} className="mx-auto text-gray-600" />
            <p className="text-xs font-bold text-gray-400">Sin descargas registradas</p>
            <p className="text-[10px] font-mono">Los archivos guardados en Navegador X aparecerán aquí.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#0d0e11] border-t border-white/5 text-[9px] font-mono text-gray-500 flex items-center justify-between">
        <span>Acelerador Navegador X</span>
        <span className="text-brand-cyan">Cifrado de Extremo a Extremo</span>
      </div>
    </div>
  );
}
