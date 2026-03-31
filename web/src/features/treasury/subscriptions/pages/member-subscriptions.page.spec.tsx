import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import {
  buildSubscription,
  buildMemberSubscriptionsResponse,
  resetSubscriptionCounters,
} from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';

import { MemberSubscriptionsPage } from './member-subscriptions.page';

// === Mocks ===

// Mock de modales para evitar dependencias profundas
vi.mock('../components/change-plan-modal', () => ({
  ChangePlanModal: () => null,
}));
vi.mock('../components/update-discount-modal', () => ({
  UpdateDiscountModal: () => null,
}));
vi.mock('../components/exemption-modal', () => ({
  ExemptionModal: () => null,
}));
vi.mock('../components/subscription-selector', () => ({
  SubscriptionSelector: () => <div data-testid="subscription-selector">Selector Mock</div>,
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// === Tests ===

describe('MemberSubscriptionsPage', () => {
  beforeEach(() => {
    resetSubscriptionCounters();
  });

  // --- Carga y esqueleto ---

  describe('estado de carga', () => {
    it('deberia mostrar skeletons mientras los datos estan cargando', () => {
      // Arrange: handler que nunca resuelve
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return new Promise(() => {});
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert: no se muestra contenido real
      expect(screen.queryByText('Suscripción Activa')).not.toBeInTheDocument();
      expect(screen.queryByText('Sin suscripción activa')).not.toBeInTheDocument();
    });
  });

  // --- Suscripcion activa ---

  describe('suscripcion activa', () => {
    it('deberia mostrar la tarjeta de suscripcion activa cuando hay datos', async () => {
      // Arrange
      const activeSubscription = buildSubscription({
        feePlanName: 'Cuota Anual',
        feePlanCode: 'CUOTA-ANUAL',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Suscripción Activa')).toBeInTheDocument();
      });
      expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      expect(screen.getByText('CUOTA-ANUAL')).toBeInTheDocument();
    });

    it('deberia mostrar suscripcion activa con triangulacion (plan distinto)', async () => {
      // Arrange
      const activeSubscription = buildSubscription({
        feePlanName: 'Cuota Trimestral',
        feePlanCode: 'CUOTA-TRIM',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota Trimestral')).toBeInTheDocument();
      });
      expect(screen.getByText('CUOTA-TRIM')).toBeInTheDocument();
      // feePlanType badge eliminado: campo no presente en SubscriptionResponseDto (REQ-ZOD-001)
    });

    it('deberia mostrar el codigo del plan para plan ONE_TIME', async () => {
      // Arrange
      const activeSubscription = buildSubscription({
        feePlanName: 'Inscripcion',
        feePlanCode: 'INSCRIP',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Inscripcion')).toBeInTheDocument();
      });
      expect(screen.getByText('INSCRIP')).toBeInTheDocument();
      // feePlanType badge eliminado: campo no presente en SubscriptionResponseDto (REQ-ZOD-001)
    });
  });

  // --- Sin suscripcion activa ---

  describe('sin suscripcion activa', () => {
    it('deberia mostrar mensaje "Sin suscripción activa" cuando no hay suscripcion activa', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: null,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sin suscripción activa')).toBeInTheDocument();
      });
    });

    it('deberia mostrar boton "Crear Suscripción" cuando no hay activa y tiene permiso', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: null,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
        auth: { permissions: ['treasury:subscriptions:create'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Crear Suscripción')).toBeInTheDocument();
      });
    });

    it('deberia NO mostrar boton "Crear Suscripción" sin permiso', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: null,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
        auth: { permissions: [] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sin suscripción activa')).toBeInTheDocument();
      });
      expect(screen.queryByText('Crear Suscripción')).not.toBeInTheDocument();
    });
  });

  // --- Permisos de accion ---

  describe('permisos de accion', () => {
    it('deberia ocultar botones de accion sin permiso de actualizacion', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription(),
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
        auth: { permissions: ['treasury:subscriptions:create'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Suscripción Activa')).toBeInTheDocument();
      });
      expect(screen.queryByText('Cambiar Plan')).not.toBeInTheDocument();
      expect(screen.queryByText('Modificar Descuento')).not.toBeInTheDocument();
      expect(screen.queryByText('Exención Temporal')).not.toBeInTheDocument();
    });

    it('deberia mostrar botones de accion con permiso de actualizacion', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription(),
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
        auth: { permissions: ['treasury:subscriptions:update'] },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cambiar Plan')).toBeInTheDocument();
      });
      expect(screen.getByText('Modificar Descuento')).toBeInTheDocument();
      expect(screen.getByText('Exención Temporal')).toBeInTheDocument();
    });
  });

  // --- Interacciones de botones ---

  describe('interacciones', () => {
    it('deberia abrir modal de creacion al hacer click en "Crear Suscripción"', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: null,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      const { user } = render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
        auth: { permissions: ['treasury:subscriptions:create'] },
      });

      await waitFor(() => {
        expect(screen.getByText('Crear Suscripción')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Crear Suscripción'));

      // Assert: el selector mockeado aparece dentro del modal
      await waitFor(() => {
        expect(screen.getByTestId('subscription-selector')).toBeInTheDocument();
      });
    });

    it('deberia mostrar el motivo de descuento personal cuando existe', async () => {
      // Arrange
      const activeSubscription = buildSubscription({
        personalDiscount: 0.15,
        personalDiscountReason: 'Familiar del presidente',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Familiar del presidente/)).toBeInTheDocument();
      });
    });
  });

  // --- Historico ---

  describe('historico de suscripciones', () => {
    it('deberia mostrar el historico de suscripciones como timeline', async () => {
      // Arrange
      const closedSub = buildSubscription({
        feePlanName: 'Plan Anterior',
        leaveDate: '2025-12-31T23:59:59.000Z',
        cancelReason: 'PLAN_CHANGE',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription(),
        history: [closedSub],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Histórico de Suscripciones')).toBeInTheDocument();
      });
      expect(screen.getByText('Plan Anterior')).toBeInTheDocument();
      expect(screen.getByText('Cambio de plan')).toBeInTheDocument();
    });

    it('deberia mostrar motivo "Baja de socio" con triangulacion (MEMBER_LEAVE)', async () => {
      // Arrange
      const closedSub = buildSubscription({
        feePlanName: 'Cuota Mensual',
        leaveDate: '2025-06-15T10:00:00.000Z',
        cancelReason: 'MEMBER_LEAVE',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: null,
        history: [closedSub],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota Mensual')).toBeInTheDocument();
      });
      expect(screen.getByText('Baja de socio')).toBeInTheDocument();
    });

    it('deberia no mostrar seccion de historico cuando no hay suscripciones cerradas', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: null,
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sin suscripción activa')).toBeInTheDocument();
      });
      expect(screen.queryByText('Histórico de Suscripciones')).not.toBeInTheDocument();
    });

    it('deberia expandir detalle al hacer click en un elemento del timeline', async () => {
      // Arrange
      const closedSub = buildSubscription({
        feePlanName: 'Plan Antiguo',
        leaveDate: '2025-10-01T00:00:00.000Z',
        cancelReason: 'EXEMPTION',
      });
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription(),
        history: [closedSub],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      const { user } = render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      await waitFor(() => {
        expect(screen.getByText('Plan Antiguo')).toBeInTheDocument();
      });
      // Click en la fila del timeline para expandir
      await user.click(screen.getByText('Plan Antiguo'));

      // Assert: desglose expandido muestra el importe efectivo del DTO
      // chargesGenerated eliminado: campo no presente en SubscriptionResponseDto (REQ-ZOD-001)
      await waitFor(() => {
        expect(screen.getByText('Exención')).toBeInTheDocument();
      });
    });
  });

  // --- Cabecera ---

  describe('cabecera', () => {
    it('deberia mostrar el titulo de suscripciones en la cabecera', async () => {
      // memberName eliminado del DTO (REQ-ZOD-002) — la cabecera ya no muestra el nombre del socio
      // La pagina muestra el titulo de la seccion como identificador
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription(),
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert — el titulo principal siempre esta presente (aparece en breadcrumb y titulo)
      await waitFor(() => {
        const elements = screen.getAllByText('Suscripciones');
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('deberia renderizar breadcrumbs con la jerarquia correcta', async () => {
      // Arrange
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription(),
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Tesoreria')).toBeInTheDocument();
      });
      expect(screen.getByText('Cuentas de Socio')).toBeInTheDocument();
    });
  });

  // --- Estado de error ---

  describe('estado de error', () => {
    it('deberia mostrar alerta de error cuando la consulta falla', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json({ message: 'Error' }, { status: 500 });
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error al cargar suscripciones')).toBeInTheDocument();
      });
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('deberia reintentar la carga al hacer click en "Reintentar"', async () => {
      // Arrange
      let callCount = 0;
      const data = buildMemberSubscriptionsResponse({
        memberId: VALID_UUID,
        activeSubscription: buildSubscription({ feePlanName: 'Cuota Anual' }),
        history: [],
      });
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Error' }, { status: 500 });
          }
          return HttpResponse.json(apiResponse(data));
        }),
      );

      // Act
      const { user } = render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Reintentar'));

      // Assert: ahora se muestran los datos correctos
      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });
    });

    it('deberia mostrar alerta de error con 404 (triangulacion)', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        }),
      );

      // Act
      render(<MemberSubscriptionsPage />, {
        route: '/members/:memberId/subscriptions',
        path: `/members/${VALID_UUID}/subscriptions`,
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error al cargar suscripciones')).toBeInTheDocument();
      });
    });
  });
});
