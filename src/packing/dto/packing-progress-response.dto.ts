import { ApiProperty } from '@nestjs/swagger';

export class PackingProgressResponseDto {
  @ApiProperty({
    description: 'Number of packed items',
    example: 8,
  })
  packed!: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 20,
  })
  total!: number;

  @ApiProperty({
    description: 'Packed percentage (0-100)',
    example: 40,
  })
  percentage!: number;
}
