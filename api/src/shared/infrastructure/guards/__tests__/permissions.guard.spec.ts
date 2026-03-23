import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../permissions.guard';

/** Helper para crear un ExecutionContext mock con permisos de usuario (tipo estricto). */
function createMockContext(userPermissions?: string[]): ExecutionContext {
  const request = {
    user: userPermissions ? { permissions: userPermissions } : undefined,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

/**
 * Helper para crear un ExecutionContext mock con permisos RAW (unknown).
 * Permite testear parsePermissions() con inputs arbitrarios:
 * string JSON, null, undefined, number, etc.
 */
function createMockContextWithRawPermissions(rawPermissions: unknown): ExecutionContext {
  const request = {
    user: { permissions: rawPermissions },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('debería permitir acceso cuando no se requieren permisos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(['anything']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería denegar acceso cuando no hay usuario', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['some:permission']);
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // --- Coincidencia exacta ---

  it('debería permitir con coincidencia exacta de permiso', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:fiscal-years:create']);
    const context = createMockContext(['membership:fiscal-years:create']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería denegar cuando no coincide ningún permiso', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:fiscal-years:create']);
    const context = createMockContext(['treasury:payments:read']);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // --- Wildcard total '*' ---

  it('debería permitir con wildcard total (*)', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:fiscal-years:create']);
    const context = createMockContext(['*']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería permitir múltiples permisos requeridos con wildcard total', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'membership:fiscal-years:create',
      'treasury:payments:read',
    ]);
    const context = createMockContext(['*']);

    expect(guard.canActivate(context)).toBe(true);
  });

  // --- Wildcard jerárquico 'namespace:*' ---

  it('debería permitir con wildcard jerárquico (membership:*)', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:fiscal-years:create']);
    const context = createMockContext(['membership:*']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería permitir permisos profundos con wildcard jerárquico', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:member-types:read']);
    const context = createMockContext(['membership:*']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debería denegar wildcard de otro namespace', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:fiscal-years:create']);
    const context = createMockContext(['treasury:*']);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debería permitir con wildcard parcial (treasury:payments:read:*)', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['treasury:payments:read:own']);
    const context = createMockContext(['treasury:payments:read:*']);

    expect(guard.canActivate(context)).toBe(true);
  });

  // --- Combinaciones ---

  it('debería evaluar TODOS los permisos requeridos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'membership:fiscal-years:create',
      'treasury:payments:read',
    ]);
    // Solo tiene membership:*, no cubre treasury
    const context = createMockContext(['membership:*']);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debería permitir con combinación de wildcards que cubren todo', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'membership:fiscal-years:create',
      'treasury:payments:read',
    ]);
    const context = createMockContext(['membership:*', 'treasury:*']);

    expect(guard.canActivate(context)).toBe(true);
  });

  // --- parsePermissions() — parsing defensivo (Bug 3 fix) ---

  describe('parsePermissions (parsing defensivo)', () => {
    it('debería aceptar array nativo de strings como permisos (caso normal)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions(['membership:read', '*']);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('debería parsear string JSON válido a array de permisos', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      // Simula doble serialización: permissions almacenado como '["*"]' en lugar de ["*"]
      const context = createMockContextWithRawPermissions('["*"]');

      expect(guard.canActivate(context)).toBe(true);
    });

    it('debería parsear string JSON con múltiples permisos', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions('["membership:read", "treasury:*"]');

      expect(guard.canActivate(context)).toBe(true);
    });

    it('debería retornar array vacío para string JSON inválido → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions('esto-no-es-json');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería retornar array vacío para null → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería retornar array vacío para undefined → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions(undefined);

      // Nota: con undefined, user.permissions es undefined →
      // el guard va por el branch !user.permissions → ForbiddenException
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería retornar array vacío para un number → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions(42);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería retornar array vacío para un objeto → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions({ not: 'an-array' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería filtrar elementos no-string de un array mixto', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      // Array con elementos no-string mezclados
      const context = createMockContextWithRawPermissions(['membership:read', 42, null, '*']);

      // Solo 'membership:read' y '*' son strings, debería permitir
      expect(guard.canActivate(context)).toBe(true);
    });

    it('debería denegar con array vacío', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      const context = createMockContextWithRawPermissions([]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería retornar array vacío para string JSON que parsea a no-array → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      // JSON válido, pero parsea a objeto, no array
      const context = createMockContextWithRawPermissions('{"not": "array"}');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debería retornar array vacío para string JSON que parsea a string → denegar', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['membership:read']);
      // JSON válido, pero parsea a string, no array
      const context = createMockContextWithRawPermissions('"solo-un-string"');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
