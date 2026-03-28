---
name: associated-ui
description: >
  Genera interfaces de usuario para el proyecto Associated (ERP para colectividades españolas)
  alineadas con la identidad de marca, las guías UI y la especificación técnica del proyecto.
  Usa este skill SIEMPRE que vayas a crear, modificar o revisar cualquier componente React,
  página, layout, formulario, modal, tabla, dashboard o cualquier pieza de interfaz del proyecto
  Associated. También úsalo cuando el usuario pida crear vistas, pantallas, o componentes UI,
  o cuando trabajes en archivos dentro de los directorios `web/src/`, `web/src/shared/`,
  `web/src/features/*/components/`. Incluso si el usuario no menciona explícitamente "UI"
  o "interfaz", si la tarea implica JSX, TSX, Mantine components, formularios, estilos,
  o cualquier renderizado visual de Associated, consulta este skill. Úsalo también para
  revisiones de código de componentes UI existentes, para verificar alineación con marca.
---

# Associated UI — Skill de Desarrollo de Interfaces

Este skill garantiza que toda interfaz generada para Associated cumpla cinco ejes: alineación con marca, accesibilidad, usabilidad, experiencia de usuario y atractivo visual. Todo valor de diseño aquí documentado proviene del Brand Foundation y las UI/Product Guidelines oficiales del proyecto; no se inventan valores.

---

## Contexto del proyecto

Associated es un ERP ligero multi-tenant para colectividades españolas (asociaciones culturales, peñas festeras, clubes deportivos, cofradías). Tiene dos interfaces: un **panel de gestión** para la junta directiva (desktop-first) y un **portal del socio** como PWA (mobile-first). La personalidad de marca es: funcional, directa, fiable, natural y discreta. La interfaz es un 90% neutros, 8% primarios de marca y 2% semánticos. Si una pantalla parece "colorida", algo está mal.

## Stack UI

Las librerías, versiones y justificaciones del stack frontend están definidas en la especificación del proyecto. Consulta el skill `/doc-spec-manager` para obtener la sección de stack actualizada (busca la sección "Librerías Frontend" y "UI Kit" en el documento de stack tecnológico).

No introduzcas dependencias fuera del stack definido en la especificación sin justificación explícita.

---

## 1. Theme de Mantine — Fuente única de verdad visual

El theme vive en `web/src/shared/theme/associated-theme.ts`. Lee `references/design-tokens.md` para el snippet completo y la justificación de cada decisión. Resumen ejecutivo:

**Color primario:** Paleta `brand` de 10 shades generada desde `#5B7682` (gris azulado del isotipo). `primaryShade: { light: 7, dark: 5 }` — en light mode el shade oscuro contrasta contra fondos claros; en dark mode se invierte.

**`#27343E` (azul oscuro del isotipo)** no es una paleta Mantine — se almacena en `theme.other.brandDark` para uso estructural (franjas de PDF, cabeceras de emails, bloques CTA en landing). Nunca como fondo de sidebar ni como color de componente interactivo.

**Colores semánticos:** los defaults de Mantine (Open Color) sin sobrescribir: `green`, `red`, `yellow`, `blue`. No se personalizan.

**Neutros:** escala `gray` de Mantine sin modificar.

**Tipografía:** Inter (familia única para producto). Pesos permitidos en interfaz: Regular (400), Medium (500), SemiBold (600). Nunca Bold (700) — contradice el tono discreto de la marca.

**Regla fundamental:** usa EXCLUSIVAMENTE los valores del theme. Cero hex hardcodeados. En CSS, usa variables semánticas de Mantine (`--mantine-color-text`, `--mantine-color-dimmed`, `--mantine-color-default-border`, etc.) que se adaptan automáticamente a dark mode.

---

## 2. Layout y estructura

### AppShell

```typescript
const NAVBAR_WIDTH = 240;
const NAVBAR_COLLAPSED_WIDTH = 70;

<AppShell
  header={{ height: 60 }}
  navbar={{
    width: { base: NAVBAR_WIDTH, sm: collapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH },
    breakpoint: 'sm',
    collapsed: { mobile: !mobileOpened },
  }}
  padding="lg"
>
```

**Header (60px):** zona de marca izquierda (logo adaptativo light/dark con `useComputedColorScheme('light')`) + menú usuario derecha (avatar con iniciales, nombre, badge de rol, tenant activo, logout, switch de tenant).

**Sidebar:** fondo default del tema (se adapta automáticamente a light/dark mode). Expandida: icono + label. Colapsada: solo icono con Tooltip. Móvil: hamburger + overlay.

| Estado sidebar     | Variable CSS                   |
| ------------------ | ------------------------------ |
| Texto inactivo     | `--mantine-color-dimmed`       |
| Texto hover/activo | `--mantine-color-text`         |
| Texto item activo  | `--mantine-color-brand-filled` |
| Fondo item activo  | `--mantine-color-brand-light`  |

### Breakpoints (defaults Mantine — no sobrescribir)

| Breakpoint | Valor         | Uso                     |
| ---------- | ------------- | ----------------------- |
| xs         | 36em (576px)  | Móvil apaisado          |
| sm         | 48em (768px)  | Tablet, colapso sidebar |
| md         | 62em (992px)  | Tablet apaisado         |
| lg         | 75em (1200px) | Desktop                 |
| xl         | 88em (1408px) | Desktop grande          |

---

## 3. Estructura de componentes

### Convención de archivos

```
web/src/features/{bounded-context}/components/
├── MemberList/
│   ├── MemberList.tsx
│   ├── MemberList.skeleton.tsx
│   ├── MemberList.empty.tsx
│   └── index.ts
```

### Tres estados obligatorios

Todo componente con fetch DEBE cubrir: **skeleton** (carga), **empty** (sin datos), **error** (fallo).

```typescript
const { data, isLoading, error, refetch } = useQuery({ queryKey, queryFn });

if (isLoading) return <ComponentSkeleton />;
if (error) return <ErrorState message={t('entity.loadError')} onRetry={refetch} />;
if (!data?.length) return <EmptyState entity="entity" onCreate={handleCreate} />;

return (/* render normal */);
```

---

## 4. Formularios

Lee `references/form-patterns.md` para detalles. Resumen:

- **Stack:** `react-hook-form` + `zod` + `react-hook-form-mantine`.
- **Validación inline:** errores bajo cada campo al perder foco. Labels visibles (no placeholder-solo). Campos obligatorios con `withAsterisk`.
- **Textos de validación** traducidos con `react-i18next`.
- **Wizard multi-paso:** estado en React Context, barra de progreso, validación por paso antes de avanzar.
- **Acciones destructivas:** modal de confirmación con botón destructivo (`color="red"`).

---

## 5. Accesibilidad (WCAG 2.1 AA)

Obligatorio, no opcional:

1. **Contraste:** 4.5:1 texto normal, 3:1 texto grande. `autoContrast: true` en theme.
2. **Focus ring:** `focusRing: 'auto'` — visible solo con teclado. No desactivar.
3. **Labels:** todo input con `label` visible.
4. **ARIA:** `aria-describedby` para errores, `aria-label` en ActionIcons.
5. **Skip to content:** primer elemento del DOM, visible al enfocar.
6. **Reducción de movimiento:** `respectReducedMotion: true`.
7. **Iconos como acción:** nunca sin `aria-label` o tooltip accesible.
8. **Verificación:** axe-core en Playwright, Lighthouse Accessibility > 90.

---

## 6. Responsive

**Panel de gestión:** desktop-first. **Portal del socio:** mobile-first.

```tsx
<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>{cards}</SimpleGrid>
```

| Componente          | lg+    | sm–md  | <sm   |
| ------------------- | ------ | ------ | ----- |
| KPI cards membresía | 4 cols | 2 cols | 1 col |
| KPI cards tesorería | 5 cols | 2 cols | 1 col |
| Gráficos            | 2 cols | 1 col  | 1 col |

Tablas en viewports < `sm`: transformar en cards apiladas. Sin scroll horizontal (320px mínimo). Touch targets: 44x44px mínimo.

---

## 7. Tono y copywriting en la UI

Cada texto refleja la personalidad de marca:

- **Sin exclamaciones** funcionales. "Remesa generada correctamente. 47 recibos incluidos."
- **Sin emojis** en producto ni emails transaccionales.
- **Sin condescendencia.** "Genera la remesa SEPA" — no "¡Es muy fácil!"
- **Errores precisos.** "3 socios no incluidos: IBAN no válido."
- **Tuteo siempre.** "Tu colectividad", "genera la remesa". Nunca usted.
- **Palabras prohibidas en UI:** solución, ecosistema, experiencia, disruptivo, innovador, líder, potente, robusto, escalable, enterprise, workflow, pipeline, stakeholder, engagement.
- **Formato español.** Punto miles, coma decimales: "1.247 socios", "142,50 €". Fechas: "08/03/2026".

---

## 8. Patrones de UX

Lee `references/component-patterns.md` para implementaciones. Resumen:

- **Feedback:** `@mantine/notifications`. Éxito = `color="teal"`. Error = `color="red"`. Operación en curso = `loading: true` → `.update()`.
- **Skeletons:** toda vista con fetch. Forma aproximada al contenido. Si >3s, texto complementario. Dashboard: skeleton por widget independiente.
- **Estados vacíos:** texto centrado `c="dimmed"` + CTA. Sin ilustraciones decorativas.
- **Tablas:** `highlightOnHover`, sin `striped`. Importes a la derecha con `tabular-nums`. Cabeceras `uppercase`, `fz="xs"`, `fw={600}`, `c="dimmed"`. Búsqueda con debounce 300ms, filtros en URL.
- **Badges de estado:** `variant="light"` siempre. Activo/Pagado = `green`, Pendiente = `yellow`, Suspendido/Error = `red`, Baja/Inactivo = `gray`, Info = `blue`.
- **Botones:** primario = `variant="filled"`. Secundario = `variant="outline"` o `"default"`. Destructivo = `color="red"`. Nunca `variant="gradient"`.
- **Rendimiento:** lazy loading rutas, prefetch en hover, chunk splitting, bundle < 200KB.

---

## 9. i18n

Todo texto visible por `react-i18next`. Claves: `{bc}.{entidad}.{accion}`. Comunes: `common.*`. Importes del backend en centavos → `formatMoney(cents)`. Fechas: `date-fns` con locale `es`.

## 10. Dark mode

`defaultColorScheme="auto"` en `MantineProvider`. Script anti-FOUC en `<head>`. Logos adaptativos con `useComputedColorScheme('light')`. Paleta `dark` con matiz azul-petróleo derivado de `#27343E`.

## 11. Iconografía

`lucide-react` o `@tabler/icons-react` — UNA librería. Outline, stroke 1.5px. 20px en sidebar/KPIs, 16px en botones/tablas. Nunca >24px. Color hereda del texto. Nunca color de marca en iconos funcionales. Acompañan texto, no lo sustituyen.

## 12. Checklist pre-entrega

- [ ] Tokens del theme — cero hex hardcodeados
- [ ] CSS con variables semánticas Mantine (dark mode compatible)
- [ ] Skeleton de carga + estado vacío + estado error
- [ ] i18n — cero strings hardcodeados
- [ ] Tono funcional: sin exclamaciones, sin emojis
- [ ] Teclado navegable, focus visible
- [ ] WCAG AA (4.5:1)
- [ ] Responsive: 320px, 768px, 1200px+
- [ ] Formularios: Zod + RHF + inline validation + withAsterisk
- [ ] Confirmación modal para destructivas
- [ ] Importes en formato español, fechas dd/MM/yyyy
- [ ] Iconos con texto o aria-label
- [ ] Max 2 pesos tipográficos por componente
- [ ] Sin scroll horizontal

---

## Referencias

| Archivo                            | Cuándo leerlo                                            |
| ---------------------------------- | -------------------------------------------------------- |
| `references/design-tokens.md`      | Configurar theme, verificar colores, tipografía, spacing |
| `references/component-patterns.md` | Tablas, modales, dashboards, estados vacíos, badges, nav |
| `references/form-patterns.md`      | Cualquier formulario                                     |
