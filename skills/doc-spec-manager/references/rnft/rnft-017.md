> **Categoría:** 3. Rendimiento

### 3.3 RNFT-017: Concurrencia con Connection Pool

**RNF Base:** RNF-017 (Capacidad de Usuarios Concurrentes)

**Configuración Prisma connection pool:**

```typescript
// Por tenant
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}?connection_limit=10&pool_timeout=10`
    }
  }
});
```

**Parámetros de pool:**

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| `connection_limit` | 10 por tenant | Evita saturación |
| `pool_timeout` | 10s | Falla rápido si no hay conexiones |
| Total conexiones | ~100 (10 tenants) | Límite PostgreSQL default: 100 |

**Métricas de concurrencia:**

```typescript
// Monitorización con Sentry
Sentry.setContext('database', {
  activeConnections: pool.activeCount,
  idleConnections: pool.idleCount,
  waitingRequests: pool.waitingCount,
});
```
