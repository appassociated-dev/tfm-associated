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
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](.agents/skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager` | Navigation, consultation, and alignment verification with the Associated project specification. | [SKILL.md](.agents/skills/doc-spec-manager/SKILL.md) |
| `skill-creator` | Guide for creating effective skills that extend agent capabilities with specialized knowledge, workflows, or tool integrations. | [SKILL.md](.agents/skills/skill-creator/SKILL.md) |
| `architecture-patterns` | Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domain-Driven Design. | [SKILL.md](.agents/skills/architecture-patterns/SKILL.md) |
| `gdpr-data-handling` | Implement GDPR-compliant data handling with consent management, data subject rights, and privacy by design. | [SKILL.md](.agents/skills/gdpr-data-handling/SKILL.md) |
| `security-requirement-extraction` | Derive security requirements from threat models and business context; translate threats into actionable requirements and security test cases. | [SKILL.md](.agents/skills/security-requirement-extraction/SKILL.md) |
| `typescript-advanced-types` | Master TypeScript's advanced type system: generics, conditional types, mapped types, template literals, and utility types for type-safe applications. | [SKILL.md](.agents/skills/typescript-advanced-types/SKILL.md) |
| `error-handling-patterns` | Master error handling patterns including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. | [SKILL.md](.agents/skills/error-handling-patterns/SKILL.md) |
| `eslint-prettier-config` | Configure ESLint and Prettier for consistent code quality with TypeScript, React, and modern best practices. | [SKILL.md](.agents/skills/eslint-prettier-config/SKILL.md) |
| `test-driven-development` | Apply TDD methodology — write the test first, watch it fail, then write minimal code to pass — before writing any implementation code. | [SKILL.md](.agents/skills/test-driven-development/SKILL.md) |
| `verification-before-completion` | Require running verification commands and confirming output before claiming work is complete, fixed, or ready to commit/PR. | [SKILL.md](.agents/skills/verification-before-completion/SKILL.md) |

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
| Implementing any feature or bugfix (before writing code) | `test-driven-development` | "Implement UC-005", "Add FeePlan aggregate", "Fix member registration bug" |
| Claiming work is complete or creating a PR | `verification-before-completion` | "Mark UC-001 done", "Ready to commit", "Create PR for feature" |
| Designing or reviewing module / BC architecture | `architecture-patterns` | "Design BC-Treasury structure", "Review identity module layout" |
| Proposing or documenting a new ADR | `architecture-patterns` | "Propose ADR-013", "Document architecture decision for event bus" |
| Handling or encrypting personal data (IBAN, DNI, email) | `gdpr-data-handling` | "Encrypt IBAN field", "Implement right to erasure", "Store DNI securely" |
| Building consent or privacy-related flows | `gdpr-data-handling` | "Add communication consent", "Delete member data (RGPD)" |
| Implementing a security control or RNF | `security-requirement-extraction` | "Add rate limiting (RNF-011)", "Implement IP allowlist" |
| Designing shared TypeScript types or Value Object typings | `typescript-advanced-types` | "Create Result<T,E> type", "Type Command/Query generics", "VO type utilities" |
| Designing error hierarchy or global exception filters | `error-handling-patterns` | "Domain error classes", "NestJS exception filter", "Error boundary in React" |
| Setting up or modifying linting / formatting rules | `eslint-prettier-config` | "Configure ESLint for api/", "Add import-order rule", "Set up commitlint" |
| Creating a new project-specific skill | `skill-creator` | "Create associated-sepa skill", "New associated-ddd skill" |

