// Tests para useUpdateDiscount — mutation hook para modificar
// el descuento personalizado de una suscripcion.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildSubscription } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useUpdateDiscount } from './use-update-discount';

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

const discountInput = {
  personalDiscount: 0.15,
  reason: 'Familia numerosa reconocida',
  approvedBy: 'Presidente del Club',
};

const discountInputHigher = {
  personalDiscount: 0.3,
  reason: 'Descuento especial por antiguedad',
  approvedBy: 'Tesorero del Club',
};

describe('useUpdateDiscount', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia actualizar descuento exitosamente', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId', () => {
        return HttpResponse.json(apiResponse(buildSubscription({ personalDiscount: 0.15 })));
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateDiscount(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        input: discountInput,
      });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al actualizar', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId', () => {
        return HttpResponse.json(apiResponse(buildSubscription()));
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateDiscount(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        input: discountInput,
      });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Descuento actualizado',
        color: 'green',
      }),
    );
  });

  it('deberia enviar payload correcto con descuento mayor (triangulacion)', async () => {
    // Arrange
    let capturedBody: unknown;
    server.use(
      http.put(
        '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId',
        async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(buildSubscription()));
        },
      ),
    );

    // Act
    const { result } = renderHook(() => useUpdateDiscount(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync({
        subscriptionId: SUBSCRIPTION_ID,
        input: discountInputHigher,
      });
    });

    // Assert
    expect(capturedBody).toEqual(
      expect.objectContaining({
        personalDiscount: 0.3,
        reason: 'Descuento especial por antiguedad',
        approvedBy: 'Tesorero del Club',
      }),
    );
  });

  it('deberia manejar error 409 con notificacion roja', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId', () => {
        return HttpResponse.json({ message: 'Conflicto al actualizar' }, { status: 409 });
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateDiscount(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          subscriptionId: SUBSCRIPTION_ID,
          input: discountInput,
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

  it('deberia manejar error generico', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateDiscount(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          subscriptionId: SUBSCRIPTION_ID,
          input: discountInput,
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
    const { result } = renderHook(() => useUpdateDiscount(ACCOUNT_ID));

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
