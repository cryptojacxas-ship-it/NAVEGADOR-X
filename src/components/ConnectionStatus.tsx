import { Lock } from 'lucide-react';

export function ConnectionStatus() {
  return (
    <div className="card p-8 flex flex-col items-center text-center">
      <h2 className="panel-header w-full text-left mb-6">Native Connection</h2>
      <div className="relative h-32 w-32 rounded-full border-4 border-border-subtle flex items-center justify-center bg-[#141418] mb-6">
        <div className="absolute inset-0 rounded-full border-t-4 border-brand-cyan rotate-45 animate-pulse" />
        <Lock size={32} className="text-brand-cyan" />
      </div>
      <div className="space-y-2">
        <div className="text-lg font-bold text-white uppercase tracking-tighter">Zúrich, Suiza</div>
        <div className="px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-[10px] text-brand-cyan font-bold uppercase tracking-widest">
          SECURE_NODE_122
        </div>
      </div>
      <button className="btn-primary w-full mt-8 !text-[10px] uppercase tracking-[0.2em]">Sincronizar</button>
    </div>
  );
}
