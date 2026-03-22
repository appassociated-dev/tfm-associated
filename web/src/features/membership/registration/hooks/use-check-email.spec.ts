// Tests para useCheckEmail — hook de query con debounce de 500ms
// que verifica unicidad de email. Usa useDebouncedValue de Mantine
// y valida formato basico de email antes de ejecutar la query.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { useCheckEmail } from './use-check-email';

describe('useCheckEmail', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deberia retornar exists:false para email no registrado', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-email/:email', () => {
        return HttpResponse.json(apiResponse({ exists: false }));
      }),
    );

    // Act
    const { result } = renderHook(() => useCheckEmail('nuevo@club.es'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.exists).toBe(false);
  });

  it('deberia retornar exists:true para email ya registrado', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-email/:email', () => {
        return HttpResponse.json(apiResponse({ exists: true }));
      }),
    );

    // Act
    const { result } = renderHook(() => useCheckEmail('existente@club.es'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.exists).toBe(true);
  });

  it('no deberia ejecutar query con email vacio', async () => {
    // Act
    const { result } = renderHook(() => useCheckEmail(''));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('no deberia ejecutar query con formato de email invalido', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/members/check-email/:email', () => {
        callCount++;
        return HttpResponse.json(apiResponse({ exists: false }));
      }),
    );

    // Act — email sin @ (formato invalido)
    const { result } = renderHook(() => useCheckEmail('no-es-email'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(callCount).toBe(0);
  });

  it('no deberia ejecutar query con email parcial sin dominio', async () => {
    // Arrange
    let callCount = 0;
    server.use(
      http.get('*/v1/members/check-email/:email', () => {
        callCount++;
        return HttpResponse.json(apiResponse({ exists: false }));
      }),
    );

    // Act — email sin dominio completo
    const { result } = renderHook(() => useCheckEmail('user@'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
    expect(callCount).toBe(0);
  });

  it('deberia manejar error de la API', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-email/:email', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useCheckEmail('test@club.es'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deberia aceptar emails con diferentes formatos validos (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/members/check-email/:email', () => {
        return HttpResponse.json(apiResponse({ exists: false }));
      }),
    );

    // Act — email con subdominio
    const { result } = renderHook(() => useCheckEmail('user@sub.domain.com'));

    await vi.advanceTimersByTimeAsync(600);

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.exists).toBe(false);
  });
});
