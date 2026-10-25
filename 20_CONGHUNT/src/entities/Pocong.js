import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager.js';

export class Pocong extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type = 'white', roundSpeedMultiplier = 1.0) {
    const textureKey = type === 'red' ? 'pocong_red' : 'pocong_white';
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.type = type;
    this.speedMultiplier = roundSpeedMultiplier;
    this.baseSpeed = type === 'red' ? 1.6 : 1.0;
    this.state = 'IDLE';
    this.jumpCount = 0;
    this.maxJumps = 4;
    this.wasHit = false;
    this.isFinished = false;

    this.setOrigin(0.5, 0.5);
    this.setDepth(15); // Behind foreground grass (20)

    scene.add.existing(this);
    this.setVisible(false);

    // Interactive hit box with generous padding
    this.setInteractive(new Phaser.Geom.Rectangle(-6, -6, 40, 56), Phaser.Geom.Rectangle.Contains);
  }

  spawn() {
    this.state = 'SPAWNING';
    this.setVisible(true);
    this.y = 215;
    this.jumpCount = 0;

    sounds.playPocongJump();

    // Squash & Stretch on initial launch out of the grave
    this.setScale(1.2, 0.8);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      y: 155 + Math.random() * 20,
      duration: 380 / (this.baseSpeed * this.speedMultiplier),
      ease: 'Back.easeOut',
      onComplete: () => {
        if (this.state === 'SPAWNING') {
          this.state = 'HOPPING';
          this.executeNextHop();
        }
      }
    });
  }

  executeNextHop() {
    if (this.state !== 'HOPPING') return;

    this.jumpCount++;
    if (this.jumpCount > this.maxJumps) {
      this.escape();
      return;
    }

    sounds.playPocongJump();

    // 16:9 Widescreen target range (35 to 445 px)
    const nextX = Phaser.Math.Between(40, 440);
    const peakY = Phaser.Math.Between(30, 115);
    const landY = Phaser.Math.Between(135, 195);

    const isMovingRight = nextX > this.x;
    this.setAngle(isMovingRight ? 10 : -10);

    const jumpDuration = (560 + Math.random() * 200) / (this.baseSpeed * this.speedMultiplier);

    // Dynamic Squash & Stretch
    this.setScale(0.9, 1.15); // Stretch upward during ascent

    this.scene.tweens.add({
      targets: this,
      x: nextX,
      duration: jumpDuration,
      ease: 'Linear'
    });

    this.scene.tweens.add({
      targets: this,
      y: peakY,
      duration: jumpDuration * 0.45,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.state !== 'HOPPING') return;
        this.setScale(1.1, 0.95); // Peak float

        this.scene.tweens.add({
          targets: this,
          y: landY,
          duration: jumpDuration * 0.55,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (this.state === 'HOPPING') {
              this.setAngle(0);
              this.setScale(1.2, 0.8); // Squash on land
              this.scene.tweens.add({
                targets: this,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 100
              });

              // Brief pause before next hop
              this.scene.time.delayedCall(120 / this.speedMultiplier, () => {
                this.executeNextHop();
              });
            }
          }
        });
      }
    });
  }

  onShot() {
    if (this.wasHit || this.state === 'HIT' || this.state === 'ESCAPING' || this.isFinished) {
      return false;
    }

    this.wasHit = true;
    this.state = 'HIT';

    // Stop active tweens
    this.scene.tweens.killTweensOf(this);

    // Swap to Hit Texture with X Eyes
    this.setTexture(this.type === 'red' ? 'pocong_red_hit' : 'pocong_white_hit');
    this.setAngle(this.angle + (Math.random() > 0.5 ? 25 : -25));
    this.setScale(1.15, 1.15);

    // Emit cloth/spark particles
    this.emitDeathParticles();

    sounds.playHit();

    // Pause briefly in mid-air (classic Duck Hunt freeze), then plummet
    this.scene.time.delayedCall(180, () => {
      sounds.playFall();

      this.scene.tweens.add({
        targets: this,
        y: 255,
        angle: this.angle * 3,
        duration: 480,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.state = 'DEAD';
          this.isFinished = true;
          this.setVisible(false);
          this.scene.events.emit('pocong-dead', this);
        }
      });
    });

    return true;
  }

  emitDeathParticles() {
    const partKey = this.type === 'red' ? 'part_spark' : 'part_cloth';
    for (let i = 0; i < 8; i++) {
      const p = this.scene.add.image(this.x, this.y, partKey).setDepth(25);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: p,
        x: p.x + vx,
        y: p.y + vy + 30,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy()
      });
    }
  }

  escape() {
    if (this.wasHit || this.state === 'HIT' || this.state === 'ESCAPING' || this.isFinished) {
      return;
    }

    this.state = 'ESCAPING';
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    this.setScale(0.85, 1.3); // Stretched thin as it accelerates into the sky

    // Fly straight up into the night sky
    this.scene.tweens.add({
      targets: this,
      y: -60,
      duration: 620 / (this.baseSpeed * this.speedMultiplier),
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.isFinished = true;
        this.setVisible(false);
        this.scene.events.emit('pocong-escaped', this);
      }
    });
  }

  getScoreValue(round = 1) {
    const base = this.type === 'red' ? 1500 : 500;
    return base + (round - 1) * 100;
  }
}
