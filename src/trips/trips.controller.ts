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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripsService } from './trips.service';

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @ApiOperation({ summary: 'List current user trips' })
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.tripsService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip ID (UUID)' })
  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripsService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'Create a new trip' })
  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createTripDto: CreateTripDto,
  ) {
    return this.tripsService.create(user.sub, createTripDto);
  }

  @ApiOperation({ summary: 'Update an existing trip' })
  @ApiParam({ name: 'id', description: 'Trip ID (UUID)' })
  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, user.sub, updateTripDto);
  }

  @ApiOperation({ summary: 'Delete a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID (UUID)' })
  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripsService.remove(id, user.sub);
  }
}
