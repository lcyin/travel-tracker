import { ApiProperty } from '@nestjs/swagger';
import { TripTaskResponseDto } from './trip-task-response.dto';

export class ChecklistGroupedResponseDto {
  @ApiProperty({
    description: 'Pending (incomplete) tasks sorted by due date',
    type: TripTaskResponseDto,
    isArray: true,
  })
  pending!: TripTaskResponseDto[];

  @ApiProperty({
    description: 'Done (completed) tasks sorted by due date',
    type: TripTaskResponseDto,
    isArray: true,
  })
  done!: TripTaskResponseDto[];
}
