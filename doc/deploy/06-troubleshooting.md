# 06 - Troubleshooting

_[← 5. Guía de migraciones](05-migration-guide.md) | [↑ Indice](README-DEPLOY.md) | [7. Referencia rapida de comandos →](07-commands-reference.md)_

---

Guia completa de resolucion de problemas para el entorno de despliegue de Associated. Cada entrada incluye el mensaje de error exacto, la causa raiz y los comandos para solucionarlo.

## Tabla de contenidos

- [Problemas de contenedores](#problemas-de-contenedores)
- [Problemas de build](#problemas-de-build)
- [Problemas de despliegue](#problemas-de-despliegue)
- [Problemas de seed](#problemas-de-seed)
- [Problemas de nginx](#problemas-de-nginx)
- [Problemas de base de datos](#problemas-de-base-de-datos)
- [Problemas de certificados SSL](#problemas-de-certificados-ssl)
- [Depuracion general](#depuracion-general)

---

## Problemas de contenedores

### 1. PostgreSQL no arranca - "Permission denied" en chown/chmod

**Mensaje de error:**

```
db-1  | chmod: changing permissions of '/var/lib/postgresql/data': Permission denied
db-1  | chown: changing ownership of '/var/lib/postgresql/data': Permission denied
```

**Causa raiz:**

El contenedor de PostgreSQL necesita cambiar permisos del directorio de datos al iniciar. En ciertos hosts con configuraciones de seguridad restrictivas (AppArmor, SELinux, overlayfs), el contenedor no tiene los capabilities necesarios para ejecutar `chown`/`chmod`.

**Solucion:**

Agregar `cap_add` al servicio `db` en `docker-compose.yml`:

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
    # ... resto de la configuracion
```

Luego recrear el contenedor:

```bash
ssh vps-associated "cd /opt/associated && docker compose up -d db"
```

---

### 2. Web se reinicia - "mkdir /var/cache/nginx/client_temp failed (13: Permission denied)"

**Mensaje de error:**

```
web-1  | nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)
```

**Causa raiz:**

La imagen `nginx:1.27-alpine` intenta crear directorios de cache al arrancar. Si el contenedor corre como usuario no-root (directiva `USER` en el Dockerfile), nginx no tiene permisos para crear esos directorios.

**Solucion - Opcion A (recomendada): agregar capabilities en `docker-compose.yml`:**

```yaml
services:
  web:
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
```

**Solucion - Opcion B: ajustar el Dockerfile del web para crear los directorios antes de cambiar de usuario:**

```dockerfile
# Antes de la directiva USER
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
    && chmod -R 777 /var/cache/nginx

USER nginx
```

Despues de aplicar la solucion:

```bash
ssh vps-associated "cd /opt/associated && docker compose up -d web"
```

---

### 3. API no arranca - "ENCRYPTION_KEY debe tener 64 caracteres hexadecimales"

**Mensaje de error:**

```
api-1  | Error: ENCRYPTION_KEY debe tener 64 caracteres hexadecimales (32 bytes)
```

**Causa raiz:**

La variable `ENCRYPTION_KEY` en `.env` no tiene el formato correcto. Debe ser una cadena de exactamente 64 caracteres hexadecimales (representando 32 bytes). Un error comun es generar la clave con un largo incorrecto o incluir caracteres no-hex.

**Solucion:**

Generar una clave correcta y actualizar el `.env`:

```bash
# Generar clave de 32 bytes (64 caracteres hex)
ssh vps-associated "openssl rand -hex 32"

# Editar el .env con la clave generada
ssh vps-associated "nano /opt/associated/.env"
# ENCRYPTION_KEY=<pegar la clave de 64 caracteres>

# Reiniciar la API
ssh vps-associated "cd /opt/associated && docker compose restart api"
```

**Verificacion:**

```bash
# Debe imprimir exactamente 64
ssh vps-associated "grep ENCRYPTION_KEY /opt/associated/.env | cut -d= -f2 | tr -d '\"' | wc -c"
```

---

### 4. API no arranca - "Cannot find module '@prisma-main'"

**Mensaje de error:**

```
api-1  | Error: Cannot find module '@prisma-main'
api-1  |     at Module._resolveFilename (node:internal/modules/cjs/loader:...)
```

**Causa raiz:**

La API usa path aliases (`@prisma-main`, `@prisma-tenant`) que se resuelven via `tsconfig.json`. Si la variable `TS_NODE_PROJECT` no esta seteada, Node.js no sabe donde buscar la configuracion de TypeScript y no puede resolver esos aliases.

**Solucion:**

Verificar que el Dockerfile de la API defina la variable:

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

```bash
ssh vps-associated "cd /opt/associated && docker compose up -d api"
```

---

### 5. API crashea en tenant provisioning - "Config file not found at /app/app/prisma/"

**Mensaje de error:**

```
api-1  | PrismaClientInitializationError: Config file not found at /app/app/prisma/
```

**Causa raiz:**

El codigo de provisioning construye la ruta al schema de Prisma usando rutas relativas que se duplican. Tipicamente, el problema es usar `path.resolve('./prisma/...')` que en produccion se resuelve contra el CWD del contenedor (`/app`), resultando en `/app/app/prisma/`. La solucion correcta es usar `__dirname` para construir rutas absolutas desde el archivo fuente.

**Solucion:**

En el codigo de provisioning, cambiar:

```typescript
// MAL
const schemaPath = path.resolve('./prisma/schema/tenant.prisma');

// BIEN
const schemaPath = path.resolve(__dirname, '../../prisma/schema/tenant.prisma');
```

Rebuildar y redesplegar:

```bash
# Desde la maquina de desarrollo
# (trigger CI/CD o push manual a GHCR)

# En el VPS
ssh vps-associated "cd /opt/associated && docker compose pull api && docker compose up -d api"
```

---

### 6. API crashea en tenant provisioning - "Can't write to /app/node_modules/@prisma/engines"

**Mensaje de error:**

```
api-1  | Error: Can't write to /app/node_modules/@prisma/engines
```

**Causa raiz:**

Prisma necesita escribir en el directorio de engines durante la generacion del cliente en runtime (tenant provisioning). Si la API corre como `appuser` (UID 1001), ese usuario no tiene permisos de escritura en `node_modules/@prisma/engines`.

**Solucion:**

En el Dockerfile de la API, asegurar permisos antes de cambiar de usuario:

```dockerfile
# Despues del npm ci
RUN chown -R appuser:appuser /app/node_modules/@prisma/engines

USER appuser
```

Rebuildar y redesplegar la imagen.

---

### 7. Migration container falla - "Error: Can't write to /app/node_modules/@prisma/engines"

**Mensaje de error:**

```
migration-1  | Error: Can't write to /app/node_modules/@prisma/engines
```

**Causa raiz:**

El contenedor de migracion reutiliza la imagen de la API, que corre como `appuser`. Las migraciones de Prisma necesitan escribir en el directorio de engines. A diferencia de la API en runtime, el contenedor de migracion es one-shot y no tiene riesgo de seguridad al correr como root.

**Solucion:**

Forzar `user: root` en el servicio de migracion en `docker-compose.yml`:

```yaml
services:
  migration:
    image: ghcr.io/appassociated-dev/associated-api:latest
    user: 'root'
    command: ['npx', 'prisma', 'migrate', 'deploy', '--schema=prisma/schema/main.prisma']
    # ... resto de la configuracion
```

```bash
ssh vps-associated "cd /opt/associated && docker compose run --rm migration"
```

---

### 8. Migration container falla - "psql: error: invalid URI query parameter: schema"

**Mensaje de error:**

```
migration-1  | Error: psql: error: connection to server failed: invalid URI query parameter: "schema"
```

**Causa raiz:**

La URL de conexion tiene el parametro `?schema=public` anexado (comun en Prisma para seleccionar schema). Cuando Prisma ejecuta migraciones, internamente usa `psql` para ciertas operaciones, y `psql` no reconoce el parametro `schema` en la URI.

**Solucion:**

Asegurar que `DATABASE_MAIN_URL` en `.env` NO incluya `?schema=public`:

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

**Mensaje de error:**

```
#12 ERROR: process "sh -c husky install" did not complete successfully
sh: husky: not found
```

**Causa raiz:**

Husky es una dependencia de desarrollo que configura git hooks. En el contexto de Docker no hay repositorio git ni necesidad de hooks. El `prepare` script de `package.json` ejecuta `husky install` automaticamente despues de `npm ci`.

**Solucion:**

Usar `--ignore-scripts` en el `npm ci` del Dockerfile:

```dockerfile
COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev
```

O alternativamente, si necesitas que otros scripts post-install corran:

```dockerfile
RUN npm pkg delete scripts.prepare && npm ci --omit=dev
```

---

### 10. Docker build falla - "PrismaConfigEnvError: Cannot resolve environment variable"

**Mensaje de error:**

```
Error: PrismaConfigEnvError: Cannot resolve environment variable 'DATABASE_MAIN_URL'
```

**Causa raiz:**

`prisma generate` se ejecuta durante el build de Docker para generar el cliente Prisma. El schema referencia variables de entorno (`env("DATABASE_MAIN_URL")`) que no existen en build-time.

**Solucion:**

Definir variables dummy en el Dockerfile, solo para que `prisma generate` pueda parsear el schema:

```dockerfile
# Variables dummy solo para prisma generate (no se usan en runtime)
ARG DATABASE_MAIN_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG DATABASE_TENANT_TEMPLATE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_MAIN_URL=${DATABASE_MAIN_URL}
ENV DATABASE_TENANT_TEMPLATE_URL=${DATABASE_TENANT_TEMPLATE_URL}

RUN npx prisma generate --schema=prisma/schema/main.prisma
RUN npx prisma generate --schema=prisma/schema/tenant.prisma
```

> **Nota:** Estas variables se sobreescriben en runtime por las definidas en `.env` o en `docker-compose.yml`.

---

### 11. Docker build falla - "Cannot find module generate-prisma-bridges.js"

**Mensaje de error:**

```
Error: Cannot find module '/app/scripts/generate-prisma-bridges.js'
```

**Causa raiz:**

El paso de `prisma generate` o el build invoca un script auxiliar (`generate-prisma-bridges.js`) que genera los bridge files para los path aliases de Prisma. Si el `COPY` de ese script esta despues del `RUN` que lo necesita, el archivo no existe aun.

**Solucion:**

Asegurar que el script se copie ANTES de ejecutar `prisma generate`:

```dockerfile
# Copiar scripts auxiliares primero
COPY scripts/ ./scripts/

# Ahora si, generar Prisma
RUN npx prisma generate --schema=prisma/schema/main.prisma
```

---

### 12. Web build falla - cientos de errores TS2307/TS2339 desde .spec.tsx

**Mensaje de error:**

```
src/features/members/components/member-form.spec.tsx(3,28): error TS2307: Cannot find module '@testing-library/react'
src/features/members/hooks/use-members.spec.tsx(15,5): error TS2339: Property 'mockReturnValue' does not exist
... (cientos de errores similares)
```

**Causa raiz:**

El Dockerfile del web ejecuta `tsc -b` (TypeScript build) antes de `vite build`. Los archivos `.spec.tsx` referencian dependencias de testing (`@testing-library/react`, `vitest`) que no estan instaladas en produccion (son devDependencies). `tsc -b` intenta compilar TODOS los archivos, incluyendo los tests.

**Solucion:**

Eliminar `tsc -b` del build de produccion. Vite ya hace su propio type-checking parcial y bundling:

```dockerfile
# MAL
RUN npx tsc -b && npx vite build

# BIEN
RUN npx vite build
```

Si se necesita type-checking en CI, hacerlo en un step separado con todas las devDependencies instaladas, no en el Dockerfile de produccion.

---

## Problemas de despliegue

### 13. deploy.sh falla - "unknown flag: --get-login"

**Mensaje de error:**

```
Error response from daemon: unknown flag: --get-login
```

**Causa raiz:**

El script `deploy.sh` usa `docker login --get-login` para verificar la autenticacion con GHCR. Esa flag no existe en Docker CLI. Existen distintas formas de verificar la autenticacion.

**Solucion:**

Verificar la autenticacion leyendo el config de Docker directamente:

```bash
# En lugar de: docker login --get-login
# Verificar si hay credenciales para ghcr.io
ssh vps-associated "cat ~/.docker/config.json | python3 -c \"import sys,json; d=json.load(sys.stdin); print('OK' if 'ghcr.io' in d.get('auths',{}) else 'NO AUTH')\""
```

Si el script `deploy.sh` tiene esa linea, corregirla:

```bash
# MAL
docker login --get-login ghcr.io

# BIEN (verificar credenciales existentes)
if ! grep -q "ghcr.io" ~/.docker/config.json 2>/dev/null; then
    echo "No autenticado en GHCR. Ejecutar: docker login ghcr.io"
    exit 1
fi
```

---

### 14. deploy.sh falla - "Permission denied (publickey)"

**Mensaje de error:**

```
deploy@217.160.248.90: Permission denied (publickey).
```

**Causa raiz:**

La clave SSH no esta configurada correctamente. Puede ser que no se este usando el alias `vps-associated` (que configura la clave correcta) o que la clave no este registrada en el VPS.

**Solucion:**

Verificar y configurar la conexion SSH:

```bash
# Verificar que la clave existe
ls -la ~/.ssh/id_ed25519.associated

# Verificar la configuracion SSH (~/.ssh/config debe tener):
# Host vps-associated
#     HostName 217.160.248.90
#     User deploy
#     IdentityFile ~/.ssh/id_ed25519.associated

# Probar la conexion con verbose
ssh -v vps-associated "echo OK"

# Si la clave no esta en el VPS, copiarla:
ssh-copy-id -i ~/.ssh/id_ed25519.associated deploy@217.160.248.90
```

---

### 15. docker compose pull - "unauthorized" en GHCR

**Mensaje de error:**

```
Error response from daemon: Head "https://ghcr.io/v2/...": unauthorized
```

**Causa raiz:**

El usuario `deploy` en el VPS no esta autenticado contra GHCR (GitHub Container Registry). El login de Docker es per-user; si se hizo `docker login` como `root`, el usuario `deploy` no tiene esas credenciales.

**Solucion:**

Autenticarse como el usuario `deploy`:

```bash
# Conectar al VPS como deploy
ssh vps-associated

# Loguearse a GHCR (necesitas un Personal Access Token con scope read:packages)
echo "ghp_TU_TOKEN_AQUI" | docker login ghcr.io -u appassociated-dev --password-stdin

# Verificar
docker pull ghcr.io/appassociated-dev/associated-api:latest
```

> **Importante:** Siempre hacer el login como el usuario `deploy`, no como `root`.

---

### 16. docker compose up - "lstat /opt/associated/api: no such file or directory"

**Mensaje de error:**

```
Error response from daemon: failed to solve: lstat /opt/associated/api: no such file or directory
```

**Causa raiz:**

El `docker-compose.yml` en el VPS tiene directivas `build:` que apuntan a directorios locales (`./api`, `./web`). En el VPS no existe el codigo fuente; solo se usan imagenes pre-construidas desde GHCR.

**Solucion:**

Eliminar o comentar los bloques `build:` del `docker-compose.yml` en el VPS:

```yaml
services:
  api:
    # build:                    # ELIMINAR esta linea
    #   context: ./api          # ELIMINAR esta linea
    #   dockerfile: Dockerfile  # ELIMINAR esta linea
    image: ghcr.io/appassociated-dev/associated-api:latest
    # ... resto
```

```bash
ssh vps-associated "cd /opt/associated && docker compose up -d"
```

---

## Problemas de seed

### 17. Seed script falla - "LAST_WAS_CONFLICT: unbound variable"

**Mensaje de error:**

```
/opt/associated/scripts/seed.sh: line 42: LAST_WAS_CONFLICT: unbound variable
```

**Causa raiz:**

El script usa `set -u` (tratar variables no definidas como error) pero no inicializa las variables de tracking antes de usarlas.

**Solucion:**

Agregar inicializacion al principio del script:

```bash
# Al inicio del script, despues de set -euo pipefail
LAST_WAS_CONFLICT=false
CONFLICT_COUNT=0
SUCCESS_COUNT=0
```

```bash
ssh vps-associated "nano /opt/associated/scripts/seed.sh"
# Agregar las inicializaciones
```

---

### 18. Seed script falla - "jq: parse error"

**Mensaje de error:**

```
jq: parse error (Invalid numeric literal at line 1, column 5)
```

**Causa raiz:**

Una funcion `warn()` en el script escribe mensajes de advertencia a stdout en lugar de stderr. Cuando la salida se pipea a `jq`, los mensajes de warning se mezclan con el JSON y causan un error de parseo.

**Solucion:**

Asegurar que `warn()` escriba a stderr:

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

Lo mismo aplica para cualquier funcion de logging (`info()`, `debug()`, `error()`): deben escribir a stderr (`>&2`).

---

## Problemas de nginx

### 19. nginx -t falla - 'unknown directive "http2"'

**Mensaje de error:**

```
nginx: [emerg] unknown directive "http2" in /etc/nginx/sites-enabled/associated.conf:12
nginx: configuration file /etc/nginx/nginx.conf test failed
```

**Causa raiz:**

A partir de nginx 1.25, la directiva `http2 on;` se usa como directiva independiente. En versiones anteriores (como nginx 1.24 de Ubuntu 24.04 repos), HTTP/2 se habilita como parametro de la directiva `listen`.

**Solucion:**

Usar la sintaxis compatible con nginx < 1.25:

```nginx
# MAL (nginx >= 1.25)
listen 443 ssl;
http2 on;

# BIEN (nginx < 1.25, como 1.24 en Ubuntu 24.04)
listen 443 ssl http2;
listen [::]:443 ssl http2;
```

```bash
# Verificar version de nginx
ssh vps-associated "nginx -v"

# Editar el vhost
ssh vps-associated "sudo nano /etc/nginx/sites-available/associated.conf"

# Testear y recargar
ssh vps-associated "sudo nginx -t && sudo systemctl reload nginx"
```

---

### 20. 404 Not Found desde nginx

**Sintoma:**

Al acceder a `https://associated.ipgsoft.com` se recibe un error 404 Not Found de nginx.

**Causas posibles y solucion:**

**Causa A - vhost no habilitado:**

```bash
# Verificar que el symlink existe
ssh vps-associated "ls -la /etc/nginx/sites-enabled/associated.conf"

# Si no existe, crearlo
ssh vps-associated "sudo ln -s /etc/nginx/sites-available/associated.conf /etc/nginx/sites-enabled/"
ssh vps-associated "sudo nginx -t && sudo systemctl reload nginx"
```

**Causa B - contenedor web no esta corriendo:**

```bash
# Verificar estado del contenedor
ssh vps-associated "cd /opt/associated && docker compose ps web"

# Si no esta running, levantarlo
ssh vps-associated "cd /opt/associated && docker compose up -d web"
```

**Causa C - nginx no fue recargado despues de levantar contenedores:**

Cuando los contenedores se recrean, pueden obtener nuevas IPs internas. Si nginx resolvio los upstreams al arrancar, puede tener IPs viejas cacheadas.

```bash
ssh vps-associated "sudo systemctl reload nginx"
```

**Causa D - upstream incorrecto en la configuracion de nginx:**

```bash
# Verificar que los puertos coincidan
ssh vps-associated "cd /opt/associated && docker compose port web 80"
ssh vps-associated "grep proxy_pass /etc/nginx/sites-available/associated.conf"
```

---

## Problemas de base de datos

### 21. Reset completo de la base de datos (opcion nuclear)

> **ADVERTENCIA:** Esto elimina TODOS los datos. Solo usar en entornos de desarrollo o si realmente se necesita empezar de cero.

```bash
ssh vps-associated << 'EOF'
cd /opt/associated

# Parar todos los contenedores
docker compose down

# Eliminar el volumen de PostgreSQL
docker volume rm associated_pgdata

# Recrear todo desde cero
docker compose up -d db

# Esperar a que PostgreSQL este listo
sleep 5
docker compose exec db pg_isready -U admin

# Ejecutar migraciones
docker compose run --rm migration

# (Opcional) Ejecutar seed
docker compose run --rm seed
EOF
```

---

### 22. Conectarse a PostgreSQL directamente para depuracion

```bash
# Desde el VPS - conectar a la base principal
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main"

# Desde la maquina local - crear un tunel SSH
ssh -L 5433:127.0.0.1:5432 vps-associated

# En otra terminal, conectar con cualquier cliente PostgreSQL
psql -h 127.0.0.1 -p 5433 -U admin -d associated_main
```

**Queries utiles una vez conectado:**

```sql
-- Ver todas las tablas del schema public
\dt

-- Ver informacion de un tenant especifico
SELECT * FROM "Tenant" WHERE slug = 'mi-asociacion';

-- Contar miembros en un tenant
-- (conectarse primero a la DB del tenant)
\c associated_tenant_mi_asociacion
SELECT COUNT(*) FROM "Member";
```

---

### 23. Verificar tenants existentes y sus bases de datos

```bash
# Listar todos los tenants desde la tabla
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c 'SELECT id, slug, \"databaseName\", status FROM \"Tenant\";'"

# Listar todas las bases de datos en PostgreSQL
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c '\l'"

# Verificar que las bases de datos de tenants existen
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c \"SELECT datname FROM pg_database WHERE datname LIKE 'associated_tenant_%';\""
```

---

## Problemas de certificados SSL

### 24. Renovacion de certificado SSL

Los certificados Let's Encrypt se renuevan automaticamente via certbot. Si la renovacion falla:

```bash
# Verificar el estado del certificado
ssh vps-associated "sudo certbot certificates"

# Renovar manualmente
ssh vps-associated "sudo certbot renew --dry-run"

# Si el dry-run funciona, ejecutar la renovacion real
ssh vps-associated "sudo certbot renew"

# Recargar nginx para usar el certificado nuevo
ssh vps-associated "sudo systemctl reload nginx"

# Verificar que el timer de renovacion automatica esta activo
ssh vps-associated "sudo systemctl status certbot.timer"
```

Si certbot falla porque el puerto 80 esta ocupado:

```bash
# Verificar que usa el plugin correcto (nginx o standalone)
ssh vps-associated "sudo certbot renew --nginx"
```

---

### 25. Permisos de certificados

**Sintoma:** nginx falla con "permission denied" al leer certificados SSL.

```bash
# Verificar permisos actuales
ssh vps-associated "sudo ls -la /etc/letsencrypt/live/associated.ipgsoft.com/"

# Corregir permisos
ssh vps-associated << 'EOF'
sudo chmod 600 /etc/letsencrypt/live/associated.ipgsoft.com/privkey.pem
sudo chmod 644 /etc/letsencrypt/live/associated.ipgsoft.com/fullchain.pem
sudo chmod 755 /etc/letsencrypt/live/
sudo chmod 755 /etc/letsencrypt/archive/
EOF

# Verificar que nginx puede leer los certificados
ssh vps-associated "sudo nginx -t"
```

---

## Depuracion general

### Ver logs de un contenedor

```bash
# Logs en tiempo real
ssh vps-associated "cd /opt/associated && docker compose logs -f api"

# Ultimas 100 lineas
ssh vps-associated "cd /opt/associated && docker compose logs --tail 100 api"

# Logs de todos los servicios
ssh vps-associated "cd /opt/associated && docker compose logs -f"

# Logs con timestamps
ssh vps-associated "cd /opt/associated && docker compose logs -f -t api"

# Logs desde una fecha especifica
ssh vps-associated "cd /opt/associated && docker compose logs --since '2024-01-15T10:00:00' api"
```

### Entrar a un contenedor en ejecucion

```bash
# Shell en el contenedor de la API
ssh vps-associated "cd /opt/associated && docker compose exec api sh"

# Shell en el contenedor de la base de datos
ssh vps-associated "cd /opt/associated && docker compose exec db bash"

# Shell en el contenedor web
ssh vps-associated "cd /opt/associated && docker compose exec web sh"

# Ejecutar un comando puntual sin entrar al contenedor
ssh vps-associated "cd /opt/associated && docker compose exec api node -e 'console.log(process.env.NODE_ENV)'"
```

### Verificar estado de salud de los contenedores

```bash
# Estado de todos los servicios
ssh vps-associated "cd /opt/associated && docker compose ps"

# Estado detallado con health checks
ssh vps-associated "docker inspect --format='{{.Name}}: {{.State.Health.Status}}' \$(docker ps -q)" 2>/dev/null

# Ver el resultado del ultimo health check de un contenedor
ssh vps-associated "docker inspect --format='{{json .State.Health}}' \$(docker compose -f /opt/associated/docker-compose.yml ps -q db)" | python3 -m json.tool
```

### Verificar uso de disco y memoria

```bash
# Uso de disco general
ssh vps-associated "df -h /"

# Uso de disco de Docker (imagenes, volumenes, contenedores)
ssh vps-associated "docker system df"

# Uso de disco detallado de Docker
ssh vps-associated "docker system df -v"

# Tamano del volumen de PostgreSQL
ssh vps-associated "docker volume inspect associated_pgdata --format '{{.Mountpoint}}' | xargs sudo du -sh"

# Uso de memoria del sistema
ssh vps-associated "free -h"

# Top 10 procesos por uso de memoria
ssh vps-associated "ps aux --sort=-%mem | head -11"

# Recursos usados por cada contenedor en tiempo real
ssh vps-associated "docker stats --no-stream"
```

---

_[← 5. Guía de migraciones](05-migration-guide.md) | [↑ Indice](README-DEPLOY.md) | [7. Referencia rapida de comandos →](07-commands-reference.md)_
