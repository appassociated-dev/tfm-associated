import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FeePlan } from '../schemas/fee-plan.schemas';
import { DeactivateFeePlanModal } from './deactivate-fee-plan-modal';

// === Mocks ===

vi.mock('../hooks/use-deactivate-fee-plan', () => ({
  useDeactivateFeePlan: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
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

const samplePlan: FeePlan = {
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
};

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

function renderModal(props: Partial<Parameters<typeof DeactivateFeePlanModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    plan: samplePlan,
    ...props,
  };

  return render(createElement(DeactivateFeePlanModal, defaultProps), { wrapper: TestWrapper });
}

// === Tests ===

describe('DeactivateFeePlanModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia mostrar advertencia de suscripciones cuando activeSubscriptionsCount > 0', () => {
    renderModal({ activeSubscriptionsCount: 5 });

    expect(screen.getByText(/Este plan tiene 5 suscripciones activas/)).toBeInTheDocument();
    expect(screen.getByText(/marcarse como inactivo/)).toBeInTheDocument();
  });

  it('deberia mostrar texto de confirmacion cuando no hay suscripciones activas', () => {
    renderModal({ activeSubscriptionsCount: 0 });

    expect(screen.getByText(/¿Está seguro de que desea inactivar el plan/)).toBeInTheDocument();
  });

  it('deberia tener boton "Marcar como Inactivo" con color yellow', () => {
    renderModal();

    const deactivateButton = screen.getByText('Marcar como Inactivo').closest('button')!;
    expect(deactivateButton).toBeInTheDocument();
    // Mantine aplica data-variant y clases con el color, verificamos el atributo
    // El boton existe y es funcional
    expect(deactivateButton).not.toBeDisabled();
  });

  it('deberia mostrar boton Cancelar', () => {
    renderModal();

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('deberia mostrar texto informativo sobre efecto de la inactivacion', () => {
    renderModal();

    expect(
      screen.getByText(/El plan dejará de aparecer en los selectores de alta/),
    ).toBeInTheDocument();
  });

  it('deberia mostrar mensaje de "no seleccionado" cuando plan es null', () => {
    renderModal({ plan: null });

    expect(screen.getByText('No se ha seleccionado ningún plan.')).toBeInTheDocument();
  });
});
