import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { MemberSubscriptionsPage } from './member-subscriptions.page';

// === Mocks ===

const mockUseSubscriptions = vi.fn();
const mockUseCreateSubscription = vi.fn();
const mockUsePermissions = vi.fn();
const mockUseParams = vi.fn();

vi.mock('../hooks/use-subscriptions', () => ({
  useSubscriptions: (...args: unknown[]) => mockUseSubscriptions(...args),
}));

vi.mock('../hooks/use-create-subscription', () => ({
  useCreateSubscription: (...args: unknown[]) => mockUseCreateSubscription(...args),
}));

vi.mock('@/features/auth/context/use-permissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

// Mock de los modales para evitar dependencias profundas
vi.mock('../components/change-plan-modal', () => ({
  ChangePlanModal: () => null,
}));

vi.mock('../components/update-discount-modal', () => ({
  UpdateDiscountModal: () => null,
}));

vi.mock('../components/exemption-modal', () => ({
  ExemptionModal: () => null,
}));

vi.mock('../components/subscription-selector', () => ({
  SubscriptionSelector: () =>
    createElement('div', { 'data-testid': 'subscription-selector' }, 'Selector Mock'),
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const activeSubscription = {
  id: VALID_UUID,
  feePlanId: VALID_UUID_2,
  feePlanName: 'Cuota Anual',
  feePlanCode: 'CUOTA-ANUAL',
  feePlanType: 'RECURRING',
  baseAmount: 12000,
  typeDiscount: null,
  personalDiscount: null,
  personalDiscountReason: null,
  effectiveAmount: 12000,
  registrationDate: '2026-01-01T00:00:00.000Z',
  leaveDate: null,
  cancelReason: null,
  chargesGenerated: 3,
  totalCollected: 36000,
};

const closedSubscription = {
  ...activeSubscription,
  id: '770e8400-e29b-41d4-a716-446655440002',
  feePlanName: 'Plan Anterior',
  leaveDate: '2025-12-31T23:59:59.000Z',
  cancelReason: 'PLAN_CHANGE' as const,
};

const subscriptionsDataWithActive = {
  memberId: VALID_UUID,
  memberName: 'Juan Garcia',
  memberTypeId: VALID_UUID_2,
  memberTypeName: 'Socio Numerario',
  activeSubscription,
  closedSubscriptions: [closedSubscription],
};

const subscriptionsDataWithoutActive = {
  memberId: VALID_UUID,
  memberName: 'Maria Lopez',
  memberTypeId: VALID_UUID_2,
  memberTypeName: 'Socio Numerario',
  activeSubscription: null,
  closedSubscriptions: [],
};

// === Helpers ===

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      MemoryRouter,
      null,
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MantineProvider, null, children),
      ),
    );
  };
}

function renderPage() {
  return render(createElement(MemberSubscriptionsPage), {
    wrapper: createWrapper(),
  });
}

// === Setup comun ===

function setupDefaultMocks(
  overrides: {
    data?: typeof subscriptionsDataWithActive | typeof subscriptionsDataWithoutActive | undefined;
    isLoading?: boolean;
    isError?: boolean;
    permissions?: string[];
  } = {},
) {
  const {
    data = subscriptionsDataWithActive,
    isLoading = false,
    isError = false,
    permissions = ['treasury:subscriptions:create', 'treasury:subscriptions:update'],
  } = overrides;

  mockUseParams.mockReturnValue({ memberId: VALID_UUID });

  mockUseSubscriptions.mockReturnValue({
    data,
    isLoading,
    isError,
    refetch: vi.fn(),
  });

  mockUseCreateSubscription.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  });

  mockUsePermissions.mockReturnValue({
    permissions,
    hasPermission: (perm: string) => permissions.includes(perm),
    hasAnyPermission: (perms: string[]) => perms.some((p) => permissions.includes(p)),
    hasAllPermissions: (perms: string[]) => perms.every((p) => permissions.includes(p)),
  });
}

// === Tests ===

describe('MemberSubscriptionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia mostrar la tarjeta de suscripcion activa cuando hay datos', () => {
    setupDefaultMocks();
    renderPage();

    // Titulo de seccion
    expect(screen.getByText('Suscripción Activa')).toBeInTheDocument();
    // Nombre del plan activo
    expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
    // Codigo del plan
    expect(screen.getByText('CUOTA-ANUAL')).toBeInTheDocument();
  });

  it('deberia mostrar mensaje "Sin suscripcion activa" cuando no hay suscripcion activa', () => {
    setupDefaultMocks({ data: subscriptionsDataWithoutActive });
    renderPage();

    expect(screen.getByText('Sin suscripción activa')).toBeInTheDocument();
  });

  it('deberia mostrar boton "Crear Suscripcion" cuando no hay activa y tiene permiso', () => {
    setupDefaultMocks({
      data: subscriptionsDataWithoutActive,
      permissions: ['treasury:subscriptions:create'],
    });
    renderPage();

    expect(screen.getByText('Crear Suscripción')).toBeInTheDocument();
  });

  it('deberia ocultar botones de accion sin permiso de actualizacion', () => {
    setupDefaultMocks({
      permissions: ['treasury:subscriptions:create'],
    });
    renderPage();

    // Los botones de accion requieren permiso update
    expect(screen.queryByText('Cambiar Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Modificar Descuento')).not.toBeInTheDocument();
    expect(screen.queryByText('Exención Temporal')).not.toBeInTheDocument();
  });

  it('deberia mostrar botones de accion con permiso de actualizacion', () => {
    setupDefaultMocks({
      permissions: ['treasury:subscriptions:update'],
    });
    renderPage();

    expect(screen.getByText('Cambiar Plan')).toBeInTheDocument();
    expect(screen.getByText('Modificar Descuento')).toBeInTheDocument();
    expect(screen.getByText('Exención Temporal')).toBeInTheDocument();
  });

  it('deberia mostrar el historico de suscripciones como timeline', () => {
    setupDefaultMocks();
    renderPage();

    // Titulo de seccion historico
    expect(screen.getByText('Histórico de Suscripciones')).toBeInTheDocument();
    // Nombre del plan cerrado en el timeline
    expect(screen.getByText('Plan Anterior')).toBeInTheDocument();
    // Badge de motivo de cancelacion
    expect(screen.getByText('Cambio de plan')).toBeInTheDocument();
  });

  it('deberia no mostrar seccion de historico cuando no hay suscripciones cerradas', () => {
    setupDefaultMocks({ data: subscriptionsDataWithoutActive });
    renderPage();

    expect(screen.queryByText('Histórico de Suscripciones')).not.toBeInTheDocument();
  });

  it('deberia mostrar el nombre del socio en la cabecera', () => {
    setupDefaultMocks();
    renderPage();

    expect(screen.getByText('Juan Garcia')).toBeInTheDocument();
  });
});
