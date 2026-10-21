// Langit dinamis: siklus siang-malam, matahari, bulan, bintang, kabut & pencahayaan
import * as THREE from 'three';

const C = (h) => new THREE.Color(h);
const PAL = {
  dayTop: C(0x2f6fc4), dayHor: C(0xa8d2f0),
  duskTop: C(0x2a3570), duskHor: C(0xf28c50),
  nightTop: C(0x030714), nightHor: C(0x16243e),
  sunDay: C(0xfff1d6), sunDusk: C(0xff9a50), moon: C(0x9db4ff),
};

function smooth(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uNight;
uniform float uSunVis;
varying vec3 vDir;
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uHorizon, uTop, pow(clamp(y, 0.0, 1.0), 0.45));
  if (y < 0.0) col = uHorizon;
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 10.0 + pow(sd, 10.0) * 0.3) * uSunVis;
  float md = max(dot(d, -uSunDir), 0.0);
  col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.9993, 0.9996, md) * 1.5 + pow(md, 60.0) * 0.08) * uNight;
  float s = hash(floor(d * 320.0));
  float tw = step(0.9975, s) * (0.6 + 0.4 * sin(s * 1000.0));
  col += vec3(tw) * uNight * smoothstep(0.0, 0.25, y);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export class SkySystem {
  constructor(scene) {
    this.scene = scene;
    this.dayLength = 480; // detik per satu hari penuh
    this.time = 0.33;
    this.sunDir = new THREE.Vector3();
    this.lightDir = new THREE.Vector3(0, 1, 0);
    this.lightColor = new THREE.Color();
    this.lightVis = 1;
    this.top = new THREE.Color();
    this.horizon = new THREE.Color();
    this.fogColor = new THREE.Color();
    this.day = 1;
    this.night = 0;

    this.uniforms = {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uSunColor: { value: new THREE.Color() },
      uNight: { value: 0 },
      uSunVis: { value: 1 },
    };
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(4000, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms, vertexShader, fragmentShader,
        side: THREE.BackSide, depthWrite: false, fog: false,
      })
    );
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    scene.add(this.dome);

    this.light = new THREE.DirectionalLight(0xffffff, 2.5);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(2048, 2048);
    const sc = this.light.shadow.camera;
    sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 500;
    this.light.shadow.bias = -0.0004;
    this.light.shadow.normalBias = 0.04;
    scene.add(this.light, this.light.target);

    this.hemi = new THREE.HemisphereLight(0xbfdfff, 0x6b5a3a, 0.8);
    scene.add(this.hemi);
  }

  update(dt, focus, camPos) {
    this.time = (this.time + dt / this.dayLength) % 1;
    const e = (this.time - 0.25) * Math.PI * 2;
    this.sunDir.set(Math.cos(e), Math.sin(e), 0.35).normalize();
    const sy = this.sunDir.y;

    const day = smooth(-0.12, 0.25, sy);
    const dusk = 1 - smooth(0.0, 0.35, Math.abs(sy + 0.02));
    this.day = day;
    this.night = 1 - day;

    this.top.copy(PAL.nightTop).lerp(PAL.dayTop, day).lerp(PAL.duskTop, dusk * 0.5);
    this.horizon.copy(PAL.nightHor).lerp(PAL.dayHor, day).lerp(PAL.duskHor, dusk * 0.7);
    this.fogColor.copy(this.horizon);

    const sunCol = PAL.sunDay.clone().lerp(PAL.sunDusk, dusk);
    const sunI = 2.8 * smooth(-0.05, 0.2, sy);
    const moonI = 0.6 * smooth(0.05, -0.2, sy);
    if (sunI >= moonI) {
      this.lightDir.copy(this.sunDir);
      this.lightColor.copy(sunCol);
      this.light.intensity = Math.max(sunI, 0.05);
      this.lightVis = smooth(-0.05, 0.1, sy);
    } else {
      this.lightDir.copy(this.sunDir).negate();
      this.lightColor.copy(PAL.moon);
      this.light.intensity = moonI;
      this.lightVis = 0.35;
    }
    this.light.color.copy(this.lightColor);
    this.light.position.copy(focus).addScaledVector(this.lightDir, 200);
    this.light.target.position.copy(focus);
    this.light.target.updateMatrixWorld();

    this.hemi.intensity = 0.35 + 0.75 * day;
    this.hemi.color.copy(this.horizon).lerp(new THREE.Color(0xffffff), 0.4);
    this.hemi.groundColor.setHex(0x4a3f2c).multiplyScalar(0.4 + 0.6 * day);

    const u = this.uniforms;
    u.uTop.value.copy(this.top);
    u.uHorizon.value.copy(this.horizon);
    u.uSunDir.value.copy(this.sunDir);
    u.uSunColor.value.copy(sunCol);
    u.uNight.value = this.night;
    u.uSunVis.value = smooth(-0.1, 0.05, sy);

    const fog = this.scene.fog;
    fog.color.copy(this.fogColor);
    fog.density = 0.0019 + this.night * 0.0011;

    this.dome.position.copy(camPos);
  }
}
