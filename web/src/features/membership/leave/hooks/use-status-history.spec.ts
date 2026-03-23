// Tests para useStatusHistory — hook de query que obtiene
// historial completo de estados del socio.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useStatusHistory } from './use-status-history';

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';
const MEMBER_ID_2 = 'f47ac10b-58cc-4372-a567-000000000e02';

const historyEmpty = {
  memberId: MEMBER_ID,
  currentStatus: 'ACTIVE',
  entries: [],
};

const historyWithEntries = {
  memberId: MEMBER_ID_2,
  currentStatus: 'VOLUNTARY_LEAVE',
  entries: [
    {
      id: 'f47ac10b-58cc-4372-a567-000000000f01',
      previousStatus: 'ACTIVE',
      newStatus: 'VOLUNTARY_LEAVE',
      reason: 'Mudanza a otra ciudad',
      changedBy: 'admin@club.es',
      changedAt: '2026-02-15T10:30:00.000Z',
    },
    {
      id: 'f47ac10b-58cc-4372-a567-000000000f02',
      previousStatus: 'PENDING',
      newStatus: 'ACTIVE',
      reason: 'Alta aprobada',
      changedBy: 'admin@club.es',
      changedAt: '2025-01-10T09:00:00.000Z',
    },
  ],
};

describe('useStatusHistory', () => {
  it('deberia retornar historial vacio para socio sin transiciones', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/status-history', () => {
        return HttpResponse.json(apiResponse(historyEmpty));
      }),
    );

    // Act
    const { result } = renderHook(() => useStatusHistory(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.entries).toHaveLength(0);
    expect(result.current.data?.currentStatus).toBe('ACTIVE');
  });

  it('deberia retornar historial con multiples entradas (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/status-history', () => {
        return HttpResponse.json(apiResponse(historyWithEntries));
      }),
    );

    // Act
    const { result } = renderHook(() => useStatusHistory(MEMBER_ID_2));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.entries).toHaveLength(2);
    expect(result.current.data?.currentStatus).toBe('VOLUNTARY_LEAVE');
    expect(result.current.data?.entries[0].reason).toBe('Mudanza a otra ciudad');
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/status-history', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useStatusHistory(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('no deberia ejecutar la query cuando memberId es undefined', () => {
    // Act
    const { result } = renderHook(() => useStatusHistory(undefined));

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('deberia pasar memberId correcto a la API', async () => {
    // Arrange
    let capturedId: string | undefined;
    server.use(
      http.get('*/v1/members/:memberId/status-history', ({ params }) => {
        capturedId = params.memberId as string;
        return HttpResponse.json(apiResponse(historyEmpty));
      }),
    );

    // Act
    const { result } = renderHook(() => useStatusHistory(MEMBER_ID));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(capturedId).toBe(MEMBER_ID);
  });
});
