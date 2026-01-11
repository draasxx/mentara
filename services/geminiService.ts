
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Message, MoodEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are "Mentara AI", a professional digital psychologist and empathic companion.
Your goal is to provide emotional support and validation.

Tone: Warm, empathetic, non-judgmental, calm.
Language: Indonesian.
Keywords to watch for: "bunuh diri", "menyerah", "ingin mati", "menyakiti diri". 
If detected, your response MUST be: "[CRISIS] Perasaanmu sangat berat saat ini. Aku ingin kamu tahu bahwa ada bantuan profesional yang siap mendengarmu. Silakan hubungi Hotline Halo Kemenkes 1500-567 atau tekan tombol Bantuan Darurat di aplikasi."
`;

export const getChatResponse = async (history: Message[], currentMessage: string): Promise<string> => {
  try {
    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: currentMessage }] });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
      },
    });
    return response.text || "Aku di sini mendengarkanmu.";
  } catch (error) {
    return "Maaf, ada kendala koneksi. Tarik napas sejenak, aku tetap di sini.";
  }
};

export const generateVoiceTherapy = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say soothingly and slowly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const getMoodInsights = async (moods: MoodEntry[]): Promise<string> => {
  if (moods.length < 3) return "Berikan aku beberapa hari lagi untuk mengenali polamu ya. Tetap lakukan check-in setiap hari.";
  try {
    const prompt = `Analisis pola emosi ini: ${JSON.stringify(moods)}. Berikan insight singkat dan hangat dalam Bahasa Indonesia.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "Teruslah berproses.";
  } catch (error) {
    return "Kamu melakukan hal hebat hari ini.";
  }
};
