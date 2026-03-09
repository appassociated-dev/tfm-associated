import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCurrentUserQuery } from './get-current-user.query';
import { UserProfileDto } from '../dtos/user-profile.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import { InvalidCredentialsError } from '../../domain/exceptions/invalid-credentials.error';

/**
 * Handler de la query para obtener el perfil del usuario autenticado.
 * Resuelve membresía, rol y permisos en el tenant activo.
 */
@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly prismaMain: PrismaMainService,
  ) {}

  async execute(query: GetCurrentUserQuery): Promise<UserProfileDto> {
    // 1. Buscar usuario por ID
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2. Obtener membresía en el tenant activo
    const membership = await this.prismaMain.tenantMembership.findFirst({
      where: {
        userId: query.userId,
        tenantId: query.tenantId,
        active: true,
      },
      include: { tenant: true, role: true },
    });

    if (!membership) {
      throw new InvalidCredentialsError();
    }

    const permissions = (membership.role.permissions as string[]) ?? [];

    // 3. Construir respuesta
    const dto = new UserProfileDto();
    dto.id = user.id.toValue();
    dto.email = user.email.value;
    dto.name = user.name;
    dto.currentTenant = {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
    };
    dto.role = membership.role.code;
    dto.permissions = permissions;

    return dto;
  }
}
