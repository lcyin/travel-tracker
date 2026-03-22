import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripClimate, TripStatus, TripType } from '../enums/trip.enums';

export class TripResponseDto {
  @ApiProperty({
    description: 'Trip ID',
    format: 'uuid',
    example: '34ea6ea7-4a32-4832-8e0a-c10ba4f06673',
  })
  id!: string;

  @ApiProperty({
    description: 'Trip title',
    example: 'Japan Spring Adventure',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Trip destination',
    example: 'Tokyo, Japan',
  })
  destination?: string;

  @ApiPropertyOptional({
    description: 'Start date',
    example: '2026-04-10',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2026-04-18',
  })
  endDate?: string;

  @ApiProperty({
    description: 'Trip type',
    enum: TripType,
    example: TripType.Leisure,
  })
  tripType!: TripType;

  @ApiProperty({
    description: 'Trip lifecycle status',
    enum: TripStatus,
    example: TripStatus.Planning,
  })
  status!: TripStatus;

  @ApiPropertyOptional({
    description: 'Expected climate at destination',
    enum: TripClimate,
    example: TripClimate.Warm,
  })
  climate?: TripClimate;

  @ApiProperty({
    description: 'Owner user ID',
    format: 'uuid',
    example: 'a9b07db3-becf-4f7c-b627-2d56f68ca2dc',
  })
  userId!: string;

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
