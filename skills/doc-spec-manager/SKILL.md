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

1. **Implementación alineada** — Verificar que el código cumple la spec.
2. **Extensión de spec** — Crear o completar entidades documentales.
3. **Consulta** — Buscar y navegar la documentación.

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
```

### Campos de trazabilidad por tipo de entidad

| Tipo | Campos obligatorios | Ejemplo |
|------|--------------------| --------|
| **RF** | Sección (N{x}) | `> **Sección:** N2: Arquitectura...` |
| **RNF** | Categoría + `Trazabilidad RF:` códigos RF | `**Trazabilidad RF:** N2RF01, N2RF03` |
| **RNFT** | Categoría + `RNF Base:` código RNF | `**RNF Base:** RNF-004 (...)` |
| **ADR** | Estado + Trazabilidad RNF en texto | `Según RNF-004, se requiere...` |
| **US** | Contexto (BC + subsección) + `RF Origen:` + `Prioridad:` | `**RF Origen:** N2RF01` |
| **UC** | BC + `User Stories:` + `Application Service:` + `Aggregates:` + `Prioridad:` | Sección Metadatos completa |

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

| Tipo | Código | Carpeta | Head file | Cantidad |
|------|--------|---------|-----------|----------|
| Requisitos Funcionales | N{x}RF{yy} | `rf/` | `head-requisitos-funcionales.md` | 221 |
| Requisitos No Funcionales | RNF-{xxx} | `rnf/` | `head-requisitos-no-funcionales.md` | 66 |
| Bounded Contexts | BC-{Name} | `bc/` | `head-modelo-dominio.md` | 7 |
| Decisiones Arquitectónicas | ADR-{xxx} | `adr/` | `head-adrs.md` | 12 |
| Stack Tecnológico | (por sección) | `stack/` | `head-stack.md` | 8 |
| RNF Técnicos | RNFT-{xxx} | `rnft/` | `head-requisitos-no-funcionales-tech.md` | 27 |
| User Stories | US-{xxx} | `us/` | `head-user-stories.md` | 202 |
| Casos de Uso | UC-{xxx} | `uc/` | `head-use-cases.md` | 76 |

### Jerarquía de archivos

```
references/
├── head-*.md              ← Punto de entrada por tipo (metadatos + índice)
├── rf/n{x}rf{yy}.md      ← Fragmento individual de RF
├── rnf/rnf-{xxx}.md       ← Fragmento individual de RNF
├── bc/bc-{name}.md        ← Fragmento individual de BC
├── adr/adr-{xxx}.md       ← Fragmento individual de ADR
├── stack/{seccion}.md     ← Fragmento individual de Stack
├── rnft/rnft-{xxx}.md     ← Fragmento individual de RNFT
├── us/us-{xxx}.md         ← Fragmento individual de US
└── uc/uc-{xxx}.md         ← Fragmento individual de UC
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
```

### Búsqueda por contenido

```
Grep "SEPA" references/rf/
Grep "Must" references/us/
Grep "BC-Treasury" references/uc/
Grep "Categoría.*Seguridad" references/rnf/
```

### Secciones del Stack

| Archivo | Contenido |
|---------|-----------|
| `backend.md` | TypeScript + NestJS |
| `frontend.md` | React + Mantine + Vite |
| `base-de-datos.md` | PostgreSQL + Prisma |
| `infraestructura.md` | Docker + MinIO/S3 |
| `testing.md` | Vitest + Playwright |
| `devops-ci-cd.md` | GitHub Actions |
| `herramientas.md` | ESLint, Prettier, etc. |
| `servicios.md` | Sentry, SMTP, etc. |

---

## Convenciones

- **Nombres de archivo**: siempre lowercase kebab-case (`rnf-001.md`, `bc-identity.md`).
- **Códigos de negocio**: dentro del contenido mantienen formato original (`RNF-001`, `BC-Identity`).
- **Contexto en fragmentos**: RF, RNF, RNFT, US y UC incluyen una línea de contexto
  al inicio (blockquote `>`) indicando su sección/categoría/BC padre.

## Regeneración

Si la documentación en `spec/` cambia, las references se regeneran con el skill
`doc-spec-generator`. **Nunca editar references/ directamente.**
