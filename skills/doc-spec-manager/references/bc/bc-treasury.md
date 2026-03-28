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
