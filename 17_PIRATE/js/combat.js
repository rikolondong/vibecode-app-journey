// Sistem Tempur Meriam & Kapal Tengkorak (Skeleton Ships AI)
// Balistik peluru, partikel ledakan, percikan air, tabrakan & AI musuh
import * as THREE from 'three';
import { Ship } from './ship.js';
import { waveHeight } from './water.js';
import { terrainHeight, createChestMesh, createBarrelMesh } from './world.js';
import { audio } from './audio.js';

export class CombatSystem {
  constructor(scene, playerShip) {
    this.scene = scene;
    this.playerShip = playerShip;

    this.cannonballs = [];
    this.particles = [];
    this.skeletonShips = [];
    this.floatingLoots = [];

    this.spawnTimer = 15.0; // Waktu jeda kemunculan kapal tengkorak

    this.initVisualAssets();
  }

  initVisualAssets() {
    // Geometri & Material Peluru Meriam
    this.ballGeo = new THREE.SphereGeometry(0.26, 8, 8);
    this.ballMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f1f,
      metalness: 0.9,
      roughness: 0.3,
    });

    // Partikel Serpihan Kayu
    this.splinterGeo = new THREE.BoxGeometry(0.12, 0.45, 0.08);
    this.splinterMat = new THREE.MeshStandardMaterial({ color: 0x7c4f24, roughness: 0.9 });

    // Partikel Cipratan Air
    this.splashGeo = new THREE.SphereGeometry(0.2, 5, 5);
    this.splashMat = new THREE.MeshBasicMaterial({ color: 0xd6f4ff, transparent: true, opacity: 0.8 });

    // Partikel Asap & Api Meriam
    this.smokeGeo = new THREE.DodecahedronGeometry(0.35, 0);
    this.smokeMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.9 });
  }

  // Tembakkan Peluru Meriam
  spawnCannonball(pos, dir, sourceShip) {
    const mesh = new THREE.Mesh(this.ballGeo, this.ballMat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const speed = 72.0; // Kecepatan peluru
    const vel = dir.clone().multiplyScalar(speed);
    vel.y += 3.5; // Lengkungan busur gravitasi

    this.cannonballs.push({
      mesh,
      vel,
      sourceShip,
      life: 5.0, // Detik sebelum lenyap
    });

    // Buat kilatan api & asap di moncong meriam
    this.spawnMuzzleFlash(pos, dir);
  }

  spawnMuzzleFlash(pos, dir) {
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
      p.position.copy(pos).addScaledVector(dir, 0.8 + Math.random() * 0.5);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: dir.clone().multiplyScalar(4 + Math.random() * 5).add(
          new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3)
        ),
        life: 0.45,
        maxLife: 0.45,
        type: 'fire',
      });
    }
  }

  spawnHitParticles(pos) {
    // Serpihan kayu hancur berhamburan
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(this.splinterGeo, this.splinterMat);
      p.position.copy(pos);
      p.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 10 + 4,
          (Math.random() - 0.5) * 12
        ),
        life: 1.2,
        maxLife: 1.2,
        type: 'splinter',
      });
    }
  }

  spawnWaterSplash(pos) {
    audio.playSplash();
    // Tiang busa air memancar ke atas
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(this.splashGeo, this.splashMat.clone());
      p.position.copy(pos);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 8 + 3,
          (Math.random() - 0.5) * 4
        ),
        life: 0.8,
        maxLife: 0.8,
        type: 'water',
      });
    }
  }

  // Munculkan Kapal Hantu Tengkorak (Skeleton Ship)
  spawnSkeletonShip(x, z) {
    const skelly = new Ship(this.scene, {
      x, z,
      isAI: true,
      heading: Math.random() * Math.PI * 2,
      sailAmount: 0.85,
      isAnchored: false,
    });
    skelly.hp = 4; // Tahan 4 tembakan meriam
    skelly.shootTimer = 3.0 + Math.random() * 2.0;
    this.skeletonShips.push(skelly);
    return skelly;
  }

  // Munculkan Harta Terapung saat Kapal Musuh Karam
  spawnFloatingLoot(pos) {
    const lootTypes = ['chest', 'ammo', 'planks'];
    const chosen = lootTypes[Math.floor(Math.random() * lootTypes.length)];

    let mesh;
    let lootData;
    if (chosen === 'chest') {
      mesh = createChestMesh(0.8);
      lootData = { type: 'chest', name: 'Peti Tengkorak Terkutuk', value: 350 };
    } else if (chosen === 'ammo') {
      mesh = createBarrelMesh('ammo');
      lootData = { type: 'ammo', amount: 8 };
    } else {
      mesh = createBarrelMesh('planks');
      lootData = { type: 'planks', amount: 4 };
    }

    mesh.position.copy(pos);
    mesh.position.y = 0.2;
    this.scene.add(mesh);

    this.floatingLoots.push({
      mesh,
      data: lootData,
      pos: pos.clone(),
      life: 240, // 4 menit terapung
    });
  }

  update(dt, t, onHitPlayer, onKillSkelly) {
    // 1. Pembaruan Kapal Tengkorak AI
    this.updateSkeletonAI(dt, t, onKillSkelly);

    // 2. Pembaruan Peluru Meriam
    this.updateCannonballs(dt, t, onHitPlayer);

    // 3. Pembaruan Partikel Visual
    this.updateParticles(dt);

    // 4. Pembaruan Harta Terapung di Permukaan Ombak
    this.updateFloatingLoot(dt, t);

    // 5. Spawn Kapal Tengkorak Baru jika di laut sepi
    if (this.skeletonShips.length < 2) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 45.0 + Math.random() * 30.0;
        // Muncul di kejauhan (250m - 350m dari pemain)
        const ang = Math.random() * Math.PI * 2;
        const dist = 280 + Math.random() * 80;
        const sx = this.playerShip.pos.x + Math.cos(ang) * dist;
        const sz = this.playerShip.pos.z + Math.sin(ang) * dist;
        if (terrainHeight(sx, sz) < -4) {
          this.spawnSkeletonShip(sx, sz);
        }
      }
    }
  }

  updateSkeletonAI(dt, t, onKillSkelly) {
    for (let i = this.skeletonShips.length - 1; i >= 0; i--) {
      const sk = this.skeletonShips[i];

      if (sk.isSunk) {
        sk.update(dt, t);
        if (sk.pos.y < -15) {
          // Bersihkan dari scene setelah karam sepenuhnya
          this.scene.remove(sk.group);
          this.skeletonShips.splice(i, 1);
        }
        continue;
      }

      // Logika Navigasi Tempur Melawan Kapal Pemain
      const toPlayer = this.playerShip.pos.clone().sub(sk.pos);
      const dist = toPlayer.length();

      if (dist < 450) {
        // Arahkan kapal agar melingkari pemain (posisi broadside meriam)
        const desiredHeading = Math.atan2(toPlayer.x, toPlayer.z) + Math.PI / 2.2;
        let diff = THREE.MathUtils.euclideanModulo(desiredHeading - sk.heading + Math.PI, Math.PI * 2) - Math.PI;

        sk.rudder = THREE.MathUtils.clamp(diff * 1.5, -1, 1);
        sk.sailAmount = dist > 90 ? 0.9 : 0.45; // Atur kecepatan manuver

        // Menembak Meriam Sisi ke Arah Pemain
        sk.shootTimer -= dt;
        if (sk.shootTimer <= 0 && dist < 140) {
          sk.shootTimer = 4.0 + Math.random() * 3.0;

          // Bidik ke arah pemain
          const aimAngle = Math.atan2(toPlayer.x, toPlayer.z);
          sk.fireBroadside(aimAngle, (pos, dir) => {
            this.spawnCannonball(pos, dir, sk);
          });
        }
      } else {
        // Patroli tenang di lautan
        sk.rudder = Math.sin(t * 0.2 + i) * 0.3;
        sk.sailAmount = 0.6;
      }

      sk.update(dt, t);

      // Cek apakah HP habis
      if (sk.hp <= 0 && !sk.isSunk) {
        sk.isSunk = true;
        sk.holes = 5;
        this.spawnFloatingLoot(sk.pos);
        if (onKillSkelly) onKillSkelly(sk);
      }
    }
  }

  updateCannonballs(dt, t, onHitPlayer) {
    for (let i = this.cannonballs.length - 1; i >= 0; i--) {
      const b = this.cannonballs[i];
      b.life -= dt;

      // Gerak balistik
      b.mesh.position.addScaledVector(b.vel, dt);
      b.vel.y -= 13.0 * dt; // Gravitasi menarik peluru ke bawah

      const bp = b.mesh.position;
      const seaH = waveHeight(bp.x, bp.z, t);
      const groundH = terrainHeight(bp.x, bp.z);

      let hit = false;

      // 1. Kena Ombak Laut
      if (bp.y <= seaH) {
        this.spawnWaterSplash(new THREE.Vector3(bp.x, seaH, bp.z));
        hit = true;
      }
      // 2. Kena Daratan / Tebing
      else if (bp.y <= groundH) {
        this.spawnHitParticles(bp);
        hit = true;
      }
      // 3. Tabrakan dengan Kapal Pemain (jika ditembak oleh Skelly)
      else if (b.sourceShip !== this.playerShip) {
        const d = bp.distanceTo(this.playerShip.pos);
        if (d < 5.5 && Math.abs(bp.y - (this.playerShip.pos.y + 1.8)) < 3.2) {
          this.playerShip.takeHit(1);
          this.spawnHitParticles(bp);
          if (onHitPlayer) onHitPlayer();
          hit = true;
        }
      }
      // 4. Tabrakan dengan Kapal Tengkorak (ditembak oleh Pemain)
      else if (b.sourceShip === this.playerShip) {
        for (const sk of this.skeletonShips) {
          if (sk.isSunk) continue;
          const d = bp.distanceTo(sk.pos);
          if (d < 6.0 && Math.abs(bp.y - (sk.pos.y + 1.8)) < 3.5) {
            sk.hp--;
            sk.takeHit(1);
            this.spawnHitParticles(bp);
            // Tampilkan hitmarker silang merah
            const hitmarker = document.getElementById('hitmarker');
            if (hitmarker) {
              hitmarker.classList.remove('show');
              void hitmarker.offsetWidth; // Force reflow
              hitmarker.classList.add('show');
            }
            hit = true;
            break;
          }
        }
      }

      if (hit || b.life <= 0) {
        this.scene.remove(b.mesh);
        this.cannonballs.splice(i, 1);
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 14.0 * dt;

      const progress = p.life / p.maxLife;
      if (p.mesh.material.opacity !== undefined) {
        p.mesh.material.opacity = progress;
      }
      p.mesh.scale.setScalar(progress);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  updateFloatingLoot(dt, t) {
    for (let i = this.floatingLoots.length - 1; i >= 0; i--) {
      const loot = this.floatingLoots[i];
      loot.life -= dt;

      // Mengapung di atas ombak
      const h = waveHeight(loot.pos.x, loot.pos.z, t);
      loot.mesh.position.y = h + 0.3 + Math.sin(t * 3 + loot.pos.x) * 0.15;
      loot.mesh.rotation.y += dt * 0.8;

      // Cek jika kapal pemain menabrak/mengambil harta terapung ini
      const dShip = this.playerShip.pos.distanceTo(loot.mesh.position);
      if (dShip < 7.0 && !this.playerShip.isSunk) {
        if (loot.data.type === 'chest') {
          this.playerShip.addChest(loot.data);
        } else if (loot.data.type === 'ammo') {
          // Tambah peluru pemain
          const p = window.__piratePlayer;
          if (p) p.ammo = Math.min(30, p.ammo + loot.data.amount);
        } else if (loot.data.type === 'planks') {
          // Tambah kayu pemain
          const p = window.__piratePlayer;
          if (p) p.planks = Math.min(15, p.planks + loot.data.amount);
        }
        audio.playCoin();
        this.scene.remove(loot.mesh);
        this.floatingLoots.splice(i, 1);
        continue;
      }

      if (loot.life <= 0) {
        this.scene.remove(loot.mesh);
        this.floatingLoots.splice(i, 1);
      }
    }
  }
}
