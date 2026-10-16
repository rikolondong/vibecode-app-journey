// Player Controller & Zombie AI Entities

class PlayerEntity {
  constructor(scene, world, systems) {
    this.scene = scene;
    this.world = world;
    this.systems = systems;

    this.x = -4.5;
    this.z = 3.5; // Start inside Living Room
    this.rotationY = 0;
    this.aimX = -4.5;
    this.aimZ = 6.0;

    this.isSneaking = false;
    this.isSprinting = false;
    this.attackCooldown = 0;
    this.shoveCooldown = 0;
    this.swingAnimTime = 0;
    this.walkCycle = 0;
    this.glassStepTimer = 0;

    this.buildMesh();
    this.setupFlashlight();
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.x, 0, this.z);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.65, 0.22);
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2b3a4a });
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.13, 0.32, 0);
    this.leftLeg.castShadow = true;
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.13, 0.32, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.leftLeg, this.rightLeg);

    // Torso (Jacket)
    const torsoGeo = new THREE.BoxGeometry(0.52, 0.72, 0.3);
    const jacketMat = new THREE.MeshLambertMaterial({ color: 0x3d5a45 });
    this.torso = new THREE.Mesh(torsoGeo, jacketMat);
    this.torso.position.set(0, 0.98, 0);
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Backpack
    const packGeo = new THREE.BoxGeometry(0.38, 0.52, 0.22);
    const packMat = new THREE.MeshLambertMaterial({ color: 0x4a3b2c });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 1.0, -0.22);
    this.group.add(pack);

    // Head
    const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0b596 });
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.54, 0);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Hair / Cap
    const capGeo = new THREE.BoxGeometry(0.38, 0.14, 0.42);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x222629 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.72, 0.03);
    this.group.add(cap);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.62, 0.18);
    this.leftArm = new THREE.Mesh(armGeo, jacketMat);
    this.leftArm.position.set(-0.35, 0.98, 0);
    this.rightArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArm.position.set(0.35, 0.98, 0.12);
    this.group.add(this.leftArm, this.rightArm);

    // Held Weapon Mesh Container
    this.weaponHolder = new THREE.Group();
    this.weaponHolder.position.set(0.36, 0.95, 0.38);
    this.group.add(this.weaponHolder);
    this.currentWeaponId = null;
    this.rebuildWeaponMesh(null);

    // Subtle Aim Direction Ring & Line on Ground
    const aimLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.06, 0.4),
      new THREE.Vector3(0, 0.06, 2.2)
    ]);
    const aimLineMat = new THREE.LineBasicMaterial({
      color: 0xe5a93c,
      transparent: true,
      opacity: 0.45
    });
    this.aimLine = new THREE.Line(aimLineGeo, aimLineMat);
    this.group.add(this.aimLine);

    this.scene.add(this.group);
  }

  rebuildWeaponMesh(weaponId) {
    if (this.currentWeaponId === weaponId) return;
    this.currentWeaponId = weaponId;

    while (this.weaponHolder.children.length > 0) {
      this.weaponHolder.remove(this.weaponHolder.children[0]);
    }

    if (!weaponId) return;

    if (weaponId === 'baseball_bat' || weaponId === 'spiked_bat') {
      const batGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.95, 7);
      const batMat = new THREE.MeshLambertMaterial({
        color: weaponId === 'spiked_bat' ? 0x6e4726 : 0xa67545
      });
      const bat = new THREE.Mesh(batGeo, batMat);
      bat.rotation.x = Math.PI / 2.4;
      bat.position.z = 0.32;
      this.weaponHolder.add(bat);
    } else if (weaponId === 'pistol_9mm') {
      const gunGeo = new THREE.BoxGeometry(0.09, 0.14, 0.34);
      const gunMat = new THREE.MeshLambertMaterial({ color: 0x22252a });
      const gun = new THREE.Mesh(gunGeo, gunMat);
      gun.position.z = 0.18;
      this.weaponHolder.add(gun);
    } else if (weaponId === 'fire_axe' || weaponId === 'hammer') {
      const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 6);
      const handleMat = new THREE.MeshLambertMaterial({ color: 0x8a5a32 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.rotation.x = Math.PI / 2.3;
      handle.position.z = 0.25;
      const headGeo = new THREE.BoxGeometry(0.24, 0.14, 0.14);
      const headMat = new THREE.MeshLambertMaterial({
        color: weaponId === 'fire_axe' ? 0xc92a2a : 0x6c757d
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 0.12, 0.52);
      this.weaponHolder.add(handle, head);
    } else {
      const bladeGeo = new THREE.BoxGeometry(0.05, 0.08, 0.42);
      const bladeMat = new THREE.MeshLambertMaterial({ color: 0xced4da });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.z = 0.18;
      this.weaponHolder.add(blade);
    }
  }

  setupFlashlight() {
    this.flashlight = new THREE.SpotLight(0xfff8e7, 0, 16, Math.PI / 4.2, 0.45, 1.3);
    this.flashlight.position.set(0, 1.3, 0);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Muzzle Flash PointLight
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 10, 2);
    this.scene.add(this.muzzleLight);
    this.muzzleTimer = 0;
  }

  update(dt, keys) {
    if (this.systems.health <= 0 || this.systems.isSleeping) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.shoveCooldown = Math.max(0, this.shoveCooldown - dt);

    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0) this.muzzleLight.intensity = 0;
    }

    // Check active equipped weapon mesh
    const activeItem = this.systems.getActiveItem();
    const activeDef = activeItem ? ITEM_DB[activeItem.id] : null;
    this.rebuildWeaponMesh(activeDef && activeDef.type === 'weapon' ? activeItem.id : null);

    // Movement input (Isometric-aligned WASD)
    let moveX = 0;
    let moveZ = 0;
    const camAngle = window.isoCameraAngle || (Math.PI / 4);
    const forwardX = -Math.sin(camAngle);
    const forwardZ = -Math.cos(camAngle);
    const rightX = Math.cos(camAngle);
    const rightZ = -Math.sin(camAngle);

    if (keys['KeyW'] || keys['ArrowUp']) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
      moveX += rightX;
      moveZ += rightZ;
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
      moveX -= rightX;
      moveZ -= rightZ;
    }

    const isMoving = Math.hypot(moveX, moveZ) > 0.01;
    this.isSprinting = isMoving && (keys['ShiftLeft'] || keys['ShiftRight']) && this.systems.stamina > 8 && !this.isSneaking;

    let baseSpeed = 3.9;
    if (this.systems.fatigue > 75) baseSpeed *= 0.78;
    if (this.systems.bleeding) baseSpeed *= 0.85;
    if (this.isSneaking) baseSpeed *= 0.58;
    else if (this.isSprinting) baseSpeed *= 1.52;

    if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      moveX = (moveX / len) * baseSpeed * dt;
      moveZ = (moveZ / len) * baseSpeed * dt;

      const resolved = this.world.resolveCollision(this.x + moveX, this.z + moveZ, 0.36);
      this.x = resolved.x;
      this.z = resolved.z;

      // Stamina & Footstep noise
      if (this.isSprinting) {
        this.systems.stamina = Math.max(0, this.systems.stamina - dt * 15.0);
        if (Math.random() < dt * 3.5) {
          this.systems.emitNoise(this.x, this.z, 8.5, 'Lari');
        }
      } else {
        this.systems.stamina = Math.min(100, this.systems.stamina + dt * 6.0);
        if (!this.isSneaking && Math.random() < dt * 1.4) {
          this.systems.emitNoise(this.x, this.z, 3.2);
        }
      }

      window.soundFX.playFootstep(this.isSneaking, this.isSprinting);

      // Walk animation
      this.walkCycle += dt * (this.isSprinting ? 14 : 9);
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.55;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.55;
      this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.4;

      // Check stepping on broken glass
      this.glassStepTimer = Math.max(0, this.glassStepTimer - dt);
      if (this.glassStepTimer <= 0) {
        for (const gh of this.world.glassHazards) {
          if (Math.hypot(this.x - gh.x, this.z - gh.z) < gh.radius) {
            this.glassStepTimer = 1.6;
            window.soundFX.playGlassShatter();
            this.systems.emitNoise(this.x, this.z, 9.0, 'Injak Kaca');
            window.addLog('Anda menginjak pecahan kaca! Menimbulkan suara berisik.', 'warn');
            break;
          }
        }
      }
    } else {
      // Idle stamina recovery
      this.systems.stamina = Math.min(100, this.systems.stamina + dt * 12.5);
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
    }

    // Crouch stance visual
    this.group.scale.y = this.isSneaking ? 0.82 : 1.0;

    // Face towards mouse aim point
    const dx = this.aimX - this.x;
    const dz = this.aimZ - this.z;
    if (Math.hypot(dx, dz) > 0.05) {
      this.rotationY = Math.atan2(dx, dz);
      this.group.rotation.y = this.rotationY;
    }

    // Melee swing animation
    if (this.swingAnimTime > 0) {
      this.swingAnimTime = Math.max(0, this.swingAnimTime - dt * 5.0);
      this.rightArm.rotation.x = -1.2 * Math.sin(this.swingAnimTime * Math.PI);
      this.weaponHolder.rotation.y = -0.9 * Math.sin(this.swingAnimTime * Math.PI);
    } else {
      this.rightArm.rotation.x = -0.35;
      this.weaponHolder.rotation.y = 0;
    }

    this.group.position.set(this.x, 0, this.z);

    // Update Flashlight Position & Target
    this.flashlight.intensity = (this.systems.flashlightOn && this.systems.flashlightBattery > 0) ? 2.1 : 0;
    this.flashlight.position.set(this.x, 1.35, this.z);
    this.flashlightTarget.position.set(
      this.x + Math.sin(this.rotationY) * 8,
      0.5,
      this.z + Math.cos(this.rotationY) * 8
    );
  }

  performAttack() {
    if (this.attackCooldown > 0 || this.systems.isSleeping || this.systems.health <= 0) return;

    const activeItem = this.systems.getActiveItem();
    const def = activeItem ? ITEM_DB[activeItem.id] : null;

    // Ranged Weapon (Pistol 9mm)
    if (def && def.weaponType === 'ranged') {
      if (this.systems.getItemCount('ammo_9mm') < 1) {
        window.soundFX.playClick();
        window.addLog('Klik! Peluru 9mm habis! Gunakan senjata melee atau cari amunisi.', 'danger');
        this.attackCooldown = 0.35;
        return;
      }

      this.systems.removeItem('ammo_9mm', 1);
      this.attackCooldown = def.cooldown;
      this.swingAnimTime = 0.5;
      window.soundFX.playGunshot();

      // Muzzle Flash
      this.muzzleLight.position.set(
        this.x + Math.sin(this.rotationY) * 0.7,
        1.2,
        this.z + Math.cos(this.rotationY) * 0.7
      );
      this.muzzleLight.intensity = 3.5;
      this.muzzleTimer = 0.08;

      // Huge Gunshot Noise Ripple
      this.systems.emitNoise(this.x, this.z, def.noise, 'Tembakan 9mm!');

      // Find best zombie in aim cone within range
      let bestZombie = null;
      let bestScore = 999;
      for (const zmb of this.world.zombies) {
        if (zmb.isDead) continue;
        const dist = Math.hypot(zmb.x - this.x, zmb.z - this.z);
        if (dist > def.range) continue;

        const angleToZ = Math.atan2(zmb.x - this.x, zmb.z - this.z);
        let angleDiff = Math.abs(angleToZ - this.rotationY);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff < 0.38 && this.world.hasLineOfSight(this.x, this.z, zmb.x, zmb.z)) {
          if (dist < bestScore) {
            bestScore = dist;
            bestZombie = zmb;
          }
        }
      }

      if (bestZombie) {
        // Panic slightly reduces crit accuracy
        const panicPenalty = this.systems.panic > 60 ? 0.75 : 1.0;
        const dmg = def.damage * panicPenalty * (0.9 + Math.random() * 0.3);
        bestZombie.takeDamage(dmg, Math.sin(this.rotationY) * def.knockback, Math.cos(this.rotationY) * def.knockback);
      }
      return;
    }

    // Melee Weapon or Bare Hands
    const staminaCost = def && def.type === 'weapon' ? def.staminaCost : 8;
    if (this.systems.stamina < staminaCost * 0.5) {
      window.addLog('Terlalu lelah untuk mengayunkan senjata!', 'warn');
      return;
    }

    this.systems.stamina = Math.max(0, this.systems.stamina - staminaCost);
    const dmgBase = def && def.type === 'weapon' ? def.damage : 12;
    const range = def && def.type === 'weapon' ? def.range : 1.55;
    const knockback = def && def.type === 'weapon' ? def.knockback : 0.8;
    const noise = def && def.type === 'weapon' ? def.noise : 2.5;
    this.attackCooldown = def && def.type === 'weapon' ? def.cooldown : 0.45;
    this.swingAnimTime = 1.0;

    window.soundFX.playSwing();
    this.systems.emitNoise(this.x, this.z, noise);

    let hitAny = false;
    for (const zmb of this.world.zombies) {
      if (zmb.isDead) continue;
      const dist = Math.hypot(zmb.x - this.x, zmb.z - this.z);
      if (dist <= range) {
        const angleToZ = Math.atan2(zmb.x - this.x, zmb.z - this.z);
        let angleDiff = Math.abs(angleToZ - this.rotationY);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff < 0.95) {
          const fatigueMult = this.systems.fatigue > 75 ? 0.65 : 1.0;
          zmb.takeDamage(
            dmgBase * fatigueMult,
            Math.sin(this.rotationY) * knockback,
            Math.cos(this.rotationY) * knockback
          );
          hitAny = true;
        }
      }
    }

    if (hitAny && activeItem && def && def.type === 'weapon') {
      activeItem.durability -= 1;
      if (activeItem.durability <= 0) {
        window.addLog(`${def.name} hancur karena aus!`, 'danger');
        this.systems.removeItem(activeItem.id, 1);
      }
    }
  }

  performShove() {
    if (this.shoveCooldown > 0 || this.systems.stamina < 8 || this.systems.isSleeping) return;
    this.shoveCooldown = 0.65;
    this.systems.stamina = Math.max(0, this.systems.stamina - 8);
    this.swingAnimTime = 0.8;
    window.soundFX.playSwing();

    let shoved = 0;
    for (const zmb of this.world.zombies) {
      if (zmb.isDead) continue;
      const dist = Math.hypot(zmb.x - this.x, zmb.z - this.z);
      if (dist <= 2.0) {
        const angleToZ = Math.atan2(zmb.x - this.x, zmb.z - this.z);
        let angleDiff = Math.abs(angleToZ - this.rotationY);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        if (angleDiff < 1.15) {
          zmb.stagger(1.35, Math.sin(this.rotationY) * 2.2, Math.cos(this.rotationY) * 2.2);
          shoved++;
        }
      }
    }
    if (shoved > 0) {
      window.soundFX.playHitFlesh();
    }
  }
}

class ZombieEntity {
  constructor(scene, world, systems, x, z, isSprinter = false) {
    this.scene = scene;
    this.world = world;
    this.systems = systems;

    this.x = x;
    this.z = z;
    this.rotationY = Math.random() * Math.PI * 2;
    this.isSprinter = isSprinter;
    this.speed = isSprinter ? 2.85 : (1.35 + Math.random() * 0.45);
    this.maxHp = isSprinter ? 75 : 100;
    this.hp = this.maxHp;
    this.isDead = false;

    this.state = 'WANDER'; // 'WANDER', 'INVESTIGATE', 'CHASE', 'POUNDING'
    this.targetX = x;
    this.targetZ = z;
    this.wanderTimer = 2 + Math.random() * 4;
    this.staggerTimer = 0;
    this.attackTimer = 0;
    this.walkCycle = Math.random() * 10;

    this.buildMesh();
  }

  buildMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.x, 0, this.z);

    const shirtColors = [0x4a5548, 0x5c3c3c, 0x3f4a59, 0x595240];
    const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x6c8565 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x292b2e });

    const legGeo = new THREE.BoxGeometry(0.19, 0.62, 0.2);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.12, 0.31, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.12, 0.31, 0);
    this.group.add(this.leftLeg, this.rightLeg);

    const torsoGeo = new THREE.BoxGeometry(0.48, 0.68, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.set(0, 0.94, 0.04);
    this.torso.rotation.x = 0.16; // Hunched posture
    this.torso.castShadow = true;
    this.group.add(this.torso);

    const headGeo = new THREE.BoxGeometry(0.34, 0.35, 0.34);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.46, 0.1);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Outstretched Zombie Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.32, 1.08, 0.25);
    this.leftArm.rotation.x = -Math.PI / 2.3;
    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.32, 1.08, 0.25);
    this.rightArm.rotation.x = -Math.PI / 2.3;
    this.group.add(this.leftArm, this.rightArm);

    // Health Bar above head (hidden when full HP)
    const hbBgGeo = new THREE.PlaneGeometry(0.7, 0.09);
    const hbBgMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    this.hbBg = new THREE.Mesh(hbBgGeo, hbBgMat);
    this.hbBg.position.set(0, 1.98, 0);
    this.hbBg.visible = false;

    const hbFillGeo = new THREE.PlaneGeometry(0.66, 0.06);
    const hbFillMat = new THREE.MeshBasicMaterial({ color: 0xd9463e, side: THREE.DoubleSide });
    this.hbFill = new THREE.Mesh(hbFillGeo, hbFillMat);
    this.hbFill.position.set(0, 0, 0.01);
    this.hbBg.add(this.hbFill);
    this.group.add(this.hbBg);

    this.scene.add(this.group);
  }

  takeDamage(dmg, kbX = 0, kbZ = 0) {
    if (this.isDead) return;
    this.hp -= dmg;
    window.soundFX.playHitFlesh();

    this.hbBg.visible = true;
    const ratio = Math.max(0.01, this.hp / this.maxHp);
    this.hbFill.scale.x = ratio;

    // Knockback
    const res = this.world.resolveCollision(this.x + kbX * 0.45, this.z + kbZ * 0.45, 0.35);
    this.x = res.x;
    this.z = res.z;
    this.staggerTimer = 0.35;
    this.state = 'CHASE';

    if (this.hp <= 0) {
      this.die();
    }
  }

  stagger(duration, kbX, kbZ) {
    if (this.isDead) return;
    this.staggerTimer = duration;
    const res = this.world.resolveCollision(this.x + kbX * 0.55, this.z + kbZ * 0.55, 0.35);
    this.x = res.x;
    this.z = res.z;
  }

  die() {
    this.isDead = true;
    this.hbBg.visible = false;
    this.group.rotation.x = -Math.PI / 2;
    this.group.position.y = 0.18;
    this.systems.kills += 1;

    // Chance to drop useful survival loot on zombie corpse
    if (Math.random() < 0.55) {
      const drops = [
        { id: 'dirty_rag', count: 1 },
        { id: 'nails', count: 3 },
        { id: 'ammo_9mm', count: 4 },
        { id: 'painkillers', count: 1 }
      ];
      const pick = drops[Math.floor(Math.random() * drops.length)];
      this.systems.addItem(pick.id, pick.count);
      const itemName = ITEM_DB[pick.id].name;
      window.addLog(`Zombie tewas! Anda menemukan ${itemName} (${pick.count}x).`, 'good');
    }

    // Fade and remove corpse after 25 seconds
    setTimeout(() => {
      this.scene.remove(this.group);
    }, 25000);
  }

  alertByNoise(nx, nz) {
    if (this.isDead || this.state === 'CHASE') return;
    this.state = 'INVESTIGATE';
    this.targetX = nx + (Math.random() - 0.5) * 1.5;
    this.targetZ = nz + (Math.random() - 0.5) * 1.5;
  }

  update(dt, player) {
    if (this.isDead) return;

    if (this.hbBg.visible) {
      this.hbBg.rotation.y = -this.group.rotation.y + (window.isoCameraAngle || Math.PI / 4);
    }

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dt;
      this.torso.rotation.x = -0.25;
      this.group.position.set(this.x, 0, this.z);
      return;
    } else {
      this.torso.rotation.x = 0.16;
    }

    this.attackTimer = Math.max(0, this.attackTimer - dt);

    // 1. Sensory Check: Can zombie see Player?
    const distToPlayer = Math.hypot(player.x - this.x, player.z - this.z);
    const detectionRange = player.isSneaking ? 6.5 : 12.5;

    if (distToPlayer < detectionRange && this.world.hasLineOfSight(this.x, this.z, player.x, player.z)) {
      if (this.state !== 'CHASE' && Math.random() < 0.3) {
        window.soundFX.playZombieGroan();
      }
      this.state = 'CHASE';
      this.targetX = player.x;
      this.targetZ = player.z;
    } else if (this.state === 'CHASE') {
      // Continue to last known player position, then revert to INVESTIGATE
      if (Math.hypot(this.targetX - this.x, this.targetZ - this.z) < 0.8) {
        this.state = 'WANDER';
      }
    }

    // 2. Night Light Attraction: If house lights are ON and an uncurtained window is nearby
    const isNight = this.systems.timeHours >= 19.0 || this.systems.timeHours <= 5.5;
    if (this.state === 'WANDER' && isNight && this.systems.hasElectricity() && this.systems.houseLightsOn) {
      for (const op of this.world.openings) {
        if (op.type === 'window' && !op.hasCurtainClosed && op.planks < 3) {
          const dWin = Math.hypot(op.cx - this.x, op.cz - this.z);
          if (dWin < 15.0) {
            this.state = 'INVESTIGATE';
            this.targetX = op.cx;
            this.targetZ = op.cz;
            break;
          }
        }
      }
    }

    // 3. Wander target selection
    if (this.state === 'WANDER') {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 4 + Math.random() * 6;
        this.targetX = this.x + (Math.random() - 0.5) * 8;
        this.targetZ = this.z + (Math.random() - 0.5) * 8;
      }
    }

    // 4. Check if close enough to attack Player directly
    if (distToPlayer < 1.15 && !this.systems.isSleeping && this.systems.health > 0) {
      if (this.attackTimer <= 0) {
        this.attackTimer = 1.25;
        window.soundFX.playZombieGroan();
        window.soundFX.playHitFlesh();
        const dmg = 12 + Math.floor(Math.random() * 8);
        this.systems.health = Math.max(0, this.systems.health - dmg);
        this.systems.panic = Math.min(100, this.systems.panic + 25);

        // Chance of Bleeding & Infection (Project Zomboid style)
        if (!this.systems.bleeding && Math.random() < 0.42) {
          this.systems.bleeding = true;
          window.addLog('LUKA ROBEK! Anda mengalami Pendarahan! Segera gunakan Perban!', 'danger');
        } else {
          window.addLog(`Zombie mencakar Anda! (-${dmg} HP)`, 'danger');
        }
        if (!this.systems.infected && Math.random() < 0.18) {
          this.systems.infected = true;
          window.addLog('Luka terasa panas... Gejala awal infeksi muncul.', 'warn');
        }
      }
      return;
    }

    // 5. Check if blocked by a closed Door or Window along path
    for (const op of this.world.openings) {
      if (!op.collider.active) continue; // Already open or broken
      const distOp = Math.hypot(op.cx - this.x, op.cz - this.z);
      if (distOp < 1.35 && (this.state === 'CHASE' || this.state === 'INVESTIGATE')) {
        // Pound on the door/window barricade!
        this.rotationY = Math.atan2(op.cx - this.x, op.cz - this.z);
        this.group.rotation.y = this.rotationY;
        if (this.attackTimer <= 0) {
          this.attackTimer = 1.45;
          this.leftArm.rotation.x = -Math.PI / 1.5;
          this.rightArm.rotation.x = -Math.PI / 1.5;
          this.world.damageOpeningByZombie(op, 22);
        }
        return;
      }
    }

    // 6. Move towards target (targetX, targetZ)
    const dx = this.targetX - this.x;
    const dz = this.targetZ - this.z;
    const distTarget = Math.hypot(dx, dz);

    if (distTarget > 0.25) {
      const moveSpeed = this.state === 'WANDER' ? this.speed * 0.45 : this.speed;
      const stepX = (dx / distTarget) * moveSpeed * dt;
      const stepZ = (dz / distTarget) * moveSpeed * dt;

      const res = this.world.resolveCollision(this.x + stepX, this.z + stepZ, 0.35);
      this.x = res.x;
      this.z = res.z;

      this.rotationY = Math.atan2(dx, dz);
      this.group.rotation.y = this.rotationY;

      this.walkCycle += dt * (moveSpeed * 4.2);
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.45;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.45;
      this.leftArm.rotation.x = -Math.PI / 2.3 + Math.sin(this.walkCycle) * 0.15;
      this.rightArm.rotation.x = -Math.PI / 2.3 - Math.sin(this.walkCycle) * 0.15;
    } else if (this.state === 'INVESTIGATE') {
      this.state = 'WANDER';
    }

    this.group.position.set(this.x, 0, this.z);
  }
}

// Attach Zombie Spawning helpers to GameWorld prototype
GameWorld.prototype.spawnZombie = function (x, z, isSprinter = false) {
  const zmb = new ZombieEntity(this.scene, this, this.systems, x, z, isSprinter);
  this.zombies.push(zmb);
  return zmb;
};

GameWorld.prototype.spawnZombieGroup = function (count, alertTowardHouse = false) {
  const spawnZones = [
    { x: -18, z: 17 },
    { x: 18, z: 17 },
    { x: 0, z: 19 },
    { x: -19, z: -12 },
    { x: 19, z: -10 }
  ];
  for (let i = 0; i < count; i++) {
    const sz = spawnZones[Math.floor(Math.random() * spawnZones.length)];
    const zx = sz.x + (Math.random() - 0.5) * 5;
    const zz = sz.z + (Math.random() - 0.5) * 4;
    const isSprinter = Math.random() < 0.15;
    const zmb = this.spawnZombie(zx, zz, isSprinter);
    if (alertTowardHouse) {
      zmb.alertByNoise((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
    }
  }
};

GameWorld.prototype.spawnDailyWave = function (dayNum) {
  const count = Math.min(14, 3 + dayNum * 2);
  this.spawnZombieGroup(count, true);
};

GameWorld.prototype.alertZombiesByNoise = function (nx, nz, radius) {
  for (const zmb of this.zombies) {
    if (zmb.isDead) continue;
    const dist = Math.hypot(zmb.x - nx, zmb.z - nz);
    if (dist <= radius) {
      zmb.alertByNoise(nx, nz);
    }
  }
};

window.PlayerEntity = PlayerEntity;
window.ZombieEntity = ZombieEntity;
