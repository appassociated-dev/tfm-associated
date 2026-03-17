# Sesion Agente: 20260316-002-acester-CLAUDE

- **Agente de IA:** Claude Opus 4.6 (1M context)
- **Fecha creacion:** 16 de marzo de 2026
- **Hora de inicio:** 16:29
- **Hora de ultimos trabajos:** 10:28

---

## Resumen de la Sesion

Dos SDDs completados en esta sesion:

1. **backend-http-layer-testing**: Implementacion de R1-R7 del reporte de bugs backend. Descubierto y corregido Bug 5 (DomainExceptionFilter). Healthcheck Docker y cleanup E2E corregidos.
2. **tenant-credentials-persistence**: Persistencia de credenciales per-tenant encriptadas (AES-256-GCM) para cumplir RNF-004. EncryptedSecret VO, TenantCredentialService, PrismaTenantService async con credenciales per-tenant, TenantCredentialsModule global.
   Total: 1271 unit/integration tests + 23 E2E tests GREEN.

---

## Objetivos

- [x] R2: Test E2E flujo provision -> login -> operacion en tenant (incluye fix Bug 4)
- [x] R1: Capa de tests de integracion HTTP con @nestjs/testing + supertest
- [x] R3: Validacion defensiva en PermissionsGuard + test
- [x] R4: Revisar patron provisioning (SuperadminGuard vs JWT) — documentar decision
- [x] R5: Auditar campos Json de Prisma para doble serializacion
- [x] R6: Test de integracion para script de bridges Prisma
- [x] R7: Regla lint para casts inseguros sobre campos Prisma Json
- [x] SDD tenant-credentials-persistence: Persistencia credenciales per-tenant (RNF-004)
- [x] TenantCredentialsModule global para todos los BCs

---

## Trabajo Realizado

### 16:29 - SDD fast-forward: proposal -> spec -> design -> tasks

**Descripcion:**
SDD completo para cambio `backend-http-layer-testing`. Se generaron 4 artefactos (proposal, spec, design, tasks) persistidos en engram. 19 tareas en 4 batches.

**Decisiones tecnicas:**

- OQ1: buildTenantDatabaseName() NO valida UUID — boundary interno, ya validado en TenantId VO
- OQ2: ESLint Json cast rule = ERROR (no warning) — Bug 3 fue bloqueante, warnings se ignoran
- OQ3: Bug 4 fix = PrismaTenantService lee databaseName de DB-Main. Credenciales per-tenant (RNF-004) diferidas a SDD separado

**Hallazgo critico:**
Las credenciales per-tenant (user+password) se generan en provisioning pero NO se persisten en DB-Main. Runtime usa credenciales compartidas via template DATABASE_TENANT_URL. Viola RNF-004 (minimo privilegio). Se difiere a SDD separado.

**Resultados:**

- Proposal, spec, design, tasks persistidos en engram
- 19 tareas en 4 batches planificadas

---

### 19:17 - Batch 1: Verificacion y fix tests de integracion (Task 1.4.1)

**Descripcion:**
Batch 1 verificado. Tasks 1.1.1-1.3.2 ya estaban implementadas en working directory. Task 1.4.1 completada: corregidos tests de integracion rotos por fix de Bug 3 (doble serializacion de permisos).

**Archivos modificados:**

- `api/src/identity/__tests__/tenant-provisioning.integration-spec.ts` — eliminados 6 JSON.parse() sobre permissions, reemplazados por assertions sobre array nativo

**Resultados:**

- 6 JSON.parse() eliminados en tests que asumian doble serializacion
- Tests ahora verifican permissions como array nativo (alineado con fix Bug 3)

---

### 19:38 - Batch 2: HTTP integration tests + guard + bridges (Tasks 2.1-2.4)

**Descripcion:**
Creados 65 tests nuevos cubriendo la capa HTTP completa: TenantsController (7), AuthController (12), PermissionsGuard parsePermissions (12), Prisma bridges script (22). Todos GREEN.

**Archivos creados:**

- `api/test/e2e/tenants-controller.e2e-spec.ts` — 7 tests HTTP para provisioning
- `api/test/e2e/auth-controller.e2e-spec.ts` — 12 tests HTTP para autenticacion
- `api/scripts/__tests__/generate-prisma-bridges.spec.ts` — 22 tests para script de bridges

**Archivos modificados:**

- `api/src/shared/infrastructure/guards/__tests__/permissions.guard.spec.ts` — 12 tests nuevos para parsePermissions()

**Hallazgo critico — Bug 5 (NUEVO):**
DomainExceptionFilter existe pero NUNCA se registra como APP_FILTER. Todos los errores de dominio (InvalidCredentialsError, CifAlreadyExistsError, etc.) devuelven HTTP 500 en vez de su status code correcto (401, 409). Solo detectado al testear via HTTP real, no en unit tests.

**Decisiones tecnicas:**

- CIFs de test deben usar digito de control correcto (algoritmo CIF espanol)

**Resultados:**

- 65 tests nuevos, todos GREEN
- Bug 5 descubierto y documentado

---

### 20:10 - Fix Bug 5: DomainExceptionFilter registrado como APP_FILTER

**Descripcion:**
DomainExceptionFilter registrado como APP_FILTER en ObservabilityModule. Elegido este modulo porque ya es global: true y provee ERROR_REPORTER que el filter inyecta via DI. Tests E2E actualizados con status codes exactos.

**Archivos creados:**

- `api/src/shared/infrastructure/observability/__tests__/observability.module.spec.ts` — 3 tests unitarios

**Archivos modificados:**

- `api/src/shared/infrastructure/observability/observability.module.ts` — APP_FILTER provider
- `api/test/e2e/tenants-controller.e2e-spec.ts` — assertions exactas (401, 409)
- `api/test/e2e/auth-controller.e2e-spec.ts` — assertions exactas (401)

**Resultados:**

- 122 unit test files (1223 tests) GREEN
- 3 E2E test files (23 tests) GREEN
- Errores de dominio ahora devuelven status code correcto (401, 409, etc.)

---

### 23:37 - Batch 3: Hardening — R5 audit + R7 lint + R4 documentacion

**Descripcion:**
Batch 3 completado. R7 (ESLint rule) y R4 (documentacion @Public+SuperadminGuard) fueron completados por el agente antes de que WSL se cayera. R5 (audit JSON.stringify) completado tras el reinicio. Limpieza de outbox publishers (JSON.parse(JSON.stringify(...)) innecesario).

**R5 — Audit JSON.stringify sobre campos Prisma Json:**
7 campos Json auditados (3 main, 4 tenant). Sin bugs criticos. Unico hallazgo: patron JSON.parse(JSON.stringify(...)) en outbox publishers — innecesario, limpiado.

**R7 — Regla ESLint (completada antes del crash):**

- `eslint.config.mjs` — regla `no-restricted-syntax` como ERROR para casteos `as string[]`, `as number[]`, `as Array` sobre campos Prisma Json
- Excepcion para archivos de test (_.spec.ts, _.test.ts, etc.)

**R4 — Documentacion decision (completada antes del crash):**

- `api/src/identity/infrastructure/controllers/tenants.controller.ts` — JSDoc documentando que @Public() + @UseGuards(SuperadminGuard) es el patron CORRECTO y DEFINITIVO para endpoints de bootstrap/provision. Referencia a UC-001, ADR-006, ADR-007.

**Archivos modificados:**

- `api/src/treasury/infrastructure/services/prisma-treasury-outbox.publisher.ts` — eliminado JSON.parse(JSON.stringify(...))
- `api/src/membership/infrastructure/services/prisma-member-outbox.publisher.ts` — eliminado JSON.parse(JSON.stringify(...))
- `eslint.config.mjs` — regla no-restricted-syntax (antes del crash)
- `api/src/identity/infrastructure/controllers/tenants.controller.ts` — JSDoc (antes del crash)

**Resultados:**

- 122 unit test files (1223 tests) GREEN tras limpieza de outbox publishers
- R5 audit limpio — sin mas instancias de doble serializacion
- R7 regla ESLint activa como ERROR
- R4 decision documentada como definitiva

---

### 00:19 - Fixes adicionales: healthcheck Docker + cleanup E2E + skipIf integration tests

**Descripcion:**
Corregidos 3 problemas detectados durante verificacion final:

**Fix 1 — Healthcheck Docker Compose:**
`pg_isready -U associated` intentaba conectar a BD `associated` (no existe). Corregido a `pg_isready -U associated -d associated_main`. Eliminado FATAL cada 10s en logs de PostgreSQL.

**Fix 2 — Cleanup E2E incompleto:**
Los afterAll de los 3 E2E hacian `DROP DATABASE` con conexiones activas → ERROR. Corregido: (1) cerrar app PRIMERO para liberar pool de PrismaTenantService, (2) helper `cleanupTenantDatabase()` que termina conexiones, revoca privilegios y dropea en orden correcto.

**Fix 3 — Integration tests falsamente GREEN sin Docker:**
Los integration tests usaban `if (!pgAvailable) return;` dentro de cada `it()`, lo que vitest contaba como PASSED. Corregido a `describe.skipIf(!pgAvailable)` para que se marquen como SKIPPED.

**Archivos creados:**

- Ningunpo (helper cleanupTenantDatabase añadido a create-test-app.ts existente)

**Archivos modificados:**

- `docker-compose.yml` — healthcheck con `-d` flag
- `api/src/shared/infrastructure/testing/create-test-app.ts` — helper cleanupTenantDatabase()
- `api/test/e2e/tenants-controller.e2e-spec.ts` — cleanup con helper, closeTestApp primero
- `api/test/e2e/auth-controller.e2e-spec.ts` — cleanup con helper, closeTestApp primero
- `api/test/e2e/provision-login-operate.e2e-spec.ts` — cleanup con helper, closeTestApp primero
- `api/src/identity/__tests__/tenant-provisioning.integration-spec.ts` — describe.skipIf en vez de early return

**Resultados:**

- 1223 unit/integration tests GREEN
- 23 E2E tests GREEN
- PostgreSQL logs limpios — sin FATAL ni ERROR en la ejecucion final
- Cleanup E2E sin conexiones huerfanas ni BDs residuales

---

### 00:30 - SDD tenant-credentials-persistence: Fase 1 Foundation

**Descripcion:**
SDD fast-forward completo (proposal, spec, design, tasks). 25 tareas en 5 fases. Fase 1 implementada: EncryptedSecret VO, EncryptionService reubicado de membership a shared, 2 columnas nuevas en schema Prisma (database_user, database_password_encrypted).

**Archivos creados:**

- `api/src/shared/domain/value-objects/encrypted-secret.ts` — VO que wrappea ciphertext, toString() retorna [ENCRYPTED]
- `api/src/shared/domain/ports/encryption-service.port.ts` — port reubicado desde membership
- `api/src/shared/infrastructure/services/aes256-encryption.service.ts` — impl reubicada desde membership

**Archivos modificados:**

- `api/prisma/main/schema.prisma` — 2 columnas nuevas nullable en Tenant
- `api/src/shared/domain/index.ts` — exports nuevos
- `api/src/membership/domain/ports/encryption-service.port.ts` — re-export desde shared
- `api/src/membership/infrastructure/services/aes256-encryption.service.ts` — re-export desde shared

**Resultados:**

- 9 tests EncryptedSecret + 8 tests EncryptionService — TDD RED → GREEN

---

### 03:00 - SDD tenant-credentials-persistence: Fase 2 Core Domain & Service

**Descripcion:**
TenantCredentialService creado (implementa ambos ports), Tenant aggregate actualizado con databaseUser, ProvisionTenantHandler integrado con persistCredentials().

**Archivos creados:**

- `api/src/identity/application/ports/tenant-credential.port.ts`
- `api/src/shared/domain/ports/tenant-credential-provider.port.ts`
- `api/src/identity/infrastructure/services/tenant-credential.service.ts`

**Archivos modificados:**

- `api/src/identity/domain/aggregates/tenant.ts` — databaseUser property
- `api/src/identity/infrastructure/persistence/tenant-prisma.mapper.ts` — mapping databaseUser
- `api/src/identity/application/commands/provision-tenant.handler.ts` — persistCredentials en saga

**Resultados:**

- 8 tests TenantCredentialService + 2 tests Tenant + 3 tests mapper + 2 tests handler
- 1255 tests GREEN

---

### 05:00 - SDD tenant-credentials-persistence: Fases 3-4 Runtime + Mechanical

**Descripcion:**
PrismaTenantService.getClient() convertido a async. Inyeccion @Optional() de TenantCredentialProvider. 21 callers actualizados con await. Saga fix: saveTenant antes de persistCredentials.

**Archivos creados:**

- `api/src/shared/infrastructure/persistence/__tests__/prisma-tenant.service.spec.ts` — 8 tests

**Archivos modificados:**

- `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` — async getClient, credential provider
- 14 repositories (Membership + Treasury) — get prisma → async getPrisma
- 4 handlers — await getClient
- 2 outbox publishers — await getClient
- `api/src/identity/application/commands/provision-tenant.handler.ts` — reordenado saga (saveTenant antes de persistCredentials)
- `api/src/identity/domain/repositories/tenant.repository.ts` — deleteById para rollback

**Hallazgo critico:**
persistCredentials hacia prisma.tenant.update() ANTES de saveTenant (que crea el registro). Prisma no puede update sin registro existente → 500. Fix: reordenar saga.

**Resultados:**

- 1263 unit + 23 E2E tests GREEN

---

### 09:00 - TenantCredentialsModule global + E2E fixes

**Descripcion:**
Creado @Global() TenantCredentialsModule para que TODOS los BCs usen credenciales per-tenant (no solo Identity). Corregidos E2E: cleanup CIF stale data, grantSchemaPermissions para tenant user, fileParallelism: false.

**Archivos creados:**

- `api/src/shared/infrastructure/modules/tenant-credentials.module.ts` — @Global module
- `api/src/shared/infrastructure/modules/__tests__/tenant-credentials.module.spec.ts` — 8 tests

**Archivos modificados:**

- `api/src/app.module.ts` — import TenantCredentialsModule
- `api/src/identity/identity.module.ts` — removidos providers ahora globales
- `api/src/membership/membership.module.ts` — removido ENCRYPTION_SERVICE
- `api/src/treasury/treasury.module.ts` — removido PrismaMainService
- `api/src/identity/infrastructure/services/database-provisioning.service.ts` — grantSchemaPermissions()
- `api/src/identity/application/ports/database-provisioning.port.ts` — nuevo metodo en port
- `api/test/e2e/*.e2e-spec.ts` — cleanupKnownE2eFixtures en beforeAll
- `api/vitest.e2e.config.ts` — fileParallelism: false

**Resultados:**

- 1271 unit tests + 23 E2E tests GREEN
- RNF-004 cumplido: todos los BCs usan credenciales per-tenant

---

## Proximos Pasos

- [ ] Commit de todo el trabajo de esta sesion (2 commits: R1-R7 + tenant-credentials)
- [ ] Evaluar credential rotation story (marcado como deferred en SDD)
- [ ] Considerar useExisting en vez de useClass para tokens duplicados en TenantCredentialsModule

---

## Notas y Aprendizajes

### Lecciones Tecnicas

- Los tests unitarios que instancian handlers directamente NO detectan bugs en guards, filters ni middleware HTTP. La capa de integracion HTTP es imprescindible.
- `pg_isready -U usuario` intenta conectar a una BD con el mismo nombre que el usuario. Siempre usar `-d` para especificar la BD.
- `describe.skipIf()` es la forma correcta de marcar tests como SKIPPED en vitest. `if (condition) return;` dentro de `it()` los marca como PASSED, dando falsa confianza.
- Prisma serializa automaticamente los campos Json. `JSON.stringify()` encima causa doble serializacion. `JSON.parse(JSON.stringify(...))` es un deep-clone innecesario para campos Json.
- El orden de cleanup de tenant DBs importa: cerrar app (libera pool) → terminar conexiones → revocar privilegios → DROP DATABASE → DROP USER.
- Los casts TypeScript (`as string[]`) no hacen nada en runtime. Sobre campos Prisma Json siempre validar con `Array.isArray()` o `typeof`.

### Decisiones Arquitectonicas

- @Public() + @UseGuards(SuperadminGuard) es el patron DEFINITIVO para endpoints de bootstrap/provision. Razon: chicken-and-egg (no hay JWT sin tenant, no hay tenant sin provision).
- DomainExceptionFilter registrado en ObservabilityModule (no en IdentityModule) porque es cross-cutting y el modulo ya es global con ERROR_REPORTER.
- ESLint `no-restricted-syntax` como ERROR (no warning) para casteos inseguros sobre Prisma Json. Los warnings se ignoran.
- Credenciales per-tenant ahora se persisten encriptadas en DB-Main y se usan en runtime (RNF-004 cumplido).
- TenantCredentialsModule @Global() provee credenciales a todos los BCs sin importar IdentityModule (evita duplicar APP_GUARD).
- PrismaTenantService.getClient() ahora es async — 21 callers actualizados mecanicamente.
- El saga de provisioning DEBE guardar el tenant antes de persistir credenciales (Prisma update necesita registro existente).

### Problemas Encontrados

**Bug 5 — DomainExceptionFilter no registrado:**

- **Descripcion:** El filter existia pero nunca se registro como APP_FILTER. Todos los errores de dominio devolvian HTTP 500.
- **Solucion:** Registrado como APP_FILTER en ObservabilityModule.
- **Prevencion:** Los tests E2E que pasan por la pipeline HTTP completa detectan este tipo de bugs. Los unit tests no.

**WSL crashes (x2):**

- **Descripcion:** WSL se cayo 2 veces durante la sesion, probablemente por Docker Desktop.
- **Solucion:** Reiniciar PC, `docker compose down -v`, relanzar.
- **Prevencion:** Guardar trabajo frecuentemente. Los sub-agentes que estaban corriendo se pierden.

**Healthcheck FATAL en PostgreSQL:**

- **Descripcion:** `pg_isready -U associated` generaba FATAL cada 10s porque la BD se llama `associated_main`.
- **Solucion:** Añadir `-d associated_main` al healthcheck.
- **Prevencion:** Siempre especificar `-d` en `pg_isready` cuando el nombre de BD difiere del usuario.

---

## Metricas de la Sesion

- **Duracion total:** ~18 horas (16:29 dia 16 - 10:28 dia 17, con interrupciones por crashes WSL)
- **Archivos modificados:** ~40
- **Archivos creados:** ~20 (VOs, ports, services, tests, modules, configs)
- **Commits realizados:** 1 (R1-R7), pendiente commit SDD credenciales
- **Tests creados/modificados:** ~120 nuevos
- **Tests totales verificados:** 1294 (1271 unit/integration + 23 E2E)
- **Bugs descubiertos:** 2 (Bug 5: DomainExceptionFilter, saga ordering)
- **Bugs corregidos:** 4 (Bug 5, healthcheck Docker, saga ordering, grantSchemaPermissions)
- **SDDs completados:** 2 (backend-http-layer-testing, tenant-credentials-persistence)

---

## Referencias

- Reporte de bugs: doc/reports/backend-bugs-frontend-testing.md
- Branch: mvp/backend-fase1
- SDD artifacts en engram: sdd/backend-http-layer-testing/\* (proposal, spec, design, tasks, decisions)
- SDD artifacts en engram: sdd/tenant-credentials-persistence/\* (explore, proposal, spec, design, tasks)
- Bug 5 en engram: bugs/domain-exception-filter-not-registered
- Feedback skills en engram: feedback/skill-injection-subagents

---

**Estado final:** Completada
**Proxima sesion:** Credential rotation, verify RNF-004 compliance en staging
