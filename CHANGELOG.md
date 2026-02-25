# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### 20260224-001-acestermac-SONNET

- **Fecha de sesión:** 24 de febrero de 2026
- **Hora de inicio:** 15:27
- **Hora de últimos trabajos:** 16:20
- **Documento de sesión:** [doc/agents-sessions/20260224-001-acestermac-SONNET.md](doc/agents-sessions/20260224-001-acestermac-SONNET.md)

#### Added

- Creado monorepo raíz con workspaces npm (`api/`, `web/`), `.gitignore`, `.editorconfig` y `package.json` raíz (Paso 1)
- Creado proyecto NestJS 11 en `api/` con estructura de módulos para los 6 Bounded Contexts (Paso 2)
- Creados 60+ archivos `.gitkeep` para mantener la estructura de directorios en git (capas `application/`, `domain/`, `infrastructure/` por BC)
- Implementado Shared Kernel DDD: `AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`, `Identifier`, `Repository` (Paso 3)
- Creados puertos de observabilidad: `ErrorReporter` y `EventTracker` en `shared/domain/ports/` (Paso 3)
- Implementada infraestructura multi-tenant: `PrismaMainService`, `PrismaTenantService` (pool max 10 por tenant), `TenantMiddleware`, `OutboxProcessorService` con backoff exponencial (Paso 4)
- Implementado módulo de observabilidad: `ConsoleErrorReporter`, `SentryErrorReporter`, `ConsoleEventTracker`, `SentryEventTracker`, `ObservabilityModule` con switch automático según `SENTRY_DSN` (Paso 5)
- Creado `web/src/shared/observability/error-boundary.tsx` — React Error Boundary global integrado en `providers.tsx` (Paso 5)
- Creados schemas Prisma 7: `main` (Tenant, User, TenantMembership, Role, RefreshToken, OutboxEvent) y `tenant` (OutboxEvent template) (Paso 6)
- Creados `prisma.config.ts`, `prisma.config.main.ts`, `prisma.config.tenant.ts` para soporte multi-schema Prisma 7 (Paso 6)
- Creado proyecto React 19 + Vite 7 + Mantine 8 en `web/` con `providers.tsx`, `router.tsx`, `http-client.ts` y estructura de features (Paso 7)
- Creado `docker-compose.yml` con PostgreSQL 18 Alpine (puerto 5433), MinIO y Mailpit con healthchecks (Paso 8)
- Creado `docker/postgres/init.sql` con extensiones `uuid-ossp`, `pg_trgm`, `pgcrypto` y BD `associated_main` (Paso 8)
- Configurado Vitest para `api/` (Node, v8 coverage, thresholds 80%/70%) y `web/` (jsdom), y Playwright para `e2e/` (Paso 9)
- Creados 3 smoke tests: `entity.base.spec.ts` (api), `app.spec.tsx` (web), `smoke.spec.ts` (e2e) (Paso 9)
- Creado `.github/workflows/ci.yml` con 3 jobs (backend, frontend, e2e) y quality gates ADR-012 (Paso 10)
- Configurados ESLint 9 flat config (`eslint.config.mjs`), Prettier (`.prettierrc`), Husky v9 (`.husky/pre-commit`) y lint-staged (Paso 11)

#### Changed

- `api/src/shared/infrastructure/filters/domain-exception.filter.ts` — actualizado para inyectar `ErrorReporter` en lugar de log directo
- `api/.env.example` — añadidas variables de PostgreSQL, MinIO y Mailpit
- `package.json` (raíz) — añadidos scripts `lint`, `format`, `prepare` y configuración `lint-staged`

#### Fixed

- Corregida ruta relativa del mock en `web/src/app/__tests__/app.spec.tsx` (ruta `../../shared/` en lugar de `../shared/`)
- Corregidas variables de entorno en CI: `DATABASE_MAIN_URL` y `DATABASE_TENANT_URL` en lugar de `DATABASE_URL` genérico

---

### 20260225-001-acestermac-SONNET

- **Fecha de sesión:** 25 de febrero de 2026
- **Hora de inicio:** 09:33
- **Hora de últimos trabajos:** 09:49
- **Documento de sesión:** [doc/agents-sessions/20260225-001-acestermac-SONNET.md](doc/agents-sessions/20260225-001-acestermac-SONNET.md)

#### Added

- Creados `api/prisma.config.main.ts` y `api/prisma.config.tenant.ts` para soporte multi-schema en Prisma 7
- Creado directorio `doc/agents-sessions/` y archivo de sesión `20260225-001-acestermac-SONNET.md`
- Creado `CHANGELOG.md` con estructura Keep a Changelog

#### Changed

- `api/prisma/main/schema.prisma` — provider actualizado a `prisma-client`, eliminada url del datasource (Prisma 7)
- `api/prisma/tenant/schema.prisma` — provider actualizado a `prisma-client`, eliminada url del datasource (Prisma 7)
- `api/prisma.config.ts` — actualizado para apuntar al schema main por defecto
- `api/package.json` — nuevos scripts `prisma:generate`, `prisma:migrate:*` y dependencias `@prisma/adapter-pg`, `dotenv`
- `api/src/shared/infrastructure/persistence/prisma-main.service.ts` — refactorizado para usar `PrismaPg` driver adapter (Prisma 7, composición en lugar de herencia)
- `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` — refactorizado para usar `PrismaPg` driver adapter por tenant (Prisma 7)

#### Fixed

- Corregido error Prisma P1012 que impedía ejecutar `prisma generate` al migrar de Prisma 6 a 7
- Corregidos 20 errores de lint `@typescript-eslint/consistent-type-imports` en archivos de `api/src/shared/`

#### Removed

[Sin cambios]

---
