import { Identifier } from '../../../shared/domain';

/** Identificador único de suscripción de cuota. Extiende Identifier (UUID v4). */
export class SubscriptionId extends Identifier {
  private constructor(value?: string) {
    super(value);
  }

  /** Crea un nuevo SubscriptionId con UUID v4 generado automáticamente. */
  static create(): SubscriptionId {
    return new SubscriptionId();
  }

  /** Crea un SubscriptionId a partir de un UUID existente. Lanza error si no es válido. */
  static fromString(id: string): SubscriptionId {
    return new SubscriptionId(id);
  }
}
