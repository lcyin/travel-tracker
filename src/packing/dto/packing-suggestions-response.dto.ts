import { ApiProperty } from '@nestjs/swagger';

export class PackingSuggestionItemDto {
  @ApiProperty({
    description:
      'Unique key identifying this suggestion (used for selective accept)',
    example: 'Clothes::T-shirts',
  })
  key!: string;

  @ApiProperty({
    description: 'Suggested item name',
    example: 'T-shirts',
  })
  name!: string;

  @ApiProperty({
    description: 'Item category',
    example: 'Clothes',
  })
  category!: string;

  @ApiProperty({
    description: 'Suggested quantity',
    example: 5,
  })
  quantity!: number;
}

export class PackingSuggestionsResponseDto {
  @ApiProperty({
    description: 'Suggested packing items grouped by category',
    example: {
      Clothes: [
        {
          key: 'Clothes::T-shirts',
          name: 'T-shirts',
          category: 'Clothes',
          quantity: 5,
        },
      ],
      Toiletries: [],
      Electronics: [],
      Documents: [],
      Misc: [],
    },
  })
  suggestions!: Record<string, PackingSuggestionItemDto[]>;

  @ApiProperty({
    description: 'Total number of suggested items',
    example: 12,
  })
  total!: number;
}
