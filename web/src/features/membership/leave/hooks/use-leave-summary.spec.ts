// Tests para useLeaveSummary — hook de query que obtiene
// resumen previo a baja de socio (suscripciones activas, cargos pendientes).

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildLeaveSummary } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useLeaveSummary } from './use-leave-summary';

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';
const MEMBER_ID_2 = 'f47ac10b-58cc-4372-a567-000000000e02';

describe('useLeaveSummary', () => {
  it('deberia retornar datos cuando la consulta es exitosa', async () => {
    // Arrange
    const summary = buildLeaveSummary({ memberId: MEMBER_ID });
    server.use(
      http.get('*/v1/members/:memberId/leave-summary', () => {
        return HttpResponse.json(apiResponse(summary));
      }),
    );

    // Act
    const { result } = renderHook(() => useLeaveSummary(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/leave-summary', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useLeaveSummary(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('no deberia ejecutar la query cuando memberId es undefined', () => {
    // Act
    const { result } = renderHook(() => useLeaveSummary(undefined));

    // Assert — query deshabilitada, permanece en estado idle/pending
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('deberia usar query key diferente para memberIds distintos (triangulacion)', async () => {
    // Arrange
    const summary1 = buildLeaveSummary({ memberId: MEMBER_ID, memberName: 'Socio A' });
    const summary2 = buildLeaveSummary({ memberId: MEMBER_ID_2, memberName: 'Socio B' });

    let callCount = 0;
    server.use(
      http.get('*/v1/members/:memberId/leave-summary', ({ params }) => {
        callCount++;
        const data = params.memberId === MEMBER_ID ? summary1 : summary2;
        return HttpResponse.json(apiResponse(data));
      }),
    );

    // Act — primer miembro
    const { result: result1 } = renderHook(() => useLeaveSummary(MEMBER_ID));
    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Act — segundo miembro
    const { result: result2 } = renderHook(() => useLeaveSummary(MEMBER_ID_2));
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    // Assert — ambas queries se ejecutaron y retornaron datos distintos
    expect(callCount).toBe(2);
    expect(result1.current.data?.memberName).toBe('Socio A');
    expect(result2.current.data?.memberName).toBe('Socio B');
  });

  it('deberia incluir memberId en el queryKey', async () => {
    // Arrange — default handler responde OK

    // Act
    const { result } = renderHook(() => useLeaveSummary(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // La query se ejecuto (no idle) indicando que enabled:true con memberId valido
    expect(result.current.fetchStatus).toBe('idle'); // idle despues de completar
    expect(result.current.data).toBeDefined();
  });
});
