import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TripStatus, TripType } from '../enums/trip.enums';

export class CreateTripDto {
  @ApiProperty({
    description: 'Trip title',
    example: 'Japan Spring Adventure',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Primary destination',
    example: 'Tokyo, Japan',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    description: 'Trip start date (ISO date)',
    example: '2026-04-10',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Trip end date (ISO date)',
    example: '2026-04-18',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Trip type',
    enum: TripType,
    example: TripType.Leisure,
  })
  @IsEnum(TripType)
  tripType!: TripType;

  @ApiPropertyOptional({
    description: 'Trip lifecycle status',
    enum: TripStatus,
    example: TripStatus.Planning,
    default: TripStatus.Planning,
  })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
