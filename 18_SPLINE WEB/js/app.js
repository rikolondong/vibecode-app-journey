/**
 * BMW M 3D Showcase - Main Application Entrypoint
 * Orchestrates Three.js 3D scene, Web Audio Engine, UI HUD, and Spline Bridge.
 */

import { SHOWROOM_CONFIG } from './config.js';
import { ShowroomScene } from './showroom-scene.js';
import { loadBMWModel } from './car-model.js';
import { AudioEngine } from './audio-engine.js';
import { SplineBridge } from './spline-bridge.js';

class BMWApp {
  constructor() {
    this.scene = null;
    this.car = null;
    this.audio = new AudioEngine();
    this.spline = null;

    this.currentPaint = SHOWROOM_CONFIG.paints[0];
    this.headlightsOn = true;
    this.nightModeOn = false;
    this.currentMode = 'comfort';

    this.init();
  }

  async init() {
    const loader = document.getElementById('loader-overlay');
    try {
      // 1. Initialize 3D Showroom Scene
      const viewportContainer = document.getElementById('viewport-container');
      this.scene = new ShowroomScene(viewportContainer);

      // 2. Load and Mount Authentic BMW M4 3D Model
      this.car = await loadBMWModel();
      this.scene.setCar(this.car);

      // 3. Initialize Spline Bridge for Modal
      const splineContainer = document.getElementById('spline-viewport-container');
      this.spline = new SplineBridge(splineContainer);

      // 4. Bind UI Components
      this._renderColorSwatches();
      this._bindCameraControls();
      this._bindDriveModes();
      this._bindToggles();
      this._bindAudioControls();
      this._bindSplineModal();

      // 5. Hide Loader Overlay smoothly
      setTimeout(() => {
        if (loader) {
          loader.classList.add('fade-out');
        }
      }, 300);
    } catch (err) {
      console.error('Showroom initialization error:', err);
      if (loader) {
        loader.classList.add('fade-out');
      }
    }
  }

  _renderColorSwatches() {
    const swatchesContainer = document.getElementById('swatches-grid');
    if (!swatchesContainer) return;

    swatchesContainer.innerHTML = '';
    SHOWROOM_CONFIG.paints.forEach((paint, index) => {
      const button = document.createElement('button');
      button.className = `color-swatch-btn ${index === 0 ? 'active' : ''}`;
      button.style.backgroundColor = paint.cssColor;
      button.title = paint.name;
      button.setAttribute('aria-label', paint.name);

      button.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        this.currentPaint = paint;
        this.scene.setPaintColor(
          paint.color,
          paint.metalness,
          paint.roughness,
          paint.clearcoat,
          paint.clearcoatRoughness
        );
        this.audio.playClick();
      });

      swatchesContainer.appendChild(button);
    });
  }

  _bindCameraControls() {
    const camButtons = document.querySelectorAll('.cam-btn');
    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presetKey = btn.dataset.preset;
        const preset = SHOWROOM_CONFIG.cameraPresets[presetKey];
        if (preset) {
          this.scene.animateToCameraPreset(preset.position, preset.target);
          this.audio.playClick();
        }
      });
    });
  }

  _bindDriveModes() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active', 'sport-mode'));
        btn.classList.add('active');

        const modeKey = btn.dataset.mode;
        this.currentMode = modeKey;
        const modeData = SHOWROOM_CONFIG.driveModes[modeKey];

        if (modeKey === 'sportPlus') {
          btn.classList.add('sport-mode');
        }

        if (modeData) {
          this.audio.setDriveMode(modeData.enginePitch);
          this._updateHUDMode(modeData);
          this.audio.playClick();
        }
      });
    });
  }

  _updateHUDMode(modeData) {
    const hudBadge = document.getElementById('hud-drive-mode');
    if (hudBadge) {
      hudBadge.textContent = modeData.name;
      hudBadge.style.color = modeData.accentColor;
      hudBadge.style.borderColor = modeData.accentColor;
    }
  }

  _bindToggles() {
    // Headlights toggle
    const lightsToggle = document.getElementById('toggle-headlights');
    if (lightsToggle) {
      lightsToggle.addEventListener('click', () => {
        this.headlightsOn = !this.headlightsOn;
        lightsToggle.classList.toggle('active', this.headlightsOn);
        this.scene.setHeadlights(this.headlightsOn);
        this.audio.playClick();
      });
    }

    // Studio Neon Ambient toggle
    const neonToggle = document.getElementById('toggle-neon');
    if (neonToggle) {
      neonToggle.addEventListener('click', () => {
        this.nightModeOn = !this.nightModeOn;
        neonToggle.classList.toggle('active', this.nightModeOn);
        this.scene.setStudioLighting(this.nightModeOn);
        this.audio.playClick();
      });
    }

    // Auto rotate toggle
    const rotateBtn = document.getElementById('btn-autorotate');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        this.scene.isAutoRotating = !this.scene.isAutoRotating;
        rotateBtn.classList.toggle('active', this.scene.isAutoRotating);
        this.audio.playClick();
      });
    }
  }

  _bindAudioControls() {
    // Master Sound Mute Button
    const audioBtn = document.getElementById('btn-sound-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isSoundOn = this.audio.toggleMute();
        audioBtn.classList.toggle('active', isSoundOn);
        audioBtn.title = isSoundOn ? 'Mute Engine Audio' : 'Unmute Engine Audio';
      });
    }

    // Interactive Engine Rev / Throttle
    const revBtn = document.getElementById('btn-rev-engine');
    const rpmBar = document.getElementById('rpm-fill');
    const rpmText = document.getElementById('rpm-number');

    if (revBtn) {
      const triggerRev = () => {
        this.audio.revEngine(1.0);
        if (rpmBar) rpmBar.style.width = '92%';
        if (rpmText) rpmText.textContent = '6,800';

        setTimeout(() => {
          if (rpmBar) rpmBar.style.width = '14%';
          if (rpmText) rpmText.textContent = '850';
        }, 900);
      };

      revBtn.addEventListener('click', triggerRev);
    }
  }

  _bindSplineModal() {
    const openBtn = document.getElementById('btn-open-spline');
    const closeBtn = document.getElementById('btn-close-spline');
    const modal = document.getElementById('spline-modal');
    const loadUrlBtn = document.getElementById('btn-load-spline-url');
    const urlInput = document.getElementById('spline-url-input');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        modal.classList.add('open');
        this.audio.playClick();
        // Load default scene if empty
        if (!this.spline.currentUrl && SHOWROOM_CONFIG.defaultSplineScenes[0]) {
          this.spline.loadScene(SHOWROOM_CONFIG.defaultSplineScenes[0].url);
        }
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        this.audio.playClick();
      });
    }

    if (loadUrlBtn && urlInput) {
      loadUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
          this.spline.loadScene(url);
          this.audio.playClick();
        }
      });
    }
  }
}

// Start on DOM ready or immediate if already loaded
function bootstrap() {
  new BMWApp();

  // Fail-safe timeout: ensure loader never blocks screen permanently
  setTimeout(() => {
    const loader = document.getElementById('loader-overlay');
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
    }
  }, 2500);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
