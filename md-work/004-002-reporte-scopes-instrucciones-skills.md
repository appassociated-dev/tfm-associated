# Propuesta de Scopes, Instrucciones y Distribución de Skills

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Fecha:** Febrero 2026
**Basado en:** Filosofía de prowler-cloud/prowler
**Input:** Reporte de skills recomendados (003-002), especificación completa del proyecto, scaffold fase-0

---

## 1. Análisis de la Filosofía Prowler

### 1.1 Cómo lo hace Prowler

Prowler estructura su sistema de instrucciones para agentes IA en **tres capas**:

```
AGENTS.md (raíz)              → Normas globales del monorepo
    │
    ├── api/AGENTS.md          → Reglas específicas para Django REST API
    ├── ui/AGENTS.md           → Reglas específicas para Next.js UI
    ├── prowler/AGENTS.md      → Reglas específicas para SDK Python
    └── mcp_server/AGENTS.md   → Reglas específicas para servidor MCP
```

**Principios clave de Prowler:**

1. **Scopes = componentes desplegables** — Cada scope corresponde a un directorio raíz del monorepo con su propio stack, convenciones y pipeline.
2. **Jerarquía con override** — El AGENTS.md de componente sobreescribe al raíz cuando hay conflicto.
3. **Skills con metadata.scope** — Cada skill declara en qué scopes aplica (`[root, ui, api]`).
4. **Auto-invoke forzado** — Tablas imperativas ("ALWAYS invoke FIRST") en cada AGENTS.md.
5. **Separación genérico vs específico** — Skills portables vs skills propios del proyecto.
6. **Agnóstico de herramienta** — AGENTS.md es la fuente; CLAUDE.md, GEMINI.md son copias generadas.

### 1.2 Diferencias clave entre Prowler y Associated

| Aspecto | Prowler | Associated |
|---------|---------|------------|
| Tipo de repo | Monorepo multi-componente (API + UI + SDK + MCP) | Monolito modular DDD (API + Web en workspaces npm) |
| Scopes naturales | Por artefacto desplegable | Por **workspace/directorio** con stack diferenciado |
| Complejidad de dominio | Baja (herramienta de auditoría) | **Muy alta** (6 BCs, 221 RFs, 66 RNFs, 76 UCs) |
| Testing | Estándar | Multi-nivel con multi-tenant (Testcontainers) |
| Documentación | Mínima en repo | **627 archivos de spec fragmentada** — elemento diferencial |

---

## 2. Propuesta de Scopes para Associated

### 2.1 Justificación del diseño

A diferencia de Prowler, donde cada scope es un componente desplegable independiente con su propio stack, en Associated el monolito modular comparte backend y frontend como workspaces npm bajo una sola unidad lógica. Sin embargo, las **responsabilidades de cada agente** son radicalmente distintas según dónde trabaje:

- Un agente trabajando en el **backend** (`api/`) necesita saber de NestJS, Prisma, CQRS, Domain Events, multi-tenant, SEPA.
- Un agente trabajando en el **frontend** (`web/`) necesita saber de React, Mantine, React Query, formularios, accesibilidad.
- Un agente trabajando en **tests E2E** (`e2e/`) necesita saber de Playwright, Page Objects, fixtures multi-tenant.
- Un agente trabajando en **especificaciones** necesita saber de trazabilidad RF→US→UC, consistencia documental.
- Un agente trabajando en **infraestructura** (docker-compose, CI, scripts) se gestiona desde el root.

### 2.2 Alineamiento con el scaffold (fase-0)

El scaffold del proyecto define la siguiente estructura de directorios:

```
Associated/                    (raíz, package.json con workspaces: ["api", "web"])
├── api/                       ← workspace npm — Backend NestJS
├── web/                       ← workspace npm — Frontend React + Vite + Mantine
├── e2e/                       ← directorio Playwright (testDir: './e2e')
├── docker-compose.yml         ← entorno de desarrollo
├── .github/workflows/ci.yml   ← CI/CD GitHub Actions
├── spec/                      ← documentación de especificación
└── .agents/skills/            ← skills para agentes IA
```

**Decisión:** Los scopes deben coincidir con los directorios físicos del scaffold, siguiendo la filosofía Prowler de "un scope = un directorio con su propio contexto".

### 2.3 Scopes propuestos (4 scopes)

```
CLAUDE.md (root)                  → Normas globales + infraestructura (Docker, CI/CD, scripts)
    │
    ├── api/CLAUDE.md             → Backend: NestJS + Prisma + DDD + CQRS + Multi-tenant
    ├── web/CLAUDE.md             → Frontend: React + Mantine + Vite + PWA
    └── e2e/CLAUDE.md             → Testing E2E: Playwright + flujos cross-BC
```

> **Decisión sobre `infra/`:** No se crea un scope dedicado para infraestructura. Los archivos de infra están dispersos en la raíz (`docker-compose.yml`, `.github/workflows/`, `.env.example`, scripts) sin un directorio propio. Siguiendo la filosofía Prowler de que cada scope debe tener un directorio físico, las reglas de infraestructura se absorben en el scope `root`. El volumen de reglas (5 skills, un puñado de archivos) no justifica un scope separado.

> **Nota sobre spec/:** Los skills `doc-spec-manager` y `doc-spec-generator` se mantienen en scope `root` porque aplican transversalmente a cualquier tarea (implementación, consulta, extensión de spec). No se propone un scope `spec/` porque la documentación no tiene código propio, sino que guía al código de los otros scopes.

### 2.4 Detalle de cada scope

#### **`root`** — Normas globales + infraestructura

**¿Por qué existe?**
Es el punto de entrada. Define reglas que aplican a TODO el proyecto independientemente de dónde trabaje el agente. Al no existir un directorio `infra/`, también absorbe las reglas de Docker, CI/CD, scripts y observabilidad. Equivalente directo al `AGENTS.md` raíz de Prowler.

**¿Qué abarca?**
- Idiomas (código EN, comentarios ES, comunicación ES)
- Convenciones de nombrado (archivos kebab-case, clases PascalCase, etc.)
- Catálogo completo de skills (Generic + Associated-Specific)
- Tabla completa de Auto-invoke
- Estructura de alto nivel del proyecto (`api/`, `web/`, `e2e/`, `spec/`)
- Referencias a las ADRs y decisiones arquitectónicas que afectan a todo el proyecto
- **Docker y Docker Compose** (docker-compose.yml, servicios, volúmenes)
- **CI/CD con GitHub Actions** (pipelines, quality gates, RNF-058)
- **Observabilidad** (Sentry DSN, puertos ErrorReporter/EventTracker)
- **Scripts de utilidad** (provisión de tenants, migraciones, seeds)
- **Secrets y variables de entorno** (.env.example, seguridad)

**Correspondencia con Prowler:** `AGENTS.md` raíz + funcionalidad que en Prowler cubren skills como `prowler-ci`, `prowler-changelog`, `prowler-pr` distribuidos en root.

---

#### **`api/`** — Backend NestJS + DDD

**¿Por qué existe?**
El backend es donde reside la mayor complejidad del proyecto: 6 Bounded Contexts con 26+ Aggregates, CQRS, Domain Events, multi-tenant por BD separada, SEPA, RBAC. Es un workspace npm independiente (`api/`) con su propio `package.json`, `tsconfig.json` y stack. Un agente trabajando aquí necesita un contexto completamente diferente al del frontend.

**¿Qué abarca?**

| Área | Contenido del CLAUDE.md |
|------|------------------------|
| Stack | TypeScript 5.9.x, NestJS 11.x, Prisma 7.x, PostgreSQL 18.x |
| Arquitectura | Clean Architecture por capas (ADR-009), módulos por BC (ADR-003) |
| Patrones | CQRS (@nestjs/cqrs), Domain Events (ADR-008), Repository Pattern |
| Multi-tenant | BD separada por tenant (ADR-002), PrismaTenantService, TenantMiddleware |
| Seguridad | JWT + Passport (ADR-006), Guards RBAC (ADR-007), cifrado datos |
| Estructura | `src/{bc}/application/`, `domain/`, `infrastructure/` |
| Convenciones | Aggregates, Value Objects, DTOs, Commands/Queries, Handlers |
| Testing | Vitest (unit + integration), Supertest, Testcontainers |
| QA Checklist | Alineamiento con spec, invariantes, eventos, RNFs |

**Correspondencia con Prowler:** Equivalente al `api/AGENTS.md` de Prowler (Django REST → NestJS).

**Mapeo a BCs (estructura del scaffold):**

| Directorio | BC | Aggregates principales |
|------------|-----|----------------------|
| `api/src/identity/` | BC-Identity | User, Tenant, TenantMembership, Rol |
| `api/src/membership/` | BC-Membership | Member, MemberType, FiscalYear, RegistrationRequest, MemberCard, WaitingList, DisciplinaryCase |
| `api/src/treasury/` | BC-Treasury | MemberAccount, FeePlan, SepaRemittance, Transaction, PaymentLink, CashRegisterShift, AccountingCategory, AccountingYear |
| `api/src/events/` | BC-Events | Event, TipoEvento, SocialDinner, Squad, Match |
| `api/src/communication/` | BC-Communication | Communication, Template, Anuncio |
| `api/src/documents/` | BC-Documents | Document, Categoria, Acta |
| `api/src/shared/` | Transversal | Clases base DDD, Value Objects compartidos (MemberId, TenantId, Money, Email), puertos de observabilidad |

---

#### **`web/`** — Frontend React + Mantine

**¿Por qué existe?**
El frontend es un workspace npm independiente (`web/`) con su propio stack (React 19, Mantine 8, Vite 7, React Query 5), convenciones de componentes, formularios, routing, estado, y requisitos de accesibilidad (WCAG AA). Un agente aquí no necesita saber de CQRS ni Prisma.

**¿Qué abarca?**

| Área | Contenido del CLAUDE.md |
|------|------------------------|
| Stack | React 19.x, TypeScript 5.9.x, Vite 7.x, Mantine 8.x |
| State | React Query (server state), Zustand o Context (client state) |
| Formularios | react-hook-form 7.x + Zod 4.x para validación |
| Routing | react-router 7.x (paquete unificado), layout routes, guards |
| i18n | react-i18next 16.x |
| Accesibilidad | WCAG AA obligatorio (RNF-046), Mantine a11y |
| PWA | vite-plugin-pwa 1.x, Service Worker (RNF-056) |
| Estructura | `web/src/features/{feature}/`, `web/src/shared/components/`, `web/src/shared/hooks/` |
| Convenciones | Componentes funcionales, hooks custom, skeleton screens (RNF-050) |
| Testing | Vitest (unit), React Testing Library |

**Correspondencia con Prowler:** Equivalente al `ui/AGENTS.md` de Prowler (Next.js → React+Vite).

---

#### **`e2e/`** — Testing End-to-End

**¿Por qué existe?**
Los tests E2E son transversales (cruzan `web/` y `api/`), requieren un stack propio (Playwright), y deben validar flujos cross-BC completos. El scaffold define `e2e/` como directorio dedicado con su propio `playwright.config.ts`. En Prowler no tienen scope propio, pero Associated tiene 76 UCs con flujos complejos multi-tenant que justifican un scope dedicado.

**¿Qué abarca?**

| Área | Contenido del CLAUDE.md |
|------|------------------------|
| Stack | Playwright 1.58.x, Testcontainers 11.x |
| Scope | Flujos críticos cross-BC (inscripción, remesa SEPA, alta socio) |
| Multi-tenant | Setup/teardown de tenants de prueba con BD aislada |
| Convenciones | Page Objects, fixtures, data builders |
| CI | Ejecución en GitHub Actions post-build (job `e2e` depende de `backend` + `frontend`) |
| Quality gates | Según ADR-012 (10% pirámide) |

**Correspondencia con Prowler:** No tiene equivalente directo. Prowler incluye testing dentro de cada scope. En Associated la complejidad cross-BC justifica separarlo.

---

## 3. Contenido de las Instrucciones por Scope

### 3.1 Estructura estándar de cada CLAUDE.md

Siguiendo la filosofía Prowler, cada CLAUDE.md sigue un patrón consistente:

```markdown
# {Scope} Guidelines

> Skills: [`skill-1`](path) · [`skill-2`](path) · ...

## How to Use This Guide
(Relación con root y override rules)

## Auto-invoke Skills
(Tabla imperativa generada por scope)

---

## Critical Rules — Non-Negotiable
(Patrones ALWAYS / NEVER)

## Tech Stack
(Versiones exactas)

## Project Structure
(Árbol de directorios)

## Decision Trees
(Árboles de decisión para patrones comunes)

## Naming Conventions
(Específicas del scope)

## Commands
(Comandos copy-paste frecuentes)

## QA Checklist
(Antes de commit/PR)
```

### 3.2 Contenido específico por scope

#### `root` (CLAUDE.md)

```
CRITICAL RULES:
  - ALWAYS: Comunicación en español
  - ALWAYS: Código fuente en inglés
  - ALWAYS: Comentarios en español
  - ALWAYS: Archivos en kebab-case, sin mayúsculas
  - ALWAYS: Invocar doc-spec-manager antes de implementar cualquier UC/US
  - ALWAYS: Invocar doc-spec-generator antes de modificar spec/
  - NEVER: Editar references/ directamente (son generados)
  - NEVER: Violar una ADR sin proponer nueva ADR

INFRA RULES (absorbe lo que sería infra/):
  - ALWAYS: Docker multi-stage builds
  - ALWAYS: Health checks en servicios Docker
  - ALWAYS: Secrets vía variables de entorno (nunca en código)
  - ALWAYS: CI gates obligatorios antes de merge (RNF-058)
  - NEVER: Push --force a main
  - NEVER: Secrets en docker-compose.yml ni en código
  - NEVER: Skip pre-commit hooks (Husky)

TECH STACK OVERVIEW (solo resumen, detalles en cada scope)
PROJECT STRUCTURE (alto nivel: api/, web/, e2e/, spec/, .agents/)
AVAILABLE SKILLS (catálogo completo)
AUTO-INVOKE SKILLS (tabla completa para todos los scopes)

COMMANDS (infra):
  - docker compose up -d
  - docker compose down -v
  - docker compose logs -f api
  - npm run lint (raíz — ambos workspaces)
```

#### `api/` (api/CLAUDE.md)

```
CRITICAL RULES:
  - ALWAYS: Seguir estructura Clean Architecture por módulo (ADR-009)
  - ALWAYS: Un módulo NestJS por Bounded Context (ADR-003)
  - ALWAYS: Usar @nestjs/cqrs para Commands y Queries
  - ALWAYS: Emitir Domain Events documentados en el UC
  - ALWAYS: Aislar datos por tenant (BD separada, ADR-002)
  - ALWAYS: Cifrar datos personales (IBAN, DNI) (RNF-006)
  - ALWAYS: Validar DTOs con class-validator
  - ALWAYS: Guards para RBAC en cada endpoint (ADR-007)
  - NEVER: Queries SQL sin filtro de tenant
  - NEVER: Datos de un tenant en BD de otro
  - NEVER: Exponer datos personales sin autorización
  - NEVER: Crear Aggregate sin verificar spec

DECISION TREES:
  - ¿Crear nuevo endpoint? → Controller → DTO → Command/Query → Handler → Domain → Repository
  - ¿Nuevo Domain Event? → Verificar UC → Definir payload → Publisher → Subscribers
  - ¿Multi-tenant? → TenantMiddleware → PrismaTenantService → BD dinámica

NAMING:
  - Módulos: `{bc-name}.module.ts`
  - Commands: `{Action}{Entity}Command.ts` (ej: RegisterMemberCommand)
  - Queries: `Get{Entity}Query.ts` (ej: GetMemberByIdQuery)
  - Handlers: `{Command/Query}Handler.ts`
  - Aggregates: `{Entity}.ts` en domain/aggregates/
  - Value Objects: `{Name}.ts` en domain/value-objects/

COMMANDS:
  - npm run start:dev
  - npm run test:unit
  - npm run test:integration
  - npx prisma migrate dev
  - npx prisma generate
```

#### `web/` (web/CLAUDE.md)

```
CRITICAL RULES:
  - ALWAYS: Componentes funcionales con TypeScript
  - ALWAYS: React Query (TanStack Query 5) para estado servidor (nunca fetch manual en componentes)
  - ALWAYS: Validación de formularios con Zod 4 + react-hook-form 7
  - ALWAYS: Mantine 8 como UI kit (no mezclar con otros)
  - ALWAYS: WCAG AA en todo componente (RNF-046)
  - ALWAYS: Skeleton screens durante carga (RNF-050)
  - ALWAYS: Soporte i18n (react-i18next) en todo texto visible
  - NEVER: Estado global para datos del servidor (usar React Query)
  - NEVER: Estilos inline (usar Mantine theme/styles)
  - NEVER: Componentes sin soporte de teclado

DECISION TREES:
  - ¿Nuevo formulario? → react-hook-form 7 + Zod 4 schema + Mantine 8 inputs
  - ¿Datos del servidor? → useQuery/useMutation + API hook custom
  - ¿Nuevo feature? → web/src/features/{name}/ con page + components + hooks + api

NAMING:
  - Componentes: PascalCase `MemberList.tsx`
  - Hooks: `use{Name}.ts` (ej: useMemberQuery)
  - API hooks: `use{Entity}{Action}.ts` (ej: useMemberCreate)
  - Páginas: `{Name}Page.tsx`
  - Schemas Zod: `{name}.schema.ts`

COMMANDS:
  - npm run dev
  - npm run test
  - npm run build
  - npm run typecheck
```

#### `e2e/` (e2e/CLAUDE.md)

```
CRITICAL RULES:
  - ALWAYS: Un test por flujo de UC crítico
  - ALWAYS: Setup multi-tenant con BD aislada
  - ALWAYS: Page Object Model para interacciones UI
  - ALWAYS: Cleanup después de cada test (teardown tenant)
  - ALWAYS: Retries (2) para flaky tests
  - NEVER: Datos hardcodeados (usar data builders/fixtures)
  - NEVER: Tests dependientes entre sí

COMMANDS:
  - npx playwright test
  - npx playwright test --ui
  - npx playwright codegen
```

---

## 4. Distribución de Skills por Scope

### 4.1 Skills Existentes (ya en el proyecto)

| Skill | Scopes | Auto-invoke |
|-------|--------|-------------|
| `doc-spec-manager` | `root`, `api` | Implementar UC/US, escribir código de dominio, verificar RNF/ADR |
| `doc-spec-generator` | `root` | Crear/modificar documentos spec/, regenerar references/ |
| `skill-creator` | `root` | Crear nuevos skills |

### 4.2 Skills Recomendados de skills.sh — Distribución por scope

#### Scope: `root` (transversales + infraestructura)

| Skill | Repo | Justificación |
|-------|------|---------------|
| `doc-spec-manager` | (existente) | Consulta/alineamiento spec en cualquier tarea |
| `doc-spec-generator` | (existente) | Gestión documentación spec/ |
| `skill-creator` | (existente) | Creación de nuevos skills |
| `architecture-patterns` | `wshobson/agents` | DDD, Clean Architecture, Monolito Modular (ADR-001, ADR-003, ADR-009) |
| `architecture-decision-records` | `wshobson/agents` | Mantenimiento de ADRs |
| `gdpr-data-handling` | `wshobson/agents` | RGPD transversal (RNF-025 a RNF-035) |
| `security-requirement-extraction` | `wshobson/agents` | Requisitos de seguridad (14 RNFs) |
| `typescript-advanced-types` | `wshobson/agents` | TypeScript compartido backend+frontend |
| `error-handling-patterns` | `wshobson/agents` | Gestión errores transversal (RNF-042) |
| `code-review-excellence` | `wshobson/agents` | Revisión de código cross-scope |
| `git-advanced-workflows` | `wshobson/agents` | Workflows Git (GitHub Flow) |
| `eslint-prettier-config` | `patricio0312rev/skills` | Setup ESLint 9 + Prettier + Husky + lint-staged + commitlint |
| `husky-test-coverage` | `shipshitdev/library` | Husky pre-commit con umbrales de cobertura Vitest |
| `eslint-rules` | `thebushidocollective/han` | Reglas ESLint avanzadas, configuración y plugins |
| `test-driven-development` | `obra/superpowers` | TDD como metodología obligatoria (como Prowler) |
| `systematic-debugging` | `obra/superpowers` | Debugging metódico |
| `verification-before-completion` | `obra/superpowers` | Verificación pre-commit |
| `using-git-worktrees` | `obra/superpowers` | Git worktrees para desarrollo paralelo |
| `docker-expert` | `sickn33/antigravity-awesome-skills` | Docker + Docker Compose (absorbido de infra) |
| `github-actions-templates` | `wshobson/agents` | CI/CD pipelines (absorbido de infra) |
| `logging-best-practices` | `boristane/agent-skills` | Logging (complemento Sentry, absorbido de infra) |
| `database-schema-designer` | `softaworks/agent-toolkit` | Diseño BD producción (absorbido de infra) |
| `dependency-updater` | `softaworks/agent-toolkit` | Actualización deps (absorbido de infra) |

#### Scope: `api` (backend NestJS + DDD)

| Skill | Repo | Justificación |
|-------|------|---------------|
| `nestjs-best-practices` | `kadajett/agent-nestjs-skills` | Framework principal del backend |
| `cqrs-implementation` | `wshobson/agents` | CQRS con @nestjs/cqrs (ADR-009) |
| `event-store-design` | `wshobson/agents` | Domain Events (ADR-008) |
| `prisma-expert` | `sickn33/antigravity-awesome-skills` | ORM + multi-tenant, patrones generales (ADR-002, ADR-005) |
| `prisma-client-api` | `prisma/skills` | API Prisma Client 7.x: CRUD, filtros, transacciones, raw SQL (oficial) |
| `prisma-upgrade-v7` | `prisma/skills` | Guía migración v6→v7: ESM-only, `prisma.config.ts`, driver adapters (oficial) |
| `prisma-database-setup` | `prisma/skills` | Configuración Prisma + PostgreSQL (oficial) |
| `prisma-cli` | `prisma/skills` | Referencia comandos CLI Prisma 7.x (oficial) |
| `postgresql-table-design` | `wshobson/agents` | Diseño tablas multi-tenant (RNF-004) |
| `sql-optimization-patterns` | `wshobson/agents` | Optimización queries (RNF-015, RNF-018) |
| `api-design-principles` | `wshobson/agents` | REST API (ADR-010) |
| `openapi-spec-generation` | `wshobson/agents` | Swagger/OpenAPI (@nestjs/swagger) |
| `auth-implementation-patterns` | `wshobson/agents` | JWT + RBAC (ADR-006, ADR-007) |
| `nodejs-backend-patterns` | `wshobson/agents` | Patrones Node.js |
| `security-review` | `sickn33/antigravity-awesome-skills` | Seguridad del código backend |
| `resend` | `resend/resend-skills` | Email transaccional (BC-Communication) |
| `react-email` | `resend/react-email` | Templates email |
| `database-migration` | `wshobson/agents` | Migraciones Prisma |
| `vitest` | `antfu/skills` | Testing unitario + integración backend |
| `typescript-expert` | `sickn33/antigravity-awesome-skills` | TypeScript avanzado backend |
| `javascript-testing-patterns` | `wshobson/agents` | Patrones de test |
| `stripe-integration` | `wshobson/agents` | Patrones de pagos (similar a SEPA) |
| `billing-automation` | `wshobson/agents` | Automatización de facturación |
| `saga-orchestration` | `wshobson/agents` | Sagas cross-BC |

#### Scope: `web` (frontend React + Mantine)

| Skill | Repo | Justificación |
|-------|------|---------------|
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | React 19 best practices |
| `vite` | `antfu/skills` | Build tool Vite 7 |
| `tanstack-query` | `jezweb/claude-skills` | Data fetching + caché + offline mode |
| `mantine-dev` *(nuevo)* | `itechmeat/llm-code` | UI Kit Mantine 8.x — antes gap sin cobertura |
| `zod-4` *(nuevo)* | `gentleman-programming/gentleman-skills` | Validación schemas Zod 4.x |
| `react-hook-form-zod` *(nuevo)* | `jezweb/claude-skills` | Formularios RHF 7 + Zod 4, type-safe |
| `sentry-react-setup` *(nuevo)* | `getsentry/sentry-agent-skills` | Sentry 10 React: error boundaries, replay, tracing |
| `accessibility-compliance` | `wshobson/agents` | WCAG AA (RNF-046) |
| `accessibility` | `jezweb/claude-skills` | WCAG, aria, contraste — complementa anterior |
| `wcag-audit-patterns` | `wshobson/agents` | Auditorías a11y |
| `responsive-design` | `wshobson/agents` | Diseño responsive + PWA (RNF-056) |
| `pwa-development` *(nuevo)* | `alinaqi/claude-bootstrap` | vite-plugin-pwa, Service Worker, Workbox strategies, manifest, Lighthouse audit — **cubre RNF-056 completamente** |
| `design-system-patterns` | `wshobson/agents` | Sistema de diseño Mantine 8 |
| `react-state-management` | `wshobson/agents` | Gestión de estado |
| `openapi-to-typescript` | `softaworks/agent-toolkit` | Tipos TS desde API spec |
| `vitest` | `antfu/skills` | Testing unitario frontend |
| `email-best-practices` | `resend/email-best-practices` | Buenas prácticas email |

#### Scope: `e2e` (testing end-to-end)

| Skill | Repo | Justificación |
|-------|------|---------------|
| `playwright-skill` | `sickn33/antigravity-awesome-skills` | Framework E2E principal |
| `e2e-testing-patterns` | `wshobson/agents` | Patrones E2E |
| `webapp-testing` | `anthropics/skills` | Testing web general |

---

## 5. Auto-invoke Skills por Scope

### 5.1 Tabla Auto-invoke en `root` (CLAUDE.md)

| Action | Skill | Scope | Examples |
|--------|-------|-------|----------|
| Implementar feature, UC o US | `doc-spec-manager` | root, api | "Implement UC-001", "Build tenant provisioning" |
| Escribir código de dominio | `doc-spec-manager` | root, api | "Create TenantProvisioningService", "Add MemberAccount" |
| Verificar cumplimiento RNF/ADR | `doc-spec-manager` | root, api | "Does this comply with RNF-004?" |
| Crear/modificar documentos spec/ | `doc-spec-generator` | root | "Add US for batch imports", "Create RNF for caching" |
| Regenerar references/ | `doc-spec-generator` | root | "Regenerate references" |
| Diseñar modelo de datos | `prisma-expert` | api | "Create schema for Member", "Add migration" |
| Crear endpoint REST | `api-design-principles`, `openapi-spec-generation` | api | "Add GET /members", "Create SEPA endpoint" |
| Crear componente React | `vercel-react-best-practices` | web | "Build MemberList component" |
| Crear formulario | `tanstack-query` | web | "Add member registration form" |
| Verificar accesibilidad | `accessibility-compliance` | web | "Check a11y", "WCAG audit" |
| Escribir test E2E | `playwright-skill`, `e2e-testing-patterns` | e2e | "Test SEPA flow", "E2E for registration" |
| Escribir test unitario/integración | `vitest`, `javascript-testing-patterns` | api, web | "Test ChargeGenerator", "Test MemberList" |
| Configurar Docker/CI | `docker-expert`, `github-actions-templates` | root | "Add Docker health check", "Fix CI pipeline" |
| Configurar autenticación/RBAC | `auth-implementation-patterns` | api | "Add JWT guard", "Configure RBAC" |
| Trabajar con pagos/facturación | `stripe-integration`, `billing-automation` | api | "SEPA integration", "Generate charges" |
| Gestionar emails/notificaciones | `resend`, `react-email` | api | "Send welcome email", "Create email template" |
| Manejar datos personales/RGPD | `gdpr-data-handling` | root, api | "Encrypt IBAN", "Right to be forgotten" |
| Crear nuevo skill | `skill-creator` | root | "Create mantine skill", "New SEPA skill" |
| Actualizar dependencias | `dependency-updater` | root | "Update NestJS", "Bump React" |

### 5.2 Tabla Auto-invoke en `api/CLAUDE.md` (solo las de su scope)

| Action | Skill | Examples |
|--------|-------|----------|
| Implementing a UC/US | `doc-spec-manager` | "Implement UC-001" |
| Creating NestJS module/controller | `nestjs-best-practices` | "Create membership module" |
| Writing CQRS command/query | `cqrs-implementation` | "Add RegisterMemberCommand" |
| Designing database schema | `prisma-expert`, `postgresql-table-design` | "Create Member schema" |
| Creating REST endpoint | `api-design-principles`, `openapi-spec-generation` | "Add GET /members" |
| Implementing auth/RBAC | `auth-implementation-patterns` | "Add JWT guard" |
| Working with Domain Events | `event-store-design` | "Emit MemberRegistered" |
| Handling SEPA/payments | `stripe-integration`, `billing-automation` | "Generate SEPA XML" |
| Sending emails | `resend`, `react-email` | "Welcome email" |
| Writing backend tests | `vitest`, `javascript-testing-patterns` | "Test ChargeGenerator" |
| Handling GDPR data | `gdpr-data-handling` | "Encrypt personal data" |
| Reviewing security | `security-review` | "Review auth flow" |
| Optimizing SQL | `sql-optimization-patterns` | "Optimize member query" |

### 5.3 Tabla Auto-invoke en `web/CLAUDE.md`

| Action | Skill | Examples |
|--------|-------|----------|
| Creating React component | `vercel-react-best-practices` | "Build MemberList" |
| Building form | `tanstack-query` | "Add registration form" |
| Fetching server data | `tanstack-query` | "Load members list" |
| Designing UI layout | `design-system-patterns`, `responsive-design` | "Member dashboard" |
| Checking accessibility | `accessibility-compliance`, `wcag-audit-patterns` | "WCAG audit" |
| Writing frontend test | `vitest` | "Test MemberCard component" |
| Generating types from API | `openapi-to-typescript` | "Sync API types" |

### 5.4 Tabla Auto-invoke en `e2e/CLAUDE.md`

| Action | Skill | Examples |
|--------|-------|----------|
| Writing E2E test | `playwright-skill`, `e2e-testing-patterns` | "Test registration flow" |
| Testing cross-BC flow | `playwright-skill`, `webapp-testing` | "Test SEPA remittance" |

---

## 6. Skills Propios a Crear (Gaps)

Para cubrir los gaps identificados en el reporte de skills recomendados, se propone crear los siguientes skills propios (Associated-Specific):

| Skill propuesto | Scope | Prioridad | Justificación |
|-----------------|-------|-----------|---------------|
| `associated-sepa` | api | Alta | No existe skill SEPA. Normativa española, XML ISO 20022, mandatos CORE/B2B |
| `associated-multi-tenant` | api | Alta | Patrón core sin skill completo. BD separada por tenant, PrismaTenantService dinámico, aislamiento (ADR-002) |
| `associated-ddd` | api | Alta | DDD con TypeScript: Aggregates, VOs, invariantes de dominio, Domain Events específicos del proyecto |
| `associated-i18n` | web | Media | react-i18next 16.x: estructura de namespaces por BC, formato fechas/números ES, detección de idioma |
| `associated-sentry-nestjs` | api | Media | Observabilidad Sentry 10 lado NestJS (el lado React ya lo cubre `sentry-react-setup`): @sentry/nestjs, tracing multi-tenant, contexto de tenant en errores |

---

## 7. Resumen Visual

```
CLAUDE.md (root)
│
│  Skills: doc-spec-manager, doc-spec-generator, skill-creator
│  + architecture-patterns, gdpr-data-handling, typescript-advanced-types,
│    error-handling-patterns, test-driven-development, verification-before-completion,
│    systematic-debugging, using-git-worktrees, security-requirement-extraction,
│    architecture-decision-records, code-review-excellence, git-advanced-workflows,
│    docker-expert, github-actions-templates, logging-best-practices,
│    database-schema-designer, dependency-updater
│    + associated-sentry (propio)
│
│  Archivos de infra (sin directorio propio):
│    docker-compose.yml, .github/workflows/ci.yml, .env.example, scripts/
│
├── api/CLAUDE.md
│   │
│   │  Skills: nestjs-best-practices, cqrs-implementation, event-store-design,
│   │  prisma-expert, postgresql-table-design, sql-optimization-patterns,
│   │  api-design-principles, openapi-spec-generation, auth-implementation-patterns,
│   │  nodejs-backend-patterns, security-review, resend, react-email,
│   │  database-migration, vitest, typescript-expert, javascript-testing-patterns,
│   │  stripe-integration, billing-automation, saga-orchestration
│   │  + associated-multi-tenant, associated-ddd, associated-sepa (propios)
│   │
│   ├── src/identity/              → BC-Identity
│   ├── src/membership/            → BC-Membership
│   ├── src/treasury/              → BC-Treasury
│   ├── src/events/                → BC-Events
│   ├── src/communication/         → BC-Communication
│   ├── src/documents/             → BC-Documents
│   └── src/shared/                → Clases base DDD, VOs compartidos, puertos
│
├── web/CLAUDE.md
│   │
│   │  Skills: vercel-react-best-practices, vite, tanstack-query,
│   │  mantine-dev, zod-4, react-hook-form-zod, sentry-react-setup,
│   │  accessibility-compliance, accessibility, wcag-audit-patterns,
│   │  responsive-design, pwa-development, design-system-patterns,
│   │  react-state-management, openapi-to-typescript, vitest, email-best-practices
│   │  + associated-i18n (propios)
│   │
│   ├── src/features/{feature}/
│   ├── src/shared/components/
│   ├── src/shared/hooks/
│   └── src/shared/observability/
│
└── e2e/CLAUDE.md
    │
    │  Skills: playwright-skill, e2e-testing-patterns, webapp-testing
    │
    └── tests/
```

---

## 8. Comparativa Final: Prowler vs Associated

| Aspecto | Prowler | Associated (propuesta) |
|---------|---------|----------------------|
| Nº Scopes | 5 (root + 4 componentes) | **4** (root + 3 directorios) |
| Criterio de scope | Artefacto desplegable | Directorio físico con stack diferenciado |
| Infra scope | Distribuido en root | **Absorbido en root** (sin directorio propio) |
| Frontend scope | `ui/` | **`web/`** (alineado con scaffold) |
| Total skills genéricos | 12 | ~44 (de skills.sh, +4 nuevos) |
| Total skills específicos | 18 | 3 existentes + 6 propuestos |
| Auto-invoke entries (root) | ~15 | ~19 |
| Documentación spec | Mínima | 627 archivos fragmentados (diferencial) |
| Multi-agente | Sí (setup.sh) | Solo Claude (por ahora) |
| Sync automático | Sí (sync.sh) | Manual (propuesto automatizar) |
