import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Terminal, 
  Users, 
  FileCode2,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { cryptoEngine } from '../services/cryptoEngine';
import type { SessionChallenge } from '../services/cryptoEngine';
import { speechService } from '../services/speechService';
import { audioEngine } from '../services/audioEngine';

interface HeaderProps {
  activeTab: 'auditory' | 'cognitive' | 'eye' | 'attacker' | 'guardian' | 'architecture';
  setActiveTab: (tab: 'auditory' | 'cognitive' | 'eye' | 'attacker' | 'guardian' | 'architecture') => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  voiceEnabled,
  setVoiceEnabled,
  highContrast,
  setHighContrast
}) => {
  const [challenge, setChallenge] = useState<SessionChallenge>(cryptoEngine.getChallenge());
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    const timer = setInterval(() => {
      const ch = cryptoEngine.getChallenge();
      setChallenge(ch);
      const remaining = Math.max(0, Math.ceil((ch.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        cryptoEngine.refreshChallenge();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualNonceRefresh = () => {
    audioEngine.playClick();
    const newCh = cryptoEngine.refreshChallenge();
    setChallenge(newCh);
    setTimeLeft(30);
    if (voiceEnabled) {
      speechService.speak("Session Nonce rotated. 32-byte cryptographic challenge refreshed.");
    }
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    speechService.setEnabled(next);
    audioEngine.playClick();
    if (next) {
      speechService.speak("Voice guidance enabled. Screen reader assistance is active.");
    }
  };

  return (
    <header className="header-glass sticky top-0 z-50 border-b border-cyan-500/20 backdrop-blur-md bg-slate-950/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Hardware Status */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 font-['Outfit']">
                Neuro<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Pass</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                ZK-Hardware v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>TPM 2.0 Enclave Bound:</span>
              <span className="text-emerald-400 font-semibold">{cryptoEngine.getDeviceKeyId().slice(0, 16)}</span>
            </p>
          </div>
        </div>

        {/* Live Cryptographic Nonce HUD */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
          <KeyRound className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-slate-400">EPHEMERAL NONCE (32B):</span>
              <span className="text-cyan-300 font-bold tracking-wider">
                {challenge.nonce.slice(0, 10)}...{challenge.nonce.slice(-6)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>TTL Window: <strong className="text-amber-300">{timeLeft}s</strong> remaining</span>
              <button 
                onClick={handleManualNonceRefresh}
                title="Rotate Cryptographic Nonce"
                className="hover:text-cyan-400 transition-colors p-0.5"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          {/* Circular Countdown Progress */}
          <div className="w-7 h-7 relative flex items-center justify-center font-mono text-[10px] text-amber-300 font-bold">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={timeLeft > 5 ? '#00f2fe' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray="88"
                strokeDashoffset={88 - (88 * timeLeft) / 30}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute">{timeLeft}</span>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2">
          {/* Main Views Navigation */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => { audioEngine.playClick(); setActiveTab('auditory'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'auditory' || activeTab === 'cognitive' || activeTab === 'eye'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auth Modes
            </button>
            <button
              onClick={() => { audioEngine.playClick(); setActiveTab('attacker'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'attacker'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-semibold'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Attacker Sim</span>
            </button>
            <button
              onClick={() => { audioEngine.playClick(); setActiveTab('guardian'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'guardian'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Guardian 2FA</span>
            </button>
            <button
              onClick={() => { audioEngine.playClick(); setActiveTab('architecture'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Judges Defense</span>
            </button>
          </div>

          {/* Accessibility Settings */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? "Mute Voice Guidance" : "Enable Accessible Voice Guidance"}
              className={`p-1.5 rounded-lg transition-colors ${
                voiceEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                audioEngine.playClick();
                setHighContrast(!highContrast);
              }}
              title="Toggle High Contrast Mode"
              className={`p-1.5 rounded-lg transition-colors ${
                highContrast ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
