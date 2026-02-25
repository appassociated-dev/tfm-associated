// Configuración de Vitest para tests de integración — usa base de datos real via Testcontainers
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno Node.js para tests de backend
    environment: 'node',
    // Solo tests de integración
    include: ['src/**/*.integration.spec.ts', 'test/**/*.spec.ts'],
    // Timeout mayor para tests con contenedores Docker
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Ejecutar en serie para evitar conflictos de puerto/DB
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Coverage deshabilitado en integración (se mide en test:cov unitario)
    coverage: {
      enabled: false,
    },
  },
});
