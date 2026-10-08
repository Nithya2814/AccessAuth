import React from 'react';
import { 
  User, 
  EyeOff, 
  Maximize2, 
  BrainCircuit, 
  Eye, 
  Sparkles,
  Volume2
} from 'lucide-react';
import type { UserPersonaMode } from '../services/adaptiveEngine';
import { adaptiveEngine } from '../services/adaptiveEngine';
import { speechService } from '../services/speechService';
import { audioEngine } from '../services/audioEngine';

interface DemoControllerProps {
  currentMode: UserPersonaMode;
  onModeSelect: (mode: UserPersonaMode) => void;
  voiceEnabled: boolean;
}

export const DemoController: React.FC<DemoControllerProps> = ({
  currentMode,
  onModeSelect,
  voiceEnabled
}) => {
  const handleSelect = (mode: UserPersonaMode, announcement: string) => {
    audioEngine.playClick();
    adaptiveEngine.setMode(mode);
    onModeSelect(mode);
    if (voiceEnabled) {
      speechService.speak(announcement);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 sm:p-4 mb-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
            Hackathon Live Demo Switcher (PS05 Adaptation Controller)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5" />
          Active: <strong className="text-white uppercase">{currentMode}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Mode 1: Normal */}
        <button
          onClick={() => handleSelect('normal', "Switching to Normal baseline mode. Standard username, password, and text CAPTCHA.")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all border ${
            currentMode === 'normal'
              ? 'bg-slate-800 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <User className="w-4 h-4 mb-1 text-slate-300" />
          <span>1. Normal Baseline</span>
          <span className="text-[10px] text-slate-500 font-mono font-normal">Standard Mode</span>
        </button>

        {/* Mode 2: Blind */}
        <button
          onClick={() => handleSelect('blind', "Auto-detected screen reader keyboard traversal. Switching to Voice-Guided and Dynamic Vibration CAPTCHA mode.")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all border ${
            currentMode === 'blind'
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <EyeOff className="w-4 h-4 mb-1 text-cyan-400" />
          <span>2. Blind (Voice & Haptic)</span>
          <span className="text-[10px] text-cyan-500 font-mono font-normal">Random Pulses</span>
        </button>

        {/* Mode 3: Low Vision */}
        <button
          onClick={() => handleSelect('low-vision', "Detected high display zoom and large system font. Adapting to Ultra High-Contrast mode with Anti-Shoulder-Surfing Decoy Shield.")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all border ${
            currentMode === 'low-vision'
              ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-md shadow-amber-500/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Maximize2 className="w-4 h-4 mb-1 text-amber-400" />
          <span>3. Low-Vision (Zoom)</span>
          <span className="text-[10px] text-amber-500 font-mono font-normal">High-Contrast & Decoy</span>
        </button>

        {/* Mode 4: Dyslexia */}
        <button
          onClick={() => handleSelect('dyslexia', "Detected repeated CAPTCHA friction. Canceling distorted text. Switching to Geometric Shape-Stamp Verification.")}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all border ${
            currentMode === 'dyslexia'
              ? 'bg-blue-950/70 border-blue-400 text-blue-300 shadow-md shadow-blue-500/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <BrainCircuit className="w-4 h-4 mb-1 text-blue-400" />
          <span>4. Dyslexia / Elderly</span>
          <span className="text-[10px] text-blue-400 font-mono font-normal">Shape-Stamp CAPTCHA</span>
        </button>

        {/* Mode 5: Iris (Last Option) */}
        <button
          onClick={() => handleSelect('iris', "Activating Last Resort Emergency Fallback: Hands-Free Iris and Eye Tracking with Nithya identity verification.")}
          className={`col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all border ${
            currentMode === 'iris'
              ? 'bg-purple-950/70 border-purple-400 text-purple-300 shadow-md shadow-purple-500/30'
              : 'bg-slate-950/60 border-slate-800 text-purple-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Eye className="w-4 h-4 mb-1 text-purple-400" />
          <span>5. Iris Mode (Last Option)</span>
          <span className="text-[10px] text-purple-400 font-mono font-normal">Nithya vs Aishu Test</span>
        </button>
      </div>
    </div>
  );
};
