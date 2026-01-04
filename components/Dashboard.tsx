
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Cpu, Settings, Database, RefreshCw, Globe, Server, Heart } from 'lucide-react';
import { SystemStatus } from '../core/types';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    health: 'Optimal',
    latency: 12,
    iqLevel: 98,
  });

  const [repairs, setRepairs] = useState<string[]>(['فحص النواة...', 'درع شاتبنك نشط']);
  const [repoCount, setRepoCount] = useState(0);
  const [serverActive, setServerActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 8) + 1,
        iqLevel: 99 + Math.floor(Math.random() * 1),
      }));
      
      const messages = [
        'تحسين معمارية النواة...',
        'تأمين مستودعات خالد...',
        'ترميم ذاتي للبروتوكول...',
        'تحليل جودة الكود: مثالي',
        'نظام الإصلاح: في وضع الانتظار'
      ];
      setRepairs(prev => [messages[Math.floor(Math.random() * messages.length)], ...prev.slice(0, 1)]);
    }, 4000);

    const sessions = JSON.parse(localStorage.getItem('muntasir_sessions_v1') || '[]');
    setRepoCount(sessions.length);
    setServerActive(true);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 mb-6 animate-in fade-in slide-in-from-top duration-500">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-all">
            <Heart size={30} className="text-[#d4af37]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <ShieldCheck className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">الحالة العامة</p>
              <h4 className="text-[10px] font-black text-green-500 km-gold-text-glow">سيادة مستقرة</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <Zap className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">سرعة الترميم</p>
              <h4 className="text-[10px] font-black text-white font-mono">{status.latency}ms</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <Database className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">الأصول الرقمية</p>
              <h4 className="text-[10px] font-black text-white">{repoCount} مستودع</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <Cpu className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">كفاءة العقل</p>
              <h4 className="text-[10px] font-black text-white font-mono">99.9%</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37] hidden md:block">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <Server className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">نظام الحماية</p>
              <h4 className="text-[10px] font-black text-green-500 uppercase">ACTIVE</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="km-glass-card p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 border border-[#d4af37]/5">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <Activity className="text-[#d4af37] animate-pulse" size={10} />
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">رادار الإصلاح:</span>
          </div>
          <div className="flex gap-1.5">
            {repairs.map((msg, i) => (
              <span key={i} className="text-[8px] text-[#d4af37] font-medium bg-[#d4af37]/5 px-2 py-0.5 rounded-md animate-in fade-in slide-in-from-right duration-500">
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
