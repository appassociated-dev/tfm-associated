import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SubscriptionSelector } from './subscription-selector';

// === Mocks ===

const mockUseFeePlans = vi.fn();

vi.mock('@/features/treasury/fee-plans/hooks/use-fee-plans', () => ({
  useFeePlans: (...args: unknown[]) => mockUseFeePlans(...args),
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const samplePlans = [
  {
    id: VALID_UUID,
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
  {
    id: VALID_UUID_2,
    code: 'INSCRIPCION',
    name: 'Inscripcion',
    description: 'Cuota unica de inscripcion',
    type: 'ONE_TIME',
    amount: 5000,
    frequency: null,
    billingMonths: [],
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
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MantineProvider, null, children),
    );
  };
}

function renderSelector(props: Partial<Parameters<typeof SubscriptionSelector>[0]> = {}) {
  const defaultProps = {
    memberTypeId: VALID_UUID,
    typeDiscount: null,
    onSelect: vi.fn(),
    ...props,
  };

  return render(createElement(SubscriptionSelector, defaultProps), {
    wrapper: createWrapper(),
  });
}

// === Tests ===

describe('SubscriptionSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia mostrar skeletons de carga cuando los planes estan cargando', () => {
    mockUseFeePlans.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderSelector();

    // Mantine Skeleton renderiza elementos con role structure o data-mantine-skeleton
    // En estado de carga, no deberia mostrar tarjetas de planes
    expect(screen.queryByText('Cuota Anual')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirmar selección')).not.toBeInTheDocument();
  });

  it('deberia mostrar tarjetas de planes cuando los datos estan disponibles', () => {
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSelector();

    expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
    expect(screen.getByText('Inscripcion')).toBeInTheDocument();
    // Los badges de tipo
    expect(screen.getByText('Periódico')).toBeInTheDocument();
    expect(screen.getByText('Única')).toBeInTheDocument();
  });

  it('deberia mostrar el boton de confirmar con color brand', () => {
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSelector();

    const confirmButton = screen.getByText('Confirmar selección');
    expect(confirmButton).toBeInTheDocument();
    // El boton debe estar deshabilitado si no hay plan seleccionado
    expect(confirmButton.closest('button')).toBeDisabled();
  });

  it('deberia mostrar alerta de error cuando falla la carga', () => {
    mockUseFeePlans.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderSelector();

    expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('deberia mostrar alerta cuando no hay planes disponibles', () => {
    mockUseFeePlans.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSelector();

    expect(screen.getByText('Sin planes disponibles')).toBeInTheDocument();
  });

  it('deberia mostrar importe con descuento por tipo en las tarjetas', () => {
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // Renderizar con descuento por tipo del 30%
    renderSelector({ typeDiscount: 0.3 });

    // Deberia mostrar "Con dto. tipo (30%)" en las tarjetas
    const discountLabels = screen.getAllByText(/Con dto\. tipo \(30%\)/);
    expect(discountLabels.length).toBeGreaterThan(0);
  });
});
