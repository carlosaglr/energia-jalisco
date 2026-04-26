# FASE 8 · BRIEF DE IMPLEMENTACIÓN PARA CLAUDE CODE

**Proyecto:** Observatorio del Sistema de Energía de Jalisco
**Repo:** github.com/carlosaglr/energia-jalisco
**Estado al inicio:** Fases 1–7 completadas. Fase 8 cierra el proyecto.
**Spec autoridad:** `ARCHITECTURE.md` (versión actual del repo).

---

## 0. Decisiones de producto ya tomadas

1. **Dominio:** subdominio gratis de Vercel (`<algo>.vercel.app`). Sin dominio propio en esta fase.
2. **Cloudflare:** **diferido** hasta que haya dominio propio. Cloudflare gratis requiere control del apex domain; con subdominio `.vercel.app` no aplica. Documentar como pendiente, no bloquear deploy por esto.
3. **Watermark en RutaCritica:** visible pero tenue. Una línea de small caps tracked-out, navy con opacity baja (~0.4), centrada, debajo del último bloque de la página.
4. **Licencia:** Creative Commons BY-NC-SA 4.0.

---

## 1. Lecturas obligatorias

1. `ARCHITECTURE.md` — §6 (paquete defensivo + SEO), §8 (Fase 8).
2. `NOTES.md` — decisiones técnicas históricas.
3. `public/robots.txt` — verificar estado actual.
4. `src/layouts/Editorial.astro` — los meta tags se agregan acá.
5. `src/components/Footer.astro` — la nota de licencia se agrega acá.
6. `src/components/RutaCritica.tsx` y `.css` — el watermark se agrega como bloque al final de la página `/sintesis/ruta-critica`, no dentro del componente.

---

## 2. Reglas duras

1. Strings en `.tsx`/`.jsx`: concatenación con `+`.
2. Idioma: español.
3. Diseño: Julius Bär puro, modo claro.
4. No inventar: si un dato falta, flagearlo.
5. No tocar el contenido analítico del sitio. Fase 8 es solo config defensiva y deploy.

---

## 3. Entregables

**Archivos a crear:**
- `vercel.json` (raíz del repo) — headers HTTP defensivos.
- `LICENSE` (raíz del repo) — texto completo de CC BY-NC-SA 4.0.

**Archivos a verificar/modificar:**
- `public/robots.txt` — confirmar 16 bots de IA bloqueados.
- `src/layouts/Editorial.astro` — meta tags `noai`, `noimageai`.
- `src/components/Footer.astro` — nota de licencia visible con link.
- `src/pages/sintesis/ruta-critica.astro` — watermark al final de la página.
- `README.md` (raíz del repo) — sección breve sobre licencia y atribución.

**Acciones:**
- Deploy a Vercel vía integración con GitHub.
- Verificación post-deploy del paquete defensivo.

**Cierre:**
- Bump `ARCHITECTURE.md` a v1.8.
- Update `NOTES.md`.
- Commit y push final.

---

## 4. Orden de ejecución

1. Pre-deploy hygiene local (puntos 5 a 9 de este brief).
2. `npm run build` para confirmar que todo compila.
3. Deploy a Vercel.
4. Verificación post-deploy (punto 10).
5. Cierre de fase.

---

## 5. `public/robots.txt`

### 5.1 Verificación previa

Leer el archivo actual. Contar las directivas `User-agent:` que son seguidas de `Disallow: /`. Reportar el número.

### 5.2 Lista canónica de bots a bloquear

Si el archivo ya existe y tiene 16 o más bots de IA bloqueados, dejarlo como está. Si tiene menos, completarlo. Lista mínima:

```
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Perplexity-User
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /
```

### 5.3 Política para crawlers tradicionales

Permitir explícitamente al final del archivo:

```
User-agent: *
Allow: /

Sitemap: https://<TU_SUBDOMINIO>.vercel.app/sitemap-index.xml
```

Donde `<TU_SUBDOMINIO>` se reemplaza con el subdominio asignado por Vercel después del primer deploy. Dejarlo como `PENDIENTE_VERCEL_URL` en el archivo y reemplazar después del primer deploy. Sitemap lo genera Astro automáticamente si está configurado el integration `@astrojs/sitemap` (verificar en `astro.config.mjs`; si no está, agregarlo).

---

## 6. Meta tags `noai` en `Editorial.astro`

Dentro del `<head>`, agregar:

```html
<meta name="robots" content="noai, noimageai" />
<meta name="googlebot" content="noai, noimageai" />
```

Estas directivas son no estandarizadas pero las respetan algunos crawlers de IA. Combinadas con `robots.txt` cubren tanto los que respetan robots.txt como los que respetan meta tags.

Verificar que ya no exista una directiva `<meta name="robots">` previa que pueda entrar en conflicto. Si existe (ej. con valor `index, follow`), consolidar en una sola línea: `<meta name="robots" content="index, follow, noai, noimageai" />`.

---

## 7. `vercel.json` — headers HTTP defensivos

Crear en la raíz del repo:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noai, noimageai" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" }
      ]
    }
  ]
}
```

**Notas:**
- `X-Robots-Tag` actúa como meta tag a nivel HTTP, llega incluso a recursos no-HTML (PDFs, imágenes).
- `Strict-Transport-Security` fuerza HTTPS por dos años.
- `X-Frame-Options: DENY` impide que el sitio sea embebido en iframes (anti-scraping vía frame).
- `Permissions-Policy` cierra APIs sensibles del navegador.
- **No agregar `Content-Security-Policy` en esta fase.** Una CSP mal configurada rompe Pagefind o React fácilmente. Documentar como pendiente para refinamiento posterior si surgen incidentes de scraping específicos.

---

## 8. `LICENSE` y nota en footer

### 8.1 Archivo `LICENSE`

Crear en la raíz del repo. Contenido: texto **completo** de la licencia Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International. Obtenerlo desde el sitio oficial: `https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.txt`.

**No reescribir ni resumir el texto.** Copiarlo verbatim.

### 8.2 Footer.astro

Localizar la línea o bloque actual de copyright. Reemplazar/expandir a:

```astro
<p class="footer-license">
  © 2026 Carlos Aguilar · Observatorio del Sistema de Energía de Jalisco
</p>
<p class="footer-license-link">
  Contenido publicado bajo licencia
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es"
     target="_blank" rel="noopener">
    Creative Commons BY-NC-SA 4.0
  </a>
</p>
```

Estilo: small caps tracked-out 11px, navy con opacity 0.7. Coherente con el resto del footer.

### 8.3 README.md

Si existe, agregar al final una sección:

```markdown
## Licencia

El contenido editorial (análisis, textos, datos) está publicado bajo
licencia [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).

El código fuente está disponible para fines de auditoría y reproducción
del análisis. Cualquier uso comercial requiere autorización del autor.

## Atribución

Este trabajo cita como fuente: *Aguilar, C. (2026). Observatorio del
Sistema de Energía de Jalisco. Disponible en <URL_DE_VERCEL>.*
```

Si `README.md` no existe, crearlo con un bloque mínimo: nombre del proyecto + descripción de 2 líneas + sección de licencia.

---

## 9. Watermark en `/sintesis/ruta-critica`

### 9.1 Ubicación

Al **final** de la página `src/pages/sintesis/ruta-critica.astro`, después del bloque "Una reforma que depende del Congreso de la Unión" (R-101), antes del cierre del `<main>`.

No dentro del componente `RutaCritica.tsx`. La página es la dueña del watermark, no la viz.

### 9.2 Contenido

Una sola línea, centrada:

```
OBSERVATORIO DEL SISTEMA DE ENERGÍA DE JALISCO · CC BY-NC-SA 4.0 · ABRIL 2026
```

### 9.3 Estilo

- Small caps tracked-out.
- 10–11px.
- Navy (`var(--color-navy)`) con `opacity: 0.4`.
- Centrado horizontal.
- Padding vertical generoso (32–48px arriba y abajo) para separar del bloque anterior.
- Sin border, sin background.

Implementación inline en el `.astro`:

```astro
<p class="ruta-watermark">
  Observatorio del Sistema de Energía de Jalisco · CC BY-NC-SA 4.0 · Abril 2026
</p>

<style>
  .ruta-watermark {
    text-align: center;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-navy);
    opacity: 0.4;
    margin: 48px 0;
  }
</style>
```

### 9.4 No replicar en otras páginas

El watermark va **solo** en `/sintesis/ruta-critica` por ahora. Si en una iteración futura se decide extender a otras páginas con visualizaciones (ej. distribuciones del Explorer), se hará por separado.

---

## 10. Deploy a Vercel

### 10.1 Pre-requisitos

- Cuenta gratuita en vercel.com (registro con GitHub).
- Permisos de instalación de la GitHub App de Vercel sobre el repo `carlosaglr/energia-jalisco`.

### 10.2 Pasos del deploy (los hace Carlos manualmente, no Claude Code)

Esta sección la ejecuta Carlos en el navegador. Claude Code no puede hacer deploy.

**Instrucciones para Carlos:**

1. Entrar a https://vercel.com con cuenta de GitHub.
2. Click en "Add New" → "Project".
3. Seleccionar el repo `carlosaglr/energia-jalisco`.
4. En la pantalla de configuración Vercel detecta automáticamente que es Astro:
   - Framework Preset: Astro
   - Build Command: `npm run build` (ya configurado en `vercel.json`)
   - Output Directory: `dist` (ya configurado)
   - Install Command: `npm install` (default)
5. **No agregar variables de entorno.** El proyecto no tiene secrets.
6. Click "Deploy".
7. Esperar 2–3 minutos. Vercel asigna un subdominio del tipo `energia-jalisco-<hash>.vercel.app`.

### 10.3 Después del primer deploy

Carlos copia la URL asignada y la comparte con Claude Code para:

1. Reemplazar `PENDIENTE_VERCEL_URL` en `public/robots.txt` (línea de Sitemap).
2. Reemplazar `<URL_DE_VERCEL>` en `README.md`.
3. Re-commit + push (Vercel re-deployará automáticamente).

---

## 11. Verificación post-deploy

Después del deploy, verificar que el paquete defensivo funciona. Carlos ejecuta los siguientes comandos en Terminal (o Claude Code los corre por él):

### 11.1 Headers HTTP

```bash
curl -I https://<URL_VERCEL>/
```

Debe incluir en la respuesta:
- `x-robots-tag: noai, noimageai`
- `strict-transport-security: max-age=63072000; includeSubDomains; preload`
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`
- `referrer-policy: strict-origin-when-cross-origin`

### 11.2 robots.txt

```bash
curl https://<URL_VERCEL>/robots.txt
```

Debe devolver el archivo completo con los 16 bots bloqueados.

### 11.3 Meta tags

Abrir la URL en el navegador → View Source (`Cmd + Opción + U`) → buscar `noai`. Debe encontrar la línea del meta tag.

### 11.4 Búsqueda end-to-end

Abrir la URL → click en lupa → escribir "energía". Debe devolver resultados.

### 11.5 Watermark visible

Navegar a `https://<URL_VERCEL>/sintesis/ruta-critica`. Scrollear hasta el final. Debe verse el watermark tenue.

### 11.6 Footer con licencia

En cualquier página, scrollear al footer. Debe ver la línea de licencia con link funcional a Creative Commons.

---

## 12. Acceptance criteria

1. Deploy a Vercel exitoso. URL pública accesible.
2. `npm run build` local pasa sin errores ni warnings nuevos.
3. `robots.txt` con 16 bots de IA bloqueados, accesible en `/robots.txt`.
4. Meta tags `noai, noimageai` presentes en todas las páginas (verificable en cualquier View Source).
5. Headers HTTP defensivos presentes en respuesta del servidor (verificable con `curl -I`).
6. `LICENSE` con texto completo de CC BY-NC-SA 4.0 en raíz del repo.
7. Footer muestra línea de licencia con link funcional.
8. Watermark visible y tenue al final de `/sintesis/ruta-critica`.
9. Búsqueda end-to-end funcional en producción.
10. Sitemap accesible en `/sitemap-index.xml` (generado por integration de Astro).
11. README.md con sección de licencia y atribución.

---

## 13. Pendientes documentados (no son parte de Fase 8)

1. **Cloudflare en frente.** Diferido hasta que se compre dominio propio. Sin apex domain controlado por Carlos, Cloudflare gratis no puede proxiar `*.vercel.app`. Documentar en `NOTES.md` como bloqueador conocido.
2. **Content-Security-Policy.** Diferido hasta que se observe un incidente concreto que la justifique. Una CSP mal calibrada rompe Pagefind o el inline script de búsqueda.
3. **Migración a dominio propio.** Cuando ocurra, requiere: comprar dominio, configurar DNS apuntando a Vercel, agregar dominio en panel de Vercel, activar Cloudflare proxy, actualizar URL en `robots.txt` y `README.md`.
4. **Plan de actualización editorial.** Carlos definirá cadencia de revisión del contenido en una iteración futura. Mencionado como "por definir" en `/metodologia`.

---

## 14. Cierre de Fase 8

### 14.1 Bump ARCHITECTURE.md a v1.8

Insertar al inicio:

```markdown
### Changelog v1.8
- **Fase 8 completada**: sitio publicado en Vercel (subdominio gratis),
  paquete defensivo aplicado, licencia CC BY-NC-SA 4.0 visible.
- **robots.txt** con 16 bots de IA bloqueados (verificación o
  completado).
- **Meta tags `noai, noimageai`** en `Editorial.astro` para que se
  hereden en todas las páginas.
- **Headers HTTP defensivos** vía `vercel.json`: X-Robots-Tag,
  Strict-Transport-Security (HSTS preload), X-Content-Type-Options,
  X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- **Licencia CC BY-NC-SA 4.0** publicada como `LICENSE` en raíz +
  línea visible en footer + sección en README.md.
- **Watermark** tenue al final de `/sintesis/ruta-critica`.
- **Cloudflare diferido**: requiere dominio propio. Documentado como
  pendiente.
- **CSP diferida**: documentada como pendiente, sin urgencia.
- **Sitemap** generado por `@astrojs/sitemap` y enlazado desde
  `robots.txt`.

### Estado del proyecto
Las 8 fases del plan original están completas. El sitio está en línea,
indexable por motores tradicionales, defendido contra crawlers de IA,
licenciado, búsqueda funcional, navegación completa.
```

Cambiar header:
```
**Documento de traspaso · Versión 1.8 · Abril 2026**
**Estado: Las 8 fases completadas. Sitio publicado.**
```

Cambiar footer:
```
**Fin de ARCHITECTURE.md v1.8**
```

### 14.2 NOTES.md

Agregar bloque:

```
## Fase 8 — Decisiones técnicas

- Vercel sobre Netlify por integración GitHub más limpia y por que
  detecta Astro automáticamente sin configuración manual.
- Subdominio .vercel.app gratis aceptado en esta fase. Migración a
  dominio propio queda como pendiente.
- Cloudflare diferido por la razón anterior.
- CSP no implementada. Riesgo conocido y aceptado: una CSP mal
  configurada rompe Pagefind. Reactivar si surge incidente concreto.
- HSTS con preload (max-age 2 años): asume que el sitio se queda en
  HTTPS para siempre. Si en algún momento hay que volver a HTTP,
  navegadores van a recordar el HSTS por 2 años; no es trivial
  revertir.
- robots.txt con 16 bots: cobertura de los crawlers de IA conocidos al
  momento del deploy. La lista se va a quedar atrás conforme aparezcan
  nuevos. Revisar periódicamente.
- Watermark solo en RutaCritica por ser la única visualización
  distintiva del sitio. Si se agrega otra viz signature, replicar el
  patrón.
- Sitemap automático vía @astrojs/sitemap: indexa las 161 páginas.
```

### 14.3 Commit final

```
git add -A
git commit -m "Fase 8: deploy Vercel, paquete defensivo, licencia CC BY-NC-SA 4.0

- vercel.json con headers defensivos (X-Robots-Tag, HSTS, anti-frame)
- robots.txt verificado con 16 bots de IA bloqueados
- meta tags noai, noimageai en Editorial.astro
- LICENSE con texto completo de CC BY-NC-SA 4.0
- Footer con línea de licencia y link
- Watermark en /sintesis/ruta-critica
- README.md con sección de licencia y atribución
- ARCHITECTURE.md v1.8 — proyecto cerrado
- NOTES.md actualizado con decisiones de Fase 8

Pendientes documentados: Cloudflare (necesita dominio propio),
Content-Security-Policy (sin urgencia), migración a dominio propio."
git push origin main
```

Si el primer deploy de Vercel ya pasó cuando se hace el commit, Vercel detecta el push y re-deploya automáticamente con la URL ya en `robots.txt` y `README.md`.

---

## 15. Si algo no queda claro

1. Vercel no se conecta al repo: verificar que la GitHub App de Vercel tenga permisos sobre el repo. En GitHub → Settings → Applications → Vercel → Configure → confirmar que `energia-jalisco` está en la lista de repos accesibles.
2. Build falla en Vercel pero pasa local: probable diferencia de versión de Node. En `package.json` agregar `"engines": { "node": ">=20" }` y commitear.
3. Pagefind no carga en producción aunque sí en `npm run preview`: verificar que `dist/pagefind/` se haya subido. Vercel debería incluirlo porque está dentro de `dist/`. Si Vercel lo ignora, agregar `"includeFiles": ["dist/pagefind/**"]` en `vercel.json`.
4. robots.txt devuelve 404 en producción: confirmar que está en `public/`, no en `src/`. Astro copia `public/` tal cual a `dist/`.
5. No "ajustar" para que pase si el conteo de bots no da 16: abortar y reportar.

---

**Fin del brief.**
