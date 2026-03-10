import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetActiveFiscalYearQuery } from './get-active-fiscal-year.query';
import { FiscalYearResponseDto } from '../dtos/fiscal-year-response.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import { FiscalYearNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener el ejercicio fiscal activo.
 * Retorna el ejercicio en estado OPEN, o lanza error si no hay ninguno.
 */
@QueryHandler(GetActiveFiscalYearQuery)
export class GetActiveFiscalYearHandler implements IQueryHandler<GetActiveFiscalYearQuery> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async execute(query: GetActiveFiscalYearQuery): Promise<FiscalYearResponseDto> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.fiscalYearRepository.setTenantId(query.tenantId);

    const activeFiscalYear = await this.fiscalYearRepository.findActive();

    if (!activeFiscalYear) {
      throw new FiscalYearNotFoundError('active');
    }

    return FiscalYearResponseDto.fromDomain(activeFiscalYear);
  }
}
