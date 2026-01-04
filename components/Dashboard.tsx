
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, Database, Terminal } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [latency, setLatency] = useState(8);

  useEffect(() => {
    const i = setInterval(() => setLatency(Math.floor(Math.random() * 5) + 5), 5000);
    return () => clearInterval(i);
  }, []);

  const items = [
    { icon: <ShieldCheck size={14} />, label: "Security", val: "Optimal", color: "text-green-500" },
    { icon: <Zap size={14} />, label: "Response", val: `${latency}ms`, color: "text-[#d4af37]" },
    { icon: <Database size={14} />, label: "Sovereign Nodes", val: "Encrypted", color: "text-blue-500" },
    { icon: <Terminal size={14} />, label: "System IQ", val: "Alpha-X1", color: "text-[#d4af37]" },
    { icon: <Activity size={14} />, label: "Logic Flow", val: "99.9%", color: "text-[#d4af37]" }
  ];

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar flex-nowrap md:justify-center">
      {items.map((item, idx) => (
        <div key={idx} className="flex-none bg-[#0a0a0a] border border-white/5 px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[150px] hover:border-[#d4af37]/20 transition-all duration-300 group">
          <div className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
          <div>
            <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest mb-0.5">{item.label}</p>
            <p className="text-[11px] font-black text-white uppercase tracking-tight">{item.val}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
