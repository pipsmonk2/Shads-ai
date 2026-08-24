// Web Audio API Synthesizer for Shads AI with iOS Safari Unlock Support
class ShadsAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupIOSUnlockListeners();
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  // Set up listeners for initial user gesture (required by iOS Safari and modern Chrome)
  private setupIOSUnlockListeners() {
    if (typeof window === "undefined") return;

    const unlock = () => {
      if (this.isUnlocked) return;
      try {
        const ctx = this.initCtx();
        if (ctx && ctx.state === "suspended") {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else if (ctx) {
          this.isUnlocked = true;
        }
      } catch (e) {
        // Silently catch audio init restrictions
      }

      // Remove listeners once triggered
      window.removeEventListener("touchstart", unlock, true);
      window.removeEventListener("touchend", unlock, true);
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("click", unlock, true);
    };

    window.addEventListener("touchstart", unlock, { passive: true, capture: true });
    window.addEventListener("touchend", unlock, { passive: true, capture: true });
    window.addEventListener("pointerdown", unlock, { passive: true, capture: true });
    window.addEventListener("click", unlock, { passive: true, capture: true });
  }

  private initCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      try {
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn("AudioContext creation failed:", e);
        return null;
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // Soft cybernetic UI click
  public playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio playback warning suppressed for background tabs / muted devices
    }
  }

  // Scanning pulse sound
  public playScanBeep(freq: number = 600) {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio playback warning suppressed
    }
  }

  // Triumphant cybernetic trade signal sound (BUY/SELL)
  public playSuccessSignal() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      
      const freqs = [349.23, 440.00, 523.25, 659.25]; // F4, A4, C5, E5 (Beautiful Fmaj7 chord)
      
      freqs.forEach((freq, index) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + index * 0.05);
        
        gain.gain.setValueAtTime(0.0, t + index * 0.05);
        gain.gain.linearRampToValueAtTime(0.12, t + index * 0.05 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + index * 0.05 + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(t + index * 0.05);
        osc.stop(t + index * 0.05 + 0.5);
      });
    } catch (e) {
      // Audio playback warning suppressed
    }
  }

  // Alias for backward compatibility
  public playSuccess() {
    this.playSuccessSignal();
  }

  // Soft sci-fi ping for "NO TRADE"
  public playNoTradeSignal() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, t); // A4
      gain1.gain.setValueAtTime(0.1, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(330, t + 0.1); // E4 (neutral fifth below)
      gain2.gain.setValueAtTime(0.1, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(t);
      osc1.stop(t + 0.3);
      osc2.start(t + 0.1);
      osc2.stop(t + 0.4);
    } catch (e) {
      // Audio playback warning suppressed
    }
  }
}

export const shadsAudio = new ShadsAudioEngine();
