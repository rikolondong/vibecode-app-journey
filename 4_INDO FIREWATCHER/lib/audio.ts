// Sistem Audio Taktis Web Audio API (Synthesizer Murni tanpa file eksternal)

class TacticalAudioSystem {
  private audioCtx: AudioContext | null = null;
  private isMuted = false;
  private initialized = false;

  public init(): void {
    if (typeof window === 'undefined') return;
    if (!this.initialized) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    } else if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Nada Klik Tombol Telemetri
  public playClick(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch {}
  }

  // Nada Target Lock-On (Saat klik titik api)
  public playTargetLock(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6
      osc.frequency.setValueAtTime(1760.0, now + 0.1); // A6

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(now + 0.22);
    } catch {}
  }

  // Nada Radar Sonar Ping
  public playRadarPing(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(now + 0.4);
    } catch {}
  }

  // Nada Sirine Siaga Kritis
  public playAlertSiren(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.linearRampToValueAtTime(880.0, now + 0.15); // A5
      osc.frequency.linearRampToValueAtTime(659.25, now + 0.3);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(now + 0.35);
    } catch {}
  }
}

export const tacticalAudio = new TacticalAudioSystem();
