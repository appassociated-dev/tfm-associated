import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CloseFiscalYearCommand } from './close-fiscal-year.command';
import { CloseFiscalYearResultDto } from '../dtos/close-fiscal-year-result.dto';
import { FiscalYearResponseDto } from '../dtos/fiscal-year-response.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import { FiscalYearId } from '../../domain/value-objects/fiscal-year-id';
import { FiscalYearStatus } from '../../domain/value-objects/fiscal-year-status';
import {
  FiscalYearNotFoundError,
  FiscalYearInvalidTransitionError,
  FiscalYearCloseWarningsError,
} from '../../domain/exceptions';

/**
 * Handler del comando de cierre de ejercicio fiscal.
 * Valida que el ejercicio esté abierto, ejecuta validaciones pre-cierre
 * y transiciona a estado CLOSED.
 */
@CommandHandler(CloseFiscalYearCommand)
export class CloseFiscalYearHandler implements ICommandHandler<CloseFiscalYearCommand> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async execute(command: CloseFiscalYearCommand): Promise<CloseFiscalYearResultDto> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.fiscalYearRepository.setTenantId(command.tenantId);

    // 1. Buscar el ejercicio fiscal por ID
    const fiscalYearId = FiscalYearId.fromString(command.fiscalYearId);
    const fiscalYear = await this.fiscalYearRepository.findById(fiscalYearId);

    if (!fiscalYear) {
      throw new FiscalYearNotFoundError(command.fiscalYearId);
    }

    // 2. Verificar que el ejercicio está en estado OPEN
    if (!fiscalYear.status.equals(FiscalYearStatus.OPEN)) {
      throw new FiscalYearInvalidTransitionError(fiscalYear.status.value, 'CLOSED');
    }

    // 3. Validaciones pre-cierre (para MVP, sin BCs externos, warnings vacío)
    const warnings: string[] = [];

    // 4. Si hay advertencias y no se fuerza el cierre, lanzar error
    if (warnings.length > 0 && !command.force) {
      throw new FiscalYearCloseWarningsError(warnings);
    }

    // 5. Cerrar el ejercicio fiscal (membersAtEnd=0 para MVP, sin modelo Member aún)
    fiscalYear.close(0, warnings);

    // 6. Persistir
    await this.fiscalYearRepository.save(fiscalYear);

    // 7. Construir resultado
    const resultDto = new CloseFiscalYearResultDto();
    resultDto.fiscalYear = FiscalYearResponseDto.fromDomain(fiscalYear);
    resultDto.warnings = warnings;

    return resultDto;
  }
}
