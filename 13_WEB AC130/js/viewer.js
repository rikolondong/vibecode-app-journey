import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAC130Model, applyExplode } from './ac130Model.js';

// Generate a procedural sky/hangar environment texture for realistic metallic & glass reflections
function createProceduralEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0b1524);

  const skyGeo = new THREE.SphereGeometry(40, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f, side: THREE.BackSide });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  const stripMat1 = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
  const strip1 = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), stripMat1);
  strip1.position.set(10, 22, 12);
  strip1.lookAt(0, 0, 0);
  envScene.add(strip1);

  const stripMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const strip2 = new THREE.Mesh(new THREE.PlaneGeometry(25, 6), stripMat2);
  strip2.position.set(-15, 14, -18);
  strip2.lookAt(0, 0, 0);
  envScene.add(strip2);

  const stripMat3 = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const strip3 = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), stripMat3);
  strip3.position.set(0, -18, -10);
  strip3.lookAt(0, 0, 0);
  envScene.add(strip3);

  const envTexture = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return envTexture;
}

const GROUND_Y = -2.78;
const ORBIT_RADIUS = 36.0;
const ORBIT_ALTITUDE = 24.5;
const ORBIT_BANK_ANGLE = -Math.atan2(ORBIT_ALTITUDE - GROUND_Y, ORBIT_RADIUS); // ~-37.15 deg left bank so port (-Z) weapons point directly at center (0, GROUND_Y, 0)

export class AC130Viewer {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas #${canvasId} not found`);

    this.options = {
      onSelectPart: options.onSelectPart || (() => {}),
      onExplodeChange: options.onExplodeChange || (() => {}),
      onModeChange: options.onModeChange || (() => {}),
      ...options
    };

    this.explodeValue = 0;
    this.targetExplode = 0;
    this.isRotating = true;
    this.selectedPartId = null;
    this.nightVisionMode = false;
    this.xrayMode = false;
    this.cutawayMode = false;
    this.pylonTurnMode = false;
    this.pylonAngle = 0;

    // Feature: Camera Follow (Chase Camera for Pylon Turn Orbit)
    this.cameraFollowMode = false;
    this._lastFollowTarget = null;

    // Feature 1: Stop / Pause Aircraft Animation & Flight
    this.isPaused = false;

    // Feature 2: Realistic Flight Atmosphere (High-Speed Wind Streaks & Volumetric Fluffy Clouds)
    this.flightEnvMode = false;
    this.windParticles = null;
    this.cloudGroup = null;

    // Feature 3: Angel Wing Flare Pattern Defenses
    this.angelFlares = [];

    // Feature 4: First-Person Shooter (FPS) Gunner Cockpit Station
    this.fpsGunnerMode = false;
    this.fpsAngles = { yaw: 0, pitch: -0.45 };
    this.fpsMount = new THREE.Object3D();
    this.savedCameraState = null;
    this.activeWeapon = 'both';
    this.ammo = {
      '105': 96,
      '40': 256,
      '30': 1840
    };
    this._lastZulu = 0;

    // Live-fire ballistic projectiles & shockwaves
    this.projectiles = [];
    this.shockwaves = [];
    this.lastFire30 = 0;
    this.lastFire40 = 0;
    this.lastFire105 = 0;
    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initModel();
    this.initTacticalEffects();
    this.initFlightAtmosphere();
    this.initControls();
    this.initRaycasting();
    this.initFPSListeners();

    // Aim guns at initial hangar calibration point so barrels look naturally aligned
    this.aimGunsAtWorldPoint(new THREE.Vector3(-0.5, GROUND_Y, -15.5));

    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    window.addEventListener('resize', this.onWindowResize);
    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }

    this.onWindowResize();
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a10);
    this.scene.fog = new THREE.FogExp2(0x060a10, 0.0035);

    const parent = this.canvas.parentElement;
    const width = (parent && parent.clientWidth) || window.innerWidth;
    const height = (parent && parent.clientHeight) || 680;

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 550);
    // Initial camera looking at the port-forward side (-Z / +X) so the gunship weapons & stepped C-130 nose are immediately visible
    this.camera.position.set(22, 9.5, -26);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.scene.environment = createProceduralEnvMap(this.renderer);

    // Ground & Tactical Target Environment Group
    this.groundGroup = new THREE.Group();
    this.groundGroup.position.y = GROUND_Y;
    this.scene.add(this.groundGroup);

    // Dark tarmac / terrain plane for shadows
    const floorGeo = new THREE.CircleGeometry(130, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    this.groundGroup.add(floorMesh);

    // Tactical Grid
    const gridHelper = new THREE.GridHelper(160, 64, 0x00e5ff, 0x132235);
    gridHelper.position.y = 0.02;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.42;
    this.groundGroup.add(gridHelper);

    // Concentric Tactical Radar / Pylon Turn Range Rings around (0, GROUND_Y, 0)
    const ringMatCyan = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    [10, 22, ORBIT_RADIUS, 50].forEach(r => {
      const rGeo = new THREE.RingGeometry(r, r + 0.14, 72);
      rGeo.rotateX(-Math.PI / 2);
      const rMesh = new THREE.Mesh(rGeo, ringMatCyan);
      rMesh.position.y = 0.04;
      this.groundGroup.add(rMesh);
    });

    // Central Target Bullseye & 3D Target Compound at (0, GROUND_Y, 0) for Pylon Turn!
    this.targetZone = new THREE.Group();
    this.targetZone.position.set(0, 0.05, 0);

    const tgtRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const tgtAmberMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });

    const tgtOuter = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.45, 48).rotateX(-Math.PI / 2), tgtRingMat);
    const tgtMid = new THREE.Mesh(new THREE.RingGeometry(1.8, 1.98, 40).rotateX(-Math.PI / 2), tgtAmberMat);
    const tgtInner = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.82, 32).rotateX(-Math.PI / 2), tgtRingMat);
    const crossH = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.12).rotateX(-Math.PI / 2), tgtRingMat);
    const crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 8.5).rotateX(-Math.PI / 2), tgtRingMat);

    // 3D Target Bunker & Hostile Technical Vehicle Silhouette inside the bullseye
    const bunkerMat = new THREE.MeshStandardMaterial({ color: 0x3b2f2f, roughness: 0.75, metalness: 0.2, emissive: 0x220808 });
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 1.6), bunkerMat);
    bunker.position.set(0, 0.42, 0);
    bunker.castShadow = true;
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.35, 12), bunkerMat);
    roof.position.set(0.3, 0.98, 0);
    this.targetZone.add(tgtOuter, tgtMid, tgtInner, crossH, crossV, bunker, roof);
    this.targetZone.visible = false;
    this.groundGroup.add(this.targetZone);

    // 3D Aerial Orbit Flight Path Ring at (0, ORBIT_ALTITUDE, 0) with radius ORBIT_RADIUS
    this.orbitPathGroup = new THREE.Group();
    this.orbitPathGroup.position.set(0, ORBIT_ALTITUDE, 0);
    const orbitRingGeo = new THREE.RingGeometry(ORBIT_RADIUS - 0.12, ORBIT_RADIUS + 0.12, 96);
    orbitRingGeo.rotateX(-Math.PI / 2);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    this.orbitPathGroup.add(new THREE.Mesh(orbitRingGeo, orbitRingMat));

    // Directional Chevrons along the circular orbit showing counter-clockwise left pylon turn path
    const arrowGeo = new THREE.ConeGeometry(0.42, 1.1, 8);
    arrowGeo.rotateZ(-Math.PI / 2); // Point along +X
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(ORBIT_RADIUS * Math.sin(a), 0, ORBIT_RADIUS * Math.cos(a));
      arrow.rotation.y = a; // Tangent to orbit!
      this.orbitPathGroup.add(arrow);
    }

    // Vertical projection pillars connecting sky orbit ring to ground ring
    const pillarMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.2 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = ORBIT_RADIUS * Math.sin(a);
      const pz = ORBIT_RADIUS * Math.cos(a);
      const pGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(px, 0, pz),
        new THREE.Vector3(px, GROUND_Y - ORBIT_ALTITUDE, pz)
      ]);
      this.orbitPathGroup.add(new THREE.Line(pGeo, pillarMat));
    }

    this.orbitPathGroup.visible = false;
    this.scene.add(this.orbitPathGroup);
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.15);
    this.scene.add(this.hemiLight);

    // Main Key Light
    this.keyLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    this.keyLight.position.set(22, 38, -28);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 8;
    this.keyLight.shadow.camera.far = 110;
    this.keyLight.shadow.camera.left = -35;
    this.keyLight.shadow.camera.right = 35;
    this.keyLight.shadow.camera.top = 35;
    this.keyLight.shadow.camera.bottom = -35;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Starboard-Aft Cyan Rim Light
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.45);
    this.rimLight.position.set(-28, 14, 26);
    this.scene.add(this.rimLight);

    // Warm Under-belly Fill Light
    this.fillLight = new THREE.DirectionalLight(0xf59e0b, 0.65);
    this.fillLight.position.set(8, -18, -12);
    this.scene.add(this.fillLight);

    // Dynamic Muzzle Flash PointLight
    this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 22);
    this.scene.add(this.muzzleLight);
  }

  initModel() {
    // Flight Attitude Pivot Group (YXZ order so heading Y is applied first, then bank X!)
    this.flightGroup = new THREE.Group();
    this.flightGroup.rotation.order = 'YXZ';
    this.scene.add(this.flightGroup);

    this.modelData = createAC130Model(() => {
      applyExplode(this.modelData, this.explodeValue);
      if (this.modelData.setGearExtended) {
        this.modelData.setGearExtended(!this.pylonTurnMode);
      }
      if (this.cutawayMode) {
        this.toggleCutaway(true);
      }
      if (this.xrayMode) {
        this.modelData.root.traverse(c => {
          if (c.isMesh && c.material) c.material.wireframe = true;
        });
      }
      if (this.pylonTurnMode) {
        this.updatePylonOrbitTransform(this.pylonAngle);
      } else {
        this.aimGunsAtWorldPoint(new THREE.Vector3(-0.5, GROUND_Y, -15.5));
      }
      if (this.selectedPartId) {
        this.selectPart(this.selectedPartId, false);
      }
    });
    this.flightGroup.add(this.modelData.root);
    applyExplode(this.modelData, 0);
  }

  initTacticalEffects() {
    // 1. AN/AAQ-38 FLIR Laser Target Designator Beam (Green)
    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x10ff68,
      transparent: true,
      opacity: 0.8,
    });
    this.laserBeam = new THREE.Line(laserGeo, laserMat);
    this.laserBeam.frustumCulled = false;
    this.laserBeam.visible = false;
    this.scene.add(this.laserBeam);

    // 2. Ballistic Convergence Sight Lines from the 3 Port-Side Guns to the Central Target
    const makeSightLine = (colorHex, opacity) => {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const m = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity });
      const l = new THREE.Line(g, m);
      l.frustumCulled = false;
      l.visible = false;
      this.scene.add(l);
      return l;
    };
    this.sightLines = {
      gun30: makeSightLine(0x38bdf8, 0.35),
      gun40: makeSightLine(0xf59e0b, 0.35),
      gun105: makeSightLine(0xef4444, 0.45),
    };

    // 3. Muzzle Flash Cones aligned strictly along each barrel's -Z axis
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffdd55,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.flash30 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.3, 12).rotateX(-Math.PI / 2), flashMat.clone());
    this.flash30.position.set(0, 0, -0.65);
    this.modelData.muzzles.gun30.add(this.flash30);

    this.flash40 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.6, 12).rotateX(-Math.PI / 2), flashMat.clone());
    this.flash40.position.set(0, 0, -0.80);
    this.modelData.muzzles.gun40.add(this.flash40);

    this.flash105 = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.8, 16).rotateX(-Math.PI / 2), flashMat.clone());
    this.flash105.position.set(0, 0, -1.40);
    this.modelData.muzzles.gun105.add(this.flash105);
  }

  initFlightAtmosphere() {
    // 1. High-Speed Wind Particle Streaks (Speed Lines)
    const windCount = 350;
    const windGeo = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windCount * 6);
    this.windVelocities = new Float32Array(windCount);

    for (let i = 0; i < windCount; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 20 + ORBIT_ALTITUDE;
      const z = (Math.random() - 0.5) * 100;
      const len = 4.0 + Math.random() * 6.0;

      windPositions[i * 6] = x;
      windPositions[i * 6 + 1] = y;
      windPositions[i * 6 + 2] = z;
      windPositions[i * 6 + 3] = x - len;
      windPositions[i * 6 + 4] = y;
      windPositions[i * 6 + 5] = z;
      this.windVelocities[i] = 45 + Math.random() * 35;
    }

    windGeo.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    const windMat = new THREE.LineBasicMaterial({
      color: 0xcde8ff,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });
    this.windLines = new THREE.LineSegments(windGeo, windMat);
    this.windLines.frustumCulled = false;
    this.windLines.visible = false;
    this.scene.add(this.windLines);

    // 2. Realistic Low-Altitude Volumetric Fluffy Clouds (floating beneath the high-altitude gunship)
    this.cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x90a4ae,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });

    const puffGeo = new THREE.DodecahedronGeometry(1, 1);
    this.cloudClusters = [];

    for (let c = 0; c < 16; c++) {
      const cluster = new THREE.Group();
      const numPuffs = 8 + Math.floor(Math.random() * 8);
      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        const s = 4.5 + Math.random() * 6.0;
        puff.scale.set(s * (1 + Math.random() * 0.4), s * 0.55, s * (1 + Math.random() * 0.4));
        puff.position.set(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 14
        );
        puff.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        cluster.add(puff);
      }
      cluster.position.set(
        (Math.random() - 0.5) * 160,
        6.5 + Math.random() * 6.5, // Authentic cloud deck floating beneath the gunship (y = 6.5 to 13)
        (Math.random() - 0.5) * 160
      );
      this.cloudGroup.add(cluster);
      this.cloudClusters.push(cluster);
    }

    this.cloudGroup.visible = false;
    this.scene.add(this.cloudGroup);
  }

  initFPSListeners() {
    // Keyboard listener for FPS firing [Space], weapons [1-4], FLIR vision [V], Angel Flares [F], ESC/Q
    window.addEventListener('keydown', (e) => {
      if (this.fpsGunnerMode) {
        if (e.code === 'Space') {
          e.preventDefault();
          this.fireSalvo(this.activeWeapon || 'both');
        } else if (e.code === 'Digit1') {
          this.setActiveWeapon('105');
        } else if (e.code === 'Digit2') {
          this.setActiveWeapon('40');
        } else if (e.code === 'Digit3') {
          this.setActiveWeapon('30');
        } else if (e.code === 'Digit4') {
          this.setActiveWeapon('both');
        } else if (e.code === 'KeyF') {
          e.preventDefault();
          this.launchAngelWingFlares();
        } else if (e.code === 'KeyV') {
          const nvg = this.toggleNightVision();
          const vEl = document.getElementById('fpsVisionMode');
          if (vEl) {
            vEl.textContent = nvg ? 'SENSOR: NVG / GREEN FLIR' : 'SENSOR: IR WHITE-HOT';
          }
        } else if (e.code === 'Escape' || e.code === 'KeyQ') {
          this.toggleFPSGunner(false);
        }
      }
    });

    // Pointer Lock change listener: automatic clean exit when ESC or system releases lock
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === this.canvas;
      if (!isLocked && this.fpsGunnerMode) {
        this.toggleFPSGunner(false);
      }
    });

    // Mouse aim listener inside FPS Gunner station (Pointer Lock delta accumulation for boundary-free aim)
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.fpsGunnerMode) return;

      if (document.pointerLockElement === this.canvas) {
        const dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        const sens = 0.0022; // Precision FLIR aiming sensitivity
        this.fpsAngles.yaw += dx * sens;
        this.fpsAngles.pitch -= dy * sens;

        // Elevation clamp: -78° (steep down toward ground target) to +8° (above horizon)
        this.fpsAngles.pitch = THREE.MathUtils.clamp(this.fpsAngles.pitch, -1.35, 0.15);
        // Azimuth clamp: ±78° wide port-side scanning arc
        this.fpsAngles.yaw = THREE.MathUtils.clamp(this.fpsAngles.yaw, -1.35, 1.35);
      } else {
        // Fallback before pointer lock acquires
        const rect = this.canvas.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        this.fpsAngles.yaw = nx * 0.78;
        this.fpsAngles.pitch = THREE.MathUtils.clamp(-ny * 0.5 - 0.58, -1.35, 0.15);
      }
    });

    // Click canvas to fire weapons & request Pointer Lock if not locked
    this.canvas.addEventListener('click', () => {
      if (this.fpsGunnerMode) {
        if (document.pointerLockElement !== this.canvas) {
          try {
            this.canvas.requestPointerLock();
          } catch (err) {
            // ignore
          }
        }
        this.fireSalvo(this.activeWeapon || 'both');
      }
    });

    // Mouse wheel to quickly cycle weapons
    window.addEventListener('wheel', (e) => {
      if (!this.fpsGunnerMode) return;
      e.preventDefault();
      const weapons = ['both', '105', '40', '30'];
      const curIdx = weapons.indexOf(this.activeWeapon || 'both');
      const delta = e.deltaY > 0 ? 1 : -1;
      let nextIdx = (curIdx + delta) % weapons.length;
      if (nextIdx < 0) nextIdx += weapons.length;
      this.setActiveWeapon(weapons[nextIdx]);
    }, { passive: false });

    // Weapon items click handlers
    document.querySelectorAll('.fps-weapon-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActiveWeapon(item.dataset.weapon);
      });
    });

    // Exit Gunner Mode button
    const exitBtn = document.getElementById('btnExitFPS');
    if (exitBtn) {
      exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFPSGunner(false);
      });
    }
  }

  setActiveWeapon(weaponKey) {
    this.activeWeapon = weaponKey;
    document.querySelectorAll('.fps-weapon-item').forEach(item => {
      item.classList.toggle('active', item.dataset.weapon === weaponKey);
    });
  }

  // Exact 2-Axis Gimbal Mathematics (`YXZ` Euler) so every port-side gun barrel (-Z axis) points 100% collinearly at `targetWorld`!
  aimGunsAtWorldPoint(targetWorld) {
    this.flightGroup.updateMatrixWorld(true);
    const mounts = this.modelData.gunMounts;
    if (!mounts) return;

    ['gun30', 'gun40', 'gun105'].forEach(key => {
      const mount = mounts[key];
      if (!mount || !mount.parent) return;
      // Convert targetWorld into mount.parent space and subtract mount's local position offset
      const targetInParent = mount.parent.worldToLocal(targetWorld.clone()).sub(mount.position);
      const dir = targetInParent.normalize();
      // Only aim if target is on the port (-Z) hemisphere
      if (dir.z < -0.1) {
        mount.rotation.x = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(dir.y, -0.98, 0.98)), -0.75, 0.25);
        mount.rotation.y = THREE.MathUtils.clamp(Math.atan2(-dir.x, -dir.z), -0.55, 0.55);
      }
    });
    this.flightGroup.updateMatrixWorld(true);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 95;
    this.controls.target.set(0, 0.4, 0);
    this.controls.autoRotate = this.isRotating;
    this.controls.autoRotateSpeed = 0.85;
  }

  initRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let downTime = 0;

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.fpsGunnerMode) return;
      downX = e.clientX;
      downY = e.clientY;
      downTime = performance.now();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.fpsGunnerMode) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.modelData.root.children, true);
      let foundPartId = null;
      for (const hit of intersects) {
        if (hit.object.isLine) continue;
        let cur = hit.object;
        while (cur && cur !== this.modelData.root) {
          if (cur.userData && cur.userData.partId) {
            foundPartId = cur.userData.partId;
            break;
          }
          cur = cur.parent;
        }
        if (foundPartId) break;
      }
      this.canvas.style.cursor = foundPartId ? 'pointer' : 'grab';
    });

    this.canvas.addEventListener('pointerup', (e) => {
      if (this.fpsGunnerMode) return;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      const elapsed = performance.now() - downTime;
      if (dist > 6 || elapsed > 500) return;

      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.modelData.root.children, true);

      for (const hit of intersects) {
        if (hit.object.isLine) continue;
        let current = hit.object;
        while (current && current !== this.modelData.root) {
          if (current.userData && current.userData.partId) {
            this.selectPart(current.userData.partId, true);
            return;
          }
          current = current.parent;
        }
      }
    });
  }

  selectPart(partId, focusCamera = false) {
    this.selectedPartId = partId;
    const part = this.modelData.parts.find(p => p.id === partId);

    this.clearHighlight();

    if (part) {
      part.items.forEach(item => {
        item.obj.traverse(child => {
          if (child.isMesh && child.material && !child.userData.isPropBlur) {
            if (!child.userData.origMaterial) {
              child.userData.origMaterial = child.material;
            }
            const hlMat = child.material.clone();
            hlMat.wireframe = this.xrayMode;
            if (hlMat.emissive) {
              hlMat.emissive = new THREE.Color(0x00e5ff);
              hlMat.emissiveIntensity = 0.55;
            } else if (hlMat.color) {
              hlMat.color = new THREE.Color(0x00e5ff);
            }
            child.material = hlMat;
          }
        });
      });

      if (focusCamera && !this.pylonTurnMode) {
        const box = new THREE.Box3();
        part.items.forEach(it => box.expandByObject(it.obj));
        const center = box.getCenter(new THREE.Vector3());
        this.animateTargetTo(center);
      }

      this.options.onSelectPart(part);
    }
  }

  clearHighlight() {
    this.modelData.parts.forEach(p => {
      p.items.forEach(item => {
        item.obj.traverse(child => {
          if (child.isMesh && child.userData.origMaterial) {
            child.userData.origMaterial.wireframe = this.xrayMode;
            child.material = child.userData.origMaterial;
            delete child.userData.origMaterial;
          }
        });
      });
    });
  }

  setExplode(val, smooth = true) {
    if (this.pylonTurnMode && val > 0.01) {
      // Exit Pylon Turn mode automatically if user drags ExplodeView slider
      this.togglePylonTurn(false);
    }
    this.targetExplode = THREE.MathUtils.clamp(val, 0, 1);
    if (!smooth) {
      this.explodeValue = this.targetExplode;
      applyExplode(this.modelData, this.explodeValue);
      this.options.onExplodeChange(this.explodeValue);
    }
  }

  setCameraPreset(preset) {
    if (this.pylonTurnMode) {
      this.togglePylonTurn(false);
    }
    const targets = {
      default: { pos: [22, 9.5, -26], target: [0, 0.4, 0], autoRotate: true },
      front:   { pos: [26, 2.2, -7],  target: [9.5, -0.2, 0], autoRotate: false },
      weapons: { pos: [-1.5, -1.2, -16.5], target: [0.0, -0.7, -1.8], autoRotate: false },
      cockpit: { pos: [8.5, 4.5, 11.5], target: [2.2, 0.2, 0.5], autoRotate: false },
      top:     { pos: [0.1, 44, -0.1], target: [0, 0, 0], autoRotate: false },
      tail:    { pos: [-26, 6.5, -12], target: [-10, 2.2, 0], autoRotate: false }
    };

    const cfg = targets[preset] || targets.default;
    if (preset === 'cockpit' && this.targetExplode < 0.15 && !this.cutawayMode) {
      this.toggleCutaway(true);
    }
    this.isRotating = cfg.autoRotate;
    this.controls.autoRotate = cfg.autoRotate;
    this.animateCameraTo(cfg.pos, cfg.target);
    this.options.onModeChange({ isRotating: this.isRotating, cutawayMode: this.cutawayMode, pylonTurnMode: this.pylonTurnMode });
  }

  animateTargetTo(endTarget) {
    const startTarget = this.controls.target.clone();
    const duration = 550;
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 0.5 - Math.cos(t * Math.PI) / 2;
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  animateCameraTo(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const endPos = new THREE.Vector3(...targetPos);
    const startTarget = this.controls.target.clone();
    const endTarget = new THREE.Vector3(...targetLookAt);

    const duration = 750;
    const startTime = performance.now();

    const updateCam = () => {
      const now = performance.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);

      if (progress < 1) {
        requestAnimationFrame(updateCam);
      }
    };
    requestAnimationFrame(updateCam);
  }

  toggleAutoRotate() {
    this.isRotating = !this.isRotating;
    this.controls.autoRotate = this.isRotating;
    return this.isRotating;
  }

  toggleCutaway(forceState) {
    this.cutawayMode = typeof forceState === 'boolean' ? forceState : !this.cutawayMode;
    const upperPart = this.modelData.parts.find(p => p.id === 'upper');
    if (upperPart) {
      upperPart.items.forEach(it => {
        it.obj.visible = !this.cutawayMode;
      });
    }
    return this.cutawayMode;
  }

  togglePylonTurn(forceState) {
    this.pylonTurnMode = typeof forceState === 'boolean' ? forceState : !this.pylonTurnMode;
    this.targetZone.visible = this.pylonTurnMode;
    this.orbitPathGroup.visible = this.pylonTurnMode;
    this.laserBeam.visible = this.pylonTurnMode;
    Object.values(this.sightLines).forEach(l => {
      l.visible = this.pylonTurnMode;
    });

    // Retract landing gear into wheel bays during Pylon Turn flight, extend in hangar mode
    if (this.modelData.setGearExtended) {
      this.modelData.setGearExtended(!this.pylonTurnMode);
    }

    if (this.pylonTurnMode) {
      this.targetExplode = 0;
      this.explodeValue = 0;
      applyExplode(this.modelData, 0);
      this.options.onExplodeChange(0);

      // Place aircraft on the circular orbit path and frame the entire Pylon Turn cone!
      this.updatePylonOrbitTransform(this.pylonAngle);
      this.isRotating = false;
      this.controls.autoRotate = false;
      this.animateCameraTo([0, 38, 75], [0, 5.0, 0]);
    } else {
      // Return aircraft to center hangar floor level
      this.cameraFollowMode = false;
      this._lastFollowTarget = null;
      this.flightGroup.position.set(0, 0, 0);
      this.flightGroup.rotation.set(0, 0, 0);
      this.aimGunsAtWorldPoint(new THREE.Vector3(-0.5, GROUND_Y, -15.5));
      this.animateCameraTo([22, 9.5, -26], [0, 0.4, 0]);
    }

    this.options.onModeChange({
      isRotating: this.isRotating,
      cutawayMode: this.cutawayMode,
      pylonTurnMode: this.pylonTurnMode,
      cameraFollowMode: this.cameraFollowMode
    });
    return this.pylonTurnMode;
  }

  // Compute exact position, tangent heading, left bank angle, and gun gimbal lock for orbit angle psi
  updatePylonOrbitTransform(psi) {
    const x = ORBIT_RADIUS * Math.sin(psi);
    const z = ORBIT_RADIUS * Math.cos(psi);
    const y = ORBIT_ALTITUDE + Math.sin(psi * 3) * 0.15;

    this.flightGroup.position.set(x, y, z);
    // With rotation.order = 'YXZ':
    // rotation.y = psi aligns +X (Nose) with tangent (cos(psi), 0, -sin(psi)) and -Z (Port Guns) inward toward (0, y, 0)!
    // rotation.x = ORBIT_BANK_ANGLE banks the port wing (-Z) downward toward (0, GROUND_Y, 0)!
    this.flightGroup.rotation.y = psi;
    this.flightGroup.rotation.x = ORBIT_BANK_ANGLE;
    this.flightGroup.rotation.z = 0;

    // Continuously aim all 3 port-side gun mounts directly at the central ground target (0, GROUND_Y, 0)
    const centerTarget = new THREE.Vector3(0, GROUND_Y + 0.25, 0);
    this.aimGunsAtWorldPoint(centerTarget);

    // Update AN/AAQ-38 FLIR Laser Designator Beam
    const sPos = new THREE.Vector3();
    this.modelData.sensorMarker.getWorldPosition(sPos);
    const lAttr = this.laserBeam.geometry.attributes.position;
    lAttr.setXYZ(0, sPos.x, sPos.y, sPos.z);
    lAttr.setXYZ(1, centerTarget.x, centerTarget.y, centerTarget.z);
    lAttr.needsUpdate = true;

    // Update Ballistic Sight Lines from each gun muzzle along its exact barrel vector to ground
    ['gun30', 'gun40', 'gun105'].forEach(key => {
      const muzzle = this.modelData.muzzles[key];
      const line = this.sightLines[key];
      if (!muzzle || !line) return;
      const { mPos, hitPoint } = this.getMuzzleRayHit(muzzle);
      const attr = line.geometry.attributes.position;
      attr.setXYZ(0, mPos.x, mPos.y, mPos.z);
      attr.setXYZ(1, hitPoint.x, hitPoint.y, hitPoint.z);
      attr.needsUpdate = true;
    });
  }

  // Compute exact world muzzle position, barrel direction (-Z local), and ground impact point
  getMuzzleRayHit(muzzleObj, spreadRad = 0) {
    const mPos = new THREE.Vector3();
    const mQuat = new THREE.Quaternion();
    muzzleObj.getWorldPosition(mPos);
    muzzleObj.getWorldQuaternion(mQuat);

    // Barrel points strictly along local -Z
    const barrelDir = new THREE.Vector3(0, 0, -1).applyQuaternion(mQuat).normalize();
    if (spreadRad > 0) {
      barrelDir.x += (Math.random() - 0.5) * spreadRad;
      barrelDir.y += (Math.random() - 0.5) * spreadRad * 0.5;
      barrelDir.z += (Math.random() - 0.5) * spreadRad;
      barrelDir.normalize();
    }

    // Intersect ray (mPos + t * barrelDir) with ground plane y = GROUND_Y + 0.08
    const planeY = GROUND_Y + 0.08;
    const t = barrelDir.y < -0.02 ? (planeY - mPos.y) / barrelDir.y : 30.0;
    const hitPoint = mPos.clone().addScaledVector(barrelDir, Math.max(2, Math.min(t, 80)));

    return { mPos, barrelDir, hitPoint };
  }

  // Trigger a live weapon salvo along the exact gun barrel axes!
  fireSalvo(type = 'both') {
    if (!this.pylonTurnMode && this.explodeValue > 0.02) {
      this.setExplode(0, false);
    }

    // Ensure gun mounts are aimed properly before firing (if not in FPS mode, which aims dynamically in animate)
    if (!this.fpsGunnerMode) {
      if (this.pylonTurnMode) {
        this.aimGunsAtWorldPoint(new THREE.Vector3(0, GROUND_Y + 0.25, 0));
      } else {
        this.aimGunsAtWorldPoint(new THREE.Vector3(-0.5, GROUND_Y, -15.5));
      }
    }

    // FPS Gunner HUD Visual & Recoil Feedback
    if (this.fpsGunnerMode) {
      const hud = document.getElementById('fpsGunnerHUD');
      if (hud) {
        hud.classList.add('hud-recoil-flash');
        setTimeout(() => hud.classList.remove('hud-recoil-flash'), 160);
      }
      const dot = document.getElementById('fpsCrossDot');
      if (dot) {
        dot.style.transform = 'translate(-50%, -50%) scale(2.4)';
        setTimeout(() => dot.style.transform = 'translate(-50%, -50%) scale(1)', 120);
      }

      // Decrement ammo counters
      if (type === '105' || type === 'both') {
        this.ammo['105'] = Math.max(0, this.ammo['105'] - 1);
        const a105 = document.getElementById('ammo105');
        if (a105) a105.textContent = `${this.ammo['105']} RDS`;
      }
      if (type === '40' || type === 'both') {
        this.ammo['40'] = Math.max(0, this.ammo['40'] - 2);
        const a40 = document.getElementById('ammo40');
        if (a40) a40.textContent = `${this.ammo['40']} RDS`;
      }
      if (type === '30' || type === 'both') {
        this.ammo['30'] = Math.max(0, this.ammo['30'] - 6);
        const a30 = document.getElementById('ammo30');
        if (a30) a30.textContent = `${this.ammo['30']} RDS`;
      }
    }

    // 1. Fire 105mm M102 Howitzer
    if (type === '105' || type === 'both') {
      const { mPos, hitPoint } = this.getMuzzleRayHit(this.modelData.muzzles.gun105, 0.008);
      this.spawnProjectile(mPos, hitPoint, '105');
      this.flash105.material.opacity = 1.0;
      this.muzzleLight.position.copy(mPos);
      this.muzzleLight.intensity = 15;
      if (this.modelData.recoilParts && this.modelData.recoilParts.gun105) {
        this.modelData.recoilParts.gun105.position.z = 0.58; // Heavy hydropneumatic recoil kick!
      }
    }

    // 2. Fire 40mm L/60 Bofors Cannon
    if (type === '40' || type === 'both') {
      setTimeout(() => {
        if (!this.modelData) return;
        const { mPos, hitPoint } = this.getMuzzleRayHit(this.modelData.muzzles.gun40, 0.015);
        this.spawnProjectile(mPos, hitPoint, '40');
        this.flash40.material.opacity = 0.95;
        if (this.modelData.recoilParts && this.modelData.recoilParts.gun40) {
          this.modelData.recoilParts.gun40.position.z = 0.28;
        }
      }, 140);
    }

    // 3. Fire 30mm GAU-23/A Chain Gun Burst (3 rapid rounds)
    if (type === '30' || type === 'both') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!this.modelData) return;
          const { mPos, hitPoint } = this.getMuzzleRayHit(this.modelData.muzzles.gun30, 0.022);
          this.spawnProjectile(mPos, hitPoint, '30');
          this.flash30.material.opacity = 0.92;
          if (this.modelData.recoilParts && this.modelData.recoilParts.gun30) {
            this.modelData.recoilParts.gun30.position.z = 0.16;
          }
        }, i * 95);
      }
    }
  }

  spawnProjectile(start, end, caliber) {
    const is105 = caliber === '105';
    const is40 = caliber === '40';
    const radius = is105 ? 0.12 : is40 ? 0.08 : 0.05;
    const length = is105 ? 2.2 : is40 ? 1.5 : 1.1;
    const color = is105 ? 0xffcc33 : is40 ? 0xf59e0b : 0xff3322;

    const geo = new THREE.CylinderGeometry(radius, radius * 0.6, length, 8);
    geo.rotateX(Math.PI / 2); // Align cylinder along +Z so lookAt(end) aligns it 100% with trajectory!
    const mat = new THREE.MeshBasicMaterial({ color });
    const tracer = new THREE.Mesh(geo, mat);
    tracer.position.copy(start);
    tracer.lookAt(end);
    this.scene.add(tracer);

    this.projectiles.push({
      mesh: tracer,
      start: start.clone(),
      end: end.clone(),
      progress: 0,
      speed: is105 ? 1.6 : is40 ? 2.2 : 2.8,
      caliber
    });
  }

  spawnImpactShockwave(pos, caliber) {
    const is105 = caliber === '105';
    const is40 = caliber === '40';

    // Expanding Blast Ring
    const ringGeo = new THREE.RingGeometry(0.2, is105 ? 0.75 : is40 ? 0.5 : 0.32, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: is105 ? 0xffaa22 : is40 ? 0xf59e0b : 0xff4422,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.position.y = GROUND_Y + 0.08;
    this.scene.add(ring);

    // 3D Fireball Flash Sphere at Impact Point
    const domeGeo = new THREE.SphereGeometry(is105 ? 0.65 : 0.3, 16, 12);
    const domeMat = new THREE.MeshBasicMaterial({
      color: is105 ? 0xffdd55 : 0xff6622,
      transparent: true,
      opacity: 0.9
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.copy(pos);
    dome.position.y = GROUND_Y + 0.1;
    this.scene.add(dome);

    this.shockwaves.push({
      mesh: ring,
      dome,
      scale: 1,
      maxScale: is105 ? 7.5 : is40 ? 4.5 : 2.6,
      opacity: 0.95
    });
  }

  toggleNightVision() {
    this.nightVisionMode = !this.nightVisionMode;
    if (this.nightVisionMode) {
      this.scene.background = new THREE.Color(0x021208);
      this.scene.fog.color = new THREE.Color(0x021208);
      this.renderer.toneMappingExposure = 1.55;
      this.keyLight.color.setHex(0x44ff77);
      this.rimLight.color.setHex(0x10b981);
      this.hemiLight.color.setHex(0x22cc55);
    } else {
      this.scene.background = new THREE.Color(0x060a10);
      this.scene.fog.color = new THREE.Color(0x060a10);
      this.renderer.toneMappingExposure = 1.25;
      this.keyLight.color.setHex(0xfffbeb);
      this.rimLight.color.setHex(0x38bdf8);
      this.hemiLight.color.setHex(0xdbeafe);
    }
    return this.nightVisionMode;
  }

  toggleXRay() {
    this.xrayMode = !this.xrayMode;
    this.modelData.parts.forEach(p => {
      p.items.forEach(item => {
        item.obj.traverse(child => {
          if (child.isMesh && child.material) {
            if (child.userData.isPropBlur) {
              child.visible = !this.xrayMode;
              return;
            }
            child.material.wireframe = this.xrayMode;
            if (child.userData.origMaterial) {
              child.userData.origMaterial.wireframe = this.xrayMode;
            }
          }
        });
      });
    });
    return this.xrayMode;
  }

  // Feature 1: Toggle Pause / Stop Aircraft Motion
  togglePause(forceState) {
    if (typeof forceState === 'boolean') {
      this.isPaused = forceState;
    } else {
      this.isPaused = !this.isPaused;
    }
    return this.isPaused;
  }

  // Feature 2: Realistic Flight Environment (High-Speed Wind Particles & Volumetric Low Clouds)
  toggleFlightEnv(forceState) {
    if (typeof forceState === 'boolean') {
      this.flightEnvMode = forceState;
    } else {
      this.flightEnvMode = !this.flightEnvMode;
    }

    if (this.windLines) this.windLines.visible = this.flightEnvMode;
    if (this.cloudGroup) this.cloudGroup.visible = this.flightEnvMode;

    // If enabled, automatically take off into orbit if still parked on hangar floor
    if (this.flightEnvMode && !this.pylonTurnMode) {
      this.togglePylonTurn(true);
    }

    return this.flightEnvMode;
  }

  // Feature 3: Tactical Angel Wing Flare Countermeasure Pattern
  launchAngelWingFlares() {
    // Flare ejection origin points: left and right wing roots and outer wing sponsons
    // Inside flightGroup coordinates: +X = Nose, -X = Tail, +Y = Up, -Z = Port, +Z = Starboard
    this.flightGroup.updateMatrixWorld(true);

    const flareEjectors = [
      { localPos: new THREE.Vector3(-1.2, 1.4, -4.5), dirZ: -1 }, // Port wing root
      { localPos: new THREE.Vector3(-1.2, 1.4, 4.5), dirZ: 1 },   // Starboard wing root
      { localPos: new THREE.Vector3(-1.8, 1.5, -9.0), dirZ: -1 }, // Port outer wing
      { localPos: new THREE.Vector3(-1.8, 1.5, 9.0), dirZ: 1 },   // Starboard outer wing
      { localPos: new THREE.Vector3(-3.5, 0.2, -1.8), dirZ: -1 }, // Port fuselage sponson
      { localPos: new THREE.Vector3(-3.5, 0.2, 1.8), dirZ: 1 },   // Starboard fuselage sponson
    ];

    // Spawn 48 high-intensity burning magnesium-teflon flare projectiles in an authentic parabolic Angel Wing arc
    const sparkGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa, transparent: true, opacity: 1.0 });

    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const smokeGeo = new THREE.DodecahedronGeometry(0.38, 0);

    // Get current aircraft forward speed vector in world coordinates
    const fwdWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(this.flightGroup.quaternion).normalize();

    flareEjectors.forEach((ejector, idx) => {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!this.flightGroup) return;
          this.flightGroup.updateMatrixWorld(true);

          const wPos = ejector.localPos.clone().applyMatrix4(this.flightGroup.matrixWorld);
          // Add slight jitter to ejection point
          wPos.x += (Math.random() - 0.5) * 0.4;
          wPos.y += (Math.random() - 0.5) * 0.3;
          wPos.z += (Math.random() - 0.5) * 0.4;

          const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
          sparkMesh.position.copy(wPos);
          this.scene.add(sparkMesh);

          // Lateral ejection direction relative to aircraft orientation
          const latWorld = new THREE.Vector3(0, 0, ejector.dirZ).applyQuaternion(this.flightGroup.quaternion).normalize();
          const upWorld = new THREE.Vector3(0, 1, 0).applyQuaternion(this.flightGroup.quaternion).normalize();

          // Symmetrical Parabolic Angel Wings Velocity:
          // Ejected outward laterally (5-11 m/s) and upward (3-6 m/s), while dragging behind the aircraft
          const latSpeed = 6.5 + Math.random() * 6.5;
          const upSpeed = 2.5 + Math.random() * 4.5;
          const backSpeed = 4.0 + Math.random() * 5.0;

          const vel = latWorld.clone().multiplyScalar(latSpeed)
            .addScaledVector(upWorld, upSpeed)
            .addScaledVector(fwdWorld, -backSpeed);

          const flare = {
            mesh: sparkMesh,
            smokeGeo,
            smokeMat,
            pos: wPos.clone(),
            vel,
            life: 0,
            maxLife: 2.8 + Math.random() * 1.4,
            smokeTimer: 0
          };
          this.angelFlares.push(flare);
        }, idx * 45 + i * 85);
      }
    });
  }

  // Feature 4: First-Person Shooter (FPS) Gunner Cockpit Station
  toggleFPSGunner(forceState) {
    if (typeof forceState === 'boolean') {
      this.fpsGunnerMode = forceState;
    } else {
      this.fpsGunnerMode = !this.fpsGunnerMode;
    }

    const hud = document.getElementById('fpsGunnerHUD');
    const hudStatus = document.getElementById('hudStatusLine');
    const standardHUD = document.querySelector('.hud-overlay');
    const drawer = document.getElementById('partDrawer');
    const openDrawerBtn = document.getElementById('btnOpenDrawer');
    const viewport = document.getElementById('viewerViewport');

    if (this.fpsGunnerMode) {
      // Save third-person camera state to restore later
      this.savedCameraState = {
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
        fov: this.camera.fov
      };

      // Hide 3D aircraft model so it does not obstruct the camera POV!
      if (this.modelData && this.modelData.root) {
        this.modelData.root.visible = false;
      }

      // Ensure aircraft is in flight orbit if it was resting in hangar
      if (!this.pylonTurnMode) {
        this.togglePylonTurn(true);
      }

      this.controls.enabled = false;
      this.controls.autoRotate = false;
      this.camera.fov = 48;
      this.camera.updateProjectionMatrix();

      // Strictly hide standard hangar HUD and drawer so they don't clash or block the Gunner view!
      if (standardHUD) standardHUD.style.display = 'none';
      if (drawer) drawer.classList.add('collapsed');
      if (openDrawerBtn) openDrawerBtn.style.display = 'none';
      if (viewport) viewport.classList.add('fps-mode-active');

      if (hud) hud.style.display = 'flex';
      if (hudStatus) hudStatus.textContent = 'MODE: FIRST-PERSON GUNNER FIRE STATION (WSO ACTIVE)';

      // Strictly hide cursor and request pointer lock for unbounded mouse aim
      this.canvas.style.cursor = 'none';
      try {
        if (this.canvas.requestPointerLock) {
          this.canvas.requestPointerLock();
        }
      } catch (err) {
        console.warn('Pointer lock request error:', err);
      }

      // Reset aiming angles
      this.fpsAngles.yaw = 0;
      this.fpsAngles.pitch = -0.58;
    } else {
      // Exit Pointer Lock if active
      try {
        if (document.pointerLockElement === this.canvas && document.exitPointerLock) {
          document.exitPointerLock();
        }
      } catch (err) {
        // ignore
      }

      // Restore 3D aircraft model visibility
      if (this.modelData && this.modelData.root) {
        this.modelData.root.visible = true;
      }

      if (hud) hud.style.display = 'none';
      if (standardHUD) standardHUD.style.display = 'flex';
      if (viewport) viewport.classList.remove('fps-mode-active');
      this.controls.enabled = true;
      this.canvas.style.cursor = 'default';

      if (this.savedCameraState) {
        this.camera.position.copy(this.savedCameraState.position);
        this.controls.target.copy(this.savedCameraState.target);
        this.camera.fov = this.savedCameraState.fov;
        this.camera.updateProjectionMatrix();
      }

      if (hudStatus) {
        hudStatus.textContent = this.pylonTurnMode
          ? 'MODE: SIMULASI ORBIT PYLON TURN & LIVE FIRE AKTIF'
          : 'MODE: HANGGAR INSPEKSI & EXPLODEVIEW';
      }
    }

    this.options.onModeChange({
      isRotating: this.isRotating,
      cutawayMode: this.cutawayMode,
      pylonTurnMode: this.pylonTurnMode,
      cameraFollowMode: this.cameraFollowMode,
      fpsGunnerMode: this.fpsGunnerMode,
    });

    return this.fpsGunnerMode;
  }

  // Feature 5: Camera Follow (Chase Camera Tracking AC-130 during Pylon Turn Orbit)
  toggleCameraFollow(forceState) {
    if (typeof forceState === 'boolean') {
      this.cameraFollowMode = forceState;
    } else {
      this.cameraFollowMode = !this.cameraFollowMode;
    }

    if (this.cameraFollowMode) {
      // Ensure aircraft is flying in Pylon Turn orbit
      if (!this.pylonTurnMode) {
        this.togglePylonTurn(true);
      }
      // If FPS mode was active, switch it off
      if (this.fpsGunnerMode) {
        this.toggleFPSGunner(false);
      }

      this.isRotating = false;
      this.controls.autoRotate = false;

      // Position camera in a dynamic third-person chase perspective behind and above the aircraft
      this.flightGroup.updateMatrixWorld(true);
      const chaseCamWorld = new THREE.Vector3(-24, 8.5, 9.5).applyMatrix4(this.flightGroup.matrixWorld);
      const targetWorld = new THREE.Vector3(1.5, 0.2, -0.5).applyMatrix4(this.flightGroup.matrixWorld);

      this.controls.target.copy(targetWorld);
      this.camera.position.copy(chaseCamWorld);
      this._lastFollowTarget = this.flightGroup.position.clone();
    } else {
      this._lastFollowTarget = null;
      if (this.pylonTurnMode) {
        // Return to standard pylon turn battlefield overview
        this.animateCameraTo([0, 38, 75], [0, 5.0, 0]);
      }
    }

    this.options.onModeChange({
      isRotating: this.isRotating,
      cutawayMode: this.cutawayMode,
      pylonTurnMode: this.pylonTurnMode,
      cameraFollowMode: this.cameraFollowMode,
    });

    return this.cameraFollowMode;
  }

  onWindowResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || 680;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    // 1. Smooth Explode interpolation
    if (Math.abs(this.explodeValue - this.targetExplode) > 0.0005) {
      this.explodeValue = THREE.MathUtils.lerp(this.explodeValue, this.targetExplode, 0.1);
      if (Math.abs(this.explodeValue - this.targetExplode) < 0.001) {
        this.explodeValue = this.targetExplode;
      }
      applyExplode(this.modelData, this.explodeValue);
      this.options.onExplodeChange(this.explodeValue);
    }

    // 2. Propeller Spin (affected by Pause state)
    if (!this.isPaused && this.modelData && this.modelData.props) {
      this.modelData.props.forEach(spinGroup => {
        spinGroup.rotation.x += 0.38;
      });
    }

    // 3. Recover Gun Barrel Recoil Smoothly
    if (this.modelData && this.modelData.recoilParts) {
      Object.values(this.modelData.recoilParts).forEach(rp => {
        if (rp.position.z > 0.002) {
          rp.position.z = THREE.MathUtils.lerp(rp.position.z, 0, dt * 8.5);
        } else {
          rp.position.z = 0;
        }
      });
    }

    // 4. True 3D Circular Pylon Turn Orbit & Continuous Target Lock
    if (this.pylonTurnMode) {
      const prevAngle = this.pylonAngle;
      if (!this.isPaused) {
        this.pylonAngle += dt * 0.42; // Counter-clockwise angular velocity
      }
      const dPsi = this.pylonAngle - prevAngle;
      this.updatePylonOrbitTransform(this.pylonAngle);

      // Follow Camera: keep camera moving and orbiting in sync with the AC-130
      if (this.cameraFollowMode && !this.fpsGunnerMode) {
        if (this._lastFollowTarget) {
          const offset = this.camera.position.clone().sub(this._lastFollowTarget);
          const targetOffset = this.controls.target.clone().sub(this._lastFollowTarget);
          if (dPsi !== 0) {
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), dPsi);
            targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), dPsi);
          }
          this.controls.target.copy(this.flightGroup.position).add(targetOffset);
          this.camera.position.copy(this.flightGroup.position).add(offset);
        }
        this._lastFollowTarget = this.flightGroup.position.clone();
      } else {
        this._lastFollowTarget = null;
      }

      // Continuous automatic fire bursts while orbiting in Pylon Turn (if not paused and not in manual FPS mode)
      if (!this.isPaused && !this.fpsGunnerMode) {
        if (now - this.lastFire30 > 1300) {
          this.lastFire30 = now;
          this.fireSalvo('30');
        }
        if (now - this.lastFire40 > 2100) {
          this.lastFire40 = now;
          this.fireSalvo('40');
        }
        if (now - this.lastFire105 > 3100) {
          this.lastFire105 = now;
          this.fireSalvo('105');
        }
      }
    }

    // 5. Update Flight Atmosphere (Wind Particles & Volumetric Clouds)
    if (this.flightEnvMode) {
      // Wind speed lines rushing past the aircraft along local -X
      if (this.windLines && this.windLines.geometry) {
        const posAttr = this.windLines.geometry.attributes.position;
        const arr = posAttr.array;
        const effectiveSpeed = this.isPaused ? 0 : 1;
        for (let i = 0; i < this.windVelocities.length; i++) {
          const spd = this.windVelocities[i] * effectiveSpeed * dt;
          arr[i * 6] -= spd;
          arr[i * 6 + 3] -= spd;
          // Wrap around if passed behind aircraft
          if (arr[i * 6] < -45) {
            const len = 3.5 + Math.random() * 5.0;
            const newX = 45 + Math.random() * 15;
            arr[i * 6] = newX;
            arr[i * 6 + 1] = (Math.random() - 0.5) * 20 + ORBIT_ALTITUDE;
            arr[i * 6 + 2] = (Math.random() - 0.5) * 100;
            arr[i * 6 + 3] = newX - len;
            arr[i * 6 + 4] = arr[i * 6 + 1];
            arr[i * 6 + 5] = arr[i * 6 + 2];
          }
        }
        posAttr.needsUpdate = true;
      }

      // Drift low cloud deck beneath the aircraft
      if (this.cloudClusters && !this.isPaused) {
        for (let i = 0; i < this.cloudClusters.length; i++) {
          const c = this.cloudClusters[i];
          c.position.x -= dt * 6.5;
          if (c.position.x < -85) {
            c.position.x = 85;
            c.position.z = (Math.random() - 0.5) * 160;
          }
        }
      }
    }

    // 6. Update Tactical Angel Wing Flare Countermeasures
    for (let i = this.angelFlares.length - 1; i >= 0; i--) {
      const fl = this.angelFlares[i];
      fl.life += dt;
      if (fl.life >= fl.maxLife) {
        this.scene.remove(fl.mesh);
        fl.mesh.geometry.dispose();
        fl.mesh.material.dispose();
        this.angelFlares.splice(i, 1);
        continue;
      }

      // Physics: drag decelerates horizontal velocity, gravity pulls down
      fl.vel.x *= Math.pow(0.88, dt * 60);
      fl.vel.z *= Math.pow(0.88, dt * 60);
      fl.vel.y -= 7.8 * dt; // Gravity drop

      fl.pos.addScaledVector(fl.vel, dt);
      fl.mesh.position.copy(fl.pos);

      // Fade burning spark over time
      const lifeRatio = fl.life / fl.maxLife;
      fl.mesh.material.opacity = Math.max(0, 1.0 - lifeRatio);
      fl.mesh.scale.setScalar(Math.max(0.2, 1.0 - lifeRatio * 0.6));

      // Spawn puff of smoke trail behind flare
      fl.smokeTimer += dt;
      if (fl.smokeTimer > 0.08 && lifeRatio < 0.85) {
        fl.smokeTimer = 0;
        const smokePuff = new THREE.Mesh(fl.smokeGeo, fl.smokeMat.clone());
        smokePuff.position.copy(fl.pos);
        smokePuff.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        this.scene.add(smokePuff);

        // Add smoke to temporary fading list
        this.shockwaves.push({
          mesh: smokePuff,
          dome: null,
          scale: 1,
          maxScale: 2.8 + Math.random() * 1.5,
          opacity: 0.55
        });
      }
    }

    // 7. Update First-Person Shooter (FPS) Gunner Viewport
    if (this.fpsGunnerMode) {
      this.flightGroup.updateMatrixWorld(true);

      // Station position: Inside cabin looking out port side window/aperture
      const stationLocal = new THREE.Vector3(-0.45, 0.35, -1.8);
      const stationWorld = stationLocal.applyMatrix4(this.flightGroup.matrixWorld);
      this.camera.position.copy(stationWorld);

      // Calculate camera look direction based on aircraft attitude + Gunner yaw/pitch
      // Base orientation: looking out toward port (-Z)
      const basePort = new THREE.Vector3(0, 0, -1).applyQuaternion(this.flightGroup.quaternion).normalize();
      const baseUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.flightGroup.quaternion).normalize();
      const baseFwd = new THREE.Vector3(1, 0, 0).applyQuaternion(this.flightGroup.quaternion).normalize();

      // Apply yaw (rotation around baseUp) and pitch (tilt around baseFwd)
      const lookDir = basePort.clone()
        .addScaledVector(baseFwd, Math.tan(this.fpsAngles.yaw))
        .addScaledVector(baseUp, Math.tan(this.fpsAngles.pitch))
        .normalize();

      const lookTarget = stationWorld.clone().addScaledVector(lookDir, 50);
      this.camera.lookAt(lookTarget);

      // Aim weapons at crosshair ray impact point
      const planeY = GROUND_Y + 0.1;
      const t = lookDir.y < -0.01 ? (planeY - stationWorld.y) / lookDir.y : 50;
      const groundTarget = stationWorld.clone().addScaledVector(lookDir, Math.max(5, Math.min(t, 120)));
      this.aimGunsAtWorldPoint(groundTarget);

      // Update distance telemetry HUD
      const rangeMeters = Math.round(stationWorld.distanceTo(groundTarget) * 25);
      const rangeEl = document.getElementById('fpsRangeVal');
      if (rangeEl) {
        rangeEl.textContent = `${rangeMeters.toLocaleString()} M`;
      }

      // Update Azimuth and Elevation in HUD
      const azDeg = (this.fpsAngles.yaw * 180 / Math.PI);
      const elDeg = (this.fpsAngles.pitch * 180 / Math.PI);
      const azEl = document.getElementById('fpsAzVal');
      const elEl = document.getElementById('fpsElVal');
      if (azEl) azEl.textContent = `${azDeg >= 0 ? '+' : ''}${azDeg.toFixed(1)}°`;
      if (elEl) elEl.textContent = `${elDeg.toFixed(1)}°`;

      // Update Heading tape and values based on aircraft heading + gunner yaw
      const curHdg = Math.round(((-this.flightGroup.rotation.y + this.fpsAngles.yaw) * 180 / Math.PI + 360) % 360);
      const hdgEl = document.getElementById('fpsHdgVal');
      if (hdgEl) hdgEl.textContent = `HDG ${curHdg.toString().padStart(3, '0')}°`;

      const compassTape = document.getElementById('fpsCompassTape');
      if (compassTape) {
        const offsetPx = -((curHdg % 360) / 360) * 160;
        compassTape.style.transform = `translateX(${offsetPx}px)`;
      }

      // Update pitch ladder translation
      const pitchLadder = document.getElementById('fpsPitchLadder');
      if (pitchLadder) {
        const ladderY = (elDeg + 30) * 3.2;
        pitchLadder.style.transform = `translateY(${ladderY}px)`;
      }

      // Update Zulu Clock
      const zuluEl = document.getElementById('fpsZuluTime');
      if (zuluEl && (!this._lastZulu || now - this._lastZulu > 1000)) {
        this._lastZulu = now;
        const d = new Date();
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ss = String(d.getUTCSeconds()).padStart(2, '0');
        zuluEl.textContent = `ZULU ${hh}:${mm}:${ss}Z`;
      }
    }

    // 8. Update Muzzle Flashes & Dynamic Light Decay
    [this.flash30, this.flash40, this.flash105].forEach(fl => {
      if (fl && fl.material.opacity > 0.01) {
        fl.material.opacity *= 0.78;
      } else if (fl) {
        fl.material.opacity = 0;
      }
    });
    if (this.muzzleLight.intensity > 0.1) {
      this.muzzleLight.intensity *= 0.8;
    } else {
      this.muzzleLight.intensity = 0;
    }

    // 9. Update Ballistic Projectiles (strictly collinear with barrel ray)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.progress += dt * p.speed;
      if (p.progress >= 1) {
        this.spawnImpactShockwave(p.end, p.caliber);
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      } else {
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      }
    }

    // 10. Update Ground Impact Shockwaves, Fireballs & Smoke Puffs
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale = THREE.MathUtils.lerp(sw.scale, sw.maxScale, dt * 6.5);
      sw.opacity -= dt * 1.65;
      sw.mesh.scale.set(sw.scale, sw.dome ? 1 : sw.scale, sw.scale);
      sw.mesh.material.opacity = Math.max(0, sw.opacity);
      if (sw.dome) {
        const dScale = 1 + (sw.scale - 1) * 0.45;
        sw.dome.scale.set(dScale, dScale, dScale);
        sw.dome.material.opacity = Math.max(0, sw.opacity * 0.85);
      }
      if (sw.opacity <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        if (sw.dome) {
          this.scene.remove(sw.dome);
          sw.dome.geometry.dispose();
          sw.dome.material.dispose();
        }
        this.shockwaves.splice(i, 1);
      }
    }

    if (!this.fpsGunnerMode) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
