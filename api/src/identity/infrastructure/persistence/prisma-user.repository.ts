import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/aggregates/user';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import { UserPrismaMapper, PrismaRawUser } from './user-prisma.mapper';

/**
 * Implementación Prisma del repositorio de User.
 * Opera contra la tabla `users` de la BD principal (DB-Main).
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaMainService) {}

  /** Busca un usuario por su dirección de email. */
  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
    });

    return raw ? UserPrismaMapper.toDomain(raw as unknown as PrismaRawUser) : null;
  }

  /** Busca un usuario por su identificador único. */
  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });

    return raw ? UserPrismaMapper.toDomain(raw as unknown as PrismaRawUser) : null;
  }

  /** Persiste un usuario en la BD principal usando upsert. */
  async save(user: User): Promise<void> {
    const data = UserPrismaMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: data.id as string },
      create: data,
      update: data,
    });
  }
}
