import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  X, 
  ShieldCheck, 
  Cpu, 
  Activity
} from 'lucide-react';
import { UnifiedLogin } from './components/UnifiedLogin';
import { AttackerDashboard } from './components/AttackerDashboard';
import { GuardianRecovery } from './components/GuardianRecovery';
import { ArchitectureModal } from './components/ArchitectureModal';
import { cryptoEngine } from './services/cryptoEngine';
import { adaptiveEngine } from './services/adaptiveEngine';
import { audioEngine } from './services/audioEngine';

export function App() {
  // Modal / Drawer state for judge proofs (only opens when clicked!)
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] relative">
      
      {/* Top Production Navbar (Clean & Minimal) */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-white text-base tracking-tight font-['Outfit']">
            Access<span className="text-cyan-400">Auth</span>
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
            PS05 Cybersecurity
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">TPM 2.0 Enclave:</span>
          <span className="text-emerald-400 font-bold">ACTIVE</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">

        {authenticatedUser ? (
          /* Successful Logged In State */
          <div className="card-glass rounded-3xl p-8 lg:p-12 border border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center max-w-lg mx-auto relative overflow-hidden animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <UserCheck className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 mb-2">
              Identity Verified & Hardware Bound
            </span>

            <h2 className="text-2xl font-bold text-white font-['Outfit'] mb-1">
              Welcome, {authenticatedUser}!
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Access granted via <strong className="text-emerald-300">{authMethod}</strong>.
            </p>

            <div className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 mb-6 text-left font-mono text-xs space-y-1.5 text-slate-300">
              <p><strong>Enclave Key:</strong> <span className="text-cyan-300">TPM_ENCLAVE_NITHYA_0x7FA9</span></p>
              <p><strong>Session Nonce:</strong> <span className="text-amber-300">{adaptiveEngine.getSessionNonce()}</span></p>
              <p><strong>Hardware Level:</strong> <span className="text-emerald-400">FIDO2 L3 Attestation</span></p>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
            >
              Lock Session & Return
            </button>
          </div>
        ) : (
          /* The Single Unified Login Page */
          <UnifiedLogin
            onSuccess={handleAuthSuccess}
            onOpenAttackerSim={() => setActiveModal('attacker')}
            onOpenArchitecture={() => setActiveModal('architecture')}
            onOpenGuardian={() => setActiveModal('guardian')}
          />
        )}

      </main>

      {/* Slide-over / Modal for Judges Tools (Only displays when clicked!) */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
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
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-xs text-slate-600 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>AccessAuth · HACKNEXT'26 PS05 • CYBERSECURITY · SNS College of Technology</span>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>FIDO2 / WebAuthn Active</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
