# Exploration: fase-0-scaffold

## Current State

The repository exists as a **documentation-only monorepo**. No source code has been written yet. All three workspace directories (`api/`, `web/`, `e2e/`) contain exclusively an `AGENTS.md` file with guidelines. The `api copy/`, `web copy/`, and `e2e copy/` directories likewise contain only agent instruction files (AGENT.md, CLAUDE.md) and are gitignored artifacts from agent tooling, not production code.

Key observations:
- **No `package.json` at root** — npm workspaces not configured
- **No `docker-compose.yml`** — development environment not defined
- **No `.github/workflows/`** — CI/CD pipeline missing entirely
- **No tooling config** — no `.editorconfig`, no `.prettierrc`, no `eslint.config.*`, no `.husky`
- **No `playwright.config.ts`** — E2E testing not configured
- **openspec/changes/fase-0-scaffold/** exists with a `specs/scaffold/` subdirectory (empty)
- **openspec/specs/** is empty — no delta specs written yet
- **spec/** directory is fully populated (627 spec fragments, ADRs, UCs, etc.)
- **doc/design/mvp/fase-0-scaffold.md** exists — detailed 12-step implementation plan ready
- **doc/design/mvp/fase-1/, fase-2/, fase-3/** exist — design docs for subsequent phases
- Git history shows the repo has been used exclusively for specification/documentation work so far

## Affected Areas

- `package.json` (root) — needs creation; workspace config `["api", "web"]`
- `api/` — entirely empty (needs full NestJS scaffold)
- `web/` — entirely empty (needs full React+Vite+Mantine scaffold)
- `e2e/` — entirely empty (needs Playwright config + basic structure)
- `docker-compose.yml` — needs creation (PostgreSQL 18, MinIO, Mailpit)
- `.github/workflows/ci.yml` — needs creation (lint, test, build jobs)
- `.editorconfig` — needs creation
- `.prettierrc` — needs creation
- `eslint.config.js` — needs creation (shared config for both workspaces)
- `.husky/` — needs creation (pre-commit hook with lint-staged)
- `playwright.config.ts` — needs creation
- `openspec/changes/fase-0-scaffold/specs/scaffold/` — empty, will receive delta specs

## What Exists vs. What Is Missing

### EXISTS (can be used as-is)
| Item | Location | Notes |
|------|----------|-------|
| Git repository | `.git/` | Active, with history |
| Root `.gitignore` | `.gitignore` | Minimal; needs node_modules, dist, coverage, .prisma entries |
| Specification docs | `spec/` | Complete — 627 fragments, ADRs, UCs, USs, RNFs |
| Design doc fase-0 | `doc/design/mvp/fase-0-scaffold.md` | Full 12-step plan, ready to implement |
| AGENTS guidelines | `api/AGENTS.md`, `web/AGENTS.md`, `e2e/AGENTS.md` | Detailed conventions documented |
| openspec config | `openspec/config.yaml` | SDD config ready |
| openspec change dir | `openspec/changes/fase-0-scaffold/` | Structure exists, specs empty |

### MISSING (must be built)
| Item | Priority | Design Doc Reference |
|------|----------|---------------------|
| `package.json` (root, workspaces) | Critical | Paso 1 |
| `.editorconfig` | High | Paso 1 |
| Root `.gitignore` update | Medium | Paso 1 |
| `api/package.json` + NestJS project | Critical | Paso 2 |
| `api/tsconfig.json` (strict mode) | Critical | Paso 2 |
| `api/src/app.module.ts` | Critical | Paso 2 |
| `api/src/main.ts` | Critical | Paso 2 |
| BC module skeletons (identity, membership, treasury, events, communication, documents) | Critical | Paso 2 |
| `api/src/shared/domain/` — DDD base classes | Critical | Paso 3 |
| `api/src/shared/domain/ports/` — ErrorReporter, EventTracker | High | Paso 3 & 5 |
| `api/src/shared/infrastructure/persistence/` — PrismaMainService, PrismaTenantService, OutboxProcessorService | Critical | Paso 4 |
| `api/src/shared/infrastructure/middleware/` — TenantMiddleware | Critical | Paso 4 |
| `api/src/shared/infrastructure/interceptors/` — ResponseEnvelopeInterceptor | High | Paso 2 |
| `api/src/shared/infrastructure/filters/` — DomainExceptionFilter | High | Paso 2 |
| `api/src/shared/infrastructure/guards/` — JwtAuthGuard, PermissionsGuard | High | Paso 2 |
| `api/src/shared/infrastructure/observability/` — Console/Sentry adapters + ObservabilityModule | High | Paso 5 |
| `api/prisma/main/schema.prisma` | Critical | Paso 6 |
| `api/prisma/tenant/schema.prisma` | Critical | Paso 6 |
| `api/vitest.config.ts` | High | Paso 9 |
| `api/.env.example` | High | Paso 8 |
| `web/package.json` + Vite/React project | Critical | Paso 7 |
| `web/src/app/` (app.tsx, router.tsx, providers.tsx, theme.ts) | Critical | Paso 7 |
| `web/src/features/` skeleton (auth, members, treasury, settings) | High | Paso 7 |
| `web/src/shared/api/http-client.ts` | High | Paso 7 |
| `web/src/shared/observability/` — ErrorBoundary + adapters | High | Paso 5 |
| `web/vitest.config.ts` | High | Paso 9 |
| `web/.env.example` | High | Paso 8 |
| `docker-compose.yml` | Critical | Paso 8 |
| `playwright.config.ts` | High | Paso 9 |
| `.prettierrc` | High | Paso 11 |
| `eslint.config.js` (shared root) | High | Paso 11 |
| `.husky/pre-commit` | Medium | Paso 11 |
| `lint-staged` config in root `package.json` | Medium | Paso 11 |
| `.github/workflows/ci.yml` | High | Paso 10 |

## Approaches

### 1. Implement from scratch following the 12-step design doc exactly
- **Pros**: Clean, no legacy debt, follows spec perfectly, enables clean git history per step
- **Cons**: Significant work volume (~12 passes, many files)
- **Effort**: High (but the design doc eliminates uncertainty)

### 2. Use NestJS CLI + Vite CLI to bootstrap, then adapt
- **Pros**: Faster initial setup, official scaffolding tools handle boilerplate
- **Cons**: Generated files need adaptation; some CLI defaults conflict with project conventions (e.g., Jest → Vitest, default Prisma schema → dual main/tenant)
- **Effort**: Medium

### 3. Hybrid — CLI for project init, manual for shared kernel and multi-tenant infra
- **Pros**: Fastest path to a running app skeleton; manual work focused on the high-value DDD/multi-tenant pieces
- **Cons**: Need to carefully remove/replace CLI defaults
- **Effort**: Medium-Low

## Recommendation

**Approach 3 (Hybrid)** is recommended:
1. Use `nest new api --package-manager npm --skip-git` for the NestJS project (gets `main.ts`, `app.module.ts`, tsconfig with decorators, base dependencies in one command)
2. Use `npm create vite@latest web -- --template react-ts` for the frontend
3. Then manually implement all custom pieces: shared kernel DDD classes, PrismaTenantService, dual Prisma schemas, ObservabilityModule, ResponseEnvelopeInterceptor, docker-compose, CI, tooling.

This avoids writing ~200 lines of boilerplate (tsconfig, package.json, main.ts) by hand while keeping full control over the architecture-critical parts.

**Critical order constraint**: The tasks MUST be executed in the order defined in the design doc (Paso 1–12). The Shared Kernel (Paso 3) must be in place before any BC module code, and Prisma schemas (Paso 6) must exist before Docker Compose can be validated end-to-end.

## Risks

- **Prisma 7 dual-schema generation**: Prisma 7 is ESM-only and requires `prisma.config.ts` instead of inline schema path in CLI. The `prisma-upgrade-v7` skill must be loaded before writing Prisma schemas.
- **NestJS CLI may install older NestJS version**: Verify `@nestjs/cli` installs NestJS 11.x, not 10.x. May need `--version` flag or post-install version pin.
- **PostgreSQL 18 availability**: Docker image `postgres:18-alpine` must exist; as of early 2026 it may still be in beta. Fallback: `postgres:17-alpine` with a version comment.
- **`api copy/`, `web copy/`, `e2e copy/` directories**: These exist with AGENT.md files and are gitignored via `.gitignore` patterns (`.agents/`). However, the `api copy/` naming (with space) is unusual. Confirm these are truly excluded from git before proceeding (`git status` confirms they show as untracked/ignored — verified).
- **Empty `.gitignore`**: Current `.gitignore` only covers agent artifacts. It needs `node_modules/`, `dist/`, `coverage/`, `.prisma/`, `*.env` patterns before installing npm dependencies.

## Ready for Proposal

**Yes** — the design doc is complete and authoritative, the codebase is a clean slate (no conflicting code), and all required decisions are already made. The sdd-propose sub-agent can proceed immediately using `doc/design/mvp/fase-0-scaffold.md` as the primary reference.

The orchestrator should communicate to the user:
> "El repositorio está en estado limpio (solo documentación). Todo el código del scaffold debe ser creado desde cero. Se recomienda proceder directamente a `sdd-propose` y luego `sdd-tasks` para descomponer los 12 pasos del diseño en tareas implementables."
