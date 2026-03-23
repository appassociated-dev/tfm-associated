import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan, resetFeePlanCounters } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';

import { FeePlansListPage } from './fee-plans-list.page';

// === Mocks ===

// Mock de modales hijos para aislar la pagina
vi.mock('../components/fee-plan-create-modal', () => ({
  FeePlanCreateModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="create-modal">Create Modal</div> : null,
}));

vi.mock('../components/fee-plan-edit-modal', () => ({
  FeePlanEditModal: ({ opened, plan }: { opened: boolean; plan: unknown }) =>
    opened ? <div data-testid="edit-modal">Edit Modal {plan ? 'con plan' : 'sin plan'}</div> : null,
}));

vi.mock('../components/deactivate-fee-plan-modal', () => ({
  DeactivateFeePlanModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="deactivate-modal">Deactivate Modal</div> : null,
}));

vi.mock('../components/link-member-types-modal', () => ({
  LinkMemberTypesModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="link-modal">Link Modal</div> : null,
}));

vi.mock('../components/import-template-modal', () => ({
  ImportTemplateModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="import-modal">Import Modal</div> : null,
}));

// Mock de @mantine/notifications para evitar errores de portal
vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

// === Tests ===

describe('FeePlansListPage', () => {
  beforeEach(() => {
    resetFeePlanCounters();
  });

  // --- Estado de carga ---

  describe('estado de carga', () => {
    it('deberia renderizar skeleton de carga mientras se obtienen los datos', () => {
      // Arrange: forzar un handler que nunca resuelve
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return new Promise(() => {}); // nunca resuelve — mantiene loading
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      expect(screen.getByText('Planes de Cuota')).toBeInTheDocument();
      const skeletons = document.querySelectorAll('.mantine-Skeleton-root');
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });
  });

  // --- Datos cargados correctamente ---

  describe('tabla con datos', () => {
    it('deberia renderizar tabla con planes cuando hay datos disponibles', async () => {
      // Arrange
      const plans = [
        buildFeePlan({
          code: 'CUOTA-ANUAL',
          name: 'Cuota Anual',
          type: 'RECURRING',
          amount: 12000,
        }),
        buildFeePlan({ code: 'INSCRIPCION', name: 'Inscripcion', type: 'ONE_TIME', amount: 5000 }),
      ];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('CUOTA-ANUAL')).toBeInTheDocument();
      });
      expect(screen.getByText('INSCRIPCION')).toBeInTheDocument();
      expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      expect(screen.getByText('Inscripcion')).toBeInTheDocument();
      // Badges de tipo
      expect(screen.getByText('Periódico')).toBeInTheDocument();
      expect(screen.getByText('Única')).toBeInTheDocument();
      // Badge con conteo total
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('deberia renderizar badge de conteo con 3 planes (triangulacion)', async () => {
      // Arrange: 3 planes para evitar constante hardcodeada
      const plans = [
        buildFeePlan({ code: 'PLAN-A', name: 'Plan A' }),
        buildFeePlan({ code: 'PLAN-B', name: 'Plan B' }),
        buildFeePlan({ code: 'PLAN-C', name: 'Plan C' }),
      ];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('deberia formatear importes con simbolo de euro', async () => {
      // Arrange: 12000 centavos = 120,00 EUR y 5000 centavos = 50,00 EUR
      const plans = [buildFeePlan({ amount: 12000 }), buildFeePlan({ amount: 5000 })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        const euroCells = screen.getAllByText(/€/);
        expect(euroCells.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('deberia mostrar badges de estado Activo/Inactivo', async () => {
      // Arrange
      const plans = [
        buildFeePlan({ code: 'ACTIVO', name: 'Plan Activo', active: true }),
        buildFeePlan({ code: 'INACTIVO', name: 'Plan Inactivo', active: false }),
      ];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('ACTIVO')).toBeInTheDocument();
      });
      expect(screen.getByText('Activo')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    it('deberia mostrar periodicidad Anual para plan RECURRING con frecuencia ANNUAL', async () => {
      // Arrange
      const plans = [buildFeePlan({ type: 'RECURRING', frequency: 'ANNUAL' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Anual')).toBeInTheDocument();
      });
    });

    it('deberia mostrar guion en periodicidad para plan ONE_TIME', async () => {
      // Arrange
      const plans = [buildFeePlan({ type: 'ONE_TIME', frequency: null, billingMonths: [] })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('\u2014')).toBeInTheDocument();
      });
    });
  });

  // --- Estado vacio ---

  describe('estado vacio', () => {
    it('deberia mostrar estado vacio cuando no hay planes', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No hay planes de cuota configurados')).toBeInTheDocument();
      });
    });

    it('deberia mostrar boton "Crear primer plan" en estado vacio con permiso de creacion', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:create'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Crear primer plan')).toBeInTheDocument();
      });
    });
  });

  // --- Permisos ---

  describe('permisos', () => {
    it('deberia mostrar boton Nuevo Plan solo con permiso treasury:fee-plans:create', async () => {
      // Arrange
      const plans = [buildFeePlan()];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:create'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Nuevo Plan')).toBeInTheDocument();
      });
    });

    it('deberia ocultar boton Nuevo Plan sin permiso de creacion', async () => {
      // Arrange
      const plans = [buildFeePlan()];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:read'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(plans[0].code)).toBeInTheDocument();
      });
      expect(screen.queryByText('Nuevo Plan')).not.toBeInTheDocument();
    });
  });

  // --- Estado de error ---

  describe('estado de error', () => {
    it('deberia mostrar alerta de error cuando la consulta falla', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
      });
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('deberia reintentar la carga al hacer click en Reintentar', async () => {
      // Arrange: primer request falla, segundo tiene exito
      let callCount = 0;
      const plans = [buildFeePlan({ code: 'RECUPERADO' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Error' }, { status: 500 });
          }
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />);

      // Assert: primero error
      await waitFor(() => {
        expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
      });

      // Act: click en Reintentar
      await user.click(screen.getByText('Reintentar'));

      // Assert: ahora muestra datos
      await waitFor(() => {
        expect(screen.getByText('RECUPERADO')).toBeInTheDocument();
      });
    });
  });

  // --- Filtro de inactivos ---

  describe('filtro de inactivos', () => {
    it('deberia mostrar switch de filtro para inactivos', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([buildFeePlan()]));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Mostrar inactivos')).toBeInTheDocument();
      });
    });

    it('deberia alternar el switch de inactivos al hacer click', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([buildFeePlan()]));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />);

      // Assert: esperar a que carguen datos y el switch sea visible
      await waitFor(() => {
        expect(screen.getByText('Mostrar inactivos')).toBeInTheDocument();
      });

      // Mantine Switch usa role="switch", no role="checkbox"
      const switchInput = screen.getByRole('switch', { name: /Mostrar inactivos/i });
      expect(switchInput).not.toBeChecked();

      // Act: click en switch
      await user.click(switchInput);

      // Assert: switch activado
      expect(switchInput).toBeChecked();
    });
  });

  // --- Importar plantilla ---

  describe('importar plantilla', () => {
    it('deberia mostrar boton Importar Plantilla solo cuando no hay planes y tiene permiso', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:create'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Importar Plantilla')).toBeInTheDocument();
      });
    });

    it('deberia NO mostrar Importar Plantilla cuando ya hay planes', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([buildFeePlan()]));
        }),
      );

      // Act
      render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:create'] },
      });

      // Assert: esperar a que aparezca algun plan en la tabla
      await waitFor(() => {
        expect(screen.getByText(/CUOTA-/)).toBeInTheDocument();
      });
      expect(screen.queryByText('Importar Plantilla')).not.toBeInTheDocument();
    });

    it('deberia abrir modal de importar al hacer click en boton Importar Plantilla', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:create'] },
      });

      await waitFor(() => {
        expect(screen.getByText('Importar Plantilla')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Importar Plantilla'));

      // Assert
      expect(screen.getByTestId('import-modal')).toBeInTheDocument();
    });
  });

  // --- Acciones de modal (crear) ---

  describe('modal de creacion', () => {
    it('deberia abrir modal de creacion al hacer click en Nuevo Plan', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([buildFeePlan()]));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:create'] },
      });

      await waitFor(() => {
        expect(screen.getByText('Nuevo Plan')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nuevo Plan'));

      // Assert
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  // --- Menu de acciones por fila ---

  describe('menu de acciones por fila', () => {
    it('deberia mostrar boton Acciones en cada fila de la tabla', async () => {
      // Arrange
      const plans = [buildFeePlan({ code: 'PLAN-A' }), buildFeePlan({ code: 'PLAN-B' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert: usar getAllByRole('button') para evitar match con el TH header "Acciones"
      await waitFor(() => {
        expect(screen.getByText('PLAN-A')).toBeInTheDocument();
      });
      const actionButtons = screen.getAllByRole('button', { name: 'Acciones' });
      expect(actionButtons).toHaveLength(2);
    });

    it('deberia mostrar opcion "Ver vinculaciones" en menu de acciones', async () => {
      // Arrange
      const plans = [buildFeePlan({ code: 'MI-PLAN' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />);

      await waitFor(() => {
        expect(screen.getByText('MI-PLAN')).toBeInTheDocument();
      });

      // Act: abrir menu via boton (Mantine Menu.Dropdown renderiza en portal)
      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: esperar a que el dropdown se renderice en el portal
      await waitFor(() => {
        expect(screen.getByText('Ver vinculaciones')).toBeInTheDocument();
      });
    });

    it('deberia mostrar opcion "Editar" solo con permiso treasury:fee-plans:update', async () => {
      // Arrange
      const plans = [buildFeePlan()];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:update'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: esperar renderizado del dropdown en portal
      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
      });
    });

    it('deberia NO mostrar opcion "Editar" sin permiso de actualizacion', async () => {
      // Arrange
      const plans = [buildFeePlan()];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:read'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: el dropdown se abre pero sin opcion Editar
      // Esperamos a que aparezca "Ver vinculaciones" (siempre presente) para confirmar que el menu esta abierto
      await waitFor(() => {
        expect(screen.getByText('Ver vinculaciones')).toBeInTheDocument();
      });
      expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    });

    it('deberia mostrar opcion "Inactivar" para plan activo con permiso deactivate', async () => {
      // Arrange
      const plans = [buildFeePlan({ active: true })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:deactivate'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: esperar renderizado del dropdown en portal
      await waitFor(() => {
        expect(screen.getByText('Inactivar')).toBeInTheDocument();
      });
    });

    it('deberia mostrar opcion "Activar" para plan inactivo con permiso update', async () => {
      // Arrange
      const plans = [buildFeePlan({ active: false })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:update'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: esperar renderizado del dropdown en portal
      await waitFor(() => {
        expect(screen.getByText('Activar')).toBeInTheDocument();
      });
    });

    it('deberia abrir modal de edicion al hacer click en Editar', async () => {
      // Arrange
      const plans = [buildFeePlan({ code: 'EDITABLE' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:update'] },
      });

      await waitFor(() => {
        expect(screen.getByText('EDITABLE')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Esperar que el menu se abra y click en Editar
      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Editar'));

      // Assert
      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    it('deberia abrir modal de inactivacion al hacer click en Inactivar', async () => {
      // Arrange
      const plans = [buildFeePlan({ active: true })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:deactivate'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Esperar que el menu se abra y click en Inactivar
      await waitFor(() => {
        expect(screen.getByText('Inactivar')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Inactivar'));

      // Assert
      expect(screen.getByTestId('deactivate-modal')).toBeInTheDocument();
    });

    it('deberia abrir modal de vinculacion al hacer click en Ver vinculaciones', async () => {
      // Arrange
      const plans = [buildFeePlan({ code: 'VINCULAR' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />);

      await waitFor(() => {
        expect(screen.getByText('VINCULAR')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Esperar que el menu se abra y click en Ver vinculaciones
      await waitFor(() => {
        expect(screen.getByText('Ver vinculaciones')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Ver vinculaciones'));

      // Assert
      expect(screen.getByTestId('link-modal')).toBeInTheDocument();
    });

    it('deberia NO mostrar opcion "Inactivar" para plan ya inactivo', async () => {
      // Arrange
      const plans = [buildFeePlan({ active: false })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:deactivate', 'treasury:fee-plans:read'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: el dropdown se abre con "Ver vinculaciones" pero NO "Inactivar"
      await waitFor(() => {
        expect(screen.getByText('Ver vinculaciones')).toBeInTheDocument();
      });
      expect(screen.queryByText('Inactivar')).not.toBeInTheDocument();
    });

    it('deberia NO mostrar opcion "Activar" para plan ya activo', async () => {
      // Arrange
      const plans = [buildFeePlan({ active: true })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:update'] },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      // Assert: el dropdown se abre pero no muestra Activar para plan ya activo
      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
      });
      expect(screen.queryByText('Activar')).not.toBeInTheDocument();
    });

    it('deberia renderizar un boton Acciones por cada fila (triangulacion con 3 filas)', async () => {
      // Arrange
      const plans = [
        buildFeePlan({ code: 'PLAN-1' }),
        buildFeePlan({ code: 'PLAN-2' }),
        buildFeePlan({ code: 'PLAN-3' }),
      ];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('PLAN-1')).toBeInTheDocument();
      });
      const actionButtons = screen.getAllByRole('button', { name: 'Acciones' });
      expect(actionButtons).toHaveLength(3);
    });

    it('deberia llamar a la API de activacion al hacer click en Activar', async () => {
      // Arrange
      let activateCalled = false;
      const plans = [buildFeePlan({ active: false, code: 'INACTIVO-PLAN' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
        http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
          activateCalled = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      const { user } = render(<FeePlansListPage />, {
        auth: { permissions: ['treasury:fee-plans:update'] },
      });

      await waitFor(() => {
        expect(screen.getByText('INACTIVO-PLAN')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      await waitFor(() => {
        expect(screen.getByText('Activar')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Activar'));

      // Assert
      await waitFor(() => {
        expect(activateCalled).toBe(true);
      });
    });

    it('deberia mostrar periodicidad Trimestral para plan con frecuencia QUARTERLY', async () => {
      // Arrange
      const plans = [buildFeePlan({ type: 'RECURRING', frequency: 'QUARTERLY' })];
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse(plans));
        }),
      );

      // Act
      render(<FeePlansListPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Trimestral')).toBeInTheDocument();
      });
    });
  });
});
