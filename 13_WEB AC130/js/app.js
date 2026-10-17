import { AC130_DATA } from './data.js';
import { AC130Viewer } from './viewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize UI elements
  const slider = document.getElementById('explodeSlider');
  const readout = document.getElementById('explodeReadout');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const quickExplodeBtns = document.querySelectorAll('[data-explode]');
  const rotateBtn = document.getElementById('btnToggleRotate');
  const nvgBtn = document.getElementById('btnToggleNVG');
  const xrayBtn = document.getElementById('btnToggleXRay');
  const pylonBtn = document.getElementById('btnPylonTurn');
  const fireBtn = document.getElementById('btnFireSalvo');
  const cutawayBtn = document.getElementById('btnCutaway');
  const openDrawerBtn = document.getElementById('btnOpenDrawer');
  const hudStatusLine = document.getElementById('hudStatusLine');

  // 4 New Interactive Features
  const playBtn = document.getElementById('btnTogglePlay');
  const playIcon = document.getElementById('btnPlayIcon');
  const playText = document.getElementById('btnPlayText');
  const flightEnvBtn = document.getElementById('btnFlightEnv');
  const flaresBtn = document.getElementById('btnAngelFlares');
  const fpsGunnerBtn = document.getElementById('btnFPSGunner');
  const cameraFollowBtn = document.getElementById('btnCameraFollow');

  // Fullscreen elements
  const fsBtn = document.getElementById('btnToggleFullscreen');
  const dockFsBtn = document.getElementById('btnDockFullscreen');
  const fsBtnIcon = document.getElementById('fsBtnIcon');
  const fsBtnLabel = document.getElementById('fsBtnLabel');
  const viewport = document.getElementById('viewerViewport');

  const drawer = document.getElementById('partDrawer');
  const drawerClose = document.getElementById('drawerClose');
  const chipsContainer = document.getElementById('partChips');

  // Drawer fields
  const drawerCat = document.getElementById('drawerCat');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerDesc = document.getElementById('drawerDesc');
  const drawerFacts = document.getElementById('drawerFacts');

  // 2. Instantiate 3D Viewer
  const viewer = new AC130Viewer('canvas3d', {
    onSelectPart: (part) => {
      displayPartInfo(part);
    },
    onExplodeChange: (val) => {
      const pct = Math.round(val * 100);
      readout.textContent = `${pct}%`;
      slider.value = pct;
    },
    onModeChange: (state) => {
      rotateBtn.classList.toggle('active', !!state.isRotating);
      cutawayBtn.classList.toggle('active', !!state.cutawayMode);
      pylonBtn.classList.toggle('active', !!state.pylonTurnMode);
      if (fpsGunnerBtn) fpsGunnerBtn.classList.toggle('active', !!state.fpsGunnerMode);
      if (cameraFollowBtn) cameraFollowBtn.classList.toggle('active', !!state.cameraFollowMode);
      if (hudStatusLine) {
        hudStatusLine.textContent = state.fpsGunnerMode
          ? 'MODE: FIRST-PERSON GUNNER FIRE STATION (WSO ACTIVE)'
          : (state.pylonTurnMode
            ? (state.cameraFollowMode ? 'MODE: KAMERA MENGIKUTI ORBIT PESAWAT (CHASE CAM)' : 'MODE: SIMULASI ORBIT PYLON TURN & LIVE FIRE AKTIF')
            : 'MODE: HANGGAR INSPEKSI & EXPLODEVIEW');
      }
    }
  });

  // 3. Populate 16 Part Selection Chips
  viewer.modelData.parts.forEach(p => {
    const chip = document.createElement('button');
    chip.className = 'chip-btn';
    chip.textContent = p.name.split('(')[0].split('&')[0].trim();
    chip.title = p.name;
    chip.dataset.id = p.id;
    chip.addEventListener('click', () => {
      viewer.selectPart(p.id, true);
      document.querySelectorAll('#partChips .chip-btn').forEach(b => b.classList.remove('active'));
      chip.classList.add('active');
    });
    chipsContainer.appendChild(chip);
  });

  // Populate initial overview facts in drawer (without forcing emissive glow until clicked)
  const initialPart = viewer.modelData.parts.find(p => p.id === 'gun105') || viewer.modelData.parts[0];
  if (initialPart) {
    renderDrawerContent(initialPart);
  }

  function renderDrawerContent(part) {
    drawerCat.textContent = part.cat || 'Sub-Sistem';
    drawerTitle.textContent = part.name;
    drawerDesc.textContent = part.desc;
    drawerFacts.innerHTML = '';

    if (part.facts && part.facts.length > 0) {
      part.facts.forEach(([k, v]) => {
        const item = document.createElement('div');
        item.className = 'fact-item';
        item.innerHTML = `
          <span class="fact-key">${k}</span>
          <span class="fact-val">${v}</span>
        `;
        drawerFacts.appendChild(item);
      });
    }
  }

  function displayPartInfo(part) {
    renderDrawerContent(part);
    drawer.classList.remove('collapsed');
    if (openDrawerBtn) openDrawerBtn.style.display = 'none';

    document.querySelectorAll('#partChips .chip-btn').forEach(b => {
      if (b.dataset.id === part.id) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  drawerClose.addEventListener('click', () => {
    drawer.classList.add('collapsed');
    if (openDrawerBtn) openDrawerBtn.style.display = 'inline-flex';
    viewer.clearHighlight();
    document.querySelectorAll('#partChips .chip-btn').forEach(b => b.classList.remove('active'));
  });

  if (openDrawerBtn) {
    openDrawerBtn.addEventListener('click', () => {
      drawer.classList.remove('collapsed');
      openDrawerBtn.style.display = 'none';
    });
  }

  // Explode Slider Listener
  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    viewer.setExplode(val, true);
    readout.textContent = `${Math.round(val * 100)}%`;
  });

  // Quick Explode Preset Buttons (0%, 50%, 100%)
  quickExplodeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseFloat(btn.dataset.explode);
      slider.value = pct;
      readout.textContent = `${pct}%`;
      viewer.setExplode(pct / 100, true);
    });
  });

  // Camera Presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewer.setCameraPreset(btn.dataset.preset);
    });
  });

  // Mode Toggle Controls
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      const paused = viewer.togglePause();
      playBtn.classList.toggle('active', paused);
      if (playIcon) playIcon.textContent = paused ? '▶️' : '⏸️';
      if (playText) playText.textContent = paused ? 'Lanjutkan Pesawat' : 'Jeda Pesawat';
      if (hudStatusLine) {
        hudStatusLine.textContent = paused ? 'STATUS: PESAWAT DIJEDA (PAUSED)' : (
          viewer.fpsGunnerMode ? 'MODE: FIRST-PERSON GUNNER FIRE STATION (WSO ACTIVE)' : (
            viewer.pylonTurnMode ? 'MODE: SIMULASI ORBIT PYLON TURN & LIVE FIRE AKTIF' : 'MODE: HANGGAR INSPEKSI & EXPLODEVIEW'
          )
        );
      }
    });
  }

  if (flightEnvBtn) {
    flightEnvBtn.addEventListener('click', () => {
      const envActive = viewer.toggleFlightEnv();
      flightEnvBtn.classList.toggle('active', envActive);
      if (pylonBtn) pylonBtn.classList.toggle('active', viewer.pylonTurnMode);
    });
  }

  if (flaresBtn) {
    flaresBtn.addEventListener('click', () => {
      viewer.launchAngelWingFlares();
      flaresBtn.classList.add('active');
      setTimeout(() => flaresBtn.classList.remove('active'), 1200);
    });
  }

  if (fpsGunnerBtn) {
    fpsGunnerBtn.addEventListener('click', () => {
      const fpsActive = viewer.toggleFPSGunner();
      fpsGunnerBtn.classList.toggle('active', fpsActive);
      if (pylonBtn) pylonBtn.classList.toggle('active', viewer.pylonTurnMode);
    });
  }

  rotateBtn.addEventListener('click', () => {
    const state = viewer.toggleAutoRotate();
    rotateBtn.classList.toggle('active', state);
  });

  if (pylonBtn) {
    pylonBtn.addEventListener('click', () => {
      const state = viewer.togglePylonTurn();
      pylonBtn.classList.toggle('active', state);
    });
  }

  if (cameraFollowBtn) {
    cameraFollowBtn.addEventListener('click', () => {
      const active = viewer.toggleCameraFollow();
      cameraFollowBtn.classList.toggle('active', active);
      if (pylonBtn) pylonBtn.classList.toggle('active', viewer.pylonTurnMode);
    });
  }

  if (fireBtn) {
    fireBtn.addEventListener('click', () => {
      viewer.fireSalvo('both');
    });
  }

  if (cutawayBtn) {
    cutawayBtn.addEventListener('click', () => {
      const state = viewer.toggleCutaway();
      cutawayBtn.classList.toggle('active', state);
    });
  }

  nvgBtn.addEventListener('click', () => {
    const state = viewer.toggleNightVision();
    nvgBtn.classList.toggle('active', state);
    document.body.classList.toggle('nvg-active', state);
  });

  xrayBtn.addEventListener('click', () => {
    const state = viewer.toggleXRay();
    xrayBtn.classList.toggle('active', state);
  });

  // Fullscreen Viewport Handlers
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (viewport && viewport.requestFullscreen) {
        viewport.requestFullscreen();
      } else if (viewport && viewport.webkitRequestFullscreen) {
        viewport.webkitRequestFullscreen();
      } else if (viewport && viewport.msRequestFullscreen) {
        viewport.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
  if (dockFsBtn) dockFsBtn.addEventListener('click', toggleFullscreen);

  // Dedicated Tactical Fullscreen Button inside Gunner HUD
  const fpsFsBtn = document.getElementById('btnFPSFullscreen');
  if (fpsFsBtn) fpsFsBtn.addEventListener('click', toggleFullscreen);

  // Toggle Minimize/Expand Controls Dock
  const toggleDockBtn = document.getElementById('btnToggleDock');
  const dockToggleIcon = document.getElementById('dockToggleIcon');
  const dockToggleLabel = document.getElementById('dockToggleLabel');
  const hudControlsDock = document.getElementById('hudControlsDock');

  if (toggleDockBtn && hudControlsDock) {
    toggleDockBtn.addEventListener('click', () => {
      hudControlsDock.classList.toggle('collapsed-dock');
      const isCollapsed = hudControlsDock.classList.contains('collapsed-dock');
      if (dockToggleIcon) dockToggleIcon.textContent = isCollapsed ? '▴' : '▾';
      if (dockToggleLabel) dockToggleLabel.textContent = isCollapsed ? 'Tampilkan' : 'Sembunyikan';
    });
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    if (fsBtn) {
      fsBtn.classList.toggle('active', isFs);
      if (fsBtnIcon) fsBtnIcon.textContent = isFs ? '🗗' : '⛶';
      if (fsBtnLabel) fsBtnLabel.textContent = isFs ? 'Keluar Fullscreen' : 'Fullscreen';
    }
    if (dockFsBtn) {
      dockFsBtn.classList.toggle('active', isFs);
      dockFsBtn.textContent = isFs ? '🗗 Keluar Fullscreen' : '⛶ Fullscreen';
    }
    if (fpsFsBtn) {
      fpsFsBtn.classList.toggle('active', isFs);
      fpsFsBtn.innerHTML = `<span>${isFs ? '🗗' : '⛶'}</span> ${isFs ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}`;
    }
    setTimeout(() => viewer.onWindowResize(), 100);
  });

  // 4. Render Specifications Section
  renderSpecsTabs();

  // 5. Render Armament Section
  renderArmament();

  // 6. Render Missions Timeline
  renderMissions();

  // 7. Render Variants Table
  renderVariants();

  // Smooth Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

// Render Spec Data with Tab Filtering
function renderSpecsTabs() {
  const container = document.getElementById('specsGrid');
  const tabs = document.querySelectorAll('.spec-tab-btn');

  const renderCategory = (cat) => {
    container.innerHTML = '';
    let list = [];
    if (cat === 'dimensi') list = AC130_DATA.dimensions;
    else if (cat === 'propulsi') list = AC130_DATA.propulsion;
    else if (cat === 'kru') {
      list = AC130_DATA.crew.roles.map(r => ({
        label: `${r.role} (${r.count})`,
        value: r.count,
        desc: r.duty
      }));
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'spec-card';
      card.innerHTML = `
        <div class="spec-card-title">${item.label}</div>
        <div class="spec-card-val">${item.value}</div>
        <div class="spec-card-desc">${item.desc}</div>
      `;
      container.appendChild(card);
    });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderCategory(tab.dataset.category);
    });
  });

  renderCategory('dimensi');
}

// Render Armament Cards
function renderArmament() {
  const container = document.getElementById('armamentGrid');
  container.innerHTML = '';

  AC130_DATA.armament.forEach(w => {
    const card = document.createElement('div');
    card.className = 'weapon-card';
    card.innerHTML = `
      <div class="weapon-badge">${w.type}</div>
      <h3 class="weapon-title">${w.name}</h3>
      <table class="weapon-stats-table">
        <tr>
          <td>Kaliber / Tipe</td>
          <td>${w.caliber}</td>
        </tr>
        ${w.rateOfFire ? `<tr><td>Laju Tembak</td><td>${w.rateOfFire}</td></tr>` : ''}
        ${w.range ? `<tr><td>Jangkauan Efektif</td><td>${w.range}</td></tr>` : ''}
        ${w.payload ? `<tr><td>Hulu Ledak</td><td>${w.payload}</td></tr>` : ''}
      </table>
      <p class="weapon-desc">${w.desc}</p>
    `;
    container.appendChild(card);
  });
}

// Render Missions Timeline
function renderMissions() {
  const container = document.getElementById('missionsTimeline');
  container.innerHTML = '';

  AC130_DATA.missions.forEach(m => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-node"></div>
      <div class="timeline-card">
        <div class="timeline-header">
          <span class="timeline-year">${m.year}</span>
          <span class="timeline-location">${m.location}</span>
        </div>
        <h3 class="timeline-title">${m.title}</h3>
        <p class="timeline-summary">${m.summary}</p>
        <p class="timeline-details">${m.details}</p>
      </div>
    `;
    container.appendChild(item);
  });
}

// Render Variants Comparison Table
function renderVariants() {
  const tbody = document.getElementById('variantsTableBody');
  tbody.innerHTML = '';

  AC130_DATA.variants.forEach(v => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="variant-code">${v.code}</td>
      <td>${v.era}</td>
      <td>${v.engine}</td>
      <td>${v.guns}</td>
      <td>${v.note}</td>
    `;
    tbody.appendChild(row);
  });
}
