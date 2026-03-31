import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para crear una nueva cuenta de tesorería para un socio.
 * Utilizado por el consumer del evento MemberRegisteredEvent (ADR-008).
 */
export class CreateMemberAccountCommand implements ICommand {
  constructor(
    /** ID del tenant donde se crea la cuenta. */
    public readonly tenantId: string,
    /** ID del socio para el que se crea la cuenta. */
    public readonly memberId: string,
  ) {}
}
