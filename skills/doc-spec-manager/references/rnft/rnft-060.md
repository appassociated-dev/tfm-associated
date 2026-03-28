> **Categoría:** 6. Mantenibilidad y Operaciones

### 6.4 RNFT-060: Tests E2E con Playwright

**RNF Base:** RNF-060 (Tests End-to-End)

**Configuración Playwright:**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

**Test de flujo crítico:**

```typescript
// e2e/member-registration.spec.ts
test('Member registration complete', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navegar a members
  await page.click('text=Members');
  await page.click('text=New Member');

  // Rellenar formulario
  await page.fill('[name="name"]', 'Test');
  await page.fill('[name="surnames"]', 'User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="dni"]', '12345678A');

  // Guardar
  await page.click('text=Save');

  // Verificar
  await expect(page.locator('text=Member created successfully')).toBeVisible();
});
```

**Flujos críticos cubiertos:**

- Login/logout
- Alta de member
- Registro de pago
- Generación de remesa SEPA
