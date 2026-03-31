import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildMemberType } from '@/test/factories';
import { MemberTypeStep } from './member-type-step';

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

const memberTypeJuvenil = buildMemberType({
  code: 'JUVENIL',
  name: 'Socio Juvenil',
  description: null,
  ageRangeMin: null,
  ageRangeMax: 17,
  votingRight: false,
  eligibleForOffice: false,
});

const memberTypeSenior = buildMemberType({
  code: 'SENIOR',
  name: 'Socio Senior',
  description: null,
  ageRangeMin: 66,
  ageRangeMax: null,
  votingRight: true,
  eligibleForOffice: false,
});

// === Helpers ===

function renderStep(props: Partial<Parameters<typeof MemberTypeStep>[0]> = {}) {
  const defaultProps = {
    birthDate: '1990-05-15',
    onValidChange: vi.fn(),
    ...props,
  };

  return {
    ...render(<MemberTypeStep {...defaultProps} />),
    props: defaultProps,
  };
}

/** Configura MSW para devolver tipos de socio. */
function setupMemberTypes(types: ReturnType<typeof buildMemberType>[]) {
  server.use(http.get('*/v1/member-types', () => HttpResponse.json(apiResponse(types))));
}

// === Tests ===

describe('MemberTypeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 5, 15)); // mes 0-indexado: 5 = junio
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('renderizado de tipos de socio', () => {
    it('deberia renderizar tarjetas de tipo de socio cuando hay datos', async () => {
      setupMemberTypes([memberTypeNumerario, memberTypeJuvenil]);

      renderStep();

      await waitFor(() => {
        expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
        expect(screen.getByText('Socio Juvenil')).toBeInTheDocument();
      });
    });

    it('deberia mostrar badges de derechos (Voto, Elegible)', async () => {
      setupMemberTypes([memberTypeNumerario]);

      renderStep();

      await waitFor(() => {
        expect(screen.getByText('Voto')).toBeInTheDocument();
        expect(screen.getByText('Elegible para cargos')).toBeInTheDocument();
      });
    });

    it('deberia no mostrar badges de derechos cuando no tiene permisos', async () => {
      setupMemberTypes([memberTypeJuvenil]);

      renderStep();

      await waitFor(() => {
        expect(screen.getByText('Socio Juvenil')).toBeInTheDocument();
      });

      expect(screen.queryByText('Voto')).not.toBeInTheDocument();
      expect(screen.queryByText('Elegible para cargos')).not.toBeInTheDocument();
    });

    it('deberia mostrar informacion de rango de edad', async () => {
      setupMemberTypes([memberTypeNumerario, memberTypeJuvenil, memberTypeSenior]);

      renderStep();

      await waitFor(() => {
        // Rango completo
        expect(screen.getByText('Edad: 18-65 años')).toBeInTheDocument();
        // Solo maximo
        expect(screen.getByText('Edad: hasta 17 años')).toBeInTheDocument();
        // Solo minimo
        expect(screen.getByText('Edad: 66+ años')).toBeInTheDocument();
      });
    });

    it('deberia mostrar descripcion del tipo cuando la tiene', async () => {
      setupMemberTypes([memberTypeNumerario]);

      renderStep();

      await waitFor(() => {
        expect(screen.getByText('Socio con plenos derechos')).toBeInTheDocument();
      });
    });
  });

  describe('seleccion de tipo', () => {
    it('deberia llamar a onValidChange con el typeId al hacer click en un tipo compatible', async () => {
      setupMemberTypes([memberTypeNumerario]);
      const { user, props } = renderStep({ birthDate: '1990-05-15' }); // 36 años, compatible con 18-65

      await waitFor(() => {
        expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByText('Socio Numerario'));

      // Assert: onValidChange con el typeId
      expect(props.onValidChange).toHaveBeenCalledWith(memberTypeNumerario.id);
    });

    it('deberia mostrar badge "Seleccionado" al seleccionar un tipo', async () => {
      setupMemberTypes([memberTypeNumerario]);
      const { user } = renderStep({ birthDate: '1990-05-15' });

      await waitFor(() => {
        expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Socio Numerario'));

      expect(screen.getByText('Seleccionado')).toBeInTheDocument();
    });

    it('deberia llamar a onValidChange con null al seleccionar un tipo incompatible', async () => {
      setupMemberTypes([memberTypeJuvenil]);
      const { user, props } = renderStep({ birthDate: '1990-05-15' }); // 36 años, incompatible con max 17

      await waitFor(() => {
        expect(screen.getByText('Socio Juvenil')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Socio Juvenil'));

      // El aspirante tiene 36 años, JUVENIL tiene max 17 → onValidChange(null)
      expect(props.onValidChange).toHaveBeenCalledWith(null);
    });
  });

  describe('compatibilidad de edad', () => {
    it('deberia marcar tipos incompatibles segun la edad del aspirante', async () => {
      // Aspirante de 36 años (nacido en 1990, estamos en 2026-06-15)
      setupMemberTypes([memberTypeNumerario, memberTypeJuvenil]);

      renderStep({ birthDate: '1990-05-15' });

      await waitFor(() => {
        // Juvenil no es compatible (max 17 años)
        expect(screen.getByText(/No compatible con la edad del aspirante/)).toBeInTheDocument();
      });
    });

    it('deberia mostrar "Edad compatible" al seleccionar un tipo compatible', async () => {
      setupMemberTypes([memberTypeNumerario]);
      const { user } = renderStep({ birthDate: '1990-05-15' }); // 36 años, dentro de 18-65

      await waitFor(() => {
        expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Socio Numerario'));

      expect(screen.getByText('Edad compatible')).toBeInTheDocument();
    });

    it('deberia mostrar incompatibilidad para Senior con aspirante joven (triangulacion)', async () => {
      setupMemberTypes([memberTypeSenior]);

      renderStep({ birthDate: '2000-01-01' }); // 26 años, Senior requiere 66+

      await waitFor(() => {
        expect(screen.getByText('Socio Senior')).toBeInTheDocument();
      });

      // El tipo ya muestra incompatibilidad inline sin necesidad de click
      expect(screen.getByText(/No compatible con la edad del aspirante/)).toBeInTheDocument();
    });
  });

  describe('estado de carga', () => {
    it('deberia mostrar skeletons cuando esta cargando', () => {
      server.use(http.get('*/v1/member-types', () => new Promise(() => {})));

      renderStep();

      // Cuando esta cargando, no muestra las tarjetas
      expect(screen.queryByText('Socio Numerario')).not.toBeInTheDocument();
      expect(screen.queryByText('Voto')).not.toBeInTheDocument();
    });
  });

  describe('estados de error y vacios', () => {
    it('deberia mostrar alerta de error cuando falla la carga', async () => {
      server.use(
        http.get('*/v1/member-types', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 }),
        ),
      );

      renderStep();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar tipos de socio')).toBeInTheDocument();
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });

    it('deberia recargar al hacer click en Reintentar', async () => {
      let callCount = 0;
      server.use(
        http.get('*/v1/member-types', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Server error' }, { status: 500 });
          }
          return HttpResponse.json(apiResponse([memberTypeNumerario]));
        }),
      );

      const { user } = renderStep();

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reintentar'));

      await waitFor(() => {
        expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
      });
    });

    it('deberia mostrar alerta cuando no hay tipos de socio configurados', async () => {
      setupMemberTypes([]);

      renderStep();

      await waitFor(() => {
        expect(screen.getByText('Sin tipos de socio')).toBeInTheDocument();
      });
    });
  });
});
