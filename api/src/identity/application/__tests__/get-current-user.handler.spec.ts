import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetCurrentUserHandler } from '../queries/get-current-user.handler';
import { GetCurrentUserQuery } from '../queries/get-current-user.query';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';
import { User } from '../../domain/aggregates/user';
import { UserId } from '../../domain/value-objects/user-id';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UserStatus } from '../../domain/value-objects/user-status';
import type { UserRepository } from '../../domain/repositories/user.repository';

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

describe('GetCurrentUserHandler', () => {
  let handler: GetCurrentUserHandler;
  let userRepository: Record<string, ReturnType<typeof vi.fn>>;
  let prismaMain: Record<string, unknown>;

  const query = new GetCurrentUserQuery(USER_ID, TENANT_ID);

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    };

    prismaMain = {
      tenantMembership: {
        findFirst: vi.fn(),
      },
    };

    handler = new GetCurrentUserHandler(
      userRepository as unknown as UserRepository,
      prismaMain as any,
    );
  });

  it('debería devolver el perfil del usuario con tenant, rol y permisos', async () => {
    const user = createTestUser();
    userRepository.findById.mockResolvedValue(user);

    const membership = {
      id: 'membership-id',
      userId: USER_ID,
      tenantId: TENANT_ID,
      roleId: ROLE_ID,
      active: true,
      tenant: { id: TENANT_ID, name: 'Peña Test', slug: 'pena-test' },
      role: {
        id: ROLE_ID,
        code: 'PRESIDENT',
        name: 'President',
        permissions: ['read:members', 'write:members', 'admin:treasury'],
      },
    };
    (prismaMain.tenantMembership as any).findFirst.mockResolvedValue(membership);

    const result = await handler.execute(query);

    expect(result.id).toBe(USER_ID);
    expect(result.email).toBe('user@test.com');
    expect(result.name).toBe('Test User');
    expect(result.currentTenant.id).toBe(TENANT_ID);
    expect(result.currentTenant.name).toBe('Peña Test');
    expect(result.currentTenant.slug).toBe('pena-test');
    expect(result.role).toBe('PRESIDENT');
    expect(result.permissions).toEqual(['read:members', 'write:members', 'admin:treasury']);
  });

  it('debería lanzar InvalidCredentialsError si el usuario no existe', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(handler.execute(query)).rejects.toThrow(InvalidCredentialsError);
  });

  it('debería lanzar InvalidCredentialsError si el usuario no tiene membresía en el tenant', async () => {
    const user = createTestUser();
    userRepository.findById.mockResolvedValue(user);
    (prismaMain.tenantMembership as any).findFirst.mockResolvedValue(null);

    await expect(handler.execute(query)).rejects.toThrow(InvalidCredentialsError);
  });
});
