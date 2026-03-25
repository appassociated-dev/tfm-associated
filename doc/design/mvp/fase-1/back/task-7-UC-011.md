# Task 7 - UC-011: Alta simple de socio (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-011
- **Bounded Context:** BC-Membership
- **Application Service:** `MemberRegistrationService`
- **Aggregates:** `Member`, `MemberType`, `FiscalYear`
- **Prioridad:** Must

## Alcance

### Incluido

- Application Service `MemberRegistrationService` con flujo de alta simplificada en 3 pasos lógicos (datos personales, tipo de socio, inscripción)
- Validación de precondiciones: ejercicio activo abierto, tipos de socio configurados, plan de inscripción tipo UNICA existente
- Validación de DNI/NIE único en el tenant (FE-1)
- Validación de email duplicado con advertencia no bloqueante (FE-2)
- Validación de edad compatible con tipo de socio seleccionado (FE-3)
- Asignación automática de número de socio (secuencial por tenant)
- Creación atómica: Member + FeeSubscription (UNICA) + Charge + cierre automático de suscripción (`cancelReason = ONE_TIME_COMPLETED`)
- Evento `MemberRegistered` con payload completo para consumidores de BC-Treasury y BC-Communication
- Endpoint de verificación de DNI: `GET /api/v1/members/check-dni/:dni`
- Endpoint de alta simple: `POST /api/v1/members/simple-registration`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Ficha completa del socio con IBAN, campos personalizados (UC-006 - F1-Back Task 6, ya implementada)
- Portal del socio para pago online (UC-025, post-MVP)
- Envío de email de bienvenida (BC-Communication, consumidor del evento `MemberRegistered`)
- Generación de carnet digital (post-MVP)
- Proceso de lista de espera (post-MVP)
- Datos bancarios/IBAN en el alta simple (FA-2, se gestiona en edición de ficha UC-006)

## Dependencias

### Tareas previas requeridas

| Tarea                       | Artefacto necesario                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold**       | Estructura de módulos NestJS, Shared kernel (AggregateRoot, Entity, ValueObject, DomainEvent), PrismaTenantService, Prisma schemas (main + tenant), Docker Compose con PostgreSQL                                                        |
| **F1-Back Task 1 - UC-001** | Tenant provisionado con BD aislada, schema tenant migrado, roles predefinidos con permisos seedeados, `CollectivityType` del tenant disponible                                                                                           |
| **F1-Back Task 2 - UC-002** | `JwtAuthGuard`, `PermissionsGuard`, `@RequirePermissions()`, JWT Strategy, autenticación operativa, `TenantMiddleware` integrado con JWT                                                                                                 |
| **F1-Back Task 3 - UC-008** | Aggregate `MemberType` operativo con tipos configurados, `MemberTypeRulesEvaluator` para validar rango de edad                                                                                                                           |
| **F1-Back Task 4 - UC-010** | Aggregate `FiscalYear` operativo, ejercicio abierto disponible para contextualizar alta                                                                                                                                                  |
| **F1-Back Task 6 - UC-006** | Aggregate `Member` completo con ficha (PersonalData, ContactData, IdentityDocument, BankDetails, CustomFields), `MemberRepository` con `findByIdentityDocument`, `existsByEmail`, `getNextMemberNumber`, modelo Prisma `Member` completo |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/shared/domain/aggregate-root.base.ts` existe y exporta la clase `AggregateRoot<TId>`
- [ ] `api/src/shared/infrastructure/persistence/prisma-tenant.service.ts` existe con `getClient(tenantId)`
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` funciona correctamente
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` funciona correctamente
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] Los endpoints de auth (`/api/v1/auth/*`) funcionan y emiten JWT con claims correctos
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `Member` (completo, de Task 6), `MemberType`, `FiscalYear`, `StatusHistory`, `OutboxEvent`
- [ ] El Aggregate `Member` con ficha está operativo (de Task 6): `Member.register()`, Value Objects de ficha, validación de DNI/NIE
- [ ] El Aggregate `MemberType` está operativo con tipos creados y `MemberTypeRulesEvaluator`
- [ ] Existe al menos un ejercicio en estado `OPEN` en BD del tenant
- [ ] Los permisos `membership:members:create`, `membership:members:read` existen en los roles seedeados
- [ ] `api/src/treasury/domain/aggregates/fee-plan.ts` existe (de Task 9, necesario para crear suscripción UNICA)
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `FeePlan`, `MemberAccount`, `FeeSubscription`, `Charge`

### Artefactos producidos

| Artefacto                                           | Consumido por                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `MemberRegistrationService` (application)           | Frontend UC-011, endpoint de alta                                                      |
| Endpoint `POST /api/v1/members/simple-registration` | Frontend UC-011                                                                        |
| Endpoint `GET /api/v1/members/check-dni/:dni`       | Frontend UC-011 (validación debounced)                                                 |
| Evento `MemberRegistered`                           | BC-Treasury (crear MemberAccount, vincular cargo), BC-Communication (email bienvenida) |

## Referencia de especificación

| Documento             | Contenido relevante                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `uc/uc-011.md`        | Flujo completo del wizard de 3 pasos, validaciones, cargo de inscripción, suscripción UNICA, evento MemberRegistered |
| `us/us-028.md`        | Criterios de aceptación Gherkin: alta simple en 3 pasos, alta con pago inmediato                                     |
| `bc/bc-membership.md` | Aggregate Member, MemberRegistrationService, reglas de validación de alta                                            |
| `bc/bc-treasury.md`   | Entity FeeSubscription (plan UNICA, cierre automático), Entity Charge (cargo de inscripción)                         |
| `adr/adr-002.md`      | Multi-tenant por BD aislada, acceso via PrismaTenantService                                                          |
| `adr/adr-008.md`      | Outbox pattern para Domain Events                                                                                    |

## Puntos críticos

1. **Transacción atómica cross-BC (RNFT-037).** El alta simple crea artefactos en dos BCs: `Member` (BC-Membership) y `MemberAccount` + `FeeSubscription` + `Charge` (BC-Treasury). Dado que ambos BCs comparten la misma BD por tenant (ADR-002), se puede usar una transacción Prisma que englobe ambos INSERTs. Si falla cualquier paso, rollback completo. El evento `MemberRegistered` se registra en la tabla `outbox_events` dentro de la misma transacción.

2. **Suscripción UNICA: crear y cerrar inmediatamente.** Al completar el alta, se crea una `FeeSubscription` con el `FeePlan` de tipo UNICA (inscripción). Inmediatamente se cierra con `cancelReason = ONE_TIME_COMPLETED`. Se genera un único `Charge` con `finalAmount = plan.amount` (o `effectiveAmount` si hay descuento por tipo). El cargo queda en estado `PENDING`. Esta secuencia es atómica dentro de la misma transacción.

3. **Verificación de precondiciones antes de iniciar.** El servicio debe verificar 3 precondiciones antes de procesar el alta: (a) existe ejercicio activo abierto (`FiscalYear` en estado OPEN), (b) existe al menos un tipo de socio activo, (c) existe un `FeePlan` de tipo UNICA activo. Si alguna falla, retornar error descriptivo sin iniciar la transacción.

4. **Reutilización del Aggregate Member de Task 6.** Esta task NO crea un nuevo Aggregate Member. Reutiliza `Member.register()` de Task 6 que ya incluye: creación con PersonalData, ContactData, IdentityDocument, validación de DNI/NIE, generación de MemberNumber, primer StatusHistory entry, emisión de `MemberRegistered`. La task solo orquesta la creación del Member junto con los artefactos de BC-Treasury.

5. **Endpoint de verificación de DNI.** El endpoint `check-dni` permite al frontend verificar unicidad de DNI con debounce. Debe retornar `{ exists: boolean, memberName?: string, memberNumber?: string }` para que la UI muestre datos del socio existente y sugiera rehabilitación. Este endpoint es de solo lectura y no modifica estado.

## Riesgos

| Riesgo                                                                | Probabilidad | Impacto | Mitigación                                                                                                          |
| --------------------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------- |
| Transacción cross-BC excede timeout en BD grande                      | Baja         | Alto    | Transacción ligera: solo INSERTs (no queries pesadas). Timeout configurado a 5 segundos. Índices en DNI y email     |
| Race condition en asignación de número de socio (2 altas simultáneas) | Baja         | Medio   | Lock en `getNextMemberNumber()` ya implementado en Task 6. Verificar que funciona bajo concurrencia                 |
| FeePlan UNICA no existe al momento del alta                           | Baja         | Alto    | Verificación de precondición antes de iniciar. Error descriptivo con link a configuración de planes                 |
| Error parcial: Member creado pero suscripción/cargo falla             | Baja         | Crítico | Transacción atómica. Si falla cualquier INSERT, rollback completo. No se crea Member sin su cargo de inscripción    |
| Descuento por tipo mal aplicado al cargo de inscripción               | Media        | Medio   | El cargo UNICA usa `effectiveAmount` precalculado con descuento del tipo de socio. Tests específicos con descuentos |

## Plan de implementación

### Paso 1: Capa de dominio - Domain Service MemberRegistrationService (interfaz)

Crear en `api/src/membership/domain/services/`:

- **`MemberRegistrationService`** (interfaz/port en dominio): Define el contrato del proceso de alta simplificada
  - `simpleRegistration(request: SimpleRegistrationRequest): Promise<SimpleRegistrationResult>`
  - `checkDniAvailability(identityDocument: IdentityDocument): Promise<DniCheckResult>`
  - `validatePreconditions(tenantId: string): Promise<PreconditionResult>`

Tipos:

- **`SimpleRegistrationRequest`**: `{ name, surnames, birthDate, documentType, documentNumber, email, phone, address, postalCode, city, memberTypeId }`
- **`SimpleRegistrationResult`**: `{ memberId, memberNumber, status, memberTypeName, registrationDate, registrationCharge: { chargeId, amount, description, status } }`
- **`DniCheckResult`**: `{ exists: boolean, memberName?: string, memberNumber?: string }`
- **`PreconditionResult`**: `{ hasFiscalYear: boolean, hasMemberTypes: boolean, hasRegistrationPlan: boolean, errors: string[] }`

### Paso 2: Capa de dominio - Ports cross-BC

Crear en `api/src/membership/domain/ports/`:

- **`RegistrationChargePort`** (interfaz): Define la comunicación con BC-Treasury para crear artefactos de inscripción
  - `createRegistrationArtifacts(params: { memberId: string, memberTypeId: string, tenantId: string }): Promise<RegistrationChargeResult>`
  - `findRegistrationPlan(tenantId: string): Promise<RegistrationPlanInfo | null>`

Tipos:

- **`RegistrationChargeResult`**: `{ memberAccountId, subscriptionId, chargeId, chargeAmount, chargeDescription }`
- **`RegistrationPlanInfo`**: `{ feePlanId, code, name, amount, typeDiscount?: number }`

Este port permite que BC-Membership orqueste la creación de artefactos de tesorería sin importar repositorios de BC-Treasury directamente.

### Paso 3: Capa de aplicación - Commands, Queries y DTOs

Crear en `api/src/membership/application/`:

**Commands:**

- **`SimpleRegistrationCommand`**: `{ name, surnames, birthDate, documentType, documentNumber, email, phone, address, postalCode, city, memberTypeId }`

**Queries:**

- **`CheckDniQuery`**: `{ documentType, documentNumber }`
- **`ValidatePreconditionsQuery`**: `{ tenantId }`

**DTOs:**

- **`SimpleRegistrationDto`**: DTO de entrada con validaciones `class-validator`:
  - `@IsNotEmpty()` para name, surnames, documentNumber, email
  - `@IsDateString()` para birthDate
  - `@IsEnum(DocumentType)` para documentType
  - `@IsEmail()` para email
  - `@IsOptional()` para phone, address, postalCode, city
  - `@IsUUID()` para memberTypeId
- **`SimpleRegistrationResponseDto`**: DTO de salida: `memberId`, `memberNumber`, `status`, `memberTypeName`, `registrationDate`, `registrationCharge: { chargeId, amount, description, status } | null`
- **`DniCheckResponseDto`**: DTO de salida: `exists`, `memberName`, `memberNumber`
- **`PreconditionsResponseDto`**: DTO de salida: `hasFiscalYear`, `hasMemberTypes`, `hasRegistrationPlan`, `errors`

### Paso 4: Capa de aplicación - Handlers

**`SimpleRegistrationHandler`:**

1. Verificar precondiciones:
   a. Existe ejercicio activo abierto (FE-5)
   - Si no → error 412 "No hay ejercicio abierto. Abra el ejercicio actual primero"
     b. Existe plan de inscripción tipo UNICA activo (FE-4)
   - Si no → error 412 "Debe configurar un plan de cuota de inscripción"
2. Validar que el DNI no existe en el tenant (`memberRepository.existsByIdentityDocument(document)`)
   - Si existe → error 409 "Ya existe un socio con DNI {number}: {name} (nº {memberNumber}). ¿Es una reactivación?" (FE-1)
3. Validar que el email no está en uso
   - Si existe → advertencia 200 con warning (no bloquea, puede ser email familiar compartido) (FE-2)
4. Validar que el tipo de socio existe y está activo
5. Validar compatibilidad de edad con el tipo de socio usando `MemberTypeRulesEvaluator.evaluateAgeEligibility()`
   - Si no compatible → error 422 "El aspirante tiene X años, pero '{typeName}' requiere {ageRange}" (FE-3)
6. **Iniciar transacción Prisma:**
   a. Obtener siguiente número de socio (`memberRepository.getNextMemberNumber()`)
   b. Crear Aggregate `Member` via `Member.register(props)` con estado ACTIVE
   c. Guardar Member via `memberRepository.save(member)` (incluye StatusHistory)
   d. Crear artefactos de BC-Treasury via `registrationChargePort.createRegistrationArtifacts()`:
   - Crear `MemberAccount` (si no existe)
   - Crear `FeeSubscription` con plan UNICA
   - Crear `Charge` con importe del plan (con descuento por tipo si aplica)
   - Cerrar suscripción inmediatamente con `cancelReason = ONE_TIME_COMPLETED`
     e. Registrar evento `MemberRegistered` en Outbox
     f. Commit de transacción
7. Retornar `SimpleRegistrationResponseDto`

**En caso de fallo:**

- Rollback automático de transacción Prisma
- Reportar excepción vía `ErrorReporter.captureException()` con contexto del paso fallido

**`CheckDniHandler`:**

1. Crear Value Object `IdentityDocument` con validación de formato (DNI/NIE)
   - Si formato inválido → error 422 "Formato de DNI/NIE inválido"
2. Buscar socio por documento (`memberRepository.findByIdentityDocument(document)`)
3. Si existe → retornar `{ exists: true, memberName: member.fullName, memberNumber: member.memberNumber }`
4. Si no existe → retornar `{ exists: false }`

**`ValidatePreconditionsHandler`:**

1. Verificar ejercicio activo: consultar `FiscalYear` en estado OPEN
2. Verificar tipos de socio: consultar `MemberType` activos (count > 0)
3. Verificar plan de inscripción: consultar `FeePlan` tipo UNICA activo
4. Retornar resultado con cada precondición y lista de errores descriptivos

### Paso 5: Capa de infraestructura - Port Adapter para BC-Treasury

Crear en `api/src/membership/infrastructure/ports/`:

- **`PrismaRegistrationChargeAdapter`**: Implementa `RegistrationChargePort`. Ejecuta dentro de la transacción Prisma proporcionada:
  - `createRegistrationArtifacts()`:
    1. Buscar `FeePlan` tipo UNICA activo
    2. Obtener descuento por tipo de socio (del `MemberType`)
    3. Calcular `effectiveAmount = plan.amount * (1 - typeDiscount)` en centavos
    4. INSERT `MemberAccount` con `member_id`
    5. INSERT `FeeSubscription` con `fee_plan_id`, `registration_date = now()`, `leave_date = now()`, `cancel_reason = 'ONE_TIME_COMPLETED'`, `effective_amount`
    6. INSERT `Charge` con `subscription_id`, `final_amount = effectiveAmount`, `billing_year`, `status = 'PENDING'`, `issue_date = now()`, `due_date = now()`
    7. Retornar IDs y datos del cargo creado
  - `findRegistrationPlan()`: Consulta `FeePlan` tipo UNICA activo en BD del tenant via `PrismaTenantService`
  - **NO importa repositorios de BC-Treasury.** Usa `PrismaTenantService.getClient(tenantId)` directamente para las queries

### Paso 6: Capa de infraestructura - Controller

Crear en `api/src/membership/infrastructure/controllers/registration.controller.ts`:

| Endpoint                              | Método | Auth | Permiso                     | Body/Params             | Response                                        |
| ------------------------------------- | ------ | ---- | --------------------------- | ----------------------- | ----------------------------------------------- |
| `/api/v1/members/simple-registration` | POST   | JWT  | `membership:members:create` | `SimpleRegistrationDto` | 201 Created con `SimpleRegistrationResponseDto` |
| `/api/v1/members/check-dni/:dni`      | GET    | JWT  | `membership:members:read`   | Param: `dni`            | 200 con `DniCheckResponseDto`                   |
| `/api/v1/members/preconditions`       | GET    | JWT  | `membership:members:create` | -                       | 200 con `PreconditionsResponseDto`              |

- Swagger decorators para documentación automática
- Errores: 409 Conflict (DNI duplicado), 412 Precondition Failed (sin ejercicio/sin plan), 422 Unprocessable Entity (edad incompatible, DNI inválido)

### Paso 7: Tests

**Tests unitarios (dominio):**

- `MemberRegistrationService` (interfaz mockeable para tests de integración)

**Tests unitarios (aplicación):**

- `SimpleRegistrationHandler` con mocks de `MemberRepository`, `MemberTypeRepository`, `FiscalYearRepository`, `RegistrationChargePort`:
  - Caso éxito: socio creado con número asignado, cargo de inscripción generado, suscripción cerrada con `ONE_TIME_COMPLETED`, evento `MemberRegistered` publicado
  - Caso DNI duplicado: rechazo con 409 y datos del socio existente
  - Caso edad incompatible: rechazo con 422 y sugerencia de tipo compatible
  - Caso sin ejercicio abierto: rechazo con 412
  - Caso sin plan de inscripción UNICA: rechazo con 412
  - Caso email duplicado: warning pero continúa (no bloquea)
  - Caso con descuento por tipo: cargo de inscripción con effectiveAmount calculado correctamente
- `CheckDniHandler`:
  - Caso DNI existe: retorna datos del socio
  - Caso DNI no existe: retorna `{ exists: false }`
  - Caso DNI formato inválido: error 422
- `ValidatePreconditionsHandler`:
  - Caso todas las precondiciones OK: retorna sin errores
  - Caso sin ejercicio: retorna error específico
  - Caso sin tipos de socio: retorna error específico
  - Caso sin plan UNICA: retorna error específico

**Tests de integración:**

- Alta simple completa contra BD real (Testcontainers):
  - Crear socio con datos completos → verificar Member persistido con estado ACTIVE
  - Verificar MemberAccount creado en BD
  - Verificar FeeSubscription creada y cerrada con `ONE_TIME_COMPLETED`
  - Verificar Charge creado en estado PENDING con importe correcto
  - Verificar número de socio asignado correctamente (secuencial)
  - Verificar evento `MemberRegistered` en outbox
- Transacción atómica:
  - Simular fallo en creación de cargo → verificar que Member NO se creó (rollback)
  - Simular fallo en Member → verificar que MemberAccount NO se creó (rollback)
- Validaciones:
  - Alta con DNI duplicado → verificar rechazo 409
  - Alta sin ejercicio abierto → verificar rechazo 412
  - Alta con tipo de socio incompatible por edad → verificar rechazo 422
- Concurrencia:
  - 2 altas simultáneas → verificar números de socio distintos (sin duplicados)
- Verificar endpoint `check-dni`:
  - DNI existente → `{ exists: true, memberName, memberNumber }`
  - DNI nuevo → `{ exists: false }`

## Criterios de aceptación

Derivados de US-028:

1. **Alta simple en 3 pasos (US-028, escenario 1):** Al ejecutar el endpoint de alta simple con datos personales completos y tipo de socio válido, se crea el socio en estado ACTIVE con número asignado, cargo de inscripción generado y suscripción UNICA cerrada. Todo en una transacción atómica.

2. **DNI único verificado (FE-1):** Al intentar alta con DNI ya existente en el tenant, el endpoint retorna 409 con nombre y número del socio existente, sugiriendo rehabilitación.

3. **Edad compatible con tipo de socio (FE-3):** Al intentar alta con tipo de socio cuyo rango de edad no incluye la edad del aspirante, el endpoint retorna 422 con mensaje descriptivo incluyendo la edad del aspirante y el rango requerido.

4. **Cargo de inscripción generado (UC-011, paso 3):** Al completar el alta, se genera un cargo de inscripción con el importe del plan UNICA (con descuento por tipo si aplica), en estado PENDING. La suscripción se cierra inmediatamente con motivo `ONE_TIME_COMPLETED`.

5. **Precondición de ejercicio abierto (FE-5):** Si no hay ejercicio activo abierto, el endpoint retorna 412 con mensaje descriptivo.

6. **Precondición de plan de inscripción (FE-4):** Si no hay plan de cuota tipo UNICA activo, el endpoint retorna 412 con mensaje descriptivo.

7. **Número de socio secuencial (UC-011):** El número de socio se asigna automáticamente como siguiente en la secuencia del tenant. No hay duplicados incluso bajo concurrencia.

8. **Evento MemberRegistered emitido:** Al completar el alta, se registra el evento `MemberRegistered` en outbox con payload completo (memberId, memberTypeId, registrationChargeId, registrationDate) para consumidores cross-BC.

9. **Transacción atómica (RNFT-037):** Si falla cualquier paso (Member, MemberAccount, FeeSubscription, Charge), toda la operación se revierte. No se crean artefactos parciales.
