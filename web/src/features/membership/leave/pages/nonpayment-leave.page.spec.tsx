import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildLeaveSummary } from '@/test/factories';
import { NonpaymentLeavePage } from './nonpayment-leave.page';

// === Mocks ===

// Mock de @mantine/notifications — portal no disponible en jsdom.
// vi.hoisted() garantiza que mockNotificationsShow existe antes del hoisting de vi.mock.
const { mockNotificationsShow } = vi.hoisted(() => ({
  mockNotificationsShow: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440000';

/** Resumen con socio en estado elegible para baja por impago (PENDING_PAYMENT). */
const summaryPendingPayment = buildLeaveSummary({
  memberId: MEMBER_ID,
  memberName: 'Carlos Ruiz López',
  memberNumber: 'SOC-099',
  currentStatus: 'PENDING_PAYMENT',
  pendingCharges: [
    {
      chargeId: '660e8400-e29b-41d4-a716-446655440001',
      concept: 'Cuota Enero 2026',
      amount: 4500,
      issueDate: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-01-31T00:00:00.000Z',
    },
  ],
  totalPendingDebt: 4500,
});

/** Resumen con socio en estado no elegible para baja por impago (ACTIVE). */
const summaryActive = buildLeaveSummary({
  memberId: MEMBER_ID,
  memberName: 'Ana García Torres',
  memberNumber: 'SOC-050',
  currentStatus: 'ACTIVE',
  pendingCharges: [],
  totalPendingDebt: 0,
});

// === Helpers ===

function renderPage() {
  return render(<NonpaymentLeavePage />, {
    route: '/members/:memberId/nonpayment-leave',
    path: `/members/${MEMBER_ID}/nonpayment-leave`,
  });
}

// === Tests ===

describe('NonpaymentLeavePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotificationsShow.mockClear();
    // Handler por defecto: resumen con socio en PENDING_PAYMENT y NONPAYMENT_LEAVE disponible
    server.use(
      http.get('*/v1/members/:memberId/leave-summary', () =>
        HttpResponse.json(apiResponse(summaryPendingPayment)),
      ),
      http.get('*/v1/members/:memberId/available-transitions', () =>
        HttpResponse.json(
          apiResponse({
            memberId: MEMBER_ID,
            currentStatus: 'PENDING_PAYMENT',
            availableTransitions: [{ status: 'NONPAYMENT_LEAVE', description: 'Baja por impago' }],
          }),
        ),
      ),
    );
  });

  // ===== Task 4.1: Renderizado básico =====

  describe('estado de carga', () => {
    it('deberia mostrar skeleton durante la carga inicial', () => {
      // Arrange: MSW nunca responde (simula red lenta)
      server.use(http.get('*/v1/members/:memberId/leave-summary', () => new Promise(() => {})));

      const { container } = renderPage();

      // Assert: skeletons visibles mientras carga
      const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('renderizado con datos del socio', () => {
    it('deberia mostrar el nombre del socio una vez cargado', async () => {
      renderPage();

      await waitFor(() => {
        const nameElements = screen.getAllByText('Carlos Ruiz López');
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('deberia mostrar el numero de socio', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('#SOC-099')).toBeInTheDocument();
      });
    });

    it('deberia renderizar el titulo de la pagina', async () => {
      renderPage();

      await waitFor(() => {
        // Aparece en breadcrumb y en el h2 — usamos getAllByText para ambos
        const titleElements = screen.getAllByText('Baja por Impago');
        expect(titleElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('deberia renderizar breadcrumbs correctamente', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Socios')).toBeInTheDocument();
      });
    });
  });

  // ===== Task 4.2: Flujo completo happy path =====

  describe('flujo completo de doble confirmacion', () => {
    it('deberia tener el boton habilitado para socio en PENDING_PAYMENT', async () => {
      renderPage();

      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      expect(executeButton.closest('button')).not.toBeDisabled();
    });

    it('deberia abrir el modal paso 1 al hacer click en el boton de ejecucion', async () => {
      const { user } = renderPage();

      // Esperar a que cargue la pagina
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');

      // Act: click en el boton de ejecucion
      await user.click(executeButton);

      // Assert: modal paso 1 visible
      await waitFor(() => {
        expect(screen.getByText('Confirmar Baja por Impago')).toBeInTheDocument();
      });
    });

    it('deberia avanzar al modal paso 2 al hacer click en Continuar', async () => {
      const { user } = renderPage();

      // Act: abrir modal paso 1
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);

      // Esperar modal paso 1
      await waitFor(() => {
        expect(screen.getByText('Confirmar Baja por Impago')).toBeInTheDocument();
      });

      // Act: click en Continuar
      await user.click(screen.getByText('Continuar'));

      // Assert: modal paso 2 visible
      await waitFor(() => {
        expect(screen.getByText('Confirmacion final')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('CONFIRMAR BAJA')).toBeInTheDocument();
      });
    });

    it('deberia mantener el boton de confirmacion final deshabilitado hasta escribir el texto correcto', async () => {
      const { user } = renderPage();

      // Navegar hasta modal paso 2
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Continuar'));
      await user.click(screen.getByText('Continuar'));
      await waitFor(() => screen.getByPlaceholderText('CONFIRMAR BAJA'));

      // Assert: boton deshabilitado con campo vacio (buscar por role para evitar ambiguedad con el titulo del modal)
      const confirmButton = screen.getByRole('button', { name: 'Confirmar Baja por Impago' });
      expect(confirmButton).toBeDisabled();
    });

    it('deberia habilitar el boton al escribir exactamente CONFIRMAR BAJA', async () => {
      const { user } = renderPage();

      // Navegar hasta modal paso 2
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Continuar'));
      await user.click(screen.getByText('Continuar'));
      await waitFor(() => screen.getByPlaceholderText('CONFIRMAR BAJA'));

      // Act: escribir texto de confirmacion exacto
      const input = screen.getByPlaceholderText('CONFIRMAR BAJA');
      fireEvent.change(input, { target: { value: 'CONFIRMAR BAJA' } });

      // Assert: boton habilitado
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirmar Baja por Impago' });
        expect(confirmButton).not.toBeDisabled();
      });
    });

    it('deberia ejecutar el POST y mostrar notificacion de exito al confirmar', async () => {
      // Handler MSW que registra la llamada POST (configurado ANTES de renderizar).
      // IMPORTANTE: effectiveDate debe ser ISO 8601 para pasar leaveResponseSchema (z.string().datetime())
      let postCalled = false;
      server.use(
        http.post('*/v1/members/:memberId/nonpayment-leave', () => {
          postCalled = true;
          return HttpResponse.json(
            apiResponse({
              memberId: MEMBER_ID,
              previousStatus: 'PENDING_PAYMENT',
              newStatus: 'NONPAYMENT_LEAVE',
              effectiveDate: '2026-03-29T00:00:00.000Z',
              subscriptionsClosed: 2,
              pendingChargesAmount: 4500,
            }),
          );
        }),
      );

      const { user } = renderPage();

      // Navegar hasta modal paso 2
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Continuar'));
      await user.click(screen.getByText('Continuar'));
      await waitFor(() => screen.getByPlaceholderText('CONFIRMAR BAJA'));

      // Act: escribir texto y confirmar
      const input = screen.getByPlaceholderText('CONFIRMAR BAJA');
      fireEvent.change(input, { target: { value: 'CONFIRMAR BAJA' } });

      // Esperar hasta que el boton este habilitado y luego hacer click
      const confirmButton = await waitFor(() => {
        const btn = screen.getByRole('button', { name: 'Confirmar Baja por Impago' });
        expect(btn).not.toBeDisabled();
        return btn;
      });

      // Usar fireEvent.click para evitar potenciales conflictos de user-event con Mantine
      fireEvent.click(confirmButton);

      // Esperar a que el POST se ejecute y onSuccess llame a notifications
      await waitFor(
        () => {
          expect(postCalled).toBe(true);
          expect(mockNotificationsShow).toHaveBeenCalledWith(
            expect.objectContaining({ color: 'green' }),
          );
        },
        { timeout: 3000 },
      );
    });
  });

  // ===== Task 4.3: Casos borde =====

  describe('boton deshabilitado para estado no elegible', () => {
    it('deberia deshabilitar el boton para socio en estado ACTIVE', async () => {
      // Arrange: socio con estado ACTIVE (no elegible) — backend no incluye NONPAYMENT_LEAVE
      server.use(
        http.get('*/v1/members/:memberId/leave-summary', () =>
          HttpResponse.json(apiResponse(summaryActive)),
        ),
        http.get('*/v1/members/:memberId/available-transitions', () =>
          HttpResponse.json(
            apiResponse({
              memberId: MEMBER_ID,
              currentStatus: 'ACTIVE',
              availableTransitions: [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }],
            }),
          ),
        ),
      );

      renderPage();

      // Assert: boton deshabilitado porque NONPAYMENT_LEAVE no esta en las transiciones disponibles
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      expect(executeButton.closest('button')).toBeDisabled();
    });
  });

  describe('cancelacion en modal paso 1', () => {
    it('deberia cerrar el modal y NO ejecutar el POST al cancelar en paso 1', async () => {
      let postCalled = false;
      server.use(
        http.post('*/v1/members/:memberId/nonpayment-leave', () => {
          postCalled = true;
          return HttpResponse.json(apiResponse({}));
        }),
      );

      const { user } = renderPage();

      // Abrir modal paso 1
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Confirmar Baja por Impago'));

      // Act: cancelar en paso 1
      await user.click(screen.getByText('Cancelar'));

      // Assert: modal cerrado y POST no ejecutado
      await waitFor(() => {
        expect(screen.queryByText('Confirmar Baja por Impago')).not.toBeInTheDocument();
      });
      expect(postCalled).toBe(false);
    });
  });

  describe('validacion del campo de doble confirmacion', () => {
    it('deberia mantener el boton deshabilitado con texto incorrecto', async () => {
      const { user } = renderPage();

      // Navegar hasta modal paso 2
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Continuar'));
      await user.click(screen.getByText('Continuar'));
      await waitFor(() => screen.getByPlaceholderText('CONFIRMAR BAJA'));

      // Act: escribir texto incorrecto (diferente a "CONFIRMAR BAJA")
      const input = screen.getByPlaceholderText('CONFIRMAR BAJA');
      fireEvent.change(input, { target: { value: 'texto equivocado' } });

      // Assert: boton aun deshabilitado
      // El boton de confirmacion tiene el atributo disabled — buscarlo por role
      const confirmButton = screen.getByRole('button', { name: 'Confirmar Baja por Impago' });
      expect(confirmButton).toBeDisabled();
    });

    it('deberia mostrar error cuando el texto es incorrecto y el campo no esta vacio', async () => {
      const { user } = renderPage();

      // Navegar hasta modal paso 2
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Continuar'));
      await user.click(screen.getByText('Continuar'));
      await waitFor(() => screen.getByPlaceholderText('CONFIRMAR BAJA'));

      // Act: escribir texto incorrecto
      const input = screen.getByPlaceholderText('CONFIRMAR BAJA');
      fireEvent.change(input, { target: { value: 'texto incorrecto' } });

      // Assert: mensaje de error visible
      await waitFor(() => {
        expect(screen.getByText('El texto no coincide')).toBeInTheDocument();
      });
    });
  });

  describe('error 422 en la mutacion', () => {
    it('deberia mostrar notificacion roja cuando la API devuelve 422', async () => {
      const { user } = renderPage();

      // Handler MSW que devuelve 422
      server.use(
        http.post('*/v1/members/:memberId/nonpayment-leave', () => {
          return HttpResponse.json(
            { message: 'Estado no válido para baja por impago' },
            { status: 422 },
          );
        }),
      );

      // Navegar hasta modal paso 2
      const executeButton = await screen.findByText('Ejecutar Baja por Impago');
      await user.click(executeButton);
      await waitFor(() => screen.getByText('Continuar'));
      await user.click(screen.getByText('Continuar'));
      await waitFor(() => screen.getByPlaceholderText('CONFIRMAR BAJA'));

      // Act: escribir texto correcto y confirmar
      const input = screen.getByPlaceholderText('CONFIRMAR BAJA');
      fireEvent.change(input, { target: { value: 'CONFIRMAR BAJA' } });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Confirmar Baja por Impago' }),
        ).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: 'Confirmar Baja por Impago' }));

      // Assert: notificacion de error mostrada
      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({ color: 'red' }),
        );
      });
    });
  });

  // ===== Task 4.4: Verificacion de handlers MSW =====
  // El handler POST /v1/members/:memberId/nonpayment-leave ya existe en member.handlers.ts.
  // No requiere implementacion adicional.

  // ===== Task 4.5: Verificacion de ruta =====
  // La ruta /members/:memberId/nonpayment-leave ya existe en router.tsx como lazy route.
  // No requiere implementacion adicional.
});
