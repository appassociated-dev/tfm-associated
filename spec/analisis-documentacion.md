# ANÁLISIS ESTRUCTURA DE DOCUMENTACIÓN - ASSOCIATED SPEC

## 1. LISTADO DE ARCHIVOS CON PROPÓSITO Y ESQUEMA DE NUMERACIÓN

```
Archivo: 003_requisitos-funcionales.md
Líneas: 2,433
Versión: 1.0
Propósito: Define 221 Requisitos Funcionales organizados por necesidad empresarial (N2-N13)
Esquema de Numeración: NxRFyy (ej: N2RF01, N3RF34)
```

────────────────────────────────────────

```
Archivo: 004_rnf-base.md
Líneas: 1,046
Versión: 1.2
Propósito: Define 66 Requisitos No Funcionales agnósticos de tecnología
Esquema de Numeración: RNF-xxx (ej: RNF-001, RNF-066)
```

────────────────────────────────────────

```
Archivo: 005_modelo-dominio.md
Líneas: 1,991
Versión: 1.5
Propósito: Mapea 6 Bounded Contexts del DDD con Aggregates, Entities y Value Objects
Esquema de Numeración: BC-NombreBc (ej: BC-Identity, BC-Membership)
```

────────────────────────────────────────

```
Archivo: 006_adrs.md
Líneas: 1,038
Versión: 1.0
Propósito: Define 12 Decisiones Arquitectónicas alineadas a ADRs
Esquema de Numeración: ADR-xxx (ej: ADR-001, ADR-012)
```

────────────────────────────────────────

```
Archivo: 007_stack.md
Líneas: 815
Versión: 1.0
Propósito: Especifica stack tecnológico seleccionado (NestJS, React, PostgreSQL, etc)
Esquema de Numeración: (Referencia a RNF/ADR)
```

────────────────────────────────────────

```
Archivo: 008_rnf-tecnicos.md
Líneas: 1,567
Versión: 1.0
Propósito: Concreta RNFs base con implementaciones técnicas específicas
Esquema de Numeración: RNFT-xxx (ej: RNFT-001, RNFT-061)
```

────────────────────────────────────────

```
Archivo: 009_user-stories.md
Líneas: 7,726
Versión: 1.0
Propósito: Define 202 User Stories con criterios de aceptación MoSCoW (80 Must, 110 Should, 12 Could)
Esquema de Numeración: US-xxx (ej: US-001, US-202)
```

────────────────────────────────────────

```
Archivo: 010_casos-uso.md
Líneas: 15,315
Versión: 2.6
Propósito: Define 76 Casos de Uso agrupando User Stories con flujos y eventos
Esquema de Numeración: UC-xxx (ej: UC-001, UC-076)
```

────────────────────────────────────────

Total: 32,626 líneas de documentación

---

## 2. ESQUEMA DE NUMERACIÓN Y CÓDIGOS POR DOCUMENTO

Requisitos Funcionales (RF) - 003_requisitos-funcionales.md

- Formato: NxRFyy donde:
  - N = "Necesidad"
  - x = número de sección (2-13)
  - RF = "Requisito Funcional"
  - yy = número secuencial (01-38 por sección)
- Secciones N2-N13:
  - N2 (8 RFs): Arquitectura y Acceso (Multi-tenant, Roles, Auditoría)
  - N3 (34 RFs): Gestión de Socios/Miembros
  - N4 (38 RFs): Tesorería y Finanzas
  - N5 (30 RFs): Gestión de Eventos
  - N6 (23 RFs): Comunicación
  - N7 (12 RFs): Gestión Documental
  - N8 (13 RFs): Importación/Exportación
  - N9 (12 RFs): Visibilidad y Reporting
  - N10 (15 RFs): Portal del Socio (Autoservicio)
  - N11 (17 RFs): Cumplimiento Normativo (RGPD, LO 1/2002)
  - N12 (15 RFs): Necesidades Específicas por Tipo de Colectividad
  - N13 (4 RFs): Especificidades Aragonesas
  - Total: 221 RFs

Requisitos No Funcionales Base (RNF) - 004_rnf-base.md

- Formato: RNF-xxx (RNF-001 a RNF-066)
- Categorías: Seguridad, Rendimiento, RGPD, Disponibilidad, Usabilidad, Mantenibilidad
- Total: 66 RNFs agnósticos de tecnología

Requisitos No Funcionales Técnicos (RNFT) - 008_rnf-tecnicos.md

- Formato: RNFT-xxx (ej: RNFT-001, RNFT-061)
- Relación 1:1 con RNF Base (RNFT-001 implementa RNF-001, etc.)
- Incluye configuraciones específicas: NestJS, Prisma, React, PostgreSQL

Architectural Decision Records (ADR) - 006_adrs.md

- Formato: ADR-xxx (ADR-001 a ADR-012)
- Secciones:
  a. ADR-001: Monolito Modular
  b. ADR-002: Multi-Tenant por Base de Datos
  c. ADR-003: Módulos por Bounded Context
  d. ADR-004: Comunicación entre BCs (Domain Events)
  e. ADR-005: Persistencia relacional
  f. ADR-006: Autenticación JWT
  g. ADR-007: Autorización RBAC
  h. ADR-008: Gestión de Domain Events
  i. ADR-009: Arquitectura de capas
  j. ADR-010: API REST
  k. ADR-011: Almacenamiento ficheros
  l. ADR-012: Estrategia Testing

User Stories (US) - 009_user-stories.md

- Formato: US-xxx (US-001 a US-202)
- Distribución MoSCoW:
  - Must: 80 (39.6%)
  - Should: 110 (54.5%)
  - Could: 12 (5.9%)
  - Won't: 0
- Organización: 10 secciones alineadas a BCs y temas transversales

Casos de Uso (UC) - 010_casos-uso.md

- Formato: UC-xxx (UC-001 a UC-076)
- Agrupación: Múltiples USs en un UC cuando comparten:
  - Objetivo de negocio
  - Mismo Application Service
  - Transaccionalidad
  - Mismo Aggregate

Bounded Contexts (BC) - 005_modelo-dominio.md

- Formato: BC-NombreBc
- BCs Core (3):
  - BC-Identity: Acceso, Autenticación, Autorización, Roles
  - BC-Membership: Gestión de Socios, Estados, Tipos
  - BC-Treasury: Tesorería, Cuotas, Cobros, SEPA, Contabilidad
- BCs Supporting (3):
  - BC-Events: Actividades, Inscripciones, Asistencia
  - BC-Communication: Notificaciones, Emails, Mensajería
  - BC-Documents: Repositorio, Actas, Documentos
- BCs Generic (1):
  - BC-Identity (también generic)
- Total: 6 BCs + 1 transversal de cumplimiento normativo

---

## 3. PATRONES DE REFERENCIAS CRUZADAS (TRAZABILIDAD)

Mapeo de Dependencias - Flujo Documentario

```
KB-002 (Análisis de Necesidades)
    ↓
    ├→ 003_requisitos-funcionales.md (221 RFs: N2RF01-N13RF04)
    │       ↓
    │       ├→ 004_rnf-base.md (66 RNFs con "Trazabilidad RF: NxRFyy")
    │       │       ↓
    │       │       ├→ 008_rnf-tecnicos.md (RNFTs 1:1 mapping)
    │       │       │       ↓
    │       │       │       └→ 007_stack.md (Tecnologías concretas)
    │       │       └→ 006_adrs.md (12 ADRs, cada uno con "Trazabilidad: RNF-xxx")
    │       │
    │       └→ 005_modelo-dominio.md (6 BCs con "Matriz BC→RF")
    │               ↓
    │               └→ 009_user-stories.md (202 USs con "RF Origen: NxRFyy")
    │                       ↓
    │                       └→ 010_casos-uso.md (76 UCs con "User Stories: US-xxx")
    │
    └→ glosario-traducciones.md (Nomenclatura ES→EN)
```

Tipos de Referencias Encontradas

```
┌──────────┬───────────────────────────────────────┬──────────────────────────────────────────────────┬─────────────────┐
│   Tipo   │                Ejemplo                │           Documentos Origen → Destino            │   Frecuencia    │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ RF a RNF │ RNF-001 Trazabilidad: N10RF13,        │ 004_rnf-base.md → 003_requisitos-funcionales.md  │ 133 refs        │
│          │ N10RF14                               │                                                  │                 │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ RNF a    │ RNFT-001 implementa RNF-001           │ 008_rnf-tecnicos.md → 004_rnf-base.md            │ ~40 (1:1        │
│ RNFT     │                                       │                                                  │ mapping)        │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ ADR a    │ ADR-001 referencia RNF-020, RNF-057   │ 006_adrs.md → 004_rnf-base.md                    │ 25 refs         │ 
│ RNF      │                                       │                                                  │                 │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ ADR a BC │ ADR-001 afecta "Todos" los BCs        │ 006_adrs.md → 005_modelo-dominio.md              │ 12 refs         │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ RF a BC  │ "BC-Identity mapea N2RF01-N2RF08"     │ 005_modelo-dominio.md →                          │ 84 refs         │
│          │                                       │ 003_requisitos-funcionales.md                    │                 │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ US a RF  │ "US-001: RF Origen: N2RF01"           │ 009_user-stories.md →                            │ 587 refs        │
│          │                                       │ 003_requisitos-funcionales.md                    │                 │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ UC a US  │ "UC-001: User Stories: US-001"        │ 010_casos-uso.md → 009_user-stories.md           │ 610 refs        │
├──────────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────┤
│ RNFT a   │ "RNFT-003 implementa RBAC para        │ 008_rnf-tecnicos.md → 005_modelo-dominio.md      │ Implícito       │
│ BC       │ BC-Identity"                          │                                                  │                 │
└──────────┴───────────────────────────────────────┴──────────────────────────────────────────────────┴─────────────────┘
```

Total de referencias cruzadas encontradas: ~1,783 menciones de patrones de código

---

## 4. FLUJO LÓGICO Y DEPENDENCIAS ENTRE DOCUMENTOS

Cadena de Trazabilidad Completa (Happy Path)

RF (Necesidad Empresarial)
    ↓
    Ejemplo: N4RF17 "Remesas SEPA"
    ↓
RNF (Requisito No-Funcional)
    ↓
    N4RF17 es soportado por: RNF-018 (Rendimiento operaciones masivas)
    ↓
RNFT (Requisito Técnico)
    ↓
    RNF-018 → RNFT-018 (Prisma Batch + Bull para procesamiento)
    ↓
ADR (Decisión Arquitectónica)
    ↓
    RNFT-018 implementa ADR-009 (Capas) + ADR-004 (Domain Events)
    ↓
BC (Bounded Context)
    ↓
    ADR-003 define módulo en BC-Treasury
    ↓
US (User Story)
    ↓
    US-047: "Como Tesorero, quiero generar remesa SEPA" → RF Origen: N4RF17
    ↓
UC (Caso de Uso)
    ↓
    UC-020: "Generación de Remesa SEPA" agrupa US-047, US-048, US-049

Matriz de Impacto (Cambios en Upstream afectan Downstream)

```
┌──────────────┬───────────────────────┬─────────────────────────────────────────┐
│ Si cambia... │     Impacta a...      │               Proporción                │
├──────────────┼───────────────────────┼─────────────────────────────────────────┤
│ 1 RF         │ ~1-3 RNFs (promedio)  │ 221 RFs × 1.3 ≈ 287 impactos            │
├──────────────┼───────────────────────┼─────────────────────────────────────────┤
│ 1 RNF        │ ~2-4 RNFTs + 1-2 ADRs │ 66 RNFs × 3 ≈ 198 impactos              │
├──────────────┼───────────────────────┼─────────────────────────────────────────┤
│ 1 BC         │ ~8 RFs + 15 USs       │ 6 BCs × 23 ≈ 138 impactos               │
├──────────────┼───────────────────────┼─────────────────────────────────────────┤
│ 1 US         │ 1 UC + 1+ RFs         │ 202 USs mapeadas 1:N a UCs              │
├──────────────┼───────────────────────┼─────────────────────────────────────────┤
│ 1 ADR        │ 12 BCs + ~10 RNFs     │ 12 ADRs × 12 = 144 impactos potenciales │
└──────────────┴───────────────────────┴─────────────────────────────────────────┘
```

---

## 5. MATRICES DE TRAZABILIDAD EXPLÍCITAS

Matriz RNF → RF (004_rnf-base.md línea 982)

| Categoría RNF  | RFs Relacionados |
|----------------|------------------|
| Seguridad      | N2, N10RF13-14, N4RF09, N7 |
| Rendimiento    | N4RF02/17, N8, N9, N10 |
| RGPD           | N11 (completo), N3RF01, N10RF11 |
| Disponibilidad | N2RF01 (Multi-tenant SaaS), Transversal |
| Usabilidad     | N10, N9, Transversal |

Matriz ADR → RNF (006_adrs.md línea 998)

| ADR      | RNFs Relacionados |
|----------|-------------------|
| ADR-001  | RNF-020, RNF-057 (escalabilidad, documentación) |
| ADR-002  | RNF-004, RNF-029, RNF-038 (multi-tenant, RGPD, backups) |
| ADR-003  | RNF-057 (documentación arquitectura) |
| ADR-004  | RNF-042 (gestión errores en handlers) |
| ... (12 filas totales) |

Matriz ADR → BC (006_adrs.md línea 1015)

| ADR      | BCs Afectados |
|----------|---------------|
| ADR-001  | Todos (arquitectura monolítica) |
| ADR-002  | BC-Identity (DB-Main), resto (DB-Tenant) |
| ADR-003  | Todos (modularización) |
| ADR-004  | Todos (domain events) |
| ... |

Matriz BC → RF (005_modelo-dominio.md línea 1812)

| BC              | Secciones RF | Total RFs |
|-----------------|--------------|----------|
| BC-Identity     | N2           | 8 |
| BC-Membership   | N3           | 34 |
| BC-Treasury     | N4           | 35 |
| BC-Events       | N5           | 30 |
| BC-Communication| N6           | 23 |
| BC-Documents    | N7           | 12 |
| Transversal     | N8-N11       | 57 |
| Extensiones     | N12-N13      | 19 |

Matriz RNF Base → RNF Técnico (008_rnf-tecnicos.md línea 1515)

| RNF Base | RNF Técnico | Tecnología |
|----------|-------------|------------|
| RNF-001  | RNFT-001    | NestJS + Passport + JWT |
| RNF-002  | RNFT-002    | JWT + Refresh Tokens |
| RNF-003  | RNFT-003    | NestJS Guards + RBAC |
| ... (~35 filas) |

---

## 6. CADENA DE DEPENDENCIAS (DEPENDENCY CHAIN)

Dependencias Documentarias (Directas)

Nivel 1 (Inputs):
  KB-002 (Análisis de Necesidades)

Nivel 2 (Derivados de KB-002):
  003_requisitos-funcionales.md (Inputs: KB-002)
  005_modelo-dominio.md (Inputs: KB-002, KB-003)

Nivel 3 (Refinamientos):
  004_rnf-base.md (Inputs: KB-003)
  006_adrs.md (Inputs: KB-004, KB-005)

Nivel 4 (Implementación):
  007_stack.md (Inputs: KB-004, KB-006)
  008_rnf-tecnicos.md (Inputs: KB-004, KB-007)

Nivel 5 (Especificación funcional):
  009_user-stories.md (Inputs: KB-003, KB-005, KB-008)

Nivel 6 (Casos de uso):
  010_casos-uso.md (Inputs: KB-009)

Nivel 7 (Referencia):
  glosario-traducciones.md (Referencia global)

Dependencias Lógicas (Qué debe estar definido antes)

1. Antes de definir RNF → Necesitar RF completos
  - 003 debe estar validado antes de 004
2. Antes de definir ADR → Necesitar RNF + Modelo de Dominio
  - 004 + 005 deben estar completos antes de 006
3. Antes de definir Stack → Necesitar ADR
  - 006 debe estar completo antes de 007
4. Antes de definir RNFT → Necesitar Stack + RNF Base
  - 007 debe estar completo antes de 008
5. Antes de definir US → Necesitar RF + BC + RNFT
  - 003, 005, 008 deben estar listos antes de 009
6. Antes de definir UC → Necesitar US
  - 009 debe estar validado antes de 010

Ruta crítica: KB-002 → 003 → 005 → 006 → 007 → 008 → 009 → 010

---

## 7. PATRONES DE CROSS-REFERENCING OBSERVADOS

Patrón 1: Referencias Bidireccionales

```
Ejemplo:
  RF-N4RF17 describe "Remesas SEPA"
    ↓
  RNF-018 (Trazabilidad: N4RF17) implementa
    ↓
  RNFT-018 concreta
    ↓
  ADR-004 + ADR-008 soportan
    ↓
  BC-Treasury contiene
    ↓
  US-047/048/049 especifican
    ↓
  UC-020 orquesta
    ↓
  "Remesa SEPA" implementada de extremo a extremo
```

Patrón 2: Transversalidad

- Transversal N8 (Import/Export): Toca todos los BCs
- Transversal N9 (Reporting): Consume datos de N3, N4, N5, N6
- Transversal N10 (Portal Socio): UI que lee N3, N4 con N2 (Auth)
- Transversal N11 (Cumplimiento): Auditoría + RGPD sobre todos

Patrón 3: Refinamiento Progresivo

```
RF (Alto nivel): "N3RF01: Ficha centralizada de socio"
  ↓ (nivel de detalle ++)
RNF (No-funcional): "RNF-006: Cifrado de DNI/IBAN"
  ↓ (nivel de detalle ++)
RNFT (Técnico): "RNFT-006: bcrypt + AES-256 en Prisma"
  ↓ (nivel de detalle ++)
BC (Dominio): "BC-Membership, Aggregate: Member, VO: IdentityDocument"
  ↓ (nivel de detalle ++)
US (Flujo): "US-009: Como secretario, registrar socio con DNI cifrado"
  ↓ (nivel de detalle ++)
UC (Caso): "UC-006: Registro de Socio con validación y cifrado"
  ↓ (nivel de detalle ++)
Implementación: Controllers, Services, Repositories
```

---

## 8. RESUMEN EJECUTIVO

```
┌──────────────────────────────────┬────────────────────────────────────────┐
│             Métrica              │                 Valor                  │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total Documentos                 │ 8 ficheros .md                         │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total Líneas                     │ 31,931                                 │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total RFs                        │ 221                                    │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total RNFs                       │ 66                                     │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total RNFTs                      │ 40+ (mínimo)                           │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total ADRs                       │ 12                                     │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total BCs                        │ 6 core/supporting + 1 transversal      │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total User Stories               │ 202                                    │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Total Casos de Uso               │ 76                                     │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Referencias Cruzadas             │ ~1,783 menciones                       │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Matrices Trazabilidad Explícitas │ 5 matrices principales                 │
├──────────────────────────────────┼────────────────────────────────────────┤
│ Secciones Trazabilidad           │ 1 sección por cada documento principal │
└──────────────────────────────────┴────────────────────────────────────────┘
```

Estado de Completitud: Validado ✅ (excepto 007 y 008 en Borrador)

---

Esta estructura permite trazabilidad total desde necesidades empresariales (RF) hasta implementación (UC +
Tecnología), con múltiples niveles de refinamiento y validación cruzada entre artefactos.