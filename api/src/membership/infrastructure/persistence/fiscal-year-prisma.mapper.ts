import { FiscalYear, ReconstituteFiscalYearProps } from '../../domain/aggregates/fiscal-year';

/**
 * Datos de un FiscalYear tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawFiscalYear {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  previousFiscalYearId: string | null;
  membersAtStart: number;
  membersAtEnd: number | null;
  reportId: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio FiscalYear.
 */
export class FiscalYearPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate FiscalYear.
   * Utiliza FiscalYear.reconstitute() para evitar emisión de eventos.
   */
  static toDomain(raw: PrismaRawFiscalYear): FiscalYear {
    return FiscalYear.reconstitute({
      id: raw.id,
      name: raw.name,
      type: raw.type,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status,
      previousFiscalYearId: raw.previousFiscalYearId,
      membersAtStart: raw.membersAtStart,
      membersAtEnd: raw.membersAtEnd,
      reportId: raw.reportId,
      createdAt: raw.createdAt,
      closedAt: raw.closedAt,
    } as ReconstituteFiscalYearProps);
  }

  /**
   * Convierte un aggregate FiscalYear a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(fiscalYear: FiscalYear): Record<string, unknown> {
    return {
      id: fiscalYear.id.toValue(),
      name: fiscalYear.name,
      type: fiscalYear.type.value,
      startDate: fiscalYear.period.startDate,
      endDate: fiscalYear.period.endDate,
      status: fiscalYear.status.value,
      previousFiscalYearId: fiscalYear.previousFiscalYearId
        ? fiscalYear.previousFiscalYearId.toValue()
        : null,
      membersAtStart: fiscalYear.membersAtStart,
      membersAtEnd: fiscalYear.membersAtEnd,
      reportId: fiscalYear.reportId,
      createdAt: fiscalYear.createdAt,
      closedAt: fiscalYear.closedAt,
    };
  }
}
