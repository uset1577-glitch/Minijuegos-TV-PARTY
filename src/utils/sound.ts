class SoundFX {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delaySec = 0,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  navTick() {
    this.playTone(520, 0.045, 'triangle', 0.045);
  }

  confirm() {
    this.playTone(587.33, 0.07, 'triangle', 0.07, 0);
    this.playTone(880, 0.09, 'triangle', 0.07, 0.05);
  }

  back() {
    this.playTone(440, 0.06, 'sine', 0.055, 0);
    this.playTone(311.13, 0.09, 'sine', 0.055, 0.05);
  }

  wheelPeg() {
    this.playTone(760, 0.028, 'square', 0.035);
  }

  timerBeep(urgent = false) {
    this.playTone(urgent ? 920 : 660, urgent ? 0.09 : 0.06, 'sine', urgent ? 0.08 : 0.05);
  }

  bombBoom() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.55);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  success() {
    this.playTone(523.25, 0.1, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.1, 'triangle', 0.08, 0.08);
    this.playTone(783.99, 0.18, 'triangle', 0.09, 0.16);
  }

  fail() {
    this.playTone(329.63, 0.12, 'sawtooth', 0.06, 0);
    this.playTone(246.94, 0.22, 'sawtooth', 0.06, 0.11);
  }
}

export const soundFX = new SoundFX();
