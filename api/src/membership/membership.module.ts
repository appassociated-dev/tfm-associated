import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MemberTypesController } from './infrastructure/controllers/member-types.controller';
import { CreateMemberTypeHandler } from './application/commands/create-member-type.handler';
import { UpdateMemberTypeHandler } from './application/commands/update-member-type.handler';
import { DeactivateMemberTypeHandler } from './application/commands/deactivate-member-type.handler';
import { ImportTemplateHandler } from './application/commands/import-template.handler';
import { GetMemberTypeHandler } from './application/queries/get-member-type.handler';
import { ListMemberTypesHandler } from './application/queries/list-member-types.handler';
import { GetTemplatesHandler } from './application/queries/get-templates.handler';
import { MEMBER_TYPE_REPOSITORY } from './domain/repositories/member-type.repository';
import { PrismaMemberTypeRepository } from './infrastructure/persistence/prisma-member-type.repository';
import { PrismaTenantService } from '../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * BC-Membership: Socios, tipos, ejercicios fiscales, altas y carnets.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling (ADR-004)
 * - MemberTypesController para endpoints REST de tipos de socio (UC-008)
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, consultas
 * - Repositorio MemberType vía inyección por token
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 */
@Module({
  imports: [CqrsModule],
  controllers: [MemberTypesController],
  providers: [
    // Handlers CQRS — Comandos
    CreateMemberTypeHandler,
    UpdateMemberTypeHandler,
    DeactivateMemberTypeHandler,
    ImportTemplateHandler,

    // Handlers CQRS — Queries
    GetMemberTypeHandler,
    ListMemberTypesHandler,
    GetTemplatesHandler,

    // Repositorios (inyección por token)
    {
      provide: MEMBER_TYPE_REPOSITORY,
      useClass: PrismaMemberTypeRepository,
    },

    // Servicios de infraestructura compartidos
    PrismaTenantService,
  ],
  exports: [],
})
export class MembershipModule {}
