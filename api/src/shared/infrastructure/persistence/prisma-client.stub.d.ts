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
  export class PrismaClient {
    constructor(options?: { datasourceUrl?: string });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  }
}

declare module '@prisma-tenant' {
  export class PrismaClient {
    constructor(options?: { datasourceUrl?: string });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  }
}
