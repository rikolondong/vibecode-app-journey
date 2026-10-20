// ============================================================================
// PROJECT SKYLINE // CORE 3D FLIGHT ENGINE, AI, WEAPONS & ACE COMBAT HUD
// ============================================================================

(() => {
  // DOM Elements
  const glCanvas = document.getElementById('gl-canvas');
  const hudCanvas = document.getElementById('hud-canvas');
  const hudCtx = hudCanvas.getContext('2d');

  const hangarScreen = document.getElementById('hangar-screen');
  const flightTopbar = document.getElementById('flight-topbar');
  const tacticalComms = document.getElementById('tactical-comms');
  const commsSpeaker = document.getElementById('comms-speaker');
  const commsText = document.getElementById('comms-text');
  const portraitCanvas = document.getElementById('portrait-canvas');
  const warningBanner = document.getElementById('warning-banner');
  const warningText = document.getElementById('warning-text');

  const pauseModal = document.getElementById('pause-modal');
  const debriefModal = document.getElementById('debrief-modal');

  // Game State
  let gameState = 'HANGAR'; // 'HANGAR' | 'PLAYING' | 'PAUSED' | 'DEBRIEF'
  let selectedAircraft = window.AIRCRAFT_DB[0];
  let selectedSpw = window.SPW_DB[0];
  let selectedMission = window.MISSION_DB[0];

  // Pixel Shader Downscale Factor (3 = 1/3 native resolution for crisp retro 3D pixels)
  const PIXEL_SCALES = [3, 4, 2, 1];
  let pixelScaleIdx = 0;
  let pixelScale = PIXEL_SCALES[pixelScaleIdx];

  // Camera Modes: 0 = Chase, 1 = Cockpit HUD, 2 = Far Cinematic
  const CAM_MODES = ['CHASE', 'COCKPIT', 'FAR'];
  let cameraMode = 0;

  // Settings
  let invertPitch = true;
  let mouseAimEnabled = false;
  let mouseNormX = 0;
  let mouseNormY = 0;

  // Three.js Core
  const renderer = new THREE.WebGLRenderer({
    canvas: glCanvas,
    antialias: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 1.5, 14000);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x8bb8d8, 0.72);
  const sunLight = new THREE.DirectionalLight(0xfff0d4, 1.15);
  sunLight.position.set(800, 1600, -900);
  scene.add(ambientLight, sunLight);

  // Hangar Turntable Group
  const hangarGroup = new THREE.Group();
  scene.add(hangarGroup);
  let hangarJetMesh = null;
  let hangarTurntableAngle = 0.6;
  let isDraggingHangar = false;
  let prevDragX = 0;

  // World & Entities
  let worldEnv = null;
  let islandColliders = [];
  let enemies = [];
  let missiles = [];
  let bullets = [];
  let particles = [];
  let flares = [];
  let trailSegments = [];

  // Player Flight State
  const player = {
    mesh: null,
    pos: new THREE.Vector3(0, 320, 900),
    quat: new THREE.Quaternion(),
    velocity: new THREE.Vector3(0, 0, -185),
    speed: 185,
    throttle: 0.65,
    pitchVel: 0,
    rollVel: 0,
    yawVel: 0,
    gForce: 1.0,
    isHighG: false,
    hp: 100,
    maxHp: 100,
    alive: true,
    // Avionics & Weapons
    activeWeapon: 'MSL', // 'MSL' | 'SPW'
    mslAmmo: 80,
    mslSlots: [0, 0], // cooldown timer (0 = ready)
    mslMaxReload: 2.3,
    spwAmmo: 24,
    spwSlots: [0],
    spwMaxReload: 5.0,
    flareCount: 12,
    flareCooldown: 0,
    gunHeat: 0,
    gunTimer: 0,
    // Target Lock-On
    selectedTarget: null,
    lockProgress: 0, // 0 to 1
    isLocked: false,
    multiLockedTargets: [], // For 4AAM
    hitMarkerTimer: 0
  };

  // Mission Progress State
  const missionState = {
    wave: 1,
    maxWaves: 3,
    score: 0,
    kills: 0,
    elapsedTime: 0,
    waveTransitionTimer: 0,
    commsTimer: 0
  };

  // Input State
  const keys = {};

  // ==========================================================================
  // INITIALIZATION & RESIZE
  // ==========================================================================
  function resizeViewports() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Low-res 3D Pixel Buffer
    const renderW = Math.max(240, Math.floor(w / pixelScale));
    const renderH = Math.max(135, Math.floor(h / pixelScale));
    renderer.setSize(renderW, renderH, false);

    // Crisp 2D HUD Canvas
    hudCanvas.width = w;
    hudCanvas.height = h;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resizeViewports);
  resizeViewports();

  // ==========================================================================
  // HANGAR UI & 3D PREVIEW SETUP
  // ==========================================================================
  function initHangarUI() {
    const aircraftListEl = document.getElementById('aircraft-list');
    const spwListEl = document.getElementById('spw-list');
    const missionListEl = document.getElementById('mission-list');

    function renderAircraftCards() {
      aircraftListEl.innerHTML = '';
      window.AIRCRAFT_DB.forEach((jet) => {
        const card = document.createElement('div');
        card.className = `select-card ${jet.id === selectedAircraft.id ? 'active' : ''}`;
        card.innerHTML = `
          <div>
            <div class="card-main-title">${jet.shortName}</div>
            <div class="card-sub">${jet.role}</div>
          </div>
          <div class="card-badge">${jet.tier}</div>
        `;
        card.addEventListener('click', () => {
          window.soundEngine.playUIClick();
          selectedAircraft = jet;
          const defaultSpwObj = window.SPW_DB.find(s => s.id === jet.defaultSpw);
          if (defaultSpwObj) selectedSpw = defaultSpwObj;
          renderAircraftCards();
          renderSpwCards();
          updateHangarPreview();
        });
        aircraftListEl.appendChild(card);
      });
    }

    function renderSpwCards() {
      spwListEl.innerHTML = '';
      window.SPW_DB.forEach((spw) => {
        const card = document.createElement('div');
        card.className = `select-card ${spw.id === selectedSpw.id ? 'active' : ''}`;
        card.innerHTML = `
          <div>
            <div class="card-main-title">${spw.name}</div>
            <div class="card-sub">${spw.desc.slice(0, 52)}...</div>
          </div>
          <div class="card-badge">${spw.ammo}X</div>
        `;
        card.addEventListener('click', () => {
          window.soundEngine.playUIClick();
          selectedSpw = spw;
          renderSpwCards();
          updateBriefingPanel();
        });
        spwListEl.appendChild(card);
      });
    }

    function renderMissionCards() {
      missionListEl.innerHTML = '';
      window.MISSION_DB.forEach((m, idx) => {
        const card = document.createElement('div');
        card.className = `select-card ${m.id === selectedMission.id ? 'active' : ''}`;
        card.innerHTML = `
          <div>
            <div class="card-main-title">${m.title}</div>
            <div class="card-sub">${m.meta.split('//')[1] || ''}</div>
          </div>
          <div class="card-badge">OP-0${idx + 1}</div>
        `;
        card.addEventListener('click', () => {
          window.soundEngine.playUIClick();
          selectedMission = m;
          renderMissionCards();
          updateBriefingPanel();
          updateHangarEnvironmentColors();
        });
        missionListEl.appendChild(card);
      });
    }

    renderAircraftCards();
    renderSpwCards();
    renderMissionCards();
    setupHangar3DScene();
    updateHangarPreview();
  }

  function setupHangar3DScene() {
    while (hangarGroup.children.length > 0) {
      hangarGroup.remove(hangarGroup.children[0]);
    }

    // Tactical Hologram Turntable Platform
    const ringGeo = new THREE.RingGeometry(8.5, 9.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2cf0ff, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -2.2;
    hangarGroup.add(ringMesh);

    const grid = new THREE.GridHelper(32, 16, 0x2cf0ff, 0x113647);
    grid.position.y = -2.25;
    hangarGroup.add(grid);

    updateHangarEnvironmentColors();
  }

  function updateHangarEnvironmentColors() {
    scene.background = new THREE.Color(selectedMission.skyTop);
    scene.fog = new THREE.FogExp2(selectedMission.fogColor, 0.00028);
  }

  function updateHangarPreview() {
    if (hangarJetMesh) {
      hangarGroup.remove(hangarJetMesh);
    }

    hangarJetMesh = window.createJetMesh({
      ...selectedAircraft.colors,
      wingStyle: selectedAircraft.wingStyle,
      scale: 1.0
    });
    hangarGroup.add(hangarJetMesh);

    // Update DOM Stats
    document.getElementById('preview-code').textContent = selectedAircraft.code;
    document.getElementById('preview-role').textContent = selectedAircraft.role;
    document.getElementById('preview-tier').textContent = selectedAircraft.tier;
    document.getElementById('preview-desc').textContent = selectedAircraft.desc;

    document.getElementById('stat-speed').style.width = `${selectedAircraft.stats.speed}%`;
    document.getElementById('stat-mobility').style.width = `${selectedAircraft.stats.mobility}%`;
    document.getElementById('stat-stability').style.width = `${selectedAircraft.stats.stability}%`;
    document.getElementById('stat-armor').style.width = `${selectedAircraft.stats.armor}%`;

    updateBriefingPanel();
  }

  function updateBriefingPanel() {
    document.getElementById('briefing-title').textContent = selectedMission.title;
    document.getElementById('briefing-meta').textContent = selectedMission.meta;
    document.getElementById('briefing-desc').textContent = selectedMission.desc;
    document.getElementById('loadout-spw').textContent = `${selectedSpw.name} (${selectedSpw.ammo})`;
  }

  // Hangar Mouse Drag Rotation
  window.addEventListener('mousedown', (e) => {
    if (gameState === 'HANGAR' && e.target.closest('.preview-panel')) {
      isDraggingHangar = true;
      prevDragX = e.clientX;
    }
  });
  window.addEventListener('mouseup', () => { isDraggingHangar = false; });
  window.addEventListener('mousemove', (e) => {
    if (isDraggingHangar && gameState === 'HANGAR') {
      const dx = e.clientX - prevDragX;
      prevDragX = e.clientX;
      hangarTurntableAngle += dx * 0.01;
    }
    // Normalized mouse coordinates for optional Mouse Aim
    mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNormY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ==========================================================================
  // RADIO / AWACS TACTICAL COMMS SYSTEM
  // ==========================================================================
  function showComms(speaker, text, portraitType = 'awacs', duration = 4.8) {
    commsSpeaker.textContent = `<< ${speaker} >>`;
    commsSpeaker.style.color = portraitType === 'enemy' ? '#ff384c' : (portraitType === 'wingman' ? '#2cff7e' : '#2cf0ff');
    commsText.textContent = text;
    window.drawCommsPortrait(portraitCanvas, portraitType);
    tacticalComms.classList.remove('hidden');
    missionState.commsTimer = duration;
    window.soundEngine.playRadioChirp();
  }

  // ==========================================================================
  // START MISSION / SORTIE INITIALIZATION
  // ==========================================================================
  function startSortie() {
    window.soundEngine.init();
    window.soundEngine.playUIClick();
    window.soundEngine.startBGM();

    gameState = 'PLAYING';
    hangarScreen.classList.add('hidden');
    pauseModal.classList.add('hidden');
    debriefModal.classList.add('hidden');
    flightTopbar.classList.remove('hidden');

    hangarGroup.visible = false;
    clearWorldEntities();

    // Build Mission Environment
    scene.background = new THREE.Color(selectedMission.skyTop);
    scene.fog = new THREE.FogExp2(selectedMission.fogColor, 0.00022);
    worldEnv = window.buildWorldEnvironment(scene, selectedMission);
    islandColliders = worldEnv.islandColliders;

    // Spawn Player Aircraft
    player.mesh = window.createJetMesh({
      ...selectedAircraft.colors,
      wingStyle: selectedAircraft.wingStyle,
      scale: 1.0
    });
    scene.add(player.mesh);

    player.pos.set(0, 380, 1200);
    player.quat.identity();
    player.speed = selectedAircraft.physics.cruiseSpeed;
    player.throttle = 0.65;
    player.pitchVel = 0;
    player.rollVel = 0;
    player.yawVel = 0;
    player.hp = selectedAircraft.physics.maxHp;
    player.maxHp = selectedAircraft.physics.maxHp;
    player.alive = true;

    player.activeWeapon = 'MSL';
    player.mslAmmo = 80;
    player.mslSlots = [0, 0];
    player.spwAmmo = selectedSpw.ammo;
    player.spwMaxReload = selectedSpw.reloadTime;
    player.spwSlots = [0];
    player.flareCount = 12;
    player.flareCooldown = 0;
    player.selectedTarget = null;
    player.lockProgress = 0;
    player.isLocked = false;
    player.multiLockedTargets = [];

    missionState.wave = 1;
    missionState.score = 0;
    missionState.kills = 0;
    missionState.elapsedTime = 0;
    missionState.waveTransitionTimer = 0;

    document.getElementById('hud-mission-name').textContent = selectedMission.title;
    spawnWave(1);
    updateTopbarHUD();
  }

  function clearWorldEntities() {
    if (worldEnv && worldEnv.envGroup) {
      scene.remove(worldEnv.envGroup);
      worldEnv = null;
    }
    if (player.mesh) {
      scene.remove(player.mesh);
      player.mesh = null;
    }
    enemies.forEach(e => scene.remove(e.mesh));
    missiles.forEach(m => scene.remove(m.mesh));
    bullets.forEach(b => scene.remove(b.mesh));
    particles.forEach(p => scene.remove(p.mesh));
    flares.forEach(f => scene.remove(f.mesh));
    trailSegments.forEach(t => scene.remove(t.mesh));

    enemies = [];
    missiles = [];
    bullets = [];
    particles = [];
    flares = [];
    trailSegments = [];
  }

  // ==========================================================================
  // WAVE & ENEMY SPAWNER
  // ==========================================================================
  function spawnWave(waveNum) {
    missionState.wave = waveNum;
    updateTopbarHUD();

    if (waveNum === 1) {
      // Wave 1: 4 MiG-29 Scouts + 2 Radar Warships
      for (let i = 0; i < 4; i++) {
        spawnEnemyFighter({
          name: `MIG-29A`,
          callsign: `BANDIT-0${i + 1}`,
          pos: new THREE.Vector3((i - 1.5) * 380, 340 + (i % 2) * 110, -700 - i * 240),
          hp: 40,
          speed: 155,
          turnRate: 1.05,
          isAce: false,
          scoreValue: 500
        });
      }
      spawnEnemyWarship(new THREE.Vector3(-650, 0, -1100), 'AEGIS FRIGATE');
      spawnEnemyWarship(new THREE.Vector3(750, 0, -1450), 'RADAR CRUISER');

      showComms(
        'AWACS SKY-EYE',
        'Garuda 1, skuadron patroli dan kapal radar musuh terdeteksi di depan. Hancurkan semua target [TGT]!',
        'awacs',
        5.5
      );
    } else if (waveNum === 2) {
      // Wave 2: Elite Crimson Ace Squadron + Escorts
      const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat).setY(0).normalize();
      const baseCenter = player.pos.clone().addScaledVector(ahead, 1800);

      for (let i = 0; i < 3; i++) {
        spawnEnemyFighter({
          name: 'SU-37 TERMINATOR',
          callsign: `VANGUARD-${i + 1}`,
          pos: new THREE.Vector3(baseCenter.x + (i - 1) * 420, 420 + i * 60, baseCenter.z - i * 200),
          hp: 55,
          speed: 175,
          turnRate: 1.35,
          isAce: false,
          scoreValue: 800
        });
      }

      // 2 Crimson Aces (Forward-swept SU-47 in Red/Black livery)
      for (let i = 0; i < 2; i++) {
        spawnEnemyFighter({
          name: 'SU-47 CRIMSON',
          callsign: `CRIMSON-${i + 1}`,
          pos: new THREE.Vector3(baseCenter.x + (i === 0 ? -250 : 250), 540, baseCenter.z - 450),
          hp: 90,
          speed: 205,
          turnRate: 1.85,
          isAce: true,
          scoreValue: 1500
        });
      }

      showComms(
        'CRIMSON-1 // ACE LEADER',
        'Jadi ini pilot yang menghancurkan armada garis depan kita? Jangan biarkan dia lolos hidup-hidup!',
        'enemy',
        5.5
      );
    } else if (waveNum === 3) {
      // Wave 3: Giant Aerial Command Cruiser Boss ("ARKBIRD-01") + 3 Escorts
      const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat).setY(0).normalize();
      const bossPos = player.pos.clone().addScaledVector(ahead, 2200);
      bossPos.y = 580;

      spawnAerialBoss(bossPos);

      for (let i = 0; i < 3; i++) {
        spawnEnemyFighter({
          name: 'F-15S/MTD GUARD',
          callsign: `ARK-GUARD ${i + 1}`,
          pos: new THREE.Vector3(bossPos.x + (i - 1) * 350, 560, bossPos.z + 250),
          hp: 65,
          speed: 185,
          turnRate: 1.5,
          isAce: true,
          scoreValue: 1000
        });
      }

      showComms(
        'AWACS SKY-EYE',
        'PERINGATAN! Benteng Udara Komando "ARKBIRD-01" memasuki wilayah tempur! Hancurkan inti reaktornya!',
        'awacs',
        6.0
      );
    }

    // Automatically select nearest target
    cycleTarget(true);
  }

  function spawnEnemyFighter(cfg) {
    const mesh = window.createJetMesh({
      primary: cfg.isAce ? '#781220' : '#3a4e48',
      secondary: cfg.isAce ? '#1e080c' : '#1f2d2a',
      accent: cfg.isAce ? '#ffbe2c' : '#ff384c',
      canopy: '#2cf0ff',
      burner: '#ff5500',
      wingStyle: cfg.isAce ? 'forward' : 'swept',
      scale: 1.05
    });
    mesh.position.copy(cfg.pos);

    const quat = new THREE.Quaternion();
    quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // Face toward player initially
    mesh.quaternion.copy(quat);
    scene.add(mesh);

    enemies.push({
      type: 'AIR',
      name: cfg.name,
      callsign: cfg.callsign,
      mesh,
      pos: mesh.position,
      quat: mesh.quaternion,
      speed: cfg.speed,
      turnRate: cfg.turnRate,
      hp: cfg.hp,
      maxHp: cfg.hp,
      isAce: cfg.isAce,
      isBoss: false,
      scoreValue: cfg.scoreValue,
      hitRadius: 11,
      missileTimer: 4 + Math.random() * 5,
      gunBurstTimer: 0,
      evadeTimer: 0
    });
  }

  function spawnEnemyWarship(pos, name) {
    const mesh = window.createWarshipMesh();
    mesh.position.copy(pos);
    scene.add(mesh);

    enemies.push({
      type: 'SURFACE',
      name,
      callsign: 'NAVAL-TGT',
      mesh,
      pos: mesh.position,
      quat: mesh.quaternion,
      speed: 12,
      turnRate: 0.15,
      hp: 80,
      maxHp: 80,
      isAce: false,
      isBoss: false,
      scoreValue: 750,
      hitRadius: 24,
      missileTimer: 6 + Math.random() * 5
    });
  }

  function spawnAerialBoss(pos) {
    const mesh = window.createAerialBossMesh();
    mesh.position.copy(pos);
    scene.add(mesh);

    enemies.push({
      type: 'AIR',
      name: 'ARKBIRD-01',
      callsign: 'COMMAND CRUISER',
      mesh,
      pos: mesh.position,
      quat: mesh.quaternion,
      speed: 95,
      turnRate: 0.38,
      hp: 320,
      maxHp: 320,
      isAce: true,
      isBoss: true,
      scoreValue: 5000,
      hitRadius: 38,
      missileTimer: 3.5
    });
  }

  // ==========================================================================
  // TARGET CYCLING & SELECTION
  // ==========================================================================
  function cycleTarget(pickNearestFront = false) {
    if (enemies.length === 0) {
      player.selectedTarget = null;
      player.lockProgress = 0;
      player.isLocked = false;
      return;
    }

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);

    if (pickNearestFront || !player.selectedTarget) {
      let bestScore = -Infinity;
      let bestEnemy = enemies[0];
      for (const e of enemies) {
        const toE = e.pos.clone().sub(player.pos);
        const dist = toE.length();
        const dir = toE.normalize();
        const dot = forward.dot(dir);
        const score = dot * 1200 - dist * 0.35;
        if (score > bestScore) {
          bestScore = score;
          bestEnemy = e;
        }
      }
      player.selectedTarget = bestEnemy;
    } else {
      const idx = enemies.indexOf(player.selectedTarget);
      player.selectedTarget = enemies[(idx + 1) % enemies.length];
    }

    player.lockProgress = 0;
    player.isLocked = false;
    window.soundEngine.playUIClick();
  }

  // ==========================================================================
  // WEAPON FIRING (VULCAN GUN, STD MISSILE, 4AAM / QAAM / HVSM, FLARES)
  // ==========================================================================
  function fireVulcanBullet() {
    if (player.gunTimer > 0) return;
    player.gunTimer = 0.055; // ~18 rounds/sec
    window.soundEngine.playGunShot();

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(player.quat);

    // Slight gun spread
    const spreadX = (Math.random() - 0.5) * 0.012;
    const spreadY = (Math.random() - 0.5) * 0.012;
    const dir = forward.clone()
      .addScaledVector(right, spreadX)
      .addScaledVector(up, spreadY)
      .normalize();

    const spawnPos = player.pos.clone()
      .addScaledVector(forward, 6.5)
      .addScaledVector(up, -0.35)
      .addScaledVector(right, (Math.random() > 0.5 ? 0.65 : -0.65));

    const tracerGeo = new THREE.BoxGeometry(0.24, 0.24, 5.5);
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffe66d });
    const mesh = new THREE.Mesh(tracerGeo, tracerMat);
    mesh.position.copy(spawnPos);
    mesh.quaternion.copy(player.quat);
    scene.add(mesh);

    bullets.push({
      isPlayer: true,
      mesh,
      pos: mesh.position,
      vel: dir.multiplyScalar(player.speed + 680),
      damage: 6.5,
      life: 1.45
    });
  }

  function launchWeapon() {
    if (!player.alive) return;

    if (player.activeWeapon === 'MSL') {
      // Find ready standard missile bay
      const slotIdx = player.mslSlots.findIndex(t => t <= 0);
      if (slotIdx === -1 || player.mslAmmo <= 0) {
        window.soundEngine.tone(240, 0.08, 'sawtooth', 0.12);
        return;
      }

      player.mslSlots[slotIdx] = player.mslMaxReload;
      player.mslAmmo--;

      const wingSide = slotIdx === 0 ? -1 : 1;
      spawnMissile({
        isPlayer: true,
        target: player.isLocked ? player.selectedTarget : null,
        wingSide,
        speed: Math.max(player.speed + 260, 440),
        turnRate: 2.55,
        damage: 45,
        color: 0x2cf0ff
      });
      window.soundEngine.playMissileLaunch(false);
    } else {
      // Special Weapon (SPW)
      if (player.spwSlots[0] > 0 || player.spwAmmo <= 0) {
        window.soundEngine.tone(240, 0.08, 'sawtooth', 0.12);
        return;
      }

      if (selectedSpw.id === '4aam') {
        // Launch up to 4 missiles at multi-locked targets (or current target)
        const targets = player.multiLockedTargets.length > 0
          ? player.multiLockedTargets.slice(0, 4)
          : (player.isLocked && player.selectedTarget ? [player.selectedTarget] : [null]);

        const count = Math.min(targets.length, player.spwAmmo);
        for (let i = 0; i < count; i++) {
          player.spwAmmo--;
          spawnMissile({
            isPlayer: true,
            target: targets[i],
            wingSide: i % 2 === 0 ? -1.4 : 1.4,
            speed: Math.max(player.speed + 290, 470),
            turnRate: 2.9,
            damage: 45,
            color: 0x2cff7e
          });
        }
        player.spwSlots[0] = player.spwMaxReload;
        window.soundEngine.playMissileLaunch(true);
      } else if (selectedSpw.id === 'qaam') {
        // High-Agility Missile (Super Turn Rate)
        player.spwAmmo--;
        player.spwSlots[0] = player.spwMaxReload;
        spawnMissile({
          isPlayer: true,
          target: player.isLocked ? player.selectedTarget : null,
          wingSide: 0,
          speed: Math.max(player.speed + 270, 460),
          turnRate: 5.2,
          damage: 58,
          color: 0xffbe2c
        });
        window.soundEngine.playMissileLaunch(true);
      } else if (selectedSpw.id === 'hvsm') {
        // Hyper-Velocity Strike Missile
        player.spwAmmo--;
        player.spwSlots[0] = player.spwMaxReload;
        spawnMissile({
          isPlayer: true,
          target: player.isLocked ? player.selectedTarget : null,
          wingSide: 0,
          speed: Math.max(player.speed + 560, 760),
          turnRate: 2.2,
          damage: 95,
          color: 0xff384c
        });
        window.soundEngine.playMissileLaunch(true);
      }
    }
  }

  function spawnMissile(cfg) {
    const mGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.32, 0.32, 2.8);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    mGroup.add(body);

    const glowGeo = new THREE.ConeGeometry(0.45, 1.8, 5);
    glowGeo.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({ color: cfg.color || 0xff9900 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = 2.0;
    mGroup.add(glow);

    if (cfg.isPlayer) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quat);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(player.quat);
      mGroup.position.copy(player.pos)
        .addScaledVector(right, (cfg.wingSide || 1) * 2.5)
        .addScaledVector(up, -0.8);
      mGroup.quaternion.copy(player.quat);
    } else {
      mGroup.position.copy(cfg.originPos);
      mGroup.quaternion.copy(cfg.originQuat);
    }

    scene.add(mGroup);

    missiles.push({
      isPlayer: cfg.isPlayer,
      mesh: mGroup,
      pos: mGroup.position,
      quat: mGroup.quaternion,
      target: cfg.target,
      speed: cfg.speed,
      turnRate: cfg.turnRate,
      damage: cfg.damage,
      life: 6.5,
      smokeTimer: 0
    });
  }

  function deployFlares() {
    if (!player.alive || player.flareCount <= 0 || player.flareCooldown > 0) return;
    player.flareCount--;
    player.flareCooldown = 2.5;
    window.soundEngine.playFlare();

    // Spawn 4 glowing flare pellets behind the aircraft
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(player.quat);
    const back = new THREE.Vector3(0, 0, 1).applyQuaternion(player.quat);

    for (let i = 0; i < 4; i++) {
      const flareGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const flareMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
      const mesh = new THREE.Mesh(flareGeo, flareMat);
      mesh.position.copy(player.pos).addScaledVector(back, 4);
      scene.add(mesh);

      const side = (i % 2 === 0 ? -1 : 1) * (18 + i * 8);
      const vel = back.clone().multiplyScalar(40)
        .addScaledVector(right, side)
        .addScaledVector(up, -12 - Math.random() * 15);

      flares.push({
        mesh,
        pos: mesh.position,
        vel,
        life: 2.8
      });
    }

    // Redirect any incoming enemy missiles locked onto player to chase a flare
    const activeFlare = flares[flares.length - 1];
    missiles.forEach(m => {
      if (!m.isPlayer && m.target === player) {
        m.target = activeFlare;
      }
    });
  }

  // ==========================================================================
  // EXPLOSIONS & PIXEL PARTICLES
  // ==========================================================================
  function spawnExplosion(pos, scale = 1.0) {
    const count = Math.floor(18 * scale);
    const colors = [0xff384c, 0xff9e00, 0xffe66d, 0xffffff, 0x4a4e69];

    for (let i = 0; i < count; i++) {
      const size = (1.2 + Math.random() * 2.5) * scale;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 110 * scale,
        (Math.random() - 0.35) * 110 * scale,
        (Math.random() - 0.5) * 110 * scale
      );

      particles.push({
        mesh,
        vel,
        life: 0.55 + Math.random() * 0.65,
        maxLife: 1.1
      });
    }
  }

  function spawnSmokePuff(pos, size = 1.1, color = 0xd8f8ff, life = 0.55) {
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    particles.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      ),
      life,
      maxLife: life
    });
  }

  // ==========================================================================
  // MAIN SIMULATION UPDATE LOOP
  // ==========================================================================
  let wingTrailTimer = 0;

  function updateSimulation(dt) {
    missionState.elapsedTime += dt;

    if (missionState.commsTimer > 0) {
      missionState.commsTimer -= dt;
      if (missionState.commsTimer <= 0) {
        tacticalComms.classList.add('hidden');
      }
    }

    if (player.hitMarkerTimer > 0) {
      player.hitMarkerTimer -= dt;
    }

    updatePlayerFlight(dt);
    updateTargetLockOn(dt);
    updateEnemies(dt);
    updateMissiles(dt);
    updateBullets(dt);
    updateFlaresAndParticles(dt);
    updateCamera(dt);

    // Check Wave Completion
    if (enemies.length === 0 && player.alive) {
      if (missionState.waveTransitionTimer === 0) {
        missionState.waveTransitionTimer = 2.6;
        if (missionState.wave < missionState.maxWaves) {
          showComms('AWACS SKY-EYE', `Gelombang ${missionState.wave} bersih! Bersiap menghadapi gelombang berikutnya...`, 'awacs', 2.5);
        }
      } else {
        missionState.waveTransitionTimer -= dt;
        if (missionState.waveTransitionTimer <= 0) {
          missionState.waveTransitionTimer = 0;
          if (missionState.wave < missionState.maxWaves) {
            spawnWave(missionState.wave + 1);
          } else {
            finishMission(true);
          }
        }
      }
    }
  }

  function updatePlayerFlight(dt) {
    if (!player.alive) return;

    const phys = selectedAircraft.physics;

    // Cooldowns
    player.gunTimer = Math.max(0, player.gunTimer - dt);
    player.flareCooldown = Math.max(0, player.flareCooldown - dt);
    for (let i = 0; i < player.mslSlots.length; i++) {
      player.mslSlots[i] = Math.max(0, player.mslSlots[i] - dt);
    }
    player.spwSlots[0] = Math.max(0, player.spwSlots[0] - dt);

    // Throttle & High-G Turn Detection
    const boostPressed = keys['ShiftLeft'] || keys['ShiftRight'];
    const brakePressed = keys['ControlLeft'] || keys['ControlRight'];
    player.isHighG = boostPressed && brakePressed;

    if (player.isHighG) {
      player.throttle = THREE.MathUtils.lerp(player.throttle, 0.45, dt * 3);
    } else if (boostPressed) {
      player.throttle = Math.min(1.35, player.throttle + dt * 0.65);
    } else if (brakePressed) {
      player.throttle = Math.max(0.15, player.throttle - dt * 0.75);
    } else {
      player.throttle = THREE.MathUtils.lerp(player.throttle, 0.65, dt * 1.2);
    }

    const targetSpeed = phys.minSpeed + (phys.maxSpeed - phys.minSpeed) * (player.throttle / 1.35);
    player.speed = THREE.MathUtils.lerp(player.speed, targetSpeed, dt * 2.2);

    // Flight Controls: Pitch, Roll, Yaw
    let pitchInput = 0;
    let rollInput = 0;
    let yawInput = 0;

    const upKey = keys['KeyW'] || keys['ArrowUp'];
    const downKey = keys['KeyS'] || keys['ArrowDown'];
    if (upKey) pitchInput += invertPitch ? -1 : 1;
    if (downKey) pitchInput += invertPitch ? 1 : -1;

    if (keys['KeyA'] || keys['ArrowLeft']) rollInput += 1;
    if (keys['KeyD'] || keys['ArrowRight']) rollInput -= 1;

    if (keys['KeyQ']) yawInput += 1;
    if (keys['KeyE']) yawInput -= 1;

    if (mouseAimEnabled) {
      if (Math.abs(mouseNormX) > 0.08) rollInput -= mouseNormX * 0.85;
      if (Math.abs(mouseNormY) > 0.08) pitchInput += (invertPitch ? mouseNormY : -mouseNormY) * 0.85;
    }

    const highGMult = player.isHighG ? 1.68 : 1.0;
    player.pitchVel = THREE.MathUtils.lerp(player.pitchVel, pitchInput * phys.pitchRate * highGMult, dt * 7);
    player.rollVel = THREE.MathUtils.lerp(player.rollVel, rollInput * phys.rollRate, dt * 8);
    player.yawVel = THREE.MathUtils.lerp(player.yawVel, yawInput * phys.yawRate, dt * 6);

    // Quaternion Local Axis Rotations (Zero Gimbal Lock)
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), player.pitchVel * dt);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), player.yawVel * dt);
    const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), player.rollVel * dt);

    player.quat.multiply(qRoll).multiply(qPitch).multiply(qYaw).normalize();

    // Calculate G-Force for HUD display
    player.gForce = THREE.MathUtils.lerp(
      player.gForce,
      1.0 + Math.abs(player.pitchVel) * (player.isHighG ? 4.8 : 2.9) + Math.abs(player.rollVel) * 0.4,
      dt * 5
    );

    // Move Aircraft Forward along Local -Z
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);
    player.velocity.copy(forward).multiplyScalar(player.speed);
    player.pos.addScaledVector(player.velocity, dt);

    // Keep within tactical operational airspace softly
    if (player.pos.length() > 6200) {
      const toCenter = player.pos.clone().negate().setY(0).normalize();
      player.pos.addScaledVector(toCenter, dt * 120);
    }
    if (player.pos.y > 2200) player.pos.y = 2200;

    // Check Sea / Island Collision
    if (player.pos.y < 14) {
      // Bounce up with hull damage if scraping ocean, or crash if steep dive
      if (forward.y < -0.35 || player.hp <= 25) {
        damagePlayer(999);
        return;
      } else {
        player.pos.y = 18;
        damagePlayer(22 * dt);
      }
    }

    for (const isl of islandColliders) {
      const dx = player.pos.x - isl.x;
      const dz = player.pos.z - isl.z;
      const horizDist = Math.hypot(dx, dz);
      if (horizDist < isl.r * 0.78) {
        const terrainHeight = (1 - horizDist / (isl.r * 0.8)) * isl.h + 10;
        if (player.pos.y < terrainHeight) {
          damagePlayer(999);
          return;
        }
      }
    }

    // Update 3D Mesh Transform & Afterburner Cones
    player.mesh.position.copy(player.pos);
    player.mesh.quaternion.copy(player.quat);

    const flames = player.mesh.userData.flames || [];
    const flameScale = 0.6 + player.throttle * 1.15 + Math.sin(performance.now() * 0.05) * 0.15;
    flames.forEach(f => {
      f.scale.set(1, flameScale, 1);
    });

    // Wingtip Vapor Trails during turns or High-G
    wingTrailTimer -= dt;
    if (wingTrailTimer <= 0 && (Math.abs(player.pitchVel) > 0.65 || player.isHighG || player.throttle > 1.0)) {
      wingTrailTimer = 0.035;
      const tips = player.mesh.userData.wingtips || [];
      for (const localTip of tips) {
        const worldTip = localTip.clone().applyQuaternion(player.quat).add(player.pos);
        spawnSmokePuff(worldTip, player.isHighG ? 0.95 : 0.55, 0xcffafe, 0.38);
      }
    }

    // Continuous Vulcan Fire
    if (keys['Space'] || keys['MouseLeft']) {
      fireVulcanBullet();
    }

    // Update Jet Engine Audio
    window.soundEngine.updateEngine(player.throttle, true);
  }

  // ==========================================================================
  // ACE COMBAT LOCK-ON SYSTEM (SINGLE & 4AAM MULTI-LOCK)
  // ==========================================================================
  function updateTargetLockOn(dt) {
    if (!player.selectedTarget || !enemies.includes(player.selectedTarget)) {
      cycleTarget(true);
    }

    if (!player.selectedTarget) {
      player.lockProgress = 0;
      player.isLocked = false;
      player.multiLockedTargets = [];
      return;
    }

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);
    const maxRange = player.activeWeapon === 'SPW' ? 2600 : 1950;
    const coneCos = (player.activeWeapon === 'SPW' && selectedSpw.id === 'qaam') ? 0.76 : 0.85;

    const toTgt = player.selectedTarget.pos.clone().sub(player.pos);
    const dist = toTgt.length();
    const angleCos = forward.dot(toTgt.clone().normalize());

    if (dist <= maxRange && angleCos >= coneCos) {
      const lockSpeed = (player.activeWeapon === 'SPW' && selectedSpw.id === 'qaam') ? 2.2 : 1.45;
      player.lockProgress = Math.min(1, player.lockProgress + dt * lockSpeed);
      if (player.lockProgress >= 1) {
        player.isLocked = true;
        window.soundEngine.playLockTone();
      } else {
        player.isLocked = false;
        window.soundEngine.playSeekTone();
      }
    } else {
      player.lockProgress = Math.max(0, player.lockProgress - dt * 1.8);
      player.isLocked = false;
    }

    // Multi-Lock for 4AAM
    player.multiLockedTargets = [];
    if (player.activeWeapon === 'SPW' && selectedSpw.id === '4aam' && player.lockProgress > 0.5) {
      for (const e of enemies) {
        const dVec = e.pos.clone().sub(player.pos);
        const d = dVec.length();
        const c = forward.dot(dVec.normalize());
        if (d <= maxRange && c >= 0.80) {
          player.multiLockedTargets.push(e);
          if (player.multiLockedTargets.length >= 4) break;
        }
      }
    }
  }

  // ==========================================================================
  // ENEMY AI & COMBAT LOGIC
  // ==========================================================================
  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      if (e.type === 'SURFACE') {
        // Warship moves slowly & fires SAM missiles periodically
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(e.quat);
        e.pos.addScaledVector(fwd, e.speed * dt);

        e.missileTimer -= dt;
        const distToPlayer = e.pos.distanceTo(player.pos);
        if (e.missileTimer <= 0 && distToPlayer < 2100 && player.alive) {
          e.missileTimer = 8.5 + Math.random() * 4;
          const launchQuat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            player.pos.clone().sub(e.pos).normalize()
          );
          spawnMissile({
            isPlayer: false,
            originPos: e.pos.clone().add(new THREE.Vector3(0, 14, 0)),
            originQuat: launchQuat,
            target: player,
            speed: 310,
            turnRate: 1.25,
            damage: 24,
            color: 0xff384c
          });
        }
        continue;
      }

      // Aerial Fighter / Boss AI
      const toPlayer = player.pos.clone().sub(e.pos);
      const dist = toPlayer.length();

      let desiredDir = toPlayer.clone().normalize();

      // Avoid crashing into sea or flying too close
      if (e.pos.y < 140) {
        desiredDir.y = Math.max(0.45, desiredDir.y);
        desiredDir.normalize();
      } else if (dist < 260 && !e.isBoss) {
        // Break-off maneuver so dogfights stay dynamic
        desiredDir.negate();
        desiredDir.y += 0.25;
        desiredDir.normalize();
      }

      const targetQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        desiredDir
      );
      e.quat.slerp(targetQuat, Math.min(1, e.turnRate * dt));

      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(e.quat);
      e.pos.addScaledVector(fwd, e.speed * dt);

      // Enemy Missile Attack
      e.missileTimer -= dt;
      const aimDot = fwd.dot(toPlayer.clone().normalize());
      if (e.missileTimer <= 0 && dist < 1850 && dist > 250 && (aimDot > 0.72 || e.isBoss) && player.alive) {
        e.missileTimer = e.isBoss ? 4.2 : (e.isAce ? 6.5 : 9.5);
        spawnMissile({
          isPlayer: false,
          originPos: e.pos.clone(),
          originQuat: e.quat.clone(),
          target: player,
          speed: e.isAce ? 340 : 295,
          turnRate: e.isAce ? 1.55 : 1.15,
          damage: 22,
          color: 0xff384c
        });
      }
    }
  }

  // ==========================================================================
  // MISSILES, BULLETS & DAMAGE
  // ==========================================================================
  function updateMissiles(dt) {
    let incomingEnemyMissile = false;

    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.life -= dt;
      if (m.life <= 0) {
        scene.remove(m.mesh);
        missiles.splice(i, 1);
        continue;
      }

      // Guidance toward locked target
      if (m.target && (m.target.alive !== false)) {
        const targetPos = m.target.pos;
        if (targetPos) {
          const toTgt = targetPos.clone().sub(m.pos).normalize();
          const desiredQuat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            toTgt
          );
          m.quat.slerp(desiredQuat, Math.min(1, m.turnRate * dt));
        }
      }

      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(m.quat);
      m.pos.addScaledVector(fwd, m.speed * dt);

      // Dense Pixel Smoke Trail
      m.smokeTimer -= dt;
      if (m.smokeTimer <= 0) {
        m.smokeTimer = 0.025;
        spawnSmokePuff(m.pos, 1.25, m.isPlayer ? 0xd8f8ff : 0xffccd5, 0.55);
      }

      if (m.isPlayer) {
        // Check hit against any enemy
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (m.pos.distanceTo(e.pos) < e.hitRadius + 7) {
            damageEnemy(e, m.damage);
            spawnExplosion(m.pos, 0.9);
            scene.remove(m.mesh);
            missiles.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      } else {
        // Enemy missile chasing player
        if (m.target === player && player.alive) {
          incomingEnemyMissile = true;
          if (m.pos.distanceTo(player.pos) < 13) {
            damagePlayer(m.damage);
            spawnExplosion(m.pos, 1.0);
            scene.remove(m.mesh);
            missiles.splice(i, 1);
            continue;
          }
        } else if (m.target && m.pos.distanceTo(m.target.pos) < 12) {
          // Detonated on flare decoy!
          spawnExplosion(m.pos, 0.7);
          scene.remove(m.mesh);
          missiles.splice(i, 1);
          continue;
        }
      }
    }

    // Missile Warning Banner & Audio Siren
    const stallWarning = player.alive && player.speed < selectedAircraft.physics.minSpeed + 12;
    if (incomingEnemyMissile) {
      warningBanner.classList.remove('hidden');
      warningText.textContent = '! MISSILE ALERT - EVADE OR PRESS [F] FLARE !';
      window.soundEngine.playMissileAlert();
    } else if (stallWarning) {
      warningBanner.classList.remove('hidden');
      warningText.textContent = '! LOW SPEED STALL WARNING - INCREASE THROTTLE [SHIFT] !';
    } else {
      warningBanner.classList.add('hidden');
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      if (b.life <= 0 || b.pos.y < 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
        continue;
      }

      b.pos.addScaledVector(b.vel, dt);

      if (b.isPlayer) {
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (b.pos.distanceTo(e.pos) < e.hitRadius + 4) {
            damageEnemy(e, b.damage);
            spawnSmokePuff(b.pos, 1.6, 0xffbe2c, 0.25);
            scene.remove(b.mesh);
            bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updateFlaresAndParticles(dt) {
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.life -= dt;
      f.pos.addScaledVector(f.vel, dt);
      spawnSmokePuff(f.pos, 1.1, 0xffe66d, 0.25);
      if (f.life <= 0) {
        f.alive = false;
        scene.remove(f.mesh);
        flares.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    }
  }

  function damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    player.hitMarkerTimer = 0.18;
    window.soundEngine.playHitMarker();

    if (enemy.hp <= 0) {
      const idx = enemies.indexOf(enemy);
      if (idx !== -1) enemies.splice(idx, 1);
      scene.remove(enemy.mesh);

      spawnExplosion(enemy.pos, enemy.isBoss ? 2.8 : 1.35);
      window.soundEngine.playExplosion(enemy.isBoss);

      missionState.kills++;
      missionState.score += enemy.scoreValue;
      updateTopbarHUD();

      if (enemy.isBoss) {
        showComms('AWACS SKY-EYE', 'KONFIRMASI! Benteng Udara ARKBIRD-01 telah hancur! Tembakan luar biasa, Garuda 1!', 'awacs', 5.0);
      } else if (enemy.isAce) {
        showComms('WINGMAN // SHAMROCK', `Target Ace ${enemy.callsign} jatuh! Langit ini milik kita!`, 'wingman', 3.5);
      }

      if (player.selectedTarget === enemy) {
        cycleTarget(true);
      }
    }
  }

  function damagePlayer(amount) {
    if (!player.alive) return;
    player.hp = Math.max(0, player.hp - amount);
    window.soundEngine.playExplosion(player.hp <= 0);

    if (player.hp <= 0) {
      player.alive = false;
      player.mesh.visible = false;
      spawnExplosion(player.pos, 2.0);
      window.soundEngine.updateEngine(0, false);
      showComms('AWACS SKY-EYE', 'Garuda 1 tertembak jatuh! Eject! Eject sekarang!', 'awacs', 4.0);
      setTimeout(() => finishMission(false), 1800);
    }
  }

  function updateTopbarHUD() {
    document.getElementById('hud-wave-text').textContent = `WAVE ${missionState.wave}/${missionState.maxWaves}`;
    document.getElementById('hud-score-text').textContent = `SCORE: ${String(missionState.score).padStart(5, '0')}`;
  }

  function finishMission(victory) {
    if (gameState === 'DEBRIEF') return;
    gameState = 'DEBRIEF';
    window.soundEngine.updateEngine(0, false);
    warningBanner.classList.add('hidden');

    const statusEl = document.getElementById('debrief-status');
    statusEl.textContent = victory ? '<< MISSION ACCOMPLISHED >>' : '<< MISSION FAILED - KIA >>';
    statusEl.style.color = victory ? '#2cff7e' : '#ff384c';

    document.getElementById('debrief-title').textContent = selectedMission.title;
    document.getElementById('debrief-kills').textContent = missionState.kills;

    const mins = String(Math.floor(missionState.elapsedTime / 60)).padStart(2, '0');
    const secs = String(Math.floor(missionState.elapsedTime % 60)).padStart(2, '0');
    document.getElementById('debrief-time').textContent = `${mins}:${secs}`;

    const hpPct = Math.round((player.hp / player.maxHp) * 100);
    document.getElementById('debrief-hp').textContent = `${hpPct}%`;

    const timeBonus = victory ? Math.max(0, Math.floor((300 - missionState.elapsedTime) * 15)) : 0;
    const hpBonus = victory ? hpPct * 25 : 0;
    const finalScore = missionState.score + timeBonus + hpBonus;
    document.getElementById('debrief-score').textContent = `${finalScore.toLocaleString()} PTS`;

    let rank = 'C';
    if (!victory) rank = 'D';
    else if (finalScore >= 11000 && hpPct >= 70) rank = 'S';
    else if (finalScore >= 8500) rank = 'A';
    else if (finalScore >= 5500) rank = 'B';

    document.getElementById('debrief-rank').textContent = rank;
    debriefModal.classList.remove('hidden');
  }

  // ==========================================================================
  // CAMERA CONTROLLER (CHASE / COCKPIT / TARGET TRACKING [C])
  // ==========================================================================
  function updateCamera(dt) {
    if (!player.mesh) return;

    const focusTarget = (keys['KeyC'] && player.selectedTarget && player.alive);

    if (cameraMode === 1) {
      // COCKPIT HUD VIEW (First-Person Nose View)
      player.mesh.visible = false;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(player.quat);
      camera.position.copy(player.pos).addScaledVector(forward, 2.5).addScaledVector(up, 0.9);
      if (focusTarget) {
        camera.lookAt(player.selectedTarget.pos);
      } else {
        camera.quaternion.copy(player.quat);
      }
      return;
    }

    player.mesh.visible = player.alive;
    const distBack = cameraMode === 2 ? 32 : 21.5;
    const heightUp = cameraMode === 2 ? 7.2 : 5.0;

    // Dynamic lag offset based on pitch/roll angular velocity
    const localOffset = new THREE.Vector3(
      -player.rollVel * 0.9,
      heightUp + player.pitchVel * 1.1,
      distBack + (player.throttle - 0.65) * 4.5
    );
    const worldOffset = localOffset.applyQuaternion(player.quat);
    const desiredCamPos = player.pos.clone().add(worldOffset);

    camera.position.lerp(desiredCamPos, Math.min(1, dt * 14));

    if (focusTarget) {
      // Ace Combat Target Tracking Camera (Hold C)
      camera.lookAt(player.selectedTarget.pos);
    } else {
      const lookAhead = new THREE.Vector3(0, 1.2, -45).applyQuaternion(player.quat).add(player.pos);
      const targetCamQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(camera.position, lookAhead, new THREE.Vector3(0, 1, 0).applyQuaternion(player.quat))
      );
      camera.quaternion.slerp(targetCamQuat, Math.min(1, dt * 16));
    }
  }

  // ==========================================================================
  // ACE COMBAT 2D TACTICAL HUD RENDERER (CRISP PIXEL OVERLAY)
  // ==========================================================================
  function projectToScreen(worldPos) {
    const v = worldPos.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * hudCanvas.width;
    const y = (-v.y * 0.5 + 0.5) * hudCanvas.height;
    const inFront = v.z < 1.0;
    return { x, y, inFront, ndcZ: v.z };
  }

  function renderAceCombatHUD() {
    const w = hudCanvas.width;
    const h = hudCanvas.height;
    hudCtx.clearRect(0, 0, w, h);

    if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;

    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

    const hudGreen = '#2cff7e';
    const hudCyan = '#2cf0ff';
    const hudRed = '#ff384c';
    const hudAmber = '#ffbe2c';

    hudCtx.font = '12px "Share Tech Mono", monospace';
    hudCtx.textBaseline = 'middle';

    // 1. Central Aircraft Bore-Sight Reticle ('-v-')
    hudCtx.strokeStyle = hudGreen;
    hudCtx.lineWidth = 2;
    hudCtx.beginPath();
    hudCtx.moveTo(cx - 24, cy);
    hudCtx.lineTo(cx - 8, cy);
    hudCtx.lineTo(cx - 4, cy + 5);
    hudCtx.moveTo(cx + 24, cy);
    hudCtx.lineTo(cx + 8, cy);
    hudCtx.lineTo(cx + 4, cy + 5);
    hudCtx.stroke();

    // Hit Marker 'X' Flash
    if (player.hitMarkerTimer > 0) {
      hudCtx.strokeStyle = hudAmber;
      hudCtx.lineWidth = 2;
      hudCtx.beginPath();
      hudCtx.moveTo(cx - 12, cy - 12);
      hudCtx.lineTo(cx + 12, cy + 12);
      hudCtx.moveTo(cx + 12, cy - 12);
      hudCtx.lineTo(cx - 12, cy + 12);
      hudCtx.stroke();
    }

    // Weapon Lock Cone Circle
    const coneRadius = (player.activeWeapon === 'SPW' && selectedSpw.id === 'qaam') ? 195 : 145;
    hudCtx.strokeStyle = 'rgba(44, 255, 126, 0.25)';
    hudCtx.setLineDash([6, 6]);
    hudCtx.beginPath();
    hudCtx.arc(cx, cy, coneRadius, 0, Math.PI * 2);
    hudCtx.stroke();
    hudCtx.setLineDash([]);

    // 2. Speed (KTS) & Altitude (FT) Side Ladders + Pitch & Roll Indicator
    drawAvionicsLadders(cx, cy, hudGreen, hudCyan, hudAmber);

    // 3. 3D-to-2D Target Boxes ([TGT], Distance, Lead-Computing Gun Pipper, Lock-On Diamond)
    drawTargetHUDMarkers(cx, cy, w, h, hudGreen, hudCyan, hudRed, hudAmber);

    // 4. Bottom-Left Circular Tactical Radar
    drawTacticalRadar(w, h, hudGreen, hudCyan, hudRed, hudAmber);

    // 5. Bottom-Right Aircraft Wireframe Hull Status & Weapon Bay Rack
    drawWeaponAndStatusPanel(w, h, hudGreen, hudCyan, hudRed, hudAmber);
  }

  function drawAvionicsLadders(cx, cy, hudGreen, hudCyan, hudAmber) {
    // Extract Pitch, Roll, Heading from Player Quaternion
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quat);

    const pitchDeg = Math.round(Math.asin(THREE.MathUtils.clamp(forward.y, -1, 1)) * (180 / Math.PI));
    const rollRad = Math.atan2(right.y, Math.sqrt(right.x * right.x + right.z * right.z));
    const headingDeg = Math.round((Math.atan2(forward.x, -forward.z) * (180 / Math.PI) + 360) % 360);

    const speedKts = Math.round(player.speed * 3.2);
    const altFt = Math.max(0, Math.round(player.pos.y * 8.5));

    // Left Box: SPEED (KTS)
    const leftX = cx - 225;
    hudCtx.strokeStyle = hudGreen;
    hudCtx.fillStyle = 'rgba(6, 20, 16, 0.65)';
    hudCtx.fillRect(leftX - 68, cy - 18, 68, 36);
    hudCtx.strokeRect(leftX - 68, cy - 18, 68, 36);

    hudCtx.fillStyle = hudGreen;
    hudCtx.font = '10px "Press Start 2P", monospace';
    hudCtx.textAlign = 'right';
    hudCtx.fillText(`${speedKts}`, leftX - 8, cy + 1);
    hudCtx.font = '11px "Share Tech Mono", monospace';
    hudCtx.fillText('SPD KTS', leftX - 8, cy - 28);

    // Throttle / Afterburner Bar
    const thrH = 120;
    hudCtx.strokeRect(leftX - 82, cy - thrH / 2, 8, thrH);
    const fillH = Math.min(1, player.throttle / 1.35) * thrH;
    hudCtx.fillStyle = player.throttle > 0.95 ? hudAmber : hudGreen;
    hudCtx.fillRect(leftX - 81, cy + thrH / 2 - fillH, 6, fillH);

    // G-Force & High-G Indicator
    hudCtx.textAlign = 'left';
    hudCtx.fillStyle = player.isHighG ? hudAmber : hudGreen;
    hudCtx.fillText(`G: ${player.gForce.toFixed(1)}G ${player.isHighG ? '<<HIGH-G>>' : ''}`, leftX - 68, cy + 36);

    // Right Box: ALTITUDE (FT)
    const rightX = cx + 225;
    hudCtx.fillStyle = 'rgba(6, 20, 16, 0.65)';
    hudCtx.fillRect(rightX, cy - 18, 74, 36);
    hudCtx.strokeRect(rightX, cy - 18, 74, 36);

    hudCtx.fillStyle = hudGreen;
    hudCtx.font = '10px "Press Start 2P", monospace';
    hudCtx.textAlign = 'left';
    hudCtx.fillText(`${altFt}`, rightX + 8, cy + 1);
    hudCtx.font = '11px "Share Tech Mono", monospace';
    hudCtx.fillText('ALT FT', rightX + 8, cy - 28);
    hudCtx.fillText(`PITCH: ${pitchDeg}°`, rightX, cy + 36);

    // Top Heading Compass Tape
    const tapeY = 66;
    hudCtx.fillStyle = 'rgba(6, 20, 16, 0.65)';
    hudCtx.fillRect(cx - 130, tapeY - 14, 260, 26);
    hudCtx.strokeRect(cx - 130, tapeY - 14, 260, 26);
    hudCtx.fillStyle = hudGreen;
    hudCtx.textAlign = 'center';
    hudCtx.font = '10px "Press Start 2P", monospace';
    const cardinals = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    const cardLabel = cardinals[Math.round(headingDeg / 90) * 90 % 360] || '';
    hudCtx.fillText(`HDG ${String(headingDeg).padStart(3, '0')}° ${cardLabel}`, cx, tapeY);

    // Pitch Ladder Bars (Rotated by Roll)
    hudCtx.save();
    hudCtx.translate(cx, cy);
    hudCtx.rotate(rollRad);
    hudCtx.strokeStyle = 'rgba(44, 255, 126, 0.48)';
    hudCtx.lineWidth = 1.5;

    for (let deg = -30; deg <= 30; deg += 10) {
      if (deg === 0) continue;
      const yOff = (deg - (pitchDeg % 10)) * 3.2;
      if (Math.abs(yOff) < 95) {
        hudCtx.beginPath();
        hudCtx.moveTo(-45, yOff);
        hudCtx.lineTo(-22, yOff);
        hudCtx.lineTo(-22, yOff + (deg > 0 ? 5 : -5));
        hudCtx.moveTo(45, yOff);
        hudCtx.lineTo(22, yOff);
        hudCtx.lineTo(22, yOff + (deg > 0 ? 5 : -5));
        hudCtx.stroke();
      }
    }
    hudCtx.restore();
  }

  function drawTargetHUDMarkers(cx, cy, w, h, hudGreen, hudCyan, hudRed, hudAmber) {
    for (const e of enemies) {
      const proj = projectToScreen(e.pos);
      const isSelected = (e === player.selectedTarget);
      const distMeters = Math.round(e.pos.distanceTo(player.pos) * 2.5);

      if (!proj.inFront || proj.x < 30 || proj.x > w - 30 || proj.y < 30 || proj.y > h - 30) {
        // Off-screen Target Arrow Indicator on Perimeter Circle
        if (isSelected) {
          const toE = e.pos.clone().sub(camera.position).applyQuaternion(camera.quaternion.clone().invert());
          const angle = Math.atan2(-toE.y, toE.x);
          const radius = Math.min(w, h) * 0.34;
          const ax = cx + Math.cos(angle) * radius;
          const ay = cy + Math.sin(angle) * radius;

          hudCtx.save();
          hudCtx.translate(ax, ay);
          hudCtx.rotate(angle);
          hudCtx.fillStyle = player.isLocked ? hudRed : hudGreen;
          hudCtx.beginPath();
          hudCtx.moveTo(12, 0);
          hudCtx.lineTo(-8, -7);
          hudCtx.lineTo(-8, 7);
          hudCtx.closePath();
          hudCtx.fill();
          hudCtx.restore();

          hudCtx.fillStyle = hudGreen;
          hudCtx.font = '11px "Share Tech Mono", monospace';
          hudCtx.textAlign = 'center';
          hudCtx.fillText(`TGT ${distMeters}M`, ax, ay + 18);
        }
        continue;
      }

      // On-Screen Target Box
      const boxSize = e.isBoss ? 36 : 22;
      const half = boxSize / 2;
      const sx = Math.round(proj.x);
      const sy = Math.round(proj.y);

      hudCtx.strokeStyle = isSelected ? (player.isLocked ? hudRed : hudAmber) : hudGreen;
      hudCtx.lineWidth = isSelected ? 2 : 1.5;
      hudCtx.strokeRect(sx - half, sy - half, boxSize, boxSize);

      // Target Health Bar above Box
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      hudCtx.fillStyle = 'rgba(0,0,0,0.6)';
      hudCtx.fillRect(sx - half, sy - half - 8, boxSize, 4);
      hudCtx.fillStyle = hpRatio > 0.4 ? hudGreen : hudRed;
      hudCtx.fillRect(sx - half, sy - half - 8, boxSize * hpRatio, 4);

      // Target Labels (Name, Callsign, Distance)
      hudCtx.fillStyle = isSelected ? (player.isLocked ? hudRed : hudAmber) : hudGreen;
      hudCtx.font = '11px "Share Tech Mono", monospace';
      hudCtx.textAlign = 'left';
      hudCtx.fillText(isSelected ? `[TGT] ${e.name}` : e.name, sx + half + 6, sy - 6);
      hudCtx.fillText(`${distMeters}M`, sx + half + 6, sy + 7);

      // Lock-On Diamond Animation
      if (isSelected && player.lockProgress > 0) {
        const interpX = THREE.MathUtils.lerp(cx, sx, player.lockProgress);
        const interpY = THREE.MathUtils.lerp(cy, sy, player.lockProgress);
        const dSize = THREE.MathUtils.lerp(42, 16, player.lockProgress);

        hudCtx.save();
        hudCtx.translate(interpX, interpY);
        hudCtx.rotate(Math.PI / 4);
        hudCtx.strokeStyle = player.isLocked ? hudRed : hudAmber;
        hudCtx.lineWidth = 2;
        hudCtx.strokeRect(-dSize / 2, -dSize / 2, dSize, dSize);
        hudCtx.restore();

        if (player.isLocked) {
          hudCtx.fillStyle = hudRed;
          hudCtx.font = '10px "Press Start 2P", monospace';
          hudCtx.textAlign = 'center';
          hudCtx.fillText('<< SHOOT / LOCK >>', sx, sy + half + 18);
        }
      }

      // Multi-Lock Diamond for 4AAM
      const multiIdx = player.multiLockedTargets.indexOf(e);
      if (multiIdx !== -1) {
        hudCtx.save();
        hudCtx.translate(sx, sy);
        hudCtx.rotate(Math.PI / 4);
        hudCtx.strokeStyle = hudCyan;
        hudCtx.lineWidth = 2;
        hudCtx.strokeRect(-11, -11, 22, 22);
        hudCtx.restore();
        hudCtx.fillStyle = hudCyan;
        hudCtx.textAlign = 'right';
        hudCtx.fillText(`M${multiIdx + 1}`, sx - half - 5, sy);
      }

      // Lead-Computing Gun Sight Pipper (When selected target is within 1000m)
      if (isSelected && distMeters < 2200) {
        const bulletSpeed = player.speed + 680;
        const timeToHit = e.pos.distanceTo(player.pos) / bulletSpeed;
        const enemyFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(e.quat);
        const leadWorldPos = e.pos.clone().addScaledVector(enemyFwd, e.speed * timeToHit);
        const leadProj = projectToScreen(leadWorldPos);

        if (leadProj.inFront) {
          hudCtx.strokeStyle = hudCyan;
          hudCtx.lineWidth = 1.5;
          hudCtx.beginPath();
          hudCtx.moveTo(sx, sy);
          hudCtx.lineTo(leadProj.x, leadProj.y);
          hudCtx.stroke();

          hudCtx.beginPath();
          hudCtx.arc(leadProj.x, leadProj.y, 10, 0, Math.PI * 2);
          hudCtx.stroke();
        }
      }
    }
  }

  function drawTacticalRadar(w, h, hudGreen, hudCyan, hudRed, hudAmber) {
    const r = 78;
    const rx = 26 + r;
    const ry = h - 26 - r;

    // Radar Background Circle
    hudCtx.save();
    hudCtx.beginPath();
    hudCtx.arc(rx, ry, r, 0, Math.PI * 2);
    hudCtx.fillStyle = 'rgba(4, 18, 22, 0.85)';
    hudCtx.fill();
    hudCtx.lineWidth = 2;
    hudCtx.strokeStyle = hudGreen;
    hudCtx.stroke();
    hudCtx.clip();

    // Concentric Range Rings & Crosshairs
    hudCtx.strokeStyle = 'rgba(44, 255, 126, 0.22)';
    hudCtx.lineWidth = 1;
    hudCtx.beginPath();
    hudCtx.arc(rx, ry, r * 0.5, 0, Math.PI * 2);
    hudCtx.moveTo(rx - r, ry);
    hudCtx.lineTo(rx + r, ry);
    hudCtx.moveTo(rx, ry - r);
    hudCtx.lineTo(rx, ry + r);
    hudCtx.stroke();

    // Player Forward FOV Cone on Radar
    hudCtx.strokeStyle = 'rgba(44, 240, 255, 0.35)';
    hudCtx.beginPath();
    hudCtx.moveTo(rx, ry);
    hudCtx.lineTo(rx - 38, ry - r);
    hudCtx.moveTo(rx, ry);
    hudCtx.lineTo(rx + 38, ry - r);
    hudCtx.stroke();

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quat);
    const headingAngle = Math.atan2(forward.x, -forward.z);
    const radarRange = 3000;

    // Draw Island Blips on Radar
    hudCtx.fillStyle = 'rgba(44, 255, 126, 0.14)';
    for (const isl of islandColliders) {
      const dx = isl.x - player.pos.x;
      const dz = isl.z - player.pos.z;
      const rotX = dx * Math.cos(headingAngle) + dz * Math.sin(headingAngle);
      const rotZ = -dx * Math.sin(headingAngle) + dz * Math.cos(headingAngle);
      const px = rx + (rotX / radarRange) * r;
      const py = ry + (rotZ / radarRange) * r;
      const pr = (isl.r / radarRange) * r;
      hudCtx.beginPath();
      hudCtx.arc(px, py, pr, 0, Math.PI * 2);
      hudCtx.fill();
    }

    // Draw Enemy Blips
    for (const e of enemies) {
      const dx = e.pos.x - player.pos.x;
      const dz = e.pos.z - player.pos.z;
      const rotX = dx * Math.cos(headingAngle) + dz * Math.sin(headingAngle);
      const rotZ = -dx * Math.sin(headingAngle) + dz * Math.cos(headingAngle);
      const px = THREE.MathUtils.clamp(rx + (rotX / radarRange) * r, rx - r + 5, rx + r - 5);
      const py = THREE.MathUtils.clamp(ry + (rotZ / radarRange) * r, ry - r + 5, ry + r - 5);

      hudCtx.fillStyle = e === player.selectedTarget ? hudRed : (e.type === 'SURFACE' ? hudAmber : hudGreen);
      const s = e.isBoss ? 7 : 5;
      hudCtx.fillRect(px - s / 2, py - s / 2, s, s);
    }

    // Draw Incoming Missiles on Radar (Blinking Red Dots)
    for (const m of missiles) {
      if (m.isPlayer) continue;
      const dx = m.pos.x - player.pos.x;
      const dz = m.pos.z - player.pos.z;
      const rotX = dx * Math.cos(headingAngle) + dz * Math.sin(headingAngle);
      const rotZ = -dx * Math.sin(headingAngle) + dz * Math.cos(headingAngle);
      const px = rx + (rotX / radarRange) * r;
      const py = ry + (rotZ / radarRange) * r;
      hudCtx.fillStyle = '#ffffff';
      hudCtx.fillRect(px - 2, py - 2, 4, 4);
    }

    // Center Player Triangle
    hudCtx.fillStyle = hudCyan;
    hudCtx.beginPath();
    hudCtx.moveTo(rx, ry - 5);
    hudCtx.lineTo(rx - 4, ry + 4);
    hudCtx.lineTo(rx + 4, ry + 4);
    hudCtx.closePath();
    hudCtx.fill();

    hudCtx.restore();

    hudCtx.fillStyle = hudGreen;
    hudCtx.font = '10px "Press Start 2P", monospace';
    hudCtx.textAlign = 'left';
    hudCtx.fillText(`RDR // TGT: ${enemies.length}`, 26, ry - r - 12);
  }

  function drawWeaponAndStatusPanel(w, h, hudGreen, hudCyan, hudRed, hudAmber) {
    const panelW = 240;
    const panelH = 148;
    const px = w - panelW - 24;
    const py = h - panelH - 24;

    hudCtx.fillStyle = 'rgba(5, 18, 24, 0.85)';
    hudCtx.strokeStyle = hudGreen;
    hudCtx.lineWidth = 2;
    hudCtx.fillRect(px, py, panelW, panelH);
    hudCtx.strokeRect(px, py, panelW, panelH);

    // Aircraft Damage Wireframe Silhouette & Hull %
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const dmgPct = Math.round((1 - hpRatio) * 100);
    const statusColor = hpRatio > 0.6 ? hudGreen : (hpRatio > 0.3 ? hudAmber : hudRed);

    // Mini Top-Down Jet Silhouette on Left Side of Status Box
    const jx = px + 44;
    const jy = py + 58;
    hudCtx.save();
    hudCtx.translate(jx, jy);
    hudCtx.strokeStyle = statusColor;
    hudCtx.fillStyle = statusColor + '33';
    hudCtx.lineWidth = 1.8;
    hudCtx.beginPath();
    hudCtx.moveTo(0, -28);
    hudCtx.lineTo(6, -10);
    hudCtx.lineTo(24, 6);
    hudCtx.lineTo(24, 14);
    hudCtx.lineTo(6, 10);
    hudCtx.lineTo(9, 24);
    hudCtx.lineTo(3, 24);
    hudCtx.lineTo(0, 18);
    hudCtx.lineTo(-3, 24);
    hudCtx.lineTo(-9, 24);
    hudCtx.lineTo(-6, 10);
    hudCtx.lineTo(-24, 14);
    hudCtx.lineTo(-24, 6);
    hudCtx.lineTo(-6, -10);
    hudCtx.closePath();
    hudCtx.fill();
    hudCtx.stroke();
    hudCtx.restore();

    hudCtx.fillStyle = statusColor;
    hudCtx.font = '10px "Press Start 2P", monospace';
    hudCtx.textAlign = 'center';
    hudCtx.fillText(`DMG ${dmgPct}%`, jx, py + 106);

    // Weapon Loadout Readout (Right Side of Panel)
    const wx = px + 92;
    hudCtx.textAlign = 'left';
    hudCtx.font = '10px "Press Start 2P", monospace';
    hudCtx.fillStyle = hudCyan;
    hudCtx.fillText(`WPN: ${player.activeWeapon === 'MSL' ? 'STD MSL' : selectedSpw.short}`, wx, py + 22);

    hudCtx.font = '12px "Share Tech Mono", monospace';
    hudCtx.fillStyle = hudGreen;
    hudCtx.fillText(`GUN   ∞`, wx, py + 44);
    hudCtx.fillStyle = player.activeWeapon === 'MSL' ? '#ffffff' : hudGreen;
    hudCtx.fillText(`${player.activeWeapon === 'MSL' ? '▶' : ' '}MSL  ${String(player.mslAmmo).padStart(2, '0')}`, wx, py + 64);
    hudCtx.fillStyle = player.activeWeapon === 'SPW' ? hudCyan : hudGreen;
    hudCtx.fillText(`${player.activeWeapon === 'SPW' ? '▶' : ' '}${selectedSpw.short.padEnd(4, ' ')} ${String(player.spwAmmo).padStart(2, '0')}`, wx, py + 84);
    hudCtx.fillStyle = hudAmber;
    hudCtx.fillText(`FLR   ${String(player.flareCount).padStart(2, '0')} [F]`, wx, py + 104);

    // Dual Missile Bay Reload Bars at Bottom of Panel
    const barW = 100;
    const barH = 8;
    for (let s = 0; s < 2; s++) {
      const bx = px + 14 + s * 108;
      const by = py + 125;
      const ratio = 1 - (player.mslSlots[s] / player.mslMaxReload);
      hudCtx.strokeStyle = hudGreen;
      hudCtx.strokeRect(bx, by, barW, barH);
      hudCtx.fillStyle = ratio >= 1 ? hudGreen : hudAmber;
      hudCtx.fillRect(bx + 1, by + 1, (barW - 2) * ratio, barH - 2);
    }
  }

  // ==========================================================================
  // INPUT & UI EVENT LISTENERS
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Escape') {
      if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseModal.classList.remove('hidden');
        window.soundEngine.updateEngine(0, false);
      } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseModal.classList.add('hidden');
      }
      return;
    }

    if (gameState !== 'PLAYING') return;

    if (e.code === 'KeyG') {
      launchWeapon();
    } else if (e.code === 'KeyX') {
      player.activeWeapon = player.activeWeapon === 'MSL' ? 'SPW' : 'MSL';
      player.lockProgress = 0;
      player.isLocked = false;
      window.soundEngine.playUIClick();
    } else if (e.code === 'Tab' || e.code === 'KeyR') {
      e.preventDefault();
      cycleTarget(false);
    } else if (e.code === 'KeyF') {
      deployFlares();
    } else if (e.code === 'KeyV') {
      cameraMode = (cameraMode + 1) % CAM_MODES.length;
      document.getElementById('btn-camera-mode').textContent = `CAM: ${CAM_MODES[cameraMode]} [V]`;
      window.soundEngine.playUIClick();
    } else if (e.code === 'KeyM') {
      const on = window.soundEngine.toggleBGM();
      document.getElementById('btn-bgm-toggle').textContent = `BGM: ${on ? 'ON' : 'OFF'}`;
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  window.addEventListener('mousedown', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.target.closest('button') || e.target.closest('.modal-card')) return;
    if (e.button === 0) keys['MouseLeft'] = true;
    if (e.button === 2) launchWeapon();
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) keys['MouseLeft'] = false;
  });

  window.addEventListener('contextmenu', (e) => {
    if (gameState === 'PLAYING') e.preventDefault();
  });

  window.addEventListener('wheel', (e) => {
    if (gameState === 'PLAYING') {
      player.activeWeapon = player.activeWeapon === 'MSL' ? 'SPW' : 'MSL';
      player.lockProgress = 0;
      window.soundEngine.playUIClick();
    }
  });

  // UI Buttons
  document.getElementById('btn-sortie').addEventListener('click', startSortie);

  document.getElementById('btn-toggle-crt').addEventListener('click', (e) => {
    window.soundEngine.playUIClick();
    const crt = document.getElementById('crt-overlay');
    crt.classList.toggle('crt-active');
    e.target.textContent = `CRT: ${crt.classList.contains('crt-active') ? 'ON' : 'OFF'}`;
  });

  document.getElementById('btn-controls-help').addEventListener('click', () => {
    window.soundEngine.playUIClick();
    pauseModal.classList.remove('hidden');
  });

  document.getElementById('btn-pixel-scale').addEventListener('click', (e) => {
    window.soundEngine.playUIClick();
    pixelScaleIdx = (pixelScaleIdx + 1) % PIXEL_SCALES.length;
    pixelScale = PIXEL_SCALES[pixelScaleIdx];
    e.target.textContent = `PIXEL: ${pixelScale}X`;
    resizeViewports();
  });

  document.getElementById('btn-camera-mode').addEventListener('click', (e) => {
    window.soundEngine.playUIClick();
    cameraMode = (cameraMode + 1) % CAM_MODES.length;
    e.target.textContent = `CAM: ${CAM_MODES[cameraMode]} [V]`;
  });

  document.getElementById('btn-bgm-toggle').addEventListener('click', (e) => {
    const on = window.soundEngine.toggleBGM();
    e.target.textContent = `BGM: ${on ? 'ON' : 'OFF'}`;
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      pauseModal.classList.remove('hidden');
      window.soundEngine.updateEngine(0, false);
    }
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    window.soundEngine.playUIClick();
    pauseModal.classList.add('hidden');
    if (gameState === 'PAUSED') gameState = 'PLAYING';
  });

  document.getElementById('btn-restart-mission').addEventListener('click', startSortie);
  document.getElementById('btn-debrief-retry').addEventListener('click', startSortie);

  function returnToHangar() {
    window.soundEngine.playUIClick();
    window.soundEngine.updateEngine(0, false);
    clearWorldEntities();
    gameState = 'HANGAR';
    pauseModal.classList.add('hidden');
    debriefModal.classList.add('hidden');
    flightTopbar.classList.add('hidden');
    tacticalComms.classList.add('hidden');
    warningBanner.classList.add('hidden');
    hangarScreen.classList.remove('hidden');
    hangarGroup.visible = true;
    updateHangarEnvironmentColors();
  }

  document.getElementById('btn-abort-hangar').addEventListener('click', returnToHangar);
  document.getElementById('btn-debrief-hangar').addEventListener('click', returnToHangar);

  document.getElementById('chk-invert-pitch').addEventListener('change', (e) => {
    invertPitch = e.target.checked;
  });

  document.getElementById('chk-mouse-aim').addEventListener('change', (e) => {
    mouseAimEnabled = e.target.checked;
  });

  // ==========================================================================
  // MASTER ANIMATION LOOP
  // ==========================================================================
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'HANGAR') {
      if (!isDraggingHangar) {
        hangarTurntableAngle += dt * 0.45;
      }
      if (hangarJetMesh) {
        hangarJetMesh.rotation.y = hangarTurntableAngle;
        hangarJetMesh.position.y = Math.sin(now * 0.0025) * 0.35;
      }
      camera.position.set(0, 4.2, 16.5);
      camera.lookAt(0, 0.2, 0);
      renderer.render(scene, camera);
      hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    } else if (gameState === 'PLAYING') {
      updateSimulation(dt);
      renderer.render(scene, camera);
      renderAceCombatHUD();
    } else {
      // PAUSED or DEBRIEF
      renderer.render(scene, camera);
      renderAceCombatHUD();
    }
  }

  initHangarUI();
  requestAnimationFrame(animate);
})();
