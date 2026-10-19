import * as THREE from 'three';
import { sound } from './audio/soundEngine.js';
import { GaugeCluster } from './gauges/gaugeRenderer.js';
import { createUBoatModel } from './models/uBoatModel.js';
import { createMerchantShip, createDestroyerShip } from './models/shipModel.js';
import { OceanSystem } from './systems/oceanSystem.js';
import { CombatSystem } from './systems/combatSystem.js';
import { PeriscopeSystem } from './systems/periscope.js';
import { TacticalMap } from './systems/tacticalMap.js';
import { HydrophoneSystem } from './systems/hydrophone.js';

class UBoatSimulator {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // Game state (Exact initial parameters matching user reference screenshot)
    this.state = {
      speed: 14.0,           // Actual speed in knots (screenshot: 14 kn)
      orderedSpeed: 14.0,    // Target ordered speed
      telegraphStep: 'grosse_vor', // "Ahead Full"
      depth: 2.0,            // Actual depth in meters (screenshot: 2 m)
      orderedDepth: 2.0,     // Target depth
      heading: 30.0,         // Heading in degrees (screenshot: 30°)
      rudder: 0.0,           // Rudder angle (screenshot: 0°)
      targetRudder: 0.0,
      battery: 100.0,        // Battery % (screenshot: 100%)
      diesel: 98.0,          // Diesel fuel % (screenshot: 98%)
      hull: 94.0,            // Hull integrity % (screenshot: 94%)
      torpedoes: 14,         // Screenshot: 14/14
      timeCompression: 1,    // 1x, 2x, 4x
      activeView: 'external' // external, bridge, periscope, map, hydrophone
    };

    this.keys = {};
    // Camera orbit parameters (Side beam view matching reference screenshot)
    this.cameraOrbit = {
      radius: 92,
      theta: Math.PI * 0.5, // 90 degrees: pure side beam view
      phi: Math.PI * 0.47,  // Near sea-level perspective matching reference photo
      target: new THREE.Vector3(0, 0, 0)
    };
    this.isMouseDown = false;
    this.mousePrev = { x: 0, y: 0 };

    this.initThree();
    this.initSystems();
    this.initShips();
    this.initUI();
    this.bindEvents();

    this.lastTime = performance.now();
    this.report("Ahead Full! Heading 030° steady.");

    // Initial camera position update after U-Boat exists
    this.updateCameraExternal();

    this.animate();
  }

  initThree() {
    // 3D Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      3500
    );
    this.camera.position.set(0, 8, 88);
    this.camera.lookAt(0, 1.5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  initSystems() {
    // Ocean & Atmosphere
    this.ocean = new OceanSystem(this.scene);

    // Combat & Weapons
    this.combat = new CombatSystem(this.scene, this.ocean);

    // Player U-Boat 3D Model
    this.uBoat = createUBoatModel();
    this.uBoat.mesh.position.set(0, 0.5 - this.state.depth * 0.4, 0);
    this.uBoat.mesh.rotation.y = -(this.state.heading * Math.PI) / 180;
    this.uBoat.heading = this.state.heading;
    this.uBoat.speed = this.state.speed;
    this.uBoat.hullIntegrity = this.state.hull;
    this.scene.add(this.uBoat.mesh);

    // Add Wake & Foam Mesh
    this.createWakeEffect();

    // Hanging Top Gauges
    const gaugeContainer = document.getElementById('gauge-cluster-container');
    this.gauges = new GaugeCluster(gaugeContainer, (action, val) => this.handleGaugeAction(action, val));

    // Periscope System
    this.periscope = new PeriscopeSystem(document.body, () => this.fireTorpedo());

    // Tactical Map System
    this.tacticalMap = new TacticalMap(document.body, (newHeading) => {
      this.state.heading = newHeading;
      this.report(`New course ordered: ${newHeading.toString().padStart(3, '0')}°`);
    });

    // Hydrophone System
    this.hydrophone = new HydrophoneSystem(document.body);
  }

  createWakeEffect() {
    // Generate soft feathering foam canvas textures
    const sprayCanvas = document.createElement('canvas');
    sprayCanvas.width = 128;
    sprayCanvas.height = 128;
    const sCtx = sprayCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sGrad.addColorStop(0.5, 'rgba(235, 248, 255, 0.6)');
    sGrad.addColorStop(1, 'rgba(210, 240, 255, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const sprayTexture = new THREE.CanvasTexture(sprayCanvas);

    const wakeCanvas = document.createElement('canvas');
    wakeCanvas.width = 256;
    wakeCanvas.height = 64;
    const wCtx = wakeCanvas.getContext('2d');
    const wGrad = wCtx.createLinearGradient(0, 0, 256, 0);
    wGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    wGrad.addColorStop(0.3, 'rgba(240, 250, 255, 0.7)');
    wGrad.addColorStop(0.7, 'rgba(220, 245, 255, 0.3)');
    wGrad.addColorStop(1, 'rgba(200, 235, 255, 0)');
    wCtx.fillStyle = wGrad;
    wCtx.fillRect(0, 0, 256, 64);

    const vGrad = wCtx.createLinearGradient(0, 0, 0, 64);
    vGrad.addColorStop(0, 'rgba(255,255,255,0)');
    vGrad.addColorStop(0.3, 'rgba(255,255,255,1)');
    vGrad.addColorStop(0.7, 'rgba(255,255,255,1)');
    vGrad.addColorStop(1, 'rgba(255,255,255,0)');
    wCtx.globalCompositeOperation = 'destination-in';
    wCtx.fillStyle = vGrad;
    wCtx.fillRect(0, 0, 256, 64);
    const wakeTexture = new THREE.CanvasTexture(wakeCanvas);

    // Bow spray planes
    const sprayGeom = new THREE.PlaneGeometry(12, 4);
    sprayGeom.rotateX(-Math.PI / 2);
    const sprayMat = new THREE.MeshBasicMaterial({
      map: sprayTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.bowSpray = new THREE.Mesh(sprayGeom, sprayMat);
    this.bowSpray.position.set(34, 0.15, 0);
    this.uBoat.mesh.add(this.bowSpray);

    // Stern wake trail
    const wakeGeom = new THREE.PlaneGeometry(48, 8, 8, 1);
    wakeGeom.rotateX(-Math.PI / 2);
    const wakeMat = new THREE.MeshBasicMaterial({
      map: wakeTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.sternWake = new THREE.Mesh(wakeGeom, wakeMat);
    this.sternWake.position.set(-60, 0.1, 0);
    this.uBoat.mesh.add(this.sternWake);
  }

  initShips() {
    this.ships = [];

    // Merchant Convoy (Eastbound Atlantic Convoy)
    const merchantNames = ['SS Atlantic Star', 'SS Celtic Pride', 'SS Empire Trader', 'MV Ocean Vanguard'];
    const merchantPositions = [
      { x: 580, z: -450 },
      { x: 720, z: -320 },
      { x: 460, z: -580 },
      { x: 640, z: -660 }
    ];

    merchantNames.forEach((name, i) => {
      const ship = createMerchantShip();
      ship.name = name;
      ship.mesh.position.set(merchantPositions[i].x, 0, merchantPositions[i].z);
      ship.heading = 75;
      ship.mesh.rotation.y = -(ship.heading * Math.PI) / 180;
      this.scene.add(ship.mesh);
      this.ships.push(ship);
    });

    // Escort Destroyers
    const destroyer1 = createDestroyerShip();
    destroyer1.name = 'HMS Vesper (Destroyer)';
    destroyer1.mesh.position.set(420, 0, -360);
    destroyer1.heading = 75;
    destroyer1.mesh.rotation.y = -(destroyer1.heading * Math.PI) / 180;
    this.scene.add(destroyer1.mesh);
    this.ships.push(destroyer1);

    const destroyer2 = createDestroyerShip();
    destroyer2.name = 'HMS Bulldog (Destroyer)';
    destroyer2.mesh.position.set(780, 0, -520);
    destroyer2.heading = 80;
    destroyer2.mesh.rotation.y = -(destroyer2.heading * Math.PI) / 180;
    this.scene.add(destroyer2.mesh);
    this.ships.push(destroyer2);
  }

  initUI() {
    // Stations switcher
    document.getElementById('btn-view-ext').addEventListener('click', () => this.switchView('external'));
    document.getElementById('btn-view-bridge').addEventListener('click', () => this.switchView('bridge'));
    document.getElementById('btn-view-peri').addEventListener('click', () => this.switchView('periscope'));
    document.getElementById('btn-view-map').addEventListener('click', () => this.switchView('map'));
    document.getElementById('btn-view-hydro').addEventListener('click', () => this.switchView('hydrophone'));

    // Weather toggle
    const weatherBtn = document.getElementById('btn-weather-toggle');
    const weathers = ['day', 'sunset', 'night', 'storm'];
    const weatherLabels = ['DAY', 'SUNSET', 'NIGHT', 'STORM'];
    let wIdx = 0;
    weatherBtn.addEventListener('click', () => {
      wIdx = (wIdx + 1) % weathers.length;
      this.ocean.setWeather(weathers[wIdx]);
      weatherBtn.innerHTML = `<span>🌤️</span> WEATHER: ${weatherLabels[wIdx]}`;
      this.report(`Weather changed to: ${weatherLabels[wIdx]}`);
    });

    // Time compression
    const timeBtn = document.getElementById('time-compress-btn');
    timeBtn.addEventListener('click', () => {
      if (this.state.timeCompression === 1) this.state.timeCompression = 2;
      else if (this.state.timeCompression === 2) this.state.timeCompression = 4;
      else this.state.timeCompression = 1;
      timeBtn.innerHTML = `<span>⏩</span> TIME WARP: ${this.state.timeCompression}x`;
      this.report(`Time compression: ${this.state.timeCompression}x`);
    });

    // Help modal
    const helpModal = document.getElementById('help-modal');
    document.getElementById('btn-help-modal').addEventListener('click', () => {
      helpModal.classList.toggle('hidden');
    });
    document.getElementById('help-close-btn').addEventListener('click', () => {
      helpModal.classList.add('hidden');
    });

    // Bottom HUD controls
    document.getElementById('hud-speed-box').addEventListener('click', () => {
      this.cycleTelegraph(1);
    });

    const depthModal = document.getElementById('depth-modal');
    document.getElementById('hud-depth-box').addEventListener('click', () => {
      depthModal.classList.toggle('hidden');
    });

    depthModal.querySelectorAll('.menu-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseFloat(btn.getAttribute('data-depth'));
        this.setTargetDepth(d);
        depthModal.classList.add('hidden');
      });
    });

    document.getElementById('hud-rudder-box').addEventListener('click', () => {
      this.state.targetRudder = 0;
      this.report("Rudder amidships (0°)");
    });

    document.getElementById('hud-torpedo-box').addEventListener('click', () => {
      this.fireTorpedo();
    });

    document.getElementById('hud-hydrophone-box').addEventListener('click', () => {
      this.switchView('hydrophone');
    });
  }

  bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Engine telegraph
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.cycleTelegraph(1);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.cycleTelegraph(-1);

      // Rudder
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.state.targetRudder = Math.max(-35, this.state.targetRudder - 5);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.state.targetRudder = Math.min(35, this.state.targetRudder + 5);
      if (e.code === 'Digit0') this.state.targetRudder = 0;

      // Depth orders
      if (e.code === 'KeyU') this.setTargetDepth(0); // Surface
      if (e.code === 'KeyP') this.setTargetDepth(12); // Periscope
      if (e.code === 'KeyC') {
        // CRASH DIVE!
        sound.playAlarm();
        this.setTargetDepth(80);
        this.report("ALARM! CRASH DIVE! Emergency dive to 80 meters!");
      }

      // Torpedo fire
      if (e.code === 'Space') {
        e.preventDefault();
        this.fireTorpedo();
      }

      // Camera views
      if (e.code === 'F1') { e.preventDefault(); this.switchView('external'); }
      if (e.code === 'F2') { e.preventDefault(); this.switchView('bridge'); }
      if (e.code === 'F3') { e.preventDefault(); this.switchView('periscope'); }
      if (e.code === 'F4' || e.code === 'KeyM') { e.preventDefault(); this.switchView('map'); }
      if (e.code === 'F5') { e.preventDefault(); this.switchView('hydrophone'); }
      if (e.code === 'KeyH') {
        document.getElementById('help-modal').classList.toggle('hidden');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse orbit controls in external view
    this.container.addEventListener('mousedown', (e) => {
      sound.ensureContext();
      if (e.button === 0) {
        this.isMouseDown = true;
        this.mousePrev = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown && this.state.activeView === 'external') {
        const dx = e.clientX - this.mousePrev.x;
        const dy = e.clientY - this.mousePrev.y;
        this.mousePrev = { x: e.clientX, y: e.clientY };

        this.cameraOrbit.theta -= dx * 0.008;
        this.cameraOrbit.phi = Math.max(0.08, Math.min(Math.PI * 0.49, this.cameraOrbit.phi + dy * 0.008));
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.container.addEventListener('wheel', (e) => {
      if (this.state.activeView === 'external') {
        this.cameraOrbit.radius = Math.max(30, Math.min(220, this.cameraOrbit.radius + e.deltaY * 0.12));
      }
    });
  }

  handleGaugeAction(action, val) {
    sound.ensureContext();
    switch (action) {
      case 'telegraph':
        this.setTelegraphStep(val);
        break;
      case 'heading':
        this.state.heading = (this.state.heading + val + 360) % 360;
        this.report(`Heading adjusted: ${Math.round(this.state.heading).toString().padStart(3, '0')}°`);
        break;
      case 'depth_target':
        this.setTargetDepth(val);
        break;
      case 'rudder_set':
        this.state.targetRudder = val;
        break;
    }
  }

  setTelegraphStep(step) {
    sound.playTelegraphClick();
    this.state.telegraphStep = step;
    let ord = 0;
    let label = '';

    switch (step) {
      case 'aus': ord = 0; label = 'All stop!'; break;
      case 'kleine_vor': ord = 4; label = 'Ahead Slow!'; break;
      case 'halbe_vor': ord = 8; label = 'Ahead Half!'; break;
      case 'grosse_vor': ord = 14; label = 'Ahead Full!'; break;
      case 'ak_vor': ord = 19; label = 'Ahead Flank!'; break;
      case 'kleine_zur': ord = -3; label = 'Astern Slow!'; break;
      case 'halbe_zur': ord = -6; label = 'Astern Half!'; break;
      case 'grosse_zur': ord = -10; label = 'Astern Full!'; break;
    }

    this.state.orderedSpeed = ord;
    this.report(label);
  }

  cycleTelegraph(dir) {
    const steps = ['grosse_zur', 'halbe_zur', 'kleine_zur', 'aus', 'kleine_vor', 'halbe_vor', 'grosse_vor', 'ak_vor'];
    const curIdx = steps.indexOf(this.state.telegraphStep);
    const nextIdx = Math.max(0, Math.min(steps.length - 1, curIdx + dir));
    this.setTelegraphStep(steps[nextIdx]);
  }

  setTargetDepth(depthMeters) {
    this.state.orderedDepth = depthMeters;
    if (depthMeters === 0) {
      this.report("Surfacing! Blowing main ballast tanks!");
    } else if (depthMeters <= 14) {
      this.report(`Diving to periscope depth (${depthMeters} meters)!`);
    } else if (depthMeters >= 80) {
      sound.playAlarm();
      this.report(`Deep dive ordered: ${depthMeters} meters!`);
    } else {
      this.report(`New depth order: ${depthMeters} meters.`);
    }
  }

  fireTorpedo() {
    if (this.state.torpedoes <= 0) {
      this.report("All torpedo tubes empty!");
      return;
    }

    const fired = this.combat.fireTorpedo(this.uBoat.mesh.position, this.state.heading);
    if (fired) {
      this.state.torpedoes = this.combat.torpedoCount;
      this.report(`Tube 1 FIRE! Torpedo running on heading ${Math.round(this.state.heading)}°!`);
      document.getElementById('hud-torpedo-val').textContent = `${this.state.torpedoes}/14`;
    }
  }

  switchView(viewName) {
    this.state.activeView = viewName;

    document.querySelectorAll('.station-btn').forEach(btn => btn.classList.remove('active'));

    this.periscope.setActive(viewName === 'periscope');
    this.tacticalMap.setActive(viewName === 'map');
    this.hydrophone.setActive(viewName === 'hydrophone');

    if (viewName === 'external') {
      document.getElementById('btn-view-ext').classList.add('active');
      this.report("External observation view active.");
    } else if (viewName === 'bridge') {
      document.getElementById('btn-view-bridge').classList.add('active');
      this.report("Watch officer on conning tower bridge.");
    } else if (viewName === 'periscope') {
      document.getElementById('btn-view-peri').classList.add('active');
      this.report("Attack periscope raised!");
    } else if (viewName === 'map') {
      document.getElementById('btn-view-map').classList.add('active');
      this.tacticalMap.centerOnUBoat(this.uBoat.mesh.position);
      this.report("Tactical navigation chart open.");
    } else if (viewName === 'hydrophone') {
      document.getElementById('btn-view-hydro').classList.add('active');
      this.report("Hydrophone station manned (GHG).");
    }
  }

  report(text) {
    const el = document.getElementById('hud-report-txt');
    if (el) {
      el.textContent = text;
      el.style.opacity = '0.5';
      setTimeout(() => { el.style.opacity = '1'; }, 100);
    }
  }

  updateCameraExternal() {
    if (!this.uBoat || !this.uBoat.mesh) return;
    const subPos = this.uBoat.mesh.position;
    const r = this.cameraOrbit.radius;
    const subHeadingRad = (this.state.heading * Math.PI) / 180;
    const camAngle = subHeadingRad - this.cameraOrbit.theta;
    const ph = this.cameraOrbit.phi;

    this.camera.position.x = subPos.x + r * Math.sin(ph) * Math.sin(camAngle);
    this.camera.position.y = Math.max(subPos.y + 1.2, subPos.y + r * Math.cos(ph));
    this.camera.position.z = subPos.z + r * Math.sin(ph) * Math.cos(camAngle);

    this.camera.lookAt(subPos.x, subPos.y + 1.2, subPos.z);
  }

  updateCameraBridge() {
    if (!this.uBoat || !this.uBoat.mesh) return;
    const subPos = this.uBoat.mesh.position;
    const subRotY = this.uBoat.mesh.rotation.y;

    const offset = new THREE.Vector3(4, 5.2, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), subRotY);
    this.camera.position.copy(subPos).add(offset);

    const forward = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), subRotY);
    this.camera.lookAt(this.camera.position.clone().add(forward.multiplyScalar(50)));
  }

  updateCameraPeriscope() {
    if (!this.uBoat || !this.uBoat.mesh) return;
    const subPos = this.uBoat.mesh.position;
    const subRotY = this.uBoat.mesh.rotation.y;

    const offset = new THREE.Vector3(0.5, 7.8, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), subRotY);
    this.camera.position.copy(subPos).add(offset);

    const periWorldAngle = subRotY - (this.periscope.azimuth * Math.PI) / 180;
    const target = new THREE.Vector3(
      this.camera.position.x + Math.cos(periWorldAngle) * 100,
      this.camera.position.y,
      this.camera.position.z - Math.sin(periWorldAngle) * 100
    );
    this.camera.lookAt(target);

    this.camera.fov = this.periscope.zoom === 6.0 ? 12 : 45;
    this.camera.updateProjectionMatrix();
  }

  updatePhysics(delta) {
    const tc = this.state.timeCompression;
    const effectiveDelta = delta * tc;

    // 1. Speed inertia
    const accelRate = 0.8;
    if (this.state.speed < this.state.orderedSpeed) {
      this.state.speed = Math.min(this.state.orderedSpeed, this.state.speed + accelRate * effectiveDelta);
    } else if (this.state.speed > this.state.orderedSpeed) {
      this.state.speed = Math.max(this.state.orderedSpeed, this.state.speed - accelRate * effectiveDelta);
    }

    // 2. Rudder deflection
    const rudderSpeed = 15;
    if (this.state.rudder < this.state.targetRudder) {
      this.state.rudder = Math.min(this.state.targetRudder, this.state.rudder + rudderSpeed * effectiveDelta);
    } else if (this.state.rudder > this.state.targetRudder) {
      this.state.rudder = Math.max(this.state.targetRudder, this.state.rudder - rudderSpeed * effectiveDelta);
    }

    // 3. Heading rotation
    const turnRate = (this.state.speed / 14) * (this.state.rudder / 35) * 2.2;
    this.state.heading = (this.state.heading + turnRate * effectiveDelta + 360) % 360;

    // 4. Submarine Depth transition
    const diveRate = 1.4;
    if (this.state.depth < this.state.orderedDepth) {
      this.state.depth = Math.min(this.state.orderedDepth, this.state.depth + diveRate * effectiveDelta);
    } else if (this.state.depth > this.state.orderedDepth) {
      this.state.depth = Math.max(this.state.orderedDepth, this.state.depth - diveRate * effectiveDelta);
    }

    // Creaking sound when diving deep
    if (this.state.depth > 75 && Math.random() < 0.003 * effectiveDelta) {
      sound.playHullCreak();
      this.report("Hull creaking under intense water pressure!");
    }

    // 5. Battery and Diesel management
    const isSubmerged = this.state.depth > 4.5;
    if (isSubmerged) {
      const drain = Math.abs(this.state.speed) * 0.015 * effectiveDelta;
      this.state.battery = Math.max(0, this.state.battery - drain);
    } else {
      if (this.state.battery < 100) {
        this.state.battery = Math.min(100, this.state.battery + 0.03 * effectiveDelta);
      }
      this.state.diesel = Math.max(0, this.state.diesel - Math.abs(this.state.speed) * 0.004 * effectiveDelta);
    }

    // 6. Update U-Boat World Position & Orientation
    const headingRad = (this.state.heading * Math.PI) / 180;
    const moveDist = this.state.speed * 0.514 * effectiveDelta;

    this.uBoat.mesh.position.x += Math.cos(headingRad) * moveDist;
    this.uBoat.mesh.position.z += Math.sin(headingRad) * moveDist;

    // Surface buoyancy wave displacement
    // At depth <= 2m, submarine floats with conning tower & deck above water (draft ~0.8 to -0.6)
    const waveY = this.ocean.getWaveHeight(this.uBoat.mesh.position.x, this.uBoat.mesh.position.z, this.ocean.time);
    if (this.state.depth <= 3.5) {
      const surfaceY = 0.5 - (this.state.depth * 0.45);
      this.uBoat.mesh.position.y = surfaceY + waveY * 0.6;
    } else {
      // Submerged depth
      this.uBoat.mesh.position.y = -this.state.depth + 1.0;
    }

    this.uBoat.mesh.rotation.y = -headingRad;

    // Pitch angle
    const pitch = (this.state.orderedDepth - this.state.depth) * 0.04;
    this.uBoat.mesh.rotation.z = Math.max(-0.18, Math.min(0.18, pitch));

    // Update wake and foam visibility/scale
    if (this.bowSpray && this.sternWake) {
      const onSurface = this.state.depth <= 4.0;
      const speedNorm = Math.abs(this.state.speed) / 14;
      this.bowSpray.visible = onSurface && speedNorm > 0.1;
      this.sternWake.visible = onSurface && speedNorm > 0.1;

      if (this.bowSpray.visible) {
        this.bowSpray.scale.set(1 + speedNorm * 0.8, 1 + speedNorm * 0.6, 1);
        this.bowSpray.material.opacity = Math.min(0.75, speedNorm * 0.8);
      }
      if (this.sternWake.visible) {
        this.sternWake.scale.set(1 + speedNorm * 1.2, 1 + speedNorm * 0.5, 1);
        this.sternWake.material.opacity = Math.min(0.65, speedNorm * 0.7);
      }
    }

    // Update U-Boat model animations
    this.uBoat.update(this.state.speed, this.state.rudder, pitch, performance.now() * 0.001);
    this.uBoat.heading = this.state.heading;
    this.uBoat.speed = this.state.speed;

    // Audio Engine update
    sound.updateEngine(this.state.speed, this.state.depth);
  }

  updateShips(delta) {
    const tc = this.state.timeCompression;
    const effectiveDelta = delta * tc;
    const subPos = this.uBoat.mesh.position;

    this.ships.forEach(ship => {
      if (ship.sinking) {
        ship.sinkTimer += effectiveDelta;
        ship.speed = Math.max(0, ship.speed - effectiveDelta * 0.6);
        ship.mesh.rotation.z = Math.sin(ship.sinkTimer * 0.5) * 0.45;
        ship.mesh.rotation.x = -Math.min(0.6, ship.sinkTimer * 0.035);
        ship.mesh.position.y -= effectiveDelta * 0.9;
        return;
      }

      const rad = (ship.heading * Math.PI) / 180;
      const dist = ship.speed * 0.514 * effectiveDelta;
      ship.mesh.position.x += Math.cos(rad) * dist;
      ship.mesh.position.z += Math.sin(rad) * dist;

      const wave = this.ocean.getWaveHeight(ship.mesh.position.x, ship.mesh.position.z, this.ocean.time);
      ship.mesh.position.y = wave * 0.6;

      // Destroyer ASW AI
      if (ship.type === 'destroyer') {
        const distToSub = ship.mesh.position.distanceTo(subPos);
        const isSubSurface = this.state.depth < 6;
        const isSubNoisy = Math.abs(this.state.speed) > 5;

        if ((isSubSurface && distToSub < 400) || (isSubNoisy && distToSub < 260)) {
          if (ship.alertState !== 'attacking') {
            ship.alertState = 'attacking';
            sound.playSonarPing();
            this.report(`ALARM! ${ship.name} has detected us and is attacking!`);
          }

          const dx = subPos.x - ship.mesh.position.x;
          const dz = subPos.z - ship.mesh.position.z;
          let targetHeading = Math.round(Math.atan2(dz, dx) * 180 / Math.PI);
          if (targetHeading < 0) targetHeading += 360;

          const diff = ((targetHeading - ship.heading + 540) % 360) - 180;
          ship.heading += Math.sign(diff) * Math.min(Math.abs(diff), 8 * effectiveDelta);
          ship.mesh.rotation.y = -(ship.heading * Math.PI) / 180;
          ship.speed = 22;

          if (ship.searchlight) {
            ship.searchlight.target.position.copy(subPos);
          }

          if (distToSub < 65) {
            ship.depthChargeCooldown = (ship.depthChargeCooldown || 0) - effectiveDelta;
            if (ship.depthChargeCooldown <= 0) {
              ship.depthChargeCooldown = 3.5;
              this.combat.dropDepthCharge(ship.mesh.position, subPos);
              this.report(`DEPTH CHARGES dropped from ${ship.name}! DIVE DEEP!`);
            }
          }
        }
      }
    });
  }

  updateHUD() {
    this.gauges.update({
      speed: this.state.speed,
      depth: this.state.depth,
      telegraphStep: this.state.telegraphStep,
      rudder: this.state.rudder,
      heading: this.state.heading
    });

    const speedEl = document.getElementById('hud-speed-val');
    if (speedEl) speedEl.textContent = `${Math.round(this.state.speed)} kn`;

    const depthEl = document.getElementById('hud-depth-val');
    if (depthEl) depthEl.textContent = `${Math.round(this.state.depth)} m`;

    const headingEl = document.getElementById('hud-heading-val');
    if (headingEl) headingEl.textContent = `${Math.round(this.state.heading)}°`;

    const rudderEl = document.getElementById('hud-rudder-val');
    if (rudderEl) {
      const r = Math.round(this.state.rudder);
      rudderEl.textContent = r === 0 ? '0°' : (r < 0 ? `Port ${Math.abs(r)}°` : `Stbd ${r}°`);
    }

    const battEl = document.getElementById('hud-batt-val');
    if (battEl) battEl.textContent = `${Math.round(this.state.battery)}%`;

    const dieselEl = document.getElementById('hud-diesel-val');
    if (dieselEl) dieselEl.textContent = `${Math.round(this.state.diesel)}%`;

    const hullEl = document.getElementById('hud-hull-val');
    if (hullEl) hullEl.textContent = `${Math.round(this.uBoat.hullIntegrity)}%`;

    const hydroEl = document.getElementById('hud-hydrophone-val');
    if (hydroEl) {
      if (Math.abs(this.state.speed) > 4.5) {
        hydroEl.textContent = '0 - Too loud (Reduce speed)';
      } else if (this.state.depth < 5) {
        hydroEl.textContent = 'Hydrophone: On Surface';
      } else {
        hydroEl.textContent = `Hydrophone: Signal ${Math.round(this.hydrophone.signalStrength * 100)}%`;
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const delta = Math.min(0.1, (now - this.lastTime) * 0.001);
    this.lastTime = now;

    this.updatePhysics(delta);
    this.updateShips(delta);
    this.ocean.update(delta * this.state.timeCompression, this.camera.position.y);
    this.combat.update(delta * this.state.timeCompression, this.ships, this.uBoat, (msg) => this.report(msg));

    if (this.state.activeView === 'periscope') {
      this.updateCameraPeriscope();
      this.periscope.update(this.ships, this.uBoat);
    } else if (this.state.activeView === 'bridge') {
      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();
      this.updateCameraBridge();
    } else {
      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();
      this.updateCameraExternal();
    }

    if (this.state.activeView === 'map') {
      this.tacticalMap.render(this.uBoat, this.ships, this.combat.torpedoes);
    }

    if (this.state.activeView === 'hydrophone') {
      this.hydrophone.update(this.ships, this.uBoat);
    }

    this.updateHUD();

    this.renderer.render(this.scene, this.camera);
  }
}

// Start simulation on load
window.addEventListener('DOMContentLoaded', () => {
  window.sim = new UBoatSimulator();
});
