import * as THREE from './libs/three.module.js';
import { PlayerCar } from './car.js';
import { HighwayWorld } from './world.js';
import { CarAudioEngine } from './audio.js';

/**
 * JALAN TOL KELAM - Main Game Application (Ultra-Realistic Edition)
 */

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // Clock
    this.clock = new THREE.Clock();
    this.startTime = Date.now();
    this.distanceTraveled = 0; // meters

    // Camera Modes: 'chase', 'cockpit', 'hood'
    this.cameraMode = 'chase';
    this.targetCameraPos = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();

    // Atmosphere & Fog Configuration (Bright, clear midnight highway)
    this.fogColor = 0x121a2c; // Slate midnight blue - visibly brighter and atmospheric
    this.fogDensity = 0.009;

    // Input state
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false
    };

    // Subsystems
    this.audio = new CarAudioEngine();
    this.isAudioStarted = false;
    this.isRaining = false;

    // Notifications
    this.toastTimer = null;

    this._initThree();
    this._initWorld();
    this._initPlayer();
    this._initInput();
    this._initUI();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  _initThree() {
    // 1. Scene with Deep Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.fogColor);
    this.scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      900
    );
    this.camera.position.set(0, 2.5, -6.5);

    // 3. High Performance Renderer (Optimized for 60+ FPS silky smooth gameplay)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.65;
    this.renderer.shadowMap.enabled = false; // Disabled dynamic shadows for 60+ FPS smooth rendering

    this.container.appendChild(this.renderer.domElement);

    // 4. Dynamic Environment Ambient & Moonlight (Bright & atmospheric)
    this.ambientLight = new THREE.AmbientLight(0x354b6c, 1.15);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0x5a7ca8, 0.85);
    this.moonLight.position.set(120, 180, 80);
    this.scene.add(this.moonLight);

    // Resize listener
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _initWorld() {
    this.world = new HighwayWorld(this.scene);
  }

  _initPlayer() {
    this.player = new PlayerCar(this.scene);
    this.player.group.name = 'player';
  }

  setEnvironmentBrightness(factor) {
    // Dynamic real-time environment lighting control (from 0.2 to 2.5)
    if (this.ambientLight) {
      this.ambientLight.intensity = 1.15 * factor;
    }
    if (this.moonLight) {
      this.moonLight.intensity = 0.85 * factor;
    }
    if (this.renderer) {
      this.renderer.toneMappingExposure = 1.0 + 0.65 * factor;
    }
  }

  _initInput() {
    const handleKey = (e, isDown) => {
      if (!this.isAudioStarted) {
        this.audio.init();
        this.audio.resume();
        this.isAudioStarted = true;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.up = isDown;
          e.preventDefault();
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.down = isDown;
          e.preventDefault();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = isDown;
          e.preventDefault();
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = isDown;
          e.preventDefault();
          break;
        case 'Space':
          this.keys.space = isDown;
          e.preventDefault();
          break;
        case 'KeyC':
          if (isDown) this.cycleCamera();
          break;
        case 'KeyL':
        case 'KeyF':
          if (isDown) {
            const name = this.player.cycleHeadlights();
            this.showToast(name);
          }
          break;
        case 'KeyH':
          this.audio.setHorn(isDown);
          break;
        case 'KeyP':
        case 'KeyM':
          if (isDown) this.toggleRain();
          break;
      }
    };

    window.addEventListener('keydown', e => handleKey(e, true));
    window.addEventListener('keyup', e => handleKey(e, false));
  }

  _initUI() {
    this.speedElem = document.getElementById('speed-value');
    this.speedBar = document.getElementById('speed-bar');
    this.gearElem = document.getElementById('gear-value');
    this.rpmElem = document.getElementById('rpm-value');
    this.distanceElem = document.getElementById('distance-value');
    this.timeElem = document.getElementById('time-value');
    this.toastElem = document.getElementById('toast');
    this.cameraBtn = document.getElementById('btn-camera');
    this.lightBtn = document.getElementById('btn-light');
    this.rainBtn = document.getElementById('btn-rain');
    this.hornBtn = document.getElementById('btn-horn');
    this.fogSlider = document.getElementById('fog-slider');

    this.cameraBtn?.addEventListener('click', () => this.cycleCamera());

    this.lightBtn?.addEventListener('click', () => {
      this._ensureAudio();
      const name = this.player.cycleHeadlights();
      this.showToast(name);
    });

    this.rainBtn?.addEventListener('click', () => {
      this._ensureAudio();
      this.toggleRain();
    });

    const startHorn = (e) => {
      e.preventDefault();
      this._ensureAudio();
      this.audio.setHorn(true);
    };
    const stopHorn = (e) => {
      e.preventDefault();
      this.audio.setHorn(false);
    };

    this.hornBtn?.addEventListener('mousedown', startHorn);
    this.hornBtn?.addEventListener('mouseup', stopHorn);
    this.hornBtn?.addEventListener('touchstart', startHorn);
    this.hornBtn?.addEventListener('touchend', stopHorn);

    if (this.fogSlider) {
      this.fogSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.fogDensity = val;
        this.scene.fog.density = val;
      });
    }

    this.ambientSlider = document.getElementById('ambient-slider');
    if (this.ambientSlider) {
      this.ambientSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.setEnvironmentBrightness(val);
      });
    }

    this._initTouchControls();

    // Start prompt overlay dismiss
    const startPrompt = document.getElementById('start-prompt');
    const startBtn = document.querySelector('.prompt-action-btn');
    if (startPrompt) {
      const dismiss = (e) => {
        if (e) e.stopPropagation();
        this._ensureAudio();
        startPrompt.style.pointerEvents = 'none';
        startPrompt.style.opacity = '0';
        setTimeout(() => { startPrompt.style.display = 'none'; }, 400);
      };
      startPrompt.addEventListener('click', dismiss);
      startPrompt.addEventListener('touchstart', dismiss);
      if (startBtn) {
        startBtn.addEventListener('click', dismiss);
        startBtn.addEventListener('touchstart', dismiss);
      }
      window.addEventListener('keydown', dismiss, { once: true });
    }
  }

  _initTouchControls() {
    const bindBtn = (id, keyName) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const press = (e) => {
        e.preventDefault();
        this._ensureAudio();
        this.keys[keyName] = true;
      };
      const release = (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
      };

      btn.addEventListener('touchstart', press);
      btn.addEventListener('touchend', release);
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    };

    bindBtn('touch-gas', 'up');
    bindBtn('touch-brake', 'down');
    bindBtn('touch-left', 'left');
    bindBtn('touch-right', 'right');
  }

  _ensureAudio() {
    if (!this.isAudioStarted) {
      this.audio.init();
      this.audio.resume();
      this.isAudioStarted = true;
    }
  }

  cycleCamera() {
    if (this.cameraMode === 'chase') {
      this.cameraMode = 'cockpit';
      this.showToast("KAMERA: KABIN PENGEMUDI (FIRST-PERSON)");
    } else if (this.cameraMode === 'cockpit') {
      this.cameraMode = 'hood';
      this.showToast("KAMERA: KAP MESIN (HOOD)");
    } else {
      this.cameraMode = 'chase';
      this.showToast("KAMERA: BELAKANG MOBIL (CHASE CAM)");
    }
    if (this.cameraBtn) {
      this.cameraBtn.innerText = `🎥 ${this.cameraMode.toUpperCase()}`;
    }
  }

  toggleRain() {
    this.isRaining = !this.isRaining;
    this.world.setRain(this.isRaining);
    this.audio.setRain(this.isRaining);
    this.player.setWiper(this.isRaining);
    this.showToast(this.isRaining ? "HUJAN: MENYALA (WIPER AKTIF)" : "HUJAN: MATI");
    if (this.rainBtn) {
      this.rainBtn.classList.toggle('active', this.isRaining);
    }
  }

  showToast(text) {
    if (!this.toastElem) return;
    this.toastElem.innerText = text;
    this.toastElem.style.opacity = '1';

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastElem.style.opacity = '0';
    }, 2200);
  }

  _updateCamera(dt, speedKmh) {
    // Dynamic FOV expands at high speeds for realistic sensation
    const targetFov = this.cameraMode === 'chase' ? (65 + Math.min(speedKmh / 210, 1.0) * 18) : 74;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.08);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'cockpit') {
      const camPos = this.player.getCockpitCameraPosition();
      this.camera.position.copy(camPos);

      // Realistic driver look-ahead into the corner (Left for Left, Right for Right)
      this.targetLookAt.set(
        this.player.position.x + this.player.steerAngle * 4.5,
        this.player.position.y + 1.05,
        this.player.position.z + 45
      );
      this.camera.lookAt(this.targetLookAt);
    } else if (this.cameraMode === 'hood') {
      const hoodPos = this.player.getHoodCameraPosition();
      this.camera.position.copy(hoodPos);
      this.targetLookAt.set(
        this.player.position.x + this.player.steerAngle * 2.5,
        this.player.position.y + 0.85,
        this.player.position.z + 35
      );
      this.camera.lookAt(this.targetLookAt);
    } else {
      const chasePos = this.player.getChaseCameraPosition();
      // Silky-smooth camera tracking: lock Z directly to car to eliminate stutter, lerp X & Y smoothly
      const lerpDampX = Math.min(10.0 * dt, 1.0);
      const lerpDampY = Math.min(12.0 * dt, 1.0);
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, chasePos.x, lerpDampX);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, chasePos.y, lerpDampY);
      this.camera.position.z = chasePos.z;

      this.targetLookAt.set(
        this.player.position.x * 0.4 + this.player.steerAngle * 2.0,
        this.player.position.y + 1.25,
        this.player.position.z + 24
      );
      this.camera.lookAt(this.targetLookAt);
    }
  }

  _updateHUD(result) {
    const { speedKmh, rpm, gear } = result;

    if (this.speedElem) {
      this.speedElem.innerText = speedKmh;
    }
    if (this.speedBar) {
      const pct = Math.min((speedKmh / 210) * 100, 100);
      this.speedBar.style.width = `${pct}%`;
    }
    if (this.gearElem) {
      this.gearElem.innerText = result.velocity < -0.1 ? 'R' : `D${gear}`;
    }
    if (this.rpmElem) {
      this.rpmElem.innerText = `${rpm} RPM`;
    }
    if (this.distanceElem) {
      const km = (this.distanceTraveled / 1000).toFixed(2);
      this.distanceElem.innerText = `${km} KM`;
    }
    if (this.timeElem) {
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      const mins = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
      const secs = (elapsedSec % 60).toString().padStart(2, '0');
      this.timeElem.innerText = `${mins}:${secs}`;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Delta time clamped between 1ms and 50ms for buttery-smooth 60-144 FPS
    const dt = Math.min(Math.max(this.clock.getDelta(), 0.001), 0.05);

    // 1. Update Player Car
    const playerResult = this.player.update(dt, this.keys);
    const speedKmh = playerResult.speedKmh;

    // Guardrail Scrape Sound
    this.audio.setGuardrailScrape(playerResult.isScraping);

    // Road Expansion Joint Thump Sound
    if (playerResult.passedJoint) {
      const speedRatio = Math.min(playerResult.velocity / this.player.maxSpeed, 1.0);
      this.audio.playRoadJointThump(speedRatio);
    }

    if (playerResult.hitGuardrail && !playerResult.isScraping) {
      this.audio.playCrash(0.35);
    }

    // Accumulate total distance traveled (movement is integrated smoothly in playerCar)
    if (playerResult.velocity > 0) {
      this.distanceTraveled += playerResult.velocity * dt;
    }

    // 2. Update Highway World & Recycle segments
    this.world.update(dt, this.player.position);

    // 3. Update Camera
    this._updateCamera(dt, speedKmh);

    // 6. Update Audio with dynamic Engine RPM
    this.audio.update(
      speedKmh,
      this.keys.up,
      this.keys.down || this.keys.space,
      playerResult.rpm
    );

    // 7. Update HUD
    this._updateHUD(playerResult);

    // 8. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
