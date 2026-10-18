import React, { useState } from 'react';
import { Search, Plus, LayoutGrid, Star, Clock, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  onNavigate: (url: string) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const topSites = [
    { name: 'Google', url: 'https://google.com', icon: 'G' },
    { name: 'GitHub', url: 'https://github.com', icon: 'GH' },
    { name: 'X', url: 'https://x.com', icon: 'X' },
    { name: 'Gemini', url: 'https://gemini.google.com', icon: 'AI' },
    { name: 'YouTube', url: 'https://youtube.com', icon: 'Y' },
    { name: 'Vite', url: 'https://vitejs.dev', icon: 'V' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-20 bg-linear-to-b from-space-black to-[#0f1720]">
      {/* Hero Logo */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-12 flex flex-col items-center"
      >
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-grad-x shadow-[0_0_80px_rgba(255,60,172,0.15)]">
          <span className="text-5xl font-black text-black">X</span>
        </div>
        <h1 className="text-4xl font-light tracking-tighter text-white">
          Navegador <span className="gradient-text font-bold">X</span>
        </h1>
        <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Integrated Intelligence</p>
      </motion.div>

      {/* Main Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-xl mb-16 px-4">
        <div className="relative flex items-center group">
          <Search className="absolute left-6 text-gray-600 group-focus-within:text-brand-magenta transition-colors" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar o escribir comando..."
            className="w-full h-14 pl-14 pr-6 rounded-xl bg-card-bg border border-border-panel text-sm text-text-main focus:border-brand-magenta/40 transition-all outline-hidden font-mono"
          />
        </div>
      </form>

      {/* Speed Dial / Top Sites */}
      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 px-4">
        {topSites.map((site, i) => (
          <motion.button
            key={site.name}
            onClick={() => onNavigate(site.url)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-center gap-3 card p-3 rounded-xl hover:border-white/20 transition-all text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-[#0b0f14] border border-[#1a222c] flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-brand-cyan transition-all">
              {site.icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
              {site.name}
            </span>
          </motion.button>
        ))}
        <button className="group flex items-center gap-3 card !border-dashed p-3 rounded-xl hover:border-brand-cyan/40 transition-all outline-hidden">
          <div className="h-10 w-10 rounded-lg bg-[#0b0f14] flex items-center justify-center text-gray-700 group-hover:text-brand-cyan">
            <Plus size={16} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700 group-hover:text-brand-cyan">
            Nuevo
          </span>
        </button>
      </div>

      {/* Footer Features */}
      <div className="mt-20 flex gap-12 text-white/20">
        <div className="flex items-center gap-2 hover:text-white/40 cursor-pointer transition-colors">
          <Star size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Favoritos</span>
        </div>
        <div className="flex items-center gap-2 hover:text-white/40 cursor-pointer transition-colors">
          <Flame size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Tendencias</span>
        </div>
        <div className="flex items-center gap-2 hover:text-white/40 cursor-pointer transition-colors">
          <LayoutGrid size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Noticias</span>
        </div>
      </div>
    </div>
  );
}
