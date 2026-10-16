// Main Isometric Game Loop, Camera Controller, Interactions & UI Binding

(function () {
  let scene, renderer, camera;
  let systems, world, player;
  let clock;
  let isGameOver = false;
  let isPaused = true; // Starts on welcome briefing modal

  // Isometric Camera Settings
  const frustumSize = 21;
  window.isoCameraAngle = Math.PI / 4; // 45 deg default
  let targetCameraAngle = Math.PI / 4;
  let zoomLevel = 1.0;

  // Input State
  const keys = {};
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.9); // Aim at waist height

  // Timed Action State (Barricading / Dismantling)
  let currentTimedAction = null; // { label, duration, elapsed, onComplete, targetX, targetZ }
  let openContainerRef = null;

  // Event Log Helper
  window.addLog = function (text, type = '') {
    const logEl = document.getElementById('event-log');
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + type;
    const h = Math.floor(systems ? systems.timeHours : 8);
    const m = Math.floor(((systems ? systems.timeHours : 8) % 1) * 60);
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    entry.textContent = `[${timeStr}] ${text}`;
    logEl.prepend(entry);
    while (logEl.children.length > 35) {
      logEl.removeChild(logEl.lastChild);
    }
  };

  function initGame() {
    const container = document.getElementById('game-canvas-container');
    container.innerHTML = '';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e13);
    scene.fog = new THREE.FogExp2(0x0b0e13, 0.012);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      1,
      120
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    systems = new SurvivalSystems();
    world = new GameWorld(scene, systems);
    window.gameWorld = world;
    player = new PlayerEntity(scene, world, systems);

    // Spawn initial roaming street zombies outside
    world.spawnZombie(-12, 16.5, false);
    world.spawnZombie(4, 17.5, false);
    world.spawnZombie(14, 15.5, false);
    world.spawnZombie(-16, -9.0, false);
    world.spawnZombie(15, -8.5, false);

    clock = new THREE.Clock();
    isGameOver = false;

    window.addLog('Wabah Zombie melanda kota. Anda bertahan di dalam rumah.', 'warn');
    window.addLog('Tips: Tutup tirai jendela (G) dan pasang papan barikade (B) sebelum malam!', 'radio');

    renderHotbarUI();
    renderInventoryUI();
    renderCraftingUI();
  }

  function updateCamera(dt) {
    // Smoothly interpolate camera rotation angle
    const diff = targetCameraAngle - window.isoCameraAngle;
    window.isoCameraAngle += diff * Math.min(1, dt * 8);

    const dist = 28;
    const height = 23;
    const camX = player.x + Math.sin(window.isoCameraAngle) * dist;
    const camZ = player.z + Math.cos(window.isoCameraAngle) * dist;

    camera.position.set(camX, height, camZ);
    camera.lookAt(player.x, 0.8, player.z);
    camera.zoom = zoomLevel;
    camera.updateProjectionMatrix();
  }

  function findNearestInteraction() {
    let bestOpening = null;
    let bestOpeningDist = 2.25;

    for (const op of world.openings) {
      const d = Math.hypot(op.cx - player.x, op.cz - player.z);
      if (d < bestOpeningDist) {
        bestOpeningDist = d;
        bestOpening = op;
      }
    }

    let bestObj = null;
    let bestObjDist = 2.35;
    for (const obj of world.interactables) {
      const d = Math.hypot(obj.cx - player.x, obj.cz - player.z);
      if (d < bestObjDist) {
        bestObjDist = d;
        bestObj = obj;
      }
    }

    return { opening: bestOpening, object: bestObj };
  }

  function updateInteractionPrompt() {
    const promptEl = document.getElementById('interaction-prompt');
    const nearest = findNearestInteraction();

    if (!nearest.opening && !nearest.object) {
      promptEl.classList.add('hidden');
      if (openContainerRef) {
        openContainerRef = null;
        document.getElementById('loot-panel').classList.add('hidden');
      }
      return;
    }

    const parts = [];
    if (nearest.opening) {
      const op = nearest.opening;
      const stateText = op.isBroken ? 'RUSAK' : (op.isOpen ? 'Tutup' : 'Buka');
      parts.push(`<span><span class="key-hint">E</span>${stateText} ${op.label}</span>`);
      parts.push(`<span><span class="key-hint">B</span>Barikade (${op.planks}/4)</span>`);
      if (op.type === 'window') {
        parts.push(`<span><span class="key-hint">G</span>${op.hasCurtainClosed ? 'Buka Tirai' : 'Tutup Tirai'}</span>`);
      }
    }

    if (nearest.object) {
      const obj = nearest.object;
      if (obj.actionType === 'container') {
        parts.push(`<span><span class="key-hint">E</span>Geledah ${obj.name} (${obj.loot.length})</span>`);
      } else if (obj.actionType === 'stove') {
        parts.push(`<span><span class="key-hint">E</span>Masak Daging (${obj.name})</span>`);
      } else if (obj.actionType === 'sink') {
        parts.push(`<span><span class="key-hint">E</span>Minum / Isi Air</span>`);
      } else if (obj.actionType === 'bed') {
        parts.push(`<span><span class="key-hint">E</span>Tidur & Istirahat</span>`);
      } else if (obj.actionType === 'tv') {
        parts.push(`<span><span class="key-hint">E</span>${systems.tvOn ? 'Matikan' : 'Nyalakan'} TV Darurat</span>`);
      } else if (obj.actionType === 'generator') {
        parts.push(`<span><span class="key-hint">E</span>Generator (${Math.round(systems.generatorFuel)}%)</span>`);
      }

      if (obj.actionType === 'dismantle' || obj.dismantleYields) {
        parts.push(`<span><span class="key-hint">X</span>Bongkar Kayu</span>`);
      }
    }

    promptEl.innerHTML = parts.join(' &nbsp;|&nbsp; ');
    promptEl.classList.remove('hidden');
  }

  function startTimedAction(label, duration, targetX, targetZ, onComplete) {
    currentTimedAction = {
      label,
      duration,
      elapsed: 0,
      targetX,
      targetZ,
      onComplete
    };
    const box = document.getElementById('action-progress-box');
    document.getElementById('action-label').textContent = label;
    document.getElementById('action-bar-fill').style.width = '0%';
    box.classList.remove('hidden');
  }

  function updateTimedAction(dt) {
    if (!currentTimedAction) return;
    // Cancel if player walked away
    if (Math.hypot(player.x - currentTimedAction.targetX, player.z - currentTimedAction.targetZ) > 2.6) {
      currentTimedAction = null;
      document.getElementById('action-progress-box').classList.add('hidden');
      window.addLog('Aksi dibatalkan karena Anda bergerak menjauh.', 'warn');
      return;
    }

    currentTimedAction.elapsed += dt;
    const pct = Math.min(100, (currentTimedAction.elapsed / currentTimedAction.duration) * 100);
    document.getElementById('action-bar-fill').style.width = pct + '%';

    if (currentTimedAction.elapsed >= currentTimedAction.duration) {
      const cb = currentTimedAction.onComplete;
      currentTimedAction = null;
      document.getElementById('action-progress-box').classList.add('hidden');
      if (cb) cb();
      renderHotbarUI();
      renderInventoryUI();
      renderCraftingUI();
    }
  }

  function handlePrimaryInteractE() {
    const nearest = findNearestInteraction();

    // Prioritize Container / Appliance if very close, otherwise Door/Window
    if (nearest.object && (!nearest.opening || Math.hypot(nearest.object.cx - player.x, nearest.object.cz - player.z) <= Math.hypot(nearest.opening.cx - player.x, nearest.opening.cz - player.z))) {
      const obj = nearest.object;
      if (obj.actionType === 'container') {
        openContainerRef = obj;
        renderLootPanelUI(obj);
        document.getElementById('loot-panel').classList.remove('hidden');
        window.soundFX.playClick();
        return;
      }
      if (obj.actionType === 'stove') {
        if (!systems.hasElectricity()) {
          window.addLog('Kompor membutuhkan aliran listrik! Nyalakan generator.', 'warn');
          return;
        }
        if (systems.getItemCount('fresh_meat') > 0) {
          startTimedAction('Memasak Steak Matang...', 1.5, obj.cx, obj.cz, () => {
            systems.removeItem('fresh_meat', 1);
            systems.addItem('cooked_meal', 1);
            window.addLog('Berhasil memasak Daging Mentah menjadi Steak Matang!', 'good');
          });
        } else {
          window.addLog('Anda tidak memiliki Daging Mentah untuk dimasak.', 'warn');
        }
        return;
      }
      if (obj.actionType === 'sink') {
        if (!systems.waterGridOnline) {
          window.addLog('Air PDAM sudah mati! Keran kering.', 'danger');
          return;
        }
        window.soundFX.playClick();
        systems.thirst = Math.max(0, systems.thirst - 45);
        if (systems.getItemCount('empty_bottle') > 0) {
          systems.removeItem('empty_bottle', 1);
          systems.addItem('water_bottle', 1);
          window.addLog('Minum air segar dari keran & mengisi penuh Botol Air!', 'good');
        } else {
          window.addLog('Minum air langsung dari keran wastafel. Haus berkurang.', 'good');
        }
        renderHotbarUI();
        renderInventoryUI();
        return;
      }
      if (obj.actionType === 'bed') {
        // Check if zombies are inside the house or too close
        const dangerNear = world.zombies.some(z => !z.isDead && Math.hypot(z.x - player.x, z.z - player.z) < 6.5);
        if (dangerNear) {
          window.addLog('Tidak bisa tidur! Ada zombie terlalu dekat dengan kamar!', 'danger');
          return;
        }
        systems.isSleeping = !systems.isSleeping;
        window.addLog(systems.isSleeping ? 'Anda berbaring tidur... Waktu berjalan cepat.' : 'Anda bangun dari tempat tidur.', 'good');
        return;
      }
      if (obj.actionType === 'tv') {
        if (!systems.hasElectricity()) {
          window.addLog('Listrik mati! TV & Radio tidak bisa menyala.', 'warn');
          return;
        }
        systems.tvOn = !systems.tvOn;
        window.soundFX.playClick();
        if (systems.tvOn) {
          systems.emitNoise(obj.cx, obj.cz, 7.5, 'Suara TV');
          window.addLog('[SIARAN TV]: "Pertahankan barikade rumah Anda. Tim evakuasi sedang berjuang menembus blokade..." (Mengurangi Panik)', 'radio');
        } else {
          window.addLog('TV dimatikan agar rumah lebih senyap.', 'good');
        }
        return;
      }
      if (obj.actionType === 'generator') {
        if (systems.getItemCount('fuel_can') > 0 && systems.generatorFuel < 80) {
          systems.removeItem('fuel_can', 1);
          systems.generatorFuel = Math.min(100, systems.generatorFuel + 60);
          window.addLog('Mengisi bensin ke Generator Cadangan (+60% Bensin).', 'good');
          renderInventoryUI();
          return;
        }
        if (systems.generatorFuel <= 0) {
          window.addLog('Bensin Generator habis! Cari Jerigen Bensin di garasi atau mobil polisi.', 'danger');
          return;
        }
        systems.generatorRunning = !systems.generatorRunning;
        window.soundFX.playWoodThud();
        window.addLog(
          systems.generatorRunning
            ? 'Generator DINYALAKAN! Listrik rumah menyala, namun suara mesin memancing zombie!'
            : 'Generator DIMATIKAN.',
          systems.generatorRunning ? 'warn' : 'good'
        );
        return;
      }
    }

    if (nearest.opening) {
      world.toggleOpening(nearest.opening);
    }
  }

  function handleBarricadeB() {
    const nearest = findNearestInteraction();
    if (!nearest.opening) {
      window.addLog('Dekati Pintu atau Jendela terlebih dahulu untuk memasang barikade.', 'warn');
      return;
    }
    const op = nearest.opening;
    if (op.planks >= 4) {
      window.addLog(`${op.label} sudah penuh (4/4 papan).`, 'warn');
      return;
    }
    if (systems.getItemCount('wood_plank') < 1 || systems.getItemCount('nails') < 2) {
      window.addLog('Butuh 1 Papan Kayu & 2 Paku Besi untuk memasang barikade!', 'warn');
      return;
    }
    if (systems.getItemCount('hammer') < 1 && systems.getItemCount('fire_axe') < 1) {
      window.addLog('Butuh Palu Besi atau Kapak di inventaris!', 'warn');
      return;
    }

    window.soundFX.playHammer();
    startTimedAction(`Memaku Papan Barikade (${op.planks + 1}/4)...`, 1.15, op.cx, op.cz, () => {
      world.addBarricadePlank(op);
    });
  }

  function handleCurtainG() {
    const nearest = findNearestInteraction();
    if (nearest.opening && nearest.opening.type === 'window') {
      world.toggleCurtain(nearest.opening);
    } else {
      window.addLog('Dekati Jendela untuk membuka/menutup tirai (G).', 'warn');
    }
  }

  function handleDismantleX() {
    const nearest = findNearestInteraction();
    if (!nearest.object || (!nearest.object.yields && !nearest.object.dismantleYields)) {
      window.addLog('Dekati perabotan kayu atau pohon untuk membongkarnya menjadi Papan Kayu.', 'warn');
      return;
    }
    if (systems.getItemCount('hammer') < 1 && systems.getItemCount('fire_axe') < 1) {
      window.addLog('Butuh Palu Besi atau Kapak untuk membongkar objek ini!', 'warn');
      return;
    }
    const obj = nearest.object;
    window.soundFX.playHammer();
    startTimedAction(`Membongkar ${obj.name}...`, 1.4, obj.cx, obj.cz, () => {
      world.dismantleObject(obj);
    });
  }

  // UI Rendering Functions
  function updateHUD() {
    // Clock & Day
    const h = Math.floor(systems.timeHours);
    const m = Math.floor((systems.timeHours % 1) * 60);
    document.getElementById('hud-time').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    document.getElementById('hud-day').textContent = `HARI ${systems.day}`;

    // Utility Badges
    const elecEl = document.getElementById('badge-power');
    const hasPower = systems.hasElectricity();
    elecEl.className = 'util-badge ' + (hasPower ? 'active' : 'off');
    elecEl.textContent = hasPower
      ? (systems.generatorRunning ? `⚡ Genset (${Math.round(systems.generatorFuel)}%)` : '⚡ Listrik ON')
      : '⚡ Listrik PADAM';

    const waterEl = document.getElementById('badge-water');
    waterEl.className = 'util-badge ' + (systems.waterGridOnline ? 'active' : 'off');
    waterEl.textContent = systems.waterGridOnline ? '🚰 Air PDAM ON' : '🚰 Air MATI';

    const lightEl = document.getElementById('badge-lights');
    lightEl.className = 'util-badge ' + (systems.houseLightsOn && hasPower ? 'active' : '');
    lightEl.textContent = `💡 Lampu Rumah [L]: ${systems.houseLightsOn ? 'ON' : 'OFF'}`;

    // Vitals Bars
    setBar('bar-hp', 'val-hp', systems.health, '#d9463e', `${Math.round(systems.health)}%`);
    setBar('bar-stamina', 'val-stamina', systems.stamina, '#4caf6a', `${Math.round(systems.stamina)}%`);
    setBar('bar-hunger', 'val-hunger', 100 - systems.hunger, '#e5a93c', systems.hunger > 65 ? 'Lapar!' : 'Kenyang');
    setBar('bar-thirst', 'val-thirst', 100 - systems.thirst, '#4a9eff', systems.thirst > 65 ? 'Haus!' : 'Segar');
    setBar('bar-fatigue', 'val-fatigue', 100 - systems.fatigue, '#9b6dff', systems.fatigue > 70 ? 'Ngantuk' : 'Bugar');
    setBar('bar-battery', 'val-battery', systems.flashlightBattery, '#ffd43b', `${Math.round(systems.flashlightBattery)}%`);

    // Screen FX & Moodles (Project Zomboid style badges)
    const fxEl = document.getElementById('screen-fx');
    fxEl.className = '';
    if (systems.bleeding) fxEl.classList.add('bleeding');
    else if (systems.panic > 55) fxEl.classList.add('panic-high');

    const moodlesEl = document.getElementById('moodles-container');
    const moodles = [];
    if (systems.bleeding) {
      moodles.push({ icon: '🩸', text: 'PENDARAHAN! Gunakan Perban!', cls: 'critical' });
    }
    if (systems.infected) {
      moodles.push({ icon: '🤢', text: `Gejala Infeksi (${Math.round(systems.infectionStage)}%)`, cls: 'critical' });
    }
    if (systems.panic > 45) {
      moodles.push({ icon: '😱', text: `Panik Tinggi (${Math.round(systems.panic)}%)`, cls: 'critical' });
    }
    if (systems.hunger > 60) {
      moodles.push({ icon: '🍖', text: 'Perut Keroncongan (Lapar)', cls: systems.hunger > 85 ? 'critical' : '' });
    }
    if (systems.thirst > 60) {
      moodles.push({ icon: '💧', text: 'Tenggorokan Kering (Haus)', cls: systems.thirst > 85 ? 'critical' : '' });
    }
    if (systems.fatigue > 65) {
      moodles.push({ icon: '💤', text: 'Sangat Mengantuk (Cari Kasur)', cls: '' });
    }
    if (player.isSneaking) {
      moodles.push({ icon: '👣', text: 'Mode Mengendap (Senyap)', cls: 'good' });
    }
    if (systems.isSleeping) {
      moodles.push({ icon: '🛌', text: 'Sedang Tidur (Tekan E untuk Bangun)', cls: 'good' });
    }

    moodlesEl.innerHTML = moodles
      .map(m => `<div class="moodle ${m.cls}"><span>${m.icon}</span><span>${m.text}</span></div>`)
      .join('');
  }

  function setBar(barId, valId, pct, color, labelText) {
    const bar = document.getElementById(barId);
    const val = document.getElementById(valId);
    if (bar) {
      bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      bar.style.backgroundColor = color;
    }
    if (val) val.textContent = labelText;
  }

  function renderHotbarUI() {
    systems.syncHotbar();
    const container = document.getElementById('hotbar');
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      const slotItem = systems.hotbar[i];
      const def = slotItem ? ITEM_DB[slotItem.id] : null;
      const div = document.createElement('div');
      div.className = 'hotbar-slot' + (systems.activeSlot === i ? ' active' : '');
      div.innerHTML = `<span class="slot-key">${i + 1}</span>`;

      if (slotItem && def) {
        div.innerHTML += `
          <div class="slot-icon">${def.icon}</div>
          <div class="slot-name">${def.name}</div>
          ${slotItem.count > 1 ? `<span class="slot-count">x${slotItem.count}</span>` : ''}
          ${slotItem.durability !== null && def.maxDurability ? `<div class="slot-durability" style="width:${Math.round((slotItem.durability / def.maxDurability) * 100)}%"></div>` : ''}
        `;
      }

      div.addEventListener('click', () => {
        systems.activeSlot = i;
        const clicked = systems.hotbar[i];
        if (clicked) {
          const cDef = ITEM_DB[clicked.id];
          if (cDef && (cDef.type === 'consumable' || cDef.type === 'medical')) {
            systems.useItem(clicked.uid);
          }
        }
        renderHotbarUI();
        renderInventoryUI();
      });

      container.appendChild(div);
    }
  }

  function renderInventoryUI() {
    const listEl = document.getElementById('inventory-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    // Quick summary of planks, nails, ammo
    const summaryEl = document.getElementById('inv-summary');
    if (summaryEl) {
      summaryEl.textContent = `🪵 Papan: ${systems.getItemCount('wood_plank')} | 📌 Paku: ${systems.getItemCount('nails')} | 🧱 Peluru 9mm: ${systems.getItemCount('ammo_9mm')}`;
    }

    systems.inventory.forEach(item => {
      const def = ITEM_DB[item.id];
      if (!def) return;
      const row = document.createElement('div');
      row.className = 'item-row';

      let actionBtnLabel = '';
      if (def.type === 'weapon') actionBtnLabel = 'Pegang';
      else if (def.type === 'consumable' || def.type === 'medical') actionBtnLabel = 'Gunakan';

      row.innerHTML = `
        <div class="item-info">
          <span class="item-icon">${def.icon}</span>
          <div>
            <div class="item-title">${def.name} ${item.count > 1 ? `(x${item.count})` : ''}</div>
            <div class="item-desc">${def.desc}</div>
          </div>
        </div>
        <div class="item-actions">
          ${actionBtnLabel ? `<button class="btn-small" data-uid="${item.uid}">${actionBtnLabel}</button>` : ''}
        </div>
      `;

      const btn = row.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => {
          systems.useItem(item.uid);
          renderHotbarUI();
          renderInventoryUI();
        });
      }
      listEl.appendChild(row);
    });
  }

  function renderCraftingUI() {
    const listEl = document.getElementById('crafting-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    CRAFTING_RECIPES.forEach(recipe => {
      const canDo = systems.canCraft(recipe);
      const resDef = ITEM_DB[recipe.result.id];
      const ingText = recipe.ingredients
        .map(ing => `${ITEM_DB[ing.id].name} (${systems.getItemCount(ing.id)}/${ing.count})`)
        .join(', ');

      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-info">
          <span class="item-icon">${resDef.icon}</span>
          <div>
            <div class="item-title">${recipe.name}</div>
            <div class="item-desc">Bahan: ${ingText}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-small" ${canDo ? '' : 'disabled'}>Rakit</button>
        </div>
      `;

      const btn = row.querySelector('button');
      btn.addEventListener('click', () => {
        if (systems.craft(recipe.id)) {
          renderHotbarUI();
          renderInventoryUI();
          renderCraftingUI();
        }
      });
      listEl.appendChild(row);
    });
  }

  function renderLootPanelUI(containerObj) {
    const titleEl = document.getElementById('loot-panel-title');
    const listEl = document.getElementById('loot-list');
    titleEl.textContent = `📦 ${containerObj.name}`;
    listEl.innerHTML = '';

    if (containerObj.loot.length === 0) {
      listEl.innerHTML = `<div class="item-desc" style="padding:10px;text-align:center;">Tempat penyimpanan ini kosong.</div>`;
      return;
    }

    containerObj.loot.forEach((lootEntry, idx) => {
      const def = ITEM_DB[lootEntry.id];
      if (!def) return;
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-info">
          <span class="item-icon">${def.icon}</span>
          <div>
            <div class="item-title">${def.name} (x${lootEntry.count})</div>
            <div class="item-desc">${def.desc}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-small">Ambil</button>
        </div>
      `;
      row.querySelector('button').addEventListener('click', () => {
        systems.addItem(lootEntry.id, lootEntry.count);
        window.soundFX.playClick();
        window.addLog(`Mengambil ${def.name} (x${lootEntry.count}) dari ${containerObj.name}.`, 'good');
        containerObj.loot.splice(idx, 1);
        renderLootPanelUI(containerObj);
        renderHotbarUI();
        renderInventoryUI();
        renderCraftingUI();
      });
      listEl.appendChild(row);
    });
  }

  function triggerGameOver() {
    isGameOver = true;
    const modal = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = 'ANDA TEWAS DITERKAM ZOMBIE';
    document.getElementById('modal-desc').innerHTML = `
      Anda berhasil bertahan hidup selama <strong>${systems.day} Hari</strong>.<br>
      Zombie Dilumpuhkan: <strong>${systems.kills}</strong> &nbsp;|&nbsp; Papan Barikade Terpasang: <strong>${systems.barricadesBuilt}</strong><br><br>
      Di dunia wabah ini, satu luka pendarahan atau jendela tanpa barikade di malam hari bisa berakibat fatal.
    `;
    const btn = document.getElementById('btn-start-game');
    btn.textContent = 'Coba Bertahan Hidup Lagi';
    modal.classList.remove('hidden');
  }

  // Main Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    if (!clock) return;
    const dt = Math.min(0.05, clock.getDelta());

    if (!isPaused && !isGameOver) {
      // Count nearby active zombies for Panic calculation
      let nearbyZombies = 0;
      for (const zmb of world.zombies) {
        if (!zmb.isDead && Math.hypot(zmb.x - player.x, zmb.z - player.z) < 9.5) {
          nearbyZombies++;
        }
      }

      systems.update(dt, { x: player.x, z: player.z }, nearbyZombies);
      player.update(dt, keys);

      for (const zmb of world.zombies) {
        zmb.update(dt, player);
      }

      updateTimedAction(dt);
      updateCamera(dt);
      world.updateDayNightAndCutaway(dt, camera.position, { x: player.x, z: player.z });
      updateInteractionPrompt();
      updateHUD();

      if (systems.health <= 0) {
        triggerGameOver();
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Event Listeners
  window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('mousemove', e => {
    if (!camera || !player) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersectPt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersectPt)) {
      player.aimX = intersectPt.x;
      player.aimZ = intersectPt.z;
    }
  });

  window.addEventListener('mousedown', e => {
    if (isPaused || isGameOver) return;
    // Ignore clicks on UI panels/buttons
    if (e.target.closest('#bottom-hud, #side-panels, #top-hud, #vitals-panel, #modal-overlay')) return;
    window.soundFX.init();
    if (e.button === 0) {
      player.performAttack();
      renderHotbarUI();
      renderInventoryUI();
    }
  });

  window.addEventListener('wheel', e => {
    zoomLevel = Math.max(0.65, Math.min(1.75, zoomLevel - e.deltaY * 0.001));
  });

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (isPaused || isGameOver) return;
    window.soundFX.init();

    if (e.code === 'KeyQ') {
      targetCameraAngle -= Math.PI / 2;
    } else if (e.code === 'KeyR') {
      targetCameraAngle += Math.PI / 2;
    } else if (e.code === 'KeyF') {
      systems.flashlightOn = !systems.flashlightOn;
      window.soundFX.playClick();
    } else if (e.code === 'KeyL') {
      systems.houseLightsOn = !systems.houseLightsOn;
      window.soundFX.playClick();
      window.addLog(`Saklar Lampu Rumah: ${systems.houseLightsOn ? 'DINYALAKAN' : 'DIMATIKAN (Hemat & Sembunyi)'}.`, 'good');
    } else if (e.code === 'KeyC' || e.code === 'ControlLeft') {
      player.isSneaking = !player.isSneaking;
    } else if (e.code === 'Space') {
      e.preventDefault();
      player.performShove();
    } else if (e.code === 'KeyE') {
      handlePrimaryInteractE();
    } else if (e.code === 'KeyB') {
      handleBarricadeB();
    } else if (e.code === 'KeyG') {
      handleCurtainG();
    } else if (e.code === 'KeyX') {
      handleDismantleX();
    } else if (e.code === 'KeyI' || e.code === 'Tab') {
      e.preventDefault();
      togglePanel('inventory-panel');
    } else if (e.code === 'KeyK') {
      togglePanel('crafting-panel');
    } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
      const idx = parseInt(e.code.replace('Digit', ''), 10) - 1;
      systems.activeSlot = idx;
      const slotItem = systems.hotbar[idx];
      if (slotItem) {
        const def = ITEM_DB[slotItem.id];
        if (def && (def.type === 'consumable' || def.type === 'medical')) {
          systems.useItem(slotItem.uid);
        }
      }
      renderHotbarUI();
      renderInventoryUI();
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function togglePanel(panelId) {
    const el = document.getElementById(panelId);
    if (!el) return;
    el.classList.toggle('hidden');
    renderInventoryUI();
    renderCraftingUI();
  }

  // Bind UI Buttons on DOMContentLoaded
  window.addEventListener('DOMContentLoaded', () => {
    initGame();
    animate();

    document.getElementById('btn-start-game').addEventListener('click', () => {
      window.soundFX.init();
      if (isGameOver) {
        initGame();
      }
      isPaused = false;
      document.getElementById('modal-overlay').classList.add('hidden');
    });

    document.getElementById('btn-toggle-inv').addEventListener('click', () => {
      togglePanel('inventory-panel');
    });

    document.getElementById('btn-toggle-craft').addEventListener('click', () => {
      togglePanel('crafting-panel');
    });

    document.getElementById('btn-flashlight').addEventListener('click', () => {
      systems.flashlightOn = !systems.flashlightOn;
      window.soundFX.playClick();
    });

    document.getElementById('btn-rotate-cam').addEventListener('click', () => {
      targetCameraAngle += Math.PI / 2;
    });

    document.getElementById('btn-take-all').addEventListener('click', () => {
      if (!openContainerRef) return;
      while (openContainerRef.loot.length > 0) {
        const entry = openContainerRef.loot.pop();
        systems.addItem(entry.id, entry.count);
      }
      window.soundFX.playClick();
      window.addLog(`Mengambil seluruh isi ${openContainerRef.name}.`, 'good');
      renderLootPanelUI(openContainerRef);
      renderHotbarUI();
      renderInventoryUI();
      renderCraftingUI();
    });
  });
})();
