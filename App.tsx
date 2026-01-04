
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Search, Zap, Crown, Trash2, Loader2, 
  Link as LinkIcon, Camera, Plus, MessageSquare, 
  Database, Code, Eye, Activity, ChevronRight, Menu,
  Type, Minus, Plus as PlusIcon, BrainCircuit, Server
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import { EngineMode, Message, MissionSession } from './core/types';
import { muntasirGenerateContent, muntasirGenerateImage, muntasirGenerateLocalContent } from './core/engine/geminiService';

const STORAGE_KEY = 'muntasir_sessions_v1';
const FONT_SIZE_KEY = 'chatbank_font_size';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<MissionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<EngineMode>(EngineMode.FLASH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? parseInt(saved) : 11;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem(FONT_SIZE_KEY, fontSize.toString());
  }, [fontSize]);

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.min(Math.max(prev + delta, 8), 18));
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MissionSession[];
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewMission = useCallback(() => {
    const newSession: MissionSession = {
      id: Date.now().toString(),
      title: `مهمة شاتبنك ${sessions.length + 1}`,
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, [sessions]);

  useEffect(() => {
    if (sessions.length === 0) createNewMission();
  }, [sessions, createNewMission]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateSessionMessages = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const title = newMessages.length > 0 && newMessages[newMessages.length-1].role === 'user' 
          ? (newMessages[newMessages.length-1].content[0].text?.substring(0, 30) || s.title)
          : s.title;
        return { ...s, messages: newMessages, title, lastUpdated: Date.now() };
      }
      return s;
    }));
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: [
        { text: input },
        ...(selectedImage ? [{ image: selectedImage }] : [])
      ],
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    updateSessionMessages(newMessages);
    
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsProcessing(true);
    if (mode === EngineMode.ULTRA || mode === EngineMode.LOCAL_X1) setIsThinking(true);
    
    const progressInterval = setInterval(() => {
      setBuildProgress(prev => Math.min(prev + (Math.random() * 8), 98));
    }, 400);

    try {
      let modelResponse: Message;

      if (mode === EngineMode.LOCAL_X1) {
        const result = await muntasirGenerateLocalContent(currentInput);
        modelResponse = {
          id: Date.now().toString(),
          role: 'model',
          content: [{ text: result.text }],
          mode,
          timestamp: Date.now()
        };
      } else {
        const isImageGen = currentInput.toLowerCase().includes('ولد صورة') || 
                           currentInput.toLowerCase().includes('ارسم') || 
                           currentInput.toLowerCase().includes('generate image');

        if (isImageGen) {
          const imageUrl = await muntasirGenerateImage(currentInput, mode === EngineMode.ULTRA ? '2K' : '1K');
          modelResponse = {
            id: Date.now().toString(),
            role: 'model',
            content: [{ text: "تم توليد الصورة المطلوبة سيادياً بناءً على رؤية شاتبنك." }, { image: imageUrl }],
            mode,
            timestamp: Date.now(),
          };
        } else {
          const result = await muntasirGenerateContent(currentInput, mode, currentImage || undefined, useSearch);
          modelResponse = {
            id: Date.now().toString(),
            role: 'model',
            content: [{ text: result.text }],
            mode,
            timestamp: Date.now(),
            sources: result.sources
          };
        }
      }

      setIsThinking(false);
      setBuildProgress(100);
      updateSessionMessages([...newMessages, modelResponse]);
    } catch (error) {
      console.error(error);
      updateSessionMessages([...newMessages, { id: Date.now().toString(), role: 'model', content: [{ text: "⚠️ خلل في بروتوكول الاتصال. تأكد من تشغيل النواة المحلية (sovereign_server.py)." }], timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
      clearInterval(progressInterval);
      setTimeout(() => { setIsProcessing(false); setBuildProgress(0); }, 500);
    }
  };

  const detectCode = (text: string) => {
    const codeBlockRegex = /```(?:html|javascript|css)?([\s\S]*?)```/g;
    const match = codeBlockRegex.exec(text);
    return match ? match[1] : null;
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#f3f4f6]">
      {activeCodePreview && <ProjectSandbox code={activeCodePreview} onClose={() => setActiveCodePreview(null)} />}

      <div className="flex flex-1 overflow-hidden">
        {/* km-sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-500 km-glass-card border-l border-[#d4af37]/10 p-3 hidden lg:flex flex-col gap-4`}>
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#d4af37] rounded-md flex items-center justify-center font-bold text-black text-[10px] shadow-[0_0_10px_rgba(212,175,55,0.2)]">CB</div>
              <div>
                <h1 className="text-[#d4af37] font-bold text-sm leading-tight km-gold-text-glow">ChatBank</h1>
                <p className="text-[6px] text-gray-500 uppercase tracking-widest font-bold">Sovereign Intel</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded-md text-gray-500 transition-all active:scale-90"><ChevronRight size={14} /></button>
          </div>

          <button onClick={createNewMission} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#d4af37] text-black font-bold text-[11px] hover:bg-[#b8962d] transition-all km-gold-glow">
            <Plus size={14} /> مهمة سيادية جديدة
          </button>

          <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            <div className="text-[7px] font-bold text-gray-600 uppercase mb-1 px-1 flex items-center gap-1.5"><Database size={8} /> بنك المستودعات</div>
            {sessions.map(s => (
              <div key={s.id} onClick={() => setCurrentSessionId(s.id)} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' : 'border-transparent hover:bg-white/5 text-gray-400'}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare size={12} className={currentSessionId === s.id ? 'text-[#d4af37]' : 'text-gray-600'} />
                  <span className="text-[10px] font-bold truncate">{s.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSessions(sessions.filter(ses => ses.id !== s.id)); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-md transition-all text-gray-500 hover:text-red-400"><Trash2 size={10} /></button>
              </div>
            ))}
          </div>
        </aside>

        {/* km-main-content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <header className="h-12 border-b border-[#d4af37]/10 km-glass-card flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
            <div className="flex items-center gap-3">
                 {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-white/5 rounded-md text-[#d4af37] active:scale-90 transition-all"><Menu size={16} /></button>}
                 <div className="flex gap-1.5">
                   <button onClick={() => setMode(EngineMode.FLASH)} className={`px-2.5 py-1 rounded-md text-[8px] font-black transition-all ${mode === EngineMode.FLASH ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-gray-500'}`}>FLASH</button>
                   <button onClick={() => setMode(EngineMode.ULTRA)} className={`px-2.5 py-1 rounded-md text-[8px] font-black transition-all ${mode === EngineMode.ULTRA ? 'bg-[#d4af37] text-black km-gold-glow' : 'bg-white/5 text-gray-500'}`}>ULTRA</button>
                   <button onClick={() => setMode(EngineMode.LOCAL_X1)} className={`px-2.5 py-1 rounded-md text-[8px] font-black transition-all border ${mode === EngineMode.LOCAL_X1 ? 'bg-green-500 text-black border-green-500' : 'bg-white/5 text-gray-500 border-transparent hover:border-green-500/30'}`}>CORE X-1</button>
                 </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setUseSearch(!useSearch)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[8px] font-bold transition-all border ${useSearch ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-gray-800 text-gray-500'}`}>
                <Search size={11} /> <span className="hidden sm:inline">مراقبة ميدانية</span>
              </button>
              <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8962d] flex items-center justify-center font-bold text-black text-[10px]">خ</div>
                <span className="text-[10px] font-black text-gray-300 hidden sm:inline">خالد المنتصر</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
            <Dashboard />
            <VoiceInterface />

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-500`}>
                <div className={`max-w-[90%] md:max-w-[80%] p-5 rounded-2xl relative shadow-xl ${msg.role === 'user' ? 'bg-[#d4af37]/5 border border-[#d4af37]/10' : 'km-glass-card'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#d4af37] animate-pulse'}`}></div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-white/30' : 'text-[#d4af37]'}`}>
                      {msg.role === 'user' ? 'SOVEREIGN USER' : `${msg.mode === EngineMode.LOCAL_X1 ? 'LOCAL CORE X1' : 'CHATBANK CORE'}`}
                    </span>
                  </div>
                  
                  {msg.content.map((part, i) => (
                    <div key={i} className="space-y-6">
                      {part.text && (
                        <div>
                          <p className="text-[11px] leading-[1.6] whitespace-pre-wrap font-medium">{part.text}</p>
                          {msg.role === 'model' && detectCode(part.text) && (
                            <div className="mt-5 p-4 rounded-xl bg-black/40 border border-[#d4af37]/10 relative overflow-hidden">
                               <button onClick={() => setActiveCodePreview(detectCode(part.text || ""))} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#d4af37] text-black rounded-lg font-black text-[10px] hover:bg-[#b8962d] km-gold-glow">
                                <Eye size={14} /> معاينة المشروع السيادي
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {part.image && <img src={part.image} alt="Sovereign" className="mt-4 rounded-2xl border border-[#d4af37]/20 shadow-2xl max-w-full" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 md:p-8 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent">
            {isProcessing && (
              <div className="max-w-4xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-2 px-2">
                   <div className="flex items-center gap-2">
                     {isThinking ? <BrainCircuit size={12} className="text-[#d4af37] animate-pulse" /> : <Loader2 size={11} className="text-[#d4af37] animate-spin" />}
                     <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-[0.2em]">
                       {isThinking ? (mode === EngineMode.LOCAL_X1 ? "معالجة عبر النواة المحلية X-1..." : "المنطق السيادي قيد التحليل...") : "جاري البناء..."}
                     </span>
                   </div>
                   <span className="text-[8px] font-black text-[#d4af37] font-mono">{Math.round(buildProgress)}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div className="bg-gradient-to-r from-[#d4af37] to-[#b8962d] h-full rounded-full transition-all duration-300" style={{ width: `${buildProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto km-glass-card p-3 rounded-2xl flex flex-col gap-2 km-gold-glow border-[#d4af37]/20 focus-within:border-[#d4af37]/40">
              <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-[#d4af37] transition-all rounded-xl bg-white/5"><Camera size={18} /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); } }} />
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={mode === EngineMode.LOCAL_X1 ? "ناقش النواة المحلية X-1 مباشرة..." : "ناقش فكرة مشروعك سيادياً..."} className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-[#f3f4f6] placeholder-gray-700 outline-none font-bold" />
                <button onClick={handleSend} disabled={isProcessing} className={`p-2.5 md:px-6 rounded-xl font-black transition-all flex items-center gap-2 ${isProcessing ? 'bg-gray-800 text-gray-600' : 'bg-[#d4af37] text-black hover:bg-[#b8962d] km-gold-glow'}`}>
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span className="hidden md:inline text-[11px]">تنفيذ</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
