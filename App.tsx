
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Search, Trash2, Loader2, Camera, Plus, MessageSquare, 
  Database, Eye, X, BrainCircuit, Settings, Cpu, Globe, Zap
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import { EngineMode, Message, MissionSession } from './core/types';
import { muntasirGenerateContent } from './core/engine/geminiService';

const STORAGE_KEY = 'chatbank_sovereign_v3';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<MissionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<EngineMode>(EngineMode.FLASH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) { console.error("Init Error", e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isLoaded]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    let targetId = currentSessionId;
    if (!targetId) {
      const newS: MissionSession = { id: Date.now().toString(), title: input.substring(0, 15) || "مهمة سيادية", messages: [], lastUpdated: Date.now() };
      setSessions([newS]);
      setCurrentSessionId(newS.id);
      targetId = newS.id;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: [{ text: input }, ...(selectedImage ? [{ image: selectedImage }] : [])],
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() } : s));
    
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsProcessing(true);

    try {
      const result = await muntasirGenerateContent(currentInput, mode, {
        imageBase64: currentImage || undefined,
        search: useSearch
      });

      const resMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: [{ text: result.text }],
        mode: result.meta.mode,
        timestamp: Date.now(),
        sources: result.sources,
        latencyMs: result.meta.latencyMs,
        modelName: result.meta.model
      };

      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, resMsg] } : s));
    } catch (err: any) {
       console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-[#f3f4f6] overflow-hidden relative">
      {activeCodePreview && <ProjectSandbox code={activeCodePreview} onClose={() => setActiveCodePreview(null)} />}

      {/* Sidebar */}
      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSidebarOpen(false)}></div>
          <aside className={`absolute right-0 top-0 h-full w-72 bg-[#080808] border-l border-[#d4af37]/20 transition-transform duration-500 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#d4af37] rounded-xl flex items-center justify-center text-black font-black">CB</div>
                      <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">بنك المستودعات</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:text-white transition-all"><X size={22} /></button>
              </div>
              <div className="p-4 flex flex-col flex-1 overflow-hidden">
                  <button onClick={() => { 
                    const newS = { id: Date.now().toString(), title: "مهمة جديدة", messages: [], lastUpdated: Date.now() };
                    setSessions(p => [newS, ...p]); setCurrentSessionId(newS.id); setSidebarOpen(false);
                  }} className="w-full py-3.5 bg-[#d4af37] text-black font-black text-[10px] rounded-xl flex items-center justify-center gap-2 km-button-active shadow-lg shadow-[#d4af37]/10 mb-6 uppercase">
                    <Plus size={16} /> مهمة جديدة
                  </button>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                      {sessions.map(s => (
                        <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setSidebarOpen(false); }} className={`p-3.5 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${currentSessionId === s.id ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]' : 'border-transparent hover:bg-white/5 text-gray-500'}`}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare size={14} />
                            <span className="text-[10px] font-bold truncate">{s.title}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(ses => ses.id !== s.id)); }} className="opacity-0 hover:opacity-100 p-1.5 hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      ))}
                  </div>
              </div>
          </aside>
      </div>

      <main className="flex-1 flex flex-col relative z-10 min-w-0">
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[150]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white/5 rounded-xl text-[#d4af37] border border-white/5 hover:border-[#d4af37]/40 transition-all km-button-active">
              <Database size={20} />
            </button>
            <button onClick={() => setUseSearch(!useSearch)} className={`p-3 rounded-xl border transition-all km-button-active ${useSearch ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-white/5 border-transparent text-gray-500'}`}>
              <Search size={20} />
            </button>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value as EngineMode)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-[#d4af37] outline-none"
            >
              <option value={EngineMode.FLASH}>FLASH CORE</option>
              <option value={EngineMode.ULTRA}>ULTRA (THINKING)</option>
              <option value={EngineMode.LOCAL_X1}>LOCAL X1</option>
            </select>
          </div>

          <div className="flex flex-col items-center select-none">
             <div className="flex items-center gap-2 mb-0.5">
                <Cpu size={14} className="text-[#d4af37] animate-pulse" />
                <span className="text-[14px] font-black text-[#d4af37] tracking-[0.4em] uppercase">ChatBank</span>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <div className="w-6 h-6 rounded-md bg-[#d4af37] flex items-center justify-center text-black text-[10px] font-black">K</div>
                <span className="text-[9px] font-black text-gray-400 uppercase">Sovereign Mode</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-16 lg:px-24 py-8 space-y-10 custom-scrollbar">
          <Dashboard />
          <VoiceInterface />

          {messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-30">
              <BrainCircuit size={120} className="text-[#d4af37] mb-6 animate-pulse" />
              <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-[#d4af37]">Sovereign IQ</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Ready for Command Protocol</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-6`}>
                  <div className={`max-w-[95%] md:max-w-[85%] p-6 md:p-8 rounded-[2.5rem] shadow-2xl ${msg.role === 'user' ? 'bg-[#d4af37]/5 border border-[#d4af37]/20' : 'km-glass border border-white/5'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 opacity-40">
                            <div className={`w-2 h-2 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#d4af37]'}`}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{msg.role === 'user' ? 'Khalid Muntasir' : 'Sovereign Core'}</span>
                        </div>
                        {msg.latencyMs && (
                            <div className="flex items-center gap-2 opacity-30 text-[7px] font-bold uppercase">
                                <Zap size={8} /> {msg.latencyMs}ms | {msg.modelName}
                            </div>
                        )}
                    </div>
                    {msg.content.map((c, i) => (
                      <div key={i} className="space-y-6">
                        {c.text && <p className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap text-gray-200 font-medium">{c.text}</p>}
                        {c.text && /```(?:html|javascript|css|react)?([\s\S]*?)```/g.test(c.text) && (
                           <button onClick={() => {
                             const match = /```(?:html|javascript|css|react)?([\s\S]*?)```/g.exec(c.text || "");
                             if(match) setActiveCodePreview(match[1]);
                           }} className="w-full mt-6 flex items-center justify-center gap-4 py-4 bg-[#d4af37] text-black rounded-2xl font-black text-[11px] km-button-active shadow-2xl hover:bg-[#b8962d] transition-all uppercase tracking-widest">
                             <Eye size={18} /> معاينة الحل السيادي
                           </button>
                        )}
                        {c.image && <img src={c.image} className="rounded-3xl border border-white/10 shadow-2xl" />}
                      </div>
                    ))}

                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-3 opacity-50">
                                <Globe size={10} className="text-[#d4af37]" />
                                <span className="text-[8px] font-black uppercase tracking-widest">المصادر المسترجعة:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {msg.sources.map((src, idx) => (
                                    <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-[#d4af37] hover:bg-[#d4af37]/10 transition-all flex items-center gap-2">
                                        <div className="w-1 h-1 bg-[#d4af37] rounded-full"></div>
                                        {src.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-10" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-10 bg-gradient-to-t from-[#050505] to-transparent sticky bottom-0">
          <div className="max-w-4xl mx-auto relative">
            {isProcessing && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full animate-pulse">
                    <Loader2 size={14} className="text-[#d4af37] animate-spin" />
                    <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">
                        {mode === EngineMode.ULTRA ? 'النواة تحلل بعمق...' : 'جاري التنفيذ السيادي...'}
                    </span>
                </div>
            )}
            <div className="km-glass p-3 md:p-4 rounded-[2.5rem] flex items-center gap-4 border-white/10 focus-within:border-[#d4af37]/60 transition-all shadow-2xl">
              <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/5 text-gray-400 hover:text-[#d4af37] rounded-full transition-all">
                <Camera size={24} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { const r = new FileReader(); r.onload = () => setSelectedImage(r.result as string); r.readAsDataURL(f); }
              }} />
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="أدخل أوامرك..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] text-white placeholder-gray-800 outline-none resize-none py-3 font-medium"
                rows={1}
              />
              
              <button 
                onClick={handleSend}
                disabled={isProcessing || (!input.trim() && !selectedImage)}
                className={`p-4 md:px-10 rounded-full font-black text-[11px] transition-all flex items-center gap-4 ${isProcessing || (!input.trim() && !selectedImage) ? 'bg-gray-800 text-gray-600' : 'bg-[#d4af37] text-black shadow-xl shadow-[#d4af37]/30 hover:bg-[#b8962d] uppercase tracking-widest'}`}
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                <span className="hidden md:block">إرسال</span>
              </button>
            </div>
            {selectedImage && (
              <div className="absolute bottom-full left-10 mb-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37]/40">
                  <img src={selectedImage} className="w-full h-full object-cover" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg"><X size={12} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
