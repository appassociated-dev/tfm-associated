import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ErrorReporter, ERROR_REPORTER } from '../../domain/ports/error-reporter.port';

/**
 * Excepción base de dominio.
 * Todas las excepciones de dominio deben extender esta clase.
 */
export class DomainException extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> | null = null,
    readonly httpStatus: number = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

/** Excepción cuando un recurso no se encuentra. */
export class NotFoundException extends DomainException {
  constructor(resource: string, id: string) {
    super(
      'RESOURCE_NOT_FOUND',
      `${resource} con id "${id}" no encontrado.`,
      { resource, id },
      HttpStatus.NOT_FOUND,
    );
    this.name = 'NotFoundException';
  }
}

/** Excepción cuando se viola una regla de negocio. */
export class BusinessRuleException extends DomainException {
  constructor(code: string, message: string, details: Record<string, unknown> | null = null) {
    super(code, message, details, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'BusinessRuleException';
  }
}

/** Excepción de conflicto (recurso duplicado, estado inválido). */
export class ConflictException extends DomainException {
  constructor(code: string, message: string, details: Record<string, unknown> | null = null) {
    super(code, message, details, HttpStatus.CONFLICT);
    this.name = 'ConflictException';
  }
}

/** Excepción de acceso no autorizado. */
export class UnauthorizedException extends DomainException {
  constructor(message = 'No autorizado.') {
    super('UNAUTHORIZED', message, null, HttpStatus.UNAUTHORIZED);
    this.name = 'UnauthorizedException';
  }
}

/** Excepción de permisos insuficientes. */
export class ForbiddenException extends DomainException {
  constructor(message = 'Permisos insuficientes.') {
    super('FORBIDDEN', message, null, HttpStatus.FORBIDDEN);
    this.name = 'ForbiddenException';
  }
}

/**
 * Interfaz para errores de dominio que no extienden DomainException
 * pero siguen la convención de tener una propiedad `code`.
 */
interface DomainCodedError extends Error {
  readonly code: string;
}

/** Verifica si un Error tiene la propiedad `code` (convención de errores de dominio). */
function isDomainCodedError(error: unknown): error is DomainCodedError {
  return (
    error instanceof Error &&
    typeof (error as DomainCodedError).code === 'string' &&
    (error as DomainCodedError).code.length > 0
  );
}

/**
 * Mapeo de patrones de código de error a HTTP status codes.
 * Soporta coincidencia exacta y por sufijo (e.g., '.NOT_FOUND' → 404).
 */
const CODE_TO_STATUS: Array<{ pattern: string; status: number; match: 'exact' | 'suffix' }> = [
  // 401 Unauthorized
  { pattern: 'AUTH.INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED, match: 'exact' },
  { pattern: 'AUTH.INVALID_REFRESH_TOKEN', status: HttpStatus.UNAUTHORIZED, match: 'exact' },
  // 403 Forbidden
  { pattern: 'AUTH.ACCOUNT_BLOCKED', status: HttpStatus.FORBIDDEN, match: 'exact' },
  { pattern: 'AUTH.TENANT_ACCESS_DENIED', status: HttpStatus.FORBIDDEN, match: 'exact' },
  // 404 Not Found (por sufijo)
  { pattern: '.NOT_FOUND', status: HttpStatus.NOT_FOUND, match: 'suffix' },
  // 409 Conflict (por sufijo)
  { pattern: 'ALREADY_EXISTS', status: HttpStatus.CONFLICT, match: 'suffix' },
  { pattern: '.ALREADY_OPEN', status: HttpStatus.CONFLICT, match: 'suffix' },
  { pattern: '.IS_TRANSITION_TARGET', status: HttpStatus.CONFLICT, match: 'suffix' },
  // 422 Unprocessable Entity (por sufijo)
  { pattern: '.INVALID_DATA', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.INVALID_TRANSITION', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.OVERLAPPING_DATES', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.CLOSE_WARNINGS', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.CIRCULAR_TRANSITION', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.INVALID', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  // 500 Internal Server Error
  { pattern: '.PROVISIONING_FAILED', status: HttpStatus.INTERNAL_SERVER_ERROR, match: 'suffix' },
];

/** Resuelve el HTTP status code a partir del código de error de dominio. */
function resolveHttpStatus(code: string): number {
  for (const rule of CODE_TO_STATUS) {
    if (rule.match === 'exact' && code === rule.pattern) return rule.status;
    if (rule.match === 'suffix' && code.endsWith(rule.pattern)) return rule.status;
  }
  return HttpStatus.BAD_REQUEST;
}

/**
 * Filtro global de excepciones de dominio.
 * Captura tanto DomainException (herencia explícita) como errores de dominio
 * que siguen la convención de tener una propiedad `code` (herencia de Error).
 * Devuelve el formato estándar de error (ADR-010) y reporta al ErrorReporter.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(@Inject(ERROR_REPORTER) private readonly errorReporter: ErrorReporter) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Caso 1: DomainException (herencia explícita)
    if (exception instanceof DomainException) {
      this.handleDomainException(exception, response);
      return;
    }

    // Caso 2: Error de dominio con propiedad `code` (convención)
    if (isDomainCodedError(exception)) {
      this.handleCodedError(exception, response);
      return;
    }

    // Caso 3: Error genérico no manejado → re-lanzar para que NestJS lo gestione
    throw exception;
  }

  /** Maneja excepciones que extienden DomainException. */
  private handleDomainException(exception: DomainException, response: Response): void {
    const status = exception.httpStatus;

    this.reportError(exception, status, exception.code, exception.details);

    response.status(status).json({
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      },
    });
  }

  /** Maneja errores de dominio con propiedad `code` que no extienden DomainException. */
  private handleCodedError(error: DomainCodedError, response: Response): void {
    const status = resolveHttpStatus(error.code);

    this.reportError(error, status, error.code, null);

    response.status(status).json({
      error: {
        code: error.code,
        message: error.message,
        details: null,
      },
    });
  }

  /** Reporta el error al sistema de observabilidad. */
  private reportError(
    error: Error,
    status: number,
    code: string,
    details: Record<string, unknown> | null,
  ): void {
    if (status >= 500) {
      this.errorReporter.captureException(error, { code, details });
    } else {
      this.errorReporter.captureMessage(error.message, 'warning', { code, details });
    }
  }
}
