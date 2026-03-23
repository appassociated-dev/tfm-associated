// Tests para useAvailableTransitions — hook de query que obtiene
// transiciones de estado disponibles desde el estado actual del socio.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useAvailableTransitions } from './use-available-transitions';

// === Datos de prueba ===

const MEMBER_ID = 'f47ac10b-58cc-4372-a567-000000000e01';
const MEMBER_ID_2 = 'f47ac10b-58cc-4372-a567-000000000e02';

const transitionsActive = {
  memberId: MEMBER_ID,
  currentStatus: 'ACTIVE',
  availableTransitions: [
    { status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' },
    { status: 'NONPAYMENT_LEAVE', description: 'Baja por impago' },
  ],
};

const transitionsInactive = {
  memberId: MEMBER_ID_2,
  currentStatus: 'VOLUNTARY_LEAVE',
  availableTransitions: [{ status: 'ACTIVE', description: 'Rehabilitacion' }],
};

describe('useAvailableTransitions', () => {
  it('deberia retornar transiciones disponibles para socio activo', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/available-transitions', () => {
        return HttpResponse.json(apiResponse(transitionsActive));
      }),
    );

    // Act
    const { result } = renderHook(() => useAvailableTransitions(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.availableTransitions).toHaveLength(2);
    expect(result.current.data?.currentStatus).toBe('ACTIVE');
  });

  it('deberia retornar transiciones distintas segun estado (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/available-transitions', ({ params }) => {
        const data = params.memberId === MEMBER_ID ? transitionsActive : transitionsInactive;
        return HttpResponse.json(apiResponse(data));
      }),
    );

    // Act
    const { result: r1 } = renderHook(() => useAvailableTransitions(MEMBER_ID));
    const { result: r2 } = renderHook(() => useAvailableTransitions(MEMBER_ID_2));

    // Assert
    await waitFor(() => expect(r1.current.isSuccess).toBe(true));
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));
    expect(r1.current.data?.availableTransitions).toHaveLength(2);
    expect(r2.current.data?.availableTransitions).toHaveLength(1);
    expect(r2.current.data?.availableTransitions[0].status).toBe('ACTIVE');
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/:memberId/available-transitions', () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
      }),
    );

    // Act
    const { result } = renderHook(() => useAvailableTransitions(MEMBER_ID));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('no deberia ejecutar la query cuando memberId es undefined', () => {
    // Act
    const { result } = renderHook(() => useAvailableTransitions(undefined));

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('deberia incluir memberId en el queryKey', async () => {
    // Arrange
    let capturedMemberId: string | undefined;
    server.use(
      http.get('*/v1/members/:memberId/available-transitions', ({ params }) => {
        capturedMemberId = params.memberId as string;
        return HttpResponse.json(apiResponse(transitionsActive));
      }),
    );

    // Act
    const { result } = renderHook(() => useAvailableTransitions(MEMBER_ID));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert — la peticion se hizo con el memberId correcto
    expect(capturedMemberId).toBe(MEMBER_ID);
  });
});
