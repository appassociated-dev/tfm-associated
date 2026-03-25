# Task 2 - UC-020: Gestión de cargos manuales (Backend)

## Información general

- **Fase:** 2
- **Tipo:** Backend
- **UC:** UC-020
- **Bounded Context:** BC-Treasury
- **Application Service:** `ChargeGenerationService`
- **Aggregates:** `MemberAccount`, `Charge` (Entity)
- **Prioridad:** Must

## Alcance

### Incluido

- Extensión del Application Service `ChargeGenerationService` con operaciones de cargos manuales (individuales y masivos)
- Entity `Charge` con `isManual = true` y `subscriptionId = null` para distinguir de cargos periódicos
- Endpoint REST para cargo manual individual: `POST /api/v1/tenants/:tenantId/charges/manual`
- Endpoint REST para cargo masivo (derramas): `POST /api/v1/tenants/:tenantId/charges/bulk`
- Endpoint REST para cargo de penalización por devolución SEPA: `POST /api/v1/tenants/:tenantId/charges/penalty`
- Filtro de destinatarios para cargos masivos: todos los socios activos, por tipo de socio, por filtro personalizado
- Preview antes de confirmación masiva con conteo y total estimado
- Procesamiento por lotes (50-100 cargos por transacción) para cargos masivos
- Procesamiento asíncrono con Bull Queue para cargos masivos >500 destinatarios
- Domain Events: `ChargeGenerated` (con `isManual = true`)
- Cross-BC: `MemberQueryPort` para consulta de socios activos en cargos masivos
- Tests unitarios (dominio) + tests de integración (creación individual y masiva)

### Excluido

- Frontend de cargos manuales (se implementa como task-4-UC-020 en frontend de Fase 2)
- Cargos programados con fecha futura (FA-4 diferido post-MVP)
- Workflow de aprobación de Junta Directiva para derramas (solo registro de metadata)
- Descuentos individuales en cargos manuales (FA-3 diferido post-MVP)
- Notificación automática a socios por cada cargo creado (depende de BC-Communication, fuera del MVP)

## Dependencias

### Tareas previas requeridas

| Tarea                                      | Artefacto necesario                                                 |
| ------------------------------------------ | ------------------------------------------------------------------- |
| **Fase 0 - Scaffold**                      | Estructura de módulos NestJS, Shared kernel, Bull Queue configurado |
| **Fase 1 - UC-001 (Provisión de tenant)**  | Tenant provisionado con BD aislada                                  |
| **Fase 1 - UC-011 (Alta simple de socio)** | Socios registrados con `MemberAccount` creada                       |
| **Fase 1 - UC-019 (Cargos periódicos)**    | Aggregate `MemberAccount` con entity `Charge` ya implementada       |
| **Fase 1 - UC-008 (Tipos de socio)**       | `MemberType` configurados (para filtro por tipo en cargos masivos)  |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/treasury/domain/aggregates/member-account.ts` existe con entity `Charge`
- [ ] `api/src/treasury/domain/entities/charge.ts` existe con propiedades `isManual`, `subscriptionId`
- [ ] `api/src/treasury/domain/value-objects/money.ts` existe y opera en centavos (enteros)
- [ ] `api/src/treasury/domain/events/charge-generated.event.ts` existe
- [ ] `api/src/treasury/application/services/charge-generation.service.ts` existe (de UC-019)
- [ ] `api/src/treasury/domain/ports/member-query.port.ts` existe para consultar socios desde BC-Membership
- [ ] Bull Queue está configurado en el módulo de Treasury para procesamiento asíncrono
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `MemberAccount`, `Charge` con campo `is_manual`

### Artefactos producidos

| Artefacto                                             | Consumido por                                      |
| ----------------------------------------------------- | -------------------------------------------------- |
| Endpoint `POST .../charges/manual` (cargo individual) | Frontend UC-020, testing manual                    |
| Endpoint `POST .../charges/bulk` (cargo masivo)       | Frontend UC-020 (pantalla de derramas)             |
| Endpoint `POST .../charges/penalty` (penalización)    | UC-024 (devoluciones SEPA, para repercutir gastos) |
| Cargos manuales en estado PENDING                     | UC-021 (registro de cobros), UC-023 (remesas SEPA) |
| Evento `ChargeGenerated` con `isManual = true`        | BC-Communication (notificaciones), auditoría       |

## Referencia de especificación

| Documento           | Contenido relevante                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `uc/uc-020.md`      | Flujo completo: cargo individual, cargo masivo, penalización SEPA                                 |
| `us/us-051.md`      | Criterios de aceptación: creación de cargos manuales individuales y masivos                       |
| `bc/bc-treasury.md` | Aggregates MemberAccount, Charge - estructura e invariantes. Domain Service ManualChargeGenerator |
| `adr/adr-009.md`    | Clean Architecture / Hexagonal: ports & adapters                                                  |
| `adr/adr-008.md`    | Outbox pattern para Domain Events                                                                 |
| `rnft/rnft-015.md`  | Performance: creación masiva de 1000 cargos en <10 segundos                                       |

## Puntos críticos

1. **Distinción entre cargos manuales y periódicos.** Los cargos manuales tienen `isManual = true` y `subscriptionId = null`. No participan en la generación automática mensual (UC-019). Esta distinción es fundamental para consultas, informes y el propio proceso de generación periódica que debe excluirlos.

2. **Procesamiento por lotes en cargos masivos.** Para cargos masivos (derramas), se procesan en lotes de 50-100 cargos por transacción para evitar bloqueos largos de BD. Si >5% de los cargos fallan, se ejecuta rollback del lote completo (FE-4). El procesamiento debe ser idempotente para permitir reintentos.

3. **Procesamiento asíncrono para volúmenes grandes.** Si el número de destinatarios supera 500, el procesamiento se delega a Bull Queue. El sistema devuelve un `jobId` y el frontend puede consultar el progreso. Esto evita timeouts en la petición HTTP.

4. **Preview antes de confirmación masiva.** Antes de ejecutar un cargo masivo, el sistema debe ofrecer un endpoint de preview que devuelva: conteo de destinatarios, importe total estimado, y lista paginada de socios afectados. La confirmación es un paso separado.

5. **Importe en centavos.** Todos los importes se almacenan como enteros en centavos (Money VO). El importe del cargo manual debe ser > 0 (FE-1). La conversión decimal→centavos se realiza en la capa de aplicación al recibir el DTO.

6. **Cargo de penalización vinculado a devolución.** El cargo de penalización (Parte 3 del UC) tiene un campo adicional `returnId` que lo vincula a la devolución SEPA que lo originó. Esto permite trazabilidad completa en informes y auditoría.

## Riesgos

| Riesgo                                               | Probabilidad | Impacto | Mitigación                                                                                                                       |
| ---------------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Timeout en cargos masivos con muchos destinatarios   | Media        | Alto    | Bull Queue para >500 destinatarios. Timeout HTTP de 30s para lotes menores                                                       |
| Rollback parcial en procesamiento por lotes          | Baja         | Alto    | Transacciones por lote. Si falla un lote, rollback completo. Log detallado de cada lote                                          |
| Duplicación accidental de cargos manuales            | Media        | Medio   | El sistema NO valida duplicados en cargos manuales (FE-5, por diseño). Documentar claramente que es responsabilidad del tesorero |
| Cross-BC lento al consultar socios para cargo masivo | Baja         | Medio   | `MemberQueryPort` con consulta paginada. Caché de conteo de socios activos por tipo                                              |

## Plan de implementación

### Paso 1: Capa de dominio - Domain Service ManualChargeGenerator

Crear en `api/src/treasury/domain/services/manual-charge-generator.ts`:

- **`ManualChargeGenerator`**: Domain Service que encapsula la lógica de creación de cargos manuales
  - `createManualCharge(memberAccount: MemberAccount, chargeData: ManualChargeData): Charge`
    - Crea entity `Charge` con `isManual = true`, `subscriptionId = null`
    - Valida que `amount > 0` y `dueDate >= issueDate`
    - Registra evento `ChargeGenerated` en el aggregate `MemberAccount`
  - `createPenaltyCharge(memberAccount: MemberAccount, returnId: string, bankFees: Money): Charge`
    - Crea cargo de penalización vinculado a devolución SEPA
    - Concepto pre-definido: "Gastos devolución SEPA"
    - `dueDate` = inmediato (fecha actual)

### Paso 2: Capa de dominio - Value Objects y tipos

Crear/ampliar en `api/src/treasury/domain/value-objects/`:

- **`ManualChargeData`**: Value Object con `concept: string`, `description?: string`, `amount: Money`, `issueDate: Date`, `dueDate: Date`
- **`BulkChargeFilter`**: Value Object con `targetType: 'ALL' | 'BY_MEMBER_TYPE' | 'CUSTOM'`, `memberTypeId?: string`, `customFilters?: { status?, minSeniority?, maxBalance? }`
- **`BulkChargeResult`**: Value Object con `totalCreated: number`, `totalAmount: Money`, `errors: BulkChargeError[]`

### Paso 3: Capa de dominio - Port para consulta de socios

Ampliar en `api/src/treasury/domain/ports/member-query.port.ts`:

- Añadir método `findActiveMembers(filter: BulkChargeFilter): Promise<{ memberId: string, memberAccountId: string }[]>`
- Añadir método `countActiveMembers(filter: BulkChargeFilter): Promise<number>`

### Paso 4: Capa de aplicación - Commands y DTOs

Crear en `api/src/treasury/application/`:

- **Commands:**
  - `CreateManualChargeCommand`: `{ tenantId, memberAccountId, concept, description?, amount, issueDate, dueDate }`
  - `CreateBulkChargesCommand`: `{ tenantId, filter: BulkChargeFilter, concept, description?, amount, dueDate, approvalReference? }`
  - `PreviewBulkChargesCommand`: `{ tenantId, filter: BulkChargeFilter, amount }`
  - `CreatePenaltyChargeCommand`: `{ tenantId, memberAccountId, returnId, bankFees }`

- **DTOs:**
  - `CreateManualChargeDto`: validación con `class-validator` (`@IsNotEmpty()` concept, `@IsPositive()` amount, `@IsDateString()` dueDate)
  - `CreateBulkChargesDto`: incluye filtros y datos del cargo
  - `BulkChargePreviewDto`: response con `{ totalRecipients, totalAmount, recipients: PaginatedList }`
  - `BulkChargeResultDto`: response con `{ totalCreated, totalAmount, jobId? }`

### Paso 5: Capa de aplicación - Handlers

Crear en `api/src/treasury/application/commands/`:

- **`CreateManualChargeHandler`**:
  1. Verificar permisos: `treasury:charges:create`
  2. Obtener `MemberAccount` del socio
  3. Convertir importe decimal a centavos (`Math.round(amount * 100)`)
  4. Invocar `ManualChargeGenerator.createManualCharge(...)`
  5. Persistir cargo y publicar evento `ChargeGenerated` vía Outbox
  6. Retornar `ChargeResponseDto`

- **`CreateBulkChargesHandler`**:
  1. Verificar permisos: `treasury:charges:create_bulk` (solo Tesorero/Presidente)
  2. Consultar socios vía `MemberQueryPort.findActiveMembers(filter)`
  3. Si `count > 500`: encolar en Bull Queue y retornar `jobId`
  4. Si `count <= 500`: procesar síncrono por lotes de 50
  5. Para cada lote:
     - Iniciar transacción
     - Crear cargos con `ManualChargeGenerator.createManualCharge(...)` para cada socio
     - Si >5% fallan en un lote: rollback del lote completo
     - Commit si OK
  6. Registrar metadata de aprobación si se proporciona `approvalReference`
  7. Publicar eventos `ChargeGenerated` por cada cargo creado vía Outbox
  8. Reportar errores vía `ErrorReporter.captureException()`
  9. Retornar `BulkChargeResultDto`

- **`PreviewBulkChargesHandler`**:
  1. Consultar conteo vía `MemberQueryPort.countActiveMembers(filter)`
  2. Consultar lista paginada de socios afectados
  3. Calcular importe total: `count * amount`
  4. Retornar `BulkChargePreviewDto`

- **`CreatePenaltyChargeHandler`**:
  1. Verificar permisos: `treasury:charges:create`
  2. Obtener `MemberAccount` del socio
  3. Invocar `ManualChargeGenerator.createPenaltyCharge(...)`
  4. Persistir y publicar evento `ChargeGenerated` con metadata de penalización

### Paso 6: Capa de infraestructura - Bull Queue Processor

Crear en `api/src/treasury/infrastructure/jobs/`:

- **`BulkChargeProcessor`**: Worker de Bull Queue para procesamiento asíncrono
  - Recibe `CreateBulkChargesCommand` como payload del job
  - Procesa en lotes de 50 con la misma lógica que el handler síncrono
  - Actualiza progreso del job: `job.progress(processedCount / totalCount * 100)`
  - Al finalizar, emite resultado vía WebSocket o almacena en BD para consulta

### Paso 7: Capa de infraestructura - Adapter de MemberQueryPort

Ampliar en `api/src/treasury/infrastructure/adapters/`:

- **`MemberQueryAdapter`**: Implementación del port para consulta cross-BC
  - Usa `PrismaTenantService` para consultar tabla `members` directamente (mismo schema de tenant)
  - Aplica filtros: estado activo, tipo de socio, antigüedad, saldo pendiente
  - Retorna lista de `{ memberId, memberAccountId }`

### Paso 8: Capa de infraestructura - Controller

Crear en `api/src/treasury/infrastructure/controllers/`:

- **`ManualChargesController`**:
  - `POST /api/v1/tenants/:tenantId/charges/manual` → Crear cargo individual
  - `POST /api/v1/tenants/:tenantId/charges/bulk/preview` → Preview de cargo masivo
  - `POST /api/v1/tenants/:tenantId/charges/bulk` → Crear cargos masivos
  - `POST /api/v1/tenants/:tenantId/charges/penalty` → Crear cargo de penalización
  - `GET /api/v1/tenants/:tenantId/charges/bulk/jobs/:jobId` → Estado de job asíncrono
  - Protegidos con `@RequirePermissions('treasury:charges:create')`
  - Swagger decorators para documentación automática
  - Responses: 201 Created, 202 Accepted (async job), 400 Bad Request, 404 Not Found

### Paso 9: Tests

**Tests unitarios (dominio):**

- `ManualChargeGenerator.createManualCharge()` con datos válidos → cargo creado con `isManual = true`
- `ManualChargeGenerator.createManualCharge()` con importe 0 → error de validación
- `ManualChargeGenerator.createPenaltyCharge()` → cargo vinculado a devolución
- `BulkChargeFilter` → validación de filtros

**Tests unitarios (aplicación):**

- `CreateManualChargeHandler` con mock de repositorio → flujo completo
- `CreateBulkChargesHandler` con mock de `MemberQueryPort` → procesamiento por lotes
- `CreateBulkChargesHandler` con >500 destinatarios → delegación a Bull Queue
- `PreviewBulkChargesHandler` → cálculo correcto de totales

**Tests de integración:**

- Creación de cargo manual individual, verificar estado PENDING en BD
- Creación de cargo masivo para 100 socios, verificar todos los cargos creados
- Preview de cargo masivo, verificar conteo y total correctos
- Cargo de penalización, verificar vinculación con devolución
- Procesamiento por lotes con fallo simulado: verificar rollback del lote

## Criterios de aceptación

Derivados de US-051:

1. **Cargo manual individual creado correctamente:** Al crear un cargo manual con concepto, importe y vencimiento, el cargo aparece en la cuenta del socio en estado PENDING con `isManual = true`.

2. **Cargo masivo crea cargos para todos los destinatarios:** Al ejecutar un cargo masivo para "todos los socios activos" con importe de 75€, se crean tantos cargos individuales como socios activos con mandato o sin él, cada uno por 75€.

3. **Preview muestra información correcta:** Antes de confirmar un cargo masivo, el sistema muestra el número de destinatarios, el importe total y permite cancelar.

4. **Filtro por tipo de socio funciona:** Al seleccionar "Socios de tipo Numerario" como destinatarios, solo se crean cargos para socios de ese tipo.

5. **Cargo de penalización vinculado a devolución:** Al repercutir gastos bancarios de una devolución SEPA, se crea un cargo manual con referencia a la devolución original.

6. **Error de procesamiento genera rollback:** Si >5% de los cargos fallan en un lote, el sistema revierte el lote completo y reporta el error.
