> **Categoría:** 4. Disponibilidad y Continuidad

### 4.1 RNFT-037: Disponibilidad con Health Checks

**RNF Base:** RNF-037 (Disponibilidad del Servicio)

**Health checks en NestJS:**

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.storage.pingCheck('minio'),
    ]);
  }

  @Get('ready')
  readiness() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Get('live')
  liveness() {
    return { status: 'alive' };
  }
}
```

**Monitorización:**

- Endpoint `/health` verificado cada 30s
- Alertas en Sentry si health check falla 3 veces consecutivas
- Objetivo: 99.5% disponibilidad mensual
