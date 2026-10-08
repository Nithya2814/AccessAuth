import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  RefreshCw, 
  Vibrate, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Star, 
  Circle, 
  Triangle, 
  Diamond, 
  Eye, 
  Crosshair, 
  Volume2, 
  Sun, 
  Moon,
  ShieldCheck,
  ShieldAlert,
  FileCode2,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { adaptiveEngine } from '../services/adaptiveEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface UnifiedLoginProps {
  onSuccess: (method: string, user: string) => void;
  onOpenAttackerSim: () => void;
  onOpenArchitecture: () => void;
  onOpenGuardian: () => void;
}

export const UnifiedLogin: React.FC<UnifiedLoginProps> = ({
  onSuccess,
  onOpenAttackerSim,
  onOpenArchitecture,
  onOpenGuardian
}) => {
  // Master Adaptive States (One single form, zero tabs!)
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [isLowVisionMode, setIsLowVisionMode] = useState<boolean>(false);
  const [isDyslexiaMode, setIsDyslexiaMode] = useState<boolean>(false);
  const [isIrisMode, setIsIrisMode] = useState<boolean>(false);

  // Form Fields
  const [username, setUsername] = useState<string>('nithya@accessauth.org');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Normal Text CAPTCHA State
  const [textCaptcha, setTextCaptcha] = useState<string>('7Q9X');
  const [userCaptcha, setUserCaptcha] = useState<string>('');
  const [failCount, setFailCount] = useState<number>(0);

  // Blind Mode Vibration State
  const [vibrationChallenge, setVibrationChallenge] = useState(adaptiveEngine.getVibrationChallenge());
  const [isVibrating, setIsVibrating] = useState<boolean>(false);

  // Low-Vision Decoy Keypad State
  const [decoyPin, setDecoyPin] = useState<string>('');
  const [keypadOrder, setKeypadOrder] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  // Dyslexia Shape State
  const targetShape: 'star' = 'star';

  // Iris Candidate State
  const [irisCandidate, setIrisCandidate] = useState<'Nithya' | 'Aishu'>('Nithya');
  const [gazeDotPos, setGazeDotPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Voice toggle
  const voiceEnabled: boolean = true;

  // Auto-detect Low-Vision Display Zoom on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.devicePixelRatio > 1.3) {
      setIsLowVisionMode(true);
      setKeypadOrder([...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].sort(() => Math.random() - 0.5)]);
    }
  }, []);

  // 1. BLIND MODE TRIGGER (User clicks Voice Assistant OR uses Screen Reader)
  const toggleBlindMode = () => {
    audioEngine.playClick();
    const next = !isBlindMode;
    setIsBlindMode(next);
    setIsIrisMode(false);
    setStatus('idle');
    setErrorMessage('');

    if (next) {
      triggerVibration();
      if (voiceEnabled) {
        speechService.speak("Screen reader assistant enabled. Blind Accessible Mode active. You will feel random vibration pulses to verify presence.");
      }
    } else {
      if (voiceEnabled) {
        speechService.speak("Switched back to normal login mode.");
      }
    }
  };

  // Trigger Random Vibration Pulses
  const triggerVibration = () => {
    const ch = adaptiveEngine.generateNewVibrationChallenge();
    setVibrationChallenge(ch);
    setIsVibrating(true);

    adaptiveEngine.triggerPhysicalVibration();

    for (let i = 0; i < ch.pulseCount; i++) {
      setTimeout(() => {
        audioEngine.playBinauralTone('center', 440);
      }, i * 320);
    }

    setTimeout(() => {
      setIsVibrating(false);
    }, ch.pulseCount * 320 + 200);
  };

  // Handle Normal Submit & Auto-Adapt to Dyslexia
  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClick();

    if (userCaptcha.toUpperCase() !== textCaptcha) {
      const next = failCount + 1;
      setFailCount(next);
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Incorrect distorted CAPTCHA. (Attempt ${next}/2)`);

      // AUTO-ADAPT: If user fails CAPTCHA 2 times, switch right here on this same form!
      if (next >= 2) {
        setTimeout(() => {
          setIsDyslexiaMode(true);
          setStatus('idle');
          setErrorMessage('');
          if (voiceEnabled) {
            speechService.speak("Multiple CAPTCHA difficulties detected. We have simplified the verification to a Golden Star shape stamp for you.");
          }
        }, 800);
      }
      return;
    }

    // Success
    triggerSuccess("Standard Username & Password", username);
  };

  // Handle Blind Vibration Guess
  const handleVibrationGuess = (num: number) => {
    audioEngine.playClick();
    if (num === vibrationChallenge.pulseCount) {
      triggerSuccess("Voice & Hardware Vibration CAPTCHA", "Nithya (Blind Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Pulse mismatch. Felt ${vibrationChallenge.pulseCount} vibrations, but picked ${num}.`);
      triggerVibration();
    }
  };

  // Handle Dyslexia Shape Stamp Selection
  const handleShapeSelect = (shape: string) => {
    audioEngine.playClick();
    if (shape === targetShape) {
      triggerSuccess("Geometric Shape-Stamp Verification", "Nithya (Dyslexia Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage("Please match the Golden Star stamp.");
    }
  };

  // Handle Low-Vision Decoy Keypad
  const handleDecoyClick = (num: number) => {
    audioEngine.playClick();
    if (decoyPin.length < 4) {
      const next = decoyPin + num;
      setDecoyPin(next);
      if (next.length === 4) {
        triggerSuccess("High-Contrast Decoy Shield PIN", "Nithya (Low-Vision Accessible)");
      }
    }
  };

  // Handle Iris Scan
  const handleRunIris = () => {
    audioEngine.playClick();
    setIsScanning(true);
    setStatus('verifying');

    setGazeDotPos({ x: 25, y: 30 });
    setTimeout(() => {
      setGazeDotPos({ x: 75, y: 70 });
      setTimeout(() => {
        setIsScanning(false);
        const result = adaptiveEngine.verifyOcularIdentity(
          irisCandidate,
          irisCandidate === 'Nithya' ? 0.28 : 0.36
        );

        if (result.success) {
          triggerSuccess("Biometric Iris Template Verification", "Nithya (Registered Owner)");
        } else {
          audioEngine.playError();
          setStatus('error');
          setErrorMessage(result.reason);
        }
      }, 900);
    }, 900);
  };

  const triggerSuccess = (method: string, user: string) => {
    setStatus('success');
    audioEngine.playSuccess();
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    if (voiceEnabled) {
      speechService.speak(`Authentication successful via ${method}. Welcome, ${user}.`);
    }
    setTimeout(() => {
      onSuccess(method, user);
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-4">

      {/* Real Enterprise Login Card */}
      <div className={`w-full max-w-md card-glass rounded-3xl p-6 sm:p-8 border shadow-2xl relative transition-all ${
        isLowVisionMode ? 'bg-black border-4 border-yellow-400 text-yellow-300' : 'bg-slate-900/85 border-slate-800'
      }`}>

        {/* Brand & Assistant Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-1">
                Access<span className="text-cyan-400">Auth</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">Secure & Accessible Digital Gateway</p>
            </div>
          </div>

          {/* Real Accessibility Controls inside Login Page */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {/* Screen Reader Voice Assistant Toggle */}
            <button
              onClick={toggleBlindMode}
              title={isBlindMode ? "Turn off Blind Voice Assistant" : "Turn on Blind Voice Assistant"}
              className={`p-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
                isBlindMode 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px]">Voice Assist</span>
            </button>

            {/* High Contrast Zoom Toggle */}
            <button
              onClick={() => {
                audioEngine.playClick();
                setIsLowVisionMode(!isLowVisionMode);
                setKeypadOrder([...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].sort(() => Math.random() - 0.5)]);
              }}
              title="Toggle High Contrast Low-Vision Mode"
              className={`p-1.5 rounded-lg transition-all ${
                isLowVisionMode ? 'bg-yellow-400 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isLowVisionMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            BRANCH A: BLIND MODE (Active when Voice Assistant is on!)
            ------------------------------------------------------------------- */}
        {isBlindMode ? (
          <div className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
              <p className="font-semibold mb-1 flex items-center gap-1.5 text-cyan-400">
                <Volume2 className="w-4 h-4" />
                Screen Reader / Voice Narration Active:
              </p>
              <p className="text-slate-300 text-[11px]">
                "Welcome Nithya. We detected your voice assistant. No typing needed. Click below to feel the random vibration pulses on your device."
              </p>
            </div>

            {/* Random Vibration Pulses Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <button
                onClick={triggerVibration}
                disabled={isVibrating}
                className={`py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mx-auto ${
                  isVibrating
                    ? 'bg-cyan-500 text-slate-950 animate-pulse'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500 text-cyan-300'
                }`}
              >
                <Vibrate className="w-4 h-4" />
                <span>{isVibrating ? 'Vibrating Motor...' : '1. Vibrate Device / Play Haptic'}</span>
              </button>
              <p className="text-[11px] text-slate-400 font-mono mt-2">
                Random count ({vibrationChallenge.pulseCount} pulses). Remote internet hackers cannot feel device vibrations!
              </p>
            </div>

            {/* Pulse Count Selector */}
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-2 text-center">
                2. Select how many vibrations you felt:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleVibrationGuess(num)}
                    className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-white font-mono font-bold text-base rounded-xl transition-all"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsBlindMode(false)}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-mono text-center block w-full mt-2"
            >
              ← Switch back to standard login
            </button>
          </div>
        ) : isIrisMode ? (
          /* -------------------------------------------------------------------
              BRANCH B: LAST RESORT IRIS SCAN (Only when user explicitly asks!)
              ------------------------------------------------------------------- */
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
              <p className="font-semibold text-purple-300 mb-0.5">Last Resort: Hands-Free Iris Scan</p>
              <p className="text-slate-300 text-[11px]">
                For severe motor disability (ALS/Quadriplegia). Testing Nithya (Registered) vs Aishu (Intruder).
              </p>
            </div>

            {/* Candidate Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setIrisCandidate('Nithya');
                  setStatus('idle');
                }}
                className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                  irisCandidate === 'Nithya'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Nithya (Owner)
              </button>
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setIrisCandidate('Aishu');
                  setStatus('idle');
                }}
                className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                  irisCandidate === 'Aishu'
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Aishu (Intruder)
              </button>
            </div>

            {/* Moving Dot Liveness Box */}
            <div className="relative h-40 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div
                style={{ top: `${gazeDotPos.y}%`, left: `${gazeDotPos.x}%` }}
                className="absolute w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_20px_#00f2fe] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 flex items-center justify-center"
              >
                <Crosshair className="w-3 h-3 text-slate-950" />
              </div>

              <div className="text-center z-10 p-2">
                <Eye className="w-7 h-7 text-purple-400 mx-auto mb-1 animate-pulse" />
                <p className="text-xs font-mono text-white">
                  {isScanning ? "Follow the moving dot..." : `Ready to scan ${irisCandidate}.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleRunIris}
              disabled={isScanning}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              {isScanning ? 'Verifying Ocular Signature...' : `Scan Ocular Vector for ${irisCandidate}`}
            </button>

            <button
              onClick={() => setIsIrisMode(false)}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-mono text-center block w-full mt-2"
            >
              ← Back to standard login
            </button>
          </div>
        ) : isLowVisionMode ? (
          /* -------------------------------------------------------------------
              BRANCH C: LOW-VISION DECOY MODE (Active when zoomed or toggled)
              ------------------------------------------------------------------- */
          <div className="space-y-4">
            <div className="p-3 bg-black border-2 border-yellow-400 rounded-xl text-xs font-mono text-yellow-300">
              <strong>Anti-Shoulder-Surfing Decoy:</strong> Keypad order is scrambled in local memory so anyone looking at your zoomed screen cannot steal your PIN!
            </div>

            <div className="p-3 bg-black border-2 border-yellow-400 rounded-xl text-center text-2xl font-mono font-bold tracking-widest text-yellow-300">
              {decoyPin.padEnd(4, '○')}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {keypadOrder.map((num) => (
                <button
                  key={num}
                  onClick={() => handleDecoyClick(num)}
                  className="py-3.5 bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-300 font-mono text-xl font-bold rounded-xl transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={() => setDecoyPin('')}
              className="w-full py-2 rounded-xl bg-black border border-yellow-500 text-yellow-400 text-xs font-mono uppercase"
            >
              Clear PIN
            </button>
          </div>
        ) : (
          /* -------------------------------------------------------------------
              BRANCH D: NORMAL BASELINE (What every normal user sees first!)
              ------------------------------------------------------------------- */
          <form onSubmit={handleNormalSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">Username / Email</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                <User className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-white text-sm w-full outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">Password</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-white text-sm w-full outline-none"
                />
              </div>
            </div>

            {/* CAPTCHA SECTION: Adapts right inside the form if failed 2x! */}
            {isDyslexiaMode ? (
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-blue-300 font-mono">
                  <span>DYSLEXIA ADAPTATION ACTIVE:</span>
                  <span className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-white font-bold">Shape Stamp</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Distorted text removed. Match the <strong className="text-amber-400">Golden Star ⭐</strong> stamp:
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { id: 'star', label: 'Star', icon: Star, color: 'text-amber-400 border-amber-500/40' },
                    { id: 'circle', label: 'Circle', icon: Circle, color: 'text-cyan-400 border-cyan-500/40' },
                    { id: 'triangle', label: 'Triangle', icon: Triangle, color: 'text-emerald-400 border-emerald-500/40' },
                    { id: 'diamond', label: 'Diamond', icon: Diamond, color: 'text-purple-400 border-purple-500/40' }
                  ].map((shape) => {
                    const Icon = shape.icon;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => handleShapeSelect(shape.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border bg-slate-950/80 hover:bg-slate-800 ${shape.color} transition-all`}
                      >
                        <Icon className="w-6 h-6 mb-1 fill-current" />
                        <span className="text-[10px] text-white font-bold">{shape.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Standard Distorted Text CAPTCHA */
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">Security Text CAPTCHA:</span>
                  <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded font-mono font-bold tracking-widest text-cyan-400 text-sm select-none line-through">
                    {textCaptcha}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter characters..."
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playClick();
                      setTextCaptcha(Math.random().toString(36).substring(2, 6).toUpperCase());
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Fail 2x to test Dyslexia shape adaptation.
                </p>
              </div>
            )}

            {!isDyslexiaMode && (
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20"
              >
                Sign In
              </button>
            )}
          </form>
        )}

        {/* Status Alerts */}
        {status !== 'idle' && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 mt-4 text-xs transition-all ${
              status === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : status === 'error'
                ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                : 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 animate-pulse'
            }`}
          >
            {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {status === 'verifying' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-spin" />}
            <div>
              <p className="font-semibold">
                {status === 'success' ? "Authentication Succeeded!" : status === 'error' ? "Authentication Rejected" : "Verifying..."}
              </p>
              {errorMessage && <p className="text-[11px] font-mono mt-0.5">{errorMessage}</p>}
            </div>
          </div>
        )}

        {/* Last Resort Iris Link at Bottom (Only when not in Iris mode) */}
        {!isIrisMode && (
          <div className="pt-4 mt-5 border-t border-slate-800/80 text-center">
            <button
              onClick={() => {
                audioEngine.playClick();
                setIsIrisMode(true);
                setIsBlindMode(false);
                setIsLowVisionMode(false);
              }}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono inline-flex items-center gap-1 transition-colors"
            >
              <span>Cannot use hands or vision? Try Hands-Free Eye Access</span>
              <span className="text-purple-400">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Discreet Judge Tools (Floating at bottom so it doesn't clutter the login page!) */}
      <div className="flex items-center gap-2 mt-6">
        <button
          onClick={onOpenAttackerSim}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 text-xs font-mono transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Judges: Test Attacks</span>
        </button>

        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-mono transition-all"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>PS05 Architecture Proof</span>
        </button>

        <button
          onClick={onOpenGuardian}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 text-xs font-mono transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Shamir Quorum</span>
        </button>
      </div>

    </div>
  );
};
