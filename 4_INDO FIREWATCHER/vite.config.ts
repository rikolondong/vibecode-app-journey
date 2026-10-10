import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import https from 'https';

// Fast path resolution cache
const pathResolveCache = new Map<string, string | null>();

// Custom resolver plugin to handle folder paths containing '#' on Windows
// Optimized to only resolve project files and skip node_modules
const hashPathResolverPlugin = () => ({
  name: 'hash-path-resolver',
  enforce: 'pre' as const,
  resolveId(source: string, importer: string | undefined) {
    let targetPath = '';

    if (source.startsWith('/src/') || source === '/src/main.tsx') {
      targetPath = path.join(__dirname, source.slice(1));
    } else if (importer) {
      // Don't intercept internal imports within node_modules
      if (importer.includes('node_modules')) {
        return null;
      }

      if (source.startsWith('@/')) {
        targetPath = path.join(__dirname, source.slice(2));
      } else if (source.startsWith('./') || source.startsWith('../')) {
        targetPath = path.join(path.dirname(importer), source);
      } else {
        return null;
      }
    } else {
      return null;
    }

    const extensions = ['.tsx', '.ts', '.jsx', '.js', '.json', '.css', ''];
    for (const ext of extensions) {
      const fullPath = targetPath + ext;
      if (fs.existsSync(fullPath)) {
        try {
          if (fs.statSync(fullPath).isFile()) {
            return path.normalize(fullPath);
          }
        } catch {}
      }
    }

    // Check directory index
    for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
      const indexPath = path.join(targetPath, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        try {
          if (fs.statSync(indexPath).isFile()) {
            return path.normalize(indexPath);
          }
        } catch {}
      }
    }

    return null;
  },
});


// Proxy in-memory cache for NASA FIRMS in dev mode (3 minutes TTL)
const devCacheStore = new Map<string, { data: string; expiresAt: number; status: number }>();
const DEV_CACHE_TTL_MS = 180 * 1000;

// Plugin middleware proxy NASA FIRMS untuk bypass CORS & protect quota
const nasaFirmsProxyPlugin = () => ({
  name: 'nasa-firms-proxy',
  configureServer(server: any) {
    server.middlewares.use('/api/firms', (req: any, res: any) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const key = parsedUrl.searchParams.get('key') || process.env.VITE_NASA_FIRMS_MAP_KEY || process.env.NASA_FIRMS_KEY || '';
      const sensor = parsedUrl.searchParams.get('sensor') || 'VIIRS_SNPP_NRT';
      const days = parsedUrl.searchParams.get('days') || '1';
      const bbox = '95,-11,141,6'; // Indonesia Bounding Box

      const cacheKey = `${sensor}_${days}`;
      const now = Date.now();
      const cached = devCacheStore.get(cacheKey);

      if (cached && cached.expiresAt > now) {
        res.writeHead(cached.status, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
        });
        res.end(cached.data);
        return;
      }

      const targetUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${sensor}/${bbox}/${days}`;

      const clientReq = https.get(targetUrl, (nasaRes) => {
        let body = '';
        nasaRes.on('data', (chunk) => (body += chunk));
        nasaRes.on('end', () => {
          const status = nasaRes.statusCode || 200;
          if (status === 200 && body.length > 50) {
            devCacheStore.set(cacheKey, {
              data: body,
              expiresAt: now + DEV_CACHE_TTL_MS,
              status,
            });
          }
          res.writeHead(status, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'MISS',
          });
          res.end(body);
        });
      });

      clientReq.on('error', (err) => {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: err.message }));
      });

      clientReq.setTimeout(10000, () => {
        clientReq.destroy();
        res.writeHead(504, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'Gateway timeout contacting NASA' }));
      });
    });
  },
});

export default defineConfig({
  plugins: [hashPathResolverPlugin(), react(), nasaFirmsProxyPlugin()],
  optimizeDeps: {
    entries: ['./index.html'],
    include: ['react', 'react-dom', 'leaflet', 'lucide-react'],
  },
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/legacy/**', '**/app/**', '**/dist/**'],
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-leaflet': ['leaflet'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});

