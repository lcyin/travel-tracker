import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Indicates whether the resource was deleted',
    example: true,
  })
  deleted!: boolean;

  @ApiProperty({
    description: 'Deleted resource identifier',
    format: 'uuid',
    example: '1f8002e3-8f52-43f7-9c8d-e3a2603c1348',
  })
  id!: string;
}
