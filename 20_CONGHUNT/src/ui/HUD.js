import Phaser from 'phaser';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.bullets = 3;
    this.score = 0;
    this.round = 1;
    this.targets = [];
    this.bulletIcons = [];
    this.targetIcons = [];

    this.createHUD();
  }

  createHUD() {
    // 1. Widescreen 480px Arcade Bottom HUD Bar
    const hudBar = this.scene.add.rectangle(240, 254, 480, 32, 0x05040a, 0.95);
    hudBar.setDepth(100);
    hudBar.setStrokeStyle(1, 0xd63031);

    // 2. Bullets Container (Left: x = 15 to 80)
    this.scene.add.text(16, 244, 'AMMO', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffa502'
    }).setDepth(101);

    this.bulletIcons = [];
    for (let i = 0; i < 3; i++) {
      const b = this.scene.add.image(22 + i * 14, 258, 'ui_bullet').setDepth(101);
      this.bulletIcons.push(b);
    }

    // 3. Center Target Indicators (Center: x = 175 to 305)
    this.scene.add.text(125, 248, 'POCONG', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#2ed573'
    }).setDepth(101);

    this.targetIcons = [];
    for (let i = 0; i < 10; i++) {
      const t = this.scene.add.image(175 + i * 14, 252, 'ui_target_pending').setDepth(101);
      this.targetIcons.push(t);
    }

    // Round Number Indicator
    this.roundText = this.scene.add.text(240, 263, 'ROUND 1', {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#00d2d3'
    }).setOrigin(0.5).setDepth(101);

    // 4. Score Container (Right: x = 360 to 470)
    this.scene.add.text(355, 244, 'SCORE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#cbd5e1'
    }).setDepth(101);

    this.scoreText = this.scene.add.text(355, 255, '000000', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setDepth(101);

    // 5. Giant Retro Center Announcement Banner
    this.banner = this.scene.add.text(240, 110, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      align: 'center',
      color: '#ffffff',
      backgroundColor: '#000000dd',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(200).setVisible(false);
  }

  setRound(round) {
    this.round = round;
    this.roundText.setText(`ROUND ${round}`);
  }

  setBullets(count) {
    this.bullets = count;
    for (let i = 0; i < 3; i++) {
      if (i < count) {
        this.bulletIcons[i].setTexture('ui_bullet');
      } else {
        this.bulletIcons[i].setTexture('ui_bullet_empty');
      }
    }
  }

  setTargets(targetsArray) {
    this.targets = targetsArray;
    for (let i = 0; i < 10; i++) {
      const status = targetsArray[i] || 'pending';
      if (status === 'hit') {
        this.targetIcons[i].setTexture('ui_target_hit');
      } else if (status === 'miss') {
        this.targetIcons[i].setTexture('ui_target_miss');
      } else {
        this.targetIcons[i].setTexture('ui_target_pending');
      }
    }
  }

  setScore(score) {
    this.score = score;
    this.scoreText.setText(score.toString().padStart(6, '0'));
  }

  showBanner(text, duration = 1500, color = '#ffffff', onComplete = null) {
    this.banner.setText(text).setColor(color).setVisible(true).setAlpha(1);

    this.scene.tweens.add({
      targets: this.banner,
      scaleX: { from: 0.8, to: 1.0 },
      scaleY: { from: 0.8, to: 1.0 },
      duration: 200,
      ease: 'Back.easeOut'
    });

    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: this.banner,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.banner.setVisible(false);
          if (onComplete) onComplete();
        }
      });
    });
  }
}
