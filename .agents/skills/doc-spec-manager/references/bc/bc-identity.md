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

### 8.3 Roles Predefinidos (Sistema)

| Código | Nombre | Permisos Principales |
|--------|--------|---------------------|
| `PRESIDENT` | Presidente/Hermano Mayor | Todo + aprobaciones críticas |
| `SECRETARY` | Secretario | Socios, actas, documentación |
| `TREASURER` | Tesorero | Economía, cuotas, remesas |
| `BOARD_MEMBER` | Vocal | Según área asignada |
| `MEMBER` | Socio | Solo lectura propia vía portal |

### 8.4 Domain Events

| Evento | Trigger | Payload |
|--------|---------|---------|
| `UserCreated` | Registro | userId, email |
| `UserAuthenticated` | Login exitoso | userId, tenantId, email, rol, ipAddress, userAgent, timestamp |
| `AuthenticationFailed` | Login fallido | email, intentos, ip |
| `TenantProvisioned` | Provisión completa de tenant | tenantId, nombreColectividad, tipoColectividad, adminUserId, adminEmail, cif |

### 8.5 Trazabilidad RF

| RF | Elemento de Dominio |
|----|---------------------|
| N2RF01 | Tenant (Aggregate), aislamiento por BD |
| N2RF02 | User con múltiples TenantMembership |
| N2RF03 | ConfiguracionTenant |
| N2RF04 | Rol predefinidos (sistema) |
| N2RF05 | Rol personalizados (tenantId != null) |
| N2RF06 | Domain Events de auditoría |
| N2RF07 | RolAsignado event, histórico |
| N2RF08 | Validación edad en TenantMembership para cargos |
