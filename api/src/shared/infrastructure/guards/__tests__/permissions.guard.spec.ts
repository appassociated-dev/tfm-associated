import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../permissions.guard';

/** Helper para crear un ExecutionContext mock con permisos de usuario. */
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
});
