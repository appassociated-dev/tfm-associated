# Reporte SDD-3: fix/forms-and-validation

## Resumen ejecutivo

Se corrigieron 7 de 9 issues de formularios y validaciones detectados en la auditoria frontend-fase1 y testing manual. Las correcciones incluyen un fix critico de atomicidad transaccional en el backend, proteccion contra errores Prisma expuestos, y mejoras de UX en formularios de alta de socio. 2 issues se postponen justificadamente para post-MVP.

## Issues abordados

### FIXED

| Issue   | Prioridad | Estado | Archivos modificados                                                                                                                                                                                                                           | Descripcion                                                                                                                                                                                                                            |
| ------- | --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-1    | CRITICAL  | FIXED  | `web/src/main.tsx`, `personal-data-step.tsx`, `package.json`                                                                                                                                                                                   | `birthDate` usaba `<TextInput type="date">` nativo. Reemplazado por Mantine `DateInput` de `@mantine/dates` con locale espanol y formato dd/MM/yyyy. Instalados `@mantine/dates` + `dayjs`.                                            |
| P1-2    | CRITICAL  | FIXED  | `simple-registration.page.tsx`, `use-preconditions.ts`, `registration.api.ts`, `member-registration.schemas.ts`                                                                                                                                | Wizard no verificaba precondiciones FE-4 (plan ONE_TIME activo) y FE-5 (ejercicio fiscal activo). Ahora bloquea el wizard con Alert descriptivo si faltan. Usa endpoint existente `GET /v1/members/preconditions`.                     |
| P1-3    | CRITICAL  | FIXED  | `confirmation-step.tsx`, `validate-preconditions.handler.ts`, `preconditions-response.dto.ts`, `member-registration.schemas.ts`                                                                                                                | Paso 3 (Confirmacion) mostraba "Determinada por el plan vigente". Ahora muestra nombre del plan + importe real con `formatMoney()`. Backend ampliado para incluir `registrationPlan` en precondiciones.                                |
| P2-5    | MEDIUM    | FIXED  | `fee-plan.schemas.ts`, `fee-plan.schemas.spec.ts`                                                                                                                                                                                              | `createFeePlanInputSchema` no validaba condicionalmente para RECURRING. Agregados `.refine()` que obligan `frequency` y `billingMonths` solo cuando `type === 'RECURRING'`. Separado schema base para mantener `.partial()` en update. |
| Issue 6 | CRITICAL  | FIXED  | `simple-registration.handler.ts`, `prisma-member.repository.ts`, `member.repository.ts`                                                                                                                                                        | `memberRepository.save(member)` se ejecutaba fuera del `tx` transaccional en `SimpleRegistrationHandler`. Socios huerfanos si fallaba el Charge. Fix: `save()` ahora acepta `tx` opcional; handler pasa `tx` al llamar `save()`.       |
| Issue 7 | HIGH      | FIXED  | `prisma-member.repository.ts`                                                                                                                                                                                                                  | Backend devolvia error Prisma P2002 crudo cuando email duplicado. Ahora `save()` captura P2002 y lanza `EmailAlreadyExistsError` (HTTP 409) o `DocumentAlreadyExistsError` segun el campo afectado.                                    |
| Issue 8 | MEDIUM    | FIXED  | `personal-data-step.tsx`, `registration.api.ts`, `registration.controller.ts`, `membership.module.ts`, `check-email.query.ts`, `check-email.handler.ts`, `email-check-response.dto.ts`, `use-check-email.ts`, `member-registration.schemas.ts` | Endpoint `existsByEmail` existia en repositorio pero wizard no lo consultaba. Creado endpoint `GET /v1/members/check-email/:email`, query CQRS, hook `useCheckEmail` con debounce 500ms. Muestra advertencia (no bloquea alta).        |

### POSTPONED

| Issue | Prioridad | Estado    | Justificacion                                                                                                                                                                                                                                                                                                                                                           |
| ----- | --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-7  | CRITICAL  | POSTPONED | ExemptionModal sin DatePicker para periodo inicio/fin. **Razon**: El backend solo soporta exencion total (cierre de suscripcion con motivo EXEMPTION). No existe logica de exemptions con periodo temporal. Agregar DatePickers sin soporte backend seria misleading para el usuario. Requiere US/UC nueva para exemptions temporales.                                  |
| P1-6  | MEDIUM    | POSTPONED | FeePlanForm usa `@mantine/form` en vez de `react-hook-form + zodResolver`. **Razon**: El formulario funciona correctamente. Migrar a react-hook-form es un refactor que no aporta funcionalidad nueva al MVP. La validacion condicional (P2-5) ya se aplico en el schema Zod que el formulario consume. Se recomienda migrar en fase 2 junto con los demas formularios. |

## Cambios realizados

### Frontend (web/)

| Archivo                                                                       | Cambio                                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                                                | Importar `@mantine/dates/styles.css`, configurar `dayjs` con locale `es` y plugin `customParseFormat`                                                                                       |
| `src/features/membership/registration/components/personal-data-step.tsx`      | Reemplazar `TextInput type="date"` por `DateInput` de Mantine. Agregar hook `useCheckEmail`. Mostrar advertencia de email duplicado. Convertir `birthDate` de string a `Date` internamente. |
| `src/features/membership/registration/pages/simple-registration.page.tsx`     | Agregar `usePreconditions()` hook. Bloquear wizard con Alert si precondiciones fallan. Pasar `registrationPlan` a `ConfirmationStep`.                                                       |
| `src/features/membership/registration/components/confirmation-step.tsx`       | Mostrar nombre e importe real del plan de alta con `formatMoney()`. Aceptar prop `registrationPlan`.                                                                                        |
| `src/features/membership/registration/api/registration.api.ts`                | Agregar funciones `checkEmail()` y `validatePreconditions()`.                                                                                                                               |
| `src/features/membership/registration/schemas/member-registration.schemas.ts` | Agregar schemas: `emailCheckResponseSchema`, `registrationPlanInfoSchema`, `preconditionsResponseSchema`. Exportar tipos correspondientes.                                                  |
| `src/features/membership/registration/hooks/use-check-email.ts`               | **NUEVO**. Hook con debounce 500ms para verificar unicidad de email.                                                                                                                        |
| `src/features/membership/registration/hooks/use-preconditions.ts`             | **NUEVO**. Hook para consultar precondiciones del alta.                                                                                                                                     |
| `src/features/treasury/fee-plans/schemas/fee-plan.schemas.ts`                 | Agregar `.refine()` condicional para RECURRING (frequency + billingMonths obligatorios). Separar schema base para `.partial()`.                                                             |
| `web/package.json`                                                            | Agregar dependencias: `@mantine/dates`, `dayjs`.                                                                                                                                            |

### Backend (api/)

| Archivo                                                                 | Cambio                                                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/membership/domain/repositories/member.repository.ts`               | `save()` ahora acepta parametro `tx?: unknown` opcional.                                                                                    |
| `src/membership/infrastructure/persistence/prisma-member.repository.ts` | `save()` usa `tx` cuando se provee. Captura P2002 y traduce a errores de dominio (`EmailAlreadyExistsError`, `DocumentAlreadyExistsError`). |
| `src/membership/application/commands/simple-registration.handler.ts`    | Pasar `tx` a `memberRepository.save(member, tx)` dentro de la transaccion.                                                                  |
| `src/membership/infrastructure/controllers/registration.controller.ts`  | Agregar endpoint `GET check-email/:email`.                                                                                                  |
| `src/membership/application/queries/check-email.query.ts`               | **NUEVO**. Query CQRS para verificar email.                                                                                                 |
| `src/membership/application/queries/check-email.handler.ts`             | **NUEVO**. Handler que usa `memberRepository.existsByEmail()`.                                                                              |
| `src/membership/application/dtos/email-check-response.dto.ts`           | **NUEVO**. DTO con campo `exists: boolean`.                                                                                                 |
| `src/membership/application/dtos/preconditions-response.dto.ts`         | Agregar campo opcional `registrationPlan` con `feePlanId`, `name`, `amount`.                                                                |
| `src/membership/application/queries/validate-preconditions.handler.ts`  | Incluir datos del plan de alta en la respuesta cuando existe.                                                                               |
| `src/membership/membership.module.ts`                                   | Registrar `CheckEmailHandler`.                                                                                                              |

### Tests actualizados

| Archivo                             | Cambio                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `personal-data-step.spec.tsx`       | Agregar mock de `useCheckEmail`. Actualizar test de fecha: verificar `placeholder="dd/mm/aaaa"` en vez de `type="date"`. |
| `simple-registration.page.spec.tsx` | Agregar mock de `usePreconditions` con datos validos por defecto.                                                        |
| `fee-plan.schemas.spec.ts`          | Tests "sin frequency/billingMonths" ahora verifican rechazo para RECURRING. Agregado test para ONE_TIME sin esos campos. |

## Tests

### API (npx -w api vitest run)

- **Test Files**: 123 passed (123)
- **Tests**: 1227 passed (1227)
- **Duration**: ~13s

### Web (npx -w web vitest run)

- **Test Files**: 38 passed (38)
- **Tests**: 429 passed (429)
- **Duration**: ~10s

**Total: 0 failures across 161 test files and 1656 tests.**

## Issues postponed (con justificacion)

### P1-7: ExemptionModal sin DatePicker para periodo de exencion

- **Categoria**: Feature gap (no bug)
- **Justificacion**: El backend actual solo soporta exencion total (cierre de suscripcion). No existe modelo de dominio para exemptions temporales con fecha inicio/fin. Implementar DatePickers en frontend sin soporte backend crearia una interfaz enganosa.
- **Accion requerida**: Crear US + UC para exemptions temporales en BC-Treasury. Despues agregar campos `startDate`/`endDate` al modelo y endpoint.

### P1-6: FeePlanForm usa @mantine/form en vez de react-hook-form

- **Categoria**: Deuda tecnica (violacion de convencion, no bug)
- **Justificacion**: El formulario funciona correctamente con `@mantine/form`. La validacion condicional (P2-5) se aplico a nivel de schema Zod, que es consumido independientemente del form library. Migrar requiere reescribir el componente y actualizar 2+ test files, con riesgo de regresion y sin beneficio funcional.
- **Accion requerida**: Incluir en SDD de fase 2 junto con migracion general de formularios a react-hook-form + zodResolver.

## Riesgos

1. **@mantine/dates requiere dayjs como peer dependency**: Se instalo `dayjs` como dependencia directa. Si el proyecto ya usaba otra libreria de fechas, podria haber conflictos de bundle. Verificado: no habia ninguna libreria de fechas previa.

2. **Schema `createFeePlanInputSchema` ahora es `ZodEffects` (no `ZodObject`)**: Al agregar `.refine()`, el schema deja de soportar `.partial()` directamente. Se soluciono extrayendo un `createFeePlanInputBaseSchema` (ZodObject) que se usa para `updateFeePlanInputSchema.partial()`. Cualquier codigo que asuma que `createFeePlanInputSchema` es un `ZodObject` necesitara ajuste.

3. **Endpoint `check-email` expone existencia de emails en el tenant**: Esto es informacion sensible. El endpoint requiere permiso `membership:members:read` (RBAC), pero podria usarse para enumeracion de emails por usuarios con ese permiso. Para MVP es aceptable; en produccion considerar rate limiting (RNF-011).
