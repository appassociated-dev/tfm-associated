import { Identifier } from '../../../shared/domain';

/** Identificador único de tipo de socio. Extiende Identifier (UUID v4). */
export class MemberTypeId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo MemberTypeId con UUID v4 generado automáticamente. */
  static create(): MemberTypeId {
    return new MemberTypeId();
  }

  /** Crea un MemberTypeId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): MemberTypeId {
    return new MemberTypeId(id);
  }
}
