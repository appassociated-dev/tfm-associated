import { Charge } from '../../domain/entities/charge';

/**
 * Datos de un Charge tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase a snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawCharge {
  id: string;
  memberAccountId: string;
  feeSubscriptionId: string | null;
  baseAmount: number;
  finalAmount: number;
  description: string;
  fiscalYearId: string | null;
  billingMonth: number | null;
  billingYear: number;
  issueDate: Date;
  dueDate: Date;
  status: string;
  paidAmount: number;
  isProrated: boolean;
  isManual: boolean;
  createdAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y la entidad de dominio Charge.
 */
export class ChargePrismaMapper {
  /**
   * Convierte un registro del Prisma Client a una entidad Charge.
   * Utiliza Charge.reconstitute() para evitar validación de invariantes y emisión de eventos.
   */
  static toDomain(raw: PrismaRawCharge): Charge {
    return Charge.reconstitute({
      id: raw.id,
      subscriptionId: raw.feeSubscriptionId,
      baseAmount: raw.baseAmount,
      finalAmount: raw.finalAmount,
      description: raw.description,
      fiscalYearId: raw.fiscalYearId,
      billingMonth: raw.billingMonth,
      billingYear: raw.billingYear,
      issueDate: raw.issueDate,
      dueDate: raw.dueDate,
      status: raw.status,
      paidAmount: raw.paidAmount,
      isProrated: raw.isProrated,
      isManual: raw.isManual,
      createdAt: raw.createdAt,
    });
  }

  /**
   * Convierte una entidad Charge a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(charge: Charge): Record<string, unknown> {
    return {
      id: charge.id.toValue(),
      memberAccountId: '', // Se establece en el repositorio al persistir
      feeSubscriptionId: charge.subscriptionId?.toValue() ?? null,
      baseAmount: charge.baseAmount.amount,
      finalAmount: charge.finalAmount.amount,
      description: charge.description.description,
      fiscalYearId: charge.description.fiscalYearId,
      billingMonth: charge.billingMonth,
      billingYear: charge.billingYear,
      issueDate: charge.issueDate,
      dueDate: charge.dueDate,
      status: charge.status.value,
      paidAmount: charge.paidAmount.amount,
      isProrated: charge.isProrated,
      isManual: charge.isManual,
      createdAt: charge.createdAt,
    };
  }

  /**
   * Convierte una entidad Charge a formato createMany de Prisma.
   * Incluye memberAccountId como parámetro explícito.
   */
  static toCreateInput(charge: Charge, memberAccountId: string): Record<string, unknown> {
    return {
      id: charge.id.toValue(),
      memberAccountId,
      feeSubscriptionId: charge.subscriptionId?.toValue() ?? null,
      baseAmount: charge.baseAmount.amount,
      finalAmount: charge.finalAmount.amount,
      description: charge.description.description,
      fiscalYearId: charge.description.fiscalYearId,
      billingMonth: charge.billingMonth,
      billingYear: charge.billingYear,
      issueDate: charge.issueDate,
      dueDate: charge.dueDate,
      status: charge.status.value,
      paidAmount: charge.paidAmount.amount,
      isProrated: charge.isProrated,
      isManual: charge.isManual,
      createdAt: charge.createdAt,
    };
  }
}
