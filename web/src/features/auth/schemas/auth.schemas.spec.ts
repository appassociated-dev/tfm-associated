import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  loginResponseSchema,
  tenantSelectorResponseSchema,
  userProfileSchema,
  isTenantSelectorResponse,
  type LoginApiResponse,
} from './auth.schemas';

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validLoginResponse = {
  tokens: {
    accessToken: 'jwt-access-token',
    refreshToken: 'jwt-refresh-token',
    expiresIn: 3600,
  },
  user: {
    id: VALID_UUID,
    email: 'socio@club.es',
    name: 'Juan Perez',
  },
  tenant: {
    id: VALID_UUID,
    name: 'Club Deportivo',
    slug: 'club-deportivo',
  },
  role: 'admin',
};

const validTenantSelectorResponse = {
  requiresTenantSelection: true as const,
  tenants: [
    {
      id: VALID_UUID,
      name: 'Club Deportivo',
      slug: 'club-deportivo',
      role: 'admin',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Asociacion Cultural',
      slug: 'asociacion-cultural',
      role: 'member',
    },
  ],
};

const validUserProfile = {
  id: VALID_UUID,
  email: 'socio@club.es',
  name: 'Juan Perez',
  currentTenant: {
    id: VALID_UUID,
    name: 'Club Deportivo',
    slug: 'club-deportivo',
  },
  role: 'admin',
  permissions: ['members:read', 'members:write', 'treasury:read'],
};

// === Tests ===

describe('loginResponseSchema', () => {
  it('deberia aceptar datos validos de login directo', () => {
    const result = loginResponseSchema.parse(validLoginResponse);

    expect(result.tokens.accessToken).toBe('jwt-access-token');
    expect(result.user.email).toBe('socio@club.es');
    expect(result.tenant.slug).toBe('club-deportivo');
    expect(result.role).toBe('admin');
  });

  it('deberia rechazar datos sin tokens', () => {
    const invalid = { ...validLoginResponse, tokens: undefined };

    expect(() => loginResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar datos con email invalido en user', () => {
    const invalid = {
      ...validLoginResponse,
      user: { ...validLoginResponse.user, email: 'no-es-email' },
    };

    expect(() => loginResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar datos con uuid invalido en user', () => {
    const invalid = {
      ...validLoginResponse,
      user: { ...validLoginResponse.user, id: 'no-es-uuid' },
    };

    expect(() => loginResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar datos sin tenant', () => {
    const invalid = { ...validLoginResponse, tenant: undefined };

    expect(() => loginResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar datos sin role', () => {
    const invalid = { ...validLoginResponse, role: undefined };

    expect(() => loginResponseSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('tenantSelectorResponseSchema', () => {
  it('deberia aceptar datos validos con requiresTenantSelection: true', () => {
    const result = tenantSelectorResponseSchema.parse(validTenantSelectorResponse);

    expect(result.requiresTenantSelection).toBe(true);
    expect(result.tenants).toHaveLength(2);
    expect(result.tenants[0].role).toBe('admin');
    expect(result.tenants[1].slug).toBe('asociacion-cultural');
  });

  it('deberia rechazar si requiresTenantSelection no es true literal', () => {
    const invalid = {
      ...validTenantSelectorResponse,
      requiresTenantSelection: false,
    };

    expect(() => tenantSelectorResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar si tenants esta vacio de tipo invalido', () => {
    const invalid = {
      requiresTenantSelection: true as const,
      tenants: [{ id: 'no-uuid', name: 'X', slug: 's' }], // falta role y uuid invalido
    };

    expect(() => tenantSelectorResponseSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('userProfileSchema', () => {
  it('deberia aceptar datos validos con permisos', () => {
    const result = userProfileSchema.parse(validUserProfile);

    expect(result.permissions).toEqual(['members:read', 'members:write', 'treasury:read']);
    expect(result.currentTenant.name).toBe('Club Deportivo');
    expect(result.role).toBe('admin');
  });

  it('deberia aceptar array de permisos vacio', () => {
    const withEmptyPermissions = { ...validUserProfile, permissions: [] };
    const result = userProfileSchema.parse(withEmptyPermissions);

    expect(result.permissions).toEqual([]);
  });

  it('deberia rechazar si falta currentTenant', () => {
    const invalid = { ...validUserProfile, currentTenant: undefined };

    expect(() => userProfileSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar si falta permissions', () => {
    const invalid = { ...validUserProfile, permissions: undefined };

    expect(() => userProfileSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('isTenantSelectorResponse', () => {
  it('deberia retornar true para respuesta de selector de tenant', () => {
    const response: LoginApiResponse = validTenantSelectorResponse;

    expect(isTenantSelectorResponse(response)).toBe(true);
  });

  it('deberia retornar false para respuesta de login directo', () => {
    const response: LoginApiResponse = validLoginResponse;

    expect(isTenantSelectorResponse(response)).toBe(false);
  });
});
