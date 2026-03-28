---
name: doc-spec-manager
description: >
  Navegación, consulta y verificación de alineamiento con la especificación
  del proyecto Associated. Usar cuando se necesite:
  (1) implementar funcionalidades alineadas con la spec,
  (2) consultar requisitos, modelo de dominio, ADRs o stack,
  (3) crear o extender documentación de especificación,
  (4) verificar trazabilidad entre entidades documentales.
---

# Doc Spec Manager

Gestión integral de la especificación fragmentada del proyecto Associated.
La documentación fuente (`spec/`) está fragmentada en ~627 archivos atómicos
en `references/`, optimizados para consulta por agentes.

## Modos de Uso

Este skill tiene 3 modos de uso por orden de importancia:

1. **Implementación alineada** - Verificar que el código cumple la spec.
2. **Extensión de spec** - Crear o completar entidades documentales.
3. **Consulta** - Buscar y navegar la documentación.

---

## 1. Implementación Alineada

**Este es el modo principal.** Cuando implementes cualquier funcionalidad,
debes verificar el alineamiento con la especificación.

### Workflow de implementación

Antes de escribir código para un UC o US:

1. **Leer el UC** que vas a implementar:

   ```
   Read references/uc/uc-001.md
   ```

   Extraer: Application Service, Aggregates, flujos, Domain Events.

2. **Leer las US referenciadas** por el UC:

   ```
   Read references/us/us-001.md
   ```

   Extraer: criterios de aceptación (escenarios Gherkin), prioridad.

3. **Leer el BC** donde se implementa:

   ```
   Read references/bc/bc-identity.md
   ```

   Verificar: Aggregates, Entities, Value Objects, invariantes, Domain Events.

4. **Verificar RNFs aplicables**: buscar qué RNFs afectan a esta funcionalidad:

   ```
   Grep "N2RF01" references/rnf/
   ```

   Cada RNF tiene criterios de aceptación que el código DEBE cumplir.

5. **Verificar RNFTs técnicos**: concreciones con el stack:

   ```
   Grep "RNF-004" references/rnft/
   ```

   Cada RNFT tiene configuraciones específicas, métricas y código de referencia.

6. **Verificar ADRs aplicables**:
   ```
   Grep "multi-tenant\|Multi-Tenant" references/adr/
   ```
   Las ADRs definen restricciones arquitectónicas que NO se pueden violar.

### Checklist de alineamiento

Al implementar, verificar siempre:

- [ ] **Naming**: si algún término en la spec está en castellano donde debería estar en inglés, consultar `references/glosario-traducciones.md` para obtener la traducción canónica. No traducir ad-hoc.
- [ ] **Modelo de dominio**: Aggregates, Entities y Value Objects coinciden con el BC.
- [ ] **Invariantes**: todas las invariantes del Aggregate se respetan en el código.
- [ ] **Domain Events**: se emiten los eventos documentados en el UC.
- [ ] **Application Service**: el nombre y responsabilidad coinciden con el UC.
- [ ] **Flujos**: el código implementa flujo normal + flujos alternativos + excepciones del UC.
- [ ] **Criterios de aceptación**: los escenarios Gherkin de las US son testeables.
- [ ] **RNFs de seguridad**: autenticación, autorización RBAC, aislamiento tenant.
- [ ] **RNFs de rendimiento**: tiempos de respuesta, paginación, caché.
- [ ] **RNFs de RGPD**: datos personales encriptados, derecho al olvido, consentimientos.
- [ ] **ADRs**: la arquitectura respeta las decisiones documentadas.
- [ ] **Modelo de datos**: el esquema Prisma refleja columnas, tipos, índices y constraints de las ENT-xxx.
- [ ] **Endpoints**: la firma del controller (ruta, método, auth, permisos, body/response) coincide con el EP-xxx.

### Ejemplo completo

Para implementar "Provisión de nuevo tenant":

```
1. Read references/uc/uc-001.md
   → Application Service: TenantProvisioningService
   → Aggregate: Tenant
   → Events: TenantProvisioned

2. Read references/us/us-001.md
   → RF Origen: N2RF01
   → 3 escenarios Gherkin a satisfacer

3. Read references/bc/bc-identity.md
   → Aggregate User, Aggregate Tenant (estructura completa)

4. Grep "N2RF01" references/rnf/
   → rnf-004.md (Aislamiento Multi-Tenant por BD)
   → Criterios: BD separada, usuario específico, sin filtros WHERE

5. Grep "RNF-004" references/rnft/
   → rnft-004.md (Multi-tenant con Prisma)
   → Código referencia: PrismaTenantService, TenantMiddleware

6. Read references/adr/adr-002.md
   → Decisión: BD separada por tenant con usuario dedicado

7. Grep "UC-001" references/ep/
   → ep-002.md (POST /api/v1/tenants)
   → Autenticación: Public + X-Api-Key, Response 201 con tenantId/slug/adminUserId

8. Read references/ent/ent-001.md
   → Tabla: tenants - columnas slug, name, cif, database_name, database_password_encrypted
   → Constraint: @unique sobre slug y cif
   → Trazabilidad: RNF-004, RNF-006, ADR-002
```

---

## 2. Extensión de Especificación

Cuando se necesite crear nuevas entidades documentales (US, UC, BC, RF, etc.)
o completar las existentes.

### Reglas de consistencia

Toda nueva entidad DEBE:

- **Trazabilidad obligatoria**: cada entidad referencia a sus ancestros en la cadena.
- **Sin duplicidad**: verificar que no existe una entidad que ya cubra la funcionalidad.
- **Sin violación de RNFs**: la nueva funcionalidad no puede contradecir RNFs existentes.
- **Codificación secuencial**: usar el siguiente número disponible en la secuencia.

### Cadena de trazabilidad

```
RF (qué necesita el negocio)
 └→ RNF (restricciones agnósticas de tecnología)
     └→ RNFT (concreción técnica con el stack elegido)
         └→ ADR (decisiones arquitectónicas)
 └→ BC (modelo de dominio: Aggregates, Entities, Value Objects)
     └→ US (historias de usuario agrupadas por BC)
         └→ UC (casos de uso: flujos, servicios, eventos)
             └→ ENT (entidades del modelo relacional: tablas, columnas, índices)
             └→ EP (endpoints de la API: rutas, métodos, contratos)
```

### Campos de trazabilidad por tipo de entidad

| Tipo     | Campos obligatorios                                                          | Ejemplo                                  |
| -------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| **RF**   | Sección (N{x})                                                               | `> **Sección:** N2: Arquitectura...`     |
| **RNF**  | Categoría + `Trazabilidad RF:` códigos RF                                    | `**Trazabilidad RF:** N2RF01, N2RF03`    |
| **RNFT** | Categoría + `RNF Base:` código RNF                                           | `**RNF Base:** RNF-004 (...)`            |
| **ADR**  | Estado + Trazabilidad RNF en texto                                           | `Según RNF-004, se requiere...`          |
| **US**   | Contexto (BC + subsección) + `RF Origen:` + `Prioridad:`                     | `**RF Origen:** N2RF01`                  |
| **UC**   | BC + `User Stories:` + `Application Service:` + `Aggregates:` + `Prioridad:` | Sección Metadatos completa               |
| **ENT**  | BC + Aggregate + Base de datos + `Trazabilidad RNF:` + `Trazabilidad ADR:`   | `**Trazabilidad RNF:** RNF-004, RNF-006` |
| **EP**   | Método + Ruta + Autenticación + Permisos + `Caso de Uso:` + `Entidades:`     | `**Caso de Uso:** UC-001`                |

### Workflow para crear una nueva US

1. **Identificar el RF origen**: leer el head de RF y encontrar el RF relacionado.
2. **Verificar que no existe US para ese RF**:
   ```
   Grep "N4RF15" references/us/
   ```
3. **Identificar el BC destino**: consultar el mapeo RF→BC en `head-modelo-dominio.md`.
4. **Determinar el siguiente código**: listar US existentes del BC y usar el siguiente.
5. **Verificar RNFs aplicables**: buscar RNFs trazados al RF origen.
6. **Redactar la US** siguiendo el formato existente (ver cualquier `us/us-*.md`).
7. **Añadir al documento spec/** correspondiente (NO a references/).
8. **Regenerar references** con `doc-spec-generator`.

### Workflow para crear un nuevo UC

1. **Identificar las US que agrupa**: un UC consolida 1+ US del mismo BC.
2. **Verificar que no existe UC similar**:
   ```
   Grep "Application Service.*FeePlanService" references/uc/
   ```
3. **Determinar el siguiente código UC**: listar UCs del BC.
4. **Definir**: Application Service, Aggregates, flujos, Domain Events, excepciones.
5. **Verificar alineamiento con BC**: los Aggregates del UC existen en el BC.
6. **Redactar en spec/** y regenerar con `doc-spec-generator`.

---

## 3. Consulta y Navegación

### Tipos de entidad

| Tipo                          | Código        | Carpeta  | Head file                                | Cantidad |
| ----------------------------- | ------------- | -------- | ---------------------------------------- | -------- |
| Requisitos Funcionales        | N{x}RF{yy}    | `rf/`    | `head-requisitos-funcionales.md`         | 221      |
| Requisitos No Funcionales     | RNF-{xxx}     | `rnf/`   | `head-requisitos-no-funcionales.md`      | 66       |
| Bounded Contexts              | BC-{Name}     | `bc/`    | `head-modelo-dominio.md`                 | 7        |
| Decisiones Arquitectónicas    | ADR-{xxx}     | `adr/`   | `head-adrs.md`                           | 12       |
| Stack Tecnológico             | (por sección) | `stack/` | `head-stack.md`                          | 8        |
| RNF Técnicos                  | RNFT-{xxx}    | `rnft/`  | `head-requisitos-no-funcionales-tech.md` | 27       |
| User Stories                  | US-{xxx}      | `us/`    | `head-user-stories.md`                   | 202      |
| Casos de Uso                  | UC-{xxx}      | `uc/`    | `head-use-cases.md`                      | 76       |
| Entidades del Modelo de Datos | ENT-{xxx}     | `ent/`   | `head-modelo-de-datos.md`                | 40       |
| Endpoints de la API           | EP-{xxx}      | `ep/`    | `head-inventario-de-endpoints.md`        | 123      |

### Jerarquía de archivos

```
references/
├── glosario-traducciones.md        ← Glosario ES→EN (archivo completo, no atomizado)
├── head-*.md                       ← Punto de entrada por tipo (metadatos + índice)
├── rf/n{x}rf{yy}.md               ← Fragmento individual de RF
├── rnf/rnf-{xxx}.md               ← Fragmento individual de RNF
├── bc/bc-{name}.md                 ← Fragmento individual de BC
├── adr/adr-{xxx}.md               ← Fragmento individual de ADR
├── stack/{seccion}.md             ← Fragmento individual de Stack
├── rnft/rnft-{xxx}.md             ← Fragmento individual de RNFT
├── us/us-{xxx}.md                 ← Fragmento individual de US
├── uc/uc-{xxx}.md                 ← Fragmento individual de UC
├── ent/ent-{xxx}.md               ← Fragmento individual de ENT (tabla relacional)
└── ep/ep-{xxx}.md                 ← Fragmento individual de EP (endpoint de API)
```

### Consulta por tipo

**Siempre empezar por el head file** correspondiente:

```
Read references/head-requisitos-funcionales.md
Read references/head-modelo-dominio.md
Read references/head-user-stories.md
```

### Consulta por código directo

```
Read references/rf/n2rf01.md
Read references/rnf/rnf-001.md
Read references/bc/bc-identity.md
Read references/adr/adr-001.md
Read references/stack/backend.md
Read references/rnft/rnft-001.md
Read references/us/us-001.md
Read references/uc/uc-001.md
Read references/ent/ent-001.md
Read references/ep/ep-001.md
```

### Búsqueda por contenido

```
Grep "SEPA" references/rf/
Grep "Must" references/us/
Grep "BC-Treasury" references/uc/
Grep "Categoría.*Seguridad" references/rnf/
Grep "BC-Identity" references/ent/
Grep "UC-001" references/ep/
Grep "RNF-006" references/ent/
```

### Consulta de ENT (Modelo de Datos)

**Punto de entrada:**

```
Read references/head-modelo-de-datos.md
```

**Por código directo:**

```
Read references/ent/ent-001.md   ← tenants (BC-Identity, DB-Main)
Read references/ent/ent-009.md   ← members (BC-Membership, DB-Tenant)
Read references/ent/ent-011.md   ← fee_plans (BC-Treasury, DB-Tenant)
```

**Búsquedas útiles:**

```
Grep "BC-Membership" references/ent/           ← todas las tablas de BC-Membership
Grep "RNF-006" references/ent/                 ← tablas con datos cifrados
Grep "DB-Main" references/ent/                 ← tablas de la base de datos principal
Grep "ADR-002" references/ent/                 ← tablas relacionadas con multi-tenant
Grep "_encrypted" references/ent/              ← columnas cifradas en reposo
```

**Estructura de un ENT:**

```
### ENT-xxx: table_name
> Bounded Context: BC-xxx | Aggregate: NombreAggregate
Prisma model: NombrePrisma
Base de datos: Main | Tenant
Trazabilidad RNF: RNF-xxx (...)
Trazabilidad ADR: ADR-xxx (...)
#### Columnas - tabla con Columna, Tipo Prisma, Tipo PG, Nullable, Default, Descripción
#### Constraints e Índices
#### Relaciones - tabla con Relación, Tipo, Tabla destino, FK
```

### Consulta de EP (Inventario de Endpoints)

**Punto de entrada:**

```
Read references/head-inventario-de-endpoints.md
```

**Por código directo:**

```
Read references/ep/ep-001.md    ← GET /api/v1/health
Read references/ep/ep-002.md    ← POST /api/v1/tenants (UC-001)
```

**Búsquedas útiles:**

```
Grep "UC-001" references/ep/               ← endpoints que implementan UC-001
Grep "ENT-009" references/ep/              ← endpoints que operan sobre la tabla members
Grep "members:write" references/ep/        ← endpoints que requieren permiso members:write
Grep "Public" references/ep/               ← endpoints sin autenticación
Grep "BC-Treasury" references/ep/          ← endpoints del módulo de tesorería
Grep "POST" references/ep/                 ← endpoints de creación
```

**Estructura de un EP:**

```
### EP-xxx: METHOD /api/v1/path
Método: GET | POST | PUT | PATCH | DELETE
Ruta: /api/v1/...
Autenticación: Public | JWT | JWT + X-Api-Key
Permisos: N/A | recurso:accion (ej: treasury:fees:write)
Caso de Uso: UC-xxx | N/A
Entidades: ENT-xxx, ENT-yyy
#### Request Body - tabla de campos (si aplica)
#### Response 2xx - tabla de campos
#### Errores - tabla de status, código, condición
```

### Patrones de cross-referencia ENT ↔ EP

Para verificar la implementación completa de un endpoint:

```
1. Read references/ep/ep-XXX.md          ← obtener UC y ENTs relacionadas
2. Read references/uc/uc-XXX.md          ← obtener Application Service, Aggregates, flujos
3. Read references/ent/ent-XXX.md        ← verificar columnas, tipos, constraints
4. Read references/bc/bc-XXX.md          ← verificar invariantes del Aggregate
```

Para verificar la persistencia de una tabla:

```
1. Read references/ent/ent-XXX.md        ← obtener BC y Aggregate
2. Grep "ENT-XXX" references/ep/          ← encontrar todos los endpoints que la usan
3. Read references/uc/uc-XXX.md          ← verificar flujos de negocio
```

### Glosario de Traducciones (desambiguación ES → EN)

**Archivo completo (no atomizado):**

```
Read references/glosario-traducciones.md
```

La **fuente de verdad** son las especificaciones. El código debe usar los nombres tal como aparecen en ellas. Sin embargo, las specs están redactadas en castellano y es posible que algún término de dominio que debería estar en inglés (porque va directo a código) aparezca en castellano.

**Cuándo consultar el glosario:**

Cuando al leer una spec encontrás un término en castellano donde esperabas inglés (nombre de clase, tabla, enum, endpoint, variable), **no lo traduzcas directamente**. Buscá ese término en el glosario para verificar si existe una equivalencia canónica definida. Si existe, usá esa. Si no existe, traducí con criterio propio.

```
# Ejemplo: la spec dice "Ejercicio" donde debería decir algo en inglés Grep "Ejercicio" references/glosario-traducciones.md → Ejercicio → FiscalYear (no "Exercise", no "Year", no "Period")
```

**Estructura del glosario:**

- Secciones 1-4: Aggregates, Entities, Value Objects, Propiedades
- Sección 5: Enums (valores exactos almacenados en BD como String)
- Secciones 6-10: Patrones, Domain Events, Application Services
- Sección 11-12: Tablas y columnas de BD (snake_case)
- Sección 13: Endpoints API (rutas)
- Sección 14: Permisos (strings RBAC)
- Secciones 16-17: Conceptos del modelo de datos y de la API

### Secciones del Stack

| Archivo              | Contenido              |
| -------------------- | ---------------------- |
| `backend.md`         | TypeScript + NestJS    |
| `frontend.md`        | React + Mantine + Vite |
| `base-de-datos.md`   | PostgreSQL + Prisma    |
| `infraestructura.md` | Docker + MinIO/S3      |
| `testing.md`         | Vitest + Playwright    |
| `devops-ci-cd.md`    | GitHub Actions         |
| `herramientas.md`    | ESLint, Prettier, etc. |
| `servicios.md`       | Sentry, SMTP, etc.     |

---

## Convenciones

- **Nombres de archivo**: siempre lowercase kebab-case (`rnf-001.md`, `bc-identity.md`, `ent-001.md`, `ep-001.md`).
- **Códigos de negocio**: dentro del contenido mantienen formato original (`RNF-001`, `BC-Identity`, `ENT-001`, `EP-001`).
- **Contexto en fragmentos**: RF, RNF, RNFT, US, UC y ENT incluyen una línea de contexto
  al inicio (blockquote `>`) indicando su sección/categoría/BC padre.
- **ENT - separación de bases de datos**: ENT-001 a ENT-006 son de DB-Main (cross-tenant); ENT-007 en adelante son de DB-Tenant (una BD por colectividad, ADR-002).
- **EP - prefijo global**: todas las rutas incluyen `/api/v1/`. Los EPs con `@Public()` no requieren JWT. El tenant se extrae del JWT, no de un header.
- **ENT - datos sensibles**: columnas con sufijo `_encrypted` almacenan datos cifrados en reposo (RNF-006). Ejemplo: `iban_encrypted`, `database_password_encrypted`.
- **ENT - dinero**: campos monetarios almacenados en céntimos como `Int` (ejemplo: 1200 = 12,00 €).

## Regeneración

Si la documentación en `spec/` cambia, las references se regeneran con el skill
`doc-spec-generator`. **Nunca editar references/ directamente.**
