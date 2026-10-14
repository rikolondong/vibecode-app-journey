// Parallax 2D Side-Scrolling Canvas Engine - Ekspedisi Puncak Nusantara
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

class MountainParallax {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 800;
    this.height = 420;

    // Scroll & Distance
    this.scrollX = 0;
    this.currentDistance = 0; // Current meters traversed in game

    // Environment & Time
    this.timeOfDay = 0.25; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    this.timeSpeed = 0.0002;
    this.weather = 'sunny';
    this.weatherTimer = 0;

    // Character State & Animation (Solo Hiker)
    this.walkCycle = 0;
    this.isResting = false;
    this.isSummit = false;
    this.summitFactor = 0;

    // Customization model
    this.customization = {
      jacketColor: '#ea580c',
      headwear: 'beanie',
      headwearColor: '#eab308',
      carrierColor: '#dc2626',
      pantsColor: '#1e293b'
    };

    // Active buffs & events
    this.activeEvent = null;
    this.activeBuffs = {};

    // Particles & Popups
    this.stepParticles = [];
    this.floatingTexts = [];
    this.weatherParticles = [];

    // NPCs along the trail (strictly random encounters)
    this.npcs = [];

    // Mountain Data reference
    this.currentMountain = (typeof MOUNTAIN_DATA !== 'undefined' && MOUNTAIN_DATA.length > 0) ? MOUNTAIN_DATA[0] : null;

    this.initSkyObjects();
    this.initWeatherParticles();
    this.initNPCs();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupPointerEvents();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 800 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width || 800;
    this.height = Math.min(480, Math.max(340, this.width * 0.48));
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);
  }

  setMountain(mountainData) {
    this.currentMountain = mountainData;
    this.initNPCs();
  }

  setCustomization(custom) {
    this.customization = Object.assign({}, this.customization, custom);
  }

  // --- TERRAIN INCLINE & DYNAMIC SLOPE CALCULATION ---
  // Evaluates whether the current trail section is a steep climb, flat area, or standard slope
  getFeatureInclineMultiplier(distMeters) {
    if (!this.currentMountain || !this.currentMountain.features) return 1.0;
    for (const f of this.currentMountain.features) {
      if (f.type === 'steep_climb' && distMeters >= f.startDist && distMeters <= f.endDist) {
        return 1.65; // Tanjakan ekstrim: lereng menanjak curam
      }
      if (f.type === 'flat_area' && Math.abs(distMeters - f.distance) < 80) {
        return 0.15; // Area datar / pos istirahat
      }
      if (f.type === 'bridge' && Math.abs(distMeters - f.distance) < 40) {
        return 0.2; // Jembatan melintasi sungai (relatif datar)
      }
    }
    return 1.0;
  }

  getTrailY(x) {
    const mainX = this.width * 0.38;
    const worldDistAtX = this.currentDistance + (x - mainX) / 3.5;
    const inclineMult = this.getFeatureInclineMultiplier(worldDistAtX);

    const baseIncline = Math.min(110, Math.max(75, this.height * 0.26)) * inclineMult;
    const climbBaseY = this.height - 38;

    // Rocky bumps and dirt undulations
    const bump = Math.sin((x + this.scrollX * 0.8) * 0.018) * 4.5
               + Math.sin((x + this.scrollX * 1.4) * 0.045) * 2.0;

    // Climbing slope: rises from left to right (y decreases as x increases)
    const climbY = climbBaseY - (x / this.width) * baseIncline + bump;

    // Summit: expansive, gentle summit plateau
    const summitBaseY = this.height - 78;
    const summitBump = Math.sin(x * 0.01) * 2.0;
    const summitY = summitBaseY + summitBump;

    // Smooth blend between climb slope and flat summit plateau
    return climbY * (1 - this.summitFactor) + summitY * this.summitFactor;
  }

  getTrailSlope(x) {
    if (this.summitFactor >= 0.98) return 0;
    const dx = 14;
    const y1 = this.getTrailY(x - dx);
    const y2 = this.getTrailY(x + dx);
    return Math.atan2(y2 - y1, dx * 2);
  }

  initSkyObjects() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 260,
        radius: 0.7 + Math.random() * 1.5,
        twinkleSpeed: 0.002 + Math.random() * 0.004,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.clouds = [];
    for (let i = 0; i < 14; i++) {
      this.clouds.push({
        x: Math.random() * 2400,
        y: 20 + Math.random() * 120,
        scale: 0.7 + Math.random() * 0.7,
        alpha: 0.35 + Math.random() * 0.4
      });
    }
  }

  initWeatherParticles() {
    this.weatherParticles = [];
    for (let i = 0; i < 75; i++) {
      this.weatherParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speedX: -1 - Math.random() * 2,
        speedY: 0.5 + Math.random() * 1.5,
        size: 1.5 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.6,
        type: Math.random() > 0.4 ? 'leaf' : 'petal'
      });
    }
  }

  // --- RANDOM NPC ENCOUNTERS ALONG THE TRAIL ---
  initNPCs() {
    const m = this.currentMountain;
    if (!m) return;

    const totalDist = m.totalDistance || 4500;
    const npcTypes = ['hiker_walking', 'hiker_resting', 'camper_cooking', 'trail_runner'];
    const names = [
      'Mas Dika', 'Mbak Rara', 'Kang Asep', 'Bli Wayan', 
      'Pak Yanto', 'Sisca (Trail Runner)', 'Bang Rio', 'Mas Bayu'
    ];

    const dialogues = [
      ['Semangat mas! Puncak tinggal 5 menit lagi! 😆', 'Tinggal nanjak dikit lagi sampai kok! 💪', 'Ayo gas tipis-tipis! 🥾'],
      ['Napas dulu mas, santai jangan buru-buru ☕', 'Monggo duduk selonjoran dulu! 🪵', 'Sruput kopi anget dulu biar seger! ☕'],
      ['Pemandangan laut awan di atas juara banget! 🌄', 'Jangan nyampah ya kak, bawa turun sampahnya! 🚮', 'Awas licin mas, banyak akar pohon! 🪵'],
      ['Keren banget langkahnya, gas terus! 🔥', 'Alhamdulillah cuacanya cerah banget hari ini! ☀️', 'Tarik napas, atur tempo langkah ya! 🥾']
    ];

    this.npcs = [];
    // Place 6 to 9 random NPCs along the trail at natural intervals
    let dist = 350 + Math.random() * 180;
    let idx = 0;
    while (dist < totalDist - 200) {
      const type = npcTypes[idx % npcTypes.length];
      const name = names[idx % names.length];
      const dialogueList = dialogues[idx % dialogues.length];

      this.npcs.push({
        id: `npc_${idx}`,
        name: name,
        distance: dist,
        type: type,
        dialogues: dialogueList,
        currentBubble: null,
        bubbleTimer: 0,
        hasTriggeredGreet: false,
        walkCycle: Math.random() * 10
      });

      dist += 520 + Math.random() * 350;
      idx++;
    }
  }

  setupPointerEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let clickedNPC = false;
      this.npcs.forEach(npc => {
        const deltaMeters = npc.distance - this.currentDistance;
        const mainX = this.width * 0.38;
        const npcX = mainX + deltaMeters * 3.5;
        const npcY = this.getTrailY(npcX);

        if (Math.abs(clickX - npcX) < 45 && Math.abs(clickY - (npcY - 20)) < 52) {
          this.triggerNPCBubble(npc);
          clickedNPC = true;
          if (typeof mountainAudio !== 'undefined') {
            mountainAudio.ensureContext();
            if (mountainAudio.playChatPop) mountainAudio.playChatPop();
            else mountainAudio.playCoin();
          }
        }
      });

      if (!clickedNPC && window.game) {
        window.game.handleTap();
      }
    });
  }

  triggerNPCBubble(npc) {
    const list = npc.dialogues;
    const line = list[Math.floor(Math.random() * list.length)];
    npc.currentBubble = line;
    npc.bubbleTimer = 4.5;
  }

  // --- UPDATE LOOP ---
  update(speedMps, deltaMs, currentDistance = 0, activeEvent = null, activeBuffs = {}) {
    const deltaSec = deltaMs / 1000;
    this.currentDistance = currentDistance;
    this.activeEvent = activeEvent;
    this.activeBuffs = activeBuffs;

    // At summit: stationary, no scroll, zero walk animation
    if (this.isSummit) {
      speedMps = 0;
      this.summitFactor = Math.min(1, this.summitFactor + deltaSec * 1.5);
      this.walkCycle = 0;
    } else {
      const m = this.currentMountain;
      if (m && m.totalDistance > 0) {
        const progress = Math.min(1, this.currentDistance / m.totalDistance);
        if (progress > 0.88) {
          const targetSummitFactor = (progress - 0.88) / 0.12;
          this.summitFactor = Math.min(1, Math.max(0, targetSummitFactor));
        } else {
          this.summitFactor = 0;
        }
      }
    }

    const effectiveSpeed = this.isResting ? 0 : speedMps;
    this.scrollX += effectiveSpeed * deltaSec * 32;

    if (effectiveSpeed > 0 && !this.isResting && !this.isSummit) {
      this.walkCycle += effectiveSpeed * deltaSec * 4.2;
    }

    this.timeOfDay = (this.timeOfDay + this.timeSpeed * (deltaMs / 16.6)) % 1.0;

    // Weather particles
    this.weatherParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < -10) p.x = this.width + 10;
      if (p.y > this.height + 10) p.y = -10;
    });

    // Step dust
    for (let i = this.stepParticles.length - 1; i >= 0; i--) {
      const p = this.stepParticles[i];
      p.y += p.vy;
      p.alpha -= deltaSec * 1.5;
      if (p.alpha <= 0) this.stepParticles.splice(i, 1);
    }

    // Floating text popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= deltaSec * 38;
      ft.alpha -= deltaSec * 0.9;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    // NPCs auto-greet & animation
    const mainX = this.width * 0.38;
    this.npcs.forEach(npc => {
      const deltaMeters = npc.distance - this.currentDistance;

      if (Math.abs(deltaMeters) < 7 && !npc.hasTriggeredGreet) {
        npc.hasTriggeredGreet = true;
        this.triggerNPCBubble(npc);
      }

      if (npc.bubbleTimer > 0) {
        npc.bubbleTimer -= deltaSec;
        if (npc.bubbleTimer <= 0) {
          npc.currentBubble = null;
        }
      }

      if (npc.type === 'hiker_walking' || npc.type === 'trail_runner') {
        const nSpeed = npc.type === 'trail_runner' ? 2.5 : 1.2;
        npc.walkCycle += nSpeed * deltaSec * 4.5;
      }
    });
  }

  addStepDust(x, y) {
    for (let i = 0; i < 3; i++) {
      this.stepParticles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + 6,
        vy: -0.3 - Math.random() * 0.4,
        size: 3 + Math.random() * 3,
        alpha: 0.6 + Math.random() * 0.3,
        color: '#c2a688'
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#fbbf24') {
    const defaultX = this.width * 0.38 + (Math.random() * 20 - 10);
    const defaultY = this.getTrailY(defaultX) - 55;
    this.floatingTexts.push({
      text: text,
      x: x || defaultX,
      y: y || defaultY,
      alpha: 1.0,
      color: color
    });
  }

  // --- RENDERING PIPELINE ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky & Atmosphere Gradient
    this.renderSky(ctx);

    // 2. Stars & Celestial
    this.renderCelestial(ctx);

    // 3. Distant Moving Clouds
    this.renderClouds(ctx, 0.12);

    // 4. Parallax Layer 1: Distant Conical Volcanoes
    this.renderFarPeaks(ctx);

    // 5. Samudra Awan Puncak
    this.renderSeaOfClouds(ctx);

    // 6. Parallax Layer 2: Mid-Distance Pine Ridges & Hills
    this.renderMidHills(ctx);

    // 7. Parallax Layer 3: Near Hills & Savanna
    this.renderNearHills(ctx);

    // 8. Trail Foreground Ground
    this.renderTrail(ctx);

    // 9. Environmental Terrain Features & Obstacles (Hutan lebat, jembatan, tanjakan, tali, rintangan)
    this.renderTerrainFeatures(ctx);

    // 10. Pos Shelters, Basecamps & Summit Signposts
    this.renderCheckpoints(ctx);

    // 11. Random NPCs & Speech Bubble Clouds
    this.renderNPCs(ctx);

    // 12. Active Events (Burung Jalak Lawu guide)
    this.renderActiveEvents(ctx);

    // 13. Solo Hiker Player (or Campsite / Summit Celebration)
    if (this.isSummit) {
      this.renderSummitCelebration(ctx);
    } else if (this.isResting) {
      this.renderCampSite(ctx);
    } else {
      this.renderHikingParty(ctx);
    }

    // 14. Weather, Particles & Floating Popups
    this.renderWeather(ctx);
    this.renderStepParticles(ctx);
    this.renderFloatingTexts(ctx);
  }

  // --- SKY & CELESTIAL ---
  renderSky(ctx) {
    const t = this.timeOfDay;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);

    if (t < 0.25) {
      const factor = t / 0.25;
      grad.addColorStop(0, this.lerpColor('#090d16', '#211832', factor));
      grad.addColorStop(0.5, this.lerpColor('#111827', '#5b2b4d', factor));
      grad.addColorStop(1, this.lerpColor('#1f2937', '#e87248', factor));
    } else if (t < 0.5) {
      const factor = (t - 0.25) / 0.25;
      grad.addColorStop(0, this.lerpColor('#211832', '#38bdf8', factor));
      grad.addColorStop(0.5, this.lerpColor('#5b2b4d', '#7dd3fc', factor));
      grad.addColorStop(1, this.lerpColor('#e87248', '#bae6fd', factor));
    } else if (t < 0.75) {
      const factor = (t - 0.5) / 0.25;
      grad.addColorStop(0, this.lerpColor('#38bdf8', '#3b0764', factor));
      grad.addColorStop(0.4, this.lerpColor('#7dd3fc', '#d946ef', factor));
      grad.addColorStop(0.8, this.lerpColor('#bae6fd', '#f97316', factor));
      grad.addColorStop(1, this.lerpColor('#e0f2fe', '#fde047', factor));
    } else {
      const factor = (t - 0.75) / 0.25;
      grad.addColorStop(0, this.lerpColor('#3b0764', '#090d16', factor));
      grad.addColorStop(0.5, this.lerpColor('#d946ef', '#111827', factor));
      grad.addColorStop(1, this.lerpColor('#f97316', '#1f2937', factor));
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderCelestial(ctx) {
    const t = this.timeOfDay;

    if (t < 0.3 || t > 0.7) {
      const starAlpha = t < 0.3 ? (1 - t / 0.3) : ((t - 0.7) / 0.3);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      this.stars.forEach(s => {
        const twinkle = Math.sin(Date.now() * s.twinkleSpeed + s.phase) * 0.4 + 0.6;
        ctx.globalAlpha = starAlpha * twinkle;
        ctx.beginPath();
        ctx.arc((s.x - this.scrollX * 0.02) % (this.width + 100) + 10, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.save();
    if (t >= 0.2 && t <= 0.8) {
      const sunProgress = (t - 0.2) / 0.6;
      const sunX = this.width * 0.15 + sunProgress * (this.width * 0.7);
      const sunY = this.height * 0.65 - Math.sin(sunProgress * Math.PI) * (this.height * 0.48);

      const sunGrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 70);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.5)');
      sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const moonProgress = t > 0.8 ? (t - 0.8) / 0.4 : (t + 0.2) / 0.4;
      const moonX = this.width * 0.2 + moonProgress * (this.width * 0.6);
      const moonY = this.height * 0.55 - Math.sin(moonProgress * Math.PI) * (this.height * 0.4);

      ctx.fillStyle = 'rgba(224, 231, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(moonX + 6, moonY - 3, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderClouds(ctx, speedMult) {
    ctx.save();
    this.clouds.forEach(c => {
      ctx.globalAlpha = c.alpha * (this.weather === 'foggy' ? 0.9 : 0.6);
      ctx.fillStyle = '#f8fafc';
      const cx = (c.x - this.scrollX * speedMult) % (this.width + 300) - 100;
      const cy = c.y;
      const s = c.scale;

      ctx.beginPath();
      ctx.arc(cx, cy, 25 * s, 0, Math.PI * 2);
      ctx.arc(cx + 25 * s, cy - 10 * s, 35 * s, 0, Math.PI * 2);
      ctx.arc(cx + 60 * s, cy - 5 * s, 28 * s, 0, Math.PI * 2);
      ctx.arc(cx + 85 * s, cy + 5 * s, 20 * s, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  // --- CONTINUOUS PARALLAX LAYERS (0 GLITCH) ---
  renderFarPeaks(ctx) {
    ctx.save();
    const speed = 0.05;
    const S = this.scrollX * speed;
    const baseY = this.height - 105;

    const t = this.timeOfDay;
    let peakColor = '#3b4252';
    if (t >= 0.2 && t <= 0.3) peakColor = '#593959';
    else if (t > 0.3 && t < 0.7) peakColor = '#475569';
    else if (t >= 0.7 && t <= 0.8) peakColor = '#4c284e';
    else peakColor = '#1e2433';

    ctx.fillStyle = peakColor;
    ctx.beginPath();
    ctx.moveTo(-40, this.height + 20);

    const step = 15;
    for (let x = -40; x <= this.width + 40; x += step) {
      const wx = x + S;
      const v1 = Math.sin(wx * 0.0035) * 60;
      const v2 = Math.cos(wx * 0.008) * 35;
      const v3 = Math.sin(wx * 0.02) * 12;
      const peakH = 110 + v1 + v2 + v3;
      const slopeIncline = (1 - this.summitFactor) * (x / this.width) * 28;
      ctx.lineTo(x, baseY - peakH - slopeIncline);
    }

    ctx.lineTo(this.width + 40, this.height + 20);
    ctx.closePath();
    ctx.fill();

    const haze = ctx.createLinearGradient(0, baseY - 100, 0, this.height);
    haze.addColorStop(0, 'rgba(255, 255, 255, 0)');
    haze.addColorStop(1, 'rgba(255, 255, 255, 0.32)');
    ctx.fillStyle = haze;
    ctx.fill();

    ctx.restore();
  }

  renderSeaOfClouds(ctx) {
    if (this.summitFactor <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.summitFactor * 1.25);

    const seaY = this.height - 110;
    const t = this.timeOfDay;

    const cloudGrad = ctx.createLinearGradient(0, seaY - 50, 0, this.height);
    if (t >= 0.2 && t <= 0.35) {
      cloudGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      cloudGrad.addColorStop(0.3, 'rgba(254, 215, 170, 0.9)');
      cloudGrad.addColorStop(0.7, 'rgba(203, 213, 225, 0.85)');
      cloudGrad.addColorStop(1, 'rgba(148, 163, 184, 0.8)');
    } else if (t > 0.35 && t < 0.7) {
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      cloudGrad.addColorStop(0.35, 'rgba(241, 245, 249, 0.92)');
      cloudGrad.addColorStop(0.75, 'rgba(203, 213, 225, 0.85)');
      cloudGrad.addColorStop(1, 'rgba(148, 163, 184, 0.75)');
    } else if (t >= 0.7 && t <= 0.8) {
      cloudGrad.addColorStop(0, 'rgba(253, 186, 116, 0.95)');
      cloudGrad.addColorStop(0.4, 'rgba(244, 114, 182, 0.88)');
      cloudGrad.addColorStop(1, 'rgba(100, 116, 139, 0.8)');
    } else {
      cloudGrad.addColorStop(0, 'rgba(51, 65, 85, 0.9)');
      cloudGrad.addColorStop(0.5, 'rgba(30, 41, 59, 0.85)');
      cloudGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
    }

    ctx.fillStyle = cloudGrad;

    const timeNow = Date.now() * 0.0007;
    for (let layer = 0; layer < 3; layer++) {
      const layerY = seaY + layer * 22;
      const speed = (layer + 1) * 0.45;
      ctx.beginPath();
      ctx.moveTo(-50, this.height);
      const step = 35;
      for (let x = -50; x <= this.width + 50; x += step) {
        const wave = Math.sin((x * 0.016) + timeNow * speed + layer * 1.5) * 15
                   + Math.cos((x * 0.032) - timeNow * (speed * 0.7)) * 9;
        ctx.lineTo(x, layerY + wave);
      }
      ctx.lineTo(this.width + 50, this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  renderMidHills(ctx) {
    ctx.save();
    const speed = 0.16;
    const S = this.scrollX * speed;
    const baseY = this.height - 65;

    const t = this.timeOfDay;
    let hillColor = '#2d4a3e';
    if (t < 0.25 || t > 0.75) hillColor = '#152520';
    else if (t >= 0.7 && t <= 0.75) hillColor = '#3a2b38';

    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(-40, this.height + 20);

    const step = 12;
    for (let x = -40; x <= this.width + 40; x += step) {
      const wx = x + S;
      const h = 55 + Math.sin(wx * 0.007) * 26 + Math.cos(wx * 0.018) * 12;
      const slopeIncline = (1 - this.summitFactor) * (x / this.width) * 42;
      ctx.lineTo(x, baseY - h - slopeIncline);
    }
    ctx.lineTo(this.width + 40, this.height + 20);
    ctx.closePath();
    ctx.fill();

    // Pine trees
    ctx.fillStyle = this.lerpColor(hillColor, '#0a1410', 0.4);
    const treeInterval = 32;
    const kStart = Math.floor((S - 40) / treeInterval);
    const kEnd = Math.ceil((S + this.width + 40) / treeInterval);
    for (let k = kStart; k <= kEnd; k++) {
      const wx = k * treeInterval;
      const sx = wx - S;
      const h = 55 + Math.sin(wx * 0.007) * 26 + Math.cos(wx * 0.018) * 12;
      const slopeIncline = (1 - this.summitFactor) * (sx / this.width) * 42;
      const ty = baseY - h - slopeIncline + 12;
      this.drawPineTree(ctx, sx, ty, 15);
    }

    ctx.restore();
  }

  drawPineTree(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.35, y);
    ctx.lineTo(x - size * 0.35, y);
    ctx.closePath();
    ctx.fill();
  }

  renderNearHills(ctx) {
    ctx.save();
    const speed = 0.40;
    const S = this.scrollX * speed;
    const baseY = this.height - 35;

    const t = this.timeOfDay;
    let nearColor = '#4a7c59';
    if (t < 0.25 || t > 0.75) nearColor = '#1b3324';
    else if (t >= 0.25 && t <= 0.3) nearColor = '#606a40';

    ctx.fillStyle = nearColor;
    ctx.beginPath();
    ctx.moveTo(-40, this.height + 20);

    const step = 10;
    for (let x = -40; x <= this.width + 40; x += step) {
      const wx = x + S;
      const h = 38 + Math.sin(wx * 0.012) * 18 + Math.cos(wx * 0.028) * 8;
      const slopeIncline = (1 - this.summitFactor) * (x / this.width) * 60;
      ctx.lineTo(x, baseY - h - slopeIncline);
    }
    ctx.lineTo(this.width + 40, this.height + 20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- TRAIL FOREGROUND & STRATA ---
  renderTrail(ctx) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(-20, this.height + 20);
    const step = 8;
    for (let x = -20; x <= this.width + 20; x += step) {
      ctx.lineTo(x, this.getTrailY(x));
    }
    ctx.lineTo(this.width + 20, this.height + 20);
    ctx.closePath();

    const avgY = this.height - 80;
    const groundGrad = ctx.createLinearGradient(0, avgY - 40, 0, this.height);

    const mId = this.currentMountain?.id;
    const isVolcanic = (mId === 'bromo' || mId === 'merapi');

    if (isVolcanic) {
      groundGrad.addColorStop(0, '#5a4e48');
      groundGrad.addColorStop(0.18, '#3d342f');
      groundGrad.addColorStop(0.6, '#26201c');
      groundGrad.addColorStop(1, '#151210');
    } else {
      groundGrad.addColorStop(0, '#785338');
      groundGrad.addColorStop(0.18, '#593c24');
      groundGrad.addColorStop(0.6, '#3a2615');
      groundGrad.addColorStop(1, '#20140a');
    }
    ctx.fillStyle = groundGrad;
    ctx.fill();

    ctx.strokeStyle = isVolcanic ? 'rgba(40, 35, 30, 0.4)' : 'rgba(50, 30, 15, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // --- ENVIRONMENTAL TERRAIN FEATURES & OBSTACLES ---
  // Renders: Hutan lebat, jembatan, tanjakan ekstrim, tali webbing, bebatuan, sabana, rintangan
  renderTerrainFeatures(ctx) {
    const m = this.currentMountain;
    if (!m || !m.features) return;

    const mainX = this.width * 0.38;
    const scale = 3.5; // pixels per meter

    // 1. Check if current location is inside Dense Forest
    let isInDenseForest = false;
    for (const f of m.features) {
      if (f.type === 'dense_forest' && this.currentDistance >= f.startDist - 100 && this.currentDistance <= f.endDist + 100) {
        isInDenseForest = true;
        break;
      }
    }
    if (isInDenseForest) {
      this.drawDenseForestCanopy(ctx);
    }

    // 2. Render discrete features: Bridges, Ropes, Obstacles, Boulders, Sabana
    m.features.forEach(f => {
      if (f.type === 'bridge') {
        const delta = f.distance - this.currentDistance;
        const bx = mainX + delta * scale;
        if (bx >= -120 && bx <= this.width + 120) {
          this.drawWoodenBridge(ctx, bx, f.name);
        }
      } else if (f.type === 'fallen_log') {
        const delta = f.distance - this.currentDistance;
        const lx = mainX + delta * scale;
        if (lx >= -60 && lx <= this.width + 60) {
          this.drawFallenLog(ctx, lx);
        }
      } else if (f.type === 'tree_roots') {
        const delta = f.distance - this.currentDistance;
        const rx = mainX + delta * scale;
        if (rx >= -60 && rx <= this.width + 60) {
          this.drawGnarledRoots(ctx, rx);
        }
      } else if (f.type === 'webbing_rope') {
        // Draw safety webbing ropes anchored along the steep slope
        const startX = mainX + (f.startDist - this.currentDistance) * scale;
        const endX = mainX + (f.endDist - this.currentDistance) * scale;
        if (endX >= -50 && startX <= this.width + 50) {
          this.drawWebbingRopeSection(ctx, Math.max(-50, startX), Math.min(this.width + 50, endX));
        }
      } else if (f.type === 'rocky_scree') {
        const startX = mainX + (f.startDist - this.currentDistance) * scale;
        const endX = mainX + (f.endDist - this.currentDistance) * scale;
        if (endX >= -50 && startX <= this.width + 50) {
          this.drawRockyScreeZone(ctx, Math.max(-40, startX), Math.min(this.width + 40, endX));
        }
      } else if (f.type === 'savanna') {
        const startX = mainX + (f.startDist - this.currentDistance) * scale;
        const endX = mainX + (f.endDist - this.currentDistance) * scale;
        if (endX >= -50 && startX <= this.width + 50) {
          this.drawSavannaGrassZone(ctx, Math.max(-40, startX), Math.min(this.width + 40, endX));
        }
      } else if (f.type === 'flat_area' && f.distance > 0) {
        const delta = f.distance - this.currentDistance;
        const fx = mainX + delta * scale;
        if (fx >= -80 && fx <= this.width + 80) {
          this.drawFlatRestArea(ctx, fx, f.name);
        }
      }
    });
  }

  // Visual Hutan Lebat: Kanopi rimbun, sulur akar gantung, dan berkas cahaya matahari (komorebi)
  drawDenseForestCanopy(ctx) {
    ctx.save();
    // Overarching jungle tree leaves at the top
    ctx.fillStyle = '#0f291e';
    for (let cx = -20; cx < this.width + 60; cx += 50) {
      ctx.beginPath();
      ctx.arc(cx, -10, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 25, 12, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hanging lianas / vines (sulur akar gantung)
    ctx.strokeStyle = '#274e37';
    ctx.lineWidth = 2.5;
    const timeNow = Date.now() * 0.001;
    for (let vx = 40; vx < this.width; vx += 90) {
      const vineLen = 45 + ((vx * 13) % 40);
      const sway = Math.sin(timeNow + vx) * 6;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.quadraticCurveTo(vx + sway, vineLen * 0.6, vx + sway * 1.5, vineLen);
      ctx.stroke();

      // Leaf clusters on vine
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(vx + sway * 1.5, vineLen, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft dappled sunlight beams filtering through canopy (komorebi)
    if (this.timeOfDay >= 0.25 && this.timeOfDay <= 0.75) {
      const lightGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
      lightGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.04)');
      lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lightGrad;

      for (let rx = 60; rx < this.width; rx += 140) {
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 45, 0);
        ctx.lineTo(rx + 90, this.height);
        ctx.lineTo(rx + 15, this.height);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Visual Jembatan Kayu / Bambu melintasi jurang / aliran air
  drawWoodenBridge(ctx, x, bridgeName) {
    const y = this.getTrailY(x);
    ctx.save();
    ctx.translate(x, y);

    // Stream ravine depression underneath
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(0, 32, 28, 0, Math.PI);
    ctx.fill();

    // Rushing water cascade & splashes
    ctx.fillStyle = '#38bdf8';
    const waterWave = Math.sin(Date.now() * 0.01) * 3;
    ctx.fillRect(-18, 26 + waterWave, 36, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, 25 + waterWave, 16, 2);

    // River stones
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(-22, 34, 7, 0, Math.PI * 2);
    ctx.arc(22, 36, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bridge wooden deck planks
    ctx.fillStyle = '#452814';
    ctx.fillRect(-55, -5, 110, 8);

    // Planks dividers
    ctx.strokeStyle = '#2b170a';
    ctx.lineWidth = 1.5;
    for (let px = -50; px <= 50; px += 10) {
      ctx.beginPath();
      ctx.moveTo(px, -5);
      ctx.lineTo(px, 3);
      ctx.stroke();
    }

    // Bridge timber posts & railings
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-50, -22, 6, 18);
    ctx.fillRect(0, -22, 6, 18);
    ctx.fillRect(44, -22, 6, 18);

    // Top Handrail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-54, -22);
    ctx.lineTo(50, -22);
    ctx.stroke();

    // Bridge nameplate
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-22, -34, 44, 10);
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 6.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JEMBATAN', 0, -27);

    ctx.restore();
  }

  // Visual Batang Pohon Tumbang (Fallen Tree Log Obstacle)
  drawFallenLog(ctx, x) {
    const y = this.getTrailY(x);
    ctx.save();
    ctx.translate(x, y);

    // Thick fallen mossy trunk
    ctx.fillStyle = '#45220d';
    ctx.beginPath();
    ctx.roundRect(-22, -10, 44, 14, 5);
    ctx.fill();

    // Green moss patch on top of log
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(-16, -11, 26, 4, 2);
    ctx.fill();

    // Tiny wild mountain mushrooms (jamur)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-8, -13, 2.5, 0, Math.PI * 2);
    ctx.arc(-3, -14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Visual Akar Pohon Melintang (Gnarled Root Obstacle)
  drawGnarledRoots(ctx, x) {
    const y = this.getTrailY(x);
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = '#381e0d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.quadraticCurveTo(-12, -8, 8, 2);
    ctx.quadraticCurveTo(20, -5, 32, 6);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.quadraticCurveTo(-6, -12, 14, -2);
    ctx.stroke();

    ctx.restore();
  }

  // Visual Tali Webbing untuk Menanjak (Fixed Webbing Safety Ropes)
  drawWebbingRopeSection(ctx, startX, endX) {
    ctx.save();
    const stakeInterval = 75;

    // Metal pitons / wooden stakes hammered into rock
    ctx.fillStyle = '#64748b';
    for (let sx = startX; sx <= endX; sx += stakeInterval) {
      const sy = this.getTrailY(sx);
      // Anchor stake
      ctx.fillRect(sx - 2, sy - 34, 4, 34);
      // Carabiner loop
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - 30, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Heavy-duty webbing rope strung between stakes (bright orange/red)
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let sx = startX; sx <= endX; sx += stakeInterval) {
      const sy = this.getTrailY(sx);
      const nextX = Math.min(endX, sx + stakeInterval);
      const nextY = this.getTrailY(nextX);
      const midX = (sx + nextX) / 2;
      const midY = (sy + nextY) / 2 + 5; // catenary rope sag

      if (sx === startX) ctx.moveTo(sx, sy - 30);
      ctx.quadraticCurveTo(midX, midY - 30, nextX, nextY - 30);
    }
    ctx.stroke();

    // Red-white marker ribbon on rope
    ctx.fillStyle = '#dc2626';
    for (let sx = startX + 35; sx <= endX; sx += stakeInterval) {
      const sy = this.getTrailY(sx);
      ctx.fillRect(sx - 2, sy - 28, 4, 7);
    }

    ctx.restore();
  }

  // Visual Bebatuan Cadas (Rocky scree & andesite boulders)
  drawRockyScreeZone(ctx, startX, endX) {
    ctx.save();
    for (let rx = startX; rx <= endX; rx += 48) {
      const ry = this.getTrailY(rx);
      const isBig = (Math.abs(Math.round(rx)) % 3 === 0);

      // Andesite boulders
      ctx.fillStyle = isBig ? '#57534e' : '#78716c';
      ctx.beginPath();
      const bW = isBig ? 18 : 10;
      const bH = isBig ? 14 : 8;
      ctx.roundRect(rx - bW / 2, ry - bH + 2, bW, bH, 3);
      ctx.fill();

      // Rock highlight
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.arc(rx - 2, ry - bH + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Visual Area Sabana & Padang Rumput (Swaying Alpine Grass & Flowers)
  drawSavannaGrassZone(ctx, startX, endX) {
    ctx.save();
    const timeNow = Date.now() * 0.003;

    for (let gx = startX; gx <= endX; gx += 22) {
      const gy = this.getTrailY(gx);
      const sway = Math.sin(timeNow + gx * 0.1) * 5;

      // Tall savanna grass blade
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(gx, gy + 1);
      ctx.quadraticCurveTo(gx + sway * 0.5, gy - 10, gx + sway, gy - 18);
      ctx.stroke();

      // Wildflower blooming in savanna
      if (Math.abs(Math.round(gx)) % 4 === 0) {
        ctx.fillStyle = '#fde047'; // yellow daisy
        ctx.beginPath();
        ctx.arc(gx + sway, gy - 19, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Visual Area Datar (Camp terrace with wooden bench)
  drawFlatRestArea(ctx, x, areaName) {
    const y = this.getTrailY(x);
    ctx.save();
    ctx.translate(x, y);

    // Carved flat terrace earth
    ctx.fillStyle = '#54361e';
    ctx.beginPath();
    ctx.roundRect(-40, -4, 80, 8, 3);
    ctx.fill();

    // Wooden resting bench (bangku istirahat)
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-22, -14, 44, 4);
    ctx.fillRect(-18, -10, 4, 10);
    ctx.fillRect(14, -10, 4, 10);

    ctx.restore();
  }

  // --- CHECKPOINTS, POS SHELTERS & SUMMIT NOTICES ---
  renderCheckpoints(ctx) {
    const m = this.currentMountain;
    if (!m || !m.checkpoints) return;

    const mainX = this.width * 0.38;
    const scale = 3.5;

    m.checkpoints.forEach((cp, idx) => {
      const deltaMeters = cp.distance - this.currentDistance;
      const px = mainX + deltaMeters * scale;

      if (px >= -160 && px <= this.width + 160) {
        const py = this.getTrailY(px);
        const pSlope = this.getTrailSlope(px);

        if (idx === 0) {
          this.drawBasecampGate(ctx, px, py, cp);
        } else if (idx === m.checkpoints.length - 1) {
          if (!this.isSummit) {
            this.drawApproachingSummitSign(ctx, px, py, cp);
          }
        } else {
          this.drawPosShelter(ctx, px, py, pSlope, cp, idx);
        }
      }
    });

    // Summit Approach Notice (progress >= 85%)
    if (!this.isSummit && m.totalDistance > 0) {
      const remainingDist = m.totalDistance - this.currentDistance;
      if (remainingDist <= 350 && remainingDist > 30) {
        const signMeters = m.totalDistance - 180;
        const delta = signMeters - this.currentDistance;
        const sx = mainX + delta * scale;
        if (sx >= -100 && sx <= this.width + 100) {
          const sy = this.getTrailY(sx);
          this.drawSummitApproachNotice(ctx, sx, sy, remainingDist);
        }
      }
    }
  }

  drawBasecampGate(ctx, x, y, cp) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#3b2214';
    ctx.fillRect(-35, -75, 10, 75);
    ctx.fillRect(25, -75, 10, 75);

    ctx.fillStyle = '#5a351f';
    ctx.beginPath();
    ctx.moveTo(-45, -75);
    ctx.lineTo(0, -92);
    ctx.lineTo(45, -75);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-32, -68, 64, 22);
    ctx.strokeRect(-32, -68, 64, 22);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GERBANG SIMAKSI', 0, -56);
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(`${cp.elevation} MDPL`, 0, -49);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-2, -104, 12, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -98, 12, 6);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-3, -108, 2, 18);

    ctx.restore();
  }

  drawPosShelter(ctx, x, y, slope, cp, idx) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(slope * 0.4);

    ctx.fillStyle = '#452814';
    ctx.fillRect(-38, -6, 76, 8);

    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-34, -48, 6, 42);
    ctx.fillRect(-2, -48, 6, 42);
    ctx.fillRect(28, -48, 6, 42);

    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(-44, -46);
    ctx.lineTo(-2, -62);
    ctx.lineTo(40, -46);
    ctx.lineTo(36, -42);
    ctx.lineTo(-40, -42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-28, -40, 56, 18);
    ctx.strokeRect(-28, -40, 56, 18);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    const shortName = cp.name.length > 14 ? cp.name.substring(0, 14) : cp.name;
    ctx.fillText(shortName.toUpperCase(), 0, -30);
    ctx.font = 'bold 6.5px sans-serif';
    ctx.fillText(`${cp.elevation} mdpl`, 0, -24);

    // Warm teapot & steam
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, -14, 10, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(11, -17, 4, 3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, -18);
    ctx.quadraticCurveTo(15, -23, 12, -27);
    ctx.stroke();

    ctx.restore();
  }

  drawApproachingSummitSign(ctx, x, y, cp) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, -60, 8, 60);

    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.fillRect(-38, -65, 76, 26);
    ctx.strokeRect(-38, -65, 76, 26);

    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚩 PUNCAK DEPAN', 0, -51);
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(`${cp.elevation} MDPL`, 0, -42);

    ctx.restore();
  }

  drawSummitApproachNotice(ctx, x, y, remainingMeters) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-3, -42, 6, 42);

    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-36, -55, 72, 22);
    ctx.strokeRect(-36, -55, 72, 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`PUNCAK ${Math.round(remainingMeters)}M LAGI!`, 0, -42);
    ctx.font = 'bold 6.5px sans-serif';
    ctx.fillText('SEMANGAT YUK! 🚩', 0, -35);

    ctx.restore();
  }

  // --- NPCS RENDERING & SPEECH BUBBLE CLOUDS ---
  renderNPCs(ctx) {
    const mainX = this.width * 0.38;
    const scale = 3.5;

    this.npcs.forEach(npc => {
      const deltaMeters = npc.distance - this.currentDistance;
      const px = mainX + deltaMeters * scale;

      if (px >= -80 && px <= this.width + 80) {
        const py = this.getTrailY(px);
        const pSlope = this.getTrailSlope(px);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(pSlope * 0.6);
        this.drawNPCBody(ctx, npc);
        ctx.restore();

        if (npc.currentBubble) {
          this.drawBubbleCloud(ctx, px, py - 40, npc.currentBubble, npc.name);
        }
      }
    });
  }

  drawNPCBody(ctx, npc) {
    const type = npc.type;
    const cycle = npc.walkCycle || 0;

    if (type === 'camper_cooking') {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.quadraticCurveTo(-10, -40, 15, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, -10, 16, 10);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(22, -24, 12, 14);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(28, -28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.fillRect(21, -33, 14, 4);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(38, -8, 8, 8);
    } else if (type === 'hiker_resting') {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(-10, -12, 20, 12, 4);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.fillRect(-6, -16, 12, 10);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-5, -28, 10, 13);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -33, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-5, -38, 10, 5);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(-22, -22, 10, 22);
    } else if (type === 'trail_runner') {
      const legSwing = Math.sin(cycle) * 16;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-2, -18);
      ctx.lineTo(-legSwing * 0.8, -4);
      ctx.moveTo(2, -18);
      ctx.lineTo(legSwing * 0.8, -4);
      ctx.stroke();

      ctx.fillStyle = '#84cc16';
      ctx.fillRect(-4, -28, 8, 13);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -33, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-4, -36, 8, 3);
    } else {
      const legSwing = Math.sin(cycle) * 12;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-2, -18);
      ctx.lineTo(-legSwing * 0.6, -4);
      ctx.moveTo(2, -18);
      ctx.lineTo(legSwing * 0.6, -4);
      ctx.stroke();

      ctx.fillStyle = '#059669';
      ctx.fillRect(-15, -28, 9, 20);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-6, -26, 12, 15);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-5, -38, 10, 5);
    }
  }

  // --- REFINED SPEECH BUBBLE CLOUD (PROPORTIONATE, DYNAMIC & AUTO-WRAPPING) ---
  drawBubbleCloud(ctx, x, y, text, speakerName = '') {
    ctx.save();
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Multi-line smart word wrapping (max ~24 chars per line)
    let lines = [];
    if (text.length > 24 && text.includes(' ')) {
      const words = text.split(' ');
      let currentLine = '';
      for (const w of words) {
        if ((currentLine + ' ' + w).trim().length <= 22) {
          currentLine = (currentLine + ' ' + w).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = w;
        }
      }
      if (currentLine) lines.push(currentLine);
    } else {
      lines = [text];
    }

    // Measure maximum line width
    let maxW = 0;
    lines.forEach(l => {
      const w = ctx.measureText(l).width;
      if (w > maxW) maxW = w;
    });

    const paddingX = 14;
    const bubbleW = Math.max(90, maxW + paddingX * 2);
    const lineHeight = 15;
    const bubbleH = lines.length * lineHeight + 16;

    // Center above speaker, but clamp between screen edges
    const bx = Math.max(bubbleW / 2 + 12, Math.min(this.width - bubbleW / 2 - 12, x));
    const by = Math.max(bubbleH / 2 + 8, y - bubbleH / 2);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.roundRect(bx - bubbleW / 2 + 2, by - bubbleH / 2 + 3, bubbleW, bubbleH, 12);
    ctx.fill();

    // Cloud background
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.roundRect(bx - bubbleW / 2, by - bubbleH / 2, bubbleW, bubbleH, 12);
    ctx.fill();
    ctx.stroke();

    // Cloud puff bubbles on upper edge for organic cloud feel
    const pR = 7;
    ctx.beginPath();
    ctx.arc(bx - bubbleW * 0.25, by - bubbleH / 2, pR, Math.PI, 0);
    ctx.arc(bx, by - bubbleH / 2 - 1.5, pR + 1.5, Math.PI, 0);
    ctx.arc(bx + bubbleW * 0.25, by - bubbleH / 2, pR, Math.PI, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Pointing tail: base at cloud bottom, tip pointing to speaker head (x, y)
    const tailBaseX = Math.max(bx - bubbleW / 2 + 15, Math.min(bx + bubbleW / 2 - 15, x));
    ctx.beginPath();
    ctx.moveTo(tailBaseX - 5, by + bubbleH / 2);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(tailBaseX + 5, by + bubbleH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Cover tail seam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tailBaseX - 4, by + bubbleH / 2 - 2, 8, 3);

    // Text rendering
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const startTextY = by - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, bx, startTextY + i * lineHeight);
    });

    ctx.restore();
  }

  // --- ACTIVE EVENTS VISUALIZATION ---
  renderActiveEvents(ctx) {
    const mainX = this.width * 0.38;

    if (this.activeBuffs && this.activeBuffs.jalak > 0) {
      const birdX = mainX + 68;
      const birdY = this.getTrailY(birdX) - 10;
      const hop = Math.abs(Math.sin(Date.now() * 0.009)) * 14;

      ctx.save();
      ctx.translate(birdX, birdY - hop);

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(-2, -1, 6, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(7, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(11, -4);
      ctx.lineTo(15, -3);
      ctx.lineTo(11, -2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -4, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      for (let s = 0; s < 3; s++) {
        const sx = -12 - s * 8;
        const sy = (Math.sin(Date.now() * 0.01 + s) * 5);
        ctx.beginPath();
        ctx.arc(sx, sy, 2 - s * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- SOLO HIKER RENDERING ---
  renderHikingParty(ctx) {
    ctx.save();
    const mainX = this.width * 0.38;
    const mainY = this.getTrailY(mainX);
    const mainSlope = this.getTrailSlope(mainX);

    ctx.save();
    ctx.translate(mainX, mainY);
    ctx.rotate(mainSlope);
    const climbLean = (1 - this.summitFactor) * -0.08;
    ctx.rotate(climbLean);
    this.drawHiker(ctx, 0, 0, this.walkCycle, 'main');
    ctx.restore();

    ctx.restore();
  }

  drawHiker(ctx, x, y, cycle, role = 'main') {
    ctx.save();
    const bob = Math.sin(cycle * 2) * 2.5;
    const legSwing = Math.sin(cycle) * 14;
    const armSwing = Math.cos(cycle) * 12;

    const hipY = y - 26 + bob;

    const custom = this.customization || {
      jacketColor: '#ea580c',
      headwear: 'beanie',
      headwearColor: '#eab308',
      carrierColor: '#dc2626',
      pantsColor: '#1e293b'
    };

    // Legs / Pants
    ctx.strokeStyle = custom.pantsColor || '#1e293b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x - 2, hipY);
    ctx.lineTo(x - legSwing * 0.7, y - 6);
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.fillRect(x - legSwing * 0.7 - 4, y - 8, 10, 6);

    ctx.beginPath();
    ctx.moveTo(x + 2, hipY);
    ctx.lineTo(x + legSwing * 0.7, y - 6);
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + legSwing * 0.7 - 2, y - 8, 10, 6);

    // Carrier Backpack 60L
    ctx.fillStyle = custom.carrierColor || '#dc2626';
    ctx.beginPath();
    ctx.roundRect(x - 22, hipY - 24, 15, 28, 4);
    ctx.fill();

    // Matras foam
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x - 24, hipY - 29, 18, 6);

    // Torso / Windbreaker
    ctx.fillStyle = custom.jacketColor || '#ea580c';
    ctx.beginPath();
    ctx.roundRect(x - 8, hipY - 22, 16, 22, 3);
    ctx.fill();

    // Carrier harness strap
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, hipY - 20);
    ctx.lineTo(x - 4, hipY - 4);
    ctx.stroke();

    // Head
    const headY = hipY - 30;
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(x + 2, headY, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 3, headY - 2, 6, 3);

    // Headwear
    const hwType = custom.headwear || 'beanie';
    const hwColor = custom.headwearColor || '#eab308';

    if (hwType === 'bucket') {
      ctx.fillStyle = hwColor;
      ctx.beginPath();
      ctx.ellipse(x + 2, headY - 3, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 4, headY - 9, 12, 7);
    } else if (hwType === 'bandana') {
      ctx.fillStyle = hwColor;
      ctx.fillRect(x - 4, headY - 7, 13, 5);
    } else if (hwType === 'headlamp') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 4, headY - 6, 12, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 6, headY - 7, 4, 6);
    } else {
      ctx.fillStyle = hwColor;
      ctx.beginPath();
      ctx.arc(x + 1, headY - 3, 8.5, Math.PI, 0);
      ctx.lineTo(x + 9, headY - 1);
      ctx.lineTo(x - 7, headY - 1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 1, headY - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arms & Trekking Pole
    ctx.strokeStyle = custom.jacketColor || '#991b1b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 4, hipY - 18);
    ctx.lineTo(x + 10 + armSwing * 0.4, hipY - 4);
    ctx.stroke();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 11 + armSwing * 0.4, hipY - 12);
    ctx.lineTo(x + 16 - armSwing * 0.8, y - 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 10 + armSwing * 0.4, hipY - 14, 3, 6);
    ctx.fillRect(x + 14 - armSwing * 0.8, y - 8, 6, 2);

    ctx.restore();
  }

  // --- RESTING / CAMP MODE ---
  renderCampSite(ctx) {
    ctx.save();
    const campX = this.width * 0.38;
    const campY = this.getTrailY(campX);

    ctx.fillStyle = '#54361e';
    ctx.beginPath();
    ctx.roundRect(campX - 70, campY - 5, 175, 12, 4);
    ctx.fill();

    // Dome Tent
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(campX - 60, campY);
    ctx.quadraticCurveTo(campX - 15, campY - 58, campX + 30, campY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(campX - 35, campY);
    ctx.quadraticCurveTo(campX - 15, campY - 42, campX + 5, campY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(campX - 60, campY);
    ctx.quadraticCurveTo(campX - 15, campY - 58, campX + 30, campY);
    ctx.stroke();

    // Campfire
    const fireX = campX + 75;
    ctx.fillStyle = '#78716c';
    for (let r = 0; r < 5; r++) {
      ctx.beginPath();
      ctx.arc(fireX - 14 + r * 7, campY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(fireX - 12, campY - 7, 24, 5);

    const flameH = 15 + Math.sin(Date.now() * 0.02) * 5;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(fireX - 8, campY - 6);
    ctx.lineTo(fireX, campY - 6 - flameH);
    ctx.lineTo(fireX + 8, campY - 6);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(fireX - 4, campY - 6);
    ctx.lineTo(fireX, campY - 6 - flameH * 0.6);
    ctx.lineTo(fireX + 4, campY - 6);
    ctx.fill();

    // Smoke
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    for (let s = 0; s < 3; s++) {
      const smokeY = campY - 20 - s * 16 - ((Date.now() * 0.03) % 20);
      const smokeX = fireX + Math.sin(smokeY * 0.08) * 8;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 6 + s * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Solo Hiker sitting by campfire drinking coffee
    const custom = this.customization || {};
    const sitX = fireX + 42;
    ctx.fillStyle = custom.jacketColor || '#ea580c';
    ctx.fillRect(sitX - 7, campY - 20, 14, 16);
    ctx.fillStyle = custom.pantsColor || '#1e293b';
    ctx.fillRect(sitX - 12, campY - 7, 22, 7);
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(sitX, campY - 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = custom.headwearColor || '#eab308';
    ctx.fillRect(sitX - 6, campY - 32, 12, 6);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(sitX - 12, campY - 14, 6, 7);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sitX - 9, campY - 16);
    ctx.quadraticCurveTo(sitX - 7, campY - 22, sitX - 10, campY - 26);
    ctx.stroke();

    ctx.restore();
  }

  // --- SUMMIT CELEBRATION (Solo Summit Hero) ---
  renderSummitCelebration(ctx) {
    ctx.save();
    const sumX = this.width * 0.46;
    const sumY = this.getTrailY(sumX);

    // Tugu Triangulasi
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.fillRect(sumX - 14, sumY - 72, 28, 72);
    ctx.strokeRect(sumX - 14, sumY - 72, 28, 72);

    ctx.beginPath();
    ctx.moveTo(sumX - 14, sumY - 72);
    ctx.lineTo(sumX, sumY - 84);
    ctx.lineTo(sumX + 14, sumY - 72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PUNCAK', sumX, sumY - 48);
    const elev = this.currentMountain?.elevation || 2565;
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`${elev} MDPL`, sumX, sumY - 36);

    // Bendera Merah Putih
    const flagPoleX = sumX + 38;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(flagPoleX, sumY - 110, 4, 110);

    const flagWave = Math.sin(Date.now() * 0.007) * 5;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(flagPoleX + 4, sumY - 110);
    ctx.quadraticCurveTo(flagPoleX + 24, sumY - 110 + flagWave, flagPoleX + 46, sumY - 110);
    ctx.lineTo(flagPoleX + 46, sumY - 94);
    ctx.quadraticCurveTo(flagPoleX + 24, sumY - 94 + flagWave, flagPoleX + 4, sumY - 94);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(flagPoleX + 4, sumY - 94);
    ctx.quadraticCurveTo(flagPoleX + 24, sumY - 94 + flagWave, flagPoleX + 46, sumY - 94);
    ctx.lineTo(flagPoleX + 46, sumY - 78);
    ctx.quadraticCurveTo(flagPoleX + 24, sumY - 78 + flagWave, flagPoleX + 4, sumY - 78);
    ctx.closePath();
    ctx.fill();

    // Solo Hiker Cheering
    this.drawCheeringHiker(ctx, sumX - 35, sumY);

    // Confetti
    for (let c = 0; c < 30; c++) {
      const confX = (sumX - 120 + (c * 19 + Date.now() * 0.04) % 260);
      const confY = (sumY - 160 + (c * 23 + Date.now() * 0.06) % 150);
      ctx.fillStyle = ['#f43f5e', '#fbbf24', '#38bdf8', '#4ade80', '#e879f9', '#ffffff'][c % 6];
      ctx.fillRect(confX, confY, 4, 4);
    }

    ctx.restore();
  }

  drawCheeringHiker(ctx, x, y) {
    ctx.save();
    const custom = this.customization || {};

    ctx.fillStyle = custom.jacketColor || '#ea580c';
    ctx.fillRect(x - 7, y - 36, 14, 22);

    ctx.fillStyle = custom.pantsColor || '#1e293b';
    ctx.fillRect(x - 6, y - 16, 5, 16);
    ctx.fillRect(x + 1, y - 16, 5, 16);

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(x, y - 43, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = custom.headwearColor || '#eab308';
    ctx.fillRect(x - 6, y - 50, 12, 7);

    ctx.strokeStyle = custom.jacketColor || '#ea580c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 32);
    ctx.lineTo(x - 16, y - 52);
    ctx.moveTo(x + 6, y - 32);
    ctx.lineTo(x + 16, y - 52);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - 28, y - 58, 12, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 28, y - 53, 12, 5);

    ctx.restore();
  }

  // --- WEATHER & PARTICLES ---
  renderWeather(ctx) {
    ctx.save();
    if (this.weather === 'rainy') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.2;
      this.weatherParticles.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 4, p.y + 12);
        ctx.stroke();
      });
    } else if (this.weather === 'foggy') {
      const fogGrad = ctx.createLinearGradient(0, this.height - 180, 0, this.height);
      fogGrad.addColorStop(0, 'rgba(241, 245, 249, 0)');
      fogGrad.addColorStop(0.5, 'rgba(241, 245, 249, 0.55)');
      fogGrad.addColorStop(1, 'rgba(241, 245, 249, 0.7)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, this.height - 180, this.width, 180);
    } else {
      this.weatherParticles.forEach(p => {
        ctx.fillStyle = p.type === 'petal' ? '#fef08a' : '#ea580c';
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  renderStepParticles(ctx) {
    ctx.save();
    this.stepParticles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';

    this.floatingTexts.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();
  }

  lerpColor(a, b, amount) {
    const ah = parseInt(a.replace(/#/g, ''), 16);
    const ar = (ah >> 16) & 255;
    const ag = (ah >> 8) & 255;
    const ab = ah & 255;

    const bh = parseInt(b.replace(/#/g, ''), 16);
    const br = (bh >> 16) & 255;
    const bg = (bh >> 8) & 255;
    const bb = bh & 255;

    const rr = Math.round(ar + amount * (br - ar));
    const rg = Math.round(ag + amount * (bg - ag));
    const rb = Math.round(ab + amount * (bb - ab));

    return `rgb(${rr}, ${rg}, ${rb})`;
  }
}
