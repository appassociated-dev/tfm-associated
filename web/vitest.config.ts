// Configuración de Vitest para tests del frontend React con jsdom
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno jsdom para simular el DOM del navegador
    environment: 'jsdom',
    // Archivos de setup que se ejecutan antes de cada test
    setupFiles: [],
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    // Configuración de coverage con proveedor v8
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Excluir archivos sin lógica testeable
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Umbrales mínimos de cobertura del proyecto
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
