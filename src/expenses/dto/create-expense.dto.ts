import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import {
  ExpenseCategory,
  ExpenseSource,
  PaymentMethod,
} from '../enums/expense.enums';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Date/time when the expense occurred',
    example: '2026-04-02T14:30:00.000Z',
  })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional({
    description: 'Merchant or vendor name',
    example: 'Tokyo Tower',
  })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiProperty({
    description: 'Amount in the original currency',
    example: 3500,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'JPY',
  })
  @IsISO4217CurrencyCode()
  currency!: string;

  @ApiProperty({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.Food,
  })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.Cash,
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Lunch with team',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Source of the expense entry',
    enum: ExpenseSource,
    example: ExpenseSource.Manual,
  })
  @IsOptional()
  @IsEnum(ExpenseSource)
  source?: ExpenseSource;
}
