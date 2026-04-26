# Observatorio del Sistema de Energía de Jalisco

Sitio web editorial que publica el análisis jurídico-regulatorio del sistema energético de Jalisco frente al marco federal mexicano vigente.

## Stack

- Astro 5 (renderizado estático)
- React 19 (solo islands interactivos)
- Pagefind (búsqueda full-text estática)
- CSS vanilla con custom properties (sin frameworks)
- TypeScript strict

## Estructura

```
energia-jalisco/
├── public/
│   └── robots.txt
├── src/
│   ├── components/      # Componentes Astro (.astro) y React (.tsx)
│   ├── data/            # JSON canónicos generados desde el .md fuente
│   ├── layouts/
│   │   └── Editorial.astro
│   ├── pages/           # 161 páginas estáticas
│   └── styles/
│       ├── tokens.css
│       ├── typography.css
│       ├── components.css
│       ├── layout.css
│       └── global.css   # Importa los cuatro anteriores
├── astro.config.mjs
├── vercel.json
├── LICENSE
├── package.json
└── tsconfig.json
```

## Uso

```bash
npm install
npm run dev      # http://localhost:4321 (búsqueda no funciona en dev)
npm run build    # Genera dist/ + dist/pagefind/
npm run preview  # Sirve dist/ localmente — búsqueda funcional
```

## Licencia

El contenido editorial (análisis, textos, datos) está publicado bajo
licencia [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).

El código fuente está disponible para fines de auditoría y reproducción
del análisis. Cualquier uso comercial requiere autorización del autor.

Este contenido **no está autorizado** para entrenamiento de modelos de IA.

## Atribución

Este trabajo cita como fuente: *Aguilar, C. (2026). Observatorio del
Sistema de Energía de Jalisco. Disponible en https://energia-jalisco.vercel.app.*
