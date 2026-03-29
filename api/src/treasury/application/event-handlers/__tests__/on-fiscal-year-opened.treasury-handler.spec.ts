import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { OnFiscalYearOpenedTreasuryHandler } from '../on-fiscal-year-opened.treasury-handler';
import { GenerateMonthlyChargesCommand } from '../../commands/generate-monthly-charges.command';
import { FiscalYearOpenedEvent } from '../../../../membership/domain/events/fiscal-year-opened.event';

const TENANT_ID = 'tenant-uuid-1234';
const FISCAL_YEAR_ID = 'fy000000-0000-0000-0000-000000000001';

/** Crea un FiscalYearOpenedEvent con overrides opcionales. */
function makeEvent(
  overrides: { tenantId?: string; startDate?: Date | string } = {},
): FiscalYearOpenedEvent {
  return new FiscalYearOpenedEvent({
    payload: {
      fiscalYearId: FISCAL_YEAR_ID,
      name: 'Ejercicio 2026',
      startDate: (overrides.startDate ?? new Date('2026-01-01')) as Date,
      endDate: new Date('2026-12-31'),
      carriedOverMembers: 42,
      appliedTransitions: [],
    },
    aggregateId: FISCAL_YEAR_ID,
    aggregateType: 'FiscalYear',
    boundedContext: 'BC-Membership',
    tenantId: overrides.tenantId,
  });
}

describe('OnFiscalYearOpenedTreasuryHandler', () => {
  let handler: OnFiscalYearOpenedTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(undefined) };
    handler = new OnFiscalYearOpenedTreasuryHandler(commandBus as unknown as CommandBus);
  });

  it('debería despachar GenerateMonthlyChargesCommand con mes y año extraídos de startDate (happy path)', async () => {
    // Arrange: evento con startDate = 2026-03-01 → mes=3, año=2026
    const event = makeEvent({ tenantId: TENANT_ID, startDate: new Date('2026-03-01') });

    // Act
    await handler.handle(event);

    // Assert: se despachó el comando con los argumentos correctos
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        month: 3,
        year: 2026,
      }),
    );
    const cmd = (commandBus.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(GenerateMonthlyChargesCommand);
  });

  it('debería absorber el error si commandBus.execute lanza (aislamiento de errores)', async () => {
    // Arrange
    commandBus.execute.mockRejectedValue(new Error('Charge generation failed'));
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act & Assert: handle() NO debe lanzar
    await expect(handler.handle(event)).resolves.not.toThrow();
  });

  it('debería ignorar el evento si falta tenantId', async () => {
    // Arrange
    const event = makeEvent({ tenantId: undefined });

    // Act
    await handler.handle(event);

    // Assert: no se despachó ningún comando
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('debería parsear startDate correctamente cuando llega como STRING desde el payload JSON del outbox (regresión CRITICAL-1)', async () => {
    // Arrange: simular reconstitución desde JSON — startDate es string, no Date
    const event = makeEvent({ tenantId: TENANT_ID, startDate: '2026-05-01' as unknown as Date });

    // Act
    await handler.handle(event);

    // Assert: los métodos de Date funcionan correctamente tras parsear el string
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        month: 5,
        year: 2026,
      }),
    );
  });
});
