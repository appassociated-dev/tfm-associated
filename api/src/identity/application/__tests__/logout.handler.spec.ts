import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutHandler } from '../commands/logout.handler';
import { LogoutCommand } from '../commands/logout.command';
import type { TokenService } from '../../domain/ports/token-service.port';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let tokenService: Record<string, ReturnType<typeof vi.fn>>;
  let refreshTokenRepository: Record<string, ReturnType<typeof vi.fn>>;

  const command = new LogoutCommand('user-id-123', 'raw-refresh-token');

  beforeEach(() => {
    vi.clearAllMocks();

    tokenService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      hashRefreshToken: vi.fn().mockReturnValue('hashed-refresh-token'),
      verifyAccessToken: vi.fn(),
    };

    refreshTokenRepository = {
      create: vi.fn(),
      findByTokenHash: vi.fn(),
      revoke: vi.fn().mockResolvedValue(undefined),
      revokeAllForUser: vi.fn(),
    };

    handler = new LogoutHandler(
      tokenService as unknown as TokenService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
    );
  });

  it('debería revocar el refresh token exitosamente', async () => {
    await handler.execute(command);

    // Verificar que se hasheó el token
    expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('raw-refresh-token');

    // Verificar que se revocó el token hasheado
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('hashed-refresh-token');
    expect(refreshTokenRepository.revoke).toHaveBeenCalledOnce();
  });

  it('debería completarse sin error aunque el token no exista (idempotente)', async () => {
    refreshTokenRepository.revoke.mockResolvedValue(undefined);

    // No debería lanzar error
    await expect(handler.execute(command)).resolves.toBeUndefined();
  });
});
