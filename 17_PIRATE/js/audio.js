// Sintesis Audio Prosedural menggunakan Web Audio API
// Tidak memerlukan file audio eksternal, langsung berbunyi di browser!

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.musicMuted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.masterGain);

    this.startAmbientSea();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Suara Meriam ---
  playCannon() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Ledakan frekuensi rendah
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.6);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.85);

    // Derau ledakan (noise blast)
    this.playNoiseBlast(0.9, 0.7);
  }

  // --- Suara Ledakan & Pecahan Kayu (Kena Kapal) ---
  playHitWood() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Dentuman
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);

    // Patah kayu tajam
    this.playNoiseCrack(0.35);
  }

  // --- Cipratan Air Meriam Jatuh ke Laut ---
  playSplash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bSize = this.ctx.sampleRate * 0.5;
    const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const data = b.getChannelData(0);
    for (let i = 0; i < bSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.25));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = b;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(280, t + 0.5);
    filter.Q.value = 1.2;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.65, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
  }

  // --- Menambal Kayu (Palu) ---
  playHammer() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);

    this.playNoiseCrack(0.09);
  }

  // --- Gali Sekop di Pasir ---
  playShovel() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bSize = Math.floor(this.ctx.sampleRate * 0.25);
    const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bSize);

    const src = this.ctx.createBufferSource();
    src.buffer = b;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
  }

  // --- Dentang Koin Emas / Penjualan ---
  playCoin() {
    if (!this.ctx) return;
    const notes = [987.77, 1318.51, 1567.98, 1975.53];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      g.gain.setValueAtTime(0.4, t + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.45);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.5);
    });
  }

  // --- Bel atau Kemenangan Pelabuhan / Harta Ditemukan ---
  playDiscovery() {
    if (!this.ctx) return;
    const chords = [523.25, 659.25, 783.99, 1046.50];
    const t = this.ctx.currentTime;
    chords.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.6);
    });
  }

  // --- Rantai Jangkar ---
  playAnchor() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120 + i * 25, t + i * 0.12);

      g.gain.setValueAtTime(0.2, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.1);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.11);
    }
  }

  // --- Derit Kayu Kapal (Creak) ---
  playWoodCreak() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.3);
    osc.frequency.linearRampToValueAtTime(95, t + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    g.gain.setValueAtTime(0.01, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.2);
    g.gain.linearRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  // --- Helper Noise ---
  playNoiseBlast(duration, vol) {
    const bSize = Math.floor(this.ctx.sampleRate * duration);
    const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bSize, 2);

    const src = this.ctx.createBufferSource();
    src.buffer = b;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  playNoiseCrack(duration) {
    const bSize = Math.floor(this.ctx.sampleRate * duration);
    const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1);

    const src = this.ctx.createBufferSource();
    src.buffer = b;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3.0;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  // --- Ombak Laut Latar Belakang (Ambient) ---
  startAmbientSea() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;

    // LFO untuk desau ombak yang naik turun
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.18; // siklus ombak ~5.5 detik
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const seaGain = this.ctx.createGain();
    seaGain.gain.value = 0.22;

    whiteNoise.connect(filter);
    filter.connect(seaGain);
    seaGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
  }

  // --- Musik Laut / Sea Shanty Akordeon Prosedural ---
  toggleMusic() {
    if (!this.ctx) return;
    this.musicMuted = !this.musicMuted;
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicMuted ? 0 : 0.32;
    }
    return !this.musicMuted;
  }

  startShanty() {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;

    // Melodi Sea Shanty gaya Hurdy-Gurdy / Akordeon Bajak Laut
    // Nada (Hz): D dorian / Aeolian khas bajak laut
    const melody = [
      { note: 293.66, dur: 0.35 }, // D4
      { note: 329.63, dur: 0.35 }, // E4
      { note: 349.23, dur: 0.7 },  // F4
      { note: 293.66, dur: 0.35 }, // D4
      { note: 349.23, dur: 0.35 }, // F4
      { note: 392.00, dur: 0.35 }, // G4
      { note: 440.00, dur: 0.9 },  // A4
      { note: 392.00, dur: 0.35 }, // G4
      { note: 349.23, dur: 0.35 }, // F4
      { note: 329.63, dur: 0.35 }, // E4
      { note: 293.66, dur: 0.9 },  // D4
      { note: 261.63, dur: 0.35 }, // C4
      { note: 293.66, dur: 1.2 },  // D4
    ];

    let noteIdx = 0;
    const playNext = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const step = melody[noteIdx % melody.length];
      const t = this.ctx.currentTime;

      // Accordion timbre: 2 detuned saw oscillators
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      o1.type = 'sawtooth';
      o2.type = 'triangle';
      o1.frequency.setValueAtTime(step.note, t);
      o2.frequency.setValueAtTime(step.note * 0.996, t);

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1100;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.25, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + step.dur * 0.95);

      o1.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.musicGain);

      o1.start(t);
      o2.start(t);
      o1.stop(t + step.dur);
      o2.stop(t + step.dur);

      noteIdx++;
      this.musicTimer = setTimeout(playNext, step.dur * 1000);
    };

    playNext();
  }
}

export const audio = new SoundSystem();
