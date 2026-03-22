import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTripTaskDto {
  @ApiProperty({
    description: 'Checklist task title',
    example: 'Book JR Pass',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Task completion status',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'Task due date as ISO string',
    example: '2026-04-01T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Task priority from 0 (low) upward',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
