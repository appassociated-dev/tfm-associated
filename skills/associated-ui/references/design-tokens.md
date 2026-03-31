# Design Tokens — Associated

Todos los valores de este archivo provienen del Brand Foundation y las UI/Product Guidelines del proyecto. Son definitivos para el producto.

---

## 1. Paleta de colores

### 1.1 Color primario de marca (`brand`)

Generada a partir del gris azulado del isotipo (`#5B7682`) usando Mantine Colors Generator. El `primaryShade` es `{ light: 7, dark: 5 }`.

| Shade | Hex       | Uso                                                             |
| ----- | --------- | --------------------------------------------------------------- |
| 0     | `#eaf7fd` | Fondos `light` variant (badges, alerts)                         |
| 1     | `#e0eaee` | Fondos hover sutiles                                            |
| 2     | `#c5d1d6` | Bordes `outline` variant                                        |
| 3     | `#a6b7be` | Texto deshabilitado                                             |
| 4     | `#8ca1aa` | Iconos secundarios                                              |
| 5     | `#7a939e` | Acciones primarias en dark scheme / texto enlace hover          |
| 6     | `#708c99` | Hover sobre acciones primarias                                  |
| 7     | `#5b7682` | **Color base del isotipo** — acciones primarias en light scheme |
| 8     | `#506c78` | Acciones primarias alternativas                                 |
| 9     | `#3d5e6c` | Pressed / active state                                          |

**¿Por qué `#5B7682` como base y no `#27343E`?** El azul oscuro es tan cercano al negro que sus shades intermedios (6-7) resultan en grises sin personalidad de marca. Con `#5B7682`, los botones y elementos interactivos transmiten inmediatamente la identidad de Associated.

### 1.2 Azul oscuro del isotipo (`#27343E`)

NO se registra como paleta en `theme.colors`. Se almacena en `theme.other`:

```typescript
other: {
  brandDark: '#27343E',
},
```

Accesible via `useMantineTheme().other.brandDark`. Usos permitidos: franja de cabecera en PDFs/emails, bloque CTA oscuro en landing page. Nunca como fondo de sidebar ni como color de componente interactivo.

### 1.3 Colores semánticos

Se usan los defaults de Mantine (Open Color) sin sobrescribir:

| Función                | Color Mantine | Shade default | Hex       |
| ---------------------- | ------------- | ------------- | --------- |
| Éxito / Confirmación   | `green`       | 6             | `#40C057` |
| Error / Alerta crítica | `red`         | 6             | `#FA5252` |
| Advertencia            | `yellow`      | 6             | `#FAB005` |
| Información            | `blue`        | 6             | `#228BE6` |

Los valores del Brand Foundation (`#2D7A4F`, `#C0392B`, `#D4850A`, `#2B7AB5`) fueron aproximaciones previas a la elección de Mantine. Los colores de Open Color los reemplazan en el producto.

### 1.4 Colores neutros

Se usa la escala `gray` de Mantine (Open Color) sin modificar:

| Concepto             | Token Mantine      | Variable CSS             | Hex       |
| -------------------- | ------------------ | ------------------------ | --------- |
| Fondo principal      | `gray.0`           | `--mantine-color-gray-0` | `#F8F9FA` |
| Fondo secundario     | `gray.1`           | `--mantine-color-gray-1` | `#F1F3F5` |
| Bordes y separadores | `gray.3`           | `--mantine-color-gray-3` | `#DEE2E6` |
| Texto dimmed         | `gray.5`           | `--mantine-color-gray-5` | `#ADB5BD` |
| Texto secundario     | `gray.6`           | `--mantine-color-gray-6` | `#868E96` |
| Texto principal      | `gray.9` / `black` | `--mantine-color-black`  | `#212529` |

### 1.5 Variables CSS semánticas (OBLIGATORIO en CSS custom)

Nunca hardcodear hex en CSS. Siempre usar las variables que se adaptan automáticamente a light/dark:

| Propósito              | Variable CSS                     |
| ---------------------- | -------------------------------- |
| Texto principal        | `--mantine-color-text`           |
| Texto secundario       | `--mantine-color-dimmed`         |
| Fondo hover            | `--mantine-color-default-hover`  |
| Bordes                 | `--mantine-color-default-border` |
| Acción primaria filled | `--mantine-color-brand-filled`   |
| Acción primaria light  | `--mantine-color-brand-light`    |

### 1.6 Badges de estado (mapeo al dominio)

| Estado                                  | Color Mantine | Variant |
| --------------------------------------- | ------------- | ------- |
| Activo / Pagado / Cobrado               | `green`       | `light` |
| Pendiente / En proceso                  | `yellow`      | `light` |
| Suspendido / Devuelto / Error           | `red`         | `light` |
| Baja voluntaria / Inactivo / Finalizado | `gray`        | `light` |
| Información / Enviada / Abierto         | `blue`        | `light` |

---

## 2. Tipografía

### 2.1 Familia

```typescript
fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
headings: {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontWeight: '600',
},
```

Carga en `index.html` (no bloqueante):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

> **Inter es la familia definitiva para el producto.** Plus Jakarta Sans se usó en mockups de presentación y puede usarse en la landing page comercial, pero nunca dentro de la aplicación.

### 2.2 Escala de tamaños

```typescript
fontSizes: {
  xs: '0.75rem',    // 12px — captions
  sm: '0.8125rem',  // 13px — labels, texto secundario
  md: '0.875rem',   // 14px — cuerpo de texto
  lg: '1rem',       // 16px — texto destacado
  xl: '1.25rem',    // 20px — subtítulos grandes
},
```

### 2.3 Headings

```typescript
headings: {
  sizes: {
    h1: { fontSize: '1.5rem', lineHeight: '1.3' },     // 24px — Cabecera de página
    h2: { fontSize: '1.25rem', lineHeight: '1.35' },    // 20px — Título de sección
    h3: { fontSize: '1rem', lineHeight: '1.4' },        // 16px — Subtítulo
    h4: { fontSize: '0.875rem', lineHeight: '1.45' },   // 14px
    h5: { fontSize: '0.8125rem', lineHeight: '1.45' },  // 13px
    h6: { fontSize: '0.75rem', lineHeight: '1.5' },     // 12px
  },
},
```

### 2.4 Line heights

```typescript
lineHeights: {
  xs: '1.4',
  sm: '1.45',
  md: '1.55',
  lg: '1.6',
  xl: '1.65',
},
```

### 2.5 Reglas de peso

- **Regular (400):** cuerpo de texto, datos en tablas.
- **Medium (500):** subtítulos (H3), etiquetas de campo, texto enfatizado.
- **SemiBold (600):** cabeceras de página (H1, H2), cabeceras de tabla.
- **Bold (700) — PROHIBIDO en interfaz.** Reservado para web comercial y materiales de comunicación.
- **Máximo 2 pesos tipográficos en un mismo componente.**
- **Datos numéricos en tablas:** `fontVariantNumeric: 'tabular-nums'` para alineación.

---

## 3. Espaciado

Grid base de 8px. Todos los valores son múltiplos de 8 (8, 12, 16, 24, 32).

```typescript
spacing: {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
},
```

**Principio de composición:** espaciados generosos entre secciones, compactos dentro de ellas. Mostrar lo necesario para la tarea actual, sin saturar.

---

## 4. Border radius

```typescript
radius: {
  xs: '0.125rem',  // 2px
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
},
defaultRadius: 'sm',  // 4px — bordes sutiles, no redondeados
```

---

## 5. Sombras

```typescript
shadows: {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
},
```

---

## 6. Comportamiento del theme

```typescript
cursorType: 'pointer',
focusRing: 'auto',          // visible solo al navegar con teclado
fontSmoothing: true,
respectReducedMotion: true,  // deshabilita animaciones si usuario lo prefiere
autoContrast: true,          // ajusta texto en variantes filled
luminanceThreshold: 0.3,
```

---

## 7. Default props de componentes

```typescript
components: {
  Button:           { defaultProps: { radius: 'sm' } },
  Paper:            { defaultProps: { radius: 'md', shadow: 'sm', withBorder: true } },
  Card:             { defaultProps: { radius: 'md', shadow: 'sm', withBorder: true, padding: 'lg' } },
  Badge:            { defaultProps: { radius: 'sm', variant: 'light' } },
  TextInput:        { defaultProps: { radius: 'sm' } },
  Select:           { defaultProps: { radius: 'sm' } },
  Table:            { defaultProps: { striped: false, highlightOnHover: true, withTableBorder: false, withColumnBorders: false } },
  Notification:     { defaultProps: { radius: 'md' } },
  Modal:            { defaultProps: { radius: 'md', centered: true } },
  SegmentedControl: { defaultProps: { radius: 'sm' } },
  Skeleton:         { defaultProps: { radius: 'sm' } },
},
```

---

## 8. Theme completo (snippet listo para copiar)

```typescript
// web/src/shared/theme/associated-theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
  '#eaf7fd',
  '#e0eaee',
  '#c5d1d6',
  '#a6b7be',
  '#8ca1aa',
  '#7a939e',
  '#708c99',
  '#5b7682',
  '#506c78',
  '#3d5e6c',
];

export const associatedTheme = createTheme({
  // ─── Colores ───
  primaryColor: 'brand',
  primaryShade: { light: 7, dark: 5 },
  colors: { brand },
  autoContrast: true,
  luminanceThreshold: 0.3,

  other: {
    brandDark: '#27343E',
  },

  // ─── Tipografía ───
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.5rem', lineHeight: '1.3' },
      h2: { fontSize: '1.25rem', lineHeight: '1.35' },
      h3: { fontSize: '1rem', lineHeight: '1.4' },
      h4: { fontSize: '0.875rem', lineHeight: '1.45' },
      h5: { fontSize: '0.8125rem', lineHeight: '1.45' },
      h6: { fontSize: '0.75rem', lineHeight: '1.5' },
    },
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.25rem',
  },
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
  },

  // ─── Espaciado ───
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  // ─── Bordes ───
  defaultRadius: 'sm',
  radius: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // ─── Sombras ───
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
  },

  // ─── Comportamiento ───
  cursorType: 'pointer',
  focusRing: 'auto',
  fontSmoothing: true,
  respectReducedMotion: true,

  // ─── Default props ───
  components: {
    Button: { defaultProps: { radius: 'sm' } },
    Paper: { defaultProps: { radius: 'md', shadow: 'sm', withBorder: true } },
    Card: { defaultProps: { radius: 'md', shadow: 'sm', withBorder: true, padding: 'lg' } },
    Badge: { defaultProps: { radius: 'sm', variant: 'light' } },
    TextInput: { defaultProps: { radius: 'sm' } },
    Select: { defaultProps: { radius: 'sm' } },
    Table: {
      defaultProps: {
        striped: false,
        highlightOnHover: true,
        withTableBorder: false,
        withColumnBorders: false,
      },
    },
    Notification: { defaultProps: { radius: 'md' } },
    Modal: { defaultProps: { radius: 'md', centered: true } },
    SegmentedControl: { defaultProps: { radius: 'sm' } },
    Skeleton: { defaultProps: { radius: 'sm' } },
  },
});
```

---

## 9. Dark mode

### Configuración

```tsx
<MantineProvider defaultColorScheme="auto" theme={associatedTheme}>
  {children}
</MantineProvider>
```

### Anti-FOUC (en `<head>` de `index.html`, antes de stylesheets)

```html
<script>
  (function () {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
  })();
</script>
```

### Paleta dark con identidad de marca

La paleta `dark` de Mantine se sobrescribe con shades derivados de `#27343E` (matiz azul-petróleo):

| Superficie         | Rol                     | Color orientativo | Shade    |
| ------------------ | ----------------------- | ----------------- | -------- |
| Fondo body         | Base                    | `#1A2329`         | `dark.7` |
| Superficie elevada | Cards, modales, sidebar | `#27343E`         | `dark.6` |
| Superficie hover   | Hover filas/items       | `#2E3D47`         | `dark.5` |
| Bordes             | Separadores             | `#3A4F5A`         | `dark.4` |
| Texto dimmed       | Labels, placeholders    | `#7A8F9A`         | `dark.3` |
| Texto secundario   | Complementario          | `#A0B0B8`         | `dark.2` |
| Texto principal    | Contenido               | `#D5DDE0`         | `dark.0` |

### Logos adaptativos

```tsx
import { useComputedColorScheme } from '@mantine/core';

function BrandLogo() {
  const colorScheme = useComputedColorScheme('light');
  const logo = colorScheme === 'dark' ? logoHorizontalWhite : logoHorizontal;
  return <img src={logo} alt="associated" height={32} />;
}
```

| Contexto         | Light mode            | Dark mode                   |
| ---------------- | --------------------- | --------------------------- |
| Header expandido | `logo-horizontal.svg` | `logo-horizontal-white.svg` |
| Header colapsado | `isotipo.svg`         | `isotipo-white.svg`         |
| Login            | `logo-stacked.svg`    | `logo-stacked-white.svg`    |

Las versiones white usan `#EAF7FE` (`brand.0`) en lugar de blanco puro — suaviza el contraste.

---

## 10. Brand assets — Estructura

```
web/
├── public/
│   ├── favicon.svg                    # Favicon moderno (light/dark via prefers-color-scheme)
│   ├── favicon.ico                    # Legacy (16+32px)
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png           # 180×180
│   ├── web-app-manifest-192x192.png   # PWA Android (maskable)
│   ├── web-app-manifest-512x512.png   # PWA splash (maskable)
│   ├── site.webmanifest
│   └── og-image.png                   # 1200×630
└── src/shared/assets/
    ├── isotipo.svg                    # Colores marca — uso general
    ├── isotipo-white.svg              # Blanco (#EAF7FE) — fondos oscuros
    ├── logo-horizontal.svg            # Isotipo + "associated" — colores marca
    ├── logo-horizontal-white.svg      # Isotipo + "associated" — blanco
    ├── logo-stacked.svg               # Vertical — colores marca
    └── logo-stacked-white.svg         # Vertical — blanco
```

Importar logos como URL (no inline SVG): `<img src={logo} alt="associated" height={32} />`.
