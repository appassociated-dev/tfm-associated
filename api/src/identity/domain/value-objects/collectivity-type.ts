import { ValueObject } from '../../../shared/domain';

type CollectivityTypeProps = {
  value: string;
  [key: string]: unknown;
};

const VALID_TYPES = ['PENA', 'COFRADIA', 'CLUB_DEPORTIVO', 'ASOCIACION_CULTURAL'] as const;

/** Value Object que representa el tipo de colectividad. */
export class CollectivityType extends ValueObject<CollectivityTypeProps> {
  get value(): string {
    return this.props.value;
  }

  static pena(): CollectivityType {
    return new CollectivityType({ value: 'PENA' });
  }

  static cofradia(): CollectivityType {
    return new CollectivityType({ value: 'COFRADIA' });
  }

  static clubDeportivo(): CollectivityType {
    return new CollectivityType({ value: 'CLUB_DEPORTIVO' });
  }

  static asociacionCultural(): CollectivityType {
    return new CollectivityType({ value: 'ASOCIACION_CULTURAL' });
  }

  /** Crea un CollectivityType a partir de un string. Lanza error si el valor no es válido. */
  static fromString(value: string): CollectivityType {
    if (!VALID_TYPES.includes(value as (typeof VALID_TYPES)[number])) {
      throw new Error(
        `Tipo de colectividad inválido: "${value}". Valores permitidos: ${VALID_TYPES.join(', ')}.`,
      );
    }
    return new CollectivityType({ value });
  }
}
