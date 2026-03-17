import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma-tenant';
import { buildTenantDatabaseName } from './build-tenant-database-name';
import {
  TENANT_CREDENTIAL_PROVIDER,
  type TenantCredentialProvider,
} from '../../domain/ports/tenant-credential-provider.port';

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
 *
 * Prisma v7 requiere driver adapter en lugar de datasourceUrl.
 *
 * Resolución de conexión (RNF-004):
 * - Usa buildTenantDatabaseName() (fuente de verdad compartida con Tenant.create())
 *   para obtener el nombre de BD correcto: associated_{uuid_con_underscores}.
 * - Si TenantCredentialProvider está disponible, usa credenciales per-tenant
 *   (username y password dedicados, cifrados en DB-Main).
 * - Si no hay provider o retorna null: fallback a credenciales compartidas
 *   de DATABASE_MAIN_URL (backward-compatible).
 */
@Injectable()
export class PrismaTenantService implements OnModuleDestroy {
  private readonly pool = new Map<string, TenantPoolEntry>();
  private readonly maxPoolSize: number;
  private readonly evictionMs: number;
  private readonly logger = new Logger(PrismaTenantService.name);

  constructor(
    @Optional()
    @Inject(TENANT_CREDENTIAL_PROVIDER)
    private readonly credentialProvider: TenantCredentialProvider | null = null,
  ) {
    this.maxPoolSize = Number(process.env.TENANT_POOL_MAX_SIZE) || DEFAULT_MAX_POOL_SIZE;
    this.evictionMs = Number(process.env.TENANT_POOL_EVICTION_MS) || DEFAULT_EVICTION_MS;
  }

  /**
   * Obtiene o crea un PrismaClient para el tenant indicado.
   * Si el pool está lleno, evicta las conexiones más antiguas primero.
   * Async porque la primera conexión puede requerir consultar credenciales cifradas.
   */
  async getClient(tenantId: string): Promise<PrismaClient> {
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

    const client = await this.createClientForTenant(tenantId);
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

  /**
   * Crea un PrismaClient con la URL de conexión del tenant usando driver adapter.
   * Usa buildTenantDatabaseName() como fuente de verdad para el nombre de BD.
   * Intenta obtener credenciales per-tenant via el provider (RNF-004).
   * Si no hay provider o retorna null, usa credenciales compartidas de DATABASE_MAIN_URL.
   */
  private async createClientForTenant(tenantId: string): Promise<PrismaClient> {
    const databaseName = buildTenantDatabaseName(tenantId);
    const connectionString = await this.resolveConnectionString(tenantId, databaseName);

    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  }

  /**
   * Resuelve la connection string para un tenant.
   * Prioridad: credenciales per-tenant (via provider) > credenciales compartidas (fallback).
   */
  private async resolveConnectionString(tenantId: string, databaseName: string): Promise<string> {
    // Intentar obtener credenciales per-tenant
    if (this.credentialProvider) {
      try {
        const credentials = await this.credentialProvider.getConnectionCredentials(tenantId);

        if (credentials) {
          return this.buildConnectionStringWithCredentials(
            databaseName,
            credentials.username,
            credentials.password,
          );
        }

        this.logger.warn(
          `Credenciales per-tenant no encontradas para tenant ${tenantId}, usando fallback a credenciales compartidas`,
        );
      } catch (error) {
        this.logger.warn(
          `Error al obtener credenciales per-tenant para tenant ${tenantId}: ${(error as Error).message}. Usando fallback.`,
        );
      }
    }

    // Fallback: credenciales compartidas de DATABASE_MAIN_URL
    return this.buildConnectionStringShared(databaseName);
  }

  /**
   * Construye la connection string con credenciales per-tenant (RNF-004).
   * Usa host/puerto de DATABASE_MAIN_URL + user/password del tenant.
   */
  private buildConnectionStringWithCredentials(
    databaseName: string,
    username: string,
    password: string,
  ): string {
    const mainUrl = process.env.DATABASE_MAIN_URL ?? '';

    try {
      const url = new URL(mainUrl);
      url.username = encodeURIComponent(username);
      url.password = encodeURIComponent(password);
      url.pathname = `/${databaseName}`;
      return url.toString();
    } catch {
      // Fallback si DATABASE_MAIN_URL no es parseable
      return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@localhost:5432/${databaseName}?schema=public`;
    }
  }

  /**
   * Construye la connection string para una BD de tenant usando credenciales
   * compartidas de DATABASE_MAIN_URL (fallback backward-compatible).
   */
  private buildConnectionStringShared(databaseName: string): string {
    const mainUrl = process.env.DATABASE_MAIN_URL ?? '';

    try {
      const url = new URL(mainUrl);
      url.pathname = `/${databaseName}`;
      return url.toString();
    } catch {
      // Fallback si DATABASE_MAIN_URL no es parseable
      return `postgresql://associated:associated_dev@localhost:5432/${databaseName}?schema=public`;
    }
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
