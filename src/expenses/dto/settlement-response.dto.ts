import { ApiProperty } from '@nestjs/swagger';
import { ParticipantResponseDto } from './participant-response.dto';

export class ParticipantBalanceDto {
  @ApiProperty({ type: () => ParticipantResponseDto })
  participant!: ParticipantResponseDto;

  @ApiProperty({
    description: 'Total amount paid by this participant (in base currency)',
    example: 250.0,
  })
  paid!: number;

  @ApiProperty({
    description: 'Total share owed by this participant (in base currency)',
    example: 180.0,
  })
  share!: number;

  @ApiProperty({
    description:
      'Net balance: paid − share. Positive = owed money back, negative = owes money',
    example: 70.0,
  })
  net!: number;
}

export class SettlementPaymentDto {
  @ApiProperty({
    type: () => ParticipantResponseDto,
    description: 'Who should pay',
  })
  from!: ParticipantResponseDto;

  @ApiProperty({
    type: () => ParticipantResponseDto,
    description: 'Who should receive',
  })
  to!: ParticipantResponseDto;

  @ApiProperty({
    description: 'Amount to transfer (in base currency)',
    example: 70.0,
  })
  amount!: number;
}

export class SettlementResponseDto {
  @ApiProperty({
    description: 'Per-participant balance summary',
    type: [ParticipantBalanceDto],
  })
  balances!: ParticipantBalanceDto[];

  @ApiProperty({
    description: 'Minimal list of payments to settle all debts',
    type: [SettlementPaymentDto],
  })
  payments!: SettlementPaymentDto[];

  @ApiProperty({
    description: 'Base currency used for all amounts',
    example: 'NZD',
  })
  currency!: string;
}
