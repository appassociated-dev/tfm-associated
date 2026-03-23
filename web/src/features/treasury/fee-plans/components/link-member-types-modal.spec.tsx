import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildMemberTypeOption, resetFeePlanCounters } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';

import { LinkMemberTypesModal } from './link-member-types-modal';

// === Mocks ===

// Mock de @mantine/notifications para evitar errores de portal
const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

// === Helpers ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const defaultMemberTypes = [
  buildMemberTypeOption({
    id: '111e8400-e29b-41d4-a716-446655440001',
    code: 'TITULAR',
    name: 'Titular',
  }),
  buildMemberTypeOption({
    id: '222e8400-e29b-41d4-a716-446655440002',
    code: 'FAMILIAR',
    name: 'Familiar',
  }),
  buildMemberTypeOption({
    id: '333e8400-e29b-41d4-a716-446655440003',
    code: 'JUVENIL',
    name: 'Juvenil',
  }),
];

function renderModal(props: Partial<Parameters<typeof LinkMemberTypesModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    planId: VALID_UUID,
    planName: 'Cuota Anual',
    currentLinks: [],
    ...props,
  };

  return render(<LinkMemberTypesModal {...defaultProps} />);
}

// === Tests ===

describe('LinkMemberTypesModal', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  beforeEach(() => {
    resetFeePlanCounters();
    vi.clearAllMocks();
    // Handler para obtener tipos de socio
    server.use(
      http.get('*/v1/member-types', () => {
        return HttpResponse.json(apiResponse(defaultMemberTypes));
      }),
    );
  });

  // --- Renderizado inicial ---

  describe('renderizado inicial', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar el titulo del modal', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Vincular a Tipos de Socio')).toBeInTheDocument();
      });
    });

    it('deberia mostrar el nombre del plan en el subtitulo', async () => {
      // Act
      renderModal({ planName: 'Cuota Trimestral' });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota Trimestral')).toBeInTheDocument();
      });
    });

    it('deberia mostrar nombre del plan diferente en subtitulo (triangulacion)', async () => {
      // Act
      renderModal({ planName: 'Inscripcion Juvenil' });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Inscripcion Juvenil')).toBeInTheDocument();
      });
    });

    it('deberia mostrar boton Cancelar y boton Guardar vinculaciones', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });
      expect(screen.getByText('Guardar vinculaciones')).toBeInTheDocument();
    });
  });

  // --- Estado de carga ---

  describe('estado de carga', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar loader de carga cuando los tipos estan cargando', () => {
      // Arrange: handler que nunca resuelve
      server.use(
        http.get('*/v1/member-types', () => {
          return new Promise(() => {});
        }),
      );

      // Act
      renderModal();

      // Assert: no hay checkboxes visibles aun
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  // --- Tabla de tipos de socio ---

  describe('tabla de tipos de socio', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia renderizar la lista de tipos de socio con checkboxes', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Titular')).toBeInTheDocument();
      });
      expect(screen.getByText('Familiar')).toBeInTheDocument();
      expect(screen.getByText('Juvenil')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Familiar' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Juvenil' })).toBeInTheDocument();
    });

    it('deberia mostrar los codigos de los tipos de socio en la tabla', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('TITULAR')).toBeInTheDocument();
      });
      expect(screen.getByText('FAMILIAR')).toBeInTheDocument();
      expect(screen.getByText('JUVENIL')).toBeInTheDocument();
    });

    it('deberia mostrar radio buttons para seleccion de default por cada tipo', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole('radio', { name: 'Marcar Titular como default' }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole('radio', { name: 'Marcar Familiar como default' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: 'Marcar Juvenil como default' }),
      ).toBeInTheDocument();
    });

    it('deberia mostrar campos NumberInput de orden para cada tipo de socio', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'Orden de Titular' })).toBeInTheDocument();
      });
      expect(screen.getByRole('textbox', { name: 'Orden de Familiar' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Orden de Juvenil' })).toBeInTheDocument();
    });

    it('deberia mostrar texto de sin tipos cuando la lista esta vacia', async () => {
      // Arrange: responder con lista vacia
      server.use(
        http.get('*/v1/member-types', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No hay tipos de socio activos disponibles.')).toBeInTheDocument();
      });
    });
  });

  // --- Seleccion de tipos ---

  describe('seleccion de tipos de socio', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia tener el boton Guardar deshabilitado cuando no hay tipos seleccionados', async () => {
      // Act
      renderModal();

      // Assert
      await waitFor(() => {
        const saveButton = screen.getByText('Guardar vinculaciones').closest('button')!;
        expect(saveButton).toBeDisabled();
      });
    });

    it('deberia habilitar boton Guardar al seleccionar un tipo de socio', async () => {
      // Act
      const { user } = renderModal();

      // Assert: esperar a que carguen los tipos
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      // Act: seleccionar Titular
      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Titular' }));

      // Assert
      const saveButton = screen.getByText('Guardar vinculaciones').closest('button')!;
      expect(saveButton).not.toBeDisabled();
    });

    it('deberia deshabilitar boton Guardar al deseleccionar todos los tipos', async () => {
      // Act
      const { user } = renderModal();

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      // Act: seleccionar y luego deseleccionar
      const checkbox = screen.getByRole('checkbox', { name: 'Seleccionar Titular' });
      await user.click(checkbox); // seleccionar
      await user.click(checkbox); // deseleccionar

      // Assert
      const saveButton = screen.getByText('Guardar vinculaciones').closest('button')!;
      expect(saveButton).toBeDisabled();
    });

    it('deberia permitir seleccionar multiples tipos simultaneamente', async () => {
      // Act
      const { user } = renderModal();

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      // Act: seleccionar Titular y Familiar
      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Titular' }));
      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Familiar' }));

      // Assert
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Familiar' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Juvenil' })).not.toBeChecked();
    });
  });

  // --- Pre-populated links ---

  describe('vinculaciones existentes', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia pre-seleccionar tipos que ya estan vinculados', async () => {
      // Arrange: Titular ya esta vinculado
      renderModal({
        currentLinks: [
          {
            memberTypeId: '111e8400-e29b-41d4-a716-446655440001',
            memberTypeName: 'Titular',
            feePlanId: VALID_UUID,
            isDefault: true,
            order: 1,
            active: true,
          },
        ],
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeChecked();
      });
      expect(screen.getByRole('checkbox', { name: 'Seleccionar Familiar' })).not.toBeChecked();
    });
  });

  // --- Envio de vinculaciones ---

  describe('envio de vinculaciones', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia enviar vinculaciones al backend al hacer click en Guardar', async () => {
      // Arrange
      let apiCalled = false;
      const mockOnClose = vi.fn();

      server.use(
        http.post('*/v1/treasury/fee-plans/:planId/link-member-types', async () => {
          apiCalled = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      const { user } = renderModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      // Seleccionar Titular
      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Titular' }));

      // Click en Guardar
      await user.click(screen.getByText('Guardar vinculaciones'));

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

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancelar'));

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // --- Error al cargar tipos ---

  describe('error al cargar tipos', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia no mostrar checkboxes cuando la API falla', async () => {
      // Arrange
      server.use(
        http.get('*/v1/member-types', () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 });
        }),
      );

      // Act
      renderModal();

      // Assert: no se muestran checkboxes
      // Esperamos un breve periodo para dar chance a la query de fallar
      await waitFor(() => {
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      });
    });
  });

  // --- Error al guardar vinculaciones ---

  describe('error al guardar vinculaciones', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar notificacion de error cuando la API de guardar falla', async () => {
      // Arrange: suprimir el unhandled rejection esperado
      // (mutateAsync rechaza porque el componente no tiene try/catch)
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      server.use(
        http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
          return HttpResponse.json({ message: 'Conflicto de vinculacion' }, { status: 409 });
        }),
      );

      // Act
      const { user } = renderModal();

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Titular' }));
      await user.click(screen.getByText('Guardar vinculaciones'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error al guardar vinculaciones',
            color: 'red',
          }),
        );
      });

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });
  });

  // --- Seleccion de default ---

  describe('seleccion de tipo default', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia permitir seleccionar un tipo como default via radio button', async () => {
      // Act
      const { user } = renderModal();

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      // Seleccionar primero con checkbox
      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Titular' }));

      // Seleccionar como default
      await user.click(screen.getByRole('radio', { name: 'Marcar Titular como default' }));

      // Assert
      expect(screen.getByRole('radio', { name: 'Marcar Titular como default' })).toBeChecked();
    });

    it('deberia desactivar radios de default para tipos no seleccionados', async () => {
      // Act
      renderModal();

      await waitFor(() => {
        expect(
          screen.getByRole('radio', { name: 'Marcar Titular como default' }),
        ).toBeInTheDocument();
      });

      // Assert: todos los radios deshabilitados cuando ningun checkbox esta seleccionado
      expect(screen.getByRole('radio', { name: 'Marcar Titular como default' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Marcar Familiar como default' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Marcar Juvenil como default' })).toBeDisabled();
    });
  });

  // --- Notificacion de exito ---

  describe('notificacion de exito', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar notificacion de exito tras guardar vinculaciones', async () => {
      // Arrange
      server.use(
        http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      const { user } = renderModal();

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Titular' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Titular' }));
      await user.click(screen.getByText('Guardar vinculaciones'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Vinculaciones actualizadas',
            color: 'green',
          }),
        );
      });
    });
  });
});
