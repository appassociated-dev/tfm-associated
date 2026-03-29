import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ImportFeePlanTemplateCommand } from './import-fee-plan-template.command';
import { FeePlanResponseDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';
import { FeePlan, CreateFeePlanProps } from '../../domain/aggregates/fee-plan';
import { FeePlanCode } from '../../domain/value-objects/fee-plan-code';
import { FEE_PLAN_TEMPLATES } from '../data/fee-plan-templates';

/**
 * Handler del comando de importación de plantillas de planes de cuota.
 * Obtiene las plantillas para el tipo de colectividad y crea los planes que no existan.
 */
@CommandHandler(ImportFeePlanTemplateCommand)
export class ImportFeePlanTemplateHandler implements ICommandHandler<ImportFeePlanTemplateCommand> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
  ) {}

  async execute(command: ImportFeePlanTemplateCommand): Promise<FeePlanResponseDto[]> {
    // 0. Establecer tenantId en el repositorio (ADR-002)
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Obtener plantillas para el tipo de colectividad
    const templates = FEE_PLAN_TEMPLATES.filter(
      (t) => t.collectivityType === command.collectivityType,
    );

    const createdPlans: FeePlanResponseDto[] = [];

    // 2. Para cada plantilla, crear el plan si el código no existe
    for (const template of templates) {
      const codeResult = FeePlanCode.create(template.code);
      if (!codeResult.ok) {
        continue; // Omitir plantillas con código inválido
      }

      const exists = await this.feePlanRepository.existsByCode(codeResult.value);
      if (exists) {
        continue; // Omitir si ya existe un plan con ese código
      }

      const createProps: CreateFeePlanProps = {
        code: template.code,
        name: template.name,
        description: template.description,
        type: template.type,
        frequency: template.frequency,
        amount: template.amount,
        billingMonths: template.billingMonths,
        tenantId: command.tenantId,
      };

      const result = FeePlan.create(createProps);
      if (!result.ok) {
        continue; // Omitir plantillas que no pasen validación
      }

      const feePlan = result.value;
      await this.feePlanRepository.save(feePlan);

      // Publicar eventos
      const events = feePlan.pullDomainEvents();
      if (events.length > 0) {
        await this.outboxPublisher.publish(command.tenantId, events);
      }

      createdPlans.push(FeePlanResponseDto.fromDomain(feePlan));
    }

    return createdPlans;
  }
}
