# Requisitos No Funcionales Técnicos

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Inputs:** KB-004 (RNF Base), KB-007 (Stack Tecnológico)  
**Estado:** Borrador

---

## Índice

1. [Introducción](#1-introducción)
2. [Seguridad](#2-seguridad)
3. [Rendimiento](#3-rendimiento)
4. [Disponibilidad y Continuidad](#4-disponibilidad-y-continuidad)
5. [Usabilidad y Experiencia de Usuario](#5-usabilidad-y-experiencia-de-usuario)
6. [Mantenibilidad y Operaciones](#6-mantenibilidad-y-operaciones)
7. [Matriz de Trazabilidad](#7-matriz-de-trazabilidad)

---

## 1. Introducción

Este documento concreta los RNFs agnósticos definidos en KB-004 con las tecnologías específicas seleccionadas en KB-007. Para cada RNF se especifican:

- **Implementación técnica**: Cómo se implementa con el stack seleccionado
- **Configuración**: Parámetros y settings específicos
- **Métricas**: Valores medibles y herramientas de verificación
- **Verificación**: Cómo validar el cumplimiento

### 1.1 Stack de Referencia

| Capa           | Tecnología          | Versión      |
| -------------- | ------------------- | ------------ |
| Backend        | NestJS + TypeScript | 11.x / 5.9.x |
| Frontend       | React + Mantine     | 19.x / 8.x   |
| Base de Datos  | PostgreSQL + Prisma | 18.x / 7.x   |
| Testing        | Vitest + Playwright | 4.x / 1.58.x |
| Observabilidad | Sentry              | 10.x         |
| CI/CD          | GitHub Actions      | -            |

---

## 2. Seguridad

### 2.1 RNFT-001: Autenticación con JWT y Passport

**RNF Base:** RNF-001 (Autenticación de Usuarios)

**Implementación NestJS:**

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m', // Access token corto
          algorithm: 'HS256',
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})
export class AuthModule {}
```

**Configuración de tokens:**

| Token         | Duración   | Almacenamiento    | Renovación             |
| ------------- | ---------- | ----------------- | ---------------------- |
| Access Token  | 15 minutos | Memory (frontend) | Automática con refresh |
| Refresh Token | 7 días     | HttpOnly Cookie   | En login               |

**Política de contraseñas (class-validator):**

```typescript
// password.dto.ts
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
  message: 'Password must have 8+ chars, uppercase, lowercase, number'
})
password: string;
```

**Bloqueo de cuenta:**

```typescript
// Configuración
MAX_FAILED_ATTEMPTS = 5;
LOCKOUT_DURATION_MINUTES = 15;
```

**Verificación:**

- Test E2E: Login con credenciales válidas/inválidas
- Test: Bloqueo tras 5 intentos fallidos
- Auditoría: Revisar tokens generados tienen claims correctos

---

### 2.2 RNFT-002: Gestión de Sesiones JWT

**RNF Base:** RNF-002 (Gestión de Sesiones)

**Implementación:**

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar sesión activa en DB
    const session = await this.prisma.session.findFirst({
      where: {
        userId: payload.sub,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) throw new UnauthorizedException();
    return { userId: payload.sub, tenantId: payload.tenantId };
  }
}
```

**Configuración de expiración:**

| Parámetro     | Valor    | Variable de entorno        |
| ------------- | -------- | -------------------------- |
| Inactividad   | 30 min   | `SESSION_IDLE_TIMEOUT`     |
| Absoluta      | 24 horas | `SESSION_ABSOLUTE_TIMEOUT` |
| Refresh token | 7 días   | `REFRESH_TOKEN_EXPIRES`    |

**Refresh Token en Cookie HttpOnly:**

```typescript
// auth.controller.ts
@Post('refresh')
async refresh(@Req() req: Request, @Res() res: Response) {
  const refreshToken = req.cookies['refresh_token'];
  const tokens = await this.authService.refreshTokens(refreshToken);

  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  return res.json({ accessToken: tokens.accessToken });
}
```

---

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
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    const userPermissions = await this.getPermissions(user);

    return requiredPermissions.every((p) => userPermissions.includes(p));
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

| Rol            | Permisos                                  |
| -------------- | ----------------------------------------- |
| `admin`        | Todos (`*:*:*`)                           |
| `treasurer`    | `treasury:*:*`, `membership:members:read` |
| `secretary`    | `membership:*:*`, `communication:*:*`     |
| `board_member` | `*:*:read`, `events:registrations:create` |
| `member`       | Portal socio únicamente                   |

---

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

---

### 2.5 RNFT-005: Cifrado TLS con NestJS

**RNF Base:** RNF-005 (Cifrado de Datos en Tránsito)

**Configuración en producción:**

```typescript
// main.ts (producción con HTTPS)
async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./secrets/private-key.pem'),
    cert: fs.readFileSync('./secrets/certificate.pem'),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Forzar HTTPS
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  await app.listen(443);
}
```

**Headers de seguridad (Helmet):**

```typescript
// app.module.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
```

**Verificación:**

- SSL Labs: Grado A mínimo
- Headers verificados con securityheaders.com

---

### 2.6 RNFT-006: Cifrado con Argon2 y Prisma

**RNF Base:** RNF-006 (Cifrado de Datos Sensibles en Reposo)

**Hash de contraseñas:**

```typescript
// auth.service.ts
import * as argon2 from 'argon2';

async hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

async validatePassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
```

**Cifrado de IBAN en base de datos:**

```typescript
// prisma/schema.prisma - campo cifrado a nivel aplicación
model MemberAccount {
  id            String   @id @default(uuid())
  ibanEncrypted String   // Cifrado con AES-256
  ibanHash      String   // Para búsquedas (SHA-256 truncado)
}

// member-account.service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}
```

**Datos cifrados:**

| Campo      | Método                  | Propósito          |
| ---------- | ----------------------- | ------------------ |
| Contraseña | Argon2 (default params) | Hash irreversible  |
| IBAN       | AES-256-GCM             | Cifrado reversible |
| DNI        | AES-256-GCM             | Cifrado reversible |

---

### 2.7 RNFT-007: Auditoría con Prisma Middleware

**RNF Base:** RNF-007 (Auditoría de Acciones Críticas)

**Implementación con Prisma middleware:**

```typescript
// prisma-audit.middleware.ts
prisma.$use(async (params, next) => {
  const result = await next(params);

  const auditableModels = ['Member', 'MemberAccount', 'Transaction', 'User'];
  const auditableActions = ['create', 'update', 'delete'];

  if (auditableModels.includes(params.model) && auditableActions.includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        tenantId: context.tenantId,
        action: params.action,
        model: params.model,
        recordId: result.id,
        oldValues: params.action === 'update' ? await getOldValues() : null,
        newValues: JSON.stringify(params.args.data),
        ipAddress: context.ip,
        userAgent: context.userAgent,
        timestamp: new Date(),
      },
    });
  }

  return result;
});
```

**Modelo de auditoría:**

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  tenantId   String
  action     String   // create, update, delete
  model      String   // Nombre del modelo
  recordId   String
  oldValues  Json?
  newValues  Json?
  ipAddress  String
  userAgent  String?
  timestamp  DateTime @default(now())

  @@index([tenantId, timestamp])
  @@index([model, recordId])
}
```

**Retención:** 5 años (configurable en política de backup)

---

### 2.8 RNFT-008: Protección OWASP con NestJS

**RNF Base:** RNF-008 (Protección contra Ataques Comunes)

**Configuración de seguridad:**

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: 'Too many requests',
    }),
  );

  // CORS configurado
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  // Helmet para headers de seguridad
  app.use(helmet());

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip propiedades no definidas
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
```

**Protecciones implementadas:**

| Ataque        | Protección             | Implementación                      |
| ------------- | ---------------------- | ----------------------------------- |
| SQL Injection | Queries parametrizadas | Prisma (por defecto)                |
| XSS           | Sanitización           | class-transformer + CSP headers     |
| CSRF          | SameSite cookies       | Cookie config: `sameSite: 'strict'` |
| Rate limiting | Throttling             | @nestjs/throttler                   |
| Clickjacking  | X-Frame-Options        | Helmet: `DENY`                      |

---

## 3. Rendimiento

### 3.1 RNFT-015: Tiempos de Carga Frontend

**RNF Base:** RNF-015 (Tiempo de Respuesta de Páginas)

**Configuración Vite para optimización:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          mantine: ['@mantine/core', '@mantine/hooks'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // KB
  },
  plugins: [react(), compression({ algorithm: 'brotli' })],
});
```

**Métricas objetivo (Lighthouse):**

| Métrica                        | Objetivo        | Herramienta            |
| ------------------------------ | --------------- | ---------------------- |
| FCP (First Contentful Paint)   | < 1.8s          | Lighthouse             |
| LCP (Largest Contentful Paint) | < 2.5s          | Lighthouse             |
| TTI (Time to Interactive)      | < 3.8s          | Lighthouse             |
| CLS (Cumulative Layout Shift)  | < 0.1           | Lighthouse             |
| Bundle size (gzip)             | < 200KB inicial | `vite-bundle-analyzer` |

**Lazy loading de rutas:**

```typescript
// routes.tsx
const MembersPage = lazy(() => import('./pages/Members'));
const TreasuryPage = lazy(() => import('./pages/Treasury'));

<Routes>
  <Route path="/members" element={
    <Suspense fallback={<PageSkeleton />}>
      <MembersPage />
    </Suspense>
  } />
</Routes>
```

---

### 3.2 RNFT-016: Tiempos de Respuesta API NestJS

**RNF Base:** RNF-016 (Tiempo de Respuesta de APIs)

**Métricas objetivo:**

| Operación             | p95     | p99     | Medición           |
| --------------------- | ------- | ------- | ------------------ |
| GET simple            | < 100ms | < 200ms | Sentry Performance |
| GET con joins         | < 200ms | < 400ms | Sentry Performance |
| POST/PUT              | < 300ms | < 600ms | Sentry Performance |
| Operaciones complejas | < 3s    | < 5s    | Sentry Performance |

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
            extra: { responseTime, method: request.method },
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
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
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

---

### 3.3 RNFT-017: Concurrencia con Connection Pool

**RNF Base:** RNF-017 (Capacidad de Usuarios Concurrentes)

**Configuración Prisma connection pool:**

```typescript
// Por tenant
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}?connection_limit=10&pool_timeout=10`,
    },
  },
});
```

**Parámetros de pool:**

| Parámetro          | Valor             | Justificación                     |
| ------------------ | ----------------- | --------------------------------- |
| `connection_limit` | 10 por tenant     | Evita saturación                  |
| `pool_timeout`     | 10s               | Falla rápido si no hay conexiones |
| Total conexiones   | ~100 (10 tenants) | Límite PostgreSQL default: 100    |

**Métricas de concurrencia:**

```typescript
// Monitorización con Sentry
Sentry.setContext('database', {
  activeConnections: pool.activeCount,
  idleConnections: pool.idleCount,
  waitingRequests: pool.waitingCount,
});
```

---

### 3.4 RNFT-018: Operaciones Masivas con Batch

**RNF Base:** RNF-018 (Rendimiento de Operaciones Masivas)

**Procesamiento batch con Prisma:**

```typescript
// remittance.service.ts
async generateRemittance(memberIds: string[]): Promise<SepaRemittance> {
  const BATCH_SIZE = 100;
  const results = [];

  for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
    const batch = memberIds.slice(i, i + BATCH_SIZE);

    const batchResults = await this.prisma.$transaction(
      batch.map(id =>
        this.prisma.transaction.create({
          data: { memberId: id, type: 'FEE', ... }
        })
      )
    );

    results.push(...batchResults);

    // Reportar progreso
    await this.progressService.update(i / memberIds.length * 100);
  }

  return this.buildRemittanceXml(results);
}
```

**Tiempos objetivo:**

| Operación         | Volumen        | Tiempo máximo |
| ----------------- | -------------- | ------------- |
| Remesa SEPA       | 500 members    | < 30s         |
| Importación CSV   | 500 registros  | < 60s         |
| Generación cuotas | 500 members    | < 30s         |
| Exportación Excel | 1000 registros | < 15s         |

**Procesamiento asíncrono con Bull (para operaciones > 30s):**

```typescript
// queue.processor.ts
@Processor('massive-operations')
export class MassiveOperationsProcessor {
  @Process('generate-remesa')
  async handleRemesa(job: Job<RemesaJobData>) {
    const { tenantId, fiscalYearId } = job.data;
    // Proceso largo con reportes de progreso
    await job.progress(50);
    // ...
  }
}
```

---

### 3.5 RNFT-019: Búsquedas con PostgreSQL

**RNF Base:** RNF-019 (Rendimiento de Búsquedas)

**Índices PostgreSQL:**

```prisma
model Member {
  id        String @id @default(uuid())
  name      String
  surnames  String
  dni       String @unique
  email     String
  status    MemberStatus
  tenantId  String

  @@index([tenantId, status])
  @@index([tenantId, name, surnames])
  @@index([dni])
}
```

**Búsqueda fuzzy con pg_trgm:**

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice para búsqueda fuzzy
CREATE INDEX idx_member_name_trgm ON "Member"
  USING gin (name gin_trgm_ops);
```

```typescript
// member.repository.ts
async searchByName(tenantId: string, query: string): Promise<Member[]> {
  return this.prisma.$queryRaw`
    SELECT * FROM "Member"
    WHERE "tenantId" = ${tenantId}
    AND similarity(name || ' ' || surnames, ${query}) > 0.3
    ORDER BY similarity(name || ' ' || surnames, ${query}) DESC
    LIMIT 20
  `;
}
```

**Métricas:**

| Búsqueda           | Tiempo objetivo |
| ------------------ | --------------- |
| Por DNI (exacta)   | < 50ms          |
| Por nombre (fuzzy) | < 300ms         |
| Listado paginado   | < 200ms         |
| Filtros combinados | < 500ms         |

---

### 3.6 RNFT-021: Caché con React Query

**RNF Base:** RNF-021 (Optimización de Recursos)

**Configuración React Query:**

```typescript
// query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos (antes cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Estrategias de caché por tipo de dato:**

| Dato                 | staleTime | gcTime   | Invalidación |
| -------------------- | --------- | -------- | ------------ |
| Listado members      | 5 min     | 30 min   | Mutation     |
| Detalle member       | 10 min    | 60 min   | Mutation     |
| Tipos de cuota       | 1 hora    | 24 horas | Manual       |
| Configuración tenant | 1 hora    | 24 horas | Manual       |

**Prefetching para navegación:**

```typescript
// MembersList.tsx
const prefetchMember = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ['member', id],
    queryFn: () => fetchMember(id),
  });
};

// On hover
<Link onMouseEnter={() => prefetchMember(member.id)}>
  {member.name}
</Link>
```

---

### 3.7 RNFT-050: Skeleton Screens con Mantine

**RNF Base:** RNF-050 (Skeleton Screens)

**Implementación con Mantine Skeleton:**

```typescript
// MemberCard.skeleton.tsx
export const MemberCardSkeleton = () => (
  <Card>
    <Group>
      <Skeleton height={50} circle />
      <Stack gap="xs" style={{ flex: 1 }}>
        <Skeleton height={16} width="70%" />
        <Skeleton height={12} width="40%" />
      </Stack>
    </Group>
    <Skeleton height={100} mt="md" />
  </Card>
);

// MembersList.tsx
const { data, isLoading } = useQuery(['members'], fetchMembers);

if (isLoading) {
  return (
    <Stack>
      {Array(5).fill(0).map((_, i) => <MemberCardSkeleton key={i} />)}
    </Stack>
  );
}
```

**Regla:** Toda vista con fetch de datos debe mostrar skeleton durante carga.

---

## 4. Disponibilidad y Continuidad

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

---

### 4.2 RNFT-038: Backups PostgreSQL

**RNF Base:** RNF-038 (Copias de Seguridad)

**Script de backup automatizado:**

```bash
#!/bin/bash
# backup.sh - Ejecutado diariamente via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

# Backup de cada tenant DB
for db in $(psql -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'associated_%'"); do
  pg_dump -Fc $db > $BACKUP_DIR/${db}_${DATE}.dump
done

# Backup de DB principal
pg_dump -Fc associated_main > $BACKUP_DIR/main_${DATE}.dump

# Subir a S3
aws s3 sync $BACKUP_DIR s3://associated-backups/ --delete

# Limpiar backups locales > 7 días
find $BACKUP_DIR -mtime +7 -delete
```

**Política de retención:**

| Tipo    | Frecuencia | Retención  |
| ------- | ---------- | ---------- |
| Diario  | 00:00 UTC  | 30 días    |
| Semanal | Domingo    | 12 semanas |
| Mensual | Día 1      | 12 meses   |

**Verificación:** Test de restauración trimestral documentado.

---

### 4.3 RNFT-042: Gestión de Errores con Sentry

**RNF Base:** RNF-042 (Gestión de Errores)

**Configuración Sentry NestJS:**

```typescript
// main.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  integrations: [Sentry.prismaIntegration()],
  beforeSend(event) {
    // Sanitizar datos sensibles
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.iban;
    }
    return event;
  },
});

// Global exception filter
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    // ... responder al cliente
  }
}
```

**Configuración Sentry React:**

```typescript
// main.tsx
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Alertas configuradas:**

| Condición           | Acción               |
| ------------------- | -------------------- |
| Error rate > 1%     | Notificación Slack   |
| Error crítico (500) | Email inmediato      |
| Latencia p95 > 2s   | Warning en dashboard |

---

## 5. Usabilidad y Experiencia de Usuario

### 5.1 RNFT-045: Diseño Responsive con Mantine

**RNF Base:** RNF-045 (Diseño Responsivo)

**Breakpoints Mantine:**

```typescript
// theme.ts
const theme = createTheme({
  breakpoints: {
    xs: '30em', // 480px
    sm: '48em', // 768px
    md: '64em', // 1024px
    lg: '74em', // 1184px
    xl: '90em', // 1440px
  },
});
```

**Uso de hooks responsive:**

```typescript
// Layout.tsx
import { useMediaQuery } from '@mantine/hooks';

const Layout = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <AppShell
      navbar={{ width: isMobile ? 0 : 250, breakpoint: 'sm' }}
      padding="md"
    >
      {isMobile ? <MobileNav /> : <DesktopNav />}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
```

**Testing responsive:** Playwright con viewports móvil/tablet/desktop.

---

### 5.2 RNFT-046: Accesibilidad WCAG AA con Mantine

**RNF Base:** RNF-046 (Accesibilidad)

**Mantine incluye accesibilidad por defecto:**

- Focus visible en todos los elementos interactivos
- Roles ARIA correctos
- Labels asociados a inputs
- Contraste de colores WCAG AA

**Configuración adicional:**

```typescript
// Verificar contraste de colores personalizados
const theme = createTheme({
  colors: {
    brand: [/* asegurar ratio 4.5:1 mínimo */],
  },
});

// Skip to content link
<a href="#main-content" className="visually-hidden-focusable">
  Saltar al contenido
</a>
```

**Verificación:**

- axe-core en tests E2E
- Lighthouse Accessibility > 90

---

### 5.3 RNFT-056: PWA con Workbox

**RNF Base:** RNF-056 (Progressive Web App)

**Configuración Vite PWA:**

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Associated - Member Portal',
        short_name: 'Associated',
        theme_color: '#228be6',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.associated\.com\/api\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
});
```

**Funcionalidad offline:**

| Recurso        | Estrategia   | Descripción        |
| -------------- | ------------ | ------------------ |
| Shell de app   | CacheFirst   | Siempre disponible |
| API datos      | NetworkFirst | Fallback a caché   |
| Imágenes       | CacheFirst   | Reducir tráfico    |
| Carnet digital | CacheFirst   | Disponible offline |

---

## 6. Mantenibilidad y Operaciones

### 6.1 RNFT-057: Documentación con OpenAPI

**RNF Base:** RNF-057 (Documentación Técnica)

**Swagger en NestJS:**

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Associated API')
  .setDescription('API del ERP para colectividades')
  .setVersion('1.0')
  .addBearerAuth()
  .addApiKey({ type: 'apiKey', name: 'X-Tenant-Id', in: 'header' })
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Decoradores en controllers:**

```typescript
@ApiTags('Members')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Id', required: true })
@Controller('members')
export class MembersController {

  @Get()
  @ApiOperation({ summary: 'Listar members del tenant' })
  @ApiResponse({ status: 200, type: [MemberDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  findAll(@Query() query: ListMembersQuery) { ... }
}
```

**Generación de tipos para frontend:**

```bash
# Generar tipos TypeScript desde OpenAPI
npx openapi-typescript http://localhost:3000/api-json -o ./src/api/types.ts
```

**Inventario de Endpoints:** El inventario formal de endpoints del sistema se define en `spec/013_inventario-de-endpoints.md` bajo el formato EP-NNN. Cada endpoint EP referencia el caso de uso (UC) que lo origina y las entidades (ENT) que expone. La especificación OpenAPI generada por `@nestjs/swagger` DEBE ser consistente con este inventario.

---

### 6.2 RNFT-058: Testing con Vitest

**RNF Base:** RNF-058 (Cobertura de Tests Unitarios)

**Configuración Vitest:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.dto.ts',
        '**/*.module.ts',
        '**/index.ts',
        '**/*.config.ts',
        '**/migrations/**',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

**CI Quality Gates (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    fail_ci_if_error: true

- name: Check coverage thresholds
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 80%"
      exit 1
    fi
```

**Métricas CI:**

| Métrica         | Umbral Global | Umbral Diff |
| --------------- | ------------- | ----------- |
| Line coverage   | ≥ 80%         | ≥ 85%       |
| Branch coverage | ≥ 70%         | ≥ 75%       |
| Tests pasando   | 100%          | 100%        |

---

### 6.3 RNFT-059: Tests de Integración con Testcontainers

**RNF Base:** RNF-059 (Tests de Integración)

**Setup con Testcontainers:**

```typescript
// tests/setup/database.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:18-alpine').withDatabase('test_db').start();

  process.env.DATABASE_URL = container.getConnectionUri();

  // Ejecutar migraciones
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
  });
}, 60000);

afterAll(async () => {
  await container.stop();
});
```

**Test de repositorio:**

```typescript
// member.repository.integration.spec.ts
describe('MemberRepository (Integration)', () => {
  let repository: MemberRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new MemberRepository(prisma);
  });

  it('should create and retrieve a member', async () => {
    const member = await repository.create({
      name: 'Juan',
      surnames: 'García',
      email: 'juan@test.com',
    });

    const found = await repository.findById(member.id);
    expect(found.name).toBe('Juan');
  });
});
```

**Tiempo máximo:** < 10 minutos para suite completa.

---

### 6.4 RNFT-060: Tests E2E con Playwright

**RNF Base:** RNF-060 (Tests End-to-End)

**Configuración Playwright:**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

**Test de flujo crítico:**

```typescript
// e2e/member-registration.spec.ts
test('Member registration complete', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navegar a members
  await page.click('text=Members');
  await page.click('text=New Member');

  // Rellenar formulario
  await page.fill('[name="name"]', 'Test');
  await page.fill('[name="surnames"]', 'User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="dni"]', '12345678A');

  // Guardar
  await page.click('text=Save');

  // Verificar
  await expect(page.locator('text=Member created successfully')).toBeVisible();
});
```

**Flujos críticos cubiertos:**

- Login/logout
- Alta de member
- Registro de pago
- Generación de remesa SEPA

---

### 6.5 RNFT-061: Logging con NestJS + Sentry

**RNF Base:** RNF-061 (Logging Estructurado)

**Logger personalizado:**

```typescript
// logger.service.ts
@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        context,
        timestamp: new Date().toISOString(),
        correlationId: AsyncLocalStorage.getStore()?.correlationId,
      }),
    );
  }

  error(message: string, trace?: string, context?: string) {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        trace,
        context,
        timestamp: new Date().toISOString(),
        correlationId: AsyncLocalStorage.getStore()?.correlationId,
      }),
    );

    // También a Sentry
    Sentry.captureMessage(message, { level: 'error', extra: { trace } });
  }
}
```

**Correlation ID middleware:**

```typescript
// correlation.middleware.ts
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    asyncLocalStorage.run({ correlationId }, () => {
      res.setHeader('x-correlation-id', correlationId);
      next();
    });
  }
}
```

**Datos NO logueados:**

- Contraseñas
- Tokens JWT
- DNI completo (solo últimos 4 dígitos)
- IBAN (solo últimos 4 dígitos)

---

### 6.6 RNFT-066: Migraciones con Prisma

**RNF Base:** RNF-066 (Gestión de Migraciones de Datos)

**Workflow de migraciones:**

```bash
# Desarrollo: crear migración
npx prisma migrate dev --name add_campo_x

# CI/CD: aplicar migraciones
npx prisma migrate deploy

# Rollback (manual)
npx prisma migrate resolve --rolled-back <migration_name>
```

**Estructura de migraciones:**

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20260201_init/
    │   └── migration.sql
    ├── 20260215_add_carnet/
    │   └── migration.sql
    └── migration_lock.toml
```

**Reglas:**

- Migraciones siempre forward-only
- Backup antes de migraciones destructivas
- Migraciones probadas en staging antes de producción
- Sin `prisma migrate reset` en producción

---

## 7. Matriz de Trazabilidad

### 7.1 RNF Base → RNF Técnico

| RNF Base | RNF Técnico | Tecnología                   |
| -------- | ----------- | ---------------------------- |
| RNF-001  | RNFT-001    | NestJS + Passport + JWT      |
| RNF-002  | RNFT-002    | JWT + Refresh Tokens         |
| RNF-003  | RNFT-003    | NestJS Guards + RBAC         |
| RNF-004  | RNFT-004    | Prisma + PostgreSQL multi-DB |
| RNF-005  | RNFT-005    | Helmet + TLS                 |
| RNF-006  | RNFT-006    | Argon2 + AES-256             |
| RNF-007  | RNFT-007    | Prisma Middleware            |
| RNF-008  | RNFT-008    | Helmet + ValidationPipe      |
| RNF-015  | RNFT-015    | Vite + React + Lighthouse    |
| RNF-016  | RNFT-016    | NestJS + Sentry Performance  |
| RNF-017  | RNFT-017    | Prisma Connection Pool       |
| RNF-018  | RNFT-018    | Prisma Batch + Bull          |
| RNF-019  | RNFT-019    | PostgreSQL + pg_trgm         |
| RNF-021  | RNFT-021    | React Query                  |
| RNF-037  | RNFT-037    | NestJS Health Checks         |
| RNF-038  | RNFT-038    | pg_dump + S3                 |
| RNF-042  | RNFT-042    | Sentry                       |
| RNF-045  | RNFT-045    | Mantine Responsive           |
| RNF-046  | RNFT-046    | Mantine + axe-core           |
| RNF-050  | RNFT-050    | Mantine Skeleton             |
| RNF-056  | RNFT-056    | Vite PWA + Workbox           |
| RNF-057  | RNFT-057    | @nestjs/swagger              |
| RNF-058  | RNFT-058    | Vitest + Codecov             |
| RNF-059  | RNFT-059    | Testcontainers               |
| RNF-060  | RNFT-060    | Playwright                   |
| RNF-061  | RNFT-061    | NestJS Logger + Sentry       |
| RNF-066  | RNFT-066    | Prisma Migrate               |

### 7.2 Tecnología → RNFs Implementados

| Tecnología      | RNFs Técnicos                                    |
| --------------- | ------------------------------------------------ |
| NestJS          | RNFT-001, 002, 003, 005, 008, 016, 037, 057, 061 |
| Prisma          | RNFT-004, 006, 007, 017, 018, 019, 066           |
| React + Mantine | RNFT-015, 021, 045, 046, 050                     |
| PostgreSQL      | RNFT-004, 019, 038                               |
| Vitest          | RNFT-058, 059                                    |
| Playwright      | RNFT-060                                         |
| Sentry          | RNFT-016, 042, 061                               |
| Vite            | RNFT-015, 056                                    |

---

## Changelog

- v1.0 (Feb 2026): Versión inicial
  - 26 RNFs técnicos concretados desde KB-004
  - Configuraciones específicas para stack KB-007
  - Métricas medibles y verificables
  - Ejemplos de código para implementación
