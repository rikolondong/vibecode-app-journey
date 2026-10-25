import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.roundReached = data.round || 1;
    this.mode = data.mode || 1;
  }

  create() {
    sounds.playJingleGameOver();

    // Darkened backdrop (480x270)
    this.add.image(240, 135, 'bg_cemetery').setTint(0x332244);
    this.add.image(240, 227, 'foreground_grass').setTint(0x221133);

    // Kuntilanak mocking in background
    const mockKunti = this.add.image(240, 205, 'kunti_laugh').setScale(1.25);
    this.tweens.add({
      targets: mockKunti,
      y: 190,
      yoyo: true,
      repeat: -1,
      duration: 250
    });

    const box = this.add.rectangle(240, 85, 270, 95, 0x05040a, 0.9);
    box.setStrokeStyle(2, 0xff4757);

    this.add.text(240, 55, 'GAME OVER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ff4757',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(240, 82, `RONDE TERCAPAI: R=${this.roundReached}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffa502'
    }).setOrigin(0.5);

    this.add.text(240, 104, `SKOR AKHIR: ${this.finalScore.toString().padStart(6, '0')}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#2ed573'
    }).setOrigin(0.5);

    // Save and check Highscore
    const prevHigh = parseInt(localStorage.getItem('pocong_hunt_highscore') || '0', 10);
    if (this.finalScore > prevHigh) {
      localStorage.setItem('pocong_hunt_highscore', this.finalScore.toString());
      this.add.text(240, 142, '★ REKOR BARU TERCIPTA! ★', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f1c40f'
      }).setOrigin(0.5);
    }

    const btnRestart = this.add.text(240, 165, '▶ MAIN LAGI (KLIK / ENTER)', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: btnRestart,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 500
    });

    const restartGame = () => {
      sounds.playGunshot();
      this.scene.start('MenuScene');
    };

    btnRestart.on('pointerdown', restartGame);
    this.input.keyboard.on('keydown-ENTER', restartGame);
    this.input.keyboard.on('keydown-SPACE', restartGame);
  }
}
