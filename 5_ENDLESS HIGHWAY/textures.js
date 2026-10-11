import * as THREE from './libs/three.module.js';

/**
 * JALAN TOL KELAM - Procedural Realistic Texture Generator
 * Menghasilkan tekstur aspal realistis, normal map, roughness map,
 * beam lampu mobil, dan dial gauge secara prosedural murni di memori.
 */

export class TextureGenerator {
  /**
   * Menghasilkan tekstur aspal basah berbutir dengan jejak roda (tire wear tracks)
   */
  static createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base dark tarmac color
    ctx.fillStyle = '#101318';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine asphalt grain noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 32;
      const base = 20 + Math.floor(noise);
      data[i] = Math.max(12, Math.min(38, base));     // R
      data[i + 1] = Math.max(14, Math.min(42, base + 2)); // G
      data[i + 2] = Math.max(18, Math.min(48, base + 6)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle dark tire wear tracks along the 3 highway lanes
    ctx.fillStyle = 'rgba(6, 8, 12, 0.45)';
    // Lane 1 tracks
    ctx.fillRect(120, 0, 80, 1024);
    ctx.fillRect(260, 0, 80, 1024);
    // Lane 2 tracks
    ctx.fillRect(450, 0, 90, 1024);
    ctx.fillRect(600, 0, 90, 1024);
    // Lane 3 tracks
    ctx.fillRect(780, 0, 85, 1024);
    ctx.fillRect(920, 0, 85, 1024);

    // Asphalt expansion seam lines (sambungan cor/aspal horizontal)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 510, 1024, 4);
    ctx.fillStyle = 'rgba(35, 40, 50, 0.4)';
    ctx.fillRect(0, 514, 1024, 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    return texture;
  }

  /**
   * Menghasilkan Normal Map untuk memantulkan sorot lampu pada butiran aspal dan genangan air
   */
  static createAsphaltNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Perturb normal slightly around blue-dominant vector (128, 128, 255)
      const nx = 128 + Math.floor((Math.random() - 0.5) * 40);
      const ny = 128 + Math.floor((Math.random() - 0.5) * 40);
      data[i] = nx;     // X vector
      data[i + 1] = ny; // Y vector
      data[i + 2] = 255;// Z normal (pointing straight up)
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 8);
    return texture;
  }

  /**
   * Menghasilkan Roughness Map: bagian licin/basah (mengkilap memantulkan lampu) vs aspal kasar
   */
  static createAsphaltRoughnessMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base roughness (~0.55)
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, 512, 512);

    // Wet tire tracks have lower roughness (darker = more specular reflection)
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(60, 0, 45, 512);
    ctx.fillRect(130, 0, 45, 512);
    ctx.fillRect(225, 0, 50, 512);
    ctx.fillRect(300, 0, 50, 512);
    ctx.fillRect(390, 0, 45, 512);
    ctx.fillRect(460, 0, 45, 512);

    // Wet puddle spots
    for (let i = 0; i < 6; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, 45);
      grad.addColorStop(0, '#151515'); // very glossy center
      grad.addColorStop(1, '#888888');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    return texture;
  }

  /**
   * Masker pola sorot lampu mobil realistis (Asymmetric beam pattern dengan cutoff)
   */
  static createHeadlightBeamMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 256);

    // Elliptical gradient hotspot with smooth radial penumbra
    const grad = ctx.createRadialGradient(128, 120, 5, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 250, 235, 0.8)');
    grad.addColorStop(0.65, 'rgba(200, 225, 255, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(128, 135, 115, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Hamparan cahaya lampu depan pada aspal (Headlight Ground Light Carpet)
   * Memberikan efek penerangan aspal yang sangat nyata, luas, dan bergradasi halus
   */
  static createHeadlightGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 512, 512);

    // Trapezoidal beam carpet fading forward
    const grad = ctx.createRadialGradient(256, 80, 20, 256, 250, 260);
    grad.addColorStop(0, 'rgba(255, 252, 240, 0.85)');
    grad.addColorStop(0.25, 'rgba(235, 245, 255, 0.65)');
    grad.addColorStop(0.6, 'rgba(180, 215, 255, 0.28)');
    grad.addColorStop(0.85, 'rgba(120, 170, 240, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(256, 260, 220, 250, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Berkas cahaya volumetrik lembut (Soft Light Shaft) yang memudar dari sumber lampu
   */
  static createBeamShaftTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, 'rgba(240, 250, 255, 0.35)');
    grad.addColorStop(0.2, 'rgba(180, 220, 255, 0.18)');
    grad.addColorStop(0.6, 'rgba(120, 170, 230, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Tekstur dial speedometer analog menyala untuk interior cockpit
   */
  static createGaugeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#080c12';
    ctx.fillRect(0, 0, 512, 256);

    // Speedometer dial (Left side: 0 - 220 km/h)
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(140, 130, 95, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Speedometer ticks
    ctx.strokeStyle = '#e0f7fa';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';

    for (let speed = 0; speed <= 220; speed += 20) {
      const angle = Math.PI * 0.75 + (speed / 220) * (Math.PI * 1.5);
      const x1 = 140 + Math.cos(angle) * 80;
      const y1 = 130 + Math.sin(angle) * 80;
      const x2 = 140 + Math.cos(angle) * 92;
      const y2 = 130 + Math.sin(angle) * 92;
      ctx.lineWidth = speed % 40 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (speed % 40 === 0) {
        const xt = 140 + Math.cos(angle) * 65;
        const yt = 130 + Math.sin(angle) * 65 + 5;
        ctx.fillText(speed.toString(), xt, yt);
      }
    }

    ctx.fillStyle = '#78909c';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('KM/H', 140, 155);

    // Tachometer dial (Right side: 0 - 8 x1000 RPM)
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(370, 130, 95, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Redline sector (6.5 - 8 RPM)
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(370, 130, 95, Math.PI * 0.75 + (6.5 / 8) * (Math.PI * 1.5), Math.PI * 2.25);
    ctx.stroke();

    ctx.fillStyle = '#ff9100';
    for (let rpm = 0; rpm <= 8; rpm += 1) {
      const angle = Math.PI * 0.75 + (rpm / 8) * (Math.PI * 1.5);
      const x1 = 370 + Math.cos(angle) * 80;
      const y1 = 130 + Math.sin(angle) * 80;
      const x2 = 370 + Math.cos(angle) * 92;
      const y2 = 130 + Math.sin(angle) * 92;
      ctx.strokeStyle = rpm >= 7 ? '#ff1744' : '#ffe082';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const xt = 370 + Math.cos(angle) * 65;
      const yt = 130 + Math.sin(angle) * 65 + 5;
      ctx.fillStyle = rpm >= 7 ? '#ff1744' : '#ffe082';
      ctx.fillText(rpm.toString(), xt, yt);
    }

    ctx.fillStyle = '#78909c';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('RPM x1000', 370, 155);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Menghasilkan tekstur kabut/asap bulat sangat halus dengan gradien memudar (menghilangkan kotak-kotak)
   */
  static createSoftSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(210, 230, 245, 0.65)');
    grad.addColorStop(0.25, 'rgba(175, 200, 225, 0.35)');
    grad.addColorStop(0.6, 'rgba(130, 160, 190, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Menghasilkan tekstur rintik hujan lembut memanjang vertikal
   */
  static createRainDropTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(16, 0, 16, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, 'rgba(190, 225, 255, 0.5)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(16, 32, 4, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

