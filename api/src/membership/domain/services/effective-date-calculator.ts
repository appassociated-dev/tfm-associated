import { EffectiveDateType } from '../value-objects/effective-date-type';

/** Configuración para el cálculo de fecha efectiva. */
export interface EffectiveDateConfig {
  /** Tipo de cálculo a aplicar. */
  readonly type: EffectiveDateType;
  /** Días de preaviso (solo requerido para NOTICE_PERIOD). */
  readonly noticeDays?: number;
}

/** Opción de fecha efectiva disponible para mostrar al usuario. */
export interface EffectiveDateOption {
  /** Tipo de cálculo. */
  readonly type: EffectiveDateType;
  /** Fecha efectiva calculada. */
  readonly effectiveDate: Date;
  /** Descripción legible para el usuario. */
  readonly label: string;
}

/**
 * Servicio de dominio puro que calcula la fecha efectiva de baja de un socio.
 * No tiene dependencias de infraestructura ni de NestJS.
 * Soporta 4 fórmulas de cálculo: IMMEDIATE, END_OF_FISCAL_YEAR, END_OF_NEXT_MONTH, NOTICE_PERIOD.
 */
export class EffectiveDateCalculator {
  /**
   * Calcula la fecha efectiva de baja según el tipo de cálculo.
   * @param requestDate Fecha de solicitud de la baja.
   * @param config Configuración con tipo de cálculo y días de preaviso opcionales.
   * @returns Fecha efectiva de baja calculada.
   */
  static calculateEffectiveDate(requestDate: Date, config: EffectiveDateConfig): Date {
    switch (config.type) {
      case EffectiveDateType.IMMEDIATE:
        return EffectiveDateCalculator.calculateImmediate(requestDate);

      case EffectiveDateType.END_OF_FISCAL_YEAR:
        return EffectiveDateCalculator.calculateEndOfFiscalYear(requestDate);

      case EffectiveDateType.END_OF_NEXT_MONTH:
        return EffectiveDateCalculator.calculateEndOfNextMonth(requestDate);

      case EffectiveDateType.NOTICE_PERIOD:
        return EffectiveDateCalculator.calculateNoticePeriod(requestDate, config.noticeDays ?? 0);

      default:
        throw new Error(`Tipo de fecha efectiva no soportado: ${config.type}`);
    }
  }

  /**
   * Devuelve todas las opciones de fecha efectiva disponibles.
   * @param requestDate Fecha de solicitud.
   * @param noticeDays Días de preaviso (para la opción NOTICE_PERIOD).
   * @returns Lista de opciones con fecha calculada y etiqueta descriptiva.
   */
  static getAvailableOptions(requestDate: Date, noticeDays?: number): EffectiveDateOption[] {
    const options: EffectiveDateOption[] = [
      {
        type: EffectiveDateType.IMMEDIATE,
        effectiveDate: EffectiveDateCalculator.calculateImmediate(requestDate),
        label: 'Inmediata',
      },
      {
        type: EffectiveDateType.END_OF_FISCAL_YEAR,
        effectiveDate: EffectiveDateCalculator.calculateEndOfFiscalYear(requestDate),
        label: 'Fin de ejercicio fiscal',
      },
      {
        type: EffectiveDateType.END_OF_NEXT_MONTH,
        effectiveDate: EffectiveDateCalculator.calculateEndOfNextMonth(requestDate),
        label: 'Fin del mes siguiente',
      },
    ];

    // Solo incluir NOTICE_PERIOD si se proporcionan días de preaviso
    if (noticeDays !== undefined && noticeDays > 0) {
      options.push({
        type: EffectiveDateType.NOTICE_PERIOD,
        effectiveDate: EffectiveDateCalculator.calculateNoticePeriod(requestDate, noticeDays),
        label: `Período de preaviso (${noticeDays} días)`,
      });
    }

    return options;
  }

  /** IMMEDIATE: devuelve la misma fecha de solicitud. */
  private static calculateImmediate(requestDate: Date): Date {
    return new Date(requestDate.getTime());
  }

  /** END_OF_FISCAL_YEAR: devuelve el 31 de diciembre del año de la solicitud. */
  private static calculateEndOfFiscalYear(requestDate: Date): Date {
    return new Date(requestDate.getFullYear(), 11, 31);
  }

  /** END_OF_NEXT_MONTH: devuelve el último día del mes siguiente. */
  private static calculateEndOfNextMonth(requestDate: Date): Date {
    const year = requestDate.getFullYear();
    const month = requestDate.getMonth();

    // Mes siguiente: si es diciembre (11), pasa a enero (0) del año siguiente
    const nextMonth = month + 1;
    const targetYear = nextMonth > 11 ? year + 1 : year;
    const targetMonth = nextMonth > 11 ? 0 : nextMonth;

    // Último día del mes objetivo: día 0 del mes siguiente al objetivo
    return new Date(targetYear, targetMonth + 1, 0);
  }

  /** NOTICE_PERIOD: devuelve requestDate + noticeDays días naturales. */
  private static calculateNoticePeriod(requestDate: Date, noticeDays: number): Date {
    const result = new Date(requestDate.getTime());
    result.setDate(result.getDate() + noticeDays);
    return result;
  }
}
