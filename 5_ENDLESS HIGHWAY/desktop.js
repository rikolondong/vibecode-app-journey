const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let serverInstance = null;
const PORT = 3000;

// Enable hardware GPU acceleration for smooth WebGL rendering
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startLocalServer(callback) {
  // Check if port is already active
  const testReq = http.get(`http://localhost:${PORT}/index.html`, () => {
    // Already running, no need to start another
    if (callback) callback();
  });

  testReq.on('error', () => {
    // Port not active, start our local embedded server
    serverInstance = http.createServer((req, res) => {
      let cleanUrl = req.url.split('?')[0];
      if (cleanUrl === '/') cleanUrl = '/index.html';
      const safePath = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(__dirname, safePath);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        });

        fs.createReadStream(filePath).pipe(res);
      });
    });

    serverInstance.listen(PORT, () => {
      if (callback) callback();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'JALAN TOL KELAM - Endless Midnight Highway 3D',
    width: 1366,
    height: 768,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#04060b',
    autoHideMenuBar: true,
    show: false, // show after ready-to-show to prevent white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      enableWebSQL: false
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // F11 or Alt+Enter Fullscreen Toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startLocalServer(() => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    try { serverInstance.close(); } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
