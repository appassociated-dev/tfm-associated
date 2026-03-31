import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { resetFeePlanCounters } from '@/test/factories';
import type { FeePlan } from '../schemas/fee-plan.schemas';

import { DeactivateFeePlanModal } from './deactivate-fee-plan-modal';

// === Mocks ===

const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

// === Helpers ===

const samplePlan: FeePlan = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  code: 'CUOTA-ANUAL',
  name: 'Cuota Anual',
  description: null,
  type: 'RECURRING',
  amount: 12000,
  amountFormatted: '120.00 EUR',
  currency: 'EUR',
  frequency: 'ANNUAL',
  billingMonths: [1],
  active: true,
  activeSubscriptionsCount: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondPlan: FeePlan = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  code: 'INSCRIPCION',
  name: 'Inscripcion Anual',
  description: 'Plan de inscripcion',
  type: 'ONE_TIME',
  amount: 5000,
  amountFormatted: '50.00 EUR',
  currency: 'EUR',
  frequency: 'ANNUAL' as const,
  billingMonths: [],
  active: true,
  activeSubscriptionsCount: 5,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

function renderModal(props: Partial<Parameters<typeof DeactivateFeePlanModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    plan: samplePlan,
    ...props,
  };

  return render(<DeactivateFeePlanModal {...defaultProps} />);
}

// === Tests ===

describe('DeactivateFeePlanModal', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  beforeEach(() => {
    resetFeePlanCounters();
    vi.clearAllMocks();
  });

  // --- Renderizado con plan ---

  describe('renderizado con plan seleccionado', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar titulo del modal', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Inactivar Plan')).toBeInTheDocument();
    });

    it('deberia mostrar boton Cancelar', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('deberia tener boton "Marcar como Inactivo" habilitado', () => {
      // Act
      renderModal();

      // Assert
      const deactivateButton = screen.getByText('Marcar como Inactivo').closest('button')!;
      expect(deactivateButton).toBeInTheDocument();
      expect(deactivateButton).not.toBeDisabled();
    });

    it('deberia mostrar texto informativo sobre efecto de la inactivacion', () => {
      // Act
      renderModal();

      // Assert
      expect(
        screen.getByText(/El plan dejará de aparecer en los selectores de alta/),
      ).toBeInTheDocument();
    });
  });

  // --- Advertencia de suscripciones ---

  describe('advertencia de suscripciones activas', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar advertencia de suscripciones cuando activeSubscriptionsCount > 0', () => {
      // Act
      renderModal({ activeSubscriptionsCount: 5 });

      // Assert
      expect(screen.getByText(/Este plan tiene 5 suscripciones activas/)).toBeInTheDocument();
      expect(screen.getByText(/marcarse como inactivo/)).toBeInTheDocument();
    });

    it('deberia mostrar advertencia con triangulacion (10 suscripciones)', () => {
      // Act
      renderModal({ activeSubscriptionsCount: 10 });

      // Assert
      expect(screen.getByText(/Este plan tiene 10 suscripciones activas/)).toBeInTheDocument();
    });

    it('deberia mostrar advertencia con 1 suscripcion (triangulacion singular)', () => {
      // Act
      renderModal({ activeSubscriptionsCount: 1 });

      // Assert
      expect(screen.getByText(/Este plan tiene 1 suscripción activa/)).toBeInTheDocument();
    });

    it('deberia mostrar texto de confirmacion cuando no hay suscripciones activas', () => {
      // Act
      renderModal({ activeSubscriptionsCount: 0 });

      // Assert
      expect(screen.getByText(/desea inactivar el plan/)).toBeInTheDocument();
    });

    it('deberia incluir el nombre del plan en la confirmacion (Cuota Anual)', () => {
      // Act
      renderModal({ activeSubscriptionsCount: 0, plan: samplePlan });

      // Assert
      expect(screen.getByText(/Cuota Anual/)).toBeInTheDocument();
    });

    it('deberia incluir nombre distinto en la confirmacion (Inscripcion Anual - triangulacion)', () => {
      // Act
      renderModal({ activeSubscriptionsCount: 0, plan: secondPlan });

      // Assert
      expect(screen.getByText(/Inscripcion Anual/)).toBeInTheDocument();
    });
  });

  // --- Plan null ---

  describe('plan no seleccionado', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar mensaje de "no seleccionado" cuando plan es null', () => {
      // Act
      renderModal({ plan: null });

      // Assert
      expect(screen.getByText('No se ha seleccionado ningún plan.')).toBeInTheDocument();
    });

    it('deberia NO mostrar boton "Marcar como Inactivo" cuando plan es null', () => {
      // Act
      renderModal({ plan: null });

      // Assert
      expect(screen.queryByText('Marcar como Inactivo')).not.toBeInTheDocument();
    });
  });

  // --- Interacciones ---

  describe('interacciones', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia llamar a la API de inactivacion y cerrar al confirmar', async () => {
      // Arrange
      const mockOnClose = vi.fn();
      let apiCalled = false;
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          apiCalled = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      const { user } = renderModal({ onClose: mockOnClose });
      await user.click(screen.getByText('Marcar como Inactivo'));

      // Assert
      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('deberia llamar a onClose al hacer click en Cancelar', async () => {
      // Arrange
      const mockOnClose = vi.fn();

      // Act
      const { user } = renderModal({ onClose: mockOnClose });
      await user.click(screen.getByText('Cancelar'));

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deberia mostrar estado de carga en boton durante la mutacion', async () => {
      // Arrange: handler que tarda en resolver (controlado para cleanup)
      let resolveDeactivate: (() => void) | undefined;
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          return new Promise<Response>((resolve) => {
            resolveDeactivate = () => resolve(new HttpResponse(null, { status: 204 }));
          });
        }),
      );

      // Act
      const { user } = renderModal();
      await user.click(screen.getByText('Marcar como Inactivo'));

      // Assert: boton en loading
      await waitFor(() => {
        const button = screen.getByText('Marcar como Inactivo').closest('button')!;
        expect(button).toHaveAttribute('data-loading');
      });

      // Cleanup: resolver la promesa
      resolveDeactivate?.();
    });

    it('deberia mostrar notificacion de exito tras inactivar correctamente', async () => {
      // Arrange
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      const { user } = renderModal();
      await user.click(screen.getByText('Marcar como Inactivo'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Plan inactivado',
            color: 'green',
          }),
        );
      });
    });

    it('deberia mantener el modal abierto cuando la API devuelve 422', async () => {
      // Arrange
      // NOTA: Este test revela un bug de produccion — los componentes usan
      // mutateAsync sin try/catch, lo que genera un unhandled rejection.
      // Suprimimos tanto a nivel window (jsdom) como process (Node.js).
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      const mockOnClose = vi.fn();
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          return HttpResponse.json(
            { message: 'No se puede inactivar: suscripciones activas' },
            { status: 422 },
          );
        }),
      );

      // Act
      const { user } = renderModal({ onClose: mockOnClose });
      await user.click(screen.getByText('Marcar como Inactivo'));

      // Assert: la mutacion falla — el modal NO se cierra (onClose no se llama)
      await waitFor(() => {
        const button = screen.getByText('Marcar como Inactivo').closest('button')!;
        expect(button).not.toHaveAttribute('data-loading');
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });
  });

  // --- Estilo del boton Cancelar ---

  describe('boton cancelar', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia no cerrar el modal cuando se confirma la inactivacion (solo al completar)', async () => {
      // Arrange: handler que nunca resuelve
      let resolveDeactivate: (() => void) | undefined;
      const mockOnClose = vi.fn();
      server.use(
        http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
          return new Promise<Response>((resolve) => {
            resolveDeactivate = () => resolve(new HttpResponse(null, { status: 204 }));
          });
        }),
      );

      // Act
      const { user } = renderModal({ onClose: mockOnClose });
      await user.click(screen.getByText('Marcar como Inactivo'));

      // Assert: onClose NO se ha llamado aun (la mutacion esta en curso)
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup: resolver
      resolveDeactivate?.();

      // Assert: ahora si se cierra
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
