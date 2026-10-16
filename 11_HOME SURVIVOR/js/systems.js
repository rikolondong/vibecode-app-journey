// Item Definitions, Crafting Recipes, Vitals, and Survival Systems

const ITEM_DB = {
  baseball_bat: {
    id: 'baseball_bat',
    name: ' Pemukul Baseball',
    icon: '🏏',
    type: 'weapon',
    weaponType: 'melee',
    damage: 34,
    range: 2.3,
    staminaCost: 11,
    noise: 4.5,
    cooldown: 0.55,
    knockback: 1.5,
    maxDurability: 45,
    desc: 'Senjata tumpul seimbang untuk memukul mundur zombie.'
  },
  spiked_bat: {
    id: 'spiked_bat',
    name: 'Tongkat Berpaku',
    icon: '🔩',
    type: 'weapon',
    weaponType: 'melee',
    damage: 58,
    range: 2.35,
    staminaCost: 13,
    noise: 5.0,
    cooldown: 0.58,
    knockback: 1.7,
    maxDurability: 55,
    desc: 'Pemukul baseball dengan paku tajam. Daya hancur mematikan.'
  },
  kitchen_knife: {
    id: 'kitchen_knife',
    name: 'Pisau Dapur',
    icon: '🔪',
    type: 'weapon',
    weaponType: 'melee',
    damage: 26,
    range: 1.65,
    staminaCost: 6,
    noise: 2.0,
    cooldown: 0.32,
    knockback: 0.5,
    maxDurability: 25,
    desc: 'Cepat dan senyap, namun jarak pendek dan mudah tumpul.'
  },
  hammer: {
    id: 'hammer',
    name: 'Palu Besi',
    icon: '🔨',
    type: 'weapon',
    weaponType: 'melee',
    damage: 28,
    range: 1.85,
    staminaCost: 9,
    noise: 4.0,
    cooldown: 0.48,
    knockback: 1.1,
    maxDurability: 80,
    desc: 'Wajib dimiliki untuk memasang barikade papan & bongkar perabotan.'
  },
  fire_axe: {
    id: 'fire_axe',
    name: 'Kapak Pemadam',
    icon: '🪓',
    type: 'weapon',
    weaponType: 'melee',
    damage: 65,
    range: 2.4,
    staminaCost: 16,
    noise: 6.0,
    cooldown: 0.72,
    knockback: 1.8,
    maxDurability: 70,
    desc: 'Senjata berat mematikan. Bisa menebang pohon atau membongkar cepat.'
  },
  pistol_9mm: {
    id: 'pistol_9mm',
    name: 'Pistol 9mm',
    icon: '🔫',
    type: 'weapon',
    weaponType: 'ranged',
    damage: 85,
    range: 18.0,
    staminaCost: 2,
    noise: 26.0,
    cooldown: 0.38,
    knockback: 1.2,
    maxDurability: 100,
    desc: 'Mematikan dari jarak jauh, tetapi suara tembakan memancing zombie satu jalan!'
  },
  ammo_9mm: {
    id: 'ammo_9mm',
    name: 'Peluru 9mm',
    icon: '🧱',
    type: 'ammo',
    stackable: true,
    desc: 'Amunisi kaliber 9mm untuk Pistol.'
  },
  canned_food: {
    id: 'canned_food',
    name: 'Sarden Kaleng',
    icon: '🥫',
    type: 'consumable',
    stackable: true,
    hungerRestore: 38,
    thirstRestore: 5,
    healthRestore: 4,
    desc: 'Makanan awet tahan lama. Mengurangi rasa lapar secara signifikan.'
  },
  fresh_meat: {
    id: 'fresh_meat',
    name: 'Daging Mentah',
    icon: '🥩',
    type: 'consumable',
    stackable: true,
    hungerRestore: 18,
    healthRestore: -8,
    desc: 'Sebaiknya dimasak di Kompor Dapur dulu agar tidak sakit perut.'
  },
  cooked_meal: {
    id: 'cooked_meal',
    name: 'Steak Matang',
    icon: '🍲',
    type: 'consumable',
    stackable: true,
    hungerRestore: 60,
    thirstRestore: 10,
    healthRestore: 15,
    panicReduce: 15,
    desc: 'Makanan hangat bergizi tinggi. Memulihkan tenaga dan menenangkan pikiran.'
  },
  water_bottle: {
    id: 'water_bottle',
    name: 'Botol Air Bersih',
    icon: '💧',
    type: 'consumable',
    stackable: true,
    thirstRestore: 48,
    staminaRestore: 15,
    desc: 'Air minum bersih. Bisa diisi ulang di wastafel selama air PDAM menyala.'
  },
  empty_bottle: {
    id: 'empty_bottle',
    name: 'Botol Kosong',
    icon: '🍾',
    type: 'material',
    stackable: true,
    desc: 'Isi ulang dengan air di Wastafel Dapur atau Kamar Mandi.'
  },
  coffee_cup: {
    id: 'coffee_cup',
    name: 'Kopi Instan Kuat',
    icon: '☕',
    type: 'consumable',
    stackable: true,
    thirstRestore: 18,
    fatigueReduce: 35,
    staminaRestore: 25,
    desc: 'Mengusir rasa kantuk saat harus berjaga malam.'
  },
  bandage: {
    id: 'bandage',
    name: 'Perban Steril',
    icon: '🩹',
    type: 'medical',
    stackable: true,
    stopBleeding: true,
    healthRestore: 18,
    desc: 'Menghentikan pendarahan akibat cakaran zombie dan memulihkan HP.'
  },
  dirty_rag: {
    id: 'dirty_rag',
    name: 'Kain Sobek',
    icon: '🧣',
    type: 'medical',
    stackable: true,
    stopBleeding: true,
    healthRestore: 6,
    desc: 'Perban darurat. Bisa disterilkan dengan Alkohol/Air mendidih.'
  },
  medkit: {
    id: 'medkit',
    name: 'Kotak P3K Lengkap',
    icon: '🧰',
    type: 'medical',
    stackable: true,
    stopBleeding: true,
    cureInfection: true,
    healthRestore: 55,
    desc: 'Menyembuhkan luka parah, pendarahan, dan gejala demam/infeksi awal.'
  },
  painkillers: {
    id: 'painkillers',
    name: 'Obat Penenang & Nyeri',
    icon: '💊',
    type: 'medical',
    stackable: true,
    panicReduce: 50,
    healthRestore: 10,
    desc: 'Merendahkan tingkat kepanikan ekstrem dan gemetar.'
  },
  wood_plank: {
    id: 'wood_plank',
    name: 'Papan Kayu',
    icon: '🪵',
    type: 'material',
    stackable: true,
    desc: 'Digunakan bersama Paku & Palu untuk membarikade jendela/pintu (Tombol B).'
  },
  nails: {
    id: 'nails',
    name: 'Paku Besi',
    icon: '📌',
    type: 'material',
    stackable: true,
    desc: 'Bahan penting untuk memasang barikade dan merakit senjata.'
  },
  scrap_metal: {
    id: 'scrap_metal',
    name: 'Besi Rongsokan',
    icon: '⚙️',
    type: 'material',
    stackable: true,
    desc: 'Komponen logam untuk memperbaiki senjata atau membuat paku.'
  },
  battery: {
    id: 'battery',
    name: 'Baterai Alkalin',
    icon: '🔋',
    type: 'consumable',
    stackable: true,
    batteryRestore: 65,
    desc: 'Mengisi daya Senter Taktis Anda untuk bertahan di malam gelap.'
  },
  fuel_can: {
    id: 'fuel_can',
    name: 'Jerigen Bensin',
    icon: '⛽',
    type: 'material',
    stackable: true,
    desc: 'Bahan bakar untuk menyalakan Generator Listrik di Garasi.'
  }
};

const CRAFTING_RECIPES = [
  {
    id: 'craft_spiked_bat',
    name: 'Tongkat Baseball Berpaku',
    result: { id: 'spiked_bat', count: 1 },
    ingredients: [
      { id: 'baseball_bat', count: 1 },
      { id: 'nails', count: 5 }
    ],
    requireTool: 'hammer',
    desc: 'Pasang paku besi pada pemukul baseball untuk daya rusak tinggi.'
  },
  {
    id: 'craft_bandage_from_rag',
    name: 'Perban Steril (Rebus Kain)',
    result: { id: 'bandage', count: 2 },
    ingredients: [
      { id: 'dirty_rag', count: 2 }
    ],
    desc: 'Mengubah kain sobek menjadi perban medis bersih.'
  },
  {
    id: 'craft_nails_from_scrap',
    name: 'Paku Besi (x6)',
    result: { id: 'nails', count: 6 },
    ingredients: [
      { id: 'scrap_metal', count: 1 }
    ],
    requireTool: 'hammer',
    desc: 'Tempa besi rongsokan menjadi paku barikade.'
  },
  {
    id: 'craft_repair_bat',
    name: 'Perkuat Papan Jadi Pemukul',
    result: { id: 'baseball_bat', count: 1 },
    ingredients: [
      { id: 'wood_plank', count: 2 },
      { id: 'nails', count: 2 }
    ],
    requireTool: 'hammer',
    desc: 'Bentuk 2 papan kayu menjadi tongkat pemukul darurat.'
  }
];

class SurvivalSystems {
  constructor() {
    // Time & World State
    this.day = 1;
    this.timeHours = 8.0; // Start at 08:00 AM Day 1
    this.dayDurationRealSeconds = 240; // 4 minutes real time = 24 game hours
    this.powerGridOnline = true;
    this.generatorRunning = false;
    this.generatorFuel = 65; // 0-100%
    this.waterGridOnline = true;
    this.houseLightsOn = true;
    this.tvOn = false;
    this.isSleeping = false;
    this.kills = 0;
    this.barricadesBuilt = 0;

    // Player Vitals (0-100)
    this.health = 100;
    this.hunger = 10;   // 0 = full, 100 = starving
    this.thirst = 12;   // 0 = hydrated, 100 = dehydrated
    this.stamina = 100; // 100 = energetic, 0 = exhausted
    this.fatigue = 8;   // 0 = rested, 100 = passing out
    this.panic = 0;     // 0 = calm, 100 = extreme panic
    this.bleeding = false;
    this.infected = false;
    this.infectionStage = 0; // 0-100
    this.flashlightOn = false;
    this.flashlightBattery = 90;

    // Inventory & Hotbar
    this.inventory = [];
    this.hotbar = [null, null, null, null, null]; // 5 quick slots
    this.activeSlot = 0;

    // Noise Ripples (for 3D visual feedback & zombie attraction)
    this.noiseRipples = [];

    // Radio broadcast tracking
    this.broadcastFlags = {};

    this.initStartingGear();
  }

  initStartingGear() {
    this.addItem('baseball_bat', 1);
    this.addItem('hammer', 1);
    this.addItem('kitchen_knife', 1);
    this.addItem('bandage', 2);
    this.addItem('water_bottle', 1);
    this.addItem('canned_food', 1);
    this.addItem('wood_plank', 3);
    this.addItem('nails', 8);

    // Assign default hotbar
    this.hotbar[0] = this.findItemInstance('baseball_bat');
    this.hotbar[1] = this.findItemInstance('hammer');
    this.hotbar[2] = this.findItemInstance('kitchen_knife');
    this.hotbar[3] = this.findItemInstance('bandage');
    this.hotbar[4] = this.findItemInstance('water_bottle');
  }

  hasElectricity() {
    return this.powerGridOnline || (this.generatorRunning && this.generatorFuel > 0);
  }

  addItem(itemId, count = 1, durability = null) {
    const def = ITEM_DB[itemId];
    if (!def) return false;

    if (def.stackable) {
      const existing = this.inventory.find(i => i.id === itemId);
      if (existing) {
        existing.count += count;
        this.syncHotbar();
        return true;
      }
      const newItem = {
        uid: 'item_' + Math.random().toString(36).slice(2, 9),
        id: itemId,
        count: count,
        durability: null
      };
      this.inventory.push(newItem);
      this.autoFillHotbar(newItem);
      return true;
    } else {
      for (let c = 0; c < count; c++) {
        const newItem = {
          uid: 'item_' + Math.random().toString(36).slice(2, 9),
          id: itemId,
          count: 1,
          durability: durability !== null ? durability : (def.maxDurability || 100)
        };
        this.inventory.push(newItem);
        this.autoFillHotbar(newItem);
      }
      return true;
    }
  }

  autoFillHotbar(itemObj) {
    for (let i = 0; i < 5; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = itemObj;
        break;
      }
    }
  }

  findItemInstance(itemId) {
    return this.inventory.find(i => i.id === itemId) || null;
  }

  getItemCount(itemId) {
    return this.inventory
      .filter(i => i.id === itemId)
      .reduce((sum, i) => sum + i.count, 0);
  }

  removeItem(itemId, count = 1) {
    let remaining = count;
    for (let i = this.inventory.length - 1; i >= 0; i--) {
      const item = this.inventory[i];
      if (item.id === itemId) {
        if (item.count > remaining) {
          item.count -= remaining;
          remaining = 0;
          break;
        } else {
          remaining -= item.count;
          this.inventory.splice(i, 1);
          if (remaining <= 0) break;
        }
      }
    }
    this.syncHotbar();
    return remaining === 0;
  }

  syncHotbar() {
    for (let i = 0; i < 5; i++) {
      if (this.hotbar[i]) {
        const stillExists = this.inventory.find(it => it.uid === this.hotbar[i].uid);
        if (!stillExists || stillExists.count <= 0) {
          this.hotbar[i] = null;
        }
      }
    }
  }

  getActiveItem() {
    this.syncHotbar();
    return this.hotbar[this.activeSlot];
  }

  useItem(itemUid) {
    const item = this.inventory.find(i => i.uid === itemUid);
    if (!item) return;
    const def = ITEM_DB[item.id];
    if (!def) return;

    if (def.type === 'weapon') {
      // Equip to active hotbar slot
      this.hotbar[this.activeSlot] = item;
      window.addLog(`Memegang ${def.name} di slot aktif.`, 'good');
      window.soundFX.playClick();
      return;
    }

    if (def.type === 'consumable' || def.type === 'medical') {
      let used = false;
      if (def.hungerRestore) {
        this.hunger = Math.max(0, this.hunger - def.hungerRestore);
        used = true;
      }
      if (def.thirstRestore) {
        this.thirst = Math.max(0, this.thirst - def.thirstRestore);
        used = true;
        if (item.id === 'water_bottle') {
          this.addItem('empty_bottle', 1);
        }
      }
      if (def.healthRestore) {
        this.health = Math.max(1, Math.min(100, this.health + def.healthRestore));
        used = true;
      }
      if (def.staminaRestore) {
        this.stamina = Math.min(100, this.stamina + def.staminaRestore);
        used = true;
      }
      if (def.fatigueReduce) {
        this.fatigue = Math.max(0, this.fatigue - def.fatigueReduce);
        used = true;
      }
      if (def.panicReduce) {
        this.panic = Math.max(0, this.panic - def.panicReduce);
        used = true;
      }
      if (def.stopBleeding && this.bleeding) {
        this.bleeding = false;
        window.addLog('Pendarahan berhasil dihentikan!', 'good');
        used = true;
      } else if (def.stopBleeding) {
        used = true;
      }
      if (def.cureInfection && this.infected) {
        this.infected = false;
        this.infectionStage = 0;
        window.addLog('Gejala infeksi berhasil diredakan dengan obat P3K.', 'good');
        used = true;
      }
      if (def.batteryRestore) {
        this.flashlightBattery = Math.min(100, this.flashlightBattery + def.batteryRestore);
        window.addLog('Baterai senter telah diisi ulang.', 'good');
        used = true;
      }

      if (used) {
        window.soundFX.playClick();
        window.addLog(`Menggunakan ${def.name}.`, 'good');
        this.removeItem(item.id, 1);
      }
    }
  }

  canCraft(recipe) {
    if (recipe.requireTool && this.getItemCount(recipe.requireTool) < 1) {
      return false;
    }
    for (const ing of recipe.ingredients) {
      if (this.getItemCount(ing.id) < ing.count) {
        return false;
      }
    }
    return true;
  }

  craft(recipeId) {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe || !this.canCraft(recipe)) return false;

    for (const ing of recipe.ingredients) {
      this.removeItem(ing.id, ing.count);
    }
    this.addItem(recipe.result.id, recipe.result.count);
    window.soundFX.playHammer();
    window.addLog(`Berhasil merakit: ${recipe.name}!`, 'good');
    return true;
  }

  emitNoise(x, z, radius, label = '') {
    this.noiseRipples.push({
      x,
      z,
      maxRadius: radius,
      currentRadius: 0.5,
      alpha: 0.9,
      label
    });
    if (window.gameWorld && window.gameWorld.alertZombiesByNoise) {
      window.gameWorld.alertZombiesByNoise(x, z, radius);
    }
  }

  update(dt, playerPos, nearbyZombiesCount) {
    // Advance Game Clock
    const timeMult = this.isSleeping ? 18.0 : 1.0;
    const hoursPassed = (dt * timeMult / this.dayDurationRealSeconds) * 24;
    this.timeHours += hoursPassed;

    if (this.timeHours >= 24) {
      this.timeHours -= 24;
      this.day += 1;
      window.addLog(`Hari ke-${this.day} telah tiba. Tetap waspada.`, 'warn');
      if (window.gameWorld) {
        window.gameWorld.spawnDailyWave(this.day);
      }
    }

    // Scheduled Utility Grid & Radio Events
    this.checkScheduledEvents();

    // Generator Fuel Consumption
    if (this.generatorRunning) {
      this.generatorFuel = Math.max(0, this.generatorFuel - hoursPassed * 2.2);
      if (Math.random() < dt * 1.5 && window.gameWorld) {
        // Generator makes continuous noise in the garage
        this.emitNoise(window.gameWorld.generatorPos.x, window.gameWorld.generatorPos.z, 11.0, 'Generator');
      }
      if (this.generatorFuel <= 0) {
        this.generatorRunning = false;
        window.addLog('Bensin Generator habis! Listrik rumah padam.', 'danger');
      }
    }

    // Survival Vitals Progression
    this.hunger = Math.min(100, this.hunger + hoursPassed * 3.1);
    this.thirst = Math.min(100, this.thirst + hoursPassed * 4.4);

    if (this.isSleeping) {
      this.fatigue = Math.max(0, this.fatigue - hoursPassed * 14.0);
      this.stamina = Math.min(100, this.stamina + hoursPassed * 25.0);
      this.panic = Math.max(0, this.panic - hoursPassed * 12.0);
      if (this.fatigue <= 2) {
        this.isSleeping = false;
        window.addLog('Anda terbangun dengan tubuh segar.', 'good');
      }
    } else {
      this.fatigue = Math.min(100, this.fatigue + hoursPassed * 2.6);
    }

    // Flashlight Battery
    if (this.flashlightOn) {
      this.flashlightBattery = Math.max(0, this.flashlightBattery - dt * 0.45);
      if (this.flashlightBattery <= 0) {
        this.flashlightOn = false;
        window.addLog('Baterai senter habis!', 'warn');
      }
    }

    // Panic computation based on nearby zombies & darkness
    const isNight = this.timeHours >= 19.5 || this.timeHours < 5.5;
    let targetPanic = nearbyZombiesCount * 22;
    if (isNight && !this.hasElectricity() && !this.flashlightOn) {
      targetPanic += 20;
    }
    if (this.tvOn && this.hasElectricity()) {
      targetPanic = Math.max(0, targetPanic - 18);
    }
    if (this.panic < targetPanic) {
      this.panic = Math.min(100, this.panic + dt * 12);
    } else {
      this.panic = Math.max(0, this.panic - dt * 5);
    }

    window.soundFX.playHeartbeat(this.panic);

    // Health Penalties from Bleeding, Infection, Starvation, Dehydration
    if (this.bleeding) {
      this.health -= dt * 1.65;
    }
    if (this.infected) {
      this.infectionStage = Math.min(100, this.infectionStage + hoursPassed * 6.0);
      if (this.infectionStage > 40) {
        this.health -= dt * 0.45;
      }
    }
    if (this.hunger >= 95) {
      this.health -= dt * 0.5;
    }
    if (this.thirst >= 95) {
      this.health -= dt * 0.85;
    }

    // Passive slight regen if well-fed & hydrated & not bleeding
    if (!this.bleeding && !this.infected && this.hunger < 30 && this.thirst < 30 && this.health < 100) {
      this.health = Math.min(100, this.health + dt * 0.25);
    }

    this.health = Math.max(0, this.health);
  }

  checkScheduledEvents() {
    // Day 1 18:00 - Night warning
    if (this.day === 1 && this.timeHours >= 17.5 && !this.broadcastFlags.d1_evening) {
      this.broadcastFlags.d1_evening = true;
      window.addLog('[SIARAN DARURAT]: Malam segera tiba. Tutup tirai jendela (G) dan paku papan barikade (B)! Zombie tertarik pada cahaya dan suara.', 'radio');
    }
    // Day 1 21:00 - Night Wave
    if (this.day === 1 && this.timeHours >= 21.0 && !this.broadcastFlags.d1_night_wave) {
      this.broadcastFlags.d1_night_wave = true;
      window.addLog('Gerombolan zombie terdengar berkeliaran di jalan depan rumah!', 'danger');
      if (window.gameWorld) window.gameWorld.spawnZombieGroup(4, true);
    }
    // Day 2 10:00 - Power grid instability warning
    if (this.day === 2 && this.timeHours >= 10.0 && !this.broadcastFlags.d2_grid_warn) {
      this.broadcastFlags.d2_grid_warn = true;
      window.addLog('[SIARAN DARURAT]: Gardu listrik kota mengalami beban kritis. Siapkan bensin dan Generator di garasi Anda.', 'radio');
    }
    // Day 2 19:00 - City Power Grid Fails!
    if (this.day === 2 && this.timeHours >= 19.0 && this.powerGridOnline) {
      this.powerGridOnline = false;
      window.addLog('LISTRIK KOTA PADAM! Nyalakan Generator di Garasi atau gunakan Senter (F).', 'danger');
    }
    // Day 3 09:00 - Water Supply shuts off
    if (this.day === 3 && this.timeHours >= 9.0 && this.waterGridOnline) {
      this.waterGridOnline = false;
      window.addLog('PASOKAN AIR PDAM BERHENTI! Tekanan air di pipa habis.', 'danger');
    }
  }
}

window.ITEM_DB = ITEM_DB;
window.CRAFTING_RECIPES = CRAFTING_RECIPES;
window.SurvivalSystems = SurvivalSystems;
