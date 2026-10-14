// Procedural Web Audio API Sound System
class MountainAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.musicVolume = 0.25;
    this.sfxVolume = 0.4;
    this.musicInterval = null;
    this.windNode = null;
    this.windGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;
      this.startWindAmbient();
      this.startAmbientMusic();
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.windGain) {
      this.windGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05 * this.sfxVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  toggleMusic() {
    this.ensureContext();
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }

  // --- SOUND EFFECTS ---

  playStep() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // White noise gravel crunch
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playPole() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

      gain.gain.setValueAtTime(0.06 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }

  playChatPop() {
    this.ensureContext();
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playTap() {
    this.ensureContext();
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playCoin() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.07); // E6
      osc2.frequency.setValueAtTime(1975.53, now); // B6
      osc2.frequency.setValueAtTime(2637.02, now + 0.07); // E7

      gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch (e) {}
  }

  playUpgrade() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch (e) {}
  }

  playFanfare() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const melody = [
        { f: 523.25, d: 0.15, t: 0 },
        { f: 659.25, d: 0.15, t: 0.15 },
        { f: 783.99, d: 0.15, t: 0.3 },
        { f: 1046.50, d: 0.35, t: 0.45 },
        { f: 880.00, d: 0.15, t: 0.8 },
        { f: 1046.50, d: 0.5, t: 0.95 }
      ];
      melody.forEach(n => {
        const now = this.ctx.currentTime + n.t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, now);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + n.d + 0.05);
      });
    } catch (e) {}
  }

  playCamera() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Shutter click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  playCooking() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playBirdChirp() {
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2800, now);
      osc.frequency.exponentialRampToValueAtTime(3600, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.12);

      gain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // --- AMBIENT SOUNDS ---

  startWindAmbient() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise approx
        lastOut = data[i];
      }

      this.windNode = this.ctx.createBufferSource();
      this.windNode.buffer = buffer;
      this.windNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(this.isMuted ? 0 : 0.03 * this.sfxVolume, this.ctx.currentTime);

      this.windNode.connect(filter);
      filter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);
      this.windNode.start();
    } catch (e) {}
  }

  // Procedural relaxing mountain acoustic background music
  startAmbientMusic() {
    if (this.musicInterval) clearInterval(this.musicInterval);
    // Pentatonic scale suited for calm nature vibes: D major pentatonic / Pelog-inspired calming tones
    const scale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99]; // D4, E4, F#4, A4, B4, D5, E5, F#5
    let step = 0;

    const chords = [
      [293.66, 440.00, 587.33], // D chord
      [369.99, 440.00, 739.99], // F#m / D
      [329.63, 493.88, 659.25], // Em
      [440.00, 587.33, 739.99]  // A chord
    ];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.musicEnabled) return;
      if (this.ctx.state === 'suspended') return;

      const currentChord = chords[Math.floor(step / 4) % chords.length];
      const randomNote = currentChord[step % currentChord.length];
      const extraRandom = Math.random() > 0.4 ? scale[Math.floor(Math.random() * scale.length)] : null;

      this.playKalimbaNote(randomNote, 0.6);
      if (extraRandom && Math.random() > 0.6) {
        setTimeout(() => {
          this.playKalimbaNote(extraRandom, 0.4);
        }, 300);
      }

      // Random bird chirp in mountain ambient
      if (Math.random() < 0.15) {
        setTimeout(() => this.playBirdChirp(), 400);
      }

      step++;
    }, 900);
  }

  playKalimbaNote(freq, duration) {
    if (!this.ctx || this.isMuted || !this.musicEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const vol = 0.08 * this.musicVolume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {}
  }
}

const mountainAudio = new MountainAudio();
