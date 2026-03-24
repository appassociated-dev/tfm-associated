import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { TenantSelectorDto } from '../dtos/tenant-selector.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TOKEN_SERVICE, TokenService, JwtPayload } from '../../domain/ports/token-service.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';
import { AccountBlockedError } from '../../domain/exceptions/account-blocked.error';
import { parsePermissions } from '../../../shared/application/utils/parse-permissions';

/** Tiempo de expiración del access token en segundos (15 minutos). */
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;

/** Días de validez del refresh token. */
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * Handler del comando de inicio de sesión.
 * Autentica al usuario, verifica membresías y genera tokens JWT.
 * Si el usuario pertenece a múltiples tenants, devuelve un selector.
 */
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly prismaMain: PrismaMainService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponseDto | TenantSelectorDto> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2. Verificar si la cuenta está bloqueada
    if (user.isBlocked()) {
      const remaining = user.getBlockTimeRemaining();
      const minutesRemaining = Math.ceil(remaining / 60000);
      throw new AccountBlockedError(minutesRemaining);
    }

    // 3. Autenticar con contraseña
    const authResult = await user.authenticate(command.password, this.passwordHasher);

    if (!authResult.ok) {
      // Persistir intento fallido (el aggregate ya registró el intento internamente)
      await this.userRepository.save(user);
      throw new InvalidCredentialsError();
    }

    // 4. Persistir usuario (actualiza lastAccess, limpia intentos)
    await this.userRepository.save(user);

    // 5. Obtener membresías del usuario con datos de tenant y rol
    const memberships = await this.prismaMain.tenantMembership.findMany({
      where: { userId: user.id.toValue(), active: true },
      include: { tenant: true, role: true },
    });

    // 6. Si tiene múltiples membresías, devolver selector de tenant
    if (memberships.length > 1) {
      const dto = new TenantSelectorDto();
      dto.requiresTenantSelection = true;
      dto.tenants = memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role.code,
      }));
      return dto;
    }

    // 7. Membresía única (o sin membresías — caso edge)
    if (memberships.length === 0) {
      throw new InvalidCredentialsError();
    }

    const membership = memberships[0];
    const permissions = parsePermissions(membership.role.permissions);

    // 8. Generar tokens
    const payload: JwtPayload = {
      sub: user.id.toValue(),
      tenantId: membership.tenant.id,
      email: user.email.value,
      name: user.name,
      rol: membership.role.code,
      permissions,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

    // 9. Almacenar refresh token hasheado
    await this.refreshTokenRepository.create({
      tokenHash: refreshTokenHash,
      userId: user.id.toValue(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    // 10. Construir respuesta
    const response = new LoginResponseDto();
    response.accessToken = accessToken;
    response.refreshToken = refreshToken;
    response.expiresIn = ACCESS_TOKEN_EXPIRY_SECONDS;
    response.user = {
      id: user.id.toValue(),
      email: user.email.value,
      name: user.name,
    };
    response.tenant = {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
    };
    response.role = membership.role.code;

    return response;
  }
}
