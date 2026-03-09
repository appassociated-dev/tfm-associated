import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ErrorReporter,
  ERROR_REPORTER,
} from '../../domain/ports/error-reporter.port';

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
  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> | null = null,
  ) {
    super(code, message, details, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'BusinessRuleException';
  }
}

/** Excepción de conflicto (recurso duplicado, estado inválido). */
export class ConflictException extends DomainException {
  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> | null = null,
  ) {
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
 * Filtro global de excepciones de dominio.
 * Captura DomainException y devuelve el formato estándar de error (ADR-010).
 * Reporta errores al ErrorReporter para observabilidad.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(ERROR_REPORTER) private readonly errorReporter: ErrorReporter,
  ) {}

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.httpStatus;

    // Reportar errores de servidor (5xx) como excepciones, el resto como mensajes
    if (status >= 500) {
      this.errorReporter.captureException(exception, {
        code: exception.code,
        details: exception.details,
      });
    } else {
      this.errorReporter.captureMessage(
        exception.message,
        'warning',
        {
          code: exception.code,
          details: exception.details,
        },
      );
    }

    response.status(status).json({
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      },
    });
  }
}
