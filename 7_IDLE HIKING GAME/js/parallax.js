// Parallax 2D Side-Scrolling Canvas Engine
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

    // Scroll offset
    this.scrollX = 0;
    this.worldDistance = 0; // meter traversed

    // Environment & Time
    this.timeOfDay = 0.25; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    this.timeSpeed = 0.0003;
    this.weather = 'sunny'; // 'sunny', 'foggy', 'rainy', 'golden'
    this.weatherTimer = 0;

    // Characters state
    this.walkCycle = 0;
    this.isResting = false;
    this.isSummit = false;
    this.stepParticles = [];
    this.floatingTexts = [];
    this.weatherParticles = [];

    // Current mountain info
    this.currentMountain = MOUNTAIN_DATA[0];

    // Seeded random mountains & terrain
    this.initTerrainData();
    this.initWeatherParticles();
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = Math.min(480, Math.max(340, rect.width * 0.48));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initWeatherParticles() {
    this.weatherParticles = [];
    for (let i = 0; i < 70; i++) {
      this.weatherParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speedX: -1 - Math.random() * 2,
        speedY: 0.5 + Math.random() * 1.5,
        size: 1.5 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.6,
        type: Math.random() > 0.4 ? 'leaf' : 'petal' // edelweiss petal or leaf
      });
    }
  }

  initTerrainData() {
    // Generate layered mountain silhouettes
    this.farPeaks = [];
    for (let i = 0; i < 30; i++) {
      this.farPeaks.push({
        x: i * 320,
        height: 180 + Math.sin(i * 1.3) * 60 + Math.random() * 40,
        width: 450 + Math.random() * 120,
        isVolcano: i % 2 === 0
      });
    }

    this.midHills = [];
    for (let i = 0; i < 40; i++) {
      this.midHills.push({
        x: i * 190,
        height: 120 + Math.sin(i * 1.8) * 45 + Math.random() * 30,
        width: 310 + Math.random() * 80,
        trees: Math.floor(6 + Math.random() * 8)
      });
    }

    this.nearHills = [];
    for (let i = 0; i < 50; i++) {
      this.nearHills.push({
        x: i * 140,
        height: 70 + Math.sin(i * 2.1) * 30 + Math.random() * 20,
        width: 210 + Math.random() * 60,
        flowers: Math.floor(4 + Math.random() * 6)
      });
    }

    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      this.clouds.push({
        x: Math.random() * 1800,
        y: 20 + Math.random() * 110,
        scale: 0.6 + Math.random() * 0.9,
        speed: 0.2 + Math.random() * 0.4,
        alpha: 0.4 + Math.random() * 0.45
      });
    }

    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * 1600,
        y: Math.random() * 180,
        radius: 0.8 + Math.random() * 1.6,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  setMountain(mountain) {
    this.currentMountain = mountain;
  }

  update(speedMps, deltaMs) {
    const deltaSec = deltaMs / 1000;

    // Time cycle progression
    this.timeOfDay = (this.timeOfDay + this.timeSpeed * deltaSec * 10) % 1.0;

    // Weather change routine
    this.weatherTimer += deltaSec;
    if (this.weatherTimer > 45) {
      this.weatherTimer = 0;
      const weathers = ['sunny', 'sunny', 'golden', 'foggy', 'rainy'];
      this.weather = weathers[Math.floor(Math.random() * weathers.length)];
    }

    // Scroll motion when walking
    if (!this.isResting && speedMps > 0) {
      const pixelMovement = speedMps * deltaSec * 28; // visual scale
      this.scrollX += pixelMovement;
      this.worldDistance += speedMps * deltaSec;
      this.walkCycle += speedMps * deltaSec * 5.2;

      // Add footstep particles occasionally
      if (Math.sin(this.walkCycle) > 0.85 && Math.random() < 0.4) {
        this.addStepDust(this.width * 0.25, this.height - 48);
        if (typeof mountainAudio !== 'undefined') {
          mountainAudio.playStep();
          if (Math.random() < 0.3) mountainAudio.playPole();
        }
      }
    } else if (this.isResting) {
      this.walkCycle = 0;
    }

    // Update clouds
    this.clouds.forEach(c => {
      c.x -= c.speed * 0.8;
      if (c.x < -250) c.x = this.width + 250;
    });

    // Update weather particles
    const windSpeed = this.weather === 'rainy' ? 4 : (this.weather === 'foggy' ? 0.8 : 2);
    this.weatherParticles.forEach(p => {
      p.x -= (windSpeed + (speedMps > 0 ? 1 : 0)) * 0.7;
      p.y += (this.weather === 'rainy' ? 8 : p.speedY) * 0.6;
      if (p.x < -30) p.x = this.width + 30;
      if (p.y > this.height) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }
    });

    // Update step dust particles
    for (let i = this.stepParticles.length - 1; i >= 0; i--) {
      const part = this.stepParticles[i];
      part.x -= (speedMps > 0 ? 1.5 : 0.5);
      part.y += part.vy;
      part.alpha -= 0.035;
      part.size += 0.15;
      if (part.alpha <= 0) {
        this.stepParticles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.8;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  addStepDust(x, y) {
    for (let i = 0; i < 3; i++) {
      this.stepParticles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + 8,
        vy: -0.3 - Math.random() * 0.4,
        size: 3 + Math.random() * 3,
        alpha: 0.6 + Math.random() * 0.3,
        color: '#c2a688'
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#fbbf24') {
    this.floatingTexts.push({
      text: text,
      x: x || (this.width * 0.28 + (Math.random() * 40 - 20)),
      y: y || (this.height - 110),
      alpha: 1.0,
      color: color
    });
  }

  // --- RENDERING PIPELINE ---

  render(partyMembers = []) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky & Gradient
    this.renderSky(ctx);

    // 2. Stars & Moon / Sun
    this.renderCelestial(ctx);

    // 3. Distant Clouds
    this.renderClouds(ctx, 0.15);

    // 4. Parallax Layer 1: Distant Volcano Silhouette Peaks (Speed 0.05)
    this.renderFarPeaks(ctx);

    // 5. Parallax Layer 2: Mid-Distance Pine Forests & Ridges (Speed 0.15)
    this.renderMidHills(ctx);

    // 6. Parallax Layer 3: Closer Savanna & Hills with Edelweiss (Speed 0.4)
    this.renderNearHills(ctx);

    // 7. Parallax Layer 4: Foreground Hiking Trail Path (Speed 1.0)
    this.renderTrail(ctx);

    // 8. Hiking Party / Campsite / Summit
    if (this.isSummit) {
      this.renderSummitCelebration(ctx);
    } else if (this.isResting) {
      this.renderCampSite(ctx, partyMembers);
    } else {
      this.renderHikingParty(ctx, partyMembers);
    }

    // 9. Weather Particles & Atmospheric Mist
    this.renderWeather(ctx);

    // 10. Step Particles
    this.renderStepParticles(ctx);

    // 11. Floating Tap Popups (+10m, +Rp 2500)
    this.renderFloatingTexts(ctx);
  }

  renderSky(ctx) {
    const t = this.timeOfDay;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);

    // Color interpolation for 4 times: Subuh (0.25), Siang (0.5), Sore (0.75), Malam (0.0/1.0)
    if (t < 0.25) {
      // Malam to Subuh
      const factor = t / 0.25;
      grad.addColorStop(0, this.lerpColor('#090d16', '#211832', factor));
      grad.addColorStop(0.5, this.lerpColor('#111827', '#5b2b4d', factor));
      grad.addColorStop(1, this.lerpColor('#1f2937', '#e87248', factor));
    } else if (t < 0.5) {
      // Subuh to Siang
      const factor = (t - 0.25) / 0.25;
      grad.addColorStop(0, this.lerpColor('#211832', '#38bdf8', factor));
      grad.addColorStop(0.5, this.lerpColor('#5b2b4d', '#7dd3fc', factor));
      grad.addColorStop(1, this.lerpColor('#e87248', '#bae6fd', factor));
    } else if (t < 0.75) {
      // Siang to Sore (Sunset)
      const factor = (t - 0.5) / 0.25;
      grad.addColorStop(0, this.lerpColor('#38bdf8', '#3b0764', factor));
      grad.addColorStop(0.4, this.lerpColor('#7dd3fc', '#d946ef', factor));
      grad.addColorStop(0.8, this.lerpColor('#bae6fd', '#f97316', factor));
      grad.addColorStop(1, this.lerpColor('#e0f2fe', '#fde047', factor));
    } else {
      // Sore to Malam
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

    // Stars at night
    if (t < 0.3 || t > 0.7) {
      const starAlpha = t < 0.3 ? (1 - t / 0.3) : ((t - 0.7) / 0.3);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      this.stars.forEach(s => {
        const twinkle = Math.sin(Date.now() * s.twinkleSpeed + s.phase) * 0.4 + 0.6;
        ctx.globalAlpha = starAlpha * twinkle;
        ctx.beginPath();
        ctx.arc(s.x % this.width, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Sun / Moon path
    ctx.save();
    // Sun visible 0.2 to 0.8
    if (t >= 0.2 && t <= 0.8) {
      const sunProgress = (t - 0.2) / 0.6; // 0 to 1
      const sunX = this.width * 0.15 + sunProgress * (this.width * 0.7);
      const sunY = this.height * 0.65 - Math.sin(sunProgress * Math.PI) * (this.height * 0.48);

      // Sun glow
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 70);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.5)');
      sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Sun disk
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Moon
      const moonProgress = t > 0.8 ? (t - 0.8) / 0.4 : (t + 0.2) / 0.4;
      const moonX = this.width * 0.2 + moonProgress * (this.width * 0.6);
      const moonY = this.height * 0.55 - Math.sin(moonProgress * Math.PI) * (this.height * 0.4);

      // Moon glow
      ctx.fillStyle = 'rgba(224, 231, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
      ctx.fill();

      // Crescent Moon
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

  renderFarPeaks(ctx) {
    ctx.save();
    const speed = 0.05;
    const offset = (this.scrollX * speed) % 600;
    const baseY = this.height - 110;

    // Atmospheric silhouette tone
    const t = this.timeOfDay;
    let peakColor = '#3b4252';
    if (t >= 0.2 && t <= 0.3) peakColor = '#593959'; // Sunrise tint
    else if (t > 0.3 && t < 0.7) peakColor = '#475569'; // Day slate
    else if (t >= 0.7 && t <= 0.8) peakColor = '#4c284e'; // Sunset plum
    else peakColor = '#1e2433'; // Night

    ctx.fillStyle = peakColor;

    ctx.beginPath();
    ctx.moveTo(-100, this.height);

    const stepW = 120;
    const startX = -offset - 200;
    for (let x = startX; x < this.width + 300; x += stepW) {
      const idx = Math.floor((x + offset + 200) / stepW);
      // Indonesian stratovolcano conical peak profile
      const isVolcano = idx % 3 === 0;
      const h = isVolcano ? 190 : 130 + Math.sin(idx * 2) * 40;

      ctx.lineTo(x, baseY - h * 0.4);
      // Volcano crater rim or conical summit
      ctx.lineTo(x + stepW * 0.45, baseY - h);
      if (isVolcano) {
        // Flat caldera rim
        ctx.lineTo(x + stepW * 0.55, baseY - h * 0.96);
      }
      ctx.lineTo(x + stepW, baseY - h * 0.3);
    }

    ctx.lineTo(this.width + 100, this.height);
    ctx.closePath();
    ctx.fill();

    // Haze gradient overlay
    const haze = ctx.createLinearGradient(0, baseY - 120, 0, this.height);
    haze.addColorStop(0, 'rgba(255, 255, 255, 0)');
    haze.addColorStop(1, 'rgba(255, 255, 255, 0.35)');
    ctx.fillStyle = haze;
    ctx.fill();

    ctx.restore();
  }

  renderMidHills(ctx) {
    ctx.save();
    const speed = 0.18;
    const offset = (this.scrollX * speed) % 500;
    const baseY = this.height - 65;

    const t = this.timeOfDay;
    let hillColor = '#2d4a3e'; // Pine green
    if (t < 0.25 || t > 0.75) hillColor = '#152520'; // Night deep green
    else if (t >= 0.7 && t <= 0.75) hillColor = '#3a2b38';

    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(-100, this.height);

    const stepW = 90;
    const startX = -offset - 200;
    for (let x = startX; x < this.width + 250; x += stepW) {
      const idx = Math.floor((x + offset + 200) / stepW);
      const h = 75 + Math.sin(idx * 1.5) * 35;
      const midX = x + stepW * 0.5;

      ctx.quadraticCurveTo(midX, baseY - h, x + stepW, baseY - 20);
    }
    ctx.lineTo(this.width + 100, this.height);
    ctx.closePath();
    ctx.fill();

    // Draw silhouette pine trees (Cemara Gunung) on ridges
    ctx.fillStyle = this.lerpColor(hillColor, '#0a1410', 0.4);
    for (let x = startX; x < this.width + 250; x += 32) {
      const idx = Math.floor((x + offset + 200) / stepW);
      const h = 65 + Math.sin(idx * 1.5) * 30;
      const ty = baseY - h + 15;
      this.drawPineTree(ctx, x, ty, 16);
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
    const speed = 0.45;
    const offset = (this.scrollX * speed) % 400;
    const baseY = this.height - 35;

    const t = this.timeOfDay;
    let nearColor = '#4a7c59'; // Mountain slope green
    if (t < 0.25 || t > 0.75) nearColor = '#1b3324';
    else if (t >= 0.25 && t <= 0.3) nearColor = '#606a40';

    ctx.fillStyle = nearColor;
    ctx.beginPath();
    ctx.moveTo(-100, this.height);

    const stepW = 80;
    const startX = -offset - 200;
    for (let x = startX; x < this.width + 200; x += stepW) {
      const idx = Math.floor((x + offset + 200) / stepW);
      const h = 45 + Math.sin(idx * 2.2) * 22;
      ctx.quadraticCurveTo(x + stepW * 0.5, baseY - h, x + stepW, baseY);
    }
    ctx.lineTo(this.width + 100, this.height);
    ctx.closePath();
    ctx.fill();

    // Draw clumps of white Edelweiss & mountain flowers
    for (let x = startX; x < this.width + 200; x += 55) {
      const idx = Math.floor((x + offset + 200) / stepW);
      const h = 35 + Math.sin(idx * 2.2) * 18;
      this.drawEdelweissClump(ctx, x, baseY - h + 6);
    }

    ctx.restore();
  }

  drawEdelweissClump(ctx, x, y) {
    ctx.save();
    // Stems
    ctx.strokeStyle = '#2d5a3c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y - 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3, y - 10);
    ctx.stroke();

    // White woolly petals
    ctx.fillStyle = '#fefce8';
    ctx.beginPath();
    ctx.arc(x - 3, y - 9, 3.5, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 11, 4, 0, Math.PI * 2);
    ctx.fill();

    // Yellow pollen center
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(x - 3, y - 9, 1.2, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 11, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderTrail(ctx) {
    ctx.save();
    const trailY = this.height - 45;

    // Trail base ground
    const groundGrad = ctx.createLinearGradient(0, trailY, 0, this.height);
    groundGrad.addColorStop(0, '#8c6b4f'); // Mountain dirt brown
    groundGrad.addColorStop(0.2, '#6b4f35');
    groundGrad.addColorStop(1, '#3d2b1f');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, trailY, this.width, 45);

    // Trail edge grass & stones
    const offset = (this.scrollX) % 120;
    ctx.fillStyle = '#557a46';
    for (let x = -offset; x < this.width + 40; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, trailY);
      ctx.lineTo(x + 4, trailY - 6 - Math.abs(x % 5));
      ctx.lineTo(x + 8, trailY);
      ctx.fill();
    }

    // Rocky dirt texture on the path
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let x = -offset; x < this.width + 60; x += 35) {
      const pebbleY = trailY + 12 + Math.abs((x * 7) % 24);
      const radius = 2.0 + Math.abs(x % 3);
      ctx.beginPath();
      ctx.arc(x, pebbleY, Math.max(1, radius), 0, Math.PI * 2);
      ctx.fill();
    }

    // Wooden Trail Markers / Kilometre Posts scrolling by
    const markerInterval = 450;
    const markerOffset = (this.scrollX) % markerInterval;
    for (let mx = this.width - markerOffset; mx > -100; mx -= markerInterval) {
      this.drawTrailMarker(ctx, mx, trailY);
    }

    ctx.restore();
  }

  drawTrailMarker(ctx, x, y) {
    ctx.save();
    // Wooden post
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y - 36, 8, 36);

    // Signboard
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 22, y - 48, 52, 20);
    ctx.strokeRect(x - 22, y - 48, 52, 20);

    // Text on sign
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('JALUR ▲', x - 18, y - 35);
    ctx.restore();
  }

  // --- HIKING CHARACTERS RENDERING ---

  renderHikingParty(ctx, partyMembers) {
    ctx.save();
    const trailY = this.height - 45;

    // Leader / Main Hiker position
    const mainX = this.width * 0.32;
    this.drawHiker(ctx, mainX, trailY, this.walkCycle, 'main');

    // Party companions trailing behind
    let spacing = 48;
    partyMembers.forEach((member, idx) => {
      if (member.count > 0) {
        const compX = mainX - (idx + 1) * spacing;
        if (compX > 20) {
          const compCycle = this.walkCycle + (idx + 1) * 0.9;
          this.drawCompanion(ctx, compX, trailY, compCycle, member.type);
        }
      }
    });

    ctx.restore();
  }

  drawHiker(ctx, x, y, cycle, role = 'main') {
    ctx.save();
    const bob = Math.sin(cycle * 2) * 2.5; // Walking bounce
    const legSwing = Math.sin(cycle) * 14;
    const armSwing = Math.cos(cycle) * 12;

    const hipY = y - 26 + bob;

    // Legs / Boots
    ctx.strokeStyle = '#1e293b'; // Hiking pants
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Back leg
    ctx.beginPath();
    ctx.moveTo(x - 2, hipY);
    ctx.lineTo(x - legSwing * 0.7, y - 6);
    ctx.stroke();

    // Back boot
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x - legSwing * 0.7 - 4, y - 8, 10, 6);

    // Front leg
    ctx.beginPath();
    ctx.moveTo(x + 2, hipY);
    ctx.lineTo(x + legSwing * 0.7, y - 6);
    ctx.stroke();

    // Front boot
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + legSwing * 0.7 - 2, y - 8, 10, 6);

    // Backpack (Carrier 60L) - Iconic outdoor look
    ctx.fillStyle = '#dc2626'; // Bright Red carrier
    ctx.beginPath();
    ctx.roundRect(x - 22, hipY - 24, 15, 28, 4);
    ctx.fill();

    // Sleeping matras foam rolled on top of carrier
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x - 24, hipY - 29, 18, 6);

    // Torso / Windbreaker jacket
    ctx.fillStyle = '#ea580c'; // Orange outdoor jacket
    ctx.beginPath();
    ctx.roundRect(x - 8, hipY - 22, 16, 22, 3);
    ctx.fill();

    // Backpack harness straps
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, hipY - 20);
    ctx.lineTo(x - 4, hipY - 4);
    ctx.stroke();

    // Head & Warm Beanie
    const headY = hipY - 30;
    // Face skin
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(x + 2, headY, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Sunglasses / Buff
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 3, headY - 2, 6, 3);

    // Kupluk / Outdoor Beanie
    ctx.fillStyle = '#eab308'; // Yellow beanie
    ctx.beginPath();
    ctx.arc(x + 1, headY - 3, 8.5, Math.PI, 0);
    ctx.lineTo(x + 9, headY - 1);
    ctx.lineTo(x - 7, headY - 1);
    ctx.closePath();
    ctx.fill();
    // Beanie pompom
    ctx.beginPath();
    ctx.arc(x + 1, headY - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Arms & Trekking Pole
    // Back arm holding trekking pole
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 4, hipY - 18);
    ctx.lineTo(x + 10 + armSwing * 0.4, hipY - 4);
    ctx.stroke();

    // Trekking Pole shaft
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 11 + armSwing * 0.4, hipY - 12);
    ctx.lineTo(x + 16 - armSwing * 0.8, y - 2);
    ctx.stroke();
    // Pole handle & basket
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 10 + armSwing * 0.4, hipY - 14, 3, 6);
    ctx.fillRect(x + 14 - armSwing * 0.8, y - 8, 6, 2);

    ctx.restore();
  }

  drawCompanion(ctx, x, y, cycle, type) {
    ctx.save();
    const bob = Math.sin(cycle * 2) * 2;
    const legSwing = Math.sin(cycle) * 11;
    const hipY = y - 24 + bob;

    // Legs
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 2, hipY);
    ctx.lineTo(x - legSwing * 0.6, y - 5);
    ctx.moveTo(x + 2, hipY);
    ctx.lineTo(x + legSwing * 0.6, y - 5);
    ctx.stroke();

    if (type === 'porter') {
      // Porter lokal dengan keranjang rotan / karung logistik
      ctx.fillStyle = '#b45309'; // Anyaman bambu
      ctx.fillRect(x - 18, hipY - 26, 14, 26);
      // Kaos loreng / biru
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x - 6, hipY - 18, 12, 18);
      // Caping / topi rimba
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(x + 2, hipY - 24, 6, 0, Math.PI * 2);
      ctx.fill();
      // Caping segitiga
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(x - 8, hipY - 27);
      ctx.lineTo(x + 2, hipY - 36);
      ctx.lineTo(x + 12, hipY - 27);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'guide') {
      // Ranger / Guide Taman Nasional
      ctx.fillStyle = '#166534'; // Green uniform
      ctx.fillRect(x - 6, hipY - 18, 12, 18);
      // Ransel kecil
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(x - 14, hipY - 18, 8, 16);
      // Topi rimba
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(x + 2, hipY - 24, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x - 7, hipY - 28, 18, 4);
    } else if (type === 'photographer') {
      // Fotografer dengan kamera DSLR
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(x - 6, hipY - 18, 12, 18);
      // Daypack
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x - 14, hipY - 18, 8, 16);
      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(x + 2, hipY - 24, 6, 0, Math.PI * 2);
      ctx.fill();
      // Kamera tergantung
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x + 4, hipY - 12, 7, 5);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, hipY - 12, 7, 5);
    } else {
      // Teman pendaki santai
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(x - 6, hipY - 18, 12, 18);
      ctx.fillStyle = '#059669';
      ctx.fillRect(x - 13, hipY - 18, 7, 16);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(x + 2, hipY - 24, 6, 0, Math.PI * 2);
      ctx.fill();
      // Bandana
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x - 4, hipY - 28, 12, 3);
    }

    ctx.restore();
  }

  // --- RESTING / CAMP MODE ---

  renderCampSite(ctx, partyMembers) {
    ctx.save();
    const trailY = this.height - 45;
    const campX = this.width * 0.38;

    // Tenda Dome Kuning-Oranye
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(campX - 60, trailY);
    ctx.quadraticCurveTo(campX - 15, trailY - 60, campX + 30, trailY);
    ctx.closePath();
    ctx.fill();

    // Pintu tenda terbuka
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(campX - 35, trailY);
    ctx.quadraticCurveTo(campX - 15, trailY - 45, campX + 5, trailY);
    ctx.closePath();
    ctx.fill();

    // Rangka tenda
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(campX - 60, trailY);
    ctx.quadraticCurveTo(campX - 15, trailY - 60, campX + 30, trailY);
    ctx.stroke();

    // Api Unggun (Campfire)
    const fireX = campX + 75;
    // Batu melingkar
    ctx.fillStyle = '#64748b';
    for (let r = 0; r < 5; r++) {
      ctx.beginPath();
      ctx.arc(fireX - 14 + r * 7, trailY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Kayu bakar
    ctx.fillStyle = '#78350f';
    ctx.fillRect(fireX - 12, trailY - 7, 24, 5);

    // Lidah api bergerak
    const flameH = 14 + Math.sin(Date.now() * 0.02) * 5;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(fireX - 8, trailY - 6);
    ctx.lineTo(fireX, trailY - 6 - flameH);
    ctx.lineTo(fireX + 8, trailY - 6);
    ctx.fill();
    // Inti api kuning
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(fireX - 4, trailY - 6);
    ctx.lineTo(fireX, trailY - 6 - flameH * 0.6);
    ctx.lineTo(fireX + 4, trailY - 6);
    ctx.fill();

    // Asap api unggun mengepul
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    for (let s = 0; s < 3; s++) {
      const smokeY = trailY - 20 - s * 16 - ((Date.now() * 0.03) % 20);
      const smokeX = fireX + Math.sin(smokeY * 0.08) * 8;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 6 + s * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pendaki duduk santai minum kopi
    const sitX = fireX + 42;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(sitX - 7, trailY - 20, 14, 16);
    // Kaki bersila
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sitX - 12, trailY - 7, 22, 7);
    // Kepala
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(sitX, trailY - 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(sitX - 6, trailY - 32, 12, 6);
    // Cangkir enamel kopi mengepul
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(sitX - 12, trailY - 14, 6, 7);
    // Uap kopi
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sitX - 9, trailY - 16);
    ctx.quadraticCurveTo(sitX - 7, trailY - 22, sitX - 10, trailY - 26);
    ctx.stroke();

    // Nesting / Kompor gas portable
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(fireX - 30, trailY - 12, 12, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(fireX - 32, trailY - 2, 16, 3);

    ctx.restore();
  }

  // --- SUMMIT CELEBRATION ---

  renderSummitCelebration(ctx) {
    ctx.save();
    const trailY = this.height - 45;
    const sumX = this.width * 0.45;

    // Tugu Puncak / Triangulasi
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(sumX - 8, trailY - 60, 16, 60);
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('PUNCAK', sumX - 18, trailY - 65);

    // Tiang Bendera Merah Putih
    ctx.fillStyle = '#64748b';
    ctx.fillRect(sumX + 40, trailY - 95, 4, 95);

    // Bendera Merah Putih berkibar
    const flagWave = Math.sin(Date.now() * 0.008) * 4;
    // Merah
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(sumX + 44, trailY - 95);
    ctx.quadraticCurveTo(sumX + 65, trailY - 95 + flagWave, sumX + 85, trailY - 95);
    ctx.lineTo(sumX + 85, trailY - 80);
    ctx.quadraticCurveTo(sumX + 65, trailY - 80 + flagWave, sumX + 44, trailY - 80);
    ctx.closePath();
    ctx.fill();

    // Putih
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sumX + 44, trailY - 80);
    ctx.quadraticCurveTo(sumX + 65, trailY - 80 + flagWave, sumX + 85, trailY - 80);
    ctx.lineTo(sumX + 85, trailY - 65);
    ctx.quadraticCurveTo(sumX + 65, trailY - 65 + flagWave, sumX + 44, trailY - 65);
    ctx.closePath();
    ctx.fill();

    // Pendaki bersorak kedua tangan ke atas!
    this.drawCheeringHiker(ctx, sumX + 16, trailY);

    // Confetti bertaburan
    for (let c = 0; c < 25; c++) {
      const confX = (sumX - 80 + (c * 17 + Date.now() * 0.05) % 200);
      const confY = (trailY - 140 + (c * 23 + Date.now() * 0.08) % 130);
      ctx.fillStyle = ['#f43f5e', '#fbbf24', '#38bdf8', '#4ade80', '#c084fc'][c % 5];
      ctx.fillRect(confX, confY, 4, 4);
    }

    ctx.restore();
  }

  drawCheeringHiker(ctx, x, y) {
    ctx.save();
    // Torso
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x - 7, y - 36, 14, 22);

    // Celana
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 6, y - 16, 5, 16);
    ctx.fillRect(x + 1, y - 16, 5, 16);

    // Kepala
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(x, y - 43, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x - 6, y - 50, 12, 7);

    // Kedua tangan terangkat ke atas bentuk V (Victory)
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 32);
    ctx.lineTo(x - 16, y - 52);
    ctx.moveTo(x + 6, y - 32);
    ctx.lineTo(x + 16, y - 52);
    ctx.stroke();

    ctx.restore();
  }

  // --- WEATHER & PARTICLES ---

  renderWeather(ctx) {
    ctx.save();
    if (this.weather === 'rainy') {
      // Hujan dingin gunung
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.2;
      this.weatherParticles.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 4, p.y + 12);
        ctx.stroke();
      });
    } else if (this.weather === 'foggy') {
      // Kabut tebal mengalir
      const fogGrad = ctx.createLinearGradient(0, this.height - 180, 0, this.height);
      fogGrad.addColorStop(0, 'rgba(241, 245, 249, 0)');
      fogGrad.addColorStop(0.5, 'rgba(241, 245, 249, 0.55)');
      fogGrad.addColorStop(1, 'rgba(241, 245, 249, 0.7)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, this.height - 180, this.width, 180);
    } else {
      // Petals & autumn mountain leaves drifting
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
    ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
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

  // --- UTILS ---

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
