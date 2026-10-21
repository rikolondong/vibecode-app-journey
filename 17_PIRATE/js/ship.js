// Sistem Kapal Bajak Laut (Pemain & Kapal Tengkorak)
// Mengatur model 3D, fisika apung bergelombang, kemudi, layar, meriam, kebocoran & perbaikan
import * as THREE from 'three';
import { waveHeight } from './water.js';
import { terrainHeight, createChestMesh } from './world.js';
import { audio } from './audio.js';

export const WIND = {
  angle: 0.8, // Radian arah angin bertiup
  speed: 12.0,
  update(dt) {
    // Angin perlahan berubah arah di lautan
    this.angle += (Math.random() - 0.5) * 0.04 * dt;
  }
};

export class Ship {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.isAI = !!options.isAI;
    this.color = options.color || 0x6e4321;

    // Status Fisika & Navigasi
    this.pos = new THREE.Vector3(options.x || 0, 0, options.z || 0);
    this.heading = options.heading || 0; // Arah hadap kapal (radian)
    this.speed = 0;                     // Knot laju kapal
    this.targetSpeed = 0;
    this.rudder = 0;                    // Sudut kemudi (-1 kiri, +1 kanan)
    this.sailAmount = options.sailAmount !== undefined ? options.sailAmount : 0; // 0 (layar gulung) s/d 1 (layar penuh)
    this.isAnchored = options.isAnchored !== undefined ? options.isAnchored : true;
    this.anchorProgress = 1;            // 1 turun, 0 naik

    // Kesehatan Kapal & Air di Lambung (Sistem Khas Sea of Thieves)
    this.maxWater = 100;
    this.water = 0;                     // % ketinggian air di palka kapal
    this.holes = 0;                     // Jumlah lubang bocor
    this.isSunk = false;
    this.chestsInHold = [];             // Harta di dalam palka kapal

    // Meriam
    this.cannons = [];                  // Meriam kiri & kanan
    this.cooldownL = 0;
    this.cooldownR = 0;

    // Pitch & Roll dinamis di atas ombak
    this.pitch = 0;
    this.roll = 0;
    this.creakTimer = 2.0;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildModel();
    this.updatePosition(this.pos.x, this.pos.z);
    this.group.rotation.set(0, 0, 0);
    this.group.rotateY(this.heading);
  }

  buildModel() {
    const isSkelly = this.isAI;
    const woodMat = new THREE.MeshStandardMaterial({
      color: isSkelly ? 0x2e3532 : this.color,
      roughness: 0.85,
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: isSkelly ? 0x3d4440 : 0x8a5e35,
      roughness: 0.9,
    });
    const sailMat = new THREE.MeshStandardMaterial({
      color: isSkelly ? 0x385445 : 0xf2ede2,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1f1915,
      roughness: 0.7,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.35,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.8,
      roughness: 0.3,
    });

    // 1. Badan Kapal (Hull)
    const hullGeo = new THREE.CylinderGeometry(3.6, 2.2, 18, 10, 1);
    hullGeo.scale(0.8, 1, 0.45);
    hullGeo.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, woodMat);
    hull.position.y = 1.0;
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.group.add(hull);

    // Bagian haluan (Bow) runcing
    const bowGeo = new THREE.ConeGeometry(2.4, 6.5, 6);
    bowGeo.rotateZ(Math.PI / 2);
    bowGeo.scale(0.65, 0.8, 0.5);
    const bow = new THREE.Mesh(bowGeo, woodMat);
    bow.position.set(0, 1.4, 9.8);
    bow.castShadow = true;
    this.group.add(bow);

    // Patung Haluan (Figurehead)
    const fhGeo = isSkelly
      ? new THREE.IcosahedronGeometry(0.8, 0)
      : new THREE.ConeGeometry(0.6, 1.8, 5);
    const fhMat = isSkelly
      ? new THREE.MeshStandardMaterial({ color: 0x9be0a5, emissive: 0x225533 })
      : goldMat;
    const figurehead = new THREE.Mesh(fhGeo, fhMat);
    figurehead.position.set(0, 1.8, 13.0);
    figurehead.rotation.x = Math.PI / 4;
    this.group.add(figurehead);

    // 2. Dek Kapal
    const deckGeo = new THREE.BoxGeometry(4.8, 0.4, 17);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 1.8, 0.5);
    deck.receiveShadow = true;
    this.group.add(deck);

    // Pagar kapal (Gunwales)
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 16.5), woodMat);
      rail.position.set(side * 2.35, 2.35, 0.5);
      rail.castShadow = true;
      this.group.add(rail);
    }

    // Panggung kemudi buritan (Quarterdeck)
    const sternDeck = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 5.0), woodMat);
    sternDeck.position.set(0, 2.5, -6.0);
    sternDeck.castShadow = true;
    this.group.add(sternDeck);

    // Kemudi Kapal (Helm)
    this.helmWheel = new THREE.Group();
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8), darkMat);
    wheelHub.rotation.x = Math.PI / 2;
    this.helmWheel.add(wheelHub);
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 16), woodMat);
    this.helmWheel.add(wheelRim);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), woodMat);
      spoke.rotation.z = (i * Math.PI) / 3;
      this.helmWheel.add(spoke);
    }
    this.helmWheel.position.set(0, 3.8, -5.8);
    this.group.add(this.helmWheel);

    // Roda Jangkar (Capstan)
    this.capstan = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.9, 8), darkMat);
    this.capstan.position.set(0, 2.3, -2.5);
    this.group.add(this.capstan);

    // 3. Tiang Layar (Mast) & Layar
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 18, 10), darkMat);
    mast.position.set(0, 9.8, 1.5);
    mast.castShadow = true;
    this.group.add(mast);

    // Palang tiang layar (Yardarms)
    this.yardUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 8.5, 8), darkMat);
    this.yardUpper.rotation.z = Math.PI / 2;
    this.yardUpper.position.set(0, 15.0, 1.5);
    this.group.add(this.yardUpper);

    this.yardLower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 9.2, 8), darkMat);
    this.yardLower.rotation.z = Math.PI / 2;
    this.yardLower.position.set(0, 8.0, 1.5);
    this.group.add(this.yardLower);

    // Kain Layar Utama (Bisa digulung / dibentangkan)
    const sailGeo = new THREE.PlaneGeometry(8.5, 7.0, 8, 4);
    // Beri sedikit kelengkungan seperti terhembus angin
    const sPos = sailGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const z = sPos.getY(i);
      sPos.setZ(i, Math.sin((z / 7.0 + 0.5) * Math.PI) * 0.9);
    }
    sailGeo.computeVertexNormals();

    this.sailMesh = new THREE.Mesh(sailGeo, sailMat);
    this.sailMesh.position.set(0, 11.5, 1.6);
    this.sailMesh.castShadow = true;
    this.group.add(this.sailMesh);

    // Bendera Bajak Laut di Puncak Tiang (Jolly Roger / Skelly Flag)
    const flagGeo = new THREE.PlaneGeometry(1.6, 1.0);
    const flagMat = new THREE.MeshStandardMaterial({
      color: isSkelly ? 0x113322 : 0x1a1a1a,
      side: THREE.DoubleSide,
    });
    this.flag = new THREE.Mesh(flagGeo, flagMat);
    this.flag.position.set(0.8, 18.0, 1.5);
    this.group.add(this.flag);

    // 4. Meriam Kiri & Kanan (Port & Starboard Broadside)
    this.createCannons(metalMat, woodMat);

    // 5. Lentera Malam di Buritan
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe28a,
      emissive: isSkelly ? 0x44ff88 : 0xff9922,
      emissiveIntensity: 0.5,
    });
    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), lanternMat);
    lantern.position.set(0, 3.6, -8.7);
    this.group.add(lantern);

    // Titik tumpuk peti harta di palka belakang
    this.chestHoldGroup = new THREE.Group();
    this.chestHoldGroup.position.set(0, 2.1, -4.5);
    this.group.add(this.chestHoldGroup);

    // Tangga naik di sisi kiri & kanan untuk pemain memanjat
    for (const side of [-1, 1]) {
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.2, 0.7), darkMat);
      ladder.position.set(side * 2.45, 1.0, 2.0);
      this.group.add(ladder);
    }
  }

  createCannons(metalMat, woodMat) {
    const cannonConfigs = [
      { side: 'port', x: -2.0, z: 1.0, dir: -Math.PI / 2 },
      { side: 'port', x: -2.0, z: -1.5, dir: -Math.PI / 2 },
      { side: 'starboard', x: 2.0, z: 1.0, dir: Math.PI / 2 },
      { side: 'starboard', x: 2.0, z: -1.5, dir: Math.PI / 2 },
    ];

    for (const cfg of cannonConfigs) {
      const cg = new THREE.Group();
      cg.position.set(cfg.x, 2.1, cfg.z);

      const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.2), woodMat);
      carriage.castShadow = true;
      cg.add(carriage);

      const barrelGeo = new THREE.CylinderGeometry(0.24, 0.32, 2.0, 10);
      barrelGeo.rotateX(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, metalMat);
      barrel.position.set(0, 0.3, 0.4);
      barrel.castShadow = true;
      cg.add(barrel);

      cg.rotation.y = cfg.dir;
      this.group.add(cg);

      this.cannons.push({
        group: cg,
        barrel: barrel,
        side: cfg.side,
        dir: cfg.dir,
      });
    }
  }

  // Tambahkan peti harta ke palka kapal
  addChest(chestData) {
    this.chestsInHold.push(chestData);
    this.refreshChestModels();
  }

  // Lepaskan semua peti (saat dijual di outpost)
  offloadChests() {
    const list = [...this.chestsInHold];
    this.chestsInHold = [];
    this.refreshChestModels();
    return list;
  }

  refreshChestModels() {
    // Bersihkan model peti di palka dan tata ulang
    while (this.chestHoldGroup.children.length > 0) {
      this.chestHoldGroup.remove(this.chestHoldGroup.children[0]);
    }
    const count = this.chestsInHold.length;
    for (let i = 0; i < count; i++) {
      const cm = createChestMesh(0.75);
      const row = Math.floor(i / 2);
      const col = (i % 2) === 0 ? -0.7 : 0.7;
      cm.position.set(col, 0, row * 0.9);
      this.chestHoldGroup.add(cm);
    }
  }

  // Kontrol Layar
  adjustSail(delta) {
    if (this.isSunk) return;
    this.sailAmount = Math.max(0, Math.min(1, this.sailAmount + delta));
  }

  // Kontrol Kemudi (-1 ke kiri, +1 ke kanan)
  steer(amount, dt) {
    if (this.isSunk) return;
    this.rudder = THREE.MathUtils.clamp(this.rudder + amount * dt * 2.5, -1, 1);
  }

  resetRudder(dt) {
    this.rudder = THREE.MathUtils.lerp(this.rudder, 0, dt * 2.0);
  }

  toggleAnchor() {
    if (this.isSunk) return;
    this.isAnchored = !this.isAnchored;
    audio.playAnchor();
    return this.isAnchored;
  }

  // Tembak Meriam (Memilih sisi terdekat dengan bidikan sudut)
  fireBroadside(aimAngle, onFireBall) {
    if (this.isSunk) return false;
    const now = performance.now();

    // Hitung apakah sudut bidik lebih condong ke kiri kapal (port) atau kanan (starboard)
    const relAngle = THREE.MathUtils.euclideanModulo(aimAngle - this.heading + Math.PI, Math.PI * 2) - Math.PI;
    const isPort = relAngle < 0;

    if (isPort && this.cooldownL > 0) return false;
    if (!isPort && this.cooldownR > 0) return false;

    if (isPort) this.cooldownL = 1.6;
    else this.cooldownR = 1.6;

    audio.playCannon();

    // Luncurkan peluru dari meriam di sisi tersebut
    for (const c of this.cannons) {
      if ((isPort && c.side === 'port') || (!isPort && c.side === 'starboard')) {
        const worldPos = new THREE.Vector3();
        c.barrel.getWorldPosition(worldPos);

        const worldDir = new THREE.Vector3(0, 0, 1);
        worldDir.applyEuler(new THREE.Euler(0, this.heading + c.dir, 0));
        worldDir.y = 0.08; // Sedikit elevasi tembakan
        worldDir.normalize();

        if (onFireBall) {
          onFireBall(worldPos, worldDir, this);
        }
      }
    }
    return true;
  }

  // Kerusakan Kapal
  takeHit(damage = 1) {
    this.holes = Math.min(5, this.holes + damage);
    audio.playHitWood();
  }

  repairHole() {
    if (this.holes > 0) {
      this.holes--;
      audio.playHammer();
      return true;
    }
    return false;
  }

  bailWater(amount = 25) {
    this.water = Math.max(0, this.water - amount);
  }

  update(dt, t) {
    // Cooldown meriam
    if (this.cooldownL > 0) this.cooldownL -= dt;
    if (this.cooldownR > 0) this.cooldownR -= dt;

    // Visual Layar: Skala Y mencerminkan sailAmount
    if (this.sailMesh) {
      const targetScaleY = Math.max(0.12, this.sailAmount);
      this.sailMesh.scale.y = THREE.MathUtils.lerp(this.sailMesh.scale.y, targetScaleY, dt * 4.0);
      this.sailMesh.position.y = 8.0 + (this.sailMesh.scale.y * 7.0) / 2;
    }

    // Visual Kemudi
    if (this.helmWheel) {
      this.helmWheel.rotation.z = -this.rudder * Math.PI * 2;
    }

    // Gerak Bendera
    if (this.flag) {
      this.flag.rotation.y = Math.sin(t * 5 + this.pos.x * 0.1) * 0.25;
    }

    // Jika kapal tenggelam
    if (this.isSunk) {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, dt * 1.5);
      this.pos.y -= dt * 1.4; // Perlahan amblas ke dasar laut
      this.group.rotation.z += dt * 0.1;
      this.group.position.copy(this.pos);
      return;
    }

    // Kebocoran air & tenggelam
    if (this.holes > 0) {
      this.water += this.holes * 2.8 * dt;
      if (this.water >= this.maxWater) {
        this.isSunk = true;
        this.water = this.maxWater;
        return;
      }
    }

    // Efek Jangkar
    if (this.isAnchored) {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, dt * 3.0);
    } else {
      // Perhitungan Angin Khas Sea of Thieves:
      // Hitung selisih arah kapal dengan arah angin
      const windDiff = Math.abs(THREE.MathUtils.euclideanModulo(this.heading - WIND.angle + Math.PI, Math.PI * 2) - Math.PI);
      // Kapal tercepat saat angin bertiup dari belakang (windDiff mendekati 0)
      const windFactor = THREE.MathUtils.lerp(1.2, 0.45, windDiff / Math.PI);
      const maxKnot = this.isAI ? 10.0 : 13.5;

      this.targetSpeed = this.sailAmount * maxKnot * windFactor;
      this.speed = THREE.MathUtils.lerp(this.speed, this.targetSpeed, dt * 0.8);

      // Kemudi membelokkan kapal sebanding dengan kecepatan
      if (Math.abs(this.speed) > 0.2) {
        const turnRate = 0.55 * (this.speed / maxKnot + 0.35);
        this.heading -= this.rudder * turnRate * dt;
      }
    }

    // Pindahkan Posisi Kapal
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    this.pos.x += forwardX * this.speed * dt * 1.8;
    this.pos.z += forwardZ * this.speed * dt * 1.8;

    // Cek tabrakan daratan pulau (periksa haluan depan dan lambung)
    const bowX = this.pos.x + forwardX * 8.5;
    const bowZ = this.pos.z + forwardZ * 8.5;
    const groundCenter = terrainHeight(this.pos.x, this.pos.z);
    const groundBow = terrainHeight(bowX, bowZ);

    if (groundCenter > -1.2 || groundBow > -1.0) {
      // Kapal kandas / menabrak daratan pulau! Tolak mundur ke perairan
      this.speed = -Math.max(2.5, Math.abs(this.speed) * 0.4);
      this.pos.x -= forwardX * 1.6;
      this.pos.z -= forwardZ * 1.6;
      this.takeHit(1);
    }

    // Hitung Ketinggian & Kemiringan Mengapung di Permukaan Ombak
    this.updateBuoyancy(t, dt, forwardX, forwardZ);

    // Suara derit kayu sesekali jika sedang berlayar
    if (!this.isAI && Math.abs(this.speed) > 2) {
      this.creakTimer -= dt;
      if (this.creakTimer <= 0) {
        audio.playWoodCreak();
        this.creakTimer = 6.0 + Math.random() * 8.0;
      }
    }
  }

  updateBuoyancy(t, dt, fwdX, fwdZ) {
    // Sampel ombak pada Haluan (depan), Buritan (belakang), Kiri (port), Kanan (starboard)
    const bowX = this.pos.x + fwdX * 7.0, bowZ = this.pos.z + fwdZ * 7.0;
    const sternX = this.pos.x - fwdX * 7.0, sternZ = this.pos.z - fwdZ * 7.0;

    const perpX = -fwdZ, perpZ = fwdX;
    const portX = this.pos.x + perpX * 2.5, portZ = this.pos.z + perpZ * 2.5;
    const stbdX = this.pos.x - perpX * 2.5, stbdZ = this.pos.z - perpZ * 2.5;

    const hBow = waveHeight(bowX, bowZ, t);
    const hStern = waveHeight(sternX, sternZ, t);
    const hPort = waveHeight(portX, portZ, t);
    const hStbd = waveHeight(stbdX, stbdZ, t);

    // Ketinggian tengah kapal (semakin berat karena air, semakin rendah terapung)
    const waterDraft = (this.water / this.maxWater) * 1.2;
    const targetY = (hBow + hStern + hPort + hStbd) * 0.25 - waterDraft;

    this.pos.y = THREE.MathUtils.lerp(this.pos.y, targetY, dt * 6.0);

    // Pitch (Jungkit depan-belakang)
    const targetPitch = Math.atan2(hStern - hBow, 14.0);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, dt * 5.0);

    // Roll (Goyang kiri-kanan akibat ombak + kemudi miring saat belok cepat)
    const turnHeel = -this.rudder * (this.speed / 14.0) * 0.15;
    const targetRoll = Math.atan2(hPort - hStbd, 5.0) + turnHeel;
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, dt * 5.0);

    // Terapkan matriks rotasi ke grup kapal
    this.group.position.copy(this.pos);
    this.group.rotation.set(0, 0, 0);
    this.group.rotateY(this.heading);
    this.group.rotateX(this.pitch);
    this.group.rotateZ(this.roll);
  }

  updatePosition(x, z) {
    this.pos.x = x;
    this.pos.z = z;
    this.group.position.copy(this.pos);
  }
}
