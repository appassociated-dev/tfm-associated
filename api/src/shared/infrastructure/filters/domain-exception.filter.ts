// Filtro global de excepciones de dominio — formato de error ADR-010
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain-exception.base';
import { type ErrorReporter, ERROR_REPORTER } from '../../domain/ports/error-reporter.port';

@Catch(Error)
@Injectable()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(@Inject(ERROR_REPORTER) private readonly errorReporter: ErrorReporter) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      // Las excepciones de dominio se responden con 422 Unprocessable Entity
      response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });
    } else {
      // Errores inesperados se reportan al sistema de observabilidad y devuelven 500
      this.errorReporter.captureException(exception, {
        filter: 'DomainExceptionFilter',
      });

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}
