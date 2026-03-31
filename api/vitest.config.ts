import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
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
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration-spec.ts', '**/*.e2e-spec.ts'],

    // SWC + threads para evitar el fallback lento de esbuild con decorators
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // Inlinear dependencias que no son ESM puro
    server: {
      deps: {
        inline: ['@prisma/client'],
      },
    },

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
        '**/prisma/**/generated/**',
        '**/*.integration-spec.ts',
        'scripts/**',
        'src/main.ts',
        'src/**/infrastructure/**',
        'src/shared/infrastructure/**',
        'src/**/application/data/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
});
