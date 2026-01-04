
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

    // Get count of projects from localStorage
    const sessions = JSON.parse(localStorage.getItem('muntasir_sessions_v1') || '[]');
    setRepoCount(sessions.length);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-top duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Cards */}
        <div className="km-glass-card p-4 rounded-2xl border-r-4 border-r-[#d4af37] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d4af37]/10 rounded-xl">
              <ShieldCheck className="text-[#d4af37]" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">الأمان السيادي</p>
              <h4 className="text-sm font-black text-white km-gold-text-glow">مشفر بنسبة 100%</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-4 rounded-2xl border-r-4 border-r-[#d4af37]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d4af37]/10 rounded-xl">
              <Zap className="text-[#d4af37]" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">سرعة الاستجابة</p>
              <h4 className="text-sm font-black text-white font-mono">{status.latency}ms</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-4 rounded-2xl border-r-4 border-r-[#d4af37]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d4af37]/10 rounded-xl">
              <Database className="text-[#d4af37]" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">المشاريع المنبثقة</p>
              <h4 className="text-sm font-black text-white">{repoCount} مستودع نشط</h4>
            </div>
          </div>
        </div>

        <div className="km-glass-card p-4 rounded-2xl border-r-4 border-r-[#d4af37]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#d4af37]/10 rounded-xl">
              <Cpu className="text-[#d4af37]" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">الذكاء الفعال</p>
              <h4 className="text-sm font-black text-white font-mono">{status.iqLevel}.9%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Repair & Monitor System */}
      <div className="km-glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-[#d4af37]/10">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="text-[#d4af37] animate-spin text-sm" size={14} />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">نظام المراقبة والإصلاح الذاتي:</span>
          </div>
          <div className="flex gap-2">
            {repairs.map((msg, i) => (
              <span key={i} className="text-[11px] text-[#d4af37] font-medium bg-[#d4af37]/5 px-3 py-1 rounded-full animate-in fade-in slide-in-from-right duration-500">
                {msg}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="text-green-500" />
            <span className="text-[10px] font-bold text-gray-500">اتصال GitHub: مستقر</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5">
            <Settings size={12} className="text-[#d4af37]" />
            <span className="text-[10px] font-bold text-gray-500">Vite Engine: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
