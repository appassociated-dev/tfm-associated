# 5. Guía de migraciones

<table>
  <tr>
    <td width="45%">
      ← Anterior<br/>
      <a href="04-new-version-deploy.md">4. Deploy de nueva versión</a>
    </td>
    <td width="10%" align="center">
      <a href="README.md">↑</a>
    </td>
    <td width="45%" align="right">
      Siguiente →<br/>
      <a href="06-troubleshooting.md">6. Troubleshooting</a>
    </td>
  </tr>
</table>

---

Procedimientos para crear, ejecutar y recuperar migraciones de base de datos en Associated. El sistema usa Prisma 7 con un esquema dual: base de datos principal (`associated_main`) y bases de datos de tenant (una por tenant).

## Tabla de contenidos

- [Cómo funcionan las migraciones](#1-cómo-funcionan-las-migraciones)
- [Migración automática en deploy](#2-migración-automática-en-deploy)
- [Migración manual de la BD principal](#3-migración-manual-de-la-bd-principal)
- [Migración manual de tenant DBs](#4-migración-manual-de-tenant-dbs)
- [Crear nueva migración en desarrollo](#5-crear-nueva-migración-en-desarrollo)
- [Migración de un tenant específico](#6-migración-de-un-tenant-específico)
- [Qué pasa si una migración falla](#7-qué-pasa-si-una-migración-falla)
- [Referencia rápida de comandos](#referencia-rápida-de-comandos)

---

## 1. Cómo funcionan las migraciones

Associated usa un sistema de migraciones en **dos fases** debido a su arquitectura multi-tenant (ADR-002):

```mermaid
graph TD
    subgraph "Fase 1 - BD principal (associated_main)"
        M1["Schema: api/prisma/main/schema.prisma"]
        M2["Config: api/prisma/main/prisma.config.ts"]
        M3["Tablas: tenants, users, tenant_memberships, roles, ..."]
        M4["URL: DATABASE_MAIN_URL"]
    end

    subgraph "Fase 2 - BDs de tenant (tenant_&lt;slug&gt;)"
        T1["Schema: api/prisma/tenant/schema.prisma"]
        T2["Config: api/prisma/tenant/prisma.config.ts"]
        T3["Tablas: members, member_types, fee_plans, fiscal_years, ..."]
        T4["URL: DATABASE_TENANT_URL (dinámica por tenant)"]
    end

    M1 --> DEPLOY1["prisma migrate deploy (main)"]
    DEPLOY1 --> QUERY["SELECT database_name FROM tenants"]
    QUERY --> LOOP["Para cada tenant:<br/>prisma migrate deploy (tenant)<br/>con URL dinámica"]

    style M1 fill:#5B7682,stroke:#3D5E6C,color:#fff
    style T1 fill:#7A939E,stroke:#708C99,color:#fff
    style DEPLOY1 fill:#27343E,stroke:#1A2329,color:#fff
    style QUERY fill:#27343E,stroke:#1A2329,color:#fff
    style LOOP fill:#27343E,stroke:#1A2329,color:#fff
```

### Archivos clave

| Archivo                              | Propósito                                                    |
| :----------------------------------- | :----------------------------------------------------------- |
| `api/prisma/main/schema.prisma`      | Schema de la BD principal                                    |
| `api/prisma/main/prisma.config.ts`   | Config Prisma para BD principal (lee `DATABASE_MAIN_URL`)    |
| `api/prisma/main/migrations/`        | Migraciones de la BD principal                               |
| `api/prisma/tenant/schema.prisma`    | Schema de las BDs de tenant                                  |
| `api/prisma/tenant/prisma.config.ts` | Config Prisma para BDs de tenant (lee `DATABASE_TENANT_URL`) |
| `api/prisma/tenant/migrations/`      | Migraciones de las BDs de tenant                             |
| `scripts/migrate-tenants.sh`         | Script que itera todos los tenants y aplica migraciones      |

---

## 2. Migración automática en deploy

Cada vez que se ejecuta `docker compose up`, el servicio **`migration`** (one-shot) se encarga de las migraciones automáticamente:

```yaml
# Extracto de docker-compose.prod.yml
migration:
  image: ghcr.io/appassociated-dev/associated-api:latest
  depends_on:
    postgres:
      condition: service_healthy
  command:
    - |
      echo "[migration] Ejecutando migraciones de la BD principal..."
      npx prisma migrate deploy --config=api/prisma/main/prisma.config.ts
      echo "[migration] Migraciones principales completadas."
      echo "[migration] Ejecutando migraciones de tenants..."
      ./scripts/migrate-tenants.sh
      echo "[migration] Todas las migraciones completadas."
  restart: 'no'
```

**Orden de ejecución garantizado**:

```mermaid
graph LR
    PG["PostgreSQL<br/><em>healthy</em>"] --> MIG["migration<br/><em>exit code 0</em>"]
    MIG --> API["api"]
    MIG --> WEB["web"]

    style PG fill:#7A939E,stroke:#708C99,color:#fff
    style MIG fill:#27343E,stroke:#1A2329,color:#fff
    style API fill:#5B7682,stroke:#3D5E6C,color:#fff
    style WEB fill:#5B7682,stroke:#3D5E6C,color:#fff
```

Para verificar que las migraciones se ejecutaron correctamente:

```bash
ssh vps-associated "docker inspect associated-prod-migration --format='{{.State.ExitCode}}'"
# Esperado: 0

ssh vps-associated "docker logs associated-prod-migration"
```

---

## 3. Migración manual de la BD principal

Si necesitas ejecutar la migración de la BD principal fuera del flujo automático de deploy:

### 3.1 Desde el contenedor de migración

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated
docker compose -f docker-compose.prod.yml run --rm migration sh -c \
  "npx prisma migrate deploy --config=api/prisma/main/prisma.config.ts"
EOF
```

### 3.2 Verificar estado de las migraciones

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated
docker compose -f docker-compose.prod.yml run --rm migration sh -c \
  "npx prisma migrate status --config=api/prisma/main/prisma.config.ts"
EOF
```

---

## 4. Migración manual de tenant DBs

### 4.1 Migrar todos los tenants

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated
docker compose -f docker-compose.prod.yml run --rm migration sh -c \
  "./scripts/migrate-tenants.sh"
EOF
```

El script `migrate-tenants.sh`:

1. Consulta la tabla `tenants` en la BD principal para obtener los `database_name`
2. Para cada tenant, construye la URL de conexión dinámica
3. Ejecuta `npx prisma migrate deploy --config=api/prisma/tenant/prisma.config.ts`
4. Si un tenant falla, **continúa con el siguiente** (no interrumpe el deploy)
5. Al final, muestra un resumen con exitosos y fallidos

### 4.2 Interpretar la salida

```
[INFO] Encontrados 3 tenant(s) para migrar.
[INFO] Migrando tenant: tenant_pena_tio_pepe...
[OK] Tenant migrado: tenant_pena_tio_pepe
[INFO] Migrando tenant: tenant_club_deportivo...
[OK] Tenant migrado: tenant_club_deportivo
[INFO] Migrando tenant: tenant_federacion_xyz...
[OK] Tenant migrado: tenant_federacion_xyz

=========================================
 Migración de tenants completada
 Total: 3 | Exitosos: 3 | Fallidos: 0
=========================================
```

---

## 5. Crear nueva migración en desarrollo

### 5.1 Migración de la BD principal

Si modificaste `api/prisma/main/schema.prisma`:

```bash
cd api

DATABASE_MAIN_URL="postgresql://associated:associated@localhost:5432/associated_main?schema=public" \
  npx prisma migrate dev \
  --config=prisma/main/prisma.config.ts \
  --name <nombre_descriptivo>
```

Ejemplo:

```bash
DATABASE_MAIN_URL="postgresql://associated:associated@localhost:5432/associated_main?schema=public" \
  npx prisma migrate dev \
  --config=prisma/main/prisma.config.ts \
  --name add_audit_log_table
```

Esto crea un directorio en `api/prisma/main/migrations/<timestamp>_add_audit_log_table/` con el archivo `migration.sql`.

### 5.2 Migración de las BDs de tenant

Si modificaste `api/prisma/tenant/schema.prisma`:

```bash
cd api

DATABASE_TENANT_URL="postgresql://associated:associated@localhost:5432/tenant_dev?schema=public" \
  npx prisma migrate dev \
  --config=prisma/tenant/prisma.config.ts \
  --name <nombre_descriptivo>
```

### 5.3 Regenerar el cliente Prisma

Después de crear una migración, regenerar los clientes:

```bash
cd api
npm run prisma:generate
```

### 5.4 Commitear la migración

```bash
git add api/prisma/main/migrations/   # o api/prisma/tenant/migrations/
git add api/prisma/main/schema.prisma  # o api/prisma/tenant/schema.prisma
git commit -m "feat(api): add migration <nombre_descriptivo>"
```

> [!IMPORTANT]
> Las migraciones generadas por Prisma son archivos SQL **inmutables**. Una vez commiteadas y ejecutadas en producción, **nunca las modifiques**. Si necesitas cambiar algo, crea una nueva migración.

---

## 6. Migración de un tenant específico

Si necesitas migrar solo un tenant en particular (por ejemplo, después de resolver un error):

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated

# Definir el nombre de la BD del tenant
TENANT_DB="tenant_pena_tio_pepe"

# Obtener credenciales del .env
source .env

# Construir URL de conexión
TENANT_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${TENANT_DB}?schema=public"

# Ejecutar migración
docker compose -f docker-compose.prod.yml run --rm \
  -e DATABASE_TENANT_URL="${TENANT_URL}" \
  migration sh -c \
  "npx prisma migrate deploy --config=api/prisma/tenant/prisma.config.ts"
EOF
```

Para verificar el estado de las migraciones de un tenant:

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated

TENANT_DB="tenant_pena_tio_pepe"
source .env
TENANT_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${TENANT_DB}?schema=public"

docker compose -f docker-compose.prod.yml run --rm \
  -e DATABASE_TENANT_URL="${TENANT_URL}" \
  migration sh -c \
  "npx prisma migrate status --config=api/prisma/tenant/prisma.config.ts"
EOF
```

---

## 7. Qué pasa si una migración falla

### 7.1 Falla en la BD principal

Si `prisma migrate deploy` falla en la BD principal:

1. El contenedor `migration` sale con exit code distinto de 0
2. Los servicios `api` y `web` **NO arrancan** (dependen de `migration: service_completed_successfully`)
3. PostgreSQL sigue corriendo

**Diagnóstico**:

```bash
# Ver logs del contenedor de migración
ssh vps-associated "docker logs associated-prod-migration"

# Ver estado de las migraciones
ssh vps-associated bash -s << 'EOF'
cd /opt/associated
docker compose -f docker-compose.prod.yml run --rm migration sh -c \
  "npx prisma migrate status --config=api/prisma/main/prisma.config.ts"
EOF
```

**Recuperación**: Si la migración dejó la BD en un estado inconsistente:

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated

# Marcar la migración fallida como resuelta (después de arreglar la BD manualmente)
docker compose -f docker-compose.prod.yml run --rm migration sh -c \
  "npx prisma migrate resolve --config=api/prisma/main/prisma.config.ts --applied <NOMBRE_MIGRACION>"

# O si quieres descartar la migración y arreglar el schema
docker compose -f docker-compose.prod.yml run --rm migration sh -c \
  "npx prisma migrate resolve --config=api/prisma/main/prisma.config.ts --rolled-back <NOMBRE_MIGRACION>"
EOF
```

### 7.2 Falla en una BD de tenant

Si una migración de tenant falla:

1. El script `migrate-tenants.sh` **continúa con el siguiente tenant** (no interrumpe)
2. Al final muestra un resumen con los tenants que fallaron
3. Sale con exit code 1 (el contenedor `migration` falla)
4. Los servicios `api` y `web` **NO arrancan**

**Diagnóstico**:

```bash
ssh vps-associated "docker logs associated-prod-migration 2>&1 | grep -A5 'ERROR'"
```

**Recuperación**: Corregir el problema en la BD del tenant afectado (ver [sección 6](#6-migración-de-un-tenant-específico) para migrar un tenant específico), luego re-ejecutar el deploy:

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env up -d
EOF
```

### 7.3 Restaurar desde backup

Como último recurso, si la BD quedó irrecuperable:

```bash
ssh vps-associated bash -s << 'EOF'
cd /opt/associated

# Detener todo
docker compose -f docker-compose.prod.yml down

# Restaurar backup (asumiendo que tienes un dump SQL)
docker compose -f docker-compose.prod.yml up -d postgres
sleep 10  # Esperar a que PostgreSQL arranque

# Restaurar BD principal
docker exec -i associated-prod-postgres \
  psql -U associated -d associated_main < /path/to/backup/associated_main.sql

# Restaurar BD de tenant
docker exec -i associated-prod-postgres \
  psql -U associated -d tenant_pena_tio_pepe < /path/to/backup/tenant_pena_tio_pepe.sql

# Levantar todo
docker compose -f docker-compose.prod.yml --env-file .env up -d
EOF
```

### 7.4 Prevención

Para minimizar el riesgo de migraciones fallidas:

| Práctica                     | Descripción                                                  |
| :--------------------------- | :----------------------------------------------------------- |
| **Backup pre-deploy**        | Hacer un dump de la BD antes de cada deploy con migraciones  |
| **Migraciones aditivas**     | Preferir `ADD COLUMN` sobre `ALTER COLUMN` o `DROP COLUMN`   |
| **Valores por defecto**      | Siempre incluir `DEFAULT` en columnas nuevas NOT NULL        |
| **Probar en desarrollo**     | Ejecutar la migración completa localmente antes del deploy   |
| **Migraciones idempotentes** | Usar `IF NOT EXISTS` en SQL personalizado cuando sea posible |

Comando para hacer backup antes del deploy:

```bash
ssh vps-associated bash -s << 'EOF'
BACKUP_DIR="/opt/associated/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

# Backup de la BD principal
docker exec associated-prod-postgres \
  pg_dump -U associated associated_main > "${BACKUP_DIR}/associated_main.sql"

# Backup de todas las BDs de tenant
for DB in $(docker exec associated-prod-postgres \
  psql -U associated -d associated_main -t -A -c "SELECT database_name FROM tenants"); do
  docker exec associated-prod-postgres \
    pg_dump -U associated "${DB}" > "${BACKUP_DIR}/${DB}.sql"
done

echo "Backups creados en ${BACKUP_DIR}"
ls -la "${BACKUP_DIR}"
EOF
```

---

## Referencia rápida de comandos

| Acción                          | Comando                                                                          |
| :------------------------------ | :------------------------------------------------------------------------------- |
| Estado de migraciones (main)    | `npx prisma migrate status --config=api/prisma/main/prisma.config.ts`            |
| Estado de migraciones (tenant)  | `npx prisma migrate status --config=api/prisma/tenant/prisma.config.ts`          |
| Aplicar migraciones (main)      | `npx prisma migrate deploy --config=api/prisma/main/prisma.config.ts`            |
| Aplicar migraciones (tenant)    | `npx prisma migrate deploy --config=api/prisma/tenant/prisma.config.ts`          |
| Crear migración en dev (main)   | `npx prisma migrate dev --config=prisma/main/prisma.config.ts --name <nombre>`   |
| Crear migración en dev (tenant) | `npx prisma migrate dev --config=prisma/tenant/prisma.config.ts --name <nombre>` |
| Resolver migración fallida      | `npx prisma migrate resolve --config=... --applied <nombre>`                     |
| Descartar migración fallida     | `npx prisma migrate resolve --config=... --rolled-back <nombre>`                 |
| Regenerar cliente Prisma        | `npm run prisma:generate` (desde `api/`)                                         |

---

<table>
  <tr>
    <td width="45%">
      ← Anterior<br/>
      <a href="04-new-version-deploy.md">4. Deploy de nueva versión</a>
    </td>
    <td width="10%" align="center">
      <a href="README.md">↑</a>
    </td>
    <td width="45%" align="right">
      Siguiente →<br/>
      <a href="06-troubleshooting.md">6. Troubleshooting</a>
    </td>
  </tr>
</table>
