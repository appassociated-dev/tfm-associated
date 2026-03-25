# Reporte SDD-5: fix/cross-cutting-quality

## Resumen ejecutivo

Ejecutadas las 5 fases SDD (propose, spec, design, tasks, apply) para resolver 9 issues de calidad transversal (P2/P3) identificados en la auditoria frontend-fase1. Todos los issues del alcance fueron implementados y verificados. Se instalaron 3 paquetes nuevos y se actualizaron 14 archivos. 429 tests pasan correctamente.

## Issues abordados

| #     | Prioridad | Estado | Descripcion                                                                   | Archivos modificados           |
| ----- | --------- | ------ | ----------------------------------------------------------------------------- | ------------------------------ |
| P2-3  | P2        | FIXED  | AppShell padding `md` (16px) cambiado a `lg` (24px) segun guidelines          | `app-shell.tsx`                |
| P2-4  | P2        | FIXED  | PostCSS config con `postcss-preset-mantine` para responsive mixins            | `postcss.config.cjs` (NUEVO)   |
| P3-1  | P3        | FIXED  | Stepper con iconos IconUser, IconCategory, IconCheck en wizard de alta        | `simple-registration.page.tsx` |
| P3-2  | P3        | FIXED  | `useBlocker` reemplaza `window.confirm()` con Modal Mantine (proceed/reset)   | `simple-registration.page.tsx` |
| P3-3  | P3        | FIXED  | Tildes corregidas: "anos" → "anos", "Numero" → "Numero" en todos los archivos | 8 archivos (ver lista abajo)   |
| P3-5  | P3        | FIXED  | Sidebar con iconos: IconDashboard, IconUserPlus, IconReceipt                  | `app-shell.tsx`                |
| P3-9  | P3        | FIXED  | Comentario corregido: `defaultColorScheme` → `forceColorScheme`               | `associated-theme.ts`          |
| P3-10 | P3        | FIXED  | `data-mantine-color-scheme="light"` en `<html>` para prevenir FOUC            | `index.html`                   |
| P3-12 | P3        | FIXED  | Iconos IconUserMinus e IconUserPlus en botones LeaveActions                   | `leave-actions.tsx`            |

## Cambios realizados

### Archivos modificados

| Archivo                                                                       | Cambio                                                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `web/src/shared/components/layout/app-shell.tsx`                              | Padding `md` → `lg`, iconos sidebar (@tabler/icons-react), NavItem con prop `icon`                        |
| `web/postcss.config.cjs`                                                      | **NUEVO** - PostCSS config con postcss-preset-mantine y postcss-simple-vars                               |
| `web/index.html`                                                              | Script inline para `data-mantine-color-scheme="light"` (previene FOUC)                                    |
| `web/src/shared/theme/associated-theme.ts`                                    | Comentario corregido: `forceColorScheme` en vez de `defaultColorScheme`                                   |
| `web/src/features/membership/registration/pages/simple-registration.page.tsx` | Stepper icons (IconUser, IconCategory, IconCheck), useBlocker con Modal Mantine, descripciones con tildes |
| `web/src/features/membership/registration/components/member-type-step.tsx`    | "anos" → "anos" en todas las ocurrencias                                                                  |
| `web/src/features/membership/registration/components/confirmation-step.tsx`   | "ano/anos" → "ano/anos", "numero" → "numero"                                                              |
| `web/src/features/membership/registration/components/personal-data-step.tsx`  | "ano/anos" → "ano/anos"                                                                                   |
| `web/src/features/membership/registration/hooks/use-simple-registration.ts`   | "Numero" → "Numero" en notificacion                                                                       |
| `web/src/features/membership/leave/components/leave-actions.tsx`              | Iconos IconUserMinus/IconUserPlus en botones                                                              |
| `web/src/features/membership/leave/pages/voluntary-leave.page.tsx`            | "Numero de socio" → "Numero de socio"                                                                     |
| `web/src/features/membership/leave/pages/nonpayment-leave.page.tsx`           | "Numero de socio" → "Numero de socio"                                                                     |
| `web/src/features/membership/leave/pages/reinstatement.page.tsx`              | "Numero de socio" → "Numero de socio"                                                                     |

### Archivos de test actualizados

| Archivo                                                                            | Cambio                                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `web/src/features/membership/registration/pages/simple-registration.page.spec.tsx` | Expectativas "Confirmacion" → "Confirmacion", "Informacion" → "Informacion" |
| `web/src/features/membership/registration/components/member-type-step.spec.tsx`    | "anos" → "anos" en todas las expectativas                                   |
| `web/src/features/membership/registration/components/personal-data-step.spec.tsx`  | "anos" → "anos" en expectativas                                             |
| `web/src/features/membership/registration/utils/dni-validator.spec.ts`             | Tildes en descripciones de tests                                            |

## Paquetes instalados

| Paquete                  | Workspace | Proposito                                                                     |
| ------------------------ | --------- | ----------------------------------------------------------------------------- |
| `postcss-preset-mantine` | web       | Habilita responsive mixins de Mantine (light-dark, smaller-than, larger-than) |
| `postcss-simple-vars`    | web       | Variables de breakpoints para CSS modules                                     |
| `@tabler/icons-react`    | web       | Iconos para sidebar, stepper, y botones de accion                             |

## Tests

```
Test Files  38 passed (38)
     Tests  429 passed (429)
  Duration  10.19s
```

Todos los tests existentes pasan. No se crearon tests nuevos (cambios cosmeticos/configuracion).

## Issues postponed (con justificacion)

| #    | Issue                    | Justificacion                                                                                                                                                                                                                             |
| ---- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-1 | i18n con react-i18next   | Requiere crear archivos de traduccion para TODA la app (todos los strings hardcodeados). Es un proyecto en si mismo que afecta 50+ archivos. No es viable como fix puntual - necesita su propio SDD dedicado con migracion progresiva.    |
| P2-2 | ErrorReporter con Sentry | Requiere integracion completa de Sentry: DSN, configuracion de captura, filtros de PII (GDPR), session replay. Depende de cuenta Sentry configurada y decision de arquitectura sobre que capturar. Postponed para fase de observabilidad. |

## Notas tecnicas

### P3-2: useBlocker con Modal Mantine

React Router v7 `useBlocker` retorna un objeto `Blocker` con estados `unblocked`/`blocked`/`proceeding` y metodos `proceed()`/`reset()`. Esto permite renderizar un Modal de Mantine cuando `blocker.state === 'blocked'` en vez de usar `window.confirm()`. El usuario puede elegir "Quedarse" (reset) o "Salir sin guardar" (proceed).

### P3-10: ColorSchemeScript FOUC

Como la app usa `forceColorScheme="light"` en MantineProvider (sin soporte dark mode en MVP), se inyecta un script inline en `index.html` que setea `data-mantine-color-scheme="light"` en el `<html>` antes del render. Esto es equivalente a `ColorSchemeScript` de Mantine SSR pero para SPA puro.
