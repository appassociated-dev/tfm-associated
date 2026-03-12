import { Injectable } from '@nestjs/common';
import { MemberTypeRepository } from '../../domain/repositories/member-type.repository';
import { MemberType } from '../../domain/aggregates/member-type';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import { MemberTypeCode } from '../../domain/value-objects/member-type-code';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { MemberTypePrismaMapper, PrismaRawMemberType } from './member-type-prisma.mapper';

/**
 * Implementación Prisma del repositorio de MemberType.
 * Opera contra la tabla `member_types` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaMemberTypeRepository implements MemberTypeRepository {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  private get prisma() {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaMemberTypeRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Persiste un tipo de socio usando upsert. */
  async save(memberType: MemberType): Promise<void> {
    const data = MemberTypePrismaMapper.toPersistence(memberType);

    await this.prisma.memberType.upsert({
      where: { id: memberType.id.toValue() },
      create: data,
      update: data,
    });
  }

  /** Busca un tipo de socio por su UUID. */
  async findById(id: MemberTypeId): Promise<MemberType | null> {
    const raw = await this.prisma.memberType.findUnique({
      where: { id: id.toValue() },
    });

    return raw ? MemberTypePrismaMapper.toDomain(raw as unknown as PrismaRawMemberType) : null;
  }

  /** Busca un tipo de socio por su código. */
  async findByCode(code: MemberTypeCode): Promise<MemberType | null> {
    const raw = await this.prisma.memberType.findUnique({
      where: { code: code.value },
    });

    return raw ? MemberTypePrismaMapper.toDomain(raw as unknown as PrismaRawMemberType) : null;
  }

  /** Obtiene todos los tipos de socio del tenant. */
  async findAll(): Promise<MemberType[]> {
    const rawList = await this.prisma.memberType.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return rawList.map((raw: unknown) =>
      MemberTypePrismaMapper.toDomain(raw as PrismaRawMemberType),
    );
  }

  /** Verifica si ya existe un tipo de socio con el código dado. */
  async existsByCode(code: MemberTypeCode): Promise<boolean> {
    const raw = await this.prisma.memberType.findUnique({
      where: { code: code.value },
    });

    return !!raw;
  }

  /** Verifica si un tipo de socio es destino de transición de otro. */
  async existsAsTransitionTarget(id: MemberTypeId): Promise<boolean> {
    const count = await this.prisma.memberType.count({
      where: { automaticTransitionTargetId: id.toValue() },
    });

    return count > 0;
  }
}
