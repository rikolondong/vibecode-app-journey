/**
 * BMW M 3D Showroom Scene & Environment
 * Handles Scene, Camera, OrbitControls, Studio Lighting, Floor Reflections, and Render Loop.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ShowroomScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.lights = {};
    this.car = null;
    this.isAutoRotating = true;
    this.targetCameraPos = null;
    this.targetLookAt = null;
    this.currentLookAt = new THREE.Vector3(0, 0.5, 0);

    this._init();
  }

  _init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080d);
    this.scene.fog = new THREE.FogExp2(0x06080d, 0.045);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(3.8, 1.4, 4.2);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 10.0;
    this.controls.target.copy(this.currentLookAt);

    // User manual interaction pauses auto-rotation
    this.controls.addEventListener('start', () => {
      this.isAutoRotating = false;
    });

    // 5. Setup Studio Lights & Reflective Floor
    this._setupStudioLighting();
    this._setupStudioFloor();

    // 6. Responsive Resize Listener
    window.addEventListener('resize', () => this._onResize());

    // 7. Start Render Loop
    this._animate();
  }

  _setupStudioLighting() {
    // Soft ambient illumination
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.lights.ambient);

    // Main Studio Overhead Softbox
    this.lights.mainSpot = new THREE.SpotLight(0xffffff, 3.5);
    this.lights.mainSpot.position.set(4, 7, 3);
    this.lights.mainSpot.angle = Math.PI / 4;
    this.lights.mainSpot.penumbra = 0.8;
    this.lights.mainSpot.castShadow = true;
    this.lights.mainSpot.shadow.mapSize.width = 2048;
    this.lights.mainSpot.shadow.mapSize.height = 2048;
    this.lights.mainSpot.shadow.camera.near = 1;
    this.lights.mainSpot.shadow.camera.far = 15;
    this.lights.mainSpot.shadow.bias = -0.001;
    this.scene.add(this.lights.mainSpot);

    // Rim Silhouette Light (Highlights roof and shoulder line)
    this.lights.rimLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    this.lights.rimLight.position.set(-5, 4, -4);
    this.scene.add(this.lights.rimLight);

    // Warm Front Accent Light
    this.lights.fillLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    this.lights.fillLight.position.set(0, 3, 5);
    this.scene.add(this.lights.fillLight);

    // Front Headlight Projection Spotlights
    this.lights.headlightLeft = new THREE.SpotLight(0x00e5ff, 4.0, 12, Math.PI / 6, 0.6);
    this.lights.headlightLeft.position.set(0.68, 0.52, 2.14);
    this.lights.headlightLeft.target.position.set(1.0, 0, 8);
    this.scene.add(this.lights.headlightLeft);
    this.scene.add(this.lights.headlightLeft.target);

    this.lights.headlightRight = new THREE.SpotLight(0x00e5ff, 4.0, 12, Math.PI / 6, 0.6);
    this.lights.headlightRight.position.set(-0.68, 0.52, 2.14);
    this.lights.headlightRight.target.position.set(-1.0, 0, 8);
    this.scene.add(this.lights.headlightRight);
    this.scene.add(this.lights.headlightRight.target);
  }

  _setupStudioFloor() {
    // Reflective dark floor
    const floorGeo = new THREE.CircleGeometry(16, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.18,
      metalness: 0.85
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid Floor Guide
    const grid = new THREE.GridHelper(24, 24, 0x0066b1, 0x121722);
    grid.position.y = 0.005;
    this.scene.add(grid);
  }

  setCar(carObject) {
    if (this.car) {
      this.scene.remove(this.car.mesh);
    }
    this.car = carObject;
    this.scene.add(this.car.mesh);
  }

  setPaintColor(colorHex, metalness, roughness, clearcoat, clearcoatRoughness) {
    if (!this.car || !this.car.materials.paint) return;
    const paint = this.car.materials.paint;
    paint.color.setHex(colorHex);
    if (metalness !== undefined) paint.metalness = metalness;
    if (roughness !== undefined) paint.roughness = roughness;
    if (clearcoat !== undefined) paint.clearcoat = clearcoat;
    if (clearcoatRoughness !== undefined) paint.clearcoatRoughness = clearcoatRoughness;
    paint.needsUpdate = true;
  }

  setHeadlights(isOn) {
    if (!this.car || !this.car.materials.headlights) return;
    const lights = Array.isArray(this.car.materials.headlights)
      ? this.car.materials.headlights
      : [this.car.materials.headlights];

    lights.forEach(mat => {
      if (mat) {
        mat.emissiveIntensity = isOn ? 2.0 : 0.05;
        mat.needsUpdate = true;
      }
    });

    if (this.lights.headlightLeft) this.lights.headlightLeft.intensity = isOn ? 4.0 : 0;
    if (this.lights.headlightRight) this.lights.headlightRight.intensity = isOn ? 4.0 : 0;
  }

  setStudioLighting(isNightNeon) {
    if (isNightNeon) {
      this.lights.rimLight.color.setHex(0xe0001b); // BMW M Red rim
      this.lights.ambient.intensity = 0.35;
      this.lights.mainSpot.intensity = 2.0;
    } else {
      this.lights.rimLight.color.setHex(0x00e5ff); // BMW Cyan rim
      this.lights.ambient.intensity = 0.65;
      this.lights.mainSpot.intensity = 3.5;
    }
  }

  animateToCameraPreset(targetPos, targetLookAt) {
    this.targetCameraPos = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    this.targetLookAt = new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z);
    this.isAutoRotating = false;
  }

  _onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    // Camera preset smooth tweening
    if (this.targetCameraPos) {
      this.camera.position.lerp(this.targetCameraPos, 0.06);
      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.02) {
        this.targetCameraPos = null;
      }
    }

    if (this.targetLookAt) {
      this.currentLookAt.lerp(this.targetLookAt, 0.06);
      this.controls.target.copy(this.currentLookAt);
      if (this.currentLookAt.distanceTo(this.targetLookAt) < 0.02) {
        this.targetLookAt = null;
      }
    }

    // Auto rotate when idle
    if (this.isAutoRotating && this.car) {
      this.car.mesh.rotation.y += 0.003;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
