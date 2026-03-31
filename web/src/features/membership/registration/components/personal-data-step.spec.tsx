import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { PersonalDataStep } from './personal-data-step';

// === Helpers ===

function renderStep(props: Partial<Parameters<typeof PersonalDataStep>[0]> = {}) {
  const defaultProps = {
    onValidChange: vi.fn(),
    ...props,
  };

  return {
    ...render(<PersonalDataStep {...defaultProps} />),
    props: defaultProps,
  };
}

// === Tests ===

describe('PersonalDataStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 5, 15)); // mes 0-indexado: 5 = junio

    // MSW: DNI y email no existen por defecto
    server.use(
      http.get('*/v1/members/check-dni/:docType/:dni', () =>
        HttpResponse.json(apiResponse({ exists: false })),
      ),
      http.get('*/v1/members/check-email/:email', () =>
        HttpResponse.json(apiResponse({ exists: false })),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('renderizado de campos', () => {
    it('deberia renderizar todos los campos obligatorios', () => {
      renderStep();

      expect(screen.getByLabelText(/DNI\/NIE/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Apellidos/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha de nacimiento/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    });

    it('deberia renderizar los campos opcionales', () => {
      renderStep();

      expect(screen.getByLabelText(/Telefono/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Direccion/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Codigo postal/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ciudad/)).toBeInTheDocument();
    });

    it('deberia tener el campo email con type email', () => {
      renderStep();

      const emailInput = screen.getByLabelText(/Email/);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('deberia tener el campo fecha de nacimiento con placeholder dd/mm/aaaa', () => {
      renderStep();

      const birthDateInput = screen.getByLabelText(/Fecha de nacimiento/);
      expect(birthDateInput).toHaveAttribute('placeholder', 'dd/mm/aaaa');
    });
  });

  describe('edad calculada', () => {
    it('deberia mostrar la edad calculada cuando birthDate tiene valor', () => {
      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Juan',
          surnames: 'García',
          birthDate: '1996-01-01',
          email: 'juan@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // nacido en 1996, estamos en 2026-06-15 → 30 años
      expect(screen.getByText(/30 años/)).toBeInTheDocument();
    });

    it('deberia mostrar edad diferente para otra fecha (triangulacion)', () => {
      renderStep({
        initialValues: {
          dni: '87654321X',
          name: 'Ana',
          surnames: 'López',
          birthDate: '2001-06-15',
          email: 'ana@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // nacido en 2001-06-15, estamos en 2026-06-15 → exactamente 25 años
      expect(screen.getByText(/25 años/)).toBeInTheDocument();
    });
  });

  describe('interacciones con campos', () => {
    it('deberia permitir escribir en el campo DNI', async () => {
      const { user } = renderStep();

      const dniInput = screen.getByLabelText(/DNI\/NIE/);
      await user.type(dniInput, '12345678Z');

      expect(dniInput).toHaveValue('12345678Z');
    });

    it('deberia permitir escribir en el campo Nombre', async () => {
      const { user } = renderStep();

      const nameInput = screen.getByLabelText(/Nombre/);
      await user.type(nameInput, 'Juan');

      expect(nameInput).toHaveValue('Juan');
    });

    it('deberia permitir escribir en el campo Email', async () => {
      const { user } = renderStep();

      const emailInput = screen.getByLabelText(/Email/);
      await user.type(emailInput, 'juan@ejemplo.com');

      expect(emailInput).toHaveValue('juan@ejemplo.com');
    });
  });

  describe('verificacion de DNI duplicado', () => {
    it('deberia mostrar alerta de DNI duplicado cuando la API indica que existe', async () => {
      // Arrange: MSW devuelve que el DNI existe
      server.use(
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(
            apiResponse({
              exists: true,
              memberName: 'Juan García',
              memberNumber: 'SOC-001',
            }),
          ),
        ),
      );

      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Test',
          surnames: 'Test',
          birthDate: '1990-01-01',
          email: 'test@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/DNI duplicado/)).toBeInTheDocument();
        expect(screen.getByText(/Juan García/)).toBeInTheDocument();
      });
    });

    it('deberia no mostrar alerta cuando el DNI no existe', async () => {
      renderStep({
        initialValues: {
          dni: '99999999R',
          name: 'Test',
          surnames: 'Test',
          birthDate: '1990-01-01',
          email: 'test@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // Esperar un tick para que la consulta API se resuelva
      await waitFor(() => {
        expect(screen.queryByText(/DNI duplicado/)).not.toBeInTheDocument();
      });
    });
  });

  describe('callback onValidChange', () => {
    it('deberia llamar a onValidChange con null cuando los campos requeridos estan vacios', () => {
      const { props } = renderStep();

      // Sin datos, el callback deberia llamarse con null
      expect(props.onValidChange).toHaveBeenCalledWith(null);
    });
  });

  describe('regresion: datos de representante legal no deben persistir al pasar a mayor de edad', () => {
    it('deberia llamar a onValidChange sin campos legalRep cuando birthDate es de adulto', async () => {
      // Renderizar con fecha de adulto (26 años) y datos completos validos
      // El DNI 12345678Z es valido y el MSW devuelve exists: false por defecto
      const { props } = renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Juan',
          surnames: 'García',
          birthDate: '2000-01-01',
          email: 'juan@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // Esperar a que la consulta de DNI se resuelva (MSW devuelve exists: false)
      const mockFn = vi.mocked(props.onValidChange);
      await waitFor(() => {
        const calls = mockFn.mock.calls as [[Record<string, unknown> | null]];
        const validCall = calls.find((call) => call[0] !== null);
        expect(validCall).toBeDefined();
        const data = validCall![0] as Record<string, unknown>;
        expect(data.legalRepresentativeName).toBeUndefined();
        expect(data.legalRepresentativeDocumentNumber).toBeUndefined();
      });
    });
  });

  describe('representante legal - menor de edad', () => {
    it('deberia NO mostrar alerta ni campos de representante cuando el socio es mayor de edad', () => {
      // Fecha: 2000-01-01, sistema en 2026-06-15 → 26 años (mayor)
      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Juan',
          surnames: 'García',
          birthDate: '2000-01-01',
          email: 'juan@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // El alert de menor NO debe estar en el DOM
      expect(screen.queryByText(/menor de edad/i)).not.toBeInTheDocument();
      // Los campos de representante NO deben estar en el DOM
      expect(screen.queryByLabelText(/representante legal/i)).not.toBeInTheDocument();
    });

    it('deberia mostrar alerta y campos de representante cuando el socio es menor de edad', () => {
      // Fecha: 2015-01-01, sistema en 2026-06-15 → 11 años (menor)
      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Niño',
          surnames: 'Test',
          birthDate: '2015-01-01',
          email: 'nino@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // El alert de menor DEBE estar visible
      expect(screen.getByText(/menor de edad/i)).toBeInTheDocument();
      // Los campos de representante DEBEN estar en el DOM
      expect(screen.getByLabelText(/Nombre del representante legal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/DNI del representante legal/i)).toBeInTheDocument();
    });

    it('deberia NO mostrar alerta cuando el socio cumple exactamente 18 años hoy (limite superior)', () => {
      // Sistema en 2026-06-15; nacido el 2008-06-15 → exactamente 18 años → mayor de edad
      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Juan',
          surnames: 'García',
          birthDate: '2008-06-15',
          email: 'juan18@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      expect(screen.queryByText(/menor de edad/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/representante legal/i)).not.toBeInTheDocument();
    });

    it('deberia mostrar alerta cuando el socio tiene exactamente 17 años (menor de edad)', () => {
      // Sistema en 2026-06-15; nacido el 2009-06-15 → exactamente 17 años → menor de edad
      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Ana',
          surnames: 'García',
          birthDate: '2009-06-15',
          email: 'ana17@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      expect(screen.getByText(/menor de edad/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre del representante legal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/DNI del representante legal/i)).toBeInTheDocument();
    });

    it('deberia ocultar alerta y campos de representante si no hay fecha de nacimiento', () => {
      // Sin fecha de nacimiento, no se puede calcular edad → no hay alerta
      renderStep({
        initialValues: {
          dni: '12345678Z',
          name: 'Juan',
          surnames: 'García',
          birthDate: null as unknown as string,
          email: 'juan@test.com',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
        },
      });

      // Sin fecha no se puede calcular menor de edad → alert no visible
      expect(screen.queryByText(/menor de edad/i)).not.toBeInTheDocument();
      // Los campos de representante NO deben estar en el DOM
      expect(screen.queryByLabelText(/representante legal/i)).not.toBeInTheDocument();
    });
  });
});
