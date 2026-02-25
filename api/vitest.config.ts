// Configuración de Vitest para tests unitarios del backend NestJS
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno Node.js para tests de backend
    environment: 'node',
    // Incluir solo tests unitarios (excluye integración)
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.spec.ts', 'test/**/*'],
    // Configuración de coverage con proveedor v8
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Excluir archivos que no requieren cobertura directa
      exclude: [
        'src/**/*.dto.ts',
        'src/**/*.module.ts',
        'src/**/index.ts',
        'src/**/*.config.ts',
        'src/**/migrations/**',
        'src/**/*.spec.ts',
        'src/**/*.integration.spec.ts',
        'src/main.ts',
      ],
      // Umbrales mínimos de cobertura del proyecto
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
