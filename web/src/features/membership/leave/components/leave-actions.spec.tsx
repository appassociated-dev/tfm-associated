import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { LeaveActions } from './leave-actions';

// === Mocks ===

const mockUseAvailableTransitions = vi.fn();

vi.mock('../hooks/use-available-transitions', () => ({
  useAvailableTransitions: (...args: unknown[]) => mockUseAvailableTransitions(...args),
}));

const mockHasPermission = vi.fn();

vi.mock('@/features/auth/context/use-permissions', () => ({
  usePermissions: () => ({
    permissions: [],
    hasPermission: mockHasPermission,
    hasAnyPermission: vi.fn(),
    hasAllPermissions: vi.fn(),
  }),
}));

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

function renderActions(memberId = '550e8400-e29b-41d4-a716-446655440000') {
  return render(createElement(LeaveActions, { memberId }), { wrapper: TestWrapper });
}

// === Tests ===

describe('LeaveActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configuracion por defecto: no transiciones, con permisos
    mockUseAvailableTransitions.mockReturnValue({
      data: { currentStatus: 'ACTIVE', availableTransitions: [] },
      isLoading: false,
    });
    mockHasPermission.mockReturnValue(true);
  });

  it('deberia mostrar boton de baja voluntaria cuando la transicion esta disponible y tiene permiso', () => {
    mockUseAvailableTransitions.mockReturnValue({
      data: {
        currentStatus: 'ACTIVE',
        availableTransitions: [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }],
      },
      isLoading: false,
    });
    mockHasPermission.mockImplementation(
      (perm: string) => perm === 'membership:members:deactivate',
    );

    renderActions();

    expect(screen.getByText('Procesar Baja Voluntaria')).toBeInTheDocument();
  });

  it('deberia mostrar boton de rehabilitacion para estado VOLUNTARY_LEAVE', () => {
    mockUseAvailableTransitions.mockReturnValue({
      data: {
        currentStatus: 'VOLUNTARY_LEAVE',
        availableTransitions: [],
      },
      isLoading: false,
    });
    mockHasPermission.mockImplementation((perm: string) => perm === 'membership:members:reinstate');

    renderActions();

    expect(screen.getByText('Rehabilitar Socio')).toBeInTheDocument();
  });

  it('deberia mostrar texto permanente para estado DISCIPLINARY_LEAVE', () => {
    mockUseAvailableTransitions.mockReturnValue({
      data: {
        currentStatus: 'DISCIPLINARY_LEAVE',
        availableTransitions: [],
      },
      isLoading: false,
    });

    renderActions();

    expect(
      screen.getByText('Este socio está dado de baja de forma permanente'),
    ).toBeInTheDocument();
  });

  it('deberia ocultar botones sin permisos', () => {
    mockUseAvailableTransitions.mockReturnValue({
      data: {
        currentStatus: 'VOLUNTARY_LEAVE',
        availableTransitions: [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }],
      },
      isLoading: false,
    });
    // Sin permisos
    mockHasPermission.mockReturnValue(false);

    renderActions();

    expect(screen.queryByText('Procesar Baja Voluntaria')).not.toBeInTheDocument();
    expect(screen.queryByText('Rehabilitar Socio')).not.toBeInTheDocument();
  });

  it('deberia mostrar loader durante estado de carga', () => {
    mockUseAvailableTransitions.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderActions();

    // Mantine Loader renderiza un span con role o clase mantine-Loader-root
    const loader = container.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
  });

  it('deberia mostrar texto permanente para estado DECEASED', () => {
    mockUseAvailableTransitions.mockReturnValue({
      data: {
        currentStatus: 'DECEASED',
        availableTransitions: [],
      },
      isLoading: false,
    });

    renderActions();

    expect(
      screen.getByText('Este socio está dado de baja de forma permanente'),
    ).toBeInTheDocument();
  });
});
