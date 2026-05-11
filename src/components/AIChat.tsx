import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, User, Bot, Loader2, RefreshCcw, Maximize2, Settings, ChevronLeft, Check, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

const PERSONAS = [
  {
    id: 'concise',
    name: 'Conciso',
    description: 'Respuestas directas, breves y centradas en lo esencial.',
    systemPrompt: "Eres la IA contextual de Navegador X. Tus respuestas son extremadamente directas, breves y sin adornos. Te enfocas solo en los datos esenciales."
  },
  {
    id: 'creative',
    name: 'Creativo',
    description: 'Tono imaginativo, expansivo e inspirador.',
    systemPrompt: "Eres la IA contextual de Navegador X con un tono creativo e imaginativo. Sugieres ideas innovadoras, usas un lenguaje inspirador y exploras posibilidades más allá de lo obvio."
  },
  {
    id: 'technical',
    name: 'Técnico',
    description: 'Análisis detallado, terminología precisa y exactitud técnica.',
    systemPrompt: "Eres la IA contextual de Navegador X. Tu enfoque es puramente técnico y detallado. Explicas los procesos subyacentes, usas terminología precisa y te aseguras de la exactitud de los datos."
  }
];

const MODELS = [
  { id: 'gemini-1.5-flash', name: 'Flash 1.5', description: 'Optimizado para velocidad y eficiencia.' },
  { id: 'gemini-1.5-pro-latest', name: 'Pro 1.5', description: 'Máxima capacidad cognitiva para tareas complejas.' },
  { id: 'gemini-3-flash-preview', name: 'X-Cortex v3', description: 'Modelo experimental de alta velocidad.' }
];

const MOCK_TABS = [
  { title: "Novedades en Criptografía", content: "Un análisis sobre los nuevos algoritmos post-cuánticos..." },
  { title: "Dashboard Opera X", content: "Métricas del sistema y configuración de la capa de IA..." },
  { title: "Minería Sustentable", content: "Cómo optimizar el uso de energía en dispositivos móviles..." }
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  isFloating?: boolean;
  onClose?: () => void;
  currentUrl?: string;
}

export function AIChat({ isFloating, onClose, currentUrl }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [user, setUser] = useState(auth.currentUser);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      // Default preferences for guest
      const defaultPrefs = {
        aiName: 'OP-X',
        systemPrompt: "Eres la IA contextual de Navegador X. Tus respuestas son extremadamente directas, breves y sin adornos.",
        model: "gemini-1.5-flash",
        persona: "concise"
      };
      setPreferences(defaultPrefs);
      setMessages([{ role: 'assistant', content: `Nodo central de Guest Mode listo. Inicie sesión para sincronizar preferencias.` }]);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const aiPrefs = data.preferences?.ai || {
          persona: 'concise',
          model: 'gemini-1.5-flash'
        };
        
        const personaMatch = PERSONAS.find(p => p.id === aiPrefs.persona) || PERSONAS[0];
        
        setPreferences({
          ...aiPrefs,
          systemPrompt: personaMatch.systemPrompt,
          aiName: 'X-Cortex'
        });

        setMessages(prev => {
          if (prev.length === 0) {
            return [{ 
              role: 'assistant', 
              content: `Nodo central de X-Cortex listo. [Persona: ${personaMatch.name}]` 
            }];
          }
          return prev;
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSettingsOpen]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("API Key no configurada.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: preferences?.model || "gemini-3-flash-preview",
        contents: textToSend,
        config: {
          systemInstruction: preferences?.systemPrompt || "Eres la IA contextual integrada en 'Navegador X'.",
        }
      });

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.text || "No se ha podido generar una respuesta." 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `LOG_ERROR: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    const prompt = currentUrl 
      ? `Resume el contenido de la pestaña actual: ${currentUrl}` 
      : 'Resume mis pestañas abiertas.';
      
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    setTimeout(() => {
      let summary = "";
      if (currentUrl) {
        summary = `He analizado el contenido de ${currentUrl}. Es un sitio con alta densidad informativa. Resumen: Se trata de un análisis técnico sobre las tendencias de mercado en Q2, destacando el crecimiento del 14% en activos RWA y la consolidación de capas 2.`;
      } else {
        summary = `He analizado ${MOCK_TABS.length} pestañas activas. Los temas principales son criptografía post-cuántica y optimización energética en minería. ¿Deseas un desglose técnico de alguna de ellas?`;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: summary }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSecurityAudit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    const prompt = currentUrl 
      ? `Realiza una auditoría de seguridad del sitio actual: ${currentUrl}` 
      : 'Analiza la seguridad de mis sesiones activas.';
      
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    setTimeout(() => {
      let analysis = "";
      if (currentUrl) {
        analysis = `AUDITORÍA DE SEGURIDAD [${currentUrl}]: 
- Certificado SSL: Válido (TLS 1.3)
- Encabezados de Seguridad: HSTS detectable, CSP robusto.
- Seguidores: 4 rastro bloqueados por Navegador X.
- Reputación: Sitio verificado y seguro. Sin amenazas detectadas en la base de datos de Phishing.`;
      } else {
        analysis = `Análisis global de seguridad completado. Se han escaneado ${MOCK_TABS.length} pestañas. Todas las conexiones utilizan cifrado AES-256. No se detectan anomalías de tráfico saliente. El nodo VPN suizo está mitigando proactivamente 2 intentos de rastreo.`;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: analysis }]);
      setIsLoading(false);
    }, 2000);
  };

  const handleUpdatePersona = async (persona: typeof PERSONAS[0]) => {
    if (!user) {
      setPreferences((prev: any) => ({ ...prev, persona: persona.id, systemPrompt: persona.systemPrompt }));
      setMessages(prev => [...prev, { role: 'assistant', content: `Capa temporal (GUEST) reconfigurada: Modo ${persona.name} activado.` }]);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        'preferences.ai.persona': persona.id,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: `Sincronización completa: Modo ${persona.name} persistido en la nube.` }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleUpdateModel = async (modelId: string) => {
    if (!user) {
      setPreferences((prev: any) => ({ ...prev, model: modelId }));
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        'preferences.ai.model': modelId,
      });
      const modelName = MODELS.find(m => m.id === modelId)?.name || modelId;
      setMessages(prev => [...prev, { role: 'assistant', content: `Motor neuronal actualizado a ${modelName} en el perfil central.` }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // We no longer need savePreferences as we handle it directly above

  const currentPersona = PERSONAS.find(p => p.id === preferences?.persona) || 
                         PERSONAS.find(p => p.systemPrompt === preferences?.systemPrompt) || 
                         PERSONAS[0];

  return (
    <div className={cn(
      "flex flex-col h-full bg-card-bg overflow-hidden border border-border-panel",
      isFloating ? "rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)]" : "p-8"
    )}>
      {isFloating && <div className="h-1 w-full bg-grad-x" />}
      
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-white/5",
        isFloating ? "px-6 py-4 bg-[#0b0f14]" : "pb-6 mb-6"
      )}>
        <div className="flex items-center gap-3">
          {isSettingsOpen && (
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="text-gray-600 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <h3 className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">
            {isSettingsOpen ? "AI Preferences" : "Contextual AI Layer"}
          </h3>
          {!isSettingsOpen && (
            <span className={cn(
              "text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest",
              currentPersona.id === 'technical' ? "border-brand-magenta text-brand-magenta" :
              currentPersona.id === 'creative' ? "border-brand-cyan text-brand-cyan" :
              "border-gray-600 text-gray-600"
            )}>
              {currentPersona.name}
            </span>
          )}
          {!isSettingsOpen && isFloating && <span className="text-[9px] px-1.5 py-0.5 rounded border border-brand-cyan text-brand-cyan font-mono animate-pulse ml-2">ONLINE</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {!isSettingsOpen && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-600 hover:text-white transition-colors p-1"
            >
              <Settings size={14} />
            </button>
          )}
          {isFloating && (
            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <AnimatePresence mode="wait">
          {isSettingsOpen ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-brand-magenta uppercase tracking-widest font-mono">X-Layer Persona Selector</p>
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false);
                      handleSummarize();
                    }}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-brand-cyan uppercase tracking-widest px-2 py-1 rounded bg-brand-cyan/10 border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-all group"
                  >
                    <Sparkles size={10} className="group-hover:animate-pulse" />
                    Resumir Pestaña
                  </button>
                </div>
                
                {/* Radio Button Group style */}
                <div className="flex bg-[#141418] rounded-xl p-1 border border-white/5 mb-6">
                  {PERSONAS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleUpdatePersona(p)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        preferences?.persona === p.id 
                          ? "bg-brand-magenta text-black shadow-[0_0_20px_rgba(255,60,172,0.3)]" 
                          : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Persona Description */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-8">
                  <p className="text-[11px] text-white font-bold uppercase tracking-tighter mb-1">
                    {currentPersona.name} Protocol
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                    {currentPersona.description}
                  </p>
                </div>

                <div className="space-y-3 hidden">
                  {PERSONAS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleUpdatePersona(p)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all",
                        preferences?.persona === p.id
                          ? "bg-brand-magenta/5 border-brand-magenta/40"
                          : "bg-[#141418] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{p.name}</span>
                        {preferences?.persona === p.id && <Check size={14} className="text-brand-magenta" />}
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono leading-relaxed">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest mb-4 font-mono">Neural Engine Select</p>
                <div className="grid grid-cols-1 gap-2">
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleUpdateModel(m.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between",
                        preferences?.model === m.id
                          ? "bg-brand-cyan/5 border-brand-cyan/40"
                          : "bg-[#141418] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div>
                        <div className="text-[10px] font-bold text-white uppercase tracking-widest">{m.name}</div>
                        <div className="text-[9px] text-gray-600 font-mono italic">{m.id}</div>
                      </div>
                      {preferences?.model === m.id && <Check size={12} className="text-brand-cyan" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
                <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-widest mb-2">Configuración Activa</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-gray-600">MODELO:</span>
                    <span className="text-gray-400">{preferences?.model}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-gray-600">VOZ:</span>
                    <span className="text-gray-400 uppercase">{currentPersona.name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {!isFloating && (
                <p className="text-2xl font-light text-white mb-8">Estado del <span className="text-brand-magenta">Operador X</span></p>
              )}
              
              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-hide"
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex flex-col max-w-[90%]",
                      msg.role === 'user' ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-xl text-xs font-mono leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-[#1e1e24] border border-white/5 text-gray-300" 
                        : "bg-[#141418] border border-border-panel text-gray-400"
                    )}>
                      <span className={cn(
                        "font-bold mr-2",
                        msg.role === 'user' ? "text-brand-magenta" : "text-brand-cyan"
                      )}>
                        {msg.role === 'user' ? "USUARIO:" : "IA X:"}
                      </span>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-brand-cyan text-[10px] font-mono animate-pulse uppercase tracking-widest pl-2">
                    Analizando vectores de búsqueda...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="mt-auto">
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-cyan/5 border border-brand-cyan/20 text-[9px] font-bold uppercase tracking-widest text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
                  >
                    <Sparkles size={12} />
                    {currentUrl ? "Resumir Pestaña" : "Resumir Todo"}
                  </button>
                  <button 
                    onClick={handleSecurityAudit}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                  >
                    <Shield size={12} />
                    Audit Seguridad
                  </button>
                </div>
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 bg-sidebar-bg rounded-lg px-4 py-2 border border-border-subtle focus-within:border-brand-magenta/40 transition-colors"
                >
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Interactuar con la capa contextual..."
                    className="w-full bg-transparent border-none outline-none text-xs text-gray-300 font-mono py-1.5"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="text-brand-magenta disabled:opacity-30 p-1"
                  >
                    <Send size={16} />
                  </button>
                </form>
                {!isFloating && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {preferences?.suggestions?.map((s: string) => (
                      <button 
                        key={s}
                        onClick={() => handleSend(s)}
                        className="bg-[#1e1e24] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-cyan transition-colors border border-transparent hover:border-brand-cyan/30"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

