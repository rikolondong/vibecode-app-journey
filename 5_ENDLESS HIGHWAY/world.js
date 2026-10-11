import * as THREE from './libs/three.module.js';
import { TextureGenerator } from './textures.js';

/**
 * JALAN TOL KELAM - Endless Highway & Atmospheric World Generator (Ultra-Realistic Edition)
 */

export class HighwayWorld {
  constructor(scene) {
    this.scene = scene;

    // Segment dimensions (Optimized for maximum FPS)
    this.segmentLength = 65; // meters per chunk
    this.totalSegments = 10;  // visible stretch ~650m (far beyond 250m fog cutoff)
    this.segments = [];
    this.flickeringLights = [];

    // Highway width: 3 lanes (each ~3.4m) + wide shoulders (bahu jalan)
    this.roadWidth = 14.4;

    this._initMaterials();

    // Weather systems
    this.rainParticles = null;
    this.isRaining = false;
    this.mistParticles = null;

    this._generateInitialHighway();
    this._initMistSystem();
    this._initRainSystem();
  }

  _initMaterials() {
    // 1. Procedural Realistic Wet Asphalt with Normal & Roughness Maps
    const asphaltMap = TextureGenerator.createAsphaltTexture();
    const asphaltNormalMap = TextureGenerator.createAsphaltNormalMap();
    const asphaltRoughnessMap = TextureGenerator.createAsphaltRoughnessMap();

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltMap,
      normalMap: asphaltNormalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: asphaltRoughnessMap,
      roughness: 0.38,
      metalness: 0.22,
      envMapIntensity: 0.8
    });

    // 2. Markings with reflective retroreflective sheen
    this.whiteMarkingMat = new THREE.MeshStandardMaterial({
      color: 0xededed,
      roughness: 0.35,
      metalness: 0.1
    });

    this.yellowMarkingMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.35,
      metalness: 0.1
    });

    // 3. Reflective Road Studs (Mata Kucing / Cat's Eyes)
    this.studMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x555555,
      metalness: 0.95,
      roughness: 0.08
    });

    // 4. Corrugated Metal Crash Barrier (Guardrail)
    this.guardrailMat = new THREE.MeshStandardMaterial({
      color: 0x6e7884,
      metalness: 0.85,
      roughness: 0.28
    });

    // 5. Highway Light Pole Steel Material
    this.poleMat = new THREE.MeshStandardMaterial({
      color: 0x303740,
      metalness: 0.75,
      roughness: 0.4
    });

    // 6. Overpass Concrete Material
    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x24282f,
      roughness: 0.88,
      metalness: 0.1
    });

    // 7. Roadside Embankment / Dark Grass
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x060906,
      roughness: 0.98
    });

    // 8. Distant Tree Foliage Silhouettes
    this.treeMat = new THREE.MeshStandardMaterial({
      color: 0x040604,
      roughness: 0.95
    });

    // Toll signs textures
    this.signTextures = this._generateSignTextures();
  }

  _generateSignTextures() {
    const signs = [
      { top: "JALAN TOL KELAM", sub: "KM 142 - KABUT TEBAL" },
      { top: "HATI-HATI JALAN LICIN", sub: "KURANGI KECEPATAN" },
      { top: "REST AREA 1 KM", sub: "SPBU - MASJID - ISTIRAHAT" },
      { top: "LAJUR KANAN", sub: "HANYA UNTUK MENDAHULUI" },
      { top: "BATAS KECEPATAN", sub: "MAKSIMAL 100 KM/JAM" },
      { top: "GERBANG TOL 2 KM", sub: "SIAPKAN E-TOLL ANDA" }
    ];

    const materials = [];

    signs.forEach(item => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Authentic Indonesian Toll Highway Green Border & Sign
      ctx.fillStyle = '#0a4220';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 492, 236);

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.top, 256, 95);

      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
      ctx.fillText(item.sub, 256, 175);

      const texture = new THREE.CanvasTexture(canvas);
      materials.push(new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.45,
        side: THREE.DoubleSide
      }));
    });

    return materials;
  }

  _generateInitialHighway() {
    for (let i = 0; i < this.totalSegments; i++) {
      const zPos = i * this.segmentLength;
      const segment = this._createSegment(zPos, i);
      this.segments.push(segment);
      this.scene.add(segment.group);
    }
  }

  _createSegment(zPos, index) {
    const group = new THREE.Group();
    group.position.z = zPos;

    // 1. Asphalt Road Surface with Specular Reflections
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, this.asphaltMat);
    road.receiveShadow = true;
    group.add(road);

    // Concrete expansion seam joints (every 30m)
    const seamGeo = new THREE.PlaneGeometry(this.roadWidth, 0.25);
    seamGeo.rotateX(-Math.PI / 2);
    const seamMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95 });
    const seam1 = new THREE.Mesh(seamGeo, seamMat);
    seam1.position.set(0, 0.012, 0);
    const seam2 = new THREE.Mesh(seamGeo, seamMat);
    seam2.position.set(0, 0.012, -this.segmentLength / 2);
    group.add(seam1, seam2);

    // 2. Roadside Embankments
    const grassGeo = new THREE.PlaneGeometry(55, this.segmentLength);
    grassGeo.rotateX(-Math.PI / 2);
    const grassL = new THREE.Mesh(grassGeo, this.grassMat);
    grassL.position.set(-(this.roadWidth / 2 + 27.5), -0.06, 0);
    const grassR = new THREE.Mesh(grassGeo, this.grassMat);
    grassR.position.set((this.roadWidth / 2 + 27.5), -0.06, 0);
    group.add(grassL, grassR);

    // 3. Markings & Cat's Eyes (Mata Kucing)
    this._addRoadMarkings(group);

    // 4. Corrugated Guardrails
    this._addGuardrails(group);

    // 5. Streetlights (Every 3 segments for realistic distance & high performance)
    if (index % 3 === 0) {
      this._addStreetLight(group, index);
    }

    // 6. Overpass or Overhead Gantry Sign
    if (index % 9 === 4) {
      this._addOverpassBridge(group);
    } else if (index % 6 === 2) {
      this._addHighwayGantry(group, index);
    }

    // 7. Scenery (Trees, Power Pylons, Milestone posts)
    this._addRoadsideScenery(group, index);

    return { group, zPos, index };
  }

  _addRoadMarkings(group) {
    // Solid Yellow Outer Shoulder Lines
    const solidGeo = new THREE.PlaneGeometry(0.22, this.segmentLength);
    solidGeo.rotateX(-Math.PI / 2);

    const leftLine = new THREE.Mesh(solidGeo, this.yellowMarkingMat);
    leftLine.position.set(-5.8, 0.016, 0);

    const rightLine = new THREE.Mesh(solidGeo, this.yellowMarkingMat);
    rightLine.position.set(5.8, 0.016, 0);

    group.add(leftLine, rightLine);

    // Dashed White Lane Lines (3 lanes -> 2 dividing lines at x = -1.9 and x = 1.9)
    const dashLength = 4.2;
    const dashGap = 5.8;
    const totalDashes = Math.floor(this.segmentLength / (dashLength + dashGap));

    const dashGeo = new THREE.PlaneGeometry(0.2, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    const studGeo = new THREE.BoxGeometry(0.14, 0.05, 0.14);

    [-1.9, 1.9].forEach(laneX => {
      for (let i = 0; i < totalDashes; i++) {
        const dashZ = -this.segmentLength / 2 + i * (dashLength + dashGap) + dashLength / 2;
        const dash = new THREE.Mesh(dashGeo, this.whiteMarkingMat);
        dash.position.set(laneX, 0.016, dashZ);
        group.add(dash);

        // Reflective Road Stud (Mata Kucing)
        const stud = new THREE.Mesh(studGeo, this.studMat);
        stud.position.set(laneX, 0.025, dashZ + dashLength / 2 + dashGap * 0.5);
        group.add(stud);
      }
    });
  }

  _addGuardrails(group) {
    const railGeo = new THREE.BoxGeometry(0.12, 0.38, this.segmentLength);
    [-7.0, 7.0].forEach(x => {
      const rail = new THREE.Mesh(railGeo, this.guardrailMat);
      rail.position.set(x, 0.52, 0);
      group.add(rail);

      // Support Posts
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.78, 8);
      for (let i = 0; i < 7; i++) {
        const pZ = -this.segmentLength / 2 + (i / 7) * this.segmentLength;
        const post = new THREE.Mesh(postGeo, this.guardrailMat);
        post.position.set(x, 0.36, pZ);
        group.add(post);

        // Red/Orange Reflector Stripe on Post
        const reflectorGeo = new THREE.BoxGeometry(0.04, 0.1, 0.04);
        const refMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
        const ref = new THREE.Mesh(reflectorGeo, refMat);
        ref.position.set(x + (x > 0 ? -0.06 : 0.06), 0.65, pZ);
        group.add(ref);
      }
    });
  }

  _addStreetLight(group, index) {
    const poleGroup = new THREE.Group();
    const isRightSide = index % 4 === 0;
    const poleX = isRightSide ? 7.8 : -7.8;
    const poleDir = isRightSide ? -1 : 1;

    // Tall vertical mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 9.2, 10), this.poleMat);
    mast.position.set(0, 4.6, 0);
    poleGroup.add(mast);

    // Curved arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.1), this.poleMat);
    arm.position.set(poleDir * 1.05, 9.0, 0);
    poleGroup.add(arm);

    // Lamp head housing
    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.42), new THREE.MeshStandardMaterial({ color: 0x1a1e24 }));
    lampHead.position.set(poleDir * 2.1, 8.9, 0);
    poleGroup.add(lampHead);

    // Authentic High-Pressure Sodium Vapor Warm Amber Color (~2200K)
    const sodiumColor = 0xffa338;

    // Atmospheric condition
    const rand = Math.random();
    let isBroken = rand < 0.02; // Almost all streetlights active for clear, illuminated highway
    let isFlickering = rand >= 0.02 && rand < 0.12;

    // Emissive glass bulb
    const bulbMat = new THREE.MeshBasicMaterial({
      color: isBroken ? 0x221a10 : sodiumColor
    });
    const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.32), bulbMat);
    bulb.rotateX(Math.PI / 2);
    bulb.position.set(poleDir * 2.1, 8.82, 0);
    poleGroup.add(bulb);

    if (!isBroken) {
      // 3D PointLight casting bright, clear warm sodium pool on the highway
      const light = new THREE.PointLight(sodiumColor, isFlickering ? 5.5 : 8.5, 65, 1.2);
      light.position.set(poleDir * 2.1, 8.4, 0);
      poleGroup.add(light);

      if (isFlickering) {
        this.flickeringLights.push({
          pointLight: light,
          bulbMat,
          baseColor: sodiumColor,
          timer: Math.random() * 2
        });
      }
    }

    poleGroup.position.set(poleX, 0, 0);
    group.add(poleGroup);
  }

  _addOverpassBridge(group) {
    const bridgeGroup = new THREE.Group();

    // Heavy concrete bridge deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(34, 2.2, 8.0), this.concreteMat);
    deck.position.set(0, 6.4, 0);
    bridgeGroup.add(deck);

    // Parapets
    const railGeo = new THREE.BoxGeometry(34, 1.25, 0.35);
    const railF = new THREE.Mesh(railGeo, this.concreteMat);
    railF.position.set(0, 7.8, 3.8);
    const railB = new THREE.Mesh(railGeo, this.concreteMat);
    railB.position.set(0, 7.8, -3.8);
    bridgeGroup.add(railF, railB);

    // Massive Support Pillars
    const pillarGeo = new THREE.BoxGeometry(1.9, 6.2, 1.9);
    const pillarL = new THREE.Mesh(pillarGeo, this.concreteMat);
    pillarL.position.set(-11.0, 3.1, 0);
    const pillarR = new THREE.Mesh(pillarGeo, this.concreteMat);
    pillarR.position.set(11.0, 3.1, 0);
    bridgeGroup.add(pillarL, pillarR);

    group.add(bridgeGroup);
  }

  _addHighwayGantry(group, index) {
    const gantryGroup = new THREE.Group();

    // Overhead truss
    const span = new THREE.Mesh(new THREE.BoxGeometry(22, 0.65, 0.65), this.poleMat);
    span.position.set(0, 6.6, 0);
    gantryGroup.add(span);

    // Left and right support pylons
    const legGeo = new THREE.CylinderGeometry(0.22, 0.26, 6.6, 8);
    const legL = new THREE.Mesh(legGeo, this.poleMat);
    legL.position.set(-9.0, 3.3, 0);
    const legR = new THREE.Mesh(legGeo, this.poleMat);
    legR.position.set(9.0, 3.3, 0);
    gantryGroup.add(legL, legR);

    // Signboard facing oncoming traffic
    const signGeo = new THREE.PlaneGeometry(6.8, 3.2);
    const signMat = this.signTextures[index % this.signTextures.length];
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 6.5, -0.38);
    sign.rotation.y = Math.PI; // Face oncoming player moving forward
    gantryGroup.add(sign);

    group.add(gantryGroup);
  }

  _addRoadsideScenery(group, index) {
    // Roadside trees in the dense fog
    const treeGeo = new THREE.ConeGeometry(2.6, 7.5, 6);
    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.42, 2.8, 6);

    [-18 - Math.random() * 14, 18 + Math.random() * 14].forEach(x => {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const treeGroup = new THREE.Group();
        const treeZ = -this.segmentLength / 2 + Math.random() * this.segmentLength;

        const foliage = new THREE.Mesh(treeGeo, this.treeMat);
        foliage.position.y = 5.2;

        const trunk = new THREE.Mesh(trunkGeo, this.concreteMat);
        trunk.position.y = 1.4;

        treeGroup.add(trunk, foliage);
        treeGroup.position.set(x + (Math.random() - 0.5) * 5, 0, treeZ);
        const s = 0.85 + Math.random() * 0.5;
        treeGroup.scale.set(s, s, s);
        group.add(treeGroup);
      }
    });

    // Milestone post (Patok KM Tol)
    const kmGeo = new THREE.BoxGeometry(0.25, 0.65, 0.25);
    const kmMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
    const kmPost = new THREE.Mesh(kmGeo, kmMat);
    kmPost.position.set(7.5, 0.32, 0);
    group.add(kmPost);

    // High Voltage Power Transmission Tower (SUTET)
    if (index % 7 === 1) {
      const sutetGroup = new THREE.Group();
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 3.5, 34, 4), this.poleMat);
      tower.position.set(40, 17, 0);
      sutetGroup.add(tower);

      const beacon = new THREE.PointLight(0xff0000, 2.5, 50);
      beacon.position.set(40, 34, 0);
      sutetGroup.add(beacon);

      this.flickeringLights.push({
        pointLight: beacon,
        isBlinker: true,
        timer: 0
      });

      group.add(sutetGroup);
    }
  }

  _initMistSystem() {
    const count = 80;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 38;
      positions[i * 3 + 1] = 0.25 + Math.random() * 2.4;
      positions[i * 3 + 2] = Math.random() * 280;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft round smoke/fog texture with feathered radial gradient
    const smokeTexture = TextureGenerator.createSoftSmokeTexture();

    const mat = new THREE.PointsMaterial({
      map: smokeTexture,
      color: 0xa8c5dc,
      size: 11.0,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mistParticles = new THREE.Points(geo, mat);
    this.scene.add(this.mistParticles);
  }

  _initRainSystem() {
    const rainCount = 1800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 48;
      positions[i * 3 + 1] = Math.random() * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft vertical raindrop texture
    const rainTexture = TextureGenerator.createRainDropTexture();

    const mat = new THREE.PointsMaterial({
      map: rainTexture,
      color: 0x90c4f0,
      size: 0.35,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  setRain(active) {
    this.isRaining = active;
    if (this.rainParticles) {
      this.rainParticles.visible = active;
    }
    // High wetness & specular reflections during rain
    this.asphaltMat.roughness = active ? 0.18 : 0.38;
    this.asphaltMat.metalness = active ? 0.45 : 0.22;
  }

  update(dt, playerPos) {
    const playerZ = typeof playerPos === 'object' ? playerPos.z : playerPos;
    const playerX = typeof playerPos === 'object' ? playerPos.x : 0;

    // 1. Endless Highway Recycling
    const behindThreshold = playerZ - this.segmentLength * 1.5;

    this.segments.forEach(seg => {
      if (seg.group.position.z < behindThreshold) {
        let maxZ = -Infinity;
        this.segments.forEach(s => {
          if (s.group.position.z > maxZ) maxZ = s.group.position.z;
        });

        seg.group.position.z = maxZ + this.segmentLength;
        seg.zPos = seg.group.position.z;
      }
    });

    // 2. Flickering Streetlights & Aviation Beacon
    this.flickeringLights.forEach(item => {
      item.timer += dt;
      if (item.isBlinker) {
        item.pointLight.intensity = (Math.sin(item.timer * 4.0) > 0) ? 2.8 : 0.0;
      } else {
        if (Math.random() < 0.08) {
          const isOff = Math.random() < 0.45;
          item.pointLight.intensity = isOff ? 0.2 : (2.0 + Math.random() * 2.2);
          item.bulbMat.color.setHex(isOff ? 0x221a10 : item.baseColor);
        }
      }
    });

    // 3. Update Mist Particles relative to player
    if (this.mistParticles) {
      const posAttr = this.mistParticles.geometry.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 2] -= dt * 1.2;
        if (arr[i + 2] < playerZ - 20) {
          arr[i + 2] = playerZ + 250 + Math.random() * 60;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 4. Update Rain Particles relative to player
    if (this.isRaining && this.rainParticles) {
      this.rainParticles.position.x = playerX;
      this.rainParticles.position.z = playerZ;

      const posAttr = this.rainParticles.geometry.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * 42;
        arr[i + 2] -= dt * 12;
        if (arr[i + 1] < 0) {
          arr[i + 1] = 18;
          arr[i + 2] = (Math.random() - 0.5) * 90;
        }
      }
      posAttr.needsUpdate = true;
    }
  }
}
