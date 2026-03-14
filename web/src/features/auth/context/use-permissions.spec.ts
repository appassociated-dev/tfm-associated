import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthContext, type AuthContextValue } from './auth.provider';
import { usePermissions } from './use-permissions';

// === Helpers ===

/** Valor base del contexto de auth para tests. */
const baseAuthValue: AuthContextValue = {
  user: null,
  tenant: null,
  role: null,
  permissions: [],
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  selectTenant: vi.fn(),
  switchTenant: vi.fn(),
  logout: vi.fn(),
};

/** Crea un wrapper con AuthProvider mockeado y permisos personalizados. */
function createWrapper(permissions: string[]) {
  const value: AuthContextValue = { ...baseAuthValue, permissions };

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthContext.Provider, { value }, children);
  };
}

// === Tests ===

describe('usePermissions', () => {
  describe('hasPermission', () => {
    it('deberia retornar true para un permiso existente', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read', 'members:write']),
      });

      expect(result.current.hasPermission('members:read')).toBe(true);
    });

    it('deberia retornar false para un permiso inexistente', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read']),
      });

      expect(result.current.hasPermission('treasury:write')).toBe(false);
    });

    it('deberia retornar false cuando no hay permisos', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper([]),
      });

      expect(result.current.hasPermission('members:read')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('deberia retornar true si al menos un permiso coincide', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read', 'members:write']),
      });

      expect(result.current.hasAnyPermission(['treasury:read', 'members:write'])).toBe(true);
    });

    it('deberia retornar false si ningun permiso coincide', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read']),
      });

      expect(result.current.hasAnyPermission(['treasury:read', 'treasury:write'])).toBe(false);
    });

    it('deberia retornar false con lista vacia de permisos requeridos', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read']),
      });

      // Array.some sobre [] retorna false
      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('deberia retornar true si todos los permisos coinciden', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read', 'members:write', 'treasury:read']),
      });

      expect(result.current.hasAllPermissions(['members:read', 'members:write'])).toBe(true);
    });

    it('deberia retornar false si no todos los permisos coinciden', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read']),
      });

      expect(result.current.hasAllPermissions(['members:read', 'members:write'])).toBe(false);
    });

    it('deberia retornar true con lista vacia de permisos requeridos', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(['members:read']),
      });

      // Array.every sobre [] retorna true
      expect(result.current.hasAllPermissions([])).toBe(true);
    });
  });

  describe('permissions', () => {
    it('deberia exponer el array de permisos del contexto', () => {
      const perms = ['members:read', 'treasury:write'];
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(perms),
      });

      expect(result.current.permissions).toEqual(perms);
    });
  });
});
