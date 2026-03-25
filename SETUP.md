# Associated - Setup del proyecto

## Requisitos previos

| Herramienta    | Versión mínima                   |
| -------------- | -------------------------------- |
| Node.js        | >= 20.0.0                        |
| npm            | >= 10.0.0                        |
| Docker         | >= 29.x                          |
| Docker Compose | v2 (incluido con Docker Desktop) |

## Primer setup (desde cero)

```bash
# 1. Clonar el repositorio
git clone <repo-url> && cd TFM-ASSOCIATED

# 2. Copiar variables de entorno
cp .env.example .env
cp api/.env.example api/.env

# 3. Instalar dependencias (workspaces: api, web, e2e)
npm install

# 4. Levantar servicios Docker
docker compose up -d

# 5. Generar clientes Prisma (main + tenant)
npm run -w api prisma:generate

# 6. Ejecutar migraciones de la BD principal
npm run -w api prisma:migrate:main

# 7. Arrancar la API en modo desarrollo
npm run -w api start:dev
```

## Servicios Docker

```bash
# Levantar todos los servicios
docker compose up -d

# Parar todos los servicios (conserva datos)
docker compose down

# Parar y BORRAR volúmenes (reset completo de datos)
docker compose down -v

# Ver estado de los servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f            # todos
docker compose logs -f postgres   # solo PostgreSQL
docker compose logs -f minio      # solo MinIO
docker compose logs -f mailpit    # solo Mailpit

# Reiniciar un servicio específico
docker compose restart postgres
```

### Servicios y puertos

| Servicio      | Puerto                          | Descripción                  | Credenciales por defecto        |
| ------------- | ------------------------------- | ---------------------------- | ------------------------------- |
| PostgreSQL 18 | `5432`                          | Base de datos                | `associated` / `associated_dev` |
| MinIO         | `9000` (API) / `9001` (Console) | Almacenamiento S3-compatible | `associated` / `associated_dev` |
| Mailpit       | `1025` (SMTP) / `8025` (UI)     | Mock de correo electrónico   | -                               |

## URLs de interés

| URL                              | Descripción                       |
| -------------------------------- | --------------------------------- |
| `http://localhost:3000`          | API NestJS                        |
| `http://localhost:3000/api/docs` | Swagger UI (documentación API)    |
| `http://localhost:5173`          | Frontend React (Vite dev server)  |
| `http://localhost:9001`          | MinIO Console (almacenamiento)    |
| `http://localhost:8025`          | Mailpit UI (ver correos enviados) |

## Comandos del día a día

### API (Backend - NestJS)

```bash
# Arrancar en modo desarrollo (hot reload)
npm run -w api start:dev

# Arrancar en modo debug (para conectar debugger)
npm run -w api start:debug

# Compilar para producción
npm run -w api build

# Arrancar compilado
npm run -w api start:prod
```

### Frontend (Web - React + Vite)

```bash
# Arrancar en modo desarrollo
npm run -w web dev

# Compilar para producción
npm run -w web build

# Previsualizar build de producción
npm run -w web preview

# Type-check sin compilar
npm run -w web typecheck
```

## Tests

### Tests unitarios (API)

```bash
# Ejecutar todos los tests unitarios
npm run -w api test

# Ejecutar tests de un módulo específico
cd api && npx vitest run src/membership/ --reporter=verbose

# Ejecutar tests de un archivo específico
cd api && npx vitest run src/membership/domain/__tests__/member.spec.ts

# Ejecutar tests en modo watch (re-ejecuta al guardar)
cd api && npx vitest --config vitest.config.ts

# Tests con cobertura
npm run -w api test:cov
```

### Tests unitarios (Web)

```bash
# Ejecutar todos los tests del frontend
npm run -w web test

# Tests con cobertura
npm run -w web test:cov
```

### Tests de integración (API)

```bash
# Requiere Docker con PostgreSQL levantado
npm run -w api test:integration
```

### Tests E2E (Playwright)

```bash
# Requiere API y Web levantados
npm run -w e2e test

# Con interfaz visual
npm run -w e2e test:ui

# Con navegador visible
npm run -w e2e test:headed

# Ver reporte del último run
npm run -w e2e report
```

### Ejecutar TODOS los tests

```bash
# Tests unitarios de todos los workspaces
npm test

# Tests con cobertura de todos los workspaces
npm run test:cov
```

## Prisma (ORM)

El proyecto usa multi-tenant con dos schemas Prisma separados:

- **main** (`api/prisma/main/`) - BD principal: tenants, users, roles, outbox
- **tenant** (`api/prisma/tenant/`) - BD por tenant: members, member types, fiscal years, etc.

```bash
# Generar clientes Prisma (ambos schemas)
npm run -w api prisma:generate

# Generar solo main
npm run -w api prisma:generate:main

# Generar solo tenant
npm run -w api prisma:generate:tenant

# Crear migración en BD principal
npm run -w api prisma:migrate:main

# Crear migración en BD tenant
npm run -w api prisma:migrate:tenant
```

## Linting y formato

```bash
# Lint de todos los workspaces
npm run lint

# Lint solo API
npm run -w api lint

# Lint solo Web
npm run -w web lint

# Formatear todo el proyecto
npm run format

# Verificar formato sin modificar
npm run format:check
```

## Variables de entorno

### Raíz (`.env`) - Docker Compose

Controla los puertos y credenciales de los servicios Docker. Ver `.env.example` para referencia.

### API (`api/.env`) - NestJS

| Variable                 | Descripción                | Valor por defecto                                                       |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------- |
| `PORT`                   | Puerto de la API           | `3000`                                                                  |
| `NODE_ENV`               | Entorno                    | `development`                                                           |
| `DATABASE_MAIN_URL`      | Conexión BD principal      | `postgresql://associated:associated_dev@localhost:5432/associated_main` |
| `DATABASE_TENANT_URL`    | Template BD tenant         | `postgresql://.../{tenantId}`                                           |
| `TENANT_POOL_MAX_SIZE`   | Max conexiones pool tenant | `10`                                                                    |
| `JWT_SECRET`             | Secreto para firmar JWT    | (cambiar en producción)                                                 |
| `JWT_EXPIRATION`         | Expiración access token    | `15m`                                                                   |
| `JWT_REFRESH_EXPIRATION` | Expiración refresh token   | `7d`                                                                    |
| `SENTRY_DSN`             | DSN de Sentry              | (vacío en dev)                                                          |

## Estructura de workspaces

```
Associated/
├── api/          # Backend NestJS (npm workspace)
├── web/          # Frontend React + Vite (npm workspace)
├── e2e/          # Tests E2E Playwright (npm workspace)
├── spec/         # Documentación de especificación
├── doc/          # Documentación de diseño y releases
└── skills/       # Skills de agentes IA
```

## Troubleshooting

### PostgreSQL no arranca

```bash
# Verificar si el puerto 5432 está ocupado
lsof -i :5432

# Reiniciar el contenedor
docker compose restart postgres

# Reset completo (borra datos)
docker compose down -v && docker compose up -d
```

### Error "prisma generate" falla

```bash
# Asegurarse de que las dependencias están instaladas
npm install -w api

# Regenerar ambos schemas
npm run -w api prisma:generate
```

### Tests fallan por conexión a BD

```bash
# Verificar que Docker está corriendo
docker compose ps

# Los tests unitarios NO requieren BD (mocks)
# Los tests de integración SÍ requieren PostgreSQL levantado
npm run -w api test        # unitarios (sin BD)
npm run -w api test:integration  # integración (con BD)
```

### Puerto ocupado al arrancar la API

```bash
# Buscar el proceso que usa el puerto 3000
lsof -i :3000

# Matar el proceso (reemplazar PID)
kill -9 <PID>
```
