import { Identifier } from '../../../shared/domain';

/** Identificador único de pago. Extiende Identifier (UUID v4). */
export class PaymentId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo PaymentId con UUID v4 generado automáticamente. */
  static create(): PaymentId {
    return new PaymentId();
  }

  /** Crea un PaymentId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): PaymentId {
    return new PaymentId(id);
  }
}
