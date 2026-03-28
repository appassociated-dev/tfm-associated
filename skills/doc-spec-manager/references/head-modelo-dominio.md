# Bounded Contexts y Modelo de Dominio

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.5  
**Fecha:** Febrero 2026  
**Inputs:** KB-001 (Propuesta TFM), KB-002 (Análisis de Necesidades), KB-003 (Requisitos Funcionales), KB-004 (RNF Base)  
**Estado:** Validado  
**Total BCs:** 6 (3 Core + 3 Supporting) + 1 Extensión Transversal

---

## Índice

1. [Visión General del Dominio](#1-visión-general-del-dominio)
2. [Identificación de Bounded Contexts](#2-identificación-de-bounded-contexts)
3. [BC-Membership: Gestión de Socios](#3-bc-membresia-gestión-de-socios)
4. [BC-Treasury: Gestión Económica](#4-bc-tesoreria-gestión-económica)
5. [BC-Events: Actividades y Participación](#5-bc-eventos-actividades-y-participación)
6. [BC-Communication: Notificaciones y Mensajería](#6-bc-comunicacion-notificaciones-y-mensajería)
7. [BC-Documents: Gestión Documental](#7-bc-documentos-gestión-documental)
   7 bis. [Extensión Transversal: Cumplimiento Normativo](#7-bis-extensión-transversal-cumplimiento-normativo)
8. [BC-Identity: Acceso y Autorización](#8-bc-identidad-acceso-y-autorización)
9. [Context Map](#9-context-map)
10. [Consideraciones Multi-Tenant](#10-consideraciones-multi-tenant)
11. [Glosario del Dominio (Ubiquitous Language)](#11-glosario-del-dominio-ubiquitous-language)

---

## 1. Visión General del Dominio

### 1.1 Problema de Negocio

Las colectividades españolas (asociaciones culturales, cofradías, clubes deportivos, peñas festeras) gestionan su operativa con herramientas inadecuadas (Excel, papel, WhatsApp). Los tesoreros voluntarios dedican horas a tareas administrativas que deberían estar automatizadas.

### 1.2 Subdominios Identificados

| Subdominio             | Tipo       | Descripción                                   | Bounded Context  |
| ---------------------- | ---------- | --------------------------------------------- | ---------------- |
| Gestión de Membresía   | **Core**   | Registro, estados, tipos de socio, antigüedad | BC-Membership    |
| Gestión Económica      | **Core**   | Cuotas, cobros, remesas SEPA, contabilidad    | BC-Treasury      |
| Gestión de Actividades | **Core**   | Eventos, inscripciones, asistencia            | BC-Events        |
| Comunicación           | Supporting | Notificaciones, emails, tablón de anuncios    | BC-Communication |
| Gestión Documental     | Supporting | Repositorio, actas, documentos oficiales      | BC-Documents     |
| Identidad y Acceso     | Generic    | Autenticación, autorización, roles            | BC-Identity      |

### 1.3 Alcance MVP

Según KB-001, el MVP se centra en **2-3 bounded contexts core**:

- ✅ **BC-Membership** (completo)
- ✅ **BC-Treasury** (completo)
- ⚠️ **BC-Events** (simplificado: sin específicos de cofradías/clubes)
- ⚠️ **BC-Communication** (mínimo: notificaciones automáticas)
- ⚠️ **BC-Documents** (mínimo: repositorio básico)
- ✅ **BC-Identity** (completo: requerido para seguridad)

---

## 2. Identificación de Bounded Contexts

### 2.1 Mapeo RF → Bounded Context

| Sección RF              | Bounded Context  | RFs Incluidos   |
| ----------------------- | ---------------- | --------------- |
| N2: Arquitectura/Acceso | BC-Identity      | N2RF01-N2RF08   |
| N3: Socios/Miembros     | BC-Membership    | N3RF01-N3RF34   |
| N4: Tesorería/Finanzas  | BC-Treasury      | N4RF01-N4RF38   |
| N5: Eventos             | BC-Events        | N5RF01-N5RF30   |
| N6: Comunicación        | BC-Communication | N6RF01-N6RF23   |
| N7: Gestión Documental  | BC-Documents     | N7RF01-N7RF12   |
| N8: Import/Export       | Transversal      | N8RF01-N8RF13   |
| N9: Reporting           | Transversal      | N9RF01-N9RF12   |
| N10: Portal Socio       | Transversal (UI) | N10RF01-N10RF15 |
| N11: Cumplimiento       | Transversal      | N11RF01-N11RF17 |
| N12: Específicas        | Extensiones BC   | N12RF01-N12RF15 |
| N13: Aragonés           | Extensiones BC   | N13RF01-N13RF04 |

### 2.2 Principios de Diseño

1. **Autonomía**: Cada BC puede evolucionar independientemente
2. **Cohesión**: Conceptos relacionados permanecen juntos
3. **Acoplamiento bajo**: Comunicación entre BCs vía Domain Events
4. **Lenguaje ubicuo**: Cada BC tiene su propio vocabulario preciso

---

## 9. Context Map

### 9.1 Diagrama de Relaciones

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CONTEXT MAP                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐      │
│    │              │         │              │         │              │      │
│    │ BC-Identity │◄───ACL──┤ BC-Membership │───PUB───► BC-Treasury │      │
│    │   (Generic)  │         │    (Core)    │         │    (Core)    │      │
│    │              │         │              │         │              │      │
│    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘      │
│           │                        │                        │              │
│           │                        │ PUB                    │ PUB          │
│           │                        ▼                        ▼              │
│           │                 ┌──────────────┐         ┌──────────────┐      │
│           │                 │              │         │              │      │
│           └────ACL─────────►│  BC-Events  │◄──SUB───┤BC-Comunicac. │      │
│                             │    (Core)    │         │ (Supporting) │      │
│                             │              │         │              │      │
│                             └──────┬───────┘         └──────┬───────┘      │
│                                    │                        │              │
│                                    │ PUB                    │              │
│                                    ▼                        │              │
│                             ┌──────────────┐                │              │
│                             │              │◄───────────────┘              │
│                             │BC-Documents │                               │
│                             │ (Supporting) │                               │
│                             │              │                               │
│                             └──────────────┘                               │
│                                                                            │
│  Leyenda:                                                                  │
│    ───ACL───► : Anticorruption Layer (traduce conceptos)                   │
│    ───PUB───► : Publisher (emite Domain Events)                            │
│    ◄──SUB─── : Subscriber (consume Domain Events)                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Relaciones Detalladas

| Upstream         | Downstream       | Tipo              | Descripción                                       |
| ---------------- | ---------------- | ----------------- | ------------------------------------------------- |
| BC-Identity      | BC-Membership    | ACL               | TenantMembership traduce User a contexto de socio |
| BC-Identity      | BC-Events        | ACL               | Eventos usa UserId pero no conoce detalles        |
| BC-Membership    | BC-Treasury      | Pub/Sub           | Eventos de socio disparan generación de cargos    |
| BC-Membership    | BC-Communication | Pub/Sub           | Eventos de socio disparan notificaciones          |
| BC-Treasury      | BC-Communication | Pub/Sub           | Eventos de pago/morosidad disparan avisos         |
| BC-Treasury      | BC-Membership    | Pub/Sub           | Morosidad grave cambia estado del socio           |
| BC-Events        | BC-Treasury      | Pub/Sub           | Inscripción con precio genera cargo               |
| BC-Events        | BC-Communication | Pub/Sub           | Eventos de actividad disparan notificaciones      |
| BC-Events        | BC-Documents     | Pub/Sub           | Check-in puede adjuntar justificantes             |
| BC-Communication | BC-Documents     | Customer/Supplier | Comunicación solicita adjuntar documentos         |

### 9.3 Shared Kernel

Los siguientes elementos son compartidos entre BCs (librería común):

```
shared-kernel/
├── value-objects/
│   ├── MemberId
│   ├── TenantId
│   ├── UserId
│   ├── FiscalYearId
│   ├── Money
│   └── Email
├── events/
│   └── DomainEvent (base)
└── interfaces/
    └── AggregateRoot
```

---

## 10. Consideraciones Multi-Tenant

### 10.1 Estrategia de Aislamiento (RNF-004)

Según RNF-004, el aislamiento multi-tenant se implementa por **base de datos separada**:

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA MULTI-TENANT                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐      ┌─────────────────────────────────┐  │
│   │             │      │        TENANT RESOLUTION        │  │
│   │   Usuario   │─────►│  1. Extraer tenant de request   │  │
│   │   Request   │      │  2. Obtener conexión BD tenant  │  │
│   │             │      │  3. Inyectar en contexto        │  │
│   └─────────────┘      └─────────────────────────────────┘  │
│                                    │                        │
│                                    ▼                        │
│   ┌────────────────────────────────────────────────────┐    │
│   │                   BASES DE DATOS                   │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                    │    │
│   │  ┌───────────┐  ┌──────────┐  ┌──────────┐         │    │
│   │  │ DB-Main   │  │DB-Tenant1│  │DB-Tenant2│  ...    │    │
│   │  │(Identidad)│  │(user_t1) │  │(user_t2) │         │    │
│   │  └───────────┘  └──────────┘  └──────────┘         │    │
│   │                                                    │    │
│   │  - Usuarios     - Socios      - Socios             │    │
│   │  - Tenants      - Cuotas      - Cuotas             │    │
│   │  - Membresías   - Eventos     - Eventos            │    │
│   │                 - Docs        - Docs               │    │
│   │                                                    │    │
│   └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Ubicación de Datos por BC

| BC               | Base de Datos | Justificación                               |
| ---------------- | ------------- | ------------------------------------------- |
| BC-Identity      | DB-Main       | Cross-tenant: usuarios, tenants, membresías |
| BC-Membership    | DB-TenantX    | Datos aislados por entidad                  |
| BC-Treasury      | DB-TenantX    | Datos aislados por entidad                  |
| BC-Events        | DB-TenantX    | Datos aislados por entidad                  |
| BC-Communication | DB-TenantX    | Datos aislados por entidad                  |
| BC-Documents     | DB-TenantX    | Datos aislados + almacenamiento ficheros    |

### 10.3 Referencias Cross-Tenant

Las únicas referencias cross-tenant permitidas son:

1. **UserId** → referenciado desde membresías en DB-TenantX
2. **TenantId** → almacenado en contexto de ejecución, no en datos

Nunca se almacenan datos de un tenant en la BD de otro.

---

## 11. Glosario del Dominio (Ubiquitous Language)

### Términos Generales

| Término        | Definición                                            | BC        |
| -------------- | ----------------------------------------------------- | --------- |
| **Socio**      | Persona física que pertenece a la colectividad        | Membresia |
| **Hermano**    | Sinónimo de socio en cofradías                        | Membresia |
| **Peñista**    | Sinónimo de socio en peñas                            | Membresia |
| **Aspirante**  | Persona en proceso de alta, aún no es socio pleno     | Membresia |
| **Ejercicio**  | Período temporal de gestión (año natural o temporada) | Membresia |
| **Antigüedad** | Tiempo acumulado como socio, determina derechos       | Membresia |
| **Carnet**     | Documento de identificación del socio                 | Membresia |

### Términos Económicos

| Término          | Definición                                     | BC        |
| ---------------- | ---------------------------------------------- | --------- |
| **Cuota**        | Importe periódico que debe abonar el socio     | Tesoreria |
| **Cargo**        | Deuda generada al socio por cualquier concepto | Tesoreria |
| **Remesa**       | Conjunto de cobros enviados al banco           | Tesoreria |
| **Mandato SEPA** | Autorización firmada para domiciliar cobros    | Tesoreria |
| **Morosidad**    | Situación de impago de cuotas                  | Tesoreria |

### Términos de Actividades

| Término         | Definición                                 | BC      |
| --------------- | ------------------------------------------ | ------- |
| **Evento**      | Actividad organizada por la colectividad   | Eventos |
| **Inscripción** | Registro de participación en un evento     | Eventos |
| **Aforo**       | Capacidad máxima de asistentes a un evento | Eventos |
| **Check-in**    | Registro de asistencia efectiva            | Eventos |

### Términos Organizativos

| Término             | Definición                                           | BC         |
| ------------------- | ---------------------------------------------------- | ---------- |
| **Junta Directiva** | Órgano de gobierno de la colectividad                | Identidad  |
| **Asamblea**        | Reunión de todos los socios con derecho a voto       | Documentos |
| **Acta**            | Documento oficial que recoge acuerdos de reunión     | Documentos |
| **Tenant**          | Cada colectividad/entidad en el sistema multi-tenant | Identidad  |

---

## 9.5 Event Nomenclature: Business vs Internal Events

### Propósito

Esta sección clarifica la distinción entre **Eventos de Negocio** (Business Events) para integración cross-BC y **Eventos Internos** (Internal Events) del ciclo de vida de Aggregates, para evitar confusión durante la documentación de UCs y la implementación del sistema.

### Eventos de Negocio (Business Events) - Integración Cross-BC

**Características:**

- Publicados para consumo por otros Bounded Contexts
- Representan **operaciones de negocio completadas** con contexto completo
- Documentados en las tablas de eventos de los UCs (sección "Eventos Publicados")
- Nomenclatura: `<Entidad><AcciónCompletaConContexto>` (ej. `SepaRemittanceGenerated`, `TenantProvisioned`)

**Propósito:**

- Integración y orquestación cross-BC
- Trigger de workflows en otros contextos
- Notificaciones visibles al usuario (vía BC-Communication)

**Ejemplo:** `TenantProvisioned`

- Trigger: Tras completar el provisionamiento completo del tenant (UC-001 paso 6)
- Payload: Información completa (tenantId, nombreColectividad, tipoColectividad, adminUserId, cif)
- Consumidores: BC-Communication (email bienvenida), Sistema de Monitorización

### Eventos Internos (Internal Events) - Ciclo de Vida de Aggregates

**Características:**

- Emitidos durante cambios de estado internos del Aggregate
- Representan **operaciones técnicas de grano fino**
- NO documentados en tablas de eventos de UCs (solo en KB-005)
- Nomenclatura: `<Entidad><AcciónSimple>` (ej. `SepaRemittanceGenerated`, `TenantCreado`)

**Propósito:**

- Auditoría y trazabilidad interna
- Implementación futura de event sourcing
- Tracking del ciclo de vida del Aggregate

**Ejemplo:** `TenantCreado`

- Trigger: Cuando se crea por primera vez el Aggregate Tenant (UC-001 paso 2)
- Payload: Información técnica (tenantId, datos básicos)
- Consumidores: Ninguno (solo uso interno)
- Evento de Negocio: `TenantProvisioned` se emite posteriormente cuando el provisionamiento se completa

### Mapeo: Eventos Internos → Eventos de Negocio

| Evento Interno (KB-005)        | Evento de Negocio (UCs)    | Contexto                                           |
| ------------------------------ | -------------------------- | -------------------------------------------------- |
| `TenantCreado`                 | `TenantProvisioned`        | UC-001: Provisionamiento de tenant                 |
| `SepaRemittanceGenerated`      | `SepaRemittanceGenerated`  | UC-023: Generación de remesa SEPA                  |
| `SepaRemittanceSent`           | `SepaRemittanceSent`       | UC-023: Procesamiento de remesa SEPA               |
| `SepaMandateRegistered`        | `SepaMandateRegistered`    | UC-023: Registro de mandato SEPA                   |
| `SepaMandateExpired`           | (Implícito en UC-023 FA-3) | UC-023: Caducidad de mandato tras 36 meses         |
| `MemberSuspendedForNonpayment` | `MemberStatusChanged`      | UC-007/UC-022: Evento genérico de cambio de estado |

### Guías de Implementación

**Al documentar UCs:**

1. Incluir SOLO Eventos de Negocio en las tablas "Eventos Publicados"
2. Los Eventos Internos pueden mencionarse en las descripciones de flujo pero no en tablas de eventos
3. Si existen ambos tipos de eventos, emitir primero el Interno, luego el de Negocio

**Al implementar Event-Driven Architecture:**

1. Publicar Eventos de Negocio en message broker (ej. RabbitMQ, Kafka)
2. Almacenar Eventos Internos en event store para auditoría (opcional)
3. Los consumidores externos NO deben depender NUNCA de Eventos Internos

---

## Trazabilidad

### Matriz BC → Secciones RF

| BC               | Secciones RF     | Total RFs |
| ---------------- | ---------------- | --------- |
| BC-Identity      | N2               | 8         |
| BC-Membership    | N3               | 34        |
| BC-Treasury      | N4               | 35        |
| BC-Events        | N5               | 30        |
| BC-Communication | N6               | 23        |
| BC-Documents     | N7               | 12        |
| Transversal      | N8, N9, N10, N11 | 57        |
| Extensiones      | N12, N13         | 19        |
| **Total**        |                  | **218**   |

### Matriz BC → RNF Relevantes

| BC               | RNFs Clave                                                                             |
| ---------------- | -------------------------------------------------------------------------------------- |
| BC-Identity      | RNF-001 a RNF-003 (autenticación), RNF-004 (multi-tenant), RNF-013 (mínimo privilegio) |
| BC-Membership    | RNF-006 (cifrado datos), RNF-025-030 (RGPD), RNF-035 (datos religiosos)                |
| BC-Treasury      | RNF-006 (cifrado IBAN), RNF-018 (rendimiento masivas), RNF-042 (gestión errores)       |
| BC-Events        | RNF-006 (aforo), RNF-015-016 (tiempos respuesta)                                       |
| BC-Communication | RNF-010 (rate limiting), RNF-034 (privacidad diseño)                                   |
| BC-Documents     | RNF-009 (ficheros seguros), RNF-022 (carga ficheros), RNF-032 (retención)              |

### Matriz BC → ENT (Tablas Prisma)

| BC               | ENTs Principales                                                                                                                                 | DB            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| BC-Identity      | ENT-001 (`tenants`), ENT-002 (`users`), ENT-003 (`tenant_memberships`), ENT-004 (`roles`), ENT-005 (`refresh_tokens`)                            | Main          |
| BC-Membership    | ENT-007 (`member_types`), ENT-008 (`fiscal_years`), ENT-009 (`members`), ENT-010 (`status_history`)                                              | Tenant        |
| BC-Treasury      | ENT-011 (`fee_plans`), ENT-012 (`member_type_fee_plans`), ENT-013 (`member_accounts`), ENT-014..016 (`fee_subscriptions`, `charges`, `payments`) | Tenant        |
| BC-Events        | ENT-030..034 (placeholder)                                                                                                                       | Tenant        |
| BC-Communication | ENT-035..037 (placeholder)                                                                                                                       | Tenant        |
| BC-Documents     | ENT-038..040 (placeholder)                                                                                                                       | Tenant        |
| Transversal      | ENT-006, ENT-017 (`outbox_events`)                                                                                                               | Main + Tenant |

---

## Navegación

Cada BC se encuentra en `bc/bc-{name}.md`.
Ejemplo: `references/bc/bc-identity.md` para BC-Identity.
