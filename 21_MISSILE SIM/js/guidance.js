/**
 * Guidance & Flight Physics Controllers for 5 Missile Types
 * Handles Top-Attack, SACLOS Manual, Terrain Cruise, Ballistic Arc, and Hypersonic Strike
 * Includes Continuous Collision Detection (substepping) to prevent high-speed tunneling
 */

class MissileController {
  constructor(scene, terrain, targetManager, vfxManager) {
    this.scene = scene;
    this.terrain = terrain;
    this.targetManager = targetManager;
    this.vfxManager = vfxManager;

    this.activeMissile = null;
    this.state = 'idle'; // 'idle', 'in_flight', 'hit', 'intercepted'
    this.flightTime = 0;
    this.lastMach = 0;
    this.pendingImpactReport = null;

    // SACLOS manual steering offsets
    this.manualPitchInput = 0;
    this.manualYawInput = 0;
  }

  launch(typeId, targetPos, targetObj = null) {
    if (this.state === 'in_flight') return null;

    const specs = MISSILE_SPECS[typeId];
    if (!specs) return null;

    // Remove any leftover model
    if (this.activeMissile && this.activeMissile.model) {
      this.scene.remove(this.activeMissile.model);
    }

    // Create 3D Model
    const model = MissileBuilder.createMissileModel(typeId);
    const startPos = this.terrain.launchPadPos.clone().add(new THREE.Vector3(0, 22, 0));
    model.position.copy(startPos);

    // Initial launch angle: elevated upward so missile clears launch pad & hills cleanly
    const toTarget = targetPos.clone().sub(startPos);
    const horizDist = Math.hypot(toTarget.x, toTarget.z);
    const launchElevAngle = typeId === 'iskander' ? 1.15 : (typeId === 'javelin' ? 0.65 : 0.32);
    const initDir = new THREE.Vector3(
      toTarget.x / Math.max(1, horizDist) * Math.cos(launchElevAngle),
      Math.sin(launchElevAngle),
      toTarget.z / Math.max(1, horizDist) * Math.cos(launchElevAngle)
    ).normalize();

    model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), initDir);
    this.scene.add(model);

    this.activeMissile = {
      typeId: typeId,
      specs: specs,
      model: model,
      position: startPos.clone(),
      prevPosition: startPos.clone(),
      velocity: initDir.clone().multiplyScalar(85),
      targetPos: targetPos.clone(),
      aimOffset: new THREE.Vector3(0, 0, 0),
      targetObj: targetObj,
      state: 'in_flight',
      flightTime: 0,
      totalRange: startPos.distanceTo(targetPos),
      altitudeAGL: 22,
      speedMps: 85,
      mach: 0.25,
      gForce: 1.0,
      distanceToTarget: startPos.distanceTo(targetPos),
      intercepted: false,
      damageResult: null,
      hitPos: null
    };

    this.state = 'in_flight';
    this.flightTime = 0;
    this.lastMach = 0;
    this.pendingImpactReport = null;
    this.manualPitchInput = 0;
    this.manualYawInput = 0;

    // Sound effects
    window.soundEngine.playLaunchIgnition();
    window.soundEngine.startRocketSound(
      typeId === 'tomahawk' ? 'cruise' : (typeId === 'kinzhal' ? 'hypersonic' : 'rocket')
    );

    return this.activeMissile;
  }

  setManualInput(pitch, yaw) {
    this.manualPitchInput = THREE.MathUtils.clamp(pitch, -1, 1);
    this.manualYawInput = THREE.MathUtils.clamp(yaw, -1, 1);
  }

  update(delta) {
    // If an external interception happened since last frame, report it immediately
    if (this.pendingImpactReport) {
      const report = this.pendingImpactReport;
      this.pendingImpactReport = null;
      return report;
    }

    if (this.state !== 'in_flight' || !this.activeMissile) return null;

    const m = this.activeMissile;

    // Substep physics so fast missiles (Iskander / Kinzhal) never tunnel through targets or terrain
    const subSteps = m.typeId === 'kinzhal' || m.typeId === 'iskander' ? 5 : 2;
    const subDelta = delta / subSteps;

    for (let step = 0; step < subSteps; step++) {
      if (this.state !== 'in_flight') break;

      m.flightTime += subDelta;
      this.flightTime = m.flightTime;
      m.prevPosition.copy(m.position);

      const prevVel = m.velocity.clone();

      // Calculate dynamic guidance based on missile type
      this.applyGuidancePhysics(m, subDelta);

      // Compute G-Force from acceleration
      const accel = m.velocity.clone().sub(prevVel).divideScalar(Math.max(0.0001, subDelta));
      m.gForce = THREE.MathUtils.clamp(1.0 + accel.length() / 9.81, 1.0, 35.0);

      // Advance position
      m.position.addScaledVector(m.velocity, subDelta);

      // Check Direct Target Proximity along segment
      const effectiveTarget = m.targetPos.clone().add(m.aimOffset);
      m.distanceToTarget = m.position.distanceTo(effectiveTarget);

      if (m.distanceToTarget < 24) {
        this.triggerImpact(m, effectiveTarget.clone(), 'target');
        break;
      }

      // Also check proximity to any other military target on the field
      for (const t of this.targetManager.targets) {
        if (!t.isDestroyed && m.position.distanceTo(t.position) < 22) {
          this.triggerImpact(m, t.position.clone(), 'target');
          break;
        }
      }
      if (this.state !== 'in_flight') break;

      // Check Terrain Collision (ignore first 0.25s right off launch rail)
      if (m.flightTime > 0.25) {
        const terrainCollision = this.terrain.checkCollision(m.position);
        if (terrainCollision.hit) {
          const hitPoint = m.position.clone();
          hitPoint.y = terrainCollision.groundY;
          this.triggerImpact(m, hitPoint, 'terrain');
          break;
        }
      }
    }

    // If impact occurred during substeps, return the impact event
    if (this.pendingImpactReport) {
      const report = this.pendingImpactReport;
      this.pendingImpactReport = null;
      return report;
    }

    // Update 3D mesh transform
    m.model.position.copy(m.position);
    if (m.velocity.lengthSq() > 1) {
      const dir = m.velocity.clone().normalize();
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      m.model.quaternion.slerp(targetQuat, Math.min(1.0, delta * 20));
    }

    // Telemetry calculations
    const groundY = this.terrain.getTerrainHeight(m.position.x, m.position.z);
    m.altitudeAGL = Math.max(0, m.position.y - groundY);

    // Display realistic telemetry speed matching real-world specs
    const rawSpeed = m.velocity.length();
    const speedScale = m.typeId === 'kinzhal' ? 2.4 : (m.typeId === 'iskander' ? 1.55 : 1.0);
    m.speedMps = Math.min(m.specs.speedMps, rawSpeed * speedScale);
    m.mach = m.speedMps / 340;

    // Sonic boom trigger when crossing Mach 1
    if (m.mach >= 1.0 && this.lastMach < 1.0) {
      window.soundEngine.playSonicBoom();
      if (this.vfxManager) this.vfxManager.spawnSonicRing(m.position, m.velocity);
    }
    this.lastMach = m.mach;

    // Rocket Exhaust VFX
    if (this.vfxManager) {
      const exhaustWorldPos = m.position.clone();
      if (m.model.userData.exhaustOffset) {
        const offset = m.model.userData.exhaustOffset.clone().applyQuaternion(m.model.quaternion);
        exhaustWorldPos.add(offset);
      }
      this.vfxManager.spawnRocketTrail(exhaustWorldPos, m.velocity, m.typeId);
    }

    // Sound engine pitch modulation
    window.soundEngine.updateRocketPitch(
      Math.min(2.5, m.mach),
      m.position.distanceTo(this.terrain.launchPadPos) / 1000
    );

    return { event: 'flying', missile: m };
  }

  // Helper: sample maximum terrain height between current position and target
  getMaxTerrainAhead(pos, targetPos, samples = 4) {
    let maxH = this.terrain.getTerrainHeight(pos.x, pos.z);
    for (let i = 1; i <= samples; i++) {
      const frac = (i / (samples + 1)) * 0.6;
      const sx = pos.x + (targetPos.x - pos.x) * frac;
      const sz = pos.z + (targetPos.z - pos.z) * frac;
      maxH = Math.max(maxH, this.terrain.getTerrainHeight(sx, sz));
    }
    return maxH;
  }

  // Guidance System Implementations
  applyGuidancePhysics(m, delta) {
    const specs = m.specs;
    const target = m.targetPos;

    switch (specs.guidanceType) {
      case 'top_attack':
        this.guideJavelin(m, target, delta);
        break;
      case 'saclos_manual':
        this.guideTOW(m, target, delta);
        break;
      case 'terrain_cruise':
        this.guideTomahawk(m, target, delta);
        break;
      case 'ballistic_arc':
        this.guideIskander(m, target, delta);
        break;
      case 'hypersonic_strike':
        this.guideKinzhal(m, target, delta);
        break;
      default:
        this.guideDirect(m, target, delta);
    }
  }

  // 1. FGM-148 Javelin: Pop-up Climb -> High Cruise -> Steep 85° Top-Attack Dive
  guideJavelin(m, target, delta) {
    const maxSpeed = m.specs.speedMps;
    const currentSpeed = m.velocity.length();
    const newSpeed = Math.min(maxSpeed, currentSpeed + 180 * delta);

    const horizDist = Math.hypot(target.x - m.position.x, target.z - m.position.z);
    const maxRidgeH = this.getMaxTerrainAhead(m.position, target, 4);
    const cruiseCeiling = Math.max(target.y + 340, maxRidgeH + 220);

    if (horizDist > 420) {
      // Stage 1 & 2: Pop-up climb & high top-attack approach over ridges
      const waypoint = new THREE.Vector3(target.x, cruiseCeiling, target.z);
      const desiredDir = waypoint.sub(m.position).normalize();
      m.velocity.lerp(desiredDir.multiplyScalar(newSpeed), delta * 5.5);
    } else {
      // Stage 3: Steep Top-Attack Plunge onto target roof
      const desiredDir = target.clone().sub(m.position).normalize();
      m.velocity.lerp(desiredDir.multiplyScalar(newSpeed * 1.15), delta * 12.0);
    }
  }

  // 2. BGM-71 TOW / Kornet: Optical Beam-Rider with Manual SACLOS Steering
  guideTOW(m, target, delta) {
    const maxSpeed = m.specs.speedMps;
    const currentSpeed = m.velocity.length();
    const newSpeed = Math.min(maxSpeed, currentSpeed + 190 * delta);

    // Accumulate player manual steering offsets if keys/mouse are active
    if (Math.abs(this.manualYawInput) > 0.02 || Math.abs(this.manualPitchInput) > 0.02) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(m.model.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(m.model.quaternion);
      m.aimOffset.addScaledVector(right, this.manualYawInput * 180 * delta);
      m.aimOffset.addScaledVector(up, this.manualPitchInput * 180 * delta);
    }

    const aimedTarget = target.clone().add(m.aimOffset);
    const horizDist = Math.hypot(aimedTarget.x - m.position.x, aimedTarget.z - m.position.z);

    // Ensure clearance over intermediate mountain ridges during midcourse
    if (horizDist > 450) {
      const ridgeH = this.getMaxTerrainAhead(m.position, aimedTarget, 3);
      if (aimedTarget.y < ridgeH + 75) {
        aimedTarget.y = ridgeH + 75;
      }
    }

    const targetDir = aimedTarget.sub(m.position).normalize();
    m.velocity.lerp(targetDir.multiplyScalar(newSpeed), delta * 8.0);
  }

  // 3. BGM-109 Tomahawk: Low-Altitude TERCOM Terrain-Hugging Cruise
  guideTomahawk(m, target, delta) {
    const maxSpeed = m.specs.speedMps;
    const horizDist = Math.hypot(target.x - m.position.x, target.z - m.position.z);
    const horizDir = new THREE.Vector2(target.x - m.position.x, target.z - m.position.z).normalize();

    if (horizDist > 420) {
      // Multi-point TERCOM radar look-ahead (0m to 450m ahead) so it never hits steep cliffs
      let maxAheadH = this.terrain.getTerrainHeight(m.position.x, m.position.z);
      for (const distAhead of [60, 140, 240, 360, 480]) {
        const px = m.position.x + horizDir.x * distAhead;
        const pz = m.position.z + horizDir.y * distAhead;
        maxAheadH = Math.max(maxAheadH, this.terrain.getTerrainHeight(px, pz));
      }

      const desiredY = maxAheadH + 95;
      const climbRate = THREE.MathUtils.clamp((desiredY - m.position.y) * 3.5, -180, 260);

      const desiredVel = new THREE.Vector3(
        horizDir.x * maxSpeed,
        climbRate,
        horizDir.y * maxSpeed
      ).normalize().multiplyScalar(maxSpeed);

      m.velocity.lerp(desiredVel, delta * 6.5);

      // Hard terrain safety floor
      const groundNow = this.terrain.getTerrainHeight(m.position.x, m.position.z);
      if (m.position.y < groundNow + 45) {
        m.position.y = groundNow + 45;
        if (m.velocity.y < 40) m.velocity.y = 40;
      }
    } else {
      // Terminal dive into target
      const diveDir = target.clone().sub(m.position).normalize();
      m.velocity.lerp(diveDir.multiplyScalar(maxSpeed * 1.1), delta * 10.0);
    }
  }

  // 4. 9K720 Iskander-M: Stratospheric Quasi-Ballistic Arc & Hypersonic Plunge
  guideIskander(m, target, delta) {
    const simMaxSpeed = 1350; // Smooth visual speed while HUD reports Mach 5.9
    const horizDist = Math.hypot(target.x - m.position.x, target.z - m.position.z);
    const totalHoriz = Math.max(1000, m.totalRange);
    const progress = 1.0 - THREE.MathUtils.clamp(horizDist / totalHoriz, 0, 1);

    if (progress < 0.30 && m.position.y < target.y + 1350) {
      // Stage 1: Steep Quasi-Ballistic Boost Climb into Upper Atmosphere
      const boostWaypoint = new THREE.Vector3(
        m.position.x + (target.x - m.position.x) * 0.35,
        target.y + 1500,
        m.position.z + (target.z - m.position.z) * 0.35
      );
      const desiredDir = boostWaypoint.sub(m.position).normalize();
      const speed = Math.min(simMaxSpeed * 0.75, m.velocity.length() + 420 * delta);
      m.velocity.lerp(desiredDir.multiplyScalar(speed), delta * 4.5);
    } else if (horizDist > 750) {
      // Stage 2: High Stratospheric Ballistic Apogee Cruise
      const apexWaypoint = new THREE.Vector3(target.x, target.y + 1150, target.z);
      const desiredDir = apexWaypoint.sub(m.position).normalize();
      const speed = Math.min(simMaxSpeed * 0.9, m.velocity.length() + 380 * delta);
      m.velocity.lerp(desiredDir.multiplyScalar(speed), delta * 5.0);
    } else {
      // Stage 3: Hypersonic Vertical Bunker-Busting Plunge
      const plungeDir = target.clone().sub(m.position).normalize();
      const terminalSpeed = Math.min(simMaxSpeed, m.velocity.length() + 650 * delta);
      m.velocity.lerp(plungeDir.multiplyScalar(terminalSpeed), delta * 14.0);
    }
  }

  // 5. Kh-47M2 Kinzhal: Mach 10 Aero-Ballistic Hypersonic Strike
  guideKinzhal(m, target, delta) {
    const simMaxSpeed = 1650; // Fast visual speed (~3.5s flight) with substep precision
    const currentSpeed = m.velocity.length();
    const newSpeed = Math.min(simMaxSpeed, currentSpeed + 950 * delta);

    const horizDist = Math.hypot(target.x - m.position.x, target.z - m.position.z);
    const maxRidgeH = this.getMaxTerrainAhead(m.position, target, 4);

    if (horizDist > 900) {
      // High-altitude aero-ballistic hypersonic approach well above mountain peaks
      const aeroWaypoint = new THREE.Vector3(
        target.x,
        Math.max(target.y + 550, maxRidgeH + 350),
        target.z
      );
      const desiredDir = aeroWaypoint.sub(m.position).normalize();
      m.velocity.lerp(desiredDir.multiplyScalar(newSpeed), delta * 9.0);
    } else {
      // Terminal hypersonic kinetic strike
      const directDir = target.clone().sub(m.position).normalize();
      m.velocity.lerp(directDir.multiplyScalar(newSpeed), delta * 16.0);
    }
  }

  // Fallback Direct Pursuit
  guideDirect(m, target, delta) {
    const dir = target.clone().sub(m.position).normalize();
    m.velocity.lerp(dir.multiplyScalar(m.specs.speedMps), delta * 6);
  }

  // Explode Missile on Hit or Air Interception
  triggerImpact(m, hitPos, reason = 'target') {
    if (this.state !== 'in_flight') return null;
    this.state = reason === 'intercepted' ? 'intercepted' : 'hit';

    window.soundEngine.stopRocketSound();
    window.soundEngine.stopAirDefenseAlarm();

    // Ensure Seeker static glitch is cleared after a brief impact flash
    const staticGlitch = document.getElementById('static-glitch');
    if (staticGlitch) {
      staticGlitch.classList.add('active');
      setTimeout(() => {
        staticGlitch.classList.remove('active');
      }, 280);
    }

    // Calculate distance to camera for sound delay
    const camDist = hitPos.distanceTo(this.terrain.launchPadPos);
    window.soundEngine.playExplosion(camDist, m.specs.warheadKg);

    // Visual explosion VFX
    if (this.vfxManager) {
      this.vfxManager.spawnExplosion(
        hitPos,
        reason === 'intercepted' ? 45 : m.specs.blastRadiusM,
        reason === 'intercepted' ? 40 : m.specs.warheadKg,
        m.typeId
      );
    }

    // Only apply blast damage to mountain structures if not intercepted mid-air
    let damageResult = null;
    if (reason !== 'intercepted') {
      damageResult = this.targetManager.applyBlastDamage(
        hitPos,
        m.specs.warheadKg,
        m.specs.blastRadiusM,
        m.typeId
      );
    }
    m.damageResult = damageResult;
    m.hitPos = hitPos.clone();

    // Remove missile 3D model
    if (m.model) {
      this.scene.remove(m.model);
    }

    this.pendingImpactReport = {
      event: reason === 'intercepted' ? 'intercepted' : 'hit',
      reason: reason,
      missile: m,
      hitPos: hitPos,
      damageResult: damageResult,
      flightTime: m.flightTime
    };

    return this.pendingImpactReport;
  }

  reset() {
    if (this.activeMissile && this.activeMissile.model) {
      this.scene.remove(this.activeMissile.model);
    }
    this.activeMissile = null;
    this.state = 'idle';
    this.flightTime = 0;
    this.lastMach = 0;
    this.pendingImpactReport = null;
    this.manualPitchInput = 0;
    this.manualYawInput = 0;

    const staticGlitch = document.getElementById('static-glitch');
    if (staticGlitch) staticGlitch.classList.remove('active');

    window.soundEngine.stopRocketSound();
    window.soundEngine.stopAirDefenseAlarm();
  }
}

window.MissileController = MissileController;
