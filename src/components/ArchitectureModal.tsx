import React from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  Layers, 
  Award
} from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  return (
    <div className="rounded-3xl p-6 lg:p-8 bg-white border border-slate-200 relative overflow-hidden shadow-xl animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              SNS COLLEGE OF TECHNOLOGY · HACKNEXT'26 SERIES 2.0
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1">
              PS05 • CYBERSECURITY — Architectural Defense Sheet
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>FIDO2 / WebAuthn Level 3</span>
        </div>
      </div>

      {/* PS05 4-Tier Persona Matrix */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mb-6">
        <h3 className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          PS05 Target User Adaptation & Security Enforcement Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Persona 1: Blind */}
          <div className="p-4 rounded-xl bg-white border border-cyan-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-cyan-700 font-bold uppercase block mb-1">01. BLIND PERSON</span>
              <p className="text-slate-900 font-bold mb-1">Voice & Random Vibration</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Dynamic pulse count $N \in [2..5]$. Physical motor boundary: Remote internet bots cannot feel hardware vibration.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-cyan-800 bg-cyan-50 p-1.5 rounded-lg border border-cyan-200">
              Physical Actuator Isolation
            </div>
          </div>

          {/* Persona 2: Low-Vision */}
          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-amber-700 font-bold uppercase block mb-1">02. LOW-VISION ZOOM</span>
              <p className="text-slate-900 font-bold mb-1">High-Contrast & Decoy Mask</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Prevents shoulder-surfing on 300% zoom. Keypad values scrambled dynamically in local memory.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
              Spatial Decoy Keypad
            </div>
          </div>

          {/* Persona 3: Dyslexia */}
          <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-indigo-700 font-bold uppercase block mb-1">03. DYSLEXIA / ELDERLY</span>
              <p className="text-slate-900 font-bold mb-1">Geometric Shape-Stamp</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                No twisted letters. Golden Star ⭐ stamp matching. Server-salted coordinates defeat automated bot scripts.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-indigo-800 bg-indigo-50 p-1.5 rounded-lg border border-indigo-200">
              Zero Character Confusion
            </div>
          </div>

          {/* Persona 4: Iris */}
          <div className="p-4 rounded-xl bg-white border border-purple-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-purple-700 font-bold uppercase block mb-1">04. LAST RESORT (IRIS)</span>
              <p className="text-slate-900 font-bold mb-1">Nithya vs Aishu Biometric</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Severe motor disability. Compares ocular IPD (0.28 vs 0.36) + moving dot challenge. Aishu cannot unlock Nithya's phone!
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-purple-800 bg-purple-50 p-1.5 rounded-lg border border-purple-200">
              Ocular Template Binding
            </div>
          </div>
        </div>
      </div>

      {/* Judges Cross-Examination Defense Q&A */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          Judge Rapid Cross-Examination Defense Sheet
        </h4>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <strong className="text-indigo-700 block mb-1 text-[13px]">
              Q: "Why did you use Random Vibration CAPTCHA instead of Audio CAPTCHA for blind users?"
            </strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong className="text-slate-800">A:</strong> "Traditional audio CAPTCHAs add loud static noise to prevent AI, which hurts blind ears. Our system uses the physical device's vibration motor with random pulse counts (2 to 5). Remote network bots cannot intercept physical device vibrations, achieving 100% human accessibility with zero auditory noise."
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <strong className="text-indigo-700 block mb-1 text-[13px]">
              Q: "If Aishu picks up Nithya's phone, won't the Iris scan unlock the phone for Aishu?"
            </strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong className="text-slate-800">A:</strong> "No sir. We enforce <strong>Biometric Feature Vector Template Matching</strong>. Nithya's registered Inter-Pupillary Distance (0.28) is stored in the device's Secure Enclave. When Aishu presents her eyes, the feature distance exceeds threshold (Delta &gt; 0.04), instantly rejecting the attempt with an Identity Mismatch."
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <strong className="text-indigo-700 block mb-1 text-[13px]">
              Q: "How does your system address PS05's core requirement: Account Recovery?"
            </strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong className="text-slate-800">A:</strong> "Disabled users struggle with 24-word recovery seeds or SMS loops. We implemented <strong>2-of-3 Shamir's Secret Sharing Social Recovery</strong>. Designated guardians (Physician + Caregiver) approve a time-bound shard to reconstruct the enclave root mathematically without master passwords."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
