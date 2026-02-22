> **Categoría:** 3. Rendimiento

### 3.2 RNFT-016: Tiempos de Respuesta API NestJS

**RNF Base:** RNF-016 (Tiempo de Respuesta de APIs)

**Métricas objetivo:**

| Operación | p95 | p99 | Medición |
|-----------|-----|-----|----------|
| GET simple | < 100ms | < 200ms | Sentry Performance |
| GET con joins | < 200ms | < 400ms | Sentry Performance |
| POST/PUT | < 300ms | < 600ms | Sentry Performance |
| Operaciones complejas | < 3s | < 5s | Sentry Performance |

**Interceptor de logging de tiempos:**

```typescript
// logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        
        // Log a Sentry si supera umbral
        if (responseTime > 500) {
          Sentry.captureMessage(`Slow API: ${request.url}`, {
            level: 'warning',
            extra: { responseTime, method: request.method }
          });
        }
      }),
    );
  }
}
```

**Configuración Prisma para rendimiento:**

```typescript
// prisma.service.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'warn', 'error'] 
    : ['error'],
});

// Queries optimizadas con select específico
const members = await prisma.member.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // NO incluir relaciones innecesarias
  },
  take: 50,
  skip: (page - 1) * 50,
});
```
