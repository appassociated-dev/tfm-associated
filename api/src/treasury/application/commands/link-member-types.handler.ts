import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LinkMemberTypesCommand } from './link-member-types.command';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  MEMBER_TYPE_FEE_PLAN_REPOSITORY,
  MemberTypeFeePlanRepository,
} from '../../domain/repositories/member-type-fee-plan.repository';
import {
  MEMBER_TYPE_QUERY_PORT,
  MemberTypeQueryPort,
} from '../../domain/ports/member-type-query.port';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { MemberTypeFeePlan } from '../../domain/entities/member-type-fee-plan';
import { FeePlanLinkedToMemberTypeEvent } from '../../domain/events/fee-plan-linked-to-member-type.event';
import { FeePlanNotFoundError } from '../../domain/exceptions';

/**
 * Handler del comando de vinculación de tipos de socio a plan de cuota.
 * Verifica existencia del plan y de cada tipo de socio vía MemberTypeQueryPort.
 * Gestiona la asignación por defecto (desmarca la anterior si es necesario).
 */
@CommandHandler(LinkMemberTypesCommand)
export class LinkMemberTypesHandler implements ICommandHandler<LinkMemberTypesCommand> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(MEMBER_TYPE_FEE_PLAN_REPOSITORY)
    private readonly memberTypeFeePlanRepository: MemberTypeFeePlanRepository,
    @Inject(MEMBER_TYPE_QUERY_PORT)
    private readonly memberTypeQueryPort: MemberTypeQueryPort,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
  ) {}

  async execute(command: LinkMemberTypesCommand): Promise<void> {
    // 0. Establecer tenantId en los repositorios (ADR-002)
    this.feePlanRepository.setTenantId(command.tenantId);
    this.memberTypeFeePlanRepository.setTenantId(command.tenantId);
    this.memberTypeQueryPort.setTenantId(command.tenantId);

    // 1. Verificar que el plan de cuota existe
    const feePlanId = FeePlanId.fromString(command.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);
    if (!feePlan) {
      throw new FeePlanNotFoundError(command.feePlanId);
    }

    // 2. Eliminar vinculaciones anteriores de este plan (semántica de reemplazo)
    await this.memberTypeFeePlanRepository.deleteByFeePlanId(feePlanId);

    // 3. Verificar existencia de cada tipo de socio y gestionar defaults
    const assignments: MemberTypeFeePlan[] = [];
    const events: FeePlanLinkedToMemberTypeEvent[] = [];

    for (const link of command.links) {
      // Verificar que el tipo de socio existe en BC-Membership
      const memberType = await this.memberTypeQueryPort.findById(link.memberTypeId);
      if (!memberType) {
        throw new Error(`Tipo de socio con id '${link.memberTypeId}' no encontrado.`);
      }

      // Si este link es default, desmarcar el default anterior de este memberType
      // (puede haber otro plan que sea default para este tipo de socio)
      if (link.isDefault) {
        const currentDefault = await this.memberTypeFeePlanRepository.findDefault(
          link.memberTypeId,
        );
        if (currentDefault) {
          currentDefault.setDefault(false);
          await this.memberTypeFeePlanRepository.save(currentDefault);
        }
      }

      // Crear la entidad MemberTypeFeePlan
      const assignment = MemberTypeFeePlan.create({
        memberTypeId: link.memberTypeId,
        feePlanId: command.feePlanId,
        isDefault: link.isDefault,
        order: link.order,
        active: true,
      });

      assignments.push(assignment);

      // Preparar evento de dominio
      events.push(
        new FeePlanLinkedToMemberTypeEvent({
          payload: {
            feePlanId: command.feePlanId,
            memberTypeId: link.memberTypeId,
            isDefault: link.isDefault,
            tenantId: command.tenantId,
          },
          aggregateId: command.feePlanId,
          aggregateType: 'FeePlan',
          boundedContext: 'BC-Treasury',
        }),
      );
    }

    // 4. Persistir todas las nuevas asignaciones
    await this.memberTypeFeePlanRepository.saveMany(assignments);

    // 5. Publicar eventos de dominio al outbox
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }
  }
}
