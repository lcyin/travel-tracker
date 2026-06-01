import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  ExpenseCategory,
  ExpenseSource,
  PaymentMethod,
} from '../enums/expense.enums';
import { SplitMode } from './set-expense-split.dto';

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

  @ApiPropertyOptional({
    description: 'ID of the trip participant who paid for this expense',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  paidByParticipantId?: string;

  @ApiPropertyOptional({
    description: 'How to split the cost among participants',
    enum: SplitMode,
    example: SplitMode.Equal,
  })
  @IsOptional()
  @IsEnum(SplitMode)
  splitMode?: SplitMode;

  @ApiPropertyOptional({
    description:
      'End date for multi-day expenses (e.g. hotel stay). ISO 8601 date.',
    example: '2026-11-05',
  })
  @IsOptional()
  @IsDateString()
  expenseEndDate?: string;
}
