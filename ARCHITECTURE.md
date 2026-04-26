# ARCHITECTURE.md — Observatorio del Sistema de Energía de Jalisco

**Documento de traspaso · Versión 1.7 · Abril 2026**
**Estado: Fases 1, 2, 3, 4, 5, 6 y 7 completadas. Fase 8 por iniciar.**

### Changelog v1.7
- **Fase 7 completada**: navegación jerárquica completa en `Drawer.astro`, búsqueda full-text estática con Pagefind, modal flotante `SearchWidget.tsx` con atajo `/` y trigger desde lupa en header, auditoría de cross-references en todas las páginas con códigos visibles.
- **Pagefind integrado al build pipeline**: `npm run build` ejecuta `astro build && pagefind --site dist`. El índice se genera en `dist/pagefind/` (incluye `pagefind.js`, `wasm.es.pagefind`, fragmentos de índice) y se sirve estáticamente. Detecta automáticamente el idioma `es`. Indexa solo el contenido bajo `<main data-pagefind-body>` — no header, footer ni drawer.
- **Componente `SearchWidget.tsx` + `SearchWidget.css`**: React island montado una sola vez en `Editorial.astro` con `client:load`. Carga dinámica del bundle de Pagefind en el primer abrir del modal (cache en `window.__pagefind__`). Debounce 200ms, top 20 resultados agrupados por sección via `meta.seccion`, navegación por teclado (↓/↑/↵/Esc), tab trap, restauración de foco al trigger. `role="dialog"` + `aria-modal`. Mobile: full-screen.
- **Header con ícono lupa** que dispara `CustomEvent('open-search')`. Atajo `/` global registrado en `Editorial.astro` con guarda contra inputs/textareas/selects/contentEditable.
- **`Editorial.astro` con prop `seccion?: string`**: cada página declara su sección ("Inicio", "Síntesis ejecutiva", "Marco normativo", "Metodología", "Contacto") para que Pagefind agrupe los resultados. Default: "Otros".
- **Drawer expandido**: nivel 1 (5 secciones, links navegables, sans 14px weight 500 uppercase navy), nivel 2 (5 agrupadores no clicables: Hallazgos, Reformas, Proyectos, Federal, Estatal — con borde izquierdo `--hair-light`), nivel 3 (hojas, sans 13px navy, hover con underline). Los 20 ordenamientos se renderizan dinámicamente desde `ordenamientos.json` con validación dura (9 federales + 11 estatales). Item activo detectado por `Astro.url.pathname`.
- **Auditoría de cross-references**: 4 cambios mínimos a configs de Explorer (`tagXref` agregado a 1A debilidades, 3B reforma-estatal, 3D habilitaciones; `CrossRefText` agregado al render de `/ordenamiento/[tag]`). Ningún cambio a `Explorer.tsx`. Cobertura final: ≥99% de los códigos visibles en el sitio activan tooltip al hover. Casos residuales documentados (2 items con código en campo `tipo`/`impacto` no cubiertos).

### Changelog v1.6
- **Fase 6 completada**: 4 páginas singulares implementadas (`/`, `/metodologia`, `/contacto`, `/sintesis/ruta-critica`) y 3 componentes nuevos (`RutaCritica.tsx`, `RutaCritica.css`, `TocSidebar.astro`).
- **Visualización de la ruta crítica**: vertical waterfall por grupos con aristas SVG bezier intra-grupo según campo `dependencias[]`. T6 sub-agrupada por `ordenamiento` derivado de datos (no hardcodeado): 9 sub-bandas en el estado actual de `reformas.json` (LACCEJ, LOAEEJ, LAEJ, LPIPSEJM, LGAPM, LEEEPA-Jal, REEEPA, LJAEJ, LMR-Jal), ordenadas por R-NN mínimo. Hover transitivo (predecesoras y sucesoras recursivas). Mobile: lista degradada sin SVG vía CSS.
- **Dependencias inversas e inter-tramo**: la regla v1.5 ("abortar si predecesor en tramo posterior al sucesor") se reemplaza por: **las dependencias inter-tramo, incluidas las inversas, no se renderizan como aristas** pero **sí participan en el cálculo del conjunto transitivo en hover**. Razón: el orden de ejecución legislativa (T1 primero por jerarquía constitucional) no coincide siempre con el orden de derivación conceptual; el waterfall visualiza orden legislativo. La validación dura del frontmatter solo aborta si una dependencia apunta a un id que no existe en `reformas.json`.
- **R-101 y T7**: T7 contiene 3 reformas (R-72, R-80, R-101) que dependen del Congreso de la Unión y se renderizan como banda en la viz. Adicionalmente, R-101 se destaca en un bloque editorial inferior con eyebrow "REFORMA FEDERAL · NO CONTROLABLE DESDE JALISCO".
- **Drawer actualizado** para incluir `/sintesis/ruta-critica` dentro del bloque "Síntesis ejecutiva", entre "Reformas estructurales" y "Proyectos ejecutivos".
- **Endpoint Formspree registrado**: `https://formspree.io/f/xqewjdjp`. Página `/contacto` queda con dos bloques (Formulario + Sobre el autor); el bloque "Reportes técnicos" del brief original se eliminó por decisión editorial. "Sobre el autor" final: "Carlos Aguilar. MIA, Columbia University." (sin link a GitHub, sin descriptor profesional largo).
- **Página `/metodologia`** con 6 secciones + TocSidebar sticky en desktop. Implementa lo declarado en v1.5 sobre inferencias documentadas.
- **Home final** consume las 6 métricas reales desde los JSON con validación dura en frontmatter (aborta si los conteos no son 80/101/207/40/62/20).

### Changelog v1.5
- **Reubicación de la ruta crítica**: deja de ser sección inferior de `/sintesis/reformas` y pasa a página dedicada `/sintesis/ruta-critica`. Justificación: el explorer de reformas ya carga 101 items con filtros y distribuciones; agregar la viz de tramos en la misma página la satura. La página dedicada es deeplinkeable (uso institucional) y SEO-able. La página `/sintesis/reformas` mantiene solo el explorer.
- **Visualización de la ruta crítica congelada como vertical waterfall por tramos**: cada tramo es una banda horizontal a ancho completo, con su altura natural según número de reformas. T6 (35 reformas, descrito en fuente como "múltiples cadenas independientes") sub-agrupa internamente por `ordenamiento`. Las dependencias del campo `dependencias[]` se renderizan como aristas SVG intra-tramo conectando cards. Inter-tramo se indica con hairline horizontal etiquetada (`T1 ⊢ T2`). Se descartaron horizontal-7-columnas (T6 quiebra la grilla, ratio 12:1 contra T3), Sankey (mal fit conceptual: el campo es un DAG discreto, no flujos cuantitativos) y lista plana (pierde el valor del campo `dependencias`).
- **Comportamiento de hover en la ruta crítica**: hover sobre una card R-NN resalta el conjunto **transitivo** de predecesoras y sucesoras (resolución recursiva del grafo de dependencias), atenuando el resto a opacity 0.3. Click en card navega a `/sintesis/reformas/R-NN` (ficha existente de Fase 4); no se abre modal.
- **Nuevo componente `RutaCritica.tsx` + `RutaCritica.css`**: React island. Recibe `tramos: Tramo[]` ya pre-procesados en frontmatter `.astro` (build-time). Aplica regla v1.2 de concatenación con `+` (no template literals).
- **Bloque "Reformas independientes"** debajo de la viz: las 36 reformas con `tramo_ruta_critica: null` en grilla simple sin aristas, agrupadas por `ordenamiento`. Bloque adicional para R-101 con banner "Reforma federal · No controlable desde Jalisco".
- **Mobile (ruta crítica)**: vista degradada — lista por tramo sin aristas SVG. Las cards se mantienen clicables.
- **Adición a `/metodologia` — bloque "Inferencias documentadas"**: nueva sección entre "Reglas operacionales" y "Qué no contiene el estudio". Declara públicamente las dos inferencias sistemáticas del pipeline: (1) prioridad de los 84 proyectos 3A inferida por `infer_prioridad_3a` desde el campo `condicion` (distribución 51 Alta / 26 Media / 7 Baja, marcada con `prioridad_inferida: true`); (2) normalización de 16 valores de `tipo` en debilidades a 9 categorías canónicas vía `normalize_data.py`. Justificación: el sitio se dirige a TJA y Congreso; cualquier dato derivado debe ser auditable y declarado en metodología, no enterrado en NOTES.md del repo.
- **Fecha de corte editorial fijada en 1 de abril de 2026**. Plan de actualización: por definir (no se compromete cadencia).
- **Sin LinkedIn ni afiliaciones institucionales** en `/contacto`. Tres bloques: Formspree, GitHub Issues, Sobre el autor (nombre, descriptor, GitHub).

### Changelog v1.4
- **Fase 5 completada**: 20 fichas de ordenamiento + overview `/marco` + 20 vistas transversales `/ordenamiento/[tag]`. Build de 158 páginas estáticas.
- **Restauración de los 11 bloques faltantes en `marco_federal_energetico.md`**: el archivo fuente había perdido 11 de los 20 bloques H2 originales (8 federales + 3 estatales: CPEJ, LACCEJ, LPIPSEJM). Reconstruidos desde los JSON de `fase1/src/data/bloques/` (snapshot del parser v1) y reinsertados en el `.md` en orden canónico. Después de regenerar con el parser, `src/data/bloques/` contiene los 20 archivos.
- **Componente `BloqueContent.tsx`**: parser de markdown ligero con soporte para listas, tablas, marcas `[INFERENCIA:]` y `[AUSENCIA:]`, y cross-references con tooltip rico. Usado en las 20 fichas de ordenamiento para renderizar las 6 secciones del JSON de cada bloque.
- **Ruta dinámica unificada para fichas**: en lugar de dos rutas separadas (`/marco/federal/[slug]` y `/marco/estatal/[slug]`) se usó una sola con catch-all (`/marco/[...slug].astro`) que internamente discrimina por `ambito` desde `ordenamiento-meta.json`. Genera las 20 URLs en build time vía `getStaticPaths`.
- **Vistas transversales `/ordenamiento/[tag]`**: agregan dinámicamente todas las debilidades, reformas, proyectos, conflictos y vacíos vinculados al ordenamiento. Generadas en build time. URLs case-sensitive con el tag canónico (ej. `/ordenamiento/CPEJ`, no `/ordenamiento/cpej`).
- **Higiene del repo**: borradas carpetas y archivos huérfanos (`z_SEDES/src/`, `energia-jalisco/fase1/`, `energia-jalisco/fase2/`, `energia-jalisco/fase2.tar.gz`, `energia-jalisco/diag_tipos.cjs`, backups `.bak*` del parser y del .md). Repo queda con solo lo necesario.
- **Path layout del parser corregido en v1.3** ahora documentado: `SOURCE_ROOT = parent.parent` (apunta a `z_SEDES/`, donde están los `.md`) y `REPO_ROOT = parent` (apunta a `energia-jalisco/`, donde se escriben los JSON). No fusionar.

### Changelog v1.3
- **Fase 4 completada en su totalidad**: las 10 páginas Explorer (1A, 1B, 2, 3A, 3B, 3C, 3D, 4A, 4B, 6) más 4 páginas no-Explorer (overview `/sintesis`, overview `/sintesis/proyectos`, ruta dinámica `/sintesis/reformas/[codigo]` con 101 fichas, narrativas 4C `/sintesis/riesgos`, huecos 5 `/sintesis/huecos`). En esta versión, las Secciones 4C y 5 se entregan como parte de Fase 4 (originalmente estaban en Fase 6).
- **Bug del parser corregido**: `parse_markdown.py` usaba `BASE = parent.parent` mezclando dos roots distintos (donde viven los `.md` fuente vs donde van los JSON). Separado en `SOURCE_ROOT` (`z_SEDES/`, raíz de fuentes) y `REPO_ROOT` (`z_SEDES/energia-jalisco/`, raíz del repo). Sin esta fix, los JSON se escribían a una carpeta huérfana fuera del repo.
- **Inferencia sistemática de prioridad en proyectos 3A**: la fuente no traía columna de prioridad para los 84 proyectos viables. Se agregó al parser una función `infer_prioridad_3a(condicion)` que deriva prioridad (Alta/Media/Baja) a partir del campo `condicion` mediante reglas explícitas: Baja si depende de voluntad federal discrecional; Media si requiere convenio o coordinación con autoridad federal cooperativa; Alta si es ejecutable por acto unilateral del Estado. Cada item resultante incluye `prioridad_inferida: true` para distinguirlo de fuentes documentadas. Distribución resultante: 51 Alta / 26 Media / 7 Baja. Documentado como inferencia en NOTES.md.
- **Componente `CrossRefText.tsx`**: extracción del patrón de detección de códigos R-NN y NA.NN (antes embebido dentro de `Explorer.tsx`) a un componente reutilizable. Permite renderizar cualquier string detectando códigos cross-reference y envolviéndolos con `CrossRef` para tooltip rico al hover. Usado en fichas de reforma, narrativas 4C y lista de huecos 5.
- **Extensión de `Explorer.tsx` (sin breaking changes)**: tres campos opcionales nuevos en `ItemFields` del config:
  - `titulo` (string): renderiza un `<h3>` adicional con el título del item, además del texto.
  - `badge` (string): renderiza un badge tipográfico extra en la meta-line del item (junto al ord, tipo, art).
  - `tagXref` (string): nombre del campo cuyo valor (array de códigos) envuelve el tag de la derecha con `CrossRef` para mostrar tooltip rico al hover.
- **Fix de clases CSS de tags**: `PriorityTag` ahora normaliza espacios a guiones (`(value || '').toLowerCase().replace(/\s+/g, '-')`). Antes, valores como "Parcialmente explotada" generaban dos clases separadas en HTML (`.tag-parcialmente .explotada`), rompiendo el matching CSS. Ahora generan una clase válida (`.tag-parcialmente-explotada`).
- **Tags CSS específicos por sección**: agregados a `Explorer.css`:
  - `tag-explotada`, `tag-parcialmente-explotada`, `tag-ociosa`, `tag-ociosa-diferida` (3D, gradiente navy).
  - `tag-constitucional`, `tag-legal` (4B, navy oscuro/medio).
  - `tag-30-días`, `tag-60-90-días`, `tag-120-180-días`, `tag-240-días`, `tag-continuo` (sección 6, gradiente navy de corto a largo).
- **Fix de tooltip de CrossRef**: la regla CSS en `components.css` referenciaba `.xref-wrapper` (con "per") pero el componente usa `.xref-wrap` (sin "per"). Sin la regla correspondiente, el wrapper quedaba como `display: inline` y el tooltip absoluto se anclaba al ancestro posicionado más cercano (a veces lejos del cursor). Agregada regla `.xref-wrap, .xref-wrapper { position: relative; display: inline-block; }` en `components.css`.
- **Tercera columna del grid de items en `Explorer.css`** ampliada de 110px a 170px y tags 3D/4B/6 con `width: 160px` para acomodar textos multipalabra sin desborde ni partir palabras.
- **Higiene de Fase 4**: archivos de patch del parser (`patch_parser*.py`) y backups (`parse_markdown.py.bak*`) borrados después de aplicarse. No se commitean al repo.

### Changelog v1.2
- Fase 3 marcada como completada: Explorer genérico + CrossRef + página de debilidades 1A funcionales y commiteadas.
- Stack actualizado: Astro 5.18 + React 19.2 (la integración `npx astro add react` instala estas versiones; `@astrojs/react` v5.x requiere Astro 5). El ARCHITECTURE anterior especificaba Astro 4 + React 18.
- Nueva regla de implementación en componentes React: usar concatenación con `+` (`'clase ' + nombre`) en lugar de template literals (`` `clase ${nombre}` ``). Justificación: el copy-paste desde interfaces de chat convierte backticks ASCII a caracteres Unicode parecidos (U+02CB, U+2035, etc.), que esbuild rechaza. La concatenación es ASCII-only y elimina el problema.
- Agregada referencia a `normalize_data.py` como post-processor temporal que normaliza los JSON tras correr `parse_markdown.py`. Arregla (a) los valores del campo `tipo` en debilidades y (b) el campo `nombre` faltante en ordenamiento-meta. Deuda técnica: plegar esa lógica al parser en una iteración futura.
- Agregada taxonomía canónica de 9 categorías para el campo `tipo` de debilidades (Sección 4).
- Agregado: stack real instalado queda en `package.json` (verificar antes de modificar dependencias).

### Changelog v1.1
- Corregido: conteos §3D (Parcialmente=26, Ociosa=19+5 diferidas, no 23/27/8).
- Corregido: fuentes tipográficas son self-hosted, no Google Fonts (coherencia con paquete anti-scraping).
- Agregado: reglas de manejo de ruta crítica (36 reformas sin tramo asignado → `null`).
- Agregado: manejo especial de R-101 (sin ordenamiento estatal; banner visual).
- Agregado: `global.css` en la estructura de estilos.
- Agregado: repo URL confirmado (`github.com/carlosaglr/energia-jalisco`).
- Agregado: nota sobre `marco_federal_energetico.md` corregido (headers `##`).
- Agregado: regla de higiene de `src/data/` (solo JSON de contenido).
- Corregido: estructura de carpetas refleja estado real del proyecto post-Fase 2.

---

## 0. Contexto del proyecto

### Qué es
Sitio web editorial que publica el análisis jurídico-regulatorio del sistema energético de Jalisco frente al marco federal mexicano vigente (post-reforma CPEUM 20-12-2024 y paquete DOF 18-03-2025).

### Nombre institucional
**Observatorio del Sistema de Energía de Jalisco**

### Contenido fuente
Dos archivos Markdown subidos como project knowledge:
- `marco_federal_energetico.md` — ~4,690 líneas, 20 bloques analíticos (9 federales + 11 estatales), cada uno con 6 secciones estandarizadas. **NOTA: usar versión corregida (v1.1) donde los 20 headers `##` están al inicio de línea. La versión original tenía 11 headers concatenados al final de la línea anterior.**
- `sintesis_ejecutiva_jalisco.md` — ~1,300 líneas, 6 secciones de síntesis con datos altamente estructurados. **NOTA: usar versión corregida (v1.1) con conteos §3D corregidos.**

Ambos archivos viven **fuera del repo** en `/Users/carlosaguilar/Documents/z_SEDES/`. El parser los lee desde ahí.

### Datos agregados del contenido
- 80 debilidades del marco estatal (Sección 1A)
- 34 condicionamientos del marco federal (Sección 1B)
- 101 reformas estructurales con códigos R-01 a R-101 y ruta crítica de 7 tramos (Sección 2). Distribución por tramo: T1=7, T2=4, T3=3, T4=6, T5=7, T6=35, T7=3 (65 asignadas; 36 reformas sin tramo — son independientes o paralelas)
- 84 proyectos viables hoy (3A) + 50 con reforma estatal (3B) + 15 con reforma federal (3C) + 58 habilitaciones federales (3D: Explotada=8, Parcialmente explotada=26, Ociosa=19, Ociosa diferida=5)
- 40 conflictos de competencia (4A)
- 62 vacíos federal-estatal (4B)
- 2 casos de máximo riesgo narrativos (4C)
- Huecos documentales agrupados en 4 categorías (5)
- 30 acciones operativas de próximos pasos (6)

### Autor
Carlos Aguilar. Analista en derecho energético, política pública y administración estatal.

### Audiencia
Pública y abierta. Lectores institucionales: Ejecutivo estatal de Jalisco, Congreso del Estado, Tribunal de Justicia Administrativa, Agencia de Energía, SEMADET, despachos de abogados, desarrolladores de proyectos energéticos, organismos internacionales, academia.

### Idioma
Español. Toda la interfaz, navegación, metadata y contenido en español.

---

## 1. Stack tecnológico

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Astro 5.x | Renderizado estático, carga instantánea, SEO nativo, islands de React solo donde hay interactividad |
| Interactividad | React 19 (Astro islands) | Explorers filtrables, tooltips de cross-reference, búsqueda |
| Integración React | `@astrojs/react` ^5.0 | Compatible con Astro 5. La v3.x era para Astro 4; v5.x es el target actual. |
| Estilos | CSS vanilla con custom properties | Control total del design system Julius Bär, sin dependencia de framework CSS |
| Búsqueda | Pagefind | Búsqueda full-text estática, sin servidor, gratis |
| Formulario de contacto | Formspree (tier gratis) | Sin backend, email privado del autor no expuesto |
| Deploy | Vercel o Netlify (tier gratis) | Deploy automático desde GitHub, CDN global, HTTPS |
| CDN/Protección | Cloudflare (tier gratis) | Rate limiting, bloqueo de bots de IA, DDoS protection |
| Repo | GitHub público: `github.com/carlosaglr/energia-jalisco` | Prueba de autoría con timestamps, issues como canal de feedback técnico |
| Dominio | `energia-jalisco.vercel.app` en v0; dominio propio (`observatorioenergiajalisco.mx` o similar) en v1 |

### Restricciones
- Solo modo claro (no dark mode).
- No se usa ningún framework CSS (Tailwind, Bootstrap, etc).
- No se usa ningún CMS.
- No hay backend, base de datos ni autenticación en v0.

### Regla de implementación para componentes React (nueva en v1.2)
**Usar concatenación con `+` en lugar de template literals.** Ejemplos:

```tsx
// SÍ (robusto ante copy-paste):
const href = '/marco/' + meta.ambito + '/' + meta.slug;
const cls = 'tag tag-' + prioridad.toLowerCase();

// NO (rompe cuando backticks se convierten a Unicode similar):
const href = `/marco/${meta.ambito}/${meta.slug}`;
const cls = `tag tag-${prioridad.toLowerCase()}`;
```

Justificación: cuando los archivos .tsx se transfieren por copy-paste desde chat, los backticks ASCII (U+0060) a veces se sustituyen por U+02CB o U+2035 (caracteres visualmente idénticos pero no válidos para delimitar template literals). esbuild rechaza el archivo con `Expected identifier but found...`. La concatenación con `+` es ASCII estándar y nunca se sustituye. Esta regla aplica a **todos los archivos .tsx/.jsx** del proyecto.

Dentro de Astro frontmatter, strings template con `${}` sí son seguros porque Astro los parsea distinto. Pero la recomendación por consistencia es evitarlos también.

---

## 2. Design system — Lenguaje visual Julius Bär

### Referencia visual
Sitio de Julius Bär (juliusbaer.com): serif ligero para display y cuerpo editorial, sans solo para chrome (eyebrows, labels, metadata), navy profundo, hairlines, small caps tracked-out, centrados editoriales, generoso espacio negativo, pesos bajos (300–400).

### Paleta de colores (solo modo claro)

```css
:root {
  /* Primarios */
  --navy: #1B2C5E;
  --navy-soft: #4A5B85;
  --navy-bg: rgba(27, 44, 94, 0.03);

  /* Líneas y separadores */
  --line: rgba(27, 44, 94, 0.18);
  --hair: rgba(27, 44, 94, 0.12);
  --hair-light: rgba(27, 44, 94, 0.06);

  /* Texto */
  --text-primary: #1A1A1A;
  --text-secondary: #4A5B85;
  --text-muted: #8696B0;

  /* Superficies */
  --bg-page: #FFFFFF;
  --bg-surface: #F8F9FB;
  --bg-hover: rgba(27, 44, 94, 0.04);

  /* Semánticos — tags de prioridad */
  --tag-alta-bg: #1B2C5E;
  --tag-alta-text: #FFFFFF;
  --tag-media-border: #1B2C5E;
  --tag-media-text: #1B2C5E;
  --tag-baja-border: #A8B2C7;
  --tag-baja-text: #4A5B85;

  /* Barras de distribución */
  --bar-alta: #1B2C5E;
  --bar-media: #4A5B85;
  --bar-baja: #A8B2C7;

  /* Interacción */
  --link: #1B2C5E;
  --link-hover-bg: rgba(27, 44, 94, 0.08);
  --focus-ring: rgba(27, 44, 94, 0.3);
}
```

### Tipografía

```css
:root {
  --font-serif: 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'Times New Roman', serif;
  --font-sans: 'Inter', 'Helvetica Neue', 'Arial', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

Self-hosted en `public/fonts/` (no Google Fonts — coherencia con paquete anti-scraping, sin requests a terceros):
```
Source Serif 4: weights 300, 400, 500 (+ italic de cada uno)
Inter: weights 400, 500
JetBrains Mono: weight 400
```
Descargar archivos .woff2 desde Google Fonts o Font Squirrel y colocar en `public/fonts/`. Declarar con `@font-face` en `tokens.css`.

### Escala tipográfica

| Elemento | Font | Size | Weight | Line-height | Letter-spacing | Uso |
|---|---|---|---|---|---|---|
| Display heading | serif | 52px | 300 | 1.1 | -0.005em | Home hero, títulos de sección principal |
| Section heading | serif | 32px | 300 | 1.2 | -0.005em | Títulos de subsección |
| Card heading | serif | 22px | 400 | 1.25 | 0 | Títulos dentro de tarjetas |
| Body editorial | serif | 17px | 400 | 1.75 | 0 | Prosa editorial, descripciones de debilidades/reformas |
| Body compact | serif | 15.5px | 400 | 1.6 | 0 | Texto en explorers y fichas |
| Eyebrow | sans | 11px | 400 | 1 | 0.28em | Labels de sección: `SÍNTESIS · 1A` |
| Label uppercase | sans | 10px | 400 | 1 | 0.22em | Tipo de debilidad, metadata en tooltips |
| Metric number | serif | 56px | 300 | 1 | -0.02em | Números hero en métricas |
| Metric number sm | serif | 22px | 300 | 1 | -0.01em | Números en barras de distribución |
| Tag text | sans | 10px | 400 | 1 | 0.18em | Tags de prioridad Alta/Media/Baja |
| Mono reference | mono | 11px | 400 | 1.4 | 0.02em | Referencias a artículos: `Art. 15, Fracc. VI` |
| Nav item | sans | 14px | 400 | 1.4 | 0.04em | Items del drawer de navegación |
| Footer | sans | 12px | 400 | 1.5 | 0.04em | Texto de footer, copyright, licencia |

### Componentes base

Los estilos base (`.eyebrow`, `.display`, `.subtitle`, `.hairline`, `.metrics-row`, `.metric`, `.tag`, `.tag-alta/media/baja`, `.ord-name`, `.bar-row`, `.bar-track`, `.tab`, `.xref`, `.tooltip`, `.drawer`) viven en `src/styles/components.css` (creado en Fase 2). La especificación CSS completa de cada uno se conserva del ARCHITECTURE v1.1 y no se repite aquí para brevedad. Consultar el archivo `components.css` del repo como fuente de verdad.

Los estilos adicionales introducidos en Fase 3 (`.explorer`, `.explorer-item`, `.explorer-number`, `.explorer-tipo`, etc.) viven en `src/components/Explorer.css`, importado por `Explorer.tsx`.

---

## 3. Estructura del sitio

### Mapa de URLs

```
/                                           Home
/metodologia                                Metodología del análisis
/contacto                                   Formulario de contacto
/sintesis                                   Overview de la síntesis ejecutiva
/sintesis/mapa/debilidades                  1A — 80 debilidades (explorer) ✅
/sintesis/mapa/condicionamientos            1B — 34 condicionamientos (explorer)
/sintesis/reformas                          2 — 101 reformas (explorer + ruta crítica)
/sintesis/reformas/[codigo]                 Ficha individual: R-01, R-02, ..., R-101
/sintesis/proyectos                         Overview de proyectos (cards a 3A/3B/3C/3D)
/sintesis/proyectos/viables-hoy             3A — 84 proyectos (explorer)
/sintesis/proyectos/reforma-estatal         3B — 50 proyectos (explorer)
/sintesis/proyectos/reforma-federal         3C — 15 proyectos (explorer)
/sintesis/proyectos/habilitaciones          3D — 58 habilitaciones (explorer)
/sintesis/conflictos                        4A — 40 conflictos (explorer)
/sintesis/vacios                            4B — 62 vacíos (explorer)
/sintesis/riesgos                           4C — 2 narrativas editoriales
/sintesis/huecos                            5 — huecos documentales (lista agrupada)
/sintesis/siguiente                         6 — 30 próximos pasos (explorer/timeline)
/marco                                      Overview de los 20 ordenamientos
/marco/federal/[slug]                       Ficha de ordenamiento federal: cpeum, lbio, lcne, lepecfe, lgcc, lgeo, lpte, lse, lsh
/marco/estatal/[slug]                       Ficha de ordenamiento estatal: cpej, laccej, loaeej, laej, lpipsejm, lgapm, lpaej, leeepa-jal, reeepa, ljaej, lmr-jal
/ordenamiento/[tag]                         Vista transversal por ordenamiento (todo lo vinculado)
```

### Estructura de carpetas del repo

```
energia-jalisco/
├── astro.config.mjs
├── package.json
├── package-lock.json
├── tsconfig.json
├── parse_markdown.py            (script de Fase 1)
├── normalize_data.py            (post-processor de Fase 3)
├── .gitignore
├── README.md
├── public/
│   ├── robots.txt
│   ├── sitemap.xml              (generado por Astro)
│   ├── fonts/                   (Source Serif 4, Inter, JetBrains Mono — self-hosted)
│   └── og/                      (imágenes Open Graph por sección)
├── src/
│   ├── env.d.ts
│   ├── styles/
│   │   ├── tokens.css           (variables CSS — paleta, tipografía, spacing)
│   │   ├── typography.css       (escala tipográfica, estilos de texto)
│   │   ├── components.css       (eyebrow, tags, tabs, bars, tooltips, drawer)
│   │   ├── layout.css           (header, footer, page structure, grid)
│   │   └── global.css           (reset, imports de fuentes, estilos base globales)
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Drawer.astro         (navegación lateral hamburguesa)
│   │   ├── Eyebrow.astro
│   │   ├── DisplayHeadline.astro
│   │   ├── Subtitle.astro
│   │   ├── MetricsRow.astro
│   │   ├── HairlineDivider.astro
│   │   ├── PriorityTag.astro
│   │   ├── OrdenamientoName.astro
│   │   ├── SectionHeader.astro  (eyebrow + headline centrado)
│   │   ├── NavCard.astro        (tarjeta de navegación estilo Julius Bär)
│   │   ├── Explorer.tsx         ✅ Fase 3
│   │   ├── Explorer.css         ✅ Fase 3
│   │   ├── CrossRef.tsx         ✅ Fase 3
│   │   ├── CrossRefText.tsx     ✅ Fase 4 (renderiza string detectando códigos R-NN y NA.NN, envolviendo cada match con CrossRef)
│   │   ├── BloqueContent.tsx    ✅ Fase 5 (parser markdown ligero para fichas de ordenamiento, soporta tablas, listas, [INFERENCIA:] / [AUSENCIA:] y cross-refs)
│   │   ├── BloqueContent.css    ✅ Fase 5
│   │   ├── RutaCritica.tsx      (visualización de los 7 tramos — Fase 6)
│   │   ├── RutaCritica.css      (estilos del waterfall + cards + aristas SVG — Fase 6)
│   │   ├── TocSidebar.astro     (TOC sticky para /metodologia — Fase 6)
│   │   └── SearchWidget.tsx     (wrapper de Pagefind — Fase 7)
│   ├── layouts/
│   │   └── Editorial.astro      (layout base: header + footer + drawer + slot)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── demo.astro
│   │   ├── metodologia.astro
│   │   ├── contacto.astro
│   │   ├── sintesis/
│   │   │   ├── index.astro
│   │   │   ├── mapa/
│   │   │   │   ├── debilidades.astro    ✅ Fase 3
│   │   │   │   └── condicionamientos.astro
│   │   │   ├── reformas/
│   │   │   │   ├── index.astro
│   │   │   │   └── [...codigo].astro    (rutas dinámicas para R-01..R-101)
│   │   │   ├── proyectos/
│   │   │   │   ├── index.astro
│   │   │   │   ├── viables-hoy.astro
│   │   │   │   ├── reforma-estatal.astro
│   │   │   │   ├── reforma-federal.astro
│   │   │   │   └── habilitaciones.astro
│   │   │   ├── conflictos.astro
│   │   │   ├── vacios.astro
│   │   │   ├── riesgos.astro
│   │   │   ├── huecos.astro
│   │   │   └── siguiente.astro
│   │   ├── marco/
│   │   │   ├── index.astro
│   │   │   ├── federal/
│   │   │   │   └── [...slug].astro
│   │   │   └── estatal/
│   │   │       └── [...slug].astro
│   │   └── ordenamiento/
│   │       └── [...tag].astro
│   └── data/
│       ├── debilidades.json
│       ├── condicionamientos.json
│       ├── reformas.json
│       ├── proyectos-3a.json
│       ├── proyectos-3b.json
│       ├── proyectos-3c.json
│       ├── habilitaciones.json
│       ├── conflictos.json
│       ├── vacios.json
│       ├── huecos.json
│       ├── proximos-pasos.json
│       ├── ordenamientos.json   (metadata de los 20 bloques)
│       ├── bloques/             (contenido completo de cada bloque — Fase 5)
│       │   ├── cpeum.json
│       │   └── ...
│       ├── cross-references.json (grafo de relaciones precalculado)
│       └── ordenamiento-meta.json (mapa tag → nombre con formato de display)
│       NOTA: src/data/ contiene SOLO archivos JSON de contenido.
│       No colocar aquí package.json, tsconfig.json ni otros archivos de config.
└── scripts/                     (opcional; parse_markdown.py y normalize_data.py viven en la raíz)

**Nota sobre paths del parser (v1.3):**
- `parse_markdown.py` está en la raíz del repo (`energia-jalisco/parse_markdown.py`).
- Los archivos `.md` fuente (`marco_federal_energetico.md`, `sintesis_ejecutiva_jalisco.md`) están **un nivel arriba**, en `z_SEDES/`.
- El parser usa `SOURCE_ROOT = parent.parent` (apunta a `z_SEDES/`) para leer los `.md`, y `REPO_ROOT = parent` (apunta a `energia-jalisco/`) para escribir los JSON a `src/data/`. **No fusionar estos dos roots.**
```

---

## 4. Schemas JSON

### Taxonomía canónica del campo `tipo` en debilidades (nueva en v1.2)

Las 9 categorías válidas:

1. `Vacío`
2. `Omisión`
3. `Desactualización`
4. `Omisión de implementación`
5. `Vacío estructural`
6. `Conflicto / Restricción`
7. `Restricción excesiva`
8. `Conflicto potencial`
9. `Vacío / Omisión combinado`

El parser actual (`parse_markdown.py`) produce 16 variantes de estos 9 valores por heterogeneidad en el source. `normalize_data.py` colapsa las 16 a las 9 canónicas. Mapeo vigente:

| Raw del parser | → | Canónico |
|---|---|---|
| `Vacío / Omisión` | → | `Vacío / Omisión combinado` |
| `Omisión / Desactualización` | → | `Omisión` |
| `Vacío / Omisión de implementación` | → | `Omisión de implementación` |
| `Vacío / Desactualización` | → | `Desactualización` |
| `Desactualización / Conflicto` | → | `Conflicto potencial` |
| `Desactualización / Vacío` | → | `Desactualización` |
| `Omisión estructural` | → | `Vacío estructural` |
| `Vacío estructural (fragmentación)` | → | `Vacío estructural` |
| `Omisión / saneamiento` | → | `Omisión` |

Si `parse_markdown.py` se re-corre, ejecutar después `python3 normalize_data.py` para re-aplicar la normalización.

### debilidades.json (1A)
```json
[
  {
    "id": "1A.1",
    "n": 1,
    "ord": "CPEJ",
    "art": "Art. 15, Fraccs. VI y VII (omisas)",
    "tipo": "Vacío",
    "prioridad": "Alta",
    "texto": "Ausencia total de referencia constitucional a energía...",
    "reformas": ["R-02"],
    "proyectos": []
  }
]
```

### condicionamientos.json (1B)
```json
[
  {
    "id": "1B.1",
    "n": 1,
    "ord_federal": "CPEUM",
    "art": "Art. 27, párr. 6; Art. 28, párr. 4",
    "tipo": "Restricción",
    "urgencia": "Alta",
    "texto": "Jalisco no puede crear entidad estatal de transmisión..."
  }
]
```

### reformas.json (Sección 2)
```json
[
  {
    "id": "R-01",
    "titulo": "Derecho humano al acceso a energía asequible, limpia y fiable",
    "ordenamiento": "CPEJ",
    "articulo_modificar": "Art. 4° o nueva fracción del Art. 15",
    "fundamento_federal": "CPEUM Art. 4°, párr. 5; Art. 124",
    "nivel": "Reforma estatal suficiente",
    "prioridad": "Alta",
    "tramo_ruta_critica": 1,
    "dependencias": [],
    "debilidades_origen": ["1A.2"],
    "proyectos_habilitados": [],
    "texto_completo": "Incorporar en el catálogo de derechos de la CPEJ..."
  }
]
```
**Reglas especiales para reformas:**
- `tramo_ruta_critica`: `null` para las 36 reformas no asignadas a ningún tramo. La página de ruta crítica las muestra como "Reformas independientes" debajo de la visualización de los 7 tramos.
- **R-101** es la única reforma sin ordenamiento estatal. Su campo `ordenamiento` = `"CPEUM"` (el ordenamiento federal que habría que reformar). Su campo `nivel` = `"Requiere reforma federal previa"`. En la ficha individual de R-101 se muestra un banner visual indicando que es no controlable desde Jalisco.

### proyectos-3a.json, proyectos-3b.json, proyectos-3c.json
```json
[
  {
    "id": "3A.1",
    "seccion": "3A",
    "titulo": "Programa estatal de eficiencia energética y descarbonización...",
    "ord_estatal": "CPEJ + LACCEJ",
    "art_estatal": "CPEJ Art. 50 Fraccs. VIII, X, XXI...",
    "habilitacion_federal": "LGCC Art. 33 Fracc. IV; LPTE Art. 8 Fraccs. VI y VII",
    "condicion": "Sin invadir regulación técnica del SEN...",
    "prioridad": "Alta",
    "prioridad_inferida": true,
    "reformas_requeridas": []
  }
]
```
**Notas sobre el campo `prioridad`:**
- En `proyectos-3b.json` y `proyectos-3c.json` el campo viene del markdown fuente.
- En `proyectos-3a.json` la fuente no traía columna de prioridad. El parser la **infiere** a partir del campo `condicion` mediante reglas explícitas (ver `parse_markdown.py::infer_prioridad_3a`). Cada item lleva `prioridad_inferida: true` para auditabilidad. Distribución actual: 51 Alta / 26 Media / 7 Baja.

### habilitaciones.json (3D)
```json
[
  {
    "id": "3D.1",
    "titulo": "Legislar y operar programas estatales de eficiencia energética...",
    "ord_federal": "CPEUM",
    "art": "Art. 124; Art. 73 Fracc. XXIX-G",
    "condicion": "No invadir planeación SEN ni regulación técnica...",
    "estado": "Explotada",
    "proyectos_vinculados": ["3A.1", "3A.10", "3A.17", "3A.54"]
  }
]
```

### conflictos.json (4A)
```json
[
  {
    "id": "4A.1",
    "titulo": "Atribución a la Comisión para operar mercado de emisiones estatal",
    "polo_estatal": "LACCEJ Art. 45 Fracc. XIV; Arts. 83-87",
    "polo_federal": "LGCC Art. 7 Fracc. IX; Art. 94",
    "riesgo": "Inaplicabilidad / controversia constitucional...",
    "reformas_vinculadas": ["R-07"]
  }
]
```

### vacios.json (4B)
```json
[
  {
    "id": "4B.1",
    "titulo": "Régimen de generación no exclusivo del servicio público...",
    "polo_federal": "CPEUM",
    "art": "Art. 27 párr. 6",
    "riesgo": "Permite restringir por vía reglamentaria iniciativas estatales..."
  }
]
```

### cross-references.json
```json
{
  "R-47": {
    "tipo": "reforma",
    "titulo_corto": "Criterios de eficiencia energética en PMDU...",
    "url": "/sintesis/reformas/R-47",
    "debilidades": ["1A.22"],
    "proyectos": ["3B.16"],
    "conflictos": []
  }
}
```

### ordenamiento-meta.json

**Nota v1.2:** el parser original generaba solo el campo `nombre_completo` (string plano) + `nombre_display`. La spec requiere también `nombre` (objeto `{prefix, core, suffix}`). `normalize_data.py` agrega ese campo derivándolo de `nombre_display`.

```json
{
  "CPEJ": {
    "tag": "CPEJ",
    "slug": "cpej",
    "ambito": "estatal",
    "nombre_completo": "Constitución Política del Estado de Jalisco",
    "nombre": {
      "prefix": "",
      "core": "Constitución",
      "suffix": " Política del Estado de Jalisco"
    },
    "nombre_display": {
      "prefix_italic": "",
      "core_bold_italic": "Constitución",
      "suffix_italic_small": " Política del Estado de Jalisco"
    }
  },
  "LACCEJ": {
    "tag": "LACCEJ",
    "slug": "laccej",
    "ambito": "estatal",
    "nombre_completo": "Ley para la Acción ante el Cambio Climático del Estado de Jalisco",
    "nombre": {
      "prefix": "Ley para la Acción ante el ",
      "core": "Cambio Climático",
      "suffix": " del Estado de Jalisco"
    },
    "nombre_display": {
      "prefix_italic": "Ley para la Acción ante el ",
      "core_bold_italic": "Cambio Climático",
      "suffix_italic_small": " del Estado de Jalisco"
    }
  }
}
```

---

## 5. Páginas — especificación por página

### Home (`/`)

1. **Header fijo**: logo/nombre "Observatorio del Sistema de Energía de Jalisco" a la izquierda (sans, 14px, 500), botón hamburguesa a la derecha.
2. **Hero**: eyebrow centrado "Análisis jurídico-regulatorio · Abril 2026", display heading serif 52px "Sistema estatal de energía de Jalisco", subtitle italic "Ochenta hallazgos, ciento una reformas y doscientos siete proyectos ejecutivos mapeados en la intersección del marco federal vigente desde marzo de 2025."
3. **Métricas globales**: fila de 6 con hairlines verticales (80 / 101 / 207 / 40 / 62 / 20).
4. **Dos tarjetas de navegación** estilo "Our Solutions" de Julius Bär: "Síntesis ejecutiva" y "Marco normativo". Cada una con eyebrow, título serif, descripción de 2 líneas, flecha →.
5. **Bloque de contexto**: prosa editorial breve (3 párrafos) sobre qué es el Observatorio, su audiencia y su metodología.
6. **Footer**: copyright, licencia CC BY-NC-SA 4.0, enlace a contacto, enlace a GitHub, watermark del Observatorio.

### Metodología (`/metodologia`)

Página editorial pura en prosa. Layout: prosa serif 17px max-width 65ch al centro, TOC sticky a la derecha en desktop (componente `TocSidebar.astro`), TOC oculto en mobile. Seis secciones:
- **Fuentes analizadas**: lista de los 20 ordenamientos con formato italic/bold/small (vía `OrdenamientoName.astro`), leídos de `ordenamientos.json`.
- **Reglas operacionales**: atomic analysis, single-domicile routing, citation-anchored, marcadores `[INFERENCIA:]` y `[AUSENCIA:]`, ancla a artículo/fracción/párrafo.
- **Inferencias documentadas** (nueva en v1.5): declaración de las dos inferencias sistemáticas del pipeline, accesibles para auditoría de TJA/Congreso.
  1. Prioridad de los 84 proyectos viables hoy (Sección 3A) inferida desde el campo `condicion` mediante `infer_prioridad_3a`. Reglas: Baja si depende de voluntad federal discrecional; Media si requiere convenio o coordinación con autoridad federal cooperativa; Alta si es ejecutable por acto unilateral del Estado. Distribución resultante: 51 Alta / 26 Media / 7 Baja. Cada item lleva `prioridad_inferida: true` en el JSON.
  2. Normalización de 16 valores no canónicos del campo `tipo` en debilidades (Sección 1A) a 9 categorías canónicas vía `normalize_data.py`. Las 9 categorías: vacío normativo, ambigüedad, conflicto de competencia, omisión de implementación, restricción estructural, redundancia, desactualización, inconsistencia interna, incompletitud.
- **Qué no contiene el estudio**: resumen de Sección 5 (huecos documentales) en lenguaje accesible para audiencia general; link a `/sintesis/huecos`.
- **Fecha de corte y plan de actualización**: fecha de corte editorial 1 de abril de 2026. Plan de actualización por definir.
- **Autoría**: Carlos Aguilar, analista en derecho energético, política pública y administración estatal.

### Contacto (`/contacto`)

Tres bloques separados por hairlines. Sin logos institucionales, sin afiliaciones (autoría individual; logos serían misleading frente a TJA/Congreso al sugerir respaldo institucional inexistente).
- **Formulario Formspree**: campos nombre, organización (opcional), email, mensaje. Endpoint pendiente; se queda placeholder hasta registro en formspree.io.
- **GitHub Issues**: link directo a `github.com/carlosaglr/energia-jalisco/issues` para reportes técnicos y errores tipográficos.
- **Sobre el autor**: nombre, descriptor profesional, link a GitHub. Sin LinkedIn.

### Explorer pages (todas ✅ — Fase 4)

Todas usan el componente `Explorer.tsx` con configuración diferente:
1. Eyebrow + display heading centrado.
2. Subtitle italic.
3. Métricas row (conteos relevantes con hairlines).
4. Hairline divider.
5. Distribution bars (por ordenamiento, tipo, o lo que aplique).
6. Filtros (tabs de prioridad/urgencia + select de ordenamiento/tipo/otro).
7. Count.
8. Lista de items con: número, ordenamiento formateado, tipo en small caps, texto serif, artículo en mono, tag de prioridad/urgencia.
9. Cross-references activos con tooltip.
10. Footer con lista de fuentes.

**Template de configuración** para replicar 1A en otras secciones: ver `src/pages/sintesis/mapa/debilidades.astro` como referencia. La estructura del objeto `config` que se pasa a `<Explorer>` es reutilizable; solo cambian los campos del schema de entrada y los labels.

**Nota sobre schemas heterogéneos:** algunas secciones tienen schemas que no encajan 1:1 con el de debilidades:
- **Sección 2 (reformas)** tiene `nivel` en lugar de `tipo`, no tiene ordenamiento estatal simple (usa `ordenamiento` + `fundamento_federal`), y tiene `tramo_ruta_critica`. Requiere o bien una config custom (configurable) o una extensión del Explorer.
- **Sección 4A (conflictos)** tiene dos polos (`polo_estatal` + `polo_federal`) en lugar de un `ord` único. La distribución por ordenamiento requiere decidir por qué polo agrupar.
- **Sección 4B (vacíos)** solo tiene `polo_federal`, no hay prioridad ni tipo. Los filtros son distintos.
- **Sección 6 (próximos pasos)** tiene estructura de timeline/secuencia; puede convenir una visualización temporal en lugar de lista plana.

Evaluar al llegar a cada sección si el Explorer genérico basta con nueva config, o si requiere extensión.

### Ficha individual de reforma (`/sintesis/reformas/[codigo]`)

Página editorial con:
- Eyebrow: `REFORMA · R-47`.
- Título serif.
- Metadata: ordenamiento, artículo a modificar, nivel, prioridad, tramo de ruta crítica.
- Texto completo del análisis.
- Sección "Origen": debilidades que la motivan (con links).
- Sección "Desbloquea": proyectos que habilita (con links).
- Sección "Depende de": reformas previas necesarias (con links).
- Navegación ← →: reforma anterior, siguiente.

### Ficha de ordenamiento (`/marco/federal/[slug]` y `/marco/estatal/[slug]`)

Plantilla única que renderiza las 6 secciones del bloque:
1. Competencias federales exclusivas / Facultades estatales habilitadas.
2. Vacíos y ambigüedades.
3. Conflictos de competencia.
4. Reformas estructurales necesarias.
5. Proyectos ejecutivos habilitados.
6. Tabla de debilidades/implicaciones críticas.

Cada sección con heading serif, prosa editorial, tablas con cross-references.

### Vista transversal (`/ordenamiento/[tag]`)

Para un tag dado (ej. LACCEJ), muestra en una sola página:
- Nombre completo formateado del ordenamiento.
- Debilidades de 1A que mencionan este ordenamiento.
- Reformas de Sección 2 que lo modifican.
- Proyectos 3A/3B que lo invocan.
- Conflictos 4A donde aparece como polo estatal.
- Link a la ficha completa del bloque en `/marco/`.

### Ruta crítica (`/sintesis/ruta-critica`)

**Reubicada en v1.5**: antes era sección inferior de `/sintesis/reformas`. Ahora es página dedicada.

Estructura de la página:
1. Eyebrow `SÍNTESIS · RUTA CRÍTICA` + display heading + subtitle italic.
2. MetricsRow: 7 tramos · 65 reformas en ruta · 36 independientes · R-101 federal no controlable.
3. Hairline.
4. `<RutaCritica>` (React island) — visualización vertical waterfall.
5. Hairline.
6. Bloque "Reformas independientes" — las 36 con `tramo_ruta_critica: null` en grilla simple sin aristas, agrupadas por `ordenamiento`.
7. Bloque "R-101 — reforma federal no controlable" con banner.

**Visualización (`RutaCritica.tsx`)** — vertical waterfall:
- 7 bandas horizontales a ancho completo, una por tramo. Cada banda tiene su altura natural según número de reformas (T6 sustancialmente más alta que T2 o T3, lo cual es informativo).
- Cabecera de banda: eyebrow del tramo (`TRAMO 1 · ANCLAJE CONSTITUCIONAL`) + descripción de 1 línea.
- Cards de reforma dentro de cada banda. Card minimal: código R-NN, título corto, badge de prioridad.
- **Aristas SVG intra-tramo** conectan cards según el campo `dependencias[]`. Ejemplos: T1: R-01 → R-02 → R-03 → R-04; T3: R-21 → R-22 → R-49 → R-94; T4: R-12 → R-69 → R-29 → R-25; T5: R-54 → R-55 → R-56 → R-57 → R-83 → R-84 → R-86. T2 (R-06, R-43, R-65, R-73) son paralelas sin aristas.
- **T6 sub-agrupada**: las 35 reformas se sub-agrupan internamente por `ordenamiento` (sub-cadenas sectoriales: solar, biocombustibles, geotermia, etc.). Cada sub-cadena dentro de T6 con su propio cluster de cards y aristas.
- Inter-tramo: hairline horizontal con label `T1 ⊢ T2` indicando precondición.

**Pre-procesamiento en frontmatter `.astro`** (build-time):
1. Particionar `reformas.json`: `tramo != null` → 65 dentro de viz; `tramo == null` → 36 al bloque inferior.
2. Agrupar las 65 por `tramo_ruta_critica` (1..7).
3. Para T6: sub-agrupar por `ordenamiento`.
4. Construir índice de dependencias inversas (sucesoras) además del directo (predecesoras) para resolución transitiva eficiente en hover.

**Interactividad**:
- **Hover** sobre card R-NN: resalta el conjunto **transitivo** de predecesoras y sucesoras (resolución recursiva). Resto de cards atenúa a opacity 0.3. Aristas no involucradas también se atenúan.
- **Click** en card: navegación full-page a `/sintesis/reformas/R-NN`. No modal.

**Mobile**: vista degradada — lista por tramo sin aristas SVG. Cards mantienen click. Eyebrow + descripción de tramo se mantienen.

**Distribución por tramo** (referencia): T1=7, T2=4, T3=3, T4=6, T5=7, T6=35, T7=3 (total asignadas=65). 36 independientes + 101 totales.

**R-101**: card con borde y eyebrow distintivo en bloque inferior, banner explicando que la reforma requiere acción del Congreso de la Unión y no es controlable desde Jalisco.

### Página de reformas (`/sintesis/reformas`)

Solo el explorer de reformas (no contiene la viz de ruta crítica desde v1.5). Mantiene link prominente a `/sintesis/ruta-critica` arriba del explorer.

### Sección 4C — Casos de máximo riesgo

Página editorial pura (no explorer). Dos bloques narrativos largos en prosa serif, con cross-references inline. Cada caso con heading, análisis, y reformas vinculadas.

### Sección 5 — Huecos documentales

Lista agrupada en 4 subsecciones (reglamentos pendientes, marcos no cargados, normas estatales pendientes, brechas residuales). Cada item en prosa serif compacta. No requiere filtros ni explorer.

---

## 6. Paquete defensivo anti-scraping + SEO

### SEO
- Sitemap XML generado por Astro.
- Meta tags por página: title, description, canonical URL, Open Graph (og:title, og:description, og:image, og:url), Twitter card.
- Estructura semántica: h1 único por página, h2/h3 jerárquicos, nav, main, article, footer.
- Schema.org JSON-LD en home: `Organization`, `WebSite`, `BreadcrumbList`.

### Anti-scraping

#### robots.txt
```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Yandex
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: Omgilibot
Disallow: /

User-agent: *
Crawl-delay: 10
```

#### Meta tags en todas las páginas
```html
<meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
<meta name="ai-content-declaration" content="not-for-training" />
```

#### Headers HTTP (configurar en Vercel/Netlify)
```
X-Robots-Tag: noai, noimageai
```

#### Cloudflare (si se activa)
- Bot Fight Mode: activado.
- AI Scrapers and Crawlers: bloqueados.
- Rate limiting: 100 req/min por IP.
- Challenge para IPs sospechosas.

#### Licencia
Creative Commons BY-NC-SA 4.0. Texto visible en footer de todas las páginas:

> © 2026 Observatorio del Sistema de Energía de Jalisco. Contenido bajo licencia CC BY-NC-SA 4.0. Se permite compartir y adaptar con atribución, sin fines comerciales, bajo la misma licencia.

#### Copyright en HTML (comentario invisible para scrapers que ignoren el footer)
```html
<!-- 
  © 2026 Observatorio del Sistema de Energía de Jalisco
  Autor: Carlos Aguilar
  Licencia: CC BY-NC-SA 4.0
  URL canónica: https://energia-jalisco.vercel.app
  Repo: https://github.com/carlosaglr/energia-jalisco
  Contenido protegido. Uso no autorizado será reportado vía DMCA.
  Este contenido no está autorizado para entrenamiento de modelos de IA.
-->
```

#### Watermark en visualizaciones
Cada explorer y visualización interactiva incluye al pie:
```
Observatorio del Sistema de Energía de Jalisco · CC BY-NC-SA 4.0
```

---

## 7. Fases de ejecución

### Fase 1 — Data extraction (Parser) ✅ COMPLETADA
Script Python que lee `marco_federal_energetico.md` y `sintesis_ejecutiva_jalisco.md` y produce todos los JSON de `src/data/`.
Entregable: 35 archivos JSON generados + script reproducible (`parse_markdown.py`).

### Fase 2 — Design system + layout base ✅ COMPLETADA
Archivos CSS (tokens, typography, components, layout, global) + `Editorial.astro` layout + `Header.astro` + `Footer.astro` + `Drawer.astro` + componentes Astro base + home page + demo page.
Entregable: proyecto Astro funcional con home page estática visible en `localhost:4321`.
**Nota de implementación:** Opus entregó archivos planos en la raíz; se reorganizaron manualmente a la estructura de carpetas correcta (`src/pages/`, `src/layouts/`, `src/components/`, `src/styles/`, `src/data/`).

### Fase 3 — Explorer genérico ✅ COMPLETADA
`Explorer.tsx` + `CrossRef.tsx` + `Explorer.css` + `normalize_data.py` + página `/sintesis/mapa/debilidades` funcional con los 80 items, distribución por ordenamiento, filtros por prioridad y por ordenamiento/tipo, tooltips de cross-reference.
**Commit en GitHub:** 2 commits en `main`, publicados en `github.com/carlosaglr/energia-jalisco`.
**Decisiones tomadas documentadas en NOTES.md del repo.**
Entregable: `/sintesis/mapa/debilidades` funcional con datos reales + infraestructura lista para replicar en Fase 4.

### Fase 4 — Todas las explorer pages ✅ COMPLETADA
Configurar Explorer para 1B, 2, 3A, 3B, 3C, 3D, 4A, 4B, 6. Crear overview pages (síntesis, proyectos). Crear fichas individuales de reformas. Crear narrativas 4C y huecos 5.
Entregable: todas las páginas de síntesis funcionales. **Cumplido**: 15 páginas en total (10 Explorer + 2 overviews + 1 ruta dinámica con 101 instancias + 4C narrativas + 5 huecos).

### Fase 5 — Páginas de ordenamientos ✅ COMPLETADA
Plantilla de bloque + 20 fichas + vistas transversales.
Entregable: `/marco/` y `/ordenamiento/` completos. **Cumplido**: overview `/marco` con 20 NavCards + 20 fichas individuales (`/marco/federal/<slug>` y `/marco/estatal/<slug>` vía ruta catch-all `/marco/[...slug].astro`) + 20 vistas transversales (`/ordenamiento/[tag]`). Componente `BloqueContent.tsx` para renderizar el markdown de cada bloque con cross-references.

### Fase 6 — Páginas singulares
Home final (`/`), metodología (`/metodologia`), contacto (`/contacto`), ruta crítica (`/sintesis/ruta-critica` — página dedicada en v1.5, ya no sección inferior de `/sintesis/reformas`). Componentes nuevos: `RutaCritica.tsx`, `RutaCritica.css`, `TocSidebar.astro`. Las narrativas 4C y huecos 5 ya se entregaron en Fase 4.
Entregable: 4 páginas + 3 componentes nuevos. Sitio editorialmente completo.

### Fase 7 — Navegación, búsqueda, cross-references
Drawer con navegación jerárquica completa. Pagefind integrado. Cross-references resueltos en todas las tablas y listas con tooltips.
Entregable: navegación y búsqueda funcionales.

### Fase 8 — Deploy + paquete defensivo
Publicación en Vercel. robots.txt, meta tags, headers, Cloudflare, licencia, watermarks.
Entregable: sitio publicado y protegido.

---

## 8. Prompts sugeridos para cada fase

### Fase 1
> Estoy en el proyecto "Observatorio del Sistema de Energía de Jalisco". Consulta ARCHITECTURE.md para contexto completo. Necesito el parser Python que lee `marco_federal_energetico.md` y `sintesis_ejecutiva_jalisco.md` (ambos en el knowledge del proyecto) y produce los JSON definidos en la Sección 4 del ARCHITECTURE.md. Genera el script completo y ejecútalo sobre los archivos fuente.

### Fase 2
> Consulta ARCHITECTURE.md Sección 2 (Design system). Genera los archivos CSS: tokens.css, typography.css, components.css, layout.css. Luego crea el proyecto Astro base con Editorial.astro layout, Header, Footer, Drawer, y una página demo que renderice todos los componentes base.

### Fase 3
> Consulta ARCHITECTURE.md Secciones 2, 4 y 5. Crea el componente Explorer.tsx genérico para React en Astro. Configúralo para la página de debilidades 1A usando debilidades.json. Incluye el componente CrossRef.tsx con tooltips. La página debe verse exactamente como el widget Julius Bär aprobado en el chat anterior.

### Fase 4 (nuevo en v1.2)
> Consulta ARCHITECTURE.md v1.2 Secciones 3, 4, 5 y el archivo NOTES.md del repo. Fase 3 está completada: existe `Explorer.tsx` genérico + configuración reutilizable vía objeto `config`. Vamos a replicar la arquitectura para las 8 secciones restantes, una a la vez. Comencemos con **1B condicionamientos** (34 items, schema casi idéntico a 1A). Generá `src/pages/sintesis/mapa/condicionamientos.astro` manteniendo el diseño Julius Bär de debilidades. El Explorer debería reutilizarse solo cambiando el objeto `config`, sin tocar el .tsx. Recordá: concatenación con `+` en componentes React (no template literals).

(Continuar para cada fase con referencia al ARCHITECTURE.md)

---

## 9. Decisiones congeladas — resumen ejecutivo

| Decisión | Valor |
|---|---|
| Nombre | Observatorio del Sistema de Energía de Jalisco |
| Idioma | Español |
| Dark mode | No (solo modo claro) |
| Navegación | Drawer hamburguesa (Julius Bär) |
| Búsqueda | Pagefind |
| Cross-references | Links en tablas y listas + tooltip rico al hover |
| Audiencia | Pública y abierta |
| Repo | GitHub público: `github.com/carlosaglr/energia-jalisco` |
| Stack | Astro 5 + React 19 (islands) + CSS vanilla |
| Deploy | Vercel/Netlify gratis |
| Protección | Cloudflare gratis + robots.txt + meta noai + CC BY-NC-SA 4.0 |
| Contacto | Formspree + GitHub Issues |
| Ámbito | Síntesis ejecutiva + marco federal/estatal completo, conectados |
| Monetización v0 | Contenido público; revenue vía consultoría derivada |
| Diseño | Julius Bär: serif ligero, navy, hairlines, small caps, centrados |
| Tipos canónicos de debilidades | 9 categorías (ver Sección 4) |
| Strings en .tsx/.jsx | Concatenación con `+`, no template literals |
| Post-parser | Correr `normalize_data.py` tras cada ejecución de `parse_markdown.py` |

---

**Fin de ARCHITECTURE.md v1.7**
