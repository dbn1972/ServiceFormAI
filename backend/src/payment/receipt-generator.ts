import { Injectable, Logger } from '@nestjs/common';

/**
 * Receipt Generator — placeholder for Task 12.
 * Generates payment receipts in PDF format.
 */
@Injectable()
export class ReceiptGenerator {
  private readonly logger = new Logger(ReceiptGenerator.name);

  /**
   * Generate a receipt for a completed payment.
   * Full implementation in Task 12 (pdfkit-based PDF generation).
   */
  async generate(
    _paymentRecord: any,
    _serviceName: string,
    _tenantName: string,
    _consumerName: string,
    _sandboxMode: boolean,
  ): Promise<Buffer> {
    // Placeholder — Task 12 will implement full PDF generation
    this.logger.warn('Receipt generation not yet implemented (Task 12)');
    return Buffer.from('Receipt placeholder');
  }
}
