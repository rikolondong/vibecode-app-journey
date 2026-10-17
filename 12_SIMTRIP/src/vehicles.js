import * as THREE from 'three';

export const VEHICLE_SPECS = {
  sedan: {
    id: 'sedan',
    name: 'Sedan Sport GT',
    maxSpeedKmh: 220,
    reverseMaxKmh: 45,
    accel: 26.0,
    brakeDecel: 48.0,
    coastDecel: 7.5,
    steerSpeed: 2.5,
    maxSteerRad: 0.52,
    wheelbase: 2.7,
    leanFactor: 0.03, // subtle body roll
    chaseCam: { dist: 8.5, height: 3.4, lookAhead: 6.0 },
    cockpitCam: { x: -0.4, y: 1.32, z: 0.15, lookAhead: 18.0 },
    engineBaseFreq: 75
  },
  suv: {
    id: 'suv',
    name: 'SUV Adventure 4x4',
    maxSpeedKmh: 175,
    reverseMaxKmh: 40,
    accel: 20.0,
    brakeDecel: 42.0,
    coastDecel: 8.0,
    steerSpeed: 2.2,
    maxSteerRad: 0.48,
    wheelbase: 2.85,
    leanFactor: 0.055,
    chaseCam: { dist: 9.5, height: 4.0, lookAhead: 6.0 },
    cockpitCam: { x: -0.45, y: 1.72, z: 0.2, lookAhead: 18.0 },
    engineBaseFreq: 62
  },
  motorbike: {
    id: 'motorbike',
    name: 'Motor Sport 1000cc',
    maxSpeedKmh: 240,
    reverseMaxKmh: 20,
    accel: 33.0,
    brakeDecel: 52.0,
    coastDecel: 9.0,
    steerSpeed: 3.1,
    maxSteerRad: 0.56,
    wheelbase: 1.48,
    leanFactor: -0.68, // leans INTO turns like a real motorcycle
    chaseCam: { dist: 6.2, height: 2.5, lookAhead: 5.5 },
    cockpitCam: { x: 0.0, y: 1.42, z: 0.25, lookAhead: 18.0 },
    engineBaseFreq: 110
  },
  bus: {
    id: 'bus',
    name: 'Bus Pariwisata Eksekutif',
    maxSpeedKmh: 130,
    reverseMaxKmh: 25,
    accel: 12.5,
    brakeDecel: 32.0,
    coastDecel: 6.0,
    steerSpeed: 1.55,
    maxSteerRad: 0.42,
    wheelbase: 5.8,
    leanFactor: 0.04,
    chaseCam: { dist: 15.5, height: 6.2, lookAhead: 8.5 },
    cockpitCam: { x: -0.75, y: 2.55, z: 4.3, lookAhead: 22.0 },
    engineBaseFreq: 48
  },
  truck: {
    id: 'truck',
    name: 'Truk Kargo Box',
    maxSpeedKmh: 115,
    reverseMaxKmh: 25,
    accel: 11.0,
    brakeDecel: 30.0,
    coastDecel: 6.5,
    steerSpeed: 1.6,
    maxSteerRad: 0.44,
    wheelbase: 4.8,
    leanFactor: 0.045,
    chaseCam: { dist: 13.5, height: 5.6, lookAhead: 7.5 },
    cockpitCam: { x: -0.65, y: 2.45, z: 2.6, lookAhead: 20.0 },
    engineBaseFreq: 44
  }
};

function createWheel(radius = 0.38, width = 0.26) {
  const wheelGroup = new THREE.Group();
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 20);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rimGeo = new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.7, roughness: 0.3 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  // Spoke bar so wheel rotation is clearly visible
  const spokeGeo = new THREE.BoxGeometry(width + 0.03, radius * 1.1, 0.06);
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46 });
  const spoke = new THREE.Mesh(spokeGeo, spokeMat);
  wheelGroup.add(spoke);

  return wheelGroup;
}

export function createVehicleMesh(type = 'sedan', colorHex = '#ef4444', isPlayer = true) {
  const root = new THREE.Group();
  const bodyTiltGroup = new THREE.Group(); // tilts on acceleration/turning
  root.add(bodyTiltGroup);

  const paintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.45,
    roughness: 0.28
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.12
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });

  const wheels = [];
  const frontSteerPivots = [];

  function addAxleWheels(zPos, halfTrack, radius, width, isSteerable = false) {
    [-halfTrack, halfTrack].forEach((xPos) => {
      const pivot = new THREE.Group();
      pivot.position.set(xPos, radius, zPos);
      const wheel = createWheel(radius, width);
      pivot.add(wheel);
      root.add(pivot);
      wheels.push(wheel);
      if (isSteerable) frontSteerPivots.push(pivot);
    });
  }

  let headlightZ = 2.1;
  let headlightY = 0.65;
  let headlightX = 0.65;
  let taillightZ = -2.1;
  let taillightY = 0.7;
  let taillightX = 0.65;

  if (type === 'sedan') {
    // Lower chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.56, 4.4), paintMat);
    chassis.position.set(0, 0.55, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    bodyTiltGroup.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.52, 2.2), glassMat);
    cabin.position.set(0, 1.04, -0.2);
    cabin.castShadow = true;
    bodyTiltGroup.add(cabin);

    // Roof cap
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 1.85), paintMat);
    roof.position.set(0, 1.31, -0.2);
    bodyTiltGroup.add(roof);

    // Sport spoiler
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.32), darkMat);
    spoilerWing.position.set(0, 1.02, -2.02);
    bodyTiltGroup.add(spoilerWing);

    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 0.08), darkMat);
    frontGrille.position.set(0, 0.48, 2.21);
    bodyTiltGroup.add(frontGrille);

    addAxleWheels(1.35, 0.92, 0.36, 0.25, true);
    addAxleWheels(-1.35, 0.92, 0.36, 0.25, false);
    headlightZ = 2.21; headlightY = 0.62; headlightX = 0.68;
    taillightZ = -2.21; taillightY = 0.68; taillightX = 0.68;

  } else if (type === 'suv') {
    // Tall SUV Body
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.75, 4.65), paintMat);
    chassis.position.set(0, 0.78, 0);
    chassis.castShadow = true;
    bodyTiltGroup.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.68, 3.05), glassMat);
    cabin.position.set(0, 1.44, -0.45);
    cabin.castShadow = true;
    bodyTiltGroup.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.1, 2.95), paintMat);
    roof.position.set(0, 1.8, -0.45);
    bodyTiltGroup.add(roof);

    // Roof rack
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 2.2), darkMat);
    rack.position.set(0, 1.9, -0.5);
    bodyTiltGroup.add(rack);

    // Spare wheel on back
    const spare = createWheel(0.42, 0.24);
    spare.rotation.y = Math.PI / 2;
    spare.position.set(0, 1.05, -2.42);
    bodyTiltGroup.add(spare);

    addAxleWheels(1.48, 1.0, 0.45, 0.3, true);
    addAxleWheels(-1.42, 1.0, 0.45, 0.3, false);
    headlightZ = 2.33; headlightY = 0.88; headlightX = 0.74;
    taillightZ = -2.33; taillightY = 0.92; taillightX = 0.78;

  } else if (type === 'motorbike') {
    // Main frame & fairing
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 1.55), paintMat);
    fairing.position.set(0, 0.74, 0.1);
    fairing.castShadow = true;
    bodyTiltGroup.add(fairing);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.5), glassMat);
    windshield.position.set(0, 1.12, 0.55);
    windshield.rotation.x = -0.45;
    bodyTiltGroup.add(windshield);

    // Rider
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.36), darkMat);
    torso.position.set(0, 1.25, -0.15);
    torso.rotation.x = 0.42;
    bodyTiltGroup.add(torso);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), paintMat);
    helmet.position.set(0, 1.62, 0.06);
    bodyTiltGroup.add(helmet);

    // Single front and rear wheels inside bodyTiltGroup so they lean with the bike
    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0.34, 0.78);
    const fw = createWheel(0.34, 0.16);
    frontPivot.add(fw);
    bodyTiltGroup.add(frontPivot);
    wheels.push(fw);
    frontSteerPivots.push(frontPivot);

    const rwPivot = new THREE.Group();
    rwPivot.position.set(0, 0.35, -0.75);
    const rw = createWheel(0.35, 0.2);
    rwPivot.add(rw);
    bodyTiltGroup.add(rwPivot);
    wheels.push(rw);

    headlightZ = 0.9; headlightY = 0.85; headlightX = 0.12;
    taillightZ = -0.88; taillightY = 0.88; taillightX = 0.1;

  } else if (type === 'bus') {
    // Coach Bus
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.55, 10.2), paintMat);
    body.position.set(0, 1.75, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    bodyTiltGroup.add(body);

    // Panoramic window strip
    const windows = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.95, 9.6), glassMat);
    windows.position.set(0, 2.25, 0.1);
    bodyTiltGroup.add(windows);

    // Rooftop AC
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 3.6), chromeMat);
    ac.position.set(0, 3.12, -0.5);
    bodyTiltGroup.add(ac);

    addAxleWheels(3.1, 1.22, 0.52, 0.34, true);
    addAxleWheels(-2.6, 1.22, 0.52, 0.34, false);
    addAxleWheels(-3.75, 1.22, 0.52, 0.34, false);

    headlightZ = 5.11; headlightY = 0.88; headlightX = 0.95;
    taillightZ = -5.11; taillightY = 0.95; taillightX = 0.95;

  } else if (type === 'truck') {
    // Cab-over-engine front cabin
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.3), paintMat);
    cab.position.set(0, 1.55, 2.65);
    cab.castShadow = true;
    bodyTiltGroup.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.85, 0.15), glassMat);
    windshield.position.set(0, 2.05, 3.76);
    bodyTiltGroup.add(windshield);

    // Cargo Box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5, metalness: 0.15 });
    const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.65, 6.2), boxMat);
    cargoBox.position.set(0, 1.85, -1.75);
    cargoBox.castShadow = true;
    cargoBox.receiveShadow = true;
    bodyTiltGroup.add(cargoBox);

    // Side accent stripe on cargo box
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.53, 0.35, 5.9), paintMat);
    stripe.position.set(0, 1.5, -1.75);
    bodyTiltGroup.add(stripe);

    addAxleWheels(2.65, 1.16, 0.48, 0.32, true);
    addAxleWheels(-2.2, 1.16, 0.48, 0.32, false);
    addAxleWheels(-3.4, 1.16, 0.48, 0.32, false);

    headlightZ = 3.81; headlightY = 0.82; headlightX = 0.88;
    taillightZ = -4.86; taillightY = 0.75; taillightX = 0.92;
  }

  // Headlight & Taillight meshes
  [-headlightX, headlightX].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.06), headlightMat);
    hl.position.set(x, headlightY, headlightZ);
    bodyTiltGroup.add(hl);
  });

  [-taillightX, taillightX].forEach((x) => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), taillightMat);
    tl.position.set(x, taillightY, taillightZ);
    bodyTiltGroup.add(tl);
  });

  // Real SpotLight for Player Vehicle Night Driving
  let headlightSpot = null;
  let headlightBeamMesh = null;
  if (isPlayer) {
    headlightSpot = new THREE.SpotLight(0xfffbeb, 60, 95, Math.PI / 4.2, 0.45, 1.2);
    headlightSpot.position.set(0, headlightY + 0.2, headlightZ);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0.1, headlightZ + 38);
    root.add(targetObj);
    headlightSpot.target = targetObj;
    root.add(headlightSpot);

    // Volumetric-style ground light cone visual
    const coneGeo = new THREE.ConeGeometry(5.5, 26, 16, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfef9c3,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    headlightBeamMesh = new THREE.Mesh(coneGeo, coneMat);
    headlightBeamMesh.position.set(0, 0.45, headlightZ + 13);
    root.add(headlightBeamMesh);
  }

  return {
    root,
    bodyTiltGroup,
    wheels,
    frontSteerPivots,
    paintMat,
    headlightMat,
    taillightMat,
    headlightSpot,
    headlightBeamMesh,
    setHeadlights(enabled) {
      headlightMat.color.setHex(enabled ? 0xfef08a : 0x475569);
      if (headlightSpot) headlightSpot.visible = enabled;
      if (headlightBeamMesh) headlightBeamMesh.visible = enabled;
    },
    setBraking(isBraking) {
      taillightMat.color.setHex(isBraking ? 0xff2222 : 0x7f1d1d);
    }
  };
}
