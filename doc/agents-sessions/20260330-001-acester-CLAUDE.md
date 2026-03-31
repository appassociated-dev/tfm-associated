# Sesion Agente: 20260330-001-acester-CLAUDE

- **Agente de IA:** Claude Sonnet 4.6
- **Fecha creacion:** 30 de marzo de 2026
- **Hora de inicio:** 01:40
- **Hora de ultimos trabajos:** 01:50

---

## Resumen de la sesion

SDD completo para el cambio `mutation-error-handling` en frontend (React, `web/`). Ciclo completo: Explore → Propose → Spec → Design → Tasks → Apply Fases 1–5 → Judgment Day (2 rondas, APPROVED). Se identificaron 6 hooks afectados (4 sin onError, 2 parciales), se implemento la utilidad compartida `handleMutationError`, se corrigieron los 6 hooks, y se paso Judgment Day tras 8 correcciones repartidas en 2 rondas.

---

## Objetivos

- [x] SDD Explore: identificar hooks con manejo de error incompleto en frontend
- [x] SDD Propose: definir enfoque de solucion alineado con RNF-049
- [x] SDD Spec: 22 escenarios y 9 requisitos en delta spec
- [x] SDD Design: disenar `handleMutationError` con tipos TypeScript y arquitectura de tests
- [x] SDD Tasks: 19 tareas en 5 fases listas para SDD Apply
- [x] SDD Apply Fase 1: claves i18n en `membership.json` y `treasury.json`
- [x] SDD Apply Fase 2: utilidad `handleMutationError` creada con TDD (8/8 tests GREEN)
- [x] SDD Apply Fase 3: `useReinstateMember` y `useVoluntaryLeave` corregidos
- [x] SDD Apply Fase 4: `useUpdateFeePlan`, `useActivateFeePlan`, `useDeactivateFeePlan`, `useImportTemplate` corregidos
- [x] SDD Apply Fase 5: verificacion — 55/55 tests GREEN, tsc limpio, lint limpio
- [x] Judgment Day: 2 rondas, 8 issues corregidos, APPROVED
- [ ] SDD Verify: pendiente
- [ ] SDD Archive: pendiente de verify

---

## Trabajo Realizado

### SDD Explore (01:40)

**Estado actual investigado:**

- 6 hooks de mutacion revisados en `web/src/features/`
- 4 hooks sin `onError` en absoluto: `useReinstateMember`, `useUpdateFeePlan`, `useActivateFeePlan`, `useImportTemplate`
- 2 hooks con manejo parcial (solo 422, sin fallback generico): `useVoluntaryLeave`, `useDeactivateFeePlan`
- Patron de referencia identificado en `useNonpaymentLeave` (post-implementacion leave-flow-completion)
- Descubrimiento: el backend responde 429 (no 423) para rate limiting — fuera de scope de este cambio

**Resultados:**

- Inventario completo de 6 hooks con gaps de error handling
- Patron de referencia validado para estandarizacion

### SDD Propose (01:40)

**Cambio propuesto:** `mutation-error-handling` — estandarizar manejo de errores en 6 hooks de mutacion del frontend

**Enfoque definido:**

- Utilidad compartida `handleMutationError(error, domainHandlers?)` en `web/src/shared/utils/`
- Ramas de dominio por hook via mapa de status codes: `{ 422: () => void }`
- Alineado con RNF-049 (consistencia de UX en errores)
- Sin cambios en backend (scope puramente frontend)

**Decisiones tecnicas:**

- Funcion compartida vs. logica inline en cada hook: compartida elegida para evitar duplicacion y garantizar consistencia
- `domainHandlers` opcional como `Partial<Record<number, () => void>>` — permite customizacion sin romper el contrato base
- Notificaciones via `notifications.show()` de `@mantine/notifications` (no nuevas dependencias)

### SDD Spec (01:40)

**9 requisitos especificados:**

- REQ-MEH-001 a REQ-MEH-009 cubriendo: utilidad compartida, manejo por codigo de error, integracion en 6 hooks, y tests

**22 escenarios Given/When/Then** cubriendo cada codigo de error por hook y casos limite (error sin response, error con mensaje custom, cleanup post-error).

**Nota de deuda tecnica detectada:** 2 tests existentes con aserciones incorrectas (afirmaban que el silencio ante errores no-422 era comportamiento correcto).

### SDD Design (01:40)

**Firma real de `handleMutationError`:**

```typescript
// web/src/shared/utils/handle-mutation-error.ts

/** Mapa de handlers por código HTTP — cada handler muestra su propia notificación de dominio. */
type MutationErrorHandlers = Partial<Record<number, () => void>>;

export function handleMutationError(error: unknown, domainHandlers?: MutationErrorHandlers): void;
```

**Tipo exportado:** `MutationErrorHandlers` (tipo alias, no interface).

**Decisiones de arquitectura:**

- Localizacion: `web/src/shared/utils/` para maxima reutilizacion
- `error: unknown` (no `any`) para seguridad de tipos — type narrowing interno via `instanceof ApiError`
- `domainHandlers` opcionales como `Partial<Record<number, () => void>>` para flexibilidad total por codigo HTTP
- Fallback generico siempre presente (nunca error silencioso): `common:errors.somethingWentWrong` + `common:errors.unexpected`
- **Impacto:** 0 cambios en API, 0 cambios en backend, 0 nuevas dependencias

### SDD Tasks (01:40)

**19 tareas desglosadas en 5 fases:**

- **Fase 1 - i18n (2 tareas):** claves de error en `membership.json` y `treasury.json`
- **Fase 2 - Utilidad compartida (2 tareas):** `handle-mutation-error.ts` con TDD (RED → GREEN) + spec
- **Fase 3 - Hooks de membership (4 tareas):** `useReinstateMember` + `useVoluntaryLeave` + sus specs
- **Fase 4 - Hooks de treasury (8 tareas):** `useUpdateFeePlan`, `useActivateFeePlan`, `useDeactivateFeePlan`, `useImportTemplate` + sus specs
- **Fase 5 - Verificacion (3 tareas):** tsc, eslint, vitest

### SDD Apply — Fase 1: i18n (01:50)

**Claves de error anadidas:**

`web/src/i18n/locales/es/membership.json` — claves en `leave.notifications`:

- `voluntaryLeave.stateErrorTitle`, `voluntaryLeave.stateErrorText`
- `reinstatement.stateErrorTitle`, `reinstatement.stateErrorText`

`web/src/i18n/locales/es/treasury.json` — claves en `feePlans.notifications`:

- `updateSuccess.title`, `updateSuccess.message`
- `activateSuccess.title`, `activateSuccess.message`
- `activateError.title`, `activateError.message`
- `deactivateSuccess.title`, `deactivateSuccess.message`
- `deactivateError.title`, `deactivateError.message`
- `importSuccess.title`, `importSuccess.message`
- `importError.title`, `importError.message`

### SDD Apply — Fase 2: Utilidad compartida `handleMutationError` (01:50)

**Implementacion TDD completa:**

- `web/src/shared/utils/handle-mutation-error.ts` — CREADO
- `web/src/shared/utils/handle-mutation-error.spec.ts` — CREADO (8/8 tests GREEN)
- Tipo: `MutationErrorHandlers = Partial<Record<number, () => void>>`
- Funcion: `handleMutationError(error: unknown, domainHandlers?: MutationErrorHandlers): void`
- Fallback generico siempre presente — nunca error silencioso
- Type narrowing sobre `error: unknown` via `instanceof ApiError`

### SDD Apply — Fase 3: Hooks de membership (01:50)

**`useReinstateMember`** (`web/src/features/membership/leave/hooks/use-reinstate-member.ts`):

- `onError` anadido con `handleMutationError`, rama 422 con notificacion de dominio especifica (`stateErrorTitle`)
- Spec actualizado: 8 tests

**`useVoluntaryLeave`** (`web/src/features/membership/leave/hooks/use-voluntary-leave.ts`):

- Refactorizado de patron hibrido a `handleMutationError(error, { 422: ... })` completo
- Spec actualizado: assertions de tests invertidas para reflejar comportamiento correcto
- 6 tests

### SDD Apply — Fase 4: Hooks de treasury (01:50)

**`useUpdateFeePlan`** (`web/src/features/treasury/fee-plans/hooks/use-update-fee-plan.ts`):

- `onError` anadido con `handleMutationError` sin handlers de dominio — fallback generico
- 8 tests

**`useActivateFeePlan`** (`web/src/features/treasury/fee-plans/hooks/use-activate-fee-plan.ts`):

- `onError` anadido con `handleMutationError`, rama 422 con notificacion de dominio especifica
- 7 tests

**`useDeactivateFeePlan`** (`web/src/features/treasury/fee-plans/hooks/use-deactivate-fee-plan.ts`):

- Refactorizado para usar `handleMutationError(error, { 422: ... })` — reemplaza logica inline anterior
- Assertions de tests invertidas para reflejar comportamiento correcto (antes: silencioso era correcto)
- 8 tests

**`useImportTemplate`** (`web/src/features/treasury/fee-plans/hooks/use-fee-plan-templates.ts`):

- `onError` anadido con `handleMutationError`, rama 422 con notificacion de dominio especifica
- 10 tests (4 para `useFeePlanTemplates` + 6 para `useImportTemplate`)

### SDD Apply — Fase 5: Verificacion (01:50)

- **55/55 tests GREEN** en 7 archivos spec
- **tsc limpio** — sin errores de tipos
- **lint limpio** — sin errores de ESLint

### Judgment Day — Ronda 1 (01:50)

Dos jueces ciegos independientes revisaron la implementacion. **6 issues confirmados + 4 sospechosos**. Correcciones aplicadas:

1. `useVoluntaryLeave` refactorizado de patron hibrido a delegacion completa en `handleMutationError(error, { 422: ... })`
2. Respuestas MSW 422 en specs de `use-voluntary-leave` y `use-deactivate-fee-plan` corregidas para usar envelope de error estandar `{ error: { code, message, details } }`
3. `handle-mutation-error.spec.ts` ahora verifica `title` y `message` del fallback generico (no solo `color`)
4. `use-reinstate-member.spec.ts` — test de error de red ahora verifica que se muestra notificacion roja
5. `autoClose: 4000` eliminado de notificaciones de error en `useActivateFeePlan` y `useDeactivateFeePlan`
6. Comentario clarificador en Espanol anadido en `handleMutationError` explicando las dos rutas al fallback

### Judgment Day — Ronda 2 (01:50)

Re-juicio tras correcciones. **2 issues adicionales in-scope encontrados**. Correcciones aplicadas:

1. `use-reinstate-member.spec.ts` — test 422 ahora aserta el titulo especifico de dominio (`Error de rehabilitacion`)
2. `use-reinstate-member.spec.ts` — test de "error de red" convertido a `HttpResponse.error()` real (antes usaba 500 con texto)

### Resultado Final: JUDGMENT APPROVED

**55/55 tests GREEN — ambos jueces aprobaron.**

---

## Recomendaciones fuera de scope (Judgment Day)

- Migrar `useNonpaymentLeave` (patron de referencia actual) para usar `handleMutationError` — actualmente usa el enfoque inline antiguo
- Estandarizar `autoClose` en notificaciones de exito a lo largo de todos los hooks

---

## Proximos Pasos

- [ ] SDD Verify: validar implementacion contra 9 requisitos y 22 escenarios
- [ ] SDD Archive: sincronizar delta specs y archivar

---

## Notas y Aprendizajes

### Lecciones Tecnicas

- **Backend usa 429, no 423:** El rate limiting del backend retorna HTTP 429 (Too Many Requests), no 423 (Locked). El codigo frontend que manejara 423 nunca se activara con el backend actual — fuera de scope pero documentado para el equipo
- **`Partial<Record<number, () => void>>` vs interface con metodos nombrados:** El mapa de handlers por codigo HTTP es mas flexible y extensible que una interface con metodos fijos (`onValidationError`, `onNotFound`, etc.) — permite manejar cualquier codigo HTTP futuro sin cambiar la firma
- **`error: unknown` vs `error: any`:** Usar `unknown` obliga a type narrowing explicito dentro de la funcion, garantizando que el codigo es type-safe desde la firma
- **Tests que afirman comportamiento incorrecto:** `useVoluntaryLeave` y `useDeactivateFeePlan` tenian tests que verificaban que los errores non-422 se descartaban silenciosamente. Esto es un anti-patron critico — los tests deben afirmar el comportamiento CORRECTO, no documentar los bugs existentes
- **MSW envelope estandar:** Las respuestas 422 en tests deben usar `{ error: { code, message, details } }` para que `ApiError` lo parsee correctamente. Respuestas planas no son compatibles con el cliente HTTP del proyecto

### Decisiones Arquitectonicas

- **Utilidad compartida en `shared/utils/`:** Alternativa era inline en cada hook, pero la duplicacion es inaceptable para 6 hooks
- **Mapa de handlers `Partial<Record<number, () => void>>`:** Los handlers reciben 0 argumentos — la responsabilidad de armar la notificacion queda en el hook, no en la utilidad compartida
- **Sin nuevas dependencias:** Todo se construye sobre `notifications` de Mantine y `i18n` ya configurado

---

## Metricas de la sesion

- **Duracion total:** ~4h (planificacion SDD + Apply Fases 1-5 + Judgment Day 2 rondas)
- **Archivos creados:** 2 (`handle-mutation-error.ts`, `handle-mutation-error.spec.ts`)
- **Archivos modificados:** 14 (6 hooks + 6 specs + 2 i18n)
- **Commits realizados:** 0
- **Tareas planificadas:** 19 tareas en 5 fases
- **Tests totales GREEN:** 55/55 en 7 archivos spec
- **Fases SDD completadas:** Explore ✅, Propose ✅, Spec ✅, Design ✅, Tasks ✅, Apply 1-5 ✅, Judgment Day ✅ (Verify y Archive pendientes)
- **Judgment Day:** 2 rondas — 8 issues corregidos — APPROVED

---

## Referencias

- RNF-049: Consistencia de UX en errores
- ADR-009: Clean Architecture por modulo
- Branch: mvp/frontend-fase1
- Cambio SDD: `mutation-error-handling`

---

## Archivos del Cambio

| Archivo                                                                     | Tipo       | Descripcion                                            |
| --------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `web/src/shared/utils/handle-mutation-error.ts`                             | CREADO     | Utilidad compartida de manejo de errores               |
| `web/src/shared/utils/handle-mutation-error.spec.ts`                        | CREADO     | 8 tests unitarios TDD                                  |
| `web/src/features/membership/leave/hooks/use-reinstate-member.ts`           | MODIFICADO | onError con handler 422                                |
| `web/src/features/membership/leave/hooks/use-reinstate-member.spec.ts`      | MODIFICADO | 8 tests corregidos                                     |
| `web/src/features/membership/leave/hooks/use-voluntary-leave.ts`            | MODIFICADO | Refactorizado a handleMutationError completo           |
| `web/src/features/membership/leave/hooks/use-voluntary-leave.spec.ts`       | MODIFICADO | 6 tests corregidos                                     |
| `web/src/features/treasury/fee-plans/hooks/use-update-fee-plan.ts`          | MODIFICADO | onError con fallback generico                          |
| `web/src/features/treasury/fee-plans/hooks/use-update-fee-plan.spec.ts`     | MODIFICADO | 8 tests                                                |
| `web/src/features/treasury/fee-plans/hooks/use-activate-fee-plan.ts`        | MODIFICADO | onError con handler 422                                |
| `web/src/features/treasury/fee-plans/hooks/use-activate-fee-plan.spec.ts`   | MODIFICADO | 7 tests                                                |
| `web/src/features/treasury/fee-plans/hooks/use-deactivate-fee-plan.ts`      | MODIFICADO | Refactorizado a handleMutationError                    |
| `web/src/features/treasury/fee-plans/hooks/use-deactivate-fee-plan.spec.ts` | MODIFICADO | 8 tests corregidos                                     |
| `web/src/features/treasury/fee-plans/hooks/use-fee-plan-templates.ts`       | MODIFICADO | useImportTemplate con onError y handler 422            |
| `web/src/features/treasury/fee-plans/hooks/use-fee-plan-templates.spec.ts`  | MODIFICADO | 10 tests (4 useFeePlanTemplates + 6 useImportTemplate) |
| `web/src/i18n/locales/es/membership.json`                                   | MODIFICADO | Claves de error para hooks de membership               |
| `web/src/i18n/locales/es/treasury.json`                                     | MODIFICADO | Claves de error para hooks de treasury                 |

---

**Estado final:** Judgment Day APPROVED — 55/55 tests GREEN, tsc limpio, lint limpio. Pendiente: SDD Verify → SDD Archive
**Proxima sesion:** SDD Verify → SDD Archive
