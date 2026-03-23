import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeactivateFeePlanCommand } from './deactivate-fee-plan.command';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { FeePlanNotFoundError, FeePlanHasActiveSubscriptionsError } from '../../domain/exceptions';

/**
 * Handler del comando de desactivación de plan de cuota.
 * Valida existencia, comprueba suscripciones activas y desactiva el plan.
 */
@CommandHandler(DeactivateFeePlanCommand)
export class DeactivateFeePlanHandler implements ICommandHandler<DeactivateFeePlanCommand> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(command: DeactivateFeePlanCommand): Promise<void> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Buscar el plan de cuota existente
    const feePlanId = FeePlanId.fromString(command.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);

    if (!feePlan) {
      throw new FeePlanNotFoundError(command.feePlanId);
    }

    // 2. Verificar que no tiene suscripciones activas (422 si las tiene)
    const hasActive = await this.feePlanRepository.hasActiveSubscriptions(feePlanId);
    if (hasActive) {
      throw new FeePlanHasActiveSubscriptionsError(command.feePlanId);
    }

    // 3. Desactivar el plan
    feePlan.deactivate();

    // 4. Persistir
    await this.feePlanRepository.save(feePlan);
  }
}
