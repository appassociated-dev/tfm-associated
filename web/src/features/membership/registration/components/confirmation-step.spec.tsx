import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/helpers/render';
import { buildMemberType } from '@/test/factories';
import { ConfirmationStep } from './confirmation-step';
import type { PersonalData, MemberType } from '../schemas/member-registration.schemas';

// === Datos de prueba ===

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

const memberTypeNumerario: MemberType = buildMemberType({
  code: 'NUMERARIO',
  name: 'Socio Numerario',
  description: 'Socio con plenos derechos',
  ageRangeMin: 18,
  ageRangeMax: 65,
  votingRight: true,
  eligibleForOffice: true,
});

const registrationPlan = {
  feePlanId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Cuota de Alta',
  amount: 5000, // 50,00 euros
};

// === Helpers ===

function renderStep(props: Partial<Parameters<typeof ConfirmationStep>[0]> = {}) {
  const defaultProps = {
    personalData,
    memberTypeId: memberTypeNumerario.id,
    memberTypes: [memberTypeNumerario],
    registrationPlan,
    onConfirm: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    ...props,
  };

  return {
    ...render(<ConfirmationStep {...defaultProps} />),
    props: defaultProps,
  };
}

// === Tests ===

describe('ConfirmationStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('datos del aspirante', () => {
    it('deberia renderizar el nombre completo y DNI del aspirante', () => {
      renderStep();

      expect(screen.getByText('Juan García López')).toBeInTheDocument();
      expect(screen.getByText('12345678Z')).toBeInTheDocument();
    });

    it('deberia renderizar el email del aspirante', () => {
      renderStep();

      expect(screen.getByText('juan@ejemplo.com')).toBeInTheDocument();
    });

    it('deberia renderizar datos de un segundo aspirante (triangulacion)', () => {
      const secondPersonalData: PersonalData = {
        dni: '87654321X',
        firstName: 'Ana',
        lastName: 'Martín Ruiz',
        birthDate: '2000-03-10',
        email: 'ana@ejemplo.com',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
      };

      renderStep({ personalData: secondPersonalData });

      expect(screen.getByText('Ana Martín Ruiz')).toBeInTheDocument();
      expect(screen.getByText('87654321X')).toBeInTheDocument();
      expect(screen.getByText('ana@ejemplo.com')).toBeInTheDocument();
    });
  });

  describe('tipo de socio', () => {
    it('deberia renderizar el nombre del tipo de socio seleccionado', () => {
      renderStep();

      expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
    });

    it('deberia mostrar "Desconocido" cuando el memberTypeId no coincide', () => {
      renderStep({
        memberTypeId: '999e8400-e29b-41d4-a716-446655440099',
      });

      expect(screen.getByText('Desconocido')).toBeInTheDocument();
    });
  });

  describe('secciones de resumen', () => {
    it('deberia renderizar las tres secciones de resumen', () => {
      renderStep();

      expect(screen.getByText('Datos del aspirante')).toBeInTheDocument();
      expect(screen.getByText('Cargos a generar')).toBeInTheDocument();
      expect(screen.getByText('Al confirmar')).toBeInTheDocument();
    });

    it('deberia mostrar nombre del plan de cuota de alta', () => {
      renderStep();

      expect(screen.getByText('Cuota de Alta')).toBeInTheDocument();
    });

    it('deberia mostrar lista de acciones al confirmar', () => {
      renderStep();

      expect(screen.getByText('Se creara el socio en estado Activo')).toBeInTheDocument();
      expect(screen.getByText('Se generara cargo de inscripcion')).toBeInTheDocument();
      expect(screen.getByText('Se asignará número de socio automáticamente')).toBeInTheDocument();
    });
  });

  describe('boton de confirmacion', () => {
    it('deberia mostrar el boton "Confirmar Alta" habilitado', () => {
      renderStep();

      const button = screen.getByText('Confirmar Alta').closest('button');
      expect(button).not.toBeNull();
      expect(button).not.toBeDisabled();
    });

    it('deberia llamar a onConfirm al hacer click en "Confirmar Alta"', async () => {
      const { user, props } = renderStep();

      // Act
      await user.click(screen.getByText('Confirmar Alta'));

      // Assert
      expect(props.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('deberia deshabilitar el boton cuando isSubmitting es true', () => {
      renderStep({ isSubmitting: true });

      const button = screen.getByText('Confirmar Alta').closest('button');
      expect(button).toBeDisabled();
    });

    it('deberia mostrar estado de carga en el boton cuando isSubmitting es true', () => {
      renderStep({ isSubmitting: true });

      const button = screen.getByText('Confirmar Alta').closest('button');
      // Mantine pone data-loading en el boton cuando loading=true
      expect(button).toHaveAttribute('data-loading');
    });

    it('deberia no ejecutar onConfirm mas de una vez durante envio', async () => {
      // Arrange: onConfirm que simula procesamiento lento
      let resolveConfirm: (() => void) | undefined;
      const onConfirm = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveConfirm = resolve;
          }),
      );

      const { user } = renderStep({ onConfirm });

      // Act: click
      await user.click(screen.getByText('Confirmar Alta'));

      // Assert: se llamo una vez
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Cleanup
      resolveConfirm?.();
    });
  });

  describe('campos opcionales', () => {
    it('deberia mostrar telefono cuando esta presente', () => {
      renderStep();

      expect(screen.getByText('+34 612 345 678')).toBeInTheDocument();
    });

    it('deberia mostrar direccion cuando esta presente', () => {
      renderStep();

      expect(screen.getByText('Calle Mayor 1')).toBeInTheDocument();
    });

    it('deberia no mostrar campos opcionales cuando son null', () => {
      renderStep({
        personalData: {
          ...personalData,
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      expect(screen.queryByText('+34 612 345 678')).not.toBeInTheDocument();
      expect(screen.queryByText('Calle Mayor 1')).not.toBeInTheDocument();
    });
  });

  describe('sin plan de cuota', () => {
    it('deberia mostrar texto alternativo cuando no hay registrationPlan', () => {
      renderStep({ registrationPlan: null });

      expect(screen.getByText('Cuota de inscripcion')).toBeInTheDocument();
      expect(screen.getByText('Determinada por el plan vigente')).toBeInTheDocument();
    });
  });
});
