# Task 4 — UC-010: Gestión de ejercicios (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-010
- **Bounded Context:** BC-Membership
- **Application Service:** `FiscalYearService`
- **Aggregates:** `FiscalYear`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `FiscalYear` con Value Objects (`FiscalYearPeriod`, `FiscalYearStatus`, `FiscalYearType`)
- Application Service `FiscalYearService` con flujos: apertura, cierre, consulta, comparativa
- Apertura de ejercicio con arrastre automático de socios activos del ejercicio anterior (US-024)
- Ejecución de transiciones automáticas de categoría por edad en apertura (US-024, US-027)
- Flexibilidad de tipos de ejercicio: año natural, temporada deportiva, cofrade, personalizado (US-027)
- Validaciones pre-cierre: cuotas conciliadas, remesas cerradas, actas completas (US-025)
- Cierre de ejercicio con generación de evento para memoria (US-025)
- Comparativas entre ejercicios: socios activos, altas, bajas, tasa retención (US-026)
- Concepto de ejercicio como agrupador temporal de datos (US-023)
- Constraint de unicidad: solo un ejercicio abierto a la vez por tenant
- Validación de no solapamiento de fechas entre ejercicios
- Domain Events: `FiscalYearOpened`, `FiscalYearClosed`, `MemberTypeChanged`
- Endpoints REST:
  - `POST /api/v1/fiscal-years`
  - `GET /api/v1/fiscal-years`
  - `GET /api/v1/fiscal-years/:id`
  - `GET /api/v1/fiscal-years/active`
  - `POST /api/v1/fiscal-years/:id/close`
  - `GET /api/v1/fiscal-years/compare`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Generación de PDF de memoria de ejercicio (BC-Documents, proceso asíncrono posterior)
- Generación masiva mensual de cargos (BC-Treasury, activada por evento `FiscalYearOpened`)
- UI de gestión de ejercicios (se implementa en task frontend UC-010)
- Cálculo de fechas cofrades según calendario litúrgico (simplificado para MVP: fechas personalizadas manuales)
- Gráficos de tendencias con Chart.js (frontend)
- Proceso de arrastre parcial o selectivo (en MVP se arrastran todos los activos)

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
- [ ] `api/prisma/tenant/schema.prisma` existe con modelos `OutboxEvent` y `MemberType` (de Task 3)
- [ ] Los permisos `membership:fiscal-years:create`, `membership:fiscal-years:read`, `membership:fiscal-years:close` existen en los roles seedeados

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `FiscalYear` (dominio) | UC-006 (alta de socio vinculada a ejercicio activo), UC-017 (planes de cuota por ejercicio), UC-019 (facturación por ejercicio) |
| Modelo `FiscalYear` en schema tenant Prisma | Todos los UCs que requieran contexto de ejercicio activo |
| Endpoints REST de ejercicios | Frontend UC-010, testing manual |
| Evento `FiscalYearOpened` | BC-Treasury (activar generación mensual de cargos), BC-Documents (crear estructura) |
| Evento `FiscalYearClosed` | BC-Documents (archivar memoria), BC-Communication (notificar Junta) |
| Evento `MemberTypeChanged` (por transiciones automáticas) | BC-Treasury (revisar plan cuota), BC-Communication (notificar socio) |
| Lógica de arrastre de socios activos | Reutilizable en futuros procesos de migración de ejercicio |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-010.md` | Flujo completo de apertura/cierre, configurador de ejercicio, validaciones pre-cierre, comparativas, eventos |
| `us/us-023.md` | Concepto de ejercicio como agrupador temporal: fechas, estado, snapshot de socios, cuotas, eventos, documentación |
| `us/us-024.md` | Apertura con arrastre de socios activos y transiciones automáticas de categoría por edad |
| `us/us-025.md` | Cierre con validaciones (cuotas, remesas, actas) y generación de memoria |
| `us/us-026.md` | Comparativas entre ejercicios: socios activos, altas, bajas, tasa retención, tendencias |
| `us/us-027.md` | Flexibilidad de tipos de ejercicio: año natural, temporada, cofrade, personalizado |
| `bc/bc-membership.md` | Aggregate FiscalYear — estructura, propiedades, invariantes, Value Objects (FiscalYearPeriod) |

## Puntos críticos

1. **Solo un ejercicio abierto a la vez.** Invariante fundamental: no puede haber dos ejercicios con estado `OPEN` simultáneamente en un tenant. Implementar con constraint parcial en BD: `CREATE UNIQUE INDEX idx_fiscal_year_open ON fiscal_years (id) WHERE status = 'OPEN'`. Verificar también en capa de aplicación antes de crear.

2. **Atomicidad del proceso de apertura.** La apertura de ejercicio implica múltiples operaciones: INSERT del ejercicio, arrastre de socios activos (vinculación al nuevo ejercicio), ejecución de transiciones automáticas por edad, inserción de entradas en timeline de socios afectados. Todo debe ejecutarse en una transacción atómica. Si falla cualquier paso, rollback completo.

3. **Transiciones automáticas de categoría por edad.** Al abrir ejercicio, el sistema debe evaluar para cada socio activo si cumple la edad de transición automática de su tipo actual durante el nuevo ejercicio. Usa `MemberTypeRulesEvaluator.calculatePendingTransitions()` de Task 3. Si el tipo destino de la transición está inactivo o no existe, emitir advertencia pero no bloquear la apertura.

4. **No solapamiento de fechas.** Los periodos de ejercicios no deben solaparse. Validar que `(startDate, endDate)` del nuevo ejercicio no intersecte con ningún ejercicio existente. Implementar verificación en capa de aplicación con query que detecte solapamiento.

5. **Cierre con validaciones no bloqueantes.** Las validaciones pre-cierre (cuotas conciliadas, remesas cerradas, actas completas) son advertencias, no bloqueos. El Presidente puede forzar el cierre. Implementar con flag `force: boolean` en el command. Registrar las advertencias ignoradas en el evento `FiscalYearClosed`.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Apertura con muchos socios (>1000) excede timeout de transacción | Media | Alto | Implementar en transacción con timeout configurable. En MVP, procesar en lote (batch de 100). Considerar job asíncrono para tenants grandes |
| Transición automática a tipo inexistente o inactivo | Baja | Medio | Emitir advertencia pero continuar apertura. Registrar socios no transicionados para revisión manual |
| Race condition en constraint de ejercicio abierto único | Baja | Alto | Constraint parcial en BD como última línea de defensa. Verificación previa en aplicación. Usar `SELECT FOR UPDATE` en la verificación |
| Comparativas con ejercicios sin datos estadísticos completos | Media | Bajo | Rellenar con ceros los campos sin datos. Indicar "datos parciales" si el ejercicio no tiene stats completas |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects

Crear en `api/src/membership/domain/value-objects/`:

- **`FiscalYearId`**: Extiende `Identifier`. UUID v4. Método factory `create(): FiscalYearId` y `fromString(id: string): FiscalYearId`
- **`FiscalYearPeriod`**: Value Object con `startDate: Date` y `endDate: Date`. Método factory `create(startDate: Date, endDate: Date): Result<FiscalYearPeriod, FiscalYearPeriodInvalidError>`. Invariantes: `startDate < endDate`, ambas fechas válidas. Método `overlaps(other: FiscalYearPeriod): boolean` para detectar solapamiento. Método `containsDate(date: Date): boolean`
- **`FiscalYearStatus`**: Enum VO con valores `PREPARATION`, `OPEN`, `CLOSED`
- **`FiscalYearType`**: Enum VO con valores `NATURAL_YEAR`, `SPORTS_SEASON`, `CONFRATERNITY`, `CUSTOM`

Tests unitarios: validación de `FiscalYearPeriod` (fechas válidas, invertidas, solapamiento entre periodos, containsDate), enums correctos.

### Paso 2: Capa de dominio — Aggregate FiscalYear

Crear en `api/src/membership/domain/aggregates/fiscal-year.ts`:

- Propiedades:
  - `id: FiscalYearId`
  - `name: string`
  - `type: FiscalYearType`
  - `period: FiscalYearPeriod`
  - `status: FiscalYearStatus`
  - `previousFiscalYearId: FiscalYearId | null`
  - `membersAtStart: number`
  - `membersAtEnd: number | null`
  - `reportId: string | null`
  - `createdAt: Date`
  - `closedAt: Date | null`
- Método factory `FiscalYear.create(props)`: genera UUID, establece `status = PREPARATION`, `membersAtStart = 0`, registra propiedades
- Métodos de negocio:
  - `open(carriedOverMembersCount: number): void`: transiciona a `OPEN`, establece `membersAtStart`, registra evento `FiscalYearOpened`. Invariante: solo desde `PREPARATION`
  - `close(membersAtEnd: number, warnings: string[]): void`: transiciona a `CLOSED`, establece `closedAt`, `membersAtEnd`, registra evento `FiscalYearClosed`. Invariante: solo desde `OPEN`
  - `isOpen(): boolean`: retorna `status === OPEN`
  - `isClosed(): boolean`: retorna `status === CLOSED`
- Invariantes:
  - Solo un ejercicio `OPEN` a la vez (verificado en capa de aplicación + constraint BD)
  - Fechas no solapadas con otros ejercicios (verificado en capa de aplicación)
  - Nombre no vacío
  - `startDate < endDate`
  - No se puede cerrar un ejercicio que no está abierto
  - No se puede abrir un ejercicio que no está en preparación

Tests unitarios: creación de ejercicio válido, apertura exitosa con transición de estado, cierre exitoso con emisión de evento, rechazo de cierre sin apertura previa, rechazo de apertura desde estado cerrado, validación de periodo.

### Paso 3: Capa de dominio — Domain Events

Crear en `api/src/membership/domain/events/`:

- **`FiscalYearOpenedEvent`**: Extiende `DomainEvent`. Payload: `{ fiscalYearId: UUID, name: string, startDate: Date, endDate: Date, carriedOverMembers: number, appliedTransitions: Array<{ memberId: UUID, previousTypeId: UUID, newTypeId: UUID }> }`
- **`FiscalYearClosedEvent`**: Extiende `DomainEvent`. Payload: `{ fiscalYearId: UUID, name: string, membersAtEnd: number, closedAt: Date, warnings: string[] }`
- **`MemberTypeChangedEvent`**: Extiende `DomainEvent`. Payload: `{ memberId: UUID, previousTypeId: UUID, previousTypeName: string, newTypeId: UUID, newTypeName: string, reason: string, fiscalYearId: UUID }`

### Paso 4: Capa de dominio — Repository interfaces

Crear en `api/src/membership/domain/repositories/`:

- **`FiscalYearRepository`** (interfaz):
  - `save(fiscalYear: FiscalYear): Promise<void>`
  - `findById(id: FiscalYearId): Promise<FiscalYear | null>`
  - `findActive(): Promise<FiscalYear | null>`
  - `findAll(): Promise<FiscalYear[]>`
  - `findByName(name: string): Promise<FiscalYear | null>`
  - `existsOpenFiscalYear(): Promise<boolean>`
  - `findOverlapping(period: FiscalYearPeriod): Promise<FiscalYear[]>`

### Paso 5: Capa de aplicación — Commands, Queries y DTOs

Crear en `api/src/membership/application/`:

**Commands:**
- **`OpenFiscalYearCommand`**: `{ name, type, startDate, endDate, previousFiscalYearId?, carryOverMembers: boolean, applyAutomaticTransitions: boolean }`
- **`CloseFiscalYearCommand`**: `{ fiscalYearId, force: boolean }`

**Queries:**
- **`GetFiscalYearQuery`**: `{ fiscalYearId }`
- **`GetActiveFiscalYearQuery`**: `{}`
- **`ListFiscalYearsQuery`**: `{}`
- **`CompareFiscalYearsQuery`**: `{ fiscalYearIds: string[] }`

**DTOs:**
- **`OpenFiscalYearDto`**: DTO de entrada con validaciones: `@IsNotEmpty()` para name, `@IsEnum(FiscalYearType)`, `@IsDateString()` para startDate/endDate, `@IsBoolean()` para carryOverMembers y applyAutomaticTransitions
- **`CloseFiscalYearDto`**: DTO de entrada: `@IsBoolean()` para force
- **`FiscalYearResponseDto`**: DTO de salida: `id`, `name`, `type`, `startDate`, `endDate`, `status`, `membersAtStart`, `membersAtEnd`, `previousFiscalYearId`, `createdAt`, `closedAt`
- **`OpenFiscalYearResultDto`**: DTO de resultado de apertura: `fiscalYear: FiscalYearResponseDto`, `carriedOverMembers: number`, `appliedTransitions: Array<{ memberId, previousType, newType }>`
- **`CloseFiscalYearResultDto`**: DTO de resultado de cierre: `fiscalYear: FiscalYearResponseDto`, `warnings: string[]`
- **`FiscalYearComparisonDto`**: DTO de comparativa: `years: Array<{ fiscalYearId, name, activeMembers, newMembers, leavingMembers, retentionRate }>`

### Paso 6: Capa de aplicación — Handlers

**`OpenFiscalYearHandler`:**

1. Verificar que no existe ejercicio abierto (`fiscalYearRepository.existsOpenFiscalYear()`)
   - Si existe → error 409 "Debe cerrar el ejercicio actual antes de abrir uno nuevo" (FE-1)
2. Verificar que las fechas no solapan con ejercicios existentes (`fiscalYearRepository.findOverlapping(period)`)
   - Si solapan → error 422 "Las fechas solapan con el ejercicio {name}" (FE-3)
3. Crear Aggregate `FiscalYear` via factory method
4. Si `carryOverMembers = true` y hay `previousFiscalYearId`:
   - Obtener lista de socios activos del ejercicio anterior
   - Vincular socios activos al nuevo ejercicio
   - Contabilizar socios arrastrados
5. Si `applyAutomaticTransitions = true`:
   - Usar `MemberTypeRulesEvaluator.calculatePendingTransitions()` para detectar transiciones por edad
   - Para cada transición: actualizar tipo del socio, emitir `MemberTypeChanged`, registrar en timeline
   - Contabilizar transiciones aplicadas
6. Ejecutar `fiscalYear.open(carriedOverMembersCount)` → emite `FiscalYearOpened`
7. Guardar todo en transacción atómica via `PrismaTenantService`
8. Publicar Domain Events via Outbox
9. Retornar `OpenFiscalYearResultDto`

**En caso de fallo en pasos 4-7:**
- Rollback de transacción (automático por Prisma)
- Reportar excepción vía `ErrorReporter.captureException()` con contexto

**`CloseFiscalYearHandler`:**

1. Buscar ejercicio por ID
2. Verificar que está en estado `OPEN`
3. Ejecutar validaciones pre-cierre:
   - Cuotas conciliadas (query a datos de BC-Treasury si disponible, sino skip)
   - Remesas cerradas (query a datos de BC-Treasury si disponible, sino skip)
   - Actas completas (query a datos de BC-Documents si disponible, sino skip)
4. Si hay advertencias y `force = false` → retornar advertencias con status 422
5. Si `force = true` o sin advertencias:
   - Contar socios activos al cierre
   - Ejecutar `fiscalYear.close(membersAtEnd, warnings)` → emite `FiscalYearClosed`
   - Guardar via `fiscalYearRepository.save(fiscalYear)`
   - Publicar Domain Events via Outbox
6. Retornar `CloseFiscalYearResultDto`

**`CompareFiscalYearsHandler`:**

1. Obtener ejercicios solicitados por IDs
2. Para cada ejercicio: calcular estadísticas (socios activos, altas, bajas)
3. Calcular tasas de retención y tendencias
4. Retornar `FiscalYearComparisonDto`

### Paso 7: Capa de infraestructura — Schema Prisma (tenant)

Extender `api/prisma/tenant/schema.prisma` con:

```prisma
model FiscalYear {
  id                      String    @id @default(uuid()) @db.Uuid
  name                    String    @db.VarChar(100)
  type                    String    @db.VarChar(20)
  start_date              DateTime  @db.Date
  end_date                DateTime  @db.Date
  status                  String    @default("PREPARATION") @db.VarChar(20)
  previous_fiscal_year_id String?   @db.Uuid
  members_at_start        Int       @default(0)
  members_at_end          Int?
  report_id               String?   @db.Uuid
  created_at              DateTime  @default(now())
  closed_at               DateTime?

  previousFiscalYear      FiscalYear?  @relation("FiscalYearChain", fields: [previous_fiscal_year_id], references: [id])
  nextFiscalYears         FiscalYear[] @relation("FiscalYearChain")

  @@unique([name])
  @@map("fiscal_years")
}
```

Nota: El índice parcial para la unicidad de ejercicio abierto se crea mediante migration manual:
```sql
CREATE UNIQUE INDEX idx_fiscal_year_open ON fiscal_years ((1)) WHERE status = 'OPEN';
```

### Paso 8: Capa de infraestructura — Repository (Prisma)

Crear en `api/src/membership/infrastructure/persistence/`:

- **`PrismaFiscalYearRepository`**: Implementa `FiscalYearRepository` usando `PrismaTenantService.getClient(tenantId)`
- Mappers: `FiscalYearPrismaMapper.toDomain(prismaModel): FiscalYear` y `toPersistence(aggregate): PrismaCreateInput`
- Implementación de `findOverlapping`: query con condición `(startDate <= period.endDate AND endDate >= period.startDate)`
- Implementación de `existsOpenFiscalYear`: query con `WHERE status = 'OPEN'`
- La conexión se obtiene del tenant activo en el request (vía `PrismaTenantService`)

### Paso 9: Capa de infraestructura — Controller

Crear en `api/src/membership/infrastructure/controllers/fiscal-years.controller.ts`:

| Endpoint | Método | Auth | Permiso | Body/Params | Response |
|----------|--------|------|---------|-------------|----------|
| `/api/v1/fiscal-years` | POST | JWT | `membership:fiscal-years:create` | `OpenFiscalYearDto` | 201 Created con `OpenFiscalYearResultDto` |
| `/api/v1/fiscal-years` | GET | JWT | `membership:fiscal-years:read` | — | 200 con `FiscalYearResponseDto[]` |
| `/api/v1/fiscal-years/active` | GET | JWT | `membership:fiscal-years:read` | — | 200 con `FiscalYearResponseDto` o 404 |
| `/api/v1/fiscal-years/compare` | GET | JWT | `membership:fiscal-years:read` | Query: `?ids=uuid1,uuid2,uuid3` | 200 con `FiscalYearComparisonDto` |
| `/api/v1/fiscal-years/:id` | GET | JWT | `membership:fiscal-years:read` | Param: `id` | 200 con `FiscalYearResponseDto` |
| `/api/v1/fiscal-years/:id/close` | POST | JWT | `membership:fiscal-years:close` | `CloseFiscalYearDto` | 200 con `CloseFiscalYearResultDto` |

- Swagger decorators para documentación automática
- Errores: 409 Conflict (ejercicio ya abierto), 404 Not Found (ejercicio no encontrado), 422 Unprocessable Entity (fechas solapadas, advertencias de cierre sin force)

### Paso 10: Tests

**Tests unitarios (dominio):**
- `FiscalYear.create()` con datos válidos → ejercicio creado en estado `PREPARATION`
- `FiscalYear.open()` desde `PREPARATION` → transición a `OPEN` + evento emitido
- `FiscalYear.open()` desde `CLOSED` → error (transición no permitida)
- `FiscalYear.close()` desde `OPEN` → transición a `CLOSED` + evento emitido
- `FiscalYear.close()` desde `PREPARATION` → error (transición no permitida)
- `FiscalYearPeriod.create()` → validación de fechas (válidas, invertidas)
- `FiscalYearPeriod.overlaps()` → detección de solapamiento (solapan, no solapan, adyacentes, contenido)
- `FiscalYearPeriod.containsDate()` → fecha dentro/fuera del periodo

**Tests unitarios (aplicación):**
- `OpenFiscalYearHandler` con mocks de `FiscalYearRepository` y `MemberTypeRulesEvaluator`:
  - Caso éxito sin arrastre: ejercicio creado y abierto
  - Caso éxito con arrastre: socios activos vinculados al nuevo ejercicio
  - Caso éxito con transiciones: transiciones de categoría aplicadas
  - Caso ejercicio ya abierto: rechazo con 409
  - Caso fechas solapadas: rechazo con 422
- `CloseFiscalYearHandler`:
  - Caso éxito sin advertencias: ejercicio cerrado
  - Caso advertencias con force=true: ejercicio cerrado con warnings registrados
  - Caso advertencias con force=false: retorno de advertencias sin cerrar
  - Caso ejercicio no abierto: error
- `CompareFiscalYearsHandler`:
  - Caso con datos completos: comparativa correcta
  - Caso con ejercicio sin datos: relleno con ceros

**Tests de integración:**
- Apertura de ejercicio contra BD real (Testcontainers):
  - Crear ejercicio y abrirlo → verificar persistencia y estado `OPEN`
  - Intentar abrir segundo ejercicio → verificar rechazo (constraint)
  - Verificar constraint parcial de unicidad de ejercicio abierto
- Cierre de ejercicio:
  - Abrir y cerrar ejercicio → verificar estado `CLOSED` y timestamp
  - Verificar que ejercicio cerrado no permite modificaciones
- Flujo completo:
  - Crear tipos de socio (de Task 3) → abrir ejercicio con arrastre → verificar transiciones → cerrar ejercicio
  - Verificar que los eventos `FiscalYearOpened` y `FiscalYearClosed` se registran en outbox
- Comparativas:
  - Crear y cerrar 3 ejercicios con datos distintos → generar comparativa → verificar cálculos

## Criterios de aceptación

Derivados de US-023, US-024, US-025, US-026, US-027:

1. **Estructura de ejercicio (US-023):** Un ejercicio contiene fechas inicio/fin, estado (Preparación/Abierto/Cerrado), contador de socios al inicio y al cierre. La consulta de un ejercicio cerrado muestra los datos tal como estaban en ese periodo, sin mezclar con otros ejercicios.

2. **Apertura con arrastre de socios activos (US-024):** Al abrir un nuevo ejercicio con arrastre habilitado, se vinculan automáticamente los socios activos del ejercicio anterior. Los socios en estado de baja no se arrastran. Se emite evento `FiscalYearOpened`.

3. **Transiciones automáticas de categoría (US-024):** Al abrir ejercicio, el sistema detecta socios cuya edad cumple la condición de transición automática de su tipo (ej: Juvenil cumple 35 → Adulto). Se ejecutan las transiciones, se emite `MemberTypeChanged` por cada una y se registra en el timeline del socio.

4. **Cierre con validaciones (US-025):** Al iniciar el cierre, se ejecutan validaciones pre-cierre (cuotas conciliadas, remesas cerradas, actas completas). Si hay pendientes, se muestran como advertencias. El Presidente puede forzar el cierre. Se emite evento `FiscalYearClosed`.

5. **Comparativas entre ejercicios (US-026):** Se pueden comparar indicadores de múltiples ejercicios cerrados: socios activos, altas, bajas, tasa de retención y tendencia porcentual.

6. **Flexibilidad de fechas (US-027):** El tipo de ejercicio puede ser año natural (01/01-31/12), temporada deportiva (01/09-31/08), cofrade (personalizado) o completamente personalizado. Las fechas se almacenan y validan correctamente.

7. **Un solo ejercicio abierto (FE-1):** No puede haber dos ejercicios abiertos simultáneamente. Si se intenta abrir con otro ya abierto, el sistema bloquea con mensaje "Debe cerrar el ejercicio actual antes de abrir uno nuevo".

8. **No solapamiento de fechas (FE-3):** Las fechas de un nuevo ejercicio no pueden solaparse con ejercicios existentes. El sistema detecta y rechaza la operación.

9. **Inmutabilidad de ejercicio cerrado (FE-2):** Un ejercicio en estado `CLOSED` no permite modificaciones. Cualquier intento se rechaza con mensaje descriptivo.
