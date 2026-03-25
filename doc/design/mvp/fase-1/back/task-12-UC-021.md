# Task 12 - UC-021: Registro de cobros (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-021
- **Bounded Context:** BC-Treasury
- **Application Service:** `CollectionService`
- **Aggregates:** `MemberAccount` (extensión con Entity `Payment`)
- **Prioridad:** Must

## Alcance

### Incluido

- Entity `Payment` dentro del Aggregate `MemberAccount` con Value Objects (`PaymentMethod`, `PaymentReference`, `PaymentStatus`)
- Application Service `CollectionService` con flujos: registro de cobro individual, cobro de múltiples cargos, pago parcial, cobro de cargo devuelto
- Métodos de pago soportados: Efectivo, Transferencia, Bizum, Domiciliación SEPA, Tarjeta (TPV físico)
- Generación automática de referencia de pago: `{METODO}-{AÑO}-{SECUENCIAL}` (ej: `EF-2025-00042`)
- Numeración automática de recibos: `REC-{AÑO}-{SECUENCIAL}` único por tenant
- Registro de pagos parciales con actualización de estado del cargo (PENDING → PARTIALLY_PAID → PAID)
- Cobro de cargos devueltos (RETURNED → PAID vía regularización)
- Búsqueda de socio por nombre, número o DNI para seleccionar cargos pendientes
- Generación de recibo en PDF (plantilla básica con datos del pago y del socio)
- Puerto `MemberQueryPort` (reutilizado de Task 10) para obtener datos del socio
- Domain Events: `PaymentRecorded`, `ReceiptGenerated`
- Endpoints REST:
  - `POST /api/v1/treasury/member-accounts/:accountId/payments`
  - `GET /api/v1/treasury/member-accounts/:accountId/payments`
  - `GET /api/v1/treasury/member-accounts/:accountId/charges?status=PENDING`
  - `GET /api/v1/treasury/member-accounts/:accountId/balance`
  - `GET /api/v1/treasury/payments/:id/receipt`
  - `GET /api/v1/treasury/search-members?q=garcia`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Pasarela de pago online (UC-025, post-MVP)
- Generación de remesas SEPA (UC-023, Fase 2)
- Adjunto de justificantes (US-056, simplificado para MVP: solo campo `notes`)
- Generación masiva de recibos en PDF batch (FA-4, post-MVP)
- Cobro anticipado con vinculación automática a cargo futuro (FA-3, post-MVP)
- Descuento excepcional con aprobación de JD (FA-2, simplificado: solo nota en observaciones)
- Anulación de pagos con autorización (post-MVP: solo registro, no anulación)

## Dependencias

### Tareas previas requeridas

| Tarea                        | Artefacto necesario                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold**        | Estructura de módulos NestJS, Shared kernel, PrismaTenantService, Prisma schemas, Docker Compose con PostgreSQL                   |
| **F1-Back Task 1 - UC-001**  | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados                              |
| **F1-Back Task 2 - UC-002**  | `JwtAuthGuard`, `PermissionsGuard`, autenticación operativa                                                                       |
| **F1-Back Task 10 - UC-018** | Aggregate `MemberAccount` con `FeeSubscription`, puerto `MemberQueryPort`                                                         |
| **F1-Back Task 11 - UC-019** | Entity `Charge` dentro de MemberAccount, `ChargeRepository`, modelo `Charge` en schema Prisma, cargos generados en estado PENDING |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `api/src/treasury/domain/value-objects/money.ts` existe y exporta `Money` con operaciones en centavos
- [ ] `api/src/treasury/domain/aggregates/member-account.ts` existe con `FeeSubscription` y `Charge` entities
- [ ] `api/src/treasury/domain/entities/charge.ts` existe con métodos `recordPayment()`, `remainingAmount()`, `isPending()`
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `MemberAccount`, `FeeSubscription`, `Charge`
- [ ] Existen cargos en estado PENDING en BD del tenant (generados por UC-019)
- [ ] `api/src/treasury/domain/ports/member-query.port.ts` existe (de Task 10)
- [ ] Los permisos `treasury:payments:create`, `treasury:payments:read` existen en los roles seedeados

### Artefactos producidos

| Artefacto                                           | Consumido por                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Entity `Payment` (dominio, dentro de MemberAccount) | Consultas de balance, reportes financieros                                                        |
| Modelo `Payment` en schema tenant Prisma            | Reportes, auditoría, consultas                                                                    |
| `CollectionService` (application)                   | Frontend UC-021 (Fase 2), testing manual                                                          |
| Endpoints REST de cobros                            | Frontend UC-021 (Fase 2), testing manual                                                          |
| Generación de recibos PDF                           | Consulta por socio/tesorero, impresión                                                            |
| Evento `PaymentRecorded`                            | BC-Membership (actualizar estado morosidad si aplica), BC-Communication (enviar recibo por email) |
| Evento `ReceiptGenerated`                           | BC-Documents (archivar recibo)                                                                    |

## Referencia de especificación

| Documento           | Contenido relevante                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `uc/uc-021.md`      | Flujo completo: registro de cobro en efectivo, transferencia, Bizum, pagos parciales, cargo devuelto, recibo |
| `us/us-053.md`      | Criterios de aceptación Gherkin: registro de cobro en efectivo, transferencia, Bizum                         |
| `us/us-054.md`      | Criterios de aceptación Gherkin: gestión de estados de pago (parcial, devuelto → pagado)                     |
| `us/us-055.md`      | Criterios de aceptación Gherkin: información completa del cobro, trazabilidad                                |
| `us/us-057.md`      | Criterios de aceptación Gherkin: generación automática de recibos PDF                                        |
| `bc/bc-treasury.md` | Entity Payment - estructura, propiedades, PaymentMethod, PaymentStatus                                       |
| `bc/bc-treasury.md` | Aggregate MemberAccount - extensión con payments, balance                                                    |

## Puntos críticos

1. **Actualización atómica de cargo y creación de pago.** Al registrar un cobro, se debe crear la entidad `Payment` y actualizar el `Charge` correspondiente (`paidAmount`, `status`) en la misma transacción. Si el pago completa el cargo, el status pasa a PAID. Si es parcial, pasa a PARTIALLY_PAID. La operación debe ser atómica para evitar inconsistencias entre `paidAmount` del cargo y el `Payment` registrado.

2. **Pagos parciales con múltiples pagos por cargo.** Un cargo puede recibir múltiples pagos parciales hasta completar el `finalAmount`. Cada pago incrementa `paidAmount` del cargo. El estado transita: PENDING → PARTIALLY_PAID → PAID. La validación crítica es que `paidAmount` nunca supere `finalAmount`. En caso de sobre-pago, rechazar con error descriptivo (FE-1).

3. **Cobro de múltiples cargos en un solo pago.** El tesorero puede seleccionar varios cargos pendientes y registrar un único pago que los cubre. Internamente, se crea un `Payment` por cada cargo (vinculado via `chargeId`), todos con la misma `paymentReference` y `paymentDate`. La suma de los pagos debe coincidir con el importe total registrado.

4. **Generación de referencia y numeración de recibo.** La referencia de pago se genera automáticamente: `{METODO}-{AÑO}-{SECUENCIAL}` (ej: `EF-2025-00042`). El número de recibo es independiente: `REC-{AÑO}-{SECUENCIAL}`. Ambos son únicos por tenant. Usar lock o secuencia para evitar duplicados bajo concurrencia.

5. **Generación de recibo PDF (US-057).** El recibo se genera con datos del socio (nombre, número, DNI), concepto (descripción del cargo), importe, método de pago y fecha. Para MVP, usar una plantilla simple con `pdfkit` o similar. El PDF se almacena como bytes en BD o en disco local (no S3 para MVP). El campo `receiptDocumentId` del pago referencia al recibo generado.

## Riesgos

| Riesgo                                                                         | Probabilidad | Impacto | Mitigación                                                                                                                               |
| ------------------------------------------------------------------------------ | ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Race condition: dos pagos simultáneos sobre el mismo cargo superan finalAmount | Baja         | Alto    | Verificar `remainingAmount` dentro de transacción con lock pesimista en el cargo. Rechazar si importe > remaining                        |
| Duplicación de referencia de pago bajo concurrencia                            | Baja         | Medio   | Secuencia con lock para generar referencia. Constraint UNIQUE en BD                                                                      |
| Generación de PDF falla pero pago ya registrado                                | Baja         | Medio   | El pago es lo crítico; el recibo puede regenerarse después. Registrar warning si falla PDF. Endpoint `GET receipt` regenera si no existe |
| Numeración de recibos con gaps tras rollbacks                                  | Baja         | Bajo    | Aceptable para MVP. Los gaps no afectan la validez fiscal. Documentar política                                                           |
| Rendimiento de generación de PDF con muchos pagos simultáneos                  | Baja         | Bajo    | Para MVP, generación síncrona es aceptable (<200ms). Async si necesario en Fase 2                                                        |

## Plan de implementación

### Paso 1: Capa de dominio - Value Objects

Crear en `api/src/treasury/domain/value-objects/`:

- **`PaymentId`**: Extiende `Identifier`. UUID v4
- **`PaymentMethod`**: Enum VO con valores `CASH`, `TRANSFER`, `BIZUM`, `SEPA_DIRECT_DEBIT`, `CARD_TPV`
- **`PaymentReference`**: Value Object con `value: string`. Método factory `generate(method: PaymentMethod, year: number, sequence: number): PaymentReference`. Formato: `{METODO}-{AÑO}-{SECUENCIAL:5}`. Invariante: no vacío
- **`PaymentStatus`**: Enum VO con valores `CONFIRMED`, `ANNULLED`
- **`ReceiptNumber`**: Value Object con `value: string`. Método factory `generate(year: number, sequence: number): ReceiptNumber`. Formato: `REC-{AÑO}-{SECUENCIAL:5}`. Invariante: no vacío

Reutilizar de Tasks previas: `Money`, `MemberAccountId`, `ChargeId`

Tests unitarios: generación de `PaymentReference` con distintos métodos (EF, TR, BZ, SEPA, TPV), generación de `ReceiptNumber`, formato correcto con padding.

### Paso 2: Capa de dominio - Entity Payment

Crear en `api/src/treasury/domain/entities/payment.ts`:

- Propiedades:
  - `id: PaymentId`
  - `chargeId: ChargeId`
  - `amount: Money`
  - `paymentMethod: PaymentMethod`
  - `paymentDate: Date`
  - `paymentReference: PaymentReference`
  - `receiptNumber: ReceiptNumber | null`
  - `notes: string | null`
  - `registeredBy: string` (userId del tesorero)
  - `status: PaymentStatus`
  - `createdAt: Date`
- Método factory `Payment.create(props)`: genera UUID, establece `status = CONFIRMED`, `createdAt = now()`
- Invariantes:
  - `amount > 0`
  - `paymentDate <= now()` (no pagos futuros, FE-2)
  - `status` solo puede ser CONFIRMED al crear

Tests unitarios: creación de pago válido, rechazo con importe 0, rechazo con fecha futura.

### Paso 3: Capa de dominio - Extensión del Aggregate MemberAccount

Extender en `api/src/treasury/domain/aggregates/member-account.ts`:

- Propiedades añadidas:
  - `payments: Payment[]`
- Métodos de negocio añadidos:
  - `recordPayment(chargeId: ChargeId, payment: Payment): void`: busca el cargo, verifica que `payment.amount <= charge.remainingAmount()`, ejecuta `charge.recordPayment(payment.amount)`, añade payment a la lista, registra evento `PaymentRecorded`
  - `recordMultiChargePayment(chargePayments: Array<{ chargeId, amount }>, paymentData: { method, date, reference, notes, registeredBy }): Payment[]`: crea un Payment por cada cargo, verifica cada uno, retorna lista de pagos creados
  - `getBalance(): Money`: suma de `charge.remainingAmount()` para todos los cargos PENDING o PARTIALLY_PAID
  - `getPaymentHistory(): ReadonlyArray<Payment>`: retorna todos los pagos ordenados por `paymentDate` DESC
- Invariantes:
  - No se puede pagar más que el importe pendiente del cargo
  - Un cargo PAID o CANCELLED no acepta pagos

Tests unitarios: pago completo de cargo, pago parcial, segundo pago parcial que completa, rechazo de sobre-pago, rechazo de pago sobre cargo ya pagado, balance calculado correctamente, multi-cargo con pagos vinculados.

### Paso 4: Capa de dominio - Domain Events

Crear en `api/src/treasury/domain/events/`:

- **`PaymentRecordedEvent`**: Extiende `DomainEvent`. Payload: `{ paymentId: UUID, chargeId: UUID, memberAccountId: UUID, memberId: UUID, amount: number, paymentMethod: string, paymentDate: Date, paymentReference: string, chargeNewStatus: string }`
- **`ReceiptGeneratedEvent`**: Extiende `DomainEvent`. Payload: `{ receiptId: UUID, paymentId: UUID, receiptNumber: string, issueDate: Date }`

### Paso 5: Capa de dominio - Repository interfaces

Crear/extender en `api/src/treasury/domain/repositories/`:

- **`PaymentRepository`** (interfaz):
  - `save(payment: Payment): Promise<void>`
  - `saveMany(payments: Payment[]): Promise<void>`
  - `findByChargeId(chargeId: ChargeId): Promise<Payment[]>`
  - `findByMemberAccountId(memberAccountId: MemberAccountId): Promise<Payment[]>`
  - `getNextPaymentSequence(method: PaymentMethod, year: number): Promise<number>`
  - `getNextReceiptSequence(year: number): Promise<number>`

### Paso 6: Capa de aplicación - Commands, Queries y DTOs

Crear en `api/src/treasury/application/`:

**Commands:**

- **`RecordPaymentCommand`**: `{ memberAccountId, chargeId, amount, paymentMethod, paymentDate, notes }`
- **`RecordMultiChargePaymentCommand`**: `{ memberAccountId, chargeIds: string[], paymentMethod, paymentDate, notes }`

**Queries:**

- **`GetPaymentsByAccountQuery`**: `{ memberAccountId }`
- **`GetPendingChargesQuery`**: `{ memberAccountId }`
- **`GetAccountBalanceQuery`**: `{ memberAccountId }`
- **`GetReceiptQuery`**: `{ paymentId }`
- **`SearchMembersForPaymentQuery`**: `{ query: string }`

**DTOs:**

- **`RecordPaymentDto`**: DTO de entrada: `@IsUUID()` chargeId, `@IsInt()` `@Min(1)` amount (centavos), `@IsEnum(PaymentMethod)` paymentMethod, `@IsDateString()` paymentDate, `@IsOptional()` `@IsString()` notes
- **`RecordMultiChargePaymentDto`**: DTO de entrada: `@IsArray()` `@IsUUID({}, { each: true })` chargeIds, `@IsEnum(PaymentMethod)` paymentMethod, `@IsDateString()` paymentDate, `@IsOptional()` notes
- **`PaymentResponseDto`**: DTO de salida: `id`, `chargeId`, `chargeDescription`, `amount` (centavos), `amountFormatted` (euros), `paymentMethod`, `paymentMethodLabel`, `paymentDate`, `paymentReference`, `receiptNumber`, `notes`, `registeredBy`, `status`, `createdAt`
- **`PendingChargeResponseDto`**: DTO de salida: `id`, `description`, `finalAmount`, `paidAmount`, `remainingAmount`, `remainingAmountFormatted`, `billingMonth`, `billingYear`, `dueDate`, `status`, `isOverdue`
- **`AccountBalanceResponseDto`**: DTO de salida: `memberAccountId`, `memberId`, `memberName`, `memberNumber`, `totalPending` (centavos), `totalPendingFormatted`, `chargeCount`, `oldestDueDate`
- **`MemberSearchResultDto`**: DTO de salida: `memberId`, `memberAccountId`, `memberNumber`, `name`, `surnames`, `dni`, `pendingBalance`, `pendingCharges`

### Paso 7: Capa de aplicación - Handlers

**`RecordPaymentHandler`:**

1. Buscar `MemberAccount` por ID (con cargos y pagos cargados)
   - Si no existe → error 404
2. Buscar cargo específico dentro de la cuenta
   - Si no existe → error 404
   - Si cargo ya pagado (PAID) → error 409 "Este cargo ya está pagado" (FE-4)
   - Si cargo cancelado → error 422 "No se puede pagar un cargo cancelado"
3. Verificar que `amount <= charge.remainingAmount()`
   - Si sobre-pago → error 422 "El importe (X€) supera el pendiente (Y€)" (FE-1)
4. Verificar que `paymentDate <= now()` (FE-2)
5. Generar `PaymentReference` y `ReceiptNumber`
6. Crear `Payment` entity
7. **Iniciar transacción Prisma:**
   a. Ejecutar `memberAccount.recordPayment(chargeId, payment)` (actualiza cargo + añade pago + emite evento)
   b. Guardar MemberAccount (con cargo actualizado y pago nuevo)
   c. Generar recibo PDF
   d. Registrar eventos `PaymentRecorded` y `ReceiptGenerated` en Outbox
   e. Commit de transacción
8. Retornar `PaymentResponseDto`

**En caso de fallo:**

- Rollback automático de transacción Prisma
- Reportar excepción vía `ErrorReporter.captureException()`

**`RecordMultiChargePaymentHandler`:**

1. Buscar `MemberAccount` con todos los cargos
2. Para cada `chargeId`:
   - Verificar que existe y está pendiente
   - Verificar que no está ya pagado
3. Calcular importe total: suma de `remainingAmount()` de cada cargo
4. Generar una `PaymentReference` compartida para todos los pagos
5. **Iniciar transacción:**
   a. Para cada cargo: crear `Payment`, ejecutar `recordPayment()` en aggregate
   b. Guardar MemberAccount
   c. Generar recibo PDF con desglose de todos los cargos
   d. Registrar eventos en Outbox
   e. Commit
6. Retornar lista de `PaymentResponseDto`

**`GetPendingChargesHandler`:**

1. Buscar `MemberAccount`
2. Filtrar cargos con status PENDING o PARTIALLY_PAID
3. Calcular `isOverdue = charge.dueDate < now()`
4. Retornar `PendingChargeResponseDto[]` ordenado por `dueDate` ASC

**`GetAccountBalanceHandler`:**

1. Buscar `MemberAccount`
2. Obtener datos del socio via `MemberQueryPort`
3. Calcular balance total (suma de `remainingAmount()`)
4. Retornar `AccountBalanceResponseDto`

**`SearchMembersForPaymentHandler`:**

1. Buscar socios por nombre, apellidos, número o DNI (like query)
2. Para cada socio, obtener su `MemberAccount` y calcular balance pendiente
3. Retornar `MemberSearchResultDto[]`

**`GetReceiptHandler`:**

1. Buscar pago por ID
2. Obtener datos del socio y del cargo asociado
3. Generar o recuperar PDF del recibo
4. Retornar stream del PDF

### Paso 8: Capa de infraestructura - Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model Payment {
  id                  String    @id @default(uuid()) @db.Uuid
  member_account_id   String    @db.Uuid
  charge_id           String    @db.Uuid
  amount              Int
  payment_method      String    @db.VarChar(30)
  payment_date        DateTime  @db.Date
  payment_reference   String    @unique @db.VarChar(30)
  receipt_number      String?   @unique @db.VarChar(30)
  receipt_document    Bytes?
  notes               String?   @db.VarChar(500)
  registered_by       String    @db.Uuid
  status              String    @default("CONFIRMED") @db.VarChar(20)
  created_at          DateTime  @default(now())

  memberAccount       MemberAccount @relation(fields: [member_account_id], references: [id])
  charge              Charge        @relation(fields: [charge_id], references: [id])

  @@index([member_account_id])
  @@index([charge_id])
  @@index([payment_date])
  @@map("payments")
}
```

Nota: `amount` almacena centavos (integer). `receipt_document` almacena el PDF como bytes (para MVP, evita dependencia de S3). `payment_reference` y `receipt_number` son UNIQUE por tenant (BD aislada). Agregar relación en modelo `Charge`: `payments Payment[]`. Agregar relación en modelo `MemberAccount`: `payments Payment[]`.

### Paso 9: Capa de infraestructura - Repository (Prisma)

Crear en `api/src/treasury/infrastructure/persistence/`:

- **`PrismaPaymentRepository`**: Implementa `PaymentRepository` usando `PrismaTenantService.getClient(tenantId)`. Método `getNextPaymentSequence()` usa `SELECT COALESCE(MAX(CAST(SPLIT_PART(payment_reference, '-', 3) AS INT)), 0) + 1 FROM payments WHERE payment_reference LIKE '{METHOD}-{YEAR}-%'` con lock. Método `getNextReceiptSequence()` similar para recibos.
- Mappers: `PaymentPrismaMapper.toDomain(prismaModel): Payment` y `toPersistence(entity): PrismaCreateInput`

### Paso 10: Capa de infraestructura - Generador de recibos PDF

Crear en `api/src/treasury/infrastructure/services/receipt-generator.ts`:

- **`ReceiptGenerator`**: Servicio que genera recibos PDF
  - `generateReceipt(data: ReceiptData): Promise<Buffer>`: genera PDF con:
    - Número de recibo
    - Fecha de emisión
    - Datos del socio (nombre, número, DNI)
    - Concepto (descripción del cargo)
    - Importe (formateado en euros)
    - Método de pago
    - Referencia de pago
  - Usa `pdfkit` o `@react-pdf/renderer` (server-side)
  - Plantilla básica para MVP (sin logo personalizable, post-MVP)

### Paso 11: Capa de infraestructura - Controller

Crear en `api/src/treasury/infrastructure/controllers/payments.controller.ts`:

| Endpoint                                                     | Método | Auth | Permiso                    | Body/Params                             | Response                               |
| ------------------------------------------------------------ | ------ | ---- | -------------------------- | --------------------------------------- | -------------------------------------- |
| `/api/v1/treasury/member-accounts/:accountId/payments`       | POST   | JWT  | `treasury:payments:create` | `RecordPaymentDto`                      | 201 Created con `PaymentResponseDto`   |
| `/api/v1/treasury/member-accounts/:accountId/payments/multi` | POST   | JWT  | `treasury:payments:create` | `RecordMultiChargePaymentDto`           | 201 Created con `PaymentResponseDto[]` |
| `/api/v1/treasury/member-accounts/:accountId/payments`       | GET    | JWT  | `treasury:payments:read`   | Query: `?from=2025-01-01&to=2025-12-31` | 200 con `PaymentResponseDto[]`         |
| `/api/v1/treasury/member-accounts/:accountId/charges`        | GET    | JWT  | `treasury:charges:read`    | Query: `?status=PENDING`                | 200 con `PendingChargeResponseDto[]`   |
| `/api/v1/treasury/member-accounts/:accountId/balance`        | GET    | JWT  | `treasury:payments:read`   | -                                       | 200 con `AccountBalanceResponseDto`    |
| `/api/v1/treasury/payments/:id/receipt`                      | GET    | JWT  | `treasury:payments:read`   | -                                       | 200 con PDF (application/pdf)          |
| `/api/v1/treasury/search-members`                            | GET    | JWT  | `treasury:payments:read`   | Query: `?q=garcia`                      | 200 con `MemberSearchResultDto[]`      |

- Swagger decorators para documentación automática
- Errores: 404 Not Found (cuenta/cargo/pago no encontrado), 409 Conflict (cargo ya pagado), 422 Unprocessable Entity (sobre-pago, fecha futura, cargo cancelado)

### Paso 12: Tests

**Tests unitarios (dominio):**

- `Payment.create()` con datos válidos → pago en estado CONFIRMED
- `Payment.create()` con importe 0 → error
- `Payment.create()` con fecha futura → error
- `PaymentReference.generate()` → formato correcto (EF-2025-00042)
- `ReceiptNumber.generate()` → formato correcto (REC-2025-00042)
- `MemberAccount.recordPayment()`:
  - Pago completo → cargo status PAID, evento emitido
  - Pago parcial → cargo status PARTIALLY_PAID, paidAmount incrementado
  - Segundo pago parcial que completa → cargo status PAID
  - Sobre-pago → error (amount > remainingAmount)
  - Pago sobre cargo PAID → error
  - Pago sobre cargo CANCELLED → error
- `MemberAccount.recordMultiChargePayment()`:
  - 3 cargos pagados → 3 Payments creados con misma referencia
  - 1 cargo ya pagado en la lista → error
- `MemberAccount.getBalance()`:
  - 2 cargos PENDING + 1 PAID → balance = suma de los 2 pending
  - Con pago parcial → balance correcto restando paidAmount

**Tests unitarios (aplicación):**

- `RecordPaymentHandler` con mocks:
  - Caso éxito: pago registrado, cargo actualizado, recibo generado, evento publicado
  - Caso cargo no encontrado: 404
  - Caso cargo ya pagado: 409
  - Caso sobre-pago: 422 con importes detallados
  - Caso fecha futura: 422
  - Caso pago parcial: cargo en PARTIALLY_PAID
- `RecordMultiChargePaymentHandler`:
  - Caso éxito: múltiples pagos creados con misma referencia
  - Caso un cargo ya pagado: error (rollback de todos)
- `GetPendingChargesHandler`:
  - Caso con 3 cargos pendientes: retorna ordenados por vencimiento
  - Caso sin cargos: retorna lista vacía
- `GetAccountBalanceHandler`:
  - Caso con deuda: balance correcto en centavos y formateado
- `SearchMembersForPaymentHandler`:
  - Búsqueda por nombre: retorna coincidencias con balance
  - Búsqueda por número de socio: retorna coincidencia exacta

**Tests de integración:**

- Registro de cobro completo contra BD real (Testcontainers):
  - Crear cargo PENDING → registrar pago → verificar cargo en PAID, Payment persistido
  - Verificar referencia generada (formato correcto, única)
  - Verificar recibo generado (receipt_number, receipt_document no null)
  - Verificar evento `PaymentRecorded` en outbox
- Pago parcial:
  - Cargo de 5000 cents → pago de 3000 → verificar PARTIALLY_PAID, paidAmount=3000
  - Segundo pago de 2000 → verificar PAID, paidAmount=5000
- Multi-cargo:
  - 3 cargos PENDING → pago multi → verificar 3 Payments con misma referencia, 3 cargos PAID
- Validaciones:
  - Sobre-pago → verificar rechazo 422
  - Doble pago → verificar rechazo 409
  - Constraint UNIQUE en payment_reference → verificar que no se duplica bajo concurrencia
- Generación de recibo:
  - Registrar pago → GET receipt → verificar PDF válido (content-type application/pdf, tamaño > 0)
- Búsqueda:
  - 3 socios → buscar "garcia" → verificar resultados con balance

## Criterios de aceptación

Derivados de US-053, US-054, US-055, US-057:

1. **Registro de cobro en efectivo (US-053, escenario 1):** Al registrar un cobro en efectivo para un cargo pendiente de 24.50€, el cargo pasa a PAID, se genera referencia `EF-{AÑO}-{SEQ}` y recibo automático `REC-{AÑO}-{SEQ}`.

2. **Registro de transferencia (US-053, escenario 2):** Al registrar un cobro por transferencia, se almacena la referencia bancaria y la fecha valor. El flujo es idéntico al efectivo salvo el método y la referencia.

3. **Registro de Bizum (US-053, escenario 3):** Al registrar un cobro por Bizum, se etiqueta con método específico para reporting. El flujo es idéntico al efectivo.

4. **Pago parcial (US-054, escenario A):** Al registrar un pago de 20€ sobre un cargo de 35€, el cargo pasa a PARTIALLY_PAID con paidAmount=20€ y remainingAmount=15€. Un pago posterior de 15€ lo completa a PAID.

5. **Cargo devuelto regularizado (US-054, escenario B):** Un cargo en estado RETURNED puede regularizarse registrando un cobro en efectivo. El cargo pasa a PAID con el pago como justificante.

6. **Pago de múltiples cargos (FA-1):** Al seleccionar 3 cargos pendientes y registrar un pago, se crean 3 Payments vinculados con la misma referencia. El recibo incluye desglose de los 3 conceptos.

7. **Fecha de pago no futura (FE-2):** Si se intenta registrar un pago con fecha posterior a hoy, el sistema rechaza con mensaje descriptivo.

8. **Cargo ya pagado rechazado (FE-4):** Si se intenta registrar un pago para un cargo ya en estado PAID, el sistema rechaza con datos del pago existente.

9. **Recibo automático (US-057):** Al completar el registro del cobro, se genera automáticamente un recibo PDF con número de recibo, datos del socio, concepto, importe, método y fecha. El recibo es descargable desde el endpoint `/receipt`.

10. **Trazabilidad completa (US-055):** Cada pago registrado incluye: referencia, método, fecha, importe, quién lo registró, observaciones y recibo vinculado. La auditoría es inmutable.
