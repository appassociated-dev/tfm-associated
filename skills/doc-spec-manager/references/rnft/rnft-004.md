> **Categoría:** 2. Seguridad

### 2.4 RNFT-004: Multi-tenant con Prisma

**RNF Base:** RNF-004 (Aislamiento Multi-Tenant por Base de Datos)

**Implementación con Prisma dinámico:**

```typescript
// prisma-tenant.service.ts
@Injectable()
export class PrismaTenantService {
  private clients = new Map<string, PrismaClient>();

  getClient(tenantId: string): PrismaClient {
    if (!this.clients.has(tenantId)) {
      const client = new PrismaClient({
        datasources: {
          db: { url: this.getTenantDatabaseUrl(tenantId) },
        },
      });
      this.clients.set(tenantId, client);
    }
    return this.clients.get(tenantId);
  }

  private getTenantDatabaseUrl(tenantId: string): string {
    // Cada tenant tiene su propia DB y usuario
    return `postgresql://tenant_${tenantId}:${password}@host:5432/associated_${tenantId}`;
  }
}
```

**Middleware de tenant:**

```typescript
// tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new BadRequestException('X-Tenant-Id header required');
    }

    req['tenantId'] = tenantId;
    next();
  }
}
```

**Configuración PostgreSQL por tenant:**

```sql
-- Crear usuario específico por tenant
CREATE USER tenant_abc123 WITH PASSWORD 'secure_password';
CREATE DATABASE associated_abc123 OWNER tenant_abc123;

-- El usuario SOLO puede acceder a su DB
REVOKE ALL ON DATABASE associated_main FROM tenant_abc123;
GRANT CONNECT ON DATABASE associated_abc123 TO tenant_abc123;
```

**Métricas:**

- Conexiones por tenant monitorizadas en Sentry
- Pool máximo por tenant: 10 conexiones
