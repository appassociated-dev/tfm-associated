// Setup de entorno de testing para jsdom (web)
// Aquí se pueden añadir mocks globales y configuración de testing-library
import '@testing-library/jest-dom/vitest';

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
