# NOTES.md — Estado de ejecución y deuda técnica

**Última actualización:** Abril 2026, cierre de Fase 3.

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

### 1.3 Subtitle de `/sintesis/mapa/debilidades` definido ad-hoc

El subtitle actual fue aprobado por el autor durante Fase 3:

> "Ochenta hallazgos documentados a lo largo de once ordenamientos estatales, en la intersección del marco federal energético vigente desde marzo de 2025."

Sin canonicalización en ARCHITECTURE.md. Las otras 8 explorer pages de Fase 4 necesitarán subtitles equivalentes. Convención propuesta:

> "N [ítems] [clasificación], [encuadre federal/estatal]."

Ejemplos a confirmar con el autor al generar cada página:
- 1B: "Treinta y cuatro condicionamientos del marco federal que restringen la capacidad regulatoria de Jalisco."
- 2: "Ciento una reformas estructurales propuestas, organizadas en siete tramos de ruta crítica."
- 3A: "Ochenta y cuatro proyectos ejecutables con el marco estatal vigente, sin requerir reformas."
- 4A: "Cuarenta conflictos de competencia entre el marco federal y el estatal."

No son finales. El autor aprueba uno por uno al generar cada página.

### 1.4 `cross-references.json`: cobertura no verificada

El parser genera entradas para los IDs que detecta en el source, pero **no hay validación** de que todos los códigos `R-NN`, `1A.NN`, `3B.NN` etc. referenciados en prosa tengan su entrada correspondiente. El Explorer maneja gracefully códigos no registrados (los renderiza con `.xref-missing`, texto gris punteado, sin tooltip), pero eso oculta cobertura incompleta.

**Validación pendiente:** script que:
1. Extraiga todos los códigos con el regex `/\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g` de los textos en todos los JSON de `src/data/`.
2. Compare con las keys de `cross-references.json`.
3. Imprima los códigos referenciados pero no registrados.

Hacer en Fase 4 cuando ya haya más páginas renderizando cross-refs, para tener cobertura de uso real.

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

Las 4 métricas de 1A (80/44/11/9) se derivan del JSON en el frontmatter del `.astro` con JavaScript puro, antes de pasarlas al Explorer. Ventajas:

- El Explorer recibe números ya calculados (no necesita lógica de conteo).
- El build es estático; las métricas no re-calculan en cliente.
- Fácil de auditar: cualquier discrepancia se debugga en el `.astro`, no en el Explorer.

**Regla para Fase 4:** cada página calcula sus propias métricas en el frontmatter y las pasa al Explorer como `Array<{number, label}>`. No agregar lógica de cálculo al Explorer.

### 2.5 Regex de cross-references vive en Explorer.tsx

El patrón `/\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g` detecta:
- Reformas: `R-1`, `R-47`, `R-101`
- Items de secciones: `1A.3`, `2.45`, `3B.12`, `4A.7`, `6.22`

No detecta:
- Codes sin prefijo de número (ej. si hubiera `5.3`; el `5` entra, pero la clase `[1-6][A-D]` requiere letra).
- IDs de ordenamientos (`CPEJ`, `LACCEJ`) — esos van por `OrdName`, no por `CrossRef`.

Si Fase 5 introduce nuevos tipos de código (ej. tramos de ruta crítica `T1..T7`, o fichas de ordenamiento `ORD-XXX`), extender el regex en `Explorer.tsx` línea con `XREF_PATTERN`.

---

## 3. Convenciones para Fase 4

### 3.1 Orden sugerido de las 8 páginas

Por complejidad creciente y riesgo técnico:

1. **1B condicionamientos** — schema casi igual a 1A, solo cambia `prioridad`→`urgencia` y `ord`→`ord_federal`. Prueba que el Explorer es realmente reutilizable.
2. **4B vacíos** — schema simple, solo `polo_federal` + `riesgo`. Sin prioridad ni tipo.
3. **3D habilitaciones** — schema con `estado` (Explotada / Parcialmente / Ociosa / Ociosa diferida) en lugar de prioridad. Tipo de filtro distinto.
4. **3A proyectos viables hoy** — schema con `ord_estatal` compuesto (puede ser "CPEJ + LACCEJ"). Decisión: agrupar por primer ord, o contar por cada uno.
5. **3B, 3C proyectos** — mismo schema que 3A.
6. **4A conflictos** — 2 polos (`polo_estatal` + `polo_federal`). Requiere decidir por cuál agrupar la distribución.
7. **6 próximos pasos** — puede requerir visualización tipo timeline en vez de lista.
8. **2 reformas** — el más complejo. Schema muy distinto, tiene tramos de ruta crítica, dependencias, fichas individuales. Posible extensión mayor del Explorer o Explorer2 dedicado.

### 3.2 Checklist por página

Cuando se cierre una nueva explorer page, confirmar:
- Eyebrow correcto (ej. `SÍNTESIS · SECCIÓN 1B`).
- Display headline editable.
- Subtitle aprobado por autor.
- Métricas con conteo correcto contra el JSON fuente.
- Distribución por el campo correcto, stackeada por prioridad/urgencia/estado según aplique.
- Tabs con los valores reales del campo (no hardcodear Alta/Media/Baja si es urgencia).
- Selects de filtro poblados desde el JSON.
- Cross-refs activos en el `texto` de los items.
- Tag de la columna derecha usando la clase correcta (`.tag-alta` etc; si es urgencia con otros valores, extender `components.css` con nuevas clases).
- Watermark al pie.
- Commit en git con mensaje descriptivo.

### 3.3 Cuándo extender el Explorer vs cuándo duplicarlo

Extender (agregar props opcionales al Explorer actual) si:
- El cambio es <20 líneas de código.
- El cambio no complica la config de las páginas existentes.
- Se puede expresar como "si prop X está presente, hacer Y".

Duplicar (crear `Explorer2.tsx`, `ExplorerReformas.tsx`, etc) si:
- El schema es fundamentalmente distinto (2 ords en vez de 1, timeline en vez de lista).
- La lógica de filtrado es incompatible (ej. rangos numéricos en vez de categorías).
- Mantener un Explorer único forzaría ramificaciones condicionales densas.

Regla general: una extensión de 50+ líneas con 3+ branches condicionales es señal de que convenía duplicar.

---

## 4. Estado del repo al cierre de Fase 3

- **Commits:** 2 en branch `main`.
  - `74023d6` — Fase 1 + 2 + 3: parser, design system, Explorer de debilidades (1A)
  - `424a7c0` — Fase 3 — Fix parser: normalizar tipos a 9 canónicos + agregar campo nombre a ordenamiento-meta
- **Remoto:** `github.com/carlosaglr/energia-jalisco`, sincronizado.
- **Páginas funcionales:** `/` (demo de Fase 2), `/demo` (demo de componentes), `/sintesis/mapa/debilidades`.
- **Working tree:** limpio.
- **Stack instalado:** Astro 5.18.1, React 19.2.5, `@astrojs/react` 5.0.3.

---

## 5. Qué NO está resuelto (para evitar preguntas redundantes)

- Home final con hero + métricas globales + navigation cards → Fase 6.
- Drawer de navegación con items reales → Fase 7.
- Pagefind integrado → Fase 7.
- Fuentes self-hosted (`public/fonts/*.woff2`) → pendiente; por ahora el proyecto usa fallbacks del sistema hasta que se descarguen los .woff2.
- Deploy a Vercel/Netlify → Fase 8.
- `robots.txt`, headers, Cloudflare, licencia en footer → Fase 8.
- Métricas globales del home (80/101/207/40/62/20) verificar que sumen correctamente contra los JSON actualizados → al comenzar Fase 6.
