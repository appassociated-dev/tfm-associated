// Tests para useCheckDni — hook de query con debounce de 500ms
// que verifica unicidad de DNI. Usa useDebouncedValue de Mantine.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useCheckDni } from './use-check-dni';

describe('useCheckDni', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deberia retornar exists:false para DNI no registrado', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-dni/:docType/:dni', () => {
        return HttpResponse.json(apiResponse({ exists: false }));
      }),
    );

    // Act
    const { result } = renderHook(() => useCheckDni('12345678A'));

    // Avanzar timers para que pase el debounce de 500ms
    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.exists).toBe(false);
  });

  it('deberia retornar exists:true para DNI ya registrado', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-dni/:docType/:dni', () => {
        return HttpResponse.json(
          apiResponse({
            exists: true,
            memberName: 'Juan Perez',
            memberNumber: 'SOC-0001',
          }),
        );
      }),
    );

    // Act
    const { result } = renderHook(() => useCheckDni('87654321B'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.exists).toBe(true);
    expect(result.current.data?.memberName).toBe('Juan Perez');
  });

  it('no deberia ejecutar query con DNI menor a 8 caracteres', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/members/check-dni/:docType/:dni', () => {
        callCount++;
        return HttpResponse.json(apiResponse({ exists: false }));
      }),
    );

    // Act — DNI con solo 5 caracteres
    const { result } = renderHook(() => useCheckDni('12345'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert — no deberia haber hecho la peticion
    expect(result.current.fetchStatus).toBe('idle');
    expect(callCount).toBe(0);
  });

  it('no deberia ejecutar query con DNI vacio', async () => {
    // Act
    const { result } = renderHook(() => useCheckDni(''));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('deberia manejar error de la API', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-dni/:docType/:dni', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCheckDni('12345678A'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
