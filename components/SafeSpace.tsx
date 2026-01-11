
import React, { useState } from 'react';

interface Confession {
  id: string;
  text: string;
  topic: string;
  likes: number;
}

const TOPICS = ['Cemas', 'Insecure', 'Patah Hati', 'Burnout', 'Harapan'];

const SafeSpace: React.FC = () => {
  const [confessions, setConfessions] = useState<Confession[]>([
    { id: '1', text: 'Terkadang aku merasa tertinggal jauh dari teman-teman sebayaku. Sulit untuk tidak membandingkan diri.', topic: 'Insecure', likes: 12 },
    { id: '2', text: 'Tugas kuliah rasanya tidak ada habisnya. Aku hanya ingin tidur tanpa memikirkan deadline besok.', topic: 'Burnout', likes: 8 },
  ]);
  const [newText, setNewText] = useState('');
  const [activeTopic, setActiveTopic] = useState('Insecure');

  const postConfession = () => {
    if (!newText.trim()) return;
    const item = {
      id: Date.now().toString(),
      text: newText,
      topic: activeTopic,
      likes: 0
    };
    setConfessions([item, ...confessions]);
    setNewText('');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-xl font-bold">Curhat Anonim</h3>
        <p className="text-slate-400 text-sm">Bagikan bebanmu tanpa identitas. Kami di sini untuk mendengar.</p>
        
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTopic(t)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                activeTopic === t ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Tuliskan di sini..."
          className="w-full bg-slate-800/30 rounded-2xl p-4 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-24"
        />
        
        <button
          onClick={postConfession}
          className="w-full bg-emerald-500 text-white py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
        >
          Kirim Anonim
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-slate-300">Suara Komunitas</h4>
        {confessions.map(c => (
          <div key={c.id} className="glass-card p-5 rounded-2xl border-l-4 border-emerald-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {c.topic}
              </span>
              <span className="text-slate-500 text-[10px]">Baru saja</span>
            </div>
            <p className="text-sm text-slate-200 mb-3 leading-relaxed">{c.text}</p>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span className="text-xs">{c.likes}</span>
              </button>
              <span className="text-xs text-slate-500">Validasi perasaan ini</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafeSpace;
