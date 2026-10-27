/**
 * Procedural Mountain Terrain Generator for Missile Simulator
 * Generates rugged 3D mountain ranges, valleys, target plateaus, and launch pad
 * Uses exact grid bilinear interpolation so physics heights 100% match visual mesh
 */

class MountainTerrain {
  constructor(scene) {
    this.scene = scene;
    this.width = 12000;
    this.depth = 12000;
    this.segments = 256;
    this.mesh = null;
    this.heightGrid = null;
    this.launchPadPos = new THREE.Vector3(0, 40, -4200);

    // Flattened military base & target zones (x, z, radius)
    this.flatZones = [
      { x: -450, z: 1850, r: 95 },  // Bunker Alpha + CIWS
      { x: -100, z: 3200, r: 85 },  // Radar Bravo
      { x: 650,  z: -850, r: 95 },  // Ammo Depot Charlie
      { x: 250,  z: 400,  r: 85 },  // Convoy Delta
      { x: -250, z: 2200, r: 75 }   // SAM Battery
    ];

    // Permutation table for fast procedural noise
    this.p = new Uint8Array(512);
    this.initNoise();
  }

  initNoise() {
    const permutation = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
      8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
      35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
      134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
      55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
      18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
      250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
      189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
      172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
      228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
      107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
    for (let i = 0; i < 256; i++) {
      this.p[i] = permutation[i];
      this.p[256 + i] = permutation[i];
    }

    // Precompute flat zone center heights
    for (const zone of this.flatZones) {
      zone.height = this.computeRawHeight(zone.x, zone.z);
    }
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));
    return this.lerp(v, x1, x2);
  }

  fbm(x, y, octaves = 6) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.05;
    }
    return total / maxValue;
  }

  computeRawHeight(x, z) {
    // Launch pad zone flattening around launch area
    const distToLaunch = Math.hypot(x - this.launchPadPos.x, z - this.launchPadPos.z);
    if (distToLaunch < 450) {
      return 40;
    }

    const nx = (x + 6000) * 0.00028;
    const nz = (z + 6000) * 0.00028;

    // Primary mountain ridge mask (gradually rises from launch valley z=-2600 toward mountains)
    let mountainWeight = 0;
    if (z > -2600) {
      mountainWeight = Math.min(1.0, (z + 2600) / 2200);
      mountainWeight = mountainWeight * mountainWeight * (3 - 2 * mountainWeight);
    }

    // Normalized positive elevation layers so valleys are smooth and peaks are dramatic
    const baseElev = (this.fbm(nx, nz, 5) + 0.7) * 0.65;
    const detailElev = this.fbm(nx * 3.2, nz * 3.2, 4) * 0.25;
    const ridgeElev = Math.abs(this.fbm(nx * 1.6 + 1.2, nz * 1.6 + 0.8, 4)) * 0.55;

    let h = 40 + Math.max(0, (baseElev + detailElev + ridgeElev)) * 950 * mountainWeight;

    // Carve a central tactical valley corridor from launch pad toward middle so missiles have clear sightlines
    const valleyFactor = Math.exp(-(x * x) / (2 * 650 * 650));
    if (z < 1200) {
      h = h * (1 - valleyFactor * 0.45) + 45 * (valleyFactor * 0.45);
    }

    // Transition smoothing near launch zone
    if (distToLaunch < 950) {
      const blend = (distToLaunch - 450) / 500;
      const smoothBlend = blend * blend * (3 - 2 * blend);
      h = 40 * (1 - smoothBlend) + h * smoothBlend;
    }

    return Math.max(25, h);
  }

  computeHeightWithZones(x, z) {
    let h = this.computeRawHeight(x, z);

    // Flatten target installation pads smoothly
    for (const zone of this.flatZones) {
      const d = Math.hypot(x - zone.x, z - zone.z);
      if (d < zone.r) {
        return zone.height;
      } else if (d < zone.r * 2.0) {
        const t = (d - zone.r) / zone.r;
        const smoothT = t * t * (3 - 2 * t);
        h = zone.height * (1 - smoothT) + h * smoothT;
      }
    }
    return h;
  }

  // Exact bilinear height lookup matching the PlaneGeometry vertex grid
  getTerrainHeight(x, z) {
    if (!this.heightGrid) {
      return this.computeHeightWithZones(x, z);
    }

    const halfW = this.width / 2;
    const halfD = this.depth / 2;
    const gx = ((x + halfW) / this.width) * this.segments;
    const gz = ((z + halfD) / this.depth) * this.segments;

    const ix = THREE.MathUtils.clamp(Math.floor(gx), 0, this.segments - 1);
    const iz = THREE.MathUtils.clamp(Math.floor(gz), 0, this.segments - 1);
    const fx = THREE.MathUtils.clamp(gx - ix, 0, 1);
    const fz = THREE.MathUtils.clamp(gz - iz, 0, 1);

    const stride = this.segments + 1;
    const h00 = this.heightGrid[iz * stride + ix];
    const h10 = this.heightGrid[iz * stride + (ix + 1)];
    const h01 = this.heightGrid[(iz + 1) * stride + ix];
    const h11 = this.heightGrid[(iz + 1) * stride + (ix + 1)];

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;
    return h0 * (1 - fz) + h1 * fz;
  }

  build() {
    const geo = new THREE.PlaneGeometry(this.width, this.depth, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    this.heightGrid = new Float32Array(pos.count);
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.computeHeightWithZones(x, z);
      pos.setY(i, y);
      this.heightGrid[i] = y;

      // Height-based realistic terrain color blending
      if (y > 720) {
        // Snow capped peaks
        const snowShade = THREE.MathUtils.clamp((y - 720) / 300, 0, 1);
        color.setRGB(0.82 + snowShade * 0.15, 0.86 + snowShade * 0.12, 0.90 + snowShade * 0.08);
      } else if (y > 320) {
        // High alpine jagged rock
        const rockFactor = THREE.MathUtils.clamp((y - 320) / 400, 0, 1);
        color.setRGB(0.28 + rockFactor * 0.22, 0.27 + rockFactor * 0.20, 0.25 + rockFactor * 0.18);
      } else if (y > 90) {
        // Mountain slope foliage / tundra
        const slopeFactor = THREE.MathUtils.clamp((y - 90) / 230, 0, 1);
        color.setRGB(0.18 + slopeFactor * 0.08, 0.24 + slopeFactor * 0.04, 0.16 + slopeFactor * 0.06);
      } else {
        // Valley floor / tactical launch basin
        color.setRGB(0.16, 0.20, 0.15);
      }

      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // Build Tactical Launch Base & Runway Pad
    this.buildLaunchFacility();

    // Build terrain-conforming mountain road
    this.buildTacticalInfrastructure();
  }

  buildLaunchFacility() {
    const group = new THREE.Group();
    group.position.copy(this.launchPadPos);

    // Concrete Launch Apron
    const apronGeo = new THREE.BoxGeometry(320, 4, 320);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x3a4249,
      roughness: 0.7,
      metalness: 0.2
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.y = 0;
    apron.receiveShadow = true;
    group.add(apron);

    // Launch Pad Yellow/Black Tactical Markings
    const ringGeo = new THREE.RingGeometry(35, 45, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 2.15;
    group.add(ring);

    // Mobile Launcher TEL Vehicle on Launch Pad
    const telGroup = new THREE.Group();
    telGroup.position.set(0, 2, 0);
    const telHull = new THREE.Mesh(
      new THREE.BoxGeometry(14, 6, 34),
      new THREE.MeshStandardMaterial({ color: 0x2d382c, roughness: 0.7 })
    );
    telHull.position.y = 4;
    telHull.castShadow = true;
    telGroup.add(telHull);

    const telCab = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 10),
      new THREE.MeshStandardMaterial({ color: 0x252e24, roughness: 0.6 })
    );
    telCab.position.set(0, 6, 12);
    telGroup.add(telCab);
    group.add(telGroup);

    // Blast Deflector Shield Barrier
    const deflectorGeo = new THREE.BoxGeometry(90, 24, 12);
    const deflectorMat = new THREE.MeshStandardMaterial({ color: 0x242a30, roughness: 0.6 });
    const deflector = new THREE.Mesh(deflectorGeo, deflectorMat);
    deflector.position.set(0, 12, -70);
    deflector.rotation.x = -Math.PI / 6;
    group.add(deflector);

    // Command Launch Bunker at Pad
    const bunkerGeo = new THREE.BoxGeometry(50, 18, 40);
    const bunker = new THREE.Mesh(bunkerGeo, apronMat);
    bunker.position.set(-90, 9, -50);
    group.add(bunker);

    // Floodlight Poles around Launch Pad
    for (const pos of [[-120, -120], [120, -120], [-120, 120], [120, 120]]) {
      const poleGeo = new THREE.CylinderGeometry(1.2, 1.8, 40, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x555e66 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(pos[0], 20, pos[1]);
      group.add(pole);

      const headGeo = new THREE.BoxGeometry(6, 4, 8);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(pos[0], 40, pos[1]);
      group.add(head);
    }

    this.scene.add(group);
  }

  buildTacticalInfrastructure() {
    // Ground-hugging mountain access road ribbon
    const controlWaypoints = [
      new THREE.Vector3(0, 0, -4000),
      new THREE.Vector3(220, 0, -2500),
      new THREE.Vector3(650, 0, -850),
      new THREE.Vector3(250, 0, 400),
      new THREE.Vector3(-450, 0, 1850),
      new THREE.Vector3(-100, 0, 3200)
    ];

    const curve = new THREE.CatmullRomCurve3(controlWaypoints);
    const steps = 240;
    const roadWidth = 14;
    const positions = [];
    const indices = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftPt = pt.clone().addScaledVector(side, roadWidth);
      const rightPt = pt.clone().addScaledVector(side, -roadWidth);

      leftPt.y = this.getTerrainHeight(leftPt.x, leftPt.z) + 1.2;
      rightPt.y = this.getTerrainHeight(rightPt.x, rightPt.z) + 1.2;

      positions.push(leftPt.x, leftPt.y, leftPt.z);
      positions.push(rightPt.x, rightPt.y, rightPt.z);

      if (i < steps) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x2b2f33,
      roughness: 0.95,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);
  }

  // Fast collision check against terrain surface
  checkCollision(pos) {
    const groundY = this.getTerrainHeight(pos.x, pos.z);
    return {
      hit: pos.y <= groundY + 1.5,
      groundY: groundY
    };
  }
}

window.MountainTerrain = MountainTerrain;
