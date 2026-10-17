import * as L from 'leaflet';

export const PRESET_ROUTES = {
  jakarta: {
    name: 'Jakarta: Monas → Bundaran HI',
    start: { lat: -6.175392, lng: 106.827153, label: 'Monumen Nasional (Monas), Gambir, Jakarta Pusat' },
    end: { lat: -6.194980, lng: 106.823050, label: 'Bundaran HI (Jl. M.H. Thamrin), Jakarta Pusat' }
  },
  bandung: {
    name: 'Bandung: Gedung Sate → Jl. Braga',
    start: { lat: -6.902481, lng: 107.618810, label: 'Gedung Sate (Jl. Diponegoro), Bandung' },
    end: { lat: -6.917824, lng: 107.609568, label: 'Jalan Braga, Sumur Bandung' }
  },
  jogja: {
    name: 'Yogyakarta: Tugu Jogja → Titik Nol Malioboro',
    start: { lat: -7.782889, lng: 110.367083, label: 'Tugu Pal Putih Yogyakarta (Jl. Jend. Sudirman)' },
    end: { lat: -7.801389, lng: 110.364758, label: 'Titik Nol Kilometer Malioboro, Yogyakarta' }
  },
  surabaya: {
    name: 'Surabaya: Tugu Pahlawan → Taman Bungkul',
    start: { lat: -7.245952, lng: 112.737885, label: 'Tugu Pahlawan (Jl. Pahlawan), Surabaya' },
    end: { lat: -7.291347, lng: 112.739386, label: 'Taman Bungkul (Jl. Raya Darmo), Surabaya' }
  },
  bali: {
    name: 'Bali: Pantai Kuta → Garuda Wisnu Kencana',
    start: { lat: -8.718492, lng: 115.168632, label: 'Pantai Kuta (Jl. Pantai Kuta), Badung, Bali' },
    end: { lat: -8.810423, lng: 115.167599, label: 'Garuda Wisnu Kencana (Jl. Raya Uluwatu), Bali' }
  },
  tokyo: {
    name: 'Tokyo: Shibuya Crossing → Tokyo Tower',
    start: { lat: 35.659495, lng: 139.700554, label: 'Shibuya Scramble Crossing, Tokyo' },
    end: { lat: 35.658581, lng: 139.745433, label: 'Tokyo Tower, Minato, Tokyo' }
  },
  paris: {
    name: 'Paris: Arc de Triomphe → Menara Eiffel',
    start: { lat: 48.873792, lng: 2.295028, label: 'Arc de Triomphe (Place Charles de Gaulle), Paris' },
    end: { lat: 48.858370, lng: 2.294481, label: 'Tour Eiffel (Champ de Mars), Paris' }
  }
};

const EARTH_RADIUS_M = 6378137;

export class CoordinateConverter {
  constructor(originLat, originLng, scale = 1.0) {
    this.originLat = originLat;
    this.originLng = originLng;
    this.scale = scale;
    this.cosLat = Math.cos((originLat * Math.PI) / 180);
  }

  /**
   * Convert Real-World (lat, lng) -> 3D World (x, z) in meters
   * +X = East, -Z = North
   */
  latLngToXZ(lat, lng) {
    const dLatRad = ((lat - this.originLat) * Math.PI) / 180;
    const dLngRad = ((lng - this.originLng) * Math.PI) / 180;
    const eastM = dLngRad * EARTH_RADIUS_M * this.cosLat * this.scale;
    const northM = dLatRad * EARTH_RADIUS_M * this.scale;
    return { x: eastM, z: -northM };
  }

  /**
   * Convert 3D World (x, z) -> Real-World (lat, lng)
   */
  xzToLatLng(x, z) {
    const eastM = x / this.scale;
    const northM = -z / this.scale;
    const dLat = (northM / EARTH_RADIUS_M) * (180 / Math.PI);
    const dLng = (eastM / (EARTH_RADIUS_M * this.cosLat)) * (180 / Math.PI);
    return {
      lat: this.originLat + dLat,
      lng: this.originLng + dLng
    };
  }
}

/**
 * OpenStreetMap Slippy Tile Math for 3D Ground Rendering
 */
export function latLngToTileXY(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y, z: zoom };
}

export function tileXYToBoundsLatLng(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;

  const nRadNorth = Math.PI - (2 * Math.PI * y) / n;
  const north = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nRadNorth) - Math.exp(-nRadNorth)));

  const nRadSouth = Math.PI - (2 * Math.PI * (y + 1)) / n;
  const south = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nRadSouth) - Math.exp(-nRadSouth)));

  return { north, south, east, west };
}

/**
 * Collects unique OpenStreetMap tiles covering the route path so they can be rendered as 3D ground tiles
 */
export function getRouteOSMTiles(latLngPath, maxTiles = 54) {
  if (!latLngPath || latLngPath.length === 0) return [];

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of latLngPath) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const spanDeg = Math.max(maxLat - minLat, maxLng - minLng);
  let zoom = 16;
  if (spanDeg > 0.15) zoom = 13;
  else if (spanDeg > 0.06) zoom = 14;
  else if (spanDeg > 0.025) zoom = 15;

  const tileMap = new Map();
  const stride = Math.max(Math.floor(latLngPath.length / 80), 1);

  for (let i = 0; i < latLngPath.length; i += stride) {
    const pt = latLngPath[i];
    const centerTile = latLngToTileXY(pt.lat, pt.lng, zoom);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = centerTile.x + dx;
        const ty = centerTile.y + dy;
        const key = `${zoom}/${tx}/${ty}`;
        if (!tileMap.has(key) && tileMap.size < maxTiles) {
          const bounds = tileXYToBoundsLatLng(tx, ty, zoom);
          tileMap.set(key, {
            key,
            x: tx,
            y: ty,
            z: zoom,
            url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
            bounds
          });
        }
      }
    }
  }

  return Array.from(tileMap.values());
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const overpassCache = new Map();

/**
 * Fetches real 3D building footprints, architectural tags, AND real intersecting street names
 * along the route from the OpenStreetMap Overpass API.
 */
export async function fetchOSMDataAlongRoute(latLngPath) {
  if (!latLngPath || latLngPath.length < 2) {
    return { buildings: [], streets: [] };
  }

  // Sample up to 16 points along the route corridor
  const sampled = [];
  const step = Math.max(Math.floor(latLngPath.length / 15), 1);
  for (let i = 0; i < latLngPath.length && sampled.length < 16; i += step) {
    sampled.push(`${latLngPath[i].lat.toFixed(5)},${latLngPath[i].lng.toFixed(5)}`);
  }
  const lastPt = latLngPath[latLngPath.length - 1];
  sampled.push(`${lastPt.lat.toFixed(5)},${lastPt.lng.toFixed(5)}`);

  const polyCoords = sampled.join(',');
  const cacheKey = `${sampled[0]}_${sampled[sampled.length - 1]}_${sampled.length}`;
  if (overpassCache.has(cacheKey)) {
    return overpassCache.get(cacheKey);
  }

  const query = `[out:json][timeout:10];(way["building"](around:165,${polyCoords});way["building:part"](around:150,${polyCoords});way["highway"]["name"](around:95,${polyCoords}););out body;>;out skel qt;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8500);
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const data = await res.json();
      if (!data || !data.elements) continue;

      const nodes = new Map();
      const buildingWays = [];
      const highwayWays = [];

      for (const el of data.elements) {
        if (el.type === 'node') {
          nodes.set(el.id, { lat: el.lat, lng: el.lon });
        } else if (el.type === 'way' && el.nodes && el.nodes.length >= 2) {
          if (el.tags?.building || el.tags?.['building:part']) {
            if (el.nodes.length >= 3) buildingWays.push(el);
          } else if (el.tags?.highway && el.tags?.name) {
            highwayWays.push(el);
          }
        }
      }

      const buildings = [];
      for (let i = 0; i < Math.min(buildingWays.length, 420); i++) {
        const w = buildingWays[i];
        const footprint = [];
        for (const nid of w.nodes) {
          const n = nodes.get(nid);
          if (n) footprint.push(n);
        }
        if (footprint.length < 3) continue;

        const tags = w.tags || {};
        const bType = (tags.building || tags['building:part'] || 'yes').toLowerCase();
        const levels = parseFloat(tags['building:levels']) || 0;
        const rawHeight = parseFloat(tags.height) || 0;
        const minHeight = parseFloat(tags.min_height) || (parseFloat(tags['building:min_level']) || 0) * 3.8;

        // Realistic height estimation based on OSM tags and building category
        let height = rawHeight;
        if (!(height > 2)) {
          if (levels > 0) {
            height = levels * 3.8;
          } else if (bType === 'office' || bType === 'commercial' || bType === 'hotel') {
            height = 24 + (w.id % 38);
          } else if (bType === 'apartments') {
            height = 22 + (w.id % 28);
          } else if (bType === 'retail' || bType === 'shophouse' || bType === 'Supermarket') {
            height = 10 + (w.id % 8);
          } else if (bType === 'house' || bType === 'residential' || bType === 'detached' || bType === 'terrace') {
            height = 6.5 + (w.id % 5);
          } else if (bType === 'mosque' || bType === 'church' || bType === 'cathedral' || bType === 'temple') {
            height = 16 + (w.id % 10);
          } else {
            // Estimate from footprint area: larger footprints in city centers tend to be taller
            height = 11 + (w.id % 22);
          }
        }

        buildings.push({
          id: w.id,
          name: tags['name:id'] || tags.name || tags.brand || null,
          bType,
          height: Math.min(Math.max(height, 4.5), 140),
          minHeight: Math.max(minHeight, 0),
          levels: levels || Math.round(height / 3.8),
          roofShape: tags['roof:shape'] || null,
          roofColor: tags['roof:colour'] || null,
          wallColor: tags['building:colour'] || null,
          material: tags['building:material'] || null,
          amenity: tags.amenity || null,
          religion: tags.religion || null,
          tourism: tags.tourism || null,
          historic: tags.historic || null,
          footprint
        });
      }

      // Extract real street names and their coordinates/orientations
      const streets = [];
      const seenStreetNames = new Map();
      for (const hw of highwayWays) {
        const name = hw.tags.name.trim();
        const ref = hw.tags.ref || null;
        const hwType = hw.tags.highway;
        const pts = [];
        for (const nid of hw.nodes) {
          const n = nodes.get(nid);
          if (n) pts.push(n);
        }
        if (pts.length < 2) continue;

        const midIdx = Math.floor(pts.length / 2);
        const ptA = pts[Math.max(0, midIdx - 1)];
        const ptB = pts[Math.min(pts.length - 1, midIdx + 1)];

        // Limit duplicate signs for the exact same street unless spaced apart
        const prevList = seenStreetNames.get(name) || [];
        const tooClose = prevList.some(
          (p) => Math.hypot(p.lat - ptA.lat, p.lng - ptA.lng) < 0.0018
        );
        if (tooClose) continue;
        prevList.push(ptA);
        seenStreetNames.set(name, prevList);

        streets.push({
          id: hw.id,
          name,
          ref,
          hwType,
          lat: ptA.lat,
          lng: ptA.lng,
          nextLat: ptB.lat,
          nextLng: ptB.lng,
          nodes: pts
        });
      }

      const result = { buildings, streets };
      overpassCache.set(cacheKey, result);
      return result;
    } catch {
      // try next Overpass mirror
    }
  }

  return { buildings: [], streets: [] };
}

export async function searchLocationsNominatim(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query.trim())}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'id,en' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name
    }));
  } catch (err) {
    console.warn('Nominatim search warning:', err);
    return [];
  }
}

export async function reverseGeocodeNominatim(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'id,en' }
    });
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = await res.json();
    if (data && data.display_name) {
      const parts = data.display_name.split(',').slice(0, 3);
      return parts.join(', ').trim();
    }
  } catch {
    // ignore network errors
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function translateManeuver(step) {
  const type = step.maneuver?.type || 'continue';
  const mod = step.maneuver?.modifier || '';
  const roadName = step.name && step.name.trim() ? step.name : step.ref ? `Jalan ${step.ref}` : 'Jalan Utama';
  const destinations = step.destinations || '';

  let icon = '⬆️';
  let action = 'Lurus terus';
  let directionLabel = 'LURUS';

  if (type === 'depart') {
    icon = '🚀';
    action = `Mulai di ${roadName}`;
    directionLabel = 'MULAI';
  } else if (type === 'arrive') {
    icon = '🏁';
    action = `Tiba di tujuan (${roadName})`;
    directionLabel = 'TUJUAN';
  } else if (type === 'roundabout' || type === 'rotary') {
    icon = '🔄';
    action = `Bundaran menuju ${roadName}`;
    directionLabel = 'BUNDARAN';
  } else if (mod.includes('left')) {
    icon = mod.includes('slight') ? '↖️' : '⬅️';
    action = `${mod.includes('slight') ? 'Serong kiri' : 'Belok kiri'} ke ${roadName}`;
    directionLabel = mod.includes('slight') ? 'SERONG KIRI' : 'BELOK KIRI';
  } else if (mod.includes('right')) {
    icon = mod.includes('slight') ? '↗️' : '➡️';
    action = `${mod.includes('slight') ? 'Serong kanan' : 'Belok kanan'} ke ${roadName}`;
    directionLabel = mod.includes('slight') ? 'SERONG KANAN' : 'BELOK KANAN';
  } else if (mod === 'uturn') {
    icon = '↩️';
    action = `Putar balik di ${roadName}`;
    directionLabel = 'PUTAR BALIK';
  } else {
    icon = '⬆️';
    action = `Lanjutkan di ${roadName}`;
    directionLabel = 'LURUS';
  }

  return {
    icon,
    text: action,
    roadName,
    ref: step.ref || null,
    destinations,
    directionLabel,
    modifier: mod,
    maneuverType: type,
    distance: step.distance || 0,
    lat: step.maneuver?.location?.[1] ?? 0,
    lng: step.maneuver?.location?.[0] ?? 0
  };
}

export async function fetchRealWorldRoute(startPoint, endPoint) {
  const coordsQuery = `${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const rawCoords = route.geometry.coordinates; // [lng, lat]
      const latLngPath = rawCoords.map(([lng, lat]) => ({ lat, lng }));

      const steps = [];
      if (route.legs && route.legs[0]?.steps) {
        for (const s of route.legs[0].steps) {
          steps.push(translateManeuver(s));
        }
      }

      return {
        latLngPath,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        steps,
        isFallback: false
      };
    }
  } catch (err) {
    console.warn('OSRM fallback route triggered:', err);
  }

  const numSegments = 36;
  const latLngPath = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const curveOffset = Math.sin(t * Math.PI * 2) * 0.0012;
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * t + curveOffset;
    const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * t - curveOffset;
    latLngPath.push({ lat, lng });
  }

  const approxDist = L.latLng(startPoint.lat, startPoint.lng).distanceTo(
    L.latLng(endPoint.lat, endPoint.lng)
  ) * 1.15;

  return {
    latLngPath,
    distanceMeters: Math.max(approxDist, 500),
    durationSeconds: Math.max(approxDist / 11.5, 60),
    steps: [
      { icon: '🚀', text: 'Mulai perjalanan dari titik awal', roadName: 'Jalur Utama OSM', directionLabel: 'MULAI', distance: approxDist * 0.5, lat: startPoint.lat, lng: startPoint.lng },
      { icon: '🏁', text: 'Tiba di titik tujuan', roadName: 'Tujuan Akhir OSM', directionLabel: 'TUJUAN', distance: 0, lat: endPoint.lat, lng: endPoint.lng }
    ],
    isFallback: true
  };
}

export function createPinIcon(colorHex, labelText) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      background:${colorHex};
      color:#fff;
      font-weight:800;
      font-size:11px;
      padding:3px 7px;
      border-radius:999px;
      border:2px solid #fff;
      box-shadow:0 3px 10px rgba(0,0,0,0.55);
      white-space:nowrap;
      transform:translate(-50%, -50%);
    ">${labelText}</div>`,
    iconSize: [0, 0]
  });
}

export function createCarGpsIcon(headingDeg = 0) {
  return L.divIcon({
    className: 'car-gps-marker',
    html: `<div class="car-gps-arrow" style="transform: rotate(${headingDeg.toFixed(1)}deg);">▲</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}
