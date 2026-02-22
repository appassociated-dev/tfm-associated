# Task 8 — UC-013: Baja de socio (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-013
- **Bounded Context:** BC-Membership
- **Application Service:** `MemberDeactivationService`
- **Aggregates:** `Member`
- **Prioridad:** Must

## Alcance

### Incluido

- Application Service `MemberDeactivationService` con flujos: baja voluntaria, baja por impago, rehabilitación
- Baja voluntaria con fecha efectiva configurable según estatutos del tenant (Tabla 4: inmediata, fin de ejercicio, fin de mes siguiente, preaviso N días)
- Baja por impago tras completar workflow de morosidad (simplificado para MVP: ejecución manual por tesorero)
- Resumen de impacto financiero pre-baja: suscripciones activas a cerrar, cargos pendientes, deuda total
- Cierre automático de suscripciones activas con `cancelReason = MEMBER_LEAVE`
- Rehabilitación de ex-socios con cálculo de deuda + penalización + nueva inscripción
- Opción de mantener antigüedad según configuración del tenant (`keepSeniorityOnRehabilitation`)
- Cancelación de baja por regularización (pago de deuda antes del plazo)
- Domain Events: `MemberDeactivated`, `MemberReinstated`
- Puerto `SubscriptionQueryPort` para consultar suscripciones activas y cargos pendientes de BC-Treasury
- Endpoints REST:
  - `GET /api/v1/members/:id/leave-summary`
  - `POST /api/v1/members/:id/voluntary-leave`
  - `POST /api/v1/members/:id/nonpayment-leave`
  - `POST /api/v1/members/:id/reinstate`
  - `GET /api/v1/members/:id/available-transitions`
  - `GET /api/v1/members/:id/status-history`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Baja disciplinaria con expediente completo (US-034, simplificada para MVP: solo cambio de estado manual)
- Workflow automatizado de morosidad (UC-022, Fase 2)
- Generación de certificado de descubierto en PDF (Fase 2)
- Cancelación automática de inscripciones en eventos (BC-Events, post-MVP)
- Notificaciones al socio por email (BC-Communication, consumidor de eventos)
- Firma digital en certificados (PKCS#7, post-MVP)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel, PrismaTenantService, Prisma schemas, Docker Compose con PostgreSQL |
| **F1-Back Task 1 — UC-001** | Tenant provisionado con BD aislada, schema tenant migrado |
| **F1-Back Task 2 — UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa |
| **F1-Back Task 5 — UC-007** | Aggregate `Member` con máquina de estados (`MemberStatus`, `StatusHistory`, `StatusTransitionValidator`), métodos `changeStatus()`, states ACTIVE, VOLUNTARY_LEAVE, NONPAYMENT_LEAVE |
| **F1-Back Task 7 — UC-011** | Flujo de alta implementado, Member con ficha completa, endpoint de alta operativo (para tener socios sobre los que ejecutar baja) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` funciona correctamente
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` funciona correctamente
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `api/src/membership/domain/aggregates/member.ts` existe con máquina de estados completa (Task 5) y ficha (Task 6)
- [ ] `api/src/membership/domain/value-objects/member-status.ts` incluye estados VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE
- [ ] `api/src/membership/domain/services/status-transition-validator.ts` valida transiciones a estados de baja
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `Member`, `StatusHistory`, `MemberAccount`, `FeeSubscription`, `Charge`
- [ ] Existen socios en estado ACTIVE en BD del tenant (creados via alta simple)
- [ ] Los permisos `membership:members:deactivate`, `membership:members:reinstate`, `membership:members:read` existen en los roles seedeados

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| `MemberDeactivationService` (application) | Frontend UC-013, endpoints de baja/rehabilitación |
| Endpoints REST de baja y rehabilitación | Frontend UC-013 |
| Endpoint `GET /api/v1/members/:id/leave-summary` | Frontend UC-013 (resumen de impacto antes de confirmar) |
| Endpoint `GET /api/v1/members/:id/available-transitions` | Frontend UC-013 (mostrar acciones disponibles) |
| Endpoint `GET /api/v1/members/:id/status-history` | Frontend UC-013 (timeline de historial) |
| Puerto `SubscriptionQueryPort` | Reutilizable por otras operaciones que consulten estado financiero |
| Evento `MemberDeactivated` | BC-Treasury (detener generación de cargos), BC-Communication (notificar baja) |
| Evento `MemberReinstated` | BC-Treasury (reactivar cuenta), BC-Communication (email bienvenida) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-013.md` | Flujo completo: baja voluntaria, por impago, disciplinaria, rehabilitación, Tabla 4 de fórmulas de fecha efectiva |
| `us/us-032.md` | Criterios de aceptación Gherkin: baja voluntaria con fecha según estatutos, registro en historial |
| `us/us-033.md` | Criterios de aceptación Gherkin: workflow de baja por impago, certificado de descubierto, regularización |
| `us/us-035.md` | Criterios de aceptación Gherkin: rehabilitación con pago de deuda, mantenimiento de antigüedad |
| `bc/bc-membership.md` | Aggregate Member (deactivate, changeStatus), MemberStatus enum, StatusTransitionValidator |
| `uc/uc-007.md` | Máquina de estados completa, transiciones permitidas, estados terminales |

## Puntos críticos

1. **Fecha efectiva según configuración de estatutos (Tabla 4).** El cálculo de la fecha efectiva de baja voluntaria depende de la configuración del tenant. Implementar `EffectiveDateCalculator` como domain service con las 4 fórmulas: (a) inmediata: `requestDate`, (b) fin de ejercicio: `31/12 del año`, (c) fin de mes siguiente: `último día de (mes+1)`, (d) preaviso N días: `requestDate + N días`. La configuración del tenant define cuáles están disponibles. La fecha efectiva determina hasta cuándo se generan cargos.

2. **Cierre de suscripciones cross-BC.** Al ejecutar la baja, las suscripciones activas del socio deben cerrarse con `cancelReason = MEMBER_LEAVE`. Dado que las suscripciones están en BC-Treasury, usar `SubscriptionQueryPort` para consultar y cerrar. Como ambos BCs comparten la misma BD por tenant, las operaciones se ejecutan dentro de la misma transacción Prisma.

3. **Resumen de impacto financiero.** El endpoint `leave-summary` debe retornar toda la información necesaria para que el frontend muestre las consecuencias de la baja: suscripciones activas que se cerrarán (nombre plan, importe), cargos pendientes que se mantienen como deuda (descripción, importe, fecha vencimiento), y deuda total. Esta información se obtiene consultando BC-Treasury via `SubscriptionQueryPort`.

4. **Rehabilitación con desglose de costes.** El proceso de rehabilitación requiere cálculo de: deuda pendiente (cargos en PENDING), penalización (configurable por tenant, ej: 10% de la deuda), nueva inscripción (si aplica según estatutos). El pago debe ser completo (FE-3). La antigüedad se mantiene o reinicia según configuración `keepSeniorityOnRehabilitation`.

5. **Validación de transiciones via máquina de estados.** Toda baja debe pasar por `StatusTransitionValidator` de Task 5. Solo se puede dar de baja a un socio en estado ACTIVE o SUSPENDED. Solo se puede rehabilitar un socio en estado VOLUNTARY_LEAVE o NONPAYMENT_LEAVE. El endpoint `available-transitions` expone las transiciones permitidas para el estado actual.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Baja ejecutada sin que el secretario vea el impacto financiero | Baja | Alto | El frontend DEBE consultar `leave-summary` antes de permitir baja. El backend valida que la request incluye acknowledgement del impacto |
| Cargos pendientes no detectados al dar de baja (BC-Treasury con datos inconsistentes) | Baja | Medio | `leave-summary` consulta directamente la BD del tenant, no depende de APIs. Si falla, retornar error descriptivo (FE-2) |
| Rehabilitación sin pago completo (race condition: pago parcial mientras se procesa) | Baja | Alto | Verificar deuda en el momento de la rehabilitación dentro de la transacción. Si el importe no coincide, rechazar |
| Fecha efectiva calculada incorrectamente (ejercicio no natural) | Media | Medio | Para MVP, asumir ejercicio natural (enero-diciembre). Documentar limitación. Incluir tests con fechas límite |

## Plan de implementación

### Paso 1: Capa de dominio — Domain Service EffectiveDateCalculator

Crear en `api/src/membership/domain/services/`:

- **`EffectiveDateCalculator`**: Domain Service para calcular fecha efectiva de baja
  - `calculateEffectiveDate(requestDate: Date, config: EffectiveDateConfig): Date`:
    - `IMMEDIATE`: retorna `requestDate`
    - `END_OF_FISCAL_YEAR`: retorna `new Date(requestDate.getFullYear(), 11, 31)` (31/12 del año)
    - `END_OF_NEXT_MONTH`: retorna último día del mes siguiente a `requestDate`
    - `NOTICE_PERIOD`: retorna `requestDate + noticeDays`
  - `getAvailableOptions(tenantConfig: TenantLeaveConfig, requestDate: Date): EffectiveDateOption[]`: retorna las opciones disponibles con fecha calculada y label descriptivo

Tests unitarios: cálculo para cada configuración, fecha límite (31/12), mes siguiente con distintos meses (febrero, diciembre → enero siguiente), preaviso cruzando año.

### Paso 2: Capa de dominio — Extensión del Aggregate Member

Extender en `api/src/membership/domain/aggregates/member.ts`:

- Métodos de negocio añadidos:
  - `processLeave(leaveType: LeaveType, effectiveDate: Date, reason: string): void`: cambia estado via `changeStatus()`, establece `leaveDate = effectiveDate`, registra en StatusHistory, emite evento `MemberDeactivated`
  - `reinstate(reinstatementDate: Date, keepSeniority: boolean): void`: cambia estado de baja a ACTIVE, registra en StatusHistory, emite evento `MemberReinstated`. Si `keepSeniority = true`, mantiene `registrationDate` original; si no, actualiza `registrationDate` a `reinstatementDate`
  - `canLeave(): boolean`: delega a `StatusTransitionValidator` para verificar si el estado actual permite baja
  - `canReinstate(): boolean`: verifica si estado es VOLUNTARY_LEAVE o NONPAYMENT_LEAVE

Tipos de baja:
- `VOLUNTARY_LEAVE`: socio solicita baja
- `NONPAYMENT_LEAVE`: baja por impago tras workflow de morosidad
- `DISCIPLINARY_LEAVE`: baja disciplinaria (simplificado para MVP)

Tests unitarios: baja voluntaria desde ACTIVE, baja por impago desde SUSPENDED, rechazo de baja desde estado terminal, rehabilitación desde VOLUNTARY_LEAVE, rehabilitación desde NONPAYMENT_LEAVE, rechazo de rehabilitación desde DISCIPLINARY_LEAVE.

### Paso 3: Capa de dominio — Domain Events

Crear en `api/src/membership/domain/events/`:

- **`MemberDeactivatedEvent`**: Extiende `DomainEvent`. Payload: `{ memberId: UUID, memberNumber: string, leaveType: string, effectiveDate: Date, reason: string, pendingDebt: number }`
- **`MemberReinstatedEvent`**: Extiende `DomainEvent`. Payload: `{ memberId: UUID, memberNumber: string, previousLeaveType: string, reinstatementDate: Date, debtPaid: number, seniorityRecovered: boolean }`

### Paso 4: Capa de dominio — Ports cross-BC

Crear en `api/src/membership/domain/ports/`:

- **`SubscriptionQueryPort`** (interfaz):
  - `getActiveSubscriptions(tenantId: string, memberId: string): Promise<SubscriptionSummary[]>`
  - `getPendingCharges(tenantId: string, memberId: string): Promise<PendingChargeSummary[]>`
  - `getTotalPendingDebt(tenantId: string, memberId: string): Promise<number>` (centavos)
  - `closeSubscriptions(tenantId: string, memberId: string, cancelReason: string): Promise<number>` (retorna count cerradas)
  - `markChargesAsPaid(tenantId: string, memberId: string, chargeIds: string[]): Promise<void>`

### Paso 5: Capa de aplicación — Commands, Queries y DTOs

Crear en `api/src/membership/application/`:

**Commands:**
- **`ProcessVoluntaryLeaveCommand`**: `{ memberId, effectiveDateType: string, reason: string }`
- **`ProcessNonpaymentLeaveCommand`**: `{ memberId }`
- **`ReinstateMemberCommand`**: `{ memberId, paymentConfirmed: boolean }`

**Queries:**
- **`GetLeaveSummaryQuery`**: `{ memberId }`
- **`GetAvailableTransitionsQuery`**: `{ memberId }`
- **`GetStatusHistoryQuery`**: `{ memberId }`

**DTOs:**
- **`VoluntaryLeaveDto`**: DTO de entrada: `@IsEnum(EffectiveDateType)` effectiveDateType, `@IsNotEmpty()` `@MinLength(3)` `@MaxLength(500)` reason
- **`ReinstateMemberDto`**: DTO de entrada: `@IsBoolean()` paymentConfirmed (debe ser true)
- **`LeaveSummaryResponseDto`**: DTO de salida: `memberId`, `memberName`, `memberNumber`, `currentStatus`, `availableLeaveTypes`, `effectiveDateOptions[]`, `activeSubscriptions[]`, `pendingCharges[]`, `totalPendingDebt`
- **`LeaveResponseDto`**: DTO de salida: `memberId`, `previousStatus`, `newStatus`, `effectiveDate`, `subscriptionsClosed`, `pendingChargesAmount`
- **`ReinstatementSummaryResponseDto`**: DTO de salida: `memberId`, `memberName`, `memberNumber`, `leaveDate`, `leaveType`, `pendingDebt`, `penalty`, `newRegistrationFee`, `totalToPay`, `keepSeniority`, `previousSeniorityMonths`
- **`ReinstatementResponseDto`**: DTO de salida: `memberId`, `newStatus`, `debtPaid`, `seniorityRecovered`, `registrationDate`
- **`AvailableTransitionsResponseDto`**: DTO de salida: `memberId`, `currentStatus`, `availableTransitions: Array<{ status, description }>`
- **`StatusHistoryResponseDto`**: DTO de salida: `memberId`, `currentStatus`, `entries: Array<{ id, previousStatus, newStatus, reason, changedBy, changedAt }>`

### Paso 6: Capa de aplicación — Handlers

**`ProcessVoluntaryLeaveHandler`:**

1. Buscar socio por ID (`memberRepository.findById(memberId)`)
   - Si no existe → error 404
2. Verificar que el socio puede darse de baja (`member.canLeave()`)
   - Si no → error 422 "No se puede procesar baja desde el estado actual '{status}'"
3. Calcular fecha efectiva via `EffectiveDateCalculator.calculateEffectiveDate(now(), config)`
4. Obtener resumen financiero via `SubscriptionQueryPort`:
   - Suscripciones activas a cerrar
   - Deuda total pendiente
5. **Iniciar transacción Prisma:**
   a. Ejecutar `member.processLeave(VOLUNTARY_LEAVE, effectiveDate, reason)`
   b. Guardar Member via `memberRepository.save(member)` (con optimistic locking)
   c. Cerrar suscripciones activas via `subscriptionQueryPort.closeSubscriptions(tenantId, memberId, 'MEMBER_LEAVE')`
   d. Registrar evento `MemberDeactivated` en Outbox
   e. Commit de transacción
6. Retornar `LeaveResponseDto`

**En caso de fallo:**
- Rollback automático de transacción
- Reportar excepción vía `ErrorReporter.captureException()`

**`ProcessNonpaymentLeaveHandler`:**

1. Buscar socio por ID
2. Verificar que el socio está en estado que permite baja por impago (ACTIVE o SUSPENDED)
3. Verificar que tiene deuda pendiente (al menos 1 cargo PENDING)
4. **Iniciar transacción:**
   a. Ejecutar `member.processLeave(NONPAYMENT_LEAVE, now(), 'Baja por impago')`
   b. Guardar Member
   c. Cerrar suscripciones activas
   d. Registrar evento `MemberDeactivated` en Outbox
   e. Commit
5. Retornar `LeaveResponseDto`

**`GetLeaveSummaryHandler`:**

1. Buscar socio por ID
2. Obtener suscripciones activas via `SubscriptionQueryPort.getActiveSubscriptions()`
3. Obtener cargos pendientes via `SubscriptionQueryPort.getPendingCharges()`
4. Calcular deuda total
5. Obtener opciones de fecha efectiva según configuración del tenant
6. Retornar `LeaveSummaryResponseDto`

**`ReinstateMemberHandler`:**

1. Buscar socio por ID
2. Verificar que `canReinstate()` es true
   - Si no → error 422 "No se puede rehabilitar desde el estado actual"
3. Verificar que `paymentConfirmed = true` (FE-3)
4. Obtener resumen de rehabilitación: deuda + penalización + inscripción = total
5. **Iniciar transacción:**
   a. Marcar cargos pendientes como pagados via `subscriptionQueryPort.markChargesAsPaid()`
   b. Ejecutar `member.reinstate(now(), config.keepSeniority)`
   c. Guardar Member
   d. Registrar evento `MemberReinstated` en Outbox
   e. Commit
6. Retornar `ReinstatementResponseDto`

### Paso 7: Capa de infraestructura — Port Adapter para BC-Treasury

Crear en `api/src/membership/infrastructure/ports/`:

- **`PrismaSubscriptionQueryAdapter`**: Implementa `SubscriptionQueryPort`. Consulta directamente las tablas de BC-Treasury (`fee_subscriptions`, `charges`, `member_accounts`) via `PrismaTenantService.getClient(tenantId)`. NO importa repositorios de BC-Treasury.

### Paso 8: Capa de infraestructura — Controller

Crear en `api/src/membership/infrastructure/controllers/member-leave.controller.ts`:

| Endpoint | Método | Auth | Permiso | Body/Params | Response |
|----------|--------|------|---------|-------------|----------|
| `/api/v1/members/:id/leave-summary` | GET | JWT | `membership:members:read` | Param: `id` | 200 con `LeaveSummaryResponseDto` |
| `/api/v1/members/:id/voluntary-leave` | POST | JWT | `membership:members:deactivate` | `VoluntaryLeaveDto` | 200 con `LeaveResponseDto` |
| `/api/v1/members/:id/nonpayment-leave` | POST | JWT | `membership:members:deactivate` | — | 200 con `LeaveResponseDto` |
| `/api/v1/members/:id/reinstatement-summary` | GET | JWT | `membership:members:read` | Param: `id` | 200 con `ReinstatementSummaryResponseDto` |
| `/api/v1/members/:id/reinstate` | POST | JWT | `membership:members:reinstate` | `ReinstateMemberDto` | 200 con `ReinstatementResponseDto` |
| `/api/v1/members/:id/available-transitions` | GET | JWT | `membership:members:read` | Param: `id` | 200 con `AvailableTransitionsResponseDto` |
| `/api/v1/members/:id/status-history` | GET | JWT | `membership:members:read` | Param: `id` | 200 con `StatusHistoryResponseDto` |

- Swagger decorators para documentación automática
- Errores: 404 Not Found (socio no encontrado), 422 Unprocessable Entity (transición no permitida, pago no confirmado)

### Paso 9: Tests

**Tests unitarios (dominio):**
- `EffectiveDateCalculator`:
  - `IMMEDIATE` con fecha 15/07 → 15/07
  - `END_OF_FISCAL_YEAR` con fecha 15/07 → 31/12
  - `END_OF_NEXT_MONTH` con fecha 15/01 → 28/02 (o 29/02 en bisiesto)
  - `END_OF_NEXT_MONTH` con fecha 15/12 → 31/01 del año siguiente
  - `NOTICE_PERIOD` 30 días con fecha 15/12 → 14/01 del año siguiente
- `Member.processLeave()`:
  - Baja voluntaria desde ACTIVE → estado VOLUNTARY_LEAVE, evento emitido, leaveDate establecida
  - Baja por impago desde SUSPENDED → estado NONPAYMENT_LEAVE, evento emitido
  - Rechazo de baja desde VOLUNTARY_LEAVE → error (ya dado de baja)
  - Rechazo de baja desde DECEASED → error (estado terminal inmutable)
- `Member.reinstate()`:
  - Rehabilitación desde VOLUNTARY_LEAVE → ACTIVE, evento emitido
  - Rehabilitación desde NONPAYMENT_LEAVE → ACTIVE, evento emitido
  - Rehabilitación con keepSeniority=true → registrationDate mantiene original
  - Rehabilitación con keepSeniority=false → registrationDate actualizada
  - Rechazo de rehabilitación desde DISCIPLINARY_LEAVE → error
  - Rechazo de rehabilitación desde ACTIVE → error (ya activo)

**Tests unitarios (aplicación):**
- `ProcessVoluntaryLeaveHandler` con mocks:
  - Caso éxito: baja procesada, suscripciones cerradas, evento publicado
  - Caso socio no encontrado: 404
  - Caso estado no permite baja: 422
  - Caso con deuda pendiente: baja procesada, deuda se mantiene
- `ProcessNonpaymentLeaveHandler`:
  - Caso éxito: baja por impago procesada
  - Caso socio sin deuda: error (requisito de impago)
- `GetLeaveSummaryHandler`:
  - Caso con suscripciones y cargos: resumen completo con deuda total
  - Caso sin suscripciones: resumen vacío
- `ReinstateMemberHandler`:
  - Caso éxito: rehabilitación procesada, deuda marcada como pagada, estado ACTIVE
  - Caso sin confirmación de pago: error (FE-3)
  - Caso estado no rehabilitable: 422

**Tests de integración:**
- Baja voluntaria completa contra BD real (Testcontainers):
  - Crear socio activo → procesar baja voluntaria → verificar estado VOLUNTARY_LEAVE
  - Verificar suscripciones cerradas con cancelReason MEMBER_LEAVE
  - Verificar cargos pendientes se mantienen (no eliminados)
  - Verificar evento `MemberDeactivated` en outbox
  - Verificar StatusHistory tiene entrada de baja
- Rehabilitación completa:
  - Dar de baja socio → rehabilitar → verificar estado ACTIVE
  - Verificar cargos marcados como pagados
  - Verificar antigüedad según configuración
  - Verificar evento `MemberReinstated` en outbox
- Validaciones:
  - Intentar baja de socio ya dado de baja → rechazo 422
  - Intentar rehabilitar socio activo → rechazo 422
  - Intentar rehabilitar sin confirmar pago → rechazo 422
- Leave summary:
  - Socio con suscripción activa y 2 cargos pendientes → resumen correcto con deuda total

## Criterios de aceptación

Derivados de US-032, US-033, US-035:

1. **Baja voluntaria con fecha efectiva (US-032, escenario 1):** Al procesar una baja voluntaria, la fecha efectiva se calcula según la configuración del tenant (inmediata, fin de ejercicio, o preaviso). Las suscripciones se cierran con motivo MEMBER_LEAVE y los cargos pendientes se mantienen como deuda.

2. **Resumen de impacto pre-baja (US-032):** El endpoint `leave-summary` retorna suscripciones activas a cerrar, cargos pendientes con importes, deuda total y opciones de fecha efectiva disponibles. El frontend debe consultar este endpoint antes de ejecutar la baja.

3. **Baja por impago (US-033, escenario 1):** El tesorero puede ejecutar baja por impago para socios con deuda. El estado cambia a NONPAYMENT_LEAVE y las suscripciones se cierran. Los cargos pendientes se mantienen.

4. **Oportunidad de regularización (US-033, escenario 3):** Si el socio regulariza la deuda, se puede cancelar el proceso de baja y el socio vuelve a ACTIVE.

5. **Rehabilitación con pago completo (US-035, escenario 1):** Un ex-socio dado de baja puede rehabilitarse. El endpoint retorna desglose de deuda + penalización + inscripción. El pago debe ser completo; pagos parciales se rechazan (FE-3).

6. **Rehabilitación con antigüedad (US-035, escenario 2):** Según configuración del tenant, la rehabilitación puede mantener la antigüedad original o reiniciarla desde la fecha de rehabilitación.

7. **Validación de transiciones (UC-007):** Solo se permite baja desde estados ACTIVE o SUSPENDED. Solo se permite rehabilitación desde VOLUNTARY_LEAVE o NONPAYMENT_LEAVE. Otras transiciones se rechazan con mensaje descriptivo.

8. **Historial de estados:** El endpoint `status-history` retorna todas las transiciones de estado del socio con fecha, estado anterior, estado nuevo, motivo y quién ejecutó el cambio.

9. **Eventos emitidos:** `MemberDeactivated` se emite al dar de baja (consumido por BC-Treasury para detener generación de cargos). `MemberReinstated` se emite al rehabilitar (consumido por BC-Treasury para reactivar cuenta).
