# E2E Guidelines (End-to-End Testing — Playwright)

## How to Use This Guide

- This file contains rules specific to the `e2e/` directory (Playwright E2E tests).
- It **overrides** the root `AGENTS.md` when guidance conflicts.
- Read the root `AGENTS.md` first for cross-project norms (language, naming, skills).

---

## Critical Rules — Non-Negotiable

**ALWAYS:**

- Write one test per critical UC flow.
- Set up multi-tenant environment with isolated database per test suite.
- Use Page Object Model (POM) for all UI interactions.
- Clean up after each test (teardown tenant database).
- Configure retries (2) for flaky test mitigation.

**NEVER:**

- Hardcode test data — use data builders and fixtures.
- Create tests that depend on other tests' state.
- Share mutable state between test files.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Playwright | 1.58.x | Browser automation + assertions |
| Testcontainers | 11.x | Isolated database containers |
| TypeScript | 5.9.x | Language |

## Project Structure

```
e2e/
├── tests/                        # Test files
│   └── {uc-flow}.spec.ts         # One file per UC flow
├── fixtures/                     # Test fixtures and data builders
│   ├── tenant.fixture.ts         # Multi-tenant setup/teardown
│   └── data-builders/            # Builders for test data
├── page-objects/                 # Page Object Model classes
│   └── {Page}Page.ts             # One POM per page/section
└── playwright.config.ts          # Playwright configuration
```

## Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Test file | `{uc-flow}.spec.ts` | `member-registration.spec.ts` |
| Page Object | `{Page}Page.ts` | `MemberListPage.ts` |
| Fixture | `{name}.fixture.ts` | `tenant.fixture.ts` |
| Data builder | `{entity}.builder.ts` | `member.builder.ts` |

## Testing Patterns

### Multi-tenant setup

```typescript
// fixtures/tenant.fixture.ts
// 1. Create tenant database via Testcontainers
// 2. Run migrations
// 3. Seed minimal data (admin user, roles)
// 4. Return tenant context (URL, credentials)
// 5. Teardown: drop database after suite
```

### Data builders

- Use builder pattern to create test entities with sensible defaults.
- Override only the fields relevant to the test.
- Never share builders' output across test files.

### Cleanup

- Each test suite creates and destroys its own tenant.
- Use `afterAll` for database teardown.
- Use `afterEach` for UI state reset (logout, navigation).

## Commands

```bash
npx playwright test               # Run all E2E tests
npx playwright test --ui          # Open interactive UI mode
npx playwright codegen            # Generate tests via recording
npx playwright show-report        # View HTML test report
```

## QA Checklist

Before committing E2E tests, verify:

- [ ] Test covers one complete UC flow end-to-end.
- [ ] Multi-tenant setup and teardown are correct.
- [ ] Page Objects are used for all UI interactions.
- [ ] No hardcoded data — uses builders/fixtures.
- [ ] Test is independent (does not depend on other tests).
- [ ] Test passes with retries enabled.
- [ ] No lint errors.

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
