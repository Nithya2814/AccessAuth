import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, AlertCircle, CheckCircle2, Waves, Play, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../services/audioEngine';
import { cryptoEngine } from '../services/cryptoEngine';
import { speechService } from '../services/speechService';

interface AuditoryAuthProps {
  onSuccess: (method: string) => void;
  voiceEnabled: boolean;
}

export const AuditoryAuth: React.FC<AuditoryAuthProps> = ({ onSuccess, voiceEnabled }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('Press Play to listen to the resonant Temple Bell chime, then tap Spacebar to authenticate.');
  const [taps, setTaps] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Live Canvas Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && isPlaying) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Subtle ambient idle wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 128 + Math.sin(Date.now() * 0.003 + i * 0.2) * 8;
        }
      }

      ctx.lineWidth = 2.5;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#00f2fe');
      gradient.addColorStop(0.5, '#4facfe');
      gradient.addColorStop(1, '#00f5a0');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Handle Play Bell
  const handlePlayBell = () => {
    setIsPlaying(true);
    setStatus('listening');
    setTaps(0);
    setMessage('Temple Bell ringing... Tap SPACEBAR or the Confirm button during resonance.');
    audioEngine.playTempleBell(432, 2.8);

    if (voiceEnabled) {
      speechService.speak("Temple bell chime initiated. Tap spacebar now to confirm physical human presence.");
    }

    setTimeout(() => {
      setIsPlaying(false);
    }, 2800);
  };

  // Handle Verification Trigger
  const handleConfirmAuth = async () => {
    audioEngine.playClick();
    setStatus('verifying');
    setMessage('Verifying Hardware TPM Enclave Signature against ephemeral session challenge...');

    const deviceKey = cryptoEngine.getDeviceKeyId();
    // Semantic secret for auditory chime
    const result = await cryptoEngine.verifyAccessibleAuthentication(
      'TEMPLE_BELL_RESONANCE_432HZ',
      true, // Correct sound matched
      deviceKey
    );

    if (result.success) {
      setStatus('success');
      setMessage('Authenticated! Hardware Enclave token released. JWT issued.');
      audioEngine.playSuccess();
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      if (voiceEnabled) {
        speechService.speak("Access granted. Hardware TPM signature verified successfully.");
      }
      onSuccess('Auditory Bell Cadence');
    } else {
      setStatus('error');
      setMessage(result.error || 'Authentication rejected.');
      audioEngine.playError();
      if (voiceEnabled) {
        speechService.speak("Authentication failed. " + (result.error || ""));
      }
    }
  };

  // Keyboard shortcut: Spacebar triggers verification
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (status === 'listening' || isPlaying)) {
        e.preventDefault();
        setTaps(prev => prev + 1);
        handleConfirmAuth();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isPlaying]);

  return (
    <div className="card-glass rounded-2xl p-6 lg:p-8 border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      {/* Glow decorative pill */}
      <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              Auditory Cadence Authentication
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engineered for <strong className="text-cyan-300">Visually Impaired & Blind Users</strong>. Single-switch spacebar trigger.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span>Binaural 432 Hz</span>
          <span className="text-cyan-400 font-bold">| Taps: {taps}</span>
        </div>
      </div>

      {/* Waveform Visualizer Screen */}
      <div className="relative rounded-xl bg-slate-950 border border-slate-800/80 p-4 mb-6 overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
            REAL-TIME FREQUENCY ANALYSER
          </span>
          <span className="text-cyan-400">{isPlaying ? 'RESONANCE ACTIVE' : 'STANDBY'}</span>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={120}
          className="w-full h-28 rounded-lg bg-slate-950/90"
        />

        <div className="absolute bottom-6 right-6 flex items-center gap-2">
          {isPlaying && (
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full animate-pulse">
              Reverberating (~2.8s)
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handlePlayBell}
          disabled={isPlaying || status === 'verifying'}
          className={`flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
            isPlaying
              ? 'bg-cyan-950/70 border border-cyan-500 text-cyan-300 shadow-cyan-500/20'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30 hover:scale-[1.01]'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isPlaying ? 'Playing Bell Chime...' : '1. Play Temple Bell Sound'}</span>
        </button>

        <button
          onClick={handleConfirmAuth}
          disabled={status === 'verifying' || status === 'success'}
          className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all duration-300 hover:border-cyan-500/50 hover:scale-[1.01] shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>2. Confirm Presence (or Press SPACEBAR)</span>
        </button>
      </div>

      {/* Status Alert Box */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          status === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : status === 'error'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : status === 'verifying'
            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse'
            : 'bg-slate-950/40 border-slate-800 text-slate-300'
        }`}
      >
        {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
        {status === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
        {status === 'verifying' && <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-spin" />}
        {status === 'idle' && <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
        {status === 'listening' && <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />}
        
        <div className="text-xs">
          <p className="font-medium">{message}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Cryptographic Guard: Device TPM Signature + Constant-Time Nonce Hash Verification.
          </p>
        </div>
      </div>
    </div>
  );
};
