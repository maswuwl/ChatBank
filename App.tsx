
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Search, Zap, Crown, Trash2, Loader2, 
  Link as LinkIcon, Camera, Plus, MessageSquare, 
  Database, Code, Eye, Activity, ChevronRight, Menu
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import { EngineMode, Message, MissionSession } from './core/types';
import { muntasirGenerateContent, muntasirGenerateImage } from './core/engine/geminiService';

const STORAGE_KEY = 'muntasir_sessions_v1';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<MissionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<EngineMode>(EngineMode.FLASH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateProgress = () => {
    setBuildProgress(0);
    const interval = setInterval(() => {
      setBuildProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + (Math.random() * 5);
      });
    }, 500);
    return interval;
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
    const progressInterval = simulateProgress();

    try {
      const isImageGen = currentInput.toLowerCase().includes('ولد صورة') || 
                         currentInput.toLowerCase().includes('ارسم') || 
                         currentInput.toLowerCase().includes('generate image');

      let modelResponse: Message;

      if (isImageGen) {
        const imageUrl = await muntasirGenerateImage(currentInput, mode === EngineMode.ULTRA ? '2K' : '1K');
        modelResponse = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: [
            { text: "تم توليد الصورة المطلوبة بناءً على أوامر شاتبنك السيادية." },
            { image: imageUrl }
          ],
          mode,
          timestamp: Date.now(),
        };
      } else {
        const result = await muntasirGenerateContent(currentInput, mode, currentImage || undefined, useSearch);
        modelResponse = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: [{ text: result.text }],
          mode,
          timestamp: Date.now(),
          sources: result.sources
        };
      }
      setBuildProgress(100);
      updateSessionMessages([...newMessages, modelResponse]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: [{ text: "وقع خلل في معالجة طلب شاتبنك. جاري تفعيل بروتوكول الإصلاح الذاتي." }],
        timestamp: Date.now(),
      };
      updateSessionMessages([...newMessages, errorMsg]);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsProcessing(false);
        setBuildProgress(0);
      }, 500);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const detectCode = (text: string) => {
    const codeBlockRegex = /```(?:html|javascript|css)?([\s\S]*?)```/g;
    const match = codeBlockRegex.exec(text);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveCodePreview(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#f3f4f6]">
      {activeCodePreview && (
        <ProjectSandbox 
          code={activeCodePreview} 
          onClose={() => setActiveCodePreview(null)} 
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* km-sidebar */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'} transition-all duration-500 km-glass-card border-l border-[#d4af37]/20 p-4 hidden lg:flex flex-col gap-6`}>
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#d4af37] rounded-lg flex items-center justify-center font-bold text-black text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                CB
              </div>
              <div>
                <h1 className="text-[#d4af37] font-bold text-lg leading-tight km-gold-text-glow">ChatBank</h1>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Sovereign Intel</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all active:scale-90">
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={createNewMission}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm hover:bg-[#b8962d] transition-all km-gold-glow active:scale-[0.98] transform"
          >
            <Plus size={18} />
            مهمة سيادية جديدة
          </button>

          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            <div className="text-[10px] font-bold text-gray-600 uppercase mb-2 px-2 flex items-center gap-2">
              <Database size={10} /> بنك المستودعات
            </div>
            {sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border active:scale-[0.97] transform ${
                  currentSessionId === s.id 
                    ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]' 
                    : 'border-transparent hover:bg-white/5 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={currentSessionId === s.id ? 'text-[#d4af37]' : 'text-gray-600'} />
                  <span className="text-xs font-bold truncate">{s.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#d4af37]/5 rounded-2xl border border-[#d4af37]/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">نظام الإصلاح</span>
              <Activity size={12} className="text-green-500" />
            </div>
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full animate-pulse shadow-[0_0_10px_#22c55e]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </aside>

        {/* km-main-content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <header className="h-16 border-b border-[#d4af37]/10 km-glass-card flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                 {!sidebarOpen && (
                   <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-[#d4af37] active:scale-90 transition-all">
                     <Menu size={20} />
                   </button>
                 )}
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setMode(EngineMode.FLASH)}
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 transform ${mode === EngineMode.FLASH ? 'bg-[#d4af37] text-black shadow-md' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                   >
                     CB-FLASH
                   </button>
                   <button 
                     onClick={() => setMode(EngineMode.ULTRA)}
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 transform ${mode === EngineMode.ULTRA ? 'bg-[#d4af37] text-black km-gold-glow' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                   >
                     CB-ULTRA
                   </button>
                 </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border active:scale-95 transform ${useSearch ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}
              >
                <Search size={14} />
                <span className="hidden sm:inline">{useSearch ? "مراقبة ميدانية" : "البحث معطل"}</span>
              </button>
              <div className="flex items-center gap-3 border-r border-white/10 pr-4 mr-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962d] flex items-center justify-center font-bold text-black shadow-lg">
                  خ
                </div>
                <span className="text-xs font-black text-gray-300 hidden sm:inline">خالد المنتصر</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
            <Dashboard />
            <VoiceInterface />

            {messages.length === 0 && (
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#d4af37]/20 blur-[50px] rounded-full animate-pulse"></div>
                  <div className="relative w-32 h-32 border-2 border-[#d4af37]/30 rounded-[2.5rem] flex items-center justify-center km-glass-card rotate-3 shadow-2xl">
                    <Crown className="text-[#d4af37]" size={64} />
                  </div>
                </div>
                <h2 className="text-4xl font-black text-[#d4af37] mb-6 km-gold-text-glow tracking-tighter">نظام شاتبنك السيادي</h2>
                <p className="text-sm text-gray-500 max-w-lg mx-auto leading-[2] font-medium">
                  أهلاً بك في ChatBank يا خالد. جميع المستودعات والعمليات تخضع الآن لنظام التدقيق السيادي الموحد.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-5 duration-700`}>
                <div className={`max-w-[95%] md:max-w-[85%] p-8 rounded-[2rem] relative shadow-2xl transition-all ${
                  msg.role === 'user' 
                    ? 'bg-[#d4af37]/10 border border-[#d4af37]/20 text-white rounded-tr-none' 
                    : 'km-glass-card text-gray-200 rounded-tl-none'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-2 h-2 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#d4af37] animate-pulse'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${msg.role === 'user' ? 'text-white/40' : 'text-[#d4af37]'}`}>
                      {msg.role === 'user' ? 'SOVEREIGN USER' : `CHATBANK ENGINE [${msg.mode || 'SOVEREIGN'}]`}
                    </span>
                  </div>
                  
                  {msg.content.map((part, i) => (
                    <div key={i} className="space-y-8">
                      {part.text && (
                        <div>
                          <p className="text-[16px] leading-[1.8] whitespace-pre-wrap font-medium">{part.text}</p>
                          {msg.role === 'model' && detectCode(part.text) && (
                            <div className="mt-8 p-6 rounded-3xl bg-black/40 border border-[#d4af37]/20 relative overflow-hidden group">
                               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent opacity-50"></div>
                               <div className="flex items-center justify-between mb-5">
                                 <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                   <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">مستودع شاتبنك جاهز</span>
                                 </div>
                                 <span className="text-[10px] font-black text-green-500 font-mono">REACT 19 • VITE • TAILWIND</span>
                               </div>
                               <button 
                                onClick={() => setActiveCodePreview(detectCode(part.text || ""))}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#d4af37] text-black rounded-[1.25rem] font-black text-sm hover:bg-[#b8962d] transition-all km-gold-glow active:scale-95 transform shadow-xl"
                              >
                                <Eye size={20} />
                                معاينة مشروع شاتبنك
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {part.image && (
                        <div className="mt-6 rounded-[2.5rem] overflow-hidden border border-[#d4af37]/30 bg-black/80 shadow-2xl group cursor-zoom-in">
                          <img src={part.image} alt="Sovereign Output" className="w-full h-auto max-h-[700px] object-contain group-hover:scale-[1.02] transition-transform duration-700" />
                        </div>
                      )}
                    </div>
                  ))}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-[#d4af37]/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {msg.sources.map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-[#d4af37]/10 border border-white/5 hover:border-[#d4af37]/40 transition-all group active:scale-[0.98] transform"
                        >
                          <LinkIcon size={16} className="text-[#d4af37] group-hover:rotate-12 transition-transform" />
                          <span className="text-[12px] text-gray-400 truncate group-hover:text-white font-bold">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* km-input-panel */}
          <div className="p-4 md:p-10 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent">
            {isProcessing && (
              <div className="max-w-5xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-3 px-4">
                   <div className="flex items-center gap-3">
                     <Loader2 size={14} className="text-[#d4af37] animate-spin" />
                     <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-[0.3em]">جاري معالجة طلب شاتبنك...</span>
                   </div>
                   <span className="text-[11px] font-black text-[#d4af37] font-mono tracking-widest">{Math.round(buildProgress)}%</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className="bg-gradient-to-r from-[#d4af37] to-[#b8962d] h-full rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                    style={{ width: `${buildProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="max-w-5xl mx-auto km-glass-card p-4 md:p-6 rounded-[2.5rem] flex flex-col gap-4 km-gold-glow border-[#d4af37]/30 transition-all focus-within:border-[#d4af37]/60">
              {selectedImage && (
                <div className="relative w-32 h-32 mb-2 group animate-in zoom-in-75">
                  <img src={selectedImage} alt="Upload Preview" className="w-full h-full object-cover rounded-3xl border-2 border-[#d4af37]/50 shadow-2xl" />
                  <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-2xl p-2.5 shadow-2xl hover:scale-110 active:scale-90 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 text-gray-500 hover:text-[#d4af37] transition-all rounded-[1.25rem] bg-white/5 hover:bg-[#d4af37]/10 border border-white/5 active:scale-90 transform"
                  title="نظام الرؤية السيادي"
                >
                  <Camera size={26} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اطلب من شاتبنك بناء مشروع سيادي جديد..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-3 text-[#f3f4f6] placeholder-gray-700 outline-none font-bold"
                />

                <button 
                  onClick={handleSend}
                  disabled={isProcessing || (!input.trim() && !selectedImage)}
                  className={`p-4 md:px-10 rounded-[1.5rem] font-black transition-all flex items-center gap-3 active:scale-95 transform shadow-2xl ${
                    isProcessing 
                      ? 'bg-gray-800 text-gray-600' 
                      : 'bg-[#d4af37] text-black hover:bg-[#b8962d] km-gold-glow'
                  }`}
                >
                  {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
                  <span className="hidden md:inline">تنفيذ الأمر</span>
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
