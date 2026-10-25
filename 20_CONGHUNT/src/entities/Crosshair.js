import Phaser from 'phaser';

export class Crosshair extends Phaser.GameObjects.Sprite {
  constructor(scene) {
    super(scene, 160, 120, 'crosshair');
    this.scene = scene;
    this.setOrigin(0.5, 0.5);
    this.setDepth(1000); // Always on top
    scene.add.existing(this);

    // Track pointer
    scene.input.on('pointermove', (pointer) => {
      this.setPosition(pointer.x, pointer.y);
    });

    scene.input.on('pointerdown', (pointer) => {
      this.setPosition(pointer.x, pointer.y);
    });
  }

  updatePosition(x, y) {
    this.setPosition(x, y);
  }
}
