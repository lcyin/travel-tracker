import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ExpenseCategory,
  ExtractionStatus,
  PaymentMethod,
} from '../enums/expense.enums';

export class ExpenseFiltersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.Food,
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
    example: PaymentMethod.Cash,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Filter expenses from this date (ISO 8601)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter expenses until this date (ISO 8601)',
    example: '2026-04-30',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by currency code',
    example: 'JPY',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Filter by OCR extraction status',
    enum: ExtractionStatus,
    example: ExtractionStatus.NeedsReview,
  })
  @IsOptional()
  @IsEnum(ExtractionStatus)
  extractionStatus?: ExtractionStatus;
}
