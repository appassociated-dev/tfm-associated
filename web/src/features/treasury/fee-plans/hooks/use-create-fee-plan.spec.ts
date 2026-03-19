import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useCreateFeePlan } from './use-create-fee-plan';
import type { CreateFeePlanInput } from '../schemas/fee-plan.schemas';

// === Mocks ===

const mockCreateFeePlan = vi.fn();

vi.mock('../api/fee-plan.api', () => ({
  createFeePlan: (...args: unknown[]) => mockCreateFeePlan(...args),
}));

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const validInput: CreateFeePlanInput = {
  code: 'CUOTA-ANUAL',
  name: 'Cuota Anual',
  description: null,
  type: 'RECURRING',
  amount: 12000,
  frequency: 'ANNUAL',
  billingMonths: [1],
};

const createdPlan = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  ...validInput,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

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

describe('useCreateFeePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia llamar a createFeePlan de la API al ejecutar mutate', async () => {
    mockCreateFeePlan.mockResolvedValue(createdPlan);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateFeePlan(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    expect(mockCreateFeePlan).toHaveBeenCalledTimes(1);
    expect(mockCreateFeePlan).toHaveBeenCalledWith(validInput);
  });

  it('deberia invalidar queries de fee-plans y mostrar notificacion de exito', async () => {
    mockCreateFeePlan.mockResolvedValue(createdPlan);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateFeePlan(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(validInput);
    });

    // Verificar invalidacion de queries
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['fee-plans'] }),
    );

    // Verificar notificacion de exito
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plan creado',
        color: 'green',
      }),
    );
  });

  it('deberia manejar error 409 (codigo duplicado) con notificacion roja', async () => {
    const conflictError = { response: { status: 409 } };
    mockCreateFeePlan.mockRejectedValue(conflictError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateFeePlan(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync(validInput);
      } catch {
        // Se espera que falle
      }
    });

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Código duplicado',
          color: 'red',
        }),
      );
    });
  });

  it('deberia tener isPending en false antes de mutar', () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateFeePlan(), { wrapper });

    expect(result.current.isPending).toBe(false);
  });
});
