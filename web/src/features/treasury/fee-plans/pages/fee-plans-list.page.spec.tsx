import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FeePlan } from '../schemas/fee-plan.schemas';
import { FeePlansListPage } from './fee-plans-list.page';

// === Mocks ===

const mockHasPermission = vi.fn();
vi.mock('@/features/auth/context/use-permissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
}));

const mockUseFeePlans = vi.fn();
vi.mock('../hooks/use-fee-plans', () => ({
  useFeePlans: (...args: unknown[]) => mockUseFeePlans(...args),
}));

// Mock de modales hijos para aislar la pagina
vi.mock('../components/fee-plan-create-modal', () => ({
  FeePlanCreateModal: () => createElement('div', { 'data-testid': 'create-modal' }),
}));

vi.mock('../components/fee-plan-edit-modal', () => ({
  FeePlanEditModal: () => createElement('div', { 'data-testid': 'edit-modal' }),
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const samplePlans: FeePlan[] = [
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
    id: '660e8400-e29b-41d4-a716-446655440001',
    code: 'INSCRIPCION',
    name: 'Inscripción',
    description: null,
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

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(MantineProvider, null, children),
  );
}

function renderPage() {
  return render(createElement(FeePlansListPage), { wrapper: TestWrapper });
}

// === Tests ===

describe('FeePlansListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto: sin permisos
    mockHasPermission.mockReturnValue(false);
  });

  it('deberia renderizar skeleton de carga cuando los datos estan cargando', () => {
    mockUseFeePlans.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    // El titulo siempre se muestra
    expect(screen.getByText('Planes de Cuota')).toBeInTheDocument();
    // LoadingSkeleton renderiza 5 Skeleton — Mantine usa clase mantine-Skeleton-root
    const skeletons = document.querySelectorAll('.mantine-Skeleton-root');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it('deberia renderizar tabla con planes cuando hay datos disponibles', () => {
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    // Verificar que se muestran los codigos de plan
    expect(screen.getByText('CUOTA-ANUAL')).toBeInTheDocument();
    expect(screen.getByText('INSCRIPCION')).toBeInTheDocument();
    // Verificar que se muestran los nombres
    expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
    expect(screen.getByText('Inscripción')).toBeInTheDocument();
    // Verificar badges de tipo
    expect(screen.getByText('Periódico')).toBeInTheDocument();
    expect(screen.getByText('Única')).toBeInTheDocument();
    // Badge con conteo total
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deberia mostrar estado vacio cuando no hay planes', () => {
    mockUseFeePlans.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('No hay planes de cuota configurados')).toBeInTheDocument();
  });

  it('deberia mostrar boton Nuevo Plan solo cuando el usuario tiene permiso de creacion', () => {
    mockHasPermission.mockImplementation((perm: string) => perm === 'treasury:fee-plans:create');
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Nuevo Plan')).toBeInTheDocument();
  });

  it('deberia ocultar boton Nuevo Plan cuando el usuario NO tiene permiso de creacion', () => {
    mockHasPermission.mockReturnValue(false);
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.queryByText('Nuevo Plan')).not.toBeInTheDocument();
  });

  it('deberia formatear importes con simbolo de euro', () => {
    mockUseFeePlans.mockReturnValue({
      data: samplePlans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    // 12000 centavos = 120,00 € y 5000 centavos = 50,00 €
    // Verificar que el texto contiene el simbolo de euro
    const amountCells = screen.getAllByText(/€/);
    expect(amountCells.length).toBeGreaterThanOrEqual(2);
  });

  it('deberia mostrar alerta de error cuando la consulta falla', () => {
    mockUseFeePlans.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });
});
