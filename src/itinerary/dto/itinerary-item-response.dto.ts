import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ItineraryItemStatus,
  ItineraryItemType,
} from '../enums/itinerary-item.enums';

export class ItineraryItemResponseDto {
  @ApiProperty({
    description: 'Item ID',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Itinerary day ID',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  dayId!: string;

  @ApiProperty({
    description: 'Item type',
    enum: ItineraryItemType,
    example: ItineraryItemType.Sightseeing,
  })
  type!: ItineraryItemType;

  @ApiProperty({
    description: 'Item title',
    example: 'Visit Tokyo Tower',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'Buy tickets in advance',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Start time in HH:mm format',
    example: '09:30',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:mm format',
    example: '11:00',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Manual ordering index (used as tiebreaker after start_time)',
    example: 1,
  })
  orderIndex?: number;

  @ApiProperty({
    description: 'Item status',
    enum: ItineraryItemStatus,
    example: ItineraryItemStatus.Planned,
  })
  status!: ItineraryItemStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-03-25T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2026-03-25T10:00:00.000Z',
  })
  updatedAt!: Date;
}
