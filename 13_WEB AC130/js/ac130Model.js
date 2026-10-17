// =====================================================================
//  LOCKHEED AC-130U SPOOKY — 3D Model Loader & ExplodeView Rigging
//  Source Model: ./lockheed_ac-130u_spooky.glb
//  Standardized Coordinate System (1 unit = 1 meter):
//    +X = Forward (Nose)   | -X = Aft (Tail)
//    +Y = Up (Dorsal)      | -Y = Down (Ventral)
//    +Z = Starboard (Right)| -Z = Port (Left — Weapon Firing Side!)
// =====================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Standardization matrix from un-rolled GLB world space (X_glb, Y_glb, Z_glb)
// to aircraft root space (X = Z_glb, Y = Y_glb - 2.60, Z = -X_glb)
const M_STD = new THREE.Matrix4().set(
   0, 0, 1,  0,
   0, 1, 0, -2.60,
  -1, 0, 0,  0,
   0, 0, 0,  1
);

// Extract a subset of triangles from a BufferGeometry while preserving normals and UVs
function extractSubGeometry(srcGeo, triList) {
  const indexAttr = srcGeo.index;
  const posAttr = srcGeo.attributes.position;
  const normAttr = srcGeo.attributes.normal;
  const uvAttr = srcGeo.attributes.uv;

  const newIndices = [];
  const oldToNew = new Map();
  const newPos = [];
  const newNorm = [];
  const newUv = [];

  const getVertex = (oldIdx) => {
    if (oldToNew.has(oldIdx)) return oldToNew.get(oldIdx);
    const newIdx = oldToNew.size;
    oldToNew.set(oldIdx, newIdx);
    newPos.push(posAttr.getX(oldIdx), posAttr.getY(oldIdx), posAttr.getZ(oldIdx));
    if (normAttr) {
      newNorm.push(normAttr.getX(oldIdx), normAttr.getY(oldIdx), normAttr.getZ(oldIdx));
    }
    if (uvAttr) {
      newUv.push(uvAttr.getX(oldIdx), uvAttr.getY(oldIdx));
    }
    return newIdx;
  };

  for (let i = 0; i < triList.length; i++) {
    const t = triList[i];
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;
    newIndices.push(getVertex(i0), getVertex(i1), getVertex(i2));
  }

  const subGeo = new THREE.BufferGeometry();
  subGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3));
  if (normAttr) subGeo.setAttribute('normal', new THREE.Float32BufferAttribute(newNorm, 3));
  if (uvAttr) subGeo.setAttribute('uv', new THREE.Float32BufferAttribute(newUv, 2));
  subGeo.setIndex(newIndices);
  return subGeo;
}

// Segment the `Hull` mesh into anatomical aircraft sub-assemblies using
// connected-component topology + triangle centroid classification.
// At explode = 0, every vertex remains at its exact original GLB coordinate!
function segmentHullGeometry(hullGeo) {
  const posAttr = hullGeo.attributes.position;
  const indexAttr = hullGeo.index;
  const vCount = posAttr.count;
  const triCount = indexAttr ? indexAttr.count / 3 : vCount / 3;

  // 1. Weld coincident vertices (1mm tolerance) to find connected components
  const pts = new Array(vCount);
  const keyMap = new Map();
  const vToCanon = new Int32Array(vCount);

  for (let i = 0; i < vCount; i++) {
    const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    pts[i] = v;
    const k = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let canon = keyMap.get(k);
    if (canon === undefined) {
      canon = i;
      keyMap.set(k, canon);
    }
    vToCanon[i] = canon;
  }

  const parent = new Int32Array(vCount);
  for (let i = 0; i < vCount; i++) parent[i] = i;
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[a] = b;
  };

  for (let t = 0; t < triCount; t++) {
    const i0 = vToCanon[indexAttr ? indexAttr.getX(t * 3) : t * 3];
    const i1 = vToCanon[indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1];
    const i2 = vToCanon[indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2];
    union(i0, i1);
    union(i1, i2);
  }

  const comps = new Map();
  for (let t = 0; t < triCount; t++) {
    const raw0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const raw1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const raw2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;
    const r = find(vToCanon[raw0]);
    let comp = comps.get(r);
    if (!comp) {
      comp = { tris: [], box: new THREE.Box3() };
      comps.set(r, comp);
    }
    comp.tris.push(t);
    comp.box.expandByPoint(pts[raw0]);
    comp.box.expandByPoint(pts[raw1]);
    comp.box.expandByPoint(pts[raw2]);
  }

  // Find the primary outer fuselage/wing skin component (largest triangle count)
  let mainRoot = -1;
  let maxTris = -1;
  for (const [r, comp] of comps.entries()) {
    if (comp.tris.length > maxTris) {
      maxTris = comp.tris.length;
      mainRoot = r;
    }
  }

  const buckets = {};
  const addBucket = (key, t) => {
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(t);
  };

  const c = new THREE.Vector3();
  for (const [r, comp] of comps.entries()) {
    comp.box.getCenter(c);
    const nTris = comp.tris.length;

    if (r !== mainRoot) {
      // 4× Allison T56 Turboprop Engine Nacelles (295 tris each)
      if (nTris >= 200 && Math.abs(c.z) > 3.5) {
        const ek = c.z < -7.5 ? 'eng1' : c.z < -2.5 ? 'eng2' : c.z < 7.5 ? 'eng3' : 'eng4';
        comp.tris.forEach(t => addBucket(ek, t));
        continue;
      }
      // Underwing External Pylons / Tanks
      if (Math.abs(c.z) > 12.0) {
        comp.tris.forEach(t => addBucket(c.z < 0 ? 'pylonL' : 'pylonR', t));
        continue;
      }
      // Flap Canoe Fairings under Main Wings
      if (Math.abs(c.z) > 3.5 && c.y > 0.5) {
        comp.tris.forEach(t => addBucket(c.z < 0 ? 'wingL' : 'wingR', t));
        continue;
      }
      // Vertical Stabilizer Dorsal Fin & Cap
      if (c.x < -6.0 && c.y > 2.0 && Math.abs(c.z) < 0.8) {
        comp.tris.forEach(t => addBucket('vstab', t));
        continue;
      }
      // Nose Chin EO/IR AN/AAQ-38 FLIR Turret
      if (c.x > 6.5 && c.y < -1.05 && c.z < -0.3) {
        comp.tris.forEach(t => addBucket('sensorNose', t));
        continue;
      }
      // Sponson EO/IR Sensor Turret & Starboard Sensor Pod
      if ((c.x > 1.0 && c.x < 3.2 && c.y < -1.1 && c.z < -1.5) || (c.x > 6.5 && c.z > 1.4)) {
        comp.tris.forEach(t => addBucket('sensorSide', t));
        continue;
      }
      // Internal 105mm M102 Gun Mount & Blast Deflector
      if (c.x > -7.0 && c.x < -5.0 && c.z < -1.5 && nTris >= 15) {
        comp.tris.forEach(t => addBucket('gun105Mount', t));
        continue;
      }
      // Internal GAU-12 25mm Gun Mount & Deflector
      if (c.x > 3.0 && c.x < 5.2 && c.z < -1.2 && nTris >= 15) {
        comp.tris.forEach(t => addBucket('gun30Mount', t));
        continue;
      }
      // Internal Structural Bulkhead Frames & Flight Deck Seats
      if (
        Math.abs(c.z) < 1.6 &&
        c.x > -7.0 &&
        c.x < 9.5 &&
        ((c.x < 6.8 && comp.box.max.y - comp.box.min.y > 2.5) ||
          (c.x > 8.0 && c.y > 0.1 && c.y < 1.7 && Math.abs(c.z) < 0.9))
      ) {
        comp.tris.forEach(t => addBucket('bmc', t));
        continue;
      }
    }

    // Classify remaining triangles by centroid in standardized aircraft coordinates
    for (let i = 0; i < comp.tris.length; i++) {
      const t = comp.tris[i];
      const v0 = pts[indexAttr ? indexAttr.getX(t * 3) : t * 3];
      const v1 = pts[indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1];
      const v2 = pts[indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2];
      const cx = (v0.x + v1.x + v2.x) / 3;
      const cy = (v0.y + v1.y + v2.y) / 3;
      const cz = (v0.z + v1.z + v2.z) / 3;

      if (cx < -13.2 && Math.abs(cz) > 0.72 && cy > 0.9) {
        addBucket(cz < 0 ? 'hstabL' : 'hstabR', t);
      } else if (cx < -6.2 && cy > 2.15 && Math.abs(cz) < 0.72) {
        addBucket('vstab', t);
      } else if (Math.abs(cz) > 2.18 && cy > 0.65 && cx > -6.5 && cx < 4.5) {
        addBucket(cz < 0 ? 'wingL' : 'wingR', t);
      } else if (cx > 5.6) {
        addBucket('nose', t);
      } else if (cx < -7.2 && cy < -0.15 && Math.abs(cz) < 1.65) {
        addBucket('clt', t);
      } else if (cx < -7.2) {
        addBucket('tail', t);
      } else if (cy > 0.25) {
        addBucket('upper', t);
      } else {
        addBucket('lower', t);
      }
    }
  }

  return buckets;
}

// Supplemental interior Battle Management Center (BMC) consoles & ammo racks
// inside the fuselage so Cutaway & ExplodeView show the tactical mission deck
function buildSupplementalInterior() {
  const g = new THREE.Group();
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x2c3137, metalness: 0.35, roughness: 0.75 });
  const matConsole = new THREE.MeshStandardMaterial({ color: 0x1d2126, metalness: 0.5, roughness: 0.45 });
  const matSeat = new THREE.MeshStandardMaterial({ color: 0x2b3440, metalness: 0.2, roughness: 0.85 });
  const matBrass = new THREE.MeshStandardMaterial({ color: 0xc49a38, metalness: 0.85, roughness: 0.28 });
  const matOlive = new THREE.MeshStandardMaterial({ color: 0x4b5338, metalness: 0.35, roughness: 0.58 });
  const matScreenG = new THREE.MeshStandardMaterial({ color: 0x062814, emissive: 0x10ff68, emissiveIntensity: 0.95 });
  const matScreenC = new THREE.MeshStandardMaterial({ color: 0x05222e, emissive: 0x00e5ff, emissiveIntensity: 0.95 });
  const matScreenA = new THREE.MeshStandardMaterial({ color: 0x2b1904, emissive: 0xf59e0b, emissiveIntensity: 0.95 });

  // Reinforced Cargo Floor Deck
  const floor = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.12, 2.7), matFloor);
  floor.position.set(-0.8, -1.35, 0);
  g.add(floor);

  // 4× Battle Management Center (BMC) Operator Stations (Starboard Side +Z)
  const screens = [matScreenG, matScreenC, matScreenA, matScreenG];
  [-2.6, -1.0, 0.6, 2.2].forEach((x, idx) => {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.65), matConsole);
    desk.position.set(x, -0.92, 0.92);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.58, 0.45), matConsole);
    hood.position.set(x, -0.35, 1.02);
    const scr1 = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), screens[idx]);
    scr1.position.set(x - 0.24, -0.34, 0.78);
    scr1.rotation.y = Math.PI;
    const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), screens[(idx + 1) % 4]);
    scr2.position.set(x + 0.24, -0.34, 0.78);
    scr2.rotation.y = Math.PI;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.75, 0.46), matSeat);
    seat.position.set(x, -0.88, 0.22);
    g.add(desk, hood, scr1, scr2, seat);
  });

  // 105mm Ready-Service Ammunition Rack (24 Brass/Olive HE Rounds)
  const rack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.95, 0.85), matConsole);
  rack.position.set(-4.6, -0.82, 0.65);
  g.add(rack);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.55, 8), matBrass);
      casing.position.set(-5.45 + c * 0.32, -0.58 - r * 0.22, 0.65);
      casing.rotation.z = Math.PI / 2;
      const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.22, 8), matOlive);
      warhead.position.set(-5.45 + c * 0.32, -0.58 - r * 0.22, 0.32);
      warhead.rotation.x = -Math.PI / 2;
      g.add(casing, warhead);
    }
  }

  return g;
}

export function createAC130Model(onLoaded) {
  const root = new THREE.Group();
  root.name = 'AC130_Spooky_Root';

  // 1. Create Part Container Groups synchronously so UI chips & ExplodeView bind immediately
  const nose = new THREE.Group();
  const upper = new THREE.Group();
  const lower = new THREE.Group();
  const interior = buildSupplementalInterior();
  const tail = new THREE.Group();
  const vstab = new THREE.Group();
  const hsL = new THREE.Group();
  const hsR = new THREE.Group();
  const wingL = new THREE.Group();
  const wingR = new THREE.Group();
  const engines = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
  const propGroups = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
  const props = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
  const discs = [];

  // Default propeller hub coordinates in standardized aircraft space
  const defaultPropCenters = [
    new THREE.Vector3(2.73, 1.57, -10.20), // Prop #1 (Outer Port)
    new THREE.Vector3(2.72, 1.26, -5.02),  // Prop #2 (Inner Port)
    new THREE.Vector3(2.72, 1.26,  4.88),  // Prop #3 (Inner Starboard)
    new THREE.Vector3(2.72, 1.55, 10.07),  // Prop #4 (Outer Starboard)
  ];
  for (let i = 0; i < 4; i++) {
    props[i].position.copy(defaultPropCenters[i]);
    propGroups[i].add(props[i]);
  }

  // Landing Gear Groups (Main Left, Main Right, Nose Gear)
  const gearL = new THREE.Group();
  const gearR = new THREE.Group();
  const noseGear = new THREE.Group();
  nose.add(noseGear);

  // Port-Side Weapon Groups & 2-Axis Gimbal Mounts (YXZ Euler order)
  const gun30Group = new THREE.Group();
  const gun105Group = new THREE.Group();

  // 25mm GAU-12/U Equalizer (Forward Port Station)
  const inner30 = new THREE.Group();
  inner30.rotation.order = 'YXZ';
  inner30.position.set(4.042, -0.953, -1.603);
  const recoil30 = new THREE.Group();
  const muzzle30 = new THREE.Object3D();
  muzzle30.position.set(0, 0, -1.51);
  recoil30.add(muzzle30);
  inner30.add(recoil30);
  gun30Group.add(inner30);

  // 40mm L/60 Bofors Cannon (Mid-Aft Port Station)
  const bofors40 = new THREE.Group();
  bofors40.rotation.order = 'YXZ';
  bofors40.position.set(-4.164, -1.142, -1.801);
  const recoil40 = new THREE.Group();
  const muzzle40 = new THREE.Object3D();
  muzzle40.position.set(0, 0, -1.84);
  recoil40.add(muzzle40);
  bofors40.add(recoil40);
  gun30Group.add(bofors40);

  // 105mm M102 Howitzer (Aft Port Station)
  const inner105 = new THREE.Group();
  inner105.rotation.order = 'YXZ';
  inner105.position.set(-5.873, -0.852, -2.280);
  const recoil105 = new THREE.Group();
  const muzzle105 = new THREE.Object3D();
  muzzle105.position.set(0, 0, -2.35);
  recoil105.add(muzzle105);
  inner105.add(recoil105);
  gun105Group.add(inner105);

  // EO/IR Sensor Groups & Laser Designator Origin Marker
  const sensorNose = new THREE.Group();
  const sensorSide = new THREE.Group();
  const sensorMarker = new THREE.Object3D();
  sensorMarker.position.set(8.40, -2.18, -1.00);
  sensorNose.add(sensorMarker);

  // Underwing Pylons & Rear Ramp CLT
  const pylons = [new THREE.Group(), new THREE.Group()];
  const clt = new THREE.Group();

  // Register 16 ExplodeView Parts
  const parts = [];
  const leaderLines = [];
  const addPart = (meta, pairs) => {
    const items = pairs.map(([obj, off]) => {
      root.add(obj);
      obj.userData.partId = meta.id;
      return {
        obj,
        basePos: obj.position.clone(),
        offset: new THREE.Vector3(...off),
        centerLocal: new THREE.Vector3(),
      };
    });
    parts.push({ ...meta, items });
  };

  const engZ = [-10.20, -5.02, 4.88, 10.07];

  addPart({
    id: 'nose', name: 'Radome AN/APQ-180 & Kokpit Flight Deck', cat: 'Avionik & Struktur',
    desc: 'Hidung pesawat Lockheed AC-130U Spooky dengan kubah radar AN/APQ-180 multi-mode (terrain-following & ground target tracking) serta dek penerbangan kaca berlapis baja.',
    facts: [['Model 3D', 'Lockheed AC-130U Spooky'], ['Radar Utama', 'AN/APQ-180 Synthetic Aperture'], ['Kaca Kokpit', 'Armored Ballistic Glass']],
  }, [[nose, [9.5, 0.5, 0]]]);

  addPart({
    id: 'upper', name: 'Mahkota Fuselage Atas & Wing Box', cat: 'Struktur Utama',
    desc: 'Kulit lambung bagian atas bertekanan dengan struktur penyangga sayap utama (center wing box) dan susunan antena komunikasi satelit SATCOM.',
    facts: [['Konstruksi', 'Semi-Monocoque Al-Alloy'], ['Komunikasi', 'UHF/VHF & Dual SATCOM'], ['Mode Cutaway', 'Dapat Dibuka untuk Inspeksi Kabin']],
  }, [[upper, [0, 7.5, 0]]]);

  addPart({
    id: 'lower', name: 'Fuselage Bawah, Sponson & Port Senjata', cat: 'Struktur Utama',
    desc: 'Lambung bawah AC-130U Spooky yang diperkuat dengan pelindung balistik Kevlar, sponson roda pendarat, serta tiga bukaan port meriam di sisi kiri (port side).',
    facts: [['Sisi Senjata', 'Lambung Kiri (Port Side)'], ['Pelindung', 'Kevlar & Baja Balistik'], ['Deflektor', 'Spoiler Aliran Udara Port']],
  }, [[lower, [0, -2.2, 0]]]);

  addPart({
    id: 'bmc', name: 'Battle Management Center (BMC) & Interior', cat: 'Sistem Misi',
    desc: 'Rangka struktural kabin, kursi kru dek penerbangan, konsol kendali penembakan terkomputerisasi (Fire Control Officer, WSO, Sensor Operator), serta rak amunisi meriam.',
    facts: [['Awak Misi', '13 Personel (AC-130U Spooky)'], ['Konsol', '4 Stasiun Multi-Layar HD'], ['Kapasitas 105mm', '± 90–100 Proyektil Siap Tembak']],
  }, [[interior, [0, 3.8, 6.5]]]);

  addPart({
    id: 'tail', name: 'Ekor Upswept & Turret Penangkal Rudal DIRCM', cat: 'Struktur & Pertahanan',
    desc: 'Bagian ekor menanjak khas C-130 Hercules yang dilengkapi sepasang kubah sistem penangkal rudal inframerah AN/AAQ-24 Nemesis DIRCM di sisi kiri dan kanan ekor.',
    facts: [['Proteksi Rudal', '2× AN/AAQ-24 Nemesis DIRCM'], ['Desain Ekor', 'Upswept Beaver Tail'], ['Countermeasure', 'AN/ALE-47 Flare/Chaff']],
  }, [[tail, [-8.5, 0, 0]]]);

  addPart({
    id: 'vstab', name: 'Stabilizer Vertikal & Bidang Kemudi Rudder', cat: 'Aerodinamika',
    desc: 'Sirip tegak raksasa setinggi 11,7 meter dari permukaan tanah beserta bidang kemudi Rudder terpisah untuk menjaga stabilitas yaw saat manuver orbit Pylon Turn.',
    facts: [['Tinggi Puncak', '11,73 meter (38 ft 6 in)'], ['Mesh Terpisah', 'Fin + Rudder Hidraulik'], ['Fungsi', 'Kendali Yaw & Trim Tembak']],
  }, [[vstab, [-11.5, 7.5, 0]]]);

  addPart({
    id: 'hstab', name: 'Stabilizer Horizontal & Elevator Kiri/Kanan', cat: 'Aerodinamika',
    desc: 'Sayap ekor horizontal berbentang 16 meter lengkap dengan bidang kemudi `elevator_l` dan `elevator_r` terpisah untuk mengatur sudut angguk (pitch) selama orbit tembak.',
    facts: [['Rentang Ekor', '16,05 meter'], ['Mesh Terpisah', 'Stabilizer + Elevator L/R'], ['Fungsi', 'Stabilitas Longitudinal']],
  }, [[hsL, [-12.5, 2.0, -5.0]], [hsR, [-12.5, 2.0, 5.0]]]);

  addPart({
    id: 'wings', name: 'Sayap Utama High-Wing, Flap & Aileron', cat: 'Aerodinamika & Bahan Bakar',
    desc: 'Sayap tinggi cantilever berbentang 40,4 meter lengkap dengan bidang kendali `aileron_l/r`, `flap_l/r`, dan `flap_l2/r2` serta fairing mekanisme flap di bawah sayap.',
    facts: [['Rentang Sayap', '40,41 meter (132 ft 7 in)'], ['Bidang Kendali', 'Aileron L/R + Inboard/Outboard Flaps'], ['Luas Sayap', '162,1 m²']],
  }, [[wingL, [0, 8.5, -8.5]], [wingR, [0, 8.5, 8.5]]]);

  addPart({
    id: 'engines', name: '4× Nacelle Mesin Turboprop Allison T56-A-15', cat: 'Propulsi',
    desc: 'Empat rumah mesin (nacelle) turboprop Allison T56-A-15 dengan air intake scoop bawah yang menghasilkan daya gabungan lebih dari 19.600 equivalent shaft horsepower.',
    facts: [['Mesin', '4× Allison T56-A-15 Turboprop'], ['Tenaga', '4.910 eshp per mesin'], ['Posisi', '4 Nacelle Sayap Utama']],
  }, engines.map((e, i) => [e, [2.5, 4.5, Math.sign(engZ[i]) * 8.5]]));

  addPart({
    id: 'props', name: '4× Baling-Baling Hamilton Standard (`prop_1`–`prop_4`)', cat: 'Propulsi',
    desc: 'Empat unit rotor baling-baling (`prop_1`, `prop_2`, `prop_3`, `prop_4`) berdiameter 4,1 meter lengkap dengan efek piringan putar (`prop_roll`) yang berputar aktif pada poros mesin.',
    facts: [['Diameter Rotor', '4,11 meter (13,5 ft)'], ['Node GLB', 'prop_1, prop_2, prop_3, prop_4 + prop_roll'], ['Fitur', 'Constant-Speed Reversible Pitch']],
  }, propGroups.map((p, i) => [p, [9.5, 4.5, Math.sign(engZ[i]) * 8.5]]));

  addPart({
    id: 'gear', name: 'Roda Pendarat Tandem & Pintu Bay (`gear_l/r/nose`)', cat: 'Struktur & Pendaratan',
    desc: 'Roda pendarat utama tandem kiri/kanan (`gear_l`, `gear_r`) dan roda hidung (`gear_nose`) beserta 6 pintu ruang roda yang otomatis terbuka di hanggar dan menutup rapat saat Pylon Turn.',
    facts: [['Node GLB', 'gear_nose, gear_l, gear_r + 6 Doors'], ['Mekanisme', 'Retractable (Terbuka di Hanggar / Masuk saat Terbang)'], ['Kemampuan', 'Operasi Landasan Taktis']],
  }, [[gearL, [0, -5.0, -4.5]], [gearR, [0, -5.0, 4.5]]]);

  addPart({
    id: 'gun30', name: 'Meriam 25mm GAU-12 Equalizer & 40mm L/60 Bofors', cat: 'Persenjataan Sisi Kiri',
    desc: 'Dua sistem meriam otomatis di sisi kiri AC-130U Spooky: Gatling 5-laras 25mm GAU-12/U Equalizer (1.800–4.200 rpm) di depan dan meriam otomatis 40mm L/60 Bofors di belakang sayap.',
    facts: [['Meriam Depan', '25mm GAU-12/U 5-Barrel Gatling (`GAU-12`)'], ['Meriam Tengah', '40mm L/60 Bofors (`Bofors_40mm`)'], ['Gimbal', '2-Axis Dynamic Tracking Mount']],
  }, [[gun30Group, [0, -1.5, -9.5]]]);

  addPart({
    id: 'gun105', name: 'Howitzer Artileri Udara M102 105 mm (`105mm_M102`)', cat: 'Persenjataan Sisi Kiri',
    desc: 'Senjata artileri udara terberat di dunia pada AC-130U Spooky: Howitzer 105mm M102 (`105mm_M102`) dengan dudukan gimbal 2-sumbu dan sistem tolak balik (recoil) hidropneumatik.',
    facts: [['Node GLB', '105mm_M102'], ['Kaliber', '105 mm (Proyektil HE 14,9 kg)'], ['Laju Tembak', '6 – 10 peluru/menit']],
  }, [[gun105Group, [0, -1.5, -10.5]]]);

  addPart({
    id: 'sensors', name: 'Turret Sensor EO/IR AN/AAQ-26/38 & Pod Probe', cat: 'Sistem Misi & Sensor',
    desc: 'Bola gimbal sensor elektro-optik & inframerah (FLIR, kamera low-light TV, laser target designator & rangefinder) di bawah dagu hidung dan sponson depan kiri.',
    facts: [['Optik', 'Thermal FLIR + All-Light Level TV'], ['Laser', 'Target Designator & Rangefinder'], ['Cakupan', '360° Azimuth Continuous']],
  }, [[sensorNose, [9.5, -4.5, -4.0]], [sensorSide, [0, -4.5, -7.5]]]);

  addPart({
    id: 'pylons', name: 'Pylon Sayap Luar & Tangki Eksternal', cat: 'Bahan Bakar & Persenjataan',
    desc: 'Tiang gantungan (pylon) di bawah sayap luar untuk membawa tangki bahan bakar eksternal jarak jauh maupun pod peperangan elektronik AN/ALQ-172.',
    facts: [['Lokasi', 'Outboard Underwing Stations'], ['Fungsi', 'External Fuel / ECM Pods'], ['Loiter Time', '> 6 Jam di Atas Target']],
  }, [[pylons[0], [0, 5.0, -11.5]], [pylons[1], [0, 5.0, 11.5]]]);

  addPart({
    id: 'clt', name: 'Rampa Kargo Belakang & Bay Peluncur Bawah', cat: 'Struktur & Misi',
    desc: 'Pintu rampa kargo hidraulik bawah di bagian belakang lambung yang digunakan untuk pemuatan amunisi, observasi ekor, dan peluncuran munisi.',
    facts: [['Lokasi', 'Ventral Aft Cargo Ramp'], ['Operasi', 'Hidraulik Bertekanan'], ['Akses', 'Loading Amunisi 105mm & 40mm']],
  }, [[clt, [-11.5, -4.0, 0]]]);

  // Create 3D leader lines for ExplodeView
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });

  const recomputePartBounds = () => {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    parts.forEach(p => {
      box.setFromObject(p.items[0].obj);
      p.anchor = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());

      p.items.forEach(it => {
        const b = new THREE.Box3().setFromObject(it.obj);
        if (!b.isEmpty()) {
          it.centerLocal = b.getCenter(new THREE.Vector3()).sub(it.obj.position);
        }
        if (!it.leaderLine) {
          const pts = [new THREE.Vector3(), new THREE.Vector3()];
          const lGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.Line(lGeo, lineMat);
          line.frustumCulled = false;
          root.add(line);
          it.leaderLine = line;
          leaderLines.push(line);
        }
      });
    });
  };
  recomputePartBounds();

  // State controller to switch landing gear between Extended (Hangar) and Retracted (Pylon Turn Flight)
  const gearAnimNodes = {
    noseWheel: null,
    noseDoor1: null,
    noseDoor2: null,
    mainL: null,
    mainLDoor: null,
    mainLDoor2: null,
    mainR: null,
    mainRDoor: null,
    mainRDoor2: null,
  };

  const setGearExtended = (extended) => {
    modelData.isGearExtended = extended;
    if (gearAnimNodes.noseWheel) {
      // In raw GLB, gear_nose is retracted (-165.1°); rotating -62° around Z_std extends it flush to GROUND_Y (-2.60)
      gearAnimNodes.noseWheel.rotation.z = extended ? (-62 * Math.PI) / 180 : 0;
      gearAnimNodes.noseWheel.visible = extended;
    }
    if (gearAnimNodes.noseDoor1) {
      gearAnimNodes.noseDoor1.rotation.z = extended ? (-65 * Math.PI) / 180 : 0;
    }
    if (gearAnimNodes.noseDoor2) {
      gearAnimNodes.noseDoor2.rotation.z = extended ? (65 * Math.PI) / 180 : 0;
    }
    if (gearAnimNodes.mainL) {
      // Lower tandem main gear struts to -0.995m so tires touch GROUND_Y (-2.60) in hangar; retract into bay in flight
      gearAnimNodes.mainL.position.y = extended ? -0.995 : 0.25;
      gearAnimNodes.mainL.visible = extended;
    }
    if (gearAnimNodes.mainR) {
      gearAnimNodes.mainR.position.y = extended ? -0.991 : 0.25;
      gearAnimNodes.mainR.visible = extended;
    }
    if (gearAnimNodes.mainLDoor) {
      gearAnimNodes.mainLDoor.rotation.x = extended ? (-75 * Math.PI) / 180 : 0;
    }
    if (gearAnimNodes.mainLDoor2) {
      gearAnimNodes.mainLDoor2.rotation.x = extended ? (82 * Math.PI) / 180 : 0;
    }
    if (gearAnimNodes.mainRDoor) {
      gearAnimNodes.mainRDoor.rotation.x = extended ? (75 * Math.PI) / 180 : 0;
    }
    if (gearAnimNodes.mainRDoor2) {
      gearAnimNodes.mainRDoor2.rotation.x = extended ? (-82 * Math.PI) / 180 : 0;
    }
  };

  const modelData = {
    root,
    parts,
    props,
    discs,
    leaderLines,
    lineMat,
    gearGroups: [gearL, gearR, noseGear],
    gearAnimNodes,
    isGearExtended: true,
    setGearExtended,
    gunMounts: { gun30: inner30, gun40: bofors40, gun105: inner105 },
    recoilParts: { gun30: recoil30, gun40: recoil40, gun105: recoil105 },
    muzzles: { gun30: muzzle30, gun40: muzzle40, gun105: muzzle105 },
    sensorMarker,
  };

  // 2. Load `./lockheed_ac-130u_spooky.glb` and populate all part containers
  const loader = new GLTFLoader();
  loader.load(
    './lockheed_ac-130u_spooky.glb',
    (gltf) => {
      const scene = gltf.scene;

      // Remove the 27.2° Sketchfab preview bank angle baked into Node 0 (`Sketchfab_model`)
      const sketchfabModel = scene.children[0];
      if (sketchfabModel) {
        sketchfabModel.matrixAutoUpdate = true;
        sketchfabModel.position.set(0, 0, 0);
        sketchfabModel.rotation.set(-Math.PI / 2, 0, 0);
        sketchfabModel.scale.set(1, 1, 1);
      }
      scene.updateMatrixWorld(true);

      // Enhance materials while preserving original GLB textures
      const enhancedMats = new Map();
      const getEnhancedMaterial = (origMat, isGlass = false, isPropBlur = false) => {
        if (!origMat) return new THREE.MeshStandardMaterial({ color: 0x525962 });
        const key = `${origMat.uuid}_${isGlass}_${isPropBlur}`;
        if (enhancedMats.has(key)) return enhancedMats.get(key);

        const mat = origMat.clone();
        mat.side = THREE.DoubleSide;
        if (isGlass) {
          mat.color = new THREE.Color(0x0c2238);
          mat.metalness = 0.9;
          mat.roughness = 0.12;
          mat.transparent = true;
          mat.opacity = 0.52;
          mat.envMapIntensity = 1.5;
        } else if (isPropBlur) {
          mat.transparent = true;
          mat.depthWrite = false;
          mat.opacity = 0.32;
        } else {
          if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.metalness = 0.25;
          mat.roughness = 0.52;
          mat.envMapIntensity = 1.2;
        }
        enhancedMats.set(key, mat);
        return mat;
      };

      // Helper to convert a GLB mesh's geometry into standardized aircraft coordinates (M_STD * mesh.matrixWorld)
      const toStdGeometry = (meshObj) => {
        const geo = meshObj.geometry.clone();
        const matStd = M_STD.clone().multiply(meshObj.matrixWorld);
        geo.applyMatrix4(matStd);
        geo.computeVertexNormals();
        return geo;
      };

      const makeStdMesh = (geo, mat) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
      };

      // Map parent node names to their mesh child
      const namedMeshes = {};
      scene.traverse((obj) => {
        if (obj.isMesh && obj.parent) {
          namedMeshes[obj.parent.name] = obj;
        }
      });

      // A. Process `Hull` (mesh 0) by splitting into anatomical sub-meshes
      if (namedMeshes['Hull']) {
        const hullMesh = namedMeshes['Hull'];
        const hullGeoStd = toStdGeometry(hullMesh);
        const hullMat = getEnhancedMaterial(hullMesh.material);
        const buckets = segmentHullGeometry(hullGeoStd);

        const bucketTargets = {
          nose,
          upper,
          lower,
          bmc: interior,
          tail,
          vstab,
          hstabL: hsL,
          hstabR: hsR,
          wingL,
          wingR,
          eng1: engines[0],
          eng2: engines[1],
          eng3: engines[2],
          eng4: engines[3],
          sensorNose,
          sensorSide,
          pylonL: pylons[0],
          pylonR: pylons[1],
          clt,
          gun30Mount: gun30Group,
          gun105Mount: gun105Group,
        };

        for (const [bKey, triList] of Object.entries(buckets)) {
          const targetGroup = bucketTargets[bKey];
          if (targetGroup && triList && triList.length > 0) {
            const subGeo = extractSubGeometry(hullGeoStd, triList);
            targetGroup.add(makeStdMesh(subGeo, hullMat));
          }
        }

        // Update sensorMarker to exact center of the GLB's Nose Chin EO/IR Turret
        if (buckets.sensorNose && buckets.sensorNose.length > 0) {
          const sGeo = extractSubGeometry(hullGeoStd, buckets.sensorNose);
          sGeo.computeBoundingBox();
          sGeo.boundingBox.getCenter(sensorMarker.position);
        }
      }

      // B. Attach Cockpit Glass (`Glass`)
      if (namedMeshes['Glass']) {
        const gMesh = namedMeshes['Glass'];
        nose.add(makeStdMesh(toStdGeometry(gMesh), getEnhancedMaterial(gMesh.material, true, false)));
      }

      // C. Attach Control Surfaces (`Rudder`, `elevator_l/r`, `aileron_l/r`, `flap_l/r/l2/r2`)
      const attachSimple = (nodeName, targetGroup) => {
        const src = namedMeshes[nodeName];
        if (!src) return;
        targetGroup.add(makeStdMesh(toStdGeometry(src), getEnhancedMaterial(src.material)));
      };

      attachSimple('Rudder', vstab);
      attachSimple('elevator_l', hsL);
      attachSimple('elevator_r', hsR);
      attachSimple('aileron_l', wingL);
      attachSimple('flap_l', wingL);
      attachSimple('flap_l2', wingL);
      attachSimple('aileron_r', wingR);
      attachSimple('flap_r', wingR);
      attachSimple('flap_r2', wingR);

      // D. Rig the 4 Spinning Propellers (`prop_1`, `prop_2`, `prop_3`, `prop_4`) & Blur Discs (`prop_roll`)
      const propNames = ['prop_1', 'prop_2', 'prop_3', 'prop_4'];
      const propCenters = [];
      propNames.forEach((pName, idx) => {
        const src = namedMeshes[pName];
        if (!src) return;
        const matStd = M_STD.clone().multiply(src.matrixWorld);
        const center = new THREE.Vector3().setFromMatrixPosition(matStd);
        propCenters[idx] = center;

        const pGeo = toStdGeometry(src);
        // Center propeller vertices around exact node shaft pivot (0,0,0)
        pGeo.translate(-center.x, -center.y, -center.z);
        props[idx].position.copy(center);
        props[idx].add(makeStdMesh(pGeo, getEnhancedMaterial(src.material)));
      });

      // E. Rig the 3 Port-Side Weapons (`GAU-12`, `Bofors_40mm`, `105mm_M102`) on 2-Axis Gimbals
      const rigPortGun = (nodeName, mountGroup, recoilGroup, muzzleNode) => {
        const src = namedMeshes[nodeName];
        if (!src) return;
        const geo = toStdGeometry(src);
        const pos = geo.attributes.position;

        // Sort vertices from innermost (breech inside port fuselage) to outermost (muzzle tip)
        const verts = [];
        for (let i = 0; i < pos.count; i++) {
          verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
        verts.sort((a, b) => b.z - a.z);

        const breech = new THREE.Vector3();
        const bCount = Math.min(10, verts.length);
        for (let i = 0; i < bCount; i++) breech.add(verts[i]);
        breech.divideScalar(bCount);

        const muzzle = new THREE.Vector3();
        const mCount = Math.min(8, verts.length);
        for (let i = verts.length - mCount; i < verts.length; i++) muzzle.add(verts[i]);
        muzzle.divideScalar(mCount);

        const barrelVec = muzzle.clone().sub(breech);
        const barrelLen = barrelVec.length();
        const barrelDir = barrelVec.clone().normalize();

        // 1. Shift geometry so breech is at (0, 0, 0)
        geo.translate(-breech.x, -breech.y, -breech.z);

        // 2. Rotate geometry so the physical GLB barrel vector aligns 100% with local -Z (0, 0, -1)
        const qAlignToNegZ = new THREE.Quaternion().setFromUnitVectors(barrelDir, new THREE.Vector3(0, 0, -1));
        geo.applyQuaternion(qAlignToNegZ);
        geo.computeVertexNormals();

        // 3. Place mount at breech, orient mount along original barrel vector, and place muzzle at (0, 0, -barrelLen)
        mountGroup.position.copy(breech);
        mountGroup.rotation.order = 'YXZ';
        mountGroup.rotation.x = Math.asin(THREE.MathUtils.clamp(barrelDir.y, -0.98, 0.98));
        mountGroup.rotation.y = Math.atan2(-barrelDir.x, -barrelDir.z);
        mountGroup.rotation.z = 0;

        muzzleNode.position.set(0, 0, -barrelLen);
        recoilGroup.add(makeStdMesh(geo, getEnhancedMaterial(src.material)));
      };

      rigPortGun('GAU-12', inner30, recoil30, muzzle30);
      rigPortGun('Bofors_40mm', bofors40, recoil40, muzzle40);
      rigPortGun('105mm_M102', inner105, recoil105, muzzle105);

      // F. Rig Retractable/Extendable Landing Gear (`gear_nose`, `gear_l`, `gear_r` + 6 Bay Doors)
      const attachPivotedMesh = (nodeName, parentGroup) => {
        const src = namedMeshes[nodeName];
        if (!src) return null;
        const matStd = M_STD.clone().multiply(src.matrixWorld);
        const pivot = new THREE.Vector3().setFromMatrixPosition(matStd);
        const geo = toStdGeometry(src);
        geo.translate(-pivot.x, -pivot.y, -pivot.z);

        const pivotGroup = new THREE.Group();
        pivotGroup.position.copy(pivot);
        pivotGroup.add(makeStdMesh(geo, getEnhancedMaterial(src.material)));
        parentGroup.add(pivotGroup);
        return pivotGroup;
      };

      gearAnimNodes.noseWheel = attachPivotedMesh('gear_nose', noseGear);
      gearAnimNodes.noseDoor1 = attachPivotedMesh('gear_nose_door', noseGear);
      gearAnimNodes.noseDoor2 = attachPivotedMesh('gear_nose_door2', noseGear);

      gearAnimNodes.mainL = attachPivotedMesh('gear_l', gearL);
      gearAnimNodes.mainLDoor = attachPivotedMesh('gear_l_door', gearL);
      gearAnimNodes.mainLDoor2 = attachPivotedMesh('gear_l_door2', gearL);

      gearAnimNodes.mainR = attachPivotedMesh('gear_r', gearR);
      gearAnimNodes.mainRDoor = attachPivotedMesh('gear_r_door', gearR);
      gearAnimNodes.mainRDoor2 = attachPivotedMesh('gear_r_door2', gearR);

      // Default to Extended landing gear in Hangar mode
      setGearExtended(true);

      // Tag all newly added GLB meshes with their parent partId for raycasting selection
      parts.forEach(p => {
        p.items.forEach(it => {
          it.obj.traverse(child => {
            child.userData.partId = p.id;
          });
        });
      });

      // Recompute accurate bounding boxes and leader lines now that GLB geometry is populated
      recomputePartBounds();

      if (typeof onLoaded === 'function') {
        onLoaded(modelData);
      }
    },
    undefined,
    (err) => {
      console.error('Error loading lockheed_ac-130u_spooky.glb:', err);
    }
  );

  return modelData;
}

// Apply explode factor (0..1) cleanly relative to each part's original basePos
export function applyExplode(model, amounts) {
  let maxAmount = 0;
  model.parts.forEach((p, i) => {
    const a = Array.isArray(amounts) ? amounts[i] : amounts;
    if (a > maxAmount) maxAmount = a;

    p.items.forEach(it => {
      it.obj.position.copy(it.basePos).addScaledVector(it.offset, a);

      if (it.leaderLine) {
        const posAttr = it.leaderLine.geometry.attributes.position;
        const start = it.basePos.clone().add(it.centerLocal);
        const end = it.obj.position.clone().add(it.centerLocal);
        posAttr.setXYZ(0, start.x, start.y, start.z);
        posAttr.setXYZ(1, end.x, end.y, end.z);
        posAttr.needsUpdate = true;
      }
    });
  });

  if (model.lineMat) {
    model.lineMat.opacity = maxAmount > 0.02 ? Math.min(0.55, maxAmount * 0.7) : 0;
  }

  // Ensure landing gear wheels are visible when exploding for full inspection
  if (model.gearAnimNodes) {
    const showWheels = maxAmount > 0.01 || !!model.isGearExtended;
    if (model.gearAnimNodes.mainL) model.gearAnimNodes.mainL.visible = showWheels;
    if (model.gearAnimNodes.mainR) model.gearAnimNodes.mainR.visible = showWheels;
    if (model.gearAnimNodes.noseWheel) model.gearAnimNodes.noseWheel.visible = showWheels;
  }
}
