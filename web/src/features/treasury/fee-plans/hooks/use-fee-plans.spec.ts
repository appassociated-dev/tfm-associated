// Tests para useFeePlans — hook de query que obtiene listado de
// planes de cuota, opcionalmente filtrado por estado.
// REESCRITO: usa MSW en lugar de vi.mock de la API.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useFeePlans } from './use-fee-plans';

// === Datos de prueba ===

const planAnual = buildFeePlan({
  code: 'CUOTA-ANUAL',
  name: 'Cuota Anual',
  amount: 12000,
  active: true,
});

const planMensual = buildFeePlan({
  code: 'CUOTA-MENSUAL',
  name: 'Cuota Mensual',
  amount: 3000,
  frequency: 'MONTHLY',
  active: true,
});

const planInactivo = buildFeePlan({
  code: 'CUOTA-VIEJA',
  name: 'Cuota Antigua',
  amount: 8000,
  active: false,
});

describe('useFeePlans', () => {
  it('deberia retornar listado de planes cuando la consulta es exitosa', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse([planAnual, planMensual]));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].code).toBe('CUOTA-ANUAL');
    expect(result.current.data?.[1].code).toBe('CUOTA-MENSUAL');
  });

  it('deberia pasar parametro active a la API', async () => {
    // Arrange
    let capturedUrl = '';
    server.use(
      http.get('*/v1/treasury/fee-plans', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(apiResponse([planAnual, planMensual]));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans({ active: true }));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toContain('active=true');
  });

  it('deberia funcionar sin parametros (retorna todos los planes)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse([planAnual, planMensual, planInactivo]));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans());

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('deberia usar queryKey distinto segun parametros (triangulacion)', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        callCount++;
        return HttpResponse.json(apiResponse([planAnual]));
      }),
    );

    // Act — sin params
    const { result: r1 } = renderHook(() => useFeePlans());
    await waitFor(() => expect(r1.current.isSuccess).toBe(true));

    // Act — con params activos
    const { result: r2 } = renderHook(() => useFeePlans({ active: true }));
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));

    // Assert — ambas queries se ejecutaron
    expect(callCount).toBe(2);
  });

  it('deberia retornar lista vacia cuando no hay planes', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse([]));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });

  it('deberia estar en estado loading mientras la consulta se resuelve', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse([planAnual]));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans());

    // Assert — estado inicial es loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Assert — luego resuelve
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia retornar objetos FeePlan con la estructura completa', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse([planAnual]));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlans());

    // Assert — verifica la estructura completa del objeto
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const plan = result.current.data?.[0];
    expect(plan).toBeDefined();
    expect(plan).toMatchObject({
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
      amount: 12000,
      active: true,
      type: 'RECURRING',
    });
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('createdAt');
    expect(plan).toHaveProperty('updatedAt');
  });
});
