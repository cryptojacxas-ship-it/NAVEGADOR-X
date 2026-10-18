/**
 * useNativeDownloads — descargas reales a disco (solo Edición de Escritorio).
 *
 * El proceso principal intercepta `will-download` de Electron y emite el progreso
 * real; aquí solo se mantiene el estado de la interfaz y se reenvían las órdenes
 * (pausar, reanudar, cancelar, abrir).
 *
 * Devuelve `null` cuando la aplicación corre en el navegador, para que el gestor
 * de descargas sepa que debe usar su modo de demostración.
 */

import { useCallback, useEffect, useState } from 'react';
import { desktopBridge, isDesktopApp } from '@/src/lib/desktop';
import type { NativeDownloadRecord } from '@/src/types/desktop';

export interface NativeDownloadsApi {
  items: NativeDownloadRecord[];
  control: (id: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => Promise<void>;
  openFile: (id: string) => Promise<void>;
  showInFolder: (id: string) => Promise<void>;
  clearFinished: () => Promise<void>;
  start: (url: string) => void;
}

export function useNativeDownloads(): NativeDownloadsApi | null {
  const desktop = isDesktopApp();
  const [items, setItems] = useState<NativeDownloadRecord[]>([]);

  useEffect(() => {
    const bridge = desktopBridge();
    if (!bridge) return;

    let active = true;

    void bridge.downloads.list().then((records) => {
      if (active && Array.isArray(records)) setItems(records);
    });

    const unsubscribe = bridge.downloads.onUpdate((record) => {
      if (!record || typeof record !== 'object') return;
      setItems((prev) => {
        const index = prev.findIndex((item) => item.id === (record as NativeDownloadRecord).id);
        if (index === -1) return [record as NativeDownloadRecord, ...prev];
        const next = [...prev];
        next[index] = { ...next[index], ...(record as NativeDownloadRecord) };
        return next;
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [desktop]);

  const control = useCallback(async (id: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    const bridge = desktopBridge();
    if (!bridge) return;
    const result = await bridge.downloads.control(id, action);
    if (!result?.ok && action === 'retry') {
      // Un reintento fallido deja el registro tal cual; el usuario puede cancelarlo.
      console.warn('[Descargas] No se pudo reintentar:', result?.reason);
    }
  }, []);

  const openFile = useCallback(async (id: string) => {
    await desktopBridge()?.downloads.openFile(id);
  }, []);

  const showInFolder = useCallback(async (id: string) => {
    await desktopBridge()?.downloads.showInFolder(id);
  }, []);

  const clearFinished = useCallback(async () => {
    const bridge = desktopBridge();
    if (!bridge) return;
    const remaining = await bridge.downloads.clearFinished();
    if (Array.isArray(remaining)) setItems(remaining);
  }, []);

  const start = useCallback((url: string) => {
    desktopBridge()?.downloads.start(url);
  }, []);

  if (!desktop) return null;

  return { items, control, openFile, showInFolder, clearFinished, start };
}

/** Formatea bytes a una unidad legible. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${units[exponent]}`;
}

/** Formatea una tasa de transferencia en bytes por segundo. */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/** Categoría visual a partir de la extensión del fichero. */
export function categorizeFilename(filename: string): 'code' | 'archive' | 'media' | 'document' | 'system' {
  const extension = (filename.split('.').pop() || '').toLowerCase();
  if (['zip', 'rar', '7z', 'tar', 'gz', 'iso', 'dmg'].includes(extension)) return 'archive';
  if (['mp4', 'mkv', 'avi', 'mov', 'mp3', 'wav', 'flac', 'webm'].includes(extension)) return 'media';
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'csv', 'ppt', 'pptx'].includes(extension)) return 'document';
  if (['js', 'ts', 'tsx', 'json', 'exe', 'msi', 'dll', 'bin', 'py', 'wasm'].includes(extension)) return 'code';
  return 'system';
}
