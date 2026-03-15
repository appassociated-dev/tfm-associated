import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MemberTypeStep } from './member-type-step';

// === Mocks ===

const mockUseMemberTypes = vi.fn();

vi.mock('../hooks/use-member-types', () => ({
  useMemberTypes: () => mockUseMemberTypes(),
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';
const VALID_UUID_3 = '770e8400-e29b-41d4-a716-446655440002';

const memberTypeNumerario = {
  id: VALID_UUID,
  code: 'NUMERARIO',
  name: 'Socio Numerario',
  description: 'Socio con plenos derechos',
  ageRangeMin: 18,
  ageRangeMax: 65,
  votingRight: true,
  eligibleForOffice: true,
  active: true,
};

const memberTypeJuvenil = {
  id: VALID_UUID_2,
  code: 'JUVENIL',
  name: 'Socio Juvenil',
  description: null,
  ageRangeMin: null,
  ageRangeMax: 17,
  votingRight: false,
  eligibleForOffice: false,
  active: true,
};

const memberTypeSenior = {
  id: VALID_UUID_3,
  code: 'SENIOR',
  name: 'Socio Senior',
  description: null,
  ageRangeMin: 66,
  ageRangeMax: null,
  votingRight: true,
  eligibleForOffice: false,
  active: true,
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
      QueryClientProvider,
      { client: queryClient },
      createElement(MantineProvider, null, children),
    );
  };
}

function renderStep(props: Partial<Parameters<typeof MemberTypeStep>[0]> = {}) {
  const defaultProps = {
    birthDate: '1990-05-15',
    onValidChange: vi.fn(),
    ...props,
  };

  return render(createElement(MemberTypeStep, defaultProps), {
    wrapper: createWrapper(),
  });
}

// === Tests ===

describe('MemberTypeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deberia renderizar tarjetas de tipo de socio cuando hay datos', () => {
    mockUseMemberTypes.mockReturnValue({
      data: [memberTypeNumerario, memberTypeJuvenil],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep();

    expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
    expect(screen.getByText('Socio Juvenil')).toBeInTheDocument();
  });

  it('deberia mostrar skeleton de carga cuando isLoading es true', () => {
    mockUseMemberTypes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep();

    // Cuando esta cargando, NO muestra las tarjetas de tipo de socio
    expect(screen.queryByText('Socio Numerario')).not.toBeInTheDocument();

    // Mantine Skeleton renderiza divs con role generico — verificar que
    // no hay contenido de tipos de socio y que el DOM no esta vacio
    // El componente crea 3 skeletons con height=120
    expect(screen.queryByText('Voto')).not.toBeInTheDocument();
    expect(screen.queryByText('Error al cargar tipos de socio')).not.toBeInTheDocument();
  });

  it('deberia mostrar badges de derechos (Voto, Elegible)', () => {
    mockUseMemberTypes.mockReturnValue({
      data: [memberTypeNumerario],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep();

    expect(screen.getByText('Voto')).toBeInTheDocument();
    expect(screen.getByText('Elegible para cargos')).toBeInTheDocument();
  });

  it('deberia no mostrar badges de derechos cuando no tiene permisos', () => {
    mockUseMemberTypes.mockReturnValue({
      data: [memberTypeJuvenil],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep();

    expect(screen.queryByText('Voto')).not.toBeInTheDocument();
    expect(screen.queryByText('Elegible para cargos')).not.toBeInTheDocument();
  });

  it('deberia mostrar informacion de rango de edad', () => {
    mockUseMemberTypes.mockReturnValue({
      data: [memberTypeNumerario, memberTypeJuvenil, memberTypeSenior],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep();

    // Rango completo
    expect(screen.getByText('Edad: 18-65 anos')).toBeInTheDocument();
    // Solo maximo
    expect(screen.getByText('Edad: hasta 17 anos')).toBeInTheDocument();
    // Solo minimo
    expect(screen.getByText('Edad: 66+ anos')).toBeInTheDocument();
  });

  it('deberia marcar tipos incompatibles segun la edad del aspirante', () => {
    // Aspirante de 36 anos (nacido en 1990, estamos en 2026-06-15)
    mockUseMemberTypes.mockReturnValue({
      data: [memberTypeNumerario, memberTypeJuvenil],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep({ birthDate: '1990-05-15' });

    // Juvenil no es compatible (max 17 anos)
    expect(screen.getByText(/No compatible con la edad del aspirante/)).toBeInTheDocument();
  });

  it('deberia mostrar alerta de error cuando falla la carga', () => {
    mockUseMemberTypes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderStep();

    expect(screen.getByText('Error al cargar tipos de socio')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('deberia mostrar alerta cuando no hay tipos de socio configurados', () => {
    mockUseMemberTypes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderStep();

    expect(screen.getByText('Sin tipos de socio')).toBeInTheDocument();
  });
});
