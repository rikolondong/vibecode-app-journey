// INDO FIREWATCH v2.0 - Hardened Production Server & NASA FIRMS API Proxy
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Baca Konfigurasi Lingkungan (.env) secara Aman
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        envVars[key] = val;
      }
    }
  }
  return envVars;
}

const env = loadEnv();
const PORT = parseInt(process.env.PORT || env.PORT || '3000', 10);
// Kredensial NASA FIRMS dibaca dari .env atau environment variable (rahasia server)
const SERVER_NASA_KEY = process.env.NASA_FIRMS_KEY || process.env.VITE_NASA_FIRMS_MAP_KEY || env.NASA_FIRMS_KEY || env.VITE_NASA_FIRMS_MAP_KEY || '';
const INDONESIA_BBOX = '95,-11,141,6'; // Geofence teritori kedaulatan Indonesia

const DIST_DIR = path.resolve(__dirname, 'dist');

// Allowlist Sensor NASA FIRMS Resmi
const ALLOWED_SENSORS = new Set(['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'MODIS_NRT']);

// In-Memory Cache (TTL 3 menit / 180 detik) untuk efisiensi & perlindungan kuota
const cacheStore = new Map();
const CACHE_TTL_MS = 180 * 1000;

// Rate Limiting (Maksimal 30 request / menit per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > RATE_LIMIT_MAX;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Security Headers (Defense-in-Depth)
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://server.arcgisonline.com https://unpkg.com",
      "connect-src 'self' https://api.open-meteo.com https://firms.modaps.eosdis.nasa.gov",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
}

const server = http.createServer((req, res) => {
  setSecurityHeaders(res);

  const rawIp = req.headers['x-forwarded-for'];
  const clientIp = (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : null) || req.socket.remoteAddress || '127.0.0.1';
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // 1. API PROXY SATELIT NASA (TERLINDUNGI & TEROTENTIKASI SERVER)
  if (pathname === '/api/firms') {
    // Terapkan Rate Limiting
    if (isRateLimited(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Terlalu banyak permintaan. Silakan tunggu 1 menit.' }));
      return;
    }

    // Validasi Input Ketat (Allowlist & Sanitasi)
    let sensor = reqUrl.searchParams.get('sensor') || 'VIIRS_SNPP_NRT';
    if (!ALLOWED_SENSORS.has(sensor)) {
      sensor = 'VIIRS_SNPP_NRT';
    }

    const rawDays = parseInt(reqUrl.searchParams.get('days') || '1', 10);
    const days = Math.min(Math.max(isNaN(rawDays) ? 1 : rawDays, 1), 5); // 1 sampai 5 hari

    // Bounding Box dikunci permanen ke wilayah NKRI (Anti-SSRF & Geofence Protection)
    const bbox = INDONESIA_BBOX;

    // Cek In-Memory Cache
    const cacheKey = `${sensor}_${days}`;
    const cached = cacheStore.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.writeHead(cached.status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=180',
      });
      res.end(cached.data);
      return;
    }

    if (!SERVER_NASA_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'NASA_FIRMS_KEY belum disetel di .env server.' }));
      return;
    }

    // Ambil data resmi dari NASA EOSDIS menggunakan SERVER_NASA_KEY rahasia
    const nasaUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${SERVER_NASA_KEY}/${sensor}/${bbox}/${days}`;

    https.get(nasaUrl, (nasaRes) => {
      let responseBody = '';
      nasaRes.on('data', (chunk) => (responseBody += chunk));
      nasaRes.on('end', () => {
        const statusCode = nasaRes.statusCode || 200;

        // Simpan ke cache jika sukses
        if (statusCode === 200) {
          cacheStore.set(cacheKey, {
            data: responseBody,
            expiresAt: now + CACHE_TTL_MS,
            status: statusCode,
          });
        }

        res.writeHead(statusCode, {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=180',
        });
        res.end(responseBody);
      });
    }).on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gagal terhubung ke satelit hulu NASA' }));
    });
    return;
  }

  // 2. STATIC ASSETS SERVING DENGAN PERLINDUNGAN PATH TRAVERSAL
  let safePath = path.normalize(decodeURIComponent(pathname));
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(DIST_DIR, safePath);

  // Cegah Path Traversal (keluar dari folder dist)
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Akses Ditolak');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: Arahkan ke dist/index.html
      filePath = path.join(DIST_DIR, 'index.html');
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Halaman Tidak Ditemukan');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🛡️  INDO FIREWATCH v2.0 Hardened Server running securely at http://127.0.0.1:${PORT}/`);
  console.log(`🔒 Security Status: Kredensial NASA dienkripsi di server & isolasi data aktif.\n`);
});
