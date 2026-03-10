import { Identifier } from '../../../shared/domain';

/** Identificador único de ejercicio fiscal. Extiende Identifier (UUID v4). */
export class FiscalYearId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo FiscalYearId con UUID v4 generado automáticamente. */
  static create(): FiscalYearId {
    return new FiscalYearId();
  }

  /** Crea un FiscalYearId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): FiscalYearId {
    return new FiscalYearId(id);
  }
}
