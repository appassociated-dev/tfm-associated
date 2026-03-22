## 7. DevOps y CI/CD

### 7.1 Control de Versiones: Git + GitHub

**Estrategia de branching:** GitHub Flow (simplificado)

- `main`: producción, siempre deployable
- `feature/*`: desarrollo de features
- PRs obligatorias con review

### 7.2 CI: GitHub Actions

**Workflow principal (.github/workflows/ci.yml):**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18-alpine
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: ./api

      - name: Lint
        run: npm run lint
        working-directory: ./api

      - name: Unit Tests
        run: npm run test:unit -- --coverage
        working-directory: ./api

      - name: Integration Tests
        run: npm run test:integration
        working-directory: ./api
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Check Coverage
        uses: codecov/codecov-action@v4
        with:
          fail_ci_if_error: true
          flags: backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: ./web

      - name: Lint
        run: npm run lint
        working-directory: ./web

      - name: Type Check
        run: npm run typecheck
        working-directory: ./web

      - name: Unit Tests
        run: npm run test -- --coverage
        working-directory: ./web

      - name: Build
        run: npm run build
        working-directory: ./web

  e2e:
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E Tests
        run: npm run test:e2e
```

### 7.3 Quality Gates (RNF-058)

| Gate                | Umbral                  | Herramienta      |
| ------------------- | ----------------------- | ---------------- |
| Line Coverage       | ≥80%                    | Vitest + Codecov |
| Branch Coverage     | ≥70%                    | Vitest + Codecov |
| Diff Coverage (PRs) | ≥85% lines, ≥75% branch | Codecov          |
| Linting             | 0 errors                | ESLint           |
| Type Check          | 0 errors                | TypeScript       |
| Security Audit      | 0 critical/high         | npm audit        |
