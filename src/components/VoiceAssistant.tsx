import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<string>('Operational');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef<number>(0);

  const initVoice = async () => {
    if (isListening) {
        stopVoice();
        return;
    }

    try {
        setIsListening(true);
        setStatus('Initializing Link...');
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws.current = new WebSocket(`${protocol}//${window.location.host}/live`);
        
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        nextStartTime.current = audioContext.current.currentTime;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.current.createMediaStreamSource(stream);
        
        // Use standard AudioWorklet if possible, but for simplicity here we'll use a fast approach
        const processor = audioContext.current.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.current.destination);

        processor.onaudioprocess = (e) => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                }
                const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                ws.current.send(JSON.stringify({ audio: base64 }));
            }
        };

        ws.current.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            if (msg.audio && audioContext.current) {
                const binary = atob(msg.audio);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                
                const pcmData = new Int16Array(bytes.buffer);
                const floatData = new Float32Array(pcmData.length);
                for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;
                
                const buffer = audioContext.current.createBuffer(1, floatData.length, 16000);
                buffer.copyToChannel(floatData, 0);
                
                const source = audioContext.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.current.destination);
                
                const playTime = Math.max(nextStartTime.current, audioContext.current.currentTime);
                source.start(playTime);
                nextStartTime.current = playTime + buffer.duration;
            }
            if (msg.interrupted) {
                nextStartTime.current = audioContext.current?.currentTime || 0;
            }
        };

        setStatus('Listening...');

    } catch (err: any) {
        console.error(err);
        setStatus('Error: ' + err.message);
        setIsListening(false);
    }
  };

  const stopVoice = () => {
    ws.current?.close();
    audioContext.current?.close();
    setIsListening(false);
    setStatus('Link Dormant');
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group hover:border-fbblue/30 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fbblue/5 blur-3xl rounded-full" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-fbblue animate-pulse' : 'bg-white/20'}`} />
             <span className="font-sync text-[10px] tracking-[0.2em] text-gray-400 uppercase font-bold">Operations Support AI</span>
          </div>
          <Sparkles className="w-4 h-4 text-fbblue/40" />
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
           <button 
             onClick={initVoice}
             className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-fbblue shadow-[0_0_30px_rgba(56,189,248,0.4)] scale-110' : 'bg-white/5 hover:bg-white/10'}`}
           >
             {isListening ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white/40" />}
           </button>
           
           <div className="text-center space-y-2">
             <p className={`text-xs font-lexend tracking-widest ${isListening ? 'text-fbblue' : 'text-gray-500'}`}>
               {status.toUpperCase()}
             </p>
             <p className="text-[10px] text-gray-600 font-light max-w-[200px] mx-auto">
               Speak naturally to query flight logs, manifests, or experiential updates.
             </p>
           </div>
        </div>

        <AnimatePresence>
            {isListening && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 pt-6 border-t border-white/5"
                >
                    <div className="flex justify-center gap-1">
                        {[1,2,3,4,5].map(i => (
                            <motion.div 
                                key={i}
                                animate={{ height: [4, 16, 4] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                className="w-1 bg-fbblue rounded-full"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
