import Phaser from 'phaser';
import { sounds } from '../audio/SoundManager.js';

export class Kuntilanak extends Phaser.GameObjects.Sprite {
  constructor(scene) {
    super(scene, 240, 260, 'kunti_laugh');
    this.scene = scene;
    this.setOrigin(0.5, 0.5);
    this.setDepth(18); // Behind foreground grass (20)
    this.setVisible(false);
    this.isActing = false;

    scene.add.existing(this);
  }

  laugh(targetX = 240, onComplete = null) {
    if (this.isActing) return;
    this.isActing = true;

    // Pick closest tombstone cluster or target X
    const spawnX = targetX ? Phaser.Math.Clamp(targetX, 80, 400) : 240;
    this.setPosition(spawnX, 260);
    this.setTexture('kunti_laugh');
    this.setVisible(true);

    // Pop up animation with bounce
    this.scene.tweens.add({
      targets: this,
      y: 185,
      duration: 360,
      ease: 'Back.easeOut',
      onComplete: () => {
        sounds.playKuntiLaugh();

        // Shaking hysterical chuckle tween
        const shakeTween = this.scene.tweens.add({
          targets: this,
          y: 180,
          duration: 85,
          yoyo: true,
          repeat: 9
        });

        // Hide down after mocking
        this.scene.time.delayedCall(1350, () => {
          shakeTween.stop();
          this.scene.tweens.add({
            targets: this,
            y: 260,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => {
              this.setVisible(false);
              this.isActing = false;
              if (onComplete) onComplete();
            }
          });
        });
      }
    });
  }

  celebrate(targetX = 240, onComplete = null) {
    if (this.isActing) return;
    this.isActing = true;

    const spawnX = targetX ? Phaser.Math.Clamp(targetX, 80, 400) : 240;
    this.setPosition(spawnX, 260);
    this.setTexture('kunti_hold');
    this.setVisible(true);

    // Pop up proudly
    this.scene.tweens.add({
      targets: this,
      y: 180,
      duration: 360,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(1200, () => {
          this.scene.tweens.add({
            targets: this,
            y: 260,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => {
              this.setVisible(false);
              this.isActing = false;
              if (onComplete) onComplete();
            }
          });
        });
      }
    });
  }
}
