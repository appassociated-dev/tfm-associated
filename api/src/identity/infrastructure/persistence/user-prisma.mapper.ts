import { User } from '../../domain/aggregates/user';
import { UserId } from '../../domain/value-objects/user-id';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UserStatus } from '../../domain/value-objects/user-status';

/**
 * Datos de un usuario tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  status: string;
  failedAttempts: number;
  failedAttemptTimestamps: unknown; // Json en Prisma → unknown en TS
  blockedUntil: Date | null;
  createdAt: Date;
  lastAccess: Date | null;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio User.
 * Prisma Client usa camelCase (definido en schema.prisma) en ambas direcciones.
 */
export class UserPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate User.
   * Utiliza User.reconstitute() para evitar emisión de eventos.
   */
  static toDomain(raw: PrismaRawUser): User {
    // Convertir el campo Json de timestamps a Date[]
    const timestamps = UserPrismaMapper.parseTimestamps(raw.failedAttemptTimestamps);

    return User.reconstitute({
      id: UserId.fromString(raw.id),
      email: Email.create(raw.email),
      passwordHash: PasswordHash.fromHash(raw.passwordHash),
      name: raw.name,
      status: UserStatus.fromString(raw.status),
      failedAttempts: raw.failedAttempts,
      failedAttemptTimestamps: timestamps,
      blockedUntil: raw.blockedUntil,
      createdAt: raw.createdAt,
      lastAccess: raw.lastAccess,
    });
  }

  /**
   * Convierte un aggregate User a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(user: User): Record<string, unknown> {
    return {
      id: user.id.toValue(),
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      name: user.name,
      status: user.status.value,
      failedAttempts: user.failedAttempts,
      failedAttemptTimestamps: user.failedAttemptTimestamps.map((ts) => ts.toISOString()),
      blockedUntil: user.blockedUntil,
      createdAt: user.createdAt,
      lastAccess: user.lastAccess,
    };
  }

  /**
   * Parsea el campo Json de timestamps a un array de Date.
   * Maneja los casos: array de strings ISO, array vacío, null/undefined.
   */
  private static parseTimestamps(raw: unknown): Date[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((ts: unknown) => new Date(ts as string));
  }
}
