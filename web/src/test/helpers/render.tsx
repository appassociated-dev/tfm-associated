// Custom render que envuelve componentes en TestWrapper.
// Re-exporta todo de @testing-library/react y sobreescribe render.
// Patrón oficial recomendado por Testing Library:
// https://testing-library.com/docs/react-testing-library/setup

import { type ReactElement } from 'react';
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  type RenderOptions as RTLRenderOptions,
  type RenderHookOptions as RTLRenderHookOptions,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestWrapper, type TestWrapperOptions } from '../test-wrapper';

// === Custom render options ===

export interface RenderOptions extends Omit<RTLRenderOptions, 'wrapper'>, TestWrapperOptions {}

/**
 * Render personalizado con providers.
 * Devuelve el resultado estándar de RTL + una instancia de userEvent.
 *
 * @example
 * const { user, getByRole } = render(<LoginPage />, {
 *   path: '/login',
 *   auth: { isAuthenticated: false },
 * });
 * await user.type(getByRole('textbox', { name: /email/i }), 'test@club.es');
 * await user.click(getByRole('button', { name: /entrar/i }));
 */
export function render(ui: ReactElement, options: RenderOptions = {}) {
  const { route, path, auth, queryData, ...rtlOptions } = options;

  const Wrapper = createTestWrapper({ route, path, auth, queryData });
  const result = rtlRender(ui, { wrapper: Wrapper, ...rtlOptions });

  return {
    ...result,
    user: userEvent.setup(),
  };
}

/**
 * renderHook personalizado con providers.
 * Útil para testear hooks que dependen de contexto (useAuth, useQuery, etc.)
 *
 * @example
 * const { result } = renderHook(() => useFeePlans(), {
 *   auth: { permissions: ['treasury:*'] },
 * });
 * await waitFor(() => expect(result.current.isSuccess).toBe(true));
 */
export function renderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: Omit<RTLRenderHookOptions<TProps>, 'wrapper'> & TestWrapperOptions = {} as Omit<
    RTLRenderHookOptions<TProps>,
    'wrapper'
  > &
    TestWrapperOptions,
) {
  const { route, path, auth, queryData, ...rtlOptions } = options;

  const Wrapper = createTestWrapper({ route, path, auth, queryData });
  return rtlRenderHook(hook, { wrapper: Wrapper, ...rtlOptions });
}

// Re-exportar todo de @testing-library/react para que los tests
// importen desde un solo lugar: import { render, screen, waitFor } from '@/test/helpers/render'
export * from '@testing-library/react';

// Sobreescribir las exportaciones de render y renderHook con nuestras versiones
export { render as default };
