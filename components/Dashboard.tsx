
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Database } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [latency, setLatency] = useState(5);

  useEffect(() => {
    const i = setInterval(() => setLatency(Math.floor(Math.random() * 3) + 4), 5000);
    return () => clearInterval(i);
  }, []);

  const stats = [
    { icon: <ShieldCheck size={12} />, label: "حالة السيادة", val: "مستقرة", color: "text-green-500" },
    { icon: <Zap size={12} />, label: "سرعة الترميم", val: `${latency}ms`, color: "text-[#d4af37]" },
    { icon: <Database size={12} />, label: "الأصول الرقمية", val: "مؤمنة", color: "text-blue-500" },
    { icon: <Activity size={12} />, label: "كفاءة العقل", val: "99.9%", color: "text-[#d4af37]" }
  ];

  return (
    <div className="flex flex-wrap gap-2 md:gap-4 mb-2">
      {stats.map((s, idx) => (
        <div key={idx} className="flex-1 min-w-[120px] bg-[#0a0a0a] border border-white/5 p-2.5 rounded-2xl flex items-center gap-3 transition-all hover:border-[#d4af37]/20">
          <div className={`p-2 rounded-lg bg-white/5 ${s.color}`}>{s.icon}</div>
          <div>
            <p className="text-[6px] text-gray-600 uppercase font-black tracking-widest mb-0.5">{s.label}</p>
            <p className={`text-[9px] font-black uppercase ${s.color === 'text-[#d4af37]' ? 'text-white' : s.color}`}>{s.val}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
