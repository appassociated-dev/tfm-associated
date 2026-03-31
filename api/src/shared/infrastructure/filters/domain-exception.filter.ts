import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Inject,
  HttpException,
} from '@nestjs/common';
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
  { pattern: '.OPTIMISTIC_LOCKING', status: HttpStatus.CONFLICT, match: 'suffix' },
  // 412 Precondition Failed (por sufijo — precondiciones no satisfechas)
  { pattern: '.NO_OPEN_FISCAL_YEAR', status: HttpStatus.PRECONDITION_FAILED, match: 'suffix' },
  { pattern: '.NO_REGISTRATION_PLAN', status: HttpStatus.PRECONDITION_FAILED, match: 'suffix' },
  { pattern: '.NO_ACTIVE_MEMBER_TYPES', status: HttpStatus.PRECONDITION_FAILED, match: 'suffix' },
  // 422 Unprocessable Entity (por sufijo)
  { pattern: '.TRANSITION_NOT_ALLOWED', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.INVALID_DATA', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.INVALID_TRANSITION', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.OVERLAPPING_DATES', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.CLOSE_WARNINGS', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.CIRCULAR_TRANSITION', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.CANNOT_LEAVE', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.CANNOT_REINSTATE', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.PAYMENT_NOT_CONFIRMED', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
  { pattern: '.NO_PENDING_DEBT', status: HttpStatus.UNPROCESSABLE_ENTITY, match: 'suffix' },
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

    // Caso 3: HttpException de NestJS (guards, pipes, throttler) → JSON
    if (exception instanceof HttpException) {
      this.handleHttpException(exception, response);
      return;
    }

    // Caso 4: Error genérico no manejado → responder con 500 en el formato estándar
    // y reportar al observability reporter (no re-lanzar, Express devolvería formato no estándar).
    const unhandledError = exception instanceof Error ? exception : new Error(String(exception));
    this.reportError(
      unhandledError,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
      null,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null,
      },
    });
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

  /** Maneja HttpException de NestJS (guards, pipes, throttler). */
  private handleHttpException(exception: HttpException, response: Response): void {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extraer mensaje y detalles del response de HttpException.
    // Cuando ValidationPipe lanza BadRequestException, getResponse() devuelve
    // { message: string[], error: 'Bad Request', statusCode: 400 } — el campo
    // message es un array de errores de validación y NO debe llamarse .toString().
    let message: string;
    let details: Record<string, unknown> | null = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const rawMessage = (exceptionResponse as Record<string, unknown>).message;
      if (Array.isArray(rawMessage) && rawMessage.length > 0) {
        // Caso ValidationPipe: message es un array de errores → preservar en details
        message = rawMessage[0] as string;
        details = { errors: rawMessage };
      } else if (Array.isArray(rawMessage)) {
        // Array vacío → tratar como mensaje simple sin details
        message = exception.message;
      } else {
        message = (rawMessage as string | undefined) ?? exception.message;
      }
    }

    // Derivar código del nombre de la clase (e.g., UnauthorizedException → UNAUTHORIZED)
    const code = exception.constructor.name
      .replace(/Exception$/, '')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toUpperCase();

    this.reportError(exception, status, code, details);

    response.status(status).json({
      error: {
        code,
        message,
        details,
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
