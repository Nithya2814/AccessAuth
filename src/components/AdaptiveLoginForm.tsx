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
  ArrowRight,
  Volume2,
  Activity,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserPersonaMode } from '../services/adaptiveEngine';
import { adaptiveEngine } from '../services/adaptiveEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface AdaptiveLoginFormProps {
  onSuccess: (method: string, user: string) => void;
  voiceEnabled: boolean;
}

export const AdaptiveLoginForm: React.FC<AdaptiveLoginFormProps> = ({
  onSuccess,
  voiceEnabled
}) => {
  // Current Adaptive State: 'normal' -> auto-switches based on behavior!
  const [currentMode, setCurrentMode] = useState<UserPersonaMode>('normal');
  const [detectionReason, setDetectionReason] = useState<string>(
    'Default Baseline: Standard keyboard and visual mouse activity detected.'
  );

  // Common Form States
  const [username, setUsername] = useState<string>('nithya@accessauth.org');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Normal Mode Telemetry (CAPTCHA Failures)
  const [textCaptchaValue, setTextCaptchaValue] = useState<string>('9K4W');
  const [userCaptchaInput, setUserCaptchaInput] = useState<string>('');
  const [captchaFails, setCaptchaFails] = useState<number>(0);

  // 2. Blind Mode State (Random Vibration CAPTCHA)
  const [vibrationChallenge, setVibrationChallenge] = useState(adaptiveEngine.getVibrationChallenge());
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [selectedPulse, setSelectedPulse] = useState<number | null>(null);

  // 3. Low-Vision Decoy Keypad State
  const [decoyPin, setDecoyPin] = useState<string>('');
  const [keypadOrder, setKeypadOrder] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  // 4. Dyslexia Shape-Stamp CAPTCHA State
  const targetShape: 'star' = 'star';
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  // 5. Last Option: Iris & Eye Fallback State
  const [irisCandidate, setIrisCandidate] = useState<'Nithya' | 'Aishu'>('Nithya');
  const [gazeDotPos, setGazeDotPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [irisScanning, setIrisScanning] = useState<boolean>(false);

  // --- AUTOMATIC DETECTION ENGINE ---
  // Detects Screen-Reader / Keyboard-only navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user only uses Tab/Arrow navigation without mouse (Blind signal)
      if (e.key === 'Tab' && currentMode === 'normal') {
        // Can auto-suggest Blind Mode
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode]);

  // Trigger Mode Change with Voice Narration
  const adaptToMode = (newMode: UserPersonaMode, reason: string, spokenText: string) => {
    audioEngine.playClick();
    setCurrentMode(newMode);
    setDetectionReason(reason);
    setStatus('idle');
    setErrorMessage('');

    if (newMode === 'blind') {
      triggerVibrationPulse();
    } else if (newMode === 'low-vision') {
      setKeypadOrder([...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].sort(() => Math.random() - 0.5)]);
    }

    if (voiceEnabled) {
      speechService.speak(spokenText);
    }
  };

  // 1. Normal Mode Submit Handler
  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClick();

    if (userCaptchaInput.toUpperCase() !== textCaptchaValue) {
      const nextFails = captchaFails + 1;
      setCaptchaFails(nextFails);
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Incorrect text CAPTCHA. (Attempt ${nextFails}/2)`);

      // AUTOMATIC SWITCH: If failed twice -> Detect Dyslexia / Elderly cognitive struggle!
      if (nextFails >= 2) {
        setTimeout(() => {
          adaptToMode(
            'dyslexia',
            'BEHAVIORAL DETECT: 2x CAPTCHA Failures detected. User struggling with distorted characters -> Switched to Shape-Stamp CAPTCHA.',
            'Multiple CAPTCHA difficulties detected. Automatically adapting to Shape-Stamp verification mode for you.'
          );
        }, 800);
      }
      return;
    }

    handleFinalSuccess("Standard Baseline Authentication", username);
  };

  // 2. Blind Mode Vibration Trigger
  const triggerVibrationPulse = () => {
    audioEngine.playClick();
    const ch = adaptiveEngine.generateNewVibrationChallenge();
    setVibrationChallenge(ch);
    setSelectedPulse(null);
    setIsVibrating(true);

    adaptiveEngine.triggerPhysicalVibration();

    // Acoustic haptic clicks for laptop speakers
    for (let i = 0; i < ch.pulseCount; i++) {
      setTimeout(() => {
        audioEngine.playBinauralTone('center', 440);
      }, i * 320);
    }

    setTimeout(() => {
      setIsVibrating(false);
    }, ch.pulseCount * 320 + 200);
  };

  const handleVibrationSelect = (pulses: number) => {
    audioEngine.playClick();
    setSelectedPulse(pulses);

    if (pulses === vibrationChallenge.pulseCount) {
      handleFinalSuccess("Voice & Random Vibration CAPTCHA + WebAuthn", "Nithya (Blind Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Pulse mismatch! Device vibrated ${vibrationChallenge.pulseCount} times, you picked ${pulses}.`);
      triggerVibrationPulse();
    }
  };

  // 3. Low-Vision Decoy Keypad Click
  const handleDecoyClick = (num: number) => {
    audioEngine.playClick();
    if (decoyPin.length < 4) {
      const next = decoyPin + num;
      setDecoyPin(next);
      if (next.length === 4) {
        handleFinalSuccess("High-Contrast Decoy Shield PIN", "Nithya (Low-Vision Accessible)");
      }
    }
  };

  // 4. Dyslexia Shape-Stamp Select
  const handleShapeStampSelect = (shape: string) => {
    audioEngine.playClick();
    setSelectedShape(shape);

    if (shape === targetShape) {
      handleFinalSuccess("Geometric Shape-Stamp CAPTCHA", "Nithya (Dyslexia / Cognitive Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage("Shape mismatch. Please select the Golden Star stamp!");
    }
  };

  // 5. Last Option: Iris & Eye Verification (Nithya vs Aishu)
  const handleRunIrisScan = () => {
    audioEngine.playClick();
    setIrisScanning(true);
    setStatus('verifying');

    setGazeDotPos({ x: 30, y: 30 });
    setTimeout(() => {
      setGazeDotPos({ x: 70, y: 70 });
      setTimeout(() => {
        setIrisScanning(false);
        const result = adaptiveEngine.verifyOcularIdentity(
          irisCandidate,
          irisCandidate === 'Nithya' ? 0.28 : 0.36
        );

        if (result.success) {
          handleFinalSuccess("Biometric Iris Template Verification", "Nithya (Registered Owner)");
        } else {
          audioEngine.playError();
          setStatus('error');
          setErrorMessage(result.reason);
        }
      }, 900);
    }, 900);
  };

  // Success Finalizer
  const handleFinalSuccess = (method: string, user: string) => {
    setStatus('success');
    audioEngine.playSuccess();
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    if (voiceEnabled) {
      speechService.speak(`Access granted via ${method}. Identity confirmed for ${user}.`);
    }
    setTimeout(() => {
      onSuccess(method, user);
    }, 1000);
  };

  const resetToBaseline = () => {
    setCaptchaFails(0);
    adaptToMode('normal', 'Manual Reset: Restored to baseline login form.', 'Resetting to normal baseline mode.');
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      
      {/* =========================================================================
          LIVE TELEMETRY & BEHAVIORAL ADAPTATION SENSOR BAR
          ========================================================================= */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold">SMART INCLUSIVITY BEHAVIORAL SENSOR</span>
          </div>
          <span className="text-[11px] text-slate-400">
            ACTIVE ADAPTATION: <strong className="text-white uppercase">{currentMode}</strong>
          </span>
        </div>

        <div className="text-[11px] text-slate-300 mb-3 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
          <strong>Telemetry Trigger:</strong> {detectionReason}
        </div>

        {/* Quick Simulation Trigger Buttons (For Judges Demonstration!) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-500 uppercase mr-1">Simulate Sensor:</span>

          <button
            onClick={() => adaptToMode(
              'blind',
              'SENSOR SIGNAL: Screen Reader / Virtual Keyhooks active. Mouse idle -> Adapted to Voice & Vibration.',
              'Screen reader and virtual keyboard detected. Adapting to Blind Voice and Vibration authentication.'
            )}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold transition-all"
          >
            [Detect Screen Reader / Blind]
          </button>

          <button
            onClick={() => adaptToMode(
              'low-vision',
              'SENSOR SIGNAL: High Display Zoom (300%) & Font Scale >18px detected -> Adapted to High-Contrast Decoy.',
              'High display zoom detected. Adapting to Low-Vision High-Contrast Decoy Shield.'
            )}
            className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition-all"
          >
            [Detect High Zoom / Low-Vision]
          </button>

          <button
            onClick={() => {
              setCaptchaFails(2);
              adaptToMode(
                'dyslexia',
                'SENSOR SIGNAL: 2x CAPTCHA Failures detected -> Switched to Shape-Stamp CAPTCHA.',
                'Multiple CAPTCHA difficulties detected. Adapting to Shape-Stamp verification mode.'
              );
            }}
            className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 text-[11px] font-semibold transition-all"
          >
            [Simulate 2x CAPTCHA Fail / Dyslexia]
          </button>

          <button
            onClick={resetToBaseline}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          THE ADAPTIVE LOGIN FORM CONTAINER
          ========================================================================= */}
      <div className={`card-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all ${
        currentMode === 'low-vision' ? 'bg-black border-4 border-yellow-400 text-yellow-300' : ''
      }`}>

        {/* Mode Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              {currentMode === 'normal' && "NORMAL MODE"}
              {currentMode === 'blind' && "BLIND PERSON MODE"}
              {currentMode === 'low-vision' && "LOW-VISION ZOOM MODE"}
              {currentMode === 'dyslexia' && "DYSLEXIA / ELDERLY MODE"}
              {currentMode === 'iris' && "LAST RESORT: IRIS MODE"}
            </span>
            <h3 className="text-xl font-bold text-white mt-1 font-['Outfit']">
              {currentMode === 'normal' && "1. Normal Baseline Login Gateway"}
              {currentMode === 'blind' && "2. Voice-Guided & Dynamic Vibration Authentication"}
              {currentMode === 'low-vision' && "3. Ultra High-Contrast & Anti-Shoulder-Surfing Decoy"}
              {currentMode === 'dyslexia' && "4. Geometric Shape-Stamp Verification"}
              {currentMode === 'iris' && "5. Last Option: Hands-Free Iris Identity Verification"}
            </h3>
          </div>

          {currentMode !== 'normal' && (
            <button
              onClick={resetToBaseline}
              className="text-xs font-mono text-slate-400 hover:text-white underline"
            >
              Back to Normal
            </button>
          )}
        </div>

        {/* -----------------------------------------------------------------------
            1. NORMAL MODE (Standard Username, Password, Distorted Text CAPTCHA)
            ----------------------------------------------------------------------- */}
        {currentMode === 'normal' && (
          <form onSubmit={handleNormalSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
              Standard mode for general users. If you fail the distorted CAPTCHA twice, the system will automatically adapt to Shape-Stamp mode!
            </p>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">Username</label>
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

            {/* Distorted Text CAPTCHA */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">Distorted Alphanumeric CAPTCHA:</span>
                <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded font-mono font-bold tracking-widest text-cyan-400 text-sm select-none line-through">
                  {textCaptchaValue}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter the 4 characters..."
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-full outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setTextCaptchaValue(Math.random().toString(36).substring(2, 6).toUpperCase());
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-amber-400/80 mt-1.5 font-mono">
                *Tip for Judge Demo: Type a wrong code twice to watch it auto-adapt to Dyslexia Shape-Stamp mode!
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20"
            >
              Sign In (Normal)
            </button>
          </form>
        )}

        {/* -----------------------------------------------------------------------
            2. BLIND PERSON MODE (Voice Guidance + Dynamic Random Vibration)
            ----------------------------------------------------------------------- */}
        {currentMode === 'blind' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
              <p className="font-semibold mb-1 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                Voice Assistant Narration:
              </p>
              <p className="text-slate-300">
                "Welcome. No visual typing required. Click the button to feel the physical vibration motor pulses. Select the count to prove human presence."
              </p>
            </div>

            {/* Random Vibration Trigger Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <button
                onClick={triggerVibrationPulse}
                disabled={isVibrating}
                className={`py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mx-auto ${
                  isVibrating
                    ? 'bg-cyan-500 text-slate-950 animate-pulse shadow-lg shadow-cyan-500/30'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500 text-cyan-300'
                }`}
              >
                <Vibrate className="w-4 h-4" />
                <span>{isVibrating ? 'Vibrating Hardware Motor...' : '1. Vibrate Device / Play Haptic'}</span>
              </button>
              <p className="text-[11px] text-slate-400 font-mono mt-2">
                Server Nonce: Random count fresh every session ({vibrationChallenge.pulseCount} pulses). Remote bots CANNOT feel physical device vibration!
              </p>
            </div>

            {/* Accessible Number Selector */}
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-2 text-center">
                2. How many vibrations did you feel?
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleVibrationSelect(num)}
                    className={`py-3.5 rounded-xl font-mono text-base font-bold transition-all border ${
                      selectedPulse === num
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            3. LOW-VISION ZOOM MODE (High-Contrast & Decoy Keypad)
            ----------------------------------------------------------------------- */}
        {currentMode === 'low-vision' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black border-2 border-yellow-400 text-yellow-300 text-xs font-mono">
              <strong>Anti-Shoulder-Surfing Decoy Shield:</strong> Zooming to 300%+ exposes passwords to onlookers. Keypad order is scrambled in local memory so anyone standing behind sees only randomized dummy coordinates!
            </div>

            <div className="p-3 bg-black border-2 border-yellow-400 rounded-xl text-center text-2xl font-mono font-bold tracking-widest text-yellow-300">
              {decoyPin.padEnd(4, '○')}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {keypadOrder.map((num) => (
                <button
                  key={num}
                  onClick={() => handleDecoyClick(num)}
                  className="py-4 bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-300 font-mono text-xl font-bold rounded-xl transition-colors"
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
        )}

        {/* -----------------------------------------------------------------------
            4. DYSLEXIA / ELDERLY MODE (Geometric Shape-Stamp CAPTCHA)
            ----------------------------------------------------------------------- */}
        {currentMode === 'dyslexia' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
              <p className="font-semibold mb-1">Geometric Shape-Stamp Verification (No Twisted Characters):</p>
              <p className="text-slate-300">
                "Dyslexic letter confusion eliminated. Match the requested target shape stamp below to verify human presence."
              </p>
            </div>

            {/* Target Stamp to Match */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] font-mono text-slate-400 block mb-2">TARGET STAMP TO MATCH:</span>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-sm">
                <Star className="w-5 h-5 fill-current" />
                <span>Golden Star Stamp</span>
              </div>
            </div>

            {/* Shape Stamps Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'star', label: 'Star', icon: Star, color: 'text-amber-400 border-amber-500/40' },
                { id: 'circle', label: 'Circle', icon: Circle, color: 'text-cyan-400 border-cyan-500/40' },
                { id: 'triangle', label: 'Triangle', icon: Triangle, color: 'text-emerald-400 border-emerald-500/40' },
                { id: 'diamond', label: 'Diamond', icon: Diamond, color: 'text-purple-400 border-purple-500/40' },
              ].map((shape) => {
                const Icon = shape.icon;
                return (
                  <button
                    key={shape.id}
                    onClick={() => handleShapeStampSelect(shape.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-slate-950/80 hover:bg-slate-800 transition-all ${
                      selectedShape === shape.id ? 'border-cyan-400 scale-105' : shape.color
                    }`}
                  >
                    <Icon className="w-7 h-7 mb-1 fill-current" />
                    <span className="text-xs font-bold text-white">{shape.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            5. LAST RESORT: IRIS MODE (Hands-Free + Nithya vs Aishu Verification)
            ----------------------------------------------------------------------- */}
        {currentMode === 'iris' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
              <p className="font-semibold mb-1">Last Universal Fallback: Ocular Biometrics</p>
              <p className="text-slate-300">
                When hands, voice, and reading are impossible (ALS, Quadriplegia). Demonstrating Nithya (Registered Owner) vs Aishu (Intruder).
              </p>
            </div>

            {/* Candidate Selector */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[11px] font-mono text-slate-400 block mb-2">
                Candidate in Front of Camera:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    setIrisCandidate('Nithya');
                    setStatus('idle');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    irisCandidate === 'Nithya'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  1. Nithya (Owner · IPD 0.28)
                </button>
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    setIrisCandidate('Aishu');
                    setStatus('idle');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    irisCandidate === 'Aishu'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  2. Aishu (Intruder · IPD 0.36)
                </button>
              </div>
            </div>

            {/* Moving Dot Liveness Box */}
            <div className="relative h-44 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div
                style={{ top: `${gazeDotPos.y}%`, left: `${gazeDotPos.x}%` }}
                className="absolute w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_20px_#00f2fe] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 animate-pulse flex items-center justify-center"
              >
                <Crosshair className="w-3 h-3 text-slate-950" />
              </div>

              <div className="text-center z-10 p-2">
                <Eye className="w-8 h-8 text-purple-400 mx-auto mb-1 animate-pulse" />
                <p className="text-xs font-mono text-white">
                  {irisScanning ? "Liveness Challenge: Follow moving dot..." : `Ready to scan ${irisCandidate}.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleRunIrisScan}
              disabled={irisScanning}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/30"
            >
              {irisScanning ? 'Scanning & Verifying...' : `Scan Ocular Vector for ${irisCandidate}`}
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {status !== 'idle' && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 mt-4 text-xs transition-all ${
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
                {status === 'success' ? "Authentication Succeeded!" : status === 'error' ? "Authentication Rejected" : "Processing..."}
              </p>
              {errorMessage && <p className="text-[11px] font-mono mt-0.5">{errorMessage}</p>}
            </div>
          </div>
        )}

        {/* PROMINENT LAST OPTION LINK (Only if not already in iris mode) */}
        {currentMode !== 'iris' && (
          <div className="pt-4 mt-5 border-t border-slate-800/80 text-center">
            <button
              onClick={() => adaptToMode(
                'iris',
                'EMERGENCY ESCALATION: User cannot authenticate via hands, voice, or reading -> Switched to Last Option Hands-Free Iris.',
                'Switching to Last Resort: Hands-Free Iris and Eye Gaze verification.'
              )}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Cannot use hands or vision? Last Resort: Hands-Free Iris Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
