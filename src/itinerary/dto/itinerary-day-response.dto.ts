import { ApiProperty } from '@nestjs/swagger';
import { ItineraryItemResponseDto } from './itinerary-item-response.dto';

export class ItineraryDayResponseDto {
  @ApiProperty({
    description: 'Day ID',
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
    description: 'Date of the day in YYYY-MM-DD format',
    example: '2026-06-01',
  })
  date!: string;

  @ApiProperty({
    description:
      'Items for this day, ordered by start_time ASC then order_index ASC',
    type: () => ItineraryItemResponseDto,
    isArray: true,
  })
  items!: ItineraryItemResponseDto[];

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
