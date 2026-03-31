import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildSubscription, resetSubscriptionCounters } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import type { FeeSubscription } from '../schemas/subscription.schemas';

import { UpdateDiscountModal } from './update-discount-modal';

// === Mocks ===

const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

// === Datos de prueba ===

function createMockSubscription(overrides: Partial<FeeSubscription> = {}): FeeSubscription {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    feePlanId: '00000000-0000-4000-8000-000000000002',
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

function renderModal(props: Partial<Parameters<typeof UpdateDiscountModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    memberAccountId: '00000000-0000-4000-8000-000000000099',
    subscription: createMockSubscription(),
    ...props,
  };

  return render(<UpdateDiscountModal {...defaultProps} />);
}

// === Tests ===

describe('UpdateDiscountModal', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  beforeEach(() => {
    resetSubscriptionCounters();
    vi.clearAllMocks();
  });

  // --- Renderizado base ---

  describe('renderizado del desglose actual', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia renderizar el desglose actual de descuento', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Descuento actual')).toBeInTheDocument();
      const importeBaseElements = screen.getAllByText('Importe base');
      expect(importeBaseElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Importe efectivo actual')).toBeInTheDocument();
    });

    it('deberia mostrar los porcentajes de descuento por tipo y personal', () => {
      // Act
      renderModal();

      // Assert
      const tipoElements = screen.getAllByText(/Dto\. tipo \(30%\)/);
      expect(tipoElements.length).toBeGreaterThanOrEqual(1);
      const personalElements = screen.getAllByText(/Dto\. personal \(10%?\)/);
      expect(personalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('deberia mostrar porcentajes con triangulacion (50% tipo, 25% personal)', () => {
      // Act
      renderModal({
        subscription: createMockSubscription({
          typeDiscount: 0.5,
          personalDiscount: 0.25,
        }),
      });

      // Assert
      const tipoElements = screen.getAllByText(/Dto\. tipo \(50%\)/);
      expect(tipoElements.length).toBeGreaterThanOrEqual(1);
      const personalElements = screen.getAllByText(/Dto\. personal \(25%?\)/);
      expect(personalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('deberia mostrar el titulo del modal "Modificar Descuento"', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Modificar Descuento')).toBeInTheDocument();
    });
  });

  // --- Campos del formulario ---

  describe('campos del formulario', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar el campo NumberInput para nuevo descuento personalizado', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Nuevo descuento personalizado (%)')).toBeInTheDocument();
      expect(screen.getByText('Valor entre 0 y 99%')).toBeInTheDocument();
    });

    it('deberia mostrar el campo Textarea para motivo (obligatorio)', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Motivo del cambio')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
      ).toBeInTheDocument();
    });

    it('deberia mostrar el campo TextInput para "Aprobado por"', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Aprobado por')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"')).toBeInTheDocument();
    });

    it('deberia mostrar alerta informativa sobre cargos existentes', () => {
      // Act
      renderModal();

      // Assert
      expect(
        screen.getByText(/Los cargos ya generados mantienen su importe original/),
      ).toBeInTheDocument();
    });
  });

  // --- Preview en tiempo real ---

  describe('preview de nuevo importe', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia renderizar la seccion de preview de nuevo importe efectivo', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Nuevo importe efectivo (preview)')).toBeInTheDocument();
      expect(screen.getByText(/Descuento total:/)).toBeInTheDocument();
    });
  });

  // --- Botones ---

  describe('botones de accion', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar botones Cancelar y Guardar', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      const saveButton = screen.getByText('Guardar').closest('button')!;
      expect(saveButton).toBeInTheDocument();
    });

    it('deberia tener el boton Guardar deshabilitado inicialmente (falta motivo y aprobado por)', () => {
      // Act
      renderModal();

      // Assert
      const saveButton = screen.getByText('Guardar').closest('button')!;
      expect(saveButton).toBeDisabled();
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

  // --- Validacion y habilitacion ---

  describe('validacion del formulario', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia habilitar boton Guardar cuando motivo y aprobado por son validos', async () => {
      // Arrange
      const { user } = renderModal();

      // Act: rellenar motivo (>= 3 chars)
      const motivoInput = screen.getByPlaceholderText('Indique el motivo del cambio de descuento');
      await user.type(motivoInput, 'Descuento por antiguedad');

      // Act: rellenar aprobado por (>= 3 chars)
      const aprobadoInput = screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"');
      await user.type(aprobadoInput, 'Junta Directiva');

      // Assert
      const saveButton = screen.getByText('Guardar').closest('button')!;
      expect(saveButton).not.toBeDisabled();
    });

    it('deberia mantener Guardar deshabilitado con motivo valido pero sin aprobado por', async () => {
      // Arrange
      const { user } = renderModal();

      // Act: solo rellenar motivo
      const motivoInput = screen.getByPlaceholderText('Indique el motivo del cambio de descuento');
      await user.type(motivoInput, 'Motivo suficiente');

      // Assert
      const saveButton = screen.getByText('Guardar').closest('button')!;
      expect(saveButton).toBeDisabled();
    });

    it('deberia mostrar error de minimo cuando motivo tiene menos de 3 caracteres', async () => {
      // Arrange
      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo del cambio de descuento');
      await user.type(motivoInput, 'ab');

      // Assert
      expect(screen.getByText('Minimo 3 caracteres')).toBeInTheDocument();
    });

    it('deberia mostrar error de minimo cuando aprobado por tiene menos de 3 caracteres', async () => {
      // Arrange
      const { user } = renderModal();

      // Act
      const aprobadoInput = screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"');
      await user.type(aprobadoInput, 'JD');

      // Assert
      expect(screen.getByText('Minimo 3 caracteres')).toBeInTheDocument();
    });
  });

  // --- Interacciones completas ---

  describe('interacciones', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia enviar la solicitud de actualizacion de descuento', async () => {
      // Arrange
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.put(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json(apiResponse(buildSubscription()));
          },
        ),
      );

      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Act: rellenar formulario
      const motivoInput = screen.getByPlaceholderText('Indique el motivo del cambio de descuento');
      await user.type(motivoInput, 'Descuento por antiguedad');

      const aprobadoInput = screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"');
      await user.type(aprobadoInput, 'Junta Directiva 22/03/2026');

      // Act: guardar
      await user.click(screen.getByText('Guardar'));

      // Assert: API llamada con payload correcto
      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });
      expect(capturedBody).toEqual(
        expect.objectContaining({
          personalDiscount: expect.any(Number),
          reason: 'Descuento por antiguedad',
          approvedBy: 'Junta Directiva 22/03/2026',
        }),
      );
    });

    it('deberia cerrar el modal tras actualizacion exitosa', async () => {
      // Arrange
      server.use(
        http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId', () => {
          return HttpResponse.json(apiResponse(buildSubscription()));
        }),
      );

      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Act: rellenar formulario y guardar
      await user.type(
        screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
        'Motivo valido',
      );
      await user.type(
        screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"'),
        'Presidente',
      );
      await user.click(screen.getByText('Guardar'));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('deberia mostrar notificacion de exito tras actualizar descuento', async () => {
      // Arrange
      server.use(
        http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId', () => {
          return HttpResponse.json(apiResponse(buildSubscription()));
        }),
      );

      const { user } = renderModal();

      // Act
      await user.type(
        screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
        'Motivo test',
      );
      await user.type(
        screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"'),
        'Comision Economica',
      );
      await user.click(screen.getByText('Guardar'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Descuento actualizado',
            color: 'green',
          }),
        );
      });
    });

    it('deberia mostrar estado de carga en boton Guardar durante la mutacion', async () => {
      // Arrange
      let resolveUpdate: (() => void) | undefined;
      server.use(
        http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId', () => {
          return new Promise<Response>((resolve) => {
            resolveUpdate = () => resolve(HttpResponse.json(apiResponse(buildSubscription())));
          });
        }),
      );

      const { user } = renderModal();

      // Act: rellenar y enviar
      await user.type(
        screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
        'Motivo valido',
      );
      await user.type(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"'), 'Directiva');
      await user.click(screen.getByText('Guardar'));

      // Assert: boton en loading
      await waitFor(() => {
        const button = screen.getByText('Guardar').closest('button')!;
        expect(button).toHaveAttribute('data-loading');
      });

      // Cleanup
      resolveUpdate?.();
    });
  });

  // --- Error de API ---

  describe('error de API', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mantener modal abierto cuando la API devuelve 409', async () => {
      // Arrange
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      const mockOnClose = vi.fn();
      server.use(
        http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId', () => {
          return HttpResponse.json(
            { message: 'No se pudo actualizar el descuento' },
            { status: 409 },
          );
        }),
      );

      const { user } = renderModal({ onClose: mockOnClose });

      // Act: rellenar y enviar
      await user.type(
        screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
        'Motivo valido',
      );
      await user.type(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"'), 'Directiva');
      await user.click(screen.getByText('Guardar'));

      // Assert: modal NO se cierra
      await waitFor(() => {
        const button = screen.getByText('Guardar').closest('button')!;
        expect(button).not.toHaveAttribute('data-loading');
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });

    it('deberia mostrar notificacion de error con 409 (descuento no permitido)', async () => {
      // El hook useUpdateDiscount.onError ahora usa ApiError.status correctamente
      // para detectar error 409 y mostrar notificacion roja.
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      server.use(
        http.put('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId', () => {
          return HttpResponse.json({ message: 'Conflict' }, { status: 409 });
        }),
      );

      const { user } = renderModal();

      // Act
      await user.type(
        screen.getByPlaceholderText('Indique el motivo del cambio de descuento'),
        'Motivo valido',
      );
      await user.type(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"'), 'Comision');
      await user.click(screen.getByText('Guardar'));

      // Assert: error notification IS shown now that the bug is fixed
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            color: 'red',
          }),
        );
      });

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });
  });

  // --- Modal cerrado ---

  describe('modal cerrado', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia no renderizar contenido cuando esta cerrado', () => {
      // Act
      renderModal({ opened: false });

      // Assert
      expect(screen.queryByText('Modificar Descuento')).not.toBeInTheDocument();
    });
  });
});
