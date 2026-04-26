# FASE 6 · BRIEF DE IMPLEMENTACIÓN PARA CLAUDE CODE

**Proyecto:** Observatorio del Sistema de Energía de Jalisco
**Repo:** github.com/carlosaglr/energia-jalisco
**Estado al inicio:** Fases 1–5 completadas. Fase 6 por implementar.
**Spec autoridad:** `ARCHITECTURE.md` v1.5 (recién actualizado).

---

## 0. Lecturas obligatorias antes de empezar

1. `ARCHITECTURE.md` (v1.5) — sobre todo §3 (estructura de archivos), §4 (schemas JSON), §5 (especificación por página).
2. `NOTES.md` — decisiones técnicas históricas.
3. `src/components/` — especialmente `Editorial.astro`, `Header.astro`, `Footer.astro`, `Eyebrow.astro`, `DisplayHeadline.astro`, `Subtitle.astro`, `MetricsRow.astro`, `HairlineDivider.astro`, `NavCard.astro`, `OrdenamientoName.astro`, `CrossRef.tsx`. Saber sus props antes de consumirlos.
4. `src/data/reformas.json` — esquema y contenido. Para `/sintesis/ruta-critica`.
5. `src/data/ordenamientos.json` y `src/data/ordenamiento-meta.json` — para `/metodologia`.
6. `src/styles/tokens.css` — variables de color, tipografía, espaciado. No inventar tokens nuevos salvo necesidad real.

---

## 1. Reglas duras (no negociables)

1. **Strings en archivos `.tsx` y `.jsx`: concatenación con `+`.** Nunca template literals con backticks. Razón: copy-paste convierte backticks ASCII a Unicode lookalikes y rompe el build con esbuild. Aplica a JSX strings, classNames, URLs construidas, todo.
2. **Pre-procesamiento en frontmatter `.astro`, no en runtime React.** Métricas, agrupaciones, índices de dependencias, particiones de arrays — todo se computa en el frontmatter (build-time) y se pasa como props ya cocinadas al componente React. Los componentes React solo renderizan y manejan estado de UI (hover, click).
3. **Lenguaje del copy: simple, humano, directo.** El lector primario es Congreso del Estado y público interesado no necesariamente experto, posiblemente crítico. Regla dura: **prohibido el fraseo "Esto no es X, es Y"**. Cuando se quiera contrastar, redactar afirmativo directo.
4. **No inventar datos.** Si un dato no está en los JSON o en el copy de este brief, no se rellena. Se deja claramente como TODO.
5. **No fabricar citas legales.** Cualquier referencia a artículos, fracciones, párrafos viene de los JSON. Cero invención.
6. **Idioma: español.** Toda interfaz, copy, comentarios visibles, alt text, metadata.
7. **Diseño: Julius Bär puro, modo claro.** Serif Source Serif 4 weight 300, navy `#1B2C5E`, hairlines, small caps, centrados editoriales. No agregar dark mode. No agregar variantes "cálidas". Respetar tokens existentes.
8. **Nombres de archivo y rutas siguen ARCHITECTURE.md §3 al pie de la letra.**
9. **`src/data/` solo contiene JSON de contenido.** No colocar configs ahí.
10. **Después de tocar el parser o JSON: correr `python3 parse_markdown.py && python3 normalize_data.py`.** En esta fase no se debería tocar el parser; flagear si surge la necesidad.

---

## 2. Entregables

**4 páginas:**

- `src/pages/contacto.astro` (modificar; existe placeholder de Fase 2)
- `src/pages/metodologia.astro` (modificar; existe placeholder)
- `src/pages/index.astro` (modificar; existe placeholder)
- `src/pages/sintesis/ruta-critica.astro` (crear)

**3 componentes nuevos:**

- `src/components/RutaCritica.tsx`
- `src/components/RutaCritica.css`
- `src/components/TocSidebar.astro`

**1 actualización del Drawer:**

- `src/components/Drawer.astro` — agregar entrada `/sintesis/ruta-critica` en la navegación jerárquica.

**1 cierre de fase:**

- `ARCHITECTURE.md` → bump a v1.6 con changelog de Fase 6 implementada.
- `NOTES.md` → agregar decisiones técnicas tomadas durante implementación.

---

## 3. Orden de ejecución

Recomendado: menor a mayor riesgo. Cada paso valida el siguiente.

1. `/contacto` — más simple, sirve de smoke test del setup.
2. `/metodologia` — prosa larga + un componente nuevo simple (`TocSidebar.astro`).
3. `/` (home) — integra datos reales en métricas, sin componentes nuevos.
4. `/sintesis/ruta-critica` — el más pesado, requiere los dos componentes pesados nuevos.
5. Drawer + cierre de fase (ARCHITECTURE v1.6 + NOTES.md).

Después de cada página: `npm run build` debe pasar sin errores antes de continuar.

---

## 4. Especificación detallada por página

### 4.1 `/contacto`

**Layout:** `Editorial.astro`. Hero centrado + 3 bloques separados por `HairlineDivider`.

**Datos:** ninguno (estático).

**Componentes:** `Editorial.astro`, `Eyebrow.astro`, `DisplayHeadline.astro`, `Subtitle.astro`, `HairlineDivider.astro`.

**Copy completo:**

```
Eyebrow:    CONTACTO
Display:    Contacto
Subtitle:   Para preguntas sobre el contenido, errores en el análisis o
            reportes técnicos del sitio.
```

**Bloque 1 — Consultas y comentarios (Formspree)**

```
Heading (h2 serif):  Consultas y comentarios
Párrafo:             Para preguntas sobre el análisis, observaciones de
                     fondo o solicitudes de aclaración. Las respuestas no
                     son inmediatas.

Form fields:
  - Nombre              (text, requerido)
  - Organización        (text, opcional)
  - Email               (email, requerido)
  - Mensaje             (textarea, requerido, 6 filas)
  - Botón "Enviar"      (submit)

action: https://formspree.io/f/xqewjdjp
method: POST
```

**Bloque 2 — Reportes técnicos (GitHub Issues)**

```
Heading (h2 serif):  Reportes técnicos
Párrafo:             Para errores tipográficos, problemas de visualización
                     o sugerencias sobre la interfaz del sitio.

Botón/link:          "Abrir un issue en GitHub" →
                     https://github.com/carlosaglr/energia-jalisco/issues
                     (target="_blank" rel="noopener")
```

**Bloque 3 — Sobre el autor**

```
Heading (h2 serif):  Sobre el autor
Párrafo:             Carlos Aguilar. Analista en derecho energético,
                     política pública y administración estatal.

Link:                "GitHub: @carlosaglr" →
                     https://github.com/carlosaglr
                     (target="_blank" rel="noopener")
```

**Sin LinkedIn. Sin logos. Sin afiliaciones institucionales.**

---

### 4.2 `/metodologia`

**Layout:** `Editorial.astro`. Cuerpo con grid de dos columnas en desktop (prosa centro `max-width: 65ch`, TOC sticky derecha). Mobile: una columna, TOC oculto.

**Datos:** lectura de `ordenamientos.json` para listar los 20 (sección 1).

**Componentes:** `Editorial.astro`, `SectionHeader.astro`, `HairlineDivider.astro`, `OrdenamientoName.astro`, `TocSidebar.astro` (nuevo).

**Hero:**

```
Eyebrow:    METODOLOGÍA
Display:    Metodología
Subtitle:   Cómo se construyó este análisis, qué reglas se aplicaron y
            qué decisiones se documentaron como inferencias.
```

**TOC (componente `TocSidebar.astro`):** lista de 6 anchors con scroll suave a cada h2 de la página.

```
1. Fuentes analizadas
2. Reglas operacionales
3. Inferencias documentadas
4. Qué no contiene el estudio
5. Fecha de corte y plan de actualización
6. Autoría
```

Cada h2 de las 6 secciones lleva `id` correspondiente para anchor.

**Sección 1 — Fuentes analizadas**

```
h2: Fuentes analizadas

Párrafo:
El análisis se construyó sobre veinte ordenamientos: nueve federales y
once estatales. Los federales fijan el techo competencial vigente desde
marzo de 2025 (paquete del Diario Oficial del 18 de marzo de 2025 más la
reforma constitucional del 20 de diciembre de 2024). Los estatales son
las leyes de Jalisco que regulan o tocan el sistema energético del
Estado.

[Lista renderizada con OrdenamientoName.astro consumiendo ordenamientos.json:
 - Bloque "Federales" (9 items)
 - Bloque "Estatales" (11 items)
 Cada item con su formato italic/bold/small según ordenamiento-meta.json.]
```

**Sección 2 — Reglas operacionales**

```
h2: Reglas operacionales

Párrafo introductorio:
Cada hallazgo del análisis cumple cuatro reglas.

Bloque "Análisis atómico":
h3 (small caps): Análisis atómico
Párrafo:
Cada ordenamiento estatal se analiza solo contra el marco federal,
sin inferir su contenido a partir de otros ordenamientos estatales.

Bloque "Domicilio único":
h3 (small caps): Domicilio único
Párrafo:
Cada hallazgo —debilidad, reforma, proyecto, conflicto, vacío— tiene
una sola ubicación en el sitio. No se duplica entre secciones. Los
cross-references conectan ubicaciones en lugar de copiar contenido.

Bloque "Anclaje a artículo":
h3 (small caps): Anclaje a artículo
Párrafo:
Toda afirmación cita el artículo, fracción y párrafo específico que
la sustenta. Las transcripciones literales van entre comillas e
itálicas. Lo que es interpretación se marca con [INFERENCIA:]. Lo
que es ausencia de regulación se marca con [AUSENCIA:].

Bloque "Sin relleno":
h3 (small caps): Sin relleno
Párrafo:
El texto del análisis está dirigido a lectores institucionales:
Ejecutivo, Congreso, Tribunal de Justicia Administrativa. Cada
oración aporta un dato o una conclusión. No hay narrativa
ornamental.
```

**Sección 3 — Inferencias documentadas**

```
h2: Inferencias documentadas

Párrafo introductorio:
Dos campos del análisis son resultado de inferencia sistemática del
autor, no datos extraídos directamente de la fuente. Se documentan
aquí para auditoría.

Bloque "Prioridad de los proyectos viables hoy":
h3 (small caps): Prioridad de los proyectos viables hoy (Sección 3A)
Párrafo:
La fuente lista 84 proyectos ejecutables sin reforma, pero no asigna
prioridad. La prioridad se infirió a partir del campo "condicion" de
cada proyecto, aplicando estas reglas:

[Lista en prosa, no bullets:]
— Prioridad alta si el proyecto se ejecuta por acto unilateral del
  Estado, sin necesidad de coordinación federal.
— Prioridad media si requiere convenio o coordinación con una
  autoridad federal cooperativa.
— Prioridad baja si depende de voluntad federal discrecional.

Párrafo de cierre:
La distribución resultante es 51 alta, 26 media, 7 baja. Cada
proyecto inferido lleva la marca prioridad_inferida: true en los
datos, identificable también desde la interfaz de cada proyecto.

Bloque "Tipos canónicos de debilidades":
h3 (small caps): Tipos canónicos de debilidades (Sección 1A)
Párrafo:
La fuente original utilizaba 16 etiquetas distintas para clasificar
las 80 debilidades del marco estatal. Estas etiquetas se normalizaron
a nueve categorías canónicas para permitir filtrado y agregación:
vacío normativo, ambigüedad, conflicto de competencia, omisión de
implementación, restricción estructural, redundancia,
desactualización, inconsistencia interna, incompletitud. La
normalización está implementada en normalize_data.py y se aplica
después de cada ejecución del parser.
```

**Sección 4 — Qué no contiene el estudio**

```
h2: Qué no contiene el estudio

Párrafo:
El análisis cubre el marco normativo vigente al 1 de abril de 2026.
Algunos materiales relevantes no se incluyeron por estar pendientes,
no haberse publicado, o quedar fuera del alcance editorial:

[Lista en prosa, no bullets:]
— Reglamentos pendientes de las leyes federales reformadas en marzo
  de 2025.
— Normas estatales todavía no expedidas y mencionadas como
  obligación pendiente en las leyes vigentes.
— Disposiciones administrativas sectoriales —acuerdos, lineamientos,
  manuales— que no constituyen fuente jurídica primaria.
— Tratados internacionales y compromisos climáticos no incorporados
  al derecho interno.

Párrafo final:
El detalle completo está en /sintesis/huecos.
[link a /sintesis/huecos]
```

**Sección 5 — Fecha de corte y plan de actualización**

```
h2: Fecha de corte y plan de actualización

Párrafo:
El análisis tiene fecha de corte editorial al 1 de abril de 2026.
Cualquier reforma, decreto o resolución posterior a esa fecha no está
reflejado en estas páginas.

Párrafo:
El plan de actualización está por definir. Las próximas revisiones se
anunciarán en este sitio.
```

**Sección 6 — Autoría**

```
h2: Autoría

Párrafo:
El análisis es obra de Carlos Aguilar, analista en derecho
energético, política pública y administración estatal. La autoría es
individual. El sitio no cuenta con respaldo institucional, financiero
ni operativo de ninguna entidad pública o privada. El código y el
contenido están publicados bajo licencia Creative Commons BY-NC-SA
4.0.

Párrafo final:
Para consultas sobre el contenido, ver /contacto.
[link a /contacto]
```

---

### 4.3 `/` (home)

**Layout:** `Editorial.astro`. 6 bloques verticales (header del layout + hero + métricas + 2 NavCards + bloque contexto + footer del layout).

**Datos:** lectura build-time de los JSON para computar métricas.

**Pre-procesamiento en frontmatter `.astro`:**

```js
const debilidades = (await import('../data/debilidades.json')).default;
const reformas = (await import('../data/reformas.json')).default;
const proyectos3a = (await import('../data/proyectos-3a.json')).default;
const proyectos3b = (await import('../data/proyectos-3b.json')).default;
const proyectos3c = (await import('../data/proyectos-3c.json')).default;
const habilitaciones = (await import('../data/habilitaciones.json')).default;
const conflictos = (await import('../data/conflictos.json')).default;
const vacios = (await import('../data/vacios.json')).default;
const ordenamientos = (await import('../data/ordenamientos.json')).default;

const total_debilidades = debilidades.length;            // 80
const total_reformas = reformas.length;                  // 101
const total_proyectos = proyectos3a.length + proyectos3b.length
                      + proyectos3c.length + habilitaciones.length; // 207
const total_conflictos = conflictos.length;              // 40
const total_vacios = vacios.length;                      // 62
const total_ordenamientos = ordenamientos.length;        // 20
```

Si los conteos no dan los esperados (80/101/207/40/62/20), abortar y reportar discrepancia. No "ajustar" para que cuadre.

**Componentes:** `Editorial.astro`, `Eyebrow.astro`, `DisplayHeadline.astro`, `Subtitle.astro`, `MetricsRow.astro`, `HairlineDivider.astro`, `NavCard.astro`.

**Hero (copy congelado en ARCHITECTURE §5):**

```
Eyebrow:    ANÁLISIS JURÍDICO-REGULATORIO · ABRIL 2026
Display:    Sistema estatal de energía de Jalisco
Subtitle:   Ochenta hallazgos, ciento una reformas y doscientos siete
            proyectos ejecutivos mapeados en la intersección del marco
            federal vigente desde marzo de 2025.
```

**Métricas (6, hairlines verticales entre cada una):**

```
80    debilidades identificadas
101   reformas estructurales
207   proyectos ejecutivos
40    conflictos de competencia
62    vacíos federal-estatal
20    ordenamientos analizados
```

**NavCards (2):**

```
Card 1:
  Eyebrow:      SÍNTESIS EJECUTIVA
  Title:        Hallazgos, reformas y proyectos
  Description:  Las debilidades del marco estatal, las reformas que las
                corrigen y los proyectos que se pueden ejecutar a partir
                de ellas.
  Link:         /sintesis

Card 2:
  Eyebrow:      MARCO NORMATIVO
  Title:        Los veinte ordenamientos
  Description:  Cada ley federal y estatal del sistema energético, con
                sus competencias, vacíos y conflictos identificados.
  Link:         /marco
```

**Bloque de contexto (3 párrafos en prosa serif, max-width 65ch, centrado):**

```
Párrafo 1:
El Observatorio del Sistema de Energía de Jalisco publica un análisis
jurídico-regulatorio del marco energético del Estado de Jalisco,
contrastado con el marco federal mexicano vigente desde marzo de 2025.
El objetivo es identificar dos cosas: las reformas legislativas que
requiere el sistema estatal para cumplir su mandato, y los proyectos
que el Ejecutivo estatal puede ejecutar hoy sin esperar reforma alguna.

Párrafo 2:
El análisis se dirige a lectores institucionales —el Ejecutivo del
Estado de Jalisco, el Congreso del Estado, el Tribunal de Justicia
Administrativa, dependencias sectoriales, despachos especializados y
organismos de cooperación—. La interfaz permite también el acceso de
público no especializado, con explicaciones en lenguaje accesible donde
el contenido lo permite.

Párrafo 3:
Cada hallazgo está anclado a un artículo y fracción específicos del
ordenamiento correspondiente. Las inferencias del autor están
explícitamente marcadas. Las metodologías de clasificación están
documentadas en /metodologia. El código fuente y los datos están
abiertos en GitHub bajo licencia Creative Commons BY-NC-SA 4.0.
[link a /metodologia en "metodologia"]
```

---

### 4.4 `/sintesis/ruta-critica`

**Layout:** `Editorial.astro`. Hero + métricas + nota + viz + 2 bloques inferiores.

**Datos:** `reformas.json` completo.

**Pre-procesamiento en frontmatter `.astro`:**

```js
const reformas = (await import('../../data/reformas.json')).default;

// 1. Particionar
const enRuta = reformas.filter(r => r.tramo_ruta_critica !== null);
const independientes = reformas.filter(r => r.tramo_ruta_critica === null
                                         && r.id !== 'R-101');
const r101 = reformas.find(r => r.id === 'R-101');

// 2. Validar conteos
if (enRuta.length !== 65) throw new Error('Esperaba 65 en ruta, vi ' + enRuta.length);
if (independientes.length + 1 !== 36) throw new Error('Esperaba 36 sin tramo + R-101, vi ' + (independientes.length + 1));

// 3. Agrupar por tramo
const tramos = [1, 2, 3, 4, 5, 6, 7].map(n => ({
  numero: n,
  reformas: enRuta.filter(r => r.tramo_ruta_critica === n)
}));

// 4. Sub-agrupar T6 por ordenamiento
const t6 = tramos[5];
const t6Subgrupos = {};
for (const r of t6.reformas) {
  if (!t6Subgrupos[r.ordenamiento]) t6Subgrupos[r.ordenamiento] = [];
  t6Subgrupos[r.ordenamiento].push(r);
}
t6.subgrupos = t6Subgrupos;

// 5. Agrupar independientes por ordenamiento
const independientesPorOrd = {};
for (const r of independientes) {
  if (!independientesPorOrd[r.ordenamiento]) independientesPorOrd[r.ordenamiento] = [];
  independientesPorOrd[r.ordenamiento].push(r);
}

// 6. Construir índices de dependencias
//    forward: id -> [predecesoras directas]  (el campo dependencias[] tal cual)
//    backward: id -> [sucesoras directas]    (computado)
const forward = {};
const backward = {};
for (const r of reformas) {
  forward[r.id] = r.dependencias || [];
  backward[r.id] = [];
}
for (const r of reformas) {
  for (const dep of (r.dependencias || [])) {
    if (backward[dep]) backward[dep].push(r.id);
  }
}
```

**Componentes:** `Editorial.astro`, `Eyebrow.astro`, `DisplayHeadline.astro`, `Subtitle.astro`, `MetricsRow.astro`, `HairlineDivider.astro`, `OrdenamientoName.astro`, `RutaCritica.tsx` (nuevo, React island con `client:load`).

**Hero:**

```
Eyebrow:    SÍNTESIS · RUTA CRÍTICA
Display:    Ruta crítica de las reformas
Subtitle:   Ciento una reformas para corregir el sistema energético de
            Jalisco. Algunas se pueden empezar de inmediato. Otras
            tienen que esperar a que se apruebe una reforma previa.
            Esta página muestra ese orden.
```

**Métricas:**

```
7    grupos de reformas
65   reformas con orden definido
36   reformas que pueden empezar en cualquier momento
3    reformas que dependen del Congreso de la Unión
```

**Nota arriba de la viz (cursiva pequeña, centrada, hairlines arriba/abajo):**

```
Las flechas indican orden obligatorio. Una reforma con flecha entrante
no puede empezar hasta que la anterior esté aprobada.
```

**Componente RutaCritica (ver §5.1 abajo).**

**Después de la viz, hairline, después dos bloques inferiores:**

**Bloque "Reformas que se pueden empezar en cualquier momento" (35 reformas independientes excluyendo R-101):**

```
h2 (serif): Reformas que se pueden empezar en cualquier momento
Subtítulo (italic): No dependen de ninguna otra. El orden lo decide la
                    prioridad política del Ejecutivo y del Congreso del
                    Estado.

Render: grilla de cards agrupadas por ordenamiento (sub-headings con
OrdenamientoName.astro), sin aristas. Cada card clicable a
/sintesis/reformas/<id>.
```

**Bloque "Una reforma que depende del Congreso de la Unión" (R-101):**

```
h2 (serif): Una reforma que depende del Congreso de la Unión
Card destacada (border completo, no hairline) con:
  - Eyebrow: REFORMA FEDERAL · NO CONTROLABLE DESDE JALISCO
  - Título de R-101
  - Texto:
    La reforma R-101 requiere un cambio en la Constitución federal o
    en una ley federal. Jalisco no la puede aprobar por sí solo. Queda
    registrada para que el Ejecutivo estatal la pueda impulsar como
    agenda política.
  - Link a /sintesis/reformas/R-101
```

---

## 5. Especificación de componentes nuevos

### 5.1 `RutaCritica.tsx`

**Naturaleza:** React island con `client:load` (necesita estado para hover).

**Props:**

```ts
interface Reforma {
  id: string;          // "R-01"
  titulo: string;
  ordenamiento: string;
  articulo_modificar: string;
  prioridad: string;   // "Alta" | "Media" | "Baja"
}

interface Tramo {
  numero: number;          // 1..7
  reformas: Reforma[];
  subgrupos?: Record<string, Reforma[]>; // solo T6
}

interface Props {
  tramos: Tramo[];
  forward: Record<string, string[]>;   // id -> predecesoras directas
  backward: Record<string, string[]>;  // id -> sucesoras directas
}
```

**Estado interno:**

```ts
const [hoveredId, setHoveredId] = useState<string | null>(null);
```

**Cálculo del conjunto resaltado en hover (transitivo):**

```ts
function transitiveSet(start: string, edges: Record<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const next of (edges[cur] || [])) stack.push(next);
  }
  return visited;
}

// Cuando hay hovered:
// resaltadas = transitiveSet(hoveredId, forward) ∪ transitiveSet(hoveredId, backward)
// (incluye al hovered en ambos)
```

**Anatomía del render:**

Para cada tramo (1..7), una banda horizontal a ancho completo:

```
┌─────────────────────────────────────────────────────────────────┐
│ GRUPO N · <título humano del tramo>                              │
│ <frase de "por qué este orden">                                  │
│                                                                  │
│  [Card R-01] →→→ [Card R-02] →→→ [Card R-03] →→→ [Card R-04]    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

(hairline horizontal "Grupo N ⊢ Grupo N+1" entre bandas)
```

Para T6 (banda más alta), sub-bandas internas, una por ordenamiento:

```
┌─────────────────────────────────────────────────────────────────┐
│ GRUPO 6 · Modernizar las reglas sector por sector                │
│ Las reformas dentro de este grupo no se necesitan unas a otras.  │
│                                                                  │
│  ──── <Nombre formateado de LACCEJ> ────                         │
│  [R-07] [R-08] [R-10] [R-13] [R-15]                              │
│                                                                  │
│  ──── <Nombre formateado de LOAEEJ> ────                         │
│  [R-17] [R-18] [R-19] [R-20] [R-25]                              │
│                                                                  │
│  ... (8 sub-bandas en total, ver listado en §5.1.3)              │
└─────────────────────────────────────────────────────────────────┘
```

**Anatomía de la card de reforma:**

```
┌──────────────────────────┐
│ <título humano de la      │  ← serif, 16-18px, weight 400, 3 líneas máx
│  reforma, de              │
│  reformas.json>           │
│                           │
│ <ordenamiento> Art. X     │  ← small caps tracked-out, 11px
│ Prioridad <alta/media/    │
│  baja>                    │
│                           │
│                    R-NN   │  ← mono, 10px, esquina inferior derecha
└──────────────────────────┘
```

Ancho fijo de card (~220px), altura natural por contenido, gap consistente entre cards de la misma fila.

**Aristas SVG intra-tramo:**

Capa SVG superpuesta a la banda (position: absolute dentro de la banda, pointer-events: none salvo en las flechas mismas si se quieren tooltipear, pero no se quieren).

Para cada par `(predecesor, sucesor)` donde el sucesor lista al predecesor en `dependencias[]` Y ambos están en el mismo tramo (mismo grupo, en T6 misma sub-banda): dibujar path SVG con marker arrowhead. Curva o línea recta según layout; bezier suave es preferible a línea quebrada.

Las dependencias entre reformas que cruzan tramos (raras pero existen, ej. "R-100 depende de R-21" mencionado en sintesis) se ignoran visualmente en esta viz (el orden de tramos ya las implica). Si surge una dependencia inter-tramo donde el predecesor está en un tramo posterior al sucesor: error en datos, abortar y reportar.

**Efecto de hover:**

Cuando `hoveredId !== null`:
- Calcular `resaltadas = transitiveSet(hoveredId, forward) ∪ transitiveSet(hoveredId, backward)`.
- Cards en `resaltadas`: opacity 1.
- Cards no en `resaltadas`: opacity 0.3.
- Aristas que conectan cards ambas en `resaltadas`: opacity 1, color navy.
- Aristas no relevantes: opacity 0.2.

Cuando `hoveredId === null`: todo opacity 1.

Transiciones CSS: opacity 200ms ease.

**Click en card:**

```tsx
<a href={'/sintesis/reformas/' + reforma.id} className="card-link">
  ... contenido de card ...
</a>
```

(Concatenación con `+`. Recordar regla.)

Click navega full-page. No modal.

**Mobile (`@media (max-width: 768px)`):**

Renderizar como lista vertical:

```
GRUPO 1 · <título>
<frase>
  • R-01 — <título>
  • R-02 — <título>
  • R-03 — <título>
  • R-04 — <título>

GRUPO 2 · <título>
...
```

Sin SVG, sin hover, sin atenuación. Cards reducidas a list items con título + handle. Cada item sigue siendo `<a href={'/sintesis/reformas/' + r.id}>`.

Detectar mobile con CSS media queries en `RutaCritica.css` ocultando el SVG y reformateando el grid a `display: block` por banda. **No usar JS para detectar viewport** — todo CSS.

### 5.1.1 Copy de los 7 grupos

**Grupo 1**

```
Título:   Reconocer el derecho a la energía en la Constitución de Jalisco
Frase:    Es el cimiento. Cualquier ley posterior puede ser tumbada con
          otra ley si no tiene piso constitucional. Por eso este grupo
          va primero.
```

**Grupo 2**

```
Título:   Actualizar las leyes de Jalisco que citan leyes federales que
          ya no existen
Frase:    En marzo de 2025 el Congreso federal abrogó dos leyes clave
          del sector energético. Las leyes de Jalisco siguen citándolas.
          Hasta que se corrija, hay artículos estatales que apuntan a
          vacío.
```

**Grupo 3**

```
Título:   Construir la coordinación entre Jalisco, la Federación y los
          municipios
Frase:    Las reformas siguientes necesitan instituciones claras que
          las apliquen. Primero se firman convenios con la Federación,
          después se monta una ventanilla única, después se coordina
          con los municipios.
```

**Grupo 4**

```
Título:   Asegurar el dinero para que las reformas se puedan ejecutar
Frase:    Una reforma sin presupuesto queda en papel. Primero se crea
          un fondo autónomo, después el instrumento fiscal que lo
          nutre, después los incentivos que paga, y al final el
          procedimiento para acceder a recursos federales.
```

**Grupo 5**

```
Título:   Proteger las decisiones de Jalisco para que no se caigan en
          tribunales
Frase:    Hoy hay dos motivos por los que el Estado puede perder un
          juicio en materia energética: invadir competencias federales
          o no consultar a comunidades indígenas. Estas reformas
          atienden los dos.
```

**Grupo 6**

```
Título:   Modernizar las reglas sector por sector
Frase:    Las reformas dentro de este grupo no se necesitan unas a
          otras. Cada cadena temática puede avanzar a su propio ritmo,
          sin esperar a las demás. Por eso este es el bloque más
          extenso.
```

**Grupo 7**

```
Título:   Pendientes que dependen del Congreso de la Unión
Frase:    Jalisco no puede aprobar estas. Quedan registradas como
          agenda política frente a la Federación. El Ejecutivo estatal
          puede impulsarlas, pero no decidirlas.
```

### 5.1.2 Sub-bandas de T6

Renderizar los sub-grupos en este orden, usando `OrdenamientoName.astro` para el header de cada uno (formato italic/bold/small ya existente):

1. **LACCEJ** → R-07, R-08, R-10, R-13, R-15
2. **LOAEEJ** → R-17, R-18, R-19, R-20, R-25
3. **LAEJ** → R-31 → R-32, R-33, R-34, R-36
4. **LPIPSEJM** → R-37 → R-38, R-39, R-40, R-41, R-42
5. **LGAPM** → R-46, R-47, R-48, R-50, R-53
6. **LEEEPA-Jal / REEEPA** → R-63 → R-75, R-64, R-68, R-73 → R-74
7. **LJAEJ** → R-82, R-83, R-84, R-86
8. **LMR-Jal** → R-91 → R-92, R-93, R-94, R-95, R-96

Las flechas indicadas (`R-NN → R-NN`) corresponden al campo `dependencias[]` y se renderizan como aristas SVG dentro de cada sub-banda.

### 5.1.3 Validación al construir el componente

Al recibir props, verificar:
- 7 tramos exactos.
- Suma de reformas en tramos = 65.
- Cada reforma referenciada en `forward[id]` o `backward[id]` existe en `tramos[*].reformas` o en independientes.
- T6 tiene `subgrupos` populado.
- Tramos 1-5 y 7 NO tienen `subgrupos` (o lo tienen vacío).

Si falla cualquier check: render de error visible en dev (console.error + banner rojo en página). En prod, mismo banner.

---

### 5.2 `RutaCritica.css`

Variables nuevas (si no existen ya en `tokens.css`):

```css
--ruta-card-width: 220px;
--ruta-card-gap: 32px;
--ruta-banda-padding-y: 48px;
--ruta-arrow-color: var(--color-navy);
--ruta-arrow-width: 1.5px;
--ruta-fade-opacity: 0.3;
--ruta-transition: opacity 200ms ease;
```

Estilos:

- `.ruta-banda` — contenedor de cada tramo, position: relative para SVG superpuesto.
- `.ruta-banda-header` — eyebrow + título + frase, centrado o left-aligned consistente con el resto del sitio.
- `.ruta-cards-row` — flex o grid horizontal con gap.
- `.ruta-card` — borde hairline, padding consistente, position: relative para handle abajo derecha.
- `.ruta-card a` — toda la card es link.
- `.ruta-card.faded` — opacity var(--ruta-fade-opacity).
- `.ruta-card.highlighted` — opacity 1 (sobreescribe faded).
- `.ruta-svg-layer` — position: absolute, top: 0, left: 0, width: 100%, height: 100%, pointer-events: none.
- `.ruta-arrow` — stroke navy, fill none, marker-end: url(#arrowhead).
- `.ruta-arrow.faded` — opacity 0.2.
- `.ruta-tramo-divider` — hairline horizontal entre bandas, con label `T1 ⊢ T2` centrado.
- `.ruta-t6-subbanda` — separador interno dentro de T6 con header de ordenamiento.

Mobile (`@media (max-width: 768px)`):

- `.ruta-svg-layer` → `display: none`.
- `.ruta-cards-row` → `flex-direction: column` o `display: block`, gap reducido.
- `.ruta-card` → ancho 100%, padding reducido.

---

### 5.3 `TocSidebar.astro`

**Naturaleza:** componente Astro estático (no React, no necesita interactividad reactiva — solo CSS sticky + scroll suave nativo).

**Props:**

```ts
interface TocItem {
  id: string;      // anchor id sin "#"
  label: string;   // texto a mostrar
}

interface Props {
  items: TocItem[];
  title?: string;  // opcional, default "En esta página"
}
```

**Render:**

```astro
<aside class="toc-sidebar">
  <p class="toc-title">{title ?? 'En esta página'}</p>
  <ol class="toc-list">
    {items.map((item, i) => (
      <li class="toc-item">
        <a href={'#' + item.id}>
          <span class="toc-number">{String(i + 1).padStart(2, '0')}</span>
          <span class="toc-label">{item.label}</span>
        </a>
      </li>
    ))}
  </ol>
</aside>
```

**Estilos (en `TocSidebar.css` o inline en el `.astro`):**

- `position: sticky; top: 80px;` (debajo del header).
- Tipografía: small caps tracked-out 11px para number; serif 14px para label.
- Hairline left vertical en cada item activo.
- `scroll-behavior: smooth` en `html` (probablemente ya está en `global.css`; si no, agregar a `global.css`).
- Mobile: `display: none`.

---

## 6. Drawer.astro — actualización

Agregar entrada de `/sintesis/ruta-critica` en la jerarquía de navegación, dentro del bloque "Síntesis ejecutiva", entre las entradas existentes. Verificar la posición correcta leyendo el componente actual y manteniendo consistencia con el orden ya establecido (probablemente justo después de "Reformas").

---

## 7. TODOs

Ninguno. El brief contiene todos los datos necesarios.

---

## 8. Acceptance criteria

Antes de declarar Fase 6 completa, verificar:

1. `npm run build` pasa sin errores ni warnings nuevos.
2. Las 4 páginas renderizan sin errores en `localhost:4321`.
3. Las 6 métricas del home consumen valores reales de los JSON. Si los conteos no son 80/101/207/40/62/20, abortar y reportar discrepancia (no "ajustar" para que cuadre).
4. `/sintesis/ruta-critica` valida en frontmatter: 65 en ruta + 35 independientes + 1 R-101 = 101.
5. La viz tiene exactamente 7 bandas. T6 tiene 8 sub-bandas. Las cadenas dibujadas coinciden con el campo `dependencias[]` de cada reforma.
6. Hover en cualquier card de la viz resalta el conjunto transitivo correcto. Click navega a `/sintesis/reformas/R-NN` y carga la ficha existente.
7. Mobile (≤768px): `/sintesis/ruta-critica` se ve como lista vertical sin SVG, todas las cards siguen siendo clicables.
8. TOC de `/metodologia` tiene 6 anchors funcionales. Click hace scroll suave a la sección.
9. `/contacto` tiene el form con `action="https://formspree.io/f/xqewjdjp"` y método POST.
10. Drawer incluye link a `/sintesis/ruta-critica`.
11. Cero template literals con backticks en archivos `.tsx` o `.jsx` agregados (regla v1.2). Verificar con `grep -rn '\`' src/components/RutaCritica.tsx` → debe dar 0 matches.
12. Cero datos inventados, cero citas fabricadas. Toda referencia a artículos viene de los JSON.

---

## 9. Cierre de fase

### 9.1 Bump ARCHITECTURE.md a v1.6

Insertar al inicio (después del header, antes de Changelog v1.5):

```markdown
### Changelog v1.6
- **Fase 6 completada**: 4 páginas singulares implementadas (`/`, `/metodologia`,
  `/contacto`, `/sintesis/ruta-critica`) y 3 componentes nuevos
  (`RutaCritica.tsx`, `RutaCritica.css`, `TocSidebar.astro`).
- **Visualización de la ruta crítica**: vertical waterfall por tramos con
  aristas SVG intra-tramo según campo `dependencias[]`. T6 sub-agrupada por
  ordenamiento en 8 sub-bandas. Hover transitivo (predecesoras y sucesoras
  recursivas). Mobile: lista degradada sin SVG.
- **Drawer actualizado** para incluir `/sintesis/ruta-critica`.
- **Endpoint Formspree registrado**: `https://formspree.io/f/xqewjdjp`.
```

Cambiar header:

```
**Documento de traspaso · Versión 1.6 · Abril 2026**
**Estado: Fases 1, 2, 3, 4, 5 y 6 completadas. Fase 7 por iniciar.**
```

Cambiar footer del archivo:

```
**Fin de ARCHITECTURE.md v1.6**
```

### 9.2 NOTES.md — agregar bloque

Agregar al final con encabezado de fecha. Contenido sugerido:

```
## Fase 6 — Decisiones técnicas

- Validación de conteos en frontmatter del home y de ruta-crítica:
  abortar el build si los totales no coinciden con los esperados
  (80/101/207/40/62/20 y 65/35/1). Razón: detectar regresiones del
  parser temprano.
- TocSidebar.astro implementado como componente estático (sin React).
  El scroll suave se delega a CSS (scroll-behavior: smooth) para evitar
  un island innecesario.
- RutaCritica.tsx valida props internamente y renderiza banner de error
  visible si falla. Razón: detectar regresiones de datos en build sin
  romper el sitio en silencio.
- Mobile de la ruta crítica: lista degradada vía CSS media queries.
  Sin detección JS de viewport.
- Las dependencias inter-tramo no se renderizan como aristas (el orden
  de tramos ya las implica). Si aparece una dependencia inversa
  (predecesor en tramo posterior al sucesor): se aborta el build.
```

### 9.3 Commit

```
git add -A
git commit -m "Fase 6: home, metodología, contacto, ruta crítica + componentes

- /, /metodologia, /contacto, /sintesis/ruta-critica
- RutaCritica.tsx + RutaCritica.css
- TocSidebar.astro
- Drawer actualizado
- ARCHITECTURE.md v1.6
- NOTES.md actualizado"
git push origin main
```

---

## 10. Si algo no queda claro

1. Releer `ARCHITECTURE.md` v1.5 §5 (especificación por página) y §3 (estructura de archivos).
2. Releer `sintesis_ejecutiva_jalisco.md` líneas 800-830 (descripción original de los tramos en lenguaje técnico — referencia, no copy).
3. No inventar. Flagear como pregunta y dejar TODO en el código.
4. No "ajustar para que cuadre" si los conteos no dan: abortar y reportar.

---

**Fin del brief.**
