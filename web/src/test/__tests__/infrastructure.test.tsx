// Smoke test de la infraestructura de testing.
// Verifica que MSW, TestWrapper, factories y custom render
// funcionan correctamente antes de usarlos en tests reales.

import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { server } from '../msw/server';
import { render, renderHook } from '../helpers/render';
import { useAuth } from '@/features/auth/context/use-auth';
import {
  buildUser,
  buildTenant,
  buildAuthTokens,
  buildLoginResponse,
  buildTenantSelectorResponse,
  buildUserProfile,
  buildMemberType,
  buildLeaveSummary,
  buildReinstatementSummary,
  buildRegistrationResponse,
  buildFeePlan,
  buildFeePlanDetail,
  buildMemberTypeOption,
} from '../factories';
import {
  userInfoSchema,
  tenantInfoSchema,
  authTokensSchema,
  loginResponseSchema,
  tenantSelectorResponseSchema,
  userProfileSchema,
} from '@/features/auth/schemas/auth.schemas';
import {
  feePlanSchema,
  feePlanDetailSchema,
} from '@/features/treasury/fee-plans/schemas/fee-plan.schemas';
import {
  memberTypeSchema,
  registrationResponseSchema,
} from '@/features/membership/registration/schemas/member-registration.schemas';
import {
  leaveSummarySchema,
  reinstatementSummarySchema,
} from '@/features/membership/leave/schemas/member-leave.schemas';

// === MSW Smoke Tests ===

describe('MSW Server', () => {
  it('intercepta peticiones HTTP y devuelve respuestas configuradas', async () => {
    // Arrange — handler temporal para verificar intercepción
    server.use(
      http.get('*/v1/test/ping', () => {
        return HttpResponse.json({ message: 'pong' });
      }),
    );

    // Act
    const response = await fetch('/api/v1/test/ping');
    const data = await response.json();

    // Assert
    expect(response.ok).toBe(true);
    expect(data).toEqual({ message: 'pong' });
  });

  it('los handlers por defecto responden a endpoints de auth', async () => {
    // Act — el handler por defecto de /v1/auth/me está configurado
    const response = await fetch('/api/v1/auth/me');
    const data = await response.json();

    // Assert
    expect(response.ok).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.email).toBeDefined();
    expect(data.data.permissions).toBeDefined();
  });

  it('server.use() sobreescribe handlers para escenarios de error', async () => {
    // Arrange — sobreescribir con error 401
    server.use(
      http.get('*/v1/auth/me', () => {
        return HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Token inválido', details: null } },
          { status: 401 },
        );
      }),
    );

    // Act
    const response = await fetch('/api/v1/auth/me');

    // Assert
    expect(response.status).toBe(401);
  });
});

// === Factory Smoke Tests ===

describe('Factories', () => {
  describe('auth factories', () => {
    it('buildUser produce datos válidos según userInfoSchema', () => {
      const user = buildUser();
      const result = userInfoSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it('buildUser genera IDs únicos en llamadas sucesivas', () => {
      const user1 = buildUser();
      const user2 = buildUser();
      expect(user1.id).not.toBe(user2.id);
    });

    it('buildUser acepta overrides parciales', () => {
      const user = buildUser({ name: 'Custom Name' });
      expect(user.name).toBe('Custom Name');
      // El resto de campos se mantiene con defaults
      expect(user.email).toBeDefined();
      expect(user.id).toBeDefined();
    });

    it('buildTenant produce datos válidos según tenantInfoSchema', () => {
      const tenant = buildTenant();
      const result = tenantInfoSchema.safeParse(tenant);
      expect(result.success).toBe(true);
    });

    it('buildAuthTokens produce datos válidos según authTokensSchema', () => {
      const tokens = buildAuthTokens();
      const result = authTokensSchema.safeParse(tokens);
      expect(result.success).toBe(true);
    });

    it('buildLoginResponse produce datos válidos según loginResponseSchema', () => {
      const response = buildLoginResponse();
      const result = loginResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('buildTenantSelectorResponse produce datos válidos según tenantSelectorResponseSchema', () => {
      const response = buildTenantSelectorResponse();
      const result = tenantSelectorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('buildUserProfile produce datos válidos según userProfileSchema', () => {
      const profile = buildUserProfile();
      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe('member factories', () => {
    it('buildMemberType produce datos válidos según memberTypeSchema', () => {
      const memberType = buildMemberType();
      const result = memberTypeSchema.safeParse(memberType);
      expect(result.success).toBe(true);
    });

    it('buildLeaveSummary produce datos válidos según leaveSummarySchema', () => {
      const summary = buildLeaveSummary();
      const result = leaveSummarySchema.safeParse(summary);
      expect(result.success).toBe(true);
    });

    it('buildReinstatementSummary produce datos válidos según reinstatementSummarySchema', () => {
      const summary = buildReinstatementSummary();
      const result = reinstatementSummarySchema.safeParse(summary);
      expect(result.success).toBe(true);
    });

    it('buildRegistrationResponse produce datos válidos según registrationResponseSchema', () => {
      const response = buildRegistrationResponse();
      const result = registrationResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe('fee-plan factories', () => {
    it('buildFeePlan produce datos válidos según feePlanSchema', () => {
      const plan = buildFeePlan();
      const result = feePlanSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });

    it('buildFeePlanDetail produce datos válidos según feePlanDetailSchema', () => {
      const detail = buildFeePlanDetail();
      const result = feePlanDetailSchema.safeParse(detail);
      expect(result.success).toBe(true);
    });

    it('buildMemberTypeOption produce objetos con campos requeridos', () => {
      const option = buildMemberTypeOption();
      expect(option.id).toBeDefined();
      expect(option.code).toBeDefined();
      expect(option.name).toBeDefined();
      expect(option.active).toBe(true);
    });
  });
});

// === TestWrapper Smoke Tests ===

describe('TestWrapper', () => {
  it('renderiza un componente sin errores', () => {
    // Arrange & Act
    const { container } = render(<div data-testid="test">Hello</div>);

    // Assert
    expect(container).toBeDefined();
    expect(screen.getByTestId('test')).toHaveTextContent('Hello');
  });

  it('proporciona AuthContext con valores por defecto', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@club.es');
    expect(result.current.permissions).toEqual(['*']);
  });

  it('permite sobreescribir AuthContext para tests específicos', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAuth(), {
      auth: {
        isAuthenticated: false,
        user: null,
        permissions: [],
      },
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.permissions).toEqual([]);
  });

  it('configura MemoryRouter con ruta personalizada', () => {
    // Arrange — componente que muestra la URL actual
    function LocationDisplay() {
      return <div data-testid="location">Rendered</div>;
    }

    // Act
    render(<LocationDisplay />, {
      route: '/members/:memberId',
      path: '/members/123',
    });

    // Assert — el componente se renderizó dentro de la ruta
    expect(screen.getByTestId('location')).toHaveTextContent('Rendered');
  });
});

// === Custom Render Smoke Tests ===

describe('Custom Render', () => {
  it('retorna instancia de userEvent en el resultado', () => {
    // Arrange & Act
    const { user } = render(<div>Test</div>);

    // Assert
    expect(user).toBeDefined();
    expect(typeof user.click).toBe('function');
    expect(typeof user.type).toBe('function');
  });

  it('soporta interacciones con userEvent', async () => {
    // Arrange
    function ClickCounter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>;
    }

    // Act
    const { user } = render(<ClickCounter />);
    const button = screen.getByRole('button');
    await user.click(button);

    // Assert
    expect(button).toHaveTextContent('Count: 1');
  });
});
