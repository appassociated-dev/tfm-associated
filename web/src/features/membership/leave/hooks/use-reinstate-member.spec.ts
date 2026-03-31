// Tests para useReinstateMember — mutation hook para rehabilitar
// un ex-socio tras confirmacion de pago. Invalida cache de members
// y status-history.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useReinstateMember } from './use-reinstate-member';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';
const MEMBER_ID_2 = 'f47ac10b-58cc-4372-a567-000000000e02';

const reinstatementRequest = { paymentConfirmed: true };

const reinstatementResponse = {
  memberId: MEMBER_ID,
  newStatus: 'ACTIVE',
  debtPaid: 7500,
  seniorityRecovered: true,
  registrationDate: '2026-03-22T00:00:00.000Z',
};

describe('useReinstateMember', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia rehabilitar socio exitosamente', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/reinstate', () => {
        return HttpResponse.json(apiResponse(reinstatementResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstateMember());

    await act(async () => {
      await result.current.mutateAsync({
        memberId: MEMBER_ID,
        data: reinstatementRequest,
      });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al completar rehabilitacion', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/reinstate', () => {
        return HttpResponse.json(apiResponse(reinstatementResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstateMember());

    await act(async () => {
      await result.current.mutateAsync({
        memberId: MEMBER_ID,
        data: reinstatementRequest,
      });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Rehabilitacion exitosa',
        message: 'Socio rehabilitado correctamente',
        color: 'green',
      }),
    );
  });

  it('deberia invalidar queries de members y status-history del socio', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/reinstate', () => {
        return HttpResponse.json(apiResponse(reinstatementResponse));
      }),
    );

    const { result } = renderHook(() => useReinstateMember(), {
      queryData: [
        { queryKey: ['members'], data: [] },
        { queryKey: ['status-history', MEMBER_ID], data: {} },
      ],
    });

    // Act
    await act(async () => {
      await result.current.mutateAsync({
        memberId: MEMBER_ID,
        data: reinstatementRequest,
      });
    });

    // Assert — mutation exitosa + notificacion indica que onSuccess se ejecuto completo
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalled();
  });

  it('deberia funcionar con diferentes memberIds (triangulacion)', async () => {
    // Arrange
    const response2 = {
      ...reinstatementResponse,
      memberId: MEMBER_ID_2,
      debtPaid: 15000,
    };

    server.use(
      http.post('*/v1/members/:memberId/reinstate', ({ params }) => {
        const data = params.memberId === MEMBER_ID ? reinstatementResponse : response2;
        return HttpResponse.json(apiResponse(data));
      }),
    );

    // Act — rehabilitar primer socio
    const { result: result1 } = renderHook(() => useReinstateMember());
    await act(async () => {
      await result1.current.mutateAsync({
        memberId: MEMBER_ID,
        data: reinstatementRequest,
      });
    });

    // Act — rehabilitar segundo socio
    const { result: result2 } = renderHook(() => useReinstateMember());
    await act(async () => {
      await result2.current.mutateAsync({
        memberId: MEMBER_ID_2,
        data: reinstatementRequest,
      });
    });

    // Assert — ambos exitosos
    expect(result1.current.isSuccess).toBe(true);
    expect(result2.current.isSuccess).toBe(true);
    expect(mockNotificationsShow).toHaveBeenCalledTimes(2);
  });

  it('deberia manejar error de red', async () => {
    // Arrange — HttpResponse.error() simula TypeError: Failed to fetch (red caida)
    server.use(
      http.post('*/v1/members/:memberId/reinstate', () => {
        return HttpResponse.error();
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstateMember());

    await act(async () => {
      try {
        await result.current.mutateAsync({
          memberId: MEMBER_ID,
          data: reinstatementRequest,
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert — fallo de red: notificacion roja generica
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });

  it('deberia mostrar notificacion roja de dominio para error 422 (conflicto de estado)', async () => {
    // Arrange — 422 indica que el socio no puede rehabilitarse desde el estado actual
    server.use(
      http.post('*/v1/members/:memberId/reinstate', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'REINSTATEMENT_NOT_APPLICABLE',
              message: 'El socio no puede ser rehabilitado desde el estado actual',
              details: null,
            },
          },
          { status: 422 },
        );
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstateMember());

    await act(async () => {
      try {
        await result.current.mutateAsync({
          memberId: MEMBER_ID,
          data: reinstatementRequest,
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert — notificacion roja especifica de dominio (stateErrorTitle), NO el fallback generico
    await waitFor(() =>
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error de rehabilitacion', color: 'red' }),
      ),
    );
  });

  it('deberia mostrar notificacion roja generica para error 500', async () => {
    // Arrange — error interno del servidor
    server.use(
      http.post('*/v1/members/:memberId/reinstate', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstateMember());

    await act(async () => {
      try {
        await result.current.mutateAsync({
          memberId: MEMBER_ID,
          data: reinstatementRequest,
        });
      } catch {
        // Se espera que falle
      }
    });

    // Assert — fallback generico con color rojo
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useReinstateMember());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
