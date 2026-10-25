// ============================================================================
// PANTURA: MUDIK ODYSSEY — MAIN GAME CONTROLLER (REAL 1:1 HIGHWAY SCALE)
// 3D Stylized Low-Poly Renderer + Road Trip Resource & Event Simulation
// ============================================================================

import * as THREE from '../libs/three.module.js';
import {
  TOTAL_ROUTE_KM,
  MPV_MODELS,
  ROUTE_CHECKPOINTS,
  ITEMS_CATALOG,
  PANTURA_EVENTS,
  AMBIENT_CHATTER_POOL
} from './data.js';
import { PanturaAudio } from './audio.js';
import { createPlayerMPV } from './vehicles.js';
import { PanturaWorld } from './world.js';

class PanturaMudikGame {
  constructor() {
    this.audio = new PanturaAudio();

    this.selectedMpvId = MPV_MODELS[0].id;
    this.state = this.createInitialState(MPV_MODELS[0]);

    // Controls & 4 Camera Modes
    this.keys = { left: false, right: false, up: false, down: false };
    this.cameraModeIndex = 0; // 0: Indie, 1: Chase, 2: Kap/POV, 3: Sinematik
    this.cameraModes = ['Indie', 'Chase', 'Kap POV', 'Sinematik'];
    this.lightsOn = true;

    this.initThree();
    this.world = new PanturaWorld(this.scene);
    this.spawnPlayerCar(MPV_MODELS[0]);

    this.initUI();
    this.bindEvents();

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createInitialState(mpv) {
    return {
      isPlaying: false,
      isPausedModal: true,
      mpv,
      distanceKm: 0,
      speedKmh: 78,
      targetSpeedKmh: 82,
      paceMode: 'normal', // 'slow' | 'normal' | 'fast'
      autoSteer: true,

      // Real-world 1:1 scale Eastbound carriageway positions:
      //   Outer Slow Lane (Lajur Kiri): x = -6.6m
      //   Inner Fast Lane (Lajur Kanan): x = -2.7m
      playerX: -4.6,
      targetLaneX: -6.6,
      steerVelocity: 0,

      // 4 Core Vitals (0 - 100) + THR Cash
      fuel: 100,
      stamina: 100,
      condition: 100,
      mood: 100,
      cash: mpv.startingCash,

      tarpSecured: true,
      checkpointIndex: 0,
      nextEventKm: 38,
      usedEventIds: new Set(),
      chatterTimer: 0,
      rainDamageTimer: 0,
      gameMinutes: 16 * 60 + 30,

      inventory: [
        'kaleng_khongguan',
        'kardus_sarung',
        'kopi_kapal',
        'tolak_angin'
      ]
    };
  }

  // ==========================================================================
  // THREE.JS SCENE, ACES FILMIC TONE MAPPING & CAMERA INITIALIZATION
  // ==========================================================================
  initThree() {
    const container = document.getElementById('canvas-container');
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.4,
      520
    );
    this.camera.position.set(-4.6, 7.8, 13.8);
    this.cameraTarget = new THREE.Vector3(-4.6, 1.8, -18.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  spawnPlayerCar(mpvConfig) {
    if (this.playerCar) {
      this.scene.remove(this.playerCar);
    }
    this.playerCar = createPlayerMPV(mpvConfig);
    this.playerCar.position.set(this.state.playerX, 0, 0);
    this.scene.add(this.playerCar);
    this.updateRoofCargo3D();
  }

  updateRoofCargo3D() {
    if (!this.playerCar || !this.playerCar.userData.updateRoofVisuals) return;
    this.playerCar.userData.updateRoofVisuals(
      this.state.inventory.length,
      this.state.tarpSecured
    );
  }

  // ==========================================================================
  // UI INITIALIZATION & RENDERING
  // ==========================================================================
  initUI() {
    this.renderMPVSelection();
    this.renderRouteNodes();
    this.renderInventory();
    this.updateHUD();
  }

  renderMPVSelection() {
    const grid = document.getElementById('mpv-selection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    MPV_MODELS.forEach((mpv) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `mpv-card ${mpv.id === this.selectedMpvId ? 'selected' : ''}`;
      const hexColor = '#' + mpv.bodyColor.toString(16).padStart(6, '0');

      card.innerHTML = `
        <div class="mpv-card-top">
          <span class="mpv-emoji">${mpv.emoji}</span>
          <span class="mpv-color-dot" style="background:${hexColor}"></span>
        </div>
        <div class="mpv-title">${mpv.name}</div>
        <div class="mpv-subtitle">${mpv.subtitle}</div>
        <p class="mpv-desc">${mpv.description}</p>
        <div class="mpv-perks">${mpv.perkText}</div>
      `;

      card.addEventListener('click', () => {
        this.audio.playClick();
        this.selectedMpvId = mpv.id;
        this.renderMPVSelection();
        this.spawnPlayerCar(mpv);
      });

      grid.appendChild(card);
    });
  }

  renderRouteNodes() {
    const container = document.getElementById('route-nodes');
    if (!container) return;
    container.innerHTML = '';

    ROUTE_CHECKPOINTS.forEach((cp, index) => {
      const dot = document.createElement('div');
      dot.className = `route-node-dot ${index <= this.state.checkpointIndex ? 'reached' : ''}`;
      dot.title = `${cp.name} (KM ${cp.km})`;
      container.appendChild(dot);
    });
  }

  renderInventory() {
    const grid = document.getElementById('inventory-grid');
    const capText = document.getElementById('cargo-capacity-text');
    const souvCount = document.getElementById('souvenir-count');
    if (!grid) return;

    const maxSlots = this.state.mpv.maxSlots;
    const inv = this.state.inventory;
    if (capText) capText.textContent = `${inv.length} / ${maxSlots} Slot`;

    const souvenirItems = inv.filter((id) => {
      const item = ITEMS_CATALOG[id];
      return item && (item.type === 'souvenir' || item.type === 'both');
    });
    if (souvCount) souvCount.textContent = `${souvenirItems.length} Paket`;

    grid.innerHTML = '';

    for (let i = 0; i < maxSlots; i++) {
      const itemId = inv[i];
      if (!itemId || !ITEMS_CATALOG[itemId]) {
        const empty = document.createElement('div');
        empty.className = 'inv-slot empty-slot';
        empty.textContent = '+ Slot Bagasi Kosong';
        grid.appendChild(empty);
        continue;
      }

      const item = ITEMS_CATALOG[itemId];
      const slot = document.createElement('button');
      slot.type = 'button';
      const isSouvenir = item.type === 'souvenir' || item.type === 'both';
      slot.className = `inv-slot ${isSouvenir ? 'souvenir-slot' : ''}`;
      slot.title = item.description;

      const tagClass = item.type === 'souvenir' ? 'tag-souvenir' : 'tag-usable';
      const tagLabel = item.type === 'souvenir'
        ? 'Oleh-Oleh'
        : item.type === 'both'
          ? 'Oleh2 / Buka'
          : 'Klik Pakai';

      slot.innerHTML = `
        <div class="inv-slot-top">
          <span class="inv-icon">${item.icon}</span>
          <span class="inv-tag ${tagClass}">${tagLabel}</span>
        </div>
        <div class="inv-name">${item.name}</div>
        <div class="inv-effect">${item.effectLabel}</div>
      `;

      slot.addEventListener('click', () => this.handleUseInventoryItem(i));
      grid.appendChild(slot);
    }

    this.updateRoofCargo3D();
  }

  handleUseInventoryItem(slotIndex) {
    if (!this.state.isPlaying) return;
    const itemId = this.state.inventory[slotIndex];
    const item = ITEMS_CATALOG[itemId];
    if (!item) return;

    if (!item.onUse) {
      this.audio.playClick();
      this.showToast(`📦 ${item.name} disimpan rapi untuk keluarga di Surabaya (+${item.points} Poin)!`);
      return;
    }

    this.audio.playItemUse();
    const feedback = item.onUse(this.state);
    this.state.inventory.splice(slotIndex, 1);
    this.renderInventory();
    this.updateHUD();
    this.showToast(feedback);
    this.setFamilyChatter('Ibu di Kursi Depan', '👩', feedback);
  }

  setFamilyChatter(speaker, avatar, text) {
    const elSpeaker = document.getElementById('chatter-speaker');
    const elAvatar = document.getElementById('chatter-avatar');
    const elText = document.getElementById('chatter-text');
    if (elSpeaker) elSpeaker.textContent = speaker;
    if (elAvatar) elAvatar.textContent = avatar;
    if (elText) elText.textContent = `"${text}"`;
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3600);
  }

  // ==========================================================================
  // EVENT LISTENERS & CONTROLS
  // ==========================================================================
  bindEvents() {
    const btnStart = document.getElementById('btn-start-journey');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.audio.init();
        this.audio.playCheckpointReached();
        this.startNewJourney();
      });
    }

    document.querySelectorAll('.pace-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pace = btn.getAttribute('data-pace');
        this.setDrivingPace(pace);
      });
    });

    const btnTarp = document.getElementById('btn-toggle-tarp');
    if (btnTarp) {
      btnTarp.addEventListener('click', () => {
        this.audio.playClick();
        this.state.tarpSecured = true;
        this.updateRoofCargo3D();
        this.updateHUD();
        this.showToast('🛡️ Ikatan tali rafia & terpal biru di atap sudah dikencangkan!');
      });
    }

    const btnStopover = document.getElementById('btn-pull-over');
    if (btnStopover) {
      btnStopover.addEventListener('click', () => {
        if (this.state.isPlaying && !this.state.isPausedModal) {
          this.openStopoverModal();
        }
      });
    }

    const btnResume = document.getElementById('btn-resume-driving');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.audio.playClick();
        this.closeStopoverModal();
      });
    }

    document.getElementById('btn-steer-mode')?.addEventListener('click', () => this.toggleSteerMode());
    document.getElementById('btn-camera')?.addEventListener('click', () => this.cycleCamera());
    document.getElementById('btn-lights')?.addEventListener('click', () => this.toggleLights());
    document.getElementById('btn-horn')?.addEventListener('click', () => this.triggerHorn());
    document.getElementById('btn-radio')?.addEventListener('click', () => {
      const name = this.audio.cycleRadio();
      const lbl = document.getElementById('radio-btn-label');
      if (lbl) lbl.textContent = `Radio: ${name}`;
      this.showToast(`📻 Radio Pantura FM: ${name}`);
    });
    document.getElementById('btn-time-weather')?.addEventListener('click', () => {
      const preset = this.world.cycleWeather();
      this.updateWeatherBadge(preset);
      this.showToast(`Suasana Jalur Pantura: ${preset.label}`);
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      this.audio.playClick();
      document.getElementById('ending-modal')?.classList.remove('active');
      document.getElementById('start-modal')?.classList.add('active');
      this.state.isPlaying = false;
      this.state.isPausedModal = true;
    });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') {
        this.keys.left = true;
        if (this.state.autoSteer && this.state.isPlaying && !this.state.isPausedModal) {
          this.state.targetLaneX = -6.6; // Lajur Kiri (Slow/Normal)
        }
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        this.keys.right = true;
        if (this.state.autoSteer && this.state.isPlaying && !this.state.isPausedModal) {
          this.state.targetLaneX = -2.7; // Lajur Kanan (Fast/Overtaking)
        }
      }
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = true;

      if (!this.state.isPlaying || this.state.isPausedModal) return;

      if (code === 'KeyC') this.cycleCamera();
      if (code === 'KeyL' || code === 'KeyF') this.toggleLights();
      if (code === 'KeyH') this.triggerHorn();
      if (code === 'KeyR') this.openStopoverModal();
      if (code === 'KeyM') {
        const name = this.audio.cycleRadio();
        const lbl = document.getElementById('radio-btn-label');
        if (lbl) lbl.textContent = `Radio: ${name}`;
        this.showToast(`📻 Radio Pantura FM: ${name}`);
      }
      if (code === 'KeyT') {
        const preset = this.world.cycleWeather();
        this.updateWeatherBadge(preset);
      }
      if (code === 'Digit1') this.setDrivingPace('slow');
      if (code === 'Digit2') this.setDrivingPace('normal');
      if (code === 'Digit3') this.setDrivingPace('fast');
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = false;
    });

    // Touch Controls
    const bindTouch = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', () => { this.keys[key] = true; });
      el.addEventListener('pointerup', () => { this.keys[key] = false; });
      el.addEventListener('pointerleave', () => { this.keys[key] = false; });
    };
    bindTouch('touch-left', 'left');
    bindTouch('touch-right', 'right');
    bindTouch('touch-gas', 'up');
    bindTouch('touch-brake', 'down');
  }

  startNewJourney() {
    const mpv = MPV_MODELS.find((m) => m.id === this.selectedMpvId) || MPV_MODELS[0];
    this.state = this.createInitialState(mpv);
    this.state.isPlaying = true;
    this.state.isPausedModal = false;

    this.spawnPlayerCar(mpv);
    this.world.setBiome(ROUTE_CHECKPOINTS[0].biome);
    const preset = this.world.applyWeather(ROUTE_CHECKPOINTS[0].defaultWeather);
    this.updateWeatherBadge(preset);
    this.refreshHighwayGantryForCheckpoint(0);

    document.getElementById('start-modal')?.classList.remove('active');
    document.getElementById('mpv-model-badge').textContent = mpv.name;

    this.setDrivingPace('normal');
    this.renderRouteNodes();
    this.renderInventory();
    this.updateHUD();
    this.showToast(`🚗 Bismillah! Berangkat mudik dari Bekasi menuju Surabaya dengan ${mpv.name}!`);
  }

  refreshHighwayGantryForCheckpoint(cpIdx) {
    const next1 = ROUTE_CHECKPOINTS[Math.min(cpIdx + 1, ROUTE_CHECKPOINTS.length - 1)];
    const next2 = ROUTE_CHECKPOINTS[Math.min(cpIdx + 2, ROUTE_CHECKPOINTS.length - 1)];
    const km1 = Math.max(10, next1.km - ROUTE_CHECKPOINTS[cpIdx].km);
    const km2 = Math.max(25, next2.km - ROUTE_CHECKPOINTS[cpIdx].km);

    this.world.updateGantrySignboards(
      `${next1.shortName.toUpperCase()} • ${next2.shortName.toUpperCase()}`,
      `${next1.shortName.toUpperCase()} ${km1} KM • ${next2.shortName.toUpperCase()} ${km2} KM`,
      'SURABAYA (JALUR UTAMA PANTURA)'
    );
  }

  setDrivingPace(pace) {
    this.audio.playClick();
    this.state.paceMode = pace;
    if (pace === 'slow') {
      this.state.targetSpeedKmh = 55;
      this.state.targetLaneX = -6.6;
    } else if (pace === 'normal') {
      this.state.targetSpeedKmh = 82;
    } else if (pace === 'fast') {
      this.state.targetSpeedKmh = 115;
      this.state.targetLaneX = -2.7;
    }

    document.querySelectorAll('.pace-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pace') === pace);
    });
  }

  toggleSteerMode() {
    this.audio.playClick();
    this.state.autoSteer = !this.state.autoSteer;
    const badge = document.getElementById('steer-mode-badge');
    const btnLbl = document.getElementById('steer-btn-label');
    if (this.state.autoSteer) {
      if (badge) badge.textContent = '🤖 AUTO-STIR';
      if (btnLbl) btnLbl.textContent = 'Setir: Auto';
      this.showToast('🤖 Auto-Stir Aktif: Bapak menyetir otomatis di Lajur Kiri & Kanan Pantura.');
    } else {
      if (badge) badge.textContent = '🛞 MANUAL (A/D)';
      if (btnLbl) btnLbl.textContent = 'Setir: Manual';
      this.showToast('🛞 Setir Manual Aktif: Gunakan tombol A/D atau Panah Kiri/Kanan.');
    }
  }

  cycleCamera() {
    this.audio.playClick();
    this.cameraModeIndex = (this.cameraModeIndex + 1) % this.cameraModes.length;
    const modeName = this.cameraModes[this.cameraModeIndex];
    const lbl = document.getElementById('camera-btn-label');
    if (lbl) lbl.textContent = `Kamera: ${modeName}`;
    this.showToast(`🎥 Sudut Kamera 3D: ${modeName}`);
  }

  toggleLights() {
    this.audio.playClick();
    this.lightsOn = !this.lightsOn;
    if (this.playerCar && this.playerCar.userData.lightGroup) {
      this.playerCar.userData.lightGroup.visible = this.lightsOn;
    }
    const lbl = document.getElementById('light-btn-label');
    if (lbl) lbl.textContent = `Lampu: ${this.lightsOn ? 'Nyala' : 'Mati'}`;
  }

  triggerHorn() {
    this.audio.playHorn();
    this.showToast('📯 Telolet! Klakson dibunyikan menyapa sesama pemudik Pantura!');
  }

  updateWeatherBadge(preset) {
    const badge = document.getElementById('weather-badge');
    if (badge) badge.textContent = preset.label;
  }

  // ==========================================================================
  // INTERACTIVE ROAD TRIP EVENT MODAL
  // ==========================================================================
  triggerRoadEvent(eventObj) {
    this.state.isPausedModal = true;
    this.audio.playEventAlert();

    const modal = document.getElementById('event-modal');
    document.getElementById('event-category-tag').textContent = eventObj.category;
    document.getElementById('event-km-tag').textContent = `KM ${Math.floor(this.state.distanceKm)}`;
    document.getElementById('event-icon-large').textContent = eventObj.icon;
    document.getElementById('event-location-pill').textContent = eventObj.location;
    document.getElementById('event-title').textContent = eventObj.title;
    document.getElementById('event-description').textContent = eventObj.description;

    const outcomeBox = document.getElementById('event-outcome-box');
    const choicesBox = document.getElementById('event-choices');
    const btnContinue = document.getElementById('btn-event-continue');

    outcomeBox.classList.add('hidden');
    choicesBox.classList.remove('hidden');
    btnContinue.classList.add('hidden');
    choicesBox.innerHTML = '';

    eventObj.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `
        <span class="choice-label">${choice.label}</span>
        <span class="choice-hint">${choice.hint}</span>
      `;

      btn.addEventListener('click', () => {
        this.audio.playItemUse();
        const result = choice.apply(this.state);
        this.renderInventory();
        this.updateHUD();

        choicesBox.classList.add('hidden');
        outcomeBox.classList.remove('hidden');
        document.getElementById('event-outcome-text').textContent = result.text;

        const deltasContainer = document.getElementById('event-outcome-deltas');
        deltasContainer.innerHTML = '';
        (result.deltas || []).forEach((d) => {
          const pill = document.createElement('span');
          const isNeg = d.startsWith('-');
          pill.className = `delta-pill ${isNeg ? 'delta-neg' : 'delta-pos'}`;
          pill.textContent = d;
          deltasContainer.appendChild(pill);
        });

        btnContinue.classList.remove('hidden');
        btnContinue.focus();
      });

      choicesBox.appendChild(btn);
    });

    btnContinue.onclick = () => {
      this.audio.playClick();
      modal.classList.remove('active');
      this.state.isPausedModal = false;
    };

    modal.classList.add('active');
  }

  // ==========================================================================
  // STOPOVER / POSKO MUDIK / WARUNG PECEL LELE / SPBU MODAL
  // ==========================================================================
  openStopoverModal(checkpointOverride = null) {
    this.state.isPausedModal = true;
    this.audio.playClick();

    const cp = checkpointOverride || ROUTE_CHECKPOINTS[this.state.checkpointIndex];
    const modal = document.getElementById('stopover-modal');
    document.getElementById('stopover-title').textContent = cp.stopoverTitle || `Posko Mudik ${cp.name}`;
    document.getElementById('stopover-subtitle').textContent =
      `KM ${Math.floor(this.state.distanceKm)} • Istirahatkan MPV, isi BBM di SPBU, atau belanja oleh-oleh khas ${cp.shortName}.`;

    this.renderStopoverShop(cp);
    modal.classList.add('active');
  }

  renderStopoverShop(cp) {
    document.getElementById('stopover-wallet-amount').textContent =
      `Rp ${this.state.cash.toLocaleString('id-ID')}`;

    const serviceList = document.getElementById('service-list');
    const souvenirList = document.getElementById('souvenir-shop-list');
    const feedbackEl = document.getElementById('stopover-feedback');

    const services = [
      {
        icon: '⛽',
        title: 'Isi Pertamax / Solar SPBU (+50% BBM)',
        sub: `BBM saat ini: ${Math.round(this.state.fuel)}%`,
        price: 65000,
        disabled: this.state.fuel >= 99 || this.state.cash < 65000,
        action: () => {
          this.state.cash -= 65000;
          this.state.fuel = Math.min(100, this.state.fuel + 50);
          return '⛽ Tangki BBM diisi di SPBU Pantura (+50% BBM).';
        }
      },
      {
        icon: '☕',
        title: 'Kopi Tubruk & Tidur Sejenak di Posko (+50% Fokus)',
        sub: `Fokus Bapak saat ini: ${Math.round(this.state.stamina)}%`,
        price: 25000,
        disabled: this.state.stamina >= 99 || this.state.cash < 25000,
        action: () => {
          this.state.cash -= 25000;
          this.state.stamina = Math.min(100, this.state.stamina + 50);
          this.state.mood = Math.min(100, this.state.mood + 10);
          return '☕ Bapak istirahat selonjoran dan minum kopi hangat (+50% Fokus, +10% Mood).';
        }
      },
      {
        icon: '🔧',
        title: 'Cek Bengkel Posko & Tambah Air Radiator (+45% Kondisi)',
        sub: `Kondisi MPV saat ini: ${Math.round(this.state.condition)}%`,
        price: 60000,
        disabled: this.state.condition >= 99 || this.state.cash < 60000,
        action: () => {
          this.state.cash -= 60000;
          this.state.condition = Math.min(100, this.state.condition + 45);
          this.state.tarpSecured = true;
          return '🔧 Montir Posko mengecek mesin, rem, dan mengencangkan terpal atap (+45% Kondisi MPV).';
        }
      },
      {
        icon: '🍛',
        title: 'Makan Malam Warung Tenda Sekeluarga (+45% Mood)',
        sub: `Mood Keluarga saat ini: ${Math.round(this.state.mood)}%`,
        price: 75000,
        disabled: this.state.mood >= 99 || this.state.cash < 75000,
        action: () => {
          this.state.cash -= 75000;
          this.state.mood = Math.min(100, this.state.mood + 45);
          this.state.stamina = Math.min(100, this.state.stamina + 15);
          return '🍛 Makan pecel lele & teh manis hangat bikin keluarga ceria lagi (+45% Mood, +15% Fokus)!';
        }
      }
    ];

    serviceList.innerHTML = '';
    services.forEach((srv) => {
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <div class="shop-item-info">
          <span class="shop-item-icon">${srv.icon}</span>
          <div>
            <div class="shop-item-title">${srv.title}</div>
            <div class="shop-item-sub">${srv.sub}</div>
          </div>
        </div>
        <button type="button" class="btn-buy" ${srv.disabled ? 'disabled' : ''}>
          Rp ${(srv.price / 1000)}rb
        </button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        this.audio.playItemUse();
        const msg = srv.action();
        feedbackEl.textContent = msg;
        this.updateHUD();
        this.renderStopoverShop(cp);
      });
      serviceList.appendChild(row);
    });

    const shopItemIds = [];
    if (cp.specialSouvenirId && ITEMS_CATALOG[cp.specialSouvenirId]) {
      shopItemIds.push(cp.specialSouvenirId);
    }
    ['kaleng_khongguan', 'kopi_kapal', 'tolak_angin', 'air_radiator', 'bensin_jerigen'].forEach((id) => {
      if (!shopItemIds.includes(id)) shopItemIds.push(id);
    });

    souvenirList.innerHTML = '';
    const isBagFull = this.state.inventory.length >= this.state.mpv.maxSlots;

    shopItemIds.slice(0, 4).forEach((itemId) => {
      const item = ITEMS_CATALOG[itemId];
      if (!item) return;
      const canBuy = !isBagFull && this.state.cash >= item.price;

      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <div class="shop-item-info">
          <span class="shop-item-icon">${item.icon}</span>
          <div>
            <div class="shop-item-title">${item.name}</div>
            <div class="shop-item-sub">${item.effectLabel}</div>
          </div>
        </div>
        <button type="button" class="btn-buy" ${!canBuy ? 'disabled' : ''}>
          ${isBagFull ? 'Penuh' : `Rp ${(item.price / 1000)}rb`}
        </button>
      `;

      row.querySelector('button').addEventListener('click', () => {
        if (this.state.inventory.length >= this.state.mpv.maxSlots) return;
        this.audio.playItemUse();
        this.state.cash -= item.price;
        this.state.inventory.push(item.id);
        feedbackEl.textContent = `🎁 ${item.name} berhasil dimasukkan ke Roofbox/Bagasi MPV!`;
        this.renderInventory();
        this.updateHUD();
        this.renderStopoverShop(cp);
      });

      souvenirList.appendChild(row);
    });
  }

  closeStopoverModal() {
    document.getElementById('stopover-modal')?.classList.remove('active');
    this.state.isPausedModal = false;
  }

  // ==========================================================================
  // COLLISION & POTHOLE HANDLERS
  // ==========================================================================
  handleTrafficCollision(vehicle) {
    if (!this.state.isPlaying || this.state.isPausedModal) return;
    this.audio.playPotholeHit();

    const dmg = Math.round(14 / this.state.mpv.durability);
    this.state.condition = Math.max(5, this.state.condition - dmg);
    this.state.mood = Math.max(5, this.state.mood - 12);
    this.state.speedKmh = Math.max(30, this.state.speedKmh * 0.65);

    const vName = vehicle.type === 'bus_pantura'
      ? 'Bus Malam Pantura'
      : vehicle.type === 'truk_canter'
        ? 'Truk Canter'
        : 'Kendaraan Lain';

    this.showToast(`⚠️ Hati-hati Pak! Terserempet ${vName} (-${dmg}% Kondisi MPV, -12% Mood)`);
    this.setFamilyChatter('Ibu di Kursi Depan', '👩', `Astagfirullah Pak! Jaga jarak aman sama ${vName} itu ya!`);
    this.updateHUD();
  }

  handlePotholeHit() {
    if (!this.state.isPlaying || this.state.isPausedModal) return;
    this.audio.playPotholeHit();

    const dmg = Math.round(8 / this.state.mpv.durability);
    this.state.condition = Math.max(5, this.state.condition - dmg);
    this.state.mood = Math.max(5, this.state.mood - 6);

    if (Math.random() < 0.35 && this.state.tarpSecured) {
      this.state.tarpSecured = false;
      this.updateRoofCargo3D();
      this.showToast(`🕳️ Gubrak! Kena lubang jalanan (-${dmg}% Kondisi MPV & Ikatan Terpal Atap Kendur!)`);
    } else {
      this.showToast(`🕳️ Gubrak! Menghantam lubang aspal Pantura (-${dmg}% Kondisi MPV)`);
    }
    this.updateHUD();
  }

  // ==========================================================================
  // CHECKPOINT & VICTORY / EMERGENCY RESCUE LOGIC
  // ==========================================================================
  checkRouteProgression() {
    if (this.state.distanceKm >= TOTAL_ROUTE_KM) {
      this.state.distanceKm = TOTAL_ROUTE_KM;
      this.triggerArrivalVictory();
      return;
    }

    const nextIdx = this.state.checkpointIndex + 1;
    if (nextIdx < ROUTE_CHECKPOINTS.length - 1) {
      const nextCp = ROUTE_CHECKPOINTS[nextIdx];
      if (this.state.distanceKm >= nextCp.km) {
        this.state.checkpointIndex = nextIdx;
        this.audio.playCheckpointReached();
        this.world.setBiome(nextCp.biome);
        const preset = this.world.applyWeather(nextCp.defaultWeather);
        this.updateWeatherBadge(preset);
        this.refreshHighwayGantryForCheckpoint(nextIdx);

        this.renderRouteNodes();
        this.setFamilyChatter(
          nextCp.arrivalChatter.speaker,
          nextCp.arrivalChatter.avatar,
          nextCp.arrivalChatter.text
        );
        this.showToast(`📍 Tiba di ${nextCp.name} (KM ${nextCp.km})!`);
      }
    }
  }

  checkEmergencyVitals() {
    if (this.state.fuel <= 0 || this.state.condition <= 0 || this.state.stamina <= 0) {
      const rescueCost = 120000;
      this.audio.playEventAlert();

      if (this.state.cash >= rescueCost) {
        this.state.cash -= rescueCost;
        if (this.state.fuel <= 0) this.state.fuel = 45;
        if (this.state.condition <= 0) this.state.condition = 45;
        if (this.state.stamina <= 0) this.state.stamina = 50;
        this.state.mood = Math.max(10, this.state.mood - 12);
        this.showToast('🚑 Petugas Posko Mudik Darurat membantu Bapak di bahu jalan (-Rp 120.000)!');
        this.openStopoverModal();
      } else {
        this.triggerStrandedEnding();
      }
    }
  }

  triggerArrivalVictory() {
    this.state.isPausedModal = true;
    this.state.isPlaying = false;
    this.audio.playCheckpointReached();

    const modal = document.getElementById('ending-modal');
    document.getElementById('ending-badge').textContent = 'ALHAMDULILLAH • MUDIK BERHASIL!';
    document.getElementById('ending-icon').textContent = '🏡';
    document.getElementById('ending-title').textContent = 'TIBA DI SURABAYA — KAMPUNG HALAMAN!';

    let souvenirBonus = 0;
    const souvListEl = document.getElementById('ending-souvenirs-list');
    souvListEl.innerHTML = '';

    if (this.state.inventory.length === 0) {
      souvListEl.innerHTML = '<span class="delta-pill">Semua bekal habis dimakan di perjalanan</span>';
    } else {
      this.state.inventory.forEach((id) => {
        const item = ITEMS_CATALOG[id];
        if (!item) return;
        souvenirBonus += item.points;
        const badge = document.createElement('span');
        badge.className = 'delta-pill delta-pos';
        badge.textContent = `${item.icon} ${item.name} (+${item.points} Poin)`;
        souvListEl.appendChild(badge);
      });
    }

    const totalScore = Math.round(
      souvenirBonus +
      (this.state.mood * 12) +
      (this.state.condition * 8) +
      (this.state.cash / 1000)
    );

    let rankTitle = 'Pemudik Tangguh Pantura';
    if (totalScore >= 3200) rankTitle = '👑 Legenda Mudik Teladan (Nenek Super Bahagia!)';
    else if (totalScore >= 2400) rankTitle = '🌟 Kapten Keluarga Kebanggaan Ibu';

    document.getElementById('ending-description').textContent =
      `Setelah menempuh 780 KM membelah jalur Pantura dari Bekasi hingga Surabaya, mobil ${this.state.mpv.name} akhirnya berhenti di halaman rumah Ibu. Suara takbir berkumandang dan seluruh keluarga menyambut dengan pelukan hangat! Predikat Anda: ${rankTitle}.`;

    const statsGrid = document.getElementById('ending-stats-grid');
    statsGrid.innerHTML = `
      <div class="ending-stat-box">
        <div class="ending-stat-val">780 KM</div>
        <div class="ending-stat-lbl">Jarak Tempuh</div>
      </div>
      <div class="ending-stat-box">
        <div class="ending-stat-val">Rp ${(this.state.cash / 1000).toFixed(0)}rb</div>
        <div class="ending-stat-lbl">Sisa THR Lebaran</div>
      </div>
      <div class="ending-stat-box">
        <div class="ending-stat-val">${Math.round(this.state.mood)}%</div>
        <div class="ending-stat-lbl">Kebahagiaan Keluarga</div>
      </div>
      <div class="ending-stat-box">
        <div class="ending-stat-val">${totalScore.toLocaleString('id-ID')}</div>
        <div class="ending-stat-lbl">Skor Total Mudik</div>
      </div>
    `;

    modal.classList.add('active');
  }

  triggerStrandedEnding() {
    this.state.isPausedModal = true;
    this.state.isPlaying = false;

    const modal = document.getElementById('ending-modal');
    document.getElementById('ending-badge').textContent = 'PERJALANAN TERTUNDA DI POSKO';
    document.getElementById('ending-icon').textContent = '⛺';
    document.getElementById('ending-title').textContent = 'ISTIRAHAT TOTAL DI POSKO MUDIK PANTURA';
    document.getElementById('ending-description').textContent =
      `Pada KM ${Math.floor(this.state.distanceKm)}, bensin/kondisi mobil dan bekal uang THR Bapak telah habis. Untungnya petugas Posko Mudik membantu keluarga Bapak beristirahat dengan aman sebelum melanjutkan perjalanan esok hari.`;

    const statsGrid = document.getElementById('ending-stats-grid');
    statsGrid.innerHTML = `
      <div class="ending-stat-box">
        <div class="ending-stat-val">KM ${Math.floor(this.state.distanceKm)}</div>
        <div class="ending-stat-lbl">Posisi Terakhir</div>
      </div>
      <div class="ending-stat-box">
        <div class="ending-stat-val">Rp ${this.state.cash.toLocaleString('id-ID')}</div>
        <div class="ending-stat-lbl">Sisa Uang</div>
      </div>
      <div class="ending-stat-box">
        <div class="ending-stat-val">${Math.round(this.state.mood)}%</div>
        <div class="ending-stat-lbl">Mood Keluarga</div>
      </div>
      <div class="ending-stat-box">
        <div class="ending-stat-val">${this.state.inventory.length} Paket</div>
        <div class="ending-stat-lbl">Sisa Barang Atap</div>
      </div>
    `;

    modal.classList.add('active');
  }

  // ==========================================================================
  // HUD UPDATER
  // ==========================================================================
  updateHUD() {
    const s = this.state;
    const cp = ROUTE_CHECKPOINTS[s.checkpointIndex] || ROUTE_CHECKPOINTS[0];
    const nextCp = ROUTE_CHECKPOINTS[Math.min(s.checkpointIndex + 1, ROUTE_CHECKPOINTS.length - 1)];

    document.getElementById('current-city-name').textContent = cp.name.toUpperCase();
    document.getElementById('current-city-desc').textContent = cp.subtitle;

    const pct = Math.min(100, (s.distanceKm / TOTAL_ROUTE_KM) * 100);
    document.getElementById('km-counter').textContent = `KM ${Math.floor(s.distanceKm)} / ${TOTAL_ROUTE_KM} KM`;
    document.getElementById('route-track-fill').style.width = `${pct}%`;
    document.getElementById('route-car-marker').style.left = `${pct}%`;

    const kmLeftToNext = Math.max(0, Math.ceil(nextCp.km - s.distanceKm));
    document.getElementById('next-checkpoint-label').innerHTML =
      `Kota Berikutnya: <strong>${nextCp.shortName} (${kmLeftToNext} KM lagi)</strong>`;

    const totalMins = Math.floor(s.gameMinutes) % (24 * 60);
    const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const mm = String(totalMins % 60).padStart(2, '0');
    document.getElementById('clock-display').textContent = `🕒 Arus Mudik • ${hh}:${mm} WIB`;

    document.getElementById('thr-value').textContent = `Rp ${s.cash.toLocaleString('id-ID')}`;

    const setBar = (barId, textId, val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      const bar = document.getElementById(barId);
      const txt = document.getElementById(textId);
      if (bar) {
        bar.style.width = `${clamped}%`;
        bar.classList.toggle('fill-danger', clamped <= 24);
      }
      if (txt) txt.textContent = `${clamped}%`;
    };

    setBar('fuel-bar', 'fuel-text', s.fuel);
    setBar('stamina-bar', 'stamina-text', s.stamina);
    setBar('condition-bar', 'condition-text', s.condition);
    setBar('mood-bar', 'mood-text', s.mood);

    const overlay = document.getElementById('weather-overlay');
    if (overlay) {
      overlay.classList.toggle('drowsy-warning', s.stamina < 25);
    }

    const tarpText = document.getElementById('tarp-status-text');
    if (tarpText) {
      tarpText.textContent = s.tarpSecured
        ? 'Terpasang Rapi (Aman dari Hujan)'
        : '⚠️ Ikatan Agak Longgar (Klik Cek Ikatan!)';
      tarpText.style.color = s.tarpSecured ? '#4ade80' : '#fb7185';
    }

    const spd = Math.round(s.speedKmh);
    document.getElementById('speed-display').textContent = String(spd);
    const gear = spd < 25 ? 'GIGI 2' : spd < 55 ? 'GIGI 3' : spd < 85 ? 'GIGI 4' : 'GIGI 5';
    document.getElementById('gear-badge').textContent = gear;
  }

  // ==========================================================================
  // MAIN SIMULATION & 3D RENDER LOOP
  // ==========================================================================
  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const s = this.state;
    const isDrivingActive = s.isPlaying && !s.isPausedModal;

    this.audio.updateEngine(s.speedKmh, !isDrivingActive);

    if (isDrivingActive) {
      // 1. Speed & Acceleration
      let desiredSpeed = s.targetSpeedKmh;
      if (this.keys.up) desiredSpeed += 22;
      if (this.keys.down) desiredSpeed = Math.max(25, desiredSpeed - 38);

      s.speedKmh += (desiredSpeed - s.speedKmh) * 3.2 * dt;

      // 2. Steering across Real 1:1 Eastbound Lanes (-6.6m Lajur Kiri & -2.7m Lajur Kanan)
      if (this.keys.left || this.keys.right) {
        const dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
        s.playerX += dir * 7.5 * dt;
        s.steerVelocity = dir;
      } else if (s.autoSteer) {
        // Smart Auto-Steer between Lajur Kiri (-6.6m) & Lajur Kanan (-2.7m)
        const obstacleAhead = this.world.traffic.find(
          (v) => !v.isOncoming &&
            v.mesh.position.z < -2 &&
            v.mesh.position.z > -48 &&
            Math.abs(v.mesh.position.x - s.playerX) < 1.85
        );
        if (obstacleAhead) {
          s.targetLaneX = obstacleAhead.laneX < -4.5 ? -2.7 : -6.6;
        }
        const diff = s.targetLaneX - s.playerX;
        s.playerX += diff * 3.4 * dt;
        s.steerVelocity = THREE.MathUtils.clamp(diff * 0.45, -1, 1);
      } else {
        s.steerVelocity *= 0.85;
      }

      // Clamp to Eastbound carriageway (from Left Shoulder -9.5m up to Median Barrier -1.55m)
      s.playerX = THREE.MathUtils.clamp(s.playerX, -9.5, -1.55);

      // 3. Distance & Time Progression
      const kmGain = (s.speedKmh * 0.0145) * dt;
      s.distanceKm += kmGain;
      s.gameMinutes += dt * 2.4;

      // 4. Resource Drain Formulas
      const paceFactor = s.paceMode === 'fast' ? 1.42 : s.paceMode === 'slow' ? 0.72 : 1.0;
      s.fuel = Math.max(0, s.fuel - (0.36 * paceFactor / s.mpv.fuelEfficiency) * dt);
      s.stamina = Math.max(0, s.stamina - (0.32 * paceFactor) * dt);
      s.condition = Math.max(0, s.condition - (0.11 * paceFactor / s.mpv.durability) * dt);
      s.mood = Math.max(0, s.mood - (0.18 / s.mpv.moodStability) * dt);

      if (this.world.currentWeatherKey === 'rain' && !s.tarpSecured && s.inventory.length > 0) {
        s.rainDamageTimer += dt;
        if (s.rainDamageTimer > 9.0) {
          s.rainDamageTimer = 0;
          s.mood = Math.max(5, s.mood - 8);
          this.showToast('🌧️ Hujan deras! Segera klik "Cek Ikatan" agar oleh-oleh di atap tidak basah!');
        }
      }

      // 5. Ambient Family Chatter Timer
      s.chatterTimer += dt;
      if (s.chatterTimer > 16.0) {
        s.chatterTimer = 0;
        if (s.fuel < 28) {
          this.setFamilyChatter('Ibu di Kursi Depan', '👩', 'Pak, jarum bensin sudah mulai turun tuh. Kita menepi ke SPBU Pantura di kiri jalan atau tuang jerigen cadangan yuk!');
        } else if (s.stamina < 28) {
          this.setFamilyChatter('Ibu di Kursi Depan', '👩', 'Pak, matanya sudah kelihatan ngantuk banget. Minum Kopi Hitam di bagasi atau istirahat di Rest Area dulu ya!');
        } else {
          const line = AMBIENT_CHATTER_POOL[Math.floor(Math.random() * AMBIENT_CHATTER_POOL.length)];
          this.setFamilyChatter(line.speaker, line.avatar, line.text);
        }
      }

      // 6. Trigger Narrative Road Event at Scheduled KM
      if (s.distanceKm >= s.nextEventKm && s.distanceKm < TOTAL_ROUTE_KM - 15) {
        s.nextEventKm = s.distanceKm + 52 + Math.random() * 22;
        const candidates = PANTURA_EVENTS.filter(
          (ev) => s.distanceKm >= ev.minKm &&
            s.distanceKm <= ev.maxKm &&
            !s.usedEventIds.has(ev.id)
        );
        const pool = candidates.length > 0 ? candidates : PANTURA_EVENTS;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        s.usedEventIds.add(chosen.id);
        this.triggerRoadEvent(chosen);
      }

      this.checkRouteProgression();
      this.checkEmergencyVitals();
      this.updateHUD();
    }

    // 7. Update 3D Player MPV Position, Suspension & Wheel Rotation
    if (this.playerCar) {
      this.playerCar.position.x = s.playerX;
      const bodyGroup = this.playerCar.userData.bodyGroup;
      if (bodyGroup) {
        bodyGroup.rotation.z = -s.steerVelocity * 0.05;
        bodyGroup.position.y = Math.sin(now * 0.012) * 0.02;
      }
      const wheels = this.playerCar.userData.wheels || [];
      wheels.forEach((w) => {
        w.rotation.x -= (s.speedKmh * 0.15) * dt;
      });
    }

    // 8. Update 3D Camera (4 Modes tuned for Real 1:1 Highway Scale)
    this.updateCamera(dt);

    // 9. Update 3D World & Traffic
    const activeSpeed = isDrivingActive ? s.speedKmh : 20;
    this.world.update(
      dt,
      activeSpeed,
      s.playerX,
      s.autoSteer,
      (v) => this.handleTrafficCollision(v),
      () => this.handlePotholeHit()
    );

    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(dt) {
    const px = this.state.playerX;
    let desiredPos;
    let desiredLook;

    if (this.cameraModeIndex === 0) {
      // Mode 0: Indie Stylized Elevated Follow (Shows 4-lane highway, Overhead Gantries, SPBU & Bridge trusses)
      desiredPos = new THREE.Vector3(px - 2.6, 6.8, 12.8);
      desiredLook = new THREE.Vector3(px + 0.4, 2.2, -26.0);
    } else if (this.cameraModeIndex === 1) {
      // Mode 1: Real-Scale Low Chase Camera (Highlights towering SHD buses, 9.8m bridges & overhead signs)
      desiredPos = new THREE.Vector3(px, 2.85, 7.2);
      desiredLook = new THREE.Vector3(px, 2.1, -34.0);
    } else if (this.cameraModeIndex === 2) {
      // Mode 2: Hood / Kap POV Camera (True 1:1 driver perspective looking up at 7.4m Gantry Signs & SPBU!)
      desiredPos = new THREE.Vector3(px + 0.42, 1.58, -0.55);
      desiredLook = new THREE.Vector3(px + 0.2, 2.15, -45.0);
    } else {
      // Mode 3: Cinematic Roadside Cruiser
      desiredPos = new THREE.Vector3(px - 6.2, 3.8, 8.8);
      desiredLook = new THREE.Vector3(px + 1.5, 2.0, -18.0);
    }

    this.camera.position.lerp(desiredPos, 6.0 * dt);
    this.cameraTarget.lerp(desiredLook, 7.0 * dt);
    this.camera.lookAt(this.cameraTarget);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.panturaGame = new PanturaMudikGame();
});
