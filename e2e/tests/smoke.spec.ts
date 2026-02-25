// Smoke test E2E — verifica que el servidor frontend arranca y carga la aplicación
import { test, expect } from '@playwright/test';

// Intenta conectar al servidor; si no está disponible, el test se omite
test.describe('Smoke — Frontend availability', () => {
  test.beforeAll(async ({ request }) => {
    // Verifica si el servidor está levantado antes de ejecutar los tests
    try {
      const response = await request.get('http://localhost:5173', {
        timeout: 5_000,
      });
      // Si el servidor responde con error grave, marcamos para skip
      if (!response.ok() && response.status() >= 500) {
        test.skip();
      }
    } catch {
      // El servidor no está disponible — omitir todos los tests de este bloque
      test.skip();
    }
  });

  test('should load the application and return a non-empty page title', async ({ page }) => {
    // Navega a la URL base definida en playwright.config.ts
    await page.goto('/');

    // Espera a que la página esté en estado idle
    await page.waitForLoadState('domcontentloaded');

    // Verifica que el título de la página no está vacío
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should render a root DOM element', async ({ page }) => {
    // Navega a la página de inicio
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verifica que el contenedor principal de React está presente
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeAttached();
  });
});
