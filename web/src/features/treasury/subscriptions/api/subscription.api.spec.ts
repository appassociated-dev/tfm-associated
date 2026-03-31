// Tests para subscription.api.ts — funciones de la capa API de suscripciones.
// Valida URLs con parámetros compuestos (memberAccountId + subscriptionId),
// métodos HTTP (GET/POST/PUT/PATCH), parseo Zod, y manejo de errores.
// Usa MSW para interceptar peticiones a nivel de red.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import type { FeeSubscription, MemberSubscriptionsResponse } from '../schemas/subscription.schemas';

// Mock de auth.provider para el interceptor de httpClient
vi.mock('@/features/auth/context/auth.provider', () => ({
  getAccessToken: () => 'test-token',
  setTokens: () => {},
}));

// Importar DESPUÉS de vi.mock
import {
  getSubscriptions,
  createSubscription,
  changePlan,
  updateDiscount,
  closeSubscription,
} from './subscription.api';

// === Factory auxiliar local para suscripciones ===
// No existe factory global de suscripciones — creamos helpers locales deterministas.

let subCounter = 0;

function deterministicUuid(prefix: string, counter: number): string {
  const hex = counter.toString(16).padStart(12, '0');
  const pfx = prefix.padEnd(8, '0').slice(0, 8);
  return `${pfx}-0000-4000-8000-${hex}`;
}

function buildSubscription(overrides?: Partial<FeeSubscription>): FeeSubscription {
  subCounter++;
  return {
    id: deterministicUuid('a0000001', subCounter),
    feePlanId: deterministicUuid('f0000001', subCounter),
    feePlanName: `Plan de Cuota ${subCounter}`,
    feePlanCode: `CUOTA-${String(subCounter).padStart(3, '0')}`,
    typeDiscount: 0,
    personalDiscount: 0,
    personalDiscountReason: null,
    effectiveAmount: 12000,
    effectiveAmountFormatted: '120.00 EUR',
    isActive: true,
    registrationDate: '2026-01-01T00:00:00.000Z',
    leaveDate: null,
    cancelReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function buildMemberSubscriptionsResponse(
  overrides?: Partial<MemberSubscriptionsResponse>,
): MemberSubscriptionsResponse {
  subCounter++;
  return {
    memberAccountId: deterministicUuid('c0000001', subCounter),
    memberId: deterministicUuid('d0000001', subCounter),
    activeSubscription: buildSubscription(),
    history: [],
    ...overrides,
  };
}

describe('Subscription API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subCounter = 0;
    localStorage.clear();
  });

  // ===========================================
  // getSubscriptions()
  // ===========================================
  describe('getSubscriptions()', () => {
    it('debería enviar GET a /v1/treasury/member-accounts/:memberAccountId/subscriptions', async () => {
      // Arrange
      let capturedMemberAccountId: string | undefined;
      const response = buildMemberSubscriptionsResponse();

      server.use(
        http.get('*/v1/treasury/member-accounts/:memberAccountId/subscriptions', ({ params }) => {
          capturedMemberAccountId = params.memberAccountId as string;
          return HttpResponse.json(apiResponse(response));
        }),
      );

      // Act
      const result = await getSubscriptions('f47ac10b-58cc-4372-a567-0000000000d1');

      // Assert
      expect(capturedMemberAccountId).toBe('f47ac10b-58cc-4372-a567-0000000000d1');
      expect(result.memberId).toBeDefined();
      expect(result.activeSubscription).not.toBeNull();
    });

    it('debería parsear respuesta con suscripción activa y cerradas (triangulación)', async () => {
      // Arrange
      const activeSub = buildSubscription({
        personalDiscount: 0.15,
        personalDiscountReason: 'Descuento familiar',
        effectiveAmount: 10200,
      });
      const closedSub = buildSubscription({
        leaveDate: '2025-12-31T00:00:00.000Z',
        cancelReason: 'PLAN_CHANGE',
      });

      const response = buildMemberSubscriptionsResponse({
        activeSubscription: activeSub,
        history: [closedSub],
      });

      server.use(
        http.get('*/v1/treasury/member-accounts/:memberAccountId/subscriptions', () => {
          return HttpResponse.json(apiResponse(response));
        }),
      );

      // Act
      const result = await getSubscriptions('f47ac10b-58cc-4372-a567-0000000000d2');

      // Assert
      expect(result.activeSubscription?.personalDiscount).toBe(0.15);
      expect(result.activeSubscription?.effectiveAmount).toBe(10200);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].cancelReason).toBe('PLAN_CHANGE');
    });

    it('debería parsear respuesta sin suscripción activa', async () => {
      // Arrange
      const response = buildMemberSubscriptionsResponse({
        activeSubscription: null,
        history: [buildSubscription({ cancelReason: 'MEMBER_LEAVE' })],
      });

      server.use(
        http.get('*/v1/treasury/member-accounts/:memberAccountId/subscriptions', () => {
          return HttpResponse.json(apiResponse(response));
        }),
      );

      // Act
      const result = await getSubscriptions('f47ac10b-58cc-4372-a567-0000000000d3');

      // Assert
      expect(result.activeSubscription).toBeNull();
      expect(result.history).toHaveLength(1);
    });

    it('debería propagar error 404 si la cuenta no existe', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberAccountId/subscriptions', () => {
          return HttpResponse.json(
            {
              error: { code: 'ACCOUNT_NOT_FOUND', message: 'Cuenta no encontrada', details: null },
            },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(getSubscriptions('nonexistent')).rejects.toThrow();
    });
  });

  // ===========================================
  // createSubscription()
  // ===========================================
  describe('createSubscription()', () => {
    it('debería enviar POST a /v1/treasury/member-accounts/:id/subscriptions con payload', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedMemberAccountId: string | undefined;
      const created = buildSubscription();

      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions',
          async ({ request, params }) => {
            capturedBody = await request.json();
            capturedMemberAccountId = params.memberAccountId as string;
            return HttpResponse.json(apiResponse(created));
          },
        ),
      );

      // Act
      const input = {
        feePlanId: 'f47ac10b-58cc-4372-a567-000000000001',
        personalDiscount: null,
        personalDiscountReason: null,
      };
      const result = await createSubscription('f47ac10b-58cc-4372-a567-0000000000d1', input);

      // Assert
      expect(capturedMemberAccountId).toBe('f47ac10b-58cc-4372-a567-0000000000d1');
      expect(capturedBody).toEqual(input);
      expect(result.feePlanId).toBeDefined();
    });

    it('debería enviar payload con descuento personalizado (triangulación)', async () => {
      // Arrange
      let capturedBody: unknown;
      const created = buildSubscription({
        personalDiscount: 0.2,
        personalDiscountReason: 'Socio fundador',
        effectiveAmount: 9600,
      });

      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions',
          async ({ request }) => {
            capturedBody = await request.json();
            return HttpResponse.json(apiResponse(created));
          },
        ),
      );

      // Act
      const input = {
        feePlanId: 'f47ac10b-58cc-4372-a567-000000000002',
        personalDiscount: 0.2,
        personalDiscountReason: 'Socio fundador',
      };
      const result = await createSubscription('f47ac10b-58cc-4372-a567-0000000000d2', input);

      // Assert
      expect(capturedBody).toEqual(input);
      expect(result.personalDiscount).toBe(0.2);
      expect(result.effectiveAmount).toBe(9600);
    });

    it('debería propagar error 409 si ya tiene suscripción activa', async () => {
      // Arrange
      server.use(
        http.post('*/v1/treasury/member-accounts/:memberAccountId/subscriptions', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'ACTIVE_SUBSCRIPTION_EXISTS',
                message: 'Ya tiene suscripción activa',
                details: null,
              },
            },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      await expect(
        createSubscription('f47ac10b-58cc-4372-a567-0000000000d1', {
          feePlanId: 'fp-001',
          personalDiscount: null,
          personalDiscountReason: null,
        }),
      ).rejects.toThrow();
    });
  });

  // ===========================================
  // changePlan()
  // ===========================================
  describe('changePlan()', () => {
    it('debería enviar POST a /v1/treasury/member-accounts/:id/subscriptions/:subId/change-plan', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedMemberAccountId: string | undefined;
      let capturedSubscriptionId: string | undefined;
      const updated = buildSubscription({ feePlanCode: 'CUOTA-MENSUAL' });

      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/change-plan',
          async ({ request, params }) => {
            capturedBody = await request.json();
            capturedMemberAccountId = params.memberAccountId as string;
            capturedSubscriptionId = params.subscriptionId as string;
            return HttpResponse.json(apiResponse(updated));
          },
        ),
      );

      // Act
      const input = {
        newFeePlanId: 'fp-uuid-new',
        effectiveDate: '2026-04-01T00:00:00.000Z',
        effectiveDateType: 'NEXT_MONTH' as const,
        keepPendingCharges: true,
      };
      const result = await changePlan(
        'f47ac10b-58cc-4372-a567-0000000000d1',
        'f47ac10b-58cc-4372-a567-0000000000b1',
        input,
      );

      // Assert
      expect(capturedMemberAccountId).toBe('f47ac10b-58cc-4372-a567-0000000000d1');
      expect(capturedSubscriptionId).toBe('f47ac10b-58cc-4372-a567-0000000000b1');
      expect(capturedBody).toEqual(input);
      expect(result.feePlanCode).toBe('CUOTA-MENSUAL');
    });

    it('debería enviar efectiveDateType IMMEDIATE (triangulación)', async () => {
      // Arrange
      let capturedBody: Record<string, unknown> | undefined;
      const updated = buildSubscription();

      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/change-plan',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json(apiResponse(updated));
          },
        ),
      );

      // Act
      await changePlan(
        'f47ac10b-58cc-4372-a567-0000000000d2',
        'f47ac10b-58cc-4372-a567-0000000000b2',
        {
          newFeePlanId: 'fp-uuid-other',
          effectiveDate: '2026-03-22T00:00:00.000Z',
          effectiveDateType: 'IMMEDIATE',
          keepPendingCharges: false,
        },
      );

      // Assert
      expect(capturedBody?.effectiveDateType).toBe('IMMEDIATE');
      expect(capturedBody?.keepPendingCharges).toBe(false);
    });

    it('debería propagar error 422 si la transición no es válida', async () => {
      // Arrange
      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/change-plan',
          () => {
            return HttpResponse.json(
              {
                error: {
                  code: 'INVALID_PLAN_CHANGE',
                  message: 'Cambio no permitido',
                  details: null,
                },
              },
              { status: 422 },
            );
          },
        ),
      );

      // Act & Assert
      await expect(
        changePlan('ma-001', 'sub-001', {
          newFeePlanId: 'same-plan',
          effectiveDate: '2026-04-01T00:00:00.000Z',
          effectiveDateType: 'NEXT_MONTH',
          keepPendingCharges: true,
        }),
      ).rejects.toThrow();
    });
  });

  // ===========================================
  // updateDiscount()
  // ===========================================
  describe('updateDiscount()', () => {
    it('debería enviar PUT a /v1/treasury/member-accounts/:id/subscriptions/:subId con descuento', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedMethod: string | undefined;
      const updated = buildSubscription({ personalDiscount: 0.3, effectiveAmount: 8400 });

      server.use(
        http.put(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId',
          async ({ request }) => {
            capturedMethod = request.method;
            capturedBody = await request.json();
            return HttpResponse.json(apiResponse(updated));
          },
        ),
      );

      // Act
      const input = {
        personalDiscount: 0.3,
        reason: 'Descuento por situación económica',
        approvedBy: 'Junta Directiva',
      };
      const result = await updateDiscount(
        'f47ac10b-58cc-4372-a567-0000000000d1',
        'f47ac10b-58cc-4372-a567-0000000000b1',
        input,
      );

      // Assert
      expect(capturedMethod).toBe('PUT');
      expect(capturedBody).toEqual(input);
      expect(result.personalDiscount).toBe(0.3);
      expect(result.effectiveAmount).toBe(8400);
    });

    it('debería enviar descuento diferente (triangulación)', async () => {
      // Arrange
      let capturedBody: unknown;
      const updated = buildSubscription({ personalDiscount: 0.5 });

      server.use(
        http.put(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId',
          async ({ request }) => {
            capturedBody = await request.json();
            return HttpResponse.json(apiResponse(updated));
          },
        ),
      );

      // Act
      await updateDiscount(
        'f47ac10b-58cc-4372-a567-0000000000d2',
        'f47ac10b-58cc-4372-a567-0000000000b2',
        {
          personalDiscount: 0.5,
          reason: 'Descuento especial aprobado',
          approvedBy: 'Presidente',
        },
      );

      // Assert
      expect(capturedBody).toEqual({
        personalDiscount: 0.5,
        reason: 'Descuento especial aprobado',
        approvedBy: 'Presidente',
      });
    });

    it('debería propagar error 404 si la suscripción no existe', async () => {
      // Arrange
      server.use(
        http.put(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId',
          () => {
            return HttpResponse.json(
              { error: { code: 'NOT_FOUND', message: 'Suscripción no encontrada', details: null } },
              { status: 404 },
            );
          },
        ),
      );

      // Act & Assert
      await expect(
        updateDiscount('ma-001', 'nonexistent', {
          personalDiscount: 0.1,
          reason: 'Test',
          approvedBy: 'Admin',
        }),
      ).rejects.toThrow();
    });
  });

  // ===========================================
  // closeSubscription()
  // ===========================================
  describe('closeSubscription()', () => {
    it('debería enviar PATCH a /v1/treasury/member-accounts/:id/subscriptions/:subId/close con reason', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedMethod: string | undefined;
      let capturedMemberAccountId: string | undefined;
      let capturedSubscriptionId: string | undefined;

      server.use(
        http.patch(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/close',
          async ({ request, params }) => {
            capturedMethod = request.method;
            capturedBody = await request.json();
            capturedMemberAccountId = params.memberAccountId as string;
            capturedSubscriptionId = params.subscriptionId as string;
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      // Act
      await closeSubscription(
        'f47ac10b-58cc-4372-a567-0000000000d1',
        'f47ac10b-58cc-4372-a567-0000000000b1',
        'MEMBER_LEAVE',
      );

      // Assert
      expect(capturedMethod).toBe('PATCH');
      expect(capturedMemberAccountId).toBe('f47ac10b-58cc-4372-a567-0000000000d1');
      expect(capturedSubscriptionId).toBe('f47ac10b-58cc-4372-a567-0000000000b1');
      expect(capturedBody).toEqual({ reason: 'MEMBER_LEAVE' });
    });

    it('debería enviar reason EXEMPTION (triangulación)', async () => {
      // Arrange
      let capturedBody: unknown;

      server.use(
        http.patch(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/close',
          async ({ request }) => {
            capturedBody = await request.json();
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      // Act
      await closeSubscription(
        'f47ac10b-58cc-4372-a567-0000000000d2',
        'f47ac10b-58cc-4372-a567-0000000000b2',
        'EXEMPTION',
      );

      // Assert
      expect(capturedBody).toEqual({ reason: 'EXEMPTION' });
    });

    it('debería completar sin error en respuesta 204', async () => {
      // Arrange
      server.use(
        http.patch(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/close',
          () => {
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      // Act & Assert
      await expect(
        closeSubscription(
          'f47ac10b-58cc-4372-a567-0000000000d1',
          'f47ac10b-58cc-4372-a567-0000000000b1',
          'PLAN_CHANGE',
        ),
      ).resolves.toBeUndefined();
    });

    it('debería propagar error 409 si la suscripción ya está cerrada', async () => {
      // Arrange
      server.use(
        http.patch(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/close',
          () => {
            return HttpResponse.json(
              {
                error: {
                  code: 'SUBSCRIPTION_ALREADY_CLOSED',
                  message: 'Ya está cerrada',
                  details: null,
                },
              },
              { status: 409 },
            );
          },
        ),
      );

      // Act & Assert
      await expect(closeSubscription('ma-001', 'sub-001', 'MEMBER_LEAVE')).rejects.toThrow();
    });

    it('debería propagar error 500 del servidor', async () => {
      // Arrange
      server.use(
        http.patch(
          '*/v1/treasury/member-accounts/:memberAccountId/subscriptions/:subscriptionId/close',
          () => {
            return HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Error interno', details: null } },
              { status: 500 },
            );
          },
        ),
      );

      // Act & Assert
      await expect(closeSubscription('ma-001', 'sub-001', 'ONE_TIME_COMPLETED')).rejects.toThrow();
    });
  });
});
