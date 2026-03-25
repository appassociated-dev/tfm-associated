# Task 5 - UC-007: Gestión de estados del socio (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-007
- **Bounded Context:** BC-Membership
- **Application Service:** `MemberService` (parte de estados)
- **Aggregates:** `Member` (extensión con máquina de estados)
- **Prioridad:** Must

## Alcance

### Incluido

- Extensión del Aggregate `Member` con máquina de estados completa (State Machine)
- Value Object `MemberStatus` con 8 estados: `ACTIVE`, `PENDING_PAYMENT`, `SUSPENDED`, `APPLICANT`, `VOLUNTARY_LEAVE`, `NONPAYMENT_LEAVE`, `DISCIPLINARY_LEAVE`, `DECEASED`
- Matriz de transiciones de estado validada en dominio (Tabla 1 del UC-007)
- Domain Service `StatusTransitionValidator` para validar transiciones permitidas
- Entity `StatusHistory` (inmutable, INSERT-only) con fecha, estado anterior, estado nuevo, motivo, usuario que ejecuta
- Consulta de timeline de historial de estados (FA-1)
- Transiciones manuales por Secretario con motivo obligatorio
- Transiciones automáticas por morosidad via `DelinquencyManager` (proceso planificado)
- Regularización automática desde `PENDING_PAYMENT` → `ACTIVE` al recibir evento `DebtSettled` (FA-2)
- Protección de estados terminales: `VOLUNTARY_LEAVE` y `NONPAYMENT_LEAVE` (requieren rehabilitación UC-013), `DISCIPLINARY_LEAVE` y `DECEASED` (inmutables)
- Domain Events: `MemberStatusChanged`
- Endpoints REST:
  - `POST /api/v1/members/:id/status`
  - `GET /api/v1/members/:id/status-history`
  - `GET /api/v1/members/:id/available-transitions`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Proceso de rehabilitación desde estados terminales (UC-013)
- UI de cambio de estado y timeline (se implementa en task frontend UC-007)
- Alta completa de socio (UC-006); esta task solo gestiona transiciones de estado sobre socios existentes
- Proceso disciplinario completo (UC-021); esta task implementa la transición a `DISCIPLINARY_LEAVE` pero no el expediente
- Integración con BC-Treasury para detectar morosidad real (el `DelinquencyManager` se expone como endpoint/cron para MVP)
- Envío de notificaciones al socio (BC-Communication, consumirá el evento `MemberStatusChanged`)

## Dependencias

### Tareas previas requeridas

| Tarea                       | Artefacto necesario                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold**       | Estructura de módulos NestJS, Shared kernel (AggregateRoot, Entity, ValueObject, DomainEvent), PrismaTenantService, Prisma schemas (main + tenant), Docker Compose con PostgreSQL |
| **F1-Back Task 1 - UC-001** | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados                                                                              |
| **F1-Back Task 2 - UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa, `TenantMiddleware` integrado con JWT                                          |
| **F1-Back Task 3 - UC-008** | Aggregate `MemberType` (dominio), modelo `MemberType` en schema tenant, tipos de socio configurados para asignar a miembros                                                       |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/domain/aggregate-root.base.ts` existe y exporta la clase `AggregateRoot<TId>`
- [ ] `api/src/shared/domain/value-object.base.ts` existe y exporta la clase `ValueObject<TProps>`
- [ ] `api/src/shared/domain/domain-event.base.ts` existe y exporta la clase `DomainEvent`
- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` funciona correctamente
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` funciona correctamente
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] Los endpoints de auth (`/api/v1/auth/*`) funcionan y emiten JWT con claims correctos
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `OutboxEvent`, `MemberType` (de Task 3), `FiscalYear` (de Task 4)
- [ ] Los permisos `membership:members:update-status`, `membership:members:read` existen en los roles seedeados
- [ ] El Aggregate `MemberType` está operativo (tipos creados en BD del tenant)

### Artefactos producidos

| Artefacto                                           | Consumido por                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Aggregate `Member` con máquina de estados (dominio) | UC-006 (alta de socio inicia en APPLICANT/ACTIVE), UC-011 (registro completo de socio), UC-013 (rehabilitación desde baja) |
| Entity `StatusHistory` (dominio)                    | UC-006 (primera entrada al dar de alta), UC-011 (timeline), consultas de auditoría                                         |
| Domain Service `StatusTransitionValidator`          | UC-006 (validar transición APPLICANT → ACTIVE), UC-013 (rehabilitación), UC-021 (sanción → DISCIPLINARY_LEAVE)             |
| `DelinquencyManager` (infraestructura)              | Proceso nocturno de morosidad, BC-Treasury (trigger de detección de impagos)                                               |
| Modelo `StatusHistory` en schema tenant Prisma      | Consultas de historial, auditoría, timeline                                                                                |
| Endpoints REST de estados                           | Frontend UC-007, testing manual                                                                                            |
| Evento `MemberStatusChanged`                        | BC-Treasury (suspender/reactivar cobros), BC-Communication (notificar socio)                                               |

## Referencia de especificación

| Documento             | Contenido relevante                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `uc/uc-007.md`        | Flujo completo de transiciones, Tabla 1 (matriz de transiciones), historial, transiciones automáticas, flujos de excepción                   |
| `us/us-014.md`        | Criterios de aceptación: 8 estados, transición automática por morosidad, transiciones controladas con rechazo                                |
| `bc/bc-membership.md` | Aggregate Member - estructura, comportamientos (changeStatus, deactivate), Value Objects (MemberStatus), Domain Events (MemberStatusChanged) |

## Puntos críticos

1. **Matriz de transiciones como fuente de verdad.** La validación de transiciones debe implementarse en dominio puro, sin dependencia de infraestructura. Codificar la matriz como estructura de datos estática en `StatusTransitionValidator`. Cada transición define: estado origen, estados destino permitidos, y si el estado es terminal. Cualquier transición no explícitamente permitida se rechaza.

2. **Inmutabilidad de StatusHistory.** El historial de estados es INSERT-only. Nunca se actualiza ni se elimina un registro. Implementar como Entity inmutable dentro del Aggregate `Member`. En BD, la tabla `status_history` no debe tener operaciones UPDATE ni DELETE. Considerar trigger o policy para prevenir modificaciones accidentales.

3. **Estados terminales y sus grados.** Hay dos grados de terminales:
   - **Rehabilitables:** `VOLUNTARY_LEAVE` y `NONPAYMENT_LEAVE` no permiten transiciones directas, pero pueden rehabilitarse mediante el proceso formal de UC-013.
   - **Inmutables:** `DISCIPLINARY_LEAVE` y `DECEASED` no permiten ninguna transición bajo ninguna circunstancia. Cualquier intento debe rechazarse con mensaje claro.

4. **DelinquencyManager: transiciones automáticas por morosidad.** El proceso `DelinquencyManager` detecta socios con cuotas vencidas hace más de 90 días y los transiciona a `PENDING_PAYMENT`. En MVP, se implementa como endpoint invocable por cron externo o como módulo `@nestjs/schedule`. No debe bloquear el sistema si falla parcialmente (procesar socio a socio, registrar errores y continuar).

5. **Concurrencia en cambio de estado.** Dos operaciones simultáneas sobre el mismo socio (ej: cambio manual y detección de morosidad) pueden causar inconsistencia. Implementar optimistic locking con campo `version` en el Aggregate `Member`. Si la versión no coincide al guardar, reintentar o rechazar la operación.

## Riesgos

| Riesgo                                                                            | Probabilidad | Impacto | Mitigación                                                                                             |
| --------------------------------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------ |
| `DelinquencyManager` procesa lote grande (>500 socios) y excede timeout           | Media        | Medio   | Procesar en batches de 50. Registrar progreso. Implementar reanudación desde último procesado          |
| Race condition entre cambio manual y automático sobre mismo socio                 | Baja         | Alto    | Optimistic locking con campo `version`. Reintentar automáticamente 1 vez si falla por versión          |
| Historial de estados crece sin límite en tenants con mucha rotación               | Baja         | Bajo    | No paginar en consulta (timeline limitado naturalmente). En futuro: archivado de históricos > 5 años   |
| Evento `MemberStatusChanged` no procesado por BC-Treasury (cobros siguen activos) | Baja         | Alto    | Outbox pattern con reintentos. Monitorizar cola de eventos. Alerta si evento no procesado en 5 minutos |

## Plan de implementación

### Paso 1: Capa de dominio - Value Objects

Crear en `api/src/membership/domain/value-objects/`:

- **`MemberId`**: Extiende `Identifier`. UUID v4. Método factory `create(): MemberId` y `fromString(id: string): MemberId`
- **`MemberStatus`**: Enum VO con valores:
  - `ACTIVE` - plenos derechos
  - `PENDING_PAYMENT` - derechos limitados (sin voto)
  - `SUSPENDED` - sin derechos
  - `APPLICANT` - sin derechos (en proceso de alta)
  - `VOLUNTARY_LEAVE` - terminal rehabilitable
  - `NONPAYMENT_LEAVE` - terminal rehabilitable
  - `DISCIPLINARY_LEAVE` - terminal inmutable
  - `DECEASED` - terminal inmutable
- **`StatusChangeReason`**: Value Object con `reason: string`. Método factory `create(reason: string): Result<StatusChangeReason, ReasonRequiredError>`. Invariante: no vacío, mínimo 3 caracteres, máximo 500 caracteres

Tests unitarios: enumeración completa de `MemberStatus`, validación de `StatusChangeReason` (válido, vacío, demasiado corto, demasiado largo).

### Paso 2: Capa de dominio - Entity StatusHistory

Crear en `api/src/membership/domain/entities/status-history.ts`:

- Propiedades (todas readonly, inmutables):
  - `id: string` (UUID)
  - `memberId: MemberId`
  - `previousStatus: MemberStatus`
  - `newStatus: MemberStatus`
  - `reason: StatusChangeReason`
  - `changedBy: string` (userId del usuario que ejecutó el cambio, o `SYSTEM` para automáticos)
  - `changedAt: Date`
- Método factory `StatusHistory.create(props)`: crea instancia inmutable. No hay métodos de modificación
- Invariantes:
  - Todos los campos son requeridos
  - `previousStatus !== newStatus`
  - `changedAt <= now()`

Tests unitarios: creación válida, rechazo si `previousStatus === newStatus`, inmutabilidad (no hay setters).

### Paso 3: Capa de dominio - Domain Service StatusTransitionValidator

Crear en `api/src/membership/domain/services/status-transition-validator.ts`:

- **Matriz de transiciones** (constante estática):
  ```
  ACTIVE → [PENDING_PAYMENT, SUSPENDED, VOLUNTARY_LEAVE]
  PENDING_PAYMENT → [ACTIVE, SUSPENDED, NONPAYMENT_LEAVE]
  SUSPENDED → [ACTIVE, DISCIPLINARY_LEAVE]
  APPLICANT → [ACTIVE, VOLUNTARY_LEAVE]
  VOLUNTARY_LEAVE → [] (terminal rehabilitable)
  NONPAYMENT_LEAVE → [] (terminal rehabilitable)
  DISCIPLINARY_LEAVE → [] (terminal inmutable)
  DECEASED → [] (terminal inmutable)
  ```
- Métodos:
  - `validate(currentStatus: MemberStatus, targetStatus: MemberStatus): Result<void, TransitionNotAllowedError>`: verifica si la transición está en la matriz. Si no → error con mensaje descriptivo incluyendo alternativas
  - `getAvailableTransitions(currentStatus: MemberStatus): MemberStatus[]`: retorna los estados destino permitidos desde el estado actual
  - `isTerminal(status: MemberStatus): boolean`: retorna true si el estado no tiene transiciones posibles
  - `isImmutable(status: MemberStatus): boolean`: retorna true si es `DISCIPLINARY_LEAVE` o `DECEASED` (ni siquiera rehabilitación)

Tests unitarios (sin mocks, dominio puro):

- Todas las transiciones válidas de la matriz → aceptadas
- Transiciones inválidas (ej: `ACTIVE → DECEASED` sin pasar por suspensión) → rechazadas
- Transiciones desde terminales → rechazadas con mensaje apropiado
- `getAvailableTransitions(ACTIVE)` → retorna 3 estados
- `getAvailableTransitions(DECEASED)` → retorna array vacío
- `isTerminal` y `isImmutable` correctos para cada estado

### Paso 4: Capa de dominio - Extensión del Aggregate Member

Crear/extender en `api/src/membership/domain/aggregates/member.ts`:

- Propiedades añadidas:
  - `currentStatus: MemberStatus`
  - `statusHistory: StatusHistory[]`
  - `version: number` (para optimistic locking)
- Métodos de negocio:
  - `changeStatus(newStatus: MemberStatus, reason: StatusChangeReason, changedBy: string, transitionValidator: StatusTransitionValidator): Result<void, TransitionNotAllowedError>`:
    1. Delega validación a `transitionValidator.validate(currentStatus, newStatus)`
    2. Si válido: actualiza `currentStatus`, crea `StatusHistory` entry, incrementa `version`, registra evento `MemberStatusChanged`
    3. Si inválido: retorna error
  - `getStatusHistory(): ReadonlyArray<StatusHistory>`: retorna historial inmutable
  - `getCurrentStatus(): MemberStatus`: retorna estado actual
  - `isActive(): boolean`: `currentStatus === ACTIVE`
  - `isInGoodStanding(): boolean`: `currentStatus === ACTIVE || currentStatus === APPLICANT`
- Invariantes:
  - `currentStatus` siempre refleja el último estado del historial
  - El historial es append-only (nunca se modifica ni elimina)
  - Los cambios de estado solo se ejecutan via `changeStatus()` (encapsulación)

Tests unitarios:

- Transición `ACTIVE → PENDING_PAYMENT` → estado actualizado, historial con nueva entrada, evento emitido
- Transición `ACTIVE → DECEASED` → rechazada (no está en la matriz)
- Transición desde `DECEASED` → rechazada (inmutable)
- Transición desde `VOLUNTARY_LEAVE` → rechazada (terminal, requiere rehabilitación)
- Múltiples transiciones secuenciales → historial acumula todas las entradas en orden
- Optimistic locking: versión incrementada en cada cambio

### Paso 5: Capa de dominio - Domain Events

Crear en `api/src/membership/domain/events/`:

- **`MemberStatusChangedEvent`**: Extiende `DomainEvent`. Payload: `{ memberId: UUID, previousStatus: string, newStatus: string, reason: string, changedBy: string, changedAt: Date }`

### Paso 6: Capa de dominio - Repository interfaces

Crear/extender en `api/src/membership/domain/repositories/`:

- **`MemberRepository`** (interfaz, extendida):
  - `findById(id: MemberId): Promise<Member | null>`
  - `save(member: Member): Promise<void>` (con optimistic locking: rechazar si versión no coincide)
  - `findByStatus(status: MemberStatus): Promise<Member[]>`
  - `findActiveMembers(): Promise<Member[]>`
  - `findMembersWithOverduePayments(daysOverdue: number): Promise<Member[]>` (para DelinquencyManager)

- **`StatusHistoryRepository`** (interfaz):
  - `save(entry: StatusHistory): Promise<void>`
  - `findByMemberId(memberId: MemberId): Promise<StatusHistory[]>` (ordenado por `changedAt` DESC)

### Paso 7: Capa de aplicación - Commands, Queries y DTOs

Crear en `api/src/membership/application/`:

**Commands:**

- **`ChangeStatusCommand`**: `{ memberId, newStatus, reason, changedBy }`
- **`RunDelinquencyCheckCommand`**: `{ daysOverdue: number }` (por defecto 90)

**Queries:**

- **`GetStatusHistoryQuery`**: `{ memberId }`
- **`GetAvailableTransitionsQuery`**: `{ memberId }`

**DTOs:**

- **`ChangeStatusDto`**: DTO de entrada: `@IsEnum(MemberStatus)` para newStatus, `@IsNotEmpty()` `@MinLength(3)` `@MaxLength(500)` para reason
- **`StatusHistoryEntryDto`**: DTO de salida: `id`, `previousStatus`, `newStatus`, `reason`, `changedBy`, `changedAt`
- **`StatusHistoryResponseDto`**: DTO de salida: `memberId`, `currentStatus`, `entries: StatusHistoryEntryDto[]`
- **`AvailableTransitionsDto`**: DTO de salida: `memberId`, `currentStatus`, `availableTransitions: Array<{ status: string, description: string }>`
- **`DelinquencyCheckResultDto`**: DTO de salida: `processedCount`, `transitionedCount`, `errors: Array<{ memberId, error }>`

### Paso 8: Capa de aplicación - Handlers

**`ChangeStatusHandler`:**

1. Buscar socio por ID (`memberRepository.findById(memberId)`)
2. Si no existe → error 404
3. Crear `StatusChangeReason` desde el motivo proporcionado
4. Ejecutar `member.changeStatus(newStatus, reason, changedBy, statusTransitionValidator)`
5. Si transición rechazada → error 422 con mensaje descriptivo y transiciones disponibles
6. Guardar via `memberRepository.save(member)` (con optimistic locking)
7. Guardar `StatusHistory` entry via `statusHistoryRepository.save(entry)`
8. Publicar `MemberStatusChanged` via Outbox
9. Retornar confirmación con nuevo estado

**En caso de fallo de optimistic locking:**

- Reintentar 1 vez (recargar aggregate, re-ejecutar transición)
- Si falla de nuevo → error 409 "El socio fue modificado concurrentemente, intente de nuevo"
- Reportar vía `ErrorReporter.captureException()` si falla en el reintento

**`RunDelinquencyCheckHandler`:**

1. Obtener socios con pagos vencidos hace > `daysOverdue` días (`memberRepository.findMembersWithOverduePayments(daysOverdue)`)
2. Filtrar solo socios en estado `ACTIVE` (solo los activos pueden pasar a `PENDING_PAYMENT`)
3. Para cada socio (en batches de 50):
   - Ejecutar `member.changeStatus(PENDING_PAYMENT, reason, 'SYSTEM', statusTransitionValidator)`
   - Guardar via `memberRepository.save(member)`
   - Guardar `StatusHistory` entry
   - Publicar `MemberStatusChanged` via Outbox
   - Si falla un socio individual: registrar error, continuar con el siguiente
4. Retornar `DelinquencyCheckResultDto` con resumen

**`GetStatusHistoryHandler`:**

1. Buscar socio por ID (verificar existencia)
2. Obtener historial via `statusHistoryRepository.findByMemberId(memberId)`
3. Retornar `StatusHistoryResponseDto` con entries ordenadas cronológicamente (DESC)

**`GetAvailableTransitionsHandler`:**

1. Buscar socio por ID
2. Obtener transiciones disponibles via `statusTransitionValidator.getAvailableTransitions(member.currentStatus)`
3. Retornar `AvailableTransitionsDto`

### Paso 9: Capa de infraestructura - Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model StatusHistory {
  id              String    @id @default(uuid()) @db.Uuid
  member_id       String    @db.Uuid
  previous_status String    @db.VarChar(30)
  new_status      String    @db.VarChar(30)
  reason          String    @db.VarChar(500)
  changed_by      String    @db.VarChar(100)
  changed_at      DateTime  @default(now())

  @@index([member_id])
  @@index([member_id, changed_at(sort: Desc)])
  @@map("status_history")
}
```

Nota: También extender el modelo `Member` (cuando exista, se creará en UC-006) con:

- `current_status String @default("APPLICANT") @db.VarChar(30)`
- `version Int @default(0)`

Para esta task, si el modelo `Member` aún no existe en el schema, crear un modelo mínimo para soportar la funcionalidad de estados:

```prisma
model Member {
  id             String    @id @default(uuid()) @db.Uuid
  member_type_id String    @db.Uuid
  current_status String    @default("APPLICANT") @db.VarChar(30)
  version        Int       @default(0)
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  memberType     MemberType @relation(fields: [member_type_id], references: [id])

  @@map("members")
}
```

### Paso 10: Capa de infraestructura - Repository (Prisma)

Crear en `api/src/membership/infrastructure/persistence/`:

- **`PrismaMemberRepository`** (parcial, extensible en UC-006): Implementa `MemberRepository` usando `PrismaTenantService.getClient(tenantId)`. Incluye optimistic locking: en `save()`, ejecutar `UPDATE ... WHERE id = ? AND version = ?`. Si `updatedRows === 0` → lanzar `OptimisticLockingError`
- **`PrismaStatusHistoryRepository`**: Implementa `StatusHistoryRepository` usando `PrismaTenantService.getClient(tenantId)`. Solo operaciones INSERT y SELECT (nunca UPDATE/DELETE)
- Mappers: `MemberPrismaMapper`, `StatusHistoryPrismaMapper` (toDomain / toPersistence)
- La conexión se obtiene del tenant activo en el request (vía `PrismaTenantService`)

### Paso 11: Capa de infraestructura - DelinquencyManager

Crear en `api/src/membership/infrastructure/services/delinquency-manager.ts`:

- **`DelinquencyManager`**: Servicio de infraestructura que encapsula la detección y procesamiento de morosidad
- Utiliza `@nestjs/schedule` con `@Cron('0 2 * * *')` para ejecución nocturna (2:00 AM) - configurable
- Alternativamente, expuesto como endpoint para invocación manual en testing
- Flujo: obtener socios morosos → filtrar activos → cambiar estado en batch → reportar resultados
- Tolerancia a fallos: si un socio falla, se registra el error y se continúa con el siguiente
- Reportar excepciones individuales vía `ErrorReporter.captureException()`

### Paso 12: Capa de infraestructura - Controller

Crear en `api/src/membership/infrastructure/controllers/member-status.controller.ts`:

| Endpoint                                    | Método | Auth | Permiso                            | Body/Params                | Response                                                     |
| ------------------------------------------- | ------ | ---- | ---------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `/api/v1/members/:id/status`                | POST   | JWT  | `membership:members:update-status` | `ChangeStatusDto`          | 200 con `{ memberId, previousStatus, newStatus, changedAt }` |
| `/api/v1/members/:id/status-history`        | GET    | JWT  | `membership:members:read`          | Param: `id`                | 200 con `StatusHistoryResponseDto`                           |
| `/api/v1/members/:id/available-transitions` | GET    | JWT  | `membership:members:read`          | Param: `id`                | 200 con `AvailableTransitionsDto`                            |
| `/api/v1/members/delinquency-check`         | POST   | JWT  | `membership:members:update-status` | `{ daysOverdue?: number }` | 200 con `DelinquencyCheckResultDto`                          |

- Swagger decorators para documentación automática
- Errores: 404 Not Found (socio no encontrado), 422 Unprocessable Entity (transición no permitida), 409 Conflict (concurrencia - optimistic locking)

### Paso 13: Tests

**Tests unitarios (dominio):**

- `StatusTransitionValidator.validate()`: todas las transiciones válidas de la matriz aceptadas
- `StatusTransitionValidator.validate()`: transiciones inválidas rechazadas (ej: `ACTIVE → DECEASED`, `VOLUNTARY_LEAVE → ACTIVE`)
- `StatusTransitionValidator.getAvailableTransitions()`: retorna estados correctos para cada origen
- `StatusTransitionValidator.isTerminal()`: correcto para cada estado
- `StatusTransitionValidator.isImmutable()`: `DISCIPLINARY_LEAVE` y `DECEASED` son inmutables, `VOLUNTARY_LEAVE` y `NONPAYMENT_LEAVE` no son inmutables (son terminales pero rehabilitables)
- `StatusHistory.create()`: creación válida
- `StatusHistory.create()`: rechazo si estados iguales
- `Member.changeStatus()`: transición `ACTIVE → PENDING_PAYMENT` → estado actualizado, historial con nueva entrada, evento emitido, versión incrementada
- `Member.changeStatus()`: transición inválida → rechazada sin modificar estado ni historial
- `Member.changeStatus()`: desde estado terminal → rechazada
- `Member.changeStatus()`: múltiples transiciones secuenciales → historial acumula correctamente
- `MemberStatus`: enumeración de los 8 estados
- `StatusChangeReason.create()`: validación (válido, vacío, demasiado corto)

**Tests unitarios (aplicación):**

- `ChangeStatusHandler` con mocks de `MemberRepository` y `StatusHistoryRepository`:
  - Caso éxito: transición válida ejecutada, historial guardado, evento publicado
  - Caso socio no encontrado: 404
  - Caso transición no permitida: 422 con transiciones disponibles
  - Caso optimistic locking fail + reintento exitoso
  - Caso motivo vacío: error de validación
- `RunDelinquencyCheckHandler`:
  - Caso con 3 socios morosos activos: todos transicionados
  - Caso con socio moroso ya en `PENDING_PAYMENT`: skip sin error
  - Caso con fallo en 1 socio: continúa con los demás, reporta error
  - Caso sin socios morosos: resultado vacío
- `GetStatusHistoryHandler`:
  - Caso con historial: retorna entries ordenadas
  - Caso sin historial: retorna array vacío
- `GetAvailableTransitionsHandler`:
  - Caso `ACTIVE`: retorna 3 transiciones
  - Caso `DECEASED`: retorna array vacío

**Tests de integración:**

- Cambio de estado contra BD real (Testcontainers):
  - Crear socio (mínimo) → cambiar estado `APPLICANT → ACTIVE` → verificar persistencia
  - Verificar que `StatusHistory` se crea correctamente
  - Intentar transición inválida → verificar rechazo
  - Intentar transición desde `DECEASED` → verificar bloqueo total
- Optimistic locking:
  - Modificar socio desde dos transacciones simultáneas → verificar que una falla con error de versión
- DelinquencyManager:
  - Crear socios con pagos vencidos → ejecutar check → verificar transiciones
  - Verificar que eventos `MemberStatusChanged` se registran en outbox
- Timeline de historial:
  - Ejecutar 5 cambios de estado secuenciales → consultar historial → verificar orden y completitud
  - Verificar que no se pueden eliminar ni modificar entradas de historial

## Criterios de aceptación

Derivados de US-014:

1. **8 estados disponibles (US-014, escenario 1):** El sistema gestiona los estados Activo, PendientePago, Suspendido, BajaVoluntaria, BajaImpago, BajaDisciplinaria, Aspirante y Fallecido, cada uno con derechos específicos (plenos, limitados, sin derechos, ninguno).

2. **Transición automática por morosidad (US-014, escenario 2):** Un socio activo con cuota impagada hace 90 dias pasa automáticamente a estado PendientePago. Se registra en el historial con fecha, motivo "Impago > 90 dias" y usuario "Sistema". Se emite evento `MemberStatusChanged`.

3. **Transiciones controladas (US-014, escenario 3):** Un socio en estado BajaVoluntaria no puede cambiar directamente a Activo. El sistema rechaza la transición e indica que debe usar el proceso de Rehabilitación (UC-013).

4. **Motivo obligatorio en cambio de estado:** Todo cambio de estado requiere un motivo descriptivo (mínimo 3 caracteres). Sin motivo, el sistema bloquea la operación.

5. **Historial inmutable:** El historial de cambios de estado es INSERT-only. Cada entrada registra fecha, estado anterior, estado nuevo, motivo y usuario. No se permite modificar ni eliminar entradas históricas.

6. **Consulta de timeline:** El secretario puede consultar el historial completo de estados de un socio, ordenado cronológicamente, mostrando todas las transiciones con sus motivos y responsables.

7. **Estados terminales inmutables:** Un socio en estado `DECEASED` o `DISCIPLINARY_LEAVE` no puede cambiar de estado bajo ninguna circunstancia. El sistema rechaza cualquier intento.

8. **Estados terminales rehabilitables:** Un socio en estado `VOLUNTARY_LEAVE` o `NONPAYMENT_LEAVE` no permite transición directa pero puede rehabilitarse mediante el proceso formal de UC-013.

9. **Transiciones disponibles visibles:** Al consultar un socio, el sistema muestra las transiciones de estado permitidas desde el estado actual, facilitando la operación al secretario.
