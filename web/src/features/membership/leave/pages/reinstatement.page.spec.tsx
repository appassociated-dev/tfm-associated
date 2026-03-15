import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import type { ReinstatementSummary } from '../schemas/member-leave.schemas';
import { ReinstatementPage } from './reinstatement.page';

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

const mockUseReinstatementSummary = vi.fn();

vi.mock('../hooks/use-reinstatement-summary', () => ({
  useReinstatementSummary: (...args: unknown[]) => mockUseReinstatementSummary(...args),
}));

vi.mock('../hooks/use-reinstate-member', () => ({
  useReinstateMember: () => ({
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

const sampleSummary: ReinstatementSummary = {
  memberId: VALID_UUID,
  memberName: 'Carlos Rodríguez Martín',
  memberNumber: 'SOC-015',
  leaveDate: '2025-12-01T00:00:00.000Z',
  leaveType: 'VOLUNTARY_LEAVE',
  pendingDebt: 5000,
  penalty: 2000,
  newRegistrationFee: 3000,
  totalToPay: 10000,
  keepSeniority: true,
  previousSeniorityMonths: 48,
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
  return render(createElement(ReinstatementPage), { wrapper: TestWrapper });
}

// === Tests ===

describe('ReinstatementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReinstatementSummary.mockReturnValue({
      data: sampleSummary,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('deberia renderizar datos del ex-socio', () => {
    renderPage();

    expect(screen.getByText('Carlos Rodríguez Martín')).toBeInTheDocument();
    expect(screen.getByText('#SOC-015')).toBeInTheDocument();
    // Tipo de baja se muestra como StatusBadge
    expect(screen.getByText('Baja Voluntaria')).toBeInTheDocument();
  });

  it('deberia mostrar tabla de desglose de costes', () => {
    renderPage();

    // Conceptos en la tabla de desglose
    expect(screen.getByText('Deuda pendiente')).toBeInTheDocument();
    expect(screen.getByText('Penalizacion')).toBeInTheDocument();
    expect(screen.getByText('Nueva inscripcion')).toBeInTheDocument();
    expect(screen.getByText('Total a pagar')).toBeInTheDocument();
  });

  it('deberia mostrar checkbox de confirmacion de pago', () => {
    renderPage();

    // El checkbox tiene label con el importe total formateado
    // totalToPay = 10000 centavos → "100,00 €"
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('deberia tener boton "Rehabilitar Socio" deshabilitado hasta marcar checkbox', () => {
    renderPage();

    const button = screen.getByText('Rehabilitar Socio').closest('button')!;
    expect(button).toBeDisabled();

    // Marcar el checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Ahora el boton deberia estar habilitado
    expect(button).not.toBeDisabled();
  });

  it('deberia mostrar informacion de antiguedad cuando keepSeniority es true', () => {
    renderPage();

    // Con keepSeniority=true se muestra alerta de recuperacion
    expect(screen.getByText('Recuperacion de antiguedad')).toBeInTheDocument();
    expect(screen.getByText(/48 meses/)).toBeInTheDocument();
  });

  it('deberia mostrar mensaje de antiguedad desde rehabilitacion cuando keepSeniority es false', () => {
    mockUseReinstatementSummary.mockReturnValue({
      data: { ...sampleSummary, keepSeniority: false },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Antiguedad desde rehabilitacion')).toBeInTheDocument();
  });

  it('deberia mostrar skeleton durante estado de carga', () => {
    mockUseReinstatementSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderPage();

    const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('deberia mostrar alerta de error cuando falla la carga', () => {
    mockUseReinstatementSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Error al cargar datos de rehabilitacion')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });
});
