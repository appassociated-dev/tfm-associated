import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PersonalDataStep } from './personal-data-step';

// === Mocks ===

const mockUseCheckDni = vi.fn();
const mockUseCheckEmail = vi.fn();

vi.mock('../hooks/use-check-dni', () => ({
  useCheckDni: (...args: unknown[]) => mockUseCheckDni(...args),
}));

vi.mock('../hooks/use-check-email', () => ({
  useCheckEmail: (...args: unknown[]) => mockUseCheckEmail(...args),
}));

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

function renderStep(props: Partial<Parameters<typeof PersonalDataStep>[0]> = {}) {
  const defaultProps = {
    onValidChange: vi.fn(),
    ...props,
  };

  return render(createElement(PersonalDataStep, defaultProps), {
    wrapper: createWrapper(),
  });
}

// === Tests ===

describe('PersonalDataStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock por defecto: sin resultado de verificacion de DNI
    mockUseCheckDni.mockReturnValue({
      data: undefined,
      isFetching: false,
    });
    // Mock por defecto: sin resultado de verificacion de email
    mockUseCheckEmail.mockReturnValue({
      data: undefined,
      isFetching: false,
    });
  });

  it('deberia renderizar todos los campos obligatorios', () => {
    renderStep();

    // DNI/NIE
    expect(screen.getByLabelText(/DNI\/NIE/)).toBeInTheDocument();
    // Nombre
    expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
    // Apellidos
    expect(screen.getByLabelText(/Apellidos/)).toBeInTheDocument();
    // Fecha de nacimiento
    expect(screen.getByLabelText(/Fecha de nacimiento/)).toBeInTheDocument();
    // Email
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it('deberia renderizar los campos opcionales', () => {
    renderStep();

    expect(screen.getByLabelText(/Telefono/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Direccion/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Codigo postal/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ciudad/)).toBeInTheDocument();
  });

  it('deberia mostrar la edad calculada cuando birthDate tiene valor', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));

    renderStep({
      initialValues: {
        dni: '12345678Z',
        firstName: 'Juan',
        lastName: 'García',
        birthDate: '1996-01-01',
        email: 'juan@test.com',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
      },
    });

    // La edad calculada deberia ser 30 (nacido en 1996, estamos en 2026)
    expect(screen.getByText(/30 años/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('deberia tener el campo DNI con la etiqueta correcta', () => {
    renderStep();

    const dniInput = screen.getByLabelText(/DNI\/NIE/);
    expect(dniInput).toBeInTheDocument();
    expect(dniInput.tagName).toBe('INPUT');
  });

  it('deberia tener el campo email con type email', () => {
    renderStep();

    const emailInput = screen.getByLabelText(/Email/);
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('deberia tener el campo fecha de nacimiento con placeholder dd/mm/aaaa', () => {
    renderStep();

    const birthDateInput = screen.getByLabelText(/Fecha de nacimiento/);
    // DateInput de Mantine renderiza un input text con placeholder personalizado
    expect(birthDateInput).toBeInTheDocument();
    expect(birthDateInput).toHaveAttribute('placeholder', 'dd/mm/aaaa');
  });

  it('deberia mostrar alerta de DNI duplicado cuando la API indica que existe', () => {
    mockUseCheckDni.mockReturnValue({
      data: {
        exists: true,
        memberName: 'Juan García',
        memberNumber: 'SOC-001',
      },
      isFetching: false,
    });

    renderStep({
      initialValues: {
        dni: '12345678Z',
        firstName: 'Test',
        lastName: 'Test',
        birthDate: '1990-01-01',
        email: 'test@test.com',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
      },
    });

    expect(screen.getByText(/DNI duplicado/)).toBeInTheDocument();
    expect(screen.getByText(/Juan García/)).toBeInTheDocument();
  });
});
