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

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Language |
| Vite | 7.x | Build tool + dev server |
| Mantine | 8.x | UI component library |
| React Query (TanStack) | 5.x | Server state management |
| Zod | 4.x | Schema validation |
| react-hook-form | 7.x | Form management |
| react-router | 7.x | Routing (layout routes, guards) |
| react-i18next | 16.x | Internationalization |
| vite-plugin-pwa | 1.x | PWA / Service Worker (RNF-056) |
| Vitest | latest | Unit testing |
| React Testing Library | latest | Component testing |

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

| Element | Pattern | Example |
|---------|---------|---------|
| Component | PascalCase `.tsx` | `MemberList.tsx` |
| Hook | `use{Name}.ts` | `useMemberQuery.ts` |
| API hook | `use{Entity}{Action}.ts` | `useMemberCreate.ts` |
| Page | `{Name}Page.tsx` | `MemberListPage.tsx` |
| Zod schema | `{name}.schema.ts` | `register-member.schema.ts` |
| Translation file | `{namespace}.json` | `membership.json` |

## Testing

| Type | Tool | Location |
|------|------|----------|
| Unit | Vitest | `src/**/*.spec.ts` or `src/**/*.spec.tsx` |
| Component | Vitest + React Testing Library | `src/**/*.spec.tsx` |

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
