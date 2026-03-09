import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Configuración de Vitest para tests de integración.
 * Estos tests requieren PostgreSQL corriendo (Docker Compose).
 * Ejecutar con: npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      '@prisma-main': path.resolve(__dirname, 'prisma/main/generated/client.ts'),
      '@prisma-tenant': path.resolve(__dirname, 'prisma/tenant/generated/client.ts'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@identity': path.resolve(__dirname, 'src/identity'),
    },
  },
  test: {
    // Entorno de ejecución
    environment: 'node',
    globals: true,

    // Solo archivos de integración (convención: *.integration-spec.ts)
    include: ['**/*.integration-spec.ts'],

    // Timeout más generoso para operaciones DDL
    testTimeout: 60_000,
    hookTimeout: 30_000,
  },
});
