/**
 * DesktopTitleBar — barra de título nativa de la Edición de Escritorio.
 *
 * Sustituye el marco del sistema (`titleBarStyle: 'hidden'`) por una barra propia
 * que respeta el estilo del producto, manteniendo el arrastre de ventana y los
 * controles de minimizar / maximizar / cerrar.
 */

import React from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { desktopBridge, isDesktopApp } from '@/src/lib/desktop';

const dragStyle: React.CSSProperties = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragStyle: React.CSSProperties = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function DesktopTitleBar() {
  const desktop = isDesktopApp();
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [pageTitle, setPageTitle] = React.useState('');

  React.useEffect(() => {
    const bridge = desktopBridge();
    if (!bridge) return;

    void bridge.window.isMaximized().then(setIsMaximized);
    const offMaximized = bridge.window.onMaximizedChanged(setIsMaximized);

    // El título de la pestaña activa se refleja en la barra, como en un navegador real.
    const unsubscribe = import('@/src/kernel/BrowserKernel').then(({ kernel }) =>
      kernel.eventBus.subscribe('viewport.title', (event) => {
        const payload = event.payload as { title?: string };
        setPageTitle(payload?.title || '');
      }),
    );

    return () => {
      offMaximized();
      void unsubscribe.then((off) => off?.());
    };
  }, []);

  if (!desktop) return null;

  const bridge = desktopBridge();

  return (
    <div
      style={dragStyle}
      className="relative z-[60] flex h-8 w-full shrink-0 select-none items-center justify-between border-b border-white/5 bg-[#08090d] pl-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center rounded bg-grad-x p-[1px]">
          <div className="flex h-full w-full items-center justify-center rounded bg-black text-[7px] font-black text-white">
            X
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Navegador X</span>
        {pageTitle && (
          <>
            <span className="text-gray-700">·</span>
            <span className="truncate text-[10px] text-gray-500" style={{ maxWidth: '320px' }}>
              {pageTitle}
            </span>
          </>
        )}
      </div>

      <div className="flex h-full" style={noDragStyle}>
        <button
          type="button"
          onClick={() => bridge?.window.minimize()}
          className="flex h-full w-11 items-center justify-center text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Minimizar"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          onClick={() => bridge?.window.maximizeToggle()}
          className="flex h-full w-11 items-center justify-center text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>
        <button
          type="button"
          onClick={() => bridge?.window.close()}
          className="flex h-full w-11 items-center justify-center text-gray-400 transition-colors hover:bg-rose-600 hover:text-white"
          title="Cerrar"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
