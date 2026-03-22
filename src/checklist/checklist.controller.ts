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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { CreateTripTaskDto } from './dto/create-trip-task.dto';
import { TripTaskResponseDto } from './dto/trip-task-response.dto';
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
  @ApiOkResponse({ type: TripTaskResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<TripTaskResponseDto[]> {
    return this.checklistService.findAll(tripId);
  }

  @ApiOperation({ summary: 'Create a task for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiCreatedResponse({ type: TripTaskResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Post()
  create(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() createTripTaskDto: CreateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    return this.checklistService.create(tripId, createTripTaskDto);
  }

  @ApiOperation({ summary: 'Update a task in a trip checklist' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @ApiOkResponse({ type: TripTaskResponseDto })
  @ApiNotFoundResponse({ description: 'Trip task not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Patch(':id')
  update(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripTaskDto: UpdateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    return this.checklistService.update(tripId, id, updateTripTaskDto);
  }

  @ApiOperation({ summary: 'Delete a task from a trip checklist' })
  @ApiParam({ name: 'tripId', description: 'Trip ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiNotFoundResponse({ description: 'Trip task not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Delete(':id')
  remove(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteResponseDto> {
    return this.checklistService.remove(tripId, id);
  }
}
