# Task 11 - UC-019: Generación masiva de cargos periódicos (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-019
- **Bounded Context:** BC-Treasury
- **Application Service:** `ChargeGenerationService`
- **Aggregates:** `MemberAccount` (extensión con Entity `Charge`), `FeePlan`
- **Prioridad:** Must

## Alcance

### Incluido

- Entity `Charge` dentro del Aggregate `MemberAccount` con Value Objects (`Money`, `ChargeStatus`, `ChargeDescription`)
- Application Service `ChargeGenerationService` con flujos: generación mensual automática, generación retroactiva manual, prorrateo en altas a mitad de ejercicio
- Proceso mensual automático via `@nestjs/schedule` (cron job día 1 a las 02:00 AM) - US-047
- Evaluación de `billingMonths` del plan: solo genera cargo si el mes actual está en la lista
- Prevención de duplicados: constraint UNIQUE `(subscription_id, billing_month, billing_year)` - FE-4
- Prorrateo automático para altas a mitad de ejercicio (US-048): solo meses >= mes de alta
- Prorrateo de plan anual: cálculo proporcional `(annualAmount / 12) * remainingMonths`
- Puerto `FiscalYearQueryPort` para consultar ejercicio activo de BC-Membership
- Puerto `MemberQueryPort` (reutilizado de Task 10) para verificar estado del socio
- Suspensión de generación para socios en estado Suspendido o PendientePago (FA-5)
- Configuración de fecha de vencimiento: por defecto último día del mes (FA-2)
- Domain Events: `ChargeGenerated`, `MonthlyGenerationCompleted`
- Endpoints REST:
  - `POST /api/v1/treasury/charges/generate-monthly`
  - `GET /api/v1/treasury/charges/generation-log`
  - `POST /api/v1/treasury/member-accounts/:accountId/charges/generate-subscription`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Registro de cobros sobre los cargos generados (UC-021)
- Cargos manuales sin suscripción (UC-020, Fase 2)
- UI de visualización de cargos (se implementa en task frontend UC-019, Fase 2)
- Generación de remesas SEPA (UC-023, Fase 2)
- Cargos anticipados con días de anticipación (FA-3, simplificado para MVP)
- Notificaciones al socio de cargos generados (BC-Communication)

## Dependencias

### Tareas previas requeridas

| Tarea                        | Artefacto necesario                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold**        | Estructura de módulos NestJS, Shared kernel, PrismaTenantService, Prisma schemas, Docker Compose con PostgreSQL, `@nestjs/schedule` configurado |
| **F1-Back Task 1 - UC-001**  | Tenant provisionado con BD aislada, schema tenant migrado                                                                                       |
| **F1-Back Task 2 - UC-002**  | `JwtAuthGuard`, `PermissionsGuard`, autenticación operativa                                                                                     |
| **F1-Back Task 4 - UC-010**  | Aggregate `FiscalYear` operativo, ejercicio abierto para contextualizar cargos, evento `FiscalYearOpened`                                       |
| **F1-Back Task 9 - UC-017**  | Aggregate `FeePlan` con `billingMonths` y `amount`, Value Object `Money`                                                                        |
| **F1-Back Task 10 - UC-018** | Aggregate `MemberAccount` con Entity `FeeSubscription`, suscripciones activas creadas, `MemberQueryPort`                                        |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `api/src/treasury/domain/value-objects/money.ts` existe y exporta `Money` con operaciones en centavos
- [ ] `api/src/treasury/domain/aggregates/member-account.ts` existe con `FeeSubscription` entity
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `FeePlan`, `FeeSubscription`, `MemberAccount`, `FiscalYear`
- [ ] Existen suscripciones activas vinculadas a planes con `billingMonths` configurados
- [ ] Existe al menos un ejercicio en estado `OPEN` en BD del tenant
- [ ] `api/src/treasury/domain/ports/member-query.port.ts` existe (de Task 10)
- [ ] Los permisos `treasury:charges:create`, `treasury:charges:read` existen en los roles seedeados
- [ ] `@nestjs/schedule` está instalado y configurado en el módulo de Treasury

### Artefactos producidos

| Artefacto                                          | Consumido por                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Entity `Charge` (dominio, dentro de MemberAccount) | UC-021 (registrar pagos sobre cargos), UC-023 (incluir cargos en remesas SEPA) |
| Modelo `Charge` en schema tenant Prisma            | UC-021, UC-023, UC-024, todos los UCs de cobros                                |
| Domain Service `ProrataCalculator`                 | Reutilizable en UC-018 para estimar cargos al cambiar plan                     |
| Cron job `ChargeGenerationCron`                    | Ejecución automática mensual, endpoint manual para retroactivos                |
| Puerto `FiscalYearQueryPort`                       | Reutilizable por UC-021 para contextualizar pagos dentro del ejercicio         |
| Endpoints REST de cargos                           | Frontend UC-019 (Fase 2), testing manual                                       |
| Evento `ChargeGenerated`                           | BC-Communication (aviso de cargo al socio)                                     |
| Evento `MonthlyGenerationCompleted`                | Auditoría, alertas al tesorero                                                 |

## Referencia de especificación

| Documento           | Contenido relevante                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `uc/uc-019.md`      | Flujo completo de generación masiva, prorrateo, prevención de duplicados, ejecución manual retroactiva  |
| `us/us-047.md`      | Criterios de aceptación Gherkin: proceso mensual, prevención duplicados, generación retroactiva         |
| `us/us-048.md`      | Criterios de aceptación Gherkin: prorrateo para altas a mitad de ejercicio (mensual, trimestral, anual) |
| `bc/bc-treasury.md` | Entity Charge - estructura, propiedades, invariantes, ChargeStatus, relación con suscripción            |
| `bc/bc-treasury.md` | Domain Service ChargeGenerator, ProrataCalculator                                                       |
| `adr/adr-002.md`    | Multi-tenant por BD aislada: cada cron procesa cada tenant                                              |
| `adr/adr-008.md`    | Outbox pattern para Domain Events                                                                       |

## Puntos críticos

1. **Idempotencia del proceso de generación.** El proceso debe ser idempotente: si se ejecuta múltiples veces para el mismo mes/año, no debe generar cargos duplicados. Implementar con constraint UNIQUE `(subscription_id, billing_month, billing_year)` en BD y usar `INSERT ... ON CONFLICT DO NOTHING` en la query. El log debe reportar duplicados evitados.

2. **Procesamiento multi-tenant.** El cron job debe iterar sobre todos los tenants activos y ejecutar la generación para cada uno con su propia conexión de BD. Obtener lista de tenants desde DB-Main, luego para cada tenant usar `PrismaTenantService.getClient(tenantId)`. Si un tenant falla, registrar error y continuar con el siguiente.

3. **Rendimiento con batches.** Para tenants con muchas suscripciones (>500), procesar en lotes de 100 suscripciones por transacción. Cada lote es una transacción atómica. Si un lote falla, registrar error del lote y continuar con el siguiente. Objetivo: <30 segundos para 1000 socios (RNFT-015).

4. **Prorrateo en altas a mitad de ejercicio.** Cuando se crea una nueva suscripción a mitad de ejercicio, solo generar cargos para `billingMonths >= registrationMonth`. Para plan anual con mes de cobro ya pasado, aplicar prorrateo inmediato: `(annualAmount / 12) * remainingMonths`. Marcar cargo como `isProrated = true`.

5. **Suspensión para socios no activos.** Antes de generar un cargo, verificar el estado del socio via `MemberQueryPort`. Si el socio está en estado `SUSPENDED` o `PENDING_PAYMENT`, NO generar cargo (FA-5). Registrar skip en log. Reanudar generación al reactivarse.

## Riesgos

| Riesgo                                                                      | Probabilidad | Impacto | Mitigación                                                                                               |
| --------------------------------------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| Cron job ejecuta simultáneamente para mismo tenant (overlap)                | Baja         | Alto    | Usar lock distribuido o flag `is_processing` en tabla de tenants. Timeout de 5 minutos para el lock      |
| Suscripción sin plan activo (plan desactivado después de crear suscripción) | Baja         | Medio   | Verificar que el plan está activo antes de generar. Si inactivo, skip + warning en log (FE-1)            |
| Error en generación masiva con >5% fallos descartar lote completo           | Baja         | Alto    | Rollback del lote. Alerta al tesorero. Permitir corrección manual y reintento (FE-2)                     |
| Cálculo de prorrateo con redondeo genera diferencias acumuladas             | Media        | Bajo    | Redondear al centavo más cercano. Documentar política de redondeo. El último cargo absorbe la diferencia |
| Proceso nocturno excede timeout (>5 min) en tenant grande                   | Baja         | Medio   | Configurar timeout a 5 minutos. Si excede, registrar progreso y completar en siguiente ejecución         |

## Plan de implementación

### Paso 1: Capa de dominio - Value Objects

Crear en `api/src/treasury/domain/value-objects/`:

- **`ChargeId`**: Extiende `Identifier`. UUID v4. Método factory `create(): ChargeId` y `fromString(id: string): ChargeId`
- **`ChargeStatus`**: Enum VO con valores `PENDING`, `PAID`, `PARTIALLY_PAID`, `RETURNED`, `CANCELLED`
- **`ChargeDescription`**: Value Object con `description: string` y `fiscalYearId: string | null`. Método factory `create(description: string, fiscalYearId?: string): ChargeDescription`

Reutilizar de Tasks previas: `Money`, `SubscriptionId`, `FeePlanId`, `MemberAccountId`

Tests unitarios: enumeración completa de `ChargeStatus`, creación de `ChargeDescription` válida.

### Paso 2: Capa de dominio - Entity Charge

Crear en `api/src/treasury/domain/entities/charge.ts`:

- Propiedades:
  - `id: ChargeId`
  - `subscriptionId: SubscriptionId | null` (NULL si cargo manual)
  - `baseAmount: Money` (importe antes de prorrateo)
  - `finalAmount: Money` (importe efectivo a cobrar)
  - `description: ChargeDescription`
  - `billingMonth: number | null` (1-12, NULL para cargos únicos/manuales)
  - `billingYear: number`
  - `issueDate: Date`
  - `dueDate: Date`
  - `status: ChargeStatus`
  - `paidAmount: Money` (para pagos parciales, inicia en 0)
  - `isProrated: boolean`
  - `isManual: boolean`
- Método factory `Charge.create(props)`: genera UUID, establece `status = PENDING`, `paidAmount = Money.zero()`, valida invariantes
- Métodos de negocio:
  - `recordPayment(amount: Money): void`: incrementa `paidAmount`, actualiza `status` a `PAID` si completo o `PARTIALLY_PAID` si parcial
  - `cancel(): void`: marca `status = CANCELLED`
  - `markAsReturned(): void`: marca `status = RETURNED`
  - `isPending(): boolean`: `status === PENDING`
  - `remainingAmount(): Money`: `finalAmount - paidAmount`
- Invariantes:
  - `finalAmount > 0`
  - `dueDate >= issueDate`
  - `paidAmount <= finalAmount`
  - Si `isManual = true`, `subscriptionId` debe ser NULL
  - Si `isManual = false`, `subscriptionId` debe existir

Tests unitarios: creación de cargo válido, registro de pago parcial, registro de pago completo, cálculo de remaining, cancelación, validación de invariantes.

### Paso 3: Capa de dominio - Domain Service ProrataCalculator

Crear en `api/src/treasury/domain/services/prorata-calculator.ts`:

- **`ProrataCalculator`**: Domain Service para calcular cargos prorrateados
  - `calculateProratedCharges(subscription: FeeSubscription, plan: FeePlan, registrationMonth: number, fiscalYearEndMonth: number): ProratedChargeResult[]`:
    - **Plan periódico (mensual/trimestral):** filtrar `billingMonths >= registrationMonth` dentro del ejercicio actual
    - **Plan anual con mes ya pasado:** calcular `prorataAmount = (annualAmount / 12) * remainingMonths` donde `remainingMonths = totalMonths - (registrationMonth - fiscalYearStartMonth)`
    - Cada resultado incluye: `billingMonth`, `finalAmount`, `isProrated`
  - `calculateMonthlyCharge(subscription: FeeSubscription, plan: FeePlan, month: number, year: number): ChargeInput | null`:
    - Verificar si `month` está en `plan.billingMonths`
    - Si sí: retornar cargo con `finalAmount = subscription.effectiveAmount`
    - Si no: retornar `null`

Tests unitarios: prorrateo mensual (alta julio → 6 cargos), prorrateo trimestral (alta julio → meses [7,10]), prorrateo anual inmediato (alta julio, mes cobro [2] ya pasado → cargo prorrateado 6/12), ningún cargo si mes no aplica.

### Paso 4: Capa de dominio - Domain Service ChargeGenerator

Crear en `api/src/treasury/domain/services/charge-generator.ts`:

- **`ChargeGenerator`**: Domain Service que genera cargos para suscripciones activas
  - `generateForMonth(subscriptions: ActiveSubscriptionData[], month: number, year: number, existingCharges: ExistingChargeKey[]): GenerationResult`:
    - Para cada suscripción:
      1. Verificar si `month` está en `plan.billingMonths`
      2. Verificar si no existe cargo para `(subscriptionId, month, year)` en `existingCharges`
      3. Si ambas condiciones OK: crear `Charge` con `finalAmount = subscription.effectiveAmount`
      4. Establecer `dueDate` = último día del mes
      5. Acumular en resultado
    - Retorna `GenerationResult`: `{ charges: Charge[], skippedNoMonth: number, skippedDuplicate: number, errors: Error[] }`

Tests unitarios: generación para mes que aplica, skip para mes que no aplica, skip para duplicado, error para suscripción sin plan activo, resultado con contadores correctos.

### Paso 5: Capa de dominio - Domain Events

Crear en `api/src/treasury/domain/events/`:

- **`ChargeGeneratedEvent`**: Extiende `DomainEvent`. Payload: `{ chargeId: UUID, memberAccountId: UUID, memberId: UUID, subscriptionId: UUID, amount: number, billingMonth: number, billingYear: number, dueDate: Date }`
- **`MonthlyGenerationCompletedEvent`**: Extiende `DomainEvent`. Payload: `{ tenantId: UUID, month: number, year: number, totalSubscriptions: number, chargesGenerated: number, totalAmount: number, duplicatesSkipped: number, errorsCount: number, durationMs: number }`

### Paso 6: Capa de dominio - Puertos e interfaces

Crear en `api/src/treasury/domain/ports/`:

- **`FiscalYearQueryPort`** (interfaz):
  - `findActive(tenantId: string): Promise<FiscalYearDto | null>`
  - `findById(tenantId: string, fiscalYearId: string): Promise<FiscalYearDto | null>`

Extender `api/src/treasury/domain/repositories/` (del repositorio de MemberAccount):

- **`ChargeRepository`** (interfaz):
  - `saveMany(charges: Charge[]): Promise<void>`
  - `findBySubscriptionAndPeriod(subscriptionId: SubscriptionId, billingMonth: number, billingYear: number): Promise<Charge | null>`
  - `findExistingKeys(subscriptionIds: string[], billingMonth: number, billingYear: number): Promise<ExistingChargeKey[]>`
  - `findByMemberAccountId(memberAccountId: MemberAccountId): Promise<Charge[]>`
  - `findPendingByMemberAccountId(memberAccountId: MemberAccountId): Promise<Charge[]>`

### Paso 7: Capa de aplicación - Commands, Queries y DTOs

Crear en `api/src/treasury/application/`:

**Commands:**

- **`GenerateMonthlyChargesCommand`**: `{ month: number, year: number, tenantId?: string }` (tenantId opcional, si no se indica procesa todos)
- **`GenerateSubscriptionChargesCommand`**: `{ memberAccountId, subscriptionId }` (genera cargos prorrateados para nueva suscripción)

**Queries:**

- **`GetGenerationLogQuery`**: `{ month?: number, year?: number }`
- **`GetChargesByAccountQuery`**: `{ memberAccountId }`

**DTOs:**

- **`GenerateMonthlyChargesDto`**: DTO de entrada: `@IsInt()` `@Min(1)` `@Max(12)` month, `@IsInt()` `@Min(2020)` year
- **`GenerationResultDto`**: DTO de salida: `tenantId`, `month`, `year`, `subscriptionsEvaluated`, `chargesGenerated`, `totalAmount` (centavos), `totalAmountFormatted` (euros), `duplicatesSkipped`, `errorsCount`, `errors: Array<{ subscriptionId, error }>`, `durationMs`
- **`ChargeResponseDto`**: DTO de salida: `id`, `subscriptionId`, `description`, `baseAmount`, `finalAmount`, `finalAmountFormatted`, `billingMonth`, `billingYear`, `issueDate`, `dueDate`, `status`, `paidAmount`, `isProrated`, `isManual`

### Paso 8: Capa de aplicación - Handlers

**`GenerateMonthlyChargesHandler`:**

1. Obtener lista de tenants activos desde DB-Main (o procesar solo el indicado)
2. Para cada tenant:
   a. Obtener cliente Prisma via `PrismaTenantService.getClient(tenantId)`
   b. Verificar que existe ejercicio abierto via `FiscalYearQueryPort.findActive(tenantId)`
   - Si no hay ejercicio abierto → skip tenant con warning
     c. Obtener todas las suscripciones activas con sus planes
     d. Filtrar socios en estado activo via `MemberQueryPort` (excluir SUSPENDED y PENDING_PAYMENT - FA-5)
     e. Obtener cargos existentes para el mes/año (para prevenir duplicados)
     f. Ejecutar `ChargeGenerator.generateForMonth()` en batches de 100
     g. Para cada batch:
   - Crear transacción Prisma
   - Insertar cargos via `ChargeRepository.saveMany()`
   - Registrar eventos `ChargeGenerated` en Outbox
   - Commit de transacción
   - Si error en batch: registrar error, continuar con siguiente batch
     h. Registrar resultado en log de auditoría
     i. Publicar `MonthlyGenerationCompleted`
3. Si errores > 5% del total → enviar alerta (FE-2)
4. Retornar `GenerationResultDto` con resumen

**En caso de fallo:**

- Rollback del batch actual (automático por Prisma)
- Continuar con siguiente batch
- Reportar excepciones vía `ErrorReporter.captureException()` con contexto (tenantId, batch, subscriptionIds)

**`GenerateSubscriptionChargesHandler`:**

1. Buscar `MemberAccount` y `FeeSubscription` activa
2. Buscar `FeePlan` de la suscripción
3. Obtener ejercicio activo via `FiscalYearQueryPort`
4. Calcular cargos prorrateados via `ProrataCalculator.calculateProratedCharges()`
5. Para cada cargo calculado:
   - Verificar que no existe cargo duplicado para ese mes/año/suscripción
   - Crear `Charge` entity
6. Persistir cargos en transacción
7. Publicar `ChargeGenerated` por cada cargo via Outbox
8. Retornar lista de cargos generados

### Paso 9: Capa de infraestructura - Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model Charge {
  id                  String    @id @default(uuid()) @db.Uuid
  member_account_id   String    @db.Uuid
  subscription_id     String?   @db.Uuid
  base_amount         Int       @default(0)
  final_amount        Int       @default(0)
  description         String    @db.VarChar(255)
  fiscal_year_id      String?   @db.Uuid
  billing_month       Int?
  billing_year        Int
  issue_date          DateTime  @db.Date
  due_date            DateTime  @db.Date
  status              String    @default("PENDING") @db.VarChar(20)
  paid_amount         Int       @default(0)
  is_prorated         Boolean   @default(false)
  is_manual           Boolean   @default(false)
  created_at          DateTime  @default(now())

  memberAccount       MemberAccount   @relation(fields: [member_account_id], references: [id])
  subscription        FeeSubscription? @relation(fields: [subscription_id], references: [id])

  @@unique([subscription_id, billing_month, billing_year], name: "unique_charge_per_period")
  @@index([member_account_id, status])
  @@index([billing_month, billing_year])
  @@map("charges")
}
```

Nota: `base_amount`, `final_amount` y `paid_amount` almacenan centavos (integer). El constraint UNIQUE `(subscription_id, billing_month, billing_year)` previene duplicados. Agregar relación en modelo `FeeSubscription`: `charges Charge[]`.

### Paso 10: Capa de infraestructura - Repository (Prisma)

Crear en `api/src/treasury/infrastructure/persistence/`:

- **`PrismaChargeRepository`**: Implementa `ChargeRepository` usando `PrismaTenantService.getClient(tenantId)`
- Método `saveMany()` usa `createMany()` de Prisma con `skipDuplicates: true` para idempotencia
- Método `findExistingKeys()` obtiene `(subscription_id, billing_month, billing_year)` existentes para filtrado previo
- Mappers: `ChargePrismaMapper.toDomain(prismaModel): Charge` y `toPersistence(entity): PrismaCreateInput`

Crear en `api/src/treasury/infrastructure/ports/`:

- **`PrismaFiscalYearQueryAdapter`**: Implementa `FiscalYearQueryPort`. Consulta la tabla `fiscal_years` de la BD del tenant via `PrismaTenantService`. NO importa repositorios de BC-Membership

### Paso 11: Capa de infraestructura - Cron Job

Crear en `api/src/treasury/infrastructure/cron/charge-generation.cron.ts`:

- **`ChargeGenerationCron`**: Servicio con `@Cron('0 2 1 * *')` (día 1, 02:00 AM cada mes)
  - Obtiene mes y año actual
  - Invoca `GenerateMonthlyChargesHandler` sin especificar tenantId (procesa todos)
  - Log de inicio y fin con duración
  - Timeout configurable: 5 minutos
  - Si proceso > 2 minutos → log warning
  - Si proceso falla → log error + `ErrorReporter.captureException()`

### Paso 12: Capa de infraestructura - Controller

Crear en `api/src/treasury/infrastructure/controllers/charges.controller.ts`:

| Endpoint                                                                    | Método | Auth | Permiso                   | Body/Params                                  | Response                              |
| --------------------------------------------------------------------------- | ------ | ---- | ------------------------- | -------------------------------------------- | ------------------------------------- |
| `/api/v1/treasury/charges/generate-monthly`                                 | POST   | JWT  | `treasury:charges:create` | `GenerateMonthlyChargesDto`                  | 200 con `GenerationResultDto`         |
| `/api/v1/treasury/charges/generation-log`                                   | GET    | JWT  | `treasury:charges:read`   | Query: `?month=4&year=2025`                  | 200 con log de generaciones           |
| `/api/v1/treasury/member-accounts/:accountId/charges`                       | GET    | JWT  | `treasury:charges:read`   | Param: `accountId`, Query: `?status=PENDING` | 200 con `ChargeResponseDto[]`         |
| `/api/v1/treasury/member-accounts/:accountId/charges/generate-subscription` | POST   | JWT  | `treasury:charges:create` | `{ subscriptionId }`                         | 201 Created con `ChargeResponseDto[]` |

- Swagger decorators para documentación automática
- Errores: 404 Not Found (cuenta no encontrada), 422 Unprocessable Entity (sin ejercicio abierto), 409 Conflict (cargos ya generados para el periodo)

### Paso 13: Tests

**Tests unitarios (dominio):**

- `Charge.create()` con datos válidos → cargo en estado PENDING
- `Charge.create()` con finalAmount <= 0 → error
- `Charge.create()` con dueDate < issueDate → error
- `Charge.recordPayment()` parcial → status PARTIALLY_PAID, paidAmount incrementado
- `Charge.recordPayment()` completo → status PAID
- `Charge.remainingAmount()` → cálculo correcto en centavos
- `Charge.cancel()` → status CANCELLED
- `ProrataCalculator.calculateProratedCharges()`:
  - Alta julio, plan mensual → 6 cargos (jul-dic)
  - Alta julio, plan trimestral [1,4,7,10] → 2 cargos (jul, oct)
  - Alta julio, plan anual [2] ya pasado → 1 cargo prorrateado (6/12 del importe)
  - Alta enero, plan mensual → 12 cargos (sin prorrateo)
- `ChargeGenerator.generateForMonth()`:
  - Mes 4 con plan mensual → genera cargo
  - Mes 4 con plan semestral [1,7] → no genera cargo
  - Mes 4 con cargo ya existente → skip duplicado
  - Suscripción sin plan activo → error registrado

**Tests unitarios (aplicación):**

- `GenerateMonthlyChargesHandler` con mocks:
  - Caso éxito: 3 suscripciones, 2 generan cargo (mes aplica), 1 skip → resultado correcto
  - Caso duplicados: cargos ya existentes → skip sin error
  - Caso sin ejercicio abierto → skip tenant
  - Caso socio suspendido → skip sin cargo
  - Caso error en batch → batch con rollback, siguiente batch continúa
- `GenerateSubscriptionChargesHandler`:
  - Caso alta julio plan mensual → 6 cargos prorrateados generados
  - Caso alta julio plan anual → 1 cargo prorrateado
  - Caso cargos ya existentes → no duplica

**Tests de integración:**

- Generación masiva contra BD real (Testcontainers):
  - Crear 5 suscripciones con distintos planes → generar cargos para mes 4 → verificar que solo se generan para planes que incluyen mes 4
  - Ejecutar generación 2 veces para mismo mes → verificar 0 duplicados (constraint UNIQUE)
  - Verificar que `base_amount` y `final_amount` se almacenan en centavos
  - Verificar que constraint `unique_charge_per_period` funciona correctamente
- Prorrateo:
  - Crear suscripción con registrationDate en julio → generar cargos → verificar solo meses >= 7
  - Plan anual con mes [2] ya pasado + alta julio → verificar cargo prorrateado con `isProrated = true`
- Verificar que eventos `ChargeGenerated` se registran en outbox
- Verificar que el log de generación registra resultado completo

## Criterios de aceptación

Derivados de US-047, US-048:

1. **Proceso mensual de generación (US-047, escenario 1):** Al ejecutar la generación para mes 4 (abril), el sistema evalúa todas las suscripciones activas y genera cargos solo para aquellas cuyo plan incluye el mes 4 en su `billingMonths`. Un socio con plan mensual genera cargo, otro con plan semestral [1,7] no genera.

2. **Prevención de cargos duplicados (US-047, escenario 2):** Si el proceso se ejecuta dos veces para el mismo mes, no se generan cargos duplicados. El log indica "Cargo mes 4 ya existe para suscripción XXX".

3. **Generación retroactiva (US-047, escenario 3):** Si falla el proceso de marzo, el tesorero puede ejecutar manualmente la generación para mes 3 en abril. Se generan los cargos de marzo pendientes sin afectar los de abril.

4. **Prorrateo mensual (US-048, escenario 1):** Alta en julio con plan mensual [1..12] genera solo cargos para meses >= 7 (6 cargos). No se cobran meses anteriores al alta.

5. **Prorrateo trimestral (US-048, escenario 2):** Alta en julio con plan trimestral [1,4,7,10] genera solo cargos para meses >= 7 que estén en billingMonths: meses 7 y 10 (2 cargos).

6. **Prorrateo anual inmediato (US-048, escenario 3):** Alta en julio con plan anual [2] (mes de cobro ya pasado) genera cargo prorrateado inmediato: `(annualAmount / 12) * 6 meses restantes`. El cargo se marca como `isProrated = true`.

7. **Suspensión para socios no activos (FA-5):** No se generan cargos para socios en estado Suspendido o PendientePago. La generación se reanuda al reactivarse el socio.

8. **Rendimiento (RNFT-015):** El proceso debe completarse en menos de 30 segundos para 1000 socios. Se procesa en lotes de 100 para optimizar rendimiento y transacciones.

9. **Idempotencia total:** El proceso es idempotente. Múltiples ejecuciones para el mismo periodo producen el mismo resultado sin efectos secundarios.
