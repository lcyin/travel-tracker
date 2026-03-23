import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class PackingFiltersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by category label',
    example: 'Documents',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by packed status',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  isPacked?: string;
}
