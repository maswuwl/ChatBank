
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, MessageSquare, Bell, Users, User, Settings, Search, 
  Plus, MoreVertical, Heart, MessageCircle, Share2, Globe, Cpu, Zap, Eye, ShieldAlert
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import ProjectSandbox from './components/ProjectSandbox';
import MessengerWindow from './components/MessengerWindow';
import { ViewState, Post, Notification, MissionSession, EngineMode } from './core/types';

const STORAGE_KEY = 'chatbank_social_v1';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('feed');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [sessions, setSessions] = useState<MissionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [posts] = useState<Post[]>([
    {
      id: '1',
      author: { name: 'خالد المنتصر', avatar: 'K', verified: true },
      content: 'مرحباً بكم في عصر السيادة المعلوماتية. ChatBank ليس مجرد أداة، بل هو رفيقك البرمجي والذكاء الذي يقودك للمستقبل. ⚡🚀',
      likes: 1250,
      comments: 84,
      timestamp: 'منذ ساعتين'
    },
    {
      id: '2',
      author: { name: 'Sovereign Core', avatar: 'AI', verified: false },
      content: 'تم تحديث النواة السيادية (Local X1) بنجاح. بروتوكولات الأمان الآن في أعلى مستوياتها. #ChatBank #Intelligence',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000',
      likes: 856,
      comments: 32,
      timestamp: 'منذ 5 ساعات'
    }
  ]);

  const [notifications] = useState<Notification[]>([
    { id: '1', type: 'like', user: 'أحمد علي', text: 'أعجب بمنشورك الأخير', time: '10 د', read: false },
    { id: '2', type: 'ai_mention', user: 'Sovereign Core', text: 'لديه اقتراح لمشروعك الجديد', time: '1 س', read: true }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed.sessions || []);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions }));
  }, [sessions]);

  const getOrCreateSession = () => {
    if (sessions.length > 0) return sessions[0];
    const newS: MissionSession = { id: 'default', title: 'Main Chat', messages: [], lastUpdated: Date.now() };
    setSessions([newS]);
    return newS;
  };

  const updateSession = (updated: MissionSession) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      {activeCode && <ProjectSandbox code={activeCode} onClose={() => setActiveCode(null)} />}

      {/* Desktop Sidebar (Left) */}
      <aside className="hidden lg:flex flex-col w-72 border-l border-white/5 bg-black/40 backdrop-blur-2xl p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#d4af37] rounded-2xl flex items-center justify-center text-black font-black shadow-lg shadow-[#d4af37]/20">CB</div>
          <div>
             <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase">ChatBank</h1>
             <p className="text-[8px] text-[#d4af37] font-bold uppercase tracking-widest">Sovereign Social</p>
          </div>
        </div>

        <nav className="space-y-3 flex-1">
          {[
            { id: 'feed', icon: <Home size={20} />, label: 'News Feed' },
            { id: 'messenger', icon: <MessageSquare size={20} />, label: 'Messenger' },
            { id: 'notifications', icon: <Bell size={20} />, label: 'Notifications' },
            { id: 'groups', icon: <Users size={20} />, label: 'Groups & Pages' },
            { id: 'profile', icon: <User size={20} />, label: 'My Profile' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${view === item.id ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
            >
              {item.icon}
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
           <Dashboard />
           <button onClick={() => setView('settings')} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-500 hover:bg-white/5 transition-all mt-4">
              <Settings size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Settings</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navigation / Search */}
        <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 bg-[#050505]/90 backdrop-blur-3xl sticky top-0 z-[100]">
           <div className="flex items-center gap-6 flex-1 max-w-xl">
              <div className="relative w-full group">
                 <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#d4af37] transition-colors" />
                 <input 
                   placeholder="ابحث عن أصدقاء، مشاريع، أو عوالم سيادية..." 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 text-xs outline-none focus:border-[#d4af37]/40 transition-all placeholder:text-gray-700"
                 />
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-3 bg-[#d4af37] text-black rounded-2xl shadow-lg shadow-[#d4af37]/20 hover:scale-110 transition-all">
                <Plus size={22} />
              </button>
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-[10px] font-black text-white uppercase">Khalid Muntasir</span>
                 <span className="text-[8px] text-[#d4af37] font-bold uppercase">Pro Builder</span>
              </div>
           </div>
        </header>

        {/* View Switcher */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {view === 'feed' && (
            <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
               <VoiceInterface />
               <div className="km-glass p-6 rounded-[2.5rem] border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8962d] p-0.5">
                     <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black">K</div>
                  </div>
                  <button className="flex-1 text-right px-6 py-3 bg-white/5 rounded-2xl text-gray-500 text-[12px] font-medium hover:bg-white/10 transition-all">
                     بماذا تفكر يا قائد؟
                  </button>
               </div>

               {posts.map(post => (
                 <div key={post.id} className="km-glass rounded-[2.5rem] border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6">
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-black text-[#d4af37]">
                                {post.author.avatar}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <h4 className="text-[13px] font-black text-white uppercase">{post.author.name}</h4>
                                   {post.author.verified && <Zap size={12} className="text-[#d4af37] fill-[#d4af37]" />}
                                </div>
                                <span className="text-[9px] text-gray-600 font-bold uppercase">{post.timestamp}</span>
                             </div>
                          </div>
                          <button className="p-2 text-gray-600 hover:text-white transition-all"><MoreVertical size={18} /></button>
                       </div>
                       <p className="text-[14px] leading-relaxed mb-6 text-gray-300">{post.content}</p>
                       {post.image && (
                         <img src={post.image} className="w-full h-80 object-cover rounded-3xl mb-6 border border-white/5" />
                       )}
                       <div className="flex items-center gap-6 border-t border-white/5 pt-6">
                          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-all text-xs font-bold">
                             <Heart size={18} /> {post.likes}
                          </button>
                          <button className="flex items-center gap-2 text-gray-500 hover:text-[#d4af37] transition-all text-xs font-bold">
                             <MessageCircle size={18} /> {post.comments}
                          </button>
                          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-all text-xs font-bold mr-auto">
                             <Share2 size={18} />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {view === 'messenger' && (
             <MessengerWindow 
               session={getOrCreateSession()} 
               onUpdateSession={updateSession}
               onOpenPreview={(code) => setActiveCode(code)}
             />
          )}

          {view === 'notifications' && (
            <div className="max-w-2xl mx-auto py-12 px-6 space-y-4">
               <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8">الإشعارات</h2>
               {notifications.map(n => (
                 <div key={n.id} className={`p-6 rounded-3xl border ${n.read ? 'bg-white/5 border-white/5' : 'bg-[#d4af37]/5 border-[#d4af37]/20'} flex items-center gap-4 transition-all hover:scale-[1.01]`}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#d4af37]">
                       {n.type === 'like' ? <Heart size={20} /> : <Zap size={20} />}
                    </div>
                    <div className="flex-1">
                       <p className="text-[13px] text-gray-200">
                          <span className="font-black text-[#d4af37] ml-1">{n.user}</span>
                          {n.text}
                       </p>
                       <span className="text-[9px] text-gray-600 font-bold uppercase mt-1 block">{n.time}</span>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-[#d4af37] rounded-full shadow-[0_0_8px_#d4af37]"></div>}
                 </div>
               ))}
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto py-16 px-6">
               <div className="relative mb-24">
                  <div className="h-64 w-full bg-gradient-to-br from-[#111] to-black rounded-[3rem] border border-white/5 overflow-hidden">
                     <div className="absolute inset-0 bg-[#d4af37]/5 backdrop-blur-3xl animate-pulse"></div>
                  </div>
                  <div className="absolute -bottom-16 right-12 flex items-end gap-8">
                     <div className="w-40 h-40 rounded-[2.5rem] bg-black border-4 border-[#050505] shadow-2xl p-1">
                        <div className="w-full h-full bg-gradient-to-br from-[#d4af37] to-[#b8962d] rounded-[2rem] flex items-center justify-center text-5xl font-black text-black">K</div>
                     </div>
                     <div className="pb-8">
                        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-1">خالد المنتصر</h2>
                        <p className="text-xs text-[#d4af37] font-black uppercase tracking-[0.3em]">Commander of Sovereign Intelligence</p>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-6 mb-12">
                  {[
                    { label: 'المنشورات', val: '128' },
                    { label: 'الأصدقاء', val: '4.2k' },
                    { label: 'المشاريع', val: '56' }
                  ].map((stat, i) => (
                    <div key={i} className="km-glass p-6 rounded-3xl border-white/5 text-center">
                       <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                       <p className="text-xl font-black text-white">{stat.val}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Desktop Friends/Status Sidebar (Right) */}
      <aside className="hidden xl:flex flex-col w-80 border-r border-white/5 bg-black/20 p-8">
         <div className="mb-10">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Trending Technology</h3>
            <div className="space-y-4">
               {['#ChatBank_Live', '#Sovereign_AI', '#React_Project_Builder'].map((tag, i) => (
                 <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#d4af37]/30 transition-all cursor-pointer group">
                    <p className="text-[11px] font-black text-[#d4af37] group-hover:text-white">{tag}</p>
                    <span className="text-[8px] text-gray-700 font-bold uppercase">4.2k discussions</span>
                 </div>
               ))}
            </div>
         </div>

         <div>
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Active Sovereigns</h3>
            <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all cursor-pointer">
                    <div className="relative">
                       <div className="w-10 h-10 rounded-xl bg-gray-800"></div>
                       <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050505]"></div>
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-white uppercase">User_{i}</p>
                       <span className="text-[8px] text-gray-700 font-bold uppercase">Coding now...</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="mt-auto p-6 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-3xl text-center">
            <ShieldAlert size={24} className="text-[#d4af37] mx-auto mb-3" />
            <p className="text-[9px] font-black text-white uppercase mb-2">Metadata Shield Active</p>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
               <div className="h-full w-[95%] bg-[#d4af37] animate-pulse"></div>
            </div>
         </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-[500]">
        {[
          { id: 'feed', icon: <Home size={22} /> },
          { id: 'messenger', icon: <MessageSquare size={22} /> },
          { id: 'notifications', icon: <Bell size={22} /> },
          { id: 'groups', icon: <Users size={22} /> },
          { id: 'profile', icon: <User size={22} /> }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`p-4 transition-all ${view === item.id ? 'text-[#d4af37] scale-110' : 'text-gray-600'}`}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
