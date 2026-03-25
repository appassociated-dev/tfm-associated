# Auditoría de Versiones del Stack Tecnológico

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Fecha de auditoría:** Febrero 2026
**Documento auditado:** spec/ → Stack Tecnológico (KB-006)
**Dependencias analizadas:** 43
**Fuentes:** npm registry, nodejs.org, postgresql.org, docs.docker.com

---

## 1. Resumen Ejecutivo

La especificación del stack fue redactada con información anterior a mediados de 2025. De las 43 dependencias analizadas:

| Estado                             | Cantidad | %   |
| ---------------------------------- | -------- | --- |
| ❌ Major desactualizada            | **22**   | 51% |
| ⚠️ Minor desactualizada / Atención | **4**    | 9%  |
| ✅ Actualizada                     | **14**   | 33% |
| 🔄 Reemplazada                     | **1**    | 2%  |
| Sin especificar (solo referencia)  | **2**    | 5%  |

**Hallazgo crítico:** Node.js 20.x LTS entra en **End-of-Life en abril 2026** (2 meses). Es la actualización más urgente.

---

## 2. Auditoría Detallada por Capas

### Capa 0: Runtime

| Paquete     | En spec  | Actual                  | Estado   | Notas                                                                                   |
| ----------- | -------- | ----------------------- | -------- | --------------------------------------------------------------------------------------- |
| **Node.js** | 20.x LTS | **22.x LTS** / 24.x LTS | ❌ Major | Node 20 EOL en abril 2026. Migrar a 22 LTS (mantenimiento hasta abril 2027) como mínimo |

### Capa 1: Lenguaje

| Paquete        | En spec | Actual    | Estado   | Notas                                                                                 |
| -------------- | ------- | --------- | -------- | ------------------------------------------------------------------------------------- |
| **TypeScript** | 5.4.x   | **5.9.x** | ⚠️ Minor | Sin breaking changes dentro de 5.x. TS 6.0 en beta (no estable). Actualización segura |

### Capa 2: Frameworks Principales

| Paquete          | En spec | Actual                             | Estado   | Breaking changes clave                                                                            |
| ---------------- | ------- | ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| **@nestjs/core** | 10.x    | **11.x**                           | ❌ Major | Express v5 integrado, CacheModule reescrito con Keyv, cambios en route matching y Reflector       |
| **react**        | 18.x    | **19.x**                           | ❌ Major | Elimina ReactDOM.render, ref como prop directo, forwardRef innecesario, PropTypes eliminado       |
| **vite**         | 5.x     | **7.x**                            | ❌ Major | Dos saltos major (5→6→7). Requiere Node 20+, elimina Sass legacy API, cambia build target default |
| **PostgreSQL**   | 16.x    | **18.x** (16.12 sigue con parches) | ⚠️ Minor | PG 16.12 sigue recibiendo parches de seguridad. Se puede mantener en 16.x o subir a 17/18         |

### Capa 3: ORM y State

| Paquete                         | En spec | Actual     | Estado         | Breaking changes clave                                                                                          |
| ------------------------------- | ------- | ---------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| **prisma** / **@prisma/client** | 5.x     | **7.x**    | ❌ Major       | Dos saltos (5→6→7). ESM-only, requiere driver adapters, nuevo `prisma.config.ts`, elimina middleware de cliente |
| **@tanstack/react-query**       | 5.x     | **5.90.x** | ✅ Actualizada | Misma major. Sin breaking changes                                                                               |

### Capa 4: UI Kit

| Paquete            | En spec | Actual  | Estado   | Breaking changes clave                                                                                                 |
| ------------------ | ------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| **@mantine/core**  | 7.x     | **8.x** | ❌ Major | @mantine/dates usa strings ISO, elimina data-hovered en Menu, Portal hideDetached por defecto, CodeHighlight reescrito |
| **@mantine/hooks** | 7.x     | **8.x** | ❌ Major | Alineado con Mantine 8                                                                                                 |
| **@mantine/form**  | 7.x     | **8.x** | ❌ Major | Alineado con Mantine 8                                                                                                 |

### Capa 5: Librerías NestJS

| Paquete              | En spec | Actual   | Estado   | Notas                                       |
| -------------------- | ------- | -------- | -------- | ------------------------------------------- |
| **@nestjs/passport** | 10.x    | **11.x** | ❌ Major | Alineado con NestJS 11                      |
| **@nestjs/jwt**      | 10.x    | **11.x** | ❌ Major | Alineado con NestJS 11                      |
| **@nestjs/swagger**  | 7.x     | **11.x** | ❌ Major | Salto de 7.x a 11.x (alineamiento con core) |
| **@nestjs/cqrs**     | 10.x    | **11.x** | ❌ Major | Alineado con NestJS 11                      |
| **@nestjs/schedule** | 4.x     | **6.x**  | ❌ Major | Dos saltos major (4→5→6)                    |

> **Nota:** Todos los paquetes `@nestjs/*` se alinearon en versión 11 con el lanzamiento de NestJS 11. Deben migrarse **todos juntos**.

### Capa 6: Librerías Backend

| Paquete               | En spec                      | Actual     | Estado         | Notas                                                                                  |
| --------------------- | ---------------------------- | ---------- | -------------- | -------------------------------------------------------------------------------------- |
| **passport-jwt**      | 4.x                          | **4.0.1**  | ✅ Actualizada | Poco mantenimiento pero funcional                                                      |
| **class-validator**   | 0.14.x                       | **0.14.3** | ✅ Actualizada | Misma minor                                                                            |
| **class-transformer** | 0.5.x                        | **0.5.1**  | ✅ Actualizada | Modo mantenimiento                                                                     |
| **bcrypt**            | 5.x                          | **6.x**    | ❌ Major       | Major bump. Pero el scaffold ya usa **argon2** en su lugar                             |
| **argon2**            | (no en spec, sí en scaffold) | **0.44.x** | ✅ Referencia  | Recomendado sobre bcrypt (UC-002 lo especifica)                                        |
| **uuid**              | 9.x                          | **13.x**   | ❌ Major       | Cuatro saltos major (9→13). Desde v12 no soporta CommonJS                              |
| **date-fns**          | 3.x                          | **4.x**    | ❌ Major       | ESM-first, añade time zones. API mayormente compatible                                 |
| **sepa-xml**          | 0.4.x                        | **0.6.x**  | ⚠️ Abandonado  | Sin releases desde ~2020. Evaluar alternativas: `sepa` (2.1.0) o `sepa-js-xml` (3.1.1) |

### Capa 7: Librerías Frontend

| Paquete                       | En spec           | Actual             | Estado         | Notas                                                                                                         |
| ----------------------------- | ----------------- | ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------- |
| **react-router-dom**          | 6.x               | -                  | 🔄 Reemplazada | Reemplazado por **`react-router`** 7.x (paquete unificado). Migración gradual con future flags en v6          |
| **react-hook-form**           | 7.x               | **7.71.x**         | ✅ Actualizada | Misma major                                                                                                   |
| **zod**                       | 3.x               | **4.x**            | ❌ Major       | Cambia API de errores, UUID validation estricta, ZodError.errors→.issues. Coexiste vía `import from "zod/v4"` |
| **axios**                     | 1.x               | **1.13.x**         | ✅ Actualizada | Misma major                                                                                                   |
| **react-i18next**             | 14.x              | **16.x**           | ❌ Major       | Dos saltos (14→15→16). v16 requiere i18next >= 19.4.5                                                         |
| **i18next**                   | (no especificada) | **25.x**           | ✅ Referencia  | Actualizar junto con react-i18next                                                                            |
| **workbox / vite-plugin-pwa** | 7.x               | **1.2.x** (plugin) | ⚠️ Verificar   | vite-plugin-pwa 1.2.x usa workbox 7 internamente. Nomenclatura diferente                                      |

### Capa 8: Testing

| Paquete                        | En spec           | Actual     | Estado        | Notas                                                                                          |
| ------------------------------ | ----------------- | ---------- | ------------- | ---------------------------------------------------------------------------------------------- |
| **vitest**                     | 2.x               | **4.x**    | ❌ Major      | Dos saltos (2→3→4). Requiere Vite 7. Cambia poolOptions, mock behavior, elimina basic reporter |
| **@playwright/test**           | 1.42.x            | **1.58.x** | ⚠️ Minor      | Misma major, muchas mejoras. Actualización segura                                              |
| **@testcontainers/postgresql** | 10.x              | **11.x**   | ❌ Major      | Major bump                                                                                     |
| **supertest**                  | (no especificada) | **7.x**    | ✅ Referencia | -                                                                                              |

### Capa 9: Observabilidad

| Paquete            | En spec      | Actual   | Estado        | Notas                                                                 |
| ------------------ | ------------ | -------- | ------------- | --------------------------------------------------------------------- |
| **@sentry/node**   | 8.x          | **10.x** | ❌ Major      | Dos saltos (8→9→10)                                                   |
| **@sentry/react**  | 8.x          | **10.x** | ❌ Major      | Dos saltos (8→9→10)                                                   |
| **@sentry/nestjs** | (no en spec) | **10.x** | ✅ Referencia | Paquete dedicado para NestJS. Recomendado sobre @sentry/node genérico |

### Capa 10: Herramientas de Desarrollo

| Paquete         | En spec           | Actual    | Estado        | Notas                                  |
| --------------- | ----------------- | --------- | ------------- | -------------------------------------- |
| **eslint**      | (no especificada) | **10.x**  | ✅ Referencia | Flat config obligatorio desde ESLint 9 |
| **prettier**    | (no especificada) | **3.8.x** | ✅ Referencia | -                                      |
| **husky**       | (no especificada) | **9.x**   | ✅ Referencia | -                                      |
| **lint-staged** | (no especificada) | **16.x**  | ✅ Referencia | -                                      |

### Capa 11: Infraestructura

| Paquete                | En spec           | Actual      | Estado        | Notas                                                             |
| ---------------------- | ----------------- | ----------- | ------------- | ----------------------------------------------------------------- |
| **Docker Engine**      | 24.x              | **29.x**    | ❌ Major      | Múltiples saltos (24→29). Containerd image store ahora es default |
| **@aws-sdk/client-s3** | (no especificada) | **3.995.x** | ✅ Referencia | SDK v3 con actualizaciones continuas                              |

---

## 3. Problemas Adicionales Detectados

### 3.1 Conflicto bcrypt vs argon2

La spec documenta `bcrypt 5.x` para hashing de passwords (RNF-006), pero el scaffold de fase-0 indica explícitamente:

> _"argon2 (en lugar de bcrypt - UC-002 especifica Argon2)"_

**Acción:** Reemplazar `bcrypt` por `argon2` en la spec del stack.

### 3.2 sepa-xml abandonado

El paquete `sepa-xml 0.4.x` no ha tenido releases en ~6 años. Para un proyecto que depende de generación SEPA XML (N4RF17-23), esto es un riesgo significativo.

**Alternativas a evaluar:**

- `sepa` (2.1.0) - más activo
- `sepa-js-xml` (3.1.1) - generación pain.008
- Implementación propia del XML ISO 20022 (más control)

### 3.3 react-router-dom → react-router

En React Router v7, los paquetes `react-router-dom` y `react-router` se unificaron en un solo paquete `react-router`. La spec debería reflejar este cambio.

### 3.4 uuid y ESM

Desde `uuid` v12, el paquete es ESM-only y no soporta CommonJS. Si NestJS se mantiene con CommonJS (que es el default), hay que evaluar si `uuid` 13.x es compatible o si se necesita `crypto.randomUUID()` nativo de Node.js (disponible desde Node 19).

### 3.5 Vitest requiere Vite alineado

Vitest 4.x requiere Vite 7.x. Estas dos dependencias **deben actualizarse juntas**. No se puede tener Vitest 4 con Vite 5.

---

## 4. Plan de Migración Recomendado

La migración debe respetar el orden de dependencias. No se puede actualizar una librería que depende de un framework sin actualizar primero el framework.

### Fase M1: Runtime y lenguaje (sin riesgo de breaking)

```
Node.js 20.x → 22.x LTS          [URGENTE: EOL abril 2026]
TypeScript 5.4.x → 5.9.x          [seguro, sin breaking changes]
```

### Fase M2: Backend framework (cascada NestJS)

```
@nestjs/core 10 → 11
@nestjs/passport 10 → 11
@nestjs/jwt 10 → 11
@nestjs/swagger 7 → 11
@nestjs/cqrs 10 → 11
@nestjs/schedule 4 → 6
```

> Todos los @nestjs/\* se migran juntos en un solo paso.

### Fase M3: Frontend framework (cascada React)

```
react 18 → 19
react-router-dom 6 → react-router 7     [cambio de paquete]
```

### Fase M4: Build tools (cascada Vite + Vitest)

```
vite 5 → 7
vitest 2 → 4                             [requiere Vite 7]
```

### Fase M5: ORM

```
prisma 5 → 7                             [ESM-only, cambio significativo]
```

### Fase M6: UI Kit (cascada Mantine)

```
@mantine/core 7 → 8
@mantine/hooks 7 → 8
@mantine/form 7 → 8
```

### Fase M7: Librerías individuales (orden libre)

```
zod 3 → 4
react-i18next 14 → 16 + i18next actualizado
date-fns 3 → 4
uuid 9 → 13                              [evaluar ESM vs crypto.randomUUID()]
bcrypt 5 → eliminar (usar argon2)
@sentry/node 8 → @sentry/nestjs 10 + @sentry/react 10
@testcontainers/postgresql 10 → 11
@playwright/test 1.42 → 1.58
sepa-xml 0.4 → evaluar alternativas
```

### Fase M8: Infraestructura

```
Docker 24 → 29
PostgreSQL 16 → 17 o 18                  [opcional, 16.12 sigue con parches]
ESLint → 10 con flat config
```

---

## 5. Versiones Propuestas para la Spec Actualizada

### Resumen de versiones (spec actual → propuesta)

```
# Runtime
node: 20.x LTS        → 22.x LTS
typescript: 5.4.x     → 5.9.x

# Backend
nestjs: 10.x          → 11.x
@nestjs/passport: 10.x → 11.x
@nestjs/jwt: 10.x     → 11.x
@nestjs/swagger: 7.x  → 11.x
@nestjs/cqrs: 10.x    → 11.x
@nestjs/schedule: 4.x → 6.x
passport-jwt: 4.x     → 4.x (sin cambio)
class-validator: 0.14.x → 0.14.x (sin cambio)
class-transformer: 0.5.x → 0.5.x (sin cambio)
bcrypt: 5.x           → ELIMINAR (reemplazar por argon2)
argon2: (nuevo)        → 0.44.x
uuid: 9.x             → 13.x (o crypto.randomUUID nativo)
date-fns: 3.x         → 4.x
sepa-xml: 0.4.x       → EVALUAR alternativas

# Frontend
react: 18.x           → 19.x
vite: 5.x             → 7.x
react-router-dom: 6.x → react-router 7.x (cambio de paquete)
@mantine/core: 7.x    → 8.x
@mantine/hooks: 7.x   → 8.x
@mantine/form: 7.x    → 8.x
@tanstack/react-query: 5.x → 5.x (sin cambio)
react-hook-form: 7.x  → 7.x (sin cambio)
zod: 3.x              → 4.x
axios: 1.x            → 1.x (sin cambio)
react-i18next: 14.x   → 16.x
workbox: 7.x          → vite-plugin-pwa 1.x (usa workbox 7 internamente)

# Testing
vitest: 2.x           → 4.x
playwright: 1.42.x    → 1.58.x
testcontainers: 10.x  → 11.x

# Observabilidad
@sentry/node: 8.x     → @sentry/nestjs 10.x (cambio de paquete)
@sentry/react: 8.x    → @sentry/react 10.x

# Base de datos
postgresql: 16.x      → 17.x (o mantener 16.12)
prisma: 5.x           → 7.x

# Infraestructura
docker: 24.x          → 29.x
```
