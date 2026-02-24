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
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](.agents/skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager` | Navigation, consultation, and alignment verification with the Associated project specification. | [SKILL.md](.agents/skills/doc-spec-manager/SKILL.md) |
| `session-manager` | Manages work sessions with AI agents. Automatically documents significant work. | [SKILL.md](.agents/skills/session-manager/SKILL.md) |
| `changelog-updater` | Maintains the [Unreleased] section of CHANGELOG.md by grouping changes by work session. | [SKILL.md](.agents/skills/changelog-updater/SKILL.md) |
| `release-generator` | Closes a project version by generating all release documentation. | [SKILL.md](.agents/skills/release-generator/SKILL.md) |

### E2E Skills (Testing scope)
| Skill | Description | URL |
|-------|-------------|-----|
| `playwright-skill` | Complete browser automation with Playwright: write tests, fill forms, take screenshots, validate UX, test login flows, and check responsive design. | [SKILL.md](.agents/skills/playwright-skill/SKILL.md) |
| `e2e-testing-patterns` | Master E2E testing with Playwright: build reliable test suites, implement Page Object Model, debug flaky tests, and establish testing standards. | [SKILL.md](.agents/skills/e2e-testing-patterns/SKILL.md) |
| `webapp-testing` | Toolkit for testing local web applications with Playwright: verify frontend functionality, debug UI behavior, capture browser screenshots, and view browser logs. | [SKILL.md](.agents/skills/webapp-testing/SKILL.md) |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

> **IMPORTANT:** Conversations where technologies, frameworks, libraries, databases, patterns, or architectures are compared, recommended, or evaluated ARE technical decisions and MUST invoke `session-manager` BEFORE responding, even if they appear to be just informational questions. If the user asks "what do you recommend for X?", that is a technical debate.

| Action | Skill | Examples |
|--------|-------|----------|
| Implementing a feature, UC, or US | `doc-spec-manager` | "Implement UC-001", "Build the tenant provisioning", "Add SEPA payment flow" |
| Writing domain code (Aggregates, Services, Events) | `doc-spec-manager` | "Create TenantProvisioningService", "Add MemberAccount aggregate" |
| Verifying architectural or NFR compliance | `doc-spec-manager` | "Does this comply with RNF-004?", "Check security requirements" |
| Creating or extending spec/ documents | `doc-spec-generator` | "Add a new US for batch imports", "Create RNF for caching", "Add UC-077" |
| Modifying files in spec/ | `doc-spec-generator` | "Update the BC-Treasury model", "Add N4RF39", "Fix the ADR-002 description" |
| Regenerating references/ after spec changes | `doc-spec-generator` | "Regenerate references", "Update fragmented docs" |
| Business Logic Implementations, API or Contract Changes | `session-manager` | Login function, new endpoint, response structure change |
| Closing a work session | `changelog-updater` | End of session, final changelog block update |
| Completing significant work documented in session file | `changelog-updater` | After session-manager documents work, register summary in CHANGELOG.md |
| Creating a new work session (coordinated with session-manager) | `changelog-updater` | Start of any session where session-manager is also invoked |
| Critical Architectural or Technical Decisions, Technical Debates (Even if Not Yet Implemented) | `session-manager` | "Which framework should I use?", "REST or GraphQL?", comparing options |
| Database Structure Changes | `session-manager` | New table, migration, column change |
| Infrastructure Configurations | `session-manager` | Docker, CI/CD, nginx, environment variables |
| Integration of External Libraries or Services | `session-manager` | Adding Stripe, Chart.js, external SDK |
| Significant Refactorings, Critical Issues Resolved | `session-manager` | TypeScript migration, memory leak fix |
| Writing a Playwright test for a UC flow | `playwright-skill` | "Test member registration flow", "Test SEPA remittance process", "E2E for login" |
| Implementing Page Object Model classes | `playwright-skill` | "Create MemberListPage POM", "Add LoginPage page object", "Build SepaFormPage" |
| Designing E2E test strategy or suite structure for a BC | `e2e-testing-patterns` | "Design E2E strategy for treasury BC", "Plan UC-011 test coverage" |
| Debugging or stabilizing flaky E2E tests | `e2e-testing-patterns` | "Fix flaky registration test", "Debug SEPA flow timeout", "Stabilize multi-tenant test" |
| Verifying frontend functionality or UI behavior interactively | `webapp-testing` | "Verify member dashboard UI", "Check SEPA form behavior", "Validate responsive layout" |
| Capturing screenshots or browser logs for debugging | `webapp-testing` | "Capture screenshot of error state", "View browser logs for member creation" |
