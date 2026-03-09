import { Identifier } from '../../../shared/domain';

/** Identificador único de usuario. Extiende Identifier (UUID v4). */
export class UserId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo UserId con UUID v4 generado automáticamente. */
  static create(): UserId {
    return new UserId();
  }

  /** Crea un UserId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): UserId {
    return new UserId(id);
  }
}
