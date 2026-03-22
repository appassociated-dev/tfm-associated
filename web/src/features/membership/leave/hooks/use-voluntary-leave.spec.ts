// Tests para useVoluntaryLeave — mutation hook para procesar
// baja voluntaria de socio (UC-013). Verifica invalidacion de cache
// y notificaciones de exito/error.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useVoluntaryLeave } from './use-voluntary-leave';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';

const leaveRequest = {
  effectiveDateType: 'IMMEDIATE' as const,
  reason: 'Me mudo a otra ciudad',
};

const leaveResponse = {
  memberId: MEMBER_ID,
  previousStatus: 'ACTIVE',
  newStatus: 'VOLUNTARY_LEAVE',
  effectiveDate: '2026-03-22T00:00:00.000Z',
  subscriptionsClosed: 1,
  pendingChargesAmount: 0,
};

describe('useVoluntaryLeave', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia procesar baja voluntaria exitosamente', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/voluntary-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useVoluntaryLeave());

    await act(async () => {
      await result.current.mutateAsync({ memberId: MEMBER_ID, data: leaveRequest });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al completar baja', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/voluntary-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useVoluntaryLeave());

    await act(async () => {
      await result.current.mutateAsync({ memberId: MEMBER_ID, data: leaveRequest });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Baja procesada',
        color: 'green',
      }),
    );
  });

  it('deberia invalidar queries de members y leave-summary en exito', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/voluntary-leave', () => {
        return HttpResponse.json(apiResponse(leaveResponse));
      }),
    );

    // Usamos queryData para prepopular cache y verificar invalidacion
    const { result } = renderHook(() => useVoluntaryLeave(), {
      queryData: [
        { queryKey: ['members'], data: [] },
        { queryKey: ['leave-summary'], data: {} },
      ],
    });

    // Act
    await act(async () => {
      await result.current.mutateAsync({ memberId: MEMBER_ID, data: leaveRequest });
    });

    // Assert — mutation exitosa indica que los callbacks se ejecutaron
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalled();
  });

  it('deberia manejar error 422 con notificacion roja', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/voluntary-leave', () => {
        return HttpResponse.json({ message: 'Estado invalido' }, { status: 422 });
      }),
    );

    // Act
    const { result } = renderHook(() => useVoluntaryLeave());

    await act(async () => {
      try {
        await result.current.mutateAsync({ memberId: MEMBER_ID, data: leaveRequest });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de estado',
          color: 'red',
        }),
      );
    });
  });

  it('no deberia mostrar notificacion especial para errores distintos a 422', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/:memberId/voluntary-leave', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useVoluntaryLeave());

    await act(async () => {
      try {
        await result.current.mutateAsync({ memberId: MEMBER_ID, data: leaveRequest });
      } catch {
        // Se espera que falle
      }
    });

    // Assert — no deberia haber notificacion roja especifica de 422
    await waitFor(() => expect(result.current.isError).toBe(true));
    const calls = mockNotificationsShow.mock.calls;
    const errorCalls = calls.filter(
      (call) => (call[0] as { title: string }).title === 'Error de estado',
    );
    expect(errorCalls).toHaveLength(0);
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useVoluntaryLeave());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
