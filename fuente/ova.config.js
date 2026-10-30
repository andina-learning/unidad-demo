/* =========================================================
   CURSO · 
   ---------------------------------------------------------
   Cliente:   Universidad Andina Virtual · Escuela de Posgrado
   Insumo:    ../insumos/ (DI, figuras, medios, preguntas; ver insumos/LEEME.md)
   Preset visual: andina  (ver instituciones/andina/INSTITUCION.md)
   Versión template: hibrida

   Maqueta vacía (KIT-002): las pantallas de fuente/contenido/ traen la
   estructura y lo fijo de Andina, y todo texto del curso es un hueco
   data-ova-hueco que se llena con el texto literal del DI. La foto de
   portada es la oficial de Andina; el diseñador la cambia por la del curso.
   ========================================================= */

module.exports = {

  brand: {
    // Logo negativo (blanco + «Virtual» celeste): el que va sobre el sidebar abismo.
    // En el tema «clara» la skin lo cambia por la versión azul.
    name: '',
    sub:  '',
    logo:       'assets/img/logos/andina-logo-blanco.png',
    logoMobile: 'assets/img/logos/andina-aguila-blanco.png',
  },

  course: {
    code:             '',
    name:             'Gobierno, calidad y protección de datos',
    subtitle:         'Datos y Persistencia Avanzada: Diseño, Performance y Gobierno',   // sin el rótulo «Asignatura -» (INSTITUCION §2)
    duration:         '',
    iso:              '',
    licencia:         '',
    preset:           'andina',
    pdf:              '',
    portadaFullBleed: true,
  },

  /* TEXTOS DE LA INTERFAZ · lo que el motor pinta fuera del contenido del curso. Andina pidió que el
     menú lateral diga «Temas completados: 3 de 8» en vez de «Progreso 3/8» (revisión del mockup,
     2026-10-28; KIT-009). `{n}` es la pantalla actual del menú y `{total}`, cuántas tiene. */
  textos: {
    progreso: { etiqueta: 'Temas completados:', cifra: '{n} de {total}' },
  },

  /* MENÚ · la estructura RED (la misma de Scala Learning):
       - `tipo: 'especial'`  → secciones estructurales que tiene toda unidad
                               (inicio, contenido, introducción, conclusión,
                               evaluación, glosario, referencias). Icono, no número.
       - `tipo: 'tema'`      → contenido temático, numerado 1, 2, 3…
     Las `secciones` con `ancla` aparecen en el menú como sub-ítems y bajan a la
     `.ua-seccion` con ese `id` (único en todo el curso). */
  menu: [
    { id: 'portada',      titulo: 'Inicio',                  tipo: 'especial', icon: 'mdi:home-outline' },
    { id: 'temario',      titulo: 'Contenido de la unidad',  tipo: 'especial', icon: 'mdi:map-outline' },

    { id: 'introduccion', titulo: 'Introducción',            tipo: 'especial', icon: 'mdi:information-variant',
      secciones: [ { titulo: '¿Qué va a lograr en esta unidad?', ancla: 'que-va-a-lograr' } ] },

    /* Los temas, sus títulos y las secciones de cada pantalla salen del DI (/ova-auditar-insumos
       y /ova-maquetar): «Tema 1» y «Tema 2» solo marcan el lugar. */
    { id: 'tema1',        titulo: 'Gobierno de datos',       tipo: 'tema', numero: 1,
      secciones: [ { titulo: 'Gobierno, gestión y administración de datos',                ancla: 'tema1-1' },
                   { titulo: 'Roles, políticas, responsabilidades y ciclo de vida del dato', ancla: 'tema1-2' } ] },

    /* Conclusión y Glosario: ocultos por defecto (decisión del 2026-10-10, la de la Unidad 3 de
       Scala). Sus pantallas siguen en contenido/; para mostrarlas, quita el // de su línea. */
    { id: 'conclusion',   titulo: 'Síntesis de cierre',      tipo: 'especial', icon: 'mdi:flag-outline' },
    { id: 'evaluacion',   titulo: 'Actividad formativa', tipo: 'especial', icon: 'mdi:clipboard-check-outline' },
    // { id: 'glosario',     titulo: 'Glosario',                tipo: 'especial', icon: 'mdi:book-open-variant-outline' },
    { id: 'referencias',  titulo: 'Referencias',             tipo: 'especial', icon: 'mdi:bookmark-outline' },
    { id: 'creditos',     titulo: 'Créditos',                tipo: 'especial', icon: 'mdi:account-group-outline' },
  ],

  /* REFERENCIAS · APA literal del DI §Referencias. Estilo de la línea: autor y año sin
     negrilla, título de la obra en cursiva, URL en texto sin hipervínculo. */
  referencias: [],

  creditos: {
    institucion: 'Universidad Andina Virtual · Escuela de Posgrado',
  },
};
