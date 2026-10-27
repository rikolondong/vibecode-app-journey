/**
 * Real-World Missile Arsenal Specifications and 3D Model Constructors
 * FGM-148 Javelin, BGM-71 TOW/Kornet, BGM-109 Tomahawk, 9K720 Iskander-M, Kh-47M2 Kinzhal
 */

const MISSILE_SPECS = {
  javelin: {
    id: 'javelin',
    name: 'FGM-148 Javelin',
    country: 'USA / Raytheon-Lockheed',
    category: 'Man-Portable ATGM',
    guidanceType: 'top_attack',
    guidanceName: 'IIR Fire-and-Forget (Top-Attack)',
    maxSpeedMach: 0.85,
    speedMps: 290,
    warheadKg: 8.4,
    warheadType: 'Tandem Shaped Charge (HEAT)',
    blastRadiusM: 28,
    maxRangeM: 4000,
    boosterDurationSec: 3.8,
    description: 'Rudal anti-tank legendaris dengan mode Top-Attack. Memanjat hingga 150m ke udara lalu menukik 90° tegak lurus menembus atap terlemah bunker dan kendaraan lapis baja.'
  },
  tow: {
    id: 'tow',
    name: 'BGM-71 TOW / Kornet',
    country: 'USA / Rusia',
    category: 'Heavy SACLOS ATGM',
    guidanceType: 'saclos_manual',
    guidanceName: 'SACLOS Optical Beam-Rider (Manual)',
    maxSpeedMach: 0.95,
    speedMps: 320,
    warheadKg: 6.1,
    warheadType: 'High Explosive Anti-Tank (HEAT)',
    blastRadiusM: 25,
    maxRangeM: 4500,
    boosterDurationSec: 6.0,
    description: 'Rudal kendali optik kabel/laser (SACLOS). Pemain mengemudikan hidung rudal secara manual di udara menggunakan mouse/kamera untuk mengarahkan crosshair tepat ke target.'
  },
  tomahawk: {
    id: 'tomahawk',
    name: 'BGM-109 Tomahawk',
    country: 'USA / Raytheon',
    category: 'Land Attack Cruise Missile',
    guidanceType: 'terrain_cruise',
    guidanceName: 'TERCOM / GPS Waypoint Cruise',
    maxSpeedMach: 0.75,
    speedMps: 255,
    warheadKg: 450,
    warheadType: 'WDU-36/B Unitary Blast-Fragmentation',
    blastRadiusM: 130,
    maxRangeM: 1600000,
    boosterDurationSec: 999, // Continuous turbofan
    description: 'Rudal jelajah subsonic jarak jauh. Membuka sepasang sayap, terbang rendah menyusuri lekukan lembah pegunungan di bawah jangkauan radar sebelum menukik ke sasaran.'
  },
  iskander: {
    id: 'iskander',
    name: '9K720 Iskander-M',
    country: 'Rusia / KBM Kolomna',
    category: 'Tactical Quasi-Ballistic',
    guidanceType: 'ballistic_arc',
    guidanceName: 'Inertial + Optical DSMAC Ballistic',
    maxSpeedMach: 5.9,
    speedMps: 2050,
    warheadKg: 480,
    warheadType: 'Deep Earth Bunker-Buster Penetrator',
    blastRadiusM: 180,
    maxRangeM: 500000,
    boosterDurationSec: 7.5,
    description: 'Rudal balistik taktis berdaya hancur dahsyat. Melesat naik ke stratosfer membentuk lintasan parabola tinggi, lalu menukik dengan kecepatan supersonik ekstrem menghancurkan instalasi bawah tanah.'
  },
  kinzhal: {
    id: 'kinzhal',
    name: 'Kh-47M2 Kinzhal',
    country: 'Rusia / Rostec',
    category: 'Aero-Ballistic Hypersonic',
    guidanceType: 'hypersonic_strike',
    guidanceName: 'Active Radar Seeker (Mach 10 Hypersonic)',
    maxSpeedMach: 10.0,
    speedMps: 3400,
    warheadKg: 500,
    warheadType: 'Kinetic Energy High Explosive Penetrator',
    blastRadiusM: 230,
    maxRangeM: 2000000,
    boosterDurationSec: 6.0,
    description: 'Rudal hipersonik berkecepatan Mach 10 dengan selubung plasma terionisasi menyala terang. Menembus seluruh radar dan sistem pencegat udara dengan waktu reaksi sepersekian detik.'
  }
};

class MissileBuilder {
  static createMissileModel(typeId) {
    const group = new THREE.Group();

    switch (typeId) {
      case 'javelin':
        return this.buildJavelin(group);
      case 'tow':
        return this.buildTOW(group);
      case 'tomahawk':
        return this.buildTomahawk(group);
      case 'iskander':
        return this.buildIskander(group);
      case 'kinzhal':
        return this.buildKinzhal(group);
      default:
        return this.buildJavelin(group);
    }
  }

  // 1. FGM-148 Javelin Model
  static buildJavelin(group) {
    // Body tube
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.7, 10, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d433b, roughness: 0.6, metalness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Rounded Optical Dome Seeker
    const seekerGeo = new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const seekerMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.1 });
    const seeker = new THREE.Mesh(seekerGeo, seekerMat);
    seeker.position.set(0, 0, 5);
    seeker.rotation.x = Math.PI / 2;
    group.add(seeker);

    // Mid-body wings (4x)
    for (let i = 0; i < 4; i++) {
      const wingGeo = new THREE.BoxGeometry(0.1, 1.8, 1.4);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x222621 });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.rotation.z = (i * Math.PI) / 2;
      wing.position.set(0, 0, 0.5);
      group.add(wing);
    }

    // Rear steering fins (4x)
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.BoxGeometry(0.1, 2.2, 1.2);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x222621 });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.z = (i * Math.PI) / 2;
      fin.position.set(0, 0, -4.5);
      group.add(fin);
    }

    group.userData.exhaustOffset = new THREE.Vector3(0, 0, -5.2);
    return group;
  }

  // 2. BGM-71 TOW / Kornet Model
  static buildTOW(group) {
    // Slender Body Tube
    const bodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4f493c, roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Nose Probe Extender
    const probeGeo = new THREE.CylinderGeometry(0.2, 0.4, 3, 8);
    const probeMat = new THREE.MeshStandardMaterial({ color: 0x242424, metalness: 0.8 });
    const probe = new THREE.Mesh(probeGeo, probeMat);
    probe.position.set(0, 0, 7.2);
    probe.rotation.x = Math.PI / 2;
    group.add(probe);

    // Nose Cone
    const coneGeo = new THREE.ConeGeometry(0.8, 2, 16);
    const cone = new THREE.Mesh(coneGeo, bodyMat);
    cone.position.set(0, 0, 6.8);
    cone.rotation.x = Math.PI / 2;
    group.add(cone);

    // Tail Optical Flare Beacon & Wire Dispenser
    const flareGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12);
    const flareMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const flare = new THREE.Mesh(flareGeo, flareMat);
    flare.position.set(0, 0, -6.1);
    flare.rotation.x = Math.PI / 2;
    group.add(flare);

    // 4 Rear Folding Guidance Blades
    for (let i = 0; i < 4; i++) {
      const bladeGeo = new THREE.BoxGeometry(0.08, 2.4, 1.6);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (i * Math.PI) / 2 + Math.PI / 4;
      blade.position.set(0, 0, -5);
      group.add(blade);
    }

    group.userData.exhaustOffset = new THREE.Vector3(0, 0, -6.2);
    return group;
  }

  // 3. BGM-109 Tomahawk Cruise Missile Model
  static buildTomahawk(group) {
    // Elongated Fuselage
    const bodyGeo = new THREE.CylinderGeometry(1.0, 1.0, 18, 20);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.4, metalness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Streamlined Nose Dome
    const noseGeo = new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, 0, 9);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // Deployable Main Swept Wings
    const wingGeo = new THREE.BoxGeometry(11, 0.12, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x99a2aa, metalness: 0.4, roughness: 0.5 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0.4, 1.5);
    group.add(wings);

    // Ventral Turbofan Air Scoop Intake
    const intakeGeo = new THREE.BoxGeometry(1.1, 0.9, 4.5);
    const intakeMat = new THREE.MeshStandardMaterial({ color: 0x22262a });
    const intake = new THREE.Mesh(intakeGeo, intakeMat);
    intake.position.set(0, -1.1, -4.5);
    group.add(intake);

    // Cruciform Tail Control Fins (4x)
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.BoxGeometry(0.12, 3.2, 1.8);
      const finMat = new THREE.MeshStandardMaterial({ color: 0xb5bcc4 });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.z = (i * Math.PI) / 2;
      fin.position.set(0, 0, -8);
      group.add(fin);
    }

    group.userData.exhaustOffset = new THREE.Vector3(0, 0, -9.2);
    return group;
  }

  // 4. 9K720 Iskander-M Ballistic Missile Model
  static buildIskander(group) {
    // Massive Ballistic Rocket Body
    const bodyGeo = new THREE.CylinderGeometry(1.8, 1.8, 24, 24);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x28332c, roughness: 0.7, metalness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Conical Ogive Nose Penetrator Cone
    const noseGeo = new THREE.ConeGeometry(1.8, 7.5, 24);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x1b221e, roughness: 0.5, metalness: 0.4 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0, 15.5);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // Heavy Aerodynamic Lattice / Grid Rudders at Base (4x)
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.BoxGeometry(0.2, 4.8, 3.2);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x171c18, metalness: 0.6 });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.z = (i * Math.PI) / 2;
      fin.position.set(0, 0, -10.5);
      group.add(fin);
    }

    group.userData.exhaustOffset = new THREE.Vector3(0, 0, -12.4);
    return group;
  }

  // 5. Kh-47M2 Kinzhal Hypersonic Strike Missile Model
  static buildKinzhal(group) {
    // Long Slender Aerodynamic Hypersonic Body
    const bodyGeo = new THREE.CylinderGeometry(1.4, 1.4, 28, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2b3038,
      roughness: 0.3,
      metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Needle-Sharp Heat-Shield Radome Nose
    const noseGeo = new THREE.ConeGeometry(1.4, 9, 24);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x161a20, metalness: 0.9, roughness: 0.2 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0, 18.5);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // Delta Hypersonic Stabilizer Fins (4x)
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.BoxGeometry(0.15, 3.8, 4.2);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x191e24 });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.z = (i * Math.PI) / 2;
      fin.position.set(0, 0, -12);
      group.add(fin);
    }

    // Hypersonic Ionization Glow Sheath (Glowing edge)
    const glowGeo = new THREE.CylinderGeometry(1.5, 1.5, 29, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    group.add(glow);

    group.userData.exhaustOffset = new THREE.Vector3(0, 0, -14.2);
    return group;
  }
}

window.MISSILE_SPECS = MISSILE_SPECS;
window.MissileBuilder = MissileBuilder;
