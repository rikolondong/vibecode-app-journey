const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.vcf': 'text/vcard',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json'
};

const server = http.createServer((req, res) => {
  let decodedUrl = decodeURIComponent(req.url.split('?')[0]);
  if (decodedUrl === '/' || decodedUrl === '') {
    decodedUrl = '/1_MY PROFILE PAGE/index.html';
  }

  let projectDir = '1_MY PROFILE PAGE';
  let relativePath = decodedUrl;

  if (decodedUrl.startsWith('/15_SUBSIM/') || decodedUrl.startsWith('/15_SUBSIM') || decodedUrl.startsWith('/15/') || decodedUrl === '/15') {
    projectDir = path.join('15_SUBSIM', 'dist');
    relativePath = decodedUrl.replace(/^\/(15_SUBSIM|15)\/?/, '');
  } else if (decodedUrl.startsWith('/14_RESPONSIVE/') || decodedUrl.startsWith('/14_RESPONSIVE') || decodedUrl.startsWith('/14/') || decodedUrl === '/14') {
    projectDir = '14_RESPONSIVE';
    relativePath = decodedUrl.replace(/^\/(14_RESPONSIVE|14)\/?/, '');
  } else if (decodedUrl.startsWith('/13_WEB AC130/') || decodedUrl.startsWith('/13_WEB_AC130/') || decodedUrl.startsWith('/13/')) {
    projectDir = '13_WEB AC130';
    relativePath = decodedUrl.replace(/^\/(13_WEB AC130|13_WEB_AC130|13)\/?/, '');
  } else if (decodedUrl.startsWith('/12_SIMTRIP/') || decodedUrl.startsWith('/12/')) {
    projectDir = '12_SIMTRIP';
    relativePath = decodedUrl.replace(/^\/(12_SIMTRIP|12)\/?/, '');
  } else if (decodedUrl.startsWith('/11_HOME SURVIVOR/') || decodedUrl.startsWith('/11_HOME_SURVIVOR/') || decodedUrl.startsWith('/11/')) {
    projectDir = '11_HOME SURVIVOR';
    relativePath = decodedUrl.replace(/^\/(11_HOME SURVIVOR|11_HOME_SURVIVOR|11)\/?/, '');
  } else if (decodedUrl.startsWith('/10_ANOTHER WORLD/') || decodedUrl.startsWith('/10/')) {
    projectDir = '10_ANOTHER WORLD';
    relativePath = decodedUrl.replace(/^\/(10_ANOTHER WORLD|10)\/?/, '');
  } else if (decodedUrl.startsWith('/9_AI VIRTUAL OFFICE/') || decodedUrl.startsWith('/9/')) {
    projectDir = '9_AI VIRTUAL OFFICE';
    relativePath = decodedUrl.replace(/^\/(9_AI VIRTUAL OFFICE|9)\/?/, '');
  } else if (decodedUrl.startsWith('/7_IDLE HIKING GAME/') || decodedUrl.startsWith('/7/')) {
    projectDir = '7_IDLE HIKING GAME';
    relativePath = decodedUrl.replace(/^\/(7_IDLE HIKING GAME|7)\/?/, '');
  } else if (decodedUrl.startsWith('/6_SIMULATOR PERLINTASAN KERETA/') || decodedUrl.startsWith('/6/')) {
    projectDir = '6_SIMULATOR PERLINTASAN KERETA';
    relativePath = decodedUrl.replace(/^\/(6_SIMULATOR PERLINTASAN KERETA|6)\/?/, '');
  } else if (decodedUrl.startsWith('/5_ENDLESS HIGHWAY/') || decodedUrl.startsWith('/5/')) {
    projectDir = '5_ENDLESS HIGHWAY';
    relativePath = decodedUrl.replace(/^\/(5_ENDLESS HIGHWAY|5)\/?/, '');
  } else if (decodedUrl.startsWith('/4_INDO FIREWATCHER/') || decodedUrl.startsWith('/4/')) {
    projectDir = path.join('4_INDO FIREWATCHER', 'dist');
    relativePath = decodedUrl.replace(/^\/(4_INDO FIREWATCHER|4)\/?/, '');
  } else if (decodedUrl.startsWith('/assets/')) {
    projectDir = path.join('4_INDO FIREWATCHER', 'dist');
    relativePath = decodedUrl;
  } else if (decodedUrl.startsWith('/3_LANDING PAGE WEBSITE/') || decodedUrl.startsWith('/3/')) {
    projectDir = '3_LANDING PAGE WEBSITE';
    relativePath = decodedUrl.replace(/^\/(3_LANDING PAGE WEBSITE|3)\/?/, '');
  } else if (decodedUrl.startsWith('/2_BUSINESS CARD/') || decodedUrl.startsWith('/2/')) {
    projectDir = '2_BUSINESS CARD';
    relativePath = decodedUrl.replace(/^\/(2_BUSINESS CARD|2)\/?/, '');
  } else if (decodedUrl.startsWith('/1_MY PROFILE PAGE/') || decodedUrl.startsWith('/1/')) {
    projectDir = '1_MY PROFILE PAGE';
    relativePath = decodedUrl.replace(/^\/(1_MY PROFILE PAGE|1)\/?/, '');
  }

  if (!relativePath || relativePath === '/') {
    relativePath = 'index.html';
  }

  const filePath = path.join(__dirname, projectDir, relativePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`- Project 1: http://localhost:${PORT}/1/`);
  console.log(`- Project 2: http://localhost:${PORT}/2/`);
  console.log(`- Project 3: http://localhost:${PORT}/3/`);
  console.log(`- Project 4: http://localhost:${PORT}/4/`);
  console.log(`- Project 5: http://localhost:${PORT}/5/`);
  console.log(`- Project 6: http://localhost:${PORT}/6/`);
  console.log(`- Project 7: http://localhost:${PORT}/7/`);
  console.log(`- Project 9: http://localhost:${PORT}/9/`);
  console.log(`- Project 10: http://localhost:${PORT}/10/`);
  console.log(`- Project 11: http://localhost:${PORT}/11/`);
  console.log(`- Project 12: http://localhost:${PORT}/12/`);
  console.log(`- Project 13: http://localhost:${PORT}/13/`);
  console.log(`- Project 14: http://localhost:${PORT}/14/`);
});
