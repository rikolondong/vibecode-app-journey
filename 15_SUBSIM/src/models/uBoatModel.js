import * as THREE from 'three';

export function createUBoatModel() {
  const group = new THREE.Group();

  // Kriegsmarine Naval Paint Palette
  const hullMetal = new THREE.MeshStandardMaterial({
    color: 0x7a8694, // Light naval grey as in reference photo
    roughness: 0.45,
    metalness: 0.4
  });

  const lowerKeel = new THREE.MeshStandardMaterial({
    color: 0x48515a, // Darker bottom antifouling grey
    roughness: 0.65,
    metalness: 0.3
  });

  const upperDeckWood = new THREE.MeshStandardMaterial({
    color: 0x484034, // Teak wood deck
    roughness: 0.85,
    metalness: 0.1
  });

  const darkDetails = new THREE.MeshStandardMaterial({
    color: 0x22262a,
    roughness: 0.6,
    metalness: 0.5
  });

  const brassPropeller = new THREE.MeshStandardMaterial({
    color: 0xd4a748,
    roughness: 0.3,
    metalness: 0.85
  });

  // --- 1. MAIN HULL (Pressure Hull & Saddle Tanks) ---
  const hullGeom = new THREE.CylinderGeometry(2.8, 1.2, 58, 24, 16);
  hullGeom.rotateZ(Math.PI / 2);
  const mainHull = new THREE.Mesh(hullGeom, hullMetal);
  mainHull.scale.set(1, 0.75, 1.15);
  mainHull.castShadow = true;
  mainHull.receiveShadow = true;
  group.add(mainHull);

  // Lower keel
  const keelGeom = new THREE.BoxGeometry(50, 1.4, 2.2);
  const keel = new THREE.Mesh(keelGeom, lowerKeel);
  keel.position.set(0, -1.8, 0);
  group.add(keel);

  // Bow cone (tapered knife bow)
  const bowGeom = new THREE.ConeGeometry(2.7, 12, 16);
  bowGeom.rotateZ(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeom, hullMetal);
  bow.position.set(34, 0.2, 0);
  bow.scale.set(1, 0.75, 0.65);
  bow.castShadow = true;
  group.add(bow);

  // Bow stem / net cutter
  const stemGeom = new THREE.BoxGeometry(3, 3.5, 0.3);
  const stem = new THREE.Mesh(stemGeom, darkDetails);
  stem.position.set(39.5, 0.4, 0);
  stem.rotation.z = -0.5;
  group.add(stem);

  // Stern cone
  const sternGeom = new THREE.ConeGeometry(2.3, 15, 16);
  sternGeom.rotateZ(Math.PI / 2);
  const stern = new THREE.Mesh(sternGeom, hullMetal);
  stern.position.set(-35.5, 0.1, 0);
  stern.scale.set(1, 0.7, 0.7);
  stern.castShadow = true;
  group.add(stern);

  // --- 2. SADDLE TANKS ---
  const tankGeom = new THREE.CylinderGeometry(1.6, 1.6, 32, 16);
  tankGeom.rotateZ(Math.PI / 2);

  const leftTank = new THREE.Mesh(tankGeom, hullMetal);
  leftTank.position.set(2, -0.2, 2.3);
  leftTank.scale.set(1, 0.6, 0.65);
  leftTank.castShadow = true;
  group.add(leftTank);

  const rightTank = new THREE.Mesh(tankGeom, hullMetal);
  rightTank.position.set(2, -0.2, -2.3);
  rightTank.scale.set(1, 0.6, 0.65);
  rightTank.castShadow = true;
  group.add(rightTank);

  // Limber holes / drainage slots
  for (let x = -14; x <= 16; x += 3.2) {
    const slitGeom = new THREE.BoxGeometry(2.0, 0.3, 0.2);
    const slitL = new THREE.Mesh(slitGeom, darkDetails);
    slitL.position.set(x, 0.6, 2.9);
    group.add(slitL);

    const slitR = new THREE.Mesh(slitGeom, darkDetails);
    slitR.position.set(x, 0.6, -2.9);
    group.add(slitR);
  }

  // --- 3. UPPER WOODEN DECK ---
  const deckGeom = new THREE.BoxGeometry(54, 0.6, 3.8);
  const deck = new THREE.Mesh(deckGeom, upperDeckWood);
  deck.position.set(1, 1.9, 0);
  deck.castShadow = true;
  group.add(deck);

  const bowDeckGeom = new THREE.ConeGeometry(2.0, 14, 4);
  bowDeckGeom.rotateZ(-Math.PI / 2);
  const bowDeck = new THREE.Mesh(bowDeckGeom, upperDeckWood);
  bowDeck.position.set(33, 1.8, 0);
  bowDeck.scale.set(1, 0.3, 0.85);
  group.add(bowDeck);

  // --- 4. CONNING TOWER (TURM) ---
  const towerGroup = new THREE.Group();
  towerGroup.position.set(4, 2.2, 0);

  // Lower tower base
  const towerBaseGeom = new THREE.BoxGeometry(11, 3.2, 2.8);
  const towerBase = new THREE.Mesh(towerBaseGeom, hullMetal);
  towerBase.position.set(0, 1.6, 0);
  towerBase.castShadow = true;
  towerGroup.add(towerBase);

  // Curved bridge front
  const bridgeFrontGeom = new THREE.CylinderGeometry(1.4, 1.4, 3.2, 16, 1, false, 0, Math.PI);
  bridgeFrontGeom.rotateY(-Math.PI / 2);
  const bridgeFront = new THREE.Mesh(bridgeFrontGeom, hullMetal);
  bridgeFront.position.set(5.5, 1.6, 0);
  bridgeFront.castShadow = true;
  towerGroup.add(bridgeFront);

  // Wintergarten
  const wintergartenGeom = new THREE.BoxGeometry(4.5, 0.5, 3.2);
  const wintergarten = new THREE.Mesh(wintergartenGeom, upperDeckWood);
  wintergarten.position.set(-6, 1.6, 0);
  towerGroup.add(wintergarten);

  // Railings
  const railingGeom = new THREE.TorusGeometry(1.6, 0.08, 6, 16, Math.PI);
  railingGeom.rotateX(Math.PI / 2);
  railingGeom.rotateZ(Math.PI / 2);
  const railingAft = new THREE.Mesh(railingGeom, darkDetails);
  railingAft.position.set(-6.5, 2.8, 0);
  towerGroup.add(railingAft);

  // Periscope shears
  const periscopeShearGeom = new THREE.CylinderGeometry(0.35, 0.45, 6, 8);
  const periscopeShear = new THREE.Mesh(periscopeShearGeom, darkDetails);
  periscopeShear.position.set(0.5, 5, 0);
  towerGroup.add(periscopeShear);

  // Attack periscope
  const periscopeOpticGeom = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
  const periscopeOptic = new THREE.Mesh(periscopeOpticGeom, darkDetails);
  periscopeOptic.position.set(0.5, 6.2, 0);
  towerGroup.add(periscopeOptic);

  // Observation periscope
  const obsPeriscopeGeom = new THREE.CylinderGeometry(0.09, 0.09, 6.5, 8);
  const obsPeriscope = new THREE.Mesh(obsPeriscopeGeom, darkDetails);
  obsPeriscope.position.set(-2, 5.5, 0.4);
  towerGroup.add(obsPeriscope);

  // Direction finder loop
  const loopGeom = new THREE.TorusGeometry(0.45, 0.05, 6, 16);
  const loopAntenna = new THREE.Mesh(loopGeom, darkDetails);
  loopAntenna.position.set(-3.5, 4.2, 0);
  towerGroup.add(loopAntenna);

  // Flagpole & Naval Flag
  const flagPoleGeom = new THREE.CylinderGeometry(0.04, 0.04, 3, 6);
  const flagPole = new THREE.Mesh(flagPoleGeom, darkDetails);
  flagPole.position.set(-7.5, 3.2, 0);
  towerGroup.add(flagPole);

  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 128;
  flagCanvas.height = 80;
  const fCtx = flagCanvas.getContext('2d');
  fCtx.fillStyle = '#be1414';
  fCtx.fillRect(0, 0, 128, 80);
  fCtx.fillStyle = '#ffffff';
  fCtx.beginPath();
  fCtx.arc(54, 40, 24, 0, Math.PI * 2);
  fCtx.fill();
  fCtx.fillStyle = '#111111';
  fCtx.fillRect(50, 22, 8, 36);
  fCtx.fillRect(36, 36, 36, 8);
  const flagTex = new THREE.CanvasTexture(flagCanvas);
  const flagMat = new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide });

  const flagGeom = new THREE.PlaneGeometry(2.0, 1.2, 8, 4);
  const flagMesh = new THREE.Mesh(flagGeom, flagMat);
  flagMesh.position.set(-8.6, 3.8, 0);
  flagMesh.rotation.y = Math.PI / 2;
  towerGroup.add(flagMesh);

  group.add(towerGroup);

  // --- 5. DECK GUN (8.8 cm) ---
  const deckGunGroup = new THREE.Group();
  deckGunGroup.position.set(16, 2.3, 0);

  const gunPedestalGeom = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 12);
  const gunPedestal = new THREE.Mesh(gunPedestalGeom, darkDetails);
  gunPedestal.position.set(0, 0.4, 0);
  deckGunGroup.add(gunPedestal);

  const gunBarrelGeom = new THREE.CylinderGeometry(0.09, 0.15, 3.8, 10);
  gunBarrelGeom.rotateZ(-Math.PI / 2);
  const gunBarrel = new THREE.Mesh(gunBarrelGeom, darkDetails);
  gunBarrel.position.set(1.6, 0.85, 0);
  gunBarrel.castShadow = true;
  deckGunGroup.add(gunBarrel);

  const gunShieldGeom = new THREE.BoxGeometry(0.12, 1.2, 1.4);
  const gunShield = new THREE.Mesh(gunShieldGeom, hullMetal);
  gunShield.position.set(0.3, 0.9, 0);
  deckGunGroup.add(gunShield);

  group.add(deckGunGroup);

  // --- 6. FLAK GUN ---
  const flakGroup = new THREE.Group();
  flakGroup.position.set(-2, 4.3, 0);
  const flakBarrelGeom = new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8);
  flakBarrelGeom.rotateZ(-Math.PI / 2.8);
  const flakBarrel = new THREE.Mesh(flakBarrelGeom, darkDetails);
  flakBarrel.position.set(-0.6, 0.6, 0);
  flakGroup.add(flakBarrel);
  group.add(flakGroup);

  // --- 7. PROPELLERS ---
  const propGroupL = new THREE.Group();
  propGroupL.position.set(-41.5, -0.6, 1.4);
  const propGroupR = new THREE.Group();
  propGroupR.position.set(-41.5, -0.6, -1.4);

  const bladeGeom = new THREE.BoxGeometry(0.15, 1.6, 0.35);
  for (let i = 0; i < 3; i++) {
    const bladeL = new THREE.Mesh(bladeGeom, brassPropeller);
    bladeL.rotation.x = (i * Math.PI * 2) / 3;
    bladeL.rotation.y = 0.4;
    propGroupL.add(bladeL);

    const bladeR = new THREE.Mesh(bladeGeom, brassPropeller);
    bladeR.rotation.x = (i * Math.PI * 2) / 3;
    bladeR.rotation.y = -0.4;
    propGroupR.add(bladeR);
  }

  const shaftGeom = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
  shaftGeom.rotateZ(Math.PI / 2);
  const shaftL = new THREE.Mesh(shaftGeom, darkDetails);
  shaftL.position.set(-37, -0.6, 1.4);
  group.add(shaftL);

  const shaftR = new THREE.Mesh(shaftGeom, darkDetails);
  shaftR.position.set(-37, -0.6, -1.4);
  group.add(shaftR);

  group.add(propGroupL);
  group.add(propGroupR);

  // --- 8. RUDDERS & PLANES ---
  const rudderGeom = new THREE.BoxGeometry(1.8, 3.2, 0.25);
  const rudderMesh = new THREE.Mesh(rudderGeom, hullMetal);
  rudderMesh.position.set(-42, 0.2, 0);
  group.add(rudderMesh);

  const aftPlanesGeom = new THREE.BoxGeometry(1.6, 0.2, 5.0);
  const aftPlanes = new THREE.Mesh(aftPlanesGeom, hullMetal);
  aftPlanes.position.set(-40, 0, 0);
  group.add(aftPlanes);

  const bowPlanesGeom = new THREE.BoxGeometry(1.4, 0.2, 4.2);
  const bowPlanes = new THREE.Mesh(bowPlanesGeom, hullMetal);
  bowPlanes.position.set(31, 0.3, 0);
  group.add(bowPlanes);

  return {
    mesh: group,
    propL: propGroupL,
    propR: propGroupR,
    rudder: rudderMesh,
    bowPlanes: bowPlanes,
    aftPlanes: aftPlanes,
    flag: flagMesh,
    periscope: periscopeOptic,
    update: function (speed, rudderAngle, pitchAngle, time) {
      const rotSpeed = (speed / 10) * 0.45;
      propGroupL.rotation.x += rotSpeed;
      propGroupR.rotation.x -= rotSpeed;

      rudderMesh.rotation.y = (rudderAngle * Math.PI) / 180;

      bowPlanes.rotation.z = pitchAngle * 0.5;
      aftPlanes.rotation.z = -pitchAngle * 0.5;

      const flagPos = flagMesh.geometry.attributes.position;
      for (let i = 0; i < flagPos.count; i++) {
        const u = flagPos.getX(i);
        const wave = Math.sin(time * 8 + u * 4) * 0.12 * (1 - u / 2);
        flagPos.setZ(i, wave);
      }
      flagPos.needsUpdate = true;
    }
  };
}
