# Task 0 - Brand Setup: Infraestructura de identidad visual

## Información general

- **Fase:** 1
- **Tipo:** Frontend
- **UC:** N/A (infraestructura transversal)
- **Bounded Context:** N/A
- **Prioridad:** Must

## Contexto

Los documentos de marca (`001-associated-brand-foundation.md` y `002-associated-ui-product-guidelines.md`) se elaboraron después del scaffold (fase 0) y del backend (fase 1). El scaffold creó la estructura básica del frontend con un theme placeholder (`web/src/app/theme.ts` con `primaryColor: 'blue'`) y un `index.html` mínimo. Esta tarea actualiza la infraestructura frontend para alinearla con la identidad visual definitiva de Associated antes de iniciar cualquier feature.

## Objetivo

Configurar el theme de Mantine, el HTML base y las utilities compartidas según los documentos de marca, de forma que todas las tareas de frontend (task-1 en adelante) hereden la identidad visual correcta sin configuración adicional.

## Alcance

### Incluido

- Actualización del theme de Mantine con la paleta `brand`, tipografía Inter, spacing, radius, shadows y component defaults
- Actualización de `web/index.html` con favicon, meta tags, Open Graph, PWA y carga de fuente Inter
- Copia de logos SVG al directorio de assets de la aplicación
- Creación de utilities compartidas de formateo (importes, fechas)
- Actualización de `providers.tsx` para usar el theme definitivo

### Excluido

- Implementación de dark mode (post-MVP)
- Theming por tenant (post-MVP)
- Componentes de UI reutilizables (se crean en las tareas que los necesiten)

## Dependencias

### Tareas previas requeridas

| Tarea                 | Artefacto necesario                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold** | Proyecto React + Vite + Mantine configurado, `web/src/app/theme.ts` (placeholder), `web/src/app/providers.tsx` con `MantineProvider`, `web/index.html` base |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `web/src/app/theme.ts` existe (placeholder con `primaryColor: 'blue'`)
- [ ] `web/src/app/providers.tsx` existe con `MantineProvider` configurado
- [ ] `web/index.html` existe con estructura HTML mínima
- [ ] `doc/brand/001-associated-brand-foundation.md` disponible como referencia de marca
- [ ] `doc/brand/002-associated-ui-product-guidelines.md` disponible como guía de implementación UI
- [ ] `doc/brand/assets/associated-media/` contiene los SVGs de marca (isotipo, logos horizontales y stacked)
- [ ] `web/public/` contiene favicons, PWA assets y `og-image.png`

### Artefactos producidos

| Artefacto                                                    | Consumido por                                                                      |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `web/src/shared/theme/associated-theme.ts`                   | Todas las features del frontend (theme de marca global)                            |
| `web/src/shared/assets/*.svg` (6 logos de producción)        | Login page (logo-stacked), AppShell sidebar (isotipo-white, logo-horizontal-white) |
| `web/index.html` actualizado (favicon, Inter, meta tags, OG) | Toda la aplicación                                                                 |
| `web/src/shared/utils/format-money.ts`                       | Features de tesorería (task-2+)                                                    |
| `web/src/shared/utils/format-date.ts`                        | Todas las features que muestran fechas                                             |

## Referencia de especificación

| Documento                                           | Contenido relevante                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `doc/brand/001-associated-brand-foundation.md`      | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición                          |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |

## Puntos críticos

1. **Ubicación del theme.** El scaffold creó `web/src/app/theme.ts`. Los documentos de marca especifican `web/src/shared/theme/associated-theme.ts`. Mover el theme a la ubicación correcta y actualizar los imports en `providers.tsx`.
2. **No hardcodear `#27343E`.** Usar `theme.other.brandDark` para el color estructural del sidebar. El hex solo aparece en la definición del theme.
3. **`isotipo-hq.svg` no va a producción.** Es la fuente maestra del isotipo. Solo copiar al codebase los 6 SVGs de producción (sin el `-hq`).
4. **Fuente Inter no bloqueante.** La carga via Google Fonts debe usar `display=swap` para cumplir RNFT-017 (dashboard <2s).
5. **`forceColorScheme: 'light'`** en `MantineProvider` para evitar que el OS del usuario active dark mode.

## Estado actual del código

| Archivo                                | Estado    | Problema                                                                                             |
| -------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `web/src/app/theme.ts`                 | Existe    | `primaryColor: 'blue'`, sin paleta brand, sin Inter, sin brandDark, sin component defaults           |
| `web/src/app/providers.tsx`            | Existe    | Usa el theme incompleto. Falta `forceColorScheme="light"`                                            |
| `web/index.html`                       | Existe    | Mínimo: sin Inter, sin favicons referenciados, sin meta tags de marca, carga `/vite.svg` inexistente |
| `web/public/*`                         | Existe    | Favicons, PWA assets y og-image ya están en su lugar ✓                                               |
| `web/src/shared/assets/`               | No existe | Los logos SVG están en `doc/brand/assets/associated-media/` pero no en el codebase                   |
| `web/src/shared/utils/format-money.ts` | No existe | Utility necesaria para tareas de tesorería (fase 1 task-2+)                                          |

## Plan de implementación

### Paso 1 - Copiar logos SVG al codebase

Crear `web/src/shared/assets/` y copiar desde `doc/brand/assets/associated-media/`:

```
web/src/shared/assets/
├── isotipo.svg              # Isotipo colores de marca - uso general
├── isotipo-white.svg        # Isotipo blanco (#EAF7FE) - fondos oscuros
├── logo-horizontal.svg      # Isotipo + "associated" - colores de marca
├── logo-horizontal-white.svg # Isotipo + "associated" - blanco (#EAF7FE)
├── logo-stacked.svg         # Isotipo arriba + "associated" debajo - colores de marca
└── logo-stacked-white.svg   # Isotipo arriba + "associated" debajo - blanco (#EAF7FE)
```

> **No copiar `isotipo-hq.svg`** - es la fuente maestra, no se usa en producción.

### Paso 2 - Crear theme definitivo

Crear `web/src/shared/theme/associated-theme.ts` con la configuración completa definida en `002-associated-ui-product-guidelines.md` § 1.3:

- Paleta `brand` de 10 shades (base `#5B7682`)
- `primaryColor: 'brand'`, `primaryShade: { light: 7, dark: 5 }`
- `autoContrast: true`, `luminanceThreshold: 0.3`
- `other: { brandDark: '#27343E' }`
- Tipografía Inter con escala de headings y body definida en el brand
- Spacing: xs=8, sm=12, md=16, lg=24, xl=32
- Radius: default `'sm'` (4px)
- Shadows: 5 niveles definidos en el brand
- `focusRing: 'auto'`, `respectReducedMotion: true`, `cursorType: 'pointer'`
- Component defaults (`components`): Button, Paper, Card, Badge, TextInput, Select, Table, Notification, Modal, SegmentedControl, Skeleton

Eliminar `web/src/app/theme.ts` después de migrar.

### Paso 3 - Actualizar `providers.tsx`

- Importar `associatedTheme` desde `@/shared/theme/associated-theme`
- Pasar `forceColorScheme="light"` a `MantineProvider`
- Verificar que `QueryClientProvider`, `ErrorBoundary` y `RouterProvider` siguen funcionando

### Paso 4 - Actualizar `web/index.html`

Reemplazar el contenido del `<head>` con la versión completa definida en `002-associated-ui-product-guidelines.md` § 8.3:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>Associated - Gestión para colectividades</title>
<meta
  name="description"
  content="ERP ligero para asociaciones culturales, peñas festeras, clubes deportivos y cofradías."
/>

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- PWA -->
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#27343E" />

<!-- Open Graph -->
<meta property="og:title" content="Associated - Gestión para colectividades" />
<meta
  property="og:description"
  content="ERP ligero para asociaciones culturales, peñas festeras, clubes deportivos y cofradías."
/>
<meta property="og:image" content="/og-image.png" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Associated - Gestión para colectividades" />
<meta
  name="twitter:description"
  content="ERP ligero para asociaciones culturales, peñas festeras, clubes deportivos y cofradías."
/>
<meta name="twitter:image" content="/og-image.png" />

<!-- Fuente -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Paso 5 - Crear utilities de formateo

Crear `web/src/shared/utils/format-money.ts`:

```typescript
/**
 * Formatea centavos (enteros) a formato de moneda española.
 * Backend envía importes como enteros en centavos.
 * @example formatMoney(34500) → "345,00 €"
 */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
```

Crear `web/src/shared/utils/format-date.ts`:

```typescript
/**
 * Formatea fecha en formato largo español.
 * @example formatDateLong(new Date('2026-03-08')) → "8 de marzo de 2026"
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatea fecha en formato compacto español (dd/MM/yyyy).
 * @example formatDateCompact(new Date('2026-03-08')) → "08/03/2026"
 */
export function formatDateCompact(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
```

### Paso 6 - Configurar alias de importación

Verificar que el alias `@/` apunta a `web/src/` en la configuración de Vite (`vite.config.ts`) y en `tsconfig.json`. Esto permite importaciones como:

```typescript
import { associatedTheme } from '@/shared/theme/associated-theme';
import { formatMoney } from '@/shared/utils/format-money';
import logoStacked from '@/shared/assets/logo-stacked.svg';
```

## Checklist de verificación

- [ ] `web/src/shared/assets/` contiene los 6 SVGs de producción (sin `isotipo-hq.svg`)
- [ ] `web/src/shared/theme/associated-theme.ts` exporta `associatedTheme` con paleta `brand`, Inter, component defaults
- [ ] `web/src/app/theme.ts` eliminado (migrado a nueva ubicación)
- [ ] `web/src/app/providers.tsx` importa `associatedTheme` y usa `forceColorScheme="light"`
- [ ] `web/index.html` tiene favicon, Inter, meta tags de marca, Open Graph y Twitter Card
- [ ] `web/src/shared/utils/format-money.ts` exporta `formatMoney()`
- [ ] `web/src/shared/utils/format-date.ts` exporta `formatDateLong()` y `formatDateCompact()`
- [ ] Alias `@/` funciona correctamente para importar desde `web/src/`
- [ ] `npm run -w web dev` arranca sin errores
- [ ] La aplicación renderiza con la fuente Inter (verificar en DevTools → Computed → font-family)
- [ ] Los botones de Mantine usan el color brand (`#5B7682`), no el azul por defecto

## Riesgos

| Riesgo                                             | Probabilidad | Impacto | Mitigación                                                |
| -------------------------------------------------- | ------------ | ------- | --------------------------------------------------------- |
| Alias `@/` no configurado en Vite o tsconfig       | Baja         | Alto    | Verificar configuración del scaffold antes de empezar     |
| SVGs de marca con paths absolutos o IDs duplicados | Baja         | Medio   | Inspeccionar SVGs importados, limpiar IDs si es necesario |
| Google Fonts bloqueante en redes lentas            | Media        | Medio   | `display=swap` + `preconnect` para carga no bloqueante    |

## Dependencias de otras tareas

Esta tarea **no tiene dependencias** - es la primera tarea de frontend.

Todas las tareas de fase 1 frontend (task-1 a task-5) **dependen de esta tarea**.

## Criterios de aceptación

1. **Theme de marca aplicado:** La aplicación renderiza con la paleta `brand` (shade base `#5B7682`), tipografía Inter y los component defaults definidos en el documento de marca. Los botones primarios usan `color="brand"`, nunca el azul por defecto de Mantine.

2. **HTML base completo:** `web/index.html` incluye favicon SVG, meta tags descriptivos, Open Graph, Twitter Card, manifiesto PWA y carga de fuente Inter con `display=swap`.

3. **Assets de marca accesibles:** Los 6 SVGs de producción están en `web/src/shared/assets/` y se pueden importar desde cualquier componente usando el alias `@/shared/assets/`.

4. **Utilities de formateo funcionales:** `formatMoney(34500)` devuelve `"345,00 €"` y `formatDateLong(new Date('2026-03-08'))` devuelve `"8 de marzo de 2026"`.

5. **Sin dark mode accidental:** `MantineProvider` usa `forceColorScheme="light"` para garantizar que el OS del usuario no active dark mode.

6. **Build exitoso:** `npm run -w web dev` arranca sin errores ni warnings relacionados con el theme o los imports.
