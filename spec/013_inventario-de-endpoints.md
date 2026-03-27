# Inventario de Endpoints

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Versión:** 1.0
**Fecha:** Marzo 2026
**Inputs:** KB-010 (Casos de Uso), KB-012 (Modelo de Datos), KB-006 (ADRs)
**Total Endpoints:** 123

---

## Índice

1. [Convenciones](#1-convenciones)
2. [BC-Identity](#2-bc-identity)
3. [BC-Membership](#3-bc-membership)
4. [BC-Treasury](#4-bc-treasury)
5. [BC-Events](#5-bc-events)
6. [BC-Communication](#6-bc-communication)
7. [BC-Documents](#7-bc-documents)
8. [Transversal](#8-transversal)
9. [Trazabilidad](#9-trazabilidad)

---

## 1. Convenciones

### 1.1 Prefijo y versionado

- **Prefijo global:** `/api` - configurado en `main.ts` via `app.setGlobalPrefix('api')`
- **Versionado:** `/api/v1/` - todas las rutas incluyen versión explícita en el path

### 1.2 Autenticación

- **Mecanismo base:** JWT Bearer via header `Authorization: Bearer {token}` (JwtAuthGuard global, ADR-006)
- **Endpoints públicos:** decorador `@Public()` exime de autenticación; sin este decorador, todos los endpoints requieren JWT válido
- **Multi-tenant:** el tenant se extrae del JWT por `TenantMiddleware` y queda disponible en `req.tenantId`. No se requiere header `X-Tenant-Id`

### 1.3 Autorización (RBAC)

- Decorador `@RequirePermissions('recurso:accion')` + `PermissionsGuard` (ADR-007)
- Permisos codificados en formato `recurso:accion` (ej: `treasury:fees:write`, `identity:roles:manage`)
- Los permisos resueltos se incluyen en los claims del JWT y se cachean en Redis

### 1.4 Formato de errores

Todos los errores siguen el esquema estándar de NestJS:

```json
{
  "statusCode": 422,
  "message": ["campo: mensaje de error"],
  "error": "Unprocessable Entity"
}
```

### 1.5 Paginación

Endpoints que retornan colecciones aceptan parámetros de query `?page=1&limit=20` y responden con:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 1.6 Convenciones de rutas e identificadores

- **Kebab-case** para recursos compuestos: `/member-types`, `/fee-plans`, `/fiscal-years`
- **IDs:** UUID v4 en parámetros de ruta (`:id`, `:accountId`, `:memberId`)
- **Content-Type:** `application/json` por defecto en todas las peticiones con body

### 1.7 Documentación interactiva

- **Swagger UI:** disponible en `GET /api/docs` (generado con `@nestjs/swagger`)

---

## 2. BC-Identity

BC responsable de la gestión de tenants, usuarios, autenticación y control de acceso basado en roles.

**Entidades involucradas:**

- ENT-001: Tenant
- ENT-002: User
- ENT-003: TenantMembership
- ENT-004: Role

**Casos de uso cubiertos:**

- UC-001 (Provisión de tenant) - Implementado Fase 1
- UC-002 (Autenticación multi-tenant) - Implementado Fase 1
- UC-003 (Gestión de usuarios del tenant) - Implementado Fase 1
- UC-004 (Gestión de roles y permisos) - Pendiente Fase 2

---

### EP-001: GET /api/v1/health

**Método:** `GET`
**Ruta:** `/api/v1/health`
**Autenticación:** Public
**Permisos:** N/A
**Caso de Uso:** N/A (infraestructura - monitoreo Docker/nginx)
**Entidades:** N/A

#### Request Body

N/A

#### Response 200

| Campo   | Tipo     | Descripción                                 |
| ------- | -------- | ------------------------------------------- |
| status  | `string` | Estado global de salud (`"ok"` o `"error"`) |
| info    | `object` | Detalles de cada indicador saludable        |
| error   | `object` | Detalles de cada indicador fallido          |
| details | `object` | Mapa completo de todos los indicadores      |

#### Errores

| Status | Código | Condición                     |
| ------ | ------ | ----------------------------- |
| 503    | -      | BD principal sin conectividad |

---

### EP-002: POST /api/v1/tenants

**Método:** `POST`
**Ruta:** `/api/v1/tenants`
**Autenticación:** Public + `X-Api-Key` header (SuperadminGuard)
**Permisos:** API Key estático vía header `X-Api-Key` (operación de bootstrap)
**Caso de Uso:** UC-001 (Provisión de tenant)
**Entidades:** ENT-001, ENT-002

#### Request Body

| Campo            | Tipo            | Requerido | Validación                                                     | Descripción                                        |
| ---------------- | --------------- | --------- | -------------------------------------------------------------- | -------------------------------------------------- |
| name             | `string`        | Sí        | `@IsNotEmpty`                                                  | Nombre de la colectividad                          |
| collectivityType | `string` (enum) | Sí        | `@IsEnum(PENA, COFRADIA, CLUB_DEPORTIVO, ASOCIACION_CULTURAL)` | Tipo de colectividad                               |
| cif              | `string`        | Sí        | `@IsNotEmpty`                                                  | CIF de la colectividad                             |
| contactEmail     | `string`        | Sí        | `@IsEmail`                                                     | Email de contacto                                  |
| adminName        | `string`        | Sí        | `@IsNotEmpty`                                                  | Nombre del administrador inicial                   |
| adminEmail       | `string`        | Sí        | `@IsEmail`                                                     | Email del administrador inicial                    |
| adminPassword    | `string`        | Sí        | `@MinLength(8)`                                                | Contraseña del administrador (mínimo 8 caracteres) |

#### Response 201

| Campo       | Tipo            | Descripción                           |
| ----------- | --------------- | ------------------------------------- |
| tenantId    | `string` (UUID) | ID del tenant creado                  |
| slug        | `string`        | Slug del tenant (derivado del nombre) |
| adminUserId | `string` (UUID) | ID del usuario administrador creado   |

#### Errores

| Status | Código | Condición                    |
| ------ | ------ | ---------------------------- |
| 409    | -      | CIF ya existe en otro tenant |
| 422    | -      | Datos de entrada inválidos   |

---

### EP-003: POST /api/v1/auth/login

**Método:** `POST`
**Ruta:** `/api/v1/auth/login`
**Autenticación:** Public
**Permisos:** N/A
**Caso de Uso:** UC-002 (Autenticación multi-tenant)
**Entidades:** ENT-002, ENT-003

#### Request Body

| Campo    | Tipo     | Requerido | Validación                     | Descripción            |
| -------- | -------- | --------- | ------------------------------ | ---------------------- |
| email    | `string` | Sí        | `@IsEmail`, `@IsNotEmpty`      | Email del usuario      |
| password | `string` | Sí        | `@IsNotEmpty`, `@MinLength(1)` | Contraseña del usuario |

#### Response 200

| Campo        | Tipo            | Descripción                                       |
| ------------ | --------------- | ------------------------------------------------- |
| accessToken  | `string`        | Token de acceso JWT                               |
| refreshToken | `string`        | Token de refresco                                 |
| expiresIn    | `number`        | Tiempo de expiración del access token en segundos |
| user.id      | `string` (UUID) | ID del usuario                                    |
| user.email   | `string`        | Email del usuario                                 |
| user.name    | `string`        | Nombre del usuario                                |
| tenant.id    | `string` (UUID) | ID del tenant activo                              |
| tenant.name  | `string`        | Nombre del tenant activo                          |
| tenant.slug  | `string`        | Slug del tenant activo                            |
| role         | `string`        | Rol del usuario en el tenant activo               |

#### Errores

| Status | Código | Condición              |
| ------ | ------ | ---------------------- |
| 401    | -      | Credenciales inválidas |
| 403    | -      | Cuenta bloqueada       |

---

### EP-004: POST /api/v1/auth/refresh

**Método:** `POST`
**Ruta:** `/api/v1/auth/refresh`
**Autenticación:** Public
**Permisos:** N/A
**Caso de Uso:** UC-002 (Autenticación multi-tenant)
**Entidades:** ENT-002

#### Request Body

| Campo        | Tipo     | Requerido | Validación    | Descripción              |
| ------------ | -------- | --------- | ------------- | ------------------------ |
| refreshToken | `string` | Sí        | `@IsNotEmpty` | Token de refresco válido |

#### Response 200

| Campo        | Tipo     | Descripción                      |
| ------------ | -------- | -------------------------------- |
| accessToken  | `string` | Nuevo token de acceso JWT        |
| refreshToken | `string` | Nuevo token de refresco          |
| expiresIn    | `number` | Tiempo de expiración en segundos |

#### Errores

| Status | Código | Condición              |
| ------ | ------ | ---------------------- |
| 401    | -      | Refresh token inválido |

---

### EP-005: POST /api/v1/auth/logout

**Método:** `POST`
**Ruta:** `/api/v1/auth/logout`
**Autenticación:** JWT
**Permisos:** N/A (JWT-only)
**Caso de Uso:** UC-002 (Autenticación multi-tenant)
**Entidades:** ENT-002

#### Request Body

| Campo        | Tipo     | Requerido | Validación | Descripción                   |
| ------------ | -------- | --------- | ---------- | ----------------------------- |
| refreshToken | `string` | Sí        | -          | Token de refresco a invalidar |

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición               |
| ------ | ------ | ----------------------- |
| 401    | -      | JWT inválido o expirado |

---

### EP-006: POST /api/v1/auth/switch-tenant

**Método:** `POST`
**Ruta:** `/api/v1/auth/switch-tenant`
**Autenticación:** JWT
**Permisos:** N/A (JWT-only)
**Caso de Uso:** UC-002 (Autenticación multi-tenant)
**Entidades:** ENT-001, ENT-002, ENT-003

#### Request Body

| Campo    | Tipo            | Requerido | Validación                    | Descripción                  |
| -------- | --------------- | --------- | ----------------------------- | ---------------------------- |
| tenantId | `string` (UUID) | Sí        | `@IsUUID('4')`, `@IsNotEmpty` | ID del tenant al que cambiar |

#### Response 200

Mismo esquema que EP-003 (`LoginResponseDto`): `accessToken`, `refreshToken`, `expiresIn`, `user`, `tenant`, `role`.

#### Errores

| Status | Código | Condición                       |
| ------ | ------ | ------------------------------- |
| 403    | -      | Sin acceso al tenant solicitado |

---

### EP-007: GET /api/v1/auth/me

**Método:** `GET`
**Ruta:** `/api/v1/auth/me`
**Autenticación:** JWT
**Permisos:** N/A (JWT-only)
**Caso de Uso:** UC-002 (Autenticación multi-tenant)
**Entidades:** ENT-002, ENT-003

#### Request Body

N/A

#### Response 200

| Campo              | Tipo            | Descripción                         |
| ------------------ | --------------- | ----------------------------------- |
| id                 | `string` (UUID) | ID del usuario                      |
| email              | `string`        | Email del usuario                   |
| name               | `string`        | Nombre del usuario                  |
| currentTenant.id   | `string` (UUID) | ID del tenant activo                |
| currentTenant.name | `string`        | Nombre del tenant activo            |
| currentTenant.slug | `string`        | Slug del tenant activo              |
| role               | `string`        | Rol del usuario en el tenant activo |
| permissions        | `string[]`      | Permisos resueltos del usuario      |

#### Errores

| Status | Código | Condición               |
| ------ | ------ | ----------------------- |
| 401    | -      | JWT inválido o expirado |

---

### EP-064: GET /api/v1/roles

**Método:** `GET`
**Ruta:** `/api/v1/roles`
**Autenticación:** JWT
**Permisos:** `identity:roles:read`
**Caso de Uso:** UC-004 (Gestión de roles y permisos)
**Entidades:** ENT-004

#### Request Body

N/A

#### Response 200

| Campo              | Tipo            | Descripción                                               |
| ------------------ | --------------- | --------------------------------------------------------- |
| data               | `Role[]`        | Lista de roles del tenant (predefinidos y personalizados) |
| data[].id          | `string` (UUID) | ID del rol                                                |
| data[].name        | `string`        | Nombre del rol                                            |
| data[].description | `string`        | Descripción del rol                                       |
| data[].isSystem    | `boolean`       | `true` si es rol predefinido (no modificable)             |
| data[].permissions | `string[]`      | Lista de permisos asignados al rol                        |
| meta               | `object`        | Metadatos de paginación                                   |

#### Errores

| Status | Código | Condición                         |
| ------ | ------ | --------------------------------- |
| 401    | -      | JWT inválido o expirado           |
| 403    | -      | Sin permiso `identity:roles:read` |

---

### EP-065: POST /api/v1/roles

**Método:** `POST`
**Ruta:** `/api/v1/roles`
**Autenticación:** JWT
**Permisos:** `identity:roles:manage`
**Caso de Uso:** UC-004 (Gestión de roles y permisos)
**Entidades:** ENT-004

#### Request Body

| Campo       | Tipo       | Requerido | Validación                        | Descripción                          |
| ----------- | ---------- | --------- | --------------------------------- | ------------------------------------ |
| name        | `string`   | Sí        | `@IsNotEmpty`, único en el tenant | Nombre del rol personalizado         |
| description | `string`   | No        | `@IsString`                       | Descripción del propósito del rol    |
| permissions | `string[]` | Sí        | `@IsArray`, `@ArrayNotEmpty`      | Permisos en formato `recurso:accion` |

#### Response 201

| Campo       | Tipo            | Descripción                               |
| ----------- | --------------- | ----------------------------------------- |
| id          | `string` (UUID) | ID del rol creado                         |
| name        | `string`        | Nombre del rol                            |
| description | `string`        | Descripción del rol                       |
| isSystem    | `boolean`       | Siempre `false` para roles personalizados |
| permissions | `string[]`      | Permisos asignados                        |

#### Errores

| Status | Código | Condición                                    |
| ------ | ------ | -------------------------------------------- |
| 401    | -      | JWT inválido o expirado                      |
| 403    | -      | Sin permiso `identity:roles:manage`          |
| 409    | -      | Ya existe un rol con ese nombre en el tenant |
| 422    | -      | Datos de entrada inválidos                   |

---

### EP-066: GET /api/v1/roles/:id

**Método:** `GET`
**Ruta:** `/api/v1/roles/:id`
**Autenticación:** JWT
**Permisos:** `identity:roles:read`
**Caso de Uso:** UC-004 (Gestión de roles y permisos)
**Entidades:** ENT-004

#### Request Body

N/A

#### Response 200

| Campo       | Tipo            | Descripción                        |
| ----------- | --------------- | ---------------------------------- |
| id          | `string` (UUID) | ID del rol                         |
| name        | `string`        | Nombre del rol                     |
| description | `string`        | Descripción del rol                |
| isSystem    | `boolean`       | `true` si es rol predefinido       |
| permissions | `string[]`      | Lista completa de permisos del rol |

#### Errores

| Status | Código | Condición                         |
| ------ | ------ | --------------------------------- |
| 401    | -      | JWT inválido o expirado           |
| 403    | -      | Sin permiso `identity:roles:read` |
| 404    | -      | Rol no encontrado en el tenant    |

---

### EP-067: PATCH /api/v1/roles/:id

**Método:** `PATCH`
**Ruta:** `/api/v1/roles/:id`
**Autenticación:** JWT
**Permisos:** `identity:roles:manage`
**Caso de Uso:** UC-004 (Gestión de roles y permisos) - FA-1: Modificación de rol personalizado
**Entidades:** ENT-004

#### Request Body

| Campo       | Tipo       | Requerido | Validación                      | Descripción                      |
| ----------- | ---------- | --------- | ------------------------------- | -------------------------------- |
| name        | `string`   | No        | `@IsString`, único en el tenant | Nuevo nombre del rol             |
| description | `string`   | No        | `@IsString`                     | Nueva descripción                |
| permissions | `string[]` | No        | `@IsArray`                      | Nueva lista completa de permisos |

#### Response 200

| Campo       | Tipo            | Descripción                                                |
| ----------- | --------------- | ---------------------------------------------------------- |
| id          | `string` (UUID) | ID del rol                                                 |
| name        | `string`        | Nombre actualizado                                         |
| description | `string`        | Descripción actualizada                                    |
| isSystem    | `boolean`       | Siempre `false` (los roles de sistema no son modificables) |
| permissions | `string[]`      | Permisos actualizados                                      |

#### Errores

| Status | Código | Condición                                                                        |
| ------ | ------ | -------------------------------------------------------------------------------- |
| 401    | -      | JWT inválido o expirado                                                          |
| 403    | -      | Sin permiso `identity:roles:manage` o intento de modificar rol de sistema (FE-1) |
| 404    | -      | Rol no encontrado                                                                |
| 409    | -      | Nombre ya en uso por otro rol del tenant                                         |
| 422    | -      | Datos de entrada inválidos                                                       |

---

### EP-068: DELETE /api/v1/roles/:id

**Método:** `DELETE`
**Ruta:** `/api/v1/roles/:id`
**Autenticación:** JWT
**Permisos:** `identity:roles:manage`
**Caso de Uso:** UC-004 (Gestión de roles y permisos) - FE-2: Eliminación con usuarios asignados
**Entidades:** ENT-004, ENT-003

#### Request Body

N/A

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición                                                                |
| ------ | ------ | ------------------------------------------------------------------------ |
| 401    | -      | JWT inválido o expirado                                                  |
| 403    | -      | Sin permiso `identity:roles:manage` o intento de eliminar rol de sistema |
| 404    | -      | Rol no encontrado                                                        |
| 409    | -      | El rol tiene usuarios asignados - reasignarlos antes de eliminar (FE-2)  |

---

### EP-069: POST /api/v1/roles/:id/clone

**Método:** `POST`
**Ruta:** `/api/v1/roles/:id/clone`
**Autenticación:** JWT
**Permisos:** `identity:roles:manage`
**Caso de Uso:** UC-004 (Gestión de roles y permisos) - FA-2: Clonación de rol
**Entidades:** ENT-004

#### Request Body

| Campo       | Tipo     | Requerido | Validación                        | Descripción                  |
| ----------- | -------- | --------- | --------------------------------- | ---------------------------- |
| name        | `string` | Sí        | `@IsNotEmpty`, único en el tenant | Nombre del nuevo rol clonado |
| description | `string` | No        | `@IsString`                       | Descripción del rol clonado  |

#### Response 201

| Campo       | Tipo            | Descripción                       |
| ----------- | --------------- | --------------------------------- |
| id          | `string` (UUID) | ID del rol clonado                |
| name        | `string`        | Nombre del rol clonado            |
| description | `string`        | Descripción del rol clonado       |
| isSystem    | `boolean`       | Siempre `false`                   |
| permissions | `string[]`      | Permisos heredados del rol origen |

#### Errores

| Status | Código | Condición                                |
| ------ | ------ | ---------------------------------------- |
| 401    | -      | JWT inválido o expirado                  |
| 403    | -      | Sin permiso `identity:roles:manage`      |
| 404    | -      | Rol origen no encontrado                 |
| 409    | -      | Nombre ya en uso por otro rol del tenant |
| 422    | -      | Datos de entrada inválidos               |

---

### EP-070: POST /api/v1/users/:id/role

**Método:** `POST`
**Ruta:** `/api/v1/users/:id/role`
**Autenticación:** JWT
**Permisos:** `identity:roles:manage`
**Caso de Uso:** UC-004 (Gestión de roles y permisos) - Flujo Normal Parte 1: asignación de rol
**Entidades:** ENT-002, ENT-003, ENT-004

#### Request Body

| Campo  | Tipo            | Requerido | Validación                    | Descripción                     |
| ------ | --------------- | --------- | ----------------------------- | ------------------------------- |
| roleId | `string` (UUID) | Sí        | `@IsUUID('4')`, `@IsNotEmpty` | ID del rol a asignar al usuario |

#### Response 200

| Campo    | Tipo            | Descripción             |
| -------- | --------------- | ----------------------- |
| userId   | `string` (UUID) | ID del usuario          |
| roleId   | `string` (UUID) | ID del rol asignado     |
| roleName | `string`        | Nombre del rol asignado |

#### Errores

| Status | Código | Condición                                  |
| ------ | ------ | ------------------------------------------ |
| 401    | -      | JWT inválido o expirado                    |
| 403    | -      | Sin permiso `identity:roles:manage` (FE-3) |
| 404    | -      | Usuario o rol no encontrado                |
| 422    | -      | Datos de entrada inválidos                 |

---

---

## 3. BC-Membership

### EP-008: POST /api/v1/member-types

**Método:** `POST`
**Ruta:** `/api/v1/member-types`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:create`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Request Body

| Campo                       | Tipo           | Requerido | Validación                       | Descripción                                      |
| --------------------------- | -------------- | --------- | -------------------------------- | ------------------------------------------------ |
| code                        | `string`       | Sí        | `@IsNotEmpty`, `@MaxLength(10)`  | Código único (2-10 chars alfanuméricos)          |
| name                        | `string`       | Sí        | `@IsNotEmpty`, `@MaxLength(100)` | Nombre del tipo de socio                         |
| description                 | `string`       | No        | `@IsString`, `@IsOptional`       | Descripción                                      |
| ageRangeMin                 | `number\|null` | No        | `@IsInt`, `@Min(0)`              | Edad mínima permitida                            |
| ageRangeMax                 | `number\|null` | No        | `@IsInt`, `@Min(0)`              | Edad máxima permitida                            |
| votingRight                 | `boolean`      | Sí        | `@IsBoolean`                     | Derecho a voto                                   |
| eligibleForOffice           | `boolean`      | Sí        | `@IsBoolean`                     | Elegible para cargo directivo                    |
| minimumSeniorityForVoting   | `number`       | Sí        | `@IsInt`, `@Min(0)`              | Antigüedad mínima para votar (meses)             |
| minimumSeniorityForOffice   | `number`       | Sí        | `@IsInt`, `@Min(0)`              | Antigüedad mínima para cargo (meses)             |
| automaticTransitionTargetId | `string\|null` | No        | `@IsUUID('4')`                   | ID del tipo destino para transición automática   |
| rulesConfig                 | `object`       | Sí        | `@IsObject`                      | Configuración de reglas del tipo de colectividad |

#### Response 201

| Campo                       | Tipo            | Descripción                          |
| --------------------------- | --------------- | ------------------------------------ |
| id                          | `string` (UUID) | ID del tipo de socio                 |
| code                        | `string`        | Código único                         |
| name                        | `string`        | Nombre                               |
| description                 | `string`        | Descripción                          |
| ageRangeMin                 | `number\|null`  | Edad mínima                          |
| ageRangeMax                 | `number\|null`  | Edad máxima                          |
| votingRight                 | `boolean`       | Derecho a voto                       |
| eligibleForOffice           | `boolean`       | Elegible para cargo                  |
| minimumSeniorityForVoting   | `number`        | Antigüedad mínima para votar (meses) |
| minimumSeniorityForOffice   | `number`        | Antigüedad mínima para cargo (meses) |
| automaticTransitionTargetId | `string\|null`  | ID del tipo destino                  |
| rulesConfig                 | `object\|null`  | Configuración de reglas              |
| active                      | `boolean`       | Estado activo                        |
| createdAt                   | `Date`          | Fecha de creación                    |
| updatedAt                   | `Date`          | Fecha de última actualización        |

#### Errores

| Status | Código | Condición        |
| ------ | ------ | ---------------- |
| 409    | -      | Código ya existe |
| 422    | -      | Datos inválidos  |

---

### EP-009: GET /api/v1/member-types

**Método:** `GET`
**Ruta:** `/api/v1/member-types`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:read`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Request Body

N/A

#### Response 200

Array de `MemberTypeResponseDto` (ver EP-008).

#### Query Parameters

| Campo  | Tipo      | Requerido | Descripción                                |
| ------ | --------- | --------- | ------------------------------------------ |
| active | `boolean` | No        | Filtrar por estado activo (`true`/`false`) |

---

### EP-010: GET /api/v1/member-types/templates

**Método:** `GET`
**Ruta:** `/api/v1/member-types/templates`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:read`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Request Body

N/A

#### Response 200

Array de `MemberTypeTemplateDto`:

| Campo                     | Tipo           | Descripción                  |
| ------------------------- | -------------- | ---------------------------- |
| code                      | `string`       | Código de la plantilla       |
| name                      | `string`       | Nombre                       |
| description               | `string`       | Descripción                  |
| ageRangeMin               | `number\|null` | Edad mínima                  |
| ageRangeMax               | `number\|null` | Edad máxima                  |
| votingRight               | `boolean`      | Derecho a voto               |
| eligibleForOffice         | `boolean`      | Elegible para cargo          |
| minimumSeniorityForVoting | `number`       | Antigüedad mínima para votar |
| minimumSeniorityForOffice | `number`       | Antigüedad mínima para cargo |
| rulesConfig               | `object`       | Configuración de reglas      |

#### Query Parameters

| Campo            | Tipo     | Requerido | Descripción                                                                        |
| ---------------- | -------- | --------- | ---------------------------------------------------------------------------------- |
| collectivityType | `string` | Sí        | Tipo de colectividad (`PENA`, `COFRADIA`, `CLUB_DEPORTIVO`, `ASOCIACION_CULTURAL`) |

---

### EP-011: POST /api/v1/member-types/import-template

**Método:** `POST`
**Ruta:** `/api/v1/member-types/import-template`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:create`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Request Body

| Campo            | Tipo     | Requerido | Validación                                                                    | Descripción                                   |
| ---------------- | -------- | --------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| collectivityType | `string` | Sí        | `@IsNotEmpty`, `@IsEnum(PENA, COFRADIA, CLUB_DEPORTIVO, ASOCIACION_CULTURAL)` | Tipo de colectividad para importar plantillas |

#### Response 201

Array de `MemberTypeResponseDto` (ver EP-008).

---

### EP-012: GET /api/v1/member-types/:id

**Método:** `GET`
**Ruta:** `/api/v1/member-types/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:read`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Request Body

N/A

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del tipo de socio |

#### Response 200

`MemberTypeResponseDto` (ver EP-008).

#### Errores

| Status | Código | Condición                   |
| ------ | ------ | --------------------------- |
| 404    | -      | Tipo de socio no encontrado |

---

### EP-013: PUT /api/v1/member-types/:id

**Método:** `PUT`
**Ruta:** `/api/v1/member-types/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:update`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del tipo de socio |

#### Request Body

| Campo                       | Tipo           | Requerido | Validación                       | Descripción                          |
| --------------------------- | -------------- | --------- | -------------------------------- | ------------------------------------ |
| name                        | `string`       | Sí        | `@IsNotEmpty`, `@MaxLength(100)` | Nombre del tipo de socio             |
| description                 | `string`       | No        | `@IsString`, `@IsOptional`       | Descripción                          |
| ageRangeMin                 | `number\|null` | No        | `@IsInt`, `@Min(0)`              | Edad mínima                          |
| ageRangeMax                 | `number\|null` | No        | `@IsInt`, `@Min(0)`              | Edad máxima                          |
| votingRight                 | `boolean`      | Sí        | `@IsBoolean`                     | Derecho a voto                       |
| eligibleForOffice           | `boolean`      | Sí        | `@IsBoolean`                     | Elegible para cargo                  |
| minimumSeniorityForVoting   | `number`       | Sí        | `@IsInt`, `@Min(0)`              | Antigüedad mínima para votar (meses) |
| minimumSeniorityForOffice   | `number`       | Sí        | `@IsInt`, `@Min(0)`              | Antigüedad mínima para cargo (meses) |
| automaticTransitionTargetId | `string\|null` | No        | `@IsUUID('4')`                   | ID del tipo destino                  |
| rulesConfig                 | `object`       | Sí        | `@IsObject`                      | Configuración de reglas              |

_Nota: `code` es inmutable, no se incluye._

#### Response 200

`MemberTypeResponseDto` (ver EP-008).

#### Errores

| Status | Código | Condición                   |
| ------ | ------ | --------------------------- |
| 404    | -      | Tipo de socio no encontrado |
| 422    | -      | Datos inválidos             |

---

### EP-014: PATCH /api/v1/member-types/:id/deactivate

**Método:** `PATCH`
**Ruta:** `/api/v1/member-types/:id/deactivate`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:member-types:update`
**Caso de Uso:** UC-008
**Entidades:** ENT-007

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del tipo de socio |

#### Request Body

N/A

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición                                                         |
| ------ | ------ | ----------------------------------------------------------------- |
| 404    | -      | Tipo de socio no encontrado                                       |
| 409    | -      | No se puede desactivar porque es destino de transición automática |

---

### EP-015: POST /api/v1/fiscal-years

**Método:** `POST`
**Ruta:** `/api/v1/fiscal-years`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:fiscal-years:create`
**Caso de Uso:** UC-010
**Entidades:** ENT-008

#### Request Body

| Campo                     | Tipo                | Requerido | Validación                                                    | Descripción                                       |
| ------------------------- | ------------------- | --------- | ------------------------------------------------------------- | ------------------------------------------------- |
| name                      | `string`            | Sí        | `@IsNotEmpty`, `@IsString`                                    | Nombre del ejercicio fiscal                       |
| type                      | `string`            | Sí        | `@IsIn([NATURAL_YEAR, SPORTS_SEASON, CONFRATERNITY, CUSTOM])` | Tipo de ejercicio                                 |
| startDate                 | `string` (ISO 8601) | Sí        | `@IsDateString`                                               | Fecha de inicio                                   |
| endDate                   | `string` (ISO 8601) | Sí        | `@IsDateString`                                               | Fecha de fin                                      |
| previousFiscalYearId      | `string\|null`      | No        | `@IsUUID('4')`                                                | ID del ejercicio fiscal anterior                  |
| carryOverMembers          | `boolean`           | Sí        | `@IsBoolean`                                                  | Trasladar socios del ejercicio anterior           |
| applyAutomaticTransitions | `boolean`           | Sí        | `@IsBoolean`                                                  | Aplicar transiciones automáticas de tipo de socio |

#### Response 201

`OpenFiscalYearResultDto`:

| Campo              | Tipo                                       | Descripción                        |
| ------------------ | ------------------------------------------ | ---------------------------------- |
| fiscalYear         | `FiscalYearResponseDto`                    | Datos del ejercicio fiscal creado  |
| carriedOverMembers | `number`                                   | Número de socios trasladados       |
| appliedTransitions | `Array<{memberId, previousType, newType}>` | Transiciones automáticas aplicadas |

`FiscalYearResponseDto`:

| Campo                | Tipo            | Descripción                                                       |
| -------------------- | --------------- | ----------------------------------------------------------------- |
| id                   | `string` (UUID) | ID del ejercicio fiscal                                           |
| name                 | `string`        | Nombre                                                            |
| type                 | `string`        | Tipo (`NATURAL_YEAR`, `SPORTS_SEASON`, `CONFRATERNITY`, `CUSTOM`) |
| status               | `string`        | Estado (`PREPARATION`, `OPEN`, `CLOSED`)                          |
| startDate            | `Date`          | Fecha de inicio                                                   |
| endDate              | `Date`          | Fecha de fin                                                      |
| previousFiscalYearId | `string\|null`  | ID del ejercicio anterior                                         |
| membersAtStart       | `number`        | Socios al inicio                                                  |
| membersAtEnd         | `number\|null`  | Socios al cierre                                                  |
| createdAt            | `Date`          | Fecha de creación                                                 |
| closedAt             | `Date\|null`    | Fecha de cierre                                                   |

#### Errores

| Status | Código | Condición                                                    |
| ------ | ------ | ------------------------------------------------------------ |
| 409    | -      | Ya existe un ejercicio fiscal abierto o con nombre duplicado |
| 422    | -      | Datos inválidos o periodo solapado                           |

---

### EP-016: GET /api/v1/fiscal-years

**Método:** `GET`
**Ruta:** `/api/v1/fiscal-years`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:fiscal-years:read`
**Caso de Uso:** UC-010
**Entidades:** ENT-008

#### Request Body

N/A

#### Response 200

Array de `FiscalYearResponseDto` (ver EP-015).

---

### EP-017: GET /api/v1/fiscal-years/active

**Método:** `GET`
**Ruta:** `/api/v1/fiscal-years/active`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:fiscal-years:read`
**Caso de Uso:** UC-010
**Entidades:** ENT-008

#### Request Body

N/A

#### Response 200

`FiscalYearResponseDto` (ver EP-015).

#### Errores

| Status | Código | Condición                      |
| ------ | ------ | ------------------------------ |
| 404    | -      | No hay ejercicio fiscal activo |

---

### EP-018: GET /api/v1/fiscal-years/compare

**Método:** `GET`
**Ruta:** `/api/v1/fiscal-years/compare`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:fiscal-years:read`
**Caso de Uso:** UC-010
**Entidades:** ENT-008

#### Request Body

N/A

#### Query Parameters

| Campo | Tipo     | Requerido | Descripción                                           |
| ----- | -------- | --------- | ----------------------------------------------------- |
| ids   | `string` | Sí        | UUIDs separados por coma de los ejercicios a comparar |

#### Response 200

`FiscalYearComparisonDto`:

| Campo | Tipo                                                                                    | Descripción                      |
| ----- | --------------------------------------------------------------------------------------- | -------------------------------- |
| years | `Array<{fiscalYearId, name, activeMembers, newMembers, leavingMembers, retentionRate}>` | Datos comparativos por ejercicio |

---

### EP-019: GET /api/v1/fiscal-years/:id

**Método:** `GET`
**Ruta:** `/api/v1/fiscal-years/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:fiscal-years:read`
**Caso de Uso:** UC-010
**Entidades:** ENT-008

#### Path Parameters

| Parámetro | Tipo               | Descripción             |
| --------- | ------------------ | ----------------------- |
| id        | `string` (UUID v4) | ID del ejercicio fiscal |

#### Request Body

N/A

#### Response 200

`FiscalYearResponseDto` (ver EP-015).

#### Errores

| Status | Código | Condición                      |
| ------ | ------ | ------------------------------ |
| 404    | -      | Ejercicio fiscal no encontrado |

---

### EP-020: POST /api/v1/fiscal-years/:id/close

**Método:** `POST`
**Ruta:** `/api/v1/fiscal-years/:id/close`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:fiscal-years:close`
**Caso de Uso:** UC-010
**Entidades:** ENT-008

#### Path Parameters

| Parámetro | Tipo               | Descripción             |
| --------- | ------------------ | ----------------------- |
| id        | `string` (UUID v4) | ID del ejercicio fiscal |

#### Request Body

| Campo | Tipo      | Requerido | Validación   | Descripción                                     |
| ----- | --------- | --------- | ------------ | ----------------------------------------------- |
| force | `boolean` | Sí        | `@IsBoolean` | Forzar cierre ignorando advertencias pendientes |

#### Response 200

`CloseFiscalYearResultDto`:

| Campo      | Tipo                    | Descripción                              |
| ---------- | ----------------------- | ---------------------------------------- |
| fiscalYear | `FiscalYearResponseDto` | Datos del ejercicio fiscal cerrado       |
| warnings   | `string[]`              | Advertencias generadas durante el cierre |

#### Errores

| Status | Código | Condición                       |
| ------ | ------ | ------------------------------- |
| 404    | -      | Ejercicio fiscal no encontrado  |
| 422    | -      | No se puede cerrar el ejercicio |

---

### EP-021: POST /api/v1/members

**Método:** `POST`
**Ruta:** `/api/v1/members`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:create`
**Caso de Uso:** UC-006
**Entidades:** ENT-009, ENT-007, ENT-008

#### Request Body

| Campo          | Tipo                | Requerido | Validación                       | Descripción                                                |
| -------------- | ------------------- | --------- | -------------------------------- | ---------------------------------------------------------- |
| name           | `string`            | Sí        | `@IsNotEmpty`, `@MaxLength(100)` | Nombre del socio                                           |
| surnames       | `string`            | Sí        | `@IsNotEmpty`, `@MaxLength(200)` | Apellidos del socio                                        |
| birthDate      | `string` (ISO 8601) | Sí        | `@IsDateString`                  | Fecha de nacimiento                                        |
| documentType   | `string` (enum)     | Sí        | `@IsEnum(DNI, NIE, PASSPORT)`    | Tipo de documento de identidad                             |
| documentNumber | `string`            | Sí        | `@IsNotEmpty`, `@MaxLength(20)`  | Número de documento                                        |
| email          | `string`            | Sí        | `@IsNotEmpty`, `@IsEmail`        | Email del socio                                            |
| phone          | `string\|null`      | No        | `@MaxLength(20)`                 | Teléfono                                                   |
| address        | `string\|null`      | No        | `@MaxLength(300)`                | Dirección                                                  |
| postalCode     | `string\|null`      | No        | `@MaxLength(10)`                 | Código postal                                              |
| city           | `string\|null`      | No        | `@MaxLength(100)`                | Ciudad                                                     |
| iban           | `string\|null`      | No        | `@IsString`                      | IBAN del socio                                             |
| memberTypeId   | `string` (UUID)     | Sí        | `@IsUUID('4')`                   | ID del tipo de socio                                       |
| customFields   | `object`            | No        | `@IsObject`                      | Campos personalizados (default: `{}`)                      |
| initialStatus  | `string`            | No        | `@IsString`                      | Estado inicial (`ACTIVE` o `APPLICANT`, default: `ACTIVE`) |

#### Response 201

`MemberResponseDto`:

| Campo            | Tipo            | Descripción                   |
| ---------------- | --------------- | ----------------------------- |
| id               | `string` (UUID) | ID del socio                  |
| memberNumber     | `string`        | Número de socio               |
| name             | `string`        | Nombre                        |
| surnames         | `string`        | Apellidos                     |
| birthDate        | `Date`          | Fecha de nacimiento           |
| age              | `number`        | Edad calculada                |
| documentType     | `string`        | Tipo de documento             |
| documentNumber   | `string`        | Número de documento           |
| email            | `string`        | Email                         |
| phone            | `string\|null`  | Teléfono                      |
| address          | `string\|null`  | Dirección                     |
| postalCode       | `string\|null`  | Código postal                 |
| city             | `string\|null`  | Ciudad                        |
| ibanMasked       | `string\|null`  | IBAN enmascarado              |
| memberTypeId     | `string` (UUID) | ID del tipo de socio          |
| memberTypeName   | `string\|null`  | Nombre del tipo de socio      |
| currentStatus    | `string`        | Estado actual                 |
| customFields     | `object\|null`  | Campos personalizados         |
| registrationDate | `Date`          | Fecha de registro             |
| leaveDate        | `Date\|null`    | Fecha de baja                 |
| createdAt        | `Date`          | Fecha de creación             |
| updatedAt        | `Date`          | Fecha de última actualización |

#### Errores

| Status | Código | Condición                           |
| ------ | ------ | ----------------------------------- |
| 409    | -      | DNI o email duplicado               |
| 422    | -      | Datos inválidos o edad incompatible |

---

### EP-022: GET /api/v1/members

**Método:** `GET`
**Ruta:** `/api/v1/members`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-006
**Entidades:** ENT-009, ENT-007

#### Request Body

N/A

#### Query Parameters

| Campo        | Tipo            | Requerido | Descripción                                                   |
| ------------ | --------------- | --------- | ------------------------------------------------------------- |
| status       | `string`        | No        | Filtrar por estado (`ACTIVE`, `APPLICANT`, `SUSPENDED`, etc.) |
| memberTypeId | `string` (UUID) | No        | Filtrar por tipo de socio                                     |
| search       | `string`        | No        | Búsqueda textual por nombre, apellidos o email                |

#### Response 200

Array de `MemberListResponseDto`:

| Campo            | Tipo            | Descripción              |
| ---------------- | --------------- | ------------------------ |
| id               | `string` (UUID) | ID del socio             |
| memberNumber     | `string`        | Número de socio          |
| name             | `string`        | Nombre                   |
| surnames         | `string`        | Apellidos                |
| email            | `string`        | Email                    |
| currentStatus    | `string`        | Estado actual            |
| memberTypeName   | `string\|null`  | Nombre del tipo de socio |
| registrationDate | `Date`          | Fecha de registro        |

---

### EP-023: GET /api/v1/members/:id

**Método:** `GET`
**Ruta:** `/api/v1/members/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-006
**Entidades:** ENT-009, ENT-007

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

N/A

#### Response 200

`MemberResponseDto` (ver EP-021).

#### Errores

| Status | Código | Condición           |
| ------ | ------ | ------------------- |
| 404    | -      | Socio no encontrado |

---

### EP-024: PUT /api/v1/members/:id

**Método:** `PUT`
**Ruta:** `/api/v1/members/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:update`
**Caso de Uso:** UC-006
**Entidades:** ENT-009

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

| Campo        | Tipo           | Requerido | Validación        | Descripción           |
| ------------ | -------------- | --------- | ----------------- | --------------------- |
| name         | `string`       | No        | `@MaxLength(100)` | Nombre                |
| surnames     | `string`       | No        | `@MaxLength(200)` | Apellidos             |
| email        | `string`       | No        | `@IsEmail`        | Email                 |
| phone        | `string\|null` | No        | `@MaxLength(20)`  | Teléfono              |
| address      | `string\|null` | No        | `@MaxLength(300)` | Dirección             |
| postalCode   | `string\|null` | No        | `@MaxLength(10)`  | Código postal         |
| city         | `string\|null` | No        | `@MaxLength(100)` | Ciudad                |
| iban         | `string\|null` | No        | `@IsString`       | IBAN                  |
| customFields | `object`       | No        | `@IsObject`       | Campos personalizados |

_Nota: `documentType` y `documentNumber` son inmutables, no se incluyen._

#### Response 200

`MemberResponseDto` (ver EP-021).

#### Errores

| Status | Código | Condición                                   |
| ------ | ------ | ------------------------------------------- |
| 404    | -      | Socio no encontrado                         |
| 409    | -      | Email duplicado o conflicto de concurrencia |
| 422    | -      | Datos inválidos                             |

---

### EP-025: GET /api/v1/members/preconditions

**Método:** `GET`
**Ruta:** `/api/v1/members/preconditions`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:create`
**Caso de Uso:** UC-011
**Entidades:** ENT-007, ENT-008

#### Request Body

N/A

#### Response 200

`PreconditionsResponseDto`:

| Campo               | Tipo                                   | Descripción                              |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| hasFiscalYear       | `boolean`                              | Existe ejercicio fiscal abierto          |
| hasMemberTypes      | `boolean`                              | Existen tipos de socio activos           |
| hasRegistrationPlan | `boolean`                              | Existe un plan de alta activo (ONE_TIME) |
| registrationPlan    | `{feePlanId, name, amount}\|undefined` | Información del plan de alta activo      |
| errors              | `string[]`                             | Lista de errores de precondición         |

---

### EP-026: POST /api/v1/members/simple-registration

**Método:** `POST`
**Ruta:** `/api/v1/members/simple-registration`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:create`
**Caso de Uso:** UC-011
**Entidades:** ENT-009, ENT-007, ENT-008

#### Request Body

| Campo          | Tipo                | Requerido | Validación                       | Descripción          |
| -------------- | ------------------- | --------- | -------------------------------- | -------------------- |
| name           | `string`            | Sí        | `@IsNotEmpty`, `@MaxLength(100)` | Nombre del socio     |
| surnames       | `string`            | Sí        | `@IsNotEmpty`, `@MaxLength(200)` | Apellidos            |
| birthDate      | `string` (ISO 8601) | Sí        | `@IsDateString`                  | Fecha de nacimiento  |
| documentType   | `string` (enum)     | Sí        | `@IsEnum(DNI, NIE, PASSPORT)`    | Tipo de documento    |
| documentNumber | `string`            | Sí        | `@IsNotEmpty`, `@MaxLength(20)`  | Número de documento  |
| email          | `string`            | Sí        | `@IsNotEmpty`, `@IsEmail`        | Email                |
| phone          | `string\|null`      | No        | `@MaxLength(20)`                 | Teléfono             |
| address        | `string\|null`      | No        | `@MaxLength(300)`                | Dirección            |
| postalCode     | `string\|null`      | No        | `@MaxLength(10)`                 | Código postal        |
| city           | `string\|null`      | No        | `@MaxLength(100)`                | Ciudad               |
| memberTypeId   | `string` (UUID)     | Sí        | `@IsUUID('4')`                   | ID del tipo de socio |

_Nota: no incluye `iban`, `customFields`, ni `initialStatus` (se gestionan internamente)._

#### Response 201

`SimpleRegistrationResponseDto`:

| Campo              | Tipo                                            | Descripción                                    |
| ------------------ | ----------------------------------------------- | ---------------------------------------------- |
| memberId           | `string` (UUID)                                 | ID del socio creado                            |
| memberNumber       | `string`                                        | Número de socio                                |
| status             | `string`                                        | Estado del socio                               |
| memberTypeName     | `string`                                        | Nombre del tipo de socio                       |
| registrationDate   | `Date`                                          | Fecha de registro                              |
| emailWarning       | `string\|undefined`                             | Advertencia si el email ya existe (no bloquea) |
| registrationCharge | `{chargeId, amount, description, status}\|null` | Cargo de alta generado                         |

#### Errores

| Status | Código | Condición                                                                        |
| ------ | ------ | -------------------------------------------------------------------------------- |
| 409    | -      | DNI/NIE duplicado en el tenant                                                   |
| 412    | -      | Precondiciones no cumplidas (sin ejercicio fiscal, tipos de socio, plan de alta) |
| 422    | -      | Edad no elegible o datos con formato inválido                                    |

---

### EP-027: GET /api/v1/members/check-dni/:documentType/:documentNumber

**Método:** `GET`
**Ruta:** `/api/v1/members/check-dni/:documentType/:documentNumber`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-011
**Entidades:** ENT-009

#### Path Parameters

| Parámetro      | Tipo     | Descripción                      |
| -------------- | -------- | -------------------------------- |
| documentType   | `string` | Tipo de documento (`DNI`, `NIE`) |
| documentNumber | `string` | Número de documento de identidad |

#### Request Body

N/A

#### Response 200

`DniCheckResponseDto`:

| Campo        | Tipo                | Descripción                         |
| ------------ | ------------------- | ----------------------------------- |
| exists       | `boolean`           | Si el documento ya está registrado  |
| memberName   | `string\|undefined` | Nombre completo del socio existente |
| memberNumber | `string\|undefined` | Número de socio existente           |

---

### EP-028: GET /api/v1/members/check-email/:email

**Método:** `GET`
**Ruta:** `/api/v1/members/check-email/:email`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-011
**Entidades:** ENT-009

#### Path Parameters

| Parámetro | Tipo     | Descripción                     |
| --------- | -------- | ------------------------------- |
| email     | `string` | Email a verificar (URL-encoded) |

#### Request Body

N/A

#### Response 200

`EmailCheckResponseDto`:

| Campo  | Tipo      | Descripción                                    |
| ------ | --------- | ---------------------------------------------- |
| exists | `boolean` | Si el email ya existe en otro socio del tenant |

---

### EP-029: POST /api/v1/members/:id/status

**Método:** `POST`
**Ruta:** `/api/v1/members/:id/status`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:update-status`
**Caso de Uso:** UC-007
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

| Campo     | Tipo     | Requerido | Validación                                                                                                                | Descripción                          |
| --------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| newStatus | `string` | Sí        | `@IsIn([ACTIVE, PENDING_PAYMENT, SUSPENDED, APPLICANT, VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE, DECEASED])` | Nuevo estado del socio               |
| reason    | `string` | Sí        | `@IsNotEmpty`, `@MinLength(3)`, `@MaxLength(500)`                                                                         | Motivo del cambio (3-500 caracteres) |

#### Response 200

Sin esquema documentado explícitamente (retorna el resultado del CommandBus).

#### Errores

| Status | Código | Condición                 |
| ------ | ------ | ------------------------- |
| 404    | -      | Socio no encontrado       |
| 409    | -      | Conflicto de concurrencia |
| 422    | -      | Transición no permitida   |

---

### EP-030: GET /api/v1/members/:id/status-history

**Método:** `GET`
**Ruta:** `/api/v1/members/:id/status-history`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-007
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

N/A

#### Response 200

`StatusHistoryResponseDto`:

| Campo         | Tipo                      | Descripción                 |
| ------------- | ------------------------- | --------------------------- |
| memberId      | `string` (UUID)           | ID del socio                |
| currentStatus | `string`                  | Estado actual               |
| entries       | `StatusHistoryEntryDto[]` | Historial de estados (DESC) |

`StatusHistoryEntryDto`:

| Campo          | Tipo            | Descripción                                       |
| -------------- | --------------- | ------------------------------------------------- |
| id             | `string` (UUID) | ID de la entrada                                  |
| previousStatus | `string`        | Estado anterior                                   |
| newStatus      | `string`        | Nuevo estado                                      |
| reason         | `string`        | Motivo                                            |
| changedBy      | `string`        | ID del usuario que ejecutó el cambio (o `SYSTEM`) |
| changedAt      | `Date`          | Fecha y hora del cambio                           |

#### Errores

| Status | Código | Condición           |
| ------ | ------ | ------------------- |
| 404    | -      | Socio no encontrado |

---

### EP-031: GET /api/v1/members/:id/available-transitions

**Método:** `GET`
**Ruta:** `/api/v1/members/:id/available-transitions`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-007
**Entidades:** ENT-009

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

N/A

#### Response 200

`AvailableTransitionsDto`:

| Campo                | Tipo                                           | Descripción              |
| -------------------- | ---------------------------------------------- | ------------------------ |
| memberId             | `string` (UUID)                                | ID del socio             |
| currentStatus        | `string`                                       | Estado actual            |
| availableTransitions | `Array<{status: string, description: string}>` | Transiciones disponibles |

#### Errores

| Status | Código | Condición           |
| ------ | ------ | ------------------- |
| 404    | -      | Socio no encontrado |

---

### EP-032: POST /api/v1/members/delinquency-check

**Método:** `POST`
**Ruta:** `/api/v1/members/delinquency-check`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:update-status`
**Caso de Uso:** UC-007
**Entidades:** ENT-009, ENT-010

#### Request Body

| Campo       | Tipo     | Requerido | Validación                         | Descripción                               |
| ----------- | -------- | --------- | ---------------------------------- | ----------------------------------------- |
| daysOverdue | `number` | No        | `@IsInt`, `@Min(1)`, default: `90` | Días de retraso para considerar morosidad |

#### Response 200

`DelinquencyCheckResultDto`:

| Campo             | Tipo                       | Descripción                               |
| ----------------- | -------------------------- | ----------------------------------------- |
| processedCount    | `number`                   | Total de socios procesados                |
| transitionedCount | `number`                   | Socios transicionados a `PENDING_PAYMENT` |
| errors            | `Array<{memberId, error}>` | Errores durante el procesamiento          |

---

### EP-033: GET /api/v1/members/:id/leave-summary

**Método:** `GET`
**Ruta:** `/api/v1/members/:id/leave-summary`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-013
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

N/A

#### Response 200

`LeaveSummaryResponseDto`:

| Campo                | Tipo                       | Descripción                             |
| -------------------- | -------------------------- | --------------------------------------- |
| memberId             | `string` (UUID)            | ID del socio                            |
| memberName           | `string`                   | Nombre completo                         |
| memberNumber         | `string`                   | Número de socio                         |
| memberDni            | `string\|undefined`        | Documento de identidad                  |
| currentStatus        | `string`                   | Estado actual                           |
| effectiveDateOptions | `EffectiveDateOptionDto[]` | Opciones de fecha efectiva de baja      |
| activeSubscriptions  | `ActiveSubscriptionDto[]`  | Suscripciones activas que se cancelarán |
| pendingCharges       | `PendingChargeDto[]`       | Cargos pendientes de pago               |
| totalPendingDebt     | `number`                   | Total de deuda pendiente en centavos    |

#### Errores

| Status | Código | Condición           |
| ------ | ------ | ------------------- |
| 404    | -      | Socio no encontrado |

---

### EP-034: POST /api/v1/members/:id/voluntary-leave

**Método:** `POST`
**Ruta:** `/api/v1/members/:id/voluntary-leave`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:deactivate`
**Caso de Uso:** UC-013
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

| Campo             | Tipo            | Requerido | Validación                                                                 | Descripción                       |
| ----------------- | --------------- | --------- | -------------------------------------------------------------------------- | --------------------------------- |
| effectiveDateType | `string` (enum) | Sí        | `@IsEnum(IMMEDIATE, END_OF_FISCAL_YEAR, END_OF_NEXT_MONTH, NOTICE_PERIOD)` | Tipo de cálculo de fecha efectiva |
| reason            | `string`        | Sí        | `@IsNotEmpty`, `@MinLength(3)`, `@MaxLength(500)`                          | Motivo de la baja                 |

#### Response 200

`LeaveResponseDto`:

| Campo                | Tipo            | Descripción                   |
| -------------------- | --------------- | ----------------------------- |
| memberId             | `string` (UUID) | ID del socio                  |
| previousStatus       | `string`        | Estado anterior               |
| newStatus            | `string`        | Nuevo estado                  |
| effectiveDate        | `Date`          | Fecha efectiva de la baja     |
| subscriptionsClosed  | `number`        | Suscripciones canceladas      |
| pendingChargesAmount | `number`        | Importe pendiente en centavos |

#### Errores

| Status | Código | Condición                        |
| ------ | ------ | -------------------------------- |
| 404    | -      | Socio no encontrado              |
| 422    | -      | No se puede dar de baja al socio |

---

### EP-035: POST /api/v1/members/:id/nonpayment-leave

**Método:** `POST`
**Ruta:** `/api/v1/members/:id/nonpayment-leave`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:deactivate`
**Caso de Uso:** UC-013
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

N/A (no requiere parámetros - verifica deuda pendiente automáticamente)

#### Response 200

`LeaveResponseDto` (ver EP-034).

#### Errores

| Status | Código | Condición                                |
| ------ | ------ | ---------------------------------------- |
| 404    | -      | Socio no encontrado                      |
| 422    | -      | No se puede dar de baja o no tiene deuda |

---

### EP-036: GET /api/v1/members/:id/reinstatement-summary

**Método:** `GET`
**Ruta:** `/api/v1/members/:id/reinstatement-summary`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:read`
**Caso de Uso:** UC-013
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

N/A

#### Response 200

`ReinstatementSummaryResponseDto`:

| Campo              | Tipo                | Descripción                                          |
| ------------------ | ------------------- | ---------------------------------------------------- |
| memberId           | `string` (UUID)     | ID del socio                                         |
| memberName         | `string`            | Nombre completo                                      |
| memberNumber       | `string\|undefined` | Número de socio                                      |
| memberDni          | `string\|undefined` | Documento de identidad                               |
| leaveDate          | `Date`              | Fecha de baja                                        |
| leaveType          | `string`            | Tipo de baja (`VOLUNTARY_LEAVE`, `NONPAYMENT_LEAVE`) |
| pendingDebt        | `number`            | Deuda pendiente en centavos                          |
| penalty            | `number`            | Penalización en centavos                             |
| newRegistrationFee | `number`            | Cuota de nueva inscripción en centavos               |
| totalToPay         | `number`            | Total a pagar en centavos                            |
| keepSeniority      | `boolean`           | Si se conserva la antigüedad                         |

#### Errores

| Status | Código | Condición                          |
| ------ | ------ | ---------------------------------- |
| 404    | -      | Socio no encontrado                |
| 422    | -      | El socio no puede ser rehabilitado |

---

### EP-037: POST /api/v1/members/:id/reinstate

**Método:** `POST`
**Ruta:** `/api/v1/members/:id/reinstate`
**Autenticación:** JWT + RBAC
**Permisos:** `membership:members:reinstate`
**Caso de Uso:** UC-013
**Entidades:** ENT-009, ENT-010

#### Path Parameters

| Parámetro | Tipo               | Descripción  |
| --------- | ------------------ | ------------ |
| id        | `string` (UUID v4) | ID del socio |

#### Request Body

| Campo            | Tipo      | Requerido | Validación   | Descripción                                               |
| ---------------- | --------- | --------- | ------------ | --------------------------------------------------------- |
| paymentConfirmed | `boolean` | Sí        | `@IsBoolean` | Confirmación de pago de deuda pendiente (debe ser `true`) |

#### Response 200

`ReinstatementResponseDto`:

| Campo              | Tipo            | Descripción                                         |
| ------------------ | --------------- | --------------------------------------------------- |
| memberId           | `string` (UUID) | ID del socio                                        |
| newStatus          | `string`        | Nuevo estado (`ACTIVE`)                             |
| debtPaid           | `number`        | Deuda pagada en centavos                            |
| seniorityRecovered | `boolean`       | Si se recuperó la antigüedad original               |
| registrationDate   | `Date`          | Fecha de registro (original si conserva antigüedad) |

#### Errores

| Status | Código | Condición                        |
| ------ | ------ | -------------------------------- |
| 404    | -      | Socio no encontrado              |
| 422    | -      | No se puede rehabilitar al socio |

---

---

## 4. BC-Treasury

### EP-038: POST /api/v1/treasury/fee-plans

**Método:** `POST`
**Ruta:** `/api/v1/treasury/fee-plans`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:create`
**Caso de Uso:** UC-017 (Gestión de planes de cuota)
**Entidades:** ENT-011

#### Request Body

| Campo         | Tipo           | Requerido | Validación                                                      | Descripción                               |
| ------------- | -------------- | --------- | --------------------------------------------------------------- | ----------------------------------------- |
| code          | `string`       | Sí        | `@IsNotEmpty`, `@MaxLength(20)`                                 | Código único (2-20 chars `[A-Z0-9_-]`)    |
| name          | `string`       | Sí        | `@IsNotEmpty`, `@MaxLength(100)`                                | Nombre del plan                           |
| description   | `string\|null` | No        | `@IsString`                                                     | Descripción                               |
| type          | `string`       | Sí        | `@IsEnum(ONE_TIME, RECURRING)`                                  | Tipo de plan                              |
| frequency     | `string\|null` | No        | `@IsEnum(MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM)`         | Frecuencia (obligatoria para `RECURRING`) |
| amount        | `number`       | Sí        | `@IsInt`, `@Min(0)`                                             | Importe en centavos                       |
| billingMonths | `number[]`     | Sí        | `@IsArray`, `@IsInt(each)`, `@Min(1,each)`, `@ArrayMaxSize(12)` | Meses de facturación (1-12)               |

#### Response 201

`FeePlanResponseDto`:

| Campo             | Tipo                               | Descripción                                            |
| ----------------- | ---------------------------------- | ------------------------------------------------------ |
| id                | `string` (UUID)                    | ID del plan de cuota                                   |
| code              | `string`                           | Código único                                           |
| name              | `string`                           | Nombre                                                 |
| description       | `string\|null`                     | Descripción                                            |
| type              | `string`                           | Tipo (`ONE_TIME`, `RECURRING`)                         |
| frequency         | `string`                           | Frecuencia de cobro                                    |
| amount            | `number`                           | Importe en centavos                                    |
| amountFormatted   | `string`                           | Importe formateado (ej. `"120.00 EUR"`)                |
| currency          | `string`                           | Código de divisa ISO 4217                              |
| billingMonths     | `number[]`                         | Meses de facturación                                   |
| active            | `boolean`                          | Estado activo                                          |
| createdAt         | `Date`                             | Fecha de creación                                      |
| updatedAt         | `Date`                             | Fecha de última actualización                          |
| linkedMemberTypes | `LinkedMemberTypeDto[]\|undefined` | Tipos de socio vinculados (solo en detalle individual) |

#### Errores

| Status | Código | Condición        |
| ------ | ------ | ---------------- |
| 409    | -      | Código ya existe |
| 422    | -      | Datos inválidos  |

---

### EP-039: GET /api/v1/treasury/fee-plans

**Método:** `GET`
**Ruta:** `/api/v1/treasury/fee-plans`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:read`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Query Parameters

| Campo  | Tipo      | Requerido | Descripción                                |
| ------ | --------- | --------- | ------------------------------------------ |
| active | `boolean` | No        | Filtrar por estado activo (`true`/`false`) |

#### Response 200

Array de `FeePlanResponseDto` (ver EP-038).

---

### EP-040: GET /api/v1/treasury/fee-plans/templates

**Método:** `GET`
**Ruta:** `/api/v1/treasury/fee-plans/templates`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:read`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Query Parameters

| Campo            | Tipo     | Requerido | Descripción                                                |
| ---------------- | -------- | --------- | ---------------------------------------------------------- |
| collectivityType | `string` | Sí        | Tipo de colectividad (`ASSOCIATION`, `CLUB`, `FEDERATION`) |

#### Response 200

Array de `FeePlanTemplateResponseDto`:

| Campo            | Tipo           | Descripción                    |
| ---------------- | -------------- | ------------------------------ |
| code             | `string`       | Código de la plantilla         |
| name             | `string`       | Nombre                         |
| description      | `string\|null` | Descripción                    |
| type             | `string`       | Tipo (`ONE_TIME`, `RECURRING`) |
| frequency        | `string`       | Frecuencia                     |
| amount           | `number`       | Importe en centavos            |
| amountFormatted  | `string`       | Importe formateado             |
| billingMonths    | `number[]`     | Meses de facturación           |
| collectivityType | `string`       | Tipo de colectividad aplicable |

---

### EP-041: POST /api/v1/treasury/fee-plans/import-template

**Método:** `POST`
**Ruta:** `/api/v1/treasury/fee-plans/import-template`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:create`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Request Body

| Campo            | Tipo     | Requerido | Validación                 | Descripción                                   |
| ---------------- | -------- | --------- | -------------------------- | --------------------------------------------- |
| collectivityType | `string` | Sí        | `@IsNotEmpty`, `@IsString` | Tipo de colectividad para importar plantillas |

#### Response 201

Array de `FeePlanResponseDto` (ver EP-038).

---

### EP-042: GET /api/v1/treasury/fee-plans/:id

**Método:** `GET`
**Ruta:** `/api/v1/treasury/fee-plans/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:read`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del plan de cuota |

#### Response 200

`FeePlanResponseDto` (ver EP-038).

#### Errores

| Status | Código | Condición                   |
| ------ | ------ | --------------------------- |
| 404    | -      | Plan de cuota no encontrado |

---

### EP-043: PUT /api/v1/treasury/fee-plans/:id

**Método:** `PUT`
**Ruta:** `/api/v1/treasury/fee-plans/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:update`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del plan de cuota |

#### Request Body

Igual que `CreateFeePlanDto` sin el campo `code` (inmutable):

| Campo         | Tipo           | Requerido | Validación                                                      | Descripción          |
| ------------- | -------------- | --------- | --------------------------------------------------------------- | -------------------- |
| name          | `string`       | Sí        | `@IsNotEmpty`, `@MaxLength(100)`                                | Nombre               |
| description   | `string\|null` | No        | `@IsString`                                                     | Descripción          |
| type          | `string`       | Sí        | `@IsEnum(ONE_TIME, RECURRING)`                                  | Tipo de plan         |
| frequency     | `string\|null` | No        | `@IsEnum(MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM)`         | Frecuencia           |
| amount        | `number`       | Sí        | `@IsInt`, `@Min(0)`                                             | Importe en centavos  |
| billingMonths | `number[]`     | Sí        | `@IsArray`, `@IsInt(each)`, `@Min(1,each)`, `@ArrayMaxSize(12)` | Meses de facturación |

#### Response 200

`FeePlanResponseDto` (ver EP-038).

#### Errores

| Status | Código | Condición                   |
| ------ | ------ | --------------------------- |
| 404    | -      | Plan de cuota no encontrado |
| 422    | -      | Datos inválidos             |

---

### EP-044: PATCH /api/v1/treasury/fee-plans/:id/deactivate

**Método:** `PATCH`
**Ruta:** `/api/v1/treasury/fee-plans/:id/deactivate`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:update`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del plan de cuota |

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición                   |
| ------ | ------ | --------------------------- |
| 404    | -      | Plan de cuota no encontrado |
| 409    | -      | Tiene suscripciones activas |

---

### EP-045: PATCH /api/v1/treasury/fee-plans/:id/activate

**Método:** `PATCH`
**Ruta:** `/api/v1/treasury/fee-plans/:id/activate`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:update`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del plan de cuota |

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición                   |
| ------ | ------ | --------------------------- |
| 404    | -      | Plan de cuota no encontrado |

---

### EP-046: POST /api/v1/treasury/fee-plans/:id/link-member-types

**Método:** `POST`
**Ruta:** `/api/v1/treasury/fee-plans/:id/link-member-types`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:fee-plans:update`
**Caso de Uso:** UC-017
**Entidades:** ENT-011

#### Path Parameters

| Parámetro | Tipo               | Descripción          |
| --------- | ------------------ | -------------------- |
| id        | `string` (UUID v4) | ID del plan de cuota |

#### Request Body

`LinkMemberTypesDto`:

| Campo                | Tipo                  | Requerido | Validación                    | Descripción                         |
| -------------------- | --------------------- | --------- | ----------------------------- | ----------------------------------- |
| links                | `MemberTypeLinkDto[]` | Sí        | `@IsArray`, `@ValidateNested` | Vinculaciones a crear               |
| links[].memberTypeId | `string` (UUID)       | Sí        | `@IsUUID('4')`                | ID del tipo de socio                |
| links[].isDefault    | `boolean`             | Sí        | `@IsBoolean`                  | Si es la vinculación predeterminada |
| links[].order        | `number`              | Sí        | `@IsInt`, `@Min(0)`           | Orden de presentación               |

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición                                     |
| ------ | ------ | --------------------------------------------- |
| 404    | -      | Plan de cuota no encontrado                   |
| 422    | -      | Datos inválidos o tipo de socio no encontrado |

---

### EP-047: POST /api/v1/treasury/member-accounts/:accountId/subscriptions

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/subscriptions`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:subscriptions:create`
**Caso de Uso:** UC-018 (Gestión de suscripciones)
**Entidades:** ENT-013, ENT-014

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Request Body

| Campo                  | Tipo            | Requerido | Validación                                         | Descripción                   |
| ---------------------- | --------------- | --------- | -------------------------------------------------- | ----------------------------- |
| feePlanId              | `string` (UUID) | Sí        | `@IsUUID('4')`                                     | ID del plan de cuota          |
| typeDiscount           | `number`        | Sí        | `@IsNumber`, `@Min(0)`, `@Max(0.99)`, default: `0` | Descuento por tipo de socio   |
| personalDiscount       | `number`        | No        | `@IsNumber`, `@Min(0)`, `@Max(0.99)`               | Descuento personal            |
| personalDiscountReason | `string`        | No        | `@IsString`                                        | Motivo del descuento personal |

#### Response 201

`SubscriptionResponseDto`:

| Campo                    | Tipo                | Descripción                  |
| ------------------------ | ------------------- | ---------------------------- |
| id                       | `string` (UUID)     | ID de la suscripción         |
| feePlanId                | `string` (UUID)     | ID del plan de cuota         |
| feePlanName              | `string\|undefined` | Nombre del plan              |
| feePlanCode              | `string\|undefined` | Código del plan              |
| registrationDate         | `Date`              | Fecha de alta                |
| leaveDate                | `Date\|null`        | Fecha de baja                |
| typeDiscount             | `number`            | Descuento por tipo           |
| personalDiscount         | `number`            | Descuento personal           |
| personalDiscountReason   | `string\|null`      | Motivo del descuento         |
| effectiveAmount          | `number`            | Importe efectivo en centavos |
| effectiveAmountFormatted | `string`            | Importe efectivo formateado  |
| cancelReason             | `string\|null`      | Motivo de cancelación        |
| isActive                 | `boolean`           | Si está activa               |
| createdAt                | `Date`              | Fecha de creación            |

#### Errores

| Status | Código | Condición                                  |
| ------ | ------ | ------------------------------------------ |
| 404    | -      | Cuenta de socio no encontrada              |
| 409    | -      | Ya existe una suscripción periódica activa |
| 422    | -      | Datos inválidos                            |

---

### EP-048: GET /api/v1/treasury/member-accounts/:accountId/subscriptions

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/subscriptions`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:subscriptions:read`
**Caso de Uso:** UC-018
**Entidades:** ENT-013, ENT-014

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Response 200

`SubscriptionHistoryResponseDto`:

| Campo              | Tipo                            | Descripción                  |
| ------------------ | ------------------------------- | ---------------------------- |
| memberAccountId    | `string` (UUID)                 | ID de la cuenta de socio     |
| memberId           | `string` (UUID)                 | ID del socio                 |
| activeSubscription | `SubscriptionResponseDto\|null` | Suscripción periódica activa |
| history            | `SubscriptionResponseDto[]`     | Historial completo (DESC)    |

#### Errores

| Status | Código | Condición                     |
| ------ | ------ | ----------------------------- |
| 404    | -      | Cuenta de socio no encontrada |

---

### EP-049: GET /api/v1/treasury/member-accounts/:accountId/subscriptions/active

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/subscriptions/active`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:subscriptions:read`
**Caso de Uso:** UC-018
**Entidades:** ENT-013, ENT-014

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Response 200

`SubscriptionResponseDto` (ver EP-047).

#### Errores

| Status | Código | Condición                    |
| ------ | ------ | ---------------------------- |
| 404    | -      | No existe suscripción activa |

---

### EP-050: POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:subscriptions:update`
**Caso de Uso:** UC-018
**Entidades:** ENT-013, ENT-014

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |
| id        | `string` (UUID v4) | ID de la suscripción     |

#### Request Body

| Campo            | Tipo                | Requerido | Validación      | Descripción                  |
| ---------------- | ------------------- | --------- | --------------- | ---------------------------- |
| newFeePlanId     | `string` (UUID)     | Sí        | `@IsUUID('4')`  | ID del nuevo plan de cuota   |
| effectiveDate    | `string` (ISO 8601) | Sí        | `@IsDateString` | Fecha efectiva del cambio    |
| maintainDiscount | `boolean`           | No        | `@IsBoolean`    | Mantener el descuento actual |

#### Response 200

Resultado del CommandBus (sin esquema documentado explícitamente).

#### Errores

| Status | Código | Condición                          |
| ------ | ------ | ---------------------------------- |
| 404    | -      | Suscripción o cuenta no encontrada |
| 422    | -      | Datos inválidos                    |

---

### EP-051: PATCH /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount

**Método:** `PATCH`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:subscriptions:update`
**Caso de Uso:** UC-018
**Entidades:** ENT-013, ENT-014

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |
| id        | `string` (UUID v4) | ID de la suscripción     |

#### Request Body

| Campo               | Tipo     | Requerido | Validación                           | Descripción                     |
| ------------------- | -------- | --------- | ------------------------------------ | ------------------------------- |
| newPersonalDiscount | `number` | Sí        | `@IsNumber`, `@Min(0)`, `@Max(0.99)` | Nuevo descuento personal        |
| reason              | `string` | Sí        | `@IsNotEmpty`, `@IsString`           | Motivo de la actualización      |
| approvedBy          | `string` | No        | `@IsString`                          | Persona que aprobó el descuento |

#### Response 200

`SubscriptionResponseDto` (ver EP-047).

#### Errores

| Status | Código | Condición                          |
| ------ | ------ | ---------------------------------- |
| 404    | -      | Suscripción o cuenta no encontrada |
| 422    | -      | Datos inválidos                    |

---

### EP-052: POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:subscriptions:update`
**Caso de Uso:** UC-018
**Entidades:** ENT-013, ENT-014

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |
| id        | `string` (UUID v4) | ID de la suscripción     |

#### Request Body

| Campo        | Tipo     | Requerido | Validación                                                          | Descripción           |
| ------------ | -------- | --------- | ------------------------------------------------------------------- | --------------------- |
| cancelReason | `string` | Sí        | `@IsEnum(PLAN_CHANGE, MEMBER_LEAVE, EXEMPTION, ONE_TIME_COMPLETED)` | Motivo de cancelación |

#### Response 200

| Campo          | Tipo            | Descripción                  |
| -------------- | --------------- | ---------------------------- |
| message        | `string`        | Mensaje de confirmación      |
| subscriptionId | `string` (UUID) | ID de la suscripción cerrada |
| closedAt       | `Date`          | Fecha de cierre              |

#### Errores

| Status | Código | Condición                          |
| ------ | ------ | ---------------------------------- |
| 404    | -      | Suscripción o cuenta no encontrada |

---

### EP-053: POST /api/v1/treasury/charges/generate-monthly

**Método:** `POST`
**Ruta:** `/api/v1/treasury/charges/generate-monthly`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:create`
**Caso de Uso:** UC-019 (Generación de cargos)
**Entidades:** ENT-013, ENT-014, ENT-015

#### Request Body

| Campo | Tipo     | Requerido | Validación                      | Descripción               |
| ----- | -------- | --------- | ------------------------------- | ------------------------- |
| month | `number` | Sí        | `@IsInt`, `@Min(1)`, `@Max(12)` | Mes de facturación (1-12) |
| year  | `number` | Sí        | `@IsInt`, `@Min(2020)`          | Año de facturación        |

#### Response 200

`GenerationResultDto`:

| Campo                  | Tipo                             | Descripción                      |
| ---------------------- | -------------------------------- | -------------------------------- |
| tenantId               | `string`                         | ID del tenant procesado          |
| month                  | `number`                         | Mes procesado                    |
| year                   | `number`                         | Año procesado                    |
| subscriptionsEvaluated | `number`                         | Total de suscripciones evaluadas |
| chargesGenerated       | `number`                         | Cargos generados exitosamente    |
| totalAmount            | `number`                         | Importe total en centavos        |
| totalAmountFormatted   | `string`                         | Importe formateado               |
| duplicatesSkipped      | `number`                         | Duplicados omitidos              |
| errorsCount            | `number`                         | Total de errores                 |
| errors                 | `Array<{subscriptionId, error}>` | Detalle de errores               |
| durationMs             | `number`                         | Duración del proceso en ms       |

#### Errores

| Status | Código | Condición                  |
| ------ | ------ | -------------------------- |
| 400    | -      | Datos de entrada inválidos |
| 403    | -      | Sin permisos suficientes   |

---

### EP-054: GET /api/v1/treasury/charges/generation-log

**Método:** `GET`
**Ruta:** `/api/v1/treasury/charges/generation-log`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:read`
**Caso de Uso:** UC-019
**Entidades:** ENT-015

#### Query Parameters

| Campo | Tipo     | Requerido | Descripción |
| ----- | -------- | --------- | ----------- |
| month | `number` | No        | Mes (1-12)  |
| year  | `number` | No        | Año         |

#### Response 200

Array vacío `[]` (implementación pendiente en UC posterior).

---

### EP-055: GET /api/v1/treasury/member-accounts/:accountId/charges

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/charges`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:read`
**Caso de Uso:** UC-019
**Entidades:** ENT-013, ENT-015

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Query Parameters

| Campo  | Tipo     | Requerido | Descripción                                                                     |
| ------ | -------- | --------- | ------------------------------------------------------------------------------- |
| status | `string` | No        | Estado del cargo (`PENDING`, `PAID`, `PARTIALLY_PAID`, `RETURNED`, `CANCELLED`) |

#### Response 200

Array de `ChargeResponseDto`:

| Campo                | Tipo                | Descripción                 |
| -------------------- | ------------------- | --------------------------- |
| id                   | `string` (UUID)     | ID del cargo                |
| subscriptionId       | `string\|null`      | ID de la suscripción origen |
| description          | `string`            | Descripción                 |
| baseAmount           | `number`            | Importe base en centavos    |
| finalAmount          | `number`            | Importe final en centavos   |
| finalAmountFormatted | `string`            | Importe final formateado    |
| billingMonth         | `number\|null`      | Mes de facturación          |
| billingYear          | `number`            | Año de facturación          |
| issueDate            | `Date`              | Fecha de emisión            |
| dueDate              | `Date`              | Fecha de vencimiento        |
| status               | `string`            | Estado                      |
| paidAmount           | `number`            | Importe pagado en centavos  |
| paidAmountFormatted  | `string`            | Importe pagado formateado   |
| isProrated           | `boolean`           | Si fue prorrateado          |
| isManual             | `boolean`           | Si fue creado manualmente   |
| feePlanName          | `string\|undefined` | Nombre del plan asociado    |

#### Errores

| Status | Código | Condición                     |
| ------ | ------ | ----------------------------- |
| 404    | -      | Cuenta de socio no encontrada |

---

### EP-056: POST /api/v1/treasury/member-accounts/:accountId/charges/generate-subscription

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/charges/generate-subscription`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:create`
**Caso de Uso:** UC-019
**Entidades:** ENT-013, ENT-014, ENT-015

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Request Body

| Campo          | Tipo            | Requerido | Validación     | Descripción          |
| -------------- | --------------- | --------- | -------------- | -------------------- |
| subscriptionId | `string` (UUID) | Sí        | `@IsUUID('4')` | ID de la suscripción |

#### Response 201

Array de `ChargeResponseDto` (ver EP-055).

#### Errores

| Status | Código | Condición                              |
| ------ | ------ | -------------------------------------- |
| 404    | -      | Cuenta o suscripción no encontrada     |
| 422    | -      | Plan de cuota no encontrado o inactivo |

---

### EP-057: GET /api/v1/treasury/payments/:id/receipt

**Método:** `GET`
**Ruta:** `/api/v1/treasury/payments/:id/receipt`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:payments:read`
**Caso de Uso:** UC-021 (Gestión de pagos)
**Entidades:** ENT-016

#### Path Parameters

| Parámetro | Tipo               | Descripción |
| --------- | ------------------ | ----------- |
| id        | `string` (UUID v4) | ID del pago |

#### Response 200

Binario `application/pdf` con headers:

- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="receipt-{id}.pdf"`
- `Content-Length: {n}`

#### Errores

| Status | Código | Condición          |
| ------ | ------ | ------------------ |
| 404    | -      | Pago no encontrado |

---

### EP-058: GET /api/v1/treasury/search-members

**Método:** `GET`
**Ruta:** `/api/v1/treasury/search-members`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:payments:read`
**Caso de Uso:** UC-021
**Entidades:** ENT-009, ENT-013

#### Query Parameters

| Campo | Tipo     | Requerido | Descripción                                                    |
| ----- | -------- | --------- | -------------------------------------------------------------- |
| q     | `string` | Sí        | Término de búsqueda (nombre, apellidos, número de socio o DNI) |

#### Response 200

Array de `MemberSearchResultDto`:

| Campo                   | Tipo                | Descripción                   |
| ----------------------- | ------------------- | ----------------------------- |
| memberId                | `string` (UUID)     | ID del socio                  |
| memberAccountId         | `string\|null`      | ID de la cuenta de socio      |
| memberNumber            | `string`            | Número de socio               |
| name                    | `string`            | Nombre                        |
| surnames                | `string`            | Apellidos                     |
| dni                     | `string\|undefined` | DNI del socio                 |
| pendingBalance          | `number`            | Balance pendiente en centavos |
| pendingBalanceFormatted | `string`            | Balance formateado            |
| pendingCharges          | `number`            | Número de cargos pendientes   |

---

### EP-059: POST /api/v1/treasury/member-accounts/:accountId/payments

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/payments`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:payments:create`
**Caso de Uso:** UC-021
**Entidades:** ENT-013, ENT-015, ENT-016

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Request Body

| Campo         | Tipo                        | Requerido | Validación          | Descripción                                                                   |
| ------------- | --------------------------- | --------- | ------------------- | ----------------------------------------------------------------------------- |
| chargeId      | `string` (UUID)             | Sí        | `@IsUUID('4')`      | ID del cargo a pagar                                                          |
| amount        | `number`                    | Sí        | `@IsInt`, `@Min(1)` | Importe en centavos                                                           |
| paymentMethod | `string`                    | Sí        | `@IsString`         | Método de pago (`CASH`, `TRANSFER`, `BIZUM`, `SEPA_DIRECT_DEBIT`, `CARD_TPV`) |
| paymentDate   | `string` (ISO `YYYY-MM-DD`) | Sí        | `@IsDateString`     | Fecha del pago                                                                |
| notes         | `string`                    | No        | `@MaxLength(500)`   | Observaciones                                                                 |

#### Response 201

`PaymentResponseDto`:

| Campo              | Tipo                | Descripción                                |
| ------------------ | ------------------- | ------------------------------------------ |
| id                 | `string` (UUID)     | ID del pago                                |
| chargeId           | `string` (UUID)     | ID del cargo                               |
| chargeDescription  | `string\|undefined` | Descripción del cargo                      |
| amount             | `number`            | Importe en centavos                        |
| amountFormatted    | `string`            | Importe formateado                         |
| paymentMethod      | `string`            | Método de pago                             |
| paymentMethodLabel | `string`            | Etiqueta legible del método                |
| paymentDate        | `Date`              | Fecha del pago                             |
| paymentReference   | `string`            | Referencia de pago (ej. `"EF-2025-00042"`) |
| receiptNumber      | `string\|null`      | Número de recibo                           |
| notes              | `string\|null`      | Observaciones                              |
| registeredBy       | `string`            | ID del usuario que registró el cobro       |
| status             | `string`            | Estado (`CONFIRMED`, `ANNULLED`)           |
| createdAt          | `Date`              | Fecha de creación                          |

#### Errores

| Status | Código | Condición                                               |
| ------ | ------ | ------------------------------------------------------- |
| 404    | -      | Cuenta de socio o cargo no encontrado                   |
| 409    | -      | El cargo ya está pagado (FE-4)                          |
| 422    | -      | Sobre-pago (FE-1), fecha futura (FE-2), cargo cancelado |

---

### EP-060: POST /api/v1/treasury/member-accounts/:accountId/payments/multi

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/payments/multi`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:payments:create`
**Caso de Uso:** UC-021
**Entidades:** ENT-013, ENT-015, ENT-016

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Request Body

| Campo         | Tipo                        | Requerido | Validación                       | Descripción               |
| ------------- | --------------------------- | --------- | -------------------------------- | ------------------------- |
| chargeIds     | `string[]` (UUID)           | Sí        | `@IsArray`, `@IsUUID('4', each)` | IDs de los cargos a pagar |
| paymentMethod | `string`                    | Sí        | `@IsString`                      | Método de pago            |
| paymentDate   | `string` (ISO `YYYY-MM-DD`) | Sí        | `@IsDateString`                  | Fecha del pago            |
| notes         | `string`                    | No        | `@MaxLength(500)`                | Observaciones             |

#### Response 201

Array de `PaymentResponseDto` (ver EP-059).

#### Errores

| Status | Código | Condición                             |
| ------ | ------ | ------------------------------------- |
| 404    | -      | Cuenta de socio o cargo no encontrado |
| 409    | -      | Algún cargo ya está pagado (FE-4)     |
| 422    | -      | Fecha futura (FE-2), cargo cancelado  |

---

### EP-061: GET /api/v1/treasury/member-accounts/:accountId/payments

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/payments`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:payments:read`
**Caso de Uso:** UC-021
**Entidades:** ENT-013, ENT-016

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Response 200

Array de `PaymentResponseDto` (ver EP-059), ordenados por fecha DESC.

#### Errores

| Status | Código | Condición                     |
| ------ | ------ | ----------------------------- |
| 404    | -      | Cuenta de socio no encontrada |

---

### EP-062: GET /api/v1/treasury/member-accounts/:accountId/pending-charges

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/pending-charges`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:read`
**Caso de Uso:** UC-021
**Entidades:** ENT-013, ENT-015

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Response 200

Array de `PendingChargeResponseDto`:

| Campo                    | Tipo            | Descripción                          |
| ------------------------ | --------------- | ------------------------------------ |
| id                       | `string` (UUID) | ID del cargo                         |
| description              | `string`        | Descripción                          |
| finalAmount              | `number`        | Importe final en centavos            |
| finalAmountFormatted     | `string`        | Importe formateado                   |
| paidAmount               | `number`        | Importe pagado en centavos           |
| paidAmountFormatted      | `string`        | Importe pagado formateado            |
| remainingAmount          | `number`        | Importe pendiente en centavos        |
| remainingAmountFormatted | `string`        | Importe pendiente formateado         |
| billingMonth             | `number\|null`  | Mes de facturación                   |
| billingYear              | `number`        | Año de facturación                   |
| dueDate                  | `Date`          | Fecha de vencimiento                 |
| status                   | `string`        | Estado (`PENDING`, `PARTIALLY_PAID`) |
| isOverdue                | `boolean`       | Si está vencido                      |

#### Errores

| Status | Código | Condición                     |
| ------ | ------ | ----------------------------- |
| 404    | -      | Cuenta de socio no encontrada |

---

### EP-063: GET /api/v1/treasury/member-accounts/:accountId/balance

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/balance`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:payments:read`
**Caso de Uso:** UC-021
**Entidades:** ENT-013, ENT-015, ENT-016

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Response 200

`AccountBalanceResponseDto`:

| Campo                 | Tipo            | Descripción                         |
| --------------------- | --------------- | ----------------------------------- |
| memberAccountId       | `string` (UUID) | ID de la cuenta de socio            |
| memberId              | `string` (UUID) | ID del socio                        |
| memberName            | `string`        | Nombre completo                     |
| memberNumber          | `string`        | Número de socio                     |
| totalPending          | `number`        | Importe total pendiente en centavos |
| totalPendingFormatted | `string`        | Importe formateado                  |
| chargeCount           | `number`        | Número de cargos pendientes         |
| oldestDueDate         | `Date\|null`    | Fecha de vencimiento más antigua    |

#### Errores

| Status | Código | Condición                     |
| ------ | ------ | ----------------------------- |
| 404    | -      | Cuenta de socio no encontrada |

---

### EP-071: POST /api/v1/treasury/member-accounts/:accountId/charges/manual

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/charges/manual`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:create`
**Caso de Uso:** UC-020 (Gestión de cargos manuales)
**Entidades:** ENT-013, ENT-015

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Request Body

| Campo       | Tipo                        | Requerido | Descripción                                                     |
| ----------- | --------------------------- | --------- | --------------------------------------------------------------- |
| description | `string`                    | Sí        | Concepto del cargo (ej. "Derrama obras local")                  |
| notes       | `string\|null`              | No        | Descripción adicional                                           |
| amount      | `number`                    | Sí        | Importe en centavos (debe ser > 0)                              |
| issueDate   | `string` (ISO `YYYY-MM-DD`) | No        | Fecha de emisión (por defecto: hoy)                             |
| dueDate     | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha de vencimiento (debe ser >= issueDate)                    |
| returnId    | `string` (UUID)             | No        | ID de la devolución SEPA asociada (para cargos de penalización) |

#### Response 201

`ChargeResponseDto` (ver EP-055).

#### Errores

| Status | Código | Condición                                                           |
| ------ | ------ | ------------------------------------------------------------------- |
| 404    | -      | Cuenta de socio no encontrada                                       |
| 422    | -      | Importe <= 0 (FE-1), fecha de vencimiento anterior a emisión (FE-2) |

---

### EP-072: POST /api/v1/treasury/charges/manual/bulk

**Método:** `POST`
**Ruta:** `/api/v1/treasury/charges/manual/bulk`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:create`
**Caso de Uso:** UC-020
**Entidades:** ENT-009, ENT-013, ENT-015

#### Request Body

| Campo                | Tipo                        | Requerido | Descripción                                          |
| -------------------- | --------------------------- | --------- | ---------------------------------------------------- |
| description          | `string`                    | Sí        | Concepto del cargo masivo (ej. "Derrama obras 2025") |
| notes                | `string\|null`              | No        | Descripción adicional                                |
| amount               | `number`                    | Sí        | Importe en centavos (debe ser > 0)                   |
| dueDate              | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha de vencimiento                                 |
| filter               | `object`                    | Sí        | Filtro de destinatarios                              |
| filter.all           | `boolean`                   | No        | Si `true`, aplica a todos los socios activos         |
| filter.memberTypeIds | `string[]`                  | No        | IDs de tipos de socio específicos                    |
| filter.status        | `string`                    | No        | Estado de socios a incluir (`ACTIVE`, `PENDING`)     |
| approvedBy           | `string\|null`              | No        | Referencia a la aprobación de Junta Directiva        |

#### Response 202

`BulkChargeJobDto`:

| Campo                   | Tipo            | Descripción                        |
| ----------------------- | --------------- | ---------------------------------- |
| jobId                   | `string` (UUID) | ID del job de creación asíncrona   |
| estimatedCount          | `number`        | Número estimado de cargos a crear  |
| estimatedTotal          | `number`        | Importe total estimado en centavos |
| estimatedTotalFormatted | `string`        | Importe total estimado formateado  |
| status                  | `string`        | Estado inicial (`PENDING`)         |

#### Errores

| Status | Código | Condición                       |
| ------ | ------ | ------------------------------- |
| 400    | -      | Filtro sin destinatarios (FE-3) |
| 422    | -      | Importe <= 0, fecha inválida    |

---

### EP-073: GET /api/v1/treasury/charges/manual/bulk/:jobId

**Método:** `GET`
**Ruta:** `/api/v1/treasury/charges/manual/bulk/:jobId`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:charges:read`
**Caso de Uso:** UC-020
**Entidades:** ENT-015

#### Path Parameters

| Parámetro | Tipo               | Descripción                   |
| --------- | ------------------ | ----------------------------- |
| jobId     | `string` (UUID v4) | ID del job de creación masiva |

#### Response 200

`BulkChargeJobStatusDto`:

| Campo                | Tipo                       | Descripción                                                            |
| -------------------- | -------------------------- | ---------------------------------------------------------------------- |
| jobId                | `string` (UUID)            | ID del job                                                             |
| status               | `string`                   | Estado (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `ROLLED_BACK`) |
| totalRequested       | `number`                   | Total de cargos solicitados                                            |
| totalCreated         | `number`                   | Cargos creados exitosamente                                            |
| totalFailed          | `number`                   | Cargos fallidos                                                        |
| totalAmount          | `number`                   | Importe total creado en centavos                                       |
| totalAmountFormatted | `string`                   | Importe formateado                                                     |
| errors               | `Array<{memberId, error}>` | Detalle de errores (si los hay)                                        |
| completedAt          | `Date\|null`               | Fecha de finalización                                                  |

#### Errores

| Status | Código | Condición         |
| ------ | ------ | ----------------- |
| 404    | -      | Job no encontrado |

---

### EP-074: GET /api/v1/treasury/sepa/config

**Método:** `GET`
**Ruta:** `/api/v1/treasury/sepa/config`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-023 (Generación de remesas SEPA)
**Entidades:** ENT-019

#### Response 200

`SepaConfigResponseDto`:

| Campo           | Tipo           | Descripción                                                 |
| --------------- | -------------- | ----------------------------------------------------------- |
| creditorId      | `string\|null` | Identificador de acreedor SEPA (formato `ESxxyyyCIFFFFFFF`) |
| creditorName    | `string\|null` | Nombre del acreedor                                         |
| creditorAddress | `string\|null` | Dirección del acreedor                                      |
| creditorIban    | `string\|null` | IBAN de la cuenta de cobros                                 |
| configured      | `boolean`      | Si la configuración está completa                           |

#### Errores

| Status | Código | Condición                                       |
| ------ | ------ | ----------------------------------------------- |
| 404    | -      | Configuración SEPA no encontrada para el tenant |

---

### EP-075: PUT /api/v1/treasury/sepa/config

**Método:** `PUT`
**Ruta:** `/api/v1/treasury/sepa/config`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:update`
**Caso de Uso:** UC-023
**Entidades:** ENT-019

#### Request Body

| Campo           | Tipo     | Requerido | Descripción                                                                            |
| --------------- | -------- | --------- | -------------------------------------------------------------------------------------- |
| creditorId      | `string` | Sí        | Identificador de acreedor SEPA (validado con algoritmo mod-97, 18 chars, prefijo `ES`) |
| creditorName    | `string` | Sí        | Nombre del acreedor (max 70 chars)                                                     |
| creditorAddress | `string` | Sí        | Dirección del acreedor                                                                 |
| creditorIban    | `string` | Sí        | IBAN de la cuenta de cobros                                                            |

#### Response 200

`SepaConfigResponseDto` (ver EP-074).

#### Errores

| Status | Código | Condición                                                                             |
| ------ | ------ | ------------------------------------------------------------------------------------- |
| 422    | -      | Identificador de acreedor inválido (formato, longitud o dígito de control incorrecto) |
| 422    | -      | IBAN inválido                                                                         |

---

### EP-076: POST /api/v1/treasury/member-accounts/:accountId/sepa-mandate

**Método:** `POST`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/sepa-mandate`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:create`
**Caso de Uso:** UC-023
**Entidades:** ENT-013, ENT-018

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Request Body

| Campo            | Tipo                        | Requerido | Descripción                                                       |
| ---------------- | --------------------------- | --------- | ----------------------------------------------------------------- |
| mandateReference | `string`                    | No        | Referencia del mandato (generada automáticamente si no se indica) |
| signatureDate    | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha de firma del mandato                                        |
| debtorIban       | `string`                    | Sí        | IBAN del deudor (cuenta bancaria del socio)                       |
| debtorName       | `string`                    | Sí        | Titular de la cuenta (max 70 chars)                               |
| mandateType      | `string`                    | Sí        | Tipo de mandato (`RECURRENT`, `ONE_OFF`)                          |
| documentUrl      | `string\|null`              | No        | URL del documento del mandato firmado (PDF)                       |

#### Response 201

`SepaMandateResponseDto`:

| Campo            | Tipo            | Descripción                                          |
| ---------------- | --------------- | ---------------------------------------------------- |
| id               | `string` (UUID) | ID del mandato                                       |
| mandateReference | `string`        | Referencia única del mandato (ej. `MAND-2025-00142`) |
| signatureDate    | `Date`          | Fecha de firma                                       |
| debtorIban       | `string`        | IBAN del deudor (enmascarado en consultas)           |
| debtorName       | `string`        | Titular                                              |
| mandateType      | `string`        | Tipo (`RECURRENT`, `ONE_OFF`)                        |
| status           | `string`        | Estado (`ACTIVE`, `REVOKED`, `EXPIRED`)              |
| lastDebitDate    | `Date\|null`    | Fecha del último adeudo                              |
| createdAt        | `Date`          | Fecha de registro                                    |

#### Errores

| Status | Código | Condición                                  |
| ------ | ------ | ------------------------------------------ |
| 404    | -      | Cuenta de socio no encontrada              |
| 409    | -      | Ya existe un mandato activo del mismo tipo |
| 422    | -      | IBAN inválido, fecha de firma futura       |

---

### EP-077: GET /api/v1/treasury/member-accounts/:accountId/sepa-mandate

**Método:** `GET`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/sepa-mandate`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-023
**Entidades:** ENT-013, ENT-018

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |

#### Response 200

`SepaMandateResponseDto` (ver EP-076) o array de mandatos si el socio tiene historial.

#### Errores

| Status | Código | Condición                                          |
| ------ | ------ | -------------------------------------------------- |
| 404    | -      | Cuenta de socio no encontrada o sin mandato activo |

---

### EP-078: DELETE /api/v1/treasury/member-accounts/:accountId/sepa-mandate/:mandateId

**Método:** `DELETE`
**Ruta:** `/api/v1/treasury/member-accounts/:accountId/sepa-mandate/:mandateId`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:update`
**Caso de Uso:** UC-023
**Entidades:** ENT-013, ENT-018

#### Path Parameters

| Parámetro | Tipo               | Descripción              |
| --------- | ------------------ | ------------------------ |
| accountId | `string` (UUID v4) | ID de la cuenta de socio |
| mandateId | `string` (UUID v4) | ID del mandato a revocar |

#### Response 204

Sin cuerpo de respuesta.

#### Errores

| Status | Código | Condición                      |
| ------ | ------ | ------------------------------ |
| 404    | -      | Cuenta o mandato no encontrado |
| 409    | -      | Mandato ya revocado o expirado |

---

### EP-079: POST /api/v1/treasury/sepa-remittances/preview

**Método:** `POST`
**Ruta:** `/api/v1/treasury/sepa-remittances/preview`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-023
**Entidades:** ENT-013, ENT-015, ENT-018, ENT-019

#### Request Body

| Campo           | Tipo                        | Requerido | Descripción                                                                 |
| --------------- | --------------------------- | --------- | --------------------------------------------------------------------------- |
| collectionDate  | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha de cobro (mínimo 3 días hábiles desde hoy)                            |
| concept         | `string`                    | No        | Concepto de la remesa (max 140 chars)                                       |
| chargeSelection | `string`                    | Sí        | Criterio de selección (`ALL_PENDING`, `OVERDUE`, `CURRENT_MONTH`, `MANUAL`) |
| chargeIds       | `string[]`                  | No        | IDs de cargos específicos (requerido si `chargeSelection = MANUAL`)         |

#### Response 200

`SepaRemittancePreviewDto`:

| Campo                  | Tipo       | Descripción                           |
| ---------------------- | ---------- | ------------------------------------- |
| totalDebits            | `number`   | Total de adeudos a incluir            |
| totalAmount            | `number`   | Importe total en centavos             |
| totalAmountFormatted   | `string`   | Importe formateado                    |
| firstSequenceCount     | `number`   | Adeudos tipo FRST                     |
| recurringSequenceCount | `number`   | Adeudos tipo RCUR                     |
| oneOffSequenceCount    | `number`   | Adeudos tipo OOFF                     |
| excludedCount          | `number`   | Cargos excluidos (sin mandato activo) |
| minimumSendDate        | `string`   | Fecha mínima de envío al banco        |
| warnings               | `string[]` | Advertencias de validación            |

#### Errores

| Status | Código | Condición                                         |
| ------ | ------ | ------------------------------------------------- |
| 400    | -      | Configuración SEPA no completada (FE-1)           |
| 422    | -      | Fecha de cobro con menos de 3 días hábiles (FE-2) |
| 422    | -      | Ningún cargo con mandato activo (FE-3)            |

---

### EP-080: POST /api/v1/treasury/sepa-remittances

**Método:** `POST`
**Ruta:** `/api/v1/treasury/sepa-remittances`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:create`
**Caso de Uso:** UC-023
**Entidades:** ENT-013, ENT-015, ENT-018, ENT-019

#### Request Body

| Campo           | Tipo                        | Requerido | Descripción                                                                 |
| --------------- | --------------------------- | --------- | --------------------------------------------------------------------------- |
| collectionDate  | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha de cobro (mínimo 3 días hábiles)                                      |
| concept         | `string`                    | No        | Concepto de la remesa (max 140 chars)                                       |
| chargeSelection | `string`                    | Sí        | Criterio de selección (`ALL_PENDING`, `OVERDUE`, `CURRENT_MONTH`, `MANUAL`) |
| chargeIds       | `string[]`                  | No        | IDs de cargos específicos (requerido si `chargeSelection = MANUAL`)         |

#### Response 201

`SepaRemittanceResponseDto`:

| Campo                | Tipo            | Descripción                               |
| -------------------- | --------------- | ----------------------------------------- |
| id                   | `string` (UUID) | ID de la remesa                           |
| remittanceId         | `string`        | ID legible (ej. `REMESA-2025-0204-001`)   |
| status               | `string`        | Estado (`GENERATED`, `SENT`, `PROCESSED`) |
| collectionDate       | `Date`          | Fecha de cobro                            |
| concept              | `string\|null`  | Concepto                                  |
| totalDebits          | `number`        | Total de adeudos                          |
| totalAmount          | `number`        | Importe total en centavos                 |
| totalAmountFormatted | `string`        | Importe formateado                        |
| xmlFileUrl           | `string\|null`  | URL para descarga del XML (autenticada)   |
| createdAt            | `Date`          | Fecha de generación                       |

#### Errores

| Status | Código | Condición                                            |
| ------ | ------ | ---------------------------------------------------- |
| 400    | -      | Configuración SEPA no completada (FE-1)              |
| 422    | -      | Fecha insuficiente (FE-2), sin cargos válidos (FE-3) |
| 500    | -      | Error en generación del fichero XML (FE-4)           |

---

### EP-081: GET /api/v1/treasury/sepa-remittances

**Método:** `GET`
**Ruta:** `/api/v1/treasury/sepa-remittances`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-023
**Entidades:** ENT-019

#### Query Parameters

| Campo  | Tipo     | Requerido | Descripción                                           |
| ------ | -------- | --------- | ----------------------------------------------------- |
| status | `string` | No        | Filtrar por estado (`GENERATED`, `SENT`, `PROCESSED`) |
| year   | `number` | No        | Filtrar por año                                       |

#### Response 200

Array de `SepaRemittanceResponseDto` (ver EP-080), ordenadas por fecha DESC.

---

### EP-082: GET /api/v1/treasury/sepa-remittances/:id

**Método:** `GET`
**Ruta:** `/api/v1/treasury/sepa-remittances/:id`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-023
**Entidades:** ENT-019

#### Path Parameters

| Parámetro | Tipo               | Descripción     |
| --------- | ------------------ | --------------- |
| id        | `string` (UUID v4) | ID de la remesa |

#### Response 200

`SepaRemittanceDetailDto` con todos los adeudos incluidos:

| Campo                | Tipo             | Descripción                     |
| -------------------- | ---------------- | ------------------------------- |
| id                   | `string` (UUID)  | ID de la remesa                 |
| remittanceId         | `string`         | ID legible                      |
| status               | `string`         | Estado                          |
| collectionDate       | `Date`           | Fecha de cobro                  |
| concept              | `string\|null`   | Concepto                        |
| totalDebits          | `number`         | Total de adeudos                |
| totalAmount          | `number`         | Importe total en centavos       |
| totalAmountFormatted | `string`         | Importe formateado              |
| collectedAmount      | `number`         | Importe cobrado en centavos     |
| returnedAmount       | `number`         | Importe devuelto en centavos    |
| debits               | `SepaDebitDto[]` | Listado de adeudos individuales |
| createdAt            | `Date`           | Fecha de generación             |
| sentAt               | `Date\|null`     | Fecha de envío al banco         |

#### Errores

| Status | Código | Condición            |
| ------ | ------ | -------------------- |
| 404    | -      | Remesa no encontrada |

---

### EP-083: GET /api/v1/treasury/sepa-remittances/:id/download

**Método:** `GET`
**Ruta:** `/api/v1/treasury/sepa-remittances/:id/download`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-023
**Entidades:** ENT-019

#### Path Parameters

| Parámetro | Tipo               | Descripción     |
| --------- | ------------------ | --------------- |
| id        | `string` (UUID v4) | ID de la remesa |

#### Response 200

Binario `application/xml` con headers:

- `Content-Type: application/xml`
- `Content-Disposition: attachment; filename="remesa_{remittanceId}.xml"`
- `Content-Length: {n}`

#### Errores

| Status | Código | Condición                                              |
| ------ | ------ | ------------------------------------------------------ |
| 404    | -      | Remesa no encontrada                                   |
| 409    | -      | Fichero XML no disponible (error previo en generación) |

---

### EP-084: PATCH /api/v1/treasury/sepa-remittances/:id/mark-sent

**Método:** `PATCH`
**Ruta:** `/api/v1/treasury/sepa-remittances/:id/mark-sent`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:update`
**Caso de Uso:** UC-023
**Entidades:** ENT-019

#### Path Parameters

| Parámetro | Tipo               | Descripción     |
| --------- | ------------------ | --------------- |
| id        | `string` (UUID v4) | ID de la remesa |

#### Request Body

| Campo         | Tipo                        | Requerido | Descripción                           |
| ------------- | --------------------------- | --------- | ------------------------------------- |
| sentAt        | `string` (ISO `YYYY-MM-DD`) | No        | Fecha de envío (por defecto: hoy)     |
| bankReference | `string\|null`              | No        | Referencia proporcionada por el banco |

#### Response 200

`SepaRemittanceResponseDto` (ver EP-080) con `status = "SENT"`.

#### Errores

| Status | Código | Condición                                               |
| ------ | ------ | ------------------------------------------------------- |
| 404    | -      | Remesa no encontrada                                    |
| 409    | -      | Remesa ya marcada como enviada o en estado incompatible |

---

### EP-085: POST /api/v1/treasury/sepa-remittances/:id/returns

**Método:** `POST`
**Ruta:** `/api/v1/treasury/sepa-remittances/:id/returns`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:update`
**Caso de Uso:** UC-024 (Gestión de devoluciones SEPA)
**Entidades:** ENT-013, ENT-015, ENT-019

#### Path Parameters

| Parámetro | Tipo               | Descripción     |
| --------- | ------------------ | --------------- |
| id        | `string` (UUID v4) | ID de la remesa |

#### Request Body

| Campo          | Tipo                        | Requerido | Descripción                                                                    |
| -------------- | --------------------------- | --------- | ------------------------------------------------------------------------------ |
| debitId        | `string` (UUID)             | Sí        | ID del adeudo devuelto                                                         |
| returnDate     | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha de devolución                                                            |
| returnCode     | `string`                    | Sí        | Código de motivo SEPA (`AC01`, `AC04`, `AM04`, `AG01`, `MD01`, `MS02`, `MS03`) |
| bankFees       | `number`                    | No        | Gastos bancarios en centavos (por defecto: 0)                                  |
| chargeBankFees | `boolean`                   | No        | Si se repercuten los gastos al socio (por defecto: `false`)                    |
| notifyMember   | `boolean`                   | No        | Si se notifica al socio (por defecto: `true`)                                  |
| notes          | `string\|null`              | No        | Observaciones del tesorero                                                     |

#### Response 201

`SepaReturnResponseDto`:

| Campo              | Tipo            | Descripción                                                      |
| ------------------ | --------------- | ---------------------------------------------------------------- |
| id                 | `string` (UUID) | ID del registro de devolución                                    |
| debitId            | `string` (UUID) | ID del adeudo devuelto                                           |
| returnCode         | `string`        | Código SEPA de la devolución                                     |
| returnDate         | `Date`          | Fecha de devolución                                              |
| bankFees           | `number`        | Gastos bancarios en centavos                                     |
| bankFeesFormatted  | `string`        | Gastos formateados                                               |
| bankFeeChargeId    | `string\|null`  | ID del cargo de penalización creado (si `chargeBankFees = true`) |
| retryAllowed       | `boolean`       | Si el código permite reintento                                   |
| suggestedRetryDays | `number\|null`  | Días sugeridos para reintento                                    |
| mandateRevoked     | `boolean`       | Si el mandato fue revocado automáticamente (código MS02)         |

#### Errores

| Status | Código | Condición                                                                                 |
| ------ | ------ | ----------------------------------------------------------------------------------------- |
| 404    | -      | Remesa o adeudo no encontrado (FE-1)                                                      |
| 409    | -      | El adeudo ya tiene una devolución registrada                                              |
| 422    | -      | Código de retorno inválido, gastos bancarios mayores que el cargo (FE-2, con advertencia) |

---

### EP-086: POST /api/v1/treasury/sepa-remittances/:id/returns/:returnId/schedule-retry

**Método:** `POST`
**Ruta:** `/api/v1/treasury/sepa-remittances/:id/returns/:returnId/schedule-retry`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:update`
**Caso de Uso:** UC-024
**Entidades:** ENT-015, ENT-019

#### Path Parameters

| Parámetro | Tipo               | Descripción                   |
| --------- | ------------------ | ----------------------------- |
| id        | `string` (UUID v4) | ID de la remesa               |
| returnId  | `string` (UUID v4) | ID del registro de devolución |

#### Request Body

| Campo                  | Tipo                        | Requerido | Descripción                                                 |
| ---------------------- | --------------------------- | --------- | ----------------------------------------------------------- |
| retryDate              | `string` (ISO `YYYY-MM-DD`) | Sí        | Fecha programada para el reintento (mínimo 3 días hábiles)  |
| notifyMemberDaysBefore | `number`                    | No        | Días de antelación para notificar al socio (por defecto: 2) |

#### Response 200

| Campo     | Tipo            | Descripción                                      |
| --------- | --------------- | ------------------------------------------------ |
| chargeId  | `string` (UUID) | ID del cargo marcado para reintento              |
| retryDate | `Date`          | Fecha programada del reintento                   |
| notifyAt  | `Date\|null`    | Fecha programada de notificación previa al socio |

#### Errores

| Status | Código | Condición                                           |
| ------ | ------ | --------------------------------------------------- |
| 404    | -      | Remesa o devolución no encontrada                   |
| 409    | -      | Reintento no permitido para este código SEPA (FE-3) |
| 409    | -      | Límite de 3 reintentos alcanzado (FA-2)             |
| 422    | -      | Fecha de reintento insuficiente                     |

---

### EP-087: GET /api/v1/treasury/sepa-remittances/:id/returns/report

**Método:** `GET`
**Ruta:** `/api/v1/treasury/sepa-remittances/:id/returns/report`
**Autenticación:** JWT + RBAC
**Permisos:** `treasury:sepa:read`
**Caso de Uso:** UC-024
**Entidades:** ENT-019

#### Path Parameters

| Parámetro | Tipo               | Descripción     |
| --------- | ------------------ | --------------- |
| id        | `string` (UUID v4) | ID de la remesa |

#### Response 200

`SepaReturnReportDto`:

| Campo                        | Tipo                                                      | Descripción                                                  |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| remittanceId                 | `string`                                                  | ID legible de la remesa                                      |
| totalReturns                 | `number`                                                  | Total de devoluciones                                        |
| totalReturnedAmount          | `number`                                                  | Importe total devuelto en centavos                           |
| totalReturnedAmountFormatted | `string`                                                  | Importe formateado                                           |
| totalBankFees                | `number`                                                  | Total gastos bancarios en centavos                           |
| returnRate                   | `number`                                                  | Tasa de devolución (porcentaje)                              |
| returnsByCode                | `Array<{code, description, count, amount, retryAllowed}>` | Devoluciones agrupadas por código SEPA                       |
| returns                      | `SepaReturnDetailDto[]`                                   | Detalle individual de cada devolución con acciones sugeridas |

#### Errores

| Status | Código | Condición            |
| ------ | ------ | -------------------- |
| 404    | -      | Remesa no encontrada |

---

## 5. BC-Events

> **Estado del BC:** Fuera de scope MVP (Fase 1). Los endpoints de este BC se definirán en detalle cuando entre en scope. Se documentan placeholders por UC para mantener la trazabilidad con la especificación funcional.

### EP-088: Placeholder - UC-028 (Registro y Configuración de Eventos)

**Descripción:** Endpoints CRUD para crear, editar, publicar y cancelar eventos, incluyendo configuración de tipos de evento por tenant y gestión de formularios de inscripción personalizados. Vinculado a UC-028.

---

### EP-089: Placeholder - UC-029 (Calendario y Sincronización)

**Descripción:** Endpoints para consultar el calendario de eventos con múltiples vistas, filtros por tipo, exportación de ficheros `.ics` por evento y generación de URL de suscripción iCal personalizada por socio. Vinculado a UC-029.

---

### EP-090: Placeholder - UC-030 (Inscripciones Online)

**Descripción:** Endpoints para que socios se inscriban a eventos (con o sin pago), gestionen acompañantes, modifiquen su inscripción y cancelen con gestión de reembolsos según política del evento. Vinculado a UC-030.

---

### EP-091: Placeholder - UC-031 (Control de Aforo y Listas de Espera)

**Descripción:** Endpoints para consultar disponibilidad de plazas en tiempo real, gestionar inscripciones en lista de espera y reapertura manual de inscripciones; operaciones mayormente manejadas por scheduled jobs internos. Vinculado a UC-031.

---

### EP-092: Placeholder - UC-032 (Check-in y Control de Asistencia)

**Descripción:** Endpoints para registrar asistencia por escaneo de QR o marcado manual, sincronizar check-ins offline, consultar informes de asistencia y exportar listados de asistencia a PDF/Excel para justificación de subvenciones. Vinculado a UC-032.

---

### EP-093: Placeholder - UC-033 (Eventos Específicos: Comidas Populares)

**Descripción:** Endpoints especializados para comidas populares de peñas: configuración de menús con cupos independientes, registro de alergias, generación de listados consolidados para catering y exportación de cambios de última hora. Vinculado a UC-033.

---

### EP-094: Placeholder - UC-034 (Eventos Específicos: Procesiones de Cofradías)

**Descripción:** Endpoints para generación automática de papeletas de sitio por antigüedad, gestión de reservas de insignias y varas procesionales, y publicación programada de listas (Viernes de Dolores). Vinculado a UC-034.

---

### EP-095: Placeholder - UC-035 (Eventos Específicos: Cuadrillas de Costaleros)

**Descripción:** Endpoints para gestionar cuadrillas de costaleros (igualá digital, asignación a trabajaderas con validación de homogeneidad de alturas) y convocar ensayos con control de confirmaciones de asistencia. Vinculado a UC-035.

---

### EP-096: Placeholder - UC-036 (Eventos Específicos: Cultos de Cofradías)

**Descripción:** Endpoints para crear series de cultos periódicos (novenas, triduos, quinarios), exportar calendarios iCal para parroquias y diócesis, y gestionar turnos de besamanos con control de aforo. Vinculado a UC-036.

---

### EP-097: Placeholder - UC-037 (Eventos Específicos: Competiciones Deportivas)

**Descripción:** Endpoints para gestionar calendarios de partidos (importación masiva desde Excel federativo), convocar jugadores, registrar sanciones acumuladas automáticamente y registrar resultados con estadísticas individuales. Vinculado a UC-037.

---

### EP-098: Placeholder - UC-038 (Valoraciones y Feedback de Eventos)

**Descripción:** Endpoints para registrar valoraciones post-evento (1-5 estrellas por aspecto), consultar estadísticas de satisfacción y acceder a comparativas históricas de feedback entre eventos similares. Vinculado a UC-038.

---

## 6. BC-Communication

> **Estado del BC:** Fuera de scope MVP (Fase 1). Los endpoints de este BC se definirán en detalle cuando entre en scope. Se documentan placeholders por UC para mantener la trazabilidad con la especificación funcional.

### EP-099: Placeholder - UC-039 (Envío de Comunicaciones por Email)

**Descripción:** Endpoints para crear comunicaciones masivas por email con segmentación de destinatarios, adjuntos, previsualización y seguimiento de estado de envío en background. Vinculado a UC-039.

---

### EP-100: Placeholder - UC-040 (Envío de SMS para Urgencias)

**Descripción:** Endpoints para enviar SMS urgentes a grupos reducidos con verificación de crédito disponible, cálculo de coste estimado y confirmación obligatoria antes del envío. Vinculado a UC-040.

---

### EP-101: Placeholder - UC-041 (Notificaciones Push vía PWA)

**Descripción:** Endpoints para registrar y gestionar suscripciones push de socios con PWA instalada, y enviar notificaciones push segmentadas con soporte de acciones rápidas. Vinculado a UC-041.

---

### EP-102: Placeholder - UC-042 (Gestión de Plantillas de Comunicación)

**Descripción:** Endpoints CRUD para el catálogo de plantillas de comunicación (sistema e-mail y personalizadas), con validación de variables Handlebars y previsualización con datos de socio real. Vinculado a UC-042.

---

### EP-103: Placeholder - UC-043 (Segmentación de Destinatarios)

**Descripción:** Endpoints para resolver y guardar segmentos de destinatarios mediante criterios combinables (tipo de socio, estado de pago, antigüedad, asistencia a eventos), con conteo en tiempo real y previsualización de la lista resultante. Vinculado a UC-043.

---

### EP-104: Placeholder - UC-044 (Programación de Envíos)

**Descripción:** Endpoints para programar comunicaciones para fecha y hora futura, cancelar envíos programados pendientes y consultar el listado de comunicaciones en estado "Programado". Vinculado a UC-044.

---

### EP-105: Placeholder - UC-045 (Histórico y Tracking de Comunicaciones)

**Descripción:** Endpoints para consultar el histórico paginado de comunicaciones enviadas, obtener estadísticas de entrega y apertura, registrar aperturas mediante pixel de tracking y procesar webhooks de rebote de SendGrid. Vinculado a UC-045.

---

### EP-106: Placeholder - UC-046 (Tablón de Anuncios Interno)

**Descripción:** Endpoints CRUD para publicar y gestionar anuncios en el tablón del portal del socio, con soporte de imagen destacada, anuncios fijados (pin), expiración automática y marcado de "leído" por socio. Vinculado a UC-046.

---

### EP-107: Placeholder - UC-047 (Comunicaciones Automáticas vía Event Handlers)

**Descripción:** Endpoints de configuración para activar/desactivar notificaciones automáticas por tenant (bienvenida, avisos de pago, recordatorios de evento) y ajustar parámetros como días de antelación; el envío en sí es disparado por eventos de dominio de otros BCs. Vinculado a UC-047.

---

## 7. BC-Documents

> **Estado del BC:** Fuera de scope MVP (Fase 1). Los endpoints de este BC se definirán en detalle cuando entre en scope. Se documentan placeholders por UC para mantener la trazabilidad con la especificación funcional.

### EP-108: Placeholder - UC-048 (Gestión de Libro de Actas Digital)

**Descripción:** Endpoints CRUD para crear, redactar y aprobar actas con numeración correlativa automática por ejercicio, plantillas predefinidas por tipo de reunión e inmutabilidad garantizada tras aprobación. Vinculado a UC-048.

---

### EP-109: Placeholder - UC-049 (Registro de Asistentes y Cálculo de Quórum)

**Descripción:** Endpoints para registrar asistentes a reuniones con soporte de delegaciones de voto, calcular quórum automáticamente según configuración estatutaria y generar hoja de firmas en PDF. Vinculado a UC-049.

---

### EP-110: Placeholder - UC-050 (Archivo Histórico y Consulta de Actas)

**Descripción:** Endpoints para consultar el archivo histórico de actas aprobadas con búsqueda full-text, filtros por tipo y fecha, exportar actas a PDF oficial (con o sin marca de agua "COPIA") y descargar múltiples actas en ZIP. Vinculado a UC-050.

---

### EP-111: Placeholder - UC-051 (Repositorio Centralizado de Documentos)

**Descripción:** Endpoints CRUD para el repositorio documental de la entidad con estructura de carpetas predefinida, metadatos enriquecidos (etiquetas, descripción), deduplicación por hash SHA-256 y gestión de límites de almacenamiento por plan. Vinculado a UC-051.

---

### EP-112: Placeholder - UC-052 (Subida y Previsualización de Documentos)

**Descripción:** Endpoints para subir documentos multi-formato (PDF, Office, imágenes) con validación de tamaño, obtener URLs presignadas para previsualización inline y generar thumbnails de PDFs e imágenes. Vinculado a UC-052.

---

### EP-113: Placeholder - UC-053 (Búsqueda y Filtrado de Documentos)

**Descripción:** Endpoint de búsqueda multi-criterio (nombre, descripción, etiquetas, categoría, tipo de archivo, autor, rango de fechas) con sistema de facetas para refinamiento y soporte opcional de búsqueda full-text en contenido de PDFs. Vinculado a UC-053.

---

### EP-114: Placeholder - UC-054 (Control de Permisos y Límites de Almacenamiento)

**Descripción:** Endpoints para configurar permisos de lectura/escritura por carpeta y por rol, consultar el dashboard de uso de almacenamiento y recibir alertas automáticas al alcanzar umbrales del plan. Vinculado a UC-054.

---

### EP-115: Placeholder - UC-055 (Control de Versiones y OCR Avanzado)

**Descripción:** Endpoints para gestionar versiones de documentos con historial completo y restauración, y procesar documentos escaneados con OCR para extracción automática de datos de facturas vinculables a BC-Treasury. Vinculado a UC-055.

---

## 8. Transversal

> Esta sección recoge endpoints transversales que no pertenecen a un único Bounded Context: la importación masiva de socios (UC-056, Fase 2) y el reporting/dashboard (UC-064 y UC-065, Fase 3). Se documentan en formato de endpoint pendiente porque corresponden a UCs Must o Should que ya tienen diseño funcional pero cuya implementación queda fuera del MVP.

---

### EP-116: POST /api/v1/imports/members

**Método:** `POST`
**Ruta:** `/api/v1/imports/members`
**Autenticación:** JWT + RBAC
**Permisos:** `socios:import`
**Caso de Uso:** UC-056
**Entidades:** ENT-009 (Member)

**Descripción:** Subida del archivo Excel (.xlsx, .xls) o CSV con el listado de socios a importar. El sistema analiza la estructura del archivo, detecta las columnas disponibles y devuelve un `jobId` para el proceso de importación asistido.

#### Request Body

```
Content-Type: multipart/form-data

file: <archivo Excel o CSV, máx. 10 MB>
```

#### Response 202

```json
{
  "jobId": "uuid",
  "fileName": "socios_2025.xlsx",
  "totalRows": 342,
  "detectedColumns": ["nombre", "apellidos", "dni", "email", "telefono", "fechaAlta"],
  "status": "pending_mapping"
}
```

#### Errores

| Código | Descripción                                     |
| ------ | ----------------------------------------------- |
| 400    | Formato de archivo no soportado o archivo vacío |
| 413    | Archivo supera el límite de 10 MB               |
| 403    | Usuario sin permiso `socios:import`             |
| 422    | Archivo corrupto o sin datos legibles           |

---

### EP-117: POST /api/v1/imports/members/:jobId/validate

**Método:** `POST`
**Ruta:** `/api/v1/imports/members/:jobId/validate`
**Autenticación:** JWT + RBAC
**Permisos:** `socios:import`
**Caso de Uso:** UC-056
**Entidades:** ENT-009 (Member)

**Descripción:** Envía el mapeo de columnas del archivo a los campos del dominio (nombre, apellidos, DNI, email, etc.) y desencadena la validación exhaustiva de todos los registros. Devuelve el resultado de la validación con errores por fila y un resumen de duplicados detectados.

#### Request Body

```json
{
  "columnMapping": {
    "nombre": "Nombre",
    "apellidos": "Apellidos y nombre",
    "dni": "N.I.F.",
    "email": "Correo",
    "telefono": "Teléfono móvil",
    "fechaAlta": "Fecha Alta"
  },
  "duplicateStrategy": "ignore",
  "saveAsTemplate": false,
  "templateName": null
}
```

#### Response 200

```json
{
  "jobId": "uuid",
  "status": "validated",
  "summary": {
    "totalRows": 342,
    "validRows": 330,
    "invalidRows": 8,
    "duplicates": 4
  },
  "errors": [
    { "row": 14, "field": "dni", "value": "12345678", "error": "DNI sin letra de control válida" },
    { "row": 27, "field": "email", "value": "no-es-email", "error": "Formato de email inválido" }
  ],
  "duplicates": [
    {
      "row": 45,
      "field": "dni",
      "value": "12345678Z",
      "existingMemberId": "uuid",
      "existingName": "Juan García López"
    }
  ]
}
```

#### Errores

| Código | Descripción                                                          |
| ------ | -------------------------------------------------------------------- |
| 404    | `jobId` no encontrado o expirado                                     |
| 400    | Mapeo de columnas inválido o incompleto (faltan campos obligatorios) |
| 403    | Usuario sin permiso `socios:import`                                  |

---

### EP-118: POST /api/v1/imports/members/:jobId/execute

**Método:** `POST`
**Ruta:** `/api/v1/imports/members/:jobId/execute`
**Autenticación:** JWT + RBAC
**Permisos:** `socios:import`
**Caso de Uso:** UC-056
**Entidades:** ENT-009 (Member)

**Descripción:** Ejecuta la importación de los registros validados. Para archivos con más de 500 registros, el procesamiento es asíncrono mediante Bull Queue con progreso consultable. Para archivos menores, la respuesta es síncrona.

#### Request Body

```json
{
  "importOnlyValid": true,
  "confirmDuplicateOverwrite": false
}
```

#### Response 202 (importación asíncrona, >500 registros)

```json
{
  "jobId": "uuid",
  "status": "processing",
  "message": "Importación en progreso. Consulte el estado con GET /api/v1/imports/members/:jobId/status"
}
```

#### Response 200 (importación síncrona, ≤500 registros)

```json
{
  "jobId": "uuid",
  "status": "completed",
  "imported": 330,
  "skipped": 8,
  "updated": 0,
  "errors": []
}
```

#### Errores

| Código | Descripción                                       |
| ------ | ------------------------------------------------- |
| 404    | `jobId` no encontrado o expirado                  |
| 409    | El job ya fue ejecutado previamente               |
| 422    | Validación no completada: ejecutar EP-117 primero |
| 403    | Usuario sin permiso `socios:import`               |

---

### EP-119: GET /api/v1/imports/members/:jobId/status

**Método:** `GET`
**Ruta:** `/api/v1/imports/members/:jobId/status`
**Autenticación:** JWT + RBAC
**Permisos:** `socios:import`
**Caso de Uso:** UC-056
**Entidades:** ENT-009 (Member)

**Descripción:** Consulta el estado de un job de importación en curso o completado, incluyendo el progreso porcentual para importaciones asíncronas. También devuelve el informe final descargable cuando el job está completado.

#### Response 200

```json
{
  "jobId": "uuid",
  "status": "processing",
  "progress": {
    "processed": 180,
    "total": 330,
    "percentage": 54.5
  },
  "startedAt": "2025-06-15T09:00:00Z",
  "completedAt": null,
  "result": null
}
```

#### Response 200 (completado)

```json
{
  "jobId": "uuid",
  "status": "completed",
  "progress": { "processed": 330, "total": 330, "percentage": 100 },
  "startedAt": "2025-06-15T09:00:00Z",
  "completedAt": "2025-06-15T09:00:45Z",
  "result": {
    "imported": 330,
    "skipped": 8,
    "updated": 0,
    "reportUrl": "/api/v1/imports/members/uuid/report"
  }
}
```

#### Errores

| Código | Descripción                                |
| ------ | ------------------------------------------ |
| 404    | `jobId` no encontrado o expirado (TTL 24h) |
| 403    | Usuario sin permiso `socios:import`        |

---

### EP-120: GET /api/v1/dashboard/kpis

**Método:** `GET`
**Ruta:** `/api/v1/dashboard/kpis`
**Autenticación:** JWT + RBAC
**Permisos:** `dashboard:read`
**Caso de Uso:** UC-064
**Entidades:** ENT-009 (Member), ENT-013 (MemberAccount), ENT-015 (Charge), ENT-016 (Payment)

**Descripción:** Devuelve los KPIs principales del dashboard adaptados al rol del usuario autenticado. Los datos se sirven desde caché Redis con TTL de 5 minutos. Cada widget es independiente; si un BC no responde, su widget retorna con `status: "error"` sin bloquear el resto.

#### Query Parameters

| Parámetro      | Tipo     | Requerido | Descripción                                                                       |
| -------------- | -------- | --------- | --------------------------------------------------------------------------------- |
| `period`       | `string` | No        | Período de referencia: `today`, `week`, `month`, `fiscal_year` (defecto: `month`) |
| `fiscalYearId` | `uuid`   | No        | ID del ejercicio para comparativas (defecto: ejercicio activo)                    |

#### Response 200

```json
{
  "period": "month",
  "generatedAt": "2025-06-15T09:00:00Z",
  "fromCache": true,
  "widgets": {
    "members": {
      "status": "ok",
      "total": 342,
      "active": 318,
      "pendingPayment": 24,
      "newThisPeriod": 5,
      "churnThisPeriod": 2
    },
    "treasury": {
      "status": "ok",
      "collectedThisPeriod": 8750.0,
      "pendingCharges": 2100.0,
      "delinquentCount": 12,
      "currency": "EUR"
    },
    "events": {
      "status": "ok",
      "upcomingCount": 3,
      "nextEvent": {
        "id": "uuid",
        "name": "Asamblea General Ordinaria 2025",
        "date": "2025-06-28T18:00:00Z",
        "registeredCount": 45,
        "availableSlots": 55
      }
    },
    "alerts": {
      "status": "ok",
      "items": [
        { "type": "warning", "message": "12 socios con cuota pendiente de más de 30 días" },
        { "type": "info", "message": "Asamblea General en 13 días" }
      ]
    }
  }
}
```

#### Errores

| Código | Descripción                                           |
| ------ | ----------------------------------------------------- |
| 401    | Token inválido o expirado                             |
| 403    | Usuario sin permiso `dashboard:read`                  |
| 503    | Todos los BCs de datos no responden (degradado total) |

---

### EP-121: GET /api/v1/dashboard/analytics/member-evolution

**Método:** `GET`
**Ruta:** `/api/v1/dashboard/analytics/member-evolution`
**Autenticación:** JWT + RBAC
**Permisos:** `analytics:read`
**Caso de Uso:** UC-065
**Entidades:** ENT-009 (Member)

**Descripción:** Devuelve la serie temporal de evolución del número de socios por estado (activos, bajas, altas) agrupada por mes o año. Permite comparativas multi-ejercicio de hasta 3 años simultáneos.

#### Query Parameters

| Parámetro      | Tipo       | Requerido | Descripción                                                              |
| -------------- | ---------- | --------- | ------------------------------------------------------------------------ |
| `from`         | `date`     | No        | Fecha inicio del rango (defecto: inicio del ejercicio activo)            |
| `to`           | `date`     | No        | Fecha fin del rango (defecto: hoy)                                       |
| `groupBy`      | `string`   | No        | Agrupación: `month` (defecto) o `year`                                   |
| `compareYears` | `number[]` | No        | Años adicionales para comparativa (máx. 2 años extra, ej: `[2024,2023]`) |

#### Response 200

```json
{
  "period": { "from": "2025-01-01", "to": "2025-06-15" },
  "groupBy": "month",
  "fromCache": true,
  "series": {
    "2025": [
      { "period": "2025-01", "active": 310, "newRegistrations": 8, "cancellations": 2 },
      { "period": "2025-02", "active": 316, "newRegistrations": 9, "cancellations": 3 },
      { "period": "2025-03", "active": 318, "newRegistrations": 5, "cancellations": 3 },
      { "period": "2025-04", "active": 320, "newRegistrations": 4, "cancellations": 2 },
      { "period": "2025-05", "active": 318, "newRegistrations": 3, "cancellations": 5 }
    ],
    "2024": [{ "period": "2024-01", "active": 298, "newRegistrations": 7, "cancellations": 1 }]
  }
}
```

#### Errores

| Código | Descripción                                                                      |
| ------ | -------------------------------------------------------------------------------- |
| 400    | Rango de fechas inválido o `compareYears` supera el límite de 2 años adicionales |
| 403    | Usuario sin permiso `analytics:read`                                             |
| 408    | Query de agregación excede timeout de 5 segundos; reducir el rango de fechas     |

---

### EP-122: GET /api/v1/dashboard/analytics/revenue-evolution

**Método:** `GET`
**Ruta:** `/api/v1/dashboard/analytics/revenue-evolution`
**Autenticación:** JWT + RBAC
**Permisos:** `analytics:read`
**Caso de Uso:** UC-065
**Entidades:** ENT-015 (Charge), ENT-016 (Payment)

**Descripción:** Devuelve la serie temporal de recaudación mensual comparativa (ingresos cobrados vs. pendientes) con posibilidad de comparar el ejercicio actual contra ejercicios anteriores.

#### Query Parameters

| Parámetro      | Tipo     | Requerido | Descripción                                            |
| -------------- | -------- | --------- | ------------------------------------------------------ |
| `fiscalYearId` | `uuid`   | No        | Ejercicio de referencia (defecto: ejercicio activo)    |
| `compareWith`  | `uuid[]` | No        | IDs de ejercicios anteriores para comparativa (máx. 2) |
| `groupBy`      | `string` | No        | Agrupación: `month` (defecto) o `quarter`              |

#### Response 200

```json
{
  "fiscalYear": { "id": "uuid", "name": "Ejercicio 2025" },
  "groupBy": "month",
  "fromCache": true,
  "series": {
    "2025": [
      { "period": "2025-01", "collected": 3200.0, "pending": 450.0, "total": 3650.0 },
      { "period": "2025-02", "collected": 3100.0, "pending": 300.0, "total": 3400.0 },
      { "period": "2025-03", "collected": 2850.0, "pending": 600.0, "total": 3450.0 }
    ],
    "2024": [{ "period": "2024-01", "collected": 2900.0, "pending": 200.0, "total": 3100.0 }]
  },
  "summary": {
    "totalCollected": 9150.0,
    "totalPending": 1350.0,
    "currency": "EUR"
  }
}
```

#### Errores

| Código | Descripción                                                                     |
| ------ | ------------------------------------------------------------------------------- |
| 400    | `compareWith` supera el límite de 2 ejercicios adicionales                      |
| 403    | Usuario sin permiso `analytics:read` (requiere rol Tesorero o superior)         |
| 404    | `fiscalYearId` no pertenece al tenant                                           |
| 408    | Timeout en cálculo de agregaciones; reducir el período o número de comparativas |

---

### EP-123: GET /api/v1/dashboard/analytics/export

**Método:** `GET`
**Ruta:** `/api/v1/dashboard/analytics/export`
**Autenticación:** JWT + RBAC
**Permisos:** `analytics:read`
**Caso de Uso:** UC-065
**Entidades:** ENT-009 (Member), ENT-015 (Charge), ENT-016 (Payment)

**Descripción:** Exporta los gráficos y métricas del dashboard analítico en formato PDF para presentación en reuniones de junta directiva. El PDF incluye evolución de socios, recaudación y distribución de asistencia a eventos.

#### Query Parameters

| Parámetro       | Tipo       | Requerido | Descripción                                                                                         |
| --------------- | ---------- | --------- | --------------------------------------------------------------------------------------------------- |
| `fiscalYearId`  | `uuid`     | No        | Ejercicio a incluir en el informe (defecto: ejercicio activo)                                       |
| `includeCharts` | `string[]` | No        | Gráficos a incluir: `member-evolution`, `revenue-evolution`, `events-distribution` (defecto: todos) |

#### Response 200

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="dashboard-2025-06-15.pdf"

<contenido binario del PDF>
```

#### Errores

| Código | Descripción                                                                |
| ------ | -------------------------------------------------------------------------- |
| 400    | Parámetro `includeCharts` con valor inválido                               |
| 403    | Usuario sin permiso `analytics:read`                                       |
| 503    | Error al generar el PDF; datos de algunos BCs no disponibles temporalmente |

---

## 9. Trazabilidad

### EP → Caso de Uso

| EP     | Endpoint                                                                       | UC                    | BC               |
| ------ | ------------------------------------------------------------------------------ | --------------------- | ---------------- |
| EP-001 | GET /api/v1/health                                                             | N/A (infraestructura) | BC-Identity      |
| EP-002 | POST /api/v1/tenants                                                           | UC-001                | BC-Identity      |
| EP-003 | POST /api/v1/auth/login                                                        | UC-002                | BC-Identity      |
| EP-004 | POST /api/v1/auth/refresh                                                      | UC-002                | BC-Identity      |
| EP-005 | POST /api/v1/auth/logout                                                       | UC-002                | BC-Identity      |
| EP-006 | POST /api/v1/auth/switch-tenant                                                | UC-002                | BC-Identity      |
| EP-007 | GET /api/v1/auth/me                                                            | UC-002                | BC-Identity      |
| EP-008 | POST /api/v1/member-types                                                      | UC-008                | BC-Membership    |
| EP-009 | GET /api/v1/member-types                                                       | UC-008                | BC-Membership    |
| EP-010 | GET /api/v1/member-types/templates                                             | UC-008                | BC-Membership    |
| EP-011 | POST /api/v1/member-types/import-template                                      | UC-008                | BC-Membership    |
| EP-012 | GET /api/v1/member-types/:id                                                   | UC-008                | BC-Membership    |
| EP-013 | PUT /api/v1/member-types/:id                                                   | UC-008                | BC-Membership    |
| EP-014 | PATCH /api/v1/member-types/:id/deactivate                                      | UC-008                | BC-Membership    |
| EP-015 | POST /api/v1/fiscal-years                                                      | UC-010                | BC-Membership    |
| EP-016 | GET /api/v1/fiscal-years                                                       | UC-010                | BC-Membership    |
| EP-017 | GET /api/v1/fiscal-years/active                                                | UC-010                | BC-Membership    |
| EP-018 | GET /api/v1/fiscal-years/compare                                               | UC-010                | BC-Membership    |
| EP-019 | GET /api/v1/fiscal-years/:id                                                   | UC-010                | BC-Membership    |
| EP-020 | POST /api/v1/fiscal-years/:id/close                                            | UC-010                | BC-Membership    |
| EP-021 | POST /api/v1/members                                                           | UC-006                | BC-Membership    |
| EP-022 | GET /api/v1/members                                                            | UC-006                | BC-Membership    |
| EP-023 | GET /api/v1/members/:id                                                        | UC-006                | BC-Membership    |
| EP-024 | PUT /api/v1/members/:id                                                        | UC-006                | BC-Membership    |
| EP-025 | GET /api/v1/members/preconditions                                              | UC-011                | BC-Membership    |
| EP-026 | POST /api/v1/members/simple-registration                                       | UC-011                | BC-Membership    |
| EP-027 | GET /api/v1/members/check-dni/:documentType/:documentNumber                    | UC-011                | BC-Membership    |
| EP-028 | GET /api/v1/members/check-email/:email                                         | UC-011                | BC-Membership    |
| EP-029 | POST /api/v1/members/:id/status                                                | UC-007                | BC-Membership    |
| EP-030 | GET /api/v1/members/:id/status-history                                         | UC-007                | BC-Membership    |
| EP-031 | GET /api/v1/members/:id/available-transitions                                  | UC-007                | BC-Membership    |
| EP-032 | POST /api/v1/members/delinquency-check                                         | UC-007                | BC-Membership    |
| EP-033 | GET /api/v1/members/:id/leave-summary                                          | UC-013                | BC-Membership    |
| EP-034 | POST /api/v1/members/:id/voluntary-leave                                       | UC-013                | BC-Membership    |
| EP-035 | POST /api/v1/members/:id/nonpayment-leave                                      | UC-013                | BC-Membership    |
| EP-036 | GET /api/v1/members/:id/reinstatement-summary                                  | UC-013                | BC-Membership    |
| EP-037 | POST /api/v1/members/:id/reinstate                                             | UC-013                | BC-Membership    |
| EP-038 | POST /api/v1/treasury/fee-plans                                                | UC-017                | BC-Treasury      |
| EP-039 | GET /api/v1/treasury/fee-plans                                                 | UC-017                | BC-Treasury      |
| EP-040 | GET /api/v1/treasury/fee-plans/templates                                       | UC-017                | BC-Treasury      |
| EP-041 | POST /api/v1/treasury/fee-plans/import-template                                | UC-017                | BC-Treasury      |
| EP-042 | GET /api/v1/treasury/fee-plans/:id                                             | UC-017                | BC-Treasury      |
| EP-043 | PUT /api/v1/treasury/fee-plans/:id                                             | UC-017                | BC-Treasury      |
| EP-044 | PATCH /api/v1/treasury/fee-plans/:id/deactivate                                | UC-017                | BC-Treasury      |
| EP-045 | PATCH /api/v1/treasury/fee-plans/:id/activate                                  | UC-017                | BC-Treasury      |
| EP-046 | POST /api/v1/treasury/fee-plans/:id/link-member-types                          | UC-017                | BC-Treasury      |
| EP-047 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions                 | UC-018                | BC-Treasury      |
| EP-048 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions                  | UC-018                | BC-Treasury      |
| EP-049 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions/active           | UC-018                | BC-Treasury      |
| EP-050 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan | UC-018                | BC-Treasury      |
| EP-051 | PATCH /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount   | UC-018                | BC-Treasury      |
| EP-052 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close       | UC-018                | BC-Treasury      |
| EP-053 | POST /api/v1/treasury/charges/generate-monthly                                 | UC-019                | BC-Treasury      |
| EP-054 | GET /api/v1/treasury/charges/generation-log                                    | UC-019                | BC-Treasury      |
| EP-055 | GET /api/v1/treasury/member-accounts/:accountId/charges                        | UC-019                | BC-Treasury      |
| EP-056 | POST /api/v1/treasury/member-accounts/:accountId/charges/generate-subscription | UC-019                | BC-Treasury      |
| EP-057 | GET /api/v1/treasury/payments/:id/receipt                                      | UC-021                | BC-Treasury      |
| EP-058 | GET /api/v1/treasury/search-members                                            | UC-021                | BC-Treasury      |
| EP-059 | POST /api/v1/treasury/member-accounts/:accountId/payments                      | UC-021                | BC-Treasury      |
| EP-060 | POST /api/v1/treasury/member-accounts/:accountId/payments/multi                | UC-021                | BC-Treasury      |
| EP-061 | GET /api/v1/treasury/member-accounts/:accountId/payments                       | UC-021                | BC-Treasury      |
| EP-062 | GET /api/v1/treasury/member-accounts/:accountId/pending-charges                | UC-021                | BC-Treasury      |
| EP-063 | GET /api/v1/treasury/member-accounts/:accountId/balance                        | UC-021                | BC-Treasury      |
| EP-064 | GET /api/v1/roles                                                              | UC-004                | BC-Identity      |
| EP-065 | POST /api/v1/roles                                                             | UC-004                | BC-Identity      |
| EP-066 | GET /api/v1/roles/:id                                                          | UC-004                | BC-Identity      |
| EP-067 | PATCH /api/v1/roles/:id                                                        | UC-004                | BC-Identity      |
| EP-068 | DELETE /api/v1/roles/:id                                                       | UC-004                | BC-Identity      |
| EP-069 | POST /api/v1/roles/:id/clone                                                   | UC-004                | BC-Identity      |
| EP-070 | POST /api/v1/users/:id/role                                                    | UC-004                | BC-Identity      |
| EP-071 | POST /api/v1/treasury/member-accounts/:accountId/charges/manual                | UC-020                | BC-Treasury      |
| EP-072 | POST /api/v1/treasury/charges/manual/bulk                                      | UC-020                | BC-Treasury      |
| EP-073 | GET /api/v1/treasury/charges/manual/bulk/:jobId                                | UC-020                | BC-Treasury      |
| EP-074 | GET /api/v1/treasury/sepa/config                                               | UC-023                | BC-Treasury      |
| EP-075 | PUT /api/v1/treasury/sepa/config                                               | UC-023                | BC-Treasury      |
| EP-076 | POST /api/v1/treasury/member-accounts/:accountId/sepa-mandate                  | UC-023                | BC-Treasury      |
| EP-077 | GET /api/v1/treasury/member-accounts/:accountId/sepa-mandate                   | UC-023                | BC-Treasury      |
| EP-078 | DELETE /api/v1/treasury/member-accounts/:accountId/sepa-mandate/:mandateId     | UC-023                | BC-Treasury      |
| EP-079 | POST /api/v1/treasury/sepa-remittances/preview                                 | UC-023                | BC-Treasury      |
| EP-080 | POST /api/v1/treasury/sepa-remittances                                         | UC-023                | BC-Treasury      |
| EP-081 | GET /api/v1/treasury/sepa-remittances                                          | UC-023                | BC-Treasury      |
| EP-082 | GET /api/v1/treasury/sepa-remittances/:id                                      | UC-023                | BC-Treasury      |
| EP-083 | GET /api/v1/treasury/sepa-remittances/:id/download                             | UC-023                | BC-Treasury      |
| EP-084 | PATCH /api/v1/treasury/sepa-remittances/:id/mark-sent                          | UC-023                | BC-Treasury      |
| EP-085 | POST /api/v1/treasury/sepa-remittances/:id/returns                             | UC-024                | BC-Treasury      |
| EP-086 | POST /api/v1/treasury/sepa-remittances/:id/returns/:returnId/schedule-retry    | UC-024                | BC-Treasury      |
| EP-087 | GET /api/v1/treasury/sepa-remittances/:id/returns/report                       | UC-024                | BC-Treasury      |
| EP-088 | Placeholder - UC-028 (Registro y Configuración de Eventos)                     | UC-028                | BC-Events        |
| EP-089 | Placeholder - UC-029 (Calendario y Sincronización)                             | UC-029                | BC-Events        |
| EP-090 | Placeholder - UC-030 (Inscripciones Online)                                    | UC-030                | BC-Events        |
| EP-091 | Placeholder - UC-031 (Control de Aforo y Listas de Espera)                     | UC-031                | BC-Events        |
| EP-092 | Placeholder - UC-032 (Check-in y Control de Asistencia)                        | UC-032                | BC-Events        |
| EP-093 | Placeholder - UC-033 (Eventos Específicos: Comidas Populares)                  | UC-033                | BC-Events        |
| EP-094 | Placeholder - UC-034 (Eventos Específicos: Procesiones de Cofradías)           | UC-034                | BC-Events        |
| EP-095 | Placeholder - UC-035 (Eventos Específicos: Cuadrillas de Costaleros)           | UC-035                | BC-Events        |
| EP-096 | Placeholder - UC-036 (Eventos Específicos: Cultos de Cofradías)                | UC-036                | BC-Events        |
| EP-097 | Placeholder - UC-037 (Eventos Específicos: Competiciones Deportivas)           | UC-037                | BC-Events        |
| EP-098 | Placeholder - UC-038 (Valoraciones y Feedback de Eventos)                      | UC-038                | BC-Events        |
| EP-099 | Placeholder - UC-039 (Envío de Comunicaciones por Email)                       | UC-039                | BC-Communication |
| EP-100 | Placeholder - UC-040 (Envío de SMS para Urgencias)                             | UC-040                | BC-Communication |
| EP-101 | Placeholder - UC-041 (Notificaciones Push vía PWA)                             | UC-041                | BC-Communication |
| EP-102 | Placeholder - UC-042 (Gestión de Plantillas de Comunicación)                   | UC-042                | BC-Communication |
| EP-103 | Placeholder - UC-043 (Segmentación de Destinatarios)                           | UC-043                | BC-Communication |
| EP-104 | Placeholder - UC-044 (Programación de Envíos)                                  | UC-044                | BC-Communication |
| EP-105 | Placeholder - UC-045 (Histórico y Tracking de Comunicaciones)                  | UC-045                | BC-Communication |
| EP-106 | Placeholder - UC-046 (Tablón de Anuncios Interno)                              | UC-046                | BC-Communication |
| EP-107 | Placeholder - UC-047 (Comunicaciones Automáticas vía Event Handlers)           | UC-047                | BC-Communication |
| EP-108 | Placeholder - UC-048 (Gestión de Libro de Actas Digital)                       | UC-048                | BC-Documents     |
| EP-109 | Placeholder - UC-049 (Registro de Asistentes y Cálculo de Quórum)              | UC-049                | BC-Documents     |
| EP-110 | Placeholder - UC-050 (Archivo Histórico y Consulta de Actas)                   | UC-050                | BC-Documents     |
| EP-111 | Placeholder - UC-051 (Repositorio Centralizado de Documentos)                  | UC-051                | BC-Documents     |
| EP-112 | Placeholder - UC-052 (Subida y Previsualización de Documentos)                 | UC-052                | BC-Documents     |
| EP-113 | Placeholder - UC-053 (Búsqueda y Filtrado de Documentos)                       | UC-053                | BC-Documents     |
| EP-114 | Placeholder - UC-054 (Control de Permisos y Límites de Almacenamiento)         | UC-054                | BC-Documents     |
| EP-115 | Placeholder - UC-055 (Control de Versiones y OCR Avanzado)                     | UC-055                | BC-Documents     |
| EP-116 | POST /api/v1/imports/members                                                   | UC-056                | Transversal      |
| EP-117 | POST /api/v1/imports/members/:jobId/validate                                   | UC-056                | Transversal      |
| EP-118 | POST /api/v1/imports/members/:jobId/execute                                    | UC-056                | Transversal      |
| EP-119 | GET /api/v1/imports/members/:jobId/status                                      | UC-056                | Transversal      |
| EP-120 | GET /api/v1/dashboard/kpis                                                     | UC-064                | Transversal      |
| EP-121 | GET /api/v1/dashboard/analytics/member-evolution                               | UC-065                | Transversal      |
| EP-122 | GET /api/v1/dashboard/analytics/revenue-evolution                              | UC-065                | Transversal      |
| EP-123 | GET /api/v1/dashboard/analytics/export                                         | UC-065                | Transversal      |

### EP → Entidad (ENT)

| EP     | Endpoint                                                                       | ENT Principales                    | BC            |
| ------ | ------------------------------------------------------------------------------ | ---------------------------------- | ------------- |
| EP-002 | POST /api/v1/tenants                                                           | ENT-001, ENT-002                   | BC-Identity   |
| EP-003 | POST /api/v1/auth/login                                                        | ENT-002, ENT-003                   | BC-Identity   |
| EP-004 | POST /api/v1/auth/refresh                                                      | ENT-002                            | BC-Identity   |
| EP-005 | POST /api/v1/auth/logout                                                       | ENT-002                            | BC-Identity   |
| EP-006 | POST /api/v1/auth/switch-tenant                                                | ENT-001, ENT-002, ENT-003          | BC-Identity   |
| EP-007 | GET /api/v1/auth/me                                                            | ENT-002, ENT-003                   | BC-Identity   |
| EP-008 | POST /api/v1/member-types                                                      | ENT-007                            | BC-Membership |
| EP-009 | GET /api/v1/member-types                                                       | ENT-007                            | BC-Membership |
| EP-010 | GET /api/v1/member-types/templates                                             | ENT-007                            | BC-Membership |
| EP-011 | POST /api/v1/member-types/import-template                                      | ENT-007                            | BC-Membership |
| EP-012 | GET /api/v1/member-types/:id                                                   | ENT-007                            | BC-Membership |
| EP-013 | PUT /api/v1/member-types/:id                                                   | ENT-007                            | BC-Membership |
| EP-014 | PATCH /api/v1/member-types/:id/deactivate                                      | ENT-007                            | BC-Membership |
| EP-015 | POST /api/v1/fiscal-years                                                      | ENT-008                            | BC-Membership |
| EP-016 | GET /api/v1/fiscal-years                                                       | ENT-008                            | BC-Membership |
| EP-017 | GET /api/v1/fiscal-years/active                                                | ENT-008                            | BC-Membership |
| EP-018 | GET /api/v1/fiscal-years/compare                                               | ENT-008                            | BC-Membership |
| EP-019 | GET /api/v1/fiscal-years/:id                                                   | ENT-008                            | BC-Membership |
| EP-020 | POST /api/v1/fiscal-years/:id/close                                            | ENT-008                            | BC-Membership |
| EP-021 | POST /api/v1/members                                                           | ENT-009, ENT-007, ENT-008          | BC-Membership |
| EP-022 | GET /api/v1/members                                                            | ENT-009, ENT-007                   | BC-Membership |
| EP-023 | GET /api/v1/members/:id                                                        | ENT-009, ENT-007                   | BC-Membership |
| EP-024 | PUT /api/v1/members/:id                                                        | ENT-009                            | BC-Membership |
| EP-025 | GET /api/v1/members/preconditions                                              | ENT-007, ENT-008                   | BC-Membership |
| EP-026 | POST /api/v1/members/simple-registration                                       | ENT-009, ENT-007, ENT-008          | BC-Membership |
| EP-027 | GET /api/v1/members/check-dni/:documentType/:documentNumber                    | ENT-009                            | BC-Membership |
| EP-028 | GET /api/v1/members/check-email/:email                                         | ENT-009                            | BC-Membership |
| EP-029 | POST /api/v1/members/:id/status                                                | ENT-009, ENT-010                   | BC-Membership |
| EP-030 | GET /api/v1/members/:id/status-history                                         | ENT-009, ENT-010                   | BC-Membership |
| EP-031 | GET /api/v1/members/:id/available-transitions                                  | ENT-009                            | BC-Membership |
| EP-032 | POST /api/v1/members/delinquency-check                                         | ENT-009, ENT-010                   | BC-Membership |
| EP-033 | GET /api/v1/members/:id/leave-summary                                          | ENT-009, ENT-010                   | BC-Membership |
| EP-034 | POST /api/v1/members/:id/voluntary-leave                                       | ENT-009, ENT-010                   | BC-Membership |
| EP-035 | POST /api/v1/members/:id/nonpayment-leave                                      | ENT-009, ENT-010                   | BC-Membership |
| EP-036 | GET /api/v1/members/:id/reinstatement-summary                                  | ENT-009, ENT-010                   | BC-Membership |
| EP-037 | POST /api/v1/members/:id/reinstate                                             | ENT-009, ENT-010                   | BC-Membership |
| EP-038 | POST /api/v1/treasury/fee-plans                                                | ENT-011                            | BC-Treasury   |
| EP-039 | GET /api/v1/treasury/fee-plans                                                 | ENT-011                            | BC-Treasury   |
| EP-040 | GET /api/v1/treasury/fee-plans/templates                                       | ENT-011                            | BC-Treasury   |
| EP-041 | POST /api/v1/treasury/fee-plans/import-template                                | ENT-011                            | BC-Treasury   |
| EP-042 | GET /api/v1/treasury/fee-plans/:id                                             | ENT-011                            | BC-Treasury   |
| EP-043 | PUT /api/v1/treasury/fee-plans/:id                                             | ENT-011                            | BC-Treasury   |
| EP-044 | PATCH /api/v1/treasury/fee-plans/:id/deactivate                                | ENT-011                            | BC-Treasury   |
| EP-045 | PATCH /api/v1/treasury/fee-plans/:id/activate                                  | ENT-011                            | BC-Treasury   |
| EP-046 | POST /api/v1/treasury/fee-plans/:id/link-member-types                          | ENT-011                            | BC-Treasury   |
| EP-047 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions                 | ENT-013, ENT-014                   | BC-Treasury   |
| EP-048 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions                  | ENT-013, ENT-014                   | BC-Treasury   |
| EP-049 | GET /api/v1/treasury/member-accounts/:accountId/subscriptions/active           | ENT-013, ENT-014                   | BC-Treasury   |
| EP-050 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/change-plan | ENT-013, ENT-014                   | BC-Treasury   |
| EP-051 | PATCH /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/discount   | ENT-013, ENT-014                   | BC-Treasury   |
| EP-052 | POST /api/v1/treasury/member-accounts/:accountId/subscriptions/:id/close       | ENT-013, ENT-014                   | BC-Treasury   |
| EP-053 | POST /api/v1/treasury/charges/generate-monthly                                 | ENT-013, ENT-014, ENT-015          | BC-Treasury   |
| EP-054 | GET /api/v1/treasury/charges/generation-log                                    | ENT-015                            | BC-Treasury   |
| EP-055 | GET /api/v1/treasury/member-accounts/:accountId/charges                        | ENT-013, ENT-015                   | BC-Treasury   |
| EP-056 | POST /api/v1/treasury/member-accounts/:accountId/charges/generate-subscription | ENT-013, ENT-014, ENT-015          | BC-Treasury   |
| EP-057 | GET /api/v1/treasury/payments/:id/receipt                                      | ENT-016                            | BC-Treasury   |
| EP-058 | GET /api/v1/treasury/search-members                                            | ENT-009, ENT-013                   | BC-Treasury   |
| EP-059 | POST /api/v1/treasury/member-accounts/:accountId/payments                      | ENT-013, ENT-015, ENT-016          | BC-Treasury   |
| EP-060 | POST /api/v1/treasury/member-accounts/:accountId/payments/multi                | ENT-013, ENT-015, ENT-016          | BC-Treasury   |
| EP-061 | GET /api/v1/treasury/member-accounts/:accountId/payments                       | ENT-013, ENT-016                   | BC-Treasury   |
| EP-062 | GET /api/v1/treasury/member-accounts/:accountId/pending-charges                | ENT-013, ENT-015                   | BC-Treasury   |
| EP-063 | GET /api/v1/treasury/member-accounts/:accountId/balance                        | ENT-013, ENT-015, ENT-016          | BC-Treasury   |
| EP-064 | GET /api/v1/roles                                                              | ENT-004                            | BC-Identity   |
| EP-065 | POST /api/v1/roles                                                             | ENT-004                            | BC-Identity   |
| EP-066 | GET /api/v1/roles/:id                                                          | ENT-004                            | BC-Identity   |
| EP-067 | PATCH /api/v1/roles/:id                                                        | ENT-004                            | BC-Identity   |
| EP-068 | DELETE /api/v1/roles/:id                                                       | ENT-004, ENT-003                   | BC-Identity   |
| EP-069 | POST /api/v1/roles/:id/clone                                                   | ENT-004                            | BC-Identity   |
| EP-070 | POST /api/v1/users/:id/role                                                    | ENT-002, ENT-003, ENT-004          | BC-Identity   |
| EP-071 | POST /api/v1/treasury/member-accounts/:accountId/charges/manual                | ENT-013, ENT-015                   | BC-Treasury   |
| EP-072 | POST /api/v1/treasury/charges/manual/bulk                                      | ENT-009, ENT-013, ENT-015          | BC-Treasury   |
| EP-073 | GET /api/v1/treasury/charges/manual/bulk/:jobId                                | ENT-015                            | BC-Treasury   |
| EP-074 | GET /api/v1/treasury/sepa/config                                               | ENT-019                            | BC-Treasury   |
| EP-075 | PUT /api/v1/treasury/sepa/config                                               | ENT-019                            | BC-Treasury   |
| EP-076 | POST /api/v1/treasury/member-accounts/:accountId/sepa-mandate                  | ENT-013, ENT-018                   | BC-Treasury   |
| EP-077 | GET /api/v1/treasury/member-accounts/:accountId/sepa-mandate                   | ENT-013, ENT-018                   | BC-Treasury   |
| EP-078 | DELETE /api/v1/treasury/member-accounts/:accountId/sepa-mandate/:mandateId     | ENT-013, ENT-018                   | BC-Treasury   |
| EP-079 | POST /api/v1/treasury/sepa-remittances/preview                                 | ENT-013, ENT-015, ENT-018, ENT-019 | BC-Treasury   |
| EP-080 | POST /api/v1/treasury/sepa-remittances                                         | ENT-013, ENT-015, ENT-018, ENT-019 | BC-Treasury   |
| EP-081 | GET /api/v1/treasury/sepa-remittances                                          | ENT-019                            | BC-Treasury   |
| EP-082 | GET /api/v1/treasury/sepa-remittances/:id                                      | ENT-019                            | BC-Treasury   |
| EP-083 | GET /api/v1/treasury/sepa-remittances/:id/download                             | ENT-019                            | BC-Treasury   |
| EP-084 | PATCH /api/v1/treasury/sepa-remittances/:id/mark-sent                          | ENT-019                            | BC-Treasury   |
| EP-085 | POST /api/v1/treasury/sepa-remittances/:id/returns                             | ENT-013, ENT-015, ENT-019          | BC-Treasury   |
| EP-086 | POST /api/v1/treasury/sepa-remittances/:id/returns/:returnId/schedule-retry    | ENT-015, ENT-019                   | BC-Treasury   |
| EP-087 | GET /api/v1/treasury/sepa-remittances/:id/returns/report                       | ENT-019                            | BC-Treasury   |
| EP-116 | POST /api/v1/imports/members                                                   | ENT-009                            | Transversal   |
| EP-117 | POST /api/v1/imports/members/:jobId/validate                                   | ENT-009                            | Transversal   |
| EP-118 | POST /api/v1/imports/members/:jobId/execute                                    | ENT-009                            | Transversal   |
| EP-119 | GET /api/v1/imports/members/:jobId/status                                      | ENT-009                            | Transversal   |
| EP-120 | GET /api/v1/dashboard/kpis                                                     | ENT-009, ENT-013, ENT-015, ENT-016 | Transversal   |
| EP-121 | GET /api/v1/dashboard/analytics/member-evolution                               | ENT-009                            | Transversal   |
| EP-122 | GET /api/v1/dashboard/analytics/revenue-evolution                              | ENT-015, ENT-016                   | Transversal   |
| EP-123 | GET /api/v1/dashboard/analytics/export                                         | ENT-009, ENT-015, ENT-016          | Transversal   |

### Resumen por Bounded Context

| BC               | Implementados | Pendientes Fase 2 | Pendientes Fase 3 | Placeholders | Total   |
| ---------------- | ------------- | ----------------- | ----------------- | ------------ | ------- |
| BC-Identity      | 7             | 7                 | 0                 | 0            | 14      |
| BC-Membership    | 30            | 0                 | 0                 | 0            | 30      |
| BC-Treasury      | 26            | 17                | 0                 | 0            | 43      |
| BC-Events        | 0             | 0                 | 0                 | 11           | 11      |
| BC-Communication | 0             | 0                 | 0                 | 9            | 9       |
| BC-Documents     | 0             | 0                 | 0                 | 8            | 8       |
| Transversal      | 0             | 4                 | 4                 | 0            | 8       |
| **Total**        | **63**        | **28**            | **4**             | **28**       | **123** |

> Nota sobre BC-Identity: EP-001 (health check) se contabiliza como Implementado aunque su UC es N/A (es un endpoint de infraestructura).

### Resumen por Fase MVP

| Fase         | Endpoints | Estado        |
| ------------ | --------- | ------------- |
| Fase 1       | 63        | Implementados |
| Fase 2       | 28        | Pendientes    |
| Fase 3       | 4         | Pendientes    |
| Fuera de MVP | 28        | Placeholders  |
| **Total**    | **123**   |               |
