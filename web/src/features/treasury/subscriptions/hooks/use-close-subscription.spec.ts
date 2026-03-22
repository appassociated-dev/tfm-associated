// Tests para useCloseSubscription — mutation hook para cerrar
// una suscripcion con motivo. Maneja error 409.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { useCloseSubscription } from './use-close-subscription';

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
const SUBSCRIPTION_ID_2 = 'f47ac10b-58cc-4372-a567-0000000000b2';

describe('useCloseSubscription', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia cerrar suscripcion exitosamente', async () => {
    // Arrange
    server.use(
      http.patch(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close',
        () => {
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useCloseSubscription(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        reason: 'MEMBER_LEAVE',
      });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al cerrar', async () => {
    // Arrange
    server.use(
      http.patch(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close',
        () => {
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useCloseSubscription(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        reason: 'MEMBER_LEAVE',
      });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Suscripcion cerrada',
        color: 'green',
      }),
    );
  });

  it('deberia funcionar con diferentes motivos de cierre (triangulacion)', async () => {
    // Arrange
    const capturedBodies: unknown[] = [];
    server.use(
      http.patch(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close',
        async ({ request }) => {
          capturedBodies.push(await request.json());
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    // Act — cierre por baja
    const { result: r1 } = renderHook(() => useCloseSubscription(ACCOUNT_ID));
    await act(async () => {
      await r1.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        reason: 'MEMBER_LEAVE',
      });
    });

    // Act — cierre por exencion
    const { result: r2 } = renderHook(() => useCloseSubscription(ACCOUNT_ID));
    await act(async () => {
      await r2.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID_2,
        reason: 'EXEMPTION',
      });
    });

    // Assert
    expect(capturedBodies).toHaveLength(2);
    expect(capturedBodies[0]).toEqual(expect.objectContaining({ reason: 'MEMBER_LEAVE' }));
    expect(capturedBodies[1]).toEqual(expect.objectContaining({ reason: 'EXEMPTION' }));
  });

  it('deberia manejar error 409 con notificacion roja', async () => {
    // Arrange
    server.use(
      http.patch(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close',
        () => {
          return HttpResponse.json({ message: 'No se puede cerrar' }, { status: 409 });
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useCloseSubscription(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          subscriptionId: SUBSCRIPTION_ID,
          reason: 'PLAN_CHANGE',
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error generico sin notificacion de error especifica', async () => {
    // Arrange
    server.use(
      http.patch(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close',
        () => {
          return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useCloseSubscription(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          subscriptionId: SUBSCRIPTION_ID,
          reason: 'ONE_TIME_COMPLETED',
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    // No deberia haber notificacion de error especifica (500 no es 409)
    const errorCalls = mockNotificationsShow.mock.calls.filter(
      (call) => (call[0] as { title: string }).title === 'Error',
    );
    expect(errorCalls).toHaveLength(0);
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useCloseSubscription(ACCOUNT_ID));

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
