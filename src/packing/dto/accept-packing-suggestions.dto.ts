import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AcceptPackingSuggestionsDto {
  @ApiProperty({
    description:
      'List of suggestion keys to accept. Pass all keys from suggestions response to accept all.',
    example: ['Clothes::T-shirts', 'Documents::Passport'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  keys!: string[];
}
