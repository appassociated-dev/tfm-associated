# Task 2 — UC-002: Autenticación multi-tenant (Backend)

## Información general

- **Fase:** 1
- **Tipo:** Backend
- **UC:** UC-002
- **Bounded Context:** BC-Identity
- **Application Service:** `AuthenticationService`
- **Aggregates:** `User`, `TenantMembership`, `Tenant`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `User` completo (dominio) con lógica de autenticación, bloqueo de cuenta y tracking de intentos
- Value Objects: `Credenciales` (email, passwordHash), `TokenRecuperacion`
- Application Service `AuthenticationService` con flujos: login, refresh token, logout, switch tenant
- Estrategia JWT con Passport (`@nestjs/passport`, `passport-jwt`)
- Generación de Access Token JWT (15 min) con claims: `sub`, `tenant_id`, `rol`, `permissions`
- Generación y almacenamiento de Refresh Token (30 días)
- Bloqueo temporal de cuenta tras 5 intentos fallidos en 10 minutos (15 min de bloqueo)
- Guards globales: `JwtAuthGuard`, `PermissionsGuard`
- Decorator `@RequirePermissions('module:resource:action')`
- Domain Events: `UserAuthenticated`, `AuthenticationFailed`, `UserBlocked`
- Endpoints REST:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/switch-tenant`
  - `GET /api/v1/auth/me`
- Tests unitarios (dominio + aplicación) + tests de integración (endpoints)

### Excluido

- Magic link por email (RNF-001 lo soporta pero no es MVP Fase 1)
- OAuth2 con Google/Microsoft (futuro)
- UI de login (se implementa en task frontend UC-002)
- Recuperación de contraseña (diferida a post-MVP)
- Rate limiting avanzado por IP (simplificado con bloqueo por cuenta)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Guards base (`jwt-auth.guard.ts`, `permissions.guard.ts`), PrismaMainService, middleware tenant, esquema de respuesta API |
| **F1-Back Task 1 — UC-001** | Aggregate `Tenant` (dominio), tabla `tenants` con datos, tabla `users` con admin creado, tabla `roles` con permisos seedeados, tabla `tenant_memberships`, tabla `refresh_tokens`, `DatabaseProvisioningService` (para tests de integración que necesiten un tenant provisionado) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/identity/domain/aggregates/tenant.ts` existe y el Aggregate `Tenant` está implementado
- [ ] `api/prisma/main/schema.prisma` contiene modelos `User`, `Tenant`, `TenantMembership`, `Role`, `RefreshToken`
- [ ] Las migrations de DB-Main están aplicadas y las tablas existen
- [ ] El endpoint `POST /api/v1/tenants` funciona y crea un tenant con admin, roles y BD aislada
- [ ] Los roles predefinidos (`PRESIDENT`, `SECRETARY`, `TREASURER`, `BOARD_MEMBER`, `MEMBER`) existen con sus permisos en la BD de tenant
- [ ] El password del admin creado por UC-001 está hasheado con Argon2
- [ ] `api/src/shared/infrastructure/guards/jwt-auth.guard.ts` existe (puede estar como stub)
- [ ] `api/src/shared/infrastructure/guards/permissions.guard.ts` existe (puede estar como stub)
- [ ] `api/src/shared/domain/ports/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Aggregate `User` completo (dominio) | UC-004 (roles), UC-006/UC-011 (relación con Member) |
| `JwtAuthGuard` funcional | Todos los endpoints protegidos del sistema |
| `PermissionsGuard` + `@RequirePermissions()` | Todos los endpoints con control de acceso |
| JWT Strategy (Passport) | Todas las peticiones autenticadas |
| `TenantMiddleware` integrado con JWT | Todos los módulos que acceden a BD de tenant |
| Endpoints de auth (`/auth/*`) | Frontend UC-002 (login, refresh, logout, switch) |
| Interceptor de extracción de `tenantId` del JWT | PrismaTenantService (routing de conexión) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-002.md` | Flujo completo de autenticación, selector de tenant, switch sin re-login |
| `us/us-002.md` | Criterios de aceptación Gherkin (3 escenarios: multi-tenant, switch, roles independientes) |
| `bc/bc-identity.md` | Aggregates User, TenantMembership — estructura y invariantes |
| `adr/adr-006.md` | JWT con refresh tokens, claims, flujo de autenticación |
| `adr/adr-007.md` | RBAC con permisos granulares `{module}:{resource}:{action}` |
| `rnf/rnf-001.md` | Política de complejidad de password (8+ chars, mayúsculas, minúsculas, números) |
| `rnf/rnf-002.md` | Gestión de sesiones: expiración 30 min inactividad, 24h absoluta |
| `rnf/rnf-006.md` | Contraseñas con Argon2, datos sensibles cifrados |
| `rnf/rnf-007.md` | Auditoría de acciones críticas (login, intentos fallidos) |

## Puntos críticos

1. **Claims del JWT y su relación con el routing multi-tenant.** El `tenant_id` en el JWT determina a qué BD se conecta cada petición. Si el token es robado, el atacante accede a los datos del tenant. Mitigación: expiración corta (15 min), refresh token con rotación, HTTPS obligatorio (RNF-005).

2. **Bloqueo de cuenta: ventana temporal, no acumulativo absoluto.** El spec define "5 intentos fallidos en 10 minutos". Esto requiere tracking de timestamps de intentos, no solo un contador. Si pasan 10 minutos entre intentos, el contador se reinicia. Implementar con array de timestamps o ventana deslizante.

3. **Switch de tenant sin re-login.** El flujo FA-2 permite cambiar de tenant sin volver a introducir credenciales. Esto implica generar un nuevo Access Token con el nuevo `tenant_id` y `rol` correspondiente. El Refresh Token es global (no por tenant). Validar que el usuario pertenece al nuevo tenant antes de emitir.

4. **Permisos en el JWT vs permisos en BD.** Los permisos se incluyen en los claims del JWT. Si los permisos cambian (UC-004), los tokens existentes siguen teniendo los permisos antiguos hasta que expiren. Para el MVP (15 min de vida), esto es aceptable. En producción, considerar invalidación activa.

5. **Separación entre autenticación (DB-Main) y autorización (DB-Tenant).** El login consulta DB-Main (users, tenant_memberships). Tras emitir el JWT, todas las peticiones usan la BD del tenant. El `PermissionsGuard` verifica permisos desde los claims del JWT, no desde la BD.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| JWT secret comprometido invalida toda la seguridad | Baja | Crítico | Usar variable de entorno, rotar periódicamente, RS256 si posible |
| Argon2 demasiado lento en tests (hashing costoso) | Alta | Bajo | Reducir parámetros de Argon2 en entorno de test |
| Race condition en contador de intentos fallidos | Baja | Bajo | Usar UPDATE atómico con condición en PostgreSQL |
| Refresh token filtrado permite acceso indefinido | Baja | Alto | Rotación: al usar refresh token, invalidar el anterior y generar uno nuevo |

## Plan de implementación

### Paso 1: Capa de dominio — Value Objects

Crear en `api/src/identity/domain/value-objects/`:

- **`UserId`**: Extiende `Identifier`. UUID v4
- **`Email`**: Value Object con validación de formato email. Método factory `create(value: string): Result<Email, EmailInvalidError>`. Almacena normalizado (lowercase, trim)
- **`PasswordHash`**: Value Object opaco que encapsula el hash. No expone el valor en serialización. Método estático `fromHash(hash: string): PasswordHash`
- **`Password`**: Value Object de transición (no se persiste). Valida política de complejidad: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número. Método `hashWith(hasher: PasswordHasher): Promise<PasswordHash>`
- **`UserStatus`**: Enum VO con valores `ACTIVE`, `BLOCKED`, `INACTIVE`

Tests unitarios: validación de email (válido, inválido, normalización), validación de password (cumple/no cumple política), PasswordHash no expone valor.

### Paso 2: Capa de dominio — Aggregate User

Crear en `api/src/identity/domain/aggregates/user.ts`:

- Propiedades:
  - `id: UserId`
  - `email: Email`
  - `passwordHash: PasswordHash`
  - `name: string`
  - `status: UserStatus`
  - `failedAttempts: number`
  - `failedAttemptTimestamps: Date[]` (para ventana deslizante de 10 min)
  - `blockedUntil: Date | null`
  - `createdAt: Date`
  - `lastAccess: Date | null`
- Métodos de negocio:
  - `authenticate(passwordHash: string, hasher: PasswordHasher): Result<void, AuthError>`: Verifica hash, actualiza `lastAccess`, limpia intentos fallidos, emite `UserAuthenticated`
  - `recordFailedAttempt(): void`: Añade timestamp actual. Si hay ≥ 5 en ventana de 10 min → bloquea 15 min, emite `UserBlocked`
  - `isBlocked(): boolean`: Verifica si `blockedUntil > now()`
  - `unblock(): void`: Limpia bloqueo si ha expirado
- Invariantes:
  - Email único global (verificado en capa de aplicación)
  - Password cumple política de complejidad (verificado en creación)

Tests unitarios: autenticación exitosa, autenticación fallida con incremento de intentos, bloqueo tras 5 intentos en ventana de 10 min, desbloqueo tras expiración, intentos fuera de ventana no bloquean.

### Paso 3: Capa de dominio — Domain Events

Crear en `api/src/identity/domain/events/`:

- **`UserAuthenticatedEvent`**: Payload: `{ userId, tenantId, email, rol, ipAddress, userAgent, timestamp }`
- **`AuthenticationFailedEvent`**: Payload: `{ email, ipAddress, timestamp, attemptCount }`
- **`UserBlockedEvent`**: Payload: `{ userId, email, blockReason, blockDuration, timestamp }`

### Paso 4: Capa de dominio — Interfaces

Crear en `api/src/identity/domain/repositories/`:

- **`UserRepository`** (interfaz):
  - `findByEmail(email: Email): Promise<User | null>`
  - `findById(id: UserId): Promise<User | null>`
  - `save(user: User): Promise<void>`

Crear en `api/src/identity/domain/services/`:

- **`PasswordHasher`** (interfaz/port):
  - `hash(password: string): Promise<string>`
  - `verify(password: string, hash: string): Promise<boolean>`

- **`TokenService`** (interfaz/port):
  - `generateAccessToken(payload: JwtPayload): string`
  - `generateRefreshToken(): string`
  - `verifyAccessToken(token: string): JwtPayload`

### Paso 5: Capa de aplicación — Commands y Queries

Crear en `api/src/identity/application/`:

**Commands:**
- **`LoginCommand`**: `{ email, password, ipAddress, userAgent }`
- **`RefreshTokenCommand`**: `{ refreshToken }`
- **`LogoutCommand`**: `{ userId, refreshToken }`
- **`SwitchTenantCommand`**: `{ userId, newTenantId }`

**Queries:**
- **`GetCurrentUserQuery`**: `{ userId, tenantId }`

**DTOs:**
- **`LoginRequestDto`**: `email` (@IsEmail), `password` (@IsNotEmpty)
- **`LoginResponseDto`**: `accessToken`, `refreshToken`, `expiresIn`, `user: { id, email, name }`, `tenant: { id, name, slug }`, `role: string`
- **`RefreshResponseDto`**: `accessToken`, `refreshToken`, `expiresIn`
- **`TenantSelectorDto`**: `tenants: Array<{ id, name, slug, role }>`
- **`UserProfileDto`**: `id`, `email`, `name`, `currentTenant`, `role`, `permissions`

### Paso 6: Capa de aplicación — AuthenticationService (Handlers)

**`LoginHandler`:**

1. Buscar usuario por email en DB-Main (`userRepository.findByEmail`)
2. Si no existe → emitir `AuthenticationFailed`, retornar error 401
3. Verificar si cuenta está bloqueada (`user.isBlocked()`)
   - Si bloqueada → retornar error 403 con tiempo restante
4. Verificar password con Argon2 (`user.authenticate(password, hasher)`)
   - Si falla → `user.recordFailedAttempt()`, guardar, emitir `AuthenticationFailed`
   - Si se bloquea → emitir `UserBlocked`
   - Retornar error 401
5. Recuperar `TenantMembership[]` del usuario (DB-Main)
6. Si múltiples tenants → retornar `TenantSelectorDto` con status 200 y flag `requiresTenantSelection: true`
7. Si un solo tenant → continuar al paso 8
8. Generar Access Token JWT (15 min) con claims del tenant seleccionado
9. Generar Refresh Token (UUID), hashear, almacenar en tabla `refresh_tokens` con expiración 30 días
10. Emitir `UserAuthenticated` via Outbox
11. Retornar `LoginResponseDto`

**`RefreshTokenHandler`:**

1. Buscar refresh token en DB-Main por hash
2. Verificar que no está revocado y no ha expirado
3. Revocar el refresh token actual (rotación)
4. Generar nuevo Access Token con mismos claims
5. Generar nuevo Refresh Token, almacenar
6. Retornar `RefreshResponseDto`

**`LogoutHandler`:**

1. Revocar refresh token actual
2. (Opcional) Registrar logout en auditoría

**`SwitchTenantHandler`:**

1. Verificar que el usuario pertenece al nuevo tenant (`TenantMembership`)
2. Obtener rol y permisos del usuario en el nuevo tenant
3. Generar nuevo Access Token con `tenant_id` y `rol` del nuevo tenant
4. Retornar `LoginResponseDto` con datos del nuevo tenant

### Paso 7: Capa de infraestructura — Implementaciones

Crear en `api/src/identity/infrastructure/`:

- **`Argon2PasswordHasher`**: Implementa `PasswordHasher` usando librería `argon2`
- **`JwtTokenService`**: Implementa `TokenService` usando `@nestjs/jwt`. Configura secret desde variable de entorno, expiración 15 min
- **`PrismaUserRepository`**: Implementa `UserRepository` usando `PrismaMainService`. Incluye mappers dominio↔persistencia
- **`PrismaRefreshTokenRepository`**: CRUD de refresh tokens en DB-Main

### Paso 8: Capa de infraestructura — JWT Strategy y Guards

Crear en `api/src/identity/infrastructure/auth/`:

- **`JwtStrategy`** (Passport): Extrae y valida JWT de header `Authorization: Bearer`. Inyecta `user` y `tenantId` en el request
- **`JwtAuthGuard`** (completar el stub del scaffold): Guard global que protege todos los endpoints excepto los marcados con `@Public()`
- **`PermissionsGuard`** (completar el stub): Lee `@RequirePermissions()` del handler, verifica contra `permissions[]` del JWT. Denegación por defecto (ADR-007)
- **`@Public()`** decorator: Marca endpoints que no requieren autenticación (login, refresh)
- **`@RequirePermissions()`** decorator: Especifica permisos necesarios para el endpoint

Integración con TenantMiddleware:
- Tras validar JWT, extraer `tenant_id` de los claims
- Setear `req.tenantId` para que `PrismaTenantService` enrute a la BD correcta

### Paso 9: Capa de infraestructura — Controller

Crear en `api/src/identity/infrastructure/controllers/auth.controller.ts`:

| Endpoint | Método | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/api/v1/auth/login` | POST | @Public | `LoginRequestDto` | `LoginResponseDto` (200/401/403) |
| `/api/v1/auth/refresh` | POST | @Public | `{ refreshToken }` | `RefreshResponseDto` (200/401) |
| `/api/v1/auth/logout` | POST | JWT | `{ refreshToken }` | 204 No Content |
| `/api/v1/auth/switch-tenant` | POST | JWT | `{ tenantId }` | `LoginResponseDto` (200/403) |
| `/api/v1/auth/me` | GET | JWT | — | `UserProfileDto` (200) |

- Swagger decorators para documentación automática
- Extraer `ipAddress` y `userAgent` del request para eventos de auditoría

### Paso 10: Tests

**Tests unitarios (dominio):**
- `User.authenticate()`: éxito, fallo, bloqueo tras 5 intentos en ventana, desbloqueo automático
- `Email.create()`: formatos válidos e inválidos, normalización
- `Password`: política de complejidad (corto, sin mayúscula, sin número, válido)

**Tests unitarios (aplicación):**
- `LoginHandler`: flujo completo con mocks
  - Login exitoso con 1 tenant → tokens emitidos
  - Login exitoso con múltiples tenants → selector retornado
  - Credenciales inválidas → 401 + intento registrado
  - Cuenta bloqueada → 403 con tiempo restante
- `RefreshTokenHandler`: token válido, token expirado, token revocado
- `SwitchTenantHandler`: tenant válido, tenant sin pertenencia → 403

**Tests de integración:**
- Endpoint `POST /auth/login` contra BD real (Testcontainers)
  - Login con admin creado por UC-001 → JWT válido
  - Verificar que JWT contiene claims correctos (sub, tenant_id, rol, permissions)
  - Verificar bloqueo tras 5 intentos fallidos
- Endpoint `POST /auth/refresh` → nuevo access token
- Endpoint `POST /auth/switch-tenant` → JWT con nuevo tenant_id
- Endpoint `GET /auth/me` → perfil del usuario con permisos

## Criterios de aceptación

Derivados de US-002:

1. **Login con acceso a múltiples tenants:** Un usuario registrado en varias colectividades se autentica y ve un selector con las colectividades a las que pertenece, cada una mostrando su rol específico.

2. **Cambio de contexto sin re-login:** Un usuario autenticado en un tenant puede cambiar a otro tenant sin introducir credenciales de nuevo. El sistema cambia el contexto y carga los permisos del nuevo rol.

3. **Roles independientes por tenant:** Un usuario que es Tesorero en "Peña A" y Socio en "Cofradía B" tiene permisos de gestión económica en la primera y solo lectura en la segunda.

4. **Bloqueo por intentos fallidos:** Tras 5 intentos fallidos en 10 minutos, la cuenta se bloquea temporalmente durante 15 minutos.

5. **JWT con claims correctos:** El Access Token contiene `sub`, `tenant_id`, `rol` y `permissions`, y tiene una expiración de 15 minutos.

6. **Refresh Token con rotación:** Al usar un refresh token, se invalida el anterior y se genera uno nuevo. Expiración de 30 días.
