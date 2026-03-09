/**
 * Stub de tipos para PrismaClient (main y tenant).
 * Este archivo se usa SOLO cuando los clientes Prisma no han sido generados todavía.
 * Una vez ejecutado `prisma generate`, los tipos reales provienen de los directorios generated/.
 *
 * Para generar los tipos:
 *   npm run prisma:generate:main
 *   npm run prisma:generate:tenant
 */

declare module '@prisma-main' {
  /** Datos de un tenant tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawTenant {
    id: string;
    slug: string;
    name: string;
    cif: string;
    type: string;
    status: string;
    databaseName: string;
    contactEmail: string;
    createdAt: Date;
  }

  /** Datos de un usuario tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawUser {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    status: string;
    failedAttempts: number;
    blockedUntil: Date | null;
    createdAt: Date;
    lastAccess: Date | null;
  }

  /** Datos de un rol tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawRole {
    id: string;
    code: string;
    name: string;
    description: string | null;
    permissions: unknown;
    isSystem: boolean;
    tenantId: string | null;
  }

  /** Datos de una membresía tenant tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawTenantMembership {
    id: string;
    userId: string;
    tenantId: string;
    roleId: string;
    memberId: string | null;
    assignedAt: Date;
    assignedBy: string | null;
    active: boolean;
  }

  /** Datos de un refresh token tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawRefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
  }

  /** Datos de un evento de outbox tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawOutboxEvent {
    id: string;
    eventType: string;
    payload: unknown;
    tenantId: string | null;
    createdAt: Date;
    processedAt: Date | null;
    retryCount: number;
    nextRetryAt: Date | null;
    lastError: string | null;
  }

  /** Delegado para operaciones CRUD sobre un modelo Prisma. */
  interface PrismaDelegate<TRaw> {
    create(args: { data: Record<string, unknown> }): Promise<TRaw>;
    findUnique(args: { where: Record<string, unknown> }): Promise<TRaw | null>;
    findFirst(args: { where: Record<string, unknown> }): Promise<TRaw | null>;
    findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }): Promise<TRaw[]>;
    update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<TRaw>;
    delete(args: { where: Record<string, unknown> }): Promise<TRaw>;
    deleteMany(args?: { where?: Record<string, unknown> }): Promise<{ count: number }>;
    upsert(args: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<TRaw>;
  }

  export class PrismaClient {
    constructor(options?: { adapter?: unknown });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;

    tenant: PrismaDelegate<PrismaRawTenant>;
    user: PrismaDelegate<PrismaRawUser>;
    role: PrismaDelegate<PrismaRawRole>;
    tenantMembership: PrismaDelegate<PrismaRawTenantMembership>;
    refreshToken: PrismaDelegate<PrismaRawRefreshToken>;
    outboxEvent: PrismaDelegate<PrismaRawOutboxEvent>;
  }
}

declare module '@prisma-tenant' {
  export class PrismaClient {
    constructor(options?: { adapter?: unknown });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  }
}
