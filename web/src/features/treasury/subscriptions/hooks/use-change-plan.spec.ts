// Tests para useChangePlan — mutation hook para cambiar el plan
// de una suscripcion activa. Maneja error 422 (cargos pendientes).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildSubscription } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useChangePlan } from './use-change-plan';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const ACCOUNT_ID = 'f47ac10b-58cc-4372-a567-0000000000a1';
const SUBSCRIPTION_ID = 'f47ac10b-58cc-4372-a567-0000000000b1';

const changePlanInput = {
  newFeePlanId: 'f47ac10b-58cc-4372-a567-000000000002',
  effectiveDate: '2026-04-01T00:00:00.000Z',
  effectiveDateType: 'NEXT_MONTH' as const,
  keepPendingCharges: true,
};

const changePlanInputImmediate = {
  newFeePlanId: 'f47ac10b-58cc-4372-a567-000000000003',
  effectiveDate: '2026-03-22T00:00:00.000Z',
  effectiveDateType: 'IMMEDIATE' as const,
  keepPendingCharges: false,
};

describe('useChangePlan', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia cambiar plan exitosamente', async () => {
    // Arrange
    server.use(
      http.post(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan',
        () => {
          return HttpResponse.json(apiResponse(buildSubscription()));
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useChangePlan(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        input: changePlanInput,
      });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al cambiar plan', async () => {
    // Arrange
    server.use(
      http.post(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan',
        () => {
          return HttpResponse.json(apiResponse(buildSubscription()));
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useChangePlan(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        input: changePlanInput,
      });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan cambiado',
        color: 'green',
      }),
    );
  });

  it('deberia funcionar con cambio inmediato sin mantener cargos (triangulacion)', async () => {
    // Arrange
    let capturedBody: unknown;
    server.use(
      http.post(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan',
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(buildSubscription()));
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useChangePlan(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        input: changePlanInputImmediate,
      });
    });

    // Assert
    expect(capturedBody).toEqual(
      expect.objectContaining({
        effectiveDateType: 'IMMEDIATE',
        keepPendingCharges: false,
      }),
    );
  });

  it('deberia manejar error 422 (cargos pendientes) con notificacion roja', async () => {
    // Arrange
    server.use(
      http.post(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan',
        () => {
          return HttpResponse.json({ message: 'Cargos pendientes sin confirmar' }, { status: 422 });
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useChangePlan(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          subscriptionId: SUBSCRIPTION_ID,
          input: changePlanInput,
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Cambio no permitido',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error generico', async () => {
    // Arrange
    server.use(
      http.post(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan',
        () => {
          return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useChangePlan(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          subscriptionId: SUBSCRIPTION_ID,
          input: changePlanInput,
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useChangePlan(ACCOUNT_ID));

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
