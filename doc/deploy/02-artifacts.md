# 2. Artefactos Generados

<table>
  <tr>
    <td width="45%">
      ← Anterior<br/>
      <a href="01-architecture.md">1. Arquitectura de Despliegue</a>
    </td>
    <td width="10%" align="center">
      <a href="README.md">↑</a>
    </td>
    <td width="45%" align="right">
      Siguiente →<br/>
      <a href="03-initial-deploy.md">3. Guía de Primer Despliegue</a>
    </td>
  </tr>
</table>

---

Este documento detalla los 14 artefactos generados para el despliegue de producción. Cada sección explica el propósito, decisiones clave y gotchas de cada artefacto.

## Índice de artefactos

| #   | Artefacto                                                  | Ubicación                                                                   |
| :-- | :--------------------------------------------------------- | :-------------------------------------------------------------------------- |
| 1   | [Dockerfile API](#1-dockerfile-api)                        | `api/Dockerfile.prod`                                                       |
| 2   | [Dockerfile Web](#2-dockerfile-web)                        | `web/Dockerfile.prod`                                                       |
| 3   | [.dockerignore](#3-dockerignore)                           | `.dockerignore`                                                             |
| 4   | [nginx contenedor Web](#4-nginx-contenedor-web)            | `web/nginx.conf`                                                            |
| 5   | [nginx host (vhost)](#5-nginx-host-vhost)                  | `nginx/associated.conf`                                                     |
| 6   | [Docker Compose producción](#6-docker-compose-producción)  | `docker-compose.prod.yml`                                                   |
| 7   | [Variables de entorno](#7-variables-de-entorno)            | `.env.production.example`                                                   |
| 8   | [Script de despliegue](#8-script-de-despliegue)            | `scripts/deploy.sh`                                                         |
| 9   | [Script migración tenants](#9-script-migración-tenants)    | `scripts/migrate-tenants.sh`                                                |
| 10  | [Script seed producción](#10-script-seed-producción)       | `scripts/seed-production.sh`                                                |
| 11  | [Script verificación](#11-script-verificación)             | `scripts/verify-deploy.sh`                                                  |
| 12  | [Health endpoint](#12-health-endpoint)                     | `api/src/shared/infrastructure/health/`                                     |
| 13  | [Init SQL PostgreSQL](#13-init-sql-postgresql)             | `docker/postgres/init.sql`                                                  |
| 14  | [Fix database provisioning](#14-fix-database-provisioning) | `api/src/identity/infrastructure/services/database-provisioning.service.ts` |

---

## 1. Dockerfile API

**Archivo**: `api/Dockerfile.prod`
**Propósito**: Construir la imagen de producción de la API NestJS en 3 etapas.

### Etapas del multi-stage build

```mermaid
graph LR
    subgraph "Etapa 1 - deps"
        D1["node:22-slim"]
        D2["npm ci (todo)"]
        D3["prisma generate"]
        D4["openssl install"]
        D1 --> D2 --> D3 --> D4
    end

    subgraph "Etapa 2 - build"
        B1["hereda de deps"]
        B2["nest build<br/><em>TypeScript → JS</em>"]
        B1 --> B2
    end

    subgraph "Etapa 3 - production"
        P1["node:22-slim limpio"]
        P2["npm ci (--omit=dev)"]
        P3["COPY dist desde build"]
        P4["COPY prisma desde deps"]
        P5["tini + psql + curl"]
        P6["usuario appuser (1001)"]
        P1 --> P2 --> P3 --> P4 --> P5 --> P6
    end

    D4 -.-> B1
    B2 -.-> P3

    style D1 fill:#27343E,stroke:#1A2329,color:#fff
    style P1 fill:#27343E,stroke:#1A2329,color:#fff
    style P6 fill:#5B7682,stroke:#3D5E6C,color:#fff
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

**Tini como init process**: Node.js no maneja correctamente señales POSIX (SIGTERM, SIGINT) cuando corre como PID 1 en un contenedor. Tini actúa como proceso init, reenviando señales y cosechando procesos zombi.

**postgresql-client en producción**: El contenedor API también sirve como imagen base para el contenedor `migration`, que necesita `psql` para consultar la tabla de tenants.

**`TS_NODE_PROJECT=/app/api/tsconfig.json`**: NestJS usa `tsconfig-paths` en runtime para resolver aliases de path (`@shared/`, etc.). Sin esta variable, Node.js no encuentra el `tsconfig.json` y los imports con alias fallan en producción.

**`chmod -R 777 ./node_modules/@prisma/engines`**: Cuando la API provisiona un nuevo tenant en runtime, Prisma necesita escribir en el directorio de engines. Sin estos permisos, el aprovisionamiento falla con EACCES.

**Usuario non-root (appuser, UID 1001)**: La aplicación corre como usuario sin privilegios por seguridad. El grupo `appgroup` (GID 1001) se crea explícitamente para evitar conflictos con grupos existentes.

### Gotchas

> [!WARNING]
>
> - La etapa `build` hereda de `deps` (no de una imagen limpia). Esto reutiliza el `node_modules` completo con devDependencies, necesario para `nest build`.
> - La etapa `production` hace un segundo `npm ci --omit=dev` con una imagen limpia. No reutiliza el `node_modules` de `deps` porque contiene devDependencies.
> - El `COPY api/tsconfig.json ./api/` en producción NO es para compilación (ya está compilado). Es para la resolución de path aliases en runtime vía `tsconfig-paths/register`.

---

## 2. Dockerfile Web

**Archivo**: `web/Dockerfile.prod`
**Propósito**: Construir la SPA React y servirla con nginx.

### Etapas del multi-stage build

```mermaid
graph LR
    subgraph "Etapa 1 - build"
        B1["node:22-slim"]
        B2["npm ci"]
        B3["vite build<br/><em>~15 MB de assets</em>"]
        B1 --> B2 --> B3
    end

    subgraph "Etapa 2 - production"
        P1["nginx:1.27-alpine"]
        P2["COPY dist →<br/>/usr/share/nginx/html"]
        P3["COPY nginx.conf"]
        P4["curl (healthcheck)"]
        P1 --> P2 --> P3 --> P4
    end

    B3 -.-> P2

    style B1 fill:#27343E,stroke:#1A2329,color:#fff
    style P1 fill:#27343E,stroke:#1A2329,color:#fff
    style P4 fill:#5B7682,stroke:#3D5E6C,color:#fff
```

### Configuraciones clave

**`ARG VITE_API_URL=/api`**: Define la URL base del API que se inyecta en el bundle de Vite. El valor por defecto `/api` funciona con el reverse proxy de nginx del host, que redirige `/api/*` al contenedor API. Se puede sobreescribir en build time con `--build-arg VITE_API_URL=...`.

**Sin `tsc` en el build**: Vite usa esbuild para la compilación, que es significativamente más rápido que `tsc`. La verificación de tipos se hace en CI (quality gates), no en el build de producción.

**nginx:1.27-alpine como imagen base**: Alpine reduce la imagen final a ~50 MB. nginx 1.27 es la versión LTS actual.

**curl para healthcheck**: Alpine no trae `curl` por defecto. Se instala únicamente para que Docker pueda verificar el health del contenedor vía `curl -f http://localhost:8080/healthz`.

### Gotchas

> [!WARNING]
>
> - El build context es la **raíz del monorepo** (no `web/`), porque `npm ci --workspace=web` necesita el `package-lock.json` raíz.
> - No se copia `web/postcss.config.mjs` - se copia `web/postcss.config.cjs`. Verificar el nombre exacto del archivo si cambia.

---

## 3. .dockerignore

**Archivo**: `.dockerignore`
**Propósito**: Reducir el contexto de build excluyendo archivos innecesarios.

### Exclusiones principales

| Patrón                                      | Justificación                                                    |
| :------------------------------------------ | :--------------------------------------------------------------- |
| `node_modules`, `**/node_modules`           | Se instalan dentro del contenedor con `npm ci`                   |
| `dist`, `**/dist`                           | Se generan dentro del contenedor con `nest build` / `vite build` |
| `.git`                                      | No necesario en el contenedor; reduce contexto ~100 MB+          |
| `e2e`, `**/*.spec.ts`                       | Tests no se ejecutan en producción                               |
| `doc`, `spec`, `*.md`                       | Documentación no va al contenedor                                |
| `.env`, `.env.*`                            | Secretos nunca en la imagen                                      |
| `!.env.example`, `!.env.production.example` | Excepción: los examples sí se copian si hiciera falta            |

**Impacto**: Sin `.dockerignore`, el contexto de build incluiría ~500 MB+ (node_modules, .git, tests). Con el archivo, se reduce a ~20–30 MB, acelerando significativamente el build.

---

## 4. nginx contenedor Web

**Archivo**: `web/nginx.conf`
**Propósito**: Servir la SPA React con enrutamiento client-side dentro del contenedor Docker.

### Configuraciones clave

**SPA fallback (`try_files`)**: Cuando React Router navega a `/members/123`, el navegador solicita esa ruta al servidor. Sin este fallback, nginx devolvería 404. Con `try_files`, si no existe un archivo estático en esa ruta, sirve `index.html` y React Router maneja la ruta client-side.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Cache inmutable para assets**: Vite genera assets con hash en el nombre (`main.a1b2c3d4.js`). Si el contenido cambia, el hash cambia y el navegador descarga el nuevo archivo. Por eso se puede cachear agresivamente (1 año, inmutable).

```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Gzip**: Comprime text, CSS, JS y JSON en tránsito. Nivel 6 es un buen equilibrio entre ratio de compresión y uso de CPU.

**Healthcheck endpoint (`/healthz`)**: Endpoint sintético que devuelve 200 sin tocar el filesystem. `access_log off` evita contaminar los logs con checks cada 15 segundos.

**Puerto 8080**: nginx en el contenedor escucha en 8080 (no 80) para evitar conflictos con nginx del host y porque no se necesita el privilegio de puertos < 1024.

---

## 5. nginx host (vhost)

**Archivo**: `nginx/associated.conf`
**Ubicación en VPS**: `/etc/nginx/sites-available/associated.conf`
**Propósito**: Reverse proxy con terminación SSL, redirección HTTP→HTTPS y cabeceras de seguridad.

### Configuraciones clave

**HTTP/2 con sintaxis legacy**: Ubuntu 24.04 incluye nginx 1.24, que usa `http2` en la directiva `listen`. nginx 1.25+ cambió a `http2 on;` como directiva separada. Si se actualiza nginx en el VPS, hay que cambiar la sintaxis.

```nginx
listen 443 ssl http2;
```

**Redirección HTTP → HTTPS**: Todo el tráfico HTTP se redirige permanentemente (301) a HTTPS. La excepción es `/.well-known/acme-challenge/` para renovación de certificados con certbot.

**Proxy a API y Web**: Las peticiones con prefijo `/api/` van al contenedor NestJS. Todo lo demás va al contenedor nginx/SPA. El orden importa: nginx evalúa `location` de más específica a menos específica.

**Cabeceras de proxy**: Estas cabeceras permiten que NestJS conozca la IP real del cliente y el protocolo original (HTTPS), ya que la conexión entre nginx y el contenedor es HTTP plano.

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**WebSocket preparado** (para futuras funcionalidades):

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Content-Security-Policy**: Restrictiva: solo permite recursos del mismo origen. `unsafe-inline` en `style-src` es necesario porque Mantine inyecta estilos inline.

### Gotchas

> [!WARNING]
>
> - La variable `${DOMAIN}` en el archivo debe reemplazarse por el dominio real antes de activarlo en el VPS.
> - Los certificados SSL se esperan en `/etc/ssl/associated/fullchain.pem` y `/etc/ssl/associated/privkey.pem`.
> - `proxy_buffering off` en la ruta `/api/` evita buffering de respuestas, lo que es importante si en el futuro se implementan Server-Sent Events (SSE).

---

## 6. Docker Compose producción

**Archivo**: `docker-compose.prod.yml`
**Propósito**: Orquestar los 4 servicios de producción con dependencias, health checks y límites de recursos.

### Servicios

<details>
<summary><strong>postgres</strong></summary>

- **Imagen**: `postgres:18-alpine`
- **Volumen**: `pgdata` (persistencia de datos)
- **Init SQL**: `./docker/postgres/init.sql` (extensiones uuid-ossp, pg_trgm, pgcrypto)
- **Tuning de memoria**: Vía `command:` con flags de PostgreSQL
- **Health check**: `pg_isready` cada 10s, 5 reintentos, 30s de start period

</details>

<details>
<summary><strong>migration (one-shot)</strong></summary>

- **Imagen**: Misma que API (`ghcr.io/.../associated-api:latest`)
- **Usuario**: `root` (necesita escribir en prisma engines)
- **Entrypoint override**: Ejecuta `prisma migrate deploy` para main DB y luego `migrate-tenants.sh` para todos los tenants
- **Restart**: `no` (se ejecuta una vez y sale)
- **Depende de**: postgres `service_healthy`

</details>

<details>
<summary><strong>api</strong></summary>

- **Imagen**: `ghcr.io/appassociated-dev/associated-api:latest`
- **Health check**: `curl -f http://localhost:3000/api/v1/health` cada 15s
- **Depende de**: migration `service_completed_successfully` + postgres `service_healthy`
- **Variables**: Recibe 12+ variables de entorno desde `.env`

</details>

<details>
<summary><strong>web</strong></summary>

- **Imagen**: `ghcr.io/appassociated-dev/associated-web:latest`
- **Health check**: `curl -f http://localhost:8080/healthz` cada 15s
- **Depende de**: api `service_healthy`

</details>

### Configuraciones clave

**Puertos solo locales**: El bind a `127.0.0.1` es CRÍTICO. Sin el prefijo, Docker expone el puerto en `0.0.0.0` (todas las interfaces), saltándose el firewall del host.

```yaml
ports:
  - '127.0.0.1:3000:3000'
```

**Cadena de dependencias explícita**: Docker Compose V2 soporta `service_completed_successfully` para contenedores one-shot. Esto garantiza que las migraciones se completan ANTES de que la API arranque.

```yaml
depends_on:
  migration:
    condition: service_completed_successfully
```

**Logging con rotación**: Aplicado a todos los servicios. Máximo 30 MB de logs por servicio.

```yaml
logging:
  driver: json-file
  options:
    max-size: '10m'
    max-file: '3'
```

### Gotchas

> [!WARNING]
>
> - El archivo NO incluye la build de imágenes (`build:` no está definido). Las imágenes se construyen localmente y se pushean a GHCR. El compose solo hace `pull`.
> - Se usa `--env-file .env` explícitamente al ejecutar compose. Las variables NO están hardcodeadas.
> - El servicio `migration` usa la misma imagen que `api` pero con `entrypoint` y `command` sobreescritos.

---

## 7. Variables de entorno

**Archivo**: `.env.production.example`
**Propósito**: Plantilla documentada de las 18+ variables de entorno necesarias en producción.

### Variables críticas

| Variable             | Generación                | Notas                                                       |
| :------------------- | :------------------------ | :---------------------------------------------------------- |
| `POSTGRES_PASSWORD`  | `openssl rand -hex 24`    | Hex para evitar caracteres especiales en la URL de conexión |
| `JWT_SECRET`         | `openssl rand -base64 48` | Mínimo 32 caracteres                                        |
| `ENCRYPTION_KEY`     | `openssl rand -hex 32`    | EXACTAMENTE 64 caracteres hex (256 bits para AES-256)       |
| `SUPERADMIN_API_KEY` | `openssl rand -base64 32` | Clave para el endpoint de aprovisionamiento de tenants      |

### Coherencia entre variables

`DATABASE_MAIN_URL` y `DATABASE_TENANT_URL` deben usar los MISMOS valores de `POSTGRES_USER` y `POSTGRES_PASSWORD`. El host dentro de Docker es `postgres` (nombre del servicio), no `localhost`:

```
DATABASE_MAIN_URL=postgresql://associated:MI_PASSWORD@postgres:5432/associated_main?schema=public
```

### Gotchas

> [!CAUTION]
>
> - `ENCRYPTION_KEY` debe tener **exactamente** 64 caracteres hexadecimales. Si tiene más o menos, el cifrado AES-256 falla.
> - No usar `-base64` para `POSTGRES_PASSWORD` porque puede generar caracteres como `+`, `/` o `=` que rompen la URL de conexión.

> [!NOTE]
>
> - `TENANT_POOL_MAX_SIZE` y `TENANT_POOL_EVICTION_MS` son opcionales. Los valores por defecto (10 conexiones, 5 min eviction) son adecuados para la mayoría de instalaciones.
> - `SENTRY_DSN` es opcional. Si se omite o se deja vacío, Sentry no se activa.

---

## 8. Script de despliegue

**Archivo**: `scripts/deploy.sh`
**Propósito**: Flujo completo de build, push y deploy en un solo comando.

### Flujo de ejecución

```mermaid
graph LR
    A["Validaciones"] --> B["Confirmación<br/>interactiva"]
    B --> C["Build<br/><em>API + Web</em>"]
    C --> D["Push<br/><em>GHCR</em>"]
    D --> E["SSH deploy"]
    E --> F["Verificación"]

    style A fill:#27343E,stroke:#1A2329,color:#fff
    style B fill:#3D5E6C,stroke:#27343E,color:#fff
    style C fill:#5B7682,stroke:#3D5E6C,color:#fff
    style D fill:#5B7682,stroke:#3D5E6C,color:#fff
    style E fill:#7A939E,stroke:#708C99,color:#fff
    style F fill:#8CA1AA,stroke:#7A939E,color:#fff
```

### Opciones

| Flag           | Efecto                                                                   |
| :------------- | :----------------------------------------------------------------------- |
| `--tag v1.0.0` | Usa un tag específico en lugar de `latest`. También taggea como `latest` |
| `--build-only` | Solo construye y sube imágenes, no ejecuta deploy en VPS                 |
| `--help`       | Muestra la ayuda                                                         |

### Variables de entorno

| Variable   |          Requerida          | Default | Propósito             |
| :--------- | :-------------------------: | :------ | :-------------------- |
| `VPS_HOST` | Sí (excepto `--build-only`) | -       | IP o hostname del VPS |
| `VPS_USER` |             No              | `root`  | Usuario SSH           |

### Configuraciones clave

**Verificación de autenticación GHCR**: El script verifica que `~/.docker/config.json` contenga credenciales para `ghcr.io` antes de intentar push.

**Doble tagging**: Cuando se usa `--tag v1.0.0`, la imagen también se taggea como `latest`. Esto permite que el compose del VPS (que referencia `latest`) siempre descargue la versión más reciente.

**Deploy remoto vía heredoc**: El script se ejecuta en el VPS vía SSH. Los comandos se encapsulan en un heredoc para ejecutarlos en una sola conexión SSH.

**Verificación post-deploy**: Espera 10 segundos y verifica health checks de API y Web remotamente.

### Gotchas

> [!WARNING]
>
> - El script requiere confirmación interactiva (`¿Continuar con el despliegue? [y/N]`). No es adecuado para CI/CD automatizado sin modificación.
> - El `docker compose down` detiene TODOS los servicios antes de levantar con las nuevas imágenes. Hay un breve downtime durante el deploy.
> - El alias SSH `vps-associated` no se usa en el script. Se usa `${VPS_USER}@${VPS_HOST}` directamente.

---

## 9. Script migración tenants

**Archivo**: `scripts/migrate-tenants.sh`
**Propósito**: Ejecutar `prisma migrate deploy` en todas las bases de datos de tenant.

### Flujo

```mermaid
graph TD
    A["Leer DATABASE_MAIN_URL"] --> B["Limpiar ?schema=public<br/><em>psql no lo entiende</em>"]
    B --> C["SELECT database_name<br/>FROM tenants"]
    C --> D{"¿Hay tenants?"}
    D -- No --> E["Exit 0"]
    D -- Sí --> F["Para cada tenant"]
    F --> G["Construir URL de conexión"]
    G --> H["prisma migrate deploy"]
    H --> I{"¿Éxito?"}
    I -- Sí --> J["Registrar OK"]
    I -- No --> K["Registrar error,<br/>continuar con siguiente"]
    J --> L{"¿Más tenants?"}
    K --> L
    L -- Sí --> F
    L -- No --> M["Resumen:<br/>exitosos / fallidos"]

    style A fill:#27343E,stroke:#1A2329,color:#fff
    style E fill:#5B7682,stroke:#3D5E6C,color:#fff
    style M fill:#5B7682,stroke:#3D5E6C,color:#fff
```

### Configuraciones clave

**Limpieza de URL para psql**: Prisma usa URLs con `?schema=public`. `psql` no entiende ese parámetro y falla. Se elimina todo después de `?`.

**Construcción de URL por tenant**: Extrae la base de la URL (protocolo + credenciales + host:puerto) y la combina con el nombre de la base de datos de cada tenant.

**Continue-on-failure**: Si un tenant falla, el script registra el error y continúa con el siguiente. Al final reporta cuántos fallaron. Sale con código 1 si hubo fallos, pero no interrumpe el despliegue de los tenants restantes.

### Gotchas

> [!NOTE]
>
> - El script requiere `postgresql-client` instalado en el contenedor (incluido en `api/Dockerfile.prod`).
> - El contenedor `migration` corre como `root` porque necesita escribir en el directorio de prisma engines.
> - Si no hay tenants en la tabla, el script sale con código 0 (éxito). Esto es normal en el primer despliegue.

---

## 10. Script seed producción

**Archivo**: `scripts/seed-production.sh`
**Propósito**: Crear datos iniciales en producción (tenant, admin, tipos de socio, planes de cuota, ejercicio fiscal).

### Datos creados

1. **Tenant** con nombre, CIF y tipo de colectividad configurables
2. **Usuario admin** con email y password proporcionados
3. **3 tipos de socio**: Adulto (18+), Juvenil (14–17), Infantil (0–13)
4. **4 planes de cuota**: Mensual (15 EUR), Trimestral (40 EUR), Anual (120 EUR), Inscripción (50 EUR)
5. **Ejercicio fiscal 2026**
6. **Vinculaciones** plan-tipo de socio

### Configuraciones clave

**Idempotencia vía HTTP 409**: Cada llamada a la API que crea un recurso maneja el código 409 (Conflict) como "ya existe, continuar". Esto permite re-ejecutar el script sin errores.

**Función `api_post` centralizada**: Encapsula la lógica de curl + manejo de errores + idempotencia. Registra `LAST_HTTP_STATUS` y `LAST_WAS_CONFLICT` como variables globales para que el flujo principal tome decisiones.

**Secretos exclusivamente vía variables de entorno**: A diferencia del script de seed de desarrollo, este script NO hardcodea credenciales. Todas las variables sensibles son requeridas como env vars.

### Variables de entorno

| Variable               | Requerida | Default               |
| :--------------------- | :-------: | :-------------------- |
| `API_URL`              |    Sí     | -                     |
| `SUPERADMIN_API_KEY`   |    Sí     | -                     |
| `ADMIN_EMAIL`          |    Sí     | -                     |
| `ADMIN_PASSWORD`       |    Sí     | -                     |
| `TENANT_NAME`          |    No     | Peña El Tío Pepe      |
| `TENANT_CIF`           |    No     | B44021814             |
| `TENANT_TYPE`          |    No     | PENA                  |
| `TENANT_CONTACT_EMAIL` |    No     | contacto@eltiopepe.es |
| `ADMIN_NAME`           |    No     | Administrador         |

### Gotchas

> [!WARNING]
>
> - Requiere `jq` instalado además de `curl`.
> - Las vinculaciones plan-tipo de socio solo se crean si los recursos son nuevos (no conflictos), porque necesitan los UUIDs reales de la respuesta de creación.
> - El password no se imprime en el resumen final por seguridad.

---

## 11. Script verificación

**Archivo**: `scripts/verify-deploy.sh`
**Propósito**: 5 verificaciones automatizadas del estado del despliegue.

### Verificaciones

| ID  | Nombre                 |     Tipo     | Qué verifica                                                         |
| :-- | :--------------------- | :----------: | :------------------------------------------------------------------- |
| 6.1 | Build de imágenes      |    Local     | Que ambos Dockerfiles compilen sin errores                           |
| 6.2 | Smoke test             | Local/Remoto | Que migration salió 0, servicios healthy, health 200, SPA carga HTML |
| 6.3 | Aislamiento de puertos |    Remoto    | Que 5432 y 3000 NO son accesibles externamente; que 80 y 443 SÍ      |
| 6.4 | Restart automático     |    Remoto    | Kill del contenedor API → Docker lo reinicia → vuelve a healthy      |
| 6.5 | Tamaño de imágenes     |    Local     | API ≤ 400 MB, Web ≤ 50 MB                                            |

### Opciones

| Flag          | Efecto                                      |
| :------------ | :------------------------------------------ |
| `--local`     | Solo verificaciones locales (6.1, 6.5)      |
| `--remote`    | Solo verificaciones remotas (6.2, 6.3, 6.4) |
| `--check 6.3` | Solo una verificación específica            |

### Configuraciones clave

**Verificación de puertos (6.3)**: Usa `/dev/tcp` de bash (no netcat) para verificar conectividad TCP. Si el puerto responde, es un fallo de seguridad crítico.

**Restart automático (6.4)**: Mata el contenedor API con `docker kill`, espera 15 segundos (política `unless-stopped` de Docker), y verifica que el contenedor vuelve a estado `running` + `healthy`.

### Gotchas

> [!NOTE]
>
> - La verificación 6.1 construye las imágenes localmente con tag `:verify`. Consume tiempo y disco.
> - Las verificaciones remotas requieren acceso SSH al VPS.
> - El script no puede trackear pass/fail de forma precisa en verificaciones remotas vía SSH (los resultados se imprimen en la sesión remota).

---

## 12. Health endpoint

**Archivos**:

- `api/src/shared/infrastructure/health/health.controller.ts`
- `api/src/shared/infrastructure/health/health.module.ts`

**Propósito**: Endpoint `GET /api/v1/health` para monitoreo de infraestructura.

### Funcionamiento

```mermaid
graph LR
    REQ["GET /api/v1/health"] --> HC["HealthCheckService<br/><em>Terminus</em>"]
    HC --> CDB["checkDatabase()"]
    CDB --> PMS["PrismaMainService<br/>SELECT 1"]
    PMS --> OK{"¿OK?"}
    OK -- Sí --> UP["200<br/>status: ok<br/>database: up"]
    OK -- No --> DOWN["503<br/>status: error<br/>database: down"]

    style REQ fill:#27343E,stroke:#1A2329,color:#fff
    style UP fill:#5B7682,stroke:#3D5E6C,color:#fff
    style DOWN fill:#8CA1AA,stroke:#7A939E,color:#fff
```

### Configuraciones clave

**Decorator `@Public()`**: El health endpoint NO requiere autenticación. Es necesario para que Docker HEALTHCHECK y nginx puedan verificar el estado sin JWT.

**Terminus v11+**: Usa `HealthIndicatorService` (nueva API de Terminus 11). En versiones anteriores se usaba `HealthIndicator` base class (deprecada).

**`PrismaMainService` inyectado globalmente**: No necesita ser importado en `HealthModule` porque `TenantCredentialsModule` (que provee `PrismaMainService`) está decorado con `@Global()`.

### Consumidores

| Consumidor                       |  Frecuencia  | Uso                                       |
| :------------------------------- | :----------: | :---------------------------------------- |
| Docker HEALTHCHECK (api)         |   Cada 15s   | Restart automático si falla 3 veces       |
| nginx upstream health            | Bajo demanda | Determinar si el backend está disponible  |
| `scripts/deploy.sh`              | Post-deploy  | Verificación de que el deploy fue exitoso |
| `scripts/verify-deploy.sh` (6.2) |    Manual    | Smoke test                                |

---

## 13. Init SQL PostgreSQL

**Archivo**: `docker/postgres/init.sql`
**Propósito**: Habilitar extensiones de PostgreSQL necesarias al crear el contenedor por primera vez.

### Extensiones

| Extensión   | Uso                                                                 |
| :---------- | :------------------------------------------------------------------ |
| `uuid-ossp` | Generación de UUIDs v4 (`uuid_generate_v4()`) para claves primarias |
| `pg_trgm`   | Búsqueda por trigramas para búsquedas fuzzy de nombres de socios    |
| `pgcrypto`  | Funciones criptográficas a nivel de base de datos                   |

### Gotchas

> [!IMPORTANT]
>
> - El script se monta en `/docker-entrypoint-initdb.d/` con `:ro` (read-only). PostgreSQL lo ejecuta automáticamente SOLO en la primera inicialización del volumen `pgdata`.
> - Si el volumen ya existe (re-deploy), el script NO se vuelve a ejecutar. Para forzar la ejecución, hay que eliminar el volumen (`docker compose down -v`).

---

## 14. Fix database provisioning

**Archivo**: `api/src/identity/infrastructure/services/database-provisioning.service.ts`
**Propósito**: Corregir la ruta de configuración de Prisma para aprovisionamiento de tenants en producción.

### El problema

El servicio de aprovisionamiento de bases de datos de tenant usaba `process.cwd()` para construir la ruta al archivo `prisma.config.ts`:

```typescript
// ANTES (roto en producción)
const prismaConfigPath = resolve(process.cwd(), 'api', 'prisma', 'tenant', 'prisma.config.ts');
```

En desarrollo, `process.cwd()` apunta a la raíz del proyecto. En producción (contenedor Docker), `process.cwd()` apunta a `/app`, pero la estructura de directorios es diferente y la ruta no se resuelve correctamente.

### La solución

```typescript
// DESPUÉS (funciona en ambos entornos)
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

`__dirname` apunta al directorio del archivo compilado (`/app/api/dist/identity/infrastructure/services/`), que es estable tanto en desarrollo como en producción. Navegando 4 niveles hacia arriba se llega a `/app/api/`, y desde ahí a `prisma/tenant/prisma.config.ts`.

### Gotchas

> [!CAUTION]
>
> - Este fix es crítico para que funcione el aprovisionamiento de nuevos tenants en producción. Sin él, crear un nuevo tenant desde la API falla con "file not found".
> - El número de `..` (4 niveles) depende de la profundidad del archivo en la estructura de directorios. Si se mueve el servicio, hay que ajustar la ruta.

---

<table>
  <tr>
    <td width="45%">
      ← Anterior<br/>
      <a href="01-architecture.md">1. Arquitectura de Despliegue</a>
    </td>
    <td width="10%" align="center">
      <a href="README.md">↑</a>
    </td>
    <td width="45%" align="right">
      Siguiente →<br/>
      <a href="03-initial-deploy.md">3. Guía de Primer Despliegue</a>
    </td>
  </tr>
</table>
