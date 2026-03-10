import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAvailableTransitionsQuery } from './get-available-transitions.query';
import { AvailableTransitionsDto } from '../dtos/available-transitions.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import { MemberId } from '../../domain/value-objects/member-id';
import { StatusTransitionValidator } from '../../domain/services/status-transition-validator';
import { MemberNotFoundError } from '../../domain/exceptions';

/** Mapa de descripciones legibles para cada estado del socio. */
const STATUS_DESCRIPTIONS: Record<string, string> = {
  ACTIVE: 'Socio activo con plenos derechos',
  PENDING_PAYMENT: 'Pendiente de pago — derechos limitados (sin voto)',
  SUSPENDED: 'Socio suspendido — sin derechos',
  APPLICANT: 'Aspirante — en proceso de alta',
  VOLUNTARY_LEAVE: 'Baja voluntaria — terminal rehabilitable',
  NONPAYMENT_LEAVE: 'Baja por impago — terminal rehabilitable',
  DISCIPLINARY_LEAVE: 'Baja disciplinaria — terminal inmutable',
  DECEASED: 'Fallecido — terminal inmutable',
};

/**
 * Handler de la query para obtener las transiciones de estado disponibles de un socio.
 */
@QueryHandler(GetAvailableTransitionsQuery)
export class GetAvailableTransitionsHandler implements IQueryHandler<GetAvailableTransitionsQuery> {
  private readonly transitionValidator = new StatusTransitionValidator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(query: GetAvailableTransitionsQuery): Promise<AvailableTransitionsDto> {
    // Establecer tenantId en el repositorio (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);

    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(query.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(query.memberId);
    }

    // 2. Obtener transiciones disponibles
    const currentStatus = member.getCurrentStatus();
    const availableStatuses = this.transitionValidator.getAvailableTransitions(currentStatus);

    // 3. Construir respuesta
    const response = new AvailableTransitionsDto();
    response.memberId = query.memberId;
    response.currentStatus = currentStatus.value;
    response.availableTransitions = availableStatuses.map((status) => ({
      status: status.value,
      description: STATUS_DESCRIPTIONS[status.value] ?? status.value,
    }));

    return response;
  }
}
