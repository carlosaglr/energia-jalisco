# Observatorio del Sistema de Energía de Jalisco

Sitio web editorial que publica el análisis jurídico-regulatorio del sistema energético de Jalisco frente al marco federal mexicano vigente.

## Stack

- Astro 4.16 (renderizado estático)
- React 18 (solo islands interactivos)
- CSS vanilla con custom properties (no frameworks)
- TypeScript strict

## Estructura

```
observatorio/
├── public/
│   └── robots.txt
├── src/
│   ├── components/      # Componentes Astro (.astro)
│   ├── data/            # JSON de Fase 1 (35 archivos)
│   ├── layouts/
│   │   └── Editorial.astro
│   ├── pages/
│   │   ├── index.astro  # Home mínima (Fase 6 completa)
│   │   └── demo.astro   # Spec visual viva del design system
│   └── styles/
│       ├── tokens.css
│       ├── typography.css
│       ├── components.css
│       ├── layout.css
│       └── global.css   # Importa los cuatro anteriores
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Uso

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # Genera dist/
npm run preview  # Sirve dist/ localmente
```

## Rutas disponibles

| Ruta | Descripción |
|---|---|
| `/` | Home mínima (se completa en Fase 6) |
| `/demo` | Spec visual del design system — todos los componentes base |

## Design system

Ver `src/styles/` y la página `/demo` que renderiza:

1. Escala tipográfica (display, section, card, body editorial, body compact, eyebrow, mono, label)
2. MetricsRow (4 y 6 columnas)
3. PriorityTag (Alta, Media, Baja)
4. OrdenamientoName (los 11 ordenamientos estatales)
5. Tabs (activo/inactivo) y Select estilizado
6. Distribution bars
7. Cross-references con tooltips
8. NavCards
9. Buttons

## Licencia

Contenido bajo licencia [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Código del sitio sin licencia específica aún (pendiente de decidir).

Este contenido **no está autorizado** para entrenamiento de modelos de IA.
