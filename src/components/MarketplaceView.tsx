import { ShoppingBag, Star, Zap, Image as ImageIcon, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const ITEMS = [
  {
    id: 'skin-01',
    name: 'Cyber Neon',
    category: 'Skin',
    price: '0.45 XCOIN',
    description: 'Estética retro-futurista con efectos neon vibrantes.',
    icon: <Zap size={20} className="text-brand-magenta" />
  },
  {
    id: 'theme-02',
    name: 'Ghost Protocol',
    category: 'Theme',
    price: '0.80 XCOIN',
    description: 'Modo minimalista con tipografía técnica y contraste ultra-limpio.',
    icon: <Palette size={20} className="text-brand-cyan" />
  },
  {
    id: 'skin-03',
    name: 'Operador Carmesí',
    category: 'Skin',
    price: '0.60 XCOIN',
    description: 'Interface roja profunda diseñada para sesiones nocturnas tácticas.',
    icon: <ImageIcon size={20} className="text-brand-magenta" />
  }
];

export function MarketplaceView() {
  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12">
      <div className="flex items-end justify-between border-b border-border-subtle pb-6">
        <div className="space-y-1">
          <h2 className="text-sm font-bold tracking-[0.3em] text-gray-500 uppercase">Exclusive Assets</h2>
          <p className="text-3xl font-light text-white">X-Market <span className="text-brand-cyan">Exploration</span></p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
             <div className="text-[10px] uppercase font-mono tracking-tighter text-gray-600">Balance Disponible</div>
             <div className="text-xl font-bold font-mono text-brand-magenta">2.420 XCOIN</div>
           </div>
           <div className="p-3 rounded-full bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta">
             <ShoppingBag size={20} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group flex flex-col p-8 hover:border-brand-cyan/30 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-6">
               <div className="p-4 rounded-2xl bg-[#141418] border border-white/5 group-hover:border-brand-magenta/30 transition-all">
                 {item.icon}
               </div>
               <span className="text-[10px] font-bold font-mono text-white/40 uppercase tracking-[0.2em]">{item.category}</span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">{item.name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-mono mb-8 line-clamp-2">
              {item.description}
            </p>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="text-sm font-bold font-mono text-brand-cyan">{item.price}</div>
               <button className="px-4 py-2 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:bg-brand-magenta hover:text-black transition-all">
                 Adquirir
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10 flex flex-col md:flex-row items-center gap-8">
         <div className="p-4 rounded-2xl bg-brand-cyan/10 text-brand-cyan">
           <Star size={32} />
         </div>
         <div className="flex-1 space-y-2">
           <h4 className="text-lg font-bold text-white uppercase tracking-tight">X-Platinum Subscription</h4>
           <p className="text-xs text-gray-500 font-mono leading-relaxed">
             Desbloquea todos los servidores VPN Premium, acceso ilimitado al marketplace y desactiva la minería de fondo para mayor rendimiento térmico.
           </p>
         </div>
         <button className="btn-primary whitespace-nowrap !py-3 !px-8 text-black">Suscribirse • 4.99€</button>
      </div>
    </div>
  );
}
