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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTripTaskDto } from './dto/create-trip-task.dto';
import { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import { ChecklistService } from './checklist.service';

@ApiTags('Checklist')
@ApiBearerAuth('access-token')
@Controller('trips/:tripId/tasks')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'List all tasks for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @Get()
  findAll(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.checklistService.findAll(tripId);
  }

  @ApiOperation({ summary: 'Create a task for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @Post()
  create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() createTripTaskDto: CreateTripTaskDto,
  ) {
    return this.checklistService.create(tripId, createTripTaskDto);
  }

  @ApiOperation({ summary: 'Update a task in a trip checklist' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @Patch(':id')
  update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripTaskDto: UpdateTripTaskDto,
  ) {
    return this.checklistService.update(tripId, id, updateTripTaskDto);
  }

  @ApiOperation({ summary: 'Delete a task from a trip checklist' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @Delete(':id')
  remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.checklistService.remove(tripId, id);
  }
}
