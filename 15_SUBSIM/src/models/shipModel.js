import * as THREE from 'three';

// Procedural Merchant Freighter (Liberty Ship / Cargo)
export function createMerchantShip() {
  const group = new THREE.Group();

  const hullUpper = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.6, metalness: 0.3 });
  const hullBottom = new THREE.MeshStandardMaterial({ color: 0x7c2626, roughness: 0.7, metalness: 0.1 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x8a775b, roughness: 0.9, metalness: 0.1 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xded8ce, roughness: 0.6, metalness: 0.2 });
  const funnelMat = new THREE.MeshStandardMaterial({ color: 0xbf8836, roughness: 0.5, metalness: 0.3 });
  const darkDetail = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

  // Main Hull
  const hullGeom = new THREE.BoxGeometry(60, 8, 12);
  const hull = new THREE.Mesh(hullGeom, hullUpper);
  hull.position.y = 2;
  hull.castShadow = true;
  group.add(hull);

  // Red Keel (Underwater)
  const keelGeom = new THREE.BoxGeometry(58, 4, 11);
  const keel = new THREE.Mesh(keelGeom, hullBottom);
  keel.position.y = -3;
  group.add(keel);

  // Pointed Bow
  const bowGeom = new THREE.ConeGeometry(6, 12, 4);
  bowGeom.rotateZ(-Math.PI / 2);
  bowGeom.rotateY(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeom, hullUpper);
  bow.position.set(35, 2, 0);
  bow.scale.set(1, 0.7, 1);
  group.add(bow);

  // Wooden Deck
  const deckGeom = new THREE.BoxGeometry(58, 0.5, 11.5);
  const deck = new THREE.Mesh(deckGeom, deckMat);
  deck.position.y = 6.2;
  group.add(deck);

  // Cargo Hatches
  const hatchGeom = new THREE.BoxGeometry(10, 1.2, 7);
  [-18, -6, 14, 24].forEach(x => {
    const hatch = new THREE.Mesh(hatchGeom, darkDetail);
    hatch.position.set(x, 6.8, 0);
    group.add(hatch);
  });

  // Cargo Derricks / Masts
  const mastGeom = new THREE.CylinderGeometry(0.2, 0.3, 16, 8);
  [-12, 19].forEach(x => {
    const mast = new THREE.Mesh(mastGeom, darkDetail);
    mast.position.set(x, 14, 0);
    group.add(mast);

    // Boom
    const boomGeom = new THREE.CylinderGeometry(0.12, 0.12, 10, 6);
    boomGeom.rotateZ(0.6);
    const boom = new THREE.Mesh(boomGeom, darkDetail);
    boom.position.set(x + 2, 10, 0);
    group.add(boom);
  });

  // Superstructure / Bridge
  const cabinGeom = new THREE.BoxGeometry(14, 7, 10);
  const cabin = new THREE.Mesh(cabinGeom, cabinMat);
  cabin.position.set(4, 9.8, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // Wheelhouse
  const bridgeGeom = new THREE.BoxGeometry(8, 3.5, 8);
  const bridge = new THREE.Mesh(bridgeGeom, cabinMat);
  bridge.position.set(4, 14.5, 0);
  group.add(bridge);

  // Funnel / Smokestack
  const funnelGeom = new THREE.CylinderGeometry(1.6, 1.8, 8, 12);
  const funnel = new THREE.Mesh(funnelGeom, funnelMat);
  funnel.position.set(0, 16, 0);
  group.add(funnel);

  // Black rim on funnel
  const rimGeom = new THREE.CylinderGeometry(1.65, 1.65, 1.5, 12);
  const rim = new THREE.Mesh(rimGeom, darkDetail);
  rim.position.set(0, 19.5, 0);
  group.add(rim);

  return {
    type: 'merchant',
    name: 'SS Atlantic Star',
    tonnage: 7200,
    mesh: group,
    health: 100,
    speed: 7,
    maxSpeed: 8,
    heading: 90,
    sinking: false,
    sinkTimer: 0,
    funnelPos: new THREE.Vector3(0, 20, 0)
  };
}

// Procedural Escort Destroyer (Royal Navy / Allied Escort)
export function createDestroyerShip() {
  const group = new THREE.Group();

  const warshipGrey = new THREE.MeshStandardMaterial({ color: 0x6e7882, roughness: 0.5, metalness: 0.5 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x222629, roughness: 0.6, metalness: 0.5 });
  const lightGrey = new THREE.MeshStandardMaterial({ color: 0x8d9aa6, roughness: 0.6 });

  // Sleek Warship Hull
  const hullGeom = new THREE.BoxGeometry(70, 7, 8.5);
  const hull = new THREE.Mesh(hullGeom, warshipGrey);
  hull.position.y = 1.5;
  hull.castShadow = true;
  group.add(hull);

  // Sharp Bow Clipper
  const bowGeom = new THREE.ConeGeometry(4.5, 18, 4);
  bowGeom.rotateZ(-Math.PI / 2);
  bowGeom.rotateY(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeom, warshipGrey);
  bow.position.set(42, 1.8, 0);
  bow.scale.set(1, 0.8, 0.9);
  group.add(bow);

  // Bridge Tower
  const towerGeom = new THREE.BoxGeometry(10, 8, 6.5);
  const tower = new THREE.Mesh(towerGeom, lightGrey);
  tower.position.set(10, 8.5, 0);
  group.add(tower);

  // Radar Mast
  const mastGeom = new THREE.CylinderGeometry(0.2, 0.4, 18, 8);
  const mast = new THREE.Mesh(mastGeom, darkMetal);
  mast.position.set(7, 16, 0);
  group.add(mast);

  // Twin Funnels
  [-2, -12].forEach(x => {
    const fnGeom = new THREE.CylinderGeometry(1.2, 1.4, 9, 12);
    const fn = new THREE.Mesh(fnGeom, warshipGrey);
    fn.position.set(x, 10, 0);
    fn.rotation.z = -0.15; // Raked funnels
    group.add(fn);
  });

  // Forward Main Guns (Twin 4.7-inch Turret)
  const gunGroup = new THREE.Group();
  gunGroup.position.set(26, 6, 0);

  const turretGeom = new THREE.BoxGeometry(4.5, 2.5, 4);
  const turret = new THREE.Mesh(turretGeom, darkMetal);
  turret.position.y = 1.25;
  gunGroup.add(turret);

  const barrelGeom = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
  barrelGeom.rotateZ(-Math.PI / 2);
  const barrel1 = new THREE.Mesh(barrelGeom, darkMetal);
  barrel1.position.set(3, 1.6, 0.8);
  gunGroup.add(barrel1);

  const barrel2 = new THREE.Mesh(barrelGeom, darkMetal);
  barrel2.position.set(3, 1.6, -0.8);
  gunGroup.add(barrel2);

  group.add(gunGroup);

  // Aft Depth Charge Racks (Stern Wasserbomben)
  const rackGeom = new THREE.BoxGeometry(6, 1.5, 4);
  const rack = new THREE.Mesh(rackGeom, darkMetal);
  rack.position.set(-32, 5.5, 0);
  group.add(rack);

  // Barrels in rack
  for (let b = 0; b < 6; b++) {
    const dcGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    dcGeom.rotateX(Math.PI / 2);
    const dc = new THREE.Mesh(dcGeom, darkMetal);
    dc.position.set(-30 - (b % 3) * 1.5, 6.4, -1 + Math.floor(b / 3) * 2);
    group.add(dc);
  }

  // Searchlight on bridge
  const lightHousingGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12);
  lightHousingGeom.rotateZ(Math.PI / 2);
  const lightHousing = new THREE.Mesh(lightHousingGeom, darkMetal);
  lightHousing.position.set(13, 13, 0);
  group.add(lightHousing);

  const searchlight = new THREE.SpotLight(0xffeedd, 3, 250, 0.35, 0.6);
  searchlight.position.set(13, 13, 0);
  searchlight.target.position.set(60, 0, 0);
  group.add(searchlight);
  group.add(searchlight.target);

  return {
    type: 'destroyer',
    name: 'HMS Vesper (Escort)',
    tonnage: 1650,
    mesh: group,
    turret: gunGroup,
    searchlight: searchlight,
    health: 80,
    speed: 16,
    maxSpeed: 24,
    heading: 90,
    alertState: 'patrol', // patrol, investigating, attacking
    targetSub: null,
    depthChargeCooldown: 0,
    sinking: false,
    sinkTimer: 0
  };
}
