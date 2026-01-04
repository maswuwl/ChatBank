
import React, { useState, useEffect, useRef } from 'react';
import { X, Code2, Monitor, Download, Github, Loader2, CheckCircle2, AlertCircle, BarChart3, Activity, ShieldCheck, Smartphone, Cpu, Wrench, Maximize2, Minimize2 } from 'lucide-react';
import { muntasirRepairCode } from '../core/engine/geminiService';

interface ProjectSandboxProps {
  code: string;
  onClose: () => void;
}

const ProjectSandbox: React.FC<ProjectSandboxProps> = ({ code, onClose }) => {
  const [currentCode, setCurrentCode] = useState(code);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [repoName, setRepoName] = useState('CB-PROJECT-' + Math.random().toString(36).substring(7).toUpperCase());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cleanCode = currentCode.replace(/```html|```javascript|```css|```react|```/g, '').trim();

  const srcDoc = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Noto Kufi Arabic', sans-serif; margin: 0; padding: 0; background: #fafafa; color: #111; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
        .km-preview-root { min-height: 100vh; }
      </style>
    </head>
    <body>
      <div class="km-preview-root">
        ${cleanCode}
      </div>
    </body>
    </html>
  `;

  const runSovereignRepair = async () => {
    setIsRepairing(true);
    try {
      const repaired = await muntasirRepairCode(currentCode);
      setCurrentCode(repaired);
    } catch (e) {
      console.error("Repair failed", e);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'} bg-black/98 backdrop-blur-2xl transition-all duration-500`}>
      <div className={`w-full h-full ${isFullscreen ? '' : 'max-w-7xl rounded-3xl border border-[#d4af37]/20 shadow-[0_0_100px_rgba(212,175,55,0.1)]'} km-glass-card flex flex-col overflow-hidden`}>
        
        {/* Header فخم */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d4af37]/10 bg-[#080808]/80">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20 ${isRepairing ? 'animate-pulse' : ''}`}>
              <ShieldCheck className="text-[#d4af37]" size={20} />
            </div>
            <div>
              <h3 className="text-[#d4af37] font-black text-sm km-gold-text-glow tracking-tight">مستعرض المشاريع السيادية</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{repoName} | جاهز للنشر</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 transition-all border border-transparent hover:border-white/10"
              title="تغيير وضع العرض"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button 
              onClick={runSovereignRepair}
              disabled={isRepairing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all font-black text-[10px]"
            >
              {isRepairing ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
              <span className="hidden sm:inline">ترميم المشروع</span>
            </button>

            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#d4af37] text-black hover:bg-[#b8962d] transition-all font-black text-[10px] km-gold-glow"
            >
              <Download size={14} />
              <span className="hidden sm:inline">استخراج كملف سيادي</span>
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

            <button onClick={onClose} className="p-2.5 hover:bg-red-500/10 rounded-2xl text-gray-500 hover:text-red-400 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* منطقة العرض */}
        <div className="flex-1 bg-white relative">
          <iframe 
            ref={iframeRef}
            srcDoc={srcDoc} 
            title="ChatBank Project Preview" 
            className="w-full h-full border-none" 
            sandbox="allow-scripts allow-forms allow-modals" 
          />
          
          {isRepairing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-[#050505] p-8 rounded-3xl border border-[#d4af37]/30 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(212,175,55,0.2)] animate-in zoom-in-95">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#d4af37]/10 rounded-full animate-spin border-t-[#d4af37]"></div>
                  <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d4af37] animate-pulse" size={24} />
                </div>
                <div className="text-center">
                  <h4 className="text-[#d4af37] font-black text-lg km-gold-text-glow">بروتوكول الترميم نشط</h4>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">يتم الآن إعادة هيكلة الكود بمعايير خالد المنتصر...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSandbox;
