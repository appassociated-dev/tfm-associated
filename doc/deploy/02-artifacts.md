# 02 - Artefactos Generados

_[← 1. Arquitectura de Despliegue](01-architecture.md) | [↑ Indice](README-DEPLOY.md) | [3. Guia de Primer Despliegue →](03-initial-deploy.md) ->_

---

Este documento detalla los 12+ artefactos generados para el despliegue de produccion. Cada seccion explica el proposito, decisiones clave y gotchas de cada artefacto.

## Indice de artefactos

| #   | Artefacto                                                  | Ubicacion                                                                   |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | [Dockerfile API](#1-dockerfile-api)                        | `api/Dockerfile.prod`                                                       |
| 2   | [Dockerfile Web](#2-dockerfile-web)                        | `web/Dockerfile.prod`                                                       |
| 3   | [.dockerignore](#3-dockerignore)                           | `.dockerignore`                                                             |
| 4   | [nginx contenedor Web](#4-nginx-contenedor-web)            | `web/nginx.conf`                                                            |
| 5   | [nginx host (vhost)](#5-nginx-host-vhost)                  | `nginx/associated.conf`                                                     |
| 6   | [Docker Compose produccion](#6-docker-compose-produccion)  | `docker-compose.prod.yml`                                                   |
| 7   | [Variables de entorno](#7-variables-de-entorno)            | `.env.production.example`                                                   |
| 8   | [Script de despliegue](#8-script-de-despliegue)            | `scripts/deploy.sh`                                                         |
| 9   | [Script migracion tenants](#9-script-migracion-tenants)    | `scripts/migrate-tenants.sh`                                                |
| 10  | [Script seed produccion](#10-script-seed-produccion)       | `scripts/seed-production.sh`                                                |
| 11  | [Script verificacion](#11-script-verificacion)             | `scripts/verify-deploy.sh`                                                  |
| 12  | [Health endpoint](#12-health-endpoint)                     | `api/src/shared/infrastructure/health/`                                     |
| 13  | [Init SQL PostgreSQL](#13-init-sql-postgresql)             | `docker/postgres/init.sql`                                                  |
| 14  | [Fix database provisioning](#14-fix-database-provisioning) | `api/src/identity/infrastructure/services/database-provisioning.service.ts` |

---

## 1. Dockerfile API

**Archivo**: `api/Dockerfile.prod`
**Proposito**: Construir la imagen de produccion de la API NestJS en 3 etapas.

### Etapas del multi-stage build

```
Etapa 1: deps        Etapa 2: build       Etapa 3: production
(node:22-slim)       (hereda de deps)     (node:22-slim limpio)

npm ci (todo)        nest build           npm ci (--omit=dev)
prisma generate      (TypeScript -> JS)   COPY dist desde build
openssl install                           COPY prisma desde deps
                                          tini + psql + curl
                                          usuario appuser (1001)
```

### Configuraciones clave

**`--ignore-scripts` en `npm ci`**: Evita que Husky ejecute `prepare` dentro del contenedor. Sin esto, el build falla porque Husky intenta configurar git hooks en un entorno sin `.git`.

**Variables dummy para Prisma generate**:

```dockerfile
ENV DATABASE_MAIN_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DATABASE_TENANT_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
```

Prisma `generate` requiere que estas variables existan, aunque no conecta a la base de datos. Solo las usa para determinar el provider. Sin ellas, el generate falla con error de variable no definida.

**OpenSSL en la etapa deps**: Prisma engine requiere OpenSSL para generar los binarios del query engine. En `node:22-slim` no viene incluido.

**Tini como init process**: Node.js no maneja correctamente senales POSIX (SIGTERM, SIGINT) cuando corre como PID 1 en un contenedor. Tini actua como proceso init, reenviando senales y cosechando procesos zombi.

**postgresql-client en produccion**: El contenedor API tambien sirve como imagen base para el contenedor `migration`, que necesita `psql` para consultar la tabla de tenants.

**`TS_NODE_PROJECT=/app/api/tsconfig.json`**: NestJS usa `tsconfig-paths` en runtime para resolver aliases de path (`@shared/`, etc.). Sin esta variable, Node.js no encuentra el `tsconfig.json` y los imports con alias fallan en produccion.

**`chmod -R 777 ./node_modules/@prisma/engines`**: Cuando la API provisiona un nuevo tenant en runtime, Prisma necesita escribir en el directorio de engines. Sin estos permisos, el aprovisionamiento falla con EACCES.

**Usuario non-root (appuser, UID 1001)**: La aplicacion corre como usuario sin privilegios por seguridad. El grupo `appgroup` (GID 1001) se crea explicitamente para evitar conflictos con grupos existentes.

### Gotchas

- La etapa `build` hereda de `deps` (no de una imagen limpia). Esto reutiliza el `node_modules` completo con devDependencies, necesario para `nest build`.
- La etapa `production` hace un segundo `npm ci --omit=dev` con una imagen limpia. No reutiliza el `node_modules` de `deps` porque contiene devDependencies.
- El `COPY api/tsconfig.json ./api/` en produccion NO es para compilacion (ya esta compilado). Es para la resolucion de path aliases en runtime via `tsconfig-paths/register`.

---

## 2. Dockerfile Web

**Archivo**: `web/Dockerfile.prod`
**Proposito**: Construir la SPA React y servirla con nginx.

### Etapas del multi-stage build

```
Etapa 1: build           Etapa 2: production
(node:22-slim)           (nginx:1.27-alpine)

npm ci                   COPY dist -> /usr/share/nginx/html
vite build               COPY nginx.conf
(~15MB de assets)        curl (healthcheck)
```

### Configuraciones clave

**`ARG VITE_API_URL=/api`**: Define la URL base del API que se inyecta en el bundle de Vite. El valor por defecto `/api` funciona con el reverse proxy de nginx del host, que redirige `/api/*` al contenedor API. Se puede sobreescribir en build time con `--build-arg VITE_API_URL=...`.

**Sin `tsc` en el build**: Vite usa esbuild para la compilacion, que es significativamente mas rapido que `tsc`. La verificacion de tipos se hace en CI (quality gates), no en el build de produccion.

**nginx:1.27-alpine como imagen base**: Alpine reduce la imagen final a ~50MB. nginx 1.27 es la version LTS actual.

**curl para healthcheck**: Alpine no trae `curl` por defecto. Se instala unicamente para que Docker pueda verificar el health del contenedor via `curl -f http://localhost:8080/healthz`.

### Gotchas

- El build context es la **raiz del monorepo** (no `web/`), porque `npm ci --workspace=web` necesita el `package-lock.json` raiz.
- No se copia `web/postcss.config.mjs` - se copia `web/postcss.config.cjs`. Verificar el nombre exacto del archivo si cambia.

---

## 3. .dockerignore

**Archivo**: `.dockerignore`
**Proposito**: Reducir el contexto de build excluyendo archivos innecesarios.

### Exclusiones principales

| Patron                                      | Justificacion                                                    |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `node_modules`, `**/node_modules`           | Se instalan dentro del contenedor con `npm ci`                   |
| `dist`, `**/dist`                           | Se generan dentro del contenedor con `nest build` / `vite build` |
| `.git`                                      | No necesario en el contenedor; reduce contexto ~100MB+           |
| `e2e`, `**/*.spec.ts`                       | Tests no se ejecutan en produccion                               |
| `doc`, `spec`, `*.md`                       | Documentacion no va al contenedor                                |
| `.env`, `.env.*`                            | Secretos nunca en la imagen                                      |
| `!.env.example`, `!.env.production.example` | Excepcion: los examples si se copian si hiciera falta            |

### Impacto

Sin `.dockerignore`, el contexto de build incluiria ~500MB+ (node_modules, .git, tests). Con el archivo, se reduce a ~20-30MB, acelerando significativamente el build.

---

## 4. nginx contenedor Web

**Archivo**: `web/nginx.conf`
**Proposito**: Servir la SPA React con enrutamiento client-side dentro del contenedor Docker.

### Configuraciones clave

**SPA fallback (`try_files`)**:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Cuando React Router navega a `/members/123`, el navegador solicita esa ruta al servidor. Sin este fallback, nginx devolveria 404. Con `try_files`, si no existe un archivo estatico en esa ruta, sirve `index.html` y React Router maneja la ruta client-side.

**Cache inmutable para assets**:

```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Vite genera assets con hash en el nombre (`main.a1b2c3d4.js`). Si el contenido cambia, el hash cambia y el navegador descarga el nuevo archivo. Por eso se puede cachear agresivamente (1 anio, inmutable).

**Gzip**:

```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript application/json ...;
```

Comprime text, CSS, JS y JSON en transit. Nivel 6 es un buen equilibrio entre ratio de compresion y uso de CPU.

**Healthcheck endpoint (`/healthz`)**:

```nginx
location /healthz {
    access_log off;
    return 200 "ok";
}
```

Endpoint sintetico que devuelve 200 sin tocar el filesystem. `access_log off` evita contaminar los logs con checks cada 15 segundos.

**Puerto 8080**: nginx en el contenedor escucha en 8080 (no 80) para evitar conflictos con nginx del host y porque no se necesita el privilegio de puertos < 1024.

---

## 5. nginx host (vhost)

**Archivo**: `nginx/associated.conf`
**Ubicacion en VPS**: `/etc/nginx/sites-available/associated.conf`
**Proposito**: Reverse proxy con terminacion SSL, redireccion HTTP->HTTPS y cabeceras de seguridad.

### Configuraciones clave

**HTTP/2 con sintaxis legacy**:

```nginx
listen 443 ssl http2;
```

Ubuntu 24.04 incluye nginx 1.24, que usa `http2` en la directiva `listen`. nginx 1.25+ cambio a `http2 on;` como directiva separada. Si se actualiza nginx en el VPS, hay que cambiar la sintaxis.

**Redireccion HTTP -> HTTPS**:

```nginx
server {
    listen 80;
    location / {
        return 301 https://$host$request_uri;
    }
}
```

Todo el trafico HTTP se redirige permanentemente (301) a HTTPS. La excepcion es `/.well-known/acme-challenge/` para renovacion de certificados con certbot.

**Proxy a API y Web**:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000;
}
location / {
    proxy_pass http://127.0.0.1:8080;
}
```

Las peticiones con prefijo `/api/` van al contenedor NestJS. Todo lo demas va al contenedor nginx/SPA. El orden importa: nginx evalua `location` de mas especifica a menos especifica.

**Cabeceras de proxy**:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Estas cabeceras permiten que NestJS conozca la IP real del cliente y el protocolo original (HTTPS), ya que la conexion entre nginx y el contenedor es HTTP plano.

**WebSocket preparado** (para futuras funcionalidades):

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Content-Security-Policy**:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ..." always;
```

Restrictiva: solo permite recursos del mismo origen. `unsafe-inline` en `style-src` es necesario porque Mantine inyecta estilos inline.

### Gotchas

- La variable `${DOMAIN}` en el archivo debe reemplazarse por el dominio real antes de activarlo en el VPS.
- Los certificados SSL se esperan en `/etc/ssl/associated/fullchain.pem` y `/etc/ssl/associated/privkey.pem`.
- `proxy_buffering off` en la ruta `/api/` evita buffering de respuestas, lo que es importante si en el futuro se implementan Server-Sent Events (SSE).

---

## 6. Docker Compose produccion

**Archivo**: `docker-compose.prod.yml`
**Proposito**: Orquestar los 4 servicios de produccion con dependencias, health checks y limites de recursos.

### Servicios

#### postgres

- **Imagen**: `postgres:18-alpine`
- **Volumen**: `pgdata` (persistencia de datos)
- **Init SQL**: `./docker/postgres/init.sql` (extensiones uuid-ossp, pg_trgm, pgcrypto)
- **Tuning de memoria**: Via `command:` con flags de PostgreSQL
- **Health check**: `pg_isready` cada 10s, 5 reintentos, 30s de start period

#### migration (one-shot)

- **Imagen**: Misma que API (`ghcr.io/.../associated-api:latest`)
- **Usuario**: `root` (necesita escribir en prisma engines)
- **Entrypoint override**: Ejecuta `prisma migrate deploy` para main DB y luego `migrate-tenants.sh` para todos los tenants
- **Restart**: `no` (se ejecuta una vez y sale)
- **Depende de**: postgres `service_healthy`

#### api

- **Imagen**: `ghcr.io/appassociated-dev/associated-api:latest`
- **Health check**: `curl -f http://localhost:3000/api/v1/health` cada 15s
- **Depende de**: migration `service_completed_successfully` + postgres `service_healthy`
- **Variables**: Recibe 12+ variables de entorno desde `.env`

#### web

- **Imagen**: `ghcr.io/appassociated-dev/associated-web:latest`
- **Health check**: `curl -f http://localhost:8080/healthz` cada 15s
- **Depende de**: api `service_healthy`

### Configuraciones clave

**Puertos solo locales**:

```yaml
ports:
  - '127.0.0.1:3000:3000'
```

El bind a `127.0.0.1` es CRITICO. Sin el prefijo, Docker expone el puerto en `0.0.0.0` (todas las interfaces), saltandose el firewall del host.

**Cadena de dependencias explicita**:

```yaml
depends_on:
  migration:
    condition: service_completed_successfully
```

Docker Compose V2 soporta `service_completed_successfully` para contenedores one-shot. Esto garantiza que las migraciones se completan ANTES de que la API arranque.

**Logging con rotacion**:

```yaml
logging:
  driver: json-file
  options:
    max-size: '10m'
    max-file: '3'
```

Aplicado a todos los servicios. Maximo 30MB de logs por servicio.

### Gotchas

- El archivo NO incluye la build de imagenes (`build:` no esta definido). Las imagenes se construyen localmente y se pushean a GHCR. El compose solo hace `pull`.
- Se usa `--env-file .env` explicitamente al ejecutar compose. Las variables NO estan hardcodeadas.
- El servicio `migration` usa la misma imagen que `api` pero con `entrypoint` y `command` sobreescritos.

---

## 7. Variables de entorno

**Archivo**: `.env.production.example`
**Proposito**: Plantilla documentada de las 18+ variables de entorno necesarias en produccion.

### Variables criticas

| Variable             | Generacion                | Notas                                                       |
| -------------------- | ------------------------- | ----------------------------------------------------------- |
| `POSTGRES_PASSWORD`  | `openssl rand -hex 24`    | Hex para evitar caracteres especiales en la URL de conexion |
| `JWT_SECRET`         | `openssl rand -base64 48` | Minimo 32 caracteres                                        |
| `ENCRYPTION_KEY`     | `openssl rand -hex 32`    | EXACTAMENTE 64 caracteres hex (256 bits para AES-256)       |
| `SUPERADMIN_API_KEY` | `openssl rand -base64 32` | Clave para el endpoint de provisionamiento de tenants       |

### Coherencia entre variables

`DATABASE_MAIN_URL` y `DATABASE_TENANT_URL` deben usar los MISMOS valores de `POSTGRES_USER` y `POSTGRES_PASSWORD`. El host dentro de Docker es `postgres` (nombre del servicio), no `localhost`:

```
DATABASE_MAIN_URL=postgresql://associated:MI_PASSWORD@postgres:5432/associated_main?schema=public
```

### Gotchas

- `ENCRYPTION_KEY` debe tener **exactamente** 64 caracteres hexadecimales. Si tiene mas o menos, el cifrado AES-256 falla.
- No usar `-base64` para `POSTGRES_PASSWORD` porque puede generar caracteres como `+`, `/` o `=` que rompen la URL de conexion.
- `TENANT_POOL_MAX_SIZE` y `TENANT_POOL_EVICTION_MS` son opcionales. Los valores por defecto (10 conexiones, 5 min eviction) son adecuados para la mayoria de instalaciones.
- `SENTRY_DSN` es opcional. Si se omite o se deja vacio, Sentry no se activa.

---

## 8. Script de despliegue

**Archivo**: `scripts/deploy.sh`
**Proposito**: Flujo completo de build, push y deploy en un solo comando.

### Flujo de ejecucion

```
Validaciones -> Confirmacion interactiva -> Build (API + Web) -> Push GHCR -> SSH deploy -> Verificacion
```

### Opciones

| Flag           | Efecto                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| `--tag v1.0.0` | Usa un tag especifico en lugar de `latest`. Tambien taggea como `latest` |
| `--build-only` | Solo construye y sube imagenes, no ejecuta deploy en VPS                 |
| `--help`       | Muestra la ayuda                                                         |

### Variables de entorno

| Variable   |          Requerida          | Default | Proposito             |
| ---------- | :-------------------------: | ------- | --------------------- |
| `VPS_HOST` | Si (excepto `--build-only`) | -       | IP o hostname del VPS |
| `VPS_USER` |             No              | `root`  | Usuario SSH           |

### Configuraciones clave

**Verificacion de autenticacion GHCR**: El script verifica que `~/.docker/config.json` contenga credenciales para `ghcr.io` antes de intentar push.

**Doble tagging**: Cuando se usa `--tag v1.0.0`, la imagen tambien se taggea como `latest`. Esto permite que el compose del VPS (que referencia `latest`) siempre descargue la version mas reciente.

**Deploy remoto via heredoc**:

```bash
ssh "${VPS_USER}@${VPS_HOST}" bash -s <<REMOTE_SCRIPT
  cd /opt/associated
  docker compose pull api web
  docker compose down
  docker compose --env-file .env up -d
REMOTE_SCRIPT
```

El script se ejecuta en el VPS via SSH. Los comandos se encapsulan en un heredoc para ejecutarlos en una sola conexion SSH.

**Verificacion post-deploy**: Espera 10 segundos y verifica health checks de API y Web remotamente.

### Gotchas

- El script requiere confirmacion interactiva (`Continuar con el despliegue? [y/N]`). No es adecuado para CI/CD automatizado sin modificacion.
- El `docker compose down` detiene TODOS los servicios antes de levantar con las nuevas imagenes. Hay un breve downtime durante el deploy.
- El alias SSH `vps-associated` no se usa en el script. Se usa `${VPS_USER}@${VPS_HOST}` directamente.

---

## 9. Script migracion tenants

**Archivo**: `scripts/migrate-tenants.sh`
**Proposito**: Ejecutar `prisma migrate deploy` en todas las bases de datos de tenant.

### Flujo

```
1. Leer DATABASE_MAIN_URL
2. Limpiar ?schema=public (psql no lo entiende)
3. SELECT database_name FROM tenants
4. Para cada tenant:
   a. Construir URL de conexion
   b. DATABASE_TENANT_URL="{url}" npx prisma migrate deploy --config=api/prisma/tenant/prisma.config.ts
   c. Si falla: registrar error, continuar con el siguiente
5. Resumen: exitosos / fallidos
```

### Configuraciones clave

**Limpieza de URL para psql**:

```bash
PSQL_URL=$(echo "${DATABASE_MAIN_URL}" | sed 's|\?.*$||')
```

Prisma usa URLs con `?schema=public`. `psql` no entiende ese parametro y falla. Se elimina todo despues de `?`.

**Construccion de URL por tenant**:

```bash
MAIN_URL_BASE=$(echo "${DATABASE_MAIN_URL}" | sed 's|/[^/]*\?.*$||; s|/[^/]*$||')
TENANT_URL="${MAIN_URL_BASE}/${DB_NAME}?schema=public"
```

Extrae la base de la URL (protocolo + credenciales + host:puerto) y la combina con el nombre de la base de datos de cada tenant.

**Continue-on-failure**: Si un tenant falla, el script registra el error y continua con el siguiente. Al final reporta cuantos fallaron. Sale con codigo 1 si hubo fallos, pero no interrumpe el despliegue de los tenants restantes.

### Gotchas

- El script requiere `postgresql-client` instalado en el contenedor (incluido en `api/Dockerfile.prod`).
- El contenedor `migration` corre como `root` porque necesita escribir en el directorio de prisma engines.
- Si no hay tenants en la tabla, el script sale con codigo 0 (exito). Esto es normal en el primer despliegue.

---

## 10. Script seed produccion

**Archivo**: `scripts/seed-production.sh`
**Proposito**: Crear datos iniciales en produccion (tenant, admin, tipos de socio, planes de cuota, ejercicio fiscal).

### Datos creados

1. **Tenant** con nombre, CIF y tipo de colectividad configurables
2. **Usuario admin** con email y password proporcionados
3. **3 tipos de socio**: Adulto (18+), Juvenil (14-17), Infantil (0-13)
4. **4 planes de cuota**: Mensual (15 EUR), Trimestral (40 EUR), Anual (120 EUR), Inscripcion (50 EUR)
5. **Ejercicio fiscal 2026**
6. **Vinculaciones** plan-tipo de socio

### Configuraciones clave

**Idempotencia via HTTP 409**: Cada llamada a la API que crea un recurso maneja el codigo 409 (Conflict) como "ya existe, continuar". Esto permite re-ejecutar el script sin errores.

**Funcion `api_post` centralizada**: Encapsula la logica de curl + manejo de errores + idempotencia. Registra `LAST_HTTP_STATUS` y `LAST_WAS_CONFLICT` como variables globales para que el flujo principal tome decisiones.

**Secretos exclusivamente via variables de entorno**: A diferencia del script de seed de desarrollo, este script NO hardcodea credenciales. Todas las variables sensibles son requeridas como env vars.

### Variables de entorno

| Variable               | Requerida | Default               |
| ---------------------- | :-------: | --------------------- |
| `API_URL`              |    Si     | -                     |
| `SUPERADMIN_API_KEY`   |    Si     | -                     |
| `ADMIN_EMAIL`          |    Si     | -                     |
| `ADMIN_PASSWORD`       |    Si     | -                     |
| `TENANT_NAME`          |    No     | Pena El Tio Pepe      |
| `TENANT_CIF`           |    No     | B44021814             |
| `TENANT_TYPE`          |    No     | PENA                  |
| `TENANT_CONTACT_EMAIL` |    No     | contacto@eltiopepe.es |
| `ADMIN_NAME`           |    No     | Administrador         |

### Gotchas

- Requiere `jq` instalado ademas de `curl`.
- Las vinculaciones plan-tipo de socio solo se crean si los recursos son nuevos (no conflictos), porque necesitan los UUIDs reales de la respuesta de creacion.
- El password no se imprime en el resumen final por seguridad.

---

## 11. Script verificacion

**Archivo**: `scripts/verify-deploy.sh`
**Proposito**: 5 verificaciones automatizadas del estado del despliegue.

### Verificaciones

| ID  | Nombre                 |     Tipo     | Que verifica                                                         |
| --- | ---------------------- | :----------: | -------------------------------------------------------------------- |
| 6.1 | Build de imagenes      |    Local     | Que ambos Dockerfiles compilen sin errores                           |
| 6.2 | Smoke test             | Local/Remoto | Que migration salio 0, servicios healthy, health 200, SPA carga HTML |
| 6.3 | Aislamiento de puertos |    Remoto    | Que 5432 y 3000 NO son accesibles externamente; que 80 y 443 SI      |
| 6.4 | Restart automatico     |    Remoto    | Kill del contenedor API -> Docker lo reinicia -> vuelve a healthy    |
| 6.5 | Tamano de imagenes     |    Local     | API <= 400MB, Web <= 50MB                                            |

### Opciones

| Flag          | Efecto                                      |
| ------------- | ------------------------------------------- |
| `--local`     | Solo verificaciones locales (6.1, 6.5)      |
| `--remote`    | Solo verificaciones remotas (6.2, 6.3, 6.4) |
| `--check 6.3` | Solo una verificacion especifica            |

### Configuraciones clave

**Verificacion de puertos (6.3)**:

```bash
if timeout 3 bash -c "echo > /dev/tcp/${VPS_HOST}/5432" 2>/dev/null; then
  fail "Puerto 5432 ES ACCESIBLE desde fuera"
fi
```

Usa `/dev/tcp` de bash (no netcat) para verificar conectividad TCP. Si el puerto responde, es un fallo de seguridad critico.

**Restart automatico (6.4)**: Mata el contenedor API con `docker kill`, espera 15 segundos (politica `unless-stopped` de Docker), y verifica que el contenedor vuelve a estado `running` + `healthy`.

### Gotchas

- La verificacion 6.1 construye las imagenes localmente con tag `:verify`. Consume tiempo y disco.
- Las verificaciones remotas requieren acceso SSH al VPS.
- El script no puede trackear pass/fail de forma precisa en verificaciones remotas via SSH (los resultados se imprimen en la sesion remota).

---

## 12. Health endpoint

**Archivos**:

- `api/src/shared/infrastructure/health/health.controller.ts`
- `api/src/shared/infrastructure/health/health.module.ts`

**Proposito**: Endpoint `GET /api/v1/health` para monitoreo de infraestructura.

### Funcionamiento

```
GET /api/v1/health
  |
  v
HealthCheckService (Terminus)
  |
  v
checkDatabase()
  -> PrismaMainService.$queryRawUnsafe('SELECT 1')
  -> Si OK:  indicator.up('database')   -> 200 { status: "ok", info: { database: { status: "up" } } }
  -> Si falla: indicator.down('database') -> 503 { status: "error", ... }
```

### Configuraciones clave

**Decorator `@Public()`**: El health endpoint NO requiere autenticacion. Es necesario para que Docker HEALTHCHECK y nginx puedan verificar el estado sin JWT.

**Terminus v11+**: Usa `HealthIndicatorService` (nueva API de Terminus 11). En versiones anteriores se usaba `HealthIndicator` base class (deprecada).

**`PrismaMainService` inyectado globalmente**: No necesita ser importado en `HealthModule` porque `TenantCredentialsModule` (que provee `PrismaMainService`) esta decorado con `@Global()`.

### Consumidores

| Consumidor                       |  Frecuencia  | Uso                                       |
| -------------------------------- | :----------: | ----------------------------------------- |
| Docker HEALTHCHECK (api)         |   Cada 15s   | Restart automatico si falla 3 veces       |
| nginx upstream health            | Bajo demanda | Determinar si el backend esta disponible  |
| `scripts/deploy.sh`              | Post-deploy  | Verificacion de que el deploy fue exitoso |
| `scripts/verify-deploy.sh` (6.2) |    Manual    | Smoke test                                |

---

## 13. Init SQL PostgreSQL

**Archivo**: `docker/postgres/init.sql`
**Proposito**: Habilitar extensiones de PostgreSQL necesarias al crear el contenedor por primera vez.

### Extensiones

| Extension   | Uso                                                                 |
| ----------- | ------------------------------------------------------------------- |
| `uuid-ossp` | Generacion de UUIDs v4 (`uuid_generate_v4()`) para claves primarias |
| `pg_trgm`   | Busqueda por trigramas para busquedas fuzzy de nombres de socios    |
| `pgcrypto`  | Funciones criptograficas a nivel de base de datos                   |

### Gotchas

- El script se monta en `/docker-entrypoint-initdb.d/` con `:ro` (read-only). PostgreSQL lo ejecuta automaticamente SOLO en la primera inicializacion del volumen `pgdata`.
- Si el volumen ya existe (re-deploy), el script NO se vuelve a ejecutar. Para forzar la ejecucion, hay que eliminar el volumen (`docker compose down -v`).

---

## 14. Fix database provisioning

**Archivo**: `api/src/identity/infrastructure/services/database-provisioning.service.ts`
**Proposito**: Corregir la ruta de configuracion de Prisma para aprovisionamiento de tenants en produccion.

### El problema

El servicio de aprovisionamiento de bases de datos de tenant usaba `process.cwd()` para construir la ruta al archivo `prisma.config.ts`:

```typescript
// ANTES (roto en produccion)
const prismaConfigPath = resolve(process.cwd(), 'api', 'prisma', 'tenant', 'prisma.config.ts');
```

En desarrollo, `process.cwd()` apunta a la raiz del proyecto. En produccion (contenedor Docker), `process.cwd()` apunta a `/app`, pero la estructura de directorios es diferente y la ruta no se resuelve correctamente.

### La solucion

```typescript
// DESPUES (funciona en ambos entornos)
const prismaConfigPath = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'prisma',
  'tenant',
  'prisma.config.ts',
);
```

`__dirname` apunta al directorio del archivo compilado (`/app/api/dist/identity/infrastructure/services/`), que es estable tanto en desarrollo como en produccion. Navegando 4 niveles hacia arriba se llega a `/app/api/`, y desde ahi a `prisma/tenant/prisma.config.ts`.

### Gotchas

- Este fix es critico para que funcione el aprovisionamiento de nuevos tenants en produccion. Sin el, crear un nuevo tenant desde la API falla con "file not found".
- El numero de `..` (4 niveles) depende de la profundidad del archivo en la estructura de directorios. Si se mueve el servicio, hay que ajustar la ruta.

---

_[← 1. Arquitectura de Despliegue](01-architecture.md) | [↑ Indice](README-DEPLOY.md) | [3. Guia de Primer Despliegue →](03-initial-deploy.md) ->_
