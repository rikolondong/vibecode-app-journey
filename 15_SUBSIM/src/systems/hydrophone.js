// WWII Submarine Acoustic Hydrophone Station (English Version)
import { sound } from '../audio/soundEngine.js';

export class HydrophoneSystem {
  constructor(container, onBearingContact) {
    this.container = container;
    this.onBearingContact = onBearingContact;

    this.active = false;
    this.dialAngle = 0; // 0 to 360 degrees
    this.signalStrength = 0; // 0 to 100%
    this.currentContact = null;

    this.createElements();
    this.bindEvents();
  }

  createElements() {
    this.element = document.createElement('div');
    this.element.id = 'hydrophone-overlay';
    this.element.className = 'hydrophone-overlay hidden';
    this.element.innerHTML = `
      <div class="hydro-panel">
        <div class="hydro-title">HYDROPHONE STATION - GHG ACOUSTIC RECEIVER (U-96)</div>
        <div class="hydro-display-wrap">
          <canvas id="hydro-dial-canvas" width="340" height="340"></canvas>
          <div class="hydro-sound-meter">
            <span class="meter-label">SIGNAL LEVEL (dB)</span>
            <div class="meter-bar-outer">
              <div class="meter-bar-inner" id="hydro-db-bar"></div>
            </div>
            <div class="meter-status" id="hydro-status-txt">CHECKING SELF-NOISE...</div>
          </div>
        </div>
        <div class="hydro-contact-card" id="hydro-contact-card">
          <span>BEARING: <strong id="hydro-bearing-val">000°</strong></span>
          <span id="hydro-type-val">NO SIGNAL</span>
        </div>
        <button class="map-btn" id="hydro-close-btn" style="margin-top: 12px;">CLOSE</button>
      </div>
    `;
    this.container.appendChild(this.element);

    this.canvas = document.getElementById('hydro-dial-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.drawDial();
  }

  bindEvents() {
    document.getElementById('hydro-close-btn').addEventListener('click', () => {
      this.setActive(false);
    });

    // Rotate dial by dragging
    let isDragging = false;
    let startAngle = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = this.canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging && this.active) {
        const rect = this.canvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const deltaAngle = (currentAngle - startAngle) * 180 / Math.PI;
        startAngle = currentAngle;

        this.dialAngle = (this.dialAngle + deltaAngle + 360) % 360;
        this.drawDial();
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  drawDial() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 135;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1b18';
    ctx.fill();

    const brassGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    brassGrad.addColorStop(0, '#785b2e');
    brassGrad.addColorStop(0.5, '#cbb269');
    brassGrad.addColorStop(1, '#4f3c1e');
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.fillStyle = brassGrad;
    ctx.fill();

    // Dark luminous dial face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#102216';
    ctx.fill();

    // Compass degree ticks
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.dialAngle * Math.PI) / 180);

    ctx.fillStyle = '#4ae678';
    ctx.strokeStyle = '#38a85a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';

    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const len = isMajor ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * (r - len), Math.sin(rad) * (r - len));
      ctx.lineTo(Math.cos(rad) * r, Math.sin(rad) * r);
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();

      if (isMajor) {
        ctx.fillText(deg.toString(), Math.cos(rad) * (r - 22), Math.sin(rad) * (r - 22) + 3);
      }
    }
    ctx.restore();

    // Fixed Hydrophone Needle at top
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 2);
    ctx.lineTo(cx - 7, cy - r + 16);
    ctx.lineTo(cx + 7, cy - r + 16);
    ctx.closePath();
    ctx.fillStyle = '#ff3333';
    ctx.fill();

    // Center handwheel knob
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  update(ships, uBoat) {
    const isSubmerged = -uBoat.mesh.position.y > 4;
    const isTooFast = Math.abs(uBoat.speed) > 4.5;

    const dbBar = document.getElementById('hydro-db-bar');
    const statusTxt = document.getElementById('hydro-status-txt');
    const bearingVal = document.getElementById('hydro-bearing-val');
    const typeVal = document.getElementById('hydro-type-val');

    if (bearingVal) bearingVal.textContent = `${Math.round(this.dialAngle).toString().padStart(3, '0')}°`;

    if (isTooFast) {
      this.signalStrength = 0;
      if (dbBar) dbBar.style.width = '10%';
      if (statusTxt) statusTxt.textContent = 'TOO LOUD (Reduce engine speed!)';
      if (typeVal) typeVal.textContent = 'Self noise drowning out hydrophone';
      return;
    }

    if (!isSubmerged) {
      this.signalStrength = 0;
      if (dbBar) dbBar.style.width = '0%';
      if (statusTxt) statusTxt.textContent = 'BOAT ON SURFACE (Only active submerged)';
      if (typeVal) typeVal.textContent = 'No underwater acoustic contacts';
      return;
    }

    // Calculate acoustics for ships
    let maxSignal = 0;
    let closestContact = null;

    ships.forEach(s => {
      if (s.sinking) return;
      const dx = s.mesh.position.x - uBoat.mesh.position.x;
      const dz = s.mesh.position.z - uBoat.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      let angleToShip = Math.round(Math.atan2(dz, dx) * 180 / Math.PI);
      if (angleToShip < 0) angleToShip += 360;

      const diff = Math.abs(((angleToShip - this.dialAngle + 540) % 360) - 180);
      if (diff < 20 && dist < 1200) {
        const signal = Math.max(0, (1 - diff / 20) * (1 - dist / 1200));
        if (signal > maxSignal) {
          maxSignal = signal;
          closestContact = { ship: s, dist, bearing: angleToShip };
        }
      }
    });

    this.signalStrength = maxSignal;

    if (dbBar) dbBar.style.width = `${Math.round(this.signalStrength * 100)}%`;

    if (closestContact && this.signalStrength > 0.15) {
      const isDestroyer = closestContact.ship.type === 'destroyer';
      if (statusTxt) statusTxt.textContent = isDestroyer ? 'FAST SCREWS (Warship Turbine / Destroyer)' : 'SLOW SCREWS (Steam Reciprocating / Merchant)';
      if (typeVal) typeVal.textContent = `${closestContact.ship.name} (approx. ${Math.round(closestContact.dist * 10)} m)`;
    } else {
      if (statusTxt) statusTxt.textContent = 'OCEAN AMBIENT NOISE ONLY';
      if (typeVal) typeVal.textContent = 'No screw sounds detected';
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
