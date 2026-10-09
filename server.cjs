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
  '.vcf': 'text/vcard'
};

const server = http.createServer((req, res) => {
  let decodedUrl = decodeURIComponent(req.url.split('?')[0]);
  if (decodedUrl === '/' || decodedUrl === '') {
    decodedUrl = '/1_MY PROFILE PAGE/index.html';
  }

  let projectDir = '1_MY PROFILE PAGE';
  let relativePath = decodedUrl;

  if (decodedUrl.startsWith('/2_BUSINESS CARD/') || decodedUrl.startsWith('/2/')) {
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
});