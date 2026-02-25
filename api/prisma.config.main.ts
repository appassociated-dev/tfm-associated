// Configuración Prisma 7 para el schema principal (DB-Main)
// Uso: npx prisma generate --config prisma.config.main.ts
//      npx prisma migrate dev --config prisma.config.main.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/main/schema.prisma',
  migrations: {
    path: 'prisma/main/migrations',
  },
  datasource: {
    url: env('DATABASE_MAIN_URL'),
  },
});
