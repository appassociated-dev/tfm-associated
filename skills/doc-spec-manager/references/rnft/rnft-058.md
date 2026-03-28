> **Categoría:** 6. Mantenibilidad y Operaciones

### 6.2 RNFT-058: Testing con Vitest

**RNF Base:** RNF-058 (Cobertura de Tests Unitarios)

**Configuración Vitest:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.dto.ts',
        '**/*.module.ts',
        '**/index.ts',
        '**/*.config.ts',
        '**/migrations/**',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

**CI Quality Gates (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    fail_ci_if_error: true

- name: Check coverage thresholds
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 80%"
      exit 1
    fi
```

**Métricas CI:**

| Métrica         | Umbral Global | Umbral Diff |
| --------------- | ------------- | ----------- |
| Line coverage   | ≥ 80%         | ≥ 85%       |
| Branch coverage | ≥ 70%         | ≥ 75%       |
| Tests pasando   | 100%          | 100%        |
