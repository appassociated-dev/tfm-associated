import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginHandler } from '../commands/login.handler';
import { LoginCommand } from '../commands/login.command';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { TenantSelectorDto } from '../dtos/tenant-selector.dto';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';
import { AccountBlockedError } from '../../domain/exceptions/account-blocked.error';
import { User } from '../../domain/aggregates/user';
import { UserId } from '../../domain/value-objects/user-id';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UserStatus } from '../../domain/value-objects/user-status';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { TokenService } from '../../domain/ports/token-service.port';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

// --- Helpers para crear usuarios de prueba ---

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TENANT_ID = '660e8400-e29b-41d4-a716-446655440001';
const TENANT_ID_2 = '660e8400-e29b-41d4-a716-446655440002';
const ROLE_ID = '770e8400-e29b-41d4-a716-446655440001';
const ROLE_ID_2 = '770e8400-e29b-41d4-a716-446655440002';

function createTestUser(
  overrides: Partial<{
    blocked: boolean;
    blockedUntil: Date | null;
  }> = {},
): User {
  return User.reconstitute({
    id: UserId.fromString(USER_ID),
    email: Email.create('user@test.com'),
    passwordHash: PasswordHash.fromHash('$argon2id$hashed'),
    name: 'Test User',
    status: overrides.blocked ? UserStatus.blocked() : UserStatus.active(),
    failedAttempts: 0,
    failedAttemptTimestamps: [],
    blockedUntil: overrides.blockedUntil ?? null,
    createdAt: new Date('2025-01-01'),
    lastAccess: null,
  });
}

function createMembership(
  tenantId: string,
  roleId: string,
  roleCode: string,
  tenantName: string,
  tenantSlug: string,
) {
  return {
    id: 'membership-id',
    userId: USER_ID,
    tenantId,
    roleId,
    memberId: null,
    assignedAt: new Date(),
    assignedBy: null,
    active: true,
    tenant: {
      id: tenantId,
      name: tenantName,
      slug: tenantSlug,
      cif: 'A12345678',
      type: 'PENA',
      status: 'active',
      databaseName: 'db',
      contactEmail: 'c@t.com',
      createdAt: new Date(),
    },
    role: {
      id: roleId,
      code: roleCode,
      name: roleCode,
      description: null,
      permissions: ['read:members', 'write:members'],
      isSystem: false,
      tenantId: null,
    },
  };
}

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userRepository: Record<string, ReturnType<typeof vi.fn>>;
  let passwordHasher: Record<string, ReturnType<typeof vi.fn>>;
  let tokenService: Record<string, ReturnType<typeof vi.fn>>;
  let refreshTokenRepository: Record<string, ReturnType<typeof vi.fn>>;
  let prismaMain: Record<string, unknown>;

  const validCommand = new LoginCommand('user@test.com', 'password123', '127.0.0.1', 'TestAgent');

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    };

    tokenService = {
      generateAccessToken: vi.fn().mockReturnValue('jwt-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('opaque-refresh-token'),
      hashRefreshToken: vi.fn().mockReturnValue('hashed-refresh-token'),
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
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    handler = new LoginHandler(
      userRepository as unknown as UserRepository,
      passwordHasher as unknown as PasswordHasher,
      tokenService as unknown as TokenService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      prismaMain as any,
    );
  });

  it('debería autenticar exitosamente con un solo tenant y devolver LoginResponseDto', async () => {
    const user = createTestUser();
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);

    const membership = createMembership(TENANT_ID, ROLE_ID, 'PRESIDENT', 'Peña Test', 'pena-test');
    (prismaMain.tenantMembership as any).findMany.mockResolvedValue([membership]);

    const result = await handler.execute(validCommand);

    // Debe devolver LoginResponseDto
    expect(result).toBeInstanceOf(LoginResponseDto);
    const loginResult = result as LoginResponseDto;
    expect(loginResult.accessToken).toBe('jwt-access-token');
    expect(loginResult.refreshToken).toBe('opaque-refresh-token');
    expect(loginResult.expiresIn).toBe(900);
    expect(loginResult.user.id).toBe(USER_ID);
    expect(loginResult.user.email).toBe('user@test.com');
    expect(loginResult.tenant.id).toBe(TENANT_ID);
    expect(loginResult.role).toBe('PRESIDENT');

    // Verificar que se guardó el usuario (actualiza lastAccess)
    expect(userRepository.save).toHaveBeenCalledOnce();

    // Verificar que se almacenó el refresh token
    expect(refreshTokenRepository.create).toHaveBeenCalledOnce();
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: 'hashed-refresh-token',
        userId: USER_ID,
      }),
    );
  });

  it('debería devolver TenantSelectorDto cuando el usuario tiene múltiples tenants', async () => {
    const user = createTestUser();
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);

    const memberships = [
      createMembership(TENANT_ID, ROLE_ID, 'PRESIDENT', 'Peña Test', 'pena-test'),
      createMembership(TENANT_ID_2, ROLE_ID_2, 'SECRETARY', 'Club Deportivo', 'club-deportivo'),
    ];
    (prismaMain.tenantMembership as any).findMany.mockResolvedValue(memberships);

    const result = await handler.execute(validCommand);

    // Debe devolver TenantSelectorDto
    expect(result).toBeInstanceOf(TenantSelectorDto);
    const selectorResult = result as TenantSelectorDto;
    expect(selectorResult.requiresTenantSelection).toBe(true);
    expect(selectorResult.tenants).toHaveLength(2);
    expect(selectorResult.tenants[0].id).toBe(TENANT_ID);
    expect(selectorResult.tenants[0].role).toBe('PRESIDENT');
    expect(selectorResult.tenants[1].id).toBe(TENANT_ID_2);
    expect(selectorResult.tenants[1].role).toBe('SECRETARY');

    // No se deberían generar tokens
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it('debería lanzar InvalidCredentialsError si el usuario no existe', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(handler.execute(validCommand)).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.verify).not.toHaveBeenCalled();
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('debería lanzar InvalidCredentialsError y registrar intento fallido si la contraseña es incorrecta', async () => {
    const user = createTestUser();
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(handler.execute(validCommand)).rejects.toThrow(InvalidCredentialsError);

    // Debe guardar el usuario con el intento fallido registrado
    expect(userRepository.save).toHaveBeenCalledOnce();

    // No se deberían generar tokens
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('debería lanzar AccountBlockedError si la cuenta está bloqueada', async () => {
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos en el futuro
    const user = createTestUser({ blocked: true, blockedUntil });
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(handler.execute(validCommand)).rejects.toThrow(AccountBlockedError);

    // No se debería intentar autenticar
    expect(passwordHasher.verify).not.toHaveBeenCalled();
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('debería lanzar InvalidCredentialsError si el usuario no tiene membresías activas', async () => {
    const user = createTestUser();
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);
    (prismaMain.tenantMembership as any).findMany.mockResolvedValue([]);

    await expect(handler.execute(validCommand)).rejects.toThrow(InvalidCredentialsError);
  });

  it('debería generar tokens con el payload correcto incluyendo permisos', async () => {
    const user = createTestUser();
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);

    const membership = createMembership(TENANT_ID, ROLE_ID, 'PRESIDENT', 'Peña Test', 'pena-test');
    (prismaMain.tenantMembership as any).findMany.mockResolvedValue([membership]);

    await handler.execute(validCommand);

    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: USER_ID,
      tenantId: TENANT_ID,
      email: 'user@test.com',
      name: 'Test User',
      rol: 'PRESIDENT',
      permissions: ['read:members', 'write:members'],
    });
  });
});
