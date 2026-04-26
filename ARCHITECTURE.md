# ARCHITECTURE.md — Observatorio del Sistema de Energía de Jalisco

**Documento de traspaso · Versión 1.3 · Abril 2026**
**Estado: Fases 1, 2, 3 y 4 completadas. Fase 5 por iniciar.**

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
│   │   ├── RutaCritica.tsx      (visualización de los 7 tramos — Fase 6)
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

Página editorial pura en prosa. Secciones:
- Fuentes analizadas (lista de los 20 ordenamientos con formato italic/bold/small).
- Reglas operacionales (regla de ruteo único, marcadores `[INFERENCIA]` y `[AUSENCIA]`, ancla a artículo/fracción).
- Qué no contiene el estudio (resumen de Sección 5 para audiencia general).
- Fecha de corte y plan de actualización.
- Autoría.

### Contacto (`/contacto`)

Formulario Formspree (nombre, email, mensaje, botón enviar) + enlace a GitHub Issues para reportes técnicos.

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

### Ruta crítica (`/sintesis/reformas` — sección inferior)

Visualización de los 7 tramos:
- Tramo 1: Anclaje constitucional (R-01 → R-02 → R-03 → R-04).
- Tramo 2: Actualización marco federal 2025 (R-06, R-43, R-65, R-73).
- Tramo 3: Gobernanza institucional (R-21 → R-22 → R-49 → R-94).
- Tramo 4: Financiamiento (R-12 → R-69 → R-29 → R-25).
- Tramo 5: Adecuación procesal (R-54 → R-55 → R-56 → R-57 → R-83 → R-84 → R-86).
- Tramo 6: Sectoriales (múltiples cadenas independientes).
- Tramo 7: Reformas federales (no controlables).

Formato: horizontal timeline o vertical waterfall, con nodos clicables que abren la ficha de cada reforma.

Distribución por tramo: T1=7, T2=4, T3=3, T4=6, T5=7, T6=35, T7=3 (total asignadas=65).
Las 36 reformas sin tramo asignado se muestran debajo de la visualización como "Reformas independientes" — son reformas que pueden avanzar en paralelo sin precondición ni secuencia.

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

### Fase 5 — Páginas de ordenamientos
Plantilla de bloque + 20 fichas + vistas transversales.
Entregable: `/marco/` y `/ordenamiento/` completos.

### Fase 6 — Páginas singulares
Home final, metodología, contacto, ruta crítica visualizada.
Entregable: sitio completo. (4C y 5 ya entregados en Fase 4.)

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

**Fin de ARCHITECTURE.md v1.2**
