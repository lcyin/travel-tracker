import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PackingItemResponseDto {
  @ApiProperty({
    description: 'Packing item ID',
    format: 'uuid',
    example: '5fb3737f-100d-4df4-8498-e56f6690beaf',
  })
  id!: string;

  @ApiProperty({
    description: 'Packing item name',
    example: 'Passport',
  })
  name!: string;

  @ApiProperty({
    description: 'Packed status',
    example: true,
  })
  isPacked!: boolean;

  @ApiProperty({
    description: 'Quantity required',
    example: 1,
  })
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Category',
    example: 'documents',
  })
  category?: string;

  @ApiProperty({
    description: 'Trip ID',
    format: 'uuid',
    example: '34ea6ea7-4a32-4832-8e0a-c10ba4f06673',
  })
  tripId!: string;

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
