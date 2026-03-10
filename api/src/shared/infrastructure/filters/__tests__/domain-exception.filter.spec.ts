import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  DomainExceptionFilter,
  DomainException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BusinessRuleException,
} from '../domain-exception.filter';
import { ErrorReporter } from '../../../domain/ports/error-reporter.port';

/** Helper para crear un mock de ArgumentsHost. */
function createMockHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost,
    status,
    json,
  };
}

/** Error de dominio con propiedad `code` (patrón usado en las Tasks 1-4). */
class TestDomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'TestDomainError';
  }
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let errorReporter: ErrorReporter;

  beforeEach(() => {
    errorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
    };
    filter = new DomainExceptionFilter(errorReporter);
  });

  // --- DomainException (herencia explícita) ---

  describe('DomainException (herencia explícita)', () => {
    it('debería manejar NotFoundException con status 404', () => {
      const { host, status, json } = createMockHost();
      const exception = new NotFoundException('Tenant', '123');

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: expect.stringContaining('123'),
          details: { resource: 'Tenant', id: '123' },
        },
      });
    });

    it('debería manejar ConflictException con status 409', () => {
      const { host, status, json } = createMockHost();
      const exception = new ConflictException('DUPLICATE', 'Ya existe');

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('debería manejar UnauthorizedException con status 401', () => {
      const { host, status } = createMockHost();
      const exception = new UnauthorizedException();

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('debería manejar ForbiddenException con status 403', () => {
      const { host, status } = createMockHost();
      const exception = new ForbiddenException();

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('debería manejar BusinessRuleException con status 422', () => {
      const { host, status } = createMockHost();
      const exception = new BusinessRuleException('RULE', 'Violación');

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  // --- Errores de dominio con `code` (Tasks 1-4) ---

  describe('Errores de dominio con propiedad code', () => {
    it('debería mapear *.NOT_FOUND a 404', () => {
      const { host, status, json } = createMockHost();
      const error = new TestDomainError('FISCAL_YEAR.NOT_FOUND', 'No encontrado');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith({
        error: { code: 'FISCAL_YEAR.NOT_FOUND', message: 'No encontrado', details: null },
      });
    });

    it('debería mapear *.ALREADY_EXISTS a 409', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('MEMBER_TYPE.CODE_ALREADY_EXISTS', 'Duplicado');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('debería mapear *.ALREADY_OPEN a 409', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('FISCAL_YEAR.ALREADY_OPEN', 'Ya abierto');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('debería mapear AUTH.INVALID_CREDENTIALS a 401', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('AUTH.INVALID_CREDENTIALS', 'Credenciales inválidas');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('debería mapear AUTH.ACCOUNT_BLOCKED a 403', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('AUTH.ACCOUNT_BLOCKED', 'Cuenta bloqueada');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('debería mapear AUTH.TENANT_ACCESS_DENIED a 403', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('AUTH.TENANT_ACCESS_DENIED', 'Acceso denegado');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('debería mapear *.INVALID_DATA a 422', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('TENANT.INVALID_DATA', 'Datos inválidos');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('debería mapear *.OVERLAPPING_DATES a 422', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('FISCAL_YEAR.OVERLAPPING_DATES', 'Fechas solapadas');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('debería mapear *.PROVISIONING_FAILED a 500', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('TENANT.PROVISIONING_FAILED', 'Fallo provisión');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(errorReporter.captureException).toHaveBeenCalled();
    });

    it('debería mapear código desconocido a 400', () => {
      const { host, status } = createMockHost();
      const error = new TestDomainError('UNKNOWN.CODE', 'Error desconocido');

      filter.catch(error, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });

  // --- Errores genéricos (re-lanzar) ---

  describe('Errores sin code', () => {
    it('debería re-lanzar errores sin propiedad code', () => {
      const { host } = createMockHost();
      const error = new Error('Error genérico sin code');

      expect(() => filter.catch(error, host)).toThrow('Error genérico sin code');
    });
  });

  // --- Observabilidad ---

  describe('Observabilidad', () => {
    it('debería reportar errores 4xx como mensajes de warning', () => {
      const { host } = createMockHost();
      const error = new TestDomainError('MEMBER_TYPE.NOT_FOUND', 'No encontrado');

      filter.catch(error, host);

      expect(errorReporter.captureMessage).toHaveBeenCalledWith('No encontrado', 'warning', {
        code: 'MEMBER_TYPE.NOT_FOUND',
        details: null,
      });
    });

    it('debería reportar errores 5xx como excepciones', () => {
      const { host } = createMockHost();
      const error = new TestDomainError('TENANT.PROVISIONING_FAILED', 'Fallo');

      filter.catch(error, host);

      expect(errorReporter.captureException).toHaveBeenCalled();
    });
  });
});
