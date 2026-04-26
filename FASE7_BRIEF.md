# FASE 7 · BRIEF DE IMPLEMENTACIÓN PARA CLAUDE CODE

**Proyecto:** Observatorio del Sistema de Energía de Jalisco
**Repo:** github.com/carlosaglr/energia-jalisco
**Estado al inicio:** Fases 1–6 completadas. Fase 7 por implementar.
**Spec autoridad:** `ARCHITECTURE.md` (versión actual del repo).

---

## 0. Lecturas obligatorias antes de empezar

1. `ARCHITECTURE.md` — sobre todo §3 (estructura de archivos), §7 (descripción de Fase 7).
2. `NOTES.md` — decisiones técnicas históricas, especialmente las de Fase 6.
3. `src/components/Drawer.astro` — estado actual de la navegación.
4. `src/components/CrossRef.tsx` y `src/components/CrossRefText.tsx` — componentes ya implementados que se van a auditar.
5. `src/data/cross-references.json` — grafo de relaciones precalculado por el parser.
6. Estructura completa de `src/pages/` para inventariar todas las URLs existentes.

---

## 1. Reglas duras (no negociables)

1. **Strings en `.tsx`/`.jsx`: concatenación con `+`.** Nunca template literals.
2. **Pre-procesamiento en frontmatter `.astro`, no en runtime React.**
3. **Lenguaje del copy: simple, humano, directo.** Lector primario: Congreso del Estado y público interesado no necesariamente experto. **Prohibido el fraseo "Esto no es X, es Y".**
4. **No inventar datos.** Si un dato falta, flagearlo, no rellenarlo.
5. **Idioma: español.**
6. **Diseño: Julius Bär puro, modo claro.** Respetar tokens existentes.
7. **Cero archivos config en `src/data/`.**

---

## 2. Entregables

**1 componente nuevo:**
- `src/components/SearchWidget.tsx` (modal flotante con Pagefind)
- `src/components/SearchWidget.css`

**3 archivos modificados:**
- `src/components/Drawer.astro` — navegación jerárquica completa
- `src/components/Header.astro` — agregar ícono de lupa que dispara el modal
- `src/layouts/Editorial.astro` — montar `<SearchWidget>` global y atajo de teclado `/`

**1 instalación + integración:**
- Pagefind como dependencia dev y como step del build pipeline.

**1 auditoría:**
- Cross-references resueltos con tooltip en todas las páginas que contienen códigos R-NN o NA.NN en su texto.

**1 cierre de fase:**
- `ARCHITECTURE.md` → bump a v1.7 con changelog.
- `NOTES.md` → decisiones técnicas de Fase 7.
- Commit y push.

---

## 3. Orden de ejecución

1. **Pagefind** — instalación, integración al build, generación del índice. Smoke test antes de tocar UI.
2. **`SearchWidget.tsx` + CSS** — modal flotante con UI Julius Bär.
3. **`Header.astro` + `Editorial.astro`** — montaje del modal, ícono lupa, atajo `/`.
4. **`Drawer.astro`** — navegación jerárquica completa.
5. **Auditoría de cross-references** — barrer páginas y completar cobertura.
6. **Cierre de fase** (ARCHITECTURE v1.7 + NOTES.md + commit).

Después de cada paso: `npm run build` debe pasar sin errores antes de continuar.

---

## 4. Pagefind — integración

### 4.1 Instalación

```bash
npm install -D pagefind
```

### 4.2 Build pipeline

Modificar el script `build` en `package.json` para que después del build de Astro genere el índice de Pagefind sobre la carpeta `dist/`:

```json
"scripts": {
  "build": "astro build && pagefind --site dist"
}
```

Pagefind escanea el HTML estático generado por Astro, indexa el contenido y produce `dist/pagefind/` con los assets del cliente (JS + WebAssembly + fragmentos del índice).

### 4.3 Configuración de qué se indexa

Pagefind indexa por defecto el contenido dentro de elementos con atributo `data-pagefind-body`. Para controlar qué entra al índice:

- En `Editorial.astro` agregar `data-pagefind-body` al `<main>` que envuelve el contenido de cada página. Eso indexa solo el cuerpo, no header/footer/drawer.
- Excluir elementos no deseados con `data-pagefind-ignore` (botones, badges decorativos, tags de prioridad si se considera ruido).

Configurar también el atributo `data-pagefind-meta` para que cada página exponga metadata útil al modal:

- En cada `.astro` de página, dentro del `<main>`, agregar al inicio:
  ```html
  <span data-pagefind-meta="seccion:Síntesis ejecutiva" hidden></span>
  ```
  donde el valor varía por sección: "Síntesis ejecutiva", "Marco normativo", "Metodología", "Contacto", "Inicio".

Esto permite agrupar resultados en el modal por sección de origen.

### 4.4 .gitignore

Agregar `dist/pagefind/` no es necesario porque `dist/` ya debería estar ignorado. Verificar.

---

## 5. `SearchWidget.tsx` — especificación

### 5.1 Naturaleza

React island con `client:load` (necesita estado, listeners de teclado, foco gestionado).

Montado **una sola vez** en `Editorial.astro` para que esté disponible en todas las páginas. Su visibilidad la controla un estado interno `isOpen`.

### 5.2 Disparadores de apertura

1. Tecla `/` desde cualquier parte del sitio (excepto cuando hay un input ya enfocado).
2. Click en el ícono de lupa del header.
3. Bus de eventos custom: `window.dispatchEvent(new CustomEvent('open-search'))`. Usado por el header para comunicarse con el widget que vive en otro island.

### 5.3 Cierre

1. Tecla `Esc`.
2. Click en el backdrop (área oscura fuera del modal).
3. Click en un resultado (navega y cierra).
4. Botón `×` arriba a la derecha del modal.

### 5.4 Estructura visual

```
┌─────────────────────────────────────────────────────────────┐
│                     [backdrop con blur]                       │
│                                                                │
│       ┌────────────────────────────────────────────────┐     │
│       │  BUSCAR                                     ×  │     │
│       │  ─────────────────────────────────────────────  │     │
│       │  [input de búsqueda, placeholder "Buscar..."  ] │     │
│       │                                                   │     │
│       │  ─────────────────────────────────────────────  │     │
│       │                                                   │     │
│       │  SÍNTESIS EJECUTIVA                                │     │
│       │  ─ Resultado 1 (título serif, snippet con          │     │
│       │       <mark> en términos coincidentes)             │     │
│       │  ─ Resultado 2                                     │     │
│       │                                                   │     │
│       │  MARCO NORMATIVO                                   │     │
│       │  ─ Resultado 3                                     │     │
│       │                                                   │     │
│       │  Press ↵ to go · Esc to close                     │     │
│       └────────────────────────────────────────────────┘     │
│                                                                │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 Estado interno

```ts
const [isOpen, setIsOpen] = useState(false);
const [query, setQuery] = useState('');
const [results, setResults] = useState<GroupedResults>({});
const [loading, setLoading] = useState(false);
const inputRef = useRef<HTMLInputElement>(null);
```

### 5.6 Carga de Pagefind

Pagefind se carga dinámicamente la primera vez que se abre el modal:

```ts
const pagefindRef = useRef<any>(null);

async function loadPagefind() {
  if (pagefindRef.current) return pagefindRef.current;
  // Import dinámico del bundle generado en dist/pagefind
  // @ts-ignore
  const pf = await import(/* @vite-ignore */ '/pagefind/pagefind.js');
  await pf.init();
  pagefindRef.current = pf;
  return pf;
}
```

(Concatenación con `+` si se construyen URLs. Recordar regla.)

### 5.7 Búsqueda con debounce

Cuando `query` cambia: debounce 200ms, después llamar `pagefind.search(query)`. El resultado tiene una estructura tipo:

```ts
{
  results: [
    {
      id: '...',
      data: () => Promise<{
        url: string;
        meta: { title: string; seccion: string };
        excerpt: string;          // HTML con <mark> en coincidencias
      }>
    },
    ...
  ]
}
```

Resolver `data()` para los primeros 20 resultados, agrupar por `meta.seccion`, mostrar.

### 5.8 Navegación con teclado

- `↓` / `↑`: mover el foco entre resultados.
- `↵`: navegar al resultado seleccionado (`window.location.href = result.url`).
- `Esc`: cerrar.
- Tab: foco entre input → primer resultado → botón cerrar.

### 5.9 Accesibilidad

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al heading "BUSCAR".
- Atrapar el foco dentro del modal mientras esté abierto.
- Restaurar el foco al elemento que abrió el modal cuando se cierra.
- `lang="es"` heredado del documento.

### 5.10 Responsive

- Desktop: modal centrado, ancho máximo 640px, top: 15vh.
- Mobile: modal full-screen, sin backdrop visible (o backdrop sólido), input fijo arriba, resultados scrolleables.

### 5.11 Estilos (`SearchWidget.css`)

Respetar tokens del design system. Ejemplos:

- Backdrop: `rgba(27, 44, 94, 0.4)` (var navy con alpha) + `backdrop-filter: blur(8px)`.
- Modal: fondo blanco, sombra discreta, hairline border.
- Input: serif 18px, sin border salvo hairline inferior cuando enfocado.
- Headings de sección dentro del modal: small caps tracked-out, navy.
- Resultados: serif 15px, hover con fondo gris muy tenue.
- `<mark>`: fondo amarillo claro, sin border-radius, sin padding extra.
- Transiciones: opacity 150ms ease en apertura/cierre.

---

## 6. `Header.astro` — agregar ícono de lupa

Estado actual: logo a la izquierda, botón hamburguesa a la derecha.

Agregar un botón de lupa **a la izquierda del botón hamburguesa**.

```html
<button
  class="header-search-trigger"
  aria-label="Buscar en el sitio"
  type="button"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.5">
    <circle cx="11" cy="11" r="7"/>
    <line x1="16.5" y1="16.5" x2="21" y2="21"/>
  </svg>
</button>
```

JS inline al final del `Header.astro` (Astro permite `<script>` con type module):

```html
<script>
  document.querySelector('.header-search-trigger')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-search'));
  });
</script>
```

Estilo del botón: ícono navy stroke 1.5px, sin background, hover con opacity 0.7. Mismo tamaño y peso visual que la hamburguesa.

---

## 7. `Editorial.astro` — montaje del modal y atajo `/`

Cambios:

1. Agregar `<SearchWidget client:load />` al final del `<body>`, fuera del `<main>`.
2. Agregar atributo `data-pagefind-body` al `<main>`.
3. Agregar `<script>` global para el atajo de teclado `/`:

```html
<script>
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/') return;
    // No disparar si hay un input/textarea enfocado
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
      return;
    }
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-search'));
  });
</script>
```

El componente `SearchWidget` escucha `'open-search'` con `useEffect` y setea `isOpen = true`.

---

## 8. `Drawer.astro` — navegación jerárquica completa

Estructura final del drawer (con indentación para reflejar jerarquía):

```
Inicio                                              →  /
Síntesis ejecutiva                                  →  /sintesis
  Hallazgos
    Debilidades del marco estatal                   →  /sintesis/mapa/debilidades
    Condicionamientos del marco federal             →  /sintesis/mapa/condicionamientos
  Reformas
    Las 101 reformas                                →  /sintesis/reformas
    Ruta crítica                                    →  /sintesis/ruta-critica
  Proyectos
    Vista general                                   →  /sintesis/proyectos
    Viables hoy                                     →  /sintesis/proyectos/viables-hoy
    Con reforma estatal                             →  /sintesis/proyectos/reforma-estatal
    Con reforma federal                             →  /sintesis/proyectos/reforma-federal
    Habilitaciones federales                        →  /sintesis/proyectos/habilitaciones
  Conflictos de competencia                         →  /sintesis/conflictos
  Vacíos federal-estatal                            →  /sintesis/vacios
  Casos de máximo riesgo                            →  /sintesis/riesgos
  Huecos documentales                               →  /sintesis/huecos
  Próximos pasos                                    →  /sintesis/siguiente
Marco normativo                                     →  /marco
  Federal
    [9 items dinámicos desde ordenamientos.json
     filtrados por ambito === 'federal',
     ordenados como en /marco]
  Estatal
    [11 items dinámicos desde ordenamientos.json
     filtrados por ambito === 'estatal',
     ordenados como en /marco]
Metodología                                         →  /metodologia
Contacto                                            →  /contacto
```

### 8.1 Pre-procesamiento en frontmatter

```js
const ordenamientos = (await import('../data/ordenamientos.json')).default;
const ordsFederales = ordenamientos.filter(o => o.ambito === 'federal');
const ordsEstatales = ordenamientos.filter(o => o.ambito === 'estatal');

if (ordsFederales.length !== 9) throw new Error('Esperaba 9 federales, vi ' + ordsFederales.length);
if (ordsEstatales.length !== 11) throw new Error('Esperaba 11 estatales, vi ' + ordsEstatales.length);
```

### 8.2 Render de los 20 ordenamientos

Cada item del drawer dentro de "Federal" / "Estatal" es:

```html
<a href={'/marco/' + ord.ambito + '/' + ord.slug} class="drawer-item drawer-item-leaf">
  <OrdenamientoName tag={ord.tag} short={true} />
</a>
```

Donde `short={true}` hace que `OrdenamientoName` use una versión compacta del nombre (solo el `core` en bold + el `prefix` truncado, sin `suffix` largo). Si el componente no tiene esta prop, agregarla.

### 8.3 Estilos del drawer

- Items de nivel 1 (Inicio, Síntesis ejecutiva, Marco normativo, Metodología, Contacto): sans 14px weight 500, tracking 0.04em, uppercase, navy.
- Items de nivel 2 (Hallazgos, Reformas, Proyectos, Federal, Estatal): sans 13px weight 400, tracking 0.04em, navy con opacity 0.7. **Estos no son links**, solo agrupadores visuales.
- Items de nivel 3 (hojas): sans 13px weight 400, navy. Hover con underline.
- Indentación visual con padding-left progresivo, no con caracteres.

### 8.4 Item activo

El item correspondiente a la URL actual lleva clase `drawer-item-active` con un hairline vertical navy a la izquierda. Detectarlo en frontmatter comparando con `Astro.url.pathname`.

---

## 9. Auditoría de cross-references

### 9.1 Cobertura objetivo

Todo string visible al usuario que contenga un código `R-NN` o `NA.NN` (donde NA es 1A, 1B, 2, 3A, 3B, 3C, 3D, 4A, 4B, 4C, 5, 6) debe estar envuelto en `CrossRefText` para activar el tooltip.

### 9.2 Ya cubierto (Fases anteriores)

- Fichas individuales de reforma `/sintesis/reformas/[codigo]` — Fase 4.
- Narrativas 4C `/sintesis/riesgos` — Fase 4.
- Lista de huecos 5 `/sintesis/huecos` — Fase 4.
- Fichas de ordenamiento `/marco/<ambito>/<slug>` vía `BloqueContent.tsx` — Fase 5.

### 9.3 A auditar y completar

Barrer estas páginas y verificar que el campo de texto principal de cada item pase por `CrossRefText`:

- `/sintesis/mapa/debilidades` (1A) — campo `texto` o equivalente.
- `/sintesis/mapa/condicionamientos` (1B).
- `/sintesis/reformas` (explorer del listado, no las fichas).
- `/sintesis/proyectos/viables-hoy` (3A) — campo `condicion`.
- `/sintesis/proyectos/reforma-estatal` (3B) — campo `condicion` y `reformas_requeridas`.
- `/sintesis/proyectos/reforma-federal` (3C).
- `/sintesis/proyectos/habilitaciones` (3D).
- `/sintesis/conflictos` (4A) — descripción del conflicto.
- `/sintesis/vacios` (4B).
- `/sintesis/siguiente` (6) — campo `condicionamientos` o `requiere_reforma`.

Para cada página, abrirla y verificar visualmente que los códigos R-NN aparecen subrayados (estilo de `CrossRefText`) y muestran tooltip al hover. Si una página tiene códigos que no se subrayan, agregar `<CrossRefText text={item.campo} />` al renderer correspondiente del Explorer config.

### 9.4 Vistas transversales

`/ordenamiento/[tag]` ya agrega contenido de múltiples secciones. Verificar que cada bloque dentro de la página use `CrossRefText` cuando renderiza texto con códigos.

### 9.5 RutaCritica

Las cards del waterfall solo muestran el título de la reforma (sin códigos en el texto). No requieren `CrossRefText`. Confirmar.

### 9.6 Reporte de auditoría

Al finalizar la auditoría, dejar en `NOTES.md` (durante el cierre de fase) una tabla con: página, estado pre-auditoría (cubierto / parcial / no cubierto), cambio aplicado.

---

## 10. Acceptance criteria

1. `npm run build` ejecuta `astro build && pagefind --site dist` sin errores.
2. `dist/pagefind/` existe con archivos `pagefind.js`, `pagefind.wasm` y fragmentos del índice.
3. `npm run preview` sirve el sitio y la búsqueda funciona end-to-end.
4. Tecla `/` desde cualquier página abre el modal de búsqueda.
5. Click en ícono lupa del header abre el modal.
6. Tipear en el input devuelve resultados agrupados por sección con highlights `<mark>`.
7. Click en un resultado navega a la página y cierra el modal.
8. `Esc` cierra el modal y restaura el foco al elemento que lo abrió.
9. Drawer muestra la jerarquía completa con los 20 ordenamientos listados bajo Federal/Estatal.
10. Item del drawer correspondiente a la URL actual aparece con estilo activo.
11. Auditoría de cross-references completa: todos los códigos R-NN y NA.NN visibles en el sitio activan tooltip al hover.
12. Cero template literals con backticks en archivos `.tsx` o `.jsx` agregados o modificados.
13. Mobile (≤768px): el modal de búsqueda funciona correctamente y el drawer sigue accesible.

---

## 11. Cierre de fase

### 11.1 Bump ARCHITECTURE.md a v1.7

Insertar al inicio (después del header, antes del changelog vigente):

```markdown
### Changelog v1.7
- **Fase 7 completada**: navegación jerárquica completa en `Drawer.astro`,
  búsqueda full-text estática con Pagefind, modal flotante `SearchWidget.tsx`
  con atajo `/` y trigger desde lupa en header, auditoría de cross-references
  en todas las páginas con códigos visibles.
- **Pagefind integrado al build pipeline**: `npm run build` ejecuta
  `astro build && pagefind --site dist`. El índice se genera en
  `dist/pagefind/` y se sirve estáticamente.
- **Drawer expandido**: nivel 1 (secciones), nivel 2 (agrupadores no
  clicables), nivel 3 (hojas). Los 20 ordenamientos listados bajo
  Federal/Estatal de forma dinámica desde `ordenamientos.json`.
- **Atajo de teclado `/`** registrado globalmente en `Editorial.astro`,
  con guarda para no disparar cuando hay un input enfocado.
```

Cambiar header:
```
**Documento de traspaso · Versión 1.7 · Abril 2026**
**Estado: Fases 1, 2, 3, 4, 5, 6 y 7 completadas. Fase 8 por iniciar.**
```

Cambiar footer:
```
**Fin de ARCHITECTURE.md v1.7**
```

### 11.2 NOTES.md — agregar bloque

```
## Fase 7 — Decisiones técnicas

- Pagefind elegido como motor de búsqueda. Razón: estático, sin servidor,
  funciona con build de Astro, gratis, índice incremental, soporta español
  con stemming básico.
- Modal flotante elegido sobre página dedicada o sidebar fijo. Razón:
  no compite con el drawer hamburguesa por espacio, no rompe la jerarquía
  editorial Julius Bär, convención web reconocible (atajo `/`).
- Carga dinámica del bundle de Pagefind: import() en el primer abrir
  del modal, no en el bundle inicial. Razón: el WASM pesa ~80kb, cargarlo
  on-demand mantiene el TTI bajo en home.
- Agrupación de resultados por sección via `data-pagefind-meta="seccion:..."`
  en cada página. Razón: contexto del resultado más útil que solo URL.
- Auditoría de cross-references: [llenar con la tabla del §9.6].
```

### 11.3 Commit

```
git add -A
git commit -m "Fase 7: navegación, búsqueda Pagefind, auditoría cross-refs

- SearchWidget.tsx + SearchWidget.css (modal flotante)
- Header con ícono lupa + atajo /
- Drawer con jerarquía completa y 20 ordenamientos dinámicos
- Pagefind integrado al build pipeline
- Cross-references auditados y completados en todas las páginas
- ARCHITECTURE.md v1.7
- NOTES.md actualizado"
git push origin main
```

---

## 12. Si algo no queda claro

1. Releer `ARCHITECTURE.md` §3 (estructura de archivos) y §7 (Fase 7).
2. Para problemas con Pagefind: documentación oficial en pagefind.app (no inventar APIs, consultar y reportar si algo no funciona como dice el brief).
3. Para auditoría de cross-references: si una página tiene códigos en un campo que el Explorer config no envuelve con `CrossRefText`, modificar el config de esa página, no el componente `Explorer.tsx`. La extensibilidad del Explorer ya está diseñada para esto (Fase 4 v1.3 agregó `tagXref`).
4. No "ajustar para que cuadre" si los conteos de ordenamientos no dan 9/11: abortar y reportar.

---

**Fin del brief.**
