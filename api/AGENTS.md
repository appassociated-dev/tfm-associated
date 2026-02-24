# API Guidelines (Backend — NestJS + DDD)

## How to Use This Guide

- This file contains rules specific to the `api/` workspace (NestJS backend).
- It **overrides** the root `AGENTS.md` when guidance conflicts.
- Read the root `AGENTS.md` first for cross-project norms (language, naming, skills).

---

## Critical Rules — Non-Negotiable

**ALWAYS:**

- Follow Clean Architecture per module (ADR-009): `application/` → `domain/` → `infrastructure/`.
- One NestJS module per Bounded Context (ADR-003).
- Use `@nestjs/cqrs` for Commands and Queries (ADR-004).
- Emit Domain Events documented in the corresponding UC (ADR-008).
- Isolate data per tenant — separate database per tenant (ADR-002).
- Encrypt personal data (IBAN, DNI) at rest (RNF-006).
- Validate DTOs with `class-validator`.
- Apply RBAC Guards on every endpoint (ADR-007).

**NEVER:**

- Execute SQL queries without tenant filtering.
- Expose data from one tenant to another.
- Expose personal data without proper authorization.
- Create an Aggregate without verifying the spec first.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.x | Application framework |
| Prisma | 7.x | ORM + migrations |
| PostgreSQL | 18.x | Database |
| TypeScript | 5.9.x | Language |
| argon2 | 0.44.x | Password hashing (RNF-006) |
| @nestjs/cqrs | latest | CQRS pattern |
| @nestjs/passport | latest | Authentication |
| @nestjs/swagger | latest | OpenAPI generation |
| Vitest | latest | Unit + integration testing |
| Supertest | latest | HTTP integration testing |
| Testcontainers | 11.x | Database containers for tests |

## Project Structure

```
api/
├── src/
│   ├── identity/                 # BC-Identity
│   │   ├── application/          # Commands, Queries, Handlers, DTOs
│   │   ├── domain/               # Aggregates, Value Objects, Domain Events
│   │   └── infrastructure/       # Repositories, Controllers, Prisma adapters
│   ├── membership/               # BC-Membership
│   ├── treasury/                 # BC-Treasury
│   ├── events/                   # BC-Events
│   ├── communication/            # BC-Communication
│   ├── documents/                # BC-Documents
│   └── shared/                   # Base DDD classes, shared VOs, ports
├── prisma/
│   └── schema.prisma
├── test/                         # Integration tests
├── package.json
└── tsconfig.json
```

### Bounded Contexts

| Directory | BC | Main Aggregates |
|-----------|-----|----------------|
| `src/identity/` | BC-Identity | User, Tenant, TenantMembership, Rol |
| `src/membership/` | BC-Membership | Member, MemberType, FiscalYear, RegistrationRequest, MemberCard, WaitingList, DisciplinaryCase |
| `src/treasury/` | BC-Treasury | MemberAccount, FeePlan, SepaRemittance, Transaction, PaymentLink, CashRegisterShift, AccountingCategory, AccountingYear |
| `src/events/` | BC-Events | Event, TipoEvento, SocialDinner, Squad, Match |
| `src/communication/` | BC-Communication | Communication, Template, Anuncio |
| `src/documents/` | BC-Documents | Document, Categoria, Acta |
| `src/shared/` | Transversal | Base DDD classes, shared Value Objects (MemberId, TenantId, Money, Email), observability ports |

## Decision Trees

### New endpoint

1. Define the DTO (request/response) with `class-validator` decorators.
2. Create a Command or Query in `application/`.
3. Implement the Handler (`@CommandHandler` / `@QueryHandler`).
4. Wire the Controller in `infrastructure/`.
5. Add Swagger decorators (`@ApiOperation`, `@ApiResponse`).
6. Apply RBAC Guard.

### New Domain Event

1. Verify the UC in the spec defines this event.
2. Define the event payload in `domain/events/`.
3. Publish via `EventBus` in the Aggregate or Handler.
4. Implement subscriber(s) in the target BC(s).

### Multi-tenant data access

1. Request passes through `TenantMiddleware` → extracts tenant from JWT.
2. `PrismaTenantService` resolves the tenant-specific database connection.
3. All repository calls use the tenant-scoped Prisma client.

## Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Module | `{bc-name}.module.ts` | `membership.module.ts` |
| Command | `{Action}{Entity}Command.ts` | `RegisterMemberCommand.ts` |
| Query | `Get{Entity}Query.ts` | `GetMemberByIdQuery.ts` |
| Command Handler | `{Command}Handler.ts` | `RegisterMemberCommandHandler.ts` |
| Query Handler | `{Query}Handler.ts` | `GetMemberByIdQueryHandler.ts` |
| Aggregate | `{Entity}.ts` in `domain/aggregates/` | `Member.ts` |
| Value Object | `{Name}.ts` in `domain/value-objects/` | `Money.ts` |
| Domain Event | `{Entity}{Action}Event.ts` | `MemberRegisteredEvent.ts` |
| Repository | `{Entity}Repository.ts` | `MemberRepository.ts` |
| Controller | `{entity}.controller.ts` | `member.controller.ts` |
| DTO | `{action}-{entity}.dto.ts` | `register-member.dto.ts` |

## Testing

| Type | Tool | Location |
|------|------|----------|
| Unit | Vitest | `src/{bc}/**/*.spec.ts` |
| Integration | Vitest + Supertest + Testcontainers | `test/` |

- Unit tests: test domain logic (Aggregates, Value Objects, Handlers) in isolation.
- Integration tests: test endpoints with real database (Testcontainers).

## Commands

```bash
npm run start:dev                 # Start in dev mode (watch)
npm run test:unit                 # Run unit tests
npm run test:integration          # Run integration tests
npx prisma migrate dev            # Run pending migrations
npx prisma generate               # Regenerate Prisma client
npx prisma studio                 # Open Prisma Studio
```

## QA Checklist

Before committing backend code, verify:

- [ ] Implementation aligns with the UC/US in the spec.
- [ ] Domain invariants are enforced in the Aggregate.
- [ ] Domain Events are emitted as documented.
- [ ] Tenant isolation is maintained (no cross-tenant data leaks).
- [ ] Personal data is encrypted (RNF-006).
- [ ] DTOs are validated with `class-validator`.
- [ ] RBAC Guards are applied to new endpoints.
- [ ] Unit tests cover domain logic.
- [ ] Integration tests cover the endpoint.
- [ ] No lint errors (`npm run lint`).

---

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)
| Skill | Description | URL |
|-------|-------------|-----|
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](.agents/skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager` | Navigation, consultation, and alignment verification with the Associated project specification. | [SKILL.md](.agents/skills/doc-spec-manager/SKILL.md) |

### API Skills (Backend scope)
| Skill | Description | URL |
|-------|-------------|-----|
| `nestjs-best-practices` | NestJS best practices and architecture patterns for building production-ready applications — modules, DI, security, performance. | [SKILL.md](.agents/skills/nestjs-best-practices/SKILL.md) |
| `cqrs-implementation` | Implement Command Query Responsibility Segregation for scalable architectures with @nestjs/cqrs. | [SKILL.md](.agents/skills/cqrs-implementation/SKILL.md) |
| `event-store-design` | Design and implement event stores for event-sourced systems; implement Domain Event persistence and publishing patterns. | [SKILL.md](.agents/skills/event-store-design/SKILL.md) |
| `prisma-expert` | Prisma ORM expert: schema design, migrations, query optimization, relations modeling, and multi-tenant patterns. | [SKILL.md](.agents/skills/prisma-expert/SKILL.md) |
| `prisma-client-api` | Prisma Client API reference: model queries, filters, operators, `$transaction`, and client configuration. | [SKILL.md](.agents/skills/prisma-client-api/SKILL.md) |
| `prisma-upgrade-v7` | Complete migration guide from Prisma ORM v6 to v7: ESM-only, `prisma.config.ts`, driver adapter required. | [SKILL.md](.agents/skills/prisma-upgrade-v7/SKILL.md) |
| `prisma-database-setup` | Configure Prisma with PostgreSQL: connection strings, SSL, connection pooling, multi-schema setup. | [SKILL.md](.agents/skills/prisma-database-setup/SKILL.md) |
| `prisma-cli` | Prisma CLI reference: `migrate dev`, `generate`, `db push`, `studio`, `introspect`, and all CLI options. | [SKILL.md](.agents/skills/prisma-cli/SKILL.md) |
| `postgresql-table-design` | Design PostgreSQL-specific schemas: data types, indexing, constraints, performance patterns, and advanced features. | [SKILL.md](.agents/skills/postgresql-table-design/SKILL.md) |
| `api-design-principles` | Master REST API design principles to build intuitive, scalable, and maintainable APIs (ADR-010). | [SKILL.md](.agents/skills/api-design-principles/SKILL.md) |
| `openapi-spec-generation` | Generate and maintain OpenAPI 3.1 specifications with `@nestjs/swagger` decorators and design-first patterns. | [SKILL.md](.agents/skills/openapi-spec-generation/SKILL.md) |
| `auth-implementation-patterns` | Authentication and authorization: JWT, Passport, session management, RBAC Guards (ADR-006, ADR-007). | [SKILL.md](.agents/skills/auth-implementation-patterns/SKILL.md) |
| `nodejs-backend-patterns` | Production-ready Node.js patterns: middleware, interceptors, pipes, exception filters, and API best practices. | [SKILL.md](.agents/skills/nodejs-backend-patterns/SKILL.md) |
| `resend` | Resend email platform integration: sending transactional email, managing audiences, and delivery patterns. | [SKILL.md](.agents/skills/resend/SKILL.md) |
| `react-email` | Build HTML email templates with React components: welcome emails, notifications, payment receipts. | [SKILL.md](.agents/skills/react-email/SKILL.md) |
| `vitest` | Vitest unit testing framework: writing tests, mocking, configuring coverage, test filtering, and fixtures. | [SKILL.md](.agents/skills/vitest/SKILL.md) |
| `javascript-testing-patterns` | Comprehensive testing strategies with Vitest: unit, integration, mocking, fixtures, and TDD/BDD workflows. | [SKILL.md](.agents/skills/javascript-testing-patterns/SKILL.md) |

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
| Creating or refactoring a NestJS module / controller | `nestjs-best-practices` | "Create membership module", "Refactor identity controller" |
| Writing a NestJS service or provider | `nestjs-best-practices` | "Add TenantProvisioningService", "Create payment webhook handler" |
| Writing a CQRS Command or Query with its Handler | `cqrs-implementation` | "Add RegisterMemberCommand", "Create GetMemberByIdQuery" |
| Designing the CQRS flow for a UC | `cqrs-implementation` | "Map UC-011 to commands and queries", "Design CQRS flow for fee charge" |
| Defining or emitting a Domain Event | `event-store-design` | "Define MemberRegisteredEvent", "Emit SepaRemittanceCreated" |
| Implementing a Domain Event subscriber | `event-store-design` | "Subscribe to MemberRegistered in treasury BC", "Handle cross-BC event" |
| Designing or modifying the Prisma schema | `prisma-expert` | "Add Member model", "Update FiscalYear schema", "New multi-tenant relation" |
| Optimizing a slow Prisma query | `prisma-expert` | "Optimize member list query", "Fix N+1 in transactions report" |
| Writing Prisma Client queries or repository methods | `prisma-client-api` | "findMany with filters", "Create with nested relations", "$transaction for SEPA" |
| Designing a new PostgreSQL table or multi-tenant schema | `postgresql-table-design` | "Design Member table with tenant isolation", "Add index on tenant_id + member_id" |
| Designing a new REST endpoint | `api-design-principles` | "Add POST /members", "Design SEPA remittance endpoint", "Paginate member list" |
| Adding Swagger decorators or generating OpenAPI spec | `openapi-spec-generation` | "Document GET /members", "Add OpenAPI for SEPA endpoint", "Generate openapi.json" |
| Implementing JWT authentication or RBAC Guards | `auth-implementation-patterns` | "Add JWT guard", "Configure Passport strategy", "Add role guard for treasurer" |
| Implementing middleware, interceptors, or pipes | `nodejs-backend-patterns` | "Add tenant middleware", "Create logging interceptor", "Global exception filter" |
| Setting up Prisma connection or configuring a tenant database | `prisma-database-setup` | "Configure tenant database", "Prisma + PG 18 SSL setup", "Connection pool tuning" |
| Running Prisma migrations or generating the client | `prisma-cli` | "prisma migrate dev", "prisma generate", "prisma db push --force-reset" |
| Upgrading Prisma to v7 or resolving v7 breaking changes | `prisma-upgrade-v7` | "Upgrade prisma-client generator", "Fix driver adapter required error", "ESM migration" |
| Sending transactional email via Resend | `resend` | "Send welcome email", "Send SEPA payment link", "Notification for due fee" |
| Creating or updating an email template | `react-email` | "Create welcome email template", "Design SEPA notification email" |
| Writing unit or integration tests for backend code | `vitest` | "Test Member aggregate invariants", "Integration test for membership endpoint" |
| Designing test strategy, mocks, or fixtures for a BC | `javascript-testing-patterns` | "Test strategy for treasury BC", "Mock PrismaService", "Stub Domain Events in tests" |
