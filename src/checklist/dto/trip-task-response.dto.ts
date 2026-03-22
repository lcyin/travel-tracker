import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TripTaskResponseDto {
  @ApiProperty({
    description: 'Task ID',
    format: 'uuid',
    example: 'fef42b8f-133f-4c0f-a7b7-183d44bbf63c',
  })
  id!: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Buy travel insurance',
  })
  title!: string;

  @ApiProperty({
    description: 'Completion status',
    example: false,
  })
  isCompleted!: boolean;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2026-03-30T10:00:00.000Z',
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Task priority',
    example: 1,
  })
  priority!: number;

  @ApiPropertyOptional({
    description: 'Task category',
    example: 'Logistics',
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Optional notes for the task',
    example: 'Check if passport is valid for at least 6 months',
  })
  notes?: string;

  @ApiProperty({
    description: 'Trip ID',
    format: 'uuid',
    example: '34ea6ea7-4a32-4832-8e0a-c10ba4f06673',
  })
  tripId!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-03-22T09:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-03-22T09:30:00.000Z',
  })
  updatedAt!: Date;
}
