# Proposal: fase-0-scaffold — Bootstrap del scaffold completo del proyecto

## Intent

El repositorio está en estado limpio: `api/`, `web/` y `e2e/` existen pero solo contienen ficheros de guía de agentes (`AGENTS.md`). No hay `package.json`, no hay `docker-compose.yml`, no hay pipeline CI, no hay código fuente ni esquemas Prisma.

Esta fase bootstrap es el **requisito previo obligatorio** para cualquier otro cambio del proyecto. Sin ella, ningún Bounded Context puede implementarse: no hay estructura de módulos, no hay Shared Kernel DDD, no hay base de datos, no hay entorno de desarrollo reproducible y no hay quality gates de CI.

El objetivo es dejar el repositorio en un estado en que un desarrollador pueda clonarlo, ejecutar `docker compose up` y `npm install`, y tener el entorno completamente funcional en menos de 5 minutos.

## Scope

### In Scope

**Paso 1 — Configuración del repositorio:**
- Completar `.gitignore` (node_modules, dist, coverage, .env, .prisma)
- Crear `.editorconfig` (2 spaces, utf-8, LF)
- Crear `package.json` raíz con configuración de workspaces npm `["api", "web"]`

**Paso 2 — Backend NestJS:**
- Inicializar proyecto NestJS 11.x en `api/` con `tsconfig.json` en strict mode
- Instalar dependencias core: `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `@nestjs/swagger`, `class-validator`, `class-transformer`, `@nestjs/cqrs`, `@nestjs/schedule`, `uuid`, `date-fns`, `argon2`
- Crear esqueletos de módulos por los 6 Bounded Contexts (ADR-003): Identity, Membership, Treasury, Events, Communication, Documents
- Crear `AppModule` con registro de módulos BC vacíos
- Implementar `ResponseEnvelopeInterceptor` (formato de respuesta ADR-010)
- Implementar `DomainExceptionFilter` (manejo de errores de dominio)
- Configurar Swagger/OpenAPI en `main.ts`
- Verificar arranque correcto

**Paso 3 — Shared Kernel (clases base DDD):**
- `AggregateRoot<TId>`: extiende Entity, acumula DomainEvents, expone `pullDomainEvents()`
- `Entity<TId>`: identidad por ID, `equals()`, `props`
- `ValueObject<TProps>`: inmutable, igualdad por valor
- `DomainEvent`: `eventId`, `occurredOn`, `eventType`, `payload`
- `Identifier`: UUID wrapper con validación y `equals()`
- `Repository<T>`: interfaz con `save()`, `findById()`, `delete()`
- Puertos de observabilidad: `ErrorReporter` y `EventTracker` (solo interfaces, sin dependencias de infraestructura)

**Paso 4 — Infraestructura multi-tenant:**
- `PrismaMainService`: client Prisma singleton para DB-Main
- `PrismaTenantService`: pool de clients Prisma por tenant (Map<tenantId, PrismaClient>), límite 10 conexiones por tenant
- `TenantMiddleware`: extrae `X-Tenant-Id` del header e inyecta en `req.tenantId`
- `OutboxProcessorService`: job programado que lee `outbox_events`, despacha handlers, backoff exponencial (1s→2s→4s→8s→16s), máx. 5 reintentos

**Paso 5 — Infraestructura de observabilidad:**
- Backend: `ConsoleErrorReporter`, `SentryErrorReporter`, `ConsoleEventTracker`, `SentryEventTracker`, `ObservabilityModule` (selección por `SENTRY_DSN`)
- Frontend: `error-reporter.port.ts`, `console-error-reporter.ts`, `sentry-error-reporter.ts`, `error-boundary.tsx` (React Error Boundary global)
- `DomainExceptionFilter` actualizado para inyectar `ErrorReporter`

**Paso 6 — Prisma schemas:**
- Schema main (`api/prisma/main/schema.prisma`): modelos `Tenant`, `User`, `TenantMembership`, `Role`, `RefreshToken`, `OutboxEvent`
- Schema tenant (`api/prisma/tenant/schema.prisma`): modelo `OutboxEvent` (template para BDs de tenant)
- Verificar generación de tipos correcta para ambos schemas

**Paso 7 — Frontend React + Vite + Mantine:**
- Inicializar proyecto Vite con template `react-ts` en `web/`
- Instalar: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@tanstack/react-query`, `react-router`, `axios`, `zod`, `@sentry/react`, `react-i18next`, `i18next`
- Crear estructura de features: `auth/`, `members/`, `treasury/`, `settings/`
- Crear `app/` con `app.tsx`, `router.tsx`, `providers.tsx`, `theme.ts`
- Implementar `http-client.ts`: Axios con interceptors de request (Bearer + X-Tenant-Id) y response (401 refresh, error parsing)
- Integrar `ErrorBoundary` en `providers.tsx`

**Paso 8 — Docker Compose:**
- `docker-compose.yml` con: PostgreSQL 18 Alpine (con extensiones uuid-ossp, pg_trgm, pgcrypto), MinIO, Mailpit
- `.env.example` en `api/` y `web/` con todas las variables necesarias

**Paso 9 — Testing:**
- Backend: `vitest.config.ts` (env node, coverage v8, thresholds 80%/70%)
- Frontend: `vitest.config.ts` (env jsdom, coverage v8, mismos thresholds)
- E2E: `playwright.config.ts` (testDir e2e/, timeout 30s, retries 2, baseURL localhost:5173)

**Paso 10 — CI/CD (GitHub Actions):**
- `.github/workflows/ci.yml`: job backend (lint, test:unit --coverage, test:integration con PostgreSQL), job frontend (lint, typecheck, test --coverage, build), job e2e (Playwright)

**Paso 11 — Tooling de desarrollo:**
- ESLint: `@typescript-eslint` para ambos workspaces
- Prettier: `.prettierrc` (singleQuote, trailingComma, printWidth: 100)
- Husky: pre-commit hook
- lint-staged: `*.{ts,tsx}` → eslint --fix + prettier --write

**Paso 12 — Verificación final:**
- `docker compose up` arranca sin errores
- `npm run dev` (api) sirve Swagger en `/api/docs`
- `npm run dev` (web) renderiza en `localhost:5173`
- Tests unitarios de smoke pasan en api y web
- `npm run lint` pasa sin errores en ambos workspaces
- Prisma genera tipos correctos para ambos schemas
- `ErrorReporter` se resuelve por DI (ConsoleErrorReporter en dev)
- `ErrorBoundary` en frontend captura errores y los reporta

### Out of Scope

- Implementación de lógica de negocio de ningún Use Case
- Datos semilla (roles, permisos) — se crean en UC-001 (Fase 1)
- Configuración de entornos staging/producción ni hosting
- Autenticación funcional (JWT middleware registrado pero sin handlers de auth — es UC-002)
- SEPA, GDPR, módulos de BC distintos de Identity (Fase 1+)
- Configuración de eventos de comunicación (BC-Communication — Fase 2+)

## Approach

**Estrategia híbrida — CLI para boilerplate, manual para piezas críticas de arquitectura:**

1. Usar `nest new api --package-manager npm --skip-git` para NestJS (obtiene `main.ts`, `app.module.ts`, tsconfig con decorators en un comando)
2. Usar `npm create vite@latest web -- --template react-ts` para el frontend
3. Implementar manualmente todas las piezas de alto valor arquitectónico: Shared Kernel DDD, PrismaTenantService, schemas Prisma duales, ObservabilityModule, ResponseEnvelopeInterceptor, Docker Compose, CI, tooling

**Orden de ejecución obligatorio (bottom-up):**
```
Repo config (.gitignore, package.json)
  → NestJS + Shared Kernel + Infraestructura
    → Prisma schemas
      → Frontend
        → Docker Compose + Testing
          → CI/CD + Tooling
            → Verificación final
```

El `.gitignore` debe ser el **primer cambio committed** antes de instalar ninguna dependencia npm.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.gitignore` | Modified | Añadir node_modules, dist, coverage, .env, .prisma |
| `.editorconfig` | New | Convenciones de editor (2 spaces, utf-8, LF) |
| `package.json` (root) | New | npm workspaces `["api", "web"]`, scripts raíz, lint-staged config |
| `.prettierrc` | New | Configuración Prettier compartida |
| `eslint.config.js` | New | Configuración ESLint compartida (TypeScript) |
| `.husky/pre-commit` | New | Hook pre-commit con lint-staged |
| `api/` | New | Proyecto NestJS completo desde cero |
| `api/src/shared/domain/` | New | AggregateRoot, Entity, ValueObject, DomainEvent, Identifier, Repository, ports (ErrorReporter, EventTracker) |
| `api/src/shared/infrastructure/` | New | PrismaMainService, PrismaTenantService, TenantMiddleware, OutboxProcessorService, ResponseEnvelopeInterceptor, DomainExceptionFilter, JwtAuthGuard, PermissionsGuard, ObservabilityModule + adapters |
| `api/src/identity/` | New | Esqueleto BC-Identity (application/, domain/, infrastructure/, identity.module.ts) |
| `api/src/membership/` | New | Esqueleto BC-Membership |
| `api/src/treasury/` | New | Esqueleto BC-Treasury |
| `api/src/events/` | New | Esqueleto BC-Events |
| `api/src/communication/` | New | Esqueleto BC-Communication |
| `api/src/documents/` | New | Esqueleto BC-Documents |
| `api/src/app.module.ts` | New | AppModule con todos los BC registrados |
| `api/src/main.ts` | New | Bootstrap NestJS con Swagger, interceptors, filtros globales |
| `api/prisma/main/schema.prisma` | New | Schema DB-Main: Tenant, User, TenantMembership, Role, RefreshToken, OutboxEvent |
| `api/prisma/tenant/schema.prisma` | New | Schema DB-Tenant template: OutboxEvent |
| `api/vitest.config.ts` | New | Configuración Vitest backend |
| `api/.env.example` | New | Variables de entorno del backend |
| `web/` | New | Proyecto React + Vite completo desde cero |
| `web/src/app/` | New | app.tsx, router.tsx, providers.tsx, theme.ts |
| `web/src/features/` | New | Esqueletos de features: auth/, members/, treasury/, settings/ |
| `web/src/shared/api/` | New | http-client.ts, api-error.ts |
| `web/src/shared/observability/` | New | error-reporter.port.ts, console/sentry adapters, error-boundary.tsx |
| `web/vitest.config.ts` | New | Configuración Vitest frontend |
| `web/.env.example` | New | Variables de entorno del frontend |
| `docker-compose.yml` | New | PostgreSQL 18, MinIO, Mailpit |
| `playwright.config.ts` | New | Configuración Playwright E2E |
| `.github/workflows/ci.yml` | New | Pipeline CI: backend + frontend + e2e jobs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma 7 requiere `prisma.config.ts` (ESM-only, ya no soporta schema path inline en CLI) | High | Cargar skill `prisma-upgrade-v7` antes de escribir cualquier schema Prisma; usar `prisma.config.ts` desde el inicio |
| NestJS CLI instala NestJS 10.x en vez de 11.x | Medium | Especificar `@nestjs/cli@latest` + verificar versión post-install; pin en package.json si necesario |
| Docker image `postgres:18-alpine` puede no existir o estar en beta | Medium | Intentar `postgres:18-alpine`; si no está disponible, usar `postgres:17-alpine` con comentario de migración futura |
| `.gitignore` incompleto antes de instalar dependencias contamina git history con node_modules | High | `.gitignore` es el **primer commit**, antes de cualquier `npm install` |
| Shared Kernel con dependencias de infraestructura (acoplamiento accidental) | Medium | Solo `uuid` permitida en `shared/domain/`; validar que no hay imports de `@nestjs/*` ni `prisma` en esa capa |
| `PrismaTenantService` sin límite de conexiones agota el pool de PostgreSQL | Medium | Implementar límite de 10 conexiones por tenant (RNFT-004) desde el scaffold; documentar con test de smoke |
| Schemas Prisma duales no generan tipos correctos (main vs tenant) | Medium | Ejecutar `prisma generate` para ambos schemas y verificar imports antes de dar el paso 6 por completado |
| Sentry SDK introduce overhead en desarrollo local | Low | `ObservabilityModule` inyecta `ConsoleErrorReporter` por defecto; `SentryErrorReporter` solo si `SENTRY_DSN` está definida |

## Rollback Plan

Esta es la primera fase del proyecto. El repositorio en el estado actual no tiene código implementado.

**Rollback = eliminar todos los ficheros generados** volviendo al estado pre-scaffold (solo documentación).

Procedimiento concreto:
```bash
# Eliminar todo el código generado
git revert <commit-hash-del-scaffold>
# O, si se ha hecho en un único commit:
git reset --hard HEAD~1
# O, para eliminar directorios específicos si el scaffold fue incremental:
git rm -r api/src api/prisma api/package.json api/tsconfig.json
git rm -r web/src web/package.json
git rm docker-compose.yml .github/workflows/ci.yml playwright.config.ts
git rm .prettierrc eslint.config.js .editorconfig .husky/
git checkout HEAD -- .gitignore
```

No hay lógica de negocio implementada, ni datos en base de datos, ni secretos expuestos. El rollback es seguro y no tiene consecuencias externas.

## Dependencies

- Node.js 22.x LTS instalado en la máquina de desarrollo
- Docker y Docker Compose instalados (para validar Paso 8 y Paso 12)
- Git configurado
- Acceso a npm registry (para instalar dependencias)
- Skill `prisma-upgrade-v7` debe cargarse antes de escribir schemas Prisma (Paso 6)
- Skill `nestjs-best-practices` debe cargarse antes de escribir módulos NestJS (Paso 2)
- Skill `mantine-dev` debe cargarse antes de configurar el frontend (Paso 7)

## Success Criteria

- [ ] Un desarrollador puede clonar el repositorio, ejecutar `docker compose up` + `npm install` y tener el entorno funcionando en menos de 5 minutos
- [ ] `docker compose up` arranca PostgreSQL, MinIO y Mailpit sin errores
- [ ] `npm run dev` en `api/` arranca NestJS en modo dev y sirve Swagger en `http://localhost:3000/api/docs`
- [ ] `npm run dev` en `web/` arranca Vite y renderiza la app en `http://localhost:5173`
- [ ] `npm run test:unit` en `api/` ejecuta al menos 1 test de smoke y pasa
- [ ] `npm run test` en `web/` ejecuta al menos 1 test de smoke y pasa
- [ ] `npm run lint` pasa sin errores en `api/` y `web/`
- [ ] `prisma generate` genera tipos correctos para los schemas `main` y `tenant` sin errores
- [ ] La estructura de carpetas refleja fielmente los 6 Bounded Contexts (ADR-003)
- [ ] Las clases base del Shared Kernel (`AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`) no tienen dependencias de `@nestjs/*` ni de Prisma
- [ ] `PrismaTenantService` implementa el límite de 10 conexiones por tenant (RNFT-004)
- [ ] `ErrorReporter` se resuelve por inyección de dependencias en el backend (`ConsoleErrorReporter` en desarrollo)
- [ ] `ErrorBoundary` en el frontend captura errores no manejados y los reporta vía `ErrorReporter`
- [ ] El pipeline CI ejecuta lint, typecheck y tests unitarios en cada push a cualquier branch
