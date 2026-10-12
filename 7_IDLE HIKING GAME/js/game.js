// Core Game Logic & Idle Engine
class HikingGame {
  constructor() {
    this.saveKey = 'indonesia_hiking_idle_save_v1';

    // Player Stats & Currencies
    this.rupiah = 5000; // Starter money Rp 5.000
    this.spirit = 0; // Hiking Spirit
    this.goldenEdelweiss = 0; // Prestige currency

    // Mountain Progression
    this.currentMountainIndex = 0;
    this.unlockedMountains = ['prau'];
    this.distance = 0; // in meters for current mountain
    this.peakConquered = {}; // mountainId: times conquered
    this.hasReachedCurrentSummit = false;

    // Active hiking & combo
    this.tapCombo = 0;
    this.lastTapTime = 0;
    this.comboMultiplier = 1.0;

    // Stamina system (0 to 100)
    this.stamina = 100;
    this.maxStamina = 100;
    this.isResting = false;

    // Active buffs / consumables
    this.activeBuffs = {
      coffee: 0, // seconds left
      chocolate: 0,
      jalak: 0,
      herbal: 0
    };

    // Gear Upgrades
    this.gear = {
      shoes: { level: 1, baseCost: 1000, costMult: 1.45, name: 'Sepatu Trekking', desc: 'Kecepatan jalan +1.0 m/s' },
      pole: { level: 1, baseCost: 2500, costMult: 1.5, name: 'Trekking Pole', desc: 'Power tap +6 meter per klik' },
      carrier: { level: 0, baseCost: 7500, costMult: 1.55, name: 'Tas Carrier 60L', desc: 'Pendapatan pasif +Rp 40/dtk' },
      jacket: { level: 0, baseCost: 15000, costMult: 1.6, name: 'Jaket Windbreaker', desc: 'Stamina lebih hemat 10%' },
      stove: { level: 0, baseCost: 35000, costMult: 1.65, name: 'Nesting & Kompor Gas', desc: 'Pemulihan tenda +100%' },
      headlamp: { level: 0, baseCost: 80000, costMult: 1.7, name: 'Headlamp LED', desc: 'Kecepatan malam hari +40%' }
    };

    // Party Members (Recruited Companions)
    this.party = [
      { id: 'porter', type: 'porter', name: 'Porter Lokal (Pak Slamet)', count: 0, baseCost: 12000, costMult: 1.65, desc: '+2.5 m/s & +Rp 60/dtk' },
      { id: 'friend', type: 'friend', name: 'Sahabat Pendaki Santai', count: 0, baseCost: 25000, costMult: 1.7, desc: '+Rp 200/dtk (Konten Medsos)' },
      { id: 'guide', type: 'guide', name: 'Ranger Taman Nasional', count: 0, baseCost: 70000, costMult: 1.75, desc: '+5.0 m/s & -20% Stamina use' },
      { id: 'photographer', type: 'photographer', name: 'Fotografer Alam Liar', count: 0, baseCost: 180000, costMult: 1.8, desc: '+Rp 650/dtk & Bonus Foto 2x' },
      { id: 'medic', type: 'medic', name: 'Dokter Relawan', count: 0, baseCost: 450000, costMult: 1.85, desc: '+150% Stamina Regen & Anti Dingin' }
    ];

    // Consumables inventory
    this.consumables = {
      coffee: { count: 1, cost: 5000, name: 'Kopi Jahe Hangat', desc: 'Kecepatan x2 selama 30 detik', duration: 30 },
      noodle: { count: 1, cost: 8000, name: 'Mie Instan Telur Gunung', desc: 'Pulihkan 100% Stamina seketika', duration: 0 },
      chocolate: { count: 0, cost: 15000, name: 'Cokelat Energi', desc: 'Stamina tanpa batas selama 20 detik', duration: 20 },
      herbal: { count: 0, cost: 25000, name: 'Madu & Tolak Angin', desc: 'Tap Power x3 selama 25 detik', duration: 25 }
    };

    // Stats tracking
    this.stats = {
      totalDistanceTraversed: 0,
      totalTaps: 0,
      totalRupiahEarned: 5000,
      summitsReached: 0,
      photosTaken: 0
    };

    // Random Event state
    this.activeEvent = null;
    this.eventCooldown = 20;

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
    this.updateUI();
  }

  getCurrentMountain() {
    return MOUNTAIN_DATA[this.currentMountainIndex] || MOUNTAIN_DATA[0];
  }

  getSpeedMps() {
    if (this.isResting) return 0;

    const m = this.getCurrentMountain();
    // Stop ground movement when standing at the summit crest
    if (this.distance >= m.totalDistance) return 0;

    let speed = 1.2; // Base speed: 1.2 m/s

    // Gear shoes bonus
    speed += (this.gear.shoes.level - 1) * 0.9;

    // Party bonuses
    this.party.forEach(p => {
      if (p.id === 'porter') speed += p.count * 2.5;
      if (p.id === 'guide') speed += p.count * 5.0;
    });

    // Combo multiplier
    speed *= this.comboMultiplier;

    // Buff multipliers
    if (this.activeBuffs.coffee > 0) speed *= 2.0;
    if (this.activeBuffs.jalak > 0) speed *= 1.5;

    // Weather impact
    if (this.parallax) {
      if (this.parallax.weather === 'rainy' && this.party.find(p => p.id === 'medic')?.count === 0) {
        speed *= 0.75; // Rain slows down unless medic is recruited
      }
      // Night check
      const t = this.parallax.timeOfDay;
      if ((t < 0.25 || t > 0.75) && this.gear.headlamp.level > 0) {
        speed *= (1 + this.gear.headlamp.level * 0.4);
      }
    }

    // Stamina exhaustion penalty
    if (this.stamina <= 0 && this.activeBuffs.chocolate <= 0) {
      speed *= 0.35; // Kelelahan memperlambat langkah
    }

    // Prestige bonus (+25% per Golden Edelweiss)
    speed *= (1 + this.goldenEdelweiss * 0.25);

    return Math.max(0.1, speed);
  }

  getTapPower() {
    let tapMeters = 8; // Base 8 meters per tap
    tapMeters += (this.gear.pole.level - 1) * 6;

    if (this.activeBuffs.herbal > 0) tapMeters *= 3.0;
    tapMeters *= (1 + this.goldenEdelweiss * 0.25);

    return Math.round(tapMeters);
  }

  getRupiahPerSecond() {
    let rps = 5; // Base passive sponsor
    rps += this.gear.carrier.level * 40;

    this.party.forEach(p => {
      if (p.id === 'porter') rps += p.count * 60;
      if (p.id === 'friend') rps += p.count * 200;
      if (p.id === 'photographer') rps += p.count * 650;
    });

    // Prestige multiplier (+50% per Golden Edelweiss)
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
      this.comboMultiplier = 1.0 + Math.min(1.5, (this.tapCombo / 20) * 1.5);
    }

    // 3. Resting / Camp Mode or Hiking Progression
    if (this.isResting) {
      // Rapid Stamina recovery
      const restSpeed = 18 * (1 + this.gear.stove.level * 1.0);
      this.stamina = Math.min(this.maxStamina, this.stamina + restSpeed * deltaSec);
      if (this.stamina >= this.maxStamina) {
        // Auto resume after full recovery
        this.toggleRest(false);
      }
    } else {
      // Normal hiking
      const speed = this.getSpeedMps();
      const traveled = speed * deltaSec;

      if (this.distance < m.totalDistance) {
        this.distance = Math.min(m.totalDistance, this.distance + traveled);
        this.stats.totalDistanceTraversed += traveled;

        // Stamina consumption
        if (this.activeBuffs.chocolate <= 0) {
          let drainRate = 1.5;
          if (this.gear.jacket.level > 0) drainRate *= 0.9;
          const guideCount = this.party.find(p => p.id === 'guide')?.count || 0;
          drainRate *= Math.max(0.4, 1 - guideCount * 0.15);

          this.stamina = Math.max(0, this.stamina - drainRate * deltaSec);
        }

        // Natural passive stamina regen from medic/porter
        const medicCount = this.party.find(p => p.id === 'medic')?.count || 0;
        const porterCount = this.party.find(p => p.id === 'porter')?.count || 0;
        const naturalRegen = (medicCount * 2.0 + porterCount * 0.4) * deltaSec;
        this.stamina = Math.min(this.maxStamina, this.stamina + naturalRegen);
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
      this.eventCooldown = 40 + Math.random() * 30;
      this.triggerRandomEvent();
    }

    // 7. Update Parallax Visuals
    if (this.parallax) {
      this.parallax.isResting = this.isResting;
      this.parallax.isSummit = (this.distance >= m.totalDistance);
      this.parallax.update(this.getSpeedMps(), deltaMs);
      this.parallax.render(this.party);
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
    mountainAudio.ensureContext();
    mountainAudio.playTap();

    const m = this.getCurrentMountain();
    if (this.distance >= m.totalDistance) {
      const award = (this.currentMountainIndex + 1) * 2;
      this.showModalSummit(m, award);
      this.showToast('🏆 Puncak telah ditaklukkan! Ambil foto panorama atau lakukan Prestige!');
      return;
    }

    if (this.isResting) {
      // Tap while resting gently wakes up
      this.toggleRest(false);
      return;
    }

    // Increase tap combo
    this.lastTapTime = Date.now();
    this.tapCombo = Math.min(40, this.tapCombo + 1);
    this.comboMultiplier = 1.0 + Math.min(1.5, (this.tapCombo / 15) * 1.5);

    // Advance distance
    const tapPower = this.getTapPower();
    this.distance = Math.min(m.totalDistance, this.distance + tapPower);
    this.stats.totalDistanceTraversed += tapPower;
    this.stats.totalTaps++;

    // Extra rupiah and spirit from active effort
    const tapReward = Math.round(tapPower * 2.5 * (1 + this.goldenEdelweiss * 0.5));
    this.rupiah += tapReward;
    this.spirit += 1;
    this.stats.totalRupiahEarned += tapReward;

    // Visual feedback on sloped trail
    if (this.parallax) {
      this.parallax.spawnFloatingText(`+${tapPower}m!`, null, null, '#38bdf8');
      if (Math.random() < 0.4) {
        this.parallax.spawnFloatingText(`+Rp ${tapReward.toLocaleString('id-ID')}`, null, null, '#4ade80');
      }
      const tapX = this.parallax.width * 0.38;
      this.parallax.addStepDust(tapX, this.parallax.getTrailY(tapX));
    }

    this.updateUI();
  }

  toggleRest(forceState = null) {
    mountainAudio.ensureContext();
    this.isResting = (forceState !== null) ? forceState : !this.isResting;
    if (this.isResting) {
      mountainAudio.playCooking();
      this.showToast('🏕️ Membuka tenda di pos istirahat... Menyeduh kopi hangat!');
    } else {
      this.showToast('🥾 Melipat tenda dan melanjutkan pendakian!');
    }
    this.updateUI();
  }

  checkCheckpoints() {
    const m = this.getCurrentMountain();
    m.checkpoints.forEach((cp, idx) => {
      if (this.distance >= cp.distance && idx > this.lastCheckpointReachedIndex) {
        this.lastCheckpointReachedIndex = idx;
        if (idx > 0) {
          // Checkpoint reached reward
          const reward = (idx * 5000) * (this.currentMountainIndex + 1);
          this.rupiah += reward;
          this.spirit += 15;
          mountainAudio.playFanfare();
          mountainAudio.playCoin();
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
      mountainAudio.playFanfare();
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
      mountainAudio.playUpgrade();
      this.showToast(`Berhasil upgrade ${item.name} ke Level ${item.level}!`);
      this.updateUI();
      this.saveGame();
    } else {
      this.showToast(`Rupiah belum cukup! Butuh Rp ${cost.toLocaleString('id-ID')}`);
    }
  }

  recruitParty(partyId) {
    const member = this.party.find(p => p.id === partyId);
    if (!member) return;

    const cost = Math.round(member.baseCost * Math.pow(member.costMult, member.count));
    if (this.rupiah >= cost) {
      this.rupiah -= cost;
      member.count++;
      mountainAudio.playUpgrade();
      this.showToast(`Merekrut ${member.name}! Tim makin solid!`);
      this.updateUI();
      this.saveGame();
    } else {
      this.showToast(`Rupiah belum cukup! Butuh Rp ${cost.toLocaleString('id-ID')}`);
    }
  }

  buyConsumable(itemKey) {
    const item = this.consumables[itemKey];
    if (!item) return;

    if (this.rupiah >= item.cost) {
      this.rupiah -= item.cost;
      item.count++;
      mountainAudio.playCoin();
      this.showToast(`Membeli ${item.name}! Masuk kantong bekal.`);
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
    mountainAudio.playCooking();

    if (itemKey === 'coffee') {
      this.activeBuffs.coffee = 30;
      this.showToast('☕ Slurrp! Kopi jahe hangat diminum! Kecepatan mendaki 2x lipat!');
    } else if (itemKey === 'noodle') {
      this.stamina = this.maxStamina;
      this.spirit += 10;
      this.showToast('🍜 Mantap! Mie rebus hangat di puncak memulihkan 100% Stamina!');
    } else if (itemKey === 'chocolate') {
      this.activeBuffs.chocolate = 20;
      this.showToast('🍫 Manis & bertenaga! Stamina tak terbatas selama 20 detik!');
    } else if (itemKey === 'herbal') {
      this.activeBuffs.herbal = 25;
      this.showToast('🌿 Badan hangat dan fit! Tap Power melesat 3x lipat!');
    }

    this.updateUI();
  }

  // --- MOUNTAIN SWITCHING & PRESTIGE ---

  selectMountain(index) {
    const target = MOUNTAIN_DATA[index];
    if (!target) return;

    if (!this.unlockedMountains.includes(target.id)) {
      // Attempt to unlock
      if (this.rupiah >= target.unlockCost) {
        this.rupiah -= target.unlockCost;
        this.unlockedMountains.push(target.id);
        mountainAudio.playFanfare();
        this.showToast(`Izin Simaksi ${target.name} resmi dibuka!`);
      } else {
        this.showToast(`Biaya simaksi ${target.name} butuh Rp ${target.unlockCost.toLocaleString('id-ID')}`);
        return;
      }
    }

    // Switch mountain
    this.currentMountainIndex = index;
    this.distance = 0;
    this.lastCheckpointReachedIndex = -1;
    this.isResting = false;
    this.hasReachedCurrentSummit = false;

    if (this.parallax) {
      this.parallax.setMountain(target);
      this.parallax.scrollX = 0;
      this.parallax.worldDistance = 0;
    }

    this.showToast(`Memulai pendakian baru di ${target.name}!`);
    this.updateUI();
    this.saveGame();
  }

  prestigeReincarnate() {
    const m = this.getCurrentMountain();
    if (this.distance < m.totalDistance) {
      this.showToast('Capai puncak terlebih dahulu untuk menyelesaikan ekspedisi!');
      return;
    }

    // Bonus edelweiss
    const bonusEdelweiss = (this.currentMountainIndex + 1) * 3;
    this.goldenEdelweiss += bonusEdelweiss;

    // Reset current mountain distance & base currencies but keep permanent Edelweiss & unlocks
    this.distance = 0;
    this.lastCheckpointReachedIndex = -1;
    this.hasReachedCurrentSummit = false;
    this.stamina = this.maxStamina;
    this.rupiah = 10000;

    mountainAudio.playFanfare();
    this.showToast(`Ekspedisi selesai! Memperoleh +${bonusEdelweiss} 🌸 Edelweis Emas!`);
    this.updateUI();
    this.saveGame();
  }

  takeScenicPhoto() {
    mountainAudio.ensureContext();
    mountainAudio.playCamera();
    this.stats.photosTaken++;

    const m = this.getCurrentMountain();
    let photoReward = Math.round((2500 + Math.random() * 7500) * (this.currentMountainIndex + 1));
    const photoPhotographer = this.party.find(p => p.id === 'photographer')?.count || 0;
    if (photoPhotographer > 0) photoReward *= (1 + photoPhotographer);

    this.rupiah += photoReward;
    this.stats.totalRupiahEarned += photoReward;

    if (this.parallax) {
      this.parallax.spawnFloatingText(`📸 +Rp ${photoReward.toLocaleString('id-ID')}`, null, null, '#facc15');
    }
    this.showToast(`📸 Jepret! Foto panorama alam laku terjual Rp ${photoReward.toLocaleString('id-ID')}!`);
    this.updateUI();
  }

  // --- RANDOM EVENTS ---

  triggerRandomEvent() {
    const events = [
      {
        title: 'Burung Jalak Lawu Muncul!',
        desc: 'Burung jalak gading penunjuk jalan setia terbang melompat di depan setapakmu!',
        action: () => {
          this.activeBuffs.jalak = 25;
          mountainAudio.playBirdChirp();
          this.showToast('🕊️ Burung Jalak memandu jalan! Kecepatan mendaki +50% selama 25 detik!');
        }
      },
      {
        title: 'Rombongan Pendaki Ramah!',
        desc: 'Berpapasan dengan rombongan ramah yang menyapa "Mari mas, monggo ngopi bareng!" dan membagikan bekal.',
        action: () => {
          this.consumables.coffee.count++;
          this.stamina = Math.min(this.maxStamina, this.stamina + 35);
          mountainAudio.playCoin();
          this.showToast('🤝 Diberi segelas kopi panas dari pendaki lain! Stamina terisi!');
        }
      },
      {
        title: 'Kabut Merekah Menampilkan Lautan Awan!',
        desc: 'Momen magis saat angin menguak kabut tebal dan memperlihatkan samudra awan di bawah kaki.',
        action: () => {
          const reward = 15000 * (this.currentMountainIndex + 1);
          this.rupiah += reward;
          mountainAudio.playCamera();
          this.showToast(`🌅 Pemandangan laut awan viral! Dapat saweran vlog Rp ${reward.toLocaleString('id-ID')}!`);
        }
      }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    this.activeEvent = ev;
    this.showEventNotification(ev);
  }

  // --- UI BINDINGS & SYNCHRONIZATION ---

  updateHUD() {
    const m = this.getCurrentMountain();
    if (!m) return;

    // Top Stat Bar
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

    const spdEl = document.getElementById('val-speed');
    if (spdEl) spdEl.textContent = `${this.getSpeedMps().toFixed(1)} m/dtk`;

    // Stamina Bar
    const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
    const stamFillEl = document.getElementById('stamina-fill');
    if (stamFillEl) stamFillEl.style.width = `${staminaPct}%`;

    const stamTextEl = document.getElementById('stamina-text');
    if (stamTextEl) stamTextEl.textContent = `${Math.round(this.stamina)} / ${this.maxStamina} ${this.stamina <= 0 ? '(LELAH)' : ''}`;

    // Tap Combo indicator
    const comboEl = document.getElementById('combo-badge');
    if (comboEl) {
      if (this.tapCombo > 2) {
        comboEl.style.display = 'inline-block';
        comboEl.textContent = `Combo x${this.comboMultiplier.toFixed(1)}! 🔥`;
      } else {
        comboEl.style.display = 'none';
      }
    }

    // Toggle rest button label & styling
    const restBtn = document.getElementById('btn-rest');
    if (restBtn) {
      const restText = this.isResting ? '🥾 Lanjut Mendaki' : '⛺ Buka Tenda (Istirahat)';
      if (restBtn.textContent.trim() !== restText) {
        restBtn.innerHTML = restText;
        restBtn.className = this.isResting ? 'btn btn-accent pulse' : 'btn btn-secondary';
      }
    }

    // Main Tap Button state when at summit vs climbing
    const tapBtn = document.getElementById('btn-tap');
    if (tapBtn) {
      if (this.distance >= m.totalDistance) {
        tapBtn.innerHTML = '<span>🏆 Rayakan Puncak! (Prestige)</span>';
        tapBtn.classList.add('btn-summit-glow');
      } else {
        tapBtn.innerHTML = `<span>🥾 Langkah Mantap!</span><span class="combo-badge" id="combo-badge" style="${this.tapCombo > 2 ? 'display: inline-block;' : 'display: none;'}">Combo x${this.comboMultiplier.toFixed(1)}! 🔥</span>`;
        tapBtn.classList.remove('btn-summit-glow');
      }
    }

    // Active Buffs HUD indicators
    const buffsContainer = document.getElementById('active-buffs-hud');
    if (buffsContainer) {
      const activeList = [];
      if (this.activeBuffs.coffee > 0) activeList.push(`☕ Kopi (${Math.ceil(this.activeBuffs.coffee)}s)`);
      if (this.activeBuffs.chocolate > 0) activeList.push(`🍫 Cokelat (${Math.ceil(this.activeBuffs.chocolate)}s)`);
      if (this.activeBuffs.jalak > 0) activeList.push(`🕊️ Jalak (${Math.ceil(this.activeBuffs.jalak)}s)`);
      if (this.activeBuffs.herbal > 0) activeList.push(`🌿 Madu (${Math.ceil(this.activeBuffs.herbal)}s)`);

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
    const statPho = document.getElementById('stat-photos');
    if (statPho) statPho.textContent = `${this.stats.photosTaken} foto`;
  }

  updateUI() {
    this.updateHUD();

    // Update gear list in DOM
    this.renderGearTab();

    // Update party list in DOM
    this.renderPartyTab();

    // Update consumables tab
    this.renderConsumablesTab();

    // Update mountain map tab
    this.renderMountainsTab();
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

  renderPartyTab() {
    const container = document.getElementById('tab-party-content');
    if (!container) return;

    let html = '';
    this.party.forEach(p => {
      const cost = Math.round(p.baseCost * Math.pow(p.costMult, p.count));
      const canAfford = this.rupiah >= cost;
      html += `
        <div class="upgrade-card ${canAfford ? '' : 'locked'}">
          <div class="upgrade-info">
            <div class="upgrade-title">${p.name} <span class="badge badge-party">x${p.count}</span></div>
            <div class="upgrade-desc">${p.desc}</div>
          </div>
          <button class="btn btn-sm ${canAfford ? 'btn-success' : 'btn-disabled'}" onclick="game.recruitParty('${p.id}')">
            Rekrut Rp ${cost.toLocaleString('id-ID')}
          </button>
        </div>
      `;
    });
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

      html += `
        <div class="mountain-select-card ${isCurrent ? 'active' : ''}">
          <div class="mountain-header">
            <h4>${m.name} (${m.elevation} mdpl)</h4>
            ${isCurrent ? '<span class="badge badge-current">Sedang Didaki</span>' : ''}
            ${conqueredCount > 0 ? `<span class="badge badge-summit">🏆 Takluk ${conqueredCount}x</span>` : ''}
          </div>
          <p class="mountain-desc">${m.region} • ${m.trailName}</p>
          <p class="mountain-lore">${m.description}</p>
          <div class="mountain-action">
            ${isUnlocked ? (
              isCurrent ? '<button class="btn btn-sm btn-disabled">Sedang Berjalan</button>' :
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
        <button class="btn btn-xs btn-accent" onclick="game.claimEvent()">Ambil Manfaat!</button>
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
    document.getElementById('modal-summit-title').textContent = `SELAMAT! MENAKLUKKAN ${mountain.name.toUpperCase()}!`;
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
      peakConquered: this.peakConquered,
      stamina: this.stamina,
      gear: this.gear,
      party: this.party,
      consumables: this.consumables,
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
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return;
      const data = JSON.parse(raw);

      this.rupiah = data.rupiah || 5000;
      this.spirit = data.spirit || 0;
      this.goldenEdelweiss = data.goldenEdelweiss || 0;
      this.currentMountainIndex = data.currentMountainIndex || 0;
      this.unlockedMountains = data.unlockedMountains || ['prau'];
      this.distance = data.distance || 0;
      this.peakConquered = data.peakConquered || {};
      this.stamina = data.stamina !== undefined ? data.stamina : 100;

      if (data.gear) {
        for (const k in data.gear) {
          if (this.gear[k]) this.gear[k].level = data.gear[k].level || 0;
        }
      }

      if (data.party) {
        data.party.forEach(savedP => {
          const match = this.party.find(p => p.id === savedP.id);
          if (match) match.count = savedP.count || 0;
        });
      }

      if (data.consumables) {
        for (const k in data.consumables) {
          if (this.consumables[k]) this.consumables[k].count = data.consumables[k].count || 0;
        }
      }

      if (data.stats) {
        this.stats = Object.assign(this.stats, data.stats);
      }

      // Offline Earnings calculation
      if (data.savedAt) {
        const offlineSec = Math.min(8 * 3600, Math.max(0, (Date.now() - data.savedAt) / 1000));
        if (offlineSec > 10) {
          const offlineRupiah = Math.floor(this.getRupiahPerSecond() * offlineSec * 0.7); // 70% offline efficiency
          this.rupiah += offlineRupiah;
          this.stats.totalRupiahEarned += offlineRupiah;
          setTimeout(() => {
            this.showToast(`Selamat datang kembali! Pendaki offline mengumpulkan Rp ${offlineRupiah.toLocaleString('id-ID')}!`);
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
      location.reload();
    }
  }
}
