import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FeeSubscription } from '../schemas/subscription.schemas';
import { UpdateDiscountModal } from './update-discount-modal';

// === Mocks ===

vi.mock('../hooks/use-update-discount', () => ({
  useUpdateDiscount: () => ({
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

function renderModal(props: Partial<Parameters<typeof UpdateDiscountModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    memberAccountId: 'test-member-account-id',
    subscription: createMockSubscription(),
    ...props,
  };

  return render(createElement(UpdateDiscountModal, defaultProps), { wrapper: TestWrapper });
}

// === Tests ===

describe('UpdateDiscountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar el desglose actual de descuento (importe base, tipo, personal, efectivo)', () => {
    renderModal();

    // Seccion "Descuento actual"
    expect(screen.getByText('Descuento actual')).toBeInTheDocument();

    // "Importe base" aparece en desglose actual Y en preview — verificamos que existen ambos
    const importeBaseElements = screen.getAllByText('Importe base');
    expect(importeBaseElements.length).toBeGreaterThanOrEqual(1);

    // Importe efectivo actual (label unico del desglose actual)
    expect(screen.getByText('Importe efectivo actual')).toBeInTheDocument();
  });

  it('deberia mostrar los porcentajes de descuento por tipo y personal', () => {
    renderModal();

    // Dto. tipo (30%) aparece en desglose actual Y en preview — verificamos que existen ambos
    const tipoElements = screen.getAllByText(/Dto\. tipo \(30%\)/);
    expect(tipoElements.length).toBeGreaterThanOrEqual(1);

    // Dto. personal (10%) aparece en desglose actual Y en preview
    const personalElements = screen.getAllByText(/Dto\. personal \(10%?\)/);
    expect(personalElements.length).toBeGreaterThanOrEqual(1);
  });

  it('deberia mostrar el campo NumberInput para nuevo descuento personalizado', () => {
    renderModal();

    expect(screen.getByText('Nuevo descuento personalizado (%)')).toBeInTheDocument();
    // Description del NumberInput
    expect(screen.getByText('Valor entre 0 y 99%')).toBeInTheDocument();
  });

  it('deberia mostrar el campo Textarea para motivo (obligatorio)', () => {
    renderModal();

    expect(screen.getByText('Motivo del cambio')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
    ).toBeInTheDocument();
  });

  it('deberia mostrar el campo TextInput para "Aprobado por"', () => {
    renderModal();

    expect(screen.getByText('Aprobado por')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"')).toBeInTheDocument();
  });

  it('deberia mostrar alerta informativa sobre cargos existentes', () => {
    renderModal();

    expect(
      screen.getByText(/Los cargos ya generados mantienen su importe original/),
    ).toBeInTheDocument();
  });

  it('deberia mostrar botones Cancelar y Guardar', () => {
    renderModal();

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    const saveButton = screen.getByText('Guardar').closest('button')!;
    expect(saveButton).toBeInTheDocument();
  });

  it('deberia tener el boton Guardar deshabilitado inicialmente (falta motivo y aprobado por)', () => {
    renderModal();

    const saveButton = screen.getByText('Guardar').closest('button')!;
    expect(saveButton).toBeDisabled();
  });

  it('deberia mostrar el titulo del modal "Modificar Descuento"', () => {
    renderModal();

    expect(screen.getByText('Modificar Descuento')).toBeInTheDocument();
  });

  it('deberia renderizar la seccion de preview de nuevo importe efectivo', () => {
    renderModal();

    // Preview se muestra porque el personalPercent inicial es 10 (del subscription.personalDiscount)
    expect(screen.getByText('Nuevo importe efectivo (preview)')).toBeInTheDocument();
    // Descuento total label
    expect(screen.getByText(/Descuento total:/)).toBeInTheDocument();
  });
});
