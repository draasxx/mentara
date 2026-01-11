
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Message, MoodEntry, MoodLevel } from './types';
import { ICONS, Logo } from './constants';
import MoodCheckIn from './components/MoodCheckIn';
import BreathingExercise from './components/BreathingExercise';
import SafeSpace from './components/SafeSpace';
import LiveSanctuary from './components/LiveSanctuary';
import { getChatResponse, getMoodInsights } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'stats' | 'profile' | 'breathe'>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const [showLiveSanctuary, setShowLiveSanctuary] = useState(false);
  const [dailyAffirmation, setDailyAffirmation] = useState('Kamu berharga, dan harimu akan baik-baik saja.');
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('mentara_state_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        language: parsed.language || 'id',
        theme: parsed.theme || 'slate',
        streak: parsed.streak || 1
      };
    }
    return {
      userMoods: [],
      messages: [{ id: '1', role: 'assistant', content: 'Halo! Aku Mentara. Apa kabarmu hari ini?', timestamp: Date.now() }],
      dailyTasks: [
        { id: '1', title: 'Mood Check-in', completed: false, type: 'journal' },
        { id: '2', title: '3 Menit Box Breathing', completed: false, type: 'breathing' },
        { id: '3', title: 'Refleksi Syukur', completed: false, type: 'reflection' },
      ],
      userName: 'Sobat Mentara',
      language: 'id',
      theme: 'slate',
      streak: 1
    };
  });

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mentara_state_v2', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
    const fetchAffirmation = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: state.language === 'id' ? "Berikan satu afirmasi positif yang singkat dan puitis dalam Bahasa Indonesia." : "Give me one short and poetic positive affirmation in English." }] }],
        });
        if (response.text) setDailyAffirmation(response.text.replace(/"/g, ''));
      } catch (e) { console.error(e); }
    };
    fetchAffirmation();

    return () => clearTimeout(timer);
  }, [state.language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const toggleTask = (id: string) => {
    setState(prev => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const handleMoodSave = (entry: MoodEntry) => {
    setState(prev => ({
      ...prev,
      userMoods: [entry, ...prev.userMoods],
      dailyTasks: prev.dailyTasks.map(t => t.type === 'journal' ? { ...t, completed: true } : t),
      streak: prev.streak + 1
    }));
    setActiveTab('home');
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: Date.now() };
    setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    setChatInput('');
    setIsTyping(true);

    const response = await getChatResponse(state.messages, chatInput);
    if (response.includes("[CRISIS]")) setIsCrisis(true);
    
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.replace("[CRISIS] ", ""), timestamp: Date.now() };
    setState(prev => ({ ...prev, messages: [...prev.messages, botMsg] }));
    setIsTyping(false);
  };

  const resetData = () => {
    if (confirm(state.language === 'id' ? "Hapus semua data emosi dan percakapan?" : "Delete all emotion and conversation data?")) {
      localStorage.removeItem('mentara_state_v2');
      window.location.reload();
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[1000]">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full" />
          <Logo size={140} animate />
        </div>
        <h1 className="mt-10 text-5xl font-black tracking-tighter text-white">mentara</h1>
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-emerald-400 font-bold uppercase tracking-[0.4em] text-[10px]">Your Digital Sanctuary</p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mt-2" />
        </div>
      </div>
    );
  }

  const translations = {
    id: {
      howIsSoul: "Bagaimana jiwamu hari ini?",
      daily: "Harian",
      liveSanctuary: "Live Sanctuary",
      liveSanctuaryDesc: "Ruang bicara privat AI",
      mentalPlan: "Mental Plan",
      typing: "Mentara sedang merangkai kata...",
      placeholder: "Ada apa di pikiranmu?",
      settings: "Pengaturan Aplikasi",
      language: "Bahasa",
      langDesc: "Ubah bahasa aplikasi",
      theme: "Tema Visual",
      themeDesc: "Mode gelap pilihanmu",
      clearData: "Hapus Semua Data Emosi",
      devBy: "Designed & Developed by",
      community: "Community Safe Space",
      streak: "Hari"
    },
    en: {
      howIsSoul: "How is your soul today?",
      daily: "Daily",
      liveSanctuary: "Live Sanctuary",
      liveSanctuaryDesc: "Private AI voice space",
      mentalPlan: "Mental Plan",
      typing: "Mentara is typing...",
      placeholder: "What's on your mind?",
      settings: "App Settings",
      language: "Language",
      langDesc: "Change app language",
      theme: "Visual Theme",
      themeDesc: "Choose your dark mode",
      clearData: "Clear All Emotion Data",
      devBy: "Designed & Developed by",
      community: "Community Safe Space",
      streak: "Days"
    }
  };

  const t = translations[state.language];

  return (
    <div className={`flex flex-col h-full max-w-md mx-auto ${state.theme === 'midnight' ? 'bg-black' : 'bg-slate-950'} text-slate-100 overflow-hidden relative border-x border-white/5 shadow-2xl transition-colors duration-500`}>
      
      {showLiveSanctuary && <LiveSanctuary onClose={() => setShowLiveSanctuary(false)} />}

      <header className={`p-5 flex items-center justify-between glass-card border-b border-white/5 sticky top-0 z-40 transition-all duration-500 ${isCrisis ? 'bg-red-900/40 border-red-500/50' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('home')}>
            <Logo size={36} />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-white">MENTARA</h1>
            {isCrisis ? (
              <span className="text-[8px] font-black text-red-400 animate-pulse uppercase tracking-wider">Crisis Mode</span>
            ) : (
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Connected</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
            <span className="text-xs font-black text-emerald-400">{state.streak || 0} {t.streak}</span>
          </div>
          {isCrisis && (
            <button onClick={() => window.open('tel:1500567')} className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg shadow-red-600/30 animate-bounce">HOTLINE</button>
          )}
          {deferredPrompt && !isCrisis && (
            <button onClick={handleInstallClick} className="text-[9px] font-black bg-white text-slate-900 px-3 py-1.5 rounded-full hover:scale-105 transition-transform">INSTALL</button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
        
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            <header className="space-y-1">
              <h2 className="text-4xl font-black tracking-tighter text-white leading-tight">Halo, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">{state.userName.split(' ')[0]}</span></h2>
              <p className="text-slate-400 text-sm font-medium">{t.howIsSoul}</p>
            </header>

            <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
              <p className="text-sm font-medium text-emerald-50 italic leading-relaxed relative z-10">"{dailyAffirmation}"</p>
            </div>

            <section className="space-y-4">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">{t.daily}</h3>
               <MoodCheckIn onSave={handleMoodSave} />
            </section>

            <section onClick={() => setShowLiveSanctuary(true)} className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative glass-card p-7 rounded-[2.5rem] border-white/10 bg-slate-900/40 flex items-center gap-5 hover:bg-slate-900/60 transition-colors">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-sky-400 text-slate-950 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <ICONS.Mic />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight">{t.liveSanctuary}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">{t.liveSanctuaryDesc}</p>
                </div>
              </div>
            </section>

            <section className="glass-card p-7 rounded-[2.5rem] border-white/5 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-emerald-400">{t.mentalPlan}</h3>
                <span className="text-[9px] font-black text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-white/5">AKTIF</span>
              </div>
              <div className="space-y-3">
                {state.dailyTasks.map(task => (
                  <button key={task.id} onClick={() => toggleTask(task.id)} className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${task.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}>
                    <span className={`text-sm font-bold tracking-tight ${task.completed ? 'text-emerald-400/60 line-through' : 'text-slate-200'}`}>{task.title}</span>
                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-700'}`}>
                      {task.completed && <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar pb-4">
              {state.messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-none' : 'glass-card text-slate-100 rounded-tl-none border-white/10'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-black uppercase tracking-widest animate-pulse ml-4">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  {t.typing}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="flex items-center gap-3 pt-4 sticky bottom-0 bg-transparent backdrop-blur-xl">
              <input 
                type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t.placeholder}
                className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
              <button onClick={sendMessage} className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
                <svg className="w-6 h-6 rotate-45 -mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10 pb-12">
            <header className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-400 p-1 shadow-2xl shadow-emerald-500/20">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                   <Logo size={60} />
                </div>
              </div>
              <div className="text-center w-full px-6">
                <input 
                  type="text" value={state.userName}
                  onChange={(e) => setState(prev => ({ ...prev, userName: e.target.value }))}
                  className="bg-transparent text-2xl font-black text-white text-center w-full focus:outline-none focus:ring-1 focus:ring-emerald-500/30 rounded-lg p-1 tracking-tight"
                />
                <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Premium User • 2026</p>
              </div>
            </header>

            <section className="glass-card p-7 rounded-[2.5rem] border-white/5 space-y-6">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{t.settings}</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{t.language}</span>
                    <span className="text-[10px] text-slate-500">{t.langDesc}</span>
                  </div>
                  <div className="flex bg-slate-900 rounded-full p-1 border border-white/5">
                    <button onClick={() => setState(prev => ({ ...prev, language: 'id' }))} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${state.language === 'id' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}>ID</button>
                    <button onClick={() => setState(prev => ({ ...prev, language: 'en' }))} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${state.language === 'en' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}>EN</button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{t.theme}</span>
                    <span className="text-[10px] text-slate-500">{t.themeDesc}</span>
                  </div>
                  <div className="flex bg-slate-900 rounded-full p-1 border border-white/5">
                    <button onClick={() => setState(prev => ({ ...prev, theme: 'slate' }))} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${state.theme === 'slate' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}>SLATE</button>
                    <button onClick={() => setState(prev => ({ ...prev, theme: 'midnight' }))} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${state.theme === 'midnight' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}>NIGHT</button>
                  </div>
                </div>

                <button onClick={resetData} className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">
                  {t.clearData}
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-2">{t.community}</h3>
              <SafeSpace />
            </section>

            <footer className="pt-10 pb-6 text-center">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] mb-2">{t.devBy}</p>
              <a href="https://instagram.com/rizkyindraa1" target="_blank" rel="noopener noreferrer" className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all active:scale-95">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                   <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </div>
                <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors tracking-widest uppercase">rizkyindraa1</span>
              </a>
              <div className="mt-8"><p className="text-[7px] font-bold text-slate-700 uppercase tracking-[0.5em]">Mentara v2.5.0 • Built in 2026</p></div>
            </footer>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm glass-card border border-white/10 p-2.5 flex justify-around items-center z-50 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('home')} className={`p-4 transition-all rounded-full ${activeTab === 'home' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}><ICONS.Home /></button>
        <button onClick={() => setActiveTab('chat')} className={`p-4 transition-all rounded-full ${activeTab === 'chat' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}><ICONS.Chat /></button>
        <button onClick={() => setActiveTab('breathe')} className="w-14 h-14 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-4 border-slate-950"><ICONS.Breathe /></button>
        <button onClick={() => setActiveTab('stats')} className={`p-4 transition-all rounded-full ${activeTab === 'stats' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}><ICONS.Stats /></button>
        <button onClick={() => setActiveTab('profile')} className={`p-4 transition-all rounded-full ${activeTab === 'profile' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}><ICONS.Profile /></button>
      </nav>
    </div>
  );
};

export default App;
