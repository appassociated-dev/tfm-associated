> **Categoría:** 2. Seguridad

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
