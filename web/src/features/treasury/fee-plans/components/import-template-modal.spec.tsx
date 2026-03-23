import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan, resetFeePlanCounters } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';

import { ImportTemplateModal } from './import-template-modal';

// === Mocks ===

const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

// === Helpers ===

const mockTemplateData = {
  collectivityType: 'club_deportivo',
  templates: [
    {
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
      type: 'RECURRING' as const,
      amount: 12000,
      frequency: 'ANNUAL' as const,
      billingMonths: [1],
    },
    {
      code: 'INSCRIPCION',
      name: 'Inscripcion',
      type: 'ONE_TIME' as const,
      amount: 5000,
      frequency: null,
      billingMonths: [],
    },
  ],
};

const penaTemplateData = {
  collectivityType: 'pena',
  templates: [
    {
      code: 'CUOTA-SOCIO',
      name: 'Cuota de Socio',
      type: 'RECURRING' as const,
      amount: 6000,
      frequency: 'MONTHLY' as const,
      billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  ],
};

function renderModal(props: Partial<Parameters<typeof ImportTemplateModal>[0]> = {}) {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    ...props,
  };

  return render(<ImportTemplateModal {...defaultProps} />);
}

// === Tests ===

describe('ImportTemplateModal', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  beforeEach(() => {
    resetFeePlanCounters();
    vi.clearAllMocks();
  });

  // --- Renderizado inicial ---

  describe('renderizado inicial', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia renderizar el titulo del modal', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Importar Plantilla de Planes')).toBeInTheDocument();
    });

    it('deberia renderizar el selector de tipo de colectividad', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Tipo de colectividad')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Seleccione un tipo')).toBeInTheDocument();
    });

    it('deberia mostrar botones Cancelar e Importar', () => {
      // Act
      renderModal();

      // Assert
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Importar')).toBeInTheDocument();
    });

    it('deberia tener el boton Importar deshabilitado cuando no hay tipo seleccionado', () => {
      // Act
      renderModal();

      // Assert
      const importButton = screen.getByText('Importar').closest('button')!;
      expect(importButton).toBeDisabled();
    });

    it('deberia no renderizar contenido cuando esta cerrado', () => {
      // Act
      renderModal({ opened: false });

      // Assert
      expect(screen.queryByText('Importar Plantilla de Planes')).not.toBeInTheDocument();
    });
  });

  // --- Seleccion de tipo y preview ---

  describe('seleccion de tipo y preview de plantillas', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar tabla de preview al seleccionar Club Deportivo', async () => {
      // Arrange: handler para templates
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();

      // Act: seleccionar tipo de colectividad
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);

      // Buscar y seleccionar "Club Deportivo" del dropdown
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert: debe mostrar los datos de la plantilla
      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });
      expect(screen.getByText('Inscripcion')).toBeInTheDocument();
    });

    it('deberia mostrar badges de tipo (Periodico/Unica) en la preview', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Periódico')).toBeInTheDocument();
      });
      expect(screen.getByText('Única')).toBeInTheDocument();
    });

    it('deberia mostrar importes formateados en la preview', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        const euroCells = screen.getAllByText(/€/);
        expect(euroCells.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('deberia mostrar texto informativo con numero de planes a crear', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Se crearán 2 planes de cuota/)).toBeInTheDocument();
      });
    });

    it('deberia habilitar boton Importar al seleccionar tipo con plantillas disponibles', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).not.toBeDisabled();
      });
    });

    it('deberia mostrar texto de carga mientras se obtienen las plantillas', async () => {
      // Arrange: handler que tarda en resolver
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return new Promise(() => {}); // nunca resuelve
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cargando plantillas…')).toBeInTheDocument();
      });
    });

    it('deberia mostrar texto de sin plantillas cuando no hay disponibles', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(
            apiResponse({
              collectivityType: 'club_deportivo',
              templates: [],
            }),
          );
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText('No hay plantillas disponibles para este tipo de colectividad.'),
        ).toBeInTheDocument();
      });
    });
  });

  // --- Importacion ---

  describe('importacion de plantillas', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia llamar a la API de importacion al hacer click en Importar', async () => {
      // Arrange
      let apiCalled = false;
      const mockOnClose = vi.fn();

      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
        http.post('*/v1/treasury/fee-plans/import-template', () => {
          apiCalled = true;
          return HttpResponse.json(apiResponse([buildFeePlan(), buildFeePlan()]));
        }),
      );

      // Act
      const { user } = renderModal({ onClose: mockOnClose });
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Esperar a que se habilite el boton
      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).not.toBeDisabled();
      });

      // Act: click en Importar
      await user.click(screen.getByText('Importar'));

      // Assert
      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('deberia mostrar notificacion de exito tras importar', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
        http.post('*/v1/treasury/fee-plans/import-template', () => {
          return HttpResponse.json(apiResponse([buildFeePlan(), buildFeePlan()]));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).not.toBeDisabled();
      });

      await user.click(screen.getByText('Importar'));

      // Assert
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Plantilla importada',
            color: 'green',
          }),
        );
      });
    });
  });

  // --- Cancelar ---

  describe('cancelar', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
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
  });

  // --- Advertencia de planes existentes ---

  describe('advertencia de planes existentes', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar advertencia cuando ya existen planes configurados', async () => {
      // Arrange: simular que ya hay planes existentes
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([buildFeePlan()]));
        }),
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Ya hay planes configurados/)).toBeInTheDocument();
      });
    });
  });

  // --- Error de importacion ---

  describe('error de importacion', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia no cerrar modal cuando la importacion falla', async () => {
      // Arrange: suprimir el unhandled rejection esperado
      // (mutateAsync rechaza porque el componente no tiene try/catch)
      const windowHandler = (e: PromiseRejectionEvent) => e.preventDefault();
      const processHandler = () => {};
      window.addEventListener('unhandledrejection', windowHandler);
      process.on('unhandledRejection', processHandler);

      const mockOnClose = vi.fn();
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
        http.post('*/v1/treasury/fee-plans/import-template', () => {
          return HttpResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
        }),
      );

      // Act
      const { user } = renderModal({ onClose: mockOnClose });
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).not.toBeDisabled();
      });

      await user.click(screen.getByText('Importar'));

      // Assert: el modal no se cierra cuando falla la importacion
      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).not.toHaveAttribute('data-loading');
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('unhandledrejection', windowHandler);
      process.removeListener('unhandledRejection', processHandler);
    });
  });

  // --- Triangulacion con tipo Pena ---

  describe('triangulacion con tipo de colectividad Pena', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar plantillas de Pena con datos diferentes a Club Deportivo', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(penaTemplateData));
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Peña')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Peña'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota de Socio')).toBeInTheDocument();
      });
      expect(screen.getByText(/Se crearán 1 planes de cuota/)).toBeInTheDocument();
    });
  });

  // --- Estado de carga del boton importar ---

  describe('estado de carga durante importacion', () => {
    beforeEach(() => {
      mockNotificationsShow.mockClear();
    });

    it('deberia mostrar estado de carga en boton Importar durante la mutacion', async () => {
      // Arrange
      let resolveImport: (() => void) | undefined;
      server.use(
        http.get('*/v1/treasury/fee-plans/templates', () => {
          return HttpResponse.json(apiResponse(mockTemplateData));
        }),
        http.post('*/v1/treasury/fee-plans/import-template', () => {
          return new Promise<Response>((resolve) => {
            resolveImport = () =>
              resolve(HttpResponse.json(apiResponse([buildFeePlan(), buildFeePlan()])));
          });
        }),
      );

      // Act
      const { user } = renderModal();
      const selectInput = screen.getByPlaceholderText('Seleccione un tipo');
      await user.click(selectInput);
      await waitFor(() => {
        expect(screen.getByText('Club Deportivo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Club Deportivo'));

      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).not.toBeDisabled();
      });

      await user.click(screen.getByText('Importar'));

      // Assert: boton en loading
      await waitFor(() => {
        const importButton = screen.getByText('Importar').closest('button')!;
        expect(importButton).toHaveAttribute('data-loading');
      });

      // Cleanup: resolver la promesa
      resolveImport?.();
    });
  });
});
