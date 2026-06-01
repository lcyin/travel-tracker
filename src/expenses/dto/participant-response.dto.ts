import { ApiProperty } from '@nestjs/swagger';

export class ParticipantResponseDto {
  @ApiProperty({
    description: 'Participant ID',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Trip ID this participant belongs to',
    format: 'uuid',
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  })
  tripId!: string;

  @ApiProperty({
    description: 'Display name of the participant',
    example: 'Alice',
  })
  name!: string;

  @ApiProperty({
    description: 'Participant arrival date',
    example: '2026-11-01',
  })
  stayStart!: string;

  @ApiProperty({
    description: 'Participant departure date',
    example: '2026-11-10',
  })
  stayEnd!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-06-01T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-06-01T10:00:00.000Z',
  })
  updatedAt!: Date;
}
