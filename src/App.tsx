import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Activity,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Header } from './components/Header';
import { DemoController } from './components/DemoController';
import { AdaptiveLoginForm } from './components/AdaptiveLoginForm';
import { AttackerDashboard } from './components/AttackerDashboard';
import { GuardianRecovery } from './components/GuardianRecovery';
import { ArchitectureModal } from './components/ArchitectureModal';
import { cryptoEngine } from './services/cryptoEngine';
import type { AuthLog } from './services/cryptoEngine';
import type { UserPersonaMode } from './services/adaptiveEngine';
import { adaptiveEngine } from './services/adaptiveEngine';
import { audioEngine } from './services/audioEngine';

export function App() {
  const [activeTab, setActiveTab] = useState<'auditory' | 'cognitive' | 'eye' | 'attacker' | 'guardian' | 'architecture'>('auditory');
  const [personaMode, setPersonaMode] = useState<UserPersonaMode>('normal');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [recentLogs, setRecentLogs] = useState<AuthLog[]>([]);

  useEffect(() => {
    cryptoEngine.registerWebAuthnDevice();
    const interval = setInterval(() => {
      setIsLockedOut(cryptoEngine.getIsLockedOut());
      setRecentLogs([...cryptoEngine.getLogs().slice(0, 5)]);
    }, 1000);
    return () => clearInterval(interval);
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
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] ${highContrast ? 'high-contrast-mode' : ''}`}>
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">

        {/* Lockout Warning Banner if 3 attempts failed */}
        {isLockedOut && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">EMERGENCY SECURITY LOCKOUT ACTIVE</h3>
                <p className="text-xs text-rose-300">
                  3 consecutive failed authentications or intruder threat detected. Account locked.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveTab('guardian');
              }}
              className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <span>Unlock with Guardian Quorum</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* If User is successfully Authenticated */}
        {authenticatedUser ? (
          <div className="card-glass rounded-3xl p-8 lg:p-12 border border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center max-w-2xl mx-auto my-auto relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400" />
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <UserCheck className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 mb-3">
              Authenticated & Hardware Bound
            </span>

            <h2 className="text-3xl font-extrabold text-white font-['Outfit'] mb-2">
              Welcome back, {authenticatedUser}!
            </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-md">
              Access unlocked via <strong className="text-emerald-300">{authMethod}</strong> backed by TPM Hardware Enclave token.
            </p>

            {/* Issued Credentials Info */}
            <div className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 mb-6 text-left font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-500">
                <span>SESSION CRYPTOGRAPHIC ATTESTATION</span>
                <span className="text-emerald-400">STATUS: VALID</span>
              </div>
              <div className="space-y-1.5 text-slate-300 text-[11px]">
                <p><strong>Enclave Hardware Key:</strong> <span className="text-cyan-300">TPM_ENCLAVE_NITHYA_0x7FA9</span></p>
                <p><strong>Session Nonce (32B):</strong> <span className="text-amber-300">{adaptiveEngine.getSessionNonce()}</span></p>
                <p><strong>Access Scope:</strong> <span className="text-purple-300">["banking_transfers", "medical_vault", "identity_portal"]</span></p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 hover:border-cyan-500/40 transition-all"
            >
              Lock Enclave & Return
            </button>
          </div>
        ) : (
          <>
            {/* Show Demo Controller for Judges on the Main Auth Views */}
            {(activeTab === 'auditory' || activeTab === 'cognitive' || activeTab === 'eye') && (
              <DemoController
                currentMode={personaMode}
                onModeSelect={(mode) => setPersonaMode(mode)}
                voiceEnabled={voiceEnabled}
              />
            )}

            {/* Active Content Body */}
            <div className="flex-1">
              {(activeTab === 'auditory' || activeTab === 'cognitive' || activeTab === 'eye') && (
                <AdaptiveLoginForm
                  mode={personaMode}
                  onModeChange={(mode) => setPersonaMode(mode)}
                  onSuccess={handleAuthSuccess}
                  voiceEnabled={voiceEnabled}
                />
              )}

              {activeTab === 'attacker' && (
                <AttackerDashboard
                  voiceEnabled={voiceEnabled}
                  onLockoutTriggered={() => setIsLockedOut(true)}
                />
              )}

              {activeTab === 'guardian' && (
                <GuardianRecovery
                  voiceEnabled={voiceEnabled}
                  onRecovered={() => {
                    setIsLockedOut(false);
                    cryptoEngine.resetLockout();
                  }}
                />
              )}

              {activeTab === 'architecture' && <ArchitectureModal />}
            </div>
          </>
        )}

        {/* Live Cryptographic Telemetry Drawer at Bottom */}
        <section className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-4 mt-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              LIVE ADAPTIVE TELEMETRY & AUDIT STREAM
            </span>
            <span>REAL-TIME SENSOR METRICS</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {recentLogs.length === 0 ? (
              <p className="text-slate-600 text-[11px]">Enclave active. Awaiting first authentication attempt...</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">[{log.timestamp}]</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        log.type === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400'
                          : log.type === 'REJECTED'
                          ? 'bg-rose-950 text-rose-400'
                          : log.type === 'WARNING'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-cyan-950 text-cyan-400'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.event}</span>
                  </div>
                  <span className="text-slate-500 truncate max-w-md">{log.details}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-600 font-mono">
        NeuroPass · Developed for HACKNEXT'26 PS05 • CYBERSECURITY · SNS College of Technology · Adaptive Zero-Knowledge Authentication
      </footer>
    </div>
  );
}

export default App;
