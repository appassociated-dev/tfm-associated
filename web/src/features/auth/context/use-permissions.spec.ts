import { describe, it, expect } from 'vitest';

import { renderHook } from '@/test/helpers/render';
import { usePermissions, matchPermission } from './use-permissions';

// === Tests de matchPermission (funcion pura) ===

describe('matchPermission', () => {
  describe('coincidencia exacta', () => {
    it('deberia retornar true para permiso exacto', () => {
      expect(matchPermission(['membership:members:read'], 'membership:members:read')).toBe(true);
    });

    it('deberia retornar false si no coincide exactamente', () => {
      expect(matchPermission(['membership:members:read'], 'membership:members:create')).toBe(false);
    });
  });

  describe('wildcard total (*)', () => {
    it('deberia conceder cualquier permiso con wildcard total', () => {
      expect(matchPermission(['*'], 'membership:members:read')).toBe(true);
    });

    it('deberia conceder permisos arbitrarios con wildcard total', () => {
      expect(matchPermission(['*'], 'anything')).toBe(true);
    });

    it('deberia conceder permisos profundos con wildcard total', () => {
      expect(matchPermission(['*'], 'a:b:c:d:e')).toBe(true);
    });
  });

  describe('wildcard jerarquico (bc:*)', () => {
    it('deberia conceder permisos bajo el prefijo treasury:*', () => {
      expect(matchPermission(['treasury:*'], 'treasury:fee-plans:read')).toBe(true);
    });

    it('deberia conceder acciones diferentes bajo el mismo prefijo', () => {
      expect(matchPermission(['treasury:*'], 'treasury:payments:create')).toBe(true);
    });

    it('deberia NO conceder permisos de otro BC', () => {
      expect(matchPermission(['treasury:*'], 'membership:members:read')).toBe(false);
    });

    it('deberia conceder con membership:*', () => {
      expect(matchPermission(['membership:*'], 'membership:members:read')).toBe(true);
    });

    it('deberia conceder con documents:*', () => {
      expect(matchPermission(['documents:*'], 'documents:categories:create')).toBe(true);
    });

    it('deberia conceder con communication:*', () => {
      expect(matchPermission(['communication:*'], 'communication:templates:read')).toBe(true);
    });
  });

  describe('multiples permisos otorgados', () => {
    it('deberia conceder si alguno de los permisos cubre el requerido', () => {
      expect(
        matchPermission(['membership:members:read', 'treasury:*'], 'treasury:fee-plans:read'),
      ).toBe(true);
    });

    it('deberia conceder con mezcla de exacto y wildcard', () => {
      expect(
        matchPermission(['membership:members:read', 'treasury:*'], 'membership:members:read'),
      ).toBe(true);
    });

    it('deberia NO conceder si ninguno cubre el requerido', () => {
      expect(
        matchPermission(['membership:members:read', 'treasury:*'], 'documents:categories:read'),
      ).toBe(false);
    });
  });

  describe('array vacio de permisos otorgados', () => {
    it('deberia retornar false para cualquier permiso requerido', () => {
      expect(matchPermission([], 'membership:members:read')).toBe(false);
    });
  });

  describe('roles del sistema (SYSTEM_ROLES canonicos)', () => {
    it('PRESIDENT (*) deberia tener acceso a todo', () => {
      expect(matchPermission(['*'], 'membership:members:read')).toBe(true);
      expect(matchPermission(['*'], 'treasury:fee-plans:read')).toBe(true);
      expect(matchPermission(['*'], 'documents:categories:create')).toBe(true);
    });

    it('SECRETARY deberia tener acceso a membership, documents, communication', () => {
      const secretaryPerms = ['membership:*', 'documents:*', 'communication:*'];
      expect(matchPermission(secretaryPerms, 'membership:members:read')).toBe(true);
      expect(matchPermission(secretaryPerms, 'membership:members:create')).toBe(true);
      expect(matchPermission(secretaryPerms, 'documents:categories:read')).toBe(true);
      expect(matchPermission(secretaryPerms, 'treasury:fee-plans:read')).toBe(false);
    });

    it('TREASURER deberia tener acceso a treasury y lectura de miembros', () => {
      const treasurerPerms = ['treasury:*', 'membership:members:read'];
      expect(matchPermission(treasurerPerms, 'treasury:fee-plans:read')).toBe(true);
      expect(matchPermission(treasurerPerms, 'treasury:payments:create')).toBe(true);
      expect(matchPermission(treasurerPerms, 'membership:members:read')).toBe(true);
      expect(matchPermission(treasurerPerms, 'membership:members:create')).toBe(false);
    });

    it('MEMBER deberia tener acceso solo a lectura propia', () => {
      const memberPerms = ['membership:members:read:own', 'treasury:payments:read:own'];
      expect(matchPermission(memberPerms, 'membership:members:read:own')).toBe(true);
      expect(matchPermission(memberPerms, 'treasury:payments:read:own')).toBe(true);
      expect(matchPermission(memberPerms, 'membership:members:read')).toBe(false);
      expect(matchPermission(memberPerms, 'treasury:fee-plans:read')).toBe(false);
    });
  });
});

// === Tests del hook usePermissions ===

describe('usePermissions', () => {
  describe('hasPermission (con wildcards)', () => {
    it('deberia retornar true para un permiso exacto', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['members:read', 'members:write'] },
      });

      expect(result.current.hasPermission('members:read')).toBe(true);
    });

    it('deberia retornar false para un permiso inexistente', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['members:read'] },
      });

      expect(result.current.hasPermission('treasury:write')).toBe(false);
    });

    it('deberia retornar false cuando no hay permisos', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: [] },
      });

      expect(result.current.hasPermission('members:read')).toBe(false);
    });

    it('deberia soportar wildcard total (*)', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['*'] },
      });

      expect(result.current.hasPermission('treasury:fee-plans:read')).toBe(true);
      expect(result.current.hasPermission('membership:members:create')).toBe(true);
    });

    it('deberia soportar wildcard jerarquico (treasury:*)', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['treasury:*'] },
      });

      expect(result.current.hasPermission('treasury:fee-plans:read')).toBe(true);
      expect(result.current.hasPermission('membership:members:read')).toBe(false);
    });
  });

  describe('hasAnyPermission (con wildcards)', () => {
    it('deberia retornar true si al menos un permiso coincide via wildcard', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['treasury:*'] },
      });

      expect(
        result.current.hasAnyPermission(['membership:members:read', 'treasury:fee-plans:read']),
      ).toBe(true);
    });

    it('deberia retornar false si ningun permiso coincide', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['membership:members:read'] },
      });

      expect(result.current.hasAnyPermission(['treasury:read', 'treasury:write'])).toBe(false);
    });

    it('deberia retornar false con lista vacia de permisos requeridos', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['members:read'] },
      });

      // Array.some sobre [] retorna false
      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions (con wildcards)', () => {
    it('deberia retornar true si wildcard cubre todos los permisos requeridos', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['*'] },
      });

      expect(
        result.current.hasAllPermissions(['membership:members:read', 'treasury:fee-plans:read']),
      ).toBe(true);
    });

    it('deberia retornar false si no todos los permisos estan cubiertos', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['treasury:*'] },
      });

      expect(
        result.current.hasAllPermissions(['treasury:fee-plans:read', 'membership:members:read']),
      ).toBe(false);
    });

    it('deberia retornar true con lista vacia de permisos requeridos', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: ['members:read'] },
      });

      // Array.every sobre [] retorna true
      expect(result.current.hasAllPermissions([])).toBe(true);
    });

    it('deberia verificar permisos realistas de SECRETARY (triangulacion)', () => {
      const secretaryPerms = ['membership:*', 'documents:*', 'communication:*'];
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: secretaryPerms },
      });

      // SECRETARY puede todo en membership + documents + communication
      expect(
        result.current.hasAllPermissions([
          'membership:members:read',
          'documents:categories:read',
          'communication:templates:read',
        ]),
      ).toBe(true);

      // Pero NO puede treasury
      expect(
        result.current.hasAllPermissions(['membership:members:read', 'treasury:fee-plans:read']),
      ).toBe(false);
    });
  });

  describe('permissions', () => {
    it('deberia exponer el array de permisos del contexto', () => {
      const perms = ['members:read', 'treasury:write'];
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: perms },
      });

      expect(result.current.permissions).toEqual(perms);
    });

    it('deberia exponer array vacio cuando no hay permisos', () => {
      const { result } = renderHook(() => usePermissions(), {
        auth: { permissions: [] },
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.permissions).toHaveLength(0);
    });
  });
});
