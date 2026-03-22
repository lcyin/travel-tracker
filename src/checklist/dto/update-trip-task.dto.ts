import { PartialType } from '@nestjs/swagger';
import { CreateTripTaskDto } from './create-trip-task.dto';

export class UpdateTripTaskDto extends PartialType(CreateTripTaskDto) {}
