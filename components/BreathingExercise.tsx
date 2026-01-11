
import React, { useState, useEffect, useRef } from 'react';

const AMBIENT_SOUNDS = [
  { name: 'None', url: '' },
  { name: 'Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder
  { name: 'Zen', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
];

const BreathingExercise: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [seconds, setSeconds] = useState(4);
  const [active, setActive] = useState(false);
  const [sound, setSound] = useState('None');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timer: any;
    if (active) {
      timer = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            switch (phase) {
              case 'Inhale': setPhase('Hold'); return 4;
              case 'Hold': setPhase('Exhale'); return 4;
              case 'Exhale': setPhase('Pause'); return 4;
              case 'Pause': setPhase('Inhale'); return 4;
              default: return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [active, phase]);

  const toggleExercise = () => {
    setActive(!active);
    if (!active) {
      setPhase('Inhale');
      setSeconds(4);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-card rounded-[2.5rem] space-y-6 w-full max-w-sm mx-auto shadow-2xl">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1">Micro Therapy</h3>
        <p className="text-slate-400 text-xs">Teknik Box Breathing (4-4-4-4)</p>
      </div>

      <div className="relative flex items-center justify-center h-56 w-56">
        <div className={`absolute inset-0 rounded-full border-2 border-emerald-500/20 ${active ? 'animate-ping' : ''}`} />
        <div 
          className={`w-40 h-40 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/80 to-sky-500/80 shadow-[0_0_50px_rgba(16,185,129,0.3)] transition-all duration-[4000ms] ease-in-out ${
            active && phase === 'Inhale' ? 'scale-125' : 
            active && phase === 'Exhale' ? 'scale-90' : 'scale-100'
          }`}
        >
          <span className="text-4xl font-black text-white">{active ? seconds : 'Ready'}</span>
          {active && <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{phase}</span>}
        </div>
      </div>

      <div className="w-full space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Ambient Sound</p>
        <div className="flex justify-center gap-2">
          {AMBIENT_SOUNDS.map(s => (
            <button
              key={s.name}
              onClick={() => setSound(s.name)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                sound === s.name ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-white/5 text-slate-400'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={toggleExercise}
        className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all active:scale-95 shadow-lg ${
          active ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
        }`}
      >
        {active ? 'Berhenti' : 'Mulai Sesi'}
      </button>
    </div>
  );
};

export default BreathingExercise;
