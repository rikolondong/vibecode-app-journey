/**
 * Military Targets & Destructible Structures on Mountain Terrain
 * Includes Command Bunker, Radar Installation, Ammo Depot, and Armored Convoy
 */

class TargetManager {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.targets = [];
    this.initTargets();
  }

  initTargets() {
    // 1. Bunker Komando "Alpha" - High cliff fortified fortress
    const bunkerPos = new THREE.Vector3(-450, 0, 1850);
    bunkerPos.y = this.terrain.getTerrainHeight(bunkerPos.x, bunkerPos.z);
    this.createCommandBunker('bunker_alpha', 'BUNKER KOMANDO ALPHA', bunkerPos);

    // 2. Kubah Radar Pengawas "Bravo" - High alpine mountain peak
    const radarPos = new THREE.Vector3(-100, 0, 3200);
    radarPos.y = this.terrain.getTerrainHeight(radarPos.x, radarPos.z);
    this.createRadarStation('radar_bravo', 'INSTALASI RADAR BRAVO', radarPos);

    // 3. Depot Amunisi & Bahan Bakar "Charlie" - Mountain plateau
    const ammoPos = new THREE.Vector3(650, 0, -850);
    ammoPos.y = this.terrain.getTerrainHeight(ammoPos.x, ammoPos.z);
    this.createAmmoDepot('ammo_charlie', 'DEPOT AMUNISI CHARLIE', ammoPos);

    // 4. Konvoi Lapis Baja "Delta" - Mountain road pass
    const convoyPos = new THREE.Vector3(250, 0, 400);
    convoyPos.y = this.terrain.getTerrainHeight(convoyPos.x, convoyPos.z);
    this.createArmoredConvoy('convoy_delta', 'KONVOI TANK DELTA', convoyPos);
  }

  createCommandBunker(id, name, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Concrete Bastion Base
    const baseGeo = new THREE.BoxGeometry(60, 16, 50);
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x4b535b,
      roughness: 0.85,
      metalness: 0.15
    });
    const base = new THREE.Mesh(baseGeo, concreteMat);
    base.position.y = 8;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Reinforced Roof Slab (splits into two halves on destruction)
    const roofLeft = new THREE.Mesh(
      new THREE.BoxGeometry(32, 6, 54),
      new THREE.MeshStandardMaterial({ color: 0x353c42, roughness: 0.9 })
    );
    roofLeft.position.set(-16, 18, 0);
    roofLeft.castShadow = true;
    group.add(roofLeft);

    const roofRight = new THREE.Mesh(
      new THREE.BoxGeometry(32, 6, 54),
      new THREE.MeshStandardMaterial({ color: 0x353c42, roughness: 0.9 })
    );
    roofRight.position.set(16, 18, 0);
    roofRight.castShadow = true;
    group.add(roofRight);

    // Steel Blast Doors
    const doorGeo = new THREE.BoxGeometry(16, 10, 3);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1f2429, metalness: 0.7, roughness: 0.4 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 7, -26);
    group.add(door);

    // Radio Comm Tower on Bunker
    const towerGeo = new THREE.CylinderGeometry(0.5, 2.5, 35, 6);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xc93b3b });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(20, 36, 15);
    group.add(tower);

    this.scene.add(group);

    this.targets.push({
      id: id,
      name: name,
      type: 'bunker',
      position: pos.clone().add(new THREE.Vector3(0, 12, 0)),
      groundPos: pos.clone(),
      group: group,
      destructibleParts: [roofLeft, roofRight, tower, door, base],
      maxHp: 1800,
      hp: 1800,
      isDestroyed: false,
      destroyedAnimationTime: 0
    });
  }

  createRadarStation(id, name, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Foundation Base
    const fGeo = new THREE.CylinderGeometry(24, 28, 12, 16);
    const fMat = new THREE.MeshStandardMaterial({ color: 0x3d4349, roughness: 0.8 });
    const foundation = new THREE.Mesh(fGeo, fMat);
    foundation.position.y = 6;
    group.add(foundation);

    // Geodesic Radar Dome (Spherical radome)
    const domeGeo = new THREE.SphereGeometry(18, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xdce2e6,
      roughness: 0.4,
      metalness: 0.1
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 12;
    dome.castShadow = true;
    group.add(dome);

    // Rotating Parabolic Dish Antenna
    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, 34, 0);

    const mastGeo = new THREE.CylinderGeometry(1.2, 1.8, 16, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x5a6570 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = -4;
    dishGroup.add(mast);

    const dishGeo = new THREE.CylinderGeometry(12, 1, 4, 16, 1, true);
    dishGeo.rotateX(Math.PI / 2);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dishGroup.add(dish);

    group.add(dishGroup);
    this.scene.add(group);

    this.targets.push({
      id: id,
      name: name,
      type: 'radar',
      position: pos.clone().add(new THREE.Vector3(0, 18, 0)),
      groundPos: pos.clone(),
      group: group,
      rotatingDish: dishGroup,
      destructibleParts: [dome, dishGroup, foundation],
      maxHp: 800,
      hp: 800,
      isDestroyed: false,
      destroyedAnimationTime: 0
    });
  }

  createAmmoDepot(id, name, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Reinforced Revetment Berms
    const bermGeo = new THREE.BoxGeometry(70, 6, 50);
    const bermMat = new THREE.MeshStandardMaterial({ color: 0x363c32, roughness: 0.95 });
    const berm = new THREE.Mesh(bermGeo, bermMat);
    berm.position.y = 3;
    group.add(berm);

    // Fuel Storage Tanks (Cylinders)
    const tanks = [];
    for (const offset of [-16, 16]) {
      const tankGeo = new THREE.CylinderGeometry(8, 8, 22, 16);
      tankGeo.rotateZ(Math.PI / 2);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xd9e2ec, metalness: 0.6, roughness: 0.3 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(offset, 13, -10);
      tank.castShadow = true;
      group.add(tank);
      tanks.push(tank);
    }

    // Stacked Missile Munitions Crates
    const crates = [];
    for (let i = 0; i < 6; i++) {
      const crateGeo = new THREE.BoxGeometry(7, 4.5, 14);
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x2b4c30, roughness: 0.8 });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(-18 + (i % 3) * 10, 8 + Math.floor(i / 3) * 5, 12);
      group.add(crate);
      crates.push(crate);
    }

    this.scene.add(group);

    this.targets.push({
      id: id,
      name: name,
      type: 'ammo_depot',
      position: pos.clone().add(new THREE.Vector3(0, 10, 0)),
      groundPos: pos.clone(),
      group: group,
      destructibleParts: [...tanks, ...crates, berm],
      maxHp: 650,
      hp: 650,
      isDestroyed: false,
      destroyedAnimationTime: 0
    });
  }

  createArmoredConvoy(id, name, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const tankMat = new THREE.MeshStandardMaterial({ color: 0x434d3a, roughness: 0.7, metalness: 0.3 });

    // Tank Hull
    const hullGeo = new THREE.BoxGeometry(16, 5, 26);
    const hull = new THREE.Mesh(hullGeo, tankMat);
    hull.position.y = 3.5;
    hull.castShadow = true;
    group.add(hull);

    // Tank Turret Group (Includes barrel so barrel flies off with turret!)
    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, 7.5, -1);

    const turretMesh = new THREE.Mesh(new THREE.BoxGeometry(11, 4.5, 13), tankMat);
    turretMesh.castShadow = true;
    turretGroup.add(turretMesh);

    const barrelGeo = new THREE.CylinderGeometry(0.7, 0.9, 18, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, tankMat);
    barrel.position.set(0, 0, -14);
    turretGroup.add(barrel);

    group.add(turretGroup);

    // Caterpillar Treads
    for (const side of [-8.5, 8.5]) {
      const treadGeo = new THREE.BoxGeometry(2.5, 4, 27);
      const treadMat = new THREE.MeshStandardMaterial({ color: 0x1f2120, roughness: 0.9 });
      const tread = new THREE.Mesh(treadGeo, treadMat);
      tread.position.set(side, 2, 0);
      group.add(tread);
    }

    // Accompanying APC / IFV behind tank
    const apcMesh = new THREE.Mesh(new THREE.BoxGeometry(13, 6.5, 21), tankMat);
    apcMesh.position.set(14, 3.5, 36);
    apcMesh.castShadow = true;
    group.add(apcMesh);

    this.scene.add(group);

    this.targets.push({
      id: id,
      name: name,
      type: 'convoy',
      position: pos.clone().add(new THREE.Vector3(0, 6, 0)),
      groundPos: pos.clone(),
      group: group,
      turret: turretGroup,
      destructibleParts: [turretGroup, hull, apcMesh],
      maxHp: 1100,
      hp: 1100,
      isDestroyed: false,
      destroyedAnimationTime: 0
    });
  }

  // Damage Evaluation from Blast Impact
  applyBlastDamage(hitPos, yieldKg, blastRadius, missileType = '') {
    let nearestTarget = null;
    let minDistance = Infinity;

    for (const target of this.targets) {
      const dist = hitPos.distanceTo(target.position);
      if (dist < minDistance) {
        minDistance = dist;
        nearestTarget = target;
      }

      if (target.isDestroyed) continue;

      const effectiveRadius = Math.max(blastRadius, 45);
      if (dist <= effectiveRadius) {
        // Direct hit or close proximity shaped-charge / penetrator bonus
        const proximityFactor = dist < 24 ? 1.0 : Math.pow(1 - dist / effectiveRadius, 1.5);
        // Shaped charges (Javelin/TOW) have high armor penetration on direct hits
        const baseDamage = yieldKg < 20 ? 1950 : yieldKg * 5.0;
        const damage = Math.round(baseDamage * proximityFactor);
        target.hp = Math.max(0, target.hp - damage);

        if (target.hp <= 0) {
          this.triggerDestruction(target, hitPos);
        }
      }
    }

    return {
      nearestTarget: nearestTarget,
      distance: minDistance,
      allTargets: this.targets
    };
  }

  triggerDestruction(target, blastPoint) {
    if (target.isDestroyed) return;
    target.isDestroyed = true;
    target.destroyedAnimationTime = 0.01;

    // Safely darken all child meshes (works for both Mesh and Group)
    for (const part of target.destructibleParts) {
      if (!part) continue;
      part.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.setHex(0x1c1c1c);
          child.material.roughness = 0.95;
        }
      });

      // Impart blast impulse velocity
      const partWorldPos = new THREE.Vector3();
      part.getWorldPosition(partWorldPos);
      const impulseDir = partWorldPos.sub(blastPoint);
      if (impulseDir.lengthSq() < 0.01) {
        impulseDir.set(Math.random() - 0.5, 1, Math.random() - 0.5);
      }
      impulseDir.normalize();

      part.userData.velocity = impulseDir.multiplyScalar(18 + Math.random() * 28);
      part.userData.velocity.y = Math.abs(part.userData.velocity.y) + 22 + Math.random() * 20;
      part.userData.rotVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4.5
      );
    }

    // If tank convoy, launch turret flying high into the air!
    if (target.turret) {
      target.turret.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        52 + Math.random() * 18,
        (Math.random() - 0.5) * 18
      );
      target.turret.userData.rotVelocity = new THREE.Vector3(5, 3, -4);
    }

    // Secondary cook-off explosions for Ammo Depot & Convoy
    if (window.gameInstance && window.gameInstance.vfxManager) {
      const vfx = window.gameInstance.vfxManager;
      if (target.type === 'ammo_depot' || target.type === 'convoy') {
        setTimeout(() => {
          if (target.isDestroyed) {
            vfx.spawnExplosion(
              target.position.clone().add(new THREE.Vector3(12, 4, -8)),
              85,
              250,
              'secondary'
            );
            window.soundEngine.playExplosion(800, 250);
          }
        }, 450);
      }
    }
  }

  update(delta) {
    for (const target of this.targets) {
      // Rotate radar dish if alive
      if (!target.isDestroyed && target.rotatingDish) {
        target.rotatingDish.rotation.y += delta * 1.4;
      }

      // Destruction physics animation with ground bounce
      if (target.isDestroyed && target.destroyedAnimationTime > 0) {
        target.destroyedAnimationTime += delta;
        if (target.destroyedAnimationTime < 6.0) {
          for (const part of target.destructibleParts) {
            if (part && part.userData.velocity) {
              part.position.addScaledVector(part.userData.velocity, delta);
              part.userData.velocity.y -= 42 * delta; // Gravity

              // Bounce and settle on target pad ground (local y >= 2.0)
              if (part.position.y < 2.0) {
                part.position.y = 2.0;
                part.userData.velocity.y *= -0.25;
                part.userData.velocity.x *= 0.65;
                part.userData.velocity.z *= 0.65;
                if (part.userData.rotVelocity) {
                  part.userData.rotVelocity.multiplyScalar(0.6);
                }
              }

              if (part.userData.rotVelocity) {
                part.rotation.x += part.userData.rotVelocity.x * delta;
                part.rotation.y += part.userData.rotVelocity.y * delta;
                part.rotation.z += part.userData.rotVelocity.z * delta;
              }
            }
          }
        }
      }
    }
  }

  resetAll() {
    for (const target of this.targets) {
      this.scene.remove(target.group);
    }
    this.targets = [];
    this.initTargets();
  }
}

window.TargetManager = TargetManager;
