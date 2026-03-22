import { ApiProperty } from '@nestjs/swagger';
import { TripResponseDto } from './trip-response.dto';

export class TripsGroupedResponseDto {
  @ApiProperty({
    description: 'Trips that are upcoming or currently active',
    type: TripResponseDto,
    isArray: true,
  })
  upcoming!: TripResponseDto[];

  @ApiProperty({
    description: 'Trips that are already finished',
    type: TripResponseDto,
    isArray: true,
  })
  past!: TripResponseDto[];
}
