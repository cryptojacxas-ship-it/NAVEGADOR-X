import React from 'react';
import { Plus, X, Globe, LayoutGrid, Terminal, Shield, Cpu, Sparkles, ShoppingBag, ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { TabSessionItem } from '../lib/sessionPersistenceService';

interface SessionTabBarProps {
  openTabs: TabSessionItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  isSessionSaved: boolean;
}

export function SessionTabBar({
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isSessionSaved
}: SessionTabBarProps) {
  const getTabIcon = (tabType: string) => {
    switch (tabType) {
      case 'dashboard': return LayoutGrid;
      case 'home': return Globe;
      case 'runtime': return Terminal;
      case 'vpn': return Shield;
      case 'miner': return Cpu;
      case 'ai': return Sparkles;
      case 'marketplace': return ShoppingBag;
      case 'admin': return ShieldCheck;
      default: return Globe;
    }
  };

  return (
    <div className="flex items-center gap-1 bg-[#0a0b0d] px-3 pt-1 border-b border-border-subtle overflow-x-auto scrollbar-none select-none">
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {openTabs.map((tab) => {
          const Icon = getTabIcon(tab.tabType);
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-[11px] font-mono cursor-pointer transition-all border-t border-x max-w-[200px] min-w-[120px] shrink-0",
                isActive
                  ? "bg-[#121214] border-brand-cyan/40 text-brand-cyan font-bold shadow-[0_-2px_10px_rgba(0,210,255,0.1)]"
                  : "bg-white/[0.02] hover:bg-white/[0.06] border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              <Icon size={12} className={cn("shrink-0", isActive ? "text-brand-cyan" : "text-gray-500")} />
              <span className="truncate flex-1 text-left">{tab.title || tab.url}</span>

              {openTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                  title="Cerrar pestaña"
                >
                  <X size={12} />
                </button>
              )}

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-cyan" />
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onNewTab}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer ml-1"
          title="Nueva Pestaña"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Persistence Badge */}
      <div 
        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono shrink-0 ml-2 mb-0.5"
        title="Estado de sesión persistido automáticamente en IndexedDB"
      >
        <Database size={10} className={isSessionSaved ? "text-emerald-400" : "animate-spin text-amber-400"} />
        <span className="hidden md:inline font-bold">IDB Sesión Activa</span>
      </div>
    </div>
  );
}
