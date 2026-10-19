// High-resolution Canvas Renderer for Vintage Hanging Submarine Gauges
// Matches the design in the reference screenshot (English version)

export class GaugeCluster {
  constructor(container, onAction) {
    this.container = container;
    this.onAction = onAction || (() => {});

    // State
    this.speed = 14; // knots
    this.depth = 2; // meters
    this.telegraphStep = 'grosse_vor'; // engine order
    this.rudder = 0; // degrees (-35 to +35)
    this.heading = 30; // degrees (0 to 360)

    this.canvases = {};
    this.ctxs = {};

    this.createGaugeElements();
    this.bindEvents();
    this.render();
  }

  createGaugeElements() {
    this.container.innerHTML = `
      <div class="gauge-mount-bar"></div>
      <div class="gauges-wrapper">
        <div class="gauge-hanger gauge-speed-hanger" title="Speedometer (Knots)">
          <div class="hanger-mount"></div>
          <canvas id="gauge-speed" width="220" height="260"></canvas>
        </div>
        <div class="gauge-hanger gauge-depth-hanger" title="Depth Gauge (Meters)">
          <div class="hanger-mount"></div>
          <canvas id="gauge-depth" width="220" height="260"></canvas>
        </div>
        <div class="gauge-hanger gauge-telegraph-hanger" title="Engine Telegraph (Click to set speed)">
          <div class="hanger-mount"></div>
          <canvas id="gauge-telegraph" width="240" height="270"></canvas>
        </div>
        <div class="gauge-hanger gauge-rudder-hanger" title="Rudder Indicator (Port / Stbd)">
          <div class="hanger-mount"></div>
          <canvas id="gauge-rudder" width="220" height="260"></canvas>
        </div>
        <div class="gauge-hanger gauge-compass-hanger" title="Compass & Heading Control">
          <div class="hanger-mount"></div>
          <canvas id="gauge-compass" width="230" height="280"></canvas>
        </div>
      </div>
    `;

    ['speed', 'depth', 'telegraph', 'rudder', 'compass'].forEach(name => {
      const cvs = document.getElementById(`gauge-${name}`);
      this.canvases[name] = cvs;
      this.ctxs[name] = cvs.getContext('2d');
    });
  }

  bindEvents() {
    // Telegraph click interaction
    const telCanvas = this.canvases['telegraph'];
    telCanvas.style.cursor = 'pointer';
    telCanvas.addEventListener('click', (e) => {
      const rect = telCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - (rect.height * 0.46);

      // Determine click quadrant: Left is Ahead, Right is Astern
      if (x < 0) {
        // Ahead steps: Stop, Slow, Half, Full, Flank
        if (y < -30) this.onAction('telegraph', 'aus');
        else if (y < 0) this.onAction('telegraph', 'kleine_vor');
        else if (y < 35) this.onAction('telegraph', 'halbe_vor');
        else if (y < 65) this.onAction('telegraph', 'grosse_vor');
        else this.onAction('telegraph', 'ak_vor');
      } else {
        // Astern steps: Stop, Slow, Half, Full
        if (y < -30) this.onAction('telegraph', 'aus');
        else if (y < 20) this.onAction('telegraph', 'kleine_zur');
        else if (y < 50) this.onAction('telegraph', 'halbe_zur');
        else this.onAction('telegraph', 'grosse_zur');
      }
    });

    // Compass L and R buttons
    const compassCanvas = this.canvases['compass'];
    compassCanvas.addEventListener('click', (e) => {
      const rect = compassCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Bottom area has L (Port) and R (Starboard) buttons
      if (y > 0.82) {
        if (x < 0.5) {
          this.onAction('heading', -5);
        } else {
          this.onAction('heading', +5);
        }
      }
    });

    // Depth gauge click
    const depthCanvas = this.canvases['depth'];
    depthCanvas.style.cursor = 'pointer';
    depthCanvas.addEventListener('click', (e) => {
      const rect = depthCanvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      if (y < 0.4) this.onAction('depth_target', 0); // surface
      else if (y < 0.6) this.onAction('depth_target', 12); // periscope
      else if (y < 0.8) this.onAction('depth_target', 45); // cruise
      else this.onAction('depth_target', 90); // deep
    });

    // Rudder gauge click
    const rudderCanvas = this.canvases['rudder'];
    rudderCanvas.style.cursor = 'pointer';
    rudderCanvas.addEventListener('click', (e) => {
      const rect = rudderCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const angle = Math.round((x - 0.5) * 70);
      this.onAction('rudder_set', Math.max(-35, Math.min(35, angle)));
    });
  }

  update(state) {
    this.speed = state.speed ?? this.speed;
    this.depth = state.depth ?? this.depth;
    this.telegraphStep = state.telegraphStep ?? this.telegraphStep;
    this.rudder = state.rudder ?? this.rudder;
    this.heading = state.heading ?? this.heading;
    this.render();
  }

  render() {
    this.drawSpeedometer();
    this.drawDepthGauge();
    this.drawTelegraph();
    this.drawRudder();
    this.drawCompass();
  }

  // --- DRAWING HELPERS ---
  drawBrassBezel(ctx, cx, cy, radius) {
    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;

    // Outer dark steel rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1b18';
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Brass outer ring
    const brassGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    brassGrad.addColorStop(0, '#5a4625');
    brassGrad.addColorStop(0.25, '#c8a65b');
    brassGrad.addColorStop(0.5, '#6a532d');
    brassGrad.addColorStop(0.75, '#dfc47a');
    brassGrad.addColorStop(1, '#3b2f19');

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = brassGrad;
    ctx.fill();

    // Inner bevel
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#100e0a';
    ctx.fill();

    // Aged parchment face
    const dialGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius - 4);
    dialGrad.addColorStop(0, '#e8dcbe');
    dialGrad.addColorStop(0.85, '#d3c29c');
    dialGrad.addColorStop(1, '#b09d77');

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.fillStyle = dialGrad;
    ctx.fill();

    // Screws / rivets on brass ring
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rx = cx + Math.cos(a) * (radius + 2);
      const ry = cy + Math.sin(a) * (radius + 2);
      ctx.beginPath();
      ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#221a0f';
      ctx.fill();
    }

    ctx.restore();
  }

  drawHangerMount(ctx, cx, topY) {
    ctx.save();
    // Metal bracket hanging from top
    ctx.fillStyle = '#262420';
    ctx.fillRect(cx - 6, 0, 12, topY);

    // Loop / bolt
    ctx.beginPath();
    ctx.arc(cx, topY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1915';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, topY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#555';
    ctx.fill();
    ctx.restore();
  }

  // 1. SPEEDOMETER (0 - 25 kn)
  drawSpeedometer() {
    const ctx = this.ctxs['speed'];
    const cvs = this.canvases['speed'];
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const cx = cvs.width / 2;
    const cy = 145;
    const r = 82;

    this.drawHangerMount(ctx, cx, 58);
    this.drawBrassBezel(ctx, cx, cy, r);

    // Numbers & Labels
    ctx.fillStyle = '#1b1a16';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('10', cx - 28, cy - 42);
    ctx.fillText('15', cx + 28, cy - 42);
    ctx.fillText('5', cx - 56, cy + 2);
    ctx.fillText('20', cx + 56, cy + 2);
    ctx.fillText('0', cx - 38, cy + 50);
    ctx.fillText('25', cx + 38, cy + 50);

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('SPEED', cx, cy - 25);
    ctx.font = '8px "Courier New", monospace';
    ctx.fillText('in Knots', cx, cy + 32);

    // Tick marks
    const startAngle = 0.75 * Math.PI;
    const totalSweep = 1.5 * Math.PI;

    for (let k = 0; k <= 25; k++) {
      const a = startAngle + (k / 25) * totalSweep;
      const isMajor = k % 5 === 0;
      const innerR = isMajor ? r - 18 : r - 12;
      const outerR = r - 6;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
      ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
      ctx.strokeStyle = '#1b1a16';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }

    // Pointer needle
    const currentKnot = Math.max(0, Math.min(25, this.speed));
    const needleAngle = startAngle + (currentKnot / 25) * totalSweep;
    this.drawNeedle(ctx, cx, cy, needleAngle, r - 12, '#1a1917', true);
  }

  // 2. DEPTH GAUGE (0 - 260 m)
  drawDepthGauge() {
    const ctx = this.ctxs['depth'];
    const cvs = this.canvases['depth'];
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const cx = cvs.width / 2;
    const cy = 145;
    const r = 82;

    this.drawHangerMount(ctx, cx, 58);
    this.drawBrassBezel(ctx, cx, cy, r);

    // Colored sectors: Green (0-25m), Yellow (25-100m), Red (100-260m)
    const startA = 0.75 * Math.PI;
    const totalA = 1.5 * Math.PI;

    const a25 = startA + (25 / 260) * totalA;
    const a100 = startA + (100 / 260) * totalA;
    const aEnd = startA + totalA;

    // Green zone (safe / periscope)
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, startA, a25);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#488c3a';
    ctx.stroke();

    // Yellow zone (cruising depth)
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, a25, a100);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#d49b28';
    ctx.stroke();

    // Red zone (crush danger)
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, a100, aEnd);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#a42822';
    ctx.stroke();

    // Markings
    ctx.fillStyle = '#1b1a16';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEPTH', cx, cy - 25);
    ctx.font = '7px "Courier New", monospace';
    ctx.fillText('in Meters', cx, cy - 14);
    ctx.fillText('260', cx, cy + 46);

    ctx.font = '8px "Courier New", monospace';
    ctx.fillText('0', cx - 42, cy + 40);
    ctx.fillText('25', cx - 58, cy + 12);
    ctx.fillText('50', cx - 52, cy - 25);
    ctx.fillText('100', cx - 20, cy - 50);
    ctx.fillText('150', cx + 20, cy - 50);
    ctx.fillText('200', cx + 54, cy - 20);

    // Needle
    const clampedDepth = Math.max(0, Math.min(260, this.depth));
    const needleAngle = startA + (clampedDepth / 260) * totalA;
    this.drawNeedle(ctx, cx, cy, needleAngle, r - 12, '#b22222', true);
  }

  // 3. ENGINE TELEGRAPH (Ahead / Astern)
  drawTelegraph() {
    const ctx = this.ctxs['telegraph'];
    const cvs = this.canvases['telegraph'];
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const cx = cvs.width / 2;
    const cy = 145;
    const r = 88;

    this.drawHangerMount(ctx, cx, 52);

    // Flanged military housing
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#445145';
    ctx.fill();

    // Bolts
    const boltAngles = [-0.7, -0.5, 0, 0.5, 0.7, 1.2, 1.9, 2.5, 3.1];
    ctx.fillStyle = '#1e241f';
    boltAngles.forEach(ang => {
      const bx = cx + Math.cos(ang) * (r + 2);
      const by = cy + Math.sin(ang) * (r + 2);
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // Left hemisphere (Ahead - Olive)
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#9aa892';
    ctx.fill();

    // Right hemisphere (Astern - Red)
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.fillStyle = '#c76e5d';
    ctx.fill();

    // Center divider
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r + 4);
    ctx.lineTo(cx, cy + r - 4);
    ctx.stroke();

    // Sector labels in English
    ctx.save();
    ctx.fillStyle = '#1c1b18';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';

    // Top headers
    ctx.fillText('AHEAD', cx - 36, cy - r + 24);
    ctx.fillText('ASTERN', cx + 36, cy - r + 24);

    // Steps Ahead (Left)
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('Stop', cx - 24, cy - 42);
    ctx.fillText('Slow', cx - 38, cy - 20);
    ctx.fillText('Half', cx - 44, cy + 4);
    ctx.fillText('Full', cx - 42, cy + 28);
    ctx.fillText('Flank', cx - 28, cy + 50);

    // Steps Astern (Right)
    ctx.fillText('Stop', cx + 24, cy - 42);
    ctx.fillText('Slow', cx + 38, cy - 20);
    ctx.fillText('Half', cx + 44, cy + 4);
    ctx.fillText('Full', cx + 40, cy + 28);
    ctx.fillText('Emerg.', cx + 24, cy + 50);
    ctx.restore();

    // Telegraph Lever / Needle
    let leverAngle = -Math.PI * 0.5; // Stop
    switch (this.telegraphStep) {
      case 'aus': leverAngle = -Math.PI * 0.5; break;
      case 'kleine_vor': leverAngle = -Math.PI * 0.72; break;
      case 'halbe_vor': leverAngle = -Math.PI * 0.88; break;
      case 'grosse_vor': leverAngle = Math.PI * 0.95; break;
      case 'ak_vor': leverAngle = Math.PI * 0.75; break;
      case 'kleine_zur': leverAngle = -Math.PI * 0.28; break;
      case 'halbe_zur': leverAngle = -Math.PI * 0.12; break;
      case 'grosse_zur': leverAngle = Math.PI * 0.05; break;
    }

    // Brass lever
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(leverAngle);

    ctx.fillStyle = '#bda054';
    ctx.strokeStyle = '#433414';
    ctx.lineWidth = 1.5;
    ctx.fillRect(0, -3, r - 10, 6);
    ctx.strokeRect(0, -3, r - 10, 6);

    ctx.beginPath();
    ctx.arc(r - 10, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#221a0f';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#9c813e';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 4. RUDDER INDICATOR (Port / Stbd)
  drawRudder() {
    const ctx = this.ctxs['rudder'];
    const cvs = this.canvases['rudder'];
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const cx = cvs.width / 2;
    const cy = 145;
    const r = 82;

    this.drawHangerMount(ctx, cx, 58);
    this.drawBrassBezel(ctx, cx, cy, r);

    const arcR = r - 16;
    // Port arc (Red)
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, -Math.PI, -Math.PI * 0.5);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#be3226';
    ctx.stroke();

    // Starboard arc (Green)
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, -Math.PI * 0.5, 0);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#328b3a';
    ctx.stroke();

    // Text & markings
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PORT', cx - 38, cy - 8);
    ctx.fillText('STBD', cx + 38, cy - 8);

    ctx.fillStyle = '#1b1a16';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('0', cx, cy - 64);
    ctx.fillText('35', cx - 62, cy - 18);
    ctx.fillText('35', cx + 62, cy - 18);

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('RUDDER', cx, cy + 35);

    // Needle pointing to current rudder angle
    const rudderNorm = Math.max(-35, Math.min(35, this.rudder)) / 35;
    const angle = -Math.PI * 0.5 + rudderNorm * (Math.PI * 0.42);
    this.drawNeedle(ctx, cx, cy, angle, r - 16, '#be2216', true);
  }

  // 5. COMPASS (with L/R buttons)
  drawCompass() {
    const ctx = this.ctxs['compass'];
    const cvs = this.canvases['compass'];
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const cx = cvs.width / 2;
    const cy = 135;
    const r = 82;

    this.drawHangerMount(ctx, cx, 48);

    // Bottom housing extension for L / R buttons
    ctx.save();
    ctx.fillStyle = '#1c1b18';
    ctx.beginPath();
    ctx.roundRect(cx - 48, cy + r - 12, 96, 42, 6);
    ctx.fill();

    // Buttons
    ctx.fillStyle = '#100e0b';
    ctx.beginPath();
    ctx.arc(cx - 22, cy + r + 10, 14, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy + r + 10, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b8577';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('L', cx - 22, cy + r + 14);
    ctx.fillText('R', cx + 22, cy + r + 14);
    ctx.restore();

    this.drawBrassBezel(ctx, cx, cy, r);

    // Compass Rose degrees (0 to 360)
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#1b1a16';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';

    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg - 90) * Math.PI / 180;
      const isMajor = deg % 30 === 0;
      const isTen = deg % 10 === 0;

      const inner = isMajor ? r - 20 : (isTen ? r - 15 : r - 10);
      const outer = r - 6;

      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * inner, Math.sin(rad) * inner);
      ctx.lineTo(Math.cos(rad) * outer, Math.sin(rad) * outer);
      ctx.strokeStyle = '#1b1a16';
      ctx.lineWidth = isMajor ? 1.8 : 0.8;
      ctx.stroke();

      if (isMajor) {
        const textR = r - 26;
        ctx.fillText(deg.toString(), Math.cos(rad) * textR, Math.sin(rad) * textR + 2);
      }
    }
    ctx.restore();

    // Indicator Needle for Heading
    const headRad = (this.heading - 90) * Math.PI / 180;
    this.drawNeedle(ctx, cx, cy, headRad, r - 14, '#1b1916', false);
  }

  drawNeedle(ctx, cx, cy, angle, length, color, withCounterweight = true) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, 2);

    if (withCounterweight) {
      ctx.lineTo(-14, 4);
      ctx.arc(-16, 0, 5, Math.PI * 0.5, -Math.PI * 0.5);
      ctx.lineTo(0, -2);
    } else {
      ctx.lineTo(-10, 0);
    }
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#2d2417';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#d6b865';
    ctx.fill();

    ctx.restore();
  }
}
