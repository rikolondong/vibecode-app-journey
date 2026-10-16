// 3D Isometric World, Multi-Room House, Cutaway Walls, Interactive Objects & Lighting

class GameWorld {
  constructor(scene, systems) {
    this.scene = scene;
    this.systems = systems;

    this.colliders = []; // AABB boxes { minX, maxX, minZ, maxZ, type, ref }
    this.walls = [];     // Wall segments for cutaway rendering
    this.openings = [];  // Doors & Windows (interactive, barricadable)
    this.interactables = []; // Furniture, containers, utilities
    this.glassHazards = [];  // Broken glass on floor
    this.noiseMeshes = [];   // 3D expanding rings for noise
    this.zombies = [];

    this.generatorPos = { x: 8.2, z: -5.5 };

    this.setupLighting();
    this.buildEnvironment();
    this.buildHouseStructure();
    this.populateRoomsAndYard();
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x8fa4c4, 0.55);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d0, 0.95);
    this.sunLight.position.set(22, 34, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    const d = 26;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 85;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Interior Room Point Lights
    this.roomLights = [];
    const roomCoords = [
      { x: -5, z: 4, color: 0xffdba8, intensity: 0.9 },  // Ruang Tamu
      { x: -5, z: -4, color: 0xfff0d6, intensity: 0.85 }, // Dapur
      { x: 3, z: -4, color: 0xffd2a1, intensity: 0.8 },  // Kamar Tidur
      { x: 3, z: 2, color: 0xdff4ff, intensity: 0.7 },   // Kamar Mandi
      { x: 8, z: 0, color: 0xffe4b5, intensity: 0.75 }   // Garasi
    ];
    roomCoords.forEach(rc => {
      const pl = new THREE.PointLight(rc.color, rc.intensity, 11, 1.6);
      pl.position.set(rc.x, 3.1, rc.z);
      this.scene.add(pl);
      this.roomLights.push(pl);
    });

    // Streetlight outside
    this.streetLight = new THREE.PointLight(0xffb85c, 1.1, 16, 1.5);
    this.streetLight.position.set(-10, 4.8, 12.5);
    this.scene.add(this.streetLight);
  }

  buildEnvironment() {
    // Yard Grass Ground
    const groundGeo = new THREE.PlaneGeometry(76, 76);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x2c3b29 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Asphalt Road in front (z: 13 to 22)
    const roadGeo = new THREE.PlaneGeometry(76, 9.5);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x242629 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 17.2);
    road.receiveShadow = true;
    this.scene.add(road);

    // Road Dashed Line
    for (let x = -32; x <= 32; x += 5) {
      const lineGeo = new THREE.PlaneGeometry(2.4, 0.22);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xb89c40 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 17.2);
      this.scene.add(line);
    }

    // Sidewalk & Driveway
    const walkGeo = new THREE.PlaneGeometry(76, 1.6);
    const walkMat = new THREE.MeshLambertMaterial({ color: 0x55585c });
    const walk = new THREE.Mesh(walkGeo, walkMat);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(0, 0.015, 11.7);
    walk.receiveShadow = true;
    this.scene.add(walk);

    // Path to front door
    const pathGeo = new THREE.PlaneGeometry(2.2, 4.0);
    const pathMesh = new THREE.Mesh(pathGeo, walkMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(-4, 0.015, 10.0);
    this.scene.add(pathMesh);

    // House Floors per Room
    this.addFloorTile(-5, 4, 10, 8, 0x6b4c35);   // Ruang Tamu Wood Floor
    this.addFloorTile(-5, -4, 10, 8, 0x7c7468);  // Dapur Tile Floor
    this.addFloorTile(3, -4, 6, 8, 0x5c402e);    // Kamar Tidur Wood Floor
    this.addFloorTile(3, 2, 6, 4, 0x87969c);     // Kamar Mandi Ceramic
    this.addFloorTile(3, 6, 6, 4, 0x6b4c35);     // Hallway Front Right
    this.addFloorTile(8, 0, 4, 16, 0x494c52);    // Garasi Concrete Floor

    // Streetlight Pole
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.0, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x33373d });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(-10, 2.5, 12.2);
    pole.castShadow = true;
    this.scene.add(pole);
  }

  addFloorTile(cx, cz, w, d, colorHex) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mat = new THREE.MeshLambertMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, 0.02, cz);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  buildHouseStructure() {
    // Wall thickness = 0.3, height = 3.2
    // Helper to build wall line with openings (doors/windows)
    // Exterior South Wall (Front, z = 8, from x = -10 to +10)
    this.addWallSegment(-10, 8, -8.5, 8, true);
    this.addOpening('window', -7.25, 8, 2.5, 'horizontal', 'Jendela Depan Ruang Tamu');
    this.addWallSegment(-6.0, 8, -4.8, 8, true);
    this.addOpening('door', -3.9, 8, 1.8, 'horizontal', 'Pintu Utama Rumah');
    this.addWallSegment(-3.0, 8, -1.8, 8, true);
    this.addOpening('window', -0.6, 8, 2.4, 'horizontal', 'Jendela Tengah Ruang Tamu');
    this.addWallSegment(0.6, 8, 2.0, 8, true);
    this.addOpening('window', 3.2, 8, 2.4, 'horizontal', 'Jendela Teras Depan');
    this.addWallSegment(4.4, 8, 10.0, 8, true);

    // Exterior North Wall (Back, z = -8, from x = -10 to +10)
    this.addWallSegment(-10, -8, -8.2, -8, true);
    this.addOpening('door', -7.3, -8, 1.8, 'horizontal', 'Pintu Belakang Dapur');
    this.addWallSegment(-6.4, -8, -4.2, -8, true);
    this.addOpening('window', -3.0, -8, 2.4, 'horizontal', 'Jendela Dapur');
    this.addWallSegment(-1.8, -8, 1.8, -8, true);
    this.addOpening('window', 3.0, -8, 2.4, 'horizontal', 'Jendela Kamar Tidur');
    this.addWallSegment(4.2, -8, 10.0, -8, true);

    // Exterior West Wall (Left, x = -10, from z = -8 to +8)
    this.addWallSegment(-10, -8, -10, -5.2, true);
    this.addOpening('window', -10, -4.0, 2.4, 'vertical', 'Jendela Samping Dapur');
    this.addWallSegment(-10, -2.8, -10, 2.8, true);
    this.addOpening('window', -10, 4.0, 2.4, 'vertical', 'Jendela Samping Ruang Tamu');
    this.addWallSegment(-10, 5.2, -10, 8, true);

    // Exterior East Wall (Right Garage, x = 10, from z = -8 to +8)
    this.addWallSegment(10, -8, 10, -4.2, true);
    this.addOpening('window', 10, -3.0, 2.4, 'vertical', 'Jendela Garasi');
    this.addWallSegment(10, -1.8, 10, 1.1, true);
    this.addOpening('door', 10, 2.0, 1.8, 'vertical', 'Pintu Samping Garasi');
    this.addWallSegment(10, 2.9, 10, 8, true);

    // Interior Walls
    // Horizontal divider z = 0 between Living Room & Kitchen (x = -10 to 0) with doorway
    this.addWallSegment(-10, 0, -5.5, 0, false);
    this.addOpening('door', -4.6, 0, 1.8, 'horizontal', 'Pintu Dapur', true);
    this.addWallSegment(-3.7, 0, 0, 0, false);

    // Vertical divider x = 0 between Left Wing & Right Wing (z = -8 to +8)
    this.addWallSegment(0, -8, 0, -4.9, false);
    this.addOpening('door', 0, -4.0, 1.8, 'vertical', 'Pintu Kamar Tidur', true);
    this.addWallSegment(0, -3.1, 0, 1.1, false);
    this.addOpening('door', 0, 2.0, 1.8, 'vertical', 'Pintu Kamar Mandi', true);
    this.addWallSegment(0, 2.9, 0, 5.1, false);
    // Open archway into right hallway at z: 5.1 to 6.9
    this.addWallSegment(0, 6.9, 0, 8, false);

    // Horizontal walls for Bathroom (x = 0 to 6, z = 0 and z = 4)
    this.addWallSegment(0, 0, 6, 0, false);
    this.addWallSegment(0, 4, 6, 4, false);

    // Vertical wall x = 6 separating Garage (z = -8 to +8)
    this.addWallSegment(6, -8, 6, 5.1, false);
    this.addOpening('door', 6, 6.0, 1.8, 'vertical', 'Pintu Dalam Garasi', true);
    this.addWallSegment(6, 6.9, 6, 8, false);
  }

  addWallSegment(x1, z1, x2, z2, isExterior = true) {
    const thickness = 0.32;
    const height = 3.2;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.05) return;

    const isHorizontal = Math.abs(dx) >= Math.abs(dz);
    const w = isHorizontal ? len : thickness;
    const d = isHorizontal ? thickness : len;
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const geo = new THREE.BoxGeometry(w, height, d);
    const mat = new THREE.MeshLambertMaterial({
      color: isExterior ? 0x8c8275 : 0xdfd9ce
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, height / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const wallObj = {
      mesh,
      cx,
      cz,
      w,
      d,
      fullHeight: height,
      isExterior,
      isCutaway: false
    };
    this.walls.push(wallObj);

    this.colliders.push({
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
      type: 'wall',
      ref: wallObj
    });
  }

  addOpening(type, cx, cz, length, orientation, label, isInterior = false) {
    const thickness = 0.34;
    const isHorizontal = orientation === 'horizontal';
    const w = isHorizontal ? length : thickness;
    const d = isHorizontal ? thickness : length;

    const group = new THREE.Group();
    group.position.set(cx, 0, cz);
    this.scene.add(group);

    // Frame
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x4a3525 });
    const topGeo = new THREE.BoxGeometry(w, 0.35, d);
    const topMesh = new THREE.Mesh(topGeo, frameMat);
    topMesh.position.y = 3.02;
    group.add(topMesh);

    let mainMesh = null;
    let curtainMesh = null;

    if (type === 'door') {
      const doorMat = new THREE.MeshLambertMaterial({
        color: isInterior ? 0x7c5836 : 0x5c3a21
      });
      const doorGeo = new THREE.BoxGeometry(w * 0.92, 2.7, d * 0.65);
      mainMesh = new THREE.Mesh(doorGeo, doorMat);
      mainMesh.position.y = 1.35;
      mainMesh.castShadow = true;
      group.add(mainMesh);
    } else if (type === 'window') {
      // Lower sill wall
      const sillMat = new THREE.MeshLambertMaterial({ color: 0x8c8275 });
      const sillGeo = new THREE.BoxGeometry(w, 0.95, d * 0.9);
      const sillMesh = new THREE.Mesh(sillGeo, sillMat);
      sillMesh.position.y = 0.475;
      group.add(sillMesh);

      // Glass pane
      const glassMat = new THREE.MeshPhongMaterial({
        color: 0x99d6ff,
        transparent: true,
        opacity: 0.42
      });
      const glassGeo = new THREE.BoxGeometry(
        isHorizontal ? w * 0.9 : 0.08,
        1.8,
        isHorizontal ? 0.08 : d * 0.9
      );
      mainMesh = new THREE.Mesh(glassGeo, glassMat);
      mainMesh.position.y = 1.85;
      group.add(mainMesh);

      // Curtain (Gorden)
      const curtainMat = new THREE.MeshLambertMaterial({
        color: 0x3b4d6b,
        transparent: true,
        opacity: 0.92
      });
      const curtainGeo = new THREE.BoxGeometry(
        isHorizontal ? w * 0.88 : 0.16,
        1.75,
        isHorizontal ? 0.16 : d * 0.88
      );
      curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
      curtainMesh.position.y = 1.85;
      curtainMesh.visible = false;
      group.add(curtainMesh);
    }

    // 3D Barricade Planks (up to 4 planks)
    const plankMeshes = [];
    const plankMat = new THREE.MeshLambertMaterial({ color: 0xa67b4b });
    for (let i = 0; i < 4; i++) {
      const pGeo = new THREE.BoxGeometry(
        isHorizontal ? w * 0.98 : 0.44,
        0.24,
        isHorizontal ? 0.44 : d * 0.98
      );
      const pMesh = new THREE.Mesh(pGeo, plankMat);
      pMesh.position.y = 1.15 + i * 0.44;
      pMesh.rotation.z = isHorizontal ? (i % 2 === 0 ? 0.05 : -0.05) : 0;
      pMesh.rotation.x = !isHorizontal ? (i % 2 === 0 ? 0.05 : -0.05) : 0;
      pMesh.visible = false;
      group.add(pMesh);
      plankMeshes.push(pMesh);
    }

    const openingObj = {
      id: 'open_' + Math.random().toString(36).slice(2, 8),
      type, // 'door' or 'window'
      label,
      cx,
      cz,
      w,
      d,
      orientation,
      isInterior,
      isOpen: false,
      isBroken: false,
      hasCurtainClosed: false,
      planks: 0,      // 0..4
      plankHp: 0,     // 100 per plank
      structureHp: type === 'door' ? 140 : 60,
      group,
      mainMesh,
      curtainMesh,
      plankMeshes,
      collider: null
    };

    const col = {
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
      type: 'opening',
      ref: openingObj,
      active: true
    };
    openingObj.collider = col;
    this.colliders.push(col);
    this.openings.push(openingObj);
  }

  toggleOpening(opening) {
    if (opening.planks > 0) {
      window.addLog(`${opening.label} dipaku barikade! Lepas papan dulu jika ingin membuka.`, 'warn');
      return;
    }
    if (opening.type === 'door') {
      if (opening.isBroken) {
        window.addLog(`${opening.label} sudah hancur!`, 'danger');
        return;
      }
      opening.isOpen = !opening.isOpen;
      opening.collider.active = !opening.isOpen;
      if (opening.isOpen) {
        opening.mainMesh.rotation.y = Math.PI / 2.2;
        opening.mainMesh.position.x = opening.orientation === 'horizontal' ? -opening.w * 0.35 : 0.45;
        opening.mainMesh.position.z = opening.orientation === 'vertical' ? -opening.d * 0.35 : 0.45;
      } else {
        opening.mainMesh.rotation.y = 0;
        opening.mainMesh.position.x = 0;
        opening.mainMesh.position.z = 0;
      }
      window.soundFX.playDoorToggle(opening.isOpen);
    } else if (opening.type === 'window') {
      if (opening.isBroken) {
        window.addLog(`${opening.label} sudah pecah.`, 'warn');
        return;
      }
      opening.isOpen = !opening.isOpen;
      opening.mainMesh.position.y = opening.isOpen ? 2.45 : 1.85;
      window.soundFX.playDoorToggle(opening.isOpen);
      window.addLog(`${opening.label} ${opening.isOpen ? 'dibuka' : 'ditutup'}.`, 'good');
    }
  }

  toggleCurtain(opening) {
    if (opening.type !== 'window' || !opening.curtainMesh) return;
    opening.hasCurtainClosed = !opening.hasCurtainClosed;
    opening.curtainMesh.visible = opening.hasCurtainClosed;
    window.soundFX.playClick();
    window.addLog(
      `Tirai ${opening.label} ${opening.hasCurtainClosed ? 'DITUTUP (Zombie luar tidak bisa melihat cahaya dalam)' : 'DIBUKA'}.`,
      'good'
    );
  }

  addBarricadePlank(opening) {
    if (opening.planks >= 4) {
      window.addLog(`${opening.label} sudah memiliki maksimal 4 papan barikade!`, 'warn');
      return false;
    }
    if (this.systems.getItemCount('wood_plank') < 1 || this.systems.getItemCount('nails') < 2) {
      window.addLog('Butuh 1 Papan Kayu & 2 Paku Besi untuk membarikade!', 'warn');
      return false;
    }
    if (this.systems.getItemCount('hammer') < 1 && this.systems.getItemCount('fire_axe') < 1) {
      window.addLog('Anda membutuhkan Palu Besi di inventaris untuk memaku papan!', 'warn');
      return false;
    }

    this.systems.removeItem('wood_plank', 1);
    this.systems.removeItem('nails', 2);
    opening.planks += 1;
    opening.plankHp += 100;
    opening.isOpen = false;
    opening.collider.active = true;
    opening.plankMeshes[opening.planks - 1].visible = true;
    this.systems.barricadesBuilt += 1;

    window.soundFX.playHammer();
    this.systems.emitNoise(opening.cx, opening.cz, 9.5, 'Palu Barikade');
    window.addLog(`Memasang papan barikade (${opening.planks}/4) pada ${opening.label}.`, 'good');
    return true;
  }

  damageOpeningByZombie(opening, dmg) {
    window.soundFX.playWoodThud();
    this.systems.emitNoise(opening.cx, opening.cz, 7.0, 'Gedoran Zombie');

    if (opening.planks > 0) {
      opening.plankHp = Math.max(0, opening.plankHp - dmg);
      const expectedPlanks = Math.ceil(opening.plankHp / 100);
      while (opening.planks > expectedPlanks) {
        opening.plankMeshes[opening.planks - 1].visible = false;
        opening.planks -= 1;
        window.addLog(`Papan barikade di ${opening.label} hancur digedor zombie!`, 'danger');
      }
      return;
    }

    if (!opening.isBroken) {
      opening.structureHp -= dmg;
      if (opening.structureHp <= 0) {
        opening.isBroken = true;
        if (opening.mainMesh) opening.mainMesh.visible = false;
        opening.collider.active = false; // Zombies can now walk/climb right in!
        if (opening.type === 'window') {
          window.soundFX.playGlassShatter();
          this.spawnBrokenGlass(opening.cx, opening.cz);
          this.systems.emitNoise(opening.cx, opening.cz, 14.0, 'Kaca Pecah');
          window.addLog(`KACA PECAH! Zombie menjebol ${opening.label}!`, 'danger');
        } else {
          window.addLog(`PINTU JEBOL! ${opening.label} hancur didobrak zombie!`, 'danger');
        }
      }
    }
  }

  spawnBrokenGlass(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.03, z);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0xbbeeff, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 8; i++) {
      const sGeo = new THREE.PlaneGeometry(0.22, 0.18);
      const shard = new THREE.Mesh(sGeo, shardMat);
      shard.rotation.x = -Math.PI / 2;
      shard.rotation.z = Math.random() * Math.PI;
      shard.position.set((Math.random() - 0.5) * 1.1, 0, (Math.random() - 0.5) * 1.1);
      group.add(shard);
    }
    this.scene.add(group);
    this.glassHazards.push({ x, z, radius: 0.9, mesh: group });
  }

  populateRoomsAndYard() {
    // 1. RUANG TAMU (Living Room: x -10..0, z 0..8)
    this.addFurniture({
      id: 'tv_set',
      name: 'TV & Radio Darurat',
      actionType: 'tv',
      x: -5.0, z: 0.65, w: 1.8, h: 1.2, d: 0.5,
      color: 0x22252a
    });
    this.addFurniture({
      id: 'sofa_living',
      name: 'Sofa Ruang Tamu',
      actionType: 'dismantle',
      yields: [{ id: 'dirty_rag', count: 2 }, { id: 'wood_plank', count: 2 }],
      x: -5.0, z: 4.2, w: 2.6, h: 0.85, d: 1.0,
      color: 0x6e322b
    });
    this.addFurniture({
      id: 'bookshelf_living',
      name: 'Rak Buku & Laci Tamu',
      actionType: 'container',
      loot: [
        { id: 'battery', count: 1 },
        { id: 'painkillers', count: 1 },
        { id: 'nails', count: 5 },
        { id: 'empty_bottle', count: 1 }
      ],
      dismantleYields: [{ id: 'wood_plank', count: 3 }, { id: 'nails', count: 3 }],
      x: -9.3, z: 1.8, w: 0.7, h: 1.9, d: 2.0,
      color: 0x593e25
    });

    // 2. DAPUR (Kitchen: x -10..0, z -8..0)
    this.addFurniture({
      id: 'fridge_kitchen',
      name: 'Kulkas Dapur',
      actionType: 'container',
      loot: [
        { id: 'fresh_meat', count: 2 },
        { id: 'water_bottle', count: 2 },
        { id: 'canned_food', count: 1 }
      ],
      x: -9.2, z: -7.1, w: 0.95, h: 1.9, d: 0.95,
      color: 0xdce3e8
    });
    this.addFurniture({
      id: 'stove_kitchen',
      name: 'Kompor Listrik/Gas',
      actionType: 'stove',
      x: -5.2, z: -7.3, w: 1.4, h: 0.95, d: 0.85,
      color: 0x3b4046
    });
    this.addFurniture({
      id: 'sink_kitchen',
      name: 'Wastafel Keran Air',
      actionType: 'sink',
      x: -1.5, z: -7.3, w: 1.5, h: 0.95, d: 0.85,
      color: 0x7f8c8d
    });
    this.addFurniture({
      id: 'cabinet_kitchen',
      name: 'Lemari Pangan Dapur',
      actionType: 'container',
      loot: [
        { id: 'canned_food', count: 2 },
        { id: 'coffee_cup', count: 2 },
        { id: 'kitchen_knife', count: 1 }
      ],
      dismantleYields: [{ id: 'wood_plank', count: 2 }, { id: 'nails', count: 2 }],
      x: -9.3, z: -1.6, w: 0.8, h: 1.5, d: 1.8,
      color: 0x6e4f32
    });
    this.addFurniture({
      id: 'dining_table',
      name: 'Meja Makan Kayu',
      actionType: 'dismantle',
      yields: [{ id: 'wood_plank', count: 3 }, { id: 'nails', count: 4 }],
      x: -4.2, z: -3.6, w: 2.0, h: 0.8, d: 1.3,
      color: 0x7a5230
    });

    // 3. KAMAR TIDUR (Bedroom: x 0..6, z -8..0)
    this.addFurniture({
      id: 'bed_master',
      name: 'Tempat Tidur (Istirahat)',
      actionType: 'bed',
      x: 4.5, z: -6.3, w: 2.2, h: 0.7, d: 1.7,
      color: 0x3c5a78
    });
    this.addFurniture({
      id: 'wardrobe_bed',
      name: 'Lemari Pakaian',
      actionType: 'container',
      loot: [
        { id: 'dirty_rag', count: 3 },
        { id: 'bandage', count: 1 },
        { id: 'ammo_9mm', count: 7 },
        { id: 'battery', count: 1 }
      ],
      dismantleYields: [{ id: 'wood_plank', count: 3 }, { id: 'nails', count: 3 }],
      x: 4.9, z: -1.1, w: 1.5, h: 1.9, d: 0.8,
      color: 0x4f3622
    });

    // 4. KAMAR MANDI (Bathroom: x 0..6, z 0..4)
    this.addFurniture({
      id: 'med_cabinet',
      name: 'Kotak Medis Kamar Mandi',
      actionType: 'container',
      loot: [
        { id: 'medkit', count: 1 },
        { id: 'bandage', count: 2 },
        { id: 'painkillers', count: 2 }
      ],
      x: 5.2, z: 1.0, w: 0.7, h: 1.4, d: 1.1,
      color: 0xe6eef2
    });
    this.addFurniture({
      id: 'sink_bath',
      name: 'Wastafel Kamar Mandi',
      actionType: 'sink',
      x: 5.2, z: 2.8, w: 0.8, h: 0.9, d: 1.0,
      color: 0xcbd5db
    });

    // 5. GARASI & BENGKEL (Garage: x 6..10, z -8..8)
    this.addFurniture({
      id: 'generator_unit',
      name: 'Generator Listrik Cadangan',
      actionType: 'generator',
      x: 8.2, z: -6.6, w: 1.3, h: 1.0, d: 1.0,
      color: 0xc93b2b
    });
    this.addFurniture({
      id: 'workbench_garage',
      name: 'Meja Kerja & Rak Perkakas',
      actionType: 'container',
      loot: [
        { id: 'wood_plank', count: 4 },
        { id: 'nails', count: 10 },
        { id: 'scrap_metal', count: 2 },
        { id: 'fuel_can', count: 1 },
        { id: 'fire_axe', count: 1 }
      ],
      x: 6.7, z: -2.0, w: 0.9, h: 1.1, d: 2.6,
      color: 0x525960
    });
    this.addFurniture({
      id: 'crate_garage',
      name: 'Peti Gudang Kayu',
      actionType: 'dismantle',
      yields: [{ id: 'wood_plank', count: 3 }, { id: 'nails', count: 3 }],
      x: 8.8, z: 5.8, w: 1.2, h: 0.95, d: 1.2,
      color: 0x8a643b
    });

    // 6. LUAR RUMAH: JALAN RAYA & HALAMAN (High-Risk High-Reward Loot!)
    this.addFurniture({
      id: 'police_cruiser',
      name: 'Bagasi Mobil Polisi Terbengkalai',
      actionType: 'container',
      loot: [
        { id: 'pistol_9mm', count: 1 },
        { id: 'ammo_9mm', count: 16 },
        { id: 'fuel_can', count: 1 },
        { id: 'battery', count: 1 }
      ],
      x: -5.5, z: 16.5, w: 3.8, h: 1.35, d: 1.8,
      color: 0x263859
    });

    this.addFurniture({
      id: 'ambulance_van',
      name: 'Ambulans Darurat Terbengkalai',
      actionType: 'container',
      loot: [
        { id: 'medkit', count: 2 },
        { id: 'bandage', count: 3 },
        { id: 'canned_food', count: 2 },
        { id: 'water_bottle', count: 2 }
      ],
      x: 8.5, z: 17.5, w: 4.2, h: 1.75, d: 1.95,
      color: 0xd9e2ec
    });

    // Yard Trees (can be chopped for wood planks)
    const treePositions = [
      { x: -16, z: 5 },
      { x: -17, z: -6 },
      { x: 16, z: 6 },
      { x: 16, z: -5 },
      { x: -13, z: -13 },
      { x: 12, z: -14 }
    ];
    treePositions.forEach((tp, idx) => {
      this.addTree(tp.x, tp.z, idx);
    });
  }

  addFurniture(cfg) {
    const group = new THREE.Group();
    group.position.set(cfg.x, 0, cfg.z);

    const bodyGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
    const bodyMat = new THREE.MeshLambertMaterial({ color: cfg.color });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = cfg.h / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Subtle top accent for visual detail
    const topGeo = new THREE.BoxGeometry(cfg.w * 0.92, 0.08, cfg.d * 0.92);
    const topMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = cfg.h + 0.02;
    group.add(topMesh);

    this.scene.add(group);

    const col = {
      minX: cfg.x - cfg.w / 2,
      maxX: cfg.x + cfg.w / 2,
      minZ: cfg.z - cfg.d / 2,
      maxZ: cfg.z + cfg.d / 2,
      type: 'furniture',
      active: true
    };
    this.colliders.push(col);

    const obj = {
      ...cfg,
      cx: cfg.x,
      cz: cfg.z,
      group,
      collider: col,
      loot: cfg.loot ? [...cfg.loot] : []
    };
    this.interactables.push(obj);
  }

  addTree(x, z, idx) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.8, 7);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4d3319 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageGeo = new THREE.ConeGeometry(1.6, 3.6, 8);
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x1e4620 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 3.1;
    foliage.castShadow = true;
    group.add(foliage);

    this.scene.add(group);

    const col = {
      minX: x - 0.45,
      maxX: x + 0.45,
      minZ: z - 0.45,
      maxZ: z + 0.45,
      type: 'tree',
      active: true
    };
    this.colliders.push(col);

    this.interactables.push({
      id: 'tree_' + idx,
      name: 'Pohon Pinus (Tebang Kayu)',
      actionType: 'dismantle',
      yields: [{ id: 'wood_plank', count: 4 }],
      cx: x,
      cz: z,
      w: 1.0,
      d: 1.0,
      group,
      collider: col
    });
  }

  dismantleObject(obj) {
    const yields = obj.yields || obj.dismantleYields;
    if (!yields) return;

    yields.forEach(y => {
      this.systems.addItem(y.id, y.count);
    });
    if (obj.collider) obj.collider.active = false;
    this.scene.remove(obj.group);
    const idx = this.interactables.indexOf(obj);
    if (idx !== -1) this.interactables.splice(idx, 1);

    window.soundFX.playHammer();
    this.systems.emitNoise(obj.cx, obj.cz, 10.0, 'Bongkar Objek');
    window.addLog(`Membongkar ${obj.name} menjadi bahan papan/material.`, 'good');
  }

  updateDayNightAndCutaway(dt, cameraPos, playerPos) {
    const h = this.systems.timeHours;
    // Day/night factor: 0 at midnight, 1 at noon
    let sunFactor = 0;
    if (h >= 5.5 && h <= 19.5) {
      sunFactor = Math.sin(((h - 5.5) / 14.0) * Math.PI);
    }

    // Sky & Ambient color interpolation
    const nightAmbient = new THREE.Color(0x161c2e);
    const dayAmbient = new THREE.Color(0x9ab0cf);
    this.ambientLight.color.lerpColors(nightAmbient, dayAmbient, sunFactor);
    this.ambientLight.intensity = 0.24 + sunFactor * 0.52;

    this.sunLight.intensity = Math.max(0.05, sunFactor * 1.05);
    const sunAngle = ((h - 6) / 12) * Math.PI;
    this.sunLight.position.set(Math.cos(sunAngle) * 28, Math.max(6, Math.sin(sunAngle) * 35), 16);

    // Interior room lights depend on electricity & toggle
    const powerOn = this.systems.hasElectricity() && this.systems.houseLightsOn;
    this.roomLights.forEach(rl => {
      rl.intensity = powerOn ? 0.85 : 0.0;
    });

    // Streetlight flickers at night if grid is on
    const isNight = h >= 18.5 || h <= 6.0;
    if (isNight && this.systems.powerGridOnline) {
      this.streetLight.intensity = Math.random() < 0.96 ? 1.1 : 0.3;
    } else {
      this.streetLight.intensity = 0;
    }

    // Cutaway Walls Logic (Isometric visibility):
    // Lower walls that block view of interior rooms or are on the camera-facing side of the house
    const playerInside = playerPos.x > -10.2 && playerPos.x < 10.2 && playerPos.z > -8.2 && playerPos.z < 8.2;
    const camDirX = Math.sign(cameraPos.x - playerPos.x);
    const camDirZ = Math.sign(cameraPos.z - playerPos.z);

    this.walls.forEach(w => {
      let shouldCut = false;
      if (playerInside) {
        // Cut exterior walls on the camera side, plus interior walls in front of player
        if (camDirZ > 0 && w.cz > playerPos.z - 0.5) shouldCut = true;
        if (camDirZ < 0 && w.cz < playerPos.z + 0.5) shouldCut = true;
        if (camDirX > 0 && w.cx > playerPos.x - 0.5) shouldCut = true;
        if (camDirX < 0 && w.cx < playerPos.x + 0.5) shouldCut = true;
      } else {
        // Even when outside, slightly lower south/east walls if player is right next to the house
        const distToWall = Math.hypot(w.cx - playerPos.x, w.cz - playerPos.z);
        if (distToWall < 3.5 && ((camDirZ > 0 && w.cz >= playerPos.z) || (camDirX > 0 && w.cx >= playerPos.x))) {
          shouldCut = true;
        }
      }

      const targetScaleY = shouldCut ? 0.16 : 1.0;
      w.mesh.scale.y += (targetScaleY - w.mesh.scale.y) * Math.min(1, dt * 10);
      w.mesh.position.y = (w.fullHeight * w.mesh.scale.y) / 2;
    });

    // Update 3D Noise Ripples
    for (let i = this.systems.noiseRipples.length - 1; i >= 0; i--) {
      const nr = this.systems.noiseRipples[i];
      if (!nr.mesh) {
        const ringGeo = new THREE.RingGeometry(0.85, 1.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59f00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        nr.mesh = new THREE.Mesh(ringGeo, ringMat);
        nr.mesh.rotation.x = -Math.PI / 2;
        nr.mesh.position.set(nr.x, 0.08, nr.z);
        this.scene.add(nr.mesh);
      }
      nr.currentRadius += dt * (nr.maxRadius * 1.4);
      nr.alpha -= dt * 1.1;
      nr.mesh.scale.set(nr.currentRadius, nr.currentRadius, 1);
      nr.mesh.material.opacity = Math.max(0, nr.alpha);

      if (nr.alpha <= 0 || nr.currentRadius >= nr.maxRadius) {
        this.scene.remove(nr.mesh);
        nr.mesh.geometry.dispose();
        nr.mesh.material.dispose();
        this.systems.noiseRipples.splice(i, 1);
      }
    }
  }

  // Check if a point (x, z) collides with any active AABB collider using circle radius
  resolveCollision(x, z, radius = 0.38, ignoreOpenings = false) {
    let rx = x;
    let rz = z;

    for (const c of this.colliders) {
      if (c.active === false) continue;
      if (ignoreOpenings && c.type === 'opening') continue;

      const closestX = Math.max(c.minX, Math.min(rx, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(rz, c.maxZ));
      const dx = rx - closestX;
      const dz = rz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = radius - dist;
        rx += (dx / dist) * overlap;
        rz += (dz / dist) * overlap;
      }
    }

    // Clamp world bounds
    rx = Math.max(-34, Math.min(34, rx));
    rz = Math.max(-34, Math.min(34, rz));
    return { x: rx, z: rz };
  }

  // Line of sight check between two points (returns false if blocked by wall, closed door, or curtained/barricaded window)
  hasLineOfSight(x1, z1, x2, z2) {
    const steps = 16;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const pz = z1 + (z2 - z1) * t;

      for (const c of this.colliders) {
        if (c.active === false) continue;
        if (px >= c.minX && px <= c.maxX && pz >= c.minZ && pz <= c.maxZ) {
          if (c.type === 'wall') return false;
          if (c.type === 'opening') {
            const op = c.ref;
            if (op.type === 'door' && !op.isOpen && !op.isBroken) return false;
            if (op.type === 'window' && (op.hasCurtainClosed || op.planks >= 2)) return false;
          }
        }
      }
    }
    return true;
  }
}

window.GameWorld = GameWorld;
