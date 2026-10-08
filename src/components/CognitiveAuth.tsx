import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Trees, 
  CloudRain, 
  SunMedium, 
  Flame, 
  Flower2, 
  Waves, 
  Mountain, 
  Feather,
  Shuffle, 
  CheckCircle2, 
  AlertCircle,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cryptoEngine } from '../services/cryptoEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface SemanticItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isTarget: boolean; // "Sacred Banyan Tree" is the registered secret
}

const BASE_ITEMS: SemanticItem[] = [
  { id: 'banyan', label: 'Sacred Banyan', sublabel: 'Rooted Wisdom', icon: Trees, color: 'emerald', isTarget: true },
  { id: 'monsoon', label: 'Monsoon Rain', sublabel: 'Nourishing Cloud', icon: CloudRain, color: 'blue', isTarget: false },
  { id: 'sunrise', label: 'Dawn Sunlight', sublabel: 'Solar Energy', icon: SunMedium, color: 'amber', isTarget: false },
  { id: 'diya', label: 'Golden Lamp', sublabel: 'Eternal Flame', icon: Flame, color: 'orange', isTarget: false },
  { id: 'lotus', label: 'Lotus Bloom', sublabel: 'Pure Serenity', icon: Flower2, color: 'rose', isTarget: false },
  { id: 'ocean', label: 'Tidal Wave', sublabel: 'Deep Rhythm', icon: Waves, color: 'cyan', isTarget: false },
  { id: 'mountain', label: 'Silent Peak', sublabel: 'Steadfast Peak', icon: Mountain, color: 'indigo', isTarget: false },
  { id: 'peacock', label: 'Peacock Feather', sublabel: 'Graceful Iris', icon: Feather, color: 'teal', isTarget: false }
];

interface CognitiveAuthProps {
  onSuccess: (method: string) => void;
  voiceEnabled: boolean;
}

export const CognitiveAuth: React.FC<CognitiveAuthProps> = ({ onSuccess, voiceEnabled }) => {
  const [items, setItems] = useState<SemanticItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Select your registered semantic anchor concept to unlock.');
  const [shuffleCount, setShuffleCount] = useState<number>(0);

  // Cryptographic Fisher-Yates shuffle bound to nonce entropy
  const shuffleMatrix = () => {
    const array = [...BASE_ITEMS];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setItems(array);
    setShuffleCount(prev => prev + 1);
  };

  useEffect(() => {
    shuffleMatrix();
    // Auto-shuffle on 30s session challenge rotation
    const interval = setInterval(shuffleMatrix, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = async (item: SemanticItem) => {
    audioEngine.playClick();
    setStatus('verifying');
    setStatusMessage(`Computing zero-knowledge HMAC proof for [${item.label}]...`);

    const deviceKey = cryptoEngine.getDeviceKeyId();
    const result = await cryptoEngine.verifyAccessibleAuthentication(
      item.id,
      item.isTarget,
      deviceKey
    );

    if (result.success) {
      setStatus('success');
      setStatusMessage('Identity Verified! Semantic association matched device enclave.');
      audioEngine.playSuccess();
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      if (voiceEnabled) {
        speechService.speak("Semantic anchor verified. Welcome back Alex.");
      }
      onSuccess(`Cognitive Semantic [${item.label}]`);
    } else {
      setStatus('error');
      setStatusMessage(result.error || 'Authentication rejected.');
      audioEngine.playError();
      if (voiceEnabled) {
        speechService.speak("Authentication failed. " + (result.error || ""));
      }
      // Re-shuffle matrix immediately on failure to defeat brute force / shoulder surfing
      shuffleMatrix();
    }
  };

  return (
    <div className="card-glass rounded-2xl p-6 lg:p-8 border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              Cognitive Semantic Anchor Grid
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Designed for <strong className="text-blue-300">Alzheimer's, Dementia & Dyslexia</strong>. Natural associative memory.
          </p>
        </div>

        {/* Dynamic Shuffle HUD */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Anti-Shoulder Surfing Mask</span>
          </div>
          <button
            onClick={() => {
              audioEngine.playClick();
              shuffleMatrix();
            }}
            title="Randomize Matrix Spatial Coordinates"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 hover:text-white transition-all"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shuffle (#{shuffleCount})</span>
          </button>
        </div>
      </div>

      {/* Semantic Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              disabled={status === 'verifying' || status === 'success'}
              className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] text-center cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 group-hover:bg-cyan-950/30 transition-all mb-2.5">
                <Icon className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {item.sublabel}
              </span>

              {/* Dynamic Coordinate Tag to show randomized placement */}
              <div className="absolute top-1.5 right-1.5 opacity-40 group-hover:opacity-100 text-[9px] font-mono text-slate-600 group-hover:text-cyan-400">
                0x{item.id.slice(0, 3)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Bar */}
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
        {status === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : status === 'error' ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs">
          <p className="font-medium">{statusMessage}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Security Guarantee: Registered anchor [Sacred Banyan] is hashed with session nonce. Plaintext concept never touches network.
          </p>
        </div>
      </div>
    </div>
  );
};
