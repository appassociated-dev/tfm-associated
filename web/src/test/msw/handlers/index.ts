// Barrel de handlers MSW por defecto.
// Combina handlers de todos los dominios para el server.
// Los handlers devuelven respuestas "happy path" — los tests
// pueden sobreescribir con server.use() para escenarios de error.

import { createAuthHandlers } from './auth.handlers';
import { createMemberHandlers } from './member.handlers';
import { createFeePlanHandlers } from './fee-plan.handlers';
import { createSubscriptionHandlers } from './subscription.handlers';

/**
 * Handlers por defecto combinados de todos los dominios.
 * Se inyectan en setupServer() y se restauran en afterEach.
 */
export const handlers = [
  ...createAuthHandlers(),
  ...createMemberHandlers(),
  ...createFeePlanHandlers(),
  ...createSubscriptionHandlers(),
];

// Re-exportar factorías de handlers para uso directo en tests
export { createAuthHandlers } from './auth.handlers';
export { createMemberHandlers } from './member.handlers';
export { createFeePlanHandlers } from './fee-plan.handlers';
export { createSubscriptionHandlers } from './subscription.handlers';

// Re-exportar tipos de configuración
export type { AuthHandlerConfig } from './auth.handlers';
export type { MemberHandlerConfig } from './member.handlers';
export type { FeePlanHandlerConfig } from './fee-plan.handlers';
export type { SubscriptionHandlerConfig } from './subscription.handlers';
