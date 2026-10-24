/**
 * BMW M Web Audio Engine
 * Procedurally generates realistic M TwinPower Turbo inline-6 rumble, throttle revving, and pops.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.isPlaying = false;
    this.idleGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
    this.revMultiplier = 1.0;
    this.driveModePitch = 1.0;
    this.rpmValue = 850;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this._setupEngineSynthesis();
  }

  _setupEngineSynthesis() {
    if (!this.ctx) return;

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Primary low-end rumble oscillator (Crankshaft rotation)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(38, this.ctx.currentTime); // ~800 RPM idle

    // Secondary harmonic oscillator (Exhaust pulse)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(57, this.ctx.currentTime);

    // Warm low-pass exhaust muffler filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // WaveShaper for mild exhaust rumble saturation
    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this._makeDistortionCurve(18);

    // Connect nodes
    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.distortion);
    this.distortion.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.isPlaying = true;
  }

  _makeDistortionCurve(amount) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  toggleMute() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.28;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }

  setDriveMode(pitchMultiplier = 1.0) {
    this.driveModePitch = pitchMultiplier;
    this._updateFrequencies();
  }

  revEngine(intensity = 1.0) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.isMuted) return;

    const now = this.ctx.currentTime;
    const targetBaseFreq = 38 * this.driveModePitch * (1.0 + intensity * 2.8);

    // Ramp up frequency
    this.osc1.frequency.cancelScheduledValues(now);
    this.osc1.frequency.setTargetAtTime(targetBaseFreq, now, 0.15);

    this.osc2.frequency.cancelScheduledValues(now);
    this.osc2.frequency.setTargetAtTime(targetBaseFreq * 1.5, now, 0.15);

    // Open filter for aggressive exhaust roar
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setTargetAtTime(650 * (1 + intensity), now, 0.18);

    // Increase volume during throttle
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(0.45, now, 0.12);

    this.rpmValue = 850 + Math.floor(intensity * 6200);

    // Auto drop after brief throttle spike
    setTimeout(() => {
      this.idle();
      this._playExhaustPop();
    }, 850);
  }

  idle() {
    if (!this.ctx || !this.osc1) return;
    const now = this.ctx.currentTime;
    const baseFreq = 38 * this.driveModePitch;

    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.4);
    this.osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.4);
    this.filter.frequency.setTargetAtTime(140, now, 0.4);
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.28, now, 0.3);
    this.rpmValue = 850;
  }

  _playExhaustPop() {
    if (!this.ctx || this.isMuted) return;
    // Fast crackle burst
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sawtooth';
    popOsc.frequency.setValueAtTime(95, this.ctx.currentTime);
    popGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain);
    popOsc.start();
    popOsc.stop(this.ctx.currentTime + 0.12);
  }

  _updateFrequencies() {
    if (!this.ctx || !this.osc1) return;
    const baseFreq = 38 * this.driveModePitch;
    const now = this.ctx.currentTime;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.2);
    this.osc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.2);
  }

  playClick() {
    if (!this.ctx || this.isMuted) return;
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    clickGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start();
    clickOsc.stop(this.ctx.currentTime + 0.04);
  }
}
