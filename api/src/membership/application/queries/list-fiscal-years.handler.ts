import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListFiscalYearsQuery } from './list-fiscal-years.query';
import { FiscalYearResponseDto } from '../dtos/fiscal-year-response.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';

/**
 * Handler de la query para listar todos los ejercicios fiscales.
 */
@QueryHandler(ListFiscalYearsQuery)
export class ListFiscalYearsHandler implements IQueryHandler<ListFiscalYearsQuery> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async execute(query: ListFiscalYearsQuery): Promise<FiscalYearResponseDto[]> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.fiscalYearRepository.setTenantId(query.tenantId);

    const fiscalYears = await this.fiscalYearRepository.findAll();

    return fiscalYears.map((fy) => FiscalYearResponseDto.fromDomain(fy));
  }
}
