// Tests para useMemberTypes (fee-plans) — hook de query que obtiene
// tipos de socio activos para el selector de vinculacion de planes.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildMemberTypeOption } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useMemberTypes } from './use-member-types';

// === Datos de prueba ===

const typeAdult = buildMemberTypeOption({
  id: 'f47ac10b-58cc-4372-a567-0000000000c1',
  code: 'ADULTO',
  name: 'Socio Adulto',
  active: true,
});

const typeJunior = buildMemberTypeOption({
  id: 'f47ac10b-58cc-4372-a567-0000000000c2',
  code: 'JUVENIL',
  name: 'Socio Juvenil',
  active: true,
});

describe('useMemberTypes (fee-plans)', () => {
  it('deberia retornar lista de tipos de socio', async () => {
    // Arrange
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json(apiResponse([typeAdult, typeJunior]));
      }),
    );

    // Act
    const { result } = renderHook(() => useMemberTypes());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Socio Adulto');
    expect(result.current.data?.[1].name).toBe('Socio Juvenil');
  });

  it('deberia retornar lista vacia cuando no hay tipos', async () => {
    // Arrange
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json(apiResponse([]));
      }),
    );

    // Act
    const { result } = renderHook(() => useMemberTypes());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useMemberTypes());

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deberia ejecutar la query inmediatamente (sin enabled condicional)', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/member-types', () => {
        callCount++;
        return HttpResponse.json(apiResponse([typeAdult]));
      }),
    );

    // Act
    const { result } = renderHook(() => useMemberTypes());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(1);
  });

  it('deberia incluir campos code y active en cada tipo (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json(apiResponse([typeAdult, typeJunior]));
      }),
    );

    // Act
    const { result } = renderHook(() => useMemberTypes());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].code).toBe('ADULTO');
    expect(result.current.data?.[0].active).toBe(true);
    expect(result.current.data?.[1].code).toBe('JUVENIL');
  });
});
