# Changelog

Todos los cambios notables en este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### 20260314-002-acester-CLAUDECODE

- **Fecha de sesion:** 14 de marzo de 2026
- **Hora de inicio:** 19:30
- **Hora de ultimos trabajos:** 19:44
- **Documento de sesion:** [doc/agents-sessions/20260314-002-acester-CLAUDECODE.md](doc/agents-sessions/20260314-002-acester-CLAUDECODE.md)

#### Added

- Implementada Task 0 — Brand Setup: infraestructura de identidad visual del frontend
- Creado theme definitivo Mantine en `web/src/shared/theme/associated-theme.ts` con paleta brand, tipografia Inter, spacing, shadows y 11 component defaults
- Copiados 6 SVGs de produccion a `web/src/shared/assets/` (isotipo, logo-horizontal, logo-stacked en variantes color y white)
- Creadas utilities de formateo: `format-money.ts` (formatMoney) y `format-date.ts` (formatDateLong, formatDateCompact)
- Persistidos artefactos SDD completos en engram (explore, proposal, spec, design, tasks, state)
- Creados 19 unit tests: format-money (5), format-date (4), associated-theme (10) — 21/21 tests pasan

#### Changed

- Actualizado `web/index.html` con favicon, Inter (display=swap), meta tags, Open Graph, Twitter Card y PWA manifest
- Actualizado `web/src/app/providers.tsx`: import de associatedTheme y `forceColorScheme="light"`

#### Fixed

[Sin cambios]

#### Removed

- Eliminado `web/src/app/theme.ts` (placeholder con primaryColor: 'blue', migrado a shared/theme/)

---

### 20260314-001-acester-CLAUDECODE

- **Fecha de sesion:** 14 de marzo de 2026
- **Hora de inicio:** 18:29
- **Hora de ultimos trabajos:** 18:29
- **Documento de sesion:** [doc/agents-sessions/20260314-001-acester-CLAUDECODE.md](doc/agents-sessions/20260314-001-acester-CLAUDECODE.md)

#### Added

- Documento de diseno `task-0-brand-setup.md` para configuracion de identidad visual como tarea previa a todas las features de frontend (fase 1)
- Skill registry generado en `.atl/skill-registry.md` (45 skills, 8 convenciones)

#### Changed

- Alineados 17 documentos de diseno frontend (fases 1-3) con los documentos de marca: colores semanticos corregidos (orange→yellow), logos especificos por contexto, `formatMoney()` referenciado, badge defaults explicitos, `color="brand"` en botones primarios, formato de fechas espanol
- Anadidas referencias a `001-associated-brand-foundation.md` y `002-associated-ui-product-guidelines.md` en la seccion "Referencia de especificacion" de los 17 documentos
- Actualizado checklist de dependencias de `task-1-UC-002.md`: 3 items de marca reemplazados por dependencia unica a Task 0

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---

### 20260311-001-pvidal-CLAUDE

- **Fecha de sesion:** 11 de marzo de 2026
- **Hora de inicio:** 08:45
- **Hora de ultimos trabajos:** 13:00
- **Documento de sesion:** [doc/agents-sessions/20260311-001-pvidal-CLAUDE.md](doc/agents-sessions/20260311-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-017: Gestion de planes de cuota (Backend) en BC-Treasury — FeePlan aggregate, Amount VO en centavos, Periodicity, controller REST
- Implementada UC-018: Gestion de suscripciones de cuota (Backend) — MemberAccount aggregate, FeeSubscription entity, Discount VO multiplicativo, 6 endpoints REST, 105 tests
- Implementada UC-019: Generacion masiva de cargos periodicos (Backend) — Charge entity, GenerateChargesHandler, repositorio y controller
- Implementada UC-021: Registro de cobros (Backend) — Payment entity, RegisterPaymentHandler, ReceiptGeneratedEvent, PDF receipt service

#### Changed

- PrismaMemberAccountRepository extendido para hidratar y persistir charges y payments junto al aggregate
- ProvisionTenantHandler corregido para guardar tenant antes de crear membership
- DatabaseProvisioningService con createAdminUser envuelto en transaccion
- Gate de cobertura ajustado para centrarse en logica manual (excluyendo generado/infra glue)

#### Fixed

- Corregido orden de provisionado UC-001: tenant se persiste antes de membership
- Corregida hidratacion incompleta de MemberAccount en UC-021 (faltaban charges/payments)
- Corregida emision de ReceiptGeneratedEvent en handlers de pago
- Eliminados casts `any` en GetReceiptHandler
- Estabilizados fixtures de integracion UC-001 (CIFs validos, schema sincronizado)

#### Removed

[Sin cambios]

---

### 20260310-002-pvidal-CLAUDE

- **Fecha de sesion:** 10 de marzo de 2026
- **Hora de inicio:** 09:00
- **Hora de ultimos trabajos:** 16:28
- **Documento de sesion:** [doc/agents-sessions/20260310-002-pvidal-CLAUDE.md](doc/agents-sessions/20260310-002-pvidal-CLAUDE.md)

#### Added

- Implementada UC-010: Gestion de ejercicios fiscales (Backend) — FiscalYear aggregate, DateRange VO, CQRS handlers, controller REST
- Implementada UC-007: Gestion de estados de socio (Backend) — Maquina de estados con transiciones validadas, StatusHistory, eventos MemberStatusChanged
- Implementada UC-011: Proceso de alta simplificado en 3 pasos (Backend) — Flujo incremental con guardado de progreso entre pasos
- Implementada UC-013: Baja y reingreso de socios (Backend) — Leave, Expulsion, Reinstatement con conservacion de numero de socio

#### Changed

- Member Aggregate extendido con changeStatus(), leave(), expel(), reinstate()
- Schema Prisma del tenant extendido con modelo StatusHistory

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---

### 20260310-001-pvidal-CLAUDE

- **Fecha de sesion:** 10 de marzo de 2026
- **Hora de inicio:** 13:58
- **Hora de ultimos trabajos:** 14:04
- **Documento de sesion:** [doc/agents-sessions/20260310-001-pvidal-CLAUDE.md](doc/agents-sessions/20260310-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-006: Gestion de ficha de socio (Backend) completa en BC-Membership
- 6 Value Objects de dominio: PersonalData, ContactData, IdentityDocument (validacion DNI/NIE mod-23), BankDetails (validacion IBAN mod-97), MemberNumber, CustomFields
- Servicio de cifrado AES-256-GCM para IBAN con IV aleatorio (RNF-006)
- 4 endpoints REST para gestion de socios: POST/GET/GET:id/PUT en `/api/v1/members`
- 4 handlers CQRS: CreateMember, UpdateMember, GetMember, ListMembers
- Domain Events: MemberRegisteredEvent y MemberDataUpdatedEvent
- Campos personalizados (custom_fields JSONB) por tipo de colectividad: cofradia, club deportivo, pena, asociacion cultural
- 184 tests nuevos (163 unitarios + 21 integracion)

#### Changed

- Member Aggregate extendido con factory `register()`, metodos de actualizacion y calculo de antiguedad
- MemberPrismaMapper convertido de estatico a inyectable para integrar cifrado de IBAN
- PrismaMemberRepository extendido con 6 metodos nuevos (findByEmail, existsByIdentityDocument, getNextMemberNumber, etc.)
- Schema Prisma del tenant extendido con 15 campos nuevos en modelo Member

#### Fixed

- Corregidos mocks incompletos de MemberRepository en 4 archivos de test de Task 5
- Corregido mock de ErrorReporter en domain-exception.filter.spec.ts
- Corregido import faltante de beforeEach en permissions.guard.spec.ts

#### Removed

[Sin cambios]

---

### 20260226-001-pvidal-CLAUDE

- **Fecha de sesion:** 26 de febrero de 2026
- **Hora de inicio:** 08:00
- **Hora de ultimos trabajos:** 13:14
- **Documento de sesion:** [doc/agents-sessions/20260226-001-pvidal-CLAUDE.md](doc/agents-sessions/20260226-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-002: Autenticacion multi-tenant (Backend) completa en BC-Identity — User aggregate con lockout temporal, JWT strategy, 5 endpoints auth, guards globales
- Implementada UC-008: Gestion de tipos de socio (Backend) completa en BC-Membership — MemberType aggregate, RulesEvaluator, plantillas por colectividad, 7 endpoints REST
- Value Objects de auth: Email, Password, PasswordHash, UserId, UserStatus
- Servicios de infraestructura: Argon2PasswordHasher, JwtTokenService, JwtStrategy
- Repositorios Prisma: User, RefreshToken, TenantMembership, UserProfile, MemberType
- Domain Events: UserAuthenticated, AuthenticationFailed, UserBlocked, MemberTypeCreated
- Decorador @Public() para bypass de JWT guard global

#### Changed

- IdentityModule rewired con providers, handlers, guards y strategy de auth
- PermissionsGuard y JwtAuthGuard actualizados para manejar rutas publicas
- MembershipModule extendido con MemberType handlers y controller

#### Fixed

- Corregidos 5+ errores de DI (UnknownDependenciesException) causados por `import type` en providers NestJS
- Corregidas colisiones de datos en tests de integracion (CIF/slug duplicados)
- Mejorada documentacion Swagger en endpoints de auth

#### Removed

[Sin cambios]

---

### 20260225-001-pvidal-CLAUDE

- **Fecha de sesion:** 25 de febrero de 2026
- **Hora de inicio:** 08:30
- **Hora de ultimos trabajos:** 16:16
- **Documento de sesion:** [doc/agents-sessions/20260225-001-pvidal-CLAUDE.md](doc/agents-sessions/20260225-001-pvidal-CLAUDE.md)

#### Added

- Completada Fase 0 — Scaffold del proyecto Associated (verificacion final y merge PR #1)
- Implementada UC-001: Provision de nuevo tenant (Backend) completa en BC-Identity
- Value Objects de dominio: TenantId, Cif (algoritmo CIF espanol), Slug (normalizacion NFD), TenantStatus, CollectivityType
- Tenant Aggregate con factory create(), generacion automatica de databaseName y slug
- ProvisionTenantHandler con saga de 10 pasos y rollback compensatorio idempotente
- DatabaseProvisioningService con DDL directo (CREATE DB, CREATE USER, GRANT, migrations, seedRoles)
- PrismaTenantRepository + TenantMapper bidireccional
- Controller REST para provision de tenant
- Domain Events: TenantProvisionedEvent, UserCreatedEvent

#### Changed

- Configuracion Prisma 7 migrada: prisma.config.main.ts y prisma.config.tenant.ts creados
- Schemas Prisma corregidos para Prisma 7 (provider `prisma-client`, URL en config)

#### Fixed

- Corregido error critico P1012 de Prisma 7 (URL no permitida en datasource del schema)

#### Removed

[Sin cambios]

---
