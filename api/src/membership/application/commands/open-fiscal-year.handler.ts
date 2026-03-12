import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OpenFiscalYearCommand } from './open-fiscal-year.command';
import { OpenFiscalYearResultDto } from '../dtos/open-fiscal-year-result.dto';
import { FiscalYearResponseDto } from '../dtos/fiscal-year-response.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import { FiscalYear } from '../../domain/aggregates/fiscal-year';
import { FiscalYearPeriod } from '../../domain/value-objects/fiscal-year-period';
import {
  FiscalYearAlreadyOpenError,
  FiscalYearOverlappingDatesError,
} from '../../domain/exceptions';

/**
 * Handler del comando de apertura de ejercicio fiscal.
 * Valida que no exista otro ejercicio abierto, que no haya solapamiento de fechas,
 * crea el aggregate y lo transiciona a estado OPEN.
 */
@CommandHandler(OpenFiscalYearCommand)
export class OpenFiscalYearHandler implements ICommandHandler<OpenFiscalYearCommand> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async execute(command: OpenFiscalYearCommand): Promise<OpenFiscalYearResultDto> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.fiscalYearRepository.setTenantId(command.tenantId);

    // 1. Verificar que no existe otro ejercicio fiscal abierto
    const hasOpenFiscalYear = await this.fiscalYearRepository.existsOpenFiscalYear();
    if (hasOpenFiscalYear) {
      throw new FiscalYearAlreadyOpenError();
    }

    // 2. Verificar que las fechas no se solapan con ejercicios existentes
    const newPeriodResult = FiscalYearPeriod.create(
      new Date(command.startDate),
      new Date(command.endDate),
    );

    if (!newPeriodResult.ok) {
      throw new Error(newPeriodResult.error.message);
    }

    const newPeriod = newPeriodResult.value;
    const overlapping = await this.fiscalYearRepository.findOverlapping(newPeriod);
    if (overlapping.length > 0) {
      throw new FiscalYearOverlappingDatesError(overlapping[0].name);
    }

    // 3. Crear aggregate FiscalYear
    const result = FiscalYear.create({
      name: command.name,
      type: command.type,
      startDate: new Date(command.startDate),
      endDate: new Date(command.endDate),
      previousFiscalYearId: command.previousFiscalYearId,
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    const fiscalYear = result.value;

    // 4. Preparar datos de traslado de socios (para MVP: sin modelo Member aún)
    const carriedOverMembers = 0;
    const appliedTransitions: Array<{
      memberId: string;
      previousType: string;
      newType: string;
    }> = [];

    // 5. Transicionar a OPEN
    fiscalYear.open(carriedOverMembers);

    // 6. Persistir
    await this.fiscalYearRepository.save(fiscalYear);

    // 7. Construir resultado
    const resultDto = new OpenFiscalYearResultDto();
    resultDto.fiscalYear = FiscalYearResponseDto.fromDomain(fiscalYear);
    resultDto.carriedOverMembers = carriedOverMembers;
    resultDto.appliedTransitions = appliedTransitions;

    return resultDto;
  }
}
