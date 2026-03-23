// Tests para useUpdateFeePlan — mutation hook para actualizar
// un plan de cuota existente. Invalida cache de fee-plans y del
// plan individual.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useUpdateFeePlan } from './use-update-fee-plan';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const PLAN_ID = 'f47ac10b-58cc-4372-a567-000000000001';

describe('useUpdateFeePlan', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia actualizar plan exitosamente', async () => {
    // Arrange
    const updated = buildFeePlan({ id: PLAN_ID, name: 'Cuota Anual Actualizada' });
    server.use(
      http.put('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json(apiResponse(updated));
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateFeePlan());

    await act(async () => {
      await result.current.mutateAsync({
        id: PLAN_ID,
        input: { name: 'Cuota Anual Actualizada' },
      });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al actualizar', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json(apiResponse(buildFeePlan({ id: PLAN_ID })));
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateFeePlan());

    await act(async () => {
      await result.current.mutateAsync({
        id: PLAN_ID,
        input: { name: 'Cuota Anual v2' },
      });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan actualizado',
        color: 'green',
      }),
    );
  });

  it('deberia enviar payload correcto a la API', async () => {
    // Arrange
    let capturedBody: unknown;
    let capturedId = '';
    server.use(
      http.put('*/v1/treasury/fee-plans/:id', async ({ params, request }) => {
        capturedId = params.id as string;
        capturedBody = await request.json();
        return HttpResponse.json(apiResponse(buildFeePlan({ id: params.id as string })));
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateFeePlan());

    await act(async () => {
      await result.current.mutateAsync({
        id: PLAN_ID,
        input: { name: 'Nuevo Nombre', amount: 15000 },
      });
    });

    // Assert
    expect(capturedId).toBe(PLAN_ID);
    expect(capturedBody).toEqual(
      expect.objectContaining({
        name: 'Nuevo Nombre',
        amount: 15000,
      }),
    );
  });

  it('deberia actualizar diferentes campos (triangulacion)', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json(apiResponse(buildFeePlan({ id: PLAN_ID })));
      }),
    );

    // Act — solo actualizar descripcion
    const { result } = renderHook(() => useUpdateFeePlan());

    await act(async () => {
      await result.current.mutateAsync({
        id: PLAN_ID,
        input: { description: 'Nueva descripcion del plan' },
      });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia manejar error de la API', async () => {
    // Arrange
    server.use(
      http.put('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useUpdateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: PLAN_ID,
          input: { name: 'Test' },
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
    const { result } = renderHook(() => useUpdateFeePlan());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
