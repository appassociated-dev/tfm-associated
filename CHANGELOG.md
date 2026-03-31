# Changelog

Todos los cambios notables en este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### 20260331-001-acester-CLAUDE (retroactivo)

- **Fecha de sesion:** 31 de marzo de 2026
- **Hora de inicio:** 02:11
- **Hora de ultimos trabajos:** 02:58
- **Documento de sesion:** [doc/agents-sessions/20260331-001-acester-CLAUDE.md](doc/agents-sessions/20260331-001-acester-CLAUDE.md)
- **SDD Change:** `frontend-structural-quality`

#### Added

[Sin cambios]

#### Changed

- Centralizar claves de localStorage en modulo compartido `storage-keys.ts` — 3 claves movidas, 6 archivos actualizados
- Eliminar slug tecnico del selector de tenant — se muestra solo nombre y rol (UC-002)
- Corregir icono de baja por impago: `IconUserMinus` → `IconUserOff` (consistencia semantica)

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---

### 20260330-003-acester-CLAUDE

- **Fecha de sesion:** 30 de marzo de 2026
- **Hora de inicio:** 23:02
- **Hora de finalizacion:** 01:50
- **Documento de sesion:** [doc/agents-sessions/20260330-003-acester-CLAUDE.md](doc/agents-sessions/20260330-003-acester-CLAUDE.md)
- **SDD Change:** `domain-validation-naming` — COMPLETED
- **Verificacion:** PASS (18/18 tareas, 17/17 escenarios, 1098 tests, 0 TS errors)
- **Estado:** ARCHIVADO

#### Added

- Deteccion de menor en wizard de registro — Alert warning condicional + campos opcionales de representante legal (UC-006 FE-4)
- Tests de frontera para `calculateAge`: ano bisiesto Feb 29, edad exacta 17/18
- Parsing de fecha timezone-safe en `calculateAge` usando constructor de fecha local

#### Changed

- Campos de nombre de socio renombrados de `firstName`/`lastName` a `name`/`surnames` en schemas Zod, formularios y capa API alineando con nomenclatura canonica de la spec (UC-006, UC-011)
- Eliminada capa de transformacion en `registration.api.ts` — construccion explicita del payload sin `legalRep`

#### Fixed

- Bug de timezone en `calculateAge` — comparaba fecha de nacimiento UTC con fecha local de hoy
- Patron `.refine()` de Zod v4 — argumentos string literal convertidos a objetos `{ message }`
- Datos de representante legal persistian en formulario al cambiar de menor a adulto (RHF `shouldUnregister: false`)

#### Removed

[Sin cambios]

---

### 20260330-002-acester-CLAUDE

- **Fecha de sesion:** 30 de marzo de 2026
- **Hora de inicio:** 11:30
- **Hora de ultimos trabajos:** 13:15
- **Documento de sesion:** [doc/agents-sessions/20260330-002-acester-CLAUDE.md](doc/agents-sessions/20260330-002-acester-CLAUDE.md)

#### Added

- `activeSubscriptionsCount` en `FeePlanResponseDto` con Prisma `_count` filtrado por status ACTIVE (REQ-SPU-008, REQ-SPU-009)
- Filtro opcional `?memberTypeId=` en `GET /v1/treasury/fee-plans` con validacion UUID (REQ-SPU-005)
- Campos `isDefault` y `displayOrder` en respuesta filtrada por memberTypeId (REQ-SPU-006)
- `pendingChargesCount` en `SubscriptionResponseDto` (REQ-SPU-001)
- Badge "Recomendado" en `SubscriptionSelector` cuando `isDefault=true` (REQ-SPU-004)
- Labels descriptivos "Pago periodico"/"Pago unico" en `SubscriptionSelector` (REQ-SPU-003)
- Alerta de cargos pendientes en `ChangePlanModal` con plural i18n (REQ-SPU-002)
- CSS modules para `subscription-selector.tsx` y `change-plan-modal.tsx` (elimina inline styles)
- Prop `memberTypeId` en `ChangePlanModal` para filtrar planes por tipo de socio
- Typed i18n keys (`PlanTypeLabelKey`, `PlanTypeDescriptionKey`) eliminando `as never` casts
- 6 tests adicionales de verify: schema backward compat, handler combined filters, sort displayOrder

#### Changed

- `SubscriptionSelector` ahora pasa `memberTypeId` al hook `useFeePlans` (eliminado TODO linea 68)
- `feePlanSchema` Zod: `activeSubscriptionsCount` ahora required (no optional)
- `FeePlansListPage` pasa count real a `DeactivateFeePlanModal` (antes siempre 0)
- `ListFeePlansHandler` inyecta `MemberTypeFeePlanRepository` para composicion en memoria (AD-5)

#### Fixed

- Filtro `findAllWithCount()` usaba `notIn ['COMPLETED', 'CANCELLED']` pero DB tiene `ACTIVE/CLOSED` — corregido a `equals: 'ACTIVE'` (Judgment Day Round 1)
- `pendingChargesCount` contaba cargos de toda la cuenta, no del plan — i18n corregido a "en la cuenta del socio"
- i18n sin plural: "1 cargos pendientes" → keys `_one`/`_other` para gramatica correcta
- JSDoc y Swagger description stale tras fix de filtro status
- `buildFeePlan` factory y `validFeePlan` fixture sin `activeSubscriptionsCount` tras hacerlo required
- Test assertions con regex stale tras cambio de wording i18n

---

### 20260330-001-acester-CLAUDE

- **Fecha de sesion:** 30 de marzo de 2026
- **Hora de inicio:** 01:40
- **Hora de ultimos trabajos:** 01:50
- **Documento de sesion:** [doc/agents-sessions/20260330-001-acester-CLAUDE.md](doc/agents-sessions/20260330-001-acester-CLAUDE.md)

#### Added

- SDD Explore: inventario de 6 hooks de mutacion con gaps de error handling — 4 sin `onError`, 2 con manejo parcial; patron de referencia `useNonpaymentLeave` identificado
- SDD Propose: enfoque `handleMutationError(error, domainHandlers?)` como utilidad compartida en `web/src/shared/utils/`, alineado con RNF-049
- SDD Spec: 9 requisitos (REQ-MEH-001 a REQ-MEH-009) y 22 escenarios Given/When/Then cubriendo todos los codigos de error por hook
- SDD Design: diseno tecnico de `handleMutationError` con tipos TypeScript (`DomainErrorHandlers`), type narrowing sobre `error: unknown`, arquitectura de tests con vitest + MSW
- SDD Tasks: 19 tareas desglosadas en 5 fases (i18n → utilidad compartida → hooks membership → hooks treasury → verificacion)
- SDD Apply: utilidad `handleMutationError` creada en `web/src/shared/utils/` con TDD completo (8/8 tests GREEN)
- SDD Apply: claves i18n de error anadidas a `membership.json` y `treasury.json`

#### Changed

- `useDeactivateFeePlan`: refactorizado para usar `handleMutationError`, eliminando logica inline duplicada

#### Fixed

- `useReinstateMember`: anadido `onError` con rama 422 especifica de dominio y fallback generico (8/8 tests GREEN)
- `useVoluntaryLeave`: anadido fallback generico para errores non-422 que se descartaban silenciosamente (6/6 tests GREEN)
- `useUpdateFeePlan`: anadido `onError` con fallback generico — errores no notificados al usuario (8/8 tests GREEN)
- `useActivateFeePlan`: anadido `onError` con rama 422 especifica de dominio y fallback generico (7/7 tests GREEN)
- `useDeactivateFeePlan`: anadido fallback generico para errores non-422 que se descartaban silenciosamente (8/8 tests GREEN)
- `useImportTemplate`: anadido `onError` con rama 422 especifica de dominio y fallback generico (10/10 tests GREEN)
- Tests en `useVoluntaryLeave` y `useDeactivateFeePlan` que afirmaban incorrectamente que el error silencioso era comportamiento correcto

#### Removed

[Sin cambios]

---

### 20260329-002-acester-CLAUDE

- **Fecha de sesion:** 29 de marzo de 2026
- **Hora de inicio:** 18:52
- **Hora de ultimos trabajos:** 00:47
- **Documento de sesion:** [doc/agents-sessions/20260329-002-acester-CLAUDE.md](doc/agents-sessions/20260329-002-acester-CLAUDE.md)

#### Added

- SDD Explore: backend funcional, frontend bloqueante (botón disabled, useDisclosure roto, sin navegación)
- SDD Propose: 9 entregables frontend definidos, scope puramente UI, riesgo bajo
- SDD Spec: 9 requisitos (REQ-LFC-001 a 009) con escenarios Given/When/Then para Leave Flow Completion
- SDD Design: 7 ADRs arquitectónicas (fix useDisclosure, lógica botón, doble confirm, hook extraído, navegación, timeline estática, notificación enriquecida)
- SDD Tasks: 19 tareas desglosadas en 5 fases de implementación
- SDD Apply Fase 1: Hook `useNonpaymentLeave` extraído con patrón use-voluntary-leave.ts — `web/src/features/membership/leave/hooks/` (7/7 tests GREEN)
- SDD Apply Fase 2: NonpaymentLeavePage corregida — useDisclosure fix, botón funcional, doble confirmación case-insensitive con TextInput "CONFIRMAR BAJA", timeline con getActivePhaseIndex(), notificación enriquecida
- SDD Apply Fase 3: Botón "Baja por impago" en LeaveActions con navegación (15/15 tests GREEN)
- SDD Apply Fase 4: Tests de página `nonpayment-leave.page.spec.tsx` cubriendo renderizado, happy path, edge cases, error 422 (16/16 tests GREEN)
- Hook `use-nonpayment-leave.ts` — encapsula mutación de baja por impago con error handling
- CSS module `nonpayment-leave.module.css` — estilos tipográficos extraídos de estilos inline (Judgment Day Round 2)
- Claves i18n para baja por impago en `web/src/i18n/locales/es/membership.json`
- Judgment Day Round 1: revisión adversarial paralela (2 jueces ciegos) — 3 CRITICAL + 6 WARNING detectados y corregidos (12 correcciones aplicadas)
- Judgment Day Round 2: re-revisión — inline styles eliminados via CSS module, i18n test reliability aceptado como bajo riesgo
- Judgment Day Round 3: VEREDICTO LIMPIO — APROBADO ✅
- SDD Verify: validación formal completada — PASS WITH WARNINGS (9/9 requisitos validados, 19/19 tareas completadas, 2 warnings non-blocking: archivo i18n nuevo, CSS module permitido)
- SDD Archive: `leave-flow-completion` archivado exitosamente — delta specs sincronizadas, artifacts persistidos

#### Changed

- `nonpayment-leave.page.tsx`: useDisclosure fix, lógica botón con guard `member.status === 'ACTIVE'`, doble confirmación con TextInput, timeline con getActivePhaseIndex(), notificación enriquecida, estilos inline → CSS module
- `leave-actions.tsx`: nuevo botón "Baja por impago" con navegación a ruta de baja por impago
- `leave-actions.spec.tsx`: tests actualizados para cubrir nuevo botón y estados
- `membership.json`: nuevas claves i18n para baja por impago

#### Fixed

- Error silencioso en catch de baja por impago — errores non-422 ahora notifican al usuario (Judgment Day Round 1, CRITICAL)
- Modal permanecía abierto al recibir error — ahora gestiona correctamente el estado de cierre (Judgment Day Round 1, CRITICAL)
- memberId undefined resultaba en no-op silencioso — añadido guard con feedback al usuario (Judgment Day Round 1, CRITICAL)
- Tooltip sobre botón deshabilitado y clave compartida de tooltip — corregidos (Judgment Day Round 1, WARNING)
- Fecha ISO cruda en notificación — formateada para el usuario (Judgment Day Round 1, WARNING)

#### Removed

[Sin cambios]

---

### 20260329-001-acester-CLAUDE

- **Fecha de sesion:** 29 de marzo de 2026
- **Hora de inicio:** 18:50
- **Hora de ultimos trabajos:** 19:44
- **Documento de sesion:** [doc/agents-sessions/20260329-001-acester-CLAUDE.md](doc/agents-sessions/20260329-001-acester-CLAUDE.md)

#### Added

- `@nestjs/throttler ^6.5.0` instalado como dependencia de produccion en `api/`
- `ThrottlerModule.forRoot()` en `AppModule` con named throttlers: `login` (5 req/10min, blockDuration 15min) y `default` (100 req/min)
- `ThrottlerGuard` registrado como `APP_GUARD` global — se ejecuta antes de `JwtAuthGuard` para proteccion en endpoints publicos (REQ-RL-005)
- `@Throttle({ login: {} })` en endpoints `POST /auth/login` y `POST /auth/refresh` (REQ-RL-002)
- `@SkipThrottle({ default: true, login: true })` en `HealthController` para excluir probes de k8s (REQ-RL-004)
- 10 tests unitarios de throttling en `auth.controller.throttle.spec.ts`
- 7 tests de integracion del `ThrottlerGuard` en `throttler-integration.spec.ts`

#### Changed

- `AppModule`: registrado `ThrottlerModule` y `ThrottlerGuard` como `APP_GUARD` (REQ-RL-001)
- `AuthController`: decorado con `@Throttle` en login y refresh (REQ-RL-002)
- `HealthController`: decorado con `@SkipThrottle` (REQ-RL-004)

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---

### 20260329-001-acester-CLAUDECODE

- **Fecha de sesion:** 29 de marzo de 2026
- **Hora de inicio:** 05:19
- **Hora de ultimos trabajos:** 18:17
- **Documento de sesion:** [doc/agents-sessions/20260329-001-acester-CLAUDECODE.md](doc/agents-sessions/20260329-001-acester-CLAUDECODE.md)

#### Added

- Campo `tenantId` opcional en `DomainEvent` base class y `DomainEventParams` para propagar tenant context en Integration Events reconstituidos (ADR-008)
- `CreateMemberAccountCommand` + `CreateMemberAccountHandler` en BC-Treasury con check de idempotencia via `existsByMemberId()` (UC-006, UC-011)
- 7 `@EventsHandler` en BC-Treasury para consumir Integration Events de BC-Membership: `OnMemberRegistered`, `OnMemberDeactivated`, `OnMemberReinstated`, `OnMemberDataUpdated` (stub), `OnMemberStatusChanged` (stub), `OnFiscalYearOpened`, `OnMemberTypeChanged` (ADR-008, UC-006/007/010/011/013)
- `OnPaymentRecordedMembershipHandler` en BC-Membership para reaccionar a `PaymentRecorded` de BC-Treasury: actualiza estado de morosidad PENDING_PAYMENT → ACTIVE (ADR-008, UC-021)
- Integration test del pipeline completo de consumo: outbox row → reconstitución → EventBus → @EventsHandler → CommandBus (3 escenarios: happy path, null tenantId, error isolation)

#### Changed

- `OutboxEventRow` interface incluye `tenantId: string | null` mapeado desde columna `tenant_id` de outbox_events
- `EventReconstitutionRegistry.reconstitute()` propaga `tenantId` del outbox row al evento reconstituido

#### Fixed

- Bug de serializacion Date en `OnFiscalYearOpenedTreasuryHandler`: `.getMonth()` sobre string del JSON retornaba NaN — corregido con `new Date()` parsing (Judgment Day Round 1)
- Stub handlers con `constructor(unknown)` rompia NestJS DI — corregido con `CommandBus` tipado + tenantId guard + try/catch (Judgment Day Round 1)
- `OnMemberDeactivatedTreasuryHandler`: try/catch envolvia todo el loop de subscripciones — movido dentro del loop para aislamiento per-subscripcion (Judgment Day Round 1)
- Ternary muerto `defaultPlan ? 0 : 0` en `OnMemberTypeChangedTreasuryHandler` reemplazado por constante con TODO (Judgment Day Round 1)

#### Removed

[Sin cambios]

---

### 20260328-002-acester-CLAUDECODE

- **Fecha de sesión:** 28 de marzo de 2026
- **Hora de inicio:** 18:14
- **Hora de últimos trabajos:** 00:52
- **Documento de sesión:** [doc/agents-sessions/20260328-002-acester-CLAUDECODE.md](doc/agents-sessions/20260328-002-acester-CLAUDECODE.md)

#### Added

- `IntegrationEventPublisher` — puerto + implementación `PrismaIntegrationEventPublisher` para publicar Integration Events en outbox de main DB (ADR-008, ENT-006)
- `DomainAuditPublisher` — puerto + implementación `PrismaDomainAuditPublisher` para audit-only en tenant DB dentro de la misma transacción de negocio (ENT-017)
- `EventReconstitutionRegistry` — registro de eventType → clase para reconstituir eventos tipados desde JSON; los 3 BCs registran 24 tipos en `onModuleInit`
- `OutboxProcessorModule` (`@Global`) — módulo compartido que exporta ambos publishers y el registry; registrado en AppModule
- Columna `processingStartedAt` en main DB `outbox_events` para stale recovery correcto (Judgment Day)
- Integration tests del pipeline outbox y del publisher (pending→processed, stale recovery, dual-write)
- 30+ unit tests para la nueva infraestructura de eventos (publishers, registry, processor)

#### Changed

- `DomainEvent` base class — añadidos 4 campos (`aggregateId`, `aggregateType`, `boundedContext`, `actorId`); constructor migrado a params object; soporte opcional `eventId`/`occurredOn` para reconstitución
- `OutboxProcessorService` — reescritura completa: polling cada 5s, batch de 50, mutex en-proceso, stale recovery con `processingStartedAt`, dispatch a EventBus, aislamiento de errores por evento
- 24 subclases `DomainEvent` actualizadas (5 Identity, 9 Membership, 10 Treasury): `eventType` en PascalCase, nuevo constructor con params object
- BC-Membership (6 handlers) y BC-Treasury (12 handlers): migrados de publishers BC-específicos a `INTEGRATION_EVENT_PUBLISHER` compartido
- BC-Identity `ProvisionTenantHandler`: ahora publica eventos (antes se descartaban silenciosamente)
- Schemas Prisma main (`OutboxEvent`) y tenant (`OutboxEvent`) reescritos per ENT-006 y ENT-017 con las migraciones correspondientes
- `PrismaMainService` — añadido método `$transaction` delegado al cliente Prisma

#### Fixed

- Stale recovery usaba `createdAt` en lugar de `processingStartedAt` — corregido con nueva columna (Judgment Day Round 1)
- `updateMany` del processor sin filtro `status: 'pending'` — podía actualizar rows ya `processed` o `failed` (Judgment Day Round 1)
- 5 tests de dominio con `eventType` en formato legacy (dot-notation / kebab) — actualizados a PascalCase

#### Removed

- `PrismaMemberOutboxPublisher` + port de BC-Membership (reemplazado por publisher compartido)
- `PrismaTreasuryOutboxPublisher` + port de BC-Treasury (reemplazado por publisher compartido)

---

### 20260328-001-acester-CLAUDECODE

- **Fecha de sesión:** 28 de marzo de 2026
- **Hora de inicio:** 11:00
- **Hora de últimos trabajos:** 18:32
- **Documento de sesión:** [doc/agents-sessions/20260328-001-acester-CLAUDECODE.md](doc/agents-sessions/20260328-001-acester-CLAUDECODE.md)

#### Added

- RNF-067 "Entrega Garantizada de Integration Events" con criterios at-least-once delivery, retry policy y stale recovery

#### Changed

- ADR-004 y ADR-008 reescritos con nueva estrategia dual de eventos: Domain Events (audit-only en tenant DB) e Integration Events (Outbox Pattern en main DB)
- ENT-006 (main DB) y ENT-017 (tenant DB) redefinidos con schemas diferenciados para Integration Events y Domain Events respectivamente
- Tablas de eventos por BC en modelo de dominio reclasificadas con columna "Tipo" (Integration | Domain)
- UC-047 re-arquitectado: OutboxProcessor reemplaza @OnEvent in-process para consumo de Integration Events
- UC-048 corregido: generación PDF por llamada directa en command handler, sin @OnEvent
- Renombrado global en spec/: "Business Events" → "Integration Events", "Internal Events" → "Domain Events"

#### Fixed

- Trazabilidad rota ENT-006 y ENT-017: RNF-015 (inexistente para eventos) reemplazado por RNF-067
- Anchor roto en índice de ADR-008 en spec/006_adrs.md

#### Removed

[Sin cambios]

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
