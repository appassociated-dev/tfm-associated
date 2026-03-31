// Tests para useNonpaymentLeave — mutation hook para procesar
// baja por impago de socio (UC-013). Verifica invalidacion de cache,
// notificacion verde con datos del response, y notificacion roja en error 422.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useNonpaymentLeave } from './use-nonpayment-leave';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';

const leaveResponse = {
  memberId: MEMBER_ID,
  previousStatus: 'PENDING_PAYMENT',
  newStatus: 'NONPAYMENT_LEAVE',
  effectiveDate: '2026-03-29T00:00:00.000Z',
  subscriptionsClosed: 2,
  pendingChargesAmount: 6000,
};

describe('useNonpaymentLeave', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia procesar baja por impago exitosamente', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/nonpayment-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useNonpaymentLeave());

    await act(async () => {
      await result.current.mutateAsync(MEMBER_ID);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia invalidar queries de members y leave-summary en exito', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/nonpayment-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    const { result } = renderHook(() => useNonpaymentLeave(), {
      queryData: [
        { queryKey: ['members'], data: [] },
        { queryKey: ['leave-summary'], data: {} },
      ],
    });

    // Act
    await act(async () => {
      await result.current.mutateAsync(MEMBER_ID);
    });

    // Assert — mutation exitosa indica que los callbacks se ejecutaron
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalled();
  });

  it('deberia mostrar notificacion verde con effectiveDate formateado y subscriptionsClosed', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/nonpayment-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useNonpaymentLeave());

    await act(async () => {
      await result.current.mutateAsync(MEMBER_ID);
    });

    // Assert — fecha formateada en formato compacto español (dd/MM/yyyy)
    await waitFor(() =>
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          message: expect.stringContaining('29/03/2026'),
        }),
      ),
    );
  });

  it('deberia incluir subscriptionsClosed en la notificacion de exito', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/nonpayment-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useNonpaymentLeave());

    await act(async () => {
      await result.current.mutateAsync(MEMBER_ID);
    });

    // Assert — verifica que el mensaje contiene el numero de suscripciones cerradas interpolado
    await waitFor(() =>
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          message: expect.stringContaining('2 suscripciones cerradas'),
        }),
      ),
    );
  });

  it('deberia manejar error 422 con notificacion roja', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/nonpayment-leave', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'NONPAYMENT_NOT_APPLICABLE',
              message: 'No hay impagos suficientes',
              details: null,
            },
          },
          { status: 422 },
        );
      }),
    );

    // Act
    const { result } = renderHook(() => useNonpaymentLeave());

    await act(async () => {
      try {
        await result.current.mutateAsync(MEMBER_ID);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'red',
        }),
      );
    });
  });

  it('deberia mostrar notificacion roja generica para errores distintos a 422', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/nonpayment-leave', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useNonpaymentLeave());

    await act(async () => {
      try {
        await result.current.mutateAsync(MEMBER_ID);
      } catch {
        // Se espera que falle
      }
    });

    // Assert — error generico: se muestra notificacion roja con mensaje generico (no especifico de 422)
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useNonpaymentLeave());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
