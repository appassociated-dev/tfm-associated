> **Categoría:** 4. Disponibilidad y Continuidad

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
