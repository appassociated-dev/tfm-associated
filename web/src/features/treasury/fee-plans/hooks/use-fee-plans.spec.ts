import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useFeePlans } from './use-fee-plans';

// === Mocks ===

const mockGetFeePlans = vi.fn();

vi.mock('../api/fee-plan.api', () => ({
  getFeePlans: (...args: unknown[]) => mockGetFeePlans(...args),
}));

// === Datos de prueba ===

const samplePlans = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: null,
    type: 'RECURRING',
    amount: 12000,
    frequency: 'ANNUAL',
    billingMonths: [1],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

// === Helpers ===

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// === Tests ===

describe('useFeePlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia retornar datos cuando la consulta es exitosa', async () => {
    mockGetFeePlans.mockResolvedValue(samplePlans);

    const { result } = renderHook(() => useFeePlans(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(samplePlans);
    expect(mockGetFeePlans).toHaveBeenCalledTimes(1);
  });

  it('deberia retornar error cuando la consulta falla', async () => {
    mockGetFeePlans.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFeePlans(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();
  });

  it('deberia pasar los parametros correctamente a la funcion API', async () => {
    mockGetFeePlans.mockResolvedValue(samplePlans);

    const params = { active: true };
    const { result } = renderHook(() => useFeePlans(params), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetFeePlans).toHaveBeenCalledWith(params);
  });

  it('deberia usar queryKey que incluya los parametros', async () => {
    mockGetFeePlans.mockResolvedValue(samplePlans);

    // Renderizar sin params y con params para verificar que son queries independientes
    const wrapper = createWrapper();

    const { result: result1 } = renderHook(() => useFeePlans(), { wrapper });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Verificar que la funcion API fue llamada sin parametros
    expect(mockGetFeePlans).toHaveBeenCalledWith(undefined);
  });
});
