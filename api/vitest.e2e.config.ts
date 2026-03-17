import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

/**
 * Configuración de Vitest para tests E2E (HTTP layer).
 * Estos tests levantan una app NestJS real con supertest y PostgreSQL.
 *
 * Usa SWC en lugar de esbuild para soportar emitDecoratorMetadata
 * (requerido por NestJS DI para resolver dependencias de constructores).
 *
 * Ejecutar con: npm run test:e2e -w api
 */
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

    // Solo archivos E2E (convención: *.e2e-spec.ts)
    include: ['**/*.e2e-spec.ts'],

    // Secuencial: los tests E2E comparten PostgreSQL y las operaciones DDL
    // (CREATE DATABASE, REVOKE, GRANT) provocan "tuple concurrently updated"
    // si se ejecutan en paralelo.
    fileParallelism: false,

    // Timeouts generosos: los tests E2E provisionan BDs reales
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
