// ============================================================================
// PANTURA: MUDIK ODYSSEY — REAL-SCALE STYLIZED 3D VEHICLES (1 UNIT = 1 METER)
// Family MPV (4.55m), High-Deck SHD Bus Malam (12m), Truk Pantura (7.8m) & Motor
// ============================================================================

import * as THREE from '../libs/three.module.js';
import { createBannerTexture } from './textures.js';

export function createPlayerMPV(mpvConfig) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: mpvConfig.bodyColor,
    roughness: 0.28,
    metalness: 0.35
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: mpvConfig.accentColor || 0x3b82f6,
    roughness: 0.35,
    metalness: 0.4
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x181c22,
    roughness: 0.72
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.85
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x16222f,
    roughness: 0.12,
    metalness: 0.75,
    emissive: 0x382919,
    emissiveIntensity: 0.22
  });

  // 1. Main Lower MPV Chassis (1.92m wide, 0.74m tall, 4.55m long)
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.74, 4.55), bodyMat);
  lowerBody.position.set(0, 0.68, 0);
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  bodyGroup.add(lowerBody);

  // Side Cladding / Skirt
  const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.16, 3.2), trimMat);
  sideSkirt.position.set(0, 0.38, 0);
  bodyGroup.add(sideSkirt);

  // 2. Sculpted Hood & Front Grille
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.24, 1.22), bodyMat);
  hood.position.set(0, 0.98, -1.58);
  hood.rotation.x = 0.14;
  hood.castShadow = true;
  bodyGroup.add(hood);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.32, 0.08), trimMat);
  grille.position.set(0, 0.76, -2.26);
  bodyGroup.add(grille);

  const chromeBar = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.07, 0.1), chromeMat);
  chromeBar.position.set(0, 0.86, -2.27);
  bodyGroup.add(chromeBar);

  // 3. Upper 3-Row MPV Cabin Greenhouse
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.68, 2.95), bodyMat);
  cabin.position.set(0, 1.34, 0.28);
  cabin.castShadow = true;
  bodyGroup.add(cabin);

  // Rear Roof Spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.1, 0.32), bodyMat);
  spoiler.position.set(0, 1.66, 1.78);
  bodyGroup.add(spoiler);

  // Windows (Front Windshield, Rear Glass, Side Windows)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.58, 0.1), glassMat);
  windshield.position.set(0, 1.32, -1.16);
  windshield.rotation.x = -0.34;
  bodyGroup.add(windshield);

  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.52, 0.1), glassMat);
  rearWindow.position.set(0, 1.34, 1.74);
  rearWindow.rotation.x = 0.16;
  bodyGroup.add(rearWindow);

  const sideWindows = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.48, 2.55), glassMat);
  sideWindows.position.set(0, 1.35, 0.32);
  bodyGroup.add(sideWindows);

  // Side Mirrors (Spion Kiri & Kanan)
  const mirrorGeo = new THREE.BoxGeometry(0.24, 0.16, 0.14);
  const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorL.position.set(-1.04, 1.12, -0.92);
  const mirrorR = mirrorL.clone();
  mirrorR.position.x = 1.04;
  bodyGroup.add(mirrorL, mirrorR);

  // Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.32, 0.35), trimMat);
  frontBumper.position.set(0, 0.45, -2.18);
  bodyGroup.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.34, 0.35), trimMat);
  rearBumper.position.set(0, 0.45, 2.18);
  bodyGroup.add(rearBumper);

  // Rear Chrome Garnish & License Plate ("B 1945 MDK")
  const rearChrome = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.06), chromeMat);
  rearChrome.position.set(0, 0.92, 2.27);
  bodyGroup.add(rearChrome);

  const plateTex = createBannerTexture('#111827', '#ffffff', 'B 1945 MDK', '08 • 29', '#ffffff');
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.04), plateMat);
  rearPlate.position.set(0, 0.74, 2.28);
  const frontPlate = rearPlate.clone();
  frontPlate.position.set(0, 0.52, -2.35);
  bodyGroup.add(rearPlate, frontPlate);

  // Headlights & Taillights
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfff8dc });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const signalMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

  const headL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.1), headLightMat);
  headL.position.set(-0.72, 0.82, -2.25);
  const headR = headL.clone();
  headR.position.x = 0.72;
  bodyGroup.add(headL, headR);

  // L-Shaped Modern MPV Taillights
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.1), tailLightMat);
  tailL.position.set(-0.74, 0.88, 2.25);
  const tailR = tailL.clone();
  tailR.position.x = 0.74;
  bodyGroup.add(tailL, tailR);

  const sigL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.11), signalMat);
  sigL.position.set(-0.78, 0.72, 2.25);
  const sigR = sigL.clone();
  sigR.position.x = 0.78;
  bodyGroup.add(sigL, sigR);

  // Headlight Beams & Real SpotLight
  const lightGroup = new THREE.Group();
  const beamGeo = new THREE.ConeGeometry(3.2, 22, 16, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3c4,
    transparent: true,
    opacity: 0.11,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.set(0, 0.42, -13.2);
  lightGroup.add(beamMesh);

  const spotLight = new THREE.SpotLight(0xfff1c1, 4.0, 65, Math.PI / 4.5, 0.5, 1.1);
  spotLight.position.set(0, 0.95, -2.2);
  spotLight.target.position.set(0, 0.1, -26);
  lightGroup.add(spotLight);
  lightGroup.add(spotLight.target);
  bodyGroup.add(lightGroup);

  // ==========================================================================
  // DYNAMIC 3D ROOF RACK & MUDIK CARGO
  // ==========================================================================
  const roofRackGroup = new THREE.Group();
  roofRackGroup.position.set(0, 1.7, 0.35);
  bodyGroup.add(roofRackGroup);

  const railMesh = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.06, 2.15), trimMat);
  roofRackGroup.add(railMesh);

  const cargoItemsGroup = new THREE.Group();
  roofRackGroup.add(cargoItemsGroup);

  const boxMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.85 });
  const cardboard1 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.44, 0.75), boxMat);
  cardboard1.position.set(-0.32, 0.24, 0.35);
  cardboard1.castShadow = true;
  cargoItemsGroup.add(cardboard1);

  const cardboard2 = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.38, 0.65), boxMat);
  cardboard2.position.set(0.34, 0.21, 0.42);
  cardboard2.castShadow = true;
  cargoItemsGroup.add(cardboard2);

  const tinMat = new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.35, metalness: 0.35 });
  const khongGuanTin = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.38), tinMat);
  khongGuanTin.position.set(-0.32, 0.23, -0.35);
  khongGuanTin.castShadow = true;
  cargoItemsGroup.add(khongGuanTin);

  const suitcase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.72), accentMat);
  suitcase.position.set(0.32, 0.19, -0.32);
  suitcase.castShadow = true;
  cargoItemsGroup.add(suitcase);

  const tarpColor = mpvConfig.roofStyle === 'aero_roofbox' ? 0x1f2937 : 0x1d4ed8;
  const tarpMat = new THREE.MeshStandardMaterial({
    color: tarpColor,
    roughness: mpvConfig.roofStyle === 'aero_roofbox' ? 0.25 : 0.62
  });
  const tarpCover = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.46, 1.82), tarpMat);
  tarpCover.position.set(0, 0.26, 0.04);
  tarpCover.castShadow = true;
  roofRackGroup.add(tarpCover);

  const ropeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const rope1 = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.49, 0.05), ropeMat);
  rope1.position.set(0, 0.26, -0.38);
  const rope2 = rope1.clone();
  rope2.position.z = 0.42;
  roofRackGroup.add(rope1, rope2);

  // ==========================================================================
  // 4 WHEELS
  // ==========================================================================
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.25, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

  const wheelOffsets = [
    [-0.92, 0.38, -1.42],
    [0.92, 0.38, -1.42],
    [-0.92, 0.38, 1.42],
    [0.92, 0.38, 1.42]
  ];

  wheelOffsets.forEach(([wx, wy, wz]) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, wy, wz);
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.castShadow = true;
    wGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.27, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    wGroup.add(rim);

    root.add(wGroup);
    wheels.push(wGroup);
  });

  root.userData = {
    bodyGroup,
    wheels,
    lightGroup,
    tailL,
    tailR,
    tarpCover,
    rope1,
    rope2,
    cargoItemsGroup,
    updateRoofVisuals(inventoryCount, tarpSecured) {
      tarpCover.visible = tarpSecured && inventoryCount > 0;
      rope1.visible = tarpSecured && inventoryCount > 0;
      rope2.visible = tarpSecured && inventoryCount > 0;
      cargoItemsGroup.visible = inventoryCount > 0;
      cardboard1.visible = inventoryCount >= 1;
      khongGuanTin.visible = inventoryCount >= 2;
      cardboard2.visible = inventoryCount >= 3;
      suitcase.visible = inventoryCount >= 4;
    }
  };

  return root;
}

// ============================================================================
// REAL-SCALE TRAFFIC: HIGH-DECK SHD BUS MALAM (11.8m), TRUK PANTURA (7.6m),
// PEMUDIK MOTOR, AND FELLOW MPV
// ============================================================================
export function createTrafficVehicle(type) {
  const group = new THREE.Group();
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff5c0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2626 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

  if (type === 'bus_pantura') {
    // REAL INDONESIAN SHD DOUBLE-GLASS BUS MALAM (Width: 2.55m, Height: 3.7m, Length: 11.6m)
    const busLiveries = [
      { body: 0xdc2626, stripe: 0xfacc15, name: 'SUMBER KENCONO • PATAS' },
      { body: 0x1d4ed8, stripe: 0xf8fafc, name: 'PO HARYANTO • PANTURA' },
      { body: 0x047857, stripe: 0xfbbf24, name: 'SINAR JAYA • EKSEKUTIF' },
      { body: 0x7c2d12, stripe: 0xfde047, name: 'HARAPAN JAYA • SURABAYA' }
    ];
    const livery = busLiveries[Math.floor(Math.random() * busLiveries.length)];
    const busMat = new THREE.MeshStandardMaterial({ color: livery.body, roughness: 0.32, metalness: 0.25 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: livery.stripe, roughness: 0.35 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.7 });

    // Main Coach Body (11.6m long!)
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.55, 3.15, 11.6), busMat);
    body.position.set(0, 1.98, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Livery Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.59, 0.38, 11.2), stripeMat);
    stripe.position.set(0, 1.45, 0);
    group.add(stripe);

    // Panoramic Side & Double Front Glass (SHD Topi Bus)
    const windows = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.15, 11.3), glassMat);
    windows.position.set(0, 2.55, 0);
    group.add(windows);

    // SHD Divider Bando ("Topi SHD") on front windshield
    const bando = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.22, 0.35), busMat);
    bando.position.set(0, 2.65, -5.68);
    group.add(bando);

    // Rooftop Denso AC Unit
    const acUnit = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.32, 3.6), stripeMat);
    acUnit.position.set(0, 3.68, -0.4);
    group.add(acUnit);

    // Glowing LED Destination Text Board
    const signTex = createBannerTexture('#090d16', '#00f5d4', livery.name, 'JAKARTA - CIREBON - SURABAYA', '#00f5d4');
    const ledSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.38, 0.08),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    ledSign.position.set(0, 3.22, -5.81);
    group.add(ledSign);

    // Strobe LED Strip on Lower Windshield
    const strobeColors = [0x00f5d4, 0xff007f, 0xfee440, 0x38bdf8];
    const strobeMat = new THREE.MeshBasicMaterial({
      color: strobeColors[Math.floor(Math.random() * strobeColors.length)]
    });
    const strobe = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.09), strobeMat);
    strobe.position.set(0, 1.98, -5.81);
    group.add(strobe);

    // Headlights & Tall Taillights
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.1), headMat);
    hL.position.set(-0.95, 0.85, -5.81);
    const hR = hL.clone();
    hR.position.x = 0.95;
    group.add(hL, hR);

    const tL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.1), tailMat);
    tL.position.set(-0.98, 1.1, 5.81);
    const tR = tL.clone();
    tR.position.x = 0.98;
    group.add(tL, tR);

    // 6 Bus Wheels
    const wGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.32, 12);
    wGeo.rotateZ(Math.PI / 2);
    [[-1.22, -3.6], [1.22, -3.6], [-1.22, 2.6], [1.22, 2.6], [-1.22, 3.9], [1.22, 3.9]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, tireMat);
      w.position.set(wx, 0.52, wz);
      group.add(w);
    });

    group.userData = { type: 'bus_pantura', halfLen: 5.9, halfWid: 1.32 };
    return group;
  }

  if (type === 'truk_canter') {
    // TRUK CANTER / FUSO PANTURA (Width: 2.35m, Height: 3.2m, Length: 7.4m)
    const cabColors = [0xfacc15, 0x16a34a, 0xdc2626, 0xf97316];
    const cabMat = new THREE.MeshStandardMaterial({
      color: cabColors[Math.floor(Math.random() * cabColors.length)],
      roughness: 0.38
    });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.72 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

    // Front Tilt Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.15, 2.05), cabMat);
    cabin.position.set(0, 1.48, -2.55);
    cabin.castShadow = true;
    group.add(cabin);

    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.72, 0.1), glassMat);
    cabGlass.position.set(0, 1.88, -3.56);
    group.add(cabGlass);

    // Rear Wooden Bak + High Tarpaulin Cargo
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.35, 5.2), woodMat);
    bed.position.set(0, 1.12, 1.15);
    bed.castShadow = true;
    group.add(bed);

    const tarp = new THREE.Mesh(new THREE.BoxGeometry(2.32, 1.35, 5.05), cargoMat);
    tarp.position.set(0, 2.42, 1.15);
    tarp.castShadow = true;
    group.add(tarp);

    // Rear Truck Art Banner ("DOA IBU SEPANJANG PANTURA")
    const sloganTex = createBannerTexture('#facc15', '#dc2626', 'DOA IBU', 'PEJUANG KILOMETER PANTURA', '#111827');
    const rearBanner = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.95, 0.08),
      new THREE.MeshBasicMaterial({ map: sloganTex })
    );
    rearBanner.position.set(0, 1.25, 3.76);
    group.add(rearBanner);

    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), headMat);
    hL.position.set(-0.82, 0.78, -3.58);
    const hR = hL.clone();
    hR.position.x = 0.82;
    group.add(hL, hR);

    const tL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), tailMat);
    tL.position.set(-0.85, 0.7, 3.78);
    const tR = tL.clone();
    tR.position.x = 0.85;
    group.add(tL, tR);

    const wGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.28, 12);
    wGeo.rotateZ(Math.PI / 2);
    [[-1.12, -2.4], [1.12, -2.4], [-1.12, 2.2], [1.12, 2.2]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, tireMat);
      w.position.set(wx, 0.46, wz);
      group.add(w);
    });

    group.userData = { type: 'truk_canter', halfLen: 3.8, halfWid: 1.22 };
    return group;
  }

  if (type === 'motor_mudik') {
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.7 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.85 });
    const tinMat = new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.7, 1.95), bikeMat);
    body.position.set(0, 0.52, 0);
    body.castShadow = true;
    group.add(body);

    const rider = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.78, 0.46), jacketMat);
    rider.position.set(0, 1.18, -0.15);
    group.add(rider);

    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.38), helmetMat);
    helmet.position.set(0, 1.72, -0.15);
    group.add(helmet);

    const rearBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.52, 0.6), boxMat);
    rearBox.position.set(0, 1.06, 0.65);
    rearBox.castShadow = true;
    group.add(rearBox);

    const redTin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), tinMat);
    redTin.position.set(0, 1.48, 0.65);
    group.add(redTin);

    const hLight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.08), headMat);
    hLight.position.set(0, 0.84, -0.98);
    group.add(hLight);

    const tLight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.08), tailMat);
    tLight.position.set(0, 0.74, 0.98);
    group.add(tLight);

    group.userData = { type: 'motor_mudik', halfLen: 1.05, halfWid: 0.48 };
    return group;
  }

  // Fellow Family MPV / SUV Pemudik
  const carColors = [0x94a3b8, 0x475569, 0xb91c1c, 0x0f766e, 0xd97706, 0xe2e8f0];
  const carMat = new THREE.MeshStandardMaterial({
    color: carColors[Math.floor(Math.random() * carColors.length)],
    roughness: 0.32,
    metalness: 0.3
  });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 4.35), carMat);
  base.position.set(0, 0.64, 0);
  base.castShadow = true;
  group.add(base);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, 2.55), carMat);
  top.position.set(0, 1.28, 0.22);
  top.castShadow = true;
  group.add(top);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.46, 2.25), glassMat);
  glass.position.set(0, 1.3, 0.22);
  group.add(glass);

  const lugMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.65 });
  const lug = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.36, 1.35), lugMat);
  lug.position.set(0, 1.74, 0.28);
  group.add(lug);

  const hL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.1), headMat);
  hL.position.set(-0.68, 0.76, -2.18);
  const hR = hL.clone();
  hR.position.x = 0.68;
  group.add(hL, hR);

  const tL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.1), tailMat);
  tL.position.set(-0.68, 0.78, 2.18);
  const tR = tL.clone();
  tR.position.x = 0.68;
  group.add(tL, tR);

  group.userData = { type: 'mpv_lain', halfLen: 2.2, halfWid: 1.0 };
  return group;
}
