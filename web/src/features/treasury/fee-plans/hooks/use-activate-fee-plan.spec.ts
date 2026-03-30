// Tests para useActivateFeePlan — mutation hook para activar
// un plan de cuota inactivo.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { useActivateFeePlan } from './use-activate-fee-plan';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const PLAN_ID = 'f47ac10b-58cc-4372-a567-000000000001';
const PLAN_ID_2 = 'f47ac10b-58cc-4372-a567-000000000002';

describe('useActivateFeePlan', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia activar plan exitosamente', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(PLAN_ID);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al activar', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(PLAN_ID);
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan activado',
        color: 'green',
      }),
    );
  });

  it('deberia pasar el ID correcto a la API', async () => {
    // Arrange
    let capturedId = '';
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/activate', ({ params }) => {
        capturedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(PLAN_ID_2);
    });

    // Assert
    expect(capturedId).toBe(PLAN_ID_2);
  });

  it('deberia manejar error de la API', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(PLAN_ID);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deberia mostrar notificacion roja de dominio para error 422 (transicion invalida)', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
        return HttpResponse.json(
          { error: { code: 'INVALID_STATE', message: 'Plan ya activo', details: null } },
          { status: 422 },
        );
      }),
    );

    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(PLAN_ID);
      } catch {
        // Se espera que falle
      }
    });

    // Assert — 422: notificacion roja de dominio especifica
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'No se puede activar',
        color: 'red',
      }),
    );
  });

  it('deberia mostrar notificacion roja generica para error 500', async () => {
    // Arrange
    server.use(
      http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(PLAN_ID);
      } catch {
        // Se espera que falle
      }
    });

    // Assert — error generico: notificacion roja con mensaje generico
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useActivateFeePlan());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
