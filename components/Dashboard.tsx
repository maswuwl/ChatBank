
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Cpu, Settings, Database, RefreshCw, Globe } from 'lucide-react';
import { SystemStatus } from '../core/types';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    health: 'Optimal',
    latency: 12,
    iqLevel: 98,
  });

  const [repairs, setRepairs] = useState<string[]>(['فحص النواة...', 'تشفير القنوات...']);
  const [repoCount, setRepoCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 10) + 2,
        iqLevel: 98 + Math.floor(Math.random() * 2),
      }));
      
      const messages = [
        'تحسين ربط المستودعات...',
        'ترميم الثغرات البرمجية...',
        'مزامنة السيادة الرقمية...',
        'تحديث بروتوكول KM-X1...',
        'تأمين اتصال GitHub...'
      ];
      setRepairs(prev => [messages[Math.floor(Math.random() * messages.length)], ...prev.slice(0, 1)]);
    }, 5000);

    const sessions = JSON.parse(localStorage.getItem('muntasir_sessions_v1') || '[]');
    setRepoCount(sessions.length);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 mb-6 animate-in fade-in slide-in-from-top duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Status Cards */}
        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37] relative overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <ShieldCheck className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">الأمان السيادي</p>
              <h4 className="text-[10px] font-black text-white km-gold-text-glow">مشفر 100%</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <Zap className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">الاستجابة</p>
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
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">المستودعات</p>
              <h4 className="text-[10px] font-black text-white">{repoCount} نشط</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-3 rounded-xl border-r-2 border-r-[#d4af37]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4af37]/10 rounded-lg">
              <Cpu className="text-[#d4af37]" size={14} />
            </div>
            <div>
              <p className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">الذكاء الفعال</p>
              <h4 className="text-[10px] font-black text-white font-mono">{status.iqLevel}.9%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Repair & Monitor System */}
      <div className="km-glass-card p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 border border-[#d4af37]/5">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="text-[#d4af37] animate-spin" size={10} />
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">نظام المراقبة:</span>
          </div>
          <div className="flex gap-1.5">
            {repairs.map((msg, i) => (
              <span key={i} className="text-[8px] text-[#d4af37] font-medium bg-[#d4af37]/5 px-2 py-0.5 rounded-md animate-in fade-in slide-in-from-right duration-500">
                {msg}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Globe size={10} className="text-green-500/70" />
            <span className="text-[8px] font-bold text-gray-600">GitHub: مستقر</span>
          </div>
          <div className="w-[1px] h-3 bg-white/5"></div>
          <div className="flex items-center gap-1">
            <Settings size={10} className="text-[#d4af37]/70" />
            <span className="text-[8px] font-bold text-gray-600">Vite: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
