import Phaser from 'phaser';

export const CONFIG = {
  WIDTH: 480,
  HEIGHT: 270, // 16:9 Aspect Ratio (exact integer 4x scale to 1920x1080)
  GRAVITY: 360,
  BULLETS_PER_WAVE: 3,
  TOTAL_TARGETS_PER_ROUND: 10,
  COLORS: {
    SKY_TOP: 0x070414,
    SKY_MID: 0x130a2a,
    SKY_BOTTOM: 0x241142,
    MOON: 0xfff6d3,
    MOON_GLOW: 0xffeaa7,
    GRASS_DARK: 0x0d1f14,
    GRASS_MID: 0x1a3a24,
    GRASS_LIGHT: 0x2e663e,
    TOMBSTONE: 0x636e72,
    TOMBSTONE_SHADOW: 0x2d3436,
    POCONG_WHITE: 0xf5f6fa,
    POCONG_RED: 0xe74c3c,
    KUNTI_DRESS: 0xecf0f1,
    KUNTI_HAIR: 0x0d0d0d,
    ACCENT_RED: 0xd63031,
    ACCENT_GREEN: 0x2ecc71,
    LANTERN_GLOW: 0xf39c12
  }
};
