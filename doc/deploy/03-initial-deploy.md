# 3. Guía de Primer Despliegue

<table>
  <tr>
    <td width="45%">
      ← Anterior<br/>
      <a href="02-artifacts.md">2. Artefactos Generados</a>
    </td>
    <td width="10%" align="center">
      <a href="README.md">↑</a>
    </td>
    <td width="45%" align="right">
      Siguiente →<br/>
      <a href="04-new-version-deploy.md">4. Deploy de nueva versión</a>
    </td>
  </tr>
</table>

---

Guía paso a paso para realizar el primer despliegue de Associated en un VPS limpio. Asume que se parte de un servidor Ubuntu 24.04 sin nada instalado.

## Tabla de contenidos

- [Prerrequisitos](#prerrequisitos)
- [Paso 1: Preparar el VPS](#paso-1-preparar-el-vps)
- [Paso 2: Configurar certificado SSL](#paso-2-configurar-certificado-ssl)
- [Paso 3: Configurar nginx del host](#paso-3-configurar-nginx-del-host)
- [Paso 4: Preparar el directorio de la aplicación](#paso-4-preparar-el-directorio-de-la-aplicación-en-el-vps)
- [Paso 5: Build y push de imágenes](#paso-5-build-y-push-de-imágenes-desde-máquina-local)
- [Paso 6: Levantar servicios](#paso-6-levantar-servicios-en-el-vps)
- [Paso 7: Seed de datos iniciales](#paso-7-seed-de-datos-iniciales)
- [Paso 8: Verificación completa](#paso-8-verificación-completa-automatizada)
- [Resolución de problemas](#resolución-de-problemas)
- [Despliegues posteriores](#despliegues-posteriores)

---

## Prerrequisitos

### En la máquina local (desarrollo)

- Docker y Docker Compose instalados
- Autenticación en GHCR configurada: `docker login ghcr.io -u USUARIO -p TOKEN`
- Clave SSH generada para el VPS
- Git con acceso al repositorio

### En el VPS

| Componente | Especificación      |
| :--------- | :------------------ |
| SO         | Ubuntu 24.04 LTS    |
| CPU        | 4 cores             |
| RAM        | 8 GB                |
| Disco      | 240 GB SSD          |
| Puerto 80  | Abierto en firewall |
| Puerto 443 | Abierto en firewall |

---

## Paso 1: Preparar el VPS

### 1.1 Conectar al VPS y crear usuario de deploy

```bash
# Conectar como root (primera vez)
ssh root@<IP_VPS>

# Actualizar el sistema
apt update && apt upgrade -y

# Crear usuario deploy
adduser deploy
usermod -aG sudo deploy

# Configurar SSH para deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 1.2 Configurar SSH en la máquina local

Agregar al archivo `~/.ssh/config` local:

```
Host vps-associated
    HostName <IP_VPS>
    User deploy
    IdentityFile ~/.ssh/id_ed25519.associated
    IdentitiesOnly yes
```

Verificar conexión:

```bash
ssh vps-associated
```

### 1.3 Instalar Docker en el VPS

```bash
# Conectar como deploy
ssh vps-associated

# Instalar Docker (script oficial)
curl -fsSL https://get.docker.com | sudo sh

# Agregar deploy al grupo docker (evitar sudo para cada comando)
sudo usermod -aG docker deploy

# Cerrar sesión y reconectar para que el grupo surta efecto
exit
ssh vps-associated

# Verificar
docker --version
docker compose version
```

### 1.4 Instalar nginx en el VPS

```bash
sudo apt install nginx -y

# Verificar versión (1.24.x en Ubuntu 24.04)
nginx -v

# Verificar que está corriendo
sudo systemctl status nginx
```

### 1.5 Instalar jq (necesario para seed)

```bash
sudo apt install jq -y
```

### 1.6 Autenticar Docker con GHCR en el VPS

```bash
echo "GHCR_TOKEN" | docker login ghcr.io -u GITHUB_USER --password-stdin
```

> [!NOTE]
> El token (PAT) necesita el permiso `read:packages` como mínimo.

---

## Paso 2: Configurar certificado SSL

### Opción A: Certificado propio

```bash
# Crear directorio
sudo mkdir -p /etc/ssl/associated

# Copiar certificados (desde la máquina local)
scp fullchain.pem vps-associated:/tmp/
scp privkey.pem vps-associated:/tmp/

# En el VPS
sudo mv /tmp/fullchain.pem /etc/ssl/associated/
sudo mv /tmp/privkey.pem /etc/ssl/associated/
sudo chmod 600 /etc/ssl/associated/privkey.pem
sudo chmod 644 /etc/ssl/associated/fullchain.pem
```

### Opción B: Let's Encrypt (certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado (nginx debe estar corriendo con el vhost básico)
sudo certbot --nginx -d associated.ipgsoft.com

# Los certificados se generan en /etc/letsencrypt/live/associated.ipgsoft.com/
# Crear symlinks al directorio esperado por la configuración:
sudo ln -sf /etc/letsencrypt/live/associated.ipgsoft.com/fullchain.pem /etc/ssl/associated/fullchain.pem
sudo ln -sf /etc/letsencrypt/live/associated.ipgsoft.com/privkey.pem /etc/ssl/associated/privkey.pem
```

---

## Paso 3: Configurar nginx del host

### 3.1 Copiar la configuración del vhost

```bash
# Desde la máquina local (raíz del repositorio)
scp nginx/associated.conf vps-associated:/tmp/

# En el VPS
sudo mv /tmp/associated.conf /etc/nginx/sites-available/associated.conf
```

### 3.2 Reemplazar el dominio placeholder

```bash
sudo sed -i 's/${DOMAIN}/associated.ipgsoft.com/g' /etc/nginx/sites-available/associated.conf
```

### 3.3 Activar el vhost

```bash
# Crear symlink
sudo ln -sf /etc/nginx/sites-available/associated.conf /etc/nginx/sites-enabled/

# Eliminar default si existe
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo nginx -s reload
```

> [!NOTE]
> nginx mostrará warnings sobre los upstream (127.0.0.1:3000 y 127.0.0.1:8080) hasta que los contenedores estén corriendo. Esto es normal.

---

## Paso 4: Preparar el directorio de la aplicación en el VPS

```bash
sudo mkdir -p /opt/associated
sudo chown deploy:deploy /opt/associated
cd /opt/associated
```

### 4.1 Copiar archivos necesarios desde el repositorio

Desde la máquina local:

```bash
# Copiar compose y env example
scp docker-compose.prod.yml vps-associated:/opt/associated/
scp .env.production.example vps-associated:/opt/associated/
scp -r docker/ vps-associated:/opt/associated/
scp -r scripts/ vps-associated:/opt/associated/

# Asegurar que los scripts son ejecutables
ssh vps-associated 'chmod +x /opt/associated/scripts/*.sh'
```

### 4.2 Crear y configurar el archivo .env

```bash
cd /opt/associated
cp .env.production.example .env
nano .env
```

Generar los secretos (ejecutar estos comandos y pegar los resultados en el .env):

```bash
# Password PostgreSQL
openssl rand -hex 24

# JWT Secret
openssl rand -base64 48

# Clave de cifrado (EXACTAMENTE 64 caracteres hex)
openssl rand -hex 32

# API Key superadmin
openssl rand -base64 32
```

**Ejemplo de .env completo** (con valores ficticios):

```env
NODE_ENV=production
DOMAIN=associated.ipgsoft.com

POSTGRES_USER=associated
POSTGRES_PASSWORD=a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3
POSTGRES_DB=associated_main

DATABASE_MAIN_URL=postgresql://associated:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3@postgres:5432/associated_main?schema=public
DATABASE_TENANT_URL=postgresql://associated:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3@postgres:5432/tenant_placeholder?schema=public

API_PORT=3000

JWT_SECRET=K7mN3pR9sT2vX5zA1cE4fH7jL0nQ3rU6wY9bD2eG5hJ8kM1o
JWT_EXPIRES_IN=1h

ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2

SUPERADMIN_API_KEY=R8sT2vX5zA1cE4fH7jL0nQ3rU6wY9bD2eG5hJ8kM1o=
```

> [!CAUTION]
> Verificar que la `POSTGRES_PASSWORD` sea IDÉNTICA en `POSTGRES_PASSWORD`, `DATABASE_MAIN_URL` y `DATABASE_TENANT_URL`. Una discrepancia provoca que la API no pueda conectar a la base de datos.

> [!CAUTION]
> Verificar que `ENCRYPTION_KEY` tenga exactamente 64 caracteres hexadecimales (0–9, a–f).

---

## Paso 5: Build y push de imágenes (desde máquina local)

### Opción rápida: usar deploy.sh

```bash
export VPS_HOST=<IP_VPS>
export VPS_USER=deploy

./scripts/deploy.sh --tag v1.0.0
```

### Opción manual: build + push + pull

```bash
# Build
docker build -f api/Dockerfile.prod -t ghcr.io/appassociated-dev/associated-api:v1.0.0 .
docker build -f web/Dockerfile.prod -t ghcr.io/appassociated-dev/associated-web:v1.0.0 .

# Tag como latest
docker tag ghcr.io/appassociated-dev/associated-api:v1.0.0 ghcr.io/appassociated-dev/associated-api:latest
docker tag ghcr.io/appassociated-dev/associated-web:v1.0.0 ghcr.io/appassociated-dev/associated-web:latest

# Push
docker push ghcr.io/appassociated-dev/associated-api:v1.0.0
docker push ghcr.io/appassociated-dev/associated-api:latest
docker push ghcr.io/appassociated-dev/associated-web:v1.0.0
docker push ghcr.io/appassociated-dev/associated-web:latest
```

---

## Paso 6: Levantar servicios en el VPS

```bash
cd /opt/associated

# Pull de imágenes
docker compose -f docker-compose.prod.yml pull

# Levantar todos los servicios
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### 6.1 Verificar estado

```bash
docker compose -f docker-compose.prod.yml ps

# Esperado:
# associated-prod-postgres   running (healthy)
# associated-prod-migration  exited (0)
# associated-prod-api        running (healthy)
# associated-prod-web        running (healthy)
```

### 6.2 Verificar migraciones

```bash
# Ver exit code de migration
docker inspect associated-prod-migration --format='{{.State.ExitCode}}'
# Esperado: 0

# Ver logs de migration
docker compose -f docker-compose.prod.yml logs migration
```

### 6.3 Verificar health endpoints

```bash
# API health
curl http://127.0.0.1:3000/api/v1/health
# Esperado: {"status":"ok","info":{"database":{"status":"up"}},...}

# Web health
curl http://127.0.0.1:8080/healthz
# Esperado: ok

# HTTPS (desde fuera del VPS)
curl -I https://associated.ipgsoft.com/api/v1/health
# Esperado: HTTP/2 200
```

### 6.4 Verificar aislamiento de puertos

Desde una máquina EXTERNA al VPS:

```bash
# PostgreSQL NO debe ser accesible
nc -zv <IP_VPS> 5432
# Esperado: Connection refused

# API directa NO debe ser accesible
nc -zv <IP_VPS> 3000
# Esperado: Connection refused

# HTTPS SÍ debe ser accesible
nc -zv <IP_VPS> 443
# Esperado: Connection succeeded
```

---

## Paso 7: Seed de datos iniciales

Desde la máquina local (o desde cualquier máquina con acceso HTTPS al VPS):

```bash
API_URL=https://associated.ipgsoft.com/api \
SUPERADMIN_API_KEY=<valor_del_env> \
ADMIN_EMAIL=admin@miasociacion.es \
ADMIN_PASSWORD='UnPasswordSeguro123!' \
TENANT_NAME="Mi Asociación" \
TENANT_CIF="B12345678" \
TENANT_TYPE="ASOCIACION" \
TENANT_CONTACT_EMAIL="contacto@miasociacion.es" \
bash scripts/seed-production.sh
```

### Datos que crea

1. Tenant con la configuración proporcionada
2. Usuario admin con las credenciales indicadas
3. Tipos de socio: Adulto, Juvenil, Infantil
4. Planes de cuota: Mensual (15 EUR), Trimestral (40 EUR), Anual (120 EUR), Inscripción (50 EUR)
5. Ejercicio fiscal 2026
6. Vinculaciones plan-tipo

El script es idempotente: puede re-ejecutarse sin errores.

---

## Paso 8: Verificación completa automatizada

```bash
export VPS_HOST=<IP_VPS>
export VPS_USER=deploy

# Ejecutar todas las verificaciones
./scripts/verify-deploy.sh

# O solo las remotas
./scripts/verify-deploy.sh --remote
```

### Checklist manual adicional

- [ ] `https://associated.ipgsoft.com` carga la SPA correctamente
- [ ] `http://associated.ipgsoft.com` redirige a HTTPS (301)
- [ ] `https://associated.ipgsoft.com/api/v1/health` responde 200
- [ ] Login con las credenciales del seed funciona
- [ ] Los puertos 5432 y 3000 NO son accesibles externamente
- [ ] Los logs no muestran errores críticos: `docker compose -f docker-compose.prod.yml logs --tail=50`

---

## Resolución de problemas

### La migración falla (exit code ≠ 0)

```bash
# Ver logs detallados
docker compose -f docker-compose.prod.yml logs migration
```

Causas comunes: `DATABASE_MAIN_URL` incorrecto en `.env`, PostgreSQL no arrancó a tiempo (aumentar `start_period` en compose), o permisos en prisma engines (el contenedor migration corre como root, debería funcionar).

### La API no arranca o no está healthy

```bash
docker compose -f docker-compose.prod.yml logs api
```

Causas comunes: `DATABASE_MAIN_URL`/`DATABASE_TENANT_URL` incorrectos, `JWT_SECRET` o `ENCRYPTION_KEY` mal configurados, la migración no se completó (verificar exit code de migration), o puerto 3000 ya ocupado por otro proceso.

### nginx del host devuelve 502

```bash
# Verificar que los contenedores están corriendo
docker compose -f docker-compose.prod.yml ps

# Verificar que los puertos están escuchando
ss -tlnp | grep -E '(3000|8080)'

# Verificar logs de nginx
sudo tail -f /var/log/nginx/error.log
```

Causa común: los contenedores no están corriendo o no están healthy.

### SPA carga pero no conecta con la API

```bash
curl -I https://associated.ipgsoft.com/api/v1/health
```

Si devuelve 404: nginx no tiene la ruta `/api/` configurada. Si devuelve 502: la API no está corriendo. Si devuelve 200: la API funciona, el problema es CORS o la URL en el frontend.

### Reiniciar todo desde cero

```bash
cd /opt/associated

# Detener y eliminar todo (INCLUYENDO datos de PostgreSQL)
docker compose -f docker-compose.prod.yml down -v

# Volver a levantar
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

> [!CAUTION]
> `down -v` elimina el volumen `pgdata` con TODOS los datos de la base de datos. Solo usar en primer despliegue o si se quiere empezar de cero.

---

## Despliegues posteriores

Una vez completado el primer despliegue, los despliegues siguientes son mucho más simples:

```bash
export VPS_HOST=<IP_VPS>
export VPS_USER=deploy

./scripts/deploy.sh --tag v1.1.0
```

O manualmente:

```bash
# Build local
docker build -f api/Dockerfile.prod -t ghcr.io/appassociated-dev/associated-api:latest .
docker build -f web/Dockerfile.prod -t ghcr.io/appassociated-dev/associated-web:latest .

# Push
docker push ghcr.io/appassociated-dev/associated-api:latest
docker push ghcr.io/appassociated-dev/associated-web:latest

# En el VPS
ssh vps-associated
cd /opt/associated
docker compose -f docker-compose.prod.yml pull api web
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

Las migraciones se ejecutan automáticamente en cada despliegue (contenedor one-shot `migration`).

---

<table>
  <tr>
    <td width="45%">
      ← Anterior<br/>
      <a href="02-artifacts.md">2. Artefactos Generados</a>
    </td>
    <td width="10%" align="center">
      <a href="README.md">↑</a>
    </td>
    <td width="45%" align="right">
      Siguiente →<br/>
      <a href="04-new-version-deploy.md">4. Deploy de nueva versión</a>
    </td>
  </tr>
</table>
