// Server estático mínimo con soporte de Range (para videos).
// Uso: node serve.js  →  http://localhost:5178
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5178;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.mp4': 'video/mp4', '.mov': 'video/mp4', '.otf': 'font/otf',
  '.woff2': 'font/woff2', '.json': 'application/json'
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('404');
  }
  const size = fs.statSync(file).size;
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = parseInt(s, 10);
    const end = e ? parseInt(e, 10) : Math.min(start + 4 * 1024 * 1024, size - 1);
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1, 'Content-Type': type
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': size, 'Content-Type': type, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  }
}).listen(PORT, () => console.log(`Uri & Dani → http://localhost:${PORT}`));
