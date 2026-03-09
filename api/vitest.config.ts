import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@prisma-main': path.resolve(__dirname, 'prisma/main/generated/client.ts'),
      '@prisma-tenant': path.resolve(__dirname, 'prisma/tenant/generated/client.ts'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@identity': path.resolve(__dirname, 'src/identity'),
      '@membership': path.resolve(__dirname, 'src/membership'),
      '@treasury': path.resolve(__dirname, 'src/treasury'),
    },
  },
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
