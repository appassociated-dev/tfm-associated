// Tests para fee-plan.api.ts — funciones de la capa API de planes de cuota.
// Valida URLs, métodos HTTP (GET/POST/PUT/PATCH), query params, parseo Zod,
// verificación de payloads, y manejo de errores.
// Usa MSW para interceptar peticiones a nivel de red.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import {
  buildFeePlan,
  buildFeePlanDetail,
  buildMemberTypeOption,
  resetFeePlanCounters,
} from '@/test/factories';

// Mock de auth.provider para el interceptor de httpClient
vi.mock('@/features/auth/context/auth.provider', () => ({
  getAccessToken: () => 'test-token',
  setTokens: () => {},
}));

// Importar DESPUÉS de vi.mock
import {
  getFeePlans,
  getFeePlan,
  createFeePlan,
  updateFeePlan,
  deactivateFeePlan,
  activateFeePlan,
  linkMemberTypes,
  getMemberTypes,
  getTemplates,
  importTemplate,
} from './fee-plan.api';

describe('Fee Plan API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeePlanCounters();
    localStorage.clear();
  });

  // ===========================================
  // getFeePlans()
  // ===========================================
  describe('getFeePlans()', () => {
    it('debería enviar GET a /v1/treasury/fee-plans sin params', async () => {
      // Arrange
      let capturedUrl: string | undefined;
      const plans = [buildFeePlan(), buildFeePlan()];

      server.use(
        http.get('*/v1/treasury/fee-plans', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const result = await getFeePlans();

      // Assert
      expect(capturedUrl).toBeDefined();
      expect(new URL(capturedUrl!).searchParams.toString()).toBe('');
      expect(result).toHaveLength(2);
    });

    it('debería enviar query param active=true cuando se filtra por activos', async () => {
      // Arrange
      let capturedSearchParams: URLSearchParams | undefined;
      const activePlans = [buildFeePlan({ active: true })];

      server.use(
        http.get('*/v1/treasury/fee-plans', ({ request }) => {
          capturedSearchParams = new URL(request.url).searchParams;
          return HttpResponse.json(apiResponse(activePlans));
        }),
      );

      // Act
      const result = await getFeePlans({ active: true });

      // Assert
      expect(capturedSearchParams?.get('active')).toBe('true');
      expect(result).toHaveLength(1);
      expect(result[0].active).toBe(true);
    });

    it('debería enviar query param active=false cuando se filtra por inactivos (triangulación)', async () => {
      // Arrange
      let capturedSearchParams: URLSearchParams | undefined;
      const inactivePlans = [buildFeePlan({ active: false })];

      server.use(
        http.get('*/v1/treasury/fee-plans', ({ request }) => {
          capturedSearchParams = new URL(request.url).searchParams;
          return HttpResponse.json(apiResponse(inactivePlans));
        }),
      );

      // Act
      const result = await getFeePlans({ active: false });

      // Assert
      expect(capturedSearchParams?.get('active')).toBe('false');
      expect(result[0].active).toBe(false);
    });

    it('debería parsear array de FeePlan con Zod', async () => {
      // Arrange
      const plans = [
        buildFeePlan({ type: 'RECURRING', frequency: 'MONTHLY', billingMonths: [1, 4, 7, 10] }),
        buildFeePlan({ type: 'ONE_TIME', frequency: null, billingMonths: [] }),
      ];

      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const result = await getFeePlans();

      // Assert
      expect(result[0].type).toBe('RECURRING');
      expect(result[0].frequency).toBe('MONTHLY');
      expect(result[0].billingMonths).toEqual([1, 4, 7, 10]);
      expect(result[1].type).toBe('ONE_TIME');
      expect(result[1].frequency).toBeNull();
    });

    it('debería devolver array vacío si no hay planes', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      const result = await getFeePlans();

      // Assert
      expect(result).toEqual([]);
    });

    it('debería propagar error 500', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(getFeePlans()).rejects.toThrow();
    });
  });

  // ===========================================
  // getFeePlan()
  // ===========================================
  describe('getFeePlan()', () => {
    it('debería enviar GET a /v1/treasury/fee-plans/:id', async () => {
      // Arrange
      let capturedId: string | undefined;
      const detail = buildFeePlanDetail();

      server.use(
        http.get('*/v1/treasury/fee-plans/:id', ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json(apiResponse(detail));
        }),
      );

      // Act
      const result = await getFeePlan('f0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedId).toBe('f0000001-0000-4000-8000-000000000001');
      expect(result).toEqual(detail);
    });

    it('debería parsear FeePlanDetail con vinculaciones (triangulación)', async () => {
      // Arrange
      const detail = buildFeePlanDetail({
        linkedMemberTypes: [
          {
            memberTypeId: 'c0000001-0000-4000-8000-000000000001',
            memberTypeName: 'Socio Ordinario',
            feePlanId: 'f0000001-0000-4000-8000-000000000001',
            isDefault: true,
            order: 0,
            active: true,
          },
          {
            memberTypeId: 'c0000001-0000-4000-8000-000000000002',
            memberTypeName: 'Socio Juvenil',
            feePlanId: 'f0000001-0000-4000-8000-000000000001',
            isDefault: false,
            order: 1,
            active: true,
          },
        ],
      });

      server.use(
        http.get('*/v1/treasury/fee-plans/:id', () => {
          return HttpResponse.json(apiResponse(detail));
        }),
      );

      // Act
      const result = await getFeePlan('f0000001-0000-4000-8000-000000000001');

      // Assert
      expect(result.linkedMemberTypes).toHaveLength(2);
      expect(result.linkedMemberTypes[0].isDefault).toBe(true);
      expect(result.linkedMemberTypes[1].memberTypeName).toBe('Socio Juvenil');
    });

    it('debería propagar error 404 si el plan no existe', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/:id', () => {
          return HttpResponse.json(
            { error: { code: 'FEE_PLAN_NOT_FOUND', message: 'Plan no encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(getFeePlan('nonexistent')).rejects.toThrow();
    });
  });

  // ===========================================
  // createFeePlan()
  // ===========================================
  describe('createFeePlan()', () => {
    it('debería enviar POST a /v1/treasury/fee-plans con payload correcto', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedMethod: string | undefined;
      const created = buildFeePlan({ code: 'CUOTA-ANUAL', name: 'Cuota Anual', amount: 12000 });

      server.use(
        http.post('*/v1/treasury/fee-plans', async ({ request }) => {
          capturedMethod = request.method;
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(created), { status: 201 });
        }),
      );

      // Act
      const input = {
        code: 'CUOTA-ANUAL',
        name: 'Cuota Anual',
        type: 'RECURRING' as const,
        amount: 12000,
        frequency: 'ANNUAL' as const,
        billingMonths: [1],
      };
      const result = await createFeePlan(input);

      // Assert
      expect(capturedMethod).toBe('POST');
      expect(capturedBody).toEqual(input);
      expect(result.code).toBe('CUOTA-ANUAL');
      expect(result.amount).toBe(12000);
    });

    it('debería enviar payload de plan ONE_TIME sin frequency (triangulación)', async () => {
      // Arrange
      let capturedBody: Record<string, unknown> | undefined;
      const created = buildFeePlan({ type: 'ONE_TIME', frequency: null });

      server.use(
        http.post('*/v1/treasury/fee-plans', async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(apiResponse(created), { status: 201 });
        }),
      );

      // Act
      await createFeePlan({
        code: 'INSCRIPCION',
        name: 'Cuota de Inscripción',
        type: 'ONE_TIME',
        amount: 5000,
      });

      // Assert
      expect(capturedBody?.type).toBe('ONE_TIME');
      expect(capturedBody?.code).toBe('INSCRIPCION');
    });

    it('debería propagar error 409 si el código ya existe', async () => {
      // Arrange
      server.use(
        http.post('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(
            { error: { code: 'DUPLICATE_CODE', message: 'El código ya existe', details: null } },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      await expect(
        createFeePlan({
          code: 'DUPLICADO',
          name: 'Plan Duplicado',
          type: 'RECURRING',
          amount: 1000,
        }),
      ).rejects.toThrow();
    });
  });

  // ===========================================
  // updateFeePlan()
  // ===========================================
  describe('updateFeePlan()', () => {
    it('debería enviar PUT a /v1/treasury/fee-plans/:id con payload', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedId: string | undefined;
      let capturedMethod: string | undefined;
      const updated = buildFeePlan({ name: 'Cuota Actualizada', amount: 15000 });

      server.use(
        http.put('*/v1/treasury/fee-plans/:id', async ({ request, params }) => {
          capturedMethod = request.method;
          capturedId = params.id as string;
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(updated));
        }),
      );

      // Act
      const input = { name: 'Cuota Actualizada', amount: 15000 };
      const result = await updateFeePlan('f0000001-0000-4000-8000-000000000001', input);

      // Assert
      expect(capturedMethod).toBe('PUT');
      expect(capturedId).toBe('f0000001-0000-4000-8000-000000000001');
      expect(capturedBody).toEqual(input);
      expect(result.name).toBe('Cuota Actualizada');
    });

    it('debería actualizar parcialmente solo los campos proporcionados (triangulación)', async () => {
      // Arrange
      let capturedBody: unknown;
      const updated = buildFeePlan({ amount: 20000 });

      server.use(
        http.put('*/v1/treasury/fee-plans/:id', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(updated));
        }),
      );

      // Act
      await updateFeePlan('f0000001-0000-4000-8000-000000000002', { amount: 20000 });

      // Assert
      expect(capturedBody).toEqual({ amount: 20000 });
    });

    it('debería propagar error 404', async () => {
      // Arrange
      server.use(
        http.put('*/v1/treasury/fee-plans/:id', () => {
          return HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'No encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(updateFeePlan('ghost', { name: 'x' })).rejects.toThrow();
    });
  });

  // ===========================================
  // deactivateFeePlan()
  // ===========================================
  describe('deactivateFeePlan()', () => {
    it('debería enviar PATCH a /v1/treasury/fee-plans/:id/deactivate', async () => {
      // Arrange
      let capturedMethod: string | undefined;
      let capturedId: string | undefined;

      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', ({ request, params }) => {
          capturedMethod = request.method;
          capturedId = params.id as string;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      await deactivateFeePlan('f0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedMethod).toBe('PATCH');
      expect(capturedId).toBe('f0000001-0000-4000-8000-000000000001');
    });

    it('debería completar sin error en respuesta 204 (triangulación con otro ID)', async () => {
      // Arrange
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act & Assert
      await expect(
        deactivateFeePlan('f47ac10b-58cc-4372-a567-000000000999'),
      ).resolves.toBeUndefined();
    });

    it('debería propagar error 409 si tiene suscripciones activas', async () => {
      // Arrange
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'HAS_ACTIVE_SUBSCRIPTIONS',
                message: 'Tiene suscripciones activas',
                details: null,
              },
            },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      await expect(deactivateFeePlan('fp-with-subs')).rejects.toThrow();
    });
  });

  // ===========================================
  // activateFeePlan()
  // ===========================================
  describe('activateFeePlan()', () => {
    it('debería enviar PATCH a /v1/treasury/fee-plans/:id/activate', async () => {
      // Arrange
      let capturedMethod: string | undefined;
      let capturedId: string | undefined;

      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/activate', ({ request, params }) => {
          capturedMethod = request.method;
          capturedId = params.id as string;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      await activateFeePlan('f0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedMethod).toBe('PATCH');
      expect(capturedId).toBe('f0000001-0000-4000-8000-000000000001');
    });

    it('debería completar sin error', async () => {
      // Arrange
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act & Assert
      await expect(
        activateFeePlan('f0000001-0000-4000-8000-000000000002'),
      ).resolves.toBeUndefined();
    });
  });

  // ===========================================
  // linkMemberTypes()
  // ===========================================
  describe('linkMemberTypes()', () => {
    it('debería enviar POST a /v1/treasury/fee-plans/:planId/link-member-types con links', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedPlanId: string | undefined;

      server.use(
        http.post(
          '*/v1/treasury/fee-plans/:planId/link-member-types',
          async ({ request, params }) => {
            capturedBody = await request.json();
            capturedPlanId = params.planId as string;
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      // Act
      const links = [
        { memberTypeId: 'c0000001-0000-4000-8000-000000000001', isDefault: true, order: 0 },
        { memberTypeId: 'c0000001-0000-4000-8000-000000000002', isDefault: false, order: 1 },
      ];
      await linkMemberTypes('f0000001-0000-4000-8000-000000000001', links);

      // Assert
      expect(capturedPlanId).toBe('f0000001-0000-4000-8000-000000000001');
      expect(capturedBody).toEqual({ links });
    });

    it('debería enviar array vacío para desvincular todos los tipos (triangulación)', async () => {
      // Arrange
      let capturedBody: unknown;

      server.use(
        http.post('*/v1/treasury/fee-plans/:planId/link-member-types', async ({ request }) => {
          capturedBody = await request.json();
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      await linkMemberTypes('f0000001-0000-4000-8000-000000000002', []);

      // Assert
      expect(capturedBody).toEqual({ links: [] });
    });

    it('debería propagar error 404 si el plan no existe', async () => {
      // Arrange
      server.use(
        http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
          return HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'Plan no encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(
        linkMemberTypes('ghost', [{ memberTypeId: 'mt-1', isDefault: true, order: 0 }]),
      ).rejects.toThrow();
    });
  });

  // ===========================================
  // getMemberTypes() (fee-plan context)
  // ===========================================
  describe('getMemberTypes()', () => {
    it('debería enviar GET a /v1/member-types', async () => {
      // Arrange
      let capturedUrl: string | undefined;
      const options = [buildMemberTypeOption(), buildMemberTypeOption()];

      server.use(
        http.get('*/v1/member-types', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse(options));
        }),
      );

      // Act
      const result = await getMemberTypes();

      // Assert
      expect(capturedUrl).toContain('/v1/member-types');
      expect(result).toHaveLength(2);
    });

    it('debería parsear MemberTypeOption con Zod (triangulación)', async () => {
      // Arrange
      const options = [
        buildMemberTypeOption({ code: 'ORDINARIO', name: 'Ordinario', active: true }),
        buildMemberTypeOption({ code: 'JUVENIL', name: 'Juvenil', active: false }),
      ];

      server.use(
        http.get('*/v1/member-types', () => {
          return HttpResponse.json(apiResponse(options));
        }),
      );

      // Act
      const result = await getMemberTypes();

      // Assert
      expect(result[0].code).toBe('ORDINARIO');
      expect(result[1].active).toBe(false);
    });
  });

  // ===========================================
  // getTemplates()
  // ===========================================
  describe('getTemplates()', () => {
    it('debería enviar GET a /v1/treasury/fee-plans/templates con query param', async () => {
      // Arrange
      let capturedSearchParams: URLSearchParams | undefined;
      const template = {
        collectivityType: 'SPORTS_CLUB',
        templates: [
          {
            code: 'CUOTA-ANUAL',
            name: 'Cuota Anual',
            type: 'RECURRING' as const,
            amount: 12000,
            frequency: 'ANNUAL' as const,
            billingMonths: [1],
          },
        ],
      };

      server.use(
        http.get('*/v1/treasury/fee-plans/templates', ({ request }) => {
          capturedSearchParams = new URL(request.url).searchParams;
          return HttpResponse.json(apiResponse(template));
        }),
      );

      // Act
      const result = await getTemplates('SPORTS_CLUB');

      // Assert
      expect(capturedSearchParams?.get('collectivityType')).toBe('SPORTS_CLUB');
      expect(result.collectivityType).toBe('SPORTS_CLUB');
      expect(result.templates).toHaveLength(1);
    });

    it('debería parsear plantilla con múltiples templates (triangulación con CULTURAL_CENTER)', async () => {
      // Arrange
      const template = {
        collectivityType: 'CULTURAL_CENTER',
        templates: [
          {
            code: 'CUOTA-MENSUAL',
            name: 'Cuota Mensual',
            type: 'RECURRING' as const,
            amount: 2000,
            frequency: 'MONTHLY' as const,
            billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
          {
            code: 'INSCRIPCION',
            name: 'Inscripción',
            type: 'ONE_TIME' as const,
            amount: 3000,
            frequency: null,
            billingMonths: [],
          },
        ],
      };

      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(template));
        }),
      );

      // Act
      const result = await getTemplates('CULTURAL_CENTER');

      // Assert
      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].frequency).toBe('MONTHLY');
      expect(result.templates[1].type).toBe('ONE_TIME');
    });

    it('debería propagar error del servidor', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(getTemplates('INVALID')).rejects.toThrow();
    });
  });

  // ===========================================
  // importTemplate()
  // ===========================================
  describe('importTemplate()', () => {
    it('debería enviar POST a /v1/treasury/fee-plans/import-template con collectivityType', async () => {
      // Arrange
      let capturedBody: unknown;
      const imported = [buildFeePlan(), buildFeePlan()];

      server.use(
        http.post('*/v1/treasury/fee-plans/import-template', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(imported));
        }),
      );

      // Act
      const result = await importTemplate('SPORTS_CLUB');

      // Assert
      expect(capturedBody).toEqual({ collectivityType: 'SPORTS_CLUB' });
      expect(result).toHaveLength(2);
    });

    it('debería parsear array de planes importados (triangulación)', async () => {
      // Arrange
      const imported = [
        buildFeePlan({ code: 'IMP-001', name: 'Plan Importado 1' }),
        buildFeePlan({ code: 'IMP-002', name: 'Plan Importado 2' }),
        buildFeePlan({ code: 'IMP-003', name: 'Plan Importado 3' }),
      ];

      server.use(
        http.post('*/v1/treasury/fee-plans/import-template', () => {
          return HttpResponse.json(apiResponse(imported));
        }),
      );

      // Act
      const result = await importTemplate('FEDERATION');

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].code).toBe('IMP-001');
      expect(result[2].code).toBe('IMP-003');
    });

    it('debería propagar error 409 si las plantillas ya fueron importadas', async () => {
      // Arrange
      server.use(
        http.post('*/v1/treasury/fee-plans/import-template', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'TEMPLATES_ALREADY_IMPORTED',
                message: 'Ya importadas',
                details: null,
              },
            },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      await expect(importTemplate('SPORTS_CLUB')).rejects.toThrow();
    });
  });
});
