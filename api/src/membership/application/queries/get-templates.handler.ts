import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetTemplatesQuery } from './get-templates.query';
import { MemberTypeTemplateDto } from '../dtos/member-type-template.dto';
import { getTemplatesForCollectivityType } from '../../infrastructure/data/member-type-templates';

/**
 * Handler de la query para obtener plantillas de tipos de socio.
 * Devuelve plantillas estáticas según el tipo de colectividad.
 */
@QueryHandler(GetTemplatesQuery)
export class GetTemplatesHandler implements IQueryHandler<GetTemplatesQuery> {
  async execute(query: GetTemplatesQuery): Promise<MemberTypeTemplateDto[]> {
    const templates = getTemplatesForCollectivityType(query.collectivityType);

    return templates.map((t) => MemberTypeTemplateDto.fromTemplate(t));
  }
}
