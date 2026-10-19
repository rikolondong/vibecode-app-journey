// WWII Submarine Tactical Navigation Chart (English Version)

export class TacticalMap {
  constructor(container, onSetHeading) {
    this.container = container;
    this.onSetHeading = onSetHeading;

    this.active = false;
    this.zoom = 0.45;
    this.panX = 0;
    this.panZ = 0;

    this.createElements();
    this.bindEvents();
  }

  createElements() {
    this.element = document.createElement('div');
    this.element.id = 'tactical-map-overlay';
    this.element.className = 'tactical-map-overlay hidden';
    this.element.innerHTML = `
      <div class="map-header">
        <span class="map-title">TACTICAL NAVIGATION CHART - ATLANTIC SECTOR BF</span>
        <div class="map-controls">
          <button class="map-btn" id="map-zoom-in">+</button>
          <button class="map-btn" id="map-zoom-out">-</button>
          <button class="map-btn" id="map-center-btn">CENTER (U-BOAT)</button>
          <button class="map-btn map-close-btn" id="map-close-btn">CLOSE [M]</button>
        </div>
      </div>
      <canvas id="tactical-map-canvas"></canvas>
      <div class="map-legend">
        <span>▲ U-Boat (Own)</span>
        <span style="color: #2e6db4;">■ Freighter (Convoy)</span>
        <span style="color: #c43224;">◆ Destroyer (Escort)</span>
        <span style="color: #444;">Click Map: Set Course Heading</span>
      </div>
    `;
    this.container.appendChild(this.element);

    this.canvas = document.getElementById('tactical-map-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    document.getElementById('map-zoom-in').addEventListener('click', () => {
      this.zoom = Math.min(1.5, this.zoom * 1.3);
    });

    document.getElementById('map-zoom-out').addEventListener('click', () => {
      this.zoom = Math.max(0.15, this.zoom / 1.3);
    });

    document.getElementById('map-center-btn').addEventListener('click', () => {
      if (this.lastUBoatPos) {
        this.centerOnUBoat(this.lastUBoatPos);
      }
    });

    document.getElementById('map-close-btn').addEventListener('click', () => {
      this.setActive(false);
    });

    // Click on map to plot heading course
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left - this.canvas.width / 2;
      const clickScreenZ = e.clientY - rect.top - this.canvas.height / 2;

      const worldX = (clickScreenX / this.zoom) + this.panX;
      const worldZ = (clickScreenZ / this.zoom) + this.panZ;

      if (this.lastUBoatPos) {
        const dx = worldX - this.lastUBoatPos.x;
        const dz = worldZ - this.lastUBoatPos.z;
        let deg = Math.round(Math.atan2(dz, dx) * 180 / Math.PI);
        if (deg < 0) deg += 360;
        if (this.onSetHeading) this.onSetHeading(deg);
      }
    });

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (isPanning && this.active) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        this.panX -= dx / this.zoom;
        this.panZ -= dy / this.zoom;
      }
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
    });
  }

  render(uBoat, ships, torpedoes) {
    if (!this.active) return;

    this.lastUBoatPos = uBoat.mesh.position;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Aged parchment background
    ctx.fillStyle = '#dfd3ba';
    ctx.fillRect(0, 0, w, h);

    // Nautical grid lines
    ctx.save();
    ctx.strokeStyle = '#b8aa8d';
    ctx.lineWidth = 1;

    const gridSize = 100 * this.zoom;
    const offsetX = (-this.panX * this.zoom) % gridSize;
    const offsetZ = (-this.panZ * this.zoom) % gridSize;

    for (let x = offsetX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = offsetZ; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    const toScreen = (worldPos) => {
      return {
        x: cx + (worldPos.x - this.panX) * this.zoom,
        y: cy + (worldPos.z - this.panZ) * this.zoom
      };
    };

    // Draw Torpedo tracks
    ctx.save();
    ctx.strokeStyle = '#e03a28';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    torpedoes.forEach(t => {
      const s = toScreen(t.mesh.position);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + t.dir.x * 30 * this.zoom, s.y + t.dir.z * 30 * this.zoom);
      ctx.stroke();
    });
    ctx.restore();

    // Draw Enemy Ships
    ships.forEach(s => {
      if (s.sinking && s.sinkTimer > 15) return;
      const pos = toScreen(s.mesh.position);
      const isDestroyer = s.type === 'destroyer';

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((s.heading * Math.PI) / 180);

      ctx.fillStyle = isDestroyer ? '#c43224' : '#2e6db4';
      ctx.strokeStyle = '#1b1b1b';
      ctx.lineWidth = 1.5;

      if (isDestroyer) {
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(230, 80, 60, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 70 * this.zoom, -0.4, 0.4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-10, -5, 20, 10);
        ctx.strokeRect(-10, -5, 20, 10);
      }

      ctx.fillStyle = '#222';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${s.name} (${s.speed} kn)`, 15, 4);

      ctx.restore();
    });

    // Draw Player U-Boat
    const subPos = toScreen(uBoat.mesh.position);
    ctx.save();
    ctx.translate(subPos.x, subPos.y);
    const subHeadingRad = (uBoat.heading * Math.PI) / 180;
    ctx.rotate(subHeadingRad);

    ctx.fillStyle = '#1d2226';
    ctx.strokeStyle = '#d6b865';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(2, 4);
    ctx.lineTo(-14, 2);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-14, -2);
    ctx.lineTo(2, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80 * this.zoom, 0);
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('U-96', 0, -12);

    ctx.restore();
  }

  setActive(active) {
    this.active = active;
    if (active) {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
    }
  }

  centerOnUBoat(uBoatPos) {
    this.panX = uBoatPos.x;
    this.panZ = uBoatPos.z;
  }
}
