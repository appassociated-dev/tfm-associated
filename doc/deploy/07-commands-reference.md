# 07 - Referencia rapida de comandos

_[← 6. Troubleshooting](06-troubleshooting.md) | [↑ Indice](README-DEPLOY.md)_

---

Referencia completa de todos los comandos utiles para la gestion del despliegue de Associated. Todos los comandos estan listos para copiar y pegar.

## Tabla de contenidos

- [Docker Compose](#docker-compose)
- [Gestion de contenedores](#gestion-de-contenedores)
- [Base de datos](#base-de-datos)
- [Migraciones](#migraciones)
- [nginx](#nginx)
- [Monitoreo](#monitoreo)
- [GHCR (GitHub Container Registry)](#ghcr-github-container-registry)
- [SSH](#ssh)
- [Seed](#seed)
- [Emergencias](#emergencias)

---

## Docker Compose

Todos los comandos de Docker Compose se ejecutan desde `/opt/associated/` en el VPS.

```bash
# Levantar todos los servicios en background
ssh vps-associated "cd /opt/associated && docker compose up -d"

# Levantar un servicio especifico
ssh vps-associated "cd /opt/associated && docker compose up -d api"

# Parar todos los servicios (sin eliminar volumenes)
ssh vps-associated "cd /opt/associated && docker compose down"

# Parar todos los servicios Y eliminar volumenes (DESTRUCTIVO)
ssh vps-associated "cd /opt/associated && docker compose down -v"

# Reiniciar un servicio
ssh vps-associated "cd /opt/associated && docker compose restart api"

# Reiniciar todos los servicios
ssh vps-associated "cd /opt/associated && docker compose restart"

# Ver logs en tiempo real de un servicio
ssh vps-associated "cd /opt/associated && docker compose logs -f api"

# Ver logs de los ultimos 5 minutos
ssh vps-associated "cd /opt/associated && docker compose logs --since 5m api"

# Ver ultimas N lineas de logs
ssh vps-associated "cd /opt/associated && docker compose logs --tail 50 api"

# Ver logs de todos los servicios con timestamps
ssh vps-associated "cd /opt/associated && docker compose logs -f -t"

# Ver estado de todos los servicios
ssh vps-associated "cd /opt/associated && docker compose ps"

# Ver estado con formato detallado
ssh vps-associated "cd /opt/associated && docker compose ps -a --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'"

# Descargar imagenes actualizadas desde GHCR
ssh vps-associated "cd /opt/associated && docker compose pull"

# Descargar imagen de un servicio especifico
ssh vps-associated "cd /opt/associated && docker compose pull api"

# Ejecutar un comando dentro de un contenedor corriendo
ssh vps-associated "cd /opt/associated && docker compose exec api sh"

# Ejecutar un comando one-shot (crea contenedor temporal)
ssh vps-associated "cd /opt/associated && docker compose run --rm api node -e 'console.log(\"OK\")'"

# Forzar recreacion de contenedores sin cambiar imagenes
ssh vps-associated "cd /opt/associated && docker compose up -d --force-recreate"

# Actualizar y recrear solo los servicios con imagenes nuevas
ssh vps-associated "cd /opt/associated && docker compose pull && docker compose up -d"
```

---

## Gestion de contenedores

```bash
# Inspeccionar configuracion completa de un contenedor
ssh vps-associated "docker inspect \$(docker compose -f /opt/associated/docker-compose.yml ps -q api)"

# Ver variables de entorno de un contenedor
ssh vps-associated "cd /opt/associated && docker compose exec api env | sort"

# Ver uso de recursos en tiempo real
ssh vps-associated "docker stats"

# Ver uso de recursos (snapshot, no en tiempo real)
ssh vps-associated "docker stats --no-stream"

# Ver procesos dentro de un contenedor
ssh vps-associated "cd /opt/associated && docker compose top api"

# Ver procesos de todos los contenedores
ssh vps-associated "cd /opt/associated && docker compose top"

# Limpiar imagenes sin usar (no elimina las en uso)
ssh vps-associated "docker image prune -f"

# Limpiar TODO lo que no este en uso (imagenes, redes, volumenes huerfanos)
ssh vps-associated "docker system prune -f"

# Limpiar incluyendo imagenes no referenciadas
ssh vps-associated "docker system prune -a -f"

# Ver espacio usado por Docker
ssh vps-associated "docker system df"

# Ver espacio usado detallado
ssh vps-associated "docker system df -v"

# Copiar un archivo desde un contenedor al host
ssh vps-associated "docker cp \$(docker compose -f /opt/associated/docker-compose.yml ps -q api):/app/package.json /tmp/package.json"

# Copiar un archivo desde el host a un contenedor
ssh vps-associated "docker cp /tmp/fix.js \$(docker compose -f /opt/associated/docker-compose.yml ps -q api):/app/fix.js"
```

---

## Base de datos

### Conexion directa

```bash
# Conectar a la base principal
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main"

# Conectar a la base de un tenant especifico
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_tenant_mi_asociacion"

# Ejecutar un query sin entrar al shell interactivo
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c 'SELECT COUNT(*) FROM \"Tenant\";'"
```

### Listar y explorar

```bash
# Listar todas las bases de datos
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c '\l'"

# Listar bases de datos de tenants
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c \"SELECT datname FROM pg_database WHERE datname LIKE 'associated_tenant_%' ORDER BY datname;\""

# Listar tenants con su informacion
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c 'SELECT id, slug, \"databaseName\", status, \"createdAt\" FROM \"Tenant\" ORDER BY \"createdAt\";'"

# Listar tablas de una base de datos
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c '\dt'"

# Ver estructura de una tabla
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c '\d \"Tenant\"'"

# Ver usuarios de PostgreSQL y sus permisos
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c '\du'"

# Ver conexiones activas
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c 'SELECT datname, usename, client_addr, state FROM pg_stat_activity WHERE datname IS NOT NULL;'"

# Ver tamano de las bases de datos
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -c 'SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datname NOT IN ('\''template0'\'', '\''template1'\'') ORDER BY pg_database_size(datname) DESC;'"
```

### Backup y restore

```bash
# Backup de la base principal
ssh vps-associated "cd /opt/associated && docker compose exec db pg_dump -U admin associated_main > /opt/associated/backups/main_\$(date +%Y%m%d_%H%M%S).sql"

# Backup de un tenant
ssh vps-associated "cd /opt/associated && docker compose exec db pg_dump -U admin associated_tenant_mi_asociacion > /opt/associated/backups/tenant_mi_asociacion_\$(date +%Y%m%d_%H%M%S).sql"

# Backup de TODAS las bases de datos
ssh vps-associated "cd /opt/associated && docker compose exec db pg_dumpall -U admin > /opt/associated/backups/full_\$(date +%Y%m%d_%H%M%S).sql"

# Backup comprimido
ssh vps-associated "cd /opt/associated && docker compose exec db pg_dump -U admin -Fc associated_main > /opt/associated/backups/main_\$(date +%Y%m%d_%H%M%S).dump"

# Restore de la base principal (desde SQL plano)
ssh vps-associated "cd /opt/associated && docker compose exec -T db psql -U admin -d associated_main < /opt/associated/backups/main_20240115_120000.sql"

# Restore desde formato custom
ssh vps-associated "cd /opt/associated && docker compose exec -T db pg_restore -U admin -d associated_main /opt/associated/backups/main_20240115_120000.dump"

# Descargar un backup al equipo local
scp vps-associated:/opt/associated/backups/main_20240115_120000.sql ./backups/
```

---

## Migraciones

```bash
# Ejecutar migraciones de la base principal
ssh vps-associated "cd /opt/associated && docker compose run --rm migration"

# Ver estado de las migraciones (cuales estan aplicadas)
ssh vps-associated "cd /opt/associated && docker compose run --rm migration npx prisma migrate status --schema=prisma/schema/main.prisma"

# Ejecutar migraciones de tenants (todos)
ssh vps-associated "cd /opt/associated && docker compose run --rm migration npx prisma migrate deploy --schema=prisma/schema/tenant.prisma"

# Ver el historial de migraciones aplicadas
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c 'SELECT * FROM \"_prisma_migrations\" ORDER BY \"finished_at\" DESC LIMIT 10;'"

# Verificar que las migraciones estan al dia (comparar con el schema)
ssh vps-associated "cd /opt/associated && docker compose run --rm migration npx prisma migrate diff --from-schema-datasource=prisma/schema/main.prisma --to-schema-datamodel=prisma/schema/main.prisma"
```

---

## nginx

```bash
# Testear la configuracion (SIEMPRE antes de reload)
ssh vps-associated "sudo nginx -t"

# Recargar configuracion sin downtime
ssh vps-associated "sudo systemctl reload nginx"

# Reiniciar nginx completamente
ssh vps-associated "sudo systemctl restart nginx"

# Ver estado del servicio
ssh vps-associated "sudo systemctl status nginx"

# Ver version instalada
ssh vps-associated "nginx -v"

# Ver la configuracion compilada completa
ssh vps-associated "sudo nginx -T"

# Ver logs de acceso en tiempo real
ssh vps-associated "sudo tail -f /var/log/nginx/access.log"

# Ver logs de error en tiempo real
ssh vps-associated "sudo tail -f /var/log/nginx/error.log"

# Ver los logs del vhost de Associated
ssh vps-associated "sudo tail -f /var/log/nginx/associated.access.log"
ssh vps-associated "sudo tail -f /var/log/nginx/associated.error.log"

# Listar vhosts habilitados
ssh vps-associated "ls -la /etc/nginx/sites-enabled/"

# Editar la configuracion del vhost
ssh vps-associated "sudo nano /etc/nginx/sites-available/associated.conf"

# Habilitar un vhost
ssh vps-associated "sudo ln -s /etc/nginx/sites-available/associated.conf /etc/nginx/sites-enabled/"

# Deshabilitar un vhost
ssh vps-associated "sudo rm /etc/nginx/sites-enabled/associated.conf"

# Ver conexiones activas
ssh vps-associated "sudo ss -tlnp | grep nginx"
```

---

## Monitoreo

```bash
# Uso de disco del sistema
ssh vps-associated "df -h"

# Uso de disco del directorio de datos
ssh vps-associated "du -sh /opt/associated/"

# Uso de memoria del sistema
ssh vps-associated "free -h"

# Uso de CPU y memoria en tiempo real
ssh vps-associated "top -b -n 1 | head -20"

# Uso de recursos por contenedor Docker (snapshot)
ssh vps-associated "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}'"

# Espacio usado por imagenes Docker
ssh vps-associated "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | sort -k3 -h"

# Espacio usado por volumenes Docker
ssh vps-associated "docker volume ls --format 'table {{.Name}}\t{{.Driver}}'"

# Uptime del servidor
ssh vps-associated "uptime"

# Ver servicios systemd activos relevantes
ssh vps-associated "sudo systemctl status nginx docker"

# Ver puertos en escucha
ssh vps-associated "sudo ss -tlnp"

# Ver contenedores con su health status
ssh vps-associated "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

---

## GHCR (GitHub Container Registry)

```bash
# Loguearse a GHCR (como usuario deploy en el VPS)
ssh vps-associated "echo 'ghp_TU_TOKEN' | docker login ghcr.io -u appassociated-dev --password-stdin"

# Verificar autenticacion
ssh vps-associated "docker pull ghcr.io/appassociated-dev/associated-api:latest && echo 'AUTH OK'"

# Descargar imagen de la API
ssh vps-associated "docker pull ghcr.io/appassociated-dev/associated-api:latest"

# Descargar imagen del web
ssh vps-associated "docker pull ghcr.io/appassociated-dev/associated-web:latest"

# Descargar una version especifica (tag)
ssh vps-associated "docker pull ghcr.io/appassociated-dev/associated-api:v1.2.3"

# Ver imagenes locales del proyecto
ssh vps-associated "docker images | grep associated"

# Subir imagen (desde maquina de desarrollo o CI)
docker push ghcr.io/appassociated-dev/associated-api:latest
docker push ghcr.io/appassociated-dev/associated-web:latest

# Subir con tag de version
docker tag ghcr.io/appassociated-dev/associated-api:latest ghcr.io/appassociated-dev/associated-api:v1.2.3
docker push ghcr.io/appassociated-dev/associated-api:v1.2.3

# Listar tags disponibles en GHCR (requiere gh CLI)
gh api user/packages/container/associated-api/versions --jq '.[].metadata.container.tags[]'
gh api user/packages/container/associated-web/versions --jq '.[].metadata.container.tags[]'

# Eliminar imagenes viejas localmente
ssh vps-associated "docker images | grep associated | grep -v latest | awk '{print \$3}' | xargs -r docker rmi"
```

---

## SSH

```bash
# Conectar al VPS
ssh vps-associated

# Conectar y ejecutar un comando directamente
ssh vps-associated "cd /opt/associated && docker compose ps"

# Copiar archivos al VPS
scp ./docker-compose.yml vps-associated:/opt/associated/docker-compose.yml
scp ./.env.production vps-associated:/opt/associated/.env

# Copiar archivos desde el VPS
scp vps-associated:/opt/associated/.env ./env-backup

# Copiar un directorio completo al VPS
scp -r ./scripts/ vps-associated:/opt/associated/scripts/

# Crear un tunel SSH para acceder a PostgreSQL localmente
ssh -L 5433:127.0.0.1:5432 vps-associated
# Luego conectar con: psql -h 127.0.0.1 -p 5433 -U admin -d associated_main

# Crear un tunel SSH para acceder a la API localmente
ssh -L 3001:127.0.0.1:3000 vps-associated
# Luego acceder a: http://localhost:3001

# Verificar conectividad SSH
ssh -v vps-associated "echo OK"

# Ver la configuracion SSH que se esta usando
ssh -G vps-associated
```

---

## Seed

```bash
# Ejecutar seed de produccion (datos iniciales)
ssh vps-associated "cd /opt/associated && docker compose run --rm seed"

# Ejecutar seed con datos de ejemplo
ssh vps-associated "cd /opt/associated && docker compose run --rm -e SEED_MODE=demo seed"

# Ejecutar el script de seed manualmente
ssh vps-associated "cd /opt/associated && docker compose exec api node dist/seed/main.js"

# Verificar que el seed se ejecuto correctamente
ssh vps-associated "cd /opt/associated && docker compose exec db psql -U admin -d associated_main -c 'SELECT COUNT(*) as tenants FROM \"Tenant\"; SELECT COUNT(*) as users FROM \"User\";'"
```

---

## Emergencias

> **ATENCION:** Los comandos de esta seccion son potencialmente destructivos. Verificar dos veces antes de ejecutar.

### Forzar reinicio de todos los servicios

```bash
ssh vps-associated << 'EOF'
cd /opt/associated
docker compose down
docker compose up -d
echo "Servicios reiniciados. Verificando..."
sleep 5
docker compose ps
EOF
```

### Reset nuclear (eliminar todo y empezar de cero)

> **ESTO ELIMINA TODOS LOS DATOS.** Solo usar si realmente se necesita empezar desde cero.

```bash
ssh vps-associated << 'EOF'
cd /opt/associated

echo "=== ATENCION: RESET NUCLEAR ==="
echo "Esto eliminara TODOS los datos, volumenes e imagenes."
echo "Presiona Ctrl+C en 5 segundos para cancelar..."
sleep 5

# Parar todo y eliminar volumenes
docker compose down -v

# Eliminar imagenes del proyecto
docker images | grep associated | awk '{print $3}' | xargs -r docker rmi -f

# Limpiar cache de Docker
docker system prune -f

# Descargar imagenes frescas
docker compose pull

# Levantar la base de datos primero
docker compose up -d db
sleep 5

# Ejecutar migraciones
docker compose run --rm migration

# Ejecutar seed
docker compose run --rm seed

# Levantar el resto de servicios
docker compose up -d

echo "=== Reset completo. Verificando... ==="
docker compose ps
EOF
```

### Rollback de emergencia a una imagen anterior

```bash
ssh vps-associated << 'EOF'
cd /opt/associated

# Verificar que tags estan disponibles localmente
docker images | grep associated

# Cambiar a una version especifica en docker-compose.yml
# (editar manualmente la imagen)
# image: ghcr.io/appassociated-dev/associated-api:v1.2.2

# O hacer pull de una version especifica y retaggear
docker pull ghcr.io/appassociated-dev/associated-api:v1.2.2
docker tag ghcr.io/appassociated-dev/associated-api:v1.2.2 ghcr.io/appassociated-dev/associated-api:latest

docker pull ghcr.io/appassociated-dev/associated-web:v1.2.2
docker tag ghcr.io/appassociated-dev/associated-web:v1.2.2 ghcr.io/appassociated-dev/associated-web:latest

# Recrear contenedores con las imagenes "viejas"
docker compose up -d --force-recreate api web

echo "Rollback completado. Verificando..."
docker compose ps
EOF
```

### Liberar espacio de disco urgente

```bash
ssh vps-associated << 'EOF'
echo "=== Espacio actual ==="
df -h /

echo "=== Espacio usado por Docker ==="
docker system df

echo "=== Limpiando imagenes no utilizadas ==="
docker image prune -a -f

echo "=== Limpiando build cache ==="
docker builder prune -f

echo "=== Limpiando logs de contenedores ==="
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log

echo "=== Espacio despues de limpieza ==="
df -h /
EOF
```

### Verificacion rapida post-despliegue

Comando unico para verificar que todo esta funcionando despues de un despliegue:

```bash
ssh vps-associated << 'EOF'
echo "=== Estado de contenedores ==="
cd /opt/associated && docker compose ps

echo ""
echo "=== Health checks ==="
docker ps --format '{{.Names}}: {{.Status}}' | grep associated

echo ""
echo "=== nginx ==="
sudo systemctl is-active nginx

echo ""
echo "=== Conectividad API ==="
curl -sf http://127.0.0.1:3000/api/health && echo " OK" || echo " FAIL"

echo ""
echo "=== Conectividad Web ==="
curl -sf http://127.0.0.1:8080/ > /dev/null && echo "OK" || echo "FAIL"

echo ""
echo "=== SSL externo ==="
curl -sf https://associated.ipgsoft.com/api/health && echo " OK" || echo " FAIL"

echo ""
echo "=== Disco ==="
df -h / | tail -1

echo ""
echo "=== Memoria ==="
free -h | grep Mem
EOF
```

---

_[← 6. Troubleshooting](06-troubleshooting.md) | [↑ Indice](README-DEPLOY.md)_
