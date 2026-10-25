import Phaser from 'phaser';
import { PixelArtGenerator } from '../gfx/PixelArtGenerator.js';
import { sounds } from '../audio/SoundManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Generate all procedural 16-bit widescreen pixel textures into memory
    PixelArtGenerator.generateAll(this);
  }

  create() {
    sounds.ensureContext();

    this.add.text(240, 130, 'MEMUAT POCONG HUNT 16:9 HD...', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#00ffcc'
    }).setOrigin(0.5);

    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }
}
