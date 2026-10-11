/**
 * JALAN TOL KELAM - Procedural Audio Engine (Web Audio API)
 * 100% Prosedural & Realistis - Efek transmisi gear shift, road joint thumps,
 * deru angin aerodinamis, radio retro lo-fi, dan gesekan guardrail.
 */

export class CarAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.masterGain = null;

    // Engine Nodes
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineSub = null;
    this.engineFilter = null;

    // Road Noise Nodes
    this.roadGain = null;
    this.roadFilter = null;
    this.roadNoiseSource = null;

    // Wind Noise Nodes
    this.windGain = null;
    this.windFilter = null;
    this.windNoiseSource = null;

    // Horn Nodes
    this.hornGain = null;
    this.hornOsc1 = null;
    this.hornOsc2 = null;
    this.isHornPlaying = false;

    // Radio Synth (Atmospheric Midnight Synth)
    this.radioGain = null;
    this.radioFilter = null;
    this.radioMode = 0; // 0: Off, 1: Eerie Midnight Synth, 2: Lo-Fi Night Drone, 3: Radio Static
    this.radioModesCount = 4;
    this.radioOscillators = [];

    // Rain Sound
    this.rainGain = null;
    this.rainFilter = null;
    this.rainSource = null;
    this.isRaining = false;

    // Turn signal relay sound
    this.lastBlinkerTime = 0;

    // Guardrail metal scrape sound
    this.scrapeGain = null;
    this.scrapeSource = null;

    // Audio state
    this.isMuted = false;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output with soft compressor for dynamic headroom
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      this._initEngineSound();
      this._initRoadNoise();
      this._initWindNoise();
      this._initHornSound();
      this._initRadioEngine();
      this._initRainSound();
      this._initScrapeSound();

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API tidak didukung:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ================= ENGINE SOUND =================
  _initEngineSound() {
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Primary engine cylinder firing (Sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(42, this.ctx.currentTime);

    // Secondary engine harmonic (Triangle)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(84, this.ctx.currentTime);

    // Sub-bass cabin vibration
    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = 'sine';
    this.engineSub.frequency.setValueAtTime(28, this.ctx.currentTime);

    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this._makeDistortionCurve(18);
    distortion.oversample = '2x';

    this.engineOsc1.connect(distortion);
    this.engineOsc2.connect(distortion);
    this.engineSub.connect(this.engineGain);
    distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSub.start();
  }

  _makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // ================= ROAD SURFACE NOISE =================
  _initRoadNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.8;
    }

    this.roadNoiseSource = this.ctx.createBufferSource();
    this.roadNoiseSource.buffer = buffer;
    this.roadNoiseSource.loop = true;

    this.roadFilter = this.ctx.createBiquadFilter();
    this.roadFilter.type = 'lowpass';
    this.roadFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.roadGain = this.ctx.createGain();
    this.roadGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    this.roadNoiseSource.connect(this.roadFilter);
    this.roadFilter.connect(this.roadGain);
    this.roadGain.connect(this.masterGain);
    this.roadNoiseSource.start();
  }

  // ================= HIGHWAY WIND RUSH =================
  _initWindNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.windNoiseSource = this.ctx.createBufferSource();
    this.windNoiseSource.buffer = buffer;
    this.windNoiseSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.windNoiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windNoiseSource.start();
  }

  // ================= GUARDRAIL METAL SCRAPE =================
  _initScrapeSound() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    this.scrapeSource = this.ctx.createBufferSource();
    this.scrapeSource.buffer = buffer;
    this.scrapeSource.loop = true;

    const scrapeFilter = this.ctx.createBiquadFilter();
    scrapeFilter.type = 'highpass';
    scrapeFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);

    this.scrapeGain = this.ctx.createGain();
    this.scrapeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.scrapeSource.connect(scrapeFilter);
    scrapeFilter.connect(this.scrapeGain);
    this.scrapeGain.connect(this.masterGain);
    this.scrapeSource.start();
  }

  setGuardrailScrape(active) {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    this.scrapeGain.gain.setTargetAtTime(active ? 0.35 : 0.0, now, 0.05);
  }

  // ================= ROAD EXPANSION JOINT THUMP (SAMBUNGAN JALAN TOL) =================
  playRoadJointThump(speedRatio = 0.5) {
    if (!this.isInitialized) return;
    try {
      const now = this.ctx.currentTime;
      // Front wheel thump
      this._triggerTireThump(now, speedRatio);
      // Rear wheel thump delayed by wheelbase time (~2.6m / speed)
      const delay = Math.max(0.06, Math.min(0.2, 0.12 / Math.max(speedRatio, 0.2)));
      this._triggerTireThump(now + delay, speedRatio * 0.85);
    } catch (e) {}
  }

  _triggerTireThump(time, intensity) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75, time);
    osc.frequency.exponentialRampToValueAtTime(25, time + 0.06);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, time);

    const vol = Math.min(0.28 * Math.max(intensity, 0.3), 0.4);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  // ================= CAR HORN =================
  _initHornSound() {
    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.setValueAtTime(392, this.ctx.currentTime); // G4

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.setValueAtTime(494, this.ctx.currentTime); // B4

    const hornFilter = this.ctx.createBiquadFilter();
    hornFilter.type = 'lowpass';
    hornFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

    this.hornOsc1.connect(hornFilter);
    this.hornOsc2.connect(hornFilter);
    hornFilter.connect(this.hornGain);
    this.hornGain.connect(this.masterGain);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  setHorn(active) {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    if (active && !this.isHornPlaying) {
      this.isHornPlaying = true;
      this.hornGain.gain.cancelScheduledValues(now);
      this.hornGain.gain.setValueAtTime(this.hornGain.gain.value, now);
      this.hornGain.gain.linearRampToValueAtTime(0.4, now + 0.04);
    } else if (!active && this.isHornPlaying) {
      this.isHornPlaying = false;
      this.hornGain.gain.cancelScheduledValues(now);
      this.hornGain.gain.setValueAtTime(this.hornGain.gain.value, now);
      this.hornGain.gain.linearRampToValueAtTime(0.0, now + 0.08);
    }
  }

  // ================= RAIN SOUND =================
  _initRainSound() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainSource.start();
  }

  setRain(active) {
    this.isRaining = active;
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    this.rainGain.gain.cancelScheduledValues(now);
    this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, now);
    this.rainGain.gain.linearRampToValueAtTime(active ? 0.25 : 0.0, now + 0.6);
  }

  // ================= TURN SIGNAL RELAY CLICK =================
  playBlinkerClick() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // ================= ATMOSPHERIC MIDNIGHT RADIO =================
  _initRadioEngine() {
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.radioFilter = this.ctx.createBiquadFilter();
    this.radioFilter.type = 'lowpass';
    this.radioFilter.frequency.setValueAtTime(950, this.ctx.currentTime);

    this.radioGain.connect(this.radioFilter);
    this.radioFilter.connect(this.masterGain);
  }

  cycleRadio() {
    if (!this.isInitialized) this.init();
    this.resume();

    this.radioMode = (this.radioMode + 1) % this.radioModesCount;
    this._applyRadioMode();
    return this.getRadioModeName();
  }

  getRadioModeName() {
    switch (this.radioMode) {
      case 0: return "RADIO MATI";
      case 1: return "FM 94.4 - MIDNIGHT SYNTH";
      case 2: return "FM 88.0 - EERIE AMBIENT";
      case 3: return "FM 106.3 - WHITE NOISE STATIC";
      default: return "OFF";
    }
  }

  _applyRadioMode() {
    const now = this.ctx.currentTime;
    this._stopRadioSynths();

    if (this.radioMode === 0) {
      this.radioGain.gain.linearRampToValueAtTime(0.0, now + 0.3);
      return;
    }

    this.radioGain.gain.linearRampToValueAtTime(0.32, now + 0.5);

    if (this.radioMode === 1) {
      const notes = [130.81, 155.56, 196.00, 293.66, 392.00]; // C minor 9th
      this.radioFilter.frequency.setValueAtTime(1300, now);

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, now);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.25 + idx * 0.1, now);
        lfoGain.gain.setValueAtTime(2.0, now);
        lfo.connect(osc.frequency);
        lfo.start();

        g.gain.setValueAtTime(0.06, now);
        osc.connect(g);
        g.connect(this.radioGain);
        osc.start();

        this.radioOscillators.push(osc, lfo);
      });
    } else if (this.radioMode === 2) {
      const notes = [65.41, 98.00, 146.83]; // Dark C2, G2, D3
      this.radioFilter.frequency.setValueAtTime(650, now);

      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.05, now);
        osc.connect(g);
        g.connect(this.radioGain);
        osc.start();
        this.radioOscillators.push(osc);
      });
    } else if (this.radioMode === 3) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      const staticSrc = this.ctx.createBufferSource();
      staticSrc.buffer = buffer;
      staticSrc.loop = true;
      this.radioFilter.frequency.setValueAtTime(2400, now);
      staticSrc.connect(this.radioGain);
      staticSrc.start();
      this.radioOscillators.push(staticSrc);
    }
  }

  _stopRadioSynths() {
    this.radioOscillators.forEach(osc => {
      try {
        if (osc.stop) osc.stop();
        if (osc.disconnect) osc.disconnect();
      } catch (e) {}
    });
    this.radioOscillators = [];
  }

  // ================= CRASH SOUND FX =================
  playCrash(intensity = 1.0) {
    if (!this.isInitialized) return;
    try {
      const now = this.ctx.currentTime;
      const crashOsc = this.ctx.createOscillator();
      const crashGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      crashOsc.type = 'triangle';
      crashOsc.frequency.setValueAtTime(140, now);
      crashOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      crashGain.gain.setValueAtTime(Math.min(0.65 * intensity, 0.85), now);
      crashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      crashOsc.connect(filter);
      filter.connect(crashGain);
      crashGain.connect(this.masterGain);

      crashOsc.start(now);
      crashOsc.stop(now + 0.4);
    } catch (e) {}
  }

  // ================= RUNTIME UPDATE =================
  update(speedKmh, throttle, brake, engineRpm = 1000) {
    if (!this.isInitialized || this.isMuted) return;

    const absSpeed = Math.abs(speedKmh);
    const speedNorm = Math.min(absSpeed / 200, 1.0);
    const rpmNorm = Math.min(Math.max((engineRpm - 800) / 6200, 0), 1.0);
    const now = this.ctx.currentTime;

    // 1. Engine sound based on dynamic RPM!
    // Idle 800 RPM -> ~38Hz, 6500 RPM -> ~150Hz
    const baseFreq = 36 + rpmNorm * 115 + (throttle ? 8 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.85, now, 0.05);
    this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);

    const targetFilterFreq = 200 + rpmNorm * 900 + (throttle ? 400 : 0);
    this.engineFilter.frequency.setTargetAtTime(targetFilterFreq, now, 0.08);

    const targetEngineVol = 0.12 + rpmNorm * 0.18 + (throttle ? 0.08 : 0);
    this.engineGain.gain.setTargetAtTime(targetEngineVol, now, 0.06);

    // 2. Road surface tire noise
    const targetRoadVol = Math.min(speedNorm * 0.32, 0.35);
    const targetRoadFilter = 110 + speedNorm * 750 + (brake ? 250 : 0);
    this.roadGain.gain.setTargetAtTime(targetRoadVol, now, 0.08);
    this.roadFilter.frequency.setTargetAtTime(targetRoadFilter, now, 0.08);

    // 3. Highway aerodynamic wind noise (Realistic turbulence buffeting)
    const windFactor = Math.max(0, (absSpeed - 35) / 150);
    const targetWindVol = Math.pow(windFactor, 1.6) * 0.42;
    const targetWindFreq = 280 + windFactor * 550;
    this.windGain.gain.setTargetAtTime(targetWindVol, now, 0.12);
    this.windFilter.frequency.setTargetAtTime(targetWindFreq, now, 0.12);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return !this.isMuted;
  }
}
