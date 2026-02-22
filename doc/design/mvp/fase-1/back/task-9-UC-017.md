# Task 9 — UC-017: Configuración de planes de cuota (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-017
- **Bounded Context:** BC-Treasury
- **Application Service:** `FeePlanService`
- **Aggregates:** `FeePlan`, `MemberTypeFeePlan` (relación N:M)
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `FeePlan` con Value Objects (`Money`, `Frequency`, `PlanType`, `BillingMonths`, `FeePlanCode`)
- Entity `MemberTypeFeePlan` (relación N:M entre planes y tipos de socio)
- Application Service `FeePlanService` con CRUD completo de planes de cuota
- Validación de código único por tenant
- Validación de tipo de plan: si `RECURRING` → `billingMonths` no vacío; si `ONE_TIME` → `billingMonths` vacío
- Validación de meses de cobro dentro del rango [1-12] (FE-4)
- Validación de importe >= 0 (permite 0 para planes especiales/exentos)
- Vinculación de planes a tipos de socio con `isDefault` y `orden` (US-044)
- Plantillas predefinidas por tipo de colectividad: Peñas, Cofradías, Clubes deportivos (FA-1)
- Inactivación de planes sin eliminación física (FE-2: planes con suscripciones activas)
- Puerto `MemberTypeQueryPort` para consultar tipos de socio de BC-Membership
- Domain Events: `FeePlanCreated`, `FeePlanModified`, `FeePlanLinkedToMemberType`
- Endpoints REST:
  - `POST /api/v1/treasury/fee-plans`
  - `GET /api/v1/treasury/fee-plans`
  - `GET /api/v1/treasury/fee-plans/:id`
  - `PUT /api/v1/treasury/fee-plans/:id`
  - `PATCH /api/v1/treasury/fee-plans/:id/deactivate`
  - `POST /api/v1/treasury/fee-plans/:id/link-member-types`
  - `GET /api/v1/treasury/fee-plans/templates`
  - `POST /api/v1/treasury/fee-plans/import-template`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Gestión de suscripciones de cuota (UC-018)
- Generación de cargos (UC-019)
- UI de configuración de planes (se implementa en task frontend UC-017)
- Descuentos a nivel de suscripción individual (UC-018)
- Planes con periodicidad según calendario litúrgico (simplificado para MVP)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel (AggregateRoot, Entity, ValueObject, DomainEvent), PrismaTenantService, Prisma schemas (main + tenant), Docker Compose con PostgreSQL |
| **F1-Back Task 1 — UC-001** | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados |
| **F1-Back Task 2 — UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa, `TenantMiddleware` integrado con JWT |
| **F1-Back Task 3 — UC-008** | Aggregate `MemberType` (dominio), modelo `MemberType` en schema tenant Prisma, tipos de socio configurados para vincular planes |

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
- [ ] Los permisos `treasury:fee-plans:create`, `treasury:fee-plans:read`, `treasury:fee-plans:update` existen en los roles seedeados
- [ ] El Aggregate `MemberType` está operativo y existen tipos de socio en BD del tenant

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `FeePlan` (dominio) | UC-018 (suscripciones: consultar plan para calcular importes), UC-019 (generación de cargos: leer billingMonths y amount) |
| Entity `MemberTypeFeePlan` (dominio) | UC-018 (filtrar planes disponibles por tipo de socio), UC-011 (mostrar planes al dar de alta) |
| Modelo `FeePlan` en schema tenant Prisma | Todos los UCs de BC-Treasury que referencien planes de cuota |
| Modelo `MemberTypeFeePlan` en schema tenant Prisma | UC-018 (resolver vinculación plan-tipo) |
| Puerto `MemberTypeQueryPort` | Reutilizable por UC-018, UC-019 para consultar datos de BC-Membership |
| Endpoints REST de planes de cuota | Frontend UC-017, testing manual |
| Evento `FeePlanCreated` | BC-Membership (invalidar caché de planes disponibles) |
| Evento `FeePlanLinkedToMemberType` | BC-Membership (actualizar planes vinculados a tipos) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-017.md` | Flujo completo de creación de planes, vinculación a tipos, plantillas predefinidas, flujos alternativos y excepciones |
| `us/us-043.md` | Criterios de aceptación Gherkin: planes periódicos, trimestrales, únicos, importes no proporcionales |
| `us/us-044.md` | Criterios de aceptación Gherkin: vinculación de planes a tipos con isDefault y orden, planes diferenciados por tipo |
| `bc/bc-treasury.md` | Aggregate FeePlan — estructura, propiedades, invariantes, Value Objects (Money, Frequency, PlanType, BillingMonths) |
| `bc/bc-treasury.md` | Entity MemberTypeFeePlan — estructura, propiedades, invariantes (solo 1 default por tipo) |
| `adr/adr-002.md` | Estrategia multi-tenant por BD, acceso via PrismaTenantService |
| `adr/adr-008.md` | Outbox pattern para Domain Events |

## Puntos críticos

1. **Unicidad de código por tenant.** El código del plan de cuota (`code`) debe ser único dentro de cada tenant. La validación debe hacerse tanto en capa de aplicación como con constraint UNIQUE en BD (implícito al usar BD aislada, UNIQUE sobre `code`). En caso de duplicado, sugerir alternativas con sufijo de año (FE-1: "TRIM-ADULTO" → "TRIM-ADULTO-2025").

2. **Coherencia entre tipo de plan y billingMonths.** Si `type = RECURRING`, `billingMonths` no puede estar vacío (FE-5). Si `type = ONE_TIME`, `billingMonths` debe estar vacío. Además, validar que cada valor en `billingMonths` esté en rango [1-12] (FE-4). La periodicidad (`frequency`) es orientativa; la configuración real reside en `billingMonths`.

3. **Comunicación cross-BC para tipos de socio.** BC-Treasury necesita consultar tipos de socio de BC-Membership para la vinculación de planes. Definir interfaz `MemberTypeQueryPort` en `api/src/treasury/domain/ports/` con métodos `findAll()` y `findById()`. La implementación en infraestructura consulta la BD del tenant directamente (misma BD aislada). NO importar repositorios de BC-Membership.

4. **Solo un plan default por tipo de socio.** En la relación N:M `MemberTypeFeePlan`, solo un registro puede tener `isDefault = true` por cada `memberTypeId`. Implementar validación en capa de aplicación y considerar constraint parcial en BD. Si se intenta marcar un segundo plan como default, desmarcar el anterior automáticamente.

5. **Inactivación vs eliminación de planes.** Un plan con suscripciones activas no puede eliminarse (FE-2). Solo puede marcarse como inactivo (`active = false`). El plan inactivo no aparece en selectores de alta pero las suscripciones existentes conservan su referencia. Implementar con soft-delete lógico.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Importes monetarios con errores de floating point | Alta | Alto | Usar centavos (integer) en Value Object `Money`. `amount` almacena centavos, conversión a euros solo en presentación |
| Plantillas predefinidas no cubren tipos de colectividad reales | Media | Bajo | Permitir personalización completa; las plantillas son punto de partida, no obligatorias |
| Vinculación plan-tipo inconsistente tras desactivar tipo de socio | Baja | Medio | Validar en el handler que el tipo de socio referenciado esté activo al crear vinculación. No bloquear si el tipo se desactiva después (las suscripciones existentes continúan) |
| Consulta de tipos de socio desde BC-Treasury falla si BC-Membership no tiene datos | Baja | Bajo | Retornar lista vacía si no hay tipos. Mostrar mensaje informativo en respuesta |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects

Crear en `api/src/treasury/domain/value-objects/`:

- **`FeePlanId`**: Extiende `Identifier`. UUID v4. Método factory `create(): FeePlanId` y `fromString(id: string): FeePlanId`
- **`FeePlanCode`**: Value Object con validación de formato: 2-20 caracteres alfanuméricos en mayúsculas, guiones permitidos. Método factory `create(value: string): Result<FeePlanCode, FeePlanCodeInvalidError>`. Invariante: no vacío, solo `[A-Z0-9_-]`, longitud 2-20
- **`Money`**: Value Object con `amount: number` (centavos, integer) y `currency: string` (default "EUR"). Método factory `create(amount: number, currency?: string): Result<Money, MoneyInvalidError>`. Invariantes: `amount >= 0`, `currency` ISO 4217 (3 letras). Métodos: `toUnits(): number` (convierte centavos a euros), `add(other: Money): Money`, `subtract(other: Money): Money`, `multiply(factor: number): Money`, `equals(other: Money): boolean`
- **`Frequency`**: Enum VO con valores `MONTHLY`, `QUARTERLY`, `BIANNUAL`, `ANNUAL`, `CUSTOM`. Es orientativo; la configuración real está en `billingMonths`
- **`PlanType`**: Enum VO con valores `ONE_TIME`, `RECURRING`
- **`BillingMonths`**: Value Object que encapsula `months: number[]`. Método factory `create(months: number[]): Result<BillingMonths, BillingMonthsInvalidError>`. Invariantes: cada valor en [1-12], sin duplicados, ordenado. Método `includesMonth(month: number): boolean`. Método `isEmpty(): boolean`

Tests unitarios: validación de `FeePlanCode` (válido, inválido, vacío, demasiado largo), validación de `Money` (positivo, cero, negativo rechazado, operaciones aritméticas en centavos), validación de `BillingMonths` (rango válido, duplicados, valores fuera de rango, array vacío).

### Paso 2: Capa de dominio — Aggregate FeePlan

Crear en `api/src/treasury/domain/aggregates/fee-plan.ts`:

- Propiedades:
  - `id: FeePlanId`
  - `code: FeePlanCode`
  - `name: string`
  - `description: string | null`
  - `type: PlanType`
  - `frequency: Frequency`
  - `amount: Money`
  - `billingMonths: BillingMonths`
  - `active: boolean`
  - `createdAt: Date`
  - `updatedAt: Date`
- Método factory `FeePlan.create(props)`: genera UUID, establece `active = true`, valida invariantes, registra evento `FeePlanCreated`
- Métodos de negocio:
  - `update(props)`: actualiza propiedades, valida invariantes, establece `updatedAt`, registra evento `FeePlanModified`
  - `deactivate()`: marca `active = false`. Invariante: no se puede desactivar si tiene suscripciones activas (verificado en capa de aplicación)
  - `isRecurring(): boolean`: `type === RECURRING`
  - `isOneTime(): boolean`: `type === ONE_TIME`
  - `shouldGenerateChargeForMonth(month: number): boolean`: delega a `billingMonths.includesMonth(month)`
- Invariantes:
  - Código no vacío y formato válido
  - Nombre no vacío
  - Si `type = RECURRING` → `billingMonths` no vacío
  - Si `type = ONE_TIME` → `billingMonths` vacío
  - `amount >= 0`
  - Código único (verificado en capa de aplicación)

Tests unitarios: creación de plan periódico válido, creación de plan único válido, rechazo de plan periódico sin billingMonths, rechazo de plan único con billingMonths, rechazo con código inválido, actualización de propiedades, desactivación, verificación de mes de cobro.

### Paso 3: Capa de dominio — Entity MemberTypeFeePlan

Crear en `api/src/treasury/domain/entities/member-type-fee-plan.ts`:

- Propiedades:
  - `memberTypeId: string` (UUID, referencia a BC-Membership)
  - `feePlanId: FeePlanId`
  - `isDefault: boolean`
  - `order: number`
  - `active: boolean`
- Método factory `MemberTypeFeePlan.create(props)`: crea instancia, valida invariantes
- Invariantes:
  - Solo un plan puede ser `isDefault = true` por `memberTypeId` (verificado en capa de aplicación)
  - `order >= 0`

Tests unitarios: creación válida, valores por defecto correctos.

### Paso 4: Capa de dominio — Domain Events

Crear en `api/src/treasury/domain/events/`:

- **`FeePlanCreatedEvent`**: Extiende `DomainEvent`. Payload: `{ feePlanId: UUID, code: string, name: string, type: string, amount: number, frequency: string }`
- **`FeePlanModifiedEvent`**: Extiende `DomainEvent`. Payload: `{ feePlanId: UUID, modifiedFields: string[], modificationDate: Date }`
- **`FeePlanLinkedToMemberTypeEvent`**: Extiende `DomainEvent`. Payload: `{ feePlanId: UUID, memberTypeId: UUID, isDefault: boolean, linkDate: Date }`

### Paso 5: Capa de dominio — Puertos e interfaces

Crear en `api/src/treasury/domain/ports/`:

- **`MemberTypeQueryPort`** (interfaz):
  - `findAllActive(tenantId: string): Promise<MemberTypeDto[]>`
  - `findById(tenantId: string, memberTypeId: string): Promise<MemberTypeDto | null>`

Crear en `api/src/treasury/domain/repositories/`:

- **`FeePlanRepository`** (interfaz):
  - `save(feePlan: FeePlan): Promise<void>`
  - `findById(id: FeePlanId): Promise<FeePlan | null>`
  - `findByCode(code: FeePlanCode): Promise<FeePlan | null>`
  - `findAll(filter?: { active?: boolean }): Promise<FeePlan[]>`
  - `existsByCode(code: FeePlanCode): Promise<boolean>`
  - `hasActiveSubscriptions(id: FeePlanId): Promise<boolean>`

- **`MemberTypeFeePlanRepository`** (interfaz):
  - `save(link: MemberTypeFeePlan): Promise<void>`
  - `saveMany(links: MemberTypeFeePlan[]): Promise<void>`
  - `findByFeePlanId(feePlanId: FeePlanId): Promise<MemberTypeFeePlan[]>`
  - `findByMemberTypeId(memberTypeId: string): Promise<MemberTypeFeePlan[]>`
  - `findDefault(memberTypeId: string): Promise<MemberTypeFeePlan | null>`
  - `deleteByFeePlanId(feePlanId: FeePlanId): Promise<void>`

### Paso 6: Capa de aplicación — Commands, Queries y DTOs

Crear en `api/src/treasury/application/`:

**Commands:**
- **`CreateFeePlanCommand`**: `{ code, name, description, type, frequency, amount, billingMonths }`
- **`UpdateFeePlanCommand`**: `{ feePlanId, name, description, type, frequency, amount, billingMonths }`
- **`DeactivateFeePlanCommand`**: `{ feePlanId }`
- **`LinkMemberTypesCommand`**: `{ feePlanId, links: Array<{ memberTypeId, isDefault, order }> }`
- **`ImportFeePlanTemplateCommand`**: `{ collectivityType }`

**Queries:**
- **`GetFeePlanQuery`**: `{ feePlanId }`
- **`ListFeePlansQuery`**: `{ active?: boolean }`
- **`GetFeePlanTemplatesQuery`**: `{ collectivityType }`

**DTOs:**
- **`CreateFeePlanDto`**: DTO de entrada con validaciones `class-validator`: `@IsNotEmpty()` para code/name, `@IsEnum(PlanType)` para type, `@IsEnum(Frequency)` para frequency, `@IsInt()` `@Min(0)` para amount (centavos), `@IsArray()` `@ArrayMinSize(1)` para billingMonths (condicional si RECURRING), `@IsOptional()` para description
- **`UpdateFeePlanDto`**: DTO de entrada parcial (mismos campos, opcionales excepto feePlanId)
- **`LinkMemberTypesDto`**: DTO de entrada: `@IsArray()` de objetos con `@IsUUID()` memberTypeId, `@IsBoolean()` isDefault, `@IsInt()` `@Min(0)` order
- **`FeePlanResponseDto`**: DTO de salida: `id`, `code`, `name`, `description`, `type`, `frequency`, `amount` (centavos), `amountFormatted` (euros con 2 decimales), `billingMonths`, `active`, `linkedMemberTypes`, `createdAt`, `updatedAt`
- **`FeePlanTemplateDto`**: DTO de salida para plantillas: `collectivityType`, `templates: Array<{ code, name, type, frequency, amount, billingMonths }>`

### Paso 7: Capa de aplicación — Handlers

**`CreateFeePlanHandler`:**

1. Validar que código no existe (`feePlanRepository.existsByCode(code)`)
   - Si existe → error 409 "Ya existe un plan con el código '{code}'" (FE-1). Sugerir alternativa con sufijo de año
2. Validar coherencia tipo/billingMonths:
   - Si `type = RECURRING` y `billingMonths` vacío → error 422 (FE-5)
   - Si `type = ONE_TIME` y `billingMonths` no vacío → error 422
3. Crear Value Objects: `FeePlanCode`, `Money` (convertir euros a centavos si viene en euros), `BillingMonths`
4. Crear Aggregate `FeePlan` via factory method
5. Guardar via `feePlanRepository.save(feePlan)`
6. Publicar `FeePlanCreated` via Outbox
7. Retornar `FeePlanResponseDto`

**En caso de fallo:**
- Reportar excepción vía `ErrorReporter.captureException()` con contexto del paso fallido

**`UpdateFeePlanHandler`:**

1. Buscar plan por ID (`feePlanRepository.findById(id)`)
2. Si no existe → error 404
3. Si se cambia el código, validar unicidad del nuevo código
4. Validar coherencia tipo/billingMonths (mismas reglas que creación)
5. Ejecutar `feePlan.update(props)`
6. Guardar via `feePlanRepository.save(feePlan)`
7. Publicar `FeePlanModified` via Outbox
8. Retornar `FeePlanResponseDto`

**`DeactivateFeePlanHandler`:**

1. Buscar plan por ID
2. Verificar que no tiene suscripciones activas (`feePlanRepository.hasActiveSubscriptions(id)`)
   - Si tiene → error 422 "No se puede eliminar. Hay X suscripciones activas vinculadas. Marque como inactivo" (FE-2)
3. Ejecutar `feePlan.deactivate()`
4. Guardar via `feePlanRepository.save(feePlan)`
5. Retornar confirmación

**`LinkMemberTypesHandler`:**

1. Buscar plan por ID
2. Para cada vinculación:
   - Verificar que el tipo de socio existe y está activo via `MemberTypeQueryPort.findById()`
   - Si `isDefault = true`, verificar que no hay otro plan default para ese tipo (o desmarcarlo)
3. Crear entidades `MemberTypeFeePlan`
4. Guardar via `memberTypeFeePlanRepository.saveMany(links)`
5. Publicar `FeePlanLinkedToMemberType` por cada vinculación via Outbox
6. Retornar confirmación con número de vinculaciones creadas

**`ImportFeePlanTemplateHandler`:**

1. Obtener plantillas según `collectivityType` (datos estáticos definidos en código)
2. Para cada plantilla: crear `FeePlan` y guardar
3. Retornar lista de planes creados

### Paso 8: Capa de infraestructura — Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model FeePlan {
  id              String    @id @default(uuid()) @db.Uuid
  code            String    @unique @db.VarChar(20)
  name            String    @db.VarChar(100)
  description     String?   @db.Text
  type            String    @db.VarChar(20)
  frequency       String    @db.VarChar(20)
  amount          Int       @default(0)
  billing_months  Int[]
  active          Boolean   @default(true)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  memberTypeLinks MemberTypeFeePlan[]

  @@map("fee_plans")
}

model MemberTypeFeePlan {
  member_type_id  String    @db.Uuid
  fee_plan_id     String    @db.Uuid
  is_default      Boolean   @default(false)
  display_order   Int       @default(0)
  active          Boolean   @default(true)

  feePlan         FeePlan   @relation(fields: [fee_plan_id], references: [id])

  @@id([member_type_id, fee_plan_id])
  @@map("member_type_fee_plans")
}
```

Nota: El campo `amount` almacena centavos (integer) para evitar problemas de floating point. La columna `billing_months` usa array nativo de PostgreSQL (`Int[]`).

### Paso 9: Capa de infraestructura — Repository (Prisma) y Puertos

Crear en `api/src/treasury/infrastructure/persistence/`:

- **`PrismaFeePlanRepository`**: Implementa `FeePlanRepository` usando `PrismaTenantService.getClient(tenantId)`. Incluye mappers dominio<->persistencia
- **`PrismaMemberTypeFeePlanRepository`**: Implementa `MemberTypeFeePlanRepository` usando `PrismaTenantService.getClient(tenantId)`
- Mappers: `FeePlanPrismaMapper.toDomain(prismaModel): FeePlan` y `toPersistence(aggregate): PrismaCreateInput`
- La conexión se obtiene del tenant activo en el request (vía `PrismaTenantService`)

Crear en `api/src/treasury/infrastructure/ports/`:

- **`PrismaMemberTypeQueryAdapter`**: Implementa `MemberTypeQueryPort`. Consulta la tabla `member_types` de la BD del tenant via `PrismaTenantService.getClient(tenantId)`. NO importa repositorios de BC-Membership

### Paso 10: Capa de infraestructura — Plantillas predefinidas

Crear en `api/src/treasury/infrastructure/data/fee-plan-templates.ts`:

- **Peñas:** Mensual (1000 cents = 10€, meses [1..12]), Trimestral (2800 cents = 28€, meses [1,4,7,10]), Anual (10000 cents = 100€, meses [1])
- **Cofradías:** Trimestral (3500 cents = 35€, meses [1,4,7,10]), Semestral (6500 cents = 65€, meses [1,7]), Anual (12000 cents = 120€, meses [1])
- **Clubes deportivos:** Temporada (15000 cents = 150€, meses [9]), Mensual (1500 cents = 15€, meses [9,10,11,12,1,2,3,4,5,6,7,8])

### Paso 11: Capa de infraestructura — Controller

Crear en `api/src/treasury/infrastructure/controllers/fee-plans.controller.ts`:

| Endpoint | Método | Auth | Permiso | Body/Params | Response |
|----------|--------|------|---------|-------------|----------|
| `/api/v1/treasury/fee-plans` | POST | JWT | `treasury:fee-plans:create` | `CreateFeePlanDto` | 201 Created con `FeePlanResponseDto` |
| `/api/v1/treasury/fee-plans` | GET | JWT | `treasury:fee-plans:read` | Query: `?active=true` | 200 con `FeePlanResponseDto[]` |
| `/api/v1/treasury/fee-plans/templates` | GET | JWT | `treasury:fee-plans:read` | Query: `?collectivityType=COFRADIA` | 200 con `FeePlanTemplateDto` |
| `/api/v1/treasury/fee-plans/import-template` | POST | JWT | `treasury:fee-plans:create` | `{ collectivityType }` | 201 Created con `FeePlanResponseDto[]` |
| `/api/v1/treasury/fee-plans/:id` | GET | JWT | `treasury:fee-plans:read` | Param: `id` | 200 con `FeePlanResponseDto` |
| `/api/v1/treasury/fee-plans/:id` | PUT | JWT | `treasury:fee-plans:update` | `UpdateFeePlanDto` | 200 con `FeePlanResponseDto` |
| `/api/v1/treasury/fee-plans/:id/deactivate` | PATCH | JWT | `treasury:fee-plans:update` | — | 200 confirmación |
| `/api/v1/treasury/fee-plans/:id/link-member-types` | POST | JWT | `treasury:fee-plans:update` | `LinkMemberTypesDto` | 200 con `{ linkedCount: number }` |

- Swagger decorators para documentación automática
- Errores: 409 Conflict (código duplicado), 404 Not Found (plan no encontrado), 422 Unprocessable Entity (billingMonths inválidos, plan con suscripciones activas)

### Paso 12: Tests

**Tests unitarios (dominio):**
- `FeePlan.create()` con datos válidos (plan periódico) → plan creado + evento emitido
- `FeePlan.create()` con datos válidos (plan único) → plan creado + billingMonths vacío
- `FeePlan.create()` con código inválido → error de validación
- `FeePlan.create()` con plan periódico sin billingMonths → error de validación
- `FeePlan.create()` con plan único con billingMonths → error de validación
- `FeePlanCode.create()` → validación de formato (válido, vacío, demasiado largo, caracteres especiales)
- `Money.create()` → validación de importe (positivo, cero válido, negativo rechazado)
- `Money.toUnits()` → conversión de centavos a euros correcta (1234 → 12.34)
- `Money.add()` → suma correcta en centavos
- `BillingMonths.create()` → validación de meses (rango [1-12], duplicados rechazados, vacío aceptado)
- `BillingMonths.includesMonth()` → evaluación correcta
- `FeePlan.shouldGenerateChargeForMonth()` → delegación correcta a BillingMonths
- `FeePlan.deactivate()` → desactivación exitosa
- `MemberTypeFeePlan.create()` → creación válida

**Tests unitarios (aplicación):**
- `CreateFeePlanHandler` con mock de `FeePlanRepository`:
  - Caso éxito: plan periódico creado con datos válidos
  - Caso éxito: plan único creado
  - Caso código duplicado: rechazo con 409
  - Caso periódico sin billingMonths: rechazo con 422
- `UpdateFeePlanHandler`:
  - Caso éxito: plan actualizado
  - Caso plan no encontrado: 404
  - Caso código duplicado en cambio: 409
- `DeactivateFeePlanHandler`:
  - Caso éxito: plan desactivado
  - Caso plan con suscripciones activas: rechazo con 422
- `LinkMemberTypesHandler`:
  - Caso éxito: vinculaciones creadas
  - Caso tipo de socio inexistente: error
  - Caso doble default para mismo tipo: desmarcar anterior
- `ImportFeePlanTemplateHandler`:
  - Caso éxito: plantillas importadas para cada tipo de colectividad

**Tests de integración:**
- CRUD completo contra BD real (Testcontainers):
  - Crear plan periódico → verificar persistencia correcta (amount en centavos, billingMonths como array)
  - Crear plan con código duplicado → verificar rechazo (constraint UNIQUE)
  - Listar planes activos → verificar filtrado
  - Actualizar plan → verificar cambios persistidos
  - Desactivar plan → verificar que no aparece en listado activos
- Vincular plan a tipos de socio → verificar tabla intermedia
  - Verificar constraint de default único por tipo
- Importar plantilla de cofradía → verificar 3 planes creados con configuración correcta
- Verificar que `billing_months` se persiste y recupera correctamente como array PostgreSQL
- Verificar que `amount` se almacena en centavos y la conversión es correcta

## Criterios de aceptación

Derivados de US-043, US-044:

1. **Creación de plan periódico (US-043, escenario 1):** Al crear un plan mensual con importe 15€ y meses de cobro [1..12], el plan queda activo y disponible para vincular a tipos de socio. El importe se almacena internamente como 1500 centavos.

2. **Plan trimestral con ejercicio no natural (US-043, escenario 2):** Al crear un plan trimestral para un club deportivo con meses de cobro [9,12,3,6], el plan generará cargos en septiembre, diciembre, marzo y junio.

3. **Plan de cuota única (US-043, escenario 3):** Al crear un plan de inscripción de tipo UNICA con importe 50€, el plan se crea sin meses de cobro y queda disponible para aplicar en altas.

4. **Planes con importes no proporcionales (US-043, escenario 4):** Se pueden configurar planes con importes independientes (Mensual 12€, Trimestral 35€, Anual 120€) sin requerir proporcionalidad matemática entre ellos.

5. **Vinculación de planes a tipos de socio (US-044, escenario 1):** Al vincular planes al tipo "Adulto" con un plan marcado como default, los 5 planes quedan disponibles y el plan "Anual" aparece preseleccionado al dar de alta un socio de ese tipo.

6. **Planes diferenciados por tipo (US-044, escenario 2):** Cada tipo de socio muestra solo los planes vinculados a él. "Adulto" tiene 4 planes, "Juvenil" tiene 2, "Honor" no tiene planes (exento).

7. **Código duplicado rechazado (FE-1):** Si el código ya existe en el tenant, la creación se rechaza con mensaje de error y sugerencia de alternativa.

8. **Plan periódico sin meses de cobro rechazado (FE-5):** Si el tipo es PERIODICA y billingMonths está vacío, el sistema rechaza la operación con mensaje descriptivo.

9. **Plan con suscripciones activas no eliminable (FE-2):** Un plan con suscripciones activas solo puede desactivarse, no eliminarse. El sistema muestra el número de suscripciones afectadas.
