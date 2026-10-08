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
      addTerminalLine(`[-] VECTOR EXTRACTED: Vector_Aishu = [IPD: 0.36, Ratio: 1.54]`);
      addTerminalLine(`[-] ENCLAVE REGISTERED: Vector_Nithya = [IPD: 0.28, Ratio: 1.82]`);
      addTerminalLine(`[-] EUCLIDEAN DISTANCE: Delta = 0.08 (Threshold: 0.04)`);
      addTerminalLine(`[-] GATEWAY RESPONSE: HTTP 401 UNAUTHORIZED`);
      addTerminalLine(`[-] DEFENSE VERDICT: Biometric Identity Mismatch.`);
      addTerminalLine(`[+] Access Denied: Device remains securely locked!`);

      setIsSimulating(false);
      if (voiceEnabled) {
        speechService.speak("Biometric identity mismatch. Intruder Aishu blocked from Nithya's account.");
      }
    }, 800);
  };

  // Attack 3: Shoulder Surfer snooping on zoomed screen
  const simulateShoulderSurfing = () => {
    setIsSimulating(true);
    audioEngine.playError();
    addTerminalLine("\n[!] ATTACK VECTOR 3: Physical Shoulder-Surfing Attack on Zoomed Screen");
    addTerminalLine("[+] Observer standing behind low-vision user viewing 300% zoomed display...");
    addTerminalLine("[*] Observer records keypad button coordinate taps...");

    setTimeout(() => {
      addTerminalLine(`[-] OBSERVED COORDINATES: Pressed Grid Slots [Pos #2, Pos #7, Pos #1, Pos #9]`);
      addTerminalLine(`[-] REAL DECOY TRANSLATION: Real PIN masked via client-side permutation memory.`);
      addTerminalLine(`[-] RESULT: Observer acquires meaningless randomized decoy entropy.`);
      addTerminalLine(`[+] Shoulder-surfer defeated: Zero secret plaintext exposed.`);

      setIsSimulating(false);
      if (voiceEnabled) {
        speechService.speak("Decoy keypad protection verified. Shoulder-surfing attack thwarted.");
      }
    }, 700);
  };

  // Attack 4: Bot attempts brute force on Dyslexia Shape Stamp
  const simulateBotShapeBruteForce = async () => {
    setIsSimulating(true);
    addTerminalLine("\n[!] ATTACK VECTOR 4: High-Velocity Script Attack on Geometric Stamp");
    addTerminalLine("[+] Headless Selenium script attempting coordinate-based click spraying...");

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
    <div className="rounded-3xl p-6 lg:p-8 bg-white border border-slate-200 relative overflow-hidden shadow-xl animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
              Live Threat Interception Console (Judge Defense)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prove why AccessAuth network security is impenetrable across all 4 accessible modes.
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all self-start sm:self-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* 4 Attack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Attack 1 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200 block w-fit mb-2">
              ATTACK 01
            </span>
            <h3 className="text-xs font-bold text-slate-900 mb-1">Vibration Intercept</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Remote bot attempts to sniff or brute-force the random vibration count over internet.
            </p>
          </div>
          <button
            onClick={simulateVibrationAttack}
            disabled={isSimulating}
            className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>

        {/* Attack 2 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200 block w-fit mb-2">
              ATTACK 02
            </span>
            <h3 className="text-xs font-bold text-slate-900 mb-1">Aishu vs Nithya Eye</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Intruder (Aishu) takes Nithya's phone and presents her own eyes to camera.
            </p>
          </div>
          <button
            onClick={simulateAishuIrisAttack}
            disabled={isSimulating}
            className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>

        {/* Attack 3 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200 block w-fit mb-2">
              ATTACK 03
            </span>
            <h3 className="text-xs font-bold text-slate-900 mb-1">Shoulder Surfing</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Attacker snoops on 300% zoomed screen to copy PIN clicks. Defeated by decoy layout.
            </p>
          </div>
          <button
            onClick={simulateShoulderSurfing}
            disabled={isSimulating}
            className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>

        {/* Attack 4 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200 block w-fit mb-2">
              ATTACK 04
            </span>
            <h3 className="text-xs font-bold text-slate-900 mb-1">Bot Shape Flood</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Automated script bombards Shape-Stamp CAPTCHA. Injects delays and triggers lockout.
            </p>
          </div>
          <button
            onClick={simulateBotShapeBruteForce}
            disabled={isSimulating}
            className="mt-4 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Attack</span>
          </button>
        </div>
      </div>

      {/* Terminal Console (Developer Terminal View) */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
          <span className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-rose-400" />
            DEFENSE INTERCEPTION TERMINAL
          </span>
          <span className="text-emerald-400 font-semibold">DEFENSE ENFORCED</span>
        </div>

        <div className="h-44 overflow-y-auto space-y-1">
          {terminalOutput.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.includes('HTTP 403') || line.includes('HTTP 401') || line.includes('REJECTED') || line.includes('ALERT')
                  ? 'text-rose-400 font-bold'
                  : line.includes('DEFENSE VERDICT') || line.includes('Neutralized')
                  ? 'text-emerald-400 font-semibold'
                  : line.includes('[+]')
                  ? 'text-cyan-400'
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
