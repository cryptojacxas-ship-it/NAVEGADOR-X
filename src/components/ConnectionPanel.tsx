import { useState } from 'react';

interface Server {
  id: string;
  name: string;
  country: string;
  latency: number;
  load: number;
  protocols: string[];
}

interface ConnectionPanelProps {
  server: Server;
  onConnect: (id: string, protocol: string) => void;
  onDisconnect: () => void;
  onProtocolChange: (protocol: string) => void;
}

export function ConnectionPanel({ server, onConnect, onDisconnect, onProtocolChange }: ConnectionPanelProps) {
  const [protocol, setProtocol] = useState(server.protocols[0] || 'wireguard');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [connected, setConnected] = useState(false);

  const handleToggle = () => {
    if (connected) { 
      onDisconnect(); 
      setConnected(false); 
    } else { 
      onConnect(server.id, protocol); 
      setConnected(true); 
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-white">{server.name}</p>
          <p className="text-xs text-gray-500">{server.latency}ms · {server.load}% carga</p>
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
          connected ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-white/5 text-gray-600'
        }`}>
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {/* Barra de carga del servidor */}
      <div className="w-full bg-[#141418] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-grad-x transition-all duration-1000"
          style={{ width: `${server.load}%` }}
        />
      </div>

      {/* Selección de protocolo */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-600 ml-1">Protocolo</label>
        <select
          value={protocol}
          onChange={e => { setProtocol(e.target.value); onProtocolChange(e.target.value); }}
          className="w-full bg-space-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-hidden focus:border-brand-magenta/40 transition-colors"
          aria-label="Seleccionar protocolo VPN"
        >
          {server.protocols.map(p => (
            <option key={p} value={p}>{p.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Auto-reconexión */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={autoReconnect}
          onChange={e => setAutoReconnect(e.target.checked)}
          className="rounded border-white/10 bg-space-black text-brand-cyan focus:ring-brand-cyan/20"
        />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">Auto-reconexión</span>
      </label>

      {/* Botón principal */}
      <button
        onClick={handleToggle}
        className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
          connected
            ? 'bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20 hover:bg-brand-magenta/20'
            : 'btn-primary !py-3.5 text-black'
        }`}
        aria-label={connected ? 'Desconectar VPN' : 'Conectar VPN'}
      >
        {connected ? '⏹ Desconectar' : '▶ Conectar VPN'}
      </button>
    </div>
  );
}
