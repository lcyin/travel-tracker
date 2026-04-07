import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetResponseDto } from './budget-response.dto';
import { ExpenseSummaryResponseDto } from './expense-summary-response.dto';

export class ExpenseDashboardResponseDto {
  @ApiProperty({
    description: 'Aggregated expense analytics for the trip',
    type: () => ExpenseSummaryResponseDto,
  })
  summary!: ExpenseSummaryResponseDto;

  @ApiPropertyOptional({
    description: 'Budget and spending limits, null if no budget set',
    type: () => BudgetResponseDto,
    nullable: true,
  })
  budget!: BudgetResponseDto | null;
}
