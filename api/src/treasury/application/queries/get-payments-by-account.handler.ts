import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetPaymentsByAccountQuery } from './get-payments-by-account.query';
import { PaymentResponseDto } from '../dtos/payment-response.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  PAYMENT_REPOSITORY,
  PaymentRepository,
} from '../../domain/repositories/payment.repository';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { MemberAccountNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener los pagos de una cuenta de socio.
 * Retorna todos los pagos ordenados por fecha de pago descendente.
 */
@QueryHandler(GetPaymentsByAccountQuery)
export class GetPaymentsByAccountHandler implements IQueryHandler<GetPaymentsByAccountQuery> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(query: GetPaymentsByAccountQuery): Promise<PaymentResponseDto[]> {
    // 1. Establecer tenantId en los repositorios (ADR-002)
    this.memberAccountRepository.setTenantId(query.tenantId);
    this.paymentRepository.setTenantId(query.tenantId);

    // 2. Verificar que la cuenta existe
    const accountId = MemberAccountId.fromString(query.memberAccountId);
    const account = await this.memberAccountRepository.findById(accountId);
    if (!account) {
      throw new MemberAccountNotFoundError(query.memberAccountId);
    }

    // 3. Obtener pagos de la cuenta
    const payments = await this.paymentRepository.findByMemberAccountId(accountId);

    // 4. Ordenar por fecha de pago descendente
    payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    // 5. Mapear a DTOs con descripción del cargo
    return payments.map((payment) => {
      const charge = account.findChargeById(payment.chargeId);
      const description = charge?.description.description;
      return PaymentResponseDto.fromDomain(payment, description);
    });
  }
}
