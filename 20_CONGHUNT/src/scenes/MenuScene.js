import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // 16:9 Widescreen Backdrop (480x270)
    this.add.image(240, 135, 'bg_cemetery');
    this.mist = this.add.tileSprite(240, 210, 480, 40, 'bg_mist').setAlpha(0.6);
    this.add.image(240, 227, 'foreground_grass');

    // Title Box
    const titleBg = this.add.rectangle(240, 60, 310, 56, 0x070414, 0.85);
    titleBg.setStrokeStyle(2, 0xd63031);

    this.add.text(240, 48, 'POCONG HUNT', {
      fontFamily: 'Courier New, monospace',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ff4757',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(240, 72, '★ 16-BIT RETRO ARCADE 1984 ★', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffa502'
    }).setOrigin(0.5);

    // High score
    const highscore = parseInt(localStorage.getItem('pocong_hunt_highscore') || '0', 10);
    this.add.text(240, 102, `TOP REKOR: ${highscore.toString().padStart(6, '0')}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#2ed573'
    }).setOrigin(0.5);

    // Game Mode Selection
    this.selectedMode = 1; // 1 = Mode A (1 Pocong), 2 = Mode B (2 Pocong)

    const btnModeA = this.add.text(240, 135, '▶ GAME A : 1 POCONG', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const btnModeB = this.add.text(240, 160, '  GAME B : 2 POCONG', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#747d8c',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const updateMenuHighlight = () => {
      if (this.selectedMode === 1) {
        btnModeA.setText('▶ GAME A : 1 POCONG').setColor('#ffffff');
        btnModeB.setText('  GAME B : 2 POCONG').setColor('#747d8c');
      } else {
        btnModeA.setText('  GAME A : 1 POCONG').setColor('#747d8c');
        btnModeB.setText('▶ GAME B : 2 POCONG').setColor('#ffffff');
      }
      sounds.playPocongJump();
    };

    btnModeA.on('pointerover', () => {
      this.selectedMode = 1;
      updateMenuHighlight();
    });

    btnModeB.on('pointerover', () => {
      this.selectedMode = 2;
      updateMenuHighlight();
    });

    const startGame = () => {
      sounds.playGunshot();
      sounds.playJingleRoundStart();
      this.cameras.main.flash(200, 255, 255, 255);
      this.time.delayedCall(400, () => {
        this.scene.start('GameScene', { mode: this.selectedMode });
      });
    };

    btnModeA.on('pointerdown', startGame);
    btnModeB.on('pointerdown', startGame);

    // Keyboard support (Up/Down + Enter/Space)
    this.input.keyboard.on('keydown-UP', () => {
      this.selectedMode = 1;
      updateMenuHighlight();
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      this.selectedMode = 2;
      updateMenuHighlight();
    });
    this.input.keyboard.on('keydown-ENTER', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);

    // Instructions
    this.add.text(240, 195, 'KLIK / SENTUH UNTUK MEMBIDIK & TEMBAK', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#ced6e0'
    }).setOrigin(0.5);

    this.add.text(240, 252, '© 2026 100 DAYS PROJECTS #20 • 16:9 EDITION', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      color: '#57606f'
    }).setOrigin(0.5);
  }

  update() {
    if (this.mist) {
      this.mist.tilePositionX += 0.25;
    }
  }
}
