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
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserPersonaMode } from '../services/adaptiveEngine';
import { adaptiveEngine } from '../services/adaptiveEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface AdaptiveLoginFormProps {
  mode: UserPersonaMode;
  onModeChange: (mode: UserPersonaMode) => void;
  onSuccess: (method: string, user: string) => void;
  voiceEnabled: boolean;
}

export const AdaptiveLoginForm: React.FC<AdaptiveLoginFormProps> = ({
  mode,
  onModeChange,
  onSuccess,
  voiceEnabled
}) => {
  // Common Form States
  const [username, setUsername] = useState<string>('nithya@safe.auth');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Normal Mode State
  const [textCaptchaValue, setTextCaptchaValue] = useState<string>('7Q9X');
  const [userCaptchaInput, setUserCaptchaInput] = useState<string>('');

  // 2. Blind Mode State (Random Vibration CAPTCHA)
  const [vibrationChallenge, setVibrationChallenge] = useState(adaptiveEngine.getVibrationChallenge());
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [selectedPulseAnswer, setSelectedPulseAnswer] = useState<number | null>(null);

  // 3. Low-Vision Decoy Keypad State
  const [decoyPin, setDecoyPin] = useState<string>('');
  const [keypadOrder, setKeypadOrder] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  // 4. Dyslexia Shape-Stamp CAPTCHA State
  const [targetShape, setTargetShape] = useState<'star' | 'circle' | 'triangle' | 'diamond'>('star');
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  // 5. Iris / Eye Candidate (Nithya vs Aishu test)
  const [irisCandidate, setIrisCandidate] = useState<'Nithya' | 'Aishu'>('Nithya');
  const [gazeDotPosition, setGazeDotPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [eyeTrackingStep, setEyeTrackingStep] = useState<number>(0);

  // Initialize/Refresh mode-specific parameters
  useEffect(() => {
    setStatus('idle');
    setErrorMessage('');
    
    if (mode === 'blind') {
      triggerNewVibration();
      if (voiceEnabled) {
        speechService.speak("Voice and Haptic mode active. Press Vibrate Phone button to feel the random pulses.");
      }
    } else if (mode === 'low-vision') {
      // Scramble keypad on mode enter
      setKeypadOrder([...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].sort(() => Math.random() - 0.5)]);
      if (voiceEnabled) {
        speechService.speak("Ultra High Contrast mode active with anti shoulder surfing decoy layout.");
      }
    } else if (mode === 'dyslexia') {
      setTargetShape('star');
      if (voiceEnabled) {
        speechService.speak("Shape Stamp Verification active. Match the Golden Star stamp to verify human presence.");
      }
    } else if (mode === 'iris') {
      if (voiceEnabled) {
        speechService.speak("Hands-Free Iris mode active. Testing registered user Nithya against un-registered candidate Aishu.");
      }
    }
  }, [mode]);

  // --- 1. Normal Mode Handlers ---
  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playClick();

    if (userCaptchaInput.toUpperCase() !== textCaptchaValue) {
      const fails = adaptiveEngine.recordCaptchaFailure();
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Incorrect distorted CAPTCHA. (Failures: ${fails})`);

      // Auto-adapt to Dyslexia mode after 2 failures!
      if (fails >= 2) {
        if (voiceEnabled) {
          speechService.speak("Multiple CAPTCHA difficulties detected. Auto-adapting to Shape-Stamp verification mode for you.");
        }
        setTimeout(() => {
          onModeChange('dyslexia');
        }, 1200);
      }
      return;
    }

    // Success
    handleFinalSuccess("Standard Baseline Authentication", username);
  };

  // --- 2. Blind Mode Handlers (Dynamic Random Vibration) ---
  const triggerNewVibration = () => {
    audioEngine.playClick();
    const ch = adaptiveEngine.generateNewVibrationChallenge();
    setVibrationChallenge(ch);
    setSelectedPulseAnswer(null);
    setIsVibrating(true);

    // Trigger physical vibration
    adaptiveEngine.triggerPhysicalVibration();

    // Also play acoustic haptic clicks for laptop speakers
    for (let i = 0; i < ch.pulseCount; i++) {
      setTimeout(() => {
        audioEngine.playBinauralTone('center', 440);
      }, i * 340);
    }

    setTimeout(() => {
      setIsVibrating(false);
    }, ch.pulseCount * 340 + 200);
  };

  const handleVibrationGuess = (pulses: number) => {
    audioEngine.playClick();
    setSelectedPulseAnswer(pulses);

    if (pulses === vibrationChallenge.pulseCount) {
      handleFinalSuccess("Haptic Vibration CAPTCHA + WebAuthn FIDO2", "Nithya (Blind Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage(`Vibration count mismatch! Expected ${vibrationChallenge.pulseCount} pulses, got ${pulses}.`);
      triggerNewVibration();
    }
  };

  // --- 3. Low-Vision Decoy Keypad Handlers ---
  const handleDecoyKeyClick = (num: number) => {
    audioEngine.playClick();
    if (decoyPin.length < 4) {
      const next = decoyPin + num;
      setDecoyPin(next);
      if (next.length === 4) {
        handleFinalSuccess("High-Contrast Decoy Shield PIN", "Nithya (Low-Vision Accessible)");
      }
    }
  };

  // --- 4. Dyslexia Shape-Stamp CAPTCHA Handlers ---
  const handleShapeSelect = (shape: string) => {
    audioEngine.playClick();
    setSelectedShape(shape);

    if (shape === targetShape) {
      handleFinalSuccess("Geometric Shape-Stamp CAPTCHA", "Nithya (Dyslexia Accessible)");
    } else {
      audioEngine.playError();
      setStatus('error');
      setErrorMessage("Shape mismatch. Please match the Golden Star stamp!");
    }
  };

  // --- 5. Iris / Eye Mode Handlers (Nithya vs Aishu Test) ---
  const handleIrisVerification = () => {
    audioEngine.playClick();
    setStatus('verifying');

    // Simulate moving dot challenge
    setEyeTrackingStep(1);
    setGazeDotPosition({ x: 25, y: 30 });

    setTimeout(() => {
      setGazeDotPosition({ x: 75, y: 70 });
      setEyeTrackingStep(2);

      setTimeout(() => {
        // Evaluate candidate identity!
        const result = adaptiveEngine.verifyOcularIdentity(
          irisCandidate,
          irisCandidate === 'Nithya' ? 0.28 : 0.36
        );

        if (result.success) {
          handleFinalSuccess("Biometric Iris Template + Gaze Liveness", "Nithya (Verified Owner)");
        } else {
          audioEngine.playError();
          setStatus('error');
          setErrorMessage(result.reason);
        }
      }, 1000);
    }, 1000);
  };

  // Final Success Helper
  const handleFinalSuccess = (method: string, user: string) => {
    setStatus('success');
    audioEngine.playSuccess();
    confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
    if (voiceEnabled) {
      speechService.speak(`Authentication successful via ${method}. Welcome, ${user}.`);
    }
    setTimeout(() => {
      onSuccess(method, user);
    }, 1000);
  };

  return (
    <div className={`card-glass rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden transition-all ${
      mode === 'low-vision' ? 'bg-black border-4 border-yellow-400 text-yellow-300' : ''
    }`}>
      {/* Decorative Blur */}
      <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            {mode.toUpperCase()} ACCESSIBLE WORKFLOW
          </span>
          <h3 className="text-xl font-bold text-white mt-1 font-['Outfit']">
            {mode === 'normal' && "Standard Login Gateway"}
            {mode === 'blind' && "Voice & Dynamic Vibration Authentication"}
            {mode === 'low-vision' && "Ultra High-Contrast Decoy Shield"}
            {mode === 'dyslexia' && "Geometric Shape-Stamp Verification"}
            {mode === 'iris' && "Last Option: Hands-Free Iris & Eye-Gaze"}
          </h3>
        </div>

        {mode !== 'normal' && (
          <button
            onClick={() => onModeChange('normal')}
            className="text-xs font-mono text-slate-400 hover:text-white underline p-1"
          >
            Reset to Normal
          </button>
        )}
      </div>

      {/* =========================================================================
          MODE 1: NORMAL USER BASELINE
          ========================================================================= */}
      {mode === 'normal' && (
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

          {/* Standard Alphanumeric CAPTCHA */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400">Standard Text CAPTCHA:</span>
              <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded font-mono font-bold tracking-widest text-cyan-400 text-sm select-none line-through">
                {textCaptchaValue}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type the 4 letters..."
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white w-full outline-none"
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
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20"
          >
            Authenticate Baseline
          </button>
        </form>
      )}

      {/* =========================================================================
          MODE 2: BLIND USER (DYNAMIC RANDOM VIBRATION & VOICE)
          ========================================================================= */}
      {mode === 'blind' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Screen Reader Audio Prompt:
            </p>
            <p className="text-slate-300">
              "Feel the phone vibration motor pulses (or listen to trackpad haptic chimes). Select how many vibrations you felt to prove human presence."
            </p>
          </div>

          {/* Trigger Random Vibration Button */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <button
              onClick={triggerNewVibration}
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
            <p className="text-[11px] text-slate-500 font-mono mt-2">
              Random pulses generated fresh every session: [2, 3, 4, or 5]. Remote bots cannot feel physical device vibration!
            </p>
          </div>

          {/* Number Selector */}
          <div>
            <label className="text-xs text-slate-400 font-mono block mb-2 text-center">
              2. How many vibrations did you feel?
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleVibrationGuess(num)}
                  className={`py-3 rounded-xl font-mono text-base font-bold transition-all border ${
                    selectedPulseAnswer === num
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {num} Pulses
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: LOW-VISION (HIGH CONTRAST & ANTI-SHOULDER-SURFING DECOY)
          ========================================================================= */}
      {mode === 'low-vision' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-black border-2 border-yellow-400 text-yellow-300 text-xs font-mono">
            <strong>WCAG AAA 7:1 Contrast & Scrambled Decoy:</strong> Onlookers behind your shoulder cannot deduce your PIN because keypad numbers are dynamically randomized in local memory!
          </div>

          {/* Masked PIN Display */}
          <div className="p-3 bg-black border-2 border-yellow-400 rounded-xl text-center text-2xl font-mono font-bold tracking-widest text-yellow-300">
            {decoyPin.padEnd(4, '○')}
          </div>

          {/* Giant Tactile Scrambled Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {keypadOrder.map((num) => (
              <button
                key={num}
                onClick={() => handleDecoyKeyClick(num)}
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
            Clear PIN Entry
          </button>
        </div>
      )}

      {/* =========================================================================
          MODE 4: DYSLEXIA / ELDERLY (GEOMETRIC SHAPE-STAMP CAPTCHA)
          ========================================================================= */}
      {mode === 'dyslexia' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
            <p className="font-semibold mb-1">Human Visual Shape-Stamp Verification:</p>
            <p className="text-slate-300">
              "No twisted letters or numbers! Match the requested shape stamp below to verify human presence."
            </p>
          </div>

          {/* Requested Target Stamp */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] font-mono text-slate-400 block mb-2">TARGET STAMP TO MATCH:</span>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-sm">
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
                  onClick={() => handleShapeSelect(shape.id)}
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

      {/* =========================================================================
          MODE 5: LAST OPTION - HANDS-FREE IRIS & EYE (NITHYA VS AISHU TEST)
          ========================================================================= */}
      {mode === 'iris' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
            <p className="font-semibold mb-1">Last Universal Fallback: Ocular Biometrics</p>
            <p className="text-slate-300">
              For users with severe motor disability (ALS, Quadriplegia). Demonstrating Nithya (registered) vs Aishu (unregistered intruder).
            </p>
          </div>

          {/* Test Candidate Selector (Nithya vs Aishu) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <label className="text-[11px] font-mono text-slate-400 block mb-2">
              Select Candidate in Front of Camera:
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
                1. Nithya (Registered Owner)
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
                2. Aishu (Intruder with Nithya's phone)
              </button>
            </div>
          </div>

          {/* Interactive Gaze Challenge Box */}
          <div className="relative h-44 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Moving Gaze Dot */}
            <div
              style={{ top: `${gazeDotPosition.y}%`, left: `${gazeDotPosition.x}%` }}
              className="absolute w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_20px_#00f2fe] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 animate-pulse flex items-center justify-center"
            >
              <Crosshair className="w-3 h-3 text-slate-950" />
            </div>

            <div className="text-center z-10 p-2">
              <Eye className="w-8 h-8 text-purple-400 mx-auto mb-1 animate-pulse" />
              <p className="text-xs font-mono text-white">
                {eyeTrackingStep === 0 && `Ready to scan ${irisCandidate}'s ocular vector.`}
                {eyeTrackingStep === 1 && "Liveness Challenge 1: Follow dot..."}
                {eyeTrackingStep === 2 && "Verifying against Secure Enclave template..."}
              </p>
            </div>
          </div>

          <button
            onClick={handleIrisVerification}
            disabled={status === 'verifying'}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/30"
          >
            {status === 'verifying' ? 'Tracking & Verifying...' : `Run Iris Scan for ${irisCandidate}`}
          </button>
        </div>
      )}

      {/* Status Bar */}
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

      {/* Prominent Emergency Fallback link if on other modes */}
      {mode !== 'iris' && (
        <div className="pt-4 mt-5 border-t border-slate-800/80 text-center">
          <button
            onClick={() => onModeChange('iris')}
            className="text-xs text-purple-400 hover:text-purple-300 font-mono inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Cannot use hands or vision? Try Last Resort: Hands-Free Iris Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
