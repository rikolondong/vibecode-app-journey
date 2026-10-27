/**
 * Particle Effects & VFX Engine for Missile Simulator
 * Uses shared geometries & proper material disposal to prevent GPU memory leaks
 */

class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.debrisList = [];
    this.shockwaves = [];
    this.lights = [];

    this.screenShakeMagnitude = 0;

    // Shared geometries for zero GPU buffer leak
    this.unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.unitRingGeo = new THREE.RingGeometry(0.72, 1.0, 32);
    this.groundRingGeo = new THREE.RingGeometry(0.75, 1.0, 36);
    this.groundRingGeo.rotateX(-Math.PI / 2);
  }

  // Rocket Exhaust Flame & Smoke Plume
  spawnRocketTrail(pos, velocity, missileType = 'rocket') {
    const isHypersonic = missileType === 'kinzhal';
    const isCruise = missileType === 'tomahawk';
    const count = isHypersonic ? 3 : 2;

    for (let i = 0; i < count; i++) {
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2
      );
      const pPos = pos.clone().add(spread);

      const size = isHypersonic ? (1.8 + Math.random() * 2.2) : (2.2 + Math.random() * 2.8);

      let color = 0xff7700;
      if (isHypersonic) {
        color = Math.random() < 0.6 ? 0x00e5ff : 0xffffff;
      } else if (isCruise) {
        color = 0x778899;
      } else {
        color = Math.random() < 0.5 ? 0xff4400 : 0xffaa00;
      }

      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isHypersonic ? 0.88 : 0.65
      });
      const mesh = new THREE.Mesh(this.unitBoxGeo, mat);
      mesh.scale.set(size, size, size);
      mesh.position.copy(pPos);
      this.scene.add(mesh);

      const driftVel = velocity.clone().normalize().multiplyScalar(-15 - Math.random() * 20);
      driftVel.add(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ));

      this.particles.push({
        mesh: mesh,
        velocity: driftVel,
        scaleSpeed: isHypersonic ? 4.0 : 5.5,
        fadeSpeed: isHypersonic ? 2.4 : 1.3,
        life: 1.0,
        isSmoke: !isHypersonic
      });
    }
  }

  // Sonic Boom Condensation Ring
  spawnSonicRing(pos, velocity) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xcceeff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(this.unitRingGeo, mat);
    ring.scale.set(4, 4, 4);
    ring.position.copy(pos);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), velocity.clone().normalize());
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      growSpeed: 65,
      fadeSpeed: 2.2,
      opacity: 0.85
    });
  }

  // Multi-Stage Spectacular Explosion
  spawnExplosion(pos, blastRadius, yieldKg, missileType) {
    // 1. Blinding Flash PointLight
    const flash = new THREE.PointLight(0xffeedd, 10, blastRadius * 4.0);
    flash.position.copy(pos).add(new THREE.Vector3(0, 12, 0));
    this.scene.add(flash);
    this.lights.push({ light: flash, decay: 6.0 });

    // 2. Expanding Ground Shockwave Ring (properly scaled to blastRadius)
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const shockRing = new THREE.Mesh(this.groundRingGeo, shockMat);
    shockRing.scale.set(6, 1, 6);
    shockRing.position.copy(pos).add(new THREE.Vector3(0, 3.5, 0));
    this.scene.add(shockRing);

    this.shockwaves.push({
      mesh: shockRing,
      isGroundRing: true,
      growSpeed: Math.max(45, blastRadius * 1.6),
      fadeSpeed: 1.3,
      opacity: 0.9
    });

    // 3. Fireball Particles Plume
    const particleCount = Math.min(75, 28 + Math.round(yieldKg / 10));
    for (let i = 0; i < particleCount; i++) {
      const pSize = 5 + Math.random() * Math.min(24, blastRadius * 0.18);
      const isFire = Math.random() < 0.65;
      const color = isFire ? (Math.random() < 0.5 ? 0xff3300 : 0xff9900) : 0x262626;

      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
      });
      const p = new THREE.Mesh(this.unitBoxGeo, mat);
      p.scale.set(pSize, pSize, pSize);
      p.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        2 + Math.random() * 12,
        (Math.random() - 0.5) * 14
      ));
      this.scene.add(p);

      // Radial blast velocity
      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.45;
      const speed = 22 + Math.random() * Math.min(140, blastRadius * 1.1);
      const vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(upAngle) * speed,
        Math.sin(upAngle) * speed * 1.4,
        Math.sin(angle) * Math.cos(upAngle) * speed
      );

      this.particles.push({
        mesh: p,
        velocity: vel,
        scaleSpeed: 8.5,
        fadeSpeed: isFire ? 0.85 : 0.38,
        life: 1.0,
        isSmoke: !isFire
      });
    }

    // 4. Ballistic Flying Debris Chunks
    const debrisCount = Math.min(36, 14 + Math.round(yieldKg / 16));
    for (let i = 0; i < debrisCount; i++) {
      const dSize = 1.4 + Math.random() * 2.4;
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() < 0.35 ? 0xff5500 : 0x2e2e2e,
        roughness: 0.9
      });
      const debris = new THREE.Mesh(this.unitBoxGeo, mat);
      debris.scale.set(dSize, dSize, dSize);
      debris.position.copy(pos).add(new THREE.Vector3(0, 5, 0));
      this.scene.add(debris);

      const spreadSpeed = Math.min(120, Math.max(35, blastRadius * 0.9));
      const dVel = new THREE.Vector3(
        (Math.random() - 0.5) * spreadSpeed * 1.5,
        28 + Math.random() * spreadSpeed,
        (Math.random() - 0.5) * spreadSpeed * 1.5
      );

      this.debrisList.push({
        mesh: debris,
        velocity: dVel,
        rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        life: 4.0
      });
    }

    // Trigger Screen Shake
    this.screenShakeMagnitude = Math.min(22, 4 + yieldKg * 0.035);
  }

  update(delta) {
    // Screen shake decay
    if (this.screenShakeMagnitude > 0) {
      this.screenShakeMagnitude = Math.max(0, this.screenShakeMagnitude - delta * 15);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta * p.fadeSpeed;

      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y += (p.isSmoke ? 7 : -10) * delta;
      p.velocity.multiplyScalar(0.96);

      const scaleAdd = delta * p.scaleSpeed;
      p.mesh.scale.x += scaleAdd;
      p.mesh.scale.y += scaleAdd;
      p.mesh.scale.z += scaleAdd;
      p.mesh.material.opacity = Math.max(0, p.life);

      if (!p.isSmoke && p.life < 0.58) {
        p.mesh.material.color.setHex(0x2a2a2a);
        p.isSmoke = true;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.opacity -= delta * sw.fadeSpeed;
      const grow = delta * sw.growSpeed;
      if (sw.isGroundRing) {
        sw.mesh.scale.x += grow;
        sw.mesh.scale.z += grow;
      } else {
        sw.mesh.scale.x += grow;
        sw.mesh.scale.y += grow;
      }
      sw.mesh.material.opacity = Math.max(0, sw.opacity);

      if (sw.opacity <= 0) {
        this.scene.remove(sw.mesh);
        if (sw.mesh.material) sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Debris
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.life -= delta;
      d.velocity.y -= 45 * delta;
      d.mesh.position.addScaledVector(d.velocity, delta);
      d.mesh.rotation.x += d.rotVel.x * delta;
      d.mesh.rotation.y += d.rotVel.y * delta;

      if (d.life <= 0 || d.mesh.position.y < -20) {
        this.scene.remove(d.mesh);
        if (d.mesh.material) d.mesh.material.dispose();
        this.debrisList.splice(i, 1);
      }
    }

    // Fade lights
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      l.light.intensity -= delta * l.decay * 10;
      if (l.light.intensity <= 0) {
        this.scene.remove(l.light);
        this.lights.splice(i, 1);
      }
    }
  }

  getScreenShakeOffset() {
    if (this.screenShakeMagnitude <= 0) return new THREE.Vector3();
    return new THREE.Vector3(
      (Math.random() - 0.5) * this.screenShakeMagnitude * 0.35,
      (Math.random() - 0.5) * this.screenShakeMagnitude * 0.35,
      (Math.random() - 0.5) * this.screenShakeMagnitude * 0.35
    );
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.material) p.mesh.material.dispose();
    }
    this.particles = [];
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      if (sw.mesh.material) sw.mesh.material.dispose();
    }
    this.shockwaves = [];
    for (const d of this.debrisList) {
      this.scene.remove(d.mesh);
      if (d.mesh.material) d.mesh.material.dispose();
    }
    this.debrisList = [];
    for (const l of this.lights) {
      this.scene.remove(l.light);
    }
    this.lights = [];
    this.screenShakeMagnitude = 0;
  }
}

window.VFXManager = VFXManager;
