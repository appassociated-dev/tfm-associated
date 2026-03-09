import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma-main';

/**
 * Servicio singleton de PrismaClient para la base de datos principal (DB-Main).
 * Gestiona el ciclo de vida de la conexión: conecta al iniciar y desconecta al destruir.
 */
@Injectable()
export class PrismaMainService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasourceUrl: process.env.DATABASE_MAIN_URL,
    });
  }

  /** Conecta al iniciar el módulo NestJS. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Desconecta al destruir el módulo NestJS. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
