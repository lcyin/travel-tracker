import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

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
}
