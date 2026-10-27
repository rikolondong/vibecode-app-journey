/**
 * Active Mountain Air Defense System (SAM Interceptors & CIWS Flak)
 * Features toggleable Threat Level (Active vs Safe mode)
 */

class AirDefenseSystem {
  constructor(scene, terrain, vfxManager) {
    this.scene = scene;
    this.terrain = terrain;
    this.vfxManager = vfxManager;

    this.enabled = false; // Toggle ON/OFF
    this.samPositions = [];
    this.ciwsPositions = [];
    this.interceptors = [];
    this.tracers = [];

    this.samCooldown = 0;
    this.ciwsCooldown = 0;
    this.radarLocked = false;

    // Shared tracer geometry & material to avoid per-shot GPU allocation
    this.sharedTracerGeo = new THREE.CylinderGeometry(0.18, 0.18, 5, 6);
    this.sharedTracerGeo.rotateX(Math.PI / 2);
    this.sharedTracerMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    this.initDefensiveInstallations();
  }

  initDefensiveInstallations() {
    // 1. Pantsir-style SAM Battery positioned on mountain ridge
    const samPos = new THREE.Vector3(-250, 0, 2200);
    samPos.y = this.terrain.getTerrainHeight(samPos.x, samPos.z);
    this.samPositions.push(samPos);
    this.buildSAMBatteryModel(samPos);

    // 2. CIWS 30mm Gatling Gun positioned near Command Bunker
    const ciwsPos = new THREE.Vector3(-410, 0, 1800);
    ciwsPos.y = this.terrain.getTerrainHeight(ciwsPos.x, ciwsPos.z);
    this.ciwsPositions.push(ciwsPos);
    this.buildCIWSModel(ciwsPos);
  }

  buildSAMBatteryModel(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Tracked/Wheeled Transporter Erector Launcher (TEL)
    const chassisGeo = new THREE.BoxGeometry(18, 6, 32);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x343d31, roughness: 0.7 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 3;
    group.add(chassis);

    // Rotating Radar & Missile Tube Rack
    this.samTurret = new THREE.Group();
    this.samTurret.position.set(0, 6, -2);

    // 8x SAM Launch Canisters
    for (let x = -5; x <= 5; x += 3.3) {
      for (let y = 3; y <= 7; y += 4) {
        const tubeGeo = new THREE.CylinderGeometry(0.9, 0.9, 16, 12);
        tubeGeo.rotateX(Math.PI / 4);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x485244 });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        tube.position.set(x, y, 0);
        this.samTurret.add(tube);
      }
    }

    // Engagement Radar Dish
    const radarGeo = new THREE.CylinderGeometry(4, 0.5, 2, 16);
    radarGeo.rotateX(Math.PI / 3);
    const radarMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, metalness: 0.5 });
    const radar = new THREE.Mesh(radarGeo, radarMat);
    radar.position.set(0, 12, -4);
    this.samTurret.add(radar);

    group.add(this.samTurret);
    this.scene.add(group);
  }

  buildCIWSModel(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Concrete Plinth Stand
    const plinthGeo = new THREE.CylinderGeometry(10, 12, 6, 16);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x4d5359 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 3;
    group.add(plinth);

    // Rotating Gatling Dome Turret
    this.ciwsTurret = new THREE.Group();
    this.ciwsTurret.position.set(0, 6, 0);

    const domeGeo = new THREE.CylinderGeometry(4.5, 4.5, 7, 16);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xd9e0e8, metalness: 0.4 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 3.5;
    this.ciwsTurret.add(dome);

    // 30mm Multi-barrel Gatling Cannon
    this.ciwsBarrels = new THREE.Group();
    this.ciwsBarrels.position.set(0, 5, 4);

    for (let i = 0; i < 6; i++) {
      const bGeo = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
      bGeo.rotateX(Math.PI / 2);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
      const b = new THREE.Mesh(bGeo, bMat);
      const angle = (i * Math.PI * 2) / 6;
      b.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 5);
      this.ciwsBarrels.add(b);
    }

    this.ciwsTurret.add(this.ciwsBarrels);
    group.add(this.ciwsTurret);
    this.scene.add(group);
  }

  toggleActive() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.clearInterceptors();
      window.soundEngine.stopAirDefenseAlarm();
      this.radarLocked = false;
    }
    return this.enabled;
  }

  update(delta, missileController) {
    if (!this.enabled || !missileController || missileController.state !== 'in_flight') {
      if (this.radarLocked) {
        this.radarLocked = false;
        window.soundEngine.stopAirDefenseAlarm();
      }
      this.updateProjectiles(delta, null);
      return false;
    }

    const missile = missileController.activeMissile;
    if (!missile) return false;

    // SAM Engagement Logic
    const samDist = missile.position.distanceTo(this.samPositions[0]);
    if (samDist < 3400 && samDist > 400) {
      if (!this.radarLocked) {
        this.radarLocked = true;
        window.soundEngine.startAirDefenseAlarm();
      }

      // Rotate SAM turret towards target
      if (this.samTurret) {
        const targetDir = missile.position.clone().sub(this.samPositions[0]).normalize();
        this.samTurret.rotation.y = Math.atan2(targetDir.x, targetDir.z);
      }

      // Launch SAM Interceptor (unless Tomahawk is flying low under radar horizon < 110m AGL)
      const radarVisible = !(missile.typeId === 'tomahawk' && missile.altitudeAGL < 115 && samDist > 900);
      this.samCooldown -= delta;
      if (radarVisible && this.samCooldown <= 0 && this.interceptors.length < 2) {
        this.launchSAMInterceptor(missile);
        this.samCooldown = 3.2;
      }
    }

    // CIWS Gatling Engagement Logic
    const ciwsDist = missile.position.distanceTo(this.ciwsPositions[0]);
    if (ciwsDist < 1050) {
      // Aim CIWS Gatling at incoming missile
      if (this.ciwsTurret && this.ciwsBarrels) {
        const aimDir = missile.position.clone().sub(this.ciwsPositions[0]).normalize();
        this.ciwsTurret.rotation.y = Math.atan2(aimDir.x, aimDir.z);
        this.ciwsBarrels.rotation.z += delta * 38;
      }

      this.ciwsCooldown -= delta;
      if (this.ciwsCooldown <= 0) {
        this.fireCIWSBurst(missile, missileController, ciwsDist);
        this.ciwsCooldown = 0.30;
      }
    }

    // Update active interceptors and check hit
    return this.updateProjectiles(delta, missileController);
  }

  launchSAMInterceptor(targetMissile) {
    const launchPos = this.samPositions[0].clone().add(new THREE.Vector3(0, 16, 0));

    // 3D Interceptor Mesh
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.45, 0.55, 8, 12);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const noseGeo = new THREE.ConeGeometry(0.45, 2.2, 12);
    noseGeo.rotateX(Math.PI / 2);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xcc2222 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.z = 5.1;
    group.add(nose);

    group.position.copy(launchPos);
    const initDir = targetMissile.position.clone().sub(launchPos).normalize();
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), initDir);
    this.scene.add(group);

    this.interceptors.push({
      mesh: group,
      position: launchPos,
      velocity: initDir.multiplyScalar(440),
      life: 7.0
    });

    window.soundEngine.playSAMLaunch();
  }

  fireCIWSBurst(targetMissile, missileController, ciwsDist) {
    window.soundEngine.playCIWSBurst();

    // Spawn glowing tracer rounds towards target
    const muzzlePos = this.ciwsPositions[0].clone().add(new THREE.Vector3(0, 12, 0));
    for (let i = 0; i < 8; i++) {
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const targetPoint = targetMissile.position.clone().add(spread);
      const dir = targetPoint.sub(muzzlePos).normalize();

      const tracer = new THREE.Mesh(this.sharedTracerGeo, this.sharedTracerMat);
      tracer.position.copy(muzzlePos).addScaledVector(dir, i * 12);
      tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.scene.add(tracer);

      this.tracers.push({
        mesh: tracer,
        position: tracer.position.clone(),
        velocity: dir.multiplyScalar(950),
        life: 1.1
      });
    }

    // Synchronous flak interception check when within effective CIWS kill zone (< 600m)
    if (ciwsDist < 600 && missileController && missileController.state === 'in_flight') {
      const missileType = targetMissile.typeId;
      let interceptProb = 0.22;
      if (missileType === 'kinzhal') interceptProb = 0.02;  // Mach 10 hypersonic penetrates CIWS
      if (missileType === 'iskander') interceptProb = 0.08; // Steep supersonic dive
      if (missileType === 'javelin') interceptProb = 0.12;  // Top-attack vertical dive

      if (Math.random() < interceptProb) {
        missileController.triggerImpact(targetMissile, targetMissile.position.clone(), 'intercepted');
      }
    }
  }

  updateProjectiles(delta, missileController) {
    let intercepted = false;

    // Update SAM Interceptors
    for (let i = this.interceptors.length - 1; i >= 0; i--) {
      const inter = this.interceptors[i];
      inter.life -= delta;

      if (missileController && missileController.state === 'in_flight' && missileController.activeMissile) {
        const m = missileController.activeMissile;
        // Proportional navigation pursuit
        const desiredDir = m.position.clone().sub(inter.position).normalize();
        inter.velocity.lerp(desiredDir.multiplyScalar(480), delta * 6.0);

        // Check proximity hit with player missile
        if (inter.position.distanceTo(m.position) < 28) {
          if (m.typeId !== 'kinzhal' || Math.random() < 0.08) {
            missileController.triggerImpact(m, m.position.clone(), 'intercepted');
            intercepted = true;
          }
          inter.life = 0;
        }
      }

      inter.position.addScaledVector(inter.velocity, delta);
      inter.mesh.position.copy(inter.position);
      if (inter.velocity.lengthSq() > 1) {
        const dir = inter.velocity.clone().normalize();
        inter.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      }

      // Rocket trail on interceptor
      if (this.vfxManager) {
        this.vfxManager.spawnRocketTrail(inter.position, inter.velocity, 'javelin');
      }

      if (inter.life <= 0) {
        this.scene.remove(inter.mesh);
        this.interceptors.splice(i, 1);
      }
    }

    // Update CIWS Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= delta;
      t.position.addScaledVector(t.velocity, delta);
      t.mesh.position.copy(t.position);

      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        this.tracers.splice(i, 1);
      }
    }

    return intercepted;
  }

  clearInterceptors() {
    for (const inter of this.interceptors) {
      this.scene.remove(inter.mesh);
    }
    this.interceptors = [];
    for (const t of this.tracers) {
      this.scene.remove(t.mesh);
    }
    this.tracers = [];
    this.samCooldown = 0;
    this.ciwsCooldown = 0;
  }
}

window.AirDefenseSystem = AirDefenseSystem;
