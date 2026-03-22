import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePackingItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isPacked?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  category?: string;
}
