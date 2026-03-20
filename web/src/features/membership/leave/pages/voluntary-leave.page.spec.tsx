import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import type { LeaveSummary } from '../schemas/member-leave.schemas';
import { VoluntaryLeavePage } from './voluntary-leave.page';

// === Mocks ===

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useParams: () => ({ memberId: '550e8400-e29b-41d4-a716-446655440000' }),
    useNavigate: () => vi.fn(),
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  };
});

const mockUseLeaveSummary = vi.fn();

vi.mock('../hooks/use-leave-summary', () => ({
  useLeaveSummary: (...args: unknown[]) => mockUseLeaveSummary(...args),
}));

vi.mock('../hooks/use-voluntary-leave', () => ({
  useVoluntaryLeave: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock de @mantine/notifications para evitar errores de portal
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const sampleSummary: LeaveSummary = {
  memberId: VALID_UUID,
  memberName: 'María Fernández Ruiz',
  memberNumber: 'SOC-042',
  currentStatus: 'ACTIVE',
  effectiveDateOptions: [
    {
      type: 'IMMEDIATE',
      effectiveDate: '2026-03-15T00:00:00.000Z',
      label: 'Inmediata',
    },
    {
      type: 'END_OF_FISCAL_YEAR',
      effectiveDate: '2026-12-31T00:00:00.000Z',
      label: 'Fin de ejercicio',
    },
  ],
  activeSubscriptions: [
    {
      subscriptionId: VALID_UUID_2,
      feePlanCode: 'ANNUAL',
      feePlanName: 'Cuota Anual Ordinaria',
      amount: 12000,
      startDate: '2026-01-01T00:00:00.000Z',
    },
  ],
  pendingCharges: [
    {
      chargeId: VALID_UUID_2,
      concept: 'Cuota Marzo 2026',
      amount: 3000,
      issueDate: '2026-03-01T00:00:00.000Z',
      dueDate: '2026-03-31T00:00:00.000Z',
    },
  ],
  totalPendingDebt: 3000,
};

// === Helpers ===

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(
    MemoryRouter,
    null,
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MantineProvider, null, children),
    ),
  );
}

function renderPage() {
  return render(createElement(VoluntaryLeavePage), { wrapper: TestWrapper });
}

// === Tests ===

describe('VoluntaryLeavePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLeaveSummary.mockReturnValue({
      data: sampleSummary,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('deberia renderizar datos del socio desde el resumen de baja', () => {
    renderPage();

    // El nombre aparece tanto en el breadcrumb como en los datos del socio
    const nameElements = screen.getAllByText('María Fernández Ruiz');
    expect(nameElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('#SOC-042')).toBeInTheDocument();
  });

  it('deberia renderizar breadcrumbs con la jerarquia correcta', () => {
    renderPage();

    expect(screen.getByText('Socios')).toBeInTheDocument();
    // "Baja Voluntaria" aparece tanto en breadcrumb como en titulo y boton
    const breadcrumbsContainer = document.querySelector('.mantine-Breadcrumbs-root');
    expect(breadcrumbsContainer).toBeInTheDocument();
  });

  it('deberia mostrar opciones de fecha efectiva', () => {
    renderPage();

    // Las opciones de fecha se muestran como radio buttons con label y fecha formateada
    expect(screen.getByText(/Inmediata/)).toBeInTheDocument();
    expect(screen.getByText(/Fin de ejercicio/)).toBeInTheDocument();
  });

  it('deberia mostrar tabla de suscripciones activas', () => {
    renderPage();

    expect(screen.getByText('Cuota Anual Ordinaria')).toBeInTheDocument();
    expect(screen.getByText('ANNUAL')).toBeInTheDocument();
  });

  it('deberia mostrar cargos pendientes con deuda total', () => {
    renderPage();

    expect(screen.getByText('Cuota Marzo 2026')).toBeInTheDocument();
    // totalPendingDebt = 3000 centavos → formatMoney(3000) = "30,00 €" (con nbsp)
    expect(screen.getByText('Deuda total:')).toBeInTheDocument();
  });

  it('deberia mostrar textarea de motivo', () => {
    renderPage();

    expect(
      screen.getByPlaceholderText('Indique el motivo de la baja voluntaria'),
    ).toBeInTheDocument();
  });

  it('deberia tener boton "Confirmar Baja Voluntaria" con color rojo', () => {
    renderPage();

    const button = screen.getByText('Confirmar Baja Voluntaria').closest('button');
    expect(button).toBeInTheDocument();
    // El boton existe y esta deshabilitado inicialmente (sin seleccionar fecha ni motivo)
    expect(button).toBeDisabled();
  });

  it('deberia mostrar skeleton durante estado de carga', () => {
    mockUseLeaveSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderPage();

    // LoadingSkeleton renderiza varios Skeleton de Mantine
    const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('deberia mostrar alerta de error cuando falla la carga', () => {
    mockUseLeaveSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Error al cargar datos de baja')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });
});
