import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import {
  ItineraryItemStatus,
  ItineraryItemType,
} from '../enums/itinerary-item.enums';

export class CreateItineraryItemDto {
  @ApiProperty({
    description: 'Item type',
    enum: ItineraryItemType,
    example: ItineraryItemType.Sightseeing,
  })
  @IsEnum(ItineraryItemType)
  type!: ItineraryItemType;

  @ApiProperty({
    description: 'Item title',
    example: 'Visit Tokyo Tower',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'Buy tickets in advance',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Start time in HH:mm format',
    example: '09:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:mm format',
    example: '11:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Manual ordering index (tiebreaker after start_time)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Item status',
    enum: ItineraryItemStatus,
    default: ItineraryItemStatus.Planned,
    example: ItineraryItemStatus.Planned,
  })
  @IsOptional()
  @IsEnum(ItineraryItemStatus)
  status?: ItineraryItemStatus;
}
