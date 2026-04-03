import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetResponseDto {
  @ApiProperty({
    description: 'Budget ID',
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
    description: 'Base currency for the budget',
    example: 'USD',
  })
  baseCurrency!: string;

  @ApiProperty({
    description: 'Total budget amount',
    example: 5000,
  })
  totalAmount!: number;

  @ApiPropertyOptional({
    description: 'Per-category spending limits as JSON',
    example: { food: 1000, transport: 500, accommodation: 2000 },
  })
  categoryLimits?: Record<string, number>;

  @ApiProperty({
    description: 'Warning threshold as percentage of budget (0-100)',
    example: 80,
  })
  warningThreshold!: number;

  @ApiProperty({
    description: 'Total amount spent so far (computed)',
    example: 3500,
  })
  spent!: number;

  @ApiProperty({
    description: 'Remaining budget (totalAmount - spent)',
    example: 1500,
  })
  remaining!: number;

  @ApiProperty({
    description: 'Percentage of budget used (0-100)',
    example: 70,
  })
  percentageUsed!: number;

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
