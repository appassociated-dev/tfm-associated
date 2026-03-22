import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { LeaveActions } from './leave-actions';

// === Mocks ===

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// === Constantes ===

const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440000';

// === Helpers ===

function renderActions(memberId = MEMBER_ID, authOverrides?: { permissions: string[] }) {
  return render(<LeaveActions memberId={memberId} />, {
    auth: authOverrides,
  });
}

/** Configura MSW para devolver transiciones disponibles. */
function setupTransitions(
  currentStatus: string,
  transitions: Array<{ status: string; description: string }> = [],
) {
  server.use(
    http.get('*/v1/members/:memberId/available-transitions', () =>
      HttpResponse.json(
        apiResponse({
          memberId: MEMBER_ID,
          currentStatus,
          availableTransitions: transitions,
        }),
      ),
    ),
  );
}

// === Tests ===

describe('LeaveActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('boton de baja voluntaria', () => {
    it('deberia mostrar boton cuando la transicion esta disponible y tiene permiso', async () => {
      setupTransitions('ACTIVE', [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }]);

      renderActions(MEMBER_ID, {
        permissions: ['membership:members:deactivate'],
      });

      await waitFor(() => {
        expect(screen.getByText('Procesar Baja Voluntaria')).toBeInTheDocument();
      });
    });

    it('deberia navegar a la pagina de baja al hacer click', async () => {
      setupTransitions('ACTIVE', [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }]);

      const { user } = renderActions(MEMBER_ID, {
        permissions: ['membership:members:deactivate'],
      });

      await waitFor(() => {
        expect(screen.getByText('Procesar Baja Voluntaria')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByText('Procesar Baja Voluntaria'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/members/${MEMBER_ID}/leave`);
    });

    it('deberia ocultar boton sin permiso membership:members:deactivate', async () => {
      setupTransitions('ACTIVE', [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }]);

      renderActions(MEMBER_ID, {
        permissions: ['membership:members:read'], // sin deactivate
      });

      // Esperar a que cargue (el componente pide transiciones)
      await waitFor(() => {
        expect(screen.queryByText('Procesar Baja Voluntaria')).not.toBeInTheDocument();
      });
    });
  });

  describe('boton de rehabilitacion', () => {
    it('deberia mostrar boton para estado VOLUNTARY_LEAVE con permiso', async () => {
      setupTransitions('VOLUNTARY_LEAVE', []);

      renderActions(MEMBER_ID, {
        permissions: ['membership:members:reinstate'],
      });

      await waitFor(() => {
        expect(screen.getByText('Rehabilitar Socio')).toBeInTheDocument();
      });
    });

    it('deberia mostrar boton para estado NONPAYMENT_LEAVE (triangulacion)', async () => {
      setupTransitions('NONPAYMENT_LEAVE', []);

      renderActions(MEMBER_ID, {
        permissions: ['membership:members:reinstate'],
      });

      await waitFor(() => {
        expect(screen.getByText('Rehabilitar Socio')).toBeInTheDocument();
      });
    });

    it('deberia navegar a la pagina de rehabilitacion al hacer click', async () => {
      setupTransitions('VOLUNTARY_LEAVE', []);

      const { user } = renderActions(MEMBER_ID, {
        permissions: ['membership:members:reinstate'],
      });

      await waitFor(() => {
        expect(screen.getByText('Rehabilitar Socio')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Rehabilitar Socio'));

      expect(mockNavigate).toHaveBeenCalledWith(`/members/${MEMBER_ID}/reinstate`);
    });

    it('deberia ocultar boton sin permiso membership:members:reinstate', async () => {
      setupTransitions('VOLUNTARY_LEAVE', []);

      renderActions(MEMBER_ID, {
        permissions: ['membership:members:read'], // sin reinstate
      });

      await waitFor(() => {
        expect(screen.queryByText('Rehabilitar Socio')).not.toBeInTheDocument();
      });
    });
  });

  describe('estados terminales permanentes', () => {
    it('deberia mostrar texto permanente para estado DISCIPLINARY_LEAVE', async () => {
      setupTransitions('DISCIPLINARY_LEAVE', []);

      renderActions();

      await waitFor(() => {
        expect(
          screen.getByText('Este socio está dado de baja de forma permanente'),
        ).toBeInTheDocument();
      });
    });

    it('deberia mostrar texto permanente para estado DECEASED', async () => {
      setupTransitions('DECEASED', []);

      renderActions();

      await waitFor(() => {
        expect(
          screen.getByText('Este socio está dado de baja de forma permanente'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('estado de carga', () => {
    it('deberia mostrar loader durante estado de carga', () => {
      // MSW que nunca responde
      server.use(
        http.get('*/v1/members/:memberId/available-transitions', () => new Promise(() => {})),
      );

      const { container } = renderActions();

      const loader = container.querySelector('.mantine-Loader-root');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('estado ACTIVE sin transiciones disponibles', () => {
    it('no deberia mostrar botones cuando no hay transiciones y el estado no es terminal', async () => {
      setupTransitions('ACTIVE', []);

      renderActions(MEMBER_ID, {
        permissions: ['membership:members:deactivate', 'membership:members:reinstate'],
      });

      // Esperar a que cargue
      await waitFor(() => {
        // No hay transiciones disponibles, no deberia haber boton de baja
        expect(screen.queryByText('Procesar Baja Voluntaria')).not.toBeInTheDocument();
        // ACTIVE no es rehabilitable tampoco
        expect(screen.queryByText('Rehabilitar Socio')).not.toBeInTheDocument();
      });
    });
  });
});
