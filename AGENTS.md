# Repository Guidelines

## How to Use This Guide

- Start here for cross-project norms.
- Each component has an `AGENTS.md` file with specific guidelines (e.g., `api/AGENTS.md`, `web/AGENTS.md`).
- Component docs override this file when guidance conflicts.

## Rules

* Language:

  * Source code: English (EN).
  * Source comments: Spanish (ES).
  * Agent communication: Spanish (ES).
  * Context summarizations: always resume the conversation in Spanish (ES).

* File and folder names

  * File and folder names: snake_case or kebab-case
  * Allowed characters:
    * a-z
    * 0-9
    * Hyphen `-`
    * Underscore `_`
  * **CRITICAL**: Never use uppercase letters, spaces, or special characters.

* Coding and naming conventions

  * Classes: PascalCase (`MyClass`).
  * Variables/functions: camelCase (`myFunction`).
  * Constants: UPPER_CASE.

## Project Overview

Associated is a lightweight ERP for Spanish collectivities (associations, clubs, federations). It follows a Domain-Driven Design approach with a Modular Monolith architecture (ADR-001) organized into 6 Bounded Contexts:

| BC | Directory | Purpose |
|----|-----------|---------|
| BC-Identity | `api/src/identity/` | Users, tenants, memberships, roles |
| BC-Membership | `api/src/membership/` | Members, types, fiscal years, registration, cards |
| BC-Treasury | `api/src/treasury/` | Accounts, fee plans, SEPA remittances, transactions |
| BC-Events | `api/src/events/` | Events, social dinners, squads, matches |
| BC-Communication | `api/src/communication/` | Communications, templates, announcements |
| BC-Documents | `api/src/documents/` | Documents, categories, meeting minutes |

Multi-tenant by design: each tenant gets an isolated database (ADR-002).

## Tech Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS | 11.x |
| ORM | Prisma | 7.x |
| Database | PostgreSQL | 18.x |
| Frontend | React | 19.x |
| Build tool | Vite | 7.x |
| UI Kit | Mantine | 8.x |
| E2E Testing | Playwright | 1.58.x |
| Containers | Docker / Docker Compose | 29.x |
| Language | TypeScript | 5.9.x |

See each scope's `AGENTS.md` for detailed stack information.

## Project Structure

```
Associated/
├── api/                          # Backend NestJS (npm workspace)
│   ├── src/{bc}/                 # One module per Bounded Context
│   │   ├── application/          # Commands, Queries, Handlers
│   │   ├── domain/               # Aggregates, Value Objects, Events
│   │   └── infrastructure/       # Repositories, Prisma, Controllers
│   └── src/shared/               # Base DDD classes, shared VOs, ports
├── web/                          # Frontend React + Vite (npm workspace)
│   └── src/
│       ├── features/{feature}/   # Feature modules (page + components + hooks + api)
│       └── shared/               # Shared components, hooks, observability
├── e2e/                          # Playwright E2E tests
│   ├── tests/                    # Test files
│   ├── fixtures/                 # Test fixtures and data builders
│   └── page-objects/             # Page Object Model classes
├── spec/                         # Project specification (627 fragmented docs)
├── skills/               # AI agent skills
├── docker-compose.yml            # Development environment
├── .github/workflows/ci.yml     # CI/CD pipeline
└── package.json                  # Workspaces: ["api", "web"]
```

## Architecture Decisions

The following ADRs apply project-wide. Consult them before making architectural changes:

| ADR | Decision |
|-----|----------|
| ADR-001 | Modular Monolith architecture |
| ADR-002 | Multi-tenant with separate database per tenant |
| ADR-003 | One NestJS module per Bounded Context |
| ADR-004 | CQRS with @nestjs/cqrs |
| ADR-005 | Prisma as ORM |
| ADR-006 | JWT + Passport for authentication |
| ADR-007 | RBAC with Guards |
| ADR-008 | Domain Events for cross-BC communication |
| ADR-009 | Clean Architecture per module |
| ADR-010 | RESTful API design |
| ADR-011 | Testing strategy (unit + integration + E2E) |
| ADR-012 | Quality gates and CI pipeline |

> **NEVER** violate an ADR without first proposing a new ADR to supersede it.

## Infrastructure Rules

* Docker & Docker Compose:
  * ALWAYS use multi-stage builds for production images.
  * ALWAYS include health checks in Docker services.
  * NEVER commit secrets in `docker-compose.yml` or source code.

* CI/CD (GitHub Actions):
  * ALWAYS pass all CI quality gates before merge (RNF-058).
  * NEVER force-push to `main`.
  * NEVER skip pre-commit hooks (Husky).

* Secrets & environment:
  * ALWAYS use environment variables for secrets (`.env.example` as template).
  * NEVER hardcode credentials, tokens, or connection strings.

## Common Commands

```bash
# Docker environment
docker compose up -d              # Start all services
docker compose down -v            # Stop and remove volumes
docker compose logs -f api        # Follow API logs

# Linting (root — both workspaces)
npm run lint

# Workspaces
npm run -w api start:dev          # Start API in dev mode
npm run -w web dev                # Start frontend dev server
```

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)
| Skill | Description | URL |
|-------|-------------|-----|
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager` | Navigation, consultation, and alignment verification with the Associated project specification | [SKILL.md](skills/doc-spec-manager/SKILL.md) |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill | Examples |
|--------|-------|----------|
| Implementing a feature, UC, or US | `doc-spec-manager` | "Implement UC-001", "Build the tenant provisioning", "Add SEPA payment flow" |
| Writing domain code (Aggregates, Services, Events) | `doc-spec-manager` | "Create TenantProvisioningService", "Add MemberAccount aggregate" |
| Verifying architectural or NFR compliance | `doc-spec-manager` | "Does this comply with RNF-004?", "Check security requirements" |
| Creating or extending spec/ documents | `doc-spec-generator` | "Add a new US for batch imports", "Create RNF for caching", "Add UC-077" |
| Modifying files in spec/ | `doc-spec-generator` | "Update the BC-Treasury model", "Add N4RF39", "Fix the ADR-002 description" |
| Regenerating references/ after spec changes | `doc-spec-generator` | "Regenerate references", "Update fragmented docs" |

