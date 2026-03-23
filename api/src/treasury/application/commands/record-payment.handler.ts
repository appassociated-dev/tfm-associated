import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RecordPaymentCommand } from './record-payment.command';
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
import { Money } from '../../domain/value-objects/money';
import { PaymentMethod } from '../../domain/value-objects/payment-method';
import { PaymentReference } from '../../domain/value-objects/payment-reference';
import { ReceiptNumber } from '../../domain/value-objects/receipt-number';
import { ChargeStatus } from '../../domain/value-objects/charge-status';
import { Payment } from '../../domain/entities/payment';
import { ReceiptGeneratedEvent } from '../../domain/events/receipt-generated.event';
import {
  MemberAccountNotFoundError,
  ChargeNotFoundError,
  ChargeAlreadyPaidError,
  ChargeNotPayableError,
  OverpaymentError,
  FuturePaymentDateError,
} from '../../domain/exceptions';

/**
 * Handler del comando de registro de cobro individual.
 * Valida el cargo, genera referencia y recibo, registra el pago
 * y publica eventos de dominio al outbox.
 */
@CommandHandler(RecordPaymentCommand)
export class RecordPaymentHandler implements ICommandHandler<RecordPaymentCommand> {
  private readonly logger = new Logger(RecordPaymentHandler.name);

  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: RecordPaymentCommand): Promise<PaymentResponseDto> {
    // 0. Establecer tenantId en todos los repositorios (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);
    this.paymentRepository.setTenantId(command.tenantId);

    // 1. Buscar MemberAccount por ID (con cargos y pagos cargados)
    const accountId = MemberAccountId.fromString(command.memberAccountId);
    const memberAccount = await this.memberAccountRepository.findById(accountId);
    if (!memberAccount) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    // 2. Buscar el cargo específico dentro de la cuenta
    const chargeId = ChargeId.fromString(command.chargeId);
    const charge = memberAccount.findChargeById(chargeId);
    if (!charge) {
      throw new ChargeNotFoundError(command.chargeId);
    }

    // 3. Verificar que el cargo es pagable
    if (charge.status.equals(ChargeStatus.PAID)) {
      throw new ChargeAlreadyPaidError(command.chargeId);
    }
    if (charge.status.equals(ChargeStatus.CANCELLED)) {
      throw new ChargeNotPayableError(command.chargeId, 'CANCELLED');
    }

    // 4. Verificar que el importe no excede el restante (FE-1)
    const remaining = charge.remainingAmount();
    if (command.amount > remaining.amount) {
      throw new OverpaymentError(command.amount, remaining.amount);
    }

    // 5. Verificar que la fecha de pago no es futura (FE-2)
    const paymentDate = new Date(command.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (paymentDate > today) {
      throw new FuturePaymentDateError(command.paymentDate);
    }

    // 6. Generar PaymentReference y ReceiptNumber
    const paymentMethod = PaymentMethod.fromString(command.paymentMethod);
    const year = paymentDate.getFullYear();
    const paymentSequence = await this.paymentRepository.getNextPaymentSequence(
      paymentMethod,
      year,
    );
    const paymentReference = PaymentReference.generate(paymentMethod, year, paymentSequence);
    const receiptSequence = await this.paymentRepository.getNextReceiptSequence(year);
    const receiptNumber = ReceiptNumber.generate(year, receiptSequence);

    // 7. Crear Money validado para el importe
    const amountResult = Money.create(command.amount);
    if (!amountResult.ok) throw amountResult.error;

    // 8. Crear Payment entity
    const payment = Payment.create({
      chargeId,
      amount: amountResult.value,
      paymentMethod,
      paymentDate,
      paymentReference,
      notes: command.notes,
      registeredBy: command.registeredBy,
    });

    // Asignar número de recibo
    payment.setReceiptNumber(receiptNumber);

    // 9. Registrar pago en el aggregate (actualiza cargo y emite evento)
    const recordResult = memberAccount.recordPayment(chargeId, payment);
    if (!recordResult.ok) {
      throw recordResult.error;
    }

    // 10. Persistir cambios de la cuenta, cargos y pagos de forma coherente
    await this.memberAccountRepository.save(memberAccount);

    // 11. Publicar eventos de dominio al outbox
    const events = [
      ...memberAccount.pullDomainEvents(),
      new ReceiptGeneratedEvent({
        receiptId: payment.receiptNumber?.value ?? payment.id.toValue(),
        paymentId: payment.id.toValue(),
        receiptNumber: payment.receiptNumber?.value ?? 'PENDING',
        issueDate: new Date(),
      }),
    ];
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    this.logger.log(`Pago registrado: ${paymentReference.value} para cargo ${command.chargeId}`);

    // 12. Retornar DTO de respuesta
    return PaymentResponseDto.fromDomain(payment, charge.description.description);
  }
}
