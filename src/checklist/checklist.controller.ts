import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTripTaskDto } from './dto/create-trip-task.dto';
import { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import { ChecklistService } from './checklist.service';

@Controller('trips/:tripId/tasks')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get()
  findAll(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.checklistService.findAll(tripId);
  }

  @Post()
  create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() createTripTaskDto: CreateTripTaskDto,
  ) {
    return this.checklistService.create(tripId, createTripTaskDto);
  }

  @Patch(':id')
  update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripTaskDto: UpdateTripTaskDto,
  ) {
    return this.checklistService.update(tripId, id, updateTripTaskDto);
  }

  @Delete(':id')
  remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.checklistService.remove(tripId, id);
  }
}
