# Task 5 - UC-024: Gestión de devoluciones SEPA (Backend)

## Información general

- **Fase:** 2
- **Tipo:** Backend
- **UC:** UC-024
- **Bounded Context:** BC-Treasury
- **Application Service:** `SepaRemittanceService`, `CollectionService`
- **Aggregates:** `MemberAccount` (Entity: `Charge`, `SepaMandate`), `SepaRemittance` (Entity: `SepaDebit`)
- **Prioridad:** Must

## Alcance

### Incluido

- Registro manual de devoluciones SEPA con código de motivo estándar ISO 20022
- Clasificación automática por código de motivo (Tabla 9): AC01, AC04, AM04, AG01, MD01, MS02, MS03
- Acciones automáticas por código: revocación de mandato (MS02), bloqueo de reintento (AC01/AC04/MD01), reintento sugerido (AM04)
- Repercusión de gastos bancarios al socio (cargo de penalización via UC-020)
- Programación de reintentos con fecha y notificación previa
- Límite de reintentos automáticos: 3 por cargo (configurable)
- Actualización de estado de cargos: transición a DEVUELTO
- Actualización de estado de adeudos en remesa: `SepaDebit.status = RETURNED`
- Interacción cross-BC con BC-Membership para actualizar estado del socio por morosidad
- Endpoint REST para registro de devolución: `POST /api/v1/tenants/:tenantId/remittances/:id/returns`
- Endpoint REST para programar reintento: `POST /api/v1/tenants/:tenantId/charges/:chargeId/retry`
- Endpoint REST para informe de devoluciones: `GET /api/v1/tenants/:tenantId/remittances/:id/returns/report`
- Domain Events: `PaymentReturned`, `SepaMandateRevoked`, `ChargeMarkedForRetry`
- Contador de reintentos en cargo: `charge.sepaRetryCount`
- Auditoría completa de cada devolución
- Tests unitarios + tests de integración

### Excluido

- Procesamiento automático de ficheros pain.002 de respuesta bancaria (FA-1, diferido post-MVP; en MVP el registro es manual)
- Dashboard de métricas de devoluciones (FA-4, se implementa como parte del frontend)
- Notificaciones automáticas al socio (depende de BC-Communication, fuera del MVP)
- Workflow completo de morosidad (UC-022, fuera del MVP)
- Gestión avanzada de mandatos caducados (proceso batch diario, diferido post-MVP)

## Dependencias

### Tareas previas requeridas

| Tarea                                    | Artefacto necesario                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Fase 2 - UC-023 (Remesas SEPA)**       | Aggregate `SepaRemittance` con entities `SepaDebit`, Entity `SepaMandate`, configuración SEPA |
| **Fase 2 - UC-020 (Cargos manuales)**    | Endpoint de cargo de penalización `POST .../charges/penalty` para repercutir gastos           |
| **Fase 1 - UC-021 (Registro de cobros)** | Aggregate `MemberAccount` con `Charge` y `Payment`, `CollectionService`                       |
| **Fase 1 - UC-007 (Estados del socio)**  | Máquina de estados para transición a morosidad                                                |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/treasury/domain/aggregates/sepa-remittance.ts` existe con entity `SepaDebit`
- [ ] `api/src/treasury/domain/entities/sepa-mandate.ts` existe con métodos `revoke()`, `isExpired()`
- [ ] `api/src/treasury/domain/entities/charge.ts` tiene campo `sepaRetryCount` (añadir si no existe)
- [ ] `api/src/treasury/domain/value-objects/charge-status.ts` incluye estado `RETURNED`
- [ ] El endpoint `POST .../charges/penalty` de UC-020 está implementado
- [ ] `api/src/treasury/domain/ports/member-status.port.ts` existe para notificar cambios de estado a BC-Membership
- [ ] Existe al menos una remesa con adeudos en estado SENT/PROCESSED para pruebas

### Artefactos producidos

| Artefacto                                 | Consumido por                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Endpoint de registro de devolución        | Frontend UC-024                                                                 |
| Endpoint de programación de reintento     | Frontend UC-024                                                                 |
| Informe de devoluciones                   | Frontend UC-024 (descarga PDF/CSV)                                              |
| Cargos en estado DEVUELTO                 | UC-021 (pueden cobrarse por método alternativo), UC-023 (reinclusión en remesa) |
| Cargos de penalización (gastos bancarios) | UC-021 (cobro de gastos)                                                        |
| Evento `PaymentReturned`                  | BC-Membership (marcar morosidad), BC-Communication (notificar)                  |
| Evento `SepaMandateRevoked`               | Auditoría, exclusión de futuras remesas                                         |

## Referencia de especificación

| Documento           | Contenido relevante                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `uc/uc-024.md`      | Flujo completo: registro manual, clasificación por código, reintento, estados                   |
| `us/us-066.md`      | Criterios: registro de devolución, clasificación por motivo, reintento                          |
| `us/us-067.md`      | Criterios: repercusión de gastos, informe de devoluciones                                       |
| `bc/bc-treasury.md` | Entity SepaDebit con returnReason/returnDate. Domain Events PaymentReturned, SepaMandateRevoked |
| `adr/adr-008.md`    | Outbox pattern para Domain Events                                                               |
| `rnft/rnft-025.md`  | Auditoría completa de cambios en pagos                                                          |

## Puntos críticos

1. **Mapeo de códigos SEPA a acciones (Tabla 9).** Cada código de devolución tiene un comportamiento específico. Los códigos AC01, AC04, AG01, MD01 y MS02 no permiten reintento automático. Solo AM04 (fondos insuficientes) permite reintento con recomendación de contacto previo. MS02 (rechazo del deudor) revoca el mandato automáticamente. Implementar como mapa estático con acciones predefinidas.

2. **Revocación automática de mandato por MS02.** Cuando el código es MS02, el sistema debe revocar el mandato inmediatamente (`SepaMandate.status = REVOKED`), excluir al socio de futuras remesas SEPA y sugerir cambio de método de cobro. Esto afecta directamente a UC-023 que consulta mandatos activos al generar remesas.

3. **Contador de reintentos y límite.** Cada cargo tiene `sepaRetryCount` que se incrementa con cada devolución. Al alcanzar el límite (por defecto 3), el sistema suspende reintentos automáticos y crea tarea para el tesorero. El reintento NO crea un nuevo cargo: el mismo cargo con estado DEVUELTO se marca para inclusión en la próxima remesa.

4. **Bloqueo de reintento si no se resolvió el motivo.** Para códigos que requieren acción manual (AC01: IBAN incorrecto), el sistema debe bloquear la inclusión en remesa hasta que se actualice el dato. Ejemplo: si motivo es AC01 y el IBAN no ha cambiado desde la devolución, no permitir reintento (FE-3).

5. **Repercusión de gastos bancarios.** Los gastos de devolución se crean como cargo de penalización (UC-020) vinculado a la devolución. El importe es configurable por tenant (por defecto 3.50€). Puede configurarse: repercutir siempre, nunca, o con periodo de gracia (no en primera devolución).

6. **Transición de estado del socio.** El evento `PaymentReturned` debe consumirlo BC-Membership vía MemberStatusPort. Si un socio acumula 3+ devoluciones en el ejercicio actual, se puede transicionar a estado de morosidad. Esta regla es configurable y se implementa como listener de eventos.

## Riesgos

| Riesgo                                                   | Probabilidad | Impacto | Mitigación                                                                           |
| -------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------ |
| Código SEPA no reconocido                                | Baja         | Medio   | Mapear a MS03 (genérico) por defecto. Log warning para investigar                    |
| Reintento de cargo con IBAN incorrecto genera más gastos | Media        | Alto    | Validar que el motivo anterior se ha resuelto antes de permitir reintento            |
| Mandato revocado por error (MS02 mal clasificado)        | Baja         | Alto    | Permitir reactivación manual de mandato revocado por el Tesorero                     |
| Estado del socio desactualizado tras devolución          | Baja         | Medio   | Event-driven: `PaymentReturned` notifica a BC-Membership. Si falla, retry del evento |

## Plan de implementación

### Paso 1: Capa de dominio - Códigos de devolución SEPA

Crear en `api/src/treasury/domain/value-objects/`:

- **`SepaReturnCode`**: Value Object que encapsula el código de motivo SEPA y su comportamiento
  - Propiedades: `code: string`, `description: string`, `allowRetry: boolean`, `suggestedRetryDays: number | null`, `requiresManualIntervention: boolean`, `autoAction: 'NONE' | 'REVOKE_MANDATE' | 'BLOCK_RETRY'`
  - Factory method `create(code: string): SepaReturnCode` con mapa estático:
    - `AC01` → IBAN incorrecto, no retry, intervención manual, BLOCK_RETRY
    - `AC04` → Cuenta cerrada, no retry, intervención manual, BLOCK_RETRY
    - `AM04` → Fondos insuficientes, retry OK, 15 días sugeridos, intervención recomendada
    - `AG01` → Transacción prohibida, no retry, intervención manual, BLOCK_RETRY
    - `MD01` → Sin mandato válido, no retry, intervención manual, BLOCK_RETRY
    - `MS02` → Rechazo del deudor, no retry, intervención crítica, REVOKE_MANDATE
    - `MS03` → No especificado, retry condicional, 30 días, intervención manual

### Paso 2: Capa de dominio - Ampliación de entities existentes

Ampliar en `api/src/treasury/domain/entities/`:

- **`Charge`** - añadir:
  - `sepaRetryCount: number` (inicializado a 0)
  - `lastReturnCode?: string`
  - `retryScheduledDate?: Date`
  - Método `markAsReturned(returnCode: SepaReturnCode): void` - transiciona a RETURNED, incrementa `sepaRetryCount`, guarda `lastReturnCode`
  - Método `scheduleRetry(date: Date): void` - establece `retryScheduledDate`
  - Método `canRetry(maxRetries: number): boolean` - `sepaRetryCount < maxRetries && returnCode.allowRetry`

- **`SepaDebit`** - añadir:
  - Método `markAsReturned(returnCode: string, returnDate: Date): void` - actualiza `status = RETURNED`, `returnReason`, `returnDate`

### Paso 3: Capa de dominio - Domain Events

Crear en `api/src/treasury/domain/events/`:

- **`PaymentReturnedEvent`**: Payload: `{ chargeId, memberId, amount, returnCode, returnDescription, remittanceId, debitId, bankFees?, retryCount }`
- **`SepaMandateRevokedEvent`**: Payload: `{ mandateId, memberId, reason: 'MS02_DEBTOR_REJECTION', revokedAt }`
- **`ChargeMarkedForRetryEvent`**: Payload: `{ chargeId, memberId, retryNumber, scheduledDate, returnCode }`

### Paso 4: Capa de dominio - Domain Service ReturnProcessor

Crear en `api/src/treasury/domain/services/return-processor.ts`:

- **`ReturnProcessor`**: Domain Service que orquesta la lógica de una devolución
  - `processReturn(debit: SepaDebit, charge: Charge, mandate: SepaMandate, returnCode: SepaReturnCode, bankFees?: Money): ReturnProcessingResult`
    1. Marca `SepaDebit` como devuelto
    2. Marca `Charge` como devuelto
    3. Si `returnCode.autoAction === 'REVOKE_MANDATE'`: revoca mandato
    4. Si `bankFees > 0`: marca para creación de cargo de penalización
    5. Determina si se puede reintentar: `charge.canRetry(maxRetries) && returnCode.allowRetry`
    6. Retorna `ReturnProcessingResult` con acciones a ejecutar

- **`ReturnProcessingResult`**: Value Object con:
  - `mandateRevoked: boolean`
  - `penaltyChargeNeeded: boolean`, `penaltyAmount: Money`
  - `retryAllowed: boolean`, `suggestedRetryDate?: Date`
  - `requiresManualIntervention: boolean`
  - `events: DomainEvent[]` - eventos a publicar

### Paso 5: Capa de dominio - Port para estado de socio

Crear en `api/src/treasury/domain/ports/`:

- **`MemberStatusPort`** (interfaz):
  - `notifyPaymentReturned(memberId: string, returnCount: number): Promise<void>`
  - Implementado como adapter que publica evento para BC-Membership

### Paso 6: Capa de aplicación - Commands y DTOs

Crear en `api/src/treasury/application/`:

- **Commands:**
  - `RecordReturnCommand`: `{ tenantId, remittanceId, debitId, returnCode, returnDate, bankFees?, repercutirGastos: boolean, notifySocio: boolean }`
  - `ScheduleRetryCommand`: `{ tenantId, chargeId, retryDate, notifyBeforeDays? }`
  - `GetReturnReportCommand`: `{ tenantId, remittanceId, format: 'JSON' | 'PDF' | 'CSV' }`

- **DTOs:**
  - `RecordReturnDto`: validación con `class-validator` (`@IsIn(SEPA_RETURN_CODES)` returnCode, `@IsDateString()` returnDate, `@IsOptional() @IsPositive()` bankFees)
  - `ScheduleRetryDto`: `@IsDateString()` retryDate, `@Min(1) @Max(30)` notifyBeforeDays
  - `ReturnResponseDto`: `{ debitId, chargeId, memberId, memberName, returnCode, returnDescription, actions: { mandateRevoked, penaltyCreated, retryAllowed, retryScheduled } }`
  - `ReturnReportDto`: agrupado por código de motivo con totales y acciones sugeridas

### Paso 7: Capa de aplicación - Handlers

Crear en `api/src/treasury/application/commands/`:

- **`RecordReturnHandler`**:
  1. Verificar permisos: `treasury:remittances:manage`
  2. Obtener remesa, debit y cargo asociado
  3. Obtener mandato del socio
  4. Crear `SepaReturnCode.create(returnCode)`
  5. Invocar `ReturnProcessor.processReturn(...)`
  6. Si `result.penaltyChargeNeeded && repercutirGastos`: invocar endpoint de penalización (UC-020)
  7. Si `result.mandateRevoked`: persistir mandato revocado, publicar `SepaMandateRevokedEvent`
  8. Persistir cambios en debit, cargo y mandato
  9. Publicar `PaymentReturnedEvent` vía Outbox
  10. Notificar `MemberStatusPort` si `retryCount >= 3`
  11. Reportar vía `ErrorReporter.captureException()` si hay errores
  12. Retornar `ReturnResponseDto`

- **`ScheduleRetryHandler`**:
  1. Verificar permisos: `treasury:charges:retry`
  2. Obtener cargo en estado DEVUELTO
  3. Verificar que `charge.canRetry(maxRetries)`
  4. Verificar que el motivo de la devolución permite reintento
  5. Si motivo es AC01 y IBAN no ha cambiado: bloquear (FE-3)
  6. Invocar `charge.scheduleRetry(retryDate)`
  7. Publicar `ChargeMarkedForRetryEvent` vía Outbox
  8. Retornar confirmación con fecha programada

- **`GetReturnReportHandler`**:
  1. Obtener remesa con todos los debit marcados como RETURNED
  2. Agrupar por código de motivo
  3. Calcular totales: importe devuelto, gastos bancarios
  4. Para cada grupo: listar socios afectados con acciones sugeridas
  5. Retornar en formato solicitado (JSON/PDF/CSV)

### Paso 8: Capa de infraestructura - Controller

Crear en `api/src/treasury/infrastructure/controllers/`:

- Añadir a **`SepaController`** (existente de UC-023):
  - `POST /api/v1/tenants/:tenantId/remittances/:id/returns` → Registrar devolución
  - `GET /api/v1/tenants/:tenantId/remittances/:id/returns` → Listar devoluciones de remesa
  - `GET /api/v1/tenants/:tenantId/remittances/:id/returns/report` → Descargar informe (PDF/CSV)
  - `POST /api/v1/tenants/:tenantId/charges/:chargeId/retry` → Programar reintento
  - `GET /api/v1/tenants/:tenantId/charges/:chargeId/retry-history` → Historial de reintentos
  - Guards de permisos, Swagger decorators

### Paso 9: Capa de infraestructura - Adapter MemberStatusPort

Crear en `api/src/treasury/infrastructure/adapters/`:

- **`MemberStatusAdapter`**: Implementación del port
  - Publica evento `PaymentReturned` en el bus de eventos
  - BC-Membership consume el evento y evalúa transición de estado del socio
  - Si el listener de BC-Membership no está disponible: el evento se persiste en Outbox para retry

### Paso 10: Tests

**Tests unitarios (dominio):**

- `SepaReturnCode.create('AM04')` → allowRetry true, suggestedDays 15
- `SepaReturnCode.create('MS02')` → autoAction REVOKE_MANDATE
- `SepaReturnCode.create('UNKNOWN')` → fallback a MS03
- `ReturnProcessor.processReturn()` con AM04 → retryAllowed, no revoca mandato
- `ReturnProcessor.processReturn()` con MS02 → mandateRevoked, no retry
- `ReturnProcessor.processReturn()` con gastos bancarios → penaltyChargeNeeded
- `Charge.canRetry()` con 3 reintentos → false
- `Charge.markAsReturned()` → incrementa sepaRetryCount, guarda returnCode

**Tests unitarios (aplicación):**

- `RecordReturnHandler` con AM04 → devolución + sugerencia de reintento
- `RecordReturnHandler` con MS02 → devolución + mandato revocado
- `RecordReturnHandler` con gastos → cargo de penalización creado
- `ScheduleRetryHandler` con cargo AC01 sin cambio de IBAN → bloqueado
- `ScheduleRetryHandler` con cargo AM04 retryCount < 3 → OK

**Tests de integración:**

- Registro de devolución AM04: verificar cargo DEVUELTO, mandato activo, sugerencia de reintento
- Registro de devolución MS02: verificar mandato REVOKED, cargo DEVUELTO, no retry
- Programar reintento: verificar fecha programada, cargo marcado para inclusión en próxima remesa
- Repercusión de gastos: verificar cargo de penalización creado para el socio
- Informe de devoluciones: verificar agrupación por código y totales correctos
- Límite de reintentos: 3 devoluciones del mismo cargo → reintento bloqueado

## Criterios de aceptación

Derivados de US-066, US-067:

1. **Registro de devolución con código SEPA:** Al registrar una devolución con código AM04, el cargo transiciona a DEVUELTO y el sistema sugiere reintento en 15 días.

2. **Revocación automática por MS02:** Al registrar una devolución con código MS02, el mandato del socio se revoca automáticamente y el socio se excluye de futuras remesas.

3. **Repercusión de gastos:** Al marcar "repercutir gastos", se crea un cargo de penalización por el importe configurado (3.50€ por defecto) en la cuenta del socio.

4. **Programación de reintento:** Se puede programar un reintento para un cargo devuelto. El cargo se incluirá automáticamente en la próxima remesa de la fecha programada.

5. **Bloqueo de reintento por motivo no resuelto:** No se permite reintentar un cargo devuelto por AC01 si el IBAN no ha sido actualizado.

6. **Límite de reintentos:** Tras 3 devoluciones del mismo cargo, el sistema suspende reintentos automáticos y notifica al tesorero.

7. **Informe de devoluciones:** Se genera un informe agrupado por código de motivo con totales, socios afectados y acciones sugeridas.
