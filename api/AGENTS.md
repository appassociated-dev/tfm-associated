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
