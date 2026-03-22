import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePackingItemDto {
  @ApiProperty({
    description: 'Packing item name',
    example: 'Passport',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Whether item has been packed',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPacked?: boolean;

  @ApiPropertyOptional({
    description: 'Number of units needed',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Optional category label',
    example: 'documents',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
