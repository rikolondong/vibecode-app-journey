export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.subOsc = null;
    this.gainNode = null;
    this.isStarted = false;
    this.baseFreq = 70;
  }

  init() {
    if (this.isStarted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.04;
      this.gainNode.connect(this.ctx.destination);

      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sawtooth';
      this.osc.frequency.value = this.baseFreq;

      // Lowpass filter for warm automotive exhaust tone
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 240;

      this.osc.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.osc.start();
      this.isStarted = true;
    } catch {
      // Web Audio blocked or unavailable
    }
  }

  setVehicleBaseFreq(freq) {
    this.baseFreq = freq || 70;
  }

  updateEngine(rpmRatio, isDrivingMode) {
    if (!this.isStarted || !this.ctx) return;
    if (this.ctx.state === 'suspended' && isDrivingMode) {
      this.ctx.resume().catch(() => {});
    }
    const targetGain = isDrivingMode ? 0.035 + rpmRatio * 0.045 : 0.0;
    const targetFreq = this.baseFreq * (0.85 + rpmRatio * 2.1);
    const now = this.ctx.currentTime;
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.08);
    this.osc.frequency.setTargetAtTime(targetFreq, now, 0.06);
    this.filter.frequency.setTargetAtTime(200 + rpmRatio * 550, now, 0.08);
  }

  playHorn() {
    if (!this.isStarted) this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const hornOsc1 = this.ctx.createOscillator();
    const hornOsc2 = this.ctx.createOscillator();
    const hornGain = this.ctx.createGain();

    hornOsc1.type = 'sawtooth';
    hornOsc2.type = 'sawtooth';
    hornOsc1.frequency.value = 410;
    hornOsc2.frequency.value = 512;

    hornGain.gain.setValueAtTime(0.08, now);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    hornOsc1.connect(hornGain);
    hornOsc2.connect(hornGain);
    hornGain.connect(this.ctx.destination);

    hornOsc1.start(now);
    hornOsc2.start(now);
    hornOsc1.stop(now + 0.46);
    hornOsc2.stop(now + 0.46);
  }
}
