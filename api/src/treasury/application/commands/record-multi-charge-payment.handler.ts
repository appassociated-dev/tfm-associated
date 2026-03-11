import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RecordMultiChargePaymentCommand } from './record-multi-charge-payment.command';
import { PaymentResponseDto } from '../dtos/payment-response.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  PAYMENT_REPOSITORY,
  PaymentRepository,
} from '../../domain/repositories/payment.repository';
import {
  TREASURY_OUTBOX_PUBLISHER,
  TreasuryOutboxPublisher,
} from '../ports/treasury-outbox.publisher';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { ChargeId } from '../../domain/value-objects/charge-id';
import { ChargeStatus } from '../../domain/value-objects/charge-status';
import { PaymentMethod } from '../../domain/value-objects/payment-method';
import { PaymentReference } from '../../domain/value-objects/payment-reference';
import { ReceiptNumber } from '../../domain/value-objects/receipt-number';
import { ReceiptGeneratedEvent } from '../../domain/events/receipt-generated.event';
import {
  MemberAccountNotFoundError,
  ChargeNotFoundError,
  ChargeAlreadyPaidError,
  ChargeNotPayableError,
  FuturePaymentDateError,
} from '../../domain/exceptions';

/**
 * Handler del comando de registro de cobro sobre múltiples cargos.
 * Valida todos los cargos, genera una referencia compartida,
 * crea un pago por cada cargo y publica eventos de dominio.
 */
@CommandHandler(RecordMultiChargePaymentCommand)
export class RecordMultiChargePaymentHandler implements ICommandHandler<RecordMultiChargePaymentCommand> {
  private readonly logger = new Logger(RecordMultiChargePaymentHandler.name);

  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: RecordMultiChargePaymentCommand): Promise<PaymentResponseDto[]> {
    // 0. Establecer tenantId en todos los repositorios (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);
    this.paymentRepository.setTenantId(command.tenantId);

    // 1. Buscar MemberAccount por ID
    const accountId = MemberAccountId.fromString(command.memberAccountId);
    const memberAccount = await this.memberAccountRepository.findById(accountId);
    if (!memberAccount) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    // 2. Verificar fecha de pago no futura (FE-2)
    const paymentDate = new Date(command.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (paymentDate > today) {
      throw new FuturePaymentDateError(command.paymentDate);
    }

    // 3. Validar todos los cargos antes de aplicar pagos
    const chargePayments: Array<{
      chargeId: ChargeId;
      amount: import('../../domain/value-objects/money').Money;
    }> = [];

    for (const chargeIdStr of command.chargeIds) {
      const chargeId = ChargeId.fromString(chargeIdStr);
      const charge = memberAccount.findChargeById(chargeId);
      if (!charge) {
        throw new ChargeNotFoundError(chargeIdStr);
      }

      if (charge.status.equals(ChargeStatus.PAID)) {
        throw new ChargeAlreadyPaidError(chargeIdStr);
      }
      if (charge.status.equals(ChargeStatus.CANCELLED)) {
        throw new ChargeNotPayableError(chargeIdStr, 'CANCELLED');
      }

      // Cada pago cubre el importe restante completo del cargo
      chargePayments.push({ chargeId, amount: charge.remainingAmount() });
    }

    // 4. Generar referencia de pago compartida
    const paymentMethod = PaymentMethod.fromString(command.paymentMethod);
    const year = paymentDate.getFullYear();
    const paymentSequence = await this.paymentRepository.getNextPaymentSequence(
      paymentMethod,
      year,
    );
    const sharedReference = PaymentReference.generate(paymentMethod, year, paymentSequence);

    // 5. Registrar pagos sobre múltiples cargos en el aggregate
    const recordResult = memberAccount.recordMultiChargePayment(chargePayments, {
      method: paymentMethod,
      date: paymentDate,
      reference: sharedReference,
      notes: command.notes,
      registeredBy: command.registeredBy,
    });

    if (!recordResult.ok) {
      throw recordResult.error;
    }

    const createdPayments = recordResult.value;

    // 6. Asignar números de recibo a cada pago
    for (const payment of createdPayments) {
      const receiptSequence = await this.paymentRepository.getNextReceiptSequence(year);
      const receiptNumber = ReceiptNumber.generate(year, receiptSequence);
      payment.setReceiptNumber(receiptNumber);
    }

    // 7. Persistir cambios de cuenta, cargos y pagos de forma coherente
    await this.memberAccountRepository.save(memberAccount);

    // 8. Publicar eventos de dominio al outbox
    const events = [
      ...memberAccount.pullDomainEvents(),
      ...createdPayments.map(
        (payment) =>
          new ReceiptGeneratedEvent({
            receiptId: payment.receiptNumber?.value ?? payment.id.toValue(),
            paymentId: payment.id.toValue(),
            receiptNumber: payment.receiptNumber?.value ?? 'PENDING',
            issueDate: new Date(),
          }),
      ),
    ];
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    this.logger.log(
      `Cobro multi-cargo registrado: ${sharedReference.value} para ${command.chargeIds.length} cargos`,
    );

    // 9. Construir respuesta con descripción de cada cargo
    return createdPayments.map((payment) => {
      const charge = memberAccount.findChargeById(payment.chargeId);
      const description = charge?.description.description;
      return PaymentResponseDto.fromDomain(payment, description);
    });
  }
}
