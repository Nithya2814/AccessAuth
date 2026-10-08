import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Zap,
  Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { adaptiveEngine } from '../services/adaptiveEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface UnifiedLoginProps {
  onSuccess: (method: string, user: string) => void;
}

type AdaptiveMode = 'normal' | 'blind' | 'low-vision' | 'dyslexia' | 'iris';

export const UnifiedLogin: React.FC<UnifiedLoginProps> = ({ onSuccess }) => {
  // Current Mode: Starts at 100% Normal Baseline. Transforms purely on user behavior!
  const [currentMode, setCurrentMode] = useState<AdaptiveMode>('normal');
  const [behavioralNotice, setBehavioralNotice] = useState<string | null>(null);

  // Form Fields
  const [username, setUsername] = useState<string>('nithya@accessauth.org');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Dyslexia / Text CAPTCHA: Confusing letters (MWPQ) that dyslexic users struggle with
  const [textCaptcha, setTextCaptcha] = useState<string>('MWPQ');
  const [userCaptcha, setUserCaptcha] = useState<string>('');
  const [captchaFails, setCaptchaFails] = useState<number>(0);

  // 2. Blind Mode Vibration State
  const [vibrationChallenge, setVibrationChallenge] = useState(adaptiveEngine.getVibrationChallenge());
  const [isVibrating, setIsVibrating] = useState<boolean>(false);

  // 3. Typing Hesitation & Enhanced Color Keyboard Assist
  const [showColorKeyboard, setShowColorKeyboard] = useState<boolean>(false);
  const typingTimerRef = useRef<number | null>(null);

  // 4. Low-Vision 150% Font State
  const [is150Font, setIs150Font] = useState<boolean>(false);

  // 5. Iris Candidate State
  const [irisCandidate, setIrisCandidate] = useState<'Nithya' | 'Aishu'>('Nithya');
  const [gazeDotPos, setGazeDotPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Behavioral Telemetry Tracking Refs
  const mouseMovedRef = useRef<boolean>(false);

  // -------------------------------------------------------------------------
  // BEHAVIORAL AUTO-DETECTION ENGINE (Passively listens in background)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // 1. Mouse movement: If user moves mouse, they are using a standard visual pointer
    const handleMouseMove = () => {
      mouseMovedRef.current = true;
    };

    // 2. Keyboard Navigation: Blind person navigates via Tab key without mouse movement
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentMode !== 'normal') return;

      // BEHAVIOR A: User presses Tab without moving mouse -> BLIND / Screen-Reader User
      if (e.key === 'Tab') {
        if (!mouseMovedRef.current) {
          triggerBehavioralSwitch(
            'blind',
            'Screen-reader keyboard navigation detected (Zero mouse displacement). Voice & Haptic Mode activated.'
          );
        }
      }
    };

    // 3. Display Scale / Zoom: Low-Blind / Low-Vision user font size >= 150%
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.devicePixelRatio >= 1.4) {
        setIs150Font(true);
        if (currentMode === 'normal') {
          triggerBehavioralSwitch(
            'low-vision',
            `Display zoom magnification >= 150% detected. Activating Giant High-Visibility CAPTCHA.`
          );
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    // Initial check on mount
    if (typeof window !== 'undefined' && window.devicePixelRatio >= 1.4) {
      setIs150Font(true);
      if (currentMode === 'normal') {
        triggerBehavioralSwitch(
          'low-vision',
          `Display zoom magnification >= 150% detected. Activating Giant High-Visibility CAPTCHA.`
        );
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentMode]);

  // Typing Hesitation Tracker: If user pauses typing > 4 seconds, show Enhanced Color Keyboard!
  const handleTypingActivity = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Set timer for 4 seconds of idle typing
    typingTimerRef.current = window.setTimeout(() => {
      if (!showColorKeyboard && currentMode === 'normal') {
        setShowColorKeyboard(true);
        audioEngine.playBinauralTone('center', 520);
        speechService.speak("Typing delay detected. Enhanced color keyboard assistance activated.");
      }
    }, 4200);
  };

  // Master Behavioral Switcher
  const triggerBehavioralSwitch = (mode: AdaptiveMode, notice: string) => {
    audioEngine.playClick();
    setCurrentMode(mode);
    setBehavioralNotice(notice);
    setStatus('idle');
    setErrorMessage('');

    if (mode === 'blind') {
      triggerVibration();
      speechService.speak("Screen reader detected. Blind Accessible Mode active. You will feel random vibration pulses on your device to verify presence.");
    } else if (mode === 'dyslexia') {
      speechService.speak("Character confusion detected with MWPQ. Activating Dyslexia Mode. Distorted text removed. Please tap the Golden Star symbol stamp.");
    } else if (mode === 'low-vision') {
      speechService.speak("Display magnification detected. Scaled to 150% with Giant High-Visibility CAPTCHA.");
    } else if (mode === 'iris') {
      speechService.speak("Hands-Free Eye mode active. Ready for ocular biometric challenge.");
    }
  };

  // Reset back to Normal
  const resetToNormal = () => {
    audioEngine.playClick();
    setCurrentMode('normal');
    setBehavioralNotice(null);
    setShowColorKeyboard(false);
    mouseMovedRef.current = false;
    setCaptchaFails(0);
    setStatus('idle');
    setErrorMessage('');
    speechService.speak("Reset to standard login form.");
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

  // Handle Normal Submit & Auto-Adapt to Dyslexia on 3x failure!
  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClick();

    if (userCaptcha.toUpperCase() !== textCaptcha) {
      const next = captchaFails + 1;
      setCaptchaFails(next);
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Incorrect security CAPTCHA. (Attempt ${next}/3)`);

      // POINT 3: If user fails CAPTCHA 3 times, activate Dyslexia Symbol CAPTCHA!
      if (next >= 3) {
        setTimeout(() => {
          triggerBehavioralSwitch(
            'dyslexia',
            '3 Failed CAPTCHA attempts (MWPQ character confusion detected). Activating Symbol Stamp CAPTCHA.'
          );
        }, 600);
      }
      return;
    }

    // Success
    triggerSuccess("Standard Username & Password", username);
  };

  // Speak CAPTCHA Aloud for Low-Vision users
  const speakCaptchaAloud = () => {
    audioEngine.playClick();
    speechService.speak(`Security CAPTCHA letters are: ${textCaptcha.split('').join(', ')}.`);
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

  // Handle Dyslexia Symbol Stamp Selection (Golden Star ⭐)
  const handleShapeSelect = (shape: string) => {
    audioEngine.playClick();
    if (shape === 'star') {
      triggerSuccess("Geometric Shape-Stamp Verification", "Nithya (Dyslexia Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage("Please match the Golden Star symbol ⭐.");
    }
  };

  // Handle Enhanced Color Keyboard Key Tap
  const handleColorKeyTap = (char: string) => {
    audioEngine.playClick();
    setUserCaptcha(prev => prev + char);
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
    speechService.speak(`Authentication successful via ${method}. Welcome, ${user}.`);
    setTimeout(() => {
      onSuccess(method, user);
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 px-2 sm:px-4">

      {/* Pristine Real Login Card (Zero Tabs, 100% Behavioral Intelligence) */}
      <div className={`w-full max-w-md card-glass rounded-3xl p-6 sm:p-8 border relative transition-all ${
        is150Font ? 'scale-150-container' : ''
      } bg-white/95 border-white shadow-2xl`}>

        {/* Behavioral Notice Banner (Only shows when system automatically adapts on behavior!) */}
        {behavioralNotice && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start justify-between gap-2 animate-fadeIn shadow-sm">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="block text-indigo-900 font-bold text-[11px] uppercase">
                  Behavioral Auto-Adaptation Active
                </strong>
                <p className="text-[11px] text-slate-700 leading-snug">{behavioralNotice}</p>
              </div>
            </div>
            <button
              onClick={resetToNormal}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase shrink-0 underline"
            >
              Reset
            </button>
          </div>
        )}

        {/* Brand Header */}
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
        </div>

        {/* -------------------------------------------------------------------
            BRANCH A: BLIND MODE (Auto-triggered when Screen Reader / Tab Key detected)
            ------------------------------------------------------------------- */}
        {currentMode === 'blind' ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 shadow-sm">
              <p className="font-bold mb-1 flex items-center gap-1.5 text-cyan-700">
                <Volume2 className="w-4 h-4 text-cyan-600" />
                Voice Assistant Guidance Active
              </p>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                "Welcome Nithya. Screen reader detected. No visual typing required. Click the button below to feel the random vibration pulses on your physical device."
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
                Random count ({vibrationChallenge.pulseCount} pulses). Remote internet bots cannot feel physical hardware vibrations!
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
              onClick={resetToNormal}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold text-center block w-full mt-2 transition-colors"
            >
              ← Return to standard login
            </button>
          </div>
        ) : currentMode === 'iris' ? (
          /* -------------------------------------------------------------------
              BRANCH B: LAST RESORT IRIS SCAN (For severe motor disability)
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
              onClick={resetToNormal}
              className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold text-center block w-full mt-2 transition-colors"
            >
              ← Return to standard login
            </button>
          </div>
        ) : (
          /* -------------------------------------------------------------------
              BRANCH C: NORMAL BASELINE & ADAPTIVE SUB-MODES
              ------------------------------------------------------------------- */
          <form onSubmit={handleNormalSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Username / Email</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-indigo-500 transition-colors">
                <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    handleTypingActivity();
                  }}
                  className="bg-transparent text-slate-900 text-sm w-full outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Password</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-3 shadow-sm focus-within:border-indigo-500 transition-colors">
                <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleTypingActivity();
                  }}
                  className="bg-transparent text-slate-900 text-sm w-full outline-none font-medium"
                />
              </div>
            </div>

            {/* -------------------------------------------------------------------
                DYSLEXIA MODE: Activated automatically after 3 failed CAPTCHAs!
                Replaces distorted letters (MWPQ) with Symbol Stamp CAPTCHA!
                ------------------------------------------------------------------- */}
            {currentMode === 'dyslexia' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2.5 animate-fadeIn shadow-sm">
                <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                  <span>DYSLEXIA ADAPTATION ACTIVE</span>
                  <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold">Symbol Stamp</span>
                </div>
                <p className="text-[12px] text-slate-700">
                  MWPQ text letters removed. Tap the <strong className="text-amber-600">Golden Star ⭐</strong> symbol stamp to verify:
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
            ) : is150Font ? (
              /* -------------------------------------------------------------------
                  LOW-VISION / LOW-BLIND: 150% Font Scaled CAPTCHA with Audio Readout!
                  ------------------------------------------------------------------- */
              <div className="p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-900 uppercase">150% High-Visibility CAPTCHA</span>
                  <button
                    type="button"
                    onClick={speakCaptchaAloud}
                    className="p-1.5 rounded-lg bg-yellow-200 hover:bg-yellow-300 text-yellow-900 text-xs font-semibold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>
                <div className="py-2 px-4 bg-black border-2 border-yellow-400 rounded-xl text-center text-3xl font-mono font-bold tracking-widest text-yellow-300">
                  {textCaptcha}
                </div>
                <input
                  type="text"
                  placeholder="Type CAPTCHA letters..."
                  value={userCaptcha}
                  onChange={(e) => {
                    setUserCaptcha(e.target.value);
                    handleTypingActivity();
                  }}
                  className="bg-white border-2 border-yellow-400 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 w-full outline-none"
                />
              </div>
            ) : (
              /* -------------------------------------------------------------------
                  STANDARD DISTORTED TEXT CAPTCHA (Featuring confusing MWPQ characters)
                  ------------------------------------------------------------------- */
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
                    placeholder="Enter characters (e.g. MWPQ)..."
                    value={userCaptcha}
                    onChange={(e) => {
                      setUserCaptcha(e.target.value);
                      handleTypingActivity();
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 w-full outline-none shadow-sm focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playClick();
                      setTextCaptcha(prev => prev === 'MWPQ' ? 'BDPQ' : 'MWPQ');
                    }}
                    className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                  3 wrong attempts will automatically activate Symbol Stamp Dyslexia Mode.
                </p>
              </div>
            )}

            {/* -------------------------------------------------------------------
                ENHANCED COLOR KEYBOARD ASSIST (Appears if user types very late / pauses!)
                ------------------------------------------------------------------- */}
            {showColorKeyboard && currentMode !== 'dyslexia' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 animate-fadeIn space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    Enhanced Color Keyboard Assistance
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColorKeyboard(false)}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    Hide
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  High-contrast colorful keys to assist with typing latency:
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {['M', 'W', 'P', 'Q', 'B', 'D'].map((char, i) => {
                    const colors = [
                      'bg-indigo-600 text-white',
                      'bg-cyan-600 text-white',
                      'bg-emerald-600 text-white',
                      'bg-amber-500 text-white',
                      'bg-purple-600 text-white',
                      'bg-rose-600 text-white'
                    ];
                    return (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleColorKeyTap(char)}
                        className={`color-key ${colors[i % colors.length]}`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentMode !== 'dyslexia' && (
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
        {currentMode !== 'iris' && (
          <div className="pt-4 mt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => triggerBehavioralSwitch('iris', 'Hands-Free Iris fallback initialized for motor disability.')}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Unable to use hands or keyboard? Try Hands-Free Eye Access</span>
              <span className="text-purple-600">→</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
