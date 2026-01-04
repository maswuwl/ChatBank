
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Search, Trash2, Loader2, Camera, Plus, MessageSquare, 
  Database, Eye, Menu, X, ChevronRight, BrainCircuit, ShieldCheck, 
  Monitor, Smartphone, Activity
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import { EngineMode, Message, MissionSession } from './core/types';
import { muntasirGenerateContent, muntasirGenerateImage, muntasirGenerateLocalContent } from './core/engine/geminiService';

const STORAGE_KEY = 'chatbank_sovereign_v2';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<MissionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<EngineMode>(EngineMode.FLASH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل المستودعات بحذر
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) { console.error("Storage Error", e); }
    }
    setIsLoaded(true);
    // إخفاء الـ splash بعد استقرار الـ UI
    setTimeout(() => {
      document.getElementById('km-splash')?.classList.add('fade-out');
    }, 500);
  }, []);

  // الحفظ فقط عند وجود بيانات فعلية
  useEffect(() => {
    if (isLoaded && sessions.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewMission = () => {
    // منع تكرار المستودعات الفارغة
    if (sessions.length > 0 && sessions[0].messages.length === 0) {
      setCurrentSessionId(sessions[0].id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
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
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      const newSession: MissionSession = {
        id: Date.now().toString(),
        title: input.substring(0, 20),
        messages: [],
        lastUpdated: Date.now()
      };
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      targetSessionId = newSession.id;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: [{ text: input }, ...(selectedImage ? [{ image: selectedImage }] : [])],
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() } : s));
    
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsProcessing(true);

    try {
      let modelRes: Message;
      if (mode === EngineMode.LOCAL_X1) {
        try {
          const res = await muntasirGenerateLocalContent(currentInput);
          modelRes = { id: Date.now().toString(), role: 'model', content: [{ text: res.text }], mode, timestamp: Date.now() };
        } catch {
          const res = await muntasirGenerateContent(currentInput, EngineMode.FLASH, currentImage || undefined, useSearch);
          modelRes = { id: Date.now().toString(), role: 'model', content: [{ text: `⚠️ النواة المحلية غير متوفرة. تم التبديل لـ FLASH.\n\n${res.text}` }], mode: EngineMode.FLASH, timestamp: Date.now() };
        }
      } else {
        const res = await muntasirGenerateContent(currentInput, mode, currentImage || undefined, useSearch);
        modelRes = { id: Date.now().toString(), role: 'model', content: [{ text: res.text }], mode, timestamp: Date.now(), sources: res.sources };
      }
      setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, modelRes] } : s));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const detectCode = (text: string) => {
    const match = /```(?:html|javascript|css|react)?([\s\S]*?)```/g.exec(text);
    return match ? match[1] : null;
  };

  return (
    <div className="flex h-screen bg-[#050505] text-[#f3f4f6] overflow-hidden">
      {activeCodePreview && <ProjectSandbox code={activeCodePreview} onClose={() => setActiveCodePreview(null)} />}

      {/* القائمة الجانبية (المستودعات) */}
      <aside className={`
        fixed lg:relative z-50 h-full transition-all duration-300 border-l border-[#d4af37]/10 bg-[#080808]
        ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 overflow-hidden'}
      `}>
        <div className="flex flex-col h-full p-4 gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center font-black text-black">CB</div>
              <span className="font-black text-[#d4af37] text-xs uppercase tracking-tighter">بنك المستودعات</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500"><X size={18} /></button>
          </div>

          <button onClick={createNewMission} className="w-full py-3 bg-[#d4af37] text-black font-black text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#b8962d] transition-all icon-active-scale shadow-lg shadow-[#d4af37]/10">
            <Plus size={16} /> مهمة سيادية جديدة
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {sessions.map(s => (
              <div 
                key={s.id} 
                onClick={() => { setCurrentSessionId(s.id); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between group ${currentSessionId === s.id ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]' : 'border-transparent hover:bg-white/5 text-gray-500'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={14} />
                  <span className="text-[10px] font-bold truncate">{s.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(ses => ses.id !== s.id)); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* منطقة العمل الرئيسية */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-16 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-white/5 rounded-xl text-[#d4af37] hover:bg-[#d4af37]/10 transition-all icon-active-scale">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              {[EngineMode.FLASH, EngineMode.ULTRA, EngineMode.LOCAL_X1].map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all border ${mode === m ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 text-gray-500 border-transparent hover:border-white/10'}`}>
                  {m.replace('Muntasir-', '').replace('Sovereign-', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setUseSearch(!useSearch)} className={`p-2.5 rounded-xl border transition-all icon-active-scale ${useSearch ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-white/5 border-transparent text-gray-500'}`}>
              <Search size={18} />
            </button>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#d4af37] to-[#b8962d] flex items-center justify-center text-black text-[10px] font-black">خ</div>
              <span className="text-[9px] font-black uppercase text-gray-400 hidden md:block">خالد المنتصر</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          <Dashboard />
          <VoiceInterface />

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 select-none">
              <BrainCircuit size={80} className="text-[#d4af37] mb-4 animate-pulse" />
              <h2 className="text-xl font-black uppercase tracking-widest">ChatBank Sovereign Core</h2>
              <p className="text-[10px] mt-2 font-bold uppercase tracking-widest text-[#d4af37]">Waiting for Sovereign Commands...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] md:max-w-[80%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-[#d4af37]/10 border border-[#d4af37]/20' : 'km-glass shadow-2xl'}`}>
                  <div className="flex items-center gap-2 mb-3 opacity-40">
                    <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#d4af37]'}`}></div>
                    <span className="text-[7px] font-black uppercase tracking-widest">{msg.role === 'user' ? 'Sovereign' : 'Core'}</span>
                  </div>
                  {msg.content.map((c, i) => (
                    <div key={i}>
                      {c.text && <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-gray-200">{c.text}</p>}
                      {c.text && detectCode(c.text) && (
                        <button onClick={() => setActiveCodePreview(detectCode(c.text || ""))} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-[#d4af37] text-black rounded-xl font-black text-[10px] icon-active-scale shadow-lg shadow-[#d4af37]/10">
                          <Eye size={16} /> معاينة المشروع السيادي
                        </button>
                      )}
                      {c.image && <img src={c.image} className="mt-3 rounded-xl border border-white/10" />}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* منطقة الإدخال المثبتة */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#050505] to-transparent z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {isProcessing && (
              <div className="flex items-center gap-2 px-2 animate-pulse">
                <Loader2 size={12} className="text-[#d4af37] animate-spin" />
                <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest">الذكاء قيد المعالجة...</span>
              </div>
            )}
            <div className="km-glass p-2 rounded-2xl flex items-center gap-3 shadow-2xl border-white/5 focus-within:border-[#d4af37]/30 transition-all">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-[#d4af37] transition-all icon-active-scale"><Camera size={20} /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setSelectedImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="اصدر أوامرك السيادية..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-white placeholder-gray-700 outline-none resize-none py-2"
                rows={1}
              />
              
              <button 
                onClick={handleSend}
                disabled={isProcessing || (!input.trim() && !selectedImage)}
                className={`p-3 md:px-6 rounded-xl font-black text-[10px] transition-all flex items-center gap-2 ${isProcessing || (!input.trim() && !selectedImage) ? 'bg-gray-800 text-gray-600' : 'bg-[#d4af37] text-black hover:bg-[#b8962d] icon-active-scale shadow-lg shadow-[#d4af37]/20'}`}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span className="hidden md:block">تنفيذ</span>
              </button>
            </div>
            {selectedImage && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#d4af37]/40 ml-auto">
                <img src={selectedImage} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 bg-red-500 p-1"><X size={8} /></button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
