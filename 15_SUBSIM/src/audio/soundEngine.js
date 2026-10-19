// Web Audio API Sound Synthesizer for WWII U-Boat Simulation
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.dieselGain = null;
    this.dieselOsc1 = null;
    this.dieselOsc2 = null;
    this.dieselFilter = null;
    this.electricGain = null;
    this.electricOsc = null;
    this.oceanGain = null;
    this.sonarInterval = null;
    this.isMuted = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupDieselSound();
      this.setupElectricSound();
      this.setupAmbientOcean();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API initialization failed:", e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupDieselSound() {
    if (!this.ctx) return;
    this.dieselGain = this.ctx.createGain();
    this.dieselGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.dieselFilter = this.ctx.createBiquadFilter();
    this.dieselFilter.type = 'lowpass';
    this.dieselFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.dieselOsc1 = this.ctx.createOscillator();
    this.dieselOsc1.type = 'sawtooth';
    this.dieselOsc1.frequency.setValueAtTime(28, this.ctx.currentTime);

    this.dieselOsc2 = this.ctx.createOscillator();
    this.dieselOsc2.type = 'triangle';
    this.dieselOsc2.frequency.setValueAtTime(14, this.ctx.currentTime);

    this.dieselOsc1.connect(this.dieselFilter);
    this.dieselOsc2.connect(this.dieselFilter);
    this.dieselFilter.connect(this.dieselGain);
    this.dieselGain.connect(this.masterGain);

    this.dieselOsc1.start();
    this.dieselOsc2.start();
  }

  setupElectricSound() {
    if (!this.ctx) return;
    this.electricGain = this.ctx.createGain();
    this.electricGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.electricOsc = this.ctx.createOscillator();
    this.electricOsc.type = 'sine';
    this.electricOsc.frequency.setValueAtTime(180, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    this.electricOsc.connect(filter);
    filter.connect(this.electricGain);
    this.electricGain.connect(this.masterGain);

    this.electricOsc.start();
  }

  setupAmbientOcean() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.oceanGain);
    this.oceanGain.connect(this.masterGain);

    whiteNoise.start();
  }

  updateEngine(speedKnots, depthMeters) {
    if (!this.initialized || !this.ctx) return;
    const absSpeed = Math.abs(speedKnots);
    const isSubmerged = depthMeters > 5;
    const now = this.ctx.currentTime;

    if (absSpeed < 0.1) {
      this.dieselGain.gain.setTargetAtTime(0, now, 0.3);
      this.electricGain.gain.setTargetAtTime(0, now, 0.3);
      return;
    }

    const normSpeed = Math.min(absSpeed / 18, 1);

    if (!isSubmerged) {
      // Diesel on surface
      const targetGain = 0.05 + normSpeed * 0.22;
      this.dieselGain.gain.setTargetAtTime(targetGain, now, 0.2);
      this.dieselOsc1.frequency.setTargetAtTime(20 + normSpeed * 35, now, 0.2);
      this.dieselOsc2.frequency.setTargetAtTime(10 + normSpeed * 18, now, 0.2);
      this.dieselFilter.frequency.setTargetAtTime(90 + normSpeed * 140, now, 0.2);
      this.electricGain.gain.setTargetAtTime(0, now, 0.3);
    } else {
      // Electric motors submerged
      const targetGain = 0.04 + normSpeed * 0.15;
      this.electricGain.gain.setTargetAtTime(targetGain, now, 0.2);
      this.electricOsc.frequency.setTargetAtTime(140 + normSpeed * 160, now, 0.2);
      this.dieselGain.gain.setTargetAtTime(0, now, 0.3);
    }
  }

  playAlarm() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      const t = now + i * 0.7;
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(580, t + 0.35);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
      gain.gain.setValueAtTime(0.25, t + 0.65);
      gain.gain.linearRampToValueAtTime(0, t + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.71);
    }
  }

  playSonarPing() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(1080, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  playTorpedoLaunch() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pneumatic air rush
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.8);
  }

  playExplosion(isDeep = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Low rumble oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(isDeep ? 45 : 75, now);
    subOsc.frequency.exponentialRampToValueAtTime(18, now + 1.5);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 1.9);

    // Noise blast
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isDeep ? 220 : 600, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 1.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 1.5);
  }

  playHullCreak() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
    osc.frequency.linearRampToValueAtTime(80, now + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(140, now);
    filter.Q.setValueAtTime(8, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.01, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  playTelegraphClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }
}

export const sound = new SoundEngine();
