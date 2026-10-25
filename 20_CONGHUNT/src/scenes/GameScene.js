import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager.js';
import { Crosshair } from '../entities/Crosshair.js';
import { Pocong } from '../entities/Pocong.js';
import { Kuntilanak } from '../entities/Kuntilanak.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.mode = data.mode || 1; // 1 = 1 Pocong, 2 = 2 Pocong
    this.round = 1;
    this.score = 0;
    this.targets = []; // Array of 10 items: 'hit' | 'miss' | 'pending'
    this.currentTargetsInWave = [];
    this.bullets = 3;
    this.isWaveActive = false;
    this.waveResolved = false;
  }

  create() {
    // 1. Widescreen 16:9 Background (480x270)
    this.bg = this.add.image(240, 135, 'bg_cemetery').setDepth(0);

    // 2. Rolling Fog/Mist Layer (Depth 5)
    this.mist = this.add.tileSprite(240, 210, 480, 40, 'bg_mist').setDepth(5);
    this.mist.setAlpha(0.7);

    // 3. Kuntilanak (Depth 18, behind grass)
    this.kuntilanak = new Kuntilanak(this);

    // 4. Foreground Grass, Tombstones & Soil (Depth 20)
    this.fg = this.add.image(240, 227, 'foreground_grass').setDepth(20);

    // 5. White Flash overlay for Gunshot (Depth 900)
    this.flashOverlay = this.add.rectangle(240, 135, 480, 270, 0xffffff, 1)
      .setDepth(900)
      .setVisible(false);

    // 6. HUD (Depth 100-200)
    this.hud = new HUD(this);
    this.hud.setRound(this.round);
    this.hud.setScore(this.score);
    this.hud.setBullets(3);

    // 7. Tactical Crosshair (Depth 1000)
    this.crosshair = new Crosshair(this);

    // Input Handling for Shooting
    this.input.on('pointerdown', (pointer) => {
      this.handleShot(pointer);
    });

    // Start Round
    this.startRound();
  }

  getPassQuota() {
    if (this.round <= 3) return 6;
    if (this.round <= 6) return 7;
    if (this.round <= 9) return 8;
    return 9;
  }

  getSpeedMultiplier() {
    return 1.0 + (this.round - 1) * 0.12;
  }

  startRound() {
    this.targets = [];
    this.hud.setRound(this.round);
    this.hud.setTargets(this.targets);

    sounds.playJingleRoundStart();
    const quota = this.getPassQuota();

    this.hud.showBanner(`ROUND ${this.round}\nQUOTA: ${quota}/10`, 1600, '#00d2d3', () => {
      this.startNextWave();
    });
  }

  startNextWave() {
    if (this.targets.length >= 10) {
      this.evaluateRound();
      return;
    }

    this.bullets = 3;
    this.hud.setBullets(this.bullets);
    this.isWaveActive = true;
    this.waveResolved = false;
    this.currentTargetsInWave = [];

    // Determine target count for this wave
    const remainingSlots = 10 - this.targets.length;
    const countToSpawn = this.mode === 2 ? Math.min(2, remainingSlots) : 1;

    for (let i = 0; i < countToSpawn; i++) {
      const isRed = Math.random() < 0.28; // 28% chance for Red Pocong
      const spawnX = countToSpawn === 2 
        ? (i === 0 ? Phaser.Math.Between(70, 200) : Phaser.Math.Between(260, 420))
        : Phaser.Math.Between(80, 400);

      const pocong = new Pocong(this, spawnX, 215, isRed ? 'red' : 'white', this.getSpeedMultiplier());
      this.currentTargetsInWave.push(pocong);

      // Stagger spawn slightly if 2 pocong
      this.time.delayedCall(i * 140, () => {
        if (pocong && !pocong.isFinished) {
          pocong.spawn();
        }
      });
    }

    // Safety timeout: if wave takes longer than 9s, force escape
    this.time.delayedCall(9000, () => {
      if (this.isWaveActive && !this.waveResolved) {
        this.currentTargetsInWave.forEach(p => {
          if (!p.isFinished && !p.wasHit) p.escape();
        });
      }
    });
  }

  handleShot(pointer) {
    if (!this.isWaveActive) return;

    if (this.bullets <= 0) {
      sounds.playEmptyGun();
      return;
    }

    // Gunshot fired
    this.bullets--;
    this.hud.setBullets(this.bullets);
    sounds.playGunshot();

    // Screen shake for arcade punch!
    this.cameras.main.shake(80, 0.007);

    // Screen flash
    this.flashOverlay.setVisible(true);
    this.time.delayedCall(40, () => {
      this.flashOverlay.setVisible(false);
    });

    // Check hit on active targets in wave
    const px = pointer.x;
    const py = pointer.y;

    for (const pocong of this.currentTargetsInWave) {
      if (!pocong.isFinished && !pocong.wasHit && pocong.state !== 'ESCAPING') {
        const bounds = pocong.getBounds();
        const expandedBounds = new Phaser.Geom.Rectangle(
          bounds.x - 8,
          bounds.y - 8,
          bounds.width + 16,
          bounds.height + 16
        );

        if (Phaser.Geom.Rectangle.Contains(expandedBounds, px, py)) {
          const success = pocong.onShot();
          if (success) {
            const earnedScore = pocong.getScoreValue(this.round);
            this.score += earnedScore;
            this.hud.setScore(this.score);

            // Record hit
            this.targets.push('hit');
            this.hud.setTargets(this.targets);

            // Popup floating score text
            this.showScorePopup(pocong.x, pocong.y, `+${earnedScore}`, pocong.type === 'red' ? '#ff4757' : '#2ed573');
            break;
          }
        }
      }
    }

    // If bullets ran out and there are still unhit targets, they escape immediately!
    if (this.bullets === 0) {
      const remainingPocongs = this.currentTargetsInWave.filter(p => !p.isFinished && !p.wasHit);
      if (remainingPocongs.length > 0) {
        this.time.delayedCall(150, () => {
          remainingPocongs.forEach(p => p.escape());
        });
      }
    }

    this.checkWaveCompletion();
  }

  showScorePopup(x, y, text, color = '#2ed573') {
    const popup = this.add.text(x, y, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: popup,
      y: y - 30,
      scaleX: { from: 1.3, to: 1.0 },
      scaleY: { from: 1.3, to: 1.0 },
      alpha: 0,
      duration: 750,
      onComplete: () => popup.destroy()
    });
  }

  checkWaveCompletion() {
    if (this.waveResolved) return;
    if (this.currentTargetsInWave.length === 0) return;

    const allFinished = this.currentTargetsInWave.every(p => p.isFinished);
    if (!allFinished) return;

    this.waveResolved = true;
    this.isWaveActive = false;

    // Check which ones missed
    let missedCount = 0;
    this.currentTargetsInWave.forEach(p => {
      if (!p.wasHit) {
        missedCount++;
        this.targets.push('miss');
      }
    });
    this.hud.setTargets(this.targets);

    // Average X coordinate for Kuntilanak popup
    const avgX = this.currentTargetsInWave.reduce((sum, p) => sum + p.x, 0) / this.currentTargetsInWave.length;

    this.time.delayedCall(250, () => {
      this.currentTargetsInWave.forEach(p => p.destroy());
      this.currentTargetsInWave = [];

      if (missedCount > 0) {
        // Mocking laugh
        this.kuntilanak.laugh(avgX, () => {
          this.startNextWave();
        });
      } else {
        // Celebrate hit
        this.kuntilanak.celebrate(avgX, () => {
          this.startNextWave();
        });
      }
    });
  }

  evaluateRound() {
    const hits = this.targets.filter(t => t === 'hit').length;
    const quota = this.getPassQuota();

    if (hits >= quota) {
      // Round Cleared!
      sounds.playJingleRoundClear();
      this.hud.showBanner(`ROUND CLEAR!\n${hits}/10 HIT`, 2000, '#2ed573', () => {
        this.round++;
        this.startRound();
      });
    } else {
      // Game Over!
      this.hud.showBanner(`GAME OVER!\nONLY ${hits}/10 HIT`, 1800, '#ff4757', () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          round: this.round,
          mode: this.mode
        });
      });
    }
  }

  update() {
    // Animate rolling graveyard mist horizontally
    if (this.mist) {
      this.mist.tilePositionX += 0.35;
    }

    // Check wave status when targets finish falling/escaping
    if (this.isWaveActive && !this.waveResolved) {
      this.checkWaveCompletion();
    }
  }
}
