import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildMemberType } from '@/test/factories';
import { SimpleRegistrationPage } from './simple-registration.page';

// === Mocks ===

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({
      state: 'unblocked',
      reset: vi.fn(),
      proceed: vi.fn(),
    }),
  };
});

// === Datos de prueba ===

const memberTypeNumerario = buildMemberType({
  code: 'NUMERARIO',
  name: 'Socio Numerario',
  description: 'Socio con plenos derechos',
  ageRangeMin: 18,
  ageRangeMax: 65,
  votingRight: true,
  eligibleForOffice: true,
});

const preconditionsOk = {
  hasFiscalYear: true,
  hasMemberTypes: true,
  hasRegistrationPlan: true,
  registrationPlan: {
    feePlanId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Cuota de Alta',
    amount: 5000,
  },
  errors: [],
};

// === Helpers ===

function renderPage() {
  return render(<SimpleRegistrationPage />);
}

// === Tests ===

describe('SimpleRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // MSW defaults: precondiciones OK, tipos de socio
    server.use(
      http.get('*/v1/members/preconditions', () => HttpResponse.json(apiResponse(preconditionsOk))),
      http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([memberTypeNumerario]))),
    );
  });

  describe('renderizado del stepper', () => {
    it('deberia renderizar el Stepper con 3 pasos', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Datos Personales')).toBeInTheDocument();
        expect(screen.getByText('Tipo de Socio')).toBeInTheDocument();
        expect(screen.getByText('Confirmación')).toBeInTheDocument();
      });
    });

    it('deberia mostrar "Alta de Socio" como titulo de la pagina', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Alta de Socio')).toBeInTheDocument();
      });
    });

    it('deberia mostrar descripcion del primer paso', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Información del aspirante')).toBeInTheDocument();
      });
    });
  });

  describe('navegacion del wizard', () => {
    it('deberia tener el boton "Anterior" deshabilitado en el primer paso', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Anterior')).toBeInTheDocument();
      });

      const previousButton = screen.getByText('Anterior').closest('button');
      expect(previousButton).toBeDisabled();
    });

    it('deberia renderizar los botones de navegacion', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Anterior')).toBeInTheDocument();
        expect(screen.getByText('Siguiente')).toBeInTheDocument();
      });
    });

    it('deberia tener boton "Siguiente" deshabilitado cuando el paso no es valido', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Siguiente')).toBeInTheDocument();
      });

      // En el paso 1 sin datos, el boton Siguiente esta deshabilitado
      const nextButton = screen.getByText('Siguiente').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('estado de carga', () => {
    it('deberia mostrar skeleton mientras se cargan los tipos de socio', () => {
      // MSW que nunca responde para member-types
      server.use(http.get('*/v1/member-types', () => new Promise(() => {})));

      renderPage();

      // Cuando isLoadingTypes es true, no muestra el Stepper ni el titulo
      expect(screen.queryByText('Alta de Socio')).not.toBeInTheDocument();
      expect(screen.queryByText('Datos Personales')).not.toBeInTheDocument();
    });

    it('deberia mostrar skeleton mientras se cargan las precondiciones', () => {
      server.use(http.get('*/v1/members/preconditions', () => new Promise(() => {})));

      renderPage();

      expect(screen.queryByText('Alta de Socio')).not.toBeInTheDocument();
    });
  });

  describe('error en precondiciones', () => {
    it('deberia mostrar error cuando falla la consulta de precondiciones', async () => {
      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 }),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Error al verificar precondiciones')).toBeInTheDocument();
      });
    });

    it('deberia mostrar boton "Volver al listado" cuando hay error de precondiciones', async () => {
      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 }),
        ),
      );

      const { user } = renderPage();

      await waitFor(() => {
        expect(screen.getByText('Volver al listado')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Volver al listado'));
      expect(mockNavigate).toHaveBeenCalledWith('/members');
    });
  });

  describe('precondiciones no cumplidas', () => {
    it('deberia mostrar alerta cuando las precondiciones no se cumplen', async () => {
      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(
            apiResponse({
              hasFiscalYear: false,
              hasMemberTypes: true,
              hasRegistrationPlan: false,
              registrationPlan: null,
              errors: [
                'No hay ejercicio fiscal abierto',
                'No hay plan de cuota de alta configurado',
              ],
            }),
          ),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Precondiciones no cumplidas')).toBeInTheDocument();
        expect(screen.getByText('No hay ejercicio fiscal abierto')).toBeInTheDocument();
        expect(screen.getByText('No hay plan de cuota de alta configurado')).toBeInTheDocument();
      });
    });
  });
});
