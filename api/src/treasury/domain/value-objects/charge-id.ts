import { Identifier } from '../../../shared/domain';

/** Identificador único de cargo. Extiende Identifier (UUID v4). */
export class ChargeId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo ChargeId con UUID v4 generado automáticamente. */
  static create(): ChargeId {
    return new ChargeId();
  }

  /** Crea un ChargeId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): ChargeId {
    return new ChargeId(id);
  }
}
