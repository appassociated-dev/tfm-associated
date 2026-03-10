import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFiscalYearQuery } from './get-fiscal-year.query';
import { FiscalYearResponseDto } from '../dtos/fiscal-year-response.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import { FiscalYearId } from '../../domain/value-objects/fiscal-year-id';
import { FiscalYearNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener un ejercicio fiscal por ID.
 */
@QueryHandler(GetFiscalYearQuery)
export class GetFiscalYearHandler implements IQueryHandler<GetFiscalYearQuery> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async execute(query: GetFiscalYearQuery): Promise<FiscalYearResponseDto> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.fiscalYearRepository.setTenantId(query.tenantId);

    const fiscalYearId = FiscalYearId.fromString(query.fiscalYearId);
    const fiscalYear = await this.fiscalYearRepository.findById(fiscalYearId);

    if (!fiscalYear) {
      throw new FiscalYearNotFoundError(query.fiscalYearId);
    }

    return FiscalYearResponseDto.fromDomain(fiscalYear);
  }
}
