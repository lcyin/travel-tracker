import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Currency for the budget',
    example: 'USD',
  })
  @IsISO4217CurrencyCode()
  baseCurrency!: string;

  @ApiProperty({
    description: 'Total budget amount',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @ApiPropertyOptional({
    description: 'Optional per-category spending limits',
    example: { food: 1000, transport: 500, accommodation: 2000 },
  })
  @IsOptional()
  categoryLimits?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Warning threshold as percentage (default 80)',
    example: 80,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  warningThreshold?: number;
}
