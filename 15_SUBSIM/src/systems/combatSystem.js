import * as THREE from 'three';
import { sound } from '../audio/soundEngine.js';

export class CombatSystem {
  constructor(scene, ocean) {
    this.scene = scene;
    this.ocean = ocean;

    this.torpedoes = [];
    this.depthCharges = [];
    this.explosions = [];
    this.waterPlumes = [];
    this.bubbleParticles = [];

    this.torpedoCount = 14;
    this.maxTorpedoes = 14;
    this.totalTonnageSunk = 0;
    this.shipsSunkCount = 0;

    this.setupParticleSystem();
  }

  setupParticleSystem() {
    const bubbleGeom = new THREE.SphereGeometry(0.2, 6, 6);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    this.bubbleMeshPool = [];
    for (let i = 0; i < 80; i++) {
      const m = new THREE.Mesh(bubbleGeom, bubbleMat);
      m.visible = false;
      this.scene.add(m);
      this.bubbleMeshPool.push({ mesh: m, life: 0 });
    }
  }

  spawnBubble(pos) {
    const p = this.bubbleMeshPool.find(b => !b.mesh.visible);
    if (p) {
      p.mesh.position.copy(pos);
      p.mesh.position.x += (Math.random() - 0.5) * 0.4;
      p.mesh.position.y += (Math.random() - 0.5) * 0.4;
      p.mesh.position.z += (Math.random() - 0.5) * 0.4;
      p.mesh.visible = true;
      p.life = 1.0;
    }
  }

  fireTorpedo(uBoatPos, headingDeg, isStern = false) {
    if (this.torpedoCount <= 0) return false;
    this.torpedoCount--;

    sound.playTorpedoLaunch();

    const torpGroup = new THREE.Group();
    const bodyGeom = new THREE.CylinderGeometry(0.26, 0.26, 7.1, 10);
    bodyGeom.rotateZ(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    torpGroup.add(body);

    const headGeom = new THREE.SphereGeometry(0.26, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    headGeom.rotateZ(-Math.PI / 2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xb58a36, metalness: 0.8, roughness: 0.3 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.x = 3.55;
    torpGroup.add(head);

    const rad = (headingDeg * Math.PI) / 180;
    const dir = new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad));
    if (isStern) dir.negate();

    torpGroup.position.copy(uBoatPos);
    torpGroup.position.addScaledVector(dir, isStern ? -35 : 36);
    torpGroup.position.y = Math.min(-2, uBoatPos.y);
    torpGroup.rotation.y = -rad + (isStern ? Math.PI : 0);

    this.scene.add(torpGroup);

    this.torpedoes.push({
      mesh: torpGroup,
      dir: dir,
      speed: 38,
      life: 30,
      depth: 3.5
    });

    return true;
  }

  dropDepthCharge(shipPos, targetSubPos) {
    sound.playTelegraphClick();

    const dcGeom = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 10);
    const dcMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.7 });
    const dcMesh = new THREE.Mesh(dcGeom, dcMat);
    dcMesh.position.copy(shipPos);
    dcMesh.position.y = 0;
    this.scene.add(dcMesh);

    const targetDepth = Math.max(12, Math.min(120, -targetSubPos.y + (Math.random() - 0.5) * 15));

    this.depthCharges.push({
      mesh: dcMesh,
      targetDepth: -targetDepth,
      sinkRate: 6.5,
      targetSubPos: targetSubPos
    });
  }

  createExplosion(pos, isWaterGeyser = false) {
    sound.playExplosion(pos.y < -5);

    const geom = new THREE.SphereGeometry(isWaterGeyser ? 4 : 6, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: isWaterGeyser ? 0xccf0ff : 0xff5511,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    if (pos.y > -8) {
      const plumeGeom = new THREE.CylinderGeometry(2, 6, 28, 12);
      const plumeMat = new THREE.MeshBasicMaterial({ color: 0xe6f5ff, transparent: true, opacity: 0.85 });
      const plume = new THREE.Mesh(plumeGeom, plumeMat);
      plume.position.set(pos.x, 12, pos.z);
      this.scene.add(plume);
      this.waterPlumes.push({ mesh: plume, life: 1.2 });
    }

    this.explosions.push({
      mesh: mesh,
      life: 1.0,
      maxScale: isWaterGeyser ? 9 : 14
    });
  }

  update(delta, ships, uBoat, onReport) {
    // 1. Update Torpedoes
    for (let i = this.torpedoes.length - 1; i >= 0; i--) {
      const t = this.torpedoes[i];
      t.life -= delta;

      const moveDist = t.speed * 0.7 * delta;
      t.mesh.position.addScaledVector(t.dir, moveDist);
      t.mesh.position.y = -t.depth;
      this.spawnBubble(t.mesh.position);

      let hit = false;
      for (const ship of ships) {
        if (ship.sinking) continue;
        const dist = t.mesh.position.distanceTo(ship.mesh.position);
        if (dist < 28) {
          hit = true;
          this.createExplosion(t.mesh.position, true);
          ship.health -= 60;

          if (ship.health <= 0) {
            ship.sinking = true;
            this.totalTonnageSunk += ship.tonnage;
            this.shipsSunkCount++;
            onReport(`DIRECT HIT! ${ship.name} is sinking! (+${ship.tonnage} GRT)`);
          } else {
            onReport(`TORPEDO HIT on ${ship.name}! Target heavily damaged!`);
          }
          break;
        }
      }

      if (hit || t.life <= 0) {
        this.scene.remove(t.mesh);
        this.torpedoes.splice(i, 1);
      }
    }

    // 2. Update Depth Charges
    for (let i = this.depthCharges.length - 1; i >= 0; i--) {
      const dc = this.depthCharges[i];
      dc.mesh.position.y -= dc.sinkRate * delta;

      if (Math.random() < 0.4) {
        this.spawnBubble(dc.mesh.position);
      }

      if (dc.mesh.position.y <= dc.targetDepth) {
        this.createExplosion(dc.mesh.position, false);

        const distToSub = dc.mesh.position.distanceTo(uBoat.mesh.position);
        if (distToSub < 45) {
          const dmg = Math.round((1 - distToSub / 45) * 35);
          uBoat.hullIntegrity = Math.max(0, uBoat.hullIntegrity - dmg);
          onReport(`DEPTH CHARGE! Close underwater explosion! Hull integrity -${dmg}%`);
        }

        this.scene.remove(dc.mesh);
        this.depthCharges.splice(i, 1);
      }
    }

    // 3. Update Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.life -= delta * 1.4;
      const progress = 1.0 - Math.max(0, exp.life);
      const scale = 1 + progress * exp.maxScale;
      exp.mesh.scale.set(scale, scale, scale);
      exp.mesh.material.opacity = exp.life;

      if (exp.life <= 0) {
        this.scene.remove(exp.mesh);
        this.explosions.splice(i, 1);
      }
    }

    // 4. Update Water Plumes
    for (let i = this.waterPlumes.length - 1; i >= 0; i--) {
      const p = this.waterPlumes[i];
      p.life -= delta * 0.9;
      p.mesh.scale.y += delta * 8;
      p.mesh.material.opacity = p.life;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.waterPlumes.splice(i, 1);
      }
    }

    // 5. Update Bubble Particles
    this.bubbleMeshPool.forEach(b => {
      if (b.mesh.visible) {
        b.life -= delta * 0.8;
        b.mesh.position.y += delta * 1.5;
        b.mesh.material.opacity = Math.max(0, b.life * 0.7);
        if (b.life <= 0 || b.mesh.position.y > 0) {
          b.mesh.visible = false;
        }
      }
    });
  }
}
