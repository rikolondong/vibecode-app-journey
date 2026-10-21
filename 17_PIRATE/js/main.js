// Main Entry Point — Lautan Tak Bertuan (Indie Pirate Game)
import * as THREE from 'three';
import { SkySystem } from './sky.js';
import { createWater } from './water.js';
import {
  generateIslands, buildWorld, islands, pickTreasureSpot,
  createXMarker, islandAt, MAP_HALF, WORLD_LIMIT
} from './world.js';
import { Ship, WIND } from './ship.js';
import { Player } from './player.js';
import { CombatSystem } from './combat.js';
import { audio } from './audio.js';

class PirateGame {
  constructor() {
    this.state = 'LOADING'; // 'LOADING' | 'MENU' | 'PLAYING' | 'PAUSED' | 'DEAD' | 'WIN'
    this.currentVoyage = null;
    this.xMarkerMesh = null;
    this.currentIsland = null;

    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.bigmapCanvas = document.getElementById('bigmapCanvas');
    this.bigmapCtx = this.bigmapCanvas.getContext('2d');
    this.isBigMapOpen = false;

    this.initThree();
    this.initGameWorld();
    this.initEvents();
    this.initUI();

    // Selesai memuat
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    this.state = 'MENU';

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xa8d2f0, 0.002);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 4000);
    this.camera.position.set(0, 10, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initGameWorld() {
    // 1. Buat Pulau Prosedural
    generateIslands(1337);
    const { heightTexture, mapCanvas, outpost } = buildWorld(this.scene);
    this.mapBackground = mapCanvas;
    this.outpost = outpost;

    // 2. Langit & Cahaya
    this.sky = new SkySystem(this.scene);

    // 3. Permukaan Air Laut
    this.water = createWater(heightTexture, MAP_HALF);
    this.scene.add(this.water.mesh);

    // 4. Kapal Pemain (Spawn di samping dermaga Outpost)
    this.playerShip = new Ship(this.scene, {
      x: outpost.spawn.x,
      z: outpost.spawn.z,
      heading: outpost.spawnHeading,
      color: 0x5a341a,
      sailAmount: 0,
      isAnchored: true,
    });

    // 5. Karakter Pemain
    this.player = new Player(this.scene, this.camera, this.playerShip);
    window.__piratePlayer = this.player;

    // 6. Sistem Tempur & Kapal Musuh
    this.combat = new CombatSystem(this.scene, this.playerShip);

    // 7. Mulai Voyage Pertama (Peta Harta Karun)
    this.newVoyage();

    // Pastikan posisi awal kapal, kamera, dan langit langsung tersinkronisasi di pelabuhan
    this.playerShip.update(0, 0);
    this.player.update(0, 0, this.currentVoyage);
    this.sky.update(0, this.playerShip.pos, this.camera.position);
    this.water.update(0, this.camera.position, this.sky, this.scene.fog);
  }

  newVoyage() {
    if (this.xMarkerMesh) {
      this.scene.remove(this.xMarkerMesh);
      this.xMarkerMesh = null;
    }

    const spot = pickTreasureSpot(this.currentVoyage ? this.currentVoyage.islandName : null);
    if (!spot) return;

    const chestNames = [
      'Peti Pelaut Kuno', 'Peti Kapten Perkasa', 'Peti Emas Terkutuk',
      'Peti Seribu Belati', 'Peti Tengkorak Rubin', 'Peti Karang Laut'
    ];
    const cName = chestNames[Math.floor(Math.random() * chestNames.length)];
    const cVal = 400 + Math.floor(Math.random() * 500);

    this.currentVoyage = {
      islandName: spot.isl.name,
      spot: spot,
      chestName: cName,
      chestValue: cVal,
      isDug: false,
    };

    // Pasang Tanda Silang Merah (X Marks the Spot)
    this.xMarkerMesh = createXMarker();
    this.xMarkerMesh.position.set(spot.x, spot.y + 0.1, spot.z);
    this.scene.add(this.xMarkerMesh);

    this.notify(`📜 Pelayaran Baru: Cari harta karun di [${spot.isl.name}]!`, 'good');
  }

  notify(text, type = 'normal') {
    const box = document.getElementById('notifs');
    if (!box) return;
    const n = document.createElement('div');
    n.className = `notif ${type}`;
    n.innerHTML = text;
    box.appendChild(n);
    setTimeout(() => {
      if (n.parentNode) n.parentNode.removeChild(n);
    }, 4200);
  }

  initEvents() {
    // Tombol Mulai
    document.getElementById('startBtn').addEventListener('click', () => {
      audio.init();
      audio.startShanty();
      document.getElementById('menu').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.state = 'PLAYING';
      document.body.requestPointerLock();
    });

    document.getElementById('continueBtn').addEventListener('click', () => {
      document.getElementById('win').classList.add('hidden');
      this.state = 'PLAYING';
      document.body.requestPointerLock();
    });

    // Pointer Lock & Pergerakan Mouse
    document.addEventListener('click', () => {
      if (this.state === 'PLAYING' && document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      } else if (this.state === 'PAUSED') {
        document.getElementById('pause').classList.add('hidden');
        this.state = 'PLAYING';
        document.body.requestPointerLock();
      } else if (this.state === 'DEAD') {
        this.respawnPlayerShip();
        document.getElementById('dead').classList.add('hidden');
        this.state = 'PLAYING';
        document.body.requestPointerLock();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.state !== 'PLAYING' || document.pointerLockElement !== document.body) return;
      const sens = 0.0028;
      this.player.yaw -= e.movementX * sens;
      this.player.pitch = THREE.MathUtils.clamp(
        this.player.pitch - e.movementY * sens,
        -Math.PI / 3,
        Math.PI / 3
      );
    });

    // Tembak Meriam (Klik Kiri)
    document.addEventListener('mousedown', (e) => {
      if (this.state !== 'PLAYING' || e.button !== 0 || document.pointerLockElement !== document.body) return;

      if (this.player.mode === 'ship') {
        if (this.player.ammo <= 0) {
          this.notify('⚫ Peluru meriam habis! Beli di pelabuhan.', 'danger');
          return;
        }

        const fired = this.playerShip.fireBroadside(this.player.yaw, (pos, dir) => {
          this.combat.spawnCannonball(pos, dir, this.playerShip);
        });

        if (fired) {
          this.player.ammo--;
        }
      }
    });

    // Keyboard Input
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.player.keys[e.code] = true;

      if (e.code === 'KeyM') {
        this.toggleBigMap();
      } else if (e.code === 'KeyH') {
        const h = document.getElementById('help');
        h.classList.toggle('hidden');
      } else if (e.code === 'KeyK') {
        const on = audio.toggleMusic();
        this.notify(on ? '🎵 Musik Laut Aktif' : '🔇 Musik Laut Hening');
      } else if (e.code === 'KeyX' && this.player.mode === 'ship') {
        const anchored = this.playerShip.toggleAnchor();
        this.notify(anchored ? '⚓ Jangkar Diturunkan' : '⚓ Jangkar Dinaikkan');
      } else if (e.code === 'KeyE') {
        this.handleInteractE();
      } else if (e.code === 'KeyT') {
        this.handleSellChests();
      } else if (e.code === 'KeyB') {
        this.handleBuyAmmo();
      } else if (e.code === 'KeyN') {
        this.handleBuyPlanks();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.player.keys[e.code] = false;
    });

    // Pointer lock change (Pause saat lepas mouse / Esc)
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== document.body && this.state === 'PLAYING') {
        this.state = 'PAUSED';
        document.getElementById('pause').classList.remove('hidden');
      }
    });
  }

  handleInteractE() {
    if (this.player.mode === 'ship') {
      // Turun dari kapal ke pulau/air
      this.player.disembark();
      this.notify('👟 Turun dari kapal');
    } else {
      // Sedang berjalan kaki:
      const dShip = this.player.pos.distanceTo(this.playerShip.pos);
      if (dShip < 7.5) {
        if (this.player.carriedChest) {
          this.player.stowChestToShip();
          this.notify(`📦 Menyimpan [${this.playerShip.chestsInHold[this.playerShip.chestsInHold.length - 1].name}] ke dalam kapal!`, 'good');
        } else {
          this.player.boardShip();
          this.notify('⛵ Kembali ke kemudi kapal');
        }
      }
    }
  }

  handleSellChests() {
    const dOutpost = this.player.mode === 'ship'
      ? this.playerShip.pos.distanceTo(this.outpost.dockPoint)
      : this.player.pos.distanceTo(this.outpost.dockPoint);

    if (dOutpost < 50) {
      let soldCount = 0;
      let totalEarned = 0;

      // Jual peti yang digotong pemain
      if (this.player.carriedChest) {
        totalEarned += this.player.carriedChest.value;
        this.player.carriedChest = null;
        if (this.player.heldChestMesh) this.player.heldChestMesh.visible = false;
        soldCount++;
      }

      // Jual seluruh peti di palka kapal
      const cargo = this.playerShip.offloadChests();
      cargo.forEach((c) => {
        totalEarned += c.value;
        soldCount++;
      });

      if (soldCount > 0) {
        this.player.gold += totalEarned;
        audio.playCoin();
        this.notify(`💰 Berhasil menjual ${soldCount} peti karun seharga +${totalEarned} Emas!`, 'good');

        // Cek target Legenda Bajak Laut (5000 Emas)
        if (this.player.gold >= 5000 && this.state !== 'WIN') {
          this.state = 'WIN';
          document.exitPointerLock();
          document.getElementById('win').classList.remove('hidden');
        }

        // Terbitkan pelayaran baru
        this.newVoyage();
      } else {
        this.notify('📦 Tidak ada peti karun untuk dijual saat ini.');
      }
    }
  }

  handleBuyAmmo() {
    const dOutpost = this.player.mode === 'ship'
      ? this.playerShip.pos.distanceTo(this.outpost.dockPoint)
      : this.player.pos.distanceTo(this.outpost.dockPoint);

    if (dOutpost < 50) {
      if (this.player.gold >= 100) {
        this.player.gold -= 100;
        this.player.ammo += 12;
        audio.playCoin();
        this.notify('⚫ Membeli 12 Peluru Meriam (-100 Emas)');
      } else {
        this.notify('💰 Emas tidak cukup untuk membeli peluru!', 'danger');
      }
    }
  }

  handleBuyPlanks() {
    const dOutpost = this.player.mode === 'ship'
      ? this.playerShip.pos.distanceTo(this.outpost.dockPoint)
      : this.player.pos.distanceTo(this.outpost.dockPoint);

    if (dOutpost < 50) {
      if (this.player.gold >= 100) {
        this.player.gold -= 100;
        this.player.planks += 6;
        audio.playCoin();
        this.notify('🪵 Membeli 6 Papan Kayu (-100 Emas)');
      } else {
        this.notify('💰 Emas tidak cukup untuk membeli papan kayu!', 'danger');
      }
    }
  }

  toggleBigMap() {
    this.isBigMapOpen = !this.isBigMapOpen;
    const bm = document.getElementById('bigmap');
    if (this.isBigMapOpen) {
      bm.classList.remove('hidden');
      this.renderBigMap();
    } else {
      bm.classList.add('hidden');
    }
  }

  respawnPlayerShip() {
    // Siapkan kapal baru di perairan pelabuhan
    this.playerShip.pos.copy(this.outpost.spawn);
    this.playerShip.heading = this.outpost.spawnHeading;
    this.playerShip.updatePosition(this.playerShip.pos.x, this.playerShip.pos.z);
    this.playerShip.speed = 0;
    this.playerShip.water = 0;
    this.playerShip.holes = 0;
    this.playerShip.isSunk = false;
    this.playerShip.sailAmount = 0;
    this.playerShip.isAnchored = true;
    this.playerShip.chestsInHold = [];
    this.playerShip.refreshChestModels();

    this.player.yaw = this.outpost.spawnHeading;
    this.player.carriedChest = null;
    if (this.player.heldChestMesh) this.player.heldChestMesh.visible = false;
    this.player.boardShip();
    this.playerShip.update(0, 0);
    this.player.update(0, 0, this.currentVoyage);
    this.notify('⛵ Kapal barumu telah siap di perairan Pelabuhan Sanggar!');
  }

  initUI() {
    this.ui = {
      gold: document.getElementById('gold'),
      hold: document.getElementById('hold'),
      ammo: document.getElementById('ammo'),
      planks: document.getElementById('planks'),
      kills: document.getElementById('kills'),
      goalText: document.getElementById('goalText'),
      goalBar: document.getElementById('goalBar'),
      quest: document.getElementById('quest'),
      sailBar: document.getElementById('sailBar'),
      waterBar: document.getElementById('waterBar'),
      holes: document.getElementById('holes'),
      speed: document.getElementById('speed'),
      anchor: document.getElementById('anchor'),
      prompt: document.getElementById('prompt'),
      progress: document.getElementById('progress'),
      progressBar: document.getElementById('progressBar'),
      windArrow: document.getElementById('windArrow'),
    };
  }

  updateHUD() {
    const u = this.ui;
    u.gold.textContent = this.player.gold;
    u.hold.textContent = this.playerShip.chestsInHold.length + (this.player.carriedChest ? ' (+1 digotong)' : '');
    u.ammo.textContent = this.player.ammo;
    u.planks.textContent = this.player.planks;
    u.kills.textContent = this.player.skeletonKills;

    // Progress Menuju Legenda (5000 Emas)
    const pct = Math.min(100, (this.player.gold / 5000) * 100);
    u.goalText.textContent = `${this.player.gold} / 5000`;
    u.goalBar.style.width = `${pct}%`;

    // Voyage / Misi Aktif
    if (this.currentVoyage) {
      if (this.currentVoyage.isDug) {
        u.quest.innerHTML = `<span class="t">Harta Karun Tergali!</span><br>Bawa kembali ke Pelabuhan Sanggar untuk dijual seharga ~${this.currentVoyage.chestValue} Emas!`;
      } else {
        u.quest.innerHTML = `<span class="t">Peta Emas [${this.currentVoyage.islandName}]</span><br>Layar ke pulau dan gali di tanda silang <span class="red">✕</span>!`;
      }
    }

    // Panel Kapal
    u.sailBar.style.width = `${Math.round(this.playerShip.sailAmount * 100)}%`;
    u.waterBar.style.width = `${Math.round(this.playerShip.water)}%`;
    u.holes.textContent = this.playerShip.holes;
    u.holes.className = this.playerShip.holes > 0 ? 'bad' : '';
    u.speed.textContent = `${Math.abs(Math.round(this.playerShip.speed))} knot`;
    u.anchor.textContent = this.playerShip.isAnchored ? 'Turun' : 'Naik';

    // Arah Angin
    const deg = (WIND.angle * 180) / Math.PI;
    u.windArrow.style.transform = `rotate(${deg}deg)`;

    // Panduan Tombol Kontekstual (Prompts)
    let promptMsg = '';
    const dOutpost = this.playerShip.pos.distanceTo(this.outpost.dockPoint);

    if (this.player.mode === 'ship') {
      promptMsg = `<kbd>W</kbd>/<kbd>S</kbd> Layar · <kbd>A</kbd>/<kbd>D</kbd> Belok · <kbd>Klik Kiri</kbd> Tembak · <kbd>X</kbd> Jangkar · <kbd>E</kbd> Turun`;
      if (this.playerShip.holes > 0) {
        promptMsg += `<br><span class="red">⚠️ Kapal bocor! Tahan <kbd>R</kbd> untuk menambal papan kayu</span>`;
      }
      if (dOutpost < 50) {
        promptMsg += `<br><kbd>T</kbd> Jual Harta · <kbd>B</kbd> Beli Peluru (100E) · <kbd>N</kbd> Beli Kayu (100E)`;
      }
    } else {
      // Mode Jalan Kaki
      const dShip = this.player.pos.distanceTo(this.playerShip.pos);
      if (dShip < 7.5) {
        if (this.player.carriedChest) {
          promptMsg = `<kbd>E</kbd> Simpan Peti ke Kapal`;
        } else {
          promptMsg = `<kbd>E</kbd> Naik ke Kemudi Kapal`;
        }
      } else if (this.currentVoyage && !this.currentVoyage.isDug) {
        const dX = Math.hypot(this.player.pos.x - this.currentVoyage.spot.x, this.player.pos.z - this.currentVoyage.spot.z);
        if (dX < 3.8) {
          promptMsg = `⭐ Dekat dengan Harta Karun! Tahan <kbd>F</kbd> untuk Menggali`;
        } else {
          promptMsg = `<kbd>WASD</kbd> Jalan · <kbd>Shift</kbd> Lari · <kbd>Spasi</kbd> Lompat · Cari tanda silang ✕`;
        }
      }
    }
    u.prompt.innerHTML = promptMsg;

    // Bar Progress Menggali / Menambal
    if (this.player.actionProgress > 0) {
      u.progress.classList.remove('hidden');
      u.progressBar.style.width = `${Math.round(this.player.actionProgress * 100)}%`;
    } else {
      u.progress.classList.add('hidden');
    }
  }

  renderMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width, h = this.minimapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const shipPos = (this.player.mode === 'foot') ? this.player.pos : this.playerShip.pos;
    const heading = (this.player.mode === 'foot') ? this.player.yaw : this.playerShip.heading;

    ctx.save();
    // Clip lingkaran radar minimap
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    // Laut dasar
    ctx.fillStyle = '#164d6b';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(w / 2, h / 2);
    ctx.rotate(-heading);

    // Gambar tekstur pulau & kedalaman laut nyata
    const zoom = 0.38; // pixel minimap per meter dunia
    if (this.mapBackground) {
      const worldScale = 512 / (MAP_HALF * 2);
      const mapPx = (shipPos.x + MAP_HALF) * worldScale;
      const mapPz = (shipPos.z + MAP_HALF) * worldScale;
      const drawScale = zoom / worldScale;

      ctx.drawImage(
        this.mapBackground,
        -mapPx * drawScale,
        -mapPz * drawScale,
        512 * drawScale,
        512 * drawScale
      );
    }

    // Label Nama Pulau Terdekat
    ctx.font = 'bold 10px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    for (const isl of islands) {
      const rx = (isl.x - shipPos.x) * zoom;
      const rz = (isl.z - shipPos.z) * zoom;
      if (Math.hypot(rx, rz) < w * 0.75) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(isl.name, rx + 1, rz + 4);
        ctx.fillStyle = '#ffe08a';
        ctx.fillText(isl.name, rx, rz + 3);
      }
    }

    // Gambar Tanda Silang X Jika Berada di Radius Dekat
    if (this.currentVoyage && !this.currentVoyage.isDug) {
      const tx = (this.currentVoyage.spot.x - shipPos.x) * zoom;
      const tz = (this.currentVoyage.spot.z - shipPos.z) * zoom;
      ctx.fillStyle = '#ff2222';
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✕', tx, tz + 7);
    }

    // Gambar Kapal-kapal Tengkorak Musuh
    for (const sk of this.combat.skeletonShips) {
      const sx = (sk.pos.x - shipPos.x) * zoom;
      const sz = (sk.pos.z - shipPos.z) * zoom;
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath();
      ctx.arc(sx, sz, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Jika sedang berjalan kaki di pulau, tampilkan juga posisi kapal pemain
    if (this.player.mode === 'foot') {
      const sx = (this.playerShip.pos.x - shipPos.x) * zoom;
      const sz = (this.playerShip.pos.z - shipPos.z) * zoom;
      ctx.save();
      ctx.translate(sx, sz);
      ctx.rotate(this.playerShip.heading - heading);
      ctx.fillStyle = '#7a4a22';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Ikon Kapal / Bajak Laut di Tengah Radar
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1b120c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  renderBigMap() {
    const ctx = this.bigmapCtx;
    const w = this.bigmapCanvas.width, h = this.bigmapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Latar belakang peta perkamen
    if (this.mapBackground) {
      ctx.drawImage(this.mapBackground, 0, 0, w, h);
    }

    // Konversi koordinat dunia ke koordinat kanvas peta
    const toMap = (wx, wz) => {
      const u = (wx + MAP_HALF) / (MAP_HALF * 2);
      const v = (wz + MAP_HALF) / (MAP_HALF * 2);
      return { x: u * w, y: v * h };
    };

    // Label Nama Pulau
    ctx.fillStyle = '#3a200e';
    ctx.font = 'bold 12px "Pirata One", cursive';
    ctx.textAlign = 'center';
    for (const isl of islands) {
      const p = toMap(isl.x, isl.z);
      ctx.fillText(isl.name, p.x, p.y + 4);
    }

    // Tanda X Harta Karun Besar Khas Sea of Thieves!
    if (this.currentVoyage && !this.currentVoyage.isDug) {
      const p = toMap(this.currentVoyage.spot.x, this.currentVoyage.spot.z);
      ctx.strokeStyle = '#c41d14';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x - 12, p.y - 12);
      ctx.lineTo(p.x + 12, p.y + 12);
      ctx.moveTo(p.x + 12, p.y - 12);
      ctx.lineTo(p.x - 12, p.y + 12);
      ctx.stroke();

      ctx.fillStyle = '#c41d14';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('HARTA KARUN', p.x, p.y + 26);
    }

    // Lokasi Kapal Pemain
    const sp = toMap(this.playerShip.pos.x, this.playerShip.pos.z);
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(-this.playerShip.heading);
    ctx.fillStyle = '#1e3d59';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 8);
    ctx.lineTo(0, 5);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const t = now / 1000;

    if (this.state === 'PLAYING') {
      WIND.update(dt);

      // Pembaruan Kapal & Pemain
      this.playerShip.update(dt, t);
      this.player.update(dt, t, this.currentVoyage);

      // Cek Pulau Saat Ini (Notifikasi Penemuan Pulau Baru)
      const nearIsl = islandAt(this.playerShip.pos.x, this.playerShip.pos.z);
      if (nearIsl && nearIsl !== this.currentIsland) {
        this.currentIsland = nearIsl;
        this.notify(`🏝️ Tiba di [${nearIsl.name}]`, 'place');
      } else if (!nearIsl) {
        this.currentIsland = null;
      }

      // Pembaruan Tempur
      this.combat.update(
        dt, t,
        () => {
          this.notify('💥 Kapal kita terkena tembakan musuh!', 'danger');
        },
        (deadSkelly) => {
          this.player.skeletonKills++;
          this.player.gold += 250;
          this.notify('☠️ Kapal Tengkorak Karam! +250 Emas & Harta Terapung Muncul!', 'good');
          audio.playDiscovery();
        }
      );

      // Cek jika kapal pemain tenggelam sepenuhnya
      if (this.playerShip.isSunk && this.playerShip.pos.y < -12) {
        this.state = 'DEAD';
        document.exitPointerLock();
        document.getElementById('dead').classList.remove('hidden');
      }

      // Pembaruan Langit, Air & Suasana Pelabuhan
      const camPos = this.camera.position;
      const shipFocus = this.playerShip.pos;
      this.sky.update(dt, shipFocus, camPos);
      this.water.update(t, camPos, this.sky, this.scene.fog);
      this.outpost.setNight(this.sky.night);

      this.updateHUD();
      this.renderMinimap();
      if (this.isBigMapOpen) this.renderBigMap();
    } else if (this.state === 'MENU' || this.state === 'PAUSED') {
      const camPos = this.camera.position;
      const shipFocus = this.playerShip.pos;
      this.sky.update(dt, shipFocus, camPos);
      this.water.update(t, camPos, this.sky, this.scene.fog);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Inisialisasi saat DOM siap
window.addEventListener('DOMContentLoaded', () => {
  new PirateGame();
});
