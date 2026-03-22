// Servidor MSW para entorno Node.js (Vitest).
// Intercepta peticiones HTTP a nivel de red — los componentes
// y hooks usan httpClient/axios real, y MSW responde sin red.

import { setupServer } from 'msw/node';
import { handlers } from './handlers/index';

/**
 * Instancia del servidor MSW con handlers por defecto.
 * El ciclo de vida se gestiona en setup.ts (beforeAll/afterEach/afterAll).
 *
 * Para sobreescribir en un test individual:
 *   server.use(http.get('/v1/...', () => HttpResponse.json(...)))
 *
 * afterEach llama a server.resetHandlers() para restaurar los defaults.
 */
export const server = setupServer(...handlers);
