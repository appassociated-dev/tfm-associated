// Servicio Prisma para la base de datos principal (DB-Main)
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma-main/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaMainService implements OnModuleInit, OnModuleDestroy {
  // Cliente Prisma instanciado con el driver adapter PrismaPg (obligatorio en Prisma 7)
  readonly client: PrismaClient;

  constructor() {
    // Prisma 7 requiere un driver adapter explícito; se usa PrismaPg para PostgreSQL
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_MAIN_URL,
    });
    this.client = new PrismaClient({ adapter });
  }

  // Establece la conexión con la base de datos principal al iniciar el módulo
  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  // Cierra la conexión con la base de datos principal al destruir el módulo
  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
