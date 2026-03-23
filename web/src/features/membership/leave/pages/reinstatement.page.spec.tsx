import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildReinstatementSummary } from '@/test/factories';
import { ReinstatementPage } from './reinstatement.page';

// === Mocks ===

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// === Datos de prueba ===

const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440000';

const sampleSummary = buildReinstatementSummary({
  memberId: MEMBER_ID,
  memberName: 'Carlos Rodríguez Martín',
  memberNumber: 'SOC-015',
  leaveDate: '2025-12-01T00:00:00.000Z',
  leaveType: 'VOLUNTARY_LEAVE',
  pendingDebt: 5000,
  penalty: 2000,
  newRegistrationFee: 3000,
  totalToPay: 10000,
  keepSeniority: true,
  previousSeniorityMonths: 48,
});

// === Helpers ===

function renderPage() {
  return render(<ReinstatementPage />, {
    route: '/members/:memberId/reinstate',
    path: `/members/${MEMBER_ID}/reinstate`,
  });
}

// === Tests ===

describe('ReinstatementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // MSW: resumen de rehabilitacion
    server.use(
      http.get('*/v1/members/:memberId/reinstatement-summary', () =>
        HttpResponse.json(apiResponse(sampleSummary)),
      ),
    );
  });

  describe('renderizado con datos', () => {
    it('deberia renderizar datos del ex-socio', async () => {
      renderPage();

      await waitFor(() => {
        const nameElements = screen.getAllByText('Carlos Rodríguez Martín');
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getByText('#SOC-015')).toBeInTheDocument();
      expect(screen.getByText('Baja Voluntaria')).toBeInTheDocument();
    });

    it('deberia renderizar breadcrumbs con la jerarquia correcta', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Socios')).toBeInTheDocument();
        expect(screen.getByText('Rehabilitacion')).toBeInTheDocument();
      });
      const breadcrumbsContainer = document.querySelector('.mantine-Breadcrumbs-root');
      expect(breadcrumbsContainer).toBeInTheDocument();
    });

    it('deberia mostrar tabla de desglose de costes', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Deuda pendiente')).toBeInTheDocument();
        expect(screen.getByText('Penalizacion')).toBeInTheDocument();
        expect(screen.getByText('Nueva inscripcion')).toBeInTheDocument();
        expect(screen.getByText('Total a pagar')).toBeInTheDocument();
      });
    });
  });

  describe('interaccion con checkbox y boton', () => {
    it('deberia tener boton "Rehabilitar Socio" deshabilitado hasta marcar checkbox', async () => {
      renderPage();

      const button = await screen.findByText('Rehabilitar Socio');
      expect(button.closest('button')).toBeDisabled();
    });

    it('deberia habilitar el boton al marcar el checkbox de confirmacion de pago', async () => {
      const { user } = renderPage();

      // Esperar carga
      await screen.findByText('Rehabilitar Socio');

      // Verificar checkbox no marcado
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      // Act: marcar el checkbox
      await user.click(checkbox);

      // Assert: checkbox marcado y boton habilitado
      expect(checkbox).toBeChecked();
      const button = screen.getByText('Rehabilitar Socio').closest('button')!;
      expect(button).not.toBeDisabled();
    });

    it('deberia deshabilitar el boton al desmarcar el checkbox', async () => {
      const { user } = renderPage();

      await screen.findByText('Rehabilitar Socio');

      const checkbox = screen.getByRole('checkbox');

      // Marcar y luego desmarcar
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();

      const button = screen.getByText('Rehabilitar Socio').closest('button')!;
      expect(button).toBeDisabled();
    });
  });

  describe('informacion de antiguedad', () => {
    it('deberia mostrar recuperacion de antiguedad cuando keepSeniority es true', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Recuperacion de antiguedad')).toBeInTheDocument();
        expect(screen.getByText(/48 meses/)).toBeInTheDocument();
      });
    });

    it('deberia mostrar antiguedad desde rehabilitacion cuando keepSeniority es false', async () => {
      // Arrange: resumen sin mantenimiento de antiguedad
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () =>
          HttpResponse.json(
            apiResponse(
              buildReinstatementSummary({
                ...sampleSummary,
                keepSeniority: false,
              }),
            ),
          ),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Antiguedad desde rehabilitacion')).toBeInTheDocument();
      });
    });
  });

  describe('estado de carga', () => {
    it('deberia mostrar skeleton durante estado de carga', () => {
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () => new Promise(() => {})),
      );

      const { container } = renderPage();

      const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('estados de error', () => {
    it('deberia mostrar alerta de error generico cuando falla la carga', async () => {
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 }),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar datos de rehabilitacion')).toBeInTheDocument();
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });

    it('deberia mostrar mensaje especifico cuando el socio no puede ser rehabilitado (422)', async () => {
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () =>
          HttpResponse.json(
            {
              statusCode: 422,
              message: "El socio no puede ser rehabilitado desde el estado 'ACTIVE'.",
              error: 'MEMBERSHIP.CANNOT_REINSTATE',
            },
            { status: 422 },
          ),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Rehabilitacion no disponible')).toBeInTheDocument();
        expect(screen.getByText(/estado activo/)).toBeInTheDocument();
        expect(screen.getByText('Volver al perfil del socio')).toBeInTheDocument();
      });
    });

    it('deberia navegar al perfil del socio al hacer click en "Volver al perfil"', async () => {
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () =>
          HttpResponse.json(
            {
              statusCode: 422,
              message: "El socio no puede ser rehabilitado desde el estado 'ACTIVE'.",
              error: 'MEMBERSHIP.CANNOT_REINSTATE',
            },
            { status: 422 },
          ),
        ),
      );

      const { user } = renderPage();

      await waitFor(() => {
        expect(screen.getByText('Volver al perfil del socio')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByText('Volver al perfil del socio'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/members/${MEMBER_ID}`);
    });

    it('deberia recargar datos al hacer click en Reintentar', async () => {
      let callCount = 0;
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Server error' }, { status: 500 });
          }
          return HttpResponse.json(apiResponse(sampleSummary));
        }),
      );

      const { user } = renderPage();

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reintentar'));

      await waitFor(() => {
        const nameElements = screen.getAllByText('Carlos Rodríguez Martín');
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('resumen con datos diferentes (triangulacion)', () => {
    it('deberia renderizar datos de un segundo socio', async () => {
      const secondSummary = buildReinstatementSummary({
        memberId: MEMBER_ID,
        memberName: 'Ana López García',
        memberNumber: 'SOC-088',
        leaveType: 'NONPAYMENT_LEAVE',
        pendingDebt: 8000,
        penalty: 0,
        newRegistrationFee: 5000,
        totalToPay: 13000,
        keepSeniority: false,
      });
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () =>
          HttpResponse.json(apiResponse(secondSummary)),
        ),
      );

      renderPage();

      await waitFor(() => {
        const nameElements = screen.getAllByText('Ana López García');
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getByText('#SOC-088')).toBeInTheDocument();
      expect(screen.getByText('Baja por Impago')).toBeInTheDocument();
    });
  });
});
