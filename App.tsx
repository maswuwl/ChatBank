
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Search, Trash2, Loader2, Camera, Plus, MessageSquare, 
  Database, Eye, Menu, X, BrainCircuit, ShieldCheck, 
  LayoutGrid, Settings, Info, Bell
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import { EngineMode, Message, MissionSession } from './core/types';
import { muntasirGenerateContent, muntasirGenerateLocalContent } from './core/engine/geminiService';

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
    setTimeout(() => document.getElementById('km-splash')?.classList.add('hidden'), 800);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions, isLoaded]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewMission = () => {
    if (sessions.length > 0 && sessions[0].messages.length === 0) {
      setCurrentSessionId(sessions[0].id);
      setSidebarOpen(false);
      return;
    }
    const newSession: MissionSession = {
      id: Date.now().toString(),
      title: `مهمة ${sessions.length + 1}`,
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSidebarOpen(false);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    let targetId = currentSessionId;
    if (!targetId) {
      const newS: MissionSession = { id: Date.now().toString(), title: input.substring(0, 15), messages: [], lastUpdated: Date.now() };
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
      let resMsg: Message;
      if (mode === EngineMode.LOCAL_X1) {
        try {
          const res = await muntasirGenerateLocalContent(currentInput);
          resMsg = { id: Date.now().toString(), role: 'model', content: [{ text: res.text }], mode, timestamp: Date.now() };
        } catch {
          const res = await muntasirGenerateContent(currentInput, EngineMode.FLASH, currentImage || undefined, useSearch);
          resMsg = { id: Date.now().toString(), role: 'model', content: [{ text: `⚠️ النواة المحلية غير متوفرة. تم التبديل لـ FLASH.\n\n${res.text}` }], mode: EngineMode.FLASH, timestamp: Date.now() };
        }
      } else {
        const res = await muntasirGenerateContent(currentInput, mode, currentImage || undefined, useSearch);
        resMsg = { id: Date.now().toString(), role: 'model', content: [{ text: res.text }], mode, timestamp: Date.now(), sources: res.sources };
      }
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, resMsg] } : s));
    } finally {
      setIsProcessing(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-[#f3f4f6] overflow-hidden relative">
      {activeCodePreview && <ProjectSandbox code={activeCodePreview} onClose={() => setActiveCodePreview(null)} />}

      {/* القائمة الجانبية بتصميم نظيف */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className={`absolute right-0 top-0 h-full w-72 bg-[#080808] border-l border-[#d4af37]/20 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center text-black font-black">CB</div>
                      <span className="text-xs font-black text-[#d4af37] tracking-widest uppercase">بنك المستودعات</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
              </div>
              
              <div className="p-4">
                  <button onClick={createNewMission} className="w-full py-3 bg-[#d4af37] text-black font-black text-[10px] rounded-xl flex items-center justify-center gap-2 km-button-active shadow-lg shadow-[#d4af37]/10 uppercase">
                    <Plus size={16} /> مهمة جديدة
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                  {sessions.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => { setCurrentSessionId(s.id); setSidebarOpen(false); }}
                      className={`group p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${currentSessionId === s.id ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]' : 'border-transparent hover:bg-white/5 text-gray-500'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-bold truncate">{s.title}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(ses => ses.id !== s.id)); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  ))}
              </div>
          </aside>
      </div>

      <main className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* هيدر مُعاد ترتيبه لمنع التداخل */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white/5 rounded-xl text-[#d4af37] km-button-active hover:bg-[#d4af37]/10" title="المستودعات">
              <Database size={18} />
            </button>
            <button onClick={() => setUseSearch(!useSearch)} className={`p-2.5 rounded-xl border transition-all km-button-active ${useSearch ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-white/5 border-transparent text-gray-500'}`} title="بحث جوجل">
              <Search size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-[#d4af37] tracking-[0.2em] uppercase">ChatBank</span>
             <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Sovereign Intelligence</span>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex gap-1.5 mr-4">
                {[EngineMode.FLASH, EngineMode.ULTRA].map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`px-2.5 py-1 rounded-md text-[7px] font-black transition-all border ${mode === m ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 text-gray-500 border-transparent hover:border-white/10 uppercase'}`}>
                    {m.split('-')[1]}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-2.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#d4af37] to-[#b8962d] flex items-center justify-center text-black text-[9px] font-black">خ</div>
                <span className="text-[8px] font-black text-gray-400 hidden sm:block uppercase">K. Al-Muntasir</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-8 custom-scrollbar">
          <Dashboard />
          <VoiceInterface />

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-20 select-none">
              <BrainCircuit size={100} className="text-[#d4af37] mb-6 animate-pulse" />
              <h2 className="text-2xl font-black uppercase tracking-[0.4em]">Sovereign Core</h2>
              <p className="text-[9px] mt-3 font-bold uppercase tracking-widest text-[#d4af37]">System Ready for Command Protocol</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
                  <div className={`max-w-[92%] md:max-w-[85%] p-6 rounded-3xl ${msg.role === 'user' ? 'bg-[#d4af37]/10 border border-[#d4af37]/20 shadow-xl' : 'km-glass shadow-2xl relative'}`}>
                    <div className="flex items-center gap-2 mb-4 opacity-40">
                      <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#d4af37]'}`}></div>
                      <span className="text-[7px] font-black uppercase tracking-[0.2em]">{msg.role === 'user' ? 'Sovereign' : 'AI Engine'}</span>
                    </div>
                    {msg.content.map((c, i) => (
                      <div key={i} className="space-y-4">
                        {c.text && <p className="text-[11px] md:text-[12px] leading-relaxed whitespace-pre-wrap text-gray-200">{c.text}</p>}
                        {c.text && /```(?:html|javascript|css|react)?([\s\S]*?)```/g.test(c.text) && (
                           <button onClick={() => {
                             const match = /```(?:html|javascript|css|react)?([\s\S]*?)```/g.exec(c.text || "");
                             if(match) setActiveCodePreview(match[1]);
                           }} className="w-full flex items-center justify-center gap-2 py-4 bg-[#d4af37] text-black rounded-2xl font-black text-[10px] km-button-active shadow-xl shadow-[#d4af37]/10 uppercase tracking-widest">
                             <Eye size={18} /> معاينة المشروع
                           </button>
                        )}
                        {c.image && <img src={c.image} className="rounded-2xl border border-white/5 shadow-2xl max-w-full" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* منطقة الإدخال الاحترافية */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#050505] to-transparent">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {isProcessing && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-[#d4af37]/5 rounded-full w-fit animate-pulse border border-[#d4af37]/10">
                <Loader2 size={12} className="text-[#d4af37] animate-spin" />
                <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest">بروتوكول المعالجة نشط...</span>
              </div>
            )}
            <div className="km-glass p-2.5 rounded-[2rem] flex items-center gap-3 shadow-2xl border-white/10 focus-within:border-[#d4af37]/40 transition-all">
              <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-gray-500 hover:text-[#d4af37] transition-all km-button-active bg-white/5 rounded-full" title="صورة">
                <Camera size={22} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { const r = new FileReader(); r.onload = () => setSelectedImage(r.result as string); r.readAsDataURL(f); }
              }} />
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="اصدر أوامرك السيادية..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm text-white placeholder-gray-700 outline-none resize-none py-2 px-1 font-bold"
                rows={1}
              />
              
              <button 
                onClick={handleSend}
                disabled={isProcessing || (!input.trim() && !selectedImage)}
                className={`p-3.5 md:px-8 rounded-full font-black text-[10px] transition-all flex items-center gap-3 km-button-active ${isProcessing || (!input.trim() && !selectedImage) ? 'bg-gray-800 text-gray-600' : 'bg-[#d4af37] text-black hover:bg-[#b8962d] shadow-xl shadow-[#d4af37]/20 uppercase tracking-widest'}`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span className="hidden md:block">تنفيذ</span>
              </button>
            </div>
            {selectedImage && (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#d4af37]/40 ml-auto shadow-2xl animate-in zoom-in-50">
                <img src={selectedImage} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md shadow-lg"><X size={12} /></button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
