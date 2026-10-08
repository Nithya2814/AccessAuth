// Web Audio API Synthesizer for NeuroPass
// Provides authentic temple bell harmonics, binaural cues, and haptic audio feedback

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  // Realistic Temple Bell / Ghanta sound synthesis with 4 harmonic partials
  public playTempleBell(frequency: number = 432, duration: number = 2.5) {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    const now = this.ctx.currentTime;
    
    // Partial frequencies and amplitude ratios representing traditional bronze bells
    const partials = [
      { ratio: 1.0, gain: 0.6, decay: duration },
      { ratio: 2.02, gain: 0.35, decay: duration * 0.75 },
      { ratio: 3.14, gain: 0.2, decay: duration * 0.5 },
      { ratio: 4.88, gain: 0.15, decay: duration * 0.3 }
    ];

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.8, now);
    masterGain.connect(this.analyser);

    partials.forEach(p => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency * p.ratio, now);

      pGain.gain.setValueAtTime(p.gain, now);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(pGain);
      pGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    });

    // Haptic vibration if available (for deaf-blind accessibility)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  // Binaural tone for auditory spatial discrimination (Left vs Right ear)
  public playBinauralTone(pan: 'left' | 'right' | 'center' = 'center', freq: number = 528) {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    if (panner) {
      panner.pan.value = pan === 'left' ? -0.9 : pan === 'right' ? 0.9 : 0;
      osc.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.analyser);
    } else {
      osc.connect(gainNode);
      gainNode.connect(this.analyser);
    }

    osc.start(now);
    osc.stop(now + 0.85);

    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
  }

  // Success Harmonic Chime (C major triad chord)
  public playSuccess() {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.analyser) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gainNode.gain.setValueAtTime(0.001, now + idx * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gainNode);
      gainNode.connect(this.analyser);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.25);
    });

    if (navigator.vibrate) {
      navigator.vibrate([80, 50, 150]);
    }
  }

  // Error buzz for invalid attempt or attacker rejection
  public playError() {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.35);

    gainNode.gain.setValueAtTime(0.35, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gainNode);
    gainNode.connect(this.analyser);

    osc.start(now);
    osc.stop(now + 0.45);

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  // Crisp mechanical tactile click
  public playClick() {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gainNode);
    gainNode.connect(this.analyser);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audioEngine = new AudioEngine();
