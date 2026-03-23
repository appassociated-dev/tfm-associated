import { Identifier } from '../../../shared/domain';

/** Identificador único de tenant. Extiende Identifier (UUID v4). */
export class TenantId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo TenantId con UUID v4 generado automáticamente. */
  static create(): TenantId {
    return new TenantId();
  }

  /** Crea un TenantId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): TenantId {
    return new TenantId(id);
  }
}
