
import React, { useState, useEffect, useRef } from 'react';
import { X, Code2, Monitor, Download, Github, Loader2, CheckCircle2, AlertCircle, BarChart3, Activity, ShieldCheck, Smartphone, Cpu, Wrench, Maximize2, Minimize2, Copy } from 'lucide-react';
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
  const [repoName] = useState('CB-SOVEREIGN-' + Math.random().toString(36).substring(7).toUpperCase());
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
        body { font-family: 'Noto Kufi Arabic', sans-serif; margin: 0; padding: 0; background: #fafafa; }
        ::-webkit-scrollbar { width: 5px; }
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
      console.error("Repair protocol failed");
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
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'} bg-black/98 backdrop-blur-3xl transition-all duration-500`}>
      <div className={`w-full h-full ${isFullscreen ? '' : 'max-w-7xl rounded-[2.5rem] border border-[#d4af37]/20 shadow-2xl'} km-glass flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-[#d4af37] font-black text-sm tracking-tight uppercase">المستعرض السيادي</h3>
              <p className="text-[8px] text-gray-500 font-bold tracking-[0.2em] mt-0.5">{repoName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={copyToClipboard} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-[#d4af37] transition-all border border-transparent hover:border-white/10">
              {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-[#d4af37] transition-all">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={runSovereignRepair} disabled={isRepairing} className="flex items-center gap-2 px-6 py-2.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 font-black text-[10px] uppercase transition-all hover:bg-green-500/20">
              {isRepairing ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
              <span>الترميم السيادي</span>
            </button>
            <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-white relative">
          <iframe ref={iframeRef} srcDoc={srcDoc} title="Preview" className="w-full h-full border-none" sandbox="allow-scripts allow-forms allow-modals" />
          {isRepairing && (
            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-50 animate-in fade-in duration-300">
              <div className="w-16 h-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
              <div className="text-center">
                <h4 className="text-[#d4af37] font-black text-lg tracking-widest uppercase">بروتوكول الترميم نشط</h4>
                <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-[0.3em]">إعادة بناء هيكلة الكود بمعايير خالد المنتصر...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSandbox;
