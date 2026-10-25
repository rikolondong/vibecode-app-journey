// ============================================================================
// PANTURA: MUDIK ODYSSEY — PROCEDURAL WEB AUDIO ENGINE
// Engine Sound, Telolet Basuri Horn, Radio Pantura FM & UI Sound Effects
// ============================================================================

export class PanturaAudio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.radioStationIndex = 0; // 0: Koplo FM, 1: Senja Indie, 2: Takbir/Info FM, 3: Mati
    this.radioNames = ['Koplo FM', 'Indie Senja', 'Gema Lebaran', 'Mati'];
    this.radioInterval = null;
    this.stepCounter = 0;
    this.teloletToggle = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Subtle low-pass filtered engine hum
      this.engineOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 48;

      filter.type = 'lowpass';
      filter.frequency.value = 140;

      this.engineGain.gain.value = 0.025;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.initialized = true;
      this.startRadioLoop();
    } catch (_e) {
      // Ignore audio block if browser restricts autoplay before interaction
    }
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateEngine(speedKmh, isPaused) {
    if (!this.initialized || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    if (isPaused) {
      this.engineGain.gain.setTargetAtTime(0.006, now, 0.15);
      this.engineOsc.frequency.setTargetAtTime(40, now, 0.15);
      return;
    }
    const targetFreq = 42 + (speedKmh * 0.52);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.engineGain.gain.setTargetAtTime(0.028, now, 0.1);
  }

  cycleRadio() {
    this.resume();
    this.radioStationIndex = (this.radioStationIndex + 1) % this.radioNames.length;
    this.playClick();
    return this.radioNames[this.radioStationIndex];
  }

  startRadioLoop() {
    if (this.radioInterval) clearInterval(this.radioInterval);
    // Pelog / Sunda / Koplo & Indie road-trip note scales
    const koploNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];
    const indieNotes = [220.00, 277.18, 329.63, 415.30, 369.99, 329.63, 277.18, 246.94];
    const lebaranNotes = [261.63, 329.63, 392.00, 415.30, 392.00, 329.63, 293.66, 261.63];

    this.radioInterval = setInterval(() => {
      if (!this.initialized || !this.ctx || this.ctx.state !== 'running') return;
      if (this.radioStationIndex === 3) return; // Radio OFF

      const idx = this.stepCounter % 8;
      this.stepCounter++;

      let freq = 261.63;
      let wave = 'triangle';
      let duration = 0.24;

      if (this.radioStationIndex === 0) {
        freq = koploNotes[idx];
        wave = 'triangle';
        duration = 0.18;
      } else if (this.radioStationIndex === 1) {
        freq = indieNotes[idx];
        wave = 'sine';
        duration = 0.35;
      } else if (this.radioStationIndex === 2) {
        freq = lebaranNotes[idx];
        wave = 'sine';
        duration = 0.3;
      }

      this.playTone(freq, duration, wave, 0.018);
    }, 380);
  }

  playTone(freq, duration = 0.15, type = 'sine', volume = 0.06, delay = 0) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playHorn() {
    this.resume();
    this.teloletToggle = !this.teloletToggle;
    if (this.teloletToggle) {
      // Fun Telolet Basuri 6-note riff!
      const notes = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.50];
      notes.forEach((n, i) => {
        this.playTone(n, 0.12, 'square', 0.045, i * 0.11);
      });
    } else {
      // Dual-tone MPV family car horn
      this.playTone(415, 0.25, 'sawtooth', 0.04, 0);
      this.playTone(510, 0.25, 'sawtooth', 0.04, 0);
    }
  }

  playClick() {
    this.resume();
    this.playTone(620, 0.06, 'triangle', 0.04, 0);
  }

  playItemUse() {
    this.resume();
    this.playTone(523.25, 0.1, 'sine', 0.05, 0);
    this.playTone(659.25, 0.12, 'sine', 0.05, 0.09);
    this.playTone(783.99, 0.18, 'sine', 0.05, 0.18);
  }

  playEventAlert() {
    this.resume();
    this.playTone(440, 0.12, 'triangle', 0.055, 0);
    this.playTone(554.37, 0.18, 'triangle', 0.055, 0.12);
  }

  playPotholeHit() {
    this.resume();
    this.playTone(85, 0.22, 'sawtooth', 0.08, 0);
    this.playTone(62, 0.25, 'square', 0.06, 0.04);
  }

  playCheckpointReached() {
    this.resume();
    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((n, i) => {
      this.playTone(n, 0.22, 'triangle', 0.05, i * 0.09);
    });
  }
}
