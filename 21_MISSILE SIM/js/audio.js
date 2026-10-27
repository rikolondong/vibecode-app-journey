/**
 * Audio Engine for Missile Simulator
 * Pure procedural Web Audio API synthesis - zero external asset dependencies
 * Uses cached noise buffers and race-free node cleanup
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.cachedNoiseBuffer = null;

    this.rocketNode = null;
    this.rocketGain = null;
    this.rocketFilter = null;
    this.jetNode = null;
    this.jetGain = null;
    this.sirenOsc = null;
    this.sirenLfo = null;
    this.sirenGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.cachedNoiseBuffer = this.createNoiseBuffer(5.0);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.ensureContext();
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.7 : 0.0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // Create White Noise Buffer for Rocket Exhaust & Explosions
  createNoiseBuffer(seconds = 5.0) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  getNoiseBuffer() {
    if (!this.cachedNoiseBuffer && this.ctx) {
      this.cachedNoiseBuffer = this.createNoiseBuffer(5.0);
    }
    return this.cachedNoiseBuffer;
  }

  // Continuous Rocket Propulsion Sound
  startRocketSound(type = 'rocket') {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.stopRocketSound();

    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    const rocketNode = this.ctx.createBufferSource();
    rocketNode.buffer = noiseBuffer;
    rocketNode.loop = true;

    const rocketFilter = this.ctx.createBiquadFilter();
    rocketFilter.type = 'lowpass';
    rocketFilter.frequency.setValueAtTime(type === 'hypersonic' ? 850 : 380, this.ctx.currentTime);
    rocketFilter.Q.setValueAtTime(2.8, this.ctx.currentTime);

    const rocketGain = this.ctx.createGain();
    rocketGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    rocketGain.gain.linearRampToValueAtTime(0.48, this.ctx.currentTime + 0.25);

    rocketNode.connect(rocketFilter);
    rocketFilter.connect(rocketGain);
    rocketGain.connect(this.masterGain);

    rocketNode.start();

    this.rocketNode = rocketNode;
    this.rocketFilter = rocketFilter;
    this.rocketGain = rocketGain;

    // Jet engine whine for cruise missile
    if (type === 'cruise') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
      const jetGain = this.ctx.createGain();
      jetGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      osc.connect(jetGain);
      jetGain.connect(this.masterGain);
      osc.start();
      this.jetNode = osc;
      this.jetGain = jetGain;
    }
  }

  updateRocketPitch(speedRatio, distRatio = 1) {
    if (!this.rocketFilter || !this.rocketGain || !this.ctx) return;
    const freq = Math.min(2000, 300 + speedRatio * 900);
    this.rocketFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    const gainVal = Math.max(0.1, Math.min(0.75, (0.5 * speedRatio) / Math.max(1, distRatio)));
    this.rocketGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.1);
  }

  stopRocketSound() {
    const rNode = this.rocketNode;
    const rGain = this.rocketGain;
    const jNode = this.jetNode;

    this.rocketNode = null;
    this.rocketGain = null;
    this.rocketFilter = null;
    this.jetNode = null;
    this.jetGain = null;

    if (rGain && this.ctx) {
      try {
        rGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        setTimeout(() => {
          try {
            if (rNode) {
              rNode.stop();
              rNode.disconnect();
            }
          } catch (e) {}
        }, 200);
      } catch (e) {}
    } else if (rNode) {
      try {
        rNode.stop();
        rNode.disconnect();
      } catch (e) {}
    }

    if (jNode) {
      try {
        jNode.stop();
        jNode.disconnect();
      } catch (e) {}
    }
  }

  // Launch Ignition Blast
  playLaunchIgnition() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  // Sonic Boom Crack
  playSonicBoom() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(0, 0, 0.7);
  }

  // Explosion with physical speed of sound delay (343 m/s)
  playExplosion(distanceMeters = 1000, yieldKg = 400) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    // Immediate tactical impact thump on camera sensor + delayed acoustic shockwave
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
    thumpOsc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.35);
    thumpGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thumpOsc.start();
    thumpOsc.stop(this.ctx.currentTime + 0.36);

    // Physical speed of sound delay (capped to 2.2s for snappy gameplay feel)
    const delaySec = Math.min(2.2, (distanceMeters / 343) * 0.15);

    setTimeout(() => {
      if (!this.ctx || !this.enabled) return;
      // High frequency impact crack
      const crackNode = this.ctx.createBufferSource();
      crackNode.buffer = noiseBuffer;
      const crackGain = this.ctx.createGain();
      crackGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      crackGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      crackNode.connect(crackGain);
      crackGain.connect(this.masterGain);
      crackNode.start(0, 0, 0.3);

      // Deep rumble & pressure shockwave
      const rumbleNoise = this.ctx.createBufferSource();
      rumbleNoise.buffer = noiseBuffer;

      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(145, this.ctx.currentTime);

      const rumbleGain = this.ctx.createGain();
      const distVol = Math.max(0.35, Math.min(1.0, 2500 / Math.max(500, distanceMeters)));
      const yieldFactor = THREE.MathUtils ? THREE.MathUtils.clamp(yieldKg / 250, 0.5, 1.4) : 1.0;
      rumbleGain.gain.setValueAtTime(distVol * yieldFactor, this.ctx.currentTime);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.2);

      rumbleNoise.connect(lowFilter);
      lowFilter.connect(rumbleGain);
      rumbleGain.connect(this.masterGain);

      rumbleNoise.start(0, 0.2, 2.3);
    }, delaySec * 1000);
  }

  // CIWS Rapid Flak Gatling burst using cached noise buffer
  playCIWSBurst() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    for (let i = 0; i < 6; i++) {
      const startTime = this.ctx.currentTime + i * 0.035;
      const shot = this.ctx.createBufferSource();
      shot.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.03);

      shot.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      shot.start(startTime, Math.random() * 2.0, 0.035);
    }
  }

  // SAM Missile Interceptor Launch
  playSAMLaunch() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.38);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.42);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.42);
  }

  // Air Defense Warning Siren
  startAirDefenseAlarm() {
    if (!this.enabled || this.sirenOsc) return;
    this.ensureContext();
    if (!this.ctx) return;

    const sirenOsc = this.ctx.createOscillator();
    const sirenGain = this.ctx.createGain();

    sirenOsc.type = 'sine';
    sirenOsc.frequency.setValueAtTime(620, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(1.6, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(240, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(sirenOsc.frequency);

    sirenGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(this.masterGain);

    sirenOsc.start();
    lfo.start();

    this.sirenOsc = sirenOsc;
    this.sirenLfo = lfo;
    this.sirenGain = sirenGain;
  }

  stopAirDefenseAlarm() {
    const sOsc = this.sirenOsc;
    const sLfo = this.sirenLfo;
    const sGain = this.sirenGain;

    this.sirenOsc = null;
    this.sirenLfo = null;
    this.sirenGain = null;

    if (sGain && this.ctx) {
      try {
        sGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        setTimeout(() => {
          try {
            if (sOsc) {
              sOsc.stop();
              sOsc.disconnect();
            }
            if (sLfo) {
              sLfo.stop();
              sLfo.disconnect();
            }
          } catch (e) {}
        }, 220);
      } catch (e) {}
    } else {
      try {
        if (sOsc) sOsc.stop();
        if (sLfo) sLfo.stop();
      } catch (e) {}
    }
  }

  // Seeker Lock Acquisition Tone
  playLockBeep(locked = false) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(locked ? 1500 : 900, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (locked ? 0.18 : 0.08));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // UI Tactical click
  playUIClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

window.soundEngine = new SoundEngine();
