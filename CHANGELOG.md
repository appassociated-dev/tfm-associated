# Changelog

Todos los cambios notables en este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

[Vacío pendiente de iniciar nuevas sesiones]

---

## [0.1.1] - 2026-03-31

- **Fecha de release:** 31 de marzo de 2026
- **Tipo:** Patch
- **Periodo de desarrollo:** 28/03/2026 – 31/03/2026
- **Commits:** 28 commits desde `e6c80a1` hasta `0d88fc2`
- **Tests:** 2442/2442 tests pasando (100%) — API: 1330 (139 suites), Web: 1112 (73 suites)
- **Sesiones de trabajo:**
  - [doc/agents-sessions/20260331-003-acester-CLAUDECODE.md](doc/agents-sessions/20260331-003-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260331-002-acester-CLAUDE.md](doc/agents-sessions/20260331-002-acester-CLAUDE.md)
  - [doc/agents-sessions/20260331-001-acester-CLAUDE.md](doc/agents-sessions/20260331-001-acester-CLAUDE.md)
  - [doc/agents-sessions/20260330-003-acester-CLAUDE.md](doc/agents-sessions/20260330-003-acester-CLAUDE.md)
  - [doc/agents-sessions/20260330-002-acester-CLAUDE.md](doc/agents-sessions/20260330-002-acester-CLAUDE.md)
  - [doc/agents-sessions/20260330-001-acester-CLAUDE.md](doc/agents-sessions/20260330-001-acester-CLAUDE.md)
  - [doc/agents-sessions/20260329-002-acester-CLAUDE.md](doc/agents-sessions/20260329-002-acester-CLAUDE.md)
  - [doc/agents-sessions/20260329-001-acester-CLAUDE.md](doc/agents-sessions/20260329-001-acester-CLAUDE.md)
  - [doc/agents-sessions/20260329-001-acester-CLAUDECODE.md](doc/agents-sessions/20260329-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260328-002-acester-CLAUDECODE.md](doc/agents-sessions/20260328-002-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260328-001-acester-CLAUDECODE.md](doc/agents-sessions/20260328-001-acester-CLAUDECODE.md)

### Added

**Backend - Domain Events Infrastructure (ADR-008)**

- `IntegrationEventPublisher` + `PrismaIntegrationEventPublisher` para outbox en main DB (ENT-006)
- `DomainAuditPublisher` + `PrismaDomainAuditPublisher` para audit-only en tenant DB (ENT-017)
- `EventReconstitutionRegistry` para reconstitucion tipada de eventos desde JSON (24 tipos en 3 BCs)
- `OutboxProcessorModule` (`@Global`): polling 5s, batch 50, mutex, stale recovery
- 7 `@EventsHandler` cross-BC en BC-Treasury: `OnMemberRegistered`, `OnMemberDeactivated`, `OnMemberReinstated`, `OnFiscalYearOpened`, `OnMemberTypeChanged` + 2 stubs (ADR-008, UC-006/007/010/011/013)
- `OnPaymentRecordedMembershipHandler` en BC-Membership: actualiza morosidad PENDING_PAYMENT → ACTIVE (ADR-008, UC-021)
- RNF-067 "Entrega Garantizada de Integration Events" con criterios at-least-once delivery, retry policy y stale recovery
- 30+ unit tests + integration tests para infraestructura de eventos

**Backend - Rate Limiting (RNF-011)**

- `@nestjs/throttler`: login 5 req/10min (blockDuration 15min), default 100 req/min
- `ThrottlerGuard` global (`APP_GUARD`), `@Throttle` en login/refresh, `@SkipThrottle` en health
- 17 tests (10 unit + 7 integration)

**Frontend - Leave Flow Completion (UC-013)**

- `NonpaymentLeavePage`: `useDisclosure` fix, doble confirmacion, timeline, notificacion enriquecida
- Hook `useNonpaymentLeave` + CSS module + claves i18n
- Boton "Baja por impago" en `LeaveActions` con navegacion

**Frontend - Mutation Error Handling (RNF-049)**

- Utilidad compartida `handleMutationError` con `DomainErrorHandlers` tipados
- `onError` implementado en 6 hooks: `useReinstateMember`, `useVoluntaryLeave`, `useUpdateFeePlan`, `useActivateFeePlan`, `useDeactivateFeePlan`, `useImportTemplate`
- Claves i18n de error en `membership.json` y `treasury.json`

**Frontend - Subscription Plan UX (UC-017, UC-018)**

- `activeSubscriptionsCount` en `FeePlanResponseDto` con `_count` filtrado por status ACTIVE (REQ-SPU-008, REQ-SPU-009)
- `pendingChargesCount` en `SubscriptionResponseDto` (REQ-SPU-001)
- Filtro `?memberTypeId=` en `GET /v1/treasury/fee-plans` con validacion UUID (REQ-SPU-005)
- Badge "Recomendado", labels pago periodico/unico, alerta cargos pendientes con plural i18n

**Frontend - Domain Validation & Naming (UC-006, UC-011)**

- Deteccion de menor en wizard de registro con campos de representante legal
- `calculateAge` con parsing timezone-safe y tests de frontera (ano bisiesto, edad exacta 17/18)
- Campos renombrados `firstName`/`lastName` → `name`/`surnames` alineando con spec

**Frontend - Structural Quality**

- Claves localStorage centralizadas en `storage-keys.ts`
- Selector de tenant sin slug tecnico (solo nombre y rol)

**Frontend - Zod Schema Contract Sync**

- 5 schemas Zod auditados y sincronizados con DTOs backend
- 7 campos phantom eliminados de `feeSubscriptionSchema` y `memberSubscriptionsResponseSchema`
- Runtime bug `MemberSubscriptionsPage` resuelto (pagina rota contra API real)

**Backend - Swagger UI (RNFT-057)**

- API key security scheme en `DocumentBuilder` + persistent authorization
- Bearer auth decorators en 8 controllers
- `DomainExceptionFilter`: JSON responses, `BadRequestException` array handling, 500 fallback con Sentry

### Changed

- `DomainEvent` base class: 4 nuevos campos (`aggregateId`, `aggregateType`, `boundedContext`, `actorId`), constructor migrado a params object
- 24 subclases `DomainEvent` actualizadas (5 Identity, 9 Membership, 10 Treasury): `eventType` en PascalCase, nuevo constructor
- `OutboxProcessorService` reescrito: polling 5s, batch 50, mutex, stale recovery con `processingStartedAt`
- BC-Membership (6 handlers) y BC-Treasury (12 handlers) migrados a `INTEGRATION_EVENT_PUBLISHER` compartido
- Schemas Prisma main y tenant reescritos per ENT-006 y ENT-017 con migraciones correspondientes
- ADR-004 y ADR-008 reescritos: estrategia dual Domain Events (audit) + Integration Events (outbox)
- Campos de nombre renombrados `firstName`/`lastName` → `name`/`surnames` en schemas Zod, formularios y capa API
- `feePlanSchema` Zod: `activeSubscriptionsCount` ahora required (no optional)
- `SubscriptionSelector` pasa `memberTypeId` a `useFeePlans` (eliminado TODO)
- `ListFeePlansHandler` inyecta `MemberTypeFeePlanRepository` para composicion en memoria (AD-5)
- `useDeactivateFeePlan` refactorizado a `handleMutationError`
- `nonpayment-leave.page.tsx`: `useDisclosure` fix, logica boton, doble confirmacion, timeline, notificacion enriquecida, estilos inline → CSS module
- localStorage centralizado en `storage-keys.ts`
- Selector de tenant: solo nombre y rol (eliminado slug tecnico)
- Icono baja: `IconUserMinus` → `IconUserOff`

### Fixed

**Swagger UI**

- API key + Bearer auth + persistent authorization + JSON exception responses (REQ-SWAGGER-001..005)
- `DomainExceptionFilter`: `BadRequestException` array handling, 500 fallback con Sentry
- `AuthController` `@ApiBearerAuth` posicionado a nivel de metodo para controllers mixtos publico/protegido

**Domain Events**

- Stale recovery usaba `createdAt` en vez de `processingStartedAt`
- `updateMany` sin filtro `status: 'pending'` podia actualizar rows `processed`/`failed`
- Serializacion Date en `OnFiscalYearOpenedTreasuryHandler`: `.getMonth()` sobre string retornaba NaN
- Stub handlers con `constructor(unknown)` rompia NestJS DI
- `try/catch` en `OnMemberDeactivatedTreasuryHandler` movido dentro del loop para aislamiento per-subscripcion
- Ternary muerto `defaultPlan ? 0 : 0` reemplazado por constante con TODO
- 5 tests con `eventType` en formato legacy actualizados a PascalCase

**Frontend Schemas & Validation**

- `typeDiscount`/`personalDiscount` corregidos a non-nullable
- `createdAt` corregido a `.datetime()`
- `memberAccountId` en mocks corregido a UUID valido
- `frequency` nullable eliminado del response schema
- Patron `.refine()` de Zod v4: string literal → `{ message }`
- `calculateAge`: bug de timezone comparando UTC vs local

**Frontend UX**

- `findAllWithCount` filtro `status: notIn COMPLETED/CANCELLED` → `equals: 'ACTIVE'` (DB tiene ACTIVE/CLOSED)
- `pendingChargesCount` contaba cargos de toda la cuenta, corregido scope al plan
- i18n plural: "1 cargos pendientes" → keys `_one`/`_other`
- Datos de representante legal persistian al cambiar de menor a adulto (`shouldUnregister`)
- Error silencioso en 6 hooks de mutacion (errores non-422 no notificados al usuario)
- Modal baja permanecia abierto al recibir error
- `memberId` undefined resultaba en no-op silencioso
- Tests que afirmaban error silencioso como comportamiento correcto

**Spec & Docs**

- Trazabilidad rota ENT-006/ENT-017: RNF-015 reemplazado por RNF-067
- Anchor roto en indice ADR-008

### Removed

- Campos phantom de `feeSubscriptionSchema`: `feePlanType`, `baseAmount`, `chargesGenerated`, `totalCollected`
- Campos phantom de `memberSubscriptionsResponseSchema`: `memberName`, `memberTypeId`, `memberTypeName`, `closedSubscriptions`
- `PrismaMemberOutboxPublisher` + port de BC-Membership (reemplazado por publisher compartido)
- `PrismaTreasuryOutboxPublisher` + port de BC-Treasury (reemplazado por publisher compartido)

---

## [0.1.0] - 2026-03-25

- **Fecha de release:** 25 de marzo de 2026
- **Tipo:** Minor
- **Periodo de desarrollo:** 25/02/2026 – 25/03/2026
- **Commits:** 83 commits desde `3839874` hasta `5aa3c6b`
- **Sesiones de trabajo:**
  - [doc/agents-sessions/20260225-001-pvidal-CLAUDE.md](doc/agents-sessions/20260225-001-pvidal-CLAUDE.md)
  - [doc/agents-sessions/20260226-001-pvidal-CLAUDE.md](doc/agents-sessions/20260226-001-pvidal-CLAUDE.md)
  - [doc/agents-sessions/20260310-001-pvidal-CLAUDE.md](doc/agents-sessions/20260310-001-pvidal-CLAUDE.md)
  - [doc/agents-sessions/20260310-002-pvidal-CLAUDE.md](doc/agents-sessions/20260310-002-pvidal-CLAUDE.md)
  - [doc/agents-sessions/20260311-001-pvidal-CLAUDE.md](doc/agents-sessions/20260311-001-pvidal-CLAUDE.md)
  - [doc/agents-sessions/20260314-001-acester-CLAUDECODE.md](doc/agents-sessions/20260314-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260314-002-acester-CLAUDECODE.md](doc/agents-sessions/20260314-002-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260315-001-acester-CLAUDECODE.md](doc/agents-sessions/20260315-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260316-001-acester-CLAUDECODE.md](doc/agents-sessions/20260316-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260316-002-acester-CLAUDE.md](doc/agents-sessions/20260316-002-acester-CLAUDE.md)
  - [doc/agents-sessions/20260317-001-acester-CLAUDE.md](doc/agents-sessions/20260317-001-acester-CLAUDE.md)
  - [doc/agents-sessions/20260317-002-acester-CLAUDECODE.md](doc/agents-sessions/20260317-002-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260318-001-acester-CLAUDECODE.md](doc/agents-sessions/20260318-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260319-001-acester-CLAUDECODE.md](doc/agents-sessions/20260319-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260320-001-acester-CLAUDECODE.md](doc/agents-sessions/20260320-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260322-001-acester-CLAUDECODE.md](doc/agents-sessions/20260322-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260323-001-acester-CLAUDECODE.md](doc/agents-sessions/20260323-001-acester-CLAUDECODE.md)
  - [doc/agents-sessions/20260324-001-acester-CLAUDECODE.md](doc/agents-sessions/20260324-001-acester-CLAUDECODE.md)

### Added

- Scaffold completo del proyecto monorepo con workspaces npm (api + web), Prisma 7 dual-schema, pipeline CI GitHub Actions
- UC-001: Provision de nuevo tenant con saga de 10 pasos, rollback compensatorio idempotente, creacion de BD + usuario PostgreSQL + migraciones + seed roles
- UC-002: Autenticacion multi-tenant completa - User aggregate con lockout temporal, JWT strategy, 5 endpoints auth, guards globales (JwtAuthGuard, PermissionsGuard, SuperadminGuard)
- UC-006: Gestion de ficha de socio - 6 Value Objects (PersonalData, ContactData, IdentityDocument con validacion DNI/NIE mod-23, BankDetails con validacion IBAN mod-97, MemberNumber, CustomFields), cifrado AES-256-GCM para IBAN, 4 endpoints REST, 184 tests
- UC-007: Gestion de estados de socio - maquina de estados con transiciones validadas, StatusHistory, eventos MemberStatusChanged
- UC-008: Gestion de tipos de socio - MemberType aggregate, RulesEvaluator, plantillas por colectividad, 7 endpoints REST
- UC-010: Gestion de ejercicios fiscales - FiscalYear aggregate, DateRange VO, CQRS handlers, controller REST
- UC-011: Proceso de alta simplificado backend (3 pasos con guardado de progreso) y frontend (wizard Mantine Stepper con validacion DNI mod 23, selector tipo socio, verificacion email debounce, cargo inscripcion)
- UC-013: Baja y reingreso de socios backend (Leave, Expulsion, Reinstatement con conservacion numero socio) y frontend (baja voluntaria, baja por impago con workflow 5 fases, rehabilitacion con desglose costes, StatusBadge/StatusTimeline/LeaveActions)
- UC-017: Gestion de planes de cuota backend (FeePlan aggregate, Amount VO centavos, Periodicity) y frontend (CRUD con tabla filtrable, formulario condicional RECURRING/ONE_TIME, vinculacion tipos socio, plantillas, inactivacion protegida)
- UC-018: Gestion de suscripciones de cuota backend (MemberAccount aggregate, FeeSubscription, Discount VO multiplicativo, 6 endpoints REST) y frontend (selector plan, descuentos multiplicativos, cambio plan, timeline historico, exenciones)
- UC-019: Generacion masiva de cargos periodicos - Charge entity, GenerateChargesHandler, repositorio y controller
- UC-021: Registro de cobros - Payment entity, RegisterPaymentHandler, ReceiptGeneratedEvent, PDF receipt service
- Credenciales per-tenant encriptadas (AES-256-GCM) con EncryptedSecret VO, TenantCredentialService y TenantCredentialsModule global
- Tests HTTP integracion: TenantsController (7 tests), AuthController (12 tests), PermissionsGuard (12 escenarios), generate-prisma-bridges (22 tests)
- Theme Mantine completo con paleta brand, tipografia Inter, spacing, shadows y 11 component defaults; 6 logos SVG
- AuthProvider con token en memoria, refresh automatico y token accessors para interceptors Axios
- AppLayout con sidebar agrupado por BC, dark mode adaptativo, logos adaptativos, sidebar colapsable con tooltips
- Infraestructura i18n con react-i18next: 7 namespaces, 45+ componentes migrados, 28 mensajes Zod internacionalizados
- Suite completa de tests frontend: factories (auth, member, fee-plan, subscription, tenant), helpers de render, MSW handlers - 92 archivos, 19806 inserciones
- Stack Docker produccion: 4 servicios (postgres, migration, api, web), multi-stage builds, nginx host con SSL, health check, scripts de operaciones (deploy, migracion, seed, verificacion)
- Documentacion exhaustiva de despliegue (8 documentos) y README del proyecto actualizado
- Endpoint `GET /api/v1/health` con `@nestjs/terminus`
- Endpoint `PATCH /api/v1/treasury/fee-plans/:id/activate` para reactivar planes inactivos
- Endpoints de verificacion: `GET /api/v1/members/check-email/:email` y `GET /api/v1/members/preconditions`
- Utilidad compartida `parsePermissions(raw)` con 12 tests unitarios
- Regla ESLint `no-restricted-syntax` (ERROR) para casteos inseguros sobre campos Prisma Json
- Skill registry generado en `.atl/skill-registry.md` (45 skills, 8 convenciones)

### Changed

- Prisma 7 configurado con `prisma.config.ts` dual (main + tenant), provider `prisma-client`, driver adapter `@prisma/adapter-pg`
- PrismaTenantService.getClient() ahora async - usa credenciales per-tenant via TenantCredentialProvider (RNF-004)
- Migrado stack frontend a Zod 4 + react-hook-form (desde Zod 3.25 + @mantine/form)
- Frontend con soporte dark mode: CSS migrado de variables fijas a variables semanticas de Mantine, logos adaptativos por color scheme
- Sidebar reestructurado con NAV_SECTIONS agrupadas por Bounded Context, permisos alineados con SYSTEM_ROLES del backend
- Optimizado test suite backend: eliminados ~87 tests redundantes, fortalecidas ~22 assertions debiles
- Plugin SWC (vitest-plugin-swc) para soporte de metadata de decoradores NestJS (transform 78s a 2.5s)
- Movidos `tsconfig-paths`, `prisma`, `dotenv` de devDependencies a dependencies en api
- Refactorizado `PermissionsGuard` para usar utilidad compartida `parsePermissions` con validacion runtime
- Sustituidas referencias a @mantine/form por RHF en 10 archivos de spec/doc
- Actualizados 17 documentos de diseno frontend con documentos de marca (colores, logos, formatos)
- LoginResponseSchema actualizado de formato nested a flat para coincidir con backend

### Fixed

- Race condition en auth: `applyLoginResponse` ahora async con `await getCurrentUser()` - permisos disponibles antes de renderizar
- Loop infinito en tests frontend: `watch()` sin argumentos en personal-data-step.tsx generaba nuevo objeto cada render
- Error critico Prisma 7 P1012: URL no permitida en datasource del schema - migrado a `prisma.config.ts`
- DomainExceptionFilter registrado como APP_FILTER en ObservabilityModule - errores de dominio ahora devuelven status codes correctos
- Interceptor Axios corregido para excluir todos los endpoints `/auth/` (antes solo excluia `/auth/refresh`)
- Pipeline CI: `prisma generate` antes de lint/tests (resuelve 30 fallos por modulos no encontrados)
- Path de configuracion Prisma en DatabaseProvisioningService (`process.cwd()` → `__dirname`)
- Configuracion HTTP/2 en nginx 1.24 (`http2 on;` → `listen 443 ssl http2;`)
- 4 errores ESLint `no-restricted-syntax` que bloqueaban CI lint
- 6 errores TypeScript `tsc --noEmit` que bloqueaban CI typecheck
- Bug generate-prisma-bridges.js: regex sobre-escapadas impedian generar modelos Prisma
- Bug JSON.stringify innecesario en database-provisioning.service.ts (Prisma auto-serializa campos Json)
- Token stale race condition: accessTokenRef sincronico para interceptor Axios
- Loop infinito en wizard de alta: callbacks handleStep0/1ValidChange envueltos en useCallback
- URL check-dni corregida: 2 segmentos para coincidir con endpoint backend
- Corregidas vinculaciones de tipos de socio a planes (GetFeePlanHandler, LinkMemberTypesHandler, DTOs)
- Corregidas precondiciones de alta de socio (setTenantId en registrationChargePort)
- 7 mismatches en schemas Zod de leave alineados con respuesta real del backend
- Version @mantine/notifications actualizada para evitar doble instancia de @mantine/core
- 5+ errores DI (UnknownDependenciesException) por `import type` en providers NestJS
- 48 issues de auditoria del frontend fase 1 resueltos (6 P0 criticos, 12 P1, 18 P2, 12 P3)
- 4 errores TypeScript typecheck en el frontend

### Removed

- `web/src/app/theme.ts` placeholder (migrado a shared/theme/)
- Metodo privado `parsePermissions()` de PermissionsGuard (extraido a utilidad compartida)
- Imports y variables sin uso en 22 archivos del workspace API
- 4 archivos de test de typed IDs redundantes (cubiertos por tests de clase base)

---
