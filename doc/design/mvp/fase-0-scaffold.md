# Fase 0 — Scaffold del proyecto

## Información general

- **Fase:** 0
- **Tipo:** Infraestructura
- **Bounded Contexts afectados:** Todos
- **Prioridad:** Requisito previo obligatorio

## Alcance

### Incluido

- Estructura monorepo (`api/` + `web/`)
- Backend NestJS con estructura de módulos por BC (ADR-001, ADR-003)
- Frontend React + Vite + Mantine
- Configuración Prisma con soporte multi-tenant (schema main + schema tenant)
- Docker Compose para desarrollo local (PostgreSQL, MinIO, Mailpit)
- CI/CD con GitHub Actions (lint, typecheck, test, build)
- Infraestructura de testing (Vitest + Playwright)
- Tooling de desarrollo (ESLint, Prettier, Husky, lint-staged)
- Shared kernel con clases base de DDD (AggregateRoot, Entity, ValueObject, DomainEvent)
- Infraestructura de Domain Events con patrón Outbox (ADR-008)
- Puertos de observabilidad (`ErrorReporter`, `EventTracker`) con adaptadores: `ConsoleErrorReporter` (desarrollo) y `SentryErrorReporter` (staging/producción)

### Excluido

- Implementación de lógica de negocio de ningún UC
- Datos semilla (roles, permisos) — se crean en UC-001
- Configuración de entornos de producción / hosting

## Dependencias

### Tareas previas requeridas

Ninguna. Esta es la primera tarea del proyecto.

### Prerrequisitos de entorno

- Node.js 22.x LTS
- Docker y Docker Compose
- Git
- npm (incluido con Node.js)

### Artefactos producidos

| Artefacto                                                   | Consumido por                                 |
| ----------------------------------------------------------- | --------------------------------------------- |
| Estructura de módulos NestJS por BC                         | Todas las tareas de backend                   |
| Shared kernel (clases base DDD)                             | Todas las tareas de backend                   |
| PrismaTenantService + TenantMiddleware                      | UC-001 (provisión), UC-002 (autenticación)    |
| Prisma schema main (DB-Main)                                | UC-001, UC-002                                |
| Prisma schema tenant (DB-Tenant template)                   | UC-001 (ejecución de migrations en provisión) |
| Puertos de observabilidad (`ErrorReporter`, `EventTracker`) | Todas las tareas de backend y frontend        |
| HttpClient configurado (axios + interceptors)               | Todas las tareas de frontend                  |
| Estructura de features del frontend                         | Todas las tareas de frontend                  |
| Docker Compose funcional                                    | Desarrollo local de todas las tareas          |
| Pipeline CI operativo                                       | Todas las tareas (quality gates)              |

## Referencia de especificación

| Documento      | Relevancia                                                |
| -------------- | --------------------------------------------------------- |
| ADR-001        | Monolito modular — estructura general                     |
| ADR-002        | Multi-tenant por BD — PrismaTenantService, esquema de BDs |
| ADR-003        | Módulos por BC — estructura de carpetas                   |
| ADR-004        | Domain Events in-process — EventDispatcher                |
| ADR-005        | PostgreSQL — configuración de BD                          |
| ADR-008        | Outbox pattern — tabla `outbox_events`, procesador        |
| ADR-009        | Clean Architecture — capas por módulo                     |
| ADR-010        | API REST — convenciones de endpoints y respuestas         |
| ADR-012        | Testing — Vitest, pirámide 70/20/10                       |
| RNFT-004       | Multi-tenant con Prisma — código de referencia            |
| Stack completo | Versiones de dependencias y justificaciones               |

## Puntos críticos

1. **Estructura de módulos correcta desde el inicio.** La estructura de carpetas por BC (ADR-003) y la separación en capas (ADR-009) son difíciles de cambiar una vez que hay código implementado. Definirlas bien en el scaffold evita refactorizaciones costosas.

2. **PrismaTenantService con pool de conexiones.** El servicio que gestiona clientes Prisma por tenant debe implementar connection pooling con límites (máx. 10 conexiones por tenant según RNFT-004). Sin esto, el sistema agota conexiones de PostgreSQL con pocos tenants concurrentes.

3. **Schemas Prisma separados (main vs tenant).** DB-Main (BC-Identity) y DB-Tenant (BC-Membership + BC-Treasury) son esquemas Prisma distintos con datasources distintos. Prisma genera un client por schema. Esta separación debe quedar establecida en el scaffold.

4. **Clases base del Shared Kernel.** `AggregateRoot`, `Entity`, `ValueObject` y `DomainEvent` son las interfaces que todo el dominio implementará. Si su API cambia después, el refactoring es masivo.

5. **Formato de respuesta API estandarizado.** El envelope de respuesta (`{ data, meta }` / `{ error: { code, message, details } }`) definido en ADR-010 debe implementarse como interceptor global en el scaffold. Cambiar el formato después de la Fase 1 rompe todos los consumidores.

6. **Puertos de observabilidad definidos como interfaces.** `ErrorReporter` y `EventTracker` se definen como interfaces en el Shared Kernel (capa de aplicación/dominio). Los adaptadores concretos (`ConsoleErrorReporter`, `SentryErrorReporter`) viven en infraestructura. El `DomainExceptionFilter`, los handlers de aplicación y el `ErrorBoundary` del frontend consumen las interfaces, no las implementaciones. Esto garantiza que cambiar de proveedor (Sentry → Datadog, Rollbar, etc.) solo requiere un nuevo adaptador, sin tocar lógica de negocio.

## Riesgos

| Riesgo                                                             | Probabilidad | Impacto | Mitigación                                                                                                        |
| ------------------------------------------------------------------ | ------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| Prisma multi-schema no genera tipos correctos                      | Media        | Alto    | Verificar generación de tipos con ambos schemas antes de continuar                                                |
| Docker Compose con volúmenes de PostgreSQL causa problemas en WSL2 | Media        | Bajo    | Usar named volumes, no bind mounts para datos de BD                                                               |
| Versiones de dependencias incompatibles entre sí                   | Baja         | Medio   | Fijar versiones exactas en package.json, ejecutar `npm ci`                                                        |
| Shared Kernel demasiado acoplado a infraestructura                 | Media        | Alto    | Solo tipos e interfaces en `shared/domain/`, sin dependencias de npm                                              |
| Sentry SDK introduce overhead en desarrollo local                  | Baja         | Bajo    | Inyectar `ConsoleErrorReporter` en desarrollo, `SentryErrorReporter` solo en staging/prod via variable de entorno |

## Plan de implementación

### Paso 1: Revisión de repositorio

- Revisar si existe repositorio Git y si no crearlo
- Crear/Modificar `.gitignore` (node_modules, dist, .env, coverage, .prisma)
- Crear/Modificar `.editorconfig` (indent: 2 spaces, charset: utf-8, LF)
- Crear `package.json` raíz con configuración de workspaces npm:
  ```
  workspaces: ["api", "web"]
  ```

### Paso 2: Backend — NestJS

- Inicializar proyecto NestJS en `api/`
- Configurar `tsconfig.json` con strict mode:
  ```
  strict: true, strictNullChecks: true, noImplicitAny: true,
  experimentalDecorators: true, emitDecoratorMetadata: true
  ```
- Instalar dependencias core:
  - `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`
  - `@nestjs/swagger`
  - `class-validator`, `class-transformer`
  - `@nestjs/cqrs`
  - `@nestjs/schedule`
  - `uuid`, `date-fns`
  - `argon2` (en lugar de bcrypt — UC-002 especifica Argon2)
- Crear estructura de módulos por BC:

```
api/src/
├── shared/
│   ├── domain/
│   │   ├── aggregate-root.base.ts
│   │   ├── entity.base.ts
│   │   ├── value-object.base.ts
│   │   ├── domain-event.base.ts
│   │   ├── identifier.base.ts
│   │   ├── repository.interface.ts
│   │   └── ports/
│   │       ├── error-reporter.port.ts
│   │       └── event-tracker.port.ts
│   └── infrastructure/
│       ├── persistence/
│       │   ├── prisma-main.service.ts
│       │   ├── prisma-tenant.service.ts
│       │   └── outbox-processor.service.ts
│       ├── middleware/
│       │   └── tenant.middleware.ts
│       ├── interceptors/
│       │   └── response-envelope.interceptor.ts
│       ├── filters/
│       │   └── domain-exception.filter.ts
│       ├── observability/
│       │   ├── console-error-reporter.ts
│       │   ├── sentry-error-reporter.ts
│       │   ├── console-event-tracker.ts
│       │   ├── sentry-event-tracker.ts
│       │   └── observability.module.ts
│       └── guards/
│           ├── jwt-auth.guard.ts
│           └── permissions.guard.ts
├── identity/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   └── dtos/
│   ├── domain/
│   │   ├── aggregates/
│   │   ├── value-objects/
│   │   ├── events/
│   │   └── repositories/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   └── controllers/
│   └── identity.module.ts
├── membership/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   └── dtos/
│   ├── domain/
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── events/
│   │   └── repositories/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   └── controllers/
│   └── membership.module.ts
├── treasury/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   └── dtos/
│   ├── domain/
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── events/
│   │   └── repositories/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   └── controllers/
│   └── treasury.module.ts
├── app.module.ts
└── main.ts
```

- Configurar `AppModule` con registro de módulos BC (vacíos inicialmente)
- Implementar `ResponseEnvelopeInterceptor` para formato de respuesta ADR-010
- Implementar `DomainExceptionFilter` para manejo de errores de dominio
- Configurar Swagger/OpenAPI en `main.ts`
- Verificar que la aplicación arranca correctamente

### Paso 3: Shared kernel — Clases base DDD

- **`AggregateRoot<TId>`**: Extiende `Entity<TId>`, acumula Domain Events, expone `pullDomainEvents()` para flush
- **`Entity<TId>`**: Identidad por ID, `equals()`, `props`
- **`ValueObject<TProps>`**: Inmutable, igualdad por valor, `equals()`
- **`DomainEvent`**: `eventId` (UUID), `occurredOn` (Date), `eventType` (string), `payload`
- **`Identifier`**: UUID wrapper con validación y `equals()`
- **`Repository<T>`**: Interfaz con `save(aggregate)`, `findById(id)`, `delete(id)`
- Estas clases NO deben tener dependencias de npm (excepto `uuid` para `Identifier`)

**Puertos de observabilidad** (en `shared/domain/ports/`):

- **`ErrorReporter`** (interfaz/puerto):
  - `captureException(error: Error, context?: Record<string, unknown>): void`
  - `captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: Record<string, unknown>): void`
  - `setUser(userId: string, email: string, tenantId?: string): void`
  - `setContext(key: string, data: Record<string, unknown>): void`
- **`EventTracker`** (interfaz/puerto):
  - `trackEvent(name: string, properties?: Record<string, unknown>): void`
  - `trackPageView(path: string, properties?: Record<string, unknown>): void`
- Estas interfaces viven en la capa de dominio/aplicación. No tienen dependencias de infraestructura

### Paso 4: Infraestructura multi-tenant

- **`PrismaMainService`**: Client Prisma para DB-Main (singleton). Gestiona `tenants`, `users`, `tenant_memberships`, `roles`, `outbox_events`
- **`PrismaTenantService`**: Gestiona pool de clientes Prisma por tenant (Map<tenantId, PrismaClient>). Límite de 10 conexiones por tenant. Método `getClient(tenantId): PrismaClient`
- **`TenantMiddleware`**: Extrae `X-Tenant-Id` del header (o del JWT tras autenticación), lo inyecta en `req.tenantId`. Se aplica a todas las rutas excepto `/auth/*` y `/tenants/*`
- **`OutboxProcessorService`**: Job programado (@nestjs/schedule) que lee eventos pendientes de `outbox_events`, los despacha a los handlers correspondientes y los marca como procesados. Backoff exponencial en caso de fallo (1s, 2s, 4s, 8s, 16s). Máximo 5 reintentos

### Paso 5: Infraestructura de observabilidad

Crear en `api/src/shared/infrastructure/observability/`:

- **`ConsoleErrorReporter`**: Implementa `ErrorReporter`. Usa `console.error`/`console.warn` con formato estructurado (JSON). Implementación por defecto para desarrollo local y tests
- **`SentryErrorReporter`**: Implementa `ErrorReporter`. Usa `@sentry/nestjs` para captura de excepciones y contexto. Configura DSN desde variable de entorno `SENTRY_DSN`. Solo se activa si `SENTRY_DSN` está definida
- **`ConsoleEventTracker`**: Implementa `EventTracker`. Logging por consola. Desarrollo y tests
- **`SentryEventTracker`**: Implementa `EventTracker`. Usa Sentry para tracking de eventos de negocio relevantes
- **`ObservabilityModule`**: Módulo NestJS que registra los adaptadores según configuración:
  - Si `SENTRY_DSN` está definida → registra `SentryErrorReporter` y `SentryEventTracker`
  - Si no → registra `ConsoleErrorReporter` y `ConsoleEventTracker`
  - Usa tokens de inyección: `ERROR_REPORTER` y `EVENT_TRACKER`
- Instalar `@sentry/nestjs` como dependencia del backend
- Actualizar `DomainExceptionFilter` para inyectar `ErrorReporter` en lugar de log directo

Crear en `web/src/shared/observability/`:

- **`error-reporter.port.ts`**: Misma interfaz `ErrorReporter` para el frontend
- **`console-error-reporter.ts`**: Implementación con `console.error`
- **`sentry-error-reporter.ts`**: Implementación con `@sentry/react`. Inicializa con DSN desde `import.meta.env.VITE_SENTRY_DSN`
- **`error-boundary.tsx`**: React Error Boundary global que captura errores no manejados y los reporta vía `ErrorReporter`. Muestra fallback UI con opción de recargar
- Instalar `@sentry/react` como dependencia del frontend
- Integrar `ErrorBoundary` en `providers.tsx` envolviendo toda la aplicación

Añadir a `.env.example` (ambos workspaces):

- `SENTRY_DSN=` (vacía en desarrollo, se configura en staging/producción)
- `VITE_SENTRY_DSN=` (frontend, vacía en desarrollo)

### Paso 6: Prisma schemas

**Schema main** (`api/prisma/main/schema.prisma`):

- datasource apuntando a `DATABASE_MAIN_URL`
- Modelos iniciales:
  - `Tenant` (id UUID, slug, name, cif, type, status, database_name, created_at)
  - `User` (id UUID, email unique, password_hash, name, status, failed_attempts, blocked_until, created_at, last_access)
  - `TenantMembership` (id UUID, user_id FK, tenant_id FK, role_id FK, member_id nullable, assigned_at, assigned_by, active, unique [user_id, tenant_id])
  - `Role` (id UUID, code, name, description, permissions JSON, is_system, tenant_id nullable, unique [code, tenant_id])
  - `RefreshToken` (id UUID, user_id FK, token_hash, expires_at, created_at, revoked_at nullable)
  - `OutboxEvent` (id UUID, event_type, payload JSON, tenant_id, created_at, processed_at nullable, retry_count, last_error nullable)
- Ejecutar `prisma migrate dev` y verificar generación de tipos

**Schema tenant** (`api/prisma/tenant/schema.prisma`):

- datasource apuntando a `DATABASE_TENANT_URL` (variable, se reemplaza en runtime)
- Modelos iniciales (mínimos, se extenderán en cada UC de F1):
  - `OutboxEvent` (misma estructura que en main — cada BD de tenant necesita su propia outbox)
- Este schema sirve como template: UC-001 lo ejecutará en cada BD de tenant durante la provisión
- Las migraciones de este schema se generan una vez y se aplican a cada tenant en provisión

### Paso 7: Frontend — React + Vite + Mantine

- Crear proyecto Vite con template `react-ts` en `web/`
- Instalar dependencias:
  - `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`
  - `react-hook-form` 7.71.2, `@hookform/resolvers`
  - `@tanstack/react-query`
  - `react-router`
  - `axios`
  - `zod` (validación de schemas en runtime — RNF-008)
  - `@sentry/react` (adaptador de observabilidad)
  - `react-i18next`, `i18next`
- Crear estructura de features:

```
web/src/
├── app/
│   ├── app.tsx
│   ├── router.tsx
│   ├── providers.tsx          # MantineProvider, QueryClientProvider, RouterProvider
│   └── theme.ts               # Tema Mantine personalizado
├── features/
│   ├── auth/                  # Login, tenant selector, auth state
│   ├── members/               # Gestión de socios
│   ├── treasury/              # Gestión de tesorería
│   └── settings/              # Configuración
├── shared/
│   ├── api/
│   │   ├── http-client.ts     # Axios instance con interceptors
│   │   └── api-error.ts       # Tipado de errores API (Zod schemas)
│   ├── observability/
│   │   ├── error-reporter.port.ts
│   │   ├── console-error-reporter.ts
│   │   ├── sentry-error-reporter.ts
│   │   └── error-boundary.tsx
│   ├── components/
│   │   └── layout/            # Shell, navbar, sidebar
│   ├── hooks/
│   │   └── use-auth.ts        # Hook de autenticación
│   └── types/
│       └── api.types.ts       # Tipos comunes de respuesta API
├── main.tsx
└── vite-env.d.ts
```

- Configurar `MantineProvider` con tema personalizado
- Configurar `QueryClientProvider` con defaults sensatos (staleTime, retry)
- Configurar `RouterProvider` con rutas básicas (login, dashboard placeholder)
- Implementar `http-client.ts`:
  - Instancia Axios con `baseURL` apuntando a API
  - Interceptor de request: inyecta `Authorization: Bearer {token}` y `X-Tenant-Id: {tenantId}`
  - Interceptor de response: manejo de 401 (refresh token), parseo de errores
- Verificar que la aplicación arranca y renderiza correctamente

### Paso 8: Docker Compose

Crear `docker-compose.yml` en la raíz:

- **postgres**: PostgreSQL 18 Alpine con extensiones `uuid-ossp`, `pg_trgm`, `pgcrypto`. Volume `postgres_data`. Puerto 5432. Script de init para crear BD `associated_main`
- **minio**: MinIO para S3-compatible storage. Puertos 9000 (API) + 9001 (consola). Volume `minio_data`
- **mailpit**: Mock SMTP para desarrollo. Puertos 1025 (SMTP) + 8025 (web UI)
- Crear archivos `.env.example` en `api/` y `web/` con todas las variables necesarias

### Paso 9: Testing

**Backend (Vitest):**

- Configurar `vitest.config.ts` con environment `node`
- Coverage provider `v8` con thresholds (lines: 80%, branches: 70%)
- Excluir de coverage: `*.dto.ts`, `*.module.ts`, `index.ts`, `*.config.ts`, migraciones
- Scripts: `test:unit`, `test:integration`, `test:cov`

**Frontend (Vitest):**

- Configurar `vitest.config.ts` con environment `jsdom`
- Coverage provider `v8` con mismos thresholds
- Scripts: `test`, `test:cov`

**E2E (Playwright):**

- Configurar `playwright.config.ts` en raíz
- `testDir: './e2e'`, timeout 30s, retries 2
- Base URL `http://localhost:5173`
- Script: `test:e2e`

### Paso 10: CI/CD — GitHub Actions

Crear `.github/workflows/ci.yml`:

- **Job backend**: checkout, setup-node 22, npm ci, lint, test:unit --coverage, test:integration (con servicio PostgreSQL), check coverage
- **Job frontend**: checkout, setup-node 22, npm ci, lint, typecheck, test --coverage, build
- **Job e2e**: depende de backend + frontend, Playwright
- Quality gates según ADR-012

### Paso 11: Tooling de desarrollo

- **ESLint**: `@typescript-eslint` para ambos workspaces. Config compartida en raíz
- **Prettier**: `.prettierrc` en raíz (singleQuote, trailingComma, printWidth: 100)
- **Husky**: `pre-commit` hook
- **lint-staged**: `*.{ts,tsx}` → eslint --fix + prettier --write

### Paso 12: Verificación final

- [ ] `docker compose up` arranca todos los servicios sin errores
- [ ] `npm run dev` (api) arranca NestJS y sirve Swagger en `/api/docs`
- [ ] `npm run dev` (web) arranca Vite y renderiza la app en `localhost:5173`
- [ ] `npm run test:unit` (api) ejecuta tests (al menos 1 test de smoke)
- [ ] `npm run test` (web) ejecuta tests (al menos 1 test de smoke)
- [ ] `npm run lint` pasa sin errores en ambos workspaces
- [ ] Prisma genera tipos correctos para ambos schemas (main y tenant)
- [ ] `ErrorReporter` se resuelve por inyección de dependencias en backend (ConsoleErrorReporter en dev)
- [ ] `ErrorBoundary` en frontend captura errores y los reporta vía `ErrorReporter`
- [ ] Pipeline CI ejecuta correctamente en push

## Criterios de aceptación

1. Un desarrollador puede clonar el repositorio, ejecutar `docker compose up` y `npm install` y tener el entorno funcionando en menos de 5 minutos.
2. La estructura de carpetas refleja fielmente los Bounded Contexts del dominio (ADR-003).
3. Las clases base del Shared Kernel permiten definir Aggregates, Entities y Value Objects sin dependencias de infraestructura.
4. PrismaTenantService crea y gestiona clientes Prisma dinámicos por tenant.
5. El pipeline CI ejecuta lint, typecheck y tests unitarios en cada push.
