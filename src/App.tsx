import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  X, 
  ShieldCheck, 
  Cpu, 
  Activity,
  Sparkles
} from 'lucide-react';
import { UnifiedLogin } from './components/UnifiedLogin';
import { AttackerDashboard } from './components/AttackerDashboard';
import { GuardianRecovery } from './components/GuardianRecovery';
import { ArchitectureModal } from './components/ArchitectureModal';
import { cryptoEngine } from './services/cryptoEngine';
import { adaptiveEngine } from './services/adaptiveEngine';
import { audioEngine } from './services/audioEngine';

export function App() {
  // Modal state for judges proofs (attacker sim, architecture, guardian recovery)
  const [activeModal, setActiveModal] = useState<'none' | 'attacker' | 'architecture' | 'guardian'>('none');
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);

  useEffect(() => {
    cryptoEngine.registerWebAuthnDevice();
  }, []);

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
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-['Plus_Jakarta_Sans'] relative overflow-x-hidden">
      
      {/* Top Production Navbar (Luminous & Clean) */}
      <header className="header-glass sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
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
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Zero-Knowledge Adaptive Hardware & Biometric Authentication
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">TPM Enclave:</span>
            <span className="font-bold">ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">

        {authenticatedUser ? (
          /* Successful Logged In State */
          <div className="card-glass rounded-3xl p-8 sm:p-10 border border-emerald-200 bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center max-w-lg mx-auto relative overflow-hidden animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-5 shadow-lg shadow-emerald-500/10">
              <UserCheck className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono uppercase font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              Identity Verified & Hardware Bound
            </span>

            <h2 className="text-2xl font-bold text-slate-900 font-['Outfit'] mb-1">
              Welcome, {authenticatedUser}!
            </h2>
            <p className="text-xs text-slate-600 mb-5">
              Access successfully granted via <strong className="text-indigo-600">{authMethod}</strong>.
            </p>

            <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-6 text-left font-mono text-xs space-y-2 text-slate-700">
              <p className="flex justify-between">
                <span className="text-slate-500">Hardware Enclave:</span> 
                <span className="text-indigo-600 font-semibold">TPM_NITHYA_0x7FA9</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Session Nonce:</span> 
                <span className="text-amber-600 font-semibold">{adaptiveEngine.getSessionNonce()}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">FIDO2 Attestation:</span> 
                <span className="text-emerald-600 font-semibold">Level 3 Physical Bound</span>
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
          /* The Single Unified Login Card */
          <UnifiedLogin
            onSuccess={handleAuthSuccess}
            onOpenAttackerSim={() => setActiveModal('attacker')}
            onOpenArchitecture={() => setActiveModal('architecture')}
            onOpenGuardian={() => setActiveModal('guardian')}
          />
        )}

      </main>

      {/* Modal Dialog for Judges Tools */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative shadow-2xl animate-fadeIn">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'attacker' && (
              <AttackerDashboard
                voiceEnabled={true}
                onLockoutTriggered={() => setActiveModal('guardian')}
              />
            )}

            {activeModal === 'architecture' && <ArchitectureModal />}

            {activeModal === 'guardian' && (
              <GuardianRecovery
                voiceEnabled={true}
                onRecovered={() => setActiveModal('none')}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md px-6 py-3.5 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          AccessAuth · HACKNEXT'26 PS05 • CYBERSECURITY · SNS College of Technology
        </span>
        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>FIDO2 / WebAuthn Enclave Ready</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
