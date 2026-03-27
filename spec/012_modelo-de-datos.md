# Modelo de Datos - Esquema Relacional

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Versión:** 1.0
**Fecha:** Marzo 2026
**Inputs:** KB-005 (Modelo de Dominio), KB-006 (ADRs), KB-007 (Stack Tecnológico)
**Estado:** Borrador
**Total Entidades:** 40

---

## Índice

1. [Convenciones del Esquema](#1-convenciones-del-esquema)
2. [BC-Identity](#2-bc-identity)
   - [ENT-001: tenants](#ent-001-tenants)
   - [ENT-002: users](#ent-002-users)
   - [ENT-003: tenant_memberships](#ent-003-tenant_memberships)
   - [ENT-004: roles](#ent-004-roles)
   - [ENT-005: refresh_tokens](#ent-005-refresh_tokens)
3. [Transversal](#3-transversal)
   - [ENT-006: outbox_events (main)](#ent-006-outbox_events-main)
4. [BC-Membership](#4-bc-membership)
   - [ENT-007: member_types](#ent-007-member_types)
   - [ENT-008: fiscal_years](#ent-008-fiscal_years)
   - [ENT-009: members](#ent-009-members)
   - [ENT-010: status_history](#ent-010-status_history)
5. [BC-Treasury](#5-bc-treasury)
   - [ENT-011: fee_plans](#ent-011-fee_plans)
   - [ENT-012: member_type_fee_plans](#ent-012-member_type_fee_plans)
   - [ENT-013: member_accounts](#ent-013-member_accounts)
   - [ENT-014: fee_subscriptions](#ent-014-fee_subscriptions)
   - [ENT-015: charges](#ent-015-charges)
   - [ENT-016: payments](#ent-016-payments)
6. [Transversal (Tenant)](#6-transversal-tenant)
   - [ENT-017: outbox_events (tenant)](#ent-017-outbox_events-tenant)
7. [BC-Treasury - Pendiente Fase 2](#7-bc-treasury--pendiente-fase-2)
   - [ENT-018: sepa_mandates](#ent-018-sepa_mandates)
   - [ENT-019: sepa_remittances](#ent-019-sepa_remittances)
   - [ENT-020: sepa_debits](#ent-020-sepa_debits)
8. [Entidades Placeholder (Fuera del MVP)](#8-entidades-placeholder-fuera-del-mvp)
   - [ENT-021: member_cards](#ent-021-member_cards)
   - [ENT-022: waiting_list](#ent-022-waiting_list)
   - [ENT-023: disciplinary_cases](#ent-023-disciplinary_cases)
   - [ENT-024: registration_requests](#ent-024-registration_requests)
   - [ENT-025: payment_links](#ent-025-payment_links)
   - [ENT-026: cash_register_shifts](#ent-026-cash_register_shifts)
   - [ENT-027: transactions](#ent-027-transactions)
   - [ENT-028: accounting_categories](#ent-028-accounting_categories)
   - [ENT-029: accounting_years](#ent-029-accounting_years)
   - [ENT-030: events](#ent-030-events)
   - [ENT-031: event_types](#ent-031-event_types)
   - [ENT-032: social_dinners](#ent-032-social_dinners)
   - [ENT-033: squads](#ent-033-squads)
   - [ENT-034: matches](#ent-034-matches)
   - [ENT-035: communications](#ent-035-communications)
   - [ENT-036: templates](#ent-036-templates)
   - [ENT-037: announcements](#ent-037-announcements)
   - [ENT-038: documents](#ent-038-documents)
   - [ENT-039: document_categories](#ent-039-document_categories)
   - [ENT-040: meeting_minutes](#ent-040-meeting_minutes)
9. [Trazabilidad](#9-trazabilidad)

---

## 1. Convenciones del Esquema

Esta sección define las normas que aplican a todas las entidades del modelo relacional. No es atomizable y solo aparece en el documento raíz.

- **Naming:** snake_case para tablas y columnas.
- **PKs:** UUID con `@default(uuid())`, mapeado a `@db.Uuid` en PostgreSQL.
- **Timestamps:** `DateTime` con `@db.Timestamptz()` (TIMESTAMPTZ en PostgreSQL) para todos los campos de fecha-hora. Los campos de tipo `Date` usan `@db.Date`.
- **Dinero:** `Int` en céntimos (centavos) para evitar problemas de coma flotante. Ejemplo: 1200 = 12,00 €.
- **Datos sensibles:** sufijo `_encrypted` en columnas cifradas en reposo (RNF-006). Ejemplo: `iban_encrypted`.
- **Multi-tenant:** separación estricta en dos bases de datos por ADR-002:
  - **DB-Main:** tablas de gestión global del sistema (tenants, usuarios, roles). ENT-001 a ENT-006.
  - **DB-Tenant:** tablas de datos de cada colectividad, una BD por tenant. ENT-007 en adelante.
- **Enums:** almacenados como `String` en Prisma (sin enums formales de Prisma), con valores validados a nivel de dominio.
- **Bloqueo optimista:** campo `version Int @default(0)` en aggregates donde aplica control de concurrencia (ejemplo: `members`).
- **Outbox pattern:** tabla `outbox_events` en ambas bases de datos para garantizar entrega at-least-once de eventos de dominio (ADR-008).

---

## 2. BC-Identity

### ENT-001: tenants

> **Bounded Context:** BC-Identity | **Aggregate:** Tenant

**Prisma model:** `Tenant`
**Base de datos:** Main
**Trazabilidad RNF:** RNF-004 (tabla en DB-Main, compartida cross-tenant); RNF-006 (database_password_encrypted)
**Trazabilidad ADR:** ADR-002 (multi-tenant por BD separada); ADR-001 (Modular Monolith)

#### Columnas

| Columna                     | Tipo Prisma                | Tipo PG      | Nullable | Default   | Descripción                                        |
| --------------------------- | -------------------------- | ------------ | -------- | --------- | -------------------------------------------------- |
| id                          | String (@db.Uuid)          | UUID         | No       | uuid()    | Clave primaria                                     |
| slug                        | String (@db.VarChar(63))   | VARCHAR(63)  | No       | -         | Identificador URL-friendly. Único global.          |
| name                        | String (@db.VarChar(200))  | VARCHAR(200) | No       | -         | Nombre de la colectividad                          |
| cif                         | String (@db.VarChar(20))   | VARCHAR(20)  | No       | -         | CIF de la entidad. Único global.                   |
| type                        | String (@db.VarChar(50))   | VARCHAR(50)  | No       | -         | Tipo de colectividad (asociacion, cofradia, club…) |
| status                      | String (@db.VarChar(20))   | VARCHAR(20)  | No       | 'pending' | Estado de provisión del tenant                     |
| database_name               | String (@db.VarChar(100))  | VARCHAR(100) | No       | -         | Nombre de la BD de tenant asignada                 |
| database_user               | String? (@db.VarChar(100)) | VARCHAR(100) | Sí       | NULL      | Usuario de la BD de tenant                         |
| database_password_encrypted | String? (@db.Text)         | TEXT         | Sí       | NULL      | Contraseña cifrada de la BD de tenant (RNF-006)    |
| contact_email               | String (@db.VarChar(255))  | VARCHAR(255) | No       | -         | Email de contacto del administrador                |
| created_at                  | DateTime (@db.Timestamptz) | TIMESTAMPTZ  | No       | now()     | Fecha de creación del registro                     |

#### Constraints e Índices

- `@unique` sobre `slug`
- `@unique` sobre `cif`

#### Relaciones

| Relación    | Tipo | Tabla destino      | FK                                        |
| ----------- | ---- | ------------------ | ----------------------------------------- |
| memberships | 1:N  | tenant_memberships | tenants.id → tenant_memberships.tenant_id |

---

### ENT-002: users

> **Bounded Context:** BC-Identity | **Aggregate:** User

**Prisma model:** `User`
**Base de datos:** Main
**Trazabilidad RNF:** RNF-006 (password_hash con argon2); RNF-011 (failed_attempts para bloqueo por fuerza bruta)
**Trazabilidad ADR:** ADR-006 (JWT + Passport); ADR-007 (RBAC)

#### Columnas

| Columna                   | Tipo Prisma                 | Tipo PG      | Nullable | Default  | Descripción                                  |
| ------------------------- | --------------------------- | ------------ | -------- | -------- | -------------------------------------------- |
| id                        | String (@db.Uuid)           | UUID         | No       | uuid()   | Clave primaria                               |
| email                     | String (@db.VarChar(255))   | VARCHAR(255) | No       | -        | Email del usuario. Único global.             |
| password_hash             | String (@db.VarChar(255))   | VARCHAR(255) | No       | -        | Hash argon2 de la contraseña                 |
| name                      | String (@db.VarChar(200))   | VARCHAR(200) | No       | -        | Nombre completo del usuario                  |
| status                    | String (@db.VarChar(20))    | VARCHAR(20)  | No       | 'active' | Estado del usuario (active, blocked…)        |
| failed_attempts           | Int                         | INTEGER      | No       | 0        | Contador de intentos fallidos de login       |
| failed_attempt_timestamps | Json                        | JSONB        | No       | '[]'     | Timestamps de intentos fallidos (array JSON) |
| blocked_until             | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL     | Fecha hasta la que el usuario está bloqueado |
| created_at                | DateTime (@db.Timestamptz)  | TIMESTAMPTZ  | No       | now()    | Fecha de creación del registro               |
| last_access               | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL     | Último acceso al sistema                     |

#### Constraints e Índices

- `@unique` sobre `email`

#### Relaciones

| Relación      | Tipo | Tabla destino      | FK                                    |
| ------------- | ---- | ------------------ | ------------------------------------- |
| memberships   | 1:N  | tenant_memberships | users.id → tenant_memberships.user_id |
| refreshTokens | 1:N  | refresh_tokens     | users.id → refresh_tokens.user_id     |

---

### ENT-003: tenant_memberships

> **Bounded Context:** BC-Identity | **Aggregate:** TenantMembership

**Prisma model:** `TenantMembership`
**Base de datos:** Main
**Trazabilidad RNF:** RNF-004 (vincula usuario con tenant específico)
**Trazabilidad ADR:** ADR-002 (aislamiento multi-tenant); ADR-007 (RBAC - rol asignado)

#### Columnas

| Columna     | Tipo Prisma                | Tipo PG     | Nullable | Default | Descripción                                      |
| ----------- | -------------------------- | ----------- | -------- | ------- | ------------------------------------------------ |
| id          | String (@db.Uuid)          | UUID        | No       | uuid()  | Clave primaria                                   |
| user_id     | String (@db.Uuid)          | UUID        | No       | -       | FK a users                                       |
| tenant_id   | String (@db.Uuid)          | UUID        | No       | -       | FK a tenants                                     |
| role_id     | String (@db.Uuid)          | UUID        | No       | -       | FK a roles                                       |
| member_id   | String? (@db.Uuid)         | UUID        | Sí       | NULL    | Vínculo opcional con ficha de socio en DB-Tenant |
| assigned_at | DateTime (@db.Timestamptz) | TIMESTAMPTZ | No       | now()   | Fecha de asignación de la membresía              |
| assigned_by | String? (@db.Uuid)         | UUID        | Sí       | NULL    | UserId del administrador que asignó la membresía |
| active      | Boolean                    | BOOLEAN     | No       | true    | Si la membresía está activa                      |

#### Constraints e Índices

- `@@unique([user_id, tenant_id])` - un usuario solo puede tener una membresía por tenant

#### Relaciones

| Relación | Tipo | Tabla destino | FK                                                            |
| -------- | ---- | ------------- | ------------------------------------------------------------- |
| user     | N:1  | users         | tenant_memberships.user_id → users.id (onDelete: Cascade)     |
| tenant   | N:1  | tenants       | tenant_memberships.tenant_id → tenants.id (onDelete: Cascade) |
| role     | N:1  | roles         | tenant_memberships.role_id → roles.id                         |

---

### ENT-004: roles

> **Bounded Context:** BC-Identity | **Aggregate:** Role

**Prisma model:** `Role`
**Base de datos:** Main
**Trazabilidad RNF:** RNF-012 (RBAC basado en roles)
**Trazabilidad ADR:** ADR-007 (RBAC con Guards)

#### Columnas

| Columna     | Tipo Prisma                | Tipo PG      | Nullable | Default | Descripción                                                         |
| ----------- | -------------------------- | ------------ | -------- | ------- | ------------------------------------------------------------------- |
| id          | String (@db.Uuid)          | UUID         | No       | uuid()  | Clave primaria                                                      |
| code        | String (@db.VarChar(50))   | VARCHAR(50)  | No       | -       | Código del rol (ej: PRESIDENT, TREASURER)                           |
| name        | String (@db.VarChar(100))  | VARCHAR(100) | No       | -       | Nombre legible del rol                                              |
| description | String? (@db.VarChar(500)) | VARCHAR(500) | Sí       | NULL    | Descripción opcional del rol                                        |
| permissions | Json                       | JSONB        | No       | '[]'    | Array de permisos asignados al rol                                  |
| is_system   | Boolean                    | BOOLEAN      | No       | false   | Si es un rol de sistema (no editable)                               |
| tenant_id   | String? (@db.Uuid)         | UUID         | Sí       | NULL    | NULL para roles globales; UUID del tenant para roles personalizados |

#### Constraints e Índices

- `@@unique([code, tenant_id])` - código único por tenant (o globalmente si tenant_id es NULL)

#### Relaciones

| Relación    | Tipo | Tabla destino      | FK                                    |
| ----------- | ---- | ------------------ | ------------------------------------- |
| memberships | 1:N  | tenant_memberships | roles.id → tenant_memberships.role_id |

---

### ENT-005: refresh_tokens

> **Bounded Context:** BC-Identity | **Aggregate:** RefreshToken

**Prisma model:** `RefreshToken`
**Base de datos:** Main
**Trazabilidad RNF:** RNF-013 (gestión de sesiones JWT); RNF-011 (revocación por seguridad)
**Trazabilidad ADR:** ADR-006 (JWT + Passport - renovación de tokens)

#### Columnas

| Columna    | Tipo Prisma                 | Tipo PG      | Nullable | Default | Descripción                                      |
| ---------- | --------------------------- | ------------ | -------- | ------- | ------------------------------------------------ |
| id         | String (@db.Uuid)           | UUID         | No       | uuid()  | Clave primaria                                   |
| user_id    | String (@db.Uuid)           | UUID         | No       | -       | FK a users                                       |
| token_hash | String (@db.VarChar(255))   | VARCHAR(255) | No       | -       | Hash del refresh token (no se almacena en claro) |
| expires_at | DateTime (@db.Timestamptz)  | TIMESTAMPTZ  | No       | -       | Fecha de expiración del token                    |
| created_at | DateTime (@db.Timestamptz)  | TIMESTAMPTZ  | No       | now()   | Fecha de emisión del token                       |
| revoked_at | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL    | Fecha de revocación explícita del token          |

#### Constraints e Índices

- Sin índices adicionales declarados; la consulta principal es por user_id + estado de revocación

#### Relaciones

| Relación | Tipo | Tabla destino | FK                                                    |
| -------- | ---- | ------------- | ----------------------------------------------------- |
| user     | N:1  | users         | refresh_tokens.user_id → users.id (onDelete: Cascade) |

---

## 3. Transversal

### ENT-006: outbox_events (main)

> **Bounded Context:** Transversal | **Aggregate:** OutboxEvent

**Prisma model:** `OutboxEvent`
**Base de datos:** Main
**Trazabilidad RNF:** RNF-015 (entrega garantizada de eventos)
**Trazabilidad ADR:** ADR-008 (Domain Events con Outbox pattern)

#### Columnas

| Columna       | Tipo Prisma                 | Tipo PG      | Nullable | Default | Descripción                                        |
| ------------- | --------------------------- | ------------ | -------- | ------- | -------------------------------------------------- |
| id            | String (@db.Uuid)           | UUID         | No       | uuid()  | Clave primaria                                     |
| event_type    | String (@db.VarChar(200))   | VARCHAR(200) | No       | -       | Tipo de evento de dominio (ej: TenantProvisioned)  |
| payload       | Json                        | JSONB        | No       | -       | Payload serializado del evento                     |
| tenant_id     | String? (@db.Uuid)          | UUID         | Sí       | NULL    | Tenant al que pertenece el evento (NULL si global) |
| created_at    | DateTime (@db.Timestamptz)  | TIMESTAMPTZ  | No       | now()   | Timestamp de creación del evento                   |
| processed_at  | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL    | Timestamp de procesado exitoso; NULL si pendiente  |
| retry_count   | Int                         | INTEGER      | No       | 0       | Número de reintentos de publicación                |
| next_retry_at | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL    | Timestamp del próximo reintento programado         |
| last_error    | String? (@db.Text)          | TEXT         | Sí       | NULL    | Último error de publicación                        |

#### Constraints e Índices

- `@@index([processed_at, retry_count, next_retry_at])` - para el polling del worker de outbox

#### Relaciones

No tiene relaciones FK declaradas (diseño intencional para bajo acoplamiento).

---

## 4. BC-Membership

### ENT-007: member_types

> **Bounded Context:** BC-Membership | **Aggregate:** MemberType

**Prisma model:** `MemberType`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Membership)

#### Columnas

| Columna                        | Tipo Prisma               | Tipo PG      | Nullable | Default | Descripción                                            |
| ------------------------------ | ------------------------- | ------------ | -------- | ------- | ------------------------------------------------------ |
| id                             | String (@db.Uuid)         | UUID         | No       | uuid()  | Clave primaria                                         |
| code                           | String (@db.VarChar(10))  | VARCHAR(10)  | No       | -       | Código único del tipo de socio dentro del tenant       |
| name                           | String (@db.VarChar(100)) | VARCHAR(100) | No       | -       | Nombre del tipo de socio                               |
| description                    | String? (@db.Text)        | TEXT         | Sí       | NULL    | Descripción opcional                                   |
| age_range_min                  | Int?                      | INTEGER      | Sí       | NULL    | Edad mínima para este tipo (inclusive)                 |
| age_range_max                  | Int?                      | INTEGER      | Sí       | NULL    | Edad máxima para este tipo (inclusive)                 |
| voting_right                   | Boolean                   | BOOLEAN      | No       | false   | Si los socios de este tipo tienen derecho a voto       |
| eligible_for_office            | Boolean                   | BOOLEAN      | No       | false   | Si pueden presentarse a cargos directivos              |
| minimum_seniority_for_voting   | Int                       | INTEGER      | No       | 0       | Antigüedad mínima en años para votar                   |
| minimum_seniority_for_office   | Int                       | INTEGER      | No       | 0       | Antigüedad mínima en años para cargos                  |
| automatic_transition_target_id | String? (@db.Uuid)        | UUID         | Sí       | NULL    | FK al tipo destino en transición automática por edad   |
| rules_config                   | Json?                     | JSONB        | Sí       | NULL    | Configuración extra de reglas por tipo de colectividad |
| active                         | Boolean                   | BOOLEAN      | No       | true    | Si el tipo está activo (aceptando nuevos socios)       |
| created_at                     | DateTime                  | TIMESTAMPTZ  | No       | now()   | Fecha de creación                                      |
| updated_at                     | DateTime                  | TIMESTAMPTZ  | No       | (auto)  | Última modificación (@updatedAt)                       |

#### Constraints e Índices

- `@unique` sobre `code`

#### Relaciones

| Relación                  | Tipo       | Tabla destino | FK                                                            |
| ------------------------- | ---------- | ------------- | ------------------------------------------------------------- |
| automaticTransitionTarget | N:1 (self) | member_types  | member_types.automatic_transition_target_id → member_types.id |
| transitionSources         | 1:N (self) | member_types  | -                                                             |
| members                   | 1:N        | members       | member_types.id → members.member_type_id                      |

---

### ENT-008: fiscal_years

> **Bounded Context:** BC-Membership | **Aggregate:** FiscalYear

**Prisma model:** `FiscalYear`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Membership)

#### Columnas

| Columna                 | Tipo Prisma               | Tipo PG      | Nullable | Default       | Descripción                                                    |
| ----------------------- | ------------------------- | ------------ | -------- | ------------- | -------------------------------------------------------------- |
| id                      | String (@db.Uuid)         | UUID         | No       | uuid()        | Clave primaria                                                 |
| name                    | String (@db.VarChar(100)) | VARCHAR(100) | No       | -             | Nombre del ejercicio (ej: "2026", "Temporada 2025-26"). Único. |
| type                    | String (@db.VarChar(20))  | VARCHAR(20)  | No       | -             | Tipo: CALENDAR (año natural) o SEASON (temporada)              |
| start_date              | DateTime (@db.Date)       | DATE         | No       | -             | Fecha de inicio del ejercicio                                  |
| end_date                | DateTime (@db.Date)       | DATE         | No       | -             | Fecha de fin del ejercicio                                     |
| status                  | String (@db.VarChar(20))  | VARCHAR(20)  | No       | 'PREPARATION' | Estado: PREPARATION, ACTIVE, CLOSED                            |
| previous_fiscal_year_id | String? (@db.Uuid)        | UUID         | Sí       | NULL          | FK al ejercicio anterior (cadena de ejercicios)                |
| members_at_start        | Int                       | INTEGER      | No       | 0             | Número de socios al inicio del ejercicio                       |
| members_at_end          | Int?                      | INTEGER      | Sí       | NULL          | Número de socios al cierre del ejercicio                       |
| report_id               | String? (@db.Uuid)        | UUID         | Sí       | NULL          | Referencia al documento de memoria anual generado              |
| created_at              | DateTime                  | TIMESTAMPTZ  | No       | now()         | Fecha de creación                                              |
| closed_at               | DateTime?                 | TIMESTAMPTZ  | Sí       | NULL          | Fecha de cierre del ejercicio                                  |

#### Constraints e Índices

- `@unique` sobre `name`

#### Relaciones

| Relación           | Tipo       | Tabla destino | FK                                                     |
| ------------------ | ---------- | ------------- | ------------------------------------------------------ |
| previousFiscalYear | N:1 (self) | fiscal_years  | fiscal_years.previous_fiscal_year_id → fiscal_years.id |
| nextFiscalYears    | 1:N (self) | fiscal_years  | -                                                      |

---

### ENT-009: members

> **Bounded Context:** BC-Membership | **Aggregate:** Member

**Prisma model:** `Member`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant); RNF-006 (iban_encrypted - cifrado en reposo)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Membership); ADR-009 (Clean Architecture)

#### Columnas

| Columna           | Tipo Prisma                | Tipo PG      | Nullable | Default     | Descripción                                         |
| ----------------- | -------------------------- | ------------ | -------- | ----------- | --------------------------------------------------- |
| id                | String (@db.Uuid)          | UUID         | No       | uuid()      | Clave primaria                                      |
| member_number     | String (@db.VarChar(20))   | VARCHAR(20)  | No       | -           | Número de socio. Único dentro del tenant.           |
| name              | String (@db.VarChar(100))  | VARCHAR(100) | No       | -           | Nombre del socio                                    |
| surnames          | String (@db.VarChar(200))  | VARCHAR(200) | No       | -           | Apellidos del socio                                 |
| birth_date        | DateTime (@db.Date)        | DATE         | No       | -           | Fecha de nacimiento                                 |
| document_type     | String (@db.VarChar(10))   | VARCHAR(10)  | No       | -           | Tipo de documento: DNI, NIE, Pasaporte              |
| document_number   | String (@db.VarChar(20))   | VARCHAR(20)  | No       | -           | Número de documento. Único dentro del tenant.       |
| email             | String (@db.VarChar(255))  | VARCHAR(255) | No       | -           | Email de contacto. Único dentro del tenant.         |
| phone             | String? (@db.VarChar(20))  | VARCHAR(20)  | Sí       | NULL        | Teléfono de contacto                                |
| address           | String? (@db.VarChar(300)) | VARCHAR(300) | Sí       | NULL        | Dirección postal                                    |
| postal_code       | String? (@db.VarChar(10))  | VARCHAR(10)  | Sí       | NULL        | Código postal                                       |
| city              | String? (@db.VarChar(100)) | VARCHAR(100) | Sí       | NULL        | Localidad                                           |
| iban_encrypted    | String? (@db.Text)         | TEXT         | Sí       | NULL        | IBAN cifrado en reposo (RNF-006)                    |
| member_type_id    | String (@db.Uuid)          | UUID         | No       | -           | FK al tipo de socio                                 |
| custom_fields     | Json?                      | JSONB        | Sí       | NULL        | Campos personalizados por tipo de colectividad      |
| current_status    | String (@db.VarChar(30))   | VARCHAR(30)  | No       | 'APPLICANT' | Estado actual (ACTIVE, PENDING_PAYMENT, SUSPENDED…) |
| registration_date | DateTime                   | TIMESTAMPTZ  | No       | now()       | Fecha de alta del socio                             |
| leave_date        | DateTime?                  | TIMESTAMPTZ  | Sí       | NULL        | Fecha de baja del socio                             |
| version           | Int                        | INTEGER      | No       | 0           | Versión para bloqueo optimista                      |
| created_at        | DateTime                   | TIMESTAMPTZ  | No       | now()       | Fecha de creación del registro                      |
| updated_at        | DateTime                   | TIMESTAMPTZ  | No       | (auto)      | Última modificación (@updatedAt)                    |

#### Constraints e Índices

- `@unique` sobre `member_number`
- `@unique` sobre `document_number`
- `@unique` sobre `email`
- `@@index([current_status])`
- `@@index([member_type_id])`
- `@@index([email])`

#### Relaciones

| Relación   | Tipo      | Tabla destino   | FK                                       |
| ---------- | --------- | --------------- | ---------------------------------------- |
| memberType | N:1       | member_types    | members.member_type_id → member_types.id |
| account    | 1:1 (opt) | member_accounts | members.id → member_accounts.member_id   |

---

### ENT-010: status_history

> **Bounded Context:** BC-Membership | **Aggregate:** StatusHistory

**Prisma model:** `StatusHistory`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant); RNF-017 (auditoría de cambios de estado)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Membership)

#### Columnas

| Columna         | Tipo Prisma               | Tipo PG      | Nullable | Default | Descripción                                              |
| --------------- | ------------------------- | ------------ | -------- | ------- | -------------------------------------------------------- |
| id              | String (@db.Uuid)         | UUID         | No       | uuid()  | Clave primaria                                           |
| member_id       | String (@db.Uuid)         | UUID         | No       | -       | Referencia al socio (sin FK formal - decisión de diseño) |
| previous_status | String (@db.VarChar(30))  | VARCHAR(30)  | No       | -       | Estado anterior del socio                                |
| new_status      | String (@db.VarChar(30))  | VARCHAR(30)  | No       | -       | Nuevo estado del socio                                   |
| reason          | String (@db.VarChar(500)) | VARCHAR(500) | No       | -       | Motivo del cambio de estado                              |
| changed_by      | String (@db.VarChar(100)) | VARCHAR(100) | No       | -       | Identificador del usuario que realizó el cambio          |
| changed_at      | DateTime                  | TIMESTAMPTZ  | No       | now()   | Timestamp del cambio                                     |

**Nota de diseño:** tabla INSERT-only. Nunca se actualiza ni elimina un registro. La ausencia de FK formal a `members` es intencional para garantizar la inmutabilidad del historial incluso si el socio es eliminado.

#### Constraints e Índices

- `@@index([member_id])`
- `@@index([member_id, changed_at(sort: Desc)])` - para consulta ordenada del historial

#### Relaciones

No tiene relaciones FK declaradas (diseño intencional - tabla de auditoría inmutable).

---

## 5. BC-Treasury

### ENT-011: fee_plans

> **Bounded Context:** BC-Treasury | **Aggregate:** FeePlan

**Prisma model:** `FeePlan`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna        | Tipo Prisma               | Tipo PG      | Nullable | Default  | Descripción                                                          |
| -------------- | ------------------------- | ------------ | -------- | -------- | -------------------------------------------------------------------- |
| id             | String (@db.Uuid)         | UUID         | No       | uuid()   | Clave primaria                                                       |
| code           | String (@db.VarChar(20))  | VARCHAR(20)  | No       | -        | Código único del plan dentro del tenant                              |
| name           | String (@db.VarChar(100)) | VARCHAR(100) | No       | -        | Nombre del plan de cuota                                             |
| description    | String? (@db.Text)        | TEXT         | Sí       | NULL     | Descripción opcional                                                 |
| type           | String (@db.VarChar(20))  | VARCHAR(20)  | No       | -        | Tipo: ONE_TIME o RECURRING                                           |
| amount         | Int                       | INTEGER      | No       | -        | Importe en céntimos                                                  |
| frequency      | String (@db.VarChar(20))  | VARCHAR(20)  | No       | 'ANNUAL' | Frecuencia orientativa: MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM |
| billing_months | Int[]                     | INTEGER[]    | No       | -        | Meses de facturación (1-12). Vacío para planes ONE_TIME.             |
| active         | Boolean                   | BOOLEAN      | No       | true     | Si el plan está activo                                               |
| created_at     | DateTime                  | TIMESTAMPTZ  | No       | now()    | Fecha de creación                                                    |
| updated_at     | DateTime                  | TIMESTAMPTZ  | No       | (auto)   | Última modificación (@updatedAt)                                     |

#### Constraints e Índices

- `@unique` sobre `code`
- `@@index([type, active])`

#### Relaciones

| Relación           | Tipo | Tabla destino         | FK                                               |
| ------------------ | ---- | --------------------- | ------------------------------------------------ |
| subscriptions      | 1:N  | fee_subscriptions     | fee_plans.id → fee_subscriptions.fee_plan_id     |
| memberTypeFeePlans | 1:N  | member_type_fee_plans | fee_plans.id → member_type_fee_plans.fee_plan_id |

---

### ENT-012: member_type_fee_plans

> **Bounded Context:** BC-Treasury | **Aggregate:** MemberTypeFeePlan

**Prisma model:** `MemberTypeFeePlan`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna        | Tipo Prisma       | Tipo PG     | Nullable | Default | Descripción                              |
| -------------- | ----------------- | ----------- | -------- | ------- | ---------------------------------------- |
| member_type_id | String (@db.Uuid) | UUID        | No       | -       | PK compuesta - FK al tipo de socio       |
| fee_plan_id    | String (@db.Uuid) | UUID        | No       | -       | PK compuesta - FK al plan de cuota       |
| is_default     | Boolean           | BOOLEAN     | No       | false   | Si es el plan por defecto para este tipo |
| display_order  | Int               | INTEGER     | No       | 0       | Orden de presentación en la UI           |
| active         | Boolean           | BOOLEAN     | No       | true    | Si la vinculación está activa            |
| created_at     | DateTime          | TIMESTAMPTZ | No       | now()   | Fecha de creación                        |
| updated_at     | DateTime          | TIMESTAMPTZ | No       | (auto)  | Última modificación (@updatedAt)         |

#### Constraints e Índices

- `@@id([member_type_id, fee_plan_id])` - PK compuesta
- `@@index([fee_plan_id])`
- `@@index([member_type_id])`

#### Relaciones

| Relación | Tipo | Tabla destino | FK                                               |
| -------- | ---- | ------------- | ------------------------------------------------ |
| feePlan  | N:1  | fee_plans     | member_type_fee_plans.fee_plan_id → fee_plans.id |

**Nota:** La FK a `member_types` no está declarada formalmente en el schema Prisma (cross-BC deliberado - BC-Treasury no declara dependencia directa a BC-Membership a nivel de esquema).

---

### ENT-013: member_accounts

> **Bounded Context:** BC-Treasury | **Aggregate:** MemberAccount

**Prisma model:** `MemberAccount`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury); ADR-009 (Clean Architecture)

#### Columnas

| Columna    | Tipo Prisma       | Tipo PG     | Nullable | Default | Descripción                                |
| ---------- | ----------------- | ----------- | -------- | ------- | ------------------------------------------ |
| id         | String (@db.Uuid) | UUID        | No       | uuid()  | Clave primaria                             |
| member_id  | String (@db.Uuid) | UUID        | No       | -       | FK a members. Único (1 cuenta por socio).  |
| balance    | Int               | INTEGER     | No       | 0       | Saldo de la cuenta en céntimos (calculado) |
| created_at | DateTime          | TIMESTAMPTZ | No       | now()   | Fecha de creación                          |
| updated_at | DateTime          | TIMESTAMPTZ | No       | (auto)  | Última modificación (@updatedAt)           |

#### Constraints e Índices

- `@unique` sobre `member_id` - relación 1:1 con members

#### Relaciones

| Relación      | Tipo | Tabla destino     | FK                                                       |
| ------------- | ---- | ----------------- | -------------------------------------------------------- |
| member        | 1:1  | members           | member_accounts.member_id → members.id                   |
| subscriptions | 1:N  | fee_subscriptions | member_accounts.id → fee_subscriptions.member_account_id |
| charges       | 1:N  | charges           | member_accounts.id → charges.member_account_id           |
| payments      | 1:N  | payments          | member_accounts.id → payments.member_account_id          |

---

### ENT-014: fee_subscriptions

> **Bounded Context:** BC-Treasury | **Aggregate:** FeeSubscription

**Prisma model:** `FeeSubscription`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna                  | Tipo Prisma                | Tipo PG      | Nullable | Default  | Descripción                                          |
| ------------------------ | -------------------------- | ------------ | -------- | -------- | ---------------------------------------------------- |
| id                       | String (@db.Uuid)          | UUID         | No       | uuid()   | Clave primaria                                       |
| member_account_id        | String (@db.Uuid)          | UUID         | No       | -        | FK a member_accounts                                 |
| fee_plan_id              | String (@db.Uuid)          | UUID         | No       | -        | FK a fee_plans                                       |
| registration_date        | DateTime                   | TIMESTAMPTZ  | No       | -        | Fecha de inicio de la suscripción                    |
| leave_date               | DateTime?                  | TIMESTAMPTZ  | Sí       | NULL     | Fecha de fin de la suscripción                       |
| cancel_reason            | String? (@db.VarChar(200)) | VARCHAR(200) | Sí       | NULL     | Motivo de cancelación (PLAN_CHANGE, MEMBER_LEAVE…)   |
| type_discount            | Decimal (@db.Decimal(5,4)) | DECIMAL(5,4) | No       | 0        | Descuento por tipo de socio (0.30 = 30%)             |
| personal_discount        | Decimal (@db.Decimal(5,4)) | DECIMAL(5,4) | No       | 0        | Descuento personal (0.30 = 30%)                      |
| personal_discount_reason | String? (@db.VarChar(500)) | VARCHAR(500) | Sí       | NULL     | Motivo del descuento personal                        |
| effective_amount         | Int                        | INTEGER      | No       | -        | Importe efectivo en céntimos tras aplicar descuentos |
| status                   | String (@db.VarChar(20))   | VARCHAR(20)  | No       | 'ACTIVE' | Estado de la suscripción: ACTIVE, CANCELLED          |
| created_at               | DateTime                   | TIMESTAMPTZ  | No       | now()    | Fecha de creación                                    |
| updated_at               | DateTime                   | TIMESTAMPTZ  | No       | (auto)   | Última modificación (@updatedAt)                     |

#### Constraints e Índices

- `@@index([member_account_id])`
- `@@index([fee_plan_id])`
- `@@index([status])`

#### Relaciones

| Relación      | Tipo | Tabla destino   | FK                                                       |
| ------------- | ---- | --------------- | -------------------------------------------------------- |
| memberAccount | N:1  | member_accounts | fee_subscriptions.member_account_id → member_accounts.id |
| feePlan       | N:1  | fee_plans       | fee_subscriptions.fee_plan_id → fee_plans.id             |
| charges       | 1:N  | charges         | fee_subscriptions.id → charges.fee_subscription_id       |

---

### ENT-015: charges

> **Bounded Context:** BC-Treasury | **Aggregate:** Charge

**Prisma model:** `Charge`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna             | Tipo Prisma               | Tipo PG      | Nullable | Default   | Descripción                                                  |
| ------------------- | ------------------------- | ------------ | -------- | --------- | ------------------------------------------------------------ |
| id                  | String (@db.Uuid)         | UUID         | No       | uuid()    | Clave primaria                                               |
| member_account_id   | String (@db.Uuid)         | UUID         | No       | -         | FK a member_accounts                                         |
| fee_subscription_id | String? (@db.Uuid)        | UUID         | Sí       | NULL      | FK a fee_subscriptions. NULL para cargos manuales.           |
| base_amount         | Int                       | INTEGER      | No       | 0         | Importe base antes de prorrateo (céntimos)                   |
| final_amount        | Int                       | INTEGER      | No       | 0         | Importe final a cobrar (céntimos)                            |
| description         | String (@db.VarChar(255)) | VARCHAR(255) | No       | -         | Descripción del cargo                                        |
| fiscal_year_id      | String? (@db.Uuid)        | UUID         | Sí       | NULL      | Ejercicio fiscal al que pertenece el cargo                   |
| billing_month       | Int?                      | INTEGER      | Sí       | NULL      | Mes de facturación (1-12). NULL para cargos únicos/manuales. |
| billing_year        | Int                       | INTEGER      | No       | -         | Año de facturación                                           |
| issue_date          | DateTime (@db.Date)       | DATE         | No       | -         | Fecha de emisión del cargo                                   |
| due_date            | DateTime (@db.Date)       | DATE         | No       | -         | Fecha de vencimiento del cargo                               |
| status              | String (@db.VarChar(20))  | VARCHAR(20)  | No       | 'PENDING' | Estado: PENDING, PAID, PARTIALLY_PAID, RETURNED, CANCELLED   |
| paid_amount         | Int                       | INTEGER      | No       | 0         | Importe ya pagado (céntimos)                                 |
| is_prorated         | Boolean                   | BOOLEAN      | No       | false     | Si el importe fue prorrateado por alta a mitad de periodo    |
| is_manual           | Boolean                   | BOOLEAN      | No       | false     | Si es un cargo manual (sin suscripción asociada)             |
| created_at          | DateTime                  | TIMESTAMPTZ  | No       | now()     | Fecha de creación                                            |

#### Constraints e Índices

- `@@unique([fee_subscription_id, billing_month, billing_year], name: "unique_charge_per_period")` - evita duplicados de cargo por periodo
- `@@index([member_account_id, status])`
- `@@index([billing_month, billing_year])`

#### Relaciones

| Relación        | Tipo      | Tabla destino     | FK                                                 |
| --------------- | --------- | ----------------- | -------------------------------------------------- |
| memberAccount   | N:1       | member_accounts   | charges.member_account_id → member_accounts.id     |
| feeSubscription | N:1 (opt) | fee_subscriptions | charges.fee_subscription_id → fee_subscriptions.id |
| payments        | 1:N       | payments          | charges.id → payments.charge_id                    |

---

### ENT-016: payments

> **Bounded Context:** BC-Treasury | **Aggregate:** Payment

**Prisma model:** `Payment`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant); RNF-006 (datos de pago no almacenados en claro)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna           | Tipo Prisma                | Tipo PG      | Nullable | Default     | Descripción                                           |
| ----------------- | -------------------------- | ------------ | -------- | ----------- | ----------------------------------------------------- |
| id                | String (@db.Uuid)          | UUID         | No       | uuid()      | Clave primaria                                        |
| member_account_id | String (@db.Uuid)          | UUID         | No       | -           | FK a member_accounts                                  |
| charge_id         | String (@db.Uuid)          | UUID         | No       | -           | FK al cargo que liquida este pago                     |
| amount            | Int                        | INTEGER      | No       | -           | Importe del pago en céntimos                          |
| payment_method    | String (@db.VarChar(30))   | VARCHAR(30)  | No       | -           | Método: CASH, TRANSFER, DIRECT_DEBIT, BIZUM, CARD     |
| payment_date      | DateTime (@db.Date)        | DATE         | No       | -           | Fecha del pago                                        |
| payment_reference | String (@db.VarChar(30))   | VARCHAR(30)  | No       | -           | Referencia única del pago. Única global en el tenant. |
| receipt_number    | String? (@db.VarChar(30))  | VARCHAR(30)  | Sí       | NULL        | Número de recibo generado. Único.                     |
| receipt_document  | Bytes?                     | BYTEA        | Sí       | NULL        | PDF del recibo almacenado en BD                       |
| notes             | String? (@db.VarChar(500)) | VARCHAR(500) | Sí       | NULL        | Notas adicionales del pago                            |
| registered_by     | String (@db.Uuid)          | UUID         | No       | -           | UserId del usuario que registró el pago               |
| status            | String (@db.VarChar(20))   | VARCHAR(20)  | No       | 'CONFIRMED' | Estado: CONFIRMED, RETURNED, CANCELLED                |
| created_at        | DateTime                   | TIMESTAMPTZ  | No       | now()       | Fecha de creación del registro                        |

#### Constraints e Índices

- `@unique` sobre `payment_reference`
- `@unique` sobre `receipt_number`
- `@@index([member_account_id])`
- `@@index([charge_id])`
- `@@index([payment_date])`

#### Relaciones

| Relación      | Tipo | Tabla destino   | FK                                              |
| ------------- | ---- | --------------- | ----------------------------------------------- |
| memberAccount | N:1  | member_accounts | payments.member_account_id → member_accounts.id |
| charge        | N:1  | charges         | payments.charge_id → charges.id                 |

---

## 6. Transversal (Tenant)

### ENT-017: outbox_events (tenant)

> **Bounded Context:** Transversal | **Aggregate:** OutboxEvent

**Prisma model:** `OutboxEvent`
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-015 (entrega garantizada de eventos dentro del tenant)
**Trazabilidad ADR:** ADR-008 (Domain Events con Outbox pattern - réplica en BD-Tenant)

#### Columnas

| Columna       | Tipo Prisma                 | Tipo PG      | Nullable | Default | Descripción                                       |
| ------------- | --------------------------- | ------------ | -------- | ------- | ------------------------------------------------- |
| id            | String (@db.Uuid)           | UUID         | No       | uuid()  | Clave primaria                                    |
| event_type    | String (@db.VarChar(200))   | VARCHAR(200) | No       | -       | Tipo de evento de dominio (ej: MemberRegistered)  |
| payload       | Json                        | JSONB        | No       | -       | Payload serializado del evento                    |
| created_at    | DateTime (@db.Timestamptz)  | TIMESTAMPTZ  | No       | now()   | Timestamp de creación del evento                  |
| processed_at  | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL    | Timestamp de procesado exitoso; NULL si pendiente |
| retry_count   | Int                         | INTEGER      | No       | 0       | Número de reintentos de publicación               |
| next_retry_at | DateTime? (@db.Timestamptz) | TIMESTAMPTZ  | Sí       | NULL    | Timestamp del próximo reintento programado        |
| last_error    | String? (@db.Text)          | TEXT         | Sí       | NULL    | Último error de publicación                       |

**Diferencia con ENT-006:** la versión tenant no tiene columna `tenant_id` (innecesaria - cada BD ya es del tenant).

#### Constraints e Índices

- `@@index([processed_at, retry_count, next_retry_at])` - para el polling del worker de outbox

#### Relaciones

No tiene relaciones FK declaradas (diseño intencional para bajo acoplamiento).

---

## 7. BC-Treasury - Pendiente Fase 2

### ENT-018: sepa_mandates

> **Bounded Context:** BC-Treasury | **Aggregate:** SepaMandate

**Prisma model:** `SepaMandate` (pendiente de crear)
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-006 (iban_debtor_encrypted - cifrado en reposo); RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna               | Tipo Prisma              | Tipo PG     | Nullable | Default  | Descripción                                            |
| --------------------- | ------------------------ | ----------- | -------- | -------- | ------------------------------------------------------ |
| id                    | String (@db.Uuid)        | UUID        | No       | uuid()   | Clave primaria                                         |
| member_account_id     | String (@db.Uuid)        | UUID        | No       | -        | FK a member_accounts                                   |
| mandate_reference     | String (@db.VarChar(35)) | VARCHAR(35) | No       | -        | Referencia única del mandato SEPA (única por acreedor) |
| iban_debtor_encrypted | String (@db.Text)        | TEXT        | No       | -        | IBAN del deudor cifrado en reposo (RNF-006)            |
| signature_date        | DateTime (@db.Date)      | DATE        | No       | -        | Fecha de firma del mandato                             |
| last_debit_date       | DateTime? (@db.Date)     | DATE        | Sí       | NULL     | Fecha del último adeudo ejecutado                      |
| status                | String (@db.VarChar(20)) | VARCHAR(20) | No       | 'ACTIVE' | Estado: ACTIVE, REVOKED, EXPIRED                       |
| signed_document_id    | String? (@db.Uuid)       | UUID        | Sí       | NULL     | Referencia al documento firmado (BC-Documents)         |
| created_at            | DateTime                 | TIMESTAMPTZ | No       | now()    | Fecha de creación                                      |
| updated_at            | DateTime                 | TIMESTAMPTZ | No       | (auto)   | Última modificación                                    |

#### Constraints e Índices

- `@unique` sobre `mandate_reference`
- `@@index([member_account_id])`
- `@@index([status])`

#### Relaciones

| Relación      | Tipo | Tabla destino   | FK                                                   |
| ------------- | ---- | --------------- | ---------------------------------------------------- |
| memberAccount | N:1  | member_accounts | sepa_mandates.member_account_id → member_accounts.id |
| sepaDebits    | 1:N  | sepa_debits     | sepa_mandates.id → sepa_debits.mandate_id            |

---

### ENT-019: sepa_remittances

> **Bounded Context:** BC-Treasury | **Aggregate:** SepaRemittance

**Prisma model:** `SepaRemittance` (pendiente de crear)
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna             | Tipo Prisma              | Tipo PG     | Nullable | Default | Descripción                                                 |
| ------------------- | ------------------------ | ----------- | -------- | ------- | ----------------------------------------------------------- |
| id                  | String (@db.Uuid)        | UUID        | No       | uuid()  | Clave primaria                                              |
| creditor_identifier | String (@db.VarChar(35)) | VARCHAR(35) | No       | -       | Identificador del acreedor SEPA (CIF + sufijo Banco España) |
| charge_date         | DateTime (@db.Date)      | DATE        | No       | -       | Fecha valor de la remesa en el banco                        |
| total_amount        | Int                      | INTEGER     | No       | -       | Importe total de la remesa en céntimos                      |
| total_debits        | Int                      | INTEGER     | No       | 0       | Número de adeudos incluidos                                 |
| status              | String (@db.VarChar(20)) | VARCHAR(20) | No       | 'DRAFT' | Estado: DRAFT, GENERATED, SENT, PROCESSED, WITH_RETURNS     |
| xml_file_path       | String? (@db.Text)       | TEXT        | Sí       | NULL    | Ruta al fichero XML ISO 20022 pain.008 generado             |
| created_at          | DateTime                 | TIMESTAMPTZ | No       | now()   | Fecha de creación                                           |
| updated_at          | DateTime                 | TIMESTAMPTZ | No       | (auto)  | Última modificación                                         |

#### Constraints e Índices

- `@@index([status])`
- `@@index([charge_date])`

#### Relaciones

| Relación   | Tipo | Tabla destino | FK                                              |
| ---------- | ---- | ------------- | ----------------------------------------------- |
| sepaDebits | 1:N  | sepa_debits   | sepa_remittances.id → sepa_debits.remittance_id |

---

### ENT-020: sepa_debits

> **Bounded Context:** BC-Treasury | **Aggregate:** SepaDebit

**Prisma model:** `SepaDebit` (pendiente de crear)
**Base de datos:** Tenant
**Trazabilidad RNF:** RNF-004 (aislado por BD de tenant)
**Trazabilidad ADR:** ADR-002 (multi-tenant); ADR-003 (módulo BC-Treasury)

#### Columnas

| Columna       | Tipo Prisma               | Tipo PG     | Nullable | Default   | Descripción                             |
| ------------- | ------------------------- | ----------- | -------- | --------- | --------------------------------------- |
| id            | String (@db.Uuid)         | UUID        | No       | uuid()    | Clave primaria                          |
| remittance_id | String (@db.Uuid)         | UUID        | No       | -         | FK a sepa_remittances                   |
| charge_id     | String (@db.Uuid)         | UUID        | No       | -         | FK al cargo que se domicilia            |
| mandate_id    | String (@db.Uuid)         | UUID        | No       | -         | FK al mandato SEPA del deudor           |
| amount        | Int                       | INTEGER     | No       | -         | Importe del adeudo en céntimos          |
| sequence_type | String (@db.VarChar(4))   | VARCHAR(4)  | No       | -         | Secuencia SEPA: FRST, RCUR, OOFF, FNAL  |
| status        | String (@db.VarChar(20))  | VARCHAR(20) | No       | 'PENDING' | Estado: PENDING, PROCESSED, RETURNED    |
| return_reason | String? (@db.VarChar(35)) | VARCHAR(35) | Sí       | NULL      | Código de motivo de devolución bancaria |
| return_date   | DateTime? (@db.Date)      | DATE        | Sí       | NULL      | Fecha de devolución del adeudo          |
| created_at    | DateTime                  | TIMESTAMPTZ | No       | now()     | Fecha de creación                       |

#### Constraints e Índices

- `@@index([remittance_id])`
- `@@index([charge_id])`
- `@@index([mandate_id])`

#### Relaciones

| Relación   | Tipo | Tabla destino    | FK                                              |
| ---------- | ---- | ---------------- | ----------------------------------------------- |
| remittance | N:1  | sepa_remittances | sepa_debits.remittance_id → sepa_remittances.id |
| charge     | N:1  | charges          | sepa_debits.charge_id → charges.id              |
| mandate    | N:1  | sepa_mandates    | sepa_debits.mandate_id → sepa_mandates.id       |

---

## 8. Entidades Placeholder (Fuera del MVP)

### ENT-021: member_cards

> **Bounded Context:** BC-Membership | **Aggregate:** MemberCard

**Descripción:** Carnet de socio físico o digital con código QR. Vinculado a N3RF30-32.

---

### ENT-022: waiting_list

> **Bounded Context:** BC-Membership | **Aggregate:** WaitingList

**Descripción:** Lista de espera para solicitudes de alta cuando el cupo está completo o requieren aprobación. Vinculado a N3RF28-29.

---

### ENT-023: disciplinary_cases

> **Bounded Context:** BC-Membership | **Aggregate:** DisciplinaryCase

**Descripción:** Expedientes disciplinarios de socios con infracciones, sanciones y resoluciones. Vinculado a N3RF24-27.

---

### ENT-024: registration_requests

> **Bounded Context:** BC-Membership | **Aggregate:** RegistrationRequest

**Descripción:** Solicitudes de alta de nuevos aspirantes con workflow de aprobación y gestión documental. Vinculado a N3RF20-23.

---

### ENT-025: payment_links

> **Bounded Context:** BC-Treasury | **Aggregate:** PaymentLink

**Descripción:** Enlaces de pago online con token único para que socios liquiden cargos sin acceso al sistema. Vinculado a N4RF24-27.

---

### ENT-026: cash_register_shifts

> **Bounded Context:** BC-Treasury | **Aggregate:** CashRegisterShift

**Descripción:** Turnos de caja con apertura, movimientos y cierre. Específico para peñas festeras. Vinculado a N4RF34-38.

---

### ENT-027: transactions

> **Bounded Context:** BC-Treasury | **Aggregate:** Transaction

**Descripción:** Movimientos contables de ingresos y gastos vinculados a un ejercicio contable y categoría. Vinculado a N4RF28-33.

---

### ENT-028: accounting_categories

> **Bounded Context:** BC-Treasury | **Aggregate:** AccountingCategory

**Descripción:** Árbol jerárquico de categorías contables según el plan ENL o personalizado por el tenant. Vinculado a N4RF28-33.

---

### ENT-029: accounting_years

> **Bounded Context:** BC-Treasury | **Aggregate:** AccountingYear

**Descripción:** Ejercicios contables con saldos acumulados, apertura y cierre formal. Vinculado a N4RF28-33.

---

### ENT-030: events

> **Bounded Context:** BC-Events | **Aggregate:** Event

**Descripción:** Eventos y actividades de la colectividad con inscripciones, aforo y control de asistencia. Vinculado a N5RF01-16.

---

### ENT-031: event_types

> **Bounded Context:** BC-Events | **Aggregate:** TipoEvento

**Descripción:** Catálogo configurable de tipos de evento con campos de inscripción personalizados. Vinculado a N5RF01-02.

---

### ENT-032: social_dinners

> **Bounded Context:** BC-Events | **Aggregate:** SocialDinner

**Descripción:** Comidas de hermandad con gestión de menús y reservas por comensal. Específico para peñas. Vinculado a N5RF17-19.

---

### ENT-033: squads

> **Bounded Context:** BC-Events | **Aggregate:** Squad

**Descripción:** Cuadrillas o grupos de socios para actividades específicas (tambores, costaleros, jugadores). Vinculado a N5RF27-30.

---

### ENT-034: matches

> **Bounded Context:** BC-Events | **Aggregate:** Match

**Descripción:** Partidos y encuentros deportivos con convocatoria, resultado y estadísticas de jugadores. Vinculado a N5RF27-30.

---

### ENT-035: communications

> **Bounded Context:** BC-Communication | **Aggregate:** Communication

**Descripción:** Comunicaciones enviadas o programadas a segmentos de socios por distintos canales. Vinculado a N6RF01-09.

---

### ENT-036: templates

> **Bounded Context:** BC-Communication | **Aggregate:** Template

**Descripción:** Plantillas de comunicación con placeholders, reutilizables por canal (email, SMS, push). Vinculado a N6RF05-07.

---

### ENT-037: announcements

> **Bounded Context:** BC-Communication | **Aggregate:** Anuncio

**Descripción:** Tablón de anuncios interno de la colectividad con fecha de publicación y expiración. Vinculado a N6RF10-16.

---

### ENT-038: documents

> **Bounded Context:** BC-Documents | **Aggregate:** Document

**Descripción:** Repositorio de documentos digitales de la entidad (estatutos, facturas, justificantes) con versionado. Vinculado a N7RF01-09.

---

### ENT-039: document_categories

> **Bounded Context:** BC-Documents | **Aggregate:** Categoria

**Descripción:** Árbol jerárquico de categorías documentales con control de acceso por rol. Vinculado a N7RF06-07.

---

### ENT-040: meeting_minutes

> **Bounded Context:** BC-Documents | **Aggregate:** Acta

**Descripción:** Libro de actas de reuniones (juntas directivas, asambleas) con asistentes, acuerdos y firma digital. Vinculado a N6RF17-23.

---

## 9. Trazabilidad

### Matriz Entidad → Aggregate

| ENT     | Tabla                  | Aggregate           | BC               | DB     |
| ------- | ---------------------- | ------------------- | ---------------- | ------ |
| ENT-001 | tenants                | Tenant              | BC-Identity      | Main   |
| ENT-002 | users                  | User                | BC-Identity      | Main   |
| ENT-003 | tenant_memberships     | TenantMembership    | BC-Identity      | Main   |
| ENT-004 | roles                  | Role                | BC-Identity      | Main   |
| ENT-005 | refresh_tokens         | RefreshToken        | BC-Identity      | Main   |
| ENT-006 | outbox_events (main)   | OutboxEvent         | Transversal      | Main   |
| ENT-007 | member_types           | MemberType          | BC-Membership    | Tenant |
| ENT-008 | fiscal_years           | FiscalYear          | BC-Membership    | Tenant |
| ENT-009 | members                | Member              | BC-Membership    | Tenant |
| ENT-010 | status_history         | StatusHistory       | BC-Membership    | Tenant |
| ENT-011 | fee_plans              | FeePlan             | BC-Treasury      | Tenant |
| ENT-012 | member_type_fee_plans  | MemberTypeFeePlan   | BC-Treasury      | Tenant |
| ENT-013 | member_accounts        | MemberAccount       | BC-Treasury      | Tenant |
| ENT-014 | fee_subscriptions      | FeeSubscription     | BC-Treasury      | Tenant |
| ENT-015 | charges                | Charge              | BC-Treasury      | Tenant |
| ENT-016 | payments               | Payment             | BC-Treasury      | Tenant |
| ENT-017 | outbox_events (tenant) | OutboxEvent         | Transversal      | Tenant |
| ENT-018 | sepa_mandates          | SepaMandate         | BC-Treasury      | Tenant |
| ENT-019 | sepa_remittances       | SepaRemittance      | BC-Treasury      | Tenant |
| ENT-020 | sepa_debits            | SepaDebit           | BC-Treasury      | Tenant |
| ENT-021 | member_cards           | MemberCard          | BC-Membership    | Tenant |
| ENT-022 | waiting_list           | WaitingList         | BC-Membership    | Tenant |
| ENT-023 | disciplinary_cases     | DisciplinaryCase    | BC-Membership    | Tenant |
| ENT-024 | registration_requests  | RegistrationRequest | BC-Membership    | Tenant |
| ENT-025 | payment_links          | PaymentLink         | BC-Treasury      | Tenant |
| ENT-026 | cash_register_shifts   | CashRegisterShift   | BC-Treasury      | Tenant |
| ENT-027 | transactions           | Transaction         | BC-Treasury      | Tenant |
| ENT-028 | accounting_categories  | AccountingCategory  | BC-Treasury      | Tenant |
| ENT-029 | accounting_years       | AccountingYear      | BC-Treasury      | Tenant |
| ENT-030 | events                 | Event               | BC-Events        | Tenant |
| ENT-031 | event_types            | TipoEvento          | BC-Events        | Tenant |
| ENT-032 | social_dinners         | SocialDinner        | BC-Events        | Tenant |
| ENT-033 | squads                 | Squad               | BC-Events        | Tenant |
| ENT-034 | matches                | Match               | BC-Events        | Tenant |
| ENT-035 | communications         | Communication       | BC-Communication | Tenant |
| ENT-036 | templates              | Template            | BC-Communication | Tenant |
| ENT-037 | announcements          | Anuncio             | BC-Communication | Tenant |
| ENT-038 | documents              | Document            | BC-Documents     | Tenant |
| ENT-039 | document_categories    | Categoria           | BC-Documents     | Tenant |
| ENT-040 | meeting_minutes        | Acta                | BC-Documents     | Tenant |

### Matriz Entidad → RNF

| RNF     | ENTs afectadas                                                                                   | Impacto en esquema                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| RNF-004 | ENT-001…ENT-006 (Main), ENT-007…ENT-040 (Tenant)                                                 | Separación estricta en dos bases de datos. Main para identidad global, Tenant para datos de cada colectividad. |
| RNF-006 | ENT-001 (database_password_encrypted), ENT-009 (iban_encrypted), ENT-018 (iban_debtor_encrypted) | Datos sensibles cifrados en reposo con sufijo `_encrypted`.                                                    |
| RNF-011 | ENT-002 (failed_attempts, blocked_until)                                                         | Campos para implementar bloqueo de cuenta tras intentos fallidos de login.                                     |
| RNF-012 | ENT-003 (role_id), ENT-004 (permissions)                                                         | RBAC implementado mediante la relación user→tenantMembership→role→permissions.                                 |
| RNF-013 | ENT-005 (refresh_tokens)                                                                         | Gestión de renovación de sesiones JWT con revocación explícita.                                                |
| RNF-015 | ENT-006 (main), ENT-017 (tenant)                                                                 | Outbox pattern para garantizar at-least-once delivery de domain events.                                        |
| RNF-017 | ENT-010 (status_history)                                                                         | Auditoría inmutable de cambios de estado de socios mediante tabla INSERT-only.                                 |

### Resumen por Base de Datos

| Base de datos | Tablas                                                                                                                                                                                                                                                 | BCs                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Main          | ENT-001…ENT-006 (tenants, users, tenant_memberships, roles, refresh_tokens, outbox_events)                                                                                                                                                             | BC-Identity, Transversal                                                           |
| Tenant        | ENT-007…ENT-040 (member_types, fiscal_years, members, status_history, fee_plans, member_type_fee_plans, member_accounts, fee_subscriptions, charges, payments, outbox_events, sepa_mandates, sepa_remittances, sepa_debits, y placeholders pendientes) | BC-Membership, BC-Treasury, BC-Events, BC-Communication, BC-Documents, Transversal |
