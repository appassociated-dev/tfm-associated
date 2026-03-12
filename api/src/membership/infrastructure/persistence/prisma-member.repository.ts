import { Injectable } from '@nestjs/common';
import { MemberRepository, MemberFilter } from '../../domain/repositories/member.repository';
import { Member } from '../../domain/aggregates/member';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { IdentityDocument } from '../../domain/value-objects/identity-document';
import { OptimisticLockingError } from '../../domain/exceptions/optimistic-locking.exception';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { MemberPrismaMapper, PrismaRawMember } from './member-prisma.mapper';

/**
 * Implementación Prisma del repositorio de Member.
 * Opera contra la tabla `members` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 * Soporta optimistic locking via campo `version`.
 * Integra EncryptionService para cifrado/descifrado de IBAN (RNF-006).
 */
@Injectable()
export class PrismaMemberRepository implements MemberRepository {
  private tenantId!: string;

  constructor(
    private readonly prismaTenantService: PrismaTenantService,
    private readonly mapper: MemberPrismaMapper,
  ) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  private get prisma() {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaMemberRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Busca un socio por su UUID. */
  async findById(id: MemberId): Promise<Member | null> {
    const raw = await this.prisma.member.findUnique({
      where: { id: id.toValue() },
    });

    return raw ? this.mapper.toDomain(raw as unknown as PrismaRawMember) : null;
  }

  /**
   * Persiste un socio con optimistic locking.
   * - Si es nuevo (version 0 y no existe en BD): create
   * - Si existe: update verificando la versión previa de forma atómica
   * - Si la versión no coincide: lanza OptimisticLockingError
   * Cifra el IBAN antes de persistir (RNF-006).
   */
  async save(member: Member): Promise<void> {
    const data = await this.mapper.toPersistence(member);
    const memberId = member.id.toValue();

    // Verificar si el registro existe en BD
    const existing = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!existing) {
      // Crear nuevo registro
      await this.prisma.member.create({ data });
    } else {
      // Optimistic locking: verificar versión previa ANTES de actualizar
      const expectedPreviousVersion = member.version - 1;

      if (existing.version !== expectedPreviousVersion) {
        throw new OptimisticLockingError(memberId);
      }

      try {
        await this.prisma.member.update({
          where: { id: memberId },
          data,
        });
      } catch (error: unknown) {
        // Prisma P2025: Record not found (eliminado concurrentemente)
        if (
          error instanceof Error &&
          'code' in error &&
          (error as { code: string }).code === 'P2025'
        ) {
          throw new OptimisticLockingError(memberId);
        }
        throw error;
      }
    }
  }

  /** Busca socios por estado. */
  async findByStatus(status: MemberStatus): Promise<Member[]> {
    const rawList = await this.prisma.member.findMany({
      where: { current_status: status.value },
    });

    const results: Member[] = [];
    for (const raw of rawList) {
      results.push(await this.mapper.toDomain(raw as unknown as PrismaRawMember));
    }
    return results;
  }

  /** Busca todos los socios activos. */
  async findActiveMembers(): Promise<Member[]> {
    return this.findByStatus(MemberStatus.ACTIVE);
  }

  /**
   * Busca socios con pagos vencidos hace más de daysOverdue días.
   * Placeholder MVP: retorna findActiveMembers().
   * La detección real de impagos viene con la integración de BC-Treasury.
   */
  async findMembersWithOverduePayments(_daysOverdue: number): Promise<Member[]> {
    return this.findActiveMembers();
  }

  /** Busca un socio por su documento de identidad. */
  async findByIdentityDocument(document: IdentityDocument): Promise<Member | null> {
    const raw = await this.prisma.member.findFirst({
      where: {
        document_type: document.type,
        document_number: document.number,
      },
    });

    return raw ? this.mapper.toDomain(raw as unknown as PrismaRawMember) : null;
  }

  /** Busca un socio por su email (case insensitive). */
  async findByEmail(email: string): Promise<Member | null> {
    const raw = await this.prisma.member.findFirst({
      where: { email: email.trim().toLowerCase() },
    });

    return raw ? this.mapper.toDomain(raw as unknown as PrismaRawMember) : null;
  }

  /** Busca socios con filtros opcionales. */
  async findAll(filter?: MemberFilter): Promise<Member[]> {
    const where: Record<string, unknown> = {};

    if (filter?.status) {
      where.current_status = filter.status;
    }

    if (filter?.memberTypeId) {
      where.member_type_id = filter.memberTypeId;
    }

    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { surnames: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { member_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const rawList = await this.prisma.member.findMany({
      where,
      orderBy: { created_at: 'asc' },
    });

    const results: Member[] = [];
    for (const raw of rawList) {
      results.push(await this.mapper.toDomain(raw as unknown as PrismaRawMember));
    }
    return results;
  }

  /** Verifica si ya existe un socio con el documento de identidad dado. */
  async existsByIdentityDocument(document: IdentityDocument): Promise<boolean> {
    const count = await this.prisma.member.count({
      where: {
        document_type: document.type,
        document_number: document.number,
      },
    });
    return count > 0;
  }

  /** Verifica si ya existe un socio con el email dado. */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.member.count({
      where: { email: email.trim().toLowerCase() },
    });
    return count > 0;
  }

  /**
   * Obtiene el siguiente número secuencial para asignar a un nuevo socio.
   * Usa MAX + 1 sobre los member_number existentes.
   * En caso de concurrencia, el constraint UNIQUE de la BD garantiza unicidad.
   */
  async getNextMemberNumber(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ next_number: number }[]>`
      SELECT COALESCE(MAX(CAST(member_number AS INTEGER)), 0) + 1 AS next_number
      FROM members
    `;

    return result[0]?.next_number ?? 1;
  }
}
