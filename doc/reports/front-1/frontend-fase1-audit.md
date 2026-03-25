# Informe de Auditoria - Frontend Fase 1

**Fecha:** 18 de marzo de 2026
**Branch:** mvp/frontend-fase1
**Sesion:** 20260318-001-acester-CLAUDECODE
**Auditor:** Claude Opus 4.6 (6 subagentes en paralelo)

---

## Resumen Ejecutivo

La fase 1 del frontend tiene la **estructura correcta** (archivos, schemas, API services, hooks, componentes, tests) pero es **completamente inutilizable en produccion** debido a 5 bugs criticos bloqueantes. El mas grave: el sidebar solo muestra "Dashboard" porque el sistema de permisos esta roto en 3 niveles (no soporta wildcards, race condition, formatos incompatibles). Ademas, multiples paginas son inaccesibles (sin links de navegacion) y las paginas de baja tienen params de ruta incorrectos.

**Estadisticas globales:**

- **6 bugs CRITICOS** (P0) - bloquean uso completo de la aplicacion
- **12 issues ALTOS** (P1) - funcionalidad incompleta o rota
- **18 issues MEDIOS** (P2) - afectan UX/calidad
- **12 issues BAJOS** (P3) - cosmeticos/tecnicos menores
- **404 unit tests passing** - pero enmascaran bugs reales (mocks de useParams, permissions)

---

## Seccion 1: Bugs CRITICOS (P0) - Bloquean la aplicacion

### P0-1: `hasPermission` no soporta wildcards

**Impacto:** TODO el sidebar excepto Dashboard esta oculto para TODOS los usuarios.

| Aspecto        | Detalle                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| Archivo        | `web/src/features/auth/context/use-permissions.ts:13`                      |
| Problema       | `permissions.includes(permission)` - match EXACTO de strings               |
| Backend envia  | PRESIDENT: `['*']`, TREASURER: `['treasury:*', 'membership:members:read']` |
| Frontend busca | `'membership:members:read'`, `'treasury:*:read'`, `'settings:*:read'`      |
| Resultado      | `['*'].includes('membership:members:read')` → `false`                      |

### P0-2: Race condition - permisos vacios tras login

| Aspecto   | Detalle                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------- |
| Archivo   | `web/src/features/auth/context/auth.provider.tsx:158-168`                                       |
| Problema  | `getCurrentUser().then(setPermissions)` es async, pero la navegacion a `/dashboard` es sincrona |
| Resultado | Sidebar se renderiza con `permissions = []`, luego se actualiza (o no)                          |

### P0-3: Formatos de permisos incompatibles backend ↔ frontend

| Aspecto            | Detalle                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| Backend            | `treasury:*` (2 segmentos), `membership:members:read` (3 segmentos)         |
| Frontend NAV_ITEMS | `treasury:*:read` (3 segmentos con wildcard intermedia)                     |
| Resultado          | Incluso con wildcard matching, `treasury:*` no matchearia `treasury:*:read` |

### P0-4: Route param mismatch `:id` vs `memberId` (Task 5 - Leave)

| Aspecto   | Detalle                                                                           |
| --------- | --------------------------------------------------------------------------------- |
| Router    | `members/:id/leave`, `members/:id/nonpayment-leave`, `members/:id/reinstate`      |
| Paginas   | `useParams<{ memberId: string }>()` - buscan `memberId`                           |
| Resultado | `memberId` siempre `undefined`, hooks con `enabled: !!memberId` nunca se ejecutan |
| Tests     | Enmascaran el bug: mockean `useParams` devolviendo `{ memberId: '...' }`          |

### P0-5: NAV_ITEMS apuntan a rutas inexistentes

| NAV_ITEM        | Ruta                  | Existe en router.tsx? |
| --------------- | --------------------- | --------------------- |
| Socios          | `/members`            | NO                    |
| Tesoreria       | `/treasury`           | NO                    |
| Configuracion   | `/settings`           | NO                    |
| Dashboard       | `/dashboard`          | SI                    |
| Nuevo Socio     | `/members/new`        | SI                    |
| Planes de Cuota | `/treasury/fee-plans` | SI                    |

Clickear "Socios", "Tesoreria" o "Configuracion" navega a pagina en blanco.

### P0-6: Paginas inaccesibles - sin links de navegacion

| Pagina          | Ruta                                        | Accesible desde sidebar? | Link desde otra pagina?                  |
| --------------- | ------------------------------------------- | ------------------------ | ---------------------------------------- |
| Suscripciones   | `/treasury/members/:memberId/subscriptions` | NO                       | NO - 0 links en toda la app              |
| Baja voluntaria | `/members/:id/leave`                        | NO                       | NO - requiere ficha de socio inexistente |
| Baja impago     | `/members/:id/nonpayment-leave`             | NO                       | NO - idem                                |
| Rehabilitacion  | `/members/:id/reinstate`                    | NO                       | NO - idem                                |

---

## Seccion 2: Issues ALTOS (P1) - Funcionalidad incompleta

| #     | Task | Issue                                                                                                                 | Archivo(s)                                  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| P1-1  | T4   | `birthDate` usa `<input type="date">` nativo en vez de Mantine `DateInput` - formato depende del locale del navegador | `personal-data-step.tsx:248`                |
| P1-2  | T4   | Faltan precondiciones FE-4 (plan inscripcion) y FE-5 (ejercicio fiscal activo)                                        | `simple-registration.page.tsx`              |
| P1-3  | T4   | Paso 3 Confirmacion no muestra importe real de cargo inscripcion con `formatMoney()`                                  | `confirmation-step.tsx:88-98`               |
| P1-4  | T2   | "Ver vinculaciones" menu item sin onClick - `LinkMemberTypesModal` existe pero NO esta cableado                       | `fee-plans-list.page.tsx:231`               |
| P1-5  | T2   | `DeactivateFeePlanModal` siempre asume 0 suscripciones - proteccion inactiva                                          | `fee-plans-list.page.tsx:250-254`           |
| P1-6  | T2   | Formulario usa `@mantine/form` en vez de `react-hook-form + zodResolver` - viola convenciones                         | `fee-plan-form.tsx`                         |
| P1-7  | T3   | `ExemptionModal` sin DatePicker para periodo inicio/fin de exencion                                                   | `exemption-modal.tsx`                       |
| P1-8  | T5   | "Cancelar Baja - Regularizacion" boton sin handler - no hace nada                                                     | `nonpayment-leave.page.tsx`                 |
| P1-9  | T5   | Falta boton "Generar Certificado PDF"                                                                                 | `nonpayment-leave.page.tsx`                 |
| P1-10 | T5   | Falta alerta de workflow de morosidad incompleto                                                                      | `nonpayment-leave.page.tsx`                 |
| P1-11 | T5   | Falta DNI en datos del socio (schema y UI)                                                                            | `leave.schemas.ts`, todas las paginas leave |
| P1-12 | T1   | Sidebar sin agrupacion por secciones (labels de seccion con opacidad 30%)                                             | `app-shell.tsx`                             |

---

## Seccion 3: Issues MEDIOS (P2) - Afectan UX/calidad

| #     | Task | Issue                                                                                          |
| ----- | ---- | ---------------------------------------------------------------------------------------------- |
| P2-1  | ALL  | **No hay i18n** - web/CLAUDE.md dice "ALWAYS use react-i18next". Todos los textos hardcodeados |
| P2-2  | ALL  | **No hay ErrorReporter** - diseno requiere `captureException()` para 5xx y ZodError            |
| P2-3  | T0   | AppShell padding `md` (16px) en vez de `lg` (24px) segun guidelines                            |
| P2-4  | T0   | Falta PostCSS config (`postcss-preset-mantine`) - responsive mixins no funcionan               |
| P2-5  | T2   | Schema `createFeePlanInput` sin validacion condicional RECURRING (frequency + billingMonths)   |
| P2-6  | T2   | Colores badges en ImportTemplateModal inconsistentes con tabla principal                       |
| P2-7  | T3   | Falta Breadcrumb en pagina de suscripciones                                                    |
| P2-8  | T3   | ChangePlanModal sin alerta diferenciada de cargos pendientes                                   |
| P2-9  | T3   | SubscriptionSelector no filtra planes por memberTypeId                                         |
| P2-10 | T4   | Hook `useSimpleRegistration` no maneja error HTTP 412                                          |
| P2-11 | T4   | `onValidChange` falta en dependency array del useEffect                                        |
| P2-12 | T5   | Workflow morosidad hardcodeado - fases estaticas con texto "Pendiente" fijo                    |
| P2-13 | T5   | Notificacion exito generica sin detalles (fecha, suscripciones cerradas)                       |
| P2-14 | T5   | Falta boton "Procesar Baja por Impago" para estado PENDING_PAYMENT                             |
| P2-15 | T5   | Falta campo re-escritura "CONFIRMAR BAJA" en doble paso                                        |
| P2-16 | T5   | mutation inline en nonpayment-leave (rompe convencion hooks separados)                         |
| P2-17 | T5   | `use-reinstate-member` sin onError                                                             |
| P2-18 | T3   | No distingue ONE_TIME vs RECURRING en logica de creacion suscripcion                           |

---

## Seccion 4: Issues BAJOS (P3) - Cosmeticos/tecnicos menores

| #     | Task | Issue                                                                     |
| ----- | ---- | ------------------------------------------------------------------------- |
| P3-1  | T4   | Stepper sin iconos (IconUser, IconCategory, IconCheck)                    |
| P3-2  | T4   | `useBlocker` usa `window.confirm()` en vez de Modal Mantine               |
| P3-3  | T4   | Tildes faltantes: "anos" → "anos", "Numero" → "Numero"                    |
| P3-4  | T4   | Schemas Zod usan sintaxis v3 (`z.string().email()` → `z.email()`)         |
| P3-5  | T2   | Sidebar sin iconos (@tabler/icons-react)                                  |
| P3-6  | T2   | `useUpdateFeePlan` sin onError                                            |
| P3-7  | T1   | TenantSelector muestra slug en vez de tipo de colectividad                |
| P3-8  | T1   | Error 423 muestra "unos minutos" en vez de tiempo especifico              |
| P3-9  | T0   | Comentario incorrecto en theme: `defaultColorScheme` → `forceColorScheme` |
| P3-10 | T0   | Falta `ColorSchemeScript` para prevenir FOUC                              |
| P3-11 | T3   | Falta badge "Recomendado" en plan default de SubscriptionSelector         |
| P3-12 | T5   | Falta iconos en LeaveActions (IconUserMinus, IconUserPlus)                |

---

## Seccion 5: Lo que funciona bien

A pesar de los bugs criticos, la **base estructural** es solida:

- **Schemas Zod**: Completos y correctos en todas las tasks (excepto v3 syntax menor)
- **API services**: Todos usan Zod parsing, patron `data.data ?? data`, endpoints correctos
- **Hooks TanStack Query**: Query keys, invalidacion, staleTime, notificaciones
- **Theme Mantine**: Paleta brand correcta, 11 component defaults, tipografia Inter
- **SVGs**: 6 archivos de produccion correctos
- **index.html**: Favicon, Open Graph, Twitter Card, PWA manifest, Inter preconnect
- **Discount calculator**: Formula multiplicativa correcta con desglose
- **DNI validator**: Algoritmo mod 23 completo (DNI + NIE + calculateAge)
- **StatusBadge**: 8 estados con colores exactos al diseno
- **ProtectedRoute**: Verificacion auth + permisos (cuando los permisos estan cargados)
- **Token management**: Access token en memoria, refresh en localStorage, queue para 401
- **404 unit tests passing** (aunque algunos enmascaran bugs)

---

## Seccion 6: Estrategia de Subsanacion - Flujos SDD Propuestos

### SDD-1: `fix/permissions-and-navigation` (P0 - BLOQUEANTE)

**Alcance:** Desbloquea TODA la aplicacion. Sin este fix, nada mas importa.

**Incluye:**

- P0-1: Implementar wildcard matching en `hasPermission`
- P0-2: Resolver race condition de permisos (await antes de navegar)
- P0-3: Alinear formatos de permisos backend ↔ frontend
- P0-5: Convertir "Socios", "Tesoreria", "Configuracion" en headers no-clickeables o eliminarlos
- P1-12: Agrupacion por secciones en sidebar con labels

**Estimacion de complejidad:** Baja-media. ~5 archivos afectados.

### SDD-2: `fix/route-params-and-accessibility` (P0 - BLOQUEANTE)

**Alcance:** Hace accesibles las paginas que existen pero no se pueden alcanzar.

**Incluye:**

- P0-4: Fix param mismatch `:id` → `:memberId` (o viceversa)
- P0-6: Agregar links de navegacion a paginas inaccesibles (suscripciones, leave)
- D: Breadcrumbs en todas las paginas internas (suscripciones, leave)

**Estimacion de complejidad:** Baja. ~8 archivos, cambios puntuales.

### SDD-3: `fix/forms-and-validation` (P1)

**Alcance:** Corrige formularios incompletos y validaciones faltantes.

**Incluye:**

- P1-1: Reemplazar `<input type="date">` por Mantine `DateInput`
- P1-2: Precondiciones FE-4 y FE-5 en wizard de registro
- P1-3: Importe real de inscripcion en paso 3 con `formatMoney()`
- P1-6: Migrar FeePlanForm de `@mantine/form` a `react-hook-form + zodResolver`
- P1-7: DatePicker en ExemptionModal
- P2-5: Validacion condicional RECURRING en schema

**Estimacion de complejidad:** Media. ~10 archivos.

### SDD-4: `fix/uncabled-features` (P1)

**Alcance:** Conecta funcionalidad implementada pero no cableada.

**Incluye:**

- P1-4: Cablear "Ver vinculaciones" a LinkMemberTypesModal
- P1-5: Obtener conteo suscripciones activas para DeactivateModal
- P1-8: Handler para "Cancelar Baja - Regularizacion"
- P1-9: Boton "Generar Certificado PDF"
- P1-10: Alerta workflow morosidad incompleto
- P1-11: DNI en datos del socio (schema + UI)

**Estimacion de complejidad:** Media. ~12 archivos.

### SDD-5: `fix/cross-cutting-quality` (P2)

**Alcance:** Issues transversales de calidad.

**Incluye:**

- P2-1: i18n con react-i18next (ALL tasks)
- P2-2: ErrorReporter integration (ALL tasks)
- P2-3: AppShell padding md → lg
- P2-4: PostCSS config
- P2-15: Campo re-escritura "CONFIRMAR BAJA"
- Todos los P3 cosmeticos

**Estimacion de complejidad:** Alta (por volumen, i18n afecta todos los archivos). Puede diferirse post-MVP si es necesario.

---

## Orden de ejecucion recomendado

```
SDD-1 (permissions)  ─┐
                       ├──→ SDD-3 (forms)  ──→ SDD-5 (quality)
SDD-2 (routes/nav)   ─┘         │
                                 └──→ SDD-4 (uncabled)
```

**SDD-1 y SDD-2 son independientes** y pueden ejecutarse en paralelo.
**SDD-3 y SDD-4 dependen de SDD-1** (sin permisos, no se puede navegar para verificar).
**SDD-5 es independiente** pero conviene dejarlo para el final.

---

## Nota sobre el "boton gris" del login

El boton "Acceder" usa `color="brand"` correctamente. El color brand base es `#5B7682` (gris azulado) - **es asi por diseno de marca**, documentado en `doc/brand/001-associated-brand-foundation.md`. Si se desea un boton mas vibrante, requiere revision del Brand Foundation, no un fix de implementacion.
