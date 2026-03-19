import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ValidatePreconditionsQuery } from './validate-preconditions.query';
import { PreconditionsResponseDto } from '../dtos/preconditions-response.dto';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import {
  REGISTRATION_CHARGE_PORT,
  RegistrationChargePort,
} from '../../domain/ports/registration-charge.port';

/**
 * Handler de la query para validar precondiciones del alta simple (UC-011).
 * Comprueba: ejercicio fiscal abierto, tipos de socio activos, plan de alta (ONE_TIME).
 */
@QueryHandler(ValidatePreconditionsQuery)
export class ValidatePreconditionsHandler implements IQueryHandler<ValidatePreconditionsQuery> {
  constructor(
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
    @Inject(REGISTRATION_CHARGE_PORT)
    private readonly registrationChargePort: RegistrationChargePort,
  ) {}

  async execute(query: ValidatePreconditionsQuery): Promise<PreconditionsResponseDto> {
    // Establecer tenantId en los repositorios y puertos (ADR-002)
    this.fiscalYearRepository.setTenantId(query.tenantId);
    this.memberTypeRepository.setTenantId(query.tenantId);
    this.registrationChargePort.setTenantId(query.tenantId);

    const dto = new PreconditionsResponseDto();
    dto.errors = [];

    // 1. Verificar ejercicio fiscal abierto
    const activeFiscalYear = await this.fiscalYearRepository.findActive();
    dto.hasFiscalYear = activeFiscalYear !== null;
    if (!dto.hasFiscalYear) {
      dto.errors.push(
        'No existe un ejercicio fiscal abierto. Es necesario abrir uno antes de dar de alta socios.',
      );
    }

    // 2. Verificar tipos de socio activos
    const allTypes = await this.memberTypeRepository.findAll();
    const activeTypes = allTypes.filter((t) => t.active);
    dto.hasMemberTypes = activeTypes.length > 0;
    if (!dto.hasMemberTypes) {
      dto.errors.push('No existen tipos de socio activos. Es necesario crear al menos uno.');
    }

    // 3. Verificar plan de alta activo (ONE_TIME)
    const registrationPlan = await this.registrationChargePort.findRegistrationPlan();
    dto.hasRegistrationPlan = registrationPlan !== null;
    if (!dto.hasRegistrationPlan) {
      dto.errors.push(
        'No existe un plan de cuota de alta activo (ONE_TIME). Es necesario configurar uno.',
      );
    } else if (registrationPlan) {
      // Incluir info del plan para que el frontend muestre el importe real
      dto.registrationPlan = {
        feePlanId: registrationPlan.feePlanId,
        name: registrationPlan.name,
        amount: registrationPlan.amount,
      };
    }

    return dto;
  }
}
