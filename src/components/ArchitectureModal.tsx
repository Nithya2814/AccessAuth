import React from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  Layers, 
  Award
} from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  return (
    <div className="card-glass rounded-2xl p-6 lg:p-8 border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              SNS COLLEGE OF TECHNOLOGY · HACKNEXT'26 SERIES 2.0
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit'] mt-1">
              PS05 • CYBERSECURITY — Architectural Defense Sheet
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FIDO2 / WebAuthn Level 3</span>
        </div>
      </div>

      {/* PS05 4-Tier Persona Matrix */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 mb-6">
        <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          PS05 Target User Adaptation & Security Enforcement Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* Persona 1: Blind */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block mb-1">01. BLIND PERSON</span>
              <p className="text-white font-semibold mb-1">Voice & Random Vibration</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Dynamic pulse count $N \in [2..5]$. Physical motor boundary: Remote internet bots cannot feel hardware vibration.
              </p>
            </div>
            <div className="mt-2 text-[10px] text-cyan-300 bg-cyan-950/60 p-1.5 rounded">
              Physical Actuator Isolation
            </div>
          </div>

          {/* Persona 2: Low-Vision */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-amber-400 font-bold block mb-1">02. LOW-VISION ZOOM</span>
              <p className="text-white font-semibold mb-1">High-Contrast & Decoy Mask</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Prevents shoulder-surfing on 300% zoom. Keypad values scrambled dynamically in local memory.
              </p>
            </div>
            <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded">
              Spatial Decoy Keypad
            </div>
          </div>

          {/* Persona 3: Dyslexia */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-blue-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-blue-400 font-bold block mb-1">03. DYSLEXIA / ELDERLY</span>
              <p className="text-white font-semibold mb-1">Geometric Shape-Stamp</p>
              <p className="text-[11px] text-slate-400 font-sans">
                No twisted letters. Golden Star ⭐ stamp matching. Server-salted coordinates defeat automated bot scripts.
              </p>
            </div>
            <div className="mt-2 text-[10px] text-blue-300 bg-blue-950/60 p-1.5 rounded">
              Zero Character Confusion
            </div>
          </div>

          {/* Persona 4: Iris */}
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-purple-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-purple-400 font-bold block mb-1">04. LAST RESORT (IRIS)</span>
              <p className="text-white font-semibold mb-1">Nithya vs Aishu Biometric</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Severe motor disability. Compares candidate ocular IPD (0.28 vs 0.36) + moving dot challenge. Aishu cannot unlock Nithya's phone!
              </p>
            </div>
            <div className="mt-2 text-[10px] text-purple-300 bg-purple-950/60 p-1.5 rounded">
              Ocular Template Binding
            </div>
          </div>
        </div>
      </div>

      {/* Judges Cross-Examination Defense Q&A */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Judge Rapid Cross-Examination Defense Sheet
        </h4>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">
              Q: "Why did you use Random Vibration CAPTCHA instead of Audio CAPTCHA for blind users?"
            </strong>
            <p className="text-slate-300 text-[11px]">
              <strong className="text-white">A:</strong> "Traditional audio CAPTCHAs add loud static noise to prevent AI, which hurts blind ears. Our system uses the physical device's vibration motor with random pulse counts (2 to 5). Remote network bots cannot intercept physical device vibrations, achieving 100% human accessibility with zero auditory noise."
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">
              Q: "If Aishu picks up Nithya's phone, won't the Iris scan unlock the phone for Aishu?"
            </strong>
            <p className="text-slate-300 text-[11px]">
              <strong className="text-white">A:</strong> "No sir. We enforce <strong>Biometric Feature Vector Template Matching</strong>. Nithya's registered Inter-Pupillary Distance (0.28) is stored in the device's Secure Enclave. When Aishu presents her eyes, the feature distance exceeds threshold (Delta &gt; 0.04), instantly rejecting the attempt with an Identity Mismatch."
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <strong className="text-amber-300 block mb-1">
              Q: "How does your system address PS05's core requirement: Account Recovery?"
            </strong>
            <p className="text-slate-300 text-[11px]">
              <strong className="text-white">A:</strong> "Disabled users struggle with 24-word recovery seeds or SMS loops. We implemented <strong>2-of-3 Shamir's Secret Sharing Social Recovery</strong>. Designated guardians (Physician + Caregiver) approve a time-bound shard to reconstruct the enclave root mathematically without master passwords."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
