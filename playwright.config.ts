// Configuración de Playwright para tests E2E del proyecto Associated
import { defineConfig, devices } from '@playwright/test';

// Detecta si estamos en entorno CI
const isCI = !!process.env['CI'];

export default defineConfig({
  // Directorio donde se encuentran los tests E2E
  testDir: './e2e/tests',

  // Timeout global por test (30 segundos)
  timeout: 30_000,

  // Reintentos: 2 en CI, 0 en local para feedback rápido
  retries: isCI ? 2 : 0,

  // Paralelismo: desactivar en CI para estabilidad
  workers: isCI ? 1 : undefined,

  // Reporter adaptado al entorno
  reporter: isCI ? 'github' : 'list',

  use: {
    // URL base del servidor de desarrollo frontend
    baseURL: 'http://localhost:5173',

    // Captura de traza en primer reintento para debugging
    trace: 'on-first-retry',

    // Captura screenshot solo en caso de fallo
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // Chromium siempre activo (local y CI)
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox solo en CI para reducir tiempo de ejecución local
    ...(isCI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
        ]
      : []),
  ],
});
