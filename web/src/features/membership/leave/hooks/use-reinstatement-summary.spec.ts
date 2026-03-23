// Tests para useReinstatementSummary — hook de query que obtiene
// resumen de rehabilitacion: costes, antiguedad, importe total.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildReinstatementSummary } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useReinstatementSummary } from './use-reinstatement-summary';

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';
const MEMBER_ID_2 = 'f47ac10b-58cc-4372-a567-000000000e02';

describe('useReinstatementSummary', () => {
  it('deberia retornar datos cuando la consulta es exitosa', async () => {
    // Arrange
    const summary = buildReinstatementSummary({ memberId: MEMBER_ID });
    server.use(
      http.get('*/v1/members/:memberId/reinstatement-summary', () => {
        return HttpResponse.json(apiResponse(summary));
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstatementSummary(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/reinstatement-summary', () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstatementSummary(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('no deberia ejecutar la query cuando memberId es undefined', () => {
    // Act
    const { result } = renderHook(() => useReinstatementSummary(undefined));

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('deberia tener retry:false configurado (no reintentar en errores)', async () => {
    // Arrange — contador de llamadas para verificar que no reintenta
    let callCount = 0;
    server.use(
      http.get('*/v1/members/:memberId/reinstatement-summary', () => {
        callCount++;
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstatementSummary(MEMBER_ID));

    // Assert — con retry:false deberia fallar en la primera llamada
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(callCount).toBe(1);
  });

  it('deberia retornar datos con desglose de costes (triangulacion)', async () => {
    // Arrange — resumen con costes altos
    const summaryExpensive = buildReinstatementSummary({
      memberId: MEMBER_ID,
      pendingDebt: 15000,
      penalty: 5000,
      newRegistrationFee: 10000,
      totalToPay: 30000,
      keepSeniority: false,
    });
    server.use(
      http.get('*/v1/members/:memberId/reinstatement-summary', () => {
        return HttpResponse.json(apiResponse(summaryExpensive));
      }),
    );

    // Act
    const { result } = renderHook(() => useReinstatementSummary(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalToPay).toBe(30000);
    expect(result.current.data?.keepSeniority).toBe(false);
    expect(result.current.data?.pendingDebt).toBe(15000);
  });

  it('deberia usar query key distinta para memberIds distintos', async () => {
    // Arrange
    const summary1 = buildReinstatementSummary({ memberId: MEMBER_ID, totalToPay: 5000 });
    const summary2 = buildReinstatementSummary({ memberId: MEMBER_ID_2, totalToPay: 12000 });

    server.use(
      http.get('*/v1/members/:memberId/reinstatement-summary', ({ params }) => {
        const data = params.memberId === MEMBER_ID ? summary1 : summary2;
        return HttpResponse.json(apiResponse(data));
      }),
    );

    // Act
    const { result: r1 } = renderHook(() => useReinstatementSummary(MEMBER_ID));
    const { result: r2 } = renderHook(() => useReinstatementSummary(MEMBER_ID_2));

    // Assert
    await waitFor(() => expect(r1.current.isSuccess).toBe(true));
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));
    expect(r1.current.data?.totalToPay).toBe(5000);
    expect(r2.current.data?.totalToPay).toBe(12000);
  });
});
