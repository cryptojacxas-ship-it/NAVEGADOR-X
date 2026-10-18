import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download, Pause, Play, X, CheckCircle2, AlertCircle,
  FolderOpen, Zap, Trash2, Plus, FileCode, FileArchive,
  Video, Music, FileText, HardDrive, RefreshCw, FolderDown, Info, MonitorDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { isDesktopApp, startDownload } from '@/src/lib/desktop';
import {
  useNativeDownloads,
  formatBytes,
  formatSpeed,
  categorizeFilename,
} from '@/src/hooks/useNativeDownloads';

export type DownloadStatus = 'downloading' | 'paused' | 'completed' | 'canceled' | 'error';

/** Modelo único que alimenta la interfaz, venga de disco (nativo) o de la demo. */
interface DisplayItem {
  id: string;
  filename: string;
  url: string;
  sizeBytes: number;
  receivedBytes: number;
  speedBps: number;
  status: DownloadStatus;
  category: 'code' | 'archive' | 'media' | 'document' | 'system';
  /** Ruta real en disco (escritorio) o nota de demostración (web). */
  location: string;
  simulated: boolean;
}

const MB = 1024 * 1024;

/**
 * Filas de demostración para la edición web, donde el navegador no puede
 * escribir en el disco del usuario. Se muestran siempre marcadas como SIMULACIÓN.
 */
const DEMO_DOWNLOADS: DisplayItem[] = [
  {
    id: 'demo-1',
    filename: 'NavegadorX-Desktop-Setup-0.2.0.exe',
    url: 'https://github.com/cryptojacxas-ship-it/NAVEGADOR-X/releases',
    sizeBytes: 142 * MB,
    receivedBytes: 89 * MB,
    speedBps: 6.4 * MB,
    status: 'downloading',
    category: 'archive',
    location: 'Demostración de interfaz',
    simulated: true,
  },
  {
    id: 'demo-2',
    filename: 'Ejemplo-Documentacion.pdf',
    url: 'https://ejemplo.local/documentacion.pdf',
    sizeBytes: 12 * MB,
    receivedBytes: 12 * MB,
    speedBps: 0,
    status: 'completed',
    category: 'document',
    location: 'Demostración de interfaz',
    simulated: true,
  },
];

interface DownloadManagerProps {
  isExpanded: boolean;
  onClose?: () => void;
}

export function DownloadManager({ isExpanded }: DownloadManagerProps) {
  const desktop = isDesktopApp();
  const native = useNativeDownloads();

  const [demoItems, setDemoItems] = useState<DisplayItem[]>(DEMO_DOWNLOADS);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [downloadsPath, setDownloadsPath] = useState<string>('');

  useEffect(() => {
    if (!desktop) return;
    void import('@/src/lib/desktop').then(({ desktopBridge }) =>
      desktopBridge()
        ?.app.getInfo()
        .then((info) => setDownloadsPath(info.downloadsPath)),
    );
  }, [desktop]);

  // Progreso animado únicamente para las filas de demostración (edición web).
  useEffect(() => {
    if (desktop) return;
    const interval = setInterval(() => {
      setDemoItems((prev) =>
        prev.map((item) => {
          if (item.status !== 'downloading') return item;
          const speed = Math.max(200 * 1024, item.speedBps * (0.92 + Math.random() * 0.16));
          const received = Math.min(item.sizeBytes, item.receivedBytes + speed / 6);
          const finished = received >= item.sizeBytes;
          return {
            ...item,
            receivedBytes: received,
            speedBps: finished ? 0 : speed,
            status: finished ? 'completed' : 'downloading',
          };
        }),
      );
    }, 400);
    return () => clearInterval(interval);
  }, [desktop]);

  /** Traduce los registros nativos al modelo de la interfaz. */
  const nativeItems: DisplayItem[] = useMemo(() => {
    if (!native) return [];
    return native.items
      .map((record) => {
        const status: DownloadStatus =
          record.state === 'progressing'
            ? 'downloading'
            : record.state === 'paused'
              ? 'paused'
              : record.state === 'completed'
                ? 'completed'
                : record.state === 'cancelled'
                  ? 'canceled'
                  : 'error';

        return {
          id: record.id,
          filename: record.filename,
          url: record.url,
          sizeBytes: record.totalBytes,
          receivedBytes: record.receivedBytes,
          speedBps: record.speedBps,
          status,
          category: categorizeFilename(record.filename),
          location: record.savePath,
          simulated: false,
        } satisfies DisplayItem;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [native]);

  const items = desktop ? nativeItems : demoItems;

  const handleTogglePause = (item: DisplayItem) => {
    if (!item.simulated && native) {
      void native.control(item.id, item.status === 'paused' ? 'resume' : 'pause');
      return;
    }
    setDemoItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? { ...row, status: row.status === 'downloading' ? 'paused' : 'downloading', speedBps: row.status === 'downloading' ? 0 : 4 * MB }
          : row,
      ),
    );
  };

  const handleCancel = (item: DisplayItem) => {
    if (!item.simulated && native) {
      void native.control(item.id, 'cancel');
      return;
    }
    setDemoItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: 'canceled', speedBps: 0 } : row)));
  };

  const handleRemove = (item: DisplayItem) => {
    if (!item.simulated && native) {
      // Las descargas nativas en curso no se borran: se cancelan primero.
      if (item.status === 'downloading' || item.status === 'paused') {
        void native.control(item.id, 'cancel');
      }
      void native.clearFinished();
      return;
    }
    setDemoItems((prev) => prev.filter((row) => row.id !== item.id));
  };

  const handleOpenLocation = (item: DisplayItem) => {
    if (!item.simulated && native) {
      if (item.status === 'completed') void native.openFile(item.id);
      else void native.showInFolder(item.id);
      return;
    }
    void import('@/src/lib/desktop').then(({ openExternal }) => openExternal(item.url));
  };

  const handleAddDownload = (event: React.FormEvent) => {
    event.preventDefault();
    const target = customUrl.trim();
    if (!target) return;

    if (desktop) {
      startDownload(target);
    } else {
      const filename = target.split('/').pop() || 'archivo-descargado.bin';
      setDemoItems((prev) => [
        {
          id: `demo-${Date.now()}`,
          filename,
          url: target,
          sizeBytes: (20 + Math.floor(Math.random() * 200)) * MB,
          receivedBytes: 0,
          speedBps: 4 * MB,
          status: 'downloading',
          category: categorizeFilename(filename),
          location: 'Demostración de interfaz',
          simulated: true,
        },
        ...prev,
      ]);
    }

    setCustomUrl('');
    setIsAddingCustom(false);
  };

  const getCategoryIcon = (category: DisplayItem['category']) => {
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

  const filteredDownloads = items.filter((item) => {
    if (filter === 'active') return item.status === 'downloading' || item.status === 'paused';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const activeCount = items.filter((item) => item.status === 'downloading').length;
  const totalSpeed = items
    .filter((item) => item.status === 'downloading')
    .reduce((accumulator, item) => accumulator + item.speedBps, 0);

  const formatProgress = (item: DisplayItem) => {
    const percent = item.sizeBytes > 0 ? Math.min(100, Math.round((item.receivedBytes / item.sizeBytes) * 100)) : 0;
    const size = item.sizeBytes > 0 ? formatBytes(item.sizeBytes) : 'tamaño desconocido';
    return { percent, label: `${formatBytes(item.receivedBytes)} / ${size} (${percent}%)` };
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#121316] font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#18191d] p-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 p-1.5 text-brand-cyan">
            <Download size={15} />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              Gestor de Descargas
              {activeCount > 0 && (
                <span className="animate-pulse rounded-full bg-brand-cyan px-1.5 py-0.2 font-mono text-[9px] font-extrabold text-black">
                  {activeCount}
                </span>
              )}
              <span
                className={cn(
                  'rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider',
                  desktop
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-400',
                )}
                title={
                  desktop
                    ? 'Los ficheros se escriben de verdad en tu carpeta de Descargas'
                    : 'La edición web no puede escribir en tu disco: estas filas son una demostración'
                }
              >
                {desktop ? 'Nativo' : 'Simulación'}
              </span>
            </h3>
            <p className="font-mono text-[9px] text-gray-400">
              {totalSpeed > 0 ? `Velocidad total: ${formatSpeed(totalSpeed)}` : 'Sin descargas activas'}
            </p>
          </div>
        </div>

        {desktop ? (
          <button
            type="button"
            onClick={() => void import('@/src/lib/desktop').then(({ desktopBridge }) => desktopBridge()?.app.openDownloadsFolder())}
            className="flex cursor-pointer items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] font-bold text-gray-300 transition-all hover:bg-white/10"
            title={downloadsPath ? `Abrir ${downloadsPath}` : 'Abrir la carpeta de descargas'}
          >
            <FolderDown size={11} />
            <span>CARPETA</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded border border-white/5 bg-white/5 px-2 py-1 font-mono text-[9px] font-bold text-gray-500">
            <Zap size={11} />
            <span>TURBO</span>
          </span>
        )}
      </div>

      {/* Aviso honesto por entorno */}
      <div
        className={cn(
          'flex items-start gap-2 border-b px-3 py-1.5 text-[9px] leading-relaxed',
          desktop
            ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200/80'
            : 'border-amber-500/20 bg-amber-500/[0.06] text-amber-100/80',
        )}
      >
        {desktop ? <Info size={11} className="mt-0.5 shrink-0" /> : <MonitorDown size={11} className="mt-0.5 shrink-0" />}
        {desktop ? (
          <span>
            Descargas reales a disco en <span className="font-mono">{downloadsPath || 'tu carpeta de Descargas'}</span>.
            Pausa, reanuda y abre los ficheros desde aquí.
          </span>
        ) : (
          <span>
            Estas filas son una <span className="font-bold">demostración de interfaz</span>: el navegador no puede
            escribir en tu disco. La <span className="font-semibold">Edición de Escritorio</span> descarga los ficheros
            de verdad y permite pausarlos y abrirlos.
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0f1013] px-3 py-1.5 text-[9px]">
        <div className="flex items-center gap-1 font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 transition-colors',
              filter === 'all' ? 'bg-white/10 font-bold text-white' : 'text-gray-400 hover:text-white',
            )}
          >
            Todas ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 transition-colors',
              filter === 'active' ? 'bg-brand-cyan/20 font-bold text-brand-cyan' : 'text-gray-400 hover:text-white',
            )}
          >
            Activas ({items.filter((item) => item.status === 'downloading' || item.status === 'paused').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 transition-colors',
              filter === 'completed' ? 'bg-emerald-500/20 font-bold text-emerald-400' : 'text-gray-400 hover:text-white',
            )}
          >
            Listas ({items.filter((item) => item.status === 'completed').length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingCustom(!isAddingCustom)}
          className="cursor-pointer rounded bg-white/5 p-1 text-brand-cyan transition-colors hover:bg-white/10"
          title="Descargar una URL"
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
            className="space-y-2 border-b border-brand-cyan/20 bg-brand-cyan/5 p-2.5 font-mono text-[10px]"
          >
            <div className="flex items-center justify-between font-bold text-brand-cyan">
              <span>Descargar una URL:</span>
              <button type="button" onClick={() => setIsAddingCustom(false)} className="text-gray-400 hover:text-white">
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              placeholder="https://servidor.com/archivo.zip"
              value={customUrl}
              onChange={(event) => setCustomUrl(event.target.value)}
              className="w-full rounded border border-white/10 bg-[#0a0b0d] px-2 py-1 text-[10px] text-white outline-none focus:border-brand-cyan"
            />
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-1 rounded bg-brand-cyan py-1 font-bold text-black transition-opacity hover:opacity-90"
            >
              <Download size={11} />
              {desktop ? 'Descargar a disco' : 'Añadir a la demostración'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Downloads List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {filteredDownloads.length > 0 ? (
          filteredDownloads.map((item) => {
            const { percent, label } = formatProgress(item);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="group space-y-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5 transition-all hover:border-white/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="shrink-0 rounded-lg bg-white/5 p-1.5">{getCategoryIcon(item.category)}</div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white transition-colors group-hover:text-brand-cyan">
                        {item.filename}
                      </p>
                      <p className="truncate font-mono text-[9px] text-gray-500" title={item.location}>
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {item.status === 'downloading' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(item)}
                        className="cursor-pointer rounded border border-amber-500/30 bg-amber-500/10 p-1 text-amber-400 transition-colors hover:bg-amber-500/20"
                        title="Pausar"
                      >
                        <Pause size={12} />
                      </button>
                    )}

                    {item.status === 'paused' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(item)}
                        className="cursor-pointer rounded border border-emerald-500/30 bg-emerald-500/10 p-1 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        title="Reanudar"
                      >
                        <Play size={12} />
                      </button>
                    )}

                    {(item.status === 'downloading' || item.status === 'paused') && (
                      <button
                        type="button"
                        onClick={() => handleCancel(item)}
                        className="cursor-pointer rounded border border-rose-500/30 bg-rose-500/10 p-1 text-rose-400 transition-colors hover:bg-rose-500/20"
                        title="Cancelar"
                      >
                        <X size={12} />
                      </button>
                    )}

                    {item.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleOpenLocation(item)}
                        className="cursor-pointer rounded bg-white/5 p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        title={item.simulated ? 'Abrir el origen del ejemplo' : 'Abrir el fichero descargado'}
                      >
                        <FolderOpen size={12} />
                      </button>
                    )}

                    {item.status === 'error' && (
                      <button
                        type="button"
                        onClick={() => native?.control(item.id, 'retry')}
                        className="cursor-pointer rounded border border-amber-500/30 bg-amber-500/10 p-1 text-amber-400 transition-colors hover:bg-amber-500/20"
                        title="Reintentar"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="cursor-pointer rounded p-1 text-gray-600 transition-colors hover:text-gray-300"
                      title="Quitar de la lista"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[9px]">
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-black/40 p-0.5">
                    <motion.div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        item.status === 'downloading' && 'bg-gradient-to-r from-brand-cyan to-brand-magenta',
                        item.status === 'paused' && 'bg-amber-400',
                        item.status === 'completed' && 'bg-emerald-400',
                        item.status === 'canceled' && 'bg-rose-500',
                        item.status === 'error' && 'bg-rose-400',
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>{label}</span>

                    {item.status === 'downloading' && (
                      <span className="flex items-center gap-1 font-bold text-brand-cyan">
                        <Zap size={9} className="fill-brand-cyan" />
                        {formatSpeed(item.speedBps)}
                      </span>
                    )}

                    {item.status === 'paused' && <span className="font-bold text-amber-400">Pausado</span>}

                    {item.status === 'completed' && (
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 size={10} /> Completado
                      </span>
                    )}

                    {item.status === 'canceled' && (
                      <span className="flex items-center gap-1 font-bold text-rose-400">
                        <AlertCircle size={10} /> Cancelado
                      </span>
                    )}

                    {item.status === 'error' && (
                      <span className="flex items-center gap-1 font-bold text-rose-300">
                        <AlertCircle size={10} /> Interrumpido
                      </span>
                    )}

                    {item.simulated && (
                      <span className="rounded border border-amber-500/30 px-1 text-[8px] font-bold uppercase tracking-wider text-amber-400/80">
                        Demo
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="space-y-2 py-8 text-center text-gray-500">
            <Download size={24} className="mx-auto text-gray-600" />
            <p className="text-xs font-bold text-gray-400">Sin descargas registradas</p>
            <p className="font-mono text-[10px]">
              {desktop
                ? 'Los ficheros que descargues con el navegador aparecerán aquí.'
                : 'La edición web no puede descargar a disco.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-white/5 bg-[#0d0e11] p-2 font-mono text-[9px] text-gray-500">
        <span>{desktop ? 'Motor de descargas nativo (Electron)' : 'Gestor en modo demostración'}</span>
        <span className={desktop ? 'text-emerald-400' : 'text-amber-400'}>
          {desktop ? 'Escritura directa a disco' : 'Sin acceso al disco'}
        </span>
      </div>
    </div>
  );
}
