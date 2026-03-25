# Task 6 - UC-006: Gestión de ficha de socio (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-006
- **Bounded Context:** BC-Membership
- **Application Service:** `MemberService`
- **Aggregates:** `Member`, `MemberType`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `Member` completo (dominio) con Value Objects (`PersonalData`, `ContactData`, `IdentityDocument`, `BankDetails`, `MemberNumber`, `CustomFields`)
- Application Service `MemberService` con flujos: creación de ficha, actualización de datos, consulta de ficha
- Validación de DNI/NIE con algoritmo de letra de control (mod 23)
- Validación de IBAN con algoritmo mod 97
- Cifrado de IBAN con AES-256-GCM antes de persistir (RNF-006)
- Unicidad de DNI y email dentro del tenant
- Campos personalizados (`custom_fields` JSONB) según tipo de colectividad: Cofradía (US-010), Club Deportivo (US-011), Peña (US-012), Asociación Cultural (US-013)
- Generación automática de número de socio (secuencial por tenant)
- Protección de campos inmutables en actualización (DNI, número de socio)
- Detección de menores de edad sin representante legal (FE-4)
- Domain Events: `MemberRegistered`, `MemberDataUpdated`
- Endpoints REST:
  - `POST /api/v1/members`
  - `GET /api/v1/members/:id`
  - `GET /api/v1/members`
  - `PUT /api/v1/members/:id`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Proceso de alta simplificado en 3 pasos (UC-011 - F1-Back Task 7)
- Generación de carnet digital (UC fuera del MVP core)
- Portal del socio con consulta propia (FA-2, diferido a frontend Fase 2)
- Envío de email de bienvenida (BC-Communication, consumidor del evento `MemberRegistered`)
- Creación de MemberAccount en BC-Treasury (consumidor del evento `MemberRegistered`)
- Gestión de estados del socio (UC-007 - F1-Back Task 5, ya implementada)
- Adjuntos de certificados médicos y documentos (simplificado para MVP: solo metadatos)

## Dependencias

### Tareas previas requeridas

| Tarea                       | Artefacto necesario                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold**       | Estructura de módulos NestJS, Shared kernel (AggregateRoot, Entity, ValueObject, DomainEvent), PrismaTenantService, Prisma schemas (main + tenant), Docker Compose con PostgreSQL |
| **F1-Back Task 1 - UC-001** | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados, `CollectivityType` del tenant disponible                                    |
| **F1-Back Task 2 - UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa, `TenantMiddleware` integrado con JWT                                          |
| **F1-Back Task 3 - UC-008** | Aggregate `MemberType` (dominio), modelo `MemberType` en schema tenant, tipos de socio configurados, `MemberTypeRulesEvaluator`                                                   |
| **F1-Back Task 5 - UC-007** | Aggregate `Member` parcial con máquina de estados (`MemberStatus`, `StatusHistory`, `StatusTransitionValidator`), modelo `Member` mínimo en schema tenant                         |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/domain/aggregate-root.base.ts` existe y exporta la clase `AggregateRoot<TId>`
- [ ] `api/src/shared/domain/value-object.base.ts` existe y exporta la clase `ValueObject<TProps>`
- [ ] `api/src/shared/domain/domain-event.base.ts` existe y exporta la clase `DomainEvent`
- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` funciona correctamente
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` funciona correctamente
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] Los endpoints de auth (`/api/v1/auth/*`) funcionan y emiten JWT con claims correctos
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `OutboxEvent`, `MemberType` (de Task 3), `FiscalYear` (de Task 4), `Member` mínimo y `StatusHistory` (de Task 5)
- [ ] El Aggregate `MemberType` está operativo (tipos creados en BD del tenant)
- [ ] El Aggregate `Member` parcial con máquina de estados está operativo (de Task 5)
- [ ] Los permisos `membership:members:create`, `membership:members:read`, `membership:members:update` existen en los roles seedeados

### Artefactos producidos

| Artefacto                                                                                            | Consumido por                                                                          |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Aggregate `Member` completo (dominio) con ficha y datos personales                                   | UC-011 (alta simple), UC-013 (baja), consultas de ficha                                |
| Value Objects de datos personales (`PersonalData`, `ContactData`, `IdentityDocument`, `BankDetails`) | UC-011 (reutiliza validaciones), UC-056 (importación masiva)                           |
| `MemberService` (application)                                                                        | UC-011 (delegación para creación de ficha), UC-013 (consulta de datos)                 |
| Modelo `Member` completo en schema tenant Prisma                                                     | Todos los UCs que referencien socios                                                   |
| Endpoints REST de ficha de socio                                                                     | Frontend UC-006 (Fase 2), testing manual                                               |
| Evento `MemberRegistered`                                                                            | BC-Treasury (crear MemberAccount + MandatoSepa), BC-Communication (email bienvenida)   |
| Evento `MemberDataUpdated`                                                                           | BC-Treasury (actualizar IBAN si cambió), BC-Communication (actualizar email si cambió) |

## Referencia de especificación

| Documento             | Contenido relevante                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `uc/uc-006.md`        | Flujo completo de creación/actualización de ficha, campos obligatorios, campos específicos por colectividad, validaciones, flujos alternativos y excepciones |
| `us/us-009.md`        | Ficha centralizada con datos básicos: nombre, DNI, fecha nacimiento, email, teléfono, IBAN cifrado                                                           |
| `us/us-010.md`        | Campos específicos para cofradías: bautismo, padrinos, jura de reglas, túnica, cortejo                                                                       |
| `us/us-011.md`        | Campos específicos para clubes deportivos: licencia federativa, certificado médico, categoría deportiva                                                      |
| `us/us-012.md`        | Campos específicos para peñas festeras: tallas, preferencias alimentarias, voluntariado                                                                      |
| `us/us-013.md`        | Campos específicos para asociaciones culturales: profesión, habilidades, áreas de interés, idiomas                                                           |
| `bc/bc-membership.md` | Aggregate Member - estructura, Value Objects (PersonalData, ContactData, IdentityDocument, BankDetails), invariantes, comportamientos                        |

## Puntos críticos

1. **Extensión del Aggregate Member existente.** Task 5 (UC-007) ya creó un modelo mínimo de `Member` con la máquina de estados. Esta task debe extender ese Aggregate sin romper la funcionalidad existente. Los Value Objects de ficha (`PersonalData`, `ContactData`, `IdentityDocument`, `BankDetails`, `CustomFields`) se añaden como propiedades del Aggregate existente. La factory `Member.create()` se extiende para recibir todos los datos de ficha. Los métodos de cambio de estado (`changeStatus()`) permanecen intactos.

2. **Cifrado de IBAN (RNF-006).** El IBAN debe cifrarse con AES-256-GCM antes de almacenar. Implementar un `EncryptionService` (port en dominio, implementación en infraestructura) que cifre/descifre datos sensibles. La clave de cifrado se obtiene de variable de entorno. El mapper Prisma debe cifrar al persistir y descifrar al recuperar. En caso de clave comprometida, debe soportarse rotación de claves.

3. **Validación de DNI/NIE con algoritmo de letra.** El algoritmo de validación de DNI español es `letra = "TRWAGMYFPDXBNJZSQVHLCKE"[numero % 23]`. Para NIE: reemplazar X→0, Y→1, Z→2 y aplicar el mismo algoritmo. Para pasaporte: validar solo formato alfanumérico. Implementar como método estático en el Value Object `IdentityDocument`.

4. **Unicidad de DNI y email a nivel de tenant.** La BD es aislada por tenant (ADR-002), por lo que los constraints UNIQUE en `document_number` y `email` se aplican automáticamente por tenant. Sin embargo, la verificación debe hacerse también en capa de aplicación antes de intentar el INSERT para emitir errores de negocio descriptivos (FE-1, FE-2) en lugar de errores de constraint de BD.

5. **Campos personalizados como JSONB.** Los campos específicos por tipo de colectividad se almacenan en `custom_fields` (JSONB). Definir schemas JSON por `CollectivityType` para validar la estructura. La validación se ejecuta en el Value Object `CustomFields`. Si el tipo de colectividad del tenant no coincide con los campos proporcionados, ignorar campos no reconocidos sin error.

## Riesgos

| Riesgo                                                      | Probabilidad | Impacto | Mitigación                                                                                                                                                |
| ----------------------------------------------------------- | ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extensión del Aggregate Member rompe tests de Task 5        | Media        | Alto    | Mantener retrocompatibilidad en factory `Member.create()` con parámetros opcionales para datos de ficha. Ejecutar tests de Task 5 tras cada cambio        |
| Clave de cifrado AES perdida impide leer IBANs existentes   | Baja         | Crítico | Backup seguro de la clave. Implementar campo `encryption_key_version` para soportar rotación. Documentar proceso de recuperación                          |
| Validación de DNI rechaza formatos válidos poco comunes     | Baja         | Medio   | Soportar DNI (8 dígitos + letra), NIE (X/Y/Z + 7 dígitos + letra) y Pasaporte (alfanumérico libre). Incluir tests con todos los formatos                  |
| Schema JSON de `custom_fields` evoluciona con nuevos campos | Media        | Bajo    | Versionado del schema JSON. Campos nuevos son siempre opcionales. Validación permisiva: aceptar campos desconocidos, rechazar campos requeridos faltantes |

## Plan de implementación

### Paso 1: Capa de dominio - Value Objects

Crear en `api/src/membership/domain/value-objects/`:

- **`PersonalData`**: Value Object con `name: string`, `surnames: string`, `birthDate: Date`. Método factory `create(props): Result<PersonalData, ValidationError>`. Invariantes: nombre y apellidos no vacíos, `birthDate <= hoy`. Método `getAge(): number` que calcula la edad actual
- **`ContactData`**: Value Object con `email: string`, `phone: string | null`, `address: string | null`, `postalCode: string | null`, `city: string | null`. Método factory `create(props): Result<ContactData, ValidationError>`. Invariante: email válido (formato RFC 5322, lowercase, trim). Método `normalizeEmail(): string`
- **`IdentityDocument`**: Value Object con `type: DocumentType` (DNI, NIE, PASSPORT), `number: string`. Método factory `create(type: DocumentType, number: string): Result<IdentityDocument, DocumentInvalidError>`. Validaciones:
  - DNI: 8 dígitos + letra de control (`TRWAGMYFPDXBNJZSQVHLCKE[n % 23]`)
  - NIE: X/Y/Z + 7 dígitos + letra de control (X→0, Y→1, Z→2)
  - Pasaporte: alfanumérico, 5-20 caracteres
- **`BankDetails`**: Value Object con `iban: string`. Método factory `create(iban: string): Result<BankDetails, IbanInvalidError>`. Validación IBAN: mover 4 primeros caracteres al final, convertir letras a números (A=10, B=11...), verificar módulo 97 = 1. Método `getMaskedIban(): string` que retorna `ES91****5332`
- **`MemberNumber`**: Value Object con `value: string`. Método factory `fromSequence(sequence: number, format?: string): MemberNumber`. Formato por defecto: cero-padded a 5 dígitos (`00001`). Invariante: no vacío
- **`CustomFields`**: Value Object con `data: Record<string, unknown>`. Método factory `create(data: Record<string, unknown>, collectivityType: string): Result<CustomFields, CustomFieldsInvalidError>`. Valida schema JSON según tipo de colectividad. Método `getValue(key: string): unknown`

Tests unitarios: validación de DNI (válido con letra correcta, letra incorrecta, formato inválido), validación de NIE (X, Y, Z), validación de IBAN (ES válido, mod 97 inválido, formato incorrecto), validación de `PersonalData` (edad calculada, nombre vacío), `CustomFields` con schemas por colectividad.

### Paso 2: Capa de dominio - Extensión del Aggregate Member

Extender en `api/src/membership/domain/aggregates/member.ts`:

- Propiedades añadidas (a las existentes de Task 5: `currentStatus`, `statusHistory`, `version`):
  - `memberNumber: MemberNumber`
  - `personalData: PersonalData`
  - `contactData: ContactData`
  - `identityDocument: IdentityDocument`
  - `bankDetails: BankDetails | null`
  - `memberTypeId: MemberTypeId`
  - `customFields: CustomFields`
  - `registrationDate: Date`
  - `leaveDate: Date | null`
- Método factory `Member.register(props)`: genera UUID, genera `MemberNumber` desde secuencia, establece `registrationDate = now()`, establece `currentStatus = ACTIVE` o `APPLICANT` según parámetro, crea primera entrada en `StatusHistory`, registra evento `MemberRegistered`. Valida todas las invariantes de ficha
- Métodos de negocio añadidos:
  - `updatePersonalData(newData: Partial<PersonalData>): void`: actualiza datos personales. Invariante: no permite cambiar `identityDocument`. Registra evento `MemberDataUpdated`
  - `updateContactData(newContactData: ContactData): void`: actualiza datos de contacto. Registra evento `MemberDataUpdated`
  - `updateBankDetails(newBankDetails: BankDetails): void`: actualiza IBAN. Registra evento `MemberDataUpdated` con flag `ibanChanged: true`
  - `updateCustomFields(newFields: CustomFields): void`: actualiza campos personalizados
  - `calculateSeniority(): { years: number, months: number }`: calcula antigüedad desde `registrationDate`, descontando periodos de baja si aplica
- Invariantes añadidas:
  - DNI/NIE único dentro del tenant (verificado en capa de aplicación)
  - Email único dentro del tenant (verificado en capa de aplicación)
  - IBAN válido si proporcionado
  - Edad compatible con el tipo de socio asignado (verificado con `MemberTypeRulesEvaluator`)

Tests unitarios: creación de Member con ficha completa, rechazo con DNI inválido, rechazo con IBAN inválido, actualización de datos con evento emitido, protección de campo DNI en actualización, cálculo de antigüedad, compatibilidad de edad con tipo de socio.

### Paso 3: Capa de dominio - Domain Events

Crear en `api/src/membership/domain/events/`:

- **`MemberRegisteredEvent`**: Extiende `DomainEvent`. Payload: `{ memberId: UUID, memberNumber: string, name: string, surnames: string, email: string, memberTypeId: UUID, registrationDate: Date, iban?: string }`
- **`MemberDataUpdatedEvent`**: Extiende `DomainEvent`. Payload: `{ memberId: UUID, modifiedFields: string[], newEmail?: string, newIban?: string, updateDate: Date }`

### Paso 4: Capa de dominio - Port de cifrado

Crear en `api/src/membership/domain/ports/`:

- **`EncryptionService`** (interfaz/port):
  - `encrypt(plainText: string): Promise<string>`
  - `decrypt(cipherText: string): Promise<string>`

### Paso 5: Capa de dominio - Repository interfaces

Extender en `api/src/membership/domain/repositories/`:

- **`MemberRepository`** (interfaz, extendida de Task 5):
  - `save(member: Member): Promise<void>` (existente, con optimistic locking)
  - `findById(id: MemberId): Promise<Member | null>` (existente)
  - `findByIdentityDocument(document: IdentityDocument): Promise<Member | null>` (nuevo)
  - `findByEmail(email: string): Promise<Member | null>` (nuevo)
  - `findAll(filter?: MemberFilter): Promise<Member[]>` (nuevo)
  - `existsByIdentityDocument(document: IdentityDocument): Promise<boolean>` (nuevo)
  - `existsByEmail(email: string): Promise<boolean>` (nuevo)
  - `getNextMemberNumber(): Promise<number>` (nuevo: obtiene siguiente secuencial)

### Paso 6: Capa de aplicación - Commands, Queries y DTOs

Crear en `api/src/membership/application/`:

**Commands:**

- **`CreateMemberCommand`**: `{ name, surnames, birthDate, documentType, documentNumber, email, phone, address, postalCode, city, iban, memberTypeId, customFields, initialStatus }`
- **`UpdateMemberCommand`**: `{ memberId, name, surnames, email, phone, address, postalCode, city, iban, customFields }`

**Queries:**

- **`GetMemberQuery`**: `{ memberId }`
- **`ListMembersQuery`**: `{ status?, memberTypeId?, search? }`

**DTOs:**

- **`CreateMemberDto`**: DTO de entrada con validaciones `class-validator`:
  - `@IsNotEmpty()` para name, surnames, documentNumber, email
  - `@IsDateString()` para birthDate
  - `@IsEnum(DocumentType)` para documentType
  - `@IsEmail()` para email
  - `@IsOptional()` para phone, address, postalCode, city, iban, customFields
  - `@IsUUID()` para memberTypeId
- **`UpdateMemberDto`**: DTO de entrada parcial (campos opcionales excepto memberId). No incluye documentType ni documentNumber (inmutables)
- **`MemberResponseDto`**: DTO de salida: `id`, `memberNumber`, `name`, `surnames`, `birthDate`, `age`, `documentType`, `documentNumber`, `email`, `phone`, `address`, `postalCode`, `city`, `ibanMasked` (nunca el IBAN completo en respuestas), `memberTypeId`, `memberTypeName`, `currentStatus`, `customFields`, `registrationDate`, `leaveDate`, `createdAt`, `updatedAt`
- **`MemberListResponseDto`**: DTO de salida para listados: `id`, `memberNumber`, `name`, `surnames`, `email`, `currentStatus`, `memberTypeName`, `registrationDate`

### Paso 7: Capa de aplicación - Handlers

**`CreateMemberHandler`:**

1. Validar que el DNI no existe en el tenant (`memberRepository.existsByIdentityDocument(document)`)
   - Si existe → error 409 "Ya existe un socio con DNI {number}: {name} (nº {memberNumber})" (FE-1)
2. Validar que el email no existe en el tenant (`memberRepository.existsByEmail(email)`)
   - Si existe → advertencia 409 "El email ya está en uso" (FE-2)
3. Validar que el tipo de socio existe y está activo (`memberTypeRepository.findById(memberTypeId)`)
4. Validar compatibilidad de edad con el tipo de socio usando `MemberTypeRulesEvaluator.evaluateAgeEligibility()`
   - Si no compatible → error 422 "La edad no cumple los requisitos del tipo '{typeName}'" (FE de UC-011)
5. Si edad < 18 y no se proporciona representante legal en customFields → advertencia (FE-4)
6. Obtener siguiente número de socio (`memberRepository.getNextMemberNumber()`)
7. Crear Aggregate `Member` via `Member.register(props)` - incluye primera entrada en `StatusHistory`
8. Guardar via `memberRepository.save(member)`
9. Publicar `MemberRegistered` via Outbox
10. Retornar `MemberResponseDto`

**En caso de fallo:**

- Reportar excepción vía `ErrorReporter.captureException()` con contexto del paso fallido

**`UpdateMemberHandler`:**

1. Buscar socio por ID (`memberRepository.findById(memberId)`)
2. Si no existe → error 404
3. Si se cambia email, validar unicidad del nuevo email
4. Si se cambia IBAN, validar formato
5. Ejecutar métodos de actualización correspondientes en el Aggregate (`updatePersonalData`, `updateContactData`, `updateBankDetails`, `updateCustomFields`)
6. Guardar via `memberRepository.save(member)` (con optimistic locking)
7. Publicar `MemberDataUpdated` via Outbox
8. Retornar `MemberResponseDto`

**`GetMemberHandler`:**

1. Buscar socio por ID con todos los datos de ficha
2. Si no existe → error 404
3. Descifrar IBAN para uso interno, enmascarar para respuesta
4. Retornar `MemberResponseDto`

**`ListMembersHandler`:**

1. Consultar `memberRepository.findAll(filter)` con filtros opcionales (status, memberTypeId, search)
2. Mapear a `MemberListResponseDto[]`
3. Retornar lista

### Paso 8: Capa de infraestructura - Schema Prisma (tenant)

Extender el modelo `Member` existente (creado parcialmente en Task 5) en `api/prisma/tenant/schema.prisma`:

```prisma
model Member {
  id                String    @id @default(uuid()) @db.Uuid
  member_number     String    @unique @db.VarChar(20)
  name              String    @db.VarChar(100)
  surnames          String    @db.VarChar(200)
  birth_date        DateTime  @db.Date
  document_type     String    @db.VarChar(10)
  document_number   String    @unique @db.VarChar(20)
  email             String    @unique @db.VarChar(255)
  phone             String?   @db.VarChar(20)
  address           String?   @db.VarChar(300)
  postal_code       String?   @db.VarChar(10)
  city              String?   @db.VarChar(100)
  iban_encrypted    String?   @db.Text
  member_type_id    String    @db.Uuid
  custom_fields     Json?
  current_status    String    @default("APPLICANT") @db.VarChar(30)
  registration_date DateTime  @default(now())
  leave_date        DateTime?
  version           Int       @default(0)
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  memberType        MemberType @relation(fields: [member_type_id], references: [id])

  @@index([current_status])
  @@index([member_type_id])
  @@index([email])
  @@map("members")
}
```

### Paso 9: Capa de infraestructura - Repository (Prisma) y servicios

Extender en `api/src/membership/infrastructure/persistence/`:

- **`PrismaMemberRepository`** (extendido de Task 5): Añadir métodos `findByIdentityDocument`, `findByEmail`, `findAll`, `existsByIdentityDocument`, `existsByEmail`, `getNextMemberNumber`. El método `getNextMemberNumber` ejecuta `SELECT COALESCE(MAX(CAST(member_number AS INTEGER)), 0) + 1 FROM members` con lock para evitar duplicados en concurrencia
- **`MemberPrismaMapper`** (extendido): Añadir mapeo de todos los campos de ficha. Integrar `EncryptionService` para cifrar/descifrar IBAN en `toPersistence`/`toDomain`

Crear en `api/src/membership/infrastructure/services/`:

- **`Aes256EncryptionService`**: Implementa `EncryptionService` usando `crypto` de Node.js con AES-256-GCM. La clave se obtiene de `process.env.ENCRYPTION_KEY`. Genera IV aleatorio por cada cifrado. Almacena como `iv:authTag:cipherText` en base64

### Paso 10: Capa de infraestructura - Controller

Crear en `api/src/membership/infrastructure/controllers/members.controller.ts`:

| Endpoint              | Método | Auth | Permiso                     | Body/Params                                           | Response                            |
| --------------------- | ------ | ---- | --------------------------- | ----------------------------------------------------- | ----------------------------------- |
| `/api/v1/members`     | POST   | JWT  | `membership:members:create` | `CreateMemberDto`                                     | 201 Created con `MemberResponseDto` |
| `/api/v1/members`     | GET    | JWT  | `membership:members:read`   | Query: `?status=ACTIVE&memberTypeId=uuid&search=juan` | 200 con `MemberListResponseDto[]`   |
| `/api/v1/members/:id` | GET    | JWT  | `membership:members:read`   | Param: `id`                                           | 200 con `MemberResponseDto`         |
| `/api/v1/members/:id` | PUT    | JWT  | `membership:members:update` | `UpdateMemberDto`                                     | 200 con `MemberResponseDto`         |

- Swagger decorators para documentación automática
- Errores: 409 Conflict (DNI o email duplicado), 404 Not Found (socio no encontrado), 422 Unprocessable Entity (edad incompatible con tipo, IBAN inválido, DNI inválido)

### Paso 11: Tests

**Tests unitarios (dominio):**

- `IdentityDocument.create()` con DNI válido (12345678Z) → aceptado
- `IdentityDocument.create()` con DNI letra incorrecta → rechazado
- `IdentityDocument.create()` con NIE válido (X1234567L) → aceptado
- `BankDetails.create()` con IBAN válido (ES9121000418450200051332) → aceptado
- `BankDetails.create()` con IBAN inválido → rechazado
- `BankDetails.getMaskedIban()` → retorna formato enmascarado
- `PersonalData.create()` con nombre vacío → rechazado
- `PersonalData.getAge()` → cálculo correcto
- `CustomFields.create()` con schema de cofradía válido → aceptado
- `CustomFields.create()` con schema incorrecto para tipo → rechazado
- `MemberNumber.fromSequence(342)` → `"00342"`
- `Member.register()` con datos completos → Member creado + evento `MemberRegistered` emitido + primera entrada `StatusHistory`
- `Member.register()` con DNI inválido → error de validación
- `Member.updatePersonalData()` → datos actualizados + evento `MemberDataUpdated` emitido
- `Member.updateBankDetails()` → IBAN actualizado + evento con `ibanChanged: true`
- `Member.calculateSeniority()` → cálculo correcto de años y meses

**Tests unitarios (aplicación):**

- `CreateMemberHandler` con mocks de `MemberRepository` y `MemberTypeRepository`:
  - Caso éxito: socio creado con número asignado, evento publicado
  - Caso DNI duplicado: rechazo con 409 y datos del socio existente
  - Caso email duplicado: rechazo con 409
  - Caso tipo de socio inexistente: rechazo con 404
  - Caso edad incompatible con tipo: rechazo con 422
  - Caso menor sin representante: advertencia (no bloquea)
- `UpdateMemberHandler`:
  - Caso éxito: datos actualizados, evento publicado
  - Caso socio no encontrado: 404
  - Caso cambio de email duplicado: 409
  - Caso optimistic locking fail: 409 con mensaje descriptivo
- `ListMembersHandler`:
  - Caso con filtro de status: solo socios activos
  - Caso con búsqueda textual: coincidencia por nombre/apellidos/email

**Tests de integración:**

- CRUD completo contra BD real (Testcontainers):
  - Crear socio con ficha completa → verificar persistencia correcta
  - Verificar que IBAN se almacena cifrado en BD (leer registro raw y confirmar que no es texto plano)
  - Verificar que IBAN se descifra correctamente al leer
  - Crear socio con DNI duplicado → verificar rechazo
  - Crear socio con email duplicado → verificar rechazo
  - Actualizar datos de contacto → verificar persistencia y evento
  - Verificar que campos inmutables (DNI, memberNumber) no se modifican en update
  - Listar socios con filtro de status → verificar filtrado correcto
- Campos personalizados:
  - Crear socio de cofradía con custom_fields de bautismo → verificar persistencia JSON
  - Crear socio de peña con custom_fields de tallas → verificar persistencia
- Verificar que `getNextMemberNumber` genera números secuenciales sin duplicados bajo concurrencia (2 inserts simultáneos)
- Verificar que eventos `MemberRegistered` y `MemberDataUpdated` se registran en outbox

## Criterios de aceptación

Derivados de US-009, US-010, US-011, US-012, US-013:

1. **Ficha centralizada con datos obligatorios (US-009):** Al crear un socio con datos básicos completos (nombre, apellidos, DNI, fecha nacimiento, email, teléfono, IBAN), se crea la ficha con número de socio asignado automáticamente. El IBAN se almacena cifrado con AES-256-GCM.

2. **DNI/NIE único por tenant (US-009):** Al intentar crear un socio con un DNI que ya existe en el tenant, el sistema rechaza la operación con mensaje "Ya existe un socio con este documento de identidad" e indica el nombre y número del socio existente.

3. **Campos específicos para cofradías (US-010):** Al crear un socio en un tenant de tipo Cofradía, se pueden registrar campos específicos (fecha de bautismo, parroquia, padrinos, jura de reglas, imposición de medalla, tipo de túnica, posición histórica en cortejo) en el JSON `custom_fields`.

4. **Campos específicos para clubes deportivos (US-011):** Al crear un socio en un tenant de tipo Club Deportivo, se pueden registrar datos federativos (categoría deportiva, número de licencia, fecha expedición, certificado médico con fecha de caducidad).

5. **Campos específicos para peñas festeras (US-012):** Al crear un socio en un tenant de tipo Peña, se pueden registrar datos logísticos (talla camiseta, talla pantalón, preferencias alimentarias, alergias, disponibilidad de voluntariado, vehículo).

6. **Campos específicos para asociaciones culturales (US-013):** Al crear un socio en un tenant de tipo Asociación Cultural, se pueden registrar datos profesionales (profesión, habilidades, áreas de interés, idiomas, disponibilidad horaria).

7. **IBAN validado y cifrado (FE-3, RNF-006):** Al registrar un IBAN, el sistema valida el formato con algoritmo mod 97. Si es inválido, rechaza con mensaje descriptivo. Si es válido, lo cifra antes de almacenar.

8. **Protección de campos inmutables (FA-1):** Al actualizar la ficha de un socio, no se permite cambiar el DNI ni el número de socio. Los demás campos son editables.

9. **Evento MemberRegistered emitido (UC-006):** Al completar la creación de un socio, se emite el evento `MemberRegistered` con payload completo (memberId, memberNumber, nombre, email, memberTypeId, registrationDate, iban). Este evento es consumido por BC-Treasury para crear MemberAccount.
