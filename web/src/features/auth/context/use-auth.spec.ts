import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthContext, type AuthContextValue } from './auth.provider';
import { useAuth } from './use-auth';

// === Helpers ===

const mockAuthValue: AuthContextValue = {
  user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@club.es', name: 'Test' },
  tenant: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Club', slug: 'club' },
  role: 'admin',
  permissions: ['members:read'],
  accessToken: 'fake-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  selectTenant: vi.fn(),
  switchTenant: vi.fn(),
  logout: vi.fn(),
};

function createWrapper(value: AuthContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthContext.Provider, { value }, children);
  };
}

// === Tests ===

describe('useAuth', () => {
  it('deberia lanzar error cuando se usa fuera de AuthProvider', () => {
    // Suprimir el error de consola que React lanza al fallar un hook
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth debe usarse dentro de un AuthProvider');

    consoleSpy.mockRestore();
  });

  it('deberia retornar el contexto de auth dentro de AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuthValue),
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@club.es');
    expect(result.current.tenant?.slug).toBe('club');
    expect(result.current.role).toBe('admin');
    expect(result.current.permissions).toEqual(['members:read']);
    expect(result.current.accessToken).toBe('fake-token');
  });

  it('deberia exponer las funciones de accion', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuthValue),
    });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.selectTenant).toBe('function');
    expect(typeof result.current.switchTenant).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});
