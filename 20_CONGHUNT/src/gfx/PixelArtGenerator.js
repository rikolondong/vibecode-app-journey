/**
 * PixelArtGenerator (Upgraded 16-Bit Widescreen Edition)
 * Generates rich, atmospheric pixel art assets directly into Phaser's TextureManager.
 */
export class PixelArtGenerator {
  static generateAll(scene) {
    this.createBackground(scene);
    this.createMist(scene);
    this.createForeground(scene);
    this.createPocongWhite(scene);
    this.createPocongWhiteHit(scene);
    this.createPocongRed(scene);
    this.createPocongRedHit(scene);
    this.createKuntilanakLaugh(scene);
    this.createKuntilanakHold(scene);
    this.createCrosshair(scene);
    this.createUIIcons(scene);
    this.createParticles(scene);
  }

  static createBackground(scene) {
    const canvas = scene.textures.createCanvas('bg_cemetery', 480, 270);
    const ctx = canvas.getContext();

    // 1. Atmospheric Deep Night Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 210);
    skyGrad.addColorStop(0, '#05030d');
    skyGrad.addColorStop(0.35, '#100824');
    skyGrad.addColorStop(0.7, '#1f0d38');
    skyGrad.addColorStop(1, '#3b1754');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 480, 210);

    // 2. Cosmic Nebula Clouds (Soft subtle purple dust)
    const nebGrad = ctx.createRadialGradient(160, 60, 10, 160, 60, 140);
    nebGrad.addColorStop(0, 'rgba(112, 44, 150, 0.18)');
    nebGrad.addColorStop(0.5, 'rgba(74, 25, 110, 0.10)');
    nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebGrad;
    ctx.fillRect(0, 0, 320, 160);

    // 3. Dense Twinkling Stars
    const stars = [
      [20, 18, 1, '#ffffff'], [45, 32, 2, '#e0e7ff'], [75, 14, 1, '#fff'],
      [110, 45, 1, '#fde047'], [145, 22, 2, '#ffffff'], [170, 50, 1, '#e0e7ff'],
      [195, 16, 2, '#ffffff'], [230, 38, 1, '#cbd5e1'], [265, 12, 1, '#fff'],
      [300, 48, 2, '#fde047'], [330, 20, 1, '#ffffff'], [355, 35, 1, '#e0e7ff'],
      [420, 24, 2, '#ffffff'], [450, 42, 1, '#fff'], [465, 15, 1, '#fde047'],
      [35, 75, 1, '#cbd5e1'], [85, 90, 2, '#ffffff'], [135, 80, 1, '#e0e7ff'],
      [220, 75, 1, '#fff'], [280, 85, 1, '#cbd5e1'], [440, 78, 2, '#ffffff']
    ];
    stars.forEach(([x, y, s, col]) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, s, s);
      // Sparkle cross for bright stars
      if (s === 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x - 1, y, 4, 1);
        ctx.fillRect(x, y - 1, 1, 4);
      }
    });

    // 4. Giant Glowing Full Moon (Top Right)
    const moonX = 390;
    const moonY = 58;
    const moonR = 30;

    // Outer Atmospheric Corona Glow
    const corona = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 75);
    corona.addColorStop(0, 'rgba(255, 250, 214, 0.45)');
    corona.addColorStop(0.35, 'rgba(254, 240, 138, 0.22)');
    corona.addColorStop(0.7, 'rgba(245, 158, 11, 0.08)');
    corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 75, 0, Math.PI * 2);
    ctx.fill();

    // Moon Disc
    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Inner Moon Shade / Rim
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX - 4, moonY - 2, moonR - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.arc(moonX - 2, moonY - 1, moonR - 4, 0, Math.PI * 2);
    ctx.fill();

    // Realistic Pixel Moon Craters (Mare Serenitatis & Tranquillitatis)
    ctx.fillStyle = '#e2c974';
    ctx.fillRect(moonX - 14, moonY - 10, 8, 7);
    ctx.fillRect(moonX - 8, moonY - 16, 7, 6);
    ctx.fillRect(moonX + 2, moonY - 4, 9, 8);
    ctx.fillRect(moonX - 6, moonY + 6, 11, 8);
    ctx.fillRect(moonX - 18, moonY + 4, 6, 6);
    ctx.fillStyle = '#c7aa50';
    ctx.fillRect(moonX - 12, moonY - 8, 4, 3);
    ctx.fillRect(moonX + 5, moonY - 2, 4, 4);

    // Eerie Cloud Strands passing over moon
    ctx.fillStyle = 'rgba(38, 18, 64, 0.55)';
    ctx.fillRect(moonX - 45, moonY + 8, 80, 5);
    ctx.fillRect(moonX - 30, moonY + 13, 60, 3);
    ctx.fillRect(moonX - 55, moonY - 5, 45, 4);

    // 5. Distant Mountain Ridge Silhouette
    ctx.fillStyle = '#180c2c';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(0, 175);
    ctx.lineTo(60, 155);
    ctx.lineTo(120, 168);
    ctx.lineTo(190, 148);
    ctx.lineTo(260, 162);
    ctx.lineTo(340, 142);
    ctx.lineTo(410, 158);
    ctx.lineTo(480, 140);
    ctx.lineTo(480, 210);
    ctx.lineTo(0, 210);
    ctx.fill();

    // 6. Midground Cemetery Hills & Ancient Crypt Silhouette
    ctx.fillStyle = '#100720';
    ctx.beginPath();
    ctx.moveTo(0, 205);
    ctx.quadraticCurveTo(100, 165, 220, 185);
    ctx.quadraticCurveTo(340, 165, 480, 195);
    ctx.lineTo(480, 215);
    ctx.lineTo(0, 215);
    ctx.fill();

    // Distant Crypt / Mausoleum (Left Hill)
    ctx.fillStyle = '#0a0414';
    ctx.fillRect(95, 155, 30, 25);
    // Crypt roof triangle
    ctx.beginPath();
    ctx.moveTo(90, 155);
    ctx.lineTo(110, 142);
    ctx.lineTo(130, 155);
    ctx.fill();
    // Crypt Door
    ctx.fillStyle = '#1c0a32';
    ctx.fillRect(105, 163, 10, 17);
    // Crypt Cross on roof
    ctx.fillStyle = '#0a0414';
    ctx.fillRect(109, 134, 2, 8);
    ctx.fillRect(106, 136, 8, 2);

    // Twisted Kamboja Tree (Center Left, silhouetted against the sky)
    ctx.fillStyle = '#090312';
    // Gnarled Trunk
    ctx.beginPath();
    ctx.moveTo(175, 205);
    ctx.quadraticCurveTo(172, 165, 165, 130);
    ctx.lineTo(172, 130);
    ctx.quadraticCurveTo(180, 165, 185, 205);
    ctx.fill();
    // Twisted Branches
    ctx.fillRect(150, 145, 22, 5);
    ctx.fillRect(142, 138, 12, 12);
    ctx.fillRect(135, 125, 8, 16);
    ctx.fillRect(170, 135, 28, 5);
    ctx.fillRect(190, 122, 14, 18);
    ctx.fillRect(182, 110, 8, 16);
    // Leaves clumps
    ctx.fillRect(128, 115, 18, 12);
    ctx.fillRect(145, 105, 22, 15);
    ctx.fillRect(175, 98, 25, 16);
    ctx.fillRect(200, 112, 16, 12);

    // Spooky Glowing Cemetery Lantern (Flickering Warm Light on the Hill)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(320, 175, 5, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(321, 177, 3, 4);
    // Lantern aura
    const lanternGrad = ctx.createRadialGradient(322, 179, 2, 322, 179, 18);
    lanternGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    lanternGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = lanternGrad;
    ctx.beginPath();
    ctx.arc(322, 179, 18, 0, Math.PI * 2);
    ctx.fill();

    // Distant Iron Cemetery Fence
    ctx.fillStyle = '#0a0414';
    for (let fx = 230; fx < 310; fx += 8) {
      ctx.fillRect(fx, 172, 2, 18);
      ctx.fillRect(fx - 1, 170, 4, 2); // Spear tip
    }
    ctx.fillRect(230, 178, 80, 2);

    canvas.refresh();
  }

  static createMist(scene) {
    const canvas = scene.textures.createCanvas('bg_mist', 480, 40);
    const ctx = canvas.getContext();

    // Rolling ghostly ground mist
    const mistGrad = ctx.createLinearGradient(0, 0, 0, 40);
    mistGrad.addColorStop(0, 'rgba(167, 139, 250, 0)');
    mistGrad.addColorStop(0.4, 'rgba(192, 132, 252, 0.22)');
    mistGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.15)');
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 0, 480, 40);

    // Wavy mist puffs
    ctx.fillStyle = 'rgba(216, 180, 254, 0.12)';
    for (let x = 0; x < 480; x += 35) {
      ctx.beginPath();
      ctx.ellipse(x + 15, 20, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.refresh();
  }

  static createForeground(scene) {
    const canvas = scene.textures.createCanvas('foreground_grass', 480, 85);
    const ctx = canvas.getContext();

    // 1. Deep Earth & Burial Soil Layer
    ctx.fillStyle = '#0a140d';
    ctx.fillRect(0, 25, 480, 60);

    // 2. Grassy Cemetery Mounds with Depth
    ctx.fillStyle = '#14291a';
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(90, 12, 180, 26);
    ctx.quadraticCurveTo(270, 8, 360, 24);
    ctx.quadraticCurveTo(420, 14, 480, 28);
    ctx.lineTo(480, 85);
    ctx.lineTo(0, 85);
    ctx.fill();

    // Mid green tone
    ctx.fillStyle = '#1e3d27';
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.quadraticCurveTo(80, 20, 170, 32);
    ctx.quadraticCurveTo(280, 18, 380, 30);
    ctx.quadraticCurveTo(430, 22, 480, 34);
    ctx.lineTo(480, 85);
    ctx.lineTo(0, 85);
    ctx.fill();

    // 3. Dense Pixel Art Grass Blades (Foreground)
    ctx.fillStyle = '#2d6a3f';
    for (let x = 0; x < 480; x += 4) {
      const h = 7 + (x % 9);
      ctx.fillRect(x, 22 - h, 3, h + 10);
      ctx.fillRect(x + 1, 24 - (h * 0.7), 2, 6);
    }
    // High-light Grass blades
    ctx.fillStyle = '#40916c';
    for (let x = 3; x < 480; x += 8) {
      const h = 8 + (x % 7);
      ctx.fillRect(x, 20 - h, 2, h + 4);
    }

    // 4. Detailed Tombstone 1 (Left: Ancient Weathered Celtic Stone Cross)
    const t1X = 75;
    ctx.fillStyle = '#475569';
    ctx.fillRect(t1X, 6, 26, 42);
    ctx.fillRect(t1X + 3, 2, 20, 6); // Cap
    // Stone highlights & cracks
    ctx.fillStyle = '#64748b';
    ctx.fillRect(t1X + 2, 6, 3, 40);
    ctx.fillStyle = '#334155';
    ctx.fillRect(t1X + 22, 8, 3, 38); // Shadow edge
    // Carved Cross
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(t1X + 11, 12, 4, 20);
    ctx.fillRect(t1X + 6, 17, 14, 4);
    // Green moss on stone
    ctx.fillStyle = '#2d6a3f';
    ctx.fillRect(t1X + 1, 38, 7, 8);
    ctx.fillRect(t1X + 18, 40, 8, 7);

    // 5. Detailed Tombstone 2 (Center: Javanese Nisan Patok / Kijing)
    const t2X = 220;
    // Base pedestal
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(t2X - 4, 24, 32, 24);
    ctx.fillStyle = '#52525b';
    ctx.fillRect(t2X - 2, 22, 28, 4);
    // Carved Headpost (Nisan Patok)
    ctx.fillStyle = '#71717a';
    ctx.fillRect(t2X + 5, 4, 14, 22);
    // Crown/Dome tip
    ctx.fillRect(t2X + 8, 1, 8, 4);
    // Gold Arabic style inscription line
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(t2X + 8, 10, 8, 2);
    ctx.fillRect(t2X + 9, 14, 6, 2);
    // Red fallen Frangipani (Kamboja) flower at the base of grave
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(t2X + 22, 38, 4, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(t2X + 23, 39, 2, 2);

    // 6. Detailed Tombstone 3 (Right: Classic Heavy Granite Grave)
    const t3X = 350;
    ctx.fillStyle = '#374151';
    ctx.fillRect(t3X, 8, 28, 38);
    ctx.fillRect(t3X + 2, 5, 24, 4);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(t3X + 2, 9, 3, 35);
    // "R.I.P" letters in pixels
    ctx.fillStyle = '#9ca3af';
    // R
    ctx.fillRect(t3X + 7, 15, 3, 6);
    ctx.fillRect(t3X + 9, 15, 2, 1);
    ctx.fillRect(t3X + 9, 17, 2, 1);
    ctx.fillRect(t3X + 9, 19, 2, 2);
    // I
    ctx.fillRect(t3X + 13, 15, 2, 6);
    // P
    ctx.fillRect(t3X + 17, 15, 3, 6);
    ctx.fillRect(t3X + 19, 15, 2, 1);
    ctx.fillRect(t3X + 19, 17, 2, 1);

    // 7. Grass Clumps surrounding the base of graves
    ctx.fillStyle = '#38b000';
    for (let x = 65; x < 110; x += 4) ctx.fillRect(x, 42, 2, 8);
    for (let x = 205; x < 255; x += 4) ctx.fillRect(x, 40, 2, 8);
    for (let x = 340; x < 385; x += 4) ctx.fillRect(x, 41, 2, 8);

    canvas.refresh();
  }

  static createPocongWhite(scene) {
    const canvas = scene.textures.createCanvas('pocong_white', 28, 44);
    const ctx = canvas.getContext();

    // 1. Top Shroud Knot (Ikatan Tali Pocokan)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(12, 0, 4, 5);
    ctx.fillRect(10, 2, 8, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(11, 4, 6, 2); // Knot crease

    // 2. Head Shroud (Kafan Kepala)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 6, 14, 14);
    ctx.fillRect(6, 8, 16, 10);
    // Shading on left and right borders
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(6, 8, 2, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(20, 8, 2, 10);

    // 3. Spooky Face Hollow
    ctx.fillStyle = '#334155';
    ctx.fillRect(9, 9, 10, 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 10, 8, 6);

    // 4. Glowing Red Eyes with Pupil Core
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 11, 3, 3);
    ctx.fillRect(15, 11, 3, 3);
    // Inner hot white/pink core
    ctx.fillStyle = '#fecaca';
    ctx.fillRect(11, 12, 1, 1);
    ctx.fillRect(16, 12, 1, 1);

    // Eerie Stitched mouth / hollow
    ctx.fillStyle = '#475569';
    ctx.fillRect(11, 15, 6, 1);
    ctx.fillRect(12, 14, 1, 3);
    ctx.fillRect(15, 14, 1, 3);

    // 5. Neck Tie Crease
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, 20, 12, 3);

    // 6. Body Shroud (Torso & Legs)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 23, 16, 17);
    ctx.fillRect(7, 21, 14, 19);

    // 3D Shroud Folds & Shadowing
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(8, 24, 3, 14);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(12, 25, 2, 13);
    ctx.fillRect(15, 24, 2, 14);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(19, 23, 3, 16); // Deep right side shadow

    // 7. Waist Ribbon / Tie
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(7, 30, 14, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, 31, 12, 1);

    // 8. Bottom Feet Binding Knot
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(9, 40, 10, 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(10, 42, 8, 2);

    canvas.refresh();
  }

  static createPocongWhiteHit(scene) {
    const canvas = scene.textures.createCanvas('pocong_white_hit', 28, 44);
    const ctx = canvas.getContext();

    // Dazed tilted head knot
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(13, 1, 5, 4);

    // Body
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(7, 6, 14, 13);

    // Face hollow with Big X-Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 8, 12, 8);

    // Left X Eye (Yellow cartoon stars)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(9, 9, 1, 1);
    ctx.fillRect(11, 9, 1, 1);
    ctx.fillRect(10, 10, 1, 1);
    ctx.fillRect(9, 11, 1, 1);
    ctx.fillRect(11, 11, 1, 1);

    // Right X Eye
    ctx.fillRect(15, 9, 1, 1);
    ctx.fillRect(17, 9, 1, 1);
    ctx.fillRect(16, 10, 1, 1);
    ctx.fillRect(15, 11, 1, 1);
    ctx.fillRect(17, 11, 1, 1);

    // Disheveled Torso
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(6, 21, 16, 18);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, 24, 3, 13);
    ctx.fillRect(16, 23, 4, 14);

    // Floating Stun Stars around head
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, 4, 3, 3);
    ctx.fillRect(23, 6, 3, 3);
    ctx.fillRect(1, 18, 2, 2);
    ctx.fillRect(25, 20, 2, 2);

    canvas.refresh();
  }

  static createPocongRed(scene) {
    const canvas = scene.textures.createCanvas('pocong_red', 28, 44);
    const ctx = canvas.getContext();

    // 1. Fiery Top Knot
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(12, 0, 4, 5);
    ctx.fillRect(10, 2, 8, 4);
    // Fiery aura flame tips
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(11, 0, 2, 2);
    ctx.fillRect(15, 0, 2, 2);

    // 2. Crimson Shroud
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(7, 6, 14, 14);
    ctx.fillRect(6, 8, 16, 10);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(6, 8, 2, 10);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(20, 8, 2, 10);

    // 3. Dark Demonic Hollow
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(9, 9, 10, 8);
    ctx.fillStyle = '#2b0606';
    ctx.fillRect(10, 10, 8, 6);

    // 4. Blazing Gold/Yellow Eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(10, 11, 3, 3);
    ctx.fillRect(15, 11, 3, 3);
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(11, 12, 1, 1);
    ctx.fillRect(16, 12, 1, 1);

    // 5. Body
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(6, 23, 16, 17);
    ctx.fillRect(7, 21, 14, 19);

    // Folds & Fiery Ribbons
    ctx.fillStyle = '#f87171';
    ctx.fillRect(8, 24, 3, 14);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(12, 25, 2, 13);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(19, 23, 3, 16);

    // Burning Spark Embers on sides
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(3, 14, 2, 2);
    ctx.fillRect(23, 24, 2, 2);
    ctx.fillRect(4, 32, 2, 2);

    // Bottom tie
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(9, 40, 10, 2);
    ctx.fillRect(10, 42, 8, 2);

    canvas.refresh();
  }

  static createPocongRedHit(scene) {
    const canvas = scene.textures.createCanvas('pocong_red_hit', 28, 44);
    const ctx = canvas.getContext();

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(13, 1, 5, 4);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(7, 6, 14, 13);

    ctx.fillStyle = '#2b0606';
    ctx.fillRect(8, 8, 12, 8);

    // Blazing Yellow X Eyes
    ctx.fillStyle = '#fde047';
    ctx.fillRect(9, 9, 1, 1);
    ctx.fillRect(11, 9, 1, 1);
    ctx.fillRect(10, 10, 1, 1);
    ctx.fillRect(9, 11, 1, 1);
    ctx.fillRect(11, 11, 1, 1);

    ctx.fillRect(15, 9, 1, 1);
    ctx.fillRect(17, 9, 1, 1);
    ctx.fillRect(16, 10, 1, 1);
    ctx.fillRect(15, 11, 1, 1);
    ctx.fillRect(17, 11, 1, 1);

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(6, 21, 16, 18);

    // Sparks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 4, 3, 3);
    ctx.fillRect(23, 6, 3, 3);

    canvas.refresh();
  }

  static createKuntilanakLaugh(scene) {
    const canvas = scene.textures.createCanvas('kunti_laugh', 44, 52);
    const ctx = canvas.getContext();

    // 1. Cascading Voluminous Long Black Hair
    ctx.fillStyle = '#090d16';
    ctx.fillRect(8, 2, 28, 48);
    ctx.fillRect(4, 10, 36, 40);
    ctx.fillRect(2, 18, 40, 32);

    // Hair shine highlights
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(9, 4, 3, 38);
    ctx.fillRect(32, 6, 3, 36);

    // 2. Pale Ghostly Face
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(14, 8, 16, 17);
    ctx.fillRect(13, 10, 18, 13);

    // Hair strands draping across forehead
    ctx.fillStyle = '#090d16';
    ctx.fillRect(15, 8, 3, 7);
    ctx.fillRect(26, 8, 3, 8);

    // 3. Wide Hysterical Laughing Mouth
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(16, 17, 12, 7);
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(17, 18, 10, 5);
    // Sharp white vampire fangs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 17, 2, 3);
    ctx.fillRect(24, 17, 2, 3);
    // Dark red tongue
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(20, 20, 4, 3);

    // 4. Wild Bulging Comic Eyes with Red Makeup
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(13, 10, 7, 6);
    ctx.fillRect(24, 10, 7, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 11, 5, 4);
    ctx.fillRect(25, 11, 5, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(16, 12, 2, 2);
    ctx.fillRect(26, 12, 2, 2);

    // 5. Flowing Ghostly White Gown
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(11, 25, 22, 27);
    ctx.fillRect(8, 30, 28, 22);

    // Gown Shading
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, 29, 3, 23);
    ctx.fillRect(28, 29, 3, 23);

    // Hands Pointing and Mocking
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(6, 26, 5, 6);
    ctx.fillRect(33, 26, 5, 6);
    // Long Red Nails
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(5, 27, 2, 2);
    ctx.fillRect(37, 27, 2, 2);

    canvas.refresh();
  }

  static createKuntilanakHold(scene) {
    const canvas = scene.textures.createCanvas('kunti_hold', 54, 52);
    const ctx = canvas.getContext();

    // 1. Kuntilanak Body (Left)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(10, 4, 24, 46);
    ctx.fillRect(6, 12, 30, 38);

    // Face
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(15, 10, 16, 15);

    // Winking Cheerful Mischievous Face
    ctx.fillStyle = '#dc2626';
    // Left eye open
    ctx.fillRect(17, 13, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 14, 1, 1);
    // Right eye wink (curved line)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(24, 15, 4, 2);

    // Smug Proud Smile
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(18, 19, 8, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(19, 19, 6, 1);

    // Gown
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(10, 25, 24, 27);

    // Arm extended holding the captured pocong
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(32, 20, 8, 5);

    // 2. Mini Captured Pocong hanging proudly like a trophy!
    const pX = 38;
    // Tie held in hand
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(pX + 2, 14, 6, 4);
    // Body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pX, 18, 11, 24);
    // X Eyes
    ctx.fillStyle = '#334155';
    ctx.fillRect(pX + 1, 22, 9, 5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(pX + 2, 23, 2, 2);
    ctx.fillRect(pX + 6, 23, 2, 2);
    // Body Folds
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(pX + 8, 19, 3, 22);

    canvas.refresh();
  }

  static createCrosshair(scene) {
    const canvas = scene.textures.createCanvas('crosshair', 28, 28);
    const ctx = canvas.getContext();

    // High contrast tactical arcade crosshair
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(14, 14, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Corner targeting brackets
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(14, 14, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Cross bars
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(13, 0, 2, 7);   // Top
    ctx.fillRect(13, 21, 2, 7);  // Bottom
    ctx.fillRect(0, 13, 7, 2);   // Left
    ctx.fillRect(21, 13, 7, 2);  // Right

    // Center Aiming Laser Dot
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(13, 13, 2, 2);

    canvas.refresh();
  }

  static createUIIcons(scene) {
    // 1. UI Bullet Available (12x18 Detailed Red & Brass Shell)
    const cB = scene.textures.createCanvas('ui_bullet', 10, 16);
    const ctxB = cB.getContext();
    // Red Casing
    ctxB.fillStyle = '#dc2626';
    ctxB.fillRect(2, 1, 6, 11);
    ctxB.fillStyle = '#ef4444';
    ctxB.fillRect(3, 2, 2, 9); // Highlight
    // Brass Base
    ctxB.fillStyle = '#f59e0b';
    ctxB.fillRect(1, 12, 8, 4);
    ctxB.fillStyle = '#fef08a';
    ctxB.fillRect(2, 13, 6, 2);
    cB.refresh();

    // 2. UI Bullet Empty
    const cBE = scene.textures.createCanvas('ui_bullet_empty', 10, 16);
    const ctxBE = cBE.getContext();
    ctxBE.strokeStyle = '#475569';
    ctxBE.lineWidth = 1;
    ctxBE.strokeRect(2, 1, 6, 11);
    ctxBE.strokeRect(1, 12, 8, 4);
    cBE.refresh();

    // 3. UI Target Hit (Glowing Emerald Pocong Badge)
    const cH = scene.textures.createCanvas('ui_target_hit', 12, 14);
    const ctxH = cH.getContext();
    ctxH.fillStyle = '#22c55e';
    ctxH.fillRect(4, 1, 4, 3);
    ctxH.fillRect(3, 4, 6, 9);
    ctxH.fillStyle = '#4ade80';
    ctxH.fillRect(4, 5, 2, 6);
    ctxH.fillStyle = '#14532d';
    ctxH.fillRect(4, 6, 1, 1);
    ctxH.fillRect(6, 6, 1, 1);
    cH.refresh();

    // 4. UI Target Miss (Crimson Crossed Tombstone)
    const cM = scene.textures.createCanvas('ui_target_miss', 12, 14);
    const ctxM = cM.getContext();
    ctxM.fillStyle = '#ef4444';
    ctxM.fillRect(3, 3, 6, 9);
    ctxM.fillStyle = '#7f1d1d';
    ctxM.fillRect(4, 5, 4, 2);
    // Bright White Strike
    ctxM.strokeStyle = '#ffffff';
    ctxM.lineWidth = 2;
    ctxM.beginPath();
    ctxM.moveTo(1, 2);
    ctxM.lineTo(11, 12);
    ctxM.stroke();
    cM.refresh();

    // 5. UI Target Pending
    const cP = scene.textures.createCanvas('ui_target_pending', 12, 14);
    const ctxP = cP.getContext();
    ctxP.strokeStyle = '#64748b';
    ctxP.lineWidth = 1;
    ctxP.strokeRect(3, 3, 6, 9);
    cP.refresh();
  }

  static createParticles(scene) {
    // 1. Shroud Cloth Shred Particle
    const cCloth = scene.textures.createCanvas('part_cloth', 4, 4);
    const ctxC = cCloth.getContext();
    ctxC.fillStyle = '#ffffff';
    ctxC.fillRect(0, 0, 3, 4);
    ctxC.fillStyle = '#cbd5e1';
    ctxC.fillRect(2, 0, 1, 4);
    cCloth.refresh();

    // 2. Fiery Ember Spark
    const cSpark = scene.textures.createCanvas('part_spark', 4, 4);
    const ctxS = cSpark.getContext();
    ctxS.fillStyle = '#facc15';
    ctxS.fillRect(1, 0, 2, 4);
    ctxS.fillRect(0, 1, 4, 2);
    ctxS.fillStyle = '#ffffff';
    ctxS.fillRect(1, 1, 2, 2);
    cSpark.refresh();
  }
}
