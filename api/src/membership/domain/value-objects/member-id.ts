import { Identifier } from '../../../shared/domain';

/** Identificador único de socio. Extiende Identifier (UUID v4). */
export class MemberId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo MemberId con UUID v4 generado automáticamente. */
  static create(): MemberId {
    return new MemberId();
  }

  /** Crea un MemberId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): MemberId {
    return new MemberId(id);
  }
}
