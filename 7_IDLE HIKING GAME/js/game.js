// Core Game Logic & Realistic Expedition Idle Engine - Ekspedisi Puncak Nusantara
class HikingGame {
  constructor() {
    this.saveKey = 'indonesia_hiking_idle_save_v3';

    // Player Stats & Currencies
    this.rupiah = 5000;
    this.spirit = 0;
    this.goldenEdelweiss = 0;

    // Mountain Progression
    this.currentMountainIndex = 0;
    this.unlockedMountains = ['prau'];
    this.distance = 0; // meter
    this.elapsedTime = 0; // seconds spent hiking current mountain
    this.peakConquered = {};
    this.hasReachedCurrentSummit = false;

    // Active hiking & combo
    this.tapCombo = 0;
    this.lastTapTime = 0;
    this.comboMultiplier = 1.0;

    // Stamina system (0 to 100)
    this.stamina = 100;
    this.maxStamina = 100;
    this.isResting = false;

    // Character Customization
    this.customization = {
      jacketColor: '#ea580c',
      headwear: 'beanie',
      headwearColor: '#eab308',
      carrierColor: '#dc2626',
      pantsColor: '#1e293b'
    };

    // Active buffs / consumables
    this.activeBuffs = {
      coffee: 0,
      chocolate: 0,
      jalak: 0,
      herbal: 0
    };

    // Gear Upgrades (Real outdoor equipment focusing on stamina, comfort, and pack capacity)
    this.gear = {
      shoes: { level: 1, baseCost: 1000, costMult: 1.45, name: 'Sepatu Trekking Sol Vibram', desc: 'Sol cengkeram kuat, hemat stamina langkah 6%' },
      pole: { level: 1, baseCost: 2500, costMult: 1.5, name: 'Trekking Pole Karbon', desc: 'Tumpuan langkah stabil, tap +0.5m per klik' },
      carrier: { level: 0, baseCost: 7500, costMult: 1.55, name: 'Carrier 60L + Raincover', desc: 'Kapasitas logistik besar, pasif +Rp 35/dtk' },
      jacket: { level: 0, baseCost: 15000, costMult: 1.6, name: 'Jaket Windbreaker Gore-Tex', desc: 'Tahan angin dingin, stamina hemat 10%' },
      stove: { level: 0, baseCost: 35000, costMult: 1.65, name: 'Nesting & Kompor Windproof', desc: 'Masak air cepat di tenda, pulih tenaga +100%' },
      headlamp: { level: 0, baseCost: 80000, costMult: 1.7, name: 'Headlamp LED Terang', desc: 'Nembus kabut malam hari, kurangi lelah malam 30%' }
    };

    // Consumables inventory (Real Indonesian mountain treats)
    this.consumables = {
      coffee: { count: 1, cost: 5000, name: 'Kopi Jahe Gula Aren', desc: 'Sruput anget, dorongan langkah +40% selama 30 detik', duration: 30 },
      noodle: { count: 1, cost: 8000, name: 'Mie Rebus Telur Setengah Matang', desc: 'Kenikmatan hakiki, pulihkan 100% Tenaga seketika', duration: 0 },
      chocolate: { count: 0, cost: 15000, name: 'Cokelat Batang Energi', desc: 'Gula darah stabil, tenaga tanpa batas selama 20 detik', duration: 20 },
      herbal: { count: 0, cost: 25000, name: 'Madu Alami & Tolak Angin', desc: 'Badan enteng, Tap Power x2 selama 25 detik', duration: 25 }
    };

    // Stats tracking
    this.stats = {
      totalDistanceTraversed: 0,
      totalTaps: 0,
      totalRupiahEarned: 5000,
      summitsReached: 0
    };

    // Random Event state
    this.activeEvent = null;
    this.eventCooldown = 30;

    // Engine references
    this.parallax = null;
    this.lastFrameTime = performance.now();
    this.lastSaveTime = 0;
    this.lastCheckpointReachedIndex = -1;

    // Load saved data
    this.loadGame();
    window.game = this;
  }

  initEngine(parallaxInstance) {
    this.parallax = parallaxInstance;
    this.parallax.setMountain(this.getCurrentMountain());
    this.parallax.setCustomization(this.customization);
    this.updateUI();
  }

  getCurrentMountain() {
    return MOUNTAIN_DATA[this.currentMountainIndex] || MOUNTAIN_DATA[0];
  }

  // --- REALISTIC STANDARD HIKING SPEED ---
  // Calibrated so that idle walking matches the real-world average ascent time of the mountain
  getSpeedMps() {
    if (this.isResting) return 0;

    const m = this.getCurrentMountain();
    if (this.distance >= m.totalDistance) return 0; // Stop when at summit!

    // Base speed = totalDistance / (realHours * 3600 seconds)
    // E.g. Prau: 4500m / (3.5h * 3600s) = ~0.357 m/s (1.29 km/jam, standar nanjak manusia)
    const realSeconds = (m.realHours || 3.5) * 3600;
    let speed = m.totalDistance / realSeconds;

    // Small subtle gear shoes tuning (max +15% total, keeping it grounded and realistic)
    speed *= (1 + (this.gear.shoes.level - 1) * 0.015);

    // Controlled modest combo multiplier (caps at +20% maximum)
    speed *= (1 + (this.comboMultiplier - 1) * 0.2);

    // Buffs
    if (this.activeBuffs.coffee > 0) speed *= 1.4; // Kopi memberi dorongan +40%
    if (this.activeBuffs.jalak > 0) speed *= 1.35; // Dipandu burung jalak +35%

    // Weather impact
    if (this.parallax) {
      if (this.parallax.weather === 'rainy') {
        speed *= 0.8; // Hujan memperlambat langkah
      }
    }

    // Stamina exhaustion penalty (dengkul gemetar)
    if (this.stamina <= 0 && this.activeBuffs.chocolate <= 0) {
      speed *= 0.45;
    }

    return Math.max(0.08, speed);
  }

  getTapPower() {
    // Realistic stride tap: 1.5 meter per tap (a couple of firm strides)
    let tapMeters = 1.5;
    tapMeters += (this.gear.pole.level - 1) * 0.3;

    if (this.activeBuffs.herbal > 0) tapMeters *= 2.0;

    return parseFloat(tapMeters.toFixed(1));
  }

  getRupiahPerSecond() {
    let rps = 5;
    rps += this.gear.carrier.level * 35;
    rps *= (1 + this.goldenEdelweiss * 0.5);
    return rps;
  }

  // --- CORE GAME LOOP ---
  update(deltaMs) {
    const deltaSec = deltaMs / 1000;
    const m = this.getCurrentMountain();

    // 1. Process Active Buff Timers
    for (const key in this.activeBuffs) {
      if (this.activeBuffs[key] > 0) {
        this.activeBuffs[key] = Math.max(0, this.activeBuffs[key] - deltaSec);
      }
    }

    // 2. Combo decay
    if (Date.now() - this.lastTapTime > 3500) {
      this.tapCombo = Math.max(0, this.tapCombo - deltaSec * 3);
      this.comboMultiplier = 1.0 + Math.min(0.25, (this.tapCombo / 20) * 0.25);
    }

    // 3. Resting vs Hiking Progression
    if (this.isResting) {
      // Rapid Stamina recovery while resting in tent
      const restSpeed = 22 * (1 + this.gear.stove.level * 1.0);
      this.stamina = Math.min(this.maxStamina, this.stamina + restSpeed * deltaSec);
      // NOTE: NO AUTO-RESUME! Player decides manually when to resume walking!
    } else {
      const speed = this.getSpeedMps();
      const traveled = speed * deltaSec;

      if (this.distance < m.totalDistance) {
        this.distance = Math.min(m.totalDistance, this.distance + traveled);
        this.elapsedTime += deltaSec;
        this.stats.totalDistanceTraversed += traveled;

        // Realistic stamina drain
        if (this.activeBuffs.chocolate <= 0) {
          let drainRate = 0.85;
          if (this.gear.jacket.level > 0) drainRate *= 0.9;
          if (this.gear.shoes.level > 0) drainRate *= (1 - Math.min(0.3, this.gear.shoes.level * 0.05));

          this.stamina = Math.max(0, this.stamina - drainRate * deltaSec);
        }
      } else {
        // Reached Summit!
        this.checkSummitReached();
      }
    }

    // 4. Passive Income
    const earned = this.getRupiahPerSecond() * deltaSec;
    this.rupiah += earned;
    this.stats.totalRupiahEarned += earned;

    // 5. Check Checkpoints
    this.checkCheckpoints();

    // 6. Random Events Cooldown & Triggering
    this.eventCooldown -= deltaSec;
    if (this.eventCooldown <= 0) {
      this.eventCooldown = 45 + Math.random() * 35;
      this.triggerRandomEvent();
    }

    // 7. Update Parallax Visuals (Solo Hiker)
    if (this.parallax) {
      this.parallax.isResting = this.isResting;
      this.parallax.isSummit = (this.distance >= m.totalDistance);
      this.parallax.update(this.getSpeedMps(), deltaMs, this.distance, this.activeEvent, this.activeBuffs);
      this.parallax.render();
    }

    // 8. Live HUD update
    this.updateHUD();

    // 9. Auto Save check (every 10s)
    if (Date.now() - this.lastSaveTime > 10000) {
      this.saveGame();
      this.lastSaveTime = Date.now();
    }
  }

  // --- ACTIONS & INTERACTION ---
  handleTap() {
    if (typeof mountainAudio !== 'undefined') {
      mountainAudio.ensureContext();
      mountainAudio.playTap();
    }

    const m = this.getCurrentMountain();
    if (this.distance >= m.totalDistance) {
      const award = (this.currentMountainIndex + 1) * 2;
      this.showModalSummit(m, award);
      this.showToast('🏆 Puncak Nusantara telah diraih! Rayakan di puncak atau mulai ekspedisi baru!');
      return;
    }

    if (this.isResting) {
      this.toggleRest(false);
      return;
    }

    // Increase tap combo
    this.lastTapTime = Date.now();
    this.tapCombo = Math.min(30, this.tapCombo + 1);
    this.comboMultiplier = 1.0 + Math.min(0.25, (this.tapCombo / 15) * 0.25);

    // Advance realistic distance
    const tapPower = this.getTapPower();
    this.distance = Math.min(m.totalDistance, this.distance + tapPower);
    this.stats.totalDistanceTraversed += tapPower;
    this.stats.totalTaps++;

    // Extra rupiah and spirit
    const tapReward = Math.round(tapPower * 4.0 * (1 + this.goldenEdelweiss * 0.5));
    this.rupiah += tapReward;
    this.spirit += 1;
    this.stats.totalRupiahEarned += tapReward;

    // Visual feedback
    if (this.parallax) {
      this.parallax.spawnFloatingText(`+${tapPower}m`, null, null, '#38bdf8');
      if (Math.random() < 0.3) {
        this.parallax.spawnFloatingText(`+Rp ${tapReward.toLocaleString('id-ID')}`, null, null, '#4ade80');
      }
      const tapX = this.parallax.width * 0.38;
      this.parallax.addStepDust(tapX, this.parallax.getTrailY(tapX));
    }

    this.updateUI();
  }

  toggleRest(forceState = null) {
    if (typeof mountainAudio !== 'undefined') mountainAudio.ensureContext();
    this.isResting = (forceState !== null) ? forceState : !this.isResting;
    if (this.isResting) {
      if (typeof mountainAudio !== 'undefined') mountainAudio.playCooking();
      this.showToast('⛺ Buka tenda dome dulu... Duduk selonjoran sambil menyeduh kopi anget!');
    } else {
      this.showToast('🥾 Tenda dilipat rapi, ransel digendong lagi. Yuk gas nanjak!');
    }
    this.updateUI();
  }

  checkCheckpoints() {
    const m = this.getCurrentMountain();
    m.checkpoints.forEach((cp, idx) => {
      if (this.distance >= cp.distance && idx > this.lastCheckpointReachedIndex) {
        this.lastCheckpointReachedIndex = idx;
        if (idx > 0) {
          const reward = (idx * 5000) * (this.currentMountainIndex + 1);
          this.rupiah += reward;
          this.spirit += 15;
          if (typeof mountainAudio !== 'undefined') {
            mountainAudio.playFanfare();
            mountainAudio.playCoin();
          }
          this.showModalCheckpoint(cp, reward);
        }
      }
    });
  }

  checkSummitReached() {
    const m = this.getCurrentMountain();
    if (!this.hasReachedCurrentSummit) {
      this.hasReachedCurrentSummit = true;
      this.peakConquered[m.id] = (this.peakConquered[m.id] || 0) + 1;
      this.stats.summitsReached++;
      if (typeof mountainAudio !== 'undefined') mountainAudio.playFanfare();
      const edelweissAward = (this.currentMountainIndex + 1) * 2;
      this.goldenEdelweiss += edelweissAward;

      this.showModalSummit(m, edelweissAward);
      this.updateUI();
    }
  }

  // --- UPGRADES & PURCHASES ---
  buyGearUpgrade(gearKey) {
    const item = this.gear[gearKey];
    if (!item) return;

    const cost = Math.round(item.baseCost * Math.pow(item.costMult, item.level));
    if (this.rupiah >= cost) {
      this.rupiah -= cost;
      item.level++;
      if (typeof mountainAudio !== 'undefined') mountainAudio.playUpgrade();
      this.showToast(`Mantap! ${item.name} naik ke Level ${item.level}!`);
      this.updateUI();
      this.saveGame();
    } else {
      this.showToast(`Uang jajan kurang mas! Butuh Rp ${cost.toLocaleString('id-ID')}`);
    }
  }

  buyConsumable(itemKey) {
    const item = this.consumables[itemKey];
    if (!item) return;

    if (this.rupiah >= item.cost) {
      this.rupiah -= item.cost;
      item.count++;
      if (typeof mountainAudio !== 'undefined') mountainAudio.playCoin();
      this.showToast(`Beli ${item.name}! Masuk kantong ransel.`);
      this.updateUI();
      this.saveGame();
    } else {
      this.showToast(`Rupiah belum cukup! Butuh Rp ${item.cost.toLocaleString('id-ID')}`);
    }
  }

  useConsumable(itemKey) {
    const item = this.consumables[itemKey];
    if (!item || item.count <= 0) return;

    item.count--;
    if (typeof mountainAudio !== 'undefined') mountainAudio.playCooking();

    if (itemKey === 'coffee') {
      this.activeBuffs.coffee = 30;
      this.showToast('☕ Srupuuut! Kopi jahe hangat masuk tenggorokan! Langkah lebih enteng selama 30 dtk!');
    } else if (itemKey === 'noodle') {
      this.stamina = this.maxStamina;
      this.spirit += 10;
      this.showToast('🍜 Kenikmatan anak gunung! Kuah mie panas memulihkan 100% Tenaga seketika!');
    } else if (itemKey === 'chocolate') {
      this.activeBuffs.chocolate = 20;
      this.showToast('🍫 Manis & bertenaga! Tenaga tak terbatas selama 20 detik!');
    } else if (itemKey === 'herbal') {
      this.activeBuffs.herbal = 25;
      this.showToast('🌿 Badan hangat dan fit! Tap Power melesat 2x lipat!');
    }

    this.updateUI();
  }

  setCustomOption(category, value) {
    this.customization[category] = value;
    if (this.parallax) {
      this.parallax.setCustomization(this.customization);
    }
    this.renderCustomizationTab();
    this.saveGame();
  }

  // --- MOUNTAIN SWITCHING & PRESTIGE ---
  selectMountain(index) {
    const target = MOUNTAIN_DATA[index];
    if (!target) return;

    if (!this.unlockedMountains.includes(target.id)) {
      if (this.rupiah >= target.unlockCost) {
        this.rupiah -= target.unlockCost;
        this.unlockedMountains.push(target.id);
        if (typeof mountainAudio !== 'undefined') mountainAudio.playFanfare();
        this.showToast(`Alhamdulillah! Izin Simaksi ${target.name} resmi disetujui!`);
      } else {
        this.showToast(`Simaksi ${target.name} butuh biaya Rp ${target.unlockCost.toLocaleString('id-ID')}`);
        return;
      }
    }

    this.currentMountainIndex = index;
    this.distance = 0;
    this.elapsedTime = 0;
    this.lastCheckpointReachedIndex = -1;
    this.isResting = false;
    this.hasReachedCurrentSummit = false;

    if (this.parallax) {
      this.parallax.setMountain(target);
      this.parallax.scrollX = 0;
      this.parallax.currentDistance = 0;
    }

    this.showToast(`Bismillah, kita mulai pendakian di ${target.name}!`);
    this.updateUI();
    this.saveGame();
  }

  prestigeReincarnate() {
    const m = this.getCurrentMountain();
    if (this.distance < m.totalDistance) {
      this.showToast('Yuk selesaikan sampai puncak dulu sebelum buka ekspedisi baru!');
      return;
    }

    const bonusEdelweiss = (this.currentMountainIndex + 1) * 3;
    this.goldenEdelweiss += bonusEdelweiss;

    this.distance = 0;
    this.elapsedTime = 0;
    this.lastCheckpointReachedIndex = -1;
    this.hasReachedCurrentSummit = false;
    this.stamina = this.maxStamina;
    this.rupiah = 10000;

    if (typeof mountainAudio !== 'undefined') mountainAudio.playFanfare();
    this.showToast(`Ekspedisi sukses besar! Memperoleh +${bonusEdelweiss} 🌸 Bunga Edelweis Emas!`);
    this.updateUI();
    this.saveGame();
  }

  // --- RANDOM EVENTS ---
  triggerRandomEvent() {
    const events = [
      {
        title: 'Burung Jalak Lawu Muncul!',
        desc: 'Burung jalak gading penunjuk jalan melompat-lompat di depan setapakmu, memandu jalur paling aman.',
        btnText: 'Ikuti Jalak! (+Langkah Lancar)',
        action: () => {
          this.activeBuffs.jalak = 25;
          if (typeof mountainAudio !== 'undefined') mountainAudio.playBirdChirp();
          this.showToast('🕊️ Burung Jalak memandu jalur! Langkah makin gesit selama 25 detik!');
        }
      },
      {
        title: 'Papasan Rombongan Pendaki Ramah!',
        desc: 'Berpapasan sama rombongan turun: "Monggo mas, santai aja! Di depan ada spot istirahat adem."',
        btnText: 'Sapa & Terima Oleh-oleh',
        action: () => {
          this.consumables.coffee.count++;
          this.stamina = Math.min(this.maxStamina, this.stamina + 35);
          if (typeof mountainAudio !== 'undefined') mountainAudio.playCoin();
          this.showToast('🤝 Dikasih bekal kopi sachet dari pendaki lain! Tenaga terisi kembali!');
        }
      },
      {
        title: 'Kabut Merekah Menampilkan Lautan Awan!',
        desc: 'Angin sepoi-sepoi menyingkap kabut tebal, memperlihatkan samudra awan putih berkilau di bawah kaki.',
        btnText: 'Nikmati Laut Awan (+Uang & Semangat)',
        action: () => {
          const reward = 15000 * (this.currentMountainIndex + 1);
          this.rupiah += reward;
          this.spirit += 20;
          if (typeof mountainAudio !== 'undefined') mountainAudio.playFanfare();
          this.showToast(`🌅 Pemandangan laut awan magis! Hati tenang & dapat rezeki Rp ${reward.toLocaleString('id-ID')}!`);
        }
      },
      {
        title: 'Nemu Warung Pos Masih Buka!',
        desc: 'Warung bambu di pos masih mengepulkan asap. Ada gorengan pisang hangat dan teh melati panas.',
        btnText: 'Ganjal Perut di Warung',
        action: () => {
          this.stamina = this.maxStamina;
          this.showToast('🍌 Makan gorengan panas di warung pos! Tenaga pulih full 100%!');
        }
      }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    this.activeEvent = ev;
    this.showEventNotification(ev);
  }

  // --- TIME FORMATTING UTILS ---
  formatDuration(seconds) {
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  // --- UI BINDINGS & SYNCHRONIZATION ---
  updateHUD() {
    const m = this.getCurrentMountain();
    if (!m) return;

    const progressPct = Math.min(100, (this.distance / m.totalDistance) * 100);
    const currentElevation = Math.round(m.baseElevation + (m.elevation - m.baseElevation) * (this.distance / m.totalDistance));

    const mNameEl = document.getElementById('mountain-name');
    if (mNameEl && mNameEl.textContent !== m.name) mNameEl.textContent = m.name;

    const mRegEl = document.getElementById('mountain-region');
    if (mRegEl && !mRegEl.textContent.includes(m.trailName)) mRegEl.textContent = `${m.region} • ${m.trailName}`;

    const curElevEl = document.getElementById('current-elevation');
    if (curElevEl) curElevEl.textContent = `${currentElevation.toLocaleString('id-ID')} mdpl`;

    const tgtElevEl = document.getElementById('target-elevation');
    if (tgtElevEl) tgtElevEl.textContent = `${m.elevation.toLocaleString('id-ID')} mdpl`;

    // Realistic Expedition Timer Display
    const timeElapsedEl = document.getElementById('val-time-elapsed');
    if (timeElapsedEl) timeElapsedEl.textContent = this.formatDuration(this.elapsedTime);

    const timeEstEl = document.getElementById('val-time-est');
    if (timeEstEl) timeEstEl.textContent = this.formatDuration((m.realHours || 3.5) * 3600);

    const progFillEl = document.getElementById('progress-bar-fill');
    if (progFillEl) progFillEl.style.width = `${progressPct}%`;

    const progTextEl = document.getElementById('progress-distance-text');
    if (progTextEl) progTextEl.textContent = `${Math.round(this.distance)} / ${m.totalDistance} m (${progressPct.toFixed(1)}%)`;

    // Currencies
    const rpEl = document.getElementById('val-rupiah');
    if (rpEl) rpEl.textContent = `Rp ${Math.floor(this.rupiah).toLocaleString('id-ID')}`;

    const rpsEl = document.getElementById('val-rps');
    if (rpsEl) rpsEl.textContent = `+Rp ${Math.round(this.getRupiahPerSecond()).toLocaleString('id-ID')}/dtk`;

    const edelEl = document.getElementById('val-edelweiss');
    if (edelEl) edelEl.textContent = `${this.goldenEdelweiss} 🌸`;

    const spdMps = this.getSpeedMps();
    const spdKmh = (spdMps * 3.6).toFixed(1);
    const spdEl = document.getElementById('val-speed');
    if (spdEl) spdEl.textContent = `${spdMps.toFixed(2)} m/dtk (${spdKmh} km/j)`;

    // Stamina Bar
    const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
    const stamFillEl = document.getElementById('stamina-fill');
    if (stamFillEl) stamFillEl.style.width = `${staminaPct}%`;

    const stamTextEl = document.getElementById('stamina-text');
    if (stamTextEl) {
      if (this.isResting) {
        if (this.stamina >= this.maxStamina) {
          stamTextEl.textContent = `100 / 100 (Full Tenaga ✨)`;
        } else {
          stamTextEl.textContent = `${Math.round(this.stamina)} / ${this.maxStamina} (Rehat Tenda ⛺)`;
        }
      } else {
        stamTextEl.textContent = `${Math.round(this.stamina)} / ${this.maxStamina} ${this.stamina <= 0 ? '(Dengkul Lemas)' : ''}`;
      }
    }

    // Tap Combo indicator
    const comboEl = document.getElementById('combo-badge');
    if (comboEl) {
      if (this.tapCombo > 2) {
        comboEl.style.display = 'inline-block';
        comboEl.textContent = `Pace x${this.comboMultiplier.toFixed(2)}! 🔥`;
      } else {
        comboEl.style.display = 'none';
      }
    }

    // Rest button
    const restBtn = document.getElementById('btn-rest');
    if (restBtn) {
      if (this.isResting) {
        if (this.stamina >= this.maxStamina) {
          restBtn.innerHTML = '🥾 Tenaga Penuh! Gas Jalan Lagi';
          restBtn.className = 'btn btn-success pulse';
        } else {
          restBtn.innerHTML = '🥾 Lipat Tenda & Lanjut';
          restBtn.className = 'btn btn-accent';
        }
      } else {
        restBtn.innerHTML = '⛺ Buka Tenda (Napas Dulu)';
        restBtn.className = 'btn btn-secondary';
      }
    }

    // Main Tap Button state
    const tapBtn = document.getElementById('btn-tap');
    if (tapBtn) {
      if (this.distance >= m.totalDistance) {
        tapBtn.innerHTML = '<span>🏆 Rayakan Puncak! (Prestige)</span>';
        tapBtn.classList.add('btn-summit-glow');
      } else {
        tapBtn.innerHTML = `<span>🥾 Gas Nanjak! (+${this.getTapPower()}m)</span><span class="combo-badge" id="combo-badge" style="${this.tapCombo > 2 ? 'display: inline-block;' : 'display: none;'}">Pace x${this.comboMultiplier.toFixed(2)}! 🔥</span>`;
        tapBtn.classList.remove('btn-summit-glow');
      }
    }

    // Active Buffs HUD indicators
    const buffsContainer = document.getElementById('active-buffs-hud');
    if (buffsContainer) {
      const activeList = [];
      if (this.activeBuffs.coffee > 0) activeList.push(`☕ Kopi Jahe (${Math.ceil(this.activeBuffs.coffee)}s)`);
      if (this.activeBuffs.chocolate > 0) activeList.push(`🍫 Cokelat (${Math.ceil(this.activeBuffs.chocolate)}s)`);
      if (this.activeBuffs.jalak > 0) activeList.push(`🕊️ Jalak Lawu (${Math.ceil(this.activeBuffs.jalak)}s)`);
      if (this.activeBuffs.herbal > 0) activeList.push(`🌿 Madu Alami (${Math.ceil(this.activeBuffs.herbal)}s)`);

      if (activeList.length > 0) {
        buffsContainer.style.display = 'flex';
        buffsContainer.innerHTML = activeList.map(b => `<span class="buff-chip">${b}</span>`).join('');
      } else {
        buffsContainer.style.display = 'none';
        buffsContainer.innerHTML = '';
      }
    }

    // Trail Milestones on progress bar
    const milestonesEl = document.getElementById('progress-milestones');
    if (milestonesEl && (!milestonesEl.dataset.mountain || milestonesEl.dataset.mountain !== m.id)) {
      milestonesEl.dataset.mountain = m.id;
      let mHtml = '';
      m.checkpoints.forEach((cp, idx) => {
        const pct = Math.min(100, (cp.distance / m.totalDistance) * 100);
        const isPeak = (idx === m.checkpoints.length - 1);
        mHtml += `<div class="milestone-dot ${isPeak ? 'peak-dot' : ''}" style="left: ${pct}%;" title="${cp.name} (${cp.elevation} mdpl)"></div>`;
      });
      milestonesEl.innerHTML = mHtml;
    }

    // Live Stats tab sync
    const statDist = document.getElementById('stat-distance');
    if (statDist) statDist.textContent = `${Math.round(this.stats.totalDistanceTraversed).toLocaleString('id-ID')} meter`;
    const statTaps = document.getElementById('stat-taps');
    if (statTaps) statTaps.textContent = `${this.stats.totalTaps.toLocaleString('id-ID')} kali`;
    const statRp = document.getElementById('stat-rupiah');
    if (statRp) statRp.textContent = `Rp ${Math.round(this.stats.totalRupiahEarned).toLocaleString('id-ID')}`;
    const statSum = document.getElementById('stat-summits');
    if (statSum) statSum.textContent = `${this.stats.summitsReached} puncak`;
  }

  updateUI() {
    this.updateHUD();
    this.renderGearTab();
    this.renderConsumablesTab();
    this.renderMountainsTab();
    this.renderCustomizationTab();
  }

  renderGearTab() {
    const container = document.getElementById('tab-gear-content');
    if (!container) return;

    let html = '';
    for (const key in this.gear) {
      const g = this.gear[key];
      const cost = Math.round(g.baseCost * Math.pow(g.costMult, g.level));
      const canAfford = this.rupiah >= cost;
      html += `
        <div class="upgrade-card ${canAfford ? '' : 'locked'}">
          <div class="upgrade-info">
            <div class="upgrade-title">${g.name} <span class="badge">Lv. ${g.level}</span></div>
            <div class="upgrade-desc">${g.desc}</div>
          </div>
          <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-disabled'}" onclick="game.buyGearUpgrade('${key}')">
            Rp ${cost.toLocaleString('id-ID')}
          </button>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  renderConsumablesTab() {
    const container = document.getElementById('tab-consumables-content');
    if (!container) return;

    let html = '';
    for (const key in this.consumables) {
      const item = this.consumables[key];
      const canBuy = this.rupiah >= item.cost;
      const hasStock = item.count > 0;
      html += `
        <div class="consumable-card">
          <div class="consumable-info">
            <div class="consumable-title">${item.name} <span class="badge badge-stock">Ada: ${item.count}</span></div>
            <div class="consumable-desc">${item.desc}</div>
          </div>
          <div class="consumable-actions">
            <button class="btn btn-sm ${hasStock ? 'btn-accent' : 'btn-disabled'}" onclick="game.useConsumable('${key}')">
              Gunakan
            </button>
            <button class="btn btn-sm ${canBuy ? 'btn-secondary' : 'btn-disabled'}" onclick="game.buyConsumable('${key}')">
              Beli Rp ${item.cost.toLocaleString('id-ID')}
            </button>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  renderMountainsTab() {
    const container = document.getElementById('tab-mountains-content');
    if (!container) return;

    let html = '';
    MOUNTAIN_DATA.forEach((m, idx) => {
      const isUnlocked = this.unlockedMountains.includes(m.id);
      const isCurrent = this.currentMountainIndex === idx;
      const conqueredCount = this.peakConquered[m.id] || 0;
      const realDur = m.realHours ? `~${m.realHours} jam` : '~3.5 jam';

      html += `
        <div class="mountain-select-card ${isCurrent ? 'active' : ''}">
          <div class="mountain-header">
            <h4>${m.name} (${m.elevation} mdpl)</h4>
            ${isCurrent ? '<span class="badge badge-current">Sedang Didaki</span>' : ''}
            ${conqueredCount > 0 ? `<span class="badge badge-summit">🏆 Takluk ${conqueredCount}x</span>` : ''}
          </div>
          <p class="mountain-desc">${m.region} • ${m.trailName} • ⏱️ Estimasi Waktu Nyata: <strong>${realDur}</strong></p>
          <p class="mountain-lore">${m.description}</p>
          <div class="mountain-action">
            ${isUnlocked ? (
              isCurrent ? '<button class="btn btn-sm btn-disabled">Sedang Di Sini</button>' :
              `<button class="btn btn-sm btn-primary" onclick="game.selectMountain(${idx})">Pindah Gunung</button>`
            ) : (
              `<button class="btn btn-sm btn-warning" onclick="game.selectMountain(${idx})">Buka Simaksi (Rp ${m.unlockCost.toLocaleString('id-ID')})</button>`
            )}
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  renderCustomizationTab() {
    const container = document.getElementById('tab-custom-content');
    if (!container) return;

    const c = this.customization;

    const jacketOptions = [
      { name: 'Oranye Gunung', color: '#ea580c' },
      { name: 'Merah Maroon', color: '#991b1b' },
      { name: 'Biru Navy', color: '#1d4ed8' },
      { name: 'Hijau Rimba', color: '#15803d' },
      { name: 'Kuning Kunyit', color: '#eab308' },
      { name: 'Hitam Cadas', color: '#1e293b' }
    ];

    const headwearTypes = [
      { id: 'beanie', name: 'Kupluk Hangat' },
      { id: 'bucket', name: 'Topi Rimba' },
      { id: 'bandana', name: 'Buff / Bandana' },
      { id: 'headlamp', name: 'Headlamp Malam' }
    ];

    const headwearColors = [
      { name: 'Kuning', color: '#eab308' },
      { name: 'Merah', color: '#dc2626' },
      { name: 'Biru', color: '#2563eb' },
      { name: 'Hijau', color: '#16a34a' },
      { name: 'Hitam', color: '#0f172a' }
    ];

    const carrierColors = [
      { name: 'Merah Crimson', color: '#dc2626' },
      { name: 'Biru Kobalt', color: '#0284c7' },
      { name: 'Hijau Lumut', color: '#3f6212' },
      { name: 'Ungu Outdoor', color: '#7e22ce' },
      { name: 'Hitam Karbon', color: '#0f172a' }
    ];

    const pantsColors = [
      { name: 'Hitam Cadas', color: '#1e293b' },
      { name: 'Abu Khaki', color: '#64748b' },
      { name: 'Cokelat Tanah', color: '#54361e' },
      { name: 'Hijau Army', color: '#1e3a2b' }
    ];

    let html = `
      <div class="custom-card">
        <h4 class="custom-group-title">🧥 Jaket Windbreaker</h4>
        <div class="custom-swatch-group">
          ${jacketOptions.map(opt => `
            <button class="color-swatch-btn ${c.jacketColor === opt.color ? 'active' : ''}" 
                    style="background: ${opt.color};" 
                    title="${opt.name}" 
                    onclick="game.setCustomOption('jacketColor', '${opt.color}')">
              ${c.jacketColor === opt.color ? '✓' : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="custom-card">
        <h4 class="custom-group-title">🧢 Model Penutup Kepala</h4>
        <div class="custom-pill-group">
          ${headwearTypes.map(h => `
            <button class="style-option-btn ${c.headwear === h.id ? 'active' : ''}" 
                    onclick="game.setCustomOption('headwear', '${h.id}')">
              ${h.name}
            </button>
          `).join('')}
        </div>
        <div class="custom-swatch-group" style="margin-top: 8px;">
          ${headwearColors.map(opt => `
            <button class="color-swatch-btn ${c.headwearColor === opt.color ? 'active' : ''}" 
                    style="background: ${opt.color};" 
                    title="${opt.name}" 
                    onclick="game.setCustomOption('headwearColor', '${opt.color}')">
              ${c.headwearColor === opt.color ? '✓' : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="custom-card">
        <h4 class="custom-group-title">🎒 Tas Carrier 60L</h4>
        <div class="custom-swatch-group">
          ${carrierColors.map(opt => `
            <button class="color-swatch-btn ${c.carrierColor === opt.color ? 'active' : ''}" 
                    style="background: ${opt.color};" 
                    title="${opt.name}" 
                    onclick="game.setCustomOption('carrierColor', '${opt.color}')">
              ${c.carrierColor === opt.color ? '✓' : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="custom-card">
        <h4 class="custom-group-title">👖 Celana Quickdry</h4>
        <div class="custom-swatch-group">
          ${pantsColors.map(opt => `
            <button class="color-swatch-btn ${c.pantsColor === opt.color ? 'active' : ''}" 
                    style="background: ${opt.color};" 
                    title="${opt.name}" 
                    onclick="game.setCustomOption('pantsColor', '${opt.color}')">
              ${c.pantsColor === opt.color ? '✓' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // --- MODALS & NOTIFICATIONS ---
  showToast(message) {
    const toast = document.getElementById('game-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  showEventNotification(ev) {
    const banner = document.getElementById('event-banner');
    if (!banner) return;
    banner.innerHTML = `
      <div class="event-content">
        <strong>✨ ${ev.title}</strong>
        <p>${ev.desc}</p>
        <button class="btn btn-xs btn-accent" onclick="game.claimEvent()">${ev.btnText || 'Ambil Berkah!'}</button>
      </div>
    `;
    banner.style.display = 'block';
  }

  claimEvent() {
    if (this.activeEvent && this.activeEvent.action) {
      this.activeEvent.action();
    }
    const banner = document.getElementById('event-banner');
    if (banner) banner.style.display = 'none';
    this.activeEvent = null;
  }

  showModalCheckpoint(cp, reward) {
    const modal = document.getElementById('modal-checkpoint');
    if (!modal) return;
    document.getElementById('modal-cp-title').textContent = `Tiba di ${cp.name}!`;
    document.getElementById('modal-cp-elevation').textContent = `Ketinggian: ${cp.elevation} mdpl`;
    document.getElementById('modal-cp-desc').textContent = cp.desc;
    document.getElementById('modal-cp-reward').textContent = `+Rp ${reward.toLocaleString('id-ID')} & +15 Semangat`;
    modal.classList.add('active');
  }

  closeModalCheckpoint() {
    const modal = document.getElementById('modal-checkpoint');
    if (modal) modal.classList.remove('active');
  }

  showModalSummit(mountain, edelweiss) {
    const modal = document.getElementById('modal-summit');
    if (!modal) return;
    document.getElementById('modal-summit-title').textContent = `ALHAMDULILLAH! PUNCAK ${mountain.name.toUpperCase()} TERCAPAI!`;
    document.getElementById('modal-summit-height').textContent = `${mountain.elevation} mdpl - ${mountain.peakName}`;
    document.getElementById('modal-summit-edelweiss').textContent = `+${edelweiss} 🌸 Bunga Edelweis Emas (Bonus Permanen!)`;
    modal.classList.add('active');
  }

  closeModalSummit() {
    const modal = document.getElementById('modal-summit');
    if (modal) modal.classList.remove('active');
  }

  // --- SAVE & LOAD SYSTEM ---
  saveGame() {
    const data = {
      rupiah: this.rupiah,
      spirit: this.spirit,
      goldenEdelweiss: this.goldenEdelweiss,
      currentMountainIndex: this.currentMountainIndex,
      unlockedMountains: this.unlockedMountains,
      distance: this.distance,
      elapsedTime: this.elapsedTime,
      peakConquered: this.peakConquered,
      stamina: this.stamina,
      gear: this.gear,
      consumables: this.consumables,
      customization: this.customization,
      stats: this.stats,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan game ke localStorage:', e);
    }
  }

  loadGame() {
    try {
      let raw = localStorage.getItem(this.saveKey);
      if (!raw) raw = localStorage.getItem('indonesia_hiking_idle_save_v2');
      if (!raw) raw = localStorage.getItem('indonesia_hiking_idle_save_v1');
      if (!raw) return;
      const data = JSON.parse(raw);

      this.rupiah = data.rupiah || 5000;
      this.spirit = data.spirit || 0;
      this.goldenEdelweiss = data.goldenEdelweiss || 0;
      this.currentMountainIndex = data.currentMountainIndex || 0;
      this.unlockedMountains = data.unlockedMountains || ['prau'];
      this.distance = data.distance || 0;
      this.elapsedTime = data.elapsedTime || 0;
      this.peakConquered = data.peakConquered || {};
      this.stamina = data.stamina !== undefined ? data.stamina : 100;

      if (data.gear) {
        for (const k in data.gear) {
          if (this.gear[k]) this.gear[k].level = data.gear[k].level || 0;
        }
      }

      if (data.consumables) {
        for (const k in data.consumables) {
          if (this.consumables[k]) this.consumables[k].count = data.consumables[k].count || 0;
        }
      }

      if (data.customization) {
        this.customization = Object.assign(this.customization, data.customization);
      }

      if (data.stats) {
        this.stats = Object.assign(this.stats, data.stats);
      }

      // Offline Earnings & Progress calculation based on realistic speed
      if (data.savedAt) {
        const offlineSec = Math.min(8 * 3600, Math.max(0, (Date.now() - data.savedAt) / 1000));
        if (offlineSec > 10) {
          const offlineRupiah = Math.floor(this.getRupiahPerSecond() * offlineSec * 0.7);
          this.rupiah += offlineRupiah;
          this.stats.totalRupiahEarned += offlineRupiah;

          // Also progress realistic distance if not resting
          const m = this.getCurrentMountain();
          const realSeconds = (m.realHours || 3.5) * 3600;
          const realisticMps = m.totalDistance / realSeconds;
          const offlineDist = Math.min(m.totalDistance - this.distance, realisticMps * offlineSec * 0.7);

          if (offlineDist > 0) {
            this.distance += offlineDist;
            this.elapsedTime += offlineSec * 0.7;
            this.stats.totalDistanceTraversed += offlineDist;
          }

          setTimeout(() => {
            this.showToast(`Selamat datang kembali! Selama offline, langkahmu bertambah +${Math.round(offlineDist)}m dan mengumpulkan Rp ${offlineRupiah.toLocaleString('id-ID')}!`);
          }, 1200);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat save game:', e);
    }
  }

  resetGame() {
    if (confirm('Yakin ingin mereset seluruh progres pendakian?')) {
      localStorage.removeItem(this.saveKey);
      localStorage.removeItem('indonesia_hiking_idle_save_v2');
      localStorage.removeItem('indonesia_hiking_idle_save_v1');
      location.reload();
    }
  }
}
