import { ValueObject } from '../../../shared/domain';
import { CollectivityType } from '../../../identity/domain/value-objects/collectivity-type';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type RulesConfigProps = {
  config: string; // JSON serializado para comparación profunda
  collectivityType: string;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando la configuración de reglas es inválida.
 */
export class RulesConfigInvalidError extends Error {
  readonly code = 'MEMBER_TYPE.INVALID_RULES_CONFIG';

  constructor(reason: string) {
    super(`Invalid rules config: ${reason}`);
    this.name = 'RulesConfigInvalidError';
  }
}

/**
 * Value Object que envuelve la configuración JSON de reglas de un tipo de socio.
 * Almacena la configuración raw asociada a un tipo de colectividad.
 */
export class RulesConfig extends ValueObject<RulesConfigProps> {
  /**
   * Crea un RulesConfig validado.
   * @param config Objeto de configuración de reglas.
   * @param collectivityType Tipo de colectividad asociado.
   */
  static create(
    config: object,
    collectivityType: CollectivityType,
  ): Result<RulesConfig, RulesConfigInvalidError> {
    if (config === null || config === undefined) {
      return {
        ok: false,
        error: new RulesConfigInvalidError('config must be a non-null object'),
      };
    }

    return {
      ok: true,
      value: new RulesConfig({
        config: JSON.stringify(config),
        collectivityType: collectivityType.value,
      }),
    };
  }

  /**
   * Devuelve una copia del objeto de configuración raw.
   * Garantiza inmutabilidad al devolver siempre una copia nueva.
   */
  getRaw(): object {
    return JSON.parse(this.props.config);
  }
}
