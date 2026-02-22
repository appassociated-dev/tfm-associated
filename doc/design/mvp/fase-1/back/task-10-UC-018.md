# Task 10 — UC-018: Gestión de suscripciones de cuota (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-018
- **Bounded Context:** BC-Treasury
- **Application Service:** `SubscriptionService`
- **Aggregates:** `MemberAccount`, `FeePlan`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `MemberAccount` con Entity `FeeSubscription` dentro
- Application Service `SubscriptionService` con flujos: creación, cambio de plan, modificación de descuentos, cierre, consulta de histórico
- Creación de suscripción al dar de alta un socio (US-045): selección de plan, descuento por tipo, descuento personalizado
- Fórmula de descuento combinado multiplicativo (US-049): `effectiveAmount = baseAmount * (1 - descuentoTipo) * (1 - descuentoPersonalizado)`
- Cambio de modalidad de pago (US-046): cierre de suscripción actual + creación de nueva con fecha efectiva
- Gestión de exenciones (US-050): exención total (sin suscripción), exención temporal (cierre con motivo), exención parcial (descuento 100%)
- Histórico de suscripciones del socio (US-052)
- Validación: solo 1 suscripción periódica activa por socio (FA-1)
- Validación: plan vinculado al tipo de socio (FE-4)
- Puerto `MemberQueryPort` para consultar datos de miembros de BC-Membership
- Domain Events: `SubscriptionCreated`, `SubscriptionModified`, `SubscriptionClosed`
- Endpoints REST:
  - `POST /api/v1/treasury/member-accounts/:accountId/subscriptions`
  - `GET /api/v1/treasury/member-accounts/:accountId/subscriptions`
  - `GET /api/v1/treasury/member-accounts/:accountId/subscriptions/active`
  - `POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan`
  - `PATCH /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount`
  - `POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Generación de cargos (UC-019, se dispara desde suscripción pero se implementa aparte)
- Cobro de los cargos generados (UC-021)
- UI de gestión de suscripciones (se implementa en task frontend UC-018)
- Integración con pasarela de pago online
- Notificaciones al socio de cambios de plan (BC-Communication)
- Domiciliación SEPA (UC-023)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel, PrismaTenantService, Prisma schemas, Docker Compose con PostgreSQL |
| **F1-Back Task 1 — UC-001** | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados |
| **F1-Back Task 2 — UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa |
| **F1-Back Task 3 — UC-008** | Aggregate `MemberType` con descuento por tipo configurado |
| **F1-Back Task 9 — UC-017** | Aggregate `FeePlan` operativo, vinculaciones `MemberTypeFeePlan` creadas, Value Object `Money`, puerto `MemberTypeQueryPort` |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/domain/aggregate-root.base.ts` existe y exporta la clase `AggregateRoot<TId>`
- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` funciona correctamente
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` funciona correctamente
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] Los endpoints de auth (`/api/v1/auth/*`) funcionan y emiten JWT con claims correctos
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `FeePlan`, `MemberTypeFeePlan` (de Task 9)
- [ ] `api/src/treasury/domain/value-objects/money.ts` existe y exporta `Money` con operaciones en centavos
- [ ] `api/src/treasury/domain/ports/member-type-query.port.ts` existe y exporta `MemberTypeQueryPort`
- [ ] Existen planes de cuota creados y vinculados a tipos de socio en BD del tenant
- [ ] Los permisos `treasury:subscriptions:create`, `treasury:subscriptions:read`, `treasury:subscriptions:update` existen en los roles seedeados

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `MemberAccount` (dominio) | UC-019 (generar cargos sobre la cuenta), UC-021 (registrar pagos en la cuenta) |
| Entity `FeeSubscription` (dominio) | UC-019 (leer suscripción activa, plan, effectiveAmount, billingMonths) |
| Modelo `MemberAccount` en schema tenant Prisma | UC-019, UC-021, todos los UCs de tesorería |
| Modelo `FeeSubscription` en schema tenant Prisma | UC-019 (consultar suscripciones activas para generar cargos) |
| Puerto `MemberQueryPort` | Reutilizable por UC-019, UC-021 para consultar estado del socio |
| Endpoints REST de suscripciones | Frontend UC-018, testing manual |
| Evento `SubscriptionCreated` | UC-019 (programar generación de cargos para nueva suscripción) |
| Evento `SubscriptionClosed` | UC-019 (detener generación de cargos) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-018.md` | Flujo completo de suscripciones: creación en alta, cambio de plan, descuentos, exenciones, histórico |
| `us/us-045.md` | Criterios de aceptación Gherkin: selección de modalidad en alta, múltiples suscripciones, descuento personalizado |
| `us/us-046.md` | Criterios de aceptación Gherkin: cambio de plan mensual a anual, histórico de cambios |
| `us/us-049.md` | Criterios de aceptación Gherkin: descuento por tipo, descuento personalizado combinado, modificación en activa |
| `us/us-050.md` | Criterios de aceptación Gherkin: exención total, temporal, parcial (descuento 100%) |
| `us/us-052.md` | Criterios de aceptación Gherkin: visualización de histórico con detalle de suscripción |
| `bc/bc-treasury.md` | Entity FeeSubscription — estructura, propiedades, invariantes, SubscriptionCancelReason |
| `bc/bc-treasury.md` | Aggregate MemberAccount — estructura, entities (FeeSubscription, Charge, Payment) |

## Puntos críticos

1. **Fórmula de descuento multiplicativo, NUNCA aditivo.** La regla de negocio critica es que los descuentos se aplican secuencialmente: `effectiveAmount = baseAmount * (1 - descuentoTipo) * (1 - descuentoPersonalizado)`. NUNCA sumar porcentajes. Ejemplo: base 120€, tipo 30%, personal 10% → `120 * 0.70 * 0.90 = 75.60€` (correcto). Los tests deben validar explícitamente que el cálculo aditivo incorrecto (`120 * 0.60 = 72€`) NO se produce.

2. **Solo una suscripción periódica activa por socio.** Un socio puede tener: 1 suscripción periódica activa (sin `leaveDate`) + N suscripciones únicas cerradas (inscripciones, derramas ya completadas). Al crear una nueva suscripción periódica, verificar que no existe otra activa (FE-3). Para cambio de plan, cerrar la actual primero y luego crear la nueva.

3. **MemberAccount como Aggregate Root que contiene FeeSubscription.** La entidad `FeeSubscription` vive dentro del aggregate `MemberAccount`. Las operaciones sobre suscripciones deben pasar por el aggregate root para mantener invariantes (saldo, suscripción única activa). El `MemberAccount` se crea automáticamente al dar de alta un socio en BC-Treasury.

4. **Descuento combinado no puede superar 99%.** Si el descuento total efectivo alcanza o supera el 100%, el sistema debe rechazar (FE-2). Máximo permitido: 99%. Para exenciones totales, usar el flujo específico (cerrar suscripción con motivo EXEMPTION).

5. **Importes en centavos para evitar floating point.** Todos los cálculos monetarios se realizan en centavos (integer). El `effectiveAmount` se calcula y almacena en centavos en el momento de creación/modificación, no dinámicamente. Los cargos futuros usarán este valor precalculado.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Error de redondeo en descuento multiplicativo con centavos | Media | Alto | Redondear al centavo más cercano (`Math.round`). Tests con casos límite de redondeo (ej: 33.33%) |
| Race condition al crear suscripción periódica (doble click) | Baja | Medio | Verificar unicidad en capa de aplicación + constraint parcial en BD (`WHERE leave_date IS NULL AND type = 'RECURRING'`) |
| Cambio de plan con cargos pendientes genera inconsistencia | Media | Alto | Al cambiar plan, los cargos pendientes del plan anterior se conservan (deuda se arrastra). Documentar comportamiento en respuesta |
| MemberAccount no existe al crear suscripción (alta parcial) | Baja | Alto | Crear MemberAccount automáticamente si no existe al crear primera suscripción. Usar `upsert` |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects

Crear en `api/src/treasury/domain/value-objects/`:

- **`MemberAccountId`**: Extiende `Identifier`. UUID v4. Método factory `create(): MemberAccountId` y `fromString(id: string): MemberAccountId`
- **`SubscriptionId`**: Extiende `Identifier`. UUID v4. Método factory `create(): SubscriptionId` y `fromString(id: string): SubscriptionId`
- **`Discount`**: Value Object con `typeDiscount: number` (0-0.99) y `personalDiscount: number` (0-0.99). Método factory `create(typeDiscount: number, personalDiscount: number): Result<Discount, DiscountInvalidError>`. Invariantes: cada valor en [0, 0.99], descuento combinado < 1.0. Método `calculateEffectiveAmount(baseAmount: Money): Money`: aplica fórmula multiplicativa en centavos. Método `totalEffectiveRate(): number`: retorna tasa total efectiva
- **`SubscriptionCancelReason`**: Enum VO con valores `PLAN_CHANGE`, `MEMBER_LEAVE`, `EXEMPTION`, `ONE_TIME_COMPLETED`

Reutilizar de Task 9: `Money`, `FeePlanId`

Tests unitarios: `Discount.create()` con valores válidos, valores negativos, valores >= 1.0, `calculateEffectiveAmount()` con fórmula multiplicativa correcta vs. aditiva incorrecta, redondeo de centavos.

### Paso 2: Capa de dominio — Entity FeeSubscription

Crear en `api/src/treasury/domain/entities/fee-subscription.ts`:

- Propiedades:
  - `id: SubscriptionId`
  - `feePlanId: FeePlanId`
  - `registrationDate: Date`
  - `leaveDate: Date | null`
  - `discount: Discount`
  - `effectiveAmount: Money` (calculado y almacenado)
  - `cancelReason: SubscriptionCancelReason | null`
- Método factory `FeeSubscription.create(props)`: genera UUID, calcula `effectiveAmount` via `discount.calculateEffectiveAmount(feePlanAmount)`, establece `leaveDate = null`
- Métodos de negocio:
  - `close(reason: SubscriptionCancelReason, leaveDate: Date): void`: establece `leaveDate` y `cancelReason`. Invariante: `leaveDate >= registrationDate`
  - `updateDiscount(newDiscount: Discount, baseAmount: Money): void`: actualiza descuento y recalcula `effectiveAmount`
  - `isActive(): boolean`: `leaveDate === null`
  - `isClosed(): boolean`: `leaveDate !== null`
- Invariantes:
  - `leaveDate >= registrationDate` (si existe)
  - `discount` entre 0 y 0.99 para cada componente
  - `effectiveAmount` precalculado al crear/modificar

Tests unitarios: creación con descuento multiplicativo, cierre con motivo, verificación de isActive/isClosed, rechazo de cierre con fecha anterior a alta, actualización de descuento con recálculo.

### Paso 3: Capa de dominio — Aggregate MemberAccount

Crear en `api/src/treasury/domain/aggregates/member-account.ts`:

- Propiedades:
  - `id: MemberAccountId`
  - `memberId: string` (UUID, referencia a BC-Membership)
  - `subscriptions: FeeSubscription[]`
  - `createdAt: Date`
- Método factory `MemberAccount.create(props)`: genera UUID, inicializa `subscriptions` vacío
- Métodos de negocio:
  - `addSubscription(subscription: FeeSubscription, planType: PlanType): void`: verifica invariante de suscripción periódica única. Si `planType = RECURRING` y ya existe una periódica activa → error. Añade a la lista, registra evento `SubscriptionCreated`
  - `closeSubscription(subscriptionId: SubscriptionId, reason: SubscriptionCancelReason, leaveDate: Date): void`: busca suscripción, ejecuta `close()`, registra evento `SubscriptionClosed`
  - `changePlan(currentSubscriptionId: SubscriptionId, newSubscription: FeeSubscription, effectiveDate: Date, planType: PlanType): void`: cierra suscripción actual con `PLAN_CHANGE`, añade nueva. Registra ambos eventos
  - `updateSubscriptionDiscount(subscriptionId: SubscriptionId, newDiscount: Discount, baseAmount: Money): void`: actualiza descuento en suscripción activa, registra `SubscriptionModified`
  - `getActivePeriodicSubscription(): FeeSubscription | null`: retorna la suscripción periódica activa
  - `getSubscriptionHistory(): ReadonlyArray<FeeSubscription>`: retorna todas las suscripciones ordenadas por `registrationDate` DESC
  - `getPendingBalance(): Money`: suma de cargos pendientes (implementado cuando existan Charges)
- Invariantes:
  - Un socio tiene exactamente una cuenta (`memberId` único)
  - Máximo una suscripción periódica activa
  - Los cierres de suscripción son definitivos (no se reactivan)

Tests unitarios: creación de cuenta, añadir suscripción periódica, rechazo de segunda suscripción periódica activa, cambio de plan (cierre + nueva), añadir suscripción única (no afecta a la periódica), histórico ordenado, actualización de descuento.

### Paso 4: Capa de dominio — Domain Events

Crear en `api/src/treasury/domain/events/`:

- **`SubscriptionCreatedEvent`**: Extiende `DomainEvent`. Payload: `{ subscriptionId: UUID, memberAccountId: UUID, memberId: UUID, feePlanId: UUID, registrationDate: Date, effectiveAmount: number, discount: number }`
- **`SubscriptionModifiedEvent`**: Extiende `DomainEvent`. Payload: `{ subscriptionId: UUID, modifiedFields: string[], modificationDate: Date }`
- **`SubscriptionClosedEvent`**: Extiende `DomainEvent`. Payload: `{ subscriptionId: UUID, memberAccountId: UUID, cancelReason: string, leaveDate: Date }`

### Paso 5: Capa de dominio — Puertos e interfaces

Crear en `api/src/treasury/domain/ports/`:

- **`MemberQueryPort`** (interfaz):
  - `findById(tenantId: string, memberId: string): Promise<MemberDto | null>`
  - `findActiveMembers(tenantId: string): Promise<MemberDto[]>`

Crear en `api/src/treasury/domain/repositories/`:

- **`MemberAccountRepository`** (interfaz):
  - `save(account: MemberAccount): Promise<void>`
  - `findById(id: MemberAccountId): Promise<MemberAccount | null>`
  - `findByMemberId(memberId: string): Promise<MemberAccount | null>`
  - `existsByMemberId(memberId: string): Promise<boolean>`

### Paso 6: Capa de aplicación — Commands, Queries y DTOs

Crear en `api/src/treasury/application/`:

**Commands:**
- **`CreateSubscriptionCommand`**: `{ memberAccountId, feePlanId, typeDiscount, personalDiscount, personalDiscountReason }`
- **`ChangePlanCommand`**: `{ memberAccountId, currentSubscriptionId, newFeePlanId, effectiveDate, maintainDiscount }`
- **`UpdateDiscountCommand`**: `{ memberAccountId, subscriptionId, newPersonalDiscount, reason, approvedBy }`
- **`CloseSubscriptionCommand`**: `{ memberAccountId, subscriptionId, cancelReason }`

**Queries:**
- **`GetSubscriptionsQuery`**: `{ memberAccountId }`
- **`GetActiveSubscriptionQuery`**: `{ memberAccountId }`

**DTOs:**
- **`CreateSubscriptionDto`**: DTO de entrada: `@IsUUID()` feePlanId, `@IsNumber()` `@Min(0)` `@Max(0.99)` typeDiscount, `@IsOptional()` `@IsNumber()` `@Min(0)` `@Max(0.99)` personalDiscount, `@IsOptional()` `@IsString()` personalDiscountReason
- **`ChangePlanDto`**: DTO de entrada: `@IsUUID()` newFeePlanId, `@IsDateString()` effectiveDate, `@IsOptional()` `@IsBoolean()` maintainDiscount
- **`UpdateDiscountDto`**: DTO de entrada: `@IsNumber()` `@Min(0)` `@Max(0.99)` newPersonalDiscount, `@IsNotEmpty()` reason, `@IsOptional()` approvedBy
- **`CloseSubscriptionDto`**: DTO de entrada: `@IsEnum(SubscriptionCancelReason)` cancelReason
- **`SubscriptionResponseDto`**: DTO de salida: `id`, `feePlanId`, `feePlanName`, `feePlanCode`, `registrationDate`, `leaveDate`, `typeDiscount`, `personalDiscount`, `effectiveAmount` (centavos), `effectiveAmountFormatted` (euros), `cancelReason`, `isActive`
- **`SubscriptionHistoryResponseDto`**: DTO de salida: `memberAccountId`, `memberId`, `activeSubscription: SubscriptionResponseDto | null`, `history: SubscriptionResponseDto[]`

### Paso 7: Capa de aplicación — Handlers

**`CreateSubscriptionHandler`:**

1. Buscar `MemberAccount` por ID (o crear si no existe)
2. Buscar `FeePlan` por ID (`feePlanRepository.findById()`)
   - Si no existe o inactivo → error 404
3. Verificar que el plan está vinculado al tipo de socio del miembro via `MemberTypeFeePlanRepository`
   - Si no vinculado → error 422 "El plan '{name}' no está disponible para tipo '{tipo}'" (FE-4)
4. Crear `Discount` con validación (typeDiscount + personalDiscount < 1.0)
   - Si >= 1.0 → error 422 "El descuento total no puede ser 100% o superior" (FE-2)
5. Crear `FeeSubscription` via factory (calcula effectiveAmount multiplicativo en centavos)
6. Ejecutar `memberAccount.addSubscription(subscription, feePlan.type)`
   - Si ya existe periódica activa → error 422 "Ya existe una suscripción activa" (FE-3)
7. Guardar via `memberAccountRepository.save(memberAccount)`
8. Publicar `SubscriptionCreated` via Outbox
9. Retornar `SubscriptionResponseDto`

**En caso de fallo:**
- Reportar excepción vía `ErrorReporter.captureException()` con contexto

**`ChangePlanHandler`:**

1. Buscar `MemberAccount` y verificar que la suscripción actual existe y está activa
2. Buscar nuevo `FeePlan`
3. Determinar descuento: si `maintainDiscount = true`, usar el descuento actual; si no, usar descuento por tipo del socio
4. Crear nueva `FeeSubscription` con el nuevo plan
5. Ejecutar `memberAccount.changePlan(currentSubscriptionId, newSubscription, effectiveDate, newPlanType)`
6. Guardar todo en transacción
7. Publicar `SubscriptionClosed` (plan anterior) + `SubscriptionCreated` (plan nuevo) via Outbox
8. Retornar respuesta con datos del cambio

**`UpdateDiscountHandler`:**

1. Buscar `MemberAccount` y suscripción activa
2. Crear nuevo `Discount` (mantener typeDiscount, actualizar personalDiscount)
3. Buscar `FeePlan` para obtener baseAmount
4. Ejecutar `memberAccount.updateSubscriptionDiscount(subscriptionId, newDiscount, baseAmount)`
5. Guardar via repository
6. Publicar `SubscriptionModified` via Outbox
7. Retornar respuesta con nuevo effectiveAmount

**Nota sobre cargos:** Los cargos YA GENERADOS mantienen su importe original. Solo los cargos FUTUROS se generarán con el nuevo `effectiveAmount`.

**`CloseSubscriptionHandler`:**

1. Buscar `MemberAccount` y suscripción activa
2. Ejecutar `memberAccount.closeSubscription(subscriptionId, cancelReason, now())`
3. Guardar via repository
4. Publicar `SubscriptionClosed` via Outbox
5. Retornar confirmación

### Paso 8: Capa de infraestructura — Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model MemberAccount {
  id              String    @id @default(uuid()) @db.Uuid
  member_id       String    @unique @db.Uuid
  created_at      DateTime  @default(now())

  subscriptions   FeeSubscription[]
  charges         Charge[]
  payments        Payment[]

  @@map("member_accounts")
}

model FeeSubscription {
  id                      String    @id @default(uuid()) @db.Uuid
  member_account_id       String    @db.Uuid
  fee_plan_id             String    @db.Uuid
  registration_date       DateTime  @db.Date
  leave_date              DateTime? @db.Date
  type_discount           Decimal   @default(0) @db.Decimal(5,4)
  personal_discount       Decimal   @default(0) @db.Decimal(5,4)
  personal_discount_reason String?  @db.VarChar(500)
  effective_amount        Int       @default(0)
  cancel_reason           String?   @db.VarChar(30)
  created_at              DateTime  @default(now())

  memberAccount           MemberAccount @relation(fields: [member_account_id], references: [id])
  feePlan                 FeePlan       @relation(fields: [fee_plan_id], references: [id])

  @@index([member_account_id, leave_date])
  @@map("fee_subscriptions")
}
```

Nota: `effective_amount` almacena centavos (integer). Los descuentos usan `Decimal(5,4)` para precisión (ej: 0.3000 = 30%). Agregar relación en modelo `FeePlan`: `subscriptions FeeSubscription[]`.

### Paso 9: Capa de infraestructura — Repository (Prisma) y Puertos

Crear en `api/src/treasury/infrastructure/persistence/`:

- **`PrismaMemberAccountRepository`**: Implementa `MemberAccountRepository` usando `PrismaTenantService.getClient(tenantId)`. Incluye eager loading de `subscriptions` al obtener la cuenta. Mappers: `MemberAccountPrismaMapper.toDomain(prismaModel): MemberAccount` y `toPersistence(aggregate): PrismaCreateInput`
- La conexión se obtiene del tenant activo en el request (vía `PrismaTenantService`)

Crear en `api/src/treasury/infrastructure/ports/`:

- **`PrismaMemberQueryAdapter`**: Implementa `MemberQueryPort`. Consulta la tabla `members` de la BD del tenant via `PrismaTenantService`. NO importa repositorios de BC-Membership

### Paso 10: Capa de infraestructura — Controller

Crear en `api/src/treasury/infrastructure/controllers/subscriptions.controller.ts`:

| Endpoint | Método | Auth | Permiso | Body/Params | Response |
|----------|--------|------|---------|-------------|----------|
| `/api/v1/treasury/member-accounts/:accountId/subscriptions` | POST | JWT | `treasury:subscriptions:create` | `CreateSubscriptionDto` | 201 Created con `SubscriptionResponseDto` |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions` | GET | JWT | `treasury:subscriptions:read` | — | 200 con `SubscriptionHistoryResponseDto` |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/active` | GET | JWT | `treasury:subscriptions:read` | — | 200 con `SubscriptionResponseDto` o 404 |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan` | POST | JWT | `treasury:subscriptions:update` | `ChangePlanDto` | 200 con `{ closedSubscription, newSubscription }` |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount` | PATCH | JWT | `treasury:subscriptions:update` | `UpdateDiscountDto` | 200 con `SubscriptionResponseDto` |
| `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close` | POST | JWT | `treasury:subscriptions:update` | `CloseSubscriptionDto` | 200 con confirmación |

- Swagger decorators para documentación automática
- Errores: 404 Not Found (cuenta o suscripción no encontrada), 422 Unprocessable Entity (descuento >= 100%, plan no vinculado a tipo, suscripción duplicada), 409 Conflict (ya existe suscripción periódica activa)

### Paso 11: Tests

**Tests unitarios (dominio):**
- `Discount.create()` con descuentos válidos → crea instancia
- `Discount.create()` con descuento >= 1.0 → rechazado
- `Discount.calculateEffectiveAmount()` con fórmula multiplicativa → `120€ * 0.70 * 0.90 = 75.60€` (7560 cents)
- `Discount.calculateEffectiveAmount()` verificar que NO da resultado aditivo: `120€ * 0.60 = 72€` (7200 cents) ← este resultado es INCORRECTO
- `FeeSubscription.create()` → suscripción con effectiveAmount precalculado
- `FeeSubscription.close()` → leaveDate y cancelReason establecidos
- `FeeSubscription.close()` con fecha anterior a registrationDate → error
- `MemberAccount.addSubscription()` periódica → añadida, evento emitido
- `MemberAccount.addSubscription()` segunda periódica → rechazada (FE-3)
- `MemberAccount.addSubscription()` única → añadida sin afectar periódica
- `MemberAccount.changePlan()` → cierre de actual + creación de nueva + 2 eventos
- `MemberAccount.updateSubscriptionDiscount()` → descuento actualizado, effectiveAmount recalculado
- `MemberAccount.getActivePeriodicSubscription()` → retorna la correcta
- `MemberAccount.getSubscriptionHistory()` → todas ordenadas por fecha

**Tests unitarios (aplicación):**
- `CreateSubscriptionHandler` con mocks:
  - Caso éxito: suscripción creada con descuento multiplicativo correcto
  - Caso plan no encontrado: 404
  - Caso plan no vinculado a tipo: 422
  - Caso descuento >= 100%: 422
  - Caso ya existe periódica activa: 409
- `ChangePlanHandler`:
  - Caso éxito: suscripción cerrada + nueva creada + eventos publicados
  - Caso suscripción no activa: error
  - Caso mantener descuento: descuento copiado a nueva suscripción
- `UpdateDiscountHandler`:
  - Caso éxito: descuento actualizado, effectiveAmount recalculado
  - Caso nuevo descuento combinado >= 100%: rechazado
- `CloseSubscriptionHandler`:
  - Caso éxito con cada tipo de cancelReason

**Tests de integración:**
- CRUD completo contra BD real (Testcontainers):
  - Crear MemberAccount y añadir suscripción → verificar persistencia
  - Verificar cálculo de effectiveAmount almacenado en centavos
  - Crear segunda suscripción periódica → verificar rechazo
  - Cambiar plan → verificar cierre de anterior y creación de nueva
  - Consultar histórico → verificar orden y completitud
- Verificar descuento multiplicativo con datos reales: base 12000 cents, tipo 30%, personal 10% → effectiveAmount = 7560 cents
- Verificar que `SubscriptionCreated` y `SubscriptionClosed` se registran en outbox
- Verificar constraint de unicidad: `member_account_id + leave_date IS NULL` (solo 1 activa periódica)

## Criterios de aceptación

Derivados de US-045, US-046, US-049, US-050, US-052:

1. **Selección de modalidad en alta (US-045, escenario 1):** Al crear una suscripción para un socio juvenil con plan trimestral de 35€ y descuento tipo 30%, el importeEfectivo es 24.50€ (2450 centavos). El descuento se aplica automáticamente según la configuración del tipo de socio.

2. **Alta con múltiples suscripciones (US-045, escenario 2):** Al completar un alta, se pueden crear una suscripción periódica (trimestral) y una única (inscripción) simultáneamente. Ambas coexisten en la cuenta del socio.

3. **Descuento combinado multiplicativo (US-045, escenario 3 / US-049):** Al aplicar descuento tipo 30% + personalizado 10% sobre base 35€, el efectivo es 22.05€ (`35 * 0.70 * 0.90`), no 21€ (`35 * 0.60`). El sistema NUNCA suma porcentajes.

4. **Cambio de plan con histórico (US-046):** Al cambiar de plan mensual a anual, la suscripción actual se cierra con motivo `PLAN_CHANGE` y se crea una nueva. El histórico muestra ambas suscripciones con sus periodos.

5. **Modificación de descuento (US-049, escenario 3):** Al modificar el descuento de una suscripción activa, los cargos futuros se generarán con el nuevo importe. Los cargos ya generados mantienen su importe original.

6. **Exención total (US-050, escenario 1):** Un socio de honor puede darse de alta sin suscripción de cuota. No se generan cargos.

7. **Exención temporal (US-050, escenario 2):** Se puede cerrar una suscripción con motivo `EXEMPTION` durante un periodo determinado. No se generan cargos durante la exención.

8. **Histórico completo (US-052):** Se puede consultar el timeline de suscripciones de un socio mostrando: periodo, plan, importe efectivo y motivo de baja para cada suscripción.

9. **Descuento no puede superar 99% (FE-2):** Si el descuento combinado alcanza o supera 100%, el sistema rechaza la operación.

10. **Solo 1 suscripción periódica activa (FE-3):** Si ya existe una suscripción periódica activa, no se puede crear otra. El sistema indica que debe cerrar o cambiar de plan.
