/* =========================================================
   CORE · Lógica universal del template
   ---------------------------------------------------------
   ⛔ NO EDITAR · este archivo es universal para todos los cursos.
   Renderiza sidebar, breadcrumb, screen-nav y maneja todas
   las interacciones de los componentes UI.
   ========================================================= */

(function () {
  'use strict';

  const C = window.OVA_COURSE || { menu: [] };
  // 'hibrida' se conserva como id interno (data-version="hibrida") por compat
  // con el HTML existente, pero se muestra al usuario como "Oscura".
  const VERSIONS = ['hibrida', 'clara'];
  const VERSION_LABELS = { hibrida: 'Oscura', clara: 'Clara' };
  const VERSION_ICONS  = { hibrida: 'mdi:weather-night', clara: 'mdi:white-balance-sunny' };

  /* Anclar a una sección con reintentos: las imágenes sin altura reservada
     desplazan el layout al cargar, y un solo scroll queda corto. */
  function anclarA(ancla, scope) {
    const destino = (scope || document).querySelector('#' + CSS.escape(ancla));
    if (!destino) return;
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    destino.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
    // El documento sigue creciendo mientras cargan imágenes e iconos, y el
    // ancla se corre. Se re-ancla en cada cambio de tamaño hasta que el
    // usuario tome el control (o pasen 5 s).
    const fin = () => {
      ro.disconnect();
      ['wheel', 'touchstart', 'keydown'].forEach(ev => removeEventListener(ev, fin));
    };
    const ro = new ResizeObserver(() => {
      if (!destino.isConnected) { fin(); return; }
      destino.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    ro.observe(document.body);
    ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, fin, { passive: true }));
    setTimeout(fin, 5000);
  }

  /* Modo SPA: el compilado single-page marca su contenedor con data-ova-vista.
     En SPA los enlaces internos son rutas #/<id>; en multipagina, archivos .html */
  const esSPA = () => !!document.querySelector('[data-ova-vista]');
  const hrefDe = (m) => esSPA() ? '#/' + m.id : m.file;
  let reaplicarColapso = null;
  const cifraProgreso = (plantilla, n, total) => String(plantilla).replace(/\{n\}/g, n).replace(/\{total\}/g, total);

  /* ============================================
     RENDER · sidebar
     ============================================ */
  function renderSidebar(actual) {
    const el = document.querySelector('[data-ova-sidebar]');
    if (!el) return;
    const currentId = actual || el.dataset.current;
    const idx = C.menu.findIndex(m => m.id === currentId);
    const total = C.menu.length;
    const completed = Math.max(0, idx);
    const progress = ((completed + 1) / total) * 100;
    // Texto de progreso (KIT-009): la institución lo define en `textos.progreso` de la configuración;
    // sin esa clave, «Progreso» y «N/total». La compacta y data-progress siempre van con «N/total».
    const textoProgreso = Object.assign({ etiqueta: 'Progreso', cifra: '{n}/{total}' }, (C.textos || {}).progreso);

    el.innerHTML = `
      <div class="ova-sidebar__compacta" aria-hidden="true">
        ${C.course.code ? `<span class="tag">${C.course.code}</span>` : ''}
        <strong>${completed + 1}/${total}</strong>
        <div class="bar"><div class="bar-fill" style="width:${progress}%"></div></div>
      </div>
      <div class="ova-sidebar__brand">
        <img class="ova-brand-logo ova-brand-logo--desktop" src="${C.brand.logo}" alt="${C.brand.name || 'OVA'}" />
        ${C.brand.logoMobile ? `<img class="ova-brand-logo ova-brand-logo--mobile" src="${C.brand.logoMobile}" alt="${C.brand.name || 'OVA'}" />` : ''}
        ${C.brand.name || C.brand.sub ? `
          <div>
            ${C.brand.name ? `<strong>${C.brand.name}</strong>` : ''}
            ${C.brand.sub  ? `<small>${C.brand.sub}</small>`   : ''}
          </div>
        ` : ''}
      </div>
      <div class="ova-sidebar__course">
        ${C.course.code     ? `<span class="ova-sidebar__course-tag">${C.course.code}</span>` : ''}
        <h3>${C.course.name}</h3>
        ${C.course.subtitle ? `<p>${C.course.subtitle}</p>` : ''}
      </div>
      <nav class="ova-sidebar__menu">
        ${(() => {
          let html = '', zonaAbierta = null;
          C.menu.forEach((m, i) => {
            const state = i < idx ? 'is-done' : (i === idx ? 'is-active' : '');
            // Las secciones estructurales del final viven en su propio panel
            if (zonaAbierta && m.zona !== zonaAbierta) { html += '</div>'; zonaAbierta = null; }
            if (m.zona && m.zona !== zonaAbierta) {
              html += '<div class="ova-sidebar__zona">';
              zonaAbierta = m.zona;
            }
            // Cabecera de grupo: un ítem CLICABLE que lleva a su primera pantalla
            const grupoPrevio = i > 0 ? C.menu[i - 1].grupo : null;
            if (m.grupo && m.grupo !== grupoPrevio) {
              const grupoActivo = C.menu[idx] && C.menu[idx].grupo === m.grupo ? 'is-padre-activo' : '';
              html += `
            <a href="${hrefDe(m)}" class="ova-sidebar__menu-item ${grupoActivo}" data-nivel="1" data-tipo="padre">
              <span class="num num--icono">${m.grupoIcon ? `<iconify-icon icon="${m.grupoIcon}"></iconify-icon>` : ''}</span>
              <span class="title">${m.grupo}</span>
            </a>`;
            }
            // Marca: número si es contenido temático, icono si es sección estructural
            const marca = m.num
              ? `<span class="num">${m.rotulo || m.num}</span>`
              : (m.icon ? `<span class="num num--icono"><iconify-icon icon="${m.icon}"></iconify-icon></span>` : `<span class="num num--vacio"></span>`);
            const nivel = m.tipo === 'subtema' || m.grupo ? 2 : 1;
            html += `
            <a href="${hrefDe(m)}" class="ova-sidebar__menu-item ${state}" data-title="${m.titulo}" data-id="${m.id}" data-nivel="${nivel}" data-tipo="${m.tipo || (m.grupo ? 'grupo' : '')}" aria-current="${i === idx ? 'page' : 'false'}">
              ${marca}
              <span class="title">${m.titulo}</span>
            </a>`;
            // Secciones internas ancladas: abren la página del padre y bajan a la sección
            (m.secciones || []).forEach(sec => {
              if (!sec.ancla) return;
              const hrefSec = esSPA() ? `#/${m.id}/${sec.ancla}` : `${m.file}#${sec.ancla}`;
              html += `
            <a href="${hrefSec}" class="ova-sidebar__menu-item" data-nivel="2" data-tipo="seccion">
              ${sec.num ? `<span class="num num--sub">${sec.num}</span>` : ''}<span class="title">${sec.titulo}</span>
            </a>`;
            });
          });
          if (zonaAbierta) html += '</div>';
          return html;
        })()}
      </nav>
      <div class="ova-sidebar__progress" data-progress="${completed + 1}/${total}">
        <div class="label">
          <span>${textoProgreso.etiqueta}</span>
          <strong>${cifraProgreso(textoProgreso.cifra, completed + 1, total)}</strong>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${progress}%"></div></div>
      </div>
    `;

    // El panel entero hace scroll: la barra compacta entra cuando el título grande sale de la vista
    if (!el.dataset.ovaScrollBound) {
      el.dataset.ovaScrollBound = '1';
      el.addEventListener('scroll', () => {
        const curso = el.querySelector('.ova-sidebar__course');
        const limite = curso ? curso.offsetTop + curso.offsetHeight : 120;
        el.classList.toggle('is-scrolled', el.scrollTop > limite - 8);
      }, { passive: true });
    }
    // Abre en la sección actual: si el ítem activo quedó fuera de la vista, se trae
    requestAnimationFrame(() => {
      const act = el.querySelector('.ova-sidebar__menu-item.is-active');
      if (!act) return;
      const alto = el.clientHeight;
      // posición del ítem dentro del panel (offsetTop se mediría contra el <nav>)
      const top = act.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      const bottom = top + act.offsetHeight;
      if (top < el.scrollTop + 56 || bottom > el.scrollTop + alto) {
        el.scrollTop = Math.max(0, top - Math.round(alto / 2));
        el.dispatchEvent(new Event('scroll'));
      }
    });
  }

  /* ============================================
     TOGGLE · colapsar/expandir sidebar
     Persistencia en localStorage
     ============================================ */
  function setupSidebarToggle(){
    // Lectura inicial de la preferencia guardada · no la aplicamos todavía
    const saved = localStorage.getItem('ova-sidebar-collapsed');

    // Solo inyectar si hay sidebar en la página (no en archivos del template)
    if (!document.querySelector('[data-ova-sidebar]')) return;
    if (document.querySelector('[data-ova-sidebar-toggle]')) return; // ya existe

    // Inyectar el botón flotante al body (afuera del sidebar para que position:fixed funcione)
    const btn = document.createElement('button');
    btn.className = 'ova-sidebar__toggle';
    btn.setAttribute('data-ova-sidebar-toggle', '');
    btn.title = saved === 'true' ? 'Expandir menú' : 'Colapsar menú';
    btn.innerHTML = '<iconify-icon icon="mdi:chevron-left" style="transition:transform .25s ease;"></iconify-icon>';
    // Fallback inline para garantizar visibilidad incluso si el CSS está cacheado viejo
    btn.style.cssText = `
      position: fixed; top: 24px;
      left: calc(var(--sidebar-w, 300px) - 16px);
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--bg-surface, #fff);
      border: 1px solid var(--border-c, #e5e7eb);
      color: var(--text-pri, #3a4255);
      display: grid; place-items: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      transition: left .25s ease, background .2s ease, transform .2s ease;
    `;
    document.body.appendChild(btn);
    // toggle del sidebar inyectado

    // Helper · aplica los estilos inline para garantizar funcionamiento aunque el CSS esté cacheado
    function applyCollapsedState(collapsed){
      const app = document.querySelector('.ova-app');
      const sidebar = document.querySelector('.ova-sidebar');
      const ico = btn.querySelector('iconify-icon');
      if (collapsed) {
        if (app) app.style.gridTemplateColumns = '72px 1fr';
        btn.style.left = 'calc(72px - 16px)';
        if (ico) ico.style.transform = 'rotate(180deg)';
        // Ocultar elementos textuales
        document.querySelectorAll(
          '.ova-sidebar__course, .ova-sidebar__brand > div, ' +
          '.ova-sidebar__menu-item .num, .ova-sidebar__menu-item .title, ' +
          '.ova-sidebar__progress .label, .ova-sidebar__progress .bar'
        ).forEach(el => { el.style.display = 'none'; });
        // Centrar iconos del menú
        document.querySelectorAll('.ova-sidebar__menu-item').forEach(el => {
          el.style.gridTemplateColumns = '1fr';
          el.style.justifyItems = 'center';
          el.style.padding = '10px 0';
        });
        document.querySelectorAll('.ova-sidebar__brand').forEach(el => {
          el.style.justifyContent = 'center';
          el.style.padding = '16px 8px';
        });
      } else {
        if (app) app.style.gridTemplateColumns = '';
        btn.style.left = 'calc(var(--sidebar-w, 300px) - 16px)';
        if (ico) ico.style.transform = 'rotate(0deg)';
        document.querySelectorAll(
          '.ova-sidebar__course, .ova-sidebar__brand > div, ' +
          '.ova-sidebar__menu-item .num, .ova-sidebar__menu-item .title, ' +
          '.ova-sidebar__progress .label, .ova-sidebar__progress .bar'
        ).forEach(el => { el.style.display = ''; });
        document.querySelectorAll('.ova-sidebar__menu-item').forEach(el => {
          el.style.gridTemplateColumns = '';
          el.style.justifyItems = '';
          el.style.padding = '';
        });
        document.querySelectorAll('.ova-sidebar__brand').forEach(el => {
          el.style.justifyContent = '';
          el.style.padding = '';
        });
      }
    }

    // Detectar viewport mobile · el toggle NO debe aplicar ahí (entra el burger overlay)
    const mqMobile = window.matchMedia('(max-width: 1024px)');
    const html = document.documentElement;

    function syncWithViewport(){
      if (mqMobile.matches) {
        // ===== MOBILE =====
        // 1) Ocultar el toggle
        btn.style.display = 'none';
        // 2) QUITAR el atributo del <html> · sin tocar localStorage (preferencia persiste)
        html.removeAttribute('data-sidebar-collapsed');
        // 3) Limpiar todos los inline styles
        applyCollapsedState(false);
      } else {
        // ===== DESKTOP =====
        // 1) Mostrar el toggle
        btn.style.display = '';
        // 2) Restaurar el estado guardado en localStorage
        if (saved === 'true') {
          html.setAttribute('data-sidebar-collapsed', 'true');
          applyCollapsedState(true);
          btn.title = 'Expandir menú';
        } else {
          html.removeAttribute('data-sidebar-collapsed');
          applyCollapsedState(false);
          btn.title = 'Colapsar menú';
        }
      }
    }

    syncWithViewport();

    // Re-sincronizar cuando cambia el viewport
    mqMobile.addEventListener('change', syncWithViewport);

    // SPA: re-aplicar el estado colapsado tras re-renderizar el sidebar
    reaplicarColapso = () => {
      if (!mqMobile.matches && document.documentElement.getAttribute('data-sidebar-collapsed') === 'true') applyCollapsedState(true);
    };

    // Listener del click · solo funciona en desktop
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (mqMobile.matches) return; // ignorar en mobile
      const html = document.documentElement;
      const isCollapsed = html.getAttribute('data-sidebar-collapsed') === 'true';
      if (isCollapsed) {
        html.removeAttribute('data-sidebar-collapsed');
        localStorage.setItem('ova-sidebar-collapsed', 'false');
        btn.title = 'Colapsar menú';
        applyCollapsedState(false);
      } else {
        html.setAttribute('data-sidebar-collapsed', 'true');
        localStorage.setItem('ova-sidebar-collapsed', 'true');
        btn.title = 'Expandir menú';
        applyCollapsedState(true);
      }
    });
  }

  /* ============================================
     RENDER · breadcrumb topbar
     ============================================ */
  function renderBreadcrumb(root = document) {
    const el = root.querySelector('[data-ova-breadcrumb]');
    if (!el) return;
    const currentId = el.dataset.current;
    const idx = C.menu.findIndex(m => m.id === currentId);
    if (idx < 0) return;
    const m = C.menu[idx];
    el.innerHTML = `
      <span class="step">${String(idx + 1).padStart(2, '0')} / ${C.menu.length.toString().padStart(2, '0')}</span>
      <span>${C.course.name}</span>
      <span class="sep">›</span>
      <strong>${m.titulo}</strong>
    `;
  }

  /* ============================================
     RENDER · prev/next nav
     ============================================ */
  function renderScreenNav(root = document) {
    const el = root.querySelector('[data-ova-screen-nav]');
    if (!el) return;
    const currentId = el.dataset.current;
    const idx = C.menu.findIndex(m => m.id === currentId);
    const prev = idx > 0 ? C.menu[idx - 1] : null;
    const next = idx >= 0 && idx < C.menu.length - 1 ? C.menu[idx + 1] : null;
    el.innerHTML = `
      ${prev ? `
        <a href="${hrefDe(prev)}" class="ova-screen-nav__btn ova-screen-nav__btn--prev">
          <span class="ico"><iconify-icon icon="mdi:arrow-left"></iconify-icon></span>
          <span><small>Anterior</small><strong>${prev.titulo}</strong></span>
        </a>
      ` : `<span></span>`}
      ${next ? `
        <a href="${hrefDe(next)}" class="ova-screen-nav__btn ova-screen-nav__btn--next">
          <span><small>Siguiente</small><strong>${next.titulo}</strong></span>
          <span class="ico"><iconify-icon icon="mdi:arrow-right"></iconify-icon></span>
        </a>
      ` : `<span></span>`}
    `;
  }

  /* ============================================
     RENDER · botón "Siguiente" del topbar
     Calcula automáticamente la próxima pantalla en la secuencia
     ============================================ */
  function renderNextIconBtn(root = document) {
    root.querySelectorAll('[data-ova-next-iconbtn]').forEach(btn => {
      // Obtener pantalla actual desde el breadcrumb (o el sidebar en multipagina)
      const host = root.querySelector('[data-ova-breadcrumb][data-current]')
                || document.querySelector('[data-ova-sidebar][data-current]');
      if (!host) return;
      const currentId = host.dataset.current;
      const idx = C.menu.findIndex(m => m.id === currentId);
      if (idx < 0) return;
      const next = idx < C.menu.length - 1 ? C.menu[idx + 1] : null;
      if (next) {
        btn.href = hrefDe(next);
        btn.title = `Siguiente: ${next.titulo}`;
      } else {
        // Última pantalla · llevar al inicio
        btn.href = hrefDe(C.menu[0]);
        btn.title = 'Volver al inicio';
        btn.querySelector('iconify-icon')?.setAttribute('icon', 'mdi:restart');
      }
    });
  }

  /* ============================================
     VERSIÓN del template (hibrida/clara/oscura)
     ============================================ */
  function setVersion(v) {
    if (!VERSIONS.includes(v)) v = 'hibrida';
    document.documentElement.setAttribute('data-version', v);
    localStorage.setItem('ova-version', v);
    document.querySelectorAll('[data-ova-version-btn]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.ovaVersionBtn === v);
    });
  }
  function renderVersionSwitch(root = document) {
    root.querySelectorAll('[data-ova-version-switch]').forEach(host => {
      host.innerHTML = `
        <span class="ova-version-switch__label">
          <iconify-icon icon="mdi:palette-outline"></iconify-icon>
          Tema
        </span>
        <div class="ova-version-switch__pills">
          ${VERSIONS.map(v => `
            <button data-ova-version-btn="${v}" title="Versión ${VERSION_LABELS[v]}">
              <iconify-icon icon="${VERSION_ICONS[v]}"></iconify-icon>
              <span>${VERSION_LABELS[v]}</span>
            </button>
          `).join('')}
        </div>
      `;
    });
    // sincronizar el pill activo con el tema vigente
    const saved = localStorage.getItem('ova-version') || 'hibrida';
    root.querySelectorAll('[data-ova-version-btn]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.ovaVersionBtn === saved);
    });
  }
  function setupVersionGlobal() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-ova-version-btn]');
      if (btn) setVersion(btn.dataset.ovaVersionBtn);
    });
    setVersion(localStorage.getItem('ova-version') || 'hibrida');
  }

  /* ============================================
     COMPONENTES INTERACTIVOS
     ============================================ */

  // Acordeón
  function setupAcordeon(root = document) {
    root.querySelectorAll('.ova-acordeon').forEach(group => {
      group.querySelectorAll('.ova-acordeon__head').forEach(head => {
        head.addEventListener('click', () => {
          const item = head.parentElement;
          const isOpen = item.classList.contains('is-open');
          group.querySelectorAll('.ova-acordeon__item').forEach(i => i.classList.remove('is-open'));
          if (!isOpen) item.classList.add('is-open');
        });
      });
    });
  }

  // Tabs
  function setupTabs(root = document) {
    root.querySelectorAll('.ova-tabs').forEach(tabs => {
      const btns = tabs.querySelectorAll('.ova-tabs__btn');
      const panels = tabs.querySelectorAll('.ova-tabs__panel');
      const nav = tabs.querySelector('.ova-tabs__nav');
      btns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('is-active'));
          panels.forEach(p => p.classList.remove('is-active'));
          btn.classList.add('is-active');
          panels[i]?.classList.add('is-active');
          // Fila que se desliza (no caben los botones): trae entero el botón
          // elegido, sin mover la página en vertical.
          if (nav && nav.scrollWidth > nav.clientWidth) {
            const n = nav.getBoundingClientRect(), b = btn.getBoundingClientRect();
            const dx = b.left < n.left ? b.left - n.left - 6 : b.right > n.right ? b.right - n.right + 6 : 0;
            if (dx) nav.scrollBy({ left: dx, behavior: suave() });
          }
        });
      });
      if (nav) arrastrable(nav);
    });
  }

  // Quiz
  function setupQuiz(root = document) {
    root.querySelectorAll('.ova-quiz').forEach(quiz => {
      const opts = quiz.querySelectorAll('.ova-quiz__opt');
      const feedback = quiz.querySelector('.ova-quiz__feedback');
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          if (quiz.dataset.answered === 'true') return;
          quiz.dataset.answered = 'true';
          const isCorrect = opt.dataset.correct === 'true';
          quiz.dispatchEvent(new CustomEvent('ova:quiz-respuesta', { bubbles: true, detail: { correcta: isCorrect } }));
          opt.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
          if (!isCorrect) quiz.querySelector('[data-correct="true"]')?.classList.add('is-correct');
          if (feedback) {
            feedback.classList.add('is-visible');
            feedback.classList.toggle('is-wrong', !isCorrect);
            feedback.innerHTML = isCorrect
              ? (feedback.dataset.correct || '¡Correcto!')
              : (feedback.dataset.wrong || 'Revisa el contenido.');
          }
        });
      });
    });
  }

  // Checklist
  function setupChecklist(root = document) {
    root.querySelectorAll('.ova-checklist').forEach(list => {
      const items = list.querySelectorAll('.ova-checklist__item');
      const count = list.querySelector('.ova-checklist__count strong');
      items.forEach(item => {
        item.addEventListener('click', () => {
          item.classList.toggle('is-done');
          const done = list.querySelectorAll('.is-done').length;
          if (count) count.textContent = done;
        });
      });
    });
  }

  // Carrusel
  // Slides por vista: 3 desde 900 px, 2 desde 600 y 1 debajo. Un carrusel puede bajar ese número
  // con data-ova-visibles (el Slide muestra uno por vista: data-ova-visibles="1"); nunca lo sube.
  function carruselVisibles(declarados, ancho) {
    const porAncho = ancho < 600 ? 1 : ancho < 900 ? 2 : 3;
    const n = parseInt(declarados, 10);
    return n > 0 ? Math.min(n, porAncho) : porAncho;
  }
  function setupCarrusel(root = document) {
    root.querySelectorAll('.ova-carrusel').forEach(carr => {
      const track = carr.querySelector('.ova-carrusel__track');
      const slides = carr.querySelectorAll('.ova-carrusel__slide');
      const dotsHost = carr.querySelector('.ova-carrusel__dots');
      const prev = carr.querySelector('[data-ova-carrusel-prev]');
      const next = carr.querySelector('[data-ova-carrusel-next]');
      if (!track || !slides.length) return;
      let idx = 0;
      const visible = () => carruselVisibles(carr.dataset.ovaVisibles, window.innerWidth);
      const max = () => Math.max(0, slides.length - visible());
      const go = (i) => {
        idx = Math.max(0, Math.min(max(), i));
        const slideW = slides[0].offsetWidth + 16;
        track.style.transform = `translateX(${-idx * slideW}px)`;
        dotsHost?.querySelectorAll('.ova-carrusel__dot').forEach((d, k) => d.classList.toggle('is-active', k === idx));
      };
      if (dotsHost) {
        dotsHost.innerHTML = Array.from({ length: max() + 1 }, (_, i) =>
          `<button class="ova-carrusel__dot ${i === 0 ? 'is-active' : ''}" data-i="${i}"></button>`
        ).join('');
        dotsHost.addEventListener('click', e => {
          const d = e.target.closest('.ova-carrusel__dot');
          if (d) go(parseInt(d.dataset.i));
        });
      }
      prev?.addEventListener('click', () => go(idx - 1));
      next?.addEventListener('click', () => go(idx + 1));
    });
  }

  function suave() {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
  // Arrastrar con el mouse la fila de pestañas cuando no caben. El desplazamiento
  // nativo responde al dedo, al trackpad, a Shift + rueda y al teclado, pero no a
  // arrastrar con el mouse, que es lo primero que se intenta en un computador. Un
  // arrastre de menos de 6 px sigue siendo un clic; uno más largo no activa la
  // pestaña sobre la que se suelta.
  function arrastrable(el) {
    let id = null, x0 = 0, s0 = 0, movido = false;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth + 2) return;
      id = e.pointerId; x0 = e.clientX; s0 = el.scrollLeft; movido = false;
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - x0;
      if (!movido) {
        if (Math.abs(dx) < 6) return;
        movido = true;
        el.setPointerCapture(id);
        el.classList.add('is-arrastrando');
      }
      el.scrollLeft = s0 - dx;
      window.getSelection()?.removeAllRanges();
    });
    const soltar = e => {
      if (e.pointerId !== id) return;
      id = null;
      if (!movido) return;
      el.classList.remove('is-arrastrando');
      const tragar = ev => { ev.preventDefault(); ev.stopPropagation(); };
      el.addEventListener('click', tragar, { capture: true, once: true });
      setTimeout(() => el.removeEventListener('click', tragar, { capture: true }), 0);
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('dragstart', e => { if (id !== null) e.preventDefault(); });
  }

  // Clasificar. Arrastre, o tocar el elemento y después la categoría (también Enter o Espacio,
  // sobre botones): WCAG 2.2 AA 2.5.7 y 2.1.1 (KIT-007, D9). El marcado viejo (elementos en
  // <div>, categorías sin botón) se completa aquí para que el teclado lo alcance.
  function setupDnD(root = document) {
    root.querySelectorAll('.ova-dnd').forEach(dnd => {
      let dragged = null, elegido = null;
      const elegir = item => {
        if (elegido) elegido.classList.remove('is-selected'), elegido.setAttribute('aria-pressed', 'false');
        elegido = item === elegido ? null : item;
        if (elegido) elegido.classList.add('is-selected'), elegido.setAttribute('aria-pressed', 'true');
      };
      const poner = (item, zone) => {
        item.classList.remove('is-correct', 'is-wrong', 'is-selected');
        item.setAttribute('aria-pressed', 'false');
        item.classList.add(item.dataset.ovaCorrect === zone.dataset.ovaTarget ? 'is-correct' : 'is-wrong');
        zone.querySelector('.ova-dnd__items')?.appendChild(item);
      };
      dnd.querySelectorAll('.ova-dnd__item').forEach(item => {
        if (item.tagName !== 'BUTTON') {
          item.setAttribute('role', 'button');
          item.tabIndex = 0;
          item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
        }
        item.setAttribute('aria-pressed', 'false');
        item.draggable = true;
        item.addEventListener('click', () => elegir(item));
        item.addEventListener('dragstart', () => { dragged = item; item.classList.add('is-dragging'); });
        item.addEventListener('dragend', () => { item.classList.remove('is-dragging'); dragged = null; });
      });
      dnd.querySelectorAll('.ova-dnd__zone').forEach(zone => {
        const h = zone.querySelector('h4');
        if (h && !h.querySelector('button')) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ova-dnd__target';
          while (h.firstChild) b.appendChild(h.firstChild);
          h.appendChild(b);
        }
        zone.addEventListener('click', e => {
          if (!elegido || e.target.closest('.ova-dnd__item')) return;
          const item = elegido; elegido = null;
          poner(item, zone);
        });
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('is-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
        zone.addEventListener('drop', e => {
          e.preventDefault();
          zone.classList.remove('is-over');
          if (!dragged) return;
          if (dragged === elegido) elegido = null;
          poner(dragged, zone);
        });
      });
    });
  }

  // Ordenar. Arrastre, o los botones ↑/↓ de cada elemento (toque y teclado); la nueva posición
  // se anuncia a quien usa lector de pantalla (KIT-007, D8).
  function setupOrden(root = document) {
    root.querySelectorAll('.ova-orden').forEach(list => {
      let dragged = null;
      const aviso = document.createElement('p');
      aviso.className = 'ova-sr';
      aviso.setAttribute('aria-live', 'polite');
      list.after(aviso);
      const mover = (item, paso, boton) => {
        const hermano = paso < 0 ? item.previousElementSibling : item.nextElementSibling;
        if (!hermano) return;
        list.insertBefore(item, paso < 0 ? hermano : hermano.nextSibling);
        item.classList.remove('is-correct', 'is-wrong');
        renumber(list);
        const items = [...list.querySelectorAll('.ova-orden__item')];
        aviso.textContent = `Posición ${items.indexOf(item) + 1} de ${items.length}`;
        (boton.disabled ? item.querySelector('.ova-orden__mover button:not(:disabled)') : boton)?.focus();
      };
      list.querySelectorAll('.ova-orden__item').forEach(item => {
        const caja = document.createElement('span');
        caja.className = 'ova-orden__mover';
        [['Subir', 'mdi:arrow-up', -1], ['Bajar', 'mdi:arrow-down', 1]].forEach(([nombre, icono, paso]) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ova-orden__btn';
          b.setAttribute('aria-label', nombre);
          b.innerHTML = `<iconify-icon icon="${icono}" aria-hidden="true"></iconify-icon>`;
          b.addEventListener('click', () => mover(item, paso, b));
          caja.appendChild(b);
        });
        item.appendChild(caja);
        item.draggable = true;
        item.addEventListener('dragstart', () => { dragged = item; item.classList.add('is-dragging'); });
        item.addEventListener('dragend',   () => { item.classList.remove('is-dragging'); dragged = null; renumber(list); });
        item.addEventListener('dragover',  e => { e.preventDefault(); if (!dragged || dragged === item) return;
          const rect = item.getBoundingClientRect();
          const after = (e.clientY - rect.top) / rect.height > 0.5;
          item.parentNode.insertBefore(dragged, after ? item.nextSibling : item);
        });
      });
      renumber(list);
    });
    document.querySelectorAll('[data-ova-orden-check]').forEach(btn => {
      btn.addEventListener('click', () => {
        // El aviso de la posición (.ova-sr) queda entre la lista y su botón
        let prev = btn.previousElementSibling;
        if (prev?.matches('.ova-sr')) prev = prev.previousElementSibling;
        const list = prev?.matches('.ova-orden') ? prev : btn.parentElement.querySelector('.ova-orden');
        if (!list) return;
        list.querySelectorAll('.ova-orden__item').forEach((item, i) => {
          item.classList.remove('is-correct', 'is-wrong');
          item.classList.add(parseInt(item.dataset.ovaOrder) === i + 1 ? 'is-correct' : 'is-wrong');
        });
      });
    });
  }
  function renumber(list) {
    const items = list.querySelectorAll('.ova-orden__item');
    items.forEach((item, i) => {
      const num = item.querySelector('.ova-orden__num');
      if (num) num.textContent = i + 1;
      const [sube, baja] = item.querySelectorAll('.ova-orden__btn');
      if (sube) sube.disabled = i === 0;
      if (baja) baja.disabled = i === items.length - 1;
    });
  }

  // Emparejar
  function setupEmparejar(root = document) {
    root.querySelectorAll('.ova-empar').forEach(group => {
      let selected = null;
      group.querySelectorAll('.ova-empar__item').forEach(item => {
        item.addEventListener('click', () => {
          if (item.classList.contains('is-matched')) return;
          if (!selected) { selected = item; item.classList.add('is-selected'); return; }
          if (selected === item) { item.classList.remove('is-selected'); selected = null; return; }
          if (selected.parentElement === item.parentElement) {
            selected.classList.remove('is-selected'); selected = item; item.classList.add('is-selected'); return;
          }
          const match = selected.dataset.ovaMatch === item.dataset.ovaMatch;
          group.dispatchEvent(new CustomEvent('ova:empar-intento', { bubbles: true, detail: { correcta: match } }));
          if (match) { [selected, item].forEach(el => { el.classList.add('is-matched'); el.classList.remove('is-selected'); }); }
          else {
            [selected, item].forEach(el => el.classList.add('is-wrong'));
            setTimeout(() => [selected, item].forEach(el => el?.classList.remove('is-wrong', 'is-selected')), 500);
          }
          selected = null;
        });
      });
    });
  }

  // Modal. La ventana es un diálogo con su título como nombre; al abrir, el foco pasa a ella y no
  // sale mientras está abierta; al cerrar, vuelve al botón que la abrió (KIT-006, D2).
  function prepararModal(modal) {
    const dialogo = modal.querySelector('.ova-modal__dialog') || modal;
    dialogo.setAttribute('role', 'dialog');
    dialogo.setAttribute('aria-modal', 'true');
    dialogo.setAttribute('tabindex', '-1');
    const titulo = dialogo.querySelector('h2, h3, h4');
    if (titulo) {
      if (!titulo.id) titulo.id = (modal.id || 'ova-modal') + '-titulo';
      dialogo.setAttribute('aria-labelledby', titulo.id);
    }
    return dialogo;
  }

  function enfocables(modal) {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]';
    return Array.from(modal.querySelectorAll(sel)).filter(e => e.getAttribute('tabindex') !== '-1');
  }

  function abrirModal(modal, origen) {
    const dialogo = prepararModal(modal);
    modal._ovaOrigen = origen || document.activeElement;
    modal.classList.add('is-open');
    dialogo.focus();
  }

  function cerrarModal(modal) {
    modal.classList.remove('is-open');
    const origen = modal._ovaOrigen;
    modal._ovaOrigen = null;
    if (origen && origen.focus) origen.focus();
  }

  function atraparFoco(modal, e) {
    const lista = enfocables(modal);
    if (!lista.length) { e.preventDefault(); return; }
    const primero = lista[0], ultimo = lista[lista.length - 1];
    const activo = document.activeElement;
    const fuera = !lista.includes(activo);
    if (e.shiftKey && (activo === primero || fuera)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (activo === ultimo || fuera)) { e.preventDefault(); primero.focus(); }
  }

  function setupModal() {
    document.addEventListener('click', e => {
      const open = e.target.closest('[data-ova-modal-open]');
      if (open) {
        const modal = document.getElementById(open.dataset.ovaModalOpen);
        if (modal) abrirModal(modal, open);
        return;
      }
      const close = e.target.closest('[data-ova-modal-close]');
      if (close) { const modal = close.closest('.ova-modal'); if (modal) cerrarModal(modal); return; }
      if (e.target.classList.contains('ova-modal')) cerrarModal(e.target);
    });
    document.addEventListener('keydown', e => {
      const abiertas = document.querySelectorAll('.ova-modal.is-open');
      if (!abiertas.length) return;
      if (e.key === 'Escape') abiertas.forEach(cerrarModal);
      else if (e.key === 'Tab') atraparFoco(abiertas[abiertas.length - 1], e);
    });
  }

  // Antes / Después
  function setupBeforeAfter(root = document) {
    root.querySelectorAll('.ova-beforeafter').forEach(ba => {
      const after = ba.querySelector('.ova-beforeafter__after');
      const handle = ba.querySelector('.ova-beforeafter__handle');
      let dragging = false;
      const update = (x) => {
        const rect = ba.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
        if (after)  after.style.clipPath = `inset(0 0 0 ${pct}%)`;
        if (handle) handle.style.left = pct + '%';
      };
      const start = e => { dragging = true; update(e.clientX || e.touches[0].clientX); };
      const move  = e => { if (dragging) update(e.clientX || e.touches[0].clientX); };
      const end   = () => { dragging = false; };
      ba.addEventListener('mousedown', start); document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
      ba.addEventListener('touchstart', start); document.addEventListener('touchmove', move); document.addEventListener('touchend', end);
    });
  }

  // Burger mobile
  function setupBurger() {
    const burger = document.querySelector('[data-ova-burger]');
    const sidebar = document.querySelector('[data-ova-sidebar]');
    if (!burger || !sidebar) return;
    // Abierto, el botón se corre fuera del panel y pasa a ✕ (no tapa el rótulo del menú).
    // Se sincroniza con un observador porque el menú también se cierra al cambiar de pantalla.
    const icono = burger.querySelector('iconify-icon');
    const sync = () => {
      const abierto = sidebar.classList.contains('is-open');
      burger.classList.toggle('is-open', abierto);
      document.body.classList.toggle('ova-menu-abierto', abierto);
      burger.setAttribute('aria-expanded', String(abierto));
      burger.setAttribute('aria-label', abierto ? 'Cerrar el menú' : 'Abrir el menú');
      if (icono) icono.setAttribute('icon', abierto ? 'mdi:close' : 'mdi:menu');
    };
    burger.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    // Tocar fuera del panel lo cierra
    document.addEventListener('click', e => {
      if (!sidebar.classList.contains('is-open')) return;
      if (sidebar.contains(e.target) || burger.contains(e.target)) return;
      sidebar.classList.remove('is-open');
    });
    new MutationObserver(sync).observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    sync();
  }

  // Reveal on scroll
  function setupReveal(root = document) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.12 });
    root.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
  }

  /* ============================================
     VIDEO LOCAL · YouTube exige el encabezado Referer y, abierto el
     curso desde el disco (file://), el navegador no lo envía: el
     reproductor muestra "Error 153". En ese caso el iframe se reemplaza
     por la miniatura del video con enlace a YouTube. Servido por http o
     desde el LMS no pasa nada.
     ============================================ */
  function idYoutube(src) {
    const m = /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,})/.exec(src || '');
    return m ? m[1] : null;
  }
  function setupVideoLocal(root = document) {
    if (location.protocol !== 'file:') return;
    root.querySelectorAll('iframe[src*="youtube"]').forEach(iframe => {
      const id = idYoutube(iframe.getAttribute('src'));
      if (!id) return;
      const a = document.createElement('a');
      a.className = 'ova-video__local';
      a.href = 'https://www.youtube.com/watch?v=' + id;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = iframe.title || 'Ver el video en YouTube';
      a.innerHTML =
        `<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">` +
        `<span class="ova-video__local-play" aria-hidden="true"></span>` +
        `<span class="ova-video__local-nota">Los videos se reproducen en el LMS o con el curso servido por http. Aquí, ver en YouTube.</span>`;
      iframe.replaceWith(a);
    });
  }

  // Keyboard nav
  function setupKeyboardNav() {
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select, button')) return;
      const nav = document.querySelector('[data-ova-screen-nav]');
      if (!nav) return;
      if (e.key === 'ArrowRight') nav.querySelector('.ova-screen-nav__btn--next')?.click();
      if (e.key === 'ArrowLeft')  nav.querySelector('.ova-screen-nav__btn--prev')?.click();
    });
  }

  /* ============================================
     TIMELINE HORIZONTAL · auto-init de [data-ova-timeline]
     (migrado desde obstruccion · OVA-001 D5)
     ============================================ */
  function setupTimelineH(root = document) {
    function init(container){
      const dataScript = container.querySelector('script[data-ova-steps]');
      if (!dataScript) return;
      const steps = JSON.parse(dataScript.textContent);
      const track = container.querySelector('.ova-timeline-h__track');
      const detail = container.querySelector('[data-ova-detail]');
      if (!track || !detail) return;
      const total = steps.length;
      let current = 0;

      function render(){
        const s = steps[current];
        detail.innerHTML = `
          <div class="ova-step-detail__icon">
            <iconify-icon icon="${s.icon}"></iconify-icon>
          </div>
          <div class="ova-step-detail__body">
            <div class="ova-step-detail__tag">
              <span>Paso ${String(current+1).padStart(2,'0')}</span>
              <span style="opacity:.5">·</span>
              <span>${s.tag}</span>
            </div>
            <h3 class="ova-step-detail__title">${s.title}</h3>
            <p class="ova-step-detail__desc">${s.desc}</p>
            ${s.tip ? `
              <div class="ova-step-detail__tip">
                <iconify-icon icon="mdi:lightbulb-on"></iconify-icon>
                <span><strong>Tip:</strong> ${s.tip}</span>
              </div>
            ` : ''}
            <div class="ova-step-detail__nav">
              <button class="ova-step-detail__btn" ${current === 0 ? 'disabled' : ''} data-go="${current-1}">
                <iconify-icon icon="mdi:arrow-left"></iconify-icon> Anterior
              </button>
              <button class="ova-step-detail__btn ova-step-detail__btn--primary" ${current === total-1 ? 'disabled' : ''} data-go="${current+1}">
                Siguiente <iconify-icon icon="mdi:arrow-right"></iconify-icon>
              </button>
              <span class="ova-step-detail__progress">${current+1} / ${total}</span>
            </div>
          </div>
        `;
        detail.style.animation = 'none';
        requestAnimationFrame(() => detail.style.animation = 'wgFadeUp .3s ease-out');

        track.querySelectorAll('.ova-step-card').forEach((c, i) => {
          c.classList.toggle('is-active', i === current);
        });
      }

      function goTo(idx){
        if (idx < 0 || idx >= total) return;
        current = idx;
        render();
        if (window.innerWidth < 720) {
          track.querySelectorAll('.ova-step-card')[idx]?.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
        }
      }

      track.addEventListener('click', e => {
        const c = e.target.closest('.ova-step-card');
        if (c) goTo(parseInt(c.dataset.step));
      });
      detail.addEventListener('click', e => {
        const b = e.target.closest('[data-go]');
        if (b && !b.disabled) goTo(parseInt(b.dataset.go));
      });

      render();
    }

    root.querySelectorAll('[data-ova-timeline]').forEach(init);
  }

  /* ============================================
     QUIZ SINGLE-PAGE · auto-init de [data-ova-evalquiz]
     (migrado desde evaluacion · OVA-001 D5)
     ============================================ */
  function setupEvalquiz(scope = document) {
    const root = scope.querySelector('[data-ova-evalquiz]');
    if (!root) return;

    const slides = root.querySelectorAll('.ova-evalquiz__slide');
    const total = slides.length;
    const progressFill = root.querySelector('[data-evalquiz-progress]');
    const counter = root.querySelector('[data-evalquiz-counter]');
    const sectionLabel = root.querySelector('[data-evalquiz-section]');
    const btnPrev = root.querySelector('[data-evalquiz-prev]');
    const btnNext = root.querySelector('[data-evalquiz-next]');
    const nav = root.querySelector('[data-evalquiz-nav]');
    const head = root.querySelector('[data-evalquiz-head]');
    // El curso puede renombrar las unidades del quiz (p. ej. "Pregunta"/"preguntas")
    const labelItem = root.dataset.labelItem || 'Actividad';
    const labelItems = root.dataset.labelItems || 'actividades';

    let current = 0;
    let iniciado = false;

    function update(){
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));

      const slide = slides[current];
      const slideId = slide.dataset.slide;
      const isIntro = slideId === 'intro';
      const isCierre = slideId === 'cierre';

      // Progress: 0% en intro, 100% en cierre, gradual entre medio
      let pct;
      if (isIntro) pct = 0;
      else if (isCierre) pct = 100;
      else pct = ((current) / (total - 1)) * 100;
      progressFill.style.width = pct + '%';

      // Counter y sección (la sección es opcional: el curso puede ubicarla en el slide)
      if (isIntro){
        counter.textContent = 'Bienvenida';
        if (sectionLabel) sectionLabel.textContent = (total - 2) + ' ' + labelItems;
      } else if (isCierre) {
        counter.textContent = 'Final';
        if (sectionLabel) sectionLabel.textContent = '¡Completado!';
      } else {
        // Slides 1..9 (índices 1..9, son las actividades 1 a 9)
        const activityNum = current;
        const total_activities = total - 2; // descartando intro y cierre
        // En ≤ 480 px se ve «N / M»; el lector de pantalla oye siempre la frase completa (KIT-007, D10)
        counter.innerHTML = `<span class="ova-evalquiz__counter-largo">${labelItem} ${activityNum} de ${total_activities}</span>` +
          `<span class="ova-evalquiz__counter-corto" aria-hidden="true">${activityNum} / ${total_activities}</span>`;
        if (sectionLabel) sectionLabel.textContent = slide.dataset.section || '—';
        // Color global del head según sección
        root.dataset.color = slide.dataset.sectionColor || 'acento';
      }

      // Si es intro o cierre, ocultar nav (intro tiene su propio botón Comenzar)
      nav.style.display = (isIntro || isCierre) ? 'none' : 'flex';

      // Estado de botones: desde la actividad 1, «Anterior» vuelve a la presentación (2026-10-26)
      btnPrev.disabled = current <= 0;
      // En la última actividad antes de cierre, el botón siguiente dice "Finalizar"
      if (current === total - 2) { // penúltimo (última actividad)
        btnNext.innerHTML = 'Finalizar <iconify-icon icon="mdi:flag-checkered"></iconify-icon>';
      } else {
        btnNext.innerHTML = 'Siguiente <iconify-icon icon="mdi:arrow-right"></iconify-icon>';
      }

      // Que la actividad se vea desde arriba, sin quedar bajo la barra superior fija y sin saltos:
      // solo se desplaza si el inicio del quiz quedó fuera de la vista (al avanzar desde abajo).
      // Al cargar y al pulsar «Comenzar» el quiz ya está a la vista y la página no se mueve (2026-10-26).
      if (iniciado) {
        const barra = document.querySelector('.ova-topbar');
        const margen = (barra ? barra.getBoundingClientRect().height : 0) + 24;
        const arriba = (head || root).getBoundingClientRect().top;
        if (arriba < margen) {
          const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollBy({ top: arriba - margen, behavior: reducir ? 'auto' : 'smooth' });
        }
      }
      iniciado = true;
    }

    function goTo(idx){
      if (idx < 0 || idx >= total) return;
      if (idx > current) root.dispatchEvent(new CustomEvent('ova:evalquiz-avance', { bubbles: true, detail: { slide: idx } }));
      current = idx;
      update();
    }

    function restart(){
      // Recargar la página · simple y limpio
      window.location.reload();
    }

    // Botón "Comenzar" en intro
    root.querySelectorAll('[data-evalquiz-go]').forEach(b => {
      b.addEventListener('click', () => goTo(parseInt(b.dataset.evalquizGo)));
    });

    btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext.addEventListener('click', () => goTo(current + 1));
    root.querySelectorAll('[data-evalquiz-restart]').forEach(b => {
      b.addEventListener('click', restart);
    });

    // Keyboard: flechas ← → (dedupe: en SPA la pantalla se monta varias veces)
    if (setupEvalquiz._kb) document.removeEventListener('keydown', setupEvalquiz._kb);
    setupEvalquiz._kb = e => {
      if (!root.isConnected) return;
      if (e.target.matches('input, textarea, select')) return;
      if (current === 0 || current === total - 1) return;
      if (e.key === 'ArrowLeft' && !btnPrev.disabled) goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    };
    document.addEventListener('keydown', setupEvalquiz._kb);

    // Inicializar
    update();
  }

  /* ============================================
     INIT
     ============================================ */
  /* Inicializa todo lo que vive DENTRO de una pantalla (alcance = root).
     Multipagina: se llama 1 vez con document. SPA: en cada montaje con la vista. */
  /* Numera las cabeceras de sección (.ova-seccion__titulo) con el 1.1, 1.2…
     que calculó el build: el número vive en el config, no en el contenido. */
  function numerarSecciones(root = document) {
    C.menu.forEach(m => (m.secciones || []).forEach(sec => {
      if (!sec.ancla || !sec.num) return;
      const el = root.querySelector('#' + CSS.escape(sec.ancla));
      const titulo = el && (el.matches('.ova-seccion__titulo') ? el : el.querySelector('.ova-seccion__titulo'));
      if (titulo) titulo.dataset.num = sec.num;
    }));
  }

  function initPantalla(root = document) {
    numerarSecciones(root);
    renderBreadcrumb(root);
    renderScreenNav(root);
    renderNextIconBtn(root);
    renderVersionSwitch(root);
    setupAcordeon(root);
    setupTabs(root);
    setupQuiz(root);
    setupChecklist(root);
    setupCarrusel(root);
    setupDnD(root);
    setupOrden(root);
    setupEmparejar(root);
    setupBeforeAfter(root);
    setupReveal(root);
    setupVideoLocal(root);
    setupTimelineH(root);
    setupEvalquiz(root);
  }

  /* ============================================
     ROUTER SPA · rutas #/<id> sobre un index.html único
     Cada pantalla vive en <template data-pantalla="id">
     ============================================ */
  function setupRouter() {
    const vista = document.querySelector('[data-ova-vista]');
    const porDefecto = C.menu[0] && C.menu[0].id;
    const fileAId = {};
    C.menu.forEach(m => { fileAId[m.file] = m.id; });

    function idDeHash() {
      if (!location.hash.startsWith('#/')) return null;
      const [id] = decodeURIComponent(location.hash.slice(2)).split('/');
      return C.menu.some(m => m.id === id) ? id : null;
    }
    function anclaDeHash() {
      if (!location.hash.startsWith('#/')) return null;
      const partes = decodeURIComponent(location.hash.slice(2)).split('/');
      return partes[1] || null;
    }

    function montar(id) {
      const tpl = document.querySelector('template[data-pantalla="' + id + '"]');
      if (!tpl) return;
      vista.innerHTML = '';
      vista.appendChild(tpl.content.cloneNode(true));
      const m = C.menu.find(x => x.id === id);
      document.title = m.titulo + ' · ' + C.course.name;
      // sidebar: re-render con la pantalla activa, preservando scroll y colapso
      const panel = document.querySelector('[data-ova-sidebar]');
      const scroll = panel ? panel.scrollTop : 0;
      renderSidebar(id);
      if (panel) { panel.scrollTop = scroll; panel.dispatchEvent(new Event('scroll')); }
      if (reaplicarColapso) reaplicarColapso();
      document.querySelector('[data-ova-sidebar]')?.classList.remove('is-open'); // cerrar overlay mobile
      const esPortadaFull = id === porDefecto && !!(C.course && C.course.portadaFullBleed);
      document.body.classList.toggle('ova-portada-full', esPortadaFull);
      initPantalla(vista);
      vista.scrollTop = 0;
      window.scrollTo(0, 0);
      const ancla = anclaDeHash();
      if (ancla) requestAnimationFrame(() => anclarA(ancla, vista));
    }

    window.addEventListener('hashchange', () => {
      const id = idDeHash();
      if (id) montar(id);   // montar relee el ancla del hash
    });

    // Enlaces estáticos del contenido (botones de la portada, home del topbar) → ruta
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const [archivo, ancla] = a.getAttribute('href').split('#');
      const id = fileAId[archivo];
      if (!id) return;
      e.preventDefault();
      const destino = '#/' + id + (ancla ? '/' + ancla : '');
      if (location.hash === destino) montar(id);
      else location.hash = destino;
    });

    const inicial = idDeHash() || porDefecto;
    if (!idDeHash()) history.replaceState(null, '', '#/' + inicial);
    montar(inicial);
  }

  /* ============================================
     INIT
     ============================================ */
  document.addEventListener('DOMContentLoaded', () => {
    setupVersionGlobal();
    if (esSPA()) {
      setupRouter();            // el primer montar renderiza sidebar + pantalla
    } else {
      renderSidebar();
      initPantalla(document);
      if (location.hash.length > 1) {
        window.addEventListener('load', () => anclarA(location.hash.slice(1)));
      }
    }
    setupSidebarToggle();       // después: necesita el sidebar ya renderizado
    setupModal();
    setupBurger();
    setupKeyboardNav();
  });
})();
