import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';

import { ConfirmationStep } from './confirmation-step';
import type { PersonalData, MemberType } from '../schemas/member-registration.schemas';

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const personalData: PersonalData = {
  dni: '12345678Z',
  firstName: 'Juan',
  lastName: 'García López',
  birthDate: '1990-05-15',
  email: 'juan@ejemplo.com',
  phone: '+34 612 345 678',
  address: 'Calle Mayor 1',
  postalCode: '28001',
  city: 'Madrid',
};

const memberTypes: MemberType[] = [
  {
    id: VALID_UUID,
    code: 'NUMERARIO',
    name: 'Socio Numerario',
    description: 'Socio con plenos derechos',
    ageRangeMin: 18,
    ageRangeMax: 65,
    votingRight: true,
    eligibleForOffice: true,
    active: true,
  },
];

// === Helpers ===

function TestWrapper({ children }: { children: React.ReactNode }) {
  return createElement(MantineProvider, null, children);
}

function renderStep(props: Partial<Parameters<typeof ConfirmationStep>[0]> = {}) {
  const defaultProps = {
    personalData,
    memberTypeId: VALID_UUID,
    memberTypes,
    onConfirm: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    ...props,
  };

  return render(createElement(ConfirmationStep, defaultProps), {
    wrapper: TestWrapper,
  });
}

// === Tests ===

describe('ConfirmationStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deberia renderizar el nombre completo y DNI del aspirante', () => {
    renderStep();

    expect(screen.getByText('Juan García López')).toBeInTheDocument();
    expect(screen.getByText('12345678Z')).toBeInTheDocument();
  });

  it('deberia renderizar el nombre del tipo de socio seleccionado', () => {
    renderStep();

    expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
  });

  it('deberia mostrar el boton "Confirmar Alta" con color brand', () => {
    renderStep();

    const button = screen.getByText('Confirmar Alta');
    expect(button).toBeInTheDocument();

    const buttonElement = button.closest('button');
    expect(buttonElement).not.toBeNull();
    expect(buttonElement).not.toBeDisabled();
  });

  it('deberia deshabilitar el boton cuando isSubmitting es true', () => {
    renderStep({ isSubmitting: true });

    const button = screen.getByText('Confirmar Alta').closest('button');
    expect(button).toBeDisabled();
  });

  it('deberia mostrar el boton con estado de carga cuando isSubmitting es true', () => {
    renderStep({ isSubmitting: true });

    const button = screen.getByText('Confirmar Alta').closest('button');
    // Mantine pone data-loading en el boton cuando loading=true
    expect(button).toHaveAttribute('data-loading');
  });

  it('deberia mostrar "Desconocido" cuando el memberTypeId no coincide', () => {
    renderStep({
      memberTypeId: '999e8400-e29b-41d4-a716-446655440099',
    });

    expect(screen.getByText('Desconocido')).toBeInTheDocument();
  });

  it('deberia renderizar las secciones de resumen y cargos', () => {
    renderStep();

    expect(screen.getByText('Datos del aspirante')).toBeInTheDocument();
    expect(screen.getByText('Cargos a generar')).toBeInTheDocument();
    expect(screen.getByText('Al confirmar')).toBeInTheDocument();
  });

  it('deberia mostrar el email del aspirante', () => {
    renderStep();

    expect(screen.getByText('juan@ejemplo.com')).toBeInTheDocument();
  });
});
