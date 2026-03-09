import { Injectable } from '@nestjs/common';
import {
  RefreshTokenRepository,
  RefreshTokenData,
} from '../../domain/repositories/refresh-token.repository';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';

/**
 * Implementación Prisma del repositorio de RefreshToken.
 * Opera contra la tabla `refresh_tokens` de la BD principal (DB-Main).
 */
@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaMainService) {}

  /** Crea un nuevo refresh token en persistencia. */
  async create(data: { tokenHash: string; userId: string; expiresAt: Date }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: data.tokenHash,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  /** Busca un refresh token activo (no revocado y no expirado) por su hash. */
  async findByTokenHash(tokenHash: string): Promise<RefreshTokenData | null> {
    const raw = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!raw) {
      return null;
    }

    return {
      id: raw.id,
      tokenHash: raw.tokenHash,
      userId: raw.userId,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
      createdAt: raw.createdAt,
    };
  }

  /** Revoca un refresh token específico estableciendo revokedAt = ahora. */
  async revoke(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoca todos los refresh tokens de un usuario. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}
