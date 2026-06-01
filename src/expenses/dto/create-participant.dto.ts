import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength, Validate } from 'class-validator';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'stayEndAfterStart', async: false })
class StayEndAfterStartConstraint implements ValidatorConstraintInterface {
  validate(stayEnd: string, args: ValidationArguments): boolean {
    const obj = args.object as CreateParticipantDto;
    if (!obj.stayStart || !stayEnd) return true;
    return stayEnd > obj.stayStart;
  }

  defaultMessage(): string {
    return 'stayEnd must be after stayStart';
  }
}

export class CreateParticipantDto {
  @ApiProperty({
    description: 'Display name of the participant',
    example: 'Alice',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Participant arrival date (ISO 8601 date)',
    example: '2026-11-01',
  })
  @IsDateString()
  stayStart!: string;

  @ApiProperty({
    description: 'Participant departure date (ISO 8601 date)',
    example: '2026-11-10',
  })
  @IsDateString()
  @Validate(StayEndAfterStartConstraint)
  stayEnd!: string;
}
