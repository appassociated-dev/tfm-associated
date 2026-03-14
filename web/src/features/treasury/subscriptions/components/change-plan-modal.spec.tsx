import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FeeSubscription } from '../schemas/subscription.schemas';
import type { FeePlan } from '../../fee-plans/schemas/fee-plan.schemas';
import { ChangePlanModal } from './change-plan-modal';

// === Mocks ===

const mockFeePlans: FeePlan[] = [
  {
    id: 'plan-001',
    code: 'ANUAL',
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
    id: 'plan-002',
    code: 'TRIMESTRAL',
    name: 'Cuota Trimestral',
    description: null,
    type: 'RECURRING',
    amount: 4000,
    frequency: 'QUARTERLY',
    billingMonths: [1, 4, 7, 10],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'plan-003',
    code: 'MENSUAL',
    name: 'Cuota Mensual',
    description: null,
    type: 'RECURRING',
    amount: 1500,
    frequency: 'MONTHLY',
    billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

vi.mock('../../fee-plans/hooks/use-fee-plans', () => ({
  useFeePlans: () => ({
    data: mockFeePlans,
    isLoading: false,
  }),
}));

vi.mock('../hooks/use-change-plan', () => ({
  useChangePlan: () => ({
    mutate: vi.fn(),
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

function createMockSubscription(overrides: Partial<FeeSubscription> = {}): FeeSubscription {
  return {
    id: 'sub-001',
    feePlanId: 'plan-001',
    feePlanName: 'Cuota Anual',
    feePlanCode: 'ANUAL',
    feePlanType: 'RECURRING',
    baseAmount: 12000,
    typeDiscount: 0.3,
    personalDiscount: 0.1,
    personalDiscountReason: 'Familiar directo',
    effectiveAmount: 7560,
    registrationDate: '2026-01-01T00:00:00.000Z',
    leaveDate: null,
    cancelReason: null,
    chargesGenerated: 3,
    totalCollected: 22680,
    ...overrides,
  };
}

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

function renderModal(props: Partial<Parameters<typeof ChangePlanModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    memberAccountId: 'test-member-account-id',
    subscription: createMockSubscription(),
    ...props,
  };

  return render(createElement(ChangePlanModal, defaultProps), { wrapper: TestWrapper });
}

// === Tests ===

describe('ChangePlanModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar la informacion del plan actual (nombre y codigo)', () => {
    renderModal();

    expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
    expect(screen.getByText('ANUAL')).toBeInTheDocument();
  });

  it('deberia mostrar el importe base del plan actual formateado', () => {
    renderModal();

    // 12000 centavos = 120,00 EUR
    expect(screen.getByText(/120,00/)).toBeInTheDocument();
  });

  it('deberia mostrar el selector de nuevo plan (Select)', () => {
    renderModal();

    // El Select de Mantine renderiza un input con placeholder
    expect(screen.getByPlaceholderText('Selecciona un plan')).toBeInTheDocument();
  });

  it('deberia mostrar las opciones de fecha efectiva (SegmentedControl con 3 opciones)', () => {
    renderModal();

    expect(screen.getByText('Inmediato (proximo cargo)')).toBeInTheDocument();
    expect(screen.getByText('Inicio proximo mes')).toBeInTheDocument();
    expect(screen.getByText('Inicio proximo ejercicio')).toBeInTheDocument();
  });

  it('deberia mostrar alerta informativa sobre cancelacion de cargos futuros', () => {
    renderModal();

    expect(
      screen.getByText('Los cargos futuros del plan actual se cancelaran'),
    ).toBeInTheDocument();
  });

  it('deberia mostrar checkbox de mantener cargos pendientes', () => {
    renderModal();

    expect(
      screen.getByText('Mantener cargos pendientes (la deuda se arrastra al nuevo plan)'),
    ).toBeInTheDocument();
  });

  it('deberia mostrar botones Cancelar y Confirmar Cambio', () => {
    renderModal();

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    const confirmButton = screen.getByText('Confirmar Cambio').closest('button')!;
    expect(confirmButton).toBeInTheDocument();
  });

  it('deberia tener el boton Confirmar Cambio deshabilitado cuando no hay plan seleccionado', () => {
    renderModal();

    const confirmButton = screen.getByText('Confirmar Cambio').closest('button')!;
    expect(confirmButton).toBeDisabled();
  });

  it('deberia mostrar el titulo del modal "Cambiar Plan"', () => {
    renderModal();

    expect(screen.getByText('Cambiar Plan')).toBeInTheDocument();
  });

  it('deberia mostrar porcentajes de descuento del plan actual', () => {
    renderModal();

    // typeDiscount 0.30 => "Dto. tipo: 30%"
    expect(screen.getByText(/Dto\. tipo: 30%/)).toBeInTheDocument();
    // personalDiscount 0.10 => "Dto. personal: 10%"
    expect(screen.getByText(/Dto\. personal: 10%/)).toBeInTheDocument();
  });
});
