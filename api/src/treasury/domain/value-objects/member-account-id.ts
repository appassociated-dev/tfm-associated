import { Identifier } from '../../../shared/domain';

/** Identificador único de cuenta de socio. Extiende Identifier (UUID v4). */
export class MemberAccountId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo MemberAccountId con UUID v4 generado automáticamente. */
  static create(): MemberAccountId {
    return new MemberAccountId();
  }

  /** Crea un MemberAccountId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): MemberAccountId {
    return new MemberAccountId(id);
  }
}
