import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

/** Datos necesarios para generar un recibo de pago. */
export interface ReceiptData {
  receiptNumber: string;
  issueDate: Date;
  memberName: string;
  memberNumber: string;
  memberDni: string;
  chargeDescription: string;
  amount: number; // centavos
  amountFormatted: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentReference: string;
  paymentDate: Date;
}

/** Token de inyección para el generador de recibos (NestJS DI). */
export const RECEIPT_GENERATOR = Symbol('RECEIPT_GENERATOR');

/**
 * Puerto para la generación de recibos PDF.
 * Permite desacoplar la implementación concreta (pdfkit) del dominio.
 */
export interface ReceiptGeneratorPort {
  generateReceipt(data: ReceiptData): Promise<Buffer>;
}

/**
 * Implementación del generador de recibos PDF usando pdfkit.
 * Genera un documento A4 con los datos del pago y del socio.
 * Para MVP: plantilla básica sin logo personalizable.
 */
@Injectable()
export class PdfReceiptGenerator implements ReceiptGeneratorPort {
  /**
   * Genera un recibo PDF con los datos del pago.
   * @param data Datos del recibo a generar.
   * @returns Buffer con el contenido del PDF.
   */
  async generateReceipt(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabecera
      doc.fontSize(18).text('RECIBO DE PAGO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`N\u00ba Recibo: ${data.receiptNumber}`);
      doc.text(
        `Fecha: ${data.issueDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`,
      );
      doc.moveDown();

      // Datos del socio
      doc.fontSize(14).text('Datos del socio');
      doc.fontSize(11);
      doc.text(`Nombre: ${data.memberName}`);
      doc.text(`N\u00ba Socio: ${data.memberNumber}`);
      doc.text(`DNI/NIF: ${data.memberDni}`);
      doc.moveDown();

      // Detalle del pago
      doc.fontSize(14).text('Detalle del pago');
      doc.fontSize(11);
      doc.text(`Concepto: ${data.chargeDescription}`);
      doc.text(`Importe: ${data.amountFormatted}`);
      doc.text(`M\u00e9todo: ${data.paymentMethodLabel}`);
      doc.text(`Referencia: ${data.paymentReference}`);
      doc.text(
        `Fecha de pago: ${data.paymentDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`,
      );

      doc.end();
    });
  }
}
