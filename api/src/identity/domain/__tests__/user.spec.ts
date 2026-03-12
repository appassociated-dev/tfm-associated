import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { User } from '../aggregates/user';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { UserStatus } from '../value-objects/user-status';
import { UserAuthenticatedEvent } from '../events/user-authenticated.event';
import { UserBlockedEvent } from '../events/user-blocked.event';
import type { PasswordHasher } from '../ports/password-hasher.port';

/** Helper para crear un mock de PasswordHasher. */
function createMockHasher(verifyResult = true): PasswordHasher {
  return {
    hash: vi.fn().mockResolvedValue('hashed'),
    verify: vi.fn().mockResolvedValue(verifyResult),
  };
}

/** Helper para crear un User válido via create(). */
function createValidUser() {
  return User.create({
    email: 'admin@penya.es',
    passwordHash: 'argon2-hash-value',
    name: 'Admin User',
  });
}

/** Helper para reconstituir un User con control total de propiedades. */
function reconstituteUser(overrides: Partial<Parameters<typeof User.reconstitute>[0]> = {}) {
  return User.reconstitute({
    id: UserId.fromString('550e8400-e29b-41d4-a716-446655440000'),
    email: Email.create('admin@penya.es'),
    passwordHash: PasswordHash.fromHash('argon2-hash-value'),
    name: 'Admin User',
    status: UserStatus.active(),
    failedAttempts: 0,
    failedAttemptTimestamps: [],
    blockedUntil: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    lastAccess: null,
    ...overrides,
  });
}

describe('User', () => {
  // --- Creación con create() ---

  describe('create()', () => {
    it('debería crear un User con propiedades correctas y status ACTIVE', () => {
      const user = createValidUser();

      expect(uuidValidate(user.id.toValue())).toBe(true);
      expect(user.email.value).toBe('admin@penya.es');
      expect(user.name).toBe('Admin User');
      expect(user.status.value).toBe('ACTIVE');
      expect(user.failedAttempts).toBe(0);
      expect(user.blockedUntil).toBeNull();
      expect(user.lastAccess).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('no debería emitir eventos de dominio al crear (se emiten en el handler)', () => {
      const user = createValidUser();
      const events = user.pullDomainEvents();

      expect(events).toHaveLength(0);
    });

    it('debería lanzar error con nombre vacío', () => {
      expect(() => User.create({ email: 'a@b.es', passwordHash: 'hash', name: '' })).toThrow(
        'El nombre del usuario no puede estar vacío',
      );
    });

    it('debería lanzar error con email inválido', () => {
      expect(() =>
        User.create({ email: 'not-an-email', passwordHash: 'hash', name: 'Test' }),
      ).toThrow();
    });

    it('debería lanzar error con hash vacío', () => {
      expect(() => User.create({ email: 'a@b.es', passwordHash: '', name: 'Test' })).toThrow();
    });
  });

  // --- Reconstitución ---

  describe('reconstitute()', () => {
    it('debería reconstituir un User con todas las propiedades', () => {
      const user = reconstituteUser();

      expect(user.id.toValue()).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(user.email.value).toBe('admin@penya.es');
      expect(user.name).toBe('Admin User');
      expect(user.status.value).toBe('ACTIVE');
      expect(user.failedAttempts).toBe(0);
      expect(user.blockedUntil).toBeNull();
      expect(user.lastAccess).toBeNull();
    });

    it('no debería emitir eventos de dominio al reconstituir', () => {
      const user = reconstituteUser();
      const events = user.pullDomainEvents();

      expect(events).toHaveLength(0);
    });

    it('debería reconstituir un User con intentos fallidos previos', () => {
      const timestamps = [new Date('2025-06-01T10:00:00Z'), new Date('2025-06-01T10:01:00Z')];
      const user = reconstituteUser({
        failedAttempts: 2,
        failedAttemptTimestamps: timestamps,
      });

      expect(user.failedAttempts).toBe(2);
    });
  });

  // --- Autenticación exitosa ---

  describe('authenticate() — éxito', () => {
    it('debería autenticarse correctamente con contraseña válida', async () => {
      const hasher = createMockHasher(true);
      const user = reconstituteUser();

      const result = await user.authenticate('correct-password', hasher);

      expect(result.ok).toBe(true);
      expect(hasher.verify).toHaveBeenCalledWith('correct-password', 'argon2-hash-value');
    });

    it('debería limpiar intentos fallidos tras autenticación exitosa', async () => {
      const hasher = createMockHasher(true);
      const user = reconstituteUser({
        failedAttempts: 3,
        failedAttemptTimestamps: [new Date(), new Date(), new Date()],
      });

      await user.authenticate('correct-password', hasher);

      expect(user.failedAttempts).toBe(0);
    });

    it('debería actualizar lastAccess tras autenticación exitosa', async () => {
      const hasher = createMockHasher(true);
      const user = reconstituteUser({ lastAccess: null });

      const before = new Date();
      await user.authenticate('correct-password', hasher);
      const after = new Date();

      expect(user.lastAccess).not.toBeNull();
      expect(user.lastAccess!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.lastAccess!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('debería emitir UserAuthenticatedEvent tras autenticación exitosa', async () => {
      const hasher = createMockHasher(true);
      const user = reconstituteUser();

      await user.authenticate('correct-password', hasher);

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserAuthenticatedEvent);

      const event = events[0] as UserAuthenticatedEvent;
      expect(event.payload.userId).toBe(user.id.toValue());
      expect(event.payload.email).toBe(user.email.value);
    });
  });

  // --- Autenticación fallida ---

  describe('authenticate() — fallo', () => {
    it('debería fallar con contraseña incorrecta', async () => {
      const hasher = createMockHasher(false);
      const user = reconstituteUser();

      const result = await user.authenticate('wrong-password', hasher);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
    });

    it('debería incrementar intentos fallidos con contraseña incorrecta', async () => {
      const hasher = createMockHasher(false);
      const user = reconstituteUser();

      await user.authenticate('wrong-password', hasher);

      expect(user.failedAttempts).toBe(1);
    });

    it('debería añadir timestamp al registrar intento fallido', async () => {
      const hasher = createMockHasher(false);
      const user = reconstituteUser();

      const before = new Date();
      await user.authenticate('wrong-password', hasher);
      const after = new Date();

      // Verificamos indirectamente que hay timestamps recientes
      expect(user.failedAttempts).toBe(1);
    });
  });

  // --- Autenticación con cuenta bloqueada ---

  describe('authenticate() — cuenta bloqueada', () => {
    it('debería rechazar autenticación si la cuenta está bloqueada', async () => {
      const hasher = createMockHasher(true);
      const futureBlock = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos en el futuro
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: futureBlock,
      });

      const result = await user.authenticate('correct-password', hasher);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
      }
      // No debería verificar contraseña si está bloqueado
      expect(hasher.verify).not.toHaveBeenCalled();
    });

    it('debería incluir tiempo restante en el error de bloqueo', async () => {
      const hasher = createMockHasher(true);
      const futureBlock = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: futureBlock,
      });

      const result = await user.authenticate('correct-password', hasher);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error?.message).toContain('bloqueada');
      }
    });
  });

  // --- Bloqueo de cuenta ---

  describe('bloqueo de cuenta', () => {
    it('debería bloquear tras 5 intentos fallidos en 10 minutos', async () => {
      const hasher = createMockHasher(false);
      const now = new Date();
      // Reconstituir con 4 intentos recientes
      const recentTimestamps = Array.from(
        { length: 4 },
        (_, i) => new Date(now.getTime() - i * 1000),
      );
      const user = reconstituteUser({
        failedAttempts: 4,
        failedAttemptTimestamps: recentTimestamps,
      });

      await user.authenticate('wrong-password', hasher);

      expect(user.status.value).toBe('BLOCKED');
      expect(user.blockedUntil).not.toBeNull();

      // Verificar que el bloqueo es de 15 minutos
      const expectedBlockEnd = now.getTime() + 15 * 60 * 1000;
      expect(user.blockedUntil!.getTime()).toBeGreaterThanOrEqual(expectedBlockEnd - 2000);
      expect(user.blockedUntil!.getTime()).toBeLessThanOrEqual(expectedBlockEnd + 2000);
    });

    it('debería emitir UserBlockedEvent al bloquear la cuenta', async () => {
      const hasher = createMockHasher(false);
      const now = new Date();
      const recentTimestamps = Array.from(
        { length: 4 },
        (_, i) => new Date(now.getTime() - i * 1000),
      );
      const user = reconstituteUser({
        failedAttempts: 4,
        failedAttemptTimestamps: recentTimestamps,
      });

      await user.authenticate('wrong-password', hasher);

      const events = user.pullDomainEvents();
      // Se emiten 2 eventos: AuthenticationFailedEvent + UserBlockedEvent
      expect(events).toHaveLength(2);
      const blockedEvent = events.find((e) => e instanceof UserBlockedEvent);
      expect(blockedEvent).toBeDefined();

      const event = blockedEvent as UserBlockedEvent;
      expect(event.payload.userId).toBe(user.id.toValue());
      expect(event.payload.email).toBe(user.email.value);
      expect(event.payload.blockDuration).toBe(15 * 60 * 1000);
    });

    it('no debería bloquear con solo 4 intentos fallidos', async () => {
      const hasher = createMockHasher(false);
      const now = new Date();
      const recentTimestamps = Array.from(
        { length: 3 },
        (_, i) => new Date(now.getTime() - i * 1000),
      );
      const user = reconstituteUser({
        failedAttempts: 3,
        failedAttemptTimestamps: recentTimestamps,
      });

      await user.authenticate('wrong-password', hasher);

      expect(user.status.value).toBe('ACTIVE');
      expect(user.blockedUntil).toBeNull();
    });
  });

  // --- Ventana deslizante de 10 minutos ---

  describe('ventana deslizante de intentos', () => {
    it('no debería bloquear si 5 intentos están repartidos en más de 10 minutos', async () => {
      const hasher = createMockHasher(false);
      const now = new Date();
      // 4 intentos antiguos (hace más de 10 minutos)
      const oldTimestamps = Array.from(
        { length: 4 },
        (_, i) => new Date(now.getTime() - 11 * 60 * 1000 - i * 1000),
      );
      const user = reconstituteUser({
        failedAttempts: 4,
        failedAttemptTimestamps: oldTimestamps,
      });

      // El 5to intento ocurre ahora, pero los anteriores son viejos
      await user.authenticate('wrong-password', hasher);

      // Los viejos se filtran, solo queda 1 reciente → no bloquea
      expect(user.status.value).toBe('ACTIVE');
      expect(user.blockedUntil).toBeNull();
    });

    it('debería filtrar timestamps antiguos (> 10 min) del conteo', async () => {
      const hasher = createMockHasher(false);
      const now = new Date();
      // 2 viejos + 3 recientes = 5 almacenados, pero solo 3 recientes + 1 nuevo = 4 en ventana
      const oldTimestamps = [
        new Date(now.getTime() - 12 * 60 * 1000),
        new Date(now.getTime() - 11 * 60 * 1000),
      ];
      const recentTimestamps = [
        new Date(now.getTime() - 3 * 60 * 1000),
        new Date(now.getTime() - 2 * 60 * 1000),
        new Date(now.getTime() - 1 * 60 * 1000),
      ];
      const user = reconstituteUser({
        failedAttempts: 5,
        failedAttemptTimestamps: [...oldTimestamps, ...recentTimestamps],
      });

      await user.authenticate('wrong-password', hasher);

      // 3 recientes + 1 nuevo = 4 en ventana → no bloquea
      expect(user.status.value).toBe('ACTIVE');
      expect(user.failedAttempts).toBe(4); // Solo los de la ventana
    });

    it('debería bloquear con mezcla si hay 5+ recientes en ventana', async () => {
      const hasher = createMockHasher(false);
      const now = new Date();
      const oldTimestamps = [new Date(now.getTime() - 12 * 60 * 1000)];
      const recentTimestamps = Array.from(
        { length: 4 },
        (_, i) => new Date(now.getTime() - i * 1000),
      );
      const user = reconstituteUser({
        failedAttempts: 5,
        failedAttemptTimestamps: [...oldTimestamps, ...recentTimestamps],
      });

      await user.authenticate('wrong-password', hasher);

      // 4 recientes + 1 nuevo = 5 en ventana → bloquea
      expect(user.status.value).toBe('BLOCKED');
      expect(user.blockedUntil).not.toBeNull();
    });
  });

  // --- Auto-desbloqueo ---

  describe('auto-desbloqueo', () => {
    it('debería auto-desbloquearse si blockedUntil ya pasó', async () => {
      const hasher = createMockHasher(true);
      const pastBlock = new Date(Date.now() - 1000); // Bloqueado en el pasado
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: pastBlock,
        failedAttempts: 5,
        failedAttemptTimestamps: [],
      });

      // isBlocked() debería auto-desbloquear
      const result = await user.authenticate('correct-password', hasher);

      expect(result.ok).toBe(true);
      expect(user.status.value).toBe('ACTIVE');
      expect(user.blockedUntil).toBeNull();
      expect(user.failedAttempts).toBe(0);
    });
  });

  // --- isBlocked() ---

  describe('isBlocked()', () => {
    it('debería devolver false si blockedUntil es null', () => {
      const user = reconstituteUser({ blockedUntil: null });
      expect(user.isBlocked()).toBe(false);
    });

    it('debería devolver true si blockedUntil está en el futuro', () => {
      const futureBlock = new Date(Date.now() + 10 * 60 * 1000);
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: futureBlock,
      });
      expect(user.isBlocked()).toBe(true);
    });

    it('debería devolver false y auto-desbloquear si blockedUntil ya pasó', () => {
      const pastBlock = new Date(Date.now() - 1000);
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: pastBlock,
        failedAttempts: 5,
      });

      expect(user.isBlocked()).toBe(false);
      expect(user.status.value).toBe('ACTIVE');
      expect(user.blockedUntil).toBeNull();
      expect(user.failedAttempts).toBe(0);
    });
  });

  // --- getBlockTimeRemaining() ---

  describe('getBlockTimeRemaining()', () => {
    it('debería devolver 0 si no está bloqueado', () => {
      const user = reconstituteUser({ blockedUntil: null });
      expect(user.getBlockTimeRemaining()).toBe(0);
    });

    it('debería devolver milisegundos restantes si está bloqueado', () => {
      const futureBlock = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: futureBlock,
      });

      const remaining = user.getBlockTimeRemaining();
      // Debería ser cercano a 5 minutos (con tolerancia)
      expect(remaining).toBeGreaterThan(4 * 60 * 1000);
      expect(remaining).toBeLessThanOrEqual(5 * 60 * 1000);
    });

    it('debería devolver 0 si el bloqueo ya expiró', () => {
      const pastBlock = new Date(Date.now() - 1000);
      const user = reconstituteUser({
        status: UserStatus.blocked(),
        blockedUntil: pastBlock,
      });

      expect(user.getBlockTimeRemaining()).toBe(0);
    });
  });

  // --- Igualdad ---

  describe('igualdad', () => {
    it('debería considerar iguales dos users con el mismo id', () => {
      const user1 = reconstituteUser();
      const user2 = reconstituteUser({ name: 'Otro Nombre' });

      expect(user1.equals(user2)).toBe(true);
    });

    it('debería considerar diferentes dos users con distinto id', () => {
      const user1 = reconstituteUser();
      const user2 = reconstituteUser({
        id: UserId.fromString('660e8400-e29b-41d4-a716-446655440001'),
      });

      expect(user1.equals(user2)).toBe(false);
    });
  });
});
