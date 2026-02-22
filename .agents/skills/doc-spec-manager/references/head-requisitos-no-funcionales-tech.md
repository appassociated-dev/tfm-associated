# Requisitos No Funcionales Técnicos

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Inputs:** KB-004 (RNF Base), KB-007 (Stack Tecnológico)  
**Estado:** Borrador

---

## Índice

1. [Introducción](#1-introducción)
2. [Seguridad](#2-seguridad)
3. [Rendimiento](#3-rendimiento)
4. [Disponibilidad y Continuidad](#4-disponibilidad-y-continuidad)
5. [Usabilidad y Experiencia de Usuario](#5-usabilidad-y-experiencia-de-usuario)
6. [Mantenibilidad y Operaciones](#6-mantenibilidad-y-operaciones)
7. [Matriz de Trazabilidad](#7-matriz-de-trazabilidad)

---

## 1. Introducción

Este documento concreta los RNFs agnósticos definidos en KB-004 con las tecnologías específicas seleccionadas en KB-007. Para cada RNF se especifican:

- **Implementación técnica**: Cómo se implementa con el stack seleccionado
- **Configuración**: Parámetros y settings específicos
- **Métricas**: Valores medibles y herramientas de verificación
- **Verificación**: Cómo validar el cumplimiento

### 1.1 Stack de Referencia

| Capa | Tecnología | Versión |
|------|------------|---------|
| Backend | NestJS + TypeScript | 10.x / 5.x |
| Frontend | React + Mantine | 18.x / 7.x |
| Base de Datos | PostgreSQL + Prisma | 16.x / 5.x |
| Testing | Vitest + Playwright | 2.x / 1.42.x |
| Observabilidad | Sentry | 8.x |
| CI/CD | GitHub Actions | - |

---

## 7. Matriz de Trazabilidad

### 7.1 RNF Base → RNF Técnico

| RNF Base | RNF Técnico | Tecnología |
|----------|-------------|------------|
| RNF-001 | RNFT-001 | NestJS + Passport + JWT |
| RNF-002 | RNFT-002 | JWT + Refresh Tokens |
| RNF-003 | RNFT-003 | NestJS Guards + RBAC |
| RNF-004 | RNFT-004 | Prisma + PostgreSQL multi-DB |
| RNF-005 | RNFT-005 | Helmet + TLS |
| RNF-006 | RNFT-006 | bcrypt + AES-256 |
| RNF-007 | RNFT-007 | Prisma Middleware |
| RNF-008 | RNFT-008 | Helmet + ValidationPipe |
| RNF-015 | RNFT-015 | Vite + React + Lighthouse |
| RNF-016 | RNFT-016 | NestJS + Sentry Performance |
| RNF-017 | RNFT-017 | Prisma Connection Pool |
| RNF-018 | RNFT-018 | Prisma Batch + Bull |
| RNF-019 | RNFT-019 | PostgreSQL + pg_trgm |
| RNF-021 | RNFT-021 | React Query |
| RNF-037 | RNFT-037 | NestJS Health Checks |
| RNF-038 | RNFT-038 | pg_dump + S3 |
| RNF-042 | RNFT-042 | Sentry |
| RNF-045 | RNFT-045 | Mantine Responsive |
| RNF-046 | RNFT-046 | Mantine + axe-core |
| RNF-050 | RNFT-050 | Mantine Skeleton |
| RNF-056 | RNFT-056 | Vite PWA + Workbox |
| RNF-057 | RNFT-057 | @nestjs/swagger |
| RNF-058 | RNFT-058 | Vitest + Codecov |
| RNF-059 | RNFT-059 | Testcontainers |
| RNF-060 | RNFT-060 | Playwright |
| RNF-061 | RNFT-061 | NestJS Logger + Sentry |
| RNF-066 | RNFT-066 | Prisma Migrate |

### 7.2 Tecnología → RNFs Implementados

| Tecnología | RNFs Técnicos |
|------------|---------------|
| NestJS | RNFT-001, 002, 003, 005, 008, 016, 037, 057, 061 |
| Prisma | RNFT-004, 006, 007, 017, 018, 019, 066 |
| React + Mantine | RNFT-015, 021, 045, 046, 050 |
| PostgreSQL | RNFT-004, 019, 038 |
| Vitest | RNFT-058, 059 |
| Playwright | RNFT-060 |
| Sentry | RNFT-016, 042, 061 |
| Vite | RNFT-015, 056 |

---

## Navegación

Cada RNFT se encuentra en `rnft/rnft-{xxx}.md`.
Ejemplo: `references/rnft/rnft-001.md` para RNFT-001.
