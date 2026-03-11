import { Inject, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetReceiptQuery } from './get-receipt.query';
import {
  PAYMENT_REPOSITORY,
  PaymentRepository,
} from '../../domain/repositories/payment.repository';
import { MEMBER_QUERY_PORT, MemberQueryPort } from '../../domain/ports/member-query.port';
import { CHARGE_REPOSITORY, ChargeRepository } from '../../domain/repositories/charge.repository';
import {
  RECEIPT_GENERATOR,
  ReceiptGeneratorPort,
  ReceiptData,
} from '../../infrastructure/services/receipt-generator';
import { PaymentNotFoundError } from '../../domain/exceptions';
import { PaymentMethod } from '../../domain/value-objects/payment-method';

/**
 * Handler de la query para obtener el recibo PDF de un pago.
 * Si el recibo ya está almacenado en BD, lo retorna directamente.
 * Si no existe (fallo previo), lo regenera bajo demanda (Riesgo 3 del diseño).
 */
@QueryHandler(GetReceiptQuery)
export class GetReceiptHandler implements IQueryHandler<GetReceiptQuery> {
  private readonly logger = new Logger(GetReceiptHandler.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(MEMBER_QUERY_PORT)
    private readonly memberQueryPort: MemberQueryPort,
    @Inject(CHARGE_REPOSITORY)
    private readonly chargeRepository: ChargeRepository,
    @Inject(RECEIPT_GENERATOR)
    private readonly receiptGenerator: ReceiptGeneratorPort,
  ) {}

  async execute(query: GetReceiptQuery): Promise<Buffer> {
    // 1. Establecer tenantId en los repositorios/puertos (ADR-002)
    this.paymentRepository.setTenantId(query.tenantId);
    this.memberQueryPort.setTenantId(query.tenantId);
    this.chargeRepository.setTenantId(query.tenantId);

    // 2. Buscar el pago por ID (PrismaPaymentRepository implementa findById)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentRepo = this.paymentRepository as any;
    const payment = await paymentRepo.findById(query.paymentId);
    if (!payment) {
      throw new PaymentNotFoundError(query.paymentId);
    }

    // 3. Intentar obtener el PDF almacenado en BD
    const storedPdf = await paymentRepo.getReceiptDocument(query.paymentId);
    if (storedPdf) {
      return storedPdf;
    }

    // 4. Si no existe, regenerar el recibo bajo demanda (Riesgo 3)
    this.logger.warn(
      `Recibo no almacenado para pago ${query.paymentId}. Regenerando bajo demanda.`,
    );

    // Obtener descripción del cargo y datos del socio
    let chargeDescription = 'Cargo';
    let memberName = 'Socio desconocido';
    let memberNumber = 'N/A';
    const memberDni = 'N/A';

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chargeRepo = this.chargeRepository as any;
      const prisma = chargeRepo.prisma;
      if (prisma) {
        const chargeRaw = await prisma.charge.findUnique({
          where: { id: payment.chargeId.toValue() },
          select: { description: true, memberAccountId: true },
        });
        if (chargeRaw) {
          chargeDescription = chargeRaw.description;

          // Obtener datos del socio via la cuenta
          const accountRaw = await prisma.memberAccount.findUnique({
            where: { id: chargeRaw.memberAccountId },
            select: { memberId: true },
          });
          if (accountRaw) {
            const member = await this.memberQueryPort.findById(accountRaw.memberId);
            if (member) {
              memberName = `${member.name} ${member.surnames}`;
              memberNumber = member.memberNumber;
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Error obteniendo datos del cargo/socio para regenerar recibo: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 5. Generar el PDF
    const method = payment.paymentMethod;
    const receiptData: ReceiptData = {
      receiptNumber: payment.receiptNumber?.value ?? 'SIN-NUMERO',
      issueDate: new Date(),
      memberName,
      memberNumber,
      memberDni,
      chargeDescription,
      amount: payment.amount.amount,
      amountFormatted: `${payment.amount.toUnits().toFixed(2)} ${payment.amount.currency}`,
      paymentMethod: method.value,
      paymentMethodLabel: PaymentMethod.toLabel(method),
      paymentReference: payment.paymentReference.value,
      paymentDate: payment.paymentDate,
    };

    const pdfBuffer = await this.receiptGenerator.generateReceipt(receiptData);

    // 6. Almacenar para futuras peticiones
    try {
      if (payment.receiptNumber) {
        await paymentRepo.updateReceipt(query.paymentId, payment.receiptNumber.value, pdfBuffer);
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo almacenar el recibo regenerado: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return pdfBuffer;
  }
}
