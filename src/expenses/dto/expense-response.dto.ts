import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExpenseCategory,
  PaymentMethod,
  ExtractionStatus,
  ExpenseSource,
} from '../enums/expense.enums';
import { ParticipantResponseDto } from './participant-response.dto';
import { SplitMode } from './set-expense-split.dto';

export class ReceiptResponseDto {
  @ApiProperty({
    description: 'Receipt ID',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Expense ID',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  expenseId!: string;

  @ApiProperty({
    description: 'Path to uploaded receipt file',
    example: '/uploads/receipts/a1b2c3d4-e5f6-7890-abcd.jpg',
  })
  fileUrl!: string;

  @ApiPropertyOptional({
    description: 'Path to thumbnail image',
    example: '/uploads/receipts/a1b2c3d4-e5f6-7890-abcd-thumb.jpg',
  })
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'MIME type of uploaded file',
    example: 'image/jpeg',
  })
  mimeType!: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 245000,
  })
  fileSize?: number;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2026-04-03T10:00:00.000Z',
  })
  uploadedAt!: Date;

  @ApiPropertyOptional({
    description: 'Raw OCR extraction result as JSON',
  })
  rawOcrJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'OCR confidence score (0-1)',
    example: 0.95,
  })
  confidenceScore?: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-04-03T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-04-03T10:00:00.000Z',
  })
  updatedAt!: Date;
}

export class ExpenseResponseDto {
  @ApiProperty({
    description: 'Expense ID',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  id!: string;

  @ApiProperty({
    description: 'Trip ID',
    format: 'uuid',
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  })
  tripId!: string;

  @ApiProperty({
    description: 'When the expense occurred',
    example: '2026-04-02T14:30:00.000Z',
  })
  occurredAt!: Date;

  @ApiPropertyOptional({
    description: 'Merchant/vendor name',
    example: 'Tokyo Tower',
  })
  merchantName?: string;

  @ApiProperty({
    description: 'Amount in original currency',
    example: 3500,
  })
  amount!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'JPY',
  })
  currency!: string;

  @ApiPropertyOptional({
    description: 'Converted to base currency',
    example: 25.5,
  })
  baseAmount?: number;

  @ApiPropertyOptional({
    description: 'Base currency code',
    example: 'USD',
  })
  baseCurrency?: string;

  @ApiPropertyOptional({
    description: 'Exchange rate used for conversion',
    example: 137.255,
  })
  exchangeRate?: number;

  @ApiPropertyOptional({
    description: 'Source of the exchange rate (e.g. "ecb")',
    example: 'ecb',
  })
  exchangeRateSource?: string;

  @ApiPropertyOptional({
    description: 'When the exchange rate was fetched',
    example: '2026-04-02T10:00:00.000Z',
  })
  exchangeRateAt?: Date;

  @ApiProperty({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.Food,
  })
  category!: ExpenseCategory;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.Cash,
  })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'Lunch with team',
  })
  notes?: string;

  @ApiProperty({
    description: 'Expense source (manual entry, OCR, quick add, draft)',
    enum: ExpenseSource,
    example: ExpenseSource.Manual,
  })
  source!: ExpenseSource;

  @ApiProperty({
    description: 'OCR extraction status',
    enum: ExtractionStatus,
    example: ExtractionStatus.None,
  })
  extractionStatus!: ExtractionStatus;

  @ApiPropertyOptional({
    description: 'Associated receipt file (if any)',
    type: () => ReceiptResponseDto,
  })
  receipt?: ReceiptResponseDto;

  @ApiPropertyOptional({
    description: 'Participant who paid for this expense',
    type: () => ParticipantResponseDto,
  })
  paidByParticipant?: ParticipantResponseDto;

  @ApiPropertyOptional({
    description: 'How the cost is split among participants',
    enum: SplitMode,
  })
  splitMode?: SplitMode;

  @ApiPropertyOptional({
    description: 'End date for multi-day expenses',
    example: '2026-11-05',
  })
  expenseEndDate?: string;

  @ApiPropertyOptional({
    description: 'Participants sharing this expense',
    type: [ParticipantResponseDto],
  })
  includedParticipants?: ParticipantResponseDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-04-03T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-04-03T10:00:00.000Z',
  })
  updatedAt!: Date;
}
