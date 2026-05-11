import { Cpu, Globe } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const sparkData = [
  { val: 10 }, { val: 15 }, { val: 12 }, { val: 20 }, { val: 18 }, { val: 25 }, { val: 22 }
];

export function QuickStats() {
  return (
    <div className="card relative overflow-hidden flex flex-col p-8">
      <div className="absolute top-0 left-0 w-full h-1 bg-grad-x" />
      <h2 className="panel-header mb-8">System Throughput</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-brand-magenta/10 text-brand-magenta">
                 <Cpu size={18} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Hashrate X</span>
             </div>
             <div className="text-xl font-mono font-bold text-white">482.5 <span className="text-[10px] text-gray-600">MH/s</span></div>
           </div>
           <div className="h-16 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={sparkData}>
                 <Area type="monotone" dataKey="val" stroke="#ff3cac" fill="#ff3cac20" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-brand-cyan/10 text-brand-cyan">
                 <Globe size={18} />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Tráfico VPN</span>
             </div>
             <div className="text-xl font-mono font-bold text-white">1.2 <span className="text-[10px] text-gray-600">GB</span></div>
           </div>
           <div className="h-16 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={sparkData}>
                 <Area type="monotone" dataKey="val" stroke="#00d2ff" fill="#00d2ff20" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
