#!/usr/bin/env node
/* scripts/verificar.js · comprueba que dist/ tiene todas las pantallas del menú.
   Lo corre `npm test` después de compilar. */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const cfg = require(path.join(RAIZ, 'fuente', 'ova.config.js'));
const errores = [];

const spa = path.join(RAIZ, 'dist', 'spa', 'index.html');
if (!fs.existsSync(spa)) errores.push('falta dist/spa/index.html');
else {
  const html = fs.readFileSync(spa, 'utf8');
  for (const m of cfg.menu) if (!html.includes(`data-pantalla="${m.id}"`)) errores.push(`spa: falta la pantalla "${m.id}"`);
}
for (const m of cfg.menu) {
  const archivo = (m.id === 'inicio' || m.id === 'portada') ? 'index.html' : `${m.id}.html`;   // misma regla que build.js
  if (!fs.existsSync(path.join(RAIZ, 'dist', 'multipagina', archivo))) errores.push(`multipagina: falta ${archivo}`);
}
for (const f of ['assets/css/core.css', 'assets/js/core.js']) {
  if (!fs.existsSync(path.join(RAIZ, 'dist', 'spa', f))) errores.push(`spa: falta ${f}`);
}

if (errores.length) { console.error('✖ Verificación:\n  ' + errores.join('\n  ')); process.exit(1); }
console.log(`✔ ${cfg.menu.length} pantallas en dist/spa y dist/multipagina`);
