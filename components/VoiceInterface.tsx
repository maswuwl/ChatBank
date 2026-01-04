
import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, Radio } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

// دالات التشفير وفك التشفير كما هي سابقاً لضمان العمل
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

const VoiceInterface: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const createBlob = useCallback((data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const inputAudioContext = new AudioContext({ sampleRate: 16000 });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "أنت عقل شاتبنك، تتحدث مع خالد المنتصر بهيبة وذكاء."
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (m) => {
            const audioData = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setIsActive(false)
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { setIsConnecting(false); }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-3xl flex items-center justify-between mb-2 hover:border-[#d4af37]/10 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-[#d4af37]/10 text-[#d4af37]'}`}>
          <Radio size={20} />
        </div>
        <div>
          <h3 className="text-white font-black text-[11px] uppercase tracking-widest">نظام الصوت الحي</h3>
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-0.5">KM-X1 Voice Protocol</p>
        </div>
      </div>
      <button
        onClick={() => isActive ? sessionRef.current?.close() : startSession()}
        disabled={isConnecting}
        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all km-button-active ${isActive ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30'}`}
      >
        {isConnecting ? <Loader2 size={16} className="animate-spin" /> : (isActive ? "إيقاف الإرسال" : "تفعيل الاتصال")}
      </button>
    </div>
  );
};

export default VoiceInterface;
