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
    failedAttemptTimestamps: unknown;
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

  /** Tipo de membresía con relaciones de tenant y rol incluidas. */
  export interface PrismaRawTenantMembershipWithRelations extends PrismaRawTenantMembership {
    tenant: PrismaRawTenant;
    role: PrismaRawRole;
  }

  /** Delegado para operaciones CRUD sobre un modelo Prisma. */
  interface PrismaDelegate<TRaw> {
    create(args: { data: Record<string, unknown> }): Promise<TRaw>;
    findUnique(args: {
      where: Record<string, unknown>;
      include?: Record<string, boolean>;
    }): Promise<TRaw | null>;
    findFirst(args: {
      where: Record<string, unknown>;
      include?: Record<string, boolean>;
    }): Promise<TRaw | null>;
    findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
      include?: Record<string, boolean>;
    }): Promise<TRaw[]>;
    update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<TRaw>;
    delete(args: { where: Record<string, unknown> }): Promise<TRaw>;
    deleteMany(args?: { where?: Record<string, unknown> }): Promise<{ count: number }>;
    updateMany(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
    upsert(args: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<TRaw>;
  }

  /** Delegado especializado para TenantMembership con soporte de include. */
  interface TenantMembershipDelegate extends PrismaDelegate<PrismaRawTenantMembership> {
    findFirst(args: {
      where: Record<string, unknown>;
      include: { tenant: true; role: true };
    }): Promise<PrismaRawTenantMembershipWithRelations | null>;
    findFirst(args: { where: Record<string, unknown> }): Promise<PrismaRawTenantMembership | null>;
    findMany(args: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
      include: { tenant: true; role: true };
    }): Promise<PrismaRawTenantMembershipWithRelations[]>;
    findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }): Promise<PrismaRawTenantMembership[]>;
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
    tenantMembership: TenantMembershipDelegate;
    refreshToken: PrismaDelegate<PrismaRawRefreshToken>;
    outboxEvent: PrismaDelegate<PrismaRawOutboxEvent>;
  }
}

declare module '@prisma-tenant' {
  /** Datos de un evento de outbox tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawOutboxEvent {
    id: string;
    eventType: string;
    payload: unknown;
    createdAt: Date;
    processedAt: Date | null;
    retryCount: number;
    nextRetryAt: Date | null;
    lastError: string | null;
  }

  /** Datos de un MemberType tal como los devuelve el Prisma Client (camelCase). */
  export interface PrismaRawMemberType {
    id: string;
    code: string;
    name: string;
    description: string | null;
    ageRangeMin: number | null;
    ageRangeMax: number | null;
    votingRight: boolean;
    eligibleForOffice: boolean;
    minimumSeniorityForVoting: number;
    minimumSeniorityForOffice: number;
    automaticTransitionTargetId: string | null;
    rulesConfig: unknown;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  /** Delegado para operaciones CRUD sobre un modelo Prisma (tenant). */
  interface PrismaTenantDelegate<TRaw> {
    create(args: { data: Record<string, unknown> }): Promise<TRaw>;
    findUnique(args: {
      where: Record<string, unknown>;
      include?: Record<string, boolean>;
    }): Promise<TRaw | null>;
    findFirst(args: {
      where: Record<string, unknown>;
      include?: Record<string, boolean>;
    }): Promise<TRaw | null>;
    findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
      include?: Record<string, boolean>;
    }): Promise<TRaw[]>;
    update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<TRaw>;
    delete(args: { where: Record<string, unknown> }): Promise<TRaw>;
    deleteMany(args?: { where?: Record<string, unknown> }): Promise<{ count: number }>;
    updateMany(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
    upsert(args: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<TRaw>;
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
  }

  export class PrismaClient {
    constructor(options?: { adapter?: unknown });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;

    outboxEvent: PrismaTenantDelegate<PrismaRawOutboxEvent>;
    memberType: PrismaTenantDelegate<PrismaRawMemberType>;
  }
}
