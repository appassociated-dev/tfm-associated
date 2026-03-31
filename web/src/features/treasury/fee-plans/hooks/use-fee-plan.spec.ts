// Tests para useFeePlan — hook de query que obtiene detalle
// de un plan de cuota por ID, incluyendo vinculaciones.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlanDetail } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useFeePlan } from './use-fee-plan';

// === Datos de prueba ===

const PLAN_ID = 'f47ac10b-58cc-4372-a567-000000000001';
const PLAN_ID_2 = 'f47ac10b-58cc-4372-a567-000000000002';

describe('useFeePlan', () => {
  it('deberia retornar detalle del plan cuando la consulta es exitosa', async () => {
    // Arrange
    const detail = buildFeePlanDetail({
      id: PLAN_ID,
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
    });
    server.use(
      http.get('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json(apiResponse(detail));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlan(PLAN_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(PLAN_ID);
    expect(result.current.data?.code).toBe('CUOTA-ANUAL');
  });

  it('deberia retornar plan con vinculaciones a tipos de socio', async () => {
    // Arrange
    const detail = buildFeePlanDetail({
      id: PLAN_ID,
      linkedMemberTypes: [
        {
          memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
          memberTypeName: 'Socio Adulto',
          feePlanId: PLAN_ID,
          isDefault: true,
          order: 0,
          active: true,
        },
      ],
    });
    server.use(
      http.get('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json(apiResponse(detail));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlan(PLAN_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // linkedMemberTypes es opcional en el schema — el campo se provee en este test explicitamente
    expect(result.current.data?.linkedMemberTypes).toHaveLength(1);
    expect(result.current.data?.linkedMemberTypes?.[0].memberTypeName).toBe('Socio Adulto');
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans/:id', () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlan(PLAN_ID));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('no deberia ejecutar query con ID vacio', () => {
    // Act
    const { result } = renderHook(() => useFeePlan(''));

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('deberia pasar ID correcto a la API (triangulacion)', async () => {
    // Arrange
    let capturedId = '';
    server.use(
      http.get('*/v1/treasury/fee-plans/:id', ({ params }) => {
        capturedId = params.id as string;
        return HttpResponse.json(apiResponse(buildFeePlanDetail({ id: params.id as string })));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlan(PLAN_ID_2));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(capturedId).toBe(PLAN_ID_2);
  });
});
