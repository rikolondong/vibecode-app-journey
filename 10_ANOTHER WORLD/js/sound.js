// Audio System for DUNIA LAIN - UJI NYALI (Web Audio API Synthesizer & Sound FX)
class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.ambientGain = null;
        this.staticGain = null;
        this.heartbeatInterval = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.initialized = true;

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Start constant low ambient hum
        this.startAmbientDrone();
    }

    startAmbientDrone() {
        if (!this.ctx) return;
        
        // Deep sub-bass drone (35Hz & 42Hz detuned)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        this.ambientGain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(36, this.ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(38.5, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, this.ctx.currentTime);

        this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);

        osc1.start();
        osc2.start();

        // Add subtle low frequency rumble pulse
        this.startEerieRumble();
    }

    startEerieRumble() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(80, this.ctx.currentTime);
        filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        whiteNoise.start();
    }

    // CCTV Camera Switch Sound (Beep & Static click)
    playCameraSwitch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // High click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);

        // Static burst
        this.playStaticBurst(0.12, 0.2);
    }

    // Static burst for camera glitches / paranormal events
    playStaticBurst(duration = 0.2, volume = 0.3) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(1.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        whiteNoise.start(now);
    }

    // Heavy iron rolling door slam
    playDoorSlam(closing = true) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Thud low frequency
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(closing ? 130 : 90, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.45);

        // Metallic screech / friction
        const screech = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        screech.type = 'sawtooth';
        screech.frequency.setValueAtTime(closing ? 450 : 320, now);
        screech.frequency.exponentialRampToValueAtTime(closing ? 80 : 180, now + 0.3);

        sGain.gain.setValueAtTime(0.2, now);
        sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        screech.connect(sGain);
        sGain.connect(this.masterGain);
        screech.start(now);
        screech.stop(now + 0.35);
    }

    // Spotlight switch click & electrical hum
    playLightSwitch(on = true) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(on ? 1200 : 800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.05);

        if (on) {
            // Short 60Hz transformer hum burst
            const hum = this.ctx.createOscillator();
            const humGain = this.ctx.createGain();
            hum.type = 'sawtooth';
            hum.frequency.setValueAtTime(60, now);
            humGain.gain.setValueAtTime(0.15, now);
            humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            hum.connect(humGain);
            humGain.connect(this.masterGain);
            hum.start(now);
            hum.stop(now + 0.2);
        }
    }

    // Authentic Javanese Gamelan / Gong Stinger for Paranormal Creepiness
    playGamelanStinger() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Traditional Slendro / Pelog dissonant chime
        const freqs = [185, 277.18, 370, 415.3, 554.37]; 
        
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            // Slight detune for metallic resonance
            osc.frequency.setValueAtTime(freq + (Math.random() * 4 - 2), now);

            const attack = 0.02;
            const decay = 2.5 + idx * 0.4;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + decay);
        });
    }

    // Kuntilanak Laugh / Eerie Melodic Glissando
    playKuntiAudioCue() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Tremolo high eerie whistling pitch
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1350, now + 0.4);
        osc.frequency.linearRampToValueAtTime(700, now + 0.9);
        osc.frequency.linearRampToValueAtTime(1100, now + 1.4);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(7, now); // vibrato
        lfoGain.gain.setValueAtTime(45, now);

        lfo.connect(osc.frequency);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc.connect(gain);
        gain.connect(this.masterGain);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 2.0);
        osc.stop(now + 2.0);
    }

    // Pocong Thump / Heavy Hop Footstep
    playPocongHop() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Genderuwo Heavy Breathing & Growl
    playGenderuwoGrowl() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.linearRampToValueAtTime(40, now + 1.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.linearRampToValueAtTime(90, now + 1.5);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 2.0);
    }

    // Walkie Talkie Radio Beep & Static Cue ("Kru... siaga!")
    playWalkieTalkie() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Double mic squelch roger beep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.001, now + 0.07);
        gain.gain.setValueAtTime(0.2, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.18);

        // Followed by slight radio static
        setTimeout(() => this.playStaticBurst(0.15, 0.15), 180);
    }

    // Heartbeat Sound (Speeds up when threat is at the door)
    playHeartbeat() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Lub-Dub
        [0, 0.12].forEach((offset, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(idx === 0 ? 65 : 55, now + offset);
            osc.frequency.exponentialRampToValueAtTime(25, now + offset + 0.12);

            gain.gain.setValueAtTime(0.4, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.16);
        });
    }

    // Terrifying Jump Scare Stinger
    playJumpScare() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Multiple dissonant screaming oscillators
        const pitches = [180, 240, 310, 480, 720, 990, 1420];
        pitches.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = Math.random() > 0.5 ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * (1.2 + Math.random() * 0.4), now + 0.8);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.2);
        });

        // Massive noise impact
        this.playStaticBurst(0.9, 0.8);
    }

    // 06:00 Subuh / Azan Morning Bell for Victory
    playVictoryChime() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.4);

            gain.gain.setValueAtTime(0.001, now + idx * 0.4);
            gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.4 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.4 + 2.0);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.4);
            osc.stop(now + idx * 0.4 + 2.0);
        });
    }
}

window.audioMgr = new AudioManager();
