# Task 1 — UC-004: Gestión de roles y permisos (Backend)

## Información general

- **Fase:** 2
- **Tipo:** Backend
- **UC:** UC-004
- **Bounded Context:** BC-Identity
- **Application Service:** `RoleManagementService`
- **Aggregates:** `Role`, `User`, `TenantMembership`
- **Prioridad:** Must

## Alcance

### Incluido

- Aggregate `Role` con distinción entre roles de sistema (`is_system = true`) y personalizados
- Application Service `RoleManagementService` con operaciones: asignación de roles, creación de roles personalizados, clonación, modificación y eliminación
- Endpoint REST para CRUD de roles: `GET/POST/PUT/DELETE /api/v1/tenants/:tenantId/roles`
- Endpoint REST para asignación de roles: `POST /api/v1/tenants/:tenantId/users/:userId/role`
- Permisos granulares en formato `{module}:{resource}:{action}` (ADR-007)
- Guards de NestJS para verificación de permisos desde JWT claims
- Invalidación de Refresh Token al cambiar rol de un usuario (fuerza regeneración de JWT con nuevos claims)
- Protección de roles de sistema: inmutables, no eliminables
- Validación de unicidad de nombre de rol dentro del tenant
- Domain Events: `RoleCreated`, `RoleAssigned`, `RoleModified`, `RoleDeleted`
- Tests unitarios (dominio) + tests de integración (asignación completa con verificación de JWT)

### Excluido

- Frontend de gestión de roles (se implementa fuera del MVP Fase 2 frontend)
- Caché de permisos en Redis (optimización post-MVP; en MVP se leen desde JWT claims)
- Workflow de aprobación para creación de roles (el Presidente es único gestor)
- Permisos a nivel de registro individual (row-level security)
- Importación masiva de asignaciones de roles

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Estructura de módulos NestJS, Shared kernel, Guards base |
| **Fase 1 — UC-001 (Provisión de tenant)** | Aggregate `Tenant`, roles predefinidos seedeados, User admin creado |
| **Fase 1 — UC-002 (Autenticación)** | JWT con claims de permisos, Refresh Token mechanism, `AuthGuard` |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/identity/domain/aggregates/role.ts` existe con los roles de sistema seedeados (PRESIDENT, SECRETARY, TREASURER, BOARD_MEMBER, MEMBER)
- [ ] `api/src/identity/domain/aggregates/user.ts` existe con relación a `TenantMembership`
- [ ] `api/src/identity/infrastructure/guards/auth.guard.ts` existe y extrae permisos del JWT
- [ ] `api/src/identity/infrastructure/guards/permissions.guard.ts` existe y verifica `@RequirePermissions()` decorator
- [ ] El JWT incluye claims `permissions: string[]` y `role: string`
- [ ] El mecanismo de Refresh Token está implementado y funcional
- [ ] `api/prisma/tenant/schema.prisma` contiene modelos `Role`, `RolePermission`
- [ ] Los 5 roles de sistema están correctamente seedeados en la provisión de tenant (UC-001)

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| CRUD completo de roles personalizados | Frontend de gestión de roles (fuera MVP) |
| Endpoint de asignación de roles a usuarios | Frontend de administración de usuarios |
| Guards de permisos granulares actualizados | Todos los endpoints protegidos del sistema |
| Eventos `RoleAssigned`, `RoleCreated` | Auditoría, BC-Communication (notificación) |
| Catálogo de permisos disponibles | Frontend para checklist de permisos en creación de rol |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-004.md` | Flujo completo: roles predefinidos, roles personalizados, asignación, clonación |
| `us/us-004.md` | Criterios de aceptación: uso de roles predefinidos, asignación a usuarios |
| `us/us-005.md` | Criterios de aceptación: creación de roles personalizados con permisos selectivos |
| `bc/bc-identity.md` | Aggregates Role, User, TenantMembership — estructura e invariantes |
| `adr/adr-007.md` | Formato de permisos `{module}:{resource}:{action}`, RBAC granular |
| `adr/adr-006.md` | JWT con Refresh Tokens, claims de permisos |
| `adr/adr-001.md` | Monolito modular, guards por módulo |

## Puntos críticos

1. **Inmutabilidad de roles de sistema.** Los 5 roles predefinidos (PRESIDENT, SECRETARY, TREASURER, BOARD_MEMBER, MEMBER) tienen `is_system = true` y NO pueden modificarse ni eliminarse. Cualquier intento debe rechazarse con error descriptivo (FE-1). La única operación permitida sobre ellos es la asignación a usuarios.

2. **Invalidación de JWT al cambiar rol.** Cuando se asigna un nuevo rol a un usuario, los permisos del JWT actual quedan obsoletos. Se debe invalidar el Refresh Token del usuario afectado para forzar un nuevo login (o silenciosamente emitir nuevo JWT en el próximo refresh). Sin esta invalidación, el usuario opera con permisos del rol anterior hasta que expire el token.

3. **Catálogo de permisos exhaustivo.** El sistema debe mantener un catálogo estático de todos los permisos disponibles en formato `{module}:{resource}:{action}`. Este catálogo se usa en la UI para mostrar checkboxes al crear un rol personalizado. Debe cubrir todos los UCs del MVP. Ejemplo: `membership:members:create`, `treasury:fees:write`, `treasury:remittances:generate`.

4. **Eliminación de rol con usuarios asignados.** No se puede eliminar un rol personalizado si tiene usuarios asignados (FE-2). El sistema debe verificar la existencia de `TenantMembership` con ese `role_id` activo y bloquear la eliminación con mensaje indicando el conteo de usuarios afectados.

5. **Clonación de roles.** La clonación (FA-2) crea un rol personalizado copiando los permisos de un rol existente (incluidos roles de sistema). El nuevo rol recibe nombre sugerido (`{original} - Copia`) y es editable. Esto es la vía para "personalizar" un rol de sistema: clonar → modificar.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Permisos del JWT desactualizados tras cambio de rol | Alta | Alto | Invalidar Refresh Token del usuario inmediatamente. El frontend debe detectar 401 y redirigir a login |
| Catálogo de permisos incompleto | Media | Medio | Generar catálogo a partir de los decorators `@RequirePermissions()` existentes. Mantener lista centralizada |
| Roles huérfanos tras eliminación | Baja | Medio | Validación estricta: bloquear eliminación si hay usuarios asignados. Soft-delete preferible |
| Escalación de privilegios por rol personalizado | Baja | Alto | El Presidente es el único que puede crear/modificar roles. Validar que permisos asignados no excedan los del propio creador |

## Plan de implementación

### Paso 1: Capa de dominio — Ampliación del Aggregate Role

Ampliar en `api/src/identity/domain/aggregates/role.ts`:

- Extender el Aggregate `Role` existente (creado en UC-001 para roles de sistema) con métodos para roles personalizados:
  - `Role.createCustom(tenantId, name, description, permissions)`: factory method para roles personalizados con `is_system = false`
  - `Role.clone(newName)`: crea copia con nuevos permisos editables
  - `Role.updatePermissions(permissions)`: actualiza permisos (solo si `is_system = false`, invariante)
  - `Role.rename(newName)`: cambia nombre (solo si `is_system = false`)
- Value Object `Permission`: encapsula `{module}:{resource}:{action}` con validación de formato
- Domain Service `PermissionCatalog`: lista estática de todos los permisos disponibles en el sistema, organizada por módulo

Tests unitarios: creación de rol personalizado, intento de modificar rol de sistema (debe fallar), clonación, validación de formato de permisos.

### Paso 2: Capa de dominio — Domain Events

Crear en `api/src/identity/domain/events/`:

- **`RoleCreatedEvent`**: Payload: `{ roleId, tenantId, name, permissions[], isSystem: false, createdBy }`
- **`RoleAssignedEvent`**: Payload: `{ userId, tenantId, roleId, roleName, assignedBy, previousRoleId? }`
- **`RoleModifiedEvent`**: Payload: `{ roleId, tenantId, modifiedFields[], modifiedBy }`
- **`RoleDeletedEvent`**: Payload: `{ roleId, tenantId, roleName, deletedBy }`

### Paso 3: Capa de dominio — Repository interfaces

Ampliar en `api/src/identity/domain/repositories/`:

- **`RoleRepository`** (interfaz):
  - `save(role: Role): Promise<void>`
  - `findById(id: RoleId): Promise<Role | null>`
  - `findByTenantId(tenantId: TenantId): Promise<Role[]>` — devuelve roles de sistema + personalizados del tenant
  - `findByCode(tenantId: TenantId, code: string): Promise<Role | null>`
  - `existsByName(tenantId: TenantId, name: string): Promise<boolean>`
  - `delete(id: RoleId): Promise<void>`
  - `countUsersWithRole(roleId: RoleId): Promise<number>`

### Paso 4: Capa de aplicación — Commands y Queries

Crear en `api/src/identity/application/`:

- **Commands:**
  - `CreateCustomRoleCommand`: `{ tenantId, name, description, permissions[] }`
  - `CloneRoleCommand`: `{ tenantId, sourceRoleId, newName }`
  - `UpdateRoleCommand`: `{ roleId, name?, description?, permissions[]? }`
  - `DeleteRoleCommand`: `{ roleId }`
  - `AssignRoleCommand`: `{ tenantId, userId, roleId }`

- **Queries:**
  - `GetRolesQuery`: `{ tenantId }` → lista todos los roles del tenant
  - `GetRoleDetailQuery`: `{ roleId }` → detalle con permisos
  - `GetPermissionCatalogQuery`: `{}` → catálogo completo de permisos disponibles

- **DTOs:**
  - `CreateRoleDto`: validación con `class-validator` (`@IsNotEmpty()` name, `@IsArray()` permissions)
  - `RoleResponseDto`: `{ id, name, description, permissions[], isSystem, usersCount }`
  - `PermissionCatalogDto`: `{ modules: [{ name, permissions: [{ code, description }] }] }`

### Paso 5: Capa de aplicación — Handlers

Crear en `api/src/identity/application/commands/`:

- **`CreateCustomRoleHandler`**:
  1. Verificar que el usuario tiene permiso `identity:roles:create` (solo Presidente)
  2. Validar unicidad de nombre en el tenant
  3. Validar que todos los permisos solicitados existen en el catálogo
  4. Crear `Role.createCustom(...)` con `is_system = false`
  5. Persistir y publicar `RoleCreatedEvent` vía Outbox
  6. Retornar `RoleResponseDto`

- **`AssignRoleHandler`**:
  1. Verificar que el usuario tiene permiso `identity:roles:assign`
  2. Verificar que el rol existe y pertenece al tenant
  3. Verificar que el usuario objetivo tiene `TenantMembership` activa
  4. Actualizar `TenantMembership.roleId`
  5. **Invalidar Refresh Token** del usuario objetivo
  6. Publicar `RoleAssignedEvent` vía Outbox
  7. Reportar via `ErrorReporter.captureException()` si falla la invalidación del token

- **`DeleteRoleHandler`**:
  1. Verificar que el rol no es de sistema (`is_system = false`)
  2. Verificar que no hay usuarios asignados (`countUsersWithRole(roleId) === 0`)
  3. Eliminar rol (soft-delete: marcar `active = false`)
  4. Publicar `RoleDeletedEvent`

### Paso 6: Capa de infraestructura — Repository Prisma

Crear en `api/src/identity/infrastructure/persistence/`:

- **`PrismaRoleRepository`**: Implementa `RoleRepository` usando `PrismaTenantService`
- Mappers: `RolePrismaMapper.toDomain(prismaModel): Role` y `toPersistence(aggregate): PrismaCreateInput`
- Incluir la relación `role_permissions` en las consultas

### Paso 7: Capa de infraestructura — Controller

Crear en `api/src/identity/infrastructure/controllers/`:

- **`RolesController`**:
  - `GET /api/v1/tenants/:tenantId/roles` → Lista roles (sistema + personalizados)
  - `GET /api/v1/tenants/:tenantId/roles/:roleId` → Detalle de rol con permisos
  - `POST /api/v1/tenants/:tenantId/roles` → Crear rol personalizado
  - `POST /api/v1/tenants/:tenantId/roles/:roleId/clone` → Clonar rol
  - `PUT /api/v1/tenants/:tenantId/roles/:roleId` → Modificar rol personalizado
  - `DELETE /api/v1/tenants/:tenantId/roles/:roleId` → Eliminar rol personalizado
  - `GET /api/v1/permissions/catalog` → Catálogo de permisos disponibles
  - `POST /api/v1/tenants/:tenantId/users/:userId/role` → Asignar rol a usuario
  - Protegidos con `@RequirePermissions('identity:roles:manage')` y `@RequirePermissions('identity:roles:assign')`
  - Swagger decorators para documentación automática
  - Responses: 200/201 OK, 403 Forbidden, 404 Not Found, 409 Conflict (nombre duplicado)

### Paso 8: Capa de infraestructura — Token invalidation

Ampliar en `api/src/identity/infrastructure/services/`:

- **`TokenInvalidationService`**:
  - `invalidateRefreshToken(userId: string, tenantId: string): Promise<void>`
  - Elimina el Refresh Token almacenado del usuario en la BD
  - En el próximo intento de refresh, el usuario recibirá 401 y deberá re-autenticarse
  - El nuevo JWT contendrá los permisos del nuevo rol

### Paso 9: Tests

**Tests unitarios (dominio):**
- `Role.createCustom()` con datos válidos → rol creado + evento emitido
- `Role.updatePermissions()` en rol de sistema → error de invariante
- `Role.clone()` → nuevo rol con mismos permisos, `is_system = false`
- `Permission.create()` → validación de formato `module:resource:action`

**Tests unitarios (aplicación):**
- `CreateCustomRoleHandler` con mock de `RoleRepository`
- Caso éxito: rol creado con permisos válidos
- Caso nombre duplicado: rechazo con error 409
- `AssignRoleHandler`: asignación exitosa + invalidación de token
- `DeleteRoleHandler`: bloqueo si tiene usuarios asignados

**Tests de integración:**
- Creación de rol personalizado, asignación a usuario, verificación de permisos en JWT regenerado
- Intento de modificar rol de sistema → rechazo
- Eliminación de rol sin usuarios → OK
- Eliminación de rol con usuarios → bloqueado
- Clonación de rol → nuevo rol con permisos copiados
- Verificación de que el catálogo de permisos incluye todos los módulos del MVP

## Criterios de aceptación

Derivados de US-004 y US-005:

1. **Roles predefinidos visibles y no modificables:** Al acceder a la gestión de roles, se muestran los 5 roles de sistema con sus permisos. No se permite editar ni eliminar roles de sistema.

2. **Asignación de rol a usuario:** Al asignar un rol a un usuario, el cambio se refleja en su próximo acceso (tras regeneración de JWT). El usuario anterior recibe los permisos del nuevo rol.

3. **Creación de rol personalizado:** El Presidente puede crear roles personalizados con nombre único y permisos seleccionados del catálogo. El nuevo rol queda disponible para asignación.

4. **Clonación de rol:** Se puede clonar cualquier rol (sistema o personalizado) como base para un nuevo rol personalizado. El clon es completamente editable.

5. **Eliminación bloqueada si tiene usuarios:** Al intentar eliminar un rol con usuarios asignados, el sistema bloquea la acción y muestra el número de usuarios afectados.

6. **Invalidación de sesión al cambiar rol:** Tras el cambio de rol, el Refresh Token del usuario afectado se invalida, forzando re-autenticación con nuevos permisos.
