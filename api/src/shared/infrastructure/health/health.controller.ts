import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../identity/infrastructure/auth/public.decorator';
import { PrismaMainService } from '../persistence/prisma-main.service';

/**
 * Controlador de health check para monitoreo de infraestructura.
 * Endpoint: GET /api/v1/health
 *
 * Verifica la conectividad con la base de datos principal (DB-Main)
 * mediante una consulta trivial (SELECT 1). Usado por:
 * - Docker HEALTHCHECK para restart automatico
 * - Host nginx para upstream health
 * - Herramientas de monitoreo externas
 *
 * @SkipThrottle({ default: true, login: true }) excluye este controlador de TODOS
 * los throttlers (default y login) definidos en AppModule (REQ-RL-004).
 * Sin los nombres explícitos, @SkipThrottle() solo skipea 'default'.
 */
@SkipThrottle({ default: true, login: true })
@ApiTags('Health')
@Controller('v1/health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaMainService,
  ) {}

  /**
   * Retorna el estado de salud de la aplicacion.
   * Incluye verificacion de conectividad con PostgreSQL.
   *
   * - BD activa  → 200 con status "up"
   * - BD caida   → 503 con status "down" (indicator.down() lanza error
   *   que Terminus captura para devolver 503 automaticamente)
   */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar estado de salud de la API' })
  @ApiResponse({ status: 200, description: 'API saludable' })
  @ApiResponse({ status: 503, description: 'API no saludable' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.checkDatabase()]);
  }

  /**
   * Verifica la conectividad con la base de datos principal
   * ejecutando una consulta trivial (SELECT 1).
   *
   * Usa HealthIndicatorService (Terminus v11+):
   * - indicator.up()   → retorna resultado saludable
   * - indicator.down() → lanza HealthCheckError → Terminus responde 503
   */
  private async checkDatabase() {
    const check = this.indicator.check('database');

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return check.up();
    } catch {
      return check.down();
    }
  }
}
