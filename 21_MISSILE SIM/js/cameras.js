/**
 * Multi-Camera & Optical View System for Missile Simulator
 * Handles Chase Cam, Nose/Seeker Cam, Launcher Binoculars, Target Cam, Aftermath Cam, and FLIR vision
 */

class CameraSystem {
  constructor(camera, domElement, terrain) {
    this.camera = camera;
    this.domElement = domElement;
    this.terrain = terrain;

    this.mode = 'chase'; // 'chase', 'seeker', 'launcher', 'target'
    this.flirActive = false;
    this.defaultFov = 55;

    this.launcherPos = new THREE.Vector3(0, 78, -4320);
    this.smoothPos = new THREE.Vector3().copy(this.launcherPos);
    this.smoothLookAt = new THREE.Vector3(0, 120, 0);
    this.orbitAngle = 0;
  }

  setMode(mode) {
    this.mode = mode;
    const staticGlitch = document.getElementById('static-glitch');
    if (staticGlitch) staticGlitch.classList.remove('active');

    // Reset FOV if leaving launcher binocular zoom
    if (mode !== 'launcher' && Math.abs(this.camera.fov - this.defaultFov) > 0.5) {
      this.camera.fov = this.defaultFov;
      this.camera.updateProjectionMatrix();
    }

    // Update active button state in HUD
    document.querySelectorAll('.btn-cam').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cam === mode);
    });
  }

  onLaunch(missile) {
    if (!missile) return;
    const dir = missile.velocity.clone().normalize();
    this.smoothPos.copy(missile.position).sub(dir.clone().multiplyScalar(40)).add(new THREE.Vector3(0, 12, 0));
    this.smoothLookAt.copy(missile.position).add(dir.clone().multiplyScalar(60));
    const staticGlitch = document.getElementById('static-glitch');
    if (staticGlitch) staticGlitch.classList.remove('active');
  }

  toggleFLIR() {
    this.flirActive = !this.flirActive;
    const overlay = document.getElementById('flir-overlay');
    const btn = document.getElementById('btn-flir');

    if (overlay) overlay.classList.toggle('active', this.flirActive);
    if (btn) btn.classList.toggle('active', this.flirActive);

    return this.flirActive;
  }

  update(delta, missileController, targetManager, vfxManager, selectedTargetId = 'bunker_alpha') {
    const missile = missileController ? missileController.activeMissile : null;
    const state = missileController ? missileController.state : 'idle';
    const inFlight = missile && state === 'in_flight';

    // Hide missile 3D mesh in Seeker POV so nose cone never clips camera lens
    if (missile && missile.model) {
      missile.model.visible = (this.mode !== 'seeker');
    }

    // Screen shake integration
    const shakeOffset = vfxManager ? vfxManager.getScreenShakeOffset() : new THREE.Vector3();

    if (inFlight) {
      switch (this.mode) {
        case 'chase':
          this.updateChaseCam(missile, delta);
          break;
        case 'seeker':
          this.updateSeekerCam(missile, delta);
          break;
        case 'launcher':
          this.updateLauncherCam(missile, delta);
          break;
        case 'target':
          this.updateTargetCam(missile, delta);
          break;
      }
    } else if (missile && (state === 'hit' || state === 'intercepted') && missile.hitPos) {
      // Aftermath Impact Cam: Linger and slowly orbit around the explosion / destroyed structure
      this.resetFovSmooth(delta, 50);
      this.orbitAngle += delta * 0.35;
      const radius = state === 'intercepted' ? 95 : 135;
      const desiredCamPos = new THREE.Vector3(
        missile.hitPos.x + Math.sin(this.orbitAngle) * radius,
        missile.hitPos.y + 55,
        missile.hitPos.z - Math.cos(this.orbitAngle) * radius
      );
      if (this.terrain) {
        const groundY = this.terrain.getTerrainHeight(desiredCamPos.x, desiredCamPos.z);
        desiredCamPos.y = Math.max(desiredCamPos.y, groundY + 18);
      }
      this.camera.position.lerp(desiredCamPos, delta * 4.5);
      this.smoothLookAt.lerp(missile.hitPos, delta * 8.0);
      this.camera.lookAt(this.smoothLookAt);
    } else {
      // Idle / Standby Mode
      this.resetFovSmooth(delta, this.defaultFov);
      const selectedTarget = targetManager && targetManager.targets.find(t => t.id === selectedTargetId)
        || (targetManager && targetManager.targets[0]);
      const lookTarget = selectedTarget ? selectedTarget.position : new THREE.Vector3(0, 300, 0);

      if (this.mode === 'target' && selectedTarget) {
        // Preview the selected target up close when in Target Cam mode
        this.orbitAngle += delta * 0.25;
        const previewPos = selectedTarget.position.clone().add(
          new THREE.Vector3(Math.sin(this.orbitAngle) * 110, 48, -Math.cos(this.orbitAngle) * 110)
        );
        if (this.terrain) {
          const gY = this.terrain.getTerrainHeight(previewPos.x, previewPos.z);
          previewPos.y = Math.max(previewPos.y, gY + 15);
        }
        this.camera.position.lerp(previewPos, delta * 5.0);
        this.smoothLookAt.lerp(selectedTarget.position, delta * 8.0);
        this.camera.lookAt(this.smoothLookAt);
      } else {
        // Overview from Launch Pad looking toward selected target
        this.camera.position.lerp(this.launcherPos, delta * 4.0);
        this.smoothLookAt.lerp(lookTarget, delta * 6.0);
        this.camera.lookAt(this.smoothLookAt);
      }
    }

    // Apply Screen Shake
    this.camera.position.add(shakeOffset);
  }

  resetFovSmooth(delta, targetFov = 55) {
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 6.0);
      this.camera.updateProjectionMatrix();
    }
  }

  // 1. Chase Cam: Smooth third-person following missile with terrain & gimbal protection
  updateChaseCam(missile, delta) {
    this.resetFovSmooth(delta, this.defaultFov);
    const dir = missile.velocity.clone().normalize();

    // Prevent gimbal lock during near-vertical top-attack / ballistic dives
    const horizontalBack = new THREE.Vector3(-dir.x, 0, -dir.z);
    if (horizontalBack.lengthSq() < 0.01) {
      horizontalBack.set(0, 0, -1);
    } else {
      horizontalBack.normalize();
    }

    const followDist = (missile.typeId === 'iskander' || missile.typeId === 'kinzhal') ? 58 : 34;
    const followElev = (missile.typeId === 'iskander' || missile.typeId === 'kinzhal') ? 18 : 11;

    const desiredPos = missile.position.clone()
      .sub(dir.clone().multiplyScalar(followDist))
      .add(horizontalBack.multiplyScalar(8))
      .add(new THREE.Vector3(0, followElev, 0));

    // Clamp above mountain terrain so camera never clips underground
    if (this.terrain) {
      const groundH = this.terrain.getTerrainHeight(desiredPos.x, desiredPos.z);
      if (desiredPos.y < groundH + 12) {
        desiredPos.y = groundH + 12;
      }
    }

    this.smoothPos.lerp(desiredPos, Math.min(1.0, delta * 15.0));
    this.camera.position.copy(this.smoothPos);

    const lookAhead = missile.position.clone().add(dir.clone().multiplyScalar(55));
    this.smoothLookAt.lerp(lookAhead, Math.min(1.0, delta * 18.0));
    this.camera.lookAt(this.smoothLookAt);
  }

  // 2. Seeker / Nose Cam: Nose POV with terminal impact static glitch
  updateSeekerCam(missile, delta) {
    this.resetFovSmooth(delta, 50);
    const dir = missile.velocity.clone().normalize();

    // Position camera at nose tip
    const nosePos = missile.position.clone().add(dir.clone().multiplyScalar(4));
    this.camera.position.copy(nosePos);

    // Avoid exact vertical gimbal lock in Seeker view
    const lookTarget = nosePos.clone().add(dir.clone().multiplyScalar(200));
    if (Math.abs(dir.y) > 0.98) {
      lookTarget.z += 2.5;
    }
    this.camera.lookAt(lookTarget);

    // Only activate static noise right before impact (never during launch!)
    const staticGlitch = document.getElementById('static-glitch');
    if (staticGlitch) {
      if (missile.flightTime > 0.8 && missile.distanceToTarget < 110) {
        staticGlitch.classList.add('active');
      } else {
        staticGlitch.classList.remove('active');
      }
    }
  }

  // 3. Launcher Binocular View: Zoomed tracking from launch station
  updateLauncherCam(missile, delta) {
    this.camera.position.copy(this.launcherPos);
    this.smoothLookAt.lerp(missile.position, Math.min(1.0, delta * 12.0));
    this.camera.lookAt(this.smoothLookAt);

    // Optical zoom simulation: narrow FOV as distance increases
    const dist = this.launcherPos.distanceTo(missile.position);
    const targetFov = THREE.MathUtils.clamp(55 - (dist / 130), 16, 55);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 4);
    this.camera.updateProjectionMatrix();
  }

  // 4. Cinematic Target Cam: Looking from target mountain position toward incoming missile
  updateTargetCam(missile, delta) {
    this.resetFovSmooth(delta, 45);
    const camPos = missile.targetPos.clone().add(new THREE.Vector3(75, 36, -85));
    if (this.terrain) {
      const gY = this.terrain.getTerrainHeight(camPos.x, camPos.z);
      camPos.y = Math.max(camPos.y, gY + 15);
    }
    this.camera.position.lerp(camPos, Math.min(1.0, delta * 6.0));
    this.smoothLookAt.lerp(missile.position, Math.min(1.0, delta * 14.0));
    this.camera.lookAt(this.smoothLookAt);
  }
}

window.CameraSystem = CameraSystem;
