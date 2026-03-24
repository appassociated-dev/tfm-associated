import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Modulo de health check.
 * Registra TerminusModule de @nestjs/terminus y el controlador
 * que expone GET /api/v1/health.
 *
 * PrismaMainService se inyecta desde TenantCredentialsModule (@Global),
 * por lo que no necesita ser importado explicitamente aqui.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
