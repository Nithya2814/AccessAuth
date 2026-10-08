import React, { useState } from 'react';
import { 
  Users, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cryptoEngine } from '../services/cryptoEngine';
import type { GuardianShare } from '../services/cryptoEngine';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';

interface GuardianRecoveryProps {
  voiceEnabled: boolean;
  onRecovered: () => void;
}

export const GuardianRecovery: React.FC<GuardianRecoveryProps> = ({ voiceEnabled, onRecovered }) => {
  const [shares, setShares] = useState<GuardianShare[]>(cryptoEngine.generateGuardianShares());
  const [reconstructedKey, setReconstructedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Account Lockout Emergency: Require 2 of 3 Guardian approvals within 60s window to reconstruct Shamir polynomial root.'
  );

  const approvedCount = shares.filter(s => s.status === 'APPROVED').length;

  const toggleApprove = (id: number) => {
    audioEngine.playClick();
    const updated = shares.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'APPROVED' ? 'PENDING' : 'APPROVED' } as GuardianShare;
      }
      return s;
    });
    setShares(updated);

    const approved = updated.filter(s => s.status === 'APPROVED');
    
    if (approved.length >= 2 && !reconstructedKey) {
      // Reconstruct using Shamir 2-of-3 Lagrange interpolation
      handleReconstruct(approved[0], approved[1]);
    } else {
      setStatusMessage(`${approved.length} of 2 required guardian authorizations gathered.`);
      if (voiceEnabled) {
        speechService.speak(`Guardian authorization registered. ${approved.length} of 2 required.`);
      }
    }
  };

  const handleReconstruct = (shareA: GuardianShare, shareB: GuardianShare) => {
    const result = cryptoEngine.reconstructSecret(
      { x: shareA.x, y: shareA.y },
      { x: shareB.x, y: shareB.y }
    );

    if (result.success) {
      setReconstructedKey(result.rootKey);
      setStatusMessage('2-of-3 Quorum achieved! Shamir polynomial root mathematically recovered at f(0). Lockout cleared!');
      audioEngine.playSuccess();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      
      if (voiceEnabled) {
        speechService.speak("Quorum threshold achieved. Root secret reconstructed. Enclave restored.");
      }
      onRecovered();
    }
  };

  const handleReset = () => {
    audioEngine.playClick();
    setShares(cryptoEngine.generateGuardianShares());
    setReconstructedKey(null);
    cryptoEngine.resetLockout();
    setStatusMessage('Guardian quorum reset to initial pending state.');
  };

  return (
    <div className="card-glass rounded-2xl p-6 lg:p-8 border border-purple-500/20 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              Social Guardian Quorum (2-of-3 Shamir's Secret Sharing)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Password Emergency Recovery: Polynomial secret reconstructed mathematically without any guardian knowing the full key.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 hover:text-white transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
          <span>Reset Quorum</span>
        </button>
      </div>

      {/* Shamir Polynomial Mathematical Illustration HUD */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 mb-6 text-xs font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-purple-300">
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>SHAMIR'S POLYNOMIAL: <strong className="text-cyan-400">f(x) = a₀ + a₁·x (mod 2³¹-1)</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>APPROVALS: <strong className="text-purple-300">{approvedCount}/2</strong> (60s Window)</span>
          </div>
        </div>

        {/* Polynomial Point Graph Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shares.map(share => {
            const isApproved = share.status === 'APPROVED';
            return (
              <div
                key={share.id}
                className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-purple-400 border border-purple-500/30">
                    SHARD #{share.id} (x={share.x})
                  </span>
                  <span className={`text-[10px] font-bold ${isApproved ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isApproved ? 'AUTHORIZED' : 'PENDING'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-0.5">{share.name}</h3>
                <p className="text-[11px] text-slate-400 mb-3">{share.role}</p>

                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 mb-3">
                  <span className="text-[10px] text-slate-500 block">Polynomial Point (x, y):</span>
                  <span className="text-xs text-cyan-300 font-mono truncate block">
                    ({share.x}, 0x{share.y})
                  </span>
                </div>

                <button
                  onClick={() => toggleApprove(share.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isApproved
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-purple-600/90 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isApproved ? 'Revoke Approval' : 'Approve & Release Shard'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reconstruction Result Box */}
      {reconstructedKey && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                Lagrange Polynomial Reconstructed Root f(0):
              </span>
              <span className="text-sm font-mono text-white font-bold tracking-widest break-all">
                {reconstructedKey}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold self-start md:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            ENCLAVE RE-PAIRED
          </span>
        </div>
      )}

      {/* Status Bar */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-white">{statusMessage}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Mathematical Proof: By Lagrange Interpolation, any k=2 points uniquely determine the degree 1 polynomial without revealing any other guardian's share.
          </p>
        </div>
      </div>
    </div>
  );
};
