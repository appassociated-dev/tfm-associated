// Setup de entorno de testing para jsdom (web)
// Aquí se pueden añadir mocks globales y configuración de testing-library
import { beforeAll, afterEach, afterAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { server } from './msw/server';

// === MSW Server Lifecycle ===
// Iniciar servidor antes de todos los tests, resetear handlers entre tests,
// y cerrar al terminar. Garantiza aislamiento: cada test empieza con
// los handlers por defecto y puede sobreescribir con server.use().
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock de window.matchMedia requerido por Mantine 8 (jsdom no lo implementa)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock de ResizeObserver requerido por algunos componentes de Mantine
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
