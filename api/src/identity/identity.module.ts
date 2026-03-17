import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TenantsController } from './infrastructure/controllers/tenants.controller';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { ProvisionTenantHandler } from './application/commands/provision-tenant.handler';
import { LoginHandler } from './application/commands/login.handler';
import { RefreshTokenHandler } from './application/commands/refresh-token.handler';
import { LogoutHandler } from './application/commands/logout.handler';
import { SwitchTenantHandler } from './application/commands/switch-tenant.handler';
import { GetCurrentUserHandler } from './application/queries/get-current-user.handler';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository';
import { PrismaTenantRepository } from './infrastructure/persistence/prisma-tenant.repository';
import { DATABASE_PROVISIONING_PORT } from './application/ports/database-provisioning.port';
import { DatabaseProvisioningService } from './infrastructure/services/database-provisioning.service';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.port';
import { Argon2PasswordHasher } from './infrastructure/services/argon2-password-hasher';
import { TOKEN_SERVICE } from './domain/ports/token-service.port';
import { JwtTokenServiceImpl } from './infrastructure/services/jwt-token.service';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { JwtAuthGuard } from '../shared/infrastructure/guards/jwt-auth.guard';
import { PermissionsGuard } from '../shared/infrastructure/guards/permissions.guard';

/**
 * BC-Identity: Usuarios, tenants, membresías y roles.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling
 * - JwtModule y PassportModule para autenticación (ADR-006)
 * - TenantsController para el endpoint REST de provisión
 * - AuthController para los endpoints REST de autenticación
 * - Handlers CQRS: provisión, login, refresh, logout, switch tenant, perfil
 * - Repositorios y puertos de infraestructura vía inyección por token
 * - Guards globales: JwtAuthGuard y PermissionsGuard (ADR-006, ADR-007)
 *
 * PrismaMainService, ENCRYPTION_SERVICE, TENANT_CREDENTIAL_PROVIDER y
 * TENANT_CREDENTIAL_PORT son provistos globalmente por TenantCredentialsModule.
 */
@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [TenantsController, AuthController],
  providers: [
    // Handlers CQRS
    ProvisionTenantHandler,
    LoginHandler,
    RefreshTokenHandler,
    LogoutHandler,
    SwitchTenantHandler,
    GetCurrentUserHandler,

    // Repositorios (inyección por token)
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },

    // Puertos de infraestructura (inyección por token)
    {
      provide: DATABASE_PROVISIONING_PORT,
      useClass: DatabaseProvisioningService,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenServiceImpl,
    },

    // Estrategia JWT (Passport)
    JwtStrategy,

    // Guards globales (ADR-006 y ADR-007)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [],
})
export class IdentityModule {}
