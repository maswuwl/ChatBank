
import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Loader2, Zap, Eye, Globe, Code, Plus, MoreHorizontal, X } from 'lucide-react';
import { EngineMode, Message, MissionSession } from '../core/types';
import { muntasirGenerateContentStream } from '../core/engine/geminiService';
import TypewriterText from './TypewriterText';

interface MessengerWindowProps {
  session: MissionSession;
  onUpdateSession: (session: MissionSession) => void;
  onOpenPreview: (code: string) => void;
}

const MessengerWindow: React.FC<MessengerWindowProps> = ({ session, onUpdateSession, onOpenPreview }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<EngineMode>(EngineMode.FLASH);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: [{ text: input }, ...(selectedImage ? [{ image: selectedImage }] : [])],
      timestamp: Date.now()
    };

    const updatedMessages = [...session.messages, userMsg];
    onUpdateSession({ ...session, messages: updatedMessages, lastUpdated: Date.now() });

    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsProcessing(true);

    const resId = (Date.now() + 1).toString();
    const initialResMsg: Message = {
      id: resId,
      role: 'model',
      content: [{ text: '' }],
      mode,
      timestamp: Date.now(),
      modelName: mode
    };

    onUpdateSession({ ...session, messages: [...updatedMessages, initialResMsg] });

    try {
      // Fix: Added search tool flag if ULTRA mode is selected to demonstrate grounding capabilities
      const stream = muntasirGenerateContentStream(currentInput, mode, {
        imageBase64: currentImage || undefined,
        context: "محادثة اجتماعية تقنية داخل ميسنجر شاتبنك",
        search: mode === EngineMode.ULTRA
      });

      let fullText = "";
      for await (const chunk of stream) {
        fullText = chunk.text;
        onUpdateSession({
          ...session,
          messages: [...updatedMessages, {
            ...initialResMsg,
            content: [{ text: fullText }],
            sources: chunk.sources,
            modelName: chunk.meta?.model
          }]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractCode = (text: string) => {
    const matches = [...text.matchAll(/```(?:html|javascript|css|react)?([\s\S]*?)```/g)];
    return matches.length > 0 ? matches[matches.length - 1][1] : null;
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative">
      {/* Messenger Header */}
      <div className="p-5 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8962d] p-0.5 shadow-lg">
             <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[#d4af37] font-black text-xs">AI</div>
          </div>
          <div>
            <h3 className="text-[12px] font-black text-white uppercase tracking-widest">ChatBank Intelligence</h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Sovereign Protocol Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <select 
             value={mode} 
             onChange={(e) => setMode(e.target.value as EngineMode)}
             className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[9px] font-black text-[#d4af37] outline-none"
           >
             <option value={EngineMode.FLASH}>FLASH</option>
             <option value={EngineMode.ULTRA}>ULTRA</option>
           </select>
           <button className="p-2 text-gray-500 hover:text-white transition-all"><MoreHorizontal size={20} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {session.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] border ${msg.role === 'user' ? 'bg-[#d4af37]/5 border-[#d4af37]/20 rounded-tr-lg' : 'bg-white/5 border-white/5 rounded-tl-lg'}`}>
               <div className="flex items-center gap-2 mb-3 opacity-40">
                  <span className="text-[8px] font-black uppercase tracking-widest">{msg.role === 'user' ? 'Commander' : 'Sovereign Core'}</span>
               </div>
               {msg.content.map((c, idx) => {
                 const code = extractCode(c.text || "");
                 return (
                   <div key={idx} className="space-y-4">
                     {c.text && (
                       msg.role === 'model' ? (
                         <TypewriterText text={c.text} onUpdate={scrollToBottom} />
                       ) : (
                         <p className="text-[13px] text-gray-200 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                       )
                     )}
                     {code && (
                        <button 
                          onClick={() => onOpenPreview(code)}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-[#d4af37] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#d4af37]/10"
                        >
                          <Eye size={16} /> تشغيل المشروع السيادي
                        </button>
                     )}
                     {c.image && <img src={c.image} className="rounded-2xl border border-white/10 max-w-full" alt="User content" />}
                   </div>
                 )
               })}
               
               {/* Fix: Added grounding sources display to comply with Google Search grounding requirements */}
               {msg.sources && msg.sources.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">المصادر السيادية:</p>
                   <div className="flex flex-wrap gap-2">
                     {msg.sources.map((source, sIdx) => (
                       <a 
                         key={sIdx} 
                         href={source.uri} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] text-[#d4af37] hover:border-[#d4af37]/40 transition-all font-bold group"
                       >
                         <Globe size={10} className="group-hover:rotate-12 transition-transform" />
                         <span className="max-w-[150px] truncate">{source.title}</span>
                       </a>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Chat Input */}
      <div className="p-5 bg-gradient-to-t from-black to-transparent">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-[2.5rem] focus-within:border-[#d4af37]/40 transition-all">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-[#d4af37] transition-all">
            <Camera size={22} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
             const file = e.target.files?.[0];
             if(file) {
               const reader = new FileReader();
               reader.onload = () => setSelectedImage(reader.result as string);
               reader.readAsDataURL(file);
             }
          }} />
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="اكتب رسالة أو اطلب مشروعاً..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder-gray-700 py-3 outline-none resize-none"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={isProcessing || (!input.trim() && !selectedImage)}
            className={`p-3.5 rounded-full transition-all ${isProcessing || (!input.trim() && !selectedImage) ? 'bg-white/5 text-gray-700' : 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20 hover:scale-110'}`}
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        {selectedImage && (
          <div className="mt-3 relative w-16 h-16 rounded-xl overflow-hidden border border-[#d4af37]/40 ml-auto group">
             <img src={selectedImage} className="w-full h-full object-cover" alt="Selected preview" />
             {/* Fix: 'X' icon is now correctly imported and used */}
             <button 
               onClick={() => setSelectedImage(null)} 
               className="absolute top-0 right-0 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors shadow-lg"
             >
               <X size={10} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerWindow;
