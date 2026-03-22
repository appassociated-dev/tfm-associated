import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';

import { ExemptionModal } from './exemption-modal';

// === Mocks ===

const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

// === Helpers ===

function renderModal(props: Partial<Parameters<typeof ExemptionModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    memberAccountId: 'test-member-account-id',
    subscriptionId: 'sub-001',
    ...props,
  };

  return render(<ExemptionModal {...defaultProps} />);
}

// === Tests ===

describe('ExemptionModal', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Renderizado base ---

  describe('renderizado base', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar el titulo del modal "Exencion Temporal"', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Exencion Temporal')).toBeInTheDocument();
    });

    it('deberia renderizar el selector de tipo de exencion (SegmentedControl)', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Tipo de exencion')).toBeInTheDocument();
      expect(screen.getByText('Exencion total (sin suscripcion)')).toBeInTheDocument();
      expect(screen.getByText('Exencion con trazabilidad')).toBeInTheDocument();
    });

    it('deberia mostrar texto descriptivo para exencion total (seleccionada por defecto)', () => {
      // Act
      renderModal();

      // Assert
      expect(
        screen.getByText(/Se cerrara la suscripcion con motivo EXEMPTION/),
      ).toBeInTheDocument();
    });

    it('deberia mostrar el campo Textarea para motivo', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Motivo de la exencion')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Indique el motivo de la exencion temporal'),
      ).toBeInTheDocument();
    });

    it('deberia mostrar el campo TextInput para "Aprobado por"', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Aprobado por')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ej: "Junta Directiva 15/03/2026"')).toBeInTheDocument();
    });

    it('deberia mostrar alerta informativa sobre no generacion de cargos', () => {
      // Act
      renderModal();

      // Assert
      expect(
        screen.getByText('No se generaran cargos durante el periodo de exencion'),
      ).toBeInTheDocument();
    });
  });

  // --- Botones ---

  describe('botones de accion', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar botones Cancelar y "Aplicar Exencion"', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
      expect(applyButton).toBeInTheDocument();
    });

    it('deberia tener el boton Aplicar Exencion deshabilitado cuando no hay motivo', () => {
      // Act
      renderModal();

      // Assert
      const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
      expect(applyButton).toBeDisabled();
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

  // --- Validacion ---

  describe('validacion del formulario', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia habilitar boton Aplicar Exencion cuando hay motivo valido (>= 3 chars)', async () => {
      // Arrange
      const { user } = renderModal();

      // Act: rellenar motivo (>= 3 chars)
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Situacion economica dificil');

      // Assert
      const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
      expect(applyButton).not.toBeDisabled();
    });

    it('deberia mantener deshabilitado con motivo de menos de 3 caracteres', async () => {
      // Arrange
      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'ab');

      // Assert
      const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
      expect(applyButton).toBeDisabled();
    });

    it('deberia mostrar error de minimo cuando motivo tiene menos de 3 caracteres', async () => {
      // Arrange
      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'ab');

      // Assert
      expect(screen.getByText('Minimo 3 caracteres')).toBeInTheDocument();
    });

    it('deberia habilitar con motivo de exactamente 3 caracteres (triangulacion)', async () => {
      // Arrange
      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'abc');

      // Assert
      const applyButton = screen.getByText('Aplicar Exencion').closest('button')!;
      expect(applyButton).not.toBeDisabled();
    });
  });

  // --- Interacciones completas ---

  describe('interacciones', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia enviar solicitud de cierre con motivo EXEMPTION', async () => {
      // Arrange
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.patch(
          '*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/close',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Act: rellenar motivo
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Situacion economica dificil');

      // Act: aplicar exencion
      await user.click(screen.getByText('Aplicar Exencion'));

      // Assert: API llamada con payload correcto
      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });
      expect(capturedBody).toEqual(
        expect.objectContaining({
          reason: 'EXEMPTION',
        }),
      );
    });

    it('deberia cerrar el modal tras exencion exitosa', async () => {
      // Arrange
      server.use(
        http.patch('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/close', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const mockOnClose = vi.fn();
      const { user } = renderModal({ onClose: mockOnClose });

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Motivo valido');
      await user.click(screen.getByText('Aplicar Exencion'));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('deberia mostrar notificacion de exito tras cerrar suscripcion', async () => {
      // Arrange
      server.use(
        http.patch('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/close', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Motivo de exencion');
      await user.click(screen.getByText('Aplicar Exencion'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Suscripcion cerrada',
            color: 'green',
          }),
        );
      });
    });

    it('deberia mostrar estado de carga en boton durante la mutacion', async () => {
      // Arrange
      let resolveClose: (() => void) | undefined;
      server.use(
        http.patch('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/close', () => {
          return new Promise<Response>((resolve) => {
            resolveClose = () => resolve(new HttpResponse(null, { status: 204 }));
          });
        }),
      );

      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Motivo valido');
      await user.click(screen.getByText('Aplicar Exencion'));

      // Assert: boton en loading
      await waitFor(() => {
        const button = screen.getByText('Aplicar Exencion').closest('button')!;
        expect(button).toHaveAttribute('data-loading');
      });

      // Cleanup
      resolveClose?.();
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
        http.patch('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/close', () => {
          return HttpResponse.json(
            { message: 'No se pudo cerrar la suscripcion' },
            { status: 409 },
          );
        }),
      );

      const { user } = renderModal({ onClose: mockOnClose });

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Motivo valido');
      await user.click(screen.getByText('Aplicar Exencion'));

      // Assert: modal NO se cierra
      await waitFor(() => {
        const button = screen.getByText('Aplicar Exencion').closest('button')!;
        expect(button).not.toHaveAttribute('data-loading');
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });

    it('deberia mostrar notificacion de error con 409 (cierre no permitido)', async () => {
      // El hook useCloseSubscription.onError ahora usa ApiError.status correctamente
      // para detectar error 409 y mostrar notificacion roja.
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      server.use(
        http.patch('*/v1/treasury/member-accounts/:memberId/subscriptions/:subId/close', () => {
          return HttpResponse.json({ message: 'Conflict' }, { status: 409 });
        }),
      );

      const { user } = renderModal();

      // Act
      const motivoInput = screen.getByPlaceholderText('Indique el motivo de la exencion temporal');
      await user.type(motivoInput, 'Motivo de cierre');
      await user.click(screen.getByText('Aplicar Exencion'));

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
      expect(screen.queryByText('Exencion Temporal')).not.toBeInTheDocument();
    });
  });
});
