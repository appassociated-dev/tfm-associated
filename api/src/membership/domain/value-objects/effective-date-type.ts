/**
 * Enum que representa los tipos de cálculo de fecha efectiva para baja de socio.
 * Utilizado por EffectiveDateCalculator para determinar cuándo se hace efectiva una baja.
 */
export enum EffectiveDateType {
  /** Baja inmediata en la fecha de solicitud. */
  IMMEDIATE = 'IMMEDIATE',

  /** Baja efectiva al final del ejercicio fiscal (31 de diciembre). */
  END_OF_FISCAL_YEAR = 'END_OF_FISCAL_YEAR',

  /** Baja efectiva al final del mes siguiente a la solicitud. */
  END_OF_NEXT_MONTH = 'END_OF_NEXT_MONTH',

  /** Baja efectiva tras un período de preaviso en días. */
  NOTICE_PERIOD = 'NOTICE_PERIOD',
}
