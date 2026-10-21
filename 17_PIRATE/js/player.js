// Sistem Karakter Pemain (Bajak Laut)
// Mendukung mode Berlayar (di kemudi) & mode Jalan Kaki (menjelajah pulau & menggali harta)
import * as THREE from 'three';
import { terrainHeight, createChestMesh } from './world.js';
import { waveHeight } from './water.js';
import { audio } from './audio.js';

export class Player {
  constructor(scene, camera, ship) {
    this.scene = scene;
    this.camera = camera;
    this.ship = ship;

    this.mode = 'ship'; // 'ship' | 'foot'

    // Status Fisik & Gerakan Berjalan
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.isGrounded = false;
    this.isSwimming = false;

    // Rotasi Kamera (Yaw & Pitch)
    this.yaw = ship ? ship.heading : 0;
    this.pitch = 0.2;

    // Harta Karun yang Sedang Digotong
    this.carriedChest = null;
    this.heldChestMesh = null;

    // Input Keys
    this.keys = {};

    // Progress Menggali / Menambal
    this.actionProgress = 0;
    this.isDigging = false;
    this.isRepairing = false;

    // Inventaris
    this.gold = 0;
    this.ammo = 16;
    this.planks = 6;
    this.skeletonKills = 0;

    // Model Karakter Tangan / Sekop / Orang Ketiga Sederhana
    this.initPlayerModel();
  }

  initPlayerModel() {
    this.mesh = new THREE.Group();

    // Badan Bajak Laut
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x22223b, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0a982, roughness: 0.7 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    // Torso
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8), coatMat);
    body.position.y = 0.95;
    body.castShadow = true;
    this.mesh.add(body);

    // Kepala
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), skinMat);
    head.position.y = 1.6;
    this.mesh.add(head);

    // Topi Tricorne Bajak Laut
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.25, 3), hatMat);
    hat.position.y = 1.82;
    hat.rotation.y = Math.PI / 6;
    this.mesh.add(hat);

    // Kaki
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), pantsMat);
    legL.position.set(-0.18, 0.4, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), pantsMat);
    legR.position.set(0.18, 0.4, 0);
    this.mesh.add(legL, legR);

    // Sekop di Tangan Kanan
    this.shovel = new THREE.Group();
    const shovelHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x6e4726 })
    );
    shovelHandle.position.y = 0.6;
    const shovelBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.35, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 })
    );
    shovelBlade.position.y = 0.15;
    this.shovel.add(shovelHandle, shovelBlade);
    this.shovel.position.set(0.4, 0.6, 0.3);
    this.shovel.rotation.x = -Math.PI / 6;
    this.mesh.add(this.shovel);

    this.scene.add(this.mesh);
    this.mesh.visible = false; // Hanya terlihat saat di luar kapal
  }

  // Masuk ke Mode Jalan Kaki (Turun ke Pulau / Air)
  disembark() {
    this.mode = 'foot';
    this.mesh.visible = true;

    // Turunkan pemain di sisi kapal
    const fwd = new THREE.Vector3(Math.sin(this.ship.heading), 0, Math.cos(this.ship.heading));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

    this.pos.copy(this.ship.pos).addScaledVector(right, 3.8);
    this.pos.y = Math.max(0.5, terrainHeight(this.pos.x, this.pos.z));
    this.vel.set(0, 0, 0);
  }

  // Kembali Naik ke Kapal
  boardShip() {
    this.mode = 'ship';
    this.mesh.visible = false;
    this.actionProgress = 0;
    this.isDigging = false;
  }

  // Ambil Peti Harta
  pickupChest(chestData) {
    this.carriedChest = chestData;
    if (!this.heldChestMesh) {
      this.heldChestMesh = createChestMesh(0.6);
      this.mesh.add(this.heldChestMesh);
    }
    this.heldChestMesh.position.set(0, 0.9, 0.55);
    this.heldChestMesh.visible = true;
    if (this.shovel) this.shovel.visible = false;
  }

  // Simpan Peti ke Kapal
  stowChestToShip() {
    if (!this.carriedChest) return;
    this.ship.addChest(this.carriedChest);
    this.carriedChest = null;
    if (this.heldChestMesh) this.heldChestMesh.visible = false;
    if (this.shovel) this.shovel.visible = true;
    audio.playWoodCreak();
  }

  update(dt, t, currentVoyage) {
    if (this.mode === 'ship') {
      this.updateShipControls(dt, t);
    } else {
      this.updateFootControls(dt, t, currentVoyage);
    }
  }

  updateShipControls(dt, t) {
    // Kontrol Layar Kapal: W naikkan layar (bentangkan), S turunkan layar (gulung)
    if (this.keys['KeyW']) this.ship.adjustSail(0.4 * dt);
    if (this.keys['KeyS']) this.ship.adjustSail(-0.4 * dt);

    // Kontrol Kemudi: A belok kiri, D belok kanan
    if (this.keys['KeyA']) this.ship.steer(1, dt);
    else if (this.keys['KeyD']) this.ship.steer(-1, dt);
    else this.ship.resetRudder(dt);

    // Menambal Lubang: Tahan tombol R jika punya papan
    if (this.keys['KeyR'] && this.ship.holes > 0 && this.planks > 0) {
      this.isRepairing = true;
      this.actionProgress += dt * 0.7; // ~1.4 detik per lubang
      if (this.actionProgress >= 1.0) {
        if (this.ship.repairHole()) {
          this.planks--;
        }
        this.actionProgress = 0;
      }
    } else {
      this.isRepairing = false;
      this.actionProgress = 0;
    }

    // Kamera Mengikuti Kapal (Sudut Pandang Kapten Bahari)
    const camDist = 17.0;
    const camHeight = 7.5;

    // Posisi fokus kamera di dek buritan / kemudi kapal
    const lookTarget = this.ship.pos.clone().add(new THREE.Vector3(0, 3.2, 0));

    const cx = this.ship.pos.x - Math.sin(this.yaw) * Math.cos(this.pitch) * camDist;
    const cz = this.ship.pos.z - Math.cos(this.yaw) * Math.cos(this.pitch) * camDist;
    const cy = this.ship.pos.y + Math.sin(this.pitch) * camDist + camHeight;

    this.camera.position.set(cx, Math.max(cy, 1.5), cz);
    this.camera.lookAt(lookTarget);
  }

  updateFootControls(dt, t, currentVoyage) {
    // Vektor Gerakan Kamera Relatif
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

    let moveX = 0, moveZ = 0;
    if (this.keys['KeyW']) { moveX += fwd.x; moveZ += fwd.z; }
    if (this.keys['KeyS']) { moveX -= fwd.x; moveZ -= fwd.z; }
    if (this.keys['KeyD']) { moveX += right.x; moveZ += right.z; }
    if (this.keys['KeyA']) { moveX -= right.x; moveZ -= right.z; }

    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 0.001) {
      const speed = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !this.carriedChest ? 8.5 : 5.0;
      this.vel.x = (moveX / inputLen) * speed;
      this.vel.z = (moveZ / inputLen) * speed;

      // Putar karakter menghadap arah jalan
      this.mesh.rotation.y = Math.atan2(moveX, moveZ);
    } else {
      this.vel.x = THREE.MathUtils.lerp(this.vel.x, 0, dt * 10);
      this.vel.z = THREE.MathUtils.lerp(this.vel.z, 0, dt * 10);
    }

    // Fisika Gravitasi & Lompat
    const groundH = terrainHeight(this.pos.x, this.pos.z);
    const seaH = waveHeight(this.pos.x, this.pos.z, t);
    const surfaceH = Math.max(groundH, seaH);

    this.isSwimming = (groundH < -0.8 && seaH > groundH);

    if (this.isSwimming) {
      // Mengapung di air
      this.pos.y = THREE.MathUtils.lerp(this.pos.y, seaH - 0.5, dt * 6.0);
      this.vel.y = 0;
      this.isGrounded = false;
    } else {
      if (this.pos.y <= surfaceH + 0.05) {
        this.pos.y = surfaceH;
        this.vel.y = 0;
        this.isGrounded = true;

        if (this.keys['Space'] && !this.carriedChest) {
          this.vel.y = 6.2; // Lompat
          this.isGrounded = false;
        }
      } else {
        this.vel.y -= 18.0 * dt; // Gravitasi
        this.isGrounded = false;
      }
    }

    // Terapkan Kecepatan
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;

    this.mesh.position.copy(this.pos);

    // Animasi Gali Sekop (Tahan F)
    if (this.keys['KeyF'] && !this.carriedChest && currentVoyage && !currentVoyage.isDug) {
      const distToX = Math.hypot(this.pos.x - currentVoyage.spot.x, this.pos.z - currentVoyage.spot.z);
      if (distToX < 3.8) {
        this.isDigging = true;
        this.actionProgress += dt * 0.45; // ~2.2 detik menggali
        this.shovel.rotation.x = -Math.PI / 4 + Math.sin(t * 12) * 0.4;

        if (Math.floor(t * 5) % 2 === 0) {
          audio.playShovel();
        }

        if (this.actionProgress >= 1.0) {
          // Berhasil menggali peti harta karun!
          currentVoyage.isDug = true;
          this.pickupChest({
            name: currentVoyage.chestName,
            value: currentVoyage.chestValue,
          });
          audio.playDiscovery();
          this.actionProgress = 0;
          this.isDigging = false;
        }
      } else {
        this.isDigging = false;
        this.actionProgress = 0;
      }
    } else {
      this.isDigging = false;
      if (!this.isRepairing) this.actionProgress = 0;
      if (this.shovel) this.shovel.rotation.x = -Math.PI / 6;
    }

    // Kamera Orang Ketiga / Dekat
    const camDist = 4.8;
    const cx = this.pos.x - Math.sin(this.yaw) * Math.cos(this.pitch) * camDist;
    const cz = this.pos.z - Math.cos(this.yaw) * Math.cos(this.pitch) * camDist;
    const cy = this.pos.y + 1.8 + Math.sin(this.pitch) * camDist;

    this.camera.position.set(cx, Math.max(cy, surfaceH + 0.4), cz);
    this.camera.lookAt(this.pos.x, this.pos.y + 1.4, this.pos.z);
  }
}
