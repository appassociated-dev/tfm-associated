# Documentacion de Despliegue - Associated ERP

> **Proyecto**: Associated - ERP ligero para colectividades espanolas
> **Dominio**: associated.ipgsoft.com
> **Repositorio**: https://github.com/appassociated-dev/tfm-associated
> **Registry**: ghcr.io/appassociated-dev/associated-{api,web}

---

## Indice de documentos

| #   | Documento                                                 | Contenido                                                                     |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | [Arquitectura de Despliegue](01-architecture.md)          | Arquitectura de despliegue, decisiones, topologia de red, modelo de seguridad |
| 2   | [Artefactos Generados](02-artifacts.md)                   | Detalle de los 12+ artefactos generados: Dockerfiles, compose, nginx, scripts |
| 3   | [Guia de Primer Despliegue](03-initial-deploy.md)         | Guia paso a paso del primer despliegue en el VPS                              |
| 4   | [Deploy de nueva versión](04-new-version-deploy.md)       | Despliegue de nuevas versiones                                                |
| 5   | [Guía de migraciones](05-migration-guide.md)              | Crear, ejecutar y recuperar migraciones                                       |
| 6   | [Troubleshooting](06-troubleshooting.md)                  | Resolucion de problemas                                                       |
| 7   | [Referencia rapida de comandos](07-commands-reference.md) | Referencia completa de comandos utiles                                        |

---

## Estrategia de despliegue

Associated se despliega mediante un flujo manual basado en scripts:

1. **Build local** de imagenes Docker multi-stage (API + Web)
2. **Push a GHCR** (GitHub Container Registry) para distribucion
3. **Pull en VPS** via SSH y levantamiento con Docker Compose
4. **Migraciones automaticas** mediante contenedor one-shot
5. **Verificacion post-despliegue** con script automatizado

El flujo completo se ejecuta con un unico comando:

```bash
./scripts/deploy.sh --tag v1.0.0
```

---

## Referencia rapida

### URLs

| Servicio                | URL                                          |
| ----------------------- | -------------------------------------------- |
| Aplicacion (HTTPS)      | https://associated.ipgsoft.com               |
| API (a traves de nginx) | https://associated.ipgsoft.com/api/v1/       |
| Health check API        | https://associated.ipgsoft.com/api/v1/health |
| GHCR API                | ghcr.io/appassociated-dev/associated-api     |
| GHCR Web                | ghcr.io/appassociated-dev/associated-web     |

### Acceso al VPS

```bash
# Conexion SSH (configurada en ~/.ssh/config como vps-associated)
ssh vps-associated

# O directamente
ssh deploy@<IP_VPS> -i ~/.ssh/id_ed25519.associated
```

### Ubicacion de archivos en el VPS

| Ruta                                         | Contenido                                     |
| -------------------------------------------- | --------------------------------------------- |
| `/opt/associated/`                           | Directorio de trabajo: compose, .env, scripts |
| `/opt/associated/.env`                       | Variables de entorno de produccion            |
| `/opt/associated/docker-compose.prod.yml`    | Compose de produccion                         |
| `/etc/nginx/sites-available/associated.conf` | Vhost nginx del host                          |
| `/etc/ssl/associated/`                       | Certificados SSL (fullchain.pem, privkey.pem) |

### Comandos frecuentes

```bash
# --- Despliegue ---
./scripts/deploy.sh                      # Deploy con tag latest
./scripts/deploy.sh --tag v1.0.0         # Deploy con tag especifico
./scripts/deploy.sh --build-only         # Solo build + push, sin deploy

# --- En el VPS ---
cd /opt/associated

# Estado de servicios
docker compose -f docker-compose.prod.yml ps

# Logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f api    # Solo API

# Reiniciar todo
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Verificar health
curl http://127.0.0.1:3000/api/v1/health
curl http://127.0.0.1:8080/healthz

# --- Verificacion automatizada ---
./scripts/verify-deploy.sh               # Todas las verificaciones
./scripts/verify-deploy.sh --check 6.3   # Solo aislamiento de puertos

# --- Seed de datos ---
API_URL=https://associated.ipgsoft.com/api \
SUPERADMIN_API_KEY=xxx \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=xxx \
bash scripts/seed-production.sh
```

### Generacion de secretos

```bash
# Password de PostgreSQL (hex, sin caracteres especiales)
openssl rand -hex 24

# JWT Secret
openssl rand -base64 48

# Clave de cifrado AES-256 (exactamente 64 caracteres hex)
openssl rand -hex 32

# API Key de superadmin
openssl rand -base64 32
```

---

## Stack tecnologico del despliegue

| Componente          | Tecnologia                | Version                     |
| ------------------- | ------------------------- | --------------------------- |
| Contenedores        | Docker + Docker Compose   | 29.x                        |
| Base de datos       | PostgreSQL                | 18-alpine                   |
| Backend             | Node.js + NestJS          | 22 / 11.x                   |
| Frontend            | nginx (en contenedor)     | 1.27-alpine                 |
| Reverse proxy + SSL | nginx (en host)           | 1.24 (Ubuntu 24.04)         |
| Registry            | GitHub Container Registry | -                           |
| ORM + Migraciones   | Prisma                    | 7.x                         |
| Proceso init        | Tini                      | -                           |
| VPS                 | IONOS DCD (Ubuntu 24.04)  | 4 cores, 8GB RAM, 240GB SSD |

---

_Navegacion: Siguiente -> [01-architecture.md](01-architecture.md)_
