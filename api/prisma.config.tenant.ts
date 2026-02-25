// Configuración Prisma 7 para el schema de tenant (DB-Tenant)
// Uso: npx prisma generate --config prisma.config.tenant.ts
//      npx prisma migrate dev --config prisma.config.tenant.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/tenant/schema.prisma',
  migrations: {
    path: 'prisma/tenant/migrations',
  },
  datasource: {
    // URL de plantilla — en provisión de tenant UC-001 se sustituye por la URL real
    url: env('DATABASE_TENANT_URL'),
  },
});
