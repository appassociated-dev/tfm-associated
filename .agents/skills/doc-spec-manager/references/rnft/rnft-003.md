> **Categoría:** 2. Seguridad

### 2.3 RNFT-003: RBAC con Guards NestJS

**RNF Base:** RNF-003 (Autorización Basada en Roles)

**Implementación con decoradores:**

```typescript
// permissions.decorator.ts
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

// permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions', context.getHandler()
    );
    
    if (!requiredPermissions) return true;
    
    const { user } = context.switchToHttp().getRequest();
    const userPermissions = await this.getPermissions(user);
    
    return requiredPermissions.every(p => userPermissions.includes(p));
  }
}
```

**Uso en controllers:**

```typescript
// members.controller.ts
@Controller('members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembersController {

  @Get()
  @RequirePermissions('membership:members:read')
  findAll() { ... }

  @Post()
  @RequirePermissions('membership:members:create')
  create() { ... }

  @Delete(':id')
  @RequirePermissions('membership:members:delete')
  remove() { ... }
}
```

**Estructura de permisos:**

```
{module}:{resource}:{action}

Ejemplos:
- membership:members:read
- membership:members:create
- treasury:remittances:generate
- identity:users:manage
```

**Roles predefinidos por tenant:**

| Rol | Permisos |
|-----|----------|
| `admin` | Todos (`*:*:*`) |
| `treasurer` | `treasury:*:*`, `membership:members:read` |
| `secretary` | `membership:*:*`, `communication:*:*` |
| `board_member` | `*:*:read`, `events:registrations:create` |
| `member` | Portal socio únicamente |
