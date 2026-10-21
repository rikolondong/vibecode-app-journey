// Laut: gelombang (dipakai bersama oleh shader & fisika JS agar kapal mengapung tepat di permukaan)
import * as THREE from 'three';

const RAW = [
  { dir: [1.0, 0.3], amp: 0.6, len: 62 },
  { dir: [0.5, 0.86], amp: 0.38, len: 35 },
  { dir: [-0.45, 1.0], amp: 0.22, len: 21 },
  { dir: [0.92, -0.4], amp: 0.12, len: 14 },
];

export const WAVES = RAW.map((w) => {
  const l = Math.hypot(w.dir[0], w.dir[1]);
  const k = (Math.PI * 2) / w.len;
  return { dx: w.dir[0] / l, dz: w.dir[1] / l, amp: w.amp, k, c: Math.sqrt(9.8 / k) };
});

export const sea = { ampScale: 1.0 };

/** Tinggi permukaan laut pada posisi dunia (x, z) di waktu t. */
export function waveHeight(x, z, t) {
  let h = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const w = WAVES[i];
    h += w.amp * sea.ampScale * Math.sin(w.k * (w.dx * x + w.dz * z - w.c * t));
  }
  return h;
}

/** Grid radial: rapat di dekat kamera, renggang di kejauhan. */
function buildRadialGeometry(R, rings, segs) {
  const verts = [0, 0, 0];
  for (let i = 1; i <= rings; i++) {
    const r = R * Math.pow(i / rings, 2.6);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      verts.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
  }
  const idx = [];
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 0; i < rings - 1; i++) {
    const a0 = 1 + i * segs, b0 = 1 + (i + 1) * segs;
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      const a = a0 + j, b = a0 + j1, c = b0 + j, d = b0 + j1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  return geo;
}

const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec4 uWaves[4];
uniform float uAmpScale;
uniform vec3 uCamPos;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vH;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float dist = length(wp.xz - uCamPos.xz);
  float h = 0.0;
  vec2 g = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 w = uWaves[i];
    float k = w.w;
    float c = sqrt(9.8 / k);
    float fade = 1.0 - smoothstep(60.0 / k, 200.0 / k, dist);
    float a = w.z * uAmpScale * fade;
    float f = k * (dot(w.xy, wp.xz) - c * uTime);
    h += a * sin(f);
    g += a * k * cos(f) * w.xy;
  }
  wp.y += h;
  vH = h;
  vWorld = wp.xyz;
  vNormal = normalize(vec3(-g.x, 1.0, -g.y));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAmpScale;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunVis;
uniform float uDay;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform sampler2D uHeightMap;
uniform float uMapHalf;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vH;

vec2 ripple(vec2 p, float t) {
  vec2 g = vec2(0.0);
  vec2 d; float f;
  d = vec2(0.8, 0.6);    f = dot(d, p) * 1.3 + t * 2.0; g += d * cos(f) * 0.07;
  d = vec2(-0.5, 0.86);  f = dot(d, p) * 2.2 + t * 2.7; g += d * cos(f) * 0.05;
  d = vec2(0.95, -0.3);  f = dot(d, p) * 3.9 + t * 3.5; g += d * cos(f) * 0.035;
  d = vec2(-0.2, -0.98); f = dot(d, p) * 6.1 + t * 4.3; g += d * cos(f) * 0.025;
  return g;
}

void main() {
  vec3 toCam = uCamPos - vWorld;
  float dist = length(toCam);
  vec3 v = toCam / dist;

  float rf = 1.0 - smoothstep(30.0, 260.0, dist);
  vec2 rg = ripple(vWorld.xz, uTime) * rf;
  vec3 n = normalize(vNormal + vec3(-rg.x, 0.0, -rg.y));

  // Kedalaman dari peta ketinggian dasar laut -> air dangkal toska & buih pantai
  vec2 uv = (vWorld.xz + uMapHalf) / (2.0 * uMapHalf);
  float th = texture2D(uHeightMap, uv).r * 40.0 - 10.0;
  float depth = vWorld.y - th;
  float shallow = 1.0 - smoothstep(0.3, 7.5, depth);

  float crest = clamp(vH * 0.6 + 0.5, 0.0, 1.0);
  vec3 base = mix(uDeep, uDeep * 1.5 + vec3(0.0, 0.06, 0.07), crest);
  base = mix(base, uShallow, shallow * 0.85);

  float ndl = max(dot(n, uSunDir), 0.0);
  vec3 col = base * (0.16 + 0.84 * uDay) * (0.65 + 0.35 * ndl);

  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  col = mix(col, uSky, clamp(fres, 0.0, 0.85));

  vec3 hv = normalize(uSunDir + v);
  float nh = max(dot(n, hv), 0.0);
  float spec = pow(nh, 280.0) * 4.0 + pow(nh, 40.0) * 0.15;
  col += uSunColor * spec * uSunVis;

  float crestFoam = smoothstep(0.85 * uAmpScale, 1.2 * uAmpScale, vH) *
                    (0.5 + 0.5 * sin(vWorld.x * 0.8 + uTime) * sin(vWorld.z * 0.7 - uTime * 0.6));
  float shoreFoam = (1.0 - smoothstep(0.0, 1.6, depth)) *
                    (0.55 + 0.45 * sin(depth * 5.0 - uTime * 2.5 + vWorld.x * 0.15));
  float foam = clamp(crestFoam * 0.5 + shoreFoam, 0.0, 1.0);
  col = mix(col, vec3(0.92, 0.96, 1.0) * (0.25 + 0.75 * uDay), foam * 0.8);

  float alpha = max(1.0 - shallow * 0.45, foam);

  float fd = dist * uFogDensity;
  col = mix(col, uFogColor, 1.0 - exp(-fd * fd));

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createWater(heightTex, mapHalf) {
  const geo = buildRadialGeometry(3200, 300, 256);
  const uniforms = {
    uTime: { value: 0 },
    uWaves: { value: WAVES.map((w) => new THREE.Vector4(w.dx, w.dz, w.amp, w.k)) },
    uAmpScale: { value: 1 },
    uCamPos: { value: new THREE.Vector3() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color(1, 1, 1) },
    uSunVis: { value: 1 },
    uDay: { value: 1 },
    uDeep: { value: new THREE.Color(0x0b4a6e) },
    uShallow: { value: new THREE.Color(0x3fd1c4) },
    uSky: { value: new THREE.Color(0xa8d2f0) },
    uFogColor: { value: new THREE.Color() },
    uFogDensity: { value: 0.002 },
    uHeightMap: { value: heightTex },
    uMapHalf: { value: mapHalf },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    transparent: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;

  return {
    mesh, uniforms,
    update(t, camPos, sky, fog) {
      uniforms.uTime.value = t;
      uniforms.uAmpScale.value = sea.ampScale;
      uniforms.uCamPos.value.copy(camPos);
      mesh.position.set(camPos.x, 0, camPos.z);
      uniforms.uSunDir.value.copy(sky.lightDir);
      uniforms.uSunColor.value.copy(sky.lightColor);
      uniforms.uSunVis.value = sky.lightVis;
      uniforms.uDay.value = sky.day;
      uniforms.uSky.value.copy(sky.horizon).lerp(sky.top, 0.35);
      uniforms.uFogColor.value.copy(fog.color);
      uniforms.uFogDensity.value = fog.density;
    },
  };
}
