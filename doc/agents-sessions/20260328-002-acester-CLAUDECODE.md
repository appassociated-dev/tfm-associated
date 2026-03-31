# Sesión Agente: 20260328-002-acester-CLAUDECODE

- **Agente de IA:** Claude Opus 4.6 (1M context) via Claude Code
- **Fecha creación:** 28 de marzo de 2026
- **Fecha finalización:** 29 de marzo de 2026
- **Hora de inicio:** 18:14 (28/03)
- **Hora de últimos trabajos:** 00:52 (29/03)

---

## 📋 Resumen de la Sesión

Implementación completa del SDD `domain-events-infrastructure`: infraestructura dual-outbox de ADR-008 desde cero hasta verificación. Flujo completo SDD explore → propose → spec → design → tasks → apply (4 fases) → judgment-day (3 rondas adversariales) → verify. Resultado: PASS con 1261 tests, 0 errores TypeScript, 0 errores ESLint.

---

## 🎯 Objetivos

- [x] Explorar el código actual e identificar todos los gaps vs la estrategia de eventos definida
- [x] Diseñar la solución completa (dual-outbox, publisher compartido, OutboxProcessor reescrito)
- [x] Implementar Phase A: DomainEvent base class + Prisma schemas + migraciones
- [x] Implementar Phase B: Publishers, EventReconstitutionRegistry, OutboxProcessorService, módulo
- [x] Implementar Phase C: Migrar los 3 BCs (Membership, Treasury, Identity) al publisher compartido
- [x] Implementar Phase D: Registro en registry, integration tests, cleanup, verificación final
- [x] Superar revisión adversarial Judgment Day (3 rondas)
- [x] Verificación SDD: 23/23 tareas y 11/11 fixes de Judgment Day confirmados

---

## 💼 Trabajo Realizado

### 18:14 - SDD Explore: análisis de gaps domain-events-infrastructure

**Descripción:**
Sub-agente lanzado para explorar el código actual versus la estrategia de eventos redefinida el mismo día (SDD `event-strategy-spec-reformulation` archivado en engram #842). Se analizaron todos los BCs, el OutboxProcessorService, las Prisma schemas de main y tenant DB, y el AppModule.

**Archivos analizados:**

- `api/src/shared/domain/domain-event.base.ts` — falta aggregateId, aggregateType, boundedContext, actorId
- `api/src/shared/infrastructure/persistence/outbox-processor.service.ts` — stub muerto, no registrado en ningún módulo
- `api/prisma/main/schema.prisma` — OutboxEvent con schema incorrecto (sin status, sin bounded_context)
- `api/prisma/tenant/schema.prisma` — OutboxEvent nunca migrado, tabla inexistente en tenant DBs
- `api/src/membership/` — publisher escribe en tenant DB (incorrecto)
- `api/src/treasury/` — igual que Membership
- `api/src/identity/` — sin publisher alguno, eventos silenciosamente descartados

**Resultados:**

- ✅ 16 gaps identificados: 10 CRITICAL, 3 HIGH, 3 MEDIUM
- ✅ GAP-001 a GAP-010 críticos (infraestructura core rota/ausente)
- ✅ GAP-011 a GAP-013 altos (dispatch no cableado, DomainAuditPublisher ausente)
- ✅ GAP-014 a GAP-016 medios/bajos (limpieza, naming, SQL raw)
- ⚠️ GAP-013 (@EventsHandler consumers) marcado fuera de scope para este SDD

---

### 18:14 - SDD Propose: propuesta de implementación

**Descripción:**
Propuesta completa de 14 pasos y ~34 archivos (8 nuevos, ~30 modificados, 4 eliminados). Arquitectura dual-outbox: IntegrationEventPublisher (main DB) + DomainAuditPublisher (tenant DB, misma tx) + OutboxProcessor reescrito + EventReconstitutionRegistry.

**Decisiones técnicas:**

- **@Global() OutboxProcessorModule** — patrón idéntico a TenantCredentialsModule ya en uso. Todos los BCs inyectan publishers sin importar el módulo explícitamente.
- **Dual-write MVP best-effort** — tenant DB commit primero, luego write a main DB. ErrorReporter en caso de fallo; no rollback de tx. CDC como evolución futura.
- **eventType en PascalCase** — coincide con nombre de clase, simplifica reconstitución. Elimina dot-notation y kebab-dot de todos los BCs.
- **Stale recovery en onApplicationBootstrap** — reset de rows `processing` con más de 5 minutos a `pending`. Guarda contra crashes durante despacho.
- **Reconstitución via Map explícito** — cada módulo BC llama `registry.register()` en OnModuleInit. Sin magia de reflection.
- **DomainAuditPublisher recibe tx client como parámetro** — garantiza atomicidad con la operación de dominio. Rollback de tx = rollback de audit.

**Archivos clave del plan:**

- `api/src/shared/application/ports/integration-event.publisher.ts` (nuevo)
- `api/src/shared/application/ports/domain-audit.publisher.ts` (nuevo)
- `api/src/shared/infrastructure/persistence/prisma-integration-event.publisher.ts` (nuevo)
- `api/src/shared/infrastructure/persistence/prisma-domain-audit.publisher.ts` (nuevo)
- `api/src/shared/infrastructure/persistence/event-reconstitution.registry.ts` (nuevo)
- `api/src/shared/infrastructure/persistence/outbox-processor.service.ts` (reescritura total)
- `api/src/shared/infrastructure/persistence/outbox-processor.module.ts` (nuevo)

**Resultados:**

- ✅ Propuesta guardada en engram #847

---

### 18:19 - SDD Spec: especificación delta

**Descripción:**
13 requisitos funcionales con escenarios Given/When/Then para todos los componentes nuevos. NFRs alineados con RNF-067 (at-least-once delivery). Criterios de aceptación explícitos para cada componente.

**Decisiones técnicas:**

- 20+ escenarios BDD cubriendo: constructor DomainEvent, publish happy path, dual-write failure (no throw), atomicidad del audit publisher, mutex, stale recovery, por-event error isolation, max retries, reconstitución de eventos desconocidos.
- GAP-013 (@EventsHandler consumers) explícitamente excluido del scope.
- Testing order TDD definido: DomainEvent → Registry → IntegrationPublisher → AuditPublisher → Processor → BC migrations.

**Resultados:**

- ✅ Spec guardada en engram #849

---

### 18:20 - SDD Design: diseño técnico

**Descripción:**
8 decisiones de arquitectura documentadas con alternativas consideradas. Diagrama de flujo de datos completo. Tabla de todos los archivos a crear/modificar/eliminar. Interfaces TypeScript completas. Estrategia de testing por capa. Dependency graph de implementación.

**Decisiones técnicas clave:**

- **PrismaIntegrationEventPublisher** usa `prisma.outboxEvent.create()` individual por evento (no batch `createMany`) — `$transaction` garantiza atomicidad en publishes multi-evento; `createMany` no retorna registros creados.
- **OutboxProcessorService** guarda de mutex en-proceso (`private isProcessing = false`) — deployment single-instance en MVP; advisory lock de BD añade complejidad sin beneficio.
- **@Interval(5000)** de `@nestjs/schedule` — ScheduleModule.forRoot() ya registrado en AppModule.
- **PrismaMainService.$transaction** delegate necesario para IntegrationEventPublisher — descubierto durante diseño, añadido como tarea B-003.

**Resultados:**

- ✅ Diseño guardado en engram #851
- ✅ 23 tareas en 4 fases con dependencias documentadas

---

### 18:24 - SDD Tasks: desglose en 23 tareas (4 fases)

**Descripción:**
Desglose de implementación en 23 tareas atómicas organizadas en 4 fases con paralelismo máximo.

| Fase                      | Tareas | Descripción                                            |
| ------------------------- | ------ | ------------------------------------------------------ |
| A — Foundation            | 5      | DomainEvent base class + Prisma schemas + migraciones  |
| B — Core Infrastructure   | 9      | Publishers + Registry + Processor + Module wiring      |
| C — BC Migrations         | 4      | Migrar 3 BCs al publisher compartido                   |
| D — Integration & Cleanup | 5      | Tests E2E + borrado código muerto + verificación final |

**Resultados:**

- ✅ Tasks guardadas en engram #852
- ✅ 24 subclases DomainEvent confirmadas (5 Identity, 9 Membership, 10 Treasury)

---

### ~18:30 - Phase A: Foundation (5 tareas)

**Descripción:**
Implementación de la base: extensión de la clase DomainEvent y reescritura de los schemas Prisma con sus migraciones.

**Archivos creados/modificados:**

- `api/src/shared/domain/domain-event.base.ts` — añadidos `aggregateId`, `aggregateType`, `boundedContext`, `actorId?`; constructor cambiado a params object `{ payload, aggregateId, aggregateType, boundedContext, actorId? }`
- `api/src/shared/domain/__tests__/domain-event.spec.ts` — tests actualizados para nueva firma de constructor
- `api/src/shared/domain/__tests__/aggregate-root.spec.ts` — TestCreatedEvent/TestUpdatedEvent actualizados
- `api/prisma/main/schema.prisma` — OutboxEvent reescrito per ENT-006: añadidos `boundedContext`, `aggregateId`, `aggregateType`, `actorId`, `status` (default 'pending'), `maxRetries` (default 3); eliminados `nextRetryAt`, `lastError`; 4 índices corregidos
- `api/prisma/tenant/schema.prisma` — OutboxEvent reescrito per ENT-017: columnas audit-only (`id`, `boundedContext`, `eventType`, `aggregateId`, `aggregateType`, `payload`, `actorId?`, `occurredAt`); sin columnas de retry
- `api/prisma/main/migrations/20260328200333_fix_outbox_events/migration.sql` — ALTER TABLE con ALTER COLUMN, ADD COLUMN, DROP COLUMN, nuevos índices; backfill `status='pending'` para rows existentes
- `api/prisma/tenant/migrations/20260328200339_create_audit_outbox_events/migration.sql` — CREATE TABLE con ENT-017 schema (tabla inexistente en tenant DBs)

**Resultados:**

- ✅ `npx prisma validate` passes en ambos schemas
- ✅ Migraciones aplican sin errores

---

### ~19:00 - Phase B: Core Infrastructure (9 tareas)

**Descripción:**
Creación de todos los componentes nuevos de la infraestructura compartida con TDD (test-first).

**Archivos creados/modificados:**

- `api/src/shared/application/ports/integration-event.publisher.ts` — puerto con `INTEGRATION_EVENT_PUBLISHER` Symbol e interfaz `publish(tenantId: string | null, events: DomainEvent[]): Promise<void>`
- `api/src/shared/application/ports/domain-audit.publisher.ts` — puerto con `DOMAIN_AUDIT_PUBLISHER` Symbol e interfaz `publish(txClient: PrismaTransactionClient, events: DomainEvent[]): Promise<void>`
- `api/src/shared/infrastructure/persistence/prisma-main.service.ts` — añadido método `$transaction<T>(fn: (tx) => Promise<T>): Promise<T>` delegado al cliente Prisma subyacente
- `api/src/shared/infrastructure/persistence/prisma-integration-event.publisher.ts` — implementación que escribe a main DB con ENT-006 columns; best-effort (catch + ErrorReporter, no throw)
- `api/src/shared/infrastructure/persistence/prisma-domain-audit.publisher.ts` — implementación que recibe tx client y escribe a tenant DB con ENT-017 columns dentro de la misma transacción
- `api/src/shared/infrastructure/persistence/event-reconstitution.registry.ts` — Map<string, constructor> con `register()` (guard de duplicados), `reconstitute()` y `EventTypeNotRegisteredError`
- `api/src/shared/infrastructure/persistence/outbox-processor.service.ts` — reescritura total: status flow (pending→processing→processed/failed), mutex `isProcessing`, stale recovery en `onApplicationBootstrap`, `@Interval(5000)`, per-event error isolation, retry con maxRetries, dispatch a EventBus; CERO SQL raw
- `api/src/shared/infrastructure/persistence/outbox-processor.module.ts` — `@Global() @Module` con CqrsModule, OutboxProcessorService, EventReconstitutionRegistry, ambos publishers; exports globales
- `api/src/app.module.ts` — añadido OutboxProcessorModule a imports

**Tests creados (28 tests en Phase B):**

- `__tests__/prisma-integration-event-publisher.spec.ts` — happy path, DB failure → no throw, múltiples eventos
- `__tests__/prisma-domain-audit-publisher.spec.ts` — escritura vía tx client, sin columnas de retry
- `__tests__/event-reconstitution-registry.spec.ts` — register+reconstitute, tipo desconocido lanza error
- `__tests__/outbox-processor.service.spec.ts` — 6 escenarios: batch processing, mutex, stale recovery, per-event isolation, max retries, reconstitución + dispatch

**Resultados:**

- ✅ 28 tests nuevos en Phase B — todos PASS

---

### ~20:00 - Phase C: BC Migrations (4 tareas en paralelo)

**Descripción:**
Migración de los 3 BCs desde publishers BC-específicos al publisher compartido, y actualización de los 24 constructores de subclases DomainEvent.

**Archivos modificados:**

- **24 subclases DomainEvent** (5 Identity, 9 Membership, 10 Treasury): constructor `super(payload)` → `super({ payload, aggregateId, aggregateType, boundedContext })`. eventType en PascalCase (eliminado dot-notation y kebab-dot).
- **BC-Membership (6 handlers)**: `@Inject(MEMBER_OUTBOX_PUBLISHER)` → `@Inject(INTEGRATION_EVENT_PUBLISHER)` en todos los handlers
- `api/src/membership/membership.module.ts` — eliminado provider `MEMBER_OUTBOX_PUBLISHER`, eliminado import de `PrismaMemberOutboxPublisher`
- **BC-Treasury (12 handlers)**: `@Inject(TREASURY_OUTBOX_PUBLISHER)` → `@Inject(INTEGRATION_EVENT_PUBLISHER)` en todos los handlers
- `api/src/treasury/treasury.module.ts` — eliminado provider `TREASURY_OUTBOX_PUBLISHER`, eliminado import de `PrismaTreasuryOutboxPublisher`
- `api/src/identity/application/commands/provision-tenant.handler.ts` — añadido `@Inject(INTEGRATION_EVENT_PUBLISHER)`, llamada a `publisher.publish(null, aggregate.pullDomainEvents())` tras éxito del saga (antes los eventos se descartaban silenciosamente)
- `api/src/membership/__tests__/member-management.integration-spec.ts` — reemplazado PrismaMemberOutboxPublisher con mock IntegrationEventPublisher; corregido eventType 'member.data-updated' → 'MemberDataUpdated'

**Resultados:**

- ✅ `npx tsc --noEmit`: 0 errores (TypeScript como test para las 24 subclases)
- ✅ Tests de handlers actualizados y pasando

---

### ~20:00 - Phase D: Integration Tests & Cleanup (5 tareas)

**Descripción:**
Registro de eventos en el registry, integration tests end-to-end, borrado de código obsoleto, y verificación final completa.

**Archivos creados/modificados:**

- `api/src/identity/identity.module.ts` — añadido OnModuleInit, registra 5 eventos Identity: TenantProvisioned, UserCreated, UserAuthenticated, AuthenticationFailed, UserBlocked
- `api/src/membership/membership.module.ts` — añadido OnModuleInit, registra 9 eventos Membership: FiscalYearClosed, FiscalYearOpened, MemberDataUpdated, MemberDeactivated, MemberRegistered, MemberReinstated, MemberStatusChanged, MemberTypeChanged, MemberTypeCreated
- `api/src/treasury/treasury.module.ts` — añadido OnModuleInit, registra 10 eventos Treasury: ChargeGenerated, FeePlanCreated, FeePlanLinkedToMemberType, FeePlanModified, MonthlyGenerationCompleted, PaymentRecorded, ReceiptGenerated, SubscriptionClosed, SubscriptionCreated, SubscriptionModified
- `api/src/shared/infrastructure/persistence/__tests__/outbox-pipeline.integration-spec.ts` — test E2E: pending→processed+processedAt+EventBus.publish, y stale recovery (processing >5min → pending). PrismaMainService real, EventBus/ErrorReporter mockeados. Patrón `*.integration-spec.ts` con `pgAvailable` guard.
- `api/src/shared/infrastructure/persistence/__tests__/integration-event-publisher.integration-spec.ts` — test publisher dual-write: columnas ENT-006, múltiples eventos, tenantId=null

**Archivos eliminados (D-004):**

- `api/src/membership/application/ports/member-outbox.publisher.ts`
- `api/src/membership/infrastructure/services/prisma-member-outbox.publisher.ts`
- `api/src/treasury/application/ports/treasury-outbox.publisher.ts`
- `api/src/treasury/infrastructure/services/prisma-treasury-outbox.publisher.ts`

**Tests corregidos (5 tests con eventType legacy):**

- `api/src/identity/domain/__tests__/tenant.spec.ts`: 'tenant.provisioned' → 'TenantProvisioned'
- `api/src/membership/domain/__tests__/member-type.spec.ts`: 'member-type.created' → 'MemberTypeCreated'
- `api/src/treasury/application/commands/__tests__/record-payment.handler.spec.ts`: 2 eventTypes legacy corregidos
- `api/src/treasury/application/commands/__tests__/record-multi-charge-payment.handler.spec.ts`: 2 eventTypes legacy corregidos

**Resultados:**

- ✅ 24 tipos de eventos registrados en el registry (5+9+10)
- ✅ `npx tsc --noEmit`: 0 errores
- ✅ `npm run lint`: 0 errores, 0 warnings
- ✅ `npm run test:unit` (vitest): 128 archivos, **1257 tests — TODOS PASS**

---

### 23:48 (28/03) - Judgment Day: revisión adversarial dual (3 rondas)

**Descripción:**
Revisión adversarial antes de sdd-verify. Dos sub-agentes independientes (Judge A y Judge B) analizaron el código buscando bugs que los tests no cubren. 3 rondas con resolución de contradicciones entre jueces.

**Round 1 — 5 issues confirmados:**

- **CRITICAL**: Stale recovery usa `createdAt` (timestamp de creación del evento, no de cuando empezó el procesamiento) → incorrecto; añadir columna `processingStartedAt`
- **CRITICAL**: UUID `tenantIds` hardcodeados en integration tests → usar `randomUUID()`
- **CRITICAL**: `updateMany WHERE` sin filtro `status: 'pending'` → podría actualizar rows `processed` o `failed` a `processing`
- **WARNING**: `Object.defineProperty` para override de campos readonly en `DomainEvent` → eliminar, pasar campos opcionales en constructor params
- **WARNING**: `register()` sin guard de duplicados → mismo eventType registrado dos veces puede sobrescribir silenciosamente

**Round 2 — 5 issues confirmados:**

- **CRITICAL**: Parámetros de constructor DomainEvent (`eventId?`, `occurredOn?`) — `Object.defineProperty` eliminado en R1, pero los campos seguían siendo problemáticos
- **WARNING**: Tipo `OutboxEventRow` incompleto (faltaba `processingStartedAt: Date | null`)
- **WARNING**: `makePendingRow` en tests usaba string fijo para `id` en lugar de `randomUUID()`
- **WARNING**: Test happy-path no assertaba `processingStartedAt`
- **WARNING**: Migration sin backfill para rows `processing` pre-existentes → añadido `UPDATE SET processing_started_at = created_at WHERE status = 'processing'`

**Round 3 — 1 issue confirmado (trivial):**

- **CRITICAL** (trivial): Campo faltante en test factory → fix aplicado

**Contradicción resuelta:**

- Judge A: "CqrsModule EventBus está aislado por módulo" vs Judge B: "CqrsModule v10+ es global"
- Judge B correcto — `CqrsModule` es global en NestJS v10+

**Nueva migración creada:**

- `api/prisma/main/migrations/20260329000001_add_outbox_processing_started_at/migration.sql` — añade columna `processingStartedAt` a `outbox_events` en main DB

**Resultados:**

- ✅ APPROVED tras Round 3
- ✅ 11 fixes aplicados en 3 rondas

---

### 00:52 (29/03) - SDD Verify: verificación final

**Descripción:**
Sub-agente sdd-verify validó la implementación completa contra spec + tasks + Judgment Day fixes.

**Resultados de verificación:**

- ✅ 23/23 tareas implementadas (Phases A, B, C, D)
- ✅ 11/11 fixes de Judgment Day confirmados
- ✅ Spec compliance: ADR-008, RNF-067, ENT-006, ENT-017 — todos PASS
- ✅ `npx tsc --noEmit`: 0 errores
- ✅ `npm run lint`: 0 errores, 0 warnings
- ✅ `npm run test:unit`: 128 archivos, **1261 tests — TODOS PASS** (4 tests más que en D-005 por los fixes de Judgment Day)
- ⚠️ WARNING: ENT-006 spec no incluye `processingStartedAt` — columna añadida por Judgment Day; spec debe actualizarse (doc-spec-generator)
- ⚠️ WARNING: JSDoc de treasury.module.ts referencia 'TreasuryOutboxPublisher' (cosmético, sin impacto funcional)

---

## 🔄 Próximos Pasos

- [ ] Ejecutar `sdd-archive` para cerrar formalmente el SDD `domain-events-infrastructure`
- [ ] Actualizar ENT-006 en spec/ para añadir columna `processingStartedAt` (via doc-spec-generator)
- [ ] Corregir JSDoc de `api/src/treasury/treasury.module.ts` (referencia legacy a TreasuryOutboxPublisher)
- [ ] Implementar `@EventsHandler` consumers en BCs destino (GAP-013 — deferred, per-BC SDDs)

---

## 📝 Notas y Aprendizajes

### Lecciones Técnicas

- **EventReconstitutionRegistry es @Injectable() de @Global() OutboxProcessorModule** — los módulos BC lo inyectan directamente en el constructor sin necesidad de añadirlo a sus propios providers.
- **Patrón de integration tests en este proyecto**: `*.integration-spec.ts` en `src/` (no en `test/`), PrismaClient directo via PrismaPg adapter, env var `DATABASE_MAIN_URL`, guard `pgAvailable` para skip gracioso cuando no hay BD disponible.
- **Phase C dejó 5 tests con eventType legacy**: los tests de Phase C se focalizaron en assertions a nivel de handler, no a nivel de aggregate/domain-event. Los tests de dominio tenían aún los valores antiguos.
- **El cambio de constructor de DomainEvent es un rompimiento atómico**: las 24 subclases deben actualizarse en un solo commit porque TypeScript genera errores de compilación en todos los callsites simultáneamente.
- **stale recovery requiere `processingStartedAt`, NO `createdAt`**: usar `createdAt` como proxy del inicio de procesamiento es incorrecto — un evento puede estar en `pending` días antes de ser procesado. Este bug hubiera causado falsos positivos en producción.
- **`updateMany WHERE` debe incluir `status: 'pending'`** de lo contrario puede actualizar a `processing` rows ya en `processed` o `failed` — defecto de corrección, no solo calidad.
- **CqrsModule es global en NestJS v10+**: no hace falta importarlo en cada módulo que necesite EventBus.

### Decisiones Arquitectónicas

- **`processingStartedAt` añadido al schema main DB (no estaba en ENT-006)**: motivado por Judgment Day — stale recovery correcta requiere saber cuándo empezó el procesamiento, no cuándo se creó el evento. El spec debe actualizarse.
- **OutboxProcessorModule exporta `EventReconstitutionRegistry` directamente** (no solo los tokens Symbol) — los BC modules necesitan llamar `registry.register()` en `onModuleInit`.
- **IntegrationEventPublisher best-effort**: los fallos de escritura a main DB no revierten la transacción de tenant DB. La lógica de negocio ya fue exitosa; el evento puede recuperarse del audit log de tenant DB si es necesario.
- **Dual-write en la misma sesión que el SDD spec-reformulation** — el diseño e implementación se hicieron en el mismo día que la reformulación de specs, aprovechando que el contexto de decisiones estaba fresco.

### Problemas Encontrados

**stale recovery con `createdAt` incorrecto:**

- **Descripción:** La implementación inicial usaba `createdAt < NOW() - 5min` para stale recovery, pero `createdAt` es el timestamp de creación del evento de negocio, no de cuándo empezó a procesarse.
- **Solución:** Añadir columna `processingStartedAt` (seteada cuando el row pasa a `processing`) y usar esa para stale recovery.
- **Prevención:** Revisar columnas disponibles antes de implementar lógica temporal basada en ellas.

**eventType legacy en tests de dominio:**

- **Descripción:** Phase C migró los handlers pero los tests de dominio (aggregate-level) aún assertaban eventType en formato dot/kebab ('tenant.provisioned', 'member-type.created', etc.).
- **Solución:** Identificados y corregidos 5 tests en D-005 durante verificación.
- **Prevención:** Al cambiar formato de eventType, hacer búsqueda global de todos los strings del formato antiguo antes de dar la fase por completa.

**`updateMany` sin filtro de status:**

- **Descripción:** El procesador actualizaba a `processing` SIN filtrar por `status: 'pending'`, con riesgo de actualizar rows ya `processed` o `failed`.
- **Solución:** Añadido `where: { status: 'pending' }` en el `updateMany`.
- **Prevención:** En operaciones de actualización masiva, siempre especificar explícitamente el estado esperado del registro.

---

## 📊 Métricas de la Sesión

- **Duración total:** ~6 horas 38 minutos (28/03 18:14 — 29/03 00:52)
- **Archivos modificados:** ~35
- **Archivos creados:** 10 (8 archivos de producción + 2 integration tests)
- **Archivos eliminados:** 4 (publishers BC-específicos obsoletos)
- **Commits realizados:** 0 (pendiente por usuario)
- **Tests creados:** ~28 unit + 2 integration = ~30 tests nuevos
- **Tests corregidos:** 5 (eventType legacy) + 1 (integration spec de Membership)
- **Tests totales al finalizar:** 1261 (unit)
- **Líneas añadidas:** ~1200
- **Líneas eliminadas:** ~400

---

## 🔗 Referencias

- Engram SDD artifacts: #836 (explore), #847 (proposal), #849 (spec), #851 (design), #852 (tasks), #853 (apply-progress), #855 (judgment-day), #856 (verify-report)
- SDD precedente archivado: #842 (event-strategy-spec-reformulation)
- Branch: `mvp/frontend-fase1`

---

**Estado final:** Completada
**Próxima sesión:** Ejecutar sdd-archive, actualizar ENT-006 en spec/, comenzar implementación de @EventsHandler consumers (GAP-013)
