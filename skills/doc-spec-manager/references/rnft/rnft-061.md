> **Categoría:** 6. Mantenibilidad y Operaciones

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
