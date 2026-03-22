import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripResponseDto } from './trip-response.dto';

export class TaskProgressDto {
  @ApiProperty({
    description: 'Number of completed tasks',
    example: 3,
  })
  completed!: number;

  @ApiProperty({
    description: 'Total number of tasks',
    example: 8,
  })
  total!: number;

  @ApiProperty({
    description: 'Completion percentage (0-100)',
    example: 37,
  })
  percentage!: number;

  @ApiProperty({
    description: 'Number of overdue tasks (dueDate < today and not completed)',
    example: 2,
  })
  overdueCount!: number;
}

export class NextPendingTaskDto {
  @ApiProperty({
    description: 'Task ID',
    format: 'uuid',
    example: '12345678-1234-1234-1234-123456789abc',
  })
  id!: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Book hotels',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2026-04-05',
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Task priority level',
    example: 1,
  })
  priority!: number;
}

export class QuickLinksDto {
  @ApiProperty({
    description: 'Link to trip checklist endpoint',
    example: '/trips/34ea6ea7-4a32-4832-8e0a-c10ba4f06673/tasks',
  })
  checklist!: string;

  @ApiProperty({
    description: 'Link to trip packing endpoint',
    example: '/trips/34ea6ea7-4a32-4832-8e0a-c10ba4f06673/packing',
  })
  packing!: string;

  @ApiProperty({
    description: 'Link to trip itinerary endpoint',
    example: '/trips/34ea6ea7-4a32-4832-8e0a-c10ba4f06673/itinerary',
  })
  itinerary!: string;

  @ApiProperty({
    description: 'Link to trip documents endpoint',
    example: '/trips/34ea6ea7-4a32-4832-8e0a-c10ba4f06673/documents',
  })
  documents!: string;
}

export class TripDashboardResponseDto {
  @ApiProperty({
    description: 'Trip summary',
    type: TripResponseDto,
  })
  trip!: TripResponseDto;

  @ApiProperty({
    description: 'Pre-trip task progress',
    type: TaskProgressDto,
  })
  progress!: TaskProgressDto;

  @ApiPropertyOptional({
    description: 'Next pending task (if any)',
    type: NextPendingTaskDto,
  })
  nextPendingTask?: NextPendingTaskDto;

  @ApiProperty({
    description: 'Quick links to trip resources',
    type: QuickLinksDto,
  })
  quickLinks!: QuickLinksDto;
}
