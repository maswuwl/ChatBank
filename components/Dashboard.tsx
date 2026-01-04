
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Database, Server } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 5) + 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
      <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl flex items-center gap-3">
        <ShieldCheck size={14} className="text-green-500" />
        <div>
          <p className="text-[6px] text-gray-600 uppercase font-bold tracking-widest">أمن السيادة</p>
          <p className="text-[9px] font-black text-white">نشط ومؤمن</p>
        </div>
      </div>
      
      <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl flex items-center gap-3">
        <Zap size={14} className="text-[#d4af37]" />
        <div>
          <p className="text-[6px] text-gray-600 uppercase font-bold tracking-widest">الاستجابة</p>
          <p className="text-[9px] font-black text-white">{latency}ms</p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl flex items-center gap-3 hidden md:flex">
        <Database size={14} className="text-blue-500" />
        <div>
          <p className="text-[6px] text-gray-600 uppercase font-bold tracking-widest">المستودعات</p>
          <p className="text-[9px] font-black text-white">تحت السيطرة</p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 p-3 rounded-xl flex items-center gap-3 hidden md:flex">
        <Activity size={14} className="text-[#d4af37] animate-pulse" />
        <div>
          <p className="text-[6px] text-gray-600 uppercase font-bold tracking-widest">النظام</p>
          <p className="text-[9px] font-black text-white uppercase tracking-tighter">Optimal</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
