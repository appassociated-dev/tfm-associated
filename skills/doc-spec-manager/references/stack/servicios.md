## 9. Servicios Externos

### 9.1 Email Transaccional

**Recomendado:** Resend

| Criterio | Resend | SendGrid | AWS SES |
|----------|--------|----------|---------|
| Free tier | 3k/mes | 100/día | 62k/mes (con EC2) |
| DX | ✅ Excelente | ⚠️ Buena | ⚠️ Compleja |
| React Email | ✅ Nativo | ❌ No | ❌ No |
| Pricing | Económico | Caro | Muy económico |

**Justificación:**
- 3000 emails/mes gratis (suficiente para MVP)
- SDK TypeScript moderno
- Integración con React Email para templates
- Deliverability excelente

### 9.2 Pasarela de Pago (Opcional MVP)

**Recomendado para futuro:** Stripe

- API excelente
- Soporte SEPA Direct Debit
- Webhooks robustos
- Documentación ejemplar

### 9.3 Observabilidad: Sentry

**Seleccionado:** Sentry

| Criterio | Sentry | Datadog | New Relic |
|----------|--------|---------|-----------|
| Free tier | ✅ 5k eventos/mes | ❌ Muy limitado | ❌ Muy limitado |
| Error tracking | ✅ Excelente | ✅ Bueno | ✅ Bueno |
| Performance | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| Session replay | ✅ Incluido | ⚠️ Extra | ⚠️ Extra |
| SDK TypeScript | ✅ Excelente | ✅ Bueno | ⚠️ Medio |
| Integración NestJS | ✅ Oficial | ⚠️ Manual | ⚠️ Manual |

**Justificación:**
- Free tier suficiente para MVP (5k eventos/mes)
- SDK oficial para NestJS y React
- Captura automática de errores con contexto completo
- Performance monitoring incluido (traces, bottlenecks)
- Release tracking: correlaciona errores con deploys
- Source maps para stack traces legibles

**Funcionalidades a utilizar:**

| Funcionalidad | Propósito | RNF |
|---------------|-----------|-----|
| Error Tracking | Captura excepciones con contexto | RNF-064 |
| Performance | Traces de transacciones, latencias | RNF-015-016 |
| Release Health | Correlación errores/deploys | RNF-064 |
| User Context | Identificar tenant/usuario afectado | RNF-004 |

**Integración backend (NestJS):**
```typescript
// main.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
```

**Integración frontend (React):**
```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

### 9.4 Servicios Complementarios (Post-MVP)

| Servicio | Propósito | Cuándo incorporar |
|----------|-----------|-------------------|
| Better Uptime | Uptime monitoring | Producción con usuarios reales |
| Axiom/Loki | Logging centralizado | Si Sentry no es suficiente |
| PostHog | Product analytics | Cuando se necesiten métricas de uso |
