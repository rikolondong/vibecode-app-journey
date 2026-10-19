// WWII Submarine Attack Periscope Optic System (English Version)

export class PeriscopeSystem {
  constructor(container, onFireTorpedo) {
    this.container = container;
    this.onFireTorpedo = onFireTorpedo;

    this.active = false;
    this.azimuth = 0; // degrees relative to sub bow
    this.elevation = 0; // degrees
    this.zoom = 1.5; // 1.5x or 6.0x
    this.lockedTarget = null;

    this.createElements();
    this.bindEvents();
  }

  createElements() {
    this.element = document.createElement('div');
    this.element.id = 'periscope-overlay';
    this.element.className = 'periscope-overlay hidden';
    this.element.innerHTML = `
      <div class="periscope-mask">
        <!-- Top Azimuth Bearing Ring -->
        <div class="periscope-bearing-bar">
          <span class="bearing-label">BEARING: <strong id="peri-bearing-val">000°</strong></span>
          <span class="zoom-badge" id="peri-zoom-badge">1.5x</span>
        </div>

        <!-- Center Reticle Crosshair Canvas -->
        <canvas id="periscope-reticle-canvas" width="800" height="800"></canvas>

        <!-- Right Side Stadimeter & TDC Target Box -->
        <div class="periscope-tdc-box" id="peri-tdc-box">
          <div class="tdc-title">TDC - TARGET COMPUTER</div>
          <div class="tdc-row">TARGET: <span id="tdc-target-name">NO TARGET</span></div>
          <div class="tdc-row">RANGE: <span id="tdc-target-range">---- m</span></div>
          <div class="tdc-row">BEARING: <span id="tdc-target-bearing">---°</span></div>
          <div class="tdc-row">SPEED: <span id="tdc-target-speed">-- kn</span></div>
          <button class="tdc-fire-btn" id="peri-fire-btn">FIRE TORPEDO!</button>
        </div>

        <!-- Bottom Controls -->
        <div class="periscope-bottom-bar">
          <button class="peri-btn" id="peri-zoom-toggle">OPTICAL ZOOM (1.5x / 6x)</button>
          <span class="peri-hint">Drag Mouse: Pan Optic | Scroll: Zoom | Space: Fire Torpedo</span>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);

    this.canvas = document.getElementById('periscope-reticle-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.drawReticle();
  }

  bindEvents() {
    document.getElementById('peri-zoom-toggle').addEventListener('click', () => {
      this.toggleZoom();
    });

    document.getElementById('peri-fire-btn').addEventListener('click', () => {
      if (this.onFireTorpedo) this.onFireTorpedo();
    });

    // Mouse drag to rotate periscope
    let isDragging = false;
    let lastX = 0;

    this.element.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        isDragging = true;
        lastX = e.clientX;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging && this.active) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        this.azimuth = (this.azimuth + dx * 0.15) % 360;
        if (this.azimuth < 0) this.azimuth += 360;
        this.updateBearingDisplay();
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.element.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.toggleZoom();
    });
  }

  toggleZoom() {
    this.zoom = this.zoom === 1.5 ? 6.0 : 1.5;
    document.getElementById('peri-zoom-badge').textContent = `${this.zoom}x`;
    this.drawReticle();
  }

  updateBearingDisplay() {
    const el = document.getElementById('peri-bearing-val');
    if (el) el.textContent = `${Math.round(this.azimuth).toString().padStart(3, '0')}°`;
  }

  drawReticle() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = '#18241c';
    ctx.lineWidth = 2;

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 360, cy);
    ctx.lineTo(cx + 360, cy);
    ctx.moveTo(cx, cy - 360);
    ctx.lineTo(cx, cy + 360);
    ctx.stroke();

    // Milliradian tick marks
    ctx.fillStyle = '#18241c';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    const step = this.zoom === 1.5 ? 24 : 48;
    for (let x = -300; x <= 300; x += step) {
      if (x === 0) continue;
      const isMajor = Math.abs(x) % (step * 2) === 0;
      const tickH = isMajor ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(cx + x, cy - tickH);
      ctx.lineTo(cx + x, cy + tickH);
      ctx.stroke();

      if (isMajor) {
        const val = Math.abs(x / step);
        ctx.fillText(val.toString(), cx + x, cy - 16);
      }
    }

    for (let y = -240; y <= 240; y += step) {
      if (y === 0) continue;
      const isMajor = Math.abs(y) % (step * 2) === 0;
      const tickW = isMajor ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(cx - tickW, cy + y);
      ctx.lineTo(cx + tickW, cy + y);
      ctx.stroke();
    }

    // Center targeting circle
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#be1414';
    ctx.fill();

    ctx.restore();
  }

  update(ships, uBoat) {
    if (!this.active) return;

    const depth = -uBoat.mesh.position.y;
    const isPeriscopeUnderwater = depth > 14.5;

    const tdcName = document.getElementById('tdc-target-name');
    const tdcRange = document.getElementById('tdc-target-range');
    const tdcBearing = document.getElementById('tdc-target-bearing');
    const tdcSpeed = document.getElementById('tdc-target-speed');

    if (isPeriscopeUnderwater) {
      if (tdcName) tdcName.textContent = 'PERISCOPE SUBMERGED';
      return;
    }

    // Find ship closest to periscope line of sight
    let bestShip = null;
    let minAngleDiff = 999;
    const subRotY = uBoat.mesh.rotation.y;
    const periWorldAngle = ((subRotY * 180 / Math.PI) + this.azimuth) % 360;

    for (const ship of ships) {
      if (ship.sinking) continue;
      const dx = ship.mesh.position.x - uBoat.mesh.position.x;
      const dz = ship.mesh.position.z - uBoat.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const targetAngle = (Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360;
      const diff = Math.abs(((targetAngle - periWorldAngle + 540) % 360) - 180);

      if (diff < 15 && diff < minAngleDiff) {
        minAngleDiff = diff;
        bestShip = { ship, dist, bearing: Math.round(targetAngle) };
      }
    }

    if (bestShip) {
      this.lockedTarget = bestShip.ship;
      if (tdcName) tdcName.textContent = bestShip.ship.name;
      if (tdcRange) tdcRange.textContent = `${Math.round(bestShip.dist * 10)} m`;
      if (tdcBearing) tdcBearing.textContent = `${bestShip.bearing.toString().padStart(3, '0')}°`;
      if (tdcSpeed) tdcSpeed.textContent = `${bestShip.ship.speed} kn`;
    } else {
      this.lockedTarget = null;
      if (tdcName) tdcName.textContent = 'NO CONTACT';
      if (tdcRange) tdcRange.textContent = '---- m';
      if (tdcBearing) tdcBearing.textContent = '---°';
      if (tdcSpeed) tdcSpeed.textContent = '-- kn';
    }
  }

  setActive(active) {
    this.active = active;
    if (active) {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
    }
  }
}
