// Dunia: pulau prosedural, pepohonan, pelabuhan (outpost), peta & objek-objek kecil
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAP_HALF = 1300;     // setengah lebar peta ketinggian
export const WORLD_LIMIT = 1150;  // batas area berlayar
export const SEA_FLOOR = -8;
export const islands = [];

const NAMES = [
  'Pulau Tengkorak', 'Teluk Hiu', 'Karang Emas', 'Pulau Kabut', 'Batu Kraken', 'Pulau Sunyi',
  'Tanjung Rum', 'Pulau Kerang', 'Bukit Meriam', 'Pulau Nyiur', 'Laguna Hantu', 'Pulau Mutiara',
  'Karang Badai', 'Pulau Kapten', 'Atol Camar', 'Pulau Jangkar',
];

const ni = (g) => (g.index ? g.toNonIndexed() : g);

// ------------------------------------------------------------------ Pulau
export function generateIslands(seed) {
  const rnd = mulberry32(seed);
  islands.length = 0;
  islands.push({ name: 'Pelabuhan Sanggar', x: 0, z: 0, r: 110, h: 7, seed: 3.1, outpost: true });
  let tries = 0, n = 0;
  while (islands.length < 17 && tries < 4000) {
    tries++;
    const r = 55 + rnd() * 70;
    const x = (rnd() * 2 - 1) * (WORLD_LIMIT - r);
    const z = (rnd() * 2 - 1) * (WORLD_LIMIT - r);
    let ok = true;
    for (const o of islands) {
      if (Math.hypot(o.x - x, o.z - z) < (o.r + r) * 1.3 + 50) { ok = false; break; }
    }
    if (!ok) continue;
    islands.push({ name: NAMES[n++ % NAMES.length], x, z, r, h: 8 + rnd() * 16, seed: rnd() * 100, outpost: false });
  }
}

export function islandHeight(isl, x, z) {
  const dx = x - isl.x, dz = z - isl.z;
  const s = isl.seed;
  const ang = Math.atan2(dz, dx);
  const rr = isl.r * (1 + 0.18 * Math.sin(ang * 3 + s) + 0.1 * Math.sin(ang * 5 + s * 2.1));
  const d = Math.sqrt(dx * dx + dz * dz) / rr;
  if (d >= 1) return SEA_FLOOR;
  const t = 1 - d;
  const shape = t * t * (3 - 2 * t);
  const n = Math.sin(x * 0.06 + s) * Math.cos(z * 0.05 + s * 1.7) * 0.5 +
            Math.sin(x * 0.17 + z * 0.13 + s * 2.3) * 0.25 +
            Math.sin(x * 0.41 - z * 0.37 + s * 0.7) * 0.1;
  let h = SEA_FLOOR + (isl.h - SEA_FLOOR) * shape * (0.8 + 0.35 * n);
  if (isl.outpost && h > 3.5) h = 3.5 + (h - 3.5) * 0.15; // dataran rata untuk bangunan
  return h;
}

/** Ketinggian daratan/dasar laut pada (x, z). */
export function terrainHeight(x, z) {
  let best = SEA_FLOOR;
  for (let i = 0; i < islands.length; i++) {
    const isl = islands[i];
    const R = isl.r * 1.3;
    const dx = x - isl.x, dz = z - isl.z;
    if (dx > R || dx < -R || dz > R || dz < -R) continue;
    const h = islandHeight(isl, x, z);
    if (h > best) best = h;
  }
  return best;
}

export function islandAt(x, z, factor = 0.52) {
  for (const isl of islands) if (Math.hypot(x - isl.x, z - isl.z) < isl.r * factor) return isl;
  return null;
}

export function pickTreasureSpot(excludeName) {
  const cands = islands.filter((i) => !i.outpost && i.name !== excludeName);
  for (let k = 0; k < 60; k++) {
    const isl = cands[Math.floor(Math.random() * cands.length)];
    for (let a = 0; a < 80; a++) {
      const ang = Math.random() * Math.PI * 2, rr = Math.random() * isl.r * 0.6;
      const x = isl.x + Math.cos(ang) * rr, z = isl.z + Math.sin(ang) * rr;
      const h = islandHeight(isl, x, z);
      if (h > 1.6 && h < isl.h * 0.85) return { isl, x, z, y: h };
    }
  }
  return null;
}

function buildIslandMesh(isl) {
  const size = isl.r * 2.7;
  const seg = Math.min(110, Math.max(40, Math.floor(size / 2.5)));
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + isl.x, z = pos.getZ(i) + isl.z;
    const h = islandHeight(isl, x, z);
    pos.setY(i, h);
    const v = (Math.sin(x * 1.7 + z * 2.3) * 0.5 + 0.5) * 0.08 - 0.04;
    if (h < -3.5) c.setHex(0x1a455a);
    else if (h < -1.2) c.setHex(0x2d6878);
    else if (h < 0.2) c.setHex(0xc4ab72);
    else if (h < 1.8) c.setHex(0xead6a0);
    else if (h < isl.h * 0.72) c.setHex(isl.outpost ? 0x7aa84a : 0x5e9a3c);
    else c.setHex(0x8c8577);
    c.offsetHSL(0, 0, v);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  mesh.position.set(isl.x, 0, isl.z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function makePalmGeometries() {
  const trunk = new THREE.CylinderGeometry(0.22, 0.38, 7, 6, 5);
  const p = trunk.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + 3.5;
    p.setX(i, p.getX(i) + Math.pow(y / 7, 2) * 1.2);
    p.setY(i, y);
  }
  trunk.computeVertexNormals();
  const cocos = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.IcosahedronGeometry(0.24, 0);
    c.translate(1.2 + Math.cos(i * 2.1) * 0.3, 6.75, Math.sin(i * 2.1) * 0.3);
    cocos.push(c);
  }
  const leaves = [];
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.BoxGeometry(0.9, 0.06, 3.6, 1, 1, 5);
    const lp = leaf.attributes.position;
    for (let j = 0; j < lp.count; j++) {
      const z = lp.getZ(j) + 1.8;
      lp.setZ(j, z);
      lp.setY(j, lp.getY(j) - z * z * 0.1 + z * 0.15);
      lp.setX(j, lp.getX(j) * (1 - z / 4.6));
    }
    leaf.computeVertexNormals();
    leaf.rotateY((i / 7) * Math.PI * 2 + 0.3);
    leaf.translate(1.2, 7, 0);
    leaves.push(ni(leaf));
  }
  return {
    trunk: mergeGeometries([ni(trunk), ...cocos.map(ni)]),
    leaves: mergeGeometries(leaves),
  };
}

// ------------------------------------------------------------------ Peta
export function buildHeightData(N, half) {
  const data = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    const z = -half + ((j + 0.5) / N) * 2 * half;
    for (let i = 0; i < N; i++) {
      const x = -half + ((i + 0.5) / N) * 2 * half;
      data[j * N + i] = terrainHeight(x, z);
    }
  }
  return data;
}

export function buildHeightTexture(data, N) {
  const bytes = new Uint8Array(N * N);
  for (let k = 0; k < N * N; k++) bytes[k] = Math.max(0, Math.min(255, Math.round(((data[k] + 10) / 40) * 255)));
  const tex = new THREE.DataTexture(bytes, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function buildMapCanvas(data, N, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const step = N / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = data[Math.floor(y * step) * N + Math.floor(x * step)];
      let r, g, b;
      if (h < -6) { r = 26; g = 84; b = 118; }
      else if (h < 0) { const k = (h + 6) / 6; r = 26 + k * 70; g = 84 + k * 100; b = 118 + k * 70; }
      else if (h < 1.8) { r = 232; g = 212; b = 150; }
      else if (h < 9) { r = 104; g = 160; b = 72; }
      else { r = 140; g = 132; b = 118; }
      const o = (y * size + x) * 4;
      const nse = (Math.random() - 0.5) * 8;
      img.data[o] = r + nse; img.data[o + 1] = g + nse; img.data[o + 2] = b + nse; img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    const p = (i / 10) * size;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
  }
  return c;
}

// ------------------------------------------------------------------ Objek kecil
const MAT = {
  chestWood: new THREE.MeshStandardMaterial({ color: 0x7a4a22, roughness: 0.8 }),
  chestLid: new THREE.MeshStandardMaterial({ color: 0x5e3718, roughness: 0.8 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd4a72c, metalness: 0.8, roughness: 0.35, emissive: 0x2a1c00 }),
  barrel: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc0281e, emissive: 0x500805, roughness: 0.6 }),
};

export function createChestMesh(s = 1) {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
  };
  add(new THREE.BoxGeometry(1, 0.55, 0.65), MAT.chestWood, 0, 0.275, 0);
  add(new THREE.BoxGeometry(1.04, 0.28, 0.69), MAT.chestLid, 0, 0.69, 0);
  add(new THREE.BoxGeometry(0.08, 0.86, 0.71), MAT.gold, 0.36, 0.43, 0);
  add(new THREE.BoxGeometry(0.08, 0.86, 0.71), MAT.gold, -0.36, 0.43, 0);
  add(new THREE.BoxGeometry(0.16, 0.2, 0.06), MAT.gold, 0, 0.55, 0.35);
  g.scale.setScalar(s);
  return g;
}

export function createBarrelMesh(type) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 10), MAT.barrel);
  body.castShadow = true;
  g.add(body);
  for (const y of [-0.35, 0.35]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 4, 14), MAT.iron);
    band.rotation.x = Math.PI / 2; band.position.y = y; g.add(band);
  }
  const topCol = type === 'ammo' ? 0x222222 : type === 'gold' ? 0xffcc33 : 0xd8b27a;
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.4, 10), new THREE.MeshStandardMaterial({ color: topCol, emissive: topCol, emissiveIntensity: 0.25 }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.56; g.add(top);
  return g;
}

export function createXMarker() {
  const g = new THREE.Group();
  for (const r of [Math.PI / 4, -Math.PI / 4]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.42), MAT.red);
    b.rotation.y = r; g.add(b);
  }
  return g;
}

// ------------------------------------------------------------------ Pelabuhan
function buildOutpost(scene, isl) {
  const g = new THREE.Group();
  scene.add(g);
  const H = (x, z) => islandHeight(isl, x, z);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5b3a1f, roughness: 0.9 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xc8a272, roughness: 0.9 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x8a2f1c, roughness: 0.8, flatShading: true });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.7 });
  const lampMats = [];
  const lights = [];
  const box = (w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  };
  const lampMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffaa33, emissiveIntensity: 0 }); lampMats.push(m); return m; };

  // Dermaga ke arah +x
  let shoreX = 60;
  for (let x = 0; x < isl.r * 1.3; x += 1) { if (H(x, 0) < -0.8) { shoreX = x; break; } }
  const dockLen = 36, dockStart = shoreX - 10;
  box(dockLen, 0.35, 4.5, wood, dockStart + dockLen / 2, 1.6, 0);
  for (let x = dockStart; x <= dockStart + dockLen + 0.1; x += 4.5) {
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 10, 6), dark);
      post.position.set(x, -3.2, s * 2.1); g.add(post);
    }
  }
  for (const x of [dockStart + 12, dockStart + dockLen - 1]) {
    box(0.2, 3, 0.2, dark, x, 3.1, 2.0);
    const lamp = box(0.45, 0.6, 0.45, lampMat(), x, 4.8, 2.0);
    lamp.castShadow = false;
  }
  const dockLight = new THREE.PointLight(0xffb855, 0, 30, 1.6);
  dockLight.position.set(dockStart + dockLen - 1, 5, 2); g.add(dockLight); lights.push({ light: dockLight, max: 40 });

  // Pondok-pondok
  const huts = [[-14, 14, 0.3], [12, -18, 1.2], [-26, -12, 2.1], [16, 18, -0.5], [-4, -32, 0.9]];
  for (const [x, z, r] of huts) {
    const y = H(x, z);
    box(7, 4, 6, wall, x, y + 2, z, r);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(5.6, 3, 4), roof);
    rf.position.set(x, y + 5.5, z); rf.rotation.y = r + Math.PI / 4; rf.castShadow = true; g.add(rf);
    const door = box(1.4, 2.4, 0.2, dark, x + Math.sin(r) * 3.05, y + 1.2, z + Math.cos(r) * 3.05, r);
    door.castShadow = false;
    const win = box(1, 1, 0.15, lampMat(), x + Math.sin(r) * 3.05 + Math.cos(r) * 2, y + 2.4, z + Math.cos(r) * 3.05 - Math.sin(r) * 2, r);
    win.castShadow = false;
  }

  // Kios pedagang dekat pangkal dermaga
  const sx = shoreX - 18, sz = 9, sy = H(sx, sz);
  box(6, 1.2, 2.5, wood, sx, sy + 0.6, sz);
  for (const [dx, dz] of [[-2.8, -1.1], [2.8, -1.1], [-2.8, 1.1], [2.8, 1.1]]) box(0.2, 3.6, 0.2, dark, sx + dx, sy + 1.8, sz + dz);
  for (let i = 0; i < 6; i++) {
    box(1, 0.12, 3, new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf2efe6 : 0xc0281e }), sx - 2.5 + i, sy + 3.7, sz, 0);
  }
  const c1 = createChestMesh(0.9); c1.position.set(sx - 1.5, sy + 1.2, sz); g.add(c1);
  const b1 = createBarrelMesh('ammo'); b1.position.set(sx + 3.8, sy + 0.55, sz + 1.5); g.add(b1);
  const b2 = createBarrelMesh('planks'); b2.position.set(sx + 4.6, sy + 0.55, sz + 0.6); g.add(b2);

  // Mercusuar
  const lx = -30, lz = 30, ly = H(lx, lz);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.8, 14, 12), white);
  tower.position.set(lx, ly + 7, lz); tower.castShadow = true; g.add(tower);
  for (const y of [3, 8]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(2.62 - y * 0.06, 2.7 - y * 0.06, 2, 12), roof);
    s.position.set(lx, ly + y, lz); g.add(s);
  }
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 10), lampMat());
  lantern.position.set(lx, ly + 15, lz); g.add(lantern);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2, 10), roof);
  cap.position.set(lx, ly + 17, lz); g.add(cap);
  const lhLight = new THREE.PointLight(0xffc066, 0, 140, 1.2);
  lhLight.position.set(lx, ly + 15, lz); g.add(lhLight); lights.push({ light: lhLight, max: 300 });

  // Tiang bendera
  const fx = shoreX - 6, fz = -5, fy = H(fx, fz);
  box(0.2, 10, 0.2, dark, fx, fy + 5, fz);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide }));
  flag.position.set(fx + 1.2, fy + 9.2, fz); g.add(flag);

  // Titik parkir kapal di samping dermaga (di air dalam yang aman)
  let spawnX = dockStart + dockLen - 4;
  for (let i = 0; i < 40; i++) {
    if (terrainHeight(spawnX, 14) < -3.5 && terrainHeight(spawnX + 9, 14) < -3.5 && terrainHeight(spawnX - 9, 14) < -3.5) break;
    spawnX += 2;
  }

  return {
    group: g,
    spawn: new THREE.Vector3(spawnX, 0, 14),
    spawnHeading: Math.PI / 2,
    dockPoint: new THREE.Vector3(dockStart + dockLen, 1.6, 0),
    center: new THREE.Vector3(isl.x, 0, isl.z),
    setNight(n) {
      for (const m of lampMats) m.emissiveIntensity = 0.3 + n * 2.5;
      for (const l of lights) l.light.intensity = n * l.max;
    },
  };
}

// ------------------------------------------------------------------ Bangun dunia
export function buildWorld(scene) {
  const rnd = mulberry32(777);
  const palmMats = {
    trunk: new THREE.MeshStandardMaterial({ color: 0x8b6a45, roughness: 0.9, flatShading: true }),
    leaves: new THREE.MeshStandardMaterial({ color: 0x3f8f2f, roughness: 0.8, flatShading: true, side: THREE.DoubleSide }),
  };
  const palmGeo = makePalmGeometries();
  const palms = [], rocks = [], bushes = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();

  for (const isl of islands) {
    scene.add(buildIslandMesh(isl));
    const nPalm = Math.floor(isl.r * (isl.outpost ? 0.15 : 0.32));
    for (let k = 0, placed = 0; k < nPalm * 8 && placed < nPalm; k++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * isl.r;
      const x = isl.x + Math.cos(a) * rr, z = isl.z + Math.sin(a) * rr;
      const h = islandHeight(isl, x, z);
      if (h < 1.4 || h > isl.h * 0.75) continue;
      if (isl.outpost && rr < 45) continue;
      e.set((rnd() - 0.5) * 0.25, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.25);
      q.setFromEuler(e);
      sc.setScalar(0.8 + rnd() * 0.55);
      ps.set(x, h - 0.3, z);
      palms.push(m4.compose(ps, q, sc).clone());
      placed++;
    }
    const nRock = Math.floor(isl.r * 0.14);
    for (let k = 0; k < nRock; k++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * isl.r * 0.95;
      const x = isl.x + Math.cos(a) * rr, z = isl.z + Math.sin(a) * rr;
      const h = islandHeight(isl, x, z);
      if (h < -3) continue;
      if (isl.outpost && rr < 40) continue;
      e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e);
      const s = 0.6 + rnd() * 2.2;
      sc.set(s * (0.8 + rnd() * 0.6), s * (0.6 + rnd() * 0.5), s * (0.8 + rnd() * 0.6));
      ps.set(x, h, z);
      rocks.push(m4.compose(ps, q, sc).clone());
    }
    const nBush = Math.floor(isl.r * 0.25);
    for (let k = 0; k < nBush; k++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * isl.r * 0.8;
      const x = isl.x + Math.cos(a) * rr, z = isl.z + Math.sin(a) * rr;
      const h = islandHeight(isl, x, z);
      if (h < 2.0 || h > isl.h * 0.8) continue;
      if (isl.outpost && rr < 40) continue;
      e.set(0, rnd() * 3, 0); q.setFromEuler(e);
      const s = 0.7 + rnd() * 1.1;
      sc.set(s * 1.3, s * 0.8, s * 1.3);
      ps.set(x, h + 0.2, z);
      bushes.push(m4.compose(ps, q, sc).clone());
    }
  }

  const inst = (geo, mat, list, shadow = true) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((m, i) => im.setMatrixAt(i, m));
    im.count = list.length;
    im.castShadow = shadow; im.receiveShadow = true;
    scene.add(im);
    return im;
  };
  inst(palmGeo.trunk, palmMats.trunk, palms);
  inst(palmGeo.leaves, palmMats.leaves, palms);
  inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x7d7a72, roughness: 1, flatShading: true }), rocks);
  inst(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x4f8a35, roughness: 0.9, flatShading: true }), bushes);

  const outpost = buildOutpost(scene, islands[0]);

  const N = 1024;
  const data = buildHeightData(N, MAP_HALF);
  const heightTexture = buildHeightTexture(data, N);
  const mapCanvas = buildMapCanvas(data, N, 512);
  return { heightTexture, mapCanvas, outpost };
}
