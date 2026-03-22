import { PartialType } from '@nestjs/mapped-types';
import { CreateTripTaskDto } from './create-trip-task.dto';

export class UpdateTripTaskDto extends PartialType(CreateTripTaskDto) {}
