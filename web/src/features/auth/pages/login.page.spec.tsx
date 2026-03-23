import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '@/test/helpers/render';
import { ApiError } from '@/shared/api/api-error';
import { LoginPage } from './login.page';

// === Mocks ===

// Mock de @mantine/notifications — portal no disponible en jsdom
const mockNotificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// Mock del logo SVG
vi.mock('@/shared/assets/logo-stacked.svg', () => ({ default: 'logo-stacked.svg' }));
vi.mock('@/shared/assets/logo-stacked-white.svg', () => ({ default: 'logo-stacked-white.svg' }));

// Mock de useNavigate para verificar navegacion
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// === Helpers ===

/** Rellena el formulario de login usando userEvent (compatible con RHF). */
async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) {
  await user.type(screen.getByPlaceholderText('tu@email.com'), email);
  await user.type(screen.getByPlaceholderText('Tu contraseña'), password);
  await user.click(screen.getByRole('button', { name: /acceder/i }));
}

// === Tests ===

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderizado inicial', () => {
    it('deberia mostrar el formulario con campos de email, contrasena y boton', () => {
      render(<LoginPage />, { auth: { isAuthenticated: false } });

      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tu contraseña')).toBeInTheDocument();
      expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
      expect(screen.getByText('Acceder')).toBeInTheDocument();
    });
  });

  describe('validacion del formulario', () => {
    it('deberia mostrar error de validacion para email invalido al enviar', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { auth: { isAuthenticated: false } });

      await fillAndSubmit(user, 'no-es-email', 'password123');

      await waitFor(() => {
        expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
      });
    });

    it('deberia mostrar error de validacion para contrasena vacia al enviar', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { auth: { isAuthenticated: false } });

      await user.type(screen.getByPlaceholderText('tu@email.com'), 'test@club.es');
      await user.click(screen.getByRole('button', { name: /acceder/i }));

      await waitFor(() => {
        expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
      });
    });

    it('deberia mostrar error para segundo email invalido diferente (triangulacion)', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { auth: { isAuthenticated: false } });

      await fillAndSubmit(user, '@sinusuario.com', 'algo123');

      await waitFor(() => {
        expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
      });
    });
  });

  describe('login directo (un solo tenant)', () => {
    it('deberia navegar a /dashboard tras login exitoso', async () => {
      const user = userEvent.setup();
      // Arrange: login mock devuelve respuesta de un solo tenant
      const mockLogin = vi.fn().mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: 3600,
        user: { id: 'user-1', email: 'test@club.es', name: 'Test' },
        tenant: { id: 'tenant-1', name: 'Club', slug: 'club' },
        role: 'admin',
      });

      render(<LoginPage />, {
        auth: { isAuthenticated: false, login: mockLogin },
      });

      await fillAndSubmit(user, 'test@club.es', 'password123');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@club.es',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('login multi-tenant (selector de colectividad)', () => {
    it('deberia mostrar TenantSelector cuando la respuesta requiere seleccion', async () => {
      const user = userEvent.setup();
      // Arrange: login mock devuelve respuesta multi-tenant
      const mockLogin = vi.fn().mockResolvedValue({
        requiresTenantSelection: true,
        tenants: [
          { id: 'tenant-a', name: 'Club A', slug: 'club-a', role: 'admin' },
          { id: 'tenant-b', name: 'Club B', slug: 'club-b', role: 'member' },
        ],
      });

      render(<LoginPage />, {
        auth: { isAuthenticated: false, login: mockLogin },
      });

      await fillAndSubmit(user, 'multi@club.es', 'password123');

      await waitFor(() => {
        expect(screen.getByText('Selecciona una colectividad')).toBeInTheDocument();
        expect(screen.getByText('Club A')).toBeInTheDocument();
        expect(screen.getByText('Club B')).toBeInTheDocument();
      });
    });
  });

  describe('errores de login', () => {
    it('deberia mostrar notificacion de credenciales incorrectas cuando API devuelve 401', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(
        new ApiError(401, {
          message: 'Invalid credentials',
          code: 'UNAUTHORIZED',
          details: null,
        }),
      );

      render(<LoginPage />, {
        auth: { isAuthenticated: false, login: mockLogin },
      });

      await fillAndSubmit(user, 'wrong@club.es', 'wrongpassword');

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            color: 'red',
            message: 'Credenciales incorrectas',
          }),
        );
      });
    });

    it('deberia mostrar notificacion de cuenta bloqueada cuando API devuelve 423', async () => {
      const user = userEvent.setup();
      const mockLogin = vi
        .fn()
        .mockRejectedValue(
          new ApiError(423, { message: 'Account locked', code: 'LOCKED', details: null }),
        );

      render(<LoginPage />, {
        auth: { isAuthenticated: false, login: mockLogin },
      });

      await fillAndSubmit(user, 'locked@club.es', 'password123');

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            color: 'yellow',
            title: 'Cuenta bloqueada',
          }),
        );
      });
    });

    it('deberia mostrar notificacion de error de conexion para errores genericos', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Network Error'));

      render(<LoginPage />, {
        auth: { isAuthenticated: false, login: mockLogin },
      });

      await fillAndSubmit(user, 'test@club.es', 'password123');

      await waitFor(() => {
        expect(mockNotificationsShow).toHaveBeenCalledWith(
          expect.objectContaining({
            color: 'red',
            title: 'Error de conexión',
          }),
        );
      });
    });
  });

  describe('estado de carga', () => {
    it('deberia mostrar loading en el boton mientras se procesa el login', async () => {
      const user = userEvent.setup();
      // Arrange: login que tarda en resolver (controlado para cleanup)
      let resolveLogin: ((value: unknown) => void) | undefined;
      const mockLogin = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          }),
      );

      render(<LoginPage />, {
        auth: { isAuthenticated: false, login: mockLogin },
      });

      await fillAndSubmit(user, 'test@club.es', 'password123');

      await waitFor(() => {
        const button = screen.getByText('Acceder').closest('button');
        expect(button).toHaveAttribute('data-loading');
      });

      // Cleanup: resolver la promesa para evitar timers pendientes tras cleanup
      resolveLogin?.({
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: 3600,
        user: { id: 'u-1', email: 'test@club.es', name: 'Test' },
        tenant: { id: 't-1', name: 'Club', slug: 'club' },
        role: 'admin',
      });
    });
  });
});
