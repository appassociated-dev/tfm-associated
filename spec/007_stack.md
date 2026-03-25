# Stack Tecnológico

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.1  
**Fecha:** Febrero 2026  
**Inputs:** KB-004 (RNF Base), KB-006 (ADRs)  
**Estado:** Borrador

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Backend](#2-backend)
3. [Frontend](#3-frontend)
4. [Base de Datos](#4-base-de-datos)
5. [Infraestructura](#5-infraestructura)
6. [Testing](#6-testing)
7. [DevOps y CI/CD](#7-devops-y-cicd)
8. [Herramientas de Desarrollo](#8-herramientas-de-desarrollo)
9. [Servicios Externos](#9-servicios-externos)
10. [Matriz de Decisiones](#10-matriz-de-decisiones)

---

## 1. Resumen Ejecutivo

### 1.1 Stack Seleccionado

| Capa               | Tecnología              | Versión             |
| ------------------ | ----------------------- | ------------------- |
| **Backend**        | TypeScript + NestJS     | TS 5.9.x, Nest 11.x |
| **Frontend**       | React + TypeScript      | React 19.x          |
| **Base de Datos**  | PostgreSQL              | 18.x                |
| **ORM**            | Prisma                  | 7.x                 |
| **Object Storage** | MinIO (dev) / S3 (prod) | -                   |
| **Contenedores**   | Docker + Docker Compose | 29.x                |
| **CI/CD**          | GitHub Actions          | -                   |
| **Testing**        | Vitest + Playwright     | -                   |
| **Observabilidad** | Sentry                  | -                   |

### 1.2 Principios de Selección

1. **Alineamiento con ADRs**: Cada elección respeta las decisiones arquitectónicas
2. **Productividad para equipo pequeño**: Un desarrollador debe poder mantener todo el stack
3. **Ecosistema maduro**: Librerías estables, documentación abundante, comunidad activa
4. **Soporte para DDD/Clean Architecture**: El framework debe facilitar, no obstaculizar
5. **Coste operacional bajo**: Preferencia por open source y servicios con tier gratuito

---

## 2. Backend

### 2.1 Lenguaje: TypeScript 5.9.x

**Seleccionado:** TypeScript

| Criterio                    | TypeScript   | C#/.NET      | Java/Spring   | Go        |
| --------------------------- | ------------ | ------------ | ------------- | --------- |
| Tipado estático             | ✅ Excelente | ✅ Excelente | ✅ Excelente  | ✅ Bueno  |
| Soporte DDD                 | ✅ Bueno     | ✅ Excelente | ✅ Excelente  | ⚠️ Manual |
| Full-stack (mismo lenguaje) | ✅ Sí        | ❌ No        | ❌ No         | ❌ No     |
| Curva aprendizaje           | ✅ Baja      | ⚠️ Media     | ⚠️ Media-Alta | ⚠️ Media  |
| Ecosistema npm              | ✅ Masivo    | N/A          | N/A           | ⚠️ Menor  |
| Tooling moderno             | ✅ Excelente | ✅ Bueno     | ⚠️ Pesado     | ✅ Bueno  |

**Justificación:**

- Tipado fuerte permite modelar Value Objects con precisión
- Mismo lenguaje en frontend y backend reduce context switching
- Decoradores nativos facilitan implementación de Clean Architecture
- Ecosistema npm ofrece librerías para casi cualquier necesidad
- Excelente soporte en IDEs (VS Code, WebStorm)

**Configuración recomendada (tsconfig.json):**

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2.2 Framework: NestJS 11.x

**Seleccionado:** NestJS

| Criterio               | NestJS             | Express    | Fastify    | Hono         |
| ---------------------- | ------------------ | ---------- | ---------- | ------------ |
| Arquitectura modular   | ✅ Nativa          | ❌ Manual  | ❌ Manual  | ❌ Manual    |
| Inyección dependencias | ✅ Nativa          | ❌ Externa | ❌ Externa | ❌ Externa   |
| OpenAPI/Swagger        | ✅ Integrado       | ⚠️ Manual  | ⚠️ Manual  | ⚠️ Manual    |
| Validación             | ✅ class-validator | ⚠️ Manual  | ⚠️ Manual  | ⚠️ Manual    |
| CQRS support           | ✅ @nestjs/cqrs    | ❌ No      | ❌ No      | ❌ No        |
| Documentación          | ✅ Excelente       | ✅ Buena   | ✅ Buena   | ⚠️ Creciendo |

**Justificación:**

- **Módulos nativos** → mapeo directo a Bounded Contexts (ADR-003)
- **Inyección de dependencias** → facilita Clean Architecture (ADR-009)
- **OpenAPI integrado** → documentación automática (ADR-010)
- **@nestjs/cqrs** → soporte para Command/Query separation
- **Guards y Interceptors** → implementación limpia de RBAC (ADR-007)

**Estructura de módulo alineada con ADR-003:**

```
src/
├── modules/
│   ├── membresia/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── dtos/
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── repositories/  (interfaces)
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   └── membresia.module.ts
```

### 2.3 Librerías Backend Complementarias

| Librería            | Propósito           | Versión                                              | ADR/RNF   |
| ------------------- | ------------------- | ---------------------------------------------------- | --------- |
| `@nestjs/passport`  | Autenticación       | 11.x                                                 | ADR-006   |
| `@nestjs/jwt`       | Tokens JWT          | 11.x                                                 | ADR-006   |
| `passport-jwt`      | Estrategia JWT      | 4.x                                                  | ADR-006   |
| `@nestjs/swagger`   | OpenAPI docs        | 11.x                                                 | ADR-010   |
| `class-validator`   | Validación DTOs     | 0.14.x                                               | RNF-008   |
| `class-transformer` | Serialización       | 0.5.x                                                | -         |
| `@nestjs/cqrs`      | CQRS pattern        | 11.x                                                 | ADR-009   |
| `@nestjs/schedule`  | Jobs programados    | 6.x                                                  | ADR-008   |
| `argon2`            | Hash passwords      | 0.44.x                                               | RNF-006   |
| `date-fns`          | Manipulación fechas | 4.x                                                  | -         |
| `sepa-xml`          | Generación SEPA     | 0.4.x _(pendiente de evaluación - posible abandono)_ | N4RF17-23 |

---

## 3. Frontend

### 3.1 Framework: React 19.x + TypeScript

**Seleccionado:** React

| Criterio          | React        | Vue 3     | Angular   | Svelte       |
| ----------------- | ------------ | --------- | --------- | ------------ |
| Ecosistema        | ✅ Masivo    | ✅ Grande | ✅ Grande | ⚠️ Creciendo |
| TypeScript        | ✅ Excelente | ✅ Bueno  | ✅ Nativo | ✅ Bueno     |
| Componentes UI    | ✅ Muchos    | ✅ Varios | ⚠️ Menos  | ⚠️ Pocos     |
| PWA support       | ✅ Maduro    | ✅ Bueno  | ✅ Bueno  | ⚠️ Manual    |
| Learning curve    | ⚠️ Media     | ✅ Baja   | ❌ Alta   | ✅ Baja      |
| Server Components | ✅ Sí        | ❌ No     | ❌ No     | ❌ No        |

**Justificación:**

- Ecosistema más grande = más soluciones probadas
- Excelente integración con TypeScript (mismo lenguaje que backend)
- Librerías de componentes maduras (MUI, Ant Design, shadcn/ui)
- React Query para gestión de estado servidor
- Soporte PWA maduro (RNF-056)

### 3.2 Build Tool y Routing: Vite + React Router

**Seleccionado:** Vite + React Router (sin meta-framework)

> **Nota:** Un _meta-framework_ es un framework construido sobre otro que añade convenciones y funcionalidades (ej: Next.js sobre React, Nuxt sobre Vue). Incluyen routing, SSR/SSG, data fetching patterns y optimizaciones integradas.

| Criterio         | Vite + RR     | Next.js      | Remix        |
| ---------------- | ------------- | ------------ | ------------ |
| Complejidad      | ✅ Baja       | ⚠️ Media     | ⚠️ Media     |
| SPA puro         | ✅ Ideal      | ⚠️ Posible   | ⚠️ Posible   |
| Build speed      | ✅ Muy rápido | ✅ Rápido    | ✅ Rápido    |
| Bundle size      | ✅ Óptimo     | ⚠️ Mayor     | ⚠️ Mayor     |
| Backend separado | ✅ Natural    | ⚠️ Conflicto | ⚠️ Conflicto |

**Justificación:**

- El backend es NestJS separado → no necesitamos SSR framework ni API routes integradas
- Vite ofrece HMR instantáneo y builds optimizados con ESBuild
- React Router v7 (paquete unificado `react-router`) para routing client-side
- Menor complejidad = menor mantenimiento
- Evitamos duplicidad de responsabilidades entre Next.js API routes y NestJS

### 3.3 Librerías Frontend

| Librería                | Propósito          | Versión | ADR/RNF     |
| ----------------------- | ------------------ | ------- | ----------- |
| `@tanstack/react-query` | Estado servidor    | 5.x     | RNF-015-016 |
| `react-router`          | Routing            | 7.x     | -           |
| `@mantine/core`         | Componentes UI     | 8.x     | RNF-045-047 |
| `@mantine/hooks`        | Hooks utilidad     | 8.x     | -           |
| `react-hook-form`       | Forms avanzados    | 7.x     | -           |
| `zod`                   | Validación schemas | 4.x     | RNF-008     |
| `axios`                 | HTTP client        | 1.x     | -           |
| `date-fns`              | Fechas             | 4.x     | -           |
| `react-i18next`         | i18n               | 16.x    | RNF-047     |
| `vite-plugin-pwa`       | PWA/Service Worker | 1.x     | RNF-056     |

### 3.4 UI Kit: Mantine

**Seleccionado:** Mantine

| Criterio        | Mantine     | MUI         | Ant Design  | shadcn/ui  |
| --------------- | ----------- | ----------- | ----------- | ---------- |
| Bundle size     | ✅ Ligero   | ❌ Pesado   | ❌ Pesado   | ✅ Ligero  |
| Customización   | ✅ Fácil    | ⚠️ Theme    | ⚠️ Theme    | ✅ Total   |
| Accesibilidad   | ✅ WCAG AA  | ✅ WCAG AA  | ✅ Buena    | ✅ WCAG AA |
| Componentes     | ✅ Completo | ✅ Completo | ✅ Completo | ⚠️ Básicos |
| Hooks incluidos | ✅ Sí       | ❌ No       | ❌ No       | ❌ No      |
| Dark mode       | ✅ Nativo   | ✅ Nativo   | ✅ Nativo   | ✅ Manual  |

**Justificación:**

- Bundle size ligero (importante para PWA)
- Accesibilidad WCAG AA incluida (RNF-046)
- Hooks de utilidad (@mantine/hooks) muy útiles
- Sistema de temas flexible
- Componentes para skeleton screens nativos (RNF-050)

---

## 4. Base de Datos

### 4.1 RDBMS: PostgreSQL 18.x

**Decisión heredada de ADR-005**

**Configuración multi-tenant (ADR-002):**

```
PostgreSQL Instance
├── associated_main          (BC-Identity: usuarios, tenants)
├── associated_tenant_001    (datos tenant 1)
├── associated_tenant_002    (datos tenant 2)
└── associated_tenant_XXX    (datos tenant N)
```

**Extensiones requeridas:**

- `uuid-ossp`: Generación de UUIDs
- `pg_trgm`: Búsqueda fuzzy (RNF-019)
- `pgcrypto`: Funciones criptográficas

### 4.2 ORM: Prisma 7.x

**Seleccionado:** Prisma

| Criterio      | Prisma         | TypeORM     | Drizzle      | MikroORM    |
| ------------- | -------------- | ----------- | ------------ | ----------- |
| Type safety   | ✅ Excelente   | ⚠️ Parcial  | ✅ Excelente | ✅ Bueno    |
| Migraciones   | ✅ Automáticas | ⚠️ Manuales | ⚠️ Manuales  | ✅ Buenas   |
| Multi-DB      | ✅ Soporte     | ✅ Soporte  | ✅ Soporte   | ✅ Soporte  |
| Query builder | ✅ Intuitivo   | ⚠️ Verbose  | ✅ SQL-like  | ⚠️ Complejo |
| Performance   | ✅ Bueno       | ⚠️ Variable | ✅ Excelente | ✅ Bueno    |
| DX            | ✅ Excelente   | ⚠️ Media    | ✅ Buena     | ⚠️ Media    |

**Justificación:**

- Generación automática de tipos TypeScript desde schema
- Migraciones versionadas y reproducibles (RNF-066)
- Prisma Studio para debugging
- Soporte nativo para múltiples datasources (multi-tenant)
- Excelente documentación

**Configuración multi-tenant:**

```typescript
// prisma/schema.prisma (main)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_MAIN_URL")
}

// Tenant datasource dinámico en runtime
const tenantPrisma = new PrismaClient({
  datasources: {
    db: { url: getTenantConnectionUrl(tenantId) }
  }
});
```

### 4.3 Caché: Sin caché dedicada (MVP)

Para el MVP, no se incluye Redis u otra caché dedicada. Se usará:

- Caché en memoria de Prisma (query results)
- HTTP caching headers
- React Query cache en frontend

**Evolución futura:** Redis/Valkey si métricas indican necesidad.

---

## 5. Infraestructura

### 5.1 Contenedores: Docker

**Seleccionado:** Docker + Docker Compose

**Justificación:**

- Entorno reproducible para desarrollo
- Mismo artefacto para dev/staging/prod
- Facilita onboarding de contributors
- Compatible con cualquier cloud provider

**docker-compose.yml (desarrollo):**

```yaml
services:
  api:
    build: ./api
    ports:
      - '3000:3000'
    environment:
      - DATABASE_MAIN_URL=postgresql://...
    depends_on:
      - postgres
      - minio

  web:
    build: ./web
    ports:
      - '5173:5173'

  postgres:
    image: postgres:18-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=dev_password

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### 5.2 Object Storage: MinIO / S3

**Decisión heredada de ADR-011**

| Entorno    | Solución               | Justificación                  |
| ---------- | ---------------------- | ------------------------------ |
| Desarrollo | MinIO                  | S3-compatible, local, gratuito |
| Producción | AWS S3 / Cloudflare R2 | Escalable, económico           |

**SDK:** `@aws-sdk/client-s3` (compatible con ambos)

### 5.3 Hosting Producción (Recomendado)

| Componente     | Servicio Recomendado      | Alternativa |
| -------------- | ------------------------- | ----------- |
| Backend        | Railway / Render          | Fly.io      |
| Frontend       | Vercel / Cloudflare Pages | Netlify     |
| PostgreSQL     | Railway / Supabase        | Neon        |
| Object Storage | Cloudflare R2             | AWS S3      |

**Justificación:**

- Servicios con tier gratuito o muy económico
- Despliegue automático desde GitHub
- Escalado automático si necesario
- SSL incluido

---

## 6. Testing

### 6.1 Estrategia (ADR-012)

```
Pirámide: 70% Unit / 20% Integration / 10% E2E
CI Gates: Line ≥80%, Branch ≥70%
```

### 6.2 Frameworks por Tipo

| Tipo               | Framework          | Scope                            |
| ------------------ | ------------------ | -------------------------------- |
| Unit (Domain)      | Vitest             | Aggregates, VOs, Domain Services |
| Unit (Application) | Vitest + mocks     | Command/Query Handlers           |
| Integration        | Vitest + Supertest | Controllers, Repositories        |
| Integration DB     | Testcontainers     | Repository con PostgreSQL real   |
| E2E                | Playwright         | Flujos críticos de usuario       |

**¿Por qué Vitest sobre Jest?**

| Criterio               | Vitest                  | Jest                    |
| ---------------------- | ----------------------- | ----------------------- |
| Velocidad              | ✅ Muy rápido (ESBuild) | ⚠️ Lento con TypeScript |
| Configuración con Vite | ✅ Compartida           | ❌ Duplicada            |
| ESM nativo             | ✅ Soporte completo     | ⚠️ Problemas frecuentes |
| API                    | ✅ Compatible con Jest  | ✅ Estándar             |
| Watch mode             | ✅ HMR instantáneo      | ⚠️ Lento                |

### 6.3 Configuración Testing

**Vitest (backend y frontend):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // 'jsdom' para frontend
    include: ['**/*.spec.ts', '**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.dto.ts', '**/*.module.ts', '**/index.ts', '**/*.config.ts'],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
```

**Playwright (E2E):**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
});
```

### 6.4 Testcontainers para Integration Tests

```typescript
// tests/setup/database.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:18-alpine').withDatabase('test_db').start();

  process.env.DATABASE_URL = container.getConnectionUri();
});

afterAll(async () => {
  await container.stop();
});
```

---

## 7. DevOps y CI/CD

### 7.1 Control de Versiones: Git + GitHub

**Estrategia de branching:** GitHub Flow (simplificado)

- `main`: producción, siempre deployable
- `feature/*`: desarrollo de features
- PRs obligatorias con review

### 7.2 CI: GitHub Actions

**Workflow principal (.github/workflows/ci.yml):**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18-alpine
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: ./api

      - name: Lint
        run: npm run lint
        working-directory: ./api

      - name: Unit Tests
        run: npm run test:unit -- --coverage
        working-directory: ./api

      - name: Integration Tests
        run: npm run test:integration
        working-directory: ./api
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Check Coverage
        uses: codecov/codecov-action@v4
        with:
          fail_ci_if_error: true
          flags: backend

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: ./web

      - name: Lint
        run: npm run lint
        working-directory: ./web

      - name: Type Check
        run: npm run typecheck
        working-directory: ./web

      - name: Unit Tests
        run: npm run test -- --coverage
        working-directory: ./web

      - name: Build
        run: npm run build
        working-directory: ./web

  e2e:
    needs: [backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E Tests
        run: npm run test:e2e
```

### 7.3 Quality Gates (RNF-058)

| Gate                | Umbral                  | Herramienta      |
| ------------------- | ----------------------- | ---------------- |
| Line Coverage       | ≥80%                    | Vitest + Codecov |
| Branch Coverage     | ≥70%                    | Vitest + Codecov |
| Diff Coverage (PRs) | ≥85% lines, ≥75% branch | Codecov          |
| Linting             | 0 errors                | ESLint           |
| Type Check          | 0 errors                | TypeScript       |
| Security Audit      | 0 critical/high         | npm audit        |

---

## 8. Herramientas de Desarrollo

### 8.1 IDE y Extensiones

**Recomendado:** VS Code

**Extensiones esenciales:**

- ESLint
- Prettier
- Prisma
- Thunder Client / REST Client
- GitLens
- Error Lens

### 8.2 Linting y Formatting

| Herramienta | Propósito      | Configuración        |
| ----------- | -------------- | -------------------- |
| ESLint      | Linting TS/JS  | @typescript-eslint   |
| Prettier    | Formatting     | .prettierrc          |
| Husky       | Git hooks      | pre-commit           |
| lint-staged | Lint on commit | Solo archivos staged |

**Configuración Husky + lint-staged:**

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 8.3 Documentación

| Tipo         | Herramienta                     |
| ------------ | ------------------------------- |
| API          | Swagger/OpenAPI (auto-generado) |
| Código       | TSDoc comments                  |
| Arquitectura | Markdown + Mermaid diagrams     |
| ADRs         | Markdown (ya existentes)        |

---

## 9. Servicios Externos

### 9.1 Email Transaccional

**Recomendado:** Resend

| Criterio    | Resend       | SendGrid | AWS SES           |
| ----------- | ------------ | -------- | ----------------- |
| Free tier   | 3k/mes       | 100/día  | 62k/mes (con EC2) |
| DX          | ✅ Excelente | ⚠️ Buena | ⚠️ Compleja       |
| React Email | ✅ Nativo    | ❌ No    | ❌ No             |
| Pricing     | Económico    | Caro     | Muy económico     |

**Justificación:**

- 3000 emails/mes gratis (suficiente para MVP)
- SDK TypeScript moderno
- Integración con React Email para templates
- Deliverability excelente

### 9.2 Pasarela de Pago (Opcional MVP)

**Recomendado para futuro:** Stripe

- API excelente
- Soporte SEPA Direct Debit
- Webhooks robustos
- Documentación ejemplar

### 9.3 Observabilidad: Sentry

**Seleccionado:** Sentry

| Criterio           | Sentry            | Datadog         | New Relic       |
| ------------------ | ----------------- | --------------- | --------------- |
| Free tier          | ✅ 5k eventos/mes | ❌ Muy limitado | ❌ Muy limitado |
| Error tracking     | ✅ Excelente      | ✅ Bueno        | ✅ Bueno        |
| Performance        | ✅ Incluido       | ✅ Incluido     | ✅ Incluido     |
| Session replay     | ✅ Incluido       | ⚠️ Extra        | ⚠️ Extra        |
| SDK TypeScript     | ✅ Excelente      | ✅ Bueno        | ⚠️ Medio        |
| Integración NestJS | ✅ Oficial        | ⚠️ Manual       | ⚠️ Manual       |

**Justificación:**

- Free tier suficiente para MVP (5k eventos/mes)
- SDK oficial para NestJS y React
- Captura automática de errores con contexto completo
- Performance monitoring incluido (traces, bottlenecks)
- Release tracking: correlaciona errores con deploys
- Source maps para stack traces legibles

**Funcionalidades a utilizar:**

| Funcionalidad  | Propósito                           | RNF         |
| -------------- | ----------------------------------- | ----------- |
| Error Tracking | Captura excepciones con contexto    | RNF-064     |
| Performance    | Traces de transacciones, latencias  | RNF-015-016 |
| Release Health | Correlación errores/deploys         | RNF-064     |
| User Context   | Identificar tenant/usuario afectado | RNF-004     |

**Integración backend (NestJS):**

```typescript
// main.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
```

**Integración frontend (React):**

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

### 9.4 Servicios Complementarios (Post-MVP)

| Servicio      | Propósito            | Cuándo incorporar                   |
| ------------- | -------------------- | ----------------------------------- |
| Better Uptime | Uptime monitoring    | Producción con usuarios reales      |
| Axiom/Loki    | Logging centralizado | Si Sentry no es suficiente          |
| PostHog       | Product analytics    | Cuando se necesiten métricas de uso |

---

## 10. Matriz de Decisiones

### 10.1 Tecnología → ADR/RNF

| Tecnología          | ADRs             | RNFs                      |
| ------------------- | ---------------- | ------------------------- |
| TypeScript + NestJS | ADR-001, ADR-009 | RNF-057                   |
| Módulos NestJS      | ADR-003          | -                         |
| @nestjs/cqrs        | ADR-009          | -                         |
| JWT + Passport      | ADR-006          | RNF-001, RNF-002          |
| Guards NestJS       | ADR-007          | RNF-003, RNF-013          |
| PostgreSQL          | ADR-005          | RNF-004, RNF-038          |
| Prisma              | ADR-002, ADR-005 | RNF-066                   |
| React + Mantine     | ADR-010          | RNF-045, RNF-046, RNF-050 |
| React Query         | -                | RNF-015, RNF-016          |
| MinIO/S3            | ADR-011          | RNF-009, RNF-022          |
| Vitest + Playwright | ADR-012          | RNF-058, RNF-059, RNF-060 |
| Sentry              | -                | RNF-064                   |
| GitHub Actions      | -                | RNF-058 (CI gates)        |
| Docker              | ADR-001          | RNF-065                   |

### 10.2 Resumen de Versiones

```
# Runtime
node: 22.x LTS
typescript: 5.9.x
nestjs: 11.x
react: 19.x
postgresql: 18.x
prisma: 7.x

# Testing
vitest: 4.x
playwright: 1.58.x
testcontainers: 11.x

# Observabilidad
sentry: 10.x

# Build
vite: 7.x
docker: 29.x

# CI
github-actions: latest
codecov: v4
```

---

## Trazabilidad

### Matriz Categoría → Selección

| Categoría                | Selección Principal | Alternativa Considerada |
| ------------------------ | ------------------- | ----------------------- |
| Lenguaje Backend         | TypeScript          | C#, Java, Go            |
| Framework Backend        | NestJS              | Express, Fastify        |
| Lenguaje Frontend        | TypeScript          | -                       |
| Framework Frontend       | React               | Vue, Angular            |
| Build Tool               | Vite                | Next.js, Webpack        |
| UI Kit                   | Mantine             | MUI, shadcn/ui          |
| Base de Datos            | PostgreSQL          | MySQL, MongoDB          |
| ORM                      | Prisma              | TypeORM, Drizzle        |
| Testing Unit/Integration | Vitest              | Jest                    |
| Testing E2E              | Playwright          | Cypress                 |
| Observabilidad           | Sentry              | Datadog, New Relic      |
| CI/CD                    | GitHub Actions      | GitLab CI               |
| Contenedores             | Docker              | Podman                  |

---

## Changelog

- v1.1 (Feb 2026): Actualización de versiones del stack
  - Actualización masiva de versiones: Node.js 22, NestJS 11, React 19, PostgreSQL 18, Prisma 7, Vite 7, Docker 29, Vitest 4, Playwright 1.58, Sentry 10
  - Reemplazo de `bcrypt` por `argon2` 0.44.x para hash de contraseñas
  - Eliminación de dependencia `uuid` (uso de `crypto.randomUUID()` nativo de Node.js 22)
  - Cambio de `react-router-dom` 6.x a `react-router` 7.x (paquete unificado)
  - Cambio de `workbox` a `vite-plugin-pwa` 1.x
  - Actualización de Mantine 7.x a 8.x, Zod 3.x a 4.x, date-fns 3.x a 4.x, react-i18next 14.x a 16.x
  - Corrección de rutas en CI YAML: `./backend` → `./api`, `./frontend` → `./web`
  - Eliminación de `version: '3.8'` en docker-compose (obsoleto en Docker Compose v2)
  - Marcado de `sepa-xml` como pendiente de evaluación
- v1.0 (Feb 2026): Versión inicial
  - Stack definido alineado con ADRs
  - TypeScript full-stack (NestJS + React)
  - PostgreSQL + Prisma para persistencia
  - Testing con Vitest + Playwright (Vitest por velocidad y compatibilidad ESM)
  - Sentry como framework de observabilidad (RNF-064)
  - CI/CD con GitHub Actions
  - Aclaración sobre Build Tool vs Meta-framework
