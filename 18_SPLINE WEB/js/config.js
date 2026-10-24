/**
 * BMW M 3D Showcase - Central Configuration & Data
 */

export const SHOWROOM_CONFIG = {
  model: {
    name: 'BMW M4 Competition Coupé',
    series: 'M Performance',
    tagline: 'The Ultimate Driving Machine',
    engine: '3.0-liter BMW M TwinPower Turbo Inline-6',
    horsepower: 503,
    torque: 650, // Nm
    acceleration: '3.4s', // 0-100 km/h
    topSpeed: '290 km/h'
  },

  paints: [
    {
      id: 'isle-of-man-green',
      name: 'M Isle of Man Green',
      color: 0x0a3b2b,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      cssColor: '#0c4d37'
    },
    {
      id: 'tanzanite-blue',
      name: 'Tanzanite Blue II',
      color: 0x0e2850,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      cssColor: '#12376e'
    },
    {
      id: 'toronto-red',
      name: 'Toronto Red Metallic',
      color: 0xa81119,
      metalness: 0.82,
      roughness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      cssColor: '#c7131d'
    },
    {
      id: 'sao-paulo-yellow',
      name: 'São Paulo Yellow',
      color: 0xc8d810,
      metalness: 0.4,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      cssColor: '#d6e812'
    },
    {
      id: 'frozen-black',
      name: 'Frozen Deep Grey (Matte)',
      color: 0x14161b,
      metalness: 0.4,
      roughness: 0.55,
      clearcoat: 0.15,
      clearcoatRoughness: 0.7,
      cssColor: '#1c1f26'
    },
    {
      id: 'alpine-white',
      name: 'Alpine White Solid',
      color: 0xf5f7fa,
      metalness: 0.2,
      roughness: 0.15,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
      cssColor: '#f0f3f6'
    }
  ],

  cameraPresets: {
    hero: {
      position: { x: 3.8, y: 1.4, z: 4.2 },
      target: { x: 0, y: 0.6, z: 0 },
      label: 'Hero 3/4'
    },
    side: {
      position: { x: 5.2, y: 1.1, z: 0.0 },
      target: { x: 0, y: 0.5, z: 0 },
      label: 'Side Profile'
    },
    rear: {
      position: { x: -3.6, y: 1.5, z: -3.8 },
      target: { x: 0, y: 0.6, z: 0 },
      label: 'Rear Diffuser'
    },
    top: {
      position: { x: 0.1, y: 5.8, z: 0.8 },
      target: { x: 0, y: 0.2, z: 0 },
      label: 'Aero Top'
    },
    wheel: {
      position: { x: 2.2, y: 0.6, z: 1.8 },
      target: { x: 1.5, y: 0.45, z: 1.3 },
      label: 'M Rims'
    }
  },

  driveModes: {
    comfort: {
      name: 'COMFORT',
      accentColor: '#0066b1',
      enginePitch: 1.0,
      hudColor: '#0066b1',
      description: 'Balanced daily touring dynamics with refined acoustic isolation'
    },
    sport: {
      name: 'SPORT',
      accentColor: '#00e5ff',
      enginePitch: 1.25,
      hudColor: '#00e5ff',
      description: 'Sharpened throttle response and active M sport exhaust flaps'
    },
    sportPlus: {
      name: 'SPORT+',
      accentColor: '#e0001b',
      enginePitch: 1.5,
      hudColor: '#e0001b',
      description: 'Maximum track performance with high-RPM shift timing & DSC traction off'
    }
  },

  defaultSplineScenes: [
    {
      title: 'BMW Vision 3D Concept',
      url: 'https://prod.spline.design/4bb87e97-102e-40c8-a22a-4eef247ac5be/scene.splinecode'
    }
  ]
};
