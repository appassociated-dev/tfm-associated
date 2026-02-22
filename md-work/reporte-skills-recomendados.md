# Reporte de Skills Recomendados para Associated

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Fecha:** Febrero 2026
**Fuente:** [skills.sh](https://skills.sh)
**Consultas realizadas:** 36+ búsquedas por tecnología/patrón
**Skills evaluados:** 85 únicos

---

## 1. Contexto del Proyecto

### 1.1 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Backend | TypeScript + NestJS | TS 5.x, Nest 10.x |
| Frontend | React + TypeScript + Vite | React 18.x, Vite 5.x |
| UI Kit | Mantine | 7.x |
| Base de Datos | PostgreSQL + Prisma | PG 16.x, Prisma 5.x |
| Testing | Vitest + Playwright | Vitest 2.x, PW 1.42.x |
| Infraestructura | Docker + Docker Compose | 24.x |
| CI/CD | GitHub Actions + Codecov | - |
| Observabilidad | Sentry | 8.x |
| Email | Resend + React Email | - |
| Object Storage | MinIO (dev) / S3 (prod) | - |

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

| BC | Tipo | Descripción |
|----|------|-------------|
| BC-Identity | Generic | Autenticación, autorización, tenants |
| BC-Membership | Core | Gestión de socios, estados, antigüedad |
| BC-Treasury | Core | Cuotas, cobros, remesas SEPA, contabilidad |
| BC-Events | Core | Actividades, inscripciones, asistencia |
| BC-Communication | Supporting | Notificaciones, emails |
| BC-Documents | Supporting | Repositorio documental, actas |

### 1.4 Requisitos No Funcionales Clave

- **Seguridad:** 14 RNFs (JWT, RBAC, cifrado datos, aislamiento tenant)
- **RGPD:** 12 RNFs (datos personales cifrados, derecho al olvido, consentimientos)
- **Rendimiento:** 10 RNFs (tiempos respuesta, paginación, caché)
- **Testing:** Pirámide 70% Unit / 20% Integration / 10% E2E, cobertura ≥80% líneas

---

## 2. Metodología de Búsqueda

Se realizaron 36+ consultas en skills.sh cubriendo cada tecnología y patrón del stack:

**Tecnologías específicas:** nestjs, typescript, react, postgresql, prisma, vitest, playwright, docker, github actions, eslint, prettier, sentry, mantine, vite, react query, zod, jwt, s3

**Patrones y dominios:** DDD, clean architecture, CQRS, API REST, openapi, swagger, i18n, GDPR, monorepo, security, testing, code review, refactoring, performance, accessibility, pwa

---

## 3. Skills Recomendados por Prioridad

### 3.1 PRIORIDAD 1 -- Stack Core (instalar inmediatamente)

Skills que coinciden exactamente con las tecnologías principales del proyecto.

| Skill | Repo | Installs | Alineamiento con spec |
|-------|------|----------|----------------------|
| **nestjs-best-practices** | `kadajett/agent-nestjs-skills` | 4.3K | Backend NestJS 10.x: módulos, DI, guards, interceptors, pipes. Alineado con ADR-001, ADR-003, ADR-009 |
| **vitest** | `antfu/skills` | 5.5K | Framework de test principal del proyecto. Pirámide 70/20/10 (ADR-012) |
| **vite** | `antfu/skills` | 6.2K | Build tool del frontend React+Vite 5.x |
| **prisma-expert** | `sickn33/antigravity-awesome-skills` | 1.8K | ORM Prisma 5.x, multi-datasource para aislamiento multi-tenant (ADR-002, ADR-005) |
| **tanstack-query** | `jezweb/claude-skills` | 2.5K | @tanstack/react-query 5.x para data fetching y caché cliente |
| **cqrs-implementation** | `wshobson/agents` | 2.0K | Patrón CQRS con @nestjs/cqrs, Commands/Queries (ADR-009) |
| **resend** | `resend/resend-skills` | 1.8K | Servicio de email transaccional del proyecto (BC-Communication) |
| **react-email** | `resend/react-email` | 2.1K | Templates de email con React, complemento a Resend |

### 3.2 PRIORIDAD 2 -- Arquitectura y Patrones (muy recomendable)

Cubren los patrones arquitectónicos definidos en los 12 ADRs del proyecto.

| Skill | Repo | Installs | Alineamiento con spec |
|-------|------|----------|----------------------|
| **api-design-principles** | `wshobson/agents` | 6.1K | Diseño REST API + OpenAPI (ADR-010, @nestjs/swagger) |
| **openapi-spec-generation** | `wshobson/agents` | 2.3K | Generación automática Swagger/OpenAPI |
| **openapi-to-typescript** | `softaworks/agent-toolkit` | 2.3K | Generación de tipos TS desde spec OpenAPI |
| **architecture-patterns** | `wshobson/agents` | 4.9K | DDD, Clean Architecture, Monolito Modular (ADR-001, ADR-003) |
| **postgresql-table-design** | `wshobson/agents` | 4.4K | Diseño tablas PostgreSQL, esquemas multi-tenant (ADR-002, RNF-004) |
| **nodejs-backend-patterns** | `wshobson/agents` | 5.6K | Patrones Node.js aplicables a NestJS |
| **typescript-advanced-types** | `wshobson/agents` | 8.0K | Tipado avanzado para Value Objects, Aggregates, generics de dominio |
| **auth-implementation-patterns** | `wshobson/agents` | 2.5K | JWT + Passport + RBAC (ADR-006, ADR-007, RNF-001 a RNF-003) |
| **event-store-design** | `wshobson/agents` | 2.0K | Domain Events + Event Store (ADR-008), integración cross-BC |

### 3.3 PRIORIDAD 3 -- Testing y Calidad (recomendable)

Alineados con la estrategia de testing del ADR-012 y los quality gates del CI.

| Skill | Repo | Installs | Alineamiento con spec |
|-------|------|----------|----------------------|
| **playwright-skill** | `sickn33/antigravity-awesome-skills` | 1.7K | Testing E2E de flujos críticos (10% de la pirámide) |
| **test-driven-development** | `obra/superpowers` | 12.0K | Metodología TDD para lógica de dominio (Aggregates, VOs) |
| **webapp-testing** | `anthropics/skills` | 12.9K | Testing general de aplicaciones web |
| **e2e-testing-patterns** | `wshobson/agents` | 3.7K | Patrones E2E complementarios a Playwright |
| **javascript-testing-patterns** | `wshobson/agents` | 3.1K | Patrones de testing JS/TS con Vitest |
| **verification-before-completion** | `obra/superpowers` | 8.8K | Verificación sistemática antes de cerrar tareas |

### 3.4 PRIORIDAD 4 -- Seguridad y Cumplimiento Normativo (recomendable)

Directamente relacionados con los 14 RNFs de seguridad y 12 RNFs de RGPD.

| Skill | Repo | Installs | Alineamiento con RNFs |
|-------|------|----------|----------------------|
| **gdpr-data-handling** | `wshobson/agents` | 2.0K | RGPD: cifrado datos personales, derecho al olvido, consentimientos (RNF-025 a RNF-035) |
| **security-review** | `sickn33/antigravity-awesome-skills` | 1.8K | Revisión de seguridad del código fuente |
| **security-requirement-extraction** | `wshobson/agents` | 3.4K | Extracción y verificación de requisitos de seguridad |
| **error-handling-patterns** | `wshobson/agents` | 3.7K | Gestión de errores segura y consistente (RNF-042) |

### 3.5 PRIORIDAD 5 -- Frontend y UX (opcional pero útil)

Para la implementación del portal de socios (N10) y la UI con Mantine.

| Skill | Repo | Installs | Alineamiento con spec |
|-------|------|----------|----------------------|
| **vercel-react-best-practices** | `vercel-labs/agent-skills` | 155.9K | Mejores prácticas React generales |
| **accessibility-compliance** | `wshobson/agents` | 2.8K | WCAG AA obligatorio (RNF-046) |
| **wcag-audit-patterns** | `wshobson/agents` | 2.0K | Auditorías de accesibilidad web |
| **responsive-design** | `wshobson/agents` | 4.0K | Diseño responsive para PWA (RNF-056) |
| **design-system-patterns** | `wshobson/agents` | 3.0K | Patrones de sistema de diseño con Mantine |
| **react-state-management** | `wshobson/agents` | 2.6K | Gestión de estado (React Query + contextos) |
| **email-best-practices** | `resend/email-best-practices` | 2.5K | Buenas prácticas de email transaccional |

### 3.6 PRIORIDAD 6 -- DevOps y Workflow (opcional)

Para CI/CD y gestión del repositorio.

| Skill | Repo | Installs | Para qué |
|-------|------|----------|----------|
| **docker-expert** | `sickn33/antigravity-awesome-skills` | 3.2K | Docker + Docker Compose para entorno dev |
| **github-actions-templates** | `wshobson/agents` | 3.2K | Templates CI/CD GitHub Actions (RNF-058) |
| **sql-optimization-patterns** | `wshobson/agents` | 3.2K | Optimización queries PostgreSQL (RNF-015, RNF-018) |
| **database-migration** | `wshobson/agents` | 2.5K | Migraciones de BD con Prisma (RNF-066) |
| **database-schema-designer** | `softaworks/agent-toolkit` | 2.3K | Diseño de esquemas de BD |
| **systematic-debugging** | `obra/superpowers` | 14.7K | Debugging metódico y estructurado |
| **using-git-worktrees** | `obra/superpowers` | 8.4K | Git worktrees para desarrollo paralelo |
| **logging-best-practices** | `boristane/agent-skills` | 1.6K | Logging estructurado (complemento a Sentry) |

### 3.7 PRIORIDAD 7 -- Complementarios (nice-to-have)

| Skill | Repo | Installs | Para qué |
|-------|------|----------|----------|
| **code-review-excellence** | `wshobson/agents` | 4.6K | Excelencia en revisión de código |
| **requesting-code-review** | `obra/superpowers` | 10.3K | Preparación de PRs para review |
| **typescript-expert** | `sickn33/antigravity-awesome-skills` | 1.7K | TypeScript avanzado general |
| **react-doctor** | `millionco/react-doctor` | 4.6K | Diagnóstico y optimización React |
| **architecture-decision-records** | `wshobson/agents` | 2.5K | Redacción y mantenimiento de ADRs |
| **saga-orchestration** | `wshobson/agents` | 1.9K | Orquestación de sagas para transacciones cross-BC |
| **stripe-integration** | `wshobson/agents` | 3.0K | Patrones de integración de pagos (similar a SEPA) |
| **billing-automation** | `wshobson/agents` | 1.9K | Automatización de facturación |
| **dependency-updater** | `softaworks/agent-toolkit` | 2.4K | Actualización de dependencias |
| **subagent-driven-development** | `obra/superpowers` | 9.0K | Desarrollo con subagentes IA |
| **dispatching-parallel-agents** | `obra/superpowers` | 7.8K | Agentes en paralelo para tareas complejas |
| **pnpm** | `antfu/skills` | 4.2K | Gestor de paquetes (si se adopta) |

---

## 4. Plan de Instalación

### 4.1 Repos a Instalar (agrupación por repositorio)

Los skills se agrupan por repositorio. Al instalar un repo se obtienen todos sus skills.

| # | Repo | Skills incluidos relevantes | Prioridad |
|---|------|-----------------------------|-----------|
| 1 | `wshobson/agents` | cqrs-implementation, api-design-principles, openapi-spec-generation, architecture-patterns, postgresql-table-design, nodejs-backend-patterns, typescript-advanced-types, auth-implementation-patterns, event-store-design, e2e-testing-patterns, javascript-testing-patterns, gdpr-data-handling, security-requirement-extraction, error-handling-patterns, accessibility-compliance, wcag-audit-patterns, responsive-design, design-system-patterns, react-state-management, github-actions-templates, sql-optimization-patterns, database-migration, code-review-excellence, architecture-decision-records, saga-orchestration, stripe-integration, billing-automation | **Imprescindible** |
| 2 | `antfu/skills` | vitest, vite, pnpm | **Imprescindible** |
| 3 | `sickn33/antigravity-awesome-skills` | prisma-expert, playwright-skill, docker-expert, typescript-expert, security-review | **Imprescindible** |
| 4 | `kadajett/agent-nestjs-skills` | nestjs-best-practices | **Imprescindible** |
| 5 | `resend/resend-skills` | resend | **Imprescindible** |
| 6 | `resend/react-email` | react-email | **Imprescindible** |
| 7 | `resend/email-best-practices` | email-best-practices | **Alta** |
| 8 | `jezweb/claude-skills` | tanstack-query | **Alta** |
| 9 | `obra/superpowers` | test-driven-development, systematic-debugging, verification-before-completion, using-git-worktrees, requesting-code-review, subagent-driven-development, dispatching-parallel-agents | **Alta** |
| 10 | `vercel-labs/agent-skills` | vercel-react-best-practices | **Media** |
| 11 | `softaworks/agent-toolkit` | openapi-to-typescript, database-schema-designer, dependency-updater | **Media** |
| 12 | `anthropics/skills` | webapp-testing | **Media** |
| 13 | `boristane/agent-skills` | logging-best-practices | **Baja** |
| 14 | `millionco/react-doctor` | react-doctor | **Baja** |

### 4.2 Comandos de Instalación

#### Fase 1: Imprescindibles
```bash
npx skillsadd wshobson/agents
npx skillsadd antfu/skills
npx skillsadd sickn33/antigravity-awesome-skills
npx skillsadd kadajett/agent-nestjs-skills
npx skillsadd resend/resend-skills
npx skillsadd resend/react-email
```

#### Fase 2: Alta prioridad
```bash
npx skillsadd resend/email-best-practices
npx skillsadd jezweb/claude-skills
npx skillsadd obra/superpowers
```

#### Fase 3: Media prioridad
```bash
npx skillsadd vercel-labs/agent-skills
npx skillsadd softaworks/agent-toolkit
npx skillsadd anthropics/skills
```

#### Fase 4: Complementarios
```bash
npx skillsadd boristane/agent-skills
npx skillsadd millionco/react-doctor
```

---

## 5. Gaps Identificados

Las siguientes tecnologías y patrones del proyecto **no tienen skills disponibles** en skills.sh:

| Tecnología/Patrón | Importancia en el proyecto | Alternativa |
|--------------------|---------------------------|-------------|
| **Mantine 7.x** | UI Kit principal del frontend | `design-system-patterns` cubre parcialmente |
| **Zod 3.x** | Validación de schemas frontend | Sin alternativa directa |
| **react-i18next** | Internacionalización (RNF-047) | Sin alternativa |
| **react-hook-form** | Formularios avanzados | Sin alternativa |
| **Sentry** | Observabilidad principal (RNF-064) | `logging-best-practices` parcial |
| **SEPA payments** | Remesas bancarias core (BC-Treasury) | `stripe-integration` y `billing-automation` cubren patrones similares |
| **Testcontainers** | Testing integración con BD real | `javascript-testing-patterns` parcial |
| **Supertest** | Testing de controllers NestJS | `webapp-testing` parcial |
| **class-validator / class-transformer** | Validación DTOs NestJS | `nestjs-best-practices` parcial |
| **Multi-tenant patterns** | Patrón core del proyecto (ADR-002) | `postgresql-table-design` parcial |
| **DDD puro** | Diseño de dominio (Aggregates, VOs, Events) | `architecture-patterns` parcial |
| **MinIO/S3** | Object Storage (ADR-011) | Sin alternativa |
| **PWA (Workbox)** | Progressive Web App (RNF-056) | Sin alternativa |
| **Codecov** | Cobertura en CI (RNF-058) | Sin alternativa |
| **ESLint / Prettier** | Linting y formateo | Sin alternativa |
| **Husky / lint-staged** | Git hooks pre-commit | Sin alternativa |

### 5.1 Recomendación para los Gaps

Para los gaps más críticos (Mantine, SEPA, Multi-tenant, DDD), se recomienda crear skills propios usando el skill `skill-creator` ya instalado en el proyecto. Candidatos prioritarios:

1. **mantine-patterns** -- Convenciones de uso de Mantine 7.x alineadas con el design system del proyecto
2. **sepa-payments** -- Generación de remesas SEPA, mandatos, ficheros XML según normativa española
3. **multi-tenant-prisma** -- Patrones multi-tenant con Prisma: conexiones dinámicas, migraciones por tenant, aislamiento
4. **ddd-typescript** -- DDD con TypeScript: Aggregates, Value Objects, Domain Events, Repository pattern

---

## 6. Matriz de Cobertura: Skills vs Componentes del Proyecto

### 6.1 Por Bounded Context

| BC | Skills que le aplican |
|----|-----------------------|
| **BC-Identity** | nestjs-best-practices, auth-implementation-patterns, gdpr-data-handling, postgresql-table-design |
| **BC-Membership** | nestjs-best-practices, cqrs-implementation, architecture-patterns, gdpr-data-handling, prisma-expert |
| **BC-Treasury** | nestjs-best-practices, cqrs-implementation, stripe-integration, billing-automation, event-store-design |
| **BC-Events** | nestjs-best-practices, cqrs-implementation, architecture-patterns, prisma-expert |
| **BC-Communication** | resend, react-email, email-best-practices, event-store-design |
| **BC-Documents** | nestjs-best-practices, docker-expert (S3/MinIO) |
| **Frontend (todos)** | vercel-react-best-practices, tanstack-query, vite, accessibility-compliance, responsive-design, design-system-patterns |

### 6.2 Por ADR

| ADR | Skills que refuerzan su implementación |
|-----|----------------------------------------|
| ADR-001 (Monolito Modular) | architecture-patterns, nestjs-best-practices |
| ADR-002 (Multi-tenant BD) | postgresql-table-design, prisma-expert, database-schema-designer |
| ADR-003 (Módulos por BC) | nestjs-best-practices, architecture-patterns |
| ADR-004 (Domain Events) | event-store-design, cqrs-implementation, saga-orchestration |
| ADR-005 (PostgreSQL) | postgresql-table-design, sql-optimization-patterns, database-migration |
| ADR-006 (JWT) | auth-implementation-patterns |
| ADR-007 (RBAC) | auth-implementation-patterns, security-review |
| ADR-008 (Domain Events) | event-store-design, cqrs-implementation |
| ADR-009 (Clean Architecture + CQRS) | cqrs-implementation, architecture-patterns, nestjs-best-practices |
| ADR-010 (REST + OpenAPI) | api-design-principles, openapi-spec-generation, openapi-to-typescript |
| ADR-011 (Object Storage) | docker-expert (gap: no hay skill MinIO/S3) |
| ADR-012 (Testing) | vitest, playwright-skill, test-driven-development, e2e-testing-patterns |

### 6.3 Por Categoría RNF

| Categoría RNF | Skills que ayudan a cumplirlos |
|----------------|-------------------------------|
| Seguridad (14 RNFs) | auth-implementation-patterns, security-review, security-requirement-extraction |
| Rendimiento (10 RNFs) | sql-optimization-patterns, react-state-management, tanstack-query |
| RGPD (12 RNFs) | gdpr-data-handling |
| Disponibilidad (8 RNFs) | docker-expert, github-actions-templates |
| Usabilidad (12 RNFs) | accessibility-compliance, wcag-audit-patterns, responsive-design, design-system-patterns |
| Mantenibilidad (10 RNFs) | architecture-patterns, code-review-excellence, logging-best-practices |

---

## 7. Resumen Estadístico

| Métrica | Valor |
|---------|-------|
| Total de skills únicos evaluados | 85 |
| Skills Prioridad 1 (stack core) | 8 |
| Skills Prioridad 2 (arquitectura) | 9 |
| Skills Prioridad 3 (testing) | 6 |
| Skills Prioridad 4 (seguridad/RGPD) | 4 |
| Skills Prioridad 5 (frontend/UX) | 7 |
| Skills Prioridad 6 (DevOps) | 8 |
| Skills Prioridad 7 (complementarios) | 12 |
| **Total recomendados** | **54** |
| Repos a instalar | 14 |
| Gaps sin cobertura | 16 tecnologías |
| Consultas realizadas en skills.sh | 36+ |
