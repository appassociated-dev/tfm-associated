// Barrel principal de la infraestructura de test.
// Un solo import para todo: import { render, screen, buildUser, server } from '@/test'

// Custom render y helpers de RTL
export { render, renderHook } from './helpers/render';
export type { RenderOptions } from './helpers/render';

// Re-export completo de @testing-library/react (screen, waitFor, etc.)
export { screen, waitFor, within, act, fireEvent, cleanup } from '@testing-library/react';

// TestWrapper y auth defaults
export { createTestWrapper, DEFAULT_AUTH, type TestWrapperOptions } from './test-wrapper';

// Factories
export * from './factories';

// MSW server y handlers
export { server } from './msw/server';
export { createAuthHandlers, createMemberHandlers, createFeePlanHandlers } from './msw/handlers';
export type { AuthHandlerConfig, MemberHandlerConfig, FeePlanHandlerConfig } from './msw/handlers';

// MSW utils
export { apiResponse, paginatedResponse } from './msw/utils';
