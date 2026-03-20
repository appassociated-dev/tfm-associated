import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { ProtectedRoute } from './protected-route';

// === Mocks ===

// Mock de react-router: Navigate y Outlet
vi.mock('react-router', () => ({
  Navigate: ({ to }: { to: string }) =>
    createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
  Outlet: () => createElement('div', { 'data-testid': 'outlet' }, 'Contenido protegido'),
}));

// Mock de useAuth
const mockUseAuth = vi.fn();
vi.mock('@/features/auth/context/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock de usePermissions
const mockUsePermissions = vi.fn();
vi.mock('@/features/auth/context/use-permissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

// === Helpers ===

/** Wrapper con MantineProvider para componentes de Mantine. */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return createElement(MantineProvider, null, children);
}

// === Tests ===

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia mostrar loader cuando isLoading es true', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });
    mockUsePermissions.mockReturnValue({
      hasAllPermissions: () => true,
    });

    render(createElement(ProtectedRoute), { wrapper: TestWrapper });

    // El Loader de Mantine tiene role="presentation" por defecto;
    // verificamos que no se redirige ni muestra contenido
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(screen.queryByText('403')).not.toBeInTheDocument();
  });

  it('deberia redirigir a /login cuando no esta autenticado', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      hasAllPermissions: () => true,
    });

    render(createElement(ProtectedRoute), { wrapper: TestWrapper });

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute('data-to')).toBe('/login');
  });

  it('deberia mostrar 403 cuando esta autenticado pero sin permisos', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      hasAllPermissions: () => false,
    });

    render(createElement(ProtectedRoute, { permissions: ['admin:manage'] }), {
      wrapper: TestWrapper,
    });

    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText('No tienes permisos para acceder a esta página.')).toBeInTheDocument();
  });

  it('deberia renderizar Outlet cuando esta autenticado con permisos correctos', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      hasAllPermissions: () => true,
    });

    render(createElement(ProtectedRoute, { permissions: ['members:read'] }), {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('deberia renderizar Outlet cuando esta autenticado sin permisos requeridos (sin prop)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      hasAllPermissions: () => true,
    });

    render(createElement(ProtectedRoute), { wrapper: TestWrapper });

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
