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

## 3. BC-Membership: Gestión de Socios

### 3.1 Descripción

Responsable del ciclo de vida completo del socio: desde la solicitud de alta hasta la baja, incluyendo estados, tipos, antigüedad y documentación de identidad (carnets).

### 3.2 Aggregates

#### 3.2.1 Aggregate: Member (Aggregate Root)

```
┌─────────────────────────────────────────────────────────────┐
│ MEMBER (Aggregate Root)                                     │
├─────────────────────────────────────────────────────────────┤
│ Identity: MemberId                                          │
│                                                             │
│ Value Objects:                                              │
│   - PersonalData (name, surnames, birthDate)                │
│   - ContactData (email, phone, address)                     │
│   - IdentityDocument (tipo, numero)                         │
│   - BankDetails (iban) [cifrado]                            │
│   - MemberNumber                                            │
│                                                             │
│ Entities:                                                   │
│   - HistorialEstados[] (cambios de estado con fecha/motivo) │
│   - CamposPersonalizados[] (clave-valor por tipo entidad)   │
│                                                             │
│ State:                                                      │
│   - currentStatus: MemberStatus                             │
│   - memberType: MemberTypeId                                │
│   - registrationDate: Date                                  │
│   - leaveDate: Date?                                        │
│                                                             │
│ Invariants:                                                 │
│   - DNI/NIE único dentro del tenant                         │
│   - Email único dentro del tenant                           │
│   - Fecha de nacimiento <= hoy - edad mínima del tipo       │
│   - IBAN válido según algoritmo de verificación             │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-009 (`members`), ENT-010 (`status_history`)

**Comportamientos:**

- `register(data, type)` → valida, crea con estado Aspirante/Activo
- `changeStatus(newStatus, reason)` → valida transición, registra historial
- `changeType(newType)` → valida elegibilidad, ajusta derechos
- `updateData(data)` → valida, actualiza, emite evento
- `calculateSeniority()` → retorna años/meses considerando bajas
- `verifyVotingRight()` → evalúa antigüedad y estado
- `deactivate(type, reason)` → transición a estado de baja

#### 3.2.2 Aggregate: MemberType

```
┌─────────────────────────────────────────────────────────────┐
│ MEMBER_TYPE (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: MemberTypeId                                      │
│                                                             │
│ Value Objects:                                              │
│   - AgeRange (minima, maxima)                               │
│   - FeeConfiguration (importe, periodicidad, formula?)      │
│                                                             │
│ Properties:                                                 │
│   - code: string                                            │
│   - name: string                                            │
│   - description: string                                     │
│   - votingRight: boolean                                    │
│   - eligibleForOffice: boolean                              │
│   - minimumSeniorityForVoting: int (años)                   │
│   - minimumSeniorityForOffice: int (años)                   │
│   - automaticTransition: MemberTypeId? (al cumplir edad)    │
│   - active: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Código único dentro del tenant                          │
│   - Edad mínima < edad máxima (si ambas definidas)          │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-007 (`member_types`)

#### 3.2.3 Aggregate: RegistrationRequest

```
┌─────────────────────────────────────────────────────────────┐
│ REGISTRATION_REQUEST (Aggregate Root)                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: RequestId                                         │
│                                                             │
│ Value Objects:                                              │
│   - ApplicantData (datos personales del aspirante)          │
│                                                             │
│ Entities:                                                   │
│   - DocumentoPendiente[] (tipo, entregado, fechaLimite)     │
│   - Aval[] (avalista: MemberId, fecha) [para cofradías]     │
│                                                             │
│ State:                                                      │
│   - estado: RequestStatus                                   │
│   - requestDate: Date                                       │
│   - requestedMemberType: MemberTypeId                       │
│   - priority: int (para lista de espera)                    │
│                                                             │
│ Invariants:                                                 │
│   - Avales deben ser socios con antigüedad mínima           │
│   - No puede haber solicitud duplicada (mismo DNI activa)   │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-024 (`registration_requests`) [placeholder]

#### 3.2.4 Aggregate: MemberCard

```
┌─────────────────────────────────────────────────────────────┐
│ MEMBER_CARD (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: MemberCardId                                      │
│                                                             │
│ Value Objects:                                              │
│   - QRCode (valor único, hash del carnet)                   │
│                                                             │
│ Properties:                                                 │
│   - memberId: MemberId                                      │
│   - fiscalYearId: FiscalYearId                              │
│   - issueDate: Date                                         │
│   - validUntil: Date                                        │
│   - estado: MemberCardStatus (activo, anulado)              │
│                                                             │
│ Invariants:                                                 │
│   - Un socio solo puede tener un carnet activo por ejercicio│
│   - QR único en todo el sistema                             │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-021 (`member_cards`) [placeholder]

#### 3.2.5 Aggregate: FiscalYear

```
┌─────────────────────────────────────────────────────────────┐
│ FISCAL_YEAR (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: FiscalYearId                                      │
│                                                             │
│ Value Objects:                                              │
│   - FiscalYearPeriod (fechaInicio, fechaFin)                │
│                                                             │
│ Properties:                                                 │
│   - name: string (ej: "2026", "Temporada 2025-26")          │
│   - estado: FiscalYearStatus (PREPARATION, activo, cerrado) │
│   - previousFiscalYear: FiscalYearId?                       │
│                                                             │
│ Invariants:                                                 │
│   - Solo un ejercicio activo a la vez                       │
│   - Fechas no pueden solaparse con otros ejercicios         │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-008 (`fiscal_years`)

#### 3.2.6 Aggregate: WaitingList

```
┌─────────────────────────────────────────────────────────────┐
│ WAITING_LIST (Aggregate Root)                               │
├─────────────────────────────────────────────────────────────┤
│ Identity: WaitingListId                                     │
│                                                             │
│ Value Objects:                                              │
│   - WaitingPosition (numero de orden cronológico)           │
│   - RegistrationDate (fecha y hora de entrada en lista)     │
│                                                             │
│ Properties:                                                 │
│   - requestId: RequestId                                    │
│   - memberTypeId: MemberTypeId                              │
│   - position: int (calculado, orden cronológico)            │
│   - entryDate: DateTime                                     │
│   - exitDate: DateTime? (al procesar)                       │
│   - reason: ListExitReason? (aprobado, rechazado, etc.)     │
│   - estado: WaitingListStatus (activo, procesado)           │
│                                                             │
│ Invariants:                                                 │
│   - Posición única en lista activa                          │
│   - No puede haber solicitudes duplicadas (mismo DNI)       │
│   - Solo socios en estado aspirante pueden estar en lista   │
│   - Orden cronológico estricto por entryDate                │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-022 (`waiting_list`) [placeholder]

**Comportamientos:**

- `addToList(request)` → añade al final, calcula posición
- `processNext()` → retorna siguiente en cola, marca procesado
- `removeFromList(reason)` → saca de la cola (voluntario, expiración)
- `recalculatePositions()` → reordena tras bajas

#### 3.2.7 Aggregate: DisciplinaryCase

```
┌─────────────────────────────────────────────────────────────┐
│ DISCIPLINARY_CASE (Aggregate Root)                          │
├─────────────────────────────────────────────────────────────┤
│ Identity: CaseId                                            │
│                                                             │
│ Value Objects:                                              │
│   - InfractionType (enum: MINOR, SERIOUS, VERY_SERIOUS)     │
│   - SanctionType (enum: WARNING, SUSPENSION, EXPULSION)     │
│   - CaseStatus (enum: OPEN, UNDER_REVIEW, CLOSED)           │
│                                                             │
│ Entities:                                                   │
│   - RecordedInfraction[] (detalle de cada infracción)       │
│                                                             │
│ Properties:                                                 │
│   - memberId: MemberId                                      │
│   - caseNumber: string (correlativo)                        │
│   - openDate: Date                                          │
│   - closeDate: Date?                                        │
│   - appliedSanction: SanctionType?                          │
│   - suspensionDays: int? (si sancion es suspension)         │
│   - closeReason: string?                                    │
│   - resolvedBy: UserId?                                  │
│                                                             │
│ Invariants:                                                 │
│   - Número de expediente único dentro del tenant            │
│   - Fecha sanción <= fecha actual                           │
│   - Expediente cerrado no puede modificarse                 │
│   - Si suspensionDays definido, sancion debe ser suspension │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-023 (`disciplinary_cases`) [placeholder]

**Comportamientos:**

- `openCase(member, infraction)` → crea con estado abierto
- `addInfraction(detail)` → registra nueva infracción al expediente
- `applySanction(type, days?)` → asigna sanción y cierra expediente
- `archive(reason)` → cierra sin sanción (sobreseimiento)

### 3.3 Value Objects

| Value Object        | Atributos                        | Validaciones                                                                                                   |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `MemberId`          | uuid                             | UUID v4 válido                                                                                                 |
| `MemberNumber`      | valor: string                    | Formato configurable por tenant                                                                                |
| `PersonalData`      | name, surnames, birthDate        | Nombre no vacío, fecha pasada                                                                                  |
| `ContactData`       | email, phone, address            | Email válido, teléfono formato ES                                                                              |
| `IdentityDocument`  | tipo (DNI/NIE/Pasaporte), numero | Algoritmo validación según tipo                                                                                |
| `BankDetails`       | iban                             | IBAN válido (algoritmo mod 97)                                                                                 |
| `MemberStatus`      | enum                             | ACTIVE, PENDING_PAYMENT, SUSPENDED, VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE, APPLICANT, DECEASED |
| `AgeRange`          | minima, maxima                   | min >= 0, max > min (si definidos)                                                                             |
| `QRCode`            | valor: string                    | Hash único, no predecible                                                                                      |
| `WaitingPosition`   | numero: int                      | Orden cronológico en lista espera                                                                              |
| `RegistrationDate`  | fecha: DateTime                  | Timestamp de entrada en lista                                                                                  |
| `ListExitReason`    | enum                             | APPROVED, REJECTED, EXPIRED, VOLUNTARY                                                                         |
| `WaitingListStatus` | enum                             | ACTIVE, Procesado                                                                                              |
| `InfractionType`    | enum                             | MINOR, SERIOUS, VERY_SERIOUS                                                                                   |
| `SanctionType`      | enum                             | WARNING, SUSPENSION, EXPULSION                                                                                 |
| `CaseStatus`        | enum                             | OPEN, UNDER_REVIEW, CLOSED                                                                                     |

### 3.4 Domain Events

| Evento                        | Trigger                       | Payload                                       | Consumidores                                                   |
| ----------------------------- | ----------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `MemberRegistered`            | Alta completada               | memberId, memberType, fecha                   | BC-Treasury (generar cuota), BC-Communication (bienvenida)     |
| `MemberDeactivated`           | Baja cualquier tipo           | memberId, tipoBaja, motivo, fecha             | BC-Treasury (anular pendientes), BC-Communication (notificar)  |
| `MemberStatusChanged`         | Cambio de estado              | memberId, estadoAnterior, estadoNuevo, motivo | BC-Treasury (suspender/reactivar cobros)                       |
| `MemberTypeChanged`           | Cambio de categoría           | memberId, tipoAnterior, tipoNuevo             | BC-Treasury (ajustar cuota)                                    |
| `MemberDataUpdated`           | Modificación datos            | memberId, camposModificados                   | BC-Treasury (si IBAN), BC-Communication (si email)             |
| `MemberCardValidated`         | Escaneo QR exitoso            | memberCardId, memberId, timestamp, ubicacion? | BC-Events (check-in automático)                                |
| `FiscalYearOpened`            | Apertura ejercicio            | fiscalYearId, periodo                         | BC-Treasury (generar cuotas), BC-Membership (arrastrar socios) |
| `FiscalYearClosed`            | Cierre ejercicio              | fiscalYearId, estadisticas                    | BC-Documents (generar memoria)                                 |
| `RegistrationRequestStarted`  | Nueva solicitud               | requestId, datos                              | BC-Communication (notificar junta)                             |
| `RegistrationRequestApproved` | Aprobación                    | requestId, memberId                           | BC-Communication (notificar aspirante)                         |
| `MemberTypeCreated`           | Creación de tipo de socio     | memberTypeId, name, description, tenantId     | BC-Treasury (vincular planes de cuota)                         |
| `NonpaymentLeave`             | Baja automática por morosidad | memberId, deudaTotal, leaveDate               | BC-Communication (notificar), BC-Treasury (cerrar cuenta)      |

### 3.5 Trazabilidad RF

| RF        | Elemento de Dominio                                                                    |
| --------- | -------------------------------------------------------------------------------------- |
| N3RF01    | Member (PersonalData, ContactData, BankDetails)                                        |
| N3RF02-05 | Member.CamposPersonalizados (extensión por tipo colectividad)                          |
| N3RF06    | MemberStatus (Value Object enum)                                                       |
| N3RF07-10 | MemberType (Aggregate)                                                                 |
| N3RF11    | MemberType.configuracion (reglas)                                                      |
| N3RF12-13 | Member.HistorialEstados, calculateSeniority()                                          |
| N3RF14    | Domain Service: MemberStatistics                                                       |
| N3RF15-19 | FiscalYear (Aggregate)                                                                 |
| N3RF20-23 | RegistrationRequest (Aggregate 3.2.3), workflow estados, WaitingList (Aggregate 3.2.6) |
| N3RF24-27 | Member.deactivate(), eventos de baja, DisciplinaryCase (Aggregate 3.2.7)               |
| N3RF28-29 | RegistrationRequest con prioridad (lista espera), WaitingList (Aggregate 3.2.6)        |
| N3RF30-32 | MemberCard (Aggregate)                                                                 |
| N3RF33-34 | MemberCard específico cofradías (PapeletaSitio - extensión)                            |

---

## 4. BC-Treasury: Gestión Económica

### 4.1 Descripción

Responsable de toda la gestión económica: definición de cuotas, generación de cargos, registro de cobros, gestión de morosidad, generación de remesas SEPA y contabilidad básica.

### 4.2 Aggregates

#### 4.2.1 Aggregate: MemberAccount

```
┌─────────────────────────────────────────────────────────────────┐
│ MEMBER_ACCOUNT (Aggregate Root)                                 │
├─────────────────────────────────────────────────────────────────┤
│ Identity: MemberAccountId                                       │
│                                                                 │
│ References:                                                     │
│   - memberId: MemberId (referencia a BC-Membership)               │
│                                                                 │
│ Entities:                                                       │
│   - FeeSubscription[] (planes de cuota activos e histórico)     │  ← AÑADIR
│   - Charge[] (deudas pendientes o histórico)                    │
│   - Payment[] (cobros realizados)                               │
│   - SepaMandate? (autorización domiciliación)                   │
│                                                                 │
│ Computed:                                                       │
│   - pendingBalance: Money                                       │
│   - delinquencyStatus: DelinquencyStatus                        │
│                                                                 │
│ Invariants:                                                     │
│   - Un socio tiene exactamente una cuenta                       │
│   - Saldo pendiente = suma(cargos) - suma(pagos)                │
│   - Máximo una suscripción periódica activa por plan            │
└─────────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-013 (`member_accounts`), ENT-014 (`fee_subscriptions`), ENT-015 (`charges`), ENT-016 (`payments`)

#### 4.2.2 Entity: Charge (dentro de MemberAccount)

```
┌─────────────────────────────────────────────────────────────────┐
│ CHARGE (Entity)                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Identity: ChargeId                                              │
│                                                                 │
│ Value Objects:                                                  │
│   - Money (baseAmount - antes de prorrateo)                     │
│   - Money (finalAmount - importe efectivo a cobrar)             │
│   - ChargeDescription (description, ejercicio)                  │
│                                                                 │
│ Properties:                                                     │
│   - subscriptionId: SubscriptionId? (NULL si cargo manual)      │
│   - billingMonth: int? (1-12, NULL para cargos únicos/manuales) │
│   - issueDate: Date                                             │
│   - dueDate: Date                                               │
│   - status: ChargeStatus                                        │
│   - paidAmount: Money (para pagos parciales)                    │
│   - isProrated: boolean                                         │
│   - isManual: boolean (true si cargo directo sin suscripción)   │
│                                                                 │
│ Invariants:                                                     │
│   - finalAmount > 0                                             │
│   - dueDate >= issueDate                                        │
│   - paidAmount <= finalAmount                                   │
│   - Si isManual=true, subscriptionId debe ser NULL              │
│   - Si isManual=false, subscriptionId debe existir              │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 Entity: Payment (dentro de MemberAccount)

```
┌─────────────────────────────────────────────────────────────┐
│ PAYMENT (Entity)                                            │
├─────────────────────────────────────────────────────────────┤
│ Identity: PaymentId                                         │
│                                                             │
│ Value Objects:                                              │
│   - Money (amount, moneda)                                  │
│   - PaymentMethod (type, referencia)                        │
│                                                             │
│ Properties:                                                 │
│   - chargeId: ChargeId (cargo que liquida)                  │
│   - paymentDate: Date                                       │
│   - recordDate: Date                                        │
│   - recordedBy: UserId                                   │
│   - receiptDocumentId: DocumentId? (referencia BC-Documents)│
│   - status: PaymentStatus                                   │
│                                                             │
│ Invariants:                                                 │
│   - amount > 0                                              │
│   - paymentDate <= recordDate                               │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.4 Entity: SepaMandate (dentro de MemberAccount)

```
┌─────────────────────────────────────────────────────────────┐
│ SEPA_MANDATE (Entity)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: MandateId                                         │
│                                                             │
│ Value Objects:                                              │
│   - MandateReference (único por acreedor)                   │
│   - DatosBancarios (iban del deudor)                        │
│                                                             │
│ Properties:                                                 │
│   - signatureDate: Date                                     │
│   - lastDebitDate: Date?                                    │
│   - status: MandateStatus (activo, revocado, caducado)      │
│   - signedDocument: DocumentId?                            │
│                                                             │
│ Invariants:                                                 │
│   - Caduca si lastDebitDate > 36 meses                      │
│   - Referencia única por acreedor                           │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-018 (`sepa_mandates`) [pending]

#### 4.2.5 Aggregate: FeePlan

```
┌─────────────────────────────────────────────────────────────────┐
│ FEE_PLAN (Aggregate Root)                                       │
├─────────────────────────────────────────────────────────────────┤
│ Identity: FeePlanId                                             │
│                                                                 │
│ Value Objects:                                                  │
│   - Money (amount)                                              │
│   - Frequency (enum orientativo: MONTHLY, QUARTERLY,            │
│                 BIANNUAL, ANNUAL, CUSTOM)                       │
│                                                                 │
│ Properties:                                                     │
│   - code: string                                                │
│   - name: string                                                │
│   - description: string?                                        │
│   - type: PlanType (ONE_TIME | RECURRING)                       │
│   - billingMonths: int[] (ej: [1,4,7,10] para trimestral)       │
│   - active: boolean                                             │
│                                                                 │
│ Invariants:                                                     │
│   - Código único dentro del tenant                              │
│   - Si type=RECURRING, billingMonths no puede estar vacío       │
│   - Si type=ONE_TIME, billingMonths debe estar vacío            │
│   - amount >= 0 (puede ser 0 para planes especiales)            │
└─────────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-011 (`fee_plans`), ENT-012 (`member_type_fee_plans`)

#### 4.2.6 Entity: MemberTypeFeePlan (Relación N:M)

```
┌─────────────────────────────────────────────────────────────────┐
│ MEMBER_TYPE_FEE_PLAN (Entity - tabla intermedia)                │
├─────────────────────────────────────────────────────────────────┤
│ Identity: Composite (memberTypeId + feePlanId)                  │
│                                                                 │
│ Properties:                                                     │
│   - memberTypeId: MemberTypeId (ref BC-Membership)               │
│   - feePlanId: FeePlanId                                        │
│   - isDefault: boolean (plan por defecto para este tipo)        │
│   - orden: int (orden de presentación en UI)                    │
│   - active: boolean                                             │
│                                                                 │
│ Invariants:                                                     │
│   - Solo un plan puede ser default por tipo de socio            │
│   - Orden único por tipo de socio                               │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.6 Aggregate: SepaRemittance

```
┌─────────────────────────────────────────────────────────────┐
│ SEPA_REMITTANCE (Aggregate Root)                            │
├─────────────────────────────────────────────────────────────┤
│ Identity: RemittanceId                                      │
│                                                             │
│ Value Objects:                                              │
│   - CreditorIdentifier (CIF + sufijo Banco España)          │
│   - Money (totalAmount)                                     │
│                                                             │
│ Entities:                                                   │
│   - SepaDebit[] (cada cobro individual de la remesa)        │
│                                                             │
│ Properties:                                                 │
│   - createdAt: Date                                         │
│   - chargeDate: Date (fecha valor en banco)                 │
│   - status: RemittanceStatus                                │
│   - xmlFile: string? (path al fichero generado)             │
│                                                             │
│ Invariants:                                                 │
│   - chargeDate >= createdAt + 3 días hábiles                │
│   - totalAmount = suma(adeudos.amount)                      │
│   - Todos los adeudos deben tener mandato válido            │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-019 (`sepa_remittances`), ENT-020 (`sepa_debits`) [pending]

#### 4.2.7 Entity: FeeSubscription (dentro de MemberAccount)

```
┌─────────────────────────────────────────────────────────────────┐
│ FEE_SUBSCRIPTION (Entity)                                       │
├─────────────────────────────────────────────────────────────────┤
│ Identity: SubscriptionId                                        │
│                                                                 │
│ Value Objects:                                                  │
│   - Money (effectiveAmount - importe final tras descuentos)     │
│                                                                 │
│ Properties:                                                     │
│   - feePlanId: FeePlanId                                        │
│   - registrationDate: Date                                             │
│   - leaveDate: Date?                                            │
│   - discount: decimal? (porcentaje: 0.30 = 30%)                 │
│   - cancelReason: SubscriptionCancelReason?                     │
│                                                                 │
│ Computed:                                                       │
│   - effectiveAmount = feePlan.amount * (1 - discount)           │
│                                                                 │
│ Invariants:                                                     │
│   - leaveDate >= registrationDate (si existe)                          │
│   - discount entre 0 y 1 (si existe)                            │
│   - Si feePlan.type=ONE_TIME, leaveDate se asigna automáticamente│
│     al generar el cargo                                         │
└─────────────────────────────────────────────────────────────────┘

SubscriptionCancelReason (enum):
  - PLAN_CHANGE: Socio cambió a otra modalidad de pago
  - MEMBER_LEAVE: Socio dado de baja de la entidad
  - EXEMPTION: Socio exento de pago
  - ONE_TIME_COMPLETED: Cuota única completada (automático)
```

#### 4.2.8 Entity: SepaDebit (dentro de SepaRemittance)

```
┌─────────────────────────────────────────────────────────────┐
│ SEPA_DEBIT (Entity)                                         │
├─────────────────────────────────────────────────────────────┤
│ Identity: DebitId                                           │
│                                                             │
│ Value Objects:                                              │
│   - Money (amount)                                          │
│   - SepaSequence (FRST, RCUR, OOFF, FNAL)                   │
│                                                             │
│ Properties:                                                 │
│   - chargeId: ChargeId                                      │
│   - mandateId: MandateId                                    │
│   - status: DebitStatus                                     │
│   - returnReason: string?                                   │
│   - returnDate: Date?                                       │
│                                                             │
│ Invariants:                                                 │
│   - Secuencia correcta según historial del mandato          │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.9 Aggregate: Transaction (Contabilidad)

```
┌─────────────────────────────────────────────────────────────┐
│ TRANSACTION (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: TransactionId                                     │
│                                                             │
│ Value Objects:                                              │
│   - Money (amount)                                          │
│   - AccountingCategory (cuenta según plan ENL si aplica)    │
│                                                             │
│ Properties:                                                 │
│   - type: TipoMovimiento (ingreso, gasto)                   │
│   - description: string                                     │
│   - date: Date                                              │
│   - fiscalYearId: FiscalYearId                               │
│   - paymentId: PaymentId? (si viene de un pago)             │
│   - receiptDocumentId: DocumentId?                         │
│   - recordedBy: UserId                                   │
│                                                             │
│ Invariants:                                                 │
│   - amount > 0                                              │
│   - date dentro del ejercicio                               │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.10 Aggregate: PaymentLink

```
┌─────────────────────────────────────────────────────────────┐
│ PAYMENT_LINK (Aggregate Root)                               │
├─────────────────────────────────────────────────────────────┤
│ Identity: PaymentLinkId                                     │
│                                                             │
│ Value Objects:                                              │
│   - SignedURL (token único criptográfico)                   │
│   - LinkStatus (enum: pendiente, pagado, expirado)          │
│                                                             │
│ Properties:                                                 │
│   - chargeId: ChargeId (cargo a liquidar)                   │
│   - memberId: MemberId                                       │
│   - publicUrl: string (URL completa con token)              │
│   - token: string (hash único no predecible)                │
│   - createdAt: DateTime                                     │
│   - expirationDate: DateTime (por defecto 48h)              │
│   - paymentDate: DateTime? (cuando se completa)             │
│   - paymentId: PaymentId? (pago asociado al completar)      │
│   - status: LinkStatus                                      │
│   - accessAttempts: int (contador de seguridad)             │
│                                                             │
│ Invariants:                                                 │
│   - URL con token único en todo el sistema                  │
│   - expirationDate > createdAt                              │
│   - Un solo pago exitoso por enlace                         │
│   - Estado pagado requiere paymentId definido               │
│   - Enlace expirado o pagado no puede reutilizarse          │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `generateLink(charge, validHours)` → crea URL firmada
- `validateAccess(token)` → verifica vigencia y estado
- `markAsPaid(payment)` → cierra enlace tras pago exitoso
- `expire()` → marca como expirado tras vencimiento

#### 4.2.11 Aggregate: CashRegisterShift

```
┌─────────────────────────────────────────────────────────────┐
│ CASH_REGISTER_SHIFT (Aggregate Root)                        │
├─────────────────────────────────────────────────────────────┤
│ Identity: CashRegisterShiftId                               │
│                                                             │
│ Value Objects:                                              │
│   - Money (importeApertura, importeCierre)                  │
│                                                             │
│ Entities:                                                   │
│   - MovimientoCaja[] (operaciones del turno)                │
│                                                             │
│ Properties:                                                 │
│   - encargado: MemberId (responsable del turno)              │
│   - fechaApertura: DateTime                                 │
│   - fechaCierre: DateTime?                                  │
│   - importeApertura: Money (efectivo inicial)               │
│   - importeCierre: Money? (efectivo final)                  │
│   - status: ShiftStatus (abierto, cerrado, cuadrado)        │
│   - diferenciaContable: Money? (descuadre si existe)        │
│   - observaciones: string?                                  │
│                                                             │
│ Computed:                                                   │
│   - importeEsperado = apertura + ingresos - reintegros      │
│                                                             │
│ Invariants:                                                 │
│   - Solo un turno abierto por caja simultáneamente          │
│   - FechaCierre >= FechaApertura (si definida)              │
│   - ImporteCierre debe estar definido si status=cerrado     │
│   - DiferenciaContable = importeEsperado - importeCierre    │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `openShift(attendant, initialBalance)` → inicia turno
- `recordTransaction(type, amount)` → añade operación
- `closeShift(finalBalance)` → calcula diferencia y cierra
- `reconcileShift(adjustment, reason)` → ajusta descuadres

#### 4.2.12 Aggregate: AccountingCategory

```
┌─────────────────────────────────────────────────────────────┐
│ ACCOUNTING_CATEGORY (Aggregate Root)                        │
├─────────────────────────────────────────────────────────────┤
│ Identity: AccountingCategoryId                              │
│                                                             │
│ Value Objects:                                              │
│   - AccountCode (según plan contable ENL o personalizado)   │
│                                                             │
│ Properties:                                                 │
│   - code: string (ej: "7.1", "4.2.3")                      │
│   - name: string                                            │
│   - description: string?                                    │
│   - type: CategoryType (ingreso, gasto, activo, pasivo)     │
│   - categoriaPadre: AccountingCategoryId? (jerarquía)       │
│   - nivel: int (profundidad en árbol)                       │
│   - esImputable: boolean (permite asignar movimientos)      │
│   - esSistema: boolean (predefinida, no editable)           │
│   - activa: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Código único dentro del tenant                          │
│   - No ciclos en jerarquía de categorías                    │
│   - Categorías sistema no pueden eliminarse ni editarse     │
│   - Solo categorías hoja (sin hijos) pueden ser imputables  │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `createCategory(code, name, parent?)` → valida jerarquía
- `markAsBookable()` → permite asignar movimientos
- `deactivate()` → impide nuevas asignaciones

#### 4.2.13 Aggregate: AccountingYear

```
┌─────────────────────────────────────────────────────────────┐
│ ACCOUNTING_YEAR (Aggregate Root)                            │
├─────────────────────────────────────────────────────────────┤
│ Identity: AccountingYearId                                  │
│                                                             │
│ Value Objects:                                              │
│   - AccountingPeriod (fechaInicio, fechaFin)                │
│   - Money (saldoInicial, saldoFinal)                        │
│                                                             │
│ Properties:                                                 │
│   - name: string (ej: "Ejercicio 2026")                     │
│   - fechaInicio: Date                                       │
│   - fechaFin: Date                                          │
│   - status: AccountingYearStatus (abierto, cerrado)         │
│   - saldoInicial: Money                                     │
│   - saldoFinal: Money? (calculado al cierre)                │
│   - totalIngresos: Money (acumulado)                        │
│   - totalGastos: Money (acumulado)                          │
│   - ejercicioAnterior: AccountingYearId?                    │
│   - fechaCierre: Date? (cuando se cierra)                   │
│   - cerradoPor: UserId?                                  │
│                                                             │
│ Computed:                                                   │
│   - resultado = totalIngresos - totalGastos                 │
│                                                             │
│ Invariants:                                                 │
│   - Solo un ejercicio contable abierto simultáneamente      │
│   - FechaFin > FechaInicio                                  │
│   - Periodos no pueden solaparse con otros ejercicios       │
│   - Ejercicio cerrado no admite nuevos movimientos          │
│   - SaldoFinal = saldoInicial + resultado (al cierre)       │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `openFiscalYear(period, openingBalance)` → inicia ejercicio
- `recordTransaction(type, amount)` → actualiza acumulados
- `closeFiscalYear()` → calcula saldo final, congela
- `reopen(reason)` → reabre por correcciones (auditoría)

### 4.3 Value Objects

| Value Object               | Atributos                         | Validaciones                                                                                              |
| -------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Money`                    | cantidad: decimal, moneda: string | cantidad >= 0, moneda ISO 4217 (default EUR)                                                              |
| `PaymentMethod`            | type: enum, referencia: string    | Tipos: CASH, TRANSFER, DIRECT_DEBIT, BIZUM, CARD                                                          |
| `ChargeStatus`             | enum                              | PENDING, PAID, PARTIALLY_PAID, CANCELLED                                                                  |
| `PaymentStatus`            | enum                              | CONFIRMED, RETURNED, CANCELLED                                                                            |
| `DelinquencyStatus`        | enum                              | UP_TO_DATE, MINOR_DELINQUENCY, MAJOR_DELINQUENCY, Suspendido                                              |
| `SepaSequence`             | enum                              | FRST, RCUR, OOFF, FNAL                                                                                    |
| `RemittanceStatus`         | enum                              | DRAFT, GENERATED, SENT, PROCESSED, WITH_RETURNS                                                           |
| `CreditorIdentifier`       | valor: string                     | Formato ES + 2 dígitos + sufijo (14 chars)                                                                |
| `Frequency`                | enum                              | MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM (orientativo, la configuración real está en billingMonths[]) |
| `PlanType`                 | enum                              | ONE_TIME, RECURRING                                                                                       |
| `SubscriptionCancelReason` | enum                              | PLAN_CHANGE, MEMBER_LEAVE, EXEMPTION, ONE_TIME_COMPLETED                                                  |
| `BillingMonths`            | int[]                             | Array de meses (1-12) en que se generan cargos. Vacío para planes ONE_TIME.                               |
| `SignedURL`                | token: string                     | Hash criptográfico único para enlaces de pago                                                             |
| `LinkStatus`               | enum                              | PENDING, PAID, Expirado                                                                                   |
| `ShiftStatus`              | enum                              | OPEN, Cerrado, Cuadrado                                                                                   |
| `AccountCode`              | code: string                      | Según plan ENL o personalizado (ej: "7.1")                                                                |
| `CategoryType`             | enum                              | INCOME, EXPENSE, ASSET, LIABILITY                                                                         |
| `AccountingYearStatus`     | enum                              | OPEN, Cerrado                                                                                             |
| `AccountingPeriod`         | fechaInicio: Date, fechaFin: Date | Periodo fiscal del ejercicio                                                                              |

### 4.4 Domain Events

| Evento                          | Trigger                         | Payload                                                                 | Consumidores                                                           |
| ------------------------------- | ------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ChargeGenerated`               | Creación de cargo               | chargeId, memberId, amount, description                                 | BC-Communication (aviso)                                               |
| `PaymentRecorded`               | Cobro confirmado                | paymentId, chargeId, memberId, amount, metodo                           | BC-Membership (actualizar estado si procede)                           |
| `PaymentReturned`               | Devolución bancaria             | paymentId, chargeId, motivo                                             | BC-Communication (notificar), BC-Membership (marcar morosidad)         |
| `DelinquencyDetected`           | Cargo vencido sin pago          | memberId, chargeId, diasVencido                                         | BC-Communication (workflow avisos)                                     |
| `FeePlanCreated`                | Creación de plan                | feePlanId, code, name, type, amount                                     | BC-Membership (invalidar caché)                                        |
| `FeePlanModified`               | Modificación plan               | feePlanId, camposModificados                                            | BC-Membership (invalidar caché)                                        |
| `FeePlanLinkedToMemberType`     | Vinculación N:M                 | feePlanId, memberTypeId, isDefault                                      | BC-Membership (invalidar caché)                                        |
| `ChargePaid`                    | Pago de cargo                   | chargeId, memberId, amount, paymentDate, paymentMethod                  | BC-Communication (enviar recibo), BC-Membership (actualizar morosidad) |
| `ChargeCollected`               | Cobro efectivo de cargo         | chargeId, memberId, amount, fechaCobro, remittanceId?                   | BC-Communication (confirmar pago)                                      |
| `ChargeMarkedForRetry`          | Marcado para reintento de cobro | chargeId, memberId, intentoNumero, proximaFecha                         | BC-Communication (avisar socio)                                        |
| `ReceiptGenerated`              | Generación de recibo PDF        | reciboId, paymentId, numeroRecibo, issueDate                            | BC-Communication (enviar por email), BC-Documents (archivar)           |
| `SepaMandateRegistered`         | Registro mandato SEPA           | mandateId, memberId, iban, signatureDate, status                        | BC-Treasury (habilitar domiciliación)                                  |
| `SepaMandateRevoked`            | Revocación mandato SEPA         | mandateId, memberId, motivoRevocacion, fechaRevocacion                  | BC-Treasury (deshabilitar domiciliación), BC-Communication (notificar) |
| `SepaRemittanceGenerated`       | Generación fichero SEPA XML     | remittanceId, chargeDate, totalAdeudos, totalAmount, creditorIdentifier | BC-Communication (avisar socios 2 días antes)                          |
| `PaymentLinkGenerated`          | Generación enlace pago online   | chargeId, memberId, url, expirationDate                                 | BC-Communication (enviar email con enlace)                             |
| `DelinquencyRegularized`        | Regularización de morosidad     | memberId, paidAmount, fechaRegularizacion                               | BC-Membership (restaurar estado), BC-Communication (confirmar)         |
| `OverdraftCertificateGenerated` | Certificado de descubierto      | certificadoId, memberId, deudaTotal, issueDate                          | BC-Documents (archivar), BC-Communication (notificar socio)            |
| `SubscriptionCreated`           | Creación suscripción cuota      | subscriptionId, memberId, feePlanId, fechaInicio, status                | BC-Treasury (programar generación mensual)                             |
| `SubscriptionModified`          | Modificación suscripción        | subscriptionId, camposModificados[], fechaModificacion                  | BC-Treasury (recalcular próximos cargos)                               |
| `SubscriptionClosed`            | Cierre de suscripción           | subscriptionId, motivoCierre, fechaCierre                               | BC-Treasury (detener generación)                                       |
| `MonthlyGenerationCompleted`    | Generación mensual de cuotas    | fiscalYearId, mes, totalCargosGenerados, totalAmount                    | BC-Communication (notificar tesorero), Sistema de auditoría            |
| `DiscrepancyDetected`           | Detección de descuadre          | diferencia, cuentaId, fechaDeteccion                                    | BC-Communication (alertar tesorero)                                    |

### 4.5 Domain Services

| Servicio                  | Responsabilidad                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ChargeGenerator`         | Genera cargos para suscripciones activas cuyo plan incluya el mes actual en billingMonths. Proceso mensual automatizable. |
| `ManualChargeGenerator`   | Crea cargos puntuales sin suscripción asociada (derramas, penalizaciones, ajustes)                                        |
| `ProrataCalculator`       | Calcula cuota proporcional para altas a mitad de ejercicio                                                                |
| `SepaRemittanceGenerator` | Crea fichero XML ISO 20022 pain.008.001.08                                                                                |
| `DelinquencyManager`      | Evalúa y ejecuta workflow de morosidad                                                                                    |
| `PaymentReconciler`       | Asocia pagos de pasarela con cargos pendientes                                                                            |
| `SubscriptionManager`     | Gestiona altas, bajas y cambios de modalidad de pago                                                                      |

### 4.6 Trazabilidad RF

| RF        | Elemento de Dominio                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------- |
| N4RF01    | FeePlan (Aggregate), MemberTypeFeePlan                                                                  |
| N4RF02    | Domain Service: ChargeGenerator (basado en suscripciones activas y billingMonths)                       |
| N4RF03    | Domain Service: ProrataCalculator                                                                       |
| N4RF04-05 | FeeSubscription.discount, exenciones                                                                    |
| N4RF06    | FeeSubscription (selección modalidad al alta)                                                           |
| N4RF07    | FeeSubscription.cancelReason=PLAN_CHANGE                                                                |
| N4RF08    | Domain Service: ManualChargeGenerator, Charge.isManual=true                                             |
| N4RF09-11 | Payment (Entity), PaymentMethod, PaymentStatus                                                          |
| N4RF12-13 | Payment.receiptDocumentId, generación recibo                                                            |
| N4RF14-16 | Domain Service: DelinquencyManager, eventos morosidad                                                   |
| N4RF17-23 | SepaRemittance, SepaDebit, SepaMandate                                                                  |
| N4RF24-27 | Integración pasarela (Application Service), PaymentLink (Aggregate 4.2.10)                              |
| N4RF28-33 | Transaction (Aggregate 4.2.9), AccountingCategory (Aggregate 4.2.12), AccountingYear (Aggregate 4.2.13) |
| N4RF34-38 | Extensión: CashRegisterShift (Aggregate 4.2.11, específico peñas)                                       |

---

## 5. BC-Events: Actividades y Participación

### 5.1 Descripción

Gestiona el ciclo de vida de eventos y actividades: planificación, inscripciones, control de aforo y registro de asistencia.

### 5.2 Aggregates

#### 5.2.1 Aggregate: Event

```
┌─────────────────────────────────────────────────────────────┐
│ EVENT (Aggregate Root)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity: EventId                                           │
│                                                             │
│ Value Objects:                                              │
│   - EventPeriod (fechaInicio, fechaFin)                     │
│   - Location (direccion, coordenadas?, sala?)               │
│   - RegistrationConfig (openDate, closeDate,                │
│                         requierePago, precio?)              │
│                                                             │
│ Entities:                                                   │
│   - Registration[] (participantes inscritos)                │
│                                                             │
│ Properties:                                                 │
│   - tipoEvento: TipoEventoId                                │
│   - nombre: string                                          │
│   - descripcion: string                                     │
│   - aforo: int? (null = ilimitado)                          │
│   - estado: EventStatus                                     │
│   - fiscalYearId: FiscalYearId                               │
│   - organizadorId: UserId                                   │
│                                                             │
│ Computed:                                                   │
│   - plazasDisponibles: int                                  │
│   - inscripcionAbierta: boolean                             │
│                                                             │
│ Invariants:                                                 │
│   - FechaFin >= FechaInicio                                 │
│   - Inscripciones.count <= Aforo (si definido)              │
│   - FechaCierreInscripcion <= FechaInicio                   │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-030 (`events`) [placeholder]

#### 5.2.2 Entity: Registration (dentro de Event)

```
┌─────────────────────────────────────────────────────────────┐
│ REGISTRATION (Entity)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: RegistrationId                                    │
│                                                             │
│ Value Objects:                                              │
│   - DatosInscripcion (campos configurables por evento)      │
│                                                             │
│ Properties:                                                 │
│   - memberId: MemberId? (null si externo)                   │
│   - datosExterno: DatosPersonales? (si no es socio)         │
│   - fechaInscripcion: Date                                  │
│   - estado: RegistrationStatus                              │
│   - cargoId: CargoId? (si requiere pago)                    │
│   - asistencia: Asistencia?                                 │
│                                                             │
│ Invariants:                                                 │
│   - O memberId o datosExterno, no ambos                     │
│   - Si requierePago, cargoId debe existir                   │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Value Object: Asistencia

```
┌─────────────────────────────────────────────────────────────┐
│ ASISTENCIA (Value Object)                                   │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                 │
│   - confirmada: boolean                                     │
│   - horaEntrada: DateTime?                                  │
│   - metodoCheckin: CheckinMethod (QR, Manual)               │
│   - registradoPor: UserId?                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.4 Aggregate: TipoEvento

```
┌─────────────────────────────────────────────────────────────┐
│ TIPO_EVENTO (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: TipoEventoId                                      │
│                                                             │
│ Properties:                                                 │
│   - codigo: string                                          │
│   - nombre: string                                          │
│   - color: string (para calendario)                         │
│   - requiereInscripcion: boolean                            │
│   - camposInscripcion: CampoFormulario[]                    │
│   - activo: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Código único dentro del tenant                          │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.5 Aggregate: SocialDinner

```
┌─────────────────────────────────────────────────────────────┐
│ SOCIAL_DINNER (Aggregate Root)                              │
├─────────────────────────────────────────────────────────────┤
│ Identity: SocialDinnerId                                    │
│                                                             │
│ Value Objects:                                              │
│   - MenuOption (nombre, precio)                             │
│   - RestaurantData (nombre, direccion, telefono)            │
│                                                             │
│ Entities:                                                   │
│   - ReservaComida[] (inscripciones con selección menú)      │
│                                                             │
│ Properties:                                                 │
│   - eventoId: EventId (referencia al evento base)           │
│   - restaurante: RestaurantData                             │
│   - opcionesMenu: MenuOption[] (diferentes menús)           │
│   - fechaLimiteReserva: Date                                │
│   - numeroComensales: int (total confirmado)                │
│   - basePrice: Money                                        │
│   - requisitosAlimentarios: string[] (alergias, vegano...)  │
│                                                             │
│ Invariants:                                                 │
│   - FechaLimiteReserva < fechaInicio del evento             │
│   - Al menos una opción de menú disponible                  │
│   - NumeroComensales = suma de reservas confirmadas         │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `addMenuOption(name, price)` → añade opción al listado
- `makeReservation(member, menuOption)` → registra inscripción con menú
- `updateReservation(reservation, newOption)` → cambia selección
- `confirmDiners()` → cierra reservas y genera factura

#### 5.2.6 Aggregate: Squad

```
┌─────────────────────────────────────────────────────────────┐
│ SQUAD (Aggregate Root)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity: SquadId                                           │
│                                                             │
│ Value Objects:                                              │
│   - IdentifierColor (hex o nombre)                          │
│                                                             │
│ Entities:                                                   │
│   - MiembroCuadrilla[] (socios asignados con rol)           │
│                                                             │
│ Properties:                                                 │
│   - nombre: string (ej: "Tambores", "Trompetas")            │
│   - descripcion: string?                                    │
│   - responsable: MemberId (coordinador)                     │
│   - colorIdentificativo: string                             │
│   - capacidadMaxima: int?                                   │
│   - tipoActividad: string (procesion, desfile, etc.)        │
│   - activa: boolean                                         │
│                                                             │
│ Computed:                                                   │
│   - numeroMiembros: int (total activos)                     │
│                                                             │
│ Invariants:                                                 │
│   - Nombre único dentro del tenant                          │
│   - Responsable debe ser miembro de la cuadrilla            │
│   - NumeroMiembros <= capacidadMaxima (si definida)         │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `createSquad(name, leader)` → inicializa cuadrilla
- `addMember(member, role)` → añade socio validando capacidad
- `removeMember(member, reason)` → da de baja del grupo
- `assignToEvent(event)` → asocia cuadrilla a actividad

#### 5.2.7 Aggregate: Match

```
┌─────────────────────────────────────────────────────────────┐
│ MATCH (Aggregate Root)                                      │
├─────────────────────────────────────────────────────────────┤
│ Identity: MatchId                                           │
│                                                             │
│ Value Objects:                                              │
│   - MatchResult (golesLocal, golesVisitante)                │
│   - OpponentData (nombre, escudo?)                          │
│   - Location (campo, direccion)                             │
│                                                             │
│ Entities:                                                   │
│   - Convocatoria[] (jugadores convocados)                   │
│   - EstadisticaJugador[] (goles, tarjetas, minutos)         │
│                                                             │
│ Properties:                                                 │
│   - eventoId: EventId (referencia al evento base)           │
│   - equipoRival: OpponentData                               │
│   - esLocal: boolean                                        │
│   - campo: Location                                         │
│   - categoria: string (senior, juvenil, infantil...)        │
│   - competicion: string (liga, copa, amistoso)              │
│   - resultado: MatchResult?                                 │
│   - estado: MatchStatus (convocado, jugado, suspendido)     │
│   - observaciones: string?                                  │
│                                                             │
│ Invariants:                                                 │
│   - Resultado solo definido si estado=jugado                │
│   - Jugadores convocados deben ser socios activos           │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `createMatch(opponent, date, venue)` → programa encuentro
- `callPlayers(members[])` → establece lista de convocados
- `recordResult(homeGoals, awayGoals)` → cierra partido
- `recordStat(player, type, value)` → añade dato individual

### 5.3 Value Objects

| Value Object         | Atributos                                                              | Validaciones                                                                              |
| -------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `EventPeriod`        | fechaInicio: DateTime, fechaFin: DateTime                              | FechaFin >= FechaInicio                                                                   |
| `Location`           | direccion: string, coordenadas?: LatLng, sala?: string                 | Dirección no vacía                                                                        |
| `RegistrationConfig` | openDate: Date, closeDate: Date, requierePago: boolean, precio?: Money | FechaCierre <= fechaInicio evento                                                         |
| `EventStatus`        | enum                                                                   | Borrador, Publicado, Inscripciones Abiertas, Inscripciones Cerradas, Realizado, Cancelado |
| `RegistrationStatus` | enum                                                                   | Confirmada, ListaEspera, Cancelada, Asistencia Registrada                                 |
| `CheckinMethod`      | enum                                                                   | QR, Manual, NFC                                                                           |
| `MenuOption`         | nombre: string, precio: Money                                          | Nombre no vacío                                                                           |
| `RestaurantData`     | nombre: string, direccion: string, telefono: string                    | Todos obligatorios                                                                        |
| `IdentifierColor`    | valor: string                                                          | Color hex o nombre CSS válido                                                             |
| `MatchResult`        | golesLocal: int, golesVisitante: int                                   | >= 0 ambos                                                                                |
| `OpponentData`       | nombre: string, escudo?: URL                                           | Nombre obligatorio                                                                        |
| `MatchStatus`        | enum                                                                   | Convocado, Jugado, Suspendido, Aplazado                                                   |

### 5.4 Domain Events

| Evento                   | Trigger                            | Payload                                      | Consumidores                                                           |
| ------------------------ | ---------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `EventCreated`           | Creación evento                    | eventId, tipo, fecha                         | BC-Communication (publicar)                                            |
| `EventPublished`         | Apertura inscripciones             | eventId                                      | BC-Communication (notificar socios)                                    |
| `EventCancelled`         | Cancelación                        | eventId, motivo                              | BC-Communication (notificar inscritos), BC-Treasury (reembolsos)       |
| `RegistrationCompleted`  | Nueva inscripción                  | registrationId, eventId, memberId            | BC-Treasury (generar cargo si precio), BC-Communication (confirmación) |
| `RegistrationCancelled`  | Cancelación inscripción            | registrationId, eventId                      | BC-Treasury (anular cargo)                                             |
| `CapacityReached`        | Aforo lleno                        | eventId                                      | BC-Communication (activar lista espera)                                |
| `SlotReleased`           | Baja de inscrito                   | eventId, posicionListaEspera                 | BC-Communication (notificar siguiente)                                 |
| `EventFeedbackRequested` | Solicitud valoraciones post-evento | eventId, registeredMembers[], fechaSolicitud | BC-Communication (enviar formulario)                                   |
| `RecurringIssueDetected` | Detección patrón de problemas      | eventId, tipoProblema, frecuencia            | BC-Communication (alertar organizadores)                               |

### 5.5 Trazabilidad RF

| RF        | Elemento de Dominio                                                                      |
| --------- | ---------------------------------------------------------------------------------------- |
| N5RF01-02 | Event (Aggregate), TipoEvento                                                            |
| N5RF03-04 | Event con calendario, exportación iCal                                                   |
| N5RF05-09 | Registration (Entity), control aforo, lista espera                                       |
| N5RF10-11 | RegistrationConfig, DatosInscripcion                                                     |
| N5RF12-16 | Asistencia (VO), check-in QR/manual                                                      |
| N5RF17-19 | Extensión: SocialDinner (específico peñas), Aggregate 5.2.5                              |
| N5RF20-26 | Extensión: Procesion, Costaleros (específico cofradías)                                  |
| N5RF27-30 | Extensión: Competicion (específico clubes), Aggregate 5.2.7 Match, Aggregate 5.2.6 Squad |

---

## 6. BC-Communication: Notificaciones y Mensajería

### 6.1 Descripción

Gestiona el envío de comunicaciones a socios: emails, notificaciones push, SMS y el tablón de anuncios interno. Procesa eventos de otros BCs para generar notificaciones automáticas.

### 6.2 Aggregates

#### 6.2.1 Aggregate: Communication

```
┌─────────────────────────────────────────────────────────────┐
│ COMMUNICATION (Aggregate Root)                              │
├─────────────────────────────────────────────────────────────┤
│ Identity: CommunicationId                                   │
│                                                             │
│ Value Objects:                                              │
│   - Contenido (asunto, cuerpo, formato)                     │
│   - SegmentoDestinatarios (criterios de filtrado)           │
│                                                             │
│ Entities:                                                   │
│   - Envio[] (cada envío individual a un destinatario)       │
│                                                             │
│ Properties:                                                 │
│   - canal: CanalComunicacion                                │
│   - tipo: TipoComunicacion (manual, automatica)             │
│   - plantillaId: TemplateId?                                │
│   - fechaProgramada: DateTime?                              │
│   - estado: EstadoComunicacion                              │
│   - creadoPor: UserId                                       │
│                                                             │
│ Invariants:                                                 │
│   - Al menos un destinatario                                │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-035 (`communications`) [placeholder]

#### 6.2.2 Entity: Envio

```
┌─────────────────────────────────────────────────────────────┐
│ ENVIO (Entity)                                              │
├─────────────────────────────────────────────────────────────┤
│ Identity: EnvioId                                           │
│                                                             │
│ Properties:                                                 │
│   - memberId: MemberId                                      │
│   - destino: string (email, teléfono según canal)           │
│   - estado: EstadoEnvio                                     │
│   - fechaEnvio: DateTime?                                   │
│   - fechaApertura: DateTime? (tracking email)               │
│   - errorMensaje: string?                                   │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.3 Aggregate: Template

```
┌─────────────────────────────────────────────────────────────┐
│ TEMPLATE (Aggregate Root)                                   │
├─────────────────────────────────────────────────────────────┤
│ Identity: TemplateId                                        │
│                                                             │
│ Properties:                                                 │
│   - codigo: string                                          │
│   - nombre: string                                          │
│   - canal: CanalComunicacion                                │
│   - asunto: string (con placeholders)                       │
│   - cuerpo: string (con placeholders)                       │
│   - variablesDisponibles: string[]                          │
│   - esSistema: boolean (no editable si true)                │
│   - activa: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Código único dentro del tenant                          │
│   - Plantillas sistema no modificables                      │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-036 (`templates`) [placeholder]

#### 6.2.4 Aggregate: Anuncio

```
┌─────────────────────────────────────────────────────────────┐
│ ANUNCIO (Aggregate Root)                                    │
├─────────────────────────────────────────────────────────────┤
│ Identity: AnuncioId                                         │
│                                                             │
│ Properties:                                                 │
│   - titulo: string                                          │
│   - contenido: string                                       │
│   - fechaPublicacion: Date                                  │
│   - fechaExpiracion: Date?                                  │
│   - destacado: boolean                                      │
│   - publicadoPor: UserId                                    │
│   - estado: EstadoAnuncio                                   │
│                                                             │
│ Invariants:                                                 │
│   - FechaExpiracion > FechaPublicacion (si definida)        │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-037 (`announcements`) [placeholder]

### 6.3 Domain Events

BC-Communication emite eventos relacionados con el ciclo de vida de las comunicaciones:
| Evento | Trigger | Payload | Consumidores |
|--------|---------|---------|--------------|
| `CommunicationSent` | Envío completado | communicationId, totalDestinatarios, canal, fechaEnvio | - |
| `EmailBounced` | Email rebota (bounce) | envioId, memberId, email, tipoBounce (hard/soft), motivo | BC-Membership (marcar email inválido si hard bounce) |
| `WelcomeNotificationSent` | Email bienvenida enviado a nuevo socio | memberId, email, fechaEnvio, templateId | - |
| `PaymentReminderSent` | Recordatorio de pago enviado | memberId, email, cargoId, importe, fechaLimite | - |
| `DelinquencyNoticeSent` | Aviso de morosidad enviado | memberId, email, deudaTotal, fechaEnvio | - |
| `DirectDebitNoticeSent` | Aviso pre-remesa enviado | memberId, email, remesaId, importe, fechaCargo | - |
| `RegistrationConfirmationSent` | Confirmación de inscripción a evento | memberId, email, eventId, registrationId | - |

**Notas:**

- `CommunicationSent`: Marca la finalización del proceso de envío masivo
- `EmailAbierto` y `EnlaceClicado`: Eventos de tracking para métricas internas (no requieren consumidores externos)
- `EmailBounced`: Permite a BC-Membership actualizar la validez de emails de socios según tipo de bounce (hard/soft)

Este BC **también es consumidor** de eventos de otros BCs:

| Evento Origen           | Acción en BC-Communication            |
| ----------------------- | ------------------------------------- |
| `MemberRegistered`      | Enviar email bienvenida               |
| `ChargeGenerated`       | Enviar aviso de cuota próxima         |
| `DelinquencyDetected`   | Iniciar workflow de avisos            |
| `EventPublished`        | Notificar a socios según preferencias |
| `RegistrationCompleted` | Enviar confirmación                   |

### 6.4 Trazabilidad RF

| RF        | Elemento de Dominio                             |
| --------- | ----------------------------------------------- |
| N6RF01-04 | Communication (Aggregate), canales              |
| N6RF05-07 | SegmentoDestinatarios, Template                 |
| N6RF08-09 | Envio (Entity), tracking                        |
| N6RF10-16 | Plantillas sistema (notificaciones automáticas) |
| N6RF17-23 | Extensión: Acta (específico - ver BC-Documents) |

---

## 7. BC-Documents: Gestión Documental

### 7.1 Descripción

Repositorio centralizado de documentos de la entidad: estatutos, actas, facturas, justificantes. Incluye gestión del libro de actas obligatorio.

### 7.2 Aggregates

#### 7.2.1 Aggregate: Document

```
┌─────────────────────────────────────────────────────────────┐
│ DOCUMENT (Aggregate Root)                                   │
├─────────────────────────────────────────────────────────────┤
│ Identity: DocumentId                                        │
│                                                             │
│ Value Objects:                                              │
│   - MetadatosDocumento (nombre, descripcion, etiquetas)     │
│   - ArchivoFisico (path, tamaño, mimeType, hash)            │
│                                                             │
│ Properties:                                                 │
│   - categoriaId: CategoriaId                                │
│   - fechaDocumento: Date                                    │
│   - fechaSubida: DateTime                                   │
│   - subidoPor: UserId                                       │
│   - version: int                                            │
│   - documentoAnterior: DocumentId? (para versionado)        │
│   - estado: EstadoDocumento                                 │
│                                                             │
│ Invariants:                                                 │
│   - Tamaño <= límite del tenant                             │
│   - MimeType en lista permitida                             │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-038 (`documents`) [placeholder]

#### 7.2.2 Aggregate: Categoria

```
┌─────────────────────────────────────────────────────────────┐
│ CATEGORIA (Aggregate Root)                                  │
├─────────────────────────────────────────────────────────────┤
│ Identity: CategoriaId                                       │
│                                                             │
│ Properties:                                                 │
│   - nombre: string                                          │
│   - descripcion: string                                     │
│   - categoriaPadre: CategoriaId? (jerarquía)                │
│   - orden: int                                              │
│   - rolesAcceso: RolId[] (quién puede ver)                  │
│   - esSistema: boolean                                      │
│                                                             │
│ Invariants:                                                 │
│   - No ciclos en jerarquía                                  │
│   - Categorías sistema no eliminables                       │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-039 (`document_categories`) [placeholder]

#### 7.2.3 Aggregate: Acta

```
┌─────────────────────────────────────────────────────────────┐
│ ACTA (Aggregate Root)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: ActaId                                            │
│                                                             │
│ Value Objects:                                              │
│   - NumeroActa (correlativo automático)                     │
│                                                             │
│ Entities:                                                   │
│   - Asistente[] (memberId, firma?)                          │
│   - Acuerdo[] (descripcion, votacion?)                      │
│                                                             │
│ Properties:                                                 │
│   - tipoReunion: TipoReunion                                │
│   - fecha: Date                                             │
│   - lugar: string                                           │
│   - horaInicio: Time                                        │
│   - horaFin: Time                                           │
│   - ordenDelDia: string[]                                   │
│   - estado: EstadoActa                                      │
│   - documentoId: DocumentId? (PDF generado)                 │
│   - firmadaPor: UserId? (secretario)                        │
│   - vistobuenoPor: UserId? (presidente)                     │
│                                                             │
│ Invariants:                                                 │
│   - Número correlativo único                                │
│   - Quórum mínimo según tipo reunión                        │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-040 (`meeting_minutes`) [placeholder]

### 7.3 Domain Events

BC-Documents emite eventos relacionados con la generación y gestión de documentos:
| Evento | Trigger | Payload | Consumidores |
|--------|---------|---------|--------------|
| `AssemblyReportGenerated` | Informe de Asamblea General generado | informeId, fiscalYearId, tipoInforme, fechaGeneracion, generadoPor | BC-Documents (almacenar en repositorio) |

**Notas:**

- `AssemblyReportGenerated`: Genera informe de Asamblea General con datos económicos y de membresía del ejercicio

### 7.4 Trazabilidad RF

| RF        | Elemento de Dominio                              |
| --------- | ------------------------------------------------ |
| N7RF01-03 | Document (Aggregate), MetadatosDocumento         |
| N7RF04-05 | ArchivoFisico, previsualización                  |
| N7RF06-07 | Búsqueda por metadatos, Categoria.rolesAcceso    |
| N7RF08    | Límite almacenamiento (configuración tenant)     |
| N7RF09-12 | Versionado, OCR, búsqueda full-text (avanzado)   |
| N6RF17-23 | Acta (Aggregate) - movido desde BC-Communication |

---

## 7 bis. Extensión Transversal: Cumplimiento Normativo

**Nota:** Los requisitos N11 (Cumplimiento Normativo) se implementan como Application Services transversales que operan sobre los BCs existentes. Sin embargo, se documenta aquí un Aggregate específico para gestión de alertas legales que podría implementarse como extensión futura.

### 7 bis.1 Aggregate: AlertaLegal

```
┌─────────────────────────────────────────────────────────────┐
│ ALERT_LEGAL (Aggregate Root)                                │
├─────────────────────────────────────────────────────────────┤
│ Identity: AlertId                                           │
│                                                             │
│ Value Objects:                                              │
│   - TipoNormativa (enum: RGPD, Ley_Asociaciones, Laboral)  │
│   - NivelCriticidad (enum: info, advertencia, critica)      │
│   - PlazoLimite (fechaLimite, diasAviso)                    │
│                                                             │
│ Properties:                                                 │
│   - titulo: string                                          │
│   - descripcion: string                                     │
│   - normativaAfectada: TipoNormativa                        │
│   - nivelCriticidad: NivelCriticidad                        │
│   - fechaDeteccion: Date                                    │
│   - fechaLimite: Date? (plazo legal si aplica)              │
│   - estado: EstadoAlerta (pendiente, en_revision, resuelta) │
│   - accionRequerida: string                                 │
│   - responsable: UserId? (asignado para resolución)         │
│   - fechaResolucion: Date?                                  │
│   - observaciones: string?                                  │
│                                                             │
│ Invariants:                                                 │
│   - FechaLimite > FechaDeteccion (si definida)              │
│   - Estado resuelto requiere fechaResolucion definida       │
│   - Alertas críticas requieren responsable asignado         │
└─────────────────────────────────────────────────────────────┘
```

**Comportamientos:**

- `generateAlert(tipo, descripcion, criticidad)` → crea alerta
- `assignResponsible(usuario)` → delega resolución
- `markAsResolved(observaciones)` → cierra alerta
- `escalate()` → aumenta criticidad si plazo vencido

**Trazabilidad RF:**
| RF | Elemento de Dominio |
|----|---------------------|
| N11RF01-17 | AlertaLegal (Aggregate) - Extensión futura |

**Ubicación propuesta:** BC-Identity (como parte de auditoría) o módulo transversal dedicado.

---

## 8. BC-Identity: Acceso y Autorización

### 8.1 Descripción

Gestiona la autenticación de usuarios, autorización basada en roles y la estructura multi-tenant. Es un BC genérico/de soporte que todos los demás BCs utilizan.

### 8.2 Aggregates

#### 8.2.1 Aggregate: User

```
┌─────────────────────────────────────────────────────────────┐
│ USER (Aggregate Root)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: UserId                                            │
│                                                             │
│ Value Objects:                                              │
│   - Credenciales (email, passwordHash)                      │
│   - TokenRecuperacion (valor, expiracion)                   │
│                                                             │
│ Properties:                                                 │
│   - nombre: string                                          │
│   - estado: EstadoUsuario                                   │
│   - fechaCreacion: DateTime                                 │
│   - ultimoAcceso: DateTime?                                 │
│   - intentosFallidos: int                                   │
│   - bloqueadoHasta: DateTime?                               │
│                                                             │
│ Invariants:                                                 │
│   - Email único global (cross-tenant)                       │
│   - Password cumple política complejidad                    │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-002 (`users`), ENT-005 (`refresh_tokens`)

#### 8.2.2 Aggregate: Tenant

```
┌─────────────────────────────────────────────────────────────┐
│ TENANT (Aggregate Root)                                     │
├─────────────────────────────────────────────────────────────┤
│ Identity: TenantId                                          │
│                                                             │
│ Value Objects:                                              │
│   - ConfiguracionTenant (limites, features habilitadas)     │
│   - DatosEntidad (nombre, CIF, direccion, tipo)             │
│                                                             │
│ Properties:                                                 │
│   - slug: string (identificador URL-friendly)               │
│   - plan: PlanSuscripcion                                   │
│   - estado: EstadoTenant                                    │
│   - registrationDate: Date                                         │
│   - baseDatosId: string (conexión específica - RNF-004)     │
│                                                             │
│ Invariants:                                                 │
│   - Slug único global                                       │
│   - CIF válido y único                                      │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-001 (`tenants`)

#### 8.2.3 Aggregate: TenantMembership (User-Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│ TENANT_MEMBERSHIP (Aggregate Root)                          │
├─────────────────────────────────────────────────────────────┤
│ Identity: MembresiaId                                       │
│                                                             │
│ Properties:                                                 │
│   - usuarioId: UserId                                       │
│   - tenantId: TenantId                                      │
│   - rolId: RolId                                            │
│   - memberId: MemberId? (vínculo con ficha de socio)        │
│   - fechaAsignacion: Date                                   │
│   - asignadoPor: UserId                                     │
│   - activo: boolean                                         │
│                                                             │
│ Invariants:                                                 │
│   - Un usuario puede tener múltiples membresías (tenants)   │
│   - Solo una membresía activa por usuario-tenant            │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-003 (`tenant_memberships`)

#### 8.2.4 Aggregate: Rol

```
┌─────────────────────────────────────────────────────────────┐
│ ROLE (Aggregate Root)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: RolId                                             │
│                                                             │
│ Properties:                                                 │
│   - codigo: string                                          │
│   - nombre: string                                          │
│   - descripcion: string                                     │
│   - permisos: Permiso[]                                     │
│   - esSistema: boolean (roles predefinidos)                 │
│   - tenantId: TenantId? (null = global)                     │
│                                                             │
│ Invariants:                                                 │
│   - Roles sistema no modificables                           │
│   - Código único dentro del tenant (o global)               │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-004 (`roles`)

### 8.3 Roles Predefinidos (Sistema)

| Código         | Nombre                   | Permisos Principales           |
| -------------- | ------------------------ | ------------------------------ |
| `PRESIDENT`    | Presidente/Hermano Mayor | Todo + aprobaciones críticas   |
| `SECRETARY`    | Secretario               | Socios, actas, documentación   |
| `TREASURER`    | Tesorero                 | Economía, cuotas, remesas      |
| `BOARD_MEMBER` | Vocal                    | Según área asignada            |
| `MEMBER`       | Socio                    | Solo lectura propia vía portal |

### 8.4 Domain Events

| Evento                 | Trigger                      | Payload                                                                      |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `UserCreated`          | Registro                     | userId, email                                                                |
| `UserAuthenticated`    | Login exitoso                | userId, tenantId, email, rol, ipAddress, userAgent, timestamp                |
| `AuthenticationFailed` | Login fallido                | email, intentos, ip                                                          |
| `TenantProvisioned`    | Provisión completa de tenant | tenantId, nombreColectividad, tipoColectividad, adminUserId, adminEmail, cif |

### 8.5 Trazabilidad RF

| RF     | Elemento de Dominio                             |
| ------ | ----------------------------------------------- |
| N2RF01 | Tenant (Aggregate), aislamiento por BD          |
| N2RF02 | User con múltiples TenantMembership             |
| N2RF03 | ConfiguracionTenant                             |
| N2RF04 | Rol predefinidos (sistema)                      |
| N2RF05 | Rol personalizados (tenantId != null)           |
| N2RF06 | Domain Events de auditoría                      |
| N2RF07 | RolAsignado event, histórico                    |
| N2RF08 | Validación edad en TenantMembership para cargos |

---

## 8.5 Domain Events Transversales

Eventos emitidos por Application Services que operan sobre múltiples BCs (requisitos N8-N11):

| Evento                         | Trigger                                | Payload                                                            | Consumidores                           |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `DashboardVisualized`          | Usuario visualiza dashboard            | userId, tenantId, timestamp, seccionesVistas                       | - (analytics interno)                  |
| `ExportRequested`              | Usuario solicita exportación de datos  | exportacionId, userId, tipoEntidad, formato, filtros               | Application Service Export             |
| `ExportFailed`                 | Exportación falla por error            | exportacionId, tipoError, mensaje, timestamp                       | BC-Communication (notificar usuario)   |
| `CommunicationHistoryExported` | Histórico de comunicaciones exportado  | exportacionId, fechaInicio, fechaFin, formato, totalRegistros      | -                                      |
| `EconomicReportGenerated`      | Informe económico generado             | informeId, tipo, fiscalYearId, fechaGeneracion, generadoPor        | BC-Documents (almacenar)               |
| `Modelo182Generated`           | Modelo 182 (AEAT) generado             | modeloId, fiscalYearId, totalSocios, totalImporte, fechaGeneracion | BC-Documents (almacenar)               |
| `PlanUpgraded`                 | Plan de suscripción ampliado           | tenantId, planAnterior, planNuevo, limites, fechaCambio            | BC-Identity (actualizar tenant config) |
| `CashRegisterOpened`           | Turno de caja abierto (peñas festeras) | turnoId, userId, fechaApertura, saldoInicial                       | BC-Treasury (registrar apertura)       |
| `CashRegisterClosed`           | Turno de caja cerrado                  | turnoId, userId, fechaCierre, saldoFinal, diferencia               | BC-Treasury (conciliar caja)           |

**Notas:**

- Estos eventos son emitidos por Application Services que implementan requisitos transversales (N8: Import/Export, N9: Reporting, N10: Portal Socio, N11: Cumplimiento)
- No pertenecen a un BC específico pero pueden ser consumidos por múltiples BCs
- `CashRegisterOpened` y `CashRegisterClosed` son features específicas de peñas festeras (N12RF06-10) pero se documentan aquí por su naturaleza transversal

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

## Changelog

- v1.5 (Feb 2026): Clasificación de eventos internos vs eventos de negocio
  - **Nueva sección 9.5:** Event Nomenclature - Business vs Internal Events
    - Definición formal de eventos de negocio (cross-BC integration)
    - Definición formal de eventos internos (Aggregate lifecycle)
    - Tabla de mapeo: eventos internos → eventos de negocio
    - Guías de implementación para UCs y Event-Driven Architecture
  - **Marcados 6 eventos internos** en tablas de Domain Events:
    - **BC-Identity (1):** `TenantCreado` [Interno] → evento negocio: `TenantProvisioned`
    - **BC-Treasury (5):**
      - `MemberSuspendedForNonpayment` [Interno] → evento negocio: `MemberStatusChanged`
      - `SepaRemittanceGenerated` [Interno] → evento negocio: `SepaRemittanceGenerated`
      - `SepaRemittanceSent` [Interno] → evento negocio: `SepaRemittanceSent`
      - `SepaMandateRegistered` [Interno] → evento negocio: `SepaMandateRegistered`
      - `SepaMandateExpired` [Interno] → evento negocio: implícito en UC-023 FA-3
  - **Propósito:** Clarificar qué eventos deben documentarse en tablas de UCs (solo eventos de negocio)
  - **Total eventos:** 87 (81 eventos de negocio + 6 eventos internos)
  - **Script actualizado:** `inventario_eventos.py` v2.1 detecta marcador `[Interno]`

- v1.4 (Feb 2026): Corrección de nomenclatura de eventos para alineación con UCs
  - **BC-Membership:** Corregidos 2 nombres de eventos para consistencia con UC-012 y UC-015
    - `MemberCardIssued` → `MemberCardGenerated` (alineado con UC-015, línea 2805)
    - `RegistrationRequestCreated` → `RegistrationRequestStarted` (alineado con UC-012, línea 2121)
  - Justificación: Nomenclatura de UCs es más descriptiva del proceso
  - `MemberCardGenerated` refleja mejor el proceso técnico (generación de QR/PDF)
  - `RegistrationRequestStarted` describe mejor el workflow de cofradías (inicio de proceso de 7 fases)
  - Total eventos: 85 (sin cambios en cantidad, solo nomenclatura)

- v1.3 (Feb 2026): Limpieza de eventos duplicados
  - **Eliminados 8 eventos duplicados** (manteniendo cobertura 100%)
  - **BC-Treasury:** Consolidadas tablas de eventos (eliminados 7 duplicados)
    - Se mantuvo tabla original, eliminada segunda tabla redundante con eventos repetidos
    - Duplicados eliminados: `ChargeGenerated`, `PaymentRecorded`, `PaymentReturned`, `DelinquencyDetected`, `FeePlanCreated`, `FeePlanModified`, `FeePlanLinkedToMemberType`
  - **BC-Events:** Eliminado `RegistrationCompleted` duplicado (mantenida definición completa)
  - **BC-Communication:** Conservada tabla "Eventos Consumidos" (NO es duplicación)
    - Tabla documenta acciones al CONSUMIR eventos de otros BCs (diferente propósito)
  - Total Domain Events únicos: **85 eventos** (antes 93 con duplicados)
  - Scripts de análisis: `detectar_duplicados_kb005.py`, `eliminar_duplicados_kb005.py`
  - Verificado: **Cobertura 100%** mantenida (60/60 eventos de UCs documentados)

- v1.2 (Feb 2026): Sincronización completa de Domain Events con Casos de Uso
  - **Añadidos 46 eventos faltantes** (100% cobertura respecto a UC v2.5)
  - **BC-Membership:** 3 eventos añadidos
    - `RegistrationRequestApproved`, `MemberCardGenerated`, `MemberAssignedToSquad`
  - **BC-Treasury:** 25 eventos añadidos
    - Incluyendo `OnlinePaymentCompleted`, `PaymentLinkGenerated`, `CashRegisterOpened`, `DebtSettled`, etc.
  - **BC-Events:** 4 eventos añadidos
    - `RegistrationCompleted`, `RegistrationCancelled`, `CapacityReached`, `AttendanceRecorded`
  - **BC-Identity:** 8 eventos añadidos/actualizados
    - Incluye eventos de autenticación, roles y permisos
  - **BC-Communication:** 6 eventos añadidos
    - `WelcomeNotificationSent`, `PaymentReminderSent`, `DelinquencyNoticeSent`, etc.
  - **BC-Documents:** Nueva sección 7.3 Domain Events
    - `AssemblyReportGenerated`
  - **Nueva sección 8.5:** Domain Events Transversales (9 eventos)
    - Eventos de Application Services cross-BC: exports, reporting, analytics, caja
  - Total Domain Events documentados: 146 (de 100 a 146)
  - Verificado con `inventario_eventos.py`: **Cobertura 100%**

- v1.1 (Feb 2026): Actualización con Aggregates críticos
  - **BC-Membership:** Añadidos 2 Aggregates
    - ListaEspera (3.2.6): Gestión de cola de aspirantes
    - ExpedienteDisciplinario (3.2.7): Registro de infracciones y sanciones
  - **BC-Treasury:** Añadidos 4 Aggregates
    - PaymentLink (4.2.10): Enlaces temporales para pagos online
    - TurnoCaja (4.2.11): Gestión de turnos de caja (específico peñas)
    - CategoriaContable (4.2.12): Clasificación de movimientos contables
    - EjercicioContable (4.2.13): Periodos fiscales y cierre contable
  - **BC-Events:** Añadidos 3 Aggregates
    - SocialDinner (5.2.5): Gestión de comidas y menús (específico peñas)
    - Squad (5.2.6): Agrupaciones de socios para actividades
    - Match (5.2.7): Encuentros deportivos (específico clubes)
  - **Extensión Transversal:** Añadida sección 7 bis
    - AlertaLegal: Gestión de alertas de cumplimiento normativo (extensión futura)
  - Actualizadas tablas de Value Objects en BC-Membership, BC-Treasury y BC-Events
  - Actualizadas referencias de trazabilidad RF para los nuevos Aggregates
  - Total Aggregates documentados: 29 (de 19 iniciales a 29)

- v1.0 (Feb 2026): Versión inicial
  - 6 Bounded Contexts identificados (3 Core + 3 Supporting)
  - Aggregates, Entities, Value Objects para cada BC
  - Domain Events con productores y consumidores
  - Context Map con relaciones
  - Consideraciones multi-tenant según RNF-004
  - Glosario del dominio (Ubiquitous Language)
