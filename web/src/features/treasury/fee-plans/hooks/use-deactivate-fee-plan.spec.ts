import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDeactivateFeePlan } from './use-deactivate-fee-plan';

// === Mocks ===

const mockDeactivateFeePlan = vi.fn();

vi.mock('../api/fee-plan.api', () => ({
  deactivateFeePlan: (...args: unknown[]) => mockDeactivateFeePlan(...args),
}));

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// === Helpers ===

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children);
    },
    queryClient,
  };
}

// === Tests ===

describe('useDeactivateFeePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia llamar a deactivateFeePlan de la API al ejecutar mutate', async () => {
    mockDeactivateFeePlan.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeactivateFeePlan(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALID_UUID);
    });

    expect(mockDeactivateFeePlan).toHaveBeenCalledTimes(1);
    expect(mockDeactivateFeePlan).toHaveBeenCalledWith(VALID_UUID);
  });

  it('deberia invalidar queries de fee-plans y mostrar notificacion de exito', async () => {
    mockDeactivateFeePlan.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeactivateFeePlan(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALID_UUID);
    });

    // Verificar invalidacion de queries
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['fee-plans'] }),
    );

    // Verificar notificacion de exito
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan inactivado',
        color: 'green',
      }),
    );
  });

  it('deberia manejar error 422 (suscripciones activas) con notificacion roja', async () => {
    const unprocessableError = { response: { status: 422 } };
    mockDeactivateFeePlan.mockRejectedValue(unprocessableError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeactivateFeePlan(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync(VALID_UUID);
      } catch {
        // Se espera que falle
      }
    });

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No se puede inactivar',
          color: 'red',
        }),
      );
    });
  });

  it('deberia tener isPending en false antes de mutar', () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeactivateFeePlan(), { wrapper });

    expect(result.current.isPending).toBe(false);
  });
});
