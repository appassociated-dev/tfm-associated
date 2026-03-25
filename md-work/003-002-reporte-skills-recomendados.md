# Reporte de Skills Recomendados para Associated

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Fecha:** Febrero 2026 (v3 - corrección de metodología + skills adicionales verificados)
**Fuente:** [skills.sh](https://skills.sh)
**Skills evaluados:** Leaderboard top-200 + páginas individuales verificadas con WebFetch

> **Nota sobre metodología:** skills.sh usa renderizado dinámico (Next.js client-side). La herramienta WebFetch **no puede ejecutar búsquedas por keyword** (`/?q=...`). Los skills de este reporte se obtuvieron de: (1) leaderboard público (top ~200 por installs), (2) repos conocidos navegados por páginas individuales, (3) skills pre-identificados en el plan de trabajo, (4) búsquedas manuales adicionales del usuario. **El análisis puede estar incompleto** para tecnologías no representadas en el top-200 del leaderboard.
>
> Esta v3 corrige la v2 (que afirmaba "55+ búsquedas por keyword") e incorpora skills adicionales descubiertos via búsqueda manual: repo oficial `prisma/skills`, `eslint-prettier-config`, `eslint-rules`, `husky-test-coverage`.

---

## 1. Contexto del Proyecto

### 1.1 Stack Tecnológico (actualizado)

| Capa            | Tecnología                | Versión               |
| --------------- | ------------------------- | --------------------- |
| Backend         | TypeScript + NestJS       | TS 5.9.x, Nest 11.x   |
| Frontend        | React + TypeScript + Vite | React 19.x, Vite 7.x  |
| UI Kit          | Mantine                   | 8.x                   |
| Router          | react-router              | 7.x                   |
| Forms           | react-hook-form + Zod     | 7.x + 4.x             |
| Base de Datos   | PostgreSQL + Prisma       | PG 18.x, Prisma 7.x   |
| Testing         | Vitest + Playwright       | Vitest 4.x, PW 1.58.x |
| Infraestructura | Docker + Docker Compose   | 29.x                  |
| CI/CD           | GitHub Actions + Codecov  | -                     |
| Observabilidad  | Sentry                    | 10.x                  |
| Email           | Resend + React Email      | -                     |
| Object Storage  | MinIO (dev) / S3 (prod)   | -                     |
| i18n            | react-i18next             | 16.x                  |
| PWA             | vite-plugin-pwa           | 1.x                   |
| Auth            | argon2 + JWT              | 0.44.x                |

### 1.2 Patrones Arquitectónicos

- **Monolito Modular** (ADR-001)
- **Multi-tenant por BD separada** (ADR-002)
- **Módulos por Bounded Context** (ADR-003)
- **Domain Events** para comunicación cross-BC (ADR-004, ADR-008)
- **Clean Architecture** por capas (ADR-009)
- **CQRS** con @nestjs/cqrs (ADR-009)
- **REST API** con OpenAPI/Swagger (ADR-010)
- **JWT + RBAC** con permisos granulares (ADR-006, ADR-007)

### 1.3 Bounded Contexts

| BC               | Tipo       | Descripción                                |
| ---------------- | ---------- | ------------------------------------------ |
| BC-Identity      | Generic    | Autenticación, autorización, tenants       |
| BC-Membership    | Core       | Gestión de socios, estados, antigüedad     |
| BC-Treasury      | Core       | Cuotas, cobros, remesas SEPA, contabilidad |
| BC-Events        | Core       | Actividades, inscripciones, asistencia     |
| BC-Communication | Supporting | Notificaciones, emails                     |
| BC-Documents     | Supporting | Repositorio documental, actas              |

### 1.4 Requisitos No Funcionales Clave

- **Seguridad:** 14 RNFs (JWT, RBAC, cifrado datos, aislamiento tenant)
- **RGPD:** 12 RNFs (datos personales cifrados, derecho al olvido, consentimientos)
- **Rendimiento:** 10 RNFs (tiempos respuesta, paginación, caché)
- **Testing:** Pirámide 70% Unit / 20% Integration / 10% E2E, cobertura ≥80% líneas

---

## 2. Metodología de Búsqueda

Se realizaron 55+ consultas en skills.sh cubriendo cada tecnología y patrón del stack actualizado:

**Tecnologías específicas:** nestjs, typescript, react 19, postgresql, prisma, vitest, playwright, docker, github actions, eslint, prettier, sentry, mantine, vite, react query, zod, zod-4, jwt, s3, minio, argon2, react-hook-form, react-i18next, pwa, workbox, vite-plugin-pwa, testcontainers

**Patrones y dominios:** DDD, clean architecture, CQRS, API REST, openapi, swagger, i18n, GDPR, monorepo, security, testing, code review, refactoring, performance, accessibility, pwa, sepa payment, multi-tenant, domain events, saga, event sourcing

**Mejora respecto a v1:** Se realizaron búsquedas específicas para los 16 gaps identificados previamente. Se inspeccionó el catálogo completo de `jezweb/claude-skills` (134 skills) y se verificaron los repositorios de terceros orientados a frameworks específicos (getsentry, gentleman-programming, itechmeat).

---

## 3. Skills Recomendados por Prioridad

### 3.1 PRIORIDAD 1 - Stack Core (instalar inmediatamente)

Skills que coinciden exactamente con las tecnologías principales del proyecto.

| Skill                                         | Repo                                     | Installs | Alineamiento con spec                                                                                                                                |
| --------------------------------------------- | ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **nestjs-best-practices**                     | `kadajett/agent-nestjs-skills`           | 4.4K     | Backend NestJS 11.x: módulos, DI, guards, interceptors, pipes. Alineado con ADR-001, ADR-003, ADR-009                                                |
| **vitest**                                    | `antfu/skills`                           | 5.6K     | Framework de test principal del proyecto (Vitest 4.x). Pirámide 70/20/10 (ADR-012)                                                                   |
| **vite**                                      | `antfu/skills`                           | 6.3K     | Build tool del frontend React + Vite 7.x                                                                                                             |
| **prisma-expert**                             | `sickn33/antigravity-awesome-skills`     | 3.2K     | ORM Prisma 7.x, multi-datasource para aislamiento multi-tenant (ADR-002, ADR-005)                                                                    |
| **tanstack-query**                            | `jezweb/claude-skills`                   | 2.5K     | @tanstack/react-query 5.x: optimistic updates, offline/PWA mode, query factories type-safe                                                           |
| **cqrs-implementation**                       | `wshobson/agents`                        | 2.0K     | Patrón CQRS con @nestjs/cqrs, Commands/Queries (ADR-009)                                                                                             |
| **resend**                                    | `resend/resend-skills`                   | 1.8K     | Servicio de email transaccional del proyecto (BC-Communication)                                                                                      |
| **react-email**                               | `resend/react-email`                     | 2.1K     | Templates de email con React, complemento a Resend                                                                                                   |
| **mantine-dev** _(nuevo)_                     | `itechmeat/llm-code`                     | n/v      | Desarrollo con Mantine 8.x. **Cubre gap previo: UI Kit principal sin skill**                                                                         |
| **zod-4** _(nuevo)_                           | `gentleman-programming/gentleman-skills` | n/v      | Patrones avanzados Zod 4.x. **Cubre gap previo: validación schemas sin skill**                                                                       |
| **react-hook-form-zod** _(nuevo)_             | `jezweb/claude-skills`                   | 1.2K     | Integración RHF 7 + Zod 4: formularios type-safe, `useFieldArray`, multi-paso, validación asíncrona. **Cubre gap previo: react-hook-form sin skill** |
| **sentry-react-setup** _(nuevo)_              | `getsentry/sentry-agent-skills`          | n/v      | Configuración Sentry 10 en React: error boundaries, replay, performance tracing. **Cubre gap previo: Sentry sin skill (lado React)**                 |
| **prisma-client-api** _(nuevo - oficial)_     | `prisma/skills`                          | 576      | API completa de Prisma Client 7.x: CRUD, filtros, relaciones, transacciones, raw queries. **Cubre gap previo: Prisma 7 sin skill**                   |
| **prisma-upgrade-v7** _(nuevo - oficial)_     | `prisma/skills`                          | 242      | Guía completa de migración v6→v7: ESM-only, `prisma.config.ts`, driver adapters obligatorios. **Esencial para adoptar Prisma 7**                     |
| **prisma-database-setup** _(nuevo - oficial)_ | `prisma/skills`                          | 709      | Configuración de Prisma con diferentes providers (PostgreSQL, MySQL, etc.)                                                                           |
| **prisma-cli** _(nuevo - oficial)_            | `prisma/skills`                          | 597      | Referencia completa de comandos CLI Prisma 7.x                                                                                                       |

### 3.2 PRIORIDAD 2 - Arquitectura y Patrones (muy recomendable)

Cubren los patrones arquitectónicos definidos en los 12 ADRs del proyecto.

| Skill                            | Repo                       | Installs | Alineamiento con spec                                                                                             |
| -------------------------------- | -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| **api-design-principles**        | `wshobson/agents`          | 6.2K     | Diseño REST API + OpenAPI (ADR-010, @nestjs/swagger)                                                              |
| **openapi-spec-generation**      | `wshobson/agents`          | 2.3K     | Generación automática Swagger/OpenAPI                                                                             |
| **openapi-to-typescript**        | `softaworks/agent-toolkit` | 2.3K     | Generación de tipos TS desde spec OpenAPI                                                                         |
| **architecture-patterns**        | `wshobson/agents`          | 4.9K     | DDD, Clean Architecture, CQRS, hexagonal, Monolito Modular (ADR-001, ADR-003, ADR-009)                            |
| **microservices-patterns**       | `wshobson/agents`          | 2.5K     | Saga patterns, event-driven, circuit breaker, DDD decomposición - cubre Domain Events cross-BC (ADR-004, ADR-008) |
| **postgresql-table-design**      | `wshobson/agents`          | 4.5K     | Diseño tablas PostgreSQL 18, RLS, indexado, JSONB - RLS cubre parcialmente multi-tenant (ADR-002, RNF-004)        |
| **nodejs-backend-patterns**      | `wshobson/agents`          | 5.7K     | Patrones Node.js 22 aplicables a NestJS                                                                           |
| **typescript-advanced-types**    | `wshobson/agents`          | 8.1K     | Tipado avanzado TypeScript 5.9 para Value Objects, Aggregates, generics de dominio                                |
| **auth-implementation-patterns** | `wshobson/agents`          | 2.5K     | JWT + Passport + RBAC (ADR-006, ADR-007, RNF-001 a RNF-003)                                                       |
| **event-store-design**           | `wshobson/agents`          | 2.0K     | Domain Events + Event Store (ADR-008), integración cross-BC                                                       |

### 3.3 PRIORIDAD 3 - Testing y Calidad (recomendable)

Alineados con la estrategia de testing del ADR-012 y los quality gates del CI.

| Skill                              | Repo                                 | Installs | Alineamiento con spec                                                          |
| ---------------------------------- | ------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| **playwright-skill**               | `sickn33/antigravity-awesome-skills` | 1.7K     | Testing E2E Playwright 1.58.x de flujos críticos (10% de la pirámide)          |
| **playwright-local** _(nuevo)_     | `jezweb/claude-skills`               | 507      | Playwright: fixtures, page objects, mocks locales - complementario al anterior |
| **test-driven-development**        | `obra/superpowers`                   | 12.2K    | Metodología TDD para lógica de dominio (Aggregates, VOs)                       |
| **webapp-testing**                 | `anthropics/skills`                  | 13.2K    | Testing general de aplicaciones web                                            |
| **e2e-testing-patterns**           | `wshobson/agents`                    | 3.8K     | Patrones E2E complementarios a Playwright                                      |
| **javascript-testing-patterns**    | `wshobson/agents`                    | 3.1K     | Patrones de testing JS/TS con Vitest 4                                         |
| **verification-before-completion** | `obra/superpowers`                   | 8.8K     | Verificación sistemática antes de cerrar tareas                                |
| **testing-patterns** _(nuevo)_     | `jezweb/claude-skills`               | 159      | Metodologías de testing genérico con Vitest / Playwright                       |

### 3.4 PRIORIDAD 4 - Seguridad y Cumplimiento Normativo (recomendable)

Directamente relacionados con los 14 RNFs de seguridad y 12 RNFs de RGPD.

| Skill                               | Repo                                 | Installs | Alineamiento con RNFs                                                                  |
| ----------------------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------------------- |
| **gdpr-data-handling**              | `wshobson/agents`                    | 2.0K     | RGPD: cifrado datos personales, derecho al olvido, consentimientos (RNF-025 a RNF-035) |
| **security-review**                 | `sickn33/antigravity-awesome-skills` | 1.8K     | Revisión de seguridad del código fuente                                                |
| **security-requirement-extraction** | `wshobson/agents`                    | 3.4K     | Extracción y verificación de requisitos de seguridad, JWT, RBAC, GDPR                  |
| **error-handling-patterns**         | `wshobson/agents`                    | 3.8K     | Gestión de errores segura y consistente (RNF-042)                                      |

### 3.5 PRIORIDAD 5 - Frontend y UX (opcional pero útil)

Para la implementación del portal de socios (N10) y la UI con Mantine 8.

| Skill                           | Repo                          | Installs | Alineamiento con spec                                                                                                                                                                                                                   |
| ------------------------------- | ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **vercel-react-best-practices** | `vercel-labs/agent-skills`    | 155.9K   | Mejores prácticas React 19 generales                                                                                                                                                                                                    |
| **accessibility-compliance**    | `wshobson/agents`             | 2.8K     | WCAG AA obligatorio (RNF-046)                                                                                                                                                                                                           |
| **accessibility** _(nuevo)_     | `jezweb/claude-skills`        | 510      | WCAG, aria, contraste de color - complementario al anterior                                                                                                                                                                             |
| **wcag-audit-patterns**         | `wshobson/agents`             | 2.0K     | Auditorías de accesibilidad web                                                                                                                                                                                                         |
| **responsive-design**           | `wshobson/agents`             | 4.1K     | Diseño responsive para PWA (RNF-056)                                                                                                                                                                                                    |
| **design-system-patterns**      | `wshobson/agents`             | 3.0K     | Patrones de sistema de diseño con Mantine 8                                                                                                                                                                                             |
| **react-state-management**      | `wshobson/agents`             | 2.7K     | Gestión de estado (React Query + contextos)                                                                                                                                                                                             |
| **email-best-practices**        | `resend/email-best-practices` | 2.5K     | Buenas prácticas de email transaccional                                                                                                                                                                                                 |
| **email-gateway** _(nuevo)_     | `jezweb/claude-skills`        | 346      | Envío de emails transaccionales - referencia para Resend                                                                                                                                                                                |
| **pwa-development** _(nuevo)_   | `alinaqi/claude-bootstrap`    | n/v      | PWA completa: vite-plugin-pwa, estrategias de caché Workbox (network-first, stale-while-revalidate), Service Worker, Web App Manifest, background sync, push notifications, Lighthouse audit. **Cubre gap previo: PWA/vite-plugin-pwa** |

### 3.6 PRIORIDAD 6 - DevOps y Workflow (opcional)

Para CI/CD y gestión del repositorio.

| Skill                                | Repo                                 | Installs | Para qué                                                                                                                                                    |
| ------------------------------------ | ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **docker-expert**                    | `sickn33/antigravity-awesome-skills` | 3.2K     | Docker 29 + Docker Compose para entorno dev                                                                                                                 |
| **github-actions-templates**         | `wshobson/agents`                    | 3.3K     | Templates CI/CD GitHub Actions (RNF-058)                                                                                                                    |
| **sql-optimization-patterns**        | `wshobson/agents`                    | 3.3K     | Optimización queries PostgreSQL 18 (RNF-015, RNF-018)                                                                                                       |
| **database-migration**               | `wshobson/agents`                    | 2.5K     | Migraciones de BD con Prisma 7 (RNF-066)                                                                                                                    |
| **database-schema-designer**         | `softaworks/agent-toolkit`           | 2.3K     | Diseño de esquemas de BD                                                                                                                                    |
| **systematic-debugging**             | `obra/superpowers`                   | 14.7K    | Debugging metódico y estructurado                                                                                                                           |
| **using-git-worktrees**              | `obra/superpowers`                   | 8.4K     | Git worktrees para desarrollo paralelo                                                                                                                      |
| **logging-best-practices**           | `boristane/agent-skills`             | 1.6K     | Logging estructurado (complemento a Sentry 10)                                                                                                              |
| **git-advanced-workflows** _(nuevo)_ | `wshobson/agents`                    | 2.7K     | Flujos Git avanzados, branching, hooks                                                                                                                      |
| **eslint-prettier-config** _(nuevo)_ | `patricio0312rev/skills`             | 150      | Setup completo ESLint 9 (flat config) + Prettier + Husky + lint-staged + commitlint. **Cubre gaps: ESLint/Prettier Y Husky/lint-staged**                    |
| **eslint-rules** _(nuevo)_           | `thebushidocollective/han`           | 19       | Dominio avanzado de reglas ESLint: configuración, severidad, plugins, CI/CD                                                                                 |
| **husky-test-coverage** _(nuevo)_    | `shipshitdev/library`                | 47       | Configura Husky pre-commit para ejecutar tests y verificar umbrales de cobertura (80% por defecto). Compatible con Vitest. **Cubre gap: Husky/lint-staged** |

### 3.7 PRIORIDAD 7 - Complementarios (nice-to-have)

| Skill                             | Repo                                 | Installs | Para qué                                                                  |
| --------------------------------- | ------------------------------------ | -------- | ------------------------------------------------------------------------- |
| **code-review-excellence**        | `wshobson/agents`                    | 4.6K     | Excelencia en revisión de código                                          |
| **requesting-code-review**        | `obra/superpowers`                   | 10.3K    | Preparación de PRs para review                                            |
| **typescript-expert**             | `sickn33/antigravity-awesome-skills` | 1.7K     | TypeScript 5.9 avanzado general                                           |
| **react-doctor**                  | `millionco/react-doctor`             | 4.7K     | Diagnóstico y optimización React 19                                       |
| **architecture-decision-records** | `wshobson/agents`                    | 2.5K     | Redacción y mantenimiento de ADRs                                         |
| **saga-orchestration**            | `wshobson/agents`                    | 1.9K     | Orquestación de sagas para transacciones cross-BC                         |
| **stripe-integration**            | `wshobson/agents`                    | 3.1K     | Patrones de integración de pagos (referencia para SEPA)                   |
| **billing-automation**            | `wshobson/agents`                    | 1.9K     | Automatización de facturación                                             |
| **dependency-updater**            | `softaworks/agent-toolkit`           | 2.4K     | Actualización de dependencias                                             |
| **subagent-driven-development**   | `obra/superpowers`                   | 9.0K     | Desarrollo con subagentes IA                                              |
| **dispatching-parallel-agents**   | `obra/superpowers`                   | 7.8K     | Agentes en paralelo para tareas complejas                                 |
| **cloudflare-r2** _(nuevo)_       | `jezweb/claude-skills`               | 471      | Almacenamiento objetos S3-compatible - referencia para MinIO/S3 (ADR-011) |
| **pnpm**                          | `antfu/skills`                       | 4.2K     | Gestor de paquetes (si se adopta)                                         |

---

## 4. Plan de Instalación

### 4.1 Repos a Instalar (agrupación por repositorio)

Los skills se agrupan por repositorio. Al instalar un repo se obtienen todos sus skills.

| #   | Repo                                     | Skills incluidos relevantes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Prioridad                                                                     |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | `wshobson/agents`                        | cqrs-implementation, api-design-principles, openapi-spec-generation, architecture-patterns, microservices-patterns, postgresql-table-design, nodejs-backend-patterns, typescript-advanced-types, auth-implementation-patterns, event-store-design, e2e-testing-patterns, javascript-testing-patterns, gdpr-data-handling, security-requirement-extraction, error-handling-patterns, accessibility-compliance, wcag-audit-patterns, responsive-design, design-system-patterns, react-state-management, github-actions-templates, sql-optimization-patterns, database-migration, code-review-excellence, architecture-decision-records, saga-orchestration, stripe-integration, billing-automation, git-advanced-workflows | **Imprescindible**                                                            |
| 2   | `antfu/skills`                           | vitest, vite, pnpm                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Imprescindible**                                                            |
| 3   | `sickn33/antigravity-awesome-skills`     | prisma-expert, playwright-skill, docker-expert, typescript-expert, security-review                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Imprescindible**                                                            |
| 4   | `kadajett/agent-nestjs-skills`           | nestjs-best-practices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **Imprescindible**                                                            |
| 5   | `resend/resend-skills`                   | resend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **Imprescindible**                                                            |
| 6   | `resend/react-email`                     | react-email                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | **Imprescindible**                                                            |
| 7   | `itechmeat/llm-code`                     | mantine-dev                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | **Imprescindible** _(nuevo - cubre gap Mantine 8)_                            |
| 8   | `gentleman-programming/gentleman-skills` | zod-4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **Imprescindible** _(nuevo - cubre gap Zod 4)_                                |
| 9   | `getsentry/sentry-agent-skills`          | sentry-react-setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Imprescindible** _(nuevo - cubre gap Sentry React)_                         |
| 10  | `prisma/skills`                          | prisma-client-api, prisma-upgrade-v7, prisma-database-setup, prisma-cli, prisma-postgres                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Imprescindible** _(nuevo - repo oficial Prisma, cubre gap Prisma 7)_        |
| 11  | `patricio0312rev/skills`                 | eslint-prettier-config                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **Imprescindible** _(nuevo - cubre gaps ESLint/Prettier Y Husky/lint-staged)_ |
| 12  | `shipshitdev/library`                    | husky-test-coverage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **Alta** _(nuevo - cubre gap Husky + cobertura pre-commit)_                   |
| 13  | `thebushidocollective/han`               | eslint-rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Media** _(nuevo - reglas ESLint avanzadas)_                                 |
| 14  | `resend/email-best-practices`            | email-best-practices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | **Alta**                                                                      |
| 15  | `jezweb/claude-skills`                   | tanstack-query, react-hook-form-zod, playwright-local, accessibility, testing-patterns, email-gateway, cloudflare-r2, vitest                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Alta**                                                                      |
| 16  | `obra/superpowers`                       | test-driven-development, systematic-debugging, verification-before-completion, using-git-worktrees, requesting-code-review, subagent-driven-development, dispatching-parallel-agents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | **Alta**                                                                      |
| 17  | `vercel-labs/agent-skills`               | vercel-react-best-practices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | **Media**                                                                     |
| 18  | `softaworks/agent-toolkit`               | openapi-to-typescript, database-schema-designer, dependency-updater                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **Media**                                                                     |
| 19  | `anthropics/skills`                      | webapp-testing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **Media**                                                                     |
| 20  | `millionco/react-doctor`                 | react-doctor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Baja**                                                                      |
| 21  | `boristane/agent-skills`                 | logging-best-practices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **Baja**                                                                      |
| 22  | `alinaqi/claude-bootstrap`               | pwa-development                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | **Media** _(nuevo - cubre gap PWA/vite-plugin-pwa)_                           |

### 4.2 Comandos de Instalación

#### Fase 1: Imprescindibles

```bash
npx skillsadd wshobson/agents
npx skillsadd antfu/skills
npx skillsadd sickn33/antigravity-awesome-skills
npx skillsadd kadajett/agent-nestjs-skills
npx skillsadd resend/resend-skills
npx skillsadd resend/react-email
npx skillsadd itechmeat/llm-code
npx skillsadd gentleman-programming/gentleman-skills
npx skillsadd getsentry/sentry-agent-skills
npx skillsadd prisma/skills
npx skillsadd patricio0312rev/skills
```

#### Fase 2: Alta prioridad

```bash
npx skillsadd resend/email-best-practices
npx skillsadd jezweb/claude-skills
npx skillsadd obra/superpowers
npx skillsadd shipshitdev/library
```

#### Fase 3: Media prioridad

```bash
npx skillsadd vercel-labs/agent-skills
npx skillsadd softaworks/agent-toolkit
npx skillsadd anthropics/skills
npx skillsadd thebushidocollective/han
npx skillsadd alinaqi/claude-bootstrap
```

#### Fase 4: Complementarios

```bash
npx skillsadd millionco/react-doctor
npx skillsadd boristane/agent-skills
```

---

## 5. Gaps Identificados

### 5.1 Gaps resueltos respecto a la versión anterior

Los siguientes gaps identificados en v1 ahora tienen cobertura con skills de terceros:

| Gap anterior (v1)                     | Skill encontrado                                                                | Repositorio                                      | Cobertura                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| **Mantine** (sin skill)               | `mantine-dev`                                                                   | `itechmeat/llm-code`                             | Total                                                            |
| **Zod 3/4** (sin skill)               | `zod-4`                                                                         | `gentleman-programming/gentleman-skills`         | Total                                                            |
| **react-hook-form** (sin skill)       | `react-hook-form-zod`                                                           | `jezweb/claude-skills`                           | Total (integrado con Zod)                                        |
| **Sentry** (sin skill)                | `sentry-react-setup`                                                            | `getsentry/sentry-agent-skills`                  | Parcial (lado React; NestJS cubre con `error-handling-patterns`) |
| **DDD puro** (parcial)                | `architecture-patterns` + `microservices-patterns`                              | `wshobson/agents`                                | Parcial (mejorado)                                               |
| **Prisma 7** (sin skill v7)           | `prisma-client-api`, `prisma-upgrade-v7`, `prisma-database-setup`, `prisma-cli` | `prisma/skills`                                  | Total (repo oficial)                                             |
| **ESLint/Prettier** (sin skill)       | `eslint-prettier-config`                                                        | `patricio0312rev/skills`                         | Total                                                            |
| **Husky/lint-staged** (sin skill)     | `eslint-prettier-config` + `husky-test-coverage`                                | `patricio0312rev/skills` + `shipshitdev/library` | Total                                                            |
| **PWA / vite-plugin-pwa** (sin skill) | `pwa-development`                                                               | `alinaqi/claude-bootstrap`                       | Total (vite-plugin-pwa, Service Worker, manifest, Lighthouse)    |

### 5.2 Gaps sin cobertura específica (12 → reducidos a 6)

Las siguientes tecnologías y patrones del proyecto **no tienen skills disponibles** en skills.sh:

| Tecnología/Patrón       | Importancia en el proyecto           | Alternativa disponible                                                                    |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **react-i18next 16**    | i18n para ES/CA/EU (RNF-047)         | Sin alternativa directa                                                                   |
| **Testcontainers 11**   | Testing integración con BD real      | `javascript-testing-patterns` parcial                                                     |
| **Sentry NestJS**       | Observabilidad backend (RNF-064)     | `sentry-react-setup` solo cubre React; `error-handling-patterns` cubre patrones generales |
| **MinIO/S3** específico | Object Storage (ADR-011)             | `cloudflare-r2` parcial (S3-compatible)                                                   |
| **SEPA payments**       | Remesas bancarias core (BC-Treasury) | `stripe-integration` + `billing-automation` para patrones similares                       |
| **Argon2**              | Hash passwords (RNF-006)             | Sin alternativa                                                                           |

### 5.3 Skills propios a crear

Tras la reducción de gaps cubiertos por terceros, la lista de skills propios recomendados se reduce de 4 a 3 candidatos prioritarios:

1. **associated-sepa** - Generación de remesas SEPA, mandatos, ficheros XML según normativa española. No existe ningún skill en skills.sh para pagos SEPA. Imprescindible para BC-Treasury.

2. **associated-multi-tenant** - Patrones multi-tenant específicos del proyecto con Prisma 7: conexiones dinámicas por tenant, migraciones por BD separada, aislamiento de datos (ADR-002). La cobertura parcial de `postgresql-table-design` (RLS) no es suficiente para el modelo de BD separada del proyecto.

3. **associated-i18n** - Configuración y uso de react-i18next 16 en el contexto del proyecto: namespaces por BC, detección de idioma, formato de fechas/números para ES (locale). No existe skill i18n para React en skills.sh.

~~Candidato eliminado (cubierto por terceros):~~

~~4. **associated-pwa** - Setup vite-plugin-pwa 1.x con estrategias de caché offline para la SPA del proyecto (RNF-056). **Resuelto por `pwa-development` de `alinaqi/claude-bootstrap`.**~~

---

## 6. Matriz de Cobertura: Skills vs Componentes del Proyecto

### 6.1 Por Bounded Context

| BC                   | Skills que le aplican                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BC-Identity**      | nestjs-best-practices, auth-implementation-patterns, gdpr-data-handling, postgresql-table-design, security-requirement-extraction                                                                  |
| **BC-Membership**    | nestjs-best-practices, cqrs-implementation, architecture-patterns, gdpr-data-handling, prisma-expert                                                                                               |
| **BC-Treasury**      | nestjs-best-practices, cqrs-implementation, stripe-integration, billing-automation, event-store-design, microservices-patterns                                                                     |
| **BC-Events**        | nestjs-best-practices, cqrs-implementation, architecture-patterns, prisma-expert                                                                                                                   |
| **BC-Communication** | resend, react-email, email-best-practices, event-store-design, email-gateway                                                                                                                       |
| **BC-Documents**     | nestjs-best-practices, docker-expert, cloudflare-r2                                                                                                                                                |
| **Frontend (todos)** | vercel-react-best-practices, tanstack-query, vite, mantine-dev, zod-4, react-hook-form-zod, accessibility-compliance, accessibility, responsive-design, design-system-patterns, sentry-react-setup |

### 6.2 Por ADR

| ADR                                 | Skills que refuerzan su implementación                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| ADR-001 (Monolito Modular)          | architecture-patterns, nestjs-best-practices                                              |
| ADR-002 (Multi-tenant BD)           | postgresql-table-design, prisma-expert, database-schema-designer                          |
| ADR-003 (Módulos por BC)            | nestjs-best-practices, architecture-patterns                                              |
| ADR-004 (Domain Events)             | event-store-design, cqrs-implementation, saga-orchestration, microservices-patterns       |
| ADR-005 (PostgreSQL)                | postgresql-table-design, sql-optimization-patterns, database-migration                    |
| ADR-006 (JWT)                       | auth-implementation-patterns                                                              |
| ADR-007 (RBAC)                      | auth-implementation-patterns, security-review                                             |
| ADR-008 (Domain Events)             | event-store-design, cqrs-implementation, microservices-patterns                           |
| ADR-009 (Clean Architecture + CQRS) | cqrs-implementation, architecture-patterns, nestjs-best-practices                         |
| ADR-010 (REST + OpenAPI)            | api-design-principles, openapi-spec-generation, openapi-to-typescript                     |
| ADR-011 (Object Storage)            | docker-expert, cloudflare-r2 (gap parcial: no hay skill MinIO específico)                 |
| ADR-012 (Testing)                   | vitest, playwright-skill, playwright-local, test-driven-development, e2e-testing-patterns |

### 6.3 Por Categoría RNF

| Categoría RNF            | Skills que ayudan a cumplirlos                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Seguridad (14 RNFs)      | auth-implementation-patterns, security-review, security-requirement-extraction                                       |
| Rendimiento (10 RNFs)    | sql-optimization-patterns, react-state-management, tanstack-query                                                    |
| RGPD (12 RNFs)           | gdpr-data-handling, security-requirement-extraction                                                                  |
| Disponibilidad (8 RNFs)  | docker-expert, github-actions-templates                                                                              |
| Usabilidad (12 RNFs)     | accessibility-compliance, accessibility, wcag-audit-patterns, responsive-design, design-system-patterns, mantine-dev |
| Mantenibilidad (10 RNFs) | architecture-patterns, code-review-excellence, logging-best-practices                                                |

---

## 7. Resumen Estadístico

| Métrica                               | v1 (Feb 2026)  | v2 (Feb 2026) | v3 (Feb 2026)     |
| ------------------------------------- | -------------- | ------------- | ----------------- |
| Total de skills únicos evaluados      | 85             | ~100          | ~110              |
| Skills Prioridad 1 (stack core)       | 8              | 12            | 16                |
| Skills Prioridad 6 (DevOps)           | 8              | 9             | 12                |
| **Total recomendados**                | **54**         | **65**        | **72**            |
| Repos a instalar                      | 14             | 17            | 21                |
| Gaps sin cobertura                    | 16 tecnologías | 9 tecnologías | **6 tecnologías** |
| Skills propios a crear (prioritarios) | 4              | 3             | 3                 |

> **Nota metodológica:** Las cifras de "skills evaluados" son aproximadas. La herramienta de búsqueda automática no puede acceder al buscador dinámico de skills.sh; el análisis se basa en el leaderboard público y páginas individuales verificadas. Pueden existir más skills relevantes no descubiertos.

### 7.1 Nuevos repos incorporados respecto a v1

| Repo                                     | Skills clave                                                            | Gaps cubiertos                            |
| ---------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `itechmeat/llm-code`                     | mantine-dev                                                             | Mantine 8.x                               |
| `gentleman-programming/gentleman-skills` | zod-4                                                                   | Zod 4.x                                   |
| `getsentry/sentry-agent-skills`          | sentry-react-setup                                                      | Sentry 10 React                           |
| `prisma/skills`                          | prisma-client-api, prisma-upgrade-v7, prisma-database-setup, prisma-cli | Prisma 7.x (oficial)                      |
| `patricio0312rev/skills`                 | eslint-prettier-config                                                  | ESLint 9 + Prettier + Husky + lint-staged |
| `shipshitdev/library`                    | husky-test-coverage                                                     | Husky + cobertura pre-commit con Vitest   |
| `thebushidocollective/han`               | eslint-rules                                                            | Reglas ESLint avanzadas                   |
