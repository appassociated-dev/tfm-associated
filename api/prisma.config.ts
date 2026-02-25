// Configuración Prisma 7 — MULTI-SCHEMA (ADR-002: separate DB per tenant)
//
// Este proyecto usa dos schemas separados. Cada uno tiene su propio config file:
//
//   prisma.config.main.ts   → DB principal (tenants, usuarios, roles)
//   prisma.config.tenant.ts → DB por tenant (datos de negocio, template)
//
// COMANDOS — Schema principal:
//   npx prisma generate --config prisma.config.main.ts
//   npx prisma migrate dev --config prisma.config.main.ts --name <nombre>
//   npx prisma migrate deploy --config prisma.config.main.ts
//
// COMANDOS — Schema de tenant:
//   npx prisma generate --config prisma.config.tenant.ts
//   npx prisma migrate dev --config prisma.config.tenant.ts --name <nombre>
//   npx prisma migrate deploy --config prisma.config.tenant.ts
//
// CLIENTES GENERADOS:
//   src/generated/prisma-main/   → cliente DB principal
//   src/generated/prisma-tenant/ → cliente DB tenant
//
// NOTA: Este archivo existe por compatibilidad. Usar siempre el config específico.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Por defecto apunta al schema principal (para comandos sin --config)
export default defineConfig({
  schema: 'prisma/main/schema.prisma',
  migrations: {
    path: 'prisma/main/migrations',
  },
  datasource: {
    url: env('DATABASE_MAIN_URL'),
  },
});
