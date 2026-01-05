
import React, { useState, useEffect, useRef } from 'react';
import { X, Code2, Loader2, CheckCircle2, Cpu, Wrench, Maximize2, Minimize2, Copy, FileCode, Play, Share2, Smartphone } from 'lucide-react';
import { muntasirRepairCode } from '../core/engine/geminiService';

interface ProjectSandboxProps {
  code: string;
  onClose: () => void;
}

const ProjectSandbox: React.FC<ProjectSandboxProps> = ({ code, onClose }) => {
  const [currentCode, setCurrentCode] = useState(code);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [repoName] = useState('SOVEREIGN-PROJECT-' + Math.random().toString(36).substring(7).toUpperCase());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cleanCode = currentCode.replace(/```html|```javascript|```css|```react|```/g, '').trim();

  // تجميع الكود في بيئة معزولة تدعم التيلويند والخطوط العربية
  const srcDoc = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Noto Kufi Arabic', sans-serif; margin: 0; padding: 0; background: #050505; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
      </style>
    </head>
    <body>
      ${cleanCode}
    </body>
    </html>
  `;

  const runSovereignRepair = async () => {
    setIsRepairing(true);
    try {
      const repaired = await muntasirRepairCode(currentCode);
      setCurrentCode(repaired);
    } catch (e) {
      console.error("Repair Unit Error");
    } finally {
      setIsRepairing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-[2000] flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 md:p-8'} bg-black/95 backdrop-blur-3xl transition-all duration-500`}>
      <div className={`w-full h-full ${isFullscreen ? '' : 'max-w-[98%] max-h-[96%] rounded-[2.5rem] border border-[#d4af37]/30 shadow-[0_0_150px_rgba(212,175,55,0.2)]'} km-glass flex flex-col overflow-hidden`}>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/60 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8962d] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#d4af37]/20 transition-transform hover:scale-105">
              <FileCode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[#d4af37] font-black text-sm tracking-[0.3em] uppercase">Project Sandbox</h3>
                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black rounded-full border border-green-500/20 uppercase animate-pulse">Live</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mt-1 uppercase">{repoName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={copyToClipboard} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-xl text-gray-400 hover:text-[#d4af37] transition-all border border-white/5 hover:border-[#d4af37]/40 font-black text-[10px] uppercase group"
            >
              {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} className="group-hover:rotate-12 transition-transform" />}
              <span className="hidden md:block">Copy Code</span>
            </button>
            
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-[#d4af37] transition-all border border-white/5"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            <button 
              onClick={runSovereignRepair} 
              disabled={isRepairing} 
              className="flex items-center gap-2 px-6 py-2.5 bg-[#d4af37] text-black rounded-xl font-black text-[10px] uppercase transition-all hover:bg-[#efc745] active:scale-95 shadow-lg shadow-[#d4af37]/20"
            >
              {isRepairing ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
              <span className="hidden md:block">Sovereign Repair</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all hover:text-white border border-red-500/20 shadow-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Iframe Viewport */}
        <div className="flex-1 relative bg-white overflow-hidden shadow-inner">
           <iframe 
             ref={iframeRef} 
             srcDoc={srcDoc} 
             title="Project Preview" 
             className="w-full h-full border-none bg-white" 
             sandbox="allow-scripts allow-forms allow-modals" 
           />
           
           {/* Repair Overlay */}
           {isRepairing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center gap-10 z-[3000] animate-in fade-in duration-500">
                  <div className="relative">
                      <div className="w-32 h-32 border-2 border-[#d4af37]/20 rounded-full animate-ping absolute"></div>
                      <div className="w-32 h-32 border-t-4 border-[#d4af37] rounded-full animate-spin"></div>
                      <Cpu className="absolute inset-0 m-auto text-[#d4af37]" size={48} />
                  </div>
                  <div className="text-center">
                      <h4 className="text-[#d4af37] font-black text-2xl tracking-[0.5em] uppercase mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">Repairing System Logic</h4>
                      <div className="flex items-center justify-center gap-3">
                          {[0, 75, 150].map(delay => (
                            <span key={delay} className="w-2.5 h-2.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></span>
                          ))}
                      </div>
                      <p className="text-[11px] text-gray-500 font-bold mt-8 uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed">
                          جاري إعادة بناء الهيكلية البرمجية وتحسين استجابة الواجهة وفق المعايير السيادية لخالد المنتصر...
                      </p>
                  </div>
              </div>
           )}
        </div>

        {/* Footer Status */}
        <div className="px-8 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
           <div className="flex items-center gap-8 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_green]"></div> Core Online</div>
              <div className="flex items-center gap-2 text-blue-400"><Play size={12} /> Live Runtime</div>
              {/* Fix: Added Smartphone to the import list above */}
              <div className="flex items-center gap-2 text-[#d4af37]"><Smartphone size={12} /> Responsive-OK</div>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Sovereign OS v4.2</span>
              <div className="w-px h-3 bg-white/10"></div>
              <button className="text-[9px] font-black text-[#d4af37] hover:text-white transition-all uppercase flex items-center gap-2">
                <Share2 size={12} /> Export Project
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSandbox;
