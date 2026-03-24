import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../controllers/auth.controller';
import { LoginCommand } from '../../application/commands/login.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command';
import { LogoutCommand } from '../../application/commands/logout.command';
import { SwitchTenantCommand } from '../../application/commands/switch-tenant.command';
import { GetCurrentUserQuery } from '../../application/queries/get-current-user.query';
import { LoginResponseDto } from '../../application/dtos/login-response.dto';
import { TenantSelectorDto } from '../../application/dtos/tenant-selector.dto';
import { RefreshResponseDto } from '../../application/dtos/refresh-response.dto';
import { UserProfileDto } from '../../application/dtos/user-profile.dto';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';
import { AccountBlockedError } from '../../domain/exceptions/account-blocked.error';
import { InvalidRefreshTokenError } from '../../domain/exceptions/invalid-refresh-token.error';
import { TenantAccessDeniedError } from '../../domain/exceptions/tenant-access-denied.error';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import type { LoginRequestDto } from '../../application/dtos/login-request.dto';
import type { RefreshRequestDto } from '../../application/dtos/refresh-request.dto';
import type { SwitchTenantRequestDto } from '../../application/dtos/switch-tenant-request.dto';
import type { RequestWithUser } from '../../../shared/infrastructure/types/request-with-user';

// --- Constantes de test ---

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TENANT_ID = '660e8400-e29b-41d4-a716-446655440001';
const TENANT_ID_2 = '660e8400-e29b-41d4-a716-446655440002';

// --- Helpers para crear datos de prueba ---

/** Crea un LoginResponseDto con datos de prueba. */
function createLoginResponse(): LoginResponseDto {
  const dto = new LoginResponseDto();
  dto.accessToken = 'jwt-access-token';
  dto.refreshToken = 'opaque-refresh-token';
  dto.expiresIn = 900;
  dto.user = { id: USER_ID, email: 'admin@test.com', name: 'Admin User' };
  dto.tenant = { id: TENANT_ID, name: 'Test Tenant', slug: 'test-tenant' };
  dto.role = 'PRESIDENT';
  return dto;
}

/** Crea un TenantSelectorDto con múltiples tenants. */
function createTenantSelectorResponse(): TenantSelectorDto {
  const dto = new TenantSelectorDto();
  dto.requiresTenantSelection = true;
  dto.tenants = [
    { id: TENANT_ID, name: 'Peña Test', slug: 'pena-test', role: 'PRESIDENT' },
    { id: TENANT_ID_2, name: 'Club Deportivo', slug: 'club-deportivo', role: 'SECRETARY' },
  ];
  return dto;
}

/** Crea un RefreshResponseDto con datos de prueba. */
function createRefreshResponse(): RefreshResponseDto {
  const dto = new RefreshResponseDto();
  dto.accessToken = 'new-jwt-access-token';
  dto.refreshToken = 'new-opaque-refresh-token';
  dto.expiresIn = 900;
  return dto;
}

/** Crea un UserProfileDto con datos de prueba. */
function createUserProfileResponse(): UserProfileDto {
  const dto = new UserProfileDto();
  dto.id = USER_ID;
  dto.email = 'admin@test.com';
  dto.name = 'Admin User';
  dto.currentTenant = { id: TENANT_ID, name: 'Test Tenant', slug: 'test-tenant' };
  dto.role = 'PRESIDENT';
  dto.permissions = ['identity:users:read', 'treasury:accounts:manage'];
  return dto;
}

/** Crea un objeto Request simulado con ip y headers. */
function createMockRequest(
  overrides: Partial<{
    ip: string;
    userAgent: string;
    user: { userId: string; tenantId: string };
  }> = {},
): Request & RequestWithUser {
  return {
    ip: overrides.ip ?? '127.0.0.1',
    headers: {
      'user-agent': overrides.userAgent ?? 'TestAgent/1.0',
    },
    user: overrides.user ?? { userId: USER_ID, tenantId: TENANT_ID },
  } as unknown as Request & RequestWithUser;
}

describe('AuthController', () => {
  let controller: AuthController;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let queryBus: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    commandBus = { execute: vi.fn() };
    queryBus = { execute: vi.fn() };

    controller = new AuthController(
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
    );
  });

  // =============================================
  // POST /api/v1/auth/login
  // =============================================

  describe('POST /api/v1/auth/login', () => {
    const loginDto = { email: 'admin@test.com', password: 'Test1234' };

    it('debería autenticar exitosamente con un solo tenant y devolver tokens', async () => {
      const expectedResponse = createLoginResponse();
      commandBus.execute.mockResolvedValue(expectedResponse);

      const req = createMockRequest();
      const result = await controller.login(loginDto as unknown as LoginRequestDto, req);

      // Verificar que se creó el comando correcto
      expect(commandBus.execute).toHaveBeenCalledOnce();
      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand).toBeInstanceOf(LoginCommand);
      expect(executedCommand.email).toBe('admin@test.com');
      expect(executedCommand.password).toBe('Test1234');
      expect(executedCommand.ipAddress).toBe('127.0.0.1');
      expect(executedCommand.userAgent).toBe('TestAgent/1.0');

      // Verificar respuesta con tokens y datos del usuario
      expect(result).toBe(expectedResponse);
      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.refreshToken).toBe('opaque-refresh-token');
      expect(result.expiresIn).toBe(900);
      expect(result.user.id).toBe(USER_ID);
      expect(result.user.email).toBe('admin@test.com');
      expect(result.tenant.id).toBe(TENANT_ID);
      expect(result.role).toBe('PRESIDENT');
    });

    it('debería devolver requiresTenantSelection cuando el usuario tiene múltiples tenants', async () => {
      const selectorResponse = createTenantSelectorResponse();
      commandBus.execute.mockResolvedValue(selectorResponse);

      const req = createMockRequest();
      const result = await controller.login(loginDto as unknown as LoginRequestDto, req);

      // Verificar que se retorna el selector de tenants
      expect(result).toBe(selectorResponse);
      const selector = result as unknown as TenantSelectorDto;
      expect(selector.requiresTenantSelection).toBe(true);
      expect(selector.tenants).toHaveLength(2);
      expect(selector.tenants[0].id).toBe(TENANT_ID);
      expect(selector.tenants[0].role).toBe('PRESIDENT');
      expect(selector.tenants[1].id).toBe(TENANT_ID_2);
      expect(selector.tenants[1].role).toBe('SECRETARY');
    });

    it('debería propagar InvalidCredentialsError cuando el email no existe', async () => {
      commandBus.execute.mockRejectedValue(new InvalidCredentialsError());

      const req = createMockRequest();
      await expect(controller.login(loginDto as unknown as LoginRequestDto, req)).rejects.toThrow(
        InvalidCredentialsError,
      );

      expect(commandBus.execute).toHaveBeenCalledOnce();
    });

    it('debería propagar InvalidCredentialsError cuando la contraseña es incorrecta', async () => {
      const wrongPasswordDto = { email: 'admin@test.com', password: 'WrongPass' };
      commandBus.execute.mockRejectedValue(new InvalidCredentialsError());

      const req = createMockRequest();
      await expect(
        controller.login(wrongPasswordDto as unknown as LoginRequestDto, req),
      ).rejects.toThrow(InvalidCredentialsError);

      // Verificar que el comando se creó con la contraseña incorrecta
      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand.password).toBe('WrongPass');
    });

    it('debería propagar AccountBlockedError cuando la cuenta está bloqueada', async () => {
      commandBus.execute.mockRejectedValue(new AccountBlockedError(10));

      const req = createMockRequest();
      await expect(controller.login(loginDto as unknown as LoginRequestDto, req)).rejects.toThrow(
        AccountBlockedError,
      );

      const error = await controller
        .login(loginDto as unknown as LoginRequestDto, req)
        .catch((e) => e);
      expect(error).toBeInstanceOf(AccountBlockedError);
      expect(error.minutesRemaining).toBe(10);
    });

    it('debería pasar ip y user-agent desde el request al comando', async () => {
      commandBus.execute.mockResolvedValue(createLoginResponse());

      const req = createMockRequest({ ip: '192.168.1.100', userAgent: 'Mozilla/5.0' });
      await controller.login(loginDto as unknown as LoginRequestDto, req);

      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand.ipAddress).toBe('192.168.1.100');
      expect(executedCommand.userAgent).toBe('Mozilla/5.0');
    });

    it('debería usar "unknown" como fallback cuando ip o user-agent no están presentes', async () => {
      commandBus.execute.mockResolvedValue(createLoginResponse());

      const req = {
        ip: undefined,
        headers: {},
      } as unknown as Request;

      await controller.login(loginDto as unknown as LoginRequestDto, req);

      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand.ipAddress).toBe('unknown');
      expect(executedCommand.userAgent).toBe('unknown');
    });
  });

  // =============================================
  // POST /api/v1/auth/refresh
  // =============================================

  describe('POST /api/v1/auth/refresh', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('debería renovar tokens exitosamente con un refresh token válido', async () => {
      const expectedResponse = createRefreshResponse();
      commandBus.execute.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(refreshDto as unknown as RefreshRequestDto);

      // Verificar que se creó el comando correcto
      expect(commandBus.execute).toHaveBeenCalledOnce();
      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand).toBeInstanceOf(RefreshTokenCommand);
      expect(executedCommand.refreshToken).toBe('valid-refresh-token');

      // Verificar respuesta con nuevos tokens
      expect(result).toBe(expectedResponse);
      expect(result.accessToken).toBe('new-jwt-access-token');
      expect(result.refreshToken).toBe('new-opaque-refresh-token');
      expect(result.expiresIn).toBe(900);
    });

    it('debería propagar InvalidRefreshTokenError cuando el token es inválido', async () => {
      commandBus.execute.mockRejectedValue(new InvalidRefreshTokenError());

      await expect(controller.refresh(refreshDto as unknown as RefreshRequestDto)).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });

    it('debería propagar InvalidRefreshTokenError cuando el token ha expirado', async () => {
      const expiredDto = { refreshToken: 'expired-refresh-token' };
      commandBus.execute.mockRejectedValue(new InvalidRefreshTokenError());

      await expect(controller.refresh(expiredDto as unknown as RefreshRequestDto)).rejects.toThrow(
        InvalidRefreshTokenError,
      );

      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand.refreshToken).toBe('expired-refresh-token');
    });
  });

  // =============================================
  // POST /api/v1/auth/logout
  // =============================================

  describe('POST /api/v1/auth/logout', () => {
    it('debería cerrar sesión revocando el refresh token', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const req = createMockRequest({ user: { userId: USER_ID, tenantId: TENANT_ID } });
      const body = { refreshToken: 'token-to-revoke' };

      await controller.logout(req, body);

      // Verificar que se creó el comando correcto
      expect(commandBus.execute).toHaveBeenCalledOnce();
      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand).toBeInstanceOf(LogoutCommand);
      expect(executedCommand.userId).toBe(USER_ID);
      expect(executedCommand.refreshToken).toBe('token-to-revoke');
    });

    it('debería no retornar valor (void) tras cerrar sesión', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const req = createMockRequest({ user: { userId: USER_ID, tenantId: TENANT_ID } });
      const body = { refreshToken: 'any-token' };

      const result = await controller.logout(req, body);

      // El endpoint devuelve 204 No Content, el método retorna void
      expect(result).toBeUndefined();
    });
  });

  // =============================================
  // POST /api/v1/auth/switch-tenant
  // =============================================

  describe('POST /api/v1/auth/switch-tenant', () => {
    const switchDto = { tenantId: TENANT_ID_2 };

    it('debería cambiar de tenant exitosamente y devolver nuevos tokens', async () => {
      const expectedResponse = createLoginResponse();
      expectedResponse.tenant = { id: TENANT_ID_2, name: 'Club Deportivo', slug: 'club-deportivo' };
      expectedResponse.role = 'SECRETARY';
      commandBus.execute.mockResolvedValue(expectedResponse);

      const req = createMockRequest({ user: { userId: USER_ID, tenantId: TENANT_ID } });
      const result = await controller.switchTenant(
        req,
        switchDto as unknown as SwitchTenantRequestDto,
      );

      // Verificar que se creó el comando correcto
      expect(commandBus.execute).toHaveBeenCalledOnce();
      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand).toBeInstanceOf(SwitchTenantCommand);
      expect(executedCommand.userId).toBe(USER_ID);
      expect(executedCommand.newTenantId).toBe(TENANT_ID_2);

      // Verificar respuesta con contexto del nuevo tenant
      expect(result).toBe(expectedResponse);
      expect(result.tenant.id).toBe(TENANT_ID_2);
      expect(result.role).toBe('SECRETARY');
    });

    it('debería propagar TenantAccessDeniedError cuando el usuario no tiene acceso al tenant', async () => {
      const unauthorizedTenantId = '990e8400-e29b-41d4-a716-446655440099';
      const dto = { tenantId: unauthorizedTenantId };
      commandBus.execute.mockRejectedValue(new TenantAccessDeniedError(unauthorizedTenantId));

      const req = createMockRequest({ user: { userId: USER_ID, tenantId: TENANT_ID } });
      await expect(
        controller.switchTenant(req, dto as unknown as SwitchTenantRequestDto),
      ).rejects.toThrow(TenantAccessDeniedError);

      const executedCommand = commandBus.execute.mock.calls[0][0];
      expect(executedCommand.newTenantId).toBe(unauthorizedTenantId);
    });
  });

  // =============================================
  // GET /api/v1/auth/me
  // =============================================

  describe('GET /api/v1/auth/me', () => {
    it('debería obtener el perfil del usuario autenticado con rol y permisos', async () => {
      const expectedProfile = createUserProfileResponse();
      queryBus.execute.mockResolvedValue(expectedProfile);

      const req = createMockRequest({ user: { userId: USER_ID, tenantId: TENANT_ID } });
      const result = await controller.me(req);

      // Verificar que se creó la query correcta
      expect(queryBus.execute).toHaveBeenCalledOnce();
      const executedQuery = queryBus.execute.mock.calls[0][0];
      expect(executedQuery).toBeInstanceOf(GetCurrentUserQuery);
      expect(executedQuery.userId).toBe(USER_ID);
      expect(executedQuery.tenantId).toBe(TENANT_ID);

      // Verificar respuesta con perfil completo
      expect(result).toBe(expectedProfile);
      expect(result.id).toBe(USER_ID);
      expect(result.email).toBe('admin@test.com');
      expect(result.name).toBe('Admin User');
      expect(result.currentTenant.id).toBe(TENANT_ID);
      expect(result.currentTenant.slug).toBe('test-tenant');
      expect(result.role).toBe('PRESIDENT');
      expect(result.permissions).toEqual(['identity:users:read', 'treasury:accounts:manage']);
    });

    it('debería propagar error cuando el usuario no se encuentra', async () => {
      queryBus.execute.mockRejectedValue(new InvalidCredentialsError());

      const req = createMockRequest({ user: { userId: 'nonexistent-id', tenantId: TENANT_ID } });
      await expect(controller.me(req)).rejects.toThrow(InvalidCredentialsError);

      const executedQuery = queryBus.execute.mock.calls[0][0];
      expect(executedQuery.userId).toBe('nonexistent-id');
    });

    it('debería usar userId y tenantId del JWT decodificado en el request', async () => {
      queryBus.execute.mockResolvedValue(createUserProfileResponse());

      const customUserId = 'custom-user-id';
      const customTenantId = 'custom-tenant-id';
      const req = createMockRequest({ user: { userId: customUserId, tenantId: customTenantId } });

      await controller.me(req);

      const executedQuery = queryBus.execute.mock.calls[0][0];
      expect(executedQuery.userId).toBe(customUserId);
      expect(executedQuery.tenantId).toBe(customTenantId);
    });
  });
});
