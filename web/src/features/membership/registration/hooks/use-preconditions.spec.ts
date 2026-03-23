// Tests para usePreconditions — hook de query que consulta
// precondiciones del alta simple (FE-4, FE-5): ejercicio fiscal,
// tipos de socio, plan de alta.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { usePreconditions } from './use-preconditions';

// === Datos de prueba ===

const preconditionsOk = {
  hasFiscalYear: true,
  hasMemberTypes: true,
  hasRegistrationPlan: true,
  registrationPlan: {
    feePlanId: 'f47ac10b-58cc-4372-a567-000000000001',
    name: 'Cuota de Alta',
    amount: 5000,
  },
  errors: [],
};

const preconditionsIncomplete = {
  hasFiscalYear: false,
  hasMemberTypes: true,
  hasRegistrationPlan: false,
  registrationPlan: null,
  errors: ['No hay ejercicio fiscal activo', 'No hay plan de cuota de alta configurado'],
};

describe('usePreconditions', () => {
  it('deberia retornar precondiciones completas cuando todo esta configurado', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/preconditions', () => {
        return HttpResponse.json(apiResponse(preconditionsOk));
      }),
    );

    // Act
    const { result } = renderHook(() => usePreconditions());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.hasFiscalYear).toBe(true);
    expect(result.current.data?.hasMemberTypes).toBe(true);
    expect(result.current.data?.hasRegistrationPlan).toBe(true);
    expect(result.current.data?.registrationPlan?.name).toBe('Cuota de Alta');
    expect(result.current.data?.errors).toHaveLength(0);
  });

  it('deberia retornar precondiciones incompletas con errores (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/preconditions', () => {
        return HttpResponse.json(apiResponse(preconditionsIncomplete));
      }),
    );

    // Act
    const { result } = renderHook(() => usePreconditions());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.hasFiscalYear).toBe(false);
    expect(result.current.data?.hasRegistrationPlan).toBe(false);
    expect(result.current.data?.registrationPlan).toBeNull();
    expect(result.current.data?.errors).toHaveLength(2);
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/preconditions', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => usePreconditions());

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('deberia ejecutar la query inmediatamente (sin enabled condicional)', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/members/preconditions', () => {
        callCount++;
        return HttpResponse.json(apiResponse(preconditionsOk));
      }),
    );

    // Act
    const { result } = renderHook(() => usePreconditions());

    // Assert — la query se ejecuta inmediatamente al montar
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(1);
  });
});
