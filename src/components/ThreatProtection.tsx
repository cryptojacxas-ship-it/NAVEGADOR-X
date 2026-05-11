import { Shield, CheckCircle2 } from 'lucide-react';

export function ThreatProtection() {
  const threats = [
    { label: 'Scripts Maliciosos', count: 12, status: 'blocked' },
    { label: 'Rastreadores Red', count: 45, status: 'blocked' },
    { label: 'Fugas de Datos', count: 0, status: 'clean' },
  ];

  return (
    <div className="card p-8">
      <h2 className="panel-header mb-6">Threat Protection</h2>
      <div className="space-y-4">
        {threats.map((t, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400">{t.label}</span>
              <span className="text-[9px] text-gray-600 uppercase font-mono tracking-widest">{t.count} Filtrados</span>
            </div>
            {t.status === 'blocked' ? (
              <Shield size={16} className="text-brand-magenta" />
            ) : (
              <CheckCircle2 size={16} className="text-brand-cyan" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
