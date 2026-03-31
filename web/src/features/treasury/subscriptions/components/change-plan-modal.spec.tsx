import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import {
  buildFeePlan,
  buildSubscription,
  resetFeePlanCounters,
  resetSubscriptionCounters,
} from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import type { FeeSubscription } from '../schemas/subscription.schemas';

import { ChangePlanModal } from './change-plan-modal';

// === Mocks ===

const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

// === Datos de prueba ===

// UUIDs validos para tests
const PLAN_UUID_1 = '11111111-1111-4111-8111-111111111111';
const PLAN_UUID_2 = '22222222-2222-4222-8222-222222222222';
const PLAN_UUID_3 = '33333333-3333-4333-8333-333333333333';
const SUB_UUID = '00000000-0000-4000-8000-000000000004';

function createMockSubscription(overrides: Partial<FeeSubscription> = {}): FeeSubscription {
  return {
    id: SUB_UUID,
    feePlanId: PLAN_UUID_1,
    feePlanName: 'Cuota Anual',
    feePlanCode: 'ANUAL',
    typeDiscount: 0.3,
    personalDiscount: 0.1,
    personalDiscountReason: 'Familiar directo',
    effectiveAmount: 7560,
    effectiveAmountFormatted: '75.60 EUR',
    isActive: true,
    registrationDate: '2026-01-01T00:00:00.000Z',
    leaveDate: null,
    cancelReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const mockFeePlans = [
  buildFeePlan({ id: PLAN_UUID_1, code: 'ANUAL', name: 'Cuota Anual', amount: 12000 }),
  buildFeePlan({ id: PLAN_UUID_2, code: 'TRIMESTRAL', name: 'Cuota Trimestral', amount: 4000 }),
  buildFeePlan({ id: PLAN_UUID_3, code: 'MENSUAL', name: 'Cuota Mensual', amount: 1500 }),
];

function renderModal(props: Partial<Parameters<typeof ChangePlanModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    memberAccountId: '00000000-0000-4000-8000-000000000099',
    memberTypeId: '00000000-0000-4000-8000-000000000001',
    subscription: createMockSubscription(),
    ...props,
  } as Parameters<typeof ChangePlanModal>[0];

  return render(<ChangePlanModal {...defaultProps} />);
}

/**
 * Helper: selecciona un plan del dropdown Mantine Select.
 * Mantine 8 Select renderiza items como divs con el texto del label,
 * NO como role="option". El Select esta disabled={plansLoading},
 * asi que primero esperamos a que se habilite (planes cargados).
 */
async function selectPlanFromDropdown(user: ReturnType<typeof render>['user'], planText: string) {
  const selectInput = screen.getByPlaceholderText('Selecciona un plan');

  // Esperar a que el Select se habilite (planes cargados via MSW)
  await waitFor(() => {
    expect(selectInput).not.toBeDisabled();
  });

  // Abrir dropdown
  await user.click(selectInput);

  // Esperar a que aparezcan las opciones y seleccionar
  await waitFor(() => {
    expect(screen.getByText(new RegExp(planText))).toBeInTheDocument();
  });
  await user.click(screen.getByText(new RegExp(planText)));
}

// === Tests ===

describe('ChangePlanModal', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  beforeEach(() => {
    resetFeePlanCounters();
    resetSubscriptionCounters();
    vi.clearAllMocks();
    // Handler por defecto: devolver planes activos
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse(mockFeePlans));
      }),
    );
  });

  // --- Renderizado base ---

  describe('renderizado del plan actual', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia renderizar la informacion del plan actual (nombre y codigo)', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      expect(screen.getByText('ANUAL')).toBeInTheDocument();
    });

    it('deberia mostrar el importe efectivo del plan actual formateado', () => {
      // baseAmount eliminado del DTO (REQ-ZOD-001) — se muestra effectiveAmount directamente
      // Act
      renderModal();

      // Assert: 7560 centavos = 75,60 EUR (effectiveAmount del mock)
      expect(screen.getByText(/75,60/)).toBeInTheDocument();
    });

    it('deberia mostrar el titulo del modal "Cambiar Plan"', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cambiar Plan')).toBeInTheDocument();
    });

    it('deberia mostrar porcentajes de descuento del plan actual', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText(/Dto\. tipo: 30%/)).toBeInTheDocument();
      expect(screen.getByText(/Dto\. personal: 10%/)).toBeInTheDocument();
    });

    it('deberia mostrar porcentajes de descuento con triangulacion (50% tipo, 20% personal)', () => {
      // Act
      renderModal({
        subscription: createMockSubscription({
          typeDiscount: 0.5,
          personalDiscount: 0.2,
        }),
      });

      // Assert
      expect(screen.getByText(/Dto\. tipo: 50%/)).toBeInTheDocument();
      expect(screen.getByText(/Dto\. personal: 20%/)).toBeInTheDocument();
    });
  });

  // --- Selector de nuevo plan ---

  describe('selector de nuevo plan', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar el selector de nuevo plan (Select)', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByPlaceholderText('Selecciona un plan')).toBeInTheDocument();
    });

    it('deberia mostrar opciones del dropdown al hacer click', async () => {
      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Selecciona un plan');

      // Esperar a que se habilite (planes cargados)
      await waitFor(() => {
        expect(selectInput).not.toBeDisabled();
      });

      await user.click(selectInput);

      // Assert: las opciones del dropdown aparecen (Trimestral y Mensual, no Anual que es el actual)
      await waitFor(() => {
        expect(screen.getByText(/Cuota Trimestral/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Cuota Mensual/)).toBeInTheDocument();
    });
  });

  // --- Opciones de fecha efectiva ---

  describe('opciones de fecha efectiva', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar las opciones de fecha efectiva (SegmentedControl)', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Inmediato (proximo cargo)')).toBeInTheDocument();
      expect(screen.getByText('Inicio proximo mes')).toBeInTheDocument();
      expect(screen.getByText('Inicio proximo ejercicio')).toBeInTheDocument();
    });
  });

  // --- Elementos informativos ---

  describe('elementos informativos', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar alerta informativa sobre cancelacion de cargos futuros', () => {
      // Act
      renderModal();

      // Assert
      expect(
        screen.getByText('Los cargos futuros del plan actual se cancelaran'),
      ).toBeInTheDocument();
    });

    it('deberia mostrar checkbox de mantener cargos pendientes', () => {
      // Act
      renderModal();

      // Assert
      expect(
        screen.getByText('Mantener cargos pendientes (la deuda se arrastra al nuevo plan)'),
      ).toBeInTheDocument();
    });
  });

  // --- Botones de accion ---

  describe('botones de accion', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar botones Cancelar y Confirmar Cambio', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      const confirmButton = screen.getByText('Confirmar Cambio').closest('button')!;
      expect(confirmButton).toBeInTheDocument();
    });

    it('deberia tener el boton Confirmar Cambio deshabilitado cuando no hay plan seleccionado', () => {
      // Act
      renderModal();

      // Assert
      const confirmButton = screen.getByText('Confirmar Cambio').closest('button')!;
      expect(confirmButton).toBeDisabled();
    });

    it('deberia llamar a onClose al hacer click en Cancelar', async () => {
      // Arrange
      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Act
      await user.click(screen.getByText('Cancelar'));

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // --- Interacciones completas ---

  describe('interacciones', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia seleccionar un nuevo plan y enviar la solicitud de cambio', async () => {
      // Arrange
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/change-plan',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json(
              apiResponse(buildSubscription({ feePlanName: 'Cuota Trimestral' })),
            );
          },
        ),
      );

      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Act: seleccionar Cuota Trimestral del dropdown
      await selectPlanFromDropdown(user, 'Cuota Trimestral');

      // Assert: boton habilitado
      const confirmButton = screen.getByText('Confirmar Cambio').closest('button')!;
      expect(confirmButton).not.toBeDisabled();

      // Act: confirmar
      await user.click(confirmButton);

      // Assert: API llamada con payload correcto
      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });
      expect(capturedBody).toEqual(
        expect.objectContaining({
          newFeePlanId: PLAN_UUID_2,
          effectiveDateType: 'IMMEDIATE',
          keepPendingCharges: true,
        }),
      );
    });

    it('deberia mostrar estado de carga en boton durante la mutacion', async () => {
      // Arrange: handler que tarda en resolver
      let resolveChangePlan: (() => void) | undefined;
      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/change-plan',
          () => {
            return new Promise<Response>((resolve) => {
              resolveChangePlan = () =>
                resolve(HttpResponse.json(apiResponse(buildSubscription())));
            });
          },
        ),
      );

      const { user } = renderModal();

      // Act: seleccionar plan
      await selectPlanFromDropdown(user, 'Cuota Trimestral');
      await user.click(screen.getByText('Confirmar Cambio'));

      // Assert: boton en loading
      await waitFor(() => {
        const button = screen.getByText('Confirmar Cambio').closest('button')!;
        expect(button).toHaveAttribute('data-loading');
      });

      // Cleanup
      resolveChangePlan?.();
    });

    it('deberia desmarcar checkbox de mantener cargos pendientes', async () => {
      // Act
      const { user } = renderModal();
      const checkbox = screen.getByRole('checkbox', {
        name: /mantener cargos pendientes/i,
      });

      // Assert: marcado por defecto
      expect(checkbox).toBeChecked();

      // Act: desmarcar
      await user.click(checkbox);

      // Assert
      expect(checkbox).not.toBeChecked();
    });

    it('deberia cerrar el modal y resetear estado tras cambio exitoso', async () => {
      // Arrange
      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/change-plan',
          () => {
            return HttpResponse.json(apiResponse(buildSubscription()));
          },
        ),
      );

      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Seleccionar plan y confirmar
      await selectPlanFromDropdown(user, 'Cuota Mensual');
      await user.click(screen.getByText('Confirmar Cambio'));

      // Assert: onClose se llama tras success
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('deberia mostrar notificacion de exito tras cambio de plan', async () => {
      // Arrange
      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/change-plan',
          () => {
            return HttpResponse.json(apiResponse(buildSubscription()));
          },
        ),
      );

      const { user } = renderModal();

      // Seleccionar plan y confirmar
      await selectPlanFromDropdown(user, 'Cuota Trimestral');
      await user.click(screen.getByText('Confirmar Cambio'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Plan cambiado',
            color: 'green',
          }),
        );
      });
    });
  });

  // --- Error de API ---

  describe('error de API', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mantener modal abierto cuando la API devuelve 422', async () => {
      // Arrange
      // BUG DE PRODUCCION: useChangePlan.onError comprueba error.response?.status
      // pero httpClient transforma errores a ApiError (error.status).
      // La notificacion de error NO se mostrara porque el status check falla.
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      const mockOnClose = vi.fn();
      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/change-plan',
          () => {
            return HttpResponse.json(
              { message: 'No se puede cambiar: hay cargos pendientes sin confirmar' },
              { status: 422 },
            );
          },
        ),
      );

      const { user } = renderModal({ onClose: mockOnClose });

      // Act: seleccionar plan y confirmar
      await selectPlanFromDropdown(user, 'Cuota Trimestral');
      await user.click(screen.getByText('Confirmar Cambio'));

      // Assert: la mutacion falla — modal NO se cierra
      await waitFor(() => {
        const button = screen.getByText('Confirmar Cambio').closest('button')!;
        expect(button).not.toHaveAttribute('data-loading');
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });

    it('deberia mostrar notificacion de error con 422 (cargos pendientes)', async () => {
      // El hook useChangePlan.onError ahora usa ApiError.status correctamente
      // para detectar error 422 y mostrar notificacion roja.
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      server.use(
        http.post(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/change-plan',
          () => {
            return HttpResponse.json({ message: 'No se puede cambiar' }, { status: 422 });
          },
        ),
      );

      const { user } = renderModal();

      // Act
      await selectPlanFromDropdown(user, 'Cuota Trimestral');
      await user.click(screen.getByText('Confirmar Cambio'));

      // Assert: error notification IS shown now that the bug is fixed
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Cambio no permitido',
            color: 'red',
          }),
        );
      });

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });
  });

  // --- No renderizar si esta cerrado ---

  describe('modal cerrado', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia no renderizar contenido cuando esta cerrado', () => {
      // Act
      renderModal({ opened: false });

      // Assert
      expect(screen.queryByText('Cambiar Plan')).not.toBeInTheDocument();
    });
  });

  // --- Alerta de cargos pendientes (REQ-SPU-002) ---

  describe('alerta de cargos pendientes', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia renderizar alerta naranja con el contador cuando pendingChargesCount > 0', () => {
      // Arrange
      const subscriptionWithPending = createMockSubscription({ pendingChargesCount: 3 });

      // Act
      renderModal({ subscription: subscriptionWithPending });

      // Assert
      expect(screen.getByText(/3 cargos pendientes/)).toBeInTheDocument();
    });

    it('deberia NO renderizar alerta de cargos pendientes cuando pendingChargesCount es 0', () => {
      // Arrange
      const subscriptionNoPending = createMockSubscription({ pendingChargesCount: 0 });

      // Act
      renderModal({ subscription: subscriptionNoPending });

      // Assert
      expect(
        screen.queryByText(/cargos pendientes en la cuenta del socio/),
      ).not.toBeInTheDocument();
    });

    it('deberia NO renderizar alerta de cargos pendientes cuando pendingChargesCount es undefined', () => {
      // Arrange - suscripcion sin el campo (backend anterior)
      const subscriptionLegacy = createMockSubscription({ pendingChargesCount: undefined });

      // Act
      renderModal({ subscription: subscriptionLegacy });

      // Assert
      expect(
        screen.queryByText(/cargos pendientes en la cuenta del socio/),
      ).not.toBeInTheDocument();
    });

    it('deberia mostrar el checkbox de mantener cargos pendientes independientemente del contador', () => {
      // Arrange
      const subscriptionWithPending = createMockSubscription({ pendingChargesCount: 5 });

      // Act
      renderModal({ subscription: subscriptionWithPending });

      // Assert: la alerta aparece Y el checkbox sigue visible
      expect(screen.getByText(/5 cargos pendientes/)).toBeInTheDocument();
      expect(
        screen.getByText('Mantener cargos pendientes (la deuda se arrastra al nuevo plan)'),
      ).toBeInTheDocument();
    });
  });
});
