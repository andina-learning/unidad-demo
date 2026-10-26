#!/usr/bin/env node
/* scripts/servir.js · servidor http para ver el curso compilado (dist/), sin dependencias.
   Uso: node scripts/servir.js [--port 8000]      (o PORT=8000)
   Los videos de YouTube exigen que el curso se sirva por http: no abrir dist/ con doble clic. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', 'dist');
const i = process.argv.indexOf('--port');
const PORT = Number(i > -1 ? process.argv[i + 1] : process.env.PORT) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};

if (!fs.existsSync(RAIZ)) {
  console.error('✖ No existe dist/. Compila primero: npm run build');
  process.exit(1);
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let archivo = path.normalize(path.join(RAIZ, url));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) {
    if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
    archivo = path.join(archivo, 'index.html');
  }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 · ' + url); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(archivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(datos);
  });
}).listen(PORT, () => {
  console.log(`\n▶ Curso servido en  http://localhost:${PORT}/spa/`);
  console.log(`  Versión por archivos: http://localhost:${PORT}/multipagina/`);
  console.log('  Ctrl+C para detener.\n');
});
