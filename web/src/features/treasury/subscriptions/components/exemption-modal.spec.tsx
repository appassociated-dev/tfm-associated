import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ExemptionModal } from './exemption-modal';

// === Mocks ===

vi.mock('../hooks/use-close-subscription', () => ({
  useCloseSubscription: () => ({
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

function renderModal(props: Partial<Parameters<typeof ExemptionModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    memberAccountId: 'test-member-account-id',
    subscriptionId: 'sub-001',
    ...props,
  };

  return render(createElement(ExemptionModal, defaultProps), { wrapper: TestWrapper });
}

// === Tests ===

describe('ExemptionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar el selector de tipo de exencion (SegmentedControl)', () => {
    renderModal();

    expect(screen.getByText('Tipo de exencion')).toBeInTheDocument();
    expect(screen.getByText('Exencion total (sin suscripcion)')).toBeInTheDocument();
    expect(screen.getByText('Exencion con trazabilidad')).toBeInTheDocument();
  });

  it('deberia mostrar texto descriptivo para exencion total (seleccionada por defecto)', () => {
    renderModal();

    expect(screen.getByText(/Se cerrara la suscripcion con motivo EXEMPTION/)).toBeInTheDocument();
  });

  it('deberia mostrar el campo Textarea para motivo', () => {
    renderModal();

    expect(screen.getByText('Motivo de la exencion')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Indique el motivo de la exencion temporal'),
    ).toBeInTheDocument();
  });

  it('deberia mostrar el campo TextInput para "Aprobado por"', () => {
    renderModal();

    expect(screen.getByText('Aprobado por')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"')).toBeInTheDocument();
  });

  it('deberia mostrar alerta informativa sobre no generacion de cargos', () => {
    renderModal();

    expect(
      screen.getByText('No se generaran cargos durante el periodo de exencion'),
    ).toBeInTheDocument();
  });

  it('deberia mostrar botones Cancelar y "Aplicar Exencion"', () => {
    renderModal();

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
    expect(applyButton).toBeInTheDocument();
  });

  it('deberia tener el boton Aplicar Exencion deshabilitado cuando no hay motivo', () => {
    renderModal();

    const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
    expect(applyButton).toBeDisabled();
  });

  it('deberia mostrar el titulo del modal "Exencion Temporal"', () => {
    renderModal();

    expect(screen.getByText('Exencion Temporal')).toBeInTheDocument();
  });
});
