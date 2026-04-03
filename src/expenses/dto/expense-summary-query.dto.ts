import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ExpenseCategory } from '../enums/expense.enums';

export class ExpenseSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter summary from this date (ISO 8601)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter summary until this date (ISO 8601)',
    example: '2026-04-30',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: ExpenseCategory,
    example: ExpenseCategory.Food,
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;
}
