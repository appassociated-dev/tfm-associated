import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildLeaveSummary } from '@/test/factories';
import { VoluntaryLeavePage } from './voluntary-leave.page';

// === Mocks ===

// Mock de @mantine/notifications — portal no disponible en jsdom
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// === Datos de prueba ===

const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440000';

const summaryWithDebt = buildLeaveSummary({
  memberId: MEMBER_ID,
  memberName: 'María Fernández Ruiz',
  memberNumber: 'SOC-042',
  currentStatus: 'ACTIVE',
  effectiveDateOptions: [
    {
      type: 'IMMEDIATE',
      effectiveDate: '2026-03-15T00:00:00.000Z',
      label: 'Inmediata',
    },
    {
      type: 'END_OF_FISCAL_YEAR',
      effectiveDate: '2026-12-31T00:00:00.000Z',
      label: 'Fin de ejercicio',
    },
  ],
  activeSubscriptions: [
    {
      subscriptionId: '660e8400-e29b-41d4-a716-446655440001',
      feePlanCode: 'ANNUAL',
      feePlanName: 'Cuota Anual Ordinaria',
      amount: 12000,
      startDate: '2026-01-01T00:00:00.000Z',
    },
  ],
  pendingCharges: [
    {
      chargeId: '660e8400-e29b-41d4-a716-446655440001',
      concept: 'Cuota Marzo 2026',
      amount: 3000,
      issueDate: '2026-03-01T00:00:00.000Z',
      dueDate: '2026-03-31T00:00:00.000Z',
    },
  ],
  totalPendingDebt: 3000,
});

// === Helpers ===

function renderPage() {
  return render(<VoluntaryLeavePage />, {
    route: '/members/:memberId/leave',
    path: `/members/${MEMBER_ID}/leave`,
  });
}

// === Tests ===

describe('VoluntaryLeavePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // MSW: resumen de baja con deuda
    server.use(
      http.get('*/v1/members/:memberId/leave-summary', () =>
        HttpResponse.json(apiResponse(summaryWithDebt)),
      ),
    );
  });

  describe('renderizado con datos', () => {
    it('deberia renderizar datos del socio desde el resumen de baja', async () => {
      renderPage();

      await waitFor(() => {
        const nameElements = screen.getAllByText('María Fernández Ruiz');
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getByText('#SOC-042')).toBeInTheDocument();
    });

    it('deberia renderizar breadcrumbs con la jerarquia correcta', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Socios')).toBeInTheDocument();
      });
      const breadcrumbsContainer = document.querySelector('.mantine-Breadcrumbs-root');
      expect(breadcrumbsContainer).toBeInTheDocument();
    });

    it('deberia mostrar opciones de fecha efectiva como radio buttons', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/Inmediata/)).toBeInTheDocument();
        expect(screen.getByText(/Fin de ejercicio/)).toBeInTheDocument();
      });
    });

    it('deberia mostrar tabla de suscripciones activas', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual Ordinaria')).toBeInTheDocument();
        expect(screen.getByText('ANNUAL')).toBeInTheDocument();
      });
    });

    it('deberia mostrar cargos pendientes', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Cuota Marzo 2026')).toBeInTheDocument();
        expect(screen.getByText('Deuda total:')).toBeInTheDocument();
      });
    });
  });

  describe('interacciones del formulario', () => {
    it('deberia tener boton "Confirmar Baja Voluntaria" deshabilitado sin seleccionar fecha ni motivo', async () => {
      renderPage();

      const button = await screen.findByText('Confirmar Baja Voluntaria');
      expect(button.closest('button')).toBeDisabled();
    });

    it('deberia habilitar el boton al seleccionar fecha y escribir motivo valido', async () => {
      const { user } = renderPage();

      // Esperar a que cargue
      await screen.findByText('Confirmar Baja Voluntaria');

      // Act: seleccionar opcion de fecha via Radio de Mantine
      // Mantine Radio renderiza un input[type="radio"] dentro del label
      const radios = document.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBeGreaterThan(0);
      await user.click(radios[0]); // Primera opcion: Inmediata

      // Act: escribir motivo valido (min 3 caracteres)
      // Mantine Textarea renderiza un textarea nativo
      const textarea = screen.getByPlaceholderText('Indique el motivo de la baja voluntaria');
      fireEvent.change(textarea, {
        target: { value: 'Motivo de prueba para la baja voluntaria del socio' },
      });

      // Assert: boton habilitado
      const button = screen.getByText('Confirmar Baja Voluntaria').closest('button');
      expect(button).not.toBeDisabled();
    });

    it('deberia mostrar textarea de motivo con placeholder', async () => {
      renderPage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Indique el motivo de la baja voluntaria'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('estado de carga', () => {
    it('deberia mostrar skeleton durante estado de carga', () => {
      // Arrange: MSW no responde (tarda)
      server.use(
        http.get(
          '*/v1/members/:memberId/leave-summary',
          () => new Promise(() => {}), // nunca resuelve
        ),
      );

      const { container } = renderPage();

      const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('estado de error', () => {
    it('deberia mostrar alerta de error cuando falla la carga', async () => {
      // Arrange: MSW devuelve error 500
      server.use(
        http.get('*/v1/members/:memberId/leave-summary', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 }),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar datos de baja')).toBeInTheDocument();
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });

    it('deberia recargar datos al hacer click en Reintentar', async () => {
      // Arrange: primero error, luego exito
      let callCount = 0;
      server.use(
        http.get('*/v1/members/:memberId/leave-summary', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Server error' }, { status: 500 });
          }
          return HttpResponse.json(apiResponse(summaryWithDebt));
        }),
      );

      const { user } = renderPage();

      // Esperar error
      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });

      // Act: click en reintentar
      await user.click(screen.getByText('Reintentar'));

      // Assert: datos cargados correctamente
      await waitFor(() => {
        const nameElements = screen.getAllByText('María Fernández Ruiz');
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('socio sin deuda', () => {
    it('deberia mostrar alerta de sin deuda cuando totalPendingDebt es 0', async () => {
      // Arrange: resumen sin deuda
      const summaryNoDebt = buildLeaveSummary({
        memberId: MEMBER_ID,
        memberName: 'Pedro Garcia',
        memberNumber: 'SOC-100',
        currentStatus: 'ACTIVE',
        pendingCharges: [],
        totalPendingDebt: 0,
      });
      server.use(
        http.get('*/v1/members/:memberId/leave-summary', () =>
          HttpResponse.json(apiResponse(summaryNoDebt)),
        ),
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Sin deuda pendiente')).toBeInTheDocument();
      });
    });
  });
});
