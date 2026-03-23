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

## Navegación

Cada sección del stack se encuentra en `stack/{seccion}.md`.
Secciones: backend, frontend, base-de-datos, infraestructura, testing, devops-ci-cd, herramientas, servicios.
