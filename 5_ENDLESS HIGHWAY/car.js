import * as THREE from './libs/three.module.js';
import { TextureGenerator } from './textures.js';

/**
 * JALAN TOL KELAM - 3D Car & Vehicle Physics System (Ultra-Realistic Edition)
 */

export class PlayerCar {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Vehicle Physics & Powertrain
    this.position = new THREE.Vector3(2.5, 0, 0); // Start in middle-right lane
    this.velocity = 0;           // m/s
    this.maxSpeed = 58.0;        // ~210 km/h
    this.maxReverseSpeed = -8.5; // ~30 km/h

    // 5-Speed Automatic Transmission System
    this.currentGear = 1;
    this.gearRatios = [3.8, 2.3, 1.5, 1.0, 0.78]; // 1st to 5th
    this.finalDrive = 3.6;
    this.engineRpm = 850;
    this.idleRpm = 850;
    this.maxRpm = 6800;
    this.isShifting = false;
    this.shiftTimer = 0;

    // Steering & Handling
    this.steerAngle = 0;
    this.maxSteerAngle = 0.52;
    this.steerSpeed = 2.6;
    this.steerReturnSpeed = 3.8;
    this.lateralVelocity = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.suspensionHeave = 0;

    // Road Joints Tracking (Sambungan Jalan Tol)
    this.lastJointDistance = 0;
    this.jointInterval = 30.0; // 30 meters per highway concrete slab

    // Lighting Systems
    this.headlightState = 1; // 0: Off, 1: Low Beam, 2: High Beam
    this.headlights = [];
    this.lightBeams = [];
    this.taillights = [];
    this.brakeLights = [];
    this.groundBrakeLight = null;
    this.frontRoadLight = null;

    // Turn Signals & Hazards
    this.turnSignal = 0; // -1: Left, 0: Off, 1: Right, 2: Hazard
    this.signalTimer = 0;
    this.signalState = false;
    this.blinkers = [];

    // Animation & Interior References
    this.wheels = [];
    this.frontWheels = [];
    this.steeringWheel = null;
    this.speedoNeedle = null;
    this.tachoNeedle = null;
    this.wiper = null;
    this.wiperAngle = 0;
    this.isWiping = false;

    // Spark Particles for Guardrail scraping
    this.sparks = null;
    this.sparkPositions = null;
    this.sparkVelocities = null;
    this.isScraping = false;

    // Highway boundaries (Guardrail collision borders)
    this.minX = -6.5;
    this.maxX = 6.5;

    this._buildCarModel();
    this._initSparkSystem();
    this.scene.add(this.group);
  }

  _buildCarModel() {
    this.bodyMesh = new THREE.Group();

    // High Quality Automotive Materials
    const paintMaterial = new THREE.MeshStandardMaterial({
      color: 0x141822, // Midnight Obsidian Blue-Black
      metalness: 0.9,
      roughness: 0.22,
      envMapIntensity: 0.8
    });

    const blackTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x090a0d,
      roughness: 0.65,
      metalness: 0.3
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a141c,
      transparent: true,
      opacity: 0.52,
      roughness: 0.08,
      metalness: 0.95,
      side: THREE.DoubleSide
    });

    // 1. Lower Body / Chassis
    const lowerBodyGeo = new THREE.BoxGeometry(1.88, 0.46, 4.4);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, paintMaterial);
    lowerBody.position.y = 0.46;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    this.bodyMesh.add(lowerBody);

    // Front Hood Slope
    const hoodGeo = new THREE.BoxGeometry(1.82, 0.26, 1.35);
    const hood = new THREE.Mesh(hoodGeo, paintMaterial);
    hood.position.set(0, 0.6, 1.48);
    hood.rotation.x = -0.065;
    this.bodyMesh.add(hood);

    // Front Radiator Grille
    const grilleGeo = new THREE.BoxGeometry(1.35, 0.2, 0.08);
    const grille = new THREE.Mesh(grilleGeo, blackTrimMaterial);
    grille.position.set(0, 0.44, 2.21);
    this.bodyMesh.add(grille);

    // Front Lip Spoiler & Air Intake
    const lipGeo = new THREE.BoxGeometry(1.86, 0.09, 0.38);
    const lip = new THREE.Mesh(lipGeo, blackTrimMaterial);
    lip.position.set(0, 0.22, 2.1);
    this.bodyMesh.add(lip);

    // Rear Trunk Deck
    const trunkGeo = new THREE.BoxGeometry(1.82, 0.32, 0.95);
    const trunk = new THREE.Mesh(trunkGeo, paintMaterial);
    trunk.position.set(0, 0.64, -1.68);
    this.bodyMesh.add(trunk);

    // Rear Lip Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.72, 0.05, 0.26);
    const spoiler = new THREE.Mesh(spoilerGeo, blackTrimMaterial);
    spoiler.position.set(0, 0.9, -2.1);
    this.bodyMesh.add(spoiler);

    // 2. Cabin / Greenhouse Roof
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.28);
    const cabin = new THREE.Mesh(cabinGeo, paintMaterial);
    cabin.position.set(0, 0.98, -0.15);
    this.bodyMesh.add(cabin);

    // Windshield (Front Glass)
    const windshieldGeo = new THREE.PlaneGeometry(1.54, 0.74);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0, 0.96, 1.0);
    windshield.rotation.x = -Math.PI / 3.4;
    this.bodyMesh.add(windshield);

    // Rear Window
    const rearWinGeo = new THREE.PlaneGeometry(1.52, 0.68);
    const rearWin = new THREE.Mesh(rearWinGeo, glassMaterial);
    rearWin.position.set(0, 0.98, -1.28);
    rearWin.rotation.x = Math.PI / 3.2;
    this.bodyMesh.add(rearWin);

    // Side Windows
    const sideWinGeo = new THREE.BoxGeometry(1.63, 0.4, 1.86);
    const sideWin = new THREE.Mesh(sideWinGeo, glassMaterial);
    sideWin.position.set(0, 0.98, -0.15);
    this.bodyMesh.add(sideWin);

    // Side Mirrors
    [-0.98, 0.98].forEach(x => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.14), paintMaterial);
      mirror.position.set(x, 0.82, 0.78);
      this.bodyMesh.add(mirror);
    });

    // 3. Cockpit Dashboard & Working Needles (RHD - Indonesian Driver Seat)
    this._buildCockpitInterior();

    // 4. Wheels & Suspension
    this._buildWheels();

    // 5. Realistic Projector Headlights
    this._buildHeadlights();

    // 6. Taillights & Brake Reflection
    this._buildTaillights();

    this.group.add(this.bodyMesh);
  }

  _buildCockpitInterior() {
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.9 });
    const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.32, 0.65), dashMat);
    dashboard.position.set(0, 0.74, 0.64);
    this.bodyMesh.add(dashboard);

    // Analog Speedometer & Tachometer Cluster Plate
    const gaugeTexture = TextureGenerator.createGaugeTexture();
    const clusterMat = new THREE.MeshBasicMaterial({
      map: gaugeTexture,
      transparent: true
    });
    const cluster = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.16), clusterMat);
    cluster.position.set(0.38, 0.86, 0.54);
    cluster.rotation.x = -0.32;
    this.bodyMesh.add(cluster);

    // Speedometer 3D Needle (Left dial)
    const needleMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const needleGeo = new THREE.PlaneGeometry(0.006, 0.045);
    needleGeo.translate(0, 0.02, 0);

    this.speedoNeedle = new THREE.Mesh(needleGeo, needleMat);
    this.speedoNeedle.position.set(0.33, 0.86, 0.535);
    this.speedoNeedle.rotation.x = -0.32;
    this.bodyMesh.add(this.speedoNeedle);

    // Tachometer 3D Needle (Right dial)
    const tachoNeedleMat = new THREE.MeshBasicMaterial({ color: 0xff3d00 });
    this.tachoNeedle = new THREE.Mesh(needleGeo, tachoNeedleMat);
    this.tachoNeedle.position.set(0.43, 0.86, 0.535);
    this.tachoNeedle.rotation.x = -0.32;
    this.bodyMesh.add(this.tachoNeedle);

    // Dashboard Ambient Cabin Glow (Soft amber/cyan light)
    const dashLight = new THREE.PointLight(0x00e5ff, 0.45, 1.8);
    dashLight.position.set(0.38, 0.88, 0.45);
    this.bodyMesh.add(dashLight);

    // Steering Wheel (Right-hand drive)
    const steerGeo = new THREE.TorusGeometry(0.17, 0.026, 8, 20);
    const steerMat = new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.85 });
    this.steeringWheel = new THREE.Mesh(steerGeo, steerMat);
    this.steeringWheel.position.set(0.38, 0.86, 0.44);
    this.steeringWheel.rotation.x = -0.42;
    this.bodyMesh.add(this.steeringWheel);

    // Rearview Mirror with faint red road reflection
    const mirrorMat = new THREE.MeshBasicMaterial({ color: 0x331010 });
    const cabinMirror = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.03), mirrorMat);
    cabinMirror.position.set(0, 1.12, 0.58);
    this.bodyMesh.add(cabinMirror);

    // Windshield Wiper
    const wiperGeo = new THREE.BoxGeometry(0.02, 0.46, 0.015);
    const wiperMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    this.wiper = new THREE.Mesh(wiperGeo, wiperMat);
    this.wiper.position.set(0.2, 0.86, 0.92);
    this.wiper.rotation.x = -Math.PI / 3.4;
    this.wiper.rotation.z = -0.7;
    this.bodyMesh.add(this.wiper);
  }

  _buildWheels() {
    const wheelRadius = 0.33;
    const wheelWidth = 0.23;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 22);
    wheelGeo.rotateZ(Math.PI / 2);

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.25 });

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.015, 12);
    rimGeo.rotateZ(Math.PI / 2);

    const positions = [
      { x: -0.94, y: 0.33, z: 1.4, isFront: true },
      { x: 0.94, y: 0.33, z: 1.4, isFront: true },
      { x: -0.94, y: 0.33, z: -1.4, isFront: false },
      { x: 0.94, y: 0.33, z: -1.4, isFront: false }
    ];

    positions.forEach(pos => {
      const hub = new THREE.Group();
      hub.position.set(pos.x, pos.y, pos.z);

      const tire = new THREE.Mesh(wheelGeo, tireMat);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      tire.castShadow = true;

      const rotGroup = new THREE.Group();
      rotGroup.add(tire, rim);
      hub.add(rotGroup);

      this.bodyMesh.add(hub);
      this.wheels.push(rotGroup);

      if (pos.isFront) {
        this.frontWheels.push(hub);
      }
    });
  }

  _buildHeadlights() {
    const lightOffsets = [-0.7, 0.7];
    const beamTexture = TextureGenerator.createHeadlightBeamMap();
    const shaftTexture = TextureGenerator.createBeamShaftTexture();

    // 4500K Natural Automotive Xenon Color (slight warm white)
    const xenonColor = 0xf5f8ff;

    lightOffsets.forEach(x => {
      // Headlight Projector Glass Lens
      const lensGeo = new THREE.BoxGeometry(0.26, 0.11, 0.06);
      const lensMat = new THREE.MeshBasicMaterial({ color: xenonColor });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(x, 0.54, 2.18);
      this.bodyMesh.add(lens);

      // 3D SpotLight attached DIRECTLY to bodyMesh so it stays perfectly locked with car
      const spot = new THREE.SpotLight(xenonColor, 15.0, 160, Math.PI / 4.5, 0.65, 1.2);
      spot.position.set(x, 0.54, 2.2);
      spot.map = beamTexture;
      spot.castShadow = false;

      // Target attached directly to bodyMesh pointing forward and slightly down at road
      const target = new THREE.Object3D();
      target.position.set(x * 0.25, -0.3, 50);
      this.bodyMesh.add(target);
      spot.target = target;
      this.bodyMesh.add(spot);

      this.headlights.push({ spot, target, baseIntensity: 15.0 });

      // Soft Volumetric Light Shaft slicing through mist (attached to bodyMesh)
      const beamGeo = new THREE.ConeGeometry(3.2, 28, 12, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      beamGeo.translate(0, 0, 14);

      const beamMat = new THREE.MeshBasicMaterial({
        map: shaftTexture,
        color: 0xc8ddff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(x, 0.54, 2.2);
      this.bodyMesh.add(beamMesh);
      this.lightBeams.push(beamMesh);
    });

    // Realistic Wide Front Road Illumination (PointLight wash - 100% immune to clipping/Z-fighting glitch)
    this.frontRoadLight = new THREE.PointLight(xenonColor, 7.5, 55, 1.3);
    this.frontRoadLight.position.set(0, 0.65, 4.5);
    this.bodyMesh.add(this.frontRoadLight);
  }

  _buildTaillights() {
    const rearOffsets = [-0.7, 0.7];
    const tailLensGeo = new THREE.BoxGeometry(0.28, 0.13, 0.05);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xdd1100 });

    rearOffsets.forEach(x => {
      const tail = new THREE.Mesh(tailLensGeo, tailMat);
      tail.position.set(x, 0.58, -2.18);
      this.bodyMesh.add(tail);
      this.taillights.push(tail);

      // Local brake flare light
      const brakePoint = new THREE.PointLight(0xff0500, 0.0, 12);
      brakePoint.position.set(x, 0.58, -2.35);
      this.bodyMesh.add(brakePoint);
      this.brakeLights.push(brakePoint);
    });

    // Realistic Wet Asphalt Red Ground Wash (Pendaran lampu rem ke aspal basah)
    this.groundBrakeLight = new THREE.PointLight(0xff0000, 0.2, 8, 1.8);
    this.groundBrakeLight.position.set(0, 0.2, -3.2);
    this.bodyMesh.add(this.groundBrakeLight);
  }

  _initSparkSystem() {
    // Metal friction sparks when scraping guardrail
    const count = 60;
    const geo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(count * 3);
    this.sparkVelocities = new Float32Array(count * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const sparkTex = TextureGenerator.createSoftSmokeTexture();
    const mat = new THREE.PointsMaterial({
      map: sparkTex,
      color: 0xffaa22,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparks = new THREE.Points(geo, mat);
    this.sparks.visible = false;
    this.scene.add(this.sparks);
  }

  cycleHeadlights() {
    this.headlightState = (this.headlightState + 1) % 3;
    this._updateHeadlightState();
    return this.getHeadlightStateName();
  }

  getHeadlightStateName() {
    switch (this.headlightState) {
      case 0: return "LAMPU: MATI";
      case 1: return "LAMPU: DEKAT (LOW BEAM)";
      case 2: return "LAMPU: JAUH (HIGH BEAM)";
      default: return "";
    }
  }

  _updateHeadlightState() {
    if (this.headlightState === 0) {
      this.headlights.forEach(h => { h.spot.intensity = 0; });
      this.lightBeams.forEach(b => { b.visible = false; });
      if (this.frontRoadLight) this.frontRoadLight.intensity = 0;
    } else if (this.headlightState === 1) {
      this.headlights.forEach(h => {
        h.spot.intensity = 15.0;
        h.spot.distance = 160;
        h.spot.angle = Math.PI / 4.5;
        h.target.position.y = -0.3;
      });
      this.lightBeams.forEach(b => {
        b.visible = true;
        b.material.opacity = 0.12;
        b.scale.set(1.0, 1.0, 1.0);
      });
      if (this.frontRoadLight) {
        this.frontRoadLight.intensity = 7.5;
        this.frontRoadLight.distance = 55;
      }
    } else if (this.headlightState === 2) {
      this.headlights.forEach(h => {
        h.spot.intensity = 28.0;
        h.spot.distance = 280;
        h.spot.angle = Math.PI / 3.8;
        h.target.position.y = 0.6;
      });
      this.lightBeams.forEach(b => {
        b.visible = true;
        b.material.opacity = 0.2;
        b.scale.set(1.25, 1.25, 1.6);
      });
      if (this.frontRoadLight) {
        this.frontRoadLight.intensity = 13.0;
        this.frontRoadLight.distance = 75;
      }
    }
  }

  setWiper(active) {
    this.isWiping = active;
  }

  update(dt, input) {
    const isBraking = input.down || input.space;
    const isAccelerating = input.up;

    // 1. Realistic 5-Speed Powertrain & RPM Simulation
    const speedKmh = Math.abs(this.velocity * 3.6);

    // Automatic Gear Selection
    if (speedKmh < 32) this.currentGear = 1;
    else if (speedKmh < 62) this.currentGear = 2;
    else if (speedKmh < 105) this.currentGear = 3;
    else if (speedKmh < 155) this.currentGear = 4;
    else this.currentGear = 5;

    // RPM Calculation based on gear ratio
    const currentRatio = this.gearRatios[this.currentGear - 1];
    let targetRpm = this.idleRpm + (this.velocity / this.maxSpeed) * (this.maxRpm - this.idleRpm) * (currentRatio / 1.5);
    if (isAccelerating) targetRpm += 400;
    targetRpm = Math.max(this.idleRpm, Math.min(this.maxRpm, targetRpm));

    this.engineRpm = THREE.MathUtils.lerp(this.engineRpm, targetRpm, 0.15);

    // Realistic Acceleration Curve with Mid-Range Torque Peak
    if (isAccelerating) {
      // Torque curve: peak power at 3800 - 5200 RPM
      const torqueFactor = 0.85 + Math.sin((this.engineRpm / this.maxRpm) * Math.PI) * 0.35;
      const accelPower = (14.5 * torqueFactor) / (1.0 + (speedKmh / 150) * 0.4);
      this.velocity += accelPower * dt;
      if (this.velocity > this.maxSpeed) this.velocity = this.maxSpeed;
    } else if (input.down && this.velocity <= 0.6) {
      // Reverse
      this.velocity -= 8.5 * dt;
      if (this.velocity < this.maxReverseSpeed) this.velocity = this.maxReverseSpeed;
    } else if (isBraking && this.velocity > 0) {
      const brakeForce = input.space ? 48.0 : 26.0;
      this.velocity -= brakeForce * dt;
      if (this.velocity < 0) this.velocity = 0;
    } else {
      // Natural highway drag
      const drag = 2.8 + Math.abs(this.velocity) * 0.0035;
      if (this.velocity > 0) this.velocity = Math.max(0, this.velocity - drag * dt);
      else if (this.velocity < 0) this.velocity = Math.min(0, this.velocity + drag * dt);
    }

    // 2. Highway Steering Stability (Speed-Dependent Sensitivity)
    const speedRatio = Math.min(Math.abs(this.velocity) / this.maxSpeed, 1.0);
    // At high speeds, steering response is stable; at low speed, nimble
    const dynamicMaxSteer = this.maxSteerAngle * (1.0 - speedRatio * 0.52);

    // Corrected steering input (Inverted per user report to match intuitive left-right):
    let steerInput = 0;
    if (input.left) steerInput += 1.0;
    if (input.right) steerInput -= 1.0;

    const targetSteer = steerInput * dynamicMaxSteer;
    // Buttery-smooth lerp interpolation
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, Math.min(14.0 * dt, 1.0));

    if (Math.abs(this.velocity) > 0.1) {
      // Lateral highway movement (A moves Left, D moves Right)
      const lateralDelta = this.steerAngle * (this.velocity * 0.44) * dt;
      this.position.x += lateralDelta;
    }

    // 3. Guardrail Scraping Physics & Sparks
    let hitGuardrail = false;
    let scrapeSide = 0;

    if (this.position.x < this.minX) {
      this.position.x = this.minX;
      this.velocity *= 0.95;
      hitGuardrail = true;
      scrapeSide = -1;
    } else if (this.position.x > this.maxX) {
      this.position.x = this.maxX;
      this.velocity *= 0.95;
      hitGuardrail = true;
      scrapeSide = 1;
    }

    this.isScraping = hitGuardrail && this.velocity > 5.0;
    this._updateSparks(dt, scrapeSide);

    // 4. Highway Expansion Joint Detection (Sambungan Beton Tol)
    let passedJoint = false;
    if (this.position.z - this.lastJointDistance >= this.jointInterval) {
      this.lastJointDistance = this.position.z;
      this.suspensionHeave = 0.035; // Bump the chassis upward
      passedJoint = true;
    }
    this.suspensionHeave = THREE.MathUtils.lerp(this.suspensionHeave, 0, 0.2);

    // 5. Dynamic Kinematics: Body Roll, Pitch, Yaw Heading
    const targetRoll = this.steerAngle * speedRatio * 0.12;
    this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, targetRoll, 0.15);

    let targetPitch = 0;
    if (isBraking && this.velocity > 5) targetPitch = -0.045;
    else if (isAccelerating && this.velocity < 30) targetPitch = 0.03;
    this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, targetPitch, 0.12);

    // Subtle high-speed micro-vibration on highway
    const microVibe = (Math.sin(Date.now() * 0.05) * 0.002) * (speedRatio);

    // Body orientations
    this.bodyMesh.rotation.z = -this.bodyRoll;
    this.bodyMesh.rotation.x = this.bodyPitch;
    this.bodyMesh.rotation.y = this.steerAngle * 0.42; // Yaw heading turns into corner!
    this.bodyMesh.position.y = this.suspensionHeave + microVibe;

    // 6. Update Interior Cockpit Needles
    if (this.speedoNeedle) {
      const speedAngle = -1.15 + (Math.min(speedKmh, 220) / 220) * 3.3;
      this.speedoNeedle.rotation.z = -speedAngle;
    }
    if (this.tachoNeedle) {
      const tachoAngle = -1.15 + (this.engineRpm / 8000) * 3.3;
      this.tachoNeedle.rotation.z = -tachoAngle;
    }

    // Steering wheel turning (Counter-clockwise for Left, Clockwise for Right)
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -this.steerAngle * 3.8;
    }

    // Front wheels steer direction (Left for Left, Right for Right)
    this.frontWheels.forEach(w => {
      w.rotation.y = this.steerAngle * 0.85;
    });

    // Wheels axle rotation
    const wheelTurn = (this.velocity * dt) / 0.33;
    this.wheels.forEach(w => {
      w.rotation.x += wheelTurn;
    });

    // Wiper blade sweep
    if (this.isWiping && this.wiper) {
      this.wiperAngle += dt * 5.2;
      this.wiper.rotation.z = -0.7 + Math.sin(this.wiperAngle) * 0.88;
    }

    // Brake lights visual flare & ground reflection
    const showBrake = isBraking && this.velocity > 0;
    this.brakeLights.forEach(l => {
      l.intensity = showBrake ? 3.8 : 0.0;
    });
    if (this.groundBrakeLight) {
      this.groundBrakeLight.intensity = showBrake ? 2.8 : 0.25;
    }

    // Forward movement integrated directly here for 100% smooth, jitter-free progression
    if (this.velocity !== 0) {
      this.position.z += this.velocity * dt;
    }

    // Update World Position
    this.group.position.x = this.position.x;
    this.group.position.y = this.position.y;
    this.group.position.z = this.position.z;

    return {
      speedKmh: Math.round(speedKmh),
      velocity: this.velocity,
      rpm: Math.round(this.engineRpm),
      gear: this.currentGear,
      hitGuardrail,
      isScraping: this.isScraping,
      passedJoint
    };
  }

  _updateSparks(dt, side) {
    if (!this.sparks) return;

    if (!this.isScraping) {
      this.sparks.visible = false;
      return;
    }

    this.sparks.visible = true;
    const originX = this.position.x + side * 0.95;
    const originY = 0.45;
    const originZ = this.position.z - 0.5;

    for (let i = 0; i < this.sparkPositions.length; i += 3) {
      // Reset spark when dead
      if (Math.random() < 0.25) {
        this.sparkPositions[i] = originX + (Math.random() - 0.5) * 0.2;
        this.sparkPositions[i + 1] = originY + (Math.random() - 0.5) * 0.2;
        this.sparkPositions[i + 2] = originZ;

        this.sparkVelocities[i] = side * (Math.random() * 2 + 1);
        this.sparkVelocities[i + 1] = Math.random() * 3 + 1;
        this.sparkVelocities[i + 2] = -Math.random() * 15 - 5;
      } else {
        this.sparkPositions[i] += this.sparkVelocities[i] * dt;
        this.sparkPositions[i + 1] += this.sparkVelocities[i + 1] * dt;
        this.sparkPositions[i + 2] += this.sparkVelocities[i + 2] * dt;
        this.sparkVelocities[i + 1] -= 9.8 * dt; // gravity
      }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  getCockpitCameraPosition() {
    const camPos = new THREE.Vector3(0.38, 1.06, 0.12);
    camPos.applyMatrix4(this.bodyMesh.matrixWorld);
    return camPos;
  }

  getChaseCameraPosition() {
    return new THREE.Vector3(
      this.position.x * 0.82,
      this.position.y + 2.38,
      this.position.z - 6.4
    );
  }

  getHoodCameraPosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + 0.98,
      this.position.z + 1.25
    );
  }
}

/**
 * AI Highway Traffic Vehicle (Truck & Mysterious Ghost Sedan)
 */
export class TrafficVehicle {
  constructor(scene, type = 'truck', spawnZ = 120, lane = 1) {
    this.scene = scene;
    this.type = type;
    this.lane = lane;
    this.group = new THREE.Group();
    this.velocity = type === 'truck' ? 16.0 : 28.0; // ~58 km/h or ~100 km/h
    this.active = true;

    const laneX = [-2.6, 0.0, 2.6][lane + 1] || 0;
    this.group.position.set(laneX, 0, spawnZ);

    if (type === 'truck') {
      this._buildTruck();
      this.colliderSize = { width: 2.7, length: 9.8, height: 3.6 };
    } else {
      this._buildGhostCar();
      this.colliderSize = { width: 1.9, length: 4.5, height: 1.5 };
    }

    this.scene.add(this.group);
  }

  _buildTruck() {
    // Indonesian Heavy Cargo Truck (Truk Gandeng Pantura / Tol Cipularang)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x9e3f16, roughness: 0.65 });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x1f2730, roughness: 0.85 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.8 });

    // Chassis frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 9.4), metalMat);
    frame.position.y = 0.55;
    this.group.add(frame);

    // Front Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.3, 2.1), cabMat);
    cab.position.set(0, 1.75, 3.4);
    this.group.add(cab);

    // Headlights illuminating the road ahead of the truck
    [-0.8, 0.8].forEach(x => {
      const headSpot = new THREE.SpotLight(0xfff5dd, 4.0, 60, Math.PI / 6, 0.4);
      headSpot.position.set(x, 0.7, 4.45);
      const headTarget = new THREE.Object3D();
      headTarget.position.set(x, 0.1, 40);
      headSpot.target = headTarget;
      this.group.add(headSpot, headTarget);
    });

    // Big Cargo Box
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.7, 6.8), cargoMat);
    box.position.set(0, 2.05, -1.1);
    box.castShadow = true;
    this.group.add(box);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xee1100 });
    [-0.95, 0.95].forEach(x => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.05), tailMat);
      t.position.set(x, 0.75, -4.52);
      this.group.add(t);
    });

    // Amber side clearance marker lights
    const amberMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
    [-1.24, 1.24].forEach(x => {
      for (let z = -4.0; z <= 2.0; z += 2.0) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.12), amberMat);
        marker.position.set(x, 0.8, z);
        this.group.add(marker);
      }
    });

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.28, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    [3.4, -1.8, -3.4].forEach(z => {
      [-1.15, 1.15].forEach(x => {
        const w = new THREE.Mesh(wheelGeo, wMat);
        w.position.set(x, 0.44, z);
        this.group.add(w);
      });
    });
  }

  _buildGhostCar() {
    const carMat = new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.25, metalness: 0.85 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.72, 4.3), carMat);
    body.position.y = 0.55;
    this.group.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.52, 2.1), carMat);
    roof.position.set(0, 1.08, -0.2);
    this.group.add(roof);

    // Faint red rear lights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xee1111 });
    [-0.68, 0.68].forEach(x => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.05), tailMat);
      t.position.set(x, 0.62, -2.17);
      this.group.add(t);
    });
  }

  update(dt, playerZ) {
    if (!this.active) return;
    this.group.position.z += this.velocity * dt;

    if (this.group.position.z < playerZ - 90 || this.group.position.z > playerZ + 700) {
      this.recycle(playerZ);
    }
  }

  recycle(playerZ) {
    const spawnDistance = 250 + Math.random() * 250;
    this.group.position.z = playerZ + spawnDistance;
    const lanes = [-2.6, 0.0, 2.6];
    this.group.position.x = lanes[Math.floor(Math.random() * lanes.length)];
  }

  checkCollision(playerPos) {
    const dx = Math.abs(this.group.position.x - playerPos.x);
    const dz = Math.abs(this.group.position.z - playerPos.z);
    return dx < (this.colliderSize.width * 0.75) && dz < (this.colliderSize.length * 0.55);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
