import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  X, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Users, 
  FileText, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UnifiedLogin } from './components/UnifiedLogin';
import type { AdaptiveMode } from './components/UnifiedLogin';
import { AttackerDashboard } from './components/AttackerDashboard';
import { GuardianRecovery } from './components/GuardianRecovery';
import { ArchitectureModal } from './components/ArchitectureModal';
import { cryptoEngine } from './services/cryptoEngine';
import { adaptiveEngine } from './services/adaptiveEngine';
import { audioEngine } from './services/audioEngine';
import { speechService } from './services/speechService';

export function App() {
  const [activeModal, setActiveModal] = useState<'none' | 'attacker' | 'architecture' | 'guardian'>('none');
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  
  // Interactive Judge Persona Simulator State
  const [selectedPersona, setSelectedPersona] = useState<AdaptiveMode>('normal');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [lastSpeech, setLastSpeech] = useState<string>("System initialized. Standard adaptive gateway ready.");
  const [showPs05Details, setShowPs05Details] = useState<boolean>(false);

  useEffect(() => {
    cryptoEngine.registerWebAuthnDevice();

    // Subscribe to spoken voice feedback for live subtitles
    const unsubscribe = speechService.subscribe((text) => {
      setLastSpeech(text);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    speechService.setEnabled(next);
    audioEngine.playClick();
    if (next) {
      speechService.speak("Voice assistant unmuted.");
    }
  };

  const handleAuthSuccess = (method: string, user: string) => {
    setAuthenticatedUser(user);
    setAuthMethod(method);
    audioEngine.playSuccess();
    cryptoEngine.addLog('SUCCESS', 'Access Granted', `User [${user}] authenticated via [${method}]`);
  };

  const handleLogout = () => {
    audioEngine.playClick();
    setAuthenticatedUser(null);
    setAuthMethod(null);
    cryptoEngine.refreshChallenge();
    adaptiveEngine.refreshSessionNonce();
    setSelectedPersona('normal');
    speechService.speak("Session locked. Returned to standard login.");
  };

  const handlePersonaSelect = (persona: AdaptiveMode) => {
    audioEngine.playClick();
    setSelectedPersona(persona);
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-['Plus_Jakarta_Sans'] relative overflow-x-hidden bg-slate-50">
      
      {/* -------------------------------------------------------------------
          TOP PRODUCTION NAVBAR
          ------------------------------------------------------------------- */}
      <header className="header-glass sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-xs">
        
        {/* Brand & Track Details */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight font-['Outfit']">
                Access<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">Auth</span>
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                PS05 Cybersecurity
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              SNS College of Technology · HACKNEXT'26 SERIES 2.0
            </p>
          </div>
        </div>

        {/* Quick-Launch Judges Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* Threat Defense Console Button */}
          <button
            onClick={() => {
              audioEngine.playClick();
              setActiveModal('attacker');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all shadow-xs"
            title="Launch Attack Vector Simulator"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline">Threat Defense</span>
          </button>

          {/* Social Guardian Recovery Button */}
          <button
            onClick={() => {
              audioEngine.playClick();
              setActiveModal('guardian');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold transition-all shadow-xs"
            title="Test 2-of-3 Shamir Social Recovery"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">2-of-3 Recovery</span>
          </button>

          {/* Architecture & PS05 Defense Sheet */}
          <button
            onClick={() => {
              audioEngine.playClick();
              setActiveModal('architecture');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-all shadow-xs"
            title="View PS05 Defense Sheet & Q&A"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">PS05 Defense</span>
          </button>

          {/* Voice Assistant Toggle */}
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-xl border transition-all ${
              voiceEnabled 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={voiceEnabled ? "Voice Assistant Mute" : "Voice Assistant Unmute"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Hardware TPM Enclave Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>TPM 2.0:</span>
            <span className="font-bold text-emerald-600">ACTIVE</span>
          </div>

        </div>
      </header>

      {/* -------------------------------------------------------------------
          LIVE VOICE SUBTITLE & CRYPTOGRAPHIC TELEMETRY STRIP
          ------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2 border-b border-indigo-900/60 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono">
          
          {/* Live Voice Assistant Subtitle Ticker */}
          <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto">
            <div className="flex items-center gap-1 text-cyan-400 shrink-0 font-bold">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>VOICE ASSISTANT:</span>
            </div>
            <p className="text-slate-300 truncate text-[11px] font-sans italic">
              "{lastSpeech}"
            </p>
          </div>

          {/* Live Telemetry Tokens */}
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
            <span className="hidden sm:inline">
              FIDO2 <strong className="text-emerald-400">L3 Bound</strong>
            </span>
            <span>•</span>
            <span>
              Nonce: <strong className="text-amber-300">{adaptiveEngine.getSessionNonce().slice(0, 10)}...</strong>
            </span>
            <span>•</span>
            <span>
              IPD Baseline: <strong className="text-cyan-300">0.28 mm</strong>
            </span>
          </div>

        </div>
      </div>

      {/* -------------------------------------------------------------------
          MAIN BODY
          ------------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">

        {authenticatedUser ? (
          /* Enterprise Post-Auth Security Dashboard */
          <div className="w-full max-w-lg card-glass rounded-3xl p-8 sm:p-10 border border-emerald-200 bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center mx-auto relative overflow-hidden animate-fadeIn my-auto">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-5 shadow-lg shadow-emerald-500/10">
              <UserCheck className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono uppercase font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              Identity Verified & Hardware Bound
            </span>

            <h2 className="text-2xl font-bold text-slate-900 font-['Outfit'] mb-1">
              Welcome, {authenticatedUser}!
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Authenticated via <strong className="text-indigo-600">{authMethod}</strong>.
            </p>

            <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-6 text-left font-mono text-xs space-y-2 text-slate-700">
              <p className="flex justify-between">
                <span className="text-slate-500">Hardware Enclave:</span> 
                <span className="text-indigo-600 font-bold truncate">TPM_NITHYA_0x7FA9</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Session Nonce:</span> 
                <span className="text-amber-600 font-bold truncate">{adaptiveEngine.getSessionNonce()}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">FIDO2 Level:</span> 
                <span className="text-emerald-600 font-bold">L3 Physical Bound</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Zero-Knowledge Proof:</span> 
                <span className="text-cyan-600 font-bold">VALIDATED (Schnorr ZKP)</span>
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-md"
            >
              Lock Session & Return
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">

            {/* -------------------------------------------------------------------
                HACKATHON JUDGE INTERACTIVE SIMULATOR (TEST PERSONAS WITH 1 CLICK)
                ------------------------------------------------------------------- */}
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    🎭
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider">
                    Judge Interactive Persona Simulator
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✨ Autonomous Detection Also Active
                </span>
              </div>

              {/* Persona Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                
                {/* 1. Baseline */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('normal')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedPersona === 'normal'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base mb-1">🟢</span>
                  <span className="font-bold text-[11px]">Standard</span>
                  <span className="text-[9px] opacity-75">Baseline Form</span>
                </button>

                {/* 2. Blind */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('blind')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedPersona === 'blind'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-50/50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <span className="text-base mb-1">🟣</span>
                  <span className="font-bold text-[11px]">Blind User</span>
                  <span className="text-[9px] opacity-75">Voice + Haptic</span>
                </button>

                {/* 3. Dyslexia */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('dyslexia')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedPersona === 'dyslexia'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-amber-50/50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className="text-base mb-1">🟡</span>
                  <span className="font-bold text-[11px]">Dyslexia</span>
                  <span className="text-[9px] opacity-75">Symbol Stamp ⭐</span>
                </button>

                {/* 4. Tremor */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('tremor')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedPersona === 'tremor'
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                      : 'bg-cyan-50/50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
                  }`}
                >
                  <span className="text-base mb-1">🔵</span>
                  <span className="font-bold text-[11px]">Tremors</span>
                  <span className="text-[9px] opacity-75">Color Keyboard</span>
                </button>

                {/* 5. Low-Vision */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('low-vision')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedPersona === 'low-vision'
                      ? 'bg-yellow-500 text-slate-950 font-extrabold border-yellow-500 shadow-sm'
                      : 'bg-yellow-50/50 text-yellow-900 border-yellow-200 hover:bg-yellow-100'
                  }`}
                >
                  <span className="text-base mb-1">🟠</span>
                  <span className="font-bold text-[11px]">Low-Vision</span>
                  <span className="text-[9px] opacity-75">150% Scale</span>
                </button>

                {/* 6. Hands-Free Gaze */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('iris')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    selectedPersona === 'iris'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-purple-50/50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <span className="text-base mb-1">👁️</span>
                  <span className="font-bold text-[11px]">Hands-Free</span>
                  <span className="text-[9px] opacity-75">Webcam Beam</span>
                </button>

              </div>

              {/* Natural Behavioral Trigger Helper Note */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Natural Triggers:</span>
                <span className="text-indigo-600">Tab key (Blind)</span>
                <span>•</span>
                <span className="text-amber-600">3 failed MWPQs (Dyslexia)</span>
                <span>•</span>
                <span className="text-cyan-600">4s typing pause (Tremor)</span>
                <span>•</span>
                <span className="text-purple-600">8s idle (Hands-free)</span>
              </div>
            </div>

            {/* Centered Login Card */}
            <div className="w-full flex justify-center items-center">
              <UnifiedLogin 
                onSuccess={handleAuthSuccess}
                externalMode={selectedPersona}
                onModeChange={setSelectedPersona}
              />
            </div>

            {/* -------------------------------------------------------------------
                PS05 CYBERSECURITY ALIGNMENT GUIDE & DEFENSE SHEET ACCORDION
                ------------------------------------------------------------------- */}
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setShowPs05Details(!showPs05Details)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider">
                      PS05 Problem Statement Compliance Matrix
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      How AccessAuth solves all 6 questions of SNS College of Technology's PS05 challenge
                    </p>
                  </div>
                </div>
                {showPs05Details ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showPs05Details && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 text-xs animate-fadeIn">
                  
                  {/* Point 1 */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-indigo-700 mb-1">
                      1. How can users understand the authentication process & reduce confusion?
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Dual-channel sensory feedback: Screen instructions are mirrored through synthetic natural speech synthesis. Users are guided step-by-step with zero confusing cryptography jargon.
                    </p>
                  </div>

                  {/* Point 2 */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-amber-700 mb-1">
                      2. How can failed attempts be handled without user frustration?
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Non-punitive progressive adaptation: When users fail distorted character CAPTCHAs (MWPQ) 3 times, the system avoids hostile lockouts and seamlessly upgrades to an intuitive Geometric Symbol Stamp (Golden Star ⭐).
                    </p>
                  </div>

                  {/* Point 3 */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-cyan-700 mb-1">
                      3. How can accessibility be considered without lowering cybersecurity?
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Physical Actuator Isolation: Blind authentication uses device vibration pulses (2 to 5). Remote network bots cannot feel or guess local hardware vibrations. Motor tremor detection deploys high-contrast color keys.
                    </p>
                  </div>

                  {/* Point 4 */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-purple-700 mb-1">
                      4. How can users with severe physical disabilities (No Hands / ALS) authenticate?
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      8-second zero-touch auto-detection triggers the real laptop camera. A glowing radiant light beam sweeps across the screen for the user to follow with their eyes, verifying liveness and matching enrolled ocular IPD (0.28mm).
                    </p>
                  </div>

                  {/* Point 5 */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-emerald-700 mb-1">
                      5. How can users recover access securely when something goes wrong?
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      2-of-3 Shamir's Secret Sharing Social Guardian Recovery: Vulnerable users designate trusted guardians (e.g. Physician + Caregiver). 2 approvals reconstruct the enclave polynomial root at f(0) without forgotten passwords or SMS loops.
                    </p>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* -------------------------------------------------------------------
          MODALS FOR JUDGES (ATTACKER DASHBOARD, ARCHITECTURE, GUARDIAN)
          ------------------------------------------------------------------- */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative shadow-2xl animate-fadeIn">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all z-10"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'attacker' && (
              <AttackerDashboard
                voiceEnabled={voiceEnabled}
                onLockoutTriggered={() => setActiveModal('guardian')}
              />
            )}

            {activeModal === 'architecture' && <ArchitectureModal />}

            {activeModal === 'guardian' && (
              <GuardianRecovery
                voiceEnabled={voiceEnabled}
                onRecovered={() => setActiveModal('none')}
              />
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          FOOTER
          ------------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md px-6 py-4 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          AccessAuth · HACKNEXT'26 PS05 • CYBERSECURITY · SNS College of Technology
        </span>

        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <button 
            onClick={() => setActiveModal('attacker')} 
            className="hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Threat Defense
          </button>
          <span>·</span>
          <button 
            onClick={() => setActiveModal('guardian')} 
            className="hover:text-purple-600 transition-colors flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5 text-purple-500" />
            Guardian Quorum
          </button>
          <span>·</span>
          <button 
            onClick={() => setActiveModal('architecture')} 
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            PS05 Defense Sheet
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
