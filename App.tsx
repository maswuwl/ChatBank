
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Search, Zap, Crown, Trash2, Loader2, 
  Link as LinkIcon, Camera, Plus, MessageSquare, 
  Database, Code, Eye, Activity, ChevronRight, Menu,
  Type, Minus, Plus as PlusIcon, BrainCircuit, Server, AlertTriangle,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import { EngineMode, Message, MissionSession } from './core/types';
import { muntasirGenerateContent, muntasirGenerateImage, muntasirGenerateLocalContent } from './core/engine/geminiService';

const STORAGE_KEY = 'muntasir_sessions_v1';

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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحميل المستودعات من الذاكرة
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MissionSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // حفظ المستودعات عند كل تغيير
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewMission = () => {
    const newSession: MissionSession = {
      id: Date.now().toString(),
      title: `مهمة جديدة ${sessions.length + 1}`,
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 1024) setSidebarOpen(false); // إغلاق القائمة في الجوال بعد الاختيار
  };

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
        // تحديث العنوان بناءً على أول رسالة مستخدم
        let newTitle = s.title;
        if (newMessages.length > 0) {
          const lastUserMsg = [...newMessages].reverse().find(m => m.role === 'user');
          if (lastUserMsg && lastUserMsg.content[0].text) {
             newTitle = lastUserMsg.content[0].text.substring(0, 25) + (lastUserMsg.content[0].text.length > 25 ? '...' : '');
          }
        }
        return { ...s, messages: newMessages, title: newTitle, lastUpdated: Date.now() };
      }
      return s;
    }));
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    // إذا لم يكن هناك مستودع نشط، ننشئ واحداً
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession: MissionSession = {
        id: Date.now().toString(),
        title: input.substring(0, 25),
        messages: [],
        lastUpdated: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

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
      setBuildProgress(prev => Math.min(prev + (Math.random() * 5), 98));
    }, 500);

    try {
      let modelResponse: Message;

      if (mode === EngineMode.LOCAL_X1) {
        try {
          const result = await muntasirGenerateLocalContent(currentInput);
          modelResponse = {
            id: Date.now().toString(),
            role: 'model',
            content: [{ text: result.text }],
            mode,
            timestamp: Date.now()
          };
        } catch (localErr: any) {
          setMode(EngineMode.FLASH);
          const result = await muntasirGenerateContent(currentInput, EngineMode.FLASH, currentImage || undefined, useSearch);
          modelResponse = {
            id: Date.now().toString(),
            role: 'model',
            content: [{ text: `⚠️ تنبيه: النواة المحلية غير متصلة. تم تفعيل نظام FLASH السحابي تلقائياً.\n\n${result.text}` }],
            mode: EngineMode.FLASH,
            timestamp: Date.now()
          };
        }
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

      setBuildProgress(100);
      updateSessionMessages([...newMessages, modelResponse]);
    } catch (error: any) {
      updateSessionMessages([...newMessages, { 
        id: Date.now().toString(), 
        role: 'model', 
        content: [{ text: "⚠️ عذراً، حدث خطأ في النظام. يرجى المحاولة لاحقاً." }], 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsThinking(false);
      clearInterval(progressInterval);
      setTimeout(() => { setIsProcessing(false); setBuildProgress(0); }, 500);
    }
  };

  const detectCode = (text: string) => {
    const codeBlockRegex = /```(?:html|javascript|css|react)?([\s\S]*?)```/g;
    const match = codeBlockRegex.exec(text);
    return match ? match[1] : null;
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#f3f4f6] relative overflow-hidden">
      {activeCodePreview && <ProjectSandbox code={activeCodePreview} onClose={() => setActiveCodePreview(null)} />}

      {/* شاشة تحميل داخلية بسيطة */}
      {!isLoaded && <div className="absolute inset-0 bg-[#050505] z-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#d4af37]" /></div>}

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* السايدبار - قائمة المستودعات */}
        <aside className={`
          fixed inset-y-0 right-0 z-40 lg:relative lg:translate-x-0 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0 w-72 md:w-80' : 'translate-x-full w-0'}
          km-glass-card border-l border-[#d4af37]/10 flex flex-col p-4 gap-4 bg-[#080808]/95
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center font-bold text-black shadow-lg">CB</div>
              <h2 className="text-[#d4af37] font-black text-sm km-gold-text-glow">بنك المستودعات</h2>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
          </div>

          <button 
            onClick={createNewMission} 
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#d4af37] text-black font-black text-[11px] hover:scale-[0.98] transition-all km-gold-glow active:scale-95"
          >
            <Plus size={16} /> مهمة سيادية جديدة
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <div className="text-center py-10 opacity-20 flex flex-col items-center gap-3">
                <Database size={40} />
                <p className="text-[10px] font-bold">لا يوجد مستودعات حالياً</p>
              </div>
            ) : (
              sessions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    setCurrentSessionId(s.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }} 
                  className={`
                    group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                    ${currentSessionId === s.id ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' : 'border-transparent hover:bg-white/5 text-gray-500'}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={14} className={currentSessionId === s.id ? 'text-[#d4af37]' : 'text-gray-700'} />
                    <span className="text-[11px] font-bold truncate">{s.title}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSessions(sessions.filter(ses => ses.id !== s.id)); if (currentSessionId === s.id) setCurrentSessionId(null); }} 
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition-all text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 flex flex-col relative min-w-0">
          <header className="h-16 border-b border-[#d4af37]/10 km-glass-card flex items-center justify-between px-4 md:px-8 z-30">
            <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setSidebarOpen(!sidebarOpen)} 
                   className="p-3 bg-white/5 rounded-xl text-[#d4af37] hover:bg-[#d4af37]/10 active:scale-90 transition-all"
                   title="القائمة"
                 >
                   <Menu size={20} />
                 </button>
                 <div className="hidden sm:flex gap-2">
                   {Object.values(EngineMode).map(m => (
                     <button 
                        key={m}
                        onClick={() => setMode(m)} 
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border ${mode === m ? 'bg-[#d4af37] text-black border-[#d4af37] km-gold-glow' : 'bg-white/5 text-gray-500 border-transparent hover:border-white/10'}`}
                     >
                       {m.split('-')[1] || m}
                     </button>
                   ))}
                 </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setUseSearch(!useSearch)} 
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${useSearch ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-white/5 text-gray-500'}`}
              >
                <Search size={14} /> <span className="hidden md:inline">بحث جوجل</span>
              </button>
              <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962d] flex items-center justify-center font-bold text-black text-[11px]">خ</div>
                <span className="text-[10px] font-black text-gray-300 hidden sm:inline uppercase tracking-widest">سيد خالد</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
            <Dashboard />
            <VoiceInterface />

            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-6 mt-10">
                <BrainCircuit size={64} className="text-[#d4af37] animate-pulse" />
                <div>
                  <h3 className="text-xl font-black text-[#d4af37] mb-2">أهلاً بك في العقل السيادي</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]">بانتظار أوامر خالد المنتصر...</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-5 duration-500`}>
                  <div className={`max-w-[95%] md:max-w-[85%] p-6 rounded-3xl relative shadow-2xl ${msg.role === 'user' ? 'bg-[#d4af37]/10 border border-[#d4af37]/20 ml-4' : 'km-glass-card mr-4'}`}>
                    <div className="flex items-center gap-3 mb-4 opacity-50">
                      <div className={`w-2 h-2 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#d4af37]'}`}></div>
                      <span className="text-[8px] font-black uppercase tracking-widest">{msg.role === 'user' ? 'خالد المنتصر' : 'عقل شاتبنك'}</span>
                    </div>
                    
                    {msg.content.map((part, i) => (
                      <div key={i} className="space-y-6">
                        {part.text && (
                          <div className="space-y-4">
                            <p className="text-[12px] leading-relaxed whitespace-pre-wrap font-medium text-gray-200">{part.text}</p>
                            {msg.role === 'model' && detectCode(part.text) && (
                              <button 
                                onClick={() => setActiveCodePreview(detectCode(part.text || ""))} 
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#d4af37] text-black rounded-2xl font-black text-[11px] hover:scale-[0.99] transition-all km-gold-glow active:scale-95"
                              >
                                <Eye size={18} /> معاينة المشروع السيادي
                              </button>
                            )}
                          </div>
                        )}
                        {part.image && <img src={part.image} alt="Generated" className="mt-4 rounded-2xl border border-[#d4af37]/20 shadow-2xl max-w-full hover:scale-[1.02] transition-transform" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} className="h-10" />
          </div>

          {/* منطقة الإدخال */}
          <div className="p-4 md:p-10 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-20">
            {isProcessing && (
              <div className="max-w-4xl mx-auto mb-6 px-4">
                <div className="flex justify-between items-center mb-2 px-1">
                   <div className="flex items-center gap-3">
                     <Loader2 size={14} className="text-[#d4af37] animate-spin" />
                     <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">جاري بناء العبقرية...</span>
                   </div>
                   <span className="text-[9px] font-black text-[#d4af37] font-mono">{Math.round(buildProgress)}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="bg-gradient-to-r from-[#d4af37] to-[#b8962d] h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.4)]" style={{ width: `${buildProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto km-glass-card p-4 rounded-3xl flex flex-col gap-4 km-gold-glow transition-all focus-within:border-[#d4af37]/40 shadow-2xl">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-4 text-gray-500 hover:text-[#d4af37] transition-all rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90"
                  title="إرفاق صورة"
                >
                  <Camera size={22} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); } }} />
                
                <textarea 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="اصدر أوامرك السيادية هنا..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder-gray-700 outline-none font-bold resize-none max-h-32"
                  rows={1}
                />
                
                <button 
                  onClick={handleSend} 
                  disabled={isProcessing || (!input.trim() && !selectedImage)} 
                  className={`
                    p-4 md:px-8 rounded-2xl font-black transition-all flex items-center gap-3 active:scale-95
                    ${isProcessing || (!input.trim() && !selectedImage) ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-[#d4af37] text-black hover:bg-[#b8962d] km-gold-glow'}
                  `}
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  <span className="hidden md:inline text-[12px] uppercase tracking-widest">تنفيذ</span>
                </button>
              </div>
              
              {selectedImage && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#d4af37]/30 animate-in zoom-in-75">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md"><X size={10} /></button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
