import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Entrada del pool: cliente Prisma y timestamp del último uso. */
interface TenantPoolEntry {
  client: PrismaClient;
  lastUsed: Date;
}

/** Tiempo máximo de inactividad antes de evicción (30 minutos en ms). */
const DEFAULT_EVICTION_MS = 30 * 60 * 1000;

/** Número máximo de conexiones en el pool. */
const DEFAULT_MAX_POOL_SIZE = 10;

/**
 * Servicio de pool de PrismaClients para bases de datos de tenant.
 * Cada tenant tiene su propia base de datos (ADR-002).
 * Implementa lazy eviction: elimina conexiones inactivas tras 30 min.
 */
@Injectable()
export class PrismaTenantService implements OnModuleDestroy {
  private readonly pool = new Map<string, TenantPoolEntry>();
  private readonly maxPoolSize: number;
  private readonly evictionMs: number;

  constructor() {
    this.maxPoolSize =
      Number(process.env.TENANT_POOL_MAX_SIZE) || DEFAULT_MAX_POOL_SIZE;
    this.evictionMs =
      Number(process.env.TENANT_POOL_EVICTION_MS) || DEFAULT_EVICTION_MS;
  }

  /**
   * Obtiene o crea un PrismaClient para el tenant indicado.
   * Si el pool está lleno, evicta las conexiones más antiguas primero.
   */
  getClient(tenantId: string): PrismaClient {
    const existing = this.pool.get(tenantId);

    if (existing) {
      existing.lastUsed = new Date();
      return existing.client;
    }

    // Evictar conexiones inactivas antes de crear una nueva
    this.evictStaleConnections();

    // Si el pool sigue lleno tras la evicción, eliminar la entrada más antigua
    if (this.pool.size >= this.maxPoolSize) {
      this.evictOldestConnection();
    }

    const client = this.createClientForTenant(tenantId);
    this.pool.set(tenantId, { client, lastUsed: new Date() });

    return client;
  }

  /** Desconecta todos los clientes del pool al destruir el módulo. */
  async onModuleDestroy(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];

    for (const [, entry] of this.pool) {
      disconnectPromises.push(entry.client.$disconnect());
    }

    await Promise.all(disconnectPromises);
    this.pool.clear();
  }

  /** Crea un PrismaClient con la URL de conexión del tenant. */
  private createClientForTenant(tenantId: string): PrismaClient {
    const urlTemplate = process.env.DATABASE_TENANT_URL ?? '';
    const datasourceUrl = urlTemplate.replace('{tenantId}', tenantId);

    return new PrismaClient({ datasourceUrl });
  }

  /** Elimina conexiones que llevan más de evictionMs sin usarse. */
  private evictStaleConnections(): void {
    const now = Date.now();

    for (const [tenantId, entry] of this.pool) {
      if (now - entry.lastUsed.getTime() > this.evictionMs) {
        entry.client.$disconnect().catch(() => {
          // Error al desconectar se ignora en evicción
        });
        this.pool.delete(tenantId);
      }
    }
  }

  /** Elimina la conexión con el lastUsed más antiguo. */
  private evictOldestConnection(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [tenantId, entry] of this.pool) {
      const time = entry.lastUsed.getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = tenantId;
      }
    }

    if (oldestKey) {
      const entry = this.pool.get(oldestKey);
      entry?.client.$disconnect().catch(() => {
        // Error al desconectar se ignora en evicción
      });
      this.pool.delete(oldestKey);
    }
  }
}
