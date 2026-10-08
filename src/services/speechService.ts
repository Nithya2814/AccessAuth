// Accessible Speech Synthesizer for NeuroPass Voice Guidance

type SpeechListener = (text: string) => void;

class SpeechService {
  private enabled: boolean = true;
  private synth: SpeechSynthesis | null = null;
  private listeners: SpeechListener[] = [];
  public lastSpokenText: string = "";

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.synth) {
      this.synth.cancel();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public subscribe(listener: SpeechListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public speak(text: string, interrupt: boolean = true) {
    this.lastSpokenText = text;
    this.listeners.forEach(cb => {
      try { cb(text); } catch {}
    });

    if (!this.enabled || !this.synth) return;

    if (interrupt) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Pick pleasant English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }
}

export const speechService = new SpeechService();

