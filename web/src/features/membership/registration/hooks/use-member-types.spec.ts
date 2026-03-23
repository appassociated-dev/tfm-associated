// Tests para useMemberTypes — hook de query que obtiene
// tipos de socio activos con cache de 5 minutos.

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildMemberType } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useMemberTypes } from './use-member-types';

// === Datos de prueba ===

const memberTypeAdult = buildMemberType({
  id: 'f47ac10b-58cc-4372-a567-0000000000c1',
  code: 'ADULTO',
  name: 'Socio Adulto',
  ageRangeMin: 18,
  ageRangeMax: null,
  votingRight: true,
});

const memberTypeJunior = buildMemberType({
  id: 'f47ac10b-58cc-4372-a567-0000000000c2',
  code: 'JUVENIL',
  name: 'Socio Juvenil',
  ageRangeMin: 14,
  ageRangeMax: 17,
  votingRight: false,
});

describe('useMemberTypes', () => {
  it('deberia retornar lista de tipos de socio', async () => {
    // Arrange
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json(apiResponse([memberTypeAdult, memberTypeJunior]));
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

  it('deberia retornar lista vacia cuando no hay tipos configurados', async () => {
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

  it('deberia incluir datos de edad y derechos en cada tipo (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json(apiResponse([memberTypeAdult, memberTypeJunior]));
      }),
    );

    // Act
    const { result } = renderHook(() => useMemberTypes());

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Adulto tiene derecho a voto, juvenil no
    expect(result.current.data?.[0].votingRight).toBe(true);
    expect(result.current.data?.[1].votingRight).toBe(false);

    // Juvenil tiene rango de edad 14-17
    expect(result.current.data?.[1].ageRangeMin).toBe(14);
    expect(result.current.data?.[1].ageRangeMax).toBe(17);
  });
});
