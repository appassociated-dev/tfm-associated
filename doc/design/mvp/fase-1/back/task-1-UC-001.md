# Task 1 — UC-001: Provisión de nuevo tenant (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-001
- **Bounded Context:** BC-Identity
- **Application Service:** `TenantProvisioningService`
- **Aggregates:** `Tenant`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `Tenant` con Value Objects (`DatosEntidad`, `ConfiguracionTenant`)
- Application Service `TenantProvisioningService` con flujo completo de provisión
- Creación de base de datos aislada por tenant (ADR-002)
- Creación de usuario PostgreSQL con permisos limitados a esa BD (RNF-004)
- Ejecución de migrations del schema tenant en la nueva BD
- Seed de roles predefinidos (Presidente, Secretario, Tesorero, Vocal, Socio) con permisos
- Creación de usuario administrador inicial con rol Presidente
- Registro del tenant en DB-Main (`tenants` registry)
- Domain Events: `TenantProvisioned`, `UserCreated`
- Endpoint REST: `POST /api/v1/tenants`
- Rollback completo en caso de fallo (FE-1)
- Tests unitarios (dominio) + tests de integración (provisión real contra PostgreSQL)

### Excluido

- UI de provisión (se implementa en Fase 3 frontend)
- Envío de email de bienvenida (depende de BC-Communication, fuera del MVP core)
- Configuración personalizada en provisión (FA-2: ejercicio fiscal, branding) — simplificado para MVP
- Límites de tenants por plan de suscripción
- Portal superadmin completo

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel (AggregateRoot, Entity, ValueObject, DomainEvent), PrismaTenantService, PrismaMainService, Prisma schemas (main + tenant), Docker Compose con PostgreSQL |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/domain/aggregate-root.base.ts` existe y exporta la clase `AggregateRoot<TId>`
- [ ] `api/src/shared/domain/value-object.base.ts` existe y exporta la clase `ValueObject<TProps>`
- [ ] `api/src/shared/domain/domain-event.base.ts` existe y exporta la clase `DomainEvent`
- [ ] `api/src/shared/infrastructure/persistence/prisma-main.service.ts` existe y conecta a DB-Main
- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `api/prisma/main/schema.prisma` contiene modelos `Tenant`, `User`, `TenantMembership`, `Role`
- [ ] `api/prisma/tenant/schema.prisma` existe con al menos el modelo `OutboxEvent`
- [ ] `docker compose up` arranca PostgreSQL y la BD `associated_main` está creada
- [ ] `npm run test:unit` ejecuta sin errores en `api/`

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `Tenant` (dominio) | UC-002 (lectura de tenants), UC-004 (roles por tenant) |
| Aggregate `User` (dominio, parcial: creación del admin) | UC-002 (autenticación) |
| Roles predefinidos con permisos insertados en BD | UC-002 (claims JWT), UC-004 (gestión de roles) |
| Endpoint `POST /api/v1/tenants` | Fase 3 frontend UC-001, testing manual |
| BD de tenant provisionada con schema migrado | Todos los UCs de BC-Membership y BC-Treasury |
| Evento `TenantProvisioned` | Handlers de otros BCs (comunicación) |
| Evento `UserCreated` | Handlers de auditoría |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-001.md` | Flujo completo, flujos alternativos, excepciones, eventos |
| `us/us-001.md` | Criterios de aceptación Gherkin (3 escenarios) |
| `bc/bc-identity.md` | Aggregates Tenant, User, Role — estructura y invariantes |
| `adr/adr-002.md` | Estrategia multi-tenant por BD, usuario por tenant |
| `rnf/rnf-004.md` | Criterios de aislamiento: BD independiente, usuario específico, sin WHERE tenant_id |
| `rnft/rnft-004.md` | Implementación con Prisma: PrismaTenantService, SQL de creación de usuario |
| `adr/adr-008.md` | Outbox pattern para Domain Events |

## Puntos críticos

1. **Atomicidad de la provisión.** La creación de BD, usuario PostgreSQL, ejecución de migrations, seed de roles y creación de admin deben completarse como una unidad. Si falla cualquier paso, se ejecuta rollback completo (FE-1): eliminar BD, eliminar usuario PostgreSQL, eliminar registro de `tenants`. Implementar como saga con compensaciones explícitas.

2. **Aislamiento de usuario PostgreSQL.** Cada tenant debe tener su propio usuario de BD con `GRANT CONNECT` exclusivamente sobre su BD. Verificar que el usuario NO tiene acceso a `associated_main` ni a BDs de otros tenants. Este es un requisito de RNF-004 con criterios de aceptación explícitos (US-001, escenario 2).

3. **Unicidad de CIF.** El CIF es un identificador fiscal único en España. La validación debe incluir: formato correcto (letra + 7 dígitos + letra de control, o variantes), unicidad en tabla `tenants`. Rechazo bloqueante si duplicado (FA-1).

4. **Migrations del schema tenant.** El schema tenant (`api/prisma/tenant/schema.prisma`) se aplica a cada nueva BD de tenant durante la provisión. Este mecanismo debe ser robusto: usar `prisma migrate deploy` (no `dev`) sobre la conexión dinámica. Las migrations deben ser versionadas e idempotentes.

5. **Permisos granulares de los roles predefinidos.** Los roles de sistema se seedean con permisos específicos en formato `{module}:{resource}:{action}` (ADR-007). La lista completa de permisos debe cubrir todos los UCs del MVP. Los roles de sistema son inmutables (`is_system = true`).

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| `prisma migrate deploy` falla sobre conexión dinámica | Media | Alto | Testear con Testcontainers creando BD temporal + aplicando migrations |
| Rollback de creación de BD falla parcialmente | Baja | Alto | Implementar compensaciones idempotentes (IF EXISTS). Log detallado de cada paso |
| Pool de conexiones se agota durante provisión | Baja | Medio | Usar conexión directa (no pooled) para operaciones DDL de provisión |
| Permisos de roles incompletos para UCs futuros | Media | Bajo | Definir permisos para todos los UCs del MVP en el seed inicial; son extensibles |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects

Crear en `api/src/identity/domain/value-objects/`:

- **`TenantId`**: Extiende `Identifier`. UUID v4. Método factory `create(): TenantId` y `fromString(id: string): TenantId`
- **`Cif`**: Value Object con validación de formato CIF español. Método factory `create(value: string): Result<Cif, CifInvalidError>`. Invariante: formato válido (letra + 7 dígitos + control)
- **`Slug`**: Value Object derivado del nombre. Método `fromName(name: string): Slug`. Lowercase, sin espacios (reemplazados por `-`), sin caracteres especiales
- **`TenantStatus`**: Enum VO con valores `ACTIVE`, `SUSPENDED`, `DEPROVISIONED`
- **`CollectivityType`**: Enum VO con valores `PENA`, `COFRADIA`, `CLUB_DEPORTIVO`, `ASOCIACION_CULTURAL`

Tests unitarios: validación de CIF (válido, inválido, vacío), generación de Slug (con tildes, espacios, caracteres especiales).

### Paso 2: Capa de dominio — Aggregate Tenant

Crear en `api/src/identity/domain/aggregates/tenant.ts`:

- Propiedades: `id: TenantId`, `name: string`, `slug: Slug`, `cif: Cif`, `type: CollectivityType`, `status: TenantStatus`, `databaseName: string`, `contactEmail: string`, `createdAt: Date`
- Método factory `Tenant.create(props)`: genera UUID, calcula slug, calcula `databaseName` como `associated_{tenantId}`, establece status `ACTIVE`, registra evento `TenantProvisioned`
- Invariantes:
  - CIF válido y no vacío
  - Nombre no vacío
  - Slug único (verificado en capa de aplicación)
  - CIF único (verificado en capa de aplicación)

Tests unitarios: creación de tenant válido, rechazo con CIF inválido, generación correcta de slug y databaseName, emisión de evento `TenantProvisioned`.

### Paso 3: Capa de dominio — Domain Events

Crear en `api/src/identity/domain/events/`:

- **`TenantProvisionedEvent`**: Extiende `DomainEvent`. Payload: `{ tenantId, organizationName, organizationType, adminUserId, adminEmail, cif }`
- **`UserCreatedEvent`**: Extiende `DomainEvent`. Payload: `{ userId, email, role, tenantId, createdAt }`

### Paso 4: Capa de dominio — Repository interfaces

Crear en `api/src/identity/domain/repositories/`:

- **`TenantRepository`** (interfaz):
  - `save(tenant: Tenant): Promise<void>`
  - `findById(id: TenantId): Promise<Tenant | null>`
  - `findByCif(cif: Cif): Promise<Tenant | null>`
  - `findBySlug(slug: Slug): Promise<Tenant | null>`
  - `existsByCif(cif: Cif): Promise<boolean>`

### Paso 5: Capa de aplicación — Commands y DTOs

Crear en `api/src/identity/application/`:

- **`ProvisionTenantCommand`**: Command con `name`, `collectivityType`, `cif`, `contactEmail`, `adminName`, `adminEmail`, `adminPassword`
- **`ProvisionTenantDto`**: DTO de entrada (validación con `class-validator`): `@IsNotEmpty()`, `@IsEmail()`, `@MinLength(8)` para password, `@IsEnum(CollectivityType)`
- **`TenantProvisionedResponseDto`**: DTO de salida: `tenantId`, `slug`, `adminUserId`

### Paso 6: Capa de aplicación — TenantProvisioningService

Crear en `api/src/identity/application/commands/provision-tenant.handler.ts`:

Flujo del handler:

1. Validar que CIF no existe (`tenantRepository.existsByCif(cif)`)
2. Crear Aggregate `Tenant` via factory method
3. **Crear BD de tenant**:
   - Ejecutar SQL: `CREATE DATABASE associated_{tenantId}`
   - Ejecutar SQL: `CREATE USER tenant_{tenantId} WITH PASSWORD '{generated}'`
   - Ejecutar SQL: `GRANT CONNECT ON DATABASE associated_{tenantId} TO tenant_{tenantId}`
   - Ejecutar SQL: `REVOKE ALL ON DATABASE associated_main FROM tenant_{tenantId}`
4. **Aplicar migrations** del schema tenant sobre la nueva BD
5. **Seed de roles predefinidos** (5 roles con permisos):
   - `PRESIDENT`: todos los permisos
   - `SECRETARY`: `membership:*`, `documents:*`, `communication:*`
   - `TREASURER`: `treasury:*`, `membership:members:read`
   - `BOARD_MEMBER`: configurable (vacío inicialmente)
   - `MEMBER`: `membership:members:read:own`, `treasury:payments:read:own`
6. **Crear usuario administrador** con hash Argon2 del password, asociar con `TenantMembership` + rol `PRESIDENT`
7. **Registrar tenant** en DB-Main (tabla `tenants`)
8. **Publicar Domain Events**: `TenantProvisioned`, `UserCreated` via Outbox
9. Retornar `TenantProvisionedResponseDto`

**En caso de fallo** en cualquier paso ≥ 3:
- Compensación: `DROP DATABASE IF EXISTS associated_{tenantId}`
- Compensación: `DROP USER IF EXISTS tenant_{tenantId}`
- Compensación: `DELETE FROM tenants WHERE id = {tenantId}`
- Reportar excepción vía `ErrorReporter.captureException()` con contexto del paso fallido y compensaciones ejecutadas

### Paso 7: Capa de infraestructura — TenantRepository (Prisma)

Crear en `api/src/identity/infrastructure/persistence/`:

- **`PrismaTenantRepository`**: Implementa `TenantRepository` usando `PrismaMainService`
- Mappers: `TenantPrismaMapper.toDomain(prismaModel): Tenant` y `toPersistence(aggregate): PrismaCreateInput`

### Paso 8: Capa de infraestructura — DatabaseProvisioningService

Crear en `api/src/identity/infrastructure/services/`:

- **`DatabaseProvisioningService`**: Servicio de infraestructura que encapsula las operaciones DDL de PostgreSQL (CREATE DATABASE, CREATE USER, GRANT, migrations)
- Este servicio usa una conexión directa a PostgreSQL (no pooled) para operaciones DDL
- Métodos:
  - `createTenantDatabase(tenantId: string): Promise<void>`
  - `createTenantDbUser(tenantId: string): Promise<{ username: string, password: string }>`
  - `runMigrations(databaseUrl: string): Promise<void>`
  - `rollback(tenantId: string): Promise<void>`

### Paso 9: Capa de infraestructura — Controller

Crear en `api/src/identity/infrastructure/controllers/`:

- **`TenantsController`**:
  - `POST /api/v1/tenants` → `ProvisionTenantCommand`
  - Protegido con guard de superadmin (para MVP, verificar un API key o credencial especial en header)
  - Swagger decorators para documentación automática
  - Response: 201 Created con `TenantProvisionedResponseDto`
  - Errors: 409 Conflict (CIF duplicado), 500 (fallo de provisión)

### Paso 10: Tests

**Tests unitarios (dominio):**
- `Tenant.create()` con datos válidos → Tenant creado + evento emitido
- `Tenant.create()` con CIF inválido → error de validación
- `Cif.create()` → validación de formato CIF español
- `Slug.fromName()` → normalización correcta

**Tests unitarios (aplicación):**
- `ProvisionTenantHandler` con mock de `TenantRepository` y `DatabaseProvisioningService`
- Caso éxito: flujo completo
- Caso CIF duplicado: rechazo antes de crear BD
- Caso fallo en BD: rollback ejecutado

**Tests de integración:**
- Provisión real contra PostgreSQL (Testcontainers)
- Verificar que la BD de tenant se crea con el schema correcto
- Verificar que el usuario PostgreSQL solo tiene acceso a su BD
- Verificar que los roles se seedean correctamente
- Verificar que el admin puede autenticarse (preparación para UC-002)

## Criterios de aceptación

Derivados de US-001:

1. **Creación de tenant con BD aislada:** Al crear una colectividad, se provisiona una BD independiente con un usuario de conexión específico con permisos limitados exclusivamente a esa BD.

2. **Imposibilidad de acceso cruzado:** Un usuario de conexión de un tenant no puede acceder a datos de otro tenant. La conexión está vinculada a una sola BD.

3. **Sin WHERE tenant_id en queries:** La arquitectura de BD separada por tenant elimina la necesidad de filtros `WHERE tenant_id` en las queries. La conexión ya está aislada.

4. **Rollback ante fallo:** Si falla cualquier paso de la provisión, el sistema ejecuta rollback completo y muestra error descriptivo.

5. **CIF duplicado rechazado:** Si el CIF ya existe en otro tenant, la provisión se rechaza con mensaje de error.
