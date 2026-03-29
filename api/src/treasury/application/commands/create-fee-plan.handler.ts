import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateFeePlanCommand } from './create-fee-plan.command';
import { FeePlanResponseDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';
import { FeePlan } from '../../domain/aggregates/fee-plan';
import { FeePlanCode } from '../../domain/value-objects/fee-plan-code';
import { FeePlanCodeAlreadyExistsError } from '../../domain/exceptions';

/**
 * Handler del comando de creación de plan de cuota.
 * Valida unicidad de código, coherencia tipo/billingMonths, crea el aggregate y publica eventos.
 */
@CommandHandler(CreateFeePlanCommand)
export class CreateFeePlanHandler implements ICommandHandler<CreateFeePlanCommand> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
  ) {}

  async execute(command: CreateFeePlanCommand): Promise<FeePlanResponseDto> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Validar unicidad del código
    const codeResult = FeePlanCode.create(command.code);
    if (!codeResult.ok) {
      throw codeResult.error;
    }

    const codeExists = await this.feePlanRepository.existsByCode(codeResult.value);
    if (codeExists) {
      throw new FeePlanCodeAlreadyExistsError(command.code);
    }

    // 2. Crear aggregate FeePlan (valida coherencia tipo/billingMonths internamente)
    const result = FeePlan.create({
      code: command.code,
      name: command.name,
      description: command.description,
      type: command.type,
      frequency: command.frequency,
      amount: command.amount,
      billingMonths: command.billingMonths,
      tenantId: command.tenantId,
    });

    if (!result.ok) {
      throw result.error;
    }

    const feePlan = result.value;

    // 3. Persistir
    await this.feePlanRepository.save(feePlan);

    // 4. Publicar eventos de dominio al outbox
    const events = feePlan.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    // 5. Retornar DTO de respuesta
    return FeePlanResponseDto.fromDomain(feePlan);
  }
}
