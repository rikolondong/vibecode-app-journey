/**
 * Master Game Controller for Missile Simulator: Mountain Strike
 * Orchestrates Three.js Scene, Physics, Targets, Weapons, 3D HUD Markers, UI, and Input
 */

class MissileSimulatorGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.markersLayer = document.getElementById('target-markers-layer');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Game Subsystems
    this.terrain = null;
    this.targetManager = null;
    this.vfxManager = null;
    this.missileController = null;
    this.airDefenseSystem = null;
    this.cameraSystem = null;

    // Current Selections
    this.selectedMissileType = 'javelin';
    this.selectedTargetId = 'bunker_alpha';

    // SACLOS mouse steering state
    this.isCanvasDragging = false;
    this.reportTimeout = null;
    this.markerElements = {};

    this.init();
  }

  init() {
    // 1. Setup Three.js Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c131a);
    this.scene.fog = new THREE.FogExp2(0x0e1720, 0.00012);

    // 2. Camera & Renderer
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 30000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Environmental Lighting
    this.setupLighting();

    // 4. Instantiate Subsystems
    this.vfxManager = new VFXManager(this.scene);
    this.terrain = new MountainTerrain(this.scene);
    this.terrain.build();

    this.targetManager = new TargetManager(this.scene, this.terrain);
    this.missileController = new MissileController(this.scene, this.terrain, this.targetManager, this.vfxManager);
    this.airDefenseSystem = new AirDefenseSystem(this.scene, this.terrain, this.vfxManager);
    this.cameraSystem = new CameraSystem(this.camera, this.renderer.domElement, this.terrain);

    // 5. Setup UI, 3D Target Markers & Event Listeners
    this.buildTargetMarkerElements();
    this.setupUI();
    this.setupInputHandlers();

    // 6. Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    // 7. Start Animation Loop
    this.animate();
    console.log('Missile Simulator Engine Online');
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x4a6072, 0.95);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x88b0d4, 0x243328, 0.75);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff2e0, 1.45);
    sunLight.position.set(-2200, 3800, -3000);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 11000;
    const shadowDist = 3500;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    this.scene.add(sunLight);
  }

  buildTargetMarkerElements() {
    if (!this.markersLayer) return;
    this.markersLayer.innerHTML = '';
    this.markerElements = {};

    for (const target of this.targetManager.targets) {
      const el = document.createElement('div');
      el.className = 'target-marker-3d';
      el.innerHTML = `
        <div class="target-diamond"></div>
        <div class="target-marker-label">${target.name}</div>
      `;
      el.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        this.selectedTargetId = target.id;
        const targetSelect = document.getElementById('target-select');
        if (targetSelect) targetSelect.value = target.id;
        this.updateTargetHUD();
      });
      this.markersLayer.appendChild(el);
      this.markerElements[target.id] = el;
    }
  }

  updateTargetMarkers3D() {
    if (!this.markersLayer || !this.camera) return;
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    const projVec = new THREE.Vector3();

    for (const target of this.targetManager.targets) {
      const el = this.markerElements[target.id];
      if (!el) continue;

      projVec.copy(target.position);
      projVec.y += 28; // Float marker slightly above building roof
      projVec.project(this.camera);

      // Hide if behind camera
      if (projVec.z > 1.0) {
        el.style.display = 'none';
        continue;
      }

      const x = (projVec.x * widthHalf) + widthHalf;
      const y = -(projVec.y * heightHalf) + heightHalf;

      // Keep within screen bounds check
      if (x < 20 || x > window.innerWidth - 20 || y < 20 || y > window.innerHeight - 20) {
        el.style.display = 'none';
        continue;
      }

      el.style.display = 'flex';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      const isSelected = (target.id === this.selectedTargetId);
      el.classList.toggle('selected', isSelected);
      el.classList.toggle('destroyed', target.isDestroyed);

      const labelEl = el.querySelector('.target-marker-label');
      if (labelEl) {
        const distKm = (this.camera.position.distanceTo(target.position) / 1000).toFixed(1);
        const statusTag = target.isDestroyed ? ' [DESTROYED]' : (isSelected ? ' [LOCKED]' : '');
        labelEl.textContent = `${target.name} (${distKm}km)${statusTag}`;
      }
    }
  }

  setupUI() {
    // Missile Selector Chips
    document.querySelectorAll('.missile-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        document.querySelectorAll('.missile-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedMissileType = chip.dataset.missile;
        this.updateMissileHUD();

        const saclosHint = document.getElementById('saclos-hint');
        if (saclosHint) {
          saclosHint.style.display = this.selectedMissileType === 'tow' ? 'block' : 'none';
        }
      });
    });

    // Target Selection Dropdown
    const targetSelect = document.getElementById('target-select');
    if (targetSelect) {
      targetSelect.addEventListener('change', (e) => {
        window.soundEngine.playUIClick();
        this.selectedTargetId = e.target.value;
        this.updateTargetHUD();
      });
    }

    // Launch Button
    const btnLaunch = document.getElementById('btn-launch');
    if (btnLaunch) {
      btnLaunch.addEventListener('click', () => {
        this.triggerLaunch();
      });
    }

    // Reset Button
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        this.resetGame();
      });
    }

    // Camera Switchers
    document.querySelectorAll('.btn-cam').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        this.cameraSystem.setMode(btn.dataset.cam);
      });
    });

    // Threat Level Toggle
    const btnThreat = document.getElementById('btn-threat');
    if (btnThreat) {
      btnThreat.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        const active = this.airDefenseSystem.toggleActive();
        btnThreat.classList.toggle('active', active);
        btnThreat.textContent = active ? 'THREAT: DEFCON 1 [ACTIVE]' : 'THREAT: SAFE [OFF]';
        btnThreat.classList.toggle('danger', active);

        const threatBox = document.getElementById('threat-status-box');
        if (threatBox) {
          threatBox.classList.toggle('active-warning', active);
          const title = threatBox.querySelector('.threat-title');
          const desc = threatBox.querySelector('.threat-desc');
          if (title) title.textContent = active ? 'AIR DEFENSE ACTIVE' : 'AIR DEFENSE STANDBY';
          if (desc) desc.textContent = active ? 'SAM & CIWS INTERCEPTORS LIVE' : 'NO THREAT ENGAGED';
        }
      });
    }

    // FLIR Toggle
    const btnFLIR = document.getElementById('btn-flir');
    if (btnFLIR) {
      btnFLIR.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        this.cameraSystem.toggleFLIR();
      });
    }

    // Sound Toggle
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const soundOn = window.soundEngine.toggleSound();
        btnSound.textContent = soundOn ? 'AUDIO: ON' : 'AUDIO: MUTED';
        btnSound.classList.toggle('active', soundOn);
      });
    }

    // Specs Modal
    const btnSpecs = document.getElementById('btn-specs');
    const modalSpecs = document.getElementById('modal-specs');
    const modalSpecsClose = document.getElementById('modal-specs-close');

    if (btnSpecs && modalSpecs) {
      btnSpecs.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        this.populateSpecsModal();
        modalSpecs.classList.add('active');
      });
    }

    if (modalSpecsClose && modalSpecs) {
      modalSpecsClose.addEventListener('click', () => {
        window.soundEngine.playUIClick();
        modalSpecs.classList.remove('active');
      });
    }

    // Kill Assessment Modal Close
    const btnResultClose = document.getElementById('modal-result-close');
    const modalResult = document.getElementById('modal-result');
    if (btnResultClose && modalResult) {
      btnResultClose.addEventListener('click', () => {
        modalResult.classList.remove('active');
      });
    }

    this.updateMissileHUD();
    this.updateTargetHUD();
  }

  setupInputHandlers() {
    // Keyboard controls for shortcuts & manual SACLOS steering
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') this.cameraSystem.setMode('chase');
      if (e.key === '2') this.cameraSystem.setMode('seeker');
      if (e.key === '3') this.cameraSystem.setMode('launcher');
      if (e.key === '4') this.cameraSystem.setMode('target');
      if (e.key.toLowerCase() === 't') this.cameraSystem.toggleFLIR();
      if (e.code === 'Space' && this.missileController.state !== 'in_flight') {
        e.preventDefault();
        this.triggerLaunch();
      }

      // SACLOS manual directional keys
      if (this.selectedMissileType === 'tow') {
        const key = e.key.toLowerCase();
        if (e.key === 'ArrowUp' || key === 'w') this.missileController.manualPitchInput = 1.0;
        if (e.key === 'ArrowDown' || key === 's') this.missileController.manualPitchInput = -1.0;
        if (e.key === 'ArrowLeft' || key === 'a') this.missileController.manualYawInput = -1.0;
        if (e.key === 'ArrowRight' || key === 'd') this.missileController.manualYawInput = 1.0;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.selectedMissileType === 'tow') {
        const key = e.key.toLowerCase();
        if (['ArrowUp', 'ArrowDown'].includes(e.key) || ['w', 's'].includes(key)) {
          this.missileController.manualPitchInput = 0;
        }
        if (['ArrowLeft', 'ArrowRight'].includes(e.key) || ['a', 'd'].includes(key)) {
          this.missileController.manualYawInput = 0;
        }
      }
    });

    // Safe Mouse Steering for SACLOS: only active while holding left-click on canvas
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isCanvasDragging = true;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isCanvasDragging) {
        this.isCanvasDragging = false;
        if (this.selectedMissileType === 'tow') {
          this.missileController.setManualInput(0, 0);
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isCanvasDragging && this.selectedMissileType === 'tow' && this.missileController.state === 'in_flight') {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        this.missileController.setManualInput(normY, normX);
      }
    });
  }

  triggerLaunch() {
    if (this.missileController.state === 'in_flight') return;

    window.soundEngine.ensureContext();
    if (this.reportTimeout) {
      clearTimeout(this.reportTimeout);
      this.reportTimeout = null;
    }

    const modalResult = document.getElementById('modal-result');
    if (modalResult) modalResult.classList.remove('active');

    const btnLaunch = document.getElementById('btn-launch');
    if (btnLaunch) btnLaunch.disabled = true;

    // Get chosen target position
    const targetObj = this.targetManager.targets.find(t => t.id === this.selectedTargetId);
    const targetPos = targetObj ? targetObj.position : new THREE.Vector3(-450, 200, 1850);

    const missile = this.missileController.launch(this.selectedMissileType, targetPos, targetObj);
    if (!missile) {
      if (btnLaunch) btnLaunch.disabled = false;
      return;
    }

    this.cameraSystem.onLaunch(missile);
    window.soundEngine.playLockBeep(true);

    const reticle = document.getElementById('reticle-box');
    if (reticle) reticle.classList.add('locked');
    const reticleText = document.getElementById('reticle-text');
    if (reticleText) reticleText.textContent = `LOCKED // ${targetObj ? targetObj.name : 'TARGET'}`;
  }

  resetGame() {
    if (this.reportTimeout) {
      clearTimeout(this.reportTimeout);
      this.reportTimeout = null;
    }

    this.missileController.reset();
    this.targetManager.resetAll();
    this.vfxManager.clear();
    this.airDefenseSystem.clearInterceptors();
    this.buildTargetMarkerElements();

    const btnLaunch = document.getElementById('btn-launch');
    if (btnLaunch) btnLaunch.disabled = false;

    const modalResult = document.getElementById('modal-result');
    if (modalResult) modalResult.classList.remove('active');

    const reticle = document.getElementById('reticle-box');
    if (reticle) reticle.classList.remove('locked');
    const reticleText = document.getElementById('reticle-text');
    if (reticleText) reticleText.textContent = 'SEEKER ACTIVE // TARGET TRACKING';

    this.updateTargetHUD();
  }

  updateMissileHUD() {
    const specs = MISSILE_SPECS[this.selectedMissileType];
    if (!specs) return;

    const elName = document.getElementById('hud-missile-name');
    const elGuidance = document.getElementById('hud-guidance-type');
    const elSpeed = document.getElementById('hud-max-speed');
    const elWarhead = document.getElementById('hud-warhead');

    if (elName) elName.textContent = specs.name;
    if (elGuidance) elGuidance.textContent = specs.guidanceName;
    if (elSpeed) elSpeed.textContent = `Mach ${specs.maxSpeedMach} (${specs.speedMps} m/s)`;
    if (elWarhead) elWarhead.textContent = `${specs.warheadKg} kg ${specs.warheadType}`;
  }

  updateTargetHUD() {
    const target = this.targetManager.targets.find(t => t.id === this.selectedTargetId);
    if (!target) return;

    const elName = document.getElementById('hud-target-name');
    const elDist = document.getElementById('hud-target-distance');
    const elHp = document.getElementById('hud-target-hp');

    if (elName) elName.textContent = target.name;
    const dist = this.terrain.launchPadPos.distanceTo(target.position);
    if (elDist) elDist.textContent = `${(dist / 1000).toFixed(2)} km`;
    if (elHp) {
      elHp.textContent = `${target.hp} / ${target.maxHp} HP (${target.isDestroyed ? 'DESTROYED' : 'OPERATIONAL'})`;
      elHp.className = `data-value ${target.isDestroyed ? 'highlight-red' : 'highlight-green'}`;
    }
  }

  populateSpecsModal() {
    const specs = MISSILE_SPECS[this.selectedMissileType];
    if (!specs) return;

    const title = document.getElementById('modal-specs-title');
    const body = document.getElementById('modal-specs-body');

    if (title) title.textContent = `TECHNICAL DOSSIER: ${specs.name}`;
    if (body) {
      body.innerHTML = `
        <div style="color: #00ff66; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
          ${specs.category} — ${specs.country}
        </div>
        <p style="color: #b0bac5; margin-bottom: 12px;">${specs.description}</p>
        <div class="specs-grid">
          <div class="specs-item">
            <div class="specs-item-label">Sistem Panduan (Guidance)</div>
            <div class="specs-item-value">${specs.guidanceName}</div>
          </div>
          <div class="specs-item">
            <div class="specs-item-label">Kecepatan Maksimum</div>
            <div class="specs-item-value">Mach ${specs.maxSpeedMach} (${specs.speedMps} m/s)</div>
          </div>
          <div class="specs-item">
            <div class="specs-item-label">Hulu Ledak (Warhead)</div>
            <div class="specs-item-value">${specs.warheadKg} kg — ${specs.warheadType}</div>
          </div>
          <div class="specs-item">
            <div class="specs-item-label">Radius Dampak Ledakan</div>
            <div class="specs-item-value">${specs.blastRadiusM} Meter</div>
          </div>
          <div class="specs-item">
            <div class="specs-item-label">Jangkauan Efektif</div>
            <div class="specs-item-value">${(specs.maxRangeM / 1000).toLocaleString()} km</div>
          </div>
          <div class="specs-item">
            <div class="specs-item-label">Durasi Pembakaran Propulsi</div>
            <div class="specs-item-value">${specs.boosterDurationSec} Detik</div>
          </div>
        </div>
        <div class="guidance-instructions">
          <strong>CARA KENDALI:</strong> ${
            specs.guidanceType === 'saclos_manual'
              ? 'Gunakan tombol W/A/S/D atau Panah (atau tahan Klik Kiri Mouse di layar) untuk mengemudikan rudal langsung ke sasaran!'
              : specs.guidanceType === 'top_attack'
              ? 'Rudal otomatis memanjat tinggi di udara dan menukik 90° tegak lurus menghantam atap bunker.'
              : specs.guidanceType === 'terrain_cruise'
              ? 'Rudal jelajah terbang rendah menyusuri lembah pegunungan menghindari radar sebelum menukik.'
              : specs.guidanceType === 'ballistic_arc'
              ? 'Rudal balistik naik ke stratosfer membentuk busur tinggi lalu menghantam dengan kecepatan penetrasi dahsyat.'
              : 'Rudal hipersonik Mach 10 dengan selubung plasma menyala, menembus pertahanan dalam sekejap.'
          }
        </div>
      `;
    }
  }

  showMissionReport(eventData) {
    const modal = document.getElementById('modal-result');
    if (!modal) return;

    const isIntercepted = eventData.reason === 'intercepted';
    const titleEl = document.getElementById('kill-title');
    const detailsEl = document.getElementById('kill-details');

    if (isIntercepted) {
      titleEl.className = 'kill-result-title intercepted';
      titleEl.textContent = 'MISSILE INTERCEPTED BY AIR DEFENSE!';
      detailsEl.innerHTML = `
        <div class="data-row"><span class="data-label">Status:</span><span class="data-value highlight-red">DITANGKIS DI UDARA (SAM/CIWS)</span></div>
        <div class="data-row"><span class="data-label">Waktu Mengudara:</span><span class="data-value">${eventData.flightTime.toFixed(1)} Detik</span></div>
        <p style="margin-top: 10px; color: #ff9999;">Tips: Gunakan rudal hipersonik <strong>Kh-47M2 Kinzhal</strong> untuk menembus radar, atau <strong>Tomahawk</strong> menyusuri lembah tersembunyi!</p>
      `;
    } else {
      const nearest = eventData.damageResult ? eventData.damageResult.nearestTarget : null;
      const dist = eventData.damageResult ? eventData.damageResult.distance : 0;
      const targetDestroyed = nearest && nearest.isDestroyed;

      titleEl.className = 'kill-result-title hit';
      titleEl.textContent = targetDestroyed ? 'TARGET CATASTROPHICALLY DESTROYED!' : 'IMPACT RECORDED!';

      detailsEl.innerHTML = `
        <div class="data-row"><span class="data-label">Target Terdekat:</span><span class="data-value highlight-green">${nearest ? nearest.name : 'Medan Lereng Gunung'}</span></div>
        <div class="data-row"><span class="data-label">Deviasi Titik Impak:</span><span class="data-value highlight-cyan">${dist.toFixed(1)} Meter</span></div>
        <div class="data-row"><span class="data-label">Waktu Tempuh:</span><span class="data-value">${eventData.flightTime.toFixed(2)} Detik</span></div>
        <div class="data-row"><span class="data-label">Status Kehancuran:</span><span class="data-value ${targetDestroyed ? 'highlight-green' : 'highlight-amber'}">${targetDestroyed ? '100% DESTROYED' : `${nearest ? nearest.hp : 0} HP Sisa`}</span></div>
      `;
    }

    // Re-enable launch button immediately so player can fire again anytime
    const btnLaunch = document.getElementById('btn-launch');
    if (btnLaunch) btnLaunch.disabled = false;

    // Delay modal popup by 1.2s so player can watch the explosion and building collapse first!
    if (this.reportTimeout) clearTimeout(this.reportTimeout);
    this.reportTimeout = setTimeout(() => {
      modal.classList.add('active');
    }, 1200);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Targets & Building Physics
    this.targetManager.update(delta);

    // 2. Update Air Defense AI Interceptions
    this.airDefenseSystem.update(delta, this.missileController);

    // 3. Update Missile Flight Dynamics (processes both terrain/target hits and air interceptions)
    const missileEvent = this.missileController.update(delta);

    // 4. Update Particle Systems & Explosions
    this.vfxManager.update(delta);

    // 5. Update Multi-Camera Views
    this.cameraSystem.update(delta, this.missileController, this.targetManager, this.vfxManager, this.selectedTargetId);

    // 6. Update 3D Projected Target Markers & Telemetry HUD
    this.updateTargetMarkers3D();
    this.updateLiveTelemetry();

    // 7. Handle Impact or Interception Conclusion
    if (missileEvent && (missileEvent.event === 'hit' || missileEvent.event === 'intercepted')) {
      const m = missileEvent.missile;
      this.showMissionReport({
        reason: missileEvent.reason || this.missileController.state,
        flightTime: m ? m.flightTime : this.missileController.flightTime,
        damageResult: m ? m.damageResult : null
      });
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  updateLiveTelemetry() {
    const m = this.missileController.activeMissile;
    const inFlight = m && this.missileController.state === 'in_flight';

    const elMach = document.getElementById('telemetry-mach');
    const elSpeed = document.getElementById('telemetry-speed');
    const elAlt = document.getElementById('telemetry-alt');
    const elGForce = document.getElementById('telemetry-gforce');
    const elDist = document.getElementById('telemetry-dist');
    const elTime = document.getElementById('telemetry-time');
    const elState = document.getElementById('telemetry-state');

    if (inFlight) {
      if (elMach) elMach.textContent = `M ${m.mach.toFixed(2)}`;
      if (elSpeed) elSpeed.textContent = `${Math.round(m.speedMps * 3.6)} km/h`;
      if (elAlt) elAlt.textContent = `${Math.round(m.altitudeAGL)} m AGL`;
      if (elGForce) elGForce.textContent = `${m.gForce.toFixed(1)} G`;
      if (elDist) elDist.textContent = `${(m.distanceToTarget / 1000).toFixed(2)} km`;
      if (elTime) elTime.textContent = `${m.flightTime.toFixed(1)} s`;
      if (elState) {
        elState.textContent = 'IN FLIGHT';
        elState.className = 'data-value highlight-green';
      }
    } else {
      if (elMach) elMach.textContent = 'M 0.00';
      if (elSpeed) elSpeed.textContent = '0 km/h';
      if (elAlt) elAlt.textContent = '0 m AGL';
      if (elGForce) elGForce.textContent = '1.0 G';
      if (elTime) elTime.textContent = '0.0 s';
      if (elState) {
        elState.textContent = this.missileController.state.toUpperCase();
        elState.className = 'data-value';
      }
    }

    this.updateTargetHUD();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Bootstrap Game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new MissileSimulatorGame();
});
