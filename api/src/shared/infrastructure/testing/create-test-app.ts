import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { PrismaMainService } from '../persistence/prisma-main.service';

/**
 * Resultado de createTestApp: la app NestJS y el módulo de testing.
 */
export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
}

/**
 * Crea una app NestJS real para tests E2E con todas las configuraciones
 * que tiene main.ts: global prefix, ValidationPipe, guards, etc.
 *
 * Uso:
 * ```ts
 * const { app } = await createTestApp();
 * const response = await request(app.getHttpServer()).get('/api/v1/auth/me');
 * await closeTestApp(app);
 * ```
 */
export async function createTestApp(): Promise<TestAppContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({
    logger: ['error', 'warn'],
  });

  // Replicar la configuración de main.ts
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return { app, module: moduleRef };
}

/**
 * Cierra limpiamente la app NestJS de test.
 * Llama a onModuleDestroy en todos los servicios (desconecta PrismaClients, etc.).
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

/**
 * Limpia recursos PostgreSQL (BD + usuario) creados por provisioning en tests.
 *
 * IMPORTANTE: llamar DESPUÉS de closeTestApp() para que PrismaTenantService
 * haya liberado las conexiones al tenant DB. Si quedan conexiones activas,
 * se terminan forzosamente antes del DROP.
 */
/**
 * Limpia tenants conocidos de E2E que pueden haber quedado de ejecuciones previas.
 * Se ejecuta ANTES de los tests para evitar 409 Conflict por CIF duplicado.
 *
 * Recibe los CIFs y emails de admin usados en los tests E2E.
 * Elimina membresías, roles, usuarios, tenants y BDs+usuarios PostgreSQL asociados.
 */
export async function cleanupKnownE2eFixtures(
  prisma: PrismaMainService,
  cifs: string[],
  adminEmails: string[],
): Promise<void> {
  // Buscar tenants existentes con esos CIFs
  const tenants = await (
    prisma.tenant as unknown as {
      findMany: (args: Record<string, unknown>) => Promise<{ id: string }[]>;
    }
  ).findMany({
    where: { cif: { in: cifs } },
    select: { id: true },
  });

  const tenantIds = tenants.map((t: { id: string }) => t.id);

  if (tenantIds.length > 0) {
    // Limpiar membresías, refresh tokens, roles, usuarios y tenants
    try {
      await prisma.tenantMembership.deleteMany({
        where: { tenantId: { in: tenantIds } },
      });
    } catch {
      // Ignorar
    }

    try {
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: adminEmails } } },
      });
    } catch {
      // Ignorar
    }

    try {
      await prisma.role.deleteMany({
        where: { tenantId: { in: tenantIds } },
      });
    } catch {
      // Ignorar
    }

    try {
      await prisma.user.deleteMany({
        where: { email: { in: adminEmails } },
      });
    } catch {
      // Ignorar
    }

    try {
      await prisma.tenant.deleteMany({
        where: { cif: { in: cifs } },
      });
    } catch {
      // Ignorar
    }

    // Limpiar BDs y usuarios PostgreSQL
    for (const tenantId of tenantIds) {
      const databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
      const username = `tenant_${tenantId.replace(/-/g, '_')}`;
      await cleanupTenantDatabase(prisma, databaseName, username);
    }
  }

  // También limpiar usuarios huérfanos (sin tenant asociado)
  try {
    await prisma.user.deleteMany({
      where: { email: { in: adminEmails } },
    });
  } catch {
    // Ignorar
  }
}

/**
 * Limpia recursos PostgreSQL (BD + usuario) creados por provisioning en tests.
 *
 * IMPORTANTE: llamar DESPUÉS de closeTestApp() para que PrismaTenantService
 * haya liberado las conexiones al tenant DB. Si quedan conexiones activas,
 * se terminan forzosamente antes del DROP.
 */
export async function cleanupTenantDatabase(
  prisma: { $queryRawUnsafe: (query: string) => Promise<unknown> },
  databaseName: string,
  username: string,
): Promise<void> {
  try {
    // Terminar conexiones activas al tenant DB
    await prisma.$queryRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()`,
    );
  } catch {
    // Ignorar — puede no haber conexiones
  }

  try {
    // Revocar privilegios ANTES de dropear la BD (si no, REVOKE falla por BD inexistente)
    await prisma.$queryRawUnsafe(
      `REVOKE ALL PRIVILEGES ON DATABASE "${databaseName}" FROM "${username}"`,
    );
  } catch {
    // Ignorar — BD puede no existir o privilegios ya revocados
  }

  try {
    await prisma.$queryRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
  } catch {
    // Ignorar
  }

  try {
    await prisma.$queryRawUnsafe(`DROP USER IF EXISTS "${username}"`);
  } catch {
    // Ignorar
  }
}
