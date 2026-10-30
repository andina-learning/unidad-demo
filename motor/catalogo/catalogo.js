/* Catálogo de componentes (KIT-001): comportamiento de las piezas ova- del catálogo. */

/* =========================================================
   INDICIO DE INTERACCIÓN (.ova-llamado)
   Cada vez que un componente interactivo aparece en pantalla (al bajar o
   al subir), él y su llamado a la acción (.ova-llamado justo antes) reciben
   .is-indicio: catalogo.css anima la manito; el halo del componente lo pone
   la piel. Al salir del todo se les quita, así que al volver la animación
   arranca de nuevo. Vigila también lo que la SPA pinta al navegar.
   ========================================================= */
(() => {
  'use strict';
  if (!('IntersectionObserver' in window)) return;

  const INTERACTIVOS = '.ova-acordeon, .ova-carrusel, .ova-tabs, .ova-timeline-h, .ova-hotspots, ' +
                       '.ova-video, .ova-audio, .ova-beforeafter, .ova-descargable:not(.ova-descargable--imagen)';
  const vigilados = new WeakSet();

  const marcar = (comp, si) => {
    comp.classList.toggle('is-indicio', si);
    const previo = comp.previousElementSibling;
    if (previo && previo.classList.contains('ova-llamado')) previo.classList.toggle('is-indicio', si);
  };

  const observador = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (e.intersectionRatio >= 0.25) marcar(e.target, true);
      else if (!e.isIntersecting) marcar(e.target, false);
    }
  }, { threshold: [0, 0.25] });

  const vigilar = raiz => {
    if (!raiz.querySelectorAll) return;
    const lista = raiz.matches && raiz.matches(INTERACTIVOS) ? [raiz] : [];
    lista.push(...raiz.querySelectorAll(INTERACTIVOS));
    for (const comp of lista) {
      if (vigilados.has(comp)) continue;
      vigilados.add(comp);
      observador.observe(comp);
    }
  };

  const iniciar = () => {
    vigilar(document);
    new MutationObserver(cambios => {
      for (const c of cambios) c.addedNodes.forEach(n => n.nodeType === 1 && vigilar(n));
    }).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   PÓDCAST CON PLYR (.ova-episodio audio[data-ova-plyr])
   Plyr (MIT) viaja en assets/vendor/ del curso; se carga solo si la
   pantalla lo pide. Controles: −15 s · play · +15 s · progreso · velocidad;
   con data-ova-plyr="volumen" añade silencio y volumen. Iconos propios.
   Suena uno a la vez. Los controles llevan, además de las clases de Plyr,
   las ova-episodio__* con que catalogo.css los dibuja; el contenedor recibe
   .is-playing y .is-muted.
   ========================================================= */
(function () {
  'use strict';
  const ico = (mod, cuerpo) => `<svg class="ova-episodio__ico${mod ? ' ova-episodio__ico--' + mod : ''}" viewBox="0 0 24 24" aria-hidden="true">${cuerpo}</svg>`;
  const GIRO = '<path d="M19.5 12A7.5 7.5 0 1 1 15.75 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M14.66 2.5 15.75 5.5 12.6 6.06" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';
  const QUINCE = '<text x="12" y="15" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7.6" font-weight="700" fill="currentColor">15</text>';
  const ICO = {
    rew:   ico('', `<g transform="matrix(-1 0 0 1 24 0)">${GIRO}</g>${QUINCE}`),
    fwd:   ico('', GIRO + QUINCE),
    play:  ico('play', '<path d="M8 5v14l11-7z" fill="currentColor"/>'),
    pause: ico('pausa', '<path d="M6 5h4v14H6zm8 0h4v14h-4z" fill="currentColor"/>'),
    vol:   ico('volumen', '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.5 6.7a7.5 7.5 0 0 1 0 10.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
    mute:  ico('mudo', '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>')
  };
  const BTN = 'plyr__control ova-episodio__control';
  const controles = (conVolumen) => `
    <div class="plyr__controls ova-episodio__controles">
      <button type="button" class="${BTN}" data-plyr="rewind" aria-label="Retroceder 15 segundos">${ICO.rew}</button>
      <button type="button" class="${BTN}" data-plyr="play" aria-label="Reproducir">${ICO.play}${ICO.pause}</button>
      <button type="button" class="${BTN}" data-plyr="fast-forward" aria-label="Adelantar 15 segundos">${ICO.fwd}</button>
      <div class="plyr__time plyr__time--current ova-episodio__tiempo" aria-label="Tiempo actual">00:00</div>
      <div class="plyr__progress ova-episodio__progreso"><input data-plyr="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Posición"><progress class="plyr__progress__buffer" min="0" max="100" value="0"></progress></div>
      <div class="plyr__time plyr__time--duration ova-episodio__tiempo ova-episodio__tiempo--duracion" aria-label="Duración">00:00</div>
      ${conVolumen ? `<button type="button" class="${BTN}" data-plyr="mute" aria-label="Silenciar">${ICO.vol}${ICO.mute}</button><div class="plyr__volume ova-episodio__volumen"><input data-plyr="volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volumen"></div>` : ''}
      <button type="button" class="ova-episodio__velocidad" aria-label="Velocidad de reproducción">1×</button>
    </div>`;
  const VEL = [1, 1.25, 1.5, 2];
  const JS = 'assets/vendor/plyr.js', CSS = 'assets/vendor/plyr.css';
  let cargando = null;
  function cargarPlyr() {
    if (window.Plyr) return Promise.resolve();
    if (cargando) return cargando;
    cargando = new Promise((ok, mal) => {
      // Si otra capa ya pidió Plyr, se espera a la misma carga.
      const previo = document.querySelector(`script[src="${JS}"]`);
      if (previo) { previo.addEventListener('load', ok); previo.addEventListener('error', mal); return; }
      if (!document.querySelector(`link[href="${CSS}"]`)) {
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CSS; document.head.appendChild(l);
      }
      const s = document.createElement('script'); s.src = JS; s.onload = ok; s.onerror = mal; document.head.appendChild(s);
    });
    return cargando;
  }
  function armar(audio) {
    if (audio.dataset.ovaPlyrListo) return;
    audio.dataset.ovaPlyrListo = '1';
    cargarPlyr().then(() => {
      const p = new Plyr(audio, {
        controls: controles(audio.dataset.ovaPlyr === 'volumen'), seekTime: 15, speed: { selected: 1, options: VEL },
        i18n: { play: 'Reproducir', pause: 'Pausar', rewind: 'Retroceder {seektime} s', fastForward: 'Adelantar {seektime} s', seek: 'Posición', currentTime: 'Tiempo actual', duration: 'Duración', mute: 'Silenciar', unmute: 'Activar sonido', volume: 'Volumen' }
      });
      const caja = p.elements.container;
      caja.classList.add('ova-episodio__reproductor');
      const estado = () => {
        caja.classList.toggle('is-playing', p.playing);
        caja.classList.toggle('is-muted', p.muted || p.volume === 0);
      };
      ['play', 'playing', 'pause', 'ended', 'volumechange'].forEach(ev => p.on(ev, estado));
      let i = 0;
      p.on('ready', () => {
        const btn = caja.querySelector('.ova-episodio__velocidad');
        btn && btn.addEventListener('click', () => { i = (i + 1) % VEL.length; p.speed = VEL[i]; btn.textContent = String(VEL[i]).replace('.', ',') + '×'; });
      });
      p.on('play', () => document.querySelectorAll('.ova-episodio audio').forEach(a => { if (a !== audio && !a.paused) a.pause(); }));
    }).catch(() => { audio.controls = true; });
  }
  const iniciar = () => {
    const todos = () => document.querySelectorAll('.ova-episodio audio[data-ova-plyr]').forEach(armar);
    todos();
    new MutationObserver(todos).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   BLOQUE DE CÓDIGO NUMERADO (.ova-codigo)
   Envuelve cada línea del <code> en .ova-codigo__linea (el número lo pone
   catalogo.css). data-ova-resaltar="5,8" en la figura marca esas líneas. Si
   una etiqueta cruza de una línea a otra, el bloque se deja sin numerar.
   La cabecera trae el botón «Copiar código»: copia el código sin los números y
   dice «Copiado» con un visto durante 2 s. Si el portapapeles no responde (un
   curso abierto como archivo), el botón no cambia y la pantalla sigue igual.
   ========================================================= */
(function () {
  'use strict';
  const COPIAR = 'Copiar código', COPIADO = 'Copiado';
  function texto(code) {
    const lineas = code.querySelectorAll('.ova-codigo__linea');
    return lineas.length ? [...lineas].map(l => l.textContent).join('\n') : code.textContent.replace(/\n$/, '');
  }
  function copiar(t) {
    const viejo = () => {
      const area = document.createElement('textarea');
      area.value = t; area.setAttribute('readonly', ''); area.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(area); area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      area.remove();
      return ok ? Promise.resolve() : Promise.reject(new Error('copy'));
    };
    return navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t).catch(viejo) : viejo();
  }
  function boton(fig, code) {
    const cab = fig.querySelector('figcaption');
    if (!cab || cab.querySelector('.ova-codigo__copiar')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ova-codigo__copiar'; b.setAttribute('aria-label', COPIAR);
    b.innerHTML = '<iconify-icon icon="mdi:content-copy" aria-hidden="true"></iconify-icon><span class="ova-codigo__copiar-texto">' + COPIAR + '</span>';
    const rotulo = b.querySelector('.ova-codigo__copiar-texto'), icono = b.querySelector('iconify-icon');
    let reloj;
    b.addEventListener('click', () => {
      copiar(texto(code)).then(() => {
        clearTimeout(reloj);
        b.classList.add('is-copiado'); b.setAttribute('aria-label', COPIADO);
        rotulo.textContent = COPIADO; icono.setAttribute('icon', 'mdi:check');
        reloj = setTimeout(() => {
          b.classList.remove('is-copiado'); b.setAttribute('aria-label', COPIAR);
          rotulo.textContent = COPIAR; icono.setAttribute('icon', 'mdi:content-copy');
        }, 2000);
      }, () => {});
    });
    cab.appendChild(b);
  }
  function armar(fig) {
    const code = fig.querySelector('pre > code');
    if (!code) return;
    boton(fig, code);
    if (code.dataset.ovaLineas) return;
    code.dataset.ovaLineas = '1';
    const lineas = code.innerHTML.replace(/\n$/, '').split('\n');
    const abre = l => (l.match(/<span\b/g) || []).length, cierra = l => (l.match(/<\/span>/g) || []).length;
    if (lineas.some(l => abre(l) !== cierra(l))) return;
    const resaltar = new Set((fig.dataset.ovaResaltar || '').split(',').map(n => parseInt(n, 10)).filter(Boolean));
    code.innerHTML = lineas.map((l, i) =>
      '<span class="ova-codigo__linea' + (resaltar.has(i + 1) ? ' is-resaltada' : '') + '">' + l + '</span>').join('');
  }
  const iniciar = () => {
    const todos = () => document.querySelectorAll('.ova-codigo').forEach(armar);
    todos();
    new MutationObserver(todos).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   CARRUSEL DE FOTOS (.ova-galeria)
   Una foto protagonista y las vecinas asomando. Botones, puntos, flechas
   del teclado y scroll-snap; la activa se marca con IntersectionObserver.
   ========================================================= */
(function () {
  'use strict';
  function armar(g) {
    if (g.dataset.ovaGaleria) return;
    g.dataset.ovaGaleria = '1';
    const pista = g.querySelector('.ova-galeria__pista');
    const items = [...g.querySelectorAll('.ova-galeria__item')];
    if (!pista || !items.length) return;
    const puntos = g.querySelector('.ova-galeria__puntos');
    if (puntos) items.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ova-galeria__punto' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', 'Imagen ' + (i + 1) + ' de ' + items.length);
      b.addEventListener('click', () => ir(i));
      puntos.appendChild(b);
    });
    let actual = 0;
    const marcar = (i) => {
      actual = i;
      items.forEach((it, k) => it.classList.toggle('is-active', k === i));
      puntos && [...puntos.children].forEach((p, k) => p.classList.toggle('is-active', k === i));
    };
    const ir = (i) => { i = Math.max(0, Math.min(items.length - 1, i)); items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); marcar(i); };
    g.querySelector('[data-ova-galeria-prev]')?.addEventListener('click', () => ir(actual - 1));
    g.querySelector('[data-ova-galeria-next]')?.addEventListener('click', () => ir(actual + 1));
    // stopPropagation: el motor escucha ← → en document para cambiar de pantalla; dentro de la galería no debe hacerlo.
    g.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); ir(actual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); ir(actual - 1); }
    });
    items.forEach((it, i) => it.addEventListener('click', () => ir(i)));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > .6) marcar(items.indexOf(e.target)); }); }, { root: pista, threshold: [.6] });
      items.forEach(it => io.observe(it));
    }
    marcar(0);
  }
  const iniciar = () => {
    const todas = () => document.querySelectorAll('.ova-galeria').forEach(armar);
    todas();
    new MutationObserver(todas).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   SLIDE (.ova-carrusel--slide) · al cambiar el ancho
   El motor mueve la pista solo al hacer clic, con el ancho de ese momento.
   Una lámina por vista ocupa todo el ancho: si la ventana cambia, la pista
   vuelve a dejar a la vista la lámina del punto activo.
   ========================================================= */
(function () {
  'use strict';
  const reubicar = () => document.querySelectorAll('.ova-carrusel--slide').forEach(c => {
    const pista = c.querySelector('.ova-carrusel__track'), lamina = c.querySelector('.ova-carrusel__slide');
    if (!pista || !lamina) return;
    const i = Math.max(0, [...c.querySelectorAll('.ova-carrusel__dot')].findIndex(d => d.classList.contains('is-active')));
    pista.style.transform = 'translateX(' + (-i * (lamina.offsetWidth + 16)) + 'px)';
  });
  window.addEventListener('resize', reubicar);
})();

/* =========================================================
   SLIDER DE PASOS (.ova-tabs--pasos)
   El motor cambia de panel; aquí se marcan los pasos recorridos
   (.is-hecho), las flechas [data-ova-paso] avanzan o retroceden un
   paso y el pie cuenta «Paso N de M».
   ========================================================= */
(function () {
  'use strict';
  function armar(t) {
    if (t.dataset.ovaPasos) return;
    t.dataset.ovaPasos = '1';
    const btns = [...t.querySelectorAll('.ova-tabs__btn')];
    const flechas = t.querySelectorAll('[data-ova-paso]');
    const cuenta = t.querySelector('.ova-tabs__cuenta');
    const actual = () => btns.findIndex(b => b.classList.contains('is-active'));
    const pintar = () => {
      const i = actual();
      btns.forEach((b, k) => b.classList.toggle('is-hecho', k < i));
      flechas.forEach(f => { const d = +f.dataset.ovaPaso; f.disabled = (d < 0 && i === 0) || (d > 0 && i === btns.length - 1); });
      if (cuenta) cuenta.textContent = `Paso ${i + 1} de ${btns.length}`;
    };
    btns.forEach(b => b.addEventListener('click', () => setTimeout(pintar)));
    flechas.forEach(f => f.addEventListener('click', () => {
      btns[Math.max(0, Math.min(btns.length - 1, actual() + (+f.dataset.ovaPaso)))]?.click();
    }));
    pintar();
  }
  const iniciar = () => {
    const todos = () => document.querySelectorAll('.ova-tabs--pasos').forEach(armar);
    todos();
    new MutationObserver(todos).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   LÍNEA DE TIEMPO TIPO 3 (.ova-cronologia)
   Tocar una fecha la activa, llena la línea hasta ella y muestra su
   panel. Las flechas ← → pasan de fecha sin que el motor cambie de
   pantalla (captura en document). El eje recibe --ova-n (cuántas
   fechas) y --ova-activo (cuál).
   ========================================================= */
(function () {
  'use strict';
  const hitosDe = eje => [...eje.querySelectorAll('.ova-cronologia__hito')];
  function activar(hito) {
    const eje = hito.closest('.ova-cronologia__eje');
    const hitos = hitosDe(eje), k = hitos.indexOf(hito);
    hitos.forEach((h, i) => {
      h.classList.toggle('is-activo', i === k);
      h.classList.toggle('is-pasado', i < k);
      h.setAttribute('aria-pressed', String(i === k));
      const panel = document.getElementById(h.getAttribute('aria-controls'));
      if (panel) panel.hidden = i !== k;
    });
    eje.style.setProperty('--ova-activo', k);
  }
  const medir = () => document.querySelectorAll('.ova-cronologia__eje').forEach(eje => {
    const hitos = hitosDe(eje);
    eje.style.setProperty('--ova-n', hitos.length);
    eje.style.setProperty('--ova-activo', Math.max(0, hitos.findIndex(h => h.classList.contains('is-activo'))));
  });
  document.addEventListener('click', e => {
    const hito = e.target.closest('.ova-cronologia__hito');
    if (hito) activar(hito);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const hito = e.target.closest && e.target.closest('.ova-cronologia__hito');
    if (!hito) return;
    e.preventDefault();
    e.stopPropagation();
    const hitos = hitosDe(hito.parentElement);
    const sig = hitos[hitos.indexOf(hito) + (e.key === 'ArrowRight' ? 1 : -1)];
    if (sig) { sig.focus(); activar(sig); }
  }, true);
  const iniciar = () => {
    medir();
    new MutationObserver(medir).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   TARJETAS QUE GIRAN (.ova-giro): clic, toque o Enter/Espacio (es un
   <button>) voltea la tarjeta; aria-pressed dice en qué cara está.
   Delegado en document: sirve también en la SPA.
   ========================================================= */
(function () {
  'use strict';
  document.addEventListener('click', e => {
    const t = e.target.closest('.ova-giro');
    if (!t) return;
    const girada = t.classList.toggle('is-girada');
    t.setAttribute('aria-pressed', String(girada));
  });
})();

/* =========================================================
   PUNTOS INTERACTIVOS SOBRE UNA FIGURA (.ova-hotspots--figura)
   El motor abre el globo de un punto siempre hacia abajo, centrado en el
   punto: cerca de un borde quedaba cortado. Al abrirlo se mide: si no cabe
   abajo y sí arriba, se abre hacia arriba (.is-arriba), y si se sale por un
   costado de la imagen, de la ventana o de la caja que la recorta (la figura
   que se desliza en celular), se corre lo justo (--ova-globo-dx). Se abre al
   pasar el puntero o al tocar el punto; un toque fuera lo cierra.
   ========================================================= */
(() => {
  'use strict';
  const PUNTO = '.ova-hotspots--figura .ova-hotspot';
  const MARGEN = 8;   // aire mínimo hasta el borde de la imagen, de la caja o de la ventana

  // El primer ancestro que recorta en horizontal: lo que quede fuera de él no se ve.
  function recortador(el) {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).overflowX !== 'visible') return a.getBoundingClientRect();
    }
    return null;
  }

  function abrir(punto) {
    const globo = punto.querySelector('.ova-hotspot__tooltip');
    if (!globo) return;
    punto.classList.add('is-open');
    punto.classList.remove('is-arriba');
    punto.style.removeProperty('--ova-globo-dx');
    const caja = (punto.closest('.ova-hotspots__img') || punto.parentElement).getBoundingClientRect();
    const p = punto.getBoundingClientRect();
    const g = globo.getBoundingClientRect();
    const alto = g.height + 14;
    if (p.bottom + alto > caja.bottom && p.top - alto >= caja.top) punto.classList.add('is-arriba');
    const corte = recortador(punto);
    const izq = Math.max(caja.left, corte ? corte.left : 0, 0) + MARGEN;
    const der = Math.min(caja.right, corte ? corte.right : Infinity, document.documentElement.clientWidth) - MARGEN;
    let dx = 0;
    if (g.width <= der - izq) {
      if (g.left < izq) dx = izq - g.left;
      else if (g.right > der) dx = der - g.right;
    }
    if (dx) punto.style.setProperty('--ova-globo-dx', `${Math.round(dx)}px`);
  }
  function cerrar(punto) {
    punto.classList.remove('is-open', 'is-arriba');
    punto.style.removeProperty('--ova-globo-dx');
  }

  document.addEventListener('pointerover', e => {
    const punto = e.target.closest && e.target.closest(PUNTO);
    if (punto && !punto.contains(e.relatedTarget)) abrir(punto);
  });
  document.addEventListener('pointerout', e => {
    const punto = e.target.closest && e.target.closest(PUNTO);
    if (punto && e.pointerType === 'mouse' && !punto.contains(e.relatedTarget)) cerrar(punto);
  });
  document.addEventListener('click', e => {
    const punto = e.target.closest && e.target.closest(PUNTO);
    document.querySelectorAll(PUNTO + '.is-open').forEach(otro => { if (otro !== punto) cerrar(otro); });
    if (punto) abrir(punto);
  });
})();

/* =========================================================
   RETÍCULA DE LA TARJETA CON CIFRA (.ova-cifra__reticula)
   data-ova-puntos="60" arma los 100 puntos y enciende los 60 primeros;
   cada uno lleva su orden (--i) para encenderse uno tras otro.
   Es decoración (aria-hidden): el dato está en el texto.
   ========================================================= */
(function () {
  'use strict';
  function armar(r) {
    if (r.children.length) return;
    const n = Math.max(0, Math.min(100, parseInt(r.dataset.ovaPuntos, 10) || 0));
    let html = '';
    for (let i = 0; i < 100; i++) html += `<span class="ova-cifra__punto${i < n ? ' ova-cifra__punto--lleno' : ''}" style="--i:${i};"></span>`;
    r.innerHTML = html;
  }
  const iniciar = () => {
    const todas = () => document.querySelectorAll('.ova-cifra__reticula[data-ova-puntos]').forEach(armar);
    todas();
    new MutationObserver(todas).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   CIFRA QUE SUBE (data-ova-contar): el número sube de 0 a su valor la
   primera vez que entra en pantalla. Acepta enteros y decimales en
   formato español («47», «10.519», «51,7»); al terminar, el texto vuelve
   a ser el original. Con «reducir movimiento» no se anima.
   ========================================================= */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const NUM = /^(\d{1,3}(?:\.\d{3})*|\d+)(,\d+)?$/;
  const vistos = new WeakSet();
  function contar(el) {
    const original = el.textContent;
    const m = original.trim().match(NUM);
    if (!m) return;
    const decimales = m[2] ? m[2].length - 1 : 0;
    const fin = parseFloat(m[1].replace(/\./g, '') + (m[2] ? '.' + m[2].slice(1) : ''));
    const miles = m[1].includes('.');
    const fmt = v => {
      let [e, d] = v.toFixed(decimales).split('.');
      if (miles) e = e.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return e + (d ? ',' + d : '');
    };
    const dur = 1400, t0 = performance.now();
    const paso = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = p < 1 ? fmt(fin * (1 - Math.pow(1 - p, 3))) : original;
      if (p < 1) requestAnimationFrame(paso);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(paso);
  }
  // La cuenta espera a que la sección termine de aparecer (el motor la funde con data-reveal);
  // si arrancara al entrar en pantalla, al recargar ya iría casi al final cuando la cifra se ve.
  function cuandoSeVea(el, fn) {
    const r = el.closest('[data-reveal]');
    if (!r) return fn();
    const tras = () => parseFloat(getComputedStyle(r).opacity) >= .99 ? fn() : setTimeout(fn, 850);
    if (r.classList.contains('is-visible')) return tras();
    const mo = new MutationObserver(() => {
      if (!r.classList.contains('is-visible')) return;
      mo.disconnect();
      tras();
    });
    mo.observe(r, { attributes: true, attributeFilter: ['class'] });
  }
  const io = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, original = el.textContent;
    if (!original.trim().match(NUM)) return;
    el.textContent = '0';
    cuandoSeVea(el, () => { el.textContent = original; contar(el); });
  }), { threshold: 0.6 });
  const vigilar = () => document.querySelectorAll('[data-ova-contar]').forEach(el => {
    if (vistos.has(el)) return;
    vistos.add(el);
    io.observe(el);
  });
  const iniciar = () => {
    vigilar();
    new MutationObserver(vigilar).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   ILUSTRACIÓN AMPLIABLE EN EL CELULAR (.ova-ilustracion, 2026-10-25)
   En pantallas de hasta 720 px los rótulos de una ilustración quedan ilegibles: el SVG escala
   con el ancho. Cada ilustración lleva una lupa (oculta en escritorio por catalogo.css); al
   tocarla, o al tocar la imagen, se abre la ventana del motor (.ova-modal, con su foco, Esc y
   cerrar) con la ilustración a 1000 px, centrada, que se recorre con el dedo.
   ========================================================= */
(() => {
  'use strict';

  const MOVIL = window.matchMedia('(max-width: 720px)');
  const ID = 'ova-ampliada';
  let lienzo = null;

  function ventana() {
    if (lienzo) return lienzo;
    const modal = document.createElement('div');
    modal.className = 'ova-modal ova-ampliada';
    modal.id = ID;
    modal.innerHTML =
      '<div class="ova-modal__dialog" aria-label="Ilustración ampliada">' +
        '<div class="ova-modal__head"><span></span>' +
          '<button class="ova-modal__close" data-ova-modal-close aria-label="Cerrar">' +
          '<iconify-icon icon="mdi:close"></iconify-icon></button></div>' +
        '<div class="ova-modal__body"><div class="ova-ampliada__lienzo"></div></div>' +
      '</div>';
    document.body.appendChild(modal);
    lienzo = modal.querySelector('.ova-ampliada__lienzo');
    return lienzo;
  }

  const vistas = new WeakSet();
  function preparar() {
    document.querySelectorAll('.ova-ilustracion').forEach(fig => {
      if (vistas.has(fig) || fig.closest('.ova-modal')) return;
      const img = fig.querySelector('img');
      if (!img) return;
      vistas.add(fig);
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'ova-ampliar';
      boton.dataset.ovaModalOpen = ID;
      boton.setAttribute('aria-label', 'Ampliar la ilustración');
      boton.innerHTML = '<iconify-icon icon="mdi:magnify-plus-outline"></iconify-icon>';
      // Llena la ventana antes de que el motor la abra (el clic sube después hasta document)
      boton.addEventListener('click', () => {
        const copia = img.cloneNode();
        copia.removeAttribute('loading');
        const l = ventana();
        l.replaceChildren(copia);
        const centrar = () => { l.scrollLeft = (l.scrollWidth - l.clientWidth) / 2; };
        requestAnimationFrame(() => requestAnimationFrame(centrar));
        copia.addEventListener('load', centrar, { once: true });
      });
      img.addEventListener('click', () => { if (MOVIL.matches) boton.click(); });
      fig.appendChild(boton);
    });
  }

  const iniciar = () => {
    ventana();
    preparar();
    new MutationObserver(preparar).observe(document.body, { childList: true, subtree: true });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();

/* =========================================================
   COPIAR CÓDIGO ([data-ova-copiar])
   En la ventana «Ver código» de la plantilla-base, copia el bloque de
   código de su misma ventana y confirma en el botón por un momento.
   ========================================================= */
(() => {
  'use strict';
  const copiar = texto => (navigator.clipboard && window.isSecureContext
    ? navigator.clipboard.writeText(texto)
    : new Promise((ok, falla) => {
      const area = Object.assign(document.createElement('textarea'), { value: texto });
      area.setAttribute('readonly', '');
      Object.assign(area.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(area);
      area.select();
      const hecho = document.execCommand('copy');
      area.remove();
      hecho ? ok() : falla();
    }));

  document.addEventListener('click', e => {
    const boton = e.target.closest('[data-ova-copiar]');
    if (!boton) return;
    const codigo = boton.closest('.ova-modal')?.querySelector('pre code');
    if (!codigo) return;
    const original = boton.innerHTML;
    copiar(codigo.textContent).then(
      () => { boton.innerHTML = '<iconify-icon icon="mdi:check"></iconify-icon> Copiado'; },
      () => { boton.textContent = 'No se pudo copiar'; });
    clearTimeout(boton._ovaCopiado);
    boton._ovaCopiado = setTimeout(() => { boton.innerHTML = original; }, 1800);
  });
})();
