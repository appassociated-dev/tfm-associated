import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@/test/helpers/render';
import { useAuth } from './use-auth';

// === Tests ===

describe('useAuth', () => {
  it('deberia lanzar error cuando se usa fuera de AuthProvider', async () => {
    // Suprimir el error de consola que React lanza al fallar un hook
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Importar renderHook de RTL directamente (sin TestWrapper)
    // para que no haya AuthContext.Provider
    const rtl = await import('@testing-library/react');

    expect(() => {
      rtl.renderHook(() => useAuth());
    }).toThrow('useAuth debe usarse dentro de un AuthProvider');

    consoleSpy.mockRestore();
  });

  it('deberia retornar el contexto de auth dentro de AuthProvider', () => {
    // Arrange: render con auth por defecto (admin, autenticado)
    const { result } = renderHook(() => useAuth());

    // Assert: campos del contexto por defecto del TestWrapper
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@club.es');
    expect(result.current.tenant?.slug).toBe('club-test');
    expect(result.current.role).toBe('admin');
    expect(result.current.permissions).toEqual(['*']);
    expect(result.current.accessToken).toBe('test-access-token');
  });

  it('deberia reflejar override de auth (usuario no autenticado)', () => {
    const { result } = renderHook(() => useAuth(), {
      auth: {
        isAuthenticated: false,
        user: null,
        tenant: null,
        role: null,
        permissions: [],
        accessToken: null,
      },
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.tenant).toBeNull();
    expect(result.current.permissions).toEqual([]);
    expect(result.current.accessToken).toBeNull();
  });

  it('deberia reflejar permisos especificos (no wildcard)', () => {
    const specificPermissions = [
      'membership:members:read',
      'treasury:fee-plans:read',
      'treasury:fee-plans:create',
    ];

    const { result } = renderHook(() => useAuth(), {
      auth: { permissions: specificPermissions },
    });

    expect(result.current.permissions).toEqual(specificPermissions);
    expect(result.current.permissions).toHaveLength(3);
  });

  it('deberia exponer las funciones de accion', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.selectTenant).toBe('function');
    expect(typeof result.current.switchTenant).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});
