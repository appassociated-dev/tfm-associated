// Tests para useCreateFeePlan — mutation hook para crear un nuevo
// plan de cuota. Verifica invalidacion de cache, notificaciones
// de exito/error (409 y generico).
// REESCRITO: usa MSW en lugar de vi.mock de la API.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useCreateFeePlan } from './use-create-fee-plan';
import type { CreateFeePlanInput } from '../schemas/fee-plan.schemas';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const inputRecurring: CreateFeePlanInput = {
  code: 'CUOTA-ANUAL',
  name: 'Cuota Anual',
  description: null,
  type: 'RECURRING',
  amount: 12000,
  frequency: 'ANNUAL',
  billingMonths: [1],
};

const inputOneTime: CreateFeePlanInput = {
  code: 'CUOTA-ALTA',
  name: 'Cuota de Alta',
  description: 'Cuota unica de inscripcion',
  type: 'ONE_TIME',
  amount: 5000,
};

describe('useCreateFeePlan', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia crear plan exitosamente', async () => {
    // Arrange
    const created = buildFeePlan({ code: 'CUOTA-ANUAL', name: 'Cuota Anual' });
    server.use(
      http.post('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse(created), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(inputRecurring);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al crear plan', async () => {
    // Arrange
    const created = buildFeePlan();
    server.use(
      http.post('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse(created), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(inputRecurring);
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan creado',
        color: 'green',
      }),
    );
  });

  it('deberia enviar payload correcto a la API', async () => {
    // Arrange
    let capturedBody: unknown;
    server.use(
      http.post('*/v1/treasury/fee-plans', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(apiResponse(buildFeePlan()), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(inputRecurring);
    });

    // Assert — verificar que el payload es correcto
    expect(capturedBody).toEqual(
      expect.objectContaining({
        code: 'CUOTA-ANUAL',
        amount: 12000,
        type: 'RECURRING',
      }),
    );
  });

  it('deberia funcionar con plan ONE_TIME (triangulacion)', async () => {
    // Arrange
    const created = buildFeePlan({ code: 'CUOTA-ALTA', type: 'ONE_TIME' });
    server.use(
      http.post('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse(created), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    await act(async () => {
      await result.current.mutateAsync(inputOneTime);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Plan creado' }),
    );
  });

  it('deberia manejar error 409 (codigo duplicado) con notificacion roja', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json({ message: 'Duplicate code' }, { status: 409 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(inputRecurring);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Código duplicado',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error generico con mensaje del backend', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json({ message: 'Error de validacion del servidor' }, { status: 400 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    await act(async () => {
      try {
        await result.current.mutateAsync(inputRecurring);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error al crear plan',
          color: 'red',
        }),
      );
    });
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    // Assert
    expect(result.current.isPending).toBe(false);
  });

  it('deberia retornar los datos del plan creado', async () => {
    // Arrange
    const created = buildFeePlan({
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
      amount: 12000,
    });
    server.use(
      http.post('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse(created), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCreateFeePlan());

    let returnedData: unknown;
    await act(async () => {
      returnedData = await result.current.mutateAsync(inputRecurring);
    });

    // Assert — verifica que la mutacion devuelve el plan completo
    expect(returnedData).toMatchObject({
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
      amount: 12000,
    });
  });
});
