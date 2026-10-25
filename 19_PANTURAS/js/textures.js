// ============================================================================
// PANTURA: MUDIK ODYSSEY — HIGH-DPI PROCEDURAL TEXTURE & SIGNAGE GENERATOR
// Realistic 4-Lane Asphalt, Bina Marga Green Gantry Signs, SPBU Totems & Liveries
// ============================================================================

import * as THREE from '../libs/three.module.js';

function configureTexture(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a realistic 4-lane divided highway asphalt texture
 * Covers width = 22m (Left shoulder, 2 Eastbound lanes, Median, 2 Westbound lanes, Right shoulder)
 */
export function createHighwayAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base dark weathered asphalt
  ctx.fillStyle = '#23272e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle gravel & tar grain noise
  for (let i = 0; i < 28000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const v = 28 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Darker tire wear tracks in the 4 wheel paths
  const laneCenters = [195, 375, 649, 829];
  laneCenters.forEach((cx) => {
    const grad = ctx.createLinearGradient(cx - 65, 0, cx + 65, 0);
    grad.addColorStop(0, 'rgba(12,14,18,0)');
    grad.addColorStop(0.3, 'rgba(12,14,18,0.38)');
    grad.addColorStop(0.5, 'rgba(25,28,34,0.12)');
    grad.addColorStop(0.7, 'rgba(12,14,18,0.38)');
    grad.addColorStop(1, 'rgba(12,14,18,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 65, 0, 130, 1024);
  });

  // Occasional darker asphalt patch repair rectangles (Tambalan Aspal Pantura)
  ctx.fillStyle = 'rgba(18, 20, 24, 0.55)';
  ctx.fillRect(140, 180, 95, 210);
  ctx.fillRect(320, 620, 110, 160);
  ctx.fillRect(770, 390, 90, 240);

  // Concrete / gravel outer shoulders
  ctx.fillStyle = '#3b3f46';
  ctx.fillRect(0, 0, 96, 1024);
  ctx.fillRect(928, 0, 96, 1024);

  // Solid White Outer Edge Lines (Garis Tepi Bahu Jalan)
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(98, 0, 12, 1024);
  ctx.fillRect(914, 0, 12, 1024);

  // Solid Yellow Inner Median Edge Lines
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(464, 0, 10, 1024);
  ctx.fillRect(550, 0, 10, 1024);

  // Dashed White Center Lane Dividers (between Lane 1 & Lane 2 on each side)
  ctx.fillStyle = '#f1f5f9';
  for (let y = 40; y < 1024; y += 128) {
    // Eastbound lane divider
    ctx.fillRect(280, y, 12, 68);
    // Westbound lane divider
    ctx.fillRect(732, y, 12, 68);
  }

  return configureTexture(canvas, 1, 2);
}

/**
 * Generates an authentic Indonesian Dishub / Bina Marga Green Overhead Signboard Texture
 */
export function createGreenRoadSignTexture(mainTitle, subLine1, subLine2, routeNumber = '1', arrowDir = '⬆') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');

  // Reflective Highway Green Background
  const grad = ctx.createLinearGradient(0, 0, 0, 420);
  grad.addColorStop(0, '#0f6e3f');
  grad.addColorStop(1, '#094c2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 420);

  // Crisp White Outer Rounded Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, 988, 384);

  // Route Shield [RUTE NASIONAL 1] on top left
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(48, 46, 118, 92);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(54, 52, 106, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NASIONAL', 107, 72);

  ctx.fillStyle = '#111827';
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.fillText(routeNumber, 107, 126);

  // Direction Arrow on the right
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 115px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(arrowDir, 905, 235);

  // Main Destination Text
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px "Segoe UI", Arial, sans-serif';
  ctx.fillText(mainTitle, 195, 118);

  // Horizontal Divider
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(48, 158, 780, 5);

  // Sub-destinations / distances
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 46px "Segoe UI", Arial, sans-serif';
  ctx.fillText(subLine1, 52, 232);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
  ctx.fillText(subLine2, 52, 308);

  // Bottom strip
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText('JALUR UTAMA PANTURA • HATI-HATI DI JALAN', 52, 368);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates an SPBU (Pom Bensin Pertamina) Illuminated Totem Texture
 */
export function createSPBUTotemTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // White Header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 230);

  // Red & Blue Accent Bars
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 230, 512, 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 52px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPBU PANTURA', 256, 292);

  // Logo emblem in header
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(50, 45, 110, 50);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(175, 45, 110, 50);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(300, 45, 160, 50);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.fillText('44.521.08', 256, 165);
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('BUKA 24 JAM • PASTI PAS', 256, 206);

  // Dark Fuel Price LED Board Body
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 320, 512, 460);

  const fuels = [
    { name: 'PERTAMAX', price: '12.950', color: '#38bdf8' },
    { name: 'PERTALITE', price: '10.000', color: '#4ade80' },
    { name: 'DEXLITE', price: '14.550', color: '#facc15' },
    { name: 'BIO SOLAR', price: ' 6.800', color: '#fb923c' }
  ];

  fuels.forEach((f, idx) => {
    const y = 365 + idx * 102;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(28, y, 456, 78);
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(28, y, 456, 78);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px "Segoe UI", Arial, sans-serif';
    ctx.fillText(f.name, 48, y + 51);

    ctx.textAlign = 'right';
    ctx.fillStyle = f.color;
    ctx.font = '900 38px Consolas, monospace';
    ctx.fillText(f.price, 462, y + 52);
  });

  // Bottom Facility Icons Strip (Mushola, Toilet, Minimarket, Angin)
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 780, 512, 244);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
  ctx.fillText('🕌 MUSHOLA & TOILET', 256, 845);
  ctx.fillText('🏪 MINIMARKET & KOPI', 256, 905);
  ctx.fillStyle = '#fef08a';
  ctx.fillText('⬅ MENEPI (TOMBOL R)', 256, 975);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates a Banner Texture for Rest Area / Warung Pecel Lele / Posko Mudik
 */
export function createBannerTexture(bgColor, borderColor, title, subtitle, textColor = '#111827') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 18;
  ctx.strokeRect(12, 12, 1000, 232);

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.font = '900 66px "Segoe UI", Arial, sans-serif';
  ctx.fillText(title, 512, 118);

  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.fillText(subtitle, 512, 192);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates Yellow-Black Diagonal Hazard Stripes for Bridge Abutments & Median Barriers
 */
export function createHazardStripeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#18181b';
  for (let i = -256; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 32, 0);
    ctx.lineTo(i - 224, 256);
    ctx.lineTo(i - 256, 256);
    ctx.closePath();
    ctx.fill();
  }

  return configureTexture(canvas, 1, 2);
}
