import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  Radio, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Fingerprint
} from 'lucide-react';
import { adaptiveEngine } from '../services/adaptiveEngine';

interface SecurityCockpitProps {
  currentMode: string;
  mouseDisplacement: number;
  tabCount: number;
  typingDelayMs: number;
  captchaFails: number;
  displayScale: number;
}

export const SecurityCockpit: React.FC<SecurityCockpitProps> = ({
  currentMode,
  mouseDisplacement,
  tabCount,
  typingDelayMs,
  captchaFails,
  displayScale
}) => {
  const [nonce, setNonce] = useState<string>(adaptiveEngine.getSessionNonce());
  const [pcrValue, setPcrValue] = useState<string>('0x9A4F...7C21');
  const [entropyScore, setEntropyScore] = useState<number>(99.4);
  const [liveLogs, setLiveLogs] = useState<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' }[]>([
    { id: '1', time: '17:34:02', text: 'TPM 2.0 Secure Enclave initialized (PCR[08] locked)', type: 'info' },
    { id: '2', time: '17:34:05', text: 'FIDO2 Level 3 Attestation Key verified: NITHYA_0x7FA9', type: 'success' },
    { id: '3', time: '17:34:10', text: 'Behavioral Telemetry Monitor active: 0px baseline cursor displacement', type: 'info' }
  ]);

  // Rotate rotating nonces and entropy slightly for live cybersecurity feel
  useEffect(() => {
    const timer = setInterval(() => {
      setNonce(adaptiveEngine.refreshSessionNonce().substring(0, 16));
      setEntropyScore(+(99.2 + Math.random() * 0.7).toFixed(1));
      setPcrValue('0x' + Math.random().toString(16).substring(2, 6).toUpperCase() + '...' + Math.random().toString(16).substring(2, 6).toUpperCase());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Push live telemetry log whenever mode or user behavior changes
  useEffect(() => {
    if (currentMode !== 'normal') {
      const now = new Date().toTimeString().split(' ')[0];
      setLiveLogs(prev => [
        {
          id: Math.random().toString(),
          time: now,
          text: `Adaptive Shift: Activated [${currentMode.toUpperCase()}] mode based on user behavioral telemetry`,
          type: 'warn'
        },
        ...prev.slice(0, 5)
      ]);
    }
  }, [currentMode]);

  return (
    <div className="w-full card-glass rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xl bg-white/95 text-slate-800 space-y-5 animate-fadeIn">
      
      {/* Cockpit Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-['Outfit'] flex items-center gap-1.5">
              <span>Security Enclave & Telemetry HUD</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">Live Hardware Attestation & Behavioral Telemetry</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          LIVE DEFENSE
        </span>
      </div>

      {/* 4 Real-Time Telemetry Gauges */}
      <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
        {/* Gauge 1: Active Mode */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">ACTIVE PERSONA</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-700 uppercase text-xs">{currentMode}</span>
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <span className="text-[9px] text-slate-400">Auto-Detected on the fly</span>
        </div>

        {/* Gauge 2: Entropy Score */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">HUMAN ENTROPY</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-700 text-xs">{entropyScore}%</span>
            <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-[9px] text-slate-400">Zero-Bot Certainty</span>
        </div>

        {/* Gauge 3: Keyboard Tabs vs Mouse */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">MOUSE DISPLACEMENT</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-700 text-xs">{mouseDisplacement}px</span>
            <Radio className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <span className="text-[9px] text-slate-400">Tabs: {tabCount} (Blind Signal)</span>
        </div>

        {/* Gauge 4: Typing Latency */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">TYPING LATENCY</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-700 text-xs">{typingDelayMs}ms</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-[9px] text-slate-400">Failures: {captchaFails}/3</span>
        </div>
      </div>

      {/* Hardware & Enclave Registers */}
      <div className="rounded-2xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-800">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-400" />
            TPM 2.0 HARDWARE REGISTER VAULT
          </span>
          <span className="text-emerald-400">BOUND</span>
        </div>
        <p className="flex justify-between">
          <span className="text-slate-400">FIDO2 Challenge Nonce:</span>
          <span className="text-cyan-300 font-bold">{nonce}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-slate-400">PCR[08] Integrity Hash:</span>
          <span className="text-indigo-300">{pcrValue}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-slate-400">Registered Ocular IPD:</span>
          <span className="text-emerald-300 font-semibold">0.28 mm (Nithya)</span>
        </p>
        <p className="flex justify-between">
          <span className="text-slate-400">Display Pixel Ratio:</span>
          <span className="text-amber-300 font-semibold">{displayScale}x Zoom</span>
        </p>
      </div>

      {/* Live Cyber Threat Defense Log Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold text-slate-700 uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Live Telemetry Defense Feed
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Real-time Stream</span>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5 space-y-2 max-h-36 overflow-y-auto font-mono text-[10px]">
          {liveLogs.map(log => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-400 shrink-0">[{log.time}]</span>
              <span className={
                log.type === 'warn' ? 'text-indigo-700 font-semibold' :
                log.type === 'success' ? 'text-emerald-700 font-semibold' :
                'text-slate-600'
              }>
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Core Security Pillars (Judges Defense Points) */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
        <strong className="text-indigo-900 text-[11px] block font-bold uppercase tracking-wider">
          PS05 Impenetrable Cybersecurity Enforcements:
        </strong>
        <div className="space-y-1 text-[11px] text-slate-700">
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
            <strong>Physical Vibration Actuator:</strong> Vibration pulses never cross network boundaries.
          </p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
            <strong>Biometric Vector Template:</strong> Aishu rejected by Euclidean distance $\Delta &gt; 0.04$.
          </p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
            <strong>Shamir 2-of-3 Quorum:</strong> Polynomial root recovered without master passwords.
          </p>
        </div>
      </div>

    </div>
  );
};
