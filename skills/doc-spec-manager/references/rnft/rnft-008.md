> **Categoría:** 2. Seguridad

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
