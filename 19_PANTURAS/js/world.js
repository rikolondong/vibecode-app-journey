// ============================================================================
// PANTURA: MUDIK ODYSSEY — REAL-SCALE 1:1 METER 3D PANTURA WORLD ENGINE
// 22m 4-Lane Divided Highway, 56m Steel Truss Bridges, Full-Scale SPBU,
// Rest Area Posko Mudik, Dynamic Overhead Green Gantries & Horizon Mountains
// ============================================================================

import * as THREE from '../libs/three.module.js';
import { createTrafficVehicle } from './vehicles.js';
import {
  createHighwayAsphaltTexture,
  createGreenRoadSignTexture,
  createSPBUTotemTexture,
  createBannerTexture,
  createHazardStripeTexture
} from './textures.js';

export const WEATHER_PRESETS = {
  sunset: {
    id: 'sunset',
    label: '🌅 Senja Pantura',
    skyTop: 0x2b3a67,
    skyHorizon: 0xe88352,
    fogColor: 0xd98056,
    fogDensity: 0.0032,
    ambientColor: 0xffe4c4,
    ambientIntensity: 0.95,
    hemiGroundColor: 0x4a3b2c,
    sunColor: 0xffb347,
    sunIntensity: 2.1,
    sunPos: [-65, 38, -90],
    roadRoughness: 0.72,
    lampIntensity: 0.35
  },
  night: {
    id: 'night',
    label: '🌙 Malam Pantura',
    skyTop: 0x050811,
    skyHorizon: 0x131d31,
    fogColor: 0x0e1626,
    fogDensity: 0.0038,
    ambientColor: 0x3b4f73,
    ambientIntensity: 0.55,
    hemiGroundColor: 0x111827,
    sunColor: 0x64748b,
    sunIntensity: 0.45,
    sunPos: [30, 60, -60],
    roadRoughness: 0.58,
    lampIntensity: 1.0
  },
  dawn: {
    id: 'dawn',
    label: '🌫️ Subuh Berkabut',
    skyTop: 0x3d4e6b,
    skyHorizon: 0x8ea4bd,
    fogColor: 0x7e94ad,
    fogDensity: 0.0046,
    ambientColor: 0xdbeafe,
    ambientIntensity: 0.88,
    hemiGroundColor: 0x334155,
    sunColor: 0xfde68a,
    sunIntensity: 1.35,
    sunPos: [70, 28, -80],
    roadRoughness: 0.64,
    lampIntensity: 0.5
  },
  rain: {
    id: 'rain',
    label: '🌧️ Hujan Deras',
    skyTop: 0x141c29,
    skyHorizon: 0x29374a,
    fogColor: 0x243142,
    fogDensity: 0.0052,
    ambientColor: 0x71839b,
    ambientIntensity: 0.7,
    hemiGroundColor: 0x1e293b,
    sunColor: 0x94a3b8,
    sunIntensity: 0.65,
    sunPos: [0, 70, -40],
    roadRoughness: 0.18,
    lampIntensity: 0.95
  }
};

export class PanturaWorld {
  constructor(scene) {
    this.scene = scene;
    this.weatherKeys = ['sunset', 'night', 'dawn', 'rain'];
    this.currentWeatherKey = 'sunset';
    this.currentBiome = 'suburban';

    // REAL-WORLD 1:1 METER SCALE CONSTANTS
    // 4-Lane Divided Highway:
    //   Left Shoulder: -11.0m to -8.8m
    //   Eastbound Slow Lane (Lajur Kiri): center at -6.6m (width 4.0m)
    //   Eastbound Fast Lane (Lajur Kanan): center at -2.7m (width 4.0m)
    //   Median Barrier & PJU Poles: -0.7m to +0.7m (width 1.4m)
    //   Westbound Fast Lane: center at +2.7m (width 4.0m)
    //   Westbound Slow Lane: center at +6.6m (width 4.0m)
    //   Right Shoulder: +8.8m to +11.0m
    this.roadWidth = 22.0;
    this.chunkLength = 60.0;
    this.numChunks = 9; // 540 meters of active highway
    this.chunks = [];
    this.potholes = [];
    this.traffic = [];
    this.gantrySignMaterials = [];

    this.initLights();
    this.initMaterials();
    this.initSkyAndHorizon();
    this.initRoadChunks();
    this.initRainSystem();
    this.initTrafficPool();
    this.applyWeather('sunset');
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xffe4c4, 0x4a3b2c, 0.95);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffb347, 2.1);
    this.dirLight.position.set(-65, 38, -90);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 5;
    this.dirLight.shadow.camera.far = 260;
    const d = 65;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  initMaterials() {
    this.asphaltTex = createHighwayAsphaltTexture();
    this.hazardTex = createHazardStripeTexture();
    this.spbuTotemTex = createSPBUTotemTexture();

    this.roadMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTex,
      roughness: 0.72,
      metalness: 0.12
    });

    this.apronMat = new THREE.MeshStandardMaterial({
      color: 0x383e47,
      roughness: 0.82
    });

    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.85
    });

    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTex,
      roughness: 0.6
    });

    this.terrainLeftMat = new THREE.MeshStandardMaterial({
      color: 0x3b6632,
      roughness: 0.92,
      flatShading: true
    });

    this.terrainRightMat = new THREE.MeshStandardMaterial({
      color: 0x416e37,
      roughness: 0.92,
      flatShading: true
    });

    this.bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
    this.poleMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.45,
      metalness: 0.6
    });
  }

  initSkyAndHorizon() {
    // Distant Horizon Sun & Volcanic Mountain Range (Gunung Ciremai / Slamet / Muria)
    const sunGeo = new THREE.CircleGeometry(34, 32);
    this.sunDiscMat = new THREE.MeshBasicMaterial({
      color: 0xffa63b,
      fog: false,
      transparent: true,
      opacity: 0.88
    });
    this.sunDisc = new THREE.Mesh(sunGeo, this.sunDiscMat);
    this.sunDisc.position.set(-28, 34, -390);
    this.scene.add(this.sunDisc);

    // Distant Low-Poly Mountain Silhouettes on the horizon
    const mountainGroup = new THREE.Group();
    const mtMat = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.95,
      flatShading: true
    });

    const mtSpecs = [
      { x: -160, z: -370, r: 95, h: 68 },
      { x: -45, z: -395, r: 120, h: 88 }, // Gunung Slamet / Ciremai peak
      { x: 95, z: -380, r: 105, h: 64 },
      { x: 210, z: -360, r: 85, h: 52 }
    ];

    mtSpecs.forEach((m) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(m.r, m.h, 7), mtMat);
      cone.position.set(m.x, m.h / 2 - 4, m.z);
      mountainGroup.add(cone);
    });
    this.mountainGroup = mountainGroup;
    this.scene.add(mountainGroup);
  }

  // ==========================================================================
  // 60-METER HIGHWAY CHUNK BUILDER
  // ==========================================================================
  initRoadChunks() {
    for (let i = 0; i < this.numChunks; i++) {
      const zPos = 45 - i * this.chunkLength;
      const chunk = this.createChunk(i, zPos);
      this.chunks.push(chunk);
      this.scene.add(chunk);
    }
    // Set initial road signs for Bekasi -> Subang / Cirebon
    this.updateGantrySignboards('SUBANG • CIREBON', 'CIKAMPEK 45 KM • CIREBON 145 KM', 'REST AREA & SPBU 500 M');
  }

  createChunk(index, zPos) {
    const group = new THREE.Group();
    group.position.z = zPos;

    // 1. 22-Meter Wide 4-Lane Asphalt Highway Surface
    const roadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roadWidth, this.chunkLength),
      this.roadMat
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Concrete Curbs / Shoulders & Far Terrain (180m wide on each side)
    const groundGeo = new THREE.PlaneGeometry(180, this.chunkLength);
    const leftGround = new THREE.Mesh(groundGeo, this.terrainLeftMat);
    leftGround.rotation.x = -Math.PI / 2;
    leftGround.position.set(-101, -0.06, 0);
    leftGround.receiveShadow = true;

    const rightGround = new THREE.Mesh(groundGeo, this.terrainRightMat);
    rightGround.rotation.x = -Math.PI / 2;
    rightGround.position.set(101, -0.06, 0);
    rightGround.receiveShadow = true;
    group.add(leftGround, rightGround);

    // 3. Center Concrete New Jersey Median Barrier (height: 0.95m, width: 0.75m)
    const medianBarrier = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.95, this.chunkLength - 1.2),
      this.concreteMat
    );
    medianBarrier.position.set(0, 0.48, 0);
    medianBarrier.castShadow = true;
    medianBarrier.receiveShadow = true;
    group.add(medianBarrier);

    // Bougainvillea Median Shrubs atop/between barriers & High-Mast Double PJU Streetlights
    this.populateMedianDetails(group, index);

    // 4. Populate Real-Scale Roadside Megastructures by Chunk Index
    const propsGroup = new THREE.Group();
    this.populateChunkLandmarks(propsGroup, index);
    group.add(propsGroup);

    group.userData = { index, propsGroup };
    return group;
  }

  populateMedianDetails(group, index) {
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.85, flatShading: true });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.7, flatShading: true });

    // Median bushes every 10 meters
    for (let z = -22; z <= 22; z += 11) {
      const bush = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 2.6), shrubMat);
      bush.position.set(0, 1.15, z);
      bush.castShadow = true;
      group.add(bush);

      if (Math.abs(z) % 22 === 0) {
        const bloom = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.35, 1.2), flowerMat);
        bloom.position.set(0, 1.42, z);
        group.add(bloom);
      }
    }

    // 10.5-Meter High-Mast Twin Median PJU Streetlight Pole (2 per 60m chunk, every 30m)
    [-15, 15].forEach((zPos) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 10.5, 8), this.poleMat);
      mast.position.set(0, 5.25, zPos);
      mast.castShadow = true;
      group.add(mast);

      // Twin horizontal arms reaching over Eastbound & Westbound lanes
      const armBar = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 0.14), this.poleMat);
      armBar.position.set(0, 10.35, zPos);
      group.add(armBar);

      // Left & Right Lamp Housings
      const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.38), this.bulbMat);
      lampL.position.set(-2.55, 10.22, zPos);
      const lampR = lampL.clone();
      lampR.position.x = 2.55;
      group.add(lampL, lampR);
    });
  }

  populateChunkLandmarks(propsGroup, index) {
    // Populate realistic large roadside trees (8m - 12m tall Trembesi canopies) on non-building zones
    if (index === 2) {
      // CHUNK 2: FULL-SCALE 56-METER JEMBATAN RANGKA BAJA CALLENDER-HAMILTON & RIVER
      propsGroup.add(this.createFullScaleSteelBridge());
      return;
    }

    if (index === 4) {
      // CHUNK 4: FULL-SCALE SPBU PERTAMINA PANTURA COMPLEX (Pom Bensin, Canopy, Totem, Minimarket)
      propsGroup.add(this.createFullScaleSPBU());
      this.populateRightSideTrees(propsGroup);
      return;
    }

    if (index === 6) {
      // CHUNK 6: FULL-SCALE REST AREA TERPADU, POSKO MUDIK, MASJID AGUNG & WARUNG PECEL LELE
      propsGroup.add(this.createFullScaleRestArea());
      this.populateRightSideTrees(propsGroup);
      return;
    }

    if (index === 1 || index === 5 || index === 8) {
      // OVERHEAD FULL-SPAN GREEN HIGHWAY GANTRY PORTAL (Papan Nama Jalan Nasional)
      propsGroup.add(this.createOverheadHighwayGantry(index));
    }

    // Standard roadside details: Giant Trembesi trees, Green Roadside Direction Boards, Warung Tenda, Utility Poles
    this.populateBothSidesTreesAndPoles(propsGroup, index);
  }

  // ==========================================================================
  // 1. JEMBATAN RANGKA BAJA CALLENDER-HAMILTON (56m Span, 9.8m High Steel Truss)
  // ==========================================================================
  createFullScaleSteelBridge() {
    const g = new THREE.Group();

    const trussYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.42,
      metalness: 0.45
    });

    const girderGreyMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.45,
      metalness: 0.55
    });

    // Wide River Flowing Underneath the Bridge (54m wide river channel)
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e4e68,
      roughness: 0.2,
      metalness: 0.65
    });
    const river = new THREE.Mesh(new THREE.PlaneGeometry(360, 48), waterMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -0.03, 0);
    g.add(river);

    // Concrete Bridge Deck Side Parapets
    [-11.4, 11.4].forEach((xSide) => {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 56), this.concreteMat);
      parapet.position.set(xSide, 0.62, 0);
      parapet.castShadow = true;
      g.add(parapet);
    });

    // Entrance & Exit Yellow-Black Hazard Abutment Pillars
    [-11.4, 0, 11.4].forEach((xPos) => {
      [-28, 28].forEach((zEnd) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.8, 1.35), this.hazardMat);
        pillar.position.set(xPos, 1.4, zEnd);
        pillar.castShadow = true;
        g.add(pillar);
      });
    });

    // 3 Parallel Callender-Hamilton Warren Steel Truss Walls (Left -11.4m, Center Median 0m, Right +11.4m)
    const spanLen = 54;
    const height = 9.4;
    const numBays = 6;
    const bayLen = spanLen / numBays; // 9 meters per bay

    [-11.4, 0, 11.4].forEach((xWall) => {
      // Top Chord Beam (54m long at y = 9.4m)
      const topChord = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, spanLen), trussYellowMat);
      topChord.position.set(xWall, height, 0);
      topChord.castShadow = true;
      g.add(topChord);

      // Vertical & Diagonal Warren Truss Members
      for (let b = 0; b <= numBays; b++) {
        const z = -spanLen / 2 + b * bayLen;
        const vert = new THREE.Mesh(new THREE.BoxGeometry(0.48, height, 0.48), trussYellowMat);
        vert.position.set(xWall, height / 2, z);
        vert.castShadow = true;
        g.add(vert);

        if (b < numBays) {
          const zMid = z + bayLen / 2;
          const diagLen = Math.hypot(bayLen, height);
          const diag = new THREE.Mesh(new THREE.BoxGeometry(0.42, diagLen, 0.42), girderGreyMat);
          diag.position.set(xWall, height / 2, zMid);
          diag.rotation.x = (b % 2 === 0 ? 1 : -1) * Math.atan2(bayLen, height);
          diag.castShadow = true;
          g.add(diag);
        }
      }
    });

    // Overhead Lateral Portal Bracing Beams across the entire 22.8m width at y = 9.4m
    for (let b = 0; b <= numBays; b++) {
      const z = -spanLen / 2 + b * bayLen;
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(23.4, 0.55, 0.55), girderGreyMat);
      crossBeam.position.set(0, height, z);
      crossBeam.castShadow = true;
      g.add(crossBeam);
    }

    // Bridge Name & Clearance Banner on Entrance Portal ("JEMBATAN SUNGAI PANTURA • 4.2M")
    const bridgeSignTex = createBannerTexture(
      '#15803d',
      '#ffffff',
      'JEMBATAN SUNGAI PANTURA',
      'TINGGI MAKSIMUM 4.2 METER • KURANGI KECEPATAN',
      '#ffffff'
    );
    const bridgeSign = new THREE.Mesh(
      new THREE.BoxGeometry(9.5, 1.55, 0.16),
      new THREE.MeshBasicMaterial({ map: bridgeSignTex })
    );
    bridgeSign.position.set(-5.7, height - 0.9, 27.2);
    g.add(bridgeSign);

    return g;
  }

  // ==========================================================================
  // 2. FULL-SCALE SPBU PERTAMINA PANTURA (Pom Bensin, Canopy, Totem, Minimarket)
  // ==========================================================================
  createFullScaleSPBU() {
    const g = new THREE.Group();

    // 1. Wide Paved Concrete Driveway & Forecourt Apron (48m long x 28m deep on left side)
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(30, 52), this.apronMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(-25, 0.01, 0);
    apron.receiveShadow = true;
    g.add(apron);

    // 2. Tall 10.5m Illuminated SPBU Price Totem right by the highway edge (x = -12.8m, z = 18m)
    const totemBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 9.8, 2.85),
      new THREE.MeshBasicMaterial({ map: this.spbuTotemTex })
    );
    totemBody.position.set(-12.8, 4.9, 19);
    // Rotate slightly toward oncoming Eastbound drivers so it's readable from afar!
    totemBody.rotation.y = Math.PI / 2.2;
    totemBody.castShadow = true;
    g.add(totemBody);

    // 3. Massive 6.6m High Red & White SPBU Canopy (14m wide x 26m long)
    const canopyRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.35
    });
    const canopyWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      emissive: 0xe2e8f0,
      emissiveIntensity: 0.25
    });
    const ceilingGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.15, 26), canopyRedMat);
    canopyRoof.position.set(-22.5, 6.4, 0);
    canopyRoof.castShadow = true;
    g.add(canopyRoof);

    const whiteStripe = new THREE.Mesh(new THREE.BoxGeometry(13.65, 0.36, 26.15), canopyWhiteMat);
    whiteStripe.position.set(-22.5, 6.05, 0);
    g.add(whiteStripe);

    const underGlow = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 24.5), ceilingGlowMat);
    underGlow.rotation.x = Math.PI / 2;
    underGlow.position.set(-22.5, 5.81, 0);
    g.add(underGlow);

    // Fascia Sign on Canopy Edge ("SPBU PERTAMINA • PASTI PAS")
    const fasciaTex = createBannerTexture(
      '#dc2626',
      '#ffffff',
      'SPBU PANTURA 24 JAM',
      'PERTAMAX • PERTALITE • DEXLITE • MUSHOLA',
      '#ffffff'
    );
    const fasciaSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.18, 18),
      new THREE.MeshBasicMaterial({ map: fasciaTex })
    );
    fasciaSign.position.set(-15.7, 6.4, 0);
    g.add(fasciaSign);

    // 6 Support Columns & 3 Fuel Pump Islands (Pulau Pompa BBM)
    const dispenserMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const pumpRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

    [-8, 0, 8].forEach((zIsland) => {
      // Concrete Raised Island
      const island = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.22, 1.8), this.concreteMat);
      island.position.set(-22.5, 0.11, zIsland);
      g.add(island);

      // 2 Canopy Columns per island
      [-19.5, -25.5].forEach((xCol) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 6.0, 12), canopyWhiteMat);
        col.position.set(xCol, 3.0, zIsland);
        col.castShadow = true;
        g.add(col);

        // Fuel Dispenser Machine next to column
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.65), dispenserMat);
        pump.position.set(xCol + 1.4, 1.15, zIsland);
        pump.castShadow = true;
        g.add(pump);

        const pumpTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.7), pumpRedMat);
        pumpTop.position.set(xCol + 1.4, 2.25, zIsland);
        g.add(pumpTop);
      });
    });

    // 4. Rear Minimarket, ATM Center & Mushola Building (x = -34m)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.75 });
    const storeBuilding = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.4, 28), wallMat);
    storeBuilding.position.set(-34.5, 2.2, 0);
    storeBuilding.castShadow = true;
    g.add(storeBuilding);

    const storeBannerTex = createBannerTexture(
      '#1d4ed8',
      '#facc15',
      'MINIMARKET • KOPI • ATM',
      'TOILET BERSIH & MUSHOLA PEMUDIK',
      '#ffffff'
    );
    const storeSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.2, 22),
      new THREE.MeshBasicMaterial({ map: storeBannerTex })
    );
    storeSign.position.set(-30.65, 3.8, 0);
    g.add(storeSign);

    return g;
  }

  // ==========================================================================
  // 3. FULL-SCALE REST AREA TERPADU, MASJID AGUNG, POSKO MUDIK & KULINER
  // ==========================================================================
  createFullScaleRestArea() {
    const g = new THREE.Group();

    // 1. Paved Rest Area Parking Lot (54m long x 32m deep)
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(34, 54), this.apronMat);
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(-27, 0.01, 0);
    lot.receiveShadow = true;
    g.add(lot);

    // 2. Roadside Welcome Arch / Signboard ("REST AREA & POSKO MUDIK PANTURA")
    const archTex = createBannerTexture(
      '#0f6e3f',
      '#facc15',
      'REST AREA & POSKO MUDIK',
      'MASJID AGUNG • WARUNG PECEL LELE • BENGKEL SIAGA',
      '#ffffff'
    );
    const archSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 2.4, 9.5),
      new THREE.MeshBasicMaterial({ map: archTex })
    );
    archSign.position.set(-12.2, 4.6, 20);
    archSign.rotation.y = Math.PI / 6;
    g.add(archSign);

    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.8, 8), this.poleMat);
    post1.position.set(-12.2, 2.4, 20);
    g.add(post1);

    // 3. Full-Scale Masjid Jami Pantura with 16m Minaret Tower & Green-Gold Dome
    const masjidGroup = new THREE.Group();
    masjidGroup.position.set(-31, 0, -11);

    const masjidWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.3,
      metalness: 0.35
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.25,
      metalness: 0.8
    });

    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(12, 6.2, 12), masjidWallMat);
    mainHall.position.y = 3.1;
    mainHall.castShadow = true;
    masjidGroup.add(mainHall);

    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.6, 13.2), domeMat);
    roofBase.position.y = 6.4;
    masjidGroup.add(roofBase);

    const mainDome = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      domeMat
    );
    mainDome.position.y = 6.7;
    mainDome.castShadow = true;
    masjidGroup.add(mainDome);

    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 1.8, 6), goldMat);
    finial.position.y = 11.6;
    masjidGroup.add(finial);

    // 16.5-Meter Tall Minaret Tower (Menara Masjid)
    const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.25, 14.5, 8), masjidWallMat);
    minaret.position.set(7.2, 7.25, 6.5);
    minaret.castShadow = true;
    masjidGroup.add(minaret);

    const minaretDome = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.8, 8), domeMat);
    minaretDome.position.set(7.2, 15.8, 6.5);
    masjidGroup.add(minaretDome);

    g.add(masjidGroup);

    // 4. Row of Authentic Warung Kuliner Pantura (Pecel Lele Lamongan & Empal Gentong)
    const warungConfigs = [
      {
        z: 10,
        roofColor: 0x1d4ed8,
        bg: '#fef08a',
        border: '#dc2626',
        title: 'PECEL LELE & BEBEK LAMONGAN',
        sub: 'SAMBAL TERASI MANTAP • NASI UDUK HANGAT',
        textCol: '#111827'
      },
      {
        z: 21,
        roofColor: 0xea580c,
        bg: '#15803d',
        border: '#facc15',
        title: 'WARUNG EMPAL GENTONG & KOPI',
        sub: 'KHAS PANTURA • TEH POCI GULA BATU',
        textCol: '#ffffff'
      }
    ];

    warungConfigs.forEach((cfg) => {
      const wg = new THREE.Group();
      wg.position.set(-20.5, 0, cfg.z);

      const tentMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.7 });
      const tentBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.2, 8.5), tentMat);
      tentBody.position.y = 1.6;
      tentBody.castShadow = true;
      wg.add(tentBody);

      const bannerTex = createBannerTexture(cfg.bg, cfg.border, cfg.title, cfg.sub, cfg.textCol);
      const bannerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 2.2, 8.2),
        new THREE.MeshBasicMaterial({ map: bannerTex })
      );
      bannerMesh.position.set(2.8, 1.65, 0);
      wg.add(bannerMesh);

      // Warm interior bulb glow
      const warmStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.25, 7.6),
        this.bulbMat
      );
      warmStrip.position.set(2.82, 2.95, 0);
      wg.add(warmStrip);

      g.add(wg);
    });

    return g;
  }

  // ==========================================================================
  // 4. FULL-SPAN OVERHEAD GREEN HIGHWAY GANTRY (Portal Papan Nama Jalan 25m)
  // ==========================================================================
  createOverheadHighwayGantry(chunkIndex) {
    const g = new THREE.Group();

    // Left & Right Steel Lattice Columns at x = -12.4m and x = +12.4m (Height: 7.8m)
    [-12.4, 12.4].forEach((xSide) => {
      const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 7.8, 8), this.poleMat);
      col1.position.set(xSide, 3.9, -0.45);
      col1.castShadow = true;

      const col2 = col1.clone();
      col2.position.z = 0.45;
      g.add(col1, col2);
    });

    // Overhead Steel Truss Span Beam across all 4 lanes (25.4m wide at y = 7.4m)
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(25.4, 0.42, 0.9), this.poleMat);
    topBeam.position.set(0, 7.6, 0);
    topBeam.castShadow = true;
    g.add(topBeam);

    const botBeam = new THREE.Mesh(new THREE.BoxGeometry(25.4, 0.36, 0.9), this.poleMat);
    botBeam.position.set(0, 6.5, 0);
    g.add(botBeam);

    // 2 Large Reflective Green Signboards over the Eastbound Lanes
    // Left Panel (Lajur Kiri / Exit / Rest Area) & Right Panel (Lajur Lurus / Kota Tujuan)
    const signTexMain = createGreenRoadSignTexture(
      'CIREBON • SEMARANG',
      'BREBES • PEKALONGAN',
      'SURABAYA (JALUR UTAMA)',
      '1',
      '⬆'
    );
    const signMatMain = new THREE.MeshBasicMaterial({ map: signTexMain });

    const signTexLeft = createGreenRoadSignTexture(
      'LAJUR KIRI LAMBAT',
      'SPBU & REST AREA 500 M',
      'BUS & TRUK GUNAKAN KIRI',
      '1',
      '⬅'
    );
    const signMatLeft = new THREE.MeshBasicMaterial({ map: signTexLeft });

    if (chunkIndex === 1 || chunkIndex === 5) {
      this.gantrySignMaterials.push(signMatMain);
    }

    const boardRight = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.5, 0.18), signMatMain);
    boardRight.position.set(-2.9, 6.95, 0.55);
    g.add(boardRight);

    const boardLeft = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.5, 0.18), signMatLeft);
    boardLeft.position.set(-8.9, 6.95, 0.55);
    g.add(boardLeft);

    return g;
  }

  /**
   * Dynamically updates overhead gantry signs to match the player's current Pantura location
   */
  updateGantrySignboards(mainCityLine, distLine1, distLine2) {
    const newTex = createGreenRoadSignTexture(mainCityLine, distLine1, distLine2, '1', '⬆');
    this.gantrySignMaterials.forEach((mat) => {
      if (mat.map) mat.map.dispose();
      mat.map = newTex;
      mat.needsUpdate = true;
    });
  }

  // ==========================================================================
  // ROADSIDE TREMBESI TREES (8m - 12m Tall), UTILITY POLES & DIRECTION SIGNS
  // ==========================================================================
  populateRightSideTrees(propsGroup) {
    for (let z = -24; z <= 24; z += 14) {
      const tree = this.createRealisticTrembesiTree();
      tree.position.set(14.5 + Math.random() * 18, 0, z + (Math.random() * 4 - 2));
      propsGroup.add(tree);
    }
  }

  populateBothSidesTreesAndPoles(propsGroup, index) {
    for (let z = -24; z <= 24; z += 15) {
      const leftTree = this.createRealisticTrembesiTree();
      leftTree.position.set(-14.5 - Math.random() * 22, 0, z + (Math.random() * 4 - 2));
      propsGroup.add(leftTree);

      const rightTree = this.createRealisticTrembesiTree();
      rightTree.position.set(14.5 + Math.random() * 22, 0, z + (Math.random() * 4 - 2));
      propsGroup.add(rightTree);
    }

    // Concrete PLN Utility Poles along left shoulder (-12.5m)
    const plnPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 9.5, 8), this.concreteMat);
    plnPole.position.set(-12.8, 4.75, -10);
    plnPole.castShadow = true;
    propsGroup.add(plnPole);

    // Roadside Green Kilometer & Direction Post on Left Shoulder
    if (index % 2 === 0) {
      const sideSignTex = createGreenRoadSignTexture(
        'JALUR PANTURA',
        'JAGA JARAK AMAN',
        'POSKO MUDIK SIAGA 24 JAM',
        '1',
        '⬆'
      );
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 1.55, 0.12),
        new THREE.MeshBasicMaterial({ map: sideSignTex })
      );
      board.position.set(-12.8, 3.4, 14);
      propsGroup.add(board);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.4, 8), this.poleMat);
      post.position.set(-12.8, 1.7, 14);
      propsGroup.add(post);
    }
  }

  createRealisticTrembesiTree() {
    // True-scale Indonesian Trembesi (Rain Tree) — 8m to 11.5m tall with wide umbrella canopy!
    const g = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.92, flatShading: true });
    const foliageColors = [0x26593a, 0x2d6a4f, 0x3b7a57];
    const leafMat = new THREE.MeshStandardMaterial({
      color: foliageColors[Math.floor(Math.random() * foliageColors.length)],
      roughness: 0.85,
      flatShading: true
    });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.62, 4.8, 7), trunkMat);
    trunk.position.y = 2.4;
    trunk.castShadow = true;
    g.add(trunk);

    // Wide multi-tiered umbrella crown
    const mainCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8, 1), leafMat);
    mainCrown.position.y = 6.4;
    mainCrown.scale.set(1.45, 0.72, 1.35);
    mainCrown.castShadow = true;
    g.add(mainCrown);

    const topCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), leafMat);
    topCrown.position.y = 8.2;
    topCrown.scale.set(1.3, 0.68, 1.2);
    topCrown.castShadow = true;
    g.add(topCrown);

    const scale = 0.88 + Math.random() * 0.42;
    g.scale.setScalar(scale);
    return g;
  }

  // ==========================================================================
  // RAIN PARTICLE SYSTEM
  // ==========================================================================
  initRainSystem() {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 68;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = 25 - Math.random() * 160;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 0.24,
      transparent: true,
      opacity: 0.65
    });
    this.rainPoints = new THREE.Points(geo, mat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  // ==========================================================================
  // REAL-SCALE 4-LANE TRAFFIC & POTHOLE POOL
  // ==========================================================================
  initTrafficPool() {
    // Eastbound Lanes (Jakarta -> Surabaya, Left side of Median):
    //   Shoulder/Motor lane: x = -8.4m
    //   Slow Outer Lane (Lajur Kiri): x = -6.6m
    //   Fast Inner Lane (Lajur Kanan): x = -2.7m
    // Westbound Lanes (Surabaya -> Jakarta, Right side of Median):
    //   Fast Inner Lane: x = +2.7m
    //   Slow Outer Lane: x = +6.6m
    const types = [
      'bus_pantura', 'truk_canter', 'motor_mudik', 'mpv_lain',
      'truk_canter', 'bus_pantura', 'motor_mudik', 'mpv_lain',
      'truk_canter', 'bus_pantura', 'motor_mudik', 'mpv_lain'
    ];

    for (let i = 0; i < 12; i++) {
      const type = types[i % types.length];
      const mesh = createTrafficVehicle(type);
      this.scene.add(mesh);

      const isOncoming = i % 3 === 2;
      let laneX;
      if (!isOncoming) {
        if (type === 'motor_mudik') laneX = -8.2;
        else if (type === 'truk_canter') laneX = -6.6;
        else laneX = i % 2 === 0 ? -6.6 : -2.7;
        mesh.rotation.y = 0;
      } else {
        laneX = i % 2 === 0 ? 2.7 : 6.6;
        mesh.rotation.y = Math.PI;
      }

      const zStart = -35 - i * 42;
      mesh.position.set(laneX, 0, zStart);

      this.traffic.push({
        mesh,
        type,
        isOncoming,
        laneX,
        speedKmh: isOncoming ? (68 + Math.random() * 34) : (44 + Math.random() * 34)
      });
    }

    // Potholes (Lubang Aspal Pantura) in Eastbound lanes
    const potholeGeo = new THREE.CircleGeometry(0.95, 10);
    potholeGeo.rotateX(-Math.PI / 2);
    const potholeMat = new THREE.MeshBasicMaterial({ color: 0x090b0f });

    for (let i = 0; i < 5; i++) {
      const hole = new THREE.Mesh(potholeGeo, potholeMat);
      const xPos = [-6.6, -2.7, -4.8, -6.6, -2.7][i];
      hole.position.set(xPos, 0.03, -55 - i * 85);
      this.scene.add(hole);
      this.potholes.push({
        mesh: hole,
        hitCooldown: 0
      });
    }
  }

  // ==========================================================================
  // BIOME & WEATHER SWITCHING
  // ==========================================================================
  setBiome(biome) {
    this.currentBiome = biome;
    if (biome === 'ricefield') {
      this.terrainLeftMat.color.setHex(0x4d7c2b);
      this.terrainRightMat.color.setHex(0x3f6a24);
    } else if (biome === 'forest') {
      this.terrainLeftMat.color.setHex(0x1e3f20);
      this.terrainRightMat.color.setHex(0x1b3b1d);
    } else if (biome === 'coastal') {
      // North Coast Java Sea (Laut Jawa) on the left side of the highway!
      this.terrainLeftMat.color.setHex(0x154c6c);
      this.terrainRightMat.color.setHex(0x4a6b3b);
    } else {
      this.terrainLeftMat.color.setHex(0x3d5436);
      this.terrainRightMat.color.setHex(0x3d5436);
    }
  }

  applyWeather(weatherKey) {
    const preset = WEATHER_PRESETS[weatherKey] || WEATHER_PRESETS.sunset;
    this.currentWeatherKey = preset.id;

    this.scene.background = new THREE.Color(preset.skyHorizon);
    this.scene.fog = new THREE.FogExp2(preset.fogColor, preset.fogDensity);

    this.hemiLight.color.setHex(preset.ambientColor);
    this.hemiLight.groundColor.setHex(preset.hemiGroundColor);
    this.hemiLight.intensity = preset.ambientIntensity;

    this.dirLight.color.setHex(preset.sunColor);
    this.dirLight.intensity = preset.sunIntensity;
    this.dirLight.position.set(...preset.sunPos);

    this.roadMat.roughness = preset.roadRoughness;
    this.rainPoints.visible = preset.id === 'rain';

    if (this.sunDisc) {
      this.sunDisc.visible = preset.id === 'sunset' || preset.id === 'dawn';
      this.sunDiscMat.color.setHex(preset.id === 'sunset' ? 0xff9e3d : 0xfde047);
    }

    return preset;
  }

  cycleWeather() {
    const idx = this.weatherKeys.indexOf(this.currentWeatherKey);
    const nextKey = this.weatherKeys[(idx + 1) % this.weatherKeys.length];
    return this.applyWeather(nextKey);
  }

  // ==========================================================================
  // FRAME UPDATE (1:1 METER SCALE SCROLLING)
  // ==========================================================================
  update(dt, playerSpeedKmh, playerX, isAutoSteer, onCollision, onPotholeHit) {
    const playerSpeedMps = (playerSpeedKmh * 1000) / 3600;
    const scrollDist = playerSpeedMps * dt * 1.45;

    // 1. Scroll 60m Highway Chunks
    const totalLoopLength = this.numChunks * this.chunkLength;
    for (const chunk of this.chunks) {
      chunk.position.z += scrollDist;
      if (chunk.position.z > 75) {
        chunk.position.z -= totalLoopLength;
      }
    }

    // 2. Update Rain Particles
    if (this.rainPoints.visible) {
      const pos = this.rainPoints.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 32 * dt;
        let z = pos.getZ(i) + scrollDist * 0.65;
        if (y < 0) y = 30;
        if (z > 25) z -= 160;
        pos.setY(i, y);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }

    // 3. Scroll Potholes & Check Hit
    for (const hole of this.potholes) {
      hole.mesh.position.z += scrollDist;
      if (hole.hitCooldown > 0) hole.hitCooldown -= dt;

      const dz = Math.abs(hole.mesh.position.z);
      const dx = Math.abs(hole.mesh.position.x - playerX);
      if (dz < 2.2 && dx < 1.1 && hole.hitCooldown <= 0 && !isAutoSteer) {
        hole.hitCooldown = 2.0;
        if (onPotholeHit) onPotholeHit();
      }

      if (hole.mesh.position.z > 28) {
        hole.mesh.position.z = -360 - Math.random() * 90;
        const lanes = [-6.6, -2.7, -4.6];
        hole.mesh.position.x = lanes[Math.floor(Math.random() * lanes.length)];
      }
    }

    // 4. Update Traffic Vehicles & Check Overtaking / Collisions
    for (const v of this.traffic) {
      const relSpeedKmh = v.isOncoming
        ? (playerSpeedKmh + v.speedKmh)
        : (playerSpeedKmh - v.speedKmh);

      const relMove = ((relSpeedKmh * 1000) / 3600) * dt * 1.4;
      v.mesh.position.z += relMove;

      v.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.007 + v.laneX)) * 0.035;

      if (v.mesh.position.z > 48) {
        v.mesh.position.z = -390 - Math.random() * 110;
        if (!v.isOncoming) {
          if (v.type === 'motor_mudik') v.laneX = -8.2;
          else if (v.type === 'truk_canter') v.laneX = -6.6;
          else v.laneX = Math.random() < 0.55 ? -6.6 : -2.7;
        } else {
          v.laneX = Math.random() < 0.5 ? 2.7 : 6.6;
        }
        v.mesh.position.x = v.laneX;
      } else if (v.mesh.position.z < -480) {
        v.mesh.position.z = 42;
      }

      // Collision Check with Player MPV (only on same side or if player crosses median)
      const dz = Math.abs(v.mesh.position.z);
      const dx = Math.abs(v.mesh.position.x - playerX);
      const safeZ = v.mesh.userData.halfLen + 2.15;
      const safeX = v.mesh.userData.halfWid + 0.92;

      if (dz < safeZ && dx < safeX) {
        if (onCollision) onCollision(v);
        v.mesh.position.z = -65 - Math.random() * 55;
      }
    }
  }
}
