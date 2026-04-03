import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from '../entities/receipt.entity';

@Injectable()
export class OcrExtractionService {
  private readonly logger = new Logger(OcrExtractionService.name);

  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async extractFromReceipt(receiptId: string): Promise<void> {
    // TODO: Integrate real OCR provider (Google Cloud Vision, AWS Textract, Azure Document Intelligence, etc.)
    // For now, this is a stub that marks the receipt as needing review
    this.logger.debug(
      `[STUB] OCR extraction triggered for receipt ${receiptId}`,
    );

    try {
      const receipt = await this.receiptRepository.findOne({
        where: { id: receiptId },
      });

      if (!receipt) {
        return;
      }

      // Set status to needs_review without making external API call
      // Real implementation would:
      // 1. Call OCR API with receipt.fileUrl
      // 2. Parse response (merchant, date, amount, line items, etc.)
      // 3. Store in rawOcrJson
      // 4. Set confidenceScore from API response
      // 5. Set extractionStatus to success/failed based on confidence

      // Stub behavior: mark as needs_review
      receipt.confidenceScore = 0;
      receipt.rawOcrJson = undefined;
      await this.receiptRepository.save(receipt);

      this.logger.debug(
        `OCR extraction stub completed for receipt ${receiptId} - marked as needs_review`,
      );
    } catch (error) {
      this.logger.error(
        `OCR extraction stub failed for receipt ${receiptId}`,
        error,
      );
    }
  }
}
