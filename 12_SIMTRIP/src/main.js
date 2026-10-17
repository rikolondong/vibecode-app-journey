import * as THREE from 'three';
import * as L from 'leaflet';
import { VEHICLE_SPECS, createVehicleMesh } from './vehicles.js';
import {
  PRESET_ROUTES,
  CoordinateConverter,
  searchLocationsNominatim,
  reverseGeocodeNominatim,
  fetchRealWorldRoute,
  fetchOSMDataAlongRoute,
  createPinIcon,
  createCarGpsIcon
} from './mapRouter.js';
import { WorldEnvironment } from './worldBuilder.js';
import { SoundEngine } from './audio.js';

// ==================== APPLICATION STATE ====================
const state = {
  mode: 'planner', // 'planner' | 'driving' | 'arrived'
  clickTarget: 'start', // 'start' | 'end'
  startPoint: { ...PRESET_ROUTES.jakarta.start },
  endPoint: { ...PRESET_ROUTES.jakarta.end },
  routeData: null,
  converter: null,

  // Time & Simulation Config
  departureTimeStr: '17:15',
  departureMinutes: 17 * 60 + 15,
  currentMinutes: 17 * 60 + 15,
  timeSpeedMultiplier: 15,
  routeScale: 1.0,
  trafficCount: 12,

  // Vehicle Config
  selectedVehicleId: 'sedan',
  selectedColor: '#ef4444',

  // Driving Physics State
  carPos: new THREE.Vector3(0, 0, 0),
  carHeading: 0, // radians, 0 = +Z, Math.PI = -Z
  speedMs: 0, // meters per second
  steerAngle: 0,
  bodyPitch: 0,
  bodyRoll: 0,
  headlightsOn: true,
  autopilot: false,
  cameraModeIndex: 0, // 0: Chase, 1: Cockpit, 2: Drone, 3: Cinematic
  topSpeedKmhSession: 0,
  closestSampleIndex: 0
};

const CAMERA_MODES = ['Chase', 'Cockpit', 'Drone', 'Cinematic'];

// Input state
const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  handbrake: false
};

// ==================== THREE.JS SCENE SETUP ====================
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 1800);

const worldEnv = new WorldEnvironment(scene);
const soundEngine = new SoundEngine();

let playerVehicle = null;
let trafficVehicles = [];

function rebuildPlayerVehicle() {
  if (playerVehicle) {
    scene.remove(playerVehicle.root);
  }
  playerVehicle = createVehicleMesh(state.selectedVehicleId, state.selectedColor, true);
  playerVehicle.root.position.copy(state.carPos);
  playerVehicle.root.rotation.y = state.carHeading;
  playerVehicle.setHeadlights(state.headlightsOn);
  scene.add(playerVehicle.root);

  const spec = VEHICLE_SPECS[state.selectedVehicleId];
  soundEngine.setVehicleBaseFreq(spec.engineBaseFreq);
  document.getElementById('hud-vehicle-name').textContent = spec.name;
}

// ==================== AI TRAFFIC SPAWNER ====================
const TRAFFIC_COLORS = ['#3b82f6', '#f8fafc', '#94a3b8', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];
const TRAFFIC_TYPES = ['sedan', 'suv', 'sedan', 'truck', 'bus'];

function spawnTrafficVehicles() {
  for (const tv of trafficVehicles) {
    scene.remove(tv.mesh.root);
  }
  trafficVehicles = [];

  if (state.trafficCount <= 0 || worldEnv.samples.length < 20) return;

  for (let i = 0; i < state.trafficCount; i++) {
    const tType = TRAFFIC_TYPES[i % TRAFFIC_TYPES.length];
    const tColor = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
    const mesh = createVehicleMesh(tType, tColor, false);

    // Half go forward in left/right lane, half go oncoming in opposite lane
    const dir = i % 2 === 0 ? 1 : -1;
    const laneOffset = dir === 1 ? -3.4 : 3.4; // Indonesia left-hand or right-hand lane separation
    const startSampleIdx = Math.floor(((i + 1) / (state.trafficCount + 1)) * (worldEnv.samples.length - 6)) + 3;
    const sample = worldEnv.samples[startSampleIdx];

    mesh.root.position.copy(sample.pos).addScaledVector(sample.normal, laneOffset);
    const tangent = sample.tangent.clone().multiplyScalar(dir);
    mesh.root.rotation.y = Math.atan2(tangent.x, tangent.z);
    scene.add(mesh.root);

    trafficVehicles.push({
      mesh,
      dir,
      laneOffset,
      distAlongRoad: sample.cumDist,
      speedMs: 9 + (i % 5) * 2.2
    });
  }
}

function updateTrafficVehicles(dt) {
  if (worldEnv.samples.length < 4) return;
  const totalLen = worldEnv.totalLength3D;

  for (const tv of trafficVehicles) {
    tv.distAlongRoad += tv.dir * tv.speedMs * dt;
    if (tv.distAlongRoad > totalLen - 10) tv.distAlongRoad = 10;
    if (tv.distAlongRoad < 10) tv.distAlongRoad = totalLen - 10;

    // Binary search sample by cumDist
    let lo = 0;
    let hi = worldEnv.samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (worldEnv.samples[mid].cumDist < tv.distAlongRoad) lo = mid + 1;
      else hi = mid;
    }
    const s = worldEnv.samples[lo];
    tv.mesh.root.position.copy(s.pos).addScaledVector(s.normal, tv.laneOffset);
    const tangent = s.tangent.clone().multiplyScalar(tv.dir);
    tv.mesh.root.rotation.y = Math.atan2(tangent.x, tangent.z);

    for (const w of tv.mesh.wheels) {
      w.rotation.x += tv.speedMs * dt * 2.5;
    }
  }
}

// ==================== LEAFLET MAPS (PLANNER & LIVE HUD MINIMAP) ====================
let plannerMap = null;
let startMarker = null;
let endMarker = null;
let plannerPolyline = null;

let hudMinimap = null;
let hudPolyline = null;
let hudCarMarker = null;
let hudStartPin = null;
let hudEndPin = null;

function initMaps() {
  // 1. Planner Map (100% OpenStreetMap Ecosystem)
  plannerMap = L.map('planner-map', {
    center: [state.startPoint.lat, state.startPoint.lng],
    zoom: 14,
    zoomControl: true
  });

  const osmStandardLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  });
  const osmHotLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OSM Team'
  });
  const openTopoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© OpenStreetMap contributors, SRTM | © OpenTopoMap'
  });

  osmStandardLayer.addTo(plannerMap);
  L.control.layers({
    'OpenStreetMap Standar': osmStandardLayer,
    'OpenStreetMap Humanitarian (HOT)': osmHotLayer,
    'OpenTopoMap (Topografi)': openTopoLayer
  }).addTo(plannerMap);

  startMarker = L.marker([state.startPoint.lat, state.startPoint.lng], {
    draggable: true,
    icon: createPinIcon('#10b981', '📍 MULAI')
  }).addTo(plannerMap);

  endMarker = L.marker([state.endPoint.lat, state.endPoint.lng], {
    draggable: true,
    icon: createPinIcon('#ef4444', '🏁 TUJUAN')
  }).addTo(plannerMap);

  startMarker.on('dragend', async () => {
    const pos = startMarker.getLatLng();
    state.startPoint.lat = pos.lat;
    state.startPoint.lng = pos.lng;
    state.startPoint.label = await reverseGeocodeNominatim(pos.lat, pos.lng);
    document.getElementById('input-start').value = state.startPoint.label;
    await calculateAndRenderRoute(false);
  });

  endMarker.on('dragend', async () => {
    const pos = endMarker.getLatLng();
    state.endPoint.lat = pos.lat;
    state.endPoint.lng = pos.lng;
    state.endPoint.label = await reverseGeocodeNominatim(pos.lat, pos.lng);
    document.getElementById('input-end').value = state.endPoint.label;
    await calculateAndRenderRoute(false);
  });

  plannerMap.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    if (state.clickTarget === 'start') {
      state.startPoint = { lat, lng, label: 'Memuat nama jalan OSM...' };
      startMarker.setLatLng([lat, lng]);
      document.getElementById('input-start').value = state.startPoint.label;
      state.startPoint.label = await reverseGeocodeNominatim(lat, lng);
      document.getElementById('input-start').value = state.startPoint.label;
      setClickTarget('end');
    } else {
      state.endPoint = { lat, lng, label: 'Memuat nama jalan OSM...' };
      endMarker.setLatLng([lat, lng]);
      document.getElementById('input-end').value = state.endPoint.label;
      state.endPoint.label = await reverseGeocodeNominatim(lat, lng);
      document.getElementById('input-end').value = state.endPoint.label;
    }
    await calculateAndRenderRoute(false);
  });

  // 2. HUD Live GPS Minimap (OpenStreetMap Standard Tiles)
  hudMinimap = L.map('hud-minimap', {
    center: [state.startPoint.lat, state.startPoint.lng],
    zoom: 16,
    zoomControl: false,
    attributionControl: true
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(hudMinimap);

  hudCarMarker = L.marker([state.startPoint.lat, state.startPoint.lng], {
    icon: createCarGpsIcon(0)
  }).addTo(hudMinimap);
}

function setClickTarget(target) {
  state.clickTarget = target;
  const btnStart = document.getElementById('btn-pick-start');
  const btnEnd = document.getElementById('btn-pick-end');
  const statusEl = document.getElementById('map-click-target');

  if (target === 'start') {
    btnStart.classList.add('active');
    btnEnd.classList.remove('active');
    statusEl.textContent = 'Titik Mulai (Hijau)';
    statusEl.style.color = '#10b981';
  } else {
    btnEnd.classList.add('active');
    btnStart.classList.remove('active');
    statusEl.textContent = 'Titik Tujuan (Merah)';
    statusEl.style.color = '#ef4444';
  }
}

function formatMinutesToHHMM(totalMinutes) {
  const norm = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(norm / 60)).padStart(2, '0');
  const mm = String(norm % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseHHMMToMinutes(timeStr) {
  const [hh, mm] = (timeStr || '17:15').split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

async function calculateAndRenderRoute(fitMapBounds = true) {
  document.getElementById('stat-distance').textContent = 'Menghitung...';
  startMarker.setLatLng([state.startPoint.lat, state.startPoint.lng]);
  endMarker.setLatLng([state.endPoint.lat, state.endPoint.lng]);

  const route = await fetchRealWorldRoute(state.startPoint, state.endPoint);
  state.routeData = route;

  const latLngPairs = route.latLngPath.map((p) => [p.lat, p.lng]);

  if (plannerPolyline) {
    plannerMap.removeLayer(plannerPolyline);
  }
  plannerPolyline = L.polyline(latLngPairs, {
    color: '#2563eb',
    weight: 6,
    opacity: 0.9
  }).addTo(plannerMap);

  if (fitMapBounds && latLngPairs.length > 1) {
    plannerMap.fitBounds(plannerPolyline.getBounds(), { padding: [36, 36] });
  }

  updatePlannerRouteStats();
  prepare3DWorldFromRoute();
}

function updatePlannerRouteStats() {
  if (!state.routeData) return;
  const distKm = state.routeData.distanceMeters / 1000;
  const durMin = Math.max(Math.round(state.routeData.durationSeconds / 60), 1);

  document.getElementById('stat-distance').textContent = `${distKm.toFixed(2)} km`;
  document.getElementById('stat-duration').textContent =
    durMin >= 60 ? `${Math.floor(durMin / 60)} j ${durMin % 60} mnt` : `${durMin} menit`;

  const depMin = state.departureMinutes;
  const arrMin = depMin + durMin;
  document.getElementById('stat-eta').textContent =
    `${formatMinutesToHHMM(depMin)} → ${formatMinutesToHHMM(arrMin)}`;
  document.getElementById('stat-steps').textContent =
    `${state.routeData.steps.length} instruksi OSM`;
}

function prepare3DWorldFromRoute() {
  if (!state.routeData || state.routeData.latLngPath.length < 2) return;
  const origin = state.routeData.latLngPath[0];
  state.converter = new CoordinateConverter(origin.lat, origin.lng, state.routeScale);
  worldEnv.buildRouteWorld(state.routeData.latLngPath, state.converter, state.routeData.steps);

  // Place vehicle at start of road
  resetVehicleToRoadStart();
  spawnTrafficVehicles();

  // Fetch and extrude real 3D OpenStreetMap buildings + real intersecting street signs via Overpass API
  const activeConverter = state.converter;
  const activeSteps = state.routeData.steps;
  fetchOSMDataAlongRoute(state.routeData.latLngPath).then((osmData) => {
    if (state.converter === activeConverter) {
      worldEnv.buildRealOSMData(osmData, activeConverter, activeSteps);
    }
  });
}

function resetVehicleToRoadStart() {
  if (worldEnv.samples.length === 0) return;
  const firstSample = worldEnv.samples[0];
  state.carPos.copy(firstSample.pos);
  state.carHeading = Math.atan2(firstSample.tangent.x, firstSample.tangent.z);
  state.speedMs = 0;
  state.steerAngle = 0;
  state.closestSampleIndex = 0;

  if (playerVehicle) {
    playerVehicle.root.position.copy(state.carPos);
    playerVehicle.root.rotation.y = state.carHeading;
  }
}

function resetVehicleToNearestRoad() {
  const closest = worldEnv.getClosestRoadPoint(state.carPos);
  if (!closest) return;
  state.carPos.copy(closest.sample.pos);
  state.carHeading = Math.atan2(closest.sample.tangent.x, closest.sample.tangent.z);
  state.speedMs = 0;
  state.steerAngle = 0;
  if (playerVehicle) {
    playerVehicle.root.position.copy(state.carPos);
    playerVehicle.root.rotation.y = state.carHeading;
  }
}

// ==================== LAUNCH 3D DRIVING SIMULATION ====================
function startDrivingSimulation() {
  soundEngine.init();
  state.mode = 'driving';
  state.currentMinutes = state.departureMinutes;
  state.topSpeedKmhSession = 0;

  // Rebuild world if scale/traffic changed
  prepare3DWorldFromRoute();
  rebuildPlayerVehicle();

  // Auto-enable headlights if departing at dusk/night/dawn
  const envInfo = worldEnv.updateTimeOfDay(state.currentMinutes, state.carPos);
  state.headlightsOn = envInfo.isNightOrDusk;
  playerVehicle.setHeadlights(state.headlightsOn);
  document.getElementById('btn-hud-lights').classList.toggle('active', state.headlightsOn);

  // Switch UI overlays
  document.getElementById('planner-modal').classList.add('hidden');
  document.getElementById('arrival-modal').classList.add('hidden');
  document.getElementById('driving-hud').classList.remove('hidden');
  document.getElementById('btn-resume-drive').classList.remove('hidden');

  // Sync HUD Minimap polyline & pins
  setTimeout(() => {
    hudMinimap.invalidateSize();
    const latLngPairs = state.routeData.latLngPath.map((p) => [p.lat, p.lng]);
    if (hudPolyline) hudMinimap.removeLayer(hudPolyline);
    if (hudStartPin) hudMinimap.removeLayer(hudStartPin);
    if (hudEndPin) hudMinimap.removeLayer(hudEndPin);

    hudPolyline = L.polyline(latLngPairs, { color: '#2563eb', weight: 5 }).addTo(hudMinimap);
    hudStartPin = L.marker([state.startPoint.lat, state.startPoint.lng], {
      icon: createPinIcon('#10b981', 'MULAI')
    }).addTo(hudMinimap);
    hudEndPin = L.marker([state.endPoint.lat, state.endPoint.lng], {
      icon: createPinIcon('#ef4444', 'TUJUAN')
    }).addTo(hudMinimap);

    hudMinimap.setView([state.startPoint.lat, state.startPoint.lng], 16);
  }, 60);
}

// ==================== PHYSICS & AUTOPILOT STEP ====================
function updateDrivingPhysics(dt) {
  const spec = VEHICLE_SPECS[state.selectedVehicleId];
  const maxSpeedMs = spec.maxSpeedKmh / 3.6;
  const maxRevMs = spec.reverseMaxKmh / 3.6;

  // Check if manual input overrides autopilot
  if (state.autopilot && (keys.forward || keys.backward || keys.left || keys.right)) {
    // Allow temporary steering nudge or press P to toggle off
  }

  let throttleInput = 0;
  let brakeInput = false;
  let targetSteer = 0;

  if (state.autopilot && worldEnv.samples.length > 2) {
    // AI Autopilot: Look ahead 18-30 meters on the real-world road spline
    const closest = worldEnv.getClosestRoadPoint(state.carPos);
    const lookAheadSteps = Math.min(closest.index + 5, worldEnv.samples.length - 1);
    const targetPt = worldEnv.samples[lookAheadSteps].pos;

    const dx = targetPt.x - state.carPos.x;
    const dz = targetPt.z - state.carPos.z;
    const desiredHeading = Math.atan2(dx, dz);

    let headingDiff = desiredHeading - state.carHeading;
    while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
    while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

    targetSteer = THREE.MathUtils.clamp(headingDiff * 1.35, -spec.maxSteerRad, spec.maxSteerRad);

    // Slow down automatically for sharp real-world turns
    const turnSharpness = Math.min(Math.abs(headingDiff) / 0.65, 1.0);
    const cruiseTargetMs = maxSpeedMs * (0.72 - turnSharpness * 0.42);

    if (state.speedMs < cruiseTargetMs) {
      throttleInput = 0.85;
    } else if (state.speedMs > cruiseTargetMs + 3.5) {
      brakeInput = true;
    }
  } else {
    // Manual Player Control
    if (keys.forward) {
      if (state.speedMs < -0.5) brakeInput = true;
      else throttleInput = 1.0;
    } else if (keys.backward) {
      if (state.speedMs > 0.5) brakeInput = true;
      else throttleInput = -1.0;
    }

    if (keys.left) targetSteer += spec.maxSteerRad;
    if (keys.right) targetSteer -= spec.maxSteerRad;
  }

  // Speed-sensitive steering dampening so high speed feels stable
  const speedRatio = Math.min(Math.abs(state.speedMs) / maxSpeedMs, 1.0);
  const effectiveMaxSteer = spec.maxSteerRad * (1.0 - speedRatio * 0.52);
  targetSteer = THREE.MathUtils.clamp(targetSteer, -effectiveMaxSteer, effectiveMaxSteer);

  state.steerAngle = THREE.MathUtils.lerp(state.steerAngle, targetSteer, Math.min(dt * spec.steerSpeed * 4.5, 1.0));

  // Longitudinal acceleration / braking
  if (brakeInput) {
    const dir = Math.sign(state.speedMs);
    state.speedMs -= dir * spec.brakeDecel * dt;
    if (Math.sign(state.speedMs) !== dir) state.speedMs = 0;
  } else if (throttleInput > 0) {
    state.speedMs += spec.accel * throttleInput * dt;
    if (state.speedMs > maxSpeedMs) state.speedMs = maxSpeedMs;
  } else if (throttleInput < 0) {
    state.speedMs += spec.accel * 0.65 * throttleInput * dt;
    if (state.speedMs < -maxRevMs) state.speedMs = -maxRevMs;
  } else {
    // Natural coasting resistance
    const sign = Math.sign(state.speedMs);
    state.speedMs -= sign * spec.coastDecel * dt;
    if (Math.sign(state.speedMs) !== sign) state.speedMs = 0;
  }

  if (keys.handbrake) {
    const sign = Math.sign(state.speedMs);
    state.speedMs -= sign * spec.brakeDecel * 1.15 * dt;
    if (Math.sign(state.speedMs) !== sign) state.speedMs = 0;
  }

  // Bicycle kinematic model update
  if (Math.abs(state.speedMs) > 0.05) {
    const angularVel = (state.speedMs / spec.wheelbase) * Math.tan(state.steerAngle);
    state.carHeading += angularVel * dt;
    state.carPos.x += Math.sin(state.carHeading) * state.speedMs * dt;
    state.carPos.z += Math.cos(state.carHeading) * state.speedMs * dt;
  }

  // Update 3D Vehicle Mesh Transform, Wheels, and Body Roll/Lean
  if (playerVehicle) {
    playerVehicle.root.position.copy(state.carPos);
    playerVehicle.root.rotation.y = state.carHeading;

    // Spin wheels
    const wheelSpin = state.speedMs * dt * 2.6;
    for (const w of playerVehicle.wheels) {
      w.rotation.x += wheelSpin;
    }
    // Turn front wheels visually
    for (const pivot of playerVehicle.frontSteerPivots) {
      pivot.rotation.y = state.steerAngle * 0.85;
    }

    // Dynamic body roll (motorbike leans into turns, cars roll slightly outward)
    const targetRoll = state.steerAngle * speedRatio * spec.leanFactor * 2.2;
    const targetPitch = throttleInput > 0 ? -0.025 : brakeInput ? 0.04 : 0;
    state.bodyRoll = THREE.MathUtils.lerp(state.bodyRoll, targetRoll, dt * 8);
    state.bodyPitch = THREE.MathUtils.lerp(state.bodyPitch, targetPitch, dt * 8);

    playerVehicle.bodyTiltGroup.rotation.z = state.bodyRoll;
    playerVehicle.bodyTiltGroup.rotation.x = state.bodyPitch;
    playerVehicle.setBraking(brakeInput || keys.handbrake);
  }
}

// ==================== CAMERA CONTROLLER ====================
function updateCamera(dt) {
  if (!playerVehicle) return;

  if (state.mode === 'planner') {
    // Showroom orbit camera while in Trip Planner
    const t = performance.now() * 0.00045;
    const radius = 9.5;
    camera.position.set(
      state.carPos.x + Math.sin(t) * radius,
      state.carPos.y + 3.6,
      state.carPos.z + Math.cos(t) * radius
    );
    camera.lookAt(state.carPos.x, state.carPos.y + 1.1, state.carPos.z);
    return;
  }

  const spec = VEHICLE_SPECS[state.selectedVehicleId];
  const modeName = CAMERA_MODES[state.cameraModeIndex];
  const forwardX = Math.sin(state.carHeading);
  const forwardZ = Math.cos(state.carHeading);
  const rightX = Math.cos(state.carHeading);
  const rightZ = -Math.sin(state.carHeading);

  if (modeName === 'Chase') {
    const targetCamPos = new THREE.Vector3(
      state.carPos.x - forwardX * spec.chaseCam.dist,
      state.carPos.y + spec.chaseCam.height,
      state.carPos.z - forwardZ * spec.chaseCam.dist
    );
    camera.position.lerp(targetCamPos, Math.min(dt * 9.0, 1.0));
    camera.lookAt(
      state.carPos.x + forwardX * spec.chaseCam.lookAhead,
      state.carPos.y + 1.3,
      state.carPos.z + forwardZ * spec.chaseCam.lookAhead
    );
  } else if (modeName === 'Cockpit') {
    const c = spec.cockpitCam;
    camera.position.set(
      state.carPos.x + forwardX * c.z + rightX * c.x,
      state.carPos.y + c.y,
      state.carPos.z + forwardZ * c.z + rightZ * c.x
    );
    camera.lookAt(
      state.carPos.x + forwardX * c.lookAhead,
      state.carPos.y + c.y - 0.2,
      state.carPos.z + forwardZ * c.lookAhead
    );
  } else if (modeName === 'Drone') {
    const targetCamPos = new THREE.Vector3(
      state.carPos.x - forwardX * 14,
      state.carPos.y + 42,
      state.carPos.z - forwardZ * 14
    );
    camera.position.lerp(targetCamPos, Math.min(dt * 6.0, 1.0));
    camera.lookAt(
      state.carPos.x + forwardX * 12,
      state.carPos.y,
      state.carPos.z + forwardZ * 12
    );
  } else if (modeName === 'Cinematic') {
    const targetCamPos = new THREE.Vector3(
      state.carPos.x - forwardX * 5.8 + rightX * 2.8,
      state.carPos.y + 1.35,
      state.carPos.z - forwardZ * 5.8 + rightZ * 2.8
    );
    camera.position.lerp(targetCamPos, Math.min(dt * 7.5, 1.0));
    camera.lookAt(
      state.carPos.x + forwardX * 8,
      state.carPos.y + 1.0,
      state.carPos.z + forwardZ * 8
    );
  }
}

// ==================== HUD & REAL-TIME GPS NAVIGATION UPDATE ====================
let lastMinimapPanTime = 0;

function updateHUDAndNavigation(dt) {
  if (state.mode !== 'driving' || !state.converter || !state.routeData) return;

  const spec = VEHICLE_SPECS[state.selectedVehicleId];
  const speedKmh = Math.abs(state.speedMs) * 3.6;
  if (speedKmh > state.topSpeedKmhSession) {
    state.topSpeedKmhSession = speedKmh;
  }

  // Speedometer, Gear, & RPM
  document.getElementById('hud-speed-val').textContent = Math.round(speedKmh);

  let gearLabel = 'N';
  if (state.speedMs < -0.4) {
    gearLabel = 'R';
  } else if (speedKmh > 1) {
    const gearNum = Math.min(Math.floor((speedKmh / spec.maxSpeedKmh) * 6) + 1, 6);
    gearLabel = `D${gearNum}`;
  }
  document.getElementById('hud-gear-box').textContent = gearLabel;

  const rpmRatio = speedKmh < 1 ? 0.12 : 0.25 + ((speedKmh % (spec.maxSpeedKmh / 5)) / (spec.maxSpeedKmh / 5)) * 0.72;
  document.getElementById('hud-rpm-fill').style.width = `${Math.min(rpmRatio * 100, 100).toFixed(0)}%`;
  soundEngine.updateEngine(rpmRatio, true);

  // Advance simulated clock
  state.currentMinutes = (state.currentMinutes + (dt / 60) * state.timeSpeedMultiplier) % 1440;
  const envInfo = worldEnv.updateTimeOfDay(state.currentMinutes, state.carPos);

  document.getElementById('hud-current-clock').textContent = formatMinutesToHHMM(state.currentMinutes);
  document.getElementById('hud-time-slider').value = Math.floor(state.currentMinutes);
  document.getElementById('hud-sky-icon').textContent = envInfo.periodIcon;
  document.getElementById('hud-sky-label').textContent = envInfo.periodLabel;

  // Find closest road point & progress
  const closest = worldEnv.getClosestRoadPoint(state.carPos);
  if (!closest) return;
  state.closestSampleIndex = closest.index;

  const isOffRoad = closest.distanceFromCenter > worldEnv.roadWidth * 0.85;
  document.getElementById('offroad-banner').classList.toggle('hidden', !isOffRoad);

  const progressRatio = THREE.MathUtils.clamp(closest.sample.cumDist / worldEnv.totalLength3D, 0, 1);
  const progressPct = Math.round(progressRatio * 100);
  const totalRealKm = state.routeData.distanceMeters / 1000;
  const remRealKm = Math.max(totalRealKm * (1 - progressRatio), 0);

  document.getElementById('hud-progress-pct').textContent = `${progressPct}%`;
  document.getElementById('hud-progress-fill').style.width = `${progressPct}%`;
  document.getElementById('hud-rem-dist').textContent =
    remRealKm >= 1 ? `${remRealKm.toFixed(2)} km` : `${Math.round(remRealKm * 1000)} m`;

  // Dynamic Live ETA based on current speed or average route speed
  const effectiveSpeedKmh = Math.max(speedKmh, 35);
  const remMinutes = (remRealKm / effectiveSpeedKmh) * 60;
  document.getElementById('hud-live-eta').textContent = formatMinutesToHHMM(state.currentMinutes + remMinutes);

  // Update Real-World Lat/Lng Position on Live 2D GPS Minimap
  const liveLatLng = state.converter.xzToLatLng(state.carPos.x, state.carPos.z);
  document.getElementById('hud-coords-label').textContent =
    `${liveLatLng.lat.toFixed(4)}, ${liveLatLng.lng.toFixed(4)}`;

  // Convert Three.js heading (0 = +Z South, PI = -Z North, PI/2 = +X East) to Compass Bearing (0 = North, 90 = East)
  const compassDeg = (180 - (state.carHeading * 180) / Math.PI + 360) % 360;
  if (hudCarMarker) {
    hudCarMarker.setLatLng([liveLatLng.lat, liveLatLng.lng]);
    hudCarMarker.setIcon(createCarGpsIcon(compassDeg));
  }

  const now = performance.now();
  if (now - lastMinimapPanTime > 250 && hudMinimap) {
    hudMinimap.panTo([liveLatLng.lat, liveLatLng.lng], { animate: true, duration: 0.2 });
    lastMinimapPanTime = now;
  }

  // Turn-by-turn instruction lookup
  updateNextTurnInstruction(liveLatLng);

  // Check if player arrived at Finish Archway
  const finishSample = worldEnv.samples[worldEnv.samples.length - 1];
  const distToFinish = state.carPos.distanceTo(finishSample.pos);
  if (distToFinish < 14.5 && worldEnv.samples.length > 5) {
    triggerArrivalCelebration();
  }
}

function updateNextTurnInstruction(liveLatLng) {
  const steps = state.routeData.steps;
  if (!steps || steps.length === 0) return;

  let nextStep = steps[steps.length - 1];
  let minStepDist = Infinity;

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!s.lat || !s.lng) continue;
    const d = L.latLng(liveLatLng.lat, liveLatLng.lng).distanceTo(L.latLng(s.lat, s.lng));
    if (d < minStepDist) {
      minStepDist = d;
      nextStep = steps[Math.min(i + 1, steps.length - 1)];
    }
  }

  const distToNext = nextStep.lat
    ? Math.round(L.latLng(liveLatLng.lat, liveLatLng.lng).distanceTo(L.latLng(nextStep.lat, nextStep.lng)))
    : 0;

  document.getElementById('hud-turn-icon').textContent = nextStep.icon || '⬆️';
  document.getElementById('hud-turn-dist').textContent =
    distToNext >= 1000 ? `${(distToNext / 1000).toFixed(1)} km` : `${distToNext} m`;
  document.getElementById('hud-turn-street').textContent = nextStep.text || 'Ikuti jalur utama';
}

function triggerArrivalCelebration() {
  state.mode = 'arrived';
  state.speedMs = 0;
  soundEngine.updateEngine(0, false);
  soundEngine.playHorn();

  document.getElementById('arrival-dest-name').textContent = state.endPoint.label;
  document.getElementById('arr-distance').textContent =
    `${(state.routeData.distanceMeters / 1000).toFixed(2)} km`;
  document.getElementById('arr-dep-time').textContent = formatMinutesToHHMM(state.departureMinutes);
  document.getElementById('arr-arr-time').textContent = formatMinutesToHHMM(state.currentMinutes);
  document.getElementById('arr-top-speed').textContent = `${Math.round(state.topSpeedKmhSession)} km/j`;

  document.getElementById('arrival-modal').classList.remove('hidden');
}

// ==================== UI & KEYBOARD EVENT LISTENERS ====================
function bindUIEvents() {
  const inputStart = document.getElementById('input-start');
  const inputEnd = document.getElementById('input-end');
  inputStart.value = state.startPoint.label;
  inputEnd.value = state.endPoint.label;

  // Map click mode toggles
  document.getElementById('btn-pick-start').addEventListener('click', () => setClickTarget('start'));
  document.getElementById('btn-pick-end').addEventListener('click', () => setClickTarget('end'));

  // Search Start / End via Nominatim
  async function handleLocationSearch(inputEl, resultsEl, isStart) {
    const q = inputEl.value.trim();
    if (!q) return;
    resultsEl.innerHTML = '<div class="search-result-item">Mencari di peta dunia...</div>';
    resultsEl.classList.remove('hidden');

    const items = await searchLocationsNominatim(q);
    if (items.length === 0) {
      resultsEl.innerHTML = '<div class="search-result-item">Lokasi tidak ditemukan. Coba kata kunci lain.</div>';
      return;
    }

    resultsEl.innerHTML = '';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'search-result-item';
      row.textContent = item.label;
      row.addEventListener('click', async () => {
        if (isStart) {
          state.startPoint = item;
        } else {
          state.endPoint = item;
        }
        inputEl.value = item.label;
        resultsEl.classList.add('hidden');
        await calculateAndRenderRoute(true);
      });
      resultsEl.appendChild(row);
    });
  }

  const resultsStart = document.getElementById('results-start');
  const resultsEnd = document.getElementById('results-end');

  document.getElementById('btn-search-start').addEventListener('click', () =>
    handleLocationSearch(inputStart, resultsStart, true)
  );
  inputStart.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLocationSearch(inputStart, resultsStart, true);
  });

  document.getElementById('btn-search-end').addEventListener('click', () =>
    handleLocationSearch(inputEnd, resultsEnd, false)
  );
  inputEnd.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLocationSearch(inputEnd, resultsEnd, false);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.input-group')) {
      resultsStart.classList.add('hidden');
      resultsEnd.classList.add('hidden');
    }
  });

  // Swap Start & End
  document.getElementById('btn-swap-points').addEventListener('click', async () => {
    const tmp = { ...state.startPoint };
    state.startPoint = { ...state.endPoint };
    state.endPoint = tmp;
    inputStart.value = state.startPoint.label;
    inputEnd.value = state.endPoint.label;
    await calculateAndRenderRoute(true);
  });

  // Preset Route Selector
  document.getElementById('select-preset-route').addEventListener('change', async (e) => {
    const key = e.target.value;
    if (!key || !PRESET_ROUTES[key]) return;
    const preset = PRESET_ROUTES[key];
    state.startPoint = { ...preset.start };
    state.endPoint = { ...preset.end };
    inputStart.value = state.startPoint.label;
    inputEnd.value = state.endPoint.label;
    await calculateAndRenderRoute(true);
  });

  // Departure Time Input & Quick Chips
  const timeInput = document.getElementById('input-departure-time');
  const timeBadge = document.getElementById('time-period-badge');

  function applyDepartureTime(timeStr) {
    state.departureTimeStr = timeStr;
    state.departureMinutes = parseHHMMToMinutes(timeStr);
    state.currentMinutes = state.departureMinutes;
    timeInput.value = timeStr;

    const envInfo = worldEnv.updateTimeOfDay(state.departureMinutes, state.carPos);
    timeBadge.textContent = `${envInfo.periodIcon} ${envInfo.periodLabel}`;
    if (playerVehicle) {
      playerVehicle.setHeadlights(envInfo.isNightOrDusk);
    }
    updatePlannerRouteStats();
  }

  timeInput.addEventListener('input', (e) => {
    document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
    applyDepartureTime(e.target.value);
  });

  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyDepartureTime(btn.dataset.time);
    });
  });

  // Simulation Speed, Route Scale, Traffic
  document.getElementById('select-time-speed').addEventListener('change', (e) => {
    state.timeSpeedMultiplier = parseFloat(e.target.value) || 15;
  });
  document.getElementById('select-route-scale').addEventListener('change', (e) => {
    state.routeScale = parseFloat(e.target.value) || 1.0;
    prepare3DWorldFromRoute();
  });
  document.getElementById('select-traffic').addEventListener('change', (e) => {
    state.trafficCount = parseInt(e.target.value, 10) || 0;
    spawnTrafficVehicles();
  });

  // Vehicle Type Cards
  document.querySelectorAll('.vehicle-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.vehicle-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.selectedVehicleId = card.dataset.vehicle;
      rebuildPlayerVehicle();
    });
  });

  // Vehicle Paint Color Picker
  document.querySelectorAll('.color-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
      state.selectedColor = dot.dataset.color;
      rebuildPlayerVehicle();
    });
  });

  // Start Driving CTA
  document.getElementById('btn-start-drive').addEventListener('click', () => {
    startDrivingSimulation();
  });

  document.getElementById('btn-resume-drive').addEventListener('click', () => {
    state.mode = 'driving';
    document.getElementById('planner-modal').classList.add('hidden');
    document.getElementById('driving-hud').classList.remove('hidden');
  });

  // HUD Action Buttons
  const btnAutopilot = document.getElementById('btn-hud-autopilot');
  function toggleAutopilot() {
    state.autopilot = !state.autopilot;
    btnAutopilot.classList.toggle('active', state.autopilot);
    document.getElementById('autopilot-banner').classList.toggle('hidden', !state.autopilot);
  }
  btnAutopilot.addEventListener('click', toggleAutopilot);

  const btnCamera = document.getElementById('btn-hud-camera');
  function cycleCamera() {
    state.cameraModeIndex = (state.cameraModeIndex + 1) % CAMERA_MODES.length;
    btnCamera.textContent = `🎥 Kamera: ${CAMERA_MODES[state.cameraModeIndex]} [C]`;
  }
  btnCamera.addEventListener('click', cycleCamera);

  const btnLights = document.getElementById('btn-hud-lights');
  function toggleHeadlights() {
    state.headlightsOn = !state.headlightsOn;
    btnLights.classList.toggle('active', state.headlightsOn);
    if (playerVehicle) playerVehicle.setHeadlights(state.headlightsOn);
  }
  btnLights.addEventListener('click', toggleHeadlights);

  document.getElementById('btn-hud-reset').addEventListener('click', resetVehicleToNearestRoad);

  document.getElementById('btn-hud-planner').addEventListener('click', () => {
    state.mode = 'planner';
    soundEngine.updateEngine(0, false);
    document.getElementById('driving-hud').classList.add('hidden');
    document.getElementById('planner-modal').classList.remove('hidden');
    setTimeout(() => plannerMap.invalidateSize(), 50);
  });

  // Live HUD Time Slider
  document.getElementById('hud-time-slider').addEventListener('input', (e) => {
    state.currentMinutes = parseFloat(e.target.value);
    const envInfo = worldEnv.updateTimeOfDay(state.currentMinutes, state.carPos);
    document.getElementById('hud-current-clock').textContent = formatMinutesToHHMM(state.currentMinutes);
    document.getElementById('hud-sky-icon').textContent = envInfo.periodIcon;
    document.getElementById('hud-sky-label').textContent = envInfo.periodLabel;
  });

  // Arrival Modal Buttons
  document.getElementById('btn-replay-route').addEventListener('click', () => {
    resetVehicleToRoadStart();
    startDrivingSimulation();
  });
  document.getElementById('btn-new-route').addEventListener('click', () => {
    state.mode = 'planner';
    document.getElementById('arrival-modal').classList.add('hidden');
    document.getElementById('driving-hud').classList.add('hidden');
    document.getElementById('planner-modal').classList.remove('hidden');
    setTimeout(() => plannerMap.invalidateSize(), 50);
  });

  // On-Screen Touch / Mouse Buttons
  const bindHoldButton = (id, keyName) => {
    const el = document.getElementById(id);
    const setDown = (e) => { e.preventDefault(); keys[keyName] = true; };
    const setUp = (e) => { e.preventDefault(); keys[keyName] = false; };
    el.addEventListener('mousedown', setDown);
    el.addEventListener('mouseup', setUp);
    el.addEventListener('mouseleave', setUp);
    el.addEventListener('touchstart', setDown, { passive: false });
    el.addEventListener('touchend', setUp, { passive: false });
  };
  bindHoldButton('touch-left', 'left');
  bindHoldButton('touch-right', 'right');
  bindHoldButton('touch-gas', 'forward');
  bindHoldButton('touch-brake', 'backward');
  bindHoldButton('touch-handbrake', 'handbrake');

  // Keyboard Controls
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') keys.forward = true;
    if (code === 'KeyS' || code === 'ArrowDown') keys.backward = true;
    if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
    if (code === 'Space') keys.handbrake = true;

    if (state.mode === 'driving') {
      if (code === 'KeyP') toggleAutopilot();
      if (code === 'KeyC') cycleCamera();
      if (code === 'KeyL') toggleHeadlights();
      if (code === 'KeyR') resetVehicleToNearestRoad();
      if (code === 'KeyH') soundEngine.playHorn();
      if (code === 'Escape') document.getElementById('btn-hud-planner').click();
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') keys.forward = false;
    if (code === 'KeyS' || code === 'ArrowDown') keys.backward = false;
    if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
    if (code === 'Space') keys.handbrake = false;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ==================== INITIALIZATION & MAIN ANIMATION LOOP ====================
async function initApp() {
  initMaps();
  bindUIEvents();
  rebuildPlayerVehicle();
  worldEnv.updateTimeOfDay(state.departureMinutes, state.carPos);
  await calculateAndRenderRoute(true);

  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (state.mode === 'driving') {
      updateDrivingPhysics(dt);
      updateTrafficVehicles(dt);
      updateHUDAndNavigation(dt);
    } else if (state.mode === 'planner') {
      updateTrafficVehicles(dt);
    }

    updateCamera(dt);
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}

initApp();
