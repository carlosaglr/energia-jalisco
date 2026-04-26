# NOTES.md — Estado de ejecución y deuda técnica

**Última actualización:** Abril 2026, cierre de Fase 4.

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
Plegar la lógica de `normalize_data.py` dentro de `parse_markdown.py` para que el parser produzca datos canónicos directamente. Recomendado hacer en Fase 5 o antes, cuando las modificaciones al parser sean más invasivas (agregar bloques de ordenamientos, cambiar formatos).

### 1.2 Campo `nombre` derivado, no canónico

`normalize_data.py` construye `nombre` copiando los campos de `nombre_display`:
```
nombre.prefix  = nombre_display.prefix_italic
nombre.core    = nombre_display.core_bold_italic
nombre.suffix  = nombre_display.suffix_italic_small
```

Esto **funciona** para el uso actual (tooltip del `<a>` en `OrdName`), pero no siempre refleja la partición gramatical "canónica" del nombre. Ejemplo:

- `LACCEJ`: `nombre.core = "Cambio Climático"` — correcto.
- `CPEJ`: `nombre.core = "Constitución"` — gramaticalmente, la "raíz" es toda la frase "Constitución Política del Estado de Jalisco"; la división "Constitución" + " Política…" es una decisión de énfasis visual, no gramatical.

Si en Fase 5 o posteriores se necesita usar `nombre` para algo más que un tooltip (ej. ordenación alfabética por raíz, extracción para buscador), revisar si la partición derivada alcanza. Por ahora es aceptable.

### 1.3 `cross-references.json`: cobertura no verificada

El parser genera entradas para los IDs que detecta en el source, pero **no hay validación** de que todos los códigos `R-NN`, `1A.NN`, `3B.NN` etc. referenciados en prosa tengan su entrada correspondiente. El Explorer maneja gracefully códigos no registrados (los renderiza con `.xref-missing`, texto gris punteado, sin tooltip), pero eso oculta cobertura incompleta.

**Validación pendiente:** script que:
1. Extraiga todos los códigos con el regex `/\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g` de los textos en todos los JSON de `src/data/`.
2. Compare con las keys de `cross-references.json`.
3. Imprima los códigos referenciados pero no registrados.

### 1.4 Path layout del parser (Fase 4)

`parse_markdown.py` usa dos roots distintos:
- `SOURCE_ROOT = parent.parent` → `z_SEDES/` (donde están los `.md` fuente)
- `REPO_ROOT = parent` → `energia-jalisco/` (donde se escriben los JSON)

Esto refleja la organización física actual (los `.md` fuente viven fuera del repo). Si en algún momento se mueven los `.md` adentro del repo, simplificar a un solo `BASE`.

**Antes del fix de Fase 4** el parser tenía un solo `BASE = parent.parent` que se usaba para ambas cosas. Eso escribía los JSON a `z_SEDES/src/data/` (carpeta huérfana fuera del repo). La carpeta puede seguir existiendo en local con datos viejos:

```bash
ls /Users/carlosaguilar/Documents/z_SEDES/src/  # si existe, decidir si borrar
```

### 1.5 Inferencia de prioridad en proyectos 3A — auditabilidad

La fuente (`sintesis_ejecutiva_jalisco.md`, sección 3A) no documenta prioridad para los 84 proyectos viables. El parser **infiere** prioridad mediante reglas explícitas en `infer_prioridad_3a(condicion)`:

- **Baja**: voluntad federal discrecional, contrato con CFE, invitación discrecional, voluntad potestativa.
- **Media**: convenio o coordinación con SENER, CONUEE, SEMARNAT, INECC.
- **Alta**: acto unilateral del Estado, restricción de límite (no invadir, congruencia) sin dependencia activa.
- **Default si no matchea**: Alta.

Cada item lleva `prioridad_inferida: true` para distinguirlo de fuentes documentadas. Distribución actual: 51 Alta / 26 Media / 7 Baja.

Si en algún punto se agrega prioridad explícita al markdown fuente, retirar la lógica de inferencia y dejar que el parser lea directamente del campo.

### 1.6 Carpeta `src/data/bloques/` con 9 de 20 ordenamientos

El parser produce 9 archivos de bloque (los federales analizados). Los 11 estatales no están como bloque individual — su contenido está disperso en debilidades, condicionamientos y reformas. Fase 5 deberá decidir si se generan los 11 bloques estatales faltantes o si se construyen las fichas estatales agregando dinámicamente desde otros JSON.

---

## 2. Decisiones técnicas tomadas

### 2.1 Concatenación con `+` en vez de template literals en .tsx/.jsx

**Regla:** todo archivo React (`.tsx`, `.jsx`) usa concatenación:
```tsx
const href = '/marco/' + meta.ambito + '/' + meta.slug;    // SÍ
const href = `/marco/${meta.ambito}/${meta.slug}`;           // NO
```

**Por qué:** durante el desarrollo de Fase 3, esbuild falló con `Expected identifier but found ...` en archivos recién pegados. Causa raíz: el copy-paste desde la interfaz de chat a veces sustituye el backtick ASCII (U+0060) por caracteres Unicode visualmente idénticos (U+02CB, U+2035). esbuild solo acepta U+0060. La concatenación con `+` es ASCII plano y nunca se sustituye.

**Alcance:** solo archivos React. En Astro frontmatter y en CSS los template literals / strings son seguros porque los parsea Astro o Vite, no esbuild directamente sobre esos caracteres.

### 2.2 `OrdName` con 3 niveles de fallback

En `Explorer.tsx`, el componente `OrdName` tolera data incompleta en `ordenamiento-meta.json`:

1. Si la entrada tiene `nombre_display.core_bold_italic` → render completo con italic/bold/small.
2. Si no, pero tiene `nombre.core` → render usando `nombre`.
3. Si ninguno, renderiza `meta.tag` como texto plano.

El `title` del `<a>` sigue la misma cascada. Esto permitió que la página renderizara antes de arreglar el JSON. Tras el fix de Fase 3, la cascada siempre entra por el camino 1, pero los fallbacks quedan como red de seguridad para futuros datos malformados.

### 2.3 Configuración del Explorer vive en el .astro, no en el .tsx

El Explorer no sabe nada específico de debilidades. Recibe:
- `data` (array de items)
- `config` (metrics, distribution, filtros, campos de item)
- `ordenamientoMeta` (mapa tag → formato)
- `crossRefs` (mapa id → tooltip)

Todo el conocimiento "esto es para 1A / esto es para 1B" vive en el `.astro` de la página. Para Fase 4, generar una página nueva = copiar `debilidades.astro`, cambiar los JSON importados y ajustar el objeto `config`. El `.tsx` no se toca salvo para extender capacidades (ej. soportar 2 polos para 4A).

### 2.4 Métricas se computan en build time en el .astro, no en el .tsx

Las 4 métricas se derivan del JSON en el frontmatter del `.astro` con JavaScript puro, antes de pasarlas al Explorer. Ventajas:

- El Explorer recibe números ya calculados (no necesita lógica de conteo).
- El build es estático; las métricas no re-calculan en cliente.
- Fácil de auditar: cualquier discrepancia se debugga en el `.astro`, no en el Explorer.

**Regla:** cada página calcula sus propias métricas en el frontmatter y las pasa al Explorer como `Array<{number, label}>`.

### 2.5 Regex de cross-references: ahora en `CrossRefText.tsx`

El patrón `/\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g` detecta:
- Reformas: `R-1`, `R-47`, `R-101`
- Items de secciones: `1A.3`, `2.45`, `3B.12`, `4A.7`, `6.22`

En Fase 4 se extrajo el patrón de dentro de `Explorer.tsx` a un componente nuevo `CrossRefText.tsx`. Permite renderizar cualquier string detectando códigos cross-reference y envolviéndolos con `CrossRef` para tooltip rico al hover. Usado en fichas de reforma, narrativas 4C y lista de huecos 5.

`Explorer.tsx` mantiene su copia local del patrón (no se rompió la integración existente).

### 2.6 Extensión de `Explorer.tsx` (Fase 4, sin breaking changes)

Tres campos opcionales nuevos en `ItemFields` del config:
- `titulo` (string): renderiza un `<h3>` adicional con el título del item.
- `badge` (string): badge tipográfico extra en la meta-line del item.
- `tagXref` (string): nombre del campo (array de códigos) que envuelve el tag de la derecha con tooltip rico.

Si Fase 5 introduce nuevos tipos de código (ej. tramos `T1..T7`, fichas de ordenamiento `ORD-XXX`), extender `XREF_PATTERN` en `CrossRefText.tsx` y `Explorer.tsx`.

### 2.7 Normalización de clases CSS de tags

`PriorityTag` ahora reemplaza espacios por guiones:
```tsx
const cls = (value || '').toLowerCase().replace(/\s+/g, '-');
```

Antes, valores como "Parcialmente explotada" generaban dos clases separadas en HTML (`.tag-parcialmente .explotada`), rompiendo el matching CSS. Ahora generan una clase válida (`.tag-parcialmente-explotada`).

### 2.8 Tags CSS específicos por sección (Fase 4)

Agregados a `Explorer.css`:
- `.tag-explotada`, `.tag-parcialmente-explotada`, `.tag-ociosa`, `.tag-ociosa-diferida` (3D, gradiente navy).
- `.tag-constitucional`, `.tag-legal` (4B).
- `.tag-30-días`, `.tag-60-90-días`, `.tag-120-180-días`, `.tag-240-días`, `.tag-continuo` (sección 6).

Tercera columna del grid de items ampliada de 110px a 170px globalmente para acomodar tags multipalabra. Tags con `width: 160px` y `word-break: keep-all` para no partir palabras.

### 2.9 Inconsistencia de clases en CrossRef wrapper (Fase 4)

`components.css` definía `.xref-wrapper` (con "per") pero el componente usa `.xref-wrap` (sin "per"). Eran selectores distintos. El componente nunca matcheaba la regla CSS y quedaba como `display: inline`, lo que rompía el anclaje del tooltip absoluto.

**Fix:** en `components.css` se agregó:
```css
.xref-wrap, .xref-wrapper { position: relative; display: inline-block; }
```

y la regla `:hover` cubre ambas clases.

---

## 3. Cuándo usar `<CrossRef>` vs link plano

- **Texto narrativo (`<p>` con párrafos largos)** → usar `<CrossRefText>`. Detecta automáticamente todos los códigos R-NN y NA.NN del string.
- **Lista de códigos sueltos (chips de Vínculos, etc.)** → mapear con `<CrossRef code={c} crossRefs={crossRefs} />`. Cada chip es un código aislado.
- **Tag a la derecha de un item Explorer** → si el item tiene un campo `reformas_vinculadas` o similar, configurar `tagXref` en el config del Explorer para envolver el tag con tooltip rico.
- **Link interno sin tooltip** → `<a>` plano. Útil en navegación entre páginas (ej. "← Todas las reformas").

---

## 4. Estado del repo al cierre de Fase 4

- **Páginas funcionales:**
  - `/` (demo Fase 2), `/demo` (demo componentes)
  - `/sintesis` (overview)
  - `/sintesis/mapa/debilidades` (1A, 80 items)
  - `/sintesis/mapa/condicionamientos` (1B, 34 items)
  - `/sintesis/reformas` (Sec 2, 101 items)
  - `/sintesis/reformas/[codigo]` (101 fichas R-01..R-101)
  - `/sintesis/proyectos` (overview)
  - `/sintesis/proyectos/viables-hoy` (3A, 84 items)
  - `/sintesis/proyectos/reforma-estatal` (3B, 50 items)
  - `/sintesis/proyectos/reforma-federal` (3C, 15 items)
  - `/sintesis/proyectos/habilitaciones` (3D, 58 items)
  - `/sintesis/conflictos` (4A, 40 items)
  - `/sintesis/vacios` (4B, 62 items)
  - `/sintesis/riesgos` (4C, 2 narrativas)
  - `/sintesis/huecos` (Sec 5)
  - `/sintesis/siguiente` (Sec 6, 30 items)

- **Componentes nuevos en Fase 4:** `CrossRefText.tsx`.
- **Componentes extendidos:** `Explorer.tsx` (campos `titulo`, `badge`, `tagXref` opcionales).
- **Stack instalado:** Astro 5.18.1, React 19.2.5, `@astrojs/react` 5.0.3.
- **Remoto:** `github.com/carlosaglr/energia-jalisco`, sincronizado.

---

## 5. Qué NO está resuelto (para evitar preguntas redundantes)

- Home final con hero + métricas globales + navigation cards → Fase 6.
- Páginas `/marco/federal/[slug]` y `/marco/estatal/[slug]` (20 fichas de ordenamiento) → Fase 5.
- Vista transversal `/ordenamiento/[tag]` → Fase 5.
- `RutaCritica.tsx` (visualización 7 tramos) → Fase 6.
- Drawer de navegación con items reales → Fase 7.
- Pagefind integrado → Fase 7.
- Fuentes self-hosted (`public/fonts/*.woff2`) → pendiente; por ahora el proyecto usa fallbacks del sistema hasta que se descarguen los .woff2.
- Deploy a Vercel/Netlify → Fase 8.
- `robots.txt`, headers, Cloudflare, licencia en footer → Fase 8.
- Métricas globales del home (80/101/207/40/62/20) verificar que sumen correctamente contra los JSON actualizados → al comenzar Fase 6.

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
