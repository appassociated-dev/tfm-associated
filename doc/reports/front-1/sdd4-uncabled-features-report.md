# Reporte SDD-4: fix/uncabled-features

## Resumen ejecutivo

Se abordaron 6 issues P1 de la auditoria frontend-fase1 donde funcionalidad existia implementada pero no estaba cableada al flujo de usuario. Se resolvieron 3 issues completamente (P1-4, P1-10, P1-11), se mitigo la UX de 2 issues bloqueados por backend (P1-8, P1-9), y se postponed 1 issue (P1-5). 0 regresiones introducidas (427/428 tests pasan; 1 fallo pre-existente no relacionado).

## Issues abordados

### P1-4: LinkMemberTypesModal sin cablear - FIXED

- **Estado**: FIXED
- **Archivos modificados**: `web/src/features/treasury/fee-plans/pages/fee-plans-list.page.tsx`
- **Cambios**:
  - Importado `LinkMemberTypesModal` y `useFeePlan`
  - Agregado estado `linkOpened` via `useDisclosure`
  - Agregado `handleLink(plan)` handler que setea el plan seleccionado y abre el modal
  - Conectado `onClick={() => handleLink(plan)}` al menu item "Ver vinculaciones"
  - Agregado fetch de detalle del plan via `useFeePlan(selectedPlan?.id)` para obtener `linkedMemberTypes`
  - Renderizado `LinkMemberTypesModal` con conditional rendering `{selectedPlan && ...}`
- **Nota**: El backend `GetFeePlanHandler.fromDomain()` no mapea `linkedMemberTypes` actualmente. El frontend pasa `planDetail?.linkedMemberTypes ?? []` que fallback a array vacio via Zod optional parse. El modal funciona correctamente para crear nuevas vinculaciones.

### P1-5: DeactivateFeePlanModal con 0 suscripciones - POSTPONED

- **Estado**: POSTPONED
- **Justificacion**: El backend solo expone `hasActiveSubscriptions(boolean)` en el repositorio, utilizado internamente por `DeactivateFeePlanHandler` para lanzar `FeePlanHasActiveSubscriptionsError`. No existe un endpoint ni campo en `FeePlanResponseDto` que devuelva el conteo de suscripciones activas. La API de listado (`GET /v1/treasury/fee-plans`) retorna `FeePlan[]` sin este dato.
- **Accion requerida**: Backend debe agregar `activeSubscriptionsCount: number` a `FeePlanResponseDto` o crear endpoint `GET /v1/treasury/fee-plans/:id/subscriptions-count`.

### P1-8: Boton "Cancelar Baja - Regularizacion" sin handler - BLOCKED (mitigado)

- **Estado**: BLOCKED - requiere endpoint backend
- **Archivos modificados**: `web/src/features/membership/leave/pages/nonpayment-leave.page.tsx`
- **Cambios**:
  - Importado `Tooltip` de Mantine
  - Boton cambiado a `disabled` con `Tooltip` wrapper explicativo: "Funcionalidad pendiente - requiere endpoint de backend"
- **Endpoint requerido**: `POST /v1/members/:id/cancel-nonpayment-leave` que regularice la deuda y revierta el estado del socio a ACTIVE.
- **Verificacion**: No existe ningun endpoint `cancel*leave` ni `regulariz*` en `api/src/membership/infrastructure/controllers/`.

### P1-9: Falta boton "Generar Certificado PDF" - BLOCKED (mitigado)

- **Estado**: BLOCKED - requiere endpoint backend
- **Archivos modificados**: `web/src/features/membership/leave/pages/nonpayment-leave.page.tsx`
- **Cambios**:
  - Agregado boton `disabled` "Generar Certificado PDF" con `Tooltip` en la seccion del certificado de descubierto
  - Posicionado despues del total de deuda, alineado a la derecha
- **Endpoint requerido**: `GET /v1/members/:id/nonpayment-certificate` (o similar) que genere y retorne un PDF.
- **Verificacion**: En treasury existe `receipt-generator.ts` para recibos de pago, pero NO hay generador de certificados de descubierto en membership.

### P1-10: Falta alerta de workflow incompleto - FIXED

- **Estado**: FIXED
- **Archivos modificados**: `web/src/features/membership/leave/pages/nonpayment-leave.page.tsx`
- **Cambios**:
  - Agregado `Alert` color="yellow" con titulo "Workflow de morosidad incompleto" encima del `DelinquencyTimeline`
  - Texto informativo: las 5 fases son obligatorias, el seguimiento se gestiona desde backend
- **Nota**: El `DelinquencyTimeline` muestra todas las fases como "Pendiente" (active={-1}) porque el backend no proporciona datos de completitud de fases. Cuando el backend implemente el tracking de workflow, se podra alimentar el timeline con datos reales.

### P1-11: DNI falta en datos del socio - FIXED (frontend-ready)

- **Estado**: FIXED (frontend preparado, backend pendiente de enviar el campo)
- **Archivos modificados**:
  - `web/src/features/membership/leave/schemas/member-leave.schemas.ts`
  - `web/src/features/membership/leave/pages/nonpayment-leave.page.tsx`
  - `web/src/features/membership/leave/pages/voluntary-leave.page.tsx`
  - `web/src/features/membership/leave/pages/reinstatement.page.tsx`
- **Cambios**:
  - Schema `leaveSummarySchema`: agregado `memberDni: z.string().optional()`
  - Schema `reinstatementSummarySchema`: agregado `memberDni: z.string().optional()`
  - 3 paginas de leave: agregado campo "DNI" en la seccion "Datos del socio" con fallback `summary.memberDni ?? 'No disponible'`
- **Accion requerida backend**: `LeaveSummaryResponseDto` y `ReinstatementSummaryResponseDto` deben incluir `memberDni: string` en la respuesta. El campo esta en el aggregate Member (via DNI value object).

## Cambios realizados

| Archivo                                                             | Cambios                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `web/src/features/treasury/fee-plans/pages/fee-plans-list.page.tsx` | Import LinkMemberTypesModal + useFeePlan, disclosure state, handleLink handler, onClick en menu item, render modal |
| `web/src/features/membership/leave/pages/nonpayment-leave.page.tsx` | Import Tooltip, alerta workflow incompleto, boton PDF disabled, boton cancelar disabled, campo DNI                 |
| `web/src/features/membership/leave/pages/voluntary-leave.page.tsx`  | Campo DNI en datos del socio                                                                                       |
| `web/src/features/membership/leave/pages/reinstatement.page.tsx`    | Campo DNI en datos del ex-socio                                                                                    |
| `web/src/features/membership/leave/schemas/member-leave.schemas.ts` | memberDni optional en leaveSummarySchema y reinstatementSummarySchema                                              |

## Tests

- **Total**: 428 tests (37 test files + 1 failing)
- **Passed**: 427
- **Failed**: 1 (pre-existente - `personal-data-step.spec.tsx` fallo de atributo `type="date"` en input, no relacionado con SDD-4)
- **Regressions introducidas**: 0
- **Tiempo**: 9.87s

## Issues blocked (requieren backend)

| Issue | Endpoint requerido                                                       | Descripcion                                                                                                   |
| ----- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| P1-5  | `activeSubscriptionsCount` en FeePlanResponseDto                         | El modal de desactivacion necesita saber cuantas suscripciones activas tiene el plan para mostrar advertencia |
| P1-8  | `POST /v1/members/:id/cancel-nonpayment-leave`                           | Cancelar el proceso de baja por impago y regularizar la deuda, revirtiendo el estado a ACTIVE                 |
| P1-9  | `GET /v1/members/:id/nonpayment-certificate`                             | Generar certificado de descubierto en formato PDF                                                             |
| P1-11 | `memberDni` en LeaveSummaryResponseDto / ReinstatementSummaryResponseDto | El frontend ya muestra el campo con fallback "No disponible", solo falta que el backend lo envie              |

## Riesgos

1. **Backend GetFeePlan no retorna linkedMemberTypes**: El endpoint `GET /v1/treasury/fee-plans/:id` usa `FeePlanResponseDto.fromDomain()` que no mapea vinculaciones. El modal LinkMemberTypes abrira siempre con tabla vacia (sin pre-populacion). Se necesita extender el DTO o crear endpoint separado.

2. **DelinquencyTimeline sin datos reales**: El timeline muestra las 5 fases siempre como "Pendiente". Cuando el backend implemente el tracking de workflow de morosidad, habra que alimentar el componente con datos reales de fechas/completitud.

3. **DNI y datos personales**: El campo DNI es dato personal protegido (RNF-006). Cuando el backend lo incluya en la respuesta, debe verificar que el usuario tiene permisos adecuados y que el dato se transmite de forma segura.
