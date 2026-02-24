> **Categoría:** 6. Mantenibilidad y Operaciones

### 6.6 RNFT-066: Migraciones con Prisma

**RNF Base:** RNF-066 (Gestión de Migraciones de Datos)

**Workflow de migraciones:**

```bash
# Desarrollo: crear migración
npx prisma migrate dev --name add_campo_x

# CI/CD: aplicar migraciones
npx prisma migrate deploy

# Rollback (manual)
npx prisma migrate resolve --rolled-back <migration_name>
```

**Estructura de migraciones:**

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20260201_init/
    │   └── migration.sql
    ├── 20260215_add_carnet/
    │   └── migration.sql
    └── migration_lock.toml
```

**Reglas:**
- Migraciones siempre forward-only
- Backup antes de migraciones destructivas
- Migraciones probadas en staging antes de producción
- Sin `prisma migrate reset` en producción
