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

**Comportamientos:**
- `openCase(member, infraction)` → crea con estado abierto
- `addInfraction(detail)` → registra nueva infracción al expediente
- `applySanction(type, days?)` → asigna sanción y cierra expediente
- `archive(reason)` → cierra sin sanción (sobreseimiento)

### 3.3 Value Objects

| Value Object | Atributos | Validaciones |
|--------------|-----------|--------------|
| `MemberId` | uuid | UUID v4 válido |
| `MemberNumber` | valor: string | Formato configurable por tenant |
| `PersonalData` | name, surnames, birthDate | Nombre no vacío, fecha pasada |
| `ContactData` | email, phone, address | Email válido, teléfono formato ES |
| `IdentityDocument` | tipo (DNI/NIE/Pasaporte), numero | Algoritmo validación según tipo |
| `BankDetails` | iban | IBAN válido (algoritmo mod 97) |
| `MemberStatus` | enum | ACTIVE, PENDING_PAYMENT, SUSPENDED, VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE, APPLICANT, DECEASED |
| `AgeRange` | minima, maxima | min >= 0, max > min (si definidos) |
| `QRCode` | valor: string | Hash único, no predecible |
| `WaitingPosition` | numero: int | Orden cronológico en lista espera |
| `RegistrationDate` | fecha: DateTime | Timestamp de entrada en lista |
| `ListExitReason` | enum | APPROVED, REJECTED, EXPIRED, VOLUNTARY |
| `WaitingListStatus` | enum | ACTIVE, Procesado |
| `InfractionType` | enum | MINOR, SERIOUS, VERY_SERIOUS |
| `SanctionType` | enum | WARNING, SUSPENSION, EXPULSION |
| `CaseStatus` | enum | OPEN, UNDER_REVIEW, CLOSED |

### 3.4 Domain Events

| Evento | Trigger | Payload | Consumidores |
|--------|---------|---------|--------------|
| `MemberRegistered` | Alta completada | memberId, memberType, fecha | BC-Treasury (generar cuota), BC-Communication (bienvenida) |
| `MemberDeactivated` | Baja cualquier tipo | memberId, tipoBaja, motivo, fecha | BC-Treasury (anular pendientes), BC-Communication (notificar) |
| `MemberStatusChanged` | Cambio de estado | memberId, estadoAnterior, estadoNuevo, motivo | BC-Treasury (suspender/reactivar cobros) |
| `MemberTypeChanged` | Cambio de categoría | memberId, tipoAnterior, tipoNuevo | BC-Treasury (ajustar cuota) |
| `MemberDataUpdated` | Modificación datos | memberId, camposModificados | BC-Treasury (si IBAN), BC-Communication (si email) |
| `MemberCardValidated` | Escaneo QR exitoso | memberCardId, memberId, timestamp, ubicacion? | BC-Events (check-in automático) |
| `FiscalYearOpened` | Apertura ejercicio | fiscalYearId, periodo | BC-Treasury (generar cuotas), BC-Membership (arrastrar socios) |
| `FiscalYearClosed` | Cierre ejercicio | fiscalYearId, estadisticas | BC-Documents (generar memoria) |
| `RegistrationRequestStarted` | Nueva solicitud | requestId, datos | BC-Communication (notificar junta) |
| `RegistrationRequestApproved` | Aprobación | requestId, memberId | BC-Communication (notificar aspirante) |
| `MemberTypeCreated` | Creación de tipo de socio | memberTypeId, name, description, tenantId | BC-Treasury (vincular planes de cuota) |
| `NonpaymentLeave` | Baja automática por morosidad | memberId, deudaTotal, leaveDate | BC-Communication (notificar), BC-Treasury (cerrar cuenta) |

### 3.5 Trazabilidad RF

| RF | Elemento de Dominio |
|----|---------------------|
| N3RF01 | Member (PersonalData, ContactData, BankDetails) |
| N3RF02-05 | Member.CamposPersonalizados (extensión por tipo colectividad) |
| N3RF06 | MemberStatus (Value Object enum) |
| N3RF07-10 | MemberType (Aggregate) |
| N3RF11 | MemberType.configuracion (reglas) |
| N3RF12-13 | Member.HistorialEstados, calculateSeniority() |
| N3RF14 | Domain Service: MemberStatistics |
| N3RF15-19 | FiscalYear (Aggregate) |
| N3RF20-23 | RegistrationRequest (Aggregate 3.2.3), workflow estados, WaitingList (Aggregate 3.2.6) |
| N3RF24-27 | Member.deactivate(), eventos de baja, DisciplinaryCase (Aggregate 3.2.7) |
| N3RF28-29 | RegistrationRequest con prioridad (lista espera), WaitingList (Aggregate 3.2.6) |
| N3RF30-32 | MemberCard (Aggregate) |
| N3RF33-34 | MemberCard específico cofradías (PapeletaSitio - extensión) |
