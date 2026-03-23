import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // Entorno de ejecución para componentes React
    environment: 'jsdom',
    globals: true,

    // Archivo de setup para jsdom (testing-library, etc.)
    setupFiles: ['./src/test/setup.ts'],

    // Patrones de archivos de test
    include: ['**/*.spec.tsx', '**/*.test.tsx', '**/*.spec.ts', '**/*.test.ts'],

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
