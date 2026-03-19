import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ActivateFeePlanCommand } from './activate-fee-plan.command';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { FeePlanNotFoundError } from '../../domain/exceptions';

/**
 * Handler del comando de activación de plan de cuota.
 * Valida existencia y activa el plan.
 */
@CommandHandler(ActivateFeePlanCommand)
export class ActivateFeePlanHandler implements ICommandHandler<ActivateFeePlanCommand> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(command: ActivateFeePlanCommand): Promise<void> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Buscar el plan de cuota existente
    const feePlanId = FeePlanId.fromString(command.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);

    if (!feePlan) {
      throw new FeePlanNotFoundError(command.feePlanId);
    }

    // 2. Activar el plan
    feePlan.activate();

    // 3. Persistir
    await this.feePlanRepository.save(feePlan);
  }
}
