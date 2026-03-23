import { Identifier } from '../../../shared/domain';

/** Identificador único de plan de cuota. Extiende Identifier (UUID v4). */
export class FeePlanId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo FeePlanId con UUID v4 generado automáticamente. */
  static create(): FeePlanId {
    return new FeePlanId();
  }

  /** Crea un FeePlanId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): FeePlanId {
    return new FeePlanId(id);
  }
}
