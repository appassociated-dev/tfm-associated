# Associated — UI/Product Brand Guidelines

> Versión mínima de alto nivel para el inicio del desarrollo frontend.
> Framework de referencia: **Mantine 8.x** + React 19 + Vite 7.
> Este documento traduce las directrices del Brand Foundation (`001-associated-brand-foundation.md`) a tokens, configuraciones y patrones aplicables directamente al código del producto.

---

## 1. Theme de Mantine — Configuración central

Todo el sistema visual de Associated se implementa a través de un único `createTheme()` que se pasa a `MantineProvider` en la raíz de la aplicación. El theme se almacena en `web/src/shared/theme/associated-theme.ts`. Ningún componente debe usar valores de color, tipografía o espaciado hardcodeados fuera de los tokens definidos aquí.

### 1.1 Color primario de marca — Paleta de 10 shades

Mantine requiere que cada color personalizado tenga exactamente 10 shades (índices 0–9, de más claro a más oscuro). Associated define una única paleta personalizada como `primaryColor` del theme.

El `primaryColor` de la aplicación es `'brand'`, generado a partir del gris azulado del isotipo (`#5B7682`). Este es el color que Mantine aplicará automáticamente a todos los componentes interactivos: botones, links, checkboxes, radios, selects activos, focus rings, segmented controls, tabs y cualquier componente que no reciba una prop `color` explícita. El `primaryShade` se configura como `{ light: 7, dark: 5 }` — en light mode se usa el shade más oscuro para contrastar contra fondos claros; en dark mode se invierte la lógica y se usa un shade más luminoso para contrastar contra fondos oscuros.

**Paleta `brand` (base `#5B7682`, generada con [Mantine Colors Generator](https://mantine.dev/colors-generator/)):**

| Shade | Hex       | Uso principal                                                   |
| ----- | --------- | --------------------------------------------------------------- |
| 0     | `#eaf7fd` | Fondos `light` variant (badges, alerts)                         |
| 1     | `#e0eaee` | Fondos hover sutiles                                            |
| 2     | `#c5d1d6` | Bordes `outline` variant                                        |
| 3     | `#a6b7be` | Texto deshabilitado                                             |
| 4     | `#8ca1aa` | Iconos secundarios                                              |
| 5     | `#7a939e` | Texto de enlace hover                                           |
| 6     | `#708c99` | Hover sobre acciones primarias                                  |
| 7     | `#5b7682` | **Color base del isotipo** — acciones primarias en light scheme |
| 8     | `#506c78` | Acciones primarias en dark scheme                               |
| 9     | `#3d5e6c` | Pressed / active state                                          |

> **¿Por qué `#5B7682` y no `#27343E`?** El isotipo de Associated tiene dos colores: `#5B7682` (gris azulado) y `#27343E` (azul oscuro). El azul oscuro es tan cercano al negro que, al generar la paleta de 10 shades, los shades intermedios (6–7) — que son los que Mantine usa para botones y elementos interactivos — resultan en grises apagados sin personalidad de marca. En cambio, `#5B7682` como base produce una paleta donde el shade 7 es exactamente el color identitario del isotipo. Los botones, links y acciones primarias transmiten la identidad de Associated de forma inmediata.

**El color `#27343E` (azul Associated oscuro)** no se registra como paleta en `theme.colors`. Se usa de forma estructural mediante CSS directo:

| Uso                               | Implementación         |
| --------------------------------- | ---------------------- |
| Bloque CTA oscuro (landing)       | Background de sección  |
| Franja de cabecera en PDFs/emails | Definido en plantillas |

Para facilitar su uso consistente sin hardcodear el hex en múltiples lugares, se registra en `theme.other`:

```typescript
other: {
  brandDark: '#27343E',
},
```

Accesible en componentes via `useMantineTheme().other.brandDark`.

**Colores semánticos:** Associated no sobreescribe los colores semánticos por defecto de Mantine (`red`, `green`, `orange`, `blue`). Se usan tal como vienen en Open Color. Esto garantiza coherencia con todos los componentes de Mantine sin mantenimiento adicional. Los colores semánticos definidos en el Brand Foundation (`#2D7A4F`, `#C0392B`, etc.) eran aproximaciones previas a la elección de Mantine — los colores de Open Color los reemplazan en el producto.

| Función                | Color Mantine | Shade por defecto |
| ---------------------- | ------------- | ----------------- |
| Éxito / Confirmación   | `green`       | 6 (`#40C057`)     |
| Error / Alerta crítica | `red`         | 6 (`#FA5252`)     |
| Advertencia            | `yellow`      | 6 (`#FAB005`)     |
| Información            | `blue`        | 6 (`#228BE6`)     |

### 1.2 Colores neutros

Para los neutros, Associated usa la escala `gray` de Mantine (Open Color) sin modificaciones. La correspondencia con los valores del Brand Foundation es:

| Concepto Brand Foundation        | Token Mantine                  | Variable CSS             |
| -------------------------------- | ------------------------------ | ------------------------ |
| Fondo principal (`#F8F9FA`)      | `gray.0`                       | `--mantine-color-gray-0` |
| Fondo secundario (`#EFF1F3`)     | `gray.1` (`#F1F3F5`)           | `--mantine-color-gray-1` |
| Bordes y separadores (`#D1D5DB`) | `gray.3` (`#DEE2E6`)           | `--mantine-color-gray-3` |
| Texto dimmed                     | `gray.5` (`#ADB5BD`)           | `--mantine-color-gray-5` |
| Texto secundario (`#6C7080`)     | `gray.6` (`#868E96`)           | `--mantine-color-gray-6` |
| Texto principal (`#1A1A2E`)      | `gray.9` (`#212529`) o `black` | `--mantine-color-black`  |

> **Decisión de alineación:** los valores exactos del Brand Foundation (ej: `#1A1A2E` para texto principal) difieren ligeramente de los de Mantine (`#212529` para `gray.9`). En el producto se usan los valores de Mantine para evitar overrides innecesarios y mantener coherencia con todos los componentes. El Brand Foundation se actualiza en su próxima revisión para reflejar estos valores definitivos.

### 1.3 Snippet del theme

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
    brandDark: '#27343E', // Azul oscuro del isotipo — uso estructural (PDFs, emails, landing CTA). NO se usa como fondo de sidebar.
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
      h1: { fontSize: '1.5rem', lineHeight: '1.3' }, // 24px
      h2: { fontSize: '1.25rem', lineHeight: '1.35' }, // 20px
      h3: { fontSize: '1rem', lineHeight: '1.4' }, // 16px
      h4: { fontSize: '0.875rem', lineHeight: '1.45' }, // 14px
      h5: { fontSize: '0.8125rem', lineHeight: '1.45' }, // 13px
      h6: { fontSize: '0.75rem', lineHeight: '1.5' }, // 12px
    },
  },
  fontSizes: {
    xs: '0.75rem', // 12px — captions
    sm: '0.8125rem', // 13px — labels, texto secundario
    md: '0.875rem', // 14px — cuerpo de texto
    lg: '1rem', // 16px — texto destacado
    xl: '1.25rem', // 20px — subtítulos grandes
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
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },

  // ─── Bordes ───
  defaultRadius: 'sm',
  radius: {
    xs: '0.125rem', // 2px
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
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

  // ─── Color scheme ───
  // Color scheme: se configura en MantineProvider con defaultColorScheme="auto".
  // Detecta la preferencia del sistema (light/dark) automaticamente.
});
```

### 1.4 Carga de la fuente

Inter se carga desde Google Fonts o como paquete npm. La carga debe ser no bloqueante para cumplir con el requisito de rendimiento RNFT-017 (dashboard carga en <2 segundos).

```html
<!-- En index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

> **Nota sobre Plus Jakarta Sans:** El Brand Foundation define Inter como familia principal y Plus Jakarta Sans como alternativa. En los mockups de referencia (landing y dashboard) se usó Plus Jakarta Sans por razones de diferenciación visual en contexto de presentación. **En el producto, la familia definitiva es Inter.** Plus Jakarta Sans puede usarse en la landing page comercial si se desea un carácter más cálido, pero nunca dentro de la aplicación.

---

## 2. Layout y estructura de página

### 2.1 AppShell

La estructura general del producto utiliza `AppShell` de Mantine con header superior y sidebar colapsable a la izquierda. La configuración es:

```typescript
const NAVBAR_WIDTH = 240;
const NAVBAR_COLLAPSED_WIDTH = 70;

<AppShell
  header={{ height: 60 }}
  navbar={{
    width: {
      base: NAVBAR_WIDTH,        // 240px
      sm: desktopCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH,  // 70px o 240px
    },
    breakpoint: 'sm',
    collapsed: { mobile: !mobileOpened },
  }}
  padding="lg"
>
```

**Header (`height: 60`).** Contiene dos zonas:

- **Zona de marca (izquierda):** ancho sincronizado con la sidebar. Con sidebar expandida muestra `logo-horizontal.svg` y un boton toggle de colapso. Con sidebar colapsada muestra `isotipo.svg` con CSS hover swap al icono `IconLayoutSidebar`. En movil muestra Burger + `logo-horizontal.svg`.
- **Menu de usuario (derecha):** avatar con iniciales, nombre, badge de rol, informacion del tenant activo, logout y switch de tenant.

**Sidebar colapsable.** El estado de colapso se gestiona con `useDisclosure(false)` (inicia expandida). En modo expandido muestra icono + label para cada item de navegacion. En modo colapsado muestra solo el icono con `Tooltip` al hacer hover. Los headers de seccion se ocultan en modo colapsado y se reemplazan por un `Divider`. En movil el comportamiento no cambia: hamburger + overlay via `collapsed: { mobile: !mobileOpened }`.

**Fondo y colores de la sidebar.** La sidebar usa el fondo por defecto del theme de Mantine, que se adapta automaticamente a light y dark mode. No se aplica `#27343E` como fondo. Todos los colores de texto usan variables CSS semanticas de Mantine:

| Estado               | Variable CSS                   |
| -------------------- | ------------------------------ |
| Texto inactivo       | `--mantine-color-dimmed`       |
| Texto hover / activo | `--mantine-color-text`         |
| Texto item activo    | `--mantine-color-brand-filled` |
| Fondo item activo    | `--mantine-color-brand-light`  |

### 2.2 Grid y breakpoints

El sistema de grid usa los breakpoints por defecto de Mantine:

| Breakpoint | Valor         | Uso                                 |
| ---------- | ------------- | ----------------------------------- |
| xs         | 36em (576px)  | Móvil apaisado                      |
| sm         | 48em (768px)  | Tablet vertical, colapso de sidebar |
| md         | 62em (992px)  | Tablet apaisado                     |
| lg         | 75em (1200px) | Desktop                             |
| xl         | 88em (1408px) | Desktop grande                      |

Para los grids de KPIs y tarjetas, la regla es: 4 columnas en desktop (lg+), 2 en tablet (sm–md), 1 en móvil (<sm). Se usa `SimpleGrid` de Mantine con `cols={{ base: 1, sm: 2, lg: 4 }}`.

### 2.3 Contenedores

El contenido principal no tiene `maxWidth` fijo — se expande para ocupar el espacio disponible restando el ancho de la sidebar. El padding interno del área principal es `lg` (24px).

---

## 3. Componentes — Default props y patrones

Mantine permite definir `defaultProps` para todos los componentes a nivel de theme. Esto garantiza coherencia sin tener que recordar pasar las mismas props en cada instancia.

### 3.1 Default props globales

```typescript
// Dentro de createTheme()
components: {
  Button: {
    defaultProps: {
      radius: 'sm',    // 4px — bordes sutiles, no redondeados
    },
  },
  Paper: {
    defaultProps: {
      radius: 'md',    // 8px
      shadow: 'sm',
      withBorder: true,
    },
  },
  Card: {
    defaultProps: {
      radius: 'md',
      shadow: 'sm',
      withBorder: true,
      padding: 'lg',
    },
  },
  Badge: {
    defaultProps: {
      radius: 'sm',
      variant: 'light',
    },
  },
  TextInput: {
    defaultProps: {
      radius: 'sm',
    },
  },
  Select: {
    defaultProps: {
      radius: 'sm',
    },
  },
  Table: {
    defaultProps: {
      striped: false,
      highlightOnHover: true,
      withTableBorder: false,
      withColumnBorders: false,
    },
  },
  Notification: {
    defaultProps: {
      radius: 'md',
    },
  },
  Modal: {
    defaultProps: {
      radius: 'md',
      centered: true,
    },
  },
  SegmentedControl: {
    defaultProps: {
      radius: 'sm',
    },
  },
  Skeleton: {
    defaultProps: {
      radius: 'sm',
    },
  },
},
```

### 3.2 Patrones de componentes específicos

**Botones.** El botón primario usa `variant="filled"` con `color="brand"` (que hereda del `primaryColor`). El botón secundario usa `variant="outline"` o `variant="default"`. Nunca se usa `variant="gradient"`. Los botones destructivos usan `color="red"`.

**Badges de estado.** Se usa `variant="light"` por defecto. Los colores semánticos de Mantine se mapean directamente a los estados del dominio:

| Estado                     | Color Mantine | Ejemplo                                   |
| -------------------------- | ------------- | ----------------------------------------- |
| Activo / Pagado            | `green`       | `<Badge color="green">Activo</Badge>`     |
| Pendiente                  | `yellow`      | `<Badge color="yellow">Pendiente</Badge>` |
| Suspendido / Devuelto      | `red`         | `<Badge color="red">Suspendido</Badge>`   |
| Baja voluntaria / Inactivo | `gray`        | `<Badge color="gray">Baja</Badge>`        |
| Información / Enviada      | `blue`        | `<Badge color="blue">Enviada</Badge>`     |

**Tablas.** Se usa el componente `Table` de Mantine con `highlightOnHover`. Los importes numéricos se alinean a la derecha con `style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}`. Las cabeceras usan texto en `uppercase` y `fz="xs"` con `fw={600}` y `c="dimmed"`.

**Formularios.** Se usa `react-hook-form` 7 con `@hookform/resolvers/zod` para validación Zod integrada. Los labels usan el tamaño por defecto de Mantine (`sm`). Los mensajes de error se muestran inline debajo del campo, en rojo, con el componente de error nativo de cada input.

**Estados vacíos.** Se usa un bloque centrado con texto en `c="dimmed"` y un botón de acción primaria. Sin ilustraciones decorativas — texto directo que explica qué irá ahí y cómo empezar. Coherente con el valor de funcionalidad de la marca.

**Skeleton loaders.** Se usa `Skeleton` de Mantine para cada widget de forma independiente durante la carga. Esto permite renderizado progresivo: si un módulo del dashboard falla, los demás se muestran normalmente (errores aislados, según UC-064).

**Notificaciones.** Se usa `@mantine/notifications`. Sin emojis, sin exclamaciones. Tono funcional. Ejemplo: "Remesa generada correctamente. 47 recibos incluidos." — nunca "¡Tu remesa está lista! 🎉".

---

## 4. Iconografía en Mantine

El Brand Foundation define Lucide como librería de iconos. En Mantine 8.x, los iconos se integran como componentes React via `lucide-react`.

```typescript
import { IconUsers, IconCash, IconCalendar } from '@tabler/icons-react';
// O alternativamente con lucide-react:
import { Users, Banknote, Calendar } from 'lucide-react';
```

> **Decisión práctica:** Mantine tiene integración nativa con `@tabler/icons-react` (misma familia visual que Lucide — ambos son forks de Feather Icons). Si se prefiere minimizar dependencias, Tabler Icons es la opción natural con Mantine. Si se quiere mantener la especificación literal del Brand Foundation, se usa `lucide-react`. Ambas librerías son visualmente compatibles (outline, stroke 1.5px). **No mezclar ambas librerías en la misma aplicación.**

Reglas de tamaño (via prop `size` en el componente icon o `style`):

| Contexto               | Tamaño | Stroke |
| ---------------------- | ------ | ------ |
| Navegación sidebar     | 20px   | 1.5    |
| Botones con icono      | 16px   | 1.5    |
| Inline en texto        | 16px   | 1.5    |
| Tablas                 | 16px   | 1.5    |
| KPI cards (decorativo) | 20px   | 1.5    |

---

## 5. Formateo de datos

Reglas de formateo coherentes con las convenciones lingüísticas del Brand Foundation (§ 6.6) y con el requisito técnico del dashboard (UC-064):

### 5.1 Importes

Todos los importes llegan del backend en **centavos** (enteros). El frontend convierte y formatea.

```typescript
// web/src/shared/utils/format-money.ts
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
// 34500 → "345,00 €"
```

Separador de miles: punto. Separador decimal: coma. Símbolo: `€` al final con espacio. En tablas, se usa `fontVariantNumeric: 'tabular-nums'` para alineación.

### 5.2 Fechas

```typescript
// Formato largo: "8 de marzo de 2026"
// Formato compacto: "08/03/2026"
// Nunca formato anglosajón: "03/08/2026"
```

Mantine 8.x usa strings en formato `YYYY-MM-DD` como valores internos en `@mantine/dates`. El formateo visual al español se hace en la capa de presentación.

### 5.3 Números

```typescript
// 1247 → "1.247"
new Intl.NumberFormat('es-ES').format(1247);
// Porcentajes: 6.6 → "6,6%"
```

---

## 6. Responsive — Criterios de adaptación

### 6.1 Regla general

Mobile-first no significa que el MVP esté optimizado para móvil — la audiencia principal (tesoreros, secretarios) trabaja en desktop. Pero el portal del socio (PWA) sí es mobile-first. Las reglas responsive se aplican mediante el sistema de breakpoints de Mantine y la prop `visibleFrom` / `hiddenFrom` para mostrar/ocultar elementos.

### 6.2 Sidebar

**Desktop (>= sm / 768px):** visible por defecto en modo expandido (240px). El usuario puede colapsar la sidebar a 70px mediante un boton toggle en el header, mostrando solo iconos con tooltips. El estado de colapso se gestiona con `useDisclosure`.

**Movil (< sm):** colapsada por defecto. Se abre como overlay mediante hamburger menu usando `AppShell.Navbar` con `collapsed: { mobile: !mobileOpened }`.

### 6.3 Grids de contenido

| Componente               | Desktop (lg+) | Tablet (sm–md) | Móvil (<sm) |
| ------------------------ | ------------- | -------------- | ----------- |
| KPI cards membresía      | 4 columnas    | 2 columnas     | 1 columna   |
| KPI cards tesorería      | 5 columnas    | 2 columnas     | 1 columna   |
| Gráficos                 | 2 columnas    | 1 columna      | 1 columna   |
| Tarjetas de colectividad | 4 columnas    | 2 columnas     | 1 columna   |
| Pricing cards            | 3 columnas    | 1 columna      | 1 columna   |

Implementación con `SimpleGrid`:

```tsx
<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>{kpiCards}</SimpleGrid>
```

### 6.4 Tablas

En pantallas < sm, las tablas de datos (socios, cargos, cobros) se transforman en tarjetas apiladas usando el patrón de `Table` responsive de Mantine o un listado de `Card` condicionado por breakpoint.

---

## 7. Accesibilidad — WCAG AA

Requisitos derivados del Brand Foundation (§ 7.1 contraste mínimo 4.5:1) y de RNFT-046:

**Contraste de color.** Todos los textos deben cumplir ratio 4.5:1 contra su fondo. Los textos grandes (≥ 18px o ≥ 14px bold) cumplen con ratio 3:1. Mantine con `autoContrast: true` ajusta automáticamente el color de texto en variantes filled.

**Focus ring.** `focusRing: 'auto'` (default Mantine) — visible solo al navegar con teclado.

**Labels en inputs.** Todo input debe tener un `label` visible. No se usan `placeholder` como sustituto de label.

**Iconos como acción.** Nunca se usa un icono como único elemento de acción sin `aria-label` o tooltip accesible. Esto está alineado con la regla del Brand Foundation (§ 7.5): "los iconos acompañan al texto, no lo sustituyen".

**Reducción de movimiento.** `respectReducedMotion: true` — las animaciones se deshabilitan si el usuario tiene `prefers-reduced-motion: reduce` en su sistema operativo.

---

## 8. Brand Assets — Inventario y uso

Esta sección documenta todos los archivos gráficos de marca, su ubicación en el proyecto, cuándo usar cada uno y las reglas de integración en el HTML.

### 8.1 Estructura de archivos en el proyecto

Todos los assets estáticos se colocan en `web/public/` para que Vite los sirva directamente sin procesamiento. Los logos SVG usados como componentes React se importan desde `web/src/shared/assets/`.

```
web/
├── public/
│   ├── favicon.ico                      # Favicon legacy (32×32, multi-size 16+32)
│   ├── favicon.svg                      # Favicon moderno (con soporte light/dark mode)
│   ├── favicon-96x96.png                # Favicon PNG para contextos específicos
│   ├── apple-touch-icon.png             # iOS — añadir a pantalla de inicio (180×180)
│   ├── web-app-manifest-192x192.png     # PWA Android (192×192, maskable)
│   ├── web-app-manifest-512x512.png     # PWA Android splash (512×512, maskable)
│   ├── site.webmanifest                 # Manifest PWA
│   └── og-image.png                     # Open Graph — compartir en redes (1200×630)
│
└── src/
    └── shared/
        └── assets/
            ├── isotipo.svg              # Isotipo colores de marca — uso general
            ├── isotipo-hq.svg           # Isotipo alta calidad — fuente maestra (no usar en producción)
            ├── isotipo-white.svg        # Isotipo blanco (#EAF7FE) — fondos oscuros
            ├── logo-horizontal.svg      # Isotipo + "associated" — colores de marca
            ├── logo-horizontal-white.svg # Isotipo + "associated" — blanco (#EAF7FE)
            ├── logo-stacked.svg         # Isotipo arriba + "associated" debajo — colores de marca
            └── logo-stacked-white.svg   # Isotipo arriba + "associated" debajo — blanco (#EAF7FE)
```

> **`isotipo-hq.svg`** es la fuente maestra del isotipo con máximo detalle en los paths. No se usa directamente en la aplicación — se usa como origen para generar las demás variantes. En producción se usa `isotipo.svg` (versión optimizada para web).

### 8.2 Uso de cada asset

**Favicon y navegador:**

| Archivo             | Cuándo se usa                       | Notas                                                                                           |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `favicon.svg`       | Navegadores modernos                | Incluye soporte automático light/dark mode via `prefers-color-scheme`. Prioritario sobre `.ico` |
| `favicon.ico`       | Navegadores legacy, bookmarks       | Fallback para navegadores que no soportan SVG favicon                                           |
| `favicon-96x96.png` | Atajos de acceso directo, shortcuts | Algunos contextos de Windows y Android usan este tamaño                                         |

**PWA y dispositivos móviles:**

| Archivo                        | Cuándo se usa                       | Notas                                                   |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------- |
| `apple-touch-icon.png`         | iOS — "Añadir a pantalla de inicio" | 180×180px. iOS no consulta el webmanifest para el icono |
| `web-app-manifest-192x192.png` | Android — icono de app PWA          | Declarado en `site.webmanifest` con `purpose: maskable` |
| `web-app-manifest-512x512.png` | Android — splash screen PWA         | Declarado en `site.webmanifest` con `purpose: maskable` |
| `site.webmanifest`             | Manifest PWA                        | Contiene nombre, descripción, iconos, colores de tema   |

**Open Graph (redes sociales):**

| Archivo        | Cuándo se usa                                                                                 | Notas                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `og-image.png` | Cuando se comparte un enlace de Associated en redes sociales, WhatsApp, Slack, LinkedIn, etc. | 1200×630px. Fondo transparente — considerar exportar versión con fondo `#F8F9FA` si las plataformas lo renderizan mal |

**Logos dentro de la aplicación:**

| Archivo                     | Cuándo se usa                                                                               | Contexto visual                             |
| --------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `logo-horizontal.svg`       | Header (sidebar expandida, light mode), landing page header, footer, documentos PDF, emails | Fondo claro (blanco, `gray.0`, `gray.1`)    |
| `logo-horizontal-white.svg` | Header (sidebar expandida, dark mode), CTAs oscuros                                         | Fondo oscuro (tema dark, `#27343E`, etc.)   |
| `logo-stacked.svg`          | Pantalla de login (light mode), splash screen, app store listing                            | Fondo claro, centrado, con espacio generoso |
| `logo-stacked-white.svg`    | Pantalla de login (dark mode), splash en dark mode                                          | Fondo oscuro                                |
| `isotipo.svg`               | Header (sidebar colapsada, light mode), avatar en redes, marca de agua                      | Fondo claro                                 |
| `isotipo-white.svg`         | Header (sidebar colapsada, dark mode), favicon dark mode, icono sobre fondos oscuros        | Fondo oscuro                                |

**Mapa de uso por contexto de la aplicacion:**

Los logos se ubican en la zona de marca del header, no en la sidebar. La variante (normal o white) se selecciona segun el color scheme activo, detectado via `useComputedColorScheme('light')`.

| Contexto   | Header expandido            | Header colapsado    | Login                    |
| ---------- | --------------------------- | ------------------- | ------------------------ |
| Light mode | `logo-horizontal.svg`       | `isotipo.svg`       | `logo-stacked.svg`       |
| Dark mode  | `logo-horizontal-white.svg` | `isotipo-white.svg` | `logo-stacked-white.svg` |

> La sidebar ya no tiene fondo oscuro fijo. Los logos estan en el header, que sigue el color scheme del tema. Se usa la variante normal en light mode y la variante white en dark mode. El swap se implementa con `useComputedColorScheme('light')` para determinar el esquema efectivo y seleccionar el asset correspondiente.

### 8.3 Integración en `index.html`

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Associated — Gestión para colectividades</title>
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
    <meta property="og:title" content="Associated — Gestión para colectividades" />
    <meta
      property="og:description"
      content="ERP ligero para asociaciones culturales, peñas festeras, clubes deportivos y cofradías."
    />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:type" content="website" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Associated — Gestión para colectividades" />
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
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 8.4 Importación de logos en componentes React

Los SVGs de `src/shared/assets/` se importan como componentes React o como URLs según el uso:

```tsx
// Como URL (para <img> tags — mantiene el SVG como archivo externo)
import logoHorizontalWhite from '@/shared/assets/logo-horizontal-white.svg';

// En el componente
<img src={logoHorizontalWhite} alt="associated" height={32} />;
```

> **No usar SVGs inline en JSX** para los logos — los paths son complejos y ensucian el código. Importar como URL y usar `<img>` es más limpio y cacheable. Si se necesita cambiar colores dinámicamente con CSS, considerar `<img>` con filtros CSS o un componente wrapper que cargue el SVG.

### 8.5 Reglas de uso

**Versiones white.** Todas las versiones white usan `#EAF7FE` (`brand.0`) en lugar de blanco puro (`#FFFFFF`). Esto suaviza el contraste sobre fondos oscuros y es coherente con la paleta de marca.

**Tamaños de renderizado recomendados:**

| Contexto                  | Archivo                     | Ancho recomendado |
| ------------------------- | --------------------------- | ----------------- |
| Header expandido (light)  | `logo-horizontal.svg`       | 140–160px         |
| Header expandido (dark)   | `logo-horizontal-white.svg` | 140–160px         |
| Header colapsado (light)  | `isotipo.svg`               | 28–32px           |
| Header colapsado (dark)   | `isotipo-white.svg`         | 28–32px           |
| Pantalla de login (light) | `logo-stacked.svg`          | 120–140px         |
| Pantalla de login (dark)  | `logo-stacked-white.svg`    | 120–140px         |
| Landing header            | `logo-horizontal.svg`       | 160–180px         |
| Footer                    | `logo-horizontal.svg`       | 120px             |

**`og:image` en producción.** La URL del `og:image` debe ser absoluta cuando se despliegue. Cambiar `/og-image.png` por `https://tu-dominio.es/og-image.png` en los meta tags, o configurar el base URL de Vite para que lo resuelva.

---

## 9. Dark mode — Implementacion activa

El dark mode esta soportado desde el MVP. La configuracion se realiza con `defaultColorScheme="auto"` en `MantineProvider`, lo que permite que la aplicacion detecte automaticamente la preferencia del sistema operativo del usuario y aplique el esquema correspondiente.

### 9.1 Configuracion en MantineProvider

```tsx
<MantineProvider defaultColorScheme="auto" theme={associatedTheme}>
  {children}
</MantineProvider>
```

El valor `"auto"` delega la deteccion al media query `prefers-color-scheme` del navegador. El usuario obtiene automaticamente light o dark mode segun la configuracion de su sistema operativo, sin necesidad de un toggle manual en la aplicacion.

### 9.2 Prevencion de FOUC (Flash of Unstyled Content)

Para evitar el destello visual que ocurre cuando React aun no ha montado y el navegador renderiza con el esquema incorrecto, se incluye un script de deteccion en `index.html` que se ejecuta antes del renderizado:

```html
<script>
  // Detecta prefers-color-scheme y aplica el atributo data-mantine-color-scheme
  // antes de que React monte, evitando flash de color incorrecto.
  (function () {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
  })();
</script>
```

Este script debe ir en el `<head>` antes de cualquier stylesheet para que el navegador aplique los estilos correctos desde el primer frame.

### 9.3 Regla de variables CSS — Prohibicion de valores hardcodeados

Todo el CSS de la aplicacion DEBE usar variables semanticas de Mantine que se adaptan automaticamente al esquema de color activo. Esta prohibido usar valores hex hardcodeados o variables de shade directo como `gray.X` (que no se invierten entre light y dark mode).

**Variables semanticas obligatorias:**

| Proposito              | Variable CSS                     | Uso                                                       |
| ---------------------- | -------------------------------- | --------------------------------------------------------- |
| Texto principal        | `--mantine-color-text`           | Texto de contenido general                                |
| Texto secundario       | `--mantine-color-dimmed`         | Labels, placeholders, texto de apoyo                      |
| Fondo hover            | `--mantine-color-default-hover`  | Hover sobre filas, items interactivos                     |
| Bordes                 | `--mantine-color-default-border` | Separadores, bordes de cards                              |
| Accion primaria filled | `--mantine-color-brand-filled`   | Texto o fondo de elementos activos con color de marca     |
| Accion primaria light  | `--mantine-color-brand-light`    | Fondos sutiles con color de marca (badges, items activos) |

**Ejemplos de uso incorrecto vs correcto:**

```css
/* INCORRECTO — no se adapta a dark mode */
.nav-item {
  color: #868e96;
}
.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* CORRECTO — se adapta automaticamente */
.nav-item {
  color: var(--mantine-color-dimmed);
}
.nav-item:hover {
  background: var(--mantine-color-default-hover);
}
```

### 9.4 Logos adaptativos

Los logos deben cambiar de variante segun el esquema de color activo. Se usa `useComputedColorScheme('light')` para determinar el esquema efectivo y seleccionar el asset correspondiente:

```tsx
import { useComputedColorScheme } from '@mantine/core';
import logoHorizontal from '@/shared/assets/logo-horizontal.svg';
import logoHorizontalWhite from '@/shared/assets/logo-horizontal-white.svg';

function BrandLogo() {
  const colorScheme = useComputedColorScheme('light');
  const logo = colorScheme === 'dark' ? logoHorizontalWhite : logoHorizontal;

  return <img src={logo} alt="associated" height={32} />;
}
```

El fallback `'light'` en `useComputedColorScheme('light')` garantiza que si el esquema aun no se ha resuelto (SSR, primer render), se usa la variante de light mode por defecto.

### 9.5 Direccion de diseno — Paleta dark con identidad de marca

La paleta `dark` de Mantine por defecto usa Open Color, que tiene un matiz violeta-grisaceo (`dark.7: #1d1e30`) sin relacion con la identidad de Associated. La direccion de diseno validada e implementada es sobreescribir la paleta `dark` con shades derivados del azul Associated (`#27343E`), manteniendo el matiz azul-petroleo que identifica a la marca.

**Estructura de superficies:**

| Superficie         | Rol                          | Color orientativo        | Paleta `dark` shade |
| ------------------ | ---------------------------- | ------------------------ | ------------------- |
| Fondo body         | Fondo base de la aplicacion  | `#1A2329` (o mas oscuro) | `dark.7`            |
| Superficie elevada | Cards, modales, sidebar      | `#27343E`                | `dark.6`            |
| Superficie hover   | Hover sobre filas, items     | `#2E3D47` (aprox.)       | `dark.5`            |
| Bordes             | Separadores, bordes de cards | `#3A4F5A` (aprox.)       | `dark.4`            |
| Texto dimmed       | Labels, placeholders         | `#7A8F9A` (aprox.)       | `dark.3`            |
| Texto secundario   | Contenido complementario     | `#A0B0B8` (aprox.)       | `dark.2`            |
| Texto principal    | Contenido principal          | `#D5DDE0` (aprox.)       | `dark.0`            |

> Los valores son orientativos. Deben generarse y validarse para cumplir WCAG AA (4.5:1 para texto normal, 3:1 para texto grande) a medida que se refine la paleta custom.

**Paleta `brand` en dark mode.** El `primaryShade` esta configurado como `{ light: 7, dark: 5 }`. En dark mode los elementos interactivos usan `brand.5` (`#7a939e`), un shade mas luminoso que el base (`#5b7682`), necesario para que los botones y links contrasten contra fondos oscuros. Esta decision se valido visualmente comparando `brand.4`, `brand.5` y `brand.6` sobre el fondo previsto (`#1A2329`): el shade 5 ofrece el equilibrio optimo entre presencia visual y coherencia de marca — el shade 6 resulta demasiado apagado y el shade 4 demasiado lavado, desdibujando el caracter del color.

> **Logica de inversion:** en paletas desaturadas como la de Associated, el dark mode requiere invertir la direccion del shade respecto al light mode. En light mode el shade alto (7) contrasta contra el fondo claro. En dark mode el shade bajo (5) contrasta contra el fondo oscuro. Esto es diferente de paletas saturadas (como `blue` de Open Color) donde el shade alto sigue funcionando en dark mode gracias a la intensidad cromatica.

---

## 10. Lo que no cubre este documento (pendiente para iteracion)

Este documento es la version minima de alto nivel. Las siguientes areas se completaran durante y despues de la implementacion del frontend del MVP:

### 10.1 Component library propia

Durante la implementacion se identificaran componentes que se reutilizan frecuentemente con configuraciones especificas de Associated (KpiCard, StatusBadge, MoneyText, etc.). Estos se documentaran como un mini design system interno en `web/src/shared/components/`.

### 10.2 Animaciones y transiciones

El Brand Foundation define la personalidad como "discreta". Las animaciones deben ser funcionales (transiciones de estado, skeleton loaders), nunca decorativas. Los valores exactos de duracion y easing se definen durante la implementacion.

### 10.3 Theming por tenant

El modelo multi-tenant de Associated (ADR-002) permite que cada colectividad personalice ciertos aspectos visuales (logo, colores de acento). El alcance y los limites de esta personalizacion se definen post-MVP.

### 10.4 Internacionalizacion visual

La interfaz es en espanol en MVP. Cuando se implemente i18n, la escala tipografica y los layouts deberan validarse para idiomas con palabras mas largas.
