import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { GenerateMonthlyChargesCommand } from '../../application/commands/generate-monthly-charges.command';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';

/** Timeout máximo para la generación de cargos por tenant (5 minutos). */
const TENANT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Cron job para la generación automática de cargos periódicos.
 * Se ejecuta el día 1 de cada mes a las 02:00 AM.
 *
 * Itera sobre todos los tenants activos de DB-Main y genera cargos
 * para cada uno de forma independiente (US-047).
 * Si un tenant falla, se registra el error y se continúa con el siguiente.
 */
@Injectable()
export class ChargeGenerationCron {
  private readonly logger = new Logger(ChargeGenerationCron.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly prismaMain: PrismaMainService,
  ) {}

  /**
   * Ejecuta la generación masiva de cargos el día 1 de cada mes a las 02:00 AM.
   * Itera sobre todos los tenants activos y genera cargos para cada uno.
   */
  @Cron('0 2 1 * *')
  async handleMonthlyChargeGeneration(): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    this.logger.log(`Iniciando generación masiva de cargos para ${month}/${year}`);
    const startTime = Date.now();

    // 1. Obtener todos los tenants activos de DB-Main
    const activeTenants = await this.prismaMain.tenant.findMany({
      where: { status: 'active' },
    });

    if (activeTenants.length === 0) {
      this.logger.warn('No se encontraron tenants activos. Generación omitida.');
      return;
    }

    this.logger.log(`Procesando ${activeTenants.length} tenants activos`);

    let totalCharges = 0;
    let tenantsOk = 0;
    let tenantsFailed = 0;

    // 2. Iterar sobre cada tenant de forma secuencial
    for (const tenant of activeTenants) {
      try {
        const command = new GenerateMonthlyChargesCommand(tenant.id, month, year);

        // Aplicar timeout de 5 minutos por tenant
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Timeout excedido (${TENANT_TIMEOUT_MS / 1000}s) para tenant ${tenant.id}`,
                ),
              ),
            TENANT_TIMEOUT_MS,
          ),
        );

        const result = await Promise.race([this.commandBus.execute(command), timeoutPromise]);

        totalCharges += result.chargesGenerated;
        tenantsOk++;

        this.logger.log(
          `Tenant ${tenant.name} (${tenant.id}): ${result.chargesGenerated} cargos generados`,
        );
      } catch (error) {
        tenantsFailed++;
        this.logger.error(
          `Error procesando tenant ${tenant.name} (${tenant.id}): ${(error as Error).message}`,
          (error as Error).stack,
        );
        // Continuar con el siguiente tenant
      }
    }

    // 3. Resumen final
    const durationMs = Date.now() - startTime;
    this.logger.log(
      `Generación completada en ${durationMs}ms: ` +
        `${totalCharges} cargos totales, ` +
        `${tenantsOk} tenants OK, ${tenantsFailed} tenants con error`,
    );

    if (durationMs > 120000) {
      this.logger.warn(`Generación tardó más de 2 minutos (${durationMs}ms)`);
    }
  }
}
