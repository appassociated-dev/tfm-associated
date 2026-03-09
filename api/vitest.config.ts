import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno de ejecución
    environment: 'node',
    globals: true,

    // Patrones de archivos de test
    include: ['**/*.spec.ts', '**/*.test.ts'],

    // Cobertura de código
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 70,
      },
      exclude: [
        '**/*.dto.ts',
        '**/*.module.ts',
        '**/index.ts',
        '**/*.config.ts',
        '**/migrations/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
});
