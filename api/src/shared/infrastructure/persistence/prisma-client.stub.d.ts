/**
 * Stub de tipos para PrismaClient.
 * Este archivo se usa SOLO cuando el cliente Prisma no ha sido generado todavía.
 * Una vez ejecutado `prisma generate`, los tipos reales provienen de @prisma/client.
 *
 * Para generar los tipos:
 *   npx prisma generate --schema=prisma/main/schema.prisma
 *   npx prisma generate --schema=prisma/tenant/schema.prisma
 */
declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: { datasourceUrl?: string });
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  }
}
