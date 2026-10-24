/**
 * BMW M4 Coupé 3D Model Loader (Three.js)
 * Loads high-fidelity authentic BMW M4 Competition 3D Model with PBR materials.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadBMWModel() {
  const loader = new GLTFLoader();
  const materials = {
    paint: null,
    headlights: [],
    taillights: [],
    calipers: []
  };

  try {
    const gltf = await loader.loadAsync('assets/models/bmw_m4.glb');
    const root = gltf.scene;
    root.name = 'BMW_M4_Competition_Authentic';

    // Master Paint Material for BMW Body
    const bodyPaintMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a3b2b, // M Isle of Man Green
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
      side: THREE.DoubleSide
    });
    materials.paint = bodyPaintMaterial;

    // Traverse all meshes and assign high quality PBR settings
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const matName = child.material?.name || '';
        const meshName = child.name || '';

        // Car Body Paint
        if (
          matName.includes('body') ||
          matName === 'Meshesbody151Mtl' ||
          meshName.toLowerCase().includes('body')
        ) {
          child.material = bodyPaintMaterial;
        }

        // Headlights & LED DRLs
        if (
          matName.includes('headlight') ||
          matName.includes('led') ||
          matName === 'Meshesheadlight51Mtl' ||
          matName === 'Meshesled11Mtl'
        ) {
          child.material.emissive = new THREE.Color(0x00e5ff);
          child.material.emissiveIntensity = 2.0;
          materials.headlights.push(child.material);
        }

        // Taillights
        if (matName.includes('redlight') || matName.includes('tail')) {
          child.material.emissive = new THREE.Color(0xff0020);
          child.material.emissiveIntensity = 1.6;
          materials.taillights.push(child.material);
        }

        // Brake Calipers
        if (matName.toLowerCase().includes('caliper')) {
          child.material.color = new THREE.Color(0x0066b1); // BMW M Blue
          child.material.metalness = 0.8;
          child.material.roughness = 0.25;
          materials.calipers.push(child.material);
        }

        // Windows Glass
        if (matName.toLowerCase().includes('window') || matName.toLowerCase().includes('glass')) {
          child.material.transparent = true;
          child.material.opacity = 0.75;
          child.material.metalness = 0.1;
          child.material.roughness = 0.05;
        }

        // Chrome / Metallic Grille & Emblems
        if (matName.toLowerCase().includes('chrome') || matName.toLowerCase().includes('logo')) {
          child.material.metalness = 0.95;
          child.material.roughness = 0.1;
        }
      }
    });

    // Normalize scale and ground placement
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 4.6; // Normalized length in 3D showroom
    const scale = targetSize / maxDim;
    root.scale.setScalar(scale);

    // Recompute bounding box after scale
    const scaledBox = new THREE.Box3().setFromObject(root);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    root.position.x = -scaledCenter.x;
    root.position.z = -scaledCenter.z;
    root.position.y = -scaledBox.min.y; // Sits flush on reflective floor

    return {
      mesh: root,
      materials
    };
  } catch (error) {
    console.warn('Could not load authentic GLB model, falling back to procedural model:', error);
    return createProceduralBMWModel();
  }
}

/**
 * Procedural Fallback Model
 */
export function createProceduralBMWModel() {
  const carGroup = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0x0a3b2b,
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 1.0
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 4.3), paint);
  body.position.y = 0.42;
  carGroup.add(body);

  return {
    mesh: carGroup,
    materials: { paint, headlights: [], taillights: [] }
  };
}
