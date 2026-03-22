import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTripDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
