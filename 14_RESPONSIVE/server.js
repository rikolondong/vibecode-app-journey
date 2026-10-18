/**
 * ResponsiView Studio — Local Server, Smart Web Proxy & Deep Device Fingerprint Emulator
 * Zero-dependency Node.js server that:
 * 1. Serves static files (index.html, demo.html, styles.css, app.js)
 * 2. Provides /proxy?url=... with full hardware & OS environment emulation:
 *    - Spoofs HTTP User-Agent and Sec-CH-UA Client Hints headers (Mobile, Platform, Model, DPR, Viewport-Width)
 *    - Strips X-Frame-Options & CSP frame-ancestors so external websites load inside the simulator
 *    - Injects early <head> script to spoof navigator.userAgent, navigator.platform, navigator.vendor,
 *      navigator.maxTouchPoints, navigator.userAgentData, window.devicePixelRatio, window.screen, and Touch APIs
 *    - Injects authentic OS System Typography & Emoji fonts (SF Pro/Apple style for iOS/macOS,
 *      Roboto + Google Noto Color Emoji for Android, Segoe UI Variable + Segoe UI Emoji for Windows 11)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const { execFile } = require('child_process');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

/**
 * Locate Chrome or Edge executable on Windows system
 */
function findChromiumExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe')
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Headless Chromium screenshot generator
 */
function takeHeadlessScreenshot({ targetUrl, width, height, dpr, ua }) {
  return new Promise((resolve, reject) => {
    const browserPath = findChromiumExecutable();
    if (!browserPath) {
      return reject(new Error('Browser Chromium (Chrome/Edge) tidak ditemukan di sistem server.'));
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempFile = path.join(os.tmpdir(), `rv-shot-${uniqueId}.png`);
    const tempProfile = path.join(os.tmpdir(), `rv-profile-${uniqueId}`);

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${tempProfile}`,
      `--screenshot=${tempFile}`,
      `--window-size=${Math.round(width)},${Math.round(height)}`,
      `--force-device-scale-factor=${dpr || 1}`,
      '--hide-scrollbars'
    ];

    if (ua) {
      args.push(`--user-agent=${ua}`);
    }

    args.push(targetUrl);

    execFile(browserPath, args, { timeout: 30000 }, (err) => {
      // Clean up profile dir asynchronously
      fs.rm(tempProfile, { recursive: true, force: true }, () => {});

      if (!fs.existsSync(tempFile)) {
        return reject(err || new Error('Gagal menghasilkan file screenshot'));
      }

      fs.readFile(tempFile, (readErr, data) => {
        // Clean up temp screenshot file
        fs.unlink(tempFile, () => {});
        if (readErr) return reject(readErr);
        resolve(data);
      });
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Build Client-Hints & HTTP Request Headers that match the simulated device
 */
function buildSpoofedHeaders(params) {
  const ua =
    params.ua ||
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const osFamily = params.os || 'ios'; // 'ios' | 'ipados' | 'android' | 'macos' | 'windows'
  const isMobile = params.mobile === '1';
  const model = params.model || '';
  const dpr = params.dpr || '2';
  const width = params.w || '393';

  const headers = {
    'User-Agent': ua,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DPR': String(dpr),
    'Viewport-Width': String(width),
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    Connection: 'close'
  };

  // Chromium-based platforms send Sec-CH-UA headers; Safari on iOS/iPadOS does not
  if (osFamily === 'android') {
    headers['Sec-CH-UA'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
    headers['Sec-CH-UA-Mobile'] = isMobile ? '?1' : '?0';
    headers['Sec-CH-UA-Platform'] = '"Android"';
    if (model) headers['Sec-CH-UA-Model'] = `"${model}"`;
  } else if (osFamily === 'windows') {
    headers['Sec-CH-UA'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
    headers['Sec-CH-UA-Mobile'] = '?0';
    headers['Sec-CH-UA-Platform'] = '"Windows"';
  } else if (osFamily === 'macos') {
    headers['Sec-CH-UA'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
    headers['Sec-CH-UA-Mobile'] = '?0';
    headers['Sec-CH-UA-Platform'] = '"macOS"';
  }

  return headers;
}

/**
 * Generate the injected <head> payload that spoofs JS navigator/screen APIs
 * and applies authentic OS system fonts, emoji fonts, and scrollbar design.
 */
function buildDeviceEnvironmentInjection(finalUrl, params) {
  const safeProfile = JSON.stringify({
    ua: params.ua || '',
    platform: params.platform || 'iPhone',
    vendor: params.vendor || 'Apple Computer, Inc.',
    dpr: parseFloat(params.dpr) || 2,
    touch: parseInt(params.touch, 10) || 5,
    mobile: params.mobile === '1',
    os: params.os || 'ios',
    model: params.model || 'iPhone',
    w: parseInt(params.w, 10) || 393,
    h: parseInt(params.h, 10) || 852
  });

  const os = params.os || 'ios';

  // OS-Specific Typography & Emoji Font Stack
  let fontImports = '';
  let osFontStack = '';
  let osScrollbarCss = '';

  if (os === 'android') {
    fontImports = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">`;
    osFontStack = `'Roboto', 'Noto Color Emoji', sans-serif`;
    osScrollbarCss = `
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.45); border-radius: 99px; }
    `;
  } else if (os === 'ios' || os === 'ipados' || os === 'macos') {
    fontImports = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">`;
    osFontStack = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    osScrollbarCss = `
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(120,120,128,0.42); border-radius: 99px; }
    `;
  } else {
    // Windows 11
    fontImports = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">`;
    osFontStack = `'Segoe UI Variable Text', 'Segoe UI', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
    osScrollbarCss = `
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
      ::-webkit-scrollbar-thumb { background: rgba(120,120,128,0.45); border-radius: 5px; border: 2px solid transparent; background-clip: content-box; }
    `;
  }

  return `
    <base href="${finalUrl}">
    ${fontImports}
    <style id="responsiview-os-design-system">
      :root {
        --rv-os-font: ${osFontStack};
      }
      html, body, button, input, select, textarea {
        font-family: ${osFontStack};
        -webkit-font-smoothing: ${os === 'windows' ? 'auto' : 'antialiased'};
        ${os === 'ios' || os === 'ipados' || os === 'macos' ? 'letter-spacing: -0.011em;' : ''}
      }
      ${osScrollbarCss}
    </style>
    <script id="responsiview-device-spoofer">
      (function() {
        var P = ${safeProfile};
        try {
          var defineGetter = function(obj, prop, val) {
            try {
              Object.defineProperty(obj, prop, {
                get: function() { return val; },
                configurable: true
              });
            } catch (_) {}
          };

          // Defuse client-side frame-busting scripts so sites cannot block being embedded
          try {
            defineGetter(window, 'top', window);
            defineGetter(window, 'parent', window);
            defineGetter(window, 'frameElement', null);
          } catch (_) {}

          var navProto = Object.getPrototypeOf(window.navigator) || window.navigator;
          defineGetter(navProto, 'userAgent', P.ua);
          defineGetter(navProto, 'appVersion', P.ua.replace(/^Mozilla\\//, ''));
          defineGetter(navProto, 'platform', P.platform);
          defineGetter(navProto, 'vendor', P.vendor);
          defineGetter(navProto, 'maxTouchPoints', P.touch);

          var platformName = P.os === 'ios' ? 'iOS' : P.os === 'ipados' ? 'iPadOS' : P.os === 'android' ? 'Android' : P.os === 'macos' ? 'macOS' : 'Windows';
          var uaData = {
            brands: P.vendor.indexOf('Apple') !== -1
              ? [{ brand: 'Not/A)Brand', version: '8' }, { brand: 'Safari', version: '18' }]
              : [{ brand: 'Google Chrome', version: '131' }, { brand: 'Chromium', version: '131' }],
            mobile: P.mobile,
            platform: platformName,
            getHighEntropyValues: function() {
              return Promise.resolve({
                architecture: P.touch > 0 ? 'arm' : 'x86',
                model: P.model,
                mobile: P.mobile,
                platform: platformName,
                platformVersion: '15.0.0'
              });
            },
            toJSON: function() {
              return { brands: this.brands, mobile: this.mobile, platform: this.platform };
            }
          };
          defineGetter(navProto, 'userAgentData', uaData);

          defineGetter(window, 'devicePixelRatio', P.dpr);
          if (window.screen) {
            defineGetter(window.screen, 'width', P.w);
            defineGetter(window.screen, 'height', P.h);
            defineGetter(window.screen, 'availWidth', P.w);
            defineGetter(window.screen, 'availHeight', P.h);
          }

          if (P.touch > 0 && !('ontouchstart' in window)) {
            window.ontouchstart = null;
          }
        } catch (err) {}

        // Intercept link clicks so navigation stays inside the simulated device
        document.addEventListener('click', function(e) {
          var a = e.target.closest && e.target.closest('a');
          if (!a) return;
          var href = a.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
          try {
            var resolved = new URL(href, "${finalUrl}").toString();
            if (resolved.startsWith('http')) {
              e.preventDefault();
              window.parent.postMessage({ type: 'RESPONSIVIEW_NAVIGATE', url: resolved }, '*');
            }
          } catch (_) {}
        }, true);

        // Intercept form submissions so search & GET navigations stay inside the simulator
        document.addEventListener('submit', function(e) {
          var form = e.target;
          if (!form || !form.action) return;
          try {
            var method = (form.method || 'GET').toUpperCase();
            var actionUrl = new URL(form.action, "${finalUrl}").toString();
            if (method === 'GET') {
              var formData = new FormData(form);
              var searchParams = new URLSearchParams();
              formData.forEach(function(val, key) {
                searchParams.append(key, val);
              });
              var delimiter = actionUrl.indexOf('?') === -1 ? '?' : '&';
              var targetUrl = actionUrl + delimiter + searchParams.toString();
              e.preventDefault();
              window.parent.postMessage({ type: 'RESPONSIVIEW_NAVIGATE', url: targetUrl }, '*');
            }
          } catch (_) {}
        }, true);
      })();
    </script>
  `;
}

function fetchRemote(targetUrl, queryParams, redirectCount = 0, cookieJar = '') {
  return new Promise((resolve, reject) => {
    if (redirectCount > 8) {
      return reject(new Error('Terlalu banyak pengalihan (redirect loop).'));
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (err) {
      return reject(new Error('Format URL tidak valid.'));
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const headers = buildSpoofedHeaders(queryParams);
    headers['Host'] = parsedUrl.host;
    if (cookieJar) {
      headers['Cookie'] = cookieJar;
    }

    const options = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers,
      timeout: 15000
    };

    const req = client.request(options, (res) => {
      // Preserve Set-Cookie across redirect chain
      let newCookies = cookieJar;
      if (res.headers['set-cookie']) {
        const rawCookies = Array.isArray(res.headers['set-cookie'])
          ? res.headers['set-cookie']
          : [res.headers['set-cookie']];
        const parsedCookies = rawCookies.map((c) => c.split(';')[0]).join('; ');
        newCookies = newCookies ? `${newCookies}; ${parsedCookies}` : parsedCookies;
      }

      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const nextUrl = new URL(res.headers.location, parsedUrl).toString();
        res.resume();
        return resolve(fetchRemote(nextUrl, queryParams, redirectCount + 1, newCookies));
      }

      const chunks = [];
      let stream = res;
      const encoding = (res.headers['content-encoding'] || '').toLowerCase();

      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          finalUrl: parsedUrl.toString(),
          origin: parsedUrl.origin,
          body: Buffer.concat(chunks)
        });
      });
      stream.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy(new Error('Koneksi ke website tujuan melewati batas waktu (timeout).'));
    });

    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // 1. Health Check Endpoint
  if (reqUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', proxy: true }));
  }

  // 2. Headless Chromium Screenshot API Endpoint
  if (reqUrl.pathname === '/api/screenshot') {
    let rawUrl = reqUrl.searchParams.get('url') || 'demo.html';
    let targetUrl = rawUrl;
    if (rawUrl === 'demo.html' || rawUrl.endsWith('/demo.html')) {
      targetUrl = `http://localhost:${PORT}/demo.html`;
    } else if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    const width = parseInt(reqUrl.searchParams.get('w'), 10) || 393;
    const height = parseInt(reqUrl.searchParams.get('h'), 10) || 852;
    const dpr = parseFloat(reqUrl.searchParams.get('dpr')) || 2;
    const ua = reqUrl.searchParams.get('ua') || '';
    const rawFormat = reqUrl.searchParams.get('raw') === '1';

    try {
      const imgBuffer = await takeHeadlessScreenshot({ targetUrl, width, height, dpr, ua });

      if (rawFormat) {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': imgBuffer.length,
          'Content-Disposition': 'inline; filename="screenshot.png"',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(imgBuffer);
      }

      const dataUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        status: 'ok',
        dataUrl,
        w: width,
        h: height,
        dpr
      }));
    } catch (shotErr) {
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({
        status: 'error',
        message: shotErr.message
      }));
    }
  }

  // 2. Smart Proxy & Device Environment Emulator Endpoint
  if (reqUrl.pathname === '/proxy') {
    const targetUrl = reqUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Parameter ?url= wajib diisi.');
    }

    const queryParams = {
      ua: reqUrl.searchParams.get('ua') || '',
      platform: reqUrl.searchParams.get('platform') || 'iPhone',
      vendor: reqUrl.searchParams.get('vendor') || 'Apple Computer, Inc.',
      dpr: reqUrl.searchParams.get('dpr') || '2',
      touch: reqUrl.searchParams.get('touch') || '5',
      mobile: reqUrl.searchParams.get('mobile') || '1',
      os: reqUrl.searchParams.get('os') || 'ios',
      model: reqUrl.searchParams.get('model') || 'iPhone',
      w: reqUrl.searchParams.get('w') || '393',
      h: reqUrl.searchParams.get('h') || '852'
    };

    try {
      const result = await fetchRemote(targetUrl, queryParams);
      const contentType = result.headers['content-type'] || 'text/html; charset=utf-8';

      const safeHeaders = {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      };

      if (contentType.includes('text/html')) {
        let html = result.body.toString('utf-8');

        // Strip embedded CSP and X-Frame-Options meta tags that trigger "refused to connect"
        html = html.replace(/<meta[^>]*http-equiv=["']?(Content-Security-Policy|X-Frame-Options)["']?[^>]*>/gi, '');
        html = html.replace(/\sintegrity=["'][^"']*["']/gi, '');

        const injection = buildDeviceEnvironmentInjection(result.finalUrl, queryParams);

        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${injection}`);
        } else {
          html = `${injection}\n${html}`;
        }

        res.writeHead(result.statusCode, safeHeaders);
        return res.end(html, 'utf-8');
      }

      res.writeHead(result.statusCode, safeHeaders);
      return res.end(result.body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif; background: #0b0b0e; color: #f5f5f7; display: grid; place-items: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #1c1c1e; border: 1px solid rgba(255,255,255,0.12); padding: 28px 24px; border-radius: 18px; max-width: 440px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
            h3 { color: #ff453a; margin-top: 0; font-size: 17px; }
            p { color: #98989d; font-size: 13px; line-height: 1.5; margin: 10px 0; }
            code { background: rgba(255,255,255,0.08); padding: 3px 7px; border-radius: 6px; color: #0a84ff; font-family: ui-monospace, monospace; font-size: 12px; }
            .btn-retry { margin-top: 14px; background: #0a84ff; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>Website Menolak Koneksi / Tidak Ditemukan</h3>
            <p>Tidak dapat memuat halaman <code>${targetUrl}</code></p>
            <p>Penyebab: ${err.message}</p>
            <a href="${targetUrl}" target="_blank" rel="noopener" class="btn-retry">Buka Langsung di Tab Baru ↗</a>
          </div>
        </body>
        </html>
      `);
    }
  }

  // 3. Static File Server
  let filePath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, safePath);

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 File Tidak Ditemukan');
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ResponsiView Studio berjalan di: http://localhost:${PORT}`);
  console.log(`🛡️ Deep Device Emulator & Smart Proxy: AKTIF`);
  console.log(`======================================================\n`);
});
