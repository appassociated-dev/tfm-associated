import { ValueObject } from '../../../shared/domain';

type SlugProps = {
  value: string;
  [key: string]: unknown;
};

/**
 * Value Object que representa un slug derivado de un nombre.
 * Normaliza a minúsculas, sin acentos, sin caracteres especiales, guiones como separadores.
 */
export class Slug extends ValueObject<SlugProps> {
  get value(): string {
    return this.props.value;
  }

  /** Crea un Slug a partir de un nombre, aplicando normalización completa. */
  static fromName(name: string): Slug {
    const normalized = name
      // Descomponer caracteres acentuados (NFD) y eliminar diacríticos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Convertir a minúsculas
      .toLowerCase()
      // Reemplazar espacios y caracteres no alfanuméricos por guiones
      .replace(/[^a-z0-9]+/g, '-')
      // Colapsar múltiples guiones consecutivos
      .replace(/-{2,}/g, '-')
      // Eliminar guiones iniciales y finales
      .replace(/^-+|-+$/g, '');

    return new Slug({ value: normalized });
  }
}
