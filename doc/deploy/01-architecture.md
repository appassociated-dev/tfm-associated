# 01 - Arquitectura de Despliegue

_[↑ Indice](README-DEPLOY.md) | [Artefactos Generados →](02-artifacts.md)_

---

## 1. Diagrama de arquitectura

```
                         Internet
                            |
                     [ Firewall VPS ]
                     (puertos 80, 443)
                            |
                +-----------+-----------+
                |   nginx (HOST)        |
                |   Ubuntu 24.04        |
                |   - SSL termination   |
                |   - HTTP -> HTTPS     |
                |   - Security headers  |
                |   - HSTS, CSP, etc.   |
                +-----------+-----------+
                    |               |
              /api/*             /*
                    |               |
             127.0.0.1:3000   127.0.0.1:8080
                    |               |
         +------ Docker Bridge Network (associated-net) ------+
         |          |               |                          |
         |  +-------+-------+  +---+--------+                 |
         |  | api           |  | web        |                 |
         |  | NestJS 11     |  | nginx:1.27 |                 |
         |  | node:22-slim  |  | alpine     |                 |
         |  | + tini        |  | SPA static |                 |
         |  | + psql client |  | assets     |                 |
         |  | Port 3000     |  | Port 8080  |                 |
         |  | 1GB limit     |  | 256MB limit|                 |
         |  +-------+-------+  +------------+                 |
         |          |                                          |
         |  +-------+-------+                                  |
         |  | postgres      |                                  |
         |  | 18-alpine     |                                  |
         |  | Port 5432     |                                  |
         |  | (solo local)  |                                  |
         |  | 1GB limit     |                                  |
         |  | pgdata volume |                                  |
         |  +---------------+                                  |
         |                                                     |
         |  +---------------+                                  |
         |  | migration     |  (one-shot, sale con codigo 0)  |
         |  | Usa imagen API|                                  |
         |  | root user     |                                  |
         |  | prisma migrate|                                  |
         |  +---------------+                                  |
         +-----------------------------------------------------+
```

### Flujo de una peticion

1. El navegador solicita `https://associated.ipgsoft.com/api/v1/members`
2. nginx del host recibe en puerto 443, termina SSL
3. Detecta prefijo `/api/` y hace `proxy_pass` a `127.0.0.1:3000`
4. El contenedor `api` procesa la peticion NestJS
5. NestJS consulta PostgreSQL a traves de la red Docker interna
6. La respuesta viaja el camino inverso, cifrada via TLS al navegador

Para rutas sin prefijo `/api/` (la SPA):

1. nginx del host hace `proxy_pass` a `127.0.0.1:8080`
2. El contenedor `web` (nginx interno) sirve los assets estaticos
3. Para rutas client-side, `try_files` cae a `/index.html` (SPA fallback)

---

## 2. Decisiones de arquitectura

### 2.1 nginx en el host vs. nginx en Docker

| Criterio                    |             nginx en host             |            nginx en Docker             |
| --------------------------- | :-----------------------------------: | :------------------------------------: |
| Gestion de certificados SSL | Directa, sin volumenes ni bind mounts |  Requiere montar certs como volumenes  |
| Renovacion certbot          |       Nativa con systemd timer        | Requiere contenedor adicional o script |
| Debugging                   |     Acceso directo a logs del SO      |         Requiere `docker logs`         |
| Complejidad                 |      Menor para un solo servicio      |           Mayor orquestacion           |

**Decision**: nginx en el **host** para terminacion SSL. El certificado SSL es propio del usuario (no Let's Encrypt automatizado), y meterlo en Docker agrega complejidad innecesaria para un TFM. Certbot en el host puede renovar sin tocar contenedores.

### 2.2 GHCR vs. docker save/load

| Criterio       |               GHCR               |       docker save + scp       |
| -------------- | :------------------------------: | :---------------------------: |
| Transferencia  | Incremental (solo layers nuevos) | Completa (~300MB+ por imagen) |
| Automatizacion |       `docker pull` nativo       |   scp + docker load manual    |
| Versionado     |    Tags inmutables por digest    |     Sin versionado nativo     |
| Costo          |  Gratis para repos publicos/org  |    Solo ancho de banda SSH    |
| Dependencia    |      Requiere GitHub y red       |       Funciona offline        |

**Decision**: **GHCR** para distribucion de imagenes. Las pulls incrementales ahorran tiempo y ancho de banda en cada despliegue. Solo se transfieren los layers que cambiaron. Para un TFM donde se hacen multiples despliegues iterativos, la diferencia es significativa.

**Alternativa descartada**: El usuario propuso inicialmente empaquetar imagenes como `.tar.gz` con `docker save` y subirlas via `scp`. Se descarto porque cada despliegue transferiria ~500MB+ completos, mientras que GHCR solo transfiere los layers modificados (~50-100MB tipicamente).

### 2.3 Contenedor one-shot para migraciones vs. migracion en entrypoint

| Criterio                        |         One-shot container          |        Migracion en entrypoint API        |
| ------------------------------- | :---------------------------------: | :---------------------------------------: |
| Separacion de responsabilidades |         Clara: migra y sale         |       Mezcla arranque con migracion       |
| Rollback                        | Independiente del ciclo de vida API | Si falla, API no arranca (o arranca rota) |
| Visibilidad                     |     Exit code explicito (0 o 1)     |         Log mezclado con arranque         |
| Permisos                        |       Puede correr como root        |         API deberia ser non-root          |

**Decision**: Contenedor **one-shot** (`migration`) que ejecuta `prisma migrate deploy` para la BD principal y luego itera todos los tenants via `migrate-tenants.sh`. El contenedor API depende de que `migration` termine exitosamente (`condition: service_completed_successfully`).

### 2.4 Multi-servicio vs. contenedor unico

| Criterio               | Multi-servicio (4 containers) |   Monolito (1 container)   |
| ---------------------- | :---------------------------: | :------------------------: |
| Escalado independiente |              Si               |             No             |
| Aislamiento de fallos  |   Si (web sigue si API cae)   |             No             |
| Uso de recursos        |   Controlable por servicio    |         Compartido         |
| Complejidad            |      Mayor orquestacion       | Menor, pero menos flexible |

**Decision**: **Multi-servicio** con 4 contenedores (postgres, migration, api, web). Cada componente tiene su propio ciclo de vida, limites de recursos y politica de restart.

---

## 3. Topologia de red

### Puertos expuestos

Todos los puertos de contenedores se bindean exclusivamente a `127.0.0.1`:

| Servicio     | Puerto contenedor |  Bind en host  | Accesible externamente |
| ------------ | :---------------: | :------------: | :--------------------: |
| postgres     |       5432        | 127.0.0.1:5432 |           NO           |
| api          |       3000        | 127.0.0.1:3000 |     NO (via nginx)     |
| web          |       8080        | 127.0.0.1:8080 |     NO (via nginx)     |
| nginx (host) |        80         |   0.0.0.0:80   |  SI (redirect a 443)   |
| nginx (host) |        443        |  0.0.0.0:443   |        SI (SSL)        |

El patron `127.0.0.1:PUERTO:PUERTO` en Docker Compose garantiza que los contenedores solo son accesibles desde el propio host. El trafico externo pasa obligatoriamente por nginx del host, que agrega SSL, cabeceras de seguridad y proxy headers.

### Red Docker interna

Todos los contenedores comparten la red bridge `associated-net`. La comunicacion entre contenedores se hace por nombre de servicio DNS:

- API conecta a `postgres:5432`
- Migration conecta a `postgres:5432`
- Web no necesita conectar a otros contenedores (solo sirve assets estaticos)

---

## 4. Modelo de seguridad

### 4.1 Principio de menor privilegio en contenedores

| Contenedor | Usuario            | `cap_drop` |                   `cap_add`                    | Justificacion                                                                       |
| ---------- | ------------------ | :--------: | :--------------------------------------------: | ----------------------------------------------------------------------------------- |
| postgres   | postgres (interno) |    ALL     | CHOWN, FOWNER, SETGID, SETUID, DAC_READ_SEARCH | PostgreSQL necesita cambiar permisos de archivos en `pgdata` durante inicializacion |
| migration  | root               |     -      |                       -                        | Necesita escribir en `node_modules/@prisma/engines` para ejecutar migraciones       |
| api        | appuser (UID 1001) |    ALL     |                   (ninguno)                    | No necesita ninguna capability. Maxima restriccion                                  |
| web        | nginx (interno)    |    ALL     |             CHOWN, SETGID, SETUID              | nginx necesita cambiar ownership de archivos en su ciclo de arranque                |

Todos los contenedores tienen `security_opt: no-new-privileges:true`, que impide escalar privilegios via `setuid` binaries.

### 4.2 SSL y cabeceras de seguridad

El vhost nginx del host implementa:

- **TLS 1.2 y 1.3** exclusivamente (sin SSLv3, TLS 1.0, TLS 1.1)
- **HSTS** con `max-age=63072000` (2 anios), `includeSubDomains` y `preload`
- **X-Frame-Options**: `SAMEORIGIN` (proteccion contra clickjacking)
- **X-Content-Type-Options**: `nosniff` (previene MIME sniffing)
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Content-Security-Policy**: restrictiva (`default-src 'self'`)
- **Permissions-Policy**: deniega camara, microfono y geolocalizacion
- **OCSP Stapling**: verificacion de revocacion de certificados

### 4.3 Cifrado de datos sensibles

En la capa de aplicacion:

- **IBAN y DNI** se cifran con AES-256 usando `ENCRYPTION_KEY` (64 chars hex)
- **Contrasenas** se hashean con argon2 (nunca se almacenan en texto plano)
- **JWT** firmado con `JWT_SECRET` (minimo 32 caracteres aleatorios)

### 4.4 Gestion de secretos

- Todos los secretos se almacenan en `.env` en el VPS (no en el repositorio)
- El archivo `.env.production.example` sirve como plantilla documentada
- Los secretos se generan con `openssl rand` para maxima entropia
- `POSTGRES_PASSWORD` y `JWT_SECRET` usan `-hex` para evitar caracteres especiales que rompan URLs o shells
- `ENCRYPTION_KEY` requiere exactamente 64 caracteres hexadecimales

### 4.5 Logging y rotacion

Todos los contenedores usan el driver `json-file` con rotacion:

```yaml
logging:
  driver: json-file
  options:
    max-size: '10m'
    max-file: '3'
```

Esto limita a 30MB maximo de logs por servicio (3 archivos x 10MB), evitando que el disco se llene por logs no controlados.

---

## 5. Flujo de despliegue

```
Developer Machine                    GHCR                      VPS
      |                               |                         |
      | 1. docker build (API + Web)   |                         |
      |------------------------------>|                         |
      | 2. docker push                |                         |
      |------------------------------>|                         |
      |                               |                         |
      | 3. SSH: docker pull            |                         |
      |---------------------------------------------->|         |
      |                               |<--------------|         |
      |                               | 4. pull layers|         |
      |                               |-------------->|         |
      |                               |               |         |
      | 5. SSH: compose down + up     |               |         |
      |---------------------------------------------->|         |
      |                               |               | 6. migration runs
      |                               |               | 7. api starts
      |                               |               | 8. web starts
      |                               |               |         |
      | 9. SSH: health check          |               |         |
      |<----------------------------------------------|         |
      |                               |               |         |
```

### Orden de arranque (dependency chain)

```
postgres (healthy) --> migration (completed_successfully) --> api (healthy) --> web
```

- `postgres` debe estar `healthy` (pg_isready) antes de que `migration` inicie
- `migration` debe completar exitosamente (exit code 0) antes de que `api` inicie
- `api` debe estar `healthy` (GET /api/v1/health 200) antes de que `web` inicie

---

## 6. Limites de recursos

| Servicio | Memoria maxima | Memoria reservada |
| -------- | :------------: | :---------------: |
| postgres |    1024 MB     |      256 MB       |
| api      |    1024 MB     |      256 MB       |
| web      |     256 MB     |       64 MB       |

PostgreSQL esta configurado adicionalmente con:

- `shared_buffers=256MB`
- `effective_cache_size=512MB`
- `work_mem=4MB`
- `maintenance_work_mem=64MB`
- `max_connections=100`

Total maximo: ~2.3 GB de los 8 GB disponibles en el VPS, dejando margen para el SO, nginx del host y operaciones.

---

_[↑ Indice](README-DEPLOY.md) | [Artefactos Generados →](02-artifacts.md)_
