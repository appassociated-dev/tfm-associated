import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { SimpleRegistrationPage } from './simple-registration.page';

// === Mocks ===

const mockUseMemberTypes = vi.fn();
const mockUseSimpleRegistration = vi.fn();
const mockUsePreconditions = vi.fn();

vi.mock('../hooks/use-member-types', () => ({
  useMemberTypes: () => mockUseMemberTypes(),
}));

vi.mock('../hooks/use-simple-registration', () => ({
  useSimpleRegistration: () => mockUseSimpleRegistration(),
}));

vi.mock('../hooks/use-preconditions', () => ({
  usePreconditions: () => mockUsePreconditions(),
}));

// Mock de react-router: useBlocker requiere data router, lo sustituimos por no-op
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useBlocker: () => ({
      state: 'unblocked',
      reset: vi.fn(),
      proceed: vi.fn(),
    }),
  };
});

// Mock de los componentes hijo para aislar el test de la pagina
vi.mock('../components/personal-data-step', () => ({
  PersonalDataStep: (props: Record<string, unknown>) =>
    createElement(
      'div',
      { 'data-testid': 'personal-data-step' },
      `Step 1 Mock (onValidChange: ${typeof props.onValidChange})`,
    ),
}));

vi.mock('../components/member-type-step', () => ({
  MemberTypeStep: (props: Record<string, unknown>) =>
    createElement(
      'div',
      { 'data-testid': 'member-type-step' },
      `Step 2 Mock (birthDate: ${props.birthDate})`,
    ),
}));

vi.mock('../components/confirmation-step', () => ({
  ConfirmationStep: () =>
    createElement('div', { 'data-testid': 'confirmation-step' }, 'Step 3 Mock'),
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const memberTypes = [
  {
    id: VALID_UUID,
    code: 'NUMERARIO',
    name: 'Socio Numerario',
    description: null,
    ageRangeMin: 18,
    ageRangeMax: 65,
    votingRight: true,
    eligibleForOffice: true,
    active: true,
  },
];

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
  return render(createElement(SimpleRegistrationPage), {
    wrapper: createWrapper(),
  });
}

// === Tests ===

describe('SimpleRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: precondiciones cumplidas
    mockUsePreconditions.mockReturnValue({
      data: {
        hasFiscalYear: true,
        hasMemberTypes: true,
        hasRegistrationPlan: true,
        registrationPlan: {
          feePlanId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Cuota de Alta',
          amount: 5000,
        },
        errors: [],
      },
      isLoading: false,
    });
  });

  it('deberia renderizar el Stepper con 3 pasos', () => {
    mockUseMemberTypes.mockReturnValue({
      data: memberTypes,
      isLoading: false,
    });
    mockUseSimpleRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderPage();

    // Verificar las etiquetas de los 3 pasos
    expect(screen.getByText('Datos Personales')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Socio')).toBeInTheDocument();
    expect(screen.getByText('Confirmación')).toBeInTheDocument();
  });

  it('deberia mostrar "Datos Personales" como etiqueta del primer paso', () => {
    mockUseMemberTypes.mockReturnValue({
      data: memberTypes,
      isLoading: false,
    });
    mockUseSimpleRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderPage();

    expect(screen.getByText('Datos Personales')).toBeInTheDocument();
    // La descripcion del primer paso
    expect(screen.getByText('Información del aspirante')).toBeInTheDocument();
  });

  it('deberia mostrar "Alta de Socio" como titulo de la pagina', () => {
    mockUseMemberTypes.mockReturnValue({
      data: memberTypes,
      isLoading: false,
    });
    mockUseSimpleRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderPage();

    expect(screen.getByText('Alta de Socio')).toBeInTheDocument();
  });

  it('deberia mostrar estado de carga mientras se cargan los tipos de socio', () => {
    mockUseMemberTypes.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseSimpleRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderPage();

    // Cuando isLoadingTypes es true, no muestra el Stepper ni el titulo
    expect(screen.queryByText('Alta de Socio')).not.toBeInTheDocument();
    expect(screen.queryByText('Datos Personales')).not.toBeInTheDocument();
  });

  it('deberia renderizar los botones de navegacion', () => {
    mockUseMemberTypes.mockReturnValue({
      data: memberTypes,
      isLoading: false,
    });
    mockUseSimpleRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderPage();

    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });

  it('deberia tener el boton "Anterior" deshabilitado en el primer paso', () => {
    mockUseMemberTypes.mockReturnValue({
      data: memberTypes,
      isLoading: false,
    });
    mockUseSimpleRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderPage();

    const previousButton = screen.getByText('Anterior').closest('button');
    expect(previousButton).toBeDisabled();
  });
});
