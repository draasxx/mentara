
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

interface LiveSanctuaryProps {
  onClose: () => void;
}

const LiveSanctuary: React.FC<LiveSanctuaryProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'closed'>('connecting');
  const [isListening, setIsListening] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Ref untuk track state isListening di dalam callback onaudioprocess
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const initLiveSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: 'Anda adalah Mentara, teman bicara yang sangat hangat. Dengarkan cerita user. Berikan respon yang singkat, empatik, dan menenangkan. User menggunakan mode Tap-to-Talk, jadi responlah segera setelah user selesai mengirim suaranya.',
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setStatus('active');
              inputCtx.resume();
              outputCtx.resume();

              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Visualisasi volume tetap jalan untuk feedback
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                setVolumeLevel(rms);

                // HANYA kirim jika isListening aktif (Tap-to-Talk)
                if (isListeningRef.current) {
                  const int16 = new Int16Array(inputData.length);
                  for (let i = 0; i < inputData.length; i++) {
                    int16[i] = inputData[i] * 32768;
                  }
                  const pcmBlob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                  };
                  sessionPromise.then(session => {
                    try { session.sendRealtimeInput({ media: pcmBlob }); } catch (err) {}
                  });
                }
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => (prev.length > 100 ? '...' : prev) + ' ' + message.serverContent?.outputTranscription?.text);
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                setIsAiTalking(true);
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsAiTalking(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsAiTalking(false);
              }
            },
            onclose: () => setStatus('closed'),
            onerror: (e) => setStatus('closed'),
          },
        });
        
        sessionRef.current = await sessionPromise;
      } catch (err) {
        setStatus('closed');
      }
    };

    initLiveSession();
    return () => {
      sessionRef.current?.close();
      audioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  const toggleListening = () => {
    if (isAiTalking) {
      // Jika AI sedang bicara, stop AI dan mulai dengarkan
      sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
      sourcesRef.current.clear();
      setIsAiTalking(false);
    }
    setIsListening(!isListening);
    if (!isListening) {
      setTranscription(''); // Reset transkripsi saat mulai bicara baru
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
      <div className="absolute top-8 right-8">
        <button onClick={onClose} className="p-4 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-2xl font-black text-white tracking-tighter">Live Sanctuary</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
          {status === 'active' ? 'Koneksi Terenkripsi' : 'Membangun Ruang Aman...'}
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center">
        {/* Tombol Orb Utama */}
        <button 
          onClick={toggleListening}
          className="relative flex items-center justify-center h-80 w-80 group outline-none"
        >
          {/* Aura Dinamis */}
          <div 
            className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
              isListening ? 'border-sky-400/50 scale-110 shadow-[0_0_60px_rgba(56,189,248,0.2)]' : 
              isAiTalking ? 'border-emerald-400/50 scale-105 shadow-[0_0_60px_rgba(16,185,129,0.2)]' : 'border-white/5'
            }`} 
            style={{ transform: `scale(${1 + volumeLevel * 3})` }}
          />
          
          <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 ${
            isListening ? 'bg-sky-500/20 scale-150' : 
            isAiTalking ? 'bg-emerald-500/20 scale-125' : 'bg-transparent'
          }`} />
          
          <div className={`w-52 h-52 rounded-full border-4 transition-all duration-500 flex items-center justify-center z-10 ${
            isListening ? 'border-sky-400 bg-sky-500/10 scale-110' : 
            isAiTalking ? 'border-emerald-400 bg-emerald-500/10 scale-100' : 'border-white/10 bg-white/5'
          }`}>
            <div className={`w-40 h-40 rounded-full bg-gradient-to-tr transition-all duration-500 flex items-center justify-center shadow-2xl ${
              isListening ? 'from-sky-600 to-indigo-500' : 
              isAiTalking ? 'from-emerald-600 to-sky-500 animate-pulse' : 'from-slate-800 to-slate-900'
            }`}>
               {isListening ? (
                 <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                    <div className="w-1.5 h-12 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                 </div>
               ) : (
                 <svg className={`w-16 h-16 transition-all ${isAiTalking ? 'text-white' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                 </svg>
               )}
            </div>
          </div>
          
          {/* Label Instruksi Tombol */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isListening ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`}>
              {isListening ? 'Ketuk untuk Kirim' : 'Ketuk untuk Bicara'}
            </span>
          </div>
        </button>
      </div>

      <div className="mt-20 max-w-sm w-full space-y-6">
        <div className="glass-card p-6 rounded-[2.5rem] h-40 overflow-y-auto custom-scrollbar border-white/5 bg-white/[0.02] flex items-center justify-center shadow-inner">
          <p className="text-sm text-slate-300 italic text-center leading-relaxed font-medium">
            {transcription || (
              isListening ? "Mentara sedang mendengarkan setiap katamu..." : 
              isAiTalking ? "Mentara sedang merespon..." : 
              "Ketuk lingkaran di atas untuk mulai bercerita."
            )}
          </p>
        </div>
        
        <div className="flex justify-center gap-12">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</span>
            <span className={`text-[10px] font-bold ${isListening ? 'text-sky-400' : isAiTalking ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isListening ? 'LISTENING' : isAiTalking ? 'SPEAKING' : 'IDLE'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Mode</span>
            <span className="text-[10px] font-bold text-slate-300">TAP-TO-TALK</span>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3 py-2 px-6 bg-white/5 rounded-full border border-white/10">
           <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sanctuary Mode Active</span>
        </div>
      </div>
    </div>
  );
};

export default LiveSanctuary;
