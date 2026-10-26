# Curso: Gobierno, calidad y protección de datos

Curso OVA en HTML estático. Este proyecto es **autocontenido**: trae la fuente editable, el
compilador y todo lo necesario para verlo, modificarlo y publicarlo. No tiene dependencias
externas: `npm install` no descarga nada.

## Arranque

Requisito: [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:8000/spa/`. Ese es el curso tal como lo ve el estudiante.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Compila y sirve el curso en `http://localhost:8000/spa/` |
| `npm run build` | Compila `fuente/` → `dist/` (8 pantallas, en dos formatos) |
| `npm start` | Solo sirve `dist/` (sin recompilar). `--port 9000` cambia el puerto |
| `npm test` | Compila y verifica que salieron todas las pantallas |
| `npm run zip` | Compila y comprime `dist/spa` para el LMS (`npm run zip -- --multipagina` añade `dist/multipagina`) |

Verás `✔ 8/8 pantallas → dist/multipagina/ + dist/spa/index.html` al compilar.

> Los videos de YouTube solo cargan cuando el curso se sirve por http (LMS o `npm run dev`).
> Abierto con doble clic desde el disco, el curso muestra en su lugar la miniatura del video
> con enlace a YouTube. No es un error del curso.

## Estructura

| Carpeta | Qué es | ¿Se edita? |
|---|---|---|
| `fuente/ova.config.js` | Datos del curso: menú, glosario, referencias, logos, PDF | ✅ SÍ |
| `fuente/contenido/` | Una pantalla por archivo `.html`. El texto del curso vive aquí | ✅ SÍ |
| `fuente/paleta.css` | Los 3 colores del curso | ✅ SÍ |
| `fuente/assets/` | Imágenes, audios y descargas del curso | ✅ SÍ |
| `motor/` | El motor común a todos los cursos: `core.css`, `core.js`, plantillas | ❌ Solo el equipo técnico |
| `skin/` | La piel visual de la institución: fuentes, presets de color, logos | ❌ Solo el equipo técnico |
| `build.js` | El compilador: `motor` + `skin` + `fuente` → `dist/` | ❌ |
| `scripts/` | Servidor local, verificación y zips | ❌ |
| `dist/spa/` | El curso compilado como **página única** (`index.html`, rutas `#/tema`). La entrega estándar | ❌ NUNCA a mano |
| `dist/multipagina/` | El curso compilado como **un archivo por pantalla**, para LMS que lo exijan | ❌ NUNCA a mano |

`dist/` se borra y se regenera en cada compilación: lo que se edite ahí se pierde.

## Cómo se edita

### Corregir un texto

1. Abre `fuente/contenido/` y busca el archivo de la pantalla: `inicio.html`, `presentacion.html`, `tema1.html`…`temaN.html` (el número del tema), `evaluacion.html`, `glosario.html`, `referencias.html`. El nombre es el `id` del menú en `ova.config.js`.
2. Cambia solo las palabras, no las etiquetas `<...>`.
3. `npm run dev` y revisa.

### Agregar o corregir un término del glosario

1. Abre `fuente/ova.config.js`, sección `glosario:`.
2. Copia un bloque `{ letra: 'X', termino: '...', definicion: '...' },` y edítalo.
3. `npm run build`. El índice alfabético se arma solo.

### Reordenar o renombrar pantallas del menú

1. Abre `fuente/ova.config.js`, sección `menu:`.
2. Mueve la línea completa de la pantalla a su nueva posición, o edita su `titulo`.
3. `npm run build`. La numeración, el menú lateral y los botones anterior/siguiente se ajustan solos.

### Agregar una pantalla

1. Crea `fuente/contenido/<id>.html` copiando una pantalla parecida (un tema nuevo es `tema<N>.html`).
2. Agrega su línea en `menu:` de `ova.config.js`, en la posición que le corresponde.
3. `npm run build`.

### Cambiar los colores

`fuente/paleta.css`, 3 colores en hexadecimal. Si no existe, el curso usa `skin/paleta.css` o el
preset de la institución; crea `fuente/paleta.css` para cambiarlos solo en este curso:

```css
--c-acento: #FF7500;  /* color principal (botones, acentos) */
--c-info:   #2E77D0;  /* color secundario (información) */
--c-deep:   #02224E;  /* color oscuro (menú lateral) */
```

## Publicar en el LMS

```bash
npm run zip
```

Sube el zip de `spa`. Nada más. Si el LMS exige un archivo por pantalla, `npm run zip -- --multipagina`
genera también el de `multipagina`.

## Publicar en GitHub Pages

El proyecto trae el workflow `.github/workflows/pages.yml`: en cada push a `main` compila el
curso y publica `dist/spa/` en GitHub Pages. Para activarlo, una sola vez:

1. Crea un repositorio en GitHub (público, o privado si el plan de la organización permite Pages en privados).
2. Sube el contenido de esta carpeta:

```bash
git init -b main && git add . && git commit -m "Curso Gobierno, calidad y protección de datos"
git remote add origin https://github.com/<organizacion>/<repositorio>.git
git push -u origin main
```

3. En el repositorio: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.

Desde ahí, cada push a `main` deja el curso en `https://<organizacion>.github.io/<repositorio>/`.
El progreso se ve en la pestaña **Actions**. `dist/` no se sube nunca: lo genera el workflow.

## Reglas de oro

1. **Nunca edites nada dentro de `dist/`.** Se regenera en cada compilación.
2. El texto del curso es **literal** del documento de diseño instruccional: no parafrasear.
3. `motor/` y `skin/` son compartidos con los demás cursos de la institución. Un cambio ahí se
   coordina con el equipo técnico para que todos los cursos sigan iguales.
4. Si algo se ve raro después de compilar, avisa al equipo técnico antes de seguir.
