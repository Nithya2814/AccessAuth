# AccessAuth (NeuroPass) 🛡️♿
### Secure & Accessible Digital Authentication Gateway
**SNS College of Technology · HACKNEXT’26 SERIES 2.0 · PS05 • CYBERSECURITY**

---

## 📌 Problem Statement (PS05)
Digital authentication protects critical accounts, but traditional systems present severe barriers for people with disabilities:
- **Blind users** cannot decipher distorted audio/visual CAPTCHAs and lose context during 30s OTP app switches.
- **Dyslexic & elderly users** struggle with complex character-swapping password rules ($b/d, p/q$), frequently triggering account lockouts or resorting to insecure sticky-note workarounds.
- **Low-vision users** zooming in at 300%+ expose their plaintext credentials to shoulder-surfers in public.
- **When security is reduced for convenience**, accounts become vulnerable. **When authentication is too difficult**, users abandon legitimate services.

### 🎯 Objective
Build a system that balances **security, usability, accessibility, and recovery** — ensuring network security is **never degraded** while human interfaces are **100% inclusive**.

---

## 💡 The AccessAuth Solution
**AccessAuth** decouples the *Human Accessibility Layer* from the *Cryptographic Security Layer*. Regardless of which accessible method a user uses, the network transmission is protected by **256-bit W3C WebAuthn / FIDO2 hardware signatures** signed over ephemeral 30-second server challenges.

```
                          [User Interacts with AccessAuth]
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               ▼                                                   ▼
       [Behavioral Telemetry]                             [Active User Need]
 (Keyboard-only / Zoom / CAPTCHA Fails)            (Normal / Blind / Low-Vision / Dyslexia)
               │                                                   │
               └─────────────────────────┬─────────────────────────┘
                                         ▼
                 [Dynamic Adaptive Human Interface]
  ┌──────────────────┬───────────────────┬───────────────────┬────────────────────┐
  ▼                  ▼                   ▼                   ▼                    ▼
1. Normal Mode    2. Blind Mode       3. Low-Vision       4. Dyslexia Mode     5. Last Option
(Standard User)   (Random Vibration   (High-Contrast &    (Shape-Stamp         (Hands-Free
                   & Voice Guidance)   Decoy Shield)       CAPTCHA)             Iris Scan)
  └──────────────────┴───────────────────┴───────────────────┴────────────────────┘
                                         │
                                         ▼
            [Local Hardware Signature via W3C WebAuthn / TPM 2.0]
                     Sig = ECDSA_Sign(K_priv, Nonce + Hash)
                                         │
                                         ▼
           [Server-Side Constant-Time Verification & Ephemeral Nonce]
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                     [SUCCESS]                       [FAILURE]
                  Issue Session JWT             3 Consecutive Fails
                                                         │
                                                         ▼
                                            [2-of-3 Shamir Social Quorum]
                                            (Physician + Caregiver Recovery)
```

---

## 🌟 Key Features & Persona Breakdown

### 1. Normal Baseline Mode
- Standard familiar login with username, password, and alphanumeric CAPTCHA for abled users.
- Background telemetry passively monitors interaction friction.

### 2. Blind Persona — Voice & Dynamic Random Vibration CAPTCHA
- **The Problem Solved:** Eliminates noisy, frustrating audio CAPTCHAs.
- **Random Pulse Generator:** Generates a randomized pulse count ($N \in [2, 3, 4, 5]$) on every session.
- **Physical Boundary Security:** Triggered through physical device vibration (`navigator.vibrate`) and binaural acoustic haptics. Remote internet bots cannot intercept physical device vibrations over TCP/IP!

### 3. Low-Vision Persona — High-Contrast Decoy Shield
- **The Problem Solved:** Eliminates shoulder-surfing when users zoom their screen to 300%+.
- **Decoy Keypad Masking:** Keypad numbers are dynamically scrambled in local device memory. Onlookers standing behind the user harvest only scrambled decoy coordinates.

### 4. Dyslexia / Elderly Persona — Geometric Shape-Stamp CAPTCHA
- **The Problem Solved:** Eliminates character confusion ($b/d, p/q, 6/9$).
- **Auto-Adaptation:** If a user fails the text CAPTCHA twice, the system auto-adapts to Shape-Stamp mode.
- **Golden Star Stamp ⭐:** Replaces complex strings with simple shape matching. Server-salted coordinate hashing prevents automated bot replay attacks.

### 5. Last Option Emergency Fallback — Hands-Free Iris & Eye-Gaze
- **The Problem Solved:** Severe motor disability (ALS, Quadriplegia, severe tremors) where the user cannot use hands or voice.
- **Nithya vs Aishu Identity Verification:** Compares the candidate's Inter-Pupillary Distance (IPD) vector against Nithya's registered profile (0.28 vs 0.36). Even if intruder Aishu steals Nithya's phone, Aishu's ocular scan is rejected!
- **Dynamic Gaze Dot Liveness:** User follows an unpredictable moving dot path, completely defeating static photo and deepfake video spoofing.

### 6. Emergency Recovery — 2-of-3 Shamir's Secret Sharing Social Quorum
- When an account is locked after 3 failures, disabled users are not forced into complex 24-word seed phrases.
- 3 Nominated Guardians (Doctor, Caregiver, Family) provide time-bound approvals within 60s. Lagrange polynomial interpolation reconstructs the enclave root key without master passwords.

---

## 🛠️ Technology Stack
- **Frontend Core:** React 19, TypeScript, Vite 8
- **Styling & Aesthetics:** Vanilla CSS Modern Cyber-FinTech Design System (WCAG 2.2 AAA Contrast compliant)
- **Cryptographic Security:** W3C WebAuthn API (FIDO2 Enclave), Web Cryptography API (`window.crypto.subtle`), SHA-256 HMAC
- **Auditory & Speech:** Web Audio API (Bronze bell harmonics & binaural spatial audio), Web Speech API
- **Haptic Hardware:** HTML5 Vibration API (`navigator.vibrate`)
- **Computer Vision:** WebRTC MediaStream + Ocular Landmark & Gaze Tracking
- **Zero-Password Recovery:** Shamir's Secret Sharing (2-of-3 Quorum arithmetic)

---

## 🚀 Getting Started & Local Demo

### Prerequisites
- Node.js (v18 or higher)
- NPM (v9 or higher)

### Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/<YOUR_USERNAME>/AccessAuth.git

# 2. Navigate to directory
cd AccessAuth

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 🧪 Live Hackathon Demonstration Guide

1. **Test Normal Baseline:** Type an incorrect text CAPTCHA twice. The system will detect cognitive struggle and automatically switch to Dyslexia Shape-Stamp mode!
2. **Test Blind Mode:** Switch to **"2. Blind"**. Click *"1. Vibrate Device / Play Haptic"* to hear/feel random pulses (2, 3, 4, or 5). Select the number to authenticate.
3. **Test Low-Vision Decoy:** Switch to **"3. Low-Vision"**. Notice the high-contrast yellow layout and the scrambled decoy keypad preventing shoulder-surfing.
4. **Test Iris Mode (Nithya vs Aishu):** Switch to **"5. Iris Mode"**.
   - Test as **Aishu (Intruder)** ➔ Observe immediate **Biometric Identity Mismatch Rejection**!
   - Test as **Nithya (Owner)** ➔ Follow the dynamic moving dot to verify liveness and unlock!
5. **Test Attacker Console:** Click the **"Attacker Sim"** tab in the top header to run real-time penetration tests for Vibration Brute-Force, Aishu Eye Spoof, Shoulder Surfing, and Bot Shape Floods.

---

## 📄 License
Developed for academic and competitive evaluation at **HACKNEXT’26 SERIES 2.0 (SNS College of Technology)**. Open-source under MIT License.
