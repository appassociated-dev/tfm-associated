# Task 3 — UC-008: Configuración de tipos de socio (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-008
- **Bounded Context:** BC-Membership
- **Application Service:** `MemberTypeService`
- **Aggregates:** `MemberType`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `MemberType` con Value Objects (`AgeRange`, `MemberTypeCode`, `RulesConfig`)
- Application Service `MemberTypeService` con CRUD completo de tipos de socio
- Validación de rangos de edad (`edad_min < edad_max`)
- Validación de coherencia de antigüedades (`seniorityForVoting <= seniorityForOffice`)
- Adaptación de formulario según tipo de colectividad (Cofradía, Peña, Club Deportivo, Asociación Cultural)
- Plantillas predefinidas por tipo de colectividad (FA-1)
- Motor de reglas configurables por tipo (US-019): evaluación de edad, derechos de voto, elegibilidad para cargos, transiciones automáticas
- Domain Service `MemberTypeRulesEvaluator` para lógica de evaluación de reglas
- Inactivación de tipos (FA-3): marcar como inactivo sin eliminar
- Domain Events: `MemberTypeCreated`
- Endpoints REST:
  - `POST /api/v1/member-types`
  - `GET /api/v1/member-types`
  - `GET /api/v1/member-types/:id`
  - `PUT /api/v1/member-types/:id`
  - `PATCH /api/v1/member-types/:id/deactivate`
  - `GET /api/v1/member-types/templates`
  - `POST /api/v1/member-types/import-template`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Vinculación de tipos de socio con planes de cuota (UC-017, BC-Treasury)
- Generación de cuotas por tipo (BC-Treasury)
- UI de configuración de tipos (se implementa en task frontend UC-008)
- Validación de requisitos federativos en alta de socio (se valida en UC-006 usando las reglas aquí configuradas)
- Ejecución de transiciones automáticas por edad (se ejecuta en UC-010 — Apertura de ejercicio)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel (AggregateRoot, Entity, ValueObject, DomainEvent), PrismaTenantService, Prisma schemas (main + tenant), Docker Compose con PostgreSQL |
| **F1-Back Task 1 — UC-001** | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados |
| **F1-Back Task 2 — UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa, `TenantMiddleware` integrado con JWT |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/domain/aggregate-root.base.ts` existe y exporta la clase `AggregateRoot<TId>`
- [ ] `api/src/shared/domain/value-object.base.ts` existe y exporta la clase `ValueObject<TProps>`
- [ ] `api/src/shared/domain/domain-event.base.ts` existe y exporta la clase `DomainEvent`
- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` funciona correctamente
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` funciona correctamente
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] El endpoint `POST /api/v1/tenants` funciona y crea un tenant con BD aislada
- [ ] Los endpoints de auth (`/api/v1/auth/*`) funcionan y emiten JWT con claims correctos
- [ ] `api/prisma/tenant/schema.prisma` existe con al menos el modelo `OutboxEvent`
- [ ] Los permisos `membership:member-types:create`, `membership:member-types:read`, `membership:member-types:update` existen en los roles seedeados

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `MemberType` (dominio) | UC-006 (alta de socio: validar tipo), UC-010 (transiciones automáticas por edad), UC-011 (asignación de tipo en registro) |
| Domain Service `MemberTypeRulesEvaluator` | UC-006 (validar requisitos de edad en alta), UC-010 (calcular transiciones), UC-007 (verificar derechos según tipo) |
| Plantillas predefinidas por colectividad | UC-008 frontend (selector de plantillas) |
| Modelo `MemberType` en schema tenant Prisma | Todos los UCs de BC-Membership que referencien tipos de socio |
| Endpoints REST de tipos de socio | Frontend UC-008, testing manual |
| Evento `MemberTypeCreated` | BC-Treasury (vincular planes de cuota) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-008.md` | Flujo completo, formularios por tipo de colectividad, motor de reglas, flujos alternativos y excepciones |
| `us/us-015.md` | Tipos de socio para cofradías: Numerario, Honorario, Aspirante, MenorEdad; carencias de voto y elegibilidad |
| `us/us-016.md` | Tipos de socio para peñas: Adulto, Juvenil, Infantil, Honor; transiciones automáticas por edad |
| `us/us-017.md` | Tipos de socio para clubes deportivos: SocioClub, DeportistaFederado, SocioDeportista, Familiar; requisitos federativos |
| `us/us-018.md` | Tipos de socio para asociaciones culturales: Ordinario, Fundador, Honorario, Protector; derechos diferenciados |
| `us/us-019.md` | Motor de reglas por tipo: edad, voto, elegibilidad, carencia, transición automática; evaluación condicional |
| `bc/bc-membership.md` | Aggregate MemberType — estructura, propiedades, invariantes, Value Objects (AgeRange, FeeConfiguration) |

## Puntos críticos

1. **Unicidad de código por tenant.** El código del tipo de socio (`code`) debe ser único dentro de cada tenant. La validación debe hacerse tanto en capa de aplicación como con constraint UNIQUE en BD (`tenant_id` está implícito al usar BD aislada, por lo que el UNIQUE es solo sobre `code`). En caso de duplicado, sugerir alternativas (FE-1).

2. **Coherencia de rangos de edad.** Si se definen `ageRangeMin` y `ageRangeMax`, debe cumplirse `ageRangeMin < ageRangeMax`. Además, los rangos entre tipos no deben solaparse si hay transiciones automáticas configuradas (por ejemplo, Juvenil 18-34 → Adulto 35+). El sistema debe advertir si detecta huecos o solapamientos, pero no bloquear.

3. **Motor de reglas como JSON en `rulesConfig`.** Las reglas específicas por tipo de colectividad se almacenan como JSON en la columna `rules_config` del modelo `MemberType`. Esto permite flexibilidad sin alterar el schema. El `MemberTypeRulesEvaluator` debe parsear y validar este JSON al crear/actualizar un tipo. Definir un schema JSON estricto para cada tipo de colectividad.

4. **Transiciones automáticas: referencia circular.** Al configurar una transición automática (ej: Juvenil → Adulto al cumplir 35 años), el tipo destino debe existir y estar activo. Impedir configuraciones circulares (A → B → A). Validar en el handler de creación/actualización.

5. **Inactivación vs eliminación.** Un tipo con socios asignados históricamente no puede eliminarse (FE-3). Solo puede marcarse como inactivo (`active = false`). El tipo inactivo no aparece en selectores de alta pero los socios existentes conservan su tipo. Implementar con soft-delete lógico.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Schema JSON de `rulesConfig` evoluciona y rompe tipos existentes | Media | Alto | Versionar el schema JSON. Incluir campo `rulesVersion` para migración progresiva |
| Plantillas predefinidas no cubren todos los casos reales | Media | Bajo | Permitir personalización completa; las plantillas son punto de partida, no obligatorias |
| Solapamiento de rangos de edad entre tipos causa ambigüedad en transiciones | Baja | Medio | Advertencia (no bloqueo) al detectar solapamiento; documentar que la prioridad es por orden de creación |
| Tipo inactivo referenciado como destino de transición automática | Baja | Medio | Validar en apertura de ejercicio (UC-010) que el tipo destino esté activo; emitir advertencia si no lo está |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects

Crear en `api/src/membership/domain/value-objects/`:

- **`MemberTypeId`**: Extiende `Identifier`. UUID v4. Método factory `create(): MemberTypeId` y `fromString(id: string): MemberTypeId`
- **`MemberTypeCode`**: Value Object con validación de formato: 2-10 caracteres alfanuméricos en mayúsculas. Método factory `create(value: string): Result<MemberTypeCode, MemberTypeCodeInvalidError>`. Invariante: no vacío, solo `[A-Z0-9_]`, longitud 2-10
- **`AgeRange`**: Value Object con `min: number | null` y `max: number | null`. Método factory `create(min: number | null, max: number | null): Result<AgeRange, AgeRangeInvalidError>`. Invariantes: `min >= 0` (si definido), `max > min` (si ambos definidos), `max <= 120`
- **`RulesConfig`**: Value Object que encapsula el JSON de reglas. Método factory `create(config: object, collectivityType: CollectivityType): Result<RulesConfig, RulesConfigInvalidError>`. Valida schema según tipo de colectividad. Método `evaluate(context: RuleEvaluationContext): RuleEvaluationResult`

Tests unitarios: validación de `MemberTypeCode` (válido, inválido, vacío, demasiado largo), validación de `AgeRange` (rangos válidos, invertidos, negativos, parciales), validación de `RulesConfig` (schema correcto por tipo de colectividad, schema inválido).

### Paso 2: Capa de dominio — Aggregate MemberType

Crear en `api/src/membership/domain/aggregates/member-type.ts`:

- Propiedades:
  - `id: MemberTypeId`
  - `code: MemberTypeCode`
  - `name: string`
  - `description: string`
  - `ageRange: AgeRange`
  - `votingRight: boolean`
  - `eligibleForOffice: boolean`
  - `minimumSeniorityForVoting: number` (meses)
  - `minimumSeniorityForOffice: number` (meses)
  - `automaticTransitionTargetId: MemberTypeId | null`
  - `rulesConfig: RulesConfig`
  - `active: boolean`
  - `createdAt: Date`
  - `updatedAt: Date`
- Método factory `MemberType.create(props)`: genera UUID, establece `active = true`, valida invariantes, registra evento `MemberTypeCreated`
- Métodos de negocio:
  - `update(props)`: actualiza propiedades, valida invariantes, establece `updatedAt`
  - `deactivate()`: marca `active = false`. Invariante: no puede desactivarse un tipo que es destino de transición automática de otro tipo activo
  - `canAcceptAge(age: number): boolean`: evalúa si la edad está dentro del rango
  - `hasVotingRight(seniorityMonths: number): boolean`: evalúa derecho a voto considerando carencia
  - `isEligibleForOffice(seniorityMonths: number): boolean`: evalúa elegibilidad para cargos
- Invariantes:
  - Código no vacío y formato válido
  - Nombre no vacío
  - `ageRangeMin < ageRangeMax` (si ambos definidos)
  - `minimumSeniorityForVoting <= minimumSeniorityForOffice` (si ambos > 0)
  - Código único (verificado en capa de aplicación)

Tests unitarios: creación de tipo válido, rechazo con código inválido, rechazo con rango de edad invertido, verificación de derechos de voto con/sin carencia, verificación de elegibilidad, desactivación, evaluación de rango de edad.

### Paso 3: Capa de dominio — Domain Events

Crear en `api/src/membership/domain/events/`:

- **`MemberTypeCreatedEvent`**: Extiende `DomainEvent`. Payload: `{ memberTypeId: UUID, code: string, name: string, description: string, tenantId: UUID }`

### Paso 4: Capa de dominio — Domain Service

Crear en `api/src/membership/domain/services/`:

- **`MemberTypeRulesEvaluator`**: Domain Service que evalúa reglas configuradas en el `RulesConfig` de un tipo de socio
  - `evaluateAgeEligibility(memberType: MemberType, birthDate: Date): Result<void, AgeNotEligibleError>`: verifica si la edad cumple el rango del tipo
  - `evaluateVotingRight(memberType: MemberType, registrationDate: Date): VotingRightResult`: evalúa derecho a voto considerando carencia
  - `evaluateOfficeEligibility(memberType: MemberType, registrationDate: Date): OfficeEligibilityResult`: evalúa elegibilidad para cargos
  - `calculatePendingTransitions(memberTypes: MemberType[], members: MemberSnapshot[]): PendingTransition[]`: dado un conjunto de tipos y socios, calcula qué transiciones automáticas deben ejecutarse (usado por UC-010)

### Paso 5: Capa de dominio — Repository interfaces

Crear en `api/src/membership/domain/repositories/`:

- **`MemberTypeRepository`** (interfaz):
  - `save(memberType: MemberType): Promise<void>`
  - `findById(id: MemberTypeId): Promise<MemberType | null>`
  - `findByCode(code: MemberTypeCode): Promise<MemberType | null>`
  - `findAll(filter?: { active?: boolean }): Promise<MemberType[]>`
  - `existsByCode(code: MemberTypeCode): Promise<boolean>`
  - `existsAsTransitionTarget(id: MemberTypeId): Promise<boolean>`

### Paso 6: Capa de aplicación — Commands, Queries y DTOs

Crear en `api/src/membership/application/`:

**Commands:**
- **`CreateMemberTypeCommand`**: `{ code, name, description, ageRangeMin, ageRangeMax, votingRight, eligibleForOffice, minimumSeniorityForVoting, minimumSeniorityForOffice, automaticTransitionTargetId, rulesConfig }`
- **`UpdateMemberTypeCommand`**: `{ memberTypeId, name, description, ageRangeMin, ageRangeMax, votingRight, eligibleForOffice, minimumSeniorityForVoting, minimumSeniorityForOffice, automaticTransitionTargetId, rulesConfig }`
- **`DeactivateMemberTypeCommand`**: `{ memberTypeId }`
- **`ImportTemplateCommand`**: `{ collectivityType }`

**Queries:**
- **`GetMemberTypeQuery`**: `{ memberTypeId }`
- **`ListMemberTypesQuery`**: `{ active?: boolean }`
- **`GetTemplatesQuery`**: `{ collectivityType }`

**DTOs:**
- **`CreateMemberTypeDto`**: DTO de entrada con validaciones `class-validator`: `@IsNotEmpty()` para code/name, `@IsOptional()` para ageRange, `@IsBoolean()` para votingRight/eligibleForOffice, `@IsInt()` `@Min(0)` para antigüedades
- **`UpdateMemberTypeDto`**: DTO de entrada parcial (mismos campos que Create, todos opcionales excepto `memberTypeId`)
- **`MemberTypeResponseDto`**: DTO de salida: `id`, `code`, `name`, `description`, `ageRange`, `votingRight`, `eligibleForOffice`, `minimumSeniorityForVoting`, `minimumSeniorityForOffice`, `automaticTransitionTargetId`, `active`, `createdAt`, `updatedAt`
- **`MemberTypeTemplateDto`**: DTO de salida para plantillas: `collectivityType`, `templates: Array<{ code, name, description, ageRange, votingRight, eligibleForOffice, ... }>`

### Paso 7: Capa de aplicación — Handlers

**`CreateMemberTypeHandler`:**

1. Validar que código no existe (`memberTypeRepository.existsByCode(code)`)
2. Si `automaticTransitionTargetId` proporcionado, validar que el tipo destino existe y está activo
3. Validar coherencia de rangos de edad
4. Crear Aggregate `MemberType` via factory method
5. Guardar via `memberTypeRepository.save(memberType)`
6. Publicar `MemberTypeCreated` via Outbox
7. Retornar `MemberTypeResponseDto`

**En caso de fallo:**
- Reportar excepción vía `ErrorReporter.captureException()` con contexto del paso fallido

**`UpdateMemberTypeHandler`:**

1. Buscar tipo por ID (`memberTypeRepository.findById(id)`)
2. Si no existe → error 404
3. Si se cambia el código, validar unicidad del nuevo código
4. Si se cambia `automaticTransitionTargetId`, validar existencia y no circularidad
5. Ejecutar `memberType.update(props)`
6. Guardar via `memberTypeRepository.save(memberType)`
7. Retornar `MemberTypeResponseDto`

**`DeactivateMemberTypeHandler`:**

1. Buscar tipo por ID
2. Verificar que no es destino de transición automática de otro tipo activo (`memberTypeRepository.existsAsTransitionTarget(id)`)
3. Ejecutar `memberType.deactivate()`
4. Guardar via `memberTypeRepository.save(memberType)`
5. Retornar confirmación

**`ImportTemplateHandler`:**

1. Obtener plantillas según `collectivityType` (datos estáticos definidos en código)
2. Para cada plantilla: crear `MemberType` y guardar
3. Retornar lista de tipos creados

**`ListMemberTypesHandler`:**

1. Consultar `memberTypeRepository.findAll(filter)`
2. Mapear a `MemberTypeResponseDto[]`
3. Retornar lista

### Paso 8: Capa de infraestructura — Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model MemberType {
  id                          String    @id @default(uuid()) @db.Uuid
  code                        String    @unique @db.VarChar(10)
  name                        String    @db.VarChar(100)
  description                 String?   @db.Text
  age_range_min               Int?
  age_range_max               Int?
  voting_right                Boolean   @default(false)
  eligible_for_office         Boolean   @default(false)
  minimum_seniority_for_voting  Int     @default(0)
  minimum_seniority_for_office  Int     @default(0)
  automatic_transition_target_id String? @db.Uuid
  rules_config                Json?
  active                      Boolean   @default(true)
  created_at                  DateTime  @default(now())
  updated_at                  DateTime  @updatedAt

  automaticTransitionTarget   MemberType? @relation("AutoTransition", fields: [automatic_transition_target_id], references: [id])
  transitionSources           MemberType[] @relation("AutoTransition")

  @@map("member_types")
}
```

### Paso 9: Capa de infraestructura — Repository (Prisma)

Crear en `api/src/membership/infrastructure/persistence/`:

- **`PrismaMemberTypeRepository`**: Implementa `MemberTypeRepository` usando `PrismaTenantService.getClient(tenantId)`
- Mappers: `MemberTypePrismaMapper.toDomain(prismaModel): MemberType` y `toPersistence(aggregate): PrismaCreateInput`
- La conexión se obtiene del tenant activo en el request (vía `PrismaTenantService`)

### Paso 10: Capa de infraestructura — Plantillas predefinidas

Crear en `api/src/membership/infrastructure/data/`:

- **`member-type-templates.ts`**: Archivo con las plantillas predefinidas como constantes:
  - **Cofradía:** Numerario (voto, elegible, carencia 2 años), Honorario (sin voto, sin elegibilidad), Aspirante (sin voto, carencia 1 año), MenorEdad (sin voto, edad < 18)
  - **Peña:** Adulto (35+, voto, elegible), Juvenil (18-34, voto, no elegible), Infantil (0-17, sin voto), Honor (sin límite edad, voto, elegible)
  - **Club Deportivo:** SocioClub (voto), DeportistaFederado (licencia requerida, sin voto), SocioDeportista (licencia + voto), Familiar (sin voto)
  - **Asociación Cultural:** Ordinario (voto, actividades), Fundador (voto, actividades, distintivo), Honorario (actividades, sin voto), Protector (voto, actividades, mecenazgo)

### Paso 11: Capa de infraestructura — Controller

Crear en `api/src/membership/infrastructure/controllers/member-types.controller.ts`:

| Endpoint | Método | Auth | Permiso | Body/Params | Response |
|----------|--------|------|---------|-------------|----------|
| `/api/v1/member-types` | POST | JWT | `membership:member-types:create` | `CreateMemberTypeDto` | 201 Created con `MemberTypeResponseDto` |
| `/api/v1/member-types` | GET | JWT | `membership:member-types:read` | Query: `?active=true` | 200 con `MemberTypeResponseDto[]` |
| `/api/v1/member-types/templates` | GET | JWT | `membership:member-types:read` | Query: `?collectivityType=COFRADIA` | 200 con `MemberTypeTemplateDto` |
| `/api/v1/member-types/import-template` | POST | JWT | `membership:member-types:create` | `{ collectivityType }` | 201 Created con `MemberTypeResponseDto[]` |
| `/api/v1/member-types/:id` | GET | JWT | `membership:member-types:read` | Param: `id` | 200 con `MemberTypeResponseDto` |
| `/api/v1/member-types/:id` | PUT | JWT | `membership:member-types:update` | `UpdateMemberTypeDto` | 200 con `MemberTypeResponseDto` |
| `/api/v1/member-types/:id/deactivate` | PATCH | JWT | `membership:member-types:update` | — | 200 confirmación |

- Swagger decorators para documentación automática
- Errores: 409 Conflict (código duplicado), 404 Not Found (tipo no encontrado), 422 Unprocessable Entity (rangos inválidos, transición circular)

### Paso 12: Tests

**Tests unitarios (dominio):**
- `MemberType.create()` con datos válidos → tipo creado + evento emitido
- `MemberType.create()` con código inválido → error de validación
- `MemberType.create()` con rango de edad invertido → error de validación
- `MemberTypeCode.create()` → validación de formato (válido, vacío, demasiado largo, caracteres especiales)
- `AgeRange.create()` → validación de rangos (válido, invertido, negativos, parciales)
- `MemberType.hasVotingRight()` → evaluación con/sin carencia cumplida
- `MemberType.isEligibleForOffice()` → evaluación con/sin antigüedad suficiente
- `MemberType.canAcceptAge()` → evaluación dentro/fuera del rango
- `MemberType.deactivate()` → desactivación exitosa
- `MemberTypeRulesEvaluator.evaluateAgeEligibility()` → edad dentro/fuera de rango
- `MemberTypeRulesEvaluator.evaluateVotingRight()` → con carencia cumplida/no cumplida
- `MemberTypeRulesEvaluator.calculatePendingTransitions()` → detección correcta de transiciones

**Tests unitarios (aplicación):**
- `CreateMemberTypeHandler` con mock de `MemberTypeRepository`:
  - Caso éxito: tipo creado con datos válidos
  - Caso código duplicado: rechazo con 409
  - Caso transición a tipo inexistente: rechazo con 422
- `UpdateMemberTypeHandler`:
  - Caso éxito: tipo actualizado
  - Caso tipo no encontrado: 404
  - Caso código duplicado en cambio: 409
- `DeactivateMemberTypeHandler`:
  - Caso éxito: tipo desactivado
  - Caso tipo es destino de transición: rechazo con 422
- `ImportTemplateHandler`:
  - Caso éxito: plantillas importadas para cada tipo de colectividad

**Tests de integración:**
- CRUD completo contra BD real (Testcontainers):
  - Crear tipo de socio → verificar persistencia correcta
  - Crear tipo con código duplicado → verificar rechazo
  - Listar tipos activos → verificar filtrado
  - Actualizar tipo → verificar cambios persistidos
  - Desactivar tipo → verificar que no aparece en listado activos
- Importar plantilla de cofradía → verificar 4 tipos creados con configuración correcta
- Verificar constraint UNIQUE sobre `code`
- Verificar que el campo `rules_config` se persiste y recupera correctamente como JSON

## Criterios de aceptación

Derivados de US-015, US-016, US-017, US-018, US-019:

1. **Configuración de tipos para cofradías (US-015):** Al configurar tipos de hermano (Numerario, Honorario, Aspirante, MenorEdad), las reglas de voto y elegibilidad se aplican correctamente según carencia de antigüedad (2 años para voto, 5 años para elegibilidad).

2. **Configuración de tipos para peñas con transiciones (US-016):** Al definir tipos por rango de edad (Adulto 35+, Juvenil 18-34, Infantil 0-17), el sistema valida rangos y permite configurar transiciones automáticas (Juvenil → Adulto al cumplir 35 años).

3. **Configuración de tipos para clubes deportivos (US-017):** Al configurar tipos con requisitos federativos (licencia, seguro, certificado médico), las reglas se almacenan en `rulesConfig` y están disponibles para validación en alta de socio.

4. **Configuración de tipos para asociaciones culturales (US-018):** Al definir tipos con derechos diferenciados (Ordinario con voto, Honorario sin voto, Fundador con distintivo), la configuración se persiste correctamente.

5. **Motor de reglas configurable (US-019):** Las reglas por tipo (edad mínima/máxima, derecho a voto con carencia, elegibilidad con antigüedad, transición automática) se evalúan correctamente. Un socio juvenil con 8 meses de antigüedad y carencia de 12 meses no tiene derecho a voto, indicando "faltan 4 meses".

6. **Plantillas predefinidas (FA-1):** Al crear los primeros tipos, el sistema ofrece plantillas según el tipo de colectividad del tenant (Cofradía, Peña, Club, Asociación). El usuario puede importar la plantilla y ajustar.

7. **Inactivación sin eliminación (FA-3):** Un tipo con socios históricos puede marcarse como inactivo. El tipo no aparece en selectores de alta pero los socios existentes conservan su asignación.

8. **Código duplicado rechazado (FE-1):** Si el código ya existe en el tenant, la creación se rechaza con mensaje de error y sugerencias de alternativas.

9. **Rangos de edad coherentes (FE-2):** Si `edad_min > edad_max`, el sistema bloquea la operación con mensaje descriptivo.
