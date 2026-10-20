// ============================================================================
// PROJECT SKYLINE // PROCEDURAL RETRO SYNTH & AVIONICS AUDIO ENGINE
// Pure Web Audio API (Zero external MP3/WAV dependencies)
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.initialized = false;
    this.bgmEnabled = true;
    this.bgmPlaying = false;

    // Continuous Engine Nodes
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Timers for avionics tones
    this.lastSeekBeep = 0;
    this.lastLockBeep = 0;
    this.lastAlertBeep = 0;
    this.lastGunSound = 0;

    // BGM Sequencer state
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.85;
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.32;
    this.bgmGain.connect(this.masterGain);

    // Create white noise buffer for explosions, flares, and jet turbine
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.setupJetEngineSound();
    this.initialized = true;
  }

  setupJetEngineSound() {
    if (!this.ctx) return;

    // Turbine hum + filtered noise
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;
    this.engineGain.connect(this.sfxGain);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 180;
    this.engineFilter.connect(this.engineGain);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    this.engineOsc.connect(this.engineFilter);
    this.engineOsc.start();

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.value = 110;
    this.engineSubOsc.connect(this.engineFilter);
    this.engineSubOsc.start();
  }

  updateEngine(throttle, activeFlight) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (!activeFlight) {
      this.engineGain.gain.setTargetAtTime(0.0, now, 0.1);
      return;
    }

    // Throttle ranges 0.2 to 1.5 (afterburner)
    const norm = Math.max(0, Math.min(1.5, throttle));
    const targetFreq = 48 + norm * 55;
    const targetFilter = 140 + norm * 360;
    const targetVol = 0.05 + norm * 0.065;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 1.98, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.08);
  }

  // Ace Combat style Lock-On Seeking Beep (slow pulse)
  playSeekTone() {
    if (!this.initialized) return;
    const now = performance.now();
    if (now - this.lastSeekBeep < 240) return;
    this.lastSeekBeep = now;

    this.tone(980, 0.055, 'square', 0.11);
  }

  // Ace Combat style Solid Lock-On Tone (rapid high urgency pulse)
  playLockTone() {
    if (!this.initialized) return;
    const now = performance.now();
    if (now - this.lastLockBeep < 85) return;
    this.lastLockBeep = now;

    this.tone(1480, 0.045, 'square', 0.15);
  }

  // Incoming Enemy Missile Warning Siren
  playMissileAlert() {
    if (!this.initialized) return;
    const now = performance.now();
    if (now - this.lastAlertBeep < 190) return;
    this.lastAlertBeep = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(740, t);
    osc.frequency.linearRampToValueAtTime(1120, t + 0.08);
    osc.frequency.linearRampToValueAtTime(680, t + 0.15);

    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.005, t + 0.16);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 20mm Vulcan Cannon Burst
  playGunShot() {
    if (!this.initialized) return;
    const now = performance.now();
    if (now - this.lastGunSound < 55) return;
    this.lastGunSound = now;

    const t = this.ctx.currentTime;
    // Short punchy noise + low pulse
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950 + Math.random() * 250, t);
    filter.Q.value = 1.8;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.24, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.045);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);

    noise.start(t, Math.random() * 1.2, 0.05);
  }

  // Missile Launch Whoosh ("FOX TWO!")
  playMissileLaunch(isSpecial = false) {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isSpecial ? 1600 : 1200, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.42);
    filter.Q.value = 1.2;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.38, t);
    g.gain.exponentialRampToValueAtTime(0.008, t + 0.44);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(t, 0, 0.45);

    // Ignition chirp
    this.tone(isSpecial ? 660 : 520, 0.1, 'sawtooth', 0.15, 180);
  }

  // Explosion Crunch
  playExplosion(large = false) {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const dur = large ? 0.95 : 0.55;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(large ? 620 : 800, t);
    filter.frequency.exponentialRampToValueAtTime(65, t + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(large ? 0.65 : 0.42, t);
    g.gain.exponentialRampToValueAtTime(0.008, t + dur);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(t, 0, dur);

    // Sub boom
    this.tone(large ? 95 : 130, dur * 0.7, 'sine', 0.4, 28);
  }

  // Hit Confirmation Ping
  playHitMarker() {
    if (!this.initialized) return;
    this.tone(1750, 0.04, 'triangle', 0.16, 2100);
  }

  // Countermeasure Flare Eject
  playFlare() {
    if (!this.initialized) return;
    this.tone(1320, 0.09, 'sine', 0.18, 440);
  }

  // AWACS Radio Static Chirp
  playRadioChirp() {
    if (!this.initialized) return;
    this.tone(1950, 0.035, 'square', 0.09);
    setTimeout(() => this.tone(1420, 0.045, 'square', 0.09), 42);
  }

  // UI Button Click
  playUIClick() {
    this.init();
    if (!this.initialized) return;
    this.tone(1100, 0.035, 'square', 0.12, 1550);
  }

  tone(freq, duration, type = 'square', vol = 0.15, endFreq = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
    }
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.004, t + duration);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  // ==========================================================================
  // PROCEDURAL SYNTHWAVE / ACE COMBAT CHIPTUNE BGM SEQUENCER
  // ==========================================================================
  startBGM() {
    this.init();
    if (!this.initialized || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // 136 BPM -> 16th note = ~110ms
    const stepMs = 112;
    const bassProgression = [
      // E minor -> C major -> D major -> B minor heroic progression
      82.41, 82.41, 164.81, 82.41,  82.41, 82.41, 164.81, 82.41,
      65.41, 65.41, 130.81, 65.41,  65.41, 65.41, 130.81, 65.41,
      73.42, 73.42, 146.83, 73.42,  73.42, 73.42, 146.83, 73.42,
      61.74, 61.74, 123.47, 61.74,  73.42, 73.42, 98.00,  123.47
    ];

    const arpNotes = [
      329.63, 392.00, 493.88, 659.25,
      329.63, 392.00, 587.33, 493.88,
      261.63, 329.63, 392.00, 523.25,
      261.63, 329.63, 493.88, 392.00,
      293.66, 369.99, 440.00, 587.33,
      293.66, 369.99, 587.33, 440.00,
      246.94, 329.63, 392.00, 493.88,
      293.66, 369.99, 440.00, 587.33
    ];

    const leadMelody = [
      659.25, 0, 0, 587.33, 493.88, 0, 392.00, 0,
      493.88, 0, 587.33, 0, 659.25, 0, 0, 0,
      523.25, 0, 0, 493.88, 392.00, 0, 329.63, 0,
      587.33, 0, 659.25, 0, 783.99, 0, 587.33, 0
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;

      const idx = this.bgmStep % 32;
      const t = this.ctx.currentTime;

      // 1. Driving Synth Bass
      const bassFreq = bassProgression[idx];
      if (bassFreq) {
        this.bgmNote(bassFreq, 0.095, 'sawtooth', 0.22, 480);
      }

      // 2. Tactical Arpeggio
      const arpFreq = arpNotes[idx];
      if (arpFreq) {
        this.bgmNote(arpFreq, 0.075, 'square', 0.08, 1800);
      }

      // 3. Heroic Lead Synth (plays every 2nd bar cycle)
      const leadFreq = leadMelody[idx];
      if (leadFreq > 0 && Math.floor(this.bgmStep / 32) % 2 === 1) {
        this.bgmNote(leadFreq, 0.2, 'sawtooth', 0.12, 2400);
      }

      // 4. Kick / Snare pulse
      if (idx % 4 === 0) {
        this.bgmNote(110, 0.08, 'sine', 0.28, 35, true);
      } else if (idx % 8 === 4) {
        this.bgmHat(0.065, 0.12);
      } else if (idx % 2 === 1) {
        this.bgmHat(0.025, 0.04);
      }

      this.bgmStep++;
    }, stepMs);
  }

  bgmNote(freq, dur, type, vol, filterCutoff = 1200, pitchDrop = false) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (pitchDrop) {
      osc.frequency.exponentialRampToValueAtTime(32, t + dur);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, t);

    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.005, t + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  bgmHat(dur, vol) {
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3500;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.005, t + dur);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.bgmGain);
    noise.start(t, 0, dur);
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled && !this.bgmPlaying) {
      this.startBGM();
    }
    return this.bgmEnabled;
  }
}

window.soundEngine = new SoundEngine();
