import { describe, it, expect } from 'vitest';
import { APP_FILTER } from '@nestjs/core';
import { ObservabilityModule } from '../observability.module';
import { DomainExceptionFilter } from '../../filters/domain-exception.filter';

/**
 * Verifica que ObservabilityModule registra DomainExceptionFilter como APP_FILTER global.
 * Sin este registro, las excepciones de dominio retornan HTTP 500 en lugar
 * del status code mapeado (401, 404, 409, 422, etc.).
 */
describe('ObservabilityModule', () => {
  it('debería registrar DomainExceptionFilter como APP_FILTER global', () => {
    const dynamicModule = ObservabilityModule.register();

    // Verificar que el módulo dinámico incluye APP_FILTER con DomainExceptionFilter
    const appFilterProvider = dynamicModule.providers?.find(
      (provider: any) => provider.provide === APP_FILTER,
    );

    expect(appFilterProvider).toBeDefined();
    expect((appFilterProvider as any).useClass).toBe(DomainExceptionFilter);
  });

  it('debería ser un módulo global', () => {
    const dynamicModule = ObservabilityModule.register();
    expect(dynamicModule.global).toBe(true);
  });

  it('debería exportar ERROR_REPORTER y EVENT_TRACKER', () => {
    const dynamicModule = ObservabilityModule.register();
    expect(dynamicModule.exports).toEqual(
      expect.arrayContaining([expect.any(Symbol), expect.any(Symbol)]),
    );
    expect(dynamicModule.exports?.length).toBe(2);
  });
});
