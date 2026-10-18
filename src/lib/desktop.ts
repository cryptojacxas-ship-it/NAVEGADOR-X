/**
 * Acceso único al puente nativo del shell de escritorio.
 *
 * Toda la aplicación debe consultar estas funciones en lugar de tocar
 * `window.navegadorX` directamente, para que la edición web siga funcionando
 * sin ramas condicionales repartidas por los componentes.
 */

import type { NavegadorXBridge } from '@/src/types/desktop';

/** Partición de sesión compartida por todas las pestañas del navegador. */
export const SHARED_PARTITION = 'persist:navegadorx';

/**
 * Partición dedicada de una pestaña: cookies y ruta de red propias.
 *
 * Sirve para enrutar una sola pestaña por un proxy distinto sin afectar al resto.
 * El nombre se sanea igual que en el proceso principal, que valida el patrón.
 */
export function partitionForTab(tabId: string): string {
  const safe = tabId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'tab';
  return `${SHARED_PARTITION}-tab-${safe}`;
}

/** Devuelve el puente nativo si estamos dentro del shell de escritorio. */
export function desktopBridge(): NavegadorXBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.navegadorX;
}

/** ¿Se está ejecutando dentro de la aplicación de escritorio (Electron)? */
export function isDesktopApp(): boolean {
  return Boolean(desktopBridge()?.isDesktop);
}

/** Nombre legible del contenedor para paneles de estado. */
export function runtimeHostName(): string {
  return isDesktopApp() ? 'Electron Desktop Runtime' : 'Web Runtime (SPA)';
}

/**
 * Abre una URL fuera de la aplicación.
 * En escritorio usa el navegador del sistema; en web, una pestaña nueva.
 */
export async function openExternal(url: string): Promise<void> {
  const bridge = desktopBridge();
  if (bridge) {
    await bridge.app.openExternal(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Descarga un fichero: descarga nativa en escritorio, navegación simple en web. */
export function startDownload(url: string): void {
  const bridge = desktopBridge();
  if (bridge) {
    bridge.downloads.start(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
