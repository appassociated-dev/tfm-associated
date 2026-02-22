## 6. Testing

### 6.1 Estrategia (ADR-012)

```
Pirámide: 70% Unit / 20% Integration / 10% E2E
CI Gates: Line ≥80%, Branch ≥70%
```

### 6.2 Frameworks por Tipo

| Tipo | Framework | Scope |
|------|-----------|-------|
| Unit (Domain) | Vitest | Aggregates, VOs, Domain Services |
| Unit (Application) | Vitest + mocks | Command/Query Handlers |
| Integration | Vitest + Supertest | Controllers, Repositories |
| Integration DB | Testcontainers | Repository con PostgreSQL real |
| E2E | Playwright | Flujos críticos de usuario |

**¿Por qué Vitest sobre Jest?**

| Criterio | Vitest | Jest |
|----------|--------|------|
| Velocidad | ✅ Muy rápido (ESBuild) | ⚠️ Lento con TypeScript |
| Configuración con Vite | ✅ Compartida | ❌ Duplicada |
| ESM nativo | ✅ Soporte completo | ⚠️ Problemas frecuentes |
| API | ✅ Compatible con Jest | ✅ Estándar |
| Watch mode | ✅ HMR instantáneo | ⚠️ Lento |

### 6.3 Configuración Testing

**Vitest (backend y frontend):**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // 'jsdom' para frontend
    include: ['**/*.spec.ts', '**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.dto.ts',
        '**/*.module.ts',
        '**/index.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
```

**Playwright (E2E):**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
});
```

### 6.4 Testcontainers para Integration Tests

```typescript
// tests/setup/database.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .start();
  
  process.env.DATABASE_URL = container.getConnectionUri();
});

afterAll(async () => {
  await container.stop();
});
```
