#!/usr/bin/env node
/* scripts/zip.js · comprime dist/spa para subirlo al LMS. La multipágina (un archivo por
   pantalla, para LMS que lo exijan) solo si se pide: npm run zip -- --multipagina
   Usa el comando `zip` del sistema (macOS y Linux lo traen). En Windows,
   comprime la carpeta dist/spa con el explorador de archivos. */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const { name } = require(path.join(RAIZ, 'package.json'));
const fecha = new Date().toISOString().slice(0, 10);

const salidas = process.argv.includes('--multipagina') ? ['spa', 'multipagina'] : ['spa'];
for (const salida of salidas) {
  const zip = path.join(RAIZ, `${name}-${salida}-${fecha}.zip`);
  fs.rmSync(zip, { force: true });
  const r = spawnSync('zip', ['-qr', zip, salida, '-x', '*.DS_Store'], { cwd: path.join(RAIZ, 'dist'), stdio: 'inherit' });
  if (r.error || r.status !== 0) {
    console.error('✖ No se pudo ejecutar `zip`. Comprime la carpeta dist/' + salida + ' con el explorador de archivos.');
    process.exit(1);
  }
  console.log(`✔ ${path.basename(zip)}`);
}
