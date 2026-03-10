import { MemberStatus } from '../value-objects/member-status';
import { TransitionNotAllowedError } from '../exceptions/transition-not-allowed.exception';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Domain Service que valida las transiciones de estado de un socio.
 * Contiene la matriz de transiciones como fuente de verdad.
 * Dominio puro: sin dependencias de infraestructura.
 */
export class StatusTransitionValidator {
  /**
   * Matriz de transiciones permitidas.
   * Clave: estado origen. Valor: estados destino permitidos.
   */
  private static readonly TRANSITIONS: Map<string, MemberStatus[]> = new Map([
    [
      'ACTIVE',
      [MemberStatus.PENDING_PAYMENT, MemberStatus.SUSPENDED, MemberStatus.VOLUNTARY_LEAVE],
    ],
    [
      'PENDING_PAYMENT',
      [MemberStatus.ACTIVE, MemberStatus.SUSPENDED, MemberStatus.NONPAYMENT_LEAVE],
    ],
    ['SUSPENDED', [MemberStatus.ACTIVE, MemberStatus.DISCIPLINARY_LEAVE]],
    ['APPLICANT', [MemberStatus.ACTIVE, MemberStatus.VOLUNTARY_LEAVE]],
    ['VOLUNTARY_LEAVE', []],
    ['NONPAYMENT_LEAVE', []],
    ['DISCIPLINARY_LEAVE', []],
    ['DECEASED', []],
  ]);

  /** Estados inmutables: ni siquiera se pueden rehabilitar. */
  private static readonly IMMUTABLE_STATES = new Set(['DISCIPLINARY_LEAVE', 'DECEASED']);

  /**
   * Valida si una transición de estado está permitida.
   * @param currentStatus Estado actual del socio.
   * @param targetStatus Estado destino deseado.
   */
  validate(
    currentStatus: MemberStatus,
    targetStatus: MemberStatus,
  ): Result<void, TransitionNotAllowedError> {
    const allowed = StatusTransitionValidator.TRANSITIONS.get(currentStatus.value) ?? [];
    const isAllowed = allowed.some((s) => s.equals(targetStatus));

    if (!isAllowed) {
      const availableValues = allowed.map((s) => s.value);
      return {
        ok: false,
        error: new TransitionNotAllowedError(
          currentStatus.value,
          targetStatus.value,
          availableValues,
        ),
      };
    }

    return { ok: true, value: undefined };
  }

  /**
   * Devuelve los estados destino permitidos desde el estado actual.
   * @param currentStatus Estado actual del socio.
   */
  getAvailableTransitions(currentStatus: MemberStatus): MemberStatus[] {
    return StatusTransitionValidator.TRANSITIONS.get(currentStatus.value) ?? [];
  }

  /**
   * Indica si un estado es terminal (no tiene transiciones posibles).
   * @param status Estado a evaluar.
   */
  isTerminal(status: MemberStatus): boolean {
    const transitions = StatusTransitionValidator.TRANSITIONS.get(status.value) ?? [];
    return transitions.length === 0;
  }

  /**
   * Indica si un estado es inmutable (ni siquiera se puede rehabilitar).
   * Solo DISCIPLINARY_LEAVE y DECEASED son inmutables.
   * @param status Estado a evaluar.
   */
  isImmutable(status: MemberStatus): boolean {
    return StatusTransitionValidator.IMMUTABLE_STATES.has(status.value);
  }
}
