# 6. Troubleshooting

<p align="center">
  <a href="05-migration-guide.md">← 5. Guía de migraciones</a> · 
  <a href="README.md">↑ Índice</a> · 
  <a href="07-commands-reference.md">7. Referencia rápida de comandos →</a>
</p>

---

Guía completa de resolución de problemas para el entorno de despliegue de Associated. Cada entrada incluye el mensaje de error exacto, la causa raíz y los comandos para solucionarlo.

## Tabla de contenidos

- [Problemas de contenedores](#problemas-de-contenedores) - #1 a #8
- [Problemas de build](#problemas-de-build) - #9 a #12
- [Problemas de despliegue](#problemas-de-despliegue) - #13 a #16
- [Problemas de seed](#problemas-de-seed) - #17 a #18
- [Problemas de nginx](#problemas-de-nginx) - #19 a #20
- [Problemas de base de datos](#problemas-de-base-de-datos) - #21 a #23
- [Problemas de certificados SSL](#problemas-de-certificados-ssl) - #24 a #25
- [Depuración general](#depuración-general)

---

## Problemas de contenedores

### 1. PostgreSQL no arranca - "Permission denied" en chown/chmod

**Error**: `chmod: changing permissions of '/var/lib/postgresql/data': Permission denied`

**Causa raíz**: El contenedor de PostgreSQL necesita cambiar permisos del directorio de datos al iniciar. En ciertos hosts con configuraciones de seguridad restrictivas (AppArmor, SELinux, overlayfs), el contenedor no tiene los capabilities necesarios.

**Solución**: Agregar `cap_add` al servicio `db` en `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:18-alpine
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - SETGID
      - SETUID
```

```bash
ssh vps-associated "cd /opt/associated && docker compose up -d db"
```

---

### 2. Web se reinicia - "mkdir /var/cache/nginx/client_temp failed (13: Permission denied)"

**Error**: `nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)`

**Causa raíz**: La imagen `nginx:1.27-alpine` intenta crear directorios de cache al arrancar. Si el contenedor corre como usuario no-root, nginx no tiene permisos.

**Solución A** (recomendada): Agregar capabilities en `docker-compose.yml`:

```yaml
services:
  web:
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
```

**Solución B**: Ajustar el Dockerfile del web para crear los directorios antes de cambiar de usuario:

```dockerfile
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
    && chmod -R 777 /var/cache/nginx

USER nginx
```

---

### 3. API no arranca - "ENCRYPTION_KEY debe tener 64 caracteres hexadecimales"

**Error**: `Error: ENCRYPTION_KEY debe tener 64 caracteres hexadecimales (32 bytes)`

**Causa raíz**: La variable `ENCRYPTION_KEY` en `.env` no tiene el formato correcto. Debe ser exactamente 64 caracteres hexadecimales.

**Solución**:

```bash
# Generar clave de 32 bytes (64 caracteres hex)
ssh vps-associated "openssl rand -hex 32"

# Editar el .env con la clave generada
ssh vps-associated "nano /opt/associated/.env"

# Reiniciar la API
ssh vps-associated "cd /opt/associated && docker compose restart api"
```

**Verificación**:

```bash
# Debe imprimir exactamente 64
ssh vps-associated "grep ENCRYPTION_KEY /opt/associated/.env | cut -d= -f2 | tr -d '\"' | wc -c"
```

---

### 4. API no arranca - "Cannot find module '@prisma-main'"

**Error**: `Error: Cannot find module '@prisma-main'`

**Causa raíz**: La API usa path aliases (`@prisma-main`, `@prisma-tenant`) que se resuelven vía `tsconfig.json`. Si la variable `TS_NODE_PROJECT` no está seteada, Node.js no puede resolver esos aliases.

**Solución**: Verificar que el Dockerfile de la API defina la variable:

```dockerfile
ENV TS_NODE_PROJECT=tsconfig.json
```

O bien, agregar la variable en `docker-compose.yml`:

```yaml
services:
  api:
    environment:
      - TS_NODE_PROJECT=tsconfig.json
```

---

### 5. API crashea en tenant provisioning - "Config file not found at /app/app/prisma/"

**Error**: `PrismaClientInitializationError: Config file not found at /app/app/prisma/`

**Causa raíz**: El código de provisioning construye la ruta al schema de Prisma usando rutas relativas que se duplican. Usar `path.resolve('./prisma/...')` en producción se resuelve contra el CWD del contenedor (`/app`), resultando en `/app/app/prisma/`.

**Solución**: Usar `__dirname` para construir rutas absolutas:

```typescript
// MAL
const schemaPath = path.resolve('./prisma/schema/tenant.prisma');

// BIEN
const schemaPath = path.resolve(__dirname, '../../prisma/schema/tenant.prisma');
```

Rebuildar y redesplegar.

---

### 6. API crashea en tenant provisioning - "Can't write to /app/node_modules/@prisma/engines"

**Causa raíz**: Prisma necesita escribir en el directorio de engines durante la generación del cliente en runtime (tenant provisioning). Si la API corre como `appuser` (UID 1001), ese usuario no tiene permisos de escritura.

**Solución**: En el Dockerfile de la API, asegurar permisos antes de cambiar de usuario:

```dockerfile
RUN chown -R appuser:appuser /app/node_modules/@prisma/engines
USER appuser
```

---

### 7. Migration container falla - "Can't write to /app/node_modules/@prisma/engines"

**Causa raíz**: El contenedor de migración reutiliza la imagen de la API, que corre como `appuser`. Las migraciones de Prisma necesitan escribir en el directorio de engines.

**Solución**: Forzar `user: root` en el servicio de migración:

```yaml
services:
  migration:
    image: ghcr.io/appassociated-dev/associated-api:latest
    user: 'root'
```

---

### 8. Migration container falla - "psql: error: invalid URI query parameter: schema"

**Causa raíz**: La URL de conexión tiene el parámetro `?schema=public` que `psql` no reconoce.

**Solución**: Asegurar que `DATABASE_MAIN_URL` en `.env` NO incluya `?schema=public`:

```bash
# MAL
DATABASE_MAIN_URL=postgresql://admin:pass@db:5432/associated_main?schema=public

# BIEN
DATABASE_MAIN_URL=postgresql://admin:pass@db:5432/associated_main
```

```bash
ssh vps-associated "sed -i 's|?schema=public||g' /opt/associated/.env"
ssh vps-associated "cd /opt/associated && docker compose run --rm migration"
```

---

## Problemas de build

### 9. Docker build falla - "sh: husky: not found"

**Error**: `sh: husky: not found`

**Causa raíz**: Husky es una dependencia de desarrollo que configura git hooks. En Docker no hay repositorio git ni necesidad de hooks. El `prepare` script ejecuta `husky install` automáticamente después de `npm ci`.

**Solución**: Usar `--ignore-scripts` en el `npm ci` del Dockerfile:

```dockerfile
COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev
```

O alternativamente:

```dockerfile
RUN npm pkg delete scripts.prepare && npm ci --omit=dev
```

---

### 10. Docker build falla - "PrismaConfigEnvError: Cannot resolve environment variable"

**Error**: `Error: PrismaConfigEnvError: Cannot resolve environment variable 'DATABASE_MAIN_URL'`

**Causa raíz**: `prisma generate` se ejecuta durante el build y referencia variables de entorno que no existen en build-time.

**Solución**: Definir variables dummy en el Dockerfile:

```dockerfile
ARG DATABASE_MAIN_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG DATABASE_TENANT_TEMPLATE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_MAIN_URL=${DATABASE_MAIN_URL}
ENV DATABASE_TENANT_TEMPLATE_URL=${DATABASE_TENANT_TEMPLATE_URL}

RUN npx prisma generate --schema=prisma/schema/main.prisma
RUN npx prisma generate --schema=prisma/schema/tenant.prisma
```

> [!NOTE]
> Estas variables se sobreescriben en runtime por las definidas en `.env` o en `docker-compose.yml`.

---

### 11. Docker build falla - "Cannot find module generate-prisma-bridges.js"

**Error**: `Error: Cannot find module '/app/scripts/generate-prisma-bridges.js'`

**Causa raíz**: El paso de `prisma generate` invoca un script auxiliar que no se ha copiado aún al contenedor.

**Solución**: Asegurar que el script se copie ANTES de ejecutar `prisma generate`:

```dockerfile
COPY scripts/ ./scripts/
RUN npx prisma generate --schema=prisma/schema/main.prisma
```

---

### 12. Web build falla - cientos de errores TS2307/TS2339 desde .spec.tsx

**Error**: `error TS2307: Cannot find module '@testing-library/react'` (y cientos similares)

**Causa raíz**: El Dockerfile del web ejecuta `tsc -b` antes de `vite build`. Los archivos `.spec.tsx` referencian devDependencies que no están instaladas en producción.

**Solución**: Eliminar `tsc -b` del build de producción:

```dockerfile
# MAL
RUN npx tsc -b && npx vite build

# BIEN
RUN npx vite build
```

Si se necesita type-checking en CI, hacerlo en un step separado con todas las devDependencies instaladas.

---

## Problemas de despliegue

### 13. deploy.sh falla - "unknown flag: --get-login"

**Error**: `Error response from daemon: unknown flag: --get-login`

**Causa raíz**: El script usa `docker login --get-login` que no existe en Docker CLI.

**Solución**: Verificar la autenticación leyendo el config de Docker directamente:

```bash
# En lugar de: docker login --get-login
if ! grep -q "ghcr.io" ~/.docker/config.json 2>/dev/null; then
    echo "No autenticado en GHCR. Ejecutar: docker login ghcr.io"
    exit 1
fi
```

---

### 14. deploy.sh falla - "Permission denied (publickey)"

**Error**: `deploy@217.160.248.90: Permission denied (publickey).`

**Causa raíz**: La clave SSH no está configurada correctamente.

**Solución**:

```bash
# Verificar que la clave existe
ls -la ~/.ssh/id_ed25519.associated

# Probar la conexión con verbose
ssh -v vps-associated "echo OK"

# Si la clave no está en el VPS, copiarla:
ssh-copy-id -i ~/.ssh/id_ed25519.associated deploy@217.160.248.90
```

---

### 15. docker compose pull - "unauthorized" en GHCR

**Error**: `Error response from daemon: Head "https://ghcr.io/v2/...": unauthorized`

**Causa raíz**: El usuario `deploy` en el VPS no está autenticado contra GHCR. El login de Docker es per-user.

**Solución**:

```bash
# Conectar al VPS como deploy
ssh vps-associated

# Loguearse a GHCR (necesitas un PAT con scope read:packages)
echo "ghp_TU_TOKEN_AQUI" | docker login ghcr.io -u appassociated-dev --password-stdin

# Verificar
docker pull ghcr.io/appassociated-dev/associated-api:latest
```

> [!IMPORTANT]
> Siempre hacer el login como el usuario `deploy`, no como `root`.

---

### 16. docker compose up - "lstat /opt/associated/api: no such file or directory"

**Error**: `failed to solve: lstat /opt/associated/api: no such file or directory`

**Causa raíz**: El `docker-compose.yml` en el VPS tiene directivas `build:` que apuntan a directorios locales. En el VPS no existe el código fuente.

**Solución**: Eliminar los bloques `build:` del compose en el VPS:

```yaml
services:
  api:
    # build:                    # ELIMINAR
    #   context: ./api          # ELIMINAR
    #   dockerfile: Dockerfile  # ELIMINAR
    image: ghcr.io/appassociated-dev/associated-api:latest
```

---

## Problemas de seed

### 17. Seed script falla - "LAST_WAS_CONFLICT: unbound variable"

**Error**: `line 42: LAST_WAS_CONFLICT: unbound variable`

**Causa raíz**: El script usa `set -u` pero no inicializa las variables de tracking antes de usarlas.

**Solución**: Agregar inicialización al principio del script, después de `set -euo pipefail`:

```bash
LAST_WAS_CONFLICT=false
CONFLICT_COUNT=0
SUCCESS_COUNT=0
```

---

### 18. Seed script falla - "jq: parse error"

**Error**: `jq: parse error (Invalid numeric literal at line 1, column 5)`

**Causa raíz**: Una función `warn()` escribe mensajes a stdout en lugar de stderr. Cuando la salida se pipea a `jq`, los warnings se mezclan con el JSON.

**Solución**: Asegurar que `warn()` escriba a stderr:

```bash
# MAL
warn() {
    echo "WARNING: $1"
}

# BIEN
warn() {
    echo "WARNING: $1" >&2
}
```

Lo mismo aplica para cualquier función de logging (`info()`, `debug()`, `error()`): deben escribir a stderr (`>&2`).

---

## Problemas de nginx

### 19. nginx -t falla - 'unknown directive "http2"'

**Error**: `nginx: [emerg] unknown directive "http2"`

**Causa raíz**: A partir de nginx 1.25, la directiva `http2 on;` se usa como directiva independiente. En versiones anteriores (como nginx 1.24 de Ubuntu 24.04), HTTP/2 se habilita como parámetro de la directiva `listen`.

**Solución**: Usar la sintaxis compatible con nginx < 1.25:

```nginx
# MAL (nginx >= 1.25)
listen 443 ssl;
http2 on;

# BIEN (nginx < 1.25, como 1.24 en Ubuntu 24.04)
listen 443 ssl http2;
listen [::]:443 ssl http2;
```

```bash
ssh vps-associated "nginx -v"
ssh vps-associated "sudo nano /etc/nginx/sites-available/associated.conf"
ssh vps-associated "sudo nginx -t && sudo systemctl reload nginx"
```

---

### 20. 404 Not Found desde nginx

**Síntoma**: Al acceder a `https://domain-deploy.com` se recibe un error 404 Not Found.

**Causa A - vhost no habilitado**:

```bash
ssh vps-associated "ls -la /etc/nginx/sites-enabled/associated.conf"

# Si no existe, crearlo
ssh vps-associated "sudo ln -s /etc/nginx/sites-available/associated.conf /etc/nginx/sites-enabled/"
ssh vps-associated "sudo nginx -t && sudo systemctl reload nginx"
```

**Causa B - contenedor web no está corriendo**:

```bash
ssh vps-associated "cd /opt/associated && docker compose ps web"
ssh vps-associated "cd /opt/associated && docker compose up -d web"
```

**Causa C - nginx no fue recargado después de levantar contenedores**: Cuando los contenedores se recrean, pueden obtener nuevas IPs internas.

```bash
ssh vps-associated "sudo systemctl reload nginx"
```

**Causa D - upstream incorrecto en la configuración de nginx**:

```bash
ssh vps-associated "cd /opt/associated && docker compose port web 80"
ssh vps-associated "grep proxy_pass /etc/nginx/sites-available/associated.conf"
```

---

## Problemas de base de datos

### 21. Reset completo de la base de datos (opción nuclear)

> [!CAUTION]
> Esto elimina TODOS los datos. Solo usar en entornos de desarrollo o si realmente se necesita empezar de cero.

```bash
ssh vps-associated << 'EOF'
cd /opt/associated
docker compose down
docker volume rm associated_pgdata
docker compose up -d db
sleep 5
docker compose exec db pg_isready -U admin
docker compose run --rm migration
EOF
```

---

### 22. Conectarse a PostgreSQL directamente para depuración

```bash
# Desde el VPS - conectar a la base principal
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main"

# Desde la máquina local - crear un túnel SSH
ssh -L 5433:127.0.0.1:5432 vps-associated

# En otra terminal, conectar con cualquier cliente PostgreSQL
psql -h 127.0.0.1 -p 5433 -U admin -d associated_main
```

**Queries útiles una vez conectado**:

```sql
-- Ver todas las tablas del schema public
\dt

-- Ver información de un tenant específico
SELECT * FROM "Tenant" WHERE slug = 'mi-asociacion';

-- Contar miembros en un tenant (conectarse primero a la DB del tenant)
\c associated_tenant_mi_asociacion
SELECT COUNT(*) FROM "Member";
```

---

### 23. Verificar tenants existentes y sus bases de datos

```bash
# Listar todos los tenants desde la tabla
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main \
  -c 'SELECT id, slug, \"databaseName\", status FROM \"Tenant\";'"

# Listar todas las bases de datos en PostgreSQL
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c '\l'"

# Verificar que las bases de datos de tenants existen
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin \
  -c \"SELECT datname FROM pg_database WHERE datname LIKE 'associated_tenant_%';\""
```

---

## Problemas de certificados SSL

### 24. Renovación de certificado SSL

Los certificados Let's Encrypt se renuevan automáticamente vía certbot. Si la renovación falla:

```bash
# Verificar el estado del certificado
ssh vps-associated "sudo certbot certificates"

# Renovar manualmente (dry-run primero)
ssh vps-associated "sudo certbot renew --dry-run"

# Si el dry-run funciona, ejecutar la renovación real
ssh vps-associated "sudo certbot renew"

# Recargar nginx para usar el certificado nuevo
ssh vps-associated "sudo systemctl reload nginx"

# Verificar que el timer de renovación automática está activo
ssh vps-associated "sudo systemctl status certbot.timer"
```

Si certbot falla porque el puerto 80 está ocupado:

```bash
ssh vps-associated "sudo certbot renew --nginx"
```

---

### 25. Permisos de certificados

**Síntoma**: nginx falla con "permission denied" al leer certificados SSL.

```bash
# Verificar permisos actuales
ssh vps-associated "sudo ls -la /etc/letsencrypt/live/domain-deploy.com/"

# Corregir permisos
ssh vps-associated << 'EOF'
sudo chmod 600 /etc/letsencrypt/live/domain-deploy.com/privkey.pem
sudo chmod 644 /etc/letsencrypt/live/domain-deploy.com/fullchain.pem
sudo chmod 755 /etc/letsencrypt/live/
sudo chmod 755 /etc/letsencrypt/archive/
EOF

# Verificar que nginx puede leer los certificados
ssh vps-associated "sudo nginx -t"
```

---

## Depuración general

### Ver logs de un contenedor

```bash
# Logs en tiempo real
ssh vps-associated "cd /opt/associated && docker compose logs -f api"

# Últimas 100 líneas
ssh vps-associated "cd /opt/associated && docker compose logs --tail 100 api"

# Logs de todos los servicios
ssh vps-associated "cd /opt/associated && docker compose logs -f"

# Logs con timestamps
ssh vps-associated "cd /opt/associated && docker compose logs -f -t api"

# Logs desde una fecha específica
ssh vps-associated "cd /opt/associated && docker compose logs --since '2024-01-15T10:00:00' api"
```

### Entrar a un contenedor en ejecución

```bash
# Shell en la API
ssh vps-associated "cd /opt/associated && docker compose exec api sh"

# Shell en la base de datos
ssh vps-associated "cd /opt/associated && docker compose exec db bash"

# Shell en el contenedor web
ssh vps-associated "cd /opt/associated && docker compose exec web sh"

# Ejecutar un comando puntual
ssh vps-associated "cd /opt/associated && docker compose exec api node -e 'console.log(process.env.NODE_ENV)'"
```

### Verificar estado de salud de los contenedores

```bash
# Estado de todos los servicios
ssh vps-associated "cd /opt/associated && docker compose ps"

# Estado detallado con health checks
ssh vps-associated "docker inspect --format='{{.Name}}: {{.State.Health.Status}}' \$(docker ps -q)" 2>/dev/null
```

### Verificar uso de disco y memoria

```bash
# Uso de disco general
ssh vps-associated "df -h /"

# Uso de disco de Docker
ssh vps-associated "docker system df"

# Tamaño del volumen de PostgreSQL
ssh vps-associated "docker volume inspect associated_pgdata --format '{{.Mountpoint}}' | xargs sudo du -sh"

# Uso de memoria del sistema
ssh vps-associated "free -h"

# Recursos usados por cada contenedor en tiempo real
ssh vps-associated "docker stats --no-stream"
```

---

<p align="center">
  <a href="05-migration-guide.md">← 5. Guía de migraciones</a> · 
  <a href="README.md">↑ Índice</a> · 
  <a href="07-commands-reference.md">7. Referencia rápida de comandos →</a>
</p>
