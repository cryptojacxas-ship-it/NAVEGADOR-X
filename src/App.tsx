import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Shield, 
  Cpu, 
  Sparkles, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Plus, 
  LayoutGrid, 
  History, 
  Settings,
  ChevronRight,
  Wifi,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { HomeView } from './components/HomeView';
import { VPNDashboard } from './components/VPNDashboard';
import { MinerDashboard } from './components/MinerDashboard';
import { AIChat } from './components/AIChat';
import { DashboardView } from './components/DashboardView';
import { MarketplaceView } from './components/MarketplaceView';
import { BrowserMaskedPage } from './components/BrowserMaskedPage';
import { AdminPanel } from './components/AdminPanel';
import { auth, signInWithGoogle, logout as firebaseLogout, ensureUserProfile, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

type Tab = 'dashboard' | 'home' | 'vpn' | 'miner' | 'ai' | 'marketplace' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [url, setUrl] = useState('navegador://dashboard');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browsingUrl, setBrowsingUrl] = useState('');

  const navigateTo = (newUrl: string) => {
    setBrowsingUrl(newUrl);
    setIsBrowsing(true);
    setUrl(newUrl);
    setActiveTab('home');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        ensureUserProfile(u);
        // Sync role from Firestore
        const userRef = doc(db, 'users', u.uid);
        const unsubDoc = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const role = snap.data().role;
            setIsAdmin(role === 'admin' || role === 'root' || u.email === 'cryptojacxas@gmail.com');
          }
        });
        return () => unsubDoc();
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'home', icon: Globe, label: 'Navegar' },
    { id: 'marketplace', icon: ShoppingBag, label: 'Mercado' },
    { id: 'vpn', icon: Shield, label: 'VPN X' },
    { id: 'miner', icon: Cpu, label: 'Minería' },
    { id: 'ai', icon: Sparkles, label: 'IA X' },
  ] as const;

  const adminTab = { id: 'admin', icon: ShieldCheck, label: 'Admin Panel' } as const;

  useEffect(() => {
    if (activeTab === 'dashboard') setUrl('navegador://dashboard');
    if (activeTab === 'home') setUrl(isBrowsing ? browsingUrl : 'navegador://inicio');
    if (activeTab === 'vpn') setUrl('navegador://vpn');
    if (activeTab === 'miner') setUrl('navegador://mineria');
    if (activeTab === 'ai') setUrl('navegador://ia');
    if (activeTab === 'marketplace') setUrl('navegador://mercado');
    if (activeTab === 'admin') setUrl('navegador://admin');
  }, [activeTab, isBrowsing, browsingUrl]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.startsWith('navegador://') || url.startsWith('navigatorx://')) {
      // Internal pages
      const internalPage = url.replace('navegador://', '').replace('navigatorx://', '');
      if (internalPage === 'inicio' || internalPage === 'home') {
        setIsBrowsing(false);
        setActiveTab('home');
      } else if (tabs.find(t => t.id === internalPage)) {
        setActiveTab(internalPage as Tab);
      }
    } else {
      // External URL
      let cleanUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        cleanUrl = 'https://' + url;
      }
      navigateTo(cleanUrl);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-space-black text-text-main selection:bg-brand-magenta/30 selection:text-brand-cyan">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r border-border-subtle bg-sidebar-bg transition-all duration-300 ease-in-out z-50",
          isSidebarExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="flex h-16 items-center px-4 border-b border-border-subtle">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-x">
            <span className="font-bold text-black text-xs">X</span>
          </div>
          {isSidebarExpanded && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-3 font-bold tracking-tighter text-lg"
            >
              Navegador <span className="gradient-text">X</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-2 py-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "group relative flex w-full items-center rounded-xl px-2 py-3 transition-colors",
                  activeTab === tab.id 
                    ? "bg-white/5 text-brand-cyan" 
                    : "text-gray-500 hover:text-white"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  <Icon size={20} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                </div>
                {isSidebarExpanded && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 text-xs font-bold uppercase tracking-widest"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </button>
            );
          })}
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={cn(
                "group relative flex w-full items-center rounded-xl px-2 py-3 transition-colors border border-brand-magenta/10",
                activeTab === 'admin' 
                  ? "bg-brand-magenta/10 text-brand-magenta" 
                  : "text-gray-600 hover:text-brand-magenta"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                <ShieldCheck size={20} strokeWidth={activeTab === 'admin' ? 2 : 1.5} />
              </div>
              {isSidebarExpanded && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3 text-xs font-bold uppercase tracking-widest"
                >
                  Admin Panel
                </motion.span>
              )}
            </button>
          )}
        </nav>

        <div className="border-t border-border-subtle p-2 space-y-1">
          {user ? (
            <div className="px-2 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-grad-x flex items-center justify-center text-black font-bold text-xs uppercase">
                  {user.displayName?.[0] || user.email?.[0]}
                </div>
                {isSidebarExpanded && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[8px] font-mono text-gray-500 truncate">{user.email}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => firebaseLogout()}
                className="flex w-full items-center rounded-xl px-2 py-2 text-gray-600 hover:text-red-400 transition-colors bg-white/5"
              >
                <div className="flex h-4 w-8 items-center justify-center">
                  <LogOut size={14} />
                </div>
                {isSidebarExpanded && <span className="text-[9px] font-bold uppercase tracking-widest">Cerrar Sesión</span>}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signInWithGoogle()}
              className="group flex w-full items-center rounded-xl px-2 py-3 text-brand-cyan hover:bg-brand-cyan/10 transition-all border border-brand-cyan/20"
            >
              <div className="flex h-8 w-8 items-center justify-center">
                <UserIcon size={18} />
              </div>
              {isSidebarExpanded && <span className="ml-3 text-[10px] font-bold uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">Iniciar Sesión</span>}
            </button>
          )}
          <button className="flex w-full items-center rounded-xl px-2 py-3 text-gray-600 hover:text-white transition-colors">
            <div className="flex h-8 w-8 items-center justify-center">
              <History size={18} />
            </div>
            {isSidebarExpanded && <span className="ml-3 text-xs font-bold uppercase tracking-widest">Historial</span>}
          </button>
          <button className="flex w-full items-center rounded-xl px-2 py-3 text-gray-600 hover:text-white transition-colors">
            <div className="flex h-8 w-8 items-center justify-center">
              <Settings size={18} />
            </div>
            {isSidebarExpanded && <span className="ml-3 text-xs font-bold uppercase tracking-widest">Ajustes</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top bar (Address bar) */}
        <header className="flex h-10 items-center gap-4 border-b border-border-subtle bg-[#121214] px-4">
          <div className="flex items-center gap-1">
            <div className="flex space-x-1.5 mr-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
          </div>

          <div className="flex flex-1 items-center">
            <form onSubmit={handleUrlSubmit} className="group relative w-full max-w-xl mx-auto flex items-center">
              <div className="flex items-center bg-[#1e1e20] px-3 py-1 rounded-md border border-[#3a3a3c] w-full focus-within:border-brand-magenta/50 transition-colors">
                 <span className="text-[10px] text-gray-500 mr-2 font-mono">navigatorx://</span>
                 <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-transparent border-none outline-none text-[11px] w-full py-0.5 text-text-main font-mono"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <div className="h-5 w-5 rounded-full bg-grad-x opacity-80" />
               <span className="text-[10px] font-bold text-brand-magenta tracking-widest">X CORE</span>
             </div>
             
             <button 
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={cn(
                "group flex items-center gap-2 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase transition-all",
                isAiOpen 
                  ? "bg-brand-magenta text-black"
                  : "bg-white/5 text-gray-500 hover:text-white"
              )}
             >
               <Sparkles size={12} />
               IA Layer
             </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="relative flex-1 overflow-auto bg-space-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full w-full overflow-auto"
            >
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'home' && (
                isBrowsing 
                  ? <BrowserMaskedPage url={browsingUrl} onExit={() => setIsBrowsing(false)} /> 
                  : <HomeView onNavigate={navigateTo} />
              )}
              {activeTab === 'vpn' && <VPNDashboard />}
              {activeTab === 'miner' && <MinerDashboard />}
              {activeTab === 'ai' && <AIChat currentUrl={isBrowsing ? browsingUrl : undefined} />}
              {activeTab === 'marketplace' && <MarketplaceView />}
              {activeTab === 'admin' && <AdminPanel />}
            </motion.div>
          </AnimatePresence>

          {/* Contextual AI Panel Overlay (Floating) */}
          <AnimatePresence>
            {isAiOpen && activeTab !== 'ai' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-6 top-6 bottom-6 w-96 z-40"
              >
                <AIChat 
                  isFloating 
                  onClose={() => setIsAiOpen(false)} 
                  currentUrl={isBrowsing ? browsingUrl : undefined} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Full-screen AI Chat also needs the prop */}
      {/* Search for AI tab rendering */}
      {/* activeTab === 'ai' && <AIChat /> */}

      {/* Decorative Gradients */}
      <div className="fixed bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-brand-magenta/5 blur-[120px] pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-brand-cyan/5 blur-[120px] pointer-events-none" />
    </div>
  );
}
