import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para ejecutar el proceso de verificación de morosidad.
 * Detecta socios con pagos vencidos y los transiciona a PENDING_PAYMENT.
 */
export class RunDelinquencyCheckCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la verificación. */
    public readonly tenantId: string,
    /** Días de retraso en el pago para considerar morosidad (por defecto 90). */
    public readonly daysOverdue: number = 90,
  ) {}
}
