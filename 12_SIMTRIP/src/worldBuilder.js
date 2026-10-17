import * as THREE from 'three';
import { getRouteOSMTiles } from './mapRouter.js';

function createRoadAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e242b';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 26 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Left & Right solid white shoulder lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(22, 0, 10, 512);
  ctx.fillRect(480, 0, 10, 512);

  // Center double yellow divider
  ctx.fillStyle = '#f59e0b';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(252, y + 8, 8, 40);
  }

  // Sub-lane white dashes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(136, y + 16, 6, 32);
    ctx.fillRect(370, y + 16, 6, 32);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Creates a meter-scaled architectural facade texture (1 tile = 4m wide x 4m tall)
 */
function createArchitecturalFacadeTexture({
  wallBg = '#334155',
  mullionColor = '#1e293b',
  glassDayColor = '#0f172a',
  isEmissiveMap = false,
  style = 'office' // 'office' | 'apartments' | 'shophouse'
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (isEmissiveMap) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 256);
  } else {
    ctx.fillStyle = wallBg;
    ctx.fillRect(0, 0, 256, 256);
  }

  const cols = style === 'office' ? 4 : 3;
  const rows = 2; // 2 floors per 256px tile
  const padX = style === 'office' ? 6 : 16;
  const padY = style === 'office' ? 10 : 20;
  const w = (256 - padX * (cols + 1)) / cols;
  const h = (256 - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    // Horizontal floor slab line
    if (!isEmissiveMap) {
      ctx.fillStyle = mullionColor;
      ctx.fillRect(0, r * 128, 256, 8);
    }
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (w + padX);
      const y = padY + r * (h + padY);
      if (isEmissiveMap) {
        if (Math.random() > 0.35) {
          ctx.fillStyle = Math.random() > 0.35 ? '#fef08a' : '#bae6fd';
          ctx.fillRect(x, y, w, h);
        }
      } else {
        ctx.fillStyle = glassDayColor;
        ctx.fillRect(x, y, w, h);
        // Window frame highlight
        ctx.strokeStyle = mullionColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Renders an authentic Indonesian / International Street Name Blade Sign Texture
 * (e.g., Green reflective plate with white border, road emblem, and bold white street name)
 */
function createAuthenticStreetBladeTexture(streetName, subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Outer metallic casing
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(2, 2, 636, 156, 22);
  ctx.fill();

  // Standard Dishub Street Sign Green (#006837)
  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, '#007a40');
  grad.addColorStop(1, '#00562c');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(8, 8, 624, 144, 18);
  ctx.fill();

  // White reflective inner border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(16, 16, 608, 128, 12);
  ctx.stroke();

  // Left shield / pin badge
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 80, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#006837';
  ctx.font = 'bold 28px Inter, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JL', 64, 81);

  // Street Name text (auto-fit font size)
  const cleanName = (streetName || 'Jalan Utama').trim();
  let fontSize = 42;
  if (cleanName.length > 28) fontSize = 28;
  else if (cleanName.length > 20) fontSize = 34;

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${fontSize}px Inter, "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanName.slice(0, 34), 112, subtitle ? 66 : 80);

  if (subtitle) {
    ctx.fillStyle = '#bbf7d0';
    ctx.font = '600 20px Inter, "Segoe UI", Arial, sans-serif';
    ctx.fillText(subtitle.slice(0, 42), 112, 112);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Renders an authentic Overhead Highway / RPPJ Directional Gantry Signboard Texture
 */
function createRPPJGantryTexture(roadName, directionLabel = 'LURUS', arrowChar = '↑', distText = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Standard RPPJ Green background
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#006b38');
  grad.addColorStop(1, '#004b27');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(4, 4, 760, 248, 22);
  ctx.fill();

  // White reflective border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(14, 14, 740, 228, 16);
  ctx.stroke();

  // Left white arrow box
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.roundRect(32, 34, 150, 188, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 108px Inter, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(arrowChar, 107, 130);

  // Direction header pill
  ctx.fillStyle = '#facc15';
  ctx.font = '800 26px Inter, Segoe UI, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(directionLabel.toUpperCase(), 208, 66);

  // Main Real Street Name
  const cleanRoad = (roadName || 'Jalur Utama').trim();
  const roadFontSize = cleanRoad.length > 22 ? 38 : 46;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${roadFontSize}px Inter, "Segoe UI", Arial, sans-serif`;
  ctx.fillText(cleanRoad.slice(0, 28), 208, 132);

  // Bottom separator line + distance
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(208, 172, 515, 3);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 24px Inter, Segoe UI, sans-serif';
  ctx.fillText(distText ? `JARAK BELOKAN: ${distText}` : 'IKUTI JALUR UTAMA • OPENSTREETMAP', 208, 206);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Helper to compute world-meter scaled UVs on an ExtrudeGeometry after it has been rotated into 3D XZ space
 */
function applyMeterScaledUVs(geometry, tileScaleMeters = 6.0) {
  const posAttr = geometry.attributes.position;
  const normAttr = geometry.attributes.normal;
  const uvAttr = geometry.attributes.uv;
  if (!posAttr || !normAttr || !uvAttr) return;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const nx = Math.abs(normAttr.getX(i));
    const ny = Math.abs(normAttr.getY(i));
    const nz = Math.abs(normAttr.getZ(i));

    if (ny > 0.8) {
      // Roof / floor surface
      uvAttr.setXY(i, x / tileScaleMeters, z / tileScaleMeters);
    } else if (nx > nz) {
      // Wall facing East/West
      uvAttr.setXY(i, z / tileScaleMeters, y / tileScaleMeters);
    } else {
      // Wall facing North/South
      uvAttr.setXY(i, x / tileScaleMeters, y / tileScaleMeters);
    }
  }
  uvAttr.needsUpdate = true;
}

export class WorldEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.routeGroup = new THREE.Group();
    this.osmBuildingsGroup = new THREE.Group();
    this.osmSignsGroup = new THREE.Group();
    this.osmTilesGroup = new THREE.Group();
    this.fallbackBuildingsGroup = new THREE.Group();

    this.scene.add(this.routeGroup);
    this.scene.add(this.osmBuildingsGroup);
    this.scene.add(this.osmSignsGroup);
    this.scene.add(this.osmTilesGroup);
    this.scene.add(this.fallbackBuildingsGroup);

    this.roadWidth = 14.0;
    this.samples = [];
    this.totalLength3D = 1;
    this.streetLightBulbs = [];
    this.buildingMaterials = [];
    this.osmTileMaterials = [];
    this.finishBeacon = null;

    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.setCrossOrigin('anonymous');
    this.tileTextureCache = new Map();

    this.roadTexture = createRoadAsphaltTexture();
    this.initBuildingMaterialPalette();
    this.initSkyAndLighting();
  }

  initBuildingMaterialPalette() {
    const officeDay = createArchitecturalFacadeTexture({
      wallBg: '#1e293b',
      mullionColor: '#94a3b8',
      glassDayColor: '#0c4a6e',
      isEmissiveMap: false,
      style: 'office'
    });
    const officeNight = createArchitecturalFacadeTexture({
      isEmissiveMap: true,
      style: 'office'
    });

    const aptDay = createArchitecturalFacadeTexture({
      wallBg: '#e2e8f0',
      mullionColor: '#94a3b8',
      glassDayColor: '#1e293b',
      isEmissiveMap: false,
      style: 'apartments'
    });
    const aptNight = createArchitecturalFacadeTexture({
      isEmissiveMap: true,
      style: 'apartments'
    });

    const warmDay = createArchitecturalFacadeTexture({
      wallBg: '#fde68a',
      mullionColor: '#d97706',
      glassDayColor: '#1e293b',
      isEmissiveMap: false,
      style: 'apartments'
    });

    this.facadeStyles = {
      officeGlass: new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        roughness: 0.22,
        metalness: 0.65,
        map: officeDay,
        emissive: new THREE.Color(0xfef08a),
        emissiveMap: officeNight,
        emissiveIntensity: 0.2
      }),
      modernTower: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.5,
        map: officeDay,
        emissive: new THREE.Color(0xe0f2fe),
        emissiveMap: officeNight,
        emissiveIntensity: 0.2
      }),
      apartments: new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.65,
        metalness: 0.15,
        map: aptDay,
        emissive: new THREE.Color(0xfef08a),
        emissiveMap: aptNight,
        emissiveIntensity: 0.2
      }),
      commercialWarm: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.7,
        metalness: 0.1,
        map: warmDay,
        emissive: new THREE.Color(0xfde047),
        emissiveMap: aptNight,
        emissiveIntensity: 0.2
      }),
      residentialWall: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.85,
        metalness: 0.05
      }),
      mosqueWall: new THREE.MeshStandardMaterial({
        color: 0xecfdf5,
        roughness: 0.5,
        metalness: 0.1
      }),
      terracottaRoof: new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.8,
        metalness: 0.05
      }),
      darkRoof: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.75,
        metalness: 0.2
      }),
      domeGreen: new THREE.MeshStandardMaterial({
        color: 0x059669,
        roughness: 0.3,
        metalness: 0.45
      }),
      goldMat: new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.2,
        metalness: 0.85,
        emissive: new THREE.Color(0xca8a04),
        emissiveIntensity: 0.25
      })
    };

    this.buildingMaterials = [
      this.facadeStyles.officeGlass,
      this.facadeStyles.modernTower,
      this.facadeStyles.apartments,
      this.facadeStyles.commercialWarm
    ];
  }

  initSkyAndLighting() {
    const groundGeo = new THREE.PlaneGeometry(40000, 40000);
    groundGeo.rotateX(-Math.PI / 2);
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e2e26,
      roughness: 0.95
    });
    this.groundMesh = new THREE.Mesh(groundGeo, this.groundMat);
    this.groundMesh.position.y = -0.15;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1e293b, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(120, 220, 90);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 600;
    const d = 120;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    const orbGeo = new THREE.SphereGeometry(28, 24, 24);
    this.orbMat = new THREE.MeshBasicMaterial({ color: 0xfde047, fog: false });
    this.celestialOrb = new THREE.Mesh(orbGeo, this.orbMat);
    this.scene.add(this.celestialOrb);

    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.001);
  }

  clearGroup(group) {
    while (group.children.length > 0) {
      group.remove(group.children.pop());
    }
  }

  /**
   * Builds the 3D road, 3D OpenStreetMap Ground Tiles, street lamps, Famous Landmarks, and initial street signs
   */
  buildRouteWorld(latLngPath, converter, steps = []) {
    this.clearGroup(this.routeGroup);
    this.clearGroup(this.osmBuildingsGroup);
    this.clearGroup(this.osmSignsGroup);
    this.clearGroup(this.osmTilesGroup);
    this.clearGroup(this.fallbackBuildingsGroup);

    this.streetLightBulbs = [];
    this.osmTileMaterials = [];
    this.samples = [];

    // 1. Convert lat/lng points to 3D XZ points
    const rawPts = [];
    for (let i = 0; i < latLngPath.length; i++) {
      const p = converter.latLngToXZ(latLngPath[i].lat, latLngPath[i].lng);
      const v = new THREE.Vector3(p.x, 0, p.z);
      if (rawPts.length === 0 || v.distanceTo(rawPts[rawPts.length - 1]) > 2.2) {
        rawPts.push(v);
      }
    }

    if (rawPts.length < 2) {
      rawPts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -300));
    }

    // 2. Smooth road spline sampled every ~4 meters
    const curve = new THREE.CatmullRomCurve3(rawPts, false, 'centripetal', 0.25);
    const approxLen = Math.max(curve.getLength(), 80);
    const numSamples = Math.min(Math.max(Math.ceil(approxLen / 4.0), 40), 4500);
    const spacedPoints = curve.getSpacedPoints(numSamples);

    let cumDist = 0;
    for (let i = 0; i < spacedPoints.length; i++) {
      const pos = spacedPoints[i];
      if (i > 0) {
        cumDist += pos.distanceTo(spacedPoints[i - 1]);
      }
      let tangent;
      if (i < spacedPoints.length - 1) {
        tangent = new THREE.Vector3().subVectors(spacedPoints[i + 1], pos).normalize();
      } else {
        tangent = new THREE.Vector3().subVectors(pos, spacedPoints[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      this.samples.push({ pos, tangent, normal, cumDist });
    }
    this.totalLength3D = Math.max(cumDist, 1);

    // 3. Render Real OpenStreetMap 3D Map Tiles on the ground plane
    this.buildOSMGroundTiles(latLngPath, converter);

    // 4. Build continuous 3D road ribbon mesh + sidewalk curbs
    this.buildRoadRibbonMesh();

    // 5. Add Start & Finish Archways
    this.buildArchways(steps);

    // 6. Add Streetlights & Trees along the route, plus fallback architectural buildings until Overpass loads
    this.populateStreetlightsAndTrees();
    this.populateFallbackArchitecturalBuildings();

    // 7. Build Iconic 3D Real-World Landmarks (Monas, Bundaran HI, Gedung Sate, Tugu Jogja, Tokyo Tower, etc.) if near route!
    this.buildFamousLandmarksIfNearby(latLngPath, converter);

    // 8. Place Authentic Street Blade Signs & Overhead RPPJ Gantry Signs from OSRM steps
    this.placeOSRMRouteSigns(steps, converter);
  }

  /**
   * Renders real OpenStreetMap slippy tiles directly onto the 3D terrain plane
   */
  buildOSMGroundTiles(latLngPath, converter) {
    const tiles = getRouteOSMTiles(latLngPath, 54);

    for (const tile of tiles) {
      const nw = converter.latLngToXZ(tile.bounds.north, tile.bounds.west);
      const se = converter.latLngToXZ(tile.bounds.south, tile.bounds.east);

      const width = Math.abs(se.x - nw.x);
      const depth = Math.abs(se.z - nw.z);
      const centerX = (nw.x + se.x) * 0.5;
      const centerZ = (nw.z + se.z) * 0.5;

      const geo = new THREE.PlaneGeometry(width, depth);
      geo.rotateX(-Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.92,
        metalness: 0.02
      });
      this.osmTileMaterials.push(mat);

      if (this.tileTextureCache.has(tile.url)) {
        mat.map = this.tileTextureCache.get(tile.url);
        mat.needsUpdate = true;
      } else {
        this.textureLoader.load(
          tile.url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 4;
            this.tileTextureCache.set(tile.url, tex);
            mat.map = tex;
            mat.needsUpdate = true;
          },
          undefined,
          () => {
            mat.color.setHex(0x26352d);
          }
        );
      }

      const tileMesh = new THREE.Mesh(geo, mat);
      tileMesh.position.set(centerX, -0.02, centerZ);
      tileMesh.receiveShadow = true;
      this.osmTilesGroup.add(tileMesh);
    }
  }

  /**
   * Constructs authentic 3D buildings from OpenStreetMap Overpass polygons, heights, roof shapes, and building types,
   * AND places real intersecting street name poles from OpenStreetMap highway ways!
   */
  buildRealOSMData({ buildings = [], streets = [] }, converter, routeSteps = []) {
    const isTooCloseToRoad = (x, z, minClearance) => {
      const minSq = minClearance * minClearance;
      for (let j = 0; j < this.samples.length; j += 2) {
        const sp = this.samples[j].pos;
        const dx = x - sp.x;
        const dz = z - sp.z;
        if (dx * dx + dz * dz < minSq) return true;
      }
      return false;
    };

    if (buildings.length > 0) {
      // Remove fallback procedural buildings once real OpenStreetMap building footprints arrive!
      this.clearGroup(this.fallbackBuildingsGroup);
      this.clearGroup(this.osmBuildingsGroup);

      for (const b of buildings) {
        const pts2D = [];
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        let cx = 0, cz = 0;

        for (const node of b.footprint) {
          const xz = converter.latLngToXZ(node.lat, node.lng);
          pts2D.push(new THREE.Vector2(xz.x, -xz.z));
          cx += xz.x;
          cz += xz.z;
          if (xz.x < minX) minX = xz.x;
          if (xz.x > maxX) maxX = xz.x;
          if (xz.z < minZ) minZ = xz.z;
          if (xz.z > maxZ) maxZ = xz.z;
        }
        cx /= b.footprint.length;
        cz /= b.footprint.length;

        // Ensure no building polygon clips onto the drivable asphalt road
        let overlapsRoad = isTooCloseToRoad(cx, cz, this.roadWidth * 0.5 + 3.2);
        if (!overlapsRoad) {
          for (let k = 0; k < b.footprint.length; k += 2) {
            const xz = converter.latLngToXZ(b.footprint[k].lat, b.footprint[k].lng);
            if (isTooCloseToRoad(xz.x, xz.z, this.roadWidth * 0.5 + 1.8)) {
              overlapsRoad = true;
              break;
            }
          }
        }
        if (overlapsRoad) continue;

        try {
          const shape = new THREE.Shape(pts2D);
          const wallDepth = Math.max(b.height - b.minHeight, 3.5);
          const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
            depth: wallDepth,
            bevelEnabled: false
          });
          extrudeGeo.rotateX(-Math.PI / 2);
          applyMeterScaledUVs(extrudeGeo, 6.5);

          // Select authentic architectural facade based on OSM tags
          const isMosque =
            b.bType === 'mosque' ||
            b.religion === 'muslim' ||
            (b.name && /masjid|mesjid|musholla/i.test(b.name));
          const isHouse =
            b.bType === 'house' ||
            b.bType === 'residential' ||
            b.bType === 'detached' ||
            b.bType === 'terrace' ||
            b.height < 9.5;
          const isHighRise =
            b.height >= 26 ||
            b.bType === 'office' ||
            b.bType === 'commercial' ||
            b.bType === 'hotel';

          let wallMat = this.facadeStyles.apartments;
          if (isMosque) {
            wallMat = this.facadeStyles.mosqueWall;
          } else if (isHighRise) {
            wallMat = b.id % 2 === 0 ? this.facadeStyles.officeGlass : this.facadeStyles.modernTower;
          } else if (isHouse) {
            wallMat = b.id % 2 === 0 ? this.facadeStyles.residentialWall : this.facadeStyles.commercialWarm;
          } else if (b.bType === 'retail' || b.bType === 'shop') {
            wallMat = this.facadeStyles.commercialWarm;
          }

          const mesh = new THREE.Mesh(extrudeGeo, wallMat);
          mesh.position.y = b.minHeight;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.osmBuildingsGroup.add(mesh);

          const spanX = Math.max(maxX - minX, 4);
          const spanZ = Math.max(maxZ - minZ, 4);

          // Add realistic 3D Roof Architecture matching the building's real-world type & footprint!
          if (isMosque) {
            // Iconic Mosque Dome (Kubah Masjid) + Spire + Minaret
            const domeRadius = Math.min(spanX, spanZ) * 0.34;
            const domeGeo = new THREE.SphereGeometry(domeRadius, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
            const domeMesh = new THREE.Mesh(domeGeo, this.facadeStyles.domeGreen);
            domeMesh.position.set(cx, b.height, cz);
            this.osmBuildingsGroup.add(domeMesh);

            const spire = new THREE.Mesh(
              new THREE.CylinderGeometry(0.08, 0.16, 2.8, 8),
              this.facadeStyles.goldMat
            );
            spire.position.set(cx, b.height + domeRadius + 1.2, cz);
            this.osmBuildingsGroup.add(spire);
          } else if (
            b.roofShape === 'hipped' ||
            b.roofShape === 'gabled' ||
            b.roofShape === 'pyramidal' ||
            isHouse
          ) {
            // Pitched Terracotta Roof (Atap Genteng Limasan/Pelana) following exact polygon shape
            const roofHeight = Math.min(Math.min(spanX, spanZ) * 0.28, 3.8);
            const roofGeo = new THREE.ExtrudeGeometry(shape, {
              depth: 0.3,
              bevelEnabled: true,
              bevelThickness: roofHeight,
              bevelSize: -Math.min(spanX, spanZ) * 0.22,
              bevelSegments: 2
            });
            roofGeo.rotateX(-Math.PI / 2);
            const roofMesh = new THREE.Mesh(roofGeo, this.facadeStyles.terracottaRoof);
            roofMesh.position.y = b.height;
            roofMesh.castShadow = true;
            this.osmBuildingsGroup.add(roofMesh);
          } else if (isHighRise && b.height > 28) {
            // Skyscraper Rooftop Parapet Crown + Mechanical Penthouse / Helipad
            const crownGeo = new THREE.ExtrudeGeometry(shape, {
              depth: 1.4,
              bevelEnabled: false
            });
            crownGeo.rotateX(-Math.PI / 2);
            const crownMesh = new THREE.Mesh(crownGeo, this.facadeStyles.darkRoof);
            crownMesh.position.y = b.height;
            this.osmBuildingsGroup.add(crownMesh);

            const pentW = Math.min(spanX * 0.45, 12);
            const pentD = Math.min(spanZ * 0.45, 12);
            const pentMesh = new THREE.Mesh(
              new THREE.BoxGeometry(pentW, 3.2, pentD),
              this.facadeStyles.darkRoof
            );
            pentMesh.position.set(cx, b.height + 2.2, cz);
            this.osmBuildingsGroup.add(pentMesh);
          }

          // If this OSM building has an official name (e.g. "Sarinah", "Grand Indonesia", "Bank Indonesia"), mount an architectural building name sign
          if (b.name && b.name.length > 2) {
            const labelBoard = this.createBuildingNamePlaque(b.name);
            labelBoard.position.set(cx, b.height + 3.4, cz);
            // Face toward nearest road sample
            const nearest = this.getClosestRoadPoint(new THREE.Vector3(cx, 0, cz));
            if (nearest) {
              const angleToRoad = Math.atan2(
                nearest.sample.pos.x - cx,
                nearest.sample.pos.z - cz
              );
              labelBoard.rotation.y = angleToRoad;
            }
            this.osmBuildingsGroup.add(labelBoard);
          }
        } catch {
          // Skip invalid self-intersecting polygon
        }
      }
    }

    // Place Authentic Street Name Poles at every real street / cross-street from OpenStreetMap Overpass!
    if (streets.length > 0) {
      this.placeRealOverpassStreetSigns(streets, converter, routeSteps);
    }
  }

  createBuildingNamePlaque(buildingName) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 112;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(6, 6, 500, 100, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    const text = buildingName.trim();
    const fontSize = text.length > 24 ? 26 : 32;
    ctx.font = `800 ${fontSize}px Inter, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.slice(0, 30), 256, 56);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.65), mat);
    return mesh;
  }

  /**
   * Builds a 3D Street Name Sign Pole (Tiang Papan Nama Jalan) with 1 or 2 perpendicular green street blades
   * matching real-world Indonesian/International street signs!
   */
  createRealStreetPoleMesh(primaryStreetName, secondaryCrossStreetName = null, roadYaw = 0) {
    const group = new THREE.Group();

    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.75,
      roughness: 0.28
    });
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7
    });

    // Concrete/steel base collar
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.45, 12), baseMat);
    base.position.y = 0.225;
    group.add(base);

    // Galvanized steel pole (3.5m high)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 3.6, 12), poleMat);
    pole.position.y = 1.8;
    pole.castShadow = true;
    group.add(pole);

    // Top finial cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), poleMat);
    cap.position.y = 3.65;
    group.add(cap);

    // Helper to build a double-sided sign blade casing
    const makeBlade = (streetText, subText, yHeight, yawAngle) => {
      const bladeGroup = new THREE.Group();
      bladeGroup.position.y = yHeight;
      bladeGroup.rotation.y = yawAngle;

      // Mounting collar ring
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12), baseMat);
      bladeGroup.add(ring);

      const bladeW = 2.65;
      const bladeH = 0.66;
      const tex = createAuthenticStreetBladeTexture(streetText, subText);
      const faceMat = new THREE.MeshBasicMaterial({ map: tex });
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });

      // BoxGeometry material order: [+x, -x, +y, -y, +z (front), -z (back)]
      const bladeBox = new THREE.Mesh(
        new THREE.BoxGeometry(bladeW, bladeH, 0.055),
        [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat]
      );
      // Offset slightly so it cantilevers cleanly from the pole
      bladeBox.position.x = bladeW * 0.48;
      bladeBox.castShadow = true;
      bladeGroup.add(bladeBox);

      group.add(bladeGroup);
    };

    // Primary blade facing drivers approaching along the road
    makeBlade(primaryStreetName, 'OPENSTREETMAP • JALAN RAYA', 3.35, roadYaw);

    // If there is a crossing street at this corner, mount a second perpendicular blade right below it!
    if (secondaryCrossStreetName && secondaryCrossStreetName !== primaryStreetName) {
      makeBlade(secondaryCrossStreetName, 'SIMPANG JALAN', 2.62, roadYaw + Math.PI / 2);
    }

    return group;
  }

  /**
   * Builds an Overhead Highway Cantilever / RPPJ Gantry Sign (Rambu Pendahulu Petunjuk Jurusan)
   * spanning above the road before turns and intersections!
   */
  createOverheadRPPJGantry(roadName, directionLabel, arrowChar, distText, sample, side = -1) {
    const gantryGroup = new THREE.Group();
    const { pos, normal, tangent } = sample;
    const roadYaw = Math.atan2(tangent.x, tangent.z);

    gantryGroup.position.copy(pos);
    gantryGroup.rotation.y = roadYaw;

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.35
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.6,
      roughness: 0.4
    });

    const poleX = side * (this.roadWidth * 0.5 + 1.9);
    const height = 6.6;

    // Vertical heavy steel column on roadside
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, height, 12), steelMat);
    column.position.set(poleX, height * 0.5, 0);
    column.castShadow = true;
    gantryGroup.add(column);

    // Horizontal truss arm extending over the road lane
    const armLen = this.roadWidth * 0.62;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.28, 0.28), steelMat);
    arm.position.set(poleX - side * (armLen * 0.5), height - 0.3, 0);
    gantryGroup.add(arm);

    const armLower = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.18, 0.18), darkSteelMat);
    armLower.position.set(poleX - side * (armLen * 0.5), height - 0.85, 0);
    gantryGroup.add(armLower);

    // RPPJ Green Signboard facing oncoming driver
    const tex = createRPPJGantryTexture(roadName, directionLabel, arrowChar, distText);
    const faceMat = new THREE.MeshBasicMaterial({ map: tex });
    const backMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });

    const boardW = 5.8;
    const boardH = 1.95;
    // Note: in local gantryGroup space, +Z is forward along tangent, so driver looks toward +Z from -Z.
    // The face pointing toward the approaching driver is the -Z face (index 5), or we rotate board by Math.PI
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(boardW, boardH, 0.12),
      [backMat, backMat, backMat, backMat, faceMat, faceMat]
    );
    board.position.set(poleX - side * (armLen * 0.58), height - 0.55, 0);
    board.castShadow = true;
    gantryGroup.add(board);

    return gantryGroup;
  }

  /**
   * Places authentic street blade signs and overhead RPPJ gantry signs for OSRM route steps
   */
  placeOSRMRouteSigns(steps, converter) {
    if (!steps || steps.length === 0) return;

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (!s.lat || !s.lng || !s.roadName) continue;
      const xz = converter.latLngToXZ(s.lat, s.lng);
      const closest = this.getClosestRoadPoint(new THREE.Vector3(xz.x, 0, xz.z));
      if (!closest) continue;

      const roadYaw = Math.atan2(closest.sample.tangent.x, closest.sample.tangent.z);

      // 1. Place Street Name Blade Pole right at the intersection corner
      const prevRoadName = i > 0 ? steps[i - 1].roadName : null;
      const cornerPos = new THREE.Vector3()
        .copy(closest.sample.pos)
        .addScaledVector(closest.sample.normal, -(this.roadWidth * 0.5 + 1.65));

      const streetPole = this.createRealStreetPoleMesh(s.roadName, prevRoadName, roadYaw);
      streetPole.position.set(cornerPos.x, 0, cornerPos.z);
      this.osmSignsGroup.add(streetPole);

      // 2. Place an Overhead RPPJ Gantry Sign 35m BEFORE the turn so the driver sees it ahead!
      if (i > 0) {
        const preIdx = Math.max(0, closest.index - 8);
        const preSample = this.samples[preIdx];
        let arrow = '↑';
        if (s.modifier?.includes('left')) arrow = '↰';
        else if (s.modifier?.includes('right')) arrow = '↱';
        else if (s.maneuverType === 'roundabout' || s.maneuverType === 'rotary') arrow = '🔄';
        else if (s.maneuverType === 'arrive') arrow = '🏁';

        const gantry = this.createOverheadRPPJGantry(
          s.roadName,
          s.directionLabel || ' MENUJU',
          arrow,
          '35 m',
          preSample,
          i % 2 === 0 ? -1 : 1
        );
        this.osmSignsGroup.add(gantry);
      }
    }
  }

  /**
   * Places authentic street blade signs for every real named street / cross-street returned by Overpass API
   */
  placeRealOverpassStreetSigns(streets, converter, routeSteps = []) {
    const mainRouteName =
      routeSteps.find((s) => s.roadName && s.roadName !== 'Jalan Utama')?.roadName ||
      'Jalan Utama';

    const placedPositions = [];

    for (const st of streets) {
      // Find the node of this OSM street that is closest to our route corridor
      let bestNode = null;
      let bestSampleObj = null;
      let minDist = Infinity;

      for (const n of st.nodes) {
        const xz = converter.latLngToXZ(n.lat, n.lng);
        const closest = this.getClosestRoadPoint(new THREE.Vector3(xz.x, 0, xz.z));
        if (closest && closest.distanceFromCenter < minDist) {
          minDist = closest.distanceFromCenter;
          bestNode = xz;
          bestSampleObj = closest;
        }
      }

      if (!bestSampleObj || minDist > 42) continue;

      const sample = bestSampleObj.sample;
      // Avoid crowding poles too close together (< 28m)
      if (placedPositions.some((p) => p.distanceTo(sample.pos) < 28)) continue;
      placedPositions.push(sample.pos.clone());

      // Place on the side of the road where the intersecting street branches off
      const toStreetVec = new THREE.Vector3(
        bestNode.x - sample.pos.x,
        0,
        bestNode.z - sample.pos.z
      );
      const sideDot = toStreetVec.dot(sample.normal);
      const side = sideDot >= 0 ? 1 : -1;

      const polePos = new THREE.Vector3()
        .copy(sample.pos)
        .addScaledVector(sample.normal, side * (this.roadWidth * 0.5 + 1.65));

      const roadYaw = Math.atan2(sample.tangent.x, sample.tangent.z);
      const poleMesh = this.createRealStreetPoleMesh(st.name, mainRouteName, roadYaw);
      poleMesh.position.set(polePos.x, 0, polePos.z);
      this.osmSignsGroup.add(poleMesh);
    }
  }

  /**
   * Builds famous real-world 3D landmarks when their geographic coordinates are near the active route!
   */
  buildFamousLandmarksIfNearby(latLngPath, converter) {
    if (!latLngPath || latLngPath.length === 0) return;

    const isNearRoute = (lat, lng, thresholdDeg = 0.025) => {
      for (let i = 0; i < latLngPath.length; i += 3) {
        const dLat = Math.abs(latLngPath[i].lat - lat);
        const dLng = Math.abs(latLngPath[i].lng - lng);
        if (dLat < thresholdDeg && dLng < thresholdDeg) return true;
      }
      return false;
    };

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.1 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.35, metalness: 0.75 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.6 });

    // 1. MONAS (Monumen Nasional), Jakarta (-6.175392, 106.827153)
    if (isNearRoute(-6.175392, 106.827153)) {
      const xz = converter.latLngToXZ(-6.175392, 106.827153);
      // Offset slightly from road start if route starts right on Monas pin so car doesn't spawn inside base
      const closest = this.getClosestRoadPoint(new THREE.Vector3(xz.x, 0, xz.z));
      let mx = xz.x;
      let mz = xz.z;
      if (closest && closest.distanceFromCenter < 28) {
        mx += closest.sample.normal.x * 38;
        mz += closest.sample.normal.z * 38;
      }

      const monas = new THREE.Group();
      monas.position.set(mx, 0, mz);

      // Platform & Cawan (Goblet base)
      const baseStep = new THREE.Mesh(new THREE.BoxGeometry(36, 3.5, 36), marbleMat);
      baseStep.position.y = 1.75;
      const cawan = new THREE.Mesh(new THREE.CylinderGeometry(17, 10, 14, 8), marbleMat);
      cawan.position.y = 10.5;
      // Obelisk tower
      const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.2, 85, 4), marbleMat);
      obelisk.position.y = 58;
      // Observation deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.5, 7.2), marbleMat);
      deck.position.y = 101;
      // Lidah Api (Golden Flame)
      const flame = new THREE.Mesh(new THREE.ConeGeometry(2.6, 11, 16), this.facadeStyles.goldMat);
      flame.position.y = 108;

      monas.add(baseStep, cawan, obelisk, deck, flame);
      const sign = this.createBuildingNamePlaque('🇲🇨 MONUMEN NASIONAL (MONAS)');
      sign.position.set(0, 22, 19);
      monas.add(sign);
      this.routeGroup.add(monas);
    }

    // 2. BUNDARAN HI (Patung Selamat Datang & Kolam Air Mancur), Jakarta (-6.194980, 106.823050)
    if (isNearRoute(-6.194980, 106.823050)) {
      const xz = converter.latLngToXZ(-6.194980, 106.823050);
      const closest = this.getClosestRoadPoint(new THREE.Vector3(xz.x, 0, xz.z));
      let bx = xz.x;
      let bz = xz.z;
      if (closest && closest.distanceFromCenter < 24) {
        bx += closest.sample.normal.x * 26;
        bz += closest.sample.normal.z * 26;
      }

      const hiGroup = new THREE.Group();
      hiGroup.position.set(bx, 0, bz);

      const poolOuter = new THREE.Mesh(new THREE.CylinderGeometry(18, 19, 1.4, 32), marbleMat);
      poolOuter.position.y = 0.7;
      const waterPool = new THREE.Mesh(new THREE.CylinderGeometry(16.8, 16.8, 1.55, 32), waterMat);
      waterPool.position.y = 0.75;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 16, 16), marbleMat);
      pillar.position.y = 8.5;
      const statues = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.1, 9, 12), bronzeMat);
      statues.position.y = 20.5;

      hiGroup.add(poolOuter, waterPool, pillar, statues);
      const sign = this.createBuildingNamePlaque('⛲ BUNDARAN HI • PATUNG SELAMAT DATANG');
      sign.position.set(0, 15, 0);
      hiGroup.add(sign);
      this.routeGroup.add(hiGroup);
    }

    // 3. GEDUNG SATE, Bandung (-6.902481, 107.618810)
    if (isNearRoute(-6.902481, 107.618810)) {
      const xz = converter.latLngToXZ(-6.902481, 107.618810);
      const closest = this.getClosestRoadPoint(new THREE.Vector3(xz.x, 0, xz.z));
      let gx = xz.x;
      let gz = xz.z;
      if (closest && closest.distanceFromCenter < 26) {
        gx += closest.sample.normal.x * 32;
        gz += closest.sample.normal.z * 32;
      }

      const gs = new THREE.Group();
      gs.position.set(gx, 0, gz);

      const mainWing = new THREE.Mesh(new THREE.BoxGeometry(42, 12, 16), marbleMat);
      mainWing.position.y = 6;
      const roofMain = new THREE.Mesh(new THREE.ConeGeometry(24, 7, 4), this.facadeStyles.terracottaRoof);
      roofMain.rotation.y = Math.PI / 4;
      roofMain.scale.set(1.35, 1, 0.65);
      roofMain.position.y = 15.5;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 8), marbleMat);
      tower.position.y = 18;
      // Iconic Tusuk Sate Spire
      const skewer = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 8), this.facadeStyles.goldMat);
      skewer.position.y = 28;
      gs.add(mainWing, roofMain, tower, skewer);
      for (let k = 0; k < 6; k++) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), this.facadeStyles.goldMat);
        ball.position.y = 24.5 + k * 1.1;
        gs.add(ball);
      }
      const sign = this.createBuildingNamePlaque('🏛️ GEDUNG SATE BANDUNG');
      sign.position.set(0, 21, 10);
      gs.add(sign);
      this.routeGroup.add(gs);
    }

    // 4. TUGU JOGJA, Yogyakarta (-7.782889, 110.367083)
    if (isNearRoute(-7.782889, 110.367083)) {
      const xz = converter.latLngToXZ(-7.782889, 110.367083);
      const closest = this.getClosestRoadPoint(new THREE.Vector3(xz.x, 0, xz.z));
      let tx = xz.x;
      let tz = xz.z;
      if (closest && closest.distanceFromCenter < 12) {
        tx += closest.sample.normal.x * 14;
        tz += closest.sample.normal.z * 14;
      }
      const tugu = new THREE.Group();
      tugu.position.set(tx, 0, tz);
      const base = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), marbleMat);
      base.position.y = 1.5;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 2.2), marbleMat);
      shaft.position.y = 8;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4.5, 4), this.facadeStyles.goldMat);
      spire.rotation.y = Math.PI / 4;
      spire.position.y = 15.2;
      tugu.add(base, shaft, spire);
      const sign = this.createBuildingNamePlaque('🏛️ TUGU PAL PUTIH YOGYAKARTA');
      sign.position.set(0, 18.5, 0);
      tugu.add(sign);
      this.routeGroup.add(tugu);
    }
  }

  buildRoadRibbonMesh() {
    const n = this.samples.length;
    const halfW = this.roadWidth * 0.5;
    const curbW = 1.2;

    const positions = new Float32Array(n * 2 * 3);
    const uvs = new Float32Array(n * 2 * 2);
    const indices = [];

    const curbPositions = [];
    const curbIndices = [];

    for (let i = 0; i < n; i++) {
      const { pos, normal, cumDist } = this.samples[i];
      const left = new THREE.Vector3().copy(pos).addScaledVector(normal, -halfW);
      const right = new THREE.Vector3().copy(pos).addScaledVector(normal, halfW);

      positions[i * 6 + 0] = left.x;
      positions[i * 6 + 1] = 0.03;
      positions[i * 6 + 2] = left.z;

      positions[i * 6 + 3] = right.x;
      positions[i * 6 + 4] = 0.03;
      positions[i * 6 + 5] = right.z;

      const vCoord = cumDist / 14.0;
      uvs[i * 4 + 0] = 0;
      uvs[i * 4 + 1] = vCoord;
      uvs[i * 4 + 2] = 1;
      uvs[i * 4 + 3] = vCoord;

      if (i < n - 1) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, c, b, d, c);
      }

      const lOut = new THREE.Vector3().copy(pos).addScaledVector(normal, -(halfW + curbW));
      const rOut = new THREE.Vector3().copy(pos).addScaledVector(normal, halfW + curbW);
      const baseIdx = i * 4;
      curbPositions.push(
        lOut.x, 0.12, lOut.z,
        left.x, 0.12, left.z,
        right.x, 0.12, right.z,
        rOut.x, 0.12, rOut.z
      );
      if (i < n - 1) {
        const nb = (i + 1) * 4;
        curbIndices.push(
          baseIdx, baseIdx + 1, nb,
          baseIdx + 1, nb + 1, nb,
          baseIdx + 2, baseIdx + 3, nb + 2,
          baseIdx + 3, nb + 3, nb + 2
        );
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      roughness: 0.75,
      metalness: 0.08
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.routeGroup.add(roadMesh);

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    curbMesh.receiveShadow = true;
    this.routeGroup.add(curbMesh);
  }

  buildArchways(steps = []) {
    if (this.samples.length < 2) return;
    const startSample = this.samples[0];
    const endSample = this.samples[this.samples.length - 1];

    const startRoadName = steps[0]?.roadName || 'TITIK MULAI';
    const endRoadName = steps[steps.length - 1]?.roadName || 'TITIK TUJUAN';

    const startGantry = this.createOverheadRPPJGantry(
      startRoadName,
      'GARIS KEBERANGKATAN',
      '🚀',
      'START',
      startSample,
      -1
    );
    this.routeGroup.add(startGantry);

    const endGantry = this.createOverheadRPPJGantry(
      endRoadName,
      'GARIS TUJUAN AKHIR',
      '🏁',
      'FINISH',
      endSample,
      -1
    );
    this.routeGroup.add(endGantry);

    const beaconGeo = new THREE.CylinderGeometry(1.2, 1.2, 120, 16, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.finishBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.finishBeacon.position.set(endSample.pos.x, 60, endSample.pos.z);
    this.routeGroup.add(this.finishBeacon);
  }

  populateStreetlightsAndTrees() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.streetLightBulbs.push(bulbMat);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const stepStride = Math.max(Math.floor(this.samples.length / 220), 6);

    for (let i = 4; i < this.samples.length - 4; i += stepStride) {
      const sample = this.samples[i];
      const { pos, normal, tangent } = sample;
      const roadAngle = Math.atan2(tangent.x, tangent.z);

      // Streetlights on both sides
      [-1, 1].forEach((side) => {
        const lampPos = new THREE.Vector3().copy(pos).addScaledVector(normal, side * (this.roadWidth * 0.5 + 1.55));
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.2, 8), poleMat);
        pole.position.set(lampPos.x, 3.1, lampPos.z);
        this.routeGroup.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.11, 0.11), poleMat);
        arm.position.set(lampPos.x - side * 0.6, 6.1, lampPos.z);
        arm.rotation.y = roadAngle;
        this.routeGroup.add(arm);

        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.3), bulbMat);
        bulb.position.set(lampPos.x - side * 1.2, 6.0, lampPos.z);
        bulb.rotation.y = roadAngle;
        this.routeGroup.add(bulb);
      });

      // Roadside shade trees
      if (i % (stepStride * 2) === 0) {
        [-1, 1].forEach((side) => {
          const treePos = new THREE.Vector3()
            .copy(pos)
            .addScaledVector(normal, side * (this.roadWidth * 0.5 + 4.2));
          const treeGroup = new THREE.Group();
          treeGroup.position.set(treePos.x, 0, treePos.z);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.4, 7), trunkMat);
          trunk.position.y = 1.2;
          const crown = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 8), leafMat);
          crown.position.y = 3.6;
          treeGroup.add(trunk, crown);
          this.routeGroup.add(treeGroup);
        });
      }
    }
  }

  /**
   * Builds realistic architectural buildings (Ruko shophouses with pitched roofs, stepped towers)
   * as an instant visual baseline until Overpass API finishes loading real OSM footprints.
   */
  populateFallbackArchitecturalBuildings() {
    const isTooCloseToRoad = (x, z, minClearance) => {
      const minSq = minClearance * minClearance;
      for (let j = 0; j < this.samples.length; j += 3) {
        const sp = this.samples[j].pos;
        const dx = x - sp.x;
        const dz = z - sp.z;
        if (dx * dx + dz * dz < minSq) return true;
      }
      return false;
    };

    const stepStride = Math.max(Math.floor(this.samples.length / 120), 8);

    for (let i = 6; i < this.samples.length - 6; i += stepStride) {
      const { pos, normal, tangent } = this.samples[i];
      const roadAngle = Math.atan2(tangent.x, tangent.z);

      [-1, 1].forEach((side) => {
        const distFromCenter = this.roadWidth * 0.5 + 18 + (i % 7) * 2.5;
        const bx = pos.x + normal.x * side * distFromCenter;
        const bz = pos.z + normal.z * side * distFromCenter;

        if (isTooCloseToRoad(bx, bz, this.roadWidth * 0.5 + 10.5)) return;

        const bGroup = new THREE.Group();
        bGroup.position.set(bx, 0, bz);
        bGroup.rotation.y = roadAngle;

        if ((i + side) % 3 === 0) {
          // Stepped Modern Office Tower
          const podiumGeo = new THREE.BoxGeometry(16, 10, 14);
          applyMeterScaledUVs(podiumGeo, 6.0);
          const podium = new THREE.Mesh(podiumGeo, this.facadeStyles.apartments);
          podium.position.y = 5;

          const towerH = 26 + (i % 5) * 6;
          const towerGeo = new THREE.BoxGeometry(11, towerH, 10);
          applyMeterScaledUVs(towerGeo, 6.0);
          const tower = new THREE.Mesh(towerGeo, this.facadeStyles.officeGlass);
          tower.position.y = 10 + towerH * 0.5;

          const crown = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 7), this.facadeStyles.darkRoof);
          crown.position.y = 10 + towerH + 1.5;

          bGroup.add(podium, tower, crown);
        } else {
          // Indonesian Shophouse Row (Ruko 3 Lantai + Atap Genteng)
          const rukoW = 14;
          const rukoH = 11.5;
          const rukoD = 12;
          const bodyGeo = new THREE.BoxGeometry(rukoW, rukoH, rukoD);
          applyMeterScaledUVs(bodyGeo, 5.5);
          const body = new THREE.Mesh(bodyGeo, this.facadeStyles.commercialWarm);
          body.position.y = rukoH * 0.5;

          const roof = new THREE.Mesh(
            new THREE.ConeGeometry(rukoW * 0.65, 3.6, 4),
            this.facadeStyles.terracottaRoof
          );
          roof.rotation.y = Math.PI / 4;
          roof.position.y = rukoH + 1.8;

          bGroup.add(body, roof);
        }

        this.fallbackBuildingsGroup.add(bGroup);
      });
    }
  }

  getClosestRoadPoint(pos) {
    if (this.samples.length === 0) return null;
    let bestIdx = 0;
    let bestDistSq = Infinity;

    for (let i = 0; i < this.samples.length; i++) {
      const sp = this.samples[i].pos;
      const dx = pos.x - sp.x;
      const dz = pos.z - sp.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }

    return {
      index: bestIdx,
      sample: this.samples[bestIdx],
      distanceFromCenter: Math.sqrt(bestDistSq)
    };
  }

  updateTimeOfDay(minutesOfDay, playerPos) {
    const hours = (minutesOfDay / 60) % 24;
    const sunAngle = ((hours - 6) / 24) * Math.PI * 2;
    const sunElevation = Math.sin(sunAngle);
    const sunHorizontal = Math.cos(sunAngle);

    let skyColor = new THREE.Color();
    let groundColor = new THREE.Color();
    let sunLightColor = new THREE.Color();
    let sunIntensity = 1.0;
    let ambientIntensity = 0.7;
    let isNightOrDusk = false;
    let periodLabel = 'Siang';
    let periodIcon = '☀️';

    if (sunElevation > 0.25) {
      const t = Math.min((sunElevation - 0.25) / 0.75, 1);
      skyColor.lerpColors(new THREE.Color(0x60a5fa), new THREE.Color(0x38bdf8), t);
      groundColor.setHex(0x1e2e24);
      sunLightColor.setHex(0xfffbeb);
      sunIntensity = 1.15 + t * 0.45;
      ambientIntensity = 0.75 + t * 0.25;
      isNightOrDusk = false;
      periodLabel = hours < 11 ? 'Pagi' : hours < 15 ? 'Siang' : 'Sore';
      periodIcon = hours < 11 ? '🌤️' : '☀️';
    } else if (sunElevation > -0.12) {
      const t = (sunElevation + 0.12) / 0.37;
      skyColor.lerpColors(new THREE.Color(0x1e1b4b), new THREE.Color(0xf97316), t);
      groundColor.setHex(0x172026);
      sunLightColor.setHex(0xfb923c);
      sunIntensity = 0.35 + t * 0.75;
      ambientIntensity = 0.4 + t * 0.35;
      isNightOrDusk = t < 0.75;
      periodLabel = hours < 12 ? 'Subuh / Fajar' : 'Senja / Sore';
      periodIcon = hours < 12 ? '🌅' : '🌇';
    } else {
      skyColor.setHex(0x070b19);
      groundColor.setHex(0x090d16);
      sunLightColor.setHex(0x64748b);
      sunIntensity = 0.22;
      ambientIntensity = 0.32;
      isNightOrDusk = true;
      periodLabel = 'Malam';
      periodIcon = '🌙';
    }

    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(skyColor);
    }
    this.hemiLight.color.copy(skyColor);
    this.hemiLight.groundColor.copy(groundColor);
    this.hemiLight.intensity = ambientIntensity;

    this.dirLight.color.copy(sunLightColor);
    this.dirLight.intensity = sunIntensity;

    const anchorX = playerPos ? playerPos.x : 0;
    const anchorZ = playerPos ? playerPos.z : 0;
    const orbitDist = 360;
    const orbY = Math.max(Math.abs(sunElevation) * orbitDist, 45);
    const orbX = anchorX + sunHorizontal * orbitDist;
    const orbZ = anchorZ - 140;

    this.dirLight.position.set(orbX, orbY, orbZ);
    this.dirLight.target.position.set(anchorX, 0, anchorZ);
    this.dirLight.target.updateMatrixWorld();

    this.celestialOrb.position.set(
      anchorX + sunHorizontal * 650,
      Math.max(sunElevation * 550, 60),
      anchorZ - 550
    );
    this.orbMat.color.setHex(sunElevation >= -0.05 ? 0xfde047 : 0xe2e8f0);

    const windowGlow = isNightOrDusk ? 0.9 : 0.05;
    for (const m of this.buildingMaterials) {
      m.emissiveIntensity = windowGlow;
    }
    for (const b of this.streetLightBulbs) {
      b.color.setHex(isNightOrDusk ? 0xfef08a : 0x64748b);
    }

    return {
      isNightOrDusk,
      periodLabel,
      periodIcon
    };
  }
}
