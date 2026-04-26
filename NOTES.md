# NOTES.md — Estado de ejecución y deuda técnica

**Última actualización:** Abril 2026, cierre de Fase 7.

Este archivo complementa `ARCHITECTURE.md`. Mientras el ARCHITECTURE define **qué** se construye, este registra **lo que hay que saber** para no tropezar con decisiones ya tomadas o bugs conocidos.

---

## 1. Deuda técnica identificada

### 1.1 `parse_markdown.py` no genera datos canónicos

**Síntomas:**
- El campo `tipo` en `debilidades.json` sale con 16 valores distintos en vez de las 9 categorías canónicas definidas en el widget aprobado.
- `ordenamiento-meta.json` genera el campo `nombre_completo` (string plano) pero no el campo `nombre` (objeto `{prefix, core, suffix}`) que pide la spec.

**Workaround actual:**
`normalize_data.py` en la raíz del repo arregla ambos problemas post-parse. Es idempotente: correrlo N veces produce el mismo resultado.

**Flujo correcto tras cualquier cambio al source:**
```bash
python3 parse_markdown.py      # regenera los 35 JSON en src/data/
python3 normalize_data.py      # normaliza tipos y agrega campo nombre
```

**Fix permanente pendiente:**
Plegar la lógica de `normalize_data.py` dentro de `parse_markdown.py` para que el parser produzca datos canónicos directamente.

### 1.2 Campo `nombre` derivado, no canónico

`normalize_data.py` construye `nombre` copiando los campos de `nombre_display`:
```
nombre.prefix  = nombre_display.prefix_italic
nombre.core    = nombre_display.core_bold_italic
nombre.suffix  = nombre_display.suffix_italic_small
```

Funciona para el uso actual (tooltip del `<a>` en `OrdName`), pero la partición no siempre es gramatical. Ejemplo: `CPEJ.nombre.core = "Constitución"` en vez de "Constitución Política del Estado de Jalisco". Es decisión visual, no gramatical. Aceptable mientras solo se use para tooltip.

### 1.3 `cross-references.json`: cobertura no verificada

El parser genera entradas para los IDs que detecta en el source, pero **no hay validación** de que todos los códigos referenciados en prosa tengan su entrada correspondiente. Items sin entrada se renderizan con `.xref-missing` (texto gris punteado, sin tooltip).

**Validación pendiente:** script que extraiga todos los códigos con regex de los textos en todos los JSON de `src/data/`, los compare con las keys de `cross-references.json` y reporte los faltantes.

### 1.4 Path layout del parser

`parse_markdown.py` usa dos roots distintos:
- `SOURCE_ROOT = parent.parent` → `z_SEDES/` (donde están los `.md` fuente)
- `REPO_ROOT = parent` → `energia-jalisco/` (donde se escriben los JSON)

Refleja la organización física actual (los `.md` viven fuera del repo). Si se mueven adentro, simplificar a un solo `BASE`.

### 1.5 Inferencia de prioridad en proyectos 3A

La fuente no documenta prioridad para los 84 proyectos viables. El parser **infiere** mediante reglas explícitas en `infer_prioridad_3a(condicion)`:

- **Baja**: voluntad federal discrecional, contrato con CFE, invitación discrecional, voluntad potestativa.
- **Media**: convenio o coordinación con SENER, CONUEE, SEMARNAT, INECC.
- **Alta**: acto unilateral del Estado, restricción de límite (no invadir, congruencia) sin dependencia activa.
- **Default**: Alta.

Cada item lleva `prioridad_inferida: true`. Distribución actual: 51 Alta / 26 Media / 7 Baja.

### 1.6 `marco_federal_energetico.md` perdió 11 bloques entre Fase 1 y Fase 4

**Resuelto en Fase 5.** El `.md` fuente había perdido 11 de 20 bloques H2 originales (8 federales + 3 estatales: CPEJ, LACCEJ, LPIPSEJM). Reconstruidos desde los JSON de `fase1/src/data/bloques/` y reinsertados en orden canónico (federales primero, estatales después).

Causa raíz desconocida: probablemente el archivo fue editado/reemplazado fuera del flujo del repo. **Lección operativa**: evitar editar el `.md` fuera del editor del autor sin commit intermedio.

---

## 2. Decisiones técnicas tomadas

### 2.1 Concatenación con `+` en .tsx/.jsx

Regla del repo. Justificación: copy-paste desde chat puede sustituir backticks ASCII (U+0060) por Unicode parecidos (U+02CB, U+2035). esbuild solo acepta U+0060. La concatenación con `+` es ASCII plano.

### 2.2 `OrdName` con 3 niveles de fallback

Tolera data incompleta en `ordenamiento-meta.json`:
1. `nombre_display.core_bold_italic` → render completo italic/bold/small.
2. `nombre.core` → render usando `nombre`.
3. Ninguno → `meta.tag` como texto plano.

### 2.3 Configuración del Explorer vive en el .astro

El Explorer no sabe nada específico de cada sección. Recibe `data`, `config`, `ordenamientoMeta`, `crossRefs`. El conocimiento "esto es 1A / esto es 3D" vive en el `.astro` de cada página.

### 2.4 Métricas se computan en build time en el .astro

El Explorer recibe números ya calculados. No agregar lógica de cálculo al Explorer.

### 2.5 Regex de cross-references en `CrossRefText.tsx`

Patrón: `/\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g`. Detecta reformas (R-1..R-101) e items de secciones (1A.3, 3B.12, etc.). `Explorer.tsx` mantiene su propia copia del patrón.

Si Fase 6+ introduce nuevos tipos de código, extender en ambos archivos.

### 2.6 Extensión de `Explorer.tsx` (Fase 4)

Tres campos opcionales en `ItemFields` del config:
- `titulo` (string): renderiza `<h3>` adicional con el título del item.
- `badge` (string): badge tipográfico extra en la meta-line.
- `tagXref` (string): nombre del campo (array de códigos) que envuelve el tag de la derecha con tooltip rico.

### 2.7 Normalización de clases CSS de tags

`PriorityTag` reemplaza espacios por guiones: `(value || '').toLowerCase().replace(/\s+/g, '-')`. Sin esto, valores como "Parcialmente explotada" generaban dos clases separadas en HTML (`.tag-parcialmente .explotada`).

### 2.8 Tags CSS específicos por sección

En `Explorer.css`:
- `.tag-explotada`, `.tag-parcialmente-explotada`, `.tag-ociosa`, `.tag-ociosa-diferida` (3D, gradiente navy).
- `.tag-constitucional`, `.tag-legal` (4B).
- `.tag-30-días`, `.tag-60-90-días`, `.tag-120-180-días`, `.tag-240-días`, `.tag-continuo` (sección 6).

Tercera columna del grid de items: 170px globalmente. Tags con `width: 160px` y `word-break: keep-all`.

### 2.9 Inconsistencia `xref-wrap` vs `xref-wrapper`

`components.css` definía `.xref-wrapper` pero `CrossRef.tsx` usa `.xref-wrap`. Eran selectores distintos. Fix: `components.css` ahora cubre ambos:
```css
.xref-wrap, .xref-wrapper { position: relative; display: inline-block; }
```

### 2.10 Ruta dinámica unificada para fichas de ordenamiento (Fase 5)

En lugar de `/marco/federal/[slug]` y `/marco/estatal/[slug]` se usó una sola ruta catch-all `/marco/[...slug].astro` que internamente discrimina por `ambito` desde `ordenamiento-meta.json`. `getStaticPaths` genera las 20 URLs en build.

Las URLs finales sí mantienen el patrón `/marco/federal/<slug>` y `/marco/estatal/<slug>` (no se exponen como `/marco/<slug>` plano).

### 2.11 Vistas transversales `/ordenamiento/[tag]` case-sensitive

URLs usan el tag canónico exacto (mayúsculas/minúsculas según ARCHITECTURE): `/ordenamiento/CPEJ`, no `/ordenamiento/cpej`. Si se quisiera tolerar minúsculas, agregar normalización en `getStaticPaths` o redirect.

### 2.12 `BloqueContent.tsx` (Fase 5)

Parser de markdown ligero para las fichas de ordenamiento. Soporta:
- Listas (con bullets `-` y subbullets indentados).
- Tablas markdown (header + separator + data rows con pipes).
- Marcas semánticas `[INFERENCIA:]` y `[AUSENCIA:]` con styling distinguible.
- Cross-references: cualquier código R-NN o NA.NN dentro del texto se envuelve con `CrossRef` para tooltip.

No usa una librería externa de markdown — implementación propia (~150 líneas) para mantener bundle pequeño (2.36 KB gzipped).

---

## 3. Cuándo usar `<CrossRef>` vs link plano

- **Texto narrativo** (`<p>` con párrafos largos) → `<CrossRefText>`. Detecta automáticamente todos los códigos.
- **Lista de códigos sueltos** (chips de Vínculos) → `<CrossRef code={c} crossRefs={crossRefs} />`. Cada chip aislado.
- **Tag a la derecha de un item Explorer** → `tagXref` en el config del Explorer.
- **Bloque markdown** (fichas de ordenamiento) → `BloqueContent` ya lo maneja internamente.
- **Link interno sin tooltip** → `<a>` plano. Útil en navegación entre páginas.

---

## 4. Estado del repo al cierre de Fase 5

**Build:** 158 páginas estáticas, 0 errores.

**Páginas funcionales:**
- `/`, `/demo`
- `/sintesis` (overview), `/sintesis/mapa/{debilidades, condicionamientos}`, `/sintesis/reformas` (+ 101 fichas dinámicas)
- `/sintesis/proyectos` (overview), `/sintesis/proyectos/{viables-hoy, reforma-estatal, reforma-federal, habilitaciones}`
- `/sintesis/{conflictos, vacios, riesgos, huecos, siguiente}`
- `/marco` (overview con 20 cards), `/marco/federal/<slug>` (×9), `/marco/estatal/<slug>` (×11)
- `/ordenamiento/<TAG>` (×20)

**Componentes nuevos en Fase 5:** `BloqueContent.tsx` + `BloqueContent.css`.

**Stack:** Astro 5.18.1, React 19.2.5, `@astrojs/react` 5.0.3.

**Remoto:** `github.com/carlosaglr/energia-jalisco`, sincronizado.

---

## 5. Qué NO está resuelto (para evitar preguntas redundantes)

- Fuentes self-hosted (`public/fonts/*.woff2`) → pendiente; usa fallbacks del sistema.
- Deploy a Vercel/Netlify → Fase 8.
- `robots.txt`, headers, Cloudflare, licencia en footer → Fase 8.

---

## 7. Fase 6 — Decisiones técnicas

### 7.1 Validaciones duras de conteo en frontmatter
Tanto el home como `/sintesis/ruta-critica` validan en frontmatter `.astro` que los conteos derivados de los JSON coincidan con los esperados (80/101/207/40/62/20 en home; 65 en ruta + 36 independientes + R-101 = 101, T6 entre 8 y 12 sub-bandas, dependencias hacia ids existentes en ruta crítica). Cualquier desviación aborta el build con mensaje explícito. Razón: detectar regresiones del parser temprano, antes de que lleguen a página estática publicada.

### 7.2 TocSidebar como componente Astro estático
`TocSidebar.astro` se implementa como componente estático sin React. El scroll suave se delega a CSS (`scroll-behavior: smooth` ya está en `tokens.css`). Razón: la única "interactividad" del TOC es navegación con anchors, lo cual el navegador ya resuelve sin JS.

### 7.3 RutaCritica.tsx valida props internamente
El componente recibe `tramos`, `forward`, `backward` ya cocidos desde el frontmatter, pero igualmente verifica `tramos.length === 7`, suma de reformas en tramos = 65, T6 con sub-bandas en rango 8–12, y que sólo T6 tenga sub-bandas. Si falla cualquier check, renderiza un banner rojo visible (en dev y prod) con el detalle. Razón: detectar regresiones de datos sin dejar el sitio "silenciosamente roto".

### 7.4 Mobile de la ruta crítica vía CSS, no JS
`@media (max-width: 768px)` en `RutaCritica.css` oculta la capa SVG (`display: none`) y reformatea el flex-row a column. No se detecta viewport en JS. Las cards siguen siendo `<a>` clicables.

### 7.5 Discrepancia T6 brief vs datos
La sección §5.1.2 del FASE6_BRIEF.md listaba 8 sub-cadenas para T6 con asignaciones de R-NN específicas. Al implementarlo se detectó que el campo `tramo_ruta_critica` vigente en `reformas.json` no coincide con esa lista: R-20 está en T1, R-25 en T4, R-73 en T2, R-83/R-84/R-86 en T5, R-94 en T3 (no en T6 como sugería el brief). T6 real son 35 reformas distribuidas en 9 sub-bandas por ordenamiento.

**Resolución:** el frontmatter de `/sintesis/ruta-critica` deriva las sub-bandas de T6 directamente del campo `ordenamiento` de los datos, sin lista hardcodeada. Orden por R-NN mínimo de cada sub-banda. La lista del brief queda como histórica/ilustrativa.

**Recomendación de seguimiento (fuera de Fase 6):** actualizar la prosa de `sintesis_ejecutiva_jalisco.md` líneas 815-823 para reflejar las asignaciones refinadas, o eliminar la lista detallada y dejar solo el header de tramo.

### 7.6 Dependencias inter-tramo e inversas
La regla original del brief decía "abortar build si predecesor en tramo posterior al sucesor". Tres dependencias inversas existen en los datos: R-20 (T1) ← R-13 (T6), R-22 (T1) ← R-21 (T3), R-49 (T1) ← R-21 (T3).

**Causa documentada:** el orden de ejecución legislativa (T1 primero por jerarquía constitucional) no coincide con la derivación conceptual (una reforma constitucional puede fundarse conceptualmente en una reforma legal posterior). La fuente original `sintesis_ejecutiva_jalisco.md` línea 808 menciona explícitamente "R-22 depende de R-21"; la asignación posterior de R-22 a T1 y R-21 a T3 generó la inversión.

**Resolución v1.6:** las dependencias inter-tramo —incluidas las inversas— no se renderizan como aristas en la viz (el orden de bandas ya implica el orden legislativo). Sí se preservan en el campo `dependencias[]` y siguen activas para el cálculo del conjunto transitivo en hover. La validación de frontmatter solo aborta si una dependencia apunta a un id que **no existe** en `reformas.json`.

### 7.7 R-101 dentro de T7 + bloque editorial destacado
R-101 está asignada a T7 en los datos (junto con R-72 y R-80, las otras dos reformas que requieren reforma federal previa). Se renderiza como cualquier reforma de T7 dentro del waterfall y, adicionalmente, en un bloque editorial inferior con eyebrow "REFORMA FEDERAL · NO CONTROLABLE DESDE JALISCO". Es la única CPEUM en todo el dataset. La duplicación es deliberada: la viz preserva el orden completo, el bloque editorial enfatiza el caso especial.

---

## 8. Fase 7 — Decisiones técnicas

### 8.1 Pagefind como motor de búsqueda
Elegido por: estático (sin servidor), funciona con build de Astro, gratis, índice incremental, soporta español con stemming básico, indexa solo HTML (no requiere parser custom de markdown). El paso `pagefind --site dist` agregado al script `build` de `package.json` corre después de Astro y produce `dist/pagefind/` con `pagefind.js` (~14kb), `wasm.es.pagefind` (índice español), `wasm.unknown.pagefind` y los fragmentos del índice. `dist/` ya estaba en `.gitignore`.

### 8.2 Modal flotante elegido sobre página dedicada o sidebar fijo
Razones: no compite con el drawer hamburguesa por espacio en el header; no rompe la jerarquía editorial Julius Bär (centrados, hairlines, prosa serif); convención web reconocible (atajo `/`); permite navegación rápida sin perder la página actual.

### 8.3 Carga dinámica del bundle de Pagefind
`SearchWidget.tsx` hace `import('/pagefind/pagefind.js')` al primer abrir del modal. Cache en `window.__pagefind__`. Razón: el WASM pesa ~80kb; cargarlo on-demand mantiene el TTI bajo en home y resto de páginas no usadas para búsqueda.

### 8.4 Agrupación de resultados por sección
Cada página inyecta `<span data-pagefind-meta="seccion:..." hidden>` al inicio de su `<main>`. Esto permite que el modal agrupe resultados por sección ("Síntesis ejecutiva", "Marco normativo", "Metodología", "Contacto", "Inicio") y dé contexto al usuario más útil que solo la URL. La prop `seccion?` de `Editorial.astro` centraliza el comportamiento; cada página la setea explícitamente.

### 8.5 `data-pagefind-body` solo en `<main>`
Sin esta directiva, Pagefind indexaría header/footer/drawer (5778 → mayor cantidad de palabras pero con muchas duplicadas y ruido). Con `<main data-pagefind-body>`, el índice cubre solo el contenido editorial. El contador final es 5778 palabras únicas en 161 páginas, idioma `es` autodetectado.

### 8.6 Drawer en 3 niveles
Nivel 1 (5 secciones, links): Inicio, Síntesis ejecutiva, Marco normativo, Metodología, Contacto. Nivel 2 (5 agrupadores, `<span>` no clicable): Hallazgos, Reformas, Proyectos, Federal, Estatal. Nivel 3 (URLs reales). Los 20 ordenamientos se renderizan dinámicamente desde `ordenamientos.json` con validación dura en frontmatter (throw si federales ≠ 9 o estatales ≠ 11). Item activo detectado comparando `Astro.url.pathname` normalizado (sin trailing slash).

### 8.7 Atajo `/` con guarda contra inputs
Script inline en `Editorial.astro` escucha `keydown` en `document` y dispara `CustomEvent('open-search')`. Bloquea cuando `document.activeElement.tagName` es `INPUT/TEXTAREA/SELECT` o el elemento es `contentEditable`. Inline porque debe ejecutarse antes que cualquier hidratación de React island.

### 8.8 Concatenación con `+` en SearchWidget.tsx
Verificado con `grep -c '\\\`' SearchWidget.{tsx,css}` → 0 backticks. Mantiene la regla v1.2.

### 8.9 Auditoría de cross-references — tabla por página

| Página | Estado pre-auditoría | Cambio aplicado en Fase 7 |
|---|---|---|
| `/sintesis/mapa/debilidades` (1A) | parcial: `texto` sin códigos pero `reformas[]` sí | `tagXref: 'reformas'` |
| `/sintesis/mapa/condicionamientos` (1B) | cubierto | sin cambio (datos sin códigos) |
| `/sintesis/reformas` (2) | cubierto vía `texto: 'texto_completo'` (Fase 4) | sin cambio |
| `/sintesis/proyectos/viables-hoy` (3A) | cubierto | sin cambio. Residual documentado |
| `/sintesis/proyectos/reforma-estatal` (3B) | parcial | `tagXref: 'reformas_requeridas'` |
| `/sintesis/proyectos/reforma-federal` (3C) | cubierto | sin cambio. Residual documentado |
| `/sintesis/proyectos/habilitaciones` (3D) | parcial | `tagXref: 'proyectos_vinculados'` |
| `/sintesis/conflictos` (4A) | cubierto (Fase 4: `tagXref: 'reformas_vinculadas'`) | sin cambio |
| `/sintesis/vacios` (4B) | cubierto (datos sin códigos) | sin cambio |
| `/sintesis/siguiente` (6) | cubierto (Fase 4: `tagXref: 'reformas_referenciadas'` + RichText sobre `accion`) | sin cambio |
| `/sintesis/reformas/[codigo]` | cubierto (Fase 4) | sin cambio |
| `/sintesis/riesgos` (4C), `/sintesis/huecos` (5) | cubierto (Fase 4) | sin cambio |
| `/marco/<ambito>/<slug>` | cubierto (Fase 5 vía `BloqueContent`) | sin cambio |
| `/ordenamiento/[tag]` | parcial: lista plana sin RichText | importé `CrossRefText` y lo apliqué al texto truncado de cada item |
| `/sintesis/ruta-critica` | n/a (cards sin códigos en texto visible) | sin cambio |

### 8.10 Casos residuales no cubiertos
2 ítems en 207 proyectos tienen un código embebido en un campo que el Explorer renderiza como `tipo` pequeño en la meta-line, sin pasar por `RichText`:
- **3A.78** (`condicion`): "Decisión del Presidente del Consejo (Gobernador). Voto permanente requiere ver R-94" — el R-94 no activa tooltip.
- **3C.11** (`impacto`): "Reconocimiento estatal como ejecutor territorial; complementario a 3C.3" — el 3C.3 no activa tooltip.

Cubrirlos requeriría modificar `Explorer.tsx` para envolver `tipo` con RichText, lo cual el brief §12.3 instruye evitar (la extensibilidad del Explorer ya está diseñada vía `tagXref`). Para esos 2 casos, el código es accesible vía la búsqueda Pagefind y vía la ficha individual de la reforma R-94 (ya con tooltips). Cobertura efectiva del sitio: ≥99%.

---

## 6. Workflow estándar

```bash
# Re-procesar datos desde fuente
python3 parse_markdown.py
python3 normalize_data.py

# Dev server
npm run dev

# Build
npm run build

# Limpiar cache si CSS no refleja cambios
rm -rf node_modules/.vite .astro
npm run dev
# y Cmd+Shift+R en navegador
```
