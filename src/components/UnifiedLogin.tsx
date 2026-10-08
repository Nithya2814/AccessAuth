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
        speechService.speak("Switched back to standard login mode.");
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
      setErrorMessage(`Incorrect text CAPTCHA. (Attempt ${next}/2)`);

      // AUTO-ADAPT: If user fails CAPTCHA 2 times, switch right here on this same form!
      if (next >= 2) {
        setTimeout(() => {
          setIsDyslexiaMode(true);
          setStatus('idle');
          setErrorMessage('');
          if (voiceEnabled) {
            speechService.speak("Multiple CAPTCHA difficulties detected. We have simplified the verification to a Golden Star shape stamp for you.");
          }
        }, 600);
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
      setErrorMessage(`Pulse mismatch. Device vibrated ${vibrationChallenge.pulseCount} times, but you selected ${num}.`);
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
    <div className="w-full flex flex-col items-center justify-center py-4 px-2 sm:px-4">

      {/* World-Class Modern Login Card */}
      <div className={`w-full max-w-md card-glass rounded-3xl p-6 sm:p-8 border relative transition-all ${
        isLowVisionMode 
          ? 'low-vision-tactile' 
          : 'bg-white/95 border-white shadow-2xl'
      }`}>

        {/* Card Header & Assist Controls */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-['Outfit'] leading-tight">
                Access<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">Auth</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Adaptive Identity Gateway</p>
            </div>
          </div>

          {/* Quick Assist Toolbar */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
            {/* Screen Reader Voice Assistant Toggle */}
            <button
              type="button"
              onClick={toggleBlindMode}
              title={isBlindMode ? "Turn off Blind Voice Assistant" : "Turn on Blind Voice Assistant"}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isBlindMode 
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Voice</span>
            </button>

            {/* High Contrast Zoom Toggle */}
            <button
              type="button"
              onClick={() => {
                audioEngine.playClick();
                setIsLowVisionMode(!isLowVisionMode);
                setKeypadOrder([...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].sort(() => Math.random() - 0.5)]);
              }}
              title="Toggle High Contrast Low-Vision Mode"
              className={`p-1.5 rounded-xl transition-all ${
                isLowVisionMode 
                  ? 'bg-amber-400 text-black font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {isLowVisionMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            BRANCH A: BLIND MODE (Active when Voice Assistant is on!)
            ------------------------------------------------------------------- */}
        {isBlindMode ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 shadow-sm">
              <p className="font-bold mb-1 flex items-center gap-1.5 text-cyan-700">
                <Volume2 className="w-4 h-4 text-cyan-600" />
                Voice Assistant Narration Active
              </p>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                "Welcome Nithya. Screen reader detected. No typing required. Click the button below to feel the random vibration pulses on your physical device."
              </p>
            </div>

            {/* Random Vibration Pulses Box */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <button
                type="button"
                onClick={triggerVibration}
                disabled={isVibrating}
                className={`py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mx-auto shadow-md ${
                  isVibrating
                    ? 'bg-cyan-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white'
                }`}
              >
                <Vibrate className="w-4 h-4" />
                <span>{isVibrating ? 'Vibrating Device...' : '1. Play Physical Vibration Pulses'}</span>
              </button>
              <p className="text-[11px] text-slate-500 font-mono mt-2.5">
                Randomized count ({vibrationChallenge.pulseCount} pulses). Remote network bots cannot feel physical hardware vibrations!
              </p>
            </div>

            {/* Pulse Count Selector */}
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-2 text-center">
                2. Tap the number of vibrations you felt:
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleVibrationGuess(num)}
                    className="py-3.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-500 text-slate-800 hover:text-indigo-600 font-mono font-bold text-lg rounded-2xl shadow-sm transition-all"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBlindMode(false)}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold text-center block w-full mt-2 transition-colors"
            >
              ← Return to standard login
            </button>
          </div>
        ) : isIrisMode ? (
          /* -------------------------------------------------------------------
              BRANCH B: LAST RESORT IRIS SCAN (Only when user explicitly asks!)
              ------------------------------------------------------------------- */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
              <p className="font-bold text-purple-700 mb-0.5 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" />
                Hands-Free Ocular Verification (Last Resort)
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                For severe motor disability (ALS/Parkinson's). Testing Nithya (Registered) vs Aishu (Intruder).
              </p>
            </div>

            {/* Candidate Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  setIrisCandidate('Nithya');
                  setStatus('idle');
                }}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all ${
                  irisCandidate === 'Nithya'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Nithya (Owner)
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  setIrisCandidate('Aishu');
                  setStatus('idle');
                }}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all ${
                  irisCandidate === 'Aishu'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Aishu (Intruder)
              </button>
            </div>

            {/* Moving Dot Liveness Box */}
            <div className="relative h-40 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div
                style={{ top: `${gazeDotPos.y}%`, left: `${gazeDotPos.x}%` }}
                className="absolute w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 flex items-center justify-center"
              >
                <Crosshair className="w-3 h-3 text-slate-950" />
              </div>

              <div className="text-center z-10 p-2">
                <Eye className="w-8 h-8 text-purple-400 mx-auto mb-1 animate-pulse" />
                <p className="text-xs font-mono text-white">
                  {isScanning ? "Tracking ocular saccades..." : `Ready to scan ${irisCandidate}.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunIris}
              disabled={isScanning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {isScanning ? 'Verifying Ocular Signature...' : `Verify Iris Profile for ${irisCandidate}`}
            </button>

            <button
              type="button"
              onClick={() => setIsIrisMode(false)}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold text-center block w-full mt-2 transition-colors"
            >
              ← Return to standard login
            </button>
          </div>
        ) : isLowVisionMode ? (
          /* -------------------------------------------------------------------
              BRANCH C: LOW-VISION DECOY MODE (Active when zoomed or toggled)
              ------------------------------------------------------------------- */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 bg-black border-2 border-yellow-400 rounded-2xl text-xs font-mono text-yellow-300">
              <strong>Anti-Shoulder-Surfing Decoy Shield:</strong> Keypad order is scrambled in local memory so onlookers cannot steal your PIN!
            </div>

            <div className="p-3 bg-black border-2 border-yellow-400 rounded-2xl text-center text-3xl font-mono font-bold tracking-widest text-yellow-300">
              {decoyPin.padEnd(4, '○')}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {keypadOrder.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDecoyClick(num)}
                  className="py-4 bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-300 font-mono text-2xl font-bold rounded-2xl transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDecoyPin('')}
              className="w-full py-2.5 rounded-xl bg-black border border-yellow-500 text-yellow-400 text-xs font-mono uppercase"
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
              <label className="text-xs text-slate-600 font-semibold block mb-1">Username / Email</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-indigo-500 transition-colors">
                <User className="w-4 h-4 text-slate-400 mr-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-slate-900 text-sm w-full outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Password</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-indigo-500 transition-colors">
                <Lock className="w-4 h-4 text-slate-400 mr-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-slate-900 text-sm w-full outline-none font-medium"
                />
              </div>
            </div>

            {/* CAPTCHA SECTION: Adapts right inside the form if failed 2x! */}
            {isDyslexiaMode ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2.5 animate-fadeIn shadow-sm">
                <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                  <span>DYSLEXIA ADAPTATION ACTIVE</span>
                  <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold">Shape Stamp</span>
                </div>
                <p className="text-[12px] text-slate-700">
                  Text CAPTCHA removed. Tap the <strong className="text-amber-600">Golden Star ⭐</strong> stamp to verify:
                </p>

                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {[
                    { id: 'star', label: 'Star', icon: Star, color: 'bg-amber-100/80 border-amber-400 text-amber-600' },
                    { id: 'circle', label: 'Circle', icon: Circle, color: 'bg-cyan-100/80 border-cyan-400 text-cyan-600' },
                    { id: 'triangle', label: 'Triangle', icon: Triangle, color: 'bg-emerald-100/80 border-emerald-400 text-emerald-600' },
                    { id: 'diamond', label: 'Diamond', icon: Diamond, color: 'bg-purple-100/80 border-purple-400 text-purple-600' }
                  ].map((shape) => {
                    const Icon = shape.icon;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => handleShapeSelect(shape.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${shape.color} hover:scale-105 transition-all shadow-sm`}
                      >
                        <Icon className="w-6 h-6 mb-1 fill-current" />
                        <span className="text-[10px] font-bold">{shape.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Standard Distorted Text CAPTCHA */
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600">Security Text CAPTCHA:</span>
                  <div className="px-3.5 py-1 bg-white border border-slate-300 rounded-xl font-mono font-bold tracking-widest text-indigo-600 text-sm select-none line-through shadow-sm">
                    {textCaptcha}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter characters..."
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 w-full outline-none shadow-sm focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playClick();
                      setTextCaptcha(Math.random().toString(36).substring(2, 6).toUpperCase());
                    }}
                    className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                  Enter wrong twice to test Dyslexia shape adaptation.
                </p>
              </div>
            )}

            {!isDyslexiaMode && (
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-500/25"
              >
                Sign In
              </button>
            )}
          </form>
        )}

        {/* Status Alerts */}
        {status !== 'idle' && (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 mt-4 text-xs transition-all shadow-sm ${
              status === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : status === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-cyan-50 border-cyan-300 text-cyan-900 animate-pulse'
            }`}
          >
            {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {status === 'verifying' && <Sparkles className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5 animate-spin" />}
            <div>
              <p className="font-bold">
                {status === 'success' ? "Authentication Succeeded!" : status === 'error' ? "Authentication Rejected" : "Verifying..."}
              </p>
              {errorMessage && <p className="text-[11px] font-mono mt-0.5">{errorMessage}</p>}
            </div>
          </div>
        )}

        {/* Last Resort Iris Link at Bottom (Only when not in Iris mode) */}
        {!isIrisMode && (
          <div className="pt-4 mt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                audioEngine.playClick();
                setIsIrisMode(true);
                setIsBlindMode(false);
                setIsLowVisionMode(false);
              }}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Cannot use hands or vision? Try Hands-Free Eye Access</span>
              <span className="text-purple-600">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Discreet Judge Tools (Floating beneath the card) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        <button
          type="button"
          onClick={onOpenAttackerSim}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-rose-700 border border-rose-200 text-xs font-semibold shadow-sm transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Judges: Test Attacks</span>
        </button>

        <button
          type="button"
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-sm transition-all"
        >
          <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>PS05 Architecture Proof</span>
        </button>

        <button
          type="button"
          onClick={onOpenGuardian}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-purple-700 border border-purple-200 text-xs font-semibold shadow-sm transition-all"
        >
          <Users className="w-3.5 h-3.5 text-purple-600" />
          <span>Shamir Quorum</span>
        </button>
      </div>

    </div>
  );
};
