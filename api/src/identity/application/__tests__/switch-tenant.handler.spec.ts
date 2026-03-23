import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwitchTenantHandler } from '../commands/switch-tenant.handler';
import { SwitchTenantCommand } from '../commands/switch-tenant.command';
import { TenantAccessDeniedError } from '../../domain/exceptions/tenant-access-denied.error';
import { User } from '../../domain/aggregates/user';
import { UserId } from '../../domain/value-objects/user-id';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UserStatus } from '../../domain/value-objects/user-status';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { TokenService } from '../../domain/ports/token-service.port';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const NEW_TENANT_ID = '660e8400-e29b-41d4-a716-446655440002';
const ROLE_ID = '770e8400-e29b-41d4-a716-446655440001';

function createTestUser(): User {
  return User.reconstitute({
    id: UserId.fromString(USER_ID),
    email: Email.create('user@test.com'),
    passwordHash: PasswordHash.fromHash('$argon2id$hashed'),
    name: 'Test User',
    status: UserStatus.active(),
    failedAttempts: 0,
    failedAttemptTimestamps: [],
    blockedUntil: null,
    createdAt: new Date('2025-01-01'),
    lastAccess: null,
  });
}

describe('SwitchTenantHandler', () => {
  let handler: SwitchTenantHandler;
  let userRepository: Record<string, ReturnType<typeof vi.fn>>;
  let tokenService: Record<string, ReturnType<typeof vi.fn>>;
  let refreshTokenRepository: Record<string, ReturnType<typeof vi.fn>>;
  let prismaMain: Record<string, unknown>;

  const command = new SwitchTenantCommand(USER_ID, NEW_TENANT_ID);

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    tokenService = {
      generateAccessToken: vi.fn().mockReturnValue('new-jwt-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
      hashRefreshToken: vi.fn().mockReturnValue('hashed-new-refresh'),
      verifyAccessToken: vi.fn(),
    };

    refreshTokenRepository = {
      create: vi.fn().mockResolvedValue(undefined),
      findByTokenHash: vi.fn(),
      revoke: vi.fn().mockResolvedValue(undefined),
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
    };

    prismaMain = {
      tenantMembership: {
        findFirst: vi.fn(),
      },
    };

    handler = new SwitchTenantHandler(
      userRepository as unknown as UserRepository,
      tokenService as unknown as TokenService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      prismaMain as any,
    );
  });

  it('debería cambiar de tenant exitosamente y devolver nuevos tokens', async () => {
    const user = createTestUser();
    userRepository.findById.mockResolvedValue(user);

    const membership = {
      id: 'membership-id',
      userId: USER_ID,
      tenantId: NEW_TENANT_ID,
      roleId: ROLE_ID,
      active: true,
      tenant: { id: NEW_TENANT_ID, name: 'Club Deportivo', slug: 'club-deportivo' },
      role: {
        id: ROLE_ID,
        code: 'SECRETARY',
        name: 'Secretary',
        permissions: ['read:members', 'read:events'],
      },
    };
    (prismaMain.tenantMembership as any).findFirst.mockResolvedValue(membership);

    const result = await handler.execute(command);

    // Verificar respuesta con datos del nuevo tenant
    expect(result.accessToken).toBe('new-jwt-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.expiresIn).toBe(900);
    expect(result.tenant.id).toBe(NEW_TENANT_ID);
    expect(result.tenant.name).toBe('Club Deportivo');
    expect(result.role).toBe('SECRETARY');

    // Verificar que se revocaron los tokens anteriores
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(USER_ID);

    // Verificar que se creó nuevo refresh token
    expect(refreshTokenRepository.create).toHaveBeenCalledOnce();

    // Verificar payload del access token
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: USER_ID,
      tenantId: NEW_TENANT_ID,
      email: 'user@test.com',
      name: 'Test User',
      rol: 'SECRETARY',
      permissions: ['read:members', 'read:events'],
    });
  });

  it('debería lanzar TenantAccessDeniedError si el usuario no tiene membresía en el tenant', async () => {
    const user = createTestUser();
    userRepository.findById.mockResolvedValue(user);
    (prismaMain.tenantMembership as any).findFirst.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(TenantAccessDeniedError);

    // No se deberían generar tokens
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it('debería lanzar TenantAccessDeniedError si el usuario no existe', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(TenantAccessDeniedError);
  });
});
