import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma-main';

/**
 * Servicio singleton de PrismaClient para la base de datos principal (DB-Main).
 * Gestiona el ciclo de vida de la conexión: conecta al iniciar y desconecta al destruir.
 *
 * Prisma v7 requiere driver adapter en lugar de datasourceUrl,
 * por lo que PrismaMainService envuelve (wrapper) en vez de extender PrismaClient.
 */
@Injectable()
export class PrismaMainService implements OnModuleInit, OnModuleDestroy {
  private readonly _client: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_MAIN_URL;
    const adapter = new PrismaPg({ connectionString });
    this._client = new PrismaClient({ adapter });
  }

  /** Acceso al cliente Prisma subyacente. */
  get client(): PrismaClient {
    return this._client;
  }

  // --- Delegados de modelos Prisma (para mantener compatibilidad con consumidores existentes) ---

  get tenant() {
    return this._client.tenant;
  }
  get user() {
    return this._client.user;
  }
  get role() {
    return this._client.role;
  }
  get tenantMembership() {
    return this._client.tenantMembership;
  }
  get refreshToken() {
    return this._client.refreshToken;
  }
  get outboxEvent() {
    return this._client.outboxEvent;
  }

  // --- Delegados de métodos Prisma ---

  async $connect(): Promise<void> {
    return this._client.$connect();
  }

  async $disconnect(): Promise<void> {
    return this._client.$disconnect();
  }

  async $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> {
    return this._client.$queryRawUnsafe(query, ...values);
  }

  async $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number> {
    return this._client.$executeRawUnsafe(query, ...values);
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
