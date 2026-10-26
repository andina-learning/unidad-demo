#!/usr/bin/env node
/* =========================================================
   build.js · Compilador de cursos OVA (vanilla, sin dependencias)
   ---------------------------------------------------------
   fuente/ova.config.js + fuente/contenido/*.html + plantillas/
   --------> dist/spa/         (index.html único, rutas #/<id>)
   --------> dist/multipagina/ (un .html por pantalla — fallback LMS
                                y referencia diffeable byte a byte)

   Uso:
     node build.js                                   modo autocontenido (entrega):
                                                     ./motor ./skin ./fuente → ./dist
     node build.js --motor <dir> --skin <dir> --curso <dir>
                                                     modo kit (lo invoca scripts/compilar.js)
   ========================================================= */
'use strict';

const fs   = require('fs');
const path = require('path');

/* La portada se llama `inicio` (estándar) o `portada` (cursos anteriores); en dist es index.html */
const esInicio = m => m.id === 'inicio' || m.id === 'portada';

/* ---------- 0. Rutas ----------
   Modo autocontenido (sin argumentos, build.js en la raíz de la entrega):
     ./motor  ./skin  ./fuente  →  ./dist
   Modo kit (lo invoca scripts/compilar.js):
     node build.js --motor <dir> --skin <dir> --curso <dir>                  */
function arg(nombre, porDefecto) {
  const i = process.argv.indexOf(nombre);
  return i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : porDefecto;
}
const CURSO  = arg('--curso', __dirname);
const MOTOR  = arg('--motor', path.join(CURSO, 'motor'));
const SKIN   = arg('--skin',  path.join(CURSO, 'skin'));
const FUENTE = path.join(CURSO, 'fuente');
const DIST       = path.join(CURSO, 'dist');
const DIST_MULTI = path.join(DIST, 'multipagina');
const DIST_SPA   = path.join(DIST, 'spa');
for (const [nombre, dir] of [['motor', MOTOR], ['skin', SKIN], ['fuente', FUENTE]]) {
  if (!fs.existsSync(dir)) { console.error(`✖ No existe la carpeta ${nombre}: ${dir}`); process.exit(1); }
}

/* ---------- 1. Config ---------- */
const cfg = require(path.join(FUENTE, 'ova.config.js'));

/* Derivados · numeración jerárquica:
   - nivel 1 (por defecto): correlativo con cero a la izquierda → 07
   - nivel 2 (subtema):     hereda el número del tema padre     → 7.1, 7.2
   Los subtemas no consumen número principal, así que insertarlos o quitarlos
   no renumera el resto del curso.
   file = <id>.html (inicio o portada → index.html) */
/* Dos reglas de numeración, según lo que declare el menú:
   - Ningún ítem con `tipo`: correlativo con cero a la
     izquierda → 01, 02…, como siempre.
   - Algún ítem con `tipo`: solo 'tema' (1, 2…) y 'subtema' (1.1, 2.1…)
     llevan número; 'especial' y agrupadas van sin él.
   Un tema puede fijar su número con `numero` (una unidad que continúa la
   numeración de la anterior: 3, 4…); los siguientes siguen correlativos. */
const jerarquico = cfg.menu.some(m => m.tipo);

/* Iconos de las secciones estructurales · los mismos en todos los cursos.
   Se aplican cuando el ítem no lleva número y el config no declara `icon`. */
const ICONOS_ESPECIALES = {
  inicio:       'mdi:home-outline',
  portada:      'mdi:home-outline',
  temario:      'mdi:map-outline',
  presentacion: 'mdi:play-circle-outline',
  introduccion: 'mdi:information-variant',
  conclusion:   'mdi:flag-outline',
  evaluacion:   'mdi:clipboard-check-outline',
  glosario:     'mdi:book-open-variant-outline',
  referencias:  'mdi:bookmark-outline',
};

let numTema = 0, numSub = 0;
const menu = cfg.menu.map((m, i) => {
  let num = '';
  if (!jerarquico) {
    num = String(i + 1).padStart(2, '0');
  } else if (m.tipo === 'tema') {
    numTema = m.numero ?? numTema + 1; numSub = 0;
    num = String(numTema);
  } else if (m.tipo === 'subtema') {
    numSub += 1;
    num = `${numTema}.${numSub}`;
  }
  const icon = m.icon || (!num && ICONOS_ESPECIALES[m.id]) || undefined;
  /* Secciones de un tema numerado: heredan el número → 1.1, 1.2… (el menú y la
     cabecera de la sección lo pintan; nadie lo escribe a mano). */
  const secciones = m.secciones && num
    ? m.secciones.map((sec, j) => ({ ...sec, num: `${num}.${j + 1}` }))
    : m.secciones;
  return { ...m, num, icon, secciones, file: esInicio(m) ? 'index.html' : `${m.id}.html` };
});


/* Temario · se genera desde el menú, no se escribe a mano: así no puede
   desalinearse cuando se inserta o se mueve una pantalla. Agrupa por
   `bloque` y respeta la numeración jerárquica. Las clases son del motor
   (`ova-bloque`, `ova-fila`); cada skin les da estilo dentro de su
   contenedor de temario. */
function generarTemario(menu) {
  /* Replica la estructura del menú: el contenido temático se numera y las
     secciones estructurales se reconocen por su icono. */
  const bloques = [];
  let actual = null;

  for (const m of menu) {
    if (esInicio(m) || m.id === 'temario') continue;   // no se listan a sí mismos

    if (m.grupo) {                                            // pantallas agrupadas (introducción)
      if (!actual || actual.titulo !== m.grupo) {
        actual = { titulo: m.grupo, icon: m.grupoIcon, items: [] };
        bloques.push(actual);
      }
    } else if (m.tipo === 'tema') {                           // cada tema abre su bloque
      actual = { titulo: `${m.num} · ${m.titulo}`, href: m.file, items: [] };
      // las secciones internas del tema se listan con su numeración,
      // enlazando a la página del tema (viven dentro de ella)
      (m.secciones || []).forEach(sec => actual.items.push({
        titulo: sec.titulo, nota: sec.nota, tipo: 'subtema',
        file: sec.ancla ? `${m.file}#${sec.ancla}` : m.file,
      }));
      bloques.push(actual);
      continue;                                               // el tema es el título del bloque
    } else if (m.secciones) {                                 // especial con secciones
      // (la introducción): bloque propio, con sus partes enlazando a la página
      actual = { titulo: m.titulo, icon: m.icon, href: m.file, items: [] };
      m.secciones.forEach(sec => actual.items.push({
        titulo: sec.titulo, nota: sec.nota, tipo: 'subtema',
        file: sec.ancla ? `${m.file}#${sec.ancla}` : m.file,
      }));
      bloques.push(actual);
      continue;
    } else if (m.tipo !== 'subtema') {                        // especiales de cierre
      if (!actual || actual.titulo !== 'Cierre de la unidad') {
        actual = { titulo: 'Cierre de la unidad', items: [] };
        bloques.push(actual);
      }
    }
    if (actual) actual.items.push(m);
  }

  // Un cierre con un solo ítem no necesita agrupador: el rótulo "Cierre de la
  // unidad" prometería un tramo final que no existe. Ese ítem pasa a ser el bloque.
  for (const b of bloques) {
    if (b.titulo === 'Cierre de la unidad' && b.items.length === 1) {
      const [it] = b.items;
      b.titulo = it.titulo; b.icon = it.icon; b.href = it.file; b.items = [];
    }
  }

  return bloques.map(b => {
    const items = b.items.map(m => {
      const marca = m.num
        ? `<span class="n">${m.num}</span>`
        : (m.icon ? `<span class="n n--icono"><iconify-icon icon="${m.icon}"></iconify-icon></span>` : '');
      const sub  = m.tipo === 'subtema' ? ' class="sub"' : '';
      const nota = m.nota ? ` <em>· ${m.nota}</em>` : '';
      return `            <li${sub}><a class="ova-fila" href="${m.file}">${marca}<span class="t">${m.titulo}${nota}</span><span class="ova-fila__ir" aria-hidden="true">→</span></a></li>`;
    }).join('\n');
    const tag = b.icon
      ? `<iconify-icon icon="${b.icon}"></iconify-icon> ${b.titulo}`
      : b.titulo;
    // El título del bloque de un tema lleva a la pantalla del tema:
    // sin esto, esa pantalla no sería alcanzable desde el índice.
    const cab = b.href
      ? `<a class="ova-bloque__tag ova-bloque__tag--link" href="${b.href}">${tag}<span class="ova-fila__ir" aria-hidden="true">→</span></a>`
      : `<span class="ova-bloque__tag">${tag}</span>`;
    const lista = b.items.length ? `
          <ol>
${items}
          </ol>` : '';
    return `        <div class="ova-bloque">
          ${cab}${lista}
        </div>`;
  }).join('\n');
}

/* Glosario · se genera desde cfg.glosario ({ letra, termino, definicion }).
   Sin icono ni enlace por término: mantenerlos a mano no es sostenible.
   Solo entra donde el contenido escribe {{GLOSARIO}}; el índice lista únicamente
   las letras que existen y las secciones van en orden alfabético. */
function generarGlosario(glosario) {
  const porLetra = new Map();
  for (const g of glosario || []) {
    const L = String(g.letra || g.termino.charAt(0)).toUpperCase();
    if (!porLetra.has(L)) porLetra.set(L, []);
    porLetra.get(L).push(g);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, 'es'));
  const indice = letras.map(L => `        <a href="#letra-${L}" class="ova-glosario-letra">${L}</a>`).join('\n');
  const secciones = letras.map(L => {
    const items = porLetra.get(L).map(g => `            <div class="ova-glosario__item" data-term="${g.termino.toLowerCase().replaceAll('"', '&quot;')}">
              <h3>${g.termino}</h3>
              <p>${g.definicion}</p>
            </div>`).join('\n');
    return `        <section id="letra-${L}" class="ova-glosario__seccion">
          <div class="ova-glosario__letra-titulo">${L}</div>
          <div class="ova-glosario__items">
${items}
          </div>
        </section>`;
  }).join('\n\n');
  return `      <nav class="ova-glosario__indice" data-reveal aria-label="Índice alfabético">
${indice}
      </nav>

      <div class="ova-glosario" data-reveal>
${secciones}
      </div>`;
}

/* ---------- 2. Utilidades ---------- */
function limpiar(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
function copiarDir(desde, hasta) {
  if (!fs.existsSync(desde)) return;
  fs.cpSync(desde, hasta, { recursive: true, filter: f => !path.basename(f).startsWith('.') });
}
function leer(p)        { return fs.readFileSync(p, 'utf8'); }
function escribir(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

/* ---------- 3. Compilar pantallas ---------- */
limpiar(DIST);

/* ---------- 2b. Skin de la institución ----------
   fuentes.html: el <link> de Google Fonts. skin.css / skin.js: opcionales.
   Los marcadores van pegados a la línea anterior para que, si no hay skin,
   no quede una línea vacía en el HTML (la salida debe ser diffeable). */
const fuentesHtml = leer(path.join(SKIN, 'fuentes.html')).trimEnd();
const SKIN_CSS = fs.existsSync(path.join(SKIN, 'skin.css')) ? '\n<link rel="stylesheet" href="assets/css/skin.css" />' : '';
const SKIN_JS  = fs.existsSync(path.join(SKIN, 'skin.js'))  ? '\n<script src="assets/js/skin.js"></script>'          : '';
/* Catálogo de componentes (motor/catalogo/): se carga después del motor y antes de la piel,
   así la piel lo viste. Es parte del motor: sin él, el curso no compila. */
const CATALOGO = path.join(MOTOR, 'catalogo');
for (const f of ['catalogo.css', 'catalogo.js']) {
  if (!fs.existsSync(path.join(CATALOGO, f))) { console.error(`✖ Falta motor/catalogo/${f}`); process.exit(1); }
}
const CATALOGO_CSS = '\n<link rel="stylesheet" href="assets/css/catalogo.css" />';
const CATALOGO_JS  = '\n<script src="assets/js/catalogo.js"></script>';
function conSkin(molde) {
  return molde.replaceAll('{{FUENTES}}', fuentesHtml)
    .replaceAll('{{CATALOGO_CSS}}', CATALOGO_CSS).replaceAll('{{CATALOGO_JS}}', CATALOGO_JS)
    .replaceAll('{{SKIN_CSS}}', SKIN_CSS).replaceAll('{{SKIN_JS}}', SKIN_JS);
}

/* Paleta: la del curso gana; si no hay, la de la institución. */
const rutaPaleta = [path.join(FUENTE, 'paleta.css'), path.join(SKIN, 'paleta.css')].find(p => fs.existsSync(p));
if (!rutaPaleta) {
  console.error('✖ El curso no tiene paleta: crea fuente/paleta.css (copia un preset de skin/presets/ de la institución)');
  process.exit(1);
}

const shell = conSkin(leer(path.join(MOTOR, 'plantillas', 'shell.html')));
const MARCA_EXTRAS = '\n<!-- ova:extras -->\n';

let compiladas = 0, sinContenido = [];
const templates = [];   // pantallas para el index.html de la SPA

for (const m of menu) {
  const rutaContenido = path.join(FUENTE, 'contenido', `${m.id}.html`);
  if (!fs.existsSync(rutaContenido)) { sinContenido.push(`${m.num} ${m.id}`); continue; }

  /* portada usa su propio molde (plantillas/portada.html o portada-full.html
     si course.portadaFullBleed); el resto, el shell */
  const esPortada = esInicio(m);
  const molde = esPortada
    ? conSkin(leer(path.join(MOTOR, 'plantillas', cfg.course.portadaFullBleed ? 'portada-full.html' : 'portada.html')))
    : shell;

  /* contenido = interior del <article> · extras = estilos/scripts propios (van tras el motor) */
  let bruto = leer(rutaContenido);
  if (bruto.endsWith('\n')) bruto = bruto.slice(0, -1);
  let [contenido, extras] = bruto.split(MARCA_EXTRAS);
  extras = extras ? '\n\n' + extras : '';

  let html = molde
    .replaceAll('{{ID}}',           m.id)
    .replaceAll('{{NUM}}',          m.num)
    .replaceAll('{{TITULO}}',       m.titulo)
    .replaceAll('{{CURSO_NOMBRE}}', cfg.course.name)
    .replaceAll('{{PRESET}}',       cfg.course.preset)
    .replaceAll('{{CONTENIDO}}',    contenido.replaceAll('{{NUM}}', m.num))
    /* {{PDF}} después de {{CONTENIDO}}: el contenido también puede usarlo
       (p. ej. el CTA de descarga de la portada) */
    .replaceAll('{{PDF}}',          cfg.course.pdf)
    .replaceAll('{{EXTRAS}}',       extras)
    .replaceAll('{{TEMARIO}}',      () => generarTemario(menu))
    .replaceAll('{{GLOSARIO}}',     () => generarGlosario(cfg.glosario));

  /* Sin PDF todavía (cfg.course.pdf falsy): fuera el botón de descarga del topbar —
     un botón muerto no pasa QA. Se filtra por título, no por href, porque es estable
     incluso si {{PDF}} ya fue reemplazado por cadena vacía. */

  /* Boton de descarga del PDF: se filtra SOLO por el marcador data-ova-pdf-btn,
     presente unicamente en los moldes. Nunca filtrar por texto visible: el
     contenido de autor puede repetirlo (hallazgo P1-1 de la auditoria). */
  if (!cfg.course.pdf) {
    html = html.split('\n').filter(l => !l.includes('data-ova-pdf-btn')).join('\n');
  }
  html = html.replaceAll(' data-ova-pdf-btn', '');

  escribir(path.join(DIST_MULTI, m.file), html);

  /* template SPA = interior del <main> de la página ya compuesta + extras.
     Inerte hasta que el router lo monta (las imágenes cargan al entrar). */
  const iniMain = html.indexOf('<main class="ova-main">') + '<main class="ova-main">'.length;
  const finMain = html.indexOf('</main>');
  templates.push(`<template data-pantalla="${m.id}">` + html.slice(iniMain, finMain) + extras + '\n</template>');
  compiladas++;
}

/* ---------- 3b. SPA: un index.html con todas las pantallas ---------- */
{
  const moldeSpa = conSkin(leer(path.join(MOTOR, 'plantillas', 'spa.html')));
  const spaHtml = moldeSpa
    .replaceAll('{{CURSO_NOMBRE}}', cfg.course.name)
    .replaceAll('{{PRESET}}',       cfg.course.preset)
    .replace('{{HEAD_EXTRAS}}',     '')
    .replace('{{TEMPLATES}}',       () => templates.join('\n'));
  escribir(path.join(DIST_SPA, 'index.html'), spaHtml);
}

/* ---------- 4-5. Por cada salida: config runtime + motor + paleta + assets ---------- */
const runtime = { ...cfg, menu };
for (const destino of [DIST_MULTI, DIST_SPA]) {
  escribir(
    path.join(destino, 'assets', 'js', 'course.js'),
    `/* GENERADO POR build.js · NO EDITAR A MANO · fuente: fuente/ova.config.js */\n` +
    `window.OVA_COURSE = ${JSON.stringify(runtime, null, 2)};\n`
  );
  escribir(path.join(destino, 'assets', 'css', 'core.css'), leer(path.join(MOTOR, 'core.css')));
  escribir(path.join(destino, 'assets', 'js',  'core.js'),  leer(path.join(MOTOR, 'core.js')));
  escribir(path.join(destino, 'assets', 'css', 'catalogo.css'), leer(path.join(CATALOGO, 'catalogo.css')));
  escribir(path.join(destino, 'assets', 'js',  'catalogo.js'),  leer(path.join(CATALOGO, 'catalogo.js')));
  escribir(
    path.join(destino, 'assets', 'css', 'presets', `theme-${cfg.course.preset}.css`),
    leer(rutaPaleta)
  );
  if (SKIN_CSS) escribir(path.join(destino, 'assets', 'css', 'skin.css'), leer(path.join(SKIN, 'skin.css')));
  if (SKIN_JS)  escribir(path.join(destino, 'assets', 'js',  'skin.js'),  leer(path.join(SKIN, 'skin.js')));
  copiarDir(path.join(SKIN, 'logos'), path.join(destino, 'assets', 'img', 'logos'));
  copiarDir(path.join(FUENTE, 'assets'), path.join(destino, 'assets'));
}

/* ---------- 6. Reporte ---------- */
console.log(`✔ ${compiladas}/${menu.length} pantallas → dist/multipagina/ + dist/spa/index.html`);
if (sinContenido.length) {
  console.log(`○ Sin contenido todavía (${sinContenido.length}): ${sinContenido.join(', ')}`);
}
