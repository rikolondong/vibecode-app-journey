// ============================================================================
// PROJECT SKYLINE // 3D LOW-POLY PIXEL MODELS, TEXTURES & GAME DATABASES
// ============================================================================

const AIRCRAFT_DB = [
  {
    id: 'f15c',
    code: 'F-15C // PIXEL EAGLE',
    shortName: 'F-15C EAGLE',
    role: 'AIR SUPERIORITY FIGHTER',
    tier: 'GEN-4.5',
    defaultSpw: '4aam',
    stats: { speed: 86, mobility: 78, stability: 85, armor: 76 },
    physics: {
      maxSpeed: 310,
      minSpeed: 85,
      cruiseSpeed: 185,
      pitchRate: 1.55,
      rollRate: 2.85,
      yawRate: 0.72,
      maxHp: 100
    },
    colors: {
      primary: '#627d98',
      secondary: '#334e68',
      accent: '#2cf0ff',
      canopy: '#ffd166',
      burner: '#ff7b00'
    },
    wingStyle: 'swept',
    desc: 'Pesawat tempur superioritas udara serbaguna dengan kecepatan tinggi, dua mesin afterburner kuat, dan keseimbangan manuver dogfight terbaik.'
  },
  {
    id: 'su47',
    code: 'SU-47 // BERKUT-X',
    shortName: 'SU-47 BERKUT',
    role: 'EXPERIMENTAL INTERCEPTOR',
    tier: 'GEN-4.75+',
    defaultSpw: 'qaam',
    stats: { speed: 92, mobility: 96, stability: 70, armor: 65 },
    physics: {
      maxSpeed: 335,
      minSpeed: 80,
      cruiseSpeed: 195,
      pitchRate: 1.92,
      rollRate: 3.35,
      yawRate: 0.90,
      maxHp: 85
    },
    colors: {
      primary: '#1f2933',
      secondary: '#111820',
      accent: '#ff384c',
      canopy: '#2cf0ff',
      burner: '#38b6ff'
    },
    wingStyle: 'forward',
    desc: 'Jet eksperimental bersayap sapu-maju (Forward-Swept Wing) dengan kelincahan ekstrim untuk manuver High-G Turn tajam di ruang sempit.'
  },
  {
    id: 'f22x',
    code: 'F-22X // RAPTOR NOVA',
    shortName: 'F-22X RAPTOR',
    role: 'STEALTH TACTICAL DOMINATOR',
    tier: 'GEN-5.0',
    defaultSpw: 'hvsm',
    stats: { speed: 95, mobility: 90, stability: 92, armor: 88 },
    physics: {
      maxSpeed: 345,
      minSpeed: 82,
      cruiseSpeed: 200,
      pitchRate: 1.78,
      rollRate: 3.10,
      yawRate: 0.85,
      maxHp: 115
    },
    colors: {
      primary: '#475569',
      secondary: '#1e293b',
      accent: '#2cff7e',
      canopy: '#fbbf24',
      burner: '#ff9e00'
    },
    wingStyle: 'diamond',
    desc: 'Pesawat tempur siluman generasi ke-5 dengan thrust vectoring, stabilitas tempur presisi tinggi, dan struktur komposit tahan banting.'
  }
];

const SPW_DB = [
  {
    id: '4aam',
    name: '4AAM // MULTI-LOCK AA',
    short: '4AAM',
    ammo: 24,
    reloadTime: 5.0,
    desc: 'Mengunci hingga 4 target sekaligus di dalam kerucut HUD dan meluncurkan salvo 4 rudal serentak.'
  },
  {
    id: 'qaam',
    name: 'QAAM // HIGH-AGILITY MSL',
    short: 'QAAM',
    ammo: 16,
    reloadTime: 4.2,
    desc: 'Rudal jarak pendek-menengah dengan sudut belok super tajam yang mengejar target walau menghindar.'
  },
  {
    id: 'hvsm',
    name: 'HVSM // HYPER-VELOCITY',
    short: 'HVSM',
    ammo: 14,
    reloadTime: 4.6,
    desc: 'Rudal hipersonik berkecepatan 2.5x lipat dengan daya hancur tinggi terhadap pesawat Ace & kapal perang.'
  }
];

const MISSION_DB = [
  {
    id: 'm1',
    title: 'OP. SHATTERED SKIES',
    meta: 'CUACA: CERAH // ZONA: KEPULAUAN AZURE // 3 WAVES',
    skyTop: 0x0b1d3a,
    skyHorizon: 0x2c699a,
    fogColor: 0x1e4e79,
    seaColor: 0x0a2e4d,
    desc: 'Patroli udara musuh dan armada kapal radar telah menduduki Kepulauan Azure. Bersihkan 3 gelombang pertahanan termasuk Skuadron Elit "Crimson".'
  },
  {
    id: 'm2',
    title: 'OP. CRIMSON SUNSET',
    meta: 'CUACA: SENJA MERAH // ZONA: SELAT SOLAR // 3 WAVES',
    skyTop: 0x1a0b2e,
    skyHorizon: 0xc84b31,
    fogColor: 0x6e2b3b,
    seaColor: 0x1f1129,
    desc: 'Serangan senja berkecepatan tinggi! Hadapi pencegat jarak dekat musuh dan hancurkan Benteng Terbang Komando "ARKBIRD" di gelombang terakhir.'
  },
  {
    id: 'm3',
    title: 'OP. NIGHT VIPER',
    meta: 'CUACA: MALAM RADAR // ZONA: LAUT UTARA // 3 WAVES',
    skyTop: 0x02060d,
    skyHorizon: 0x092635,
    fogColor: 0x071924,
    seaColor: 0x030d17,
    desc: 'Operasi intersepsi malam hari dengan visibilitas rendah. Andalkan instrumen HUD dan Radar untuk memburu skuadron siluman dan kapal penjelajah.'
  }
];

// ============================================================================
// PROCEDURAL PIXEL TEXTURE GENERATOR (THREE.NearestFilter)
// ============================================================================
function createPixelCamoTexture(primaryHex, secondaryHex, accentHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 32, 32);

  // Pixel camo blocks
  ctx.fillStyle = secondaryHex;
  const blocks = [
    [0, 0, 10, 8], [14, 4, 12, 10], [4, 16, 14, 10], [20, 20, 12, 12],
    [22, 0, 8, 6], [0, 26, 8, 6]
  ];
  for (const [x, y, w, h] of blocks) {
    ctx.fillRect(x, y, w, h);
  }

  // Pixel panel lines & rivets
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 15, 32, 1);
  ctx.fillRect(15, 0, 1, 32);

  // Tactical Wing Stripe / Insignia pixels
  ctx.fillStyle = accentHex;
  ctx.fillRect(2, 2, 4, 2);
  ctx.fillRect(26, 2, 4, 2);
  ctx.fillRect(12, 28, 8, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createPixelTerrainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1f4d36';
  ctx.fillRect(0, 0, 64, 64);

  // Dithered pixel patches
  const palette = ['#286646', '#163827', '#357a54', '#4d5d53'];
  for (let y = 0; y < 64; y += 2) {
    for (let x = 0; x < 64; x += 2) {
      if ((x + y) % 4 === 0 || Math.random() < 0.35) {
        ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

// ============================================================================
// LOW-POLY 3D JET MESH BUILDER
// Aircraft local forward is -Z, up is +Y, right is +X
// ============================================================================
function createJetMesh(options = {}) {
  const primary = options.primary || '#627d98';
  const secondary = options.secondary || '#334e68';
  const accent = options.accent || '#2cf0ff';
  const canopyColor = options.canopy || '#ffd166';
  const burnerColor = options.burner || '#ff7b00';
  const wingStyle = options.wingStyle || 'swept';
  const scale = options.scale || 1.0;

  const group = new THREE.Group();
  const camoTex = createPixelCamoTexture(primary, secondary, accent);

  const bodyMat = new THREE.MeshLambertMaterial({
    map: camoTex,
    flatShading: true
  });
  const darkMat = new THREE.MeshLambertMaterial({
    color: secondary,
    flatShading: true
  });
  const accentMat = new THREE.MeshBasicMaterial({
    color: accent
  });
  const canopyMat = new THREE.MeshLambertMaterial({
    color: canopyColor,
    emissive: canopyColor,
    emissiveIntensity: 0.25,
    flatShading: true
  });

  // 1. Nose Cone (Points to -Z)
  const noseGeo = new THREE.ConeGeometry(0.95, 5.2, 4);
  noseGeo.rotateX(-Math.PI / 2);
  noseGeo.rotateZ(Math.PI / 4);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.position.set(0, 0, -6.2);
  group.add(nose);

  // 2. Main Fuselage Spine
  const fuseGeo = new THREE.BoxGeometry(1.75, 1.05, 7.6);
  const fuselage = new THREE.Mesh(fuseGeo, bodyMat);
  fuselage.position.set(0, 0, -0.5);
  group.add(fuselage);

  // Side Air Intakes
  const intakeGeo = new THREE.BoxGeometry(0.75, 0.75, 5.2);
  const leftIntake = new THREE.Mesh(intakeGeo, darkMat);
  leftIntake.position.set(-1.15, -0.1, -0.3);
  const rightIntake = new THREE.Mesh(intakeGeo, darkMat);
  rightIntake.position.set(1.15, -0.1, -0.3);
  group.add(leftIntake, rightIntake);

  // 3. Cockpit Canopy
  const canopyGeo = new THREE.BoxGeometry(0.95, 0.68, 3.1);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.65, -2.5);
  group.add(canopy);

  // 4. Main Wings (Custom Low-Poly BufferGeometry for authentic swept/forward/diamond silhouette)
  const wingShape = new THREE.Shape();
  if (wingStyle === 'forward') {
    // SU-47 Forward-Swept Wing + Canards
    wingShape.moveTo(0, -1.5);
    wingShape.lineTo(6.8, -3.2);
    wingShape.lineTo(7.1, -1.7);
    wingShape.lineTo(1.2, 2.5);
    wingShape.lineTo(0, 2.5);
  } else if (wingStyle === 'diamond') {
    // F-22 Raptor Diamond Delta Wing
    wingShape.moveTo(0, -2.6);
    wingShape.lineTo(6.6, 0.6);
    wingShape.lineTo(6.6, 1.9);
    wingShape.lineTo(1.2, 2.8);
    wingShape.lineTo(0, 2.8);
  } else {
    // F-15 / Su-33 Classic Swept Wing
    wingShape.moveTo(0, -2.2);
    wingShape.lineTo(6.7, 0.9);
    wingShape.lineTo(6.7, 2.3);
    wingShape.lineTo(1.3, 2.5);
    wingShape.lineTo(0, 2.5);
  }

  const extrudeSettings = { depth: 0.18, bevelEnabled: false };
  const rightWingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  rightWingGeo.rotateX(Math.PI / 2);

  const rightWing = new THREE.Mesh(rightWingGeo, bodyMat);
  rightWing.position.set(0.6, 0.08, 0.1);
  group.add(rightWing);

  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  leftWing.position.x = -0.6;
  group.add(leftWing);

  // Wingtip Accent Strips / Missiles on Rails
  const tipGeo = new THREE.BoxGeometry(0.22, 0.22, 2.2);
  const leftTip = new THREE.Mesh(tipGeo, accentMat);
  leftTip.position.set(-7.15, 0.0, wingStyle === 'forward' ? -2.2 : 1.4);
  const rightTip = new THREE.Mesh(tipGeo, accentMat);
  rightTip.position.set(7.15, 0.0, wingStyle === 'forward' ? -2.2 : 1.4);
  group.add(leftTip, rightTip);

  // Canards for forward-swept / experimental jets
  if (wingStyle === 'forward') {
    const canardGeo = new THREE.BoxGeometry(4.8, 0.14, 1.1);
    const canard = new THREE.Mesh(canardGeo, darkMat);
    canard.position.set(0, 0.15, -3.2);
    group.add(canard);
  }

  // 5. Twin Vertical Tail Stabilizers
  const tailFinGeo = new THREE.BoxGeometry(0.2, 2.1, 2.2);
  const leftFin = new THREE.Mesh(tailFinGeo, darkMat);
  leftFin.position.set(-0.95, 1.05, 2.4);
  leftFin.rotation.z = 0.22;

  const rightFin = new THREE.Mesh(tailFinGeo, darkMat);
  rightFin.position.set(0.95, 1.05, 2.4);
  rightFin.rotation.z = -0.22;
  group.add(leftFin, rightFin);

  // Horizontal Elevators
  const elevGeo = new THREE.BoxGeometry(4.8, 0.15, 1.5);
  const elevator = new THREE.Mesh(elevGeo, darkMat);
  elevator.position.set(0, 0.0, 2.9);
  group.add(elevator);

  // 6. Twin Afterburner Nozzles & Glowing Cones
  const nozzleGeo = new THREE.CylinderGeometry(0.38, 0.46, 1.2, 6);
  nozzleGeo.rotateX(Math.PI / 2);
  const leftNozzle = new THREE.Mesh(nozzleGeo, darkMat);
  leftNozzle.position.set(-0.52, 0, 3.6);
  const rightNozzle = new THREE.Mesh(nozzleGeo, darkMat);
  rightNozzle.position.set(0.52, 0, 3.6);
  group.add(leftNozzle, rightNozzle);

  const flameMat = new THREE.MeshBasicMaterial({
    color: burnerColor,
    transparent: true,
    opacity: 0.9
  });
  const flameGeo = new THREE.ConeGeometry(0.36, 2.6, 6);
  flameGeo.rotateX(Math.PI / 2);
  const leftFlame = new THREE.Mesh(flameGeo, flameMat);
  leftFlame.position.set(-0.52, 0, 4.9);
  const rightFlame = new THREE.Mesh(flameGeo, flameMat);
  rightFlame.position.set(0.52, 0, 4.9);
  group.add(leftFlame, rightFlame);

  group.userData.flames = [leftFlame, rightFlame];
  group.userData.wingtips = [
    new THREE.Vector3(-7.1, 0, wingStyle === 'forward' ? -1.8 : 1.8),
    new THREE.Vector3(7.1, 0, wingStyle === 'forward' ? -1.8 : 1.8)
  ];

  group.scale.setScalar(scale);
  return group;
}

// ============================================================================
// ENEMY SURFACE TARGETS (Radar Warships & AA Frigates) & FLYING BOSS CRUISER
// ============================================================================
function createWarshipMesh() {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshLambertMaterial({ color: 0x3b4d5e, flatShading: true });
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x24323f, flatShading: true });
  const radarMat = new THREE.MeshBasicMaterial({ color: 0xff384c });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 42), hullMat);
  hull.position.y = 2.0;
  group.add(hull);

  const bowGeo = new THREE.ConeGeometry(7.2, 16, 4);
  bowGeo.rotateX(-Math.PI / 2);
  bowGeo.rotateZ(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeo, hullMat);
  bow.position.set(0, 2.0, -29);
  group.add(bow);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 12), deckMat);
  bridge.position.set(0, 8.5, -4);
  group.add(bridge);

  const mast = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2), radarMat);
  mast.position.set(0, 14, -4);
  group.add(mast);

  return group;
}

function createAerialBossMesh() {
  // Huge Ace Combat style Aerial Command Cruiser ("ARKBIRD / AIGIS")
  const group = new THREE.Group();
  const camoTex = createPixelCamoTexture('#262936', '#161822', '#ff384c');
  const hullMat = new THREE.MeshLambertMaterial({ map: camoTex, flatShading: true });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff384c });
  const engineMat = new THREE.MeshBasicMaterial({ color: 0x2cf0ff });

  // Central delta hull
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 44), hullMat);
  group.add(mainBody);

  // Giant wingspan
  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(82, 2.2, 18), hullMat);
  mainWing.position.set(0, 0.5, 4);
  group.add(mainWing);

  // Forward command prow
  const prowGeo = new THREE.ConeGeometry(8, 22, 4);
  prowGeo.rotateX(-Math.PI / 2);
  prowGeo.rotateZ(Math.PI / 4);
  const prow = new THREE.Mesh(prowGeo, hullMat);
  prow.position.set(0, 0, -33);
  group.add(prow);

  // Glowing reactor cores on top
  for (const xOff of [-22, 0, 22]) {
    const core = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 8), coreMat);
    core.position.set(xOff, 2.8, 2);
    group.add(core);

    const thruster = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 4), engineMat);
    thruster.position.set(xOff, 0, 23);
    group.add(thruster);
  }

  return group;
}

// ============================================================================
// PROCEDURAL ISLAND ARCHIPELAGO & OCEAN GRID
// ============================================================================
function buildWorldEnvironment(scene, mission) {
  const envGroup = new THREE.Group();

  // 1. Tactical Ocean Plane with Grid Overlay
  const seaGeo = new THREE.PlaneGeometry(24000, 24000, 1, 1);
  seaGeo.rotateX(-Math.PI / 2);
  const seaMat = new THREE.MeshLambertMaterial({
    color: mission.seaColor
  });
  const seaMesh = new THREE.Mesh(seaGeo, seaMat);
  seaMesh.position.y = 0;
  envGroup.add(seaMesh);

  // Tactical retro grid lines on ocean surface
  const gridHelper = new THREE.GridHelper(16000, 80, 0x1a5b78, 0x0f354a);
  gridHelper.position.y = 1.5;
  envGroup.add(gridHelper);

  // 2. Low-Poly Pixel-Textured Islands & Mountain Peaks
  const terrainTex = createPixelTerrainTexture();
  const islandMat = new THREE.MeshLambertMaterial({
    map: terrainTex,
    flatShading: true
  });
  const sandMat = new THREE.MeshLambertMaterial({
    color: 0xb89f65,
    flatShading: true
  });
  const snowMat = new THREE.MeshLambertMaterial({
    color: 0xd9e8f5,
    flatShading: true
  });

  const islandSeeds = [
    { x: 0, z: -1200, r: 420, h: 240 },
    { x: -1500, z: -600, r: 550, h: 360 },
    { x: 1650, z: -900, r: 480, h: 290 },
    { x: -900, z: 1400, r: 510, h: 310 },
    { x: 1300, z: 1500, r: 620, h: 420 },
    { x: -2400, z: -2200, r: 720, h: 490 },
    { x: 2500, z: -2400, r: 680, h: 440 },
    { x: 300, z: -3200, r: 780, h: 520 },
    { x: -2800, z: 900, r: 520, h: 300 },
    { x: 2900, z: 400, r: 540, h: 340 }
  ];

  const islandColliders = [];

  for (const isl of islandSeeds) {
    // Beach base
    const baseGeo = new THREE.CylinderGeometry(isl.r * 0.85, isl.r, 18, 7);
    const baseMesh = new THREE.Mesh(baseGeo, sandMat);
    baseMesh.position.set(isl.x, 9, isl.z);
    envGroup.add(baseMesh);

    // Main low-poly mountain cone
    const mtnGeo = new THREE.ConeGeometry(isl.r * 0.82, isl.h, 7);
    const mtnMesh = new THREE.Mesh(mtnGeo, islandMat);
    mtnMesh.position.set(isl.x, isl.h * 0.5 + 10, isl.z);
    envGroup.add(mtnMesh);

    // Secondary ridge peak
    const subGeo = new THREE.ConeGeometry(isl.r * 0.48, isl.h * 0.68, 6);
    const subMesh = new THREE.Mesh(subGeo, islandMat);
    subMesh.position.set(isl.x + isl.r * 0.35, isl.h * 0.34 + 8, isl.z - isl.r * 0.2);
    envGroup.add(subMesh);

    if (isl.h > 350) {
      const capGeo = new THREE.ConeGeometry(isl.r * 0.26, isl.h * 0.32, 7);
      const capMesh = new THREE.Mesh(capGeo, snowMat);
      capMesh.position.set(isl.x, isl.h * 0.85 + 11, isl.z);
      envGroup.add(capMesh);
    }

    islandColliders.push(isl);
  }

  // 3. Low-Poly Retro Volumetric Cloud Clusters at High Altitude
  const cloudMat = new THREE.MeshLambertMaterial({
    color: mission.id === 'm2' ? 0xffb48a : (mission.id === 'm3' ? 0x1c3545 : 0xeef8ff),
    transparent: true,
    opacity: 0.72,
    flatShading: true
  });

  for (let i = 0; i < 42; i++) {
    const cGroup = new THREE.Group();
    const puffs = 2 + (i % 3);
    for (let p = 0; p < puffs; p++) {
      const puffGeo = new THREE.BoxGeometry(
        90 + Math.random() * 80,
        24 + Math.random() * 20,
        70 + Math.random() * 60
      );
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(p * 45 - 40, (p % 2) * 10, (p % 2) * 25);
      cGroup.add(puff);
    }
    const angle = (i / 42) * Math.PI * 2;
    const dist = 600 + (i % 7) * 520;
    cGroup.position.set(
      Math.cos(angle) * dist,
      480 + (i % 5) * 140,
      Math.sin(angle) * dist
    );
    envGroup.add(cGroup);
  }

  scene.add(envGroup);
  return { envGroup, islandColliders };
}

// ============================================================================
// PIXEL ART COMMS PORTRAIT RENDERER (48x48 Canvas)
// ============================================================================
function drawCommsPortrait(canvas, type = 'awacs') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 48, 48);

  // Background scan grid
  ctx.fillStyle = type === 'enemy' ? '#24080e' : '#061c24';
  ctx.fillRect(0, 0, 48, 48);

  ctx.fillStyle = type === 'enemy' ? '#ff384c' : (type === 'wingman' ? '#2cff7e' : '#2cf0ff');

  if (type === 'awacs') {
    // Radar dish + waveform icon
    ctx.strokeStyle = '#2cf0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillRect(23, 8, 2, 32);
    ctx.fillRect(8, 23, 32, 2);
    ctx.fillStyle = '#2cff7e';
    ctx.fillRect(28, 14, 4, 4);
    ctx.fillRect(14, 28, 3, 3);
  } else {
    // Pixel Pilot Helmet Silhouette
    ctx.fillStyle = type === 'enemy' ? '#5e1420' : '#1b4353';
    ctx.fillRect(12, 8, 24, 26);
    ctx.fillRect(10, 14, 28, 16);

    // Visor (Glowing)
    ctx.fillStyle = type === 'enemy' ? '#ff384c' : '#ffd166';
    ctx.fillRect(14, 15, 20, 9);

    // Visor reflection pixel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 17, 5, 2);

    // Oxygen mask
    ctx.fillStyle = '#263238';
    ctx.fillRect(17, 25, 14, 11);
    ctx.fillRect(21, 36, 6, 8);
  }
}

window.AIRCRAFT_DB = AIRCRAFT_DB;
window.SPW_DB = SPW_DB;
window.MISSION_DB = MISSION_DB;
window.createJetMesh = createJetMesh;
window.createWarshipMesh = createWarshipMesh;
window.createAerialBossMesh = createAerialBossMesh;
window.buildWorldEnvironment = buildWorldEnvironment;
window.drawCommsPortrait = drawCommsPortrait;
