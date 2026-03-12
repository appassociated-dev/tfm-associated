import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenHandler } from '../commands/refresh-token.handler';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { InvalidRefreshTokenError } from '../../domain/exceptions/invalid-refresh-token.error';
import { User } from '../../domain/aggregates/user';
import { UserId } from '../../domain/value-objects/user-id';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UserStatus } from '../../domain/value-objects/user-status';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { TokenService } from '../../domain/ports/token-service.port';
import type {
  RefreshTokenRepository,
  RefreshTokenData,
} from '../../domain/repositories/refresh-token.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TENANT_ID = '660e8400-e29b-41d4-a716-446655440001';
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

function createStoredToken(overrides: Partial<RefreshTokenData> = {}): RefreshTokenData {
  return {
    id: 'token-id-123',
    tokenHash: 'hashed-token',
    userId: USER_ID,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días en el futuro
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('RefreshTokenHandler', () => {
  let handler: RefreshTokenHandler;
  let userRepository: Record<string, ReturnType<typeof vi.fn>>;
  let tokenService: Record<string, ReturnType<typeof vi.fn>>;
  let refreshTokenRepository: Record<string, ReturnType<typeof vi.fn>>;
  let prismaMain: Record<string, unknown>;

  const command = new RefreshTokenCommand('raw-refresh-token');

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    tokenService = {
      generateAccessToken: vi.fn().mockReturnValue('new-jwt-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('new-opaque-refresh-token'),
      hashRefreshToken: vi.fn().mockReturnValue('hashed-token'),
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

    handler = new RefreshTokenHandler(
      userRepository as unknown as UserRepository,
      tokenService as unknown as TokenService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      prismaMain as any,
    );
  });

  it('debería renovar tokens exitosamente con un token válido', async () => {
    const storedToken = createStoredToken();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);

    const user = createTestUser();
    userRepository.findById.mockResolvedValue(user);

    const membership = {
      id: 'membership-id',
      userId: USER_ID,
      tenantId: TENANT_ID,
      roleId: ROLE_ID,
      tenant: { id: TENANT_ID, name: 'Peña Test', slug: 'pena-test' },
      role: { id: ROLE_ID, code: 'PRESIDENT', name: 'President', permissions: ['read:members'] },
    };
    (prismaMain.tenantMembership as any).findFirst.mockResolvedValue(membership);

    const result = await handler.execute(command);

    // Verificar respuesta
    expect(result.accessToken).toBe('new-jwt-access-token');
    expect(result.refreshToken).toBe('new-opaque-refresh-token');
    expect(result.expiresIn).toBe(900);

    // Verificar que se revocó el token anterior
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('hashed-token');

    // Verificar que se creó el nuevo refresh token
    expect(refreshTokenRepository.create).toHaveBeenCalledOnce();

    // Verificar payload del access token
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: USER_ID,
      tenantId: TENANT_ID,
      email: 'user@test.com',
      name: 'Test User',
      rol: 'PRESIDENT',
      permissions: ['read:members'],
    });
  });

  it('debería lanzar InvalidRefreshTokenError si el token no existe', async () => {
    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(InvalidRefreshTokenError);

    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('debería lanzar InvalidRefreshTokenError si el token está expirado', async () => {
    const expiredToken = createStoredToken({
      expiresAt: new Date(Date.now() - 1000), // Expirado hace 1 segundo
    });
    refreshTokenRepository.findByTokenHash.mockResolvedValue(expiredToken);

    await expect(handler.execute(command)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('debería lanzar InvalidRefreshTokenError si el token está revocado', async () => {
    const revokedToken = createStoredToken({
      revokedAt: new Date(), // Ya revocado
    });
    refreshTokenRepository.findByTokenHash.mockResolvedValue(revokedToken);

    await expect(handler.execute(command)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('debería lanzar InvalidRefreshTokenError si el usuario no existe', async () => {
    const storedToken = createStoredToken();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
    userRepository.findById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('debería lanzar InvalidRefreshTokenError si el usuario no tiene membresía activa', async () => {
    const storedToken = createStoredToken();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);

    const user = createTestUser();
    userRepository.findById.mockResolvedValue(user);
    (prismaMain.tenantMembership as any).findFirst.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(InvalidRefreshTokenError);
  });
});
