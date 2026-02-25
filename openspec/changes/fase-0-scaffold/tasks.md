# Tasks — fase-0-scaffold

## Paso 1: Repo root

- [x] 1.1 Update `.gitignore` — añadir node_modules/, dist/, .env, coverage/, .prisma/, *.tsbuildinfo, .DS_Store, api copy/, web copy/
- [x] 1.2 Create `.editorconfig` — indent_size=2, charset=utf-8, end_of_line=lf
- [x] 1.3 Create root `package.json` — workspaces: ["api", "web"], scripts: lint, test:e2e

## Paso 2: Backend NestJS structure

- [x] 2.1 Create `api/package.json`
- [x] 2.2 Create `api/tsconfig.json`
- [x] 2.3 Create `api/nest-cli.json`
- [x] 2.4 Create BC directory structure with .gitkeep files (identity, membership, treasury, events, communication, documents)
- [x] 2.5 Create BC module files ({bc}.module.ts) for all 6 BCs
- [x] 2.6 Create `api/src/shared/shared.module.ts`
- [x] 2.7 Create `api/src/app.module.ts`
- [x] 2.8 Create `api/src/main.ts`

## Paso 3: Shared Kernel DDD

- [x] 3.1 Create `entity.base.ts`
- [x] 3.2 Create `value-object.base.ts`
- [x] 3.3 Create `domain-event.base.ts`
- [x] 3.4 Create `aggregate-root.base.ts`
- [x] 3.5 Create `identifier.base.ts`
- [x] 3.6 Create `repository.interface.ts`
- [x] 3.7 Create `ports/error-reporter.port.ts`
- [x] 3.8 Create `ports/event-tracker.port.ts`
- [x] 3.9 Create `shared/domain/index.ts` barrel export

## Paso 4: Infraestructura multi-tenant

- [x] 4.1 Create `shared/domain/exceptions/domain-exception.base.ts`
- [x] 4.2 Create `shared/infrastructure/persistence/prisma-main.service.ts`
- [x] 4.3 Create `shared/infrastructure/persistence/prisma-tenant.service.ts`
- [x] 4.4 Create `shared/infrastructure/persistence/outbox-processor.service.ts`
- [x] 4.5 Create `shared/infrastructure/middleware/tenant.middleware.ts`
- [x] 4.6 Create `shared/infrastructure/interceptors/response-envelope.interceptor.ts`
- [x] 4.7 Create `shared/infrastructure/filters/domain-exception.filter.ts`
- [x] 4.8 Create `shared/infrastructure/guards/jwt-auth.guard.ts`
- [x] 4.9 Create `shared/infrastructure/guards/permissions.guard.ts`
- [x] 4.10 Create `shared/infrastructure/guards/require-permissions.decorator.ts`

## Paso 5: Infraestructura de observabilidad

- [x] 5.1 Create `shared/infrastructure/observability/console-error-reporter.ts`
- [x] 5.2 Create `shared/infrastructure/observability/sentry-error-reporter.ts`
- [x] 5.3 Create `shared/infrastructure/observability/console-event-tracker.ts`
- [x] 5.4 Create `shared/infrastructure/observability/sentry-event-tracker.ts`
- [x] 5.5 Create `shared/infrastructure/observability/observability.module.ts`
- [x] 5.6 Update `shared/shared.module.ts` to import/export ObservabilityModule

## Pasos pendientes
- [ ] 6 Prisma schemas (main + tenant)
- [ ] 7 Frontend React + Vite + Mantine
- [ ] 8 Docker Compose
- [ ] 9 Testing (Vitest + Playwright)
- [ ] 10 CI/CD GitHub Actions
- [ ] 11 Tooling (ESLint, Prettier, Husky)
- [ ] 12 Verificación final
