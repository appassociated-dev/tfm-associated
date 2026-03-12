import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type CustomFieldsProps = {
  data: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando los campos personalizados son inválidos.
 */
export class CustomFieldsInvalidError extends Error {
  readonly code = 'MEMBER.INVALID_CUSTOM_FIELDS';

  constructor(reason: string) {
    super(`Campos personalizados inválidos: ${reason}`);
    this.name = 'CustomFieldsInvalidError';
  }
}

/**
 * Campos reconocidos por tipo de colectividad.
 * Solo se usan para referencia; la validación es permisiva:
 * acepta campos desconocidos y no rechaza campos requeridos faltantes.
 */
const SCHEMA_BY_COLLECTIVITY: Record<string, string[]> = {
  /** Cofradía (US-010) */
  BROTHERHOOD: [
    'baptismDate',
    'parish',
    'godparents',
    'ruleSwornDate',
    'medalImpositionDate',
    'tunicType',
    'processionPosition',
  ],
  /** Club Deportivo (US-011) */
  SPORTS_CLUB: [
    'sportsCategory',
    'federativeLicenseNumber',
    'licenseExpiryDate',
    'medicalCertificateDate',
    'medicalCertificateExpiry',
  ],
  /** Peña (US-012) */
  SOCIAL_CLUB: [
    'shirtSize',
    'pantsSize',
    'dietaryPreferences',
    'allergies',
    'volunteerAvailability',
    'hasVehicle',
  ],
  /** Asociación Cultural (US-013) */
  CULTURAL_ASSOCIATION: ['profession', 'skills', 'areasOfInterest', 'languages', 'availability'],
};

/**
 * Value Object que representa los campos personalizados de un socio.
 * Los campos se almacenan como JSONB y se validan según el tipo de colectividad.
 * Validación permisiva: acepta campos no reconocidos sin error.
 */
export class CustomFields extends ValueObject<CustomFieldsProps> {
  get data(): Record<string, unknown> {
    return { ...this.props.data };
  }

  /**
   * Obtiene el valor de un campo personalizado por clave.
   */
  getValue(key: string): unknown {
    return this.props.data[key];
  }

  /**
   * Crea un CustomFields validado.
   * @param data Datos de campos personalizados.
   * @param collectivityType Tipo de colectividad (opcional, para validación de schema).
   */
  static create(
    data: Record<string, unknown>,
    collectivityType?: string,
  ): Result<CustomFields, CustomFieldsInvalidError> {
    // Validación permisiva: no rechazar campos desconocidos ni requeridos faltantes.
    // Solo se registran los campos válidos para el tipo si se proporciona.
    // Si el tipo no se reconoce, se aceptan todos los campos.

    const safeData = data ? { ...data } : {};

    // Si se proporciona tipo de colectividad y es conocido, se podría validar.
    // Actualmente la validación es permisiva según la especificación.
    if (collectivityType && SCHEMA_BY_COLLECTIVITY[collectivityType]) {
      // Validación permisiva: no rechazamos nada
      // En futuras versiones se podría validar campos requeridos
    }

    return { ok: true, value: new CustomFields({ data: safeData }) };
  }

  /**
   * Devuelve los nombres de campos conocidos para un tipo de colectividad.
   */
  static getSchemaFields(collectivityType: string): string[] {
    return SCHEMA_BY_COLLECTIVITY[collectivityType] ?? [];
  }
}
