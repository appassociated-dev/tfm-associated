# Mapa de Documentación - Associated ERP

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Fecha:** Febrero 2026
**Propósito:** Explicar la expansión documental, relaciones entre documentos, codificación empleada y trazabilidad

---

## 1. Visión General: Flujo de Expansión Documental

Cada documento declara sus "Inputs" (KBs previos). La documentación se expande en dos ejes: **funcional** (qué) y **técnico** (cómo).

```
                        KB-001
                   Propuesta TFM
                        │
                        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  KB-002: Análisis de Necesidades (documento externo, no en spec)│
  └──────────────────────────┬──────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
  ┌───────────────┐  ┌────────────┐  ┌────────────┐
  │ 003 RF        │  │ 004 RNF    │  │ 005 Modelo │
  │ 221 requisitos│  │ 66 req. NF │  │ 6 BCs DDD  │
  │ funcionales   │  │ (agnóstico)│  │ Aggregates │
  │ [KB-002]      │  │ [KB-002,   │  │ [KB-001..  │
  │ v1.0 Validado │  │  KB-003]   │  │  KB-004]   │
  │ 2.433 líneas  │  │ v1.2 Valid.│  │ v1.5 Valid.│
  └───────┬───────┘  │ 1.046 lín. │  │ 1.991 lín. │
          │          └─────┬──────┘  └──────┬─────┘
          │                │                │
          │          ┌─────┴────────────────┘
          │          ▼
          │  ┌──────────────┐
          │  │ 006 ADRs     │
          │  │ 12 decisiones│
          │  │ arquitectura │
          │  │ [KB-004,     │
          │  │  KB-005]     │
          │  │ v1.0 Verif.  │
          │  │ 1.038 líneas │
          │  └──────┬───────┘
          │         │
          │         ▼
          │  ┌──────────────┐
          │  │ 007 Stack    │
          │  │ Tecnologías  │
          │  │ NestJS, React│
          │  │ PostgreSQL   │
          │  │ [KB-004,     │
          │  │  KB-006]     │
          │  │ v1.0 Borrad. │
          │  │ 815 líneas   │
          │  └──────┬───────┘
          │         │
          │         ▼
          │  ┌──────────────┐
          │  │ 008 RNFT     │
          │  │ RNF técnicos │
          │  │ Implementac. │
          │  │ [KB-004,     │
          │  │  KB-007]     │
          │  │ v1.0 Borrad. │
          │  │ 1.567 líneas │
          │  └──────┬───────┘
          │         │
          ├─────────┘
          ▼
  ┌───────────────┐
  │ 009 US        │
  │ 202 user      │
  │ stories       │
  │ MoSCoW        │
  │ [KB-003,      │
  │  KB-005,      │
  │  KB-008]      │
  │ v1.0 Aprobado │
  │ 7.726 líneas  │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ 010 UC        │
  │ 76 casos de   │
  │ uso detallados│
  │ [KB-009]      │
  │ v2.6 (activo) │
  │ 15.390 líneas │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ 012 ENT       │
  │ 40 entidades  │
  │ modelo datos  │
  │ [KB-005,      │
  │  KB-006,      │
  │  KB-010]      │
  │ v1.0 (activo) │
  │ 1.132 líneas  │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ 013 EP        │
  │ 123 endpoints │
  │ inventario API│
  │ [KB-010,      │
  │  KB-012,      │
  │  KB-006]      │
  │ v1.0 (activo) │
  │ 4.031 líneas  │
  └───────────────┘
```

---

## 2. Sistema de Codificación

| Código     | Documento | Formato                                                               | Total items |
| ---------- | --------- | --------------------------------------------------------------------- | ----------- |
| `NxRFyy`   | 003       | N{sección}RF{secuencial} - ej: `N3RF01`, `N4RF17`                     | 221         |
| `RNF-xxx`  | 004       | RNF-{001..066}                                                        | 66          |
| `BC-Name`  | 005       | BC-{Identity\|Membership\|Treasury\|Events\|Communication\|Documents} | 6           |
| `ADR-xxx`  | 006       | ADR-{001..012}                                                        | 12          |
| `RNFT-xxx` | 008       | RNFT-{001..061} - mapeo 1:1 con RNF-xxx                               | ~40+        |
| `US-xxx`   | 009       | US-{001..202}                                                         | 202         |
| `UC-xxx`   | 010       | UC-{001..076}                                                         | 76          |
| `ENT-xxx`  | 012       | ENT-{001..040}                                                        | 40          |
| `EP-xxx`   | 013       | EP-{001..123}                                                         | 123         |

### Detalle de secciones RF (003)

| Sección | Ámbito                                           | RFs |
| ------- | ------------------------------------------------ | --- |
| N2      | Arquitectura y Acceso al Sistema                 | 8   |
| N3      | Gestión de Socios/Miembros                       | 34  |
| N4      | Tesorería y Finanzas                             | 38  |
| N5      | Gestión de Eventos                               | 30  |
| N6      | Comunicación                                     | 23  |
| N7      | Gestión Documental                               | 12  |
| N8      | Importación y Exportación                        | 13  |
| N9      | Visibilidad y Reporting                          | 12  |
| N10     | Autoservicio del Socio                           | 15  |
| N11     | Cumplimiento Normativo                           | 17  |
| N12     | Necesidades Específicas por Tipo de Colectividad | 15  |
| N13     | Contexto Aragonés                                | 4   |

### Priorización MoSCoW (009)

| Prioridad | User Stories | Porcentaje |
| --------- | ------------ | ---------- |
| Must      | 80           | 39,6%      |
| Should    | 110          | 54,5%      |
| Could     | 12           | 5,9%       |
| Won't     | 0            | 0%         |

---

## 3. Trazabilidad: Cadena Completa

### Ejemplo con "Remesas SEPA"

```
N4RF17 ──────► RNF-018 ──────► RNFT-018 ──────► ADR-004
(Requisito      (Rendimiento    (Prisma Batch    (Domain
 funcional)      operaciones     + Bull Queue)    Events)
                 masivas)              │                │
                      │                │                │
                      ▼                ▼                ▼
                 BC-Treasury ◄─────────────────────────┘
                 Aggregate: SepaRemittance
                      │
                      ▼
              US-047, US-048, US-049
              (Tesorero genera remesa SEPA)
                      │
                      ▼
                 UC-023: Generación Remesa SEPA
                 Application Service: SepaRemittanceService
                 Domain Events: SepaRemittanceGenerated
                      │
                      ▼
                ENT-018, ENT-019, ENT-020
                (sepa_mandates, sepa_remittances, sepa_debits)
                      │
                      ▼
                EP-079..EP-087
                SEPA Mandates & Remittances endpoints
```

### Cadena genérica de trazabilidad

```
RF (Necesidad Empresarial)
    ↓  "N4RF17: Remesas SEPA"
RNF (Restricción No Funcional)
    ↓  "RNF-018: Rendimiento operaciones masivas"
RNFT (Implementación Técnica)
    ↓  "RNFT-018: Prisma Batch + Bull"
ADR (Decisión Arquitectónica)
    ↓  "ADR-004: Domain Events" + "ADR-009: Capas"
BC (Bounded Context)
    ↓  "BC-Treasury, Aggregate: SepaRemittance"
US (User Story)
    ↓  "US-047: Como Tesorero, quiero generar remesa SEPA"
UC (Caso de Uso)
    ↓  "UC-023: agrupa US-047, US-048, US-049"
ENT (Modelo de Datos)
    ↓  "ENT-018: sepa_mandates"
EP (Endpoint API)
    ↓  "EP-079: GET /api/v1/treasury/sepa-mandates"
Implementación
       Controllers, Services, Repositories
```

---

## 4. Matrices de Trazabilidad Explícitas

Cada documento contiene al final una sección de trazabilidad que conecta con sus documentos upstream y downstream.

```
003 ◄───────────── 004 (Matriz RNF→RF)
 │                   Cada RNF indica "Trazabilidad: NxRFyy"
 │
 ├──► 005 ◄──────── 005 (Matriz BC→RF)
 │     │              Cada BC indica qué secciones N cubre
 │     │
 │     ├──► 006 ◄── 006 (Matriz ADR→RNF + Matriz ADR→BC)
 │     │              Cada ADR referencia RNF y BCs afectados
 │     │
 │     │    007 ◄── Sin matriz propia, referencia ADRs
 │     │     │
 │     │     ▼
 │     │    008 ◄── 008 (Matriz RNFT→RNF)
 │     │              Mapeo 1:1 con implementación técnica
 │     │
 │     ▼
 ├──► 009 ◄──────── 009 (Tabla US→RF)
 │                    Cada US tiene campo "RF Origen: NxRFyy"
 │
 ▼
010 ◄────────────── 010 (Tabla UC→US)
 │                   Cada UC lista "User Stories: US-xxx, US-yyy"
 │
 ▼
012 ◄────────────── 012 (Matriz ENT→BC + ENT→RNF + ENT→ADR)
 │                   Cada ENT indica BC propietario, RNFs y ADRs aplicables
 │
 ▼
013 ◄────────────── 013 (Tabla EP→UC + EP→ENT)
                     Cada EP indica UC que implementa y ENTs que manipula
```

### Tipos de referencias cruzadas

| Tipo       | Ejemplo                         | Origen → Destino | Frecuencia aprox. |
| ---------- | ------------------------------- | ---------------- | ----------------- |
| RF → RNF   | RNF-001 Trazabilidad: N10RF13   | 004 → 003        | ~133 refs         |
| RNF → RNFT | RNFT-001 implementa RNF-001     | 008 → 004        | ~40 (1:1)         |
| ADR → RNF  | ADR-001 ref. RNF-020, RNF-057   | 006 → 004        | ~25 refs          |
| ADR → BC   | ADR-001 afecta "Todos" los BCs  | 006 → 005        | ~12 refs          |
| RF → BC    | BC-Identity mapea N2RF01-N2RF08 | 005 → 003        | ~84 refs          |
| US → RF    | US-001 RF Origen: N2RF01        | 009 → 003        | ~587 refs         |
| UC → US    | UC-001 User Stories: US-001     | 010 → 009        | ~610 refs         |
| ENT → BC   | ENT-009 → BC-Membership         | 012 → 005        | ~40 refs          |
| ENT → RNF  | ENT-009 → RNF-006               | 012 → 004        | ~50 refs          |
| ENT → ADR  | ENT-009 → ADR-002               | 012 → 006        | ~40 refs          |
| EP → UC    | EP-001 → UC-001                 | 013 → 010        | ~123 refs         |
| EP → ENT   | EP-001 → ENT-001, ENT-002       | 013 → 012        | ~300 refs         |
| UC → ENT   | UC-006 → ENT-009                | 010 → 012        | ~76 refs          |
| UC → EP    | UC-006 → EP-015..024            | 010 → 013        | ~76 refs          |

**Total de referencias cruzadas: ~2.459 menciones**

---

## 5. Relaciones entre Bounded Contexts

```
       ┌────────────────────────────────────────────────────┐
       │                   BC-Identity                      │
       │  (Generic) Users, Tenants, Roles, Auth             │
       │  N2: 8 RFs │ UC-001..005 │ US-001..008             │
       └──────┬──────────────┬──────────────────────────────┘
              │ JWT/RBAC     │ TenantMembership
              ▼              ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  BC-Membership   │  │  BC-Treasury     │  │  BC-Events       │
  │  (Core)          │◄─┤  (Core)          │  │  (Core)          │
  │  Members, Types  │  │  Charges, Fees   │  │  Events, Reg.    │
  │  FiscalYears     │  │  SEPA, Accounting│  │  Squads, Matches │
  │  N3: 34 RFs      │  │  N4: 38 RFs      │  │  N5: 30 RFs      │
  │  UC-006..016     │  │  UC-017..027     │  │  UC-028..038     │
  │  US-009..042     │  │  US-043..080     │  │  US-081..109     │
  └──────┬───────────┘  └──────┬───────────┘  └──────┬───────────┘
         │ MemberRegistered     │ ChargeGenerated      │ RegistrationCompleted
         │ MemberDeactivated    │ DelinquencyDetected   │ EventPublished
         ▼                      ▼                       ▼
  ┌──────────────────┐  ┌──────────────────┐
  │ BC-Communication │  │ BC-Documents     │
  │ (Supporting)     │  │ (Supporting)     │
  │ Email, SMS, Push │  │ Files, Minutes   │
  │ Templates        │  │ Alerts           │
  │ N6: 23 RFs       │  │ N7: 12 RFs       │
  │ UC-039..047      │  │ UC-048..055      │
  │ US-110..132      │  │ US-133..144      │
  └──────────────────┘  └──────────────────┘

  Transversales (tocan varios BCs):
  ┌─────────────────────────────────────────────────┐
  │  N8  Import/Export   UC-056..063  US-145..157   │
  │  N9  Reporting       UC-064..067  US-158..169   │
  │  N10 Portal Socio    UC-068..071  US-170..184   │
  │  N11 Cumplimiento    UC-072..076  US-185..202   │
  └─────────────────────────────────────────────────┘
```

---

## 6. Refinamiento Progresivo (Nivel de Detalle)

Cada documento aporta una perspectiva distinta sobre el mismo requisito, incrementando progresivamente el nivel de detalle:

```
ABSTRACTO                                                                              CONCRETO
◄──────────────────────────────────────────────────────────────────────────────────────────────►

003 RF        004 RNF       005 BC        009 US        010 UC        012 ENT       013 EP
┌──────┐     ┌──────┐     ┌──────┐     ┌──────┐     ┌──────────┐  ┌──────────┐  ┌──────────┐
│ QUÉ  │────►│ CÓMO │────►│DÓNDE │────►│QUIÉN │────►│ FLUJO    │─►│ EN QUÉ   │─►│  CÓMO   │
│      │     │(restr│     │(domn)│     │(actor│     │ COMPLETO │  │  tabla   │  │ acceder  │
│"Ficha│     │ no   │     │      │     │ hace │     │          │  │ se       │  │  vía API │
│centr.│     │ func)│     │BC-   │     │ qué) │     │ Happy    │  │ persiste │  │          │
│socio"│     │"Cifr.│     │Memb. │     │"Como │     │ path +   │  │          │  │ Contrato │
│      │     │DNI/  │     │Aggr: │     │SEC,  │     │ Altern + │  │ members  │  │  HTTP    │
│      │     │IBAN" │     │Member│     │alta  │     │ Excepción│  │ (ENT-009)│  │ EP-015   │
│      │     │      │     │VO:   │     │socio"│     │ + Events │  │          │  │ ..024    │
│      │     │      │     │Ident.│     │      │     │ + ACLs   │  │ Esquema  │  │          │
│      │     │      │     │Doc   │     │      │     │ + BD     │  │ relacion.│  │          │
└──────┘     └──────┘     └──────┘     └──────┘     └──────────┘  └──────────┘  └──────────┘
N3RF01       RNF-006      BC-Memb.     US-009       UC-006         ENT-009        EP-015
                            │                          │
                 006 ADR    │     007 Stack   008 RNFT │
                 ┌──────┐   │     ┌──────┐   ┌──────┐ │
                 │PORQUÉ│   │     │ CON  │   │IMPL. │ │
                 │(decis│───┘     │ QUÉ  │   │TÉCN. │─┘
                 │ión)  │         │herram│   │      │
                 │"JWT  │─────────►"Nest │──►│"bcry │
                 │+RBAC"│         │React"│   │pt+   │
                 │      │         │"PG"  │   │AES"  │
                 └──────┘         └──────┘   └──────┘
                 ADR-006                     RNFT-006
```

| Documento | Pregunta que responde                     | Perspectiva                  |
| --------- | ----------------------------------------- | ---------------------------- |
| 003 RF    | **Qué** necesita el negocio               | Necesidad empresarial        |
| 004 RNF   | **Cómo** debe comportarse (restricciones) | Calidad y restricciones      |
| 005 BC    | **Dónde** vive en el dominio              | Estructura DDD               |
| 006 ADR   | **Por qué** se tomó esa decisión          | Justificación arquitectónica |
| 007 Stack | **Con qué** herramientas                  | Tecnologías seleccionadas    |
| 008 RNFT  | **Cómo** se implementa técnicamente       | Implementación concreta      |
| 009 US    | **Quién** hace **qué** y **para qué**     | Flujo de usuario             |
| 010 UC    | **Flujo completo** con eventos y errores  | Especificación ejecutable    |
| 012 ENT   | **En qué** tabla se persiste              | Esquema relacional           |
| 013 EP    | **Cómo** se accede vía API                | Contrato HTTP                |

---

## 7. Métricas de la Documentación

| Métrica               | Valor                                     |
| --------------------- | ----------------------------------------- |
| Total documentos      | 10 archivos .md                           |
| Total líneas          | 37.257                                    |
| Total RFs             | 221                                       |
| Total RNFs            | 66                                        |
| Total RNFTs           | ~40+                                      |
| Total ADRs            | 12                                        |
| Total BCs             | 6 (3 Core + 3 Supporting) + transversales |
| Total User Stories    | 202 (80 Must / 110 Should / 12 Could)     |
| Total Casos de Uso    | 76                                        |
| Total Entidades (ENT) | 40                                        |
| Total Endpoints (EP)  | 123                                       |
| Referencias cruzadas  | ~2.459 menciones                          |
| Matrices trazabilidad | 7 explícitas                              |

### Distribución por volumen

```
010 UC   ████████████████████████████████████████████ 15.390 (41%)
009 US   ██████████████████████           7.726 (21%)
013 EP   ███████████                      4.031 (11%)
003 RF   ███████                          2.433  (7%)
005 BC   █████                            2.047  (5%)
008 RNFT ████                             1.567  (4%)
012 ENT  ███                              1.132  (3%)
004 RNF  ███                              1.052  (3%)
006 ADR  ███                              1.041  (3%)
007 Stk  ██                                 838  (2%)
```

---

## 8. Ruta Crítica de Dependencias

El orden en que los documentos deben estar definidos antes de poder crear los siguientes:

```
KB-002 → 003 RF → 005 BC → 006 ADR → 007 Stack → 008 RNFT → 009 US → 010 UC → 012 ENT → 013 EP
              ↘                                       ↗
               004 RNF ──────────────────────────────┘
```

| Paso | Documento | Requiere completado antes |
| ---- | --------- | ------------------------- |
| 1    | 003 RF    | KB-002                    |
| 2    | 004 RNF   | KB-002, 003               |
| 3    | 005 BC    | KB-001, KB-002, 003, 004  |
| 4    | 006 ADR   | 004, 005                  |
| 5    | 007 Stack | 004, 006                  |
| 6    | 008 RNFT  | 004, 007                  |
| 7    | 009 US    | 003, 005, 008             |
| 8    | 010 UC    | 009                       |
| 9    | 012 ENT   | 005, 006, 010             |
| 10   | 013 EP    | 010, 012, 006             |
