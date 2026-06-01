import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsUUID } from 'class-validator';

export enum SplitMode {
  Equal = 'equal',
  ByStayDays = 'by_stay_days',
}

export class SetExpenseSplitDto {
  @ApiProperty({
    description: 'ID of the participant who paid for this expense',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  paidByParticipantId!: string;

  @ApiProperty({
    description:
      'How to split the cost: equal share or proportional to stay days',
    enum: SplitMode,
    example: SplitMode.Equal,
  })
  @IsEnum(SplitMode)
  splitMode!: SplitMode;

  @ApiProperty({
    description: 'IDs of participants who share this expense',
    type: [String],
    format: 'uuid',
    example: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  includedParticipantIds!: string[];
}
