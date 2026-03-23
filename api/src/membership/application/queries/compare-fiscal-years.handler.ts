import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CompareFiscalYearsQuery } from './compare-fiscal-years.query';
import { FiscalYearComparisonDto } from '../dtos/fiscal-year-comparison.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import { FiscalYearId } from '../../domain/value-objects/fiscal-year-id';
import { FiscalYearNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para comparar ejercicios fiscales.
 * Para MVP (sin modelo Member), retorna estadísticas con valores base.
 */
@QueryHandler(CompareFiscalYearsQuery)
export class CompareFiscalYearsHandler implements IQueryHandler<CompareFiscalYearsQuery> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async execute(query: CompareFiscalYearsQuery): Promise<FiscalYearComparisonDto> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.fiscalYearRepository.setTenantId(query.tenantId);

    const comparisonDto = new FiscalYearComparisonDto();
    comparisonDto.years = [];

    for (const fyId of query.fiscalYearIds) {
      const fiscalYearId = FiscalYearId.fromString(fyId);
      const fiscalYear = await this.fiscalYearRepository.findById(fiscalYearId);

      if (!fiscalYear) {
        throw new FiscalYearNotFoundError(fyId);
      }

      // Para MVP (sin modelo Member), estadísticas con valores base
      comparisonDto.years.push({
        fiscalYearId: fiscalYear.id.toValue(),
        name: fiscalYear.name,
        activeMembers: fiscalYear.membersAtEnd ?? fiscalYear.membersAtStart,
        newMembers: 0,
        leavingMembers: 0,
        retentionRate: 0,
      });
    }

    return comparisonDto;
  }
}
