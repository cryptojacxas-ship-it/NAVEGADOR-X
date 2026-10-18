/**
 * ErrorBoundary — barrera de errores de la interfaz.
 *
 * Un navegador no puede quedarse en blanco porque un panel falle. Esta barrera
 * captura cualquier excepción de renderizado, la muestra de forma legible y ofrece
 * recuperar la sesión sin cerrar la aplicación.
 */

import React from 'react';
import { AlertOctagon, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  info: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, info: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[NavegadorX] Error no controlado en la interfaz:', error, errorInfo.componentStack);
    this.setState({ info: errorInfo.componentStack || '' });
  }

  private handleRetry = () => {
    this.setState({ error: null, info: '' });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error, info } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#05060a] p-8 text-white">
        <div className="w-full max-w-2xl rounded-2xl border border-rose-500/25 bg-[#0d1016] p-8 shadow-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10">
              <AlertOctagon size={20} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-base font-bold">La interfaz encontró un error</h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Navegador X · Runtime OS
              </p>
            </div>
          </div>

          <p className="mb-4 text-[12px] leading-relaxed text-gray-400">
            El componente afectado ha sido aislado para que el resto del navegador siga funcionando. Puedes reintentar
            volver a montarlo o recargar la aplicación completa.
          </p>

          <pre className="mb-5 max-h-48 overflow-auto rounded-xl border border-white/5 bg-[#080a0f] p-4 font-mono text-[10px] leading-relaxed text-rose-300/90">
            {error.message}
            {info ? `\n${info.trim().split('\n').slice(0, 6).join('\n')}` : ''}
          </pre>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center gap-2 rounded-lg border border-brand-cyan/40 bg-brand-cyan/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-cyan transition-colors hover:bg-brand-cyan/25"
            >
              <RotateCcw size={12} /> Reintentar
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/10"
            >
              <RefreshCw size={12} /> Recargar la aplicación
            </button>
          </div>
        </div>
      </div>
    );
  }
}
