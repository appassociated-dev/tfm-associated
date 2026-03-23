// Tests para useCreateSubscription — mutation hook para crear
// una nueva suscripcion para un socio. Maneja error 409 (duplicada).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildSubscription } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useCreateSubscription } from './use-create-subscription';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const ACCOUNT_ID = 'f47ac10b-58cc-4372-a567-0000000000a1';

const subscriptionInput = {
  feePlanId: 'f47ac10b-58cc-4372-a567-000000000001',
  personalDiscount: null,
  personalDiscountReason: null,
};

const subscriptionInputWithDiscount = {
  feePlanId: 'f47ac10b-58cc-4372-a567-000000000002',
  personalDiscount: 0.15,
  personalDiscountReason: 'Familia numerosa',
};

describe('useCreateSubscription', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia crear suscripcion exitosamente', async () => {
    // Arrange
    const created = buildSubscription();
    server.use(
      http.post('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json(apiResponse(created), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateSubscription(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync(subscriptionInput);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al crear', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json(apiResponse(buildSubscription()), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateSubscription(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync(subscriptionInput);
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Suscripción creada',
        color: 'green',
      }),
    );
  });

  it('deberia crear suscripcion con descuento (triangulacion)', async () => {
    // Arrange
    let capturedBody: unknown;
    server.use(
      http.post('*/v1/treasury/member-accounts/:memberId/subscriptions', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(apiResponse(buildSubscription()), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateSubscription(ACCOUNT_ID));

    await act(async () => {
      await result.current.mutateAsync(subscriptionInputWithDiscount);
    });

    // Assert
    expect(capturedBody).toEqual(
      expect.objectContaining({
        personalDiscount: 0.15,
        personalDiscountReason: 'Familia numerosa',
      }),
    );
  });

  it('deberia manejar error 409 (suscripcion duplicada) con notificacion roja', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json({ message: 'Ya existe suscripcion activa' }, { status: 409 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateSubscription(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync(subscriptionInput);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Suscripción duplicada',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error generico sin notificacion especial', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateSubscription(ACCOUNT_ID));

    await act(async () => {
      try {
        await result.current.mutateAsync(subscriptionInput);
      } catch {
        // Se espera que falle
      }
    });

    // Assert — no deberia haber notificacion de duplicada
    await waitFor(() => expect(result.current.isError).toBe(true));
    const duplicateCalls = mockNotificationsShow.mock.calls.filter(
      (call) => (call[0] as { title: string }).title === 'Suscripcion duplicada',
    );
    expect(duplicateCalls).toHaveLength(0);
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useCreateSubscription(ACCOUNT_ID));

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
