# Task 4 — UC-023: Generación de remesas SEPA (Backend)

## Información general

- **Fase:** 2
- **Tipo:** Backend
- **UC:** UC-023
- **Bounded Context:** BC-Treasury
- **Application Service:** `SepaRemittanceService`
- **Aggregates:** `SepaRemittance`, `MemberAccount` (Entity: `SepaMandate`, `Charge`)
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `SepaRemittance` con entities `SepaDebit`
- Entity `SepaMandate` dentro de `MemberAccount` para mandatos de domiciliación
- Application Service `SepaRemittanceService` con operaciones: configuración de acreedor, registro de mandatos, generación de remesa, marcado como enviada
- Configuración del Identificador de Acreedor SEPA (formato español ES + CIF) con validación de dígito de control (Tabla 7)
- Registro y gestión de mandatos SEPA: alta, revocación, caducidad automática por 36 meses sin uso
- Generación de fichero XML ISO 20022 pain.008.001.08 (SEPA Core Direct Debit)
- Algoritmo de determinación de tipo de secuencia FRST/RCUR/OOFF (Tabla 8)
- Validación de plazos de presentación: mínimo 3 días hábiles antes de fecha de cobro
- Cálculo de días hábiles con soporte de festivos nacionales españoles
- Endpoint REST para CRUD de mandatos: `GET/POST/PUT /api/v1/tenants/:tenantId/members/:memberId/mandate`
- Endpoint REST para configuración SEPA: `GET/PUT /api/v1/tenants/:tenantId/sepa/config`
- Endpoint REST para generación de remesa: `POST /api/v1/tenants/:tenantId/remittances`
- Endpoint REST para descarga de fichero XML: `GET /api/v1/tenants/:tenantId/remittances/:id/xml`
- Endpoint REST para marcar como enviada: `PUT /api/v1/tenants/:tenantId/remittances/:id/sent`
- Almacenamiento cifrado del fichero XML en S3 con retención de 5 años
- Domain Events: `SepaMandateRegistered`, `SepaRemittanceGenerated`, `SepaRemittanceSent`
- Actualización de `lastDebitDate` en mandatos tras procesamiento exitoso
- Transición de cargos a estado EN_PROCESO_COBRO al incluirlos en remesa
- Tests unitarios (dominio, incluyendo generación XML) + tests de integración

### Excluido

- Frontend del asistente de remesas (se implementa como task-7-UC-023 en frontend de Fase 2)
- Procesamiento automático de ficheros pain.002 de respuesta bancaria (se implementa en UC-024)
- Calendario de festivos por comunidad autónoma (MVP usa solo festivos nacionales)
- Cálculo automático de BIC desde IBAN (en MVP se omite el BIC, es opcional en SEPA Core)
- Validación del XML con herramientas externas (se genera con librería validada)
- Mandatos firmados digitalmente (en MVP se adjunta PDF escaneado)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel, MinIO/S3 |
| **Fase 1 — UC-001 (Provisión de tenant)** | Tenant provisionado con BD aislada |
| **Fase 1 — UC-011 (Alta simple de socio)** | Socios registrados con `MemberAccount` |
| **Fase 1 — UC-019 (Cargos periódicos)** | Cargos generados en estado PENDING |
| **Fase 1 — UC-021 (Registro de cobros)** | Aggregate `MemberAccount` con entity `Payment` |
| **Fase 2 — UC-020 (Cargos manuales)** | Cargos manuales en estado PENDING (opcional, aporta más cargos cobrables) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/treasury/domain/aggregates/member-account.ts` existe con entities `Charge`, `Payment`
- [ ] `api/src/treasury/domain/value-objects/money.ts` existe y opera en centavos
- [ ] `api/src/treasury/domain/value-objects/charge-status.ts` incluye estado `IN_COLLECTION_PROCESS`
- [ ] MinIO/S3 está configurado para almacenamiento de ficheros con retención
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `MemberAccount`, `Charge`, `Payment`
- [ ] Existe al menos un socio con cargo en estado PENDING para pruebas
- [ ] Librería `xlsx` o equivalente para generación XML disponible (o instalar librería SEPA específica)

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `SepaRemittance` con entity `SepaDebit` | UC-024 (devoluciones SEPA) |
| Entity `SepaMandate` en `MemberAccount` | UC-024 (consulta de mandatos), frontend de ficha de socio |
| Fichero XML pain.008 descargable | Banca online del tenant (manual: descarga → upload en banco) |
| Configuración SEPA del tenant | UC-024 (contexto de acreedor) |
| Endpoint de generación de remesa | Frontend UC-023 |
| Evento `SepaRemittanceGenerated` | BC-Communication (avisar socios 2 días antes del cobro) |
| Evento `SepaMandateRegistered` | Auditoría |
| Cargos en estado EN_PROCESO_COBRO | UC-024 (transición a DEVUELTO o PAGADO) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-023.md` | Flujo completo: configuración acreedor, mandatos, generación remesa, tipos de secuencia |
| `us/us-061.md` | Criterios: generación de remesa SEPA con selección de cargos |
| `us/us-062.md` | Criterios: configuración del identificador de acreedor |
| `us/us-063.md` | Criterios: registro de mandatos SEPA |
| `us/us-064.md` | Criterios: determinación tipo de secuencia FRST/RCUR/OOFF |
| `us/us-065.md` | Criterios: validación de plazos de presentación |
| `bc/bc-treasury.md` | Aggregates SepaRemittance, SepaDebit, SepaMandate, CreditorIdentifier |
| `adr/adr-008.md` | Outbox pattern para Domain Events |
| `rnft/rnft-015.md` | Performance: generación de 200 adeudos en <5 segundos |

## Puntos críticos

1. **Validación del Identificador de Acreedor (Tabla 7).** El formato español es exactamente 18 caracteres: `ES` + 2 dígitos de control + `000` + CIF. El dígito de control se calcula con algoritmo mod-97 sobre el CIF + sufijo + código país numérico. Una validación incorrecta impide generar remesas válidas. El CIF debe coincidir con el del tenant registrado.

2. **Algoritmo de tipo de secuencia (Tabla 8).** Cada adeudo en la remesa lleva un tag `<SeqTp>` que debe ser FRST, RCUR u OOFF. Las reglas son: OOFF si `cargo.esCobroUnico = true` (prioridad máxima); FRST si el mandato no tiene `lastDebitDate` o si lleva 36+ meses sin uso; RCUR en caso contrario. Una asignación incorrecta causa rechazo bancario.

3. **Generación de XML ISO 20022 pain.008.001.08.** El XML debe cumplir estrictamente el schema SEPA. Campos clave: `<GrpHdr>` (cabecera), `<PmtInf>` (información de pago), `<DrctDbtTxInf>` (cada adeudo). Límites de longitud SEPA: concepto max 140 chars, nombre max 70 chars, referencia max 35 chars. Usar librería validada o generar manualmente con validación de schema.

4. **Plazo mínimo de 3 días hábiles.** La fecha de cobro debe ser al menos 3 días hábiles después de la generación. El cálculo de días hábiles excluye sábados, domingos y festivos nacionales españoles. El sistema debe sugerir la fecha mínima válida si la introducida no cumple el plazo.

5. **Caducidad automática de mandatos por 36 meses.** Un mandato sin adeudos durante 36+ meses se trata como nuevo (FRST), no como recurrente. El sistema debe calcular `monthsUnused = MONTHS_BETWEEN(lastDebitDate, currentDate)` y aplicar la regla automáticamente. Opcionalmente, marcar mandatos como CADUCADO en proceso de revisión diaria.

6. **Actualización post-procesamiento.** Tras marcar la remesa como enviada: actualizar `SepaMandate.lastDebitDate` para adeudos FRST y RCUR (no OOFF), y transicionar cargos a `IN_COLLECTION_PROCESS`. Estas actualizaciones deben ser atómicas con el cambio de estado de la remesa.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| XML generado no cumple schema ISO 20022 | Media | Alto | Usar librería SEPA validada. Test con XML validator antes de cada generación. Tests con schemas reales |
| Tipo de secuencia incorrecto causa rechazo bancario | Media | Alto | Tests exhaustivos del algoritmo de Tabla 8 con todos los escenarios. Logging de cada asignación |
| Cálculo de días hábiles incorrecto por festivos | Baja | Medio | Usar librería `date-holidays` para festivos españoles. Tests con fechas conocidas |
| Fichero XML con caracteres especiales no SEPA | Media | Medio | Sanitizar todos los campos de texto: eliminar acentos, ñ→n, limitar a ASCII básico para campos XML |
| Mandato caducado incluido como RCUR | Baja | Alto | Calcular monthsUnused para CADA mandato antes de incluir en remesa. Rechazar si caducado sin conversión a FRST |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects SEPA

Crear en `api/src/treasury/domain/value-objects/`:

- **`CreditorIdentifier`**: Value Object con validación de formato español (18 chars). Método `create(value: string): Result<CreditorIdentifier, Error>`. Validación: prefijo ES, longitud 18, dígito control mod-97, sufijo 000, CIF válido
- **`MandateReference`**: Value Object con formato `MAND-{YEAR}-{MEMBER_NUMBER}`. Validación: max 35 chars (norma SEPA), unicidad por acreedor
- **`SepaSequence`**: Enum VO con valores `FRST`, `RCUR`, `OOFF`, `FNAL`
- **`RemittanceStatus`**: Enum VO con valores `DRAFT`, `GENERATED`, `SENT`, `PROCESSED`, `WITH_RETURNS`
- **`MandateStatus`**: Enum VO con valores `ACTIVE`, `REVOKED`, `EXPIRED`
- **`DebitStatus`**: Enum VO con valores `INCLUDED`, `COLLECTED`, `RETURNED`

### Paso 2: Capa de dominio — Entity SepaMandate

Crear en `api/src/treasury/domain/entities/sepa-mandate.ts`:

- Entity `SepaMandate` dentro de `MemberAccount`:
  - `id: MandateId`, `reference: MandateReference`, `debtorIban: string` (cifrado), `debtorName: string`
  - `signatureDate: Date`, `lastDebitDate: Date?`, `status: MandateStatus`, `signedDocumentId?: string`
  - Método `isExpired(): boolean` — `lastDebitDate && monthsDiff(lastDebitDate, now) >= 36`
  - Método `determineSequenceType(isOneTimeCharge: boolean): SepaSequence` — implementa Tabla 8
  - Método `updateLastDebitDate(date: Date): void`
  - Método `revoke(): void` — cambia status a REVOKED

Añadir a `MemberAccount`:
- Propiedad `sepaMandate?: SepaMandate`
- Método `registerMandate(mandateData): void`
- Método `revokeMandate(): void`

### Paso 3: Capa de dominio — Aggregate SepaRemittance

Crear en `api/src/treasury/domain/aggregates/sepa-remittance.ts`:

- Aggregate `SepaRemittance`:
  - `id: RemittanceId`, `creditorIdentifier: CreditorIdentifier`, `creditorName: string`, `creditorIban: string`
  - `chargeDate: Date`, `createdAt: Date`, `status: RemittanceStatus`, `xmlFilePath?: string`
  - `debits: SepaDebit[]`, `totalAmount: Money`, `totalDebits: number`
  - Factory method `SepaRemittance.create(creditorConfig, chargeDate, debits)`:
    - Valida que `chargeDate` >= hoy + 3 días hábiles
    - Valida que todos los débitos tienen mandato válido
    - Calcula `totalAmount` y `totalDebits`
    - Registra evento `SepaRemittanceGenerated`
  - Método `markAsSent(): void` — transiciona a SENT, registra evento `SepaRemittanceSent`
  - Método `markAsProcessed(): void` — transiciona a PROCESSED

- Entity `SepaDebit` dentro de `SepaRemittance`:
  - `id: DebitId`, `chargeId: ChargeId`, `mandateId: MandateId`, `amount: Money`
  - `sequenceType: SepaSequence`, `debtorName: string`, `debtorIban: string`
  - `status: DebitStatus`, `returnReason?: string`, `returnDate?: Date`

### Paso 4: Capa de dominio — Domain Service SepaRemittanceGenerator

Crear en `api/src/treasury/domain/services/sepa-remittance-generator.ts`:

- **`SepaRemittanceGenerator`**: Domain Service que genera el XML
  - `generateXml(remittance: SepaRemittance): string`
  - Genera estructura XML pain.008.001.08 con:
    - `<GrpHdr>`: MsgId, CreDtTm, NbOfTxs, CtrlSum, InitgPty
    - `<PmtInf>`: PmtInfId, PmtMtd (DD), BtchBookg, NbOfTxs, CtrlSum, PmtTpInf (SvcLvl=SEPA), ReqdColltnDt, Cdtr, CdtrAcct, CdtrAgt, CdtrSchmeId
    - `<DrctDbtTxInf>` por cada adeudo: PmtId (EndToEndId), InstdAmt, DrctDbtTx (MndtRltdInf: MndtId, DtOfSgntr, SeqTp), DbtrAgt, Dbtr, DbtrAcct
  - Sanitiza campos de texto: sin acentos ni caracteres especiales para compatibilidad bancaria
  - Valida longitudes SEPA: concepto ≤140, nombre ≤70, referencia ≤35
  - Retorna XML como string

- **`BusinessDayCalculator`**: Domain Service para cálculo de días hábiles
  - `isBusinessDay(date: Date): boolean` — excluye sábados, domingos y festivos nacionales
  - `addBusinessDays(date: Date, days: number): Date`
  - `countBusinessDays(from: Date, to: Date): number`
  - `getMinimumChargeDate(fromDate: Date): Date` — añade 3 días hábiles
  - Festivos nacionales españoles cargados desde constante o configuración

### Paso 5: Capa de dominio — SEPA Config

Crear en `api/src/treasury/domain/entities/sepa-config.ts`:

- **`SepaConfig`**: Entity de configuración SEPA del tenant
  - `creditorIdentifier: CreditorIdentifier`, `creditorName: string`, `creditorAddress: string`
  - `creditorIban: string`, `creditorBic?: string`
  - `bankFeesPerReturn: Money` (gastos por devolución, configurable)
  - `maxRetries: number` (límite de reintentos, por defecto 3)

### Paso 6: Capa de aplicación — Commands y Queries

Crear en `api/src/treasury/application/`:

- **Commands:**
  - `SaveSepaConfigCommand`: `{ tenantId, creditorIdentifier, creditorName, creditorAddress, creditorIban }`
  - `RegisterMandateCommand`: `{ tenantId, memberAccountId, debtorIban, debtorName, signatureDate, mandateType, signedDocumentFile? }`
  - `RevokeMandateCommand`: `{ tenantId, memberAccountId, reason }`
  - `GenerateRemittanceCommand`: `{ tenantId, chargeDate, chargeSelection: 'ALL_PENDING' | 'OVERDUE_ONLY' | 'CURRENT_MONTH' | 'MANUAL', manualChargeIds?: string[] }`
  - `MarkRemittanceSentCommand`: `{ tenantId, remittanceId }`

- **Queries:**
  - `GetSepaConfigQuery`: `{ tenantId }`
  - `GetMandateQuery`: `{ tenantId, memberAccountId }`
  - `GetRemittanceDetailQuery`: `{ tenantId, remittanceId }`
  - `ListRemittancesQuery`: `{ tenantId, status?, page, pageSize }`
  - `PreviewRemittanceQuery`: `{ tenantId, chargeSelection }` → conteo, total, lista de adeudos

- **DTOs:**
  - `SepaConfigDto`: validación del identificador de acreedor con regex + mod-97
  - `RegisterMandateDto`: validación de IBAN del deudor
  - `GenerateRemittanceDto`: selección de cargos y fecha de cobro
  - `RemittanceResponseDto`: `{ id, chargeDate, status, totalDebits, totalAmount, xmlAvailable }`
  - `RemittancePreviewDto`: `{ totalDebits, totalAmount, firstDebits: number, recurringDebits: number, oneOffDebits: number, membersWithoutMandate: number }`

### Paso 7: Capa de aplicación — Handlers

Crear en `api/src/treasury/application/commands/`:

- **`SaveSepaConfigHandler`**:
  1. Verificar permisos: `treasury:sepa:configure`
  2. Validar `CreditorIdentifier.create(value)` con algoritmo mod-97
  3. Validar que CIF del identificador coincide con CIF del tenant
  4. Persistir en tabla `sepa_config`

- **`RegisterMandateHandler`**:
  1. Verificar permisos: `treasury:sepa:mandates`
  2. Obtener `MemberAccount`
  3. Validar IBAN del deudor con mod-97
  4. Generar `MandateReference` con formato `MAND-{YEAR}-{MEMBER_NUMBER}`
  5. Crear entity `SepaMandate` con `status = ACTIVE`, `lastDebitDate = null`
  6. Si se adjunta documento firmado: almacenar en S3 cifrado
  7. Publicar evento `SepaMandateRegistered` vía Outbox

- **`GenerateRemittanceHandler`**:
  1. Verificar permisos: `treasury:remittances:generate`
  2. Obtener `SepaConfig` del tenant (FE-1 si no configurado)
  3. Validar fecha de cobro: `BusinessDayCalculator.countBusinessDays(today, chargeDate) >= 3` (FE-2)
  4. Consultar cargos pendientes según selección
  5. Filtrar solo cargos con mandato SEPA activo
  6. Para cada cargo con mandato:
     - Determinar tipo de secuencia: `mandate.determineSequenceType(charge.esCobroUnico)`
     - Crear `SepaDebit` con datos del cargo y mandato
  7. Crear Aggregate `SepaRemittance.create(...)`
  8. Invocar `SepaRemittanceGenerator.generateXml(remittance)`
  9. Almacenar XML cifrado en S3
  10. Transicionar cargos incluidos a estado `IN_COLLECTION_PROCESS`
  11. Persistir remesa y publicar evento `SepaRemittanceGenerated` vía Outbox
  12. Retornar `RemittanceResponseDto`

- **`MarkRemittanceSentHandler`**:
  1. Obtener remesa en estado GENERATED
  2. Invocar `remittance.markAsSent()`
  3. Actualizar `lastDebitDate` en mandatos de adeudos FRST y RCUR
  4. Persistir y publicar evento `SepaRemittanceSent`

### Paso 8: Capa de infraestructura — Repository y Storage

Crear en `api/src/treasury/infrastructure/persistence/`:

- **`PrismaSepaRemittanceRepository`**: Implementa persistencia de `SepaRemittance` + `SepaDebit`
- **`PrismaSepaConfigRepository`**: Persistencia de `SepaConfig`
- Mappers para todas las entities

Crear en `api/src/treasury/infrastructure/services/`:

- **`SepaXmlStorageService`**: Almacenamiento cifrado de ficheros XML en S3
  - `store(remittanceId: string, xml: string): Promise<string>` (retorna path)
  - `retrieve(remittanceId: string): Promise<string>` (retorna XML)
  - Retención: 5 años (requisito legal)

### Paso 9: Capa de infraestructura — Controller

Crear en `api/src/treasury/infrastructure/controllers/`:

- **`SepaController`**:
  - `GET /api/v1/tenants/:tenantId/sepa/config` → Obtener configuración SEPA
  - `PUT /api/v1/tenants/:tenantId/sepa/config` → Guardar configuración SEPA
  - `POST /api/v1/tenants/:tenantId/members/:memberId/mandate` → Registrar mandato
  - `GET /api/v1/tenants/:tenantId/members/:memberId/mandate` → Consultar mandato
  - `DELETE /api/v1/tenants/:tenantId/members/:memberId/mandate` → Revocar mandato
  - `POST /api/v1/tenants/:tenantId/remittances/preview` → Preview de remesa
  - `POST /api/v1/tenants/:tenantId/remittances` → Generar remesa
  - `GET /api/v1/tenants/:tenantId/remittances` → Listar remesas
  - `GET /api/v1/tenants/:tenantId/remittances/:id` → Detalle de remesa
  - `GET /api/v1/tenants/:tenantId/remittances/:id/xml` → Descargar XML (Content-Type: application/xml)
  - `PUT /api/v1/tenants/:tenantId/remittances/:id/sent` → Marcar como enviada
  - Swagger decorators, guards de permisos

### Paso 10: Tests

**Tests unitarios (dominio):**
- `CreditorIdentifier.create()` con formato válido → OK. Con formato inválido → error. Dígito de control → calculado correctamente
- `SepaMandate.determineSequenceType()` → FRST si `lastDebitDate = null`, RCUR si uso reciente, FRST si >36 meses, OOFF si cobro único
- `SepaRemittance.create()` con fecha insuficiente → error de plazo
- `SepaRemittanceGenerator.generateXml()` → XML con estructura pain.008 correcta, longitudes SEPA respetadas
- `BusinessDayCalculator.addBusinessDays()` → cálculo correcto saltando fines de semana y festivos

**Tests unitarios (aplicación):**
- `GenerateRemittanceHandler` con mocks → flujo completo incluyendo generación XML
- `GenerateRemittanceHandler` sin config SEPA → error FE-1
- `GenerateRemittanceHandler` con fecha insuficiente → error FE-2
- `RegisterMandateHandler` → mandato creado con status ACTIVE

**Tests de integración:**
- Configuración SEPA completa, registro de mandato, generación de remesa con 10 adeudos
- Verificar que XML generado es parseable y contiene todos los adeudos
- Verificar tipos de secuencia: mix de FRST y RCUR en misma remesa
- Verificar que cargos transicionan a IN_COLLECTION_PROCESS
- Marcar como enviada → verificar actualización de `lastDebitDate`
- Verificar almacenamiento cifrado del XML en S3

## Criterios de aceptación

Derivados de US-061, US-062, US-063, US-064, US-065:

1. **Configuración SEPA validada:** El identificador de acreedor se valida con formato español (18 chars, dígito control mod-97, CIF correcto). Solo se puede guardar si es válido.

2. **Mandatos SEPA registrados:** Se pueden registrar mandatos con IBAN validado y documento firmado adjunto. La referencia del mandato se genera automáticamente.

3. **Remesa generada con XML válido:** Al generar una remesa, se produce un fichero XML pain.008.001.08 descargable con todos los adeudos correctamente formateados.

4. **Tipo de secuencia correcto:** Los adeudos FRST se asignan a mandatos nuevos o inactivos >36 meses. Los RCUR a mandatos con uso reciente. Los OOFF a cargos únicos.

5. **Plazo de presentación validado:** El sistema rechaza remesas con fecha de cobro inferior a 3 días hábiles y sugiere la fecha mínima válida.

6. **Cargos actualizados tras generación:** Los cargos incluidos en la remesa transicionan a estado EN_PROCESO_COBRO y no pueden incluirse en otra remesa.
