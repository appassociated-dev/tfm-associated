import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateFeePlanCommand } from './update-fee-plan.command';
import { FeePlanResponseDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  TREASURY_OUTBOX_PUBLISHER,
  TreasuryOutboxPublisher,
} from '../ports/treasury-outbox.publisher';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { FeePlanNotFoundError } from '../../domain/exceptions';

/**
 * Handler del comando de actualización de plan de cuota.
 * Busca el aggregate, valida tipo/billingMonths, aplica cambios y persiste.
 */
@CommandHandler(UpdateFeePlanCommand)
export class UpdateFeePlanHandler implements ICommandHandler<UpdateFeePlanCommand> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: UpdateFeePlanCommand): Promise<FeePlanResponseDto> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Buscar el plan de cuota existente
    const feePlanId = FeePlanId.fromString(command.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);

    if (!feePlan) {
      throw new FeePlanNotFoundError(command.feePlanId);
    }

    // 2. Aplicar cambios al aggregate (valida coherencia tipo/billingMonths internamente)
    const updateResult = feePlan.update({
      name: command.name,
      description: command.description,
      type: command.type,
      frequency: command.frequency,
      amount: command.amount,
      billingMonths: command.billingMonths,
    });

    if (!updateResult.ok) {
      throw updateResult.error;
    }

    // 3. Persistir
    await this.feePlanRepository.save(feePlan);

    // 4. Publicar eventos de dominio al outbox
    const events = feePlan.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    // 5. Retornar DTO
    return FeePlanResponseDto.fromDomain(feePlan);
  }
}
