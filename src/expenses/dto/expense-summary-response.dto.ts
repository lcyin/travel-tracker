import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpenseCategoryBreakdownDto {
  @ApiProperty({
    description: 'Category name',
    example: 'food',
  })
  category!: string;

  @ApiProperty({
    description: 'Total spent in this category',
    example: 1200,
  })
  amount!: number;

  @ApiProperty({
    description: 'Percentage of total spend',
    example: 34,
  })
  percentage!: number;

  @ApiProperty({
    description: 'Number of transactions in category',
    example: 8,
  })
  count!: number;
}

export class ExpenseMerchantBreakdownDto {
  @ApiProperty({
    description: 'Merchant name',
    example: 'Starbucks',
  })
  merchantName!: string;

  @ApiProperty({
    description: 'Total spent at merchant',
    example: 45.5,
  })
  amount!: number;

  @ApiProperty({
    description: 'Number of transactions at merchant',
    example: 3,
  })
  count!: number;
}

export class DailyTrendDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2026-04-02',
  })
  date!: string;

  @ApiProperty({
    description: 'Amount spent on this date',
    example: 250.75,
  })
  amount!: number;
}

export class ExpenseSummaryResponseDto {
  @ApiProperty({
    description: 'Total amount spent across all expenses',
    example: 3500,
  })
  totalSpent!: number;

  @ApiProperty({
    description: 'Base currency used for totals',
    example: 'USD',
  })
  baseCurrency!: string;

  @ApiProperty({
    description: 'Total number of transactions',
    example: 15,
  })
  transactionCount!: number;

  @ApiProperty({
    description: 'Average spending per day',
    example: 350,
  })
  averagePerDay!: number;

  @ApiProperty({
    description: 'Breakdown of spending by category',
    type: () => ExpenseCategoryBreakdownDto,
    isArray: true,
  })
  byCategory!: ExpenseCategoryBreakdownDto[];

  @ApiProperty({
    description: 'Top merchants by spend',
    type: () => ExpenseMerchantBreakdownDto,
    isArray: true,
  })
  byMerchant!: ExpenseMerchantBreakdownDto[];

  @ApiProperty({
    description: 'Daily spending trend',
    type: () => DailyTrendDto,
    isArray: true,
  })
  dailyTrend!: DailyTrendDto[];

  @ApiProperty({
    description: 'Number of OCR-scanned expenses needing manual review',
    example: 2,
  })
  needsReviewCount!: number;
}
