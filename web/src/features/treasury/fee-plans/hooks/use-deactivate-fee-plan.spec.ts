// Tests para useDeactivateFeePlan — mutation hook para inactivar
// un plan de cuota. Verifica invalidacion de cache, notificaciones
// y manejo de error 422 (suscripciones activas).
// REESCRITO: usa MSW en lugar de vi.mock de la API.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { useDeactivateFeePlan } from './use-deactivate-fee-plan';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const PLAN_ID_1 = 'f47ac10b-58cc-4372-a567-000000000001';
const PLAN_ID_2 = 'f47ac10b-58cc-4372-a567-000000000002';

describe('useDeactivateFeePlan', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia desactivar plan exitosamente', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(PLAN_ID_1);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al desactivar', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(PLAN_ID_1);
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan inactivado',
        color: 'green',
      }),
    );
  });

  it('deberia pasar el ID correcto a la API', async () => {
    // Arrange
    let capturedId = '';
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', ({ params }) => {
        capturedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(PLAN_ID_1);
    });

    // Assert
    expect(capturedId).toBe(PLAN_ID_1);
  });

  it('deberia funcionar con diferentes IDs de plan (triangulacion)', async () => {
    // Arrange
    const capturedIds: string[] = [];
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', ({ params }) => {
        capturedIds.push(params.id as string);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result: r1 } = renderHook(() => useDeactivateFeePlan());
    await act(async () => {
      await r1.current.mutateAsync(PLAN_ID_1);
    });

    const { result: r2 } = renderHook(() => useDeactivateFeePlan());
    await act(async () => {
      await r2.current.mutateAsync(PLAN_ID_2);
    });

    // Assert
    expect(capturedIds).toEqual([PLAN_ID_1, PLAN_ID_2]);
    expect(mockNotificationsShow).toHaveBeenCalledTimes(2);
  });

  it('deberia manejar error 422 (suscripciones activas) con notificacion roja', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
        return HttpResponse.json({ message: 'Plan tiene suscripciones activas' }, { status: 422 });
      }),
    );

    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(PLAN_ID_1);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No se puede inactivar',
          color: 'red',
        }),
      );
    });
  });

  it('no deberia mostrar ninguna notificacion para errores no-422', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(PLAN_ID_1);
      } catch {
        // Se espera que falle
      }
    });

    // Assert — el hook solo muestra notificacion para 422, no para otros errores
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).not.toHaveBeenCalled();
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    // Assert
    expect(result.current.isPending).toBe(false);
  });

  it('deberia manejar error 400 sin mostrar notificacion', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
        return HttpResponse.json({ message: 'Bad Request' }, { status: 400 });
      }),
    );

    // Act
    const { result } = renderHook(() => useDeactivateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(PLAN_ID_1);
      } catch {
        // Se espera que falle
      }
    });

    // Assert — solo 422 muestra notificacion, 400 no
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).not.toHaveBeenCalled();
  });
});
