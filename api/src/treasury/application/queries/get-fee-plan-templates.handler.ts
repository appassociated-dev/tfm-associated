import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFeePlanTemplatesQuery } from './get-fee-plan-templates.query';
import { FeePlanTemplateResponseDto } from '../dtos/fee-plan-template-response.dto';
import { FEE_PLAN_TEMPLATES } from '../data/fee-plan-templates';

/**
 * Handler de la query para obtener plantillas de planes de cuota.
 * Retorna datos estáticos filtrados por tipo de colectividad.
 */
@QueryHandler(GetFeePlanTemplatesQuery)
export class GetFeePlanTemplatesHandler implements IQueryHandler<GetFeePlanTemplatesQuery> {
  async execute(query: GetFeePlanTemplatesQuery): Promise<FeePlanTemplateResponseDto[]> {
    const templates = FEE_PLAN_TEMPLATES.filter(
      (t) => t.collectivityType === query.collectivityType,
    );

    return templates.map((t) => {
      const dto = new FeePlanTemplateResponseDto();
      dto.code = t.code;
      dto.name = t.name;
      dto.description = t.description;
      dto.type = t.type;
      dto.frequency = t.frequency;
      dto.amount = t.amount;
      dto.amountFormatted = `${(t.amount / 100).toFixed(2)} EUR`;
      dto.billingMonths = t.billingMonths;
      dto.collectivityType = t.collectivityType;
      return dto;
    });
  }
}
