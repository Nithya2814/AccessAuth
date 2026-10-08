import React, { useState } from 'react';
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  Play, 
  RefreshCcw
} from 'lucide-react';
import { cryptoEngine } from '../services/cryptoEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface AttackerDashboardProps {
  voiceEnabled: boolean;
  onLockoutTriggered: () => void;
}

export const AttackerDashboard: React.FC<AttackerDashboardProps> = ({ voiceEnabled, onLockoutTriggered }) => {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "[*] NeuroPass Threat Intelligence & Penetration Suite v3.0 (PS05 Cybersecurity)",
    "[*] Target Profile: Nithya (Registered Enclave: 0x7FA9...)",
    "[*] Active Defenses: Physical Haptic Isolation, Decoy Masking, Biometric Template Matching",
    "[*] Ready. Launch a real attack vector below to simulate threat interception."
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const addTerminalLine = (line: string) => {
    setTerminalOutput(prev => [...prev.slice(-30), line]);
  };

  // Attack 1: Remote Hacker trying to guess Vibration CAPTCHA
  const simulateVibrationAttack = () => {
    setIsSimulating(true);
    audioEngine.playError();
    addTerminalLine("\n[!] ATTACK VECTOR 1: Remote Bot Vibration CAPTCHA Brute-Force");
    addTerminalLine("[+] Remote script attempting to intercept or guess hardware vibration pulses over TCP/IP...");
    addTerminalLine("[*] Attempting to read DOM tree and network payload for vibration pulse count...");

    setTimeout(() => {
      addTerminalLine(`[-] GATEWAY RESPONSE: HTTP 403 FORBIDDEN`);
      addTerminalLine(`[-] DEFENSE VERDICT: Physical Hardware Boundary Active.`);
      addTerminalLine(`[-] EXPLANATION: Vibration count is processed purely in local haptic actuator RAM.`);
      addTerminalLine(`[+] Zero network leakage. Remote hackers cannot feel physical device vibration!`);

      setIsSimulating(false);
      if (voiceEnabled) {
        speechService.speak("Remote vibration attack blocked. Physical hardware motor isolation intact.");
      }
    }, 700);
  };

  // Attack 2: Aishu tries to unlock Nithya's phone with her own eyes (Biometric Identity Mismatch)
  const simulateAishuIrisAttack = () => {
    setIsSimulating(true);
    audioEngine.playError();
    addTerminalLine("\n[!] ATTACK VECTOR 2: Stolen Device Biometric Identity Attack (Aishu vs Nithya)");
    addTerminalLine("[+] Intruder 'Aishu' has physically stolen Nithya's unlocked device.");
    addTerminalLine("[+] Aishu places her own real, live eyes in front of the camera.");
    addTerminalLine("[*] NeuroPass extracting ocular feature vector: IPD, Pupil-to-Iris ratio, Saccade baseline...");

    setTimeout(() => {
      addTerminalLine(`[-] ENCLAVE COMPARISON: Candidate IPD = 0.36 | Registered Nithya IPD = 0.28`);
      addTerminalLine(`[-] GATEWAY RESPONSE: HTTP 401 BIOMETRIC REJECTION`);
      addTerminalLine(`[-] ERROR: Biometric Identity Mismatch. Registered owner is Nithya.`);
      addTerminalLine(`[+] DEFENSE VERDICT: Attack Neutralized! Aishu's ocular template refused by Secure Enclave.`);

      setIsSimulating(false);
      if (voiceEnabled) {
        speechService.speak("Biometric attack blocked. Detected ocular vector belongs to unregistered entity Aishu.");
      }
    }, 900);
  };

  // Attack 3: Shoulder-Surfing the Low-Vision Zoomed Screen
  const simulateShoulderSurfing = () => {
    setIsSimulating(true);
    audioEngine.playError();
    addTerminalLine("\n[!] ATTACK VECTOR 3: Low-Vision 300% Zoom Shoulder-Surfing");
    addTerminalLine("[+] Onlooker standing 2 meters behind victim looking at giant high-contrast screen...");
    addTerminalLine("[+] Attacker records key coordinates clicked by victim: [Top-Left, Bottom-Right]...");

    setTimeout(() => {
      addTerminalLine(`[-] CRYPTO EVALUATION: Attacker harvested decoy coordinates.`);
      addTerminalLine(`[-] REASON: Keypad order was randomized in local memory (Decoy Scrambling).`);
      addTerminalLine(`[-] Onlooker's observed coordinates produce invalid cipher: 0xDEAD...`);
      addTerminalLine(`[+] DEFENSE VERDICT: Shoulder surfing neutralized! Real PIN values never rendered.`);

      setIsSimulating(false);
      if (voiceEnabled) {
        speechService.speak("Shoulder surfing attack defeated. Keypad decoy randomization prevented PIN snooping.");
      }
    }, 800);
  };

  // Attack 4: Bot Brute-force against Shape-Stamp CAPTCHA
  const simulateBotShapeBruteForce = async () => {
    setIsSimulating(true);
    addTerminalLine("\n[!] ATTACK VECTOR 4: High-Velocity Bot Script on Shape CAPTCHA");
    addTerminalLine("[+] Bot script sending 50 automated clicks per second on shapes...");

    for (let i = 1; i <= 3; i++) {
      await new Promise(r => setTimeout(r, 600));
      audioEngine.playError();
      const delay = i === 1 ? 0 : i === 2 ? 2000 : 4000;
      addTerminalLine(`[*] [Attempt ${i}/3] Bot shape guess rejected. Delay penalty injected: ${delay}ms.`);
    }

    addTerminalLine(`[-] GATEWAY RESPONSE: HTTP 423 SYSTEM LOCKOUT`);
    addTerminalLine(`[!] ALERT: 3 Consecutive Failures detected!`);
    addTerminalLine(`[!] ACTION: Account Locked. Shamir's 2-of-3 Guardian Quorum Initiated.`);
    addTerminalLine(`[+] DEFENSE VERDICT: Bot defeated. Rate limiting and Quorum prevents brute-force.`);

    setIsSimulating(false);
    onLockoutTriggered();

    if (voiceEnabled) {
      speechService.speak("High-velocity bot attack neutralized. Account locked. Guardian quorum initiated.");
    }
  };

  const handleClearLogs = () => {
    cryptoEngine.resetLockout();
    audioEngine.playClick();
    addTerminalLine("[*] Security state reset. Lockout cleared.");
  };

  return (
    <div className="card-glass rounded-2xl p-6 lg:p-8 border border-rose-500/30 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              Live Threat Interception Console (Judge Defense)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prove why NeuroPass network security is impenetrable across all 4 accessible modes.
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* 4 Attack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Attack 1 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30 block w-fit mb-2">
              ATTACK 01
            </span>
            <h3 className="text-xs font-bold text-white mb-1">Vibration Intercept</h3>
            <p className="text-[11px] text-slate-400">
              Remote bot attempts to sniff or brute-force the random vibration count over internet.
            </p>
          </div>
          <button
            onClick={simulateVibrationAttack}
            disabled={isSimulating}
            className="mt-3 w-full py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>

        {/* Attack 2 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30 block w-fit mb-2">
              ATTACK 02
            </span>
            <h3 className="text-xs font-bold text-white mb-1">Aishu vs Nithya Eye</h3>
            <p className="text-[11px] text-slate-400">
              Intruder (Aishu) takes Nithya's phone and presents her own eyes to camera.
            </p>
          </div>
          <button
            onClick={simulateAishuIrisAttack}
            disabled={isSimulating}
            className="mt-3 w-full py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>

        {/* Attack 3 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30 block w-fit mb-2">
              ATTACK 03
            </span>
            <h3 className="text-xs font-bold text-white mb-1">Shoulder Surfing</h3>
            <p className="text-[11px] text-slate-400">
              Attacker snoops on 300% zoomed screen to copy key clicks. Defeated by decoy layout.
            </p>
          </div>
          <button
            onClick={simulateShoulderSurfing}
            disabled={isSimulating}
            className="mt-3 w-full py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>

        {/* Attack 4 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30 block w-fit mb-2">
              ATTACK 04
            </span>
            <h3 className="text-xs font-bold text-white mb-1">Bot Shape Flood</h3>
            <p className="text-[11px] text-slate-400">
              Automated script bombards Shape-Stamp CAPTCHA. Injects delays and triggers lockout.
            </p>
          </div>
          <button
            onClick={simulateBotShapeBruteForce}
            disabled={isSimulating}
            className="mt-3 w-full py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>
      </div>

      {/* Terminal Console */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
          <span className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-rose-400" />
            INTERCEPTION CONSOLE
          </span>
          <span className="text-emerald-400">NETWORK DEFENSE: ENFORCED</span>
        </div>

        <div className="h-44 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {terminalOutput.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.includes('HTTP 403') || line.includes('HTTP 401') || line.includes('REJECTED') || line.includes('ALERT')
                  ? 'text-rose-400 font-bold'
                  : line.includes('DEFENSE VERDICT') || line.includes('Neutralized')
                  ? 'text-emerald-300 font-semibold'
                  : line.includes('[+]')
                  ? 'text-cyan-300'
                  : 'text-slate-400'
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
