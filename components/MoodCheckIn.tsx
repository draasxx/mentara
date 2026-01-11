
import React, { useState } from 'react';
import { MoodLevel, MoodEntry } from '../types';

const MOODS = [
  { level: MoodLevel.VERY_SAD, icon: '😔', label: 'Sangat Sedih', color: 'bg-red-500' },
  { level: MoodLevel.SAD, icon: '😕', label: 'Kurang Baik', color: 'bg-orange-500' },
  { level: MoodLevel.NEUTRAL, icon: '😐', label: 'Biasa Saja', color: 'bg-yellow-500' },
  { level: MoodLevel.HAPPY, icon: '😊', label: 'Senang', color: 'bg-emerald-500' },
  { level: MoodLevel.VERY_HAPPY, icon: '🤩', label: 'Luar Biasa', color: 'bg-sky-500' },
];

const MoodCheckIn: React.FC<{ onSave: (entry: MoodEntry) => void }> = ({ onSave }) => {
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step === 1 && selected) setStep(2);
    else if (step === 2) {
      onSave({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        level: selected!,
        note,
        tags: []
      });
      setStep(1);
      setSelected(null);
      setNote('');
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Check-in Harian</h3>
        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded-full">Langkah {step}/2</span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-slate-300">Bagaimana perasaanmu saat ini?</p>
          <div className="flex justify-between items-center gap-2">
            {MOODS.map((m) => (
              <button
                key={m.level}
                onClick={() => setSelected(m.level)}
                className={`flex-1 flex flex-col items-center p-3 rounded-2xl transition-all ${
                  selected === m.level ? `${m.color} scale-110 shadow-lg` : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <span className="text-3xl mb-1">{m.icon}</span>
                <span className="text-[10px] text-center font-medium opacity-80">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-300">Ada yang ingin kamu ceritakan sedikit?</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tuliskan apa yang ada di pikiranmu..."
            className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all"
          />
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={step === 1 && !selected}
        className={`w-full py-3 rounded-2xl font-bold transition-all ${
          (step === 1 && !selected) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white active:scale-95 shadow-lg'
        }`}
      >
        {step === 1 ? 'Lanjutkan' : 'Simpan Perasaan'}
      </button>
    </div>
  );
};

export default MoodCheckIn;
