# Web Guidelines (Frontend — React + Mantine)

## How to Use This Guide

- This file contains rules specific to the `web/` workspace (React frontend).
- It **overrides** the root `AGENTS.md` when guidance conflicts.
- Read the root `AGENTS.md` first for cross-project norms (language, naming, skills).

---

## Critical Rules — Non-Negotiable

**ALWAYS:**

- Use functional components with TypeScript (no class components).
- Use React Query (TanStack Query 5) for server state — never manual `fetch` in components.
- Validate forms with Zod 4 + react-hook-form 7.
- Use Mantine 8 as the UI kit — do not mix with other component libraries.
- Ensure WCAG AA compliance in every component (RNF-046).
- Use skeleton screens during loading states (RNF-050).
- Support i18n via `react-i18next` for all user-visible text.

**NEVER:**

- Use global state for server data (use React Query instead).
- Use inline styles (use Mantine theme/styles system).
- Create components without keyboard support.

---

## Tech Stack

| Technology             | Version | Purpose                         |
| ---------------------- | ------- | ------------------------------- |
| React                  | 19.x    | UI framework                    |
| TypeScript             | 5.9.x   | Language                        |
| Vite                   | 7.x     | Build tool + dev server         |
| Mantine                | 8.x     | UI component library            |
| React Query (TanStack) | 5.x     | Server state management         |
| Zod                    | 4.x     | Schema validation               |
| react-hook-form        | 7.x     | Form management                 |
| react-router           | 7.x     | Routing (layout routes, guards) |
| react-i18next          | 16.x    | Internationalization            |
| vite-plugin-pwa        | 1.x     | PWA / Service Worker (RNF-056)  |
| Vitest                 | latest  | Unit testing                    |
| React Testing Library  | latest  | Component testing               |

## Project Structure

```
web/
├── src/
│   ├── features/                 # Feature modules
│   │   └── {feature}/
│   │       ├── {Feature}Page.tsx  # Page component
│   │       ├── components/        # Feature-specific components
│   │       ├── hooks/             # Feature-specific hooks
│   │       └── api/               # API hooks (useQuery/useMutation)
│   ├── shared/
│   │   ├── components/           # Reusable UI components
│   │   ├── hooks/                # Shared custom hooks
│   │   └── observability/        # Sentry, error boundaries
│   ├── routes/                   # Route definitions
│   ├── i18n/                     # Translation files
│   └── App.tsx
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Decision Trees

### New form

1. Define Zod 4 schema in `{name}.schema.ts`.
2. Create the form component with `react-hook-form` 7 + `zodResolver`.
3. Use Mantine 8 input components.
4. Wire submit to a `useMutation` hook.

### Server data fetching

1. Create an API hook: `use{Entity}{Action}.ts` using `useQuery` or `useMutation`.
2. Define the query key and fetch function.
3. Use the hook in the component — never call `fetch` directly.

### New feature module

1. Create directory: `web/src/features/{name}/`.
2. Add page component: `{Name}Page.tsx`.
3. Add route in `routes/`.
4. Create subdirectories: `components/`, `hooks/`, `api/` as needed.

## Naming Conventions

| Element          | Pattern                  | Example                     |
| ---------------- | ------------------------ | --------------------------- |
| Component        | PascalCase `.tsx`        | `MemberList.tsx`            |
| Hook             | `use{Name}.ts`           | `useMemberQuery.ts`         |
| API hook         | `use{Entity}{Action}.ts` | `useMemberCreate.ts`        |
| Page             | `{Name}Page.tsx`         | `MemberListPage.tsx`        |
| Zod schema       | `{name}.schema.ts`       | `register-member.schema.ts` |
| Translation file | `{namespace}.json`       | `membership.json`           |

## Testing

| Type      | Tool                           | Location                                  |
| --------- | ------------------------------ | ----------------------------------------- |
| Unit      | Vitest                         | `src/**/*.spec.ts` or `src/**/*.spec.tsx` |
| Component | Vitest + React Testing Library | `src/**/*.spec.tsx`                       |

- Test user interactions, not implementation details.
- Use `screen.getByRole` and accessible queries.
- Mock API calls with MSW or React Query test utilities.

## Commands

```bash
npm run dev                       # Start dev server
npm run test                      # Run unit/component tests
npm run build                     # Production build
npm run typecheck                 # TypeScript type checking
```

## QA Checklist

Before committing frontend code, verify:

- [ ] Component is accessible (keyboard, screen reader, contrast).
- [ ] Loading state uses skeleton screen.
- [ ] All user-visible text uses i18n keys.
- [ ] Forms validate with Zod schema.
- [ ] Server data flows through React Query.
- [ ] No inline styles — uses Mantine theme/styles.
- [ ] Component tests exist for new components.
- [ ] No lint errors (`npm run lint`).

---

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)

| Skill                | Description                                                                                                                                                           | URL                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](.agents/skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager`   | Navigation, consultation, and alignment verification with the Associated project specification.                                                                       | [SKILL.md](.agents/skills/doc-spec-manager/SKILL.md)   |
| `session-manager`    | Manages work sessions with AI agents. Automatically documents significant work.                                                                                       | [SKILL.md](.agents/skills/session-manager/SKILL.md)    |
| `changelog-updater`  | Maintains the [Unreleased] section of CHANGELOG.md by grouping changes by work session.                                                                               | [SKILL.md](.agents/skills/changelog-updater/SKILL.md)  |
| `release-generator`  | Closes a project version by generating all release documentation.                                                                                                     | [SKILL.md](.agents/skills/release-generator/SKILL.md)  |

### Web Skills (Frontend scope)

| Skill                   | Description                                                                                                               | URL                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `vite`                  | Vite build tool configuration, plugin API, path aliases, and Vite 7 optimizations for React + TypeScript projects.        | [SKILL.md](.agents/skills/vite/SKILL.md)                  |
| `mantine-dev`           | Mantine 8 UI library for React: 100+ components, hooks, theming, dark mode, CSS modules, and Vite/TypeScript setup.       | [SKILL.md](.agents/skills/mantine-dev/SKILL.md)           |
| `zod-4`                 | Zod 4 schema validation patterns, including breaking changes from v3 and integration with react-hook-form.                | [SKILL.md](.agents/skills/zod-4/SKILL.md)                 |
| `react-hook-form-zod`   | Build type-safe validated forms with React Hook Form 7 + Zod 4: `zodResolver`, `useFieldArray`, multi-step wizards.       | [SKILL.md](.agents/skills/react-hook-form-zod/SKILL.md)   |
| `sentry-react-setup`    | Setup Sentry in React apps: error monitoring, error boundaries, session replay, and browser tracing with `@sentry/react`. | [SKILL.md](.agents/skills/sentry-react-setup/SKILL.md)    |
| `openapi-to-typescript` | Convert OpenAPI 3.0 JSON/YAML to TypeScript interfaces and type guards for type-safe API clients.                         | [SKILL.md](.agents/skills/openapi-to-typescript/SKILL.md) |
| `vitest`                | Vitest unit testing framework: writing component and hook tests, mocking, coverage configuration, and fixtures.           | [SKILL.md](.agents/skills/vitest/SKILL.md)                |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

> **IMPORTANT:** Conversations where technologies, frameworks, libraries, databases, patterns, or architectures are compared, recommended, or evaluated ARE technical decisions and MUST invoke `session-manager` BEFORE responding, even if they appear to be just informational questions. If the user asks "what do you recommend for X?", that is a technical debate.

| Action                                                                                         | Skill                   | Examples                                                                                   |
| ---------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| Implementing a feature, UC, or US                                                              | `doc-spec-manager`      | "Implement UC-001", "Build the tenant provisioning", "Add SEPA payment flow"               |
| Writing domain code (Aggregates, Services, Events)                                             | `doc-spec-manager`      | "Create TenantProvisioningService", "Add MemberAccount aggregate"                          |
| Verifying architectural or NFR compliance                                                      | `doc-spec-manager`      | "Does this comply with RNF-004?", "Check security requirements"                            |
| Creating or extending spec/ documents                                                          | `doc-spec-generator`    | "Add a new US for batch imports", "Create RNF for caching", "Add UC-077"                   |
| Modifying files in spec/                                                                       | `doc-spec-generator`    | "Update the BC-Treasury model", "Add N4RF39", "Fix the ADR-002 description"                |
| Regenerating references/ after spec changes                                                    | `doc-spec-generator`    | "Regenerate references", "Update fragmented docs"                                          |
| Business Logic Implementations, API or Contract Changes                                        | `session-manager`       | Login function, new endpoint, response structure change                                    |
| Closing a work session                                                                         | `changelog-updater`     | End of session, final changelog block update                                               |
| Completing significant work documented in session file                                         | `changelog-updater`     | After session-manager documents work, register summary in CHANGELOG.md                     |
| Creating a new work session (coordinated with session-manager)                                 | `changelog-updater`     | Start of any session where session-manager is also invoked                                 |
| Critical Architectural or Technical Decisions, Technical Debates (Even if Not Yet Implemented) | `session-manager`       | "Which framework should I use?", "REST or GraphQL?", comparing options                     |
| Database Structure Changes                                                                     | `session-manager`       | New table, migration, column change                                                        |
| Infrastructure Configurations                                                                  | `session-manager`       | Docker, CI/CD, nginx, environment variables                                                |
| Integration of External Libraries or Services                                                  | `session-manager`       | Adding Stripe, Chart.js, external SDK                                                      |
| Significant Refactorings, Critical Issues Resolved                                             | `session-manager`       | TypeScript migration, memory leak fix                                                      |
| Configuring or modifying `vite.config.ts`                                                      | `vite`                  | "Add Vite plugin", "Configure path aliases", "Setup dev server proxy"                      |
| Debugging Vite build issues or optimizing bundle                                               | `vite`                  | "Fix Vite build error", "Optimize bundle size", "Configure code splitting"                 |
| Building or customizing a Mantine UI component                                                 | `mantine-dev`           | "Add Mantine DataTable", "Create responsive layout", "Use ActionIcon group"                |
| Configuring Mantine theme, colors, or dark mode                                                | `mantine-dev`           | "Extend Mantine theme", "Add custom color palette", "Configure dark mode toggle"           |
| Creating or updating a Zod validation schema                                                   | `zod-4`                 | "Create member registration schema", "Add Zod schema for fee form"                         |
| Migrating a Zod v3 schema to v4 or fixing v4 breaking changes                                  | `zod-4`                 | "Migrate Zod v3 to v4", "Fix Zod 4 breaking change in RHF resolver"                        |
| Building a form with React Hook Form + Zod validation                                          | `react-hook-form-zod`   | "Create member registration form", "Add fee payment form with validation"                  |
| Implementing advanced form patterns (multi-step, dynamic arrays)                               | `react-hook-form-zod`   | "Multi-step registration wizard", "Dynamic fee lines with useFieldArray"                   |
| Setting up or configuring Sentry error monitoring                                              | `sentry-react-setup`    | "Add Sentry to React app", "Configure error boundaries", "Setup DSN"                       |
| Enabling Sentry session replay or performance tracing                                          | `sentry-react-setup`    | "Enable session replay", "Add browser tracing", "Capture user context"                     |
| Generating TypeScript types from the backend OpenAPI spec                                      | `openapi-to-typescript` | "Generate types from api spec", "Sync API types to frontend", "Create typed member client" |
| Writing unit or component tests for frontend code                                              | `vitest`                | "Test MemberList component", "Unit test useMemberQuery hook", "Test form validation"       |
| Configuring Vitest coverage or test environment setup                                          | `vitest`                | "Configure coverage thresholds", "Setup jsdom test environment", "Add test alias"          |
