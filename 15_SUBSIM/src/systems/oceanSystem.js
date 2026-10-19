import * as THREE from 'three';

export class OceanSystem {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.weather = 'day';
    this.waveAmplitude = 0.55;
    this.waveSpeed = 1.0;

    this.createSkyAndLighting();
    this.createOceanMesh();
    this.createUnderwaterParticles();
  }

  createSkyAndLighting() {
    // Sky background color
    this.scene.background = new THREE.Color(0x9bc2dc);

    // Ambient light for soft filling
    this.ambientLight = new THREE.AmbientLight(0x9fc0d8, 1.3);
    this.scene.add(this.ambientLight);

    // Directional Sunlight (bright daytime sun as in screenshot)
    this.sunLight = new THREE.DirectionalLight(0xfffbf2, 2.8);
    this.sunLight.position.set(120, 160, 110);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -140;
    this.sunLight.shadow.camera.right = 140;
    this.sunLight.shadow.camera.top = 140;
    this.sunLight.shadow.camera.bottom = -140;
    this.scene.add(this.sunLight);

    // Sky/Ocean bounce light
    this.hemiLight = new THREE.HemisphereLight(0xdbeaf6, 0x1a4563, 1.1);
    this.scene.add(this.hemiLight);

    // Horizon fog matching bright Atlantic sky
    this.scene.fog = new THREE.FogExp2(0xa2c5dd, 0.0011);
  }

  createOceanMesh() {
    this.oceanGeom = new THREE.PlaneGeometry(2400, 2400, 180, 180);
    this.oceanGeom.rotateX(-Math.PI / 2);

    this.basePositions = this.oceanGeom.attributes.position.clone();

    // Atlantic Ocean water material (matches screenshot bright blue sea)
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x1f5c7e,
      roughness: 0.16,
      metalness: 0.72,
      flatShading: true,
      side: THREE.DoubleSide
    });

    this.oceanMesh = new THREE.Mesh(this.oceanGeom, this.oceanMat);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  createUnderwaterParticles() {
    const count = 1000;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 500;
      positions[i + 1] = -Math.random() * 90;
      positions[i + 2] = (Math.random() - 0.5) * 500;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x88cce0,
      size: 0.7,
      transparent: true,
      opacity: 0.45
    });

    this.particles = new THREE.Points(geom, mat);
    this.scene.add(this.particles);
  }

  getWaveHeight(x, z, t) {
    const time = t * this.waveSpeed;
    const w1 = Math.sin(x * 0.018 + time * 1.1) * Math.cos(z * 0.014 + time * 0.7) * this.waveAmplitude;
    const w2 = Math.sin(x * 0.04 - time * 1.6 + z * 0.025) * (this.waveAmplitude * 0.35);
    const w3 = Math.cos(z * 0.06 + time * 2.0) * (this.waveAmplitude * 0.15);
    return w1 + w2 + w3;
  }

  setWeather(type) {
    this.weather = type;
    switch (type) {
      case 'day':
        this.scene.background.setHex(0x9bc2dc);
        this.sunLight.color.setHex(0xfffbf2);
        this.sunLight.intensity = 2.8;
        this.sunLight.position.set(120, 160, 110);
        this.ambientLight.color.setHex(0x9fc0d8);
        this.ambientLight.intensity = 1.3;
        this.scene.fog.color.setHex(0xa2c5dd);
        this.scene.fog.density = 0.0011;
        this.oceanMat.color.setHex(0x1f5c7e);
        this.waveAmplitude = 0.55;
        break;

      case 'sunset':
        this.scene.background.setHex(0xb56345);
        this.sunLight.color.setHex(0xff7733);
        this.sunLight.intensity = 2.6;
        this.sunLight.position.set(200, 35, 100);
        this.ambientLight.color.setHex(0x6e433a);
        this.ambientLight.intensity = 0.8;
        this.scene.fog.color.setHex(0xb56345);
        this.scene.fog.density = 0.0022;
        this.oceanMat.color.setHex(0x212a42);
        this.waveAmplitude = 0.7;
        break;

      case 'night':
        this.scene.background.setHex(0x0a121c);
        this.sunLight.color.setHex(0x6a87b8);
        this.sunLight.intensity = 0.45;
        this.sunLight.position.set(60, 100, 80);
        this.ambientLight.color.setHex(0x152230);
        this.ambientLight.intensity = 0.4;
        this.scene.fog.color.setHex(0x0a121c);
        this.scene.fog.density = 0.0028;
        this.oceanMat.color.setHex(0x0c1924);
        this.waveAmplitude = 0.65;
        break;

      case 'storm':
        this.scene.background.setHex(0x24323c);
        this.sunLight.color.setHex(0x566573);
        this.sunLight.intensity = 0.9;
        this.sunLight.position.set(40, 100, 40);
        this.ambientLight.color.setHex(0x35424c);
        this.ambientLight.intensity = 0.6;
        this.scene.fog.color.setHex(0x283844);
        this.scene.fog.density = 0.005;
        this.oceanMat.color.setHex(0x142732);
        this.waveAmplitude = 2.2;
        break;
    }
  }

  update(delta, cameraY) {
    this.time += delta;

    const pos = this.oceanGeom.attributes.position;
    const base = this.basePositions;

    for (let i = 0; i < pos.count; i++) {
      const x = base.getX(i);
      const z = base.getZ(i);
      const y = this.getWaveHeight(x, z, this.time);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    this.oceanGeom.computeVertexNormals();

    const isUnderwater = cameraY < 0;
    if (isUnderwater) {
      this.scene.fog.color.setHex(0x051e2c);
      this.scene.fog.density = 0.016;
      this.ambientLight.color.setHex(0x09344c);
    } else {
      if (this.weather === 'day') {
        this.scene.fog.color.setHex(0xa2c5dd);
        this.scene.fog.density = 0.0011;
        this.ambientLight.color.setHex(0x9fc0d8);
      }
    }
  }
}
