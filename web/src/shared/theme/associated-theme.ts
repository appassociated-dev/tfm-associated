// Tema definitivo de Associated para Mantine 8.x
// Generado a partir de doc/brand/002-associated-ui-product-guidelines.md (Seccion 1.3)
// Todos los valores provienen de la especificacion de marca — no modificar sin actualizar el doc.

import { Button, createTheme, MantineColorsTuple } from '@mantine/core';

/** Paleta de marca: 10 shades generados desde el gris azulado del isotipo (#5B7682). */
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
  // --- Colores ---
  primaryColor: 'brand',
  primaryShade: { light: 7, dark: 5 },
  colors: { brand },
  autoContrast: true,
  luminanceThreshold: 0.3,

  other: {
    brandDark: '#27343E', // Azul oscuro del isotipo — uso estructural (sidebar, cabeceras)
  },

  // --- Tipografia ---
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
    xl: '1.25rem', // 20px — subtitulos grandes
  },
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
  },

  // --- Espaciado ---
  spacing: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
  },

  // --- Bordes ---
  defaultRadius: 'sm',
  radius: {
    xs: '0.125rem', // 2px
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
  },

  // --- Sombras ---
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
  },

  // --- Comportamiento ---
  cursorType: 'pointer',
  focusRing: 'auto',
  fontSmoothing: true,
  respectReducedMotion: true,

  // --- Defaults de componentes ---
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'sm', // 4px — bordes sutiles, no redondeados
        loaderProps: { type: 'dots' },
      },
      styles: {
        root: {
          // Evita que el boton colapse en ancho cuando entra en estado loading,
          // lo que causaba que el spinner apareciera descentrado o fuera del boton.
          minWidth: '100px',
        },
      },
    }),
    Paper: {
      defaultProps: {
        radius: 'md', // 8px
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

  // Color scheme: se configura en MantineProvider con defaultColorScheme="auto".
  // Detecta la preferencia del sistema (light/dark) automaticamente.
});
