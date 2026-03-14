import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LinkMemberTypesModal } from './link-member-types-modal';

// === Mocks ===

const mockMemberTypes = [
  { id: '111e8400-e29b-41d4-a716-446655440001', code: 'TITULAR', name: 'Titular', active: true },
  { id: '222e8400-e29b-41d4-a716-446655440002', code: 'FAMILIAR', name: 'Familiar', active: true },
  { id: '333e8400-e29b-41d4-a716-446655440003', code: 'JUVENIL', name: 'Juvenil', active: true },
];

vi.mock('../hooks/use-member-types', () => ({
  useMemberTypes: () => ({
    data: mockMemberTypes,
    isLoading: false,
  }),
}));

vi.mock('../hooks/use-link-member-types', () => ({
  useLinkMemberTypes: () => ({
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

function renderModal(props: Partial<Parameters<typeof LinkMemberTypesModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    planId: VALID_UUID,
    planName: 'Cuota Anual',
    currentLinks: [],
    ...props,
  };

  return render(createElement(LinkMemberTypesModal, defaultProps), { wrapper: TestWrapper });
}

// === Tests ===

describe('LinkMemberTypesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar la lista de tipos de socio con checkboxes cuando esta abierto', () => {
    renderModal();

    // Verificar que se renderizan los tres tipos de socio
    expect(screen.getByText('Titular')).toBeInTheDocument();
    expect(screen.getByText('Familiar')).toBeInTheDocument();
    expect(screen.getByText('Juvenil')).toBeInTheDocument();

    // Verificar que existen los checkboxes con aria-label correcto
    expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Seleccionar Familiar' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Seleccionar Juvenil' })).toBeInTheDocument();
  });

  it('deberia mostrar el nombre del plan en el subtitulo', () => {
    renderModal({ planName: 'Cuota Trimestral' });

    expect(screen.getByText('Cuota Trimestral')).toBeInTheDocument();
  });

  it('deberia mostrar radio buttons para seleccion de default por cada tipo de socio', () => {
    renderModal();

    // Radio buttons con aria-label para cada tipo
    expect(screen.getByRole('radio', { name: 'Marcar Titular como default' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Marcar Familiar como default' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Marcar Juvenil como default' })).toBeInTheDocument();
  });

  it('deberia mostrar campos NumberInput de orden para cada tipo de socio', () => {
    renderModal();

    // NumberInputs con aria-label para cada tipo
    expect(screen.getByRole('textbox', { name: 'Orden de Titular' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Orden de Familiar' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Orden de Juvenil' })).toBeInTheDocument();
  });

  it('deberia mostrar los codigos de los tipos de socio en la tabla', () => {
    renderModal();

    expect(screen.getByText('TITULAR')).toBeInTheDocument();
    expect(screen.getByText('FAMILIAR')).toBeInTheDocument();
    expect(screen.getByText('JUVENIL')).toBeInTheDocument();
  });

  it('deberia mostrar boton Cancelar y boton Guardar vinculaciones', () => {
    renderModal();

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Guardar vinculaciones')).toBeInTheDocument();
  });

  it('deberia tener el boton Guardar deshabilitado cuando no hay tipos seleccionados', () => {
    renderModal();

    const saveButton = screen.getByText('Guardar vinculaciones').closest('button')!;
    expect(saveButton).toBeDisabled();
  });

  it('deberia mostrar el titulo del modal', () => {
    renderModal();

    expect(screen.getByText('Vincular a Tipos de Socio')).toBeInTheDocument();
  });
});
