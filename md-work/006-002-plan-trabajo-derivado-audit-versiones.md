# Plan de Trabajo Derivado de la Auditoría de Versiones del Stack

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Fecha:** Febrero 2026
**Input:** `md-work/005-002-reporte-auditoria-versiones-stack.md`
**Objetivo:** Actualizar toda la documentación del proyecto para reflejar las versiones correctas del stack
**Contexto:** El proyecto está en fase de definición. No existe código implementado.

---

## Resumen de Impacto

### Documentos afectados

| Documento                                                | Tipo de cambio                                                                                                                     | Impacto |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `spec/007_stack.md`                                      | **Masivo** - Versiones en tablas, código de referencia, YAML de CI                                                                 | Alto    |
| `spec/008_rnf-tecnicos.md`                               | **Significativo** - Tabla de stack de referencia, bcrypt→argon2, react-router-dom, postgres:16→18 en Testcontainers, vendor chunks | Alto    |
| `doc/design/mvp/fase-0-scaffold.md`                      | **Significativo** - Node.js 20→22, react-router-dom, dependencias de instalación                                                   | Alto    |
| `doc/design/mvp/fase-1/**` (17 docs)                     | **Menor** - Solo scaffold references afectan indirectamente, no hay versiones explícitas en la mayoría                             | Bajo    |
| `doc/design/mvp/fase-2/**` (13 docs)                     | **Menor** - Ídem                                                                                                                   | Bajo    |
| `doc/design/mvp/fase-3/**` (4 docs)                      | **Menor** - Ídem                                                                                                                   | Bajo    |
| `md-work/001-003-analisis_plan_mvp.md`                   | **Ninguno** - Sin referencias a versiones                                                                                          | Nulo    |
| `md-work/003-002-reporte-skills-recomendados.md`         | **Rehacer completo** - Versiones obsoletas, gaps incorrectos (skills disponibles no detectados)                                    | Alto    |
| `md-work/004-002-reporte-scopes-instrucciones-skills.md` | **Moderado** - Versiones en instrucciones propuestas para cada scope                                                               | Medio   |
| `.claude/skills/doc-spec-manager/references/**`          | **Regeneración completa** - Deben regenerarse tras cambios en spec/                                                                | Alto    |

### Documentos NO afectados

| Documento                              | Motivo                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `spec/003_requisitos-funcionales.md`   | Sin referencias a versiones                                             |
| `spec/004_rnf-base.md`                 | RNFs agnósticos de tecnología                                           |
| `spec/005_modelo-dominio.md`           | Modelo de dominio independiente del stack                               |
| `spec/006_adrs.md`                     | ADRs con decisiones de tecnología nombran tecnologías pero no versiones |
| `spec/009_user-stories.md`             | Sin referencias a versiones                                             |
| `spec/010_casos-uso.md`                | Sin referencias a versiones                                             |
| `md-work/001-003-analisis_plan_mvp.md` | Solo análisis de UCs y dependencias entre fases                         |

---

## Plan de Trabajo

### Fase T1: Actualización de spec/007_stack.md

**Prioridad:** Urgente - Es el documento fuente del que depende todo lo demás.
**Herramienta:** skill `doc-spec-generator`
**Dependencias:** Ninguna (es el punto de partida)

#### T1.1: Sección 1 - Resumen Ejecutivo (tabla principal)

**Líneas afectadas:** ~30-41

| Campo                        | Valor actual      | Valor nuevo       |
| ---------------------------- | ----------------- | ----------------- |
| Backend: TypeScript + NestJS | TS 5.x, Nest 10.x | TS 5.x, Nest 11.x |
| Frontend: React + TypeScript | React 18.x        | React 19.x        |
| ORM: Prisma                  | 5.x               | 7.x               |
| Contenedores: Docker         | 24.x              | 29.x              |

Nota: Node.js aparece implícitamente; verificar si hay referencia directa.

#### T1.2: Sección 2 - Backend

**Líneas afectadas:** ~54, 87-144

| Cambio                           | Detalle                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Título "TypeScript 5.x"          | Cambiar a "TypeScript 5.9.x" (especificar minor para claridad)                |
| Título "NestJS 10.x"             | Cambiar a "NestJS 11.x"                                                       |
| Tabla de librerías backend (2.3) | Actualizar 12 filas según reporte de auditoría                                |
| **bcrypt** fila completa         | **ELIMINAR** y reemplazar por `argon2 0.44.x` (alinear con scaffold y UC-002) |
| **sepa-xml**                     | Marcar como pendiente de evaluación o reemplazar por alternativa              |
| Texto de justificación NestJS    | Verificar que no cite features de v10 que hayan cambiado                      |

**Detalle de la tabla de librerías backend (2.3):**

| Librería            | Actual en spec | Nuevo valor                                                    | Notas                   |
| ------------------- | -------------- | -------------------------------------------------------------- | ----------------------- |
| `@nestjs/passport`  | 10.x           | 11.x                                                           |                         |
| `@nestjs/jwt`       | 10.x           | 11.x                                                           |                         |
| `passport-jwt`      | 4.x            | 4.x                                                            | Sin cambio              |
| `@nestjs/swagger`   | 7.x            | 11.x                                                           |                         |
| `class-validator`   | 0.14.x         | 0.14.x                                                         | Sin cambio              |
| `class-transformer` | 0.5.x          | 0.5.x                                                          | Sin cambio              |
| `@nestjs/cqrs`      | 10.x           | 11.x                                                           |                         |
| `@nestjs/schedule`  | 4.x            | 6.x                                                            |                         |
| `bcrypt`            | 5.x            | **ELIMINAR**                                                   | Reemplazar por argon2   |
| `argon2`            | (nuevo)        | 0.44.x                                                         | Añadir fila             |
| `uuid`              | 9.x            | **ELIMINAR** (usar `crypto.randomUUID()` nativo de Node.js 22) | Elimina dependencia     |
| `date-fns`          | 3.x            | 4.x                                                            |                         |
| `sepa-xml`          | 0.4.x          | Evaluar alternativas                                           | Añadir nota de abandono |

#### T1.3: Sección 3 - Frontend

**Líneas afectadas:** ~150-206

| Cambio                            | Detalle                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| Título "React 18.x"               | Cambiar a "React 19.x"                                                                        |
| Sección 3.2 "Vite + React Router" | Actualizar texto: Vite 7.x, react-router 7.x (ya no `react-router-dom` como paquete separado) |
| Justificación "React Router v6"   | Actualizar a "React Router v7 (paquete unificado `react-router`)"                             |
| Tabla de librerías frontend (3.3) | Actualizar todas las filas afectadas                                                          |

**Detalle de la tabla de librerías frontend (3.3):**

| Librería                | Actual en spec | Nuevo valor          | Notas             |
| ----------------------- | -------------- | -------------------- | ----------------- |
| `@tanstack/react-query` | 5.x            | 5.x                  | Sin cambio        |
| `react-router-dom`      | 6.x            | **react-router** 7.x | Cambio de paquete |
| `@mantine/core`         | 7.x            | 8.x                  |                   |
| `@mantine/hooks`        | 7.x            | 8.x                  |                   |
| `@mantine/form`         | 7.x            | 8.x                  |                   |
| `react-hook-form`       | 7.x            | 7.x                  | Sin cambio        |
| `zod`                   | 3.x            | 4.x                  |                   |
| `axios`                 | 1.x            | 1.x                  | Sin cambio        |
| `date-fns`              | 3.x            | 4.x                  |                   |
| `react-i18next`         | 14.x           | 16.x                 |                   |
| `workbox`               | 7.x            | vite-plugin-pwa 1.x  | Clarificar        |

#### T1.4: Sección 4 - Base de Datos

**Líneas afectadas:** ~231-267

| Cambio                   | Detalle                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| Título "PostgreSQL 16.x" | Cambiar a "PostgreSQL 18.x"                                                 |
| Título "Prisma 5.x"      | Cambiar a "Prisma 7.x"                                                      |
| Código Prisma            | Actualizar si la API de Prisma 7 ha cambiado (ESM-only, `prisma.config.ts`) |
| Imagen Docker en ejemplo | `postgres:16-alpine` → `postgres:18-alpine`                                 |

**Decisión tomada:** PostgreSQL 18.x. Al no existir código implementado, se adopta directamente la versión más reciente.

#### T1.5: Sección 5 - Infraestructura

**Líneas afectadas:** ~296-346

| Cambio                | Detalle                                                     |
| --------------------- | ----------------------------------------------------------- |
| docker-compose.yml    | Actualizar imagen PostgreSQL, verificar sintaxis Docker 29  |
| Nota `version: '3.8'` | Docker Compose v2 ya no requiere `version:`. Eliminar línea |

#### T1.6: Sección 6 - Testing

**Líneas afectadas:** ~376-468

| Cambio                               | Detalle                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| Tabla de frameworks                  | Actualizar Vitest 2.x → 4.x, Playwright 1.42.x → 1.58.x            |
| Tabla "Vitest vs Jest"               | Verificar que la comparación sigue siendo válida con Vitest 4      |
| Código de ejemplo `vitest.config.ts` | Verificar API con Vitest 4 (poolOptions eliminado)                 |
| Código Testcontainers                | Actualizar si @testcontainers/postgresql 11.x tiene cambios de API |
| Playwright config                    | Verificar compatibilidad                                           |

#### T1.7: Sección 7 - DevOps y CI/CD

**Líneas afectadas:** ~484-576

| Cambio                                      | Detalle                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| YAML de CI: `node-version: '20'`            | Cambiar a `node-version: '22'` (2 ocurrencias: job backend y frontend)              |
| YAML de CI: `postgres:16-alpine`            | Cambiar a `postgres:18-alpine`                                                      |
| YAML de CI: `working-directory: ./backend`  | Verificar que coincide con scaffold (`api/`) - **posible inconsistencia existente** |
| YAML de CI: `working-directory: ./frontend` | Verificar que coincide con scaffold (`web/`) - **posible inconsistencia existente** |

**Punto de atención:** El YAML de CI usa `./backend` y `./frontend` pero el scaffold usa `api/` y `web/`. Esta inconsistencia es **previa** a la auditoría de versiones pero debe corregirse en esta pasada.

#### T1.8: Sección 9 - Servicios Externos

**Líneas afectadas:** ~694-722

| Cambio                 | Detalle                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Código Sentry backend  | Cambiar `@sentry/nestjs` (paquete dedicado para NestJS 11, versión 10.x) en lugar de `@sentry/node` |
| Código Sentry frontend | Actualizar imports si @sentry/react 10.x tiene cambios de API                                       |

#### T1.9: Sección 10 - Matriz de Decisiones y Resumen de Versiones

**Líneas afectadas:** ~756-781

| Cambio                                 | Detalle                                                |
| -------------------------------------- | ------------------------------------------------------ |
| Bloque "Resumen de Versiones" completo | Reescribir con las versiones actualizadas (22 cambios) |

#### Criterios de validación T1

- [ ] Todas las versiones en `spec/007_stack.md` coinciden con la columna "Propuesta" del reporte de auditoría
- [ ] No quedan referencias a `bcrypt` (reemplazado por `argon2`)
- [ ] No quedan referencias a `react-router-dom` (reemplazado por `react-router`)
- [ ] No quedan referencias a `@sentry/node` genérico (reemplazado por `@sentry/nestjs`)
- [ ] Los ejemplos de código son compatibles con las nuevas versiones
- [ ] El YAML de CI usa `node-version: '22'` y las rutas de directorio coinciden con el scaffold
- [ ] El documento mantiene su estructura original (no se eliminan/añaden secciones innecesariamente)
- [ ] El Changelog al final se actualiza con la nueva versión

---

### Fase T2: Actualización de spec/008_rnf-tecnicos.md

**Prioridad:** Alta - Los RNFTs contienen código de referencia que los agentes usarán para implementar.
**Herramienta:** skill `doc-spec-generator`
**Dependencias:** T1 (el stack debe estar actualizado primero para asegurar coherencia)

#### T2.1: Tabla de Stack de Referencia (sección 1.1)

**Líneas afectadas:** ~34-41

Actualizar la tabla:

| Campo          | Actual                           | Nuevo                            |
| -------------- | -------------------------------- | -------------------------------- |
| Backend        | NestJS + TypeScript 10.x / 5.x   | NestJS + TypeScript 11.x / 5.9.x |
| Frontend       | React + Mantine 18.x / 7.x       | React + Mantine 19.x / 8.x       |
| Base de Datos  | PostgreSQL + Prisma 16.x / 5.x   | PostgreSQL + Prisma 17.x / 7.x   |
| Testing        | Vitest + Playwright 2.x / 1.42.x | Vitest + Playwright 4.x / 1.58.x |
| Observabilidad | Sentry 8.x                       | Sentry 10.x                      |

#### T2.2: RNFT-006 - Cifrado (bcrypt → argon2)

**Líneas afectadas:** ~363-421

Cambios críticos:

- **Título:** "Cifrado con bcrypt y Prisma" → "Cifrado con Argon2 y Prisma"
- **Código de hash de contraseñas:** Reemplazar `import * as bcrypt` por `import argon2 from 'argon2'`
- **Tabla de datos cifrados:** "Contraseña → bcrypt (12 rounds)" cambiar a "Contraseña → Argon2 (default params)"
- **Trazabilidad:** Línea 1524: "RNF-006 | RNFT-006 | bcrypt + AES-256" → "RNF-006 | RNFT-006 | Argon2 + AES-256"

#### T2.3: Código de Vite con react-router-dom

**Líneas afectadas:** ~549

En el `manualChunks` de Vite:

```
vendor: ['react', 'react-dom', 'react-router-dom'],
```

Cambiar a:

```
vendor: ['react', 'react-dom', 'react-router'],
```

#### T2.4: Testcontainers con PostgreSQL

**Líneas afectadas:** ~1305

Si se decide subir PostgreSQL:

```
new PostgreSqlContainer('postgres:16-alpine')
```

Cambiar a:

```
new PostgreSqlContainer('postgres:18-alpine')
```

#### T2.5: Revisión completa de código de referencia

Revisar todos los bloques de código en los RNFTs para verificar compatibilidad con las nuevas versiones:

- Código Prisma → compatibilidad con Prisma 7 (ESM-only, nuevo config)
- Código NestJS → compatibilidad con NestJS 11 (Express v5, Reflector cambios)
- Código Sentry → compatibilidad con @sentry/nestjs 10.x
- Código React → compatibilidad con React 19 (no aplica en RNFTs backend)

#### Criterios de validación T2

- [ ] Tabla de stack de referencia coincide con spec/007_stack.md actualizado
- [ ] No quedan referencias a `bcrypt` en ningún RNFT
- [ ] Código de referencia es compatible con las nuevas versiones
- [ ] Trazabilidad al final del documento refleja los cambios
- [ ] `react-router-dom` reemplazado por `react-router` donde aparezca

---

### Fase T3: Regeneración de references/

**Prioridad:** Alta - Las references son lo que los agentes consultan durante implementación.
**Herramienta:** skill `doc-spec-generator` (scripts de fragmentación)
**Dependencias:** T1, T2 (spec/ debe estar actualizado antes de regenerar)

#### T3.1: Regenerar references desde spec/

- Ejecutar el proceso de fragmentación del `doc-spec-generator`
- Verificar que los archivos en `references/stack/` reflejan los cambios de T1
- Verificar que los archivos en `references/rnft/` reflejan los cambios de T2
- Verificar integridad: número de fragmentos generados debe coincidir con el esperado

#### T3.2: Verificación post-regeneración

- Leer `references/stack/backend.md` y verificar versiones actualizadas
- Leer `references/stack/frontend.md` y verificar versiones actualizadas
- Leer `references/stack/testing.md` y verificar versiones actualizadas
- Leer `references/stack/devops-ci-cd.md` y verificar node-version y rutas de CI
- Leer `references/rnft/rnft-006.md` y verificar argon2 en lugar de bcrypt

#### Criterios de validación T3

- [ ] Todos los fragmentos en `references/stack/` reflejan versiones nuevas
- [ ] Todos los fragmentos en `references/rnft/` afectados están actualizados
- [ ] Los head files (`head-stack.md`, `head-requisitos-no-funcionales-tech.md`) son coherentes
- [ ] No hay fragmentos huérfanos ni faltantes
- [ ] El skill `doc-spec-manager` devuelve datos actualizados al consultar

---

### Fase T4: Revisión de planificación y diseño del MVP

**Prioridad:** Alta - Los documentos de diseño son la guía de implementación directa.
**Herramienta:** skills `doc-spec-manager` (consulta) + `doc-spec-generator` (si hay cambios en spec)
**Dependencias:** T1, T2, T3

#### T4.1: Scaffold - `doc/design/mvp/fase-0-scaffold.md`

Este es el documento de diseño **más afectado**:

| Línea/Sección                      | Cambio necesario                                                    |
| ---------------------------------- | ------------------------------------------------------------------- |
| Prerrequisitos "Node.js 20.x LTS"  | → "Node.js 22.x LTS"                                                |
| Paso 2: Instalar dependencias core | Verificar que las versiones de `@nestjs/*` se alinean con NestJS 11 |
| Paso 2: `argon2` ya está correcto  | Verificar (ya usa argon2, no bcrypt) - **sin cambio**               |
| Paso 7: `react-router-dom`         | → `react-router`                                                    |
| Paso 7: `zod`                      | Añadir nota sobre Zod 4 si hay cambios de import                    |
| Paso 7: `@sentry/react`            | Verificar versión alineada con 10.x                                 |
| Paso 5: `@sentry/node`             | → `@sentry/nestjs`                                                  |
| Paso 8: `PostgreSQL 16 Alpine`     | → `PostgreSQL 18 Alpine`                                            |
| Paso 10: CI `setup-node 20`        | → `setup-node 22`                                                   |

#### T4.2: Documentos de diseño Fase 1 Backend (12 docs)

Revisión por documento:

| Documento           | Cambio esperado                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `task-1-UC-001.md`  | Referencia indirecta al scaffold. Sin versiones explícitas. **Sin cambio directo.**            |
| `task-2-UC-002.md`  | Menciona `@nestjs/passport`, `passport-jwt`. Sin versiones explícitas. **Sin cambio directo.** |
| `task-3-UC-008.md`  | Referencia al scaffold. **Sin cambio directo.**                                                |
| `task-4-UC-010.md`  | Referencia al scaffold. **Sin cambio directo.**                                                |
| `task-5-UC-007.md`  | Referencia `@nestjs/schedule`. **Sin cambio directo.**                                         |
| `task-6-UC-006.md`  | Referencia a `Node.js crypto` (AES-256). **Sin cambio.**                                       |
| `task-7-UC-011.md`  | Referencia al scaffold. **Sin cambio directo.**                                                |
| `task-8-UC-013.md`  | Referencia al scaffold. **Sin cambio directo.**                                                |
| `task-9-UC-017.md`  | Referencia al scaffold. **Sin cambio directo.**                                                |
| `task-10-UC-018.md` | Referencia al scaffold. **Sin cambio directo.**                                                |
| `task-11-UC-019.md` | Referencia `@nestjs/schedule`. **Sin cambio directo.**                                         |
| `task-12-UC-021.md` | Referencia al scaffold. **Sin cambio directo.**                                                |

**Conclusión:** Los documentos de diseño de tareas backend de Fase 1 NO contienen versiones explícitas del stack. Referencian al scaffold y a paquetes NestJS por nombre (sin versión). **No requieren cambios.**

#### T4.3: Documentos de diseño Fase 1 Frontend (5 docs)

| Documento          | Cambio esperado                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `task-1-UC-002.md` | Línea ~82: "React 18, Mantine 7, React Router 6, React Query 5, Axios" → Actualizar         |
| `task-2-UC-017.md` | Línea ~79: "React 18, Mantine 7, React Router 6, TanStack Query 5, Axios, Zod" → Actualizar |
| `task-3-UC-018.md` | Verificar si contiene referencia similar                                                    |
| `task-4-UC-011.md` | Verificar si contiene referencia similar                                                    |
| `task-5-UC-013.md` | Verificar si contiene referencia similar                                                    |

**Acción:** Leer cada documento y buscar tablas de referencia de especificación que citen versiones. Actualizar las versiones mencionadas.

#### T4.4: Documentos de diseño Fase 2 (13 docs)

| Documentos backend                      | Cambio esperado                                                  |
| --------------------------------------- | ---------------------------------------------------------------- |
| `task-1-UC-004.md` a `task-5-UC-024.md` | Misma lógica que Fase 1 backend. Verificar menciones explícitas. |

| Documentos frontend                     | Cambio esperado                               |
| --------------------------------------- | --------------------------------------------- |
| `task-1-UC-006.md` a `task-8-UC-024.md` | Verificar tablas de referencia con versiones. |

#### T4.5: Documentos de diseño Fase 3 (6 docs)

| Documentos                                      | Cambio esperado                               |
| ----------------------------------------------- | --------------------------------------------- |
| `task-1-UC-064.md`, `task-2-UC-065.md` (back)   | Verificar menciones explícitas.               |
| `task-1-UC-001.md` a `task-4-UC-065.md` (front) | Verificar tablas de referencia con versiones. |

#### Criterios de validación T4

- [ ] `fase-0-scaffold.md` actualizado con Node.js 22, react-router, @sentry/nestjs
- [ ] Todos los documentos de diseño de tareas frontend actualizados si contenían versiones
- [ ] Documentos de diseño backend verificados (la mayoría no requiere cambios)
- [ ] Las referencias a scaffold en cada tarea siguen siendo coherentes con el scaffold actualizado
- [ ] No se han introducido inconsistencias entre documentos de diseño y spec

---

### Fase T5: Revisión de reportes md-work

**Prioridad:** Media-Alta - El análisis de skills debe rehacerse completamente; el reporte de scopes depende de él.
**Herramienta:** Búsqueda en skills.sh + edición directa
**Dependencias:** T1 (nuevas versiones del stack). T5.2 depende adicionalmente de T5.1.

#### T5.1: Skills recomendados - `md-work/003-002-reporte-skills-recomendados.md`

**Acción: REHACER EL ANÁLISIS COMPLETO.**

El reporte de skills recomendados debe **rehacerse desde cero**, no simplemente actualizarse. Razones:

1. **Las versiones del stack han cambiado significativamente** (22 de 43 dependencias). Los skills disponibles en skills.sh pueden haber cambiado o aparecer nuevos skills más alineados con las versiones actuales.

2. **Varios gaps identificados en el reporte original ya tienen skills disponibles.** Una búsqueda rápida en skills.sh ha revelado skills que no fueron encontrados en la búsqueda original:

   | Gap reportado                   | Skill encontrado      | URL                                                                |
   | ------------------------------- | --------------------- | ------------------------------------------------------------------ |
   | **Mantine** (sin skill)         | `mantine-dev`         | https://skills.sh/itechmeat/llm-code/mantine-dev                   |
   | **Zod** (sin skill)             | `zod-4`               | https://skills.sh/gentleman-programming/gentleman-skills/zod-4     |
   | **react-hook-form** (sin skill) | `react-hook-form-zod` | https://skills.sh/jezweb/claude-skills/react-hook-form-zod         |
   | **Sentry** (sin skill)          | `sentry-react-setup`  | https://skills.sh/getsentry/sentry-agent-skills/sentry-react-setup |

   Esto indica que la búsqueda original de 36+ queries fue insuficiente o que nuevos skills se han publicado desde entonces. En cualquier caso, el análisis completo debe repetirse.

3. **Los skills propios propuestos (sección 5.1)** podrían reducirse si los gaps ya están cubiertos por skills de terceros.

**Procedimiento para rehacer:**
En `md-work/003-001-prompt-skills-recomendados.md` esta el prompt que se envio para elaborar el reporte, tomar como referencia y reformularlo para:

- Repetir la búsqueda exhaustiva en skills.sh con las versiones actualizadas del stack
- Incluir búsquedas específicas para los gaps previamente identificados (Mantine, Zod, react-hook-form, Sentry, react-i18next, Testcontainers, multi-tenant, DDD, MinIO/S3, PWA, ESLint/Prettier, etc.)
- Verificar que los skills existentes recomendados siguen siendo relevantes con las nuevas major versions
- Generar un nuevo reporte que reemplace al actual
- El nuevo reporte debe servir como input actualizado para T5.2 (scopes e instrucciones)

#### T5.2: Scopes e instrucciones - `md-work/004-002-reporte-scopes-instrucciones-skills.md`

**Dependencia:** T5.1 debe completarse primero. El nuevo análisis de skills podría cambiar la distribución por scopes y los skills propios a crear.

**Cambios necesarios (versiones):**

1. **Sección 2.4, scope `api/`:** Tabla de stack
   - "TypeScript 5.x, NestJS 10.x, Prisma 5.x, PostgreSQL 16.x" → "TypeScript 5.9.x, NestJS 11.x, Prisma 7.x, PostgreSQL 18.x"

2. **Sección 2.4, scope `web/`:** Tabla de stack
   - "React 18.x, TypeScript 5.x, Vite 5.x, Mantine 7.x" → "React 19.x, TypeScript 5.9.x, Vite 7.x, Mantine 8.x"

3. **Sección 2.4, scope `e2e/`:** Tabla de stack
   - "Playwright 1.42.x" → "Playwright 1.58.x"

4. **Sección 3.2, instrucciones `api/`:**
   - Stack: "TypeScript 5.x, NestJS 10.x, Prisma 5.x, PostgreSQL 16.x" → Actualizar con nuevas versiones
   - Routing: "React Router v6" → "React Router v7"

5. **Sección 3.2, instrucciones `web/`:**
   - "React 18.x, TypeScript 5.x, Vite 5.x, Mantine 7.x" → Actualizar con nuevas versiones
   - "react-router-dom" → "react-router"
   - "Zod 3.x" → "Zod 4.x"
   - "react-i18next 14.x" → "react-i18next 16.x"
   - "Workbox 7.x" → "vite-plugin-pwa 1.x"

6. **Sección 3.2, instrucciones `e2e/`:**
   - "Playwright 1.42.x" → "Playwright 1.58.x"

**Cambios necesarios (skills - depende del resultado de T5.1):**

7. **Sección 4, distribución de skills por scope:**
   - Redistribuir según el nuevo análisis de skills de T5.1
   - Incorporar los nuevos skills encontrados (mantine-dev, zod-4, react-hook-form-zod, sentry-react-setup) en los scopes correspondientes
   - Actualizar las tablas auto-invoke si hay skills nuevos

8. **Sección 6, Skills propios a crear:**
   - Revisar la lista de skills propios propuestos a la luz del nuevo análisis
   - Si los gaps están cubiertos por skills de terceros (Mantine, Zod, Sentry, react-hook-form), eliminar los skills propios correspondientes
   - Posiblemente solo queden: `associated-sepa`, `associated-multi-tenant`, `associated-ddd`, `associated-i18n`, `associated-pwa`

9. **Sección 7, resumen visual y sección 8, comparativa:**
   - Actualizar cifras de skills totales, distribución por scope, etc.

#### Criterios de validación T5

- [ ] El análisis de skills ha sido rehecho completamente con búsqueda exhaustiva actualizada
- [ ] Las tablas de contexto coinciden con el stack actualizado
- [ ] Los nuevos skills descubiertos (Mantine, Zod 4, react-hook-form, Sentry) están incorporados
- [ ] La lista de skills propios a crear ha sido revisada y reducida donde corresponda
- [ ] Las instrucciones propuestas por scope usan versiones correctas
- [ ] La distribución de skills por scope refleja el nuevo análisis
- [ ] No se han introducido inconsistencias internas en los reportes

---

## Dependencias entre Fases

```
T1: spec/007_stack.md
│
├──▶ T2: spec/008_rnf-tecnicos.md       (depende de T1: coherencia de versiones)
│    │
│    └──▶ T3: Regenerar references/      (depende de T1 + T2: spec/ completo)
│         │
│         └──▶ T4: doc/design/mvp/*      (depende de T3: references actualizadas para consulta)
│
└──▶ T5.1: REHACER análisis de skills   (depende de T1: nuevas versiones del stack)
     │
     └──▶ T5.2: Scopes e instrucciones  (depende de T5.1: nuevo catálogo de skills)
```

**Ruta crítica:** T1 → T2 → T3 → T4

**Ruta secundaria:** T1 → T5.1 → T5.2

**Paralelizable:** T5.1 puede ejecutarse en paralelo con T2/T3 una vez completado T1. T5.2 requiere T5.1 completado.

---

## Puntos Críticos y Riesgos

### Riesgos

| Riesgo                                                                 | Probabilidad | Impacto | Mitigación                                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código de referencia incompatible con nueva versión**                | Media        | Alto    | Verificar API docs de cada paquete major antes de actualizar el código de ejemplo. Para Prisma 7 (ESM-only, `prisma.config.ts`), NestJS 11 (Express v5), y Sentry 10 (@sentry/nestjs) los cambios son significativos |
| **Efecto cascada: cambio en spec rompe coherencia con diseño**         | Media        | Medio   | Validar cruzadamente cada fase con la anterior antes de avanzar                                                                                                                                                      |
| **sepa-xml sin reemplazo claro**                                       | Alta         | Bajo    | Marcar como "pendiente de evaluación" en la spec, no bloquear el resto de la actualización                                                                                                                           |
| **PostgreSQL 18.x: compatibilidad con Prisma 7**                       | Baja         | Medio   | Verificar que Prisma 7 soporta PG 18 (expected: sí, PG mantiene retrocompatibilidad de protocolo)                                                                                                                    |
| **Inconsistencia preexistente `backend/`→`api/` y `frontend/`→`web/`** | Cierta       | Medio   | Corregir en T1.7 y T4.1 junto con la actualización de versiones                                                                                                                                                      |
| **Regeneración de references/ incompleta**                             | Baja         | Alto    | Verificar fragmento a fragmento en T3.2                                                                                                                                                                              |

### Decisiones tomadas

1. **PostgreSQL:** Subir a **18.x**. Al no existir código implementado, se adopta la versión más reciente directamente.
2. **uuid:** Eliminar dependencia `uuid`. Usar **`crypto.randomUUID()`** nativo de Node.js 22, eliminando una dependencia externa.
3. **sepa-xml:** Marcar como **pendiente de evaluación**. Se evaluará en detalle cuando se implemente UC-023 (Generación de remesas SEPA). No bloquea el resto de la actualización.

---

## Resumen de Esfuerzo por Fase

| Fase     | Archivos afectados                       | Tipo de cambio                                       | Complejidad |
| -------- | ---------------------------------------- | ---------------------------------------------------- | ----------- |
| **T1**   | 1 archivo (spec/007_stack.md)            | Edición masiva de versiones + código                 | Alta        |
| **T2**   | 1 archivo (spec/008_rnf-tecnicos.md)     | Edición puntual pero con código de referencia        | Media-Alta  |
| **T3**   | ~40 archivos en references/              | Regeneración automatizada + verificación             | Media       |
| **T4**   | ~7 archivos en doc/design/mvp/           | Edición puntual (scaffold + frontends con versiones) | Media       |
| **T5.1** | 1 archivo en md-work/ (rehacer completo) | Búsqueda exhaustiva en skills.sh + nuevo reporte     | Alta        |
| **T5.2** | 1 archivo en md-work/                    | Edición de versiones + redistribución de skills      | Media       |

**Total:** ~51 archivos afectados, ruta crítica de 4 fases secuenciales + ruta secundaria de 2 fases.

---

## Checklist Global de Finalización

Al completar todas las fases:

- [ ] **Coherencia vertical:** Las versiones son idénticas en spec/ → references/ → doc/design/ → md-work/
- [ ] **Sin referencias obsoletas:** `bcrypt`, `react-router-dom` (como paquete), `@sentry/node` (genérico), `Node.js 20`, `NestJS 10`, `React 18`, `Vite 5`, `Prisma 5`, `Mantine 7`, `Vitest 2`, `Zod 3`, `Docker 24` no aparecen como versiones recomendadas en ningún documento
- [ ] **Código de referencia funcional:** Los snippets de código en spec/008_rnf-tecnicos.md y doc/design/mvp/ son compatibles con las versiones actualizadas
- [ ] **Decisiones documentadas:** PostgreSQL 18.x adoptado, uuid eliminado (crypto.randomUUID nativo), sepa-xml → evaluación pendiente en UC-023
- [ ] **Inconsistencia `backend/frontend` → `api/web` corregida** en CI YAML y cualquier otra referencia
- [ ] **References regeneradas y verificadas**
- [ ] **Análisis de skills rehecho** con búsqueda exhaustiva actualizada
- [ ] **Reportes de trabajo alineados** con el nuevo stack y nuevo catálogo de skills
