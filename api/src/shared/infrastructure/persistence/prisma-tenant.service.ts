// Gestiona el pool de clientes Prisma por tenant (multi-tenant BD separada)
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma-tenant/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Límite máximo de conexiones simultáneas por tenant según RNFT-004
const MAX_CONNECTIONS_PER_TENANT = 10;

@Injectable()
export class PrismaTenantService implements OnModuleDestroy {
  // Pool de clientes Prisma indexados por tenantId
  private readonly clientPool = new Map<string, PrismaClient>();

  // Retorna el cliente Prisma existente para el tenant o lanza error si no existe
  getClient(tenantId: string): PrismaClient {
    const existing = this.clientPool.get(tenantId);
    if (existing) {
      return existing;
    }

    // Si no existe, requiere que se haya creado previamente con la URL de la BD
    throw new Error(
      `No Prisma client found for tenant "${tenantId}". ` +
        `Call createClient(tenantId, databaseUrl) first.`,
    );
  }

  // Crea y registra un nuevo cliente Prisma para el tenant con la URL de su BD
  // Prisma 7 requiere instanciar PrismaPg como driver adapter explícito
  createClient(tenantId: string, databaseUrl: string): PrismaClient {
    if (this.clientPool.size >= MAX_CONNECTIONS_PER_TENANT) {
      throw new Error(
        `Maximum connection pool size (${MAX_CONNECTIONS_PER_TENANT}) reached. ` +
          `Cannot create new Prisma client for tenant "${tenantId}".`,
      );
    }

    const existing = this.clientPool.get(tenantId);
    if (existing) {
      return existing;
    }

    // Prisma 7: se usa PrismaPg adapter con la URL de la BD del tenant
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const client = new PrismaClient({ adapter });

    this.clientPool.set(tenantId, client);
    return client;
  }

  // Desconecta todos los clientes del pool al destruir el módulo
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clientPool.values()).map((client) =>
      client.$disconnect(),
    );
    await Promise.all(disconnectPromises);
    this.clientPool.clear();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnectAll();
  }
}
